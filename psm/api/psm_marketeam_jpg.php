<?php
/**
 * PSM Marketeam JPG - Point d'entrée API pour génération de BAT
 * 
 * VERSION V5 - Support POST avec données CSV dynamiques + encodage Windows-1252:
 * - Accepte les données de fusion en POST (tabData JSON)
 * - Crée le CSV temporaire directement depuis les données POST
 * - CONVERTIT UTF-8 → Windows-1252 pour compatibilité PrintShop Mail
 * - Fallback sur data.csv si pas de données POST
 * - Nettoyage automatique des fichiers temporaires
 * 
 * PARAMÈTRES GET:
 * - p : Chemin du fichier .psmd (URL encodé)
 * - l : Numéro de page/layout (1-based)
 * 
 * PARAMÈTRES POST (optionnel):
 * - data : JSON array de {Champ, Valeur}
 *   Exemple: [{"Champ":"NOM","Valeur":"Dupont"},{"Champ":"PRENOM","Valeur":"Jean"}]
 * 
 * @modified 2025-12-30 - V5: Conversion UTF-8 → Windows-1252 pour accents
 */

include_once("psmjpeg.php");

/**
 * Nettoie les fichiers data temporaires de plus de 2 minutes
 * 
 * @return void
 */
function cleanupOldDataFiles() {
    $psmDir = $_SERVER['DOCUMENT_ROOT'] . "\\psm\\";
    $files = glob($psmDir . "data_*.csv");
    $now = time();
    
    foreach ($files as $file) {
        // Supprimer si plus vieux que 2 minutes (120 secondes)
        if ($now - filemtime($file) > 120) {
            @unlink($file);
        }
    }
}

/**
 * Supprime un fichier temporaire de manière sécurisée
 * 
 * @param string $filepath Chemin du fichier à supprimer
 * @return bool True si supprimé, false sinon
 */
function safeDeleteTempFile($filepath) {
    if (file_exists($filepath)) {
        usleep(10000); // 10ms de pause
        return @unlink($filepath);
    }
    return true;
}

/**
 * Convertit une chaîne UTF-8 en Windows-1252 (ANSI)
 * PrintShop Mail utilise l'encodage Windows-1252 pour les caractères accentués
 * 
 * @param string $utf8String Chaîne encodée en UTF-8
 * @return string Chaîne encodée en Windows-1252
 */
function utf8ToWindows1252($utf8String) {
    if (empty($utf8String)) {
        return $utf8String;
    }
    
    // Utiliser iconv avec //TRANSLIT pour gérer les caractères non convertibles
    $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $utf8String);
    
    // Fallback sur mb_convert_encoding si iconv échoue
    if ($converted === false) {
        $converted = mb_convert_encoding($utf8String, 'Windows-1252', 'UTF-8');
    }
    
    return $converted !== false ? $converted : $utf8String;
}

/**
 * Crée un fichier CSV temporaire à partir des données JSON
 * Les données sont converties de UTF-8 vers Windows-1252 pour PrintShop Mail
 * 
 * @param array $tabData Tableau de {Champ, Valeur}
 * @param string $filepath Chemin du fichier CSV à créer
 * @return bool True si créé avec succès, false sinon
 */
function createCsvFromData($tabData, $filepath) {
    if (empty($tabData) || !is_array($tabData)) {
        return false;
    }
    
    // Extraire les noms de champs (en-têtes) et les valeurs
    $headers = [];
    $values = [];
    
    foreach ($tabData as $item) {
        if (isset($item['Champ']) && isset($item['Valeur'])) {
            // Convertir UTF-8 → Windows-1252 pour PrintShop Mail
            $headers[] = utf8ToWindows1252($item['Champ']);
            $values[] = utf8ToWindows1252($item['Valeur']);
        }
    }
    
    if (empty($headers)) {
        return false;
    }
    
    // Écrire le fichier CSV avec fins de ligne Windows (CR+LF).
    // PrintShop Mail (application Windows) requiert \r\n comme séparateur de lignes.
    // IMPORTANT : toutes les valeurs sont encapsulées entre guillemets pour que
    // PrintShop Mail les traite comme du texte (préserve les zéros en tête, etc.).
    $quoteCsvField = function($field) {
        return '"' . str_replace('"', '""', $field) . '"';
    };
    
    $csvContent = implode(',', array_map($quoteCsvField, $headers)) . "\r\n"
                . implode(',', array_map($quoteCsvField, $values)) . "\r\n";
    
    if (file_put_contents($filepath, $csvContent) === false) {
        return false;
    }
    
    return true;
}

// ==================================================
// DÉBUT DU TRAITEMENT
// ==================================================

// Nettoyer les vieux fichiers temporaires
cleanupOldDataFiles();

// Récupérer les paramètres GET
$Fichier = isset($_GET['p']) ? urldecode($_GET['p']) : '';
$documentFilename = $Fichier;
$layout = isset($_GET['l']) ? intval($_GET['l']) : 1;

// Valider les paramètres obligatoires
if (empty($documentFilename)) {
    error_log("PSM Marketeam JPG Error: Missing parameter 'p' (psmd path)");
    http_response_code(400);
    echo "Error: Missing parameter 'p' (psmd path)";
    exit;
}

// Générer un ID unique pour le fichier temporaire
$uniqueId = uniqid('', true);
$uniqueId = str_replace('.', '_', $uniqueId);
$dataFilename = $_SERVER['DOCUMENT_ROOT'] . "\\psm\\data_" . $uniqueId . ".csv";

// Déterminer la source des données CSV
$dataCreated = false;

// Option 1: Données POST (prioritaire)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['data'])) {
    $jsonData = $_POST['data'];
    $tabData = json_decode($jsonData, true);
    
    if (json_last_error() === JSON_ERROR_NONE && is_array($tabData)) {
        // Créer le CSV depuis les données POST (avec conversion UTF-8 → Windows-1252)
        if (createCsvFromData($tabData, $dataFilename)) {
            $dataCreated = true;
            // error_log("PSM Marketeam JPG: CSV created from POST data (" . count($tabData) . " fields)");
        } else {
            error_log("PSM Marketeam JPG Warning: Failed to create CSV from POST data, falling back to data.csv");
        }
    } else {
        error_log("PSM Marketeam JPG Warning: Invalid JSON in POST data, falling back to data.csv");
    }
}

// Option 2: Fallback sur data.csv existant
if (!$dataCreated) {
    $dataSource = $_SERVER['DOCUMENT_ROOT'] . "\\psm\\data.csv";
    
    if (!file_exists($dataSource)) {
        error_log("PSM Marketeam JPG Error: data.csv not found and no POST data provided");
        http_response_code(500);
        echo "Error: No data source available";
        exit;
    }
    
    if (!copy($dataSource, $dataFilename)) {
        error_log("PSM Marketeam JPG Error: Unable to copy data file");
        http_response_code(500);
        echo "Error: Unable to prepare data file";
        exit;
    }
}

try {
    // Générer le BAT
    echo PSM_GetJPEGDataAsBase64($documentFilename, $dataFilename, $layout);
}
catch (Exception $e) {
    error_log("PSM Marketeam JPG Error: " . $e->getMessage());
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
finally {
    // Toujours supprimer le fichier temporaire après utilisation
    safeDeleteTempFile($dataFilename);
}

?>