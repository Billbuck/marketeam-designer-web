<?php
/**
 * TEST : Génération PDF depuis un PSMD via PrintShop Mail
 * Usage : http://localhost/psm/psm_test_pdf.php?p=CHEMIN_PSMD
 * 
 * Génère un PDF (record 1) et le renvoie directement au navigateur.
 * Permet de vérifier que le rendu PDF (codes-barres, marges, fond perdu)
 * est correct avant d'implémenter la conversion PDF→JPG pour les BAT.
 */

include_once("psmproxy.php");
include_once("psminterface.php");

$Fichier = isset($_GET['p']) ? urldecode($_GET['p']) : '';

if (empty($Fichier)) {
    http_response_code(400);
    echo "Usage: psm_test_pdf.php?p=CHEMIN_DU_PSMD";
    exit;
}

if (!file_exists($Fichier)) {
    http_response_code(404);
    echo "Fichier introuvable: " . $Fichier;
    exit;
}

// Créer un CSV minimal avec des données de test
$uniqueId = str_replace('.', '_', uniqid('', true));
$dataFilename = $_SERVER['DOCUMENT_ROOT'] . "\\psm\\data_test_" . $uniqueId . ".csv";

$csvContent = "\"Societe\",\"Civilite\",\"Nom\",\"Prenom\",\"Adresse1\",\"Adresse2\",\"Adresse3\",\"Adresse4\",\"CodePostal\",\"Ville\",\"Sequentiel\",\"Timbre\"\r\n";
$csvContent .= "\"CHRONODIRECT\",\"Monsieur\",\"ATTALI\",\"Michel\",\"1 RUE BLEUE\",\"\",\"\",\"\",\"75009\",\"PARIS\",\"000123456\",\"Affranchissement\"\r\n";
file_put_contents($dataFilename, $csvContent);

try {
    $psm = PSM_Get("preview", null, $Fichier . "*" . $dataFilename);
    $psm->enableHeaders(true);
    $psm->PDFPreview($Fichier, $dataFilename, 1, 1);
} catch (Exception $e) {
    http_response_code(500);
    echo "Erreur: " . $e->getMessage();
}

@unlink($dataFilename);
?>
