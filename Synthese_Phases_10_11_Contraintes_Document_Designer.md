# Synthèse Phases 10-11 : Contraintes de document - Designer Marketeam

## Vue d'ensemble

**Date** : Janvier 2026  
**Version** : 2.0  
**Statut** : ✅ Implémenté et validé

### Objectif

Permettre à WebDev de paramétrer les autorisations de création de zones au niveau du document pour gérer différents types de documents (flyer classique, enveloppe, tract) avec des règles variées, incluant des zones prédéfinies avec contraintes de position, taille et area de déplacement.

### Problématique résolue

| Type de document | Besoins |
|------------------|---------|
| Flyer classique | Création libre de toutes les zones |
| Enveloppe adresse retour | 1 zone texte prédéfinie, position fixe, non supprimable |
| Enveloppe logo | 1 zone image prédéfinie, mobile dans une area |
| Enveloppe adresse + logo | 1 texte fixe + 1 image mobile dans area |
| Document tract | Zones limitées avec contraintes de taille |

---

## Architecture

### Structure documentState.constraints

```javascript
documentState.constraints = {
    // Autorisations de création par type
    autorisations: {
        textQuill: true,   // Autoriser création zones texte
        image: true,       // Autoriser création zones image
        qr: true,          // Autoriser création QR Code Marketeam
        barcode: true      // Autoriser création codes-barres
    },
    
    // Limites de nombre par type (null = illimité)
    limites: {
        textQuill: null,   // Pas de limite
        image: null,       // Pas de limite
        qr: 1,             // 1 seul QR Marketeam par document
        barcode: null      // Pas de limite
    },
    
    // Zones créées automatiquement au chargement
    zonesPredefines: [
        {
            type: 'textQuill',      // ou 'image'
            page: 0,                // Index page (0=recto, 1=verso)
            xMm: 10,                // Position X en mm
            yMm: 10,                // Position Y en mm
            wMm: 80,                // Largeur en mm
            hMm: 25,                // Hauteur en mm
            contrainte: {
                positionFixe: true,     // Position non modifiable
                nonSupprimable: true,   // Zone non supprimable
                minWMm: 50,             // Largeur minimale en mm
                maxWMm: 100,            // Largeur maximale en mm
                minHMm: 15,             // Hauteur minimale en mm
                maxHMm: 40,             // Hauteur maximale en mm
                area: {                 // Zone autorisée (Phase 11)
                    xMm: 5,             // Position X de l'area
                    yMm: 5,             // Position Y de l'area
                    wMm: 100,           // Largeur de l'area
                    hMm: 60             // Hauteur de l'area
                }
            }
        }
    ]
};
```

### Hiérarchie des types de zones

```
┌─────────────────────────────────────────────────────────────────┐
│  HIÉRARCHIE DES ZONES                                           │
│                                                                 │
│  Zone normale                                                   │
│    └── Déplaçable, redimensionnable, supprimable                │
│                                                                 │
│  Zone contrainte                                                │
│    ├── Position fixe OU mobile dans une area                    │
│    ├── Taille modifiable avec bornes min/max                    │
│    ├── Taille limitée par l'area si définie                     │
│    ├── Supprimable ou non selon configuration                   │
│    └── Contenu et propriétés éditables                          │
│                                                                 │
│  Zone locked (verrouillée)                                      │
│    └── Position et taille fixes, contenu éditable               │
│                                                                 │
│  Zone système                                                   │
│    └── Entièrement protégée, non modifiable                     │
└─────────────────────────────────────────────────────────────────┘
```

