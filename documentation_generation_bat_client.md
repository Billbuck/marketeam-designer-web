# Documentation : Génération de BAT côté client (html2canvas)

## Vue d'ensemble

Cette documentation décrit une méthode alternative pour générer des BAT (Bons À Tirer) directement depuis le Designer, sans passer par l'API PSM PHP et PrintShop Mail.

**Date de validation POC** : 14 janvier 2026  
**Statut** : ✅ POC validé, prêt pour intégration

### Comparaison des approches

| Critère | API PSM (existante) | html2canvas (nouvelle) |
|---------|---------------------|------------------------|
| Dépendances serveur | Apache + PHP + PrintShop Mail | Aucune |
| Temps de génération | ~150ms + latence réseau | ~500ms (côté client) |
| Données fusionnées | ✅ Depuis data.csv | ✅ Depuis aperçu Designer |
| Qualité impression | ✅ Optimale (CMYK possible) | ⚠️ RGB uniquement |
| Résolution | Configurable (dpi) | Scale factor (×1 à ×6) |
| Usage recommandé | BAT définitif / Production | Aperçu rapide / Validation |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  GÉNÉRATION BAT CÔTÉ CLIENT                                     │
│                                                                 │
│  Designer (navigateur)                                          │
│       │                                                         │
│       │ 1. Préparation DOM                                      │
│       │    - Masquer sélection/badges                           │
│       │    - Convertir images en base64                         │
│       │    - Simuler object-fit: contain                        │
│       │                                                         │
│       ▼                                                         │
│  html2canvas                                                    │
│       │                                                         │
│       │ 2. Capture #a4-page                                     │
│       │    - Scale factor ×3                                    │
│       │    - Fond blanc                                         │
│       │                                                         │
│       ▼                                                         │
│  Canvas → JPEG                                                  │
│       │                                                         │
│       │ 3. Export                                               │
│       │    - Téléchargement direct                              │
│       │    - Ou envoi vers WebDev (postMessage)                 │
│       │                                                         │
│       ▼                                                         │
│  BAT_page1.jpg (~70-150 Ko pour un A4)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prérequis

### Librairie html2canvas

```html
<!-- CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```

Ou chargement dynamique :

```javascript
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
script.onload = () => console.log('html2canvas chargé');
document.head.appendChild(script);
```

### Contexte d'exécution

| Contexte | Compatibilité |
|----------|---------------|
| `http://localhost/...` | ✅ Fonctionne |
| `file:///...` | ⚠️ Problèmes CORS avec les images |
| iframe WebDev | ✅ Fonctionne |

---

## Problèmes rencontrés et solutions

### Problème 1 : Canvas "tainted" (CORS)

**Symptôme** : `SecurityError: Tainted canvases may not be exported`

**Cause** : Images chargées depuis une origine différente ou depuis `file:///`

**Solution** : Convertir les images en base64 avant la capture

```javascript
const images = a4Page.querySelectorAll('img');
for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth || img.width;
        tempCanvas.height = img.naturalHeight || img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        img.src = tempCanvas.toDataURL('image/png');
    }
}
```

---

### Problème 2 : object-fit: contain non supporté

**Symptôme** : Les images avec `object-fit: contain` sont étirées/déformées

**Cause** : html2canvas ne supporte pas correctement `object-fit`

**Solution** : Calculer manuellement les dimensions et positions

```javascript
imageZones.forEach(zone => {
    const img = zone.querySelector('img');
    const imgStyle = getComputedStyle(img);
    if (imgStyle.objectFit !== 'contain') return;
    
    const zoneW = zone.offsetWidth;
    const zoneH = zone.offsetHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const zoneRatio = zoneW / zoneH;
    
    let finalW, finalH, offsetX, offsetY;
    
    if (imgRatio > zoneRatio) {
        // Image plus large → contrainte par la largeur
        finalW = zoneW;
        finalH = zoneW / imgRatio;
        offsetX = 0;
        offsetY = (zoneH - finalH) / 2;
    } else {
        // Image plus haute → contrainte par la hauteur
        finalH = zoneH;
        finalW = zoneH * imgRatio;
        offsetX = (zoneW - finalW) / 2;
        offsetY = 0;
    }
    
    // Appliquer le positionnement manuel
    img.style.objectFit = 'none';
    img.style.width = finalW + 'px';
    img.style.height = finalH + 'px';
    img.style.position = 'absolute';
    img.style.left = offsetX + 'px';
    img.style.top = offsetY + 'px';
});
```

