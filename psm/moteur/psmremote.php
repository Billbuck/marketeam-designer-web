<?php
/**
 * PSM Remote - Communication inter-processus
 * VERSION CORRIGÉE POUR PHP 8
 */

include_once("psmconfiguration.php");
include_once("psmstate.php");
include_once("psmmarshal.php");

//
// Base to allow informative logging and work around 2 php issues:
// 1. No stackframe information for exceptions occuring in destructors ran after end-of-script.
// 2. Global $psmconfig no longer available in destructor ran after end-of-scrip. 
//
// Both are important as we do work in destructors for special purposses 
// (thread processing loop to start after script ends and GC runs).
//
abstract class PSMObject {

  protected $id = "unknown";
  protected $psmconfigClone = null;

  public function __construct($prefix) {
    global $psmconfig;
    $this->id = uniqid($prefix.get_class($this)."-");
    if (!isset($psmconfig))
      throw new Exception("Global \$psmconfig' is not set.");
    $this->psmconfigClone = $psmconfig->deepClone();
    $this->log("Construct");
  }

  //
  // Safe destructor ensuring stackframe in any errors and psmconfig still available.
  // In derived classes do not override __destruct but override destructor()
  //
  // CORRIGÉ: Enlevé "final" car non supporté pour les méthodes publiques en PHP 8
  //
  public function __destruct() {
    // Re-instate psmconfig
    global $psmconfig;
    $psmconfig = $this->psmconfigClone->deepClone();
  
    // Nasty: exceptions thrown from destructors do not get info or stackframe in PHP
    // for most source this isn't a big issue, but the service threading mechanism runs the entire thread from the destructor.
    // Since we want proper error reports and not "fatal-error-exception-thrown-without-a-stack-frame-in-unknown-on-line-0"
    // wrap destruction with try-catch and manually report the error. 
    try {
      $this->destructor();
    } catch (Exception $e) {
      // Log unconditionally
      error_log("$this->id: SEVERE ERROR, cought destructor exception: ".$e->getMessage()."\nStack trace:".$e->getTraceAsString());
    } catch (Error $e) {
      // CORRIGÉ: Attraper aussi les Error PHP 8
      error_log("$this->id: SEVERE ERROR, cought destructor error: ".$e->getMessage()."\nStack trace:".$e->getTraceAsString());
    }
    $this->log("Destructed");
  }

  protected function destructor() {}

  //
  // Log (debug messages, high frequency)
  //
  public function log($logit) {
    $this->checkedLog($logit, true);
  }

  //
  // Audit (registration message, low frequency)
  //
  public function audit($logit) {
    $this->checkedLog($logit, false);
  }
  
  //
  // Logging calls are abundant, so good place to verify $psmconfig is still set.
  // CORRIGÉ: Enlevé "final" car non supporté pour les méthodes privées en PHP 8
  //
  private function checkedLog($logit, $debug) {
    global $psmconfig;
    if (!isset($psmconfig))
      error_log("ERROR: PSMCONFIG IS NOT SET DURING log/audit -> $this->id: $logit"); 
    else {
      if ($debug && !$psmconfig->getLogDebug())
        return; // skip debug message
         
      if ($psmconfig->getLog())
        error_log("$this->id: $logit");
    } 
  }
}

//
// Start a service, note that won't be useable until current request ends.
// If needing it in the current request, use psm_launch_service(...) 
//
function psm_start_service($port, $createServiceInstanceFunction) {
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    socket_bind($socket, "localhost");

    if (@socket_connect($socket, "localhost", $port)) {
        @socket_close($socket);
        return null; // already up
    }
    
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    if (!@socket_bind($socket, "localhost", $port)) {
        return null; // race/collision, this means that the next proxy request will simply pick up the one that beat this start to it
    }
    return $createServiceInstanceFunction($port, $socket);
}

