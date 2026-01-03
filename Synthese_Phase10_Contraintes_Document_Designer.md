# Synthèse Phase 10 : Contraintes de document - Designer Marketeam

## Vue d'ensemble

**Date** : Janvier 2026  
**Version** : 1.0  
**Statut** : ✅ Implémenté et validé

### Objectif

Permettre à WebDev de paramétrer les autorisations de création de zones au niveau du document pour gérer différents types de documents (flyer classique, enveloppe simple/couleur/tract, document secondaire) avec des règles variées.

### Problématique résolue

| Type de document | Besoins |
|------------------|---------|
| Flyer classique | Création libre de toutes les zones |
| Enveloppe adresse retour | 1 zone texte prédéfinie, position fixe, non supprimable |
| Enveloppe logo | 1 zone image prédéfinie, position fixe, non supprimable |
| Enveloppe adresse + logo | 1 texte + 1 image prédéfinies, positions fixes |
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
                maxHMm: 40              // Hauteur maximale en mm
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
│  Zone contrainte (NOUVEAU)                                      │
│    └── Position fixe OU limitée                                 │
│    └── Taille modifiable avec bornes min/max                    │
│    └── Supprimable ou non selon configuration                   │
│    └── Contenu et propriétés éditables                          │
│                                                                 │
│  Zone locked (verrouillée)                                      │
│    └── Position et taille fixes                                 │
│    └── Contenu éditable                                         │
│                                                                 │
│  Zone système                                                   │
│    └── Entièrement protégée                                     │
│    └── Non modifiable par l'utilisateur                         │
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

### Phase 0 : Correction préalable
- **Problème** : `btnAddBarcode` déclaré ligne 6958 au lieu de Section 1
- **Solution** : Déplacer la déclaration en Section 1 avec les autres boutons

### Phase 1 : Structure constraints
- Ajout des @typedef : `ConstraintsAutorisations`, `ConstraintsLimites`, `ZoneContrainte`, `ZonePredefinie`, `DocumentConstraints`
- Création de la constante `DEFAULT_CONSTRAINTS`
- Initialisation de `documentState.constraints`

### Phase 2 : Fonction countZonesByType()
- Compte les zones par type sur toutes les pages
- Distingue QR Marketeam (sans `qrConfig.type`) des QR code-barres

### Phase 3 : Visibilité boutons sidebar
- Remplacement de `updateQrInteractifButtonVisibility()` par `updateZoneButtonsVisibility()`
- Masquage des boutons si `autorisations[type] === false` OU limite atteinte

### Phase 4 : Gestion zones contraintes
- Ajout propriété `contrainte` dans les typedef zones
- Fonction `updateContrainteBadge()` pour afficher le badge orange
- Blocage du drag si `contrainte.positionFixe === true`
- Grisage du bouton Supprimer si `contrainte.nonSupprimable === true`
- CSS du badge `.contrainte-badge` (orange, position gauche)

### Phase 5 : Bornes taille redimensionnement
- Fonction `applyContrainteBounds()` pour contraindre les dimensions
- Intégration dans le bloc `isResizing` du mousemove

### Phase 6 : Création zones prédéfinies
- Fonction `createPredefinedZones()` 
- Conversion mm → pixels des coordonnées
- Marqueur `_predefinedCreated` pour éviter les doublons
- Exposition sur `window` pour les tests

### Phase 7 : Intégration message WebDev
- Fonction `applyConstraints()` pour fusionner et appliquer les contraintes
- Case `setConstraints` dans `handleParentMessage`
- Support `constraints` dans le message `load`

### Phase 8 : Reset avec recréation
- Modification de `resetCurrentPage()` et `resetAllPages()`
- Recréation des zones prédéfinies après reset

### Phase 9 : Contraintes inputs toolbar
- Blocage modification X/Y si `positionFixe === true`
- Application des bornes min/max sur W/H dans `applyGeometryChange()`

---

## Structures WebDev

### Nouvelles structures à ajouter

```wl
// =============================================================================
// CONTRAINTES DE DOCUMENT (Phase 10)
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
// CONTRAINTE D'UNE ZONE PRÉDÉFINIE
// -----------------------------------------------------------------------------
stDesignerZoneContrainte est une Structure
    'positionFixe'      est un booléen  <sérialise = "positionFixe">
    'nonSupprimable'    est un booléen  <sérialise = "nonSupprimable">
    'minWMm'            est un réel     <sérialise = "minWMm">
    'maxWMm'            est un réel     <sérialise = "maxWMm">
    'minHMm'            est un réel     <sérialise = "minHMm">
    'maxHMm'            est un réel     <sérialise = "maxHMm">
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
```

### Modification de stDesignerLoad

```wl
// -----------------------------------------------------------------------------
// MESSAGE LOAD (envoyé au Designer) - VERSION MISE À JOUR
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

### Exemple 2 : Enveloppe adresse retour seule

```wl
stContraintes est une stDesignerConstraints