### Comportement de l'area (Phase 11)

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPORTEMENT SELON CONFIGURATION                               │
│                                                                 │
│  positionFixe=true, pas d'area                                  │
│    → Position figée, taille avec bornes min/max                 │
│                                                                 │
│  positionFixe=true, area définie                                │
│    → Position figée (area ignorée pour position)                │
│    → Taille limitée par area ET bornes min/max                  │
│                                                                 │
│  positionFixe=false, pas d'area                                 │
│    → Libre dans toute la page (marge de sécurité)               │
│    → Taille avec bornes min/max                                 │
│                                                                 │
│  positionFixe=false, area définie                               │
│    → Mobile uniquement dans l'area                              │
│    → Taille limitée par area ET bornes min/max                  │
│    → Bordure pointillée bleue visible à la sélection            │
└─────────────────────────────────────────────────────────────────┘
```

### Flux de communication WebDev ↔ Designer

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUX CONSTRAINTS                                               │
│                                                                 │
│  WebDev                                                         │
│    │                                                            │
│    │  postMessage({ action: 'load', data: {...},                │
│    │               constraints: {...} })                        │
│    │                                                            │
│    │  OU                                                        │
│    │                                                            │
│    │  postMessage({ action: 'setConstraints',                   │
│    │               constraints: {...} })                        │
│    ▼                                                            │
│  Designer (handleParentMessage)                                 │
│    │                                                            │
│    ├── applyConstraints()                                       │
│    │     └── Fusionne avec DEFAULT_CONSTRAINTS                  │
│    │     └── Met à jour documentState.constraints               │
│    │                                                            │
│    ├── createPredefinedZones()                                  │
│    │     └── Crée les zones sur les pages cibles                │
│    │     └── Crée les areas associées si définies               │
│    │     └── Applique les contraintes à chaque zone             │
│    │                                                            │
│    └── updateZoneButtonsVisibility()                            │
│          └── Masque les boutons selon autorisations/limites     │
│                                                                 │
│    │                                                            │
│    │  postMessage({ action: 'constraintsApplied',               │
│    │               success: true })                             │
│    ▼                                                            │
│  WebDev                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phases d'implémentation

### Phase 10 : Contraintes de base

| Phase | Description | Statut |
|-------|-------------|--------|
| 10.0 | Correction btnAddBarcode (scope DOM) | ✅ |
| 10.1 | Structure constraints et typedef | ✅ |
| 10.2 | Fonction countZonesByType() | ✅ |
| 10.3 | Visibilité boutons sidebar | ✅ |
| 10.4 | Gestion zones contraintes (badge, drag, suppression) | ✅ |
| 10.5 | Bornes taille min/max redimensionnement | ✅ |
| 10.6 | Création zones prédéfinies | ✅ |
| 10.7 | Intégration message WebDev | ✅ |
| 10.8 | Reset avec recréation zones prédéfinies | ✅ |
| 10.9 | Contraintes inputs toolbar X/Y/L/H | ✅ |

### Phase 11 : Zone Area

| Phase | Description | Statut |
|-------|-------------|--------|
| 11.1 | Structure AreaContrainte et typedef | ✅ |
| 11.2 | Élément DOM area (bordure pointillée) | ✅ |
| 11.3 | Visibilité area (sélection unique) | ✅ |
| 11.4 | Contrainte drag dans area | ✅ |
| 11.5 | Contrainte resize dans area | ✅ |
| 11.6 | Contrainte inputs toolbar avec area | ✅ |
| 11.7 | Nettoyage areas (suppression, reset, undo) | ✅ |

---

## Structures WebDev

### Structures de contraintes

```wl
// =============================================================================
// CONTRAINTES DE DOCUMENT (Phases 10-11)
// =============================================================================

// -----------------------------------------------------------------------------
// AUTORISATIONS DE CRÉATION PAR TYPE DE ZONE
// -----------------------------------------------------------------------------
stDesignerConstraintsAutorisations est une Structure
    'textQuill'     est un booléen  <sérialise = "textQuill">
    'image'         est un booléen  <sérialise = "image">
    'qr'            est un booléen  <sérialise = "qr">
    'barcode'       est un booléen  <sérialise = "barcode">
fin

// -----------------------------------------------------------------------------
// LIMITES DE NOMBRE PAR TYPE DE ZONE
// -----------------------------------------------------------------------------
// Valeur -1 = illimité (converti en null côté Designer)
// Valeur 0 = interdit
// Valeur > 0 = nombre maximum
// -----------------------------------------------------------------------------
stDesignerConstraintsLimites est une Structure
    'textQuill'     est un entier   <sérialise = "textQuill">
    'image'         est un entier   <sérialise = "image">
    'qr'            est un entier   <sérialise = "qr">
    'barcode'       est un entier   <sérialise = "barcode">
