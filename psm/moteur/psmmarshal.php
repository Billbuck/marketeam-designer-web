<?php
/**
 * PSM Marshal - Sérialisation/désérialisation des appels
 * VERSION CORRIGÉE POUR PHP 8
 */

ini_set('display_errors', '1');

include_once("psmsetup.php");
include_once("psmconfiguration.php");

//
// Helper functions to marshall calls and values
//
class PSMMarshal {
  
  private static $endOfPacket = "\n";
  private static $escapes = array("\\" => "\\\\", "\n" => "\\n", "\r" => "\\r", "\t" => "\\t", "\v" => "\\v", "\e" => "\\e", "\f" => "\\f", "\$" => "\\\$","\"" => "\\\"");

  //
  // Marshal call to string [method] ([parameters]);
  //
  public static function marshalCall($methodName, $arrayArgs) {
    // get bare methodname without class (manual proxy  for custom marshaling is format class::method, autoproxy __call is just methodname)
    $indexClass = strpos($methodName, "::");
    if (!($indexClass === false)) 
      $methodName = substr($methodName,  $indexClass + 2, 8192); 
    $call = "$methodName ("; 
    foreach($arrayArgs as $index => $argument)  
      $call = $call.($index == 0 ? "" : ",").PSMMarshal::marshalElement($argument);
    return $call.");".PSMMarshal::$endOfPacket;
  }  

  //
  // Unmarshall call, creates PHP code string to evaluate on service
  // enforces access level restrictions.
  //
  public static function unmarshalCall($call, $callee) {
    $split = explode(" ", $call, 2);
    if (!isset($split) || count($split) < 2)
      throw new Exception("Unable to unmarshall call $call on ".get_class($callee));
      
    $class = new ReflectionClass(get_class($callee));
    $method = $class->getMethod($split[0]);
    if (!$method->isPublic())
      throw new Exception("Cannot call non public method $split[0] on ".get_class($callee));
                  
    return "return \$this->$call".PSMMarshal::$endOfPacket;    
  }

  //
  // Marshal return value
  //
  public static function marshal($value) {
    return PSMMarshal::marshalElement($value, true).PSMMarshal::$endOfPacket;
  }

  //
  // Unmarshal a marshaled value, if type not given it is parsed as prefix of value
  //
  public static function unmarshal($value, $type = null) {
    if ($type == null) {
      $split = explode(" ", $value,2);
      if (!isset($split) || count($split) < 2)
        return new Exception("FAIL unmarshal type split of '$value' failed");
      $type = $split[0];
      $value = $split[1];
    }
    error_log_debug("unmarshall type='$type' value='$value'");
    
    if (PSMMarshal::equals($type,"integer"))        { return intval($value); } 
    else if (PSMMarshal::equals($type,"string"))    { return PSMMarshal::unescapeString($value); }
    else if (PSMMarshal::equals($type,"NULL"))      { return null; }
    else if (PSMMarshal::equals($type,"boolean"))   { return PSMMarshal::equals($value, "true"); }
    else if (PSMMarshal::equals($type,"Exception")) { return new Exception(PSMMarshal::unescapeString($value)); }
    else { 
      throw new Exception("Failure to unmarshal type='$type' value='$value'"); 
    }    
  }
  
  //
  // Marshal a data element to string, optionally prefixed by its type 
  //
  private static function marshalElement($element, $includeType = false) {
    // CORRIGÉ: Initialiser $result au début
    $result = "";
    $type = gettype($element);
    // CORRIGÉ: Ne pas essayer de convertir $element en string dans le log
    error_log_debug("marshaling".($includeType ? " return" : "")." type=$type");
    if ($includeType) {
      $result = "$type ";
      if (PSMMarshal::equals($type,"array"))   
        throw new Exception("Arrays only allowed as parameters, not return type");
      $quote = "";
    } else {
      $quote = "\""; // wrap parameter strings in qoutes
    } 
    if (PSMMarshal::equals($type,"integer"))      { $result = $result.$element; } 
    else if (PSMMarshal::equals($type,"string"))  { $result = $result.$quote.(PSMMarshal::escapeString($element)).$quote; }
    else if (PSMMarshal::equals($type,"boolean")) { $result = $result.($element ? "true" : "false"); }
    else if (PSMMarshal::equals($type,"NULL"))    { $result = $result."null"; }
    else if (PSMMarshal::equals($type,"array"))   { $result = PSMMarshal::marshalArray($element, $includeType); }
    else if (PSMMarshal::equals($type,"object")) {
      if ($includeType && is_a($element, "Exception"))
        $result = ($includeType ? "Exception " : "").PSMMarshal::escapeString($element->getMessage());
      else
        throw new Exception("Cannot marshall complex type ".get_class($element));
    } 
    else if (!isset($type) || PSMMarshal::equals($type,"unknown type")) {
      $result="VOID VOID";
    }
    return $result;
  }

  //
  // Marshal an array (recursion allowed, variant indexes are preserved)
  //
  private static function marshalArray($array, $includeType) {
    if ($includeType)
      throw new Exception("FAIL: Cannot marshall arrays as return type.");
    $result = "array(";
    // CORRIGÉ: Initialiser $comma
    $comma = "";
    foreach ($array as $index => $arrayElement) {
      $result = $result.$comma.PSMMarshal::marshalElement($index)." => ".PSMMarshal::marshalElement($arrayElement);
      $comma=","; // dont assume index is numeric here
    }
    return $result.")";                   
  }

  //
  // Escape string to PHP code string  
  //  
  private static function escapeString($string) {
    foreach (PSMMarshal::$escapes as $from => $to)    
      $string = str_replace($from, $to, $string);
    return $string;
  }
  
  //
  // Unescape string
  // for php encoding addcslashes/addslashes dont suffice.
  // Just doing the $escapes using str_replace also gives issues for un-escaping.
  //
  // Test case:
  //
  // $e = escapeString("\test\\test\\\\test")
  // $u = unescapeString("\test\\test\\\\test") 
  private static function unescapeString($string) {
    $pos = 0;
    $out = "";
    $len = strlen($string);
    while ($pos < $len) {
      $set = substr($string, $pos, 2);
      $unescaped = false;
      foreach (PSMMarshal::$escapes as $from => $to) {
        if (strcmp($set, $to)==0) {
          $out.=$from;
          $unescaped = true;
          break;
        } 
      }
      if (!$unescaped)      
        $out.=substr($string, $pos++, 1);
      else
        $pos+=2;
    }
    return $out;
  }
  
  private static function equals($type, $string) {
    return strcmp($type, $string) == 0;
  }
} 

?>