// Uniquement zones texte
stContraintes.autorisations.textQuill   = Vrai
stContraintes.autorisations.image       = Faux
stContraintes.autorisations.qr          = Faux
stContraintes.autorisations.barcode     = Faux

// Une seule zone texte (la prédéfinie)
stContraintes.limites.textQuill         = 1
stContraintes.limites.image             = 0
stContraintes.limites.qr                = 0
stContraintes.limites.barcode           = 0

// Zone prédéfinie : Adresse retour
stZoneAdresse est une stDesignerZonePredefinie
stZoneAdresse.type                      = "textQuill"
stZoneAdresse.page                      = 0
stZoneAdresse.xMm                       = 10
stZoneAdresse.yMm                       = 10
stZoneAdresse.wMm                       = 80
stZoneAdresse.hMm                       = 25
stZoneAdresse.contrainte.positionFixe   = Vrai
stZoneAdresse.contrainte.nonSupprimable = Vrai
stZoneAdresse.contrainte.minWMm         = 50
stZoneAdresse.contrainte.maxWMm         = 100
stZoneAdresse.contrainte.minHMm         = 15
stZoneAdresse.contrainte.maxHMm         = 40
stContraintes.zonesPredefines.Ajoute(stZoneAdresse)
```

### Exemple 3 : Enveloppe adresse + logo

```wl
stContraintes est une stDesignerConstraints

// Texte et image uniquement
stContraintes.autorisations.textQuill   = Vrai
stContraintes.autorisations.image       = Vrai
stContraintes.autorisations.qr          = Faux
stContraintes.autorisations.barcode     = Faux

// Une zone de chaque
stContraintes.limites.textQuill         = 1
stContraintes.limites.image             = 1
stContraintes.limites.qr                = 0
stContraintes.limites.barcode           = 0

// Zone 1 : Adresse retour (haut gauche)
stZoneAdresse est une stDesignerZonePredefinie
stZoneAdresse.type                      = "textQuill"
stZoneAdresse.page                      = 0
stZoneAdresse.xMm                       = 10
stZoneAdresse.yMm                       = 10
stZoneAdresse.wMm                       = 80
stZoneAdresse.hMm                       = 25
stZoneAdresse.contrainte.positionFixe   = Vrai
stZoneAdresse.contrainte.nonSupprimable = Vrai
stZoneAdresse.contrainte.minWMm         = 50
stZoneAdresse.contrainte.maxWMm         = 100
stZoneAdresse.contrainte.minHMm         = 15
stZoneAdresse.contrainte.maxHMm         = 40
stContraintes.zonesPredefines.Ajoute(stZoneAdresse)

// Zone 2 : Logo (sous le texte, aligné à gauche)
stZoneLogo est une stDesignerZonePredefinie
stZoneLogo.type                         = "image"
stZoneLogo.page                         = 0
stZoneLogo.xMm                          = 10
stZoneLogo.yMm                          = 50    // 10 + 40 (maxHMm texte)
stZoneLogo.wMm                          = 50
stZoneLogo.hMm                          = 25
stZoneLogo.contrainte.positionFixe      = Vrai
stZoneLogo.contrainte.nonSupprimable    = Vrai
stZoneLogo.contrainte.minWMm            = 50    // Même que texte
stZoneLogo.contrainte.maxWMm            = 100   // Même que texte
stZoneLogo.contrainte.minHMm            = 15
stZoneLogo.contrainte.maxHMm            = 35
stContraintes.zonesPredefines.Ajoute(stZoneLogo)
```

### Code d'envoi complet

```wl
// Construire le message
stLoad est une stDesignerLoad
stLoad.action       = "load"
stLoad.data         = stDoc
stLoad.constraints  = stContraintes

// Sérialiser et envoyer
Sérialise(stLoad, gsJsonDocument, psdJSON)
EnvoyerMessageIframe(gsJsonDocument)
```

---

## Fonctions Designer exposées

| Fonction | Description | Usage |
|----------|-------------|-------|
| `countZonesByType()` | Compte les zones par type | Interne |
| `updateZoneButtonsVisibility()` | Met à jour visibilité boutons sidebar | Interne + WebDev |
| `updateContrainteBadge(zoneId)` | Affiche/masque le badge "Zone contrainte" | Interne |
| `applyContrainteBounds(contrainte, newW, newH)` | Applique les bornes min/max | Interne |
| `createPredefinedZones()` | Crée les zones prédéfinies | `window.createPredefinedZones()` |
| `applyConstraints(constraints)` | Applique les contraintes | `window.applyConstraints()` |

---

## Comportements UI

### Badge "Zone contrainte"

| Propriété | Valeur |
|-----------|--------|
| Texte | "Zone contrainte" |
| Couleur fond | `#FF9800` (orange Material) |
| Position | Gauche (ne chevauche pas le badge système à droite) |
| Visibilité | Affiché si `positionFixe` OU `nonSupprimable` |

