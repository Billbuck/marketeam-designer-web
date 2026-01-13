# Cahier des Charges : Intégration Designer Marketeam dans WebDev

**Version** : 1.0  
**Date** : 13 janvier 2026  
**Auteur** : Michel (chef de projet) / Claude (orchestrateur)

---

## 1. Vue d'ensemble

### 1.1 Contexte

Le **Designer Marketeam** est un éditeur VDP (Variable Data Publishing) web permettant de créer des documents personnalisés pour le publipostage. Il fonctionne en **iframe** dans une application WebDev et communique via `postMessage`.

### 1.2 Architecture clé

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FLUX DE DONNÉES                                                            │
│                                                                             │
│  WebDev génère JSON de structure                                            │
│         ↓                                                                   │
│  Designer (iframe) - Utilisateur personnalise                               │
│         ↓                                                                   │
│  Designer renvoie JSON au parent (postMessage)                              │
│         ↓                                                                   │
│  WebDev génère le PSMD côté serveur                                         │
│         ↓                                                                   │
│  WebDev appelle l'API PSM pour générer le BAT (aperçu JPG)                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Point crucial** : La génération PSMD se fait **côté WebDev**, pas dans le Designer. Le Designer ne produit/reçoit que du JSON.

### 1.3 Deux contextes d'utilisation

| Contexte | Utilisateur | Mode Designer | Objectif |
|----------|-------------|---------------|----------|
| **Hors tunnel** | Responsable marketing | `template` | Créer des templates avec zones verrouillées |
| **Tunnel (Page 3)** | Client final | `standard` | Personnaliser à partir d'un template ou from scratch |

---

## 2. Tunnel de commande

### 2.1 Pages du tunnel

| Page | Nom | Designer impliqué |
|------|-----|-------------------|
| 1 | Bases de données | Non |
| 2 | Contenants | Non |
| **3** | **Contenus** | **OUI** |
| 4 | Affranchissement | Non |
| 5 | Devis | Non |

### 2.2 Page 3 : Contenus - Flux détaillé

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGE 3 - PERSONNALISATION CONTENUS                                         │
│                                                                             │
│  Pour chaque élément (enveloppe, doc 1, doc 2, ...) :                       │
│                                                                             │
│  1. WebDev prépare le JSON (format, zones système, champs, échantillon)     │
│         ↓                                                                   │
│  2. WebDev envoie postMessage { action: 'load', ... }                       │
│         ↓                                                                   │
│  3. Designer affiche l'éditeur                                              │
│         ↓                                                                   │
│  4. Utilisateur personnalise (texte, images, codes-barres, QR)              │
│         ↓                                                                   │
│  5. Utilisateur clique "Valider" / "Aperçu"                                 │
│         ↓                                                                   │
│  6. WebDev envoie postMessage { action: 'export' }                          │
│         ↓                                                                   │
│  7. Designer renvoie { action: 'exported', data: jsonDocument }             │
│         ↓                                                                   │
│  8. WebDev génère le PSMD et appelle l'API PSM pour le BAT                  │
│         ↓                                                                   │
│  9. WebDev affiche le BAT à l'utilisateur                                   │
│         ↓                                                                   │
│  10. Si OK → Élément suivant ou Page 4                                      │
│      Si modifications → Retour étape 4                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Spécifications des messages postMessage

### 3.1 Format standard

```json
{
    "action": "nomAction",
    "data": { ... },
    "timestamp": 1736780400000
}
```

### 3.2 Récapitulatif des actions

