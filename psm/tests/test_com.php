<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test COM PrintShop Mail</h1>";

echo "<h2>1. Extension COM chargée ?</h2>";
if (extension_loaded('com_dotnet')) {
    echo "✅ OUI - Extension COM chargée<br>";
} else {
    echo "❌ NON - Extension COM non chargée<br>";
    die("Arrêt du test");
}

echo "<h2>2. Création objet COM PrintShop Mail...</h2>";
try {
    $psm = new COM("PrintShopMail60.AutomatedPrinting");
    echo "✅ OUI - Objet COM créé avec succès !<br>";
    echo "Type: " . get_class($psm) . "<br>";
} catch (Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "<br>";
}

echo "<h2>3. Test sockets...</h2>";
if (extension_loaded('sockets')) {
    echo "✅ OUI - Extension sockets chargée<br>";
} else {
    echo "❌ NON - Extension sockets non chargée<br>";
}

echo "<h2>Test terminé</h2>";
?>
```
