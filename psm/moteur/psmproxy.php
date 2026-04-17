<?php
/**
 * PSM Proxy - Distribution de charge et proxy vers les threads
 * VERSION CORRIGÉE POUR PHP 8
 */

include_once("psmconfiguration.php");
include_once("psminterface.php");
include_once("psmremote.php");                           
include_once("psmthread.php");

//
// Launch a PSM thread for availability within the current request
//
function PSM_launch($port) {
  psm_launch_service($port);
}

//
// Stop the service thread on the specified port 
//
function PSM_terminate($port) {
  psm_stop_service($port);
}


//
// Get a proxy to a PSM thread
//
function PSM_get($portSetID, $progress, $preferKey ="") {
  // Policies are guaranteed to come back with a port, they will use fallback waterfall if required services are unavailable
  return PSM_proxyFromPort(psm_workload_distribution_policy_factory($portSetID)->getPortForWork($preferKey), $progress, $preferKey, true);
}

// creator to pass to psm_proxy_remote
function _createProxy_PSMThread($port, $pipe, $progress, $preferKey) {
  return new PSMProxy($port, $pipe, $progress, $preferKey);
}

//
// Obtain a proxy to a PSM service at the specified port, returns null if service at port is not running.
// This is lower level than PSM_get(...) for client use of PSM_get(...) is recommended.
//
function PSM_proxyFromPort($port, $progress, $preferKey, $create=false) {
  global $psmconfig;
  // CORRIGÉ: Ajout de guillemets autour du nom de fonction
  $proxy = psm_proxy_remote($port, $progress, $preferKey, '_createProxy_PSMThread');

  // Success
  if ($proxy != null) 
    return $proxy;
    
  // Fail without create
  if ($proxy == null) {
    if (!$create) {
      $msg = "WARNING: could not create proxyfromport, service is likely down. Createflag was false so not attempting start.";
      error_log_debug($msg);
      throw new Exception($msg);
    }
  }
  
  // Fail, try create  
  if ($psmconfig->getLogDebug()) 
    error_log_debug("PSM_proxyFromPort Proxy could not connect, attempting service launch.");
    
  $retriesLeft = 10;
  $proxy = null;
  while ($retriesLeft > 0) {
  
    // Creation only allowed if monitor service and state service are up if they are configured for use.
    // Without this check, incomming requests would revive services without operator having control over it
    // (only way to restart services then would be to stop HTTP server completely, possible downing the entire site)
    // To allow reboot of services without failing requires, retry over a period of time in case of failure 
    $prerequisitesRetries = 10; // give time to reboot services before stating server is down
    $prerequisitesRetriesDone = 0;
    $stateOK = $psmconfig->getPortStateService() < 1;
    $monitorOK = $psmconfig->getPortMonitorService() < 1;
    $stateService = null;
    $monitorService = null;
    
    while ( (!$stateOK || !$monitorOK) && $prerequisitesRetries > 0) {
    
      if ($psmconfig->getLogDebug()) {
        $stateMsg = $stateOK ? "OK" : "DOWN";  
        $monitorMsg = $monitorOK ? "OK" : "DOWN";  
        error_log_debug("PSM_proxyFromPort wait server up (state=$stateMsg, monitor=$monitorMsg) retry $prerequisitesRetriesDone");
      }
      $prerequisitesRetriesDone++;
      if (!$stateOK) { 
        $stateService = PSM_getStateService();
        // Remove service proxies from destination que to ensure launching service PSMThread below can use them (launch is synchrone)
        // also, keeping a reference here would block the state service during the sleep below to other clients.
        if ($stateService != null) 
          $stateService->close();
        $stateOK = $stateService != null;
      }
      if (!$monitorOK) {
        $monitorService = PSM_getMonitorService();
        // Remove service proxies from destination que to ensure launching service PSMThread below can use them (launch is synchrone)
        // also, keeping a reference here would block the monitor service during the sleep below to other clients.
        if ($monitorService != null) 
          $monitorService->close();
        $monitorOK = $stateService != null;
      }
      $prerequisitesRetries--;
      if (!$stateOK || !$monitorOK)  {
        if ($prerequisitesRetries > 0)
          sleep(5); // note: make sure in the code above that no service proxies are held during sleep
        else {
          $msg = "WARNING: service is down (required state and/or monitor service is/are enabled but not running)";
          error_log_debug($msg); 
          throw new Exception($msg);
        }
      }
    }
     
    // Known race condition location, hence the outer retry: 
    //  -> stale information on availability of state and monitor services
    
    psm_launch_service($port, "PSMThread"); // synchronized launch through GET        
    // CORRIGÉ: Ajout de guillemets autour du nom de fonction
    $proxy = psm_proxy_remote($port, $progress, $preferKey, '_createProxy_PSMThread');
    if ($proxy != null)
      break;
      
    // Known race condition location, hence the outer retry: 
    //  ->launch/proxy bind can temporarily fail during (BOOT/QUIT collisions)
      
    error_log("WARNING: PSM_proxyFromPort Retry during obtain proxy to psm thread (retries left $retriesLeft)");
    sleep(3); // dont overload everything, a quit/boot collision can take a few seconds to resolve
    $retriesLeft--;
  } 
  if ($proxy == null) {
    $msg = "ERROR: PSM_proxyFromPort Failure to launch PSM (possibly COM error) or bind proxy (possibly backlog saturation).";
    error_log($msg);
    throw new Exception($msg);
  }
  return $proxy;
}

