# PSM Keep-Alive - Vérifie et relance l'API si nécessaire
try {
    $response = Invoke-WebRequest -Uri "http://localhost/psm/psm_autostart.php" -TimeoutSec 30 -UseBasicParsing
} catch {
    # Ignorer les erreurs silencieusement
}