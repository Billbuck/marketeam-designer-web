# Cahier des Charges - Phase 9 : Export .psmd (PrintShop Mail)

## 1. Objectif

Permettre l'export du document créé dans le Marketeam Designer vers le format `.psmd` (XML PrintShop Mail), afin de produire des fichiers directement exploitables par PrintShop Mail pour la production de documents personnalisés (VDP - Variable Data Publishing).

---

## 2. Format de sortie

### 2.1 Structure du fichier .psmd

Le fichier `.psmd` est un fichier XML avec la structure suivante :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:noNamespaceSchemaLocation="http://www.printshopmail.com/support/xml/schemas/win/version-7_1_0/printshopmail7.xsd">
    <info>...</info>
    <printer>...</printer>
    <preferences>...</preferences>
    <database_settings>...</database_settings>
    <layouts>...</layouts>
    <variables>...</variables>
    <data_fields>...</data_fields>
    <template_folders>...</template_folders>
    <embedded_ps>...</embedded_ps>
</document>
```

### 2.2 Nom du fichier de sortie

```
template_vdp.psmd
```

---

## 3. Mapping des types de zones

| Type Designer | Balise PrintShop | Contenu spécifique |
|---------------|------------------|-------------------|
| `textQuill` | `<text_object>` | `<rtf_data>` encodé en Base64 |
| `image` | `<image_object>` | `<file_name>`, `<variable_name>` |
| `barcode` | `<plugin_object>` | `<Type>Code39</Type>` (ou autre type) |
| `qr` | `<plugin_object>` | `<Type>QRCode</Type>` |

---

## 4. Conversions

### 4.1 Coordonnées : mm → points

PrintShop Mail utilise des **points** (72 dpi) pour les coordonnées.

**Formule :**
```javascript
function mmToPoints(mm) {
    return mm * 72 / 25.4;  // ≈ mm * 2.834645669
}
```

**Vérification A4 :**
- 210 mm → 595.27559 points
- 297 mm → 841.88976 points

**Application aux zones :**
```xml
<bounds left="[x_mm converti]" top="[y_mm converti]" 
        right="[x_mm + width_mm converti]" bottom="[y_mm + height_mm converti]"/>