---

### Problème 3 : Éléments de sélection visibles

**Symptôme** : Bordures de sélection, poignées et badges apparaissent sur le BAT

**Solution** : Masquer temporairement avant la capture

```javascript
// Retirer la classe selected
const selectedZones = a4Page.querySelectorAll('.zone.selected');
selectedZones.forEach(zone => zone.classList.remove('selected'));

// Masquer les poignées
const handles = a4Page.querySelectorAll('.handle, .resize-handle, .rotation-handle');
handles.forEach(h => h.style.display = 'none');

// Masquer les badges
const badges = a4Page.querySelectorAll('.barcode-type-badge, .barcode-field-badge, .zone-badge');
badges.forEach(b => b.style.display = 'none');
```

---

## Script complet validé

```javascript
/**
 * Génère un BAT (Bon À Tirer) de la page courante du Designer.
 * Utilise html2canvas pour capturer le contenu de #a4-page.
 * 
 * @param {Object} options - Options de génération
 * @param {number} [options.scaleFactor=3] - Facteur de scale (1-6)
 * @param {number} [options.quality=0.92] - Qualité JPEG (0.0-1.0)
 * @param {string} [options.filename='BAT_page1.jpg'] - Nom du fichier
 * @param {boolean} [options.download=true] - Télécharger automatiquement
 * @returns {Promise<string|null>} dataURL du BAT ou null en cas d'erreur
 */
async function generateBAT(options = {}) {
    const SCALE_FACTOR = options.scaleFactor || 3;
    const QUALITY = options.quality || 0.92;
    const FILENAME = options.filename || 'BAT_page1.jpg';
    const AUTO_DOWNLOAD = options.download !== false;
    
    const a4Page = document.getElementById('a4-page');
    
    if (!a4Page) {
        console.error('❌ Élément #a4-page non trouvé');
        return null;
    }
    
    console.log('🔄 Préparation...');
    
    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 1 : Masquer les éléments de sélection
    // ═══════════════════════════════════════════════════════════════
    
    const selectedZones = a4Page.querySelectorAll('.zone.selected');
    selectedZones.forEach(zone => zone.classList.remove('selected'));
    
    const handles = a4Page.querySelectorAll('.handle, .resize-handle, .rotation-handle');
    handles.forEach(h => h.style.display = 'none');
    
    const badges = a4Page.querySelectorAll('.barcode-type-badge, .barcode-field-badge, .zone-badge');
    const badgesOriginalDisplay = new Map();
    badges.forEach(b => {
        badgesOriginalDisplay.set(b, b.style.display);
        b.style.display = 'none';
    });
    
    console.log('  ✅ Sélection masquée');
    
    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 2 : Convertir les images en base64 (éviter CORS)
    // ═══════════════════════════════════════════════════════════════
    
    const images = a4Page.querySelectorAll('img');
    const originalSrcs = new Map();
    
    for (const img of images) {
        if (img.src && !img.src.startsWith('data:')) {
            originalSrcs.set(img, img.src);
            try {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.naturalWidth || img.width;
                tempCanvas.height = img.naturalHeight || img.height;
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                img.src = tempCanvas.toDataURL('image/png');
                console.log('  ✅ Image convertie:', img.id || img.className || 'sans id');
            } catch (e) {
                console.warn('  ⚠️ Image non convertible:', img.src.substring(0, 50));
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 3 : Corriger object-fit: contain
    // ═══════════════════════════════════════════════════════════════
    
    console.log('🔧 Correction object-fit...');
    const imageZones = a4Page.querySelectorAll('.zone[data-type="image"]');
    const originalStyles = new Map();
    
    imageZones.forEach(zone => {
        const img = zone.querySelector('img');
        if (!img) return;
        
        const imgStyle = getComputedStyle(img);
        if (imgStyle.objectFit !== 'contain') return;
        
        // Sauvegarder les styles originaux
        originalStyles.set(img, {
            width: img.style.width,
            height: img.style.height,
            position: img.style.position,
            left: img.style.left,
            top: img.style.top,
            objectFit: img.style.objectFit
        });
        
        // Calculer les dimensions pour simuler object-fit: contain
        const zoneW = zone.offsetWidth;
        const zoneH = zone.offsetHeight;
        const imgNatW = img.naturalWidth;
        const imgNatH = img.naturalHeight;
        
        const zoneRatio = zoneW / zoneH;
        const imgRatio = imgNatW / imgNatH;
        
        let finalW, finalH, offsetX, offsetY;
        
        if (imgRatio > zoneRatio) {
            finalW = zoneW;
            finalH = zoneW / imgRatio;
            offsetX = 0;
            offsetY = (zoneH - finalH) / 2;
        } else {
            finalH = zoneH;
            finalW = zoneH * imgRatio;
            offsetX = (zoneW - finalW) / 2;
            offsetY = 0;
        }
        
        // Appliquer le positionnement manuel
        img.style.objectFit = 'none';
        img.style.width = finalW + 'px';
        img.style.height = finalH + 'px';
        img.style.position = 'absolute';
        img.style.left = offsetX + 'px';
        img.style.top = offsetY + 'px';
        
        console.log(`  ✅ ${zone.id}: ${Math.round(finalW)}×${Math.round(finalH)}`);
    });
    
    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 4 : Capture avec html2canvas
    // ═══════════════════════════════════════════════════════════════
    
    console.log('📸 Capture en cours...');
    
    let dataUrl = null;
    
    try {
        const canvas = await html2canvas(a4Page, {
            scale: SCALE_FACTOR,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false
        });
        
        dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        
        console.log('=== BAT GÉNÉRÉ ===');
        console.log('Dimensions originales:', a4Page.offsetWidth, '×', a4Page.offsetHeight, 'px');
        console.log('Dimensions BAT:', canvas.width, '×', canvas.height, 'px');
        console.log('Scale factor:', SCALE_FACTOR);
        console.log('Taille:', Math.round(dataUrl.length * 0.75 / 1024), 'Ko');
        
        // Télécharger si demandé
        if (AUTO_DOWNLOAD) {
            const link = document.createElement('a');
            link.download = FILENAME;
            link.href = dataUrl;
            link.click();
            console.log('✅ Fichier téléchargé :', FILENAME);
        }
        
    } catch (error) {
        console.error('❌ Erreur capture:', error);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ÉTAPE 5 : Restauration de l'état original
    // ═══════════════════════════════════════════════════════════════
    
    // Restaurer la sélection
    selectedZones.forEach(zone => zone.classList.add('selected'));
    handles.forEach(h => h.style.display = '');
    badges.forEach(b => b.style.display = badgesOriginalDisplay.get(b) || '');
    console.log('🔄 Sélection restaurée');
    
    // Restaurer les styles object-fit
    for (const [img, styles] of originalStyles) {
        img.style.width = styles.width;
        img.style.height = styles.height;
        img.style.position = styles.position;
        img.style.left = styles.left;
        img.style.top = styles.top;
        img.style.objectFit = styles.objectFit;
    }
    
    // Restaurer les sources originales
    for (const [img, src] of originalSrcs) {
        img.src = src;
    }
    console.log('🔄 Images restaurées');
    
    return dataUrl;
}
```