//
// Launch a service object for use within the current request
//
function psm_launch_service($port) {
  $retry = 0;
  // check if already up
  while ($retry++ <= 4 && (null == psm_proxy_remote($port))) {
    if ($retry > 1)
      sleep(2);
    global $psmconfig;
    $fp = fsockopen("127.0.0.1", $psmconfig->getPort(), $errno, $errstr, 30);
    if (!$fp) {
      // severe error, log unconditionally 
      error_log("ERROR: psm_launch_service '$errstr'");
    } else {
      $out = "GET ".$psmconfig->getSdkPath()."psmcontrol.php?port=$port&cmd=start HTTP/1.1\r\n";
      $out .= "Host: 127.0.0.1\r\n";
      
      // Basic HTTP authorisation
      $base64credentials = $psmconfig->getAuthorisation();
      if (strlen($base64credentials) > 0) {
        $base64credentials = $psmconfig->getAuthorisation();
        $out .= "Authorization: Basic $base64credentials\r\n";
      }
      
      $out .= "Connection: Close\r\n\r\n";
      error_log_debug("psm_launch_service $out");
      fwrite($fp, $out);
      error_log_debug("psm_launch_service get request sent... awaiting response");
      $result = fgets($fp, 256);
      if (stristr($result, "200"/*OK*/) === false) {
        error_log("ERROR: Failure to start service, server response below:");
        do {
          error_log($result);
        } while ($result = fgets($fp, 256));
        return;
      }
      fclose($fp);
      error_log_debug("psm_launch_service GET returned: '$result' for retries left $retry");
    }
  }
}

//
// Proxy a remote object
//
function psm_proxy_remote($port, $progress = null, $preferKey = "", $proxyCreateFunction = null) {
    global $psmconfig;
    $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    socket_bind($socket, "localhost");
    if (@socket_connect($socket, "localhost", $port)) {
        if ($proxyCreateFunction != null)
            $proxy = $proxyCreateFunction($port, $socket, $progress, $preferKey);
        else
            $proxy = new PSMRemote($port, $socket, $progress, $preferKey);
        return $proxy;
    }
    return null;
}

//
// Stop the service at the specified port.
// $port:         Port of service to stop
// $shutdown:     If true prevents revival of stateService (suppress service stop state restration)
//                'true' is only intended for stateService shutdown implementation.
//                For normal/client use, this parameter should be false.
//
function psm_stop_service($port, $shutdown = false) {
  error_log_debug("psm_stop_service($port)");
  $proxy = psm_proxy_remote($port);
  if ($proxy) {
    error_log_debug("psm_stop_service($port) - got proxy, invoking quit");
    $proxy->quit($shutdown);
    error_log_debug("psm_stop_service($port) - quit returned");
  } else {
    error_log_debug("psm_stop_service($port) - no action, no proxy was returned.");
  } 
}

//
// Common base for both proxy(client) and service(server)
//
class PSMRemotingBase extends PSMObject {

    protected $socket = null;
    protected $port = 0;
    private $closed = false;
    private $trackState = true;
  
    public function __construct($port, $socket) {
        // CORRIGÉ: Ne pas inclure $socket dans le préfixe car Socket ne peut pas être converti en string
        parent::__construct($port."-");
        $this->port = $port;
        $this->socket = $socket;
    }

    protected function destructor() {
        $this->close();
        parent::destructor();
    }
  
    public function close() {
        if ($this->closed)
            return;
        @socket_close($this->socket);
        $this->closed = true;
    }

    public function getPort() {
        return $this->port;
    }

    //
    // Return R/W socket, will return client connection in derived service  
    //  
    protected function getIOSocket() {
        return $this->socket;
    }
  
    protected function read() {
        $socket = $this->getIOSocket();            
        // CORRIGÉ: Ne pas inclure $socket dans le log
        $this->log("read start");  
        $result = @socket_read($socket, 8192, PHP_NORMAL_READ);
        $length = strlen($result);
        
        // Clip packet end '\n'
        if ($length > 0) {
            $last = substr($result, $length-1, 1);
            if (strcmp($last, "\n") == 0)
                $result = substr($result, 0, $length-1); 
        } 
        // CORRIGÉ: Ne pas inclure $socket dans le log
        $this->log("read end received:'$result'");
        return $result;  
    }
  
    protected function write($data) {     
        $socket = $this->getIOSocket();            
        // CORRIGÉ: Ne pas inclure $socket dans le log
        $this->log("write start");  
        $result = @socket_write($socket == null ? $this->socket : $socket, $data);
        // CORRIGÉ: Ne pas inclure $socket dans le log
        $this->log("write end");
        return $result;  
    }
  
    //
    // Control state tracking reports to state service,
    // used to prevent recursion by state service itself
    // and during shutdown.
    //
    protected function enableStateTracking($enable) {
        $this->trackState = $enable; 
        $this->log("state tracking calls: ".($this->trackState ? "On" : "Off"));   
    }
  