| Action | Direction | Description |
|--------|-----------|-------------|
| `load` | WebDev → Designer | Charger un document |
| `loaded` | Designer → WebDev | Confirmation chargement |
| `export` | WebDev → Designer | Demander l'export JSON |
| `exported` | Designer → WebDev | Retour du JSON exporté |
| `changed` | Designer → WebDev | Document modifié |
| `ready` | Designer → WebDev | Designer prêt |
| `ping` / `pong` | Bidirectionnel | Test de connexion |
| `updatePreviewData` | WebDev → Designer | Mise à jour échantillon |
| `previewDataUpdated` | Designer → WebDev | Confirmation mise à jour |
| `getPreviewStatus` | WebDev → Designer | État de l'aperçu |
| `previewStatus` | Designer → WebDev | Retour état aperçu |
| `setConstraints` | WebDev → Designer | Définir contraintes |
| `constraintsApplied` | Designer → WebDev | Confirmation contraintes |

---

## 4. Message `load` : WebDev → Designer

### 4.1 Structure complète

```json
{
    "action": "load",
    "mode": "standard",
    "theme": "light",
    "policesDisponibles": [...],
    "constraints": {...},
    "data": {
        "identification": {...},
        "formatDocument": {...},
        "pages": [...],
        "champsFusion": [...],
        "donneesApercu": [...],
        "zonesTexte": [...],
        "zonesCodeBarres": [...],
        "zonesQR": [...],
        "zonesImage": [...]
    }
}
```

### 4.2 Propriétés de premier niveau

| Propriété | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `action` | string | ✅ | Toujours `"load"` |
| `mode` | string | Non | `"standard"` (défaut) ou `"template"` |
| `theme` | string | Non | `"light"` (défaut), `"dark"`, ou `"minimal"` |
| `policesDisponibles` | array | Non | Liste des polices disponibles |
| `constraints` | object | Non | Contraintes globales du document |
| `data` | object | ✅ | Données du document |

### 4.3 `data.identification`

```json
{
    "idDocument": "doc-12345",
    "nomDocument": "Carte de visite Jean Dupont",
    "dateCreation": "2026-01-13T10:30:00Z"
}
```

### 4.4 `data.formatDocument`

```json
{
    "largeurMm": 210,
    "hauteurMm": 297,
    "fondPerdu": {
        "actif": true,
        "valeurMm": 3
    },
    "traitsCoupe": {
        "actif": false
    },
    "margeSecurite": 5,
    "surfaceMaxImageMm2": 10000,
    "pourcentageMaxImage": 50
}
```

**Correspondance avec StructDocument WebDev** :

| WebDev (StructDocument) | Designer JSON |
|-------------------------|---------------|
| `LargeurFerme` | `formatDocument.largeurMm` |
| `HauteurFerme` | `formatDocument.hauteurMm` |
| `EstFondPerdu` | `formatDocument.fondPerdu.actif` |

### 4.5 `data.pages`

```json
[
    {
        "numero": 1,
        "nom": "Recto",
        "urlFond": "https://cdn.marketeam.fr/uploads/fond-recto.jpg"
    },
    {
        "numero": 2,
        "nom": "Verso",
        "urlFond": ""
    }
]
```

### 4.6 `data.champsFusion`

Liste des champs disponibles pour la personnalisation (issus de `taaBaseChamp`).

```json
[
    { "nom": "Civilite", "libelle": "Civilité", "type": "TXT" },
    { "nom": "Nom", "libelle": "Nom", "type": "TXT" },
    { "nom": "Prenom", "libelle": "Prénom", "type": "TXT" },
    { "nom": "Adresse1", "libelle": "Adresse ligne 1", "type": "TXT" },
    { "nom": "Adresse2", "libelle": "Adresse ligne 2", "type": "TXT" },
    { "nom": "CodePostal", "libelle": "Code postal", "type": "TXT" },
    { "nom": "Ville", "libelle": "Ville", "type": "TXT" },
    { "nom": "Email", "libelle": "Email", "type": "TXT" },
    { "nom": "Champ1", "libelle": "Numéro client", "type": "TXT" }
]
```

**Règle de nommage** : Le `nom` correspond exactement à la colonne BDD (`Nom`, `Prenom`, `Adresse1`, etc.). Le Designer affiche le `libelle` dans l'UI et utilise `@NOM@` dans le contenu.

