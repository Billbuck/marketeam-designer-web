<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test appel HTTP interne</h1>";
echo "<pre>";

$host = "127.0.0.1";
$port = 80;
$path = "/psm/test_com.php";

echo "Test connexion à $host:$port$path\n\n";

$fp = @fsockopen($host, $port, $errno, $errstr, 5);

if (!$fp) {
    echo "❌ ERREUR connexion: $errstr ($errno)\n";
} else {
    echo "✅ Connexion réussie\n";
    
    $out = "GET $path HTTP/1.1\r\n";
    $out .= "Host: $host\r\n";
    $out .= "Connection: Close\r\n\r\n";
    
    fwrite($fp, $out);
    echo "✅ Requête envoyée\n";
    
    $response = "";
    while (!feof($fp)) {
        $response .= fgets($fp, 128);
    }
    fclose($fp);
    
    if (strpos($response, "200 OK") !== false) {
        echo "✅ Réponse HTTP 200 OK reçue\n";
    } else {
        echo "❌ Réponse inattendue:\n";
        echo substr($response, 0, 500);
    }
}

echo "</pre>";
?>