    protected function getStateService() {
        global $psmconfig;
        if (!$this->trackState || $this->port == $psmconfig->getPortStateService())
            return null;
        return PSM_getStateService(); 
    }
  
    protected function startRequest($stateText, $preferKey="") {
        if (($stateService = $this->getStateService()) != null)
            $stateService->registerStartRequest($this->port, $stateText, $preferKey);
    }
  
    protected function stopRequest() {
        if (($stateService = $this->getStateService()) != null)
            $stateService->registerStopRequest($this->port);
    }
}

// Retry exception to indicate fail during request due to connection lost.
// When a quit is issued to a service, backlog requests after it give connection lost.
// (just processing the queue doesnt suffice, as under heavy load would then
//  prevent quit as the queue keeps getting filled)
class PSMRetryException extends Exception {}


//
// Base for proxy class to a remote object
//
class PSMRemote extends PSMRemotingBase {

    private $progress = null;
    private $trackState = true;
    private $preferKey = "";
    private $headers = true; // automatically send headers of appropriate mime type if request results in file
    
    //
    // create a PSM object that may use the indicated ports to reuse PSM instances
    // @param port of remote service
    // @param socket to remote service
    // @param progress  function with a integer percentage parameter which will be called to receive progress information.
    // @param preferKey  key with '*' separated filenames to select preffered service if available
    //
    function __construct($port, $socket, $progress = null, $preferKey = "") {
        global $psmconfig;
        parent::__construct($port, $socket);
        $this->progress = $progress;
        $this->preferKey = $preferKey;
    }

    //
    // Enable automatic arrangement of headers for file transfers. Set this to FALSE if wanting to process the raw data
    // set to 'true' if sending to browser.
    //
    public function enableHeaders($enable) {
        $this->headers = $enable;
    }

    //
    // Forward unknown calls as RPC, this implicitly proxies the entire remote object
    //
    public function __call($name, $arguments) {
        return $this->remoteInvoke($name, $arguments);  
    }

    //
    // Invoke a call on the remote service and return the result
    // protected so can be wrapped by custom proxy classes to marshall complex return values. 
    //
    protected function remoteInvoke($methodName, $arrayArgs) {
        $this->startRequest($methodName, $this->preferKey);
        
        $call = PSMMarshal::marshalCall($methodName, $arrayArgs);
        
        $this->log("remoteInvoke start:'$call'");
        $result = null; // CORRIGÉ: Initialiser $result
        try {
            $this->write($call); // send request to service
            while (true) {
                $read = $this->read(); 
                $this->log("packet in:'$read'");
                $packet = explode(" ", $read, 3); // get response(s)
                
                if (!isset($packet) || count($packet) < 1) { 
                    throw new PSMRetryException("Packet unset or <1"); 
                } else if (strcmp("DATA", $packet[0]) == 0) {
                
                    $this->log("[DATA] [MIMETYPE] [LENGTH]");
                    $this->receiveFile($packet[1], $packet[2]);
                   
                } else if (strcmp("PROGRESS", $packet[0]) == 0 || strcmp("PROGRESS:", $packet[0]) == 0) {
                
                    $this->log("[PROGRESS] [PERCENTAGE]");
                    if ($this->progress != null)
                        call_user_func($this->progress, intval($packet[1]));
                   
                } else if (strcmp("RESULT", $packet[0]) == 0) {
                
                    $this->log("[RESULT] [TYPE] [VALUE]");
                    $result = PSMMarshal::unmarshal($packet[2], $packet[1]); 
                    // CORRIGÉ: Ne pas essayer de convertir $result en string s'il n'est pas scalaire
                    $this->log("unmarshal result received");
                    break;
                   
                } else {
                    throw new PSMRetryException("Unknown packet. 0='$packet[0]' 1='$packet[1]' 2='$packet[2]'");        
                }
            }
        } catch(Exception $e) {
            $result = $e;
            $msg = "Exception during $methodName, msg=".$e->getMessage();
            if (is_a($e, "PSMRetryException"))
                $this->log($msg);
            else
                $this->audit($msg);
        }
        $this->log("disconnecting");
        $this->close(); // immediatly free up the connection to remove it from the service socket backlog    
        // stopRequest(); <-- dont do this here, aborted requests would then 'stick' in the counters, its done by the server
        // CORRIGÉ: Ne pas essayer de convertir $result en string
        $this->log("syncExecRemote completed");
        if (is_a($result, "Exception"))
            throw $result;
        return $result;
    }

