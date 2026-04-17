<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "1. Chargement fichiers<br>";
flush();

include_once("psmconfiguration.php");
echo "- config OK<br>";
flush();

include_once("psmremote.php");
echo "- remote OK<br>";
flush();

include_once("psmmonitor.php");
echo "- monitor OK<br>";
flush();

echo "2. Création socket pour port 8281<br>";
flush();

$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
$bind = @socket_bind($socket, "localhost", 8281);

if (!$bind) {
    echo "❌ Port 8281 déjà utilisé<br>";
    die();
}
echo "- socket OK<br>";
flush();

echo "3. Création PSMMonitorService<br>";
flush();

try {
    $service = new PSMMonitorService(8281, $socket);
    echo "✅ Service créé<br>";
} catch (Error $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "Ligne: " . $e->getLine() . "<br>";
    echo "Fichier: " . $e->getFile() . "<br>";
}

echo "Fin";
?>
