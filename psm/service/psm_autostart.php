<?php
/**
 * PSM Auto-Start
 * 
 * Ce script vérifie si l'API PSM est en cours d'exécution.
 * Si elle ne l'est pas, il la démarre automatiquement.
 * 
 * UTILISATION :
 * 
 * 1. Appel direct dans le navigateur :
 *    http://localhost/psm/psm_autostart.php
 * 
 * 2. Inclure au début de psm_marketeam_jpg.php :
 *    include_once("psm_autostart.php");
 */

include_once("psmconfiguration.php");

/**
 * Vérifie si un service est accessible sur un port donné
 * 
 * @param int $port Le port à vérifier
 * @return bool True si le service répond, False sinon
 */
function psm_is_service_running($port) {
    $socket = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
    if ($socket === false) {
        return false;
    }
    
    $result = @socket_connect($socket, "127.0.0.1", $port);
    @socket_close($socket);
    
    return $result;
}

/**
 * Démarre le MonitorService via une requête HTTP non-bloquante
 * 
 * @return bool True si la requête a été envoyée
 */
function psm_start_monitor_service() {
    global $psmconfig;
    
    $monitorPort = $psmconfig->getPortMonitorService();
    $httpPort = $psmconfig->getPort();
    $sdkPath = $psmconfig->getSdkPath();
    
    // Ouvrir une connexion HTTP
    $fp = @fsockopen("127.0.0.1", $httpPort, $errno, $errstr, 5);
    if (!$fp) {
        error_log("PSM AutoStart: Impossible de contacter Apache - $errstr");
        return false;
    }
    
    // Envoyer la requête de démarrage
    $url = $sdkPath . "psmcontrol.php?port=$monitorPort&cmd=start";
    $out = "GET $url HTTP/1.1\r\n";
    $out .= "Host: 127.0.0.1\r\n";
    $out .= "Connection: Close\r\n\r\n";
    
    fwrite($fp, $out);
    
    // Lire SEULEMENT la première ligne de réponse (status HTTP)
    // Ne PAS attendre la fin car le service reste en écoute
    stream_set_timeout($fp, 2); // Timeout de 2 secondes
    $response = fgets($fp, 256);
    
    fclose($fp);
    
    // Vérifier si on a reçu un HTTP 200
    if (strpos($response, "200") !== false) {
        error_log("PSM AutoStart: Requête de démarrage envoyée avec succès");
        return true;
    }
    
    return false;
}

/**
 * Démarre l'API PSM si elle n'est pas en cours d'exécution
 * 
 * @return bool True si l'API est UP (déjà ou après démarrage)
 */
function psm_autostart() {
    global $psmconfig;
    
    $monitorPort = $psmconfig->getPortMonitorService();
    
    // Vérifier si le MonitorService est déjà en cours d'exécution
    if (psm_is_service_running($monitorPort)) {
        return true; // Déjà UP
    }
    
    error_log("PSM AutoStart: MonitorService DOWN sur le port $monitorPort, démarrage...");
    
    // Envoyer la requête de démarrage
    psm_start_monitor_service();
    
    // Attendre que les services démarrent (max 10 secondes)
    for ($i = 0; $i < 10; $i++) {
        sleep(1);
        if (psm_is_service_running($monitorPort)) {
            error_log("PSM AutoStart: MonitorService UP après $i secondes");
            return true;
        }
    }
    
    error_log("PSM AutoStart: Échec du démarrage après 10 secondes");
    return false;
}

/**
 * Vérifie l'état complet de l'API et retourne un rapport
 * 
 * @return array État des services
 */
function psm_get_status() {
    global $psmconfig;
    
    $status = array(
        'state_service' => psm_is_service_running($psmconfig->getPortStateService()),
        'monitor_service' => psm_is_service_running($psmconfig->getPortMonitorService()),
        'threads' => array()
    );
    
    // Vérifier les threads de preview
    $previewPortSet = $psmconfig->getPortSet("preview");
    if ($previewPortSet) {
        $previewPorts = $previewPortSet->getPorts();
        foreach ($previewPorts as $port) {
            $status['threads'][$port] = psm_is_service_running($port);
        }
    }
    
    return $status;
}

// ============================================
// EXÉCUTION
// ============================================

// Si ce script est appelé directement (pas inclus), afficher le statut
if (basename($_SERVER['SCRIPT_FILENAME']) == 'psm_autostart.php') {
    
    // Augmenter le timeout pour ce script
    set_time_limit(60);
    
    header('Content-Type: text/html; charset=utf-8');
    
    echo "<h1>PSM Auto-Start</h1>";
    echo "<p>Vérification de l'état de l'API...</p>";
    flush();
    
    // Tenter l'auto-démarrage
    $started = psm_autostart();
    
    // Attendre un peu que tout se stabilise
    sleep(2);
    
    // Afficher le statut
    $status = psm_get_status();
    
    echo "<h2>État des services</h2>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Service</th><th>Port</th><th>État</th></tr>";
    
    global $psmconfig;
    
    echo "<tr>";
    echo "<td>State Service</td>";
    echo "<td>" . $psmconfig->getPortStateService() . "</td>";
    echo "<td>" . ($status['state_service'] ? "✅ UP" : "❌ DOWN") . "</td>";
    echo "</tr>";
    
    echo "<tr>";
    echo "<td>Monitor Service</td>";
    echo "<td>" . $psmconfig->getPortMonitorService() . "</td>";
    echo "<td>" . ($status['monitor_service'] ? "✅ UP" : "❌ DOWN") . "</td>";
    echo "</tr>";
    
    foreach ($status['threads'] as $port => $running) {
        echo "<tr>";
        echo "<td>PSMThread</td>";
        echo "<td>$port</td>";
        echo "<td>" . ($running ? "✅ UP" : "❌ DOWN") . "</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    // Compter les services UP
    $upCount = ($status['state_service'] ? 1 : 0) + ($status['monitor_service'] ? 1 : 0);
    foreach ($status['threads'] as $running) {
        if ($running) $upCount++;
    }
    
    if ($upCount > 0) {
        echo "<p style='color:green'><strong>✅ API opérationnelle ($upCount services UP)</strong></p>";
    } else {
        echo "<p style='color:red'><strong>❌ API non démarrée</strong></p>";
        echo "<p>Essayez de démarrer manuellement : <a href='psmcontrol.php?port=8281&cmd=start' target='_blank'>Démarrer</a></p>";
    }
    
    echo "<p><a href='psmshowstate.php'>Voir l'état détaillé</a></p>";
    echo "<p><a href='psm_autostart.php'>Rafraîchir</a></p>";
}

// Si ce script est inclus par un autre, exécuter l'auto-démarrage silencieusement
else {
    psm_autostart();
}

?>