    // TODO: review this, if stateservice isnt autostart, this is all bogus
    // Order the remote object to quit. 
    // $shutdown:   if true, bypasses object state registration, preventing revive of stateservice during overall shutdown
    //
    public function quit($shutdown = false) {
        $this->enableStateTracking(false);
        $this->remoteInvoke("quit", array($shutdown));		
    }

    //
    // read a file sent from the server (obtained from the return value of a syncExecRemote call) and deliver the file to the browser
    // @param cmd string containing a PHP expression to evaluate
    // @param type mime type of the file being sent to the browser
    //
    protected function receiveFile($type, $length) {
        if ($this->headers) {
            // send the header
            $this->log("receiveFile header Content-type: ".$type);
            @header('Content-type: '.$type);
            @header('Connection: close');
            @header('Content-Transfer-Encoding: binary');
            @header('Expires: 0');
            @header('Cache-Control: no-cache, must-revalidate, post-check=0, pre-check=0');
            @header('Pragma: public');
            @header('Content-length: '.$length);
            flush();
        }		
        // receive the file from service, echoing it to the 'this' request repsonse output
        $received = 0;
        while($length > 0) {
            flush();
            if ($length > 8192) {
                $contents = socket_read($this->socket, 8192);
                $length -= strlen($contents);
            }
            else {
                $contents = socket_read($this->socket, $length);
                $length -= strlen($contents);
            }
            $received += strlen($contents);
            echo $contents;
        }
        flush();
        $this->log("receiveFile file returned to client browser $received bytes");
    }
}

class PSMService extends PSMRemotingBase {
    protected $quit = false;
    private $client = null;
  
    //
    // If set >0 calls doWork with the given interval in seconds (+- 3 seconds deviation possible)
    //
    protected $doWorkIntervalSeconds = 0;

    // Quirck: global $psmconfig is invalid (unset) once we get into the constructor, totally weird, as 
    //         it's okay when calling overridden functions (doWork in monitorservice also uses it, just fine)
    //         Without storing the port beforehand, PSM_getStateService fails with unset $psmconfig... strange.
    protected $psmconfigDup;
  
    //
    // create a PSM object that may use the indicated ports to reuse PSM instances
    // @param ports array of integer port number to use for inter thread communication
    // @param progress  function with a integer percentage parameter which will be called to receive progress information.
    //
    function __construct($port, $socket) {
        parent::__construct($port, $socket);
        global $psmconfig;
        
        // Stay alive
        set_time_limit(0);
        ignore_user_abort(true);  
        socket_listen($socket, 12/*resonable value not to eat all of HTTP server's requests, but enough to prevent quick saturation*/);
        
        $this->log("Construct done");
    }

    //
    // Life of a service thread: BOOT->RUNNING->QUITTING->STOPPED
    //
    protected function destructor() {
        global $psmconfig;

        // Now listening, so can end request as caller's requests will be queued in backlog now
        echo "Starting...";
        // CORRIGÉ: Ajouter @ pour supprimer les warnings "headers already sent"
        @header('Connection: close');
        @header('Expires: 0');
        @header('Cache-Control: no-cache, must-revalidate, post-check=0, pre-check=0');
        @header('Pragma: public');
        @header('Content-length: 0');
        flush();
        @session_write_close(); 

        $this->log("boot");           
        if (($stateService = $this->getStateService()) != null)
            $stateService->registerBootService($this->port, get_class($this));
          
        $this->onBoot();

        $this->audit("started");
        if (($stateService = $this->getStateService()) != null)
            $stateService->registerStartService($this->port);

        $this->runService();

        $this->log("quitting");
        if (($stateService = $this->getStateService()) != null)
            $stateService->registerQuitService($this->port);

        $this->onQuit();

        if (($stateService = $this->getStateService()) != null)
            $stateService->registerStopService($this->port);
        
        $this->audit(get_class($this)." service stopped @ $this->port");
        parent::destructor();
    }

