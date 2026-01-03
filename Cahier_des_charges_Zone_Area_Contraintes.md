# Cahier des charges : Zone Area pour contraintes de document

## Vue d'ensemble

**Date** : Janvier 2026  
**Version** : 1.0  
**Statut** : À implémenter  
**Prérequis** : Phase 10 (Contraintes de document) validée

### Objectif

Ajouter une fonctionnalité "Area" aux contraintes de zones prédéfinies permettant de définir une surface rectangulaire dans laquelle une zone peut être déplacée et redimensionnée librement, sans pouvoir en sortir.

### Problématique

Actuellement, une zone contrainte a deux états pour la position :
- `positionFixe: true` → Position figée (trop restrictif)
- `positionFixe: false` → Libre dans toute la page (trop permissif)

L'area offre un **comportement intermédiaire** : liberté contrôlée dans une surface définie.

---

## Spécifications fonctionnelles

### Comportement de l'area

```
┌─────────────────────────────────────────────────────────────────┐
│  PAGE                                                           │
│                                                                 │
│    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                           │
│    │  AREA (bordure pointillée)     │                           │
│    │                                │                           │
│    │    ┌─────────────────┐         │                           │
│    │    │                 │         │                           │
│    │    │   ZONE TEXTE    │ ← Peut  │                           │
│    │    │                 │   être  │                           │
│    │    └─────────────────┘   déplacée                          │
│    │                          et redimensionnée                 │
│    │                          dans l'area                       │
│    └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                           │
│                                                                 │
│    ✗ La zone NE PEUT PAS sortir de l'area                       │
│    ✗ La zone NE PEUT PAS dépasser l'area en s'agrandissant      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Règles de comportement

| Action | Comportement avec area |
|--------|------------------------|
| **Déplacement (drag)** | La zone reste entièrement à l'intérieur de l'area |
| **Redimensionnement** | La zone ne peut pas dépasser les bords de l'area |
| **Inputs X/Y toolbar** | Valeurs contraintes pour garder la zone dans l'area |
| **Inputs L/H toolbar** | Valeurs contraintes par l'area ET les bornes min/max |

### Hiérarchie des contraintes

Les contraintes s'appliquent dans cet ordre (du plus restrictif au moins restrictif) :

1. **Marge de sécurité du document** (limite absolue)
2. **Area** (si définie)
3. **Bornes min/max** (minWMm, maxWMm, minHMm, maxHMm)
4. **Position fixe** (si `positionFixe: true`, ignore l'area pour la position)

### Cas combinés

| positionFixe | area | Comportement position |
|--------------|------|----------------------|
| `true` | Non définie | Position figée |
| `true` | Définie | Position figée (area ignorée pour position) |
| `false` | Non définie | Libre dans la page (marges de sécurité) |
| `false` | Définie | **Libre dans l'area uniquement** |

**Note** : Si `positionFixe: true` ET `area` définie, l'area sert uniquement à contraindre le redimensionnement, pas la position.

---

## Spécifications visuelles

### Affichage de l'area

| Propriété | Valeur |
|-----------|--------|
| Type | Rectangle avec bordure |
| Bordure style | Pointillés (`dashed`) |
| Bordure épaisseur | 1px |
| Bordure couleur | Couleur thème clair (`#90CAF9` bleu clair ou `#B0BEC5` gris clair) |
| Fond | Transparent |
| z-index | Inférieur aux zones (derrière les zones) |

### Visibilité de l'area

| Condition | Affichage |
|-----------|-----------|
| Zone contrainte avec area sélectionnée | ✅ Visible |
| Zone contrainte avec area non sélectionnée | ❌ Masquée (optionnel : affichage léger) |
| Mode aperçu | ❌ Masquée |
| Export / Impression | ❌ Non incluse |

### Maquette visuelle

