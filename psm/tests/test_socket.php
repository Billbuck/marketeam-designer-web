<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "1. Création socket<br>";
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
echo "Socket: " . gettype($socket) . "<br>";

echo "2. Bind<br>";
$bind = @socket_bind($socket, "localhost", 8280);
echo "Bind: " . ($bind ? "OK" : "FAIL") . "<br>";

if (!$bind) {
    echo "Erreur: " . socket_strerror(socket_last_error()) . "<br>";
    die();
}

echo "3. Listen<br>";
$listen = socket_listen($socket, 5);
echo "Listen: " . ($listen ? "OK" : "FAIL") . "<br>";

echo "4. Fermeture<br>";
socket_close($socket);
echo "Fermé<br>";

echo "5. Test terminé avec succès !";
?>
