<?php
$psm = new COM("PrintShopMail60.AutomatedPrinting");
try {
    $psm->CloseDatabase();
    echo "CloseDatabase() existe";
} catch (Exception $e) {
    echo "CloseDatabase() non trouvé: " . $e->getMessage();
}
?>