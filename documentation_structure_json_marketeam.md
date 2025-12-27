# Structure JSON - Échange WebDev → Designer Marketeam

## Vue d'ensemble

Ce document décrit la structure JSON utilisée pour initialiser le Designer Marketeam depuis la plateforme WebDev.

---

## 1. Identification

```json
"identification": {
  "nomProjet": "string",      // Nom du projet affiché dans le Designer
  "typeDocument": "string",   // Lettre, Flyer, Dépliant, Invitation, etc.
  "idDocument": "string",     // Identifiant unique du document
  "idEnveloppe": "string",    // Identifiant de l'enveloppe associée (peut être vide)
  "nombrePages": "integer"    // Nombre de pages du document (1, 2, 4, etc.)
}
```

**Types de document supportés** : Lettre, Flyer, Dépliant, Invitation, Carte postale, Brochure, Chéquier, Plaquette, Enveloppe

---

## 2. Format du document

```json
"formatDocument": {
  "libelle": "string",        // Ex: "A4 Portrait", "DL Paysage"
  "largeurMm": "number",      // Largeur en millimètres
  "hauteurMm": "number",      // Hauteur en millimètres
  "fondPerdu": {
    "actif": "boolean",       // Impression à fond perdu
    "tailleMm": "number"      // Taille du fond perdu en mm (généralement 3)
  },
  "margeSecurite": "number",  // Marge de sécurité en mm (zone visuelle)
  "impressionRectoVerso": "boolean",  // Document recto-verso
  "traitsCoupe": {
    "actif": "boolean",       // Afficher les traits de coupe
    "tailleMm": "number"      // Taille des traits de coupe en mm
  }
}
```

---

## 3. Champs de fusion

```json
"champsFusion": [
  {
    "code": "string",         // Code technique (ex: "NOM", "CIVILITE")
    "libelle": "string",      // Libellé affiché (ex: "Nom", "Civilité")
    "ordre": "integer",       // Ordre d'affichage dans la liste
    "typeChamp": "string"     // Type de champ
  }
]
```

### Valeurs pour `typeChamp`

| Valeur | Description |
|--------|-------------|
| `TXT` | Donnée texte de la BDD |
| `SYS` | Variable système (ex: SEQUENTIEL) |
| `IMG` | Nom de fichier image (pour images variables) |

**Syntaxe dans le contenu** : `@CODE_CHAMP@` (ex: `@NOM@`, `@CIVILITE@`)

---

## 4. Données d'aperçu

```json
"donneesApercu": [
  {
    "CODE_CHAMP1": "valeur1",
    "CODE_CHAMP2": "valeur2"
  }
]
```

- Jusqu'à 50 échantillons pour prévisualisation
- Les codes correspondent aux `champsFusion.code`

---

## 5. Polices

```json
"polices": {
  "googleFonts": [
    {
      "nom": "string",        // Nom de la police (ex: "Roboto")
      "variantes": [
        {
          "style": "string",  // "regular", "bold", "italic", "bolditalic"
          "urlTtf": "string"  // URL du fichier TTF hébergé
        }
      ]
    }
  ],
  "policesClient": [
    {
      "nom": "string",        // Nom de la police personnalisée
      "variantes": [
        {
          "style": "string",
          "urlTtf": "string"
        }
      ]
    }
  ]
}
```