fin

// -----------------------------------------------------------------------------
// AREA DE CONTRAINTE (Phase 11)
// Zone rectangulaire dans laquelle une zone peut être déplacée/redimensionnée
// -----------------------------------------------------------------------------
stDesignerAreaContrainte est une Structure
    'xMm'       est un réel     <sérialise = "xMm">
    'yMm'       est un réel     <sérialise = "yMm">
    'wMm'       est un réel     <sérialise = "wMm">
    'hMm'       est un réel     <sérialise = "hMm">
fin

// -----------------------------------------------------------------------------
// CONTRAINTE D'UNE ZONE PRÉDÉFINIE
// -----------------------------------------------------------------------------
// Comportement de l'area :
// - Si positionFixe=Vrai : la zone ne bouge pas (area ignorée pour la position)
// - Si positionFixe=Faux + area définie : la zone peut bouger uniquement dans l'area
// - Si positionFixe=Faux + pas d'area : la zone peut bouger dans toute la page
// Le redimensionnement est toujours contraint par l'area si elle est définie.
// -----------------------------------------------------------------------------
stDesignerZoneContrainte est une Structure
    'positionFixe'      est un booléen                      <sérialise = "positionFixe">
    'nonSupprimable'    est un booléen                      <sérialise = "nonSupprimable">
    'minWMm'            est un réel                         <sérialise = "minWMm">
    'maxWMm'            est un réel                         <sérialise = "maxWMm">
    'minHMm'            est un réel                         <sérialise = "minHMm">
    'maxHMm'            est un réel                         <sérialise = "maxHMm">
    'area'              est une stDesignerAreaContrainte    <sérialise = "area">
fin

// -----------------------------------------------------------------------------
// ZONE PRÉDÉFINIE
// -----------------------------------------------------------------------------
stDesignerZonePredefinie est une Structure
    'type'          est une chaîne                      <sérialise = "type">
    'page'          est un entier                       <sérialise = "page">
    'xMm'           est un réel                         <sérialise = "xMm">
    'yMm'           est un réel                         <sérialise = "yMm">
    'wMm'           est un réel                         <sérialise = "wMm">
    'hMm'           est un réel                         <sérialise = "hMm">
    'contrainte'    est une stDesignerZoneContrainte    <sérialise = "contrainte">
fin

// -----------------------------------------------------------------------------
// CONTRAINTES GLOBALES DU DOCUMENT
// -----------------------------------------------------------------------------
stDesignerConstraints est une Structure
    'autorisations'     est une stDesignerConstraintsAutorisations  <sérialise = "autorisations">
    'limites'           est une stDesignerConstraintsLimites        <sérialise = "limites">
    'zonesPredefines'   est un tableau                              <sérialise = "zonesPredefines"> de stDesignerZonePredefinie
fin

// -----------------------------------------------------------------------------
// MESSAGE LOAD (envoyé au Designer)
// -----------------------------------------------------------------------------
stDesignerLoad est une Structure
    'action'        est une chaîne                  <sérialise = "action">
    'data'          est une stDesignerDocument      <sérialise = "data">
    'constraints'   est une stDesignerConstraints   <sérialise = "constraints">
fin
```

---

## Exemples d'utilisation WebDev

### Exemple 1 : Document libre (flyer classique)

```wl
stContraintes est une stDesignerConstraints

// Tout autorisé
stContraintes.autorisations.textQuill   = Vrai
stContraintes.autorisations.image       = Vrai
stContraintes.autorisations.qr          = Vrai
stContraintes.autorisations.barcode     = Vrai

// Pas de limites (-1 = illimité)
stContraintes.limites.textQuill         = -1
stContraintes.limites.image             = -1
stContraintes.limites.qr                = 1
stContraintes.limites.barcode           = -1