---

## Utilisation

### Génération simple avec téléchargement

```javascript
// Télécharge BAT_page1.jpg
generateBAT();
```

### Génération avec options

```javascript
// Options personnalisées
generateBAT({
    scaleFactor: 4,        // Résolution ×4
    quality: 0.95,         // Qualité 95%
    filename: 'Apercu_Recto.jpg',
    download: true
});
```

### Génération sans téléchargement (pour envoi à WebDev)

```javascript
// Récupérer le dataURL pour l'envoyer via postMessage
const dataUrl = await generateBAT({ download: false });

if (dataUrl) {
    window.parent.postMessage({
        action: 'batGenerated',
        data: {
            page: 1,
            image: dataUrl,
            timestamp: Date.now()
        }
    }, '*');
}
```

---

## Génération multi-pages

Pour générer un BAT de chaque page du document :

```javascript
/**
 * Génère les BAT de toutes les pages du document.
 * 
 * @param {Object} options - Options de génération
 * @returns {Promise<string[]>} Tableau des dataURLs
 */
async function generateAllBATs(options = {}) {
    const pageCount = documentState.pages.length;
    const results = [];
    
    for (let i = 0; i < pageCount; i++) {
        // Changer de page
        switchToPage(i);
        
        // Attendre le rendu
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Générer le BAT
        const filename = `BAT_page${i + 1}.jpg`;
        const dataUrl = await generateBAT({
            ...options,
            filename: filename,
            download: options.download !== false
        });
        
        results.push(dataUrl);
    }
    
    return results;
}
```

