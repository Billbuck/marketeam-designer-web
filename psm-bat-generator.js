/**
 * @fileoverview Module de génération de BAT (Bon À Tirer) via API PSM PHP
 * Communique avec WebDev via WebDevBridge (variables synchronisées JSON)
 * 
 * VARIABLES WEBDEV UTILISÉES:
 * 
 * Entrée (sBatPrintshopDemande) - Structure JSON:
 * {
 *     "Path": "C:\\..\\document.psmd",
 *     "PageNumber": 1,
 *     "tabData": [
 *         {"Champ": "NOM", "Valeur": "Dupont"},
 *         {"Champ": "PRENOM", "Valeur": "Jean"}
 *     ]
 * }
 * 
 * Sortie (sBatPrintshopResultat) - Structure JSON:
 * {
 *     "PageNumber": 1,
 *     "ImageBase64": "/9j/4AAQSkZJRg...",
 *     "Resultat": true,
 *     "MessageErreur": ""
 * }
 * 
 * @requires WebDevBridge
 * @author Marketeam Designer
 * @version 1.0.0
 */

(function(global) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 1 : TYPES ET CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Structure d'un champ de données pour la fusion
     * @typedef {Object} BatPrintshopData
     * @property {string} Champ - Nom du champ de fusion
     * @property {string} Valeur - Valeur du champ
     */

    /**
     * Structure de demande de génération BAT (depuis WebDev)
     * @typedef {Object} BatPrintshopDemande
     * @property {string} Path - Chemin complet du fichier .psmd sur le serveur
     * @property {number} PageNumber - Numéro de la page (1-based)
     * @property {BatPrintshopData[]} tabData - Tableau des champs de fusion
     */

    /**
     * Structure de résultat de génération BAT (vers WebDev)
     * @typedef {Object} BatPrintshopResultat
     * @property {number} PageNumber - Numéro de la page générée
     * @property {string} ImageBase64 - Données JPEG en base64 (vide si erreur)
     * @property {boolean} Resultat - true = succès, false = échec
     * @property {string} MessageErreur - Message d'erreur (vide si succès)
     */

    /**
     * Configuration du module
     * @typedef {Object} PsmBatConfig
     * @property {string} apiBaseUrl - URL de base de l'API PSM
     * @property {number} timeout - Timeout en ms
     * @property {string} varDemande - Nom de la variable WebDev d'entrée
     * @property {string} varResultat - Nom de la variable WebDev de sortie
     */

    /**
     * Configuration par défaut
     * @type {PsmBatConfig}
     */
    const CONFIG = {
        apiBaseUrl: 'http://localhost/psm',
        timeout: 30000,
        varDemande: 'sBatPrintshopDemande',
        varResultat: 'sBatPrintshopResultat'
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 2 : FONCTIONS UTILITAIRES
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Extrait les données JPEG depuis un ArrayBuffer en cherchant la signature JPEG.
     * L'API PSM retourne des données parasites avant le JPEG, cette fonction
     * trouve la signature FFD8FF et extrait uniquement les données JPEG.
     * 
     * @param {ArrayBuffer} arrayBuffer - Réponse brute de l'API
     * @returns {Uint8Array|null} Données JPEG extraites ou null si signature non trouvée
     */
    function extractJpegFromArrayBuffer(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        
        // Chercher la signature JPEG : FF D8 FF
        let jpegStart = -1;
        for (let i = 0; i < bytes.length - 2; i++) {
            if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
                jpegStart = i;
                break;
            }
        }
        
        if (jpegStart === -1) {
            console.error('PsmBatGenerator: Signature JPEG (FFD8FF) non trouvée');
            return null;
        }
        
        console.log('PsmBatGenerator: Signature JPEG trouvée à position ' + jpegStart);
        return bytes.slice(jpegStart);
    }

    /**
     * Convertit un Uint8Array en string base64.
     * Traite par chunks pour éviter les dépassements de pile sur gros fichiers.
     * 
     * @param {Uint8Array} uint8Array - Données binaires
     * @returns {string} Chaîne base64
     */
    function uint8ArrayToBase64(uint8Array) {
        const CHUNK_SIZE = 8192;
        let result = '';
        
        for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
            const chunk = uint8Array.subarray(i, Math.min(i + CHUNK_SIZE, uint8Array.length));
            result += String.fromCharCode.apply(null, chunk);
        }
        
        return btoa(result);
    }

    /**
     * Vérifie si WebDevBridge est disponible
     * 
     * @returns {boolean} True si disponible
     */
    function isWebDevBridgeAvailable() {
        return typeof WebDevBridge !== 'undefined' || typeof WDB !== 'undefined';
    }

    /**
     * Récupère une valeur depuis WebDevBridge (avec alias)
     * 
     * @param {string} varName - Nom de la variable
     * @returns {string|null} Valeur ou null
     */
    function getFromWebDev(varName) {
        if (typeof WebDevBridge !== 'undefined') {
            return WebDevBridge.get(varName);
        } else if (typeof WDB !== 'undefined') {
            return WDB.get(varName);
        }
        return null;
    }

    /**
     * Écrit une valeur dans WebDevBridge (avec alias)
     * 
     * @param {string} varName - Nom de la variable
     * @param {string} value - Valeur à écrire
     * @returns {boolean} True si succès
     */
    function setToWebDev(varName, value) {
        if (typeof WebDevBridge !== 'undefined') {
            return WebDevBridge.set(varName, value);
        } else if (typeof WDB !== 'undefined') {
            return WDB.set(varName, value);
        }
        return false;
    }

    /**
     * Écrit le résultat dans la variable WebDev
     * 
     * @param {BatPrintshopResultat} resultat - Résultat à écrire
     */
    function writeResultat(resultat) {
        if (!isWebDevBridgeAvailable()) {
            console.error('PsmBatGenerator: WebDevBridge non disponible');
            return;
        }
        
        const jsonResultat = JSON.stringify(resultat);
        setToWebDev(CONFIG.varResultat, jsonResultat);
        console.log('PsmBatGenerator: Résultat écrit dans ' + CONFIG.varResultat + 
                    ' (Resultat=' + resultat.Resultat + ')');
    }

    /**
     * Crée un résultat d'erreur formaté
     * 
     * @param {number} pageNumber - Numéro de page
     * @param {string} message - Message d'erreur
     * @returns {BatPrintshopResultat} Résultat d'erreur
     */
    function createErrorResult(pageNumber, message) {
        return {
            PageNumber: pageNumber,
            ImageBase64: '',
            Resultat: false,
            MessageErreur: message
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 3 : FONCTION PRINCIPALE DE GÉNÉRATION
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Génère un BAT pour une page donnée en appelant l'API PSM PHP.
     * Envoie les données de fusion en POST.
     * 
     * @param {string} psmdPath - Chemin complet du fichier .psmd sur le serveur
     * @param {number} pageNumber - Numéro de la page (1-based)
     * @param {BatPrintshopData[]} [tabData] - Tableau des champs de fusion (optionnel)
     * @returns {Promise<BatPrintshopResultat>} Résultat de la génération
     * 
     * @example
     * const result = await PsmBatGenerator.generateBat(
     *     'C:\\Documents\\test.psmd', 
     *     1,
     *     [{Champ: 'NOM', Valeur: 'Dupont'}]
     * );
     */
    async function generateBat(psmdPath, pageNumber, tabData) {
        // Construire l'URL avec les paramètres GET
        const url = CONFIG.apiBaseUrl + '/psm_marketeam_jpg.php?p=' + 
                    encodeURIComponent(psmdPath) + '&l=' + pageNumber;
        
        console.log('PsmBatGenerator.generateBat: Appel API:', url);
        console.log('PsmBatGenerator.generateBat: tabData:', tabData ? tabData.length + ' champs' : 'aucun');
        
        try {
            // Préparer la requête
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
            
            // Options de la requête
            const fetchOptions = {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };
            
            // Ajouter les données POST si présentes
            if (tabData && Array.isArray(tabData) && tabData.length > 0) {
                const formData = new URLSearchParams();
                formData.append('data', JSON.stringify(tabData));
                fetchOptions.body = formData.toString();
            }
            
            // Effectuer la requête
            const response = await fetch(url, fetchOptions);
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }
            
            // Lire la réponse en ArrayBuffer
            const arrayBuffer = await response.arrayBuffer();
            
            console.log('PsmBatGenerator.generateBat: Réponse reçue, taille: ' + arrayBuffer.byteLength + ' octets');
            
            if (arrayBuffer.byteLength === 0) {
                throw new Error('Réponse vide de l\'API');
            }
            
            // Extraire le JPEG (signature FFD8FF)
            const jpegData = extractJpegFromArrayBuffer(arrayBuffer);
            
            if (!jpegData) {
                throw new Error('Impossible d\'extraire le JPEG de la réponse');
            }
            
            // Convertir en base64
            const base64 = uint8ArrayToBase64(jpegData);
            
            console.log('PsmBatGenerator.generateBat: Succès page ' + pageNumber + 
                        ', taille base64: ' + base64.length + ' caractères');
            
            return {
                PageNumber: pageNumber,
                ImageBase64: base64,
                Resultat: true,
                MessageErreur: ''
            };
            
        } catch (error) {
            let errorMessage = error.message;
            
            // Gérer le timeout
            if (error.name === 'AbortError') {
                errorMessage = 'Timeout: L\'API n\'a pas répondu dans les ' + (CONFIG.timeout / 1000) + ' secondes';
            }
            
            console.error('PsmBatGenerator.generateBat: Erreur page ' + pageNumber + ':', errorMessage);
            
            return createErrorResult(pageNumber, errorMessage);
        }
    }

    /**
     * Point d'entrée principal appelé depuis WebDev.
     * Lit la demande depuis sBatPrintshopDemande, génère le BAT,
     * et écrit le résultat dans sBatPrintshopResultat.
     * 
     * @returns {Promise<void>}
     * 
     * @example
     * // Depuis WebDev (code navigateur) :
     * // stBatPrintshopDemande.Path = "C:\...\doc.psmd"
     * // stBatPrintshopDemande.PageNumber = 1
     * // stBatPrintshopDemande.tabData = tabMesChamps
     * // Sérialise(stBatPrintshopDemande, sBatPrintshopDemande, psdJSON)
     * // ExécuteJS("PsmBatGenerator.generateBatFromWebDev()")
     */
    async function generateBatFromWebDev() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('PsmBatGenerator.generateBatFromWebDev: Début');
        console.log('═══════════════════════════════════════════════════════════');
        
        // Vérifier WebDevBridge
        if (!isWebDevBridgeAvailable()) {
            console.error('PsmBatGenerator: WebDevBridge non disponible');
            return;
        }
        
        // Lire la demande depuis WebDev
        const jsonDemande = getFromWebDev(CONFIG.varDemande);
        
        if (!jsonDemande) {
            console.error('PsmBatGenerator: Variable ' + CONFIG.varDemande + ' vide ou non trouvée');
            writeResultat(createErrorResult(0, 'Variable ' + CONFIG.varDemande + ' vide ou non trouvée'));
            return;
        }
        
        console.log('PsmBatGenerator: Demande reçue:', jsonDemande.substring(0, 200) + '...');
        
        // Parser la demande JSON
        let demande;
        try {
            demande = JSON.parse(jsonDemande);
        } catch (e) {
            console.error('PsmBatGenerator: Erreur parsing JSON:', e.message);
            writeResultat(createErrorResult(0, 'Erreur parsing JSON: ' + e.message));
            return;
        }
        
        // Valider la demande
        if (!demande.Path) {
            writeResultat(createErrorResult(demande.PageNumber || 0, 'Path manquant dans la demande'));
            return;
        }
        
        const path = demande.Path;
        const pageNumber = demande.PageNumber || 1;
        const tabData = demande.tabData || [];
        
        console.log('PsmBatGenerator: Path = ' + path);
        console.log('PsmBatGenerator: PageNumber = ' + pageNumber);
        console.log('PsmBatGenerator: tabData = ' + tabData.length + ' champ(s)');
        
        // Générer le BAT
        const resultat = await generateBat(path, pageNumber, tabData);
        
        // Écrire le résultat dans WebDev
        writeResultat(resultat);
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('PsmBatGenerator.generateBatFromWebDev: Terminé');
        console.log('═══════════════════════════════════════════════════════════');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 4 : CONFIGURATION DYNAMIQUE
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Modifie l'URL de base de l'API PSM
     * 
     * @param {string} url - Nouvelle URL de base (ex: 'http://serveur/psm')
     */
    function setApiBaseUrl(url) {
        if (url && typeof url === 'string') {
            CONFIG.apiBaseUrl = url.replace(/\/$/, ''); // Supprimer le / final si présent
            console.log('PsmBatGenerator: apiBaseUrl modifié:', CONFIG.apiBaseUrl);
        }
    }

    /**
     * Modifie le timeout des requêtes
     * 
     * @param {number} timeoutMs - Timeout en millisecondes
     */
    function setTimeout(timeoutMs) {
        if (timeoutMs && typeof timeoutMs === 'number' && timeoutMs > 0) {
            CONFIG.timeout = timeoutMs;
            console.log('PsmBatGenerator: timeout modifié:', CONFIG.timeout + 'ms');
        }
    }

    /**
     * Retourne la configuration actuelle
     * 
     * @returns {PsmBatConfig} Configuration actuelle
     */
    function getConfig() {
        return Object.assign({}, CONFIG);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 5 : EXPOSITION PUBLIQUE
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Module de génération de BAT via API PSM
     * @namespace PsmBatGenerator
     */
    const PsmBatGenerator = {
        /**
         * Version du module
         * @type {string}
         */
        version: '1.0.0',
        
        /**
         * Point d'entrée depuis WebDev (lit/écrit via WebDevBridge)
         * @function
         * @returns {Promise<void>}
         */
        generateBatFromWebDev: generateBatFromWebDev,
        
        /**
         * Génère un BAT directement (sans WebDevBridge)
         * @function
         * @param {string} psmdPath - Chemin du fichier .psmd
         * @param {number} pageNumber - Numéro de page
         * @param {BatPrintshopData[]} [tabData] - Données de fusion
         * @returns {Promise<BatPrintshopResultat>}
         */
        generateBat: generateBat,
        
        /**
         * Modifie l'URL de base de l'API
         * @function
         * @param {string} url - Nouvelle URL
         */
        setApiBaseUrl: setApiBaseUrl,
        
        /**
         * Modifie le timeout
         * @function
         * @param {number} timeoutMs - Timeout en ms
         */
        setTimeout: setTimeout,
        
        /**
         * Retourne la configuration actuelle
         * @function
         * @returns {PsmBatConfig}
         */
        getConfig: getConfig,
        
        // Utilitaires exposés pour tests/debug
        /**
         * Extrait JPEG depuis ArrayBuffer
         * @function
         */
        extractJpegFromArrayBuffer: extractJpegFromArrayBuffer,
        
        /**
         * Convertit Uint8Array en base64
         * @function
         */
        uint8ArrayToBase64: uint8ArrayToBase64
    };

    // Exposer sur l'objet global
    global.PsmBatGenerator = PsmBatGenerator;

    console.log('PsmBatGenerator v' + PsmBatGenerator.version + ' chargé');

})(typeof window !== 'undefined' ? window : this);
