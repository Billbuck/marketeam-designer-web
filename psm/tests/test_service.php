<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
set_time_limit(10);

echo "<h1>Test démarrage StateService</h1>";
echo "<pre>";

include_once("psmconfiguration.php");
include_once("psmremote.php");
include_once("psmstate.php");

echo "Configuration chargée\n";
echo "Port StateService: " . $psmconfig->getPortStateService() . "\n";
echo "SDK Path: " . $psmconfig->getSdkPath() . "\n\n";

echo "--- Tentative création socket ---\n";

$port = 8280;
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
echo "Socket créé: " . ($socket ? "OUI" : "NON") . "\n";

$bind = @socket_bind($socket, "localhost", $port);
echo "Bind sur port $port: " . ($bind ? "OUI" : "NON") . "\n";

if (!$bind) {
    echo "Erreur bind: " . socket_strerror(socket_last_error($socket)) . "\n";
    socket_close($socket);
    die("Arrêt");
}

echo "\n--- Tentative création PSMStateService ---\n";

try {
    $service = new PSMStateService($port, $socket);
    echo "✅ PSMStateService créé !\n";
} catch (Error $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Fichier: " . $e->getFile() . "\n";
    echo "Ligne: " . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "</pre>";
?>
