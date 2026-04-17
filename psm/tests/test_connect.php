<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test connexion aux services</h1>";

$ports = array(8280, 8281, 8282);

foreach ($ports as $port) {
    echo "<b>Port $port:</b> ";
    
    $socket = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    if (!$socket) {
        echo "Erreur création socket<br>";
        continue;
    }
    
    $result = @socket_connect($socket, "127.0.0.1", $port);
    
    if ($result) {
        echo "✅ Connecté !<br>";
    } else {
        $error = socket_last_error($socket);
        echo "❌ Échec - " . socket_strerror($error) . "<br>";
    }
    
    @socket_close($socket);
}
?>
