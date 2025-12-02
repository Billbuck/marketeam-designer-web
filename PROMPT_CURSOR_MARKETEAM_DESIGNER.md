# Projet : Intégration Marketeam Designer Web

## 1. CONTEXTE MÉTIER

### 1.1 Plateforme Marketeam (SaaS - WebDev)
Marketeam est une plateforme SaaS de marketing direct développée en **WebDev** permettant aux clients de programmer des campagnes de mailing courrier.

**Flux actuel :**
- Le client fournit sa base de données + ses documents PDF
- Chronodirect gère la production : impression, mise sous pli, affranchissement, dépôt La Poste

**Objectif du projet :**
Permettre aux clients de **personnaliser eux-mêmes leurs documents** (lettres, flyers, dépliants) avec des champs variables issus de leur base de données. Exemple : *"Cher Monsieur Michel Durand,"*

### 1.2 Chaîne de production
- **Logiciel de production** : PrintShop Mail (génération BAT JPG et production print)
- **Format d'échange** : Fichiers `.psmd` (XML structuré)
- **API PrintShop Mail** : Permet de générer un Bon À Tirer (JPG) à partir d'un fichier PSMD

### 1.3 Tunnel de commande (étapes concernées par le Designer)

| Étape | Action | Module |
|-------|--------|--------|
| 01 | Import BDD client | Marketeam (WebDev) |
| 02 | Analyse des en-têtes de colonnes | Marketeam (WebDev) |
| 03 | Choix enveloppe (type + format) | Marketeam (WebDev) |
| 04 | Sélection documents (Lettre A4, Flyer...) | Marketeam (WebDev) |
| 05 | Import PDF de fond de page | Marketeam (WebDev) |
| 06 | Conversion des fonds de page en JPG (Webdev) |
| 07 | Hebergement et conversion des polices (fonts) clients "Print" et "Web" (Webdev) |
| **08** | **Personnalisation des documents** | **Designer Web** ← CE PROJET |
| 09 | Génération fichier PSMD | Designer Web |
| 10 | Appel API PrintShop Mail → BAT (JPG) | Marketeam (WebDev) |
| 11 | Planification dépôt + modifications ultérieures | Marketeam (WebDev) |

---

## 2. ARCHITECTURE D'INTÉGRATION

```
┌──────────────────────────┐                         ┌──────────────────────────┐                         ┌─────────────────────┐
│      MARKETEAM           │                         │     DESIGNER WEB         │                         │   PRINTSHOP MAIL    │
│      (WebDev SaaS)       │                         │     (HTML/CSS/JS)        │                         │   (API BAT)         │
│                          │                         │                          │                         │                     │
│  • BDD client            │   Variables WebDev      │  • Éditeur de zones      │      Fichier PSMD       │  • Génère JPG BAT   │
│  • PDF fond de page      │ ──────────────────────► │  • Placement champs      │ ──────────────────────► │  • Production print │
│  • Config document       │   (webdev-bridge.js)    │  • Prévisualisation      │      (XML)              │                     │
│  • Colonnes disponibles  │ ◄────────────────────── │  • Export JSON/PSMD      │                         │                     │
│                          │   Layout JSON           │                          │                         │                     │
└──────────────────────────┘                         └──────────────────────────┘                         └─────────────────────┘
```

### Mode de communication : Variables WebDev synchronisées

Le Designer Web est **intégré directement dans une page WebDev** (pas en iframe). La communication se fait via l'API `NSPCS` de WebDev grâce au bridge `webdev-bridge.js`.

```javascript
// Lecture depuis WebDev
const colonnes = WebDevBridge.get("gsColonnesBDD");      // Liste des colonnes
const pdfFond = WebDevBridge.get("gsPdfFondPage");       // URL ou base64 du PDF
const layoutExistant = WebDevBridge.get("gsLayoutJSON"); // Layout précédent (mode édition)

// Écriture vers WebDev
WebDevBridge.set("gsLayoutJSON", JSON.stringify(layout));     // Layout sauvegardé
WebDevBridge.set("gsPSMD_XML", psmdXmlString);                // Export PSMD
WebDevBridge.set("gsDesignerStatut", "PRET");                 // Signal de fin
```

