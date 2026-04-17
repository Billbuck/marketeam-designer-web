<?php

// Script to control services through GET operations. This allows the requestor
// to use the service on return.  
//
// CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! 
//
// Do not modify this script, it is invoked by the API implementation scripts
//
// CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! CAUTION!! 
//
include_once("psmconfiguration.php");
include_once("psmremote.php");
include_once("psmthread.php");
include_once("psmstate.php");

$port = intval($_GET['port']);
$cmd = strtoupper($_GET['cmd']);

$type = $psmconfig->getPortDescription($port);

echo "$cmd $type @ $port ";

// Factories
function createPSMThread($port, $socket)         { return new PSMThread($port,$socket); }
function createPSMStateService($port, $socket)   { return new PSMStateService($port,$socket); }
function createPSMMonitorService($port, $socket) { return new PSMMonitorService($port,$socket); }

//
// Determine from the configuration which port is of what type
//
function getFactoryForPort($port) {
  global $psmconfig;
  global $type;
  
  if ($psmconfig->getPortStateService() == $port)   { return 'createPSMStateService'; }
  if ($psmconfig->getPortMonitorService() == $port) { return 'createPSMMonitorService'; }
  return 'createPSMThread';
}

if (strcasecmp($cmd,"start")==0) {
  // Only place not to use launch_service, as that is the whole point of this script
  $service = psm_start_service($port, getFactoryForPort($port));
  echo "OK"; 
} else if (strcasecmp($cmd,"stop")==0) {
  psm_stop_service($port);
  echo "OK";
} else if (strcasecmp($cmd,"ping")==0) {
  $proxy = psm_proxy_remote($port);
  if ($proxy != null) 
    pingReply($proxy->pingPublic());
  else
    echo "No reply";
} else if (strcasecmp($cmd,"pingbad")==0) {
  $proxy = psm_proxy_remote($port);
  if ($proxy != null) 
    pingReply($proxy->pingProtected());
  else
    echo "No reply";
} else {
  echo "FAIL UNKNOWN COMMAND";
} 
 
function pingReply($reply) {
  echo "Ping reply:";
  if (is_subclass_of($reply, "Exception")) {
    echo $reply->getMessage();
  } else {
    echo $reply; 
  }
}
 
header('Cache-Control: no-cache, must-revalidate, post-check=0, pre-check=0');
?>