```
Zone NON sélectionnée :
┌─────────────────────────────────────────┐
│                                         │
│    ┌─────────────────┐                  │
│    │   ZONE TEXTE    │                  │
│    └─────────────────┘                  │
│                                         │
└─────────────────────────────────────────┘
(area non visible)

Zone SÉLECTIONNÉE :
┌─────────────────────────────────────────┐
│                                         │
│    ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐           │
│    │ ┏━━━━━━━━━━━━━━━┓     │           │
│    │ ┃   ZONE TEXTE  ┃     │ ← Area    │
│    │ ┗━━━━━━━━━━━━━━━┛     │   visible │
│    └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘           │
│                                         │
└─────────────────────────────────────────┘
```

---

## Structure de données

### Modification de la structure contrainte

```javascript
/**
 * @typedef {Object} AreaContrainte
 * @property {number} xMm - Position X du coin supérieur gauche de l'area en mm
 * @property {number} yMm - Position Y du coin supérieur gauche de l'area en mm
 * @property {number} wMm - Largeur de l'area en mm
 * @property {number} hMm - Hauteur de l'area en mm
 */

/**
 * @typedef {Object} ZoneContrainte
 * @property {boolean} [positionFixe] - Si true, position X,Y non modifiable
 * @property {boolean} [nonSupprimable] - Si true, zone non supprimable
 * @property {number} [minWMm] - Largeur minimale en mm
 * @property {number} [maxWMm] - Largeur maximale en mm
 * @property {number} [minHMm] - Hauteur minimale en mm
 * @property {number} [maxHMm] - Hauteur maximale en mm
 * @property {AreaContrainte} [area] - Zone autorisée pour déplacement/redimensionnement
 */
```

### Exemple complet

```javascript
contrainte: {
    positionFixe: false,        // Peut bouger (dans l'area)
    nonSupprimable: true,
    minWMm: 50,
    maxWMm: 100,
    minHMm: 15,
    maxHMm: 40,
    area: {
        xMm: 5,       // L'area commence à 5mm du bord gauche
        yMm: 5,       // L'area commence à 5mm du bord haut
        wMm: 100,     // L'area fait 100mm de large
        hMm: 60       // L'area fait 60mm de haut
    }
}
```

---

## Structures WebDev

### Nouvelle structure stDesignerAreaContrainte

```wl
// -----------------------------------------------------------------------------
// AREA DE CONTRAINTE (zone autorisée pour déplacement/redimensionnement)
// -----------------------------------------------------------------------------
stDesignerAreaContrainte est une Structure
    'xMm'   est un réel   <sérialise = "xMm">    // Position X en mm
    'yMm'   est un réel   <sérialise = "yMm">    // Position Y en mm
    'wMm'   est un réel   <sérialise = "wMm">    // Largeur en mm
    'hMm'   est un réel   <sérialise = "hMm">    // Hauteur en mm
fin
```

### Modification de stDesignerZoneContrainte

```wl
// -----------------------------------------------------------------------------
// CONTRAINTE D'UNE ZONE PRÉDÉFINIE (version mise à jour)
// -----------------------------------------------------------------------------
stDesignerZoneContrainte est une Structure
    'positionFixe'      est un booléen                  <sérialise = "positionFixe">
    'nonSupprimable'    est un booléen                  <sérialise = "nonSupprimable">
    'minWMm'            est un réel                     <sérialise = "minWMm">
    'maxWMm'            est un réel                     <sérialise = "maxWMm">
    'minHMm'            est un réel                     <sérialise = "minHMm">
    'maxHMm'            est un réel                     <sérialise = "maxHMm">
    'area'              est une stDesignerAreaContrainte <sérialise = "area">  // NOUVEAU
fin
```

---

## Exemple d'utilisation WebDev

### Enveloppe avec zone adresse dans une area