---

## 3. SPÉCIFICATIONS DES VARIABLES D'ÉCHANGE

### 3.1 Variables d'entrée (WebDev → Designer)

| Variable WebDev | Type | Description |
|-----------------|------|-------------|
| `gsColonnesBDD` | JSON string | Colonnes de la BDD client |
| `gsPdfFondRecto` | string | URL ou base64 du PDF fond page recto |
| `gsPdfFondVerso` | string | URL ou base64 du PDF fond page verso (optionnel) |
| `gsFormatDocument` | string | "A4", "A5", "DL", etc. |
| `gsTypeDocument` | string | "lettre", "flyer", "depliant" |
| `gsLayoutJSON` | JSON string | Layout existant (mode modification) ou vide |
| `gsSampleData` | JSON string | Exemple de données pour prévisualisation |

**Format de `gsColonnesBDD` :**
```json
[
  {"ordre": 1, "champ": "Civilite", "libelle": "Civilité", "type": "TXT"},
  {"ordre": 2, "champ": "Nom", "libelle": "Nom", "type": "TXT"},
  {"ordre": 3, "champ": "Prenom", "libelle": "Prénom", "type": "TXT"},
  {"ordre": 4, "champ": "Societe", "libelle": "Société", "type": "TXT"},
  {"ordre": 5, "champ": "Contact", "libelle": "Contact", "type": "TXT"},
  {"ordre": 6, "champ": "Adresse1", "libelle": "Adresse 1", "type": "TXT"},
  {"ordre": 7, "champ": "Adresse2", "libelle": "Adresse 2", "type": "TXT"},
  {"ordre": 8, "champ": "Adresse3", "libelle": "Adresse 3", "type": "TXT"},
  {"ordre": 9, "champ": "CodePostal", "libelle": "Code postal", "type": "CDP"},
  {"ordre": 10, "champ": "Ville", "libelle": "Ville", "type": "TXT"},
  {"ordre": 11, "champ": "Tel", "libelle": "Téléphone", "type": "TEL"},
  {"ordre": 12, "champ": "Portable", "libelle": "Portable", "type": "SMS"},
  {"ordre": 13, "champ": "Email", "libelle": "Email", "type": "EML"}
]
```

**Format de `gsSampleData` :**
```json
{
  "Civilite": "Monsieur",
  "Nom": "DURAND",
  "Prenom": "Michel",
  "Societe": "ACME SARL",
  "Contact": "M. Durand Michel",
  "Adresse1": "12 rue des Lilas",
  "Adresse2": "Bâtiment B",
  "Adresse3": "",
  "CodePostal": "75009",
  "Ville": "PARIS",
  "Tel": "01 23 45 67 89",
  "Portable": "06 12 34 56 78",
  "Email": "m.durand@acme.fr"
}
```

### 3.2 Variables de sortie (Designer → WebDev)

| Variable WebDev | Type | Description |
|-----------------|------|-------------|
| `gsLayoutJSON` | JSON string | Layout complet sauvegardé |
| `gsPSMD_XML` | string | Fichier PSMD généré (XML) |
| `gsDesignerStatut` | string | "EDITION", "PRET", "ERREUR" |
| `gsDesignerMessage` | string | Message d'erreur éventuel |