### 4.7 `data.donneesApercu`

Échantillon de données pour la prévisualisation de fusion (format WebDev).

```json
[
    {
        "enregistrement": {
            "Civilite": "M.",
            "Nom": "DUPONT",
            "Prenom": "Jean",
            "Adresse1": "123 rue de Paris",
            "CodePostal": "75001",
            "Ville": "PARIS",
            "Champ1": "CLI-001234"
        }
    },
    {
        "enregistrement": {
            "Civilite": "Mme",
            "Nom": "MARTIN",
            "Prenom": "Sophie",
            "Adresse1": "45 avenue des Champs",
            "CodePostal": "69001",
            "Ville": "LYON",
            "Champ1": "CLI-005678"
        }
    }
]
```

**Note** : Le Designer convertit ce format en format plat interne (objet clé-valeur direct).

### 4.8 `policesDisponibles`

```json
[
    {
        "nom": "Arial",
        "url": "https://cdn.marketeam.fr/fonts/arial.woff2",
        "boldUrl": "https://cdn.marketeam.fr/fonts/arial-bold.woff2",
        "italicUrl": "https://cdn.marketeam.fr/fonts/arial-italic.woff2",
        "boldItalicUrl": "https://cdn.marketeam.fr/fonts/arial-bold-italic.woff2"
    },
    {
        "nom": "Times New Roman",
        "url": "https://cdn.marketeam.fr/fonts/times.woff2"
    }
]
```

---

## 5. Zones système

### 5.1 Définition

Les **zones système** sont des zones prédéfinies par WebDev, injectées automatiquement à l'initialisation du Designer. Elles peuvent être :
- **Non modifiables** (position, contenu fixe)
- **Partiellement modifiables** (certaines propriétés verrouillées)

### 5.2 Liste des zones système

| Zone | Type | Usage | Contraintes |
|------|------|-------|-------------|
| Adresse expéditeur | `textQuill` | Adresse de l'expéditeur avec champs de fusion | Position et taille fixes |
| Affranchissement | `barcode` (DataMatrix) | Timbre électronique | Non déplaçable |
| Poste | `textQuill` | Mentions légales d'affranchissement | Non modifiable |
| Rapprochement | `barcode` (DataMatrix) | Code pour mise sous enveloppe | Non déplaçable |

### 5.3 Structure d'une zone système

```json
{
    "id": "zone-sys-adresse",
    "page": 1,
    "nom": "Adresse expéditeur",
    "systeme": true,
    "systemeLibelle": "Zone adresse",
    "verrouille": false,
    "contrainte": {
        "geometrie": {
            "deplacable": false,
            "redimensionnable": false
        },
        "style": {
            "policeModifiable": false,
            "tailleModifiable": false
        },
        "global": {
            "supprimable": false
        }
    },
    "geometrie": {
        "xMm": 20,
        "yMm": 50,
        "largeurMm": 80,
        "hauteurMm": 40
    },
    "contenu": "@Civilite@ @Prenom@ @Nom@\n@Adresse1@\n@CodePostal@ @Ville@",
    "style": {
        "police": "Arial",
        "taillePt": 10,
        "alignementH": "left",
        "alignementV": "top"
    }
}
```

---

## 6. Message `export` / `exported`

### 6.1 Requête WebDev → Designer

```json
{
    "action": "export"
}
```

### 6.2 Réponse Designer → WebDev

```json
{
    "action": "exported",
    "success": true,
    "data": {
        "identification": {...},
        "formatDocument": {...},
        "pages": [...],
        "zonesTexte": [...],
        "zonesCodeBarres": [...],
        "zonesQR": [...],
        "zonesImage": [...],
        "policesUtilisees": [...]
    }
}
```

### 6.3 Structure d'export d'une zone texte

