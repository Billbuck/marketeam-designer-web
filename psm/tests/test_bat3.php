<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once("psmjpeg.php");

$documentFilename = 'C:\Test Designer Printshop\test.psmd';
$dataFilename = $_SERVER['DOCUMENT_ROOT'] . "\\psm\\data.csv";
$layout = 1;

echo "<h1>Test BAT Direct</h1>";
echo "<p>Document: $documentFilename</p>";
echo "<p>Data: $dataFilename</p>";

try {
    $base64 = PSM_GetJPEGDataAsBase64($documentFilename, $dataFilename, $layout);
    
    echo "<p>Taille base64: " . strlen($base64) . "</p>";
    echo "<p>Premiers caractères: " . htmlspecialchars(substr($base64, 0, 50)) . "</p>";
    
    // Vérifier si c'est du vrai base64 (que des caractères alphanumériques, +, /, =)
    if (preg_match('/^[a-zA-Z0-9+\/=]+$/', substr($base64, 0, 1000))) {
        echo "<p style='color:green'>✅ Base64 valide détecté</p>";
        echo "<h2>Image :</h2>";
        echo '<img src="data:image/jpeg;base64,' . $base64 . '" style="max-width:100%; border:1px solid black;" />';
    } else {
        echo "<p style='color:red'>❌ Ce n'est PAS du base64 valide</p>";
        echo "<p>On va encoder nous-mêmes :</p>";
        $base64_fixed = base64_encode($base64);
        echo '<img src="data:image/jpeg;base64,' . $base64_fixed . '" style="max-width:100%; border:1px solid black;" />';
    }
    
} catch (Exception $e) {
    echo "<p style='color:red'>ERREUR: " . $e->getMessage() . "</p>";
}
?>