**Format de `gsLayoutJSON` (sortie) :**
```json
{
  "document_id": "doc_12345",
  "format": "A4",
  "type": "lettre",
  "generated_at": "2025-01-15T10:30:00Z",
  "scale_reference": "96 DPI",
  "pages": [
    {
      "page_id": "page-1",
      "page_name": "Recto",
      "background_pdf": "Ltr1-20251126174531328.pdf",
      "zones": [
        {
          "id": "zone-1",
          "type": "text",
          "geometry": {
            "x_mm": "20.00",
            "y_mm": "50.00",
            "width_mm": "170.00",
            "height_mm": "15.00"
          },
          "content": "{{Civilite}} {{Prenom}} {{Nom}}",
          "style": {
            "font": "Verdana",
            "size_pt": 12,
            "color": "#000000",
            "align": "left",
            "valign": "top",
            "lineHeight": 1.2,
            "bold": false,
            "copyfit": true,
            "transparent": true,
            "bgColor": null
          },
          "locked": false
        },
        {
          "id": "zone-2",
          "type": "qr",
          "geometry": {
            "x_mm": "170.00",
            "y_mm": "250.00",
            "width_mm": "25.00",
            "height_mm": "25.00"
          },
          "qr": {
            "color": "#000000",
            "background": "#ffffff"
          },
          "locked": false
        }
      ]
    },
    {
      "page_id": "page-2",
      "page_name": "Verso",
      "background_pdf": "Ltr1-20251126174531328.pdf",
      "zones": []
    }
  ]
}
```

---

## 4. FORMAT PSMD (PRINTSHOP MAIL)

### 4.1 Structure générale du fichier PSMD

Le fichier PSMD est un XML avec la structure suivante :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:noNamespaceSchemaLocation="http://www.printshopmail.com/support/xml/schemas/win/version-7_1_0/printshopmail7.xsd">
  <info>...</info>
  <printer>...</printer>
  <preferences>...</preferences>
  <database_settings>...</database_settings>
  <layouts>
    <layout>
      <!-- Page 1 (Recto) -->
      <dimensions>...</dimensions>
      <attributes>...</attributes>
      <object><!-- Fond de page --></object>
      <object><!-- Zone texte 1 --></object>
      <object><!-- Zone texte 2 --></object>
    </layout>
    <layout>
      <!-- Page 2 (Verso) -->
    </layout>
  </layouts>
  <variables>
    <variable>...</variable>
  </variables>
</document>
```

### 4.2 Unités et conversions

| Unité | Valeur |
|-------|--------|
| PSMD | Points (pt) - 1 pt = 1/72 pouce |
| Designer Web | Pixels (px) à 96 DPI |
| Export JSON | Millimètres (mm) |

**Formules de conversion :**
```javascript
// Designer (96 DPI) → PSMD (72 DPI / points)
const POINTS_PER_PIXEL = 72 / 96;  // 0.75
const psmPoints = pixelValue * POINTS_PER_PIXEL;

// Designer (pixels) → JSON (mm)
const MM_PER_PIXEL = 25.4 / 96;  // 0.2645833...
const mmValue = pixelValue * MM_PER_PIXEL;

// Dimensions A4 en points PSMD
const A4_WIDTH_PT = 595.27559;   // 210mm
const A4_HEIGHT_PT = 841.88977;  // 297mm
```

### 4.3 Structure d'un objet texte PSMD

```xml
<object>
  <identifier>{GUID-UNIQUE}</identifier>
  <n>[NomDeLaZone]</n>
  <locked>yes|no</locked>
  <knockout>no</knockout>
  <border_size>0</border_size>
  <border_style>0</border_style>
  <fillcolor colorspace="CMYK" alpha="0|1">
    <component>0</component><component>0</component><component>0</component><component>0</component>
  </fillcolor>
  <bordercolor colorspace="CMYK">
    <component>0</component><component>0</component><component>0</component><component>0</component>
  </bordercolor>
  <rotation>0</rotation>
  <bounds left="X1_PT" top="Y1_PT" right="X2_PT" bottom="Y2_PT"/>
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
  </anchor>
  <text_object>
    <rtf_data>BASE64_ENCODED_RTF</rtf_data>
    <emptylines_property>1</emptylines_property>
    <horizontal_alignment>0|1|2</horizontal_alignment>  <!-- 0=gauche, 1=centre, 2=droite -->
    <vertical_alignment>0|2|4</vertical_alignment>      <!-- 0=haut, 2=milieu, 4=bas -->
    <vertical_text>no</vertical_text>
    <textcolor colorspace="CMYK">...</textcolor>
    <cmyk_output>no</cmyk_output>
    <copy_fitting>
      <reduce_to_fit>yes|no</reduce_to_fit>
      <fontsize_minimum>6</fontsize_minimum>
      <allow_line_breaks>yes|no</allow_line_breaks>
    </copy_fitting>
  </text_object>