```wl
// Zone prédéfinie : Adresse retour dans une area en haut à gauche
stZoneAdresse est une stDesignerZonePredefinie

stZoneAdresse.type                      = "textQuill"
stZoneAdresse.page                      = 0

// Position initiale de la zone (dans l'area)
stZoneAdresse.xMm                       = 10
stZoneAdresse.yMm                       = 10
stZoneAdresse.wMm                       = 70
stZoneAdresse.hMm                       = 20

// Contraintes
stZoneAdresse.contrainte.positionFixe   = Faux   // Peut bouger dans l'area
stZoneAdresse.contrainte.nonSupprimable = Vrai
stZoneAdresse.contrainte.minWMm         = 50
stZoneAdresse.contrainte.maxWMm         = 90
stZoneAdresse.contrainte.minHMm         = 15
stZoneAdresse.contrainte.maxHMm         = 40

// Area : rectangle autorisé (haut gauche de l'enveloppe)
stZoneAdresse.contrainte.area.xMm       = 5
stZoneAdresse.contrainte.area.yMm       = 5
stZoneAdresse.contrainte.area.wMm       = 100
stZoneAdresse.contrainte.area.hMm       = 50

stContraintes.zonesPredefines.Ajoute(stZoneAdresse)
```

### Enveloppe avec zone logo dans une area (coin droit)

```wl
// Zone prédéfinie : Logo dans une area en haut à droite
stZoneLogo est une stDesignerZonePredefinie

stZoneLogo.type                         = "image"
stZoneLogo.page                         = 0

// Position initiale (dans l'area)
stZoneLogo.xMm                          = 170
stZoneLogo.yMm                          = 10
stZoneLogo.wMm                          = 30
stZoneLogo.hMm                          = 20

// Contraintes
stZoneLogo.contrainte.positionFixe      = Faux
stZoneLogo.contrainte.nonSupprimable    = Vrai
stZoneLogo.contrainte.minWMm            = 20
stZoneLogo.contrainte.maxWMm            = 50
stZoneLogo.contrainte.minHMm            = 15
stZoneLogo.contrainte.maxHMm            = 35

// Area : rectangle autorisé (haut droite de l'enveloppe, 229mm de large)
stZoneLogo.contrainte.area.xMm          = 160
stZoneLogo.contrainte.area.yMm          = 5
stZoneLogo.contrainte.area.wMm          = 60
stZoneLogo.contrainte.area.hMm          = 45

stContraintes.zonesPredefines.Ajoute(stZoneLogo)
```

---

## Phases d'implémentation suggérées

### Phase 11.1 : Structure et typedef
- Ajouter le @typedef `AreaContrainte`
- Mettre à jour le @typedef `ZoneContrainte` avec propriété `area`
- Mettre à jour `DEFAULT_CONSTRAINTS` si nécessaire

### Phase 11.2 : Élément DOM area
- Créer l'élément DOM `.zone-area` pour chaque zone avec area
- Positionner et dimensionner l'area selon les coordonnées mm
- Appliquer le style CSS (bordure pointillée, couleur thème)

### Phase 11.3 : Visibilité area
- Afficher l'area quand la zone associée est sélectionnée
- Masquer l'area quand la zone est désélectionnée
- Masquer l'area en mode aperçu

### Phase 11.4 : Contrainte drag dans area
- Modifier la logique de drag pour contraindre la zone dans l'area
- La zone entière doit rester dans l'area (pas juste le coin)
- Prendre en compte les dimensions actuelles de la zone

### Phase 11.5 : Contrainte resize dans area
- Modifier `applyContrainteBounds()` pour inclure les limites de l'area
- Le redimensionnement ne peut pas faire sortir la zone de l'area
- Combiner avec les bornes min/max existantes

### Phase 11.6 : Contrainte inputs toolbar
- Modifier `applyGeometryChange()` pour X/Y dans l'area
- Modifier `applyGeometryChange()` pour W/H dans l'area
- Les valeurs saisies sont ajustées automatiquement

### Phase 11.7 : Création zones prédéfinies avec area
- Mettre à jour `createPredefinedZones()` pour créer les éléments area
- Gérer l'association zone ↔ area

### Phase 11.8 : Tests et validation
- Tests unitaires des contraintes
- Tests d'intégration avec WebDev
- Validation visuelle

---

## Impacts sur le code existant

### Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `script.js` | @typedef, drag, resize, applyGeometryChange, createZoneDOM |
| `style.css` | Classe `.zone-area` avec styles |