```json
{
    "id": "zone-1",
    "page": 1,
    "nom": "Bloc adresse",
    "niveau": 1,
    "rotation": 0,
    "verrouille": false,
    "systeme": false,
    "imprimable": true,
    "supprimerLignesVides": 1,
    "geometrie": {
        "xMm": 20.5,
        "yMm": 50.3,
        "largeurMm": 80.0,
        "hauteurMm": 40.0
    },
    "contenu": "@Civilite@ @Prenom@ @Nom@\n@Adresse1@",
    "contenuRtf": "{\\rtf1\\ansi ...}",
    "quillDelta": { "ops": [...] },
    "formatage": [
        { "debut": 0, "fin": 10, "styles": { "gras": true } }
    ],
    "style": {
        "police": "Arial",
        "taillePt": 12,
        "couleurCmjn": { "c": 0, "m": 0, "y": 0, "k": 100 },
        "gras": false,
        "interligne": 1.2,
        "alignementH": "left",
        "alignementV": "top"
    },
    "fond": {
        "transparent": true,
        "couleurCmjn": { "c": 0, "m": 0, "y": 0, "k": 0 }
    },
    "bordure": {
        "epaisseur": 0,
        "couleurCmjn": { "c": 0, "m": 0, "y": 0, "k": 100 },
        "style": "solid"
    },
    "copyfitting": {
        "actif": false,
        "tailleMinimum": 6,
        "autoriserRetourLigne": true
    },
    "contrainte": {...}
}
```

### 6.4 Structure d'export d'une zone code-barres

```json
{
    "id": "zone-2",
    "page": 1,
    "nom": "Code client",
    "niveau": 2,
    "rotation": 0,
    "verrouille": false,
    "geometrie": {
        "xMm": 150.0,
        "yMm": 20.0,
        "largeurMm": 40.0,
        "hauteurMm": 15.0
    },
    "typeCodeBarres": "code128",
    "sourceType": "champ",
    "champFusion": "Champ1",
    "valeurStatique": "",
    "texteLisible": "dessous",
    "taillePolice": 8,
    "couleurCmjn": { "c": 0, "m": 0, "y": 0, "k": 100 },
    "couleurFondCmjn": { "c": 0, "m": 0, "y": 0, "k": 0 },
    "transparent": true
}
```

### 6.5 Structure d'export d'une zone QR / DataMatrix

```json
{
    "id": "zone-sys-affranch",
    "page": 1,
    "nom": "Affranchissement",
    "systeme": true,
    "niveau": 10,
    "rotation": 0,
    "verrouille": true,
    "geometrie": {
        "xMm": 175.0,
        "yMm": 10.0,
        "largeurMm": 25.0,
        "hauteurMm": 25.0
    },
    "typeCodeBarres": "datamatrix",
    "forme": "square",
    "sourceType": "champ",
    "champFusion": "CodeAffranchissement",
    "couleurCmjn": { "c": 0, "m": 0, "y": 0, "k": 100 },
    "transparent": true
}
```

### 6.6 `policesUtilisees` (export)

Liste des polices effectivement utilisées dans le document avec leurs variantes.

```json
[
    {
        "nom": "Arial",
        "urls": {
            "regular": "https://cdn.marketeam.fr/fonts/arial.woff2",
            "bold": "https://cdn.marketeam.fr/fonts/arial-bold.woff2",
            "italic": null,
            "boldItalic": null
        }
    }
]
```

---

## 7. Correspondance WebDev ↔ Designer

### 7.1 StructDocument ↔ formatDocument

| WebDev (StructDocument) | Designer JSON | Notes |
|-------------------------|---------------|-------|
| `LargeurFerme` | `formatDocument.largeurMm` | En mm |
| `HauteurFerme` | `formatDocument.hauteurMm` | En mm |
| `LargeurOuvert` | - | Non utilisé (pliage) |
| `HauteurOuvert` | - | Non utilisé (pliage) |
| `EstFondPerdu` | `formatDocument.fondPerdu.actif` | Boolean |
| `NombrePage` | `pages.length` | Nombre de pages |
| `EstRectoVerso` | `pages.length > 1` | Implicite |