**Important** : Les polices sont hébergées en TTF/OTF (pas via l'API Google Fonts) pour garantir un rendu identique entre l'aperçu web et l'impression PrintShop Mail.

---

## 6. Pages

```json
"pages": [
  {
    "numero": "integer",      // Numéro de page (1, 2, etc.)
    "nom": "string",          // Nom affiché (ex: "Recto", "Verso")
    "fondPdf": "string",      // URL du fond PDF (pour PrintShop Mail)
    "fondJpg": "string"       // URL du fond JPG (pour le Designer)
  }
]
```

---

## 7. Zones de texte

```json
"zonesTexte": [
  {
    "id": "string",           // Identifiant unique (ex: "zone-1")
    "page": "integer",        // Numéro de page
    "nom": "string",          // Nom affiché dans l'interface
    "niveau": "integer",      // Ordre d'empilement (z-index)
    "verrouille": "boolean",  // Zone non modifiable par l'utilisateur
    "rotation": "integer",    // Rotation en degrés (0, 90, 180, 270)
    
    "geometrie": {
      "xMm": "number",        // Position X en mm
      "yMm": "number",        // Position Y en mm
      "largeurMm": "number",  // Largeur en mm
      "hauteurMm": "number"   // Hauteur en mm
    },
    
    "contenu": "string",      // Texte brut avec variables @CHAMP@
    
    "formatage": [            // Formatage partiel (annotations)
      {
        "debut": "integer",   // Position de début (caractère)
        "fin": "integer",     // Position de fin (caractère)
        "styles": {
          "gras": "boolean",
          "couleur": "string" // Couleur hexadécimale
        }
      }
    ],
    
    "style": {
      "police": "string",     // Nom de la police
      "taillePt": "number",   // Taille en points
      "couleurCmjn": {        // Couleur CMJN
        "c": "number",        // Cyan (0-100)
        "m": "number",        // Magenta (0-100)
        "y": "number",        // Jaune (0-100)
        "k": "number"         // Noir (0-100)
      },
      "gras": "boolean",      // Gras par défaut
      "interligne": "number", // Interligne (ex: 1.2)
      "alignementH": "string",// "left", "center", "right", "justify"
      "alignementV": "string" // "top", "middle", "bottom"
    },
    
    "fond": {
      "transparent": "boolean",
      "couleurCmjn": {        // Couleur de fond CMJN
        "c": "number", "m": "number", "y": "number", "k": "number"
      }
    },
    
    "bordure": {
      "epaisseur": "number",  // Épaisseur en pixels (0 = pas de bordure)
      "couleurCmjn": {        // Couleur CMJN
        "c": "number", "m": "number", "y": "number", "k": "number"
      },
      "style": "string"       // "solid", "dashed"
    },
    
    "copyfitting": {
      "actif": "boolean",     // Réduction auto de la taille
      "tailleMinimum": "number", // Taille minimum en points
      "autoriserRetourLigne": "boolean"
    },
    
    "supprimerLignesVides": "boolean" // Supprimer lignes vides si champ vide
  }
]
```

---

## 8. Upload d'images

```json
"uploadImage": {
  "urlDestination": "string",       // URL API pour l'upload
  "extensionsAutorisees": ["array"],// Extensions autorisées
  "tailleMaxMo": "number"           // Taille max en Mo
}
```

---

## 9. Zones Image

```json
"zonesImage": [
  {
    "id": "string",           // Identifiant unique
    "page": "integer",        // Numéro de page
    "nom": "string",          // Nom affiché
    "niveau": "integer",      // Ordre d'empilement
    "verrouille": "boolean",  // Zone non modifiable
    "rotation": "integer",    // Rotation (0, 90, 180, 270)
    
    "geometrie": {
      "xMm": "number",
      "yMm": "number",
      "largeurMm": "number",
      "hauteurMm": "number"
    },
    
    "source": {
      "type": "string",       // "fixe", "variable", "importee"
      
      // Si type = "fixe" ou "importee"
      "urlImage": "string",   // URL de l'image
      "urlApercu": "string",  // URL miniature pour aperçu
      
      // Si type = "variable"
      "champSource": "string",// Code du champ BDD
      "dossierBase": "string",// URL du dossier contenant les images
      "extension": "string",  // Extension (.jpg, .png, etc.)
      "urlApercu": "string"   // Image exemple pour aperçu
    },
    
    "affichage": {
      "modeEchelle": "string",      // Mode de mise à l'échelle
      "conserverProportions": "boolean",
      "alignementH": "string",      // "left", "center", "right"
      "alignementV": "string",      // "top", "middle", "bottom"
      "pagePdf": "integer"          // Numéro de page si PDF multi-pages
    },
    
    "fond": {
      "transparent": "boolean",
      "couleurCmjn": {        // Couleur de fond CMJN
        "c": "number", "m": "number", "y": "number", "k": "number"
      }
    },
    
    "bordure": {
      "epaisseur": "number",
      "couleurCmjn": {        // Couleur CMJN
        "c": "number", "m": "number", "y": "number", "k": "number"
      },
      "style": "string"
    }
  }
]
```

### Valeurs pour `source.type`

| Valeur | Description |
|--------|-------------|
| `fixe` | Image statique avec URL définie |
| `variable` | Nom de fichier vient d'un champ BDD : `dossierBase + @CHAMP@ + extension` |
| `importee` | Image uploadée par l'utilisateur dans le Designer |

### Valeurs pour `affichage.modeEchelle`

| Valeur | Équiv. PSMD | Description |
|--------|-------------|-------------|
| `aucun` | 0 | Taille originale de l'image |
| `etirer` | 1 | Étirer pour remplir la zone (déforme l'image) |
| `proportionnel` | 2 | Ajuster à la zone en conservant les proportions |
| `remplir` | 3 | Remplir la zone en conservant les proportions (rogne si nécessaire) |

---

## 10. Zones Code-barres

```json
"zonesCodeBarres": [
  {
    "id": "string",           // Identifiant unique
    "page": "integer",        // Numéro de page
    "nom": "string",          // Nom affiché
    "niveau": "integer",      // Ordre d'empilement
    "verrouille": "boolean",  // Zone non modifiable
    "rotation": "integer",    // Rotation (0, 90, 180, 270)
    
    "geometrie": {
      "xMm": "number",
      "yMm": "number",
      "largeurMm": "number",
      "hauteurMm": "number"
    },
    
    "typeCode": "string",     // Type de code-barres
    "contenu": "string",      // Données avec variables @CHAMP@
    
    "couleurs": {
      "codeCmjn": {           // Couleur du code CMJN
        "c": "number", "m": "number", "y": "number", "k": "number"
      },
      "fondCmjn": {           // Couleur de fond CMJN
        "c": "number", "m": "number", "y": "number", "k": "number"
      }
    }
  }
]
```

### Valeurs pour `typeCode`

| Valeur | Description |
|--------|-------------|
| `QRCode` | QR Code (2D) |
| `DataMatrix` | DataMatrix (2D) |
| `PDF417` | PDF417 (2D) |
| `Code128` | Code 128 (1D) |
| `Code39` | Code 39 (1D) |
| `EAN13` | EAN-13 (1D) |
| `EAN8` | EAN-8 (1D) |
| `EanUcc128` | EAN/UCC-128 / GS1-128 (1D) |
| `UPCA` | UPC-A (1D) |
| `UPCE` | UPC-E (1D) |

---

## Valeurs par défaut recommandées

### Format CMJN

Toutes les couleurs sont désormais au format CMJN avec des valeurs entières de 0 à 100 :
```json
{ "c": 0, "m": 0, "y": 0, "k": 100 }  // Noir
{ "c": 0, "m": 0, "y": 0, "k": 0 }    // Blanc
```

### Propriétés communes

| Propriété | Valeur par défaut |
|-----------|-------------------|
| `niveau` | 1 |
| `verrouille` | false |
| `rotation` | 0 |
| `bordure.epaisseur` | 0 |
| `bordure.couleurCmjn` | `{c:0, m:0, y:0, k:100}` (noir) |
| `bordure.style` | "solid" |

### Zones de texte

| Propriété | Valeur par défaut |
|-----------|-------------------|
| `style.police` | "Roboto" |
| `style.taillePt` | 10 |
| `style.couleurCmjn` | `{c:0, m:0, y:0, k:100}` (noir) |
| `style.gras` | false |
| `style.interligne` | 1.2 |
| `style.alignementH` | "left" |
| `style.alignementV` | "top" |
| `fond.transparent` | true |
| `fond.couleurCmjn` | `{c:0, m:0, y:0, k:0}` (blanc) |
| `copyfitting.actif` | false |
| `copyfitting.tailleMinimum` | 6 |
| `copyfitting.autoriserRetourLigne` | false |
| `supprimerLignesVides` | false |

### Zones image

| Propriété | Valeur par défaut |
|-----------|-------------------|
| `source.type` | "fixe" |
| `affichage.modeEchelle` | "proportionnel" |
| `affichage.conserverProportions` | true |
| `affichage.alignementH` | "center" |
| `affichage.alignementV` | "middle" |
| `affichage.pagePdf` | 1 |
| `fond.couleurCmjn` | `{c:0, m:0, y:0, k:0}` (blanc) |
| `bordure.couleurCmjn` | `{c:0, m:0, y:0, k:100}` (noir) |

### Zones code-barres / QR

| Propriété | Valeur par défaut |
|-----------|-------------------|
| `typeCode` | "QRCode" |
| `couleurs.codeCmjn` | `{c:0, m:0, y:0, k:100}` (noir) |
| `couleurs.fondCmjn` | `{c:0, m:0, y:0, k:0}` (blanc) |

---

# SORTIE : Designer → WebDev

Structure JSON renvoyée lors de l'enregistrement du document.

## Structure complète

```json
{
  "idDocument": "string",
  "dateModification": "string (ISO 8601)",
  
  "policesUtilisees": [
    {
      "nom": "string",
      "variantes": ["string"]
    }
  ],
  
  "zonesTexte": [...],
  "zonesImage": [...],
  "zonesCodeBarres": [...]
}
```

## Détail des blocs

### Identification

```json
{
  "idDocument": "DOC-12345",
  "dateModification": "2024-12-02T14:30:00Z"
}
```

### Polices utilisées

Liste des polices réellement utilisées dans le document (pour optimisation PDF).

```json
"policesUtilisees": [
  {
    "nom": "Roboto",
    "variantes": ["regular", "bold"]
  },
  {
    "nom": "Verdana",
    "variantes": ["regular"]
  }
]
```

> **Note** : Seul le nom est renvoyé. WebDev retrouve les URLs TTF dans son catalogue.

### Zones

Les tableaux `zonesTexte`, `zonesImage` et `zonesCodeBarres` contiennent **toutes les zones** du document (pas seulement les zones modifiées).

La structure de chaque zone est identique à celle définie dans l'entrée (sections 7, 9 et 10).

## Règles

| Règle | Description |
|-------|-------------|
| Toutes les zones | Renvoyer l'intégralité des zones, pas seulement les modifiées |
| Zones supprimées | Ne pas inclure les zones supprimées (elles disparaissent simplement) |
| Nouvelles zones | Incluses avec un nouvel `id` généré par le Designer |
| Polices | Extraites automatiquement des propriétés `style.police` de toutes les zones |

---

## Exemple d'utilisation du formatage partiel

Pour afficher "Cher **Monsieur DURAND**," avec le nom en gras :

```json
{
  "contenu": "Cher @CIVILITE@ @NOM@,",
  "formatage": [
    {
      "debut": 5,
      "fin": 21,
      "styles": {
        "gras": true
      }
    }
  ]
}
```

---

## Notes importantes

1. **Coordonnées** : Toutes les positions et dimensions sont en millimètres (mm)
2. **Origine** : Le point (0,0) est en haut à gauche de la page
3. **Niveau** : Plus le nombre est élevé, plus la zone est au-dessus
4. **Variables** : Syntaxe `@CODE@` compatible PrintShop Mail
5. **Polices** : Fichiers TTF hébergés pour cohérence aperçu/impression