    //
    // Main service loop, wait for incomming calls and execute them
    //
    protected function runService() {
        // cause initialupdate after service start
        $elapsed = $this->doWorkIntervalSeconds;
        // CORRIGÉ: Ne pas inclure $this->socket dans le log
        $this->log("service loop start");
        // msgloop 
        while ($this->socket != null) {
            // Do any interval work (do before 1st connection as initialupdate)
            if ($this->doWorkIntervalSeconds > 0 && ++$elapsed >= $this->doWorkIntervalSeconds) {
                $elapsed = 0;
                try { $this->doWork(); } catch (Exception $e) { $this->audit("WARNING: Exception during doWork(".$e->getMessage().")"); }
            } 
            // wait for a connection
            if (($this->client = $this->socket_accept_with_timeout($this->socket, 1)) !== false) {
                // CORRIGÉ: Ne pas inclure $this->client dans le log
                $this->log("Client connected");
                // Collect method call
                if (($cmd = $this->read()) !== false) {
                    // Execute method call   
                    try {           
                        $call = PSMMarshal::unmarshalCall($cmd, $this);
                        $this->log("Server run: $call");
                        $result = eval($call);
                    }
                    catch (Exception $e) {
                        $result = new Exception("\nService side exception during:\n'$cmd'\nMessage='". $e->getMessage()."'\nService side stack:\n".$e->getTraceAsString()."\nProxy side stack:\n");
                        $this->audit("Exception: ".$e->getMessage());
                    }                     
                    // Return result   
                    // CORRIGÉ: Ne pas essayer de convertir $result en string     
                    $this->log("Server run completed");
                    $this->write("RESULT ".PSMMarshal::marshal($result));
                }
                $this->stopRequest();
                @socket_close($this->client);
                $this->client = null;
                if ($this->quit) 
                    break;
                else
                    $this->afterRequestHandled();        
            } else { // end if 'connected'
            } // end else 'timed out, no connection'
        } // end while socket != null
    }

    //
    // Things to-do after a request is handeld
    //
    protected function afterRequestHandled() {}

    //
    // Override getIOSocket so datatransfer is on client connection
    //
    protected function getIOSocket() {
        return $this->client;
    }

    //
    // Overload in subclass to perform boot work
    //
    function onBoot() {
    }

    //
    // Overload in subclass to perform quit work
    //
    function onQuit() {
    }


    //
    // Overload in subclass to do work on interval doWorkIntervalSeconds is passed
    //
    function doWork() {
    }

    //
    // Exit the service.
    // $shutDown:         if true, disables stateTracking which prevents stateService revive during global shutdown
    //
    function quit($shutDown = false) {
        // CORRIGÉ: Utiliser $shutDown (pas $shutdown)
        $report = $shutDown ? "SHUTDOWN" : "STOP";
        $this->log("Quit requested:" . $report);
        $this->quit = true;
        if ($shutDown)
            $this->enableStateTracking(false);
    }

    //
    // send data to the browser or client thread
    // @param contents VARIANT data to send
    // @param type mime type of the file (image/jpeg)
    //
    protected function sendData($contents, $type) {
        $packet = "DATA $type ".count($contents)."\n"; 	
        $this->log("sendData:$packet");
        // write the length to the client
        $this->write($packet);
                
        // copy the file in chunks to the client
        ob_start();
        foreach ($contents as $byte)
            echo chr($byte);
        // send the content
        $this->write(ob_get_clean());
    } 
    
    //
    // send a file to the browser or client thread
    // @param pdf file name
    // @param type mime type of the file (application/pdf)
    // @param remove boolean indicated whether to remove the file after sending
    //
    protected function sendFile($filename, $type, $remove) {
        $packet = "DATA $type ".filesize($filename)."\n";
        $this->log("sendFile:$packet");
        $this->write($packet);
        $file = fopen($filename, "rb");
        ob_start();
        while ($contents = fread($file, 8192)) {
            if (strlen($contents) > 0) {
                for ($index = 0; $index < strlen($contents); $index++) {
                    echo $contents[$index];
                }
            }
        }
        $this->write(ob_get_clean());
        fclose($file);
        if ($remove)
            unlink($filename);
    }

    //
    // convinience helper
    // CORRIGÉ: Variables passées par référence à socket_select doivent être déclarées avant
    //
    private function socket_accept_with_timeout($socket, $timeoutInSeconds) {
        if ($timeoutInSeconds == 0)
            return @socket_accept($socket);
           
        $conn = false;
        $r = array($socket);
        $w = array($socket);
        $e = array($socket);
        if (@socket_select($r, $w, $e, $timeoutInSeconds) == 1/*accept*/)
            $conn = @socket_accept($socket);
        return $conn;  
    }

    //
    // Just for testing using psmcontrol
    //  
    public function pingPublic() {
        return $this->port;
    }

    //
    // Just for testing using psmcontrol
    //  
    protected function pingProtected() {
        return $this->port;
    }
}


?>