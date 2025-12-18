# Prompt de Reprise - Phase 9 : Export PSMD (PrintShop Mail)

## 📅 Date de la session précédente : 18 décembre 2025

---

## 🎯 Contexte du Projet

### Projet Marketeam Designer
Éditeur VDP (Variable Data Publishing) web qui crée des documents personnalisés pour production PrintShop Mail. Le Designer fonctionne comme iframe dans une application WebDev, communiquant via postMessage.

### Stack technique
- HTML/CSS/JavaScript (monolithique)
- Quill.js pour l'édition WYSIWYG
- bwip-js pour les codes-barres
- Material Icons pour l'interface

### Fichiers principaux
- `script.js` : ~15 900 lignes (logique principale)
- `index.html` : ~1 700 lignes (interface)
- `style.css` : ~3 400 lignes (styles)

---

## ✅ Phases terminées

| Phase | Description | Statut |
|-------|-------------|--------|
| 1-4 | Toolbars flottantes (texte, image, barcode, qrcode) | ✅ |
| 5 | Toolbar-data (champs de fusion) | À faire |
| 6 | Sidebar POC | À faire |
| 7 | Nettoyage final | À faire |
| 8 | Suppression type 'text' legacy | ✅ |
| **9** | **Export PSMD** | **EN COURS** |

---

## 📊 État de la Phase 9 (Export PSMD)

### Étapes terminées ✅

| Étape | Description | Statut |
|-------|-------------|--------|
| 9.1 | Fonctions utilitaires (mmToPoints, rgbToCmyk, rtfToBase64, extractMergeFields, generateGuid, formatIsoDateTime, escapeXmlPsmd) | ✅ |
| 9.2 | generateWindowsDevmode (toHexLE16, hexToBase64) | ✅ |
| 9.3 | Templates XML sections statiques (generatePsmdInfo, generatePsmdPrinter, generatePsmdPreferences, generatePsmdDatabaseSettings, generatePsmdFooterSections, generatePsmdColor, generatePsmdVariable) | ✅ |
| 9.4 | Génération objets zones (BARCODE_TYPE_MAP, HALIGN_MAP, VALIGN_MAP, generatePsmdObjectCommon, generatePsmdTextObject, generatePsmdImageObject, generatePsmdBarcodeObject, generatePsmdObject) | ✅ |
| 9.5 | Extraction variables + génération layouts (generatePsmdVariables, generatePsmdLayout, generatePsmdLayouts) | ✅ |
| 9.6 | Fonction principale + bouton UI (exportToPsmd, btn-export-psmd) | ✅ |
| 9.6 BIS | Correction structure données (adaptation au format exportToWebDev) | ✅ |

### Étape en cours 🔄

| Étape | Description | Statut |
|-------|-------------|--------|
| 9.7 | Tests et ajustements | 🔄 EN COURS |

---

## 🐛 Problème actuel

### Symptôme
Le fichier PSMD généré s'ouvre dans PrintShop Mail avec le bon format, mais **il y a des différences visuelles** entre le Designer et PrintShop Mail.

### Différences potentielles à investiguer
1. **Positionnement des zones** - Vérifier la conversion mm → points
2. **Tailles des zones** - Vérifier width/height
3. **Formatage du texte** - Vérifier le RTF généré (polices, tailles, couleurs)
4. **Alignements** - Vérifier le mapping des alignements
5. **Couleurs** - Vérifier la conversion RGB → CMYK
6. **Bordures/Fonds** - Vérifier les propriétés de style

### Action à faire
Comparer zone par zone :
1. Exporter un document simple avec 1 zone texte, 1 image, 1 QR, 1 code-barres
2. Ouvrir le .psmd généré dans un éditeur texte
3. Comparer avec un .psmd de référence créé manuellement dans PrintShop Mail
4. Identifier les différences spécifiques

---

## 📁 Fichiers de référence du projet

### Dans /mnt/project/
- `Exemple_Printshop.psmd` - Exemple de fichier PrintShop avec zones
- `documentation_communication_iframe_webdev.md` - Doc communication iframe
- `a4_template_recto.jpg` et `a4_template_verso.jpg` - Templates visuels

### Cahier des charges
- `Phase9_Export_PSMD_CahierDesCharges.md` - Spécifications complètes de l'export

---

## 🔧 Structure de exportToWebDev() (IMPORTANT)

Le format de sortie de `exportToWebDev()` est **différent** de ce qu'on pourrait attendre :

