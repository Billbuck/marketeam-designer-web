<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test des méthodes PrintShop Mail</h1>";

$psm = new COM("PrintShopMail60.AutomatedPrinting");

echo "<h2>Test CloseDocument()</h2>";
try {
    $psm->CloseDocument();
    echo "<p style='color:green'>✅ CloseDocument() existe</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ CloseDocument() non trouvé: " . $e->getMessage() . "</p>";
}

echo "<h2>Test CloseDatabase()</h2>";
try {
    $psm->CloseDatabase();
    echo "<p style='color:green'>✅ CloseDatabase() existe</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ CloseDatabase() non trouvé: " . $e->getMessage() . "</p>";
}

echo "<h2>Test NewDocument()</h2>";
try {
    // NewDocument() pourrait forcer la fermeture du document actuel
    $psm->NewDocument();
    echo "<p style='color:green'>✅ NewDocument() existe</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ NewDocument() non trouvé: " . $e->getMessage() . "</p>";
}

echo "<h2>Propriété DocumentPath</h2>";
try {
    $path = $psm->DocumentPath;
    echo "<p style='color:green'>✅ DocumentPath = '$path'</p>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ DocumentPath non accessible: " . $e->getMessage() . "</p>";
}

echo "<hr><p>Test terminé</p>";
?>