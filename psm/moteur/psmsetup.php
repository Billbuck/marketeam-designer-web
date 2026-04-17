<?php

//
// deep clone helper (php clone only does shallow)
//
class PSMDeepClonable {
  public function deepClone() {
    return unserialize(serialize($this)); 
  }
}

//
// Portset, defines the parameters for a set of ports
//
class PSMPortSet extends PSMDeepClonable {

  private $ports = array();
  private $minThreadCount = 1;
  private $maxThreadIdleSeconds = 30;
  private $workDistributionPolicy;

  public static $POLICY_RANDOM = 0;
  public static $POLICY_WORKLOAD = 1;
  public static $POLICY_WORKLOAD_SYNC = 2;
  
  // ports:                       Array of ports for this set (defined the maximum concurrent threads for this set)
  // minThreadCount:              Minimum no. worker threads to keep 'up'
  // maxThreadIdleSeconds:        Max seconds a worker thread must be idle before eligable for shutdown
  // workDistributionPolicy:      Policy for workload distribution
  //
  // Policy RANDOM:               Random distribution
  //                              - Does not require state or monitor services
  //                              - Can cause denied requests under high workload (due to socket backlog saturation)
  //  
  // Policy WORKLOAD:             Distribution to worker thread with least requests (up prevails over down)
  //                              - Requires state service (auto-started by requests)
  //                              - This is the recommended setting to use
  //
  // Policy POLICY_WORKLOAD_SYNC: Distribution to worker thread with least requests (up prevails over down),
  //                              - Requires state and monitor services 
  //                              - Queues proxy requests through monitor service 
  //
  public function __construct($minThreadCount, $maxThreadIdleSeconds, $workDistributionPolicy, $ports) {
  
    if (count($ports) < $minThreadCount) {
      throw new Exception("PSMPortSet construct error, minThreadCount > number of ports.");
    } 

    if ($maxThreadIdleSeconds < 1) {
      throw new Exception("PSMPortSet construct error, maxThreadIdleSeconds must be >0.");
    } 

    $this->workDistributionPolicy = $workDistributionPolicy; 

    if (!$this->isPolicyRandom() && !$this->isPolicyWorkload() && !$this->isPolicyMonitor()) {
      throw new Exception("PSMPortSet construct error, workload distributionpolicy must be 'POLICY_RANDOM' or 'POLICY_WORKLOAD' or 'POLICY_WORKLOAD_SYNC'");
    }

    $this->ports = $ports;
    $this->minThreadCount = $minThreadCount;
    $this->maxThreadIdleSeconds = $maxThreadIdleSeconds;
    $this->workDistributionPolicy = $workDistributionPolicy; 
  }

  public function getPorts()                { return $this->ports; }
  public function getMinThreadCount()       { return $this->minThreadCount; }
  public function getMaxThreadIdleSeconds() { return $this->maxThreadIdleSeconds; }
  
  public function isPolicyRandom()          { return PSMPortSet::$POLICY_RANDOM === $this->workDistributionPolicy; }
  public function isPolicyWorkload()        { return PSMPortSet::$POLICY_WORKLOAD === $this->workDistributionPolicy; }
  public function isPolicyMonitor()         { return PSMPortSet::$POLICY_WORKLOAD_SYNC === $this->workDistributionPolicy; }
}

class PSMConfig extends PSMDeepClonable {

  function __construct($httpPort, $sdkPath, $portStateService = 0, $portMonitorService = 0) {
    $this->serverPort = $httpPort;
    $this->sdkPath = $sdkPath;
    if ($portStateService > 0)
      $this->portStateService = $portStateService;
    else
		  throw new Exception("ERROR: Can't enableStateService(portStateService), parameter error, port must be >0.");
      
    if ($this->portStateService < 0)
      throw new Exception("ERROR: Can't enableMonitorService() without stateService being enabled.");
  
    if ($portMonitorService > 0)
      $this->portMonitorService = $portMonitorService;
    else
		  throw new Exception("ERROR: Can't enableMonitorService($portMonitorService), parameter error, port must be >0.");
  }

