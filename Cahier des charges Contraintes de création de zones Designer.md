# Phase 10 : Contraintes de document et zones à liberté restreinte

## Date : 2 janvier 2026

---

## 1. Contexte et objectifs

### 1.1 Problématique

Le Designer Marketeam doit gérer différents types de documents avec des règles de personnalisation variées :

| Type de document | Zones autorisées | Contraintes |
|------------------|------------------|-------------|
| **Flyer classique** | Texte, Image, QR, Code-barres | Aucune limite |
| **Enveloppe Simple** | 1 seule zone Texte | Position contrainte, taille limitée |
| **Enveloppe Couleur** | 1 seule zone Image | Position contrainte, taille limitée |
| **Document secondaire** (ex: 2ème pièce d'un kit) | Selon le type | Pas de QR interactif |

### 1.2 Objectifs

1. **Paramétrer les autorisations** de création de zones au niveau du document
2. **Limiter le nombre** de zones par type (ex: 1 seule zone texte)
3. **Contraindre la position** de certaines zones (position fixe, seule la taille modifiable)
4. **Définir des bornes** de taille min/max selon le format d'enveloppe
5. **Masquer dynamiquement** les boutons de la sidebar selon les règles

---

## 2. Analyse du code existant

### 2.1 Mécanismes actuels

#### Zone `systeme`
- **Fichier** : `script.js`
- **Propriétés** : `zoneData.systeme` (boolean), `zoneData.systemeLibelle` (string)
- **Comportement** :
  - Non supprimable (bouton Supprimer grisé)
  - Non copiable
  - Toolbar de propriétés masquée
  - Éditeur Quill désactivé (`quillInstance.disable()`)
  - Badge affiché avec le libellé système
- **Lignes clés** : 4850-4886 (updateSystemeBadge), 7293, 8024, 10119, 10541

#### Zone `locked`
- **Propriété** : `zoneData.locked` (boolean)
- **Comportement** :
  - Position et taille non modifiables via les inputs
  - Poignées de redimensionnement masquées
  - Ignorée lors des alignements groupés
- **Lignes clés** : 10798-10805 (inputs disabled), 7995-8005 (handles)

### 2.2 Structure documentState actuelle

```javascript
// Lignes 5459-5487 de script.js
let documentState = {
    currentPageIndex: 0,
    pages: [
        {
            id: 'page-1',
            name: 'Recto',
            image: 'a4_template_recto.jpg',
            format: 'A4',
            width: 794,
            height: 1123,
            zones: {}
        },
        {
            id: 'page-2',
            name: 'Verso',
            // ...
        }
    ],
    zoneCounter: 0,
    donneesApercu: []
};
```

### 2.3 Boutons sidebar concernés

| Bouton | ID | Variable JS | Ligne déclaration |
|--------|----|--------------|--------------------|
| QR Code interactif | `btn-add-qr` | `btnAddQr` | 619 |
| Image | `btn-add-image` | `btnAddImage` | 620 |
| Zone Texte | `btn-add-zone-quill` | `btnAddTextQuill` | 618 |
| Code-barres | `btn-add-barcode` | `btnAddBarcode` | (à vérifier) |

### 2.4 Fonction existante pour QR interactif

La fonction `updateQrInteractifButtonVisibility()` (ligne ~6846) gère déjà la visibilité du bouton QR :

```javascript
function updateQrInteractifButtonVisibility() {
    if (!btnAddQr) return;
    
    const hasQrMarketeam = documentState.pages.some(page => {
        return Object.values(page.zones).some(zoneData => {
            if (zoneData.type !== 'qr') return false;
            return !zoneData.qrConfig || !zoneData.qrConfig.type;
        });
    });
    
    btnAddQr.style.display = hasQrMarketeam ? 'none' : '';
}
```

---

## 3. Architecture proposée

### 3.1 Nouvelle structure `documentState.constraints`

Ajouter un objet `constraints` au niveau de `documentState` :

```javascript
documentState.constraints = {
    // ═══ AUTORISATIONS DE CRÉATION ═══
    // Définit si un type de zone peut être créé (true/false)
    autorisations: {
        textQuill: true,      // Zones texte Quill
        image: true,          // Zones image
        qr: true,             // QR Code interactif (Marketeam)
        barcode: true         // Codes-barres classiques
    },
    
    // ═══ LIMITES DE NOMBRE ═══
    // Nombre maximum de zones par type (null = illimité)
    // Compte sur TOUT le document (toutes pages confondues)
    limites: {
        textQuill: null,      // Illimité par défaut
        image: null,          // Illimité par défaut
        qr: 1,                // Max 1 QR interactif (déjà implémenté)
        barcode: null         // Illimité par défaut
    },
    
    // ═══ ZONES PRÉDÉFINIES (optionnel) ═══
    // Zones à créer automatiquement au chargement avec contraintes
    zonesPredefines: []
};
```

### 3.2 Nouveau concept : Zone `contrainte`

Différent de `systeme` (zone totalement figée), une zone `contrainte` a des libertés partielles :

```javascript
zoneData = {
    type: 'textQuill',
    
    // ═══ NOUVELLE PROPRIÉTÉ ═══
    contrainte: {
        // Position
        positionFixe: true,           // true = non déplaçable, false = déplaçable
        
        // Taille
        tailleModifiable: true,       // true = redimensionnable, false = taille fixe
        
        // Bornes de taille (en mm) - optionnel
        minW: 50,                     // Largeur minimale en mm
        maxW: 150,                    // Largeur maximale en mm
        minH: 20,                     // Hauteur minimale en mm
        maxH: 80,                     // Hauteur maximale en mm
        
        // Zone de placement autorisée (en mm depuis coin haut-gauche) - optionnel
        // Utilisé si positionFixe = false pour limiter le déplacement
        zoneAutorisee: {
            x: 10,                    // Position X minimale
            y: 10,                    // Position Y minimale
            w: 100,                   // Largeur de la zone autorisée
            h: 50                     // Hauteur de la zone autorisée
        }
    },
    
    // Autres propriétés existantes...
    x: 100,
    y: 200,
    w: 120,
    h: 40,
    // ...
};
```

### 3.3 Hiérarchie des contraintes

```
┌─────────────────────────────────────────────────────────┐
│ Zone normale                                            │
│ - Déplaçable, redimensionnable, supprimable             │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Zone contrainte (nouveau)                               │
│ - Position fixe OU limitée à une zone                   │
│ - Taille modifiable avec bornes min/max                 │
│ - Supprimable (sauf si unique et obligatoire)           │
│ - Propriétés éditables                                  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Zone locked (verrouillée)                               │
│ - Position et taille fixes                              │
│ - Supprimable                                           │
│ - Propriétés éditables                                  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Zone système                                            │
│ - Totalement figée                                      │
│ - Non supprimable, non copiable                         │
│ - Propriétés non éditables                              │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Implémentation détaillée

### 4.1 Étape 1 : Structure constraints dans documentState

**Fichier** : `script.js`
**Localisation** : Après la déclaration de `documentState` (ligne ~5487)

```javascript
// Valeurs par défaut des contraintes (tout autorisé, pas de limites)
const DEFAULT_CONSTRAINTS = {
    autorisations: {
        textQuill: true,
        image: true,
        qr: true,
        barcode: true
    },
    limites: {
        textQuill: null,
        image: null,
        qr: 1,        // Déjà implémenté
        barcode: null
    },
    zonesPredefines: []
};

// Initialiser les contraintes dans documentState
documentState.constraints = { ...DEFAULT_CONSTRAINTS };
```

### 4.2 Étape 2 : Fonction de comptage des zones

**Nouvelle fonction** à ajouter :

```javascript
/**
 * Compte le nombre de zones par type sur tout le document.
 * Parcourt toutes les pages pour un décompte global.
 * 
 * @returns {Object} Comptage par type {textQuill: n, image: n, qr: n, barcode: n}
 */
function countZonesByType() {
    const counts = {
        textQuill: 0,
        image: 0,
        qr: 0,           // QR Marketeam uniquement (sans qrConfig)
        qrIntelligent: 0, // QR avec qrConfig
        barcode: 0
    };
    
    documentState.pages.forEach(page => {
        Object.values(page.zones).forEach(zoneData => {
            switch (zoneData.type) {
                case 'textQuill':
                    counts.textQuill++;
                    break;
                case 'image':
                    counts.image++;
                    break;
                case 'qr':
                    // Distinguer QR Marketeam vs QR intelligent
                    if (!zoneData.qrConfig || !zoneData.qrConfig.type) {
                        counts.qr++;
                    } else {
                        counts.qrIntelligent++;
                    }
                    break;
                case 'barcode':
                    counts.barcode++;
                    break;
            }
        });
    });
    
    return counts;
}
```

### 4.3 Étape 3 : Fonction générique de visibilité des boutons

**Remplacer/étendre** `updateQrInteractifButtonVisibility()` par une fonction plus générale :

```javascript
/**
 * Met à jour la visibilité de tous les boutons de création de zones.
 * Prend en compte les autorisations et les limites définies dans constraints.
 * 
 * @returns {void}
 */
function updateZoneButtonsVisibility() {
    const constraints = documentState.constraints || DEFAULT_CONSTRAINTS;
    const autorisations = constraints.autorisations || {};
    const limites = constraints.limites || {};
    const counts = countZonesByType();
    
    // ═══ BOUTON QR CODE INTERACTIF ═══
    if (btnAddQr) {
        const qrAutorise = autorisations.qr !== false;
        const qrLimiteAtteinte = limites.qr !== null && counts.qr >= limites.qr;
        btnAddQr.style.display = (!qrAutorise || qrLimiteAtteinte) ? 'none' : '';
    }
    
    // ═══ BOUTON IMAGE ═══
    if (btnAddImage) {
        const imageAutorise = autorisations.image !== false;
        const imageLimiteAtteinte = limites.image !== null && counts.image >= limites.image;
        btnAddImage.style.display = (!imageAutorise || imageLimiteAtteinte) ? 'none' : '';
    }
    
    // ═══ BOUTON TEXTE QUILL ═══
    if (btnAddTextQuill) {
        const textAutorise = autorisations.textQuill !== false;
        const textLimiteAtteinte = limites.textQuill !== null && counts.textQuill >= limites.textQuill;
        btnAddTextQuill.style.display = (!textAutorise || textLimiteAtteinte) ? 'none' : '';
    }
    
    // ═══ BOUTON CODE-BARRES ═══
    if (btnAddBarcode) {
        const barcodeAutorise = autorisations.barcode !== false;
        const barcodeLimiteAtteinte = limites.barcode !== null && counts.barcode >= limites.barcode;
        btnAddBarcode.style.display = (!barcodeAutorise || barcodeLimiteAtteinte) ? 'none' : '';
    }
}
```

### 4.4 Étape 4 : Points d'appel de la fonction

Appeler `updateZoneButtonsVisibility()` aux endroits suivants :

| Événement | Fonction/Localisation |
|-----------|----------------------|
| Création de zone | Après `createZoneDOM()` dans chaque listener de bouton |
| Suppression de zone | Dans `confirmDeletion()` après suppression |
| Changement de page | Dans `switchPage()` après chargement |
| Chargement initial | Dans `loadCurrentPage()` à la fin |
| Reset de page | Dans `resetCurrentPage()` et `resetAllPages()` |
| Import JSON | Après chargement des données |
| Réception message WebDev | Après application des contraintes |

### 4.5 Étape 5 : Gestion des zones contraintes (position fixe)

**Modifier le comportement de déplacement** :

```javascript
/**
 * Vérifie si une zone peut être déplacée.
 * 
 * @param {string} zoneId - ID de la zone
 * @returns {boolean} true si déplaçable
 */
function isZoneMovable(zoneId) {
    const zonesData = getCurrentPageZones();
    const zoneData = zonesData[zoneId];
    
    if (!zoneData) return false;
    if (zoneData.systeme) return false;
    if (zoneData.locked) return false;
    if (zoneData.contrainte && zoneData.contrainte.positionFixe) return false;
    
    return true;
}

/**
 * Vérifie si une zone peut être redimensionnée.
 * 
 * @param {string} zoneId - ID de la zone
 * @returns {boolean} true si redimensionnable
 */
function isZoneResizable(zoneId) {
    const zonesData = getCurrentPageZones();
    const zoneData = zonesData[zoneId];
    
    if (!zoneData) return false;
    if (zoneData.systeme) return false;
    if (zoneData.locked) return false;
    if (zoneData.contrainte && zoneData.contrainte.tailleModifiable === false) return false;
    
    return true;
}
```

### 4.6 Étape 6 : Validation des bornes de taille

**Lors du redimensionnement** :

```javascript
/**
 * Applique les contraintes de taille à une zone.
 * 
 * @param {string} zoneId - ID de la zone
 * @param {number} newW - Nouvelle largeur en pixels
 * @param {number} newH - Nouvelle hauteur en pixels
 * @returns {{w: number, h: number}} Dimensions contraintes
 */
function applyResizeConstraints(zoneId, newW, newH) {
    const zonesData = getCurrentPageZones();
    const zoneData = zonesData[zoneId];
    
    if (!zoneData || !zoneData.contrainte) {
        return { w: newW, h: newH };
    }
    
    const c = zoneData.contrainte;
    let w = newW;
    let h = newH;
    
    // Convertir les bornes mm en pixels si définies
    if (c.minW !== undefined) {
        const minWPx = mmToPixels(c.minW);
        w = Math.max(w, minWPx);
    }
    if (c.maxW !== undefined) {
        const maxWPx = mmToPixels(c.maxW);
        w = Math.min(w, maxWPx);
    }
    if (c.minH !== undefined) {
        const minHPx = mmToPixels(c.minH);
        h = Math.max(h, minHPx);
    }
    if (c.maxH !== undefined) {
        const maxHPx = mmToPixels(c.maxH);
        h = Math.min(h, maxHPx);
    }
    
    return { w, h };
}
```

---

## 5. Exemples de configuration

### 5.1 Flyer classique (tout autorisé)

```javascript
documentState.constraints = {
    autorisations: { textQuill: true, image: true, qr: true, barcode: true },
    limites: { textQuill: null, image: null, qr: 1, barcode: null },
    zonesPredefines: []
};
```

### 5.2 Enveloppe Simple (1 zone texte uniquement)

```javascript
documentState.constraints = {
    autorisations: { 
        textQuill: true, 
        image: false,    // Pas d'image
        qr: false,       // Pas de QR
        barcode: false   // Pas de code-barres
    },
    limites: { 
        textQuill: 1     // Maximum 1 zone texte
    },
    zonesPredefines: [{
        type: 'textQuill',
        // Position initiale (sera créée au chargement)
        x: 75,   // en pixels (ou mm selon implémentation)
        y: 567,
        w: 300,
        h: 100,
        contrainte: {
            positionFixe: true,       // Non déplaçable
            tailleModifiable: true,   // Taille modifiable
            minW: 50,                 // Largeur min 50mm
            maxW: 170,                // Largeur max 170mm
            minH: 20,                 // Hauteur min 20mm
            maxH: 60                  // Hauteur max 60mm
        }
    }]
};
```

### 5.3 Enveloppe Couleur (1 zone image uniquement)

```javascript
documentState.constraints = {
    autorisations: { 
        textQuill: false,  // Pas de texte
        image: true, 
        qr: false, 
        barcode: false 
    },
    limites: { 
        image: 1           // Maximum 1 zone image
    },
    zonesPredefines: [{
        type: 'image',
        x: 20,
        y: 20,
        w: 200,
        h: 150,
        contrainte: {
            positionFixe: true,
            tailleModifiable: true,
            minW: 30,
            maxW: 100,
            minH: 30,
            maxH: 80
        }
    }]
};
```

### 5.4 Document secondaire (pas de QR interactif)

```javascript
documentState.constraints = {
    autorisations: { 
        textQuill: true, 
        image: true, 
        qr: false,         // QR interactif interdit
        barcode: true 
    },
    limites: { 
        // Pas de limites particulières
    },
    zonesPredefines: []
};
```

---

## 6. Intégration WebDev

### 6.1 Message de configuration

WebDev enverra les contraintes via le message d'initialisation :

```javascript
// Message envoyé par WebDev au Designer
{
    action: 'INIT_DOCUMENT',
    payload: {
        format: 'enveloppe-c5',
        pages: [...],
        constraints: {
            autorisations: { textQuill: true, image: false, qr: false, barcode: false },
            limites: { textQuill: 1 },
            zonesPredefines: [...]
        }
    }
}
```

### 6.2 Traitement côté Designer

```javascript
// Dans le handler de messages WebDev
case 'INIT_DOCUMENT':
    // Appliquer les contraintes
    if (payload.constraints) {
        documentState.constraints = {
            ...DEFAULT_CONSTRAINTS,
            ...payload.constraints
        };
    }
    
    // Créer les zones prédéfinies si définies
    if (documentState.constraints.zonesPredefines) {
        createPredefinedZones(documentState.constraints.zonesPredefines);
    }
    
    // Mettre à jour la visibilité des boutons
    updateZoneButtonsVisibility();
    break;
```

---

## 7. Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `script.js` | Structure constraints, fonctions de comptage, visibilité boutons, contraintes zones |
| `index.html` | Aucune modification nécessaire |
| `style.css` | Éventuellement : style pour badge "zone contrainte" |

---

## 8. Tests à prévoir

### 8.1 Tests autorisations

- [ ] Désactiver `qr: false` → bouton QR invisible
- [ ] Désactiver `image: false` → bouton Image invisible
- [ ] Désactiver `textQuill: false` → bouton Texte invisible
- [ ] Combinaisons multiples

### 8.2 Tests limites

- [ ] `limites.textQuill: 1` → bouton disparaît après 1 création
- [ ] Supprimer la zone → bouton réapparaît
- [ ] Limite sur plusieurs pages (document entier)

### 8.3 Tests contraintes de zone

- [ ] Zone avec `positionFixe: true` → non déplaçable
- [ ] Zone avec bornes de taille → respectées au redimensionnement
- [ ] Zone contrainte mais supprimable

### 8.4 Tests intégration

- [ ] Réception message WebDev avec constraints
- [ ] Persistance dans localStorage
- [ ] Export/Import JSON avec constraints

---

## 9. Prochaines étapes (ordre suggéré)

1. **Créer la structure `DEFAULT_CONSTRAINTS`** et l'initialiser dans `documentState`
2. **Implémenter `countZonesByType()`**
3. **Refactorer `updateQrInteractifButtonVisibility()`** en `updateZoneButtonsVisibility()`
4. **Ajouter les points d'appel** de la nouvelle fonction
5. **Implémenter le concept `contrainte`** sur les zones
6. **Gérer les bornes de taille** lors du redimensionnement
7. **Intégrer la réception des constraints** depuis WebDev
8. **Tests complets**

---

## 10. Questions ouvertes

1. **Format des zones prédéfinies** : Coordonnées en pixels ou en mm ?
2. **Badge visuel** : Faut-il un badge distinct pour les zones "contraintes" ?
3. **Message d'erreur** : Que faire si l'utilisateur tente une action interdite ?
4. **Undo/Redo** : Les contraintes doivent-elles être historisées ?

---

## 11. Modifications déjà effectuées (2 janvier 2026)

### 11.1 QR Code interactif - Badges

- **Badge type** : Affiche "QR Code interactif" au lieu de "Code QR"
- **Badge champ** : Affiche "Landing page" (bleu) au lieu de "(Aucun champ)" (rouge)
- **Fonction modifiée** : `updateQrZoneDisplay()` (lignes 12258-12295)

### 11.2 QR Code interactif - Bouton sidebar

- **Libellé** : Renommé "QR Code interactif"
- **Tooltip** : Renommé "QR Code interactif"
- **Fichier** : `index.html` (lignes 138-145)

### 11.3 QR Code interactif - Unicité document

- **Règle** : Un seul QR Code interactif autorisé par document (toutes pages)
- **Fonction créée** : `updateQrInteractifButtonVisibility()` (ligne ~6846)
- **Vérification** : Parcourt toutes les pages (`documentState.pages`)
- **Points d'appel** : 
  - Création QR (`btnAddQr.addEventListener`)
  - Suppression (`confirmDeletion()`)
  - Changement de page (`switchPage()`)
  - Chargement (`loadCurrentPage()`)
  - Reset (`resetCurrentPage()`, `resetAllPages()`)

---

*Document rédigé le 2 janvier 2026*
*À reprendre : Implémentation Phase 10 - Contraintes génériques*


