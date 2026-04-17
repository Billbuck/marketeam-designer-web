<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$url = 'http://localhost/psm/psm_marketeam_jpg.php?p=' . urlencode('C:\Test Designer Printshop\test.psmd') . '&l=1';

echo "<h1>Test BAT</h1>";
echo "<p>URL: $url</p>";

$start = time();
$response = @file_get_contents($url);
$duration = time() - $start;

echo "<p>Durée: {$duration} secondes</p>";
echo "<p>Taille réponse: " . strlen($response) . " caractères</p>";

if (strlen($response) > 100) {
    echo "<h2>Image :</h2>";
    echo '<img src="data:image/jpeg;base64,' . $response . '" style="max-width:100%; border:1px solid black;" />';
} else {
    echo "<h2>Réponse trop courte - Erreur probable :</h2>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
}
?>