<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$psmdFile = 'C:\Test Designer Printshop\test2.psmd';
$outputFile = $_SERVER['DOCUMENT_ROOT'] . '/psm/bat_output2.jpg';

// Appeler l'API
$url = 'http://localhost/psm/psm_marketeam_jpg.php?p=' . urlencode($psmdFile) . '&l=1';
$response = file_get_contents($url);

echo "<h1>Analyse de la réponse</h1>";
echo "<p>Taille: " . strlen($response) . " octets</p>";

// Afficher les 20 premiers octets en hexadécimal
echo "<p>Premiers octets (hex): ";
for ($i = 0; $i < 20; $i++) {
    echo sprintf("%02X ", ord($response[$i]));
}
echo "</p>";

// Chercher la signature JPEG (FFD8FF)
$jpegStart = strpos($response, "\xFF\xD8\xFF");
echo "<p>Position signature JPEG (FFD8FF): " . ($jpegStart !== false ? $jpegStart : "NON TROUVÉE") . "</p>";

if ($jpegStart !== false) {
    // Extraire le JPEG à partir de la signature
    $jpegData = substr($response, $jpegStart);
    file_put_contents($outputFile, $jpegData);
    echo "<p style='color:green'>✅ JPEG extrait et sauvegardé (" . strlen($jpegData) . " octets)</p>";
    echo "<h2>Image :</h2>";
    echo '<img src="bat_output2.jpg?' . time() . '" style="max-width:100%; border:1px solid black;" />';
} else {
    echo "<p style='color:red'>❌ Signature JPEG non trouvée</p>";
    
    // Essayer de décoder comme base64
    $decoded = base64_decode($response, true);
    if ($decoded !== false) {
        $jpegStartDecoded = strpos($decoded, "\xFF\xD8\xFF");
        echo "<p>Après décodage base64 - Position JPEG: " . ($jpegStartDecoded !== false ? $jpegStartDecoded : "NON") . "</p>";
        if ($jpegStartDecoded !== false) {
            file_put_contents($outputFile, substr($decoded, $jpegStartDecoded));
            echo '<img src="bat_output2.jpg?' . time() . '" style="max-width:100%; border:1px solid black;" />';
        }
    }
}
?>
