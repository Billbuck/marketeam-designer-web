/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                      MARKETEAM DESIGNER - PSMD GENERATOR                     ║
 * ║               Générateur de fichiers PrintShop Mail (.psmd)                  ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  Ce module génère des fichiers PSMD (PrintShop Mail XML) à partir d'un      ║
 * ║  JSON structuré. Il est conçu pour fonctionner SANS dépendance au DOM,      ║
 * ║  permettant son utilisation :                                                ║
 * ║    - Dans le Designer (via script.js) pour l'export PSMD                    ║
 * ║    - Dans WebDev (hors iframe) pour génération côté serveur                 ║
 * ║                                                                              ║
 * ║  TABLE DES MATIÈRES                                                          ║
 * ║  ─────────────────                                                           ║
 * ║                                                                              ║
 * ║  SECTION 1 : TYPES ET CONSTANTES ........................... ligne ~50      ║
 * ║  SECTION 2 : UTILITAIRES DE CONVERSION ..................... ligne ~130     ║
 * ║  SECTION 3 : UTILITAIRES D'ENCODAGE ........................ ligne ~240     ║
 * ║  SECTION 4 : GÉNÉRATION DE MÉTADONNÉES ..................... ligne ~350     ║
 * ║  SECTION 5 : TEMPLATES XML STATIQUES ....................... ligne ~480     ║
 * ║  SECTION 6 : GÉNÉRATION DE COULEURS ........................ ligne ~680     ║
 * ║  SECTION 7 : GÉNÉRATION DE VARIABLES ....................... ligne ~730     ║
 * ║  SECTION 8 : GÉNÉRATION D'OBJETS ZONES ..................... ligne ~820     ║
 * ║  SECTION 9 : ORCHESTRATION ET EXPORT ....................... ligne ~1100    ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Version : 1.0.0                                                             ║
 * ║  Dernière modification : 27/12/2024                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