```

### 4.2 Couleurs : RGB → CMYK

Le Designer utilise des couleurs **RGB hexadécimales** (#RRGGBB).
PrintShop Mail utilise des couleurs **CMYK** (composants 0-1).

**Formule :**
```javascript
function rgbToCmyk(hexColor) {
    // Normaliser le format hex
    let hex = hexColor.replace('#', '');
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
```

**Format XML PrintShop :**
```xml
<fillcolor colorspace="CMYK" alpha="0" downgrade_c="[c]" downgrade_m="[m]" downgrade_y="[y]" downgrade_k="[k]">
    <component>[c]</component>
    <component>[m]</component>
    <component>[y]</component>
    <component>[k]</component>
</fillcolor>
```

### 4.3 RTF : Encodage Base64

Le Designer exporte déjà le contenu texte en RTF via la propriété `content_rtf`.

**Conversion :**
```javascript
function rtfToBase64(rtfString) {
    // Encoder en UTF-8 puis en Base64
    return btoa(unescape(encodeURIComponent(rtfString)));
}
```

**Format XML PrintShop :**
```xml
<rtf_data>[RTF encodé en Base64]</rtf_data>
```

---

## 5. Extraction des variables (champs de fusion)

### 5.1 Source

Les champs de fusion sont identifiés par les marqueurs `@NOM_CHAMP@` présents dans le contenu RTF des zones texte.

### 5.2 Algorithme d'extraction

```javascript
function extractMergeFields(rtfString) {
    const regex = /@([A-Za-z0-9_]+)@/g;
    const fields = new Set();
    let match;
    while ((match = regex.exec(rtfString)) !== null) {
        fields.add(match[1]); // Ajoute "NOM" sans les @
    }
    return Array.from(fields);
}
```

### 5.3 Format XML de sortie

Pour chaque champ de fusion extrait :
```xml
<variable>
    <n>[NOM_CHAMP]</n>
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
</variable>
```

---

## 6. Format de page et orientation

### 6.1 Source des dimensions

- Largeur : `documentState.formatDocument.largeurMm`
- Hauteur : `documentState.formatDocument.hauteurMm`

### 6.2 Calcul de l'orientation

```javascript
function getOrientation(largeurMm, hauteurMm) {
    // Portrait : hauteur > largeur → 1
    // Paysage : largeur > hauteur → 2
    return largeurMm > hauteurMm ? 2 : 1;
}
```

### 6.3 Section windows_devmode

La section `<windows_devmode>` contient un blob binaire DEVMODE encodé en Base64 qui définit le format d'impression.

**Paramètres encodés :**
- Orientation : 1 (Portrait) ou 2 (Paysage)
- Hauteur : en 1/10 mm (ex: A4 = 2970)
- Largeur : en 1/10 mm (ex: A4 = 2100)

**Algorithme de génération (basé sur procédure WinDev) :**
```javascript
function generateWindowsDevmode(orientation, hauteurMm, largeurMm) {
    // Orientation : 1 = Portrait, 2 = Paysage
    const nOrientation = orientation;
    
    // Convertir en 1/10 mm
    const hauteur10mm = Math.round(hauteurMm * 10);
    const largeur10mm = Math.round(largeurMm * 10);
    
    // Encoder en little-endian hex (2 octets chacun)
    const hexOrientation = toHexLE(nOrientation, 2);
    const hexHauteur = toHexLE(hauteur10mm, 2);
    const hexLargeur = toHexLE(largeur10mm, 2);
    
    // Template DEVMODE avec placeholders remplacés
    const hexTemplate = "FFFEFF16..." + hexOrientation + "00FF" + hexHauteur + hexLargeur + "...";
    
    // Convertir hex en Base64
    return hexToBase64(hexTemplate);
}

function toHexLE(value, bytes) {
    // Little-endian : octet faible d'abord
    const low = value % 256;
    const high = Math.floor(value / 256);
    return low.toString(16).padStart(2, '0') + high.toString(16).padStart(2, '0');
}
```

---

## 7. Sections statiques (valeurs fixes)

### 7.1 Section `<info>`

```xml
<info>
    <user_name>Marketeam Designer</user_name>
    <date_time>[Date/heure ISO courante]</date_time>
    <app_version>Version 7.2.4 (construire 7893)</app_version>
    <published>no</published>
</info>
```

### 7.2 Section `<printer>`

```xml
<printer>
    <printer_name>PrintShop Mail Printer</printer_name>
</printer>
```

### 7.3 Section `<preferences>` (extrait)

```xml
<preferences>
    <program>
        <default_tabstop_interval>36</default_tabstop_interval>
        <markers begin="@" end="@"/>
        <items_without_database>1</items_without_database>
    </program>
    <!-- ... reste des préférences statiques ... -->
</preferences>
```

### 7.4 Sections statiques complètes

Les sections suivantes sont copiées intégralement depuis le template :
- `<database_settings>`
- `<colormanagement>`
- `<ppconnect>`
- `<data_fields>`
- `<template_folders>`
- `<embedded_ps>`

---

## 8. Structure des objets (zones)

### 8.1 Propriétés communes

```xml
<object>
    <identifier>{GUID}</identifier>
    <n>[Nom de la zone]</n>
    <locked>[yes|no]</locked>
    <knockout>no</knockout>
    <border_size>[Épaisseur en points]</border_size>
    <border_style>[0=none, 2=solid]</border_style>
    <fillcolor>...</fillcolor>
    <bordercolor>...</bordercolor>
    <rotation>0</rotation>
    <bounds left="[x]" top="[y]" right="[x+w]" bottom="[y+h]"/>
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
    <!-- Contenu spécifique selon le type -->
</object>
```

### 8.2 Zone texte (`textQuill`)

```xml
<text_object>
    <backwardlink>{00000000-0000-0000-0000-000000000000}</backwardlink>
    <forwardlink>{00000000-0000-0000-0000-000000000000}</forwardlink>
    <rtf_data>[RTF en Base64]</rtf_data>
    <emptylines_property>[0|1|2]</emptylines_property>
    <horizontal_alignment>[0=left, 1=right, 2=left, 4=center, 6=justify]</horizontal_alignment>
    <vertical_alignment>[0=top, 4=center, 6=bottom]</vertical_alignment>
    <vertical_text>no</vertical_text>
    <textcolor>...</textcolor>
    <cmyk_output>no</cmyk_output>
    <copy_fitting>
        <reduce_to_fit>[yes|no]</reduce_to_fit>
        <fontsize_minimum>[taille min]</fontsize_minimum>
        <allow_line_breaks>yes</allow_line_breaks>
    </copy_fitting>
</text_object>
```

### 8.3 Zone image (`image`)

```xml
<image_object>
    <scale>2</scale>
    <keep_aspect_ratio>[yes|no]</keep_aspect_ratio>
    <horizontal_alignment>4</horizontal_alignment>
    <vertical_alignment>4</vertical_alignment>
    <variable_name>[Nom de la zone]</variable_name>
    <default_image_folder></default_image_folder>
    <default_folder></default_folder>
    <subfolders>no</subfolders>
    <file_name>[Nom du fichier image]</file_name>
    <pdf_pagenumber_expression>1</pdf_pagenumber_expression>
    <global_scope>no</global_scope>
    <filters>
        <two_color convert="no">
            <threshold>50</threshold>
            <backgroundcolor>...</backgroundcolor>
            <foregroundcolor>...</foregroundcolor>
        </two_color>
    </filters>
</image_object>
```

### 8.4 Zone code-barres / QR (`barcode`, `qr`)

```xml
<plugin_object title="Barcode" 
               assembly_name="Barcode.plugins.dll" 
               assembly_version="2.2.3.9078" 
               class_name="Barcode" 
               url="http://www.printshopmail.com/plugins/barcode/" 
               url_download_version="http://www.printshopmail.com/plugins/barcode/2_2/Barcode.plugins.dll">
    <property_bag>
        <Barcode>
            <RotationFixed>0</RotationFixed>
            <BoundsIsRotated>False</BoundsIsRotated>
            <Initialized>True</Initialized>
            <Type>[Code39|Code128|QRCode|EAN13|...]</Type>
            <Data>[Contenu du code-barres]</Data>
            <Alignment>0;0</Alignment>
        </Barcode>
    </property_bag>
</plugin_object>
```

---

## 9. Mapping des types de codes-barres

| Type Designer | Type PrintShop |
|---------------|----------------|
| `code128` | `Code128` |
| `code39` | `Code39` |
| `ean13` | `EAN13` |
| `ean8` | `EAN8` |
| `upca` | `UPCA` |
| `upce` | `UPCE` |
| `itf14` | `ITF14` |
| `interleaved2of5` | `Interleaved2of5` |
| `datamatrix` | `DataMatrix` |
| `qr` (type zone) | `QRCode` |

---

## 10. Mapping des alignements

### 10.1 Alignement horizontal

| Designer | PrintShop |
|----------|-----------|
| `left` | 2 |
| `center` | 4 |
| `right` | 1 |
| `justify` | 6 |

### 10.2 Alignement vertical

| Designer | PrintShop |
|----------|-----------|
| `top` | 0 |
| `middle` | 4 |
| `bottom` | 6 |

---

## 11. Interface utilisateur

### 11.1 Bouton d'export

Ajouter un bouton "Export PSMD" dans la barre d'outils principale, à côté du bouton "Export JSON" existant.

### 11.2 Comportement

1. Clic sur le bouton "Export PSMD"
2. Génération du fichier XML
3. Téléchargement automatique du fichier `template_vdp.psmd`

---

## 12. Dépendances

### 12.1 Données d'entrée

- `documentState` : État complet du document
- `documentState.pages[]` : Liste des pages avec leurs zones
- `documentState.formatDocument` : Dimensions du document (largeurMm, hauteurMm)
- `exportToWebDev()` : Fonction existante d'export JSON (pour récupérer le RTF)

### 12.2 Fonctions à créer

| Fonction | Description |
|----------|-------------|
| `exportToPsmd()` | Fonction principale d'export |
| `mmToPoints(mm)` | Conversion mm → points |
| `rgbToCmyk(hex)` | Conversion couleur RGB → CMYK |
| `rtfToBase64(rtf)` | Encodage RTF en Base64 |
| `extractMergeFields(rtf)` | Extraction des champs @XXX@ |
| `generateWindowsDevmode(orientation, hauteur, largeur)` | Génération du blob DEVMODE |
| `generateGuid()` | Génération d'un GUID unique |
| `formatIsoDateTime()` | Date/heure au format ISO |

---

## 13. Tests de validation

### 13.1 Tests unitaires

- [ ] Conversion mm → points (vérifier A4 : 210mm = 595.27559pt)
- [ ] Conversion RGB → CMYK (vérifier noir, blanc, rouge, vert, bleu)
- [ ] Encodage RTF Base64 (vérifier décodage)
- [ ] Extraction champs de fusion (vérifier @NOM@, @ADRESSE@, etc.)
- [ ] Génération DEVMODE (vérifier orientation et dimensions)

### 13.2 Tests d'intégration

- [ ] Export d'un document avec 1 zone texte
- [ ] Export d'un document avec 1 zone image
- [ ] Export d'un document avec 1 zone code-barres
- [ ] Export d'un document avec 1 zone QR
- [ ] Export d'un document multi-pages
- [ ] Export d'un document avec toutes les combinaisons

### 13.3 Test de validation PrintShop Mail

- [ ] Ouvrir le fichier .psmd dans PrintShop Mail
- [ ] Vérifier le positionnement des zones
- [ ] Vérifier le contenu texte (RTF)
- [ ] Vérifier les images
- [ ] Vérifier les codes-barres
- [ ] Vérifier les champs de fusion
- [ ] Générer un BAT et valider visuellement

---

## 14. Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-12-18 | Version initiale du cahier des charges |

---

## 15. Auteur

Cahier des charges rédigé pour le projet **Marketeam Designer** - Phase 9 : Export PrintShop Mail (.psmd)
