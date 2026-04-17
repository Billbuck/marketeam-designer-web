<?php

include_once("psmpdf.php");

//$documentFilename = "D:\\Program Files (x86)\\PrintShop Mail Suite 7\\PrintShop Mail Web\\Website\\files\\publicationtypes\\46\\210\\210.psmd";
//$documentFilename = $_SERVER['DOCUMENT_ROOT'] . "\\document\\Xmastemplate.psmd"; // OL TEST
//$documentFilename = "C:\\Program Files (x86)\\PrintShop Mail Suite 7\\PrintShop Mail Web\\Website\\document\\toto.psmd";
//$random = $_GET['value']; // just some value to show that the preview is 'fresh'
//$PSM_to = ($_GET['t']);
//$PSM_size = strtoupper($_GET['s']);
//$PSM_style = strtoupper($_GET['d']);
//$PSM_language = strtoupper($_GET['l']);
//$PSM_QR = ($_GET['q']);

$Fichier = urldecode($_GET['p']);
$documentFilename = $Fichier; 
//$documentFilename = "C:\\Program Files (x86)\\PrintShop Mail Suite 7\\PrintShop Mail Web\\Website\\"document\\" . $Fichier;
$layout = intval($_GET['l']);

$dataFilename = $_SERVER['DOCUMENT_ROOT'] . "\\document\\data.xml";

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// Get the jpeg
//
try {
 echo PSM_GetJPEGDataAsBase64($documentFilename, $dataFilename, $layout);
}
catch (Exception $e) {
  // already logged by framework, consider providing a fallback image/message 
}
//
//
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// suppression du fichier data

//@unlink($dataFilename);

?>