</object>
```

### 4.4 Variables dans le RTF

Les champs de fusion sont référencés avec la syntaxe `@NOM_VARIABLE@` dans le contenu RTF :

```
@SOCIETE@
@CONTACT@
@ADRESSE1@
@ADRESSE2@
@ADRESSE3@
@CDPVILLE@
```

**Mapping Designer → PSMD :**
| Designer `{{xxx}}` | PSMD `@XXX@` |
|--------------------|--------------|
| `{{Civilite}}` | `@CIVILITE@` |
| `{{Nom}}` | `@NOM@` |
| `{{Prenom}}` | `@PRENOM@` |
| `{{Societe}}` | `@SOCIETE@` |
| `{{CodePostal}} {{Ville}}` | `@CDPVILLE@` |

### 4.5 Structure d'un objet image (fond de page)

```xml
<object>
  <identifier>{GUID}</identifier>
  <n>[Fond de page1]</n>
  <locked>yes</locked>
  <bounds left="0" top="0" right="595.27559" bottom="841.88976"/>
  <image_object>
    <scale>2</scale>
    <keep_aspect_ratio>yes</keep_aspect_ratio>
    <horizontal_alignment>4</horizontal_alignment>
    <vertical_alignment>4</vertical_alignment>
    <variable_name>[Fond de page1]</variable_name>
    <default_folder>D:\...\Upload\</default_folder>
    <file_name>MonDocument.pdf</file_name>
    <pdf_pagenumber_expression>1</pdf_pagenumber_expression>
  </image_object>
</object>
```

### 4.6 Section Variables

```xml
<variables>
  <variable>
    <n>SOCIETE</n>
    <global>no</global>
    <expression>"ACME SARL"</expression>
    <Formatting>3</Formatting>
    <Locale_ID>1036</Locale_ID>
    <!-- ... autres paramètres de formatage ... -->
  </variable>
  <variable>
    <n>NOM</n>
    <global>no</global>
    <expression>"DURAND"</expression>
    <!-- ... -->
  </variable>
