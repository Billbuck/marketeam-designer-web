<?php
/**
 * PSM State Service - Gestion de l'état des services PSM
 * 
 * VERSION CORRIGÉE PHP 8 - 30 décembre 2025
 * Corrections :
 * - Ligne 214 : Vérification des indices de tableau avant accès
 * - Ligne 261 : $this->states["$port"] → isset() avant accès
 */

include_once("psmconfiguration.php");
include_once("psmremote.php");
include_once("psmmonitor.php");

function _createProxy_PSMStateService($port, $pipe, $progress = null, $preferKey = "") {
    return new PSMStateServiceProxy($port, $pipe, $progress, $preferKey);
}


/**
 * Returns the state service, creates it by default (if enabled in config) if not yet up         
 */
function PSM_getStateService($create = false) {
    global $psmconfig;
    $PSM_STATESERVICE_PORT = $psmconfig->getPortStateService();
    if ($PSM_STATESERVICE_PORT <= 0) {
        return null;
    }
    $proxy = psm_proxy_remote($PSM_STATESERVICE_PORT, null/*progress*/, ""/*preferkey*/, '_createProxy_PSMStateService');
    if ($proxy != null || !$create) {
        return $proxy;
    }
    psm_launch_service($PSM_STATESERVICE_PORT, "PSMStateService");
    return psm_proxy_remote($PSM_STATESERVICE_PORT, null/*progress*/, ""/*preferkey*/, '_createProxy_PSMStateService');
}

/**
 * State object, for both internal and client use. Unmarshall from state string using PSM_parseState 
 */
class PSMObjectState {
    protected $port = 0;
    protected $type = "?";
    protected $state = "DOWN";
    protected $startTime = 0;
    protected $lastRequest = "?";
    protected $lastActivity = 0;
    protected $requestsPending = 0;
    protected $requestsPeak = 0;
    protected $requestsHandled = 0;
    protected $preferKey = "-";

    function __construct($port, $type, $state, $startTime, $lastActivity, $lastRequest, $requestsPending, $requestsPeak, $requestsHandled, $preferKey) {
        $this->port = $port;
        $this->type = $type;
        $this->state = $state;
        $this->startTime = $startTime;
        $this->lastActivity = $lastActivity;
        $this->lastRequest = $lastRequest;
        $this->requestsPending = $requestsPending;
        $this->requestsPeak = $requestsPeak;
        $this->requestsHandled = $requestsHandled;
        $this->preferKey = $preferKey;
    }
  
    public function getPort()               { return $this->port; }
    public function getType()               { return $this->type; }
    public function getState()              { return $this->state; }
    public function getStartTime()          { return $this->startTime; }
    public function getLastRequest()        { return $this->lastRequest; }
    public function getLastActivity()       { return $this->lastActivity; }
    public function getRequestsPending()    { return $this->requestsPending; }
    public function getRequestsPeak()       { return $this->requestsPeak; }
    public function getRequestsHandled()    { return $this->requestsHandled; }
    public function getPreferKey()          { return $this->preferKey; }

    // convinience functions
    public function getUpTime()             { return strcmp($this->state, "DOWN") == 0 ? 0 : time() - $this->startTime; }
    public function getIdleTime()           { return time() - $this->lastActivity; }

    public function isUp() {
        return (strcmp($this->getState(), "UP") == 0 ||
                strcmp($this->getState(), "BUSY") == 0 ||
                strcmp($this->getState(), "BOOT") == 0);
    }
    
    public function isDown() { return !$this->isUp(); }
  
    public function isBooting() {
        return strcmp($this->getState(), "BOOT") == 0;
    }
    
    public function isQuitting() {
        return strcmp($this->getState(), "QUIT") == 0;
    }
  
    // convinience function to allow iteration over fields to fill tables
    public function getDisplayFields() {
        return array(
            $this->port, 
            $this->type, 
            $this->state, 
            $this->formatTimeSpan($this->getUpTime()), 
            $this->formatTimeSpan($this->getIdleTime()), 
            $this->lastRequest, 
            $this->requestsPending, 
            $this->requestsPeak, 
            $this->requestsHandled,
            $this->preferKey
        );
    }
    
    public static function getDisplayTitles() {
        return array("Port", "Type", "State", "Up time", "Idle time", "Last request", "Pending", "Peak", "Handled", "PreferKey");
    }

    private function formatTimeSpan($time) {
        $seconds = $time;
        $minutes = ($seconds - ($seconds % 60)) / 60;
        $hours = ($minutes - ($minutes % 60)) / 60;
        $days = ($hours - ($hours % 24)) / 24;
        
        $seconds %= 60;
        $minutes %= 60;
        $hours %= 24;
        
        return $days . "D " . $hours . "H " . $minutes . "M " . $seconds . "S ";
    }
}

/**
 * For internal use by the service
 */
class PSMState extends PSMObjectState {

    function __construct() {
        parent::__construct(0, "?", "DOWN", 0, time(), "?", 0, 0, 0, "-");
    }

    public function registerBoot($info) {
        $this->state = "BOOT";
        $this->lastRequest = "Starting service...";
        $this->type = $info;
        $this->startTime = time();
        $this->lastActivity = $this->startTime;
    }

    public function registerQuit() {
        $this->state = "QUIT";
        $this->lastRequest = "Shutting down service...";
        $this->lastActivity = $this->startTime;
    }

    public function registerStart() {
        $this->state = "UP";
        $this->lastRequest = "Started...";
        $this->lastActivity = $this->startTime;
    }

