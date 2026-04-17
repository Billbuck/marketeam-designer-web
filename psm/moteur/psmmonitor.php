<?php

/*
    Monitor service, controls the other services
    
    START: Ensures proper state by stopping all services, the boots configured services and starts minThreads per portSet
    UP:    Culls idle threads, extends service sessions every 3 hours using shutdown/revive
    STOP:  Performs services shutdown in proper order
    
    VERSION CORRIGÉE POUR PHP 8 - BUG REVIVE FIXÉ
*/

include_once("psmconfiguration.php");
include_once("psmremote.php");
include_once("psmproxy.php");

//
// Returns the monitor service         
//
function PSM_getMonitorService($create=false) {
  global $psmconfig;
  $PSM_MONITOR_PORT = $psmconfig->getPortMonitorService();
  if ($PSM_MONITOR_PORT <= 0) {
    return null;
  }
  $proxy = psm_proxy_remote($PSM_MONITOR_PORT);
  if ($proxy != null || !$create) {
    return $proxy;
  }

  if (!$create)
    return null;

  if ($psmconfig->getLog())
    error_log('Monitor service is down, booting...');
    
  psm_launch_service($PSM_MONITOR_PORT);
  return psm_proxy_remote($PSM_MONITOR_PORT);
}

//
// MonitorService, for monitor and manage all other services.
// Can be used for synchronized workload distribution.
//
class PSMMonitorService extends PSMService {

  private $revive = false; // set to true to extend operation beyond timeout limits imposed outside of php (apache)
  
  // Number of doWorks before auto-revive, doWork is each 30 seconds so reviveCountdown/2 = number of minutes between revives
  private $reviveCountdown = 360;   // 3 hours between revives, 8x a day

  private $killed = 0;
  private $booted = 0; 

  function destructor() {
    // CORRIGÉ: Faire le revive AVANT de fermer les connexions
    // L'ancien code appelait parent::destructor() en premier, ce qui fermait
    // les connexions et libérait les ressources COM, puis tentait de faire
    // un appel HTTP -> ACCESS_VIOLATION (0xC0000005)
    if ($this->revive) {
      $this->audit("Extending, reviving $this->port");
      // Lancer le nouveau service AVANT de détruire les ressources
      psm_launch_service($this->port);
    }
    // Maintenant on peut fermer les connexions en toute sécurité
    parent::destructor();
  }

  //
  // Called when service boots (BOOT state, before UP)
  //
  function onBoot() {
    global $psmconfig;
    $this->log("Monitor onboot");
    $this->shutDownConfiguration();
    
    $this->doWorkIntervalSeconds = 30;
    $this->reviveCountdown = $psmconfig->getRestartInterval() / 30; 
    
    // Start state service
	  $this->log("Launch state service from MONITOR");
    PSM_launch($psmconfig->getPortStateService());
	  $this->log("Launch state service from MONITOR - done");

    // notify of this boot was before state service up, so enforce update
    
    // Register type
    if (($stateService = PSM_getStateService()) != null)
      $stateService->registerBootService($this->port, __class__);
    
    // Register started
    if (($stateService = PSM_getStateService()) != null)
      $stateService->registerStartService($this->port);

    $portsets = $psmconfig->getPortSets();
    $this->log("Monitor boot worksets:".count($portsets));
  }

  //
  // Called when service quits (QUIT state, before DOWN)
  //
  function onQuit() {
    global $psmconfig;
    $this->log("Monitor onquit");
    $this->shutDownConfiguration();

    // Delay to allow processes to stop, they might be in requests that take a few seconds
    // they might cause harmless but annoying error reports if they register their quit
    // while stateserver is going down.  
    sleep(5);

    // Prevent state service revival    
    $this->enableStateTracking(false);
    
    // Stop state service
    PSM_stop_service($psmconfig->getPortStateService());
    
    // We should now be totally shut-down      
  }

  //
  // Stop all services to ensure stateserver reflects proper state again for all threads
  //
  function shutDownConfiguration() {
    global $psmconfig;
    foreach ($psmconfig->getPortSets() as $id => $portSet) {
      foreach ($portSet->getPorts() as $port)
        PSM_stop_service($port);      
    }
  }

  //
  // Called by base at nonBlockingInterval
  //
  function doWork() {
    global $psmconfig;

    if ($psmconfig->getRestartInterval() > 0) {    
      // Special case to auto-rebooot all services once in a while to prevent end-process by apache which overrides php settimeout(0)
      if ( (!$this->quit) && ($this->reviveCountdown-- <= 0) ) {
        $this->audit("Extending, quitting");
        $this->revive = true; 
        $this->quit(); // order self to stop
        return;
      }
    }
    if ($this->revive)
      return;
    
    try {
      $this->killed = 0;
      $this->booted = 0;
  
      // Use state service for feedback    
      $this->startRequest("Managing services... ".date("Y-M-d G:i:s"));
  
      $sets = $psmconfig->getPortSets();
      $this->log("Monitor count worksets:".count($sets));
  
      foreach ($sets as $id => $portSet) {
        $this->log("Working portset ".$id);
        $this->workPortSet($portSet);
      }
  
      // Update status
      $this->startRequest("Started:".$this->booted." Stopped:".$this->killed." at ".date("Y-M-d G:i:s"));
    } catch (Exception $e) {
      error_log("doWork exception message=".$e->getMessage());
    }
    
    // Harmless decrements should exception occur, better then leaving counters too high
    $this->stopRequest();
    $this->stopRequest();
  }
  
  //
  // Check if threads to kill within the given portset
  //
  private function workPortSet($portSet) {
    global $psmconfig;
    
    // Retrieve portSet state
    if (($stateService = PSM_getStateService()) == null)
      return;
      
    $portStates = $stateService->getState($portSet->getPorts());

    // Count active    
    $active = 0;
    foreach ($portStates as $port => $state)
      if ($state->isUp())
        $active++;        

    $this->log("Monitor service detected $active PSMThreads for portset, min threadcount is ".$portSet->getMinThreadCount());

    // Determine start/stops
    $killCount = $active - $portSet->getMinThreadCount();
    $bootCount = $portSet->getMinThreadCount() - $active;
    
    // Exectute start/stops    
    if ($killCount > 0) {
      $this->killThreads($portSet->getMaxThreadIdleSeconds(), $portStates, $killCount);
    } else if ($bootCount > 0) {
      $this->bootThreads($portStates, $bootCount);
    }
  }

  //
  // Start $count threads from the given $portStates
  // 
  private function bootThreads($portStates, $count) {
    $this->log("Seeking thread available for boot...");
    foreach ($portStates as $port => $state) {
      if ($state->isDown()) {
        psm_launch_service($port);
        $this->booted++;
        $count--;
        if ($count <= 0)
          return;
      }
    }
  }

  //
  // Kill $count threads from the given $portStates that are at least $idleTime idle 
  //  
  private function killThreads($idleTime, $portStates, $count) {
    global $psmconfig;
    $this->log("Killing threads...");
    
    foreach ($portStates as $port => $state) {
      $idle = $state->getIdleTime();
      if ($state->isUp() && $state->getIdleTime() > $idleTime) {
        $this->log("port ".$port." idle for $idle, terminating thread");
        PSM_terminate($port);
        
        $this->killed++;
        $count--;
        if ($count <= 0)
          return; 
      }
    }
  }

  //
  // Can be used for synchronized distribution policy (is just a deffered REQUEST policy)
  //  
  function getPortForWork($portSetID, $preferKey) {
    $policy = new PSMWorkDistributionPolicyWorkloadRequest($portSetID);
    return $policy->getPortForWork($preferKey);
  }    
}


?>