// Pas de zones prédéfinies
```

### Exemple 2 : Enveloppe avec texte fixe + image mobile dans area

```wl
stContraintes est une stDesignerConstraints

// Autorisations : texte et image uniquement
stContraintes.autorisations.textQuill   = Vrai
stContraintes.autorisations.image       = Vrai
stContraintes.autorisations.qr          = Faux
stContraintes.autorisations.barcode     = Faux

// Une zone de chaque
stContraintes.limites.textQuill         = 1
stContraintes.limites.image             = 1
stContraintes.limites.qr                = 0
stContraintes.limites.barcode           = 0

// -----------------------------------------------------------------------------
// ZONE 1 : Adresse retour (position fixe)
// -----------------------------------------------------------------------------
stZoneAdresse est une stDesignerZonePredefinie

stZoneAdresse.type                      = "textQuill"
stZoneAdresse.page                      = 0
stZoneAdresse.xMm                       = 10
stZoneAdresse.yMm                       = 10
stZoneAdresse.wMm                       = 80
stZoneAdresse.hMm                       = 15

stZoneAdresse.contrainte.positionFixe   = Vrai
stZoneAdresse.contrainte.nonSupprimable = Vrai
stZoneAdresse.contrainte.minWMm         = 50
stZoneAdresse.contrainte.maxWMm         = 100
stZoneAdresse.contrainte.minHMm         = 15
stZoneAdresse.contrainte.maxHMm         = 20

stContraintes.zonesPredefines.Ajoute(stZoneAdresse)

// -----------------------------------------------------------------------------
// ZONE 2 : Logo (mobile dans une area sous le texte)
// -----------------------------------------------------------------------------
stZoneLogo est une stDesignerZonePredefinie

stZoneLogo.type                         = "image"
stZoneLogo.page                         = 0
stZoneLogo.xMm                          = 10
stZoneLogo.yMm                          = 35
stZoneLogo.wMm                          = 40
stZoneLogo.hMm                          = 40

stZoneLogo.contrainte.positionFixe      = Faux           // Mobile dans l'area
stZoneLogo.contrainte.nonSupprimable    = Vrai
stZoneLogo.contrainte.minWMm            = 20
stZoneLogo.contrainte.maxWMm            = 50
stZoneLogo.contrainte.minHMm            = 20
stZoneLogo.contrainte.maxHMm            = 50

// Area sous le texte
stZoneLogo.contrainte.area.xMm          = 10
stZoneLogo.contrainte.area.yMm          = 30
stZoneLogo.contrainte.area.wMm          = 100
stZoneLogo.contrainte.area.hMm          = 112

