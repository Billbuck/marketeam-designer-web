document.addEventListener('DOMContentLoaded', () => {
    /**
     * ╔══════════════════════════════════════════════════════════════════════════════╗
     * ║                        MARKETEAM DESIGNER - SCRIPT.JS                        ║
     * ║                         Éditeur VDP Multi-Zones                              ║
     * ╠══════════════════════════════════════════════════════════════════════════════╣
     * ║                                                                              ║
     * ║  TABLE DES MATIÈRES                                                          ║
     * ║  ─────────────────                                                           ║
     * ║                                                                              ║
     * ║  SECTION 1  : RÉFÉRENCES DOM ............................ ligne ~43         ║
     * ║  SECTION 2  : CONSTANTES ET CONFIGURATION ............... ligne ~194        ║
     * ║  SECTION 3  : CONFIGURATION CODES-BARRES (bwip-js) ...... ligne ~245        ║
     * ║  SECTION 4  : UTILITAIRES CODES-BARRES .................. ligne ~374        ║
     * ║  SECTION 5  : POLICES DYNAMIQUES ........................ ligne ~636        ║
     * ║  SECTION 6  : CONVERSIONS MM/PIXELS ET MARGES ........... ligne ~745        ║
     * ║  SECTION 7  : CONTRAINTES ZONES IMAGE (Surface/DPI) ..... ligne ~828        ║
     * ║  SECTION 8  : UPLOAD ET COMPRESSION IMAGE ............... ligne ~892        ║
     * ║  SECTION 9  : CALCUL DPI ET BADGES ...................... ligne ~1164       ║
     * ║  SECTION 10 : CONTRAINTES REDIMENSIONNEMENT IMAGE ....... ligne ~1501       ║
     * ║  SECTION 11 : SYSTÈME UNDO/REDO (Historique) ............ ligne ~1724       ║
     * ║  SECTION 12 : ÉTAT DU DOCUMENT ET HELPERS ............... ligne ~1913       ║
     * ║  SECTION 13 : CRÉATION DE ZONES ......................... ligne ~2121       ║
     * ║  SECTION 14 : AFFICHAGE DES ZONES (QR, Barcode, Image) .. ligne ~2646       ║
     * ║  SECTION 15 : FORMATAGE PARTIEL DU TEXTE ................ ligne ~3588       ║
     * ║  SECTION 16 : EVENT LISTENERS - FORMULAIRE .............. ligne ~4822       ║
     * ║  SECTION 17 : DRAG & DROP / REDIMENSIONNEMENT ........... ligne ~6271       ║
     * ║  SECTION 18 : SAISIE GÉOMÉTRIE (mm) ..................... ligne ~6586       ║
     * ║  SECTION 19 : IMPORT DEPUIS WEBDEV ...................... ligne ~6882       ║
     * ║  SECTION 20 : EXPORT VERS WEBDEV ........................ ligne ~7427       ║
     * ║  SECTION 21 : COMMUNICATION POSTMESSAGE ................. ligne ~7778       ║
     * ║  SECTION 22 : CHARGEMENT PAGE ET LOCALSTORAGE ........... ligne ~7904       ║
     * ║  SECTION 23 : NAVIGATION MULTIPAGE ...................... ligne ~8200       ║
     * ║  SECTION 24 : ZOOM ET PAN ............................... ligne ~8925       ║
     * ║  SECTION 25 : EXPORT PSMD (PRINTSHOP MAIL) ............. ligne ~14920      ║
     * ║                                                                              ║
     * ╠══════════════════════════════════════════════════════════════════════════════╣
     * ║  Version : 1.0.0                                                             ║
     * ║  Dernière modification : 18/12/2025                                          ║
     * ╚══════════════════════════════════════════════════════════════════════════════╝
     */

    // ═══════════════════════════════════════════════════════════════════════════════
    // DÉFINITIONS DE TYPES JSDOC (@typedef)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Ce bloc contient les définitions de types TypeScript/JSDoc pour l'éditeur VDP.
     * Ces types permettent aux IDE et IA d'offrir une meilleure autocomplétion
     * et une meilleure compréhension du code.
     */
    // ───────────────────────────────────────────────────────────────────────────────

    // --- STRUCTURES DE FORMAT DE DOCUMENT ---

    /**
     * @typedef {Object} DocumentFormatDefinition
     * @property {number} width - Largeur en pixels (96 DPI)
     * @property {number} height - Hauteur en pixels (96 DPI)
     * @property {string} name - Nom d'affichage du format
     * @description Définition d'un format de document en pixels.
     * @example
     * // Format A4 : { width: 794, height: 1123, name: 'A4' }
     */

    /**
     * @typedef {Object} DocumentFormatMmDefinition
     * @property {number} widthMm - Largeur en millimètres
     * @property {number} heightMm - Hauteur en millimètres
     * @property {string} name - Nom d'affichage du format
     * @description Définition d'un format de document en millimètres (dimensions exactes).
     * @example
     * // Format A4 : { widthMm: 210, heightMm: 297, name: 'A4' }
     */

    /**
     * @typedef {'A4'|'A3'|'A5'|'Letter'|'Legal'} FormatName
     * @description Identifiants des formats de document prédéfinis.
     */

    // --- STRUCTURES DE BORDURE ---

    /**
     * @typedef {Object} CmykData
     * @property {number} c - Cyan (0-100)
     * @property {number} m - Magenta (0-100)
     * @property {number} y - Jaune (0-100)
     * @property {number} k - Noir (0-100)
     * @description Valeurs CMJN natives pour impression.
     */

    /**
     * @typedef {Object} BorderData
     * @property {number} width - Épaisseur en pixels (0 = pas de bordure)
     * @property {string} color - Couleur hexadécimale (ex: '#000000')
     * @property {CmykData} [colorCmyk] - Couleur de bordure CMJN native (si saisie en CMJN)
     * @property {'solid'|'dashed'|'dotted'} style - Style du trait
     * @description Configuration de la bordure d'une zone.
     */

    // --- STRUCTURES SOURCE IMAGE ---

    /**
     * @typedef {Object} SourceData
     * @property {'fixe'|'champ'|'url'} type - Type de source ('fixe' = uploadée, 'champ' = fusion, 'url' = rétrocompat)
     * @property {string} [valeur] - URL (rétrocompat) ou nom du champ de fusion
     * @property {string|null} [imageBase64] - Données base64 de l'image compressée
     * @property {string|null} [nomOriginal] - Nom du fichier uploadé
     * @property {number|null} [largeurPx] - Largeur image compressée en pixels
     * @property {number|null} [hauteurPx] - Hauteur image compressée en pixels
     * @property {number|null} [poidsBrut] - Poids avant compression (octets)
     * @property {number|null} [poidsCompresse] - Poids après compression (octets)
     * @description Source d'image pour les zones de type 'image'.
     */

    /**
     * @typedef {Object} RedimensionnementData
     * @property {'initial'|'ajuster'|'couper'} mode - Mode d'affichage de l'image
     * @property {'left'|'center'|'right'} alignementH - Alignement horizontal
     * @property {'top'|'middle'|'bottom'} alignementV - Alignement vertical
     * @description Configuration du redimensionnement d'une zone image.
     */

    // --- STRUCTURES DE FORMATAGE TEXTE ---

    /**
     * @typedef {Object} TextFormattingAnnotation
     * @property {number} start - Index de début (caractère)
     * @property {number} end - Index de fin (caractère)
     * @property {Object} styles - Styles appliqués
     * @property {string} [styles.fontWeight] - Poids de police (ex: 'bold')
     * @property {string} [styles.textDecoration] - Décoration de texte (ex: 'underline')
     * @property {string} [styles.color] - Couleur du texte (hex)
     * @description Annotation de formatage partiel pour le texte riche.
     */

    // --- STRUCTURES DE ZONES ---

    /**
     * @typedef {Object} BaseZoneData
     * @property {'textQuill'|'qr'|'barcode'|'image'} type - Type de zone
     * @property {number} [x] - Position X en pixels (depuis le DOM)
     * @property {number} [y] - Position Y en pixels (depuis le DOM)
     * @property {number} [w] - Largeur en pixels (depuis le DOM)
     * @property {number} [h] - Hauteur en pixels (depuis le DOM)
     * @property {number} [xMm] - Position X en mm (optionnel, depuis JSON WebDev)
     * @property {number} [yMm] - Position Y en mm (optionnel, depuis JSON WebDev)
     * @property {number} [wMm] - Largeur en mm (optionnel, depuis JSON WebDev)
     * @property {number} [hMm] - Hauteur en mm (optionnel, depuis JSON WebDev)
     * @property {boolean} [locked] - Zone verrouillée (non modifiable)
     * @property {number} [zIndex] - Ordre d'empilement (z-index CSS)
     * @description Propriétés communes à toutes les zones.
     */

    /**
     * @typedef {Object} TextQuillZoneData
     * @property {'textQuill'} type - Type de zone (toujours 'textQuill')
     * @property {string} [content] - Contenu texte (fallback). Le contenu Quill est édité dans la zone.
     * @property {Object} [quillDelta] - Contenu Quill au format Delta (pour persistance)
     * @property {string} font - Police par défaut (ex: 'Roboto')
     * @property {number} size - Taille par défaut en points
     * @property {string} color - Couleur du texte (hex)
     * @property {CmykData} [colorCmyk] - Couleur du texte CMJN native (si saisie en CMJN)
     * @property {'left'|'center'|'right'|'justify'} align - Alignement horizontal
     * @property {'top'|'middle'|'bottom'} valign - Alignement vertical
     * @property {string} bgColor - Couleur de fond (hex)
     * @property {CmykData} [bgColorCmyk] - Couleur de fond CMJN native (si saisie en CMJN)
     * @property {boolean} isTransparent - Fond transparent (true = ignore bgColor)
     * @property {boolean} [bold] - (OBSOLÈTE) Gras global "zone entière" supprimé (utiliser Quill bold)
     * @property {number} lineHeight - Interlignage
     * @property {boolean} locked - Zone verrouillée
     * @property {boolean} copyfit - Copy fitting activé
     * @property {0|1} emptyLines - Gestion lignes vides (0=Conserver, 1=Variables uniquement)
     * @property {number} zIndex - Ordre d'empilement
     * @property {BorderData} border - Configuration de la bordure
     * @description Zone de texte Quill (WYSIWYG).
     */

    /**
     * @typedef {Object} QrZoneData
     * @property {'qr'} type - Type de zone (toujours 'qr')
     * @property {string} qrColor - Couleur du QR code (hex)
     * @property {string} bgColor - Couleur de fond (hex)
     * @property {CmykData} [bgColorCmyk] - Couleur de fond CMJN native (si saisie en CMJN)
     * @property {boolean} locked - Zone verrouillée
     * @property {number} zIndex - Ordre d'empilement
     * @description Zone de code QR (contenu géré par champ de fusion).
     */

    /**
     * @typedef {Object} ImageZoneData
     * @property {'image'} type - Type de zone (toujours 'image')
     * @property {SourceData} source - Source de l'image
     * @property {RedimensionnementData} redimensionnement - Mode de redimensionnement
     * @property {string} bgColor - Couleur de fond (hex)
     * @property {CmykData} [bgColorCmyk] - Couleur de fond CMJN native (si saisie en CMJN)
     * @property {boolean} isTransparent - Fond transparent
     * @property {boolean} locked - Zone verrouillée
     * @property {number} rotation - Rotation en degrés
     * @property {number} zIndex - Ordre d'empilement
     * @property {BorderData} border - Configuration de la bordure
     * @description Zone image (fixe ou dynamique via fusion).
     */

    /**
     * @typedef {Object} BarcodeZoneData
     * @property {'barcode'} type - Type de zone (toujours 'barcode')
     * @property {string} nom - Nom de la zone code-barres
     * @property {string} typeCodeBarres - Type de code (code128, ean13, qrcode, datamatrix, etc.)
     * @property {string} champFusion - Nom du champ de fusion (sans les @)
     * @property {'aucun'|'dessous'} texteLisible - Affichage du texte lisible
     * @property {number} taillePolice - Taille du texte lisible en points
     * @property {string} couleur - Couleur du code-barres (hex)
     * @property {string} bgColor - Couleur de fond (hex)
     * @property {CmykData} [bgColorCmyk] - Couleur de fond CMJN native (si saisie en CMJN)
     * @property {boolean} locked - Zone verrouillée
     * @property {number} zIndex - Ordre d'empilement
     * @description Zone code-barres 1D ou 2D.
     */

    /**
     * @typedef {TextZoneData|TextQuillZoneData|QrZoneData|ImageZoneData|BarcodeZoneData} ZoneData
     * @description Union des types de zones possibles.
     */

    /**
     * @typedef {Object.<string, ZoneData>} ZonesCollection
     * @description Collection de zones indexées par leur ID (ex: 'zone-1', 'zone-2').
     */

    // --- STRUCTURE PAGE ---

    /**
     * @typedef {Object} PageData
     * @property {string} id - Identifiant unique de la page (ex: 'page-1')
     * @property {string} name - Nom de la page ('Recto', 'Verso', etc.)
     * @property {string} image - Chemin vers l'image de fond
     * @property {FormatName} format - Format de la page (A4, A3, etc.)
     * @property {number} width - Largeur en pixels
     * @property {number} height - Hauteur en pixels
     * @property {ZonesCollection} zones - Collection des zones de cette page
     * @description Structure d'une page du document.
     */

    // --- STRUCTURE ÉTAT DU DOCUMENT ---

    /**
     * @typedef {Object} FormatDocumentData
     * @property {number} largeurMm - Largeur du document en mm
     * @property {number} hauteurMm - Hauteur du document en mm
     * @property {number} [margeSecuriteMm] - Marge de sécurité en mm
     * @property {{actif: boolean, valeurMm: number}} [fondPerdu] - Configuration fond perdu
     * @property {{actif: boolean}} [traitsCoupe] - Configuration traits de coupe
     * @description Métadonnées de format du document (depuis JSON WebDev).
     */

    /**
     * @typedef {Object} DocumentState
     * @property {number} currentPageIndex - Index de la page courante (0 = Recto, 1 = Verso)
     * @property {PageData[]} pages - Tableau des pages du document
     * @property {number} zoneCounter - Compteur global pour générer des IDs uniques
     * @property {FormatDocumentData} [formatDocument] - Métadonnées de format (optionnel)
     * @description État global du document de l'éditeur VDP.
     * @example
     * // Structure de documentState :
     * // {
     * //   currentPageIndex: 0,
     * //   pages: [
     * //     { id: 'page-1', name: 'Recto', zones: {...}, width: 794, height: 1123 },
     * //     { id: 'page-2', name: 'Verso', zones: {...}, width: 794, height: 1123 }
     * //   ],
     * //   zoneCounter: 5
     * // }
     */

    // --- STRUCTURE HISTORIQUE (UNDO/REDO) ---

    /**
     * @typedef {Object} HistoryManager
     * @property {DocumentState[]} states - Tableau des snapshots de documentState
     * @property {number} currentIndex - Position actuelle dans l'historique (-1 si vide)
     * @property {number} maxStates - Limite mémoire (nombre max de snapshots)
     * @property {boolean} isRestoring - Flag pour éviter de sauvegarder pendant une restauration
     * @property {boolean} isLoadingForm - Flag pour éviter de sauvegarder pendant le chargement du formulaire
     * @description Gestionnaire d'historique pour Undo/Redo.
     */

    // --- TYPES DE CODE-BARRES ---

    /**
     * @typedef {Object} BarcodeTypeDefinition
     * @property {string} id - Identifiant interne (ex: 'code128', 'ean13', 'qrcode')
     * @property {string} label - Libellé d'affichage (ex: 'Code 128', 'EAN-13')
     * @property {'1d'|'2d'} category - Catégorie du code (1D = barres, 2D = matrice)
     * @description Définition d'un type de code-barres supporté.
     */

    /**
     * @typedef {Object} BarcodeBwipConfig
     * @property {string} bcid - Identifiant bwip-js
     * @property {string} sampleValue - Valeur d'exemple pour la prévisualisation
     * @property {boolean} is2D - Est un code 2D (QR, DataMatrix)
     * @description Configuration bwip-js pour un type de code-barres.
     */

    // --- STRUCTURES JSON WEBDEV (IMPORT/EXPORT) ---

    /**
     * @typedef {Object} GeometrieJsonWebDev
     * @property {number} xMm - Position X en mm
     * @property {number} yMm - Position Y en mm
     * @property {number} largeurMm - Largeur en mm
     * @property {number} hauteurMm - Hauteur en mm
     * @description Géométrie d'une zone au format JSON WebDev.
     */

    /**
     * @typedef {Object} StyleJsonWebDev
     * @property {string} police - Nom de la police
     * @property {number} taillePt - Taille en points
     * @property {string} couleur - Couleur hex
     * @property {boolean} gras - (OBSOLÈTE) Gras "zone entière" (le gras est géré via formatage partiel)
     * @property {number} interligne - Facteur d'interlignage
     * @property {'left'|'center'|'right'|'justify'} alignementH - Alignement horizontal
     * @property {'top'|'middle'|'bottom'} alignementV - Alignement vertical
     * @description Style typographique au format JSON WebDev.
     */

    /**
     * @typedef {Object} FondJsonWebDev
     * @property {boolean} transparent - Fond transparent
     * @property {string} couleur - Couleur de fond hex
     * @description Configuration du fond au format JSON WebDev.
     */

    /**
     * @typedef {Object} BordureJsonWebDev
     * @property {number} epaisseur - Épaisseur en pixels
     * @property {string} couleur - Couleur hex
     * @property {'solid'|'dashed'} style - Style du trait
     * @description Configuration de bordure au format JSON WebDev.
     */

    /**
     * @typedef {Object} CopyfittingJsonWebDev
     * @property {boolean} actif - Copyfitting activé
     * @property {number} tailleMinimum - Taille minimale en points
     * @property {boolean} autoriserRetourLigne - Autoriser le retour à la ligne
     * @description Configuration du copyfitting au format JSON WebDev.
     */

    /**
     * @typedef {Object} FormatagePartielJsonWebDev
     * @property {number} debut - Index de début (caractère)
     * @property {number} fin - Index de fin (caractère)
     * @property {Object} styles - Styles appliqués
     * @property {boolean} [styles.gras] - Gras
     * @property {boolean} [styles.souligne] - Souligné
     * @property {string} [styles.couleur] - Couleur hex
     * @description Annotation de formatage partiel au format JSON WebDev.
     */

    /**
     * @typedef {Object} SourceImageJsonWebDev
     * @property {'fixe'|'champ'|'url'} type - Type de source
     * @property {string} valeur - URL ou nom du champ
     * @description Source d'image au format JSON WebDev.
     */

    /**
     * @typedef {Object} RedimensionnementJsonWebDev
     * @property {'initial'|'ajuster'|'couper'} mode - Mode d'affichage
     * @property {'left'|'center'|'right'} alignementH - Alignement horizontal
     * @property {'top'|'middle'|'bottom'} alignementV - Alignement vertical
     * @description Mode de redimensionnement au format JSON WebDev.
     */

    /**
     * @typedef {Object} ZoneTexteJsonWebDev
     * @property {string} id - Identifiant de la zone
     * @property {number} page - Numéro de page (1-based)
     * @property {string} nom - Nom de la zone
     * @property {number} niveau - Z-index
     * @property {number} rotation - Rotation en degrés
     * @property {boolean} verrouille - Zone verrouillée
     * @property {boolean} systeme - Zone système (non modifiable par l'utilisateur)
     * @property {string} systemeLibelle - Libellé système
     * @property {boolean} imprimable - Zone imprimable
     * @property {number|boolean} supprimerLignesVides - Gestion lignes vides (0=Conserver, 1=Variables uniquement, ou booléen legacy)
     * @property {GeometrieJsonWebDev} geometrie - Géométrie en mm
     * @property {string} contenu - Contenu textuel
     * @property {FormatagePartielJsonWebDev[]} formatage - Formatage partiel
     * @property {'text'|'textQuill'} [typeZone] - Type interne de zone texte (optionnel, pour roundtrip Designer)
     * @property {Object} [quillDelta] - Contenu Quill au format Delta (optionnel, pour roundtrip Designer)
     * @property {StyleJsonWebDev} style - Style typographique
     * @property {FondJsonWebDev} fond - Configuration du fond
     * @property {BordureJsonWebDev} bordure - Configuration de la bordure
     * @property {CopyfittingJsonWebDev} copyfitting - Configuration du copyfitting
     * @description Zone texte au format JSON WebDev (import/export).
     */

    /**
     * @typedef {Object} ZoneQRJsonWebDev
     * @property {string} id - Identifiant de la zone
     * @property {number} page - Numéro de page (1-based)
     * @property {string} nom - Nom de la zone
     * @property {number} niveau - Z-index
     * @property {number} rotation - Rotation en degrés
     * @property {boolean} verrouille - Zone verrouillée
     * @property {boolean} systeme - Zone système
     * @property {string} systemeLibelle - Libellé système
     * @property {boolean} imprimable - Zone imprimable
     * @property {GeometrieJsonWebDev} geometrie - Géométrie en mm
     * @property {string} typeCode - Type de code (toujours "QRCode")
     * @property {string} contenu - Contenu/URL à encoder
     * @property {{code: string, fond: string}} couleurs - Couleurs du QR
     * @description Zone QR Code au format JSON WebDev.
     */

    /**
     * @typedef {Object} ZoneCodeBarresJsonWebDev
     * @property {string} id - Identifiant de la zone
     * @property {number} page - Numéro de page (1-based)
     * @property {string} nom - Nom de la zone
     * @property {number} niveau - Z-index
     * @property {number} rotation - Rotation en degrés
     * @property {boolean} verrouille - Zone verrouillée
     * @property {boolean} systeme - Zone système
     * @property {string} systemeLibelle - Libellé système
     * @property {boolean} imprimable - Zone imprimable
     * @property {GeometrieJsonWebDev} geometrie - Géométrie en mm
     * @property {string} typeCodeBarres - Type de code (code128, code39, ean13, datamatrix, etc.)
     * @property {string} champFusion - Nom du champ de fusion (sans @), vide si statique
     * @property {string} valeurStatique - Valeur statique si pas de champ fusion
     * @property {string} texteLisible - Affichage du texte ('aucun' ou 'dessous')
     * @property {number} taillePolice - Taille du texte lisible en points
     * @property {string} couleur - Couleur du code hex
     * @property {string} couleurFond - Couleur de fond hex
     * @property {boolean} transparent - Fond transparent
     * @description Zone Code-barres au format JSON WebDev.
     */

    /**
     * @typedef {Object} ZoneImageJsonWebDev
     * @property {string} id - Identifiant de la zone
     * @property {number} page - Numéro de page (1-based)
     * @property {string} nom - Nom de la zone
     * @property {number} niveau - Z-index
     * @property {number} rotation - Rotation en degrés
     * @property {boolean} verrouille - Zone verrouillée
     * @property {boolean} systeme - Zone système
     * @property {string} systemeLibelle - Libellé système
     * @property {boolean} imprimable - Zone imprimable
     * @property {GeometrieJsonWebDev} geometrie - Géométrie en mm
     * @property {SourceImageJsonWebDev} source - Source de l'image
     * @property {RedimensionnementJsonWebDev} redimensionnement - Mode de redimensionnement
     * @property {FondJsonWebDev} fond - Configuration du fond
     * @property {BordureJsonWebDev} bordure - Configuration de la bordure
     * @description Zone image au format JSON WebDev (import/export).
     */

    /**
     * @typedef {Object} FormatDocumentJsonWebDev
     * @property {number} largeurMm - Largeur en mm
     * @property {number} hauteurMm - Hauteur en mm
     * @property {number} [margeSecuriteMm] - Marge de sécurité en mm
     * @property {{actif: boolean, valeurMm: number}} [fondPerdu] - Fond perdu
     * @property {{actif: boolean}} [traitsCoupe] - Traits de coupe
     * @description Format du document au format JSON WebDev.
     */

    /**
     * @typedef {Object} DocumentJsonWebDev
     * @property {Object} [identification] - Métadonnées du document
     * @property {FormatDocumentJsonWebDev} [formatDocument] - Dimensions du document
     * @property {Array} [pages] - Pages du document
     * @property {ZoneTexteJsonWebDev[]} [zonesTexte] - Zones de texte
     * @property {ZoneTextQuillJsonWebDev[]} [zonesTextQuill] - Zones texte Quill (Delta + RTF)
     * @property {ZoneQRJsonWebDev[]} [zonesQR] - Zones QR Code
     * @property {ZoneCodeBarresJsonWebDev[]} [zonesCodeBarres] - Zones Code-barres
     * @property {ZoneImageJsonWebDev[]} [zonesImage] - Zones image
     * @description Document complet au format JSON WebDev.
     */

    /**
     * @typedef {Object} ZoneTextQuillJsonWebDev
     * @property {string} id - Identifiant de la zone (ex: "zone-77")
     * @property {'textQuill'} type - Type (toujours "textQuill")
     * @property {{x_mm: number, y_mm: number, width_mm: number, height_mm: number}} geometry - Géométrie en mm
     * @property {Object|string|null} content_quill - Delta Quill ({ops:[...]}) OU texte brut (cas 1)
     * @property {string} content_rtf - Contenu RTF (cas 2/3)
     * @property {{font?: string, size_pt?: number, color?: string, align?: string, valign?: string, line_height?: number}} style - Style global
     * @property {{width_px?: number, color?: string, style?: string}} border - Bordure
     * @description Zone texte Quill au format JSON WebDev (double format Delta + RTF).
     */

    // --- STRUCTURES POLICES (DISPONIBLES / UTILISÉES) ---

    /**
     * @typedef {Object} PoliceDisponible
     * @property {number} id - ID en base de données
     * @property {string} nom - Nom affiché (ex: "Roboto", "Roboto Thin")
     * @property {string} url - URL du fichier police principal
     * @property {number} weight - Poids CSS (100-950)
     * @property {string} style - Style CSS ("normal" ou "italic")
     * @property {string|null} boldUrl - URL variante Bold ou null
     * @property {string|null} italicUrl - URL variante Italic ou null
     * @property {string|null} boldItalicUrl - URL variante BoldItalic ou null
     */

    /**
     * @typedef {Object} PoliceUtilisee
     * @property {string} nom - Nom de la police
     * @property {Object} urls - URLs des variantes utilisées
     * @property {string|null} urls.regular - URL de la variante regular (null si inconnue)
     * @property {string|null} urls.bold - URL de la variante bold ou null
     * @property {string|null} urls.italic - URL de la variante italic ou null
     * @property {string|null} urls.boldItalic - URL de la variante boldItalic ou null
     */

    /**
     * @typedef {Object} ChampFusion
     * @property {string} nom - Code technique du champ (ex: "NOM", "CIVILITE") - utilisé pour @NOM@
     * @property {string} libelle - Libellé affiché à l'utilisateur (ex: "Nom", "Civilité")
     * @property {'TXT'|'SYS'|'IMG'} type - Type de champ (TXT=texte BDD, SYS=système, IMG=image)
     * @property {number} ordre - Ordre d'affichage (tri croissant)
     * @description Structure d'un champ de fusion/personnalisation provenant de la BDD.
     * @example
     * // Champ texte standard
     * { nom: "NOM", libelle: "Nom", type: "TXT", ordre: 2 }
     * // Variable système
     * { nom: "SEQUENTIEL", libelle: "N° séquentiel", type: "SYS", ordre: 20 }
     * // Champ image dynamique
     * { nom: "LOGO", libelle: "Logo entreprise", type: "IMG", ordre: 30 }
     */

    // --- STRUCTURES APERÇU DONNÉES ---

    /**
     * @typedef {Object.<string, string>} EchantillonData
     * @description Un enregistrement d'échantillon pour l'aperçu.
     * Les clés correspondent aux noms des champs de fusion (ex: "NOM", "PRENOM").
     * Les valeurs sont les données textuelles à afficher.
     * @example
     * // Enregistrement typique
     * {
     *   "CIVILITE": "Monsieur",
     *   "NOM": "DUPONT",
     *   "PRENOM": "Jean",
     *   "ADRESSE1": "12 rue des Lilas",
     *   "CP": "75009",
     *   "VILLE": "PARIS"
     * }
     */

    /**
     * @typedef {Object} ChampValeurWebDev
     * @property {string} nom - Nom du champ (ex: "CIVILITE", "NOM")
     * @property {string} valeur - Valeur du champ (ex: "Monsieur", "DUPONT")
     */

    /**
     * @typedef {Object} EnregistrementWebDev
     * @property {ChampValeurWebDev[]} enregistrement - Tableau des paires nom/valeur
     */

    /**
     * @typedef {Object} DocumentJsonWebDev
     * @property {Object} [identification] - Identification du document
     * @property {Object} [formatDocument] - Format et dimensions
     * @property {ChampFusion[]} [champsFusion] - Champs de fusion disponibles
     * @property {EchantillonData[]} [donneesApercu] - Échantillons de données pour l'aperçu
     * @property {Object[]} [polices] - Polices disponibles
     * @property {Object[]} [pages] - Pages du document
     * @property {Object[]} [zonesTexte] - Zones de texte
     * @property {Object[]} [zonesTextQuill] - Zones texte Quill
     * @property {Object[]} [zonesCodeBarres] - Zones codes-barres
     * @property {Object[]} [zonesImage] - Zones images
     * @description Structure complète du document JSON envoyé par WebDev.
     */

    /**
     * @typedef {Object} PreviewState
     * @property {boolean} active - Mode aperçu actif ou non
     * @property {number} currentIndex - Index de l'enregistrement courant (0-based)
     * @property {Map<string, Object>} savedContents - Contenus originaux sauvegardés par zone
     * @description État du mode aperçu de fusion.
     */

    // ─────────────────────────── FIN DÉFINITIONS DE TYPES ──────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 1 : RÉFÉRENCES DOM
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Récupération de tous les éléments DOM utilisés dans l'application.
     * Ces références sont utilisées tout au long du script pour manipuler l'interface.
     * 
     * Contenu :
     *   - Éléments principaux (page, workspace, boutons)
     *   - Inputs du formulaire (texte, image, code-barres)
     *   - Contrôles de zoom et historique
     *   - Éléments de géométrie
     */
    // ───────────────────────────────────────────────────────────────────────────────

    const a4Page = document.getElementById('a4-page');
    const workspace = document.querySelector('.workspace');
    const workspaceCanvas = document.querySelector('.workspace-canvas');
    const btnAddTextQuill = document.getElementById('btn-add-zone-quill');
    const btnAddQr = document.getElementById('btn-add-qr');
    const btnAddImage = document.getElementById('btn-add-image');
    const btnDelete = document.getElementById('btn-delete-zone');
    const btnReset = document.getElementById('btn-reset');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnExportPsmd = document.getElementById('btn-export-psmd');
    const btnCheck = document.getElementById('btn-check');
    const btnImportJson = document.getElementById('btn-import-json');
    const inputImportJson = document.getElementById('input-import-json');
    const coordsPanel = null; // SUPPRIMÉ - était #coords-panel
    
    // Boutons et éléments d'historique (Undo/Redo)
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const historyPositionEl = document.getElementById('history-position');
    const historyTotalEl = document.getElementById('history-total');
    const undoRedoToast = document.getElementById('undo-redo-toast');
    const lblSelected = null; // SUPPRIMÉ - était #lbl-selected-zone
    
    // Contrôles de zoom
    const zoomSlider = document.getElementById('zoom-slider');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const zoomValue = document.getElementById('zoom-value');

    // Sidebar et toggle (nouvelle sidebar POC)
    /** @type {HTMLElement|null} Container principal de la sidebar */
    const sidebar = document.getElementById('sidebar');
    /** @type {HTMLButtonElement|null} Bouton toggle pour réduire/agrandir la sidebar */
    const sidebarToggle = document.getElementById('sidebar-toggle');
    /** @type {HTMLElement|null} Tooltip global de la sidebar */
    const sidebarTooltip = document.getElementById('sidebar-tooltip');

    // Sections de la sidebar
    /** @type {HTMLElement|null} Section Actions dans la sidebar */
    const actionsSection = document.getElementById('actions-section');
    /** @type {HTMLElement|null} Section Historique dans la sidebar */
    const historySection = document.getElementById('history-section');
    /** @type {HTMLElement|null} Section Position dans la sidebar */
    const positionSection = document.getElementById('position-section');
    /** @type {HTMLElement|null} Section Outils dans la sidebar */
    const toolsSection = document.getElementById('tools-section');
    /** @type {HTMLElement|null} Section Zoom dans la sidebar */
    const zoomSection = document.getElementById('zoom-section');
    
    // Boutons Position (z-index)
    /** @type {HTMLButtonElement|null} Bouton Premier plan (devant tout) */
    const btnBringFront = document.getElementById('btn-bring-front');
    /** @type {HTMLButtonElement|null} Bouton Arrière-plan (derrière tout) */
    const btnSendBack = document.getElementById('btn-send-back');
    /** @type {HTMLButtonElement|null} Bouton Avancer d'un niveau (dessus) */
    const btnBringForward = document.getElementById('btn-bring-forward');
    /** @type {HTMLButtonElement|null} Bouton Reculer d'un niveau (dessous) */
    const btnSendBackward = document.getElementById('btn-send-backward');

    // Inputs du formulaire (SUPPRIMÉS - ancien panneau de propriétés)
    const inputContent = null; // SUPPRIMÉ
    const inputFont = null; // SUPPRIMÉ
    const inputSize = null; // SUPPRIMÉ
    const inputColor = null; // SUPPRIMÉ
    const inputAlign = null; // SUPPRIMÉ
    const inputValign = null; // SUPPRIMÉ
    const inputBgColor = null; // SUPPRIMÉ
    const chkTransparent = null; // SUPPRIMÉ
    const chkLock = null; // SUPPRIMÉ
    const chkCopyfit = null; // SUPPRIMÉ
    const inputLineHeight = null; // SUPPRIMÉ
    
    // Boutons de formatage partiel (SUPPRIMÉS)
    const btnFormatBold = null; // SUPPRIMÉ
    const btnFormatColor = null; // SUPPRIMÉ
    const btnFormatClear = null; // SUPPRIMÉ
    
    // Input color caché pour le formatage de texte
    const colorPickerInput = document.getElementById('color-picker-input');
    
    // Inputs de bordure (SUPPRIMÉS)
    const inputBorderWidth = null; // SUPPRIMÉ
    const inputBorderWidthDisplay = null; // SUPPRIMÉ
    const inputBorderColor = null; // SUPPRIMÉ
    const inputBorderStyle = null; // SUPPRIMÉ
    
    // Boutons d'arrangement (z-index) (SUPPRIMÉS)
    const btnToFront = null; // SUPPRIMÉ
    const btnForward = null; // SUPPRIMÉ
    const btnBackward = null; // SUPPRIMÉ
    const btnToBack = null; // SUPPRIMÉ
    
    // Contrôle lignes vides (SUPPRIMÉS)
    const inputEmptyLines = null; // SUPPRIMÉ
    const emptyLinesSection = null; // SUPPRIMÉ
    
    // Inputs pour zones image (SUPPRIMÉS)
    const imagePropertiesSection = null; // SUPPRIMÉ
    const textPropertiesSection = null; // SUPPRIMÉ
    
    // Inputs pour zones code-barres (SUPPRIMÉS)
    const barcodePropertiesSection = null; // SUPPRIMÉ
    const inputBarcodeName = null; // SUPPRIMÉ
    const inputBarcodeType = null; // SUPPRIMÉ
    // inputBarcodeField est déclaré plus bas (ligne ~829) avec getElementById sous le nom barcodeInputField
    // const inputBarcodeField = null; // SUPPRIMÉ - DOUBLON
    const inputBarcodeReadable = null; // SUPPRIMÉ
    const barcodeReadableGroup = null; // SUPPRIMÉ
    const inputBarcodeFontsize = null; // SUPPRIMÉ
    const barcodeFontsizeGroup = null; // SUPPRIMÉ
    const inputBarcodeColor = null; // SUPPRIMÉ
    
    // Note : Les références DOM pour les zones image sont maintenant dans la section
    // "Toolbar Image (POC)" plus bas (lignes ~700+)
    
    // Bouton Ajuster au contenu (SUPPRIMÉ)
    const btnSnapToContent = null; // SUPPRIMÉ
    
    // Section déplacement de zone vers une autre page (SUPPRIMÉS)
    const zonePageSection = null; // SUPPRIMÉ
    const inputZonePage = null; // SUPPRIMÉ
    const zonePageLock = null; // SUPPRIMÉ
    
    // Navigation pages dynamique
    const pagesSection = document.getElementById('pages-section');
    const pageNavContainer = document.getElementById('page-nav-container');

    // Toolbar Quill (floating)
    const quillToolbar = document.getElementById('quill-toolbar');
    const quillToolbarHeader = document.getElementById('quill-toolbar-header');
    const quillToolbarCloseBtn = document.getElementById('quill-toolbar-close');

    // Mini-toolbar contextuelle (Phase 5 - formatage partiel Quill)
    const miniToolbar = document.getElementById('mini-toolbar');
    const btnPartialBold = document.getElementById('btn-partial-bold');
    const btnMiniItalic = document.getElementById('btn-mini-italic');
    const btnPartialUnderline = document.getElementById('btn-partial-underline');
    const btnPartialColor = document.getElementById('btn-partial-color');
    const partialColorPicker = document.getElementById('partial-color-picker');
    
    // Contrôles toolbar Quill (IDs préfixés "quill-")
    const quillChkLocked = document.getElementById('quill-chk-locked');
    const quillInputFont = document.getElementById('quill-input-font');
    /** @type {HTMLSelectElement|null} Dropdown page (recto/verso) pour zones textQuill */
    const quillInputPage = document.getElementById('quill-input-page');
    const quillInputSize = document.getElementById('quill-input-size');
    const quillInputColor = document.getElementById('quill-input-color');
    const quillColorValue = document.getElementById('quill-color-value');
    
    const quillAlignHGroup = document.getElementById('quill-align-h-group');
    const quillAlignVGroup = document.getElementById('quill-align-v-group');
    const quillInputLineHeight = document.getElementById('quill-input-line-height');
    
    const quillChkTransparent = document.getElementById('quill-chk-transparent');
    const quillInputBgColor = document.getElementById('quill-input-bg-color');
    const quillBgColorRow = document.getElementById('quill-bg-color-row');
    const quillBgColorValue = document.getElementById('quill-bg-color-value');
    
    const quillInputBorderWidth = document.getElementById('quill-input-border-width');
    const quillInputBorderColor = document.getElementById('quill-input-border-color');
    const quillInputBorderStyle = document.getElementById('quill-input-border-style');
    const quillBorderColorRow = document.getElementById('quill-border-color-row');
    const quillBorderStyleRow = document.getElementById('quill-border-style-row');
    
    const quillValX = document.getElementById('quill-val-x');
    const quillValY = document.getElementById('quill-val-y');
    const quillValW = document.getElementById('quill-val-w');
    const quillValH = document.getElementById('quill-val-h');
    
    const quillChkCopyfit = document.getElementById('quill-chk-copyfit');
    const quillInputEmptyLines = document.getElementById('quill-input-empty-lines');
    
    // Wrappers pour les checkboxes POC (design Marketeam)
    const quillChkLockedWrapper = document.getElementById('quill-chk-locked-wrapper');
    const quillChkTransparentWrapper = document.getElementById('quill-chk-transparent-wrapper');
    const quillChkCopyfitWrapper = document.getElementById('quill-chk-copyfit-wrapper');
    
    // Color swatches POC
    const quillColorSwatch = document.getElementById('quill-color-swatch');
    const quillBgColorSwatch = document.getElementById('quill-bg-color-swatch');
    const quillBorderColorSwatch = document.getElementById('quill-border-color-swatch');
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // Toolbar Image (POC) - Références DOM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /** @type {HTMLElement|null} Container principal de la toolbar image */
    const imageToolbar = document.getElementById('image-toolbar');
    /** @type {HTMLElement|null} Header déplaçable de la toolbar image */
    const imageToolbarHeader = document.getElementById('image-toolbar-header');
    /** @type {HTMLElement|null} Bouton fermer de la toolbar image */
    const imageToolbarCloseBtn = document.getElementById('image-toolbar-close');
    
    // Contrôles Section Page
    /** @type {HTMLSelectElement|null} Dropdown page (recto/verso) */
    const imageInputPage = document.getElementById('image-input-page');
    
    // Contrôles Section Source
    /** @type {HTMLSelectElement|null} Dropdown type source (fixe/champ) */
    const imageInputSourceType = document.getElementById('image-input-source-type');
    /** @type {HTMLButtonElement|null} Bouton importer image */
    const imageBtnImport = document.getElementById('image-btn-import');
    /** @type {HTMLButtonElement|null} Bouton vider image */
    const imageBtnClear = document.getElementById('image-btn-clear');
    /** @type {HTMLElement|null} Zone info fichier */
    const imageFileInfo = document.getElementById('image-file-info');
    /** @type {HTMLElement|null} Groupe upload (visible si type = fixe) */
    const imageUploadGroup = document.getElementById('image-upload-group');
    /** @type {HTMLElement|null} Groupe champ de fusion (visible si type = champ) */
    const imageChampGroup = document.getElementById('image-champ-group');
    /** @type {HTMLSelectElement|null} Dropdown champ de fusion */
    const imageInputChamp = document.getElementById('image-input-champ');
    /** @type {HTMLInputElement|null} Input fichier caché */
    const imageFileInput = document.getElementById('image-file-input');
    
    // Contrôles Section Résolution
    /** @type {HTMLElement|null} Indicateur DPI */
    const imageDpiIndicator = document.getElementById('image-dpi-indicator');
    
    // Contrôles Section Affichage
    /** @type {HTMLSelectElement|null} Dropdown mode affichage */
    const imageInputMode = document.getElementById('image-input-mode');
    /** @type {HTMLElement|null} Toggle-group alignement horizontal */
    const imageAlignHGroup = document.getElementById('image-align-h-group');
    /** @type {HTMLElement|null} Toggle-group alignement vertical */
    const imageAlignVGroup = document.getElementById('image-align-v-group');
    
    // Contrôles Section Fond
    /** @type {HTMLElement|null} Wrapper checkbox transparent */
    const imageChkTransparentWrapper = document.getElementById('image-chk-transparent-wrapper');
    /** @type {HTMLInputElement|null} Checkbox transparent (hidden) */
    const imageChkTransparent = document.getElementById('image-chk-transparent');
    /** @type {HTMLElement|null} Row couleur fond (conditionnelle) */
    const imageBgColorRow = document.getElementById('image-bg-color-row');
    /** @type {HTMLInputElement|null} Input couleur fond */
    const imageInputBgColor = document.getElementById('image-input-bg-color');
    /** @type {HTMLElement|null} Swatch couleur fond */
    const imageBgColorSwatch = document.getElementById('image-bg-color-swatch');
    
    // Contrôles Section Bordure
    /** @type {HTMLInputElement|null} Spinner épaisseur bordure */
    const imageInputBorderWidth = document.getElementById('image-input-border-width');
    /** @type {HTMLElement|null} Row style bordure (conditionnelle) */
    const imageBorderStyleRow = document.getElementById('image-border-style-row');
    /** @type {HTMLSelectElement|null} Select style bordure */
    const imageInputBorderStyle = document.getElementById('image-input-border-style');
    /** @type {HTMLElement|null} Row couleur bordure (conditionnelle) */
    const imageBorderColorRow = document.getElementById('image-border-color-row');
    /** @type {HTMLInputElement|null} Input couleur bordure */
    const imageInputBorderColor = document.getElementById('image-input-border-color');
    /** @type {HTMLElement|null} Swatch couleur bordure */
    const imageBorderColorSwatch = document.getElementById('image-border-color-swatch');
    
    // Contrôles Section Géométrie
    /** @type {HTMLInputElement|null} Input position X (mm) */
    const imageValX = document.getElementById('image-val-x');
    /** @type {HTMLInputElement|null} Input position Y (mm) */
    const imageValY = document.getElementById('image-val-y');
    /** @type {HTMLInputElement|null} Input largeur (mm) */
    const imageValW = document.getElementById('image-val-w');
    /** @type {HTMLInputElement|null} Input hauteur (mm) */
    const imageValH = document.getElementById('image-val-h');
    
    // Contrôles Section Zone
    /** @type {HTMLElement|null} Wrapper checkbox verrouiller */
    const imageChkLockedWrapper = document.getElementById('image-chk-locked-wrapper');
    /** @type {HTMLInputElement|null} Checkbox verrouiller (hidden) */
    const imageChkLocked = document.getElementById('image-chk-locked');
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // Toolbar Barcode (POC) - Références DOM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /** @type {HTMLElement|null} Container principal de la toolbar barcode */
    const barcodeToolbar = document.getElementById('barcode-toolbar');
    /** @type {HTMLElement|null} Header déplaçable de la toolbar barcode */
    const barcodeToolbarHeader = document.getElementById('barcode-toolbar-header');
    /** @type {HTMLButtonElement|null} Bouton fermer de la toolbar barcode */
    const barcodeToolbarCloseBtn = document.getElementById('barcode-toolbar-close');
    
    // Contrôles Section Page
    /** @type {HTMLSelectElement|null} Dropdown page (recto/verso) */
    const barcodeInputPage = document.getElementById('barcode-input-page');
    
    // Contrôles Section Type de code
    /** @type {HTMLSelectElement|null} Dropdown type de code-barres */
    const barcodeInputType = document.getElementById('barcode-input-type');
    
    // Contrôles Section Données
    /** @type {HTMLSelectElement|null} Dropdown source (fixe/champ) */
    const barcodeInputSource = document.getElementById('barcode-input-source');
    /** @type {HTMLInputElement|null} Input valeur fixe */
    const barcodeInputValue = document.getElementById('barcode-input-value');
    /** @type {HTMLSelectElement|null} Dropdown champ de fusion */
    const barcodeInputField = document.getElementById('barcode-input-field');
    /** @type {HTMLElement|null} Row valeur (conditionnelle) */
    const barcodeValueRow = document.getElementById('barcode-value-row');
    /** @type {HTMLElement|null} Row champ (conditionnelle) */
    const barcodeFieldRow = document.getElementById('barcode-field-row');
    
    // Contrôles Section Affichage
    /** @type {HTMLElement|null} Wrapper checkbox afficher texte */
    const barcodeChkShowTextWrapper = document.getElementById('barcode-chk-show-text-wrapper');
    /** @type {HTMLInputElement|null} Checkbox afficher texte (hidden) */
    const barcodeChkShowText = document.getElementById('barcode-chk-show-text');
    /** @type {HTMLInputElement|null} Spinner taille texte */
    const barcodeInputTextSize = document.getElementById('barcode-input-text-size');
    /** @type {HTMLElement|null} Row taille texte (conditionnelle) */
    const barcodeTextSizeRow = document.getElementById('barcode-text-size-row');
    
    // Contrôles Section Fond
    /** @type {HTMLElement|null} Wrapper checkbox transparent */
    const barcodeChkTransparentWrapper = document.getElementById('barcode-chk-transparent-wrapper');
    /** @type {HTMLInputElement|null} Checkbox transparent (hidden) */
    const barcodeChkTransparent = document.getElementById('barcode-chk-transparent');
    /** @type {HTMLElement|null} Row couleur fond (conditionnelle) */
    const barcodeBgColorRow = document.getElementById('barcode-bg-color-row');
    /** @type {HTMLInputElement|null} Input couleur fond */
    const barcodeInputBgColor = document.getElementById('barcode-input-bg-color');
    /** @type {HTMLElement|null} Swatch couleur fond */
    const barcodeBgColorSwatch = document.getElementById('barcode-bg-color-swatch');
    
    // Contrôles Section Géométrie
    /** @type {HTMLInputElement|null} Input position X (mm) */
    const barcodeValX = document.getElementById('barcode-val-x');
    /** @type {HTMLInputElement|null} Input position Y (mm) */
    const barcodeValY = document.getElementById('barcode-val-y');
    /** @type {HTMLInputElement|null} Input largeur (mm) */
    const barcodeValW = document.getElementById('barcode-val-w');
    /** @type {HTMLInputElement|null} Input hauteur (mm) */
    const barcodeValH = document.getElementById('barcode-val-h');
    
    // Contrôles Section Zone
    /** @type {HTMLElement|null} Wrapper checkbox verrouiller */
    const barcodeChkLockedWrapper = document.getElementById('barcode-chk-locked-wrapper');
    /** @type {HTMLInputElement|null} Checkbox verrouiller (hidden) */
    const barcodeChkLocked = document.getElementById('barcode-chk-locked');
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // Toolbar QR Code (POC) - Références DOM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /** @type {HTMLElement|null} Container principal de la toolbar QR Code */
    const qrcodeToolbar = document.getElementById('qrcode-toolbar');
    /** @type {HTMLElement|null} Header déplaçable de la toolbar QR Code */
    const qrcodeToolbarHeader = document.getElementById('qrcode-toolbar-header');
    /** @type {HTMLButtonElement|null} Bouton fermer de la toolbar QR Code */
    const qrcodeToolbarCloseBtn = document.getElementById('qrcode-toolbar-close');
    
    // Contrôles Section Page
    /** @type {HTMLSelectElement|null} Dropdown page (recto/verso) */
    const qrcodeInputPage = document.getElementById('qrcode-input-page');
    
    // Contrôles Section Fond
    /** @type {HTMLElement|null} Wrapper checkbox transparent */
    const qrcodeChkTransparentWrapper = document.getElementById('qrcode-chk-transparent-wrapper');
    /** @type {HTMLInputElement|null} Checkbox transparent (hidden) */
    const qrcodeChkTransparent = document.getElementById('qrcode-chk-transparent');
    /** @type {HTMLElement|null} Row couleur fond (conditionnelle) */
    const qrcodeBgColorRow = document.getElementById('qrcode-bg-color-row');
    /** @type {HTMLInputElement|null} Input couleur fond */
    const qrcodeInputBgColor = document.getElementById('qrcode-input-bg-color');
    /** @type {HTMLElement|null} Swatch couleur fond */
    const qrcodeBgColorSwatch = document.getElementById('qrcode-bg-color-swatch');
    
    // Contrôles Section Géométrie
    /** @type {HTMLInputElement|null} Input position X (mm) */
    const qrcodeValX = document.getElementById('qrcode-val-x');
    /** @type {HTMLInputElement|null} Input position Y (mm) */
    const qrcodeValY = document.getElementById('qrcode-val-y');
    /** @type {HTMLInputElement|null} Input largeur (mm) */
    const qrcodeValW = document.getElementById('qrcode-val-w');
    /** @type {HTMLInputElement|null} Input hauteur (mm) */
    const qrcodeValH = document.getElementById('qrcode-val-h');
    
    // Contrôles Section Zone
    /** @type {HTMLElement|null} Wrapper checkbox verrouiller */
    const qrcodeChkLockedWrapper = document.getElementById('qrcode-chk-locked-wrapper');
    /** @type {HTMLInputElement|null} Checkbox verrouiller (hidden) */
    const qrcodeChkLocked = document.getElementById('qrcode-chk-locked');
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // Toolbar Data (Champs de fusion) - Références DOM
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /** @type {HTMLElement|null} Toolbar flottante des champs de fusion */
    const toolbarData = document.getElementById('toolbar-data');
    /** @type {HTMLElement|null} Header de la toolbar data (pour drag) */
    const toolbarDataHeader = document.getElementById('toolbar-data-header');
    /** @type {HTMLButtonElement|null} Bouton fermer toolbar data */
    const toolbarDataClose = document.getElementById('toolbar-data-close');
    /** @type {HTMLElement|null} Compteur de champs */
    const fieldsCount = document.getElementById('fields-count');
    /** @type {HTMLElement|null} Message si aucun champ */
    const fieldsEmpty = document.getElementById('fields-empty');

    // ─────────────────────────────────────────────────────────────────────────
    // Aperçu de fusion - Références DOM
    // ─────────────────────────────────────────────────────────────────────────

    /** @type {HTMLElement|null} Section Aperçu dans la sidebar */
    const previewSection = document.getElementById('preview-section');

    /** @type {HTMLElement|null} Container du bouton Aperçu */
    const previewBtnContainer = document.getElementById('preview-btn-container');

    /** @type {HTMLButtonElement|null} Bouton activer aperçu */
    const btnPreview = document.getElementById('btn-preview');

    /** @type {HTMLElement|null} Container des contrôles de navigation */
    const previewControls = document.getElementById('preview-controls');

    /** @type {HTMLButtonElement|null} Bouton enregistrement précédent */
    const btnPrevRecord = document.getElementById('btn-prev-record');

    /** @type {HTMLButtonElement|null} Bouton enregistrement suivant */
    const btnNextRecord = document.getElementById('btn-next-record');

    /** @type {HTMLSpanElement|null} Indicateur d'enregistrement courant */
    const recordIndicator = document.getElementById('record-indicator');

    /** @type {HTMLButtonElement|null} Bouton fermer aperçu */
    const btnClosePreview = document.getElementById('btn-close-preview');
    
    // Fonction pour mettre à jour l'affichage du spin button d'épaisseur de bordure
    function updateBorderWidthDisplay(value) {
        if (inputBorderWidthDisplay) {
            inputBorderWidthDisplay.textContent = value;
        }
    }
    
    // Écouteurs pour les boutons spin de l'épaisseur de bordure
    document.querySelectorAll('.spin-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            
            let value = parseInt(input.value) || 0;
            
            if (btn.classList.contains('spin-up')) {
                value++;
            } else if (btn.classList.contains('spin-down')) {
                value = Math.max(0, value - 1); // Minimum 0
            }
            
            input.value = value;
            updateBorderWidthDisplay(value);
            
            // Déclencher la mise à jour de la zone (commun à tous les types)
            updateActiveZone();
            saveState();
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // COMPOSANTS POC TOOLBAR (DESIGN MARKETEAM)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /**
     * Initialise un spinner POC avec incrément/décrément.
     * Structure attendue :
     * <div class="spinner-poc">
     *     <input type="text" class="spinner-input-poc" id="xxx">
     *     <div class="spinner-buttons-poc">
     *         <button class="spinner-btn-poc" data-dir="up">...</button>
     *         <button class="spinner-btn-poc" data-dir="down">...</button>
     *     </div>
     * </div>
     * 
     * @param {string} inputId - ID de l'input du spinner
     * @param {number} min - Valeur minimum
     * @param {number} max - Valeur maximum
     * @param {number} step - Pas d'incrément
     * @param {Function} onChange - Callback appelé après changement (reçoit la nouvelle valeur)
     * @returns {void}
     */
    function initSpinnerPoc(inputId, min, max, step, onChange) {
        console.log('🔧 initSpinnerPoc - inputId:', inputId);
        
        const input = document.getElementById(inputId);
        console.log('   input element:', input);
        if (!input) {
            console.warn('   ❌ Input non trouvé !');
            return;
        }
        
        const spinner = input.closest('.spinner-poc');
        console.log('   spinner container:', spinner);
        if (!spinner) {
            console.warn('   ❌ Container .spinner-poc non trouvé !');
            return;
        }
        
        const buttons = spinner.querySelectorAll('.spinner-btn-poc');
        console.log('   buttons trouvés:', buttons.length);
        
        buttons.forEach(btn => {
            console.log('   Ajout listener sur bouton:', btn.dataset.dir);
            btn.addEventListener('click', () => {
                console.log('🔧 Spinner click:', inputId, btn.dataset.dir);
                // Gérer les valeurs avec virgule (format français)
                let currentValue = parseFloat(input.value.replace(',', '.')) || min;
                const dir = btn.dataset.dir;
                
                if (dir === 'up') {
                    currentValue = Math.min(max, currentValue + step);
                } else if (dir === 'down') {
                    currentValue = Math.max(min, currentValue - step);
                }
                
                // Formater selon le step (entier ou décimal)
                if (step >= 1) {
                    input.value = String(Math.round(currentValue));
                } else {
                    input.value = currentValue.toFixed(1).replace('.', ',');
                }
                
                if (onChange) onChange(currentValue);
            });
        });
        
        // Aussi écouter les changements manuels sur l'input
        input.addEventListener('change', () => {
            let value = parseFloat(input.value.replace(',', '.')) || min;
            value = Math.max(min, Math.min(max, value));
            
            if (step >= 1) {
                input.value = String(Math.round(value));
            } else {
                input.value = value.toFixed(1).replace('.', ',');
            }
            
            if (onChange) onChange(value);
        });
    }
    
    /**
     * Définit la valeur d'un spinner POC.
     * 
     * @param {string} inputId - ID de l'input du spinner
     * @param {number} value - Valeur à définir
     * @param {number} step - Pas (pour formater : entier si >= 1, décimal sinon)
     * @returns {void}
     */
    function setSpinnerPocValue(inputId, value, step) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        if (step >= 1) {
            input.value = String(Math.round(value));
        } else {
            input.value = value.toFixed(1).replace('.', ',');
        }
    }
    
    /**
     * Initialise un toggle-group POC (un seul bouton actif à la fois).
     * Structure attendue :
     * <div class="toggle-group-poc" id="xxx">
     *     <button class="toggle-btn-poc active" data-value="left">...</button>
     *     <button class="toggle-btn-poc" data-value="center">...</button>
     * </div>
     * 
     * @param {string} groupId - ID du conteneur
     * @param {Function} onChange - Callback avec la valeur sélectionnée
     * @returns {void}
     */
    function initToggleGroupPoc(groupId, onChange) {
        const group = document.getElementById(groupId);
        if (!group) return;
        
        const buttons = group.querySelectorAll('.toggle-btn-poc');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Retirer active de tous les boutons du groupe
                buttons.forEach(b => b.classList.remove('active'));
                // Activer le bouton cliqué
                btn.classList.add('active');
                
                const value = btn.dataset.value;
                if (onChange) onChange(value);
            });
        });
    }
    
    /**
     * Récupère la valeur active d'un toggle-group POC.
     * 
     * @param {string} groupId - ID du conteneur
     * @returns {string|null} Valeur du bouton actif ou null si aucun
     */
    function getToggleGroupPocValue(groupId) {
        const group = document.getElementById(groupId);
        if (!group) return null;
        
        const activeBtn = group.querySelector('.toggle-btn-poc.active');
        return activeBtn ? activeBtn.dataset.value : null;
    }
    
    /**
     * Définit la valeur active d'un toggle-group POC.
     * 
     * @param {string} groupId - ID du conteneur
     * @param {string} value - Valeur à activer
     * @returns {void}
     */
    function setToggleGroupPocValue(groupId, value) {
        const group = document.getElementById(groupId);
        if (!group) return;
        
        const buttons = group.querySelectorAll('.toggle-btn-poc');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === value);
        });
    }
    
    /**
     * Initialise une checkbox POC.
     * Structure attendue :
     * <div class="checkbox-poc" id="xxx-wrapper">
     *     <input type="checkbox" id="xxx" style="display: none;">
     *     <svg>...</svg>
     * </div>
     * La classe "checked" est ajoutée/retirée sur le wrapper pour l'état visuel.
     * 
     * @param {string} wrapperId - ID du wrapper (div.checkbox-poc)
     * @param {Function} onChange - Callback avec l'état (true/false)
     * @returns {void}
     */
    function initCheckboxPoc(wrapperId, onChange) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input[type="checkbox"]');
        
        wrapper.addEventListener('click', () => {
            const isChecked = wrapper.classList.toggle('checked');
            
            // Synchroniser l'input caché si présent
            if (input) input.checked = isChecked;
            
            if (onChange) onChange(isChecked);
        });
    }
    
    /**
     * Définit l'état d'une checkbox POC.
     * 
     * @param {string} wrapperId - ID du wrapper (div.checkbox-poc)
     * @param {boolean} checked - État à définir
     * @returns {void}
     */
    function setCheckboxPocState(wrapperId, checked) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input[type="checkbox"]');
        
        if (checked) {
            wrapper.classList.add('checked');
        } else {
            wrapper.classList.remove('checked');
        }
        
        if (input) input.checked = checked;
    }
    
    /**
     * Retourne l'état actuel d'une checkbox POC.
     * 
     * @param {string} wrapperId - ID du wrapper (div.checkbox-poc)
     * @returns {boolean} true si cochée, false sinon
     */
    function getCheckboxPocState(wrapperId) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return false;
        return wrapper.classList.contains('checked');
    }
    
    /**
     * Met à jour le swatch de couleur POC avec une nouvelle couleur.
     * 
     * @param {string} swatchId - ID du swatch (div.color-swatch-poc)
     * @param {string} color - Couleur hex (#RRGGBB)
     * @returns {void}
     */
    function updateColorSwatchPoc(swatchId, color) {
        const swatch = document.getElementById(swatchId);
        if (!swatch) return;
        swatch.style.background = color;
        
        // Mettre à jour l'input color caché si présent
        const colorInput = swatch.querySelector('input[type="color"]');
        if (colorInput) colorInput.value = color;
    }

    // ─────────────────────────────── FIN SECTION 1 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 2 : CONSTANTES ET CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Constantes globales de configuration de l'application.
     * 
     * Contenu :
     *   - BORDER_STYLE_TO_PSMD : Mapping styles de bordure vers PrintShop Mail
     *   - BARCODE_TYPES : Types de codes-barres supportés
     *   - SVG_BARCODE_1D, SVG_BARCODE_2D : SVG placeholders pour l'affichage
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    // --- CONSTANTES QUILL (Phase 0) ---
    /**
     * Police par défaut utilisée par Quill.
     * @type {string}
     */
    const QUILL_DEFAULT_FONT = 'Roboto';
    
    /**
     * Taille de police par défaut utilisée par Quill (en points).
     * @type {number}
     */
    const QUILL_DEFAULT_SIZE = 12;
    
    /**
     * Couleur de texte par défaut utilisée par Quill (hex).
     * @type {string}
     */
    const QUILL_DEFAULT_COLOR = '#000000';
    
    /**
     * Interlignage par défaut utilisé par Quill.
     * @type {number}
     */
    const QUILL_DEFAULT_LINE_HEIGHT = 1.15;

    /**
     * Active les logs détaillés du copyfit (debug).
     * À laisser à false en usage normal (logs très verbeux).
     * @type {boolean}
     */
    const DEBUG_COPYFIT = false;

    /**
     * Indique si les logs d'événements de chargement de polices (FontFaceSet) ont été installés.
     * @type {boolean}
     */
    let copyfitFontsDebugInstalled = false;

    /**
     * Polices par défaut en mode standalone (hors WebDev).
     * Utilisées si aucune liste de polices n'est fournie par le parent.
     *
     * Note : les URLs fonts.gstatic.com évoluent avec le temps (versions vXX).
     * Les URLs ci-dessous sont celles renvoyées par le CSS Google Fonts au moment de l'implémentation.
     *
     * @type {PoliceDisponible[]}
     */
    const DEFAULT_FONTS = [
        // Roboto (regular + variantes)
        {
            id: 0,
            nom: 'Roboto',
            url: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf',
            weight: 400,
            style: 'normal',
            boldUrl: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf',
            italicUrl: 'https://fonts.gstatic.com/s/roboto/v50/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLoHQiA8.ttf',
            boldItalicUrl: 'https://fonts.gstatic.com/s/roboto/v50/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLmbXiA8.ttf'
        },
        // Roboto déclinaisons (une entrée UI par weight)
        { id: 0, nom: 'Roboto Thin', url: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbGmT.ttf', weight: 100, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },
        { id: 0, nom: 'Roboto Light', url: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuaabWmT.ttf', weight: 300, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },
        { id: 0, nom: 'Roboto Medium', url: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWub2bWmT.ttf', weight: 500, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },
        { id: 0, nom: 'Roboto Black', url: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuZtammT.ttf', weight: 900, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },

        // Autres polices
        { id: 0, nom: 'Open Sans', url: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4n.ttf', weight: 400, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },
        { id: 0, nom: 'Lato', url: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjxAwXjeu.woff2', weight: 400, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },
        { id: 0, nom: 'Montserrat', url: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', weight: 400, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null },
        { id: 0, nom: 'Courier Prime', url: 'https://fonts.gstatic.com/s/courierprime/v11/u-450q2lgwslOqpF_6gQ8kELWwY.ttf', weight: 400, style: 'normal', boldUrl: null, italicUrl: null, boldItalicUrl: null }
    ];

    /**
     * Liste globale des polices disponibles (envoyées par WebDev au chargement).
     * Ne doit pas être stockée dans documentState.
     *
     * @type {PoliceDisponible[]}
     */
    let policesDisponibles = [];

    /**
     * Active les logs détaillés de debug pour la conversion RTF ↔ Delta (Phase 7).
     * @type {boolean}
     */
    const DEBUG_PHASE7_RTF = false;

    /**
     * Active les logs de debug pour le fond (bgColor/transparent) des zones textQuill (Phase 7).
     * @type {boolean}
     */
    const DEBUG_PHASE7_BG = true;

    /**
     * Masque les logs des phases validées (0 à 6) afin de réduire le bruit en console.
     * (Les warnings/errors ne sont pas affectés.)
     * @type {boolean}
     */
    const FILTER_LEGACY_PHASE_LOGS_0_TO_6 = true;

    /**
     * Installe un filtre sur console.log pour masquer les logs des phases 0 à 6.
     * Conçu pour garder la console lisible pendant le debug Phase 7.
     *
     * @returns {void}
     */
    function installConsoleLogFilter() {
        if (!FILTER_LEGACY_PHASE_LOGS_0_TO_6) return;
        if (console.__marketeamPhaseFilterInstalled) return;

        const originalLog = console.log.bind(console);
        console.__marketeamPhaseFilterInstalled = true;

        console.log = (...args) => {
            try {
                const first = args && args.length > 0 ? args[0] : null;
                if (typeof first === 'string') {
                    // Formats ciblés : "🔧 PHASE X - ..." et "📋 PHASE X - ..."
                    const m = first.match(/(?:🔧|📋)\s*PHASE\s*(\d+)\b/i);
                    if (m) {
                        const phase = parseInt(m[1], 10);
                        if (!isNaN(phase) && phase >= 0 && phase <= 6) {
                            return; // ignorer
                        }
                    }
                }
            } catch (e) {}

            originalLog(...args);
        };
    }

    // Installer le filtre tôt (avant les logs d'init Phase 0-6).
    installConsoleLogFilter();
    
    /**
     * Stocke les instances Quill par ID de zone.
     * @type {Map<string, Quill>}
     */
    const quillInstances = new Map();

    /**
     * Stocke les ResizeObservers pour le copyfit réactif des zones textQuill.
     * Permet de recalculer automatiquement le copyfit quand le contenu change de taille
     * (ex: chargement de polices, modification du texte).
     * @type {Map<string, ResizeObserver>}
     */
    const copyfitResizeObservers = new Map();

    /**
     * Flag pour éviter les boucles infinies lors du copyfit réactif.
     * Quand true, les ResizeObservers ignorent les changements de taille.
     * @type {boolean}
     */
    let isCopyfitRunning = false;
    
    /**
     * Module Clipboard personnalisé (PlainClipboard) pour filtrer le contenu collé.
     * Implémentation reproduite fidèlement depuis `POC QUILL/poc-quill.js`.
     *
     * Note : l'enregistrement est conditionné à la présence de Quill pour éviter
     * de casser l'application si le CDN n'est pas chargé.
     *
     * @extends Quill.import('modules/clipboard')
     */
    if (typeof Quill === 'function') {
        const Clipboard = Quill.import('modules/clipboard');
        const Delta = Quill.import('delta');
        
        class PlainClipboard extends Clipboard {
            /**
             * Intercepte le paste et filtre les formats non autorisés
             * @param {ClipboardEvent} e - Événement paste
             * @returns {void}
             */
            onPaste(e) {
                e.preventDefault();
                const range = this.quill.getSelection();
                if (!range) return;
                
                const clipboardData = e.clipboardData || window.clipboardData;
                const html = clipboardData.getData('text/html');
                const text = clipboardData.getData('text/plain');
                
                if (html) {
                    const filtered = this.filterHtml(html);
                    const delta = this.quill.clipboard.convert(filtered);
                    this.quill.updateContents(
                        new Delta().retain(range.index).delete(range.length).concat(delta),
                        'user'
                    );
                } else if (text) {
                    this.quill.insertText(range.index, text, 'user');
                }
                
                setTimeout(() => {
                    const newRange = this.quill.getSelection();
                    if (newRange) {
                        this.quill.setSelection(newRange.index, 0);
                    }
                }, 0);
            }
            
            /**
             * Filtre le HTML pour ne garder que les formats autorisés
             * @param {string} html - HTML brut
             * @returns {string} HTML filtré
             */
            filterHtml(html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                /**
                 * Nettoie récursivement un nœud HTML pour ne conserver que les tags simples.
                 * @param {Node} node - Nœud à nettoyer
                 * @returns {string} HTML nettoyé (ou texte)
                 */
                const cleanNode = (node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent;
                    }
                    
                    if (node.nodeType !== Node.ELEMENT_NODE) {
                        return '';
                    }
                    
                    const tagName = node.tagName.toLowerCase();
                    let result = '';
                    
                    for (const child of node.childNodes) {
                        result += cleanNode(child);
                    }
                    
                    if (tagName === 'b' || tagName === 'strong') {
                        return `<strong>${result}</strong>`;
                    }
                    if (tagName === 'i' || tagName === 'em') {
                        return `<em>${result}</em>`;
                    }
                    if (tagName === 'u') {
                        return `<u>${result}</u>`;
                    }
                    if (tagName === 'br') {
                        return '<br>';
                    }
                    if (tagName === 'p' || tagName === 'div') {
                        return `<p>${result}</p>`;
                    }
                    
                    const style = node.getAttribute('style') || '';
                    const colorMatch = style.match(/color:\s*([^;]+)/i);
                    if (colorMatch && result) {
                        return `<span style="color: ${colorMatch[1]}">${result}</span>`;
                    }
                    
                    return result;
                };
                
                return cleanNode(tempDiv);
            }
        }
        
        Quill.register('modules/clipboard', PlainClipboard, true);
    }
    
    // Mapping des styles de bordure vers les valeurs PrintShop Mail
    const BORDER_STYLE_TO_PSMD = {
        'solid': 1,
        'dashed': 3
    };
    
    // --- CONSTANTES CODE-BARRES ---
    
    // Types de code-barres supportés
    const BARCODE_TYPES = [
        { id: 'code128', label: 'Code 128', category: '1d' },
        { id: 'code39', label: 'Code 39', category: '1d' },
        { id: 'ean13', label: 'EAN-13', category: '1d' },
        { id: 'ean8', label: 'EAN-8', category: '1d' },
        { id: 'upca', label: 'UPC-A', category: '1d' },
        { id: 'interleaved2of5', label: 'Code 2/5 Intercalé', category: '1d' },
        { id: 'pdf417', label: 'PDF417', category: '1d' },
        { id: 'datamatrix', label: 'Data Matrix', category: '2d' },
        { id: 'qrcode', label: 'Code QR', category: '2d' }
    ];
    
    // SVG Placeholder pour codes 1D (barres verticales)
    const SVG_BARCODE_1D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 762 254" preserveAspectRatio="xMidYMid meet">
<g fill="currentColor">
<path d="M541.725 170.377l17.276 0c2.386,0 4.319,-1.941 4.319,-4.333l0 -147.313c0,-2.392 -1.933,-4.333 -4.319,-4.333l-17.276 0c-2.385,0 -4.32,1.941 -4.32,4.333l0 147.313c0,2.392 1.935,4.333 4.32,4.333l0 0zm4.319 -147.313l8.639 0 0 138.647 -8.639 0.001 0 -138.648zm103.659 147.313l17.277 0c2.385,0 4.318,-1.941 4.318,-4.333l0 -147.313c0,-2.392 -1.933,-4.333 -4.318,-4.333l-17.277 0c-2.385,0 -4.319,1.941 -4.319,4.333l0 147.313c0,2.392 1.934,4.333 4.319,4.333l0 0zm4.319 -147.313l8.639 0 0 138.647 -8.639 0.001 0 -138.648zm-64.787 142.98l0 -147.313c0,-2.392 1.935,-4.333 4.32,-4.333l4.319 0c2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333l-4.319 0c-2.385,0 -4.32,-1.941 -4.32,-4.333zm90.702 0l0 -147.313c0,-2.392 1.934,-4.333 4.319,-4.333l4.32 0c2.384,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333l-4.32 0c-2.384,0 -4.319,-1.941 -4.319,-4.333zm47.51 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333l4.319 0c2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333l-4.319 0c-2.386,0 -4.32,-1.941 -4.32,-4.333zm-155.488 0l0 -147.313c0,-2.392 1.933,-4.333 4.319,-4.333 2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333 -2.386,0 -4.319,-1.941 -4.319,-4.333zm38.872 0l0 -147.313c0,-2.392 1.934,-4.333 4.319,-4.333 2.385,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.935,4.333 -4.32,4.333 -2.385,0 -4.319,-1.941 -4.319,-4.333zm17.276 0l0 -147.313c0,-2.392 1.935,-4.333 4.32,-4.333 2.386,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.933,4.333 -4.319,4.333 -2.385,0 -4.32,-1.941 -4.32,-4.333zm77.745 0l0 -147.313c0,-2.392 1.933,-4.333 4.319,-4.333 2.385,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.935,4.333 -4.32,4.333 -2.386,0 -4.319,-1.941 -4.319,-4.333zm47.51 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333 2.385,0 4.318,1.941 4.318,4.333l0 147.313c0,2.392 -1.933,4.333 -4.318,4.333 -2.386,0 -4.32,-1.941 -4.32,-4.333zm-268.703 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333 2.386,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.933,4.333 -4.319,4.333 -2.386,0 -4.32,-1.941 -4.32,-4.333zm-47.509 0l0 -147.313c0,-2.392 1.933,-4.333 4.319,-4.333 2.385,0 4.318,1.941 4.318,4.333l0 147.313c0,2.392 -1.933,4.333 -4.318,4.333 -2.386,0 -4.319,-1.941 -4.319,-4.333zm-77.745 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333 2.384,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.935,4.333 -4.319,4.333 -2.386,0 -4.32,-1.941 -4.32,-4.333zm-17.277 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333 2.386,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.933,4.333 -4.319,4.333 -2.386,0 -4.32,-1.941 -4.32,-4.333zm-38.872 0l0 -147.313c0,-2.392 1.934,-4.333 4.319,-4.333 2.387,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.933,4.333 -4.32,4.333 -2.385,0 -4.319,-1.941 -4.319,-4.333zm155.489 0l0 -147.313c0,-2.392 1.933,-4.333 4.319,-4.333l4.319 0c2.386,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.933,4.333 -4.319,4.333l-4.319 0c-2.385,0 -4.319,-1.941 -4.319,-4.333zm-47.51 0l0 -147.313c0,-2.392 1.933,-4.333 4.319,-4.333l4.318 0c2.386,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.933,4.333 -4.32,4.333l-4.318 0c-2.385,0 -4.319,-1.941 -4.319,-4.333zm-90.702 0l0 -147.313c0,-2.392 1.934,-4.333 4.319,-4.333l4.319 0c2.386,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.933,4.333 -4.319,4.333l-4.319 0c-2.385,0 -4.319,-1.941 -4.319,-4.333zm190.041 -142.98l8.639 0 0 138.647 -8.639 0.001 0 -138.648zm-4.319 147.313l17.277 0c2.385,0 4.32,-1.941 4.32,-4.333l0 -147.313c0,-2.392 -1.935,-4.333 -4.32,-4.333l-17.277 0c-2.385,0 -4.318,1.941 -4.318,4.333l0 147.313c0,2.392 1.933,4.333 4.318,4.333l0 0zm-120.935 -147.313l8.637 0 0 138.647 -8.637 0.001 0 -138.648zm-4.32 147.313l17.277 0c2.386,0 4.32,-1.941 4.32,-4.333l0 -147.313c0,-2.392 -1.934,-4.333 -4.32,-4.333l-17.277 0c-2.384,0 -4.318,1.941 -4.318,4.333l0 147.313c0,2.392 1.934,4.333 4.318,4.333l0 0zm-103.658 -147.313l8.638 0 0 138.647 -8.638 0.001 0 -138.648zm-4.319 147.313l17.276 0c2.385,0 4.319,-1.941 4.319,-4.333l0 -147.313c0,-2.392 -1.934,-4.333 -4.319,-4.333l-17.276 0c-2.386,0 -4.32,1.941 -4.32,4.333l0 147.313c0,2.392 1.934,4.333 4.32,4.333l0 0zm-57.066 -4.333l0 -147.313c0,-2.392 1.933,-4.333 4.32,-4.333 2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333 -2.387,0 -4.32,-1.941 -4.32,-4.333zm-47.51 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333 2.384,0 4.318,1.941 4.318,4.333l0 147.313c0,2.392 -1.934,4.333 -4.318,4.333 -2.386,0 -4.32,-1.941 -4.32,-4.333zm-77.744 0l0 -147.313c0,-2.392 1.934,-4.333 4.319,-4.333 2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333 -2.385,0 -4.319,-1.941 -4.319,-4.333zm-17.278 0l0 -147.313c0,-2.392 1.935,-4.333 4.32,-4.333 2.386,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.934,4.333 -4.32,4.333 -2.385,0 -4.32,-1.941 -4.32,-4.333zm-38.871 0l0 -147.313c0,-2.392 1.933,-4.333 4.319,-4.333 2.386,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.934,4.333 -4.32,4.333 -2.386,0 -4.319,-1.941 -4.319,-4.333zm155.488 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333l4.319 0c2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333l-4.319 0c-2.385,0 -4.32,-1.941 -4.32,-4.333zm-47.51 0l0 -147.313c0,-2.392 1.934,-4.333 4.32,-4.333l4.318 0c2.385,0 4.32,1.941 4.32,4.333l0 147.313c0,2.392 -1.934,4.333 -4.32,4.333l-4.318 0c-2.385,0 -4.32,-1.941 -4.32,-4.333zm-90.702 0l0 -147.313c0,-2.392 1.935,-4.333 4.32,-4.333l4.319 0c2.385,0 4.319,1.941 4.319,4.333l0 147.313c0,2.392 -1.934,4.333 -4.319,4.333l-4.319 0c-2.385,0 -4.32,-1.941 -4.32,-4.333zm190.042 -142.98l8.638 0 0 138.647 -8.638 0.001 0 -138.648zm-4.319 147.313l17.276 0c2.386,0 4.32,-1.941 4.32,-4.333l0 -147.313c0,-2.392 -1.934,-4.333 -4.32,-4.333l-17.276 0c-2.385,0 -4.319,1.941 -4.319,4.333l0 147.313c0,2.392 1.934,4.333 4.319,4.333l0 0zm-120.936 -147.313l8.638 0 0 138.647 -8.638 0.001 0 -138.648zm-4.319 147.313l17.277 0c2.385,0 4.32,-1.941 4.32,-4.333l0 -147.313c0,-2.392 -1.935,-4.333 -4.32,-4.333l-17.277 0c-2.385,0 -4.318,1.941 -4.318,4.333l0 147.313c0,2.392 1.933,4.333 4.318,4.333l0 0zm-103.659 -147.313l8.639 0 0 138.647 -8.639 0.001 0 -138.648zm-4.319 147.313l17.277 0c2.385,0 4.318,-1.941 4.318,-4.333l0 -147.313c0,-2.392 -1.933,-4.333 -4.318,-4.333l-17.277 0c-2.385,0 -4.32,1.941 -4.32,4.333l0 147.313c0,2.392 1.935,4.333 4.32,4.333l0 0z"/>
<path d="M-0 235.268l0 -8.665c0,-7.168 5.814,-12.998 12.958,-12.998l0 -4.334c0,-2.389 -1.938,-4.333 -4.319,-4.333l-4.319 0c-2.385,0 -4.32,-1.939 -4.32,-4.332 0,-2.393 1.935,-4.333 4.32,-4.333l4.319 0c7.144,0 12.958,5.832 12.958,12.998l0 8.666c0,2.392 -1.935,4.333 -4.319,4.333l-4.32 0c-2.381,0 -4.319,1.943 -4.319,4.333l0 4.332 8.639 0c2.384,0 4.319,1.94 4.319,4.333 0,2.392 -1.934,4.333 -4.319,4.333l-12.958 0c-2.385,0 -4.32,-1.941 -4.32,-4.333z"/>
</g>
</svg>`;
    
    // SVG Placeholder pour codes 2D (QR / DataMatrix)
    const SVG_BARCODE_2D = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 254 254" preserveAspectRatio="xMidYMid meet">
<g fill="currentColor">
<path d="M127 29.766l0 19.843 -19.844 0 0 -19.843 19.844 0zm-19.844 116.582l0 28.277 19.844 0 0 -28.277 -19.844 0zm59.531 107.652l0 -19.844 -19.843 0 0 -19.843 -19.844 0 0 39.687 39.687 0zm39.688 -147.34l-59.531 0 0 19.844 59.531 0 0 -19.844zm0 39.688l27.781 0 0 -19.844 -27.781 0 0 19.844zm0 28.277l0 19.844 47.625 0 0 -48.121 -19.844 0 0 28.277 -27.781 0zm-59.531 -174.625l-19.844 0 0 29.766 19.844 0 0 -29.766zm-19.844 89.297l19.844 0 0 -39.688 -19.844 0 0 19.844 -19.844 0 0 57.051 19.844 0 0 -37.207zm-127 17.363l0 39.688 19.844 0 0 -19.844 29.765 0 0 -19.844 -49.609 0zm146.844 39.688l0 -19.844 -19.844 0 0 19.844 19.844 0zm39.687 19.843l19.844 0 0 -19.843 -19.844 0 0 19.843zm47.625 -39.687l19.844 0 0 -19.844 -19.844 0 0 19.844zm-67.469 19.844l-19.843 0 0 28.277 -19.844 0 0 19.844 39.687 0 0 -48.121zm-59.531 67.965l19.844 0 0 -19.844 -19.844 0 0 19.844zm59.531 -19.844l0 19.844 39.688 0 0 -19.844 -39.688 0zm59.532 39.687l0 -19.843 -19.844 0 0 19.843 19.844 0zm27.781 19.844l0 -19.844 -27.781 0 0 19.844 27.781 0zm-67.469 0l19.844 0 0 -19.844 -19.844 0 0 19.844zm-97.234 -127.496l0 -19.844 -19.844 0 0 19.844 -19.844 0 0 19.844 57.547 0 0 -19.844 -17.859 0zm0 -37.207l-89.297 0 0 -89.297 89.297 0 0 89.297zm-19.844 -69.453l-49.609 0 0 49.609 49.609 0 0 -49.609zm-14.883 14.883l-19.843 0 0 19.843 19.843 0 0 -19.843zm199.43 -34.727l0 89.297 -89.297 0 0 -89.297 89.297 0zm-19.844 19.844l-49.609 0 0 49.609 49.609 0 0 -49.609zm-14.883 14.883l-19.843 0 0 19.843 19.843 0 0 -19.843zm-219.273 129.976l89.297 0 0 89.297 -89.297 0 0 -89.297zm19.844 69.453l49.609 0 0 -49.609 -49.609 0 0 49.609zm14.883 -14.883l19.843 0 0 -19.843 -19.843 0 0 19.843zm0 0z"/>
</g>
</svg>`;

    /**
     * Couleur thème du Designer (utilisée pour les placeholders et éléments UI).
     * @type {string}
     */
    const THEME_COLOR = '#7c3aed'; // Violet Marketeam

    /**
     * Proportion par défaut de l'icône placeholder image (0.5 = 50% de la zone).
     * @type {number}
     */
    const IMAGE_PLACEHOLDER_SCALE = 0.5;

    /**
     * Marge intérieure du cadre placeholder image en pixels.
     * @type {number}
     */
    const IMAGE_PLACEHOLDER_INSET = 10;

    /**
     * Rayon des coins arrondis du cadre placeholder image en pixels.
     * @type {number}
     */
    const IMAGE_PLACEHOLDER_BORDER_RADIUS = 8;

    /**
     * Épaisseur de la bordure du cadre placeholder image en pixels.
     * @type {number}
     */
    const IMAGE_PLACEHOLDER_BORDER_WIDTH = 3;

    // ─────────────────────────────── FIN SECTION 2 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 3 : CONFIGURATION CODES-BARRES (bwip-js)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Configuration détaillée pour la génération de codes-barres avec bwip-js.
     * 
     * Contenu :
     *   - BARCODE_BWIPJS_CONFIG : Mapping types → configuration bwip-js
     *   - SVG_BARCODE_FALLBACK : SVG de secours si génération échoue
     *   - SVG_BARCODE_2D_FALLBACK : SVG de secours pour codes 2D
     * 
     * Dépendances :
     *   - Librairie bwip-js (chargée externement)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Mapping entre nos types de codes-barres et les identifiants bwip-js (bcid)
     * Utilise nos IDs internes (minuscules) comme clés
     */
    const BARCODE_BWIPJS_CONFIG = {
        'qrcode': {
            bcid: 'qrcode',
            sampleValue: 'https://example.com',
            is2D: true
        },
        'code128': {
            bcid: 'code128',
            sampleValue: 'ABC-12345',
            is2D: false
        },
        'ean13': {
            bcid: 'ean13',
            sampleValue: '5901234123457',  // Checksum valide
            is2D: false
        },
        'ean8': {
            bcid: 'ean8',
            sampleValue: '96385074',       // Checksum valide
            is2D: false
        },
        'code39': {
            bcid: 'code39',
            sampleValue: 'CODE39',
            is2D: false
        },
        'datamatrix': {
            bcid: 'datamatrix',
            sampleValue: 'DATAMATRIX01',
            is2D: true
        },
        'pdf417': {
            bcid: 'pdf417',
            sampleValue: 'PDF417 SAMPLE',
            is2D: false  // Visuellement proche 1D (rectangulaire)
        },
        'upca': {
            bcid: 'upca',
            sampleValue: '012345678905',   // Checksum valide
            is2D: false
        },
        'interleaved2of5': {
            bcid: 'interleaved2of5',
            sampleValue: '1234567890',     // Doit être pair
            is2D: false
        },
        // Mapping supplémentaire pour les anciens types (format WebDev)
        'QRCode': {
            bcid: 'qrcode',
            sampleValue: 'https://example.com',
            is2D: true
        },
        'Code128': {
            bcid: 'code128',
            sampleValue: 'ABC-12345',
            is2D: false
        },
        'EAN13': {
            bcid: 'ean13',
            sampleValue: '5901234123457',
            is2D: false
        },
        'EAN8': {
            bcid: 'ean8',
            sampleValue: '96385074',
            is2D: false
        },
        'Code39': {
            bcid: 'code39',
            sampleValue: 'CODE39',
            is2D: false
        },
        'DataMatrix': {
            bcid: 'datamatrix',
            sampleValue: 'DATAMATRIX01',
            is2D: true
        },
        'PDF417': {
            bcid: 'pdf417',
            sampleValue: 'PDF417 SAMPLE',
            is2D: false
        },
        'UPCA': {
            bcid: 'upca',
            sampleValue: '012345678905',
            is2D: false
        },
        'Interleaved2of5': {
            bcid: 'interleaved2of5',
            sampleValue: '1234567890',
            is2D: false
        }
    };
    
    /**
     * SVG placeholder de fallback en cas d'erreur de génération
     */
    const SVG_BARCODE_FALLBACK = `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="40" fill="#f8f8f8" stroke="#ccc" stroke-dasharray="4"/>
        <text x="50" y="24" text-anchor="middle" font-size="10" fill="#999">Code-barres</text>
    </svg>`;
    
    const SVG_BARCODE_2D_FALLBACK = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f8f8f8" stroke="#ccc" stroke-dasharray="4"/>
        <text x="50" y="55" text-anchor="middle" font-size="10" fill="#999">2D Code</text>
    </svg>`;

    // ─────────────────────────────── FIN SECTION 3 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 4 : UTILITAIRES CODES-BARRES
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Fonctions utilitaires pour la manipulation des codes-barres.
     * 
     * Fonctions principales :
     *   - getBarcodeTypeLabel() : Retourne le libellé d'un type
     *   - getFieldDisplayName() : Extrait le nom du champ sans @
     *   - is2DBarcode() : Détermine si un code est 2D
     *   - updateBarcodeDimensionClass() : Met à jour la classe CSS
     *   - getBarcodePlaceholderSVG() : Retourne le SVG placeholder
     *   - getFallbackBarcodeSvg() : Retourne le SVG de fallback
     *   - generateBarcodeImage() : Génère l'image du code-barres
     * 
     * Dépendances :
     *   - BARCODE_TYPES (Section 2)
     *   - BARCODE_BWIPJS_CONFIG (Section 3)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Retourne le libellé d'un type de code-barres
     * @param {string} typeId - ID du type (ex: 'code128')
     * @returns {string} - Libellé (ex: 'Code 128')
     */
    function getBarcodeTypeLabel(typeId) {
        const type = BARCODE_TYPES.find(t => t.id === typeId);
        return type ? type.label : typeId;
    }
    
    /**
     * Extrait le nom du champ sans les @ pour l'affichage
     * @param {string} fieldValue - Valeur du champ (ex: "@Civilité@" ou "Civilité")
     * @returns {string} - Nom du champ ou "(Aucun champ)"
     */
    function getFieldDisplayName(fieldValue) {
        if (!fieldValue || fieldValue.trim() === '') {
            return '(Aucun champ)';
        }
        // Retirer les @ au début et à la fin si présents
        return fieldValue.replace(/^@/, '').replace(/@$/, '');
    }
    
    /**
     * Détermine si un type de code-barres est 2D
     * @param {string} typeCode - Type du code-barres (ex: 'QRCode', 'qrcode', 'Code128')
     * @returns {boolean} - true si 2D, false si 1D
     */
    function is2DBarcode(typeCode) {
        const types2D = ['qrcode', 'datamatrix'];
        return types2D.includes(typeCode.toLowerCase());
    }
    
    /**
     * Met à jour la classe de dimension sur la zone (1D ou 2D)
     * @param {HTMLElement} zoneEl - Élément DOM de la zone
     * @param {string} typeCode - Type du code-barres
     */
    function updateBarcodeDimensionClass(zoneEl, typeCode) {
        // Retirer les classes existantes
        zoneEl.classList.remove('barcode-1d', 'barcode-2d');
        
        // Ajouter la classe appropriée
        if (is2DBarcode(typeCode)) {
            zoneEl.classList.add('barcode-2d');
        } else {
            zoneEl.classList.add('barcode-1d');
        }
    }
    
    /**
     * Retourne le SVG placeholder selon le type de code-barres
     * @param {string} typeCodeBarres - Type de code-barres
     * @returns {string} - Contenu SVG
     */
    function getBarcodePlaceholderSVG(typeCodeBarres) {
        const type2D = ['qrcode', 'datamatrix'];
        return type2D.includes(typeCodeBarres) ? SVG_BARCODE_2D : SVG_BARCODE_1D;
    }
    
    /**
     * Retourne un SVG placeholder approprié selon le type de code-barres.
     * Utilisé quand bwip-js n'est pas disponible ou en cas d'erreur de génération.
     * 
     * @param {string} typeCode - Type de code-barres (qrcode, code128, datamatrix, etc.)
     * @returns {string} Data URL du SVG (data:image/svg+xml,...)
     * 
     * @example
     * getFallbackBarcodeSvg('code128'); // → SVG barres verticales (1D)
     * getFallbackBarcodeSvg('qrcode');  // → SVG matrice carrée (2D)
     * 
     * @see SVG_BARCODE_FALLBACK - SVG 1D (barres)
     * @see SVG_BARCODE_2D_FALLBACK - SVG 2D (matrice)
     */
    function getFallbackBarcodeSvg(typeCode) {
        const config = BARCODE_BWIPJS_CONFIG[typeCode];
        const is2D = config ? config.is2D : false;
        const svg = is2D ? SVG_BARCODE_2D_FALLBACK : SVG_BARCODE_FALLBACK;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }
    
    /**
     * Génère une image de prévisualisation pour un code-barres (SANS texte lisible).
     * Utilise bwip-js pour générer le code-barres sur un canvas, puis retourne une Data URL PNG.
     * Si bwip-js n'est pas disponible ou si le type est inconnu, retourne un SVG placeholder.
     * 
     * Note : L'image est TOUJOURS générée avec un fond transparent (PNG).
     * Le fond visible est contrôlé par le style CSS de la zone (backgroundColor).
     * Le texte lisible est ajouté séparément en HTML/CSS.
     * 
     * @param {string} typeCode - Type de code-barres (qrcode, code128, ean13, datamatrix, etc.)
     * @param {string} [color='#000000'] - Couleur du code-barres (format hex)
     * @returns {string} Data URL de l'image PNG transparent (data:image/png;base64,...) ou SVG inline fallback
     * 
     * @example
     * // Générer un Code 128 noir (fond transparent)
     * const imgSrc = generateBarcodeImage('code128', '#000000');
     * imgElement.src = imgSrc;
     * 
     * @see BARCODE_BWIPJS_CONFIG - Configuration bwip-js par type
     * @see getFallbackBarcodeSvg - SVG de secours si bwip-js échoue
     */
    function generateBarcodeImage(typeCode, color = '#000000') {
        // Vérifier que bwip-js est chargé
        if (typeof bwipjs === 'undefined') {
            console.warn('bwip-js non chargé, utilisation du fallback');
            return getFallbackBarcodeSvg(typeCode);
        }
        
        // Récupérer la configuration pour ce type
        const config = BARCODE_BWIPJS_CONFIG[typeCode];
        if (!config) {
            console.warn(`Type de code-barres inconnu: ${typeCode}`);
            return getFallbackBarcodeSvg(typeCode);
        }
        
        // Toujours utiliser la valeur fictive (le champ est une métadonnée pour l'export, pas pour l'affichage)
        const valueToEncode = config.sampleValue;
        
        // Créer un canvas temporaire
        const canvas = document.createElement('canvas');
        
        // Options bwip-js - SANS TEXTE, FOND TRANSPARENT
        // Le fond est géré par le CSS de la zone, pas par l'image
        const options = {
            bcid: config.bcid,
            text: valueToEncode,
            scale: 3,                          // Facteur d'échelle pour netteté
            height: config.is2D ? 20 : 10,     // Hauteur en mm (bwip-js utilise mm)
            barcolor: color.replace('#', ''),  // Couleur du code (sans #)
            includetext: false                 // JAMAIS de texte dans l'image
            // Pas de backgroundcolor → fond transparent par défaut
        };
        
        // Ajustements spécifiques par type
        if (config.is2D) {
            // Codes 2D : format carré
            options.width = 25;
            options.height = 25;
        }
        
        // Ajustement pour PDF417 (plus compact)
        if (typeCode === 'pdf417' || typeCode === 'PDF417') {
            options.columns = 3;
            options.rows = 10;
        }
        
        try {
            // Générer le code-barres sur le canvas
            bwipjs.toCanvas(canvas, options);
            
            // Retourner le data URL
            return canvas.toDataURL('image/png');
        } catch (e) {
            console.warn(`Erreur génération code-barres ${typeCode}:`, e.message);
            return getFallbackBarcodeSvg(typeCode);
        }
    }

    // ─────────────────────────────── FIN SECTION 4 ────────────────────────────────

    const textControls = [
        inputContent,
        inputFont,
        inputSize,
        inputColor,
        inputAlign,
        inputValign,
        inputBgColor,
        chkTransparent,
        chkCopyfit,
        inputLineHeight,
        inputBorderWidth,
        inputBorderColor,
        inputBorderStyle
    ];

    function setTextControlsEnabled(enabled) {
        textControls.forEach(ctrl => {
            if (!ctrl) return;
            ctrl.disabled = !enabled;
        });
        if (inputContent) inputContent.placeholder = enabled ? "Ex: Cher {{NOM}}," : "Zone QR statique (non modifiable)";
    }

    setTextControlsEnabled(true);

    // Inputs géométrie (SUPPRIMÉS - ancien panneau, remplacés par quill-val-x/y/w/h)
    const inputX = null; // SUPPRIMÉ - était #val-x
    const inputY = null; // SUPPRIMÉ - était #val-y
    const inputW = null; // SUPPRIMÉ - était #val-w
    const inputH = null; // SUPPRIMÉ - était #val-h

    // Champs de fusion
    const mergeFieldsContainer = document.getElementById('merge-fields-list');
    
    /**
     * Champs de fusion par défaut (version démonstration hors WebDev)
     * Seront remplacés par ceux du JSON WebDev lors d'un chargement
     * @type {ChampFusion[]}
     */
    let mergeFields = [
        { nom: "CIVILITE", libelle: "Civilité", type: "TXT", ordre: 1 },
        { nom: "NOM", libelle: "Nom", type: "TXT", ordre: 2 },
        { nom: "PRENOM", libelle: "Prénom", type: "TXT", ordre: 3 },
        { nom: "SOCIETE", libelle: "Société", type: "TXT", ordre: 4 },
        { nom: "ADRESSE1", libelle: "Adresse 1", type: "TXT", ordre: 5 },
        { nom: "ADRESSE2", libelle: "Adresse 2", type: "TXT", ordre: 6 },
        { nom: "CP", libelle: "Code postal", type: "TXT", ordre: 7 },
        { nom: "VILLE", libelle: "Ville", type: "TXT", ordre: 8 },
        { nom: "PAYS", libelle: "Pays", type: "TXT", ordre: 9 },
        { nom: "EMAIL", libelle: "Email", type: "TXT", ordre: 10 },
        { nom: "TELEPHONE", libelle: "Téléphone", type: "TXT", ordre: 11 },
        { nom: "NUMERO_CLIENT", libelle: "N° Client", type: "TXT", ordre: 12 },
        { nom: "SEQUENTIEL", libelle: "N° séquentiel", type: "SYS", ordre: 20 },
        { nom: "DATE_JOUR", libelle: "Date du jour", type: "SYS", ordre: 21 },
        { nom: "LOGO", libelle: "Logo entreprise", type: "IMG", ordre: 30 },
        { nom: "PHOTO", libelle: "Photo contact", type: "IMG", ordre: 31 }
    ];

    /**
     * Met à jour l'affichage des champs de fusion dans la toolbar Data
     * Affiche le libelle, trie par ordre, et utilise nom pour la syntaxe @NOM@
     * @param {ChampFusion[]} champs - Tableau des champs de fusion
     */
    function updateMergeFieldsUI(champs) {
        if (!mergeFieldsContainer) return;
        
        // Normaliser : si tableau de strings, convertir en objets
        const champsNormalises = champs.map((champ, index) => {
            if (typeof champ === 'string') {
                return { nom: champ.toUpperCase().replace(/\s+/g, '_'), libelle: champ, type: 'TXT', ordre: index + 1 };
            }
            return champ;
        });
        
        // Trier par ordre croissant
        const champsTries = [...champsNormalises].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        
        // Mettre à jour le compteur
        const count = champsTries.length;
        if (fieldsCount) {
            fieldsCount.textContent = count === 0 ? '0 champ disponible' 
                                     : count === 1 ? '1 champ disponible' 
                                     : `${count} champs disponibles`;
        }
        
        // Afficher/masquer le message vide
        if (fieldsEmpty) {
            fieldsEmpty.style.display = count === 0 ? '' : 'none';
        }
        
        // Vider le conteneur (sauf le message vide)
        mergeFieldsContainer.querySelectorAll('.merge-tag').forEach(tag => tag.remove());
        
        if (champsTries.length === 0) return;
        
        // Parcourir les champs triés
        champsTries.forEach(champ => {
            const fieldName = champ.nom;           // Valeur technique pour @NOM@
            const fieldLabel = champ.libelle || champ.nom;  // Libellé affiché
            const fieldType = champ.type || 'TXT';
            
            const tag = document.createElement('div');
            tag.classList.add('merge-tag');
            
            // Ajouter une classe selon le type (pour style visuel différent)
            if (fieldType === 'SYS') tag.classList.add('merge-tag-sys');
            if (fieldType === 'IMG') tag.classList.add('merge-tag-img');
            
            // Ajouter icône + libellé (affiché)
            tag.innerHTML = `
                <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span class="field-name">${fieldLabel}</span>
            `;
            tag.title = `${fieldLabel} (${fieldType}) - Double-clic ou glisser pour insérer @${fieldName}@`;
            tag.dataset.fieldName = fieldName;  // Stocker le nom technique
            
            // Double-clic pour insertion (utilise le nom technique)
            tag.addEventListener('dblclick', () => insertTag(fieldName));
            
            // Drag & drop avec syntaxe @CHAMP@ (nom technique)
            tag.draggable = true;
            tag.addEventListener('dragstart', (e) => {
                tag.classList.add('dragging');
                e.dataTransfer.setData('text/plain', `@${fieldName}@`);
                e.dataTransfer.setData('application/x-merge-field', fieldName);
                e.dataTransfer.effectAllowed = 'copyMove';
                
                // Créer une image de drag personnalisée
                const dragImage = tag.cloneNode(true);
                dragImage.classList.remove('dragging');
                dragImage.classList.add('no-tooltip');
                dragImage.style.cssText = `
                    position: absolute;
                    top: -1000px;
                    left: -1000px;
                    opacity: 0.7;
                    background: var(--theme-primary-light, #F4E6FA);
                    border: 1px solid var(--theme-primary, #934BB7);
                    border-radius: 6px;
                    padding: 8px 10px;
                    pointer-events: none;
                `;
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 20, -15);
                
                // Nettoyer l'élément temporaire
                setTimeout(() => {
                    if (dragImage.parentNode) {
                        document.body.removeChild(dragImage);
                    }
                }, 0);
            });
            tag.addEventListener('dragend', () => {
                tag.classList.remove('dragging');
            });
            
            mergeFieldsContainer.appendChild(tag);
        });
        
        console.log(`📋 updateMergeFieldsUI: ${champsTries.length} champ(s) de fusion chargé(s) (triés par ordre)`);
        
        // Mettre à jour la visibilité de la toolbar
        updateToolbarDataVisibility();
        
        // Mettre à jour les combos des autres zones (image, barcode)
        updateAllFieldSelects();
    }
    
    /**
     * Met à jour la visibilité de la toolbar Data (champs de fusion)
     * Visible si : zone textQuill sélectionnée ET champs disponibles ET pas en mode aperçu
     */
    function updateToolbarDataVisibility() {
        if (!toolbarData) return;
        
        // Ne pas afficher en mode aperçu
        // Protection : previewState peut ne pas être encore initialisée au chargement
        try {
            if (typeof previewState !== 'undefined' && previewState.active) {
                toolbarData.style.display = 'none';
                console.log('📋 Toolbar Data masquée en mode aperçu');
                return;
            }
        } catch (e) {
            // previewState pas encore déclarée - cas d'initialisation
        }
        
        // Protection : selectedZoneIds peut ne pas être encore initialisée au chargement
        // (déclarée plus bas dans le script)
        let hasTextQuillSelected = false;
        try {
            if (typeof selectedZoneIds !== 'undefined' && selectedZoneIds.length === 1) {
                const zoneId = selectedZoneIds[0];
                const zonesData = getCurrentPageZones();
                hasTextQuillSelected = zonesData && zonesData[zoneId] && zonesData[zoneId].type === 'textQuill';
            }
        } catch (e) {
            // selectedZoneIds pas encore déclarée - cas d'initialisation
            hasTextQuillSelected = false;
        }
        
        const hasFields = mergeFields && mergeFields.length > 0;
        const shouldShow = hasFields && hasTextQuillSelected;
        toolbarData.style.display = shouldShow ? '' : 'none';
        
        console.log('📋 Toolbar Data visibility:', shouldShow ? 'visible' : 'hidden',
                    '(textQuill:', hasTextQuillSelected, ', fields:', hasFields, ')');
    }
    
    /**
     * Vérifie si un caractère est alphanumérique (lettre ou chiffre)
     * @param {string} char - Caractère à tester
     * @returns {boolean}
     */
    function isAlphanumeric(char) {
        if (!char || char === '') return false;
        // Inclut les lettres accentuées françaises
        return /[a-zA-Z0-9àâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ]/.test(char);
    }
    
    /**
     * Vérifie si une position est à l'intérieur d'un champ de fusion @...@
     * @param {string} text - Le texte complet
     * @param {number} position - La position à vérifier
     * @returns {boolean} true si la position est à l'intérieur d'un champ
     */
    /**
     * Vérifie si une position est à l'intérieur d'un champ de fusion @...@
     * Logique : compter les @ avant la position
     * - Si PAIR → on est DEHORS d'un champ (après un champ fermé ou avant tout champ)
     * - Si IMPAIR → on est DEDANS d'un champ (entre le @ ouvrant et le @ fermant)
     * @param {string} text - Le texte complet
     * @param {number} position - La position à vérifier
     * @returns {boolean} true si la position est à l'intérieur d'un champ
     */
    function isInsideMergeField(text, position) {
        // Compter les @ avant la position
        let atCount = 0;
        for (let i = 0; i < position; i++) {
            if (text.charAt(i) === '@') {
                atCount++;
            }
        }
        
        // Si le nombre de @ est impair, on est à l'intérieur d'un champ
        const isInside = (atCount % 2) === 1;
        
        if (isInside) {
            console.log('🔍 Position', position, '- @ avant:', atCount, '(impair) → DEDANS un champ');
        } else {
            console.log('🔍 Position', position, '- @ avant:', atCount, '(pair) → DEHORS');
        }
        
        return isInside;
    }
    
    /**
     * Calcule les espaces à ajouter autour d'un champ de fusion selon le contexte
     * @param {Object} quill - Instance Quill
     * @param {number} insertIndex - Position d'insertion
     * @param {string} fieldText - Texte du champ à insérer (ex: "@NOM@")
     * @returns {{text: string, cursorOffset: number}|null} Texte avec espaces et offset, ou null si interdit
     */
    function getFieldTextWithSpaces(quill, insertIndex, fieldText) {
        const text = quill.getText();
        const length = text.length;
        
        // Caractère avant la position d'insertion
        const charBefore = insertIndex > 0 ? text.charAt(insertIndex - 1) : '';
        // Caractère après la position d'insertion
        const charAfter = insertIndex < length ? text.charAt(insertIndex) : '';
        
        // INTERDIT : au milieu d'un mot (caractère alphanumérique avant ET après)
        if (isAlphanumeric(charBefore) && isAlphanumeric(charAfter)) {
            console.log('❌ Drop interdit: au milieu d\'un mot', {
                charBefore,
                charAfter
            });
            return null; // Signale que le drop est interdit
        }
        
        // INTERDIT : à l'intérieur d'un champ de fusion existant @...@
        if (isInsideMergeField(text, insertIndex)) {
            console.log('❌ Drop interdit: à l\'intérieur d\'un champ de fusion existant');
            return null;
        }
        
        let spaceBefore = '';
        let spaceAfter = '';
        
        // Déterminer si on doit ajouter un espace AVANT
        if (insertIndex > 0 && charBefore !== '') {
            // Pas d'espace si :
            // - caractère avant est un retour ligne (\n)
            // - caractère avant est déjà un espace
            // - on est au tout début
            if (charBefore !== '\n' && charBefore !== ' ' && charBefore !== '\t') {
                spaceBefore = ' ';
            }
        }
        
        // Déterminer si on doit ajouter un espace APRÈS
        // Note: le dernier caractère de Quill est toujours \n, donc on vérifie length - 1
        if (insertIndex < length - 1 && charAfter !== '') {
            // Pas d'espace si :
            // - caractère après est un retour ligne (\n)
            // - caractère après est déjà un espace
            // - caractère après est une ponctuation (, . ; : ! ?)
            // - on est à la fin
            const punctuation = [',', '.', ';', ':', '!', '?'];
            if (charAfter !== '\n' && charAfter !== ' ' && charAfter !== '\t' && !punctuation.includes(charAfter)) {
                spaceAfter = ' ';
            }
        }
        
        // Remplacer les espaces normales par des espaces insécables dans le champ
        const fieldTextNbsp = fieldText.replace(/ /g, '\u00A0');
        const finalText = spaceBefore + fieldTextNbsp + spaceAfter;
        const cursorOffset = spaceBefore.length + fieldTextNbsp.length;
        
        console.log('📋 Espaces auto:', {
            charBefore: charBefore === '\n' ? '\\n' : charBefore === ' ' ? '(espace)' : charBefore || '(début)',
            charAfter: charAfter === '\n' ? '\\n' : charAfter === ' ' ? '(espace)' : charAfter || '(fin)',
            spaceBefore: spaceBefore ? 'OUI' : 'NON',
            spaceAfter: spaceAfter ? 'OUI' : 'NON',
            result: finalText
        });
        
        return {
            text: finalText,
            cursorOffset: cursorOffset
        };
    }
    
    /**
     * Configure les événements drag-and-drop pour une zone textQuill
     * Permet de recevoir les champs de fusion par glisser-déposer
     * Utilise caretRangeFromPoint pour détecter la position d'insertion sous la souris
     * @param {HTMLElement} zoneElement - L'élément DOM de la zone
     * @param {string} zoneId - L'ID de la zone
     */
    function setupTextQuillDropZone(zoneElement, zoneId) {
        if (!zoneElement) return;
        
        // Variable pour stocker la position d'insertion détectée
        let dropInsertIndex = null;
        
        // Empêcher le comportement par défaut pour autoriser le drop
        zoneElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Récupérer l'instance Quill
            const quill = quillInstances.get(zoneId);
            if (!quill) return;
            
            // Trouver la position du texte sous la souris
            const editorElement = zoneElement.querySelector('.ql-editor');
            if (editorElement) {
                // Utiliser caretRangeFromPoint pour trouver la position
                const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                if (range && editorElement.contains(range.startContainer)) {
                    // Convertir la position DOM en index Quill
                    const blot = Quill.find(range.startContainer, true);
                    if (blot) {
                        const index = quill.getIndex(blot) + range.startOffset;
                        dropInsertIndex = index;
                        
                        // Afficher le curseur à cette position
                        quill.setSelection(index, 0, 'silent');
                    }
                }
            }
            
            // Vérifier si le drop est autorisé à cette position
            if (dropInsertIndex !== null) {
                const text = quill.getText();
                const charBefore = dropInsertIndex > 0 ? text.charAt(dropInsertIndex - 1) : '';
                const charAfter = dropInsertIndex < text.length ? text.charAt(dropInsertIndex) : '';
                
                // Vérifier si position invalide (milieu d'un mot OU dans un champ existant)
                const isInvalidPosition = (isAlphanumeric(charBefore) && isAlphanumeric(charAfter)) 
                                        || isInsideMergeField(text, dropInsertIndex);

                if (isInvalidPosition) {
                    // Position invalide - afficher en rouge avec curseur interdit
                    zoneElement.classList.add('drop-target-invalid');
                    zoneElement.classList.remove('drop-target');
                    e.dataTransfer.dropEffect = 'none';
                    return;
                }
            }
            
            zoneElement.classList.remove('drop-target-invalid');
            zoneElement.classList.add('drop-target');
            e.dataTransfer.dropEffect = 'copy';
        });
        
        zoneElement.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zoneElement.classList.remove('drop-target');
            zoneElement.classList.remove('drop-target-invalid');
            dropInsertIndex = null;
            
            // Masquer le curseur si on quitte la zone
            const quill = quillInstances.get(zoneId);
            if (quill) {
                quill.blur();
            }
        });
        
        zoneElement.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zoneElement.classList.remove('drop-target');
            zoneElement.classList.remove('drop-target-invalid');
            
            // Récupérer le champ de fusion
            const fieldName = e.dataTransfer.getData('application/x-merge-field');
            const fieldText = e.dataTransfer.getData('text/plain');
            
            if (!fieldText) {
                dropInsertIndex = null;
                return;
            }
            
            // Récupérer l'instance Quill
            const quill = quillInstances.get(zoneId);
            if (!quill) {
                console.warn('❌ Drop: instance Quill non trouvée pour', zoneId);
                dropInsertIndex = null;
                return;
            }
            
            // Utiliser la position détectée pendant le dragover, sinon fin du texte
            const insertIndex = (dropInsertIndex !== null) 
                ? dropInsertIndex 
                : quill.getLength() - 1;
            
            // Calculer les espaces selon le contexte (ou null si interdit)
            const result = getFieldTextWithSpaces(quill, insertIndex, fieldText);
            
            if (result === null) {
                // Drop interdit - position invalide
                console.log('❌ Drop annulé: position invalide');
                dropInsertIndex = null;
                return;
            }
            
            const { text: textWithSpaces, cursorOffset } = result;
            
            // Sélectionner la zone si pas déjà fait
            if (!selectedZoneIds.includes(zoneId)) {
                deselectAll();
                selectZone(zoneElement);
            }
            
            // Focus sur l'éditeur Quill
            quill.focus();
            
            quill.insertText(insertIndex, textWithSpaces, 'user');
            
            // Placer le curseur après le texte inséré (incluant l'espace avant)
            quill.setSelection(insertIndex + cursorOffset, 0);
            
            console.log('📋 Drop réussi:', textWithSpaces, 'dans', zoneId, 'à position', insertIndex);
            
            // Reset
            dropInsertIndex = null;
            
            // Sauvegarder le contenu Quill
            try {
                const zonesData = getCurrentPageZones();
                if (zonesData && zonesData[zoneId]) {
                    zonesData[zoneId].quillDelta = quill.getContents();
                }
                saveToLocalStorage();
                saveState();
            } catch (e) {
                console.warn('⚠️ Erreur sauvegarde après drop:', e);
            }
        });
        
        console.log('🎯 Drop zone configurée pour', zoneId);
    }

    // Initialiser la toolbar Data et les combos avec les champs par défaut
    updateMergeFieldsUI(mergeFields);
    // Note : updateAllFieldSelects() est appelé dans updateMergeFieldsUI()

    /**
     * Insère un champ de fusion à la position du curseur.
     *
     * Comportement :
     * - Si une zone `textQuill` est sélectionnée : insertion dans Quill via `quill.insertText()`
     * - Sinon : insertion dans le textarea (`input-content`) via remplacement de chaîne
     *
     * Format inséré : `@NOM_DU_CHAMP@`
     *
     * @param {string} fieldName - Nom du champ à insérer (sans les @)
     * @returns {void}
     */
    function insertTag(fieldName) {
        // Remplacer les espaces par des espaces insécables dans le nom du champ
        const fieldNameNbsp = fieldName.replace(/ /g, '\u00A0');
        const tag = `@${fieldNameNbsp}@`; // Syntaxe WebDev avec espaces insécables

        // Phase 6 : insertion dans une zone textQuill (si sélection unique)
        if (selectedZoneIds.length === 1) {
            const zoneId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData ? zonesData[zoneId] : null;

            if (zoneData && zoneData.type === 'textQuill') {
                const quill = quillInstances.get(zoneId);
                if (quill) {
                    const range = quill.getSelection(true);
                    const insertIndex = range
                        ? range.index
                        : Math.max(0, (typeof quill.getLength === 'function' ? quill.getLength() : 1) - 1);

                    // Calculer les espaces selon le contexte (ou null si interdit)
                    const result = getFieldTextWithSpaces(quill, insertIndex, tag);
                    
                    if (result === null) {
                        // Déterminer la raison pour le message
                        console.log('❌ Insertion annulée: position invalide');
                        return;
                    }
                    
                    const { text: textWithSpaces, cursorOffset } = result;
                    
                    quill.insertText(insertIndex, textWithSpaces, 'user');
                    quill.setSelection(insertIndex + cursorOffset, 0, 'silent');
                    try { quill.focus(); } catch (e) {}

                    // Persister immédiatement (en plus du text-change debounce)
                    zonesData[zoneId].quillDelta = quill.getContents();
                    saveToLocalStorage();
                    saveState();

                    console.log('🔧 PHASE 6 - Insertion champ fusion:', textWithSpaces, 'dans zone:', zoneId);
                    return;
                }
            }
        }

        // Fallback : insertion dans le textarea (zones "text" classiques)
        if (!inputContent) return;

        const start = inputContent.selectionStart;
        const end = inputContent.selectionEnd;
        const text = inputContent.value;

        // Insertion au curseur
        inputContent.value = text.substring(0, start) + tag + text.substring(end);

        // Repositionner le curseur après le tag
        inputContent.selectionStart = inputContent.selectionEnd = start + tag.length;
        inputContent.focus();

        // Forcer la mise à jour de l'aperçu
        inputContent.dispatchEvent(new Event('input'));
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 5 : POLICES DYNAMIQUES
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Gestion dynamique des polices de caractères depuis le JSON WebDev.
     * 
     * Fonctions principales :
     *   - loadFontsFromJson() : Injecte les règles @font-face
     *   - updateFontSelectUI() : Met à jour le sélecteur de polices
     * 
     * Dépendances :
     *   - inputFont (Section 1) : Sélecteur de police dans le formulaire
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Injecte les règles @font-face pour les polices disponibles (avec variantes).
     *
     * Variantes supportées :
     * - regular : (weight/style) depuis police.url
     * - bold : font-weight 700 depuis police.boldUrl
     * - italic : font-style italic depuis police.italicUrl
     * - boldItalic : font-weight 700 + italic depuis police.boldItalicUrl
     *
     * @param {PoliceDisponible[]} polices - Liste des polices disponibles
     * @returns {void}
     */
    function loadFontsFromJson(polices) {
        if (!polices || polices.length === 0) {
            console.log('loadFontsFromJson: Aucune police à charger');
            return;
        }
        
        // Supprimer l'ancien style si existant
        const oldStyle = document.getElementById('dynamic-fonts-style');
        if (oldStyle) oldStyle.remove();
        
        // Créer un nouvel élément style
        const styleEl = document.createElement('style');
        styleEl.id = 'dynamic-fonts-style';
        
        let cssRules = '';

        /**
         * Retourne le format CSS d'une police à partir de son URL.
         * @param {string} fontUrl - URL du fichier police
         * @returns {'woff2'|'woff'|'opentype'|'truetype'} format
         */
        function getFontFormatFromUrl(fontUrl) {
            const u = String(fontUrl || '').toLowerCase();
            if (u.endsWith('.woff2')) return 'woff2';
            if (u.endsWith('.woff')) return 'woff';
            if (u.endsWith('.otf')) return 'opentype';
            return 'truetype';
        }

        /**
         * Ajoute une règle @font-face dans la feuille dynamique.
         * @param {string} family - Nom de la famille (font-family)
         * @param {string} fontUrl - URL du fichier
         * @param {number|string} weight - font-weight
         * @param {'normal'|'italic'} style - font-style
         * @returns {void}
         */
        function addFontFaceRule(family, fontUrl, weight, style) {
            if (!family || !fontUrl) return;
            const format = getFontFormatFromUrl(fontUrl);
            cssRules += `
@font-face {
    font-family: '${family}';
    src: url('${fontUrl}') format('${format}');
    font-weight: ${weight};
    font-style: ${style};
    font-display: swap;
}
`;
        }

        polices.forEach(police => {
            if (!police || !police.nom || !police.url) {
                console.warn('loadFontsFromJson: Police invalide (nom ou url manquant)', police);
                return;
            }

            const family = police.nom;
            const baseWeight = typeof police.weight === 'number' ? police.weight : 400;
            const baseStyle = (police.style === 'italic') ? 'italic' : 'normal';

            // Regular (base)
            addFontFaceRule(family, police.url, baseWeight, baseStyle);

            // Bold
            if (police.boldUrl) {
                addFontFaceRule(family, police.boldUrl, 700, 'normal');
            }

            // Italic
            if (police.italicUrl) {
                addFontFaceRule(family, police.italicUrl, baseWeight, 'italic');
            }

            // BoldItalic
            if (police.boldItalicUrl) {
                addFontFaceRule(family, police.boldItalicUrl, 700, 'italic');
            }

            console.log(`  → Police "${family}" injectée (regular + variantes si dispo)`);
        });
        
        styleEl.textContent = cssRules;
        document.head.appendChild(styleEl);
        
        console.log(`loadFontsFromJson: ${polices.length} police(s) injectée(s)`);
    }
    
    /**
     * Met à jour la liste des polices dans le sélecteur UI
     *
     * - Affiche toutes les polices reçues
     * - Ajoute des attributs data-* par option (pour usage futur)
     *
     * @param {PoliceDisponible[]|null|undefined} polices - Liste des polices disponibles
     * @returns {void}
     */
    function updateFontSelectUI(polices) {
        if (!inputFont) return;
        
        // Sauvegarder la valeur actuelle
        const currentValue = inputFont.value;
        
        // Vider le sélecteur
        inputFont.innerHTML = '';
        
        // Si pas de polices fournies, utiliser les polices par défaut
        /** @type {PoliceDisponible[]} */
        const fontsToUse = (polices && Array.isArray(polices) && polices.length > 0) ? polices : DEFAULT_FONTS;
        
        fontsToUse.forEach(police => {
            if (!police || !police.nom) return;
            const fontName = police.nom;
            const option = document.createElement('option');
            option.value = fontName;
            option.textContent = fontName;
            option.style.fontFamily = `'${fontName}', sans-serif`; // Aperçu dans le dropdown
            option.dataset.id = String(police.id);
            option.dataset.hasBold = (police.boldUrl || police.boldItalicUrl) ? '1' : '0';
            option.dataset.hasItalic = (police.italicUrl || police.boldItalicUrl) ? '1' : '0';
            inputFont.appendChild(option);
        });
        
        // Restaurer la valeur si elle existe toujours, sinon prendre la première
        if (fontsToUse.some(p => p && p.nom === currentValue)) {
            inputFont.value = currentValue;
        } else if (fontsToUse.length > 0) {
            inputFont.value = fontsToUse[0].nom;
        }
        
        console.log(`updateFontSelectUI: ${fontsToUse.length} police(s) dans le sélecteur`);
    }

    /**
     * Met à jour la liste des polices dans le sélecteur UI de la toolbar Quill.
     *
     * - Affiche toutes les polices reçues
     * - Ajoute des attributs data-* par option (pour usage futur)
     *
     * @param {PoliceDisponible[]|null|undefined} polices - Liste des polices disponibles
     * @returns {void}
     */
    function updateQuillFontSelectUI(polices) {
        if (!quillInputFont) return;

        const currentValue = quillInputFont.value;
        quillInputFont.innerHTML = '';

        /** @type {PoliceDisponible[]} */
        const fontsToUse = (polices && Array.isArray(polices) && polices.length > 0) ? polices : DEFAULT_FONTS;

        fontsToUse.forEach(police => {
            if (!police || !police.nom) return;
            const fontName = police.nom;
            const option = document.createElement('option');
            option.value = fontName;
            option.textContent = fontName;
            option.style.fontFamily = `'${fontName}', sans-serif`;
            option.dataset.id = String(police.id);
            option.dataset.hasBold = (police.boldUrl || police.boldItalicUrl) ? '1' : '0';
            option.dataset.hasItalic = (police.italicUrl || police.boldItalicUrl) ? '1' : '0';
            quillInputFont.appendChild(option);
        });

        if (fontsToUse.some(p => p && p.nom === currentValue)) {
            quillInputFont.value = currentValue;
        } else if (fontsToUse.length > 0) {
            quillInputFont.value = fontsToUse[0].nom;
        }

        console.log(`updateQuillFontSelectUI: ${fontsToUse.length} police(s) dans le sélecteur Quill`);
    }
    
    // Exposer les fonctions globalement (pour debug et appel depuis WebDev)
    window.loadFontsFromJson = loadFontsFromJson;
    window.updateFontSelectUI = updateFontSelectUI;
    window.updateQuillFontSelectUI = updateQuillFontSelectUI;

    // Mode standalone : initialiser les polices par défaut si WebDev n'a pas encore fourni la liste.
    if (!policesDisponibles || policesDisponibles.length === 0) {
        policesDisponibles = DEFAULT_FONTS;
        loadFontsFromJson(policesDisponibles);
        updateFontSelectUI(policesDisponibles);
        updateQuillFontSelectUI(policesDisponibles);
    }

    // ─────────────────────────────── FIN SECTION 5 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 6 : CONVERSIONS MM/PIXELS ET MARGES
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Utilitaires de conversion entre millimètres et pixels.
     * Gestion des marges de sécurité du document.
     * 
     * Constantes :
     *   - MM_PER_PIXEL : Ratio mm/pixel (basé sur 96 DPI)
     *   - DEFAULT_SECURITY_MARGIN_MM : Marge par défaut (8mm)
     * 
     * Fonctions principales :
     *   - mmToPx() : Convertit mm en pixels
     *   - pxToMm() : Convertit pixels en mm
     *   - getSecurityMarginMm() / getSecurityMarginPx() : Marge de sécurité
     *   - getGeometryLimits() : Limites de positionnement
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - getPageWidthMm(), getPageHeightMm() (Section 12)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    const MM_PER_PIXEL = 25.4 / 96;
    const DEFAULT_SECURITY_MARGIN_MM = 8;  // Marge de sécurité par défaut : 8mm
    
    /**
     * Convertit des millimètres en pixels (basé sur 96 DPI).
     * Formule : pixels = mm / (25.4 / 96) = mm * 96 / 25.4
     * 
     * @param {number} mm - Valeur en millimètres
     * @returns {number} Valeur en pixels (non arrondie)
     * 
     * @example
     * mmToPx(25.4); // → 96 (1 pouce = 96 pixels à 96 DPI)
     * mmToPx(210);  // → 794.4 (largeur A4)
     */
    function mmToPx(mm) {
        return mm / MM_PER_PIXEL;
    }
    
    /**
     * Convertit des pixels en millimètres (basé sur 96 DPI).
     * Le résultat est arrondi à 1 décimale pour éviter les erreurs de précision.
     * Formule : mm = pixels * (25.4 / 96)
     * 
     * @param {number} px - Valeur en pixels
     * @returns {number} Valeur en millimètres (arrondie à 1 décimale)
     * 
     * @example
     * pxToMm(96);  // → 25.4 (1 pouce)
     * pxToMm(794); // → 210.1 (largeur A4 approximative)
     */
    function pxToMm(px) {
        return Math.round(px * MM_PER_PIXEL * 10) / 10;
    }
    
    /**
     * Retourne la marge de sécurité du document en millimètres.
     * Utilisée pour définir la zone imprimable (hors marges).
     * 
     * @returns {number} Marge de sécurité en mm (défaut: 8mm via DEFAULT_SECURITY_MARGIN_MM)
     * 
     * @see documentState.formatDocument.margeSecuriteMm
     */
    function getSecurityMarginMm() {
        return documentState.formatDocument?.margeSecuriteMm || DEFAULT_SECURITY_MARGIN_MM;
    }
    
    /**
     * Retourne la marge de sécurité du document en pixels.
     * Conversion de la marge mm vers pixels pour le positionnement DOM.
     * 
     * @returns {number} Marge de sécurité en pixels
     * 
     * @see getSecurityMarginMm
     */
    function getSecurityMarginPx() {
        return mmToPx(getSecurityMarginMm());
    }
    
    /**
     * Calcule les limites de positionnement et dimensionnement avec marge de sécurité.
     * Utilisé pour contraindre les zones dans la zone imprimable.
     * 
     * @returns {Object} Objet contenant les limites en mm
     * @returns {number} returns.minX - Position X minimale (= marge)
     * @returns {number} returns.minY - Position Y minimale (= marge)
     * @returns {number} returns.maxX - Position X maximale (= largeur - marge)
     * @returns {number} returns.maxY - Position Y maximale (= hauteur - marge)
     * @returns {number} returns.pageWidthMm - Largeur totale de la page en mm
     * @returns {number} returns.pageHeightMm - Hauteur totale de la page en mm
     * @returns {number} returns.marginMm - Marge de sécurité en mm
     * 
     * @example
     * const limits = getGeometryLimits();
     * // Pour A4 avec marge 8mm :
     * // { minX: 8, minY: 8, maxX: 202, maxY: 289, pageWidthMm: 210, pageHeightMm: 297, marginMm: 8 }
     */
    function getGeometryLimits() {
        const marginMm = getSecurityMarginMm();
        // Utiliser les dimensions mm EXACTES (pas de conversion depuis pixels)
        const pageWidthMm = getPageWidthMm();
        const pageHeightMm = getPageHeightMm();

        return {
            minX: marginMm,
            minY: marginMm,
            maxX: pageWidthMm - marginMm,
            maxY: pageHeightMm - marginMm,
            pageWidthMm: pageWidthMm,
            pageHeightMm: pageHeightMm,
            marginMm: marginMm
        };
    }

    // ─────────────────────────────── FIN SECTION 6 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 7 : CONTRAINTES ZONES IMAGE (Surface/DPI)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Constantes et fonctions pour les contraintes des zones image.
     * Limite la surface maximale et définit les seuils DPI.
     * 
     * Constantes :
     *   - DEFAULT_SURFACE_MAX_IMAGE_MM2 : Surface max absolue (20000 mm²)
     *   - DPI_MINIMUM, DPI_RECOMMENDED : Seuils qualité (150/200 dpi)
     * 
     * Fonctions principales :
     *   - getSurfaceLimiteImageMm2() : Surface limite en mm²
     *   - getSurfaceLimiteImagePx2() : Surface limite en pixels²
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - MM_PER_PIXEL (Section 6)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    const DEFAULT_SURFACE_MAX_IMAGE_MM2 = 20000;  // Surface max absolue en mm²
    const DEFAULT_POURCENTAGE_MAX_IMAGE = 50;     // % max de la surface document
    const IMAGE_MAX_DIMENSION_PX = 1500;          // Dimension max après compression
    // const IMAGE_COMPRESSION_QUALITY = 0.85;    // Obsolète : PNG utilisé (lossless)
    const IMAGE_MAX_UPLOAD_SIZE = 10 * 1024 * 1024;  // 10 Mo max à l'upload
    const IMAGE_MAX_COMPRESSED_SIZE = 2 * 1024 * 1024;  // 2 Mo max après compression
    const DPI_MINIMUM = 150;
    const DPI_RECOMMENDED = 200;
    
    /**
     * Calcule la surface limite effective pour les zones images
     * Retourne le minimum entre la limite absolue et la limite relative (% du document)
     * @returns {number} Surface limite en mm²
     */
    function getSurfaceLimiteImageMm2() {
        // Surface du document en mm²
        const largeurMm = getPageWidth() * MM_PER_PIXEL;
        const hauteurMm = getPageHeight() * MM_PER_PIXEL;
        const surfaceDocMm2 = largeurMm * hauteurMm;
        
        // Paramètres (avec valeurs par défaut)
        const surfaceMaxAbsolue = documentState.formatDocument?.surfaceMaxImageMm2 || DEFAULT_SURFACE_MAX_IMAGE_MM2;
        const pourcentageMax = documentState.formatDocument?.pourcentageMaxImage || DEFAULT_POURCENTAGE_MAX_IMAGE;
        
        // Limite relative
        const surfaceMaxRelative = surfaceDocMm2 * (pourcentageMax / 100);
        
        // Retourne le minimum des deux
        return Math.min(surfaceMaxAbsolue, surfaceMaxRelative);
    }
    
    /**
     * Convertit la surface limite en pixels² pour comparaison avec les zones
     * @returns {number} Surface limite en pixels²
     */
    function getSurfaceLimiteImagePx2() {
        const surfaceMm2 = getSurfaceLimiteImageMm2();
        const pxPerMm = 1 / MM_PER_PIXEL;
        return surfaceMm2 * pxPerMm * pxPerMm;
    }

    // ─────────────────────────────── FIN SECTION 7 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 8 : UPLOAD ET COMPRESSION IMAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Fonctions pour l'upload, la compression et l'affichage des images.
     * 
     * Fonctions principales :
     *   - formatFileSize() : Formatage taille fichier
     *   - isImageFormatAccepted() : Validation format fichier
     *   - isSvgFile() : Détection fichier SVG
     *   - compressImage() : Compression via Canvas
     *   - readSvgFile() : Lecture SVG sans compression
     *   - showImageUploadError() : Affichage erreur upload
     *   - showImageLoading() : Indicateur de chargement
     *   - updateImageFileInfoDisplay() : Mise à jour infos fichier
     * 
     * Dépendances :
     *   - imageFileInfo, imageDpiIndicator (Section 1)
     *   - IMAGE_MAX_DIMENSION_PX (Section 7)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Vérifie si le navigateur supporte le format WebP
     * @returns {boolean}
     */
    // Fonction obsolète : PNG utilisé systématiquement pour compatibilité PrintShop Mail
    // function supportsWebP() {
    //     const canvas = document.createElement('canvas');
    //     canvas.width = 1;
    //     canvas.height = 1;
    //     return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    // }
    
    /**
     * Formate une taille de fichier en Ko ou Mo
     * @param {number} bytes - Taille en octets
     * @returns {string} - Taille formatée
     */
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' o';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko';
        return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    }
    
    /**
     * Vérifie si un format de fichier est accepté
     * @param {string} fileName - Nom du fichier
     * @returns {boolean}
     */
    function isImageFormatAccepted(fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext);
    }
    
    /**
     * Vérifie si un fichier est un SVG (image vectorielle).
     * Les SVG n'ont pas de contrainte DPI car ils sont redimensionnables sans perte.
     * 
     * @param {string} fileName - Nom du fichier (avec extension)
     * @returns {boolean} true si l'extension est .svg (insensible à la casse)
     * 
     * @example
     * isSvgFile('logo.svg');     // → true
     * isSvgFile('photo.PNG');    // → false
     * isSvgFile('LOGO.SVG');     // → true
     */
    function isSvgFile(fileName) {
        return fileName.toLowerCase().endsWith('.svg');
    }
    
    /**
     * Redimensionne une image via Canvas et l'encode en PNG.
     * Le format PNG est utilisé pour la compatibilité PrintShop Mail et le support de la transparence.
     * 
     * @param {File} file - Fichier image original (JPG, PNG, WebP)
     * @returns {Promise<{base64: string, width: number, height: number, size: number}>}
     */
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculer les nouvelles dimensions (max IMAGE_MAX_DIMENSION_PX côté long)
                    if (width > IMAGE_MAX_DIMENSION_PX || height > IMAGE_MAX_DIMENSION_PX) {
                        if (width > height) {
                            height = Math.round(height * IMAGE_MAX_DIMENSION_PX / width);
                            width = IMAGE_MAX_DIMENSION_PX;
                        } else {
                            width = Math.round(width * IMAGE_MAX_DIMENSION_PX / height);
                            height = IMAGE_MAX_DIMENSION_PX;
                        }
                    }
                    
                    // Créer le canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Format PNG : compatible PrintShop Mail + supporte la transparence
                    const base64 = canvas.toDataURL('image/png');
                    
                    // Calculer la taille du base64 (approximation)
                    const base64Size = Math.round((base64.length - 22) * 3 / 4);
                    
                    resolve({
                        base64: base64,
                        width: width,
                        height: height,
                        size: base64Size
                    });
                };
                
                img.onerror = function() {
                    reject(new Error('Impossible de charger l\'image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                reject(new Error('Impossible de lire le fichier'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Lit un fichier SVG en base64 sans compression
     * @param {File} file - Fichier SVG
     * @returns {Promise<{base64: string, width: number, height: number, size: number}>}
     */
    function readSvgFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const base64 = e.target.result;
                
                // Essayer d'extraire les dimensions du SVG
                const svgText = atob(base64.split(',')[1]);
                let width = 100, height = 100; // Valeurs par défaut
                
                const widthMatch = svgText.match(/width=["'](\d+)/);
                const heightMatch = svgText.match(/height=["'](\d+)/);
                const viewBoxMatch = svgText.match(/viewBox=["'][\d.]+ [\d.]+ ([\d.]+) ([\d.]+)/);
                
                if (widthMatch && heightMatch) {
                    width = parseInt(widthMatch[1]);
                    height = parseInt(heightMatch[1]);
                } else if (viewBoxMatch) {
                    width = Math.round(parseFloat(viewBoxMatch[1]));
                    height = Math.round(parseFloat(viewBoxMatch[2]));
                }
                
                resolve({
                    base64: base64,
                    width: width,
                    height: height,
                    size: file.size
                });
            };
            
            reader.onerror = function() {
                reject(new Error('Impossible de lire le fichier SVG'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Affiche un message d'erreur dans la zone upload
     * @param {string} message - Message d'erreur
     */
    function showImageUploadError(message) {
        // Masquer l'info fichier
        if (imageFileInfo) imageFileInfo.style.display = 'none';
        if (imageDpiIndicator) imageDpiIndicator.style.display = 'none';
        
        // Créer ou mettre à jour le message d'erreur
        let errorDiv = document.getElementById('image-upload-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'image-upload-error';
            errorDiv.className = 'image-upload-error';
            if (imageUploadGroup) {
                imageUploadGroup.insertBefore(errorDiv, imageFileInfo);
            }
        }
        
        errorDiv.innerHTML = `
            <span class="material-icons">error</span>
            <span>${message}</span>
        `;
        errorDiv.style.display = 'flex';
        
        // Masquer après 5 secondes
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }
    
    /**
     * Masque le message d'erreur upload
     */
    function hideImageUploadError() {
        const errorDiv = document.getElementById('image-upload-error');
        if (errorDiv) errorDiv.style.display = 'none';
    }
    
    /**
     * Affiche l'état de chargement pendant la compression
     * @param {boolean} show - Afficher ou masquer
     */
    function showImageLoading(show) {
        let loadingDiv = document.getElementById('image-loading-indicator');
        
        if (show) {
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.id = 'image-loading-indicator';
                loadingDiv.className = 'image-loading';
                loadingDiv.innerHTML = `
                    <span class="material-icons">hourglass_empty</span>
                    <span>Compression en cours...</span>
                `;
                if (imageUploadGroup) {
                    imageUploadGroup.insertBefore(loadingDiv, imageFileInfo);
                }
            }
            loadingDiv.style.display = 'flex';
        } else {
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    }
    
    /**
     * Met à jour l'affichage des infos fichier dans le panneau (structure POC)
     * @param {Object} source - Données source de la zone image
     */
    function updateImageFileInfoDisplay(source) {
        if (!source || !source.imageBase64) {
            // Pas d'image : afficher le placeholder
            if (imageFileInfo) {
                imageFileInfo.className = 'file-info-poc empty';
                imageFileInfo.innerHTML = 'Aucune image sélectionnée';
            }
            if (imageDpiIndicator) {
                imageDpiIndicator.className = 'dpi-indicator-poc';
                imageDpiIndicator.innerHTML = '— Aucune image';
            }
            if (imageBtnClear) imageBtnClear.disabled = true;
            return;
        }
        
        // Afficher les infos (structure POC)
        if (imageFileInfo) {
            imageFileInfo.className = 'file-info-poc';
            const fileName = source.nomOriginal || 'image';
            const dimensions = `${source.largeurPx || 0} × ${source.hauteurPx || 0} px`;
            const fileSize = formatFileSize(source.poidsCompresse || source.poidsBrut || 0);
            
            imageFileInfo.innerHTML = `
                <div class="file-info-name-poc">📎 ${fileName}</div>
                <div class="file-info-details-poc">
                    <span>${dimensions}</span>
                    <span>${fileSize}</span>
                </div>
            `;
        }
        
        // Activer le bouton Vider
        if (imageBtnClear) imageBtnClear.disabled = false;
        
        // Mettre à jour l'indicateur DPI
        updateDpiIndicator();
    }

    // ─────────────────────────────── FIN SECTION 8 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 9 : CALCUL DPI ET BADGES
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Calcul et affichage de la résolution (DPI) des images.
     * Gestion des badges visuels sur les zones.
     * 
     * Fonctions principales :
     *   - calculateImageDpi() : Calcul DPI selon mode d'affichage
     *   - getDpiState() : Détermine l'état (good/warning/error/vector)
     *   - getDpiDisplayInfo() : Génère texte et icône
     *   - updateDpiIndicator() : Met à jour l'indicateur dans le panneau
     *   - updateImageDpiBadge() : Met à jour le badge sur la zone
     *   - updateSystemeBadge() : Met à jour le badge système
     * 
     * Dépendances :
     *   - DPI_MINIMUM, DPI_RECOMMENDED (Section 7)
     *   - MM_PER_PIXEL (Section 6)
     *   - getCurrentPageZones() (Section 12)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Calcule le DPI (Dots Per Inch) effectif d'une image affichée dans une zone.
     * Le DPI dépend du mode d'affichage et des dimensions relatives image/zone.
     * 
     * Modes d'affichage :
     * - 'initial' : Image à taille native (DPI = 96 car 1px écran = 1px image)
     * - 'ajuster' : Image inscrite dans la zone (conserve le ratio, peut avoir des marges)
     * - 'couper' : Image remplit la zone (conserve le ratio, peut être rognée)
     * 
     * @param {number} imagePxWidth - Largeur de l'image source en pixels
     * @param {number} imagePxHeight - Hauteur de l'image source en pixels
     * @param {number} zonePxWidth - Largeur de la zone d'affichage en pixels
     * @param {number} zonePxHeight - Hauteur de la zone d'affichage en pixels
     * @param {'initial'|'ajuster'|'couper'} [displayMode='ajuster'] - Mode d'affichage de l'image
     * @returns {number} DPI calculé (arrondi), 0 si dimensions invalides
     * 
     * @example
     * // Image 1200x800 dans zone 100x100mm (378x378px) en mode ajuster
     * calculateImageDpi(1200, 800, 378, 378, 'ajuster');
     * // → ~200 DPI (image réduite pour tenir dans la zone)
     * 
     * @see DPI_RECOMMENDED - Seuil recommandé (300 DPI)
     * @see DPI_MINIMUM - Seuil minimum (150 DPI)
     */
    function calculateImageDpi(imagePxWidth, imagePxHeight, zonePxWidth, zonePxHeight, displayMode = 'ajuster') {
        if (!imagePxWidth || !imagePxHeight || !zonePxWidth || !zonePxHeight) {
            return 0;
        }
        
        // Convertir les dimensions de la zone en mm
        const zoneWidthMm = zonePxWidth * MM_PER_PIXEL;
        const zoneHeightMm = zonePxHeight * MM_PER_PIXEL;
        
        // Convertir mm en pouces (1 pouce = 25.4 mm)
        const zoneWidthInches = zoneWidthMm / 25.4;
        const zoneHeightInches = zoneHeightMm / 25.4;
        
        let effectiveImageWidth = imagePxWidth;
        let effectiveImageHeight = imagePxHeight;
        
        if (displayMode === 'initial') {
            // Mode initial : l'image garde sa taille native
            // Le DPI dépend de la taille réelle affichée (= taille image)
            // On calcule comme si la zone était de la taille de l'image
            const imageWidthMm = imagePxWidth * MM_PER_PIXEL;
            const imageHeightMm = imagePxHeight * MM_PER_PIXEL;
            const imageWidthInches = imageWidthMm / 25.4;
            const imageHeightInches = imageHeightMm / 25.4;
            
            const dpiH = imagePxWidth / imageWidthInches;
            const dpiV = imagePxHeight / imageHeightInches;
            return Math.round(Math.min(dpiH, dpiV));
            
        } else if (displayMode === 'couper') {
            // Mode couper : l'image remplit toute la zone (peut être rognée)
            // On prend le ratio le plus grand pour couvrir la zone
            const scaleX = zonePxWidth / imagePxWidth;
            const scaleY = zonePxHeight / imagePxHeight;
            const scale = Math.max(scaleX, scaleY);
            
            // L'image est agrandie/réduite par ce facteur
            effectiveImageWidth = imagePxWidth * scale;
            effectiveImageHeight = imagePxHeight * scale;
            
        } else {
            // Mode ajuster (défaut) : l'image s'inscrit dans la zone
            // On prend le ratio le plus petit pour tenir dans la zone
            const scaleX = zonePxWidth / imagePxWidth;
            const scaleY = zonePxHeight / imagePxHeight;
            const scale = Math.min(scaleX, scaleY);
            
            effectiveImageWidth = imagePxWidth * scale;
            effectiveImageHeight = imagePxHeight * scale;
        }
        
        // Calculer le DPI basé sur les dimensions effectives
        // DPI = pixels originaux / taille affichée en pouces
        const effectiveWidthInches = (effectiveImageWidth * MM_PER_PIXEL) / 25.4;
        const effectiveHeightInches = (effectiveImageHeight * MM_PER_PIXEL) / 25.4;
        
        const dpiH = imagePxWidth / effectiveWidthInches;
        const dpiV = imagePxHeight / effectiveHeightInches;
        
        // Retourner le DPI le plus faible (le plus contraignant)
        return Math.round(Math.min(dpiH, dpiV));
    }
    
    /**
     * Détermine l'état qualité DPI d'une image pour l'affichage du badge.
     * 
     * Seuils de qualité :
     * - 'vector' : Fichier SVG (qualité infinie)
     * - 'good' : DPI >= 300 (qualité impression optimale)
     * - 'warning' : 150 <= DPI < 300 (qualité acceptable)
     * - 'error' : DPI < 150 (qualité insuffisante)
     * 
     * @param {number} dpi - Valeur DPI calculée
     * @param {boolean} [isSvg=false] - true si le fichier source est un SVG
     * @returns {'good'|'warning'|'error'|'vector'} État de qualité pour le badge DPI
     * 
     * @see DPI_RECOMMENDED - Constante seuil "good" (300)
     * @see DPI_MINIMUM - Constante seuil "warning" (150)
     */
    function getDpiState(dpi, isSvg = false) {
        if (isSvg) return 'vector';
        if (dpi >= DPI_RECOMMENDED) return 'good';
        if (dpi >= DPI_MINIMUM) return 'warning';
        return 'error';
    }
    
    /**
     * Génère le texte et l'icône Material Icons pour l'affichage du badge DPI.
     * 
     * @param {number} dpi - Valeur DPI calculée
     * @param {'good'|'warning'|'error'|'vector'} state - État de qualité (depuis getDpiState)
     * @returns {{icon: string, text: string}} Objet avec l'icône Material Icons et le texte à afficher
     * @returns {string} returns.icon - Nom de l'icône Material Icons (check_circle, warning, error)
     * @returns {string} returns.text - Texte descriptif (ex: "300 dpi", "Qualité insuffisante")
     * 
     * @example
     * getDpiDisplayInfo(300, 'good');
     * // → { icon: 'check_circle', text: '300 dpi' }
     * 
     * getDpiDisplayInfo(0, 'vector');
     * // → { icon: 'check_circle', text: 'Vectoriel - Qualité optimale' }
     */
    function getDpiDisplayInfo(dpi, state) {
        switch (state) {
            case 'vector':
                return {
                    icon: 'check_circle',
                    text: 'Vectoriel - Qualité optimale'
                };
            case 'good':
                return {
                    icon: 'check_circle',
                    text: `${dpi} dpi`
                };
            case 'warning':
                return {
                    icon: 'warning',
                    text: `${dpi} dpi - Qualité moyenne`
                };
            case 'error':
                return {
                    icon: 'error',
                    text: `${dpi} dpi - Résolution insuffisante`
                };
            default:
                return {
                    icon: 'help',
                    text: 'DPI inconnu'
                };
        }
    }
    
    /**
     * Met à jour l'indicateur DPI dans le panneau de propriétés
     * @param {string} zoneId - ID de la zone (optionnel, utilise la sélection courante si absent)
     */
    function updateDpiIndicator(zoneId = null) {
        // Déterminer la zone à analyser
        const targetZoneId = zoneId || (selectedZoneIds.length === 1 ? selectedZoneIds[0] : null);
        if (!targetZoneId) {
            if (imageDpiIndicator) imageDpiIndicator.style.display = 'none';
            return;
        }
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[targetZoneId];
        
        if (!zoneData || zoneData.type !== 'image') {
            if (imageDpiIndicator) imageDpiIndicator.style.display = 'none';
            return;
        }
        
        const source = zoneData.source || {};
        
        // Vérifier qu'une image est chargée
        if (!source.imageBase64 && !source.valeur) {
            if (imageDpiIndicator) imageDpiIndicator.style.display = 'none';
            return;
        }
        
        // Récupérer les dimensions de la zone depuis le DOM
        const zoneEl = document.getElementById(targetZoneId);
        if (!zoneEl) {
            if (imageDpiIndicator) imageDpiIndicator.style.display = 'none';
            return;
        }
        
        const zonePxWidth = zoneEl.offsetWidth;
        const zonePxHeight = zoneEl.offsetHeight;
        
        // Vérifier si c'est un SVG
        const isSvg = source.nomOriginal ? isSvgFile(source.nomOriginal) : false;
        
        let dpi = 0;
        let state = 'error';
        
        if (isSvg) {
            // SVG = vectoriel, qualité toujours optimale
            dpi = Infinity;
            state = 'vector';
        } else if (source.largeurPx && source.hauteurPx) {
            // Calculer le DPI
            const displayMode = zoneData.redimensionnement?.mode || 'ajuster';
            dpi = calculateImageDpi(
                source.largeurPx,
                source.hauteurPx,
                zonePxWidth,
                zonePxHeight,
                displayMode
            );
            state = getDpiState(dpi, false);
        }
        
        // Mettre à jour l'affichage (structure POC)
        if (imageDpiIndicator) {
            const displayInfo = getDpiDisplayInfo(dpi, state);
            
            // Mettre à jour la classe CSS (dpi-indicator-poc + dpi-good/warning/error)
            imageDpiIndicator.className = 'dpi-indicator-poc dpi-' + state;
            
            // Mettre à jour le contenu avec emoji + texte
            const emoji = state === 'good' ? '✅' : state === 'warning' ? '⚠️' : state === 'vector' ? '🔷' : '❌';
            imageDpiIndicator.innerHTML = `${emoji} ${displayInfo.text}`;
        }
        
        return { dpi, state };
    }
    
    /**
     * Met à jour le badge DPI externe d'une zone image
     * @param {string} zoneId - ID de la zone
     */
    function updateImageDpiBadge(zoneId) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        if (!zoneData || zoneData.type !== 'image') return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const source = zoneData.source || {};
        
        // Créer le badge s'il n'existe pas
        let dpiBadge = zoneEl.querySelector('.image-dpi-badge');
        if (!dpiBadge) {
            dpiBadge = document.createElement('span');
            dpiBadge.className = 'image-dpi-badge';
            zoneEl.appendChild(dpiBadge);
        }
        
        // Vérifier si une image est chargée
        const hasImage = source.imageBase64 || source.valeur;
        
        if (!hasImage) {
            // Pas d'image : masquer le badge
            zoneEl.classList.remove('has-image');
            return;
        }
        
        // Image chargée : afficher le badge
        zoneEl.classList.add('has-image');
        
        // Vérifier si c'est un SVG
        const isSvg = source.nomOriginal ? isSvgFile(source.nomOriginal) : false;
        
        if (isSvg) {
            // SVG : afficher "Vectoriel"
            dpiBadge.textContent = 'Vectoriel';
            dpiBadge.className = 'image-dpi-badge dpi-vector';
            return;
        }
        
        // Calculer le DPI
        if (!source.largeurPx || !source.hauteurPx) {
            dpiBadge.textContent = 'DPI ?';
            dpiBadge.className = 'image-dpi-badge dpi-warning';
            return;
        }
        
        const zoneWidth = zoneEl.offsetWidth;
        const zoneHeight = zoneEl.offsetHeight;
        const displayMode = zoneData.redimensionnement?.mode || 'ajuster';
        
        const dpi = calculateImageDpi(
            source.largeurPx,
            source.hauteurPx,
            zoneWidth,
            zoneHeight,
            displayMode
        );
        
        // Déterminer la classe selon le DPI
        let dpiClass = 'dpi-good';
        if (dpi < 150) {
            dpiClass = 'dpi-error';
        } else if (dpi < 200) {
            dpiClass = 'dpi-warning';
        }
        
        dpiBadge.textContent = dpi + ' dpi';
        dpiBadge.className = 'image-dpi-badge ' + dpiClass;
    }
    
    /**
     * Met à jour le badge système d'une zone.
     * Affiche le libellé système si la zone est marquée comme système
     * avec un libellé non vide.
     * 
     * Les zones système sont des zones spéciales (ex: numéro de page, date)
     * qui ne peuvent pas être supprimées ou multi-sélectionnées.
     * 
     * @param {string} zoneId - Identifiant de la zone (ex: "zone-1")
     * @returns {void}
     * 
     * @example
     * // Zone système avec libellé
     * zoneData.systeme = true;
     * zoneData.systemeLibelle = 'N° Page';
     * updateSystemeBadge('zone-1'); // → Affiche badge "N° Page"
     * 
     * // Zone non système
     * zoneData.systeme = false;
     * updateSystemeBadge('zone-1'); // → Supprime le badge
     */
    function updateSystemeBadge(zoneId) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData) return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // Chercher un badge existant
        let badge = zoneEl.querySelector('.systeme-badge');
        
        // Vérifier si on doit afficher le badge
        const shouldShow = zoneData.systeme && zoneData.systemeLibelle;
        
        if (!shouldShow) {
            // Supprimer le badge s'il existe
            if (badge) badge.remove();
            return;
        }
        
        // Créer le badge s'il n'existe pas
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'systeme-badge';
            zoneEl.appendChild(badge);
        }
        
        // Mettre à jour le contenu
        badge.textContent = zoneData.systemeLibelle;
    }

    // ─────────────────────────────── FIN SECTION 9 ────────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 10 : CONTRAINTES REDIMENSIONNEMENT IMAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Vérification et application des contraintes lors du redimensionnement.
     * Empêche l'agrandissement au-delà des limites de surface et DPI.
     * 
     * Fonctions principales :
     *   - checkImageResizeAllowed() : Vérifie si redimensionnement autorisé
     *   - calculateMaxDimensionsForDpi() : Calcule dimensions max pour DPI cible
     *   - showResizeConstraintMessage() : Affiche message de contrainte
     *   - showResizeConstraintMessageDebounced() : Version avec debounce
     * 
     * Dépendances :
     *   - getSurfaceLimiteImagePx2() (Section 7)
     *   - calculateImageDpi() (Section 9)
     *   - DPI_MINIMUM (Section 7)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Vérifie si un redimensionnement de zone image est autorisé.
     * Applique deux contraintes :
     * 1. Surface maximale (évite les zones trop grandes)
     * 2. DPI minimum (150 DPI, sauf pour les SVG)
     * 
     * @param {string} zoneId - Identifiant de la zone (ex: "zone-1")
     * @param {number} newWidth - Nouvelle largeur souhaitée en pixels
     * @param {number} newHeight - Nouvelle hauteur souhaitée en pixels
     * @returns {Object} Résultat de la vérification
     * @returns {boolean} returns.allowed - true si le redimensionnement est autorisé
     * @returns {string|null} returns.reason - Message d'erreur si refusé, null sinon
     * @returns {number|null} returns.maxWidth - Largeur maximale autorisée si refusé, null sinon
     * @returns {number|null} returns.maxHeight - Hauteur maximale autorisée si refusé, null sinon
     * 
     * @example
     * const result = checkImageResizeAllowed('zone-1', 500, 500);
     * if (!result.allowed) {
     *   console.log(result.reason); // "Surface maximum atteinte (100 cm²)"
     *   // Utiliser result.maxWidth et result.maxHeight comme limites
     * }
     * 
     * @see DPI_MINIMUM - Seuil DPI minimum (150)
     * @see getSurfaceLimiteImagePx2 - Surface maximale autorisée
     */
    function checkImageResizeAllowed(zoneId, newWidth, newHeight) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        // Si ce n'est pas une zone image, autoriser
        if (!zoneData || zoneData.type !== 'image') {
            return { allowed: true, reason: null };
        }
        
        const source = zoneData.source || {};
        
        // Si pas d'image chargée, autoriser (pas de contrainte)
        if (!source.imageBase64 && !source.valeur) {
            return { allowed: true, reason: null };
        }
        
        // Si c'est un SVG, pas de contrainte DPI (mais contrainte surface)
        const isSvg = source.nomOriginal ? isSvgFile(source.nomOriginal) : false;
        
        // --- Vérification 1 : Surface maximale ---
        const surfaceLimitePx2 = getSurfaceLimiteImagePx2();
        const newSurfacePx2 = newWidth * newHeight;
        
        if (newSurfacePx2 > surfaceLimitePx2) {
            // Calculer les dimensions maximales en conservant le ratio
            const currentRatio = newWidth / newHeight;
            const maxHeight = Math.sqrt(surfaceLimitePx2 / currentRatio);
            const maxWidth = maxHeight * currentRatio;
            
            const surfaceLimiteMm2 = getSurfaceLimiteImageMm2();
            const surfaceLimiteCm2 = (surfaceLimiteMm2 / 100).toFixed(0);
            
            return {
                allowed: false,
                reason: `Surface maximum atteinte (${surfaceLimiteCm2} cm²)`,
                maxWidth: Math.floor(maxWidth),
                maxHeight: Math.floor(maxHeight)
            };
        }
        
        // --- Vérification 2 : DPI minimum (sauf SVG) ---
        if (!isSvg && source.largeurPx && source.hauteurPx) {
            const displayMode = zoneData.redimensionnement?.mode || 'ajuster';
            const dpi = calculateImageDpi(
                source.largeurPx,
                source.hauteurPx,
                newWidth,
                newHeight,
                displayMode
            );
            
            if (dpi < DPI_MINIMUM) {
                // Calculer les dimensions maximales pour 150 DPI
                const maxDimensions = calculateMaxDimensionsForDpi(
                    source.largeurPx,
                    source.hauteurPx,
                    DPI_MINIMUM,
                    displayMode,
                    newWidth / newHeight // Ratio actuel
                );
                
                return {
                    allowed: false,
                    reason: `Résolution minimum atteinte (${DPI_MINIMUM} dpi)`,
                    maxWidth: maxDimensions.width,
                    maxHeight: maxDimensions.height
                };
            }
        }
        
        return { allowed: true, reason: null };
    }
    
    /**
     * Calcule les dimensions maximales d'une zone pour un DPI cible
     * @param {number} imagePxWidth - Largeur de l'image en pixels
     * @param {number} imagePxHeight - Hauteur de l'image en pixels
     * @param {number} targetDpi - DPI cible minimum
     * @param {string} displayMode - Mode d'affichage
     * @param {number} aspectRatio - Ratio largeur/hauteur de la zone
     * @returns {{width: number, height: number}}
     */
    function calculateMaxDimensionsForDpi(imagePxWidth, imagePxHeight, targetDpi, displayMode, aspectRatio) {
        // Formule inverse : à partir du DPI cible, calculer la taille max de la zone
        // DPI = pixels_image / (taille_affichée_en_pouces)
        // taille_affichée_en_pouces = pixels_image / DPI
        // taille_affichée_en_mm = (pixels_image / DPI) * 25.4
        // taille_affichée_en_px = taille_affichée_en_mm / MM_PER_PIXEL
        
        const maxWidthInches = imagePxWidth / targetDpi;
        const maxHeightInches = imagePxHeight / targetDpi;
        
        const maxWidthMm = maxWidthInches * 25.4;
        const maxHeightMm = maxHeightInches * 25.4;
        
        const maxWidthPx = maxWidthMm / MM_PER_PIXEL;
        const maxHeightPx = maxHeightMm / MM_PER_PIXEL;
        
        if (displayMode === 'ajuster') {
            // En mode ajuster, la zone peut être plus grande que l'image
            // car l'image est mise à l'échelle pour tenir dedans
            // On doit trouver la taille de zone qui donne exactement targetDpi
            
            // Si le ratio de la zone est plus large que l'image
            const imageRatio = imagePxWidth / imagePxHeight;
            
            if (aspectRatio > imageRatio) {
                // Zone plus large : la hauteur est contraignante
                return {
                    width: Math.floor(maxHeightPx * aspectRatio),
                    height: Math.floor(maxHeightPx)
                };
            } else {
                // Zone plus haute : la largeur est contraignante
                return {
                    width: Math.floor(maxWidthPx),
                    height: Math.floor(maxWidthPx / aspectRatio)
                };
            }
            
        } else if (displayMode === 'couper') {
            // En mode couper, l'image couvre toute la zone
            // La dimension la plus petite de l'image est utilisée
            const imageRatio = imagePxWidth / imagePxHeight;
            
            if (aspectRatio > imageRatio) {
                // Zone plus large : la largeur de l'image est utilisée
                return {
                    width: Math.floor(maxWidthPx),
                    height: Math.floor(maxWidthPx / aspectRatio)
                };
            } else {
                // Zone plus haute : la hauteur de l'image est utilisée
                return {
                    width: Math.floor(maxHeightPx * aspectRatio),
                    height: Math.floor(maxHeightPx)
                };
            }
            
        } else {
            // Mode initial : l'image garde sa taille native
            // La zone peut être de n'importe quelle taille
            return {
                width: 99999,
                height: 99999
            };
        }
    }
    
    /**
     * Affiche un message de contrainte (toast)
     * @param {string} message - Message à afficher
     */
    function showResizeConstraintMessage(message) {
        // Utiliser le système de toast existant (undo-redo-toast)
        const toast = document.getElementById('undo-redo-toast');
        if (toast) {
            toast.innerHTML = `
                <span class="material-icons toast-icon">block</span>
                <span>${message}</span>
            `;
            toast.className = 'undo-toast error show';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    }
    
    // Variable pour éviter les messages répétitifs pendant le drag
    let lastConstraintMessage = '';
    let lastConstraintTime = 0;
    
    /**
     * Affiche un message de contrainte avec debounce
     * @param {string} message - Message à afficher
     */
    function showResizeConstraintMessageDebounced(message) {
        const now = Date.now();
        if (message === lastConstraintMessage && now - lastConstraintTime < 2000) {
            return; // Éviter les messages répétitifs
        }
        lastConstraintMessage = message;
        lastConstraintTime = now;
        showResizeConstraintMessage(message);
    }

    // ─────────────────────────────── FIN SECTION 10 ───────────────────────────────
    
    let zoneCounter = 0;
    let selectedZoneIds = []; // Tableau pour la sélection multiple
    let copiedZoneData = null; // Données de la zone copiée pour le copier-coller
    
    // Déclarer zoomLevel tôt pour qu'il soit disponible partout
    let zoomLevel = 1.0; // 100% par défaut

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 11 : SYSTÈME UNDO/REDO (Historique)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Système d'historique pour annuler/rétablir les actions.
     * Gère les snapshots de l'état du document.
     * 
     * Objet principal :
     *   - historyManager : Gestionnaire d'états (states, currentIndex, flags)
     * 
     * Fonctions principales :
     *   - saveState() : Sauvegarde état après modification
     *   - undo() : Annule dernière action
     *   - redo() : Rétablit action annulée
     *   - restoreState() : Restaure depuis snapshot
     *   - updateHistoryUI() : Met à jour boutons et compteur
     *   - showUndoRedoToast() : Affiche notification
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - loadCurrentPage() (Section 22)
     *   - btnUndo, btnRedo (Section 1)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    const historyManager = {
        states: [],           // Tableau des snapshots de documentState
        currentIndex: -1,     // Position actuelle dans l'historique
        maxStates: 50,        // Limite mémoire
        isRestoring: false,   // Flag pour éviter de sauvegarder pendant une restauration
        isLoadingForm: false  // Flag pour éviter de sauvegarder pendant le chargement du formulaire
    };

    // Variable pour le debounce du contenu texte
    let contentSaveTimeout = null;

    /**
     * Sauvegarde l'état actuel du document dans l'historique (pour Undo/Redo).
     * Crée un snapshot profond de documentState et l'ajoute à la pile d'historique.
     * 
     * Comportement :
     * - Synchronise d'abord les positions DOM → documentState
     * - Supprime les états "futurs" si on a fait des undo (branche abandonnée)
     * - Limite la taille de l'historique à maxStates (50 par défaut)
     * - Ne fait rien si isRestoring ou isLoadingForm est true
     * 
     * @fires updateHistoryUI - Met à jour les boutons Undo/Redo
     * 
     * @example
     * // Après une modification (création, déplacement, suppression de zone)
     * zonesData[id] = { type: 'textQuill', content: 'Nouveau' };
     * saveState(); // Snapshot pour pouvoir annuler
     * 
     * @see undo - Annuler la dernière action
     * @see redo - Rétablir l'action annulée
     * @see historyManager - Gestionnaire d'historique
     */
    function saveState() {
        // Ne pas sauvegarder si on est en train de restaurer ou de charger le formulaire
        if (historyManager.isRestoring || historyManager.isLoadingForm) {
            return;
        }
        
        // Synchroniser les positions DOM vers documentState avant le snapshot
        const zonesData = getCurrentPageZones();
        for (const [id, data] of Object.entries(zonesData)) {
            const el = document.getElementById(id);
            if (el) {
                data.x = el.offsetLeft;
                data.y = el.offsetTop;
                data.w = el.offsetWidth;
                data.h = el.offsetHeight;
            }
        }
        
        // BUGFIX : persister le contenu Quill dans zonesData avant snapshot (Undo/Redo)
        // NE PAS persister en mode aperçu (le contenu affiché est fusionné, pas l'original)
        if (!previewState || !previewState.active) {
            persistTextQuillContentForSave(zonesData);
        }

        documentState.zoneCounter = zoneCounter;
        
        // Supprimer les états "futurs" si on a fait des undo
        if (historyManager.currentIndex < historyManager.states.length - 1) {
            historyManager.states = historyManager.states.slice(0, historyManager.currentIndex + 1);
        }
        
        // Créer un snapshot profond de documentState
        const snapshot = JSON.parse(JSON.stringify(documentState));
        
        // Ajouter à l'historique
        historyManager.states.push(snapshot);
        historyManager.currentIndex++;
        
        // Limiter la taille de l'historique
        if (historyManager.states.length > historyManager.maxStates) {
            historyManager.states.shift();
            historyManager.currentIndex--;
        }
        
        // Mettre à jour l'interface
        updateHistoryUI();
    }

    /**
     * Annule la dernière action (Undo).
     * Restaure l'état précédent depuis l'historique.
     * 
     * @returns {void}
     * @fires showUndoRedoToast - Affiche "Action annulée" ou "Rien à annuler"
     * @fires updateHistoryUI - Met à jour les boutons Undo/Redo
     * 
     * @example
     * // Raccourci clavier : Ctrl+Z
     * undo(); // Restaure l'état précédent
     * 
     * @see redo - Rétablir l'action annulée
     * @see saveState - Sauvegarder l'état courant
     */
    function undo() {
        if (historyManager.currentIndex <= 0) {
            showUndoRedoToast('Rien à annuler', 'error', 'block');
            return;
        }
        
        historyManager.currentIndex--;
        restoreState(historyManager.states[historyManager.currentIndex]);
        updateHistoryUI();
        showUndoRedoToast('Action annulée', 'success', 'undo');
    }

    /**
     * Rétablit l'action annulée (Redo).
     * Restaure l'état suivant depuis l'historique (après un Undo).
     * 
     * @returns {void}
     * @fires showUndoRedoToast - Affiche "Action rétablie" ou "Rien à rétablir"
     * @fires updateHistoryUI - Met à jour les boutons Undo/Redo
     * 
     * @example
     * // Raccourci clavier : Ctrl+Y ou Ctrl+Shift+Z
     * redo(); // Restaure l'état suivant
     * 
     * @see undo - Annuler la dernière action
     * @see saveState - Sauvegarder l'état courant
     */
    function redo() {
        if (historyManager.currentIndex >= historyManager.states.length - 1) {
            showUndoRedoToast('Rien à rétablir', 'error', 'block');
            return;
        }
        
        historyManager.currentIndex++;
        restoreState(historyManager.states[historyManager.currentIndex]);
        updateHistoryUI();
        showUndoRedoToast('Action rétablie', 'success', 'redo');
    }

    /**
     * Restaure un état complet du document depuis un snapshot d'historique.
     * Utilisée par undo() et redo() pour appliquer un état sauvegardé.
     * 
     * Étapes de restauration :
     * 1. Supprime toutes les zones du DOM
     * 2. Restaure documentState depuis le snapshot (copie profonde)
     * 3. Recharge la page courante (recrée les zones dans le DOM)
     * 4. Désélectionne toutes les zones
     * 5. Sauvegarde dans localStorage (sans ajouter à l'historique)
     * 
     * @param {DocumentState} snapshot - Snapshot de documentState à restaurer
     * @returns {void}
     * 
     * @see undo - Utilise cette fonction pour annuler
     * @see redo - Utilise cette fonction pour rétablir
     */
    function restoreState(snapshot) {
        historyManager.isRestoring = true;
        
        // AJOUT Phase 6 : Sauvegarder la sélection actuelle avant restauration
        const previousSelection = [...selectedZoneIds];
        
        // 1. Supprimer toutes les zones du DOM
        document.querySelectorAll('.zone').forEach(el => el.remove());
        
        // 1b. Sauvegarder les données d'aperçu (ne doivent pas être perdues lors du Undo/Redo)
        const savedDonneesApercu = documentState.donneesApercu || [];
        
        // 2. Restaurer documentState
        documentState = JSON.parse(JSON.stringify(snapshot));
        zoneCounter = documentState.zoneCounter;
        
        // 2b. Restaurer les données d'aperçu
        documentState.donneesApercu = savedDonneesApercu;
        
        // 3. Recharger la page courante (recrée les zones dans le DOM)
        loadCurrentPage();
        
        // 4. Phase 6 : Restaurer la sélection pour les zones qui existent encore
        selectedZoneIds = [];
        const zonesData = getCurrentPageZones();
        
        previousSelection.forEach(zoneId => {
            // Vérifier si la zone existe dans l'état restauré ET dans le DOM
            if (zonesData[zoneId] && document.getElementById(zoneId)) {
                selectedZoneIds.push(zoneId);
                document.getElementById(zoneId).classList.add('selected');
            }
        });
        
        // 5. Mettre à jour l'interface selon la nouvelle sélection
        if (selectedZoneIds.length === 0) {
            // Aucune zone à resélectionner : désélection complète
            deselectAll();
        } else {
            // Mettre à jour l'UI pour refléter la sélection restaurée
            updateSelectionUI();
        }
        
        // 6. Sauvegarder dans localStorage (sans ajouter à l'historique)
        saveToLocalStorage();
        
        historyManager.isRestoring = false;
    }

    /**
     * Affiche une notification toast pour Undo/Redo
     * @param {string} message - Message à afficher
     * @param {string} type - Type de toast ('success', 'error', ou vide)
     * @param {string} icon - Icône Material Icons (optionnel)
     */
    function showUndoRedoToast(message, type = 'success', icon = null) {
        if (!undoRedoToast) return;
        
        // Construire le contenu du toast
        let content = '';
        if (icon) {
            content += `<span class="material-icons toast-icon">${icon}</span>`;
        }
        content += `<span>${message}</span>`;
        
        undoRedoToast.innerHTML = content;
        undoRedoToast.className = 'undo-toast'; // Reset classes
        if (type) {
            undoRedoToast.classList.add(type);
        }
        undoRedoToast.classList.add('show');
        
        // Masquer après 1.5 secondes
        setTimeout(() => {
            undoRedoToast.classList.remove('show');
        }, 1500);
    }

    /**
     * Met à jour l'interface des boutons et compteur d'historique
     */
    function updateHistoryUI() {
        const canUndo = historyManager.currentIndex > 0;
        const canRedo = historyManager.currentIndex < historyManager.states.length - 1;
        
        // Mettre à jour l'état des boutons
        if (btnUndo) btnUndo.disabled = !canUndo;
        if (btnRedo) btnRedo.disabled = !canRedo;
        
        // Mettre à jour le compteur
        if (historyPositionEl) {
            historyPositionEl.textContent = historyManager.currentIndex + 1;
        }
        if (historyTotalEl) {
            historyTotalEl.textContent = historyManager.states.length;
        }
    }

    // ─────────────────────────────── FIN SECTION 11 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 12 : ÉTAT DU DOCUMENT ET HELPERS
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Structure centrale de données et fonctions d'accès.
     * Gère les formats de document et les dimensions de page.
     * 
     * Constantes :
     *   - DOCUMENT_FORMATS : Formats prédéfinis en pixels
     *   - DOCUMENT_FORMATS_MM : Formats prédéfinis en mm
     * 
     * Objet principal :
     *   - documentState : État complet du document (pages, zones, compteurs)
     * 
     * Fonctions principales :
     *   - getCurrentPage() : Page courante
     *   - getCurrentPageZones() : Zones de la page courante
     *   - getPageWidth/Height() : Dimensions en pixels
     *   - getPageWidthMm/HeightMm() : Dimensions en mm
     *   - applyPageDimensions() : Applique au DOM
     *   - getCenterOfView() : Centre de la vue actuelle
     * 
     * Dépendances :
     *   - a4Page (Section 1)
     *   - pxToMm() (Section 6)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    // Formats prédéfinis (dimensions en pixels à 96 DPI)
    const DOCUMENT_FORMATS = {
        'A4': { width: 794, height: 1123, name: 'A4' },
        'A3': { width: 1123, height: 1587, name: 'A3' },
        'A5': { width: 559, height: 794, name: 'A5' },
        'Letter': { width: 816, height: 1056, name: 'Letter (US)' },
        'Legal': { width: 816, height: 1344, name: 'Legal (US)' }
    };

    // Formats prédéfinis en mm (dimensions EXACTES sans conversion)
    const DOCUMENT_FORMATS_MM = {
        'A4': { widthMm: 210, heightMm: 297, name: 'A4' },
        'A3': { widthMm: 297, heightMm: 420, name: 'A3' },
        'A5': { widthMm: 148, heightMm: 210, name: 'A5' },
        'Letter': { widthMm: 215.9, heightMm: 279.4, name: 'Letter (US)' },
        'Legal': { widthMm: 215.9, heightMm: 355.6, name: 'Legal (US)' }
    };

    // Format par défaut (A4)
    const DEFAULT_FORMAT = 'A4';

    // --- STOCKAGE DES DONNÉES (Le "Cerveau") ---
    // Nouvelle structure hiérarchique multipage avec dimensions
    let documentState = {
        currentPageIndex: 0, // 0 = Recto
        pages: [
            {
                id: 'page-1',
                name: 'Recto',
                image: 'a4_template_recto.jpg',
                format: DEFAULT_FORMAT, // Format de la page
                width: DOCUMENT_FORMATS[DEFAULT_FORMAT].width, // Largeur en pixels
                height: DOCUMENT_FORMATS[DEFAULT_FORMAT].height, // Hauteur en pixels
                zones: {}
            },
            {
                id: 'page-2',
                name: 'Verso',
                image: 'a4_template_verso.jpg',
                format: DEFAULT_FORMAT,
                width: DOCUMENT_FORMATS[DEFAULT_FORMAT].width,
                height: DOCUMENT_FORMATS[DEFAULT_FORMAT].height,
                zones: {}
            }
        ],
        zoneCounter: 0, // Compteur global pour ID uniques
        /**
         * Données d'échantillon pour l'aperçu de fusion
         * @type {EchantillonData[]}
         */
        donneesApercu: []
    };

    // ─────────────────────────────────────────────────────────────────────────
    // État du mode aperçu de fusion
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * État du mode aperçu de fusion des données
     * @type {PreviewState}
     */
    const previewState = {
        /** @type {boolean} Mode aperçu actif */
        active: false,
        /** @type {number} Index de l'enregistrement courant (0-based) */
        currentIndex: 0,
        /** @type {Map<string, {quillDelta: Object|null, htmlContent: string}>} Contenus originaux sauvegardés */
        savedContents: new Map()
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Données fictives pour tests hors WebDev
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Données d'échantillon fictives pour tester l'aperçu hors contexte WebDev.
     * Ces données seront remplacées par celles de WebDev lors d'un vrai chargement.
     * @type {EchantillonData[]}
     */
    const DEFAULT_PREVIEW_DATA = [
        {
            CIVILITE: "Monsieur",
            NOM: "DUPONT",
            PRENOM: "Jean",
            SOCIETE: "Acme Corporation",
            ADRESSE1: "12 rue des Lilas",
            ADRESSE2: "Bâtiment A",
            CP: "75009",
            VILLE: "PARIS",
            EMAIL: "jean.dupont@acme.com",
            TELEPHONE: "01 23 45 67 89"
        },
        {
            CIVILITE: "Madame",
            NOM: "MARTIN",
            PRENOM: "Sophie",
            SOCIETE: "Tech Solutions SAS",
            ADRESSE1: "8 avenue Victor Hugo",
            ADRESSE2: "",
            CP: "69001",
            VILLE: "LYON",
            EMAIL: "sophie.martin@techsol.fr",
            TELEPHONE: "04 78 12 34 56"
        },
        {
            CIVILITE: "Monsieur",
            NOM: "BERNARD",
            PRENOM: "Pierre",
            SOCIETE: "Global Services",
            ADRESSE1: "45 boulevard Gambetta",
            ADRESSE2: "Étage 3",
            CP: "33000",
            VILLE: "BORDEAUX",
            EMAIL: "p.bernard@globalservices.com",
            TELEPHONE: "05 56 78 90 12"
        },
        {
            CIVILITE: "Madame",
            NOM: "PETIT",
            PRENOM: "Marie",
            SOCIETE: "Innovation Labs",
            ADRESSE1: "123 rue de la République",
            ADRESSE2: "",
            CP: "59000",
            VILLE: "LILLE",
            EMAIL: "marie.petit@innolabs.fr",
            TELEPHONE: "03 20 45 67 89"
        },
        {
            CIVILITE: "Monsieur",
            NOM: "ROBERT",
            PRENOM: "François",
            SOCIETE: "Delta Industries",
            ADRESSE1: "7 place Bellecour",
            ADRESSE2: "BP 456",
            CP: "13001",
            VILLE: "MARSEILLE",
            EMAIL: "frobert@delta-ind.com",
            TELEPHONE: "04 91 23 45 67"
        },
        {
            CIVILITE: "Madame",
            NOM: "DURAND",
            PRENOM: "Catherine",
            SOCIETE: "Consulting Plus",
            ADRESSE1: "28 rue du Commerce",
            ADRESSE2: "",
            CP: "44000",
            VILLE: "NANTES",
            EMAIL: "c.durand@consultingplus.fr",
            TELEPHONE: "02 40 12 34 56"
        },
        {
            CIVILITE: "Monsieur",
            NOM: "LEROY",
            PRENOM: "Thomas",
            SOCIETE: "Digital Factory",
            ADRESSE1: "15 avenue Jean Jaurès",
            ADRESSE2: "Zone Industrielle Nord",
            CP: "31000",
            VILLE: "TOULOUSE",
            EMAIL: "thomas.leroy@digitalfactory.com",
            TELEPHONE: "05 61 78 90 12"
        },
        {
            CIVILITE: "Madame",
            NOM: "MOREAU",
            PRENOM: "Isabelle",
            SOCIETE: "Média Group",
            ADRESSE1: "52 rue de la Paix",
            ADRESSE2: "",
            CP: "67000",
            VILLE: "STRASBOURG",
            EMAIL: "i.moreau@mediagroup.eu",
            TELEPHONE: "03 88 45 67 89"
        },
        {
            CIVILITE: "Monsieur",
            NOM: "GARCIA",
            PRENOM: "Antoine",
            SOCIETE: "Eco Solutions",
            ADRESSE1: "3 impasse des Roses",
            ADRESSE2: "Résidence Les Jardins",
            CP: "06000",
            VILLE: "NICE",
            EMAIL: "a.garcia@ecosolutions.fr",
            TELEPHONE: "04 93 12 34 56"
        },
        {
            CIVILITE: "Madame",
            NOM: "ROUX-FONTAINE",
            PRENOM: "Élisabeth-Marie",
            SOCIETE: "Cabinet d'Architecture et d'Urbanisme du Grand Sud-Ouest",
            ADRESSE1: "1247 boulevard du Maréchal de Lattre de Tassigny",
            ADRESSE2: "Immeuble Le Panoramique - Entrée B",
            CP: "34000",
            VILLE: "MONTPELLIER",
            EMAIL: "elisabeth-marie.roux-fontaine@archi-urbanisme-grandsudouest.fr",
            TELEPHONE: "04 67 89 01 23"
        }
    ];

    /**
     * Initialise les données d'aperçu avec les valeurs par défaut si aucune donnée WebDev
     * @returns {void}
     */
    function initDefaultPreviewData() {
        if (!documentState.donneesApercu || documentState.donneesApercu.length === 0) {
            documentState.donneesApercu = [...DEFAULT_PREVIEW_DATA];
            console.log(`📊 initDefaultPreviewData: ${DEFAULT_PREVIEW_DATA.length} échantillon(s) fictif(s) chargé(s)`);
        }
    }

    /**
     * Convertit un enregistrement WebDev (tableau nom/valeur) en objet plat
     * @param {EnregistrementWebDev} enregistrementWebDev - Enregistrement au format WebDev
     * @returns {EchantillonData} Objet plat avec clés dynamiques
     * @example
     * // Entrée : {enregistrement: [{nom: "NOM", valeur: "DUPONT"}, {nom: "PRENOM", valeur: "Jean"}]}
     * // Sortie : {NOM: "DUPONT", PRENOM: "Jean"}
     */
    function convertEnregistrementToObject(enregistrementWebDev) {
        const obj = {};
        
        if (!enregistrementWebDev || !Array.isArray(enregistrementWebDev.enregistrement)) {
            console.warn('⚠️ convertEnregistrementToObject: format invalide', enregistrementWebDev);
            return obj;
        }
        
        for (const champ of enregistrementWebDev.enregistrement) {
            if (champ && champ.nom !== undefined) {
                obj[champ.nom] = champ.valeur || '';
            }
        }
        
        return obj;
    }

    /**
     * Convertit le tableau donneesApercu WebDev en format interne Designer
     * @param {EnregistrementWebDev[]} donneesApercuWebDev - Tableau au format WebDev
     * @returns {EchantillonData[]} Tableau d'objets plats pour le Designer
     */
    function convertDonneesApercuFromWebDev(donneesApercuWebDev) {
        if (!Array.isArray(donneesApercuWebDev)) {
            console.warn('⚠️ convertDonneesApercuFromWebDev: pas un tableau', donneesApercuWebDev);
            return [];
        }
        
        const result = donneesApercuWebDev.map((enreg, index) => {
            const converted = convertEnregistrementToObject(enreg);
            console.log(`📄 Enregistrement ${index + 1} converti:`, converted);
            return converted;
        });
        
        console.log(`✅ ${result.length} enregistrement(s) converti(s) depuis WebDev`);
        return result;
    }

    /**
     * Affiche les données d'aperçu dans la console (debug)
     * @returns {void}
     */
    function debugPreviewData() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 DONNÉES D\'APERÇU DISPONIBLES');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Nombre d'enregistrements: ${documentState.donneesApercu.length}`);
        console.log('───────────────────────────────────────────────────────────');
        
        documentState.donneesApercu.forEach((record, index) => {
            console.log(`[${index + 1}] ${record.CIVILITE || ''} ${record.PRENOM || ''} ${record.NOM || ''} - ${record.SOCIETE || ''}`);
        });
        
        console.log('═══════════════════════════════════════════════════════════');
    }

    /**
     * Teste la conversion du format WebDev vers format interne
     * À appeler depuis la console : testConversionWebDev()
     * @returns {void}
     */
    function testConversionWebDev() {
        const testDataWebDev = [
            {
                enregistrement: [
                    {nom: "CIVILITE", valeur: "Monsieur"},
                    {nom: "NOM", valeur: "TEST-WEBDEV"},
                    {nom: "PRENOM", valeur: "Jean"}
                ]
            },
            {
                enregistrement: [
                    {nom: "CIVILITE", valeur: "Madame"},
                    {nom: "NOM", valeur: "CONVERSION"},
                    {nom: "PRENOM", valeur: "Marie"}
                ]
            }
        ];
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🧪 TEST CONVERSION FORMAT WEBDEV');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Entrée (format WebDev):', JSON.stringify(testDataWebDev, null, 2));
        
        const converted = convertDonneesApercuFromWebDev(testDataWebDev);
        
        console.log('───────────────────────────────────────────────────────────');
        console.log('Sortie (format interne):', JSON.stringify(converted, null, 2));
        console.log('═══════════════════════════════════════════════════════════');
        
        // Vérification
        if (converted[0].NOM === "TEST-WEBDEV" && converted[1].PRENOM === "Marie") {
            console.log('✅ TEST RÉUSSI');
        } else {
            console.log('❌ TEST ÉCHOUÉ');
        }
    }

    // Exposer pour debug console
    window.debugPreviewData = debugPreviewData;
    window.previewState = previewState;
    window.replaceMergeFields = replaceMergeFields;
    window.displayMergedContent = displayMergedContent;
    window.testConversionWebDev = testConversionWebDev;
    // Note: window.documentState est exposé dans la section de démarrage (après loadFromLocalStorage)

    // ─────────────────────────────────────────────────────────────────────────
    // Aperçu de fusion - Fonctions UI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Met à jour l'indicateur d'enregistrement (ex: "3 / 10")
     * @returns {void}
     */
    function updateRecordIndicator() {
        if (!recordIndicator) return;
        
        const total = documentState.donneesApercu.length;
        const current = previewState.currentIndex + 1; // 1-based pour l'affichage
        
        recordIndicator.textContent = `${current} / ${total}`;
        
        // Désactiver les boutons aux extrémités
        if (btnPrevRecord) {
            btnPrevRecord.disabled = (previewState.currentIndex === 0);
        }
        if (btnNextRecord) {
            btnNextRecord.disabled = (previewState.currentIndex >= total - 1);
        }
    }

    /**
     * Affiche les contrôles d'aperçu (mode aperçu)
     * @returns {void}
     */
    function showPreviewControls() {
        console.log('👁️ showPreviewControls()');
        
        // Masquer le bouton Aperçu
        if (previewBtnContainer) {
            previewBtnContainer.style.display = 'none';
        }
        
        // Afficher les contrôles de navigation
        if (previewControls) {
            previewControls.style.display = 'flex';
        }
        
        // Ajouter la classe preview-active à la section
        if (previewSection) {
            previewSection.classList.add('preview-active');
        }
        
        // Ajouter la classe sur le body pour les styles globaux
        document.body.classList.add('preview-mode-active');
        
        // Mettre à jour l'indicateur
        updateRecordIndicator();
    }

    /**
     * Masque les contrôles d'aperçu (retour mode édition)
     * @returns {void}
     */
    function hidePreviewControls() {
        console.log('👁️ hidePreviewControls()');
        
        // Afficher le bouton Aperçu
        if (previewBtnContainer) {
            previewBtnContainer.style.display = 'block';
        }
        
        // Masquer les contrôles de navigation
        if (previewControls) {
            previewControls.style.display = 'none';
        }
        
        // Retirer la classe preview-active de la section
        if (previewSection) {
            previewSection.classList.remove('preview-active');
        }
        
        // Retirer la classe du body
        document.body.classList.remove('preview-mode-active');
    }

    /**
     * Vérifie si des données d'aperçu sont disponibles
     * @returns {boolean} true si au moins un enregistrement existe
     */
    function hasPreviewData() {
        return documentState.donneesApercu && documentState.donneesApercu.length > 0;
    }

    /**
     * Met à jour l'état du bouton Aperçu selon la disponibilité des données
     * @returns {void}
     */
    function updatePreviewButtonState() {
        if (!btnPreview) return;
        
        const hasData = hasPreviewData();
        btnPreview.disabled = !hasData;
        btnPreview.title = hasData 
            ? `Aperçu de la fusion (${documentState.donneesApercu.length} enregistrement(s))`
            : 'Aucune donnée d\'aperçu disponible';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Aperçu de fusion - Sauvegarde/Restauration du contenu
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sauvegarde le contenu original de toutes les zones texte (toutes pages)
     * pour pouvoir le restaurer après l'aperçu.
     * @returns {void}
     */
    function saveAllZonesContent() {
        console.log('💾 saveAllZonesContent() - Sauvegarde du contenu original');
        
        previewState.savedContents.clear();
        
        // Parcourir toutes les pages
        documentState.pages.forEach((page, pageIndex) => {
            const zones = page.zones || {};
            
            Object.entries(zones).forEach(([zoneId, zoneData]) => {
                // Uniquement les zones texte Quill
                if (zoneData.type !== 'textQuill') return;
                
                const quillInstance = quillInstances.get(zoneId);
                
                if (quillInstance) {
                    // Sauvegarder le Delta Quill (format riche)
                    const delta = quillInstance.getContents();
                    const htmlContent = quillInstance.root.innerHTML;
                    
                    previewState.savedContents.set(zoneId, {
                        pageIndex: pageIndex,
                        quillDelta: JSON.parse(JSON.stringify(delta)), // Deep copy
                        htmlContent: htmlContent,
                        originalFontSize: parseFloat(quillInstance.root.style.fontSize) || zoneData.size || 12,
                        emptyLines: zoneData.emptyLines || 0
                    });
                    
                    console.log(`  → Zone ${zoneId} (page ${pageIndex + 1}) sauvegardée`);
                }
            });
        });
        
        console.log(`💾 ${previewState.savedContents.size} zone(s) sauvegardée(s)`);
    }

    /**
     * Restaure le contenu original de toutes les zones texte
     * @returns {void}
     */
    function restoreAllZonesContent() {
        console.log('🔄 restoreAllZonesContent() - Restauration du contenu original');
        
        previewState.savedContents.forEach((savedData, zoneId) => {
            const quillInstance = quillInstances.get(zoneId);
            
            if (quillInstance && savedData.quillDelta) {
                // Restaurer le Delta Quill
                quillInstance.setContents(savedData.quillDelta, 'silent');
                
                // Restaurer la taille de police originale si modifiée par copyfit
                if (savedData.originalFontSize) {
                    quillInstance.root.style.fontSize = `${savedData.originalFontSize}pt`;
                }
                
                // Retirer l'indicateur de copyfit
                const zoneEl = document.getElementById(zoneId);
                if (zoneEl) {
                    zoneEl.classList.remove('copyfit-active');
                }
                
                console.log(`  → Zone ${zoneId} restaurée`);
            }
        });
        
        console.log(`🔄 ${previewState.savedContents.size} zone(s) restaurée(s)`);
        previewState.savedContents.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Aperçu de fusion - Remplacement des champs
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Remplace tous les @CHAMP@ dans un texte par les valeurs d'un enregistrement.
     * 
     * @param {string} text - Texte contenant des @CHAMP@ à remplacer
     * @param {EchantillonData} record - Enregistrement contenant les valeurs
     * @returns {string} Texte avec les champs remplacés par les valeurs
     * 
     * @example
     * const text = "Bonjour @PRENOM@ @NOM@";
     * const record = { PRENOM: "Jean", NOM: "DUPONT" };
     * replaceMergeFields(text, record); // → "Bonjour Jean DUPONT"
     */
    function replaceMergeFields(text, record) {
        if (!text || !record) return text;
        
        // Regex pour capturer @CHAMP@ (lettres, chiffres, underscore)
        // Le ? rend la capture non-greedy pour éviter @A@...@B@ → une seule capture
        const regex = /@([A-Za-z0-9_]+)@/g;
        
        return text.replace(regex, (match, fieldName) => {
            // Chercher la valeur dans l'enregistrement (insensible à la casse)
            const upperFieldName = fieldName.toUpperCase();
            
            // Chercher la clé correspondante dans record
            const recordKey = Object.keys(record).find(
                key => key.toUpperCase() === upperFieldName
            );
            
            if (recordKey !== undefined && record[recordKey] !== undefined) {
                const value = record[recordKey];
                // Si la valeur est vide ou null, retourner chaîne vide
                return (value === null || value === '') ? '' : String(value);
            }
            
            // Champ non trouvé : garder le placeholder original
            console.warn(`⚠️ Champ de fusion non trouvé: ${fieldName}`);
            return match;
        });
    }

    /**
     * Crée un Delta Quill avec les champs de fusion remplacés.
     * Préserve le formatage (gras, couleur, etc.) du Delta original.
     * 
     * @param {Object} originalDelta - Delta Quill original
     * @param {EchantillonData} record - Enregistrement contenant les valeurs
     * @returns {Object} Nouveau Delta avec les champs remplacés
     */
    function createMergedDelta(originalDelta, record) {
        if (!originalDelta || !originalDelta.ops) {
            return originalDelta;
        }
        
        // Créer une copie profonde du Delta
        const newOps = originalDelta.ops.map(op => {
            // Copier l'opération
            const newOp = { ...op };
            
            // Si c'est une insertion de texte, remplacer les champs
            if (typeof newOp.insert === 'string') {
                newOp.insert = replaceMergeFields(newOp.insert, record);
            }
            
            // Conserver les attributs (formatage) tels quels
            if (op.attributes) {
                newOp.attributes = { ...op.attributes };
            }
            
            return newOp;
        });
        
        return { ops: newOps };
    }

    /**
     * Analyse un Delta Quill pour identifier les lignes ne contenant que des variables.
     * Une ligne "variables uniquement" ne contient que des @CHAMP@ sans texte fixe ni espaces.
     * 
     * @param {Object} delta - Delta Quill original
     * @returns {Set<number>} Ensemble des indices de lignes (0-based) qui ne contiennent que des variables
     */
    function identifyVariableOnlyLines(delta) {
        const variableOnlyLines = new Set();
        
        if (!delta || !delta.ops) {
            return variableOnlyLines;
        }
        
        // Reconstruire le texte complet pour analyse ligne par ligne
        let fullText = '';
        for (const op of delta.ops) {
            if (typeof op.insert === 'string') {
                fullText += op.insert;
            }
        }
        
        // Découper en lignes
        const lines = fullText.split('\n');
        
        // Pattern : une ou plusieurs variables collées, sans rien d'autre
        // ^(@[A-Za-z0-9_]+@)+$ : commence et finit par des variables collées
        const variableOnlyPattern = /^(@[A-Za-z0-9_]+@)+$/;
        
        lines.forEach((line, index) => {
            // Ignorer la dernière "ligne" si c'est juste le résidu après le dernier \n
            if (index === lines.length - 1 && line === '') {
                return;
            }
            
            if (variableOnlyPattern.test(line)) {
                variableOnlyLines.add(index);
                console.log(`  📋 Ligne ${index} identifiée comme "variables uniquement": "${line}"`);
            }
        });
        
        return variableOnlyLines;
    }

    /**
     * Supprime les lignes vides d'un Delta fusionné si elles correspondaient à des lignes "variables uniquement".
     * 
     * @param {Object} mergedDelta - Delta après remplacement des variables
     * @param {Set<number>} variableOnlyLines - Lignes identifiées comme "variables uniquement"
     * @returns {Object} Delta nettoyé
     */
    function removeEmptyVariableLines(mergedDelta, variableOnlyLines) {
        if (!mergedDelta || !mergedDelta.ops || variableOnlyLines.size === 0) {
            return mergedDelta;
        }
        
        // Reconstruire le texte pour identifier les lignes vides
        let fullText = '';
        for (const op of mergedDelta.ops) {
            if (typeof op.insert === 'string') {
                fullText += op.insert;
            }
        }
        
        const lines = fullText.split('\n');
        
        // Identifier les lignes à supprimer (vides ET dans variableOnlyLines)
        const linesToRemove = new Set();
        lines.forEach((line, index) => {
            if (variableOnlyLines.has(index) && line.length === 0) {
                linesToRemove.add(index);
                console.log(`  🗑️ Ligne ${index} sera supprimée (variable vide)`);
            }
        });
        
        if (linesToRemove.size === 0) {
            return mergedDelta;
        }
        
        // Reconstruire le Delta en sautant les lignes à supprimer
        const newOps = [];
        let currentLine = 0;
        let pendingText = '';
        let pendingAttributes = null;
        
        for (const op of mergedDelta.ops) {
            if (typeof op.insert !== 'string') {
                // Embed (image, etc.) : ajouter tel quel
                if (pendingText) {
                    newOps.push(pendingAttributes ? { insert: pendingText, attributes: pendingAttributes } : { insert: pendingText });
                    pendingText = '';
                    pendingAttributes = null;
                }
                newOps.push({ ...op });
                continue;
            }
            
            const text = op.insert;
            const attrs = op.attributes ? { ...op.attributes } : null;
            
            // Traiter caractère par caractère pour gérer les sauts de ligne
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                if (char === '\n') {
                    // Fin de ligne : décider si on garde ou pas
                    if (linesToRemove.has(currentLine)) {
                        // Supprimer cette ligne : ne pas ajouter le \n ni le texte accumulé
                        pendingText = '';
                        pendingAttributes = null;
                    } else {
                        // Garder cette ligne
                        pendingText += '\n';
                        if (pendingText) {
                            newOps.push(attrs ? { insert: pendingText, attributes: attrs } : { insert: pendingText });
                            pendingText = '';
                            pendingAttributes = null;
                        }
                    }
                    currentLine++;
                } else {
                    // Caractère normal : accumuler
                    if (pendingAttributes === null || JSON.stringify(pendingAttributes) === JSON.stringify(attrs)) {
                        pendingText += char;
                        pendingAttributes = attrs;
                    } else {
                        // Changement d'attributs : flush
                        if (pendingText) {
                            newOps.push(pendingAttributes ? { insert: pendingText, attributes: pendingAttributes } : { insert: pendingText });
                        }
                        pendingText = char;
                        pendingAttributes = attrs;
                    }
                }
            }
        }
        
        // Ajouter le texte restant
        if (pendingText) {
            newOps.push(pendingAttributes ? { insert: pendingText, attributes: pendingAttributes } : { insert: pendingText });
        }
        
        console.log(`  ✂️ ${linesToRemove.size} ligne(s) supprimée(s)`);
        
        return { ops: newOps };
    }

    /**
     * Affiche le contenu fusionné pour un enregistrement donné dans toutes les zones.
     * 
     * @param {number} recordIndex - Index de l'enregistrement (0-based)
     * @returns {boolean} true si l'affichage a réussi
     */
    function displayMergedContent(recordIndex) {
        console.log(`📊 displayMergedContent(${recordIndex})`);
        
        // Vérifier que l'index est valide
        if (recordIndex < 0 || recordIndex >= documentState.donneesApercu.length) {
            console.error(`❌ Index d'enregistrement invalide: ${recordIndex}`);
            return false;
        }
        
        // Récupérer l'enregistrement
        const record = documentState.donneesApercu[recordIndex];
        console.log(`  → Enregistrement: ${record.PRENOM || ''} ${record.NOM || ''}`);
        
        // Parcourir toutes les zones sauvegardées
        previewState.savedContents.forEach((savedData, zoneId) => {
            const quillInstance = quillInstances.get(zoneId);
            
            if (!quillInstance) {
                console.warn(`  ⚠️ Instance Quill non trouvée pour ${zoneId}`);
                return;
            }
            
            if (!savedData.quillDelta) {
                console.warn(`  ⚠️ Pas de Delta sauvegardé pour ${zoneId}`);
                return;
            }
            
            // Créer le Delta fusionné
            let mergedDelta = createMergedDelta(savedData.quillDelta, record);
            
            // Gestion des lignes vides si emptyLines === 1 (Variables uniquement)
            if (savedData.emptyLines === 1) {
                const variableOnlyLines = identifyVariableOnlyLines(savedData.quillDelta);
                if (variableOnlyLines.size > 0) {
                    mergedDelta = removeEmptyVariableLines(mergedDelta, variableOnlyLines);
                }
            }
            
            // Appliquer le Delta fusionné à Quill (sans déclencher d'événements)
            quillInstance.setContents(mergedDelta, 'silent');
            
            console.log(`  ✅ Zone ${zoneId} fusionnée`);
        });
        
        // Mettre à jour l'index courant
        previewState.currentIndex = recordIndex;
        
        // Mettre à jour l'indicateur
        updateRecordIndicator();
        
        // Déclencher le copyfit pour toutes les zones fusionnées
        triggerCopyfitForPreview();
        
        return true;
    }

    /**
     * Déclenche le copyfit pour toutes les zones texte après une fusion.
     * Utilise requestAnimationFrame pour laisser Quill mettre à jour le DOM.
     * @returns {void}
     */
    function triggerCopyfitForPreview() {
        console.log('📐 triggerCopyfitForPreview()');
        
        // Petit délai pour laisser Quill mettre à jour le DOM
        requestAnimationFrame(() => {
            previewState.savedContents.forEach((savedData, zoneId) => {
                const zonesData = getPageZonesByIndex(savedData.pageIndex);
                const zoneData = zonesData ? zonesData[zoneId] : null;
                
                // Vérifier si la zone a le copyfit activé
                if (zoneData && zoneData.copyfit === true) {
                    const zoneEl = document.getElementById(zoneId);
                    if (zoneEl) {
                        const quillInstance = quillInstances.get(zoneId);
                        
                        // Appeler la fonction de copyfit existante pour Quill
                        if (quillInstance && typeof applyCopyfitToQuillZone === 'function') {
                            applyCopyfitToQuillZone(zoneEl, quillInstance, zoneData.size);
                            console.log(`  📐 Copyfit appliqué à ${zoneId}`);
                            // Ajouter indicateur visuel
                            zoneEl.classList.add('copyfit-active');
                        } else if (typeof applyCopyfit === 'function') {
                            applyCopyfit(zoneEl, zoneData.size);
                            console.log(`  📐 Copyfit appliqué à ${zoneId}`);
                            zoneEl.classList.add('copyfit-active');
                        }
                    }
                }
            });
        });
    }

    /**
     * Récupère les zones d'une page par son index.
     * @param {number} pageIndex - Index de la page (0-based)
     * @returns {Object|null} Objet des zones ou null
     */
    function getPageZonesByIndex(pageIndex) {
        if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
            return null;
        }
        return documentState.pages[pageIndex].zones || {};
    }

    /**
     * Appelé après un changement de page pour mettre à jour l'aperçu si actif.
     * @returns {void}
     */
    /**
     * Appelé après un changement de page pour mettre à jour l'aperçu si actif.
     * Sauvegarde les zones de la nouvelle page et affiche le contenu fusionné.
     * @returns {void}
     */
    function refreshPreviewAfterPageChange() {
        if (!previewState.active) return;
        
        console.log('🔄 refreshPreviewAfterPageChange()');
        
        // 1. Sauvegarder les zones texte de la nouvelle page courante
        const currentPageIndex = documentState.currentPageIndex;
        const zones = getCurrentPageZones();
        
        Object.entries(zones).forEach(([zoneId, zoneData]) => {
            // Uniquement les zones texte Quill non déjà sauvegardées
            if (zoneData.type !== 'textQuill') return;
            if (previewState.savedContents.has(zoneId)) return; // Déjà sauvegardée
            
            // CORRECTION : Lire le contenu depuis zoneData.quillDelta (déjà dans documentState)
            // au lieu de quillInstance.getContents() qui peut être vide si Quill n'a pas encore chargé
            if (zoneData.quillDelta) {
                // Parser le Delta si c'est une chaîne JSON
                let delta = zoneData.quillDelta;
                if (typeof delta === 'string') {
                    try { delta = JSON.parse(delta); } catch (e) { delta = null; }
                }
                
                if (delta && Array.isArray(delta.ops)) {
                    previewState.savedContents.set(zoneId, {
                        pageIndex: currentPageIndex,
                        quillDelta: JSON.parse(JSON.stringify(delta)), // Deep copy
                        htmlContent: '', // Non utilisé pour la fusion
                        originalFontSize: zoneData.size || 12,
                        emptyLines: zoneData.emptyLines || 0
                    });
                    
                    console.log(`  💾 Zone ${zoneId} (page ${currentPageIndex + 1}) sauvegardée depuis zoneData`);
                }
            }
        });
        
        // 2. Désactiver l'édition des zones Quill de la nouvelle page et ajouter classe preview-mode
        quillInstances.forEach((quill, zoneId) => {
            quill.disable();
            
            const zoneEl = document.getElementById(zoneId);
            if (zoneEl) {
                zoneEl.classList.add('preview-mode');
            }
        });
        
        // 3. Afficher le contenu fusionné après un court délai (laisser le DOM se stabiliser)
        setTimeout(() => {
            displayMergedContent(previewState.currentIndex);
        }, 100);
    }

    /**
     * Active le mode aperçu de fusion.
     * - Sauvegarde le contenu original
     * - Désactive l'édition des zones
     * - Affiche les contrôles de navigation
     * @returns {boolean} true si l'activation a réussi
     */
    function activatePreview() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('👁️ activatePreview() - Activation du mode aperçu');
        console.log('═══════════════════════════════════════════════════════════');
        
        // Vérifier qu'on a des données d'aperçu
        if (!hasPreviewData()) {
            console.warn('⚠️ Aucune donnée d\'aperçu disponible');
            return false;
        }
        
        // Déjà en mode aperçu ?
        if (previewState.active) {
            console.log('ℹ️ Déjà en mode aperçu');
            return true;
        }
        
        // 1. Sauvegarder le contenu original de toutes les zones
        saveAllZonesContent();
        
        // 2. Désélectionner toutes les zones
        deselectAll();
        
        // 2b. Masquer la toolbar data si elle est visible
        if (toolbarData) {
            toolbarData.style.display = 'none';
            console.log('📋 Toolbar Data masquée pour le mode aperçu');
        }
        
        // 3. Désactiver l'édition de toutes les zones Quill
        quillInstances.forEach((quill, zoneId) => {
            quill.disable();
            
            // Ajouter la classe visuelle
            const zoneEl = document.getElementById(zoneId);
            if (zoneEl) {
                zoneEl.classList.add('preview-mode');
            }
        });
        
        // 4. Réinitialiser l'index à 0
        previewState.currentIndex = 0;
        
        // 5. Marquer le mode aperçu actif
        previewState.active = true;
        
        // 6. Afficher les contrôles de navigation
        showPreviewControls();
        
        // 7. Désactiver le drag & drop des zones
        disableZoneInteractions();
        
        // 8. Masquer toutes les sections de la sidebar sauf Aperçu et Pages
        document.querySelectorAll('.sidebar .section').forEach(section => {
            if (section.id !== 'preview-section' && section.id !== 'pages-section') {
                section.style.display = 'none';
            }
        });
        // S'assurer que la section Aperçu est visible
        if (previewSection) {
            previewSection.style.display = 'block';
        }
        // S'assurer que la section Pages est visible (pour naviguer entre les pages)
        const pagesSection = document.getElementById('pages-section');
        if (pagesSection) {
            pagesSection.style.display = 'block';
        }
        
        console.log('✅ Mode aperçu activé');
        console.log('═══════════════════════════════════════════════════════════');
        
        // Afficher le premier enregistrement fusionné
        displayMergedContent(0);
        
        return true;
    }

    /**
     * Désactive le mode aperçu et restaure le mode édition.
     * - Restaure le contenu original
     * - Réactive l'édition des zones
     * - Masque les contrôles de navigation
     * @returns {void}
     */
    function deactivatePreview() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('👁️ deactivatePreview() - Désactivation du mode aperçu');
        console.log('═══════════════════════════════════════════════════════════');
        
        // Pas en mode aperçu ?
        if (!previewState.active) {
            console.log('ℹ️ Pas en mode aperçu');
            return;
        }
        
        // 1. Restaurer le contenu original de toutes les zones
        restoreAllZonesContent();
        
        // 2. Réactiver l'édition de toutes les zones Quill
        quillInstances.forEach((quill, zoneId) => {
            quill.enable();
            
            // Retirer la classe visuelle
            const zoneEl = document.getElementById(zoneId);
            if (zoneEl) {
                zoneEl.classList.remove('preview-mode');
            }
        });
        
        // 3. Marquer le mode aperçu inactif
        previewState.active = false;
        
        // 4. Masquer les contrôles de navigation
        hidePreviewControls();
        
        // 5. Réactiver le drag & drop des zones
        enableZoneInteractions();
        
        // 6. Réafficher la toolbar data si une zone texte est sélectionnée
        updateToolbarDataVisibility();
        
        // 7. Restaurer la visibilité normale des sections de la sidebar
        updateSidebarSectionsVisibility();
        
        console.log('✅ Mode édition restauré');
        console.log('═══════════════════════════════════════════════════════════');
    }

    /**
     * Désactive les interactions de manipulation des zones (drag, resize)
     * Utilisé en mode aperçu pour empêcher les modifications.
     * @returns {void}
     */
    /**
     * Désactive les interactions d'édition en mode aperçu
     * Note : Le déplacement et redimensionnement restent actifs pour ajuster les zones
     * @returns {void}
     */
    function disableZoneInteractions() {
        console.log('🔒 disableZoneInteractions() - Édition désactivée, déplacement/resize autorisés');
        
        // Ajouter la classe pour les styles visuels (curseur, etc.)
        document.querySelectorAll('.zone-frame').forEach(zone => {
            zone.classList.add('preview-mode');
        });
        
        // NOTE : On ne désactive PAS le drag ni le resize
        // L'utilisateur peut ajuster la position et taille en voyant les vraies valeurs
    }

    /**
     * Réactive les interactions après le mode aperçu
     * @returns {void}
     */
    function enableZoneInteractions() {
        console.log('🔓 enableZoneInteractions() - Édition réactivée');
        
        // Retirer la classe preview-mode
        document.querySelectorAll('.zone-frame').forEach(zone => {
            zone.classList.remove('preview-mode');
        });
    }

    // --- FONCTIONS HELPER POUR ACCÈS AUX DONNÉES ---

    /**
     * Retourne la page courante du document.
     * @returns {PageData} Page courante (Recto ou Verso selon currentPageIndex)
     */
    function getCurrentPage() {
        return documentState.pages[documentState.currentPageIndex];
    }

    /**
     * Retourne la collection de zones de la page courante.
     * @returns {ZonesCollection} Objet zones indexé par ID (ex: { 'zone-1': {...}, 'zone-2': {...} })
     */
    function getCurrentPageZones() {
        return getCurrentPage().zones;
    }

    /**
     * Remplace la collection de zones de la page courante.
     * @param {ZonesCollection} zones - Nouvelle collection de zones
     */
    function setCurrentPageZones(zones) {
        getCurrentPage().zones = zones;
    }

    /**
     * Alias de getCurrentPageZones() pour rétrocompatibilité.
     * @returns {ZonesCollection} Zones de la page courante
     * @deprecated Utiliser getCurrentPageZones() à la place
     */
    function getZonesData() {
        return getCurrentPageZones();
    }

    // --- FONCTIONS HELPER POUR LES DIMENSIONS DE PAGE ---

    /**
     * Retourne la largeur de la page courante en pixels.
     * Priorité : données sauvegardées > DOM > format par défaut (A4).
     * 
     * @returns {number} Largeur en pixels (ex: 794 pour A4)
     */
    function getPageWidth() {
        const currentPage = getCurrentPage();
        // Priorité : données sauvegardées > dimensions du DOM > format par défaut
        if (currentPage && currentPage.width) {
            return currentPage.width;
        }
        // Fallback : lire depuis le DOM si disponible
        if (a4Page && a4Page.offsetWidth > 0) {
            return a4Page.offsetWidth;
        }
        // Fallback final : format par défaut
        return DOCUMENT_FORMATS[DEFAULT_FORMAT].width;
    }

    /**
     * Retourne la hauteur de la page courante en pixels.
     * Priorité : données sauvegardées > DOM > format par défaut (A4).
     * 
     * @returns {number} Hauteur en pixels (ex: 1123 pour A4)
     */
    function getPageHeight() {
        const currentPage = getCurrentPage();
        // Priorité : données sauvegardées > dimensions du DOM > format par défaut
        if (currentPage && currentPage.height) {
            return currentPage.height;
        }
        // Fallback : lire depuis le DOM si disponible
        if (a4Page && a4Page.offsetHeight > 0) {
            return a4Page.offsetHeight;
        }
        // Fallback final : format par défaut
        return DOCUMENT_FORMATS[DEFAULT_FORMAT].height;
    }

    /**
     * Retourne la largeur de la page courante en millimètres (valeur EXACTE).
     * Évite les erreurs de conversion px→mm en utilisant les valeurs mm natives si disponibles.
     * 
     * Priorité :
     * 1. formatDocument.largeurMm (depuis import JSON WebDev)
     * 2. DOCUMENT_FORMATS_MM[format].widthMm (format prédéfini)
     * 3. Conversion arrondie depuis pixels
     * 
     * @returns {number} Largeur en mm (ex: 210 pour A4)
     */
    function getPageWidthMm() {
        const currentPage = getCurrentPage();
        
        // Priorité 1 : valeur mm stockée dans formatDocument (import JSON)
        if (documentState.formatDocument?.largeurMm !== undefined) {
            return documentState.formatDocument.largeurMm;
        }
        
        // Priorité 2 : format prédéfini en mm
        const format = currentPage?.format || DEFAULT_FORMAT;
        if (DOCUMENT_FORMATS_MM[format]) {
            return DOCUMENT_FORMATS_MM[format].widthMm;
        }
        
        // Priorité 3 (Custom ou format inconnu) : arrondir à l'entier le plus proche
        // Cela corrige les erreurs de précision px→mm (794px → 210.05mm → 210mm)
        return Math.round(pxToMm(getPageWidth()));
    }

    /**
     * Retourne la hauteur de la page courante en millimètres (valeur EXACTE).
     * Évite les erreurs de conversion px→mm en utilisant les valeurs mm natives si disponibles.
     * 
     * Priorité :
     * 1. formatDocument.hauteurMm (depuis import JSON WebDev)
     * 2. DOCUMENT_FORMATS_MM[format].heightMm (format prédéfini)
     * 3. Conversion arrondie depuis pixels
     * 
     * @returns {number} Hauteur en mm (ex: 297 pour A4)
     */
    function getPageHeightMm() {
        const currentPage = getCurrentPage();
        
        // Priorité 1 : valeur mm stockée dans formatDocument (import JSON)
        if (documentState.formatDocument?.hauteurMm !== undefined) {
            return documentState.formatDocument.hauteurMm;
        }
        
        // Priorité 2 : format prédéfini en mm
        const format = currentPage?.format || DEFAULT_FORMAT;
        if (DOCUMENT_FORMATS_MM[format]) {
            return DOCUMENT_FORMATS_MM[format].heightMm;
        }
        
        // Priorité 3 (Custom ou format inconnu) : arrondir à l'entier le plus proche
        // Cela corrige les erreurs de précision px→mm (1123px → 297.09mm → 297mm)
        return Math.round(pxToMm(getPageHeight()));
    }

    /**
     * Applique les dimensions de la page courante au DOM.
     * Met à jour la taille de l'élément #a4-page selon le format du document.
     * 
     * @returns {void}
     * 
     * @see getPageWidth - Largeur en pixels
     * @see getPageHeight - Hauteur en pixels
     */
    function applyPageDimensions() {
        const width = getPageWidth();
        const height = getPageHeight();
        if (a4Page) {
            a4Page.style.width = width + 'px';
            a4Page.style.height = height + 'px';
        }
    }

    /**
     * Calcule le centre de la vue actuelle dans les coordonnées de la page.
     * Utilisé pour positionner les nouvelles zones au centre de l'écran visible.
     * Prend en compte le niveau de zoom actuel.
     * 
     * @returns {{x: number, y: number}} Coordonnées du centre en pixels (dans le repère de la page)
     * 
     * @example
     * const center = getCenterOfView();
     * zone.style.left = (center.x - zoneWidth/2) + 'px';
     * zone.style.top = (center.y - zoneHeight/2) + 'px';
     */
    function getCenterOfView() {
        // Utiliser zoomLevel s'il est défini, sinon 1.0 par défaut
        const currentZoom = typeof zoomLevel !== 'undefined' ? zoomLevel : 1.0;
        
        // Calculer le centre du viewport (workspace visible)
        const viewportCenterX = workspace.scrollLeft + workspace.clientWidth / 2;
        const viewportCenterY = workspace.scrollTop + workspace.clientHeight / 2;
        
        // Obtenir la position de #a4-page dans le workspace-canvas
        const a4PageRect = a4Page.getBoundingClientRect();
        const canvasRect = workspaceCanvas.getBoundingClientRect();
        
        // Position relative de #a4-page dans le canvas
        const a4PageOffsetX = a4PageRect.left - canvasRect.left + workspace.scrollLeft;
        const a4PageOffsetY = a4PageRect.top - canvasRect.top + workspace.scrollTop;
        
        // Calculer la position relative au centre de #a4-page (sans zoom)
        const centerX = (viewportCenterX - a4PageOffsetX) / currentZoom;
        const centerY = (viewportCenterY - a4PageOffsetY) / currentZoom;
        
        // S'assurer que la position est dans les limites de la page
        const pageWidth = getPageWidth();
        const pageHeight = getPageHeight();
        const maxX = Math.max(0, Math.min(pageWidth, centerX));
        const maxY = Math.max(0, Math.min(pageHeight, centerY));
        
        return { x: maxX, y: maxY };
    }

    // ─────────────────────────────── FIN SECTION 12 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 13 : CRÉATION DE ZONES
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Création des différents types de zones (texte, QR, image, code-barres).
     * Fonctions de copier-coller de zones.
     * 
     * Event Listeners :
     *   - btnAddTextQuill : Créer zone texte Quill
     *   - btnAddQr : Créer zone QR
     *   - btnAddImage : Créer zone image
     *   - btnAddBarcode : Créer zone code-barres
     * 
     * Fonctions principales :
     *   - createZoneDOM() : Créer l'élément DOM d'une zone
     *   - copyZone() : Copier la zone sélectionnée
     *   - pasteZone() : Coller la zone copiée
     * 
     * Dépendances :
     *   - documentState, getCurrentPageZones() (Section 12)
     *   - saveState() (Section 11)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    /**
     * Crée une nouvelle zone de texte Quill (WYSIWYG) sur la page courante.
     * - Position : centrée sur la vue (avec contraintes de marge de sécurité)
     * - Taille par défaut : 80mm x 30mm (convertie en pixels)
     * - Quill : theme 'snow', toolbar désactivée, placeholder défini
     *
     * @returns {void}
     */
    function createTextQuillZone() {
        // Bloquer la création de zones en mode aperçu
        if (previewState.active) {
            console.warn('⚠️ Création de zone bloquée en mode aperçu');
            return null;
        }
        
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter; // Synchroniser pour compatibilité
        
        const zoneId = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        
        // Calculer le z-index pour mettre la nouvelle zone au premier plan
        const newZIndex = getMaxZIndex() + 1;
        
        // Stocker des valeurs par défaut (les dimensions et la position seront appliquées dans createZoneDOM)
        zonesData[zoneId] = {
            type: 'textQuill',
            content: '',
            quillDelta: null,
            font: QUILL_DEFAULT_FONT,
            size: QUILL_DEFAULT_SIZE,
            color: QUILL_DEFAULT_COLOR,
            align: 'left',
            valign: 'top',
            bgColor: '#ffffff',
            isTransparent: true,
            bold: false,
            lineHeight: QUILL_DEFAULT_LINE_HEIGHT,
            locked: false,
            copyfit: false,
            emptyLines: 0,
            zIndex: newZIndex,
            border: {
                width: 0,
                color: '#000000',
                style: 'solid'
            }
        };
        
        createZoneDOM(zoneId, zoneCounter, true);
        
        const zoneElement = document.getElementById(zoneId);
        const quillInstance = quillInstances.get(zoneId);
        
        console.log('🔧 PHASE 1 - Création zone textQuill:');
        console.log('  ✓ Zone ID:', zoneId);
        console.log('  ✓ Element DOM créé:', zoneElement ? 'OUI' : 'NON');
        console.log('  ✓ Instance Quill créée:', quillInstances.has(zoneId));
        console.log('  ✓ Quill editor ready:', quillInstance && quillInstance.root ? 'OUI' : 'NON');
        
        saveToLocalStorage(); // Sauvegarde auto
        saveState(); // Snapshot APRÈS la création
    }

    if (btnAddTextQuill) {
        btnAddTextQuill.addEventListener('click', () => {
            createTextQuillZone();
        });
    }

    btnAddQr.addEventListener('click', () => {
        // Bloquer la création de zones en mode aperçu
        if (previewState.active) {
            console.warn('⚠️ Création de zone QR bloquée en mode aperçu');
            return;
        }
        
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter; // Synchroniser pour compatibilité
        const id = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        
        // Calculer le z-index pour mettre la nouvelle zone au premier plan
        const newZIndex = getMaxZIndex() + 1;
        
        zonesData[id] = {
            type: 'qr',
            typeCode: 'QRCode',
            qrColor: '#000000',
            bgColor: '#ffffff',
            isTransparent: false, // Par défaut non transparent
            locked: false,
            zIndex: newZIndex // Niveau d'empilement (au premier plan)
        };
        createZoneDOM(id, zoneCounter);
        saveToLocalStorage();
        saveState(); // Snapshot APRÈS la création
    });

    // Listener pour créer une zone image
    btnAddImage.addEventListener('click', () => {
        // Bloquer la création de zones en mode aperçu
        if (previewState.active) {
            console.warn('⚠️ Création de zone image bloquée en mode aperçu');
            return;
        }
        
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter;
        const id = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        
        // Calculer le z-index pour mettre la nouvelle zone au premier plan
        const newZIndex = getMaxZIndex() + 1;
        
        zonesData[id] = {
            type: 'image',
            source: {
                type: 'fixe',        // 'fixe' (image uploadée), 'url' (rétrocompat), 'champ' (fusion)
                valeur: '',          // URL pour rétrocompatibilité ou nom du champ
                imageBase64: null,   // Données base64 de l'image compressée
                nomOriginal: null,   // Nom du fichier uploadé
                largeurPx: null,     // Largeur image compressée
                hauteurPx: null,     // Hauteur image compressée
                poidsBrut: null,     // Poids avant compression (octets)
                poidsCompresse: null // Poids après compression (octets)
            },
            redimensionnement: {
                mode: 'ajuster',
                alignementH: 'center',
                alignementV: 'middle'
            },
            bgColor: '#ffffff',
            isTransparent: true,
            locked: false,
            rotation: 0,
            zIndex: newZIndex, // Niveau d'empilement (au premier plan)
            border: {
                width: 0,
                color: '#000000',
                style: 'solid'
            }
        };
        
        createZoneDOM(id, zoneCounter);
        saveToLocalStorage();
        saveState();
    });

    // Listener pour créer une zone code-barres
    const btnAddBarcode = document.getElementById('btn-add-barcode');
    if (btnAddBarcode) {
        btnAddBarcode.addEventListener('click', () => {
            // Bloquer la création de zones en mode aperçu
            if (previewState.active) {
                console.warn('⚠️ Création de zone code-barres bloquée en mode aperçu');
                return;
            }
            
            documentState.zoneCounter++;
            zoneCounter = documentState.zoneCounter;
            const id = `zone-${zoneCounter}`;
            const zonesData = getCurrentPageZones();
            
            // Calculer le z-index pour mettre la nouvelle zone au premier plan
            const newZIndex = getMaxZIndex() + 1;
            
            zonesData[id] = {
                type: 'barcode',
                nom: 'Code-barres',
                typeCodeBarres: 'code128',       // Type par défaut
                champFusion: '',                  // Champ de fusion (sans les @)
                texteLisible: 'dessous',          // 'aucun', 'dessous'
                taillePolice: 8,                  // Taille du texte lisible en points
                couleur: '#000000',               // Couleur du code-barres
                bgColor: '#ffffff',               // Couleur de fond
                isTransparent: false,             // Par défaut non transparent
                locked: false,
                zIndex: newZIndex
            };
            
            createZoneDOM(id, zoneCounter);
            saveToLocalStorage();
            saveState();
        });
    }

    /**
     * Crée l'élément DOM pour une zone et l'ajoute à la page.
     * Gère tous les types de zones (text, qr, barcode, image) avec leur structure HTML spécifique.
     * 
     * Structure DOM créée :
     * - div.zone (conteneur principal avec poignées de redimensionnement)
     *   - div.zone-content (contenu de la zone)
     *   - div.zone-label (numéro de zone)
     *   - span.zone-field-badge (badge champ de fusion, zones texte)
     *   - span.barcode-type-badge (badge type, zones code-barres)
     *   - span.barcode-field-badge (badge champ, zones code-barres)
     * 
     * @param {string} id - Identifiant unique de la zone (ex: "zone-1")
     * @param {number|string} labelNum - Numéro à afficher dans le label (généralement le compteur)
     * @param {boolean} [autoSelect=true] - Sélectionner automatiquement la zone après création
     * @returns {void}
     * 
     * @fires saveToLocalStorage - Si autoSelect est true (via selectZone)
     * 
     * @example
     * // Créer une nouvelle zone et la sélectionner
     * zonesData['zone-5'] = { type: 'textQuill', content: 'Nouveau texte' };
     * createZoneDOM('zone-5', 5);
     * 
     * // Restaurer une zone sans la sélectionner (chargement)
     * createZoneDOM('zone-3', 3, false);
     * 
     * @see selectZone - Sélection de la zone créée
     * @see updateTextZoneDisplay - Mise à jour affichage texte
     * @see updateImageZoneDisplay - Mise à jour affichage image
     * @see updateBarcodeZoneDisplay - Mise à jour affichage code-barres
     * @see updateQrZoneDisplay - Mise à jour affichage QR
     */
    function createZoneDOM(id, labelNum, autoSelect = true) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[id] || {};
        const zoneType = zoneData.type || 'textQuill';
        zonesData[id] = { type: zoneType, ...zoneData };

        const zone = document.createElement('div');
        zone.classList.add('zone');
        // Stocker le type sur le DOM pour debug / logique UI (toolbar Quill)
        zone.dataset.type = zoneType;
        if (zoneType === 'qr') {
            zone.classList.add('zone-qr');
        }
        if (zoneType === 'barcode') {
            zone.classList.add('barcode-zone');
        }
        if (autoSelect) {
            zone.classList.add('zone-appear-anim');
            setTimeout(() => zone.classList.remove('zone-appear-anim'), 1000);
        }
        zone.id = id;
        
        // Calculer le centre de la vue pour positionner la nouvelle zone
        const centerView = getCenterOfView();
        // Dimensions par défaut selon le type
        let defaultZoneWidth, defaultZoneHeight;
        if (zoneType === 'qr') {
            defaultZoneWidth = 100;
            defaultZoneHeight = 100;
        } else if (zoneType === 'barcode') {
            // Code-barres 2D = carré, 1D = rectangle
            const is2D = ['qrcode', 'datamatrix'].includes(zoneData.typeCodeBarres);
            defaultZoneWidth = is2D ? 100 : 150;
            defaultZoneHeight = is2D ? 100 : 60;
        } else if (zoneType === 'image') {
            defaultZoneWidth = 150;
            defaultZoneHeight = 150;
        } else {
            // Zone texte Quill (par défaut) : 80mm x 30mm (convertir en pixels)
            defaultZoneWidth = mmToPx(80);
            defaultZoneHeight = mmToPx(30);
        }
        
        // Obtenir la marge de sécurité et les dimensions de la page
        const margin = getSecurityMarginPx();
        const pageWidth = getPageWidth();
        const pageHeight = getPageHeight();
        
        // Positionner au centre de la vue, moins la moitié de la taille de la zone
        let zoneX = centerView.x - (defaultZoneWidth / 2);
        let zoneY = centerView.y - (defaultZoneHeight / 2);
        
        // Appliquer les contraintes de marge de sécurité pour les nouvelles zones
        const minX = margin;
        const maxX = pageWidth - margin - defaultZoneWidth;
        const minY = margin;
        const maxY = pageHeight - margin - defaultZoneHeight;
        zoneX = Math.max(minX, Math.min(zoneX, maxX));
        zoneY = Math.max(minY, Math.min(zoneY, maxY));
        
        if (zoneType === 'qr') {
            const defaultSize = zoneData.w || zoneData.h || 100;
            zone.style.width = (zoneData.w || defaultSize) + 'px';
            zone.style.height = (zoneData.h || defaultSize) + 'px';
            // Utiliser la position sauvegardée si elle existe, sinon le centre de la vue
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : zoneX) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : zoneY) + 'px';
            
            // Fond : respecter isTransparent et bgColor (comme les autres types de zones)
            if (zoneData.isTransparent) {
                zone.style.backgroundColor = 'transparent';
            } else {
                zone.style.backgroundColor = zoneData.bgColor || '#ffffff';
            }
            
            // Mémoriser les dimensions de base en pixels pour cohérence (export/édition future)
            zonesData[id].w = parseFloat(zone.style.width);
            zonesData[id].h = parseFloat(zone.style.height);
            zonesData[id].x = parseFloat(zone.style.left);
            zonesData[id].y = parseFloat(zone.style.top);

            const qrWrapper = document.createElement('div');
            qrWrapper.classList.add('zone-content');
            zone.appendChild(qrWrapper);

            // Générer le vrai code-barres après ajout au DOM
            // (utilise setTimeout pour s'assurer que les dimensions sont calculées)
            setTimeout(() => {
                updateQrZoneDisplay(id);
            }, 10);
        } else if (zoneType === 'image') {
            // Zone image
            const defaultSize = 150;
            zone.style.width = (zoneData.w || defaultSize) + 'px';
            zone.style.height = (zoneData.h || defaultSize) + 'px';
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : zoneX) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : zoneY) + 'px';
            zone.classList.add('zone-image');
            
            // Fond
            if (zoneData.isTransparent) {
                zone.style.backgroundColor = 'transparent';
            } else {
                zone.style.backgroundColor = zoneData.bgColor || '#ffffff';
            }
            
            // Mémoriser les dimensions de base en pixels pour cohérence (export/édition future)
            zonesData[id].w = parseFloat(zone.style.width);
            zonesData[id].h = parseFloat(zone.style.height);
            zonesData[id].x = parseFloat(zone.style.left);
            zonesData[id].y = parseFloat(zone.style.top);
            
            // Bordure
            if (zoneData.border) {
                applyBorderToZone(zone, zoneData.border);
            }
            
            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('zone-content', 'zone-image-content');
            zone.appendChild(imageWrapper);

            // Afficher image réelle ou placeholder
            updateImageZoneDisplay(zone, zoneData);
            
            // Créer le badge DPI (sera mis à jour si une image est chargée)
            const dpiBadge = document.createElement('span');
            dpiBadge.className = 'image-dpi-badge';
            zone.appendChild(dpiBadge);
            
            // Mettre à jour le badge si une image est déjà chargée
            setTimeout(() => {
                updateImageDpiBadge(id);
            }, 10);
        } else if (zoneType === 'barcode') {
            // Zone code-barres
            const is2D = ['qrcode', 'datamatrix'].includes(zoneData.typeCodeBarres);
            const defaultWidth = is2D ? 100 : 150;
            const defaultHeight = is2D ? 100 : 60;
            
            zone.style.width = (zoneData.w || defaultWidth) + 'px';
            zone.style.height = (zoneData.h || defaultHeight) + 'px';
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : zoneX) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : zoneY) + 'px';
            
            // Fond : respecter isTransparent et bgColor (comme les autres types de zones)
            if (zoneData.isTransparent) {
                zone.style.backgroundColor = 'transparent';
            } else {
                zone.style.backgroundColor = zoneData.bgColor || '#ffffff';
            }
            
            // Mémoriser les dimensions de base en pixels pour cohérence (export/édition future)
            zonesData[id].w = parseFloat(zone.style.width);
            zonesData[id].h = parseFloat(zone.style.height);
            zonesData[id].x = parseFloat(zone.style.left);
            zonesData[id].y = parseFloat(zone.style.top);
            
            // Badge type de code-barres (en haut à gauche)
            const typeBadge = document.createElement('span');
            typeBadge.className = 'barcode-type-badge';
            typeBadge.textContent = getBarcodeTypeLabel(zoneData.typeCodeBarres || 'code128');
            zone.appendChild(typeBadge);
            
            // Container preview
            const preview = document.createElement('div');
            preview.className = 'barcode-preview';
            // Appliquer le même fond au container preview
            if (zoneData.isTransparent) {
                preview.style.backgroundColor = 'transparent';
            } else {
                preview.style.backgroundColor = zoneData.bgColor || '#ffffff';
            }
            
            // Container pour le code-barres généré
            const svgContainer = document.createElement('div');
            svgContainer.className = 'barcode-svg';
            preview.appendChild(svgContainer);
            
            // Label champ de fusion
            const label = document.createElement('div');
            label.className = 'barcode-label';
            label.textContent = zoneData.champFusion ? '@' + zoneData.champFusion + '@' : '(Aucun champ)';
            preview.appendChild(label);
            
            zone.appendChild(preview);
            
            // Générer le vrai code-barres après ajout au DOM
            setTimeout(() => {
                updateBarcodeZoneDisplay(id);
            }, 10);
        } else if (zoneType === 'textQuill') {
            // Zone texte Quill (WYSIWYG)
            const defaultW = defaultZoneWidth;
            const defaultH = defaultZoneHeight;
            
            zone.classList.add('zone-text-quill');
            zone.style.width = (zoneData.w || defaultW) + 'px';
            zone.style.height = (zoneData.h || defaultH) + 'px';
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : zoneX) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : zoneY) + 'px';
            
            // Mémoriser les dimensions de base en pixels pour cohérence (export/édition future)
            zonesData[id].w = parseFloat(zone.style.width);
            zonesData[id].h = parseFloat(zone.style.height);
            zonesData[id].x = parseFloat(zone.style.left);
            zonesData[id].y = parseFloat(zone.style.top);
            
            // Fond (ne pas forcer à transparent : respecter les données importées / sauvegardées)
            zone.style.backgroundColor = zoneData.isTransparent ? 'transparent' : (zoneData.bgColor || '#ffffff');
            
            // Bordure utilisateur (si définie)
            if (zoneData.border) {
                applyBorderToZone(zone, zoneData.border);
            }

            // Drag handle (POC) - bandeau supérieur
            const dragHandle = document.createElement('div');
            dragHandle.classList.add('zone-drag-handle');
            zone.appendChild(dragHandle);
            
            const contentWrapper = document.createElement('div');
            contentWrapper.classList.add('zone-content');
            
            const editorEl = document.createElement('div');
            editorEl.classList.add('quill-editor');
            contentWrapper.appendChild(editorEl);
            zone.appendChild(contentWrapper);

            // Resize handles (POC) : se, e, s
            /** @type {Array<{pos: string, className: string}>} */
            const resizeHandles = [
                { pos: 'se', className: 'resize-handle resize-handle-se' },
                { pos: 'e', className: 'resize-handle resize-handle-e' },
                { pos: 's', className: 'resize-handle resize-handle-s' }
            ];
            resizeHandles.forEach(h => {
                const handleEl = document.createElement('div');
                handleEl.className = h.className;
                handleEl.dataset.pos = h.pos;
                zone.appendChild(handleEl);
            });
            
            // Initialiser Quill si disponible
            if (typeof Quill === 'function') {
                const quillInstance = new Quill(editorEl, {
                    modules: { toolbar: false, clipboard: { matchers: [] } },
                    theme: 'snow',
                    placeholder: 'Saisissez votre texte...'
                });
                
                // Appliquer styles par défaut (police, taille, couleur, interlignage)
                if (quillInstance && quillInstance.root) {
                    quillInstance.root.style.fontFamily = `${QUILL_DEFAULT_FONT}, sans-serif`;
                    quillInstance.root.style.fontSize = `${QUILL_DEFAULT_SIZE}pt`;
                    quillInstance.root.style.color = QUILL_DEFAULT_COLOR;
                    quillInstance.root.style.lineHeight = String(QUILL_DEFAULT_LINE_HEIGHT);
                }
                
                // Stocker l'instance
                quillInstances.set(id, quillInstance);

                // Zone système : désactiver l'édition Quill
                if (zoneData.systeme) {
                    quillInstance.disable();
                }

                // Debug copyfit : tracer le chargement des polices (utile sur Ctrl+F5)
                if (DEBUG_COPYFIT && !copyfitFontsDebugInstalled && document.fonts && typeof document.fonts.addEventListener === 'function') {
                    copyfitFontsDebugInstalled = true;
                    try {
                        document.fonts.addEventListener('loading', () => {
                            console.log('🧪 COPYFIT FONTS - loading', { status: document.fonts.status, size: document.fonts.size });
                        });
                        document.fonts.addEventListener('loadingdone', (e) => {
                            console.log('🧪 COPYFIT FONTS - loadingdone', { status: document.fonts.status, size: document.fonts.size, event: e });
                        });
                        document.fonts.addEventListener('loadingerror', (e) => {
                            console.log('🧪 COPYFIT FONTS - loadingerror', { status: document.fonts.status, size: document.fonts.size, event: e });
                        });
                        console.log('🧪 COPYFIT FONTS - listeners installed', { status: document.fonts.status, size: document.fonts.size });
                    } catch (e) {}
                }

                // Phase 5 : mini-toolbar contextuelle (affichage au-dessus de la sélection)
                quillInstance.on('selection-change', (range) => {
                    handleTextQuillSelectionChange(id, range);
                });
                
                // BUGFIX : restaurer le contenu APRÈS stabilisation DOM (sans focus)
                // Priorité : Delta natif (préserve le formatage). Fallback : HTML pour rétrocompat.
                // NOTE : après Ctrl+F5, certaines sauvegardes peuvent contenir quillDelta sous forme de string JSON,
                // ou un Delta qui fait échouer setContents() (Quill reste alors vide si on swallow l'erreur).
                if (zoneData.quillDelta) {
                    if (DEBUG_COPYFIT) {
                        console.group(`🧪 COPYFIT LOAD - before setContents: ${id}`);
                        try {
                            const zc = zone.querySelector('.zone-content');
                            console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                            console.log('zone.offset (px):', { w: zone.offsetWidth, h: zone.offsetHeight });
                            console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                            console.log('zoneData.copyfit/size:', { copyfit: !!zoneData.copyfit, size: zoneData.size });
                            console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                            console.log('computed quill.root:', quillInstance.root ? {
                                fontFamily: getComputedStyle(quillInstance.root).fontFamily,
                                fontSize: getComputedStyle(quillInstance.root).fontSize,
                                lineHeight: getComputedStyle(quillInstance.root).lineHeight
                            } : null);
                        } catch (e) {}
                        console.groupEnd();
                    }
                    setTimeout(async () => {
                        try {
                            /** @type {any} */
                            let delta = zoneData.quillDelta;
                            if (typeof delta === 'string') {
                                try { delta = JSON.parse(delta); } catch (e) {}
                            }
                            if (delta && Array.isArray(delta.ops)) {
                                quillInstance.setContents(delta, 'silent');
                                console.log('🔧 BUGFIX - Contenu Quill restauré (Delta):', id);
                            } else {
                                // Fallback minimal si Delta invalide
                                const fallbackText = (typeof zoneData.quillDelta === 'string') ? zoneData.quillDelta : '';
                                quillInstance.setText(fallbackText || '', 'silent');
                                console.warn('⚠️ BUGFIX - Delta Quill invalide, fallback texte appliqué:', id);
                            }
                            // BUGFIX: Attendre le chargement des polices avant d'appliquer les styles (copyfit)
                            // Sinon les métriques de texte sont incorrectes et le texte est coupé
                            if (document.fonts && document.fonts.status !== 'loaded') {
                                if (DEBUG_COPYFIT) {
                                    console.log(`🧪 COPYFIT LOAD - waiting for fonts (Delta): ${id}, status:`, document.fonts.status);
                                }
                                await document.fonts.ready;
                                if (DEBUG_COPYFIT) {
                                    console.log(`🧪 COPYFIT LOAD - fonts ready (Delta): ${id}, status:`, document.fonts.status);
                                }
                            }
                            // Réappliquer les styles APRÈS la restauration du contenu (setContents peut réinitialiser)
                            if (DEBUG_COPYFIT) {
                                console.group(`🧪 COPYFIT LOAD - before applyQuillZoneStyles (Delta): ${id}`);
                                try {
                                    const zc = zone.querySelector('.zone-content');
                                    console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                                    console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                                    console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                                    console.log('computed quill.root:', quillInstance.root ? {
                                        fontFamily: getComputedStyle(quillInstance.root).fontFamily,
                                        fontSize: getComputedStyle(quillInstance.root).fontSize,
                                        lineHeight: getComputedStyle(quillInstance.root).lineHeight
                                    } : null);
                                } catch (e) {}
                                console.groupEnd();
                            }
                            applyQuillZoneStyles(id);
                            if (DEBUG_COPYFIT) {
                                console.group(`🧪 COPYFIT LOAD - after applyQuillZoneStyles (Delta): ${id}`);
                                try {
                                    const zc = zone.querySelector('.zone-content');
                                    console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                                    console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                                    console.log('computed:', {
                                        editorFontSize: quillInstance.root ? getComputedStyle(quillInstance.root).fontSize : null,
                                        editorLineHeight: quillInstance.root ? getComputedStyle(quillInstance.root).lineHeight : null
                                    });
                                    console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                                } catch (e) {}
                                console.groupEnd();
                            }
                        } catch (e) {
                            console.warn('⚠️ BUGFIX - Échec restauration Quill via Delta, fallback texte:', id, e);
                            try {
                                // Fallback : extraire un texte brut du Delta si possible
                                const d = zoneData.quillDelta;
                                const ops = d && typeof d === 'object' && Array.isArray(d.ops) ? d.ops : [];
                                const text = ops.map(op => typeof op.insert === 'string' ? op.insert : '').join('');
                                quillInstance.setText(text || '', 'silent');
                                // BUGFIX: Attendre le chargement des polices avant d'appliquer les styles (copyfit)
                                if (document.fonts && document.fonts.status !== 'loaded') {
                                    await document.fonts.ready;
                                }
                                if (DEBUG_COPYFIT) {
                                    console.group(`🧪 COPYFIT LOAD - before applyQuillZoneStyles (fallback Delta): ${id}`);
                                    try {
                                        const zc = zone.querySelector('.zone-content');
                                        console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                                        console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                                        console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                                    } catch (e) {}
                                    console.groupEnd();
                                }
                                applyQuillZoneStyles(id);
                            } catch (e2) {}
                        }
                    }, 0);
                } else if (zoneData.content) {
                    if (DEBUG_COPYFIT) {
                        console.group(`🧪 COPYFIT LOAD - before pasteHTML: ${id}`);
                        try {
                            const zc = zone.querySelector('.zone-content');
                            console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                            console.log('zone.offset (px):', { w: zone.offsetWidth, h: zone.offsetHeight });
                            console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                            console.log('zoneData.copyfit/size:', { copyfit: !!zoneData.copyfit, size: zoneData.size });
                            console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                        } catch (e) {}
                        console.groupEnd();
                    }
                    setTimeout(async () => {
                        try {
                            quillInstance.clipboard.dangerouslyPasteHTML(0, zoneData.content, 'silent');
                            console.log('🔧 BUGFIX - Contenu Quill restauré (HTML):', id);
                            // BUGFIX: Attendre le chargement des polices avant d'appliquer les styles (copyfit)
                            // Sinon les métriques de texte sont incorrectes et le texte est coupé
                            if (document.fonts && document.fonts.status !== 'loaded') {
                                if (DEBUG_COPYFIT) {
                                    console.log(`🧪 COPYFIT LOAD - waiting for fonts (HTML): ${id}, status:`, document.fonts.status);
                                }
                                await document.fonts.ready;
                                if (DEBUG_COPYFIT) {
                                    console.log(`🧪 COPYFIT LOAD - fonts ready (HTML): ${id}, status:`, document.fonts.status);
                                }
                            }
                            // Réappliquer les styles APRÈS la restauration du contenu
                            if (DEBUG_COPYFIT) {
                                console.group(`🧪 COPYFIT LOAD - before applyQuillZoneStyles (HTML): ${id}`);
                                try {
                                    const zc = zone.querySelector('.zone-content');
                                    console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                                    console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                                    console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                                } catch (e) {}
                                console.groupEnd();
                            }
                            applyQuillZoneStyles(id);
                            if (DEBUG_COPYFIT) {
                                console.group(`🧪 COPYFIT LOAD - after applyQuillZoneStyles (HTML): ${id}`);
                                try {
                                    const zc = zone.querySelector('.zone-content');
                                    console.log('zoneContent.client (px):', { w: zc ? zc.clientWidth : null, h: zc ? zc.clientHeight : null });
                                    console.log('quill.root (px):', { clientH: quillInstance.root ? quillInstance.root.clientHeight : null, scrollH: quillInstance.root ? quillInstance.root.scrollHeight : null });
                                    console.log('computed:', {
                                        editorFontSize: quillInstance.root ? getComputedStyle(quillInstance.root).fontSize : null,
                                        editorLineHeight: quillInstance.root ? getComputedStyle(quillInstance.root).lineHeight : null
                                    });
                                    console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                                } catch (e) {}
                                console.groupEnd();
                            }
                        } catch (e) {
                            console.warn('⚠️ BUGFIX - Échec restauration Quill via HTML:', id, e);
                        }
                    }, 0);
                }

                // BUGFIX : persister le contenu lors de la frappe (sinon aucun save après saisie)
                quillInstance.on('text-change', () => {
                    // Mettre à jour les données de la zone (objet qui sera sérialisé)
                    zonesData[id].quillDelta = quillInstance.getContents();
                    
                    // Recalculer le copyfit si activé (après que le DOM se soit mis à jour)
                    if (zonesData[id].copyfit) {
                        const zoneEl = document.getElementById(id);
                        if (zoneEl) {
                            setTimeout(() => {
                                applyCopyfitToQuillZone(zoneEl, quillInstance, zonesData[id].size || QUILL_DEFAULT_SIZE);
                            }, 10);
                        }
                    }
                    
                    // Debounce identique au système existant (textarea)
                    clearTimeout(contentSaveTimeout);
                    contentSaveTimeout = setTimeout(() => {
                        saveToLocalStorage();
                        saveState();
                    }, 500);
                });
                
                // Focus automatique uniquement en création (pas pendant le chargement/restauration)
                if (autoSelect && !zoneData.quillDelta && !zoneData.content) {
                    setTimeout(() => {
                        try { quillInstance.focus(); } catch (e) {}
                    }, 0);
                }
                
                // Phase 5 : configurer le drop zone pour les champs de fusion
                setupTextQuillDropZone(zone, id);
            }
            
            // Phase 4 : appliquer les styles depuis les données stockées.
            // Important : si on restaure du contenu (Delta/HTML), applyQuillZoneStyles est rappelé après setContents().
            if (!zoneData.quillDelta && !zoneData.content) {
                applyQuillZoneStyles(id);
            }
        }

        // Poignées (zones classiques uniquement)
        if (zoneType !== 'textQuill') {
            ['nw', 'ne', 'sw', 'se'].forEach(pos => {
                const handle = document.createElement('div');
                handle.classList.add('handle', pos);
                handle.dataset.pos = pos;
                zone.appendChild(handle);
            });
        }

        // Appliquer le z-index
        const zIndex = zoneData.zIndex || 1;
        zone.style.zIndex = zIndex;

        // Event: Sélection
        zone.addEventListener('mousedown', (e) => {
            if(e.target.classList.contains('handle')) return;
            selectZone(id, e);
        });

        a4Page.appendChild(zone);
        if (autoSelect) {
            selectZone(id);
        }
    }

    // --- COPIE/COLLER DE ZONES ---
    
    /**
     * Copie la zone textQuill sélectionnée dans le presse-papier interne.
     * Seules les zones de type 'textQuill' peuvent être copiées.
     * Le contenu Quill (Delta) est copié en profondeur pour préserver le formatage.
     * 
     * @returns {void}
     */
    function copySelectedZone() {
        // Vérifier qu'une seule zone est sélectionnée
        if (selectedZoneIds.length !== 1) {
            return;
        }
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        // Seules les zones textQuill peuvent être copiées
        if (!zoneData || zoneData.type !== 'textQuill') {
            return;
        }
        
        // Les zones système ne peuvent pas être copiées
        if (zoneData.systeme) {
            return;
        }
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // Récupérer l'instance Quill pour obtenir le Delta actuel
        const quillInstance = quillInstances.get(zoneId);
        const currentDelta = quillInstance ? quillInstance.getContents() : zoneData.quillDelta;
        
        // Copier toutes les propriétés de la zone textQuill
        copiedZoneData = {
            type: 'textQuill',
            content: zoneData.content || '',
            quillDelta: currentDelta ? JSON.parse(JSON.stringify(currentDelta)) : null,
            font: zoneData.font || QUILL_DEFAULT_FONT,
            size: zoneData.size || QUILL_DEFAULT_SIZE,
            color: zoneData.color || QUILL_DEFAULT_COLOR,
            align: zoneData.align || 'left',
            valign: zoneData.valign || 'top',
            bgColor: zoneData.bgColor || '#ffffff',
            isTransparent: zoneData.isTransparent !== undefined ? zoneData.isTransparent : true,
            locked: false, // Toujours réinitialiser à false pour la copie
            copyfit: zoneData.copyfit || false,
            lineHeight: zoneData.lineHeight !== undefined ? zoneData.lineHeight : QUILL_DEFAULT_LINE_HEIGHT,
            emptyLines: zoneData.emptyLines || 0,
            border: zoneData.border ? JSON.parse(JSON.stringify(zoneData.border)) : { width: 0, color: '#000000', style: 'solid' },
            // Géométrie : utiliser les dimensions actuelles du DOM
            w: zoneEl.offsetWidth,
            h: zoneEl.offsetHeight,
            x: zoneEl.offsetLeft,
            y: zoneEl.offsetTop
        };
    }
    
    /**
     * Colle la zone textQuill précédemment copiée.
     * Crée une nouvelle zone décalée de 20px vers le bas.
     * Le contenu Quill (Delta) est restauré automatiquement par createZoneDOM.
     * 
     * @returns {void}
     */
    function pasteZone() {
        // Vérifier qu'il y a des données copiées
        if (!copiedZoneData) {
            return;
        }
        
        // Vérifier que c'est bien une zone textQuill
        if (copiedZoneData.type !== 'textQuill') {
            return;
        }
        
        // Créer un nouvel ID pour la zone dupliquée
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter;
        const newId = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        
        // Calculer le z-index pour mettre la zone dupliquée au premier plan
        const newZIndex = getMaxZIndex() + 1;
        
        // Calculer la nouvelle position (20px en dessous)
        const pageHeight = getPageHeight();
        const offsetY = 20;
        const newX = copiedZoneData.x;
        const newY = Math.min(copiedZoneData.y + offsetY, pageHeight - copiedZoneData.h);
        
        // Créer les données de la nouvelle zone textQuill
        zonesData[newId] = {
            type: 'textQuill',
            content: copiedZoneData.content || '',
            quillDelta: copiedZoneData.quillDelta ? JSON.parse(JSON.stringify(copiedZoneData.quillDelta)) : null,
            font: copiedZoneData.font,
            size: copiedZoneData.size,
            color: copiedZoneData.color,
            align: copiedZoneData.align,
            valign: copiedZoneData.valign,
            bgColor: copiedZoneData.bgColor,
            isTransparent: copiedZoneData.isTransparent,
            locked: false,
            copyfit: copiedZoneData.copyfit,
            lineHeight: copiedZoneData.lineHeight,
            emptyLines: copiedZoneData.emptyLines || 0,
            border: copiedZoneData.border ? JSON.parse(JSON.stringify(copiedZoneData.border)) : { width: 0, color: '#000000', style: 'solid' },
            zIndex: newZIndex,
            // Position et taille
            x: newX,
            y: newY,
            w: copiedZoneData.w,
            h: copiedZoneData.h
        };
        
        // Créer la zone dans le DOM (createZoneDOM gère la restauration du Delta Quill)
        createZoneDOM(newId, zoneCounter, true);
        
        // Sauvegarder
        saveToLocalStorage();
        saveState();
    }

    // ─────────────────────────────── FIN SECTION 13 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 14 : AFFICHAGE DES ZONES (QR, Barcode, Image)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Fonctions de mise à jour de l'affichage visuel des zones.
     * Gestion du z-index et de l'arrangement des zones.
     * 
     * Fonctions d'arrangement (z-index) :
     *   - getMaxZIndex() : Z-index maximum des zones
     *   - bringToFront/Forward/Backward/ToBack() : Réorganiser les zones
     * 
     * Fonctions de sélection :
     *   - addToSelection(), removeFromSelection()
     *   - updateSelectionUI(), loadZoneDataToForm()
     * 
     * Fonctions d'affichage :
     *   - updateImageZoneDisplay() : Affichage zone image
     *   - updateBarcodeZoneDisplay() : Affichage zone code-barres
     *   - updateQrZoneDisplay() : Affichage zone QR
     *   - applyBorderToZone() : Application des bordures
     * 
     * Dépendances :
     *   - generateBarcodeImage() (Section 4)
     *   - BARCODE_BWIPJS_CONFIG (Section 3)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    /**
     * Récupère le z-index maximum parmi toutes les zones de la page courante.
     * Utilisé pour placer les nouvelles zones au premier plan (max + 1).
     * 
     * @returns {number} Z-index maximum (0 si aucune zone, permettant à la première zone d'avoir z-index = 1)
     * 
     * @example
     * const newZIndex = getMaxZIndex() + 1; // Place la nouvelle zone au premier plan
     * zonesData[newId] = { type: 'textQuill', zIndex: newZIndex };
     * 
     * @see findZoneByZIndex - Trouver une zone par son z-index
     */
    function getMaxZIndex() {
        const zonesData = getCurrentPageZones();
        let maxZ = 0; // Commence à 0 pour que la première zone ait z-index = 1
        for (const zoneData of Object.values(zonesData)) {
            const z = zoneData.zIndex || 1;
            if (z > maxZ) maxZ = z;
        }
        return maxZ;
    }

    /**
     * Trouve l'ID de la zone qui a un z-index spécifique
     * @param {number} targetZ - Le z-index recherché
     * @returns {string|null} - L'ID de la zone ou null si non trouvée
     */
    function findZoneByZIndex(targetZ) {
        const zonesData = getCurrentPageZones();
        for (const [id, data] of Object.entries(zonesData)) {
            if ((data.zIndex || 1) === targetZ) {
                return id;
            }
        }
        return null;
    }

    /**
     * Renormalise les z-index de toutes les zones pour qu'ils soient contigus (1, 2, 3...)
     * Préserve l'ordre relatif des zones.
     */
    function normalizeZIndexes() {
        const zonesData = getCurrentPageZones();
        const zoneIds = Object.keys(zonesData);
        
        if (zoneIds.length === 0) return;
        
        // Trier les zones par z-index croissant
        zoneIds.sort((a, b) => {
            const zA = zonesData[a].zIndex || 1;
            const zB = zonesData[b].zIndex || 1;
            return zA - zB;
        });
        
        // Réassigner les z-index de 1 à n
        zoneIds.forEach((id, index) => {
            const newZ = index + 1;
            zonesData[id].zIndex = newZ;
            
            // Mettre à jour le DOM
            const el = document.getElementById(id);
            if (el) el.style.zIndex = newZ;
        });
    }

    /**
     * Met la zone sélectionnée au premier plan (z-index max)
     * Les zones qui étaient au-dessus descendent de 1.
     */
    function bringToFront() {
        if (selectedZoneIds.length !== 1) return;
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData) return;
        
        const currentZ = zoneData.zIndex || 1;
        const maxZ = getMaxZIndex();
        
        // Si déjà au max, ne rien faire
        if (currentZ === maxZ) {
            return;
        }
        
        // Décaler toutes les zones qui sont au-dessus (z > currentZ) de -1
        for (const [id, data] of Object.entries(zonesData)) {
            const z = data.zIndex || 1;
            if (z > currentZ) {
                data.zIndex = z - 1;
                const el = document.getElementById(id);
                if (el) el.style.zIndex = data.zIndex;
            }
        }
        
        // Mettre la zone sélectionnée au max
        zoneData.zIndex = maxZ;
        const el = document.getElementById(zoneId);
        if (el) el.style.zIndex = maxZ;
        
        // Sauvegardes
        saveToLocalStorage();
        saveState();
    }

    /**
     * Avance la zone sélectionnée d'un niveau (échange avec celle au-dessus)
     */
    function bringForward() {
        if (selectedZoneIds.length !== 1) return;
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData) return;
        
        const currentZ = zoneData.zIndex || 1;
        const maxZ = getMaxZIndex();
        
        // Si déjà au max, ne rien faire
        if (currentZ >= maxZ) {
            return;
        }
        
        // Trouver la zone qui est juste au-dessus (z = currentZ + 1)
        const aboveZoneId = findZoneByZIndex(currentZ + 1);
        
        if (aboveZoneId) {
            // Échanger les z-index
            zonesData[aboveZoneId].zIndex = currentZ;
            zoneData.zIndex = currentZ + 1;
            
            // Mettre à jour le DOM
            const aboveEl = document.getElementById(aboveZoneId);
            if (aboveEl) aboveEl.style.zIndex = currentZ;
            
            const el = document.getElementById(zoneId);
            if (el) el.style.zIndex = currentZ + 1;
        }
        
        // Sauvegardes
        saveToLocalStorage();
        saveState();
    }

    /**
     * Recule la zone sélectionnée d'un niveau (échange avec celle en-dessous)
     */
    function sendBackward() {
        if (selectedZoneIds.length !== 1) return;
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData) return;
        
        const currentZ = zoneData.zIndex || 1;
        
        // Si déjà à 1, ne rien faire
        if (currentZ <= 1) {
            return;
        }
        
        // Trouver la zone qui est juste en-dessous (z = currentZ - 1)
        const belowZoneId = findZoneByZIndex(currentZ - 1);
        
        if (belowZoneId) {
            // Échanger les z-index
            zonesData[belowZoneId].zIndex = currentZ;
            zoneData.zIndex = currentZ - 1;
            
            // Mettre à jour le DOM
            const belowEl = document.getElementById(belowZoneId);
            if (belowEl) belowEl.style.zIndex = currentZ;
            
            const el = document.getElementById(zoneId);
            if (el) el.style.zIndex = currentZ - 1;
        }
        
        // Sauvegardes
        saveToLocalStorage();
        saveState();
    }

    /**
     * Met la zone sélectionnée en arrière-plan (z-index = 1)
     * Les zones qui étaient en-dessous montent de 1.
     */
    function sendToBack() {
        if (selectedZoneIds.length !== 1) return;
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData) return;
        
        const currentZ = zoneData.zIndex || 1;
        
        // Si déjà à 1, ne rien faire
        if (currentZ === 1) {
            return;
        }
        
        // Monter toutes les zones qui sont en-dessous (z < currentZ) de +1
        for (const [id, data] of Object.entries(zonesData)) {
            const z = data.zIndex || 1;
            if (z < currentZ) {
                data.zIndex = z + 1;
                const el = document.getElementById(id);
                if (el) el.style.zIndex = data.zIndex;
            }
        }
        
        // Mettre la zone sélectionnée à 1
        zoneData.zIndex = 1;
        const el = document.getElementById(zoneId);
        if (el) el.style.zIndex = 1;
        
        // Sauvegardes
        saveToLocalStorage();
        saveState();
    }

    /**
     * Met à jour l'état des boutons d'arrangement selon la sélection
     */
    function updateArrangementButtons() {
        const enabled = selectedZoneIds.length === 1;
        
        if (btnToFront) btnToFront.disabled = !enabled;
        if (btnForward) btnForward.disabled = !enabled;
        if (btnBackward) btnBackward.disabled = !enabled;
        if (btnToBack) btnToBack.disabled = !enabled;
    }

    // --- 2. SÉLECTION MULTIPLE ---
    
    // Ajouter une zone à la sélection
    function addToSelection(id) {
        // Bloquer en mode Aperçu
        if (previewState && previewState.active) return;
        
        if (!selectedZoneIds.includes(id)) {
            selectedZoneIds.push(id);
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                zoneEl.classList.add('selected');
            }
            updateSelectionUI();
            updateZonePageUI();
        }
    }

    // Retirer une zone de la sélection
    function removeFromSelection(id) {
        const index = selectedZoneIds.indexOf(id);
        if (index > -1) {
            selectedZoneIds.splice(index, 1);
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                zoneEl.classList.remove('selected');
            }
            updateSelectionUI();
            updateZonePageUI();
        }
    }

    // Mettre à jour l'affichage des poignées selon la sélection
    function updateHandlesVisibility() {
        const count = selectedZoneIds.length;
        const zonesData = getCurrentPageZones();
        
        // D'abord, masquer les poignées de TOUTES les zones de la page
        const allZones = document.querySelectorAll('.zone');
        allZones.forEach(zoneEl => {
            const handles = zoneEl.querySelectorAll('.handle');
            handles.forEach(h => h.style.display = 'none');
            const resizeHandles = zoneEl.querySelectorAll('.resize-handle');
            resizeHandles.forEach(h => h.style.display = 'none');
        });
        
        // Ensuite, afficher les poignées uniquement pour les zones sélectionnées (si sélection unique et non verrouillée)
        if (count === 1) {
            const zoneId = selectedZoneIds[0];
            const zoneEl = document.getElementById(zoneId);
            if (zoneEl) {
                const zoneData = zonesData[zoneId];
                const isLocked = zoneData && zoneData.locked;
                
                if (!isLocked) {
                    // Sélection unique et non verrouillée : afficher les poignées selon le type
                    if (zoneData && zoneData.type === 'textQuill') {
                        const resizeHandles = zoneEl.querySelectorAll('.resize-handle');
                        resizeHandles.forEach(h => h.style.display = 'block');
                    } else {
                        const handles = zoneEl.querySelectorAll('.handle');
                        handles.forEach(h => h.style.display = 'block');
                    }
                }
            }
        }
    }

    // Mettre à jour l'interface selon la sélection
    function updateSelectionUI() {
        const count = selectedZoneIds.length;
        
        if (count === 0) {
            // Aucune sélection
            btnDelete.disabled = true;
            // coordsPanel supprimé - ne rien faire
        } else if (count === 1) {
            // Sélection unique : afficher les propriétés de la zone
            const id = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[id];
            const isSysteme = zoneData && zoneData.systeme;
            
            // Griser le bouton Supprimer si zone système
            btnDelete.disabled = isSysteme;
            // coordsPanel supprimé - ne rien faire
            // loadZoneDataToForm supprimé - toolbar Quill gère l'affichage
        } else {
            // Sélection multiple : afficher le nombre de zones
            btnDelete.disabled = false;
            // coordsPanel supprimé - ne rien faire
        }

        // Toolbars conditionnelles : affichage selon le type de zone
        updateToolbarVisibility();

        // Phase 5 : éviter une mini-toolbar "orpheline" lors d'un changement de sélection
        // (le show/hide fin est géré par selection-change Quill)
        hideMiniToolbar();
        
        // Mettre à jour l'affichage des poignées
        updateHandlesVisibility();
        
        // Afficher/masquer les sections d'alignement et taille
        updateSidebarSectionsVisibility();
        
        // Mettre à jour les boutons d'arrangement (z-index)
        updateArrangementButtons();
        
        // Mettre à jour le bouton Ajuster au contenu
        updateSnapToContentButton();
    }

    // ─────────────────────────────── TOOLBAR QUILL (PHASE 3) ──────────────────────

    /** @type {boolean} True si la toolbar Quill est visible */
    let isQuillToolbarVisible = false;
    
    /** @type {boolean} True si on est en train de déplacer la toolbar Quill */
    let isQuillToolbarDragging = false;
    
    /** @type {{x: number, y: number}} Offset souris→toolbar au démarrage du drag */
    let quillToolbarDragOffset = { x: 0, y: 0 };
    
    /** @type {{x: number, y: number}|null} Dernière position connue de la toolbar */
    let quillToolbarLastPos = null;

    /**
     * Calcule une position initiale (visible) pour la toolbar Quill.
     * Priorité : dernière position connue > coin haut-droit du workspace (avec marge).
     *
     * @returns {{x: number, y: number}} Position (px) dans le viewport
     */
    function getInitialQuillToolbarPosition() {
        if (quillToolbarLastPos) return quillToolbarLastPos;
        
        const margin = 16;
        const w = quillToolbar ? quillToolbar.offsetWidth || 280 : 280;
        const h = quillToolbar ? quillToolbar.offsetHeight || 200 : 200;
        
        // Essayer de se caler sur le workspace (coin haut-droit)
        if (workspace) {
            const rect = workspace.getBoundingClientRect();
            const x = Math.min(window.innerWidth - w - margin, Math.max(margin, rect.right - w - margin));
            const y = Math.min(window.innerHeight - h - margin, Math.max(margin, rect.top + margin));
            return { x, y };
        }
        
        // Fallback viewport
        return { x: window.innerWidth - w - margin, y: margin };
    }

    /**
     * Affiche la toolbar Quill.
     *
     * @returns {void}
     */
    function showQuillToolbar() {
        console.log('🔧 PHASE 3 - showQuillToolbar()');
        
        if (!quillToolbar) return;
        
        // Si la toolbar est déjà visible, on se contente de resynchroniser (Phase 4)
        if (isQuillToolbarVisible) {
            if (selectedZoneIds.length === 1) {
                syncQuillToolbarWithZone(selectedZoneIds[0]);
            }
            return;
        }
        
        quillToolbar.style.display = 'flex';
        isQuillToolbarVisible = true;
        
        // Synchroniser la toolbar Data (champs de fusion)
        updateToolbarDataVisibility();
        
        // Positionner la toolbar de façon visible
        const pos = getInitialQuillToolbarPosition();
        quillToolbar.style.left = `${pos.x}px`;
        quillToolbar.style.top = `${pos.y}px`;
        quillToolbar.style.right = 'auto';
        quillToolbar.style.bottom = 'auto';
        
        // Phase 4 : synchroniser immédiatement avec la zone sélectionnée
        if (selectedZoneIds.length === 1) {
            const zoneId = selectedZoneIds[0];
            syncQuillToolbarWithZone(zoneId);
        }
    }

    /**
     * Masque la toolbar Quill.
     *
     * @returns {void}
     */
    function hideQuillToolbar() {
        console.log('🔧 PHASE 3 - hideQuillToolbar()');
        
        if (!quillToolbar) return;
        if (!isQuillToolbarVisible && quillToolbar.style.display === 'none') return;
        
        quillToolbar.style.display = 'none';
        isQuillToolbarVisible = false;
        
        // Masquer aussi la toolbar Data (champs de fusion)
        if (toolbarData) toolbarData.style.display = 'none';
    }

    /**
     * Toggle l'état collapsed d'une section de la toolbar.
     *
     * @param {HTMLElement} sectionHeader - Le header de section cliqué
     * @returns {void}
     */
    function toggleToolbarSection(sectionHeader) {
        const section = sectionHeader.closest('.toolbar-section');
        if (!section) return;
        
        section.classList.toggle('collapsed');
        const collapsed = section.classList.contains('collapsed');
        
        console.log('🔧 PHASE 3 - toggleToolbarSection:', sectionHeader.textContent, '→', collapsed ? 'COLLAPSED' : 'EXPANDED');
    }

    /**
     * Met à jour la visibilité des options de bordure dans la toolbar Quill.
     * Règle : afficher couleur/style uniquement si width > 0.
     *
     * @param {number} width - Épaisseur de bordure en pixels
     * @returns {void}
     */
    function updateQuillBorderOptionsVisibility(width) {
        const show = (parseFloat(width) || 0) > 0;
        if (quillBorderColorRow) quillBorderColorRow.style.display = show ? '' : 'none';
        if (quillBorderStyleRow) quillBorderStyleRow.style.display = show ? '' : 'none';
    }

    /**
     * Met à jour les champs de géométrie (mm) dans la toolbar Quill.
     * Utilise les valeurs mm stockées dans zoneData si disponibles,
     * sinon recalcule depuis le DOM (fallback pour compatibilité).
     *
     * @param {string} zoneId - ID de la zone (ex: "zone-3")
     * @returns {void}
     */
    function updateQuillToolbarGeometryFields(zoneId) {
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // Lire directement depuis le DOM pour refléter les changements en temps réel
        // (pendant le drag/resize, les valeurs zoneData.xMm ne sont pas encore mises à jour)
        const xMm = pxToMm(parseFloat(zoneEl.style.left) || 0);
        const yMm = pxToMm(parseFloat(zoneEl.style.top) || 0);
        const wMm = pxToMm(zoneEl.offsetWidth);
        const hMm = pxToMm(zoneEl.offsetHeight);
        
        if (quillValX) quillValX.value = xMm.toFixed(1).replace('.', ',');
        if (quillValY) quillValY.value = yMm.toFixed(1).replace('.', ',');
        if (quillValW) quillValW.value = wMm.toFixed(1).replace('.', ',');
        if (quillValH) quillValH.value = hMm.toFixed(1).replace('.', ',');
    }

    /**
     * Synchronise la toolbar Quill avec les propriétés d'une zone textQuill sélectionnée.
     *
     * @param {string} zoneId - ID de la zone
     * @returns {void}
     */
    function syncQuillToolbarWithZone(zoneId) {
        console.log('🔧 PHASE 4 - syncQuillToolbarWithZone:', zoneId);
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData || zoneData.type !== 'textQuill') return;
        
        // Zone - Checkbox POC
        setCheckboxPocState('quill-chk-locked-wrapper', !!zoneData.locked);
        
        // Page (Recto/Verso)
        if (quillInputPage) {
            quillInputPage.value = String(documentState.currentPageIndex);
        }
        
        // Typographie
        if (quillInputFont) quillInputFont.value = zoneData.font || QUILL_DEFAULT_FONT;
        
        // Taille - Spinner POC
        setSpinnerPocValue('quill-input-size', zoneData.size || QUILL_DEFAULT_SIZE, 1);
        
        // Couleur texte
        const textColor = zoneData.color || QUILL_DEFAULT_COLOR;
        if (quillInputColor) quillInputColor.value = textColor;
        updateColorSwatchPoc('quill-color-swatch', textColor);
        // Synchroniser les champs CMJN couleur texte (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('quill-color', textColor, zoneData.colorCmyk);
        
        // Copyfit - Checkbox POC
        setCheckboxPocState('quill-chk-copyfit-wrapper', !!zoneData.copyfit);
        
        // Alignements - Toggle-groups POC
        setToggleGroupPocValue('quill-align-h-group', zoneData.align || 'left');
        setToggleGroupPocValue('quill-align-v-group', zoneData.valign || 'top');
        
        // Interligne - Spinner POC
        setSpinnerPocValue('quill-input-line-height', zoneData.lineHeight || QUILL_DEFAULT_LINE_HEIGHT, 0.1);
        
        // Lignes vides (migration : valeur 2 → 1 si anciens documents)
        if (quillInputEmptyLines) {
            let emptyLinesVal = zoneData.emptyLines || 0;
            if (emptyLinesVal === 2) emptyLinesVal = 1;
            quillInputEmptyLines.value = String(emptyLinesVal);
        }
        
        // Fond - Checkbox POC
        const isTransparent = zoneData.isTransparent !== undefined ? !!zoneData.isTransparent : true;
        setCheckboxPocState('quill-chk-transparent-wrapper', isTransparent);
        
        // Couleur fond
        const bgColor = zoneData.bgColor || '#ffffff';
        if (quillInputBgColor) quillInputBgColor.value = bgColor;
        updateColorSwatchPoc('quill-bg-color-swatch', bgColor);
        // Synchroniser les champs CMJN couleur fond (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('quill-bg', bgColor, zoneData.bgColorCmyk);
        if (quillBgColorRow) quillBgColorRow.style.display = isTransparent ? 'none' : '';

        if (DEBUG_PHASE7_BG) {
            console.log('🔧 PHASE 7 BG - Toolbar sync fond:', zoneId, {
                isTransparent: zoneData.isTransparent,
                bgColor: zoneData.bgColor,
                uiTransparentChecked: isTransparent,
                uiBgColor: quillInputBgColor ? quillInputBgColor.value : null,
                uiRowDisplay: quillBgColorRow ? quillBgColorRow.style.display : null
            });
        }
        
        // Bordure - Spinner POC + couleur
        const border = zoneData.border || { width: 0, color: '#000000', style: 'solid' };
        setSpinnerPocValue('quill-input-border-width', border.width || 0, 1);
        if (quillInputBorderColor) quillInputBorderColor.value = border.color || '#000000';
        updateColorSwatchPoc('quill-border-color-swatch', border.color || '#000000');
        // Synchroniser les champs CMJN couleur bordure (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('quill-border', border.color || '#000000', border.colorCmyk);
        if (quillInputBorderStyle) quillInputBorderStyle.value = border.style || 'solid';
        updateQuillBorderOptionsVisibility(border.width || 0);
        
        // Géométrie (mm)
        updateQuillToolbarGeometryFields(zoneId);
    }

    /**
     * Applique les styles d'une zone textQuill sur le DOM et l'instance Quill.
     *
     * @param {string} zoneId - ID de la zone
     * @returns {void}
     */
    function applyQuillZoneStyles(zoneId) {
        console.log('🔧 PHASE 4 - applyQuillZoneStyles:', zoneId);
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        const zoneEl = document.getElementById(zoneId);
        if (!zoneData || zoneData.type !== 'textQuill' || !zoneEl) return;
        
        // Verrouillage
        if (zoneData.locked) zoneEl.classList.add('locked');
        else zoneEl.classList.remove('locked');
        
        // Fond
        if (zoneData.isTransparent) zoneEl.style.backgroundColor = 'transparent';
        else zoneEl.style.backgroundColor = zoneData.bgColor || '#ffffff';

        if (DEBUG_PHASE7_BG) {
            console.log('🔧 PHASE 7 BG - apply fond:', zoneId, {
                isTransparent: zoneData.isTransparent,
                bgColor: zoneData.bgColor,
                applied: zoneEl.style.backgroundColor
            });
        }
        
        // Bordure
        applyBorderToZone(zoneEl, zoneData.border);
        
        // Typographie : appliquer sur zoneEl (héritage CSS vers Quill)
        // Cela garantit que le style est visible même si quillInstance.root n'est pas encore prêt.
        const selectedFontName = zoneData.font || QUILL_DEFAULT_FONT;
        const police = (Array.isArray(policesDisponibles) && policesDisponibles.length > 0)
            ? policesDisponibles.find(p => p && p.nom === selectedFontName)
            : DEFAULT_FONTS.find(p => p && p.nom === selectedFontName);
        const baseWeight = (police && typeof police.weight === 'number') ? police.weight : 400;
        const baseStyle = (police && police.style === 'italic') ? 'italic' : 'normal';
        
        zoneEl.style.fontFamily = `${selectedFontName}, sans-serif`;
        zoneEl.style.fontWeight = String(baseWeight);
        zoneEl.style.fontStyle = baseStyle;
        zoneEl.style.color = zoneData.color || QUILL_DEFAULT_COLOR;
        zoneEl.style.fontSize = `${zoneData.size || QUILL_DEFAULT_SIZE}pt`;
        
        // Alignement vertical (flex sur .zone-content)
        const contentEl = zoneEl.querySelector('.zone-content');
        if (contentEl) {
            // DEBUG : comprendre pourquoi l'alignement vertical semble rester en haut
            try {
                const quillEditorEl = zoneEl.querySelector('.quill-editor');
                const qlContainerEl = zoneEl.querySelector('.ql-container');
                const qlEditorEl = zoneEl.querySelector('.ql-editor');
                const csBefore = getComputedStyle(contentEl);
                console.log('🔧 DEBUG VALIGN - applyQuillZoneStyles BEFORE:', zoneId, {
                    dataValign: zoneData.valign,
                    classes: Array.from(contentEl.classList),
                    inlineJustifyContent: contentEl.style.justifyContent || '(empty)',
                    computedJustifyContent: csBefore.justifyContent,
                    computedDisplay: csBefore.display,
                    contentClientH: contentEl.clientHeight,
                    contentScrollH: contentEl.scrollHeight,
                    quillEditorClientH: quillEditorEl ? quillEditorEl.clientHeight : null,
                    qlContainerClientH: qlContainerEl ? qlContainerEl.clientHeight : null,
                    qlEditorClientH: qlEditorEl ? qlEditorEl.clientHeight : null,
                    qlEditorScrollH: qlEditorEl ? qlEditorEl.scrollHeight : null,
                    qlContainerInlineH: qlContainerEl ? (qlContainerEl.style.height || '(empty)') : null,
                    qlEditorInlineH: qlEditorEl ? (qlEditorEl.style.height || '(empty)') : null,
                    qlContainerComputedH: qlContainerEl ? getComputedStyle(qlContainerEl).height : null,
                    qlEditorComputedH: qlEditorEl ? getComputedStyle(qlEditorEl).height : null
                });
            } catch (e) {}

            const valign =
                (zoneData.valign === 'middle' || zoneData.valign === 'bottom' || zoneData.valign === 'top')
                    ? zoneData.valign
                    : 'top';

            // IMPORTANT : on applique le valign via classes CSS (comme dans le POC)
            // et on garde aussi l'inline pour compatibilité avec du code existant (copyfit notamment).
            contentEl.classList.remove('valign-top', 'valign-middle', 'valign-bottom');
            contentEl.classList.add(`valign-${valign}`);
            contentEl.style.justifyContent = mapValignToFlex(valign);

            // DEBUG : état après application
            try {
                const quillEditorEl = zoneEl.querySelector('.quill-editor');
                const qlContainerEl = zoneEl.querySelector('.ql-container');
                const qlEditorEl = zoneEl.querySelector('.ql-editor');
                const csAfter = getComputedStyle(contentEl);
                console.log('🔧 DEBUG VALIGN - applyQuillZoneStyles AFTER:', zoneId, {
                    appliedValign: valign,
                    classes: Array.from(contentEl.classList),
                    inlineJustifyContent: contentEl.style.justifyContent || '(empty)',
                    computedJustifyContent: csAfter.justifyContent,
                    computedDisplay: csAfter.display,
                    contentClientH: contentEl.clientHeight,
                    contentScrollH: contentEl.scrollHeight,
                    quillEditorClientH: quillEditorEl ? quillEditorEl.clientHeight : null,
                    qlContainerClientH: qlContainerEl ? qlContainerEl.clientHeight : null,
                    qlEditorClientH: qlEditorEl ? qlEditorEl.clientHeight : null,
                    qlEditorScrollH: qlEditorEl ? qlEditorEl.scrollHeight : null,
                    qlContainerInlineH: qlContainerEl ? (qlContainerEl.style.height || '(empty)') : null,
                    qlEditorInlineH: qlEditorEl ? (qlEditorEl.style.height || '(empty)') : null,
                    qlContainerComputedH: qlContainerEl ? getComputedStyle(qlContainerEl).height : null,
                    qlEditorComputedH: qlEditorEl ? getComputedStyle(qlEditorEl).height : null
                });
            } catch (e) {}
        }
        
        // Styles Quill (root) - réutilise les variables selectedFontName, baseWeight, baseStyle définies plus haut
        const quillInstance = quillInstances.get(zoneId);
        if (quillInstance && quillInstance.root) {
            quillInstance.root.style.fontFamily = `${selectedFontName}, sans-serif`;
            quillInstance.root.style.fontWeight = String(baseWeight);
            quillInstance.root.style.fontStyle = baseStyle;
            quillInstance.root.style.color = zoneData.color || QUILL_DEFAULT_COLOR;
            quillInstance.root.style.lineHeight = String(zoneData.lineHeight || QUILL_DEFAULT_LINE_HEIGHT);
            quillInstance.root.style.textAlign = zoneData.align || 'left';
        }
        
        // Copyfit : ajuste la taille de police pour que le contenu tienne dans la zone
        if (zoneData.copyfit) {
            const maxSize = zoneData.size || QUILL_DEFAULT_SIZE;
            applyCopyfitToQuillZone(zoneEl, quillInstance, maxSize);
            // Installer le ResizeObserver pour recalculer automatiquement si le contenu change
            // (ex: chargement de polices après le premier rendu)
            installCopyfitResizeObserver(zoneId);
        } else {
            const size = zoneData.size || QUILL_DEFAULT_SIZE;
            if (quillInstance && quillInstance.root) {
                quillInstance.root.style.fontSize = `${size}pt`;
            }
            // Supprimer l'observer si copyfit désactivé
            removeCopyfitResizeObserver(zoneId);
        }
        
        // UI poignées
        updateHandlesVisibility();
    }

    /**
     * Initialise les écouteurs des contrôles de la toolbar Quill.
     * Applique immédiatement les changements à la zone textQuill sélectionnée.
     *
     * @returns {void}
     */
    function initQuillToolbarEvents() {
        if (!quillToolbar) return;
        
        /**
         * Retourne l'ID de la zone textQuill sélectionnée (si sélection unique).
         * @returns {string|null}
         */
        const getSelectedTextQuillZoneId = () => {
            if (selectedZoneIds.length !== 1) return null;
            const zoneId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            if (!zonesData[zoneId] || zonesData[zoneId].type !== 'textQuill') return null;
            return zoneId;
        };
        
        /**
         * Applique une mise à jour de données + styles pour la zone sélectionnée.
         * @param {(zoneData: any, zoneEl: HTMLElement, zoneId: string) => void} mutator - Mutation sur les données de zone
         * @returns {void}
         */
        const updateSelectedZone = (mutator) => {
            const zoneId = getSelectedTextQuillZoneId();
            if (!zoneId) return;
            
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            const zoneEl = document.getElementById(zoneId);
            if (!zoneEl) return;
            
            mutator(zoneData, zoneEl, zoneId);
            applyQuillZoneStyles(zoneId);
            updateQuillToolbarGeometryFields(zoneId);
            saveToLocalStorage();
            saveState();
        };
        
        // ═══════════════════════════════════════════════════════════════
        // INITIALISATION COMPOSANTS POC
        // ═══════════════════════════════════════════════════════════════
        
        // Zone : verrouiller - Checkbox POC
        initCheckboxPoc('quill-chk-locked-wrapper', (checked) => {
            updateSelectedZone((zoneData) => {
                zoneData.locked = checked;
                console.log('🔧 PHASE 4 - locked:', zoneData.locked);
            });
        });
        
        // Page (Recto/Verso) - déplacer la zone vers une autre page
        if (quillInputPage) {
            quillInputPage.addEventListener('change', () => {
                const zoneId = getSelectedTextQuillZoneId();
                if (!zoneId) return;
                
                const targetPageIndex = parseInt(quillInputPage.value, 10);
                const success = moveZoneToPage(zoneId, targetPageIndex);
                
                if (success) {
                    // Basculer sur la page de destination et sélectionner la zone
                    switchPage(targetPageIndex);
                    // Attendre que les zones soient recréées puis sélectionner
                    setTimeout(() => {
                        selectZone(zoneId);
                    }, 100);
                    console.log('🔧 PHASE 4 - Zone textQuill déplacée vers page:', targetPageIndex);
                }
            });
        }
        
        // Typographie : police (select natif POC)
        if (quillInputFont) {
            quillInputFont.addEventListener('change', () => {
                updateSelectedZone((zoneData) => {
                    zoneData.font = quillInputFont.value;
                    console.log('🔧 PHASE 4 - font:', zoneData.font);
                });
            });
        }
        
        // Typographie : taille - Spinner POC
        initSpinnerPoc('quill-input-size', 6, 72, 1, (value) => {
            updateSelectedZone((zoneData) => {
                zoneData.size = value;
                console.log('🔧 PHASE 4 - size:', zoneData.size);
            });
        });
        
        // Typographie : Ajustable (copyfit) - Checkbox POC
        initCheckboxPoc('quill-chk-copyfit-wrapper', (checked) => {
            updateSelectedZone((zoneData) => {
                zoneData.copyfit = checked;
                console.log('🔧 PHASE 4 - copyfit:', zoneData.copyfit);
            });
        });
        
        // Typographie : couleur (RGB → CMJN sync)
        if (quillInputColor) {
            quillInputColor.addEventListener('input', () => {
                updateSelectedZone((zoneData) => {
                    zoneData.color = quillInputColor.value;
                    zoneData.colorCmyk = null;  // Effacer CMJN car saisie RGB
                    updateColorSwatchPoc('quill-color-swatch', zoneData.color);
                    updateCmjnFieldsFromHex('quill-color', zoneData.color);
                    console.log('🔧 PHASE 4 - color:', zoneData.color);
                });
            });
        }

        // Typographie : couleur CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('quill-color', (newHex, cmykValues) => {
            updateSelectedZone((zoneData) => {
                zoneData.color = newHex;
                zoneData.colorCmyk = cmykValues;  // Stocker CMJN natif
                if (quillInputColor) quillInputColor.value = newHex;
                updateColorSwatchPoc('quill-color-swatch', newHex);
                console.log('🔧 PHASE 4 - color (CMJN):', newHex, cmykValues);
            });
        });
        
        // Alignement horizontal - Toggle-group POC
        initToggleGroupPoc('quill-align-h-group', (value) => {
            updateSelectedZone((zoneData) => {
                zoneData.align = value;
                console.log('🔧 PHASE 4 - align:', zoneData.align);
            });
        });
        
        // Alignement vertical - Toggle-group POC
        initToggleGroupPoc('quill-align-v-group', (value) => {
            updateSelectedZone((zoneData) => {
                zoneData.valign = value;
                console.log('🔧 PHASE 4 - valign:', zoneData.valign);
            });
        });
        
        // Interligne - Spinner POC
        initSpinnerPoc('quill-input-line-height', 1, 3, 0.1, (value) => {
            updateSelectedZone((zoneData) => {
                zoneData.lineHeight = value;
                console.log('🔧 PHASE 4 - lineHeight:', zoneData.lineHeight);
            });
        });
        
        // Lignes vides (select natif POC)
        if (quillInputEmptyLines) {
            quillInputEmptyLines.addEventListener('change', () => {
                updateSelectedZone((zoneData) => {
                    zoneData.emptyLines = parseInt(quillInputEmptyLines.value, 10) || 0;
                    console.log('🔧 PHASE 4 - emptyLines:', zoneData.emptyLines);
                });
            });
        }
        
        // Fond : transparent - Checkbox POC
        initCheckboxPoc('quill-chk-transparent-wrapper', (checked) => {
            updateSelectedZone((zoneData) => {
                zoneData.isTransparent = checked;
                if (quillBgColorRow) quillBgColorRow.style.display = checked ? 'none' : '';
                console.log('🔧 PHASE 4 - isTransparent:', zoneData.isTransparent);
            });
        });
        
        // Fond : couleur (RGB → CMJN sync)
        if (quillInputBgColor) {
            quillInputBgColor.addEventListener('input', () => {
                updateSelectedZone((zoneData) => {
                    zoneData.bgColor = quillInputBgColor.value;
                    zoneData.bgColorCmyk = null;  // Effacer CMJN car saisie RGB
                    updateColorSwatchPoc('quill-bg-color-swatch', zoneData.bgColor);
                    updateCmjnFieldsFromHex('quill-bg', zoneData.bgColor);
                    console.log('🔧 PHASE 4 - bgColor:', zoneData.bgColor);
                });
            });
        }

        // Fond : couleur CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('quill-bg', (newHex, cmykValues) => {
            updateSelectedZone((zoneData) => {
                zoneData.bgColor = newHex;
                zoneData.bgColorCmyk = cmykValues;  // Stocker CMJN natif
                if (quillInputBgColor) quillInputBgColor.value = newHex;
                updateColorSwatchPoc('quill-bg-color-swatch', newHex);
                console.log('🔧 PHASE 4 - bgColor (CMJN):', newHex, cmykValues);
            });
        });
        
        // Bordure : épaisseur - Spinner POC
        initSpinnerPoc('quill-input-border-width', 0, 10, 1, (value) => {
            updateSelectedZone((zoneData) => {
                zoneData.border = zoneData.border || { width: 0, color: '#000000', style: 'solid' };
                zoneData.border.width = value;
                updateQuillBorderOptionsVisibility(value);
                console.log('🔧 PHASE 4 - border.width:', zoneData.border.width);
            });
        });
        
        // Bordure : couleur (RGB → CMJN sync)
        if (quillInputBorderColor) {
            quillInputBorderColor.addEventListener('input', () => {
                updateSelectedZone((zoneData) => {
                    zoneData.border = zoneData.border || { width: 0, color: '#000000', style: 'solid' };
                    zoneData.border.color = quillInputBorderColor.value;
                    zoneData.border.colorCmyk = null;  // Effacer CMJN car saisie RGB
                    updateColorSwatchPoc('quill-border-color-swatch', zoneData.border.color);
                    updateCmjnFieldsFromHex('quill-border', zoneData.border.color);
                    console.log('🔧 PHASE 4 - border.color:', zoneData.border.color);
                });
            });
        }

        // Bordure : couleur CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('quill-border', (newHex, cmykValues) => {
            updateSelectedZone((zoneData) => {
                zoneData.border = zoneData.border || { width: 0, color: '#000000', style: 'solid' };
                zoneData.border.color = newHex;
                zoneData.border.colorCmyk = cmykValues;  // Stocker CMJN natif
                if (quillInputBorderColor) quillInputBorderColor.value = newHex;
                updateColorSwatchPoc('quill-border-color-swatch', newHex);
                console.log('🔧 PHASE 4 - border.color (CMJN):', newHex, cmykValues);
            });
        });
        
        // Bordure : style (select natif POC)
        if (quillInputBorderStyle) {
            quillInputBorderStyle.addEventListener('change', () => {
                updateSelectedZone((zoneData) => {
                    zoneData.border = zoneData.border || { width: 0, color: '#000000', style: 'solid' };
                    zoneData.border.style = quillInputBorderStyle.value;
                    console.log('🔧 PHASE 4 - border.style:', zoneData.border.style);
                });
            });
        }
        
        // Géométrie (mm) : X/Y/W/H
        const bindGeom = (inputEl, property) => {
            if (!inputEl) return;
            inputEl.addEventListener('change', () => {
                const zoneId = getSelectedTextQuillZoneId();
                if (!zoneId) return;
                
                const valueMm = parseFloat(inputEl.value);
                if (isNaN(valueMm)) return;
                
                // Réutiliser le moteur existant (selection unique déjà vraie)
                applyGeometryChange(property, valueMm);
                
                // Re-synchroniser les champs (valeurs contraintes + arrondies)
                syncQuillToolbarWithZone(zoneId);
                
                console.log(`🔧 PHASE 4 - geometry.${property}:`, valueMm);
            });
        };
        
        bindGeom(quillValX, 'x');
        bindGeom(quillValY, 'y');
        bindGeom(quillValW, 'w');
        bindGeom(quillValH, 'h');
    }

    /**
     * Met à jour la visibilité de la toolbar Quill en fonction de la sélection actuelle.
     * Règle : visible uniquement si une zone sélectionnée (unique) est de type "textQuill".
     *
     * Ajoute le log DEBUG demandé.
     *
     * @returns {void}
     */
    function updateQuillToolbarVisibilityFromSelection() {
        const selectedZone = (selectedZoneIds.length === 1) ? document.getElementById(selectedZoneIds[0]) : null;
        const type = selectedZone ? (selectedZone.dataset ? selectedZone.dataset.type : undefined) : null;
        const shouldShow = selectedZone && type === 'textQuill';
        
        console.log(
            '🔧 DEBUG SELECTION - zone:',
            selectedZone ? (type || 'inconnu') : 'aucune',
            '→ toolbar:',
            shouldShow ? 'SHOW' : 'HIDE'
        );
        
        if (shouldShow) {
            showQuillToolbar();
        } else {
            hideQuillToolbar();
        }
    }

    // ─────────────────────────────── TOOLBAR IMAGE ──────────────────────────────────

    /** @type {boolean} True si la toolbar Image est visible */
    let isImageToolbarVisible = false;
    
    /** @type {boolean} True si on est en train de déplacer la toolbar Image */
    let isImageToolbarDragging = false;
    
    /** @type {{x: number, y: number}} Offset souris→toolbar au démarrage du drag */
    let imageToolbarDragOffset = { x: 0, y: 0 };
    
    /** @type {{x: number, y: number}|null} Dernière position connue de la toolbar Image */
    let imageToolbarLastPos = null;
    
    /** @type {boolean} True si les composants POC de la toolbar Image ont été initialisés */
    let imageToolbarInitialized = false;

    // ═══════════════════════════════════════════════════════════════════════════════
    // Toolbar Barcode - Variables d'état
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /** @type {boolean} True si la toolbar Barcode est visible */
    let isBarcodeToolbarVisible = false;
    
    /** @type {boolean} True si on est en train de déplacer la toolbar Barcode */
    let isBarcodeToolbarDragging = false;
    
    /** @type {{x: number, y: number}} Offset souris→toolbar au démarrage du drag */
    let barcodeToolbarDragOffset = { x: 0, y: 0 };
    
    /** @type {{x: number, y: number}|null} Dernière position connue de la toolbar Barcode */
    let barcodeToolbarLastPos = null;
    
    /** @type {boolean} True si les composants POC de la toolbar Barcode ont été initialisés */
    let barcodeToolbarInitialized = false;

    // ═══════════════════════════════════════════════════════════════════════════════
    // Toolbar QR Code - Variables d'état
    // ═══════════════════════════════════════════════════════════════════════════════
    
    /** @type {boolean} True si la toolbar QR Code est visible */
    let isQrcodeToolbarVisible = false;
    
    /** @type {boolean} True si on est en train de déplacer la toolbar QR Code */
    let isQrcodeToolbarDragging = false;
    
    /** @type {{x: number, y: number}} Offset souris→toolbar au démarrage du drag */
    let qrcodeToolbarDragOffset = { x: 0, y: 0 };
    
    /** @type {{x: number, y: number}|null} Dernière position connue de la toolbar QR Code */
    let qrcodeToolbarLastPos = null;
    
    /** @type {boolean} True si les composants POC de la toolbar QR Code ont été initialisés */
    let qrcodeToolbarInitialized = false;

    /**
     * Calcule une position initiale (visible) pour la toolbar Image.
     * Priorité : dernière position connue > coin haut-droit du workspace (avec marge).
     *
     * @returns {{x: number, y: number}} Position (px) dans le viewport
     */
    function getInitialImageToolbarPosition() {
        if (imageToolbarLastPos) return imageToolbarLastPos;
        
        const margin = 16;
        const w = imageToolbar ? imageToolbar.offsetWidth || 280 : 280;
        const h = imageToolbar ? imageToolbar.offsetHeight || 200 : 200;
        
        // Essayer de se caler sur le workspace (coin haut-droit)
        if (workspace) {
            const rect = workspace.getBoundingClientRect();
            const x = Math.min(window.innerWidth - w - margin, Math.max(margin, rect.right - w - margin));
            const y = Math.min(window.innerHeight - h - margin, Math.max(margin, rect.top + margin));
            return { x, y };
        }
        
        // Fallback viewport
        return { x: window.innerWidth - w - margin, y: margin };
    }

    /**
     * Affiche la toolbar Image et synchronise avec la zone sélectionnée.
     *
     * @param {string} zoneId - ID de la zone image sélectionnée
     * @returns {void}
     */
    function showImageToolbar(zoneId) {
        console.log('🖼️ showImageToolbar():', zoneId);
        
        if (!imageToolbar) return;
        
        // Masquer la toolbar Quill si visible
        hideQuillToolbar();
        
        // Si la toolbar est déjà visible, on se contente de resynchroniser
        if (isImageToolbarVisible) {
            syncImageToolbarWithZone(zoneId);
            return;
        }
        
        imageToolbar.style.display = 'flex';
        isImageToolbarVisible = true;
        
        // Initialiser les composants POC une seule fois (au premier affichage)
        if (!imageToolbarInitialized) {
            initImageToolbarComponents();
            imageToolbarInitialized = true;
        }
        
        // Positionner la toolbar de façon visible
        const pos = getInitialImageToolbarPosition();
        imageToolbar.style.left = `${pos.x}px`;
        imageToolbar.style.top = `${pos.y}px`;
        imageToolbar.style.right = 'auto';
        imageToolbar.style.bottom = 'auto';
        
        // Synchroniser avec la zone sélectionnée
        syncImageToolbarWithZone(zoneId);
    }

    /**
     * Masque la toolbar Image.
     *
     * @returns {void}
     */
    function hideImageToolbar() {
        console.log('🖼️ hideImageToolbar()');
        
        if (!imageToolbar) return;
        if (!isImageToolbarVisible && imageToolbar.style.display === 'none') return;
        
        imageToolbar.style.display = 'none';
        isImageToolbarVisible = false;
    }

    /**
     * Met à jour les champs de géométrie de la toolbar Image.
     * Appelé pendant le drag/resize pour affichage temps réel.
     *
     * @param {string} zoneId - ID de la zone (ex: "zone-3")
     * @returns {void}
     */
    function updateImageToolbarGeometryFields(zoneId) {
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const xMm = pxToMm(parseFloat(zoneEl.style.left) || 0);
        const yMm = pxToMm(parseFloat(zoneEl.style.top) || 0);
        const wMm = pxToMm(zoneEl.offsetWidth);
        const hMm = pxToMm(zoneEl.offsetHeight);
        
        if (imageValX) imageValX.value = xMm.toFixed(1).replace('.', ',');
        if (imageValY) imageValY.value = yMm.toFixed(1).replace('.', ',');
        if (imageValW) imageValW.value = wMm.toFixed(1).replace('.', ',');
        if (imageValH) imageValH.value = hMm.toFixed(1).replace('.', ',');
    }

    /**
     * Synchronise les valeurs de la toolbar Image avec une zone image.
     * Remplit tous les champs : source, DPI, affichage, fond, bordure, géométrie, verrouillé.
     *
     * @param {string} zoneId - ID de la zone image
     * @returns {void}
     */
    function syncImageToolbarWithZone(zoneId) {
        console.log('🖼️ syncImageToolbarWithZone:', zoneId);
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        if (!zoneData || zoneData.type !== 'image') return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // ─── PAGE ───
        // La zone est sur la page courante, donc on affiche l'index courant
        if (imageInputPage) {
            imageInputPage.value = documentState.currentPageIndex;
        }
        
        // ─── SOURCE ───
        const source = zoneData.source || { type: 'fixe', valeur: '' };
        const sourceType = source.type === 'url' ? 'fixe' : source.type;
        
        if (imageInputSourceType) imageInputSourceType.value = sourceType;
        
        // Afficher le bon groupe selon le type
        if (sourceType === 'champ') {
            if (imageUploadGroup) imageUploadGroup.classList.add('hidden');
            if (imageChampGroup) imageChampGroup.classList.remove('hidden');
            populateImageFieldsSelect(source.valeur);
        } else {
            if (imageUploadGroup) imageUploadGroup.classList.remove('hidden');
            if (imageChampGroup) imageChampGroup.classList.add('hidden');
        }
        
        // Infos fichier et DPI
        updateImageFileInfoDisplay(source);
        updateDpiIndicator(zoneId);
        
        // ─── AFFICHAGE ───
        const redim = zoneData.redimensionnement || { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
        
        // Mode de redimensionnement (mapping interne → select)
        const modeMapping = {
            'initial': 'original',
            'ajuster': 'contain',
            'couper': 'cover'
        };
        if (imageInputMode) imageInputMode.value = modeMapping[redim.mode] || 'contain';
        
        // Alignements (toggle-groups)
        setToggleGroupPocValue('image-align-h-group', redim.alignementH || 'center');
        setToggleGroupPocValue('image-align-v-group', redim.alignementV || 'middle');
        
        // ─── FOND ───
        const isTransparent = zoneData.isTransparent !== false;
        setCheckboxPocState('image-chk-transparent-wrapper', isTransparent);
        
        // Afficher/masquer la couleur de fond selon transparent
        if (imageBgColorRow) {
            imageBgColorRow.style.display = isTransparent ? 'none' : '';
        }
        
        if (imageInputBgColor) {
            imageInputBgColor.value = zoneData.bgColor || '#ffffff';
            if (imageBgColorSwatch) {
                imageBgColorSwatch.style.background = zoneData.bgColor || '#ffffff';
            }
        }
        // Synchroniser les champs CMJN couleur fond (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('image-bg', zoneData.bgColor || '#ffffff', zoneData.bgColorCmyk);
        
        // ─── BORDURE ───
        const border = zoneData.border || { width: 0, color: '#000000', style: 'solid' };
        
        if (imageInputBorderWidth) {
            imageInputBorderWidth.value = border.width || 0;
        }
        
        // Afficher/masquer style et couleur selon épaisseur
        const hasBorder = (border.width || 0) > 0;
        if (imageBorderStyleRow) imageBorderStyleRow.style.display = hasBorder ? '' : 'none';
        if (imageBorderColorRow) imageBorderColorRow.style.display = hasBorder ? '' : 'none';
        
        if (imageInputBorderStyle) imageInputBorderStyle.value = border.style || 'solid';
        if (imageInputBorderColor) {
            imageInputBorderColor.value = border.color || '#000000';
            if (imageBorderColorSwatch) {
                imageBorderColorSwatch.style.background = border.color || '#000000';
            }
        }
        // Synchroniser les champs CMJN couleur bordure (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('image-border', border.color || '#000000', border.colorCmyk);
        
        // ─── GÉOMÉTRIE ───
        updateImageToolbarGeometryFields(zoneId);
        
        // ─── VERROUILLÉ ───
        setCheckboxPocState('image-chk-locked-wrapper', zoneData.locked || false);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOOLBAR BARCODE - FONCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Calcule une position initiale (visible) pour la toolbar Barcode.
     * Priorité : dernière position connue > coin haut-droit du workspace (avec marge).
     *
     * @returns {{x: number, y: number}} Position (px) dans le viewport
     */
    function getInitialBarcodeToolbarPosition() {
        if (barcodeToolbarLastPos) return barcodeToolbarLastPos;
        
        const margin = 16;
        const w = barcodeToolbar ? barcodeToolbar.offsetWidth || 300 : 300;
        const h = barcodeToolbar ? barcodeToolbar.offsetHeight || 400 : 400;
        
        // Essayer de se caler sur le workspace (coin haut-droit)
        if (workspace) {
            const rect = workspace.getBoundingClientRect();
            const x = Math.min(window.innerWidth - w - margin, Math.max(margin, rect.right - w - margin));
            const y = Math.min(window.innerHeight - h - margin, Math.max(margin, rect.top + margin));
            return { x, y };
        }
        
        // Fallback viewport
        return { x: window.innerWidth - w - margin, y: margin };
    }

    /**
     * Affiche la toolbar Barcode et synchronise avec la zone sélectionnée.
     *
     * @param {string} zoneId - ID de la zone barcode sélectionnée
     * @returns {void}
     */
    function showBarcodeToolbar(zoneId) {
        console.log('📊 showBarcodeToolbar():', zoneId);
        
        if (!barcodeToolbar) return;
        
        // Masquer les autres toolbars
        hideQuillToolbar();
        hideImageToolbar();
        hideQrcodeToolbar();
        
        // Si la toolbar est déjà visible, on se contente de resynchroniser
        if (isBarcodeToolbarVisible) {
            syncBarcodeToolbarWithZone(zoneId);
            return;
        }
        
        barcodeToolbar.style.display = 'flex';
        isBarcodeToolbarVisible = true;
        
        // Initialiser les composants POC une seule fois (au premier affichage)
        if (!barcodeToolbarInitialized) {
            initBarcodeToolbarComponents();
            barcodeToolbarInitialized = true;
        }
        
        // Positionner la toolbar de façon visible
        const pos = getInitialBarcodeToolbarPosition();
        barcodeToolbar.style.left = `${pos.x}px`;
        barcodeToolbar.style.top = `${pos.y}px`;
        barcodeToolbar.style.right = 'auto';
        barcodeToolbar.style.bottom = 'auto';
        
        // Synchroniser avec la zone sélectionnée
        syncBarcodeToolbarWithZone(zoneId);
    }

    /**
     * Masque la toolbar Barcode.
     *
     * @returns {void}
     */
    function hideBarcodeToolbar() {
        console.log('📊 hideBarcodeToolbar()');
        
        if (!barcodeToolbar) return;
        if (!isBarcodeToolbarVisible && barcodeToolbar.style.display === 'none') return;
        
        barcodeToolbar.style.display = 'none';
        isBarcodeToolbarVisible = false;
    }

    /**
     * Synchronise les valeurs de la toolbar Barcode avec une zone barcode.
     * Remplit tous les champs : type, source, valeur/champ, affichage, fond, géométrie, verrouillé.
     *
     * @param {string} zoneId - ID de la zone barcode
     * @returns {void}
     */
    function syncBarcodeToolbarWithZone(zoneId) {
        console.log('📊 syncBarcodeToolbarWithZone:', zoneId);
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        if (!zoneData || zoneData.type !== 'barcode') return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // ─── PAGE ───
        if (barcodeInputPage) {
            barcodeInputPage.value = documentState.currentPageIndex;
        }
        
        // ─── TYPE DE CODE ───
        if (barcodeInputType) {
            barcodeInputType.value = zoneData.typeCodeBarres || 'code128';
        }
        
        // ─── SOURCE (champFusion) ───
        const champFusion = zoneData.champFusion || '';
        const hasField = champFusion && champFusion.trim() !== '';
        
        if (barcodeInputSource) barcodeInputSource.value = hasField ? 'champ' : 'fixe';
        
        // Afficher le bon champ selon le type
        if (hasField) {
            if (barcodeValueRow) barcodeValueRow.style.display = 'none';
            if (barcodeFieldRow) barcodeFieldRow.style.display = '';
            // Peupler les champs de fusion et sélectionner la valeur
            updateBarcodeFieldSelect();
            if (barcodeInputField && champFusion) barcodeInputField.value = champFusion;
        } else {
            if (barcodeValueRow) barcodeValueRow.style.display = '';
            if (barcodeFieldRow) barcodeFieldRow.style.display = 'none';
            // Pas de valeur fixe stockée actuellement, afficher le sample
            const config = BARCODE_BWIPJS_CONFIG[zoneData.typeCodeBarres || 'code128'];
            if (barcodeInputValue) barcodeInputValue.value = config ? config.sampleValue : '';
        }
        
        // ─── AFFICHAGE (texteLisible / taillePolice) ───
        const showText = zoneData.texteLisible !== 'aucun';
        setCheckboxPocState('barcode-chk-show-text-wrapper', showText);
        
        // Vérifier si c'est un code 2D (pas de texte possible)
        const typeCode = zoneData.typeCodeBarres || 'code128';
        const config = BARCODE_BWIPJS_CONFIG[typeCode];
        const is2D = config ? config.is2D : false;
        
        // Masquer les options de texte pour les codes 2D
        const showTextSection = document.getElementById('barcode-chk-show-text-wrapper');
        if (showTextSection) {
            showTextSection.closest('.form-row-poc').style.display = is2D ? 'none' : '';
        }
        
        // Afficher/masquer la taille selon showText ET pas 2D
        if (barcodeTextSizeRow) {
            barcodeTextSizeRow.style.display = (showText && !is2D) ? '' : 'none';
        }
        
        if (barcodeInputTextSize) {
            barcodeInputTextSize.value = zoneData.taillePolice || 8;
        }
        
        // ─── FOND ───
        const isTransparent = zoneData.isTransparent !== false;
        setCheckboxPocState('barcode-chk-transparent-wrapper', isTransparent);
        
        // Afficher/masquer la couleur de fond selon transparent
        if (barcodeBgColorRow) {
            barcodeBgColorRow.style.display = isTransparent ? 'none' : '';
        }
        
        if (barcodeInputBgColor) {
            barcodeInputBgColor.value = zoneData.bgColor || '#ffffff';
            if (barcodeBgColorSwatch) {
                barcodeBgColorSwatch.style.background = zoneData.bgColor || '#ffffff';
            }
        }
        // Synchroniser les champs CMJN couleur fond (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('barcode-bg', zoneData.bgColor || '#ffffff', zoneData.bgColorCmyk);
        
        // ─── GÉOMÉTRIE ───
        updateBarcodeToolbarGeometryFields(zoneId);
        
        // ─── VERROUILLÉ ───
        setCheckboxPocState('barcode-chk-locked-wrapper', zoneData.locked || false);
    }

    /**
     * Met à jour les champs de géométrie de la toolbar Barcode.
     * Appelé pendant le drag/resize pour affichage temps réel.
     *
     * @param {string} zoneId - ID de la zone (ex: "zone-3")
     * @returns {void}
     */
    function updateBarcodeToolbarGeometryFields(zoneId) {
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const xMm = pxToMm(parseFloat(zoneEl.style.left) || 0);
        const yMm = pxToMm(parseFloat(zoneEl.style.top) || 0);
        const wMm = pxToMm(zoneEl.offsetWidth);
        const hMm = pxToMm(zoneEl.offsetHeight);
        
        if (barcodeValX) barcodeValX.value = xMm.toFixed(1).replace('.', ',');
        if (barcodeValY) barcodeValY.value = yMm.toFixed(1).replace('.', ',');
        if (barcodeValW) barcodeValW.value = wMm.toFixed(1).replace('.', ',');
        if (barcodeValH) barcodeValH.value = hMm.toFixed(1).replace('.', ',');
    }

    /**
     * Initialise les composants POC de la toolbar Barcode.
     * Configure les spinners, checkboxes et écouteurs d'événements.
     *
     * @returns {void}
     */
    function initBarcodeToolbarComponents() {
        if (!barcodeToolbar) return;
        
        console.log('📊 initBarcodeToolbarComponents()');
        
        /**
         * Retourne l'ID de la zone barcode sélectionnée (si sélection unique).
         * @returns {string|null}
         */
        const getSelectedBarcodeZoneId = () => {
            if (selectedZoneIds.length !== 1) return null;
            const zoneId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            if (!zonesData[zoneId] || zonesData[zoneId].type !== 'barcode') return null;
            return zoneId;
        };
        
        /**
         * Applique une mise à jour de données pour la zone barcode sélectionnée.
         * @param {(zoneData: any, zoneEl: HTMLElement, zoneId: string) => void} mutator
         * @param {boolean} [updateDisplay=true] - Si true, appelle updateBarcodeZoneDisplay
         * @returns {void}
         */
        const updateSelectedBarcodeZone = (mutator, updateDisplay = true) => {
            const zoneId = getSelectedBarcodeZoneId();
            if (!zoneId) return;
            
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            const zoneEl = document.getElementById(zoneId);
            if (!zoneEl) return;
            
            mutator(zoneData, zoneEl, zoneId);
            if (updateDisplay) {
                updateBarcodeZoneDisplay(zoneId);
            }
            saveToLocalStorage();
            saveState();
        };
        
        // ═══════════════════════════════════════════════════════════════
        // SPINNERS
        // ═══════════════════════════════════════════════════════════════
        
        // Taille texte (taillePolice dans le modèle)
        initSpinnerPoc('barcode-input-text-size', 6, 24, 1, (value) => {
            updateSelectedBarcodeZone((zoneData) => {
                zoneData.taillePolice = value;
            });
        });
        
        // ═══════════════════════════════════════════════════════════════
        // CHECKBOXES
        // ═══════════════════════════════════════════════════════════════
        
        // Afficher texte (texteLisible: 'dessous' ou 'aucun')
        initCheckboxPoc('barcode-chk-show-text-wrapper', (isChecked) => {
            // Afficher/masquer la taille texte
            if (barcodeTextSizeRow) {
                barcodeTextSizeRow.style.display = isChecked ? '' : 'none';
            }
            updateSelectedBarcodeZone((zoneData) => {
                zoneData.texteLisible = isChecked ? 'dessous' : 'aucun';
            });
        });
        
        // Transparent (le fond est géré par CSS, l'image du code est toujours transparente)
        initCheckboxPoc('barcode-chk-transparent-wrapper', (isChecked) => {
            // Afficher/masquer la couleur fond
            if (barcodeBgColorRow) {
                barcodeBgColorRow.style.display = isChecked ? 'none' : '';
            }
            updateSelectedBarcodeZone((zoneData, zoneEl) => {
                zoneData.isTransparent = isChecked;
                // Appliquer visuellement le fond (CSS uniquement, pas besoin de régénérer l'image)
                const preview = zoneEl.querySelector('.barcode-preview');
                if (preview) {
                    preview.style.backgroundColor = isChecked ? 'transparent' : (zoneData.bgColor || '#ffffff');
                }
                zoneEl.style.backgroundColor = isChecked ? 'transparent' : (zoneData.bgColor || '#ffffff');
            }, false); // Pas besoin de régénérer l'image (toujours transparente)
        });
        
        // Verrouiller
        initCheckboxPoc('barcode-chk-locked-wrapper', (isChecked) => {
            updateSelectedBarcodeZone((zoneData, zoneEl) => {
                zoneData.locked = isChecked;
                zoneEl.classList.toggle('locked', isChecked);
            }, false);
        });
        
        // ═══════════════════════════════════════════════════════════════
        // SELECTS
        // ═══════════════════════════════════════════════════════════════
        
        // Type de code (typeCodeBarres dans le modèle)
        if (barcodeInputType) {
            barcodeInputType.addEventListener('change', () => {
                const newType = barcodeInputType.value;
                const config = BARCODE_BWIPJS_CONFIG[newType];
                const is2D = config ? config.is2D : false;
                
                // Masquer/afficher les options de texte selon 1D/2D
                const showTextWrapper = document.getElementById('barcode-chk-show-text-wrapper');
                if (showTextWrapper) {
                    showTextWrapper.closest('.form-row-poc').style.display = is2D ? 'none' : '';
                }
                
                // Vérifier si "Afficher texte" est coché (état de la checkbox)
                const isShowTextChecked = getCheckboxPocState('barcode-chk-show-text-wrapper');
                
                // Pour la taille de texte : masquer si 2D, sinon selon l'état de la checkbox
                if (barcodeTextSizeRow) {
                    barcodeTextSizeRow.style.display = (is2D || !isShowTextChecked) ? 'none' : '';
                }
                
                updateSelectedBarcodeZone((zoneData) => {
                    zoneData.typeCodeBarres = newType;
                    if (is2D) {
                        // Pour les 2D, forcer "aucun" texte
                        zoneData.texteLisible = 'aucun';
                    } else {
                        // Pour les 1D, restaurer selon l'état de la checkbox
                        zoneData.texteLisible = isShowTextChecked ? 'dessous' : 'aucun';
                    }
                });
            });
        }
        
        // Source (fixe/champ)
        if (barcodeInputSource) {
            barcodeInputSource.addEventListener('change', () => {
                const sourceType = barcodeInputSource.value;
                
                if (sourceType === 'champ') {
                    if (barcodeValueRow) barcodeValueRow.style.display = 'none';
                    if (barcodeFieldRow) barcodeFieldRow.style.display = '';
                    updateBarcodeFieldSelect();
                } else {
                    if (barcodeValueRow) barcodeValueRow.style.display = '';
                    if (barcodeFieldRow) barcodeFieldRow.style.display = 'none';
                }
                
                // Si on passe en "fixe", vider le champ de fusion
                if (sourceType === 'fixe') {
                    updateSelectedBarcodeZone((zoneData) => {
                        zoneData.champFusion = '';
                    });
                }
            });
        }
        
        // Valeur fixe (note: pas stockée actuellement, juste pour preview)
        if (barcodeInputValue) {
            barcodeInputValue.addEventListener('change', () => {
                // La valeur fixe n'est pas utilisée dans le modèle actuel
                // Le code-barres utilise toujours sampleValue pour l'aperçu
                console.log('📊 Valeur fixe changée:', barcodeInputValue.value);
            });
        }
        
        // Champ de fusion (champFusion dans le modèle)
        if (barcodeInputField) {
            barcodeInputField.addEventListener('change', () => {
                updateSelectedBarcodeZone((zoneData) => {
                    zoneData.champFusion = barcodeInputField.value;
                });
            });
        }
        
        // Page (Recto/Verso) - déplacer la zone vers une autre page
        if (barcodeInputPage) {
            barcodeInputPage.addEventListener('change', () => {
                const zoneId = getSelectedBarcodeZoneId();
                if (!zoneId) return;
                
                const targetPageIndex = parseInt(barcodeInputPage.value, 10);
                const success = moveZoneToPage(zoneId, targetPageIndex);
                
                if (success) {
                    // Basculer sur la page de destination et sélectionner la zone
                    switchPage(targetPageIndex);
                    // Attendre que les zones soient recréées puis sélectionner
                    setTimeout(() => {
                        selectZone(zoneId);
                    }, 100);
                }
            });
        }
        
        // Couleur fond (RGB → CMJN sync)
        if (barcodeInputBgColor) {
            barcodeInputBgColor.addEventListener('input', () => {
                if (barcodeBgColorSwatch) {
                    barcodeBgColorSwatch.style.background = barcodeInputBgColor.value;
                }
                updateSelectedBarcodeZone((zoneData, zoneEl) => {
                    zoneData.bgColor = barcodeInputBgColor.value;
                    zoneData.bgColorCmyk = null;  // Effacer CMJN car saisie RGB
                    updateCmjnFieldsFromHex('barcode-bg', zoneData.bgColor);
                    // Appliquer visuellement si pas transparent
                    if (!zoneData.isTransparent) {
                        const preview = zoneEl.querySelector('.barcode-preview');
                        if (preview) {
                            preview.style.backgroundColor = barcodeInputBgColor.value;
                        }
                        zoneEl.style.backgroundColor = barcodeInputBgColor.value;
                    }
                }, false);
            });
        }
        
        // Couleur fond CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('barcode-bg', (newHex, cmykValues) => {
            updateSelectedBarcodeZone((zoneData, zoneEl) => {
                zoneData.bgColor = newHex;
                zoneData.bgColorCmyk = cmykValues;  // Stocker CMJN natif
                if (barcodeInputBgColor) barcodeInputBgColor.value = newHex;
                if (barcodeBgColorSwatch) barcodeBgColorSwatch.style.background = newHex;
                // Appliquer visuellement si pas transparent
                if (!zoneData.isTransparent) {
                    const preview = zoneEl.querySelector('.barcode-preview');
                    if (preview) {
                        preview.style.backgroundColor = newHex;
                    }
                    zoneEl.style.backgroundColor = newHex;
                }
                console.log('📊 Barcode bgColor (CMJN):', newHex, cmykValues);
            }, false);
        });
        
        // ═══════════════════════════════════════════════════════════════
        // GÉOMÉTRIE
        // ═══════════════════════════════════════════════════════════════
        
        const geoInputs = [barcodeValX, barcodeValY, barcodeValW, barcodeValH];
        geoInputs.forEach((input, index) => {
            if (!input) return;
            input.addEventListener('change', () => {
                const zoneId = getSelectedBarcodeZoneId();
                if (!zoneId) return;
                
                const zoneEl = document.getElementById(zoneId);
                if (!zoneEl) return;
                
                const valueMm = parseFloat(input.value.replace(',', '.')) || 0;
                const valuePx = valueMm / MM_PER_PIXEL;
                
                // Récupérer les données de la zone pour mise à jour
                const zonesData = getCurrentPageZones();
                const zoneData = zonesData[zoneId];
                
                // Vérifier si c'est un code 2D (doit rester carré)
                const typeCode = zoneData ? (zoneData.typeCodeBarres || 'code128') : 'code128';
                const isCode2D = is2DBarcode(typeCode);
                
                // Appliquer selon l'index (CSS + zonesData en pixels ET mm)
                if (index === 0) {
                    // X - Position horizontale
                    zoneEl.style.left = `${valuePx}px`;
                    if (zoneData) {
                        zoneData.x = valuePx;
                        zoneData.xMm = valueMm;
                    }
                } else if (index === 1) {
                    // Y - Position verticale
                    zoneEl.style.top = `${valuePx}px`;
                    if (zoneData) {
                        zoneData.y = valuePx;
                        zoneData.yMm = valueMm;
                    }
                } else if (index === 2) {
                    // W - Largeur
                    zoneEl.style.width = `${valuePx}px`;
                    if (zoneData) {
                        zoneData.w = valuePx;
                        zoneData.wMm = valueMm;
                    }
                    // Code 2D : synchroniser H
                    if (isCode2D) {
                        zoneEl.style.height = `${valuePx}px`;
                        if (zoneData) {
                            zoneData.h = valuePx;
                            zoneData.hMm = valueMm;
                        }
                        if (barcodeValH) barcodeValH.value = valueMm.toFixed(1).replace('.', ',');
                    }
                } else if (index === 3) {
                    // H - Hauteur
                    zoneEl.style.height = `${valuePx}px`;
                    if (zoneData) {
                        zoneData.h = valuePx;
                        zoneData.hMm = valueMm;
                    }
                    // Code 2D : synchroniser W
                    if (isCode2D) {
                        zoneEl.style.width = `${valuePx}px`;
                        if (zoneData) {
                            zoneData.w = valuePx;
                            zoneData.wMm = valueMm;
                        }
                        if (barcodeValW) barcodeValW.value = valueMm.toFixed(1).replace('.', ',');
                    }
                }
                
                updateBarcodeZoneDisplay(zoneId);
                saveToLocalStorage();
                saveState();
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOOLBAR QR CODE - FONCTIONS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Calcule une position initiale (visible) pour la toolbar QR Code.
     * Priorité : dernière position connue > coin haut-droit du workspace (avec marge).
     *
     * @returns {{x: number, y: number}} Position (px) dans le viewport
     */
    function getInitialQrcodeToolbarPosition() {
        if (qrcodeToolbarLastPos) return qrcodeToolbarLastPos;
        
        const margin = 16;
        const w = qrcodeToolbar ? qrcodeToolbar.offsetWidth || 300 : 300;
        const h = qrcodeToolbar ? qrcodeToolbar.offsetHeight || 350 : 350;
        
        // Essayer de se caler sur le workspace (coin haut-droit)
        if (workspace) {
            const rect = workspace.getBoundingClientRect();
            const x = Math.min(window.innerWidth - w - margin, Math.max(margin, rect.right - w - margin));
            const y = Math.min(window.innerHeight - h - margin, Math.max(margin, rect.top + margin));
            return { x, y };
        }
        
        // Fallback viewport
        return { x: window.innerWidth - w - margin, y: margin };
    }

    /**
     * Affiche la toolbar QR Code et synchronise avec la zone sélectionnée.
     *
     * @param {string} zoneId - ID de la zone qr sélectionnée
     * @returns {void}
     */
    function showQrcodeToolbar(zoneId) {
        console.log('📱 showQrcodeToolbar():', zoneId);
        
        if (!qrcodeToolbar) return;
        
        // Masquer les autres toolbars
        hideQuillToolbar();
        hideImageToolbar();
        hideBarcodeToolbar();
        
        // Si la toolbar est déjà visible, on se contente de resynchroniser
        if (isQrcodeToolbarVisible) {
            syncQrcodeToolbarWithZone(zoneId);
            return;
        }
        
        qrcodeToolbar.style.display = 'flex';
        isQrcodeToolbarVisible = true;
        
        // Initialiser les composants POC une seule fois (au premier affichage)
        if (!qrcodeToolbarInitialized) {
            initQrcodeToolbarComponents();
            qrcodeToolbarInitialized = true;
        }
        
        // Positionner la toolbar de façon visible
        const pos = getInitialQrcodeToolbarPosition();
        qrcodeToolbar.style.left = `${pos.x}px`;
        qrcodeToolbar.style.top = `${pos.y}px`;
        qrcodeToolbar.style.right = 'auto';
        qrcodeToolbar.style.bottom = 'auto';
        
        // Synchroniser avec la zone sélectionnée
        syncQrcodeToolbarWithZone(zoneId);
    }

    /**
     * Masque la toolbar QR Code.
     *
     * @returns {void}
     */
    function hideQrcodeToolbar() {
        console.log('📱 hideQrcodeToolbar()');
        
        if (!qrcodeToolbar) return;
        if (!isQrcodeToolbarVisible && qrcodeToolbar.style.display === 'none') return;
        
        qrcodeToolbar.style.display = 'none';
        isQrcodeToolbarVisible = false;
    }

    /**
     * Synchronise les valeurs de la toolbar QR Code avec une zone qr.
     * Remplit tous les champs : page, fond, géométrie, verrouillé.
     *
     * @param {string} zoneId - ID de la zone qr
     * @returns {void}
     */
    function syncQrcodeToolbarWithZone(zoneId) {
        console.log('📱 syncQrcodeToolbarWithZone:', zoneId);
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        if (!zoneData || zoneData.type !== 'qr') return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // ─── PAGE ───
        if (qrcodeInputPage) {
            qrcodeInputPage.value = documentState.currentPageIndex;
        }
        
        // ─── FOND ───
        const isTransparent = zoneData.isTransparent !== false;
        setCheckboxPocState('qrcode-chk-transparent-wrapper', isTransparent);
        
        // Afficher/masquer la couleur de fond selon transparent
        if (qrcodeBgColorRow) {
            qrcodeBgColorRow.style.display = isTransparent ? 'none' : '';
        }
        
        if (qrcodeInputBgColor) {
            qrcodeInputBgColor.value = zoneData.bgColor || '#ffffff';
            if (qrcodeBgColorSwatch) {
                qrcodeBgColorSwatch.style.background = zoneData.bgColor || '#ffffff';
            }
        }
        // Synchroniser les champs CMJN couleur fond (utiliser CMJN natif si disponible)
        updateCmjnFieldsFromHex('qrcode-bg', zoneData.bgColor || '#ffffff', zoneData.bgColorCmyk);
        
        // ─── GÉOMÉTRIE ───
        updateQrcodeToolbarGeometryFields(zoneId);
        
        // ─── VERROUILLÉ ───
        setCheckboxPocState('qrcode-chk-locked-wrapper', zoneData.locked || false);
    }

    /**
     * Met à jour les champs de géométrie de la toolbar QR Code.
     * Appelé pendant le drag/resize pour affichage temps réel.
     *
     * @param {string} zoneId - ID de la zone (ex: "zone-3")
     * @returns {void}
     */
    function updateQrcodeToolbarGeometryFields(zoneId) {
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const xMm = pxToMm(parseFloat(zoneEl.style.left) || 0);
        const yMm = pxToMm(parseFloat(zoneEl.style.top) || 0);
        const wMm = pxToMm(zoneEl.offsetWidth);
        const hMm = pxToMm(zoneEl.offsetHeight);
        
        if (qrcodeValX) qrcodeValX.value = xMm.toFixed(1).replace('.', ',');
        if (qrcodeValY) qrcodeValY.value = yMm.toFixed(1).replace('.', ',');
        if (qrcodeValW) qrcodeValW.value = wMm.toFixed(1).replace('.', ',');
        if (qrcodeValH) qrcodeValH.value = hMm.toFixed(1).replace('.', ',');
    }

    /**
     * Initialise les composants POC de la toolbar QR Code.
     * Configure les checkboxes et écouteurs d'événements.
     *
     * @returns {void}
     */
    function initQrcodeToolbarComponents() {
        if (!qrcodeToolbar) return;
        
        console.log('📱 initQrcodeToolbarComponents()');
        
        /**
         * Retourne l'ID de la zone qr sélectionnée (si sélection unique).
         * @returns {string|null}
         */
        const getSelectedQrcodeZoneId = () => {
            if (selectedZoneIds.length !== 1) return null;
            const zoneId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            if (!zonesData[zoneId] || zonesData[zoneId].type !== 'qr') return null;
            return zoneId;
        };
        
        /**
         * Applique une mise à jour de données pour la zone qr sélectionnée.
         * @param {(zoneData: any, zoneEl: HTMLElement, zoneId: string) => void} mutator
         * @returns {void}
         */
        const updateSelectedQrcodeZone = (mutator) => {
            const zoneId = getSelectedQrcodeZoneId();
            if (!zoneId) return;
            
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            const zoneEl = document.getElementById(zoneId);
            if (!zoneEl) return;
            
            mutator(zoneData, zoneEl, zoneId);
            updateQrZoneDisplay(zoneId);
            saveToLocalStorage();
            saveState();
        };
        
        // ═══════════════════════════════════════════════════════════════
        // CHECKBOXES
        // ═══════════════════════════════════════════════════════════════
        
        // Transparent (le fond est géré par CSS, l'image du code est toujours transparente)
        initCheckboxPoc('qrcode-chk-transparent-wrapper', (isChecked) => {
            // Afficher/masquer la couleur fond
            if (qrcodeBgColorRow) {
                qrcodeBgColorRow.style.display = isChecked ? 'none' : '';
            }
            
            const zoneId = getSelectedQrcodeZoneId();
            if (!zoneId) return;
            
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            const zoneEl = document.getElementById(zoneId);
            if (!zoneEl || !zoneData) return;
            
            zoneData.isTransparent = isChecked;
            
            // Appliquer visuellement le fond (CSS uniquement, pas besoin de régénérer l'image)
            // Le fond est sur la zone elle-même (.zone-qr), pas sur le contenu
            zoneEl.style.backgroundColor = isChecked ? 'transparent' : (zoneData.bgColor || '#ffffff');
            
            saveToLocalStorage();
            saveState();
        });
        
        // Verrouiller
        initCheckboxPoc('qrcode-chk-locked-wrapper', (isChecked) => {
            updateSelectedQrcodeZone((zoneData, zoneEl) => {
                zoneData.locked = isChecked;
                zoneEl.classList.toggle('locked', isChecked);
            });
        });
        
        // ═══════════════════════════════════════════════════════════════
        // SELECTS
        // ═══════════════════════════════════════════════════════════════
        
        // Page (Recto/Verso) - déplacer la zone vers une autre page
        if (qrcodeInputPage) {
            qrcodeInputPage.addEventListener('change', () => {
                const zoneId = getSelectedQrcodeZoneId();
                if (!zoneId) return;
                
                const targetPageIndex = parseInt(qrcodeInputPage.value, 10);
                const success = moveZoneToPage(zoneId, targetPageIndex);
                
                if (success) {
                    // Basculer sur la page de destination et sélectionner la zone
                    switchPage(targetPageIndex);
                    // Attendre que les zones soient recréées puis sélectionner
                    setTimeout(() => {
                        selectZone(zoneId);
                    }, 100);
                }
            });
        }
        
        // Couleur fond (RGB → CMJN sync)
        if (qrcodeInputBgColor) {
            qrcodeInputBgColor.addEventListener('input', () => {
                if (qrcodeBgColorSwatch) {
                    qrcodeBgColorSwatch.style.background = qrcodeInputBgColor.value;
                }
                
                const zoneId = getSelectedQrcodeZoneId();
                if (!zoneId) return;
                
                const zonesData = getCurrentPageZones();
                const zoneData = zonesData[zoneId];
                const zoneEl = document.getElementById(zoneId);
                if (!zoneEl || !zoneData) return;
                
                zoneData.bgColor = qrcodeInputBgColor.value;
                zoneData.bgColorCmyk = null;  // Effacer CMJN car saisie RGB
                updateCmjnFieldsFromHex('qrcode-bg', zoneData.bgColor);
                
                // Appliquer visuellement si pas transparent
                // Le fond est sur la zone elle-même (.zone-qr), pas sur le contenu
                if (!zoneData.isTransparent) {
                    zoneEl.style.backgroundColor = qrcodeInputBgColor.value;
                }
                
                saveToLocalStorage();
                saveState();
            });
        }
        
        // Couleur fond CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('qrcode-bg', (newHex, cmykValues) => {
            const zoneId = getSelectedQrcodeZoneId();
            if (!zoneId) return;
            
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            const zoneEl = document.getElementById(zoneId);
            if (!zoneEl || !zoneData) return;
            
            zoneData.bgColor = newHex;
            zoneData.bgColorCmyk = cmykValues;  // Stocker CMJN natif
            if (qrcodeInputBgColor) qrcodeInputBgColor.value = newHex;
            if (qrcodeBgColorSwatch) qrcodeBgColorSwatch.style.background = newHex;
            
            // Appliquer visuellement si pas transparent
            if (!zoneData.isTransparent) {
                zoneEl.style.backgroundColor = newHex;
            }
            
            saveToLocalStorage();
            saveState();
            console.log('📱 QRCode bgColor (CMJN):', newHex);
        });
        
        // ═══════════════════════════════════════════════════════════════
        // GÉOMÉTRIE
        // ═══════════════════════════════════════════════════════════════
        
        const geoInputs = [qrcodeValX, qrcodeValY, qrcodeValW, qrcodeValH];
        geoInputs.forEach((input, index) => {
            if (!input) return;
            input.addEventListener('change', () => {
                const zoneId = getSelectedQrcodeZoneId();
                if (!zoneId) return;
                
                const zoneEl = document.getElementById(zoneId);
                if (!zoneEl) return;
                
                const valueMm = parseFloat(input.value.replace(',', '.')) || 0;
                const valuePx = valueMm / MM_PER_PIXEL;
                
                // Récupérer les données de la zone pour mise à jour
                const zonesData = getCurrentPageZones();
                const zoneData = zonesData[zoneId];
                
                // Appliquer selon l'index (CSS + zonesData en pixels ET mm)
                if (index === 0) {
                    // X - Position horizontale
                    zoneEl.style.left = `${valuePx}px`;
                    if (zoneData) {
                        zoneData.x = valuePx;
                        zoneData.xMm = valueMm;
                    }
                } else if (index === 1) {
                    // Y - Position verticale
                    zoneEl.style.top = `${valuePx}px`;
                    if (zoneData) {
                        zoneData.y = valuePx;
                        zoneData.yMm = valueMm;
                    }
                } else if (index === 2) {
                    // W - Largeur (QR code = toujours carré → aussi modifier H)
                    zoneEl.style.width = `${valuePx}px`;
                    zoneEl.style.height = `${valuePx}px`; // Synchroniser H
                    if (zoneData) {
                        zoneData.w = valuePx;
                        zoneData.wMm = valueMm;
                        zoneData.h = valuePx;    // Synchroniser H
                        zoneData.hMm = valueMm;  // Synchroniser H
                    }
                    // Mettre à jour le champ H dans la toolbar
                    if (qrcodeValH) qrcodeValH.value = valueMm.toFixed(1).replace('.', ',');
                } else if (index === 3) {
                    // H - Hauteur (QR code = toujours carré → aussi modifier W)
                    zoneEl.style.height = `${valuePx}px`;
                    zoneEl.style.width = `${valuePx}px`; // Synchroniser W
                    if (zoneData) {
                        zoneData.h = valuePx;
                        zoneData.hMm = valueMm;
                        zoneData.w = valuePx;    // Synchroniser W
                        zoneData.wMm = valueMm;  // Synchroniser W
                    }
                    // Mettre à jour le champ W dans la toolbar
                    if (qrcodeValW) qrcodeValW.value = valueMm.toFixed(1).replace('.', ',');
                }
                
                updateQrZoneDisplay(zoneId);
                saveToLocalStorage();
                saveState();
            });
        });
    }

    /**
     * Affiche la toolbar appropriée selon le type de zone sélectionnée.
     * Une seule toolbar visible à la fois.
     * 
     * Règles :
     * - Aucune sélection ou multi-sélection → tout masquer
     * - 1 zone text/textQuill → toolbar Quill
     * - 1 zone image → toolbar Image
     * - Autres types → aucune toolbar
     *
     * @returns {void}
     */
    function updateToolbarVisibility() {
        // Masquer toutes les toolbars en mode Aperçu
        if (previewState && previewState.active) {
            hideQuillToolbar();
            hideImageToolbar();
            hideBarcodeToolbar();
            hideQrcodeToolbar();
            return;
        }
        
        // Récupérer le type de la zone sélectionnée (si une seule)
        let zoneType = null;
        let zoneId = null;
        
        if (selectedZoneIds.length === 1) {
            zoneId = selectedZoneIds[0];
            const zoneEl = document.getElementById(zoneId);
            if (zoneEl && zoneEl.dataset) {
                zoneType = zoneEl.dataset.type;
            }
        }
        
        console.log('🔧 updateToolbarVisibility - count:', selectedZoneIds.length, 'type:', zoneType);
        
        // Vérifier si la zone est système
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        const isSysteme = zoneData && zoneData.systeme;
        
        // Décider quelle toolbar afficher
        if (selectedZoneIds.length !== 1 || !zoneType || isSysteme) {
            // Aucune sélection, multi-sélection, ou zone système → masquer toutes les toolbars
            hideQuillToolbar();
            hideImageToolbar();
            hideBarcodeToolbar();
            hideQrcodeToolbar();
            // Masquer aussi la toolbar Data pour les zones système
            if (isSysteme && toolbarData) {
                toolbarData.style.display = 'none';
            }
            return;
        }
        
        switch (zoneType) {
            case 'text':
            case 'textQuill':
                hideImageToolbar();
                hideBarcodeToolbar();
                hideQrcodeToolbar();
                showQuillToolbar();
                break;
                
            case 'image':
                hideQuillToolbar();
                hideBarcodeToolbar();
                hideQrcodeToolbar();
                showImageToolbar(zoneId);
                break;
                
            case 'barcode':
                hideQuillToolbar();
                hideImageToolbar();
                hideQrcodeToolbar();
                showBarcodeToolbar(zoneId);
                break;
                
            case 'qr':
                hideQuillToolbar();
                hideImageToolbar();
                hideBarcodeToolbar();
                showQrcodeToolbar(zoneId);
                break;
                
            default:
                // Type inconnu → masquer toutes les toolbars
                hideQuillToolbar();
                hideImageToolbar();
                hideBarcodeToolbar();
                hideQrcodeToolbar();
                break;
        }
        
        // Mettre à jour la toolbar Data (champs de fusion)
        updateToolbarDataVisibility();
    }

    /**
     * Initialise les composants POC de la toolbar Image.
     * Configure les spinners, toggle-groups, checkboxes et écouteurs d'événements.
     *
     * @returns {void}
     */
    function initImageToolbarComponents() {
        if (!imageToolbar) return;
        
        console.log('🖼️ initImageToolbarComponents()');
        
        /**
         * Retourne l'ID de la zone image sélectionnée (si sélection unique).
         * @returns {string|null}
         */
        const getSelectedImageZoneId = () => {
            if (selectedZoneIds.length !== 1) return null;
            const zoneId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            if (!zonesData[zoneId] || zonesData[zoneId].type !== 'image') return null;
            return zoneId;
        };
        
        /**
         * Applique une mise à jour de données pour la zone image sélectionnée.
         * @param {(zoneData: any, zoneEl: HTMLElement, zoneId: string) => void} mutator
         * @returns {void}
         */
        const updateSelectedImageZone = (mutator) => {
            const zoneId = getSelectedImageZoneId();
            if (!zoneId) return;
            
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            const zoneEl = document.getElementById(zoneId);
            if (!zoneEl) return;
            
            mutator(zoneData, zoneEl, zoneId);
            updateImageZoneDisplay(zoneId);
            saveToLocalStorage();
            saveState();
        };
        
        // ═══════════════════════════════════════════════════════════════
        // SPINNERS
        // ═══════════════════════════════════════════════════════════════
        console.log('🔧 initImageToolbarComponents - Initialisation des SPINNERS');
        console.log('   imageToolbar visible ?', imageToolbar.style.display);
        console.log('   imageToolbar offsetHeight:', imageToolbar.offsetHeight);
        
        // Épaisseur bordure
        initSpinnerPoc('image-input-border-width', 0, 20, 1, (value) => {
            console.log('🔧 Spinner border-width callback, value:', value);
            updateSelectedImageZone((zoneData, zoneEl) => {
                if (!zoneData.border) zoneData.border = { width: 0, color: '#000000', style: 'solid' };
                zoneData.border.width = value;
                
                // Afficher/masquer style et couleur selon épaisseur
                const hasBorder = value > 0;
                if (imageBorderStyleRow) imageBorderStyleRow.style.display = hasBorder ? '' : 'none';
                if (imageBorderColorRow) imageBorderColorRow.style.display = hasBorder ? '' : 'none';
                
                // Appliquer visuellement la bordure
                applyBorderToZone(zoneEl, zoneData.border);
            });
        });
        
        // ═══════════════════════════════════════════════════════════════
        // TOGGLE-GROUPS (alignements)
        // ═══════════════════════════════════════════════════════════════
        
        // Note : déjà initialisés via initToggleGroupPoc plus tôt dans le code
        // On ajoute ici les callbacks de mise à jour
        initToggleGroupPoc('image-align-h-group', (value) => {
            updateSelectedImageZone((zoneData) => {
                if (!zoneData.redimensionnement) {
                    zoneData.redimensionnement = { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
                }
                zoneData.redimensionnement.alignementH = value;
            });
        });
        
        initToggleGroupPoc('image-align-v-group', (value) => {
            updateSelectedImageZone((zoneData) => {
                if (!zoneData.redimensionnement) {
                    zoneData.redimensionnement = { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
                }
                zoneData.redimensionnement.alignementV = value;
            });
        });
        
        // ═══════════════════════════════════════════════════════════════
        // CHECKBOXES
        // ═══════════════════════════════════════════════════════════════
        
        // Fond transparent
        initCheckboxPoc('image-chk-transparent-wrapper', (checked) => {
            updateSelectedImageZone((zoneData, zoneEl) => {
                zoneData.isTransparent = checked;
                
                // Afficher/masquer la couleur de fond
                if (imageBgColorRow) {
                    imageBgColorRow.style.display = checked ? 'none' : '';
                }
                
                // Appliquer visuellement le fond
                zoneEl.style.backgroundColor = checked ? 'transparent' : (zoneData.bgColor || '#ffffff');
            });
        });
        
        // Verrouiller
        initCheckboxPoc('image-chk-locked-wrapper', (checked) => {
            updateSelectedImageZone((zoneData, zoneEl) => {
                zoneData.locked = checked;
                zoneEl.classList.toggle('locked', checked);
                updateHandlesVisibility();
            });
        });
        
        // ═══════════════════════════════════════════════════════════════
        // SELECTS
        // ═══════════════════════════════════════════════════════════════
        
        // Page (Recto/Verso) - déplacer la zone vers une autre page
        if (imageInputPage) {
            imageInputPage.addEventListener('change', () => {
                const zoneId = getSelectedImageZoneId();
                if (!zoneId) return;
                
                const targetPageIndex = parseInt(imageInputPage.value, 10);
                const success = moveZoneToPage(zoneId, targetPageIndex);
                
                if (success) {
                    // Basculer sur la page de destination et sélectionner la zone
                    switchPage(targetPageIndex);
                    // Attendre que les zones soient recréées puis sélectionner
                    setTimeout(() => {
                        selectZone(zoneId);
                    }, 100);
                }
            });
        }
        
        // Type de source (fixe/champ)
        if (imageInputSourceType) {
            imageInputSourceType.addEventListener('change', () => {
                const sourceType = imageInputSourceType.value;
                
                // Afficher le bon groupe
                if (sourceType === 'champ') {
                    if (imageUploadGroup) imageUploadGroup.classList.add('hidden');
                    if (imageChampGroup) imageChampGroup.classList.remove('hidden');
                } else {
                    if (imageUploadGroup) imageUploadGroup.classList.remove('hidden');
                    if (imageChampGroup) imageChampGroup.classList.add('hidden');
                }
                
                updateSelectedImageZone((zoneData) => {
                    if (!zoneData.source) zoneData.source = { type: 'fixe', valeur: '' };
                    zoneData.source.type = sourceType;
                });
            });
        }
        
        // Mode de redimensionnement
        if (imageInputMode) {
            imageInputMode.addEventListener('change', () => {
                // Mapping select → interne
                const modeMapping = {
                    'original': 'initial',
                    'contain': 'ajuster',
                    'cover': 'couper'
                };
                
                updateSelectedImageZone((zoneData, zoneEl, zoneId) => {
                    if (!zoneData.redimensionnement) {
                        zoneData.redimensionnement = { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
                    }
                    zoneData.redimensionnement.mode = modeMapping[imageInputMode.value] || 'ajuster';
                    
                    // Mettre à jour l'indicateur DPI
                    updateDpiIndicator(zoneId);
                    updateImageDpiBadge(zoneId);
                });
            });
        }
        
        // Champ de fusion
        if (imageInputChamp) {
            imageInputChamp.addEventListener('change', () => {
                updateSelectedImageZone((zoneData) => {
                    if (!zoneData.source) zoneData.source = { type: 'champ', valeur: '' };
                    zoneData.source.valeur = imageInputChamp.value;
                });
            });
        }
        
        // Style bordure
        if (imageInputBorderStyle) {
            imageInputBorderStyle.addEventListener('change', () => {
                updateSelectedImageZone((zoneData, zoneEl) => {
                    if (!zoneData.border) zoneData.border = { width: 0, color: '#000000', style: 'solid' };
                    zoneData.border.style = imageInputBorderStyle.value;
                    // Appliquer visuellement la bordure
                    applyBorderToZone(zoneEl, zoneData.border);
                });
            });
        }
        
        // ═══════════════════════════════════════════════════════════════
        // COULEURS
        // ═══════════════════════════════════════════════════════════════
        
        // Couleur de fond (RGB → CMJN sync)
        if (imageInputBgColor) {
            imageInputBgColor.addEventListener('input', () => {
                if (imageBgColorSwatch) {
                    imageBgColorSwatch.style.background = imageInputBgColor.value;
                }
                updateSelectedImageZone((zoneData, zoneEl) => {
                    zoneData.bgColor = imageInputBgColor.value;
                    zoneData.bgColorCmyk = null;  // Effacer CMJN car saisie RGB
                    updateCmjnFieldsFromHex('image-bg', zoneData.bgColor);
                    // Appliquer visuellement le fond (seulement si pas transparent)
                    if (!zoneData.isTransparent) {
                        zoneEl.style.backgroundColor = zoneData.bgColor;
                    }
                });
            });
        }
        
        // Couleur de fond CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('image-bg', (newHex, cmykValues) => {
            updateSelectedImageZone((zoneData, zoneEl) => {
                zoneData.bgColor = newHex;
                zoneData.bgColorCmyk = cmykValues;  // Stocker CMJN natif
                if (imageInputBgColor) imageInputBgColor.value = newHex;
                if (imageBgColorSwatch) imageBgColorSwatch.style.background = newHex;
                // Appliquer visuellement le fond (seulement si pas transparent)
                if (!zoneData.isTransparent) {
                    zoneEl.style.backgroundColor = newHex;
                }
                console.log('🖼️ Image bgColor (CMJN):', newHex, cmykValues);
            });
        });
        
        // Couleur bordure (RGB → CMJN sync)
        if (imageInputBorderColor) {
            imageInputBorderColor.addEventListener('input', () => {
                if (imageBorderColorSwatch) {
                    imageBorderColorSwatch.style.background = imageInputBorderColor.value;
                }
                updateSelectedImageZone((zoneData, zoneEl) => {
                    if (!zoneData.border) zoneData.border = { width: 0, color: '#000000', style: 'solid' };
                    zoneData.border.color = imageInputBorderColor.value;
                    zoneData.border.colorCmyk = null;  // Effacer CMJN car saisie RGB
                    updateCmjnFieldsFromHex('image-border', zoneData.border.color);
                    // Appliquer visuellement la bordure
                    applyBorderToZone(zoneEl, zoneData.border);
                });
            });
        }
        
        // Couleur bordure CMJN (CMJN → RGB sync)
        initCmjnFieldsListeners('image-border', (newHex, cmykValues) => {
            updateSelectedImageZone((zoneData, zoneEl) => {
                if (!zoneData.border) zoneData.border = { width: 0, color: '#000000', style: 'solid' };
                zoneData.border.color = newHex;
                zoneData.border.colorCmyk = cmykValues;  // Stocker CMJN natif
                if (imageInputBorderColor) imageInputBorderColor.value = newHex;
                if (imageBorderColorSwatch) imageBorderColorSwatch.style.background = newHex;
                // Appliquer visuellement la bordure
                applyBorderToZone(zoneEl, zoneData.border);
                console.log('🖼️ Image border.color (CMJN):', newHex, cmykValues);
            });
        });
        
        // ═══════════════════════════════════════════════════════════════
        // GÉOMÉTRIE (inputs mm)
        // ═══════════════════════════════════════════════════════════════
        
        const geoInputs = [imageValX, imageValY, imageValW, imageValH];
        geoInputs.forEach((input, index) => {
            if (!input) return;
            
            input.addEventListener('change', () => {
                const zoneId = getSelectedImageZoneId();
                if (!zoneId) return;
                
                const zoneEl = document.getElementById(zoneId);
                if (!zoneEl) return;
                
                // Parser la valeur (format français avec virgule)
                const valueMm = parseFloat(input.value.replace(',', '.')) || 0;
                const valuePx = valueMm / MM_PER_PIXEL;
                
                // Récupérer les données de la zone pour mise à jour
                const zonesData = getCurrentPageZones();
                const zoneData = zonesData[zoneId];
                
                // Appliquer selon l'index (CSS + zonesData en pixels ET mm)
                switch (index) {
                    case 0: // X
                        zoneEl.style.left = `${valuePx}px`;
                        if (zoneData) {
                            zoneData.x = valuePx;
                            zoneData.xMm = valueMm;
                        }
                        break;
                    case 1: // Y
                        zoneEl.style.top = `${valuePx}px`;
                        if (zoneData) {
                            zoneData.y = valuePx;
                            zoneData.yMm = valueMm;
                        }
                        break;
                    case 2: // W
                        zoneEl.style.width = `${Math.max(20, valuePx)}px`;
                        if (zoneData) {
                            zoneData.w = Math.max(20, valuePx);
                            zoneData.wMm = Math.max(20 * MM_PER_PIXEL, valueMm);
                        }
                        break;
                    case 3: // H
                        zoneEl.style.height = `${Math.max(20, valuePx)}px`;
                        if (zoneData) {
                            zoneData.h = Math.max(20, valuePx);
                            zoneData.hMm = Math.max(20 * MM_PER_PIXEL, valueMm);
                        }
                        break;
                }
                
                // Reformater l'input
                input.value = valueMm.toFixed(1).replace('.', ',');
                
                // Mettre à jour DPI si largeur/hauteur changée
                if (index >= 2) {
                    updateDpiIndicator(zoneId);
                    updateImageDpiBadge(zoneId);
                }
                
                saveToLocalStorage();
                saveState();
            });
        });
        
        console.log('🖼️ Toolbar Image - composants POC initialisés');
    }

    // Charger les données d'une zone dans le formulaire
    function loadZoneDataToForm(id) {
        // Empêcher la création de snapshots pendant le chargement du formulaire
        historyManager.isLoadingForm = true;
        
        const zonesData = getCurrentPageZones();
        const data = zonesData[id];
        
        if (!data) {
            historyManager.isLoadingForm = false;
            return;
        }
        
        // Zone système : masquer tout le conteneur de propriétés
        if (data.systeme) {
            const propertiesContent = document.getElementById('zone-properties-content');
            if (propertiesContent) {
                propertiesContent.style.display = 'none';
            }
            historyManager.isLoadingForm = false;
            return;
        }
        
        // Zone normale : s'assurer que le conteneur est visible
        const propertiesContent = document.getElementById('zone-properties-content');
        if (propertiesContent) {
            propertiesContent.style.display = '';
        }
        
        const zoneType = data.type || 'text';
        zonesData[id].type = zoneType;

        if (zoneType === 'qr') {
            // Masquer section image et code-barres, afficher section texte (désactivée)
            if (textPropertiesSection) textPropertiesSection.style.display = 'block';
            if (imagePropertiesSection) imagePropertiesSection.style.display = 'none';
            if (barcodePropertiesSection) barcodePropertiesSection.style.display = 'none';
            
            setTextControlsEnabled(false);
            if (inputContent) inputContent.value = 'Zone QR statique (non modifiable)';
            if (inputFont) inputFont.value = 'Roboto';
            if (inputSize) inputSize.value = 12;
            if (inputColor) inputColor.value = '#000000';
            if (inputAlign) inputAlign.value = 'center';
            if (inputValign) inputValign.value = 'middle';
            if (inputBgColor) inputBgColor.value = '#ffffff';
            if (chkTransparent) chkTransparent.checked = false;
            if (chkCopyfit) chkCopyfit.checked = false;
            if (inputLineHeight) inputLineHeight.value = 1.0;
            // Bordures pour zone QR (pas applicable)
            if (inputBorderWidth) {
                inputBorderWidth.value = 0;
                updateBorderWidthDisplay(0);
            }
            if (inputBorderColor) inputBorderColor.value = '#000000';
            if (inputBorderStyle) inputBorderStyle.value = 'solid';
        } else if (zoneType === 'barcode') {
            // Masquer sections texte et image, afficher section code-barres
            if (textPropertiesSection) textPropertiesSection.style.display = 'none';
            if (imagePropertiesSection) imagePropertiesSection.style.display = 'none';
            if (barcodePropertiesSection) barcodePropertiesSection.style.display = 'block';
            
            // Masquer les contrôles spécifiques texte et fond
            const controlsToHide = [
                'input-font', 'input-size', 'input-line-height',
                'chk-copyfit', 'input-color',
                'input-align', 'input-valign',
                'input-bg-color', 'chk-transparent',
                'input-border-width', 'input-border-color', 'input-border-style'
            ];
            controlsToHide.forEach(ctrlId => {
                const el = document.getElementById(ctrlId);
                if (el) {
                    const parent = el.closest('.style-row') || el.closest('.input-group');
                    if (parent) parent.style.display = 'none';
                }
            });
            
            // Masquer la section bordure
            const borderSection = document.querySelector('.subsection-title + .style-row');
            
            setTextControlsEnabled(false);
            
            // Remplir les contrôles code-barres
            if (inputBarcodeName) inputBarcodeName.value = data.nom || '';
            if (inputBarcodeType) inputBarcodeType.value = data.typeCodeBarres || 'code128';
            if (inputBarcodeReadable) inputBarcodeReadable.value = data.texteLisible || 'dessous';
            if (inputBarcodeFontsize) inputBarcodeFontsize.value = data.taillePolice || 8;
            if (inputBarcodeColor) inputBarcodeColor.value = data.couleur || '#000000';
            
            // Vérifier si c'est un code 2D (jamais de texte lisible pour QR/DataMatrix)
            const typeCode = data.typeCodeBarres || 'code128';
            const config = BARCODE_BWIPJS_CONFIG[typeCode];
            const is2D = config ? config.is2D : false;
            
            // Masquer/afficher les options texte selon le type
            if (is2D) {
                // Codes 2D : masquer les options texte lisible
                if (barcodeReadableGroup) barcodeReadableGroup.style.display = 'none';
                if (barcodeFontsizeGroup) barcodeFontsizeGroup.style.display = 'none';
            } else {
                // Codes 1D : afficher les options texte
                if (barcodeReadableGroup) barcodeReadableGroup.style.display = '';
                if (barcodeFontsizeGroup) {
                    barcodeFontsizeGroup.style.display = (data.texteLisible === 'aucun') ? 'none' : '';
                }
            }
            
            // Remplir le select des champs de fusion
            updateBarcodeFieldSelect();
            if (barcodeInputField) barcodeInputField.value = data.champFusion || '';
            
            // Verrouillage
            if (chkLock) chkLock.checked = data.locked || false;
        } else if (zoneType === 'image') {
            // Masquer la section contenu texte et code-barres
            if (textPropertiesSection) textPropertiesSection.style.display = 'none';
            if (barcodePropertiesSection) barcodePropertiesSection.style.display = 'none';
            
            // Masquer les contrôles spécifiques texte (Police, Taille, Interlignage, etc.)
            const textOnlyControls = [
                'input-font', 'input-size', 'input-line-height',
                'chk-copyfit', 'input-color',
                'input-align', 'input-valign'
            ];
            textOnlyControls.forEach(ctrlId => {
                const el = document.getElementById(ctrlId);
                if (el) {
                    const parent = el.closest('.style-row') || el.closest('.input-group');
                    if (parent) parent.style.display = 'none';
                }
            });
            
            // Afficher la section image
            if (imagePropertiesSection) imagePropertiesSection.style.display = 'block';
            setTextControlsEnabled(false);
            
            const source = data.source || { type: 'fixe', valeur: '' };
            const redim = data.redimensionnement || { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
            
            // Rétrocompatibilité : 'url' devient 'fixe' dans le select
            const selectType = source.type === 'url' ? 'fixe' : source.type;
            if (imageInputSourceType) imageInputSourceType.value = selectType;
            if (imageInputMode) imageInputMode.value = redim.mode;
            setToggleGroupPocValue('image-align-h-group', redim.alignementH);
            setToggleGroupPocValue('image-align-v-group', redim.alignementV);
            
            // Afficher le bon groupe selon le type
            // 'fixe' : afficher le groupe upload
            // 'champ' : afficher le select des champs de fusion
            if (source.type === 'champ') {
                if (imageUploadGroup) imageUploadGroup.style.display = 'none';
                if (imageChampGroup) imageChampGroup.style.display = 'block';
                populateImageFieldsSelect(source.valeur);
            } else {
                // 'fixe' ou 'url' : afficher le groupe upload
                if (imageUploadGroup) imageUploadGroup.style.display = 'block';
                if (imageChampGroup) imageChampGroup.style.display = 'none';
            }
            
            // Afficher les infos fichier si image uploadée
            updateImageFileInfoDisplay(source);

            // Mettre à jour l'indicateur DPI et le badge
            updateDpiIndicator(id);
            updateImageDpiBadge(id);
            
            // Bordure (contrôle commun - doit rester visible)
            if (inputBorderWidth) {
                inputBorderWidth.value = data.border?.width || 0;
                updateBorderWidthDisplay(data.border?.width || 0);
            }
            if (inputBorderColor) inputBorderColor.value = data.border?.color || '#000000';
            if (inputBorderStyle) inputBorderStyle.value = data.border?.style || 'solid';
            
            // Fond (contrôle commun - doit rester visible)
            if (inputBgColor) inputBgColor.value = data.bgColor || '#ffffff';
            if (chkTransparent) chkTransparent.checked = data.isTransparent !== undefined ? data.isTransparent : true;
            if (inputBgColor && chkTransparent) inputBgColor.disabled = chkTransparent.checked;
            
            // Verrouillage (contrôle commun)
            if (chkLock) chkLock.checked = data.locked || false;
        } else if (zoneType === 'textQuill') {
            // Zone texte Quill : édition directement dans la zone (pas via textarea)
            if (textPropertiesSection) textPropertiesSection.style.display = 'block';
            if (imagePropertiesSection) imagePropertiesSection.style.display = 'none';
            if (barcodePropertiesSection) barcodePropertiesSection.style.display = 'none';
            
            // Désactiver les contrôles texte pour éviter un conflit avec l'éditeur Quill
            setTextControlsEnabled(false);
            if (inputContent) {
                inputContent.value = 'Zone Quill (éditez directement dans la zone).';
                inputContent.placeholder = 'Zone Quill (édition dans la zone)';
            }
            
            // Afficher des valeurs par défaut (informatives)
            if (inputFont) inputFont.value = data.font || QUILL_DEFAULT_FONT;
            if (inputSize) inputSize.value = data.size || QUILL_DEFAULT_SIZE;
            if (inputColor) inputColor.value = data.color || QUILL_DEFAULT_COLOR;
            if (inputLineHeight) inputLineHeight.value = data.lineHeight || QUILL_DEFAULT_LINE_HEIGHT;
            
            // Fond/bordure/verrouillage : laisser visibles (mais désactivés via setTextControlsEnabled)
            if (chkLock) chkLock.checked = data.locked || false;
        } else {
            // Zone texte
            // Afficher la section contenu texte
            if (textPropertiesSection) textPropertiesSection.style.display = 'block';
            
            // Réafficher les contrôles spécifiques texte (masqués pour les zones image/barcode)
            const controlsToShow = [
                'input-font', 'input-size', 'input-line-height',
                'chk-copyfit', 'input-color',
                'input-align', 'input-valign',
                'input-bg-color', 'chk-transparent',
                'input-border-width', 'input-border-color', 'input-border-style'
            ];
            controlsToShow.forEach(ctrlId => {
                const el = document.getElementById(ctrlId);
                if (el) {
                    const parent = el.closest('.style-row') || el.closest('.input-group');
                    if (parent) parent.style.display = '';
                }
            });
            
            // Masquer les sections image et code-barres
            if (imagePropertiesSection) imagePropertiesSection.style.display = 'none';
            if (barcodePropertiesSection) barcodePropertiesSection.style.display = 'none';
            
            setTextControlsEnabled(true);
            if (inputContent) inputContent.value = data.content || '';
            if (inputFont) inputFont.value = data.font || 'Roboto';
            if (inputSize) inputSize.value = data.size || 12;
            if (inputColor) inputColor.value = data.color || '#000000';
            if (inputAlign) inputAlign.value = data.align || 'left';
            if (inputValign) inputValign.value = data.valign || 'top';
            if (inputBgColor) inputBgColor.value = data.bgColor || '#ffffff';
            if (chkTransparent) chkTransparent.checked = data.isTransparent !== undefined ? data.isTransparent : true;
            if (chkCopyfit) chkCopyfit.checked = data.copyfit || false;
            if (inputLineHeight) inputLineHeight.value = data.lineHeight !== undefined ? data.lineHeight : 1.2;
            
            // Initialiser la bordure si nécessaire
            if (!data.border) {
                zonesData[id].border = { width: 0, color: '#000000', style: 'solid' };
            }
            const border = data.border || { width: 0, color: '#000000', style: 'solid' };
            if (inputBorderWidth) {
                inputBorderWidth.value = border.width || 0;
                updateBorderWidthDisplay(border.width || 0);
            }
            if (inputBorderColor) inputBorderColor.value = border.color || '#000000';
            if (inputBorderStyle) inputBorderStyle.value = border.style || 'solid';
            
            // Charger la valeur des lignes vides (avec rétrocompatibilité)
            if (inputEmptyLines) {
                let emptyLinesValue = data.emptyLines;
                if (emptyLinesValue === undefined) {
                    // Ancien format booléen
                    emptyLinesValue = data.removeEmptyLines ? 1 : 0;
                }
                // Migration : ancienne valeur 2 → nouvelle valeur 1
                if (emptyLinesValue === 2) emptyLinesValue = 1;
                inputEmptyLines.value = emptyLinesValue;
            }
            
            // Initialiser le formatage partiel si nécessaire
            if (!data.formatting) {
                zonesData[id].formatting = [];
            }
        }
        if (chkLock) chkLock.checked = data.locked || false;
        
        // Activer/désactiver les champs de géométrie selon le verrouillage ou système
        const isLocked = data.locked || false;
        const isSysteme = data.systeme || false;
        const isReadOnly = isLocked || isSysteme;
        if (inputX) inputX.disabled = isReadOnly;
        if (inputY) inputY.disabled = isReadOnly;
        if (inputW) inputW.disabled = isReadOnly;
        if (inputH) inputH.disabled = isReadOnly;
        
        // Désactiver le checkbox de verrouillage si la zone est système
        if (chkLock) chkLock.disabled = isSysteme;
        
        // Afficher/masquer la section Lignes vides selon le type de zone (texte uniquement)
        if (emptyLinesSection) {
            emptyLinesSection.style.display = (zoneType === 'text') ? 'block' : 'none';
        }
        
        // Gestion état UI couleur fond
        inputBgColor.disabled = chkTransparent.checked;

        // Mettre à jour les géométries
        const zoneEl = document.getElementById(id);
        if (zoneEl) {
            updateGeomDisplay(zoneEl);
        }
        
        // Désactiver le mode multi-sélection
        setMultiSelectionMode(false);
        
        // Réactiver la sauvegarde dans l'historique
        historyManager.isLoadingForm = false;
    }

    // Activer/désactiver le mode multi-sélection dans le formulaire
    function setMultiSelectionMode(enabled) {
        // Masquer/afficher tout le conteneur des propriétés individuelles
        const propertiesContent = document.getElementById('zone-properties-content');
        if (propertiesContent) {
            propertiesContent.style.display = enabled ? 'none' : '';
        }
        
        // Désactiver tous les champs en mode multi-sélection (pour sécurité, même si masqués)
        textControls.forEach(ctrl => {
            if (ctrl) {
                ctrl.disabled = enabled;
            }
        });
        // Masquer les géométries en mode multi-sélection
        const geomInputs = [inputX, inputY, inputW, inputH];
        geomInputs.forEach(input => {
            if (input) {
                input.style.display = enabled ? 'none' : '';
            }
        });
    }

    /**
     * Mettre à jour la visibilité des sections de la sidebar selon la sélection
     * @description Logique POC :
     *   - Multi-sélection (2+) : SEULES les sections multi sont visibles
     *   - Sélection simple (1) : always + single visibles, no-selection masqué
     *   - Aucune sélection (0) : always + no-selection visibles, single masqué
     */
    function updateSidebarSectionsVisibility() {
        // Si mode aperçu actif, ne pas modifier la visibilité des sections
        if (previewState && previewState.active) {
            return;
        }
        
        const count = selectedZoneIds.length;
        
        // Récupérer les sections par ID
        const pagesSection = document.getElementById('pages-section');
        const resetSection = document.getElementById('reset-section');
        const deleteSection = document.getElementById('delete-section');
        const alignmentSection = document.getElementById('alignment-section');
        const sizeSection = document.getElementById('size-section');
        const spacingSection = document.getElementById('spacing-section');
        
        // ═══════════════════════════════════════════════════════════════════════
        // MODE MULTI-SÉLECTION (2+ zones) : logique EXCLUSIVE
        // Seules les sections multi-2 et multi-3 sont visibles
        // ═══════════════════════════════════════════════════════════════════════
        if (count >= 2) {
            // Masquer toutes les autres sections
            if (previewSection) previewSection.style.display = 'none';
            if (pagesSection) pagesSection.style.display = 'none';
            if (resetSection) resetSection.style.display = 'none';
            if (actionsSection) actionsSection.style.display = 'none';
            if (historySection) historySection.style.display = 'none';
            if (positionSection) positionSection.style.display = 'none';
            if (toolsSection) toolsSection.style.display = 'none';
            if (zoomSection) zoomSection.style.display = 'none';
            
            // Afficher les sections multi
            if (alignmentSection) alignmentSection.style.display = 'block';
            if (sizeSection) sizeSection.style.display = 'block';
            if (spacingSection) spacingSection.style.display = count >= 3 ? 'block' : 'none';
            if (deleteSection) deleteSection.style.display = 'block'; // Visible pour supprimer plusieurs zones
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════════════
        // MODE SÉLECTION SIMPLE (1 zone)
        // always + single visibles, no-selection masqué
        // ═══════════════════════════════════════════════════════════════════════
        if (count === 1) {
            if (previewSection) previewSection.style.display = 'none';  // no-selection
            if (pagesSection) pagesSection.style.display = 'none';      // no-selection
            if (resetSection) resetSection.style.display = 'none';      // masqué avec sélection
            if (actionsSection) actionsSection.style.display = 'none';  // masqué avec sélection
            if (historySection) historySection.style.display = 'block'; // always
            if (positionSection) positionSection.style.display = 'block'; // single
            if (alignmentSection) alignmentSection.style.display = 'none';
            if (sizeSection) sizeSection.style.display = 'none';
            if (spacingSection) spacingSection.style.display = 'none';
            if (toolsSection) toolsSection.style.display = 'none';      // no-selection
            if (zoomSection) zoomSection.style.display = 'block';       // always
            if (deleteSection) deleteSection.style.display = 'block';   // visible avec sélection
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════════════
        // MODE AUCUNE SÉLECTION (0 zone)
        // always + no-selection visibles, single masqué
        // ═══════════════════════════════════════════════════════════════════════
        if (previewSection) previewSection.style.display = 'block'; // no-selection
        if (pagesSection) pagesSection.style.display = 'block';     // no-selection
        if (resetSection) resetSection.style.display = 'block';     // visible sans sélection
        if (actionsSection) actionsSection.style.display = 'block'; // visible sans sélection
        if (historySection) historySection.style.display = 'block'; // always
        if (positionSection) positionSection.style.display = 'none'; // single
        if (alignmentSection) alignmentSection.style.display = 'none';
        if (sizeSection) sizeSection.style.display = 'none';
        if (spacingSection) spacingSection.style.display = 'none';
        if (toolsSection) toolsSection.style.display = 'block';     // no-selection
        if (zoomSection) zoomSection.style.display = 'block';       // always
        if (deleteSection) deleteSection.style.display = 'none';    // masquée sans sélection
    }

    // --- FONCTIONS D'ALIGNEMENT ---
    
    // Aligner les zones sélectionnées par rapport à la première zone (référence)
    function alignZones(direction) {
        if (selectedZoneIds.length < 2) return;
        
        const referenceId = selectedZoneIds[0];
        const referenceZone = document.getElementById(referenceId);
        if (!referenceZone) return;
        
        const refRect = {
            left: referenceZone.offsetLeft,
            top: referenceZone.offsetTop,
            right: referenceZone.offsetLeft + referenceZone.offsetWidth,
            bottom: referenceZone.offsetTop + referenceZone.offsetHeight,
            centerX: referenceZone.offsetLeft + referenceZone.offsetWidth / 2,
            centerY: referenceZone.offsetTop + referenceZone.offsetHeight / 2
        };
        
        // Aligner toutes les autres zones par rapport à la référence
        for (let i = 1; i < selectedZoneIds.length; i++) {
            const zoneId = selectedZoneIds[i];
            const zone = document.getElementById(zoneId);
            if (!zone) continue;
            
            const zonesData = getCurrentPageZones();
            if (zonesData[zoneId] && (zonesData[zoneId].locked || zonesData[zoneId].systeme)) continue; // Ignorer les zones verrouillées ou système

            switch(direction) {
                case 'left':
                    zone.style.left = refRect.left + 'px';
                    break;
                case 'center':
                    zone.style.left = (refRect.centerX - zone.offsetWidth / 2) + 'px';
                    break;
                case 'right':
                    zone.style.left = (refRect.right - zone.offsetWidth) + 'px';
                    break;
                case 'top':
                    zone.style.top = refRect.top + 'px';
                    break;
                case 'middle':
                    zone.style.top = (refRect.centerY - zone.offsetHeight / 2) + 'px';
                    break;
                case 'bottom':
                    zone.style.top = (refRect.bottom - zone.offsetHeight) + 'px';
                    break;
            }
            
            // S'assurer que la zone reste dans les limites de la page avec marge de sécurité
            const margin = getSecurityMarginPx();
            const minLeft = margin;
            const maxLeft = a4Page.offsetWidth - margin - zone.offsetWidth;
            const minTop = margin;
            const maxTop = a4Page.offsetHeight - margin - zone.offsetHeight;
            zone.style.left = Math.max(minLeft, Math.min(parseFloat(zone.style.left), maxLeft)) + 'px';
            zone.style.top = Math.max(minTop, Math.min(parseFloat(zone.style.top), maxTop)) + 'px';
        }
        
        saveToLocalStorage();
        saveState(); // Snapshot APRÈS l'alignement
    }

    // --- FONCTIONS DE TAILLE ---
    
    // Appliquer la même largeur que la première zone (référence)
    function applySameWidth() {
        if (selectedZoneIds.length < 2) return;

        const referenceId = selectedZoneIds[0];
        const referenceZone = document.getElementById(referenceId);
        if (!referenceZone) return;

        const refWidth = referenceZone.offsetWidth;
        const zonesData = getCurrentPageZones();

        for (let i = 1; i < selectedZoneIds.length; i++) {
            const zoneId = selectedZoneIds[i];
            const zone = document.getElementById(zoneId);
            if (!zone) continue;

            if (zonesData[zoneId] && (zonesData[zoneId].locked || zonesData[zoneId].systeme)) continue; // Ignorer les zones verrouillées ou système

            const zoneData = zonesData[zoneId];
            
            // Pour les codes-barres, vérifier si c'est un code 2D
            if (zoneData && (zoneData.type === 'qr' || zoneData.type === 'barcode')) {
                const typeCode = zoneData.type === 'qr' 
                    ? (zoneData.typeCode || 'QRCode')
                    : (zoneData.typeCodeBarres || 'code128');
                const config = BARCODE_BWIPJS_CONFIG[typeCode];
                const is2D = config ? config.is2D : false;
                
                if (is2D) {
                    // Code 2D : forcer le carré
                    zone.style.width = refWidth + 'px';
                    zone.style.height = refWidth + 'px';
                    zoneData.w = refWidth;
                    zoneData.h = refWidth;
                } else {
                    // Code 1D : seulement la largeur
                    zone.style.width = refWidth + 'px';
                    zoneData.w = refWidth;
                }
                
                // Régénérer le code-barres
                if (zoneData.type === 'qr') {
                    updateQrZoneDisplay(zoneId);
                } else {
                    updateBarcodeZoneDisplay(zoneId);
                }
            } else {
                zone.style.width = refWidth + 'px';
                if (zoneData) zoneData.w = refWidth;
            }
            
            // Mettre à jour le badge DPI pour les images
            if (zoneData && zoneData.type === 'image') {
                updateImageDpiBadge(zoneId);
            }

            // S'assurer que la zone reste dans les limites
            const maxLeft = a4Page.offsetWidth - zone.offsetWidth;
            const currentLeft = parseFloat(zone.style.left) || 0;
            zone.style.left = Math.max(0, Math.min(currentLeft, maxLeft)) + 'px';
            if (zoneData) zoneData.x = parseFloat(zone.style.left);
        }

        saveToLocalStorage();
        saveState(); // Snapshot APRÈS le changement de taille
    }

    // Appliquer la même hauteur que la première zone (référence)
    function applySameHeight() {
        if (selectedZoneIds.length < 2) return;

        const referenceId = selectedZoneIds[0];
        const referenceZone = document.getElementById(referenceId);
        if (!referenceZone) return;

        const refHeight = referenceZone.offsetHeight;
        const zonesData = getCurrentPageZones();

        for (let i = 1; i < selectedZoneIds.length; i++) {
            const zoneId = selectedZoneIds[i];
            const zone = document.getElementById(zoneId);
            if (!zone) continue;

            if (zonesData[zoneId] && (zonesData[zoneId].locked || zonesData[zoneId].systeme)) continue; // Ignorer les zones verrouillées ou système

            const zoneData = zonesData[zoneId];
            
            // Pour les codes-barres, vérifier si c'est un code 2D
            if (zoneData && (zoneData.type === 'qr' || zoneData.type === 'barcode')) {
                const typeCode = zoneData.type === 'qr' 
                    ? (zoneData.typeCode || 'QRCode')
                    : (zoneData.typeCodeBarres || 'code128');
                const config = BARCODE_BWIPJS_CONFIG[typeCode];
                const is2D = config ? config.is2D : false;
                
                if (is2D) {
                    // Code 2D : forcer le carré
                    zone.style.height = refHeight + 'px';
                    zone.style.width = refHeight + 'px';
                    zoneData.h = refHeight;
                    zoneData.w = refHeight;
                } else {
                    // Code 1D : seulement la hauteur
                    zone.style.height = refHeight + 'px';
                    zoneData.h = refHeight;
                }
                
                // Régénérer le code-barres
                if (zoneData.type === 'qr') {
                    updateQrZoneDisplay(zoneId);
                } else {
                    updateBarcodeZoneDisplay(zoneId);
                }
            } else {
                zone.style.height = refHeight + 'px';
                if (zoneData) zoneData.h = refHeight;
            }
            
            // Mettre à jour le badge DPI pour les images
            if (zoneData && zoneData.type === 'image') {
                updateImageDpiBadge(zoneId);
            }

            // S'assurer que la zone reste dans les limites
            const maxTop = a4Page.offsetHeight - zone.offsetHeight;
            const currentTop = parseFloat(zone.style.top) || 0;
            zone.style.top = Math.max(0, Math.min(currentTop, maxTop)) + 'px';
            if (zoneData) zoneData.y = parseFloat(zone.style.top);
        }

        saveToLocalStorage();
        saveState(); // Snapshot APRÈS le changement de taille
    }

    /**
     * Sélectionne une zone et affiche ses propriétés dans le formulaire.
     * Gère la multi-sélection avec Ctrl+clic (sauf pour les zones système).
     * 
     * Comportements :
     * - Clic simple : Remplace la sélection actuelle
     * - Ctrl+clic : Ajoute/retire de la sélection (multi-sélection)
     * - Zone système : Toujours sélectionnée seule (pas de multi-sélection)
     * - Zone déjà dans multi-sélection : Clic simple conserve la sélection (pour drag groupé)
     * 
     * @param {string} id - Identifiant de la zone à sélectionner (ex: "zone-1")
     * @param {MouseEvent|null} [event=null] - Événement souris pour détecter Ctrl/Meta
     * @returns {void}
     * 
     * @fires loadFormFromZone - Charge les propriétés dans le formulaire
     * 
     * @example
     * // Sélection simple
     * selectZone('zone-1');
     * 
     * // Sélection depuis un événement clic (gère Ctrl)
     * zoneEl.addEventListener('click', (e) => selectZone(id, e));
     * 
     * @see deselectAll - Désélectionner toutes les zones
     * @see addToSelection - Ajouter à la multi-sélection
     * @see removeFromSelection - Retirer de la multi-sélection
     */
    function selectZone(id, event = null) {
        // Bloquer la sélection en mode Aperçu
        if (previewState && previewState.active) {
            console.log('🚫 selectZone() bloquée - mode Aperçu actif');
            return;
        }
        
        const isCtrlPressed = event && (event.ctrlKey || event.metaKey);
        const isAlreadySelected = selectedZoneIds.includes(id);
        
        // Vérifier si la zone cliquée est système
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[id];
        const isSysteme = zoneData && zoneData.systeme;
        
        if (isCtrlPressed) {
            // Mode multi-sélection : ajouter ou retirer de la sélection
            // MAIS : une zone système ne peut pas faire partie d'une multi-sélection
            if (isSysteme) {
                // Zone système : ignorer le Ctrl+clic, faire une sélection simple
                // (la zone système sera sélectionnée seule plus bas)
            } else if (isAlreadySelected) {
                removeFromSelection(id);
                return;
            } else {
                // Vérifier si la sélection actuelle contient une zone système
                const hasSystemeInSelection = selectedZoneIds.some(zoneId => {
                    const data = zonesData[zoneId];
                    return data && data.systeme;
                });
                if (hasSystemeInSelection) {
                    // Il y a une zone système sélectionnée, on la remplace par cette nouvelle zone
                    // (pas de multi-sélection avec une zone système)
                } else {
                    addToSelection(id);
                    return;
                }
            }
        } else {
            // Sélection simple : remplacer la sélection actuelle
            // MAIS : si la zone cliquée est déjà dans une sélection multiple, ne pas remplacer
            // (pour permettre le drag groupé sans Ctrl)
            if (isAlreadySelected && selectedZoneIds.length > 1) {
                // Ne rien faire, garder la sélection multiple pour permettre le drag groupé
                return;
            }
            
            // Désélectionner toutes les zones
            selectedZoneIds.forEach(zoneId => {
                document.getElementById(zoneId)?.classList.remove('selected');
            });
            selectedZoneIds = [id];
            
            // Sélectionner la nouvelle zone
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                zoneEl.classList.add('selected');
            }
            
            updateSelectionUI();
            
            // Mettre à jour la combo Page
            updateZonePageUI();
        }
    }

    // ─────────────────────────────── FIN SECTION 14 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 15 : DATA BINDING FORMULAIRE → ZONE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Fonctions de liaison entre le formulaire de propriétés et les zones.
     * Note : L'ancien système de formatage partiel par annotations (type 'text') a été supprimé.
     * Le formatage riche est maintenant géré par Quill (type 'textQuill').
     * 
     * Fonctions principales :
     *   - applyBorderToZone() : Applique les bordures utilisateur
     *   - updateActiveZone() : Wrapper pour les contrôles communs (Section 15)
     *   - updateActiveImageZoneData() : Synchronise formulaire → zone image
     *   - updateActiveQrZoneData() : Synchronise formulaire → zone QR
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    // NOTE: La fonction updateActiveZoneData() a été supprimée car elle gérait l'ancien type 'text'.
    // Les zones textQuill sont gérées directement par Quill et les toolbars flottantes.
    // Les zones image/QR/barcode sont gérées par updateActiveImageZoneData() et updateActiveQrZoneData().
    
    /**
     * Applique les styles de bordure à une zone
     * @param {HTMLElement} zoneEl - Élément DOM de la zone
     * @param {Object} border - Configuration de la bordure { width, color, style }
     */
    function applyBorderToZone(zoneEl, border) {
        if (!zoneEl) return;
        
        const borderData = border || { width: 0, color: '#000000', style: 'solid' };
        const width = parseFloat(borderData.width) || 0;
        const color = borderData.color || '#000000';
        const style = borderData.style || 'solid';
        
        if (width === 0) {
            // Pas de bordure (épaisseur = 0)
            zoneEl.style.border = 'none';
            zoneEl.classList.remove('has-border');
        } else {
            // Appliquer la bordure avec le style CSS natif (solid/dashed/dotted)
            const cssStyle =
                (style === 'dashed') ? 'dashed' :
                (style === 'dotted') ? 'dotted' :
                'solid';
            zoneEl.style.border = `${width}px ${cssStyle} ${color}`;
            zoneEl.classList.add('has-border');
        }
    }
    
    /**
     * Convertit une couleur hexadécimale en RGB
     * @param {string} hex - Couleur hexadécimale (#RRGGBB)
     * @returns {Object|null} - { r, g, b } ou null si invalide
     */
    function hexToRgb(hex) {
        if (!hex || !hex.startsWith('#')) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // --- FONCTION COPY FITTING (Ajustement automatique) ---
    function applyCopyfit(zoneEl, maxSizePt) {
        if (!zoneEl) return;
        const contentEl = zoneEl.querySelector('.zone-content');
        if (!contentEl) return;
        // Si on passe un objet data au lieu d'un nombre, on extrait la taille
        const targetSize = typeof maxSizePt === 'object' ? parseInt(maxSizePt.size) : parseInt(maxSizePt); 
        
        if (isNaN(targetSize)) return;

        // Sauvegarder l'alignement vertical actuel pour le restaurer après
        const originalInlineJustifyContent = contentEl.style.justifyContent;
        let originalComputedJustifyContent = 'flex-start';
        try {
            // IMPORTANT : le valign peut venir d'une classe CSS (valign-*) → on lit le computed style
            originalComputedJustifyContent = (getComputedStyle(contentEl).justifyContent || 'flex-start');
        } catch (e) {
            originalComputedJustifyContent = 'flex-start';
        }
        
        // Temporairement mettre l'alignement en haut pour des calculs précis
        // (évite les problèmes avec flex-end qui peut fausser scrollHeight)
        contentEl.style.justifyContent = 'flex-start';

        let currentSize = targetSize;
        const minSize = 4; // Taille minimum de sécurité
        
        // 1. On commence par la taille max (Reset)
        zoneEl.style.fontSize = currentSize + 'pt';
        
        // 2. Tant que ça déborde, on réduit
        // On utilise une petite boucle de sécurité pour éviter le freeze navigateur
        let iterations = 0;
        while (
            (contentEl.scrollHeight > zoneEl.clientHeight || 
             contentEl.scrollWidth > zoneEl.clientWidth) && 
            currentSize > minSize &&
            iterations < 100
        ) {
            currentSize -= 0.5; 
            zoneEl.style.fontSize = currentSize + 'pt';
            iterations++;
        }
        
        // Restaurer l'alignement vertical original
        // - Si l'alignement était en inline → on restaure l'inline
        // - Sinon → on nettoie l'inline pour laisser les classes CSS s'appliquer
        if (originalInlineJustifyContent) {
            contentEl.style.justifyContent = originalInlineJustifyContent;
        } else {
            contentEl.style.justifyContent = '';
            // Sécurité : si aucune classe CSS n'est présente, on réapplique le computed initial
            // (évite un retour visuel en haut si la classe a été perdue ailleurs)
            if (!contentEl.classList.contains('valign-top') &&
                !contentEl.classList.contains('valign-middle') &&
                !contentEl.classList.contains('valign-bottom')) {
                contentEl.style.justifyContent = originalComputedJustifyContent;
            }
        }
    }

    /**
     * Applique le copyfit à une zone textQuill.
     * Réduit la taille de police pour que le contenu tienne dans la zone.
     * Utilise une approche en 2 phases : réduction rapide (-2pt) puis fine (-0.5pt).
     * 
     * @param {HTMLElement} zoneEl - Élément DOM de la zone
     * @param {Object} quillInstance - Instance Quill de la zone
     * @param {number} maxSizePt - Taille de police maximum en points
     * @returns {void}
     */
    function applyCopyfitToQuillZone(zoneEl, quillInstance, maxSizePt) {
        // Vérifications préliminaires
        if (!zoneEl || !quillInstance || !quillInstance.root) return;
        
        // Flag pour éviter les boucles infinies avec le ResizeObserver
        isCopyfitRunning = true;
        
        const zoneContent = zoneEl.querySelector('.zone-content');
        const editor = quillInstance.root;
        if (!zoneContent || !editor) return;
        
        const quillEditor = zoneEl.querySelector('.quill-editor');
        const qlContainer = zoneEl.querySelector('.ql-container');
        
        const maxSize = parseFloat(maxSizePt) || QUILL_DEFAULT_SIZE;
        const minSize = 6;
        const precision = 0.1; // Précision de la dichotomie en points (fine)
        const maxIterations = 30; // Sécurité anti-boucle infinie
        let iterations = 0;
        
        // Sauvegarder les styles originaux pour restaurer après
        const originalInlineJustifyContent = zoneContent.style.justifyContent;
        let originalComputedJustifyContent = 'flex-start';
        try {
            originalComputedJustifyContent = getComputedStyle(zoneContent).justifyContent || 'flex-start';
        } catch (e) {
            originalComputedJustifyContent = 'flex-start';
        }
        
        // CAPTURER LA HAUTEUR DISPONIBLE AVANT TOUT CHANGEMENT
        const availableHeight = zoneContent.clientHeight;
        
        if (DEBUG_COPYFIT) {
            console.group(`🧪 COPYFIT - start: ${zoneEl.id}`);
            try {
                console.log('inputs:', {
                    maxSizePt,
                    maxSize,
                    minSize,
                    precision,
                    maxIterations
                });
                console.log('measure initial (px):', {
                    zoneContentClientH: zoneContent.clientHeight,
                    zoneContentClientW: zoneContent.clientWidth,
                    editorClientH: editor.clientHeight,
                    editorScrollH: editor.scrollHeight
                });
                console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
                console.log('computed initial:', {
                    zoneContentJustify: getComputedStyle(zoneContent).justifyContent,
                    editorFontSize: getComputedStyle(editor).fontSize,
                    editorLineHeight: getComputedStyle(editor).lineHeight,
                    editorTextAlign: getComputedStyle(editor).textAlign,
                    editorFontFamily: getComputedStyle(editor).fontFamily
                });
            } catch (e) {}
            console.groupEnd();
        }
        
        // Temporairement aligner en haut pour des calculs précis
        zoneContent.style.justifyContent = 'flex-start';
        
        // Force un reflow
        void zoneContent.offsetHeight;
        
        /**
         * Teste si une taille donnée provoque un overflow
         * @param {number} sizePt - Taille en points à tester
         * @returns {boolean} - true si overflow, false sinon
         */
        const testSize = (sizePt) => {
            editor.style.fontSize = `${sizePt}pt`;
            void zoneContent.offsetHeight; // Force reflow
            const scrollH = editor.scrollHeight;
            const overflow = scrollH > availableHeight;
            if (DEBUG_COPYFIT) {
                console.log('🧪 COPYFIT testSize', {
                    zoneId: zoneEl.id,
                    sizePt: Math.round(sizePt * 10) / 10,
                    availableHeight,
                    scrollH,
                    overflow
                });
            }
            return overflow;
        };
        
        // Algorithme par dichotomie pour trouver la taille optimale
        let low = minSize;
        let high = maxSize;
        let optimalSize = minSize;
        
        // D'abord, vérifier si la taille max ne provoque pas d'overflow
        const maxOverflows = testSize(maxSize);
        if (DEBUG_COPYFIT) {
            console.log('🧪 COPYFIT maxSize check', { zoneId: zoneEl.id, maxSize, availableHeight, maxOverflows });
        }
        if (!maxOverflows) {
            // Pas d'overflow à la taille max → on garde la taille max
            optimalSize = maxSize;
        } else {
            // Dichotomie pour trouver la taille optimale
            while ((high - low) > precision && iterations < maxIterations) {
                const mid = (low + high) / 2;
                
                const midOverflows = testSize(mid);
                if (DEBUG_COPYFIT) {
                    console.log('🧪 COPYFIT mid check', {
                        zoneId: zoneEl.id,
                        mid: Math.round(mid * 10) / 10,
                        low: Math.round(low * 10) / 10,
                        high: Math.round(high * 10) / 10,
                        midOverflows
                    });
                }

                if (midOverflows) {
                    // Overflow → taille trop grande, chercher plus petit
                    high = mid;
                } else {
                    // Pas d'overflow → taille OK, on peut essayer plus grand
                    low = mid;
                    optimalSize = mid;
                }
                iterations++;
                if (DEBUG_COPYFIT) {
                    console.log('🧪 COPYFIT dichotomy step', {
                        zoneId: zoneEl.id,
                        iterations,
                        low: Math.round(low * 10) / 10,
                        high: Math.round(high * 10) / 10,
                        mid: Math.round(mid * 10) / 10,
                        optimal: Math.round(optimalSize * 10) / 10
                    });
                }
            }
            
            // Arrondir à 0.1pt près (vers le bas pour éviter tout overflow)
            optimalSize = Math.floor(optimalSize * 10) / 10;
            
            // Vérification finale : s'assurer qu'on n'a pas d'overflow
            while (testSize(optimalSize) && optimalSize > minSize) {
                optimalSize -= 0.1;
                optimalSize = Math.round(optimalSize * 10) / 10; // Éviter les erreurs de floating point
            }
        }
        
        // Appliquer la taille optimale finale
        editor.style.fontSize = `${optimalSize}pt`;
        void zoneContent.offsetHeight; // Force reflow final
        
        if (DEBUG_COPYFIT) {
            console.group(`🧪 COPYFIT - end: ${zoneEl.id}`);
            try {
                console.log('result:', {
                    optimalSize,
                    iterations,
                    availableHeight,
                    finalScrollH: editor.scrollHeight,
                    remainingPx: availableHeight - editor.scrollHeight
                });
                console.log('computed final:', {
                    editorFontSize: getComputedStyle(editor).fontSize,
                    editorLineHeight: getComputedStyle(editor).lineHeight
                });
                console.log('fonts:', document.fonts ? { status: document.fonts.status, size: document.fonts.size } : null);
            } catch (e) {}
            console.groupEnd();
        }
        
        // Restaurer l'alignement vertical original
        if (originalInlineJustifyContent) {
            zoneContent.style.justifyContent = originalInlineJustifyContent;
        } else {
            zoneContent.style.justifyContent = '';
            // Sécurité : si aucune classe CSS n'est présente, réappliquer le computed initial
            if (!zoneContent.classList.contains('valign-top') &&
                !zoneContent.classList.contains('valign-middle') &&
                !zoneContent.classList.contains('valign-bottom')) {
                zoneContent.style.justifyContent = originalComputedJustifyContent;
            }
        }

        // Réactiver le ResizeObserver après un court délai (évite détection immédiate)
        requestAnimationFrame(() => {
            isCopyfitRunning = false;
        });
    }

    /**
     * Installe un ResizeObserver sur une zone textQuill pour recalculer le copyfit
     * automatiquement quand le contenu change de taille (ex: chargement de polices).
     * 
     * Le ResizeObserver surveille le `.ql-editor` et relance le copyfit si le scrollHeight
     * dépasse la hauteur disponible. Un flag `isCopyfitRunning` évite les boucles infinies.
     * 
     * @param {string} zoneId - ID de la zone textQuill
     * @returns {void}
     */
    function installCopyfitResizeObserver(zoneId) {
        // Ne pas réinstaller si déjà présent
        if (copyfitResizeObservers.has(zoneId)) return;

        const zoneEl = document.getElementById(zoneId);
        const quillInstance = quillInstances.get(zoneId);
        if (!zoneEl || !quillInstance || !quillInstance.root) return;

        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData || !zoneData.copyfit) return;

        const editor = quillInstance.root;
        const zoneContent = zoneEl.querySelector('.zone-content');
        if (!editor || !zoneContent) return;

        // Stocker la dernière scrollHeight connue pour détecter les vrais changements
        let lastScrollHeight = editor.scrollHeight;

        const observer = new ResizeObserver((entries) => {
            // Ignorer si un copyfit est déjà en cours (évite boucle infinie)
            if (isCopyfitRunning) return;

            for (const entry of entries) {
                const currentScrollHeight = editor.scrollHeight;
                const availableHeight = zoneContent.clientHeight;

                // Vérifier si le scrollHeight a changé ET dépasse la zone
                if (currentScrollHeight !== lastScrollHeight && currentScrollHeight > availableHeight) {
                    if (DEBUG_COPYFIT) {
                        console.log(`🔄 COPYFIT RESIZE - Recalcul déclenché: ${zoneId}`, {
                            lastScrollHeight,
                            currentScrollHeight,
                            availableHeight,
                            overflow: currentScrollHeight - availableHeight
                        });
                    }

                    lastScrollHeight = currentScrollHeight;

                    // Relancer le copyfit
                    const currentZonesData = getCurrentPageZones();
                    const currentZoneData = currentZonesData[zoneId];
                    if (currentZoneData && currentZoneData.copyfit) {
                        const maxSize = currentZoneData.size || QUILL_DEFAULT_SIZE;
                        applyCopyfitToQuillZone(zoneEl, quillInstance, maxSize);
                        // Mettre à jour lastScrollHeight après le copyfit
                        lastScrollHeight = editor.scrollHeight;
                    }
                }
            }
        });

        // Observer le .ql-editor
        observer.observe(editor);
        copyfitResizeObservers.set(zoneId, observer);

        if (DEBUG_COPYFIT) {
            console.log(`🔧 COPYFIT RESIZE - Observer installé: ${zoneId}`);
        }
    }

    /**
     * Supprime le ResizeObserver d'une zone textQuill (appelé lors de la suppression de la zone).
     * 
     * @param {string} zoneId - ID de la zone textQuill
     * @returns {void}
     */
    function removeCopyfitResizeObserver(zoneId) {
        const observer = copyfitResizeObservers.get(zoneId);
        if (observer) {
            observer.disconnect();
            copyfitResizeObservers.delete(zoneId);
            if (DEBUG_COPYFIT) {
                console.log(`🔧 COPYFIT RESIZE - Observer supprimé: ${zoneId}`);
            }
        }
    }

    // Helper pour l'alignement vertical flexbox (Axe principal en column)
    function mapValignToFlex(valign) {
        if (valign === 'middle') return 'center';
        if (valign === 'bottom') return 'flex-end';
        return 'flex-start'; // top
    }

    function getQrPlaceholderSvg() {
        return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#ffffff" />
    <rect x="5" y="5" width="25" height="25" fill="#000000" />
    <rect x="70" y="5" width="25" height="25" fill="#000000" />
    <rect x="5" y="70" width="25" height="25" fill="#000000" />
    <rect x="32" y="32" width="12" height="12" fill="#000000" />
    <rect x="50" y="32" width="12" height="12" fill="#000000" />
    <rect x="32" y="50" width="12" height="12" fill="#000000" />
    <rect x="50" y="50" width="12" height="12" fill="#000000" />
</svg>`;
    }

    // --- FONCTIONS POUR ZONES IMAGE ---
    
    /**
     * Met à jour l'affichage d'une zone image (image réelle ou placeholder)
     */

    /**
     * Met à jour l'affichage visuel d'une zone image dans le DOM.
     * Gère l'affichage de l'image selon son mode de redimensionnement et sa source.
     * 
     * Types de source gérés :
     * - 'fixe' avec imageBase64 : Image uploadée en base64
     * - 'fixe' avec valeur URL : Image depuis URL (rétrocompat)
     * - 'url' : Ancien format URL (rétrocompat)
     * - 'champ' : Champ de fusion → affiche un placeholder
     * 
     * Modes de redimensionnement :
     * - 'initial' : Taille native de l'image
     * - 'ajuster' : Image inscrite dans la zone (object-fit: contain)
     * - 'couper' : Image remplit la zone (object-fit: cover)
     * 
     * @param {string|HTMLElement} zoneIdOrEl - ID de la zone ("zone-1") ou élément DOM
     * @param {ImageZoneData} [zoneDataParam] - Données de la zone (requis si zoneIdOrEl est un élément)
     * @returns {void}
     * 
     * @example
     * // Appel par ID (récupère les données automatiquement)
     * updateImageZoneDisplay('zone-1');
     * 
     * // Appel avec élément et données (pendant création)
     * updateImageZoneDisplay(zoneEl, zoneData);
     * 
     * @see updateDpiBadge - Mise à jour du badge DPI après affichage
     */
    function updateImageZoneDisplay(zoneIdOrEl, zoneDataParam) {
        // Supporter les deux signatures : (zoneEl, zoneData) et (zoneId)
        let zoneEl, zoneData;
        
        if (typeof zoneIdOrEl === 'string') {
            // Appelé avec un ID
            const zonesData = getCurrentPageZones();
            zoneData = zonesData[zoneIdOrEl];
            if (!zoneData || zoneData.type !== 'image') return;
            zoneEl = document.getElementById(zoneIdOrEl);
        } else {
            // Appelé avec un élément DOM et des données
            zoneEl = zoneIdOrEl;
            zoneData = zoneDataParam;
        }
        
        if (!zoneEl) return;
        
        const contentEl = zoneEl.querySelector('.zone-content');
        if (!contentEl) return;
        
        const source = zoneData.source || { type: 'fixe', valeur: '' };
        const redim = zoneData.redimensionnement || { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
        
        // Déterminer l'URL/base64 de l'image
        let imageUrl = null;
        
        if (source.type === 'fixe') {
            if (source.imageBase64) {
                // Image uploadée en base64
                imageUrl = source.imageBase64;
            } else if (source.valeur) {
                // URL fixe (rétrocompatibilité)
                imageUrl = source.valeur;
            }
        } else if (source.type === 'url' && source.valeur) {
            // Ancien format URL (rétrocompatibilité)
            imageUrl = source.valeur;
        } else if (source.type === 'champ') {
            // Champ de fusion : afficher un placeholder spécial
            contentEl.innerHTML = getImagePlaceholderSvg(source.valeur);
            contentEl.classList.remove('has-image');
            contentEl.classList.add('no-image');
            contentEl.style.justifyContent = 'center';
            contentEl.style.alignItems = 'center';
            return;
        }
        
        // Vider le contenu précédent
        contentEl.innerHTML = '';
        
        if (imageUrl) {
            // Afficher l'image
            contentEl.classList.add('has-image');
            contentEl.classList.remove('no-image');
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = source.nomOriginal || 'Image';
            img.draggable = false;
            
            // Appliquer le mode de redimensionnement
            img.style.objectFit = getObjectFitFromMode(redim.mode);
            img.style.objectPosition = getObjectPosition(redim.alignementH, redim.alignementV);
            
            if (redim.mode === 'initial') {
                img.style.width = 'auto';
                img.style.height = 'auto';
                img.style.maxWidth = 'none';
                img.style.maxHeight = 'none';
            } else {
                img.style.width = '100%';
                img.style.height = '100%';
            }
            
            contentEl.appendChild(img);
        } else {
            // Pas d'image : afficher le placeholder
            contentEl.innerHTML = getImagePlaceholderSvg(null);
            contentEl.classList.remove('has-image');
            contentEl.classList.add('no-image');
        }
        
        // Appliquer l'alignement au conteneur (pour mode initial)
        contentEl.style.justifyContent = mapAlignHToFlex(redim.alignementH);
        contentEl.style.alignItems = mapAlignVToFlex(redim.alignementV);
    }
    
    function getObjectFitFromMode(mode) {
        switch (mode) {
            case 'initial': return 'none';
            case 'ajuster': return 'contain';
            case 'couper': return 'cover';
            default: return 'contain';
        }
    }
    
    function getObjectPosition(alignH, alignV) {
        const h = alignH === 'left' ? 'left' : (alignH === 'right' ? 'right' : 'center');
        const v = alignV === 'top' ? 'top' : (alignV === 'bottom' ? 'bottom' : 'center');
        return `${h} ${v}`;
    }
    
    function mapAlignHToFlex(align) {
        if (align === 'left') return 'flex-start';
        if (align === 'right') return 'flex-end';
        return 'center';
    }
    
    function mapAlignVToFlex(align) {
        if (align === 'top') return 'flex-start';
        if (align === 'bottom') return 'flex-end';
        return 'center';
    }
    
    /**
     * Génère le SVG placeholder pour les zones image.
     * Comprend un cadre avec bordure arrondie et une icône centrale.
     * L'icône est homothétique (conserve ses proportions) et centrée dans la zone.
     * 
     * @param {string|null} champName - Nom du champ de fusion (affiche @NOM@ si défini)
     * @param {string} [color=THEME_COLOR] - Couleur de l'icône (défaut: couleur thème)
     * @param {number} [scale=IMAGE_PLACEHOLDER_SCALE] - Proportion de l'icône (0.5 = 50% de la zone)
     * @param {number} [inset=IMAGE_PLACEHOLDER_INSET] - Marge intérieure du cadre en pixels
     * @param {number} [borderRadius=IMAGE_PLACEHOLDER_BORDER_RADIUS] - Rayon des coins arrondis en pixels
     * @param {number} [borderWidth=IMAGE_PLACEHOLDER_BORDER_WIDTH] - Épaisseur de la bordure en pixels
     * @returns {string} HTML du placeholder (cadre + icône)
     * 
     * @example
     * getImagePlaceholderSvg(null);                    // Placeholder standard
     * getImagePlaceholderSvg('PHOTO');                 // Affiche @PHOTO@
     * getImagePlaceholderSvg(null, '#ff0000', 0.6);   // Rouge, 60% de la zone
     */
    function getImagePlaceholderSvg(champName, color = THEME_COLOR, scale = IMAGE_PLACEHOLDER_SCALE, inset = IMAGE_PLACEHOLDER_INSET, borderRadius = IMAGE_PLACEHOLDER_BORDER_RADIUS, borderWidth = IMAGE_PLACEHOLDER_BORDER_WIDTH) {
        const label = champName ? `@${champName}@` : '';
        const scalePercent = Math.round(scale * 100);
        
        return `
<div style="position: relative; width: 100%; height: 100%;">
    <!-- Cadre avec bordure arrondie -->
    <div style="position: absolute; top: ${inset}px; left: ${inset}px; right: ${inset}px; bottom: ${inset}px; border: ${borderWidth}px solid ${color}; border-radius: ${borderRadius}px; pointer-events: none;"></div>
    
    <!-- Icône centrale -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" 
             style="width: ${scalePercent}%; max-height: ${scalePercent}%; aspect-ratio: 1;">
            <path fill="${color}" d="M85.3 7.5H14.7C8 7.5 2.5 13 2.5 19.7v60.6c0 6.7 5.5 12.2 12.2 12.2h70.6c6.7 0 12.2-5.5 12.2-12.2V19.7c0-6.7-5.5-12.2-12.2-12.2zM14.7 13.9h70.6c3.2 0 5.8 2.6 5.8 5.8v29.2L79 36.9c-2.1-2.1-5.6-2.1-7.8 0l-23 23-10.3-10.4c-2.1-2.1-5.6-2.1-7.8 0L8.9 70.8V19.7c0-3.2 2.6-5.8 5.8-5.8z"/>
            <path fill="${color}" d="M50.4 30.3c0 4.9-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9"/>
        </svg>
        ${label ? `<span style="font-size: 11px; color: ${color}; font-weight: 500;">${label}</span>` : ''}
    </div>
</div>`;
    }
    
    /**
     * Remplit le select des champs de fusion de type IMG pour les zones image
     * Affiche le libelle, trie par ordre, utilise nom comme value
     * @param {string} [selectedValue=''] - Valeur à pré-sélectionner
     */
    function populateImageFieldsSelect(selectedValue = '') {
        if (!imageInputChamp) return;
        
        imageInputChamp.innerHTML = '';
        
        // Récupérer les champs de fusion (protection si documentState pas encore initialisé)
        let champs;
        try {
            champs = (documentState && documentState.champsFusion) || mergeFields || [];
        } catch (e) {
            champs = mergeFields || [];
        }
        
        // Filtrer les champs de type IMG uniquement
        const imgChamps = champs.filter(c => {
            if (typeof c === 'object') return c.type === 'IMG';
            return false;
        });
        
        // Trier par ordre croissant
        const champsTries = [...imgChamps].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        
        // Ajouter une option vide
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Sélectionner un champ --';
        imageInputChamp.appendChild(emptyOption);
        
        // Ajouter les champs triés
        champsTries.forEach(champ => {
            const option = document.createElement('option');
            const fieldName = champ.nom;                    // Valeur technique
            const fieldLabel = champ.libelle || champ.nom;  // Libellé affiché
            option.value = fieldName;
            option.textContent = fieldLabel;
            if (fieldName === selectedValue) option.selected = true;
            imageInputChamp.appendChild(option);
        });
        
        console.log(`🖼️ populateImageFieldsSelect: ${champsTries.length} champ(s) IMG disponible(s)`);
    }
    
    // ========================================
    // FONCTIONS CODE-BARRES
    // ========================================
    
    /**
     * Remplit le select des champs de fusion pour les zones code-barres
     * Affiche le libelle, trie par ordre, utilise nom comme value
     * Inclut tous les types de champs (TXT, SYS) sauf IMG
     */
    function updateBarcodeFieldSelect() {
        if (!barcodeInputField) return;
        
        // Vider et ajouter l'option par défaut
        barcodeInputField.innerHTML = '';
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Sélectionner un champ --';
        barcodeInputField.appendChild(emptyOption);
        
        // Récupérer les champs de fusion (protection si documentState pas encore initialisé)
        let champs;
        try {
            champs = (documentState && documentState.champsFusion) || mergeFields || [];
        } catch (e) {
            champs = mergeFields || [];
        }
        
        // Normaliser si nécessaire (tableau de strings)
        const champsNormalises = champs.map((champ, index) => {
            if (typeof champ === 'string') {
                return { nom: champ.toUpperCase().replace(/\s+/g, '_'), libelle: champ, type: 'TXT', ordre: index + 1 };
            }
            return champ;
        });
        
        // Filtrer : exclure les champs IMG (pas pertinent pour code-barres)
        const champsBarcode = champsNormalises.filter(c => c.type !== 'IMG');
        
        // Trier par ordre croissant
        const champsTries = [...champsBarcode].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        
        // Ajouter les champs triés
        champsTries.forEach(champ => {
            const option = document.createElement('option');
            const fieldName = champ.nom;                    // Valeur technique
            const fieldLabel = champ.libelle || champ.nom;  // Libellé affiché
            const fieldType = champ.type || 'TXT';
            
            option.value = fieldName;
            // Afficher le libellé + indication du type si SYS
            option.textContent = fieldLabel + (fieldType === 'SYS' ? ' (système)' : '');
            barcodeInputField.appendChild(option);
        });
        
        console.log(`📊 updateBarcodeFieldSelect: ${champsTries.length} champ(s) disponible(s) pour code-barres`);
    }
    
    /**
     * Met à jour tous les selects de champs de fusion (image et code-barres)
     * Appelée après chargement des champs ou modification de la liste
     * Vérifie que documentState est initialisé avant d'exécuter
     */
    function updateAllFieldSelects() {
        // Protection : documentState peut ne pas être encore initialisé au chargement
        // (variable let dans la TDZ - temporal dead zone)
        try {
            if (!documentState) return;
        } catch (e) {
            // documentState pas encore déclaré/initialisé
            return;
        }
        populateImageFieldsSelect('');
        updateBarcodeFieldSelect();
        console.log('🔄 updateAllFieldSelects: tous les combos de champs mis à jour');
    }
    
    /**
     * Met à jour l'affichage visuel d'une zone code-barres (nouveau type 'barcode').
     * Génère l'image du code-barres via bwip-js et met à jour les badges.
     * 
     * Éléments mis à jour :
     * - Image du code-barres (via generateBarcodeImage)
     * - Badge type (en haut à gauche, ex: "Code 128")
     * - Badge champ (en bas à droite, ex: "@NumeroCommande" ou "(Aucun champ)")
     * - Texte lisible optionnel sous le code
     * - Classe CSS 1D/2D pour l'étirement correct
     * 
     * @param {string} zoneId - Identifiant de la zone (ex: "zone-1")
     * @returns {void}
     * 
     * @example
     * // Après modification du type ou du champ de fusion
     * zoneData.typeCodeBarres = 'ean13';
     * zoneData.champFusion = 'CodeEAN';
     * updateBarcodeZoneDisplay('zone-1');
     * 
     * @see generateBarcodeImage - Génération de l'image code-barres
     * @see updateQrZoneDisplay - Pour les zones QR (ancien format)
     * @see BARCODE_BWIPJS_CONFIG - Configuration des types de code-barres
     */
    function updateBarcodeZoneDisplay(zoneId) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData || zoneData.type !== 'barcode') return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // Récupérer les propriétés du code-barres
        const typeCode = zoneData.typeCodeBarres || 'code128';
        const color = zoneData.couleur || '#000000';
        const texteLisible = zoneData.texteLisible || 'dessous';
        const taillePolice = zoneData.taillePolice || 8;
        
        // Récupérer la valeur fictive pour le texte
        const config = BARCODE_BWIPJS_CONFIG[typeCode];
        const sampleValue = config ? config.sampleValue : 'SAMPLE';
        
        // Mettre à jour la classe 1D/2D pour l'étirement
        updateBarcodeDimensionClass(zoneEl, typeCode);
        
        // Supprimer l'ancien conteneur de badges s'il existe
        const oldBadgesContainer = zoneEl.querySelector('.barcode-badges');
        if (oldBadgesContainer) {
            oldBadgesContainer.remove();
        }
        
        // Badge du type - en haut à gauche, au-dessus du cadre
        let typeBadge = zoneEl.querySelector('.barcode-type-badge');
        if (!typeBadge) {
            typeBadge = document.createElement('span');
            typeBadge.className = 'barcode-type-badge';
            zoneEl.appendChild(typeBadge);
        }
        typeBadge.textContent = getBarcodeTypeLabel(typeCode);
        
        // Badge du champ - en bas à droite, en-dessous du cadre
        let fieldBadge = zoneEl.querySelector('.barcode-field-badge');
        if (!fieldBadge) {
            fieldBadge = document.createElement('span');
            fieldBadge.className = 'barcode-field-badge';
            zoneEl.appendChild(fieldBadge);
        }
        
        // Vérifier si un champ est sélectionné
        const champFusion = zoneData.champFusion || '';
        const hasField = champFusion && champFusion.trim() !== '';
        
        if (hasField) {
            fieldBadge.textContent = getFieldDisplayName(champFusion);
            fieldBadge.classList.remove('no-field');
        } else {
            fieldBadge.textContent = '(Aucun champ)';
            fieldBadge.classList.add('no-field');
        }
        
        // Générer l'image du code-barres (fond transparent, le fond est géré par CSS)
        const barcodeImage = generateBarcodeImage(typeCode, color);
        
        // Vérifier si c'est un code 2D (jamais de texte pour les codes 2D)
        const is2D = config ? config.is2D : false;
        
        // Mettre à jour le contenu : image + texte HTML séparé
        const svgContainer = zoneEl.querySelector('.barcode-svg');
        if (svgContainer) {
            let html = `<img class="barcode-image" src="${barcodeImage}" alt="${typeCode}">`;
            
            // Ajouter le texte SEULEMENT pour les codes 1D
            if (!is2D && texteLisible !== 'aucun') {
                html += `<span class="barcode-text" style="font-size: ${taillePolice}pt; color: ${color};">${sampleValue}</span>`;
            }
            
            svgContainer.innerHTML = html;
        }
        
        // Supprimer l'ancien label du bas (plus nécessaire)
        const label = zoneEl.querySelector('.barcode-label');
        if (label) {
            label.remove();
        }
        
        // Ajuster les dimensions si passage 1D <-> 2D
        if (is2D && Math.abs(zoneData.w - zoneData.h) > 10) {
            // Pour les 2D, rendre carré (prendre la plus petite dimension)
            const size = Math.min(zoneData.w || 100, zoneData.h || 100);
            zoneData.w = size;
            zoneData.h = size;
            zoneEl.style.width = size + 'px';
            zoneEl.style.height = size + 'px';
        }
    }
    
    /**
     * Met à jour l'affichage visuel d'une zone QR code (ancien type 'qr').
     * Génère l'image du code QR via bwip-js et met à jour les badges.
     * 
     * Note : Ce type 'qr' est l'ancien format pour rétrocompatibilité.
     * Les nouvelles zones code-barres utilisent le type 'barcode'.
     * 
     * Éléments mis à jour :
     * - Image du code QR (via generateBarcodeImage)
     * - Badge type (ex: "QR Code", "Data Matrix")
     * - Texte lisible optionnel
     * - Classe CSS 2D pour affichage carré
     * 
     * @param {string} zoneId - Identifiant de la zone (ex: "zone-1")
     * @returns {void}
     * 
     * @example
     * // Mettre à jour après changement de couleur
     * zoneData.qrColor = '#0000FF';
     * updateQrZoneDisplay('zone-1');
     * 
     * @see updateBarcodeZoneDisplay - Pour les zones code-barres (nouveau format)
     * @see generateBarcodeImage - Génération de l'image
     */
    function updateQrZoneDisplay(zoneId) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData || zoneData.type !== 'qr') return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const contentEl = zoneEl.querySelector('.zone-content');
        if (!contentEl) return;
        
        // Récupérer les propriétés du code-barres
        const typeCode = zoneData.typeCode || 'QRCode';
        const content = zoneData.content || '';
        const color = zoneData.qrColor || '#000000';
        const taillePolice = zoneData.taillePolice || 8;
        
        // Récupérer la valeur fictive pour le texte
        const config = BARCODE_BWIPJS_CONFIG[typeCode];
        const sampleValue = config ? config.sampleValue : 'SAMPLE';
        
        // Mettre à jour la classe 1D/2D pour l'étirement
        updateBarcodeDimensionClass(zoneEl, typeCode);
        
        // Déterminer si le texte est visible
        let texteLisible = 'dessous';
        if (zoneData.texteLisible) {
            texteLisible = zoneData.texteLisible;
        } else if (zoneData.includeText === false) {
            texteLisible = 'aucun';
        }
        
        // Supprimer l'ancien conteneur de badges s'il existe
        const oldBadgesContainer = zoneEl.querySelector('.barcode-badges');
        if (oldBadgesContainer) {
            oldBadgesContainer.remove();
        }
        
        // Badge du type - en haut à gauche, au-dessus du cadre
        let typeBadge = zoneEl.querySelector('.barcode-type-badge');
        if (!typeBadge) {
            typeBadge = document.createElement('span');
            typeBadge.className = 'barcode-type-badge';
            zoneEl.appendChild(typeBadge);
        }
        typeBadge.textContent = getBarcodeTypeLabel(typeCode.toLowerCase());
        
        // Badge du champ - en bas à droite, en-dessous du cadre
        let fieldBadge = zoneEl.querySelector('.barcode-field-badge');
        if (!fieldBadge) {
            fieldBadge = document.createElement('span');
            fieldBadge.className = 'barcode-field-badge';
            zoneEl.appendChild(fieldBadge);
        }
        
        // Vérifier si un champ est sélectionné
        const hasField = content && content.trim() !== '';
        
        if (hasField) {
            fieldBadge.textContent = getFieldDisplayName(content);
            fieldBadge.classList.remove('no-field');
        } else {
            fieldBadge.textContent = '(Aucun champ)';
            fieldBadge.classList.add('no-field');
        }
        
        // Générer l'image du code-barres (fond transparent, le fond est géré par CSS)
        const barcodeImage = generateBarcodeImage(typeCode, color);
        
        // Vérifier si c'est un code 2D (jamais de texte pour les codes 2D)
        const is2D = config ? config.is2D : false;
        
        // Construire le HTML : image + texte séparé
        let html = `<img class="barcode-image" src="${barcodeImage}" alt="${typeCode}">`;
        
        // Ajouter le texte SEULEMENT pour les codes 1D
        if (!is2D && texteLisible !== 'aucun') {
            html += `<span class="barcode-text" style="font-size: ${taillePolice}pt; color: ${color};">${sampleValue}</span>`;
        }
        
        contentEl.innerHTML = html;
    }
    
    /**
     * Met à jour les données de la zone code-barres active depuis les contrôles
     */
    function updateActiveBarcodeZoneData() {
        if (selectedZoneIds.length !== 1) return;

        const selectedId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[selectedId];
        if (!zoneData || zoneData.type !== 'barcode') return;
        
        // Bloquer si zone système
        if (zoneData.systeme) return;
        
        // Mettre à jour les données
        if (inputBarcodeName) zoneData.nom = inputBarcodeName.value;
        if (inputBarcodeType) zoneData.typeCodeBarres = inputBarcodeType.value;
        if (barcodeInputField) zoneData.champFusion = barcodeInputField.value;
        if (inputBarcodeReadable) zoneData.texteLisible = inputBarcodeReadable.value;
        if (inputBarcodeFontsize) zoneData.taillePolice = parseInt(inputBarcodeFontsize.value) || 8;
        if (inputBarcodeColor) zoneData.couleur = inputBarcodeColor.value;
        
        // Mettre à jour l'affichage
        updateBarcodeZoneDisplay(selectedId);
        
        // Sauvegardes
        saveToLocalStorage();
        notifyParentOfChange();
    }
    
    // Listeners pour les contrôles code-barres
    if (inputBarcodeName) {
        inputBarcodeName.addEventListener('input', () => {
            updateActiveBarcodeZoneData();
        });
    }
    
    if (inputBarcodeType) {
        inputBarcodeType.addEventListener('change', () => {
            const newType = inputBarcodeType.value;
            const config = BARCODE_BWIPJS_CONFIG[newType];
            const is2D = config ? config.is2D : false;
            
            // Masquer/afficher les options selon le type 1D/2D
            if (is2D) {
                // Codes 2D : masquer les options texte lisible
                if (barcodeReadableGroup) barcodeReadableGroup.style.display = 'none';
                if (barcodeFontsizeGroup) barcodeFontsizeGroup.style.display = 'none';
                
                // Rendre la zone carrée pour les codes 2D
                if (selectedZoneIds.length === 1) {
                    const selectedId = selectedZoneIds[0];
                    const zoneEl = document.getElementById(selectedId);
                    const zonesData = getCurrentPageZones();
                    const zoneData = zonesData[selectedId];
                    
                    if (zoneEl && zoneData) {
                        const currentWidth = zoneEl.offsetWidth;
                        const currentHeight = zoneEl.offsetHeight;
                        const size = Math.max(currentWidth, currentHeight);
                        
                        zoneEl.style.width = size + 'px';
                        zoneEl.style.height = size + 'px';
                        zoneData.w = size;
                        zoneData.h = size;
                        
                        // Mettre à jour l'affichage de la géométrie
                        updateGeomDisplay(zoneEl);
                    }
                }
            } else {
                // Codes 1D : afficher les options texte
                if (barcodeReadableGroup) barcodeReadableGroup.style.display = '';
                if (barcodeFontsizeGroup) {
                    // Afficher seulement si texte lisible !== 'aucun'
                    barcodeFontsizeGroup.style.display = inputBarcodeReadable.value === 'aucun' ? 'none' : '';
                }
            }
            
            updateActiveBarcodeZoneData();
            saveState();
        });
    }
    
    if (barcodeInputField) {
        barcodeInputField.addEventListener('change', () => {
            updateActiveBarcodeZoneData();
            saveState();
        });
    }
    
    if (inputBarcodeReadable) {
        inputBarcodeReadable.addEventListener('change', () => {
            // Masquer/afficher le champ taille police selon la valeur
            if (barcodeFontsizeGroup) {
                barcodeFontsizeGroup.style.display = inputBarcodeReadable.value === 'aucun' ? 'none' : '';
            }
            updateActiveBarcodeZoneData();
            saveState();
        });
    }
    
    if (inputBarcodeFontsize) {
        inputBarcodeFontsize.addEventListener('change', () => {
            updateActiveBarcodeZoneData();
            saveState();
        });
        inputBarcodeFontsize.addEventListener('input', () => {
            updateActiveBarcodeZoneData();
        });
    }
    
    if (inputBarcodeColor) {
        inputBarcodeColor.addEventListener('input', () => {
            updateActiveBarcodeZoneData();
        });
        inputBarcodeColor.addEventListener('change', () => {
            saveState();
        });
    }
    
    /**
     * Met à jour les données de la zone image active depuis les contrôles
     */
    function updateActiveImageZoneData() {
        if (selectedZoneIds.length !== 1) return;
        
        const selectedId = selectedZoneIds[0];
        const zoneEl = document.getElementById(selectedId);
        if (!zoneEl) return;
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[selectedId];
        if (!zoneData || zoneData.type !== 'image') return;
        
        // Bloquer si zone système
        if (zoneData.systeme) return;
        
        // Mettre à jour la source (avec vérifications null)
        if (imageInputSourceType) {
            const sourceType = imageInputSourceType.value;
            
            // Préserver les données existantes (base64, dimensions, etc.)
            const existingSource = zoneData.source || {};
            
            zoneData.source = {
                type: sourceType,
                // Pour 'champ' : utiliser le nom du champ de fusion
                // Pour 'fixe' : valeur vide (image stockée en base64)
                valeur: sourceType === 'champ' ? (imageInputChamp?.value || '') : '',
                // Propriétés pour images uploadées (préservées si existantes)
                imageBase64: existingSource.imageBase64 || null,
                nomOriginal: existingSource.nomOriginal || null,
                largeurPx: existingSource.largeurPx || null,
                hauteurPx: existingSource.hauteurPx || null,
                poidsBrut: existingSource.poidsBrut || null,
                poidsCompresse: existingSource.poidsCompresse || null
            };
        }
        
        // Mettre à jour le redimensionnement (avec vérifications null)
        if (imageInputMode) {
            zoneData.redimensionnement = {
                mode: imageInputMode.value,
                alignementH: getToggleGroupPocValue('image-align-h-group') || 'center',
                alignementV: getToggleGroupPocValue('image-align-v-group') || 'middle'
            };
        }
        
        // Mettre à jour fond
        if (inputBgColor) zoneData.bgColor = inputBgColor.value;
        if (chkTransparent) zoneData.isTransparent = chkTransparent.checked;
        if (chkLock) zoneData.locked = chkLock.checked;
        
        // Mettre à jour bordure
        if (!zoneData.border) zoneData.border = {};
        if (inputBorderWidth) zoneData.border.width = parseFloat(inputBorderWidth.value) || 0;
        if (inputBorderColor) zoneData.border.color = inputBorderColor.value;
        if (inputBorderStyle) zoneData.border.style = inputBorderStyle.value;
        
        // Appliquer les styles visuels au DOM
        if (chkTransparent?.checked) {
            zoneEl.style.backgroundColor = 'transparent';
        } else if (inputBgColor) {
            zoneEl.style.backgroundColor = inputBgColor.value;
        }
        
        // Appliquer la bordure
        applyBorderToZone(zoneEl, zoneData.border);
        
        // Verrouillage
        if (chkLock?.checked) {
            zoneEl.classList.add('locked');
        } else {
            zoneEl.classList.remove('locked');
        }
        
        // Activer/désactiver les champs de géométrie selon le verrouillage
        if (inputX) inputX.disabled = chkLock?.checked || false;
        if (inputY) inputY.disabled = chkLock?.checked || false;
        if (inputW) inputW.disabled = chkLock?.checked || false;
        if (inputH) inputH.disabled = chkLock?.checked || false;
        
        // IMPORTANT : Mettre à jour l'affichage de l'image
        updateImageZoneDisplay(zoneEl, zoneData);
        
        updateHandlesVisibility();
        saveToLocalStorage();
    }
    
    /**
     * Fonction wrapper qui détecte le type de zone et appelle la bonne fonction de mise à jour.
     * Utilisée pour les contrôles communs (bordure, fond, verrouillage).
     * Note : Les zones textQuill sont gérées directement par Quill et les toolbars flottantes.
     */
    function updateActiveZone() {
        if (selectedZoneIds.length !== 1) return;
        
        const selectedId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[selectedId];
        
        if (!zoneData) return;
        
        if (zoneData.type === 'image') {
            updateActiveImageZoneData();
        } else if (zoneData.type === 'qr') {
            updateActiveQrZoneData();
        }
        // Note : textQuill, barcode et qrcode sont gérés par leurs toolbars respectives
    }
    
    /**
     * Met à jour les données d'une zone QR (verrouillage uniquement)
     */
    function updateActiveQrZoneData() {
        if (selectedZoneIds.length !== 1) return;

        const selectedId = selectedZoneIds[0];
        const zoneEl = document.getElementById(selectedId);
        if (!zoneEl) return;

        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[selectedId];
        if (!zoneData || zoneData.type !== 'qr') return;
        
        // Bloquer si zone système
        if (zoneData.systeme) return;

        // Verrouillage
        zoneData.locked = chkLock.checked;
        if (chkLock.checked) {
            zoneEl.classList.add('locked');
        } else {
            zoneEl.classList.remove('locked');
        }
        
        updateHandlesVisibility();
        saveToLocalStorage();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PHASE 5 : MINI-TOOLBAR CONTEXTUELLE (FORMATAGE PARTIEL QUILL)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Retourne l'ID de la zone `textQuill` sélectionnée (si sélection unique).
     * @returns {string|null}
     */
    function getSelectedTextQuillZoneIdForMiniToolbar() {
        if (selectedZoneIds.length !== 1) return null;
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        if (!zonesData[zoneId] || zonesData[zoneId].type !== 'textQuill') return null;
        return zoneId;
    }

    /**
     * Retourne l'instance Quill active (uniquement si une zone textQuill est sélectionnée).
     * @returns {{zoneId: string, quill: any}|null}
     */
    function getActiveTextQuillForMiniToolbar() {
        const zoneId = getSelectedTextQuillZoneIdForMiniToolbar();
        if (!zoneId) return null;
        const quill = quillInstances.get(zoneId);
        if (!quill) return null;
        return { zoneId, quill };
    }

    /**
     * Met à jour l'état visuel des boutons (gras / souligné) selon la sélection courante Quill.
     * @returns {void}
     */
    function updateMiniToolbarButtonsState() {
        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range) return;

        const format = active.quill.getFormat(range);
        if (btnPartialBold) btnPartialBold.classList.toggle('active', !!format.bold);
        if (btnMiniItalic) btnMiniItalic.classList.toggle('active', !!format.italic);
        if (btnPartialUnderline) btnPartialUnderline.classList.toggle('active', !!format.underline);
    }

    /**
     * Affiche la mini-toolbar au-dessus de la sélection de texte.
     * @returns {void}
     */
    function showMiniToolbar() {
        if (!miniToolbar) return;
        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range || range.length === 0) return;

        console.log('🔧 PHASE 5 - showMiniToolbar()');

        miniToolbar.style.display = 'flex';
        updateMiniToolbarButtonsState();
        updateMiniToolbarPosition();
    }

    /**
     * Masque la mini-toolbar.
     * @returns {void}
     */
    function hideMiniToolbar() {
        if (!miniToolbar) return;
        if (miniToolbar.style.display === 'none') return;

        console.log('🔧 PHASE 5 - hideMiniToolbar()');

        miniToolbar.style.display = 'none';
        miniToolbar.classList.remove('below');
    }

    /**
     * Met à jour la position de la mini-toolbar en fonction de la sélection Quill.
     * Utilise `quill.getBounds()` pour se placer au-dessus de la sélection.
     * @returns {void}
     */
    function updateMiniToolbarPosition() {
        if (!miniToolbar || miniToolbar.style.display === 'none') return;

        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range || range.length === 0) return;

        // Bounds de la sélection (coords relatives au root Quill)
        const bounds = active.quill.getBounds(range.index, range.length);
        const rootRect = active.quill.root.getBoundingClientRect();
        const toolbarRect = miniToolbar.getBoundingClientRect();

        const offset = 10;

        const selectionCenterX = rootRect.left + bounds.left + (bounds.width / 2);
        const selectionTopY = rootRect.top + bounds.top;
        const selectionBottomY = rootRect.top + bounds.top + bounds.height;

        // Position au-dessus de la sélection
        let x = selectionCenterX - (toolbarRect.width / 2);
        let y = selectionTopY - toolbarRect.height - offset;

        // Clamp horizontal
        x = Math.max(10, Math.min(x, window.innerWidth - toolbarRect.width - 10));

        // Si pas de place au-dessus, basculer en dessous
        if (y < 10) {
            y = selectionBottomY + offset;
            miniToolbar.classList.add('below');
        } else {
            miniToolbar.classList.remove('below');
        }

        miniToolbar.style.left = `${x}px`;
        miniToolbar.style.top = `${y}px`;
    }

    /**
     * Applique/retire le gras sur la sélection Quill (formatage partiel).
     * @returns {void}
     */
    function applyPartialBold() {
        console.log('🔧 PHASE 5 - applyPartialBold');

        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }

        const format = active.quill.getFormat(range);
        active.quill.format('bold', !format.bold, 'user');
        updateMiniToolbarButtonsState();
        updateMiniToolbarPosition();
    }

    /**
     * Applique/retire l'italique sur la sélection Quill (formatage partiel).
     * @returns {void}
     */
    function applyPartialItalic() {
        console.log('🔧 PHASE 5 - applyPartialItalic');

        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }

        const format = active.quill.getFormat(range);
        active.quill.format('italic', !format.italic, 'user');
        updateMiniToolbarButtonsState();
        updateMiniToolbarPosition();
    }

    /**
     * Applique/retire le soulignement sur la sélection Quill (formatage partiel).
     * @returns {void}
     */
    function applyPartialUnderline() {
        console.log('🔧 PHASE 5 - applyPartialUnderline');

        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }

        const format = active.quill.getFormat(range);
        active.quill.format('underline', !format.underline, 'user');
        updateMiniToolbarButtonsState();
        updateMiniToolbarPosition();
    }

    /**
     * Applique une couleur sur la sélection Quill (formatage partiel).
     * @param {string} color - Couleur hexadécimale (ex: "#ff0000")
     * @returns {void}
     */
    function applyPartialColor(color) {
        console.log('🔧 PHASE 5 - applyPartialColor:', color);

        const active = getActiveTextQuillForMiniToolbar();
        if (!active) return;

        const range = active.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }

        active.quill.format('color', color, 'user');
        updateMiniToolbarPosition();
    }

    /**
     * Handler central pour les changements de sélection Quill.
     * Affiche/masque la mini-toolbar selon la présence d'une sélection non vide.
     *
     * @param {string} zoneId - ID de la zone textQuill
     * @param {{index: number, length: number}|null} range - Sélection courante (null si blur)
     * @returns {void}
     */
    function handleTextQuillSelectionChange(zoneId, range) {
        // Ignorer si ce n'est pas la zone sélectionnée (ou si multi-sélection)
        const selectedId = getSelectedTextQuillZoneIdForMiniToolbar();
        if (!selectedId || selectedId !== zoneId) {
            hideMiniToolbar();
            return;
        }

        if (!range || range.length === 0) {
            hideMiniToolbar();
            return;
        }

        showMiniToolbar();
    }

    /**
     * Initialise les événements de la mini-toolbar (boutons + fermeture au clic extérieur).
     * @returns {void}
     */
    function initMiniToolbarEvents() {
        if (!miniToolbar) return;

        // Empêcher la propagation pour éviter la désélection / perte de focus
        miniToolbar.addEventListener('mousedown', (e) => e.stopPropagation());
        miniToolbar.addEventListener('click', (e) => e.stopPropagation());

        if (btnPartialBold) {
            btnPartialBold.addEventListener('click', (e) => {
                e.stopPropagation();
                applyPartialBold();
                getActiveTextQuillForMiniToolbar()?.quill?.focus();
            });
        }

        if (btnMiniItalic) {
            btnMiniItalic.addEventListener('click', (e) => {
                e.stopPropagation();
                applyPartialItalic();
                getActiveTextQuillForMiniToolbar()?.quill?.focus();
            });
        }

        if (btnPartialUnderline) {
            btnPartialUnderline.addEventListener('click', (e) => {
                e.stopPropagation();
                applyPartialUnderline();
                getActiveTextQuillForMiniToolbar()?.quill?.focus();
            });
        }

        if (btnPartialColor && partialColorPicker) {
            btnPartialColor.addEventListener('click', (e) => {
                e.stopPropagation();
                partialColorPicker.click();
            });

            partialColorPicker.addEventListener('input', (e) => {
                applyPartialColor(e.target.value);
                getActiveTextQuillForMiniToolbar()?.quill?.focus();
            });
        }

        // Repositionner au scroll/resize (si visible)
        window.addEventListener('resize', () => updateMiniToolbarPosition());
        if (workspace) {
            workspace.addEventListener('scroll', () => updateMiniToolbarPosition(), { passive: true });
        }

        // Fermer si clic ailleurs (fallback, Quill émet déjà selection-change=null)
        document.addEventListener('mousedown', (e) => {
            if (!miniToolbar || miniToolbar.style.display === 'none') return;
            if (e.target.closest && e.target.closest('#mini-toolbar')) return;
            if (e.target.closest && (e.target.closest('.ql-editor') || e.target.closest('.quill-editor'))) return;
            hideMiniToolbar();
        });
    }

    // ─────────────────────────────── FIN SECTION 15 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 16 : EVENT LISTENERS - FORMULAIRE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Écouteurs d'événements pour les contrôles du formulaire.
     * Gère la synchronisation entre l'UI et les données des zones.
     * 
     * Note : Les listeners de l'ancien type 'text' (inputContent, inputFont, inputSize, etc.)
     * ont été supprimés. Les zones textQuill sont gérées par Quill et les toolbars flottantes.
     * 
     * Listeners image :
     *   - imageInputSourceType, imageInputChamp, imageInputMode
     *   - imageAlignHGroup, imageAlignVGroup, imageFileInput
     * 
     * Listeners communs :
     *   - inputBgColor, inputBorderColor, inputBorderStyle
     *   - chkTransparent, chkLock
     * 
     * Dépendances :
     *   - updateActiveZone(), updateActiveImageZoneData(), updateActiveQrZoneData()
     *   - saveState() (Section 11)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    // NOTE: Les listeners pour inputContent, inputFont, inputSize, inputColor, inputAlign, 
    // inputValign, inputLineHeight ont été supprimés car ces inputs sont null 
    // et l'ancien type 'text' a été remplacé par textQuill (géré par Quill).
    
    // Contrôles COMMUNS (fond, bordure) - utilisent updateActiveZone()
    [inputBgColor, inputBorderColor, inputBorderStyle].forEach(el => {
        if (!el) return;
        
        // Pour les color pickers : input pour l'aperçu temps réel
        if (el.type === 'color') {
            el.addEventListener('input', () => {
                updateActiveZone(); // Aperçu temps réel sans snapshot
            });
        }
        
        // Pour tous : change pour la sauvegarde finale
        el.addEventListener('change', () => {
            updateActiveZone();
            saveState(); // Snapshot APRÈS le changement
        });
    });
    
    // NOTE: Le listener chkCopyfit a été supprimé car il utilisait updateActiveZoneData() 
    // qui gérait l'ancien type 'text'. Le copyfit pour textQuill est géré par applyQuillZoneStyles().
    
    // 3a. Select Lignes vides (SPÉCIFIQUE AU TEXTE)
    // NOTE: Pour les zones textQuill, la gestion des lignes vides est gérée différemment via Quill
    if (inputEmptyLines) {
        inputEmptyLines.addEventListener('change', () => {
            if (selectedZoneIds.length !== 1) return;
            
            const zoneId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneId];
            
            if (zoneData && zoneData.type === 'textQuill') {
                zoneData.emptyLines = parseInt(inputEmptyLines.value, 10);
                saveToLocalStorage();
                saveState();
            }
        });
    }
    
    // 3b. Checkboxes COMMUNS (fond transparent, verrouillage)
    [chkTransparent, chkLock].forEach(el => {
        if (!el) return;
        el.addEventListener('change', () => {
            updateActiveZone(); // Appliquer selon le type de zone
            saveState(); // Snapshot APRÈS le changement
        });
    });
    
    // --- LISTENERS POUR ZONES IMAGE ---
    
    if (imageInputSourceType) {
        imageInputSourceType.addEventListener('change', () => {
            const sourceType = imageInputSourceType.value;
            const isChamp = sourceType === 'champ';
            
            // 'fixe' : afficher le groupe upload
            // 'champ' : afficher le select des champs de fusion
            if (imageUploadGroup) imageUploadGroup.style.display = isChamp ? 'none' : 'block';
            if (imageChampGroup) imageChampGroup.style.display = isChamp ? 'block' : 'none';
            
            if (isChamp) populateImageFieldsSelect('');
            updateActiveImageZoneData();
            saveState();
        });
    }
    
    if (imageInputChamp) {
        imageInputChamp.addEventListener('change', () => {
            updateActiveImageZoneData();
            saveState();
        });
    }
    
    if (imageInputMode) {
        imageInputMode.addEventListener('change', () => {
            updateActiveImageZoneData();
            updateDpiIndicator(); // Recalculer le DPI avec le nouveau mode
            // Mettre à jour le badge DPI externe
            if (selectedZoneIds.length === 1) {
                updateImageDpiBadge(selectedZoneIds[0]);
            }
            updateSnapToContentButton(); // Activer/désactiver selon le mode
            saveState();
        });
    }
    
    // Note : Les toggle-groups image sont initialisés dans initImageToolbarComponents()
    
    // ========================================
    // EVENT LISTENERS - Upload Image
    // ========================================
    
    // Bouton Importer : ouvre le sélecteur de fichier
    if (imageBtnImport) {
        imageBtnImport.addEventListener('click', () => {
            if (imageFileInput) imageFileInput.click();
        });
    }
    
    // Sélection d'un fichier
    if (imageFileInput) {
        imageFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Réinitialiser l'input pour permettre de resélectionner le même fichier
            e.target.value = '';
            
            // Vérifier qu'une zone image est sélectionnée
            if (selectedZoneIds.length !== 1) return;
            const selectedId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[selectedId];
            if (!zoneData || zoneData.type !== 'image') return;
            
            hideImageUploadError();
            
            // 1. Validation du format
            if (!isImageFormatAccepted(file.name)) {
                showImageUploadError('Format non supporté. Formats acceptés : JPG, PNG, WebP, SVG');
                return;
            }
            
            // 2. Validation du poids (max 10 Mo)
            if (file.size > IMAGE_MAX_UPLOAD_SIZE) {
                showImageUploadError(`Fichier trop volumineux (max ${formatFileSize(IMAGE_MAX_UPLOAD_SIZE)})`);
                return;
            }
            
            try {
                showImageLoading(true);
                
                let result;
                
                // 3. Traitement selon le type de fichier
                if (isSvgFile(file.name)) {
                    // SVG : pas de compression
                    result = await readSvgFile(file);
                } else {
                    // Image bitmap : compression
                    result = await compressImage(file);
                }
                
                showImageLoading(false);
                
                // 4. Vérification poids après compression
                if (result.size > IMAGE_MAX_COMPRESSED_SIZE) {
                    showImageUploadError(`Impossible de compresser l'image sous ${formatFileSize(IMAGE_MAX_COMPRESSED_SIZE)}`);
                    return;
                }
                
                // 5. Stocker dans zoneData.source
                zoneData.source = {
                    type: 'fixe',
                    valeur: '',
                    imageBase64: result.base64,
                    nomOriginal: file.name,
                    largeurPx: result.width,
                    hauteurPx: result.height,
                    poidsBrut: file.size,
                    poidsCompresse: result.size
                };
                
                // 6. Mettre à jour l'affichage de la zone
                updateImageZoneDisplay(selectedId);
                
                // 7. Mettre à jour l'UI du panneau
                updateImageFileInfoDisplay(zoneData.source);
                
                // 8. Mettre à jour le badge DPI externe
                updateImageDpiBadge(selectedId);
                
                // 9. Mettre à jour le bouton Ajuster au contenu (maintenant que les dimensions sont disponibles)
                updateSnapToContentButton();
                
                // 10. Sauvegarder
                saveToLocalStorage();
                saveState();
                
                console.log(`✅ Image uploadée : ${file.name} (${result.width}×${result.height}, ${formatFileSize(result.size)})`);
                
            } catch (error) {
                showImageLoading(false);
                showImageUploadError(error.message || 'Erreur lors du chargement de l\'image');
                console.error('Erreur upload image:', error);
            }
        });
    }
    
    // Bouton Vider : supprime l'image de la zone
    if (imageBtnClear) {
        imageBtnClear.addEventListener('click', () => {
            // Vérifier qu'une zone image est sélectionnée
            if (selectedZoneIds.length !== 1) return;
            const selectedId = selectedZoneIds[0];
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[selectedId];
            if (!zoneData || zoneData.type !== 'image') return;
            
            // Réinitialiser la source
            zoneData.source = {
                type: 'fixe',
                valeur: '',
                imageBase64: null,
                nomOriginal: null,
                largeurPx: null,
                hauteurPx: null,
                poidsBrut: null,
                poidsCompresse: null
            };
            
            // Mettre à jour l'affichage
            updateImageZoneDisplay(selectedId);
            updateImageFileInfoDisplay(zoneData.source);
            updateImageDpiBadge(selectedId);  // Masque le badge car plus d'image
            
            // Masquer l'indicateur DPI
            if (imageDpiIndicator) imageDpiIndicator.style.display = 'none';
            
            // Sauvegarder
            saveToLocalStorage();
            saveState();
            
            console.log('🗑️ Image vidée de la zone');
        });
    }
    
    // NOTE: Le bloc de gestion des annotations de formatage textarea (inputContent) a été supprimé
    // car il gérait l'ancien type 'text'. Le formatage riche est maintenant géré par Quill (type 'textQuill').
    
    // NOTE: Les boutons de formatage (btnFormatBold, btnFormatColor, btnFormatClear) ont été supprimés
    // car ils étaient liés à l'ancien système textarea (type 'text').
    // Le formatage riche est maintenant géré par Quill (type 'textQuill').

    // --- FONCTIONS D'ESPACEMENT ---
    
    // Ajuster l'écartement horizontal entre les zones (uniforme)
    function spaceZonesHorizontally() {
        if (selectedZoneIds.length < 3) return;
        
        const zonesData = getCurrentPageZones();
        
        // Récupérer toutes les zones avec leurs positions
        const zones = selectedZoneIds
            .map(id => {
                const zone = document.getElementById(id);
                if (!zone) return null;
                if (zonesData[id] && (zonesData[id].locked || zonesData[id].systeme)) return null; // Ignorer les zones verrouillées ou système
                return {
                    id: id,
                    element: zone,
                    left: zone.offsetLeft,
                    width: zone.offsetWidth
                };
            })
            .filter(z => z !== null);
        
        if (zones.length < 3) return;
        
        // Trier par position X (de gauche à droite)
        zones.sort((a, b) => a.left - b.left);
        
        // Calculer l'espace total disponible
        const firstZone = zones[0];
        const lastZone = zones[zones.length - 1];
        const totalWidth = (lastZone.left + lastZone.width) - firstZone.left;
        
        // Calculer la largeur totale des zones
        const totalZonesWidth = zones.reduce((sum, z) => sum + z.width, 0);
        
        // Calculer l'espace disponible pour l'écartement
        const availableSpace = totalWidth - totalZonesWidth;
        
        // Calculer l'écartement uniforme entre chaque zone
        const spacing = availableSpace / (zones.length - 1);
        
        // Positionner chaque zone avec l'écartement uniforme
        let currentX = firstZone.left;
        for (let i = 0; i < zones.length; i++) {
            if (i === 0) {
                // La première zone garde sa position
                currentX = firstZone.left;
            } else {
                // Les autres zones sont positionnées avec l'écartement
                currentX += zones[i - 1].width + spacing;
            }
            
            // S'assurer que la zone reste dans les limites de la page
            const maxLeft = a4Page.offsetWidth - zones[i].width;
            zones[i].element.style.left = Math.max(0, Math.min(currentX, maxLeft)) + 'px';
        }
        
        saveToLocalStorage();
        saveState(); // Snapshot APRÈS l'espacement
    }

    // Ajuster l'écartement vertical entre les zones (uniforme)
    function spaceZonesVertically() {
        if (selectedZoneIds.length < 3) return;
        
        const zonesData = getCurrentPageZones();
        
        // Récupérer toutes les zones avec leurs positions
        const zones = selectedZoneIds
            .map(id => {
                const zone = document.getElementById(id);
                if (!zone) return null;
                if (zonesData[id] && (zonesData[id].locked || zonesData[id].systeme)) return null; // Ignorer les zones verrouillées ou système
                return {
                    id: id,
                    element: zone,
                    top: zone.offsetTop,
                    height: zone.offsetHeight
                };
            })
            .filter(z => z !== null);
        
        if (zones.length < 3) return;
        
        // Trier par position Y (de haut en bas)
        zones.sort((a, b) => a.top - b.top);
        
        // Calculer l'espace total disponible
        const firstZone = zones[0];
        const lastZone = zones[zones.length - 1];
        const totalHeight = (lastZone.top + lastZone.height) - firstZone.top;
        
        // Calculer la hauteur totale des zones
        const totalZonesHeight = zones.reduce((sum, z) => sum + z.height, 0);
        
        // Calculer l'espace disponible pour l'écartement
        const availableSpace = totalHeight - totalZonesHeight;
        
        // Calculer l'écartement uniforme entre chaque zone
        const spacing = availableSpace / (zones.length - 1);
        
        // Positionner chaque zone avec l'écartement uniforme
        let currentY = firstZone.top;
        for (let i = 0; i < zones.length; i++) {
            if (i === 0) {
                // La première zone garde sa position
                currentY = firstZone.top;
            } else {
                // Les autres zones sont positionnées avec l'écartement
                currentY += zones[i - 1].height + spacing;
            }
            
            // S'assurer que la zone reste dans les limites de la page
            const maxTop = a4Page.offsetHeight - zones[i].height;
            zones[i].element.style.top = Math.max(0, Math.min(currentY, maxTop)) + 'px';
        }
        
        saveToLocalStorage();
        saveState(); // Snapshot APRÈS l'espacement
    }

    // --- ÉCOUTEURS POUR LES BOUTONS D'ALIGNEMENT ET TAILLE ---
    const btnAlignLeft = document.getElementById('btn-align-left');
    const btnAlignCenter = document.getElementById('btn-align-center');
    const btnAlignRight = document.getElementById('btn-align-right');
    const btnAlignTop = document.getElementById('btn-align-top');
    const btnAlignMiddle = document.getElementById('btn-align-middle');
    const btnAlignBottom = document.getElementById('btn-align-bottom');
    const btnSameWidth = document.getElementById('btn-same-width');
    const btnSameHeight = document.getElementById('btn-same-height');
    const btnSpaceHorizontal = document.getElementById('btn-space-horizontal');
    const btnSpaceVertical = document.getElementById('btn-space-vertical');

    if (btnAlignLeft) btnAlignLeft.addEventListener('click', () => alignZones('left'));
    if (btnAlignCenter) btnAlignCenter.addEventListener('click', () => alignZones('middle')); // Centrer horizontalement → middle (même X)
    if (btnAlignRight) btnAlignRight.addEventListener('click', () => alignZones('right'));
    if (btnAlignTop) btnAlignTop.addEventListener('click', () => alignZones('top'));
    if (btnAlignMiddle) btnAlignMiddle.addEventListener('click', () => alignZones('center')); // Centrer verticalement → center (même Y)
    if (btnAlignBottom) btnAlignBottom.addEventListener('click', () => alignZones('bottom'));
    if (btnSameWidth) btnSameWidth.addEventListener('click', () => applySameWidth());
    if (btnSameHeight) btnSameHeight.addEventListener('click', () => applySameHeight());
    if (btnSpaceHorizontal) btnSpaceHorizontal.addEventListener('click', () => spaceZonesHorizontally());
    if (btnSpaceVertical) btnSpaceVertical.addEventListener('click', () => spaceZonesVertically());

    // --- 4. SUPPRESSION & DÉSÉLECTION ---
    
    // Gestion de la modale de suppression
    const modalOverlay = document.getElementById('confirmation-modal');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalConfirm = document.getElementById('btn-modal-confirm');

    function showDeleteConfirmation() {
        if (selectedZoneIds.length > 0) {
            modalOverlay.classList.remove('hidden');
        }
    }

    function hideDeleteConfirmation() {
        modalOverlay.classList.add('hidden');
    }

    function confirmDeletion() {
        if (selectedZoneIds.length > 0) {
            const zonesData = getCurrentPageZones();
            // Supprimer toutes les zones sélectionnées
            selectedZoneIds.forEach(zoneId => {
                const el = document.getElementById(zoneId);
                if (el) el.remove();
                delete zonesData[zoneId];
                // Nettoyer les ressources Quill associées
                quillInstances.delete(zoneId);
                removeCopyfitResizeObserver(zoneId);
            });
            
            // Renormaliser les z-index après suppression (pour éviter les trous)
            normalizeZIndexes();
            
            saveToLocalStorage();
            saveState(); // Snapshot APRÈS la suppression
            deselectAll();
        }
        hideDeleteConfirmation();
    }

    // Écouteurs pour la modale
    btnModalCancel.addEventListener('click', hideDeleteConfirmation);
    btnModalConfirm.addEventListener('click', confirmDeletion);
    
    // Fermer la modale en cliquant sur le fond gris
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideDeleteConfirmation();
        }
    });

    // Désélectionner si clic en dehors (sur le fond ou le workspace)
    document.addEventListener('mousedown', (e) => {
        // Ne pas désélectionner si le clic vient de la toolbar Quill
        if (e.target.closest('#quill-toolbar') || e.target.closest('.quill-toolbar')) {
            console.log('🔧 DEBUG DESELECTION - toolbar click ignoré');
            return;
        }
        
        // Si on clique sur une zone, une poignée, le panneau de contrôle, la modale ou la sidebar, on ne fait rien
        if (e.target.closest('.zone') || 
            e.target.closest('.handle') || 
            e.target.closest('.toolbar') ||
            e.target.closest('.modal-box') ||
            e.target.closest('.sidebar')) {
            return;
        }
        
        // Ne pas désélectionner si un color picker est actif (la popup native n'est pas dans le DOM)
        const activeElement = document.activeElement;
        if (activeElement && activeElement.type === 'color') {
            return;
        }
        
        // Sinon, on désélectionne
        deselectAll();
    });

    // ========================================
    // AJUSTER AU CONTENU (Snap to Content)
    // ========================================
    
    /**
     * Mesure la hauteur réelle du contenu d'une zone texte
     * @param {HTMLElement} zoneEl - Élément DOM de la zone
     * @returns {number} - Hauteur en pixels
     */
    function measureTextContentHeight(zoneEl) {
        const contentEl = zoneEl.querySelector('.zone-content');
        if (!contentEl) return zoneEl.offsetHeight;
        
        // Sauvegarder la hauteur actuelle
        const originalHeight = zoneEl.style.height;
        
        // Passer temporairement en height:auto pour mesurer
        zoneEl.style.height = 'auto';
        const measuredHeight = zoneEl.offsetHeight;
        
        // Restaurer
        zoneEl.style.height = originalHeight;
        
        return Math.max(20, measuredHeight); // Minimum 20px
    }
    
    /**
     * Ajuste le cadre de la zone sélectionnée à son contenu
     */
    function snapToContent() {
        if (selectedZoneIds.length !== 1) return;
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData) return;
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const zoneType = zoneData.type || 'textQuill';
        let newW = zoneData.w || zoneEl.offsetWidth;
        let newH = zoneData.h || zoneEl.offsetHeight;
        
        if (zoneType === 'text') {
            // Zone Texte : ajuster hauteur au contenu
            newH = measureTextContentHeight(zoneEl);
            
        } else if (zoneType === 'qr') {
            // Zone QR : rendre carré (basé sur largeur)
            newH = zoneData.w || zoneEl.offsetWidth;
            
        } else if (zoneType === 'image') {
            const mode = zoneData.redimensionnement?.mode || 'ajuster';
            const source = zoneData.source || {};
            
            // Vérifier qu'on a une image avec des dimensions
            if (!source.largeurPx || !source.hauteurPx) {
                console.log('[snapToContent] Image sans dimensions source');
                return;
            }
            
            if (mode === 'couper') {
                // Couper : ne rien faire
                console.log('[snapToContent] Non applicable en mode "couper"');
                return;
            }
            
            if (mode === 'initial') {
                // Taille initiale : le cadre prend les dimensions de l'image source
                newW = source.largeurPx;
                newH = source.hauteurPx;
                
            } else if (mode === 'ajuster') {
                // Ajuster : calculer les dimensions visibles de l'image dans le cadre actuel
                const cadreW = zoneData.w || zoneEl.offsetWidth;
                const cadreH = zoneData.h || zoneEl.offsetHeight;
                
                const ratioImage = source.largeurPx / source.hauteurPx;
                const ratioCadre = cadreW / cadreH;
                
                let visibleW, visibleH;
                
                if (ratioCadre > ratioImage) {
                    // Cadre plus large que l'image → image contrainte par la hauteur
                    visibleH = cadreH;
                    visibleW = cadreH * ratioImage;
                } else {
                    // Cadre plus haut que l'image → image contrainte par la largeur
                    visibleW = cadreW;
                    visibleH = cadreW / ratioImage;
                }
                
                // Calculer l'offset de l'image visible dans le cadre actuel (selon alignement)
                const alignH = zoneData.redimensionnement?.alignementH || 'center';
                const alignV = zoneData.redimensionnement?.alignementV || 'middle';
                
                let offsetX = 0;
                let offsetY = 0;
                
                // Offset horizontal
                if (alignH === 'center') {
                    offsetX = (cadreW - visibleW) / 2;
                } else if (alignH === 'right') {
                    offsetX = cadreW - visibleW;
                }
                // alignH === 'left' → offsetX = 0
                
                // Offset vertical
                if (alignV === 'middle') {
                    offsetY = (cadreH - visibleH) / 2;
                } else if (alignV === 'bottom') {
                    offsetY = cadreH - visibleH;
                }
                // alignV === 'top' → offsetY = 0
                
                // Nouvelles dimensions
                newW = Math.round(visibleW);
                newH = Math.round(visibleH);
                
                // Nouvelle position (compenser l'offset pour que l'image reste immobile)
                const currentX = zoneData.x || zoneEl.offsetLeft;
                const currentY = zoneData.y || zoneEl.offsetTop;
                
                zoneData.x = Math.round(currentX + offsetX);
                zoneData.y = Math.round(currentY + offsetY);
                
                // Appliquer la nouvelle position au DOM
                zoneEl.style.left = zoneData.x + 'px';
                zoneEl.style.top = zoneData.y + 'px';
                
                console.log(`[snapToContent] Position ajustée: offset(${Math.round(offsetX)}, ${Math.round(offsetY)}) → nouvelle pos(${zoneData.x}, ${zoneData.y})`);
            }
        }
        
        // Appliquer les nouvelles dimensions
        zoneData.w = Math.round(newW);
        zoneData.h = Math.round(newH);
        
        zoneEl.style.width = zoneData.w + 'px';
        zoneEl.style.height = zoneData.h + 'px';
        
        // Mettre à jour l'affichage des coordonnées dans le panneau
        updateGeomDisplay(zoneEl);
        
        // Mettre à jour l'affichage de l'image si nécessaire
        if (zoneType === 'image') {
            updateImageZoneDisplay(zoneEl, zoneData);
        }
        
        // Sauvegardes
        saveToLocalStorage();
        saveState();
        
        console.log(`[snapToContent] ${zoneId} (${zoneType}) → ${zoneData.w}×${zoneData.h}px`);
    }
    
    /**
     * Met à jour l'état du bouton Ajuster au contenu
     */
    function updateSnapToContentButton() {
        if (!btnSnapToContent) return;
        
        if (selectedZoneIds.length !== 1) {
            btnSnapToContent.disabled = true;
            return;
        }
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[selectedZoneIds[0]];
        
        if (!zoneData) {
            btnSnapToContent.disabled = true;
            return;
        }
        
        // Désactiver pour images en mode "couper" ou sans image chargée
        if (zoneData.type === 'image') {
            const mode = zoneData.redimensionnement?.mode || 'ajuster';
            const source = zoneData.source || {};
            
            if (mode === 'couper' || !source.largeurPx || !source.hauteurPx) {
                btnSnapToContent.disabled = true;
            } else {
                btnSnapToContent.disabled = false;
            }
        } else {
            btnSnapToContent.disabled = false;
        }
    }

    /**
     * Désélectionne toutes les zones et réinitialise le formulaire.
     * Cache le panneau de propriétés et vide tous les champs de saisie.
     * 
     * Actions effectuées :
     * - Retire la classe 'selected' de toutes les zones
     * - Vide le tableau selectedZoneIds
     * - Désactive le bouton Supprimer
     * - Cache le panneau de propriétés (coordsPanel)
     * - Réinitialise tous les inputs à leurs valeurs par défaut
     * 
     * @returns {void}
     * 
     * @example
     * // Désélectionner avant de changer de page
     * deselectAll();
     * loadCurrentPage();
     * 
     * // Désélectionner après suppression
     * delete zonesData[id];
     * deselectAll();
     * 
     * @see selectZone - Sélectionner une zone
     * @see selectedZoneIds - Tableau des zones sélectionnées
     */
    function deselectAll() {
        // Désélectionner toutes les zones
        selectedZoneIds.forEach(zoneId => {
            document.getElementById(zoneId)?.classList.remove('selected');
        });
        selectedZoneIds = [];
        
        // Cacher complètement le panneau et vider toutes les valeurs
        btnDelete.disabled = true;
        // coordsPanel supprimé - ne rien faire
        
        // Vider tous les champs (protégés car éléments supprimés)
        if (inputContent) inputContent.value = '';
        if (inputFont) inputFont.value = 'Roboto';
        if (inputSize) inputSize.value = 12;
        if (inputColor) inputColor.value = '#000000';
        if (inputAlign) inputAlign.value = 'left';
        if (inputValign) inputValign.value = 'top';
        if (inputBgColor) inputBgColor.value = '#ffffff';
        if (chkTransparent) chkTransparent.checked = true;
        if (chkCopyfit) chkCopyfit.checked = false;
        if (chkLock) chkLock.checked = false;
        if (inputLineHeight) inputLineHeight.value = 1.2;
        // Réinitialiser les inputs de bordure
        if (inputBorderWidth) {
            inputBorderWidth.value = 0;
            updateBorderWidthDisplay(0);
        }
        if (inputBorderColor) inputBorderColor.value = '#000000';
        if (inputBorderStyle) inputBorderStyle.value = 'solid';
        if (inputX) inputX.value = '';
        if (inputY) inputY.value = '';
        if (inputW) inputW.value = '';
        if (inputH) inputH.value = '';
        // lblSelected supprimé - ne rien faire
        setTextControlsEnabled(true);
        
        // Masquer les sections d'alignement et taille
        updateSidebarSectionsVisibility();
        
        // Masquer les poignées (aucune sélection)
        updateHandlesVisibility();
        
        // Désactiver les boutons d'arrangement (z-index)
        updateArrangementButtons();
        
        // Désactiver le bouton Ajuster au contenu
        if (btnSnapToContent) btnSnapToContent.disabled = true;
        
        // Masquer la section Page
        updateZonePageUI();
        
        // Toolbars : toujours masquer après désélection
        updateToolbarVisibility();
    }

    btnDelete.addEventListener('click', () => {
        showDeleteConfirmation();
    });

    // Écouteurs pour les boutons Undo/Redo
    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            undo();
        });
    }
    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            redo();
        });
    }

    // --- EVENT LISTENERS ARRANGEMENT (Z-INDEX) ---
    // Anciens boutons (supprimés de l'interface)
    if (btnToFront) btnToFront.addEventListener('click', bringToFront);
    if (btnForward) btnForward.addEventListener('click', bringForward);
    if (btnBackward) btnBackward.addEventListener('click', sendBackward);
    if (btnToBack) btnToBack.addEventListener('click', sendToBack);
    
    // Nouveaux boutons de position dans la sidebar POC
    if (btnBringFront) btnBringFront.addEventListener('click', bringToFront);
    if (btnBringForward) btnBringForward.addEventListener('click', bringForward);
    if (btnSendBackward) btnSendBackward.addEventListener('click', sendBackward);
    if (btnSendBack) btnSendBack.addEventListener('click', sendToBack);
    
    // Event listener pour le bouton Ajuster au contenu
    if (btnSnapToContent) btnSnapToContent.addEventListener('click', snapToContent);

    // Raccourci clavier : Touche Suppr pour supprimer, Ctrl+C pour copier, Ctrl+V pour coller
    document.addEventListener('keydown', (e) => {
        // Si la modale de suppression est ouverte
        if (!modalOverlay.classList.contains('hidden')) {
            if (e.key === 'Enter') confirmDeletion();
            if (e.key === 'Escape') hideDeleteConfirmation();
            return;
        }

        // Si la modale de réinitialisation est ouverte, ne pas gérer les autres touches
        if (!resetModal.classList.contains('hidden')) {
            return;
        }

        // IMPORTANT : ne pas intercepter les raccourcis quand l'utilisateur édite dans Quill / contenteditable
        if (isQuillOrContentEditableActiveElement()) {
            return;
        }

        // Ne pas intercepter si l'utilisateur tape dans un input ou textarea (sauf pour Delete)
        const isInInput = e.target.matches('input, textarea');
        
        // Undo (Ctrl+Z ou Cmd+Z)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isInInput) {
            e.preventDefault();
            undo();
            return;
        }
        
        // Redo (Ctrl+Y ou Cmd+Y ou Ctrl+Shift+Z ou Cmd+Shift+Z)
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
            ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
            if (!isInInput) {
                e.preventDefault();
                redo();
                return;
            }
        }
        
        // Copier (Ctrl+C ou Cmd+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isInInput) {
            e.preventDefault();
            copySelectedZone();
            return;
        }
        
        // Coller (Ctrl+V ou Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isInInput) {
            e.preventDefault();
            pasteZone();
            return;
        }

        if (selectedZoneIds.length > 0 && (e.key === 'Delete' || e.key === 'Del')) {
            // Ne pas supprimer si l'utilisateur tape dans un input ou textarea
            if (isInInput) return;
            
            // Ne pas supprimer si une zone système est sélectionnée
            const zonesData = getCurrentPageZones();
            const hasSystemeSelected = selectedZoneIds.some(id => {
                const zoneData = zonesData[id];
                return zoneData && zoneData.systeme;
            });
            if (hasSystemeSelected) return;
            
            showDeleteConfirmation();
        }
    });

    // --- BOUTON RÉINITIALISER ---
    const resetModal = document.getElementById('reset-modal');
    const btnResetCancel = document.getElementById('btn-reset-cancel');
    const btnResetCurrentPage = document.getElementById('btn-reset-current-page');
    const btnResetAllPages = document.getElementById('btn-reset-all-pages');

    // --- MODALE CHECK (vérification pré-export) ---
    const checkModal = document.getElementById('check-modal');
    const checkModalSummary = document.getElementById('check-modal-summary');
    const checkModalErrors = document.getElementById('check-modal-errors');
    const btnCheckClose = document.getElementById('btn-check-close');

    function showResetConfirmation() {
        // Afficher ou masquer le bouton "Toutes les pages" selon le nombre de pages
        if (documentState.pages.length > 1) {
            btnResetAllPages.style.display = 'inline-flex';
        } else {
            btnResetAllPages.style.display = 'none';
        }
        resetModal.classList.remove('hidden');
    }

    function hideResetConfirmation() {
        resetModal.classList.add('hidden');
    }

    function resetCurrentPage() {
        const zonesData = getCurrentPageZones();
        
        // 1. Supprimer les zones du DOM (sauf les zones système)
        document.querySelectorAll('.zone').forEach(el => {
            const zoneId = el.id;
            const zoneData = zonesData[zoneId];
            // Ne pas supprimer si c'est une zone système
            if (!zoneData || !zoneData.systeme) {
                el.remove();
                // Nettoyer les ressources Quill associées
                quillInstances.delete(zoneId);
                removeCopyfitResizeObserver(zoneId);
            }
        });
        
        // 2. Vider la mémoire de la page courante (sauf zones système)
        for (const key in zonesData) {
            if (!zonesData[key].systeme) {
                delete zonesData[key];
            }
        }
        
        // 3. Désélectionner
        selectedZoneIds = [];
        deselectAll(); // Nettoyer l'interface
        
        // 4. Sauvegarder l'état
        saveToLocalStorage();
        
        // AJOUT : Réinitialiser l'historique Undo/Redo
        historyManager.states = [];
        historyManager.currentIndex = -1;
        
        saveState(); // Snapshot APRÈS la réinitialisation (nouveau point de départ)
        
        hideResetConfirmation();
    }

    function resetAllPages() {
        
        // 1. Supprimer les zones du DOM (sauf les zones système de la page courante)
        const currentZonesData = getCurrentPageZones();
        document.querySelectorAll('.zone').forEach(el => {
            const zoneId = el.id;
            const zoneData = currentZonesData[zoneId];
            // Ne pas supprimer si c'est une zone système
            if (!zoneData || !zoneData.systeme) {
                el.remove();
                // Nettoyer les ressources Quill associées
                quillInstances.delete(zoneId);
                removeCopyfitResizeObserver(zoneId);
            }
        });
        
        // 2. Vider la mémoire de toutes les pages (sauf zones système)
        documentState.pages.forEach(page => {
            for (const key in page.zones) {
                if (!page.zones[key].systeme) {
                    delete page.zones[key];
                }
            }
        });
        
        // 3. Désélectionner (ne pas réinitialiser le compteur car les zones système restent)
        selectedZoneIds = [];
        deselectAll(); // Nettoyer l'interface
        
        // 4. Sauvegarder l'état
        saveToLocalStorage();
        
        // AJOUT : Réinitialiser l'historique Undo/Redo
        historyManager.states = [];
        historyManager.currentIndex = -1;
        
        saveState(); // Snapshot APRÈS la réinitialisation (nouveau point de départ)
        
        hideResetConfirmation();
    }

    btnReset.addEventListener('click', () => {
        showResetConfirmation();
    });

    btnResetCancel.addEventListener('click', hideResetConfirmation);
    btnResetCurrentPage.addEventListener('click', resetCurrentPage);
    btnResetAllPages.addEventListener('click', resetAllPages);
    
    // Fermer la modale en cliquant sur le fond gris
    resetModal.addEventListener('click', (e) => {
        if (e.target === resetModal) {
            hideResetConfirmation();
        }
    });

    // --- Event listeners pour la modale Check ---
    // Bouton Fermer de la modale Check
    if (btnCheckClose) {
        btnCheckClose.addEventListener('click', hideCheckModal);
    }

    // Fermer la modale Check en cliquant sur l'overlay
    if (checkModal) {
        checkModal.addEventListener('click', (e) => {
            if (e.target === checkModal) {
                hideCheckModal();
            }
        });
    }

    // Raccourci clavier : Escape pour fermer les modales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Fermer la modale de réinitialisation si ouverte
            if (resetModal && !resetModal.classList.contains('hidden')) {
                hideResetConfirmation();
            }
            // Fermer la modale Check si ouverte
            if (checkModal && !checkModal.classList.contains('hidden')) {
                hideCheckModal();
            }
        }
    });

    // ───────────────────────── TOOLBAR QUILL (PHASE 3) : LISTENERS ─────────────────────────
    if (quillToolbar) {
        console.log('🔧 PHASE 3 - Toolbar Quill:');
        console.log('  ✓ Toolbar element:', quillToolbar ? 'OK' : 'MANQUANT');
        console.log('  ✓ Sections trouvées:', document.querySelectorAll('#quill-toolbar .toolbar-section').length);
        
        // Empêcher la propagation pour éviter la désélection au clic sur la toolbar
        quillToolbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        quillToolbar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Bouton fermer (X)
    if (quillToolbarCloseBtn) {
        quillToolbarCloseBtn.addEventListener('click', () => {
            hideQuillToolbar();
        });
    }
    
    // Sections collapsibles
    if (quillToolbar) {
        const sectionHeaders = quillToolbar.querySelectorAll('.toolbar-section .section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                toggleToolbarSection(header);
            });
        });
    }
    
    // Écouteurs des contrôles (Phase 4)
    initQuillToolbarEvents();

    // Phase 5 : mini-toolbar contextuelle (formatage partiel)
    initMiniToolbarEvents();
    
    // Drag de la toolbar (sur header)
    if (quillToolbar && quillToolbarHeader) {
        quillToolbarHeader.addEventListener('mousedown', (e) => {
            // Ne pas drag si on clique sur le bouton fermer
            if (e.target.closest && e.target.closest('#quill-toolbar-close')) return;
            
            isQuillToolbarDragging = true;
            const rect = quillToolbar.getBoundingClientRect();
            quillToolbarDragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            quillToolbar.style.transition = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isQuillToolbarDragging || !quillToolbar) return;
            
            const maxX = window.innerWidth - quillToolbar.offsetWidth;
            const maxY = window.innerHeight - quillToolbar.offsetHeight;
            
            const x = Math.max(0, Math.min(e.clientX - quillToolbarDragOffset.x, maxX));
            const y = Math.max(0, Math.min(e.clientY - quillToolbarDragOffset.y, maxY));
            
            quillToolbar.style.left = `${x}px`;
            quillToolbar.style.top = `${y}px`;
            quillToolbar.style.right = 'auto';
            quillToolbar.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isQuillToolbarDragging || !quillToolbar) return;
            
            const rect = quillToolbar.getBoundingClientRect();
            quillToolbarLastPos = { x: rect.left, y: rect.top };
            quillToolbar.style.transition = '';
            isQuillToolbarDragging = false;
        });
    }

    // ─────────────────────────────── TOOLBAR IMAGE - ÉVÉNEMENTS ──────────────────────
    
    // Empêcher le clic sur les toolbars de désélectionner la zone
    if (quillToolbar) {
        quillToolbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        quillToolbar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    if (imageToolbar) {
        imageToolbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        imageToolbar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Bouton fermer (X) de la toolbar image
    if (imageToolbarCloseBtn) {
        imageToolbarCloseBtn.addEventListener('click', () => {
            hideImageToolbar();
        });
    }
    
    // Drag de la toolbar image (sur header)
    if (imageToolbar && imageToolbarHeader) {
        imageToolbarHeader.addEventListener('mousedown', (e) => {
            // Ne pas drag si on clique sur le bouton fermer
            if (e.target.closest && e.target.closest('#image-toolbar-close')) return;
            
            isImageToolbarDragging = true;
            const rect = imageToolbar.getBoundingClientRect();
            imageToolbarDragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            imageToolbar.style.transition = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isImageToolbarDragging || !imageToolbar) return;
            
            const maxX = window.innerWidth - imageToolbar.offsetWidth;
            const maxY = window.innerHeight - imageToolbar.offsetHeight;
            
            const x = Math.max(0, Math.min(e.clientX - imageToolbarDragOffset.x, maxX));
            const y = Math.max(0, Math.min(e.clientY - imageToolbarDragOffset.y, maxY));
            
            imageToolbar.style.left = `${x}px`;
            imageToolbar.style.top = `${y}px`;
            imageToolbar.style.right = 'auto';
            imageToolbar.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isImageToolbarDragging || !imageToolbar) return;
            
            const rect = imageToolbar.getBoundingClientRect();
            imageToolbarLastPos = { x: rect.left, y: rect.top };
            imageToolbar.style.transition = '';
            isImageToolbarDragging = false;
        });
    }
    
    // Note : initImageToolbarComponents() est appelée au premier affichage de la toolbar
    // dans showImageToolbar() pour éviter les problèmes avec display:none

    // ─────────────────────────────── TOOLBAR BARCODE - ÉVÉNEMENTS ──────────────────────
    
    // Empêcher le clic sur la toolbar de désélectionner la zone
    if (barcodeToolbar) {
        barcodeToolbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        barcodeToolbar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Bouton fermer (X) de la toolbar barcode
    if (barcodeToolbarCloseBtn) {
        barcodeToolbarCloseBtn.addEventListener('click', () => {
            hideBarcodeToolbar();
        });
    }
    
    // Drag de la toolbar barcode (sur header)
    if (barcodeToolbar && barcodeToolbarHeader) {
        barcodeToolbarHeader.addEventListener('mousedown', (e) => {
            // Ne pas drag si on clique sur le bouton fermer
            if (e.target.closest && e.target.closest('#barcode-toolbar-close')) return;
            
            isBarcodeToolbarDragging = true;
            const rect = barcodeToolbar.getBoundingClientRect();
            barcodeToolbarDragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            barcodeToolbar.style.transition = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isBarcodeToolbarDragging || !barcodeToolbar) return;
            
            const maxX = window.innerWidth - barcodeToolbar.offsetWidth;
            const maxY = window.innerHeight - barcodeToolbar.offsetHeight;
            
            const x = Math.max(0, Math.min(e.clientX - barcodeToolbarDragOffset.x, maxX));
            const y = Math.max(0, Math.min(e.clientY - barcodeToolbarDragOffset.y, maxY));
            
            barcodeToolbar.style.left = `${x}px`;
            barcodeToolbar.style.top = `${y}px`;
            barcodeToolbar.style.right = 'auto';
            barcodeToolbar.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isBarcodeToolbarDragging || !barcodeToolbar) return;
            
            const rect = barcodeToolbar.getBoundingClientRect();
            barcodeToolbarLastPos = { x: rect.left, y: rect.top };
            barcodeToolbar.style.transition = '';
            isBarcodeToolbarDragging = false;
        });
    }

    // ─────────────────────────────── TOOLBAR QRCODE - ÉVÉNEMENTS ──────────────────────
    
    // Empêcher le clic sur la toolbar de désélectionner la zone
    if (qrcodeToolbar) {
        qrcodeToolbar.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        qrcodeToolbar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Bouton fermer (X) de la toolbar qrcode
    if (qrcodeToolbarCloseBtn) {
        qrcodeToolbarCloseBtn.addEventListener('click', () => {
            hideQrcodeToolbar();
        });
    }
    
    // Drag de la toolbar qrcode (sur header)
    if (qrcodeToolbar && qrcodeToolbarHeader) {
        qrcodeToolbarHeader.addEventListener('mousedown', (e) => {
            // Ne pas drag si on clique sur le bouton fermer
            if (e.target.closest && e.target.closest('#qrcode-toolbar-close')) return;
            
            isQrcodeToolbarDragging = true;
            const rect = qrcodeToolbar.getBoundingClientRect();
            qrcodeToolbarDragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            qrcodeToolbar.style.transition = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isQrcodeToolbarDragging || !qrcodeToolbar) return;
            
            const maxX = window.innerWidth - qrcodeToolbar.offsetWidth;
            const maxY = window.innerHeight - qrcodeToolbar.offsetHeight;
            
            const x = Math.max(0, Math.min(e.clientX - qrcodeToolbarDragOffset.x, maxX));
            const y = Math.max(0, Math.min(e.clientY - qrcodeToolbarDragOffset.y, maxY));
            
            qrcodeToolbar.style.left = `${x}px`;
            qrcodeToolbar.style.top = `${y}px`;
            qrcodeToolbar.style.right = 'auto';
            qrcodeToolbar.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (!isQrcodeToolbarDragging || !qrcodeToolbar) return;
            
            const rect = qrcodeToolbar.getBoundingClientRect();
            qrcodeToolbarLastPos = { x: rect.left, y: rect.top };
            qrcodeToolbar.style.transition = '';
            isQrcodeToolbarDragging = false;
        });
    }
    
    // ─────────────────────────────── TOOLBAR DATA - ÉVÉNEMENTS ──────────────────────────
    
    // Empêcher le clic sur la toolbar de désélectionner la zone
    if (toolbarData) {
        toolbarData.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        toolbarData.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Bouton fermer (X) de la toolbar data
    if (toolbarDataClose) {
        toolbarDataClose.addEventListener('click', () => {
            if (toolbarData) toolbarData.style.display = 'none';
        });
    }
    
    // Drag de la toolbar data (sur header)
    if (toolbarDataHeader && toolbarData) {
        /** @type {boolean} True si on est en train de déplacer la toolbar Data */
        let isDraggingToolbarData = false;
        /** @type {number} Offset X souris→toolbar au démarrage du drag */
        let toolbarDataOffsetX = 0;
        /** @type {number} Offset Y souris→toolbar au démarrage du drag */
        let toolbarDataOffsetY = 0;
        
        toolbarDataHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.toolbar-close-poc')) return;
            isDraggingToolbarData = true;
            const rect = toolbarData.getBoundingClientRect();
            toolbarDataOffsetX = e.clientX - rect.left;
            toolbarDataOffsetY = e.clientY - rect.top;
            toolbarData.style.position = 'fixed';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDraggingToolbarData) return;
            toolbarData.style.left = (e.clientX - toolbarDataOffsetX) + 'px';
            toolbarData.style.top = (e.clientY - toolbarDataOffsetY) + 'px';
            toolbarData.style.right = 'auto';
            toolbarData.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            isDraggingToolbarData = false;
        });
    }
    
    // Note : initBarcodeToolbarComponents() et initQrcodeToolbarComponents() sont appelées
    // au premier affichage de leur toolbar respective pour éviter les problèmes avec display:none

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 PHASE 4 - Toolbar Quill connectée aux propriétés');
    console.log('═══════════════════════════════════════════════════════════════');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 PHASE 5 - Mini-toolbar contextuelle opérationnelle');
    console.log('═══════════════════════════════════════════════════════════════');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 PHASE 6 - Champs de fusion pour textQuill opérationnels');
    console.log('═══════════════════════════════════════════════════════════════');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 PHASE 7 - Export/Import JSON textQuill opérationnel');
    console.log('═══════════════════════════════════════════════════════════════');

    // ─────────────────────────────── FIN SECTION 16 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 17 : DRAG & DROP / REDIMENSIONNEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Gestion du déplacement et du redimensionnement des zones par souris.
     * Support du déplacement groupé pour sélection multiple.
     * 
     * Variables d'état :
     *   - isDragging, isResizing : Flags d'état
     *   - currentHandle : Poignée active (nw, ne, sw, se)
     *   - startPositions : Positions initiales pour déplacement groupé
     * 
     * Handlers :
     *   - mousedown : Initier drag ou resize
     *   - mousemove : Appliquer déplacement/redimensionnement
     *   - mouseup : Finaliser et sauvegarder
     * 
     * Contraintes :
     *   - Marge de sécurité (Section 6)
     *   - Contraintes DPI/surface pour images (Section 10)
     * 
     * Dépendances :
     *   - getSecurityMarginPx() (Section 6)
     *   - checkImageResizeAllowed() (Section 10)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    let isDragging = false, isResizing = false, currentHandle = null;
    let startX, startY, startLeft, startTop, startW, startH;
    // Stockage des positions initiales de toutes les zones sélectionnées pour le déplacement groupé
    let startPositions = []; // Tableau de {id, left, top, width, height}
    let hasActuallyMoved = false; // Flag pour détecter si un vrai mouvement a eu lieu
    
    /** @type {string|null} ID de zone textQuill actuellement en drag (logs PHASE 2) */
    let activeTextQuillDragZoneId = null;
    
    /** @type {string|null} ID de zone textQuill actuellement en resize (logs PHASE 2) */
    let activeTextQuillResizeZoneId = null;

    document.addEventListener('mousedown', (e) => {
        // Si on est en mode pan (Espace pressé ou clic molette), ne pas permettre le drag des zones
        if (spacePressed || e.button === 1) {
            return; // Laisser le pan gérer
        }
        
        // NOTE: Le drag/resize est maintenant autorisé en mode aperçu
        // pour permettre à l'utilisateur d'ajuster les zones en voyant les vraies valeurs
        
        // Vérifier si on clique sur une zone sélectionnée (pour le drag/resize)
        if (selectedZoneIds.length > 0) {
            const zonesData = getCurrentPageZones();
            
            // Trouver quelle zone sélectionnée a été cliquée (si une)
            let clickedZone = null;
            let clickedZoneId = null;
            
            for (const zoneId of selectedZoneIds) {
                const zoneEl = document.getElementById(zoneId);
                if (zoneEl && zoneEl.contains(e.target)) {
                    // Vérifier si cette zone n'est pas verrouillée ou système
                    if (!zonesData[zoneId] || (!zonesData[zoneId].locked && !zonesData[zoneId].systeme)) {
                        clickedZone = zoneEl;
                        clickedZoneId = zoneId;
                        break;
                    }
                }
            }
            
            if (!clickedZone) return; // Aucune zone sélectionnée cliquée ou toutes verrouillées
            
            const clickedZoneData = zonesData[clickedZoneId];
            
            // Gestion du redimensionnement (handle)
            // Ne permettre le redimensionnement que si une seule zone est sélectionnée
            const isResizeHandle = e.target.classList.contains('handle') || e.target.classList.contains('resize-handle');
            if (isResizeHandle && clickedZone.contains(e.target)) {
                if (selectedZoneIds.length > 1) {
                    // Sélection multiple : empêcher le redimensionnement
                    e.preventDefault();
                    return;
                }
                // Redimensionnement : seulement la zone cliquée (sélection unique)
                isResizing = true;
                hasActuallyMoved = false;
                
                currentHandle = e.target.dataset.pos;
                startX = e.clientX; startY = e.clientY;
                startW = clickedZone.offsetWidth; startH = clickedZone.offsetHeight;
                startLeft = clickedZone.offsetLeft; startTop = clickedZone.offsetTop;
                e.preventDefault();
                
                // Logs PHASE 2 (textQuill)
                if (clickedZoneData && clickedZoneData.type === 'textQuill') {
                    activeTextQuillResizeZoneId = clickedZoneId;
                    console.log('🔧 PHASE 2 - Resize START zone textQuill:', clickedZoneId);
                }
            } else if (clickedZone.contains(e.target) && !e.target.classList.contains('handle')) {
                // IMPORTANT : ne pas démarrer un drag si on clique dans l'éditeur Quill (permettre saisie/sélection de texte)
                if (e.target.closest('.ql-editor') || e.target.closest('.quill-editor')) {
                    return;
                }
                
                // textQuill : drag UNIQUEMENT via le bandeau .zone-drag-handle
                if (clickedZoneData && clickedZoneData.type === 'textQuill') {
                    if (!e.target.closest('.zone-drag-handle')) {
                        return;
                    }
                }
                // Déplacement : sauvegarder les positions de TOUTES les zones sélectionnées
                isDragging = true;
                hasActuallyMoved = false;
                
                startX = e.clientX; startY = e.clientY;
                startLeft = clickedZone.offsetLeft; startTop = clickedZone.offsetTop;
                
                // Logs PHASE 2 (textQuill)
                if (clickedZoneData && clickedZoneData.type === 'textQuill') {
                    activeTextQuillDragZoneId = clickedZoneId;
                    clickedZone.classList.add('dragging');
                    document.body.style.cursor = 'grabbing';
                    console.log('🔧 PHASE 2 - Drag START zone textQuill:', clickedZoneId);
                }
                
                // Sauvegarder les positions initiales de toutes les zones sélectionnées
                startPositions = [];
                selectedZoneIds.forEach(zoneId => {
                    const zoneEl = document.getElementById(zoneId);
                    if (zoneEl) {
                        // Vérifier si la zone n'est pas verrouillée ou système
                        const zoneData = zonesData[zoneId];
                        if (!zoneData || (!zoneData.locked && !zoneData.systeme)) {
                            startPositions.push({
                                id: zoneId,
                                left: zoneEl.offsetLeft,
                                top: zoneEl.offsetTop,
                                width: zoneEl.offsetWidth,
                                height: zoneEl.offsetHeight
                            });
                        }
                    }
                });
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (selectedZoneIds.length === 0) return;

        if (isDragging) {
            // Calculer le déplacement relatif (sans vérification de Ctrl - naturel)
            const dx = (e.clientX - startX) / zoomLevel;
            const dy = (e.clientY - startY) / zoomLevel;
            
            // Détecter si un vrai mouvement a eu lieu (seuil de 1 pixel)
            if (!hasActuallyMoved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
                hasActuallyMoved = true;
            }
            
            // Obtenir les dimensions de la page (dynamiques)
            const pageWidth = getPageWidth();
            const pageHeight = getPageHeight();
            
            // Déplacer toutes les zones sélectionnées ensemble (sans besoin de Ctrl)
            const zonesData = getCurrentPageZones();
            startPositions.forEach(pos => {
                const zoneEl = document.getElementById(pos.id);
                if (!zoneEl) return;
                
                // Vérifier si la zone n'est pas verrouillée ou système
                const zoneData = zonesData[pos.id];
                if (zoneData && (zoneData.locked || zoneData.systeme)) return; // Ignorer les zones verrouillées ou système
                
                // Calculer la nouvelle position
                const newLeft = pos.left + dx;
                const newTop = pos.top + dy;
                
                // Appliquer les contraintes de limites avec marge de sécurité
                const margin = getSecurityMarginPx();
                const minLeft = margin;
                const maxLeft = pageWidth - margin - pos.width;
                const minTop = margin;
                const maxTop = pageHeight - margin - pos.height;
                
                // Positionner la zone en respectant les limites et la marge
                zoneEl.style.left = Math.max(minLeft, Math.min(newLeft, maxLeft)) + 'px';
                zoneEl.style.top = Math.max(minTop, Math.min(newTop, maxTop)) + 'px';
            });
            
            // Mettre à jour l'affichage géométrique seulement si une seule zone est sélectionnée
            if (selectedZoneIds.length === 1) {
                const firstSelectedId = selectedZoneIds[0];
                const zone = document.getElementById(firstSelectedId);
                if (zone) {
                    updateGeomDisplay(zone);
                    
                    // Phase 4 : mettre à jour la géométrie dans les toolbars pendant le drag
                    const zonesData = getCurrentPageZones();
                    const zoneType = zonesData[firstSelectedId] ? zonesData[firstSelectedId].type : null;
                    
                    if (zoneType === 'textQuill') {
                        updateQuillToolbarGeometryFields(firstSelectedId);
                    } else if (zoneType === 'image') {
                        updateImageToolbarGeometryFields(firstSelectedId);
                    } else if (zoneType === 'barcode') {
                        updateBarcodeToolbarGeometryFields(firstSelectedId);
                    } else if (zoneType === 'qr') {
                        updateQrcodeToolbarGeometryFields(firstSelectedId);
                    }
                }
            }
        } else if (isResizing) {
            const firstSelectedId = selectedZoneIds[0];
            const zone = document.getElementById(firstSelectedId);
            if (!zone) return;
            const zonesData = getCurrentPageZones();
            const dx = (e.clientX - startX) / zoomLevel;
            const dy = (e.clientY - startY) / zoomLevel;
            
            // Détecter si un vrai redimensionnement a eu lieu (seuil de 1 pixel)
            if (!hasActuallyMoved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
                hasActuallyMoved = true;
            }
            
            let newW = startW, newH = startH;
            
            // Simplification redimensionnement (juste SE pour l'exemple, ou complet comme avant)
            if (currentHandle.includes('e')) newW = startW + dx;
            if (currentHandle.includes('w')) { /* ... logique complexe ... */ }
            if (currentHandle.includes('s')) newH = startH + dy;
            
            // Appliquer les contraintes de marge de sécurité au redimensionnement
            const margin = getSecurityMarginPx();
            const pageWidth = getPageWidth();
            const pageHeight = getPageHeight();
            const zoneLeft = zone.offsetLeft;
            const zoneTop = zone.offsetTop;
            
            // Limiter la largeur pour ne pas dépasser la marge droite
            const maxWidth = pageWidth - margin - zoneLeft;
            // Limiter la hauteur pour ne pas dépasser la marge basse
            const maxHeight = pageHeight - margin - zoneTop;
            
            // Vérifier si c'est un code 2D (QR Code, DataMatrix) qui doit rester carré
            const zoneDataResize = zonesData[firstSelectedId];
            let is2DBarcode = false;
            
            if (zoneDataResize && zoneDataResize.type === 'qr') {
                const typeCode = zoneDataResize.typeCode || 'QRCode';
                const config = BARCODE_BWIPJS_CONFIG[typeCode];
                is2DBarcode = config ? config.is2D : false;
            } else if (zoneDataResize && zoneDataResize.type === 'barcode') {
                const typeCode = zoneDataResize.typeCodeBarres || 'code128';
                const config = BARCODE_BWIPJS_CONFIG[typeCode];
                is2DBarcode = config ? config.is2D : false;
            }
            
            if (is2DBarcode) {
                // Codes 2D : forcer un carré
                let size = Math.max(40, Math.max(newW, newH));
                // Appliquer la contrainte de marge (le plus restrictif entre largeur et hauteur)
                size = Math.min(size, maxWidth, maxHeight);
                zone.style.width = size + 'px';
                zone.style.height = size + 'px';
            } else {
                // Appliquer les contraintes de marge
                newW = Math.min(newW, maxWidth);
                newH = Math.min(newH, maxHeight);
                
                // === CONTRAINTES MINIMALES ZONE textQuill (mm) ===
                if (zonesData[firstSelectedId] && zonesData[firstSelectedId].type === 'textQuill') {
                    const minW = mmToPx(20);
                    const minH = mmToPx(5);
                    newW = Math.max(newW, minW);
                    newH = Math.max(newH, minH);
                    
                    // Adapter le curseur selon la poignée
                    if (currentHandle === 'se') document.body.style.cursor = 'se-resize';
                    else if (currentHandle === 'e') document.body.style.cursor = 'e-resize';
                    else if (currentHandle === 's') document.body.style.cursor = 's-resize';
                }
                
                // === CONTRAINTES ZONES IMAGE ===
                if (zoneDataResize && zoneDataResize.type === 'image' && zoneDataResize.source && 
                    (zoneDataResize.source.imageBase64 || zoneDataResize.source.valeur)) {
                    
                    // Seulement si on agrandit (pas si on réduit)
                    if (newW > startW || newH > startH) {
                        const resizeCheck = checkImageResizeAllowed(firstSelectedId, newW, newH);
                        
                        if (!resizeCheck.allowed) {
                            // Limiter aux dimensions maximales
                            if (resizeCheck.maxWidth !== null) {
                                newW = Math.min(newW, resizeCheck.maxWidth);
                            }
                            if (resizeCheck.maxHeight !== null) {
                                newH = Math.min(newH, resizeCheck.maxHeight);
                            }
                            
                            // Afficher le message
                            showResizeConstraintMessageDebounced(resizeCheck.reason);
                        }
                    }
                }
                // === FIN CONTRAINTES ZONES IMAGE ===
                
                // Garde-fou minimal en pixels (15px ≈ 4mm, inférieur à tous les minimums définis)
                if (newW > 15) zone.style.width = newW + 'px';
                if (newH > 15) zone.style.height = newH + 'px';
                
                // Recalculer le CopyFit pendant le redimensionnement pour effet temps réel
                if (zonesData[firstSelectedId].copyfit) {
                    if (zonesData[firstSelectedId].type === 'textQuill') {
                        const quillInstance = quillInstances.get(firstSelectedId);
                        if (quillInstance) {
                            applyCopyfitToQuillZone(zone, quillInstance, zonesData[firstSelectedId].size);
                        }
                    } else {
                        applyCopyfit(zone, zonesData[firstSelectedId].size);
                    }
                }
            }
            updateGeomDisplay(zone);
            
            // Phase 4 : mettre à jour la géométrie dans les toolbars pendant le resize
            const zoneTypeResize = zonesData[firstSelectedId] ? zonesData[firstSelectedId].type : null;
            
            if (zoneTypeResize === 'textQuill') {
                updateQuillToolbarGeometryFields(firstSelectedId);
            } else if (zoneTypeResize === 'image') {
                updateImageToolbarGeometryFields(firstSelectedId);
            } else if (zoneTypeResize === 'barcode') {
                updateBarcodeToolbarGeometryFields(firstSelectedId);
            } else if (zoneTypeResize === 'qr') {
                updateQrcodeToolbarGeometryFields(firstSelectedId);
            }
            
            // Mettre à jour le DPI si c'est une zone image
            if (zonesData[firstSelectedId] && zonesData[firstSelectedId].type === 'image') {
                updateDpiIndicator(firstSelectedId);
                updateImageDpiBadge(firstSelectedId);
            }
        }
    });

    document.addEventListener('mouseup', () => {
        // Sauvegarder UNIQUEMENT si un vrai changement a eu lieu (drag ou resize avec mouvement)
        if (hasActuallyMoved && (isDragging || isResizing)) {
            // Mettre à jour les valeurs mm pour toutes les zones déplacées/redimensionnées
            const zonesData = getCurrentPageZones();
            selectedZoneIds.forEach(zoneId => {
                const zoneEl = document.getElementById(zoneId);
                const zoneData = zonesData[zoneId];
                if (zoneEl && zoneData) {
                    // Convertir les positions/dimensions pixels en mm
                    zoneData.xMm = pxToMm(parseFloat(zoneEl.style.left) || zoneEl.offsetLeft);
                    zoneData.yMm = pxToMm(parseFloat(zoneEl.style.top) || zoneEl.offsetTop);
                    zoneData.wMm = pxToMm(zoneEl.offsetWidth);
                    zoneData.hMm = pxToMm(zoneEl.offsetHeight);
                    
                    // textQuill : stocker aussi les valeurs pixels (utiles pour recréation DOM cohérente)
                    if (zoneData.type === 'textQuill') {
                        zoneData.x = parseFloat(zoneEl.style.left) || zoneEl.offsetLeft;
                        zoneData.y = parseFloat(zoneEl.style.top) || zoneEl.offsetTop;
                        zoneData.w = zoneEl.offsetWidth;
                        zoneData.h = zoneEl.offsetHeight;
                    }
                }
            });
            
            // Mettre à jour l'affichage des champs de géométrie
            if (selectedZoneIds.length === 1) {
                const zoneEl = document.getElementById(selectedZoneIds[0]);
                if (zoneEl) {
                    updateGeomDisplay(zoneEl);
                }
            }
            
            saveToLocalStorage();
            saveState(); // Snapshot APRÈS le déplacement/redimensionnement

            // Régénérer les codes-barres après redimensionnement
            if (isResizing && selectedZoneIds.length === 1) {
                const zoneId = selectedZoneIds[0];
                const zoneData = zonesData[zoneId];
                if (zoneData) {
                    if (zoneData.type === 'qr') {
                        setTimeout(() => updateQrZoneDisplay(zoneId), 50);
                    } else if (zoneData.type === 'barcode') {
                        setTimeout(() => updateBarcodeZoneDisplay(zoneId), 50);
                    } else if (zoneData.type === 'image') {
                        setTimeout(() => updateImageDpiBadge(zoneId), 50);
                    }
                }
            }
        }

        // Logs PHASE 2 - Drag END (textQuill)
        if (activeTextQuillDragZoneId) {
            const zonesData = getCurrentPageZones();
            const zoneEl = document.getElementById(activeTextQuillDragZoneId);
            const zoneData = zonesData[activeTextQuillDragZoneId];
            if (zoneEl && zoneData && zoneData.type === 'textQuill') {
                const x = parseFloat(zoneEl.style.left) || zoneEl.offsetLeft;
                const y = parseFloat(zoneEl.style.top) || zoneEl.offsetTop;
                console.log('🔧 PHASE 2 - Drag END zone textQuill:', activeTextQuillDragZoneId, 'nouvelle position:', { x, y });
                zoneEl.classList.remove('dragging');
            }
        }
        
        // Logs PHASE 2 - Resize END (textQuill)
        if (activeTextQuillResizeZoneId) {
            const zonesData = getCurrentPageZones();
            const zoneEl = document.getElementById(activeTextQuillResizeZoneId);
            const zoneData = zonesData[activeTextQuillResizeZoneId];
            if (zoneEl && zoneData && zoneData.type === 'textQuill') {
                const width = zoneEl.offsetWidth;
                const height = zoneEl.offsetHeight;
                console.log('🔧 PHASE 2 - Resize END zone textQuill:', activeTextQuillResizeZoneId, 'nouvelles dimensions:', { width, height });

                // DEBUG : état avant recalcul Quill / réapplication styles
                try {
                    const contentEl = zoneEl.querySelector('.zone-content');
                    const quillInstanceBefore = quillInstances.get(activeTextQuillResizeZoneId);
                    const cs = contentEl ? getComputedStyle(contentEl) : null;
                    console.log('🔧 DEBUG VALIGN - Resize END BEFORE:', activeTextQuillResizeZoneId, {
                        dataValign: zoneData.valign,
                        contentFound: !!contentEl,
                        contentClasses: contentEl ? Array.from(contentEl.classList) : null,
                        contentInlineJustifyContent: contentEl ? (contentEl.style.justifyContent || '(empty)') : null,
                        contentComputedJustifyContent: cs ? cs.justifyContent : null,
                        contentComputedDisplay: cs ? cs.display : null,
                        zoneOffsetH: zoneEl.offsetHeight,
                        contentClientH: contentEl ? contentEl.clientHeight : null,
                        contentScrollH: contentEl ? contentEl.scrollHeight : null,
                        quillContainerInlineH: (quillInstanceBefore && quillInstanceBefore.container) ? (quillInstanceBefore.container.style.height || '(empty)') : null,
                        quillRootInlineH: (quillInstanceBefore && quillInstanceBefore.root) ? (quillInstanceBefore.root.style.height || '(empty)') : null
                    });
                } catch (e) {}
                
                // Forcer Quill à se recalculer (sécurité)
                const quillInstance = quillInstances.get(activeTextQuillResizeZoneId);
                if (quillInstance) {
                    try {
                        // IMPORTANT : ne pas forcer 100% en hauteur → cela supprime l'espace libre,
                        // rendant l'alignement vertical (valign) visuellement inopérant.
                        // On laisse Quill en hauteur auto (comme le POC) pour que .zone-content puisse centrer.
                        if (quillInstance.container) quillInstance.container.style.height = 'auto';
                        if (quillInstance.root) quillInstance.root.style.height = 'auto';
                        quillInstance.update('silent');
                    } catch (e) {}
                }

                // DEBUG : état juste après update Quill
                try {
                    const contentEl = zoneEl.querySelector('.zone-content');
                    const cs = contentEl ? getComputedStyle(contentEl) : null;
                    console.log('🔧 DEBUG VALIGN - Resize END AFTER quill.update:', activeTextQuillResizeZoneId, {
                        dataValign: zoneData.valign,
                        contentFound: !!contentEl,
                        contentClasses: contentEl ? Array.from(contentEl.classList) : null,
                        contentInlineJustifyContent: contentEl ? (contentEl.style.justifyContent || '(empty)') : null,
                        contentComputedJustifyContent: cs ? cs.justifyContent : null,
                        contentComputedDisplay: cs ? cs.display : null,
                        zoneOffsetH: zoneEl.offsetHeight,
                        contentClientH: contentEl ? contentEl.clientHeight : null,
                        contentScrollH: contentEl ? contentEl.scrollHeight : null,
                        quillContainerInlineH: (quillInstance && quillInstance.container) ? (quillInstance.container.style.height || '(empty)') : null,
                        quillRootInlineH: (quillInstance && quillInstance.root) ? (quillInstance.root.style.height || '(empty)') : null
                    });
                } catch (e) {}
                
                // Phase 4 : réappliquer les styles après resize (certains recalculs Quill peuvent les écraser)
                applyQuillZoneStyles(activeTextQuillResizeZoneId);

                // DEBUG : vérifier si un écrasement se produit après coup (async)
                try {
                    const logDeferred = (label) => {
                        const contentEl = zoneEl.querySelector('.zone-content');
                        const cs = contentEl ? getComputedStyle(contentEl) : null;
                        const qi = quillInstances.get(activeTextQuillResizeZoneId);
                        console.log(`🔧 DEBUG VALIGN - Resize END ${label}:`, activeTextQuillResizeZoneId, {
                            dataValign: zoneData.valign,
                            contentFound: !!contentEl,
                            contentClasses: contentEl ? Array.from(contentEl.classList) : null,
                            contentInlineJustifyContent: contentEl ? (contentEl.style.justifyContent || '(empty)') : null,
                            contentComputedJustifyContent: cs ? cs.justifyContent : null,
                            contentComputedDisplay: cs ? cs.display : null,
                            zoneOffsetH: zoneEl.offsetHeight,
                            contentClientH: contentEl ? contentEl.clientHeight : null,
                            contentScrollH: contentEl ? contentEl.scrollHeight : null,
                            quillContainerInlineH: (qi && qi.container) ? (qi.container.style.height || '(empty)') : null,
                            quillRootInlineH: (qi && qi.root) ? (qi.root.style.height || '(empty)') : null
                        });
                    };

                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(() => logDeferred('rAF'));
                    }
                    setTimeout(() => logDeferred('T+0'), 0);
                    setTimeout(() => logDeferred('T+50ms'), 50);
                } catch (e) {}
            }
        }

        isDragging = false;
        isResizing = false;
        hasActuallyMoved = false;
        startPositions = [];
        activeTextQuillDragZoneId = null;
        activeTextQuillResizeZoneId = null;
        document.body.style.cursor = '';

        // Réinitialiser le debounce des messages de contrainte
        lastConstraintMessage = '';
        lastConstraintTime = 0;
    });

    // ─────────────────────────────── FIN SECTION 17 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 18 : SAISIE GÉOMÉTRIE (mm)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Gestion de la saisie manuelle des coordonnées et dimensions en millimètres.
     * Synchronisation entre les inputs mm et les positions pixels des zones.
     * 
     * Fonctions principales :
     *   - updateGeomDisplay() : Affiche les valeurs mm depuis la zone
     *   - applyGeometryChange() : Applique une modification de géométrie
     * 
     * Listeners :
     *   - inputX, inputY : Position (mm)
     *   - inputW, inputH : Dimensions (mm)
     * 
     * Contraintes :
     *   - Marge de sécurité (getGeometryLimits)
     *   - Taille minimum (2mm)
     * 
     * Dépendances :
     *   - pxToMm(), mmToPx() (Section 6)
     *   - getGeometryLimits() (Section 6)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    /**
     * Met à jour les champs de géométrie avec les valeurs mm stockées ou calculées
     * @param {HTMLElement|Object} zoneDataOrEl - Élément DOM ou données de la zone
     */
    function updateGeomDisplay(zoneDataOrEl) {
        let xMm, yMm, wMm, hMm;
        
        if (zoneDataOrEl instanceof HTMLElement) {
            // Élément DOM passé : récupérer les données de la zone
            const zoneEl = zoneDataOrEl;
            const zonesData = getCurrentPageZones();
            const zoneData = zonesData[zoneEl.id];
            
            if (zoneData && zoneData.xMm !== undefined) {
                // Utiliser les valeurs mm stockées
                xMm = zoneData.xMm;
                yMm = zoneData.yMm;
                wMm = zoneData.wMm;
                hMm = zoneData.hMm;
            } else {
                // Fallback : convertir depuis les pixels
                xMm = pxToMm(zoneEl.offsetLeft);
                yMm = pxToMm(zoneEl.offsetTop);
                wMm = pxToMm(zoneEl.offsetWidth);
                hMm = pxToMm(zoneEl.offsetHeight);
            }
        } else {
            // Objet zoneData passé directement
            const zoneData = zoneDataOrEl;
            if (zoneData.xMm !== undefined) {
                xMm = zoneData.xMm;
                yMm = zoneData.yMm;
                wMm = zoneData.wMm;
                hMm = zoneData.hMm;
            } else {
                // Fallback : convertir depuis les pixels
                xMm = pxToMm(zoneData.x || 0);
                yMm = pxToMm(zoneData.y || 0);
                wMm = pxToMm(zoneData.w || 100);
                hMm = pxToMm(zoneData.h || 50);
            }
        }
        
        // Afficher avec 1 décimale
        if (inputX) inputX.value = xMm.toFixed(1);
        if (inputY) inputY.value = yMm.toFixed(1);
        if (inputW) inputW.value = wMm.toFixed(1);
        if (inputH) inputH.value = hMm.toFixed(1);
    }
    
    /**
     * Applique une nouvelle valeur de géométrie avec contraintes de marge
     * @param {string} property - 'x', 'y', 'w' ou 'h'
     * @param {number} valueMm - Nouvelle valeur en mm
     */
    function applyGeometryChange(property, valueMm) {
        if (selectedZoneIds.length !== 1) return;
        
        const zoneId = selectedZoneIds[0];
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        if (!zoneData || zoneData.locked || zoneData.systeme) return;

        // Récupérer les limites avec marge de sécurité
        const limits = getGeometryLimits();
        
        // Récupérer les valeurs actuelles en mm
        let xMm = zoneData.xMm !== undefined ? zoneData.xMm : pxToMm(zoneEl.offsetLeft);
        let yMm = zoneData.yMm !== undefined ? zoneData.yMm : pxToMm(zoneEl.offsetTop);
        let wMm = zoneData.wMm !== undefined ? zoneData.wMm : pxToMm(zoneEl.offsetWidth);
        let hMm = zoneData.hMm !== undefined ? zoneData.hMm : pxToMm(zoneEl.offsetHeight);
        
        // Taille minimum (2mm, sauf textQuill : 20mm x 5mm)
        const minWidthMm = (zoneData.type === 'textQuill') ? 20 : 2;
        const minHeightMm = (zoneData.type === 'textQuill') ? 5 : 2;
        
        // Vérifier si c'est un code 2D (doit rester carré)
        let is2D = false;
        if (zoneData.type === 'qr') {
            const typeCode = zoneData.typeCode || 'QRCode';
            const config = BARCODE_BWIPJS_CONFIG[typeCode];
            is2D = config ? config.is2D : false;
        } else if (zoneData.type === 'barcode') {
            const typeCode = zoneData.typeCodeBarres || 'code128';
            const config = BARCODE_BWIPJS_CONFIG[typeCode];
            is2D = config ? config.is2D : false;
        }
        
        // Fonction d'arrondi à 1 décimale
        const round1 = (val) => Math.round(val * 10) / 10;
        
        // ============================================
        // APPLIQUER LES CONTRAINTES SELON LA PROPRIÉTÉ
        // ============================================
        
        switch (property) {
            case 'x':
                // Contraindre X entre marge min et (marge max - largeur)
                xMm = valueMm;
                const maxX = round1(limits.maxX - wMm);
                xMm = round1(Math.max(limits.minX, Math.min(xMm, maxX)));
                break;
                
            case 'y':
                // Contraindre Y entre marge min et (marge max - hauteur)
                yMm = valueMm;
                const maxY = round1(limits.maxY - hMm);
                yMm = round1(Math.max(limits.minY, Math.min(yMm, maxY)));
                break;
                
            case 'w':
                // NE PAS modifier X, juste limiter la largeur au max possible
                wMm = Math.max(minWidthMm, valueMm);

                // Largeur max = bord droit (avec marge) - position X actuelle
                const maxWidth = round1(limits.maxX - xMm);
                wMm = round1(Math.min(wMm, maxWidth));

                // Codes 2D : forcer le carré
                if (is2D) {
                    // Aussi vérifier la contrainte de hauteur
                    const maxHeightFor2D = round1(limits.maxY - yMm);
                    const maxSquareW = Math.min(wMm, maxHeightFor2D);
                    wMm = round1(maxSquareW);
                    hMm = round1(maxSquareW);
                }
                break;
                
            case 'h':
                // NE PAS modifier Y, juste limiter la hauteur au max possible
                hMm = Math.max(minHeightMm, valueMm);
                
                // Hauteur max = bord bas (avec marge) - position Y actuelle
                const maxHeight = round1(limits.maxY - yMm);
                hMm = round1(Math.min(hMm, maxHeight));
                
                // Codes 2D : forcer le carré
                if (is2D) {
                    // Aussi vérifier la contrainte de largeur
                    const maxWidthFor2D = round1(limits.maxX - xMm);
                    const maxSquareH = Math.min(hMm, maxWidthFor2D);
                    wMm = round1(maxSquareH);
                    hMm = round1(maxSquareH);
                }
                break;
        }
        
        // Arrondir les valeurs finales
        xMm = round1(xMm);
        yMm = round1(yMm);
        wMm = round1(wMm);
        hMm = round1(hMm);
        
        // ============================================
        // APPLIQUER LES VALEURS
        // ============================================
        
        // Convertir en pixels pour le CSS
        const xPx = mmToPx(xMm);
        const yPx = mmToPx(yMm);
        const wPx = mmToPx(wMm);
        const hPx = mmToPx(hMm);
        
        // Appliquer au DOM
        zoneEl.style.left = xPx + 'px';
        zoneEl.style.top = yPx + 'px';
        zoneEl.style.width = wPx + 'px';
        zoneEl.style.height = hPx + 'px';
        
        // Stocker les valeurs en pixels ET en mm
        zoneData.x = xPx;
        zoneData.y = yPx;
        zoneData.w = wPx;
        zoneData.h = hPx;
        zoneData.xMm = xMm;
        zoneData.yMm = yMm;
        zoneData.wMm = wMm;
        zoneData.hMm = hMm;
        
        // Mettre à jour l'affichage des champs avec les valeurs mm (précises)
        updateGeomDisplay(zoneData);
        
        // Phase 4 : mettre à jour aussi les champs de géométrie de la toolbar Quill
        if (zoneData.type === 'textQuill') {
            updateQuillToolbarGeometryFields(zoneId);
        }
        
        // Actions spécifiques selon le type de zone
        if (zoneData.type === 'qr') {
            updateQrZoneDisplay(zoneId);
        } else if (zoneData.type === 'barcode') {
            updateBarcodeZoneDisplay(zoneId);
        } else if (zoneData.type === 'image') {
            updateImageDpiBadge(zoneId);
            updateDpiIndicator(zoneId);
        } else if (zoneData.copyfit) {
            if (zoneData.type === 'textQuill') {
                const quillInstance = quillInstances.get(zoneId);
                if (quillInstance) {
                    applyCopyfitToQuillZone(zoneEl, quillInstance, zoneData.size);
                }
            } else {
                applyCopyfit(zoneEl, zoneData.size);
            }
        }
        
        saveToLocalStorage();
        saveState();
    }
    
    // Écouteurs pour les champs de géométrie (anciens inputs supprimés, gérés par toolbar Quill)
    if (inputX) {
        inputX.addEventListener('change', () => {
            const value = parseFloat(inputX.value);
            if (!isNaN(value) && value >= 0) {
                applyGeometryChange('x', value);
            }
        });
    }
    
    if (inputY) {
        inputY.addEventListener('change', () => {
            const value = parseFloat(inputY.value);
            if (!isNaN(value) && value >= 0) {
                applyGeometryChange('y', value);
            }
        });
    }
    
    if (inputW) {
        inputW.addEventListener('change', () => {
            const value = parseFloat(inputW.value);
            if (!isNaN(value) && value > 0) {
                applyGeometryChange('w', value);
            }
        });
    }
    
    if (inputH) {
        inputH.addEventListener('change', () => {
            const value = parseFloat(inputH.value);
            if (!isNaN(value) && value > 0) {
                applyGeometryChange('h', value);
            }
        });
    }
    
    // Permettre la validation avec Entrée
    [inputX, inputY, inputW, inputH].forEach(input => {
        if (!input) return;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); // Déclenche l'événement change
            }
        });
    });

    // ─────────────────────────────── FIN SECTION 18 ───────────────────────────────

    // --- 6. SAUVEGARDE / CHARGEMENT LOCAL ---

    /**
     * Capture le contenu des zones `textQuill` (Quill) dans `zonesData[id].content`
     * afin qu'il soit persisté (localStorage / historique).
     *
     * Stockage : HTML (`quill.root.innerHTML`).
     *
     * @param {ZonesCollection} zonesData - Collection des zones de la page courante
     * @returns {void}
     */
    function persistTextQuillContentForSave(zonesData) {
        if (!zonesData) return;

        console.log('🔧 DEBUG - quillInstances.keys():', Array.from(quillInstances.keys()));
        
        for (const [zoneId, data] of Object.entries(zonesData)) {
            if (!data || data.type !== 'textQuill') continue;
            
            const quill = quillInstances.get(zoneId);
            if (!quill || !quill.root) {
                console.log('🔧 DEBUG - Quill instance introuvable pour:', zoneId);
                continue;
            }
            
            // Persist Delta (format natif Quill)
            // IMPORTANT : éviter d'écraser un Delta existant non vide par un Delta "vide"
            // pendant la fenêtre où Quill vient d'être créé mais n'a pas encore restauré son contenu
            // (ex: restauration via setTimeout(0) dans createZoneDOM après un import).
            const currentDelta = quill.getContents();
            const currentOps = currentDelta && Array.isArray(currentDelta.ops) ? currentDelta.ops : [];
            const existingOps = data.quillDelta && Array.isArray(data.quillDelta.ops) ? data.quillDelta.ops : [];
            
            const isCurrentEmpty = (
                currentOps.length === 0 ||
                (currentOps.length === 1 && typeof currentOps[0].insert === 'string' && currentOps[0].insert === '\n')
            );
            const isExistingNonEmpty = existingOps.some(op => typeof op.insert === 'string' && op.insert.replace(/\n/g, '').length > 0);
            
            if (isCurrentEmpty && isExistingNonEmpty) {
                // Ne pas écraser : on garde le Delta existant
                console.log('🔧 BUGFIX - Quill Delta non écrasé (Delta courant vide, Delta existant non vide):', zoneId);
                continue;
            }
            
            data.quillDelta = currentDelta;
            console.log('🔧 BUGFIX - Contenu Quill sauvegardé (Delta):', zoneId);
        }
    }

    /**
     * Sauvegarde l'état complet du document dans le localStorage.
     * Synchronise d'abord les positions DOM vers documentState, puis persiste.
     * 
     * Données sauvegardées :
     * - 'marketeam_document_state' : Structure complète multipage (nouveau format)
     * - 'marketeam_zones' : Zones de la page courante (rétrocompat ancien format)
     * - 'marketeam_zone_counter' : Compteur de zones (rétrocompat)
     * 
     * @returns {void}
     * @fires notifyParentOfChange - Notifie WebDev parent des modifications
     * 
     * @example
     * // Après toute modification utilisateur
     * zoneData.content = 'Nouveau texte';
     * saveToLocalStorage();
     * 
     * @see loadFromLocalStorage - Chargement au démarrage
     * @see saveState - Sauvegarde dans l'historique (Undo/Redo)
     */
    function saveToLocalStorage() {
        // On ajoute la position/taille actuelle du DOM dans les données avant de sauver
        const zonesData = getCurrentPageZones();
        for (const [id, data] of Object.entries(zonesData)) {
            const el = document.getElementById(id);
            if (el) {
                data.x = el.offsetLeft;
                data.y = el.offsetTop;
                data.w = el.offsetWidth;
                data.h = el.offsetHeight;
            }
        }

        // BUGFIX : persister le contenu Quill dans zonesData avant sérialisation
        // NE PAS persister en mode aperçu (le contenu affiché est fusionné, pas l'original)
        if (!previewState || !previewState.active) {
            persistTextQuillContentForSave(zonesData);
        }
        
        // Synchroniser le compteur global
        documentState.zoneCounter = zoneCounter;
        
        // Sauvegarder la nouvelle structure
        localStorage.setItem('marketeam_document_state', JSON.stringify(documentState));
        
        // Rétrocompatibilité : sauvegarder aussi l'ancien format pour la page courante
        localStorage.setItem('marketeam_zones', JSON.stringify(zonesData));
        localStorage.setItem('marketeam_zone_counter', zoneCounter);
        
        // Notifier le parent WebDev qu'il y a eu une modification
        if (typeof notifyParentOfChange === 'function') {
            notifyParentOfChange();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 19 : IMPORT DEPUIS WEBDEV
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Chargement des données depuis le format JSON WebDev.
     * Conversion des zones et métadonnées vers le format interne.
     * 
     * Fonctions de conversion :
     *   - convertZoneTexteFromJson() : Zone texte JSON → interne
     *   - convertZoneCodeBarresFromJson() : Zone code-barres JSON → interne
     *   - convertZoneImageFromJson() : Zone image JSON → interne
     * 
     * Fonction principale :
     *   - loadFromWebDev() : Point d'entrée pour le chargement
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - mmToPx(), pxToMm() (Section 6)
     *   - loadFontsFromJson() (Section 5)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    /**
     * Convertit un Delta Quill en contenu texte + formatage partiel (format JSON WebDev).
     *
     * Règles :
     * - On ne traite que les inserts de type string (les embeds sont ignorés).
     * - Les styles supportés pour le formatage partiel WebDev : gras, souligné, couleur.
     * - Les index (debut/fin) sont calculés sur la chaîne `contenu` générée.
     *
     * @param {Object|null|undefined} quillDelta - Delta Quill (ex: { ops: [...] })
     * @returns {{contenu: string, formatage: FormatagePartielJsonWebDev[]}} Résultat de conversion
     */
    function quillDeltaToTextAndFormatage(quillDelta) {
        const ops = quillDelta && Array.isArray(quillDelta.ops) ? quillDelta.ops : [];
        let contenu = '';
        /** @type {FormatagePartielJsonWebDev[]} */
        const formatage = [];

        /**
         * Ajoute une annotation de formatage si nécessaire (fusionne si contiguë et styles identiques).
         * @param {number} debut - Index de début
         * @param {number} fin - Index de fin
         * @param {{gras?: boolean, souligne?: boolean, couleur?: string}} styles - Styles WebDev
         * @returns {void}
         */
        function pushFormatage(debut, fin, styles) {
            if (debut >= fin) return;
            if (!styles) return;

            const cleaned = {};
            if (styles.gras === true) cleaned.gras = true;
            if (styles.souligne === true) cleaned.souligne = true;
            if (styles.couleur) cleaned.couleur = styles.couleur;
            if (Object.keys(cleaned).length === 0) return;

            const last = formatage.length > 0 ? formatage[formatage.length - 1] : null;
            const sameStyles = (a, b) => JSON.stringify(a) === JSON.stringify(b);

            if (last && last.fin === debut && last.styles && sameStyles(last.styles, cleaned)) {
                last.fin = fin;
                return;
            }

            formatage.push({ debut, fin, styles: cleaned });
        }

        let index = 0;
        for (const op of ops) {
            if (!op) continue;
            if (typeof op.insert !== 'string') continue;

            const text = op.insert;
            contenu += text;

            const attrs = op.attributes || {};
            const styles = {
                gras: attrs.bold === true,
                souligne: attrs.underline === true,
                couleur: typeof attrs.color === 'string' ? attrs.color : undefined
            };
            pushFormatage(index, index + text.length, styles);
            index += text.length;
        }

        return { contenu, formatage };
    }

    /**
     * Reconstruit un Delta Quill à partir d'un contenu texte + formatage partiel (format JSON WebDev).
     *
     * @param {string} contenu - Contenu texte
     * @param {FormatagePartielJsonWebDev[]} formatage - Liste d'annotations (debut/fin + styles)
     * @returns {Object} Delta Quill (ex: { ops: [...] })
     */
    function textAndFormatageToQuillDelta(contenu, formatage) {
        const text = typeof contenu === 'string' ? contenu : '';
        const annotations = Array.isArray(formatage) ? formatage : [];

        // Quill attend généralement un \n final. On ne modifie pas la chaîne source,
        // mais on s'assure qu'une fin de document existe dans le delta.
        const needsFinalNewline = text.length === 0 || text[text.length - 1] !== '\n';

        const breakpoints = new Set([0, text.length]);
        annotations.forEach(a => {
            if (!a) return;
            if (typeof a.debut === 'number') breakpoints.add(Math.max(0, Math.min(a.debut, text.length)));
            if (typeof a.fin === 'number') breakpoints.add(Math.max(0, Math.min(a.fin, text.length)));
        });
        const points = Array.from(breakpoints).sort((a, b) => a - b);

        const ops = [];

        for (let i = 0; i < points.length - 1; i++) {
            const segStart = points[i];
            const segEnd = points[i + 1];
            if (segStart >= segEnd) continue;

            const segmentText = text.substring(segStart, segEnd);
            if (!segmentText) continue;

            // Fusionner les styles qui couvrent totalement le segment (logique similaire à renderFormattedContent)
            const merged = {};
            annotations.forEach(a => {
                if (!a || !a.styles) return;
                if (a.debut <= segStart && a.fin >= segEnd) {
                    Object.assign(merged, a.styles);
                }
            });

            const attributes = {};
            if (merged.gras === true) attributes.bold = true;
            if (merged.souligne === true) attributes.underline = true;
            if (typeof merged.couleur === 'string' && merged.couleur.length > 0) attributes.color = merged.couleur;

            if (Object.keys(attributes).length > 0) {
                ops.push({ insert: segmentText, attributes });
            } else {
                ops.push({ insert: segmentText });
            }
        }

        if (needsFinalNewline) {
            ops.push({ insert: '\n' });
        }

        return { ops };
    }

    /**
     * Échappe et encode une chaîne pour un flux RTF compatible PrintShop Mail.
     * - Échappe les caractères spéciaux RTF (\\, {, })
     * - Encode les caractères non-ASCII (> 127) en format \'XX (hexadécimal)
     * - Convertit les sauts de ligne en \par
     * 
     * @param {string} text - Texte brut
     * @returns {string} Texte échappé et encodé pour RTF
     */
    function escapeRtf(text) {
        let result = '';
        const str = String(text);
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const code = char.charCodeAt(0);
            
            // Sauts de ligne → \par
            if (char === '\r' && str[i + 1] === '\n') {
                result += '\\par ';
                i++; // Sauter le \n
                continue;
            }
            if (char === '\r' || char === '\n') {
                result += '\\par ';
                continue;
            }
            
            // Caractères RTF spéciaux
            if (char === '\\') {
                result += '\\\\';
            } else if (char === '{') {
                result += '\\{';
            } else if (char === '}') {
                result += '\\}';
            } else if (code > 127) {
                // Caractères non-ASCII : encoder en \'XX (code Windows-1252)
                // Pour les caractères courants, utiliser les codes Windows-1252
                result += "\\'" + code.toString(16).padStart(2, '0');
            } else {
                result += char;
            }
        }
        
        return result;
    }

    /**
     * Mapping des alignements Quill/Designer vers codes RTF.
     * @type {Object.<string, string>}
     */
    const RTF_ALIGN_MAP = {
        'left': '',        // \ql est implicite en RTF
        'center': '\\qc',
        'right': '\\qr',
        'justify': '\\qj'
    };

    /**
     * Convertit un delta Quill (ops) en RTF complet compatible PrintShop Mail.
     * Support : texte, gras (\\b), italique (\\i), souligné (\\ul), couleur (\\cfN), retours ligne (\\par), alignement (\\qc, \\qr, \\qj).
     * 
     * Format RTF généré :
     * - Header complet : \\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1036
     * - Table des polices : {\\fonttbl{\\f0\\fnil\\fcharset0 POLICE;}}
     * - Table des couleurs : {\\colortbl ;\\redR\\greenG\\blueB;...}
     * - Corps avec styles : \\viewkind4\\uc1\\pard[\\qX]\\cfN\\f0\\fsS TEXTE\\par
     *
     * @param {Object|null|undefined} delta - Delta Quill (ex: { ops: [...] })
     * @param {string} [fontName='Roboto'] - Nom de la police par défaut
     * @param {number} [fontSize=12] - Taille de police en points
     * @param {string} [defaultColor='#000000'] - Couleur par défaut au format hex
     * @param {string} [align='left'] - Alignement horizontal ('left', 'center', 'right', 'justify')
     * @returns {string} Chaîne RTF complète compatible PrintShop Mail
     */
    function deltaToRtf(delta, fontName = 'Roboto', fontSize = 12, defaultColor = '#000000', align = 'left') {
        const ops = delta && Array.isArray(delta.ops) ? delta.ops : [];

        // Normaliser la couleur par défaut
        const normalizedDefaultColor = String(defaultColor || '#000000').toLowerCase();

        // 1) Collecter les couleurs présentes (la couleur par défaut en premier, index 1)
        const colors = [normalizedDefaultColor];
        const colorIndex = (hex) => {
            if (!hex) return 1; // Utiliser la couleur par défaut (index 1)
            const c = String(hex).toLowerCase();
            let idx = colors.indexOf(c);
            if (idx === -1) {
                colors.push(c);
                idx = colors.length - 1;
            }
            // En RTF, \cf1 = première couleur de la table (index 0 du tableau = cf1)
            return idx + 1;
        };

        // Pré-collecter les couleurs inline du Delta
        for (const op of ops) {
            if (!op || typeof op.insert !== 'string') continue;
            const attrs = op.attributes || {};
            if (typeof attrs.color === 'string' && attrs.color) colorIndex(attrs.color);
        }

        // 2) Générer la table des polices
        const fonttbl = `{\\fonttbl{\\f0\\fnil\\fcharset0 ${fontName};}}`;

        // 3) Générer la table des couleurs (avec espace après le ; initial)
        let colortbl = '{\\colortbl ;';
        colors.forEach(c => {
            // Format attendu: #rrggbb
            const hex = c.startsWith('#') ? c.slice(1) : c;
            const r = parseInt(hex.slice(0, 2), 16) || 0;
            const g = parseInt(hex.slice(2, 4), 16) || 0;
            const b = parseInt(hex.slice(4, 6), 16) || 0;
            colortbl += `\\red${r}\\green${g}\\blue${b};`;
        });
        colortbl += '}';

        // 4) Taille de police en demi-points (RTF utilise des demi-points)
        const fsValue = Math.round(fontSize * 2);

        // 5) Corps du texte
        // IMPORTANT : ne jamais ajouter d'espaces "réels" autour des segments formatés,
        // sinon ils réapparaissent après conversion RTF → Delta (symptôme : espaces avant/après mots formatés).
        // On encapsule les segments formatés dans des GROUPES RTF "{...}" pour éviter tout reset manuel.
        let body = '';
        for (const op of ops) {
            if (!op || typeof op.insert !== 'string') continue;
            const text = op.insert;
            const attrs = op.attributes || {};

            const isBold = attrs.bold === true;
            const isItalic = attrs.italic === true;
            const isUnderline = attrs.underline === true;
            const color = typeof attrs.color === 'string' ? attrs.color : null;
            // Si pas de couleur inline, utiliser la couleur par défaut (index 1)
            const cf = color ? colorIndex(color) : 1;

            const escaped = escapeRtf(text);

            // Aucun attribut spécial (utilise la couleur par défaut) : texte brut
            if (!isBold && !isItalic && !isUnderline && cf === 1) {
                body += escaped;
                continue;
            }

            // Segment formaté : groupe RTF
            let codes = '';
            if (isBold) codes += '\\b';
            if (isItalic) codes += (codes ? ' ' : '') + '\\i';
            if (isUnderline) codes += (codes ? ' ' : '') + '\\ul';
            if (cf !== 1) codes += (codes ? ' ' : '') + `\\cf${cf}`;

            body += `{${codes} ${escaped}}`;
        }

        // 6) Code d'alignement RTF
        const alignCode = RTF_ALIGN_MAP[align] || '';

        // 7) Assembler le RTF complet au format PrintShop Mail
        // Header : \rtf1\ansi\ansicpg1252\deff0\deflang1036
        // Préambule corps : \viewkind4\uc1\pard[\qX]\cf1\f0\fsN
        // Ne pas ajouter \par final si le body se termine déjà par \par (évite le double saut de ligne)
        const needsFinalPar = !body.endsWith('\\par ') && !body.endsWith('\\par');
        const finalPar = needsFinalPar ? '\\par' : '';
        const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1036${fonttbl}\n${colortbl}\n\\viewkind4\\uc1\\pard${alignCode}\\cf1\\f0\\fs${fsValue} ${body}${finalPar}\n}`;
        console.log('🔧 PHASE 7 - deltaToRtf:', rtf.substring(0, 80) + '...');
        return rtf;
    }

    /**
     * Convertit une chaîne RTF (basique) en Delta Quill.
     * Support : \\b/\\b0, \\ul/\\ul0, \\cfN/\\cf0, \\par, table de couleurs.
     *
     * @param {string} rtf - Chaîne RTF
     * @returns {Object} Delta Quill ({ ops: [...] })
     */
    function rtfToDelta(rtf) {
        const input = String(rtf || '');
        if (DEBUG_PHASE7_RTF) console.log('🔧 rtfToDelta INPUT:', input);
        if (!input) return { ops: [{ insert: '\n' }] };

        /**
         * Extrait et supprime une section groupée RTF (ex: "{\\colortbl ... }") en respectant l'imbrication d'accolades.
         * @param {string} source - RTF complet
         * @param {string} groupStart - Préfixe de groupe à trouver (ex: "{\\colortbl")
         * @returns {{cleaned: string, groups: string[]}} RTF sans ces groupes + groupes extraits
         */
        const stripGroupsByBraceMatching = (source, groupStart) => {
            const groups = [];
            let s = source;
            let idx;
            while ((idx = s.toLowerCase().indexOf(groupStart.toLowerCase())) !== -1) {
                let depth = 0;
                let end = -1;
                for (let i = idx; i < s.length; i++) {
                    const ch = s[i];
                    if (ch === '{') depth++;
                    else if (ch === '}') {
                        depth--;
                        if (depth === 0) {
                            end = i;
                            break;
                        }
                    }
                }
                if (end === -1) break;
                groups.push(s.slice(idx, end + 1));
                s = s.slice(0, idx) + s.slice(end + 1);
            }
            return { cleaned: s, groups };
        };

        // 1) Extraire / supprimer colortbl
        const { cleaned: withoutColorTbl, groups: colorTblGroups } = stripGroupsByBraceMatching(input, '{\\colortbl');

        /** @type {string[]} */
        const colors = [];
        colorTblGroups.forEach(g => {
            const reColor = /\\red(\d+)\\green(\d+)\\blue(\d+)\s*;/ig;
            let m;
            while ((m = reColor.exec(g)) !== null) {
                const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
                const gg = Math.max(0, Math.min(255, parseInt(m[2], 10)));
                const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
                const hex = '#' + [r, gg, b].map(v => v.toString(16).padStart(2, '0')).join('');
                colors.push(hex);
            }
        });

        // 2) Retirer le wrapper initial "{\rtf1..." si présent (sans casser le reste)
        let body = withoutColorTbl;
        if (body.startsWith('{\\rtf')) {
            // retirer la première accolade ouvrante, on ignore les accolades structurelles ensuite
            body = body.slice(1);
        }

        // 3) Parsing linéaire : on IGNORE les control-words non supportés
        const ops = [];
        let buffer = '';
        let bold = false;
        let italic = false;
        let underline = false;
        let color = null;

        const flush = () => {
            if (!buffer) return;
            const attributes = {};
            if (bold) attributes.bold = true;
            if (italic) attributes.italic = true;
            if (underline) attributes.underline = true;
            if (color) attributes.color = color;
            if (Object.keys(attributes).length > 0) ops.push({ insert: buffer, attributes });
            else ops.push({ insert: buffer });
            buffer = '';
        };

        const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
        const isDigit = (c) => (c >= '0' && c <= '9') || c === '-';
        const isSpace = (c) => c === ' ' || c === '\t';

        /** @type {Array<{bold: boolean, italic: boolean, underline: boolean, color: string|null}>} */
        const stateStack = [];

        for (let i = 0; i < body.length; i++) {
            const ch = body[i];

            // Groupes RTF : push/pop état (les styles reviennent à l'état précédent à la fermeture du groupe)
            if (ch === '{') {
                // Sauvegarder l'état courant
                stateStack.push({ bold, italic, underline, color });
                continue;
            }
            if (ch === '}') {
                // Fermer le segment courant, puis restaurer l'état précédent
                flush();
                const prev = stateStack.pop();
                if (prev) {
                    bold = prev.bold;
                    italic = prev.italic;
                    underline = prev.underline;
                    color = prev.color;
                }
                continue;
            }

            if (ch !== '\\') {
                // Heuristique Phase 7 : ignorer les espaces utilisés uniquement comme séparateurs
                // avant un control word (ex: " ...  \\ul" ou "texte : \\cf0").
                if (isSpace(ch)) {
                    let k = i;
                    while (k < body.length && isSpace(body[k])) k++;
                    if (k < body.length && body[k] === '\\') {
                        // Ce sont des espaces de séparation RTF → ne pas les conserver
                        continue;
                    }
                }
                buffer += ch;
                continue;
            }

            // \ escape
            const next = body[i + 1];
            if (next === '\\' || next === '{' || next === '}') {
                buffer += next;
                i += 1;
                continue;
            }

            // \'hh hex
            if (next === '\'' && /^[0-9a-fA-F]{2}$/.test(body.slice(i + 2, i + 4))) {
                const code = parseInt(body.slice(i + 2, i + 4), 16);
                buffer += String.fromCharCode(code);
                i += 3;
                continue;
            }

            // Lire control word
            let j = i + 1;
            let word = '';
            while (j < body.length && isLetter(body[j])) {
                word += body[j];
                j++;
            }

            // Optionnel : param numérique
            let numStr = '';
            while (j < body.length && isDigit(body[j])) {
                numStr += body[j];
                j++;
            }

            // Consommer un espace délimiteur s'il existe
            if (j < body.length && body[j] === ' ') j++;
            // Consommer les espaces supplémentaires entre deux control words (ex: "\\par  \\ul")
            while (j < body.length && isSpace(body[j])) {
                let k = j;
                while (k < body.length && isSpace(body[k])) k++;
                if (k < body.length && body[k] === '\\') {
                    j = k;
                    continue;
                }
                break; // espaces avant du texte : conserver
            }

            // Appliquer commandes supportées, ignorer le reste
            const num = numStr ? parseInt(numStr, 10) : null;

            if (word === 'par') {
                buffer += '\n';
            } else if (word === 'b') {
                flush();
                bold = (num === null) ? true : (num !== 0);
            } else if (word === 'i') {
                flush();
                italic = (num === null) ? true : (num !== 0);
            } else if (word === 'ul') {
                flush();
                underline = (num === null) ? true : (num !== 0);
            } else if (word === 'cf') {
                flush();
                const n = (num === null) ? 0 : num;
                if (n <= 0) color = null;
                else color = colors[n - 1] || null;
            } else if (word === 'line') {
                buffer += '\n';
            } else if (word === 'tab') {
                buffer += '\t';
            } else {
                // Ignorer : ex \rtf1, \ansi, \deff0, \redN, \greenN, \blueN, \viewkind4, etc.
            }

            i = j - 1;
        }

        flush();

        // Quill attend souvent une fin de document \n
        if (ops.length === 0 || (typeof ops[ops.length - 1].insert === 'string' && !ops[ops.length - 1].insert.endsWith('\n'))) {
            ops.push({ insert: '\n' });
        }

        const out = { ops };
        if (DEBUG_PHASE7_RTF) console.log('🔧 rtfToDelta OUTPUT:', JSON.stringify(out));
        return out;
    }

    /**
     * Construit un Delta Quill à partir d'un texte brut et de styles globaux.
     * Note : les styles de police/taille/alignement sont gérés globalement via applyQuillZoneStyles(),
     * seuls bold/underline/color peuvent être injectés en attributs Quill.
     *
     * @param {string} text - Texte brut
     * @param {{bold?: boolean, underline?: boolean, color?: string}} styles - Styles globaux simples
     * @returns {Object} Delta Quill
     */
    function textToDelta(text, styles) {
        const t = typeof text === 'string' ? text : '';
        const attrs = {};
        if (styles && styles.bold === true) attrs.bold = true;
        if (styles && styles.underline === true) attrs.underline = true;
        if (styles && typeof styles.color === 'string' && styles.color) attrs.color = styles.color;

        const insertText = t.endsWith('\n') ? t : (t + '\n');
        if (Object.keys(attrs).length > 0) return { ops: [{ insert: insertText, attributes: attrs }] };
        return { ops: [{ insert: insertText }] };
    }
    
    /**
     * Convertit une zone texte du format JSON WebDev vers le format interne documentState.
     * Effectue la conversion des unités (mm → pixels) et le mapping des propriétés
     * (noms français WebDev → noms anglais internes).
     * 
     * @param {ZoneTexteJsonWebDev} zoneJson - Zone texte au format JSON WebDev
     * @returns {TextZoneData} Zone texte au format documentState interne
     * 
     * @example
     * // Entrée JSON WebDev :
     * // { geometrie: { xMm: 10, yMm: 20, largeurMm: 50, hauteurMm: 20 },
     * //   contenu: 'Texte', style: { police: 'Arial', taillePt: 12 } }
     * // Sortie interne :
     * // { type: 'text', x: 37.8, y: 75.6, w: 189, h: 75.6,
     * //   content: 'Texte', font: 'Arial', size: 12 }
     */
    function convertZoneTexteFromJson(zoneJson) {
        // Conversion mm → pixels
        const mmToPixels = (mm) => mm / MM_PER_PIXEL;
        
        // Extraction des données avec valeurs par défaut
        const geometrie = zoneJson.geometrie || {};
        const style = zoneJson.style || {};
        const fond = zoneJson.fond || {};
        const bordure = zoneJson.bordure || {};
        const copyfitting = zoneJson.copyfitting || {};
        
        // Mapper le formatage partiel : debut/fin → start/end, noms français → anglais
        const formatting = (zoneJson.formatage || []).map(f => ({
            start: f.debut,
            end: f.fin,
            styles: {
                fontWeight: f.styles?.gras === true ? 'bold' : undefined,
                textDecoration: f.styles?.souligne === true ? 'underline' : undefined,
                color: f.styles?.couleur || undefined
            }
        }));
        // Nettoyer les styles undefined
        formatting.forEach(f => {
            Object.keys(f.styles).forEach(key => {
                if (f.styles[key] === undefined) delete f.styles[key];
            });
        });
        
        // Construction de l'objet zone interne
        // NOTE: L'ancien type 'text' (textarea) a été supprimé. Toutes les zones texte sont désormais 'textQuill' (Quill.js).

        return {
            // Type de zone (toujours textQuill, seul type texte supporté)
            type: 'textQuill',
            
            // Géométrie (conversion mm → px)
            x: geometrie.xMm !== undefined ? mmToPixels(geometrie.xMm) : 0,
            y: geometrie.yMm !== undefined ? mmToPixels(geometrie.yMm) : 0,
            w: geometrie.largeurMm !== undefined ? mmToPixels(geometrie.largeurMm) : 200,
            h: geometrie.hauteurMm !== undefined ? mmToPixels(geometrie.hauteurMm) : 40,
            
            // Géométrie en mm (stockée pour précision)
            xMm: geometrie.xMm !== undefined ? geometrie.xMm : 0,
            yMm: geometrie.yMm !== undefined ? geometrie.yMm : 0,
            wMm: geometrie.largeurMm !== undefined ? geometrie.largeurMm : pxToMm(200),
            hMm: geometrie.hauteurMm !== undefined ? geometrie.hauteurMm : pxToMm(40),
            
            // Contenu et formatage
            content: zoneJson.contenu || '',
            formatting: formatting,
            // Quill Delta (toujours présent pour les zones textQuill)
            quillDelta: zoneJson.quillDelta || textAndFormatageToQuillDelta(zoneJson.contenu || '', zoneJson.formatage || []),
            
            // Style typographique
            font: style.police || 'Roboto',
            size: style.taillePt || 12,
            color: style.couleur || '#000000',
            lineHeight: style.interligne || 1.2,
            align: style.alignementH || 'left',
            valign: style.alignementV || 'top',
            
            // Fond
            isTransparent: fond.transparent !== undefined ? fond.transparent : true,
            bgColor: fond.couleur || '#FFFFFF',
            
            // Bordure
            border: {
                width: bordure.epaisseur || 0,
                color: bordure.couleur || '#000000',
                style: bordure.style || 'solid'
            },
            
            // États
            locked: zoneJson.verrouille || false,
            systeme: zoneJson.systeme || false,
            systemeLibelle: zoneJson.systemeLibelle || '',
            imprimable: zoneJson.imprimable !== undefined ? zoneJson.imprimable : true,
            copyfit: copyfitting.actif || false,
            
            // Nouvelles propriétés (stockées pour utilisation future)
            name: zoneJson.nom || '',
            zIndex: zoneJson.niveau || 1,
            rotation: zoneJson.rotation || 0,
            copyfitMin: copyfitting.tailleMinimum || 6,
            copyfitWrap: copyfitting.autoriserRetourLigne !== undefined ? copyfitting.autoriserRetourLigne : true,
            // Lignes vides : rétrocompatibilité booléen → entier + migration 2→1
            emptyLines: (() => {
                let val = typeof zoneJson.supprimerLignesVides === 'number' 
                    ? zoneJson.supprimerLignesVides 
                    : (zoneJson.supprimerLignesVides ? 1 : 0);
                // Migration : ancienne valeur 2 → nouvelle valeur 1
                if (val === 2) val = 1;
                return val;
            })()
        };
    }
    
    /**
     * Convertit une zone code-barres du format JSON WebDev vers le format interne documentState.
     * Gère deux formats d'entrée :
     * @param {ZoneCodeBarresJsonWebDev} zoneJson - Zone code-barres au format JSON WebDev
     * @returns {BarcodeZoneData} Zone au format documentState interne
     * 
     * @example
     * // { typeCodeBarres: 'code128', champFusion: 'NumeroCommande' }
     * // → { type: 'barcode', typeCodeBarres: 'code128', champFusion: 'NumeroCommande' }
     */
    function convertZoneCodeBarresFromJson(zoneJson) {
        const mmToPixels = (mm) => mm / MM_PER_PIXEL;
        
        const geometrie = zoneJson.geometrie || {};
        
        return {
            type: 'barcode',
            nom: zoneJson.nom || 'Code-barres',
            typeCodeBarres: zoneJson.typeCodeBarres || 'code128',
            champFusion: zoneJson.champFusion || '',
            valeurStatique: zoneJson.valeurStatique || '',
            texteLisible: zoneJson.texteLisible || 'dessous',
            taillePolice: zoneJson.taillePolice || 8,
            couleur: zoneJson.couleur || '#000000',
            bgColor: zoneJson.couleurFond || '#FFFFFF',
            isTransparent: zoneJson.transparent || false,
            locked: zoneJson.verrouille || false,
            systeme: zoneJson.systeme || false,
            systemeLibelle: zoneJson.systemeLibelle || '',
            imprimable: zoneJson.imprimable !== undefined ? zoneJson.imprimable : true,
            zIndex: zoneJson.niveau || 1,
            rotation: zoneJson.rotation || 0,
            x: geometrie.xMm !== undefined ? mmToPixels(geometrie.xMm) : 0,
            y: geometrie.yMm !== undefined ? mmToPixels(geometrie.yMm) : 0,
            w: geometrie.largeurMm !== undefined ? mmToPixels(geometrie.largeurMm) : 150,
            h: geometrie.hauteurMm !== undefined ? mmToPixels(geometrie.hauteurMm) : 60,
            xMm: geometrie.xMm !== undefined ? geometrie.xMm : 0,
            yMm: geometrie.yMm !== undefined ? geometrie.yMm : 0,
            wMm: geometrie.largeurMm !== undefined ? geometrie.largeurMm : pxToMm(150),
            hMm: geometrie.hauteurMm !== undefined ? geometrie.hauteurMm : pxToMm(60)
        };
    }

    /**
     * Convertit une zone QR du format JSON WebDev vers le format interne documentState.
     * 
     * @param {ZoneQRJsonWebDev} zoneJson - Zone QR au format JSON WebDev
     * @returns {QrZoneData} Zone au format documentState interne
     */
    function convertZoneQRFromJson(zoneJson) {
        const mmToPixels = (mm) => mm / MM_PER_PIXEL;
        
        const geometrie = zoneJson.geometrie || {};
        const couleurs = zoneJson.couleurs || {};
        
        return {
            type: 'qr',
            typeCode: zoneJson.typeCode || 'QRCode',
            content: zoneJson.contenu || '',
            qrColor: couleurs.code || '#000000',
            bgColor: couleurs.fond || '#FFFFFF',
            isTransparent: false,
            locked: zoneJson.verrouille || false,
            systeme: zoneJson.systeme || false,
            systemeLibelle: zoneJson.systemeLibelle || '',
            imprimable: zoneJson.imprimable !== undefined ? zoneJson.imprimable : true,
            name: zoneJson.nom || '',
            zIndex: zoneJson.niveau || 1,
            rotation: zoneJson.rotation || 0,
            x: geometrie.xMm !== undefined ? mmToPixels(geometrie.xMm) : 0,
            y: geometrie.yMm !== undefined ? mmToPixels(geometrie.yMm) : 0,
            w: geometrie.largeurMm !== undefined ? mmToPixels(geometrie.largeurMm) : 100,
            h: geometrie.hauteurMm !== undefined ? mmToPixels(geometrie.hauteurMm) : 100,
            xMm: geometrie.xMm !== undefined ? geometrie.xMm : 0,
            yMm: geometrie.yMm !== undefined ? geometrie.yMm : 0,
            wMm: geometrie.largeurMm !== undefined ? geometrie.largeurMm : pxToMm(100),
            hMm: geometrie.hauteurMm !== undefined ? geometrie.hauteurMm : pxToMm(100)
        };
    }
    
    /**
     * Charge un document depuis une configuration JSON envoyée par WebDev.
     * Fonction principale d'import : reconstruit l'état complet du document
     * à partir des données JSON WebDev.
     * 
     * Étapes du chargement :
     * 1. Nettoyage du DOM (suppression des zones existantes)
     * 2. Reset de documentState
     * 3. Application des métadonnées (format, dimensions)
     * 4. Conversion et création des zones (texte, code-barres, images)
     * 5. Initialisation de l'historique
     * 
     * @param {DocumentJsonWebDev} jsonData - Document complet au format JSON WebDev
     * @param {Object} [jsonData.identification] - Métadonnées du document (nom, auteur, etc.)
     * @param {FormatDocumentJsonWebDev} [jsonData.formatDocument] - Dimensions en mm
     * @param {Array} [jsonData.pages] - Pages du document (pour multipage futur)
     * @param {ZoneTexteJsonWebDev[]} [jsonData.zonesTexte] - Zones de texte
     * @param {(ZoneCodeBarresJsonWebDev|ZoneQrJsonWebDev)[]} [jsonData.zonesCodeBarres] - Zones code-barres/QR
     * @param {ZoneImageJsonWebDev[]} [jsonData.zonesImage] - Zones image
     * @returns {boolean} true si le chargement a réussi, false en cas d'erreur
     * 
     * @fires window.postMessage - Envoie 'DESIGNER_LOAD_COMPLETE' au parent iframe
     * @see exportToWebDev - Fonction inverse (export)
     * 
     * @example
     * // Chargement depuis postMessage (WebDev → Designer)
     * const jsonData = {
     *   formatDocument: { largeurMm: 210, hauteurMm: 297 },
     *   zonesTexte: [{ contenu: 'Bonjour', geometrie: {...} }]
     * };
     * loadFromWebDev(jsonData); // → true
     */
    function loadFromWebDev(jsonData) {
        console.log('=== loadFromWebDev() : Début du chargement ===');
        console.log('Données reçues :', jsonData);

        // Support enveloppe postMessage {action:'load', policesDisponibles:[...], data:{...}}
        const isLoadEnvelope =
            !!jsonData &&
            typeof jsonData === 'object' &&
            jsonData.action === 'load' &&
            !!jsonData.data &&
            typeof jsonData.data === 'object';

        /** @type {DocumentJsonWebDev} */
        const documentJson = isLoadEnvelope ? jsonData.data : jsonData;

        /** @type {PoliceDisponible[]|null} */
        const messagePolicesDisponibles =
            (isLoadEnvelope && Array.isArray(jsonData.policesDisponibles))
                ? jsonData.policesDisponibles
                : null;
        
        // Validation de base
        if (!documentJson || typeof documentJson !== 'object') {
            console.error('loadFromWebDev : JSON invalide ou vide');
            return false;
        }

        /**
         * Normalise un JSON "template_multipage" (pages[].zones[]) vers un JSON compatible loadFromWebDev().
         * Permet de tester l'import local des zones, sans passer par WebDev.
         *
         * @param {any} input - JSON importé depuis un fichier
         * @returns {DocumentJsonWebDev} JSON normalisé compatible WebDev
         */
        function normalizeTemplateMultipageJson(input) {
            const pagesIn = Array.isArray(input.pages) ? input.pages : [];
            const firstPage = pagesIn[0] || {};
            const widthPx = typeof firstPage.width === 'number' ? firstPage.width : DOCUMENT_FORMATS[DEFAULT_FORMAT].width;
            const heightPx = typeof firstPage.height === 'number' ? firstPage.height : DOCUMENT_FORMATS[DEFAULT_FORMAT].height;

            /** @type {ZoneTextQuillJsonWebDev[]} */
            const zonesTextQuill = [];

            pagesIn.forEach((p, idx) => {
                const zones = Array.isArray(p.zones) ? p.zones : [];
                zones.forEach(z => {
                    if (!z || z.type !== 'textQuill') return;

                    const geom = z.geometry || {};
                    const xMm = parseFloat(geom.x_mm);
                    const yMm = parseFloat(geom.y_mm);
                    const wMm = parseFloat(geom.width_mm);
                    const hMm = parseFloat(geom.height_mm);

                    const style = z.style || {};
                    const border = z.border || {};

                    zonesTextQuill.push({
                        id: z.id || `zone-${Date.now()}`,
                        type: 'textQuill',
                        geometry: {
                            x_mm: isNaN(xMm) ? 0 : xMm,
                            y_mm: isNaN(yMm) ? 0 : yMm,
                            width_mm: isNaN(wMm) ? 80 : wMm,
                            height_mm: isNaN(hMm) ? 30 : hMm
                        },
                        content_quill: z.content_quill || '',
                        content_rtf: z.content_rtf || '',
                        style: {
                            font: style.font || 'Roboto',
                            size_pt: style.size_pt || 12,
                            color: style.color || '#000000',
                            align: style.align || 'left',
                            valign: style.valign || 'top',
                            line_height: style.lineHeight !== undefined ? style.lineHeight : (style.line_height !== undefined ? style.line_height : 1.2),
                            // IMPORTANT : conserver le fond pendant la normalisation
                            bgColor: (typeof style.bgColor === 'string' && style.bgColor.trim().length > 0) ? style.bgColor : null,
                            transparent: style.transparent !== undefined ? !!style.transparent : (style.isTransparent !== undefined ? !!style.isTransparent : true),
                            locked: style.locked === true,
                            copyfit: style.copyfit === true
                        },
                        border: {
                            width_px: border.width !== undefined ? border.width : (border.width_px !== undefined ? border.width_px : 0),
                            color: border.color || '#000000',
                            style: border.style || 'solid'
                        },
                        // Note : page non porté par le format "template_multipage" zone-by-zone.
                        // Ici, les zones seront importées par défaut sur la page 1 (voir Étape 6bis).
                    });
                });
            });

            return {
                identification: {
                    idDocument: '',
                    nomDocument: firstPage.page_name || '',
                    dateCreation: input.generated_at || ''
                },
                formatDocument: {
                    largeurMm: widthPx * MM_PER_PIXEL,
                    hauteurMm: heightPx * MM_PER_PIXEL,
                    fondPerdu: { actif: false, valeurMm: 3 },
                    traitsCoupe: { actif: false },
                    margeSecurite: 0,
                    surfaceMaxImageMm2: DEFAULT_SURFACE_MAX_IMAGE_MM2,
                    pourcentageMaxImage: DEFAULT_POURCENTAGE_MAX_IMAGE
                },
                champsFusion: [],
                polices: [],
                pages: pagesIn.map((p, i) => ({
                    numero: i + 1,
                    nom: p.page_name || (i === 0 ? 'Recto' : `Page ${i + 1}`),
                    urlFond: p.image || ''
                })),
                zonesTexte: [],
                zonesTextQuill,
                zonesCodeBarres: [],
                zonesImage: []
            };
        }

        /** @type {DocumentJsonWebDev} */
        let effectiveDocumentJson = documentJson;

        // Support import tests : format "template_multipage" (pages[].zones[])
        const isTemplateMultipage = effectiveDocumentJson.document === 'template_multipage' && Array.isArray(effectiveDocumentJson.pages);
        const hasZonesArray = isTemplateMultipage && effectiveDocumentJson.pages.some(p => Array.isArray(p && p.zones));
        if (hasZonesArray) {
            console.log('🔧 PHASE 7 - Import: détection format template_multipage → normalisation WebDev');
            // Note : le format template_multipage est un document JSON (pas une enveloppe postMessage).
            // On normalise uniquement le document.
            effectiveDocumentJson = normalizeTemplateMultipageJson(effectiveDocumentJson);
            console.log('🔧 PHASE 7 - Import: JSON normalisé :', effectiveDocumentJson);
        }
        
        // --- ÉTAPE 1 : Nettoyer le DOM ---
        // Supprimer toutes les zones existantes de la page actuelle
        console.log('Étape 1 : Nettoyage du DOM...');
        const existingZones = a4Page.querySelectorAll('.zone');
        existingZones.forEach(zone => {
            const zoneId = zone.id;
            zone.remove();
            // Nettoyer les ressources Quill associées
            quillInstances.delete(zoneId);
            removeCopyfitResizeObserver(zoneId);
        });
        console.log(`  → ${existingZones.length} zone(s) supprimée(s)`);
        
        // Désélectionner tout
        selectedZoneIds = [];
        deselectAll();
        
        // --- ÉTAPE 2 : Initialiser les métadonnées ---
        console.log('Étape 2 : Initialisation des métadonnées...');
        
        // Stocker l'identification du document (nouveau champ)
        if (effectiveDocumentJson.identification) {
            documentState.identification = {
                idDocument: effectiveDocumentJson.identification.idDocument || '',
                nomDocument: effectiveDocumentJson.identification.nomDocument || '',
                dateCreation: effectiveDocumentJson.identification.dateCreation || ''
            };
            console.log('  → Identification :', documentState.identification);
        }
        
        // Stocker le format du document (dimensions mm, fond perdu, traits de coupe, marge de sécurité, limites images)
        if (effectiveDocumentJson.formatDocument) {
            documentState.formatDocument = {
                // Dimensions exactes en mm (pour les calculs de géométrie précis)
                largeurMm: effectiveDocumentJson.formatDocument.largeurMm || DOCUMENT_FORMATS_MM[DEFAULT_FORMAT].widthMm,
                hauteurMm: effectiveDocumentJson.formatDocument.hauteurMm || DOCUMENT_FORMATS_MM[DEFAULT_FORMAT].heightMm,
                fondPerdu: effectiveDocumentJson.formatDocument.fondPerdu || { actif: false, valeurMm: 3 },
                traitsCoupe: effectiveDocumentJson.formatDocument.traitsCoupe || { actif: false },
                margeSecuriteMm: effectiveDocumentJson.formatDocument.margeSecurite || 0,
                surfaceMaxImageMm2: effectiveDocumentJson.formatDocument?.surfaceMaxImageMm2 || DEFAULT_SURFACE_MAX_IMAGE_MM2,
                pourcentageMaxImage: effectiveDocumentJson.formatDocument?.pourcentageMaxImage || DEFAULT_POURCENTAGE_MAX_IMAGE
            };
            console.log('  → Format document :', documentState.formatDocument);
            console.log('  → Dimensions :', documentState.formatDocument.largeurMm, 'x', documentState.formatDocument.hauteurMm, 'mm');
            console.log('  → Marge de sécurité :', documentState.formatDocument.margeSecuriteMm, 'mm');
            console.log('  → Limites zones image : surface max', documentState.formatDocument.surfaceMaxImageMm2, 'mm², pourcentage max', documentState.formatDocument.pourcentageMaxImage, '%');
        }
        
        // Stocker les champs de fusion disponibles et mettre à jour l'UI
        if (effectiveDocumentJson.champsFusion && Array.isArray(effectiveDocumentJson.champsFusion) && effectiveDocumentJson.champsFusion.length > 0) {
            documentState.champsFusion = effectiveDocumentJson.champsFusion;
            mergeFields = effectiveDocumentJson.champsFusion;
            updateMergeFieldsUI(mergeFields);
            console.log(`  → ${documentState.champsFusion.length} champ(s) de fusion chargé(s) et affichés dans la toolbar`);
        } else {
            console.log('  → Pas de champs de fusion dans le JSON, conservation des valeurs par défaut');
        }
        
        // Stocker les données d'aperçu (échantillons de la base de données)
        if (effectiveDocumentJson.donneesApercu && Array.isArray(effectiveDocumentJson.donneesApercu) && effectiveDocumentJson.donneesApercu.length > 0) {
            // Vérifier si c'est le format WebDev (avec enregistrement) ou format plat
            if (effectiveDocumentJson.donneesApercu.length > 0 && 
                effectiveDocumentJson.donneesApercu[0].enregistrement !== undefined) {
                // Format WebDev : convertir en format interne
                console.log('📥 donneesApercu: format WebDev détecté, conversion...');
                documentState.donneesApercu = convertDonneesApercuFromWebDev(effectiveDocumentJson.donneesApercu);
            } else {
                // Format plat (données fictives ou déjà converties)
                console.log('📥 donneesApercu: format plat détecté');
                documentState.donneesApercu = effectiveDocumentJson.donneesApercu;
            }
            console.log(`  → ${documentState.donneesApercu.length} échantillon(s) de données chargé(s) pour l'aperçu`);
            
            // Mettre à jour l'état du bouton aperçu
            updatePreviewButtonState();
        } else {
            // Utiliser les données fictives par défaut si aucune donnée WebDev
            console.log('  → Pas de données d\'aperçu dans le JSON, utilisation des données fictives');
            initDefaultPreviewData();
        }
        
        // Étape 2c : Charger les polices disponibles (message.policesDisponibles au même niveau que data)
        /** @type {PoliceDisponible[]|null} */
        const policesFromDocument = Array.isArray(effectiveDocumentJson.polices) ? effectiveDocumentJson.polices : null;
        /** @type {PoliceDisponible[]|null} */
        const incomingPolicesDisponibles = (messagePolicesDisponibles && messagePolicesDisponibles.length > 0)
            ? messagePolicesDisponibles
            : (policesFromDocument && policesFromDocument.length > 0 ? policesFromDocument : null);

        policesDisponibles = (incomingPolicesDisponibles && incomingPolicesDisponibles.length > 0)
            ? incomingPolicesDisponibles
            : DEFAULT_FONTS;

        loadFontsFromJson(policesDisponibles);
        updateFontSelectUI(policesDisponibles);
        updateQuillFontSelectUI(policesDisponibles);
        console.log(`  → ${policesDisponibles.length} police(s) disponible(s) chargée(s) et injectée(s)`);
        
        // --- ÉTAPE 3 : Créer les pages ---
        console.log('Étape 3 : Création des pages...');
        
        // Conversion mm → pixels
        const mmToPixels = (mm) => mm / MM_PER_PIXEL;
        
        // Récupérer les dimensions du document (appliquées à toutes les pages)
        const docWidthPx = effectiveDocumentJson.formatDocument?.largeurMm 
            ? mmToPixels(effectiveDocumentJson.formatDocument.largeurMm) 
            : DOCUMENT_FORMATS[DEFAULT_FORMAT].width;
        const docHeightPx = effectiveDocumentJson.formatDocument?.hauteurMm 
            ? mmToPixels(effectiveDocumentJson.formatDocument.hauteurMm) 
            : DOCUMENT_FORMATS[DEFAULT_FORMAT].height;
        
        console.log(`  → Dimensions : ${effectiveDocumentJson.formatDocument?.largeurMm || 210}mm x ${effectiveDocumentJson.formatDocument?.hauteurMm || 297}mm`);
        console.log(`  → En pixels : ${Math.round(docWidthPx)}px x ${Math.round(docHeightPx)}px`);
        
        // Créer les pages depuis le JSON
        if (effectiveDocumentJson.pages && Array.isArray(effectiveDocumentJson.pages) && effectiveDocumentJson.pages.length > 0) {
            documentState.pages = effectiveDocumentJson.pages.map((pageData, index) => {
                const pageId = `page-${pageData.numero || (index + 1)}`;
                const pageName = pageData.nom || (index === 0 ? 'Recto' : 'Verso');
                
                console.log(`  → Page ${index + 1} : id="${pageId}", nom="${pageName}"`);
                console.log(`    Image de fond : ${pageData.urlFond || 'aucune'}`);
                
                return {
                    id: pageId,
                    name: pageName,
                    image: pageData.urlFond || '',
                    format: 'Custom', // Format personnalisé depuis WebDev
                    width: Math.round(docWidthPx),
                    height: Math.round(docHeightPx),
                    zones: {} // Zones vides pour l'instant (étape suivante)
                };
            });
        } else {
            // Fallback : créer 2 pages par défaut si aucune n'est fournie
            console.warn('  → Aucune page définie, création des pages par défaut');
            documentState.pages = [
                { id: 'page-1', name: 'Recto', image: '', format: 'Custom', width: Math.round(docWidthPx), height: Math.round(docHeightPx), zones: {} },
                { id: 'page-2', name: 'Verso', image: '', format: 'Custom', width: Math.round(docWidthPx), height: Math.round(docHeightPx), zones: {} }
            ];
        }
        
        console.log(`  → ${documentState.pages.length} page(s) créée(s)`);
        
        // --- ÉTAPE 4 : Charger les zones texte ---
        console.log('Étape 4 : Chargement des zones texte...');
        
        let maxZoneId = 0; // Pour calculer le zoneCounter
        let zonesTexteCount = 0;
        
        if (effectiveDocumentJson.zonesTexte && Array.isArray(effectiveDocumentJson.zonesTexte)) {
            effectiveDocumentJson.zonesTexte.forEach(zoneJson => {
                // Déterminer la page cible (WebDev: 1-based → JS: 0-based)
                const pageIndex = (zoneJson.page || 1) - 1;
                
                // Vérifier que la page existe
                if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
                    console.warn(`  ⚠ Zone "${zoneJson.id}" : page ${zoneJson.page} inexistante, ignorée`);
                    return;
                }
                
                // Convertir la zone vers le format interne
                const zoneData = convertZoneTexteFromJson(zoneJson);
                const zoneId = zoneJson.id || `zone-${Date.now()}`;
                
                // Ajouter la zone à la page cible
                documentState.pages[pageIndex].zones[zoneId] = zoneData;
                zonesTexteCount++;
                
                // Extraire le numéro de l'ID pour le compteur (ex: "zone-5" → 5)
                const idMatch = zoneId.match(/zone-(\d+)/);
                if (idMatch) {
                    const idNum = parseInt(idMatch[1]);
                    if (idNum > maxZoneId) {
                        maxZoneId = idNum;
                    }
                }
                
                if (zoneData && zoneData.type === 'textQuill') {
                    console.log('🔧 PHASE 7 - Import zone textQuill:', zoneJson.nom || zoneData.name || zoneId);
                }

                console.log(`  → Zone texte "${zoneId}" (${zoneData.name || 'sans nom'}) → Page ${pageIndex + 1}`);
                console.log(`    Position: ${zoneData.x.toFixed(1)}px, ${zoneData.y.toFixed(1)}px | Taille: ${zoneData.w.toFixed(1)}px x ${zoneData.h.toFixed(1)}px`);
            });
        }
        
        console.log(`  → ${zonesTexteCount} zone(s) texte chargée(s)`);
        
        // --- ÉTAPE 5 : Charger les zones QR ---
        console.log('Étape 5 : Chargement des zones QR...');
        
        let zonesQRCount = 0;
        
        if (effectiveDocumentJson.zonesQR && Array.isArray(effectiveDocumentJson.zonesQR)) {
            effectiveDocumentJson.zonesQR.forEach(zoneJson => {
                const pageIndex = (zoneJson.page || 1) - 1;
                
                if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
                    console.warn(`  ⚠ Zone QR "${zoneJson.id}" : page ${zoneJson.page} inexistante, ignorée`);
                    return;
                }
                
                const zoneData = convertZoneQRFromJson(zoneJson);
                const zoneId = zoneJson.id || `zone-${Date.now()}`;
                
                documentState.pages[pageIndex].zones[zoneId] = zoneData;
                zonesQRCount++;
                
                const idMatch = zoneId.match(/zone-(\d+)/);
                if (idMatch) {
                    const idNum = parseInt(idMatch[1]);
                    if (idNum > maxZoneId) {
                        maxZoneId = idNum;
                    }
                }
                
                console.log(`  → Zone QR "${zoneId}" → Page ${pageIndex + 1}`);
            });
        }
        
        console.log(`  → ${zonesQRCount} zone(s) QR chargée(s)`);
        
        // --- ÉTAPE 6 : Charger les zones code-barres ---
        console.log('Étape 6 : Chargement des zones code-barres...');
        
        let zonesCodeBarresCount = 0;
        
        if (effectiveDocumentJson.zonesCodeBarres && Array.isArray(effectiveDocumentJson.zonesCodeBarres)) {
            effectiveDocumentJson.zonesCodeBarres.forEach(zoneJson => {
                const pageIndex = (zoneJson.page || 1) - 1;
                
                if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
                    console.warn(`  ⚠ Zone code-barres "${zoneJson.id}" : page ${zoneJson.page} inexistante, ignorée`);
                    return;
                }
                
                const zoneData = convertZoneCodeBarresFromJson(zoneJson);
                const zoneId = zoneJson.id || `zone-${Date.now()}`;
                
                documentState.pages[pageIndex].zones[zoneId] = zoneData;
                zonesCodeBarresCount++;
                
                const idMatch = zoneId.match(/zone-(\d+)/);
                if (idMatch) {
                    const idNum = parseInt(idMatch[1]);
                    if (idNum > maxZoneId) {
                        maxZoneId = idNum;
                    }
                }
                
                console.log(`  → Zone code-barres "${zoneId}" (${zoneData.typeCodeBarres}) → Page ${pageIndex + 1}`);
            });
        }
        
        console.log(`  → ${zonesCodeBarresCount} zone(s) code-barres chargée(s)`);
        
        // --- ÉTAPE 7 : Charger les zones image ---
        console.log('Étape 7 : Chargement des zones image...');
        
        let zonesImageCount = 0;
        
        if (effectiveDocumentJson.zonesImage && Array.isArray(effectiveDocumentJson.zonesImage)) {
            effectiveDocumentJson.zonesImage.forEach(zoneJson => {
                const pageIndex = (zoneJson.page || 1) - 1;
                
                if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
                    console.warn(`  ⚠ Zone image "${zoneJson.id}" : page ${zoneJson.page} inexistante, ignorée`);
                    return;
                }
                
                const zoneData = convertZoneImageFromJson(zoneJson);
                const zoneId = zoneJson.id || `zone-${Date.now()}`;
                
                documentState.pages[pageIndex].zones[zoneId] = zoneData;
                zonesImageCount++;
                
                const idMatch = zoneId.match(/zone-(\d+)/);
                if (idMatch) {
                    const idNum = parseInt(idMatch[1]);
                    if (idNum > maxZoneId) maxZoneId = idNum;
                }
                
                console.log(`  → Zone image "${zoneId}" → Page ${pageIndex + 1}`);
                console.log(`    Position: ${zoneData.x.toFixed(1)}px, ${zoneData.y.toFixed(1)}px | Taille: ${zoneData.w.toFixed(1)}px x ${zoneData.h.toFixed(1)}px`);
                console.log(`    Source: ${zoneData.source.type} = ${zoneData.source.valeur || '(vide)'}`);
            });
        }
        
        console.log(`  → ${zonesImageCount} zone(s) image chargée(s)`);

        // --- ÉTAPE 6bis : Charger les zones textQuill (nouveau format Delta + RTF) ---
        console.log('Étape 6bis : Chargement des zones textQuill (Delta + RTF)...');
        
        let zonesTextQuillCount = 0;
        
        if (effectiveDocumentJson.zonesTextQuill && Array.isArray(effectiveDocumentJson.zonesTextQuill)) {
            effectiveDocumentJson.zonesTextQuill.forEach(z => {
                const zoneId = z.id || `zone-${Date.now()}`;
                
                // Nouveau format : pas de page (pour l'instant) → défaut page 1 (index 0)
                const pageIndex = 0;
                if (pageIndex < 0 || pageIndex >= documentState.pages.length) return;
                
                const geom = z.geometry || {};
                const style = z.style || {};
                const border = z.border || {};
                
                // NOTE : le JSON peut contenir des valeurs mm en string (ex: "7.94").
                const xMm = Number.isFinite(parseFloat(geom.x_mm)) ? parseFloat(geom.x_mm) : 0;
                const yMm = Number.isFinite(parseFloat(geom.y_mm)) ? parseFloat(geom.y_mm) : 0;
                const wMm = Number.isFinite(parseFloat(geom.width_mm)) ? parseFloat(geom.width_mm) : 80;
                const hMm = Number.isFinite(parseFloat(geom.height_mm)) ? parseFloat(geom.height_mm) : 30;
                
                // Déterminer le Delta selon les 3 cas
                const hasDeltaObject = z.content_quill && typeof z.content_quill === 'object' && Array.isArray(z.content_quill.ops);
                const hasDeltaText = typeof z.content_quill === 'string' && z.content_quill.length > 0;
                const hasRtf = typeof z.content_rtf === 'string' && z.content_rtf.length > 0;
                
                /** @type {Object} */
                let delta;
                
                if (hasDeltaText && !hasRtf) {
                    // Cas 1 : texte brut dans content_quill, RTF vide
                    delta = textToDelta(z.content_quill, {
                        bold: false,
                        underline: false,
                        color: typeof style.color === 'string' ? style.color : undefined
                    });
                } else if (!hasDeltaObject && hasRtf) {
                    // Cas 2 : pas de delta, RTF présent
                    delta = rtfToDelta(z.content_rtf);
                } else if (hasDeltaObject) {
                    // Cas 3 : delta + RTF
                    delta = z.content_quill;
                } else {
                    // Fallback : delta vide
                    delta = { ops: [{ insert: '\n' }] };
                }
                
                // Construire la zone interne textQuill
                const importedIsTransparent =
                    style.transparent !== undefined
                        ? !!style.transparent
                        : (style.isTransparent !== undefined ? !!style.isTransparent : true);
                const importedBgColor =
                    (typeof style.bgColor === 'string' && style.bgColor.trim().length > 0)
                        ? style.bgColor
                        : '#ffffff';

                if (DEBUG_PHASE7_BG) {
                    console.log('🔧 PHASE 7 BG - Import style → interne:', zoneId, {
                        style_bgColor: style.bgColor,
                        style_transparent: style.transparent,
                        computed_bgColor: importedBgColor,
                        computed_isTransparent: importedIsTransparent
                    });
                }
                
                const zoneData = {
                    type: 'textQuill',
                    x: mmToPx(xMm),
                    y: mmToPx(yMm),
                    w: mmToPx(wMm),
                    h: mmToPx(hMm),
                    xMm,
                    yMm,
                    wMm,
                    hMm,
                    quillDelta: delta,
                    font: style.font || 'Roboto',
                    size: style.size_pt || 12,
                    color: style.color || '#000000',
                    align: style.align || 'left',
                    valign: style.valign || 'top',
                    bgColor: importedBgColor,
                    isTransparent: importedIsTransparent,
                    lineHeight: (style.lineHeight !== undefined ? style.lineHeight : (style.line_height !== undefined ? style.line_height : 1.2)),
                    locked: style.locked === true,
                    copyfit: style.copyfit === true,
                    emptyLines: 0,
                    zIndex: 1,
                    border: {
                        width: (border.width_px !== undefined ? border.width_px : (border.width !== undefined ? border.width : 0)) || 0,
                        color: border.color || '#000000',
                        style: border.style || 'solid'
                    },
                    name: zoneId
                };
                
                documentState.pages[pageIndex].zones[zoneId] = zoneData;
                zonesTextQuillCount++;
                
                // Compteur de zones
                const idMatch = zoneId.match(/zone-(\d+)/);
                if (idMatch) {
                    const idNum = parseInt(idMatch[1], 10);
                    if (idNum > maxZoneId) maxZoneId = idNum;
                }
            });
        }
        
        console.log(`  → ${zonesTextQuillCount} zone(s) textQuill chargée(s)`);
        
        // --- ÉTAPE 8 : Mettre à jour le compteur et l'affichage ---
        console.log('Étape 7 : Finalisation...');
        
        // Mettre à jour le compteur de zones (max ID trouvé + 1 pour la prochaine zone)
        zoneCounter = maxZoneId;
        documentState.zoneCounter = maxZoneId;
        console.log(`  → Compteur de zones : ${zoneCounter}`);
        
        // Forcer l'affichage de la première page (Recto)
        documentState.currentPageIndex = 0;
        
        // Charger et afficher la page courante (crée les zones dans le DOM)
        loadCurrentPage();
        console.log('  → Page courante chargée avec ses zones');
        
        // Mettre à jour les onglets de page si la fonction existe
        if (typeof updatePageTabs === 'function') {
            updatePageTabs();
            console.log('  → Onglets de page mis à jour');
        }
        
        // Sauvegarder dans localStorage pour persistance
        saveToLocalStorage();
        console.log('  → État sauvegardé dans localStorage');

        // BUGFIX : pour les zones textQuill, le contenu Quill peut être restauré en async (setTimeout(0) dans createZoneDOM).
        // On refait une sauvegarde différée pour capturer un quillDelta non vide une fois la restauration effectuée.
        setTimeout(() => {
            try {
                saveToLocalStorage();
                console.log('🔧 BUGFIX - Post-import saveToLocalStorage() après restauration Quill');
            } catch (e) {}
        }, 50);
        
        // Rafraîchir tous les codes-barres pour générer les vrais codes-barres
        setTimeout(() => {
            const zonesData = getCurrentPageZones();
            Object.keys(zonesData).forEach(zoneId => {
                const zoneData = zonesData[zoneId];
                if (zoneData && zoneData.type === 'qr') {
                    updateQrZoneDisplay(zoneId);
                } else if (zoneData && zoneData.type === 'barcode') {
                    updateBarcodeZoneDisplay(zoneId);
                }
            });
            console.log('  → Codes-barres rafraîchis');
        }, 100);
        
        console.log('=== loadFromWebDev() : Chargement terminé ===');
        console.log('État documentState :', documentState);
        console.log(`Résumé : ${documentState.pages.length} page(s), ${zonesTexteCount} zone(s) texte, ${zonesCodeBarresCount} zone(s) code-barres, ${zonesImageCount} zone(s) image`);
        
        // Regénérer la navigation des pages après import
        renderPageNavigation();
        
        return true;
    }
    
    /**
     * Convertit une zone image du format JSON WebDev vers le format interne documentState.
     * Effectue la conversion des unités (mm → pixels) et le mapping des propriétés
     * de source et redimensionnement.
     * 
     * @param {ZoneImageJsonWebDev} zoneJson - Zone image au format JSON WebDev
     * @returns {ImageZoneData} Zone image au format documentState interne
     * 
     * @example
     * // Entrée JSON WebDev :
     * // { geometrie: { xMm: 10, yMm: 10, largeurMm: 40, hauteurMm: 40 },
     * //   source: { type: 'fixe', valeur: '' },
     * //   redimensionnement: { mode: 'ajuster' } }
     * // Sortie interne :
     * // { type: 'image', x: 37.8, y: 37.8, w: 151.2, h: 151.2,
     * //   source: { type: 'fixe', valeur: '' },
     * //   redimensionnement: { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' } }
     */
    function convertZoneImageFromJson(zoneJson) {
        const mmToPixels = (mm) => mm / MM_PER_PIXEL;
        
        const geometrie = zoneJson.geometrie || {};
        const source = zoneJson.source || { type: 'url', valeur: '' };
        const redim = zoneJson.redimensionnement || { mode: 'ajuster', alignementH: 'center', alignementV: 'middle' };
        const fond = zoneJson.fond || {};
        const bordure = zoneJson.bordure || {};
        
        return {
            type: 'image',
            x: geometrie.xMm !== undefined ? mmToPixels(geometrie.xMm) : 0,
            y: geometrie.yMm !== undefined ? mmToPixels(geometrie.yMm) : 0,
            w: geometrie.largeurMm !== undefined ? mmToPixels(geometrie.largeurMm) : 150,
            h: geometrie.hauteurMm !== undefined ? mmToPixels(geometrie.hauteurMm) : 150,
            // Géométrie en mm (stockée pour précision)
            xMm: geometrie.xMm !== undefined ? geometrie.xMm : 0,
            yMm: geometrie.yMm !== undefined ? geometrie.yMm : 0,
            wMm: geometrie.largeurMm !== undefined ? geometrie.largeurMm : pxToMm(150),
            hMm: geometrie.hauteurMm !== undefined ? geometrie.hauteurMm : pxToMm(150),
            source: {
                type: source.type || 'url',
                valeur: source.valeur || ''
            },
            redimensionnement: {
                mode: redim.mode || 'ajuster',
                alignementH: redim.alignementH || 'center',
                alignementV: redim.alignementV || 'middle'
            },
            bgColor: fond.couleur || '#ffffff',
            isTransparent: fond.transparent !== undefined ? fond.transparent : true,
            locked: zoneJson.verrouille || false,
            systeme: zoneJson.systeme || false,
            systemeLibelle: zoneJson.systemeLibelle || '',
            imprimable: zoneJson.imprimable !== undefined ? zoneJson.imprimable : true,
            rotation: zoneJson.rotation || 0,
            border: {
                width: bordure.epaisseur || 0,
                color: bordure.couleur || '#000000',
                style: bordure.style || 'solid'
            },
            name: zoneJson.nom || '',
            zIndex: zoneJson.niveau || 1
        };
    }

    // Exposer la fonction globalement pour l'appel depuis l'iframe parent
    window.loadFromWebDev = loadFromWebDev;

    // ─────────────────────────────── FIN SECTION 19 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 20 : EXPORT VERS WEBDEV
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Export des données vers le format JSON WebDev.
     * Conversion des zones et métadonnées vers le format de sortie.
     * 
     * Fonctions de conversion :
     *   - convertZoneTexteToJson() : Zone texte interne → JSON
     *   - convertZoneCodeBarresToJson() : Zone code-barres interne → JSON
     *   - convertZoneImageToJson() : Zone image interne → JSON
     * 
     * Fonction principale :
     *   - exportToWebDev() : Génère le JSON complet pour WebDev
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - MM_PER_PIXEL (Section 6)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    /**
     * Convertit une zone texte du format documentState vers le format JSON WebDev.
     * Effectue la conversion des unités (pixels → mm si nécessaire) et le mapping
     * des propriétés (noms anglais internes → noms français WebDev).
     * Utilise les valeurs mm stockées si disponibles pour préserver la précision.
     * 
     * @param {string} id - Identifiant de la zone (ex: "zone-1")
     * @param {TextZoneData} zoneData - Données de la zone au format interne
     * @param {number} pageNumero - Numéro de page (1-based pour WebDev)
     * @returns {ZoneTexteJsonWebDev} Zone au format JSON WebDev
     * 
     * @example
     * // Entrée interne :
     * // { type: 'text', content: 'Texte', font: 'Arial', size: 12 }
     * // Sortie JSON WebDev :
     * // { id: 'zone-1', page: 1, contenu: 'Texte',
     * //   style: { police: 'Arial', taillePt: 12 } }
     */
    function convertZoneTexteToJson(id, zoneData, pageNumero) {
        // Conversion pixels → mm
        const pixelsToMm = (px) => px * MM_PER_PIXEL;

        // Phase 7 : si c'est une zone textQuill, convertir le Delta Quill vers (contenu + formatage WebDev)
        if (zoneData && zoneData.type === 'textQuill') {
            console.log('🔧 PHASE 7 - Export zone textQuill:', id);

            const delta = zoneData.quillDelta || null;
            const converted = quillDeltaToTextAndFormatage(delta);

            return {
                id: id,
                page: pageNumero,
                nom: zoneData.name || '',
                niveau: zoneData.zIndex || 1,
                rotation: zoneData.rotation || 0,
                verrouille: zoneData.locked || false,
                systeme: zoneData.systeme || false,
                systemeLibelle: zoneData.systemeLibelle || '',
                imprimable: zoneData.imprimable !== undefined ? zoneData.imprimable : true,
                supprimerLignesVides: zoneData.emptyLines !== undefined ? zoneData.emptyLines : 0,
                geometrie: {
                    xMm: zoneData.xMm !== undefined ? zoneData.xMm : pixelsToMm(zoneData.x || 0),
                    yMm: zoneData.yMm !== undefined ? zoneData.yMm : pixelsToMm(zoneData.y || 0),
                    largeurMm: zoneData.wMm !== undefined ? zoneData.wMm : pixelsToMm(zoneData.w || 200),
                    hauteurMm: zoneData.hMm !== undefined ? zoneData.hMm : pixelsToMm(zoneData.h || 40)
                },
                contenu: converted.contenu,
                formatage: converted.formatage,
                typeZone: 'textQuill',
                quillDelta: delta || undefined,
                style: {
                    police: zoneData.font || 'Roboto',
                    taillePt: zoneData.size || 12,
                    couleur: zoneData.color || '#000000',
                    colorCmyk: zoneData.colorCmyk || null,
                    bgColor: zoneData.bgColor || '#FFFFFF',
                    bgColorCmyk: zoneData.bgColorCmyk || null,
                    gras: false,
                    interligne: zoneData.lineHeight || 1.2,
                    alignementH: zoneData.align || 'left',
                    alignementV: zoneData.valign || 'top'
                },
                fond: {
                    transparent: zoneData.isTransparent !== undefined ? zoneData.isTransparent : true,
                    couleur: zoneData.bgColor || '#FFFFFF',
                    couleurCmyk: zoneData.bgColorCmyk || null
                },
                bordure: {
                    epaisseur: zoneData.border?.width || 0,
                    couleur: zoneData.border?.color || '#000000',
                    couleurCmyk: zoneData.border?.colorCmyk || null,
                    style: zoneData.border?.style || 'solid'
                },
                copyfitting: {
                    actif: zoneData.copyfit || false,
                    tailleMinimum: zoneData.copyfitMin || 6,
                    autoriserRetourLigne: zoneData.copyfitWrap !== undefined ? zoneData.copyfitWrap : true
                }
            };
        }

        // Mapper le formatage partiel : start/end → debut/fin, noms anglais → français
        const formatage = (zoneData.formatting || []).map(f => ({
            debut: f.start,
            fin: f.end,
            styles: {
                gras: f.styles?.fontWeight === 'bold' ? true : undefined,
                souligne: f.styles?.textDecoration === 'underline' ? true : undefined,
                couleur: f.styles?.color || undefined
            }
        }));
        // Nettoyer les styles undefined
        formatage.forEach(f => {
            Object.keys(f.styles).forEach(key => {
                if (f.styles[key] === undefined) delete f.styles[key];
            });
        });
        
        // Construction de l'objet JSON WebDev
        return {
            // Identifiant et page
            id: id,
            page: pageNumero,
            
            // Nom et métadonnées
            nom: zoneData.name || '',
            niveau: zoneData.zIndex || 1,
            rotation: zoneData.rotation || 0,
            verrouille: zoneData.locked || false,
            systeme: zoneData.systeme || false,
            systemeLibelle: zoneData.systemeLibelle || '',
            imprimable: zoneData.imprimable !== undefined ? zoneData.imprimable : true,
            // Lignes vides : export entier (rétrocompatibilité avec ancien booléen)
            supprimerLignesVides: zoneData.emptyLines !== undefined ? zoneData.emptyLines : (zoneData.removeEmptyLines ? 1 : 0),
            
            // Géométrie (utiliser les valeurs mm stockées si disponibles, sinon convertir)
            geometrie: {
                xMm: zoneData.xMm !== undefined ? zoneData.xMm : pixelsToMm(zoneData.x || 0),
                yMm: zoneData.yMm !== undefined ? zoneData.yMm : pixelsToMm(zoneData.y || 0),
                largeurMm: zoneData.wMm !== undefined ? zoneData.wMm : pixelsToMm(zoneData.w || 200),
                hauteurMm: zoneData.hMm !== undefined ? zoneData.hMm : pixelsToMm(zoneData.h || 40)
            },

            // Contenu et formatage
            contenu: zoneData.content || '',
            formatage: formatage,
            typeZone: zoneData.type || 'text',
            
            // Style typographique
            style: {
                police: zoneData.font || 'Roboto',
                taillePt: zoneData.size || 12,
                couleur: zoneData.color || '#000000',
                gras: false,
                interligne: zoneData.lineHeight || 1.2,
                alignementH: zoneData.align || 'left',
                alignementV: zoneData.valign || 'top'
            },
            
            // Fond
            fond: {
                transparent: zoneData.isTransparent !== undefined ? zoneData.isTransparent : true,
                couleur: zoneData.bgColor || '#FFFFFF'
            },
            
            // Bordure
            bordure: {
                epaisseur: zoneData.border?.width || 0,
                couleur: zoneData.border?.color || '#000000',
                style: zoneData.border?.style || 'solid'
            },
            
            // Copyfitting
            copyfitting: {
                actif: zoneData.copyfit || false,
                tailleMinimum: zoneData.copyfitMin || 6,
                autoriserRetourLigne: zoneData.copyfitWrap !== undefined ? zoneData.copyfitWrap : true
            }
        };
    }
    
    /**
     * Convertit une zone code-barres du format documentState vers le format JSON WebDev.
     * 
     * @param {string} id - Identifiant de la zone (ex: "zone-2")
     * @param {BarcodeZoneData} zoneData - Données de la zone au format interne
     * @param {number} pageNumero - Numéro de page (1-based pour WebDev)
     * @returns {ZoneCodeBarresJsonWebDev} Zone au format JSON WebDev
     * 
     * @example
     * // { type: 'barcode', typeCodeBarres: 'code128', champFusion: 'NumeroCommande' }
     * // → { typeCodeBarres: 'code128', champFusion: 'NumeroCommande', ... }
     */
    function convertZoneCodeBarresToJson(id, zoneData, pageNumero) {
        const pixelsToMm = (px) => px * MM_PER_PIXEL;
        
        return {
            id: id,
            page: pageNumero,
            nom: zoneData.nom || 'Code-barres',
            niveau: zoneData.zIndex || 1,
            rotation: zoneData.rotation || 0,
            verrouille: zoneData.locked || false,
            systeme: zoneData.systeme || false,
            systemeLibelle: zoneData.systemeLibelle || '',
            imprimable: zoneData.imprimable !== undefined ? zoneData.imprimable : true,
            geometrie: {
                xMm: zoneData.xMm !== undefined ? zoneData.xMm : pixelsToMm(zoneData.x || 0),
                yMm: zoneData.yMm !== undefined ? zoneData.yMm : pixelsToMm(zoneData.y || 0),
                largeurMm: zoneData.wMm !== undefined ? zoneData.wMm : pixelsToMm(zoneData.w || 150),
                hauteurMm: zoneData.hMm !== undefined ? zoneData.hMm : pixelsToMm(zoneData.h || 60)
            },
            typeCodeBarres: zoneData.typeCodeBarres || 'code128',
            champFusion: zoneData.champFusion || '',
            valeurStatique: zoneData.valeurStatique || '',
            texteLisible: zoneData.texteLisible || 'dessous',
            taillePolice: zoneData.taillePolice || 8,
            couleur: zoneData.couleur || '#000000',
            couleurFond: zoneData.bgColor || '#FFFFFF',
            couleurFondCmyk: zoneData.bgColorCmyk || null,
            transparent: zoneData.isTransparent || false
        };
    }

    /**
     * Convertit une zone QR du format documentState vers le format JSON WebDev.
     * 
     * @param {string} id - Identifiant de la zone
     * @param {QrZoneData} zoneData - Données de la zone au format interne
     * @param {number} pageNumero - Numéro de page (1-based)
     * @returns {ZoneQRJsonWebDev} Zone au format JSON WebDev
     */
    function convertZoneQRToJson(id, zoneData, pageNumero) {
        const pixelsToMm = (px) => px * MM_PER_PIXEL;
        
        return {
            id: id,
            page: pageNumero,
            nom: zoneData.name || 'QR Code',
            niveau: zoneData.zIndex || 1,
            rotation: zoneData.rotation || 0,
            verrouille: zoneData.locked || false,
            systeme: zoneData.systeme || false,
            systemeLibelle: zoneData.systemeLibelle || '',
            imprimable: zoneData.imprimable !== undefined ? zoneData.imprimable : true,
            geometrie: {
                xMm: zoneData.xMm !== undefined ? zoneData.xMm : pixelsToMm(zoneData.x || 0),
                yMm: zoneData.yMm !== undefined ? zoneData.yMm : pixelsToMm(zoneData.y || 0),
                largeurMm: zoneData.wMm !== undefined ? zoneData.wMm : pixelsToMm(zoneData.w || 100),
                hauteurMm: zoneData.hMm !== undefined ? zoneData.hMm : pixelsToMm(zoneData.h || 100)
            },
            typeCode: zoneData.typeCode || 'QRCode',
            contenu: zoneData.content || '',
            couleurs: {
                code: zoneData.qrColor || '#000000',
                fond: zoneData.bgColor || '#FFFFFF',
                fondCmyk: zoneData.bgColorCmyk || null
            }
        };
    }
    
    /**
     * Convertit une zone image du format documentState vers le format JSON WebDev.
     * Effectue la conversion des unités (pixels → mm si nécessaire) et le mapping
     * des propriétés de source et redimensionnement.
     * Utilise les valeurs mm stockées si disponibles pour préserver la précision.
     * 
     * @param {string} id - Identifiant de la zone (ex: "zone-3")
     * @param {ImageZoneData} zoneData - Données de la zone au format interne
     * @param {number} pageNumero - Numéro de page (1-based pour WebDev)
     * @returns {ZoneImageJsonWebDev} Zone au format JSON WebDev
     * 
     * @example
     * // Entrée interne :
     * // { type: 'image', source: { type: 'fixe', valeur: '' },
     * //   redimensionnement: { mode: 'ajuster' } }
     * // Sortie JSON WebDev :
     * // { id: 'zone-3', page: 1, source: { type: 'fixe', valeur: '' },
     * //   redimensionnement: { mode: 'ajuster' }, geometrie: {...} }
     */
    function convertZoneImageToJson(id, zoneData, pageNumero) {
        const pixelsToMm = (px) => px * MM_PER_PIXEL;

        return {
            id: id,
            page: pageNumero,
            nom: zoneData.name || '',
            niveau: zoneData.zIndex || 1,
            rotation: zoneData.rotation || 0,
            verrouille: zoneData.locked || false,
            systeme: zoneData.systeme || false,
            systemeLibelle: zoneData.systemeLibelle || '',
            imprimable: zoneData.imprimable !== undefined ? zoneData.imprimable : true,
            geometrie: {
                xMm: zoneData.xMm !== undefined ? zoneData.xMm : pixelsToMm(zoneData.x || 0),
                yMm: zoneData.yMm !== undefined ? zoneData.yMm : pixelsToMm(zoneData.y || 0),
                largeurMm: zoneData.wMm !== undefined ? zoneData.wMm : pixelsToMm(zoneData.w || 150),
                hauteurMm: zoneData.hMm !== undefined ? zoneData.hMm : pixelsToMm(zoneData.h || 150)
            },
            source: {
                type: zoneData.source?.type || 'url',
                valeur: zoneData.source?.valeur || '',
                nomOriginal: zoneData.source?.nomOriginal || '',
                imageBase64: zoneData.source?.imageBase64 || null,
                largeurPx: zoneData.source?.largeurPx || null,
                hauteurPx: zoneData.source?.hauteurPx || null
            },
            redimensionnement: {
                mode: zoneData.redimensionnement?.mode || 'ajuster',
                alignementH: zoneData.redimensionnement?.alignementH || 'center',
                alignementV: zoneData.redimensionnement?.alignementV || 'middle'
            },
            fond: {
                transparent: zoneData.isTransparent !== undefined ? zoneData.isTransparent : true,
                couleur: zoneData.bgColor || '#FFFFFF',
                couleurCmyk: zoneData.bgColorCmyk || null
            },
            bordure: {
                epaisseur: zoneData.border?.width || 0,
                couleur: zoneData.border?.color || '#000000',
                couleurCmyk: zoneData.border?.colorCmyk || null,
                style: zoneData.border?.style || 'solid'
            }
        };
    }
    
    /**
     * Analyse un contenu RTF pour détecter les variantes typographiques utilisées.
     * Détecte \b / \b0 (gras) et \i / \i0 (italique) en tenant compte des activations/désactivations.
     *
     * @param {string} rtfContent - Contenu RTF
     * @returns {{bold: boolean, italic: boolean, boldItalic: boolean}}
     */
    function analyserVariantesRtf(rtfContent) {
        const rtf = typeof rtfContent === 'string' ? rtfContent : '';
        const re = /\\([bi])(-?\d+)?/g;

        let boldActive = false;
        let italicActive = false;
        let usedBold = false;
        let usedItalic = false;
        let usedBoldItalic = false;

        let m;
        while ((m = re.exec(rtf)) !== null) {
            const flag = m[1]; // 'b' or 'i'
            const rawVal = m[2]; // undefined, "0", "1", ...
            const val = rawVal === undefined ? 1 : parseInt(rawVal, 10);
            const enable = !(Number.isFinite(val) && val === 0);

            if (flag === 'b') boldActive = enable;
            if (flag === 'i') italicActive = enable;

            if (boldActive) usedBold = true;
            if (italicActive) usedItalic = true;
            if (boldActive && italicActive) usedBoldItalic = true;
        }

        // Si boldItalic est présent, alors bold et italic le sont nécessairement.
        if (usedBoldItalic) {
            usedBold = true;
            usedItalic = true;
        }

        return { bold: usedBold, italic: usedItalic, boldItalic: usedBoldItalic };
    }

    /**
     * Analyse un Delta Quill pour détecter les variantes typographiques utilisées.
     *
     * @param {Object|null} delta - Objet Delta Quill ({ops:[...]}) ou null
     * @returns {{bold: boolean, italic: boolean, boldItalic: boolean}}
     */
    function analyserVariantesDelta(delta) {
        const ops = delta && typeof delta === 'object' && Array.isArray(delta.ops) ? delta.ops : [];
        let usedBold = false;
        let usedItalic = false;
        let usedBoldItalic = false;

        ops.forEach(op => {
            const attrs = op && typeof op === 'object' ? op.attributes : null;
            if (!attrs || typeof attrs !== 'object') return;

            const b = attrs.bold === true;
            const i = attrs.italic === true;

            if (b) usedBold = true;
            if (i) usedItalic = true;
            if (b && i) usedBoldItalic = true;
        });

        if (usedBoldItalic) {
            usedBold = true;
            usedItalic = true;
        }

        return { bold: usedBold, italic: usedItalic, boldItalic: usedBoldItalic };
    }

    /**
     * Extrait la liste des polices utilisées dans le document avec leurs variantes.
     * Ne conserve que les polices réellement présentes dans les zones texte/textQuill.
     *
     * @returns {PoliceUtilisee[]} Liste des polices utilisées
     */
    function extractPolicesUtilisees() {
        /** @type {Map<string, {regular: boolean, bold: boolean, italic: boolean, boldItalic: boolean}>} */
        const acc = new Map();

        /**
         * @param {string} nomPolice
         * @returns {{regular: boolean, bold: boolean, italic: boolean, boldItalic: boolean}}
         */
        function ensure(nomPolice) {
            if (!acc.has(nomPolice)) {
                acc.set(nomPolice, { regular: true, bold: false, italic: false, boldItalic: false });
            }
            // @ts-ignore - Map.get is safe here
            return acc.get(nomPolice);
        }

        documentState.pages.forEach(page => {
            const zones = page && page.zones ? page.zones : {};
            Object.values(zones).forEach(zoneData => {
                if (!zoneData || zoneData.type !== 'textQuill') return;

                const fontName = zoneData.font || QUILL_DEFAULT_FONT;
                const flags = ensure(fontName);

                // Regular est toujours vraie dès lors que la police est référencée.
                flags.regular = true;

                // Zones textQuill : analyse du Delta Quill pour détecter les variantes
                if (zoneData.type === 'textQuill') {
                    const delta = zoneData.quillDelta || null;
                    const vDelta = analyserVariantesDelta(delta);
                    if (vDelta.bold) flags.bold = true;
                    if (vDelta.italic) flags.italic = true;
                    if (vDelta.boldItalic) flags.boldItalic = true;

                    // Analyse secondaire via RTF généré (si disponible)
                    try {
                        const rtf = deltaToRtf(delta);
                        const vRtf = analyserVariantesRtf(rtf);
                        if (vRtf.bold) flags.bold = true;
                        if (vRtf.italic) flags.italic = true;
                        if (vRtf.boldItalic) flags.boldItalic = true;
                    } catch (e) {}
                }
            });
        });

        /** @type {PoliceUtilisee[]} */
        const result = [];
        acc.forEach((flags, nom) => {
            const police = Array.isArray(policesDisponibles)
                ? policesDisponibles.find(p => p && p.nom === nom)
                : null;

            result.push({
                nom,
                urls: {
                    regular: police && flags.regular ? (police.url || null) : null,
                    bold: police && flags.bold ? (police.boldUrl || null) : null,
                    italic: police && flags.italic ? (police.italicUrl || null) : null,
                    boldItalic: police && flags.boldItalic ? (police.boldItalicUrl || null) : null
                }
            });
        });

        // Tri stable pour export déterministe
        result.sort((a, b) => String(a.nom).localeCompare(String(b.nom)));
        return result;
    }

    /**
     * Exporte documentState vers le format JSON WebDev (inverse de loadFromWebDev).
     * Fonction principale d'export : génère le JSON complet pour transmission à WebDev.
     *
     * Étapes de l'export :
     * 1. Synchronisation DOM → documentState (positions actuelles)
     * 2. Construction des métadonnées (format, dimensions)
     * 3. Conversion des zones par type (texte, code-barres, images)
     * 4. Génération du JSON final
     *
     * @returns {DocumentJsonWebDev} Document complet au format JSON WebDev
     *
     * @see loadFromWebDev - Fonction inverse (import)
     * @see convertZoneTexteToJson - Conversion zones texte
     * @see convertZoneCodeBarresToJson - Conversion zones code-barres
     * @see convertZoneImageToJson - Conversion zones image
     *
     * @example
     * // Export vers WebDev (bouton "Générer JSON")
     * const jsonWebDev = exportToWebDev();
     * // → { formatDocument: {...}, zonesTexte: [...], zonesCodeBarres: [...], zonesImage: [...] }
     * window.parent.postMessage({ type: 'DESIGNER_EXPORT', data: jsonWebDev }, '*');
     */
    function exportToWebDev() {
        console.log('=== exportToWebDev() : Début de l\'export ===');
        
        // --- ÉTAPE 1 : Synchroniser les positions DOM → documentState ---
        // Pour la page courante, lire les positions actuelles depuis le DOM
        console.log('Étape 1 : Synchronisation DOM → documentState...');
        
        const currentZones = getCurrentPageZones();
        // Phase 7 : s'assurer que les zones textQuill ont un Delta à jour avant export
        // NE PAS persister en mode aperçu (le contenu affiché est fusionné, pas l'original)
        if (!previewState || !previewState.active) {
            persistTextQuillContentForSave(currentZones);
        }
        let syncCount = 0;
        
        for (const [id, data] of Object.entries(currentZones)) {
            const el = document.getElementById(id);
            if (el) {
                data.x = el.offsetLeft;
                data.y = el.offsetTop;
                data.w = el.offsetWidth;
                data.h = el.offsetHeight;
                syncCount++;
            }
        }
        console.log(`  → ${syncCount} zone(s) synchronisée(s) depuis le DOM`);
        
        // --- ÉTAPE 2 : Construire l'objet JSON de base ---
        console.log('Étape 2 : Construction de la structure JSON...');
        
        const output = {
            identification: {
                idDocument: documentState.identification?.idDocument || '',
                nomDocument: documentState.identification?.nomDocument || '',
                dateCreation: documentState.identification?.dateCreation || ''
            },
            formatDocument: {
                // Priorité aux valeurs mm stockées (précises), sinon calcul depuis pixels
                largeurMm: documentState.formatDocument?.largeurMm || (documentState.pages[0]?.width * MM_PER_PIXEL) || 210,
                hauteurMm: documentState.formatDocument?.hauteurMm || (documentState.pages[0]?.height * MM_PER_PIXEL) || 297,
                fondPerdu: documentState.formatDocument?.fondPerdu || { actif: false, valeurMm: 3 },
                traitsCoupe: documentState.formatDocument?.traitsCoupe || { actif: false },
                margeSecurite: documentState.formatDocument?.margeSecuriteMm || 0,
                surfaceMaxImageMm2: documentState.formatDocument?.surfaceMaxImageMm2 || DEFAULT_SURFACE_MAX_IMAGE_MM2,
                pourcentageMaxImage: documentState.formatDocument?.pourcentageMaxImage || DEFAULT_POURCENTAGE_MAX_IMAGE
            },
            champsFusion: documentState.champsFusion || [],
            pages: [],
            zonesTexte: [],
            zonesTextQuill: [],
            zonesQR: [],
            zonesCodeBarres: [],
            zonesImage: []
        };
        
        console.log(`  → Identification : ${output.identification.idDocument || '(non défini)'}`);
        console.log(`  → Format : ${output.formatDocument.largeurMm.toFixed(1)}mm x ${output.formatDocument.hauteurMm.toFixed(1)}mm`);
        
        // --- ÉTAPE 3 : Parcourir toutes les pages ---
        console.log('Étape 3 : Export des pages et zones...');
        
        documentState.pages.forEach((page, index) => {
            const pageNumero = index + 1;
            
            // Ajouter la page
            output.pages.push({
                numero: pageNumero,
                nom: page.name || `Page ${pageNumero}`,
                urlFond: page.image || ''
            });
            
            console.log(`  → Page ${pageNumero} : "${page.name}" (fond: ${page.image ? 'oui' : 'non'})`);
            
            // Parcourir les zones de cette page
            let textCount = 0, qrCount = 0, barcodeCount = 0, imageCount = 0;
            
            for (const [zoneId, zoneData] of Object.entries(page.zones || {})) {
                if (zoneData.type === 'qr') {
                    output.zonesQR.push(
                        convertZoneQRToJson(zoneId, zoneData, pageNumero)
                    );
                    qrCount++;
                } else if (zoneData.type === 'barcode') {
                    output.zonesCodeBarres.push(
                        convertZoneCodeBarresToJson(zoneId, zoneData, pageNumero)
                    );
                    barcodeCount++;
                } else if (zoneData.type === 'image') {
                    output.zonesImage.push(
                        convertZoneImageToJson(zoneId, zoneData, pageNumero)
                    );
                    imageCount++;
                } else if (zoneData.type === 'textQuill') {
                    // Phase 7 (nouveau format) : zones textQuill dédiées
                    console.log('🔧 PHASE 7 - Export textQuill:', zoneId);

                    const delta = zoneData.quillDelta || null;
                    // Passer les paramètres de style pour générer un RTF complet PrintShop Mail
                    const rtfOutput = deltaToRtf(
                        delta,
                        zoneData.font || 'Roboto',
                        zoneData.size || 12,
                        zoneData.color || '#000000',
                        zoneData.align || 'left'
                    );

                    output.zonesTextQuill.push({
                        id: zoneId,
                        type: 'textQuill',
                        page: pageNumero,
                        niveau: zoneData.zIndex || 1,
                        geometry: {
                            x_mm: zoneData.xMm !== undefined ? zoneData.xMm : (zoneData.x || 0) * MM_PER_PIXEL,
                            y_mm: zoneData.yMm !== undefined ? zoneData.yMm : (zoneData.y || 0) * MM_PER_PIXEL,
                            width_mm: zoneData.wMm !== undefined ? zoneData.wMm : (zoneData.w || 200) * MM_PER_PIXEL,
                            height_mm: zoneData.hMm !== undefined ? zoneData.hMm : (zoneData.h || 40) * MM_PER_PIXEL
                        },
                        content_quill: delta,
                        content_rtf: rtfOutput,
                        style: {
                            font: zoneData.font || 'Roboto',
                            size_pt: zoneData.size || 12,
                            color: zoneData.color || '#000000',
                            colorCmyk: zoneData.colorCmyk || null,
                            align: zoneData.align || 'left',
                            valign: zoneData.valign || 'top',
                            line_height: zoneData.lineHeight || 1.2,
                            bgColor: zoneData.isTransparent ? null : (zoneData.bgColor || '#ffffff'),
                            bgColorCmyk: zoneData.isTransparent ? null : (zoneData.bgColorCmyk || null),
                            transparent: zoneData.isTransparent !== undefined ? !!zoneData.isTransparent : true,
                            locked: !!zoneData.locked,
                            copyfit: !!zoneData.copyfit
                        },
                        border: {
                            width_px: zoneData.border?.width || 0,
                            color: zoneData.border?.color || '#000000',
                            colorCmyk: zoneData.border?.colorCmyk || null,
                            style: zoneData.border?.style || 'solid'
                        }
                    });
                } else {
                    output.zonesTexte.push(
                        convertZoneTexteToJson(zoneId, zoneData, pageNumero)
                    );
                    textCount++;
                }
            }
            
            console.log(`    → ${textCount} zone(s) texte, ${qrCount} zone(s) QR, ${barcodeCount} zone(s) code-barres, ${imageCount} zone(s) image`);
        });
        
        // --- ÉTAPE 4 : Extraire les polices utilisées (avec variantes) ---
        console.log('Étape 4 : Extraction des polices utilisées (avec variantes)...');
        output.policesUtilisees = extractPolicesUtilisees();
        console.log(`  → ${output.policesUtilisees.length} police(s) utilisée(s)`);
        
        // --- Résumé final ---
        console.log('=== exportToWebDev() : Export terminé ===');
        console.log(`Résumé :`);
        console.log(`  → ${output.pages.length} page(s)`);
        console.log(`  → ${output.zonesTexte.length} zone(s) texte`);
        console.log(`  → ${output.zonesCodeBarres.length} zone(s) code-barres`);
        console.log('Données exportées :', output);
        
        return output;
    }
    
    // Exposer la fonction globalement pour l'appel depuis l'iframe parent
    window.exportToWebDev = exportToWebDev;

    // ─────────────────────────────── FIN SECTION 20 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 21 : COMMUNICATION POSTMESSAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Communication bidirectionnelle avec le parent WebDev via postMessage.
     * Gère le chargement et l'export à distance.
     * 
     * Variables :
     *   - isInIframe : Détection mode iframe
     * 
     * Fonctions principales :
     *   - sendMessageToParent() : Envoie un message au parent
     *   - notifyParentOfChange() : Notifie d'une modification
     *   - handleParentMessage() : Gestionnaire des messages reçus
     * 
     * Actions supportées :
     *   - load : Charger un document
     *   - export : Exporter le document
     *   - getState : Retourner l'état
     *   - ping/pong : Test de connexion
     *   - updatePreviewData : Mise à jour dynamique des échantillons d'aperçu
     *   - getPreviewStatus : Retourne l'état de l'aperçu (actif, index, total)
     * 
     * ═══════════════════════════════════════════════════════════════════════════
     * ACTIONS POSTMESSAGE - APERÇU DE FUSION
     * ═══════════════════════════════════════════════════════════════════════════
     * 
     * === CHARGEMENT INITIAL (dans action 'load') ===
     * WebDev → Designer :
     * {
     *   "action": "load",
     *   "data": {
     *     "champsFusion": [...],
     *     "donneesApercu": [
     *       { "NOM": "DUPONT", "PRENOM": "Jean", ... },
     *       { "NOM": "MARTIN", "PRENOM": "Sophie", ... }
     *     ],
     *     ...
     *   }
     * }
     * 
     * === MISE À JOUR DYNAMIQUE ===
     * WebDev → Designer :
     * {
     *   "action": "updatePreviewData",
     *   "data": {
     *     "donneesApercu": [...]
     *   }
     * }
     * 
     * Designer → WebDev :
     * {
     *   "action": "previewDataUpdated",
     *   "success": true,
     *   "count": 50
     * }
     * 
     * === STATUT DE L'APERÇU ===
     * WebDev → Designer :
     * { "action": "getPreviewStatus" }
     * 
     * Designer → WebDev :
     * {
     *   "action": "previewStatus",
     *   "active": false,
     *   "currentIndex": 0,
     *   "totalRecords": 50,
     *   "hasData": true
     * }
     * ═══════════════════════════════════════════════════════════════════════════
     * 
     * Dépendances :
     *   - loadFromWebDev() (Section 19)
     *   - exportToWebDev() (Section 20)
     */
    // ───────────────────────────────────────────────────────────────────────────────
    
    // Détecter si on est dans une iframe
    const isInIframe = window.parent !== window;
    
    if (isInIframe) {
        console.log('🖼️ Designer chargé en mode iframe');
        document.body.classList.add('in-iframe');
    } else {
        console.log('🖥️ Designer chargé en mode standalone');
    }
    
    /**
     * Envoie un message au parent (WebDev)
     * @param {Object} message - Message à envoyer
     */
    function sendMessageToParent(message) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
            console.log('📤 Message envoyé au parent:', message.action);
        } else {
            console.log('📤 Mode standalone (pas de parent):', message.action);
        }
    }
    
    /**
     * Notifie le parent qu'une modification a été faite
     */
    function notifyParentOfChange() {
        sendMessageToParent({ action: 'changed', timestamp: Date.now() });
    }
    
    /**
     * Gestionnaire des messages reçus du parent (WebDev)
     */
    function handleParentMessage(event) {
        // Sécurité : vérifier l'origine si nécessaire
        // if (event.origin !== "https://votre-domaine-webdev.com") return;
        
        const message = event.data;
        
        // Ignorer les messages non structurés ou d'autres sources (ex: extensions)
        if (!message || typeof message !== 'object' || !message.action) {
            return;
        }
        
        console.log('📩 Message reçu du parent:', message.action);
        
        switch (message.action) {
            case 'load':
                // Charger un document JSON
                if (message.data) {
                    try {
                        loadFromWebDev(message);
                        sendMessageToParent({ action: 'loaded', success: true });
                    } catch (error) {
                        console.error('Erreur lors du chargement:', error);
                        sendMessageToParent({ action: 'loaded', success: false, error: error.message });
                    }
                }
                break;
                
            case 'export':
                // Exporter le document actuel
                try {
                    const exported = exportToWebDev();
                    sendMessageToParent({ action: 'exported', success: true, data: exported });
                } catch (error) {
                    console.error('Erreur lors de l\'export:', error);
                    sendMessageToParent({ action: 'exported', success: false, error: error.message });
                }
                break;
                
            case 'getState':
                // Retourner l'état actuel (pour debug ou synchronisation)
                sendMessageToParent({ action: 'state', data: documentState });
                break;
                
            case 'ping':
                // Test de connexion
                sendMessageToParent({ action: 'pong' });
                break;
                
            case 'updatePreviewData':
                // Mise à jour dynamique des données d'aperçu sans recharger le document
                console.log('📊 Action: updatePreviewData');
                
                if (message.data && Array.isArray(message.data.donneesApercu)) {
                    documentState.donneesApercu = message.data.donneesApercu;
                    console.log(`  → ${documentState.donneesApercu.length} échantillon(s) mis à jour`);
                    
                    // Mettre à jour l'état du bouton
                    updatePreviewButtonState();
                    
                    // Si en mode aperçu, réafficher avec les nouvelles données
                    if (previewState.active) {
                        // Réinitialiser à l'index 0 car les données ont changé
                        displayMergedContent(0);
                    }
                    
                    // Notifier le parent
                    sendMessageToParent({
                        action: 'previewDataUpdated',
                        success: true,
                        count: documentState.donneesApercu.length
                    });
                } else {
                    console.warn('⚠️ updatePreviewData: données invalides');
                    sendMessageToParent({
                        action: 'previewDataUpdated',
                        success: false,
                        error: 'Données invalides ou manquantes'
                    });
                }
                break;
                
            case 'getPreviewStatus':
                // Retourne l'état actuel de l'aperçu
                console.log('📊 Action: getPreviewStatus');
                sendMessageToParent({
                    action: 'previewStatus',
                    active: previewState.active,
                    currentIndex: previewState.currentIndex,
                    totalRecords: documentState.donneesApercu.length,
                    hasData: hasPreviewData()
                });
                break;
                
            default:
                console.warn('Action inconnue:', message.action);
        }
    }
    
    // Écouter les messages du parent
    window.addEventListener('message', handleParentMessage);
    
    // Signaler que le Designer est prêt (après l'initialisation complète)
    // Note: Le message "ready" sera envoyé à la fin de l'initialisation du DOMContentLoaded
    
    // Exposer les fonctions globalement
    window.sendMessageToParent = sendMessageToParent;
    window.notifyParentOfChange = notifyParentOfChange;
    window.isInIframe = isInIframe;

    // ─────────────────────────────── FIN SECTION 21 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 22 : CHARGEMENT PAGE ET LOCALSTORAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Sauvegarde et restauration des données via localStorage.
     * Chargement des pages avec leurs zones.
     * 
     * Fonctions principales :
     *   - saveToLocalStorage() : Sauvegarde l'état complet
     *   - loadFromLocalStorage() : Restaure depuis localStorage
     *   - loadCurrentPage() : Charge la page courante dans le DOM
     * 
     * Migration :
     *   - Support de l'ancien format (page unique) vers le nouveau (multipage)
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - createZoneDOM() (Section 13)
     *   - applyPageDimensions() (Section 12)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    function loadFromLocalStorage() {
        // Essayer de charger le nouveau format multipage
        const savedState = localStorage.getItem('marketeam_document_state');
        
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                // Vérifier que c'est bien la nouvelle structure
                if (parsedState.pages && Array.isArray(parsedState.pages)) {
                    documentState = parsedState;
                    zoneCounter = documentState.zoneCounter || 0;
                    
                    // FORCER la page 0 (Recto) au chargement initial
                    // (l'utilisateur peut ensuite naviguer manuellement)
                    documentState.currentPageIndex = 0;
                    
                    // Charger la page courante (maintenant Recto)
                    loadCurrentPage();
                    return;
                }
            } catch (e) {
                console.warn('Erreur lors du chargement du nouveau format, migration vers ancien format...', e);
            }
        }
        
        // MIGRATION : Ancien format détecté, migrer vers la page 0 (Recto)
        const savedZones = localStorage.getItem('marketeam_zones');
        const savedCounter = localStorage.getItem('marketeam_zone_counter');

        if (savedZones && savedCounter) {
            console.log('Migration des données anciennes vers le nouveau format multipage...');
            zoneCounter = parseInt(savedCounter);
            documentState.zoneCounter = zoneCounter;
            documentState.currentPageIndex = 0; // Forcer Recto lors de la migration
            const parsedZones = JSON.parse(savedZones);
            
            // Migrer toutes les zones vers la page 0 (Recto)
            // S'assurer que la page a les dimensions par défaut (A4)
            const defaultFormat = DOCUMENT_FORMATS[DEFAULT_FORMAT];
            if (!documentState.pages[0].width || !documentState.pages[0].height) {
                documentState.pages[0].format = DEFAULT_FORMAT;
                documentState.pages[0].width = defaultFormat.width;
                documentState.pages[0].height = defaultFormat.height;
            }
            if (!documentState.pages[1].width || !documentState.pages[1].height) {
                documentState.pages[1].format = DEFAULT_FORMAT;
                documentState.pages[1].width = defaultFormat.width;
                documentState.pages[1].height = defaultFormat.height;
            }
            
            documentState.pages[0].zones = parsedZones;
            
            // Charger la page courante
            loadCurrentPage();
            
            // Sauvegarder immédiatement dans le nouveau format
            saveToLocalStorage();
        } else {
            // Aucune donnée sauvegardée : s'assurer qu'on est sur la page 0 (Recto)
            documentState.currentPageIndex = 0;
            // Appliquer les dimensions par défaut
            applyPageDimensions();
        }
    }

    /**
     * Charge et affiche la page courante du document.
     * Recrée toutes les zones dans le DOM à partir de documentState.
     * 
     * Étapes du chargement :
     * 1. Récupère la page courante (via currentPageIndex)
     * 2. Assure les dimensions (migration/rétrocompat)
     * 3. Applique les dimensions au DOM (applyPageDimensions)
     * 4. Met à jour l'image de fond
     * 5. Recrée chaque zone via createZoneDOM (sans auto-sélection)
     * 6. Applique les positions/tailles sauvegardées
     * 7. Met à jour l'affichage selon le type (texte, image, code-barres)
     * 
     * @returns {void}
     * 
     * @example
     * // Charger après changement de page (Recto/Verso)
     * documentState.currentPageIndex = 1; // Verso
     * loadCurrentPage();
     * 
     * // Charger après restauration (Undo/Redo)
     * restoreState(snapshot);
     * // → appelle loadCurrentPage() internement
     * 
     * @see switchToPage - Navigation entre pages
     * @see createZoneDOM - Création des zones
     * @see applyPageDimensions - Application des dimensions
     */
    function loadCurrentPage() {
        const currentPage = getCurrentPage();
        const zonesData = currentPage.zones;
        
        // S'assurer que la page a des dimensions (migration/rétrocompatibilité)
        if (!currentPage.width || !currentPage.height) {
            // Si pas de dimensions, utiliser le format par défaut
            const defaultFormat = DOCUMENT_FORMATS[DEFAULT_FORMAT];
            currentPage.format = currentPage.format || DEFAULT_FORMAT;
            currentPage.width = currentPage.width || defaultFormat.width;
            currentPage.height = currentPage.height || defaultFormat.height;
        }
        
        // Appliquer les dimensions au DOM
        applyPageDimensions();
        
        // Mettre à jour l'image de fond
        const bgImg = document.getElementById('a4-background');
        if (bgImg) {
            bgImg.src = currentPage.image;
        }
        
        // Restaurer chaque zone de la page courante
        for (const [id, data] of Object.entries(zonesData)) {
            zonesData[id] = { type: data.type || 'text', ...data };
            createZoneDOM(id, id.split('-')[1], false); // NE PAS auto-sélectionner pendant le chargement
            
            // Appliquer position/taille sauvegardées
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                if (data.x !== undefined) zoneEl.style.left = data.x + 'px';
                if (data.y !== undefined) zoneEl.style.top = data.y + 'px';
                if (data.w !== undefined) zoneEl.style.width = data.w + 'px';
                if (data.h !== undefined) zoneEl.style.height = data.h + 'px';
                
                // APPLIQUER TOUS LES STYLES AVANT TOUT LE RESTE
                const contentEl = zoneEl.querySelector('.zone-content');
                const zoneType = zonesData[id].type || 'text';
                
                if (zoneType === 'qr') {
                    zoneEl.classList.add('zone-qr');
                    
                    // Fond (doit être appliqué AVANT updateQrZoneDisplay)
                    if (data.isTransparent) {
                        zoneEl.style.backgroundColor = 'transparent';
                    } else {
                        zoneEl.style.backgroundColor = data.bgColor || '#ffffff';
                    }
                    
                    // Régénérer le vrai code-barres
                    setTimeout(() => updateQrZoneDisplay(id), 10);
                    if (data.locked) {
                        zoneEl.classList.add('locked');
                    }
                    // Badge système
                    updateSystemeBadge(id);
                    continue;
                }

                if (zoneType === 'barcode') {
                    zoneEl.classList.add('barcode-zone');
                    
                    // Fond (doit être appliqué AVANT updateBarcodeZoneDisplay)
                    if (data.isTransparent) {
                        zoneEl.style.backgroundColor = 'transparent';
                    } else {
                        zoneEl.style.backgroundColor = data.bgColor || '#ffffff';
                    }
                    // Appliquer également le fond au container .barcode-preview
                    const barcodePreview = zoneEl.querySelector('.barcode-preview');
                    if (barcodePreview) {
                        if (data.isTransparent) {
                            barcodePreview.style.backgroundColor = 'transparent';
                        } else {
                            barcodePreview.style.backgroundColor = data.bgColor || '#ffffff';
                        }
                    }
                    
                    // Régénérer le vrai code-barres
                    setTimeout(() => updateBarcodeZoneDisplay(id), 10);
                    if (data.locked) {
                        zoneEl.classList.add('locked');
                    }
                    // Badge système
                    updateSystemeBadge(id);
                    continue;
                }
                
                if (zoneType === 'image') {
                    zoneEl.classList.add('zone-image');
                    
                    // Fond
                    if (data.isTransparent) {
                        zoneEl.style.backgroundColor = 'transparent';
                    } else {
                        zoneEl.style.backgroundColor = data.bgColor || '#ffffff';
                    }
                    
                    // Bordure
                    if (data.border) {
                        applyBorderToZone(zoneEl, data.border);
                    }

                    // Verrouillage
                    if (data.locked) {
                        zoneEl.classList.add('locked');
                    }
                    
                    // Badge système
                    updateSystemeBadge(id);

                    // Affichage image/placeholder
                    updateImageZoneDisplay(zoneEl, data);
                    
                    continue;
                }
                
                // Zone textQuill : les styles (dont copyfit) sont gérés par applyQuillZoneStyles() appelé dans createZoneDOM()
                if (zoneType === 'textQuill') {
                    // Badge système
                    updateSystemeBadge(id);
                    continue;
                }
                
                // NOTE: L'ancien type 'text' avec textarea a été supprimé.
                // Tous les autres types (qr, barcode, image, textQuill) sont gérés ci-dessus.
            }
        }
        
        // Mettre à jour l'affichage des poignées après le chargement de toutes les zones
        updateHandlesVisibility();
        
        // Mettre à jour la section Page (masquée car aucune zone sélectionnée après chargement)
        updateZonePageUI();
    }

    // --- CHARGEMENT AU DÉMARRAGE ---
    loadFromLocalStorage();
    
    // Initialiser les données d'aperçu fictives (pour tests hors WebDev)
    // Note: doit être APRÈS loadFromLocalStorage() car celui-ci peut écraser documentState
    initDefaultPreviewData();
    
    // Exposer documentState pour debug console (après toutes les initialisations)
    window.documentState = documentState;

    // ─────────────────────────────────────────────────────────────────────────
    // Aperçu de fusion - Event Listeners (Phase 2 - UI seulement)
    // ─────────────────────────────────────────────────────────────────────────

    // Bouton "Aperçu" - Activer le mode aperçu
    if (btnPreview) {
        btnPreview.addEventListener('click', () => {
            console.log('🔘 Clic sur Aperçu');
            activatePreview();
        });
    }

    // Bouton "Fermer" - Désactiver le mode aperçu
    if (btnClosePreview) {
        btnClosePreview.addEventListener('click', () => {
            console.log('🔘 Clic sur Fermer');
            deactivatePreview();
        });
    }

    // Bouton "Précédent" - Enregistrement précédent
    if (btnPrevRecord) {
        btnPrevRecord.addEventListener('click', () => {
            console.log('🔘 Clic sur Précédent');
            if (previewState.currentIndex > 0) {
                displayMergedContent(previewState.currentIndex - 1);
            }
        });
    }

    // Bouton "Suivant" - Enregistrement suivant
    if (btnNextRecord) {
        btnNextRecord.addEventListener('click', () => {
            console.log('🔘 Clic sur Suivant');
            if (previewState.currentIndex < documentState.donneesApercu.length - 1) {
                displayMergedContent(previewState.currentIndex + 1);
            }
        });
    }

    // Raccourcis clavier pour l'aperçu
    document.addEventListener('keydown', (e) => {
        // Seulement si en mode aperçu
        if (!previewState.active) return;
        
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                deactivatePreview();
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (previewState.currentIndex > 0) {
                    displayMergedContent(previewState.currentIndex - 1);
                }
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (previewState.currentIndex < documentState.donneesApercu.length - 1) {
                    displayMergedContent(previewState.currentIndex + 1);
                }
                break;
        }
    });

    // Initialiser l'état du bouton Aperçu
    updatePreviewButtonState();
    
    // Générer la navigation des pages après chargement
    renderPageNavigation();
    
    // Sauvegarder l'état initial dans l'historique (après le chargement)
    saveState();
    
    // S'assurer que l'image de fond correspond à la page courante après le chargement
    // (loadFromLocalStorage() force déjà la page 0, mais on double-vérifie)
    const bgImg = document.getElementById('a4-background');
    if (bgImg) {
        bgImg.src = getCurrentPage().image;
    }
    
    // Appliquer les dimensions de la page courante au démarrage
    // (loadCurrentPage() l'applique déjà, mais on s'assure ici aussi)
    applyPageDimensions();
    
    // Initialiser l'UI de navigation
    updatePageNavigationUI();
    
    // Initialiser la visibilité des sections d'alignement et taille
    updateSidebarSectionsVisibility();
    
    // Initialiser les boutons d'arrangement (désactivés au démarrage)
    updateArrangementButtons();
    
    // Initialiser le bouton Ajuster au contenu (désactivé au démarrage)
    if (btnSnapToContent) btnSnapToContent.disabled = true;
    
    // Signaler au parent (WebDev) que le Designer est prêt
    setTimeout(() => {
        sendMessageToParent({ action: 'ready', version: '1.0' });
    }, 100);

    // ─────────────────────────────── FIN SECTION 22 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 23 : NAVIGATION MULTIPAGE
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Gestion de la navigation entre les pages du document.
     * Mise à jour de l'interface de navigation.
     * Déplacement de zones entre pages.
     * 
     * Fonctions principales :
     *   - switchPage() : Change de page (sauvegarde, vide, charge)
     *   - updatePageNavigationUI() : Met à jour les boutons de navigation
     *   - moveZoneToPage() : Déplace une zone vers une autre page
     *   - reorganizePageZIndex() : Réorganise les z-index après déplacement
     *   - updateZonePageUI() : Met à jour la combo Page dans la toolbar
     *   - showMoveZoneToast() : Affiche un toast de confirmation
     * 
     * Listeners :
     *   - Boutons de navigation Recto/Verso
     *   - Combo input-zone-page
     * 
     * Dépendances :
     *   - documentState (Section 12)
     *   - loadCurrentPage() (Section 22)
     *   - setZoom() (Section 24)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    /**
     * Affiche un toast de confirmation de déplacement de zone.
     * Utilise le système de toast existant (undo-redo-toast).
     * 
     * @param {string} zoneName - Nom de la zone déplacée (ex: "Zone 1")
     * @param {string} targetPageName - Nom de la page cible (ex: "Verso")
     * @returns {void}
     * 
     * @example
     * showMoveZoneToast('Zone 1', 'Verso');
     * // Affiche "Zone déplacée vers Verso" pendant 2 secondes
     */
    function showMoveZoneToast(zoneName, targetPageName) {
        const toast = document.getElementById('undo-redo-toast');
        if (toast) {
            toast.innerHTML = `
                <span class="material-icons toast-icon">drive_file_move</span>
                <span>Zone déplacée vers ${targetPageName}</span>
            `;
            toast.className = 'undo-toast success show';
            setTimeout(() => toast.classList.remove('show'), 2000);
        }
    }

    /**
     * Réorganise les z-index d'une page pour combler les trous après suppression/déplacement.
     * Les z-index sont réattribués de 1 à N dans l'ordre actuel.
     * 
     * @param {number} pageIndex - Index de la page à réorganiser (0 = Recto, 1 = Verso)
     * @returns {void}
     * 
     * @example
     * // Après suppression d'une zone avec z-index 2 sur 4 zones
     * reorganizePageZIndex(0);
     * // Les zones 1, 3, 4 deviennent 1, 2, 3
     */
    function reorganizePageZIndex(pageIndex) {
        const page = documentState.pages[pageIndex];
        if (!page || !page.zones) return;
        
        const zones = page.zones;
        
        // Récupérer toutes les zones avec leur z-index actuel
        const zonesWithZIndex = Object.entries(zones)
            .map(([id, data]) => ({ id, zIndex: data.zIndex || 1 }))
            .sort((a, b) => a.zIndex - b.zIndex);
        
        // Réattribuer les z-index de 1 à N
        zonesWithZIndex.forEach((zone, index) => {
            zones[zone.id].zIndex = index + 1;
        });
    }

    /**
     * Déplace une zone vers une autre page du document.
     * La zone est supprimée de la page source et ajoutée à la page cible.
     * Les z-index sont réorganisés sur les deux pages.
     * 
     * Règles métier :
     * - Les zones système (systeme === true) ne peuvent pas être déplacées
     * - La page cible doit être différente de la page source
     * - La zone arrive au premier plan sur la page cible (z-index max + 1)
     * - Un seul saveState() est effectué pour l'historique
     * 
     * @param {string} zoneId - ID de la zone à déplacer (ex: "zone-1")
     * @param {number} targetPageIndex - Index de la page cible (0 = Recto, 1 = Verso)
     * @returns {boolean} true si le déplacement a réussi, false sinon
     * 
     * @example
     * // Déplacer zone-1 vers le Verso
     * const success = moveZoneToPage('zone-1', 1);
     * if (success) {
     *     deselectAll();
     * }
     * 
     * @see reorganizePageZIndex - Réorganisation des z-index
     * @see showMoveZoneToast - Affichage du toast de confirmation
     */
    function moveZoneToPage(zoneId, targetPageIndex) {
        // 🔧 DEBUG - Logs de diagnostic
        console.log('🔧 moveZoneToPage - DÉBUT');
        console.log('   zoneId:', zoneId);
        console.log('   targetPageIndex:', targetPageIndex, 'type:', typeof targetPageIndex);
        console.log('   documentState.pages.length:', documentState.pages.length);
        console.log('   documentState.pages:', documentState.pages);
        
        // 1. Vérifier que la zone existe sur la page courante
        const sourcePageIndex = documentState.currentPageIndex;
        console.log('   sourcePageIndex:', sourcePageIndex);
        
        const sourcePage = documentState.pages[sourcePageIndex];
        console.log('   sourcePage:', sourcePage);
        
        const sourceZones = sourcePage.zones;
        
        if (!sourceZones[zoneId]) {
            console.warn(`moveZoneToPage: Zone ${zoneId} non trouvée sur la page courante`);
            return false;
        }
        
        const zoneData = sourceZones[zoneId];
        
        // 2. Vérifier que ce n'est pas une zone système
        if (zoneData.systeme === true) {
            console.warn(`moveZoneToPage: Zone ${zoneId} est une zone système, déplacement interdit`);
            return false;
        }
        
        // 3. Vérifier que la page cible est différente de la page actuelle
        if (targetPageIndex === sourcePageIndex) {
            console.info(`moveZoneToPage: Zone ${zoneId} déjà sur la page ${targetPageIndex}`);
            return false;
        }
        
        // 4. Vérifier que la page cible existe
        console.log('   Vérification page cible:', targetPageIndex, '>=', 0, 'et <', documentState.pages.length);
        if (targetPageIndex < 0 || targetPageIndex >= documentState.pages.length) {
            console.warn(`moveZoneToPage: Page cible ${targetPageIndex} invalide`);
            return false;
        }
        
        const targetPage = documentState.pages[targetPageIndex];
        console.log('   targetPage:', targetPage);
        
        const targetZones = targetPage.zones;
        console.log('   targetZones:', targetZones);
        
        // 5. Calculer le nouveau z-index pour la page cible (au premier plan)
        let maxZIndex = 0;
        for (const data of Object.values(targetZones)) {
            if (data.zIndex && data.zIndex > maxZIndex) {
                maxZIndex = data.zIndex;
            }
        }
        const newZIndex = maxZIndex + 1;
        
        // 6. Copier les données de la zone avec le nouveau z-index
        const newZoneData = { ...zoneData, zIndex: newZIndex };
        
        // 7. Supprimer la zone de la page source
        delete sourceZones[zoneId];
        
        // 8. Réorganiser les z-index de la page source (combler le trou)
        reorganizePageZIndex(sourcePageIndex);
        
        // 9. Ajouter la zone à la page cible
        targetZones[zoneId] = newZoneData;
        
        // 10. Supprimer l'élément DOM de la page courante (si on est sur la page source)
        const zoneEl = document.getElementById(zoneId);
        if (zoneEl) {
            zoneEl.remove();
        }
        
        // 11. Sauvegarder et créer un point d'historique
        saveToLocalStorage();
        saveState();
        
        // 12. Afficher un toast de confirmation
        const zoneName = zoneId.replace('zone-', 'Zone ');
        const targetPageName = targetPageIndex === 0 ? 'Recto' : 'Verso';
        showMoveZoneToast(zoneName, targetPageName);
        
        return true;
    }

    /**
     * Met à jour la section "Page" dans la toolbar selon la zone sélectionnée.
     * Gère l'affichage, la valeur et l'état désactivé de la combo.
     * 
     * Comportement :
     * - 0 zone sélectionnée : Section masquée
     * - 2+ zones sélectionnées : Section masquée (pas de déplacement multiple)
     * - 1 zone normale : Combo active, cadenas masqué, page actuelle sélectionnée
     * - 1 zone système : Combo désactivée, cadenas visible
     * 
     * @returns {void}
     * 
     * @example
     * // Après sélection d'une zone
     * selectZone('zone-1');
     * updateZonePageUI(); // Met à jour l'affichage de la combo Page
     * 
     * @see selectZone - Sélection d'une zone
     * @see deselectAll - Désélection de toutes les zones
     */
    function updateZonePageUI() {
        // Vérifier que les éléments DOM existent
        if (!zonePageSection || !inputZonePage) {
            return;
        }
        
        const pageCount = documentState.pages.length;
        
        // Masquer si 1 seule page (pas de déplacement possible)
        if (pageCount <= 1) {
            zonePageSection.style.display = 'none';
            return;
        }
        
        // Masquer si pas exactement 1 zone sélectionnée
        if (selectedZoneIds.length !== 1) {
            zonePageSection.style.display = 'none';
            return;
        }
        
        // 1 zone sélectionnée
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        if (!zoneData) {
            zonePageSection.style.display = 'none';
            return;
        }
        
        // Afficher la section
        zonePageSection.style.display = 'block';
        
        // Peupler la combo dynamiquement avec les noms des pages
        inputZonePage.innerHTML = '';
        documentState.pages.forEach((page, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = page.name;
            inputZonePage.appendChild(option);
        });
        
        // Sélectionner la page actuelle
        inputZonePage.value = documentState.currentPageIndex;
        
        // Gérer les zones système
        if (zoneData.systeme === true) {
            inputZonePage.disabled = true;
            if (zonePageLock) zonePageLock.style.display = 'inline';
        } else {
            inputZonePage.disabled = false;
            if (zonePageLock) zonePageLock.style.display = 'none';
        }
    }

    // --- Listener sur la combo Page ---
    if (inputZonePage) {
        inputZonePage.addEventListener('change', () => {
            if (selectedZoneIds.length !== 1) return;
            
            const zoneId = selectedZoneIds[0];
            const targetPageIndex = parseInt(inputZonePage.value, 10);
            
            const success = moveZoneToPage(zoneId, targetPageIndex);
            
            if (success) {
                // Zone déplacée : elle n'est plus sur la page courante
                // Donc désélectionner (la zone n'est plus visible)
                deselectAll();
            }
        });
    }

    function switchPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
            console.warn('Index de page invalide:', pageIndex);
            return;
        }

        // 1. Sauvegarder l'état de la page actuelle (positions, styles)
        saveToLocalStorage();

        // 2. Vider la sélection multiple avant de changer de page
        selectedZoneIds.forEach(zoneId => {
            document.getElementById(zoneId)?.classList.remove('selected');
        });
        selectedZoneIds = [];
        
        // 3. Désélectionner toute zone active
        deselectAll();

        // 3. Vider le workspace (supprimer toutes les zones du DOM)
        document.querySelectorAll('.zone').forEach(el => {
            const zoneId = el.id;
            el.remove();
            // Nettoyer les ressources Quill associées
            quillInstances.delete(zoneId);
            removeCopyfitResizeObserver(zoneId);
        });

        // 4. Changer l'index de page courante
        documentState.currentPageIndex = pageIndex;

        // 5. Changer l'image de fond et appliquer les dimensions
        const bgImg = document.getElementById('a4-background');
        const currentPage = getCurrentPage();
        if (bgImg) {
            bgImg.src = currentPage.image;
        }
        
        // Appliquer les dimensions de la nouvelle page
        applyPageDimensions();

        // 6. Charger et afficher les zones de la nouvelle page
        loadCurrentPage();

        // 7. Remettre le zoom à 100% lors du changement de page
        setZoom(1.0);

        // 8. Mettre à jour l'interface de navigation
        updatePageNavigationUI();

        // 9. Le pan est préservé automatiquement
        
        // 10. Si en mode aperçu, réafficher le contenu fusionné
        refreshPreviewAfterPageChange();
    }

    /**
     * Génère dynamiquement l'interface de navigation des pages.
     * Adapte l'affichage selon le nombre de pages :
     * - 1 page : section masquée
     * - 2 pages : 2 boutons avec noms des pages
     * - 3+ pages : 1 combo déroulante
     * 
     * Les libellés proviennent de documentState.pages[i].name.
     * 
     * @returns {void}
     * 
     * @example
     * // Après chargement ou import
     * loadFromLocalStorage();
     * renderPageNavigation();
     * 
     * @see updatePageNavigationUI - Met à jour l'état actif
     * @see switchPage - Change de page
     */
    function renderPageNavigation() {
        const pageCount = documentState.pages.length;
        
        // 1 page : masquer la section
        if (pageCount <= 1) {
            if (pagesSection) pagesSection.style.display = 'none';
            return;
        }
        
        // 2+ pages : afficher la section
        if (pagesSection) pagesSection.style.display = 'block';
        if (!pageNavContainer) return;
        
        // Vider le conteneur
        pageNavContainer.innerHTML = '';
        
        if (pageCount === 2) {
            // Mode 2 boutons - utilise les classes de la sidebar
            documentState.pages.forEach((page, index) => {
                const btn = document.createElement('button');
                btn.className = 'btn page-nav-btn';
                btn.dataset.pageIndex = index;
                btn.dataset.tooltip = page.name;
                btn.innerHTML = `
                    <span class="btn-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                    </span>
                    <span class="btn-label">${page.name}</span>
                `;
                
                if (index === documentState.currentPageIndex) {
                    btn.classList.add('active');
                }
                
                btn.addEventListener('click', () => {
                    switchPage(index);
                });
                
                pageNavContainer.appendChild(btn);
            });
            
        } else {
            // Mode combo (3+ pages)
            const select = document.createElement('select');
            select.className = 'page-nav-select';
            select.id = 'page-nav-select';
            
            documentState.pages.forEach((page, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = page.name;
                if (index === documentState.currentPageIndex) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            
            select.addEventListener('change', (e) => {
                switchPage(parseInt(e.target.value, 10));
            });
            
            pageNavContainer.appendChild(select);
        }
    }

    /**
     * Met à jour l'état actif dans la navigation des pages.
     * Appelé après changement de page via switchPage().
     * 
     * Comportement selon le mode :
     * - Mode 2 boutons : met à jour la classe 'active'
     * - Mode combo (3+) : met à jour la sélection
     * 
     * @returns {void}
     * 
     * @see renderPageNavigation - Génère l'interface
     * @see switchPage - Change de page
     */
    function updatePageNavigationUI() {
        const pageCount = documentState.pages.length;
        
        if (pageCount === 2) {
            // Mode boutons : mettre à jour la classe active
            const buttons = pageNavContainer?.querySelectorAll('.page-nav-btn');
            buttons?.forEach((btn, index) => {
                if (index === documentState.currentPageIndex) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        } else if (pageCount > 2) {
            // Mode combo : mettre à jour la sélection
            const select = document.getElementById('page-nav-select');
            if (select) {
                select.value = documentState.currentPageIndex;
            }
        }
    }

    // --- 7. EXPORT JSON (format WebDev) ---

    /**
     * Lit un fichier JSON et retourne l'objet parsé.
     * @param {File} file - Fichier sélectionné
     * @returns {Promise<any>} Objet JSON
     */
    function readJsonFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Aucun fichier sélectionné'));
                return;
            }
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.onload = () => {
                try {
                    const text = String(reader.result || '');
                    resolve(JSON.parse(text));
                } catch (e) {
                    reject(new Error('JSON invalide: ' + e.message));
                }
            };
            reader.readAsText(file);
        });
    }

    btnExportJson.addEventListener('click', () => {
        saveToLocalStorage(); // Sauvegarde aussi quand on exporte
        
        try {
            // Export (format officiel WebDev)
            const exported = exportToWebDev();
            const jsonString = JSON.stringify(exported, null, 2);
            
            // Téléchargement du fichier
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "template_vdp.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log("✅ JSON exporté (format WebDev) et téléchargé.");
        } catch (error) {
            console.error('❌ Export JSON (format WebDev) en erreur:', error);
            alert('Export JSON en erreur ❌ (voir console)');
        }
    });

    // ───────────────────────────────────────────────────────────────────────────────
    // Check (vérification pré-export)
    // ───────────────────────────────────────────────────────────────────────────────
    if (btnCheck) {
        btnCheck.addEventListener('click', () => {
            console.log('Clic sur bouton Check');
            const result = checkDocumentIntegrity();
            showCheckResult(result);
        });
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // Export PSMD (PrintShop Mail)
    // ───────────────────────────────────────────────────────────────────────────────
    if (btnExportPsmd) {
        btnExportPsmd.addEventListener('click', () => {
            console.log('Clic sur bouton Export PSMD');
            exportToPsmd();
        });
    }

    // --- IMPORT JSON (tests) ---
    if (btnImportJson && inputImportJson) {
        btnImportJson.addEventListener('click', () => {
            inputImportJson.click();
        });

        inputImportJson.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            // Permettre de re-sélectionner le même fichier
            e.target.value = '';

            if (!file) return;

            try {
                const jsonData = await readJsonFile(file);
                const ok = loadFromWebDev(jsonData);
                console.log('✅ Import JSON terminé:', ok ? 'OK' : 'ERREUR');
                alert(ok ? 'Import JSON terminé ✅' : 'Import JSON en erreur ❌ (voir console)');
            } catch (err) {
                console.error('❌ Import JSON:', err.message || err);
                alert('Import JSON impossible ❌ (voir console)');
            }
        });
    }

 
    // ─────────────────────────────── FIN SECTION 23 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 24 : ZOOM ET PAN
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Gestion du zoom et du déplacement (pan) dans l'espace de travail.
     * 
     * Variables :
     *   - zoomLevel : Niveau de zoom actuel (0.25 à 3.0)
     *   - CANVAS_PADDING : Marge autour du document
     *   - spacePressed : Flag pour le mode pan avec Espace
     * 
     * Fonctions principales :
     *   - setZoom() : Applique un niveau de zoom
     *   - centerWorkspace() : Centre le document dans la vue
     * 
     * Listeners :
     *   - zoomSlider : Curseur de zoom
     *   - btnZoomIn, btnZoomOut : Boutons de zoom
     *   - wheel : Zoom molette (Ctrl+molette)
     *   - Espace : Mode pan temporaire
     * 
     * Dépendances :
     *   - a4Page, workspace, workspaceCanvas (Section 1)
     *   - getPageWidth(), getPageHeight() (Section 12)
     */
    // ───────────────────────────────────────────────────────────────────────────────

    const CANVAS_PADDING = 60;

    function setZoom(level) {
        // Limiter le zoom entre 25% et 300%
        zoomLevel = Math.max(0.25, Math.min(3.0, level));
        
        if (!a4Page) return;
        
        // Appliquer le zoom avec transform: scale()
        a4Page.style.transform = `scale(${zoomLevel})`;
        a4Page.style.transformOrigin = 'center center';
        
        // Calculer les dimensions du document zoomé (utiliser les dimensions dynamiques)
        const pageWidth = getPageWidth();
        const pageHeight = getPageHeight();
        const scaledWidth = pageWidth * zoomLevel;
        const scaledHeight = pageHeight * zoomLevel;
        
        // Dimensions nécessaires pour le canvas (document + marge grise)
        const neededWidth = scaledWidth + CANVAS_PADDING * 2;
        const neededHeight = scaledHeight + CANVAS_PADDING * 2;
        
        // Dimensions du workspace (viewport)
        const workspaceWidth = workspace.clientWidth;
        const workspaceHeight = workspace.clientHeight;
        
        // Le canvas doit être au moins aussi grand que le workspace (pour le centrage)
        // ou plus grand si le document zoomé le nécessite
        const canvasWidth = Math.max(workspaceWidth, neededWidth);
        const canvasHeight = Math.max(workspaceHeight, neededHeight);
        
        // Appliquer la taille au canvas
        if (workspaceCanvas) {
            workspaceCanvas.style.width = canvasWidth + 'px';
            workspaceCanvas.style.height = canvasHeight + 'px';
        }
        
        // Mettre à jour l'interface
        zoomSlider.value = Math.round(zoomLevel * 100);
        zoomValue.textContent = Math.round(zoomLevel * 100) + '%';
        
        // Centrer le document dans le workspace
        centerWorkspace();
    }

    function centerWorkspace() {
        // Dimensions du canvas et du workspace
        const canvasWidth = workspaceCanvas.offsetWidth;
        const canvasHeight = workspaceCanvas.offsetHeight;
        const workspaceWidth = workspace.clientWidth;
        const workspaceHeight = workspace.clientHeight;
        
        // Si le canvas est plus grand que le workspace, on centre via scroll
        // Sinon, le flexbox du canvas centre automatiquement le document
        const scrollLeft = Math.max(0, (canvasWidth - workspaceWidth) / 2);
        const scrollTop = Math.max(0, (canvasHeight - workspaceHeight) / 2);
        
        workspace.scrollLeft = scrollLeft;
        workspace.scrollTop = scrollTop;
    }

    // Event listeners pour les contrôles de zoom
    zoomSlider.addEventListener('input', (e) => {
        const level = parseInt(e.target.value) / 100;
        setZoom(level);
    });

    btnZoomIn.addEventListener('click', () => {
        setZoom(zoomLevel + 0.1);
    });

    btnZoomOut.addEventListener('click', () => {
        setZoom(zoomLevel - 0.1);
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // SIDEBAR TOGGLE ET TOOLTIPS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Toggle de la sidebar (réduire/agrandir)
     * @description Bascule la classe 'collapsed' sur la sidebar
     */
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Mettre à jour le title du bouton
            const isCollapsed = sidebar.classList.contains('collapsed');
            sidebarToggle.title = isCollapsed ? 'Agrandir' : 'Réduire';
        });
    }

    /**
     * Système de tooltips pour la sidebar (mode collapsed)
     * @description Affiche les tooltips au survol des boutons quand la sidebar est réduite
     */
    if (sidebar && sidebarTooltip) {
        const buttonsWithTooltip = sidebar.querySelectorAll('[data-tooltip]');
        
        buttonsWithTooltip.forEach(btn => {
            btn.addEventListener('mouseenter', (e) => {
                // Afficher tooltip uniquement en mode collapsed
                if (!sidebar.classList.contains('collapsed')) return;
                
                const text = btn.getAttribute('data-tooltip');
                sidebarTooltip.textContent = text;
                
                const rect = btn.getBoundingClientRect();
                sidebarTooltip.style.left = (rect.right + 10) + 'px';
                sidebarTooltip.style.top = (rect.top + rect.height / 2) + 'px';
                sidebarTooltip.style.transform = 'translateY(-50%)';
                sidebarTooltip.classList.add('visible');
            });

            btn.addEventListener('mouseleave', () => {
                sidebarTooltip.classList.remove('visible');
            });
        });
    }

    // Zoom avec molette (Ctrl + Molette)
    workspace.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(zoomLevel + delta);
        }
    }, { passive: false });

    // Initialiser le zoom à 100%
    setZoom(1.0);

    // --- 9. FONCTIONNALITÉ PAN (Déplacement du document) ---
    let isPanning = false;
    let panStartX, panStartY, panStartScrollLeft, panStartScrollTop;
    let spacePressed = false;
    let panPotential = false; // Pour le pan permanent (détection du mouvement)
    const PAN_THRESHOLD = 5; // Seuil de mouvement en pixels avant d'activer le pan

    /**
     * Indique si l'élément actif est un éditeur Quill (ou plus généralement un contenteditable).
     * Objectif : ne pas intercepter les touches clavier (ex: Espace) quand l'utilisateur édite du texte riche.
     *
     * Conditions demandées :
     * - document.activeElement est un .ql-editor
     * - OU document.activeElement.closest('.quill-editor-container') existe
     * - OU document.activeElement.getAttribute('contenteditable') === 'true'
     *
     * @returns {boolean} True si le focus est dans un éditeur Quill/contenteditable
     */
    function isQuillOrContentEditableActiveElement() {
        const activeEl = document.activeElement;
        if (!activeEl) return false;
        
        // Quill
        if (activeEl.classList && activeEl.classList.contains('ql-editor')) return true;
        if (activeEl.closest && activeEl.closest('.quill-editor-container')) return true;
        
        // Contenteditable générique
        if (activeEl.getAttribute && activeEl.getAttribute('contenteditable') === 'true') return true;
        
        // Filet de sécurité : notre intégration Designer utilise aussi `.quill-editor`
        if (activeEl.closest && activeEl.closest('.quill-editor')) return true;
        
        return false;
    }

    // Détecter quand Espace est pressé
    document.addEventListener('keydown', (e) => {
        // Log de vérification (temporaire) - uniquement sur la touche Espace
        if (e.code === 'Space' || e.key === ' ') {
            console.log('🔧 DEBUG ESPACE - activeElement:', document.activeElement && document.activeElement.className, 'key:', e.key);
        }
        
        // Ne jamais intercepter l'espace si on édite dans Quill / contenteditable
        if (isQuillOrContentEditableActiveElement()) {
            return;
        }
        
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault(); // Empêcher le scroll de page
            spacePressed = true;
            workspace.style.cursor = 'grab';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spacePressed = false;
            if (!isPanning) {
                workspace.style.cursor = '';
            }
        }
    });

    // Détecter le début du pan : Espace + clic gauche OU clic molette OU clic gauche sur fond (pan permanent)
    document.addEventListener('mousedown', (e) => {
        // Ne pas activer le pan si on clique sur une zone ou un élément interactif
        if (e.target.closest('.zone') || e.target.closest('.toolbar') || e.target.closest('button')) {
            return;
        }

        // Pan avec Espace + clic gauche (immédiat)
        if (e.button === 0 && spacePressed) {
            e.preventDefault();
            e.stopPropagation();
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartScrollLeft = workspace.scrollLeft;
            panStartScrollTop = workspace.scrollTop;
            workspace.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
        // Pan avec clic molette (immédiat)
        else if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartScrollLeft = workspace.scrollLeft;
            panStartScrollTop = workspace.scrollTop;
            workspace.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
        // Pan permanent : clic gauche sur le fond (avec seuil de mouvement)
        else if (e.button === 0) {
            // On enregistre la position mais on n'active pas le pan tout de suite
            // On attend de voir si l'utilisateur bouge la souris
            panPotential = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartScrollLeft = workspace.scrollLeft;
            panStartScrollTop = workspace.scrollTop;
        }
    });

    // Déplacer le document pendant le pan
    document.addEventListener('mousemove', (e) => {
        // Pan permanent : activer le pan si on dépasse le seuil de mouvement
        if (panPotential && !isPanning && !isDragging && !isResizing) {
            const dx = Math.abs(e.clientX - panStartX);
            const dy = Math.abs(e.clientY - panStartY);
            
            // Si on a bougé de plus de PAN_THRESHOLD pixels, activer le pan
            if (dx > PAN_THRESHOLD || dy > PAN_THRESHOLD) {
                isPanning = true;
                panPotential = false;
                workspace.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
            }
        }
        
        // Pan actif : déplacer le document
        if (isPanning && !isDragging && !isResizing) {
            e.preventDefault();
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            
            workspace.scrollLeft = panStartScrollLeft - dx;
            workspace.scrollTop = panStartScrollTop - dy;
        }
    });

    // Arrêter le pan
    document.addEventListener('mouseup', (e) => {
        if (isPanning) {
            isPanning = false;
            workspace.style.cursor = spacePressed ? 'grab' : '';
            document.body.style.userSelect = '';
        }
        
        // Si on n'a pas activé le pan (clic simple), permettre la désélection normale
        if (panPotential && !isPanning) {
            panPotential = false;
            // Le clic simple sera géré par le listener de désélection existant
        }
    });

    // ─────────────────────────────── FIN SECTION 24 ───────────────────────────────

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 25 : EXPORT PSMD (PRINTSHOP MAIL)
    // ═══════════════════════════════════════════════════════════════════════════════
    /**
     * Fonctions d'export vers le format .psmd (PrintShop Mail XML).
     * Permet de générer des fichiers directement exploitables pour la production VDP.
     * 
     * Fonctions utilitaires :
     *   - mmToPoints() : Conversion mm → points (72 dpi)
     *   - rgbToCmyk() : Conversion couleur RGB hex → CMYK
     *   - rtfToBase64() : Encodage RTF en Base64
     *   - extractMergeFields() : Extraction des champs @XXX@
     *   - generateGuid() : Génération d'un GUID unique
     *   - formatIsoDateTime() : Date/heure au format ISO
     *   - escapeXmlPsmd() : Échappement des caractères XML
     *   - toHexLE16() : Conversion entier → hex little-endian 16 bits
     *   - hexToBase64() : Conversion hex → Base64
     *   - generateWindowsDevmode() : Génération blob DEVMODE pour impression
     * 
     * Fonctions templates XML :
     *   - generatePsmdInfo() : Section <info>
     *   - generatePsmdPrinter() : Section <printer>
     *   - generatePsmdPreferences() : Section <preferences>
     *   - generatePsmdDatabaseSettings() : Section <database_settings>
     *   - generatePsmdFooterSections() : Sections finales
     *   - generatePsmdColor() : Balise couleur CMYK
     *   - generatePsmdVariable() : Section <variable>
     * 
     * Constantes de mapping :
     *   - BARCODE_TYPE_MAP : Types codes-barres Designer → PSMD
     *   - HALIGN_MAP : Alignements horizontaux
     *   - VALIGN_MAP : Alignements verticaux
     * 
     * Fonctions génération objets zones :
     *   - generatePsmdObjectCommon() : Propriétés communes
     *   - generatePsmdTextObject() : Zone texte
     *   - generatePsmdImageObject() : Zone image
     *   - generatePsmdBarcodeObject() : Zone code-barres/QR
     *   - generatePsmdObject() : Dispatch selon type
     * 
     * Fonctions variables et layouts :
     *   - generatePsmdVariables() : Extraction et génération des variables
     *   - generatePsmdLayout() : Génération d'une page
     *   - generatePsmdLayouts() : Génération de toutes les pages
     * 
     * Fonction principale :
     *   - exportToPsmd() : Génère le fichier .psmd complet et déclenche le téléchargement
     */
    // ───────────────────────────────────────────────────────────────────────────────

    /**
     * Convertit des millimètres en points (72 dpi).
     * PrintShop Mail utilise des points pour les coordonnées.
     * 
     * @param {number} mm - Valeur en millimètres
     * @returns {number} Valeur en points (72 dpi)
     * 
     * @example
     * mmToPoints(210);  // → 595.27559 (largeur A4)
     * mmToPoints(297);  // → 841.88976 (hauteur A4)
     * mmToPoints(25.4); // → 72 (1 pouce)
     */
    function mmToPoints(mm) {
        return mm * 72 / 25.4;
    }

    /**
     * Convertit une couleur RGB hexadécimale en CMYK.
     * PrintShop Mail utilise des couleurs CMYK (composants 0-1).
     * 
     * @param {string} hexColor - Couleur hex (#RRGGBB ou #RGB)
     * @returns {{c: number, m: number, y: number, k: number}} Valeurs CMYK entre 0 et 1
     * 
     * @example
     * rgbToCmyk('#000000'); // → { c: 0, m: 0, y: 0, k: 1 } (noir)
     * rgbToCmyk('#FFFFFF'); // → { c: 0, m: 0, y: 0, k: 0 } (blanc)
     * rgbToCmyk('#FF0000'); // → { c: 0, m: 1, y: 1, k: 0 } (rouge)
     */
    function rgbToCmyk(hexColor) {
        // Normaliser le format hex
        let hex = (hexColor || '#000000').replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // Extraire et normaliser RGB (0-1)
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        // Calculer K (noir)
        const k = 1 - Math.max(r, g, b);
        
        // Si noir pur, éviter division par zéro
        if (k === 1) {
            return { c: 0, m: 0, y: 0, k: 1 };
        }
        
        // Calculer C, M, Y
        const c = (1 - r - k) / (1 - k);
        const m = (1 - g - k) / (1 - k);
        const y = (1 - b - k) / (1 - k);
        
        return { c, m, y, k };
    }

    /**
     * Convertit des valeurs CMJN en couleur hexadécimale RGB.
     * Fonction inverse de rgbToCmyk().
     * 
     * @param {number} c - Cyan (0-100)
     * @param {number} m - Magenta (0-100)
     * @param {number} y - Jaune (0-100)
     * @param {number} k - Noir (0-100)
     * @returns {string} Couleur hexadécimale (#RRGGBB)
     * 
     * @example
     * cmykToHex(0, 0, 0, 100);   // → '#000000' (noir)
     * cmykToHex(0, 0, 0, 0);     // → '#ffffff' (blanc)
     * cmykToHex(0, 100, 100, 0); // → '#ff0000' (rouge)
     */
    function cmykToHex(c, m, y, k) {
        // Normaliser les valeurs en 0-1
        const C = Math.max(0, Math.min(100, c)) / 100;
        const M = Math.max(0, Math.min(100, m)) / 100;
        const Y = Math.max(0, Math.min(100, y)) / 100;
        const K = Math.max(0, Math.min(100, k)) / 100;
        
        // Convertir CMYK → RGB
        const r = Math.round(255 * (1 - C) * (1 - K));
        const g = Math.round(255 * (1 - M) * (1 - K));
        const b = Math.round(255 * (1 - Y) * (1 - K));
        
        // Formater en hex
        const toHex = (val) => val.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    /**
     * Met à jour les 4 champs CMJN d'un groupe.
     * Si des valeurs CMJN natives sont fournies, les utilise directement.
     * Sinon, convertit la couleur hexadécimale via rgbToCmyk().
     * 
     * @param {string} prefix - Préfixe des IDs (ex: 'quill-color', 'image-bg')
     * @param {string} hexColor - Couleur hexadécimale (#RRGGBB)
     * @param {{c: number, m: number, y: number, k: number}} [cmykNative] - Valeurs CMJN natives (prioritaires)
     * @returns {void}
     * 
     * @example
     * updateCmjnFieldsFromHex('quill-color', '#ff0000'); // Convertit RGB → CMJN
     * updateCmjnFieldsFromHex('image-bg', '#cccccc', {c: 0, m: 0, y: 0, k: 20}); // Utilise CMJN natif
     */
    function updateCmjnFieldsFromHex(prefix, hexColor, cmykNative) {
        let cPercent, mPercent, yPercent, kPercent;
        
        if (cmykNative && typeof cmykNative.c === 'number') {
            // Utiliser les valeurs CMJN natives (pas de conversion)
            cPercent = cmykNative.c;
            mPercent = cmykNative.m;
            yPercent = cmykNative.y;
            kPercent = cmykNative.k;
        } else {
            // Convertir depuis RGB (fallback)
            const cmyk = rgbToCmyk(hexColor);
            cPercent = Math.round(cmyk.c * 100);
            mPercent = Math.round(cmyk.m * 100);
            yPercent = Math.round(cmyk.y * 100);
            kPercent = Math.round(cmyk.k * 100);
        }
        
        // Mettre à jour les champs
        const inputC = document.getElementById(`${prefix}-c`);
        const inputM = document.getElementById(`${prefix}-m`);
        const inputY = document.getElementById(`${prefix}-y`);
        const inputK = document.getElementById(`${prefix}-k`);
        
        if (inputC) inputC.value = cPercent;
        if (inputM) inputM.value = mPercent;
        if (inputY) inputY.value = yPercent;
        if (inputK) inputK.value = kPercent;
    }

    /**
     * Lit les 4 champs CMJN d'un groupe et retourne la couleur hexadécimale correspondante.
     * Utilise cmykToHex() pour la conversion.
     * 
     * @param {string} prefix - Préfixe des IDs (ex: 'quill-color', 'image-bg')
     * @returns {string} Couleur hexadécimale (#RRGGBB)
     * 
     * @example
     * getHexFromCmjnFields('quill-color'); // Lit quill-color-c/m/y/k → '#rrggbb'
     */
    function getHexFromCmjnFields(prefix) {
        const inputC = document.getElementById(`${prefix}-c`);
        const inputM = document.getElementById(`${prefix}-m`);
        const inputY = document.getElementById(`${prefix}-y`);
        const inputK = document.getElementById(`${prefix}-k`);
        
        const c = inputC ? parseInt(inputC.value, 10) || 0 : 0;
        const m = inputM ? parseInt(inputM.value, 10) || 0 : 0;
        const y = inputY ? parseInt(inputY.value, 10) || 0 : 0;
        const k = inputK ? parseInt(inputK.value, 10) || 0 : 0;
        
        return cmykToHex(c, m, y, k);
    }

    /**
     * Lit les 4 champs CMJN d'un groupe et retourne un objet CmykData.
     * 
     * @param {string} prefix - Préfixe des IDs (ex: 'quill-color', 'image-bg')
     * @returns {{c: number, m: number, y: number, k: number}} Valeurs CMJN (0-100)
     * 
     * @example
     * getCmjnValuesFromFields('quill-color'); // → {c: 100, m: 16, y: 5, k: 20}
     */
    function getCmjnValuesFromFields(prefix) {
        const inputC = document.getElementById(`${prefix}-c`);
        const inputM = document.getElementById(`${prefix}-m`);
        const inputY = document.getElementById(`${prefix}-y`);
        const inputK = document.getElementById(`${prefix}-k`);
        
        return {
            c: inputC ? parseInt(inputC.value, 10) || 0 : 0,
            m: inputM ? parseInt(inputM.value, 10) || 0 : 0,
            y: inputY ? parseInt(inputY.value, 10) || 0 : 0,
            k: inputK ? parseInt(inputK.value, 10) || 0 : 0
        };
    }

    /**
     * Initialise les event listeners pour un groupe de champs CMJN.
     * À chaque modification d'un champ C/M/J/N, convertit en RGB et appelle le callback
     * avec la couleur hex ET les valeurs CMJN natives.
     * 
     * @param {string} prefix - Préfixe des IDs (ex: 'quill-color', 'image-bg')
     * @param {function(string, {c: number, m: number, y: number, k: number}): void} onColorChange - Callback avec hex et CMJN
     * @returns {void}
     * 
     * @example
     * initCmjnFieldsListeners('quill-color', (hex, cmyk) => {
     *     zoneData.color = hex;
     *     zoneData.colorCmyk = cmyk;
     *     updateColorSwatchPoc('quill-color-swatch', hex);
     * });
     */
    function initCmjnFieldsListeners(prefix, onColorChange) {
        const fields = ['c', 'm', 'y', 'k'];
        
        fields.forEach(field => {
            const input = document.getElementById(`${prefix}-${field}`);
            if (!input) return;
            
            // Valider et limiter la saisie (0-100)
            input.addEventListener('input', () => {
                let val = parseInt(input.value, 10);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 100) val = 100;
                input.value = val;
                
                // Convertir CMJN → Hex et notifier avec les deux valeurs
                const newHex = getHexFromCmjnFields(prefix);
                const cmykValues = getCmjnValuesFromFields(prefix);
                onColorChange(newHex, cmykValues);
            });
            
            // Permettre la validation au blur (si champ vide)
            input.addEventListener('blur', () => {
                if (input.value === '') {
                    input.value = '0';
                    const newHex = getHexFromCmjnFields(prefix);
                    const cmykValues = getCmjnValuesFromFields(prefix);
                    onColorChange(newHex, cmykValues);
                }
            });
        });
    }

    /**
     * Encode une chaîne RTF en Base64 pour PrintShop Mail.
     * 
     * @param {string} rtfString - Chaîne RTF brute
     * @returns {string} RTF encodé en Base64
     * 
     * @example
     * rtfToBase64('{\\rtf1\\ansi Hello}'); // → 'e1xydGYxXGFuc2kgSGVsbG99'
     */
    function rtfToBase64(rtfString) {
        if (!rtfString) return '';
        try {
            // Encoder en UTF-8 puis en Base64
            return btoa(unescape(encodeURIComponent(rtfString)));
        } catch (e) {
            console.error('Erreur encodage RTF Base64:', e);
            return '';
        }
    }

    /**
     * Extrait les champs de fusion @XXX@ d'une chaîne RTF.
     * Les champs sont identifiés par les marqueurs @ au début et à la fin.
     * 
     * @param {string} rtfString - Chaîne RTF contenant les champs
     * @returns {string[]} Liste des noms de champs uniques (sans les @)
     * 
     * @example
     * extractMergeFields('@SOCIETE@\\par @CONTACT@'); // → ['SOCIETE', 'CONTACT']
     * extractMergeFields('@NOM@ et @NOM@'); // → ['NOM'] (dédupliqué)
     */
    function extractMergeFields(rtfString) {
        if (!rtfString) return [];
        
        const regex = /@([A-Za-z0-9_]+)@/g;
        const fields = new Set();
        let match;
        
        while ((match = regex.exec(rtfString)) !== null) {
            fields.add(match[1]); // Ajoute le nom sans les @
        }
        
        return Array.from(fields);
    }

    /**
     * Génère un GUID unique au format PrintShop Mail.
     * Format : {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}
     * 
     * @returns {string} GUID avec accolades
     * 
     * @example
     * generateGuid(); // → '{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}'
     */
    function generateGuid() {
        const hex = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
        const block = (n) => Array(n).fill(0).map(hex).join('');
        
        return `{${block(8)}-${block(4)}-${block(4)}-${block(4)}-${block(12)}}`;
    }

    /**
     * Formate la date et heure courante au format ISO pour PrintShop Mail.
     * Format : YYYY-MM-DDTHH:MM:SS
     * 
     * @returns {string} Date/heure au format ISO
     * 
     * @example
     * formatIsoDateTime(); // → '2025-12-18T20:30:45'
     */
    function formatIsoDateTime() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    /**
     * Échappe les caractères spéciaux XML.
     * 
     * @param {string} str - Chaîne à échapper
     * @returns {string} Chaîne échappée pour XML
     * 
     * @example
     * escapeXmlPsmd('Tom & Jerry'); // → 'Tom &amp; Jerry'
     * escapeXmlPsmd('<tag>'); // → '&lt;tag&gt;'
     */
    function escapeXmlPsmd(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Convertit un entier en hexadécimal little-endian sur 2 octets.
     * 
     * @param {number} value - Valeur entière à convertir
     * @returns {string} Chaîne hexadécimale (4 caractères, little-endian)
     * 
     * @example
     * toHexLE16(1);    // → '0100' (Portrait)
     * toHexLE16(2);    // → '0200' (Paysage)
     * toHexLE16(2970); // → '9A0B' (A4 hauteur en 1/10 mm)
     * toHexLE16(2100); // → '3408' (A4 largeur en 1/10 mm)
     */
    function toHexLE16(value) {
        const lowByte = value % 256;
        const highByte = Math.floor(value / 256);
        return lowByte.toString(16).toUpperCase().padStart(2, '0') + 
               highByte.toString(16).toUpperCase().padStart(2, '0');
    }

    /**
     * Convertit une chaîne hexadécimale en Base64.
     * 
     * @param {string} hexString - Chaîne hexadécimale (sans espaces)
     * @returns {string} Chaîne encodée en Base64
     */
    function hexToBase64(hexString) {
        // Convertir hex en tableau d'octets
        const bytes = [];
        for (let i = 0; i < hexString.length; i += 2) {
            bytes.push(parseInt(hexString.substr(i, 2), 16));
        }
        
        // Convertir en chaîne binaire puis en Base64
        const binary = String.fromCharCode.apply(null, bytes);
        return btoa(binary);
    }

    /**
     * Génère le blob DEVMODE encodé en Base64 pour PrintShop Mail.
     * Définit l'orientation et les dimensions de la page pour l'impression.
     * 
     * @param {string} orientation - 'PORTRAIT' ou 'PAYSAGE'
     * @param {number} hauteurMm - Hauteur de la page en millimètres
     * @param {number} largeurMm - Largeur de la page en millimètres
     * @returns {string} DEVMODE encodé en Base64
     * 
     * @example
     * // A4 Portrait
     * generateWindowsDevmode('PORTRAIT', 297, 210);
     * 
     * // A4 Paysage
     * generateWindowsDevmode('PAYSAGE', 210, 297);
     */
    function generateWindowsDevmode(orientation, hauteurMm, largeurMm) {
        // Orientation : 1 = Portrait, 2 = Paysage
        const nOrientation = (orientation.toUpperCase() === 'PAYSAGE' || 
                              orientation.toUpperCase() === 'LANDSCAPE') ? 2 : 1;
        
        // Convertir en 1/10 mm
        const hauteur10mm = Math.round(hauteurMm * 10);
        const largeur10mm = Math.round(largeurMm * 10);
        
        // Encoder en little-endian hex
        const hexOrientation = toHexLE16(nOrientation);
        const hexHauteur = toHexLE16(hauteur10mm);
        const hexLargeur = toHexLE16(largeur10mm);
        
        // Template DEVMODE en hexadécimal (basé sur PrintShop Mail Printer)
        // Les placeholders sont remplacés par les valeurs calculées
        const hexTemplate = 
            'FFFEFF165000720069006E007400530068006F00700020004D00610069006C002000500072' +
            '0069006E00740065007200780400005000720069006E007400530068006F00700020004D00' +
            '610069006C0020005000720069006E0074006500720000000000000000000000000000000000' +
            '0000000001040006DC009C0353EF80' + hexOrientation + '00FF' + hexHauteur + hexLargeur + 
            '04640001000F004800020001004800030001000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000010000000000000001000000020000000100000' +
            '0000000000000000000000000000000000000000050524956E23000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000018000000000' +
            '01027102710270000102700000000000000000C8009C0300000000000000000000000000000' +
            '000000000000000000003000000000000000000100050BD0100887E030000000000000000000' +
            '000000000000000000000000000000000000000449F6BE605000000000025' +
            '00FF00FF0000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000001000000000000000000000000000000C8000000534D544A00' +
            '0000001000B8005000720069006E007400530068006F00700020004D00610069006C00200050' +
            '00720069006E0074006500720020004400720069007600650072002000280050005300290000' +
            '005265736F6C7574696F6E003732647069005061676553697A6500437573746F6D5061676553' +
            '697A650050616765526567696F6E00004C656164696E674564676500' +
            '00496E707574536C6F74002A557365466F726D547261795461626C6500000000000000000000' +
            '0000000000000000000000';
        
        // Convertir hex en Base64
        return hexToBase64(hexTemplate);
    }

    /**
     * Génère la section <info> du fichier PSMD.
     * 
     * @returns {string} XML de la section info
     */
    function generatePsmdInfo() {
        return `<info>
<user_name>Marketeam Designer</user_name>
<date_time>${formatIsoDateTime()}</date_time>
<app_version>Version 7.2.4 (construire 7893)</app_version>
<published>no</published>
</info>`;
    }

    /**
     * Génère la section <printer> du fichier PSMD.
     * 
     * @returns {string} XML de la section printer
     */
    function generatePsmdPrinter() {
        return `<printer>
<printer_name>PrintShop Mail Printer</printer_name>
</printer>`;
    }

    /**
     * Génère la section <preferences> du fichier PSMD.
     * 
     * @returns {string} XML de la section preferences
     */
    function generatePsmdPreferences() {
        return `<preferences>
<program>
<default_tabstop_interval>36</default_tabstop_interval>
<markers begin="@" end="@"/>
<items_without_database>1</items_without_database>
</program>
<print_job>
<collate>yes</collate>
<use_split_job>no</use_split_job>
<split_job_size>1000</split_job_size>
<split_by>0</split_by>
<forms>
<store_on_disk>yes</store_on_disk>
<use_custom_cache_size>no</use_custom_cache_size>
<cache_size>4096</cache_size>
<use_opi>0</use_opi>
</forms>
<master>
<freeform2_master_name>Master1</freeform2_master_name>
<print_mode>3</print_mode>
</master>
<ppml>
<environment>psmail\\Sans titre</environment>
<send_images>0</send_images>
<zip>yes</zip>
<embed_images_in_pdf>yes</embed_images_in_pdf>
</ppml>
<vipp>
<project_folder>projects\\psmail</project_folder>
<do_not_spool_images>0</do_not_spool_images>
</vipp>
<vps>
<generate_booklets>yes</generate_booklets>
<use_apr>0</use_apr>
</vps>
<pdf>
<joboptions></joboptions>
</pdf>
<pdfvt>
<joboptions></joboptions>
</pdfvt>
<margins option="0" left="0" top="0" right="0" bottom="0"/>
<technology>0</technology>
</print_job>
<repetition>
<repeat_hor>1</repeat_hor>
<repeat_ver>1</repeat_ver>
<print_priority>4</print_priority>
<print_priority>0</print_priority>
<print_priority>2</print_priority>
<spacing_between_layouts x="0" y="0"/>
<duplex_print>0</duplex_print>
</repetition>
<imposition>
<bleed>
<mode>0</mode>
<size>40</size>
</bleed>
<cropmarks>
<mode>1</mode>
<size>6</size>
<double_sided>no</double_sided>
<color colorspace="CMYK" downgrade_c="0" downgrade_m="0" downgrade_y="0" downgrade_k="1"><component>0</component><component>0</component><component>0</component><component>1</component></color>
</cropmarks>
<folding_lines>
<size>40</size>
</folding_lines>
</imposition>
<colormanagement intent_generic="relative" colormanage="no"><colorspace id="RGB"><profile source="iccfile"><file name="srgb color space profile.icm" description="sRGB IEC61966-2.1">AA==</file></profile></colorspace><colorspace id="CMYK"><profile source="iccfile"><file name="uswebcoatedswop.icc" description="U.S. Web Coated (SWOP) v2">AA==</file></profile></colorspace><colorspace id="GRAY"><profile source="gamma"><gamma>2.2</gamma></profile></colorspace><colorspace id="defaultRGB"><profile source="iccfile"><file name="srgb color space profile.icm" description="sRGB IEC61966-2.1">AA==</file></profile></colorspace><colorspace id="defaultCMYK"><profile source="iccfile"><file name="uswebcoatedswop.icc" description="U.S. Web Coated (SWOP) v2">AA==</file></profile></colorspace><colorspace id="defaultGRAY"><profile source="gamma"><gamma>2.2</gamma></profile></colorspace></colormanagement>
<ppconnect>
<namevalue name="__#PPSuite#Connection_FaxNumber" expression=""></namevalue>
<namevalue name="__#PPSuite#Connection_FaxDescription" expression=""></namevalue>
<namevalue name="__#PPSuite#Connection_eMailAddress" expression=""></namevalue>
<namevalue name="__#PPSuite#Connection_eMailSubject" expression=""></namevalue>
<namevalue name="__#PPSuite#Connection_eMailBodyText" expression=""></namevalue>
<namevalue name="__#PPSuite#Connection_PDFBookmark" expression=""></namevalue>
</ppconnect>
</preferences>`;
    }

    /**
     * Génère la section <database_settings> du fichier PSMD.
     * 
     * @returns {string} XML de la section database_settings
     */
    function generatePsmdDatabaseSettings() {
        return `<database_settings>
<table_name>Pas de source de données</table_name>
<db_type>3</db_type>
<db_pathsettings></db_pathsettings>
<extended_properties>
<colnameheader>yes</colnameheader>
<format></format>
<encoding></encoding>
</extended_properties>
<filter_sort_settings>
<filter></filter>
<sort></sort>
<db_filter_enable>no</db_filter_enable>
<db_sort_enable>no</db_sort_enable>
</filter_sort_settings>
<filter_array_size>0</filter_array_size>
</database_settings>`;
    }

    /**
     * Génère les sections finales du fichier PSMD (data_fields, template_folders, embedded_ps).
     * 
     * @returns {string} XML des sections finales
     */
    function generatePsmdFooterSections() {
        return `<data_fields>
</data_fields>
<template_folders>
</template_folders>
<embedded_ps>
<author>PrintShop Mail</author>
<creation_date>1992-07-01T11:00:00</creation_date>
<last_modification_date>1992-07-01T11:00:00</last_modification_date>
<n>Ne rien intégrer</n>
<description></description>
<start_of_page></start_of_page>
<start_of_job></start_of_job>
<between_sets></between_sets>
</embedded_ps>`;
    }

    /**
     * Génère une section <fillcolor>, <bordercolor> ou <textcolor> CMYK.
     * L'attribut alpha est optionnel : utilisé pour fillcolor, omis pour bordercolor et textcolor.
     * 
     * @param {string} tagName - Nom de la balise ('fillcolor', 'bordercolor', 'textcolor')
     * @param {{c: number, m: number, y: number, k: number}} cmyk - Valeurs CMYK (0-1)
     * @param {number|null} [alpha=null] - Transparence (null = pas d'attribut alpha, 0-1 sinon)
     * @returns {string} XML de la couleur CMYK
     */
    function generatePsmdColor(tagName, cmyk, alpha = null) {
        const c = cmyk.c.toFixed(2).replace(/\.?0+$/, '') || '0';
        const m = cmyk.m.toFixed(2).replace(/\.?0+$/, '') || '0';
        const y = cmyk.y.toFixed(2).replace(/\.?0+$/, '') || '0';
        const k = cmyk.k.toFixed(2).replace(/\.?0+$/, '') || '0';
        
        // Alpha seulement si explicitement fourni (pas null)
        const alphaAttr = alpha !== null ? ` alpha="${alpha}"` : '';
        
        return `<${tagName} colorspace="CMYK"${alphaAttr} downgrade_c="${c}" downgrade_m="${m}" downgrade_y="${y}" downgrade_k="${k}"><component>${c}</component><component>${m}</component><component>${y}</component><component>${k}</component></${tagName}>`;
    }

    /**
     * Génère une balise couleur CMYK PSMD SANS attribut alpha.
     * Utilisé pour backgroundcolor et foregroundcolor dans les filtres two_color.
     * 
     * @param {string} tagName - Nom de la balise (backgroundcolor, foregroundcolor)
     * @param {Object} cmyk - Couleur CMYK {c, m, y, k}
     * @returns {string} XML de la couleur sans alpha
     */
    function generatePsmdColorNoAlpha(tagName, cmyk) {
        const c = cmyk.c || 0;
        const m = cmyk.m || 0;
        const y = cmyk.y || 0;
        const k = cmyk.k || 0;
        
        return `<${tagName} colorspace="CMYK" downgrade_c="${c}" downgrade_m="${m}" downgrade_y="${y}" downgrade_k="${k}"><component>${c}</component><component>${m}</component><component>${y}</component><component>${k}</component></${tagName}>`;
    }

    /**
     * Génère la section <variable> pour un champ de fusion.
     * 
     * @param {string} fieldName - Nom du champ (sans les @)
     * @returns {string} XML de la variable
     */
    function generatePsmdVariable(fieldName) {
        return `<variable>
<name>${escapeXmlPsmd(fieldName)}</name>
<global>no</global>
<expression>""</expression>
<Formatting>3</Formatting>
<Locale_ID>1036</Locale_ID>
<Currency_Symbol>€</Currency_Symbol>
<Currency_DecimalSymbol>,</Currency_DecimalSymbol>
<Currency_DecimalPlaces>2</Currency_DecimalPlaces>
<Currency_DigitsInGroup>3</Currency_DigitsInGroup>
<Currency_GroupingSymbol> </Currency_GroupingSymbol>
<Currency_NegativeFormat>8</Currency_NegativeFormat>
<Currency_PositiveFormat>3</Currency_PositiveFormat>
<Number_DecimalSymbol>,</Number_DecimalSymbol>
<Number_DecimalPlaces>2</Number_DecimalPlaces>
<Number_DigitsInGroup>3</Number_DigitsInGroup>
<Number_GroupingSymbol> </Number_GroupingSymbol>
<Number_LeadingZeros>1</Number_LeadingZeros>
<Number_NegativeSymbol>-</Number_NegativeSymbol>
<Number_NegativeFormat>1</Number_NegativeFormat>
<Date_Style>dddd d MMMM yyyy</Date_Style>
</variable>`;
    }

    /**
     * Génère une variable d'image pour la section <variables> du PSMD.
     * PrintShop Mail utilise cette variable pour lier l'objet image au fichier.
     * 
     * @param {string} varName - Nom de la variable (correspond à <variable_name> dans image_object)
     * @param {string} fileName - Nom du fichier image
     * @returns {string} XML de la variable image
     */
    function generatePsmdImageVariable(varName, fileName) {
        return `<variable>
<name>${escapeXmlPsmd(varName)}</name>
<global>no</global>
<expression>"${escapeXmlPsmd(fileName)}"</expression>
<Formatting>3</Formatting>
<Locale_ID>1036</Locale_ID>
<Currency_Symbol>€</Currency_Symbol>
<Currency_DecimalSymbol>,</Currency_DecimalSymbol>
<Currency_DecimalPlaces>2</Currency_DecimalPlaces>
<Currency_DigitsInGroup>3</Currency_DigitsInGroup>
<Currency_GroupingSymbol> </Currency_GroupingSymbol>
<Currency_NegativeFormat>8</Currency_NegativeFormat>
<Currency_PositiveFormat>3</Currency_PositiveFormat>
<Number_DecimalSymbol>,</Number_DecimalSymbol>
<Number_DecimalPlaces>2</Number_DecimalPlaces>
<Number_DigitsInGroup>3</Number_DigitsInGroup>
<Number_GroupingSymbol> </Number_GroupingSymbol>
<Number_LeadingZeros>1</Number_LeadingZeros>
<Number_NegativeSymbol>-</Number_NegativeSymbol>
<Number_NegativeFormat>1</Number_NegativeFormat>
<Date_Style>dddd d MMMM yyyy</Date_Style>
</variable>`;
    }

    /**
     * Mapping des types de codes-barres Designer → PrintShop Mail.
     * @type {Object.<string, string>}
     */
    const BARCODE_TYPE_MAP = {
        'code128': 'Code128',
        'code39': 'Code39',
        'ean13': 'EAN13',
        'ean8': 'EAN8',
        'upca': 'UPCA',
        'upce': 'UPCE',
        'itf14': 'ITF14',
        'interleaved2of5': 'Interleaved2of5',
        'datamatrix': 'DataMatrix',
        'qrcode': 'QRCode'
    };

    /**
     * Mapping des alignements horizontaux Designer → PrintShop Mail.
     * @type {Object.<string, number>}
     */
    const HALIGN_MAP = {
        'left': 2,
        'center': 4,
        'right': 1,
        'justify': 6
    };

    /**
     * Mapping des alignements verticaux Designer → PrintShop Mail.
     * @type {Object.<string, number>}
     */
    const VALIGN_MAP = {
        'top': 0,
        'middle': 4,
        'bottom': 6
    };

    /**
     * Récupère la couleur CMYK pour l'export PSMD.
     * Utilise les valeurs CMJN natives si disponibles, sinon convertit depuis hex.
     * 
     * @param {string|null} hexColor - Couleur hexadécimale (#RRGGBB)
     * @param {{c: number, m: number, y: number, k: number}|null} cmykNative - Valeurs CMJN natives (0-100)
     * @param {{c: number, m: number, y: number, k: number}} [defaultCmyk] - Valeur par défaut
     * @returns {{c: number, m: number, y: number, k: number}} Couleur CMYK (0-1) pour PSMD
     */
    function getCmykForPsmd(hexColor, cmykNative, defaultCmyk = { c: 0, m: 0, y: 0, k: 0 }) {
        // Priorité aux valeurs CMJN natives
        if (cmykNative && typeof cmykNative.c === 'number') {
            // Convertir 0-100 en 0-1
            return {
                c: cmykNative.c / 100,
                m: cmykNative.m / 100,
                y: cmykNative.y / 100,
                k: cmykNative.k / 100
            };
        }
        
        // Fallback : convertir depuis hex
        if (hexColor && hexColor !== 'transparent') {
            return rgbToCmyk(hexColor);
        }
        
        return defaultCmyk;
    }

    /**
     * Génère les propriétés communes à tous les objets PSMD.
     * Gère les deux formats de données (zonesTextQuill vs autres zones).
     * 
     * @param {Object} zone - Données de la zone exportée
     * @returns {string} XML des propriétés communes
     */
    function generatePsmdObjectCommon(zone) {
        const guid = generateGuid();
        const name = escapeXmlPsmd(zone.nom || zone.id || 'Zone');
        // Export PSMD : toutes les zones sont verrouillées pour empêcher les modifications dans PrintShop Mail
        // Note : le statut de verrouillage utilisateur est conservé dans exportToWebDev() pour la communication WebDev
        const locked = 'yes';
        
        // Gérer les deux formats de géométrie
        const geom = zone.geometry || zone.geometrie || {};
        const xMm = geom.x_mm ?? geom.xMm ?? 0;
        const yMm = geom.y_mm ?? geom.yMm ?? 0;
        const widthMm = geom.width_mm ?? geom.largeur_mm ?? geom.largeurMm ?? 50;
        const heightMm = geom.height_mm ?? geom.hauteur_mm ?? geom.hauteurMm ?? 20;
        
        // Conversion coordonnées mm → points
        const left = mmToPoints(xMm);
        const top = mmToPoints(yMm);
        const right = mmToPoints(xMm + widthMm);
        const bottom = mmToPoints(yMm + heightMm);
        
        // Couleurs de fond - gérer tous les formats (textQuill, image, barcode, qr)
        let fillColor = { c: 0, m: 0, y: 0, k: 0 };
        // Alpha : 0 si transparent, null si opaque (pas d'attribut alpha pour PrintShop Mail)
        let fillAlpha = 0;
        
        // Format textQuill : zone.style.bgColor / zone.style.bgColorCmyk
        if (zone.style?.bgColor || zone.style?.bgColorCmyk) {
            if (!zone.style?.transparent) {
                fillColor = getCmykForPsmd(zone.style.bgColor, zone.style.bgColorCmyk);
                fillAlpha = null;  // Opaque
            }
        }
        // Format image : zone.fond.couleur / zone.fond.couleurCmyk
        else if (zone.fond?.couleur || zone.fond?.couleurCmyk) {
            if (!zone.fond?.transparent) {
                fillColor = getCmykForPsmd(zone.fond.couleur, zone.fond.couleurCmyk);
                fillAlpha = null;  // Opaque
            }
        }
        // Format barcode : zone.couleurFond / zone.couleurFondCmyk
        else if (zone.couleurFond || zone.couleurFondCmyk) {
            if (!zone.transparent) {
                fillColor = getCmykForPsmd(zone.couleurFond, zone.couleurFondCmyk);
                fillAlpha = null;  // Opaque
            }
        }
        // Format QR : zone.couleurs.fond / zone.couleurs.fondCmyk
        else if (zone.couleurs?.fond || zone.couleurs?.fondCmyk) {
            // QR codes n'ont pas de flag transparent explicite, on considère opaque si couleur définie
            fillColor = getCmykForPsmd(zone.couleurs.fond, zone.couleurs.fondCmyk);
            fillAlpha = null;  // Opaque
        }
        
        // Couleurs de bordure - utiliser CMJN natif si disponible
        // downgrade_k="1" par défaut requis par PrintShop Mail
        let borderColor = { c: 0, m: 0, y: 0, k: 1 };
        let borderSize = 0;
        
        if (zone.bordure?.epaisseur) {
            borderSize = zone.bordure.epaisseur;
            borderColor = getCmykForPsmd(zone.bordure.couleur, zone.bordure.couleurCmyk, { c: 0, m: 0, y: 0, k: 1 });
        } else if (zone.border?.width_px) {
            borderSize = zone.border.width_px;
            borderColor = getCmykForPsmd(zone.border.color, zone.border.colorCmyk, { c: 0, m: 0, y: 0, k: 1 });
        }
        
        const borderStyle = borderSize > 0 ? 2 : 0; // 0=none, 2=solid
        
        return `<object>
<identifier>${guid}</identifier>
<name>${name}</name>
<locked>${locked}</locked>
<knockout>no</knockout>
<border_size>${borderSize}</border_size>
<border_style>${borderStyle}</border_style>
${generatePsmdColor('fillcolor', fillColor, fillAlpha)}
${generatePsmdColor('bordercolor', borderColor)}
<rotation>0</rotation>
<bounds left="${left}" top="${top}" right="${right}" bottom="${bottom}"/>
<snap_frame_to_content>no</snap_frame_to_content>
<show_mode>
<editor>yes</editor>
<jpeg_preview>yes</jpeg_preview>
<pdf_preview>yes</pdf_preview>
<print_preview>yes</print_preview>
<print>yes</print>
</show_mode>
<anchor>
<horizontal>0</horizontal>
<vertical>0</vertical>
<source></source>
<source_bounds left="0" top="0" right="0" bottom="0"/>
</anchor>`;
    }

    /**
     * Génère un objet texte PSMD (text_object).
     * Gère le format zonesTextQuill de exportToWebDev().
     * 
     * @param {Object} zone - Données de la zone texte exportée
     * @returns {string} XML complet de l'objet texte
     */
    function generatePsmdTextObject(zone) {
        // Récupérer le RTF et l'encoder en Base64
        const rtfContent = zone.content_rtf || zone.contenu_rtf || '';
        const rtfBase64 = rtfToBase64(rtfContent);
        
        // Alignements - gérer les deux formats
        const hAlignValue = zone.style?.align || zone.typographie?.alignement || 'left';
        const vAlignValue = zone.style?.valign || zone.typographie?.alignementVertical || 'top';
        
        const hAlign = HALIGN_MAP[hAlignValue] || 2; // left par défaut
        const vAlign = VALIGN_MAP[vAlignValue] || 0; // top par défaut
        
        // Copyfitting
        const copyfitting = zone.copyfitting || {};
        const reduceToFit = (copyfitting.reduirePolice || zone.style?.copyfit) ? 'yes' : 'no';
        const minFontSize = copyfitting.tailleMin || 8;
        
        // Gestion lignes vides
        const emptyLines = zone.lignesVides || 0;
        
        // Couleur texte - utiliser CMJN natif si disponible
        const textColorHex = zone.style?.color || zone.typographie?.couleur || '#000000';
        const textColorCmyk = zone.style?.colorCmyk || zone.typographie?.couleurCmyk || null;
        const textColor = getCmykForPsmd(textColorHex, textColorCmyk, { c: 0, m: 0, y: 0, k: 1 });
        
        let xml = generatePsmdObjectCommon(zone);
        
        xml += `
<text_object>
<backwardlink>{00000000-0000-0000-0000-000000000000}</backwardlink>
<forwardlink>{00000000-0000-0000-0000-000000000000}</forwardlink>
<rtf_data>${rtfBase64}</rtf_data>
<emptylines_property>${emptyLines}</emptylines_property>
<horizontal_alignment>${hAlign}</horizontal_alignment>
<vertical_alignment>${vAlign}</vertical_alignment>
<vertical_text>no</vertical_text>
${generatePsmdColor('textcolor', textColor)}
<cmyk_output>no</cmyk_output>
<copy_fitting>
<reduce_to_fit>${reduceToFit}</reduce_to_fit>
<fontsize_minimum>${minFontSize}</fontsize_minimum>
<allow_line_breaks>yes</allow_line_breaks>
</copy_fitting>
</text_object>
</object>`;
        
        return xml;
    }

    /**
     * Convertit l'alignement horizontal Designer en valeur PrintShop.
     * 
     * @param {Object} zone - Données de la zone image
     * @returns {number} Valeur PrintShop (2=gauche, 4=centre, 6=droite)
     */
    function getImageAlignmentH(zone) {
        const alignH = zone.redimensionnement?.alignementH || 'center';
        const mapping = {
            'left': 2,
            'center': 4,
            'right': 6
        };
        return mapping[alignH] || 4;
    }

    /**
     * Convertit l'alignement vertical Designer en valeur PrintShop.
     * 
     * @param {Object} zone - Données de la zone image
     * @returns {number} Valeur PrintShop (6=haut, 4=centre, 2=bas)
     */
    function getImageAlignmentV(zone) {
        const alignV = zone.redimensionnement?.alignementV || 'middle';
        const mapping = {
            'top': 6,
            'middle': 4,
            'bottom': 2
        };
        return mapping[alignV] || 4;
    }

    /**
     * Convertit le mode de redimensionnement Designer en valeur scale PrintShop.
     * 
     * @param {Object} zone - Données de la zone image
     * @returns {number} Valeur PrintShop (1=taille initiale, 2=ajuster, 3=couper)
     */
    function getImageScaleMode(zone) {
        const mode = zone.redimensionnement?.mode || 'ajuster';
        const mapping = {
            'initial': 1,
            'ajuster': 2,
            'couper': 3
        };
        return mapping[mode] || 2;
    }

    /**
     * Génère un objet image PSMD (image_object).
     * 
     * @param {Object} zone - Données de la zone image exportée
     * @returns {string} XML complet de l'objet image
     */
    function generatePsmdImageObject(zone) {
        const name = escapeXmlPsmd(zone.nom || zone.id || 'Image');
        // Utiliser le nom exporté si disponible, sinon le nom original
        const fileName = zone.exportedFileName || zone.source?.nomOriginal || zone.source?.nomFichier || zone.source?.url || '';
        
        // Mode de redimensionnement
        const keepAspectRatio = (zone.redimensionnement?.mode === 'proportionnel' || 
                                zone.redimensionnement?.conserverRatio) ? 'yes' : 'no';
        
        let xml = generatePsmdObjectCommon(zone);
        
        xml += `
<image_object>
<scale>${getImageScaleMode(zone)}</scale>
<keep_aspect_ratio>${keepAspectRatio}</keep_aspect_ratio>
<horizontal_alignment>${getImageAlignmentH(zone)}</horizontal_alignment>
<vertical_alignment>${getImageAlignmentV(zone)}</vertical_alignment>
<variable_name>${name}</variable_name>
<default_image_folder></default_image_folder>
<default_folder></default_folder>
<subfolders>no</subfolders>
<file_name>${escapeXmlPsmd(fileName)}</file_name>
<pdf_pagenumber_expression>1</pdf_pagenumber_expression>
<global_scope>no</global_scope>
<filters>
<two_color convert="no">
<threshold>50</threshold>
${generatePsmdColorNoAlpha('backgroundcolor', { c: 0, m: 0, y: 0, k: 0 })}
${generatePsmdColorNoAlpha('foregroundcolor', { c: 0, m: 0, y: 0, k: 1 })}
</two_color>
</filters>
</image_object>
</object>`;
        
        return xml;
    }

    /**
     * Génère un objet code-barres PSMD (plugin_object).
     * 
     * @param {Object} zone - Données de la zone code-barres exportée
     * @param {string} barcodeType - Type de code-barres ('barcode' ou 'qr')
     * @returns {string} XML complet de l'objet code-barres
     */
    function generatePsmdBarcodeObject(zone, barcodeType) {
        // Déterminer le type PrintShop
        let psType;
        if (barcodeType === 'qr') {
            psType = 'QRCode';
        } else {
            // Récupérer le type depuis les données de la zone
            const designerType = zone.typeCodeBarres || zone.typeCode || 'code128';
            psType = BARCODE_TYPE_MAP[designerType.toLowerCase()] || 'Code128';
        }
        
        // Contenu du code-barres
        const data = zone.valeur || zone.contenu || '';
        
        let xml = generatePsmdObjectCommon(zone);
        
        // Modifier snap_frame_to_content pour les codes-barres
        xml = xml.replace('<snap_frame_to_content>no</snap_frame_to_content>', '<snap_frame_to_content>yes</snap_frame_to_content>');
        
        xml += `
<plugin_object title="Barcode" assembly_name="Barcode.plugins.dll" assembly_version="2.2.3.9078" class_name="Barcode" url="http://www.printshopmail.com/plugins/barcode/" url_download_version="http://www.printshopmail.com/plugins/barcode/2_2/Barcode.plugins.dll">
<property_bag><Barcode><RotationFixed>0</RotationFixed><BoundsIsRotated>False</BoundsIsRotated><Initialized>True</Initialized><Type>${psType}</Type><Data>${escapeXmlPsmd(data)}</Data><Alignment>0;0</Alignment></Barcode>
</property_bag>
</plugin_object>
</object>`;
        
        return xml;
    }

    /**
     * Génère un objet PSMD selon le type de zone.
     * Dispatch vers la fonction appropriée selon le type.
     * 
     * @param {Object} zone - Données de la zone exportée (format JSON WebDev)
     * @returns {string} XML de l'objet ou chaîne vide si type non supporté
     */
    function generatePsmdObject(zone) {
        const type = zone.type;
        
        switch (type) {
            case 'textQuill':
                return generatePsmdTextObject(zone);
            case 'image':
                return generatePsmdImageObject(zone);
            case 'barcode':
                return generatePsmdBarcodeObject(zone, 'barcode');
            case 'qr':
                return generatePsmdBarcodeObject(zone, 'qr');
            default:
                console.warn(`Type de zone non supporté pour export PSMD: ${type}`);
                return '';
        }
    }

    /**
     * Extrait tous les champs de fusion et génère la section <variables>.
     * Parcourt les zonesTextQuill pour extraire les marqueurs @XXX@.
     * 
     * @param {Object} jsonData - Données complètes de exportToWebDev()
     * @param {string|null} exportPrefix - Préfixe pour les noms de fichiers exportés (ex: "vdp_20251224_112005")
     * @returns {string} XML de la section <variables>
     * 
     * @example
     * const jsonData = { zonesTextQuill: [{ content_rtf: '@NOM@ @PRENOM@' }] };
     * generatePsmdVariables(jsonData, "vdp_20251224_112005");
     * // Retourne <variables> avec NOM, PRENOM et variables d'images
     */
    function generatePsmdVariables(jsonData, exportPrefix = null) {
        const allFields = new Set();
        
        // Parcourir les zones textQuill pour les champs de fusion
        const zonesTextQuill = jsonData.zonesTextQuill || [];
        for (const zone of zonesTextQuill) {
            if (zone.content_rtf) {
                const fields = extractMergeFields(zone.content_rtf);
                fields.forEach(field => allFields.add(field));
            }
        }
        
        // Collecter les variables d'images
        const imageVariables = [];
        const zonesImage = jsonData.zonesImage || [];
        for (const zone of zonesImage) {
            const varName = zone.nom || zone.id || 'Image';
            
            // Générer le nom de fichier exporté si prefix fourni et image base64 présente
            let fileName = '';
            if (exportPrefix && zone.source?.imageBase64) {
                const ext = getExtensionFromBase64(zone.source.imageBase64);
                fileName = `${exportPrefix}_${zone.id}.${ext}`;
            } else {
                // Fallback sur le nom original si pas de base64 ou pas de prefix
                fileName = zone.source?.nomOriginal || zone.source?.nomFichier || zone.source?.url || '';
            }
            
            if (fileName) {
                imageVariables.push({ varName, fileName });
            }
        }
        
        // Générer la section variables
        if (allFields.size === 0 && imageVariables.length === 0) {
            return '<variables>\n</variables>';
        }
        
        let xml = '<variables>\n';
        
        // Variables de champs de fusion
        for (const field of allFields) {
            xml += generatePsmdVariable(field) + '\n';
        }
        
        // Variables d'images
        for (const imgVar of imageVariables) {
            xml += generatePsmdImageVariable(imgVar.varName, imgVar.fileName) + '\n';
        }
        
        xml += '</variables>';
        
        return xml;
    }

    /**
     * Génère une section <layout> (page) complète pour le PSMD.
     * 
     * @param {Object} page - Données de la page avec zones regroupées
     * @param {number} pageIndex - Index de la page (0-based)
     * @param {number} pageWidthPt - Largeur de la page en points
     * @param {number} pageHeightPt - Hauteur de la page en points
     * @param {string} devmodeBase64 - DEVMODE encodé en Base64
     * @returns {string} XML de la section layout
     */
    function generatePsmdLayout(page, pageIndex, pageWidthPt, pageHeightPt, devmodeBase64) {
        const layoutName = page.name || `Page ${pageIndex + 1}`;
        
        let xml = `<layout>
<dimensions>
<size x="${pageWidthPt}" y="${pageHeightPt}"/>
<automatic_size>yes</automatic_size>
<custom_size>no</custom_size>
<fit_to_objects>no</fit_to_objects>
</dimensions>
<attributes>
<n>${escapeXmlPsmd(layoutName)}</n>
<condition_expression>Print</condition_expression>
<copies_expression>1</copies_expression>
</attributes>
<printer_preferences>
<windows_devmode>${devmodeBase64}</windows_devmode>
<tray_name> Sélection automatique</tray_name>
</printer_preferences>
`;
        
        // Générer les objets (zones) de la page
        if (page.zones && page.zones.length > 0) {
            for (const zone of page.zones) {
                const objectXml = generatePsmdObject(zone);
                if (objectXml) {
                    xml += objectXml + '\n';
                }
            }
        }
        
        xml += '</layout>';
        
        return xml;
    }

    /**
     * Génère la section <layouts> complète avec toutes les pages.
     * Regroupe les zones par page depuis les tableaux séparés de exportToWebDev().
     * 
     * @param {Object} jsonData - Données complètes de exportToWebDev()
     * @param {number} largeurMm - Largeur du document en mm
     * @param {number} hauteurMm - Hauteur du document en mm
     * @param {string|null} exportPrefix - Préfixe pour les noms de fichiers exportés (optionnel)
     * @returns {string} XML de la section layouts
     */
    function generatePsmdLayouts(jsonData, largeurMm, hauteurMm, exportPrefix = null) {
        // Convertir dimensions en points
        const pageWidthPt = mmToPoints(largeurMm);
        const pageHeightPt = mmToPoints(hauteurMm);
        
        // Déterminer l'orientation
        const orientation = largeurMm > hauteurMm ? 'PAYSAGE' : 'PORTRAIT';
        
        // Générer le DEVMODE
        const devmodeBase64 = generateWindowsDevmode(orientation, hauteurMm, largeurMm);
        
        // Regrouper les zones par page
        const zonesByPage = {};
        
        // Initialiser les pages
        const pages = jsonData.pages || [];
        pages.forEach((page, index) => {
            const pageNum = index + 1;
            zonesByPage[pageNum] = [];
        });
        
        // Si aucune page, créer une page par défaut
        if (pages.length === 0) {
            zonesByPage[1] = [];
        }
        
        // Ajouter les zones textQuill
        (jsonData.zonesTextQuill || []).forEach(zone => {
            const pageNum = zone.page || 1;
            if (!zonesByPage[pageNum]) zonesByPage[pageNum] = [];
            zonesByPage[pageNum].push({ ...zone, type: 'textQuill', zIndex: zone.niveau || zone.zIndex || 1 });
        });
        
        // Ajouter les zones code-barres (barcode)
        (jsonData.zonesCodeBarres || []).forEach(zone => {
            const pageNum = zone.page || 1;
            if (!zonesByPage[pageNum]) zonesByPage[pageNum] = [];
            zonesByPage[pageNum].push({ ...zone, type: 'barcode', zIndex: zone.niveau || zone.zIndex || 1 });
        });
        
        // Ajouter les zones QR
        (jsonData.zonesQR || []).forEach(zone => {
            const pageNum = zone.page || 1;
            if (!zonesByPage[pageNum]) zonesByPage[pageNum] = [];
            zonesByPage[pageNum].push({ ...zone, type: 'qr', zIndex: zone.niveau || zone.zIndex || 1 });
        });
        
        // Ajouter les zones image
        (jsonData.zonesImage || []).forEach(zone => {
            const pageNum = zone.page || 1;
            if (!zonesByPage[pageNum]) zonesByPage[pageNum] = [];
            
            // Générer le nom de fichier exporté si prefix fourni et image base64 présente
            let exportedFileName = zone.source?.nomOriginal || '';
            if (exportPrefix && zone.source?.imageBase64) {
                const ext = getExtensionFromBase64(zone.source.imageBase64);
                exportedFileName = `${exportPrefix}_${zone.id}.${ext}`;
            }
            
            zonesByPage[pageNum].push({ 
                ...zone, 
                type: 'image', 
                zIndex: zone.niveau || zone.zIndex || 1,
                exportedFileName: exportedFileName
            });
        });
        
        // Générer le XML
        let xml = '<layouts>\n';
        
        const pageNumbers = Object.keys(zonesByPage).map(Number).sort((a, b) => a - b);
        
        for (const pageNum of pageNumbers) {
            // Trier les zones par z-index croissant (premier = arrière-plan, dernier = premier plan)
            const sortedZones = zonesByPage[pageNum].sort((a, b) => {
                const zIndexA = a.niveau || a.zIndex || 1;
                const zIndexB = b.niveau || b.zIndex || 1;
                return zIndexA - zIndexB;
            });
            
            const pageData = {
                zones: sortedZones,
                name: pages[pageNum - 1]?.name || `Page ${pageNum}`
            };
            xml += generatePsmdLayout(pageData, pageNum - 1, pageWidthPt, pageHeightPt, devmodeBase64) + '\n';
        }
        
        xml += '</layouts>';
        
        return xml;
    }

    /**
     * Génère un préfixe unique basé sur la date et l'heure.
     * Format : vdp_YYYYMMDD_HHmmss
     * 
     * @returns {string} Préfixe unique pour le document
     * 
     * @example
     * generateExportPrefix(); // "vdp_20251224_103045"
     */
    function generateExportPrefix() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `vdp_${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    /**
     * Extrait l'extension de fichier depuis un data URL base64.
     * 
     * @param {string} base64 - Data URL (ex: "data:image/jpeg;base64,...")
     * @returns {string} Extension de fichier (jpg, png, webp, svg)
     * 
     * @example
     * getExtensionFromBase64("data:image/jpeg;base64,..."); // "jpg"
     * getExtensionFromBase64("data:image/png;base64,..."); // "png"
     */
    function getExtensionFromBase64(base64) {
        if (!base64 || typeof base64 !== 'string') return 'jpg';
        
        const match = base64.match(/^data:image\/(\w+);/);
        if (!match) return 'jpg';
        
        const mimeType = match[1].toLowerCase();
        
        // Mapping MIME → extension
        const extensions = {
            'jpeg': 'jpg',
            'jpg': 'jpg',
            'png': 'png',
            'webp': 'webp',
            'svg+xml': 'svg',
            'svg': 'svg'
        };
        
        return extensions[mimeType] || 'jpg';
    }

    /**
     * Télécharge une image depuis un data URL base64.
     * 
     * @param {string} base64 - Data URL de l'image
     * @param {string} fileName - Nom du fichier à télécharger
     * 
     * @example
     * downloadImageFromBase64("data:image/jpeg;base64,...", "vdp_20251224_103045_zone-1.jpg");
     */
    function downloadImageFromBase64(base64, fileName) {
        if (!base64 || !fileName) return;
        
        // Convertir base64 en Blob
        const byteString = atob(base64.split(',')[1]);
        const mimeType = base64.match(/^data:([^;]+);/)?.[1] || 'image/jpeg';
        
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeType });
        
        // Télécharger
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📥 Image exportée : ${fileName}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VÉRIFICATION PRÉ-EXPORT (CHECK)
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Vérifie l'intégrité de toutes les zones du document avant export.
     * Contrôle les zones image, barcode et textQuill.
     * 
     * @returns {{success: boolean, errors: Array<{page: string, zoneId: string, zoneName: string, message: string}>}}
     */
    function checkDocumentIntegrity() {
        console.log('🔍 checkDocumentIntegrity() - Vérification du document');
        
        const errors = [];
        
        // Récupérer les champs disponibles (objets avec propriété 'nom')
        const availableFields = (documentState && documentState.champsFusion) || mergeFields || [];
        const availableFieldsUpper = availableFields.map(f => {
            // Gérer les deux formats : objet {nom: "..."} ou chaîne simple
            const fieldName = (typeof f === 'string') ? f : (f.nom || '');
            return fieldName.toUpperCase();
        });
        
        // Parcourir toutes les pages
        documentState.pages.forEach((page, pageIndex) => {
            const pageName = page.name || `Page ${pageIndex + 1}`;
            const zones = page.zones || {};
            
            Object.entries(zones).forEach(([zoneId, zoneData]) => {
                const zoneName = zoneData.nom || zoneId;
                
                // ═══════════════════════════════════════════════════════════════
                // VÉRIFICATION ZONE IMAGE
                // ═══════════════════════════════════════════════════════════════
                if (zoneData.type === 'image') {
                    const source = zoneData.source || {};
                    
                    // Source fixe : vérifier présence d'une image
                    if (source.type === 'fixe' || source.type === 'url') {
                        const hasImage = source.imageBase64 || (source.valeur && source.valeur.trim() !== '');
                        if (!hasImage) {
                            errors.push({
                                page: pageName,
                                zoneId: zoneId,
                                zoneName: zoneName,
                                type: 'image',
                                message: 'Aucune image sélectionnée (source fixe)'
                            });
                        }
                    }
                    
                    // Source champ : vérifier qu'un champ est sélectionné
                    if (source.type === 'champ') {
                        const hasField = source.valeur && source.valeur.trim() !== '';
                        if (!hasField) {
                            errors.push({
                                page: pageName,
                                zoneId: zoneId,
                                zoneName: zoneName,
                                type: 'image',
                                message: 'Aucun champ de fusion sélectionné'
                            });
                        }
                    }
                }
                
                // ═══════════════════════════════════════════════════════════════
                // VÉRIFICATION ZONE BARCODE
                // ═══════════════════════════════════════════════════════════════
                if (zoneData.type === 'barcode') {
                    const champFusion = zoneData.champFusion || '';
                    const hasChampFusion = champFusion.trim() !== '';
                    
                    // Source champ : vérifier qu'un champ est sélectionné
                    if (hasChampFusion) {
                        // OK - un champ est sélectionné
                    } else {
                        // Source fixe : vérifier qu'une valeur est saisie
                        const valeurStatique = zoneData.valeurStatique || '';
                        if (valeurStatique.trim() === '') {
                            errors.push({
                                page: pageName,
                                zoneId: zoneId,
                                zoneName: zoneName,
                                type: 'barcode',
                                message: 'Aucune valeur saisie (source fixe) et aucun champ sélectionné'
                            });
                        }
                    }
                }
                
                // ═══════════════════════════════════════════════════════════════
                // VÉRIFICATION ZONE TEXTQUILL
                // ═══════════════════════════════════════════════════════════════
                if (zoneData.type === 'textQuill') {
                    const delta = zoneData.quillDelta;
                    if (delta && delta.ops) {
                        // Extraire le texte complet du delta
                        let fullText = '';
                        delta.ops.forEach(op => {
                            if (typeof op.insert === 'string') {
                                fullText += op.insert;
                            }
                        });
                        
                        // Chercher tous les @CHAMP@ dans le texte
                        const regex = /@([A-Za-z0-9_]+)@/g;
                        let match;
                        while ((match = regex.exec(fullText)) !== null) {
                            const fieldName = match[1];
                            const fieldNameUpper = fieldName.toUpperCase();
                            
                            // Vérifier si le champ existe dans les champs disponibles
                            if (!availableFieldsUpper.includes(fieldNameUpper)) {
                                errors.push({
                                    page: pageName,
                                    zoneId: zoneId,
                                    zoneName: zoneName,
                                    type: 'textQuill',
                                    message: `Champ inconnu : @${fieldName}@`
                                });
                            }
                        }
                    }
                }
            });
        });
        
        console.log(`🔍 Vérification terminée : ${errors.length} erreur(s) trouvée(s)`);
        
        return {
            success: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Affiche le résultat de la vérification.
     * - Succès : toast discret (pas d'interruption)
     * - Erreurs : modale élégante avec liste des problèmes
     * 
     * @param {{success: boolean, errors: Array<{page: string, zoneId: string, zoneName: string, message: string}>}} result
     * @returns {void}
     */
    function showCheckResult(result) {
        if (result.success) {
            // Succès : toast discret (ne bloque pas l'export)
            showUndoRedoToast('✅ Document OK - Prêt pour l\'export', 'success', 'check_circle');
        } else {
            // Erreurs : afficher la modale
            showCheckErrorsModal(result.errors);
        }
    }

    /**
     * Affiche la modale avec la liste des erreurs de vérification.
     * 
     * @param {Array<{page: string, zoneId: string, zoneName: string, message: string}>} errors
     * @returns {void}
     */
    function showCheckErrorsModal(errors) {
        if (!checkModal || !checkModalSummary || !checkModalErrors) {
            // Fallback si la modale n'existe pas
            console.warn('⚠️ Modale Check non trouvée, fallback alert()');
            let msg = `${errors.length} problème(s) détecté(s) :\n\n`;
            errors.forEach((e, i) => {
                msg += `${i + 1}. [${e.page}] ${e.zoneName}\n   → ${e.message}\n\n`;
            });
            alert(msg);
            return;
        }
        
        // Mettre à jour le résumé
        checkModalSummary.textContent = `${errors.length} problème(s) détecté(s) :`;
        
        // Vider et remplir la liste d'erreurs
        checkModalErrors.innerHTML = '';
        
        errors.forEach(error => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="check-error-location">[${error.page}] ${error.zoneName}</span>
                <span class="check-error-message">→ ${error.message}</span>
            `;
            checkModalErrors.appendChild(li);
        });
        
        // Afficher la modale
        checkModal.classList.remove('hidden');
    }

    /**
     * Ferme la modale de vérification Check.
     * @returns {void}
     */
    function hideCheckModal() {
        if (checkModal) {
            checkModal.classList.add('hidden');
        }
    }

    /**
     * Exporte le document courant au format .psmd (PrintShop Mail XML).
     * Génère un fichier XML complet et déclenche son téléchargement.
     * Exporte également les images avec des noms uniques liés au document.
     * 
     * Utilise exportToWebDev() pour récupérer les données structurées,
     * puis convertit chaque élément au format PrintShop Mail.
     * 
     * @returns {string} Contenu XML du fichier PSMD
     * 
     * @example
     * // Déclenché par le bouton "Export PSMD"
     * exportToPsmd();
     */
    function exportToPsmd() {
        console.log('=== exportToPsmd() : Début de l\'export PSMD ===');
        
        // 1. Récupérer les données via exportToWebDev()
        const jsonData = exportToWebDev();
        
        if (!jsonData) {
            console.error('exportToPsmd: Aucune donnée à exporter');
            alert('Erreur : Aucune donnée à exporter');
            return '';
        }
        
        // 2. Générer le préfixe unique pour ce export
        const exportPrefix = generateExportPrefix();
        console.log(`exportToPsmd: Préfixe d'export : ${exportPrefix}`);
        
        // Compter les zones
        const nbZones = (jsonData.zonesTextQuill?.length || 0) + 
                        (jsonData.zonesCodeBarres?.length || 0) + 
                        (jsonData.zonesImage?.length || 0);
        
        console.log(`exportToPsmd: ${jsonData.pages?.length || 1} page(s), ${nbZones} zone(s) à exporter`);
        
        // 3. Récupérer les dimensions du document
        const largeurMm = jsonData.formatDocument?.largeurMm || 210;
        const hauteurMm = jsonData.formatDocument?.hauteurMm || 297;
        
        console.log(`exportToPsmd: Format ${largeurMm}mm x ${hauteurMm}mm`);
        
        // 4. Collecter les images à exporter AVANT génération XML
        const imagesToExport = [];
        (jsonData.zonesImage || []).forEach(zone => {
            if (zone.source?.imageBase64) {
                const ext = getExtensionFromBase64(zone.source.imageBase64);
                const fileName = `${exportPrefix}_${zone.id}.${ext}`;
                imagesToExport.push({
                    base64: zone.source.imageBase64,
                    fileName: fileName,
                    zoneId: zone.id
                });
            }
        });
        
        console.log(`exportToPsmd: ${imagesToExport.length} image(s) à exporter`);
        
        // 5. Construire le XML (passer le préfixe pour nommer les images)
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.printshopmail.com/support/xml/schemas/win/version-7_1_0/printshopmail7.xsd">\n';
        
        // Sections statiques
        xml += generatePsmdInfo() + '\n';
        xml += generatePsmdPrinter() + '\n';
        xml += '<operator_instructions></operator_instructions>\n';
        xml += generatePsmdPreferences() + '\n';
        xml += generatePsmdDatabaseSettings() + '\n';
        
        // Section layouts (pages avec zones) - PASSER jsonData complet ET le préfixe
        xml += generatePsmdLayouts(jsonData, largeurMm, hauteurMm, exportPrefix) + '\n';
        
        // Section variables (champs de fusion) - PASSER jsonData complet ET le préfixe
        xml += generatePsmdVariables(jsonData, exportPrefix) + '\n';
        
        // Sections finales
        xml += generatePsmdFooterSections() + '\n';
        
        xml += '</document>';
        
        console.log('=== exportToPsmd() : XML généré ===');
        console.log(`exportToPsmd: Taille du fichier: ${xml.length} caractères`);
        
        // 6. Télécharger le fichier PSMD
        const psmdFileName = `${exportPrefix}.psmd`;
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = psmdFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📥 Document exporté : ${psmdFileName}`);
        
        // 7. Télécharger les images (avec un léger délai entre chaque)
        if (imagesToExport.length > 0) {
            console.log('=== exportToPsmd() : Export des images ===');
            
            imagesToExport.forEach((img, index) => {
                // Délai de 200ms entre chaque téléchargement pour éviter les blocages navigateur
                setTimeout(() => {
                    downloadImageFromBase64(img.base64, img.fileName);
                }, (index + 1) * 200);
            });
        }
        
        console.log('=== exportToPsmd() : Téléchargement(s) déclenché(s) ===');
        
        return xml;
    }

    // Exposer les fonctions utilitaires PSMD sur window pour les tests et l'accès externe
    window.mmToPoints = mmToPoints;
    window.rgbToCmyk = rgbToCmyk;
    window.rtfToBase64 = rtfToBase64;
    window.extractMergeFields = extractMergeFields;
    window.generateGuid = generateGuid;
    window.formatIsoDateTime = formatIsoDateTime;
    window.escapeXmlPsmd = escapeXmlPsmd;
    window.toHexLE16 = toHexLE16;
    window.hexToBase64 = hexToBase64;
    window.generateWindowsDevmode = generateWindowsDevmode;
    window.generatePsmdInfo = generatePsmdInfo;
    window.generatePsmdPrinter = generatePsmdPrinter;
    window.generatePsmdPreferences = generatePsmdPreferences;
    window.generatePsmdDatabaseSettings = generatePsmdDatabaseSettings;
    window.generatePsmdFooterSections = generatePsmdFooterSections;
    window.generatePsmdColor = generatePsmdColor;
    window.generatePsmdVariable = generatePsmdVariable;
    window.generatePsmdObjectCommon = generatePsmdObjectCommon;
    window.generatePsmdTextObject = generatePsmdTextObject;
    window.generatePsmdImageObject = generatePsmdImageObject;
    window.generatePsmdBarcodeObject = generatePsmdBarcodeObject;
    window.generatePsmdObject = generatePsmdObject;
    window.generatePsmdVariables = generatePsmdVariables;
    window.generatePsmdLayout = generatePsmdLayout;
    window.generatePsmdLayouts = generatePsmdLayouts;
    window.exportToPsmd = exportToPsmd;

    // ─────────────────────────────── FIN SECTION 25 ───────────────────────────────
    
    console.log('🔧 PHASE 0 - Vérification infrastructure Quill:');
    console.log('  ✓ Quill disponible:', typeof Quill === 'function');
    console.log('  ✓ quillInstances Map créée:', quillInstances instanceof Map);
    console.log('  ✓ Constantes QUILL_*:', { QUILL_DEFAULT_FONT, QUILL_DEFAULT_SIZE, QUILL_DEFAULT_COLOR, QUILL_DEFAULT_LINE_HEIGHT });

});
