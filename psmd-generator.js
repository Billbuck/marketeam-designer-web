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
     * @typedef {Object} PsmdFormatDocument
     * @property {number} largeurMm - Largeur du document en mm
     * @property {number} hauteurMm - Hauteur du document en mm
     * @property {string} [orientation] - 'PORTRAIT' ou 'PAYSAGE'
     */

    /**
     * @typedef {Object} PsmdPage
     * @property {number} numero - Numéro de la page (1-based)
     * @property {string} [nom] - Nom de la page
     * @property {string} [name] - Nom de la page (alias)
     */

    /**
     * @typedef {Object} PsmdZoneTextQuill
     * @property {string} id - Identifiant unique de la zone
     * @property {string} [nom] - Nom de la zone
     * @property {number} [page] - Numéro de page (1-based)
     * @property {number} [niveau] - Z-index
     * @property {PsmdGeometry} [geometry] - Géométrie de la zone
     * @property {string} [content_rtf] - Contenu RTF
     * @property {Object} [style] - Styles de la zone (bgColor, align, etc.)
     * @property {Object} [copyfitting] - Options de copyfitting
     */

    /**
     * @typedef {Object} PsmdZoneImage
     * @property {string} id - Identifiant unique de la zone
     * @property {string} [nom] - Nom de la zone
     * @property {number} [page] - Numéro de page (1-based)
     * @property {number} [niveau] - Z-index
     * @property {PsmdGeometry} [geometrie] - Géométrie de la zone
     * @property {Object} [source] - Source de l'image
     * @property {string} [source.imageBase64] - Image en base64
     * @property {string} [source.nomOriginal] - Nom original du fichier
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
     * @property {PsmdZoneTextQuill[]} zonesTextQuill - Zones texte Quill
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
     * Génère un élément <data_field> pour la section <data_fields>.
     * Chaque champ de fusion doit être déclaré pour que PrintShop Mail le reconnaisse.
     * 
     * @param {string} fieldName - Nom du champ (sans les @)
     * @returns {string} XML du data_field
     */
    function generatePsmdDataField(fieldName) {
        return `<data_field>
<in_use>yes</in_use>
<n>${escapeXmlPsmd(fieldName)}</n>
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
<n>Ne rien intégrer</n>
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
     * Extrait tous les champs de fusion et génère la section <variables>.
     * Parcourt les zonesTextQuill pour extraire les marqueurs @XXX@.
     * 
     * @param {PsmdInput} jsonData - Données complètes de exportToWebDev()
     * @param {string|null} exportPrefix - Préfixe pour les noms de fichiers exportés (ex: "vdp_20251224_112005")
     * @returns {string} XML de la section <variables>
     * 
     * @example
     * const jsonData = { zonesTextQuill: [{ content_rtf: '@NOM@ @PRENOM@' }] };
     * generatePsmdVariables(jsonData, "vdp_20251224_112005");
     * // Retourne <variables> avec NOM, PRENOM et variables d'images
     */
    function generatePsmdVariables(jsonData, exportPrefix) {
        exportPrefix = exportPrefix || null;
        const allFields = new Set();
        
        // Parcourir les zones textQuill pour les champs de fusion
        const zonesTextQuill = jsonData.zonesTextQuill || [];
        for (let i = 0; i < zonesTextQuill.length; i++) {
            const zone = zonesTextQuill[i];
            if (zone.content_rtf) {
                const fields = extractMergeFields(zone.content_rtf);
                fields.forEach(function(field) { allFields.add(field); });
            }
        }
        
        // Collecter les variables d'images
        const imageVariables = [];
        const zonesImage = jsonData.zonesImage || [];
        for (let i = 0; i < zonesImage.length; i++) {
            const zone = zonesImage[i];
            const varName = zone.nom || zone.id || 'Image';
            
            // Générer le nom de fichier exporté si prefix fourni et image base64 présente
            var fileName = '';
            if (exportPrefix && zone.source && zone.source.imageBase64) {
                var ext = getExtensionFromBase64(zone.source.imageBase64);
                fileName = exportPrefix + '_' + zone.id + '.' + ext;
            } else {
                // Fallback sur le nom original si pas de base64 ou pas de prefix
                fileName = (zone.source && zone.source.nomOriginal) || 
                          (zone.source && zone.source.nomFichier) || 
                          (zone.source && zone.source.url) || '';
            }
            
            if (fileName) {
                imageVariables.push({ varName: varName, fileName: fileName });
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
            xml += generatePsmdImageVariable(imgVar.varName, imgVar.fileName) + '\n';
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
     * Gère les deux formats de données (zonesTextQuill vs autres zones).
     * 
     * @param {Object} zone - Données de la zone exportée
     * @returns {string} XML des propriétés communes
     */
    function generatePsmdObjectCommon(zone) {
        var guid = generateGuid();
        var name = escapeXmlPsmd(zone.nom || zone.id || 'Zone');
        // Export PSMD : toutes les zones sont verrouillées pour empêcher les modifications dans PrintShop Mail
        var locked = 'yes';
        
        // Gérer les deux formats de géométrie
        var geom = zone.geometry || zone.geometrie || {};
        var xMm = geom.x_mm !== undefined ? geom.x_mm : (geom.xMm !== undefined ? geom.xMm : 0);
        var yMm = geom.y_mm !== undefined ? geom.y_mm : (geom.yMm !== undefined ? geom.yMm : 0);
        var widthMm = geom.width_mm !== undefined ? geom.width_mm : 
                     (geom.largeur_mm !== undefined ? geom.largeur_mm : 
                     (geom.largeurMm !== undefined ? geom.largeurMm : 50));
        var heightMm = geom.height_mm !== undefined ? geom.height_mm : 
                      (geom.hauteur_mm !== undefined ? geom.hauteur_mm : 
                      (geom.hauteurMm !== undefined ? geom.hauteurMm : 20));
        
        // Conversion coordonnées mm → points
        var left = mmToPoints(xMm);
        var top = mmToPoints(yMm);
        var right = mmToPoints(xMm + widthMm);
        var bottom = mmToPoints(yMm + heightMm);
        
        // Couleurs de fond - gérer tous les formats (textQuill, image, barcode, qr)
        var fillColor = { c: 0, m: 0, y: 0, k: 0 };
        // Alpha : 0 si transparent, null si opaque (pas d'attribut alpha pour PrintShop Mail)
        var fillAlpha = 0;
        
        // Format textQuill : zone.style.bgColor / zone.style.bgColorCmyk
        if ((zone.style && zone.style.bgColor) || (zone.style && zone.style.bgColorCmyk)) {
            if (!(zone.style && zone.style.transparent)) {
                fillColor = getCmykForPsmd(zone.style.bgColor, zone.style.bgColorCmyk);
                fillAlpha = null;  // Opaque
            }
        }
        // Format image : zone.fond.couleurCmjn (WebDev utilise "couleurCmjn" pas "couleur" ni "couleurCmyk")
        else if (zone.fond && zone.fond.couleurCmjn) {
            if (!zone.fond.transparent) {
                fillColor = getCmykForPsmd(null, zone.fond.couleurCmjn);
                fillAlpha = null;  // Opaque
            }
        }
        // Format barcode : zone.couleurFondCmjn (WebDev utilise "Cmjn" pas "Cmyk")
        else if (zone.couleurFondCmjn) {
            if (!zone.transparent) {
                // couleurFondCmjn est au format 0-100, getCmykForPsmd attend null pour hex et l'objet CMYK en 2e param
                fillColor = getCmykForPsmd(null, zone.couleurFondCmjn);
                fillAlpha = null;  // Opaque
            }
        }
        // Format QR : zone.couleurs.fondCmjn (WebDev utilise "fondCmjn" pas "fond" ni "fondCmyk")
        else if (zone.couleurs && zone.couleurs.fondCmjn) {
            // QR codes : toujours opaque si couleur définie (pas de flag transparent dans l'export)
            fillColor = getCmykForPsmd(null, zone.couleurs.fondCmjn);
            fillAlpha = null;  // Opaque
        }
        
        // Couleurs de bordure - utiliser CMJN natif si disponible
        // downgrade_k="1" par défaut requis par PrintShop Mail
        var borderColor = { c: 0, m: 0, y: 0, k: 1 };
        var borderSize = 0;
        
        // Mapping des styles de bordure Designer → PrintShop Mail
        // 0 = solid (plein), 1 = dotted (points), 2 = dashed (tirets)
        var BORDER_STYLE_MAP = {
            'solid': 0,
            'dotted': 1,
            'dashed': 2
        };
        
        // Lire le style de bordure depuis les données de la zone
        var borderStyleName = 'solid'; // défaut
        
        if (zone.bordure && zone.bordure.epaisseur) {
            borderSize = zone.bordure.epaisseur;
            borderColor = getCmykForPsmd(zone.bordure.couleur, zone.bordure.couleurCmyk, { c: 0, m: 0, y: 0, k: 1 });
            if (zone.bordure.style) {
                borderStyleName = zone.bordure.style;
            }
        } else if (zone.border && zone.border.width_px) {
            borderSize = zone.border.width_px;
            borderColor = getCmykForPsmd(zone.border.color, zone.border.colorCmyk, { c: 0, m: 0, y: 0, k: 1 });
            if (zone.border.style) {
                borderStyleName = zone.border.style;
            }
        }
        
        // Convertir en valeur PrintShop Mail (0 = solid par défaut)
        var borderStyle = BORDER_STYLE_MAP[borderStyleName] || 0;
        
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
        var rtfContent = zone.content_rtf || zone.contenu_rtf || '';
        var rtfBase64 = rtfToBase64(rtfContent);
        
        // Alignements - gérer les deux formats
        var hAlignValue = (zone.style && zone.style.align) || 
                         (zone.typographie && zone.typographie.alignement) || 'left';
        var vAlignValue = (zone.style && zone.style.valign) || 
                         (zone.typographie && zone.typographie.alignementVertical) || 'top';
        
        var hAlign = HALIGN_MAP[hAlignValue] || 2; // left par défaut
        var vAlign = VALIGN_MAP[vAlignValue] || 0; // top par défaut
        
        // Copyfitting
        var copyfitting = zone.copyfitting || {};
        var reduceToFit = (copyfitting.reduirePolice || (zone.style && zone.style.copyfit)) ? 'yes' : 'no';
        var minFontSize = copyfitting.tailleMin || 8;
        
        // Gestion lignes vides
        var emptyLines = zone.lignesVides || 0;
        
        // Couleur texte - utiliser CMJN natif si disponible
        var textColorHex = (zone.style && zone.style.color) || 
                          (zone.typographie && zone.typographie.couleur) || '#000000';
        var textColorCmyk = (zone.style && zone.style.colorCmyk) || 
                           (zone.typographie && zone.typographie.couleurCmyk) || null;
        var textColor = getCmykForPsmd(textColorHex, textColorCmyk, { c: 0, m: 0, y: 0, k: 1 });
        
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
     * 
     * @param {Object} zone - Données de la zone image exportée
     * @returns {string} XML complet de l'objet image
     */
    function generatePsmdImageObject(zone) {
        var name = escapeXmlPsmd(zone.nom || zone.id || 'Image');
        // Utiliser le nom exporté si disponible, sinon le nom original
        var fileName = zone.exportedFileName || 
                      (zone.source && zone.source.nomOriginal) || 
                      (zone.source && zone.source.nomFichier) || 
                      (zone.source && zone.source.url) || '';
        
        // Mode de redimensionnement
        var keepAspectRatio = ((zone.redimensionnement && zone.redimensionnement.mode === 'proportionnel') || 
                              (zone.redimensionnement && zone.redimensionnement.conserverRatio)) ? 'yes' : 'no';
        
        var xml = generatePsmdObjectCommon(zone);
        
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
        var psType;
        if (barcodeType === 'qr') {
            psType = 'QRCode';
        } else {
            // Récupérer le type depuis les données de la zone
            var designerType = zone.typeCodeBarres || zone.typeCode || 'code128';
            psType = BARCODE_TYPE_MAP[designerType.toLowerCase()] || 'Code128';
        }
        
        // Contenu du code-barres
        var data = zone.valeur || zone.contenu || '';
        
        var xml = generatePsmdObjectCommon(zone);
        
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
     * 
     * @param {Object} page - Données de la page avec zones regroupées
     * @param {number} pageIndex - Index de la page (0-based)
     * @param {number} pageWidthPt - Largeur de la page en points
     * @param {number} pageHeightPt - Hauteur de la page en points
     * @param {string} devmodeBase64 - DEVMODE encodé en Base64
     * @returns {string} XML de la section layout
     */
    function generatePsmdLayout(page, pageIndex, pageWidthPt, pageHeightPt, devmodeBase64) {
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
        
        // Générer les objets (zones) de la page
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
        
        // Ajouter les zones textQuill
        var zonesTextQuill = jsonData.zonesTextQuill || [];
        for (var t = 0; t < zonesTextQuill.length; t++) {
            addZone(zonesTextQuill[t], 'textQuill');
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
                name: (pages[pageNum - 1] && pages[pageNum - 1].name) || ('Page ' + pageNum)
            };
            xml += generatePsmdLayout(pageData, pageNum - 1, pageWidthPt, pageHeightPt, devmodeBase64) + '\n';
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
     *     zonesTextQuill: [],
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
        xml += generatePsmdPreferences() + '\n';
        xml += generatePsmdDatabaseSettings() + '\n';
        
        // Section layouts (pages avec zones)
        xml += generatePsmdLayouts(jsonData, largeurMm, hauteurMm, exportPrefix) + '\n';
        
        // Extraire tous les champs de fusion pour les passer aux sections finales
        var allMergeFields = [];
        var zonesTextQuill = jsonData.zonesTextQuill || [];
        for (var i = 0; i < zonesTextQuill.length; i++) {
            var zone = zonesTextQuill[i];
            if (zone.content_rtf) {
                var fields = extractMergeFields(zone.content_rtf);
                for (var j = 0; j < fields.length; j++) {
                    if (allMergeFields.indexOf(fields[j]) === -1) {
                        allMergeFields.push(fields[j]);
                    }
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