</variables>
```

---

## 5. CODE EXISTANT À ADAPTER

### 5.1 Fichiers du projet Designer Web

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `index.html` | ~280 | Interface utilisateur |
| `style.css` | ~450 | Styles de l'éditeur |
| `script.js` | ~1760 | Logique principale |
| `webdev-bridge.js` | ~200 | Bridge de communication WebDev |

### 5.2 Points d'adaptation identifiés

| Fichier | Ligne(s) | Modification requise |
|---------|----------|---------------------|
| `script.js` | 67 | `MERGE_FIELDS` codé en dur → charger depuis `gsColonnesBDD` |
| `script.js` | 116-118 | `pages[].image` (JPG) → accepter PDF via pdf.js |
| `script.js` | 1460-1558 | Génération JSON → ajouter export `gsPSMD_XML` |
| `script.js` | nouveau | Fonction `generatePSMD()` pour créer le XML |
| `script.js` | nouveau | Fonction `loadFromWebDev()` pour initialisation |
| `script.js` | nouveau | Fonction `saveToWebDev()` pour sauvegarde |
| `index.html` | head | Ajouter import `webdev-bridge.js` et `pdf.js` |

### 5.3 Structure actuelle de documentState

```javascript
let documentState = {
    currentPageIndex: 0,
    pages: [
        { id: 'page-1', name: 'Recto', image: 'a4_template_recto.jpg', zones: {} },
        { id: 'page-2', name: 'Verso', image: 'a4_template_verso.jpg', zones: {} }
    ],
    zoneCounter: 0
};
```

**À adapter pour :**
```javascript
let documentState = {
    document_id: null,           // ID de la campagne Marketeam
    format: 'A4',                // Format du document
    type: 'lettre',              // Type de document
    currentPageIndex: 0,
    pages: [
        { 
            id: 'page-1', 
            name: 'Recto', 
            backgroundPdf: null,     // URL ou base64 du PDF
            backgroundImage: null,   // Image générée depuis le PDF (pour affichage)
            zones: {} 
        },
        { 
            id: 'page-2', 
            name: 'Verso', 
            backgroundPdf: null,
            backgroundImage: null,
            zones: {} 
        }
    ],
    zoneCounter: 0,
    mergeFields: [],             // Colonnes dynamiques depuis WebDev
    sampleData: {}               // Données exemple pour prévisualisation
};
```

---

## 6. LIVRABLES ATTENDUS

### Phase 1 : Initialisation et communication WebDev
- [ ] Créer fonction `initFromWebDev()` qui lit les variables WebDev au chargement
- [ ] Adapter `MERGE_FIELDS` pour être dynamique depuis `gsColonnesBDD`
- [ ] Charger le layout existant depuis `gsLayoutJSON` (mode modification)
- [ ] Implémenter signal de statut via `gsDesignerStatut`

### Phase 2 : Gestion des PDF de fond
- [ ] Intégrer pdf.js pour le rendu des PDF
- [ ] Modifier `loadCurrentPage()` pour convertir PDF → canvas/image
- [ ] Gérer le multi-page PDF (recto/verso)

### Phase 3 : Export vers WebDev
- [ ] Créer fonction `saveToWebDev()` qui écrit `gsLayoutJSON`
- [ ] Implémenter sauvegarde automatique (debounced) à chaque modification
- [ ] Ajouter bouton "Valider" qui passe le statut à "PRET"

### Phase 4 : Génération PSMD
- [ ] Créer fonction `generatePSMD()` retournant le XML complet
- [ ] Implémenter conversion `{{xxx}}` → `@XXX@` pour les variables
- [ ] Générer le RTF encodé base64 pour chaque zone texte
- [ ] Calculer les coordonnées en points (conversion px → pt)
- [ ] Écrire le résultat dans `gsPSMD_XML`

### Phase 5 : Tests et finalisation
- [ ] Test du cycle complet : chargement → édition → sauvegarde → PSMD
- [ ] Test du mode modification (rechargement d'un layout)
- [ ] Validation du BAT généré par l'API PrintShop Mail
- [ ] Documentation du mapping variables

---

## 7. FONCTIONS À IMPLÉMENTER

### 7.1 Initialisation depuis WebDev

```javascript
/**
 * Initialise le Designer depuis les variables WebDev
 * À appeler au DOMContentLoaded
 */
function initFromWebDev() {
    // 1. Charger les colonnes de la BDD
    const colonnesJSON = WebDevBridge.get("gsColonnesBDD");
    if (colonnesJSON) {
        const colonnes = JSON.parse(colonnesJSON);
        documentState.mergeFields = colonnes.map(c => ({
            champ: c.champ,
            libelle: c.libelle,
            type: c.type
        }));
        // Mettre à jour l'UI des champs de fusion
        updateMergeFieldsUI();
    }
    
    // 2. Charger les données exemple
    const sampleJSON = WebDevBridge.get("gsSampleData");
    if (sampleJSON) {
        documentState.sampleData = JSON.parse(sampleJSON);
    }
    
    // 3. Charger les PDF de fond
    documentState.pages[0].backgroundPdf = WebDevBridge.get("gsPdfFondRecto");
    documentState.pages[1].backgroundPdf = WebDevBridge.get("gsPdfFondVerso");
    
    // 4. Charger le layout existant (mode modification)
    const layoutJSON = WebDevBridge.get("gsLayoutJSON");
    if (layoutJSON && layoutJSON.trim() !== '') {
        loadExistingLayout(JSON.parse(layoutJSON));
    }
    
    // 5. Charger le format et type
    documentState.format = WebDevBridge.get("gsFormatDocument") || 'A4';
    documentState.type = WebDevBridge.get("gsTypeDocument") || 'lettre';
    documentState.document_id = WebDevBridge.get("gsDocumentId");
    
    // 6. Signaler que le Designer est prêt
    WebDevBridge.set("gsDesignerStatut", "EDITION");
    
    // 7. Charger et afficher la première page
    loadCurrentPage();
}
```

### 7.2 Sauvegarde vers WebDev

```javascript
/**
 * Sauvegarde le layout actuel vers WebDev
 * @param {boolean} final - Si true, passe le statut à "PRET"
 */