stContraintes.zonesPredefines.Ajoute(stZoneLogo)
```

### Schéma visuel de l'exemple 2

```
┌─────────────────────────────────────────────────────────────────┐
│  ENVELOPPE C5 (229mm x 162mm)                                   │
│                                                                 │
│  y=10mm ┌─────────────────────────────────┐                     │
│         │  ZONE TEXTE (position fixe)     │                     │
│         │  80mm x 15mm (max 100x20)       │                     │
│  y=30mm └─────────────────────────────────┘                     │
│         ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐                    │
│         │  AREA (100mm x 112mm)            │                    │
│         │  Bordure pointillée bleue        │                    │
│         │                                  │                    │
│         │   ┌──────────────┐               │                    │
│         │   │    IMAGE     │ ← Mobile      │                    │
│         │   │   40x40mm    │   dans l'area │                    │
│         │   │  (max 50x50) │               │                    │
│         │   └──────────────┘               │                    │
│         │                                  │                    │
│  y=142mm└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        x=10mm                           x=110mm
```

---

## Fonctions Designer

### Phase 10 - Contraintes de base

| Fonction | Description |
|----------|-------------|
| `countZonesByType()` | Compte les zones par type sur toutes les pages |
| `updateZoneButtonsVisibility()` | Met à jour visibilité boutons sidebar |
| `updateContrainteBadge(zoneId)` | Affiche/masque le badge "Zone contrainte" |
| `applyContrainteBounds(contrainte, w, h)` | Applique les bornes min/max |
| `createPredefinedZones()` | Crée les zones prédéfinies |
| `applyConstraints(constraints)` | Applique les contraintes depuis WebDev |

### Phase 11 - Zone Area

| Fonction | Description |
|----------|-------------|
| `createAreaElement(zoneId, area)` | Crée l'élément DOM de l'area |
| `removeAreaElement(zoneId)` | Supprime l'area d'une zone |
| `clearAllAreas()` | Supprime toutes les areas |
| `updateAreaVisibility(zoneId, visible)` | Affiche/masque une area |
| `updateAreasVisibility()` | Met à jour toutes les areas selon sélection |
| `getAreaBoundsInPixels(zoneId, w, h)` | Limites de positionnement (drag) |
| `getAreaMaxSizeInPixels(zoneId, x, y)` | Limites de taille (resize) |
| `getGeometryLimitsForZone(zoneId)` | Limites en mm pour inputs toolbar |

### Fonctions exposées sur window

```javascript
window.createPredefinedZones
window.applyConstraints
window.createAreaElement
window.removeAreaElement
window.clearAllAreas
window.updateAreaVisibility
window.updateAreasVisibility
window.getAreaBoundsInPixels
window.getAreaMaxSizeInPixels
window.getGeometryLimitsForZone
window.areaElements  // Map des areas
```

---

## Comportements UI

### Badge "Zone contrainte"

| Propriété | Valeur |
|-----------|--------|
| Texte | "Zone contrainte" |
| Couleur fond | `#FF9800` (orange Material) |
| Position | Gauche |
| Visibilité | Affiché si `positionFixe` OU `nonSupprimable` |

### Area (bordure pointillée)

| Propriété | Valeur |
|-----------|--------|
| Bordure | 1.5px dashed `#90CAF9` (bleu clair) |
| Fond | Transparent |
| z-index | 1 (derrière les zones) |
| Visibilité | Uniquement quand zone sélectionnée (sélection unique) |

### Bouton Supprimer

| Condition | État |
|-----------|------|
| Zone normale | Actif |
| Zone contrainte `nonSupprimable: true` | Grisé |
| Zone système | Grisé |

### Champs toolbar X, Y, L, H

| Champ | Zone normale | Zone contrainte sans area | Zone contrainte avec area |
|-------|--------------|---------------------------|---------------------------|
| X | Modifiable | Bloqué si positionFixe | Contraint à l'area |
| Y | Modifiable | Bloqué si positionFixe | Contraint à l'area |
| L | Modifiable | Bornes min/max | Bornes min/max + area |
| H | Modifiable | Bornes min/max | Bornes min/max + area |

---

## CSS ajouté

```css
/* Badge zone contrainte (Phase 10) */
.contrainte-badge {
    position: absolute;
    top: -20px;
    left: 0;
    background: #FF9800;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
}

/* Area de contrainte (Phase 11) */
.zone-area {
    position: absolute;
    border: 1.5px dashed #90CAF9;
    background: transparent;
    pointer-events: none;
    z-index: 1;
    box-sizing: border-box;
    display: none;
    border-radius: 2px;
}

.zone-area.visible {
    display: block;
}

.preview-mode .zone-area {
    display: none !important;
}
```

---

## Tests de validation

### Script de test rapide

```javascript
// Test Phase 10 + 11
applyConstraints({
    autorisations: { textQuill: true, image: true, qr: false, barcode: false },
    limites: { textQuill: 1, image: 1 },
    zonesPredefines: [
        {
            type: 'textQuill',
            page: 0,
            xMm: 10, yMm: 10, wMm: 80, hMm: 15,
            contrainte: {
                positionFixe: true,
                nonSupprimable: true,
                minWMm: 50, maxWMm: 100,
                minHMm: 15, maxHMm: 20
            }
        },
        {
            type: 'image',
            page: 0,
            xMm: 10, yMm: 35, wMm: 40, hMm: 40,
            contrainte: {
                positionFixe: false,
                nonSupprimable: true,
                minWMm: 20, maxWMm: 50,
                minHMm: 20, maxHMm: 50,
                area: { xMm: 10, yMm: 30, wMm: 100, hMm: 112 }
            }
        }
    ]
});

console.log('Zones créées:', Object.keys(documentState.pages[0].zones).length);
console.log('Areas créées:', areaElements.size);
```

