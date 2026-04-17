@echo off
REM PSM Keep-Alive - Vérifie et relance l'API si nécessaire
curl -s -o nul -w "%%{http_code}" "http://localhost/psm/psm_autostart.php" > nul 2>&1