<?php

//
// Configuration file for PSM PHP
//
// VERSION MODIFIÉE : Restart automatique DÉSACTIVÉ pour éviter le bug ACCESS_VIOLATION
// L'auto-démarrage est géré par psm_autostart.php
//

include_once("psmsetup.php");

$psmconfig = new PSMConfig(80,    // httpport of server - required
                           "http://localhost/psm/",  // IMPORTANT: inclure le chemin /psm/
                           8280,  // port for stateservice, omit or <=0 to disable
                           8281); // port for monitor service (requires port for stateserver), omit or <=0 to disable


// Enable logging, ** WARNING ** debugLog=true causes huge volumes of PHP logging 
$psmconfig->setLog(true/*audit main event*/, false/*debugLog*/);


//
// Add portset for fast operations like preview
//
$psmconfig->addPortSet("preview", new PSMPortSet(
    5,
    300,
    PSMPortSet::$POLICY_RANDOM,    // ← Pas de cache, fichiers libérés
    array(8282,8283,8284,8285,8286)
));


//
// Add portset for slow operations like output
//
$psmconfig->addPortSet("output", new PSMPortSet(0/*minThreadCount*/, 300/*maxIdleTimeThreadSeconds*/, PSMPortSet::$POLICY_WORKLOAD, array(8296)));

//
// RESTART AUTOMATIQUE DÉSACTIVÉ
// 
// Le mécanisme de restart automatique (setRestartInterval > 0) cause un crash 
// ACCESS_VIOLATION (0xC0000005) dans Apache/PHP lors de la destruction des objets COM.
//
// Solution alternative : utiliser psm_autostart.php qui est inclus dans 
// psm_marketeam_jpg.php et qui démarre automatiquement l'API si elle est DOWN.
//
$psmconfig->setRestartInterval(0);

?>