//
// Proxy to service in other thread. See PSMInterface for function docmentation
//
// Below: can be ommited and neatly proxied automatically by __call, but note this disables auto-complete in development environment editors

class PSMProxy extends PSMRemote /*implements PSMInterface*/ {

//        if wanting autocomplete to work uncomment these functions and the implements PSMInterface above.
/*
	public function PDFPreview($document,$data,$from,$to)                          { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
	public function PDFOutput($document,$data,$from,$to)                           { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
	public function PDFOutputToFile($document,$data,$from,$to,$file)               { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
	public function PrintDocument($document,$data,$from,$to,$printer)              { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
	public function PrintToFile($document,$data,$from,$to,$printer,$file)          { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
	public function JPEGPreview($document,$data,$layout)                           { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
	public function JPEGPreviewJSON($document,$data,$layout)                       { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }	
  public function JPEGPreviewAllLayouts($document,$data,$layoutcount,$user_id=1) { $a = func_get_args(); return $this->remoteInvoke(__method__, $a); }
*/
}


//
// Private interface for work distribution policies
//
interface PSMWorkDistributionPolicy {
  function getPortForWork($preferKey);
}

//
// Factory for workload distribution policies
//
function psm_workload_distribution_policy_factory($portSetID) {
  global $psmconfig;
  $portSetInstance = $psmconfig->getPortSet($portSetID);
  
  if ($portSetInstance->isPolicyWorkload()) {
//    error_log("WORKLOAD policy selected");
    return new PSMWorkDistributionPolicyWorkloadRequest($portSetID);
  } else if ($portSetInstance->isPolicyMonitor()) { 
//    error_log("WORKLOAD_SYNC policy selected");
    return new PSMWorkDistributionPolicyWorkloadMonitor($portSetID);
  }
  return new PSMWorkDistributionPolicyShuffle($portSetID);
}

//
// Simple base to allow ID only constructor
//
class PSMWorkDistributionPolicyBase extends PSMObject {
  protected $portSetID = null;
  protected $portSetInstance = null;
  
  function __construct($portSetID) {
    parent::__construct("");
    global $psmconfig;
    $this->portSetID = $portSetID;
    $this->portSetInstance = $psmconfig->getPortSet($portSetID);
  }
}

//
// Random distribution 
//
class PSMWorkDistributionPolicyShuffle extends PSMWorkDistributionPolicyBase implements PSMWorkDistributionPolicy {

  protected $ports = null; 

  function __construct($portSetID) {
    parent::__construct($portSetID);
    $this->id = uniqid("RANDOM policy - $portSetID");
    $this->ports = $this->portSetInstance->getPorts();
  }

  function getPortForWork($preferKey) {
    // $preferKey is ignored, can't determine key at remote objects without state-service
    shuffle($this->ports);
    $this->log("selected port ".$this->ports[0]." for work");
    return $this->ports[0]; 
  }
}


//
// Workload distribution, backend for 'REQUEST' and 'MONITOR' policies 
//
class PSMWorkDistributionPolicyWorkload extends PSMWorkDistributionPolicyBase implements PSMWorkDistributionPolicy {

  private $states = null;
  
  function __construct($portSetID, $objectStates) {
    parent::__construct($portSetID);
    $this->id = uniqid("WORKLOAD policy(base) - set='$portSetID' ");
    $this->states = $objectStates;
  }