### 7.2 structBalisePosition ↔ Zone geometrie

| WebDev (structBalisePosition) | Designer JSON | Notes |
|-------------------------------|---------------|-------|
| `PositionLeft` | `geometrie.xMm` | En mm |
| `PositionTop` | `geometrie.yMm` | En mm |
| `PositionRight - PositionLeft` | `geometrie.largeurMm` | Calculé |
| `PositionBottom - PositionTop` | `geometrie.hauteurMm` | Calculé |
| `Rotation` | `rotation` | En degrés |
| `AlignementHorizontal` | `style.alignementH` | Mapping entier → string |
| `AlignementVertical` | `style.alignementV` | Mapping entier → string |
| `FondCyan/Magenta/Yellow/Black` | `fond.couleurCmjn` | CMJN 0-1 → 0-100 |
| `BorderSize` | `bordure.epaisseur` | En pixels |
| `BorderStyle` | `bordure.style` | Mapping entier → string |
| `ContenuRtfBase64` | `contenuRtf` + `quillDelta` | Base64 → décodé |

### 7.3 taaBaseChamp ↔ champsFusion

| WebDev (structBaseChamp) | Designer JSON |
|--------------------------|---------------|
| `Champ` | `nom` |
| `Type` | `type` |
| Libellé (généré) | `libelle` |
| `Ordre` | Ordre dans le tableau |

---

## 8. Workflow complet Page 3

### 8.1 Initialisation (un élément)

```javascript
// WebDev - Code navigateur
const jsonInit = {
    action: "load",
    mode: "standard",
    policesDisponibles: [...], // Liste des polices
    data: {
        identification: {
            idDocument: stDocument.IdLettreContenu,
            nomDocument: stDocument.Designation
        },
        formatDocument: {
            largeurMm: stDocument.LargeurFerme,
            hauteurMm: stDocument.HauteurFerme,
            fondPerdu: { actif: stDocument.EstFondPerdu, valeurMm: 3 },
            margeSecurite: 5
        },
        pages: [
            { numero: 1, nom: "Recto", urlFond: stDocument.tabDocumentImage[1].CheminRelatif },
            { numero: 2, nom: "Verso", urlFond: stDocument.tabDocumentImage[2].CheminRelatif }
        ],
        champsFusion: ConvertirTaaBaseChampVersJson(stOperation.taaBaseChamp),
        donneesApercu: ExtraireEchantillonBDD(stOperation.tabBase, 10),
        zonesTexte: [...], // Zones existantes ou système
        zonesCodeBarres: [...] // Zones système (DataMatrix, etc.)
    }
};

EnvoyerMessageIframe(JSON.stringify(jsonInit));
```

### 8.2 Réception confirmation

```javascript
// WebDev - EcouterMessagesIframe callback
if (message.action === "loaded" && message.success) {
    console.log("Designer chargé avec succès");
} else if (message.action === "loaded" && !message.success) {
    console.error("Erreur chargement Designer:", message.error);
}
```

### 8.3 Export et génération BAT

```javascript
// WebDev - Bouton "Aperçu" ou "Valider"
EnvoyerMessageIframe('{"action": "export"}');

// Réception du JSON exporté
if (message.action === "exported" && message.success) {
    const jsonDocument = message.data;
    
    // 1. Stocker le JSON dans la structure opération
    stDocument.JsonDesigner = JSON.stringify(jsonDocument);
    
    // 2. Générer le PSMD côté serveur
    const cheminPsmd = GenererPsmdDepuisJson(jsonDocument);
    
    // 3. Appeler l'API PSM pour le BAT
    const urlBat = GenererBat(cheminPsmd, 1);
    
    // 4. Afficher le BAT
    AfficherImageBat(urlBat);
}
```

---

## 9. Gestion des erreurs

### 9.1 Erreurs de chargement