### Fonctions à modifier

| Fonction | Modification |
|----------|--------------|
| `createPredefinedZones()` | Créer l'élément area associé |
| `createZoneDOM()` | Gérer l'affichage de l'area |
| Bloc `isDragging` (mousemove) | Contraindre dans l'area |
| Bloc `isResizing` (mousemove) | Contraindre dans l'area |
| `applyContrainteBounds()` | Ajouter limites area |
| `applyGeometryChange()` | Ajouter limites area |
| `updateSelectionUI()` | Afficher/masquer area |

### Nouvelles fonctions suggérées

| Fonction | Description |
|----------|-------------|
| `createAreaElement(zoneId, area)` | Crée l'élément DOM de l'area |
| `updateAreaVisibility(zoneId, visible)` | Affiche/masque l'area |
| `getAreaBounds(zoneId)` | Retourne les limites de l'area en pixels |
| `constrainToArea(x, y, w, h, area)` | Contraint une géométrie dans l'area |

---

## CSS proposé

```css
/* ===========================================
   AREA DE CONTRAINTE
   =========================================== */

.zone-area {
    position: absolute;
    border: 1px dashed #90CAF9;  /* Bleu clair thème */
    background: transparent;
    pointer-events: none;        /* Ne bloque pas les interactions */
    z-index: 1;                  /* Derrière les zones (z-index plus élevé) */
    box-sizing: border-box;
    display: none;               /* Masquée par défaut */
}

/* Afficher l'area quand la zone associée est sélectionnée */
.zone.selected + .zone-area,
.zone-area.visible {
    display: block;
}

/* Alternative : area toujours visible mais plus discrète quand non sélectionnée */
.zone-area.always-visible {
    display: block;
    opacity: 0.3;
}

.zone-area.always-visible.active {
    opacity: 1;
}

/* Masquer en mode aperçu */
.preview-mode .zone-area {
    display: none !important;
}
```

---

## Validation

### Critères d'acceptation

| Critère | Description |
|---------|-------------|
| ✅ | L'area s'affiche quand la zone est sélectionnée |
| ✅ | L'area a une bordure pointillée de couleur thème |
| ✅ | Le drag maintient la zone entièrement dans l'area |
| ✅ | Le resize ne permet pas de dépasser l'area |
| ✅ | Les inputs X/Y toolbar sont contraints par l'area |
| ✅ | Les inputs L/H toolbar sont contraints par l'area |
| ✅ | L'area n'apparaît pas en mode aperçu |
| ✅ | L'area n'est pas exportée / imprimée |
| ✅ | Compatibilité avec positionFixe (area ignore position si fixe) |
| ✅ | Combinaison correcte avec bornes min/max |

### Tests manuels

```javascript
// Test : Zone avec area
applyConstraints({
    autorisations: { textQuill: true, image: false, qr: false, barcode: false },
    limites: { textQuill: 1 },
    zonesPredefines: [{
        type: 'textQuill',
        page: 0,
        xMm: 20,
        yMm: 20,
        wMm: 60,
        hMm: 20,
        contrainte: {
            positionFixe: false,
            nonSupprimable: true,
            minWMm: 40,
            maxWMm: 80,
            minHMm: 15,
            maxHMm: 35,
            area: {
                xMm: 10,
                yMm: 10,
                wMm: 100,
                hMm: 50
            }
        }
    }]
});

// Vérifications :
// 1. Sélectionner la zone → area visible (bordure pointillée)
// 2. Désélectionner → area masquée
// 3. Drag vers la droite → bloqué à x=50 (10+100-60)
// 4. Drag vers le bas → bloqué à y=40 (10+50-20)
// 5. Resize largeur à 100 → limité à 80 (maxWMm) ou 90 (area)
// 6. Input X=200 → corrigé à 50 max
```

---

## Historique

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Janvier 2026 | Cahier des charges initial |

---

## Auteur

Documentation créée dans le cadre du projet **Marketeam Designer** - Extension Phase 10 : Zone Area pour contraintes.