### Checklist de validation

| Test | Description | Statut |
|------|-------------|--------|
| 1 | Structure constraints par défaut | ☐ |
| 2 | countZonesByType() correct | ☐ |
| 3 | Boutons masqués si autorisation false | ☐ |
| 4 | Boutons masqués si limite atteinte | ☐ |
| 5 | Zones prédéfinies créées | ☐ |
| 6 | Badge "Zone contrainte" affiché | ☐ |
| 7 | Drag bloqué si positionFixe | ☐ |
| 8 | Drag contraint dans area | ☐ |
| 9 | Bouton Supprimer grisé si nonSupprimable | ☐ |
| 10 | Resize contraint aux bornes min/max | ☐ |
| 11 | Resize contraint dans area | ☐ |
| 12 | Input X/Y bloqué si positionFixe | ☐ |
| 13 | Input X/Y contraint dans area | ☐ |
| 14 | Input L/H contraint aux bornes + area | ☐ |
| 15 | Area visible à la sélection | ☐ |
| 16 | Area masquée à la désélection | ☐ |
| 17 | Reset recrée zones prédéfinies | ☐ |
| 18 | Undo/Redo gère correctement les areas | ☐ |
| 19 | Suppression zone supprime son area | ☐ |

---

## Fichiers modifiés

### Designer (script.js)

| Section | Modifications |
|---------|---------------|
| @typedef | AreaContrainte, ZoneContrainte (avec area), types contraintes |
| Section 2 | Constante DEFAULT_CONSTRAINTS |
| Section 3 | documentState.constraints, Map areaElements |
| Section 6 | Fonctions contraintes et area |
| Section 14 | Blocage drag, contrainte dans area |
| Section 15 | Resize avec bornes et area, applyGeometryChange |
| Section 17 | Reset avec recréation zones et nettoyage areas |
| Section 18 | handleParentMessage, restoreState avec areas |
| Expositions | Toutes les fonctions sur window |

### Designer (style.css)

| Élément | Description |
|---------|-------------|
| `.contrainte-badge` | Badge orange "Zone contrainte" |
| `.zone-area` | Bordure pointillée bleue |
| `.zone-area.visible` | Affichage conditionnel |
| `.preview-mode .zone-area` | Masquage en aperçu |

### WebDev (Structures)

| Structure | Description |
|-----------|-------------|
| `stDesignerConstraintsAutorisations` | Booléens par type |
| `stDesignerConstraintsLimites` | Entiers par type |
| `stDesignerAreaContrainte` | xMm, yMm, wMm, hMm |
| `stDesignerZoneContrainte` | Avec area optionnelle |
| `stDesignerZonePredefinie` | Définition zone prédéfinie |
| `stDesignerConstraints` | Structure globale |
| `stDesignerLoad` | Ajout champ constraints |

---

## Limitations et évolutions futures

### Limitations actuelles

1. **Types zones prédéfinies** : Uniquement `textQuill` et `image`
2. **Area rectangulaire** : Pas de formes complexes
3. **Une area par zone** : Pas de multi-areas
4. **Undo/Redo contraintes** : Contraintes non historisées (viennent de WebDev)

### Évolutions possibles

1. **Zones QR/Barcode prédéfinies** : Étendre aux autres types
2. **Contenu par défaut** : Pré-remplir le contenu des zones
3. **Areas multiples** : Plusieurs zones autorisées par zone
4. **Export contraintes** : Inclure dans l'export JSON
5. **Feedback visuel drag** : Indicateur quand on approche des limites

---

## Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | Janvier 2026 | Phase 10 - Contraintes de base |
| 2.0 | Janvier 2026 | Phase 11 - Zone Area |

---

## Auteur

Documentation créée dans le cadre du projet **Marketeam Designer** - Phases 10-11 : Contraintes de document.