```javascript
{
    pages: [
        { id: 'page-1', name: 'Recto', format: 'Custom', width: 794, height: 1123 }
        // PAS de propriété 'zones' ici !
    ],
    formatDocument: { largeurMm: 210, hauteurMm: 297 },
    
    // Les zones sont dans des tableaux SÉPARÉS par type :
    zonesTextQuill: [
        {
            id: 'quill-xxx',
            type: 'textQuill',
            page: 1,  // Numéro de page
            geometry: { x_mm, y_mm, width_mm, height_mm },  // Attention: 'geometry' pas 'geometrie'
            content_rtf: '{\\rtf1...}',
            content_quill: { ops: [...] },
            style: { font, size_pt, color, align, valign, bgColor, transparent, locked, copyfit },
            border: { width_px, color, style }
        }
    ],
    zonesCodeBarres: [
        {
            id: 'barcode-xxx' ou 'qrcode-xxx',
            page: 1,
            geometrie: { x_mm, y_mm, largeur_mm, hauteur_mm },  // Attention: 'geometrie' ici
            typeCode: 'code128' ou 'qrcode',
            valeur: 'contenu du code'
        }
    ],
    zonesImage: [
        {
            id: 'image-xxx',
            page: 1,
            geometrie: { x_mm, y_mm, largeur_mm, hauteur_mm },
            source: { url, nomOriginal, nomFichier },
            redimensionnement: { mode, conserverRatio }
        }
    ],
    policesUtilisees: [...]
}
```

**Note critique** : Les noms de propriétés diffèrent selon le type de zone !
- `zonesTextQuill` utilise `geometry` et `style`
- `zonesCodeBarres` et `zonesImage` utilisent `geometrie`

---

## 📝 Conversions implémentées

### mm → points (72 dpi)
```javascript
function mmToPoints(mm) {
    return mm * 72 / 25.4;  // ≈ mm * 2.834645669
}
```

### RGB → CMYK
```javascript
function rgbToCmyk(hexColor) {
    // Normalisation hex, extraction RGB, calcul CMYK
    // K = 1 - max(R,G,B)
    // C = (1-R-K)/(1-K), M = (1-G-K)/(1-K), Y = (1-B-K)/(1-K)
}
```

### RTF → Base64
```javascript
function rtfToBase64(rtfString) {
    return btoa(unescape(encodeURIComponent(rtfString)));
}
```

### Mapping alignements
```javascript
const HALIGN_MAP = { 'left': 2, 'center': 4, 'right': 1, 'justify': 6 };
const VALIGN_MAP = { 'top': 0, 'middle': 4, 'bottom': 6 };
```

### Mapping codes-barres
```javascript
const BARCODE_TYPE_MAP = {
    'code128': 'Code128', 'code39': 'Code39', 'ean13': 'EAN13',
    'ean8': 'EAN8', 'upca': 'UPCA', 'upce': 'UPCE',
    'itf14': 'ITF14', 'interleaved2of5': 'Interleaved2of5',
    'datamatrix': 'DataMatrix', 'qrcode': 'QRCode'
};
```

---

## 🧪 Tests à effectuer

### Test 1 : Zone texte simple
1. Créer une zone texte avec "Bonjour @NOM@"
2. Appliquer : police Roboto, taille 14pt, couleur rouge, alignement centré
3. Exporter PSMD
4. Vérifier dans PrintShop : position, taille, police, couleur, alignement

### Test 2 : Zone image
1. Ajouter une image
2. Vérifier : position, taille, nom de fichier

### Test 3 : Zone QR Code
1. Ajouter un QR avec valeur "https://example.com"
2. Vérifier : position, taille, type QRCode, valeur

### Test 4 : Zone Code-barres
1. Ajouter un code-barres Code128
2. Vérifier : position, taille, type, valeur

### Test 5 : Variables
1. Ajouter du texte avec @SOCIETE@, @NOM@, @ADRESSE@
2. Vérifier que la section `<variables>` contient les 3 champs

---

## 📋 Commande pour reprendre

```
Je reprends le projet Marketeam Designer, Phase 9 (Export PSMD).

Contexte :
- L'export PSMD fonctionne (fichier généré, ouvert dans PrintShop Mail)
- Les zones apparaissent dans PrintShop Mail
- MAIS il y a des différences visuelles entre le Designer et PrintShop

Action demandée :
1. M'aider à identifier les différences spécifiques
2. Corriger les problèmes de conversion/mapping
3. Valider l'export avec les tests définis

Fichiers à disposition :
- script.js (version corrigée avec étape 9.6 BIS)
- Un fichier .psmd généré à analyser
- Fichiers de référence dans /mnt/project/
```

---

## ⚠️ Standards à rappeler en début de session Cursor

```markdown
## ⚠️ STANDARDS DE DOCUMENTATION À RESPECTER

Ce projet utilise une documentation JSDoc complète. Pour toute modification :

1. **Nouvelles fonctions** → Ajouter un bloc JSDoc complet
2. **Nouvelles propriétés** → Mettre à jour le @typedef correspondant
3. **Références DOM** → Déclarer en SECTION 1 uniquement

## ⚠️ STRUCTURE DU FICHIER SCRIPT.JS

| Type de code | Où le placer |
|--------------|--------------|
| `const xxx = document.getElementById()` | **SECTION 1 uniquement** |
| Constantes globales | Section 2 |
| Nouvelles fonctions | Près des fonctions similaires |
| Event listeners | Section 16 ou près des fonctions liées |

**SECTION 21** = Export PSMD (toutes les fonctions generatePsmd*)
```

---

## 🔗 Liens utiles

- Transcript complet Phase 8 : `/mnt/transcripts/2025-12-18-18-23-01-phase8-suppression-type-text.txt`
- Journal des transcripts : `/mnt/transcripts/journal.txt`

---

Bonne reprise demain ! 💪
