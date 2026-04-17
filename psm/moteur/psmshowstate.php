<html><body>

<style type="text/css">
body, td
{
  font-family:"verdana";
  font-size:12px;
}
.column0 { width:50px; }   /*port*/
.column1 { width:135px; }  /*type*/
.column2 { width:80px; }   /*state*/
.column3 { width:130px; }  /*up*/
.column4 { width:130px; }  /*idle*/
.column5 { width:200px; }  /*last req.*/
.column6 { width:50px; }   /*pending*/
.column7 { width:50px; }   /*peak*/
.column7 { width:80px; }  /*handled*/
.column9 { width:220px; }  /*preferKey*/
  
</style>

<?php

include_once("psmconfiguration.php");
include_once("psmstate.php");

header('Connection: close');
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');

global $psmconfig;

$s = PSM_getStateService();
$m = PSM_getMonitorService();

$sp = $psmconfig->getPortStateService();
$mp = $psmconfig->getPortStateService();

$state   = $sp <= 0 ? "Not configured, disabled" : "@ port ".$psmconfig->getPortStateService()." ";
$state  .= $sp <= 0 ? "" : ($s === null ? "Not accessible at this time. (down, booting or quiting)" : "Running");

$monitor = $mp <= 0 ? "Not configured, disabled" : "@ port ".$psmconfig->getPortMonitorService()." ";
$monitor.= $mp <= 0 ? "" : ($m === null ? "Not accessible at this time. (down, booting or quiting)" : "Running");


echo "State Service $state<br/>"; 
echo "Monitor Service $monitor<br/><br/>"; 

if ($s === null) {
  // Close non-requests
  if ($m != null) $m->__destruct();
  echo "<strong>State service not running, cannot retrieve state report.</strong>";
} 
else 
{
  // Close non-requests
  if ($s != null) $s->__destruct();
  if ($m != null) $m->__destruct();
  
  $portsets = $psmconfig->getPortSets();
  
  echo count($portsets)." portsets<br/><br/>";
  foreach ($portsets as $setid => $portset) {
    $stateService = PSM_getStateService();
	if ($stateService != null) {
		tableStates($stateService->getState($portset->getPorts()), $setid);
	} else {
		echo "StateService non disponible pour $setid<br>";
	}
  }

  $portMonitor = $psmconfig->getPortMonitorService();
  if ($portMonitor > 0) {
    tableStates(PSM_getStateService()->getState($a = array($portMonitor)), "Monitor service");
  }
  $portState = $psmconfig->getPortStateService();
  if ($portState > 0) {
    tableStates(PSM_getStateService()->getState($a = array($portState)), "State service");
  }
}

function tableStates($states, $title) {
  echo "<em>$title</em><br/>";
  echo "<table border='1'>";

  // Header  
  tableRow(PSMObjectState::getDisplayTitles(), "font-weight:800");
  
  // Rows
  foreach ($states as $port => $state)
    tableRow($state->getDisplayFields(),"", 'formatFields');
    
  echo "</table>";
}

function formatFields($column, $field) {
  $result = $field;
  if ($column == 9) {
    $result = "";
    $entries = explode("*", $field);
    foreach ($entries as $index => $part) {
      $slash = false;
      $slash = strrpos($part, "\\");
      if ($slash === false)
        $slash = strrpos($part, "/");
      if (!($slash === false))
        $part = substr($part, $slash + 1, 255);
      $result.= "$part".($index < (count($entries)-1) ? "," :"");
    }            
  }
  return $result;
}

function tableRow($arrayValues, $style, $columnCallback = null) {
  echo "<tr style='$style'>";
  foreach ($arrayValues as $column => $field) {
    if ($columnCallback != null) {
      $field = $columnCallback($column, $field);
    }
    echo "<td class='column column$column'>";
    echo $field;
    echo "</td>";
  }
  echo "</tr>";
}

?>
</body></html>