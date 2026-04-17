<?php
echo "Etape 1<br>";
flush();

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Etape 2<br>";
flush();

include_once("psmconfiguration.php");
echo "Etape 3 - config OK<br>";
flush();

include_once("psmremote.php");
echo "Etape 4 - remote OK<br>";
flush();

include_once("psmstate.php");
echo "Etape 5 - state OK<br>";
flush();

echo "Fin du test";
?>
