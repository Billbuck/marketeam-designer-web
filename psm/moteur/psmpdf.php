<?php

include_once("psmproxy.php");

//
// Fetch JPEG from PSM as raw JPEG data, base64 encoded, JSON'ed
//
// @param     templateFilename        filename of template
// @param     dataFilename            filename of datafile
// #param     layoutNumber            layout number
//
// @returns   JSON result 'image' with base64 encoded RAW Jpeg data 
// @throws    Exception on failure (already logged before thrown)
//   
function PSM_GetJPEGDataAsJSON($templateFilename, $dataFilename, $layoutNumber) {
  return json_encode(array("image"=>PSM_GetJPEGDataAsBase64($templateFilename, $dataFilename, $layoutNumber)));
}


//
// Fetch JPEG from PSM as raw JPEG data, base64 encoded
//
// @param     templateFilename        filename of template
// @param     dataFilename            filename of datafile
// #param     layoutNumber            layout number
//
// @returns   base64 encoded RAW Jpeg data 
// @throws    Exception on failure (already logged before thrown)
//   
function PSM_GetJPEGDataAsBase64($templateFilename, $dataFilename, $layoutNumber) {
  return base64_encode(PSM_GetJPEGData($templateFilename, $dataFilename, $layoutNumber));
}

//
// Fetch JPEG from PSM as raw JPEG data
//
// @param     templateFilename        filename of template
// @param     dataFilename            filename of datafile
// #param     layoutNumber            layout number
//
// @returns   raw jpeg data on success 
// @throws    Exception on failure (already logged before thrown)
//   
function PSM_GetJPEGData($templateFilename, $dataFilename, $layoutNumber) {
  ob_start(); // capture output
  try {
    PSM_GetJPEG($templateFilename, $dataFilename, $layoutNumber, false);
  } catch (Exception $e) {
    // flush and stop capture
    ob_get_clean();  
    throw $e;
  }
  // stop capture and return captured output
  $result = ob_get_clean();
  return $result;
}

//
// Fetch JPEG from PSM, will be send to output (browser or capture)
//
// @param     templateFilename        filename of template
// @param     dataFilename            filename of datafile
// @param     layoutNumber            layout number
// @param     sendHeader              send header (set to false if capturing)
//
// @returns   true on success 
// @throws    Exception on failure (already logged before thrown)   
//
function PSM_GetJPEG($templateFilename, $dataFilename, $layoutNumber, $sendHeader = true) {
  global $psmconfig;
  $start = microtime(true);
  // Use a prefer key, this allows the PSM backend service to optimize request routing to threads   
  $preferKey = $templateFilename."*".$dataFilename."*".$layoutNumber;

  // Note:  
  // Only case not handled automatically by PSM_get is a broken connection *after* proxy was aquired
  // Retry to allow service up/down cycles without resulting in client-side errors.
  //
  // Notice this is just to cover a rare cornercase where client requests are queued after
  // quit commands (issued by monitor) on backend thread backlog due to state info latency/staleness.
  // (letting the threads empty the queue first is not a option as handling requests allows for more
  // time to fill the queue again as there's no way to collect connections from queue without
  // having it open for requests in the php api, this would cause quit's never being executed
  // when under heavy load, preventing session extension to work properly)
  $retries = 6;
  $handled = false;
  while (($retries-- > 0) && !$handled) {
    try {
      $psm= PSM_Get("output",        // Portset ID, defined in psmconfiguration.php 
                    null,             // progress, no progress feedback for JPeg so can pass null
                    $preferKey);      // prefer key 
      $psm->enableHeaders($sendHeader); // not a request but a special proxy function
      $psm->PDFPreview($templateFilename,$dataFilename,1,1);
      $handled = true;
    } catch (PSMRetryException $e) {
      error_log_debug("PSM_GetJPEG retry, retries left=".$retries);
    }
  }
  if (!handled) {
    error_log("PSM_GetJPEG failed after several retries (server down)");
  }
  if ($handled && $psmconfig->getProfile()) {
    $duration = microtime(true) - $start;
    $port = $psm->getPort();
    error_log("$port: Client side duration ".number_format($duration, 3));
  }
  return true;            
}

?>