### Bouton Supprimer

| Condition | État du bouton |
|-----------|----------------|
| Zone normale | Actif |
| Zone contrainte avec `nonSupprimable: true` | Grisé (disabled) |
| Zone système | Grisé (disabled) |

### Checkbox Verrouiller

| Zone | Position (X,Y) | Taille (L,H) |
|------|----------------|--------------|
| Contrainte + Verrouiller ☐ | Fixe (contrainte) | Modifiable (avec bornes) |
| Contrainte + Verrouiller ☑ | Fixe (contrainte) | Fixe (verrouillé) |

### Champs de saisie toolbar (X, Y, L, H)

| Champ | Zone normale | Zone contrainte |
|-------|--------------|-----------------|
| X | Modifiable | Bloqué si `positionFixe` |
| Y | Modifiable | Bloqué si `positionFixe` |
| L | Modifiable | Contraint aux bornes min/max |
| H | Modifiable | Contraint aux bornes min/max |

---

## Tests de validation

### Test rapide console

```javascript
// Appliquer des contraintes complètes
applyConstraints({
    autorisations: { textQuill: true, image: true, qr: false, barcode: false },
    limites: { textQuill: 2, image: 1 },
    zonesPredefines: [
        {
            type: 'textQuill',
            page: 0,
            xMm: 10, yMm: 10, wMm: 80, hMm: 25,
            contrainte: {
                positionFixe: true,
                nonSupprimable: true,
                minWMm: 50, maxWMm: 100,
                minHMm: 15, maxHMm: 40
            }
        },
        {
            type: 'image',
            page: 0,
            xMm: 10, yMm: 50, wMm: 50, hMm: 25,
            contrainte: {
                positionFixe: true,
                nonSupprimable: true,
                minWMm: 50, maxWMm: 100,
                minHMm: 15, maxHMm: 35
            }
        }
    ]
});
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
| 8 | Bouton Supprimer grisé si nonSupprimable | ☐ |
| 9 | Redimensionnement contraint aux bornes | ☐ |
| 10 | Input X/Y bloqué si positionFixe | ☐ |
| 11 | Input L/H contraint aux bornes | ☐ |
| 12 | Reset recrée les zones prédéfinies | ☐ |
| 13 | postMessage setConstraints fonctionne | ☐ |
| 14 | postMessage load avec constraints fonctionne | ☐ |

---

## Fichiers modifiés

### Designer (script.js)

| Section | Modifications |
|---------|---------------|
| @typedef | Ajout types constraints et contrainte |
| Section 2 | Constante DEFAULT_CONSTRAINTS |
| Section 3 | documentState.constraints |
| Section 6 | countZonesByType(), updateZoneButtonsVisibility() |
| Section 6 | updateContrainteBadge(), applyContrainteBounds() |
| Section 6 | createPredefinedZones(), applyConstraints() |
| Section 14 | Blocage drag si contrainte.positionFixe |
| Section 15 | Blocage resize bornes, applyGeometryChange() |
| Section 17 | resetCurrentPage(), resetAllPages() |
| Section 18 | handleParentMessage (case setConstraints, load) |
| Expositions | window.createPredefinedZones, window.applyConstraints |

### Designer (style.css)

| Élément | Modifications |
|---------|---------------|
| `.contrainte-badge` | Nouveau badge orange |
| Sélecteurs hover/selected | Inclusion du badge contrainte |

### WebDev (Structures)

| Structure | Description |
|-----------|-------------|
| `stDesignerConstraintsAutorisations` | Booléens autorisation par type |
| `stDesignerConstraintsLimites` | Entiers limite par type |
| `stDesignerZoneContrainte` | Contraintes d'une zone |
| `stDesignerZonePredefinie` | Définition zone prédéfinie |
| `stDesignerConstraints` | Structure globale |
| `stDesignerLoad` | Ajout champ constraints |

---

## Limitations et évolutions futures

### Limitations actuelles

1. **Types de zones prédéfinies** : Uniquement `textQuill` et `image` (pas QR ni barcode)
2. **Contraintes de position** : Fixe uniquement (pas de zone autorisée rectangulaire)
3. **Undo/Redo** : Les contraintes ne sont pas dans l'historique (viennent de WebDev)

### Évolutions possibles

1. **Zone autorisée** : Permettre le déplacement dans un rectangle défini
2. **Contraintes QR/Barcode** : Étendre aux autres types de zones
3. **Contenu par défaut** : Pré-remplir le contenu des zones prédéfinies
4. **Export contraintes** : Inclure les contraintes dans l'export JSON

---

## Auteur

Documentation créée dans le cadre du projet **Marketeam Designer** - Phase 10 : Contraintes de document.
