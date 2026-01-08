# Cahier des Charges - Mode Template Designer Marketeam

**Version** : 2.0  
**Date** : 08/01/2026  
**Projet** : Marketeam Designer - Mode Template  
**Auteur** : Michel (Coordinateur) / Claude (Rédacteur)

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Chapitre 1 : Adaptation des contraintes actuelles](#chapitre-1--adaptation-des-contraintes-actuelles)
   - [1.1 Refonte de la structure ZoneContrainte](#11-refonte-de-la-structure-zonecontrainte)
   - [1.2 Contraintes géométriques](#12-contraintes-géométriques)
   - [1.3 Contraintes globales](#13-contraintes-globales)
   - [1.4 Contraintes de style par type de zone](#14-contraintes-de-style-par-type-de-zone)
   - [1.5 Zone Système - Comportement spécial](#15-zone-système---comportement-spécial)
   - [1.6 Mise à jour des typedefs JSDoc](#16-mise-à-jour-des-typedefs-jsdoc)
3. [Chapitre 2 : Mode Template](#chapitre-2--mode-template)
   - [2.1 Activation du mode Template](#21-activation-du-mode-template)
   - [2.2 Interface utilisateur - Onglets dans les toolbars](#22-interface-utilisateur---onglets-dans-les-toolbars)
   - [2.3 Onglet Contraintes - Structure commune](#23-onglet-contraintes---structure-commune)
   - [2.4 Onglet Contraintes - Spécificités par type de zone](#24-onglet-contraintes---spécificités-par-type-de-zone)
   - [2.5 Application temps réel des contraintes (géométrie uniquement)](#25-application-temps-réel-des-contraintes-géométrie-uniquement)
   - [2.6 Mode Standard - Application des contraintes](#26-mode-standard---application-des-contraintes)
   - [2.7 Vérification d'intégrité (checkDocumentIntegrity)](#27-vérification-dintégrité-checkdocumentintegrity)
   - [2.8 Flux de données et export JSON](#28-flux-de-données-et-export-json)
4. [Annexes](#annexes)
   - [A. Mapping sections toolbar ↔ contraintes style](#a-mapping-sections-toolbar--contraintes-style)
   - [B. Récapitulatif des décisions](#b-récapitulatif-des-décisions)
   - [C. Phases de développement suggérées](#c-phases-de-développement-suggérées)

---

## 1. Vue d'ensemble

### Contexte métier

Le Designer Marketeam est utilisé par deux types d'utilisateurs :

| Rôle | Mode | Actions |
|------|------|---------|
| **Responsable marketing** | Template | Crée des modèles avec zones prédéfinies et contraintes |
| **Utilisateur réseau/franchise** | Standard | Personnalise les zones dans les limites définies par le template |

Un troisième acteur intervient en fin de chaîne :
- **Responsable impression Chronodirect** : Lance l'impression. Les zones verrouillées évitent les déplacements accidentels.

### Objectif

Permettre au créateur de template de définir **ce que l'utilisateur final peut ou ne peut pas modifier** dans chaque zone, au-delà des simples contraintes géométriques actuelles.

### Architecture des contraintes (nouvelle)

```
ZoneContrainte
├── geometrie     → Position, taille, area
├── style         → Sections et contenu modifiables ou non
└── global        → locked, systeme, supprimable, page
```

### Distinction importante : Verrouillage vs Contrainte locked

| Élément | Où | Usage |
|---------|-----|-------|
| **Checkbox "Verrouiller"** | Onglet Personnalisation, section "Zone" | Commodité utilisateur (évite déplacement accidentel). État exporté dans le JSON. |
| **Contrainte `locked`** | Onglet Contraintes, section "Géométrie" | **Impose** le verrouillage. L'utilisateur Standard ne peut PAS décocher la checkbox. |

---

## Chapitre 1 : Adaptation des contraintes actuelles

Ce chapitre décrit les modifications à apporter à la structure de données `ZoneContrainte` existante avant d'implémenter le mode Template.

### 1.1 Refonte de la structure ZoneContrainte

#### Structure actuelle (à remplacer)

```javascript
// Ligne ~639 de script.js - Structure plate actuelle
/**
 * @typedef {Object} ZoneContrainte
 * @property {boolean} [positionFixe]
 * @property {boolean} [nonSupprimable]
 * @property {number} [minWMm]
 * @property {number} [maxWMm]
 * @property {number} [minHMm]
 * @property {number} [maxHMm]
 * @property {AreaContrainte} [area]
 * @property {boolean} [locked]
 * @property {boolean} [systeme]
 * @property {string} [systemeLibelle]
 * @property {boolean} [imprimable]
 * @property {boolean} [selectionnable]
 * @property {boolean} [toolbarAffichable]
 */
```

#### Nouvelle structure (à implémenter)

```javascript
/**
 * @typedef {Object} ZoneContrainte
 * @property {ContrainteGeometrie} [geometrie] - Contraintes de position et taille
 * @property {ContrainteStyle} [style] - Contraintes de style (sections modifiables)
 * @property {ContrainteGlobal} [global] - Contraintes globales de la zone
 */
```

### 1.2 Contraintes géométriques

Regroupement des propriétés géométriques dans un sous-objet.

```javascript
/**
 * @typedef {Object} ContrainteGeometrie
 * @property {boolean} [positionFixe] - Position X,Y non modifiable. Défaut: false
 * @property {boolean} [locked] - Position ET taille non modifiables. Défaut: false
 * @property {number} [minWMm] - Largeur minimale en mm (0 = pas de contrainte)
 * @property {number} [maxWMm] - Largeur maximale en mm (0 = pas de contrainte)
 * @property {number} [minHMm] - Hauteur minimale en mm (0 = pas de contrainte)
 * @property {number} [maxHMm] - Hauteur maximale en mm (0 = pas de contrainte)
 * @property {AreaContrainte} [area] - Zone autorisée pour déplacement/redimensionnement
 */

/**
 * @typedef {Object} AreaContrainte
 * @property {number} xMm - Position X de l'area en mm
 * @property {number} yMm - Position Y de l'area en mm
 * @property {number} wMm - Largeur de l'area en mm
 * @property {number} hMm - Hauteur de l'area en mm
 */
```

### 1.3 Contraintes globales

```javascript
/**
 * @typedef {Object} ContrainteGlobal
 * @property {boolean} [systeme] - Zone système (voir section 1.5). Défaut: false
 * @property {string} [systemeLibelle] - Libellé affiché dans le badge système. Défaut: ''
 * @property {boolean} [nonSupprimable] - Zone non supprimable. Défaut: false
 * @property {boolean} [imprimable] - Zone imprimable. Défaut: true
 * @property {boolean} [selectionnable] - Zone sélectionnable. Défaut: true
 * @property {boolean} [toolbarAffichable] - Toolbar visible à la sélection. Défaut: true
 * @property {boolean} [pageModifiable] - Peut changer de page (Recto/Verso). Défaut: true
 */
```

**Nouvelle propriété `pageModifiable`** :
- `true` (défaut) : L'utilisateur peut déplacer la zone vers une autre page
- `false` : La zone reste sur sa page d'origine (dropdown "Page" grisé en mode Standard)

### 1.4 Contraintes de style par type de zone

Les contraintes de style sont **regroupées par section** de la toolbar, avec en plus une contrainte `contenuModifiable` pour chaque type (sauf QR Marketeam).

#### 1.4.1 Zone Texte (`type: 'textQuill'`)

```javascript
/**
 * @typedef {Object} ContrainteStyleTexte
 * @property {boolean} [contenuModifiable] - Contenu texte modifiable. Défaut: true
 *   → Si false : Zone Quill en lecture seule (texte non éditable)
 * @property {boolean} [typographieModifiable] - Section Typographie modifiable. Défaut: true
 *   → Inclut : police, taille, couleur texte, ajustable (copyfit)
 * @property {boolean} [alignementsModifiable] - Section Alignements modifiable. Défaut: true
 *   → Inclut : alignement H, alignement V, interligne, lignes vides
 * @property {boolean} [fondModifiable] - Section Fond modifiable. Défaut: true
 *   → Inclut : transparent, couleur fond
 * @property {boolean} [bordureModifiable] - Section Bordure modifiable. Défaut: true
 *   → Inclut : épaisseur, style, couleur bordure
 */
```

#### 1.4.2 Zone Image (`type: 'image'`)

```javascript
/**
 * @typedef {Object} ContrainteStyleImage
 * @property {boolean} [contenuModifiable] - Contenu image modifiable. Défaut: true
 *   → Si false : Image et type de source verrouillés (ne peut pas changer l'image)
 * @property {boolean} [affichageModifiable] - Section Affichage modifiable. Défaut: true
 *   → Inclut : mode redimensionnement, alignements H/V
 * @property {boolean} [fondModifiable] - Section Fond modifiable. Défaut: true
 *   → Inclut : transparent, couleur fond
 * @property {boolean} [bordureModifiable] - Section Bordure modifiable. Défaut: true
 *   → Inclut : épaisseur, style, couleur bordure
 */
```

**Comportement `contenuModifiable = false` pour Image** :
- Type de source (fixe/champ) : verrouillé
- Image uploadée : verrouillée (ne peut pas être changée)
- Champ de fusion sélectionné : verrouillé

#### 1.4.3 Zone Code-barres (`type: 'barcode'`)

```javascript
/**
 * @typedef {Object} ContrainteStyleBarcode
 * @property {boolean} [contenuModifiable] - Contenu/données modifiable. Défaut: true
 *   → Si false : Type code, source, valeur/champ tous verrouillés
 *   → Pour QR intelligent : type QR + tous les champs verrouillés
 * @property {boolean} [apparenceModifiable] - Section Affichage modifiable. Défaut: true
 *   → Inclut : afficher texte, taille texte
 * @property {boolean} [fondModifiable] - Section Fond modifiable. Défaut: true
 *   → Inclut : transparent, couleur fond
 */
```

**Comportement `contenuModifiable = false` pour Barcode** :
- Type de code (code128, EAN13, QR, etc.) : verrouillé
- Source (fixe/champ) : verrouillée
- Valeur ou champ de fusion : verrouillé
- Pour QR intelligent : type de QR (URL, vCard, etc.) + tous les champs verrouillés

#### 1.4.4 Zone QR Marketeam (`type: 'qr'`)

**IMPORTANT** : Les zones QR Marketeam sont liées aux landing pages de la plateforme SaaS. Les données sont **TOUJOURS** gérées par la plateforme, donc pas de `contenuModifiable`.

```javascript
/**
 * @typedef {Object} ContrainteStyleQR
 * @property {boolean} [couleursModifiable] - Section Fond/Couleurs modifiable. Défaut: true
 *   → Inclut : transparent, couleur fond
 */
```

#### 1.4.5 Type union pour ContrainteStyle

```javascript
/**
 * @typedef {ContrainteStyleTexte|ContrainteStyleImage|ContrainteStyleBarcode|ContrainteStyleQR} ContrainteStyle
 */
```

### 1.5 Zone Système - Comportement spécial

Une zone **Système** est une zone **technique Marketeam** qui ne doit **JAMAIS** être modifiée, ni par l'utilisateur final, ni par le créateur du template.

#### Exemples de zones Système
- Datamatrix d'affranchissement
- Zone d'adresse destinataire (normée La Poste)
- Zones techniques obligatoires sur certains documents

#### Constante de restrictions

Quand `systeme = true`, un ensemble prédéfini de restrictions s'applique automatiquement. Ces restrictions sont définies dans une **constante centralisée** :

```javascript
/**
 * Restrictions appliquées automatiquement aux zones Système.
 * Modifiable uniquement dans le code (pas par l'utilisateur).
 * Une zone système est complètement INERTE (non sélectionnable, non modifiable).
 */
const SYSTEM_ZONE_RESTRICTIONS = {
    // Géométrie - tout bloqué
    geometrie: {
        positionFixe: true,
        locked: true
    },
    
    // Global - zone inerte
    global: {
        nonSupprimable: true,
        selectionnable: false,
        toolbarAffichable: false,
        pageModifiable: false
    },
    
    // Style - tout bloqué (appliqué selon le type de zone)
    style: {
        contenuModifiable: false,
        typographieModifiable: false,
        alignementsModifiable: false,
        fondModifiable: false,
        bordureModifiable: false,
        affichageModifiable: false,
        apparenceModifiable: false,
        couleursModifiable: false
    }
};
```

#### Comportement

- La zone est **complètement inerte** : impossible de cliquer dessus, pas de toolbar
- Le badge "Système" s'affiche avec le `systemeLibelle`
- Les restrictions de la constante **écrasent** toute autre configuration

### 1.6 Mise à jour des typedefs JSDoc

#### Exemple de ZoneContrainte complète

```javascript
/**
 * @example
 * // Zone texte "Adresse point de vente" créée par le responsable marketing
 * {
 *     geometrie: {
 *         positionFixe: true,
 *         minHMm: 20,
 *         maxHMm: 50
 *     },
 *     style: {
 *         contenuModifiable: true,        // Utilisateur peut saisir son adresse
 *         typographieModifiable: false,   // Police/couleur imposées (charte)
 *         alignementsModifiable: true,    // Peut ajuster l'alignement
 *         fondModifiable: false,          // Fond imposé
 *         bordureModifiable: false        // Bordure imposée
 *     },
 *     global: {
 *         nonSupprimable: true,
 *         pageModifiable: false           // Reste sur Recto
 *     }
 * }
 * 
 * @example
 * // Zone système "Datamatrix affranchissement"
 * {
 *     global: {
 *         systeme: true,
 *         systemeLibelle: "Affranchissement"
 *     }
 *     // Les autres restrictions sont appliquées automatiquement via SYSTEM_ZONE_RESTRICTIONS
 * }
 */
```

---

## Chapitre 2 : Mode Template

Ce chapitre décrit l'implémentation du mode Template : UI, comportements et interactions.

### 2.1 Activation du mode Template

#### Réception du mode via postMessage

Le mode est transmis par WebDev dans le message `load` :

```javascript
// Message WebDev → Designer
{
    action: "load",
    mode: "template",  // ou "standard" (défaut si absent)
    data: { ... }
}
```

#### Variable globale de mode

```javascript
/**
 * Mode de fonctionnement du Designer
 * @type {'standard'|'template'}
 */
let designerMode = 'standard';
```

#### Gestion dans handleParentMessage

```javascript
case 'load':
    if (message.data) {
        // Définir le mode AVANT le chargement
        designerMode = message.mode || 'standard';
        console.log(`🎨 Mode Designer: ${designerMode}`);
        
        loadFromWebDev(message);
        // ...
    }
    break;
```

### 2.2 Interface utilisateur - Onglets dans les toolbars

#### Principe

Chaque toolbar dispose de **2 onglets** :

| Onglet | Libellé | Visibilité |
|--------|---------|------------|
| Personnalisation | "Personnalisation" ou icône 🎨 | Toujours visible |
| Contraintes | "Contraintes" ou icône 🔒 | **Mode Template uniquement** |

#### Structure HTML à ajouter (exemple toolbar texte)

```html
<div class="toolbar-poc" id="quill-toolbar">
    <!-- Header existant -->
    <div class="toolbar-header-poc">...</div>
    
    <!-- NOUVEAU : Barre d'onglets -->
    <div class="toolbar-tabs-poc" id="quill-toolbar-tabs">
        <button type="button" class="toolbar-tab-poc active" data-tab="personnalisation">
            🎨 Personnalisation
        </button>
        <button type="button" class="toolbar-tab-poc" data-tab="contraintes" style="display: none;">
            🔒 Contraintes
        </button>
    </div>
    
    <!-- Contenu onglet Personnalisation (existant, wrappé) -->
    <div class="toolbar-tab-content-poc active" data-tab-content="personnalisation">
        <!-- Sections existantes : Page, Typographie, Alignements, Fond, Bordure, Géométrie, Zone -->
    </div>
    
    <!-- NOUVEAU : Contenu onglet Contraintes -->
    <div class="toolbar-tab-content-poc" data-tab-content="contraintes" style="display: none;">
        <!-- Sections contraintes (voir 2.3 et 2.4) -->
    </div>
</div>
```

#### Affichage conditionnel de l'onglet Contraintes

```javascript
function updateToolbarTabsVisibility() {
    const constraintsTabs = document.querySelectorAll('.toolbar-tab-poc[data-tab="contraintes"]');
    constraintsTabs.forEach(tab => {
        tab.style.display = (designerMode === 'template') ? '' : 'none';
    });
}
```

### 2.3 Onglet Contraintes - Structure commune

L'onglet Contraintes contient des sections communes à tous les types de zones.

#### Section "Global"

```html
<div class="section-poc" data-section-id="contrainte-global">
    <div class="section-header-poc">Global</div>
    <div class="section-content-poc">
        <!-- Non supprimable -->
        <div class="form-row-poc">
            <label class="form-label-poc">Non supprimable</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-non-supprimable-wrapper">
                    <input type="checkbox" id="contrainte-non-supprimable">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        
        <!-- Page modifiable -->
        <div class="form-row-poc">
            <label class="form-label-poc">Page modifiable</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-page-modifiable-wrapper">
                    <input type="checkbox" id="contrainte-page-modifiable" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        
        <!-- Zone système -->
        <div class="form-row-poc">
            <label class="form-label-poc">Zone système</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-systeme-wrapper">
                    <input type="checkbox" id="contrainte-systeme">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        
        <!-- Libellé système (visible si système coché) -->
        <div class="form-row-poc" id="contrainte-systeme-libelle-row" style="display: none;">
            <label class="form-label-poc">Libellé</label>
            <div class="form-control-poc">
                <input type="text" class="text-input-poc" id="contrainte-systeme-libelle" placeholder="Ex: Affranchissement">
            </div>
        </div>
    </div>
</div>
```

#### Section "Géométrie"

```html
<div class="section-poc" data-section-id="contrainte-geometrie">
    <div class="section-header-poc">Géométrie</div>
    <div class="section-content-poc">
        <!-- Position fixe -->
        <div class="form-row-poc">
            <label class="form-label-poc">Position fixe</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-position-fixe-wrapper">
                    <input type="checkbox" id="contrainte-position-fixe">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        
        <!-- Verrouillé (position + taille) -->
        <div class="form-row-poc">
            <label class="form-label-poc">Verrouillé (position + taille)</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-locked-wrapper">
                    <input type="checkbox" id="contrainte-locked">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        
        <!-- Zone autorisée (area) -->
        <div class="form-row-poc">
            <label class="form-label-poc">Zone autorisée</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-area-active-wrapper">
                    <input type="checkbox" id="contrainte-area-active">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <div class="form-row-poc" id="contrainte-area-fields" style="display: none;">
            <div class="geo-grid-poc">
                <div class="geo-field-poc">
                    <label class="geo-label-poc">X</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-area-x" value="0,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
                <div class="geo-field-poc">
                    <label class="geo-label-poc">Y</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-area-y" value="0,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
                <div class="geo-field-poc">
                    <label class="geo-label-poc">L</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-area-w" value="100,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
                <div class="geo-field-poc">
                    <label class="geo-label-poc">H</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-area-h" value="100,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### Section "Bornes de taille"

**Règle de grisage** : Si `locked=true` OU `systeme=true` OU `selectionnable=false` → toute la section est grisée.

```html
<div class="section-poc" data-section-id="contrainte-taille">
    <div class="section-header-poc">Bornes de taille</div>
    <div class="section-content-poc" id="contrainte-taille-content">
        <!-- Taille minimum -->
        <div class="form-row-poc">
            <label class="form-label-poc">Taille minimum</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-taille-min-active-wrapper">
                    <input type="checkbox" id="contrainte-taille-min-active">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <div class="form-row-poc" id="contrainte-taille-min-fields" style="display: none;">
            <div class="geo-grid-poc geo-grid-2col-poc">
                <div class="geo-field-poc">
                    <label class="geo-label-poc">Largeur</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-min-w" value="10,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
                <div class="geo-field-poc">
                    <label class="geo-label-poc">Hauteur</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-min-h" value="10,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Taille maximum -->
        <div class="form-row-poc">
            <label class="form-label-poc">Taille maximum</label>
            <div class="form-control-poc">
                <div class="checkbox-poc" id="contrainte-taille-max-active-wrapper">
                    <input type="checkbox" id="contrainte-taille-max-active">
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <div class="form-row-poc" id="contrainte-taille-max-fields" style="display: none;">
            <div class="geo-grid-poc geo-grid-2col-poc">
                <div class="geo-field-poc">
                    <label class="geo-label-poc">Largeur</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-max-w" value="200,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
                <div class="geo-field-poc">
                    <label class="geo-label-poc">Hauteur</label>
                    <div class="geo-input-wrapper-poc">
                        <input type="text" id="contrainte-max-h" value="200,0">
                        <span class="unit-poc">mm</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 2.4 Onglet Contraintes - Spécificités par type de zone

#### 2.4.1 Zone Texte - Section "Style"

```html
<div class="section-poc" data-section-id="contrainte-style">
    <div class="section-header-poc">Sections modifiables</div>
    <div class="section-content-poc">
        <!-- Contenu (texte) -->
        <div class="form-row-poc">
            <label class="form-label-poc">Contenu</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-contenu-wrapper">
                    <input type="checkbox" id="contrainte-contenu" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Typographie -->
        <div class="form-row-poc">
            <label class="form-label-poc">Typographie</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-typo-wrapper">
                    <input type="checkbox" id="contrainte-typo" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Alignements -->
        <div class="form-row-poc">
            <label class="form-label-poc">Alignements</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-align-wrapper">
                    <input type="checkbox" id="contrainte-align" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Fond -->
        <div class="form-row-poc">
            <label class="form-label-poc">Fond</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-fond-wrapper">
                    <input type="checkbox" id="contrainte-fond" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Bordure -->
        <div class="form-row-poc">
            <label class="form-label-poc">Bordure</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-bordure-wrapper">
                    <input type="checkbox" id="contrainte-bordure" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### 2.4.2 Zone Image - Section "Style"

```html
<div class="section-poc" data-section-id="contrainte-style">
    <div class="section-header-poc">Sections modifiables</div>
    <div class="section-content-poc">
        <!-- Contenu (image/source) -->
        <div class="form-row-poc">
            <label class="form-label-poc">Contenu (image)</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-contenu-wrapper">
                    <input type="checkbox" id="contrainte-contenu" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Affichage -->
        <div class="form-row-poc">
            <label class="form-label-poc">Affichage</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-affichage-wrapper">
                    <input type="checkbox" id="contrainte-affichage" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Fond -->
        <div class="form-row-poc">
            <label class="form-label-poc">Fond</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-fond-wrapper">
                    <input type="checkbox" id="contrainte-fond" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Bordure -->
        <div class="form-row-poc">
            <label class="form-label-poc">Bordure</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-bordure-wrapper">
                    <input type="checkbox" id="contrainte-bordure" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### 2.4.3 Zone Code-barres - Section "Style"

```html
<div class="section-poc" data-section-id="contrainte-style">
    <div class="section-header-poc">Sections modifiables</div>
    <div class="section-content-poc">
        <!-- Contenu (données) -->
        <div class="form-row-poc">
            <label class="form-label-poc">Contenu (données)</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-contenu-wrapper">
                    <input type="checkbox" id="contrainte-contenu" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Apparence -->
        <div class="form-row-poc">
            <label class="form-label-poc">Apparence</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-apparence-wrapper">
                    <input type="checkbox" id="contrainte-apparence" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
        <!-- Fond -->
        <div class="form-row-poc">
            <label class="form-label-poc">Fond</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-fond-wrapper">
                    <input type="checkbox" id="contrainte-fond" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### 2.4.4 Zone QR Marketeam - Section "Style"

**Note** : Pas de contrainte "Contenu" car les données QR sont toujours gérées par la plateforme Marketeam.

```html
<div class="section-poc" data-section-id="contrainte-style">
    <div class="section-header-poc">Sections modifiables</div>
    <div class="section-content-poc">
        <!-- Couleurs uniquement -->
        <div class="form-row-poc">
            <label class="form-label-poc">Couleurs</label>
            <div class="form-control-poc">
                <div class="checkbox-poc checked" id="contrainte-couleurs-wrapper">
                    <input type="checkbox" id="contrainte-couleurs" checked>
                    <svg>...</svg>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 2.5 Application temps réel des contraintes (géométrie uniquement)

#### Principe fondamental

En mode Template, l'application temps réel concerne **UNIQUEMENT les contraintes géométriques** :

| Contrainte | Application temps réel |
|------------|------------------------|
| ✅ Area | Visualisation du rectangle + contrainte de positionnement |
| ✅ Position fixe | Désactive le drag immédiatement |
| ✅ Locked | Désactive drag + resize |
| ✅ Bornes de taille | Limite le resize |
| ❌ Contraintes de style | **PAS d'application temps réel** |

#### Pourquoi pas les contraintes de style ?

Le créateur doit pouvoir :
1. Définir la police à "Arial 12pt"
2. PUIS cocher "typographieModifiable = false"

Si on appliquait en temps réel, il se bloquerait lui-même !

#### Fonction de mise à jour

```javascript
/**
 * Applique les contraintes GÉOMÉTRIQUES d'une zone en temps réel (mode Template).
 * Les contraintes de style ne sont PAS appliquées en temps réel.
 * 
 * @param {string} zoneId - ID de la zone
 * @param {ContrainteGeometrie} geometrie - Contraintes géométriques à appliquer
 */
function applyGeometryConstraintsRealtime(zoneId, geometrie) {
    const zoneEl = document.getElementById(zoneId);
    if (!zoneEl) return;
    
    // 1. Area - visualisation
    if (geometrie?.area) {
        updateAreaVisualization(zoneId, geometrie.area);
    } else {
        removeAreaVisualization(zoneId);
    }
    
    // 2. Position fixe
    if (geometrie?.positionFixe) {
        disableZoneDrag(zoneId);
    } else if (!geometrie?.locked) {
        enableZoneDrag(zoneId);
    }
    
    // 3. Locked
    if (geometrie?.locked) {
        disableZoneDrag(zoneId);
        disableZoneResize(zoneId);
    }
    
    // 4. Sauvegarder dans documentState
    const zones = getCurrentPageZones();
    if (zones[zoneId]) {
        zones[zoneId].contrainte = zones[zoneId].contrainte || {};
        zones[zoneId].contrainte.geometrie = geometrie;
    }
}
```

### 2.6 Mode Standard - Application des contraintes

En mode Standard, les contraintes définies dans le template sont **appliquées** (sections grisées, interactions bloquées).

#### 2.6.1 Grisage des sections de l'onglet Personnalisation

| Contrainte style | Sections grisées |
|------------------|------------------|
| `contenuModifiable = false` | Zone Quill en readonly / Source image désactivée / Données barcode désactivées |
| `typographieModifiable = false` | Section "Typographie" grisée |
| `alignementsModifiable = false` | Section "Alignements" grisée |
| `fondModifiable = false` | Section "Fond" grisée |
| `bordureModifiable = false` | Section "Bordure" grisée |
| `affichageModifiable = false` | Section "Affichage" grisée |
| `apparenceModifiable = false` | Section "Affichage" grisée (barcode) |
| `couleursModifiable = false` | Section "Fond" grisée (QR) |

#### 2.6.2 Section "Page"

| Contrainte | Effet |
|------------|-------|
| `pageModifiable = false` | Dropdown "Page" (Recto/Verso) grisé |

#### 2.6.3 Section "Géométrie" (champs X, Y, L, H)

| Contrainte | Champs grisés |
|------------|---------------|
| `positionFixe = true` | X et Y en lecture seule |
| `locked = true` | X, Y, L, H tous en lecture seule |
| `minWMm / maxWMm` | L modifiable mais contraint aux bornes |
| `minHMm / maxHMm` | H modifiable mais contraint aux bornes |

#### 2.6.4 Section "Zone" (checkbox Verrouiller)

| Contrainte | Effet |
|------------|-------|
| `locked = true` | Checkbox "Verrouiller" cochée ET grisée (non modifiable) |

#### 2.6.5 Fonction d'application

```javascript
/**
 * Applique les contraintes d'une zone en mode Standard.
 * Grise les sections non modifiables et bloque les interactions.
 * 
 * @param {string} zoneId - ID de la zone
 * @param {ZoneContrainte} contrainte - Contraintes à appliquer
 * @param {string} zoneType - Type de zone ('textQuill', 'image', 'barcode', 'qr')
 */
function applyConstraintsForStandardMode(zoneId, contrainte, zoneType) {
    if (!contrainte) return;
    
    const { geometrie, style, global } = contrainte;
    
    // 1. Contraintes géométriques (interactions)
    if (geometrie?.positionFixe || geometrie?.locked) {
        disableZoneDrag(zoneId);
    }
    if (geometrie?.locked) {
        disableZoneResize(zoneId);
    }
    if (geometrie?.area) {
        // Activer le confinement dans l'area
        enableAreaConstraint(zoneId, geometrie.area);
    }
    
    // 2. Contraintes globales
    if (global?.pageModifiable === false) {
        disablePageDropdown();
    }
    if (global?.locked) {
        disableLockedCheckbox();  // Checkbox "Verrouiller" cochée et grisée
    }
    
    // 3. Contraintes de style (grisage des sections)
    if (style) {
        applySectionDisabling(zoneType, style);
    }
}

/**
 * Grise les sections de la toolbar selon les contraintes de style.
 */
function applySectionDisabling(zoneType, style) {
    // Mapping contrainte → section(s) à griser
    const sectionMappings = {
        textQuill: {
            contenuModifiable: ['quill-editor'],  // readonly
            typographieModifiable: ['typography'],
            alignementsModifiable: ['paragraph'],
            fondModifiable: ['background'],
            bordureModifiable: ['border']
        },
        image: {
            contenuModifiable: ['source'],
            affichageModifiable: ['display'],
            fondModifiable: ['background'],
            bordureModifiable: ['border']
        },
        barcode: {
            contenuModifiable: ['barcode-type', 'data', 'qr-smart'],
            apparenceModifiable: ['display'],
            fondModifiable: ['background']
        },
        qr: {
            couleursModifiable: ['background']
        }
    };
    
    const mappings = sectionMappings[zoneType] || {};
    
    for (const [constraint, sections] of Object.entries(mappings)) {
        if (style[constraint] === false) {
            sections.forEach(sectionId => {
                disableSection(sectionId);
            });
        }
    }
}
```

### 2.7 Vérification d'intégrité (checkDocumentIntegrity)

#### Comportement selon le mode

| Mode | Comportement de `checkDocumentIntegrity()` |
|------|---------------------------------------------|
| **Standard** | Vérifie le **contenu** des zones (images manquantes, champs invalides, etc.) |
| **Template** | Vérifie la **cohérence des contraintes** uniquement |

#### Vérifications en mode Template

```javascript
function checkDocumentIntegrityTemplate() {
    const errors = [];
    
    documentState.pages.forEach((page, pageIndex) => {
        Object.entries(page.zones).forEach(([zoneId, zoneData]) => {
            const c = zoneData.contrainte;
            if (!c) return;
            
            const zoneName = zoneData.nom || zoneId;
            
            // 1. Cohérence bornes de taille
            if (c.geometrie) {
                const { minWMm, maxWMm, minHMm, maxHMm } = c.geometrie;
                
                if (minWMm && maxWMm && minWMm > maxWMm) {
                    errors.push({
                        zoneId,
                        zoneName,
                        message: 'Largeur min > Largeur max'
                    });
                }
                
                if (minHMm && maxHMm && minHMm > maxHMm) {
                    errors.push({
                        zoneId,
                        zoneName,
                        message: 'Hauteur min > Hauteur max'
                    });
                }
            }
            
            // 2. Cohérence area
            if (c.geometrie?.area) {
                const { xMm, yMm, wMm, hMm } = c.geometrie.area;
                if (wMm <= 0 || hMm <= 0) {
                    errors.push({
                        zoneId,
                        zoneName,
                        message: 'Area invalide (dimensions <= 0)'
                    });
                }
            }
            
            // 3. Cohérence zone système
            if (c.global?.systeme && !c.global?.systemeLibelle) {
                errors.push({
                    zoneId,
                    zoneName,
                    message: 'Zone système sans libellé'
                });
            }
        });
    });
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

#### Modification de checkDocumentIntegrity

```javascript
function checkDocumentIntegrity() {
    if (designerMode === 'template') {
        return checkDocumentIntegrityTemplate();
    }
    
    // Mode Standard : vérification existante du contenu
    // ... code existant ...
}
```

### 2.8 Flux de données et export JSON

#### Format JSON inchangé

Le format JSON reste **identique** entre Template et Standard. Les contraintes sont stockées dans la propriété `contrainte` de chaque zone.

```json
{
    "zonesTexte": [
        {
            "id": "zone-1",
            "nom": "Adresse point de vente",
            "geometrie": { "xMm": 10, "yMm": 50, "largeurMm": 80, "hauteurMm": 30 },
            "contenu": "@ADRESSE@\n@CP@ @VILLE@",
            "contrainte": {
                "geometrie": {
                    "positionFixe": true,
                    "minHMm": 20,
                    "maxHMm": 50
                },
                "style": {
                    "contenuModifiable": true,
                    "typographieModifiable": false,
                    "alignementsModifiable": true,
                    "fondModifiable": false,
                    "bordureModifiable": false
                },
                "global": {
                    "nonSupprimable": true,
                    "pageModifiable": false
                }
            }
        }
    ]
}
```

#### Flux de travail

```
┌─────────────────────────────────────────────────────────────────┐
│  Mode Template                                                  │
│  → Créateur définit zones + contraintes                         │
│  → Export JSON avec contraintes                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mode Standard                                                  │
│  → Chargement JSON                                              │
│  → Contraintes appliquées (sections grisées, déplacement limité)│
│  → Utilisateur personnalise DANS les limites                    │
│  → Export JSON (contraintes préservées)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Annexes

### A. Mapping sections toolbar ↔ contraintes style

#### Toolbar Texte (`quill-toolbar`)

| Section toolbar | data-section-id | Contrainte style |
|-----------------|-----------------|------------------|
| (Zone Quill) | - | `contenuModifiable` |
| Typographie | `typography` | `typographieModifiable` |
| Alignements | `paragraph` | `alignementsModifiable` |
| Fond | `background` | `fondModifiable` |
| Bordure | `border` | `bordureModifiable` |

#### Toolbar Image (`image-toolbar`)

| Section toolbar | data-section-id | Contrainte style |
|-----------------|-----------------|------------------|
| Source de l'image | `source` | `contenuModifiable` |
| Affichage | `display` | `affichageModifiable` |
| Fond | `background` | `fondModifiable` |
| Bordure | `border` | `bordureModifiable` |

#### Toolbar Code-barres (`barcode-toolbar`)

| Section toolbar | data-section-id | Contrainte style |
|-----------------|-----------------|------------------|
| Type de code | `barcode-type` | `contenuModifiable` |
| Données | `data` | `contenuModifiable` |
| QR Code Intelligent | `qr-smart` | `contenuModifiable` |
| Affichage | `display` | `apparenceModifiable` |
| Fond | `background` | `fondModifiable` |

#### Toolbar QR Marketeam (`qrcode-toolbar`)

| Section toolbar | data-section-id | Contrainte style |
|-----------------|-----------------|------------------|
| Fond | `background` | `couleursModifiable` |

### B. Récapitulatif des décisions

| Point | Décision |
|-------|----------|
| **Structure contraintes** | 3 niveaux : geometrie, style, global |
| **Bornes de taille** | 2 toggles (min/max) avec 2 champs chacun, grisés si locked=true OU systeme=true OU selectionnable=false |
| **Zone area** | 4 champs numériques + application temps réel (visualisation + contrainte active) |
| **Application temps réel** | **Géométrie uniquement** (pas les contraintes de style, sinon le créateur se bloque) |
| **Bouton Check** | Jamais visible en production. En Template : vérifie cohérence des contraintes. En Standard : vérifie contenu. |
| **Export JSON** | Format identique, contraintes dans `contrainte` de chaque zone |
| **contenuModifiable** | Nouvelle contrainte pour Texte, Image, Barcode (pas QR Marketeam) |
| **Zone Système** | Restrictions centralisées dans `SYSTEM_ZONE_RESTRICTIONS`, zone complètement inerte |
| **Checkbox "Verrouiller"** | Commodité utilisateur, grisée en mode Standard si contrainte `locked = true` |
| **pageModifiable** | Nouvelle contrainte globale, grise le dropdown "Page" si false |
| **Organisation toolbar** | 2 onglets : Personnalisation (existant) + Contraintes (mode Template uniquement) |

### C. Phases de développement suggérées

#### Phase 1 : Refonte structure ZoneContrainte

**Objectif** : Mettre à jour la structure de données

1. Mettre à jour les typedefs JSDoc (structure en 3 niveaux : geometrie, style, global)
2. Ajouter la constante `SYSTEM_ZONE_RESTRICTIONS`
3. Créer fonctions de migration pour rétrocompatibilité (ancienne structure plate → nouvelle structure)
4. Adapter les fonctions existantes qui accèdent à `zoneData.contrainte.*`
5. Tests unitaires

**Fichiers impactés** : `script.js` (typedefs + fonctions d'accès)

#### Phase 2 : Variable designerMode et réception

**Objectif** : Gérer le mode Template/Standard

1. Ajouter variable `designerMode`
2. Modifier `handleParentMessage` pour recevoir le mode dans le message `load`
3. Créer fonction `updateToolbarTabsVisibility()`
4. Tests postMessage

**Fichiers impactés** : `script.js` (section 21 - postMessage)

#### Phase 3 : UI Onglets dans les toolbars

**Objectif** : Ajouter les onglets Personnalisation/Contraintes

1. Ajouter HTML des onglets (tabs) dans les 4 toolbars
2. Créer CSS pour les onglets (`.toolbar-tabs-poc`, `.toolbar-tab-poc`, `.toolbar-tab-content-poc`)
3. Implémenter la logique de switch d'onglets
4. Masquer l'onglet Contraintes en mode Standard
5. Tests UI

**Fichiers impactés** : `index.html`, `style.css`, `script.js`

#### Phase 4 : Onglet Contraintes - Sections communes

**Objectif** : Créer les sections Global, Géométrie, Bornes de taille

1. Ajouter HTML sections Global, Géométrie, Bornes de taille (communes aux 4 toolbars)
2. Implémenter les event listeners pour chaque contrôle
3. Synchroniser avec `zoneData.contrainte.geometrie` et `zoneData.contrainte.global`
4. Implémenter le grisage de "Bornes de taille" selon conditions
5. Tests

**Fichiers impactés** : `index.html`, `script.js`

#### Phase 5 : Onglet Contraintes - Sections style par type

**Objectif** : Créer la section "Sections modifiables" spécifique à chaque type

1. Ajouter HTML section Style pour chaque type (Texte, Image, Barcode, QR)
2. Adapter l'affichage selon le type de zone sélectionnée
3. Synchroniser avec `zoneData.contrainte.style`
4. Tests

**Fichiers impactés** : `index.html`, `script.js`

#### Phase 6 : Application temps réel (géométrie)

**Objectif** : Les contraintes géométriques s'appliquent immédiatement

1. Implémenter `applyGeometryConstraintsRealtime()`
2. Visualisation de l'area sur le document (rectangle en pointillés)
3. Application des bornes au resize
4. Désactivation drag/resize selon positionFixe/locked
5. Tests interaction

**Fichiers impactés** : `script.js`, `style.css`

#### Phase 7 : Mode Standard - Application des contraintes

**Objectif** : En mode Standard, les contraintes sont appliquées (lecture seule)

1. Implémenter `applyConstraintsForStandardMode()`
2. Griser les sections non modifiables selon contraintes style
3. Bloquer les interactions géométriques selon contraintes
4. Griser dropdown "Page" si pageModifiable = false
5. Griser checkbox "Verrouiller" si locked = true
6. Quill readonly si contenuModifiable = false
7. Tests complets flux Template → Standard

**Fichiers impactés** : `script.js`, `style.css`

#### Phase 8 : Zone Système

**Objectif** : Implémenter le comportement des zones système

1. Appliquer automatiquement `SYSTEM_ZONE_RESTRICTIONS` quand systeme = true
2. Rendre la zone inerte (non sélectionnable, pas de toolbar)
3. Afficher le badge système avec systemeLibelle
4. Tests

**Fichiers impactés** : `script.js`, `style.css`

#### Phase 9 : Vérification d'intégrité

**Objectif** : Adapter checkDocumentIntegrity selon le mode

1. Implémenter `checkDocumentIntegrityTemplate()`
2. Modifier `checkDocumentIntegrity()` pour dispatcher selon le mode
3. Tests validation

**Fichiers impactés** : `script.js`

#### Phase 10 : Tests et finalisation

**Objectif** : Validation complète

1. Tests end-to-end du flux complet
2. Tests de rétrocompatibilité (documents sans contraintes)
3. Documentation utilisateur
4. Correction des bugs éventuels

---

**Document rédigé le 08/01/2026**  
**Version 2.0 - Mise à jour avec toutes les précisions discutées**  
**À utiliser comme référence pour les prompts Cursor**