    public function registerStop() {
        $this->lastRequest = "Stopped...";
        $this->state = "DOWN";
    }

    // internal use by stateserver, bump handled without using start/stop request overhead
    public function bumpHandled() {
        $this->requestsHandled++;
        $this->requestsPeak = 1; // cant determine without disproportionate overhead, just report 1
    }

    public function registerStartRequest($info, $preferKey = "-") {
        $this->state = "BUSY";
        $this->preferKey = $preferKey;
        
        // Bit of a hack: filter monitorService::getPortForWork, just update the counter so 
        // the state of the last managment run can be seen.
        // A more proper solution would be to have a service onStart and onPreQuit which
        // monitorService implementation would disable/reenable state tracking. 
        if (strstr($info, "getPortForWork") === false) {
            $this->lastRequest = $info;
        }
            
        $this->requestsPending++;
        if ($this->requestsPending > $this->requestsPeak) {
            $this->requestsPeak = $this->requestsPending;
        }
        $this->lastActivity = time(); 
    }

    public function registerStopRequest() {
        $this->state = "UP";
        if ($this->requestsPending > 0) {
            $this->requestsPending--;
        }
        // aborted requests are still deducted, this causes idle time to be reset for psmshowstate if we would update it here    
        // $this->lastActivity = time();
        $this->requestsHandled++; 
    }

    public function getRecord() {  // FIXME: escape (and unescape during unmarshall) to support ~ and ^ in values
        return $this->type . "~" .
               $this->state . "~" .
               $this->startTime . "~" .
               $this->lastActivity . "~" .
               $this->lastRequest . "~" .
               $this->requestsPending . "~" .
               $this->requestsPeak . "~" .
               $this->requestsHandled . "~" .
               $this->preferKey;           
    }
}

interface PSMSateServiceInterface {
    function registerBootService($port, $name);
    function registerStartService($port);
    function registerQuitService($port);
    function registerStopService($port);
    function registerStartRequest($port, $info, $preferKey = "-");
    function registerStopRequest($port);
    function getState($arrayPorts);
}

/**
 * State service has special proxy, it suppresses state update calls to 'self', and has custom marshalling for 1 function
 */
class PSMStateServiceProxy extends PSMRemote /*implements PSMSateServiceInterface*/ {

    /**
     * getState Returns array of PSMObjectState, this has custom marshalling do dont let autoproxy through __call
     */
    public function getState($arrayPorts) {
        $a = func_get_args();
        return $this->parseState($this->remoteInvoke(__METHOD__, $a));
    }

    /**
     * Unmarshalls state records from string 
     * @param string $report Result of StateService::getState(...)
     * @return array Array of PSMObjectState
     */
    private function parseState($report) {
        $result = array();
        
        if (empty($report)) {
            return $result;
        }
        
        $records = explode("^", $report);
        foreach ($records as $record) {
            $fields = explode("~", $record);
            
            // CORRECTION PHP 8 : Vérifier que tous les indices existent avant d'y accéder
            if (count($fields) >= 10) {
                $result[$fields[0]] = new PSMObjectState(
                    $fields[0],
                    $fields[1],
                    $fields[2],
                    $fields[3],
                    $fields[4],
                    $fields[5],
                    $fields[6],
                    $fields[7],
                    $fields[8],
                    $fields[9]
                );
            }
        }
        return $result;    
    }
}

/**
 * State tracking service
 * Note: may only contain fast functions
 */
class PSMStateService extends PSMService implements PSMSateServiceInterface {

    private $states = array();
  
    // Dont use proxy / rpc on self to register things (that would be silly and eat performance)
    // Proxies to stateservice automatically filter out requests by portnumber
    private function selfState() {
        return $this->stateFromPort($this->port);    
    }

    function __construct($port, $socket) {
        parent::__construct($port, $socket);
        $this->selfState()->registerBoot(__CLASS__);
        $this->selfState()->registerStart();
    }
  
    function destructor() {
        parent::destructor();
        // do after parent destructor, as thats the running service
        $this->selfState()->registerQuit($this->port);
        $this->selfState()->registerStop($this->port);
    }
  
    /**
     * CORRECTION PHP 8 : Utiliser isset() avant d'accéder à la clé du tableau
     */
    private function stateFromPort($port) {
        $key = "$port";
        if (!isset($this->states[$key])) {
            $this->states[$key] = new PSMState($port);
        }
        return $this->states[$key]; 
    }
  
    public function registerStartRequest($port, $info, $preferKey = "-") {
        $this->stateFromPort($port)->registerStartRequest($info, $preferKey);
    }
    
    public function registerStopRequest($port) {
        $this->stateFromPort($port)->registerStopRequest();
    }
    
    public function registerBootService($port, $type) {
        $this->stateFromPort($port)->registerBoot($type);
    }
    
    public function registerStartService($port) {
        $this->stateFromPort($port)->registerStart();
    }
    
    public function registerQuitService($port) {
        $this->stateFromPort($port)->registerQuit();
    }
    
    public function registerStopService($port) {
        $this->stateFromPort($port)->registerStop();
    }

    /**
     * Get state
     */
    public function getState($arrayPorts) {
        $result = "";
        foreach ($arrayPorts as $index => $port) {
            if ($port != 0) {
                $record = $port . "~" . $this->stateFromPort($port)->getRecord(); 
                $result = $result . $record;
                if ($index < count($arrayPorts) - 1) {
                    $result = $result . "^";
                }
            }
        }
        $this->selfState()->bumpHandled();
        return $result;
    }
}

?>