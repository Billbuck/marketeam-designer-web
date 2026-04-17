<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test démarrage service</h1>";
echo "<pre>";

try {
    include_once("psmconfiguration.php");
    echo "✅ psmconfiguration.php chargé\n";
    
    include_once("psmremote.php");
    echo "✅ psmremote.php chargé\n";
    
    include_once("psmthread.php");
    echo "✅ psmthread.php chargé\n";
    
    include_once("psmstate.php");
    echo "✅ psmstate.php chargé\n";
    
    echo "\n--- Test connexion port 8280 ---\n";
    $socket = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    if ($socket) {
        echo "✅ Socket créé\n";
        $bind = @socket_bind($socket, "127.0.0.1", 8280);
        if ($bind) {
            echo "✅ Port 8280 disponible\n";
            socket_close($socket);
        } else {
            echo "❌ Port 8280 déjà utilisé ou bloqué\n";
            echo "Erreur: " . socket_strerror(socket_last_error()) . "\n";
        }
    } else {
        echo "❌ Impossible de créer le socket\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

echo "</pre>";
?>