  // 
  // Add a set of ports to be used for PSM threads. The ID can be used to distinguish between fast and slow job sets.
  //
  public function addPortSet($idString, $PSMPortSetObject) {
    $this->portSets["$idString"] = $PSMPortSetObject;
    
    if ($PSMPortSetObject->isPolicyRandom())
      return;

    // Note: the actual fallbacks are performed by the policies themselves, the config data is remain unchanged here
    //       (fallback by policies allows them to cope with state service denials)      
    if ($PSMPortSetObject->isPolicyWorkload() && $this->portStateService <= 0)
      error_log("WARNING: portSet has POLICY_WORKLOAD for set '$idString', but stateService not enabled. Policy will fallback to RANDOM.");
    
    $total = 0;  
    foreach ($this->portSets as $set)
      $total += count($set->getPorts());
      
    if ($total > 6)
      throw new Exception("ERROR: Total ports > 6, maximum of 6 concurrent COM instances supported by PSM backend");
  }

  //
  // Getters required by monitorservice and convinient for creating control/monitoring UI
  //
  public function getPortSets()           { return $this->portSets; }
  public function getPortStateService()   { return $this->portStateService; }
  public function getPortMonitorService() { return $this->portMonitorService; }

  public function getPortSet($ID) { 
    $set = $this->portSets["$ID"];
    if (!isset($set)) {
      // doWork runs from constructor and can cause exceptions not to have stackframe or info
      error_log("ERROR: undefined PortSet '$ID'");
      throw new Exception("ERROR: undefined PortSet '$ID'");
    }
    return $set;
  }

  //
  // Get human readable description of service by port
  //  
  public function getPortDescription($port) {
    if ($port == $this->getPortStateService()) { return "PSMStateService"; }
    if ($port == $this->getPortMonitorService()) { return "PSMMonitorService"; }
    return "PSMThread";
  }

  //
  // Enable debug log, caution: $enableDebug = true causes very high volume of log messages
  //
  public function setLog($enable = true, $enableDebug = false) { $this->log = $enable; $this->logDebug = $enableDebug;}
  public function getLog()        { return $this->log;  }
  public function getLogDebug()   { return $this->logDebug;  }
  public function getPort()       { return $this->serverPort; }
  public function getSdkPath()       { return $this->sdkPath; }
  public function getAuthorisation() { return $this->authorisation; }
  public function getProfile() { return $this->logProfile; }
  
  //
  // Set credentials for basic HTTP authorisation
  //
  public function setUser($user, $pass) {
	$this->authorisation = base64_encode("$user:$pass");
  }

  //
  // Enable profile logs to the error loh
  //
  public function setProfile($enable) {
    $this->logProfile = $enable;
  }

  //
  // Enable automated up/down cycle 
  //
  public function setRestartInterval($intervalInSeconds) {
    $this->autoRestartTime = $intervalInSeconds; 
  } 
  public function getRestartInterval() {
    return $this->autoRestartTime;
  } 
  
  //
  // Ports for monitoring and state services.
  // Must be enabled/disabled in pair (both be enabled or both be disabled)
  // A value of 0 disables the service. 
  //
  private $portStateService;
  private $portMonitorService;
  
  //
  // Portset, to allocate a number of ports to PSMThreads for purpose (preview/print)
  //
  private $portSets = array();

  private $serverPort = 80;
  private $sdkpath = "http://localhost/";
  private $authorisation = "";
  private $log = false;
  private $logDebug = false;
  private $logProfile = false;
  private $autoRestartTime = 0;
}

//
// Usefull for logging from global functions (or anything not derived from PSMObject)
//
function error_log_debug($msg) {
  global $psmconfig;
  if (!isset($psmconfig))
    error_log("ERROR: psmdebug not set durring error_log_debug:".$msg);
  else if ($psmconfig->getLogDebug())
    error_log($msg);
}

?>