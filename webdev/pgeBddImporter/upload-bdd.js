/**
 * Upload BDD - Marketeam Designer Web
 * Version 3.2.0 - Upload Multipart + Compatible WebDev 2026 (iframe sandbox)
 * 
 * WebDev 2026 rend les champs HTML dans une iframe sandbox="allow-same-origin"
 * sans allow-scripts. Ce script, injecté via HTMLEntête (niveau page), accède
 * au DOM du champ HTML à travers l'iframe grâce à allow-same-origin.
 * 
 * Placeholders remplacés côté serveur :
 * %%URLWEBSERVICE%%, %%IDCLIENT%%, %%IDCONTACT%%
 * 
 * v3.2.0 (28/07/2026) - SÉCURITÉ : la clé secrète n'est plus injectée dans
 * la page (%%SECRETKEY%% supprimé). L'horodatage + la signature sont fournis
 * par le serveur via window._callbackSignatureBDD (procédure WebDev
 * DonneJetonUpload -> DonneSignatureUpload). Format : "AAAAMMJJHHMMSS|signature".
 */
(function() {
    'use strict';
    
    // ============================================================
    // CONFIGURATION
    // ============================================================
    const CONFIG = {
        urlWebservice: '%%URLWEBSERVICE%%',
        maxFileSize: 100 * 1024 * 1024, // 100 Mo
        idClient: '%%IDCLIENT%%',
        idContact: '%%IDCONTACT%%',
        // Estimation : secondes par Mo pour l'analyse serveur
        analyseSecondsPerMo: 0.25,
        // Nombre max de tentatives pour trouver les éléments dans l'iframe
        maxInitRetries: 50,
        // Délai entre chaque tentative (ms)
        initRetryDelay: 200
    };

    // ============================================================
    // ÉLÉMENTS DOM
    // ============================================================
    let elements = {};
    
    /**
     * Recherche un élément par ID, d'abord dans la page puis dans les iframes.
     * Nécessaire car WebDev 2026 rend les champs HTML dans des iframes
     * avec sandbox="allow-same-origin" (accès DOM autorisé depuis la page parente).
     */
    function findElement(id) {
        // 1. Chercher dans la page principale
        let el = document.getElementById(id);
        if (el) return el;
        
        // 2. Chercher dans toutes les iframes (champ HTML WebDev 2026)
        let iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                let iframeDoc = iframes[i].contentDocument || iframes[i].contentWindow.document;
                if (iframeDoc) {
                    el = iframeDoc.getElementById(id);
                    if (el) return el;
                }
            } catch(e) {
                // Ignorer les erreurs cross-origin sur d'autres iframes
            }
        }
        return null;
    }
    
    function initElements() {
        elements = {
            container:    findElement('uploadContainer'),
            btnUpload:    findElement('btnUploadBdd'),
            inputFichier: findElement('inputFichierBdd'),
            progressZone: findElement('progressZone'),
            progressBar:  findElement('progressBar'),
            phaseText:    findElement('phaseText'),
            errorText:    findElement('errorText')
        };
    }

    // ============================================================
    // INTERFACE
    // ============================================================
    function afficherBouton() {
        elements.btnUpload.style.display = 'block';
        elements.progressZone.style.display = 'none';
        elements.errorText.style.display = 'none';
    }
    
    function afficherProgression() {
        elements.btnUpload.style.display = 'none';
        elements.progressZone.style.display = 'flex';
        elements.errorText.style.display = 'none';
        elements.progressBar.style.width = '0%';
    }
    
    function afficherErreur(message) {
        elements.btnUpload.style.display = 'none';
        elements.progressZone.style.display = 'none';
        elements.errorText.style.display = 'block';
        elements.errorText.textContent = message;
        
        // Réafficher le bouton après 4 secondes
        setTimeout(afficherBouton, 4000);
    }
    
    function majPhase(phase, texte, pourcentage) {
        elements.phaseText.textContent = 'Phase ' + phase + '/2 : ' + texte;
        elements.progressBar.style.width = pourcentage + '%';
    }

    // ============================================================
    // SIGNATURE HMAC-SHA256 (v3.2.0 : calculée CÔTÉ SERVEUR)
    // La clé secrète n'est plus dans la page. On demande au serveur
    // (procédure WebDev DonneJetonUpload, enregistrée par
    // InitUploadCallback dans window._callbackSignatureBDD) un jeton
    // au format "AAAAMMJJHHMMSS|signature".
    // ============================================================
    function demanderJetonSignature() {
        if (typeof window._callbackSignatureBDD !== 'function') {
            console.error('UploadBDD: callback signature non enregistré (InitUploadCallback)');
            return null;
        }
        const jeton = window._callbackSignatureBDD();
        if (!jeton || jeton.indexOf('|') < 0) {
            console.error('UploadBDD: jeton de signature invalide:', jeton);
            return null;
        }
        const sep = jeton.indexOf('|');
        return {
            timestamp: jeton.substring(0, sep),
            signature: jeton.substring(sep + 1)
        };
    }

    // ============================================================
    // UPLOAD PRINCIPAL
    // ============================================================
    async function lancerUpload(fichier) {
        console.log('UploadBDD v3.2.0: Fichier sélectionné:', fichier.name, '- Taille:', fichier.size);
        
        // Vérifier la taille
        if (fichier.size > CONFIG.maxFileSize) {
            const maxMo = Math.round(CONFIG.maxFileSize / 1024 / 1024);
            afficherErreur('Fichier trop volumineux (max ' + maxMo + ' Mo)');
            return;
        }
        
        // ── Nom du fichier sans extension → WebDev ──
        const nomSansExtension = fichier.name.replace(/\.[^/.]+$/, '');
        if (typeof WebDevBridge !== 'undefined') {
            WebDevBridge.set('gsNomFichierImporte', nomSansExtension);
        }
        console.log('UploadBDD: Nom fichier transmis:', nomSansExtension);
        
        const tailleMo = fichier.size / (1024 * 1024);
        afficherProgression();
        
        try {
            // ========== PHASE 1 : Envoi multipart ==========
            majPhase(1, 'Envoi... 0%', 0);
            
            // Obtenir l'horodatage + la signature auprès du serveur
            const jeton = demanderJetonSignature();
            if (!jeton) {
                afficherErreur("Autorisation impossible : rechargez la page et réessayez.");
                return;
            }
            const timestamp = jeton.timestamp;
            const signature = jeton.signature;
            
            // Construire le FormData (multipart)
            const formData = new FormData();
            formData.append('FichierNom', fichier.name);
            formData.append('FichierFormat', fichier.name.split('.').pop().toLowerCase());
            formData.append('FichierContenu', fichier);
            
            console.log('UploadBDD: Envoi multipart en cours...');
            
            const reponse = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.timeout = 0;
                
                let intervalAnalyse = null;
                
                // Progression de l'envoi (Phase 1)
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        majPhase(1, 'Envoi... ' + pct + '%', pct);
                    }
                };
                
                // Envoi terminé = démarrer Phase 2 (Analyse)
                xhr.upload.onload = () => {
                    console.log('UploadBDD: Envoi terminé, démarrage Phase 2');
                    majPhase(2, 'Analyse... 0%', 0);
                    
                    // Animation estimée selon la taille
                    const dureeEstimee = Math.max(2, tailleMo * CONFIG.analyseSecondsPerMo);
                    const intervalMs = 100;
                    const totalSteps = (dureeEstimee * 1000) / intervalMs;
                    let step = 0;
                    
                    intervalAnalyse = setInterval(() => {
                        step++;
                        const progress = Math.min(95, Math.round((step / totalSteps) * 100));
                        majPhase(2, 'Analyse... ' + progress + '%', progress);
                    }, intervalMs);
                };
                
                // Réponse reçue = fin Phase 2
                xhr.onload = () => {
                    if (intervalAnalyse) clearInterval(intervalAnalyse);
                    majPhase(2, 'Terminé !', 100);
                    console.log('UploadBDD: Réponse reçue, status:', xhr.status);
                    resolve({ status: xhr.status, response: xhr.responseText });
                };
                
                xhr.onerror = () => {
                    if (intervalAnalyse) clearInterval(intervalAnalyse);
                    reject(new Error('Erreur réseau'));
                };
                
                xhr.ontimeout = () => {
                    if (intervalAnalyse) clearInterval(intervalAnalyse);
                    reject(new Error('Timeout'));
                };
                
                xhr.open('POST', CONFIG.urlWebservice, true);
                xhr.setRequestHeader('X-IdClient', CONFIG.idClient);
                xhr.setRequestHeader('X-IdContact', CONFIG.idContact);
                xhr.setRequestHeader('X-Timestamp', timestamp);
                xhr.setRequestHeader('X-Marketeam-Auth', signature);
                
                xhr.send(formData);
            });
            
            console.log('UploadBDD: Phase 2 terminée, status:', reponse.status);
            
            // Vérifier la réponse
            if (reponse.status === 200) {
                console.log('UploadBDD: Succès, stockage réponse');
                
                // Stocker la réponse
                if (typeof WebDevBridge !== 'undefined') {
                    WebDevBridge.set('_sUploadReponseJSON', reponse.response);
                }
                
                // Callback WebDev
                setTimeout(() => {
                    if (typeof window._callbackUploadBDD === 'function') {
                        window._callbackUploadBDD();
                    }
                    afficherBouton();
                }, 500);
                
            } else {
                throw new Error('Erreur serveur ' + reponse.status);
            }
            
        } catch (erreur) {
            console.error('UploadBDD: Erreur:', erreur.message);
            afficherErreur(erreur.message);
        }
    }

    // ============================================================
    // INITIALISATION (avec retry pour attendre l'iframe)
    // ============================================================
    let initRetryCount = 0;
    
    function tryInit() {
        initElements();
        
        if (!elements.btnUpload || !elements.inputFichier) {
            initRetryCount++;
            if (initRetryCount < CONFIG.maxInitRetries) {
                // iframe pas encore chargée, réessayer
                setTimeout(tryInit, CONFIG.initRetryDelay);
                return;
            }
            console.error('UploadBDD: Éléments DOM non trouvés après ' + CONFIG.maxInitRetries + ' tentatives');
            return;
        }
        
        // ── Attacher les événements ──
        // Note : les événements sont attachés depuis la page parente (hors sandbox)
        // sur les éléments DOM situés dans l'iframe (accessible via allow-same-origin)
        
        elements.btnUpload.addEventListener('click', () => {
            if (typeof window._callbackAvantUploadBDD === 'function') {
                window._callbackAvantUploadBDD();
            }
            elements.inputFichier.click();
        });
        
        elements.inputFichier.addEventListener('change', (e) => {
            const fichier = e.target.files[0];
            if (fichier) {
                lancerUpload(fichier);
            }
            e.target.value = '';
        });
        
        console.log('UploadBDD v3.2.0: Initialisé - Multipart via iframe bridge (max ' + Math.round(CONFIG.maxFileSize / 1024 / 1024) + ' Mo)');
    }

    // Démarrer avec délai pour laisser le temps à l'iframe du champ HTML de se charger
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(tryInit, 300));
    } else {
        setTimeout(tryInit, 300);
    }
    
})();