(function(global) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 1 : TYPES ET CONSTANTES
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * @typedef {Object} PsmdGeometry
     * @property {number} [x_mm] - Position X en mm (format WebDev)
     * @property {number} [y_mm] - Position Y en mm (format WebDev)
     * @property {number} [xMm] - Position X en mm (format alternatif)
     * @property {number} [yMm] - Position Y en mm (format alternatif)
     * @property {number} [width_mm] - Largeur en mm (format WebDev)
     * @property {number} [height_mm] - Hauteur en mm (format WebDev)
     * @property {number} [largeur_mm] - Largeur en mm (format alternatif)
     * @property {number} [hauteur_mm] - Hauteur en mm (format alternatif)
     * @property {number} [largeurMm] - Largeur en mm (format alternatif)
     * @property {number} [hauteurMm] - Hauteur en mm (format alternatif)
     */

    /**
     * @typedef {Object} PsmdCmyk
     * @property {number} c - Cyan (0-100 pour WebDev, 0-1 pour PSMD)
     * @property {number} m - Magenta (0-100 pour WebDev, 0-1 pour PSMD)
     * @property {number} y - Yellow/Jaune (0-100 pour WebDev, 0-1 pour PSMD)
     * @property {number} k - Black/Noir (0-100 pour WebDev, 0-1 pour PSMD)
     */

    /**
     * @typedef {Object} PsmdFondPerdu
     * @property {boolean} actif - Fond perdu activé
     * @property {number} [hautMm] - Fond perdu en haut en mm
     * @property {number} [basMm] - Fond perdu en bas en mm
     * @property {number} [gaucheMm] - Fond perdu à gauche en mm
     * @property {number} [droiteMm] - Fond perdu à droite en mm
     * @property {number} [valeurMm] - Ancien format : valeur unique (rétrocompatibilité)
     */

    /**
     * @typedef {Object} PsmdFormatDocument
     * @property {number} largeurMm - Largeur du document en mm
     * @property {number} hauteurMm - Hauteur du document en mm
     * @property {string} [orientation] - 'PORTRAIT' ou 'PAYSAGE'
     * @property {PsmdFondPerdu} [fondPerdu] - Configuration du fond perdu (4 côtés indépendants)
     */

    /**
     * @typedef {Object} PsmdPage
     * @property {number} numero - Numéro de la page (1-based)
     * @property {string} [nom] - Nom de la page
     * @property {string} [name] - Nom de la page (alias)
     * @property {string} [cheminFond] - Chemin physique complet du fichier PDF de fond
     *     (ex: "D:\\Marketeam\\Upload\\ltr-tmp-abc123.pdf").
     *     Si présent, un objet image PrintShop Mail est généré en première position
     *     dans le layout, avec une variable "Image N" correspondante dans <variables>.
     *     La page N correspond à pdf_pagenumber_expression = pageIndex + 1.
     */

    /**
     * @typedef {Object} PsmdZoneTextQuill
     * @property {string} id - Identifiant unique de la zone
     * @property {string} [nom] - Nom de la zone
     * @property {number} [page] - Numéro de page (1-based)
     * @property {number} [niveau] - Z-index
     * @property {PsmdGeometry} [geometrie] - Géométrie de la zone (V3.3)
     * @property {string} [contenuRtf] - Contenu RTF (V3.3)
     * @property {Object} [style] - Styles V3.3 (alignementH, alignementV, couleurCmjn)
     * @property {Object} [copyfitting] - Options de copyfitting V3.3 (actif, tailleMinimum)
     */

    /**
     * @typedef {Object} PsmdZoneImage
     * @property {string} id - Identifiant unique de la zone
     * @property {string} [nom] - Nom de la zone
     * @property {number} [page] - Numéro de page (1-based)
     * @property {number} [niveau] - Z-index
     * @property {PsmdGeometry} [geometrie] - Géométrie de la zone
     * @property {Object} [source] - Source de l'image
     * @property {'fixe'|'champ'|'url'} [source.type] - Type de source
     * @property {string} [source.imageBase64] - Image en base64 (fixe)
     * @property {string} [source.nomOriginal] - Nom original du fichier (fixe)
     * @property {string} [source.valeur] - Nom du champ de fusion (champ)
     * @property {string} [source.cheminUNC] - Chemin UNC vers la collection (champ)
     * @property {number|string} [source.collectionId] - ID collection serveur (champ)
     * @property {Object} [redimensionnement] - Options de redimensionnement
     * @property {Object} [fond] - Couleur de fond
     */

    /**
     * @typedef {Object} PsmdZoneBarcode
     * @property {string} id - Identifiant unique de la zone
     * @property {string} [nom] - Nom de la zone
     * @property {number} [page] - Numéro de page (1-based)
     * @property {number} [niveau] - Z-index
     * @property {PsmdGeometry} [geometrie] - Géométrie de la zone
     * @property {string} [typeCodeBarres] - Type de code-barres
     * @property {string} [valeur] - Valeur du code-barres
     */

    /**
     * Structure JSON d'entrée pour la génération PSMD.
     * Correspond au format de sortie de exportToWebDev().
     * 
     * @typedef {Object} PsmdInput
     * @property {PsmdFormatDocument} formatDocument - Format du document
     * @property {PsmdPage[]} pages - Liste des pages
     * @property {PsmdZoneTextQuill[]} zonesTexte - Zones texte (V3.3 format français)
     * @property {PsmdZoneImage[]} zonesImage - Zones image
     * @property {PsmdZoneBarcode[]} zonesCodeBarres - Zones code-barres
     * @property {PsmdZoneBarcode[]} zonesQR - Zones QR codes
     */

    /**
     * Structure d'une image à exporter avec le PSMD.
     * 
     * @typedef {Object} PsmdImageExport
     * @property {string} base64 - Image encodée en base64 (data URL)
     * @property {string} fileName - Nom du fichier à utiliser
     * @property {string} [zoneId] - ID de la zone source
     */

    /**
     * Structure de sortie de la génération PSMD.
     * 
     * @typedef {Object} PsmdOutput
     * @property {string} xml - Contenu XML du fichier PSMD
     * @property {string} fileName - Nom du fichier PSMD (avec extension)
     * @property {PsmdImageExport[]} images - Images à exporter
     */

    /**
     * Options de génération PSMD.
     * 
     * @typedef {Object} PsmdGeneratorOptions
     * @property {string} [prefix] - Préfixe personnalisé pour les noms de fichiers
     */

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
     * Mapping des champs vCard Designer → PrintShop Mail.
     * Clé = id champ Designer, Valeur = nom balise PrintShop Mail
     * @type {Object.<string, string>}
     */
    const VCARD_FIELD_MAP = {
        'nom': 'LastName',
        'prenom': 'FirstName',
        'societe': 'Organization',
        'fonction': 'JobTitle',
        'adresse1': 'StreetAddress',
        'adresse2': 'ExtendedAddress',
        'codePostal': 'Zip',
        'ville': 'City',
        'pays': 'Country',
        'tel': 'PhoneWork',
        'mobile': 'MobileWork',
        'email': 'EmailWork',
        'siteweb': 'UrlWork'
    };

    /**
     * Liste ordonnée des champs vCard pour l'export PSMD.
     * L'ordre correspond à celui attendu par PrintShop Mail.
     * @type {string[]}
     */
    const VCARD_FIELD_ORDER = [
        'FirstName', 'LastName', 'JobTitle', 'Organization',
        'StreetAddress', 'ExtendedAddress', 'PoBox', 'City', 'Region', 'Zip', 'Country',
        'PhoneWork', 'FaxWork', 'MobileWork', 'UrlWork', 'EmailWork', 'AdditionalTags'
    ];

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

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 2 : UTILITAIRES DE CONVERSION
    // ═══════════════════════════════════════════════════════════════════════════════

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
     * @returns {PsmdCmyk} Valeurs CMYK entre 0 et 1
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
     * Récupère la couleur CMYK pour l'export PSMD.
     * Utilise les valeurs CMJN natives si disponibles, sinon convertit depuis hex.
     * 
     * @param {string|null} hexColor - Couleur hexadécimale (#RRGGBB)
     * @param {PsmdCmyk|null} cmykNative - Valeurs CMJN natives (0-100)
     * @param {PsmdCmyk} [defaultCmyk] - Valeur par défaut
     * @returns {PsmdCmyk} Couleur CMYK (0-1) pour PSMD
     */
    function getCmykForPsmd(hexColor, cmykNative, defaultCmyk) {
        defaultCmyk = defaultCmyk || { c: 0, m: 0, y: 0, k: 0 };
        
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 3 : UTILITAIRES D'ENCODAGE
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Encode une chaîne RTF en Base64 pour PrintShop Mail.
     * Compatible navigateur (btoa) et Node.js (Buffer).
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
            // Environnement navigateur
            if (typeof btoa === 'function') {
                return btoa(unescape(encodeURIComponent(rtfString)));
            }
            // Environnement Node.js
            if (typeof Buffer !== 'undefined') {
                return Buffer.from(rtfString, 'utf-8').toString('base64');
            }
            return '';
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
        
        const regex = /@([A-Za-z0-9_ ]+)@/g;
        const fields = new Set();
        let match;
        
        while ((match = regex.exec(rtfString)) !== null) {
            fields.add(match[1]); // Ajoute le nom sans les @
        }
        
        return Array.from(fields);
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
     * Échappe les caractères XML dans le property_bag en préservant les guillemets.
     * Les guillemets font partie de la syntaxe PrintShop Mail et ne doivent pas être échappés.
     * 
     * @param {string} str - Chaîne à échapper
     * @returns {string} Chaîne échappée (sans échapper les guillemets)
     */
    function escapePropertyBag(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // Note: on ne remplace PAS " ni ' car ils font partie du format PrintShop Mail
    }

    /**
     * Convertit une valeur de champ QR vers le format expression PrintShop Mail.
     * Génère une expression de concaténation avec & pour les valeurs mixtes.
     * 
     * - Valeur vide → chaîne vide
     * - Variable pure @CHAMP@ → [CHAMP]
     * - Valeur fixe pure → "valeur"
     * - Mixte (texte + variables) → "texte"&[CHAMP]&"suite"
     * 
     * @param {string} value - Valeur du champ (peut contenir @CHAMP@ ou texte fixe)
     * @returns {string} Expression formatée pour PrintShop Mail
     * 
     * @example
     * convertQrFieldToPsm('');                          // → ''
     * convertQrFieldToPsm('@NOM@');                     // → '[NOM]'
     * convertQrFieldToPsm('Directeur');                 // → '"Directeur"'
     * convertQrFieldToPsm('Bonjour @NOM@');             // → '"Bonjour "&[NOM]'
     * convertQrFieldToPsm('@PRENOM@ @NOM@');            // → '[PRENOM]&" "&[NOM]'
     * convertQrFieldToPsm('Cher @CIVILITE@ @NOM@,');    // → '"Cher "&[CIVILITE]&" "&[NOM]&","'
     * convertQrFieldToPsm('https://site.com/@ID@');     // → '"https://site.com/"&[ID]'
     */
    function convertQrFieldToPsm(value) {
        if (!value || value.trim() === '') {
            return '';
        }
        
        // Cas 1 : Variable pure (uniquement @CHAMP@)
        var pureVarMatch = value.match(/^@([^@]+)@$/);
        if (pureVarMatch) {
            return '[' + pureVarMatch[1] + ']';
        }
        
        // Cas 2 : Pas de variable → valeur fixe pure
        if (!value.includes('@') || !/@[^@]+@/.test(value)) {
            return '"' + value + '"';
        }
        
        // Cas 3 : Mixte (texte + variables) → construire expression concaténée
        var parts = [];
        var varPattern = /@([^@]+)@/g;
        var lastIndex = 0;
        var match;
        
        while ((match = varPattern.exec(value)) !== null) {
            // Ajouter le texte avant la variable (si non vide)
            var textBefore = value.substring(lastIndex, match.index);
            if (textBefore.length > 0) {
                parts.push('"' + textBefore + '"');
            }
            
            // Ajouter la variable
            parts.push('[' + match[1] + ']');
            
            lastIndex = varPattern.lastIndex;
        }
        
        // Ajouter le texte après la dernière variable (si non vide)
        var textAfter = value.substring(lastIndex);
        if (textAfter.length > 0) {
            parts.push('"' + textAfter + '"');
        }
        
        // Joindre avec &
        return parts.join('&');
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
     * Compatible navigateur (btoa) et Node.js (Buffer).
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
        
        // Environnement navigateur
        if (typeof btoa === 'function') {
            const binary = String.fromCharCode.apply(null, bytes);
            return btoa(binary);
        }
        
        // Environnement Node.js
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(bytes).toString('base64');
        }
        
        return '';
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 4 : GÉNÉRATION DE MÉTADONNÉES
    // ═══════════════════════════════════════════════════════════════════════════════

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
            '000000000001040006DC009C0353EF80' + hexOrientation + '00FF' + hexHauteur + hexLargeur + 
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
            '0000000000000000000000001000000000000000000000000000000C8000000534D544A00' +
            '0000001000B8005000720069006E007400530068006F00700020004D00610069006C00200050' +
            '00720069006E0074006500720020004400720069007600650072002000280050005300290000' +
            '005265736F6C7574696F6E003732647069005061676553697A6500437573746F6D5061676553' +
            '697A650050616765526567696F6E00004C656164696E674564676500' +
            '00496E707574536C6F74002A557365466F726D547261795461626C6500000000000000000000' +
            '0000000000000000000000';
        
        // Convertir hex en Base64
        return hexToBase64(hexTemplate);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 5 : TEMPLATES XML STATIQUES
    // ═══════════════════════════════════════════════════════════════════════════════

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
     * Génère la section XML `<bleed>` pour le PSMD à partir des données fond perdu.
     * PrintShop Mail ne supporte qu'une valeur unique de bleed, donc on prend le minimum
     * des 4 côtés pour garantir la couverture sur tous les côtés.
     * Gère la rétrocompatibilité avec l'ancien format à valeur unique (valeurMm).
     * 
     * @param {PsmdFondPerdu|null} [fondPerdu] - Configuration fond perdu
     * @returns {string} XML de la section bleed (mode + size en points)
     * 
     * @example
     * // Actif, uniforme 3mm → 8.50 points
     * generatePsmdBleedSection({ actif: true, hautMm: 3, basMm: 3, gaucheMm: 3, droiteMm: 3 });
     * // → '<bleed>\n<mode>1</mode>\n<size>8.50</size>\n</bleed>'
     * 
     * // Inactif
     * generatePsmdBleedSection({ actif: false });
     * // → '<bleed>\n<mode>0</mode>\n<size>0</size>\n</bleed>'
     */
    function generatePsmdBleedSection(fondPerdu) {
        if (!fondPerdu || !fondPerdu.actif) {
            return '<bleed>\n<mode>0</mode>\n<size>0</size>\n</bleed>';
        }

        // Rétrocompatibilité : ancien format { actif, valeurMm } → 4 côtés identiques
        var haut, bas, gauche, droite;
        if (fondPerdu.valeurMm !== undefined && fondPerdu.hautMm === undefined) {
            haut = bas = gauche = droite = fondPerdu.valeurMm || 0;
        } else {
            haut = fondPerdu.hautMm || 0;
            bas = fondPerdu.basMm || 0;
            gauche = fondPerdu.gaucheMm || 0;
            droite = fondPerdu.droiteMm || 0;
        }

        var minMm = Math.min(haut, bas, gauche, droite);
        if (minMm <= 0) {
            return '<bleed>\n<mode>0</mode>\n<size>0</size>\n</bleed>';
        }

        var sizePoints = mmToPoints(minMm);
        return '<bleed>\n<mode>1</mode>\n<size>' + sizePoints.toFixed(2) + '</size>\n</bleed>';
    }

    /**
     * Génère la section <preferences> du fichier PSMD.
     * 
     * @param {PsmdFondPerdu|null} [fondPerdu] - Configuration fond perdu pour la section bleed
     * @returns {string} XML de la section preferences
     */
    function generatePsmdPreferences(fondPerdu) {
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
${generatePsmdBleedSection(fondPerdu)}
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
     * Génère un élément <data_field> pour la section <data_fields>.
     * Chaque champ de fusion doit être déclaré pour que PrintShop Mail le reconnaisse.
     * 
     * @param {string} fieldName - Nom du champ (sans les @)
     * @returns {string} XML du data_field
     */
    function generatePsmdDataField(fieldName) {
        return `<data_field>
<in_use>yes</in_use>
<name>${escapeXmlPsmd(fieldName)}</name>
<default_value></default_value>
<source>user_input</source>
<remarks></remarks>
</data_field>`;
    }

    /**
     * Génère les sections finales du fichier PSMD (data_fields, template_folders, embedded_ps).
     * 
     * @param {string[]} mergeFields - Liste des noms de champs de fusion (sans les @)
     * @returns {string} XML des sections finales
     */
    function generatePsmdFooterSections(mergeFields) {
        mergeFields = mergeFields || [];
        
        var dataFieldsXml = '<data_fields>\n';
        for (var i = 0; i < mergeFields.length; i++) {
            dataFieldsXml += generatePsmdDataField(mergeFields[i]) + '\n';
        }
        dataFieldsXml += '</data_fields>';
        
        return dataFieldsXml + `
<template_folders>
</template_folders>
<embedded_ps>
<author>PrintShop Mail</author>
<creation_date>1992-07-01T11:00:00</creation_date>
<last_modification_date>1992-07-01T11:00:00</last_modification_date>
<name>Ne rien intégrer</name>
<description></description>
<start_of_page></start_of_page>
<start_of_job></start_of_job>
<between_sets></between_sets>
</embedded_ps>`;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 6 : GÉNÉRATION DE COULEURS
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Génère une section <fillcolor>, <bordercolor> ou <textcolor> CMYK.
     * L'attribut alpha est optionnel : utilisé pour fillcolor, omis pour bordercolor et textcolor.
     * 
     * @param {string} tagName - Nom de la balise ('fillcolor', 'bordercolor', 'textcolor')
     * @param {PsmdCmyk} cmyk - Valeurs CMYK (0-1)
     * @param {number|null} [alpha=null] - Transparence (null = pas d'attribut alpha, 0-1 sinon)
     * @returns {string} XML de la couleur CMYK
     */
    function generatePsmdColor(tagName, cmyk, alpha) {
        if (alpha === undefined) alpha = null;
        
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
     * @param {PsmdCmyk} cmyk - Couleur CMYK {c, m, y, k}
     * @returns {string} XML de la couleur sans alpha
     */
    function generatePsmdColorNoAlpha(tagName, cmyk) {
        const c = cmyk.c || 0;
        const m = cmyk.m || 0;
        const y = cmyk.y || 0;
        const k = cmyk.k || 0;
        
        return `<${tagName} colorspace="CMYK" downgrade_c="${c}" downgrade_m="${m}" downgrade_y="${y}" downgrade_k="${k}"><component>${c}</component><component>${m}</component><component>${y}</component><component>${k}</component></${tagName}>`;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 7 : GÉNÉRATION DE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Génère un nom unique et cohérent pour une zone image PSMD.
     * Ce nom sera utilisé dans <object>/<n>, <image_object>/<variable_name> et <variable>/<n>.
     * PrintShop Mail exige que ces 3 noms soient strictement identiques pour lier
     * l'objet image à sa variable.
     * 
     * Format du nom :
     * - Si zone.nom est défini et non générique → "Zone Image (nom)"
     * - Sinon → "Zone Image id"
     * 
     * @param {Object} zone - Données de la zone image
     * @param {string} [zone.id] - Identifiant unique de la zone
     * @param {string} [zone.nom] - Nom personnalisé de la zone
     * @returns {string} Nom unique pour la zone (déjà échappé XML)
     * 
     * @example
     * getImageZonePsmdName({ id: 'zone-1' });                    // → "Zone Image zone-1"
     * getImageZonePsmdName({ id: 'zone-1', nom: 'Image' });      // → "Zone Image zone-1" (nom générique)
     * getImageZonePsmdName({ id: 'zone-1', nom: 'MonLogo' });    // → "Zone Image MonLogo (zone-1)"
     */
    function getImageZonePsmdName(zone) {
        var baseName = zone.nom || 'Image';
        var zoneId = zone.id || '';
        
        // Liste des noms génériques qui nécessitent un suffixe d'id simple
        var genericNames = ['Image', 'Zone', 'Zone Image'];
        
        var name;
        if (zoneId && genericNames.indexOf(baseName) !== -1) {
            // Nom générique : format "Zone Image {id}"
            name = 'Zone Image ' + zoneId;
        } else if (zoneId) {
            // Nom personnalisé : format "Zone Image {nom} ({id})"
            name = 'Zone Image ' + baseName + ' (' + zoneId + ')';
        } else {
            // Pas d'id (cas improbable) : format "Zone Image {nom}"
            name = 'Zone Image ' + baseName;
        }
        
        // Échapper une seule fois pour XML
        return escapeXmlPsmd(name);
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
<expression>[${escapeXmlPsmd(fieldName)}]</expression>
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
     * Génère une variable PSMD de type image (section <variables> du PSMD).
     * PrintShop Mail utilise cette variable pour lier l'objet image au fichier.
     * @param {string} varName - Nom de la variable (déjà échappé XML)
     * @param {string} fileName - Nom du fichier image (pour images fixes)
     * @param {string} [expressionOverride] - Expression complète (pour images dynamiques, pas d'échappement)
     * @returns {string} XML de la variable image PSMD
     */
    function generatePsmdImageVariable(varName, fileName, expressionOverride) {
        // Si expressionOverride fourni → échapper les caractères XML réservés (& < >)
        // Les guillemets " sont conservés tels quels (valides en contenu d'élément XML)
        // Sinon → nom de fichier entre guillemets (image fixe, échappement complet)
        var expressionValue;
        if (expressionOverride) {
            // Échapper & et < > pour le XML, mais PAS les guillemets (nécessaires dans l'expression PSMD)
            expressionValue = expressionOverride
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        } else {
            expressionValue = '"' + escapeXmlPsmd(fileName) + '"';
        }
        // varName est déjà échappé par getImageZonePsmdName(), ne pas ré-échapper
        return `<variable>
<name>${varName}</name>
<global>no</global>
<expression>${expressionValue}</expression>
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
     * Extrait tous les champs de fusion et génère la section <variables>.
     * Parcourt les zonesTexte V3.3 pour extraire les marqueurs @XXX@.
     * 
     * @param {PsmdInput} jsonData - Données complètes de exportToWebDev()
     * @param {string|null} exportPrefix - Préfixe pour les noms de fichiers exportés (ex: "vdp_20251224_112005")
     * @returns {string} XML de la section <variables>
     * 
     * @example
     * const jsonData = { zonesTexte: [{ contenuRtf: '@NOM@ @PRENOM@' }] };
     * generatePsmdVariables(jsonData, "vdp_20251224_112005");
     * // Retourne <variables> avec NOM, PRENOM et variables d'images
     */
    function generatePsmdVariables(jsonData, exportPrefix) {
        exportPrefix = exportPrefix || null;
        const allFields = new Set();
        
        // Parcourir les zones texte V3.3 pour les champs de fusion
        const zonesTexte = jsonData.zonesTexte || [];
        for (let i = 0; i < zonesTexte.length; i++) {
            const zone = zonesTexte[i];
            if (zone.contenuRtf) {
                const fields = extractMergeFields(zone.contenuRtf);
                fields.forEach(function(field) { allFields.add(field); });
            }
        }
        
        // Collecter les variables d'images
        const imageVariables = [];
        const zonesImage = jsonData.zonesImage || [];
        for (let i = 0; i < zonesImage.length; i++) {
            const zone = zonesImage[i];
            // Utiliser la fonction centralisée pour garantir la cohérence
            // avec <object>/<n> et <image_object>/<variable_name>
            const varName = getImageZonePsmdName(zone);
            const source = zone.source || {};

            if (source.type === 'champ' && source.cheminUNC && source.valeur) {
                // ─── Image dynamique : expression = chemin UNC & [champ fusion] ───
                // L'expression doit concaténer le chemin UNC (entre guillemets) avec la variable du champ
                // Résultat attendu : "\\server\path\Collections\00000006\" & [Champ1]
                const expression = '"' + source.cheminUNC + '" & [' + source.valeur + ']';
                imageVariables.push({ varName: varName, expression: expression, isDynamic: true });
            } else if (exportPrefix && source.imageBase64) {
                // ─── Image fixe avec base64 ───
                var ext = getExtensionFromBase64(source.imageBase64);
                var fileName = exportPrefix + '_' + zone.id + '.' + ext;
                imageVariables.push({ varName: varName, fileName: fileName, isDynamic: false });
            } else {
                // ─── Fallback nom original ───
                var fileName = (source.nomOriginal) || 
                          (source.nomFichier) || 
                          (source.url) || '';
                if (fileName) {
                    imageVariables.push({ varName: varName, fileName: fileName, isDynamic: false });
                }
            }
        }

        // ── Variables de fond PDF ──────────────────────────────────────────────────
        // Une variable "Image N" par page ayant un cheminFond.
        // Conforme au format PSMD de référence :
        //   <n>Image 1</n>  →  <expression>"chemin\vers\fichier.pdf"</expression>
        // Le nom "Image N" est cohérent avec <object>/<n> et <image_object>/<variable_name>.
        // ─────────────────────────────────────────────────────────────────────────
        var pages = jsonData.pages || [];
        for (var pi = 0; pi < pages.length; pi++) {
            var pg = pages[pi];
            if (pg && pg.cheminFond) {
                var fondVarName = 'Image ' + (pi + 1);
                imageVariables.push({
                    varName: fondVarName,
                    fileName: pg.cheminFond,
                    isDynamic: false
                });
            }
        }
        
        // Générer la section variables
        if (allFields.size === 0 && imageVariables.length === 0) {
            return '<variables>\n</variables>';
        }
        
        var xml = '<variables>\n';
        
        // Variables de champs de fusion
        allFields.forEach(function(field) {
            xml += generatePsmdVariable(field) + '\n';
        });
        
        // Variables d'images
        for (var j = 0; j < imageVariables.length; j++) {
            var imgVar = imageVariables[j];
            if (imgVar.isDynamic) {
                xml += generatePsmdImageVariable(imgVar.varName, '', imgVar.expression) + '\n';
            } else {
                xml += generatePsmdImageVariable(imgVar.varName, imgVar.fileName) + '\n';
            }
        }
        
        xml += '</variables>';
        
        return xml;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 8 : GÉNÉRATION D'OBJETS ZONES
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Convertit l'alignement horizontal Designer en valeur PrintShop.
     * 
     * @param {Object} zone - Données de la zone image
     * @returns {number} Valeur PrintShop (2=gauche, 4=centre, 6=droite)
     */
    function getImageAlignmentH(zone) {
        var alignH = (zone.redimensionnement && zone.redimensionnement.alignementH) || 'center';
        var mapping = {
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
        var alignV = (zone.redimensionnement && zone.redimensionnement.alignementV) || 'middle';
        var mapping = {
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
        var mode = (zone.redimensionnement && zone.redimensionnement.mode) || 'ajuster';
        var mapping = {
            'initial': 1,
            'ajuster': 2,
            'couper': 3
        };
        return mapping[mode] || 2;
    }

    /**
     * Génère les propriétés communes à tous les objets PSMD.
     * Format V3.3 : zonesTexte, zonesImage, zonesCodeBarres, zonesQR.
     * 
     * Gère également la contrainte "Zone imprimable" (contrainte.global.imprimable) :
     * - Si imprimable = false : la zone est visible dans l'éditeur mais pas à l'impression/preview
     * - Si imprimable = true ou non défini : comportement par défaut (visible partout)
     * 
     * @param {Object} zone - Données de la zone exportée
     * @param {Object} [zone.contrainte] - Contraintes de la zone
     * @param {Object} [zone.contrainte.global] - Contraintes globales de la zone
     * @param {boolean} [zone.contrainte.global.imprimable=true] - Si false, la zone n'apparaît pas à l'impression
     * @param {string} [zoneType] - Type de zone ('image', 'textQuill', 'barcode', 'qr')
     *                              Si non fourni, utilise la logique générique
     * @returns {string} XML des propriétés communes incluant <show_mode> configuré selon imprimable
     */
    function generatePsmdObjectCommon(zone, zoneType) {
        var guid = generateGuid();
        
        // Générer un nom unique pour chaque zone
        var name;
        
        if (zoneType === 'image') {
            // Pour les zones image, utiliser la fonction centralisée
            // qui garantit la cohérence avec <variable_name> et <variable>/<n>
            name = getImageZonePsmdName(zone);
        } else {
            // Pour les autres zones, utiliser la logique existante
            var baseName = zone.nom || 'Zone';
            
            // Liste des noms génériques qui nécessitent un suffixe d'id
            var genericNames = ['Code-barres', 'Zone', 'Texte', 'QR Code'];
            
            if (zone.id && genericNames.indexOf(baseName) !== -1) {
                // Nom générique : ajouter l'id pour unicité
                name = escapeXmlPsmd(baseName + ' ' + zone.id);
            } else if (zone.id) {
                // Nom personnalisé mais on ajoute quand même l'id pour sécurité
                name = escapeXmlPsmd(baseName + ' (' + zone.id + ')');
            } else {
                // Pas d'id (cas improbable) : utiliser le nom tel quel
                name = escapeXmlPsmd(baseName);
            }
        }
        
        // Export PSMD : toutes les zones sont verrouillées pour empêcher les modifications dans PrintShop Mail
        var locked = 'yes';
        
        // Géométrie V3.3 : geometrie.xMm, yMm, largeurMm, hauteurMm
        var geom = zone.geometrie || {};
        var xMm = geom.xMm !== undefined ? geom.xMm : 0;
        var yMm = geom.yMm !== undefined ? geom.yMm : 0;
        var widthMm = geom.largeurMm !== undefined ? geom.largeurMm : 50;
        var heightMm = geom.hauteurMm !== undefined ? geom.hauteurMm : 20;
        
        // Conversion coordonnées mm → points
        var left = mmToPoints(xMm);
        var top = mmToPoints(yMm);
        var right = mmToPoints(xMm + widthMm);
        var bottom = mmToPoints(yMm + heightMm);
        
        // Couleurs de fond V3.3 strict
        var fillColor = { c: 0, m: 0, y: 0, k: 0 };
        // Alpha : 0 si transparent, null si opaque (pas d'attribut alpha pour PrintShop Mail)
        var fillAlpha = 0;
        
        // Format texte/image V3.3 : zone.fond.couleurCmjn
        if (zone.fond && zone.fond.couleurCmjn) {
            if (!zone.fond.transparent) {
                fillColor = getCmykForPsmd(null, zone.fond.couleurCmjn);
                fillAlpha = null;  // Opaque
            }
        }
        // Format barcode V3.3 : zone.couleurFondCmjn
        else if (zone.couleurFondCmjn) {
            if (!zone.transparent) {
                fillColor = getCmykForPsmd(null, zone.couleurFondCmjn);
                fillAlpha = null;  // Opaque
            }
        }
        // Format QR V3.3 : zone.couleurs.fondCmjn
        else if (zone.couleurs && zone.couleurs.fondCmjn) {
            fillColor = getCmykForPsmd(null, zone.couleurs.fondCmjn);
            fillAlpha = null;  // Opaque
        }
        
        // Couleurs de bordure V3.3 : zone.bordure.couleurCmjn
        // downgrade_k="1" par défaut requis par PrintShop Mail
        var borderColor = { c: 0, m: 0, y: 0, k: 1 };
        var borderSize = 0;
        var borderStyleName = 'solid';
        
        // Mapping des styles de bordure Designer → PrintShop Mail
        var BORDER_STYLE_MAP = {
            'solid': 0,
            'dotted': 1,
            'dashed': 2
        };
        
        // Bordure V3.3 : zone.bordure.epaisseur / couleurCmjn / style
        if (zone.bordure && zone.bordure.epaisseur) {
            borderSize = zone.bordure.epaisseur;
            borderColor = getCmykForPsmd(null, zone.bordure.couleurCmjn, { c: 0, m: 0, y: 0, k: 1 });
            if (zone.bordure.style) {
                borderStyleName = zone.bordure.style;
            }
        }
        
        var borderStyle = BORDER_STYLE_MAP[borderStyleName] || 0;
        
        // Déterminer si la zone est imprimable (défaut: true)
        // La propriété est dans contrainte.global.imprimable
        var isImprimable = true;
        if (zone.contrainte && zone.contrainte.global && zone.contrainte.global.imprimable === false) {
            isImprimable = false;
        }
        
        // Si la zone n'est pas imprimable: visible dans l'éditeur mais pas à l'impression/preview
        var showInPreview = isImprimable ? 'yes' : 'no';
        
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
<jpeg_preview>${showInPreview}</jpeg_preview>
<pdf_preview>${showInPreview}</pdf_preview>
<print_preview>${showInPreview}</print_preview>
<print>${showInPreview}</print>
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
     * Format V3.3 : zonesTexte avec contenuRtf, style.alignementH/V, copyfitting.actif, etc.
     * 
     * @param {Object} zone - Données de la zone texte exportée
     * @returns {string} XML complet de l'objet texte
     */
    function generatePsmdTextObject(zone) {
        // Récupérer le RTF et l'encoder en Base64
        // V3.3 strict : script.js exporte sous "contenuRtf"
        var rtfContent = zone.contenuRtf || '';
        var rtfBase64 = rtfToBase64(rtfContent);
        
        // Alignements V3.3 strict : style.alignementH / style.alignementV
        var hAlignValue = (zone.style && zone.style.alignementH) || 'left';
        var vAlignValue = (zone.style && zone.style.alignementV) || 'top';
        
        var hAlign = HALIGN_MAP[hAlignValue] || 2; // left par défaut
        var vAlign = VALIGN_MAP[vAlignValue] || 0; // top par défaut
        
        // Copyfitting V3.3 strict : copyfitting.actif / copyfitting.tailleMinimum
        var copyfitting = zone.copyfitting || {};
        var reduceToFit = copyfitting.actif ? 'yes' : 'no';
        var minFontSize = copyfitting.tailleMinimum || 8;
        
        // Gestion lignes vides V3.3 strict : supprimerLignesVides
        var emptyLines = zone.supprimerLignesVides || 0;
        
        // Couleur texte V3.3 strict : style.couleurCmjn
        var textColorCmyk = (zone.style && zone.style.couleurCmjn) || null;
        var textColor = getCmykForPsmd(null, textColorCmyk, { c: 0, m: 0, y: 0, k: 1 });
        
        var xml = generatePsmdObjectCommon(zone);
        
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
     * Génère un objet image PSMD (image_object).
     * Utilise getImageZonePsmdName() pour garantir la cohérence du nom
     * entre <object>/<n>, <image_object>/<variable_name> et <variable>/<n>.
     * 
     * @param {Object} zone - Données de la zone image exportée
     * @returns {string} XML complet de l'objet image
     */
    function generatePsmdImageObject(zone) {
        // Utiliser la fonction centralisée pour le nom (déjà échappé XML)
        var variableName = getImageZonePsmdName(zone);
        
        // Déterminer le nom de fichier selon le type de source
        var source = zone.source || {};
        var fileName = '';

        if (source.type === 'champ' && source.cheminUNC) {
            // Image dynamique : pas de file_name statique, PrintShop Mail utilise la variable
            fileName = '';
        } else {
            // Image fixe : nom exporté ou nom original
            fileName = zone.exportedFileName || 
                      source.nomOriginal || 
                      source.nomFichier || 
                      source.url || '';
        }
        
        // Mode de redimensionnement
        var keepAspectRatio = ((zone.redimensionnement && zone.redimensionnement.mode === 'proportionnel') || 
                              (zone.redimensionnement && zone.redimensionnement.conserverRatio)) ? 'yes' : 'no';
        
        // Passer 'image' comme zoneType pour que generatePsmdObjectCommon utilise aussi getImageZonePsmdName
        var xml = generatePsmdObjectCommon(zone, 'image');
        
        xml += `
<image_object>
<scale>${getImageScaleMode(zone)}</scale>
<keep_aspect_ratio>${keepAspectRatio}</keep_aspect_ratio>
<horizontal_alignment>${getImageAlignmentH(zone)}</horizontal_alignment>
<vertical_alignment>${getImageAlignmentV(zone)}</vertical_alignment>
<variable_name>${variableName}</variable_name>
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

    /**
     * Génère le contenu XML property_bag pour un QR Code vCard.
     * Produit le format structuré attendu par PrintShop Mail.
     * 
     * @param {Object} qrConfig - Configuration du QR Code intelligent
     * @param {string} qrConfig.type - Type de QR ('vcard')
     * @param {Object} qrConfig.fields - Valeurs des champs vCard
     * @returns {string} XML du property_bag pour vCard
     */
    function generateVCardPropertyBag(qrConfig) {
        var fields = qrConfig.fields || {};
        var xml = '<property_bag><Barcode>';
        xml += '<RotationFixed>0</RotationFixed>';
        xml += '<BoundsIsRotated>False</BoundsIsRotated>';
        xml += '<Initialized>True</Initialized>';
        xml += '<Type>QRCodeVCard</Type>';
        
        // Générer chaque champ dans l'ordre PrintShop Mail
        VCARD_FIELD_ORDER.forEach(function(psmField) {
            // Trouver le champ Designer correspondant
            var designerField = null;
            for (var key in VCARD_FIELD_MAP) {
                if (VCARD_FIELD_MAP[key] === psmField) {
                    designerField = key;
                    break;
                }
            }
            
            // Récupérer la valeur et la convertir
            var value = designerField ? (fields[designerField] || '') : '';
            var psmValue = convertQrFieldToPsm(value);
            
            xml += '<' + psmField + '>' + escapeXmlPsmd(psmValue) + '</' + psmField + '>';
        });
        
        xml += '<Alignment>0;0</Alignment>';
        xml += '</Barcode>\n</property_bag>';
        
        return xml;
    }

    function generatePsmdBarcodeObject(zone, barcodeType) {
        // Déterminer le type PrintShop et le contenu
        var psType;
        var propertyBagContent;
        var designerType = zone.typeCodeBarres || zone.typeCode || 'code128';
        
        // Vérifier si c'est un QR Code avec configuration vCard
        var isQrCode = barcodeType === 'qr' || designerType.toLowerCase() === 'qrcode';
        var hasVCardConfig = zone.qrConfig && zone.qrConfig.type === 'vcard';
        
        if (isQrCode && hasVCardConfig) {
            // QR Code vCard intelligent : générer le property_bag structuré
            propertyBagContent = generateVCardPropertyBag(zone.qrConfig);
        } else if (isQrCode) {
            // QR Code simple (URL, email, tel, geo, etc.)
            psType = 'QRCode';
            var data = '';
            
            // Récupérer les données selon la source
            if (zone.qrConfig && zone.qrConfig.fields) {
                // QR Code intelligent : récupérer selon le type
                var qrType = zone.qrConfig.type || 'url';
                var fields = zone.qrConfig.fields;
                
                switch (qrType) {
                    case 'url':
                        data = fields.url || '';
                        break;
                    case 'email':
                        // Format mailto: pour PrintShop Mail
                        // Construire l'expression directement avec concaténation &
                        var emailTo = fields.to || '';
                        var subject = fields.subject || '';
                        var body = fields.body || '';
                        
                        if (emailTo) {
                            // Construire les parties de l'expression
                            var emailParts = [];
                            
                            // Partie mailto:
                            emailParts.push('"mailto:"');
                            emailParts.push(convertQrFieldToPsm(emailTo));
                            
                            // Partie subject si présente
                            if (subject) {
                                emailParts.push('"?subject="');
                                emailParts.push(convertQrFieldToPsm(subject));
                                
                                // Partie body si présente (après subject)
                                if (body) {
                                    emailParts.push('"&body="');
                                    emailParts.push(convertQrFieldToPsm(body));
                                }
                            } else if (body) {
                                // Body sans subject
                                emailParts.push('"?body="');
                                emailParts.push(convertQrFieldToPsm(body));
                            }
                            
                            // Joindre avec & et retourner directement (pas de re-conversion)
                            data = emailParts.join('&');
                            
                            // Marquer comme déjà converti pour ne pas repasser dans convertQrFieldToPsm
                            zone._emailAlreadyConverted = true;
                        }
                        break;
                    case 'tel':
                        var tel = fields.tel || '';
                        if (tel) {
                            // Vérifier si c'est une variable @CHAMP@ ou une valeur mixte
                            if (/@[^@]+@/.test(tel)) {
                                // Contient des variables : construire l'expression concaténée
                                var telParts = [];
                                telParts.push('"tel:"');
                                telParts.push(convertQrFieldToPsm(tel));
                                data = telParts.join('&');
                                zone._telAlreadyConverted = true;
                            } else {
                                // Valeur fixe : nettoyer le numéro (garder uniquement chiffres et +)
                                data = 'tel:' + tel.replace(/[^\d+]/g, '');
                            }
                        }
                        break;
                    case 'geo':
                        var lat = fields.latitude || '';
                        var lng = fields.longitude || '';
                        if (lat && lng) {
                            data = 'geo:' + lat + ',' + lng;
                        }
                        break;
                    default:
                        data = fields.url || fields.value || '';
                }
            } else {
                // Fallback : données directes
                data = zone.valeur || zone.contenu || '';
            }
            
            // Appliquer le format PrintShop Mail (sauf si déjà converti)
            if (!zone._emailAlreadyConverted && !zone._telAlreadyConverted) {
                data = convertQrFieldToPsm(data);
            }
            
            propertyBagContent = '<property_bag><Barcode><RotationFixed>0</RotationFixed><BoundsIsRotated>False</BoundsIsRotated><Initialized>True</Initialized><Type>' + psType + '</Type><Data>' + escapePropertyBag(data) + '</Data><Alignment>0;0</Alignment></Barcode>\n</property_bag>';
        } else {
            // Code-barres classique (Code128, EAN13, etc.)
            psType = BARCODE_TYPE_MAP[designerType.toLowerCase()] || 'Code128';
            var data = zone.valeurStatique || zone.valeur || zone.contenu || '';
            // Convertir la valeur vers le format PrintShop Mail :
            // - @CHAMP@ → [CHAMP] (sans guillemets)
            // - valeur fixe → "valeur" (avec guillemets)
            // - mixte → "texte"&[CHAMP]
            if (zone.champFusion && zone.champFusion.trim() !== '') {
                // Champ de fusion explicite → format [CHAMP]
                data = '[' + zone.champFusion.replace(/@/g, '') + ']';
            } else {
                // Utiliser convertQrFieldToPsm qui gère correctement tous les cas
                data = convertQrFieldToPsm(data);
            }
            // Construire le property_bag avec gestion spéciale DataMatrix
            var symbolSizeTag = '';
            if (psType === 'DataMatrix') {
                // DataMatrix : ajouter la taille du symbole
                // 'rectangle' → Rectangle12x36, sinon vide (carré par défaut)
                var symbolSize = (zone.forme === 'rectangle') ? 'Rectangle12x36' : '';
                symbolSizeTag = '<DataMatrix_SymbolSize>' + symbolSize + '</DataMatrix_SymbolSize>';
            }
            propertyBagContent = '<property_bag><Barcode><RotationFixed>0</RotationFixed><BoundsIsRotated>False</BoundsIsRotated><Initialized>True</Initialized><Type>' + psType + '</Type>' + symbolSizeTag + '<Data>' + escapePropertyBag(data) + '</Data><Alignment>0;0</Alignment></Barcode>\n</property_bag>';
        }
        
        var xml = generatePsmdObjectCommon(zone);
        
        // Modifier snap_frame_to_content pour les codes-barres
        xml = xml.replace('<snap_frame_to_content>no</snap_frame_to_content>', '<snap_frame_to_content>yes</snap_frame_to_content>');
        
        xml += '\n<plugin_object title="Barcode" assembly_name="Barcode.plugins.dll" assembly_version="2.2.3.9078" class_name="Barcode" url="http://www.printshopmail.com/plugins/barcode/" url_download_version="http://www.printshopmail.com/plugins/barcode/2_2/Barcode.plugins.dll">\n';
        xml += propertyBagContent;
        xml += '\n</plugin_object>\n</object>';
        
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
        var type = zone.type;
        
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
                console.warn('Type de zone non supporté pour export PSMD: ' + type);
                return '';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // SECTION 9 : ORCHESTRATION ET EXPORT
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Génère une section <layout> (page) complète pour le PSMD.
     * Si page.cheminFond est défini, un objet image PDF de fond est injecté
     * en première position (avant toutes les zones utilisateur).
     *
     * @param {Object} page - Données de la page avec zones regroupées
     * @param {number} page.name - Nom de la page
     * @param {Array} page.zones - Zones de la page
     * @param {string} [page.cheminFond] - Chemin physique du PDF de fond (optionnel)
     * @param {number} pageIndex - Index de la page (0-based)
     * @param {number} pageWidthPt - Largeur de la page en points
     * @param {number} pageHeightPt - Hauteur de la page en points
     * @param {string} devmodeBase64 - DEVMODE encodé en Base64
     * @param {PsmdFondPerdu|null} fondPerdu - Configuration fond perdu (réservé, non utilisé sans bleed)
     * @returns {string} XML de la section layout
     */
    function generatePsmdLayout(page, pageIndex, pageWidthPt, pageHeightPt, devmodeBase64, fondPerdu) {
        var layoutName = page.name || ('Page ' + (pageIndex + 1));

        var xml = `<layout>
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

        // ── Objet image de fond PDF ──────────────────────────────────────────────
        // Injecté en premier si cheminFond est défini.
        // Conforme au format PSMD de référence PrintShop Mail (Exemple_PrintShop.txt) :
        //   - Nom : "Image N" (N = numéro de page 1-based)
        //   - variable_name identique au nom de l'objet
        //   - pdf_pagenumber_expression = pageIndex + 1
        //   - bounds couvrant toute la page (sans fond perdu pour l'instant)
        //   - scale=2, keep_aspect_ratio=no, alignements=4 (stretch)
        // ────────────────────────────────────────────────────────────────────────
        if (page.cheminFond) {
            var fondObjName = 'Image ' + (pageIndex + 1);
            var fondObjId   = generateGuid();

            xml += `<object>
<identifier>{${fondObjId}}</identifier>
<n>${escapeXmlPsmd(fondObjName)}</n>
<locked>no</locked>
<knockout>no</knockout>
<border_size>0</border_size>
<border_style>0</border_style><fillcolor colorspace="CMYK" alpha="0" downgrade_c="0" downgrade_m="0" downgrade_y="0" downgrade_k="0"><component>0</component><component>0</component><component>0</component><component>0</component></fillcolor><bordercolor colorspace="CMYK" downgrade_c="0" downgrade_m="0" downgrade_y="0" downgrade_k="1"><component>0</component><component>0</component><component>0</component><component>1</component></bordercolor>
<rotation>0</rotation>
<bounds left="0" top="0" right="${pageWidthPt}" bottom="${pageHeightPt}"/>
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
</anchor>
<image_object>
<scale>2</scale>
<keep_aspect_ratio>no</keep_aspect_ratio>
<horizontal_alignment>4</horizontal_alignment>
<vertical_alignment>4</vertical_alignment>
<variable_name>${escapeXmlPsmd(fondObjName)}</variable_name>
<default_image_folder></default_image_folder>
<default_folder></default_folder>
<subfolders>no</subfolders>
<file_name>${escapeXmlPsmd(page.cheminFond)}</file_name>
<pdf_pagenumber_expression>${pageIndex + 1}</pdf_pagenumber_expression>
<global_scope>no</global_scope>
<filters>
<two_color convert="no">
<threshold>50</threshold><backgroundcolor colorspace="CMYK" downgrade_c="0" downgrade_m="0" downgrade_y="0" downgrade_k="0"><component>0</component><component>0</component><component>0</component><component>0</component></backgroundcolor><foregroundcolor colorspace="CMYK" downgrade_c="0" downgrade_m="0" downgrade_y="0" downgrade_k="1"><component>0</component><component>0</component><component>0</component><component>1</component></foregroundcolor>
</two_color>
</filters>
</image_object>
</object>
`;
        }

        // ── Zones utilisateur ────────────────────────────────────────────────────
        if (page.zones && page.zones.length > 0) {
            for (var i = 0; i < page.zones.length; i++) {
                var objectXml = generatePsmdObject(page.zones[i]);
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
     * @param {PsmdInput} jsonData - Données complètes de exportToWebDev()
     * @param {number} largeurMm - Largeur du document en mm
     * @param {number} hauteurMm - Hauteur du document en mm
     * @param {string|null} exportPrefix - Préfixe pour les noms de fichiers exportés (optionnel)
     * @returns {string} XML de la section layouts
     */
    function generatePsmdLayouts(jsonData, largeurMm, hauteurMm, exportPrefix) {
        exportPrefix = exportPrefix || null;
        
        // Convertir dimensions en points
        var pageWidthPt = mmToPoints(largeurMm);
        var pageHeightPt = mmToPoints(hauteurMm);
        
        // Déterminer l'orientation
        var orientation = largeurMm > hauteurMm ? 'PAYSAGE' : 'PORTRAIT';
        
        // Générer le DEVMODE
        var devmodeBase64 = generateWindowsDevmode(orientation, hauteurMm, largeurMm);
        
        // Regrouper les zones par page
        var zonesByPage = {};
        
        // Initialiser les pages
        var pages = jsonData.pages || [];
        for (var p = 0; p < pages.length; p++) {
            var pageNum = p + 1;
            zonesByPage[pageNum] = [];
        }
        
        // Si aucune page, créer une page par défaut
        if (pages.length === 0) {
            zonesByPage[1] = [];
        }
        
        // Fonction helper pour ajouter une zone
        function addZone(zone, type) {
            var pNum = zone.page || 1;
            if (!zonesByPage[pNum]) zonesByPage[pNum] = [];
            
            var newZone = {};
            for (var key in zone) {
                if (zone.hasOwnProperty(key)) {
                    newZone[key] = zone[key];
                }
            }
            newZone.type = type;
            newZone.zIndex = zone.niveau || zone.zIndex || 1;
            
            zonesByPage[pNum].push(newZone);
        }
        
        // Ajouter les zones texte (V3.3 : zonesTexte format français)
        var zonesTexte = jsonData.zonesTexte || [];
        for (var t = 0; t < zonesTexte.length; t++) {
            addZone(zonesTexte[t], 'textQuill');
        }
        
        // Ajouter les zones code-barres (barcode)
        var zonesCodeBarres = jsonData.zonesCodeBarres || [];
        for (var b = 0; b < zonesCodeBarres.length; b++) {
            addZone(zonesCodeBarres[b], 'barcode');
        }
        
        // Ajouter les zones QR
        var zonesQR = jsonData.zonesQR || [];
        for (var q = 0; q < zonesQR.length; q++) {
            addZone(zonesQR[q], 'qr');
        }
        
        // Ajouter les zones image
        var zonesImage = jsonData.zonesImage || [];
        for (var i = 0; i < zonesImage.length; i++) {
            var zone = zonesImage[i];
            var pNum = zone.page || 1;
            if (!zonesByPage[pNum]) zonesByPage[pNum] = [];
            
            // Générer le nom de fichier exporté si prefix fourni et image base64 présente
            var exportedFileName = (zone.source && zone.source.nomOriginal) || '';
            if (exportPrefix && zone.source && zone.source.imageBase64) {
                var ext = getExtensionFromBase64(zone.source.imageBase64);
                exportedFileName = exportPrefix + '_' + zone.id + '.' + ext;
            }
            
            var newZone = {};
            for (var key in zone) {
                if (zone.hasOwnProperty(key)) {
                    newZone[key] = zone[key];
                }
            }
            newZone.type = 'image';
            newZone.zIndex = zone.niveau || zone.zIndex || 1;
            newZone.exportedFileName = exportedFileName;
            
            zonesByPage[pNum].push(newZone);
        }
        
        // Générer le XML
        var xml = '<layouts>\n';
        
        var pageNumbers = Object.keys(zonesByPage).map(Number).sort(function(a, b) { return a - b; });
        
        for (var idx = 0; idx < pageNumbers.length; idx++) {
            var pageNum = pageNumbers[idx];
            
            // Trier les zones par z-index croissant (premier = arrière-plan, dernier = premier plan)
            var sortedZones = zonesByPage[pageNum].sort(function(a, b) {
                var zIndexA = a.niveau || a.zIndex || 1;
                var zIndexB = b.niveau || b.zIndex || 1;
                return zIndexA - zIndexB;
            });
            
            var pageData = {
                zones: sortedZones,
                name: (pages[pageNum - 1] && (pages[pageNum - 1].nom || pages[pageNum - 1].name)) || ('Page ' + pageNum),
                cheminFond: (pages[pageNum - 1] && pages[pageNum - 1].cheminFond) || null
            };
            var fondPerdu = (jsonData.formatDocument && jsonData.formatDocument.fondPerdu) || null;
            xml += generatePsmdLayout(pageData, pageNum - 1, pageWidthPt, pageHeightPt, devmodeBase64, fondPerdu) + '\n';
        }
        
        xml += '</layouts>';
        
        return xml;
    }

    /**
     * Génère un fichier PSMD à partir d'un JSON structuré.
     * Fonction principale du générateur PSMD.
     * 
     * @param {PsmdInput} jsonData - Données du document (format exportToWebDev)
     * @param {PsmdGeneratorOptions} [options] - Options de génération
     * @param {string} [options.prefix] - Préfixe personnalisé (sinon auto-généré)
     * @returns {PsmdOutput} Objet contenant le XML et les images à exporter
     * 
     * @example
     * const testData = {
     *     formatDocument: { largeurMm: 210, hauteurMm: 297 },
     *     pages: [{ numero: 1, nom: "Page 1" }],
     *     zonesTexte: [],
     *     zonesCodeBarres: [],
     *     zonesQR: [],
     *     zonesImage: []
     * };
     * const result = PsmdGenerator.generatePsmdFromJson(testData);
     * console.log(result.fileName); // "vdp_20251227_143045.psmd"
     * console.log(result.xml);      // XML complet
     * console.log(result.images);   // [] (pas d'images)
     */
    function generatePsmdFromJson(jsonData, options) {
        options = options || {};
        
        // Validation des données d'entrée
        if (!jsonData) {
            console.error('generatePsmdFromJson: Aucune donnée fournie');
            return {
                xml: '',
                fileName: '',
                images: []
            };
        }
        
        // Générer ou utiliser le préfixe fourni
        var exportPrefix = options.prefix || generateExportPrefix();
        
        // Récupérer les dimensions du document
        var formatDocument = jsonData.formatDocument || {};
        var largeurMm = formatDocument.largeurMm || 210;
        var hauteurMm = formatDocument.hauteurMm || 297;
        
        // Collecter les images à exporter
        var imagesToExport = [];
        var zonesImage = jsonData.zonesImage || [];
        for (var i = 0; i < zonesImage.length; i++) {
            var zone = zonesImage[i];
            // Ne pas exporter les images dynamiques (type 'champ') — elles sont sur le serveur
            if (zone.source && zone.source.type === 'champ') continue;
            if (zone.source && zone.source.imageBase64) {
                var ext = getExtensionFromBase64(zone.source.imageBase64);
                var fileName = exportPrefix + '_' + zone.id + '.' + ext;
                imagesToExport.push({
                    base64: zone.source.imageBase64,
                    fileName: fileName,
                    zoneId: zone.id
                });
            }
        }
        
        // Construire le XML
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.printshopmail.com/support/xml/schemas/win/version-7_1_0/printshopmail7.xsd">\n';
        
        // Sections statiques
        xml += generatePsmdInfo() + '\n';
        xml += generatePsmdPrinter() + '\n';
        xml += '<operator_instructions></operator_instructions>\n';
        xml += generatePsmdPreferences(formatDocument.fondPerdu) + '\n';
        xml += generatePsmdDatabaseSettings() + '\n';
        
        // Section layouts (pages avec zones)
        xml += generatePsmdLayouts(jsonData, largeurMm, hauteurMm, exportPrefix) + '\n';
        
        // Extraire tous les champs de fusion pour les passer aux sections finales
        // Extraire tous les champs de fusion V3.3
        var allMergeFields = [];
        var zonesTexte = jsonData.zonesTexte || [];
        for (var i = 0; i < zonesTexte.length; i++) {
            var zone = zonesTexte[i];
            if (zone.contenuRtf) {
                var fields = extractMergeFields(zone.contenuRtf);
                for (var j = 0; j < fields.length; j++) {
                    if (allMergeFields.indexOf(fields[j]) === -1) {
                        allMergeFields.push(fields[j]);
                    }
                }
            }
        }

        // Extraire les champs de fusion des zones image dynamiques
        var zonesImageForFields = jsonData.zonesImage || [];
        for (var i = 0; i < zonesImageForFields.length; i++) {
            var zoneImg = zonesImageForFields[i];
            if (zoneImg.source && zoneImg.source.type === 'champ' && zoneImg.source.valeur) {
                if (allMergeFields.indexOf(zoneImg.source.valeur) === -1) {
                    allMergeFields.push(zoneImg.source.valeur);
                }
            }
        }
        
        // Section variables (champs de fusion)
        xml += generatePsmdVariables(jsonData, exportPrefix) + '\n';
        
        // Sections finales (avec data_fields rempli)
        xml += generatePsmdFooterSections(allMergeFields) + '\n';
        
        xml += '</document>';
        
        // Retourner le résultat
        return {
            xml: xml,
            fileName: exportPrefix + '.psmd',
            images: imagesToExport
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EXPOSITION PUBLIQUE
    // ═══════════════════════════════════════════════════════════════════════════════

    /**
     * Objet exposé publiquement contenant les fonctions du générateur PSMD.
     * @namespace PsmdGenerator
     */
    var PsmdGenerator = {
        /**
         * Version du générateur PSMD
         * @type {string}
         */
        version: '1.0.0',
        
        /**
         * Fonction principale de génération PSMD
         * @function
         * @param {PsmdInput} jsonData - Données du document
         * @param {PsmdGeneratorOptions} [options] - Options de génération
         * @returns {PsmdOutput} Résultat de la génération
         */
        generatePsmdFromJson: generatePsmdFromJson,
        
        // Utilitaires exposés pour usage avancé
        /**
         * Convertit mm en points
         * @function
         */
        mmToPoints: mmToPoints,
        
        /**
         * Convertit RGB hex en CMYK
         * @function
         */
        rgbToCmyk: rgbToCmyk,
        
        /**
         * Convertit CMYK en RGB hex
         * @function
         */
        cmykToHex: cmykToHex,
        
        /**
         * Échappe les caractères XML
         * @function
         */
        escapeXmlPsmd: escapeXmlPsmd,
        
        /**
         * Génère un GUID unique
         * @function
         */
        generateGuid: generateGuid,
        
        /**
         * Génère un préfixe d'export
         * @function
         */
        generateExportPrefix: generateExportPrefix,
        
        /**
         * Extrait l'extension depuis base64
         * @function
         */
        getExtensionFromBase64: getExtensionFromBase64,
        
        /**
         * Extrait les champs de fusion
         * @function
         */
        extractMergeFields: extractMergeFields
    };

    // Exposer sur l'objet global (window ou global selon l'environnement)
    global.PsmdGenerator = PsmdGenerator;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

