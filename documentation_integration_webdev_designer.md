# Documentation Intégration WebDev ↔ Designer VDP

**Version** : 1.0  
**Date** : 2 décembre 2025  
**Auteur** : Session Cursor AI  

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Format JSON d'échange](#3-format-json-déchange)
4. [Fonctions JavaScript exposées](#4-fonctions-javascript-exposées)
5. [Communication postMessage](#5-communication-postmessage)
6. [Exemples d'utilisation](#6-exemples-dutilisation)
7. [Commits et historique](#7-commits-et-historique)
8. [Prochaines étapes](#8-prochaines-étapes)

---

## 1. Vue d'ensemble

### Objectif

Permettre à une application WebDev d'intégrer un éditeur de templates VDP (Variable Data Printing) dans une iframe, avec communication bidirectionnelle pour :
- Charger un document existant (JSON → Designer)
- Récupérer le document modifié (Designer → JSON)
- Être notifié des modifications en temps réel

### Fonctionnalités implémentées

| Fonctionnalité | Description | Statut |
|----------------|-------------|--------|
| Import JSON | Charger un document complet depuis WebDev | ✅ |
| Export JSON | Exporter le document au format WebDev | ✅ |
| Champs de fusion | Liste dynamique depuis JSON, syntaxe `@CHAMP@` | ✅ |
| Polices dynamiques | Injection `@font-face` depuis URLs | ✅ |
| Communication iframe | postMessage bidirectionnel | ✅ |
| Zones texte | Import/export complet avec formatage partiel | ✅ |
| Zones code-barres | Import/export QR et autres types | ✅ |

---

## 2. Architecture

### Schéma général

```
┌─────────────────────────────────────────────────────────────┐
│  Application WebDev (Parent)                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  iframe id="designer-frame"                         │   │
│  │  src="designer/index.html"                          │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  Designer VDP                               │   │   │
│  │  │  - loadFromWebDev(json)                     │   │   │
│  │  │  - exportToWebDev()                         │   │   │
│  │  │  - postMessage communication                │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Boutons : [Charger] [Sauvegarder] [Prévisualiser]         │
└─────────────────────────────────────────────────────────────┘
```

### Fichiers du Designer

```
designer/
├── index.html          # Interface utilisateur
├── script.js           # Logique principale (~4000 lignes)
├── style.css           # Styles
├── webdev-bridge.js    # (Legacy) Communication variables WebDev
├── a4_template_recto.jpg
└── a4_template_verso.jpg
```

### Structure de données interne (`documentState`)

```javascript
documentState = {
    currentPageIndex: 0,
    zoneCounter: 5,
    
    // Métadonnées WebDev
    identification: {
        idDocument: "DOC-001",
        nomDocument: "Mailing Noël",
        dateCreation: "2025-12-02"
    },
    formatDocument: {
        fondPerdu: { actif: false, taille: 3 },
        traitsCoupe: { actif: false, taille: 5 }
    },
    champsFusion: [
        { nom: "NOM", type: "TXT" },
        { nom: "DATE_JOUR", type: "SYS" }
    ],
    polices: [
        { nom: "Roboto", url: "https://..." }
    ],
    
    // Pages et zones
    pages: [
        {
            id: "page-1",
            name: "Recto",
            image: "a4_template_recto.jpg",
            width: 794,   // pixels (A4 @ 96 DPI)
            height: 1123,
            zones: {
                "zone-1": { type: "text", content: "...", ... },
                "zone-2": { type: "qr", typeCode: "QRCode", ... }
            }
        }
    ]
}
```

---

## 3. Format JSON d'échange

### Structure complète

```json
{
    "identification": {
        "idDocument": "DOC-001",
        "nomDocument": "Mailing Noël 2025",
        "dateCreation": "2025-12-02T10:30:00"
    },
    "formatDocument": {
        "largeurMm": 210,
        "hauteurMm": 297,
        "fondPerdu": {
            "actif": false,
            "taille": 3
        },
        "traitsCoupe": {
            "actif": false,
            "taille": 5,
            "couleur": "#000000"
        }
    },
    "champsFusion": [
        { "nom": "CIVILITE", "type": "TXT" },
        { "nom": "NOM", "type": "TXT" },
        { "nom": "PRENOM", "type": "TXT" },
        { "nom": "DATE_JOUR", "type": "SYS" },
        { "nom": "LOGO", "type": "IMG" }
    ],
    "polices": [
        { "nom": "Roboto", "url": "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf" },
        { "nom": "Open Sans", "url": "https://fonts.gstatic.com/s/opensans/v35/..." }
    ],
    "pages": [
        {
            "numero": 1,
            "nom": "Recto",
            "urlFond": "https://server/templates/fond_recto.jpg"
        },
        {
            "numero": 2,
            "nom": "Verso",
            "urlFond": "https://server/templates/fond_verso.jpg"
        }
    ],
    "zonesTexte": [
        {
            "id": "zone-1",
            "page": 1,
            "nom": "Destinataire",
            "niveau": 1,
            "verrouille": false,
            "rotation": 0,
            "geometrie": {
                "xMm": 120,
                "yMm": 45,
                "largeurMm": 70,
                "hauteurMm": 30
            },
            "contenu": "@CIVILITE@ @PRENOM@ @NOM@\n@ADRESSE@\n@CP@ @VILLE@",
            "formatage": [
                {
                    "debut": 0,
                    "fin": 10,
                    "styles": {
                        "fontWeight": "bold",
                        "color": "#C41E3A"
                    }
                }
            ],
            "style": {
                "police": "Roboto",
                "taillePt": 10,
                "couleur": "#000000",
                "gras": false,
                "interligne": 1.2,
                "alignementH": "left",
                "alignementV": "top"
            },
            "fond": {
                "transparent": true,
                "couleur": "#FFFFFF"
            },
            "bordure": {
                "epaisseur": 0,
                "couleur": "#000000",
                "style": "solid"
            },
            "copyfitting": {
                "actif": false,
                "tailleMinimum": 6,
                "autoriserRetourLigne": true
            },
            "supprimerLignesVides": false
        }
    ],
    "zonesCodeBarres": [
        {
            "id": "zone-2",
            "page": 1,
            "nom": "QR Contact",
            "typeCode": "QRCode",
            "niveau": 2,
            "verrouille": false,
            "rotation": 0,
            "geometrie": {
                "xMm": 20,
                "yMm": 250,
                "largeurMm": 30,
                "hauteurMm": 30
            },
            "contenu": "https://example.com/contact/@ID_CLIENT@",
            "couleurs": {
                "code": "#000000",
                "fond": "#FFFFFF"
            }
        }
    ]
}
```

### Types de champs de fusion

| Type | Description | Exemple |
|------|-------------|---------|
| `TXT` | Champ texte standard | NOM, PRENOM, ADRESSE |
| `SYS` | Champ système (date, numéro) | DATE_JOUR, NUM_PAGE |
| `IMG` | Champ image variable | LOGO, PHOTO |

### Types de codes-barres supportés

| Type | Description |
|------|-------------|
| `QRCode` | QR Code 2D |
| `Code128` | Code-barres 1D haute densité |
| `EAN13` | Code-barres produit européen |
| `Code39` | Code-barres alphanumérique |
| `DataMatrix` | Code 2D compact |
| `PDF417` | Code 2D empilé |
| `EanUcc128` | Code logistique |
| `UPCA` | Code produit américain |
| `UPCE` | Code produit américain compact |

### Conversion des unités

```javascript
const MM_PER_PIXEL = 25.4 / 96; // ≈ 0.2646

// mm → pixels : valeur / MM_PER_PIXEL
// pixels → mm : valeur * MM_PER_PIXEL

// Exemple : 210mm → 794px
const pixels = 210 / 0.2646; // ≈ 794
```

---

## 4. Fonctions JavaScript exposées

### Import/Export

```javascript
// Charger un document JSON WebDev
window.loadFromWebDev(jsonData)
// Retourne : true si succès

// Exporter le document actuel
window.exportToWebDev()
// Retourne : objet JSON au format WebDev
```

### Communication iframe

```javascript
// Envoyer un message au parent WebDev
window.sendMessageToParent(message)
// message = { action: "...", data: {...} }

// Notifier le parent d'une modification
window.notifyParentOfChange()

// Vérifier si on est dans une iframe
window.isInIframe  // true ou false
```

### UI dynamique

```javascript
// Charger des polices dynamiquement
window.loadFontsFromJson([
    { nom: "Roboto", url: "https://..." }
])

// Mettre à jour le sélecteur de polices
window.updateFontSelectUI(polices)

// Mettre à jour les champs de fusion
window.updateMergeFieldsUI(champs)
```

---

## 5. Communication postMessage

### Messages Parent → Designer

| Action | Données | Description |
|--------|---------|-------------|
| `load` | `{ data: jsonDocument }` | Charger un document |
| `export` | - | Demander l'export |
| `getState` | - | Obtenir l'état interne |
| `ping` | - | Test de connexion |

### Messages Designer → Parent

| Action | Données | Description |
|--------|---------|-------------|
| `ready` | - | Designer initialisé |
| `loaded` | `{ success: bool, error?: string }` | Résultat du chargement |
| `exported` | `{ success: bool, data?: json }` | Données exportées |
| `state` | `{ data: documentState }` | État interne |
| `changed` | `{ timestamp: number }` | Document modifié |
| `pong` | - | Réponse au ping |

### Exemple côté WebDev (JavaScript)

```javascript
// Référence à l'iframe
var iframe = document.getElementById('designer-frame');

// Écouter les messages du Designer
window.addEventListener('message', function(event) {
    var msg = event.data;
    if (!msg || !msg.action) return;
    
    switch (msg.action) {
        case 'ready':
            console.log('Designer prêt !');
            chargerDocument();
            break;
            
        case 'exported':
            if (msg.success) {
                sauvegarderEnBase(msg.data);
            }
            break;
            
        case 'changed':
            activerBoutonSauvegarder();
            break;
    }
});

// Charger un document
function chargerDocument() {
    iframe.contentWindow.postMessage({
        action: 'load',
        data: documentJson
    }, '*');
}

// Demander l'export
function demanderExport() {
    iframe.contentWindow.postMessage({
        action: 'export'
    }, '*');
}
```

---

## 6. Exemples d'utilisation

### Test en console (mode standalone)

```javascript
// 1. Charger un document de test
const testDoc = {
    "identification": { "idDocument": "TEST-001" },
    "formatDocument": { "largeurMm": 210, "hauteurMm": 297 },
    "champsFusion": [
        { "nom": "NOM", "type": "TXT" },
        { "nom": "VILLE", "type": "TXT" }
    ],
    "polices": [
        { "nom": "Roboto", "url": "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf" }
    ],
    "pages": [
        { "numero": 1, "nom": "Recto", "urlFond": "a4_template_recto.jpg" }
    ],
    "zonesTexte": [{
        "id": "zone-1",
        "page": 1,
        "geometrie": { "xMm": 50, "yMm": 50, "largeurMm": 100, "hauteurMm": 30 },
        "contenu": "Bonjour @NOM@ de @VILLE@",
        "style": { "police": "Roboto", "taillePt": 14, "couleur": "#000000" },
        "fond": { "transparent": true }
    }],
    "zonesCodeBarres": []
};

loadFromWebDev(testDoc);

// 2. Modifier la zone visuellement...

// 3. Exporter
const exported = exportToWebDev();
console.log(JSON.stringify(exported, null, 2));
```

### Test postMessage (simulation)

```javascript
// Simuler un message du parent
window.postMessage({ action: 'ping' }, '*');
// Console : "📩 Message reçu: ping" puis "📤 Message envoyé: pong"

// Simuler un chargement
window.postMessage({ 
    action: 'load', 
    data: testDoc 
}, '*');

// Simuler une demande d'export
window.postMessage({ action: 'export' }, '*');
```

---

## 7. Commits et historique

| Commit | Description |
|--------|-------------|
| `e814d37` | Étapes 4-6 : Export JSON, champs fusion, polices @font-face |
| `3ff52dd` | Étape 7 : Communication postMessage |

### Fonctions ajoutées dans script.js

| Fonction | Ligne | Description |
|----------|-------|-------------|
| `convertZoneTexteFromJson()` | ~2853 | Convertit zone texte JSON → interne |
| `convertZoneCodeBarresFromJson()` | ~2925 | Convertit zone code-barres JSON → interne |
| `loadFromWebDev()` | ~2969 | Import complet JSON WebDev |
| `convertZoneTexteToJson()` | ~3200 | Convertit zone texte interne → JSON |
| `convertZoneCodeBarresToJson()` | ~3280 | Convertit zone code-barres interne → JSON |
| `exportToWebDev()` | ~3320 | Export complet vers JSON WebDev |
| `loadFontsFromJson()` | ~3400 | Injection @font-face |
| `updateFontSelectUI()` | ~3450 | MAJ sélecteur polices |
| `updateMergeFieldsUI()` | ~3480 | MAJ champs fusion |
| `handleParentMessage()` | ~3520 | Gestionnaire postMessage |
| `sendMessageToParent()` | ~3580 | Envoi message au parent |
| `notifyParentOfChange()` | ~3590 | Notification modification |

---

## 8. Prochaines étapes

### Priorité haute

- [ ] **Projet WebDev de test** : Créer une page WebDev réelle pour tester l'intégration
- [ ] **Validation JSON** : Vérifier la structure avant import (éviter crashes)
- [ ] **Gestion erreurs polices** : Fallback si une police ne charge pas

### Priorité moyenne

- [ ] **Zones Image** : Implémenter le type `zonesImage` (fixe, variable, importée)
- [ ] **Types code-barres** : Support Code128, EAN13, etc. (actuellement QR seulement)
- [ ] **Rotation zones** : Propriété stockée mais pas encore appliquée visuellement

### Priorité basse

- [ ] **z-index (niveau)** : Propriété stockée mais pas encore appliquée
- [ ] **Suppression lignes vides** : Propriété stockée mais pas encore utilisée
- [ ] **Prévisualisation données** : Aperçu avec données exemples

---

## Annexe : Mapping complet des propriétés

### Zone Texte

| JSON WebDev | documentState | Type |
|-------------|---------------|------|
| `id` | clé de l'objet | string |
| `page` | (index calculé) | number |
| `nom` | `name` | string |
| `niveau` | `zIndex` | number |
| `verrouille` | `locked` | boolean |
| `rotation` | `rotation` | number |
| `geometrie.xMm` | `x` (px) | number |
| `geometrie.yMm` | `y` (px) | number |
| `geometrie.largeurMm` | `w` (px) | number |
| `geometrie.hauteurMm` | `h` (px) | number |
| `contenu` | `content` | string |
| `formatage[].debut` | `formatting[].start` | number |
| `formatage[].fin` | `formatting[].end` | number |
| `formatage[].styles` | `formatting[].styles` | object |
| `style.police` | `font` | string |
| `style.taillePt` | `size` | number |
| `style.couleur` | `color` | string |
| `style.gras` | `bold` | boolean |
| `style.interligne` | `lineHeight` | number |
| `style.alignementH` | `align` | string |
| `style.alignementV` | `valign` | string |
| `fond.transparent` | `isTransparent` | boolean |
| `fond.couleur` | `bgColor` | string |
| `bordure.epaisseur` | `border.width` | number |
| `bordure.couleur` | `border.color` | string |
| `bordure.style` | `border.style` | string |
| `copyfitting.actif` | `copyfit` | boolean |
| `copyfitting.tailleMinimum` | `copyfitMin` | number |
| `copyfitting.autoriserRetourLigne` | `copyfitWrap` | boolean |
| `supprimerLignesVides` | `removeEmptyLines` | boolean |

### Zone Code-barres

| JSON WebDev | documentState | Type |
|-------------|---------------|------|
| `id` | clé de l'objet | string |
| `page` | (index calculé) | number |
| `nom` | `name` | string |
| `typeCode` | `typeCode` | string |
| `niveau` | `zIndex` | number |
| `verrouille` | `locked` | boolean |
| `rotation` | `rotation` | number |
| `geometrie.*` | `x, y, w, h` (px) | number |
| `contenu` | `content` | string |
| `couleurs.code` | `qrColor` | string |
| `couleurs.fond` | `bgColor` | string |

---

*Documentation générée le 2 décembre 2025*