function saveToWebDev(final = false) {
    // 1. Générer le JSON du layout
    const layoutJSON = generateLayoutJSON();
    WebDevBridge.set("gsLayoutJSON", JSON.stringify(layoutJSON));
    
    // 2. Générer le PSMD
    const psmdXML = generatePSMD();
    WebDevBridge.set("gsPSMD_XML", psmdXML);
    
    // 3. Mettre à jour le statut
    if (final) {
        WebDevBridge.set("gsDesignerStatut", "PRET");
    }
    
    console.log("Layout sauvegardé vers WebDev");
}

// Sauvegarde automatique debounced
let saveTimeout = null;
function autoSaveToWebDev() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveToWebDev(false), 1000);
}
```

### 7.3 Génération PSMD (squelette)

```javascript
/**
 * Génère le fichier PSMD complet
 * @returns {string} XML PSMD
 */
function generatePSMD() {
    const layouts = documentState.pages.map((page, pageIndex) => {
        return generateLayoutXML(page, pageIndex);
    }).join('\n');
    
    const variables = generateVariablesXML();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:noNamespaceSchemaLocation="http://www.printshopmail.com/support/xml/schemas/win/version-7_1_0/printshopmail7.xsd">
${generateInfoXML()}
${generatePrinterXML()}
${generatePreferencesXML()}
${generateDatabaseSettingsXML()}
<layouts>
${layouts}
</layouts>
<variables>
${variables}
</variables>
</document>`;
}

/**
 * Génère le XML d'un layout (une page)
 */
function generateLayoutXML(page, pageIndex) {
    const objects = [];
    
    // 1. Objet fond de page
    objects.push(generateBackgroundObjectXML(page, pageIndex));
    
    // 2. Objets zones de texte
    for (const [id, data] of Object.entries(page.zones)) {
        if (data.type === 'text') {
            objects.push(generateTextObjectXML(id, data));
        } else if (data.type === 'qr') {
            objects.push(generateQRObjectXML(id, data));
        }
    }
    
    return `<layout>
<dimensions>
  <size x="595.27559" y="841.88977"/>
  <automatic_size>yes</automatic_size>
</dimensions>
<attributes>
  <n>1¤${pageIndex + 1}</n>
  <condition_expression>Print</condition_expression>
  <copies_expression>1</copies_expression>
</attributes>
${objects.join('\n')}
</layout>`;
}

/**
 * Convertit le contenu avec {{xxx}} en RTF avec @XXX@
 */
function contentToRTF(content, style) {
    // Remplacer {{xxx}} par @XXX@
    let rtfContent = content.replace(/\{\{(\w+)\}\}/g, (match, field) => {
        return `@${field.toUpperCase()}@`;
    });
    
    // Générer le RTF
    const fontName = style.font || 'Verdana';
    const fontSize = (style.size_pt || 12) * 2; // RTF utilise demi-points
    const bold = style.bold ? '\\b' : '';
    
    const rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1036{\\fonttbl{\\f0\\fnil ${fontName};}}
{\\colortbl ;\\red0\\green0\\blue0;}
{\\*\\generator Marketeam Designer;}\\viewkind4\\uc1\\pard\\cf1\\f0\\fs${fontSize}${bold} ${rtfContent}\\par
}`;
    
    // Encoder en base64
    return btoa(unescape(encodeURIComponent(rtf)));
}

