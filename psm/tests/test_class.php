<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "1. Chargement fichiers<br>";
include_once("psmconfiguration.php");
include_once("psmremote.php");
include_once("psmstate.php");
echo "OK<br>";

echo "2. Création socket<br>";
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_bind($socket, "localhost", 8280);
echo "OK<br>";

echo "3. Appel constructeur parent PSMService<br>";
flush();

class TestService extends PSMService {
    function __construct($port, $socket) {
        echo "3a. Avant parent::__construct<br>";
        flush();
        parent::__construct($port, $socket);
        echo "3b. Après parent::__construct<br>";
        flush();
    }
}

try {
    $test = new TestService(8280, $socket);
    echo "OK<br>";
} catch (Error $e) {
    echo "ERREUR: " . $e->getMessage() . "<br>";
    echo "Ligne: " . $e->getLine() . "<br>";
    echo "Fichier: " . $e->getFile() . "<br>";
}

echo "4. Fin";
?>