```json
{
    "action": "loaded",
    "success": false,
    "error": "Format document invalide : largeurMm manquant"
}
```

### 9.2 Erreurs d'export

```json
{
    "action": "exported",
    "success": false,
    "error": "Zone zone-3 : contenu invalide"
}
```

### 9.3 Codes d'erreur

| Code | Description | Action WebDev |
|------|-------------|---------------|
| `INVALID_FORMAT` | Format document invalide | Afficher message + vérifier données |
| `MISSING_FONTS` | Polices non trouvées | Vérifier `policesDisponibles` |
| `ZONE_ERROR` | Erreur sur une zone | Identifier la zone problématique |
| `EXPORT_FAILED` | Échec export général | Réessayer ou recharger |

---

## 10. Prochaines étapes

### 10.1 Côté WebDev

1. **Créer les procédures de conversion** :
   - `ConvertirTaaBaseChampVersJson()` : structBaseChamp → champsFusion JSON
   - `ConvertirStructBaliseVersJson()` : structBalise → zonesTexte/zonesCodeBarres JSON
   - `ExtraireEchantillonBDD()` : Extraire N enregistrements pour donneesApercu

2. **Créer les procédures de génération** :
   - `GenererPsmdDepuisJson()` : JSON Designer → fichier PSMD
   - `ConvertirZoneTexteVersPsmd()` : Zone texte JSON → XML PSMD
   - `ConvertirZoneCodeBarresVersPsmd()` : Zone barcode JSON → XML PSMD

3. **Stocker les JSON** :
   - Nouveau champ `JsonDesigner` dans StructDocument
   - Sauvegarde/restauration pour reprise du tunnel

### 10.2 Côté Designer

1. **Ajouter les actions manquantes** (si nécessaire) :
   - `validate` : Validation sans export (vérifier les zones obligatoires)
   - `setMode` : Changer de mode en cours de session

2. **Améliorer la gestion des zones système** :
   - Flag `systeme` pour identifier les zones non supprimables
   - Contraintes visuelles (icône cadenas, couleur différente)

### 10.3 Tests d'intégration

| Test | Description | Critères |
|------|-------------|----------|
| T1 | Chargement document vide | Designer s'affiche, format correct |
| T2 | Chargement avec zones système | Zones affichées, non supprimables |
| T3 | Export simple | JSON retourné, structure valide |
| T4 | Export avec champs de fusion | Champs @XX@ présents dans contenu |
| T5 | Génération BAT | Image JPEG générée, signature FFD8FF |
| T6 | Reprise tunnel | JSON rechargé identique |

---

## 11. Annexes

### 11.1 Types de codes-barres supportés

| Type | ID Designer | 1D/2D | Notes |
|------|-------------|-------|-------|
| Code 128 | `code128` | 1D | Alphanumérique |
| EAN-13 | `ean13` | 1D | 13 chiffres |
| EAN-8 | `ean8` | 1D | 8 chiffres |
| UPC-A | `upca` | 1D | 12 chiffres |
| Code 39 | `code39` | 1D | Alphanumérique majuscules |
| QR Code | `qrcode` | 2D | URL, texte, vCard |
| DataMatrix | `datamatrix` | 2D | Données compactes |

### 11.2 Alignements

| Valeur WebDev (entier) | Valeur Designer (string) |
|------------------------|--------------------------|
| 0 | `left` |
| 1 | `center` |
| 2 | `right` |
| 3 | `justify` |

| Valeur WebDev (entier) | Valeur Designer (string) |
|------------------------|--------------------------|
| 0 | `top` |
| 1 | `middle` |
| 2 | `bottom` |

### 11.3 Styles de bordure

| Valeur WebDev (entier) | Valeur Designer (string) |
|------------------------|--------------------------|
| 0 | (pas de bordure) |
| 1 | `solid` |
| 2 | `dashed` |
| 3 | `dotted` |

---

## Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-01-13 | Version initiale du cahier des charges |