/**
 * Convertit pixels (96 DPI) en points PSMD (72 DPI)
 */
function pxToPoints(px) {
    return (px * 72 / 96).toFixed(5);
}
```

---

## 8. CONTRAINTES TECHNIQUES

### 8.1 Environnement
- Le Designer est **intégré dans une page WebDev** (pas en iframe séparée)
- Communication via `NSPCS` (API WebDev) grâce à `webdev-bridge.js`
- Compatible navigateurs modernes (Chrome, Firefox, Edge)

### 8.2 Performance
- Chargement initial < 3 secondes
- Sauvegarde auto toutes les secondes (debounced)
- Rendu PDF fluide via pdf.js

### 8.3 Cohérence des unités
- **Affichage Designer** : pixels à 96 DPI
- **Export JSON** : millimètres
- **Export PSMD** : points (72 DPI)

### 8.4 Dépendances à ajouter
```html
<!-- PDF.js pour le rendu des PDF -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>

<!-- WebDev Bridge -->
<script src="webdev-bridge.js"></script>
```

---

## 9. FICHIERS JOINTS AU PROJET

Les fichiers suivants sont fournis et doivent être analysés :

1. **`index.html`** - Interface utilisateur actuelle du Designer
2. **`style.css`** - Styles CSS de l'éditeur
3. **`script.js`** - Logique JavaScript principale (~1760 lignes)
4. **`webdev-bridge.js`** - Bridge de communication avec WebDev
5. **`Exemple_Printshop.psmd`** - Exemple de fichier PSMD de référence

---

## 10. INSTRUCTIONS POUR L'AGENT CURSOR

### Ordre de développement recommandé

1. **Lire et analyser** tous les fichiers fournis
2. **Commencer par l'initialisation** : fonction `initFromWebDev()` et chargement des colonnes dynamiques
3. **Adapter les champs de fusion** : remplacer `MERGE_FIELDS` statique
4. **Implémenter le rendu PDF** : intégrer pdf.js pour les fonds de page
5. **Créer la sauvegarde WebDev** : fonction `saveToWebDev()` avec auto-save
6. **Développer la génération PSMD** : la partie la plus complexe
7. **Tester le cycle complet**

### Points d'attention

- **Ne pas casser l'existant** : le Designer fonctionne déjà, adapter progressivement
- **Respecter les unités** : attention aux conversions px/mm/pt
- **Tester le RTF** : le format RTF base64 est critique pour PrintShop Mail
- **Gérer les erreurs** : toujours vérifier si les variables WebDev existent avant de les lire

### Questions à poser si nécessaire

- Format exact du QR Code dans PSMD ?
- Gestion des polices embarquées ?
- Comportement si une variable WebDev est vide ?

---

## 11. EXEMPLE DE SESSION DE TEST

```javascript
// Simulation des variables WebDev pour test local
window.NSPCS = {
    NSChamps: {
        oGetPageCourante: () => ({
            xviGetVariable: (nom) => ({
                m_iValeur: { m_tValeur: mockData[nom] }
            })
        })
    }
};

const mockData = {
    gsColonnesBDD: JSON.stringify([
        {champ: "Civilite", libelle: "Civilité", type: "TXT"},
        {champ: "Nom", libelle: "Nom", type: "TXT"},
        {champ: "Prenom", libelle: "Prénom", type: "TXT"}
    ]),
    gsSampleData: JSON.stringify({
        Civilite: "Monsieur",
        Nom: "DURAND",
        Prenom: "Michel"
    }),
    gsPdfFondRecto: "https://example.com/fond_recto.pdf",
    gsLayoutJSON: ""
};
```

---

**FIN DU PROMPT**

*Ce document constitue le cahier des charges complet pour l'intégration du module Marketeam Designer Web avec la plateforme SaaS Marketeam et PrintShop Mail.*