  function getPortForWork($preferKey) {
    // gracefull fallback if stateservice not available
    if ($this->states == null) {
      $this->log("fallback to random policy, state service is inaccessible.");
      $fallback = new PSMWorkDistributionPolicyShuffle($this->portSetID);
      return $fallback->getPortForWork($preferKey);
    }
  
    // Get lowest request count, we need it to score the states
    $minReqCountState = $this->getStateWithLowestRequestCount($this->states);

    // Get the hiscore
    $highScore = -99999999; // dont use 0, hiscore can be negative
    $scores = array();
    $states = array();
    foreach ($this->states as $state) {
      $score = $this->getScore($preferKey, $state, $minReqCountState->getRequestsPending()); 
      $highScore = $highScore < $score ? $score : $highScore;      
      $scores[count($scores)] = $score;
      $states[count($states)] = $state;
    }
      
    // Get eligable destinations               
    $bestStates = array();
    foreach ($scores as $index => $score) {
      if ($score == $highScore)
        $bestStates[count($bestStates)] = $states[$index];
    }    

    if (count($bestStates) == 0)
      error_log("No best state found");

    // Distribute over eligable destinations
    $index = rand(0, count($bestStates)-1);
    $selectedState = $bestStates[$index];

    if ($selectedState == null)
      error_log("best state null, $index statecount=".count($this->states));
    
    $this->log("selected port ".$selectedState->getPort()." for work");
    
    return $selectedState->getPort();
  }  

  //
  // Find state with lowest request count
  //
  private function getStateWithLowestRequestCount($states) {
    $lowest = null;
    foreach ($states as $state) {
      if ($lowest == null)
        $lowest = $state;
      else if ($lowest->getRequestsPending() < $state->getRequestsPending())
        $lowest = $state;
    }
    return $lowest;
  }
  
  //
  // get a state's score (higher is better)
  //
  private function getScore($preferKey, $state, $lowestRequestCount) {
    $score = 0;
    // CORRIGÉ: Initialiser $priorityPreferKey
    $priorityPreferKey = 0;
    
    // assumption: a waiting thread is faster then a busy thread, even if the busy one might have the document open already
    if ($state->getRequestsPending() <= $lowestRequestCount)
      $score+= ($lowestRequestCount - $state->getRequestsPending()) * 1;     
    
    if ($state->isUp() && !$state->isBooting())
      $score += 1; 
      
    // match to preferKey parts, * separated, from left to right, stop matching if found difference.
    // this is to support "$document*$datafile*layoutnumber" to be used as key. 
    $preferParts = explode("*", $preferKey);
    $statePrefer = explode("*", $state->getPreferKey());
    $statePreferCount = count($statePrefer);
    $statePreferIndex = 0;
    foreach ($preferParts as $partKey) {
      if ($statePreferIndex > $statePreferCount)
        break;
      if (strcmp($partKey, $statePrefer[$statePreferIndex])==0)
        // assume that 3 queued requests on same document are faster to process then
        // opening new thread for request 2 and 3
        $priorityPreferKey += 3;
      else
        break;
      $statePreferIndex++;
    }
    $score += $priorityPreferKey;
    
    // Chose to open a new thread if needed(and possible) if this has a different document open
    // that was recently used. This prevents a ABA reguest order from having B reuse the
    // booted (1st a) instance, causing 2nd A having to reopen.
    if ($state->getIdleTime() < 120 && $priorityPreferKey == 0) {
      $score--;
    } 
    
    //error_log($state->getPort()." scored ".$score."current template:".$state->getPreferKey());
    return $score;
  }
} 
  
//
// Workload policy, decision in current request
//
class PSMWorkDistributionPolicyWorkloadRequest extends PSMWorkDistributionPolicyWorkload {

  function __construct($portSetID) {
    global $psmconfig;
    $this->id = uniqid("WORKLOAD policy - $portSetID");
    $states = null;
    
    // Base will do fallback if states is null
    if (($stateService = PSM_getStateService()) != null) {
      $states = $stateService->getState($psmconfig->getPortSet($portSetID)->getPorts());
    }
      
    parent::__construct($portSetID, $states);
  }
}

//
// Workload policy, diverted to monitor service
// 
class PSMWorkDistributionPolicyWorkloadMonitor extends PSMWorkDistributionPolicyBase implements PSMWorkDistributionPolicy {

  function __construct($portSetID) {
    parent::__construct($portSetID);
    $this->id = uniqid("MONITOR policy - $portSetID");
  }
    
  function getPortForWork($preferKey) {
    $monitorService = PSM_getMonitorService(false);
   
    // Gracefull fallback if monitor service not available
    if ($monitorService == null) {
      $this->log("fallback to async in-request workload policy, monitor service is not accessible.");
      $fallback = new PSMWorkDistributionPolicyWorkloadRequest($this->portSetID);
      return $fallback->getPortForWork($preferKey);    
    }
    $port = $monitorService->getPortForWork($this->portSetID, $preferKey);
    $this->log("selected port ".$port." for work");
    return $port;
  }  
}

?>