---

## Intégration dans le Designer

### Option A : Bouton dans la sidebar

```html
<!-- Dans la section appropriée de la sidebar -->
<button class="btn" id="btn-generate-bat" data-tooltip="Générer BAT">
    <span class="btn-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
    </span>
    <span class="btn-label">Générer BAT</span>
</button>
```

```javascript
// Event listener
const btnGenerateBat = document.getElementById('btn-generate-bat');
btnGenerateBat.addEventListener('click', async () => {
    btnGenerateBat.disabled = true;
    btnGenerateBat.querySelector('.btn-label').textContent = 'Génération...';
    
    await generateBAT();
    
    btnGenerateBat.disabled = false;
    btnGenerateBat.querySelector('.btn-label').textContent = 'Générer BAT';
});
```

### Option B : Dans le flux de validation

```javascript
// Lors de la validation du document
async function validateDocument() {
    // ... validation existante ...
    
    // Générer les BAT de toutes les pages
    const bats = await generateAllBATs({ download: false });
    
    // Envoyer à WebDev
    window.parent.postMessage({
        action: 'documentValidated',
        data: {
            json: exportToJsonWebDev(),
            bats: bats,  // Tableau des dataURLs
            timestamp: Date.now()
        }
    }, '*');
}
```

---

## Limitations connues

| Limitation | Impact | Contournement possible |
|------------|--------|------------------------|
| RGB uniquement | Couleurs CMYK non supportées | Conversion serveur si nécessaire |
| Polices web | Polices non chargées = fallback | S'assurer que les polices sont chargées |
| SVG complexes | Rendu parfois imparfait | Convertir en PNG côté serveur |
| Très grandes pages | Mémoire limitée du navigateur | Réduire le scale factor |
| `object-fit: cover` | Non testé | À implémenter si nécessaire |

---

## Performances

| Format document | Dimensions BAT (×3) | Taille fichier | Temps génération |
|-----------------|---------------------|----------------|------------------|
| A4 Portrait | 2382 × 3369 px | ~100-200 Ko | ~500ms |
| A4 Paysage | 3369 × 2382 px | ~100-200 Ko | ~500ms |
| A5 | 1785 × 2526 px | ~70-150 Ko | ~400ms |
| DL (100×210) | ~1134 × 2382 px | ~50-100 Ko | ~350ms |

---

## Checklist d'intégration

- [ ] Ajouter html2canvas au projet (CDN ou local)
- [ ] Intégrer la fonction `generateBAT()` dans script.js (Section appropriée)
- [ ] Ajouter la référence DOM du bouton en Section 1
- [ ] Créer l'event listener pour le bouton
- [ ] Tester avec différents types de contenu (texte, images, codes-barres)
- [ ] Tester en mode aperçu (données fusionnées)
- [ ] Tester multi-pages si applicable
- [ ] Intégrer l'envoi vers WebDev si nécessaire

---

## Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-01-14 | POC validé - Script complet avec corrections object-fit et sélection |

---

## Auteur

Documentation créée dans le cadre du projet **Marketeam Designer** - Alternative à l'API PSM pour génération de BAT.
