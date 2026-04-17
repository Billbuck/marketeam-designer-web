# Cahier des Charges — Gestion des Fonds Perdus dans le Designer

**Version** : 1.1  
**Date** : 26 février 2026  
**Projet** : Marketeam Designer  
**Statut** : En cours d'élaboration

---

## 1. Vue d'ensemble

### 1.1 Objectif

Implémenter l'affichage visuel et la gestion géométrique des fonds perdus dans le Designer. Le fond perdu est la bande supplémentaire autour du document fini qui sera coupée après impression (offset ou laser).

### 1.2 Principe fondamental

> **Le Designer sert uniquement à la personnalisation.** L'utilisateur ne peut **jamais** placer de zones dans la bande de fond perdu. La bande est affichée de manière visuelle uniquement, pour montrer la zone qui sera coupée.

### 1.3 Structure fond perdu — 4 côtés indépendants

Les fonds perdus peuvent être asymétriques (ex: un PDF avec 3mm en haut/bas mais 5mm à gauche/droite). La structure utilise 4 valeurs indépendantes, cohérente avec les données extraites par l'API PyMuPdfExtract (bleedBox - trimBox par côté) :

```
stDesignerFondPerdu
├─ actif       : booléen     // Fond perdu activé
├─ hautMm      : réel        // Fond perdu en haut en mm
├─ basMm       : réel        // Fond perdu en bas en mm
├─ gaucheMm    : réel        // Fond perdu à gauche en mm
└─ droiteMm    : réel        // Fond perdu à droite en mm
```

**Structure WLangage mise à jour** :
```
stDesignerFondPerdu est une Structure
    'actif'     est un booléen  <sérialise = "actif">
    'hautMm'    est un réel     <sérialise = "hautMm">
    'basMm'     est un réel     <sérialise = "basMm">
    'gaucheMm'  est un réel     <sérialise = "gaucheMm">
    'droiteMm'  est un réel     <sérialise = "droiteMm">
fin
```

### 1.4 Deux cas d'impression

| Cas | Fond perdu | Blanc tournant | Traitement |
|-----|-----------|----------------|------------|
| **Document avec fond perdu** (offset ou laser) | Oui (ex: 3mm) | Non | Image de fond = format fini + fond perdu. Designer affiche la bande avec overlay. |
| **Document sans fond perdu** (laser) | Non | Oui (marge mécanique ~5mm) | Image de fond = format fini - blanc tournant. **Traité séparément** (hors périmètre de ce CDC). |

---

## 2. État actuel (avant implémentation)

| Aspect | État |
|--------|------|
| Structure de données (`stDesignerFondPerdu`) | ⚠️ À modifier (passer de 1 valeur à 4 côtés) |
| Import JSON → `documentState.formatDocument.fondPerdu` | ✅ Fonctionnel (pass-through) |
| Export JSON → renvoyé à WebDev | ✅ Fonctionnel (pass-through) |
| UI : affichage visuel de la bande de fond perdu | ❌ Non implémenté |
| Géométrie : impact sur les limites de positionnement | ❌ Non implémenté |
| Export PSMD : valeurs dynamiques `<bleed>` | ❌ Non implémenté (valeurs en dur) |

---

## 3. Spécification fonctionnelle

### 3.1 Image de fond envoyée au Designer

**Responsabilité WebDev** (hors périmètre Designer, mais contexte nécessaire) :

Quand un document a un fond perdu de X mm, WebDev génère via Ghostscript une image JPG aux dimensions **format fini + fond perdu de chaque côté** :

```
Exemple : A4 portrait avec fond perdu 3mm uniforme

Format fini      : 210 × 297 mm
Image de fond    : 216 × 303 mm  (210 + 3 + 3) × (297 + 3 + 3)

Exemple : A4 portrait avec fond perdu asymétrique (haut=5, bas=3, gauche=3, droite=5)

Format fini      : 210 × 297 mm
Image de fond    : 218 × 305 mm  (210 + 3 + 5) × (297 + 5 + 3)
```

Le Designer reçoit :
- `formatDocument.largeurMm` = **210** (format fini, sans le fond perdu)
- `formatDocument.hauteurMm` = **297** (format fini, sans le fond perdu)
- `formatDocument.fondPerdu.actif` = **Vrai**
- `formatDocument.fondPerdu.hautMm` = **3** (ou valeur asymétrique)
- `formatDocument.fondPerdu.basMm` = **3**
- `formatDocument.fondPerdu.gaucheMm` = **3**
- `formatDocument.fondPerdu.droiteMm` = **3**
- `pages[0].urlFond` = URL de l'image JPG aux dimensions totales

### 3.2 Affichage visuel dans le Designer

#### 3.2.1 Dimensions de la page affichée

Quand `fondPerdu.actif = Vrai`, la page affichée dans le Designer doit être aux dimensions **format fini + fond perdu par côté** :

```
Largeur affichée = fondPerdu.gaucheMm + formatDocument.largeurMm + fondPerdu.droiteMm
Hauteur affichée = fondPerdu.hautMm + formatDocument.hauteurMm + fondPerdu.basMm
```

L'image de fond (JPG) occupe toute la surface de la page affichée.

#### 3.2.2 Overlay de la bande de fond perdu

Un overlay semi-transparent est appliqué sur la bande de fond perdu pour la distinguer visuellement du format fini :

```
┌─────────────────────────────────────┐
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ← hautMm
│▒▒┌───────────────────────────────┐▒▒│
│▒▒│                               │▒▒│
│▒▒│                               │▒▒│
│▒▒│     FORMAT FINI (zone de      │▒▒│
│▒▒│     personnalisation)         │▒▒│
│▒▒│                               │▒▒│
│▒▒│                               │▒▒│
│▒▒└───────────────────────────────┘▒▒│
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ← basMm
└─────────────────────────────────────┘
 ↑ gaucheMm                  droiteMm ↑

▒▒ = overlay semi-transparent blanc (ex: rgba(255,255,255,0.4))
     rend la bande plus claire que le format fini
     chaque bande peut avoir une épaisseur différente
```

**Implémentation CSS recommandée** : Un élément `<div>` overlay positionné en absolu au-dessus de l'image de fond, avec un "trou" découpé au centre (via `clip-path`, bordure épaisse, ou 4 rectangles overlay). Le trou correspond au format fini.

#### 3.2.3 Ligne de coupe (optionnel)

En complément de l'overlay, une fine ligne (1px, pointillée, rouge ou grise) peut marquer la limite de coupe (bord du format fini). Cela renforce la lisibilité.

### 3.3 Géométrie et contraintes de positionnement

#### 3.3.1 Zone autorisée pour les éléments

Les zones de personnalisation sont contraintes au **format fini** (pas au format avec fond perdu). La marge de sécurité s'applique à l'intérieur du format fini :

```
┌─────────────────────────────────────┐
│  Fond perdu haut (interdit)         │
│  ┌───────────────────────────────┐  │
│  │ Format fini                   │  │
│FP│  ┌─────────────────────────┐  │FP│
│G │  │ Zone autorisée          │  │D │
│  │  │ (format fini -          │  │  │
│  │  │  marge sécurité)        │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│  Fond perdu bas (interdit)          │
└─────────────────────────────────────┘
FPG/FPD = fond perdu gauche/droite (peuvent être différents)
```

#### 3.3.2 Calcul des limites

Actuellement, `getGeometryLimits()` calcule les limites basées sur le format fini et la marge de sécurité. Avec le fond perdu, il faut introduire un **offset** :

```
Sans fond perdu :
  Zone autorisée X : [margeSecurite, largeurMm - margeSecurite]
  Zone autorisée Y : [margeSecurite, hauteurMm - margeSecurite]
  Coordonnées zones : relatives au coin (0, 0) de la page

Avec fond perdu :
  La page affichée est plus grande (gaucheMm + largeurMm + droiteMm, hautMm + hauteurMm + basMm)
  L'image de fond commence au coin (0, 0) de la page affichée
  Le format fini commence au coin (gaucheMm, hautMm)
  
  Zone autorisée X : [gaucheMm + margeSecurite, gaucheMm + largeurMm - margeSecurite]
  Zone autorisée Y : [hautMm + margeSecurite, hautMm + hauteurMm - margeSecurite]
```

#### 3.3.3 Règle sur la marge de sécurité

La marge de sécurité (`margeSecuriteMm`) :
- Ne peut **jamais être négative**
- Peut être **égale à 0** (les zones peuvent aller jusqu'au bord du format fini, mais pas dans le fond perdu)
- S'applique à l'intérieur du format fini

#### 3.3.4 Coordonnées des zones dans le JSON

**Point critique** : Il faut définir le référentiel des coordonnées des zones.

**Option A — Coordonnées relatives au format fini** (recommandée) :
- Les coordonnées (xMm, yMm) d'une zone sont relatives au coin supérieur gauche du **format fini**
- La zone à (0, 0) est au bord supérieur gauche du format fini, pas du fond perdu
- Le fond perdu est un décalage purement visuel
- Avantage : les coordonnées sont identiques avec ou sans fond perdu → pas de recalcul à l'export/import
- Avantage : compatible avec le PSMD (PrintShop Mail utilise les coordonnées relatives au format fini)

**Option B — Coordonnées relatives à la page affichée** :
- Les coordonnées (xMm, yMm) incluent l'offset du fond perdu
- Une zone au coin du format fini serait à (3, 3) si fond perdu = 3mm
- Inconvénient : il faut soustraire le fond perdu à l'export PSMD

> ⚠️ **Recommandation : Option A.** Les coordonnées restent relatives au format fini. Le Designer applique l'offset visuellement pour le rendu, mais les données stockées et exportées ne changent pas.

---

## 4. Spécification technique — Phases de développement

### Phase FP-1 : Application des dimensions avec fond perdu

**Objectif** : Modifier la logique de création de page pour utiliser les valeurs de fond perdu reçues dans le JSON.

**Fichier** : `script.js`

**Fonctions impactées** :
- Code de création de page dans `loadDocumentJson()` (section import)
- Calcul des dimensions de la page (`docWidthPx`, `docHeightPx`)

**Logique** :
```javascript
// Lire les valeurs reçues de WebDev (pas de calcul, juste lecture)
const fp = (fondPerdu && fondPerdu.actif) ? fondPerdu : null;
const fpHaut = fp ? fp.hautMm : 0;
const fpBas = fp ? fp.basMm : 0;
const fpGauche = fp ? fp.gaucheMm : 0;
const fpDroite = fp ? fp.droiteMm : 0;

// Dimensions affichées (page dans le DOM)
const pageWidthMm = fpGauche + formatDocument.largeurMm + fpDroite;
const pageHeightMm = fpHaut + formatDocument.hauteurMm + fpBas;
const pageWidthPx = pageWidthMm / MM_PER_PIXEL;
const pageHeightPx = pageHeightMm / MM_PER_PIXEL;

// Stocker les offsets dans documentState pour réutilisation
documentState.fondPerduOffset = {
    hautMm: fpHaut, basMm: fpBas,
    gaucheMm: fpGauche, droiteMm: fpDroite,
    hautPx: fpHaut / MM_PER_PIXEL, basPx: fpBas / MM_PER_PIXEL,
    gauchePx: fpGauche / MM_PER_PIXEL, droitePx: fpDroite / MM_PER_PIXEL
};
```

**Validation** :
- [ ] Une page A4 avec fond perdu uniforme 3mm s'affiche à 216×303mm
- [ ] Une page A4 avec fond perdu asymétrique (h=5, b=3, g=3, d=5) s'affiche à 218×305mm
- [ ] Une page A4 sans fond perdu s'affiche à 210×297mm (inchangé)
- [ ] L'image de fond occupe toute la surface de la page

---

### Phase FP-2 : Overlay visuel de la bande de fond perdu

**Objectif** : Ajouter un overlay semi-transparent sur la bande de fond perdu.

**Fichiers** : `script.js`, `style.css`

**Implémentation recommandée** : 4 rectangles overlay positionnés en absolu autour du format fini :

```
┌────────────────────────────────┐
│          TOP OVERLAY           │  ← hauteur: hautMm
├────┬──────────────────────┬────┤
│LEFT│                      │RIGH│  ← hauteur: formatFiniMm
│    │   (trou = format     │ T  │
│    │    fini, pas         │    │
│    │    d'overlay)        │    │
├────┴──────────────────────┴────┤
│         BOTTOM OVERLAY         │  ← hauteur: basMm
└────────────────────────────────┘
  ↑ gaucheMm              droiteMm ↑
```

**CSS** :
```css
.bleed-overlay {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.4);
    pointer-events: none;  /* Ne pas intercepter les clics */
    z-index: 9999;         /* Au-dessus de tout sauf la toolbar */
}
```

**Création dynamique** : Les 4 divs overlay sont créés dans `script.js` lors de la création de la page, uniquement si `fondPerdu.actif === true`.

**Validation** :
- [ ] La bande de fond perdu est visuellement plus claire que le format fini
- [ ] L'overlay ne bloque pas les interactions (pointer-events: none)
- [ ] L'overlay s'adapte au zoom
- [ ] Pas d'overlay si fond perdu inactif

---

### Phase FP-3 : Ligne de coupe

**Objectif** : Ajouter une ligne de démarcation entre le format fini et le fond perdu.

**Fichiers** : `script.js`, `style.css`

**Implémentation** : Un `<div>` bordé positionné en absolu, aux dimensions exactes du format fini, décalé de fondPerduPx depuis le coin de la page :

```css
.bleed-cutline {
    position: absolute;
    left: <gauchePx>px;
    top: <hautPx>px;
    width: <formatFiniWidthPx>px;
    height: <formatFiniHeightPx>px;
    border: 1px dashed rgba(255, 0, 0, 0.5);
    pointer-events: none;
    z-index: 9998;
}
```

**Validation** :
- [ ] Ligne rouge pointillée visible autour du format fini
- [ ] Ne gêne pas les interactions
- [ ] S'adapte au zoom

---

### Phase FP-4 : Contraintes géométriques (getGeometryLimits)

**Objectif** : Modifier le calcul des limites de positionnement pour tenir compte du fond perdu.

**Fichier** : `script.js`

**Fonction impactée** : `getGeometryLimits()` (et toute fonction qui calcule les zones autorisées)

**Logique** :
```javascript
// Les offsets de fond perdu (lus depuis documentState)
const fp = documentState.fondPerduOffset || { hautMm: 0, basMm: 0, gaucheMm: 0, droiteMm: 0 };

// Zone autorisée (en mm, relatives à la page affichée)
const minXMm = fp.gaucheMm + margeSecuriteMm;
const minYMm = fp.hautMm + margeSecuriteMm;
const maxXMm = fp.gaucheMm + formatDocument.largeurMm - margeSecuriteMm;
const maxYMm = fp.hautMm + formatDocument.hauteurMm - margeSecuriteMm;
```

**Coordonnées des zones** (Option A retenue) :
- Les zones sont positionnées relativement au **format fini** dans le JSON
- À l'affichage, un offset de `gauchePx` / `hautPx` est ajouté pour le rendu visuel
- À l'export, les coordonnées sont restituées sans l'offset

**Impact sur le drag & drop et le redimensionnement** :
- Le snap-to-grid et les limites de déplacement doivent utiliser les nouvelles limites
- Une zone ne peut pas être déplacée dans la bande de fond perdu

**Validation** :
- [ ] Impossible de placer une zone dans la bande de fond perdu
- [ ] Marge de sécurité = 0 → la zone peut aller jusqu'au bord du format fini
- [ ] Marge de sécurité > 0 → la zone est contrainte à l'intérieur
- [ ] Les coordonnées exportées sont relatives au format fini (pas d'offset fond perdu)

---

### Phase FP-5 : Offset visuel des zones

**Objectif** : Appliquer le décalage visuel aux zones lors du rendu.

**Fichier** : `script.js`

**Principe** : Les coordonnées internes et exportées d'une zone restent relatives au format fini. Mais à l'affichage, la zone doit être décalée de `gaucheMm` en X et `hautMm` en Y pour apparaître au bon endroit dans la page (qui est plus grande que le format fini).

**Fonctions impactées** :
- Création/positionnement des zones DOM
- Conversion coordonnées mm → px pour l'affichage
- Conversion coordonnées px → mm à l'export (soustraire l'offset)
- Drag & drop (limites de déplacement)

**Logique** :
```javascript
const fp = documentState.fondPerduOffset || { gaucheMm: 0, hautMm: 0, gauchePx: 0, hautPx: 0 };

// Affichage : coordonnée DOM = coordonnée format fini + offset fond perdu
element.style.left = (zone.geometrie.xMm + fp.gaucheMm) / MM_PER_PIXEL + 'px';
element.style.top = (zone.geometrie.yMm + fp.hautMm) / MM_PER_PIXEL + 'px';

// Export : coordonnée JSON = coordonnée DOM - offset fond perdu
zone.geometrie.xMm = (parseFloat(element.style.left) * MM_PER_PIXEL) - fp.gaucheMm;
zone.geometrie.yMm = (parseFloat(element.style.top) * MM_PER_PIXEL) - fp.hautMm;
```

**Validation** :
- [ ] Une zone à (0, 0) dans le JSON apparaît au coin supérieur gauche du format fini (pas du fond perdu)
- [ ] Les coordonnées exportées d'une zone non déplacée sont identiques à celles importées
- [ ] Round-trip : import → affichage → export = coordonnées identiques

---

### Phase FP-6 : Export PSMD dynamique

**Objectif** : Remplacer les valeurs en dur de `<bleed>` dans le générateur PSMD par les valeurs dynamiques.

**Fichier** : `psmd-generator.js`

**Actuel** (en dur) :
```xml
<bleed>
  <mode>0</mode>
  <size>40</size>
</bleed>
```

**Cible** (dynamique) :
```xml
<!-- Si PrintShop Mail supporte un bleed uniforme uniquement -->
<bleed>
  <mode>1</mode>  <!-- 1 = fond perdu actif, 0 = inactif -->
  <size>VALEUR_EN_POINTS</size>  <!-- min(haut, bas, gauche, droite) converti en points -->
</bleed>
```

**Conversion** : `1mm = 2.834645669 points` → `bleedMm × 2.834645669`

**Données d'entrée** : `jsonData.formatDocument.fondPerdu` (avec les 4 côtés)

**Logique** :
```javascript
if (fondPerdu && fondPerdu.actif) {
    // PSM peut ne supporter qu'une valeur unique → prendre le minimum
    const minBleedMm = Math.min(fondPerdu.hautMm, fondPerdu.basMm, fondPerdu.gaucheMm, fondPerdu.droiteMm);
    const bleedPt = minBleedMm * 2.834645669;
    // mode=1, size=bleedPt
} else {
    // mode=0, size=0
}
```

**Validation** :
- [ ] Document avec fond perdu uniforme 3mm → `<bleed><mode>1</mode><size>8.50</size></bleed>`
- [ ] Document avec fond perdu asymétrique (min=2mm) → `<bleed><mode>1</mode><size>5.67</size></bleed>`
- [ ] Document sans fond perdu → `<bleed><mode>0</mode><size>0</size></bleed>`

> ⚠️ Les valeurs exactes de `<mode>` et le format de `<size>` pour PrintShop Mail doivent être vérifiées dans la documentation PSM ou par test. Si PSM supporte des bleed par côté, adapter en conséquence.

---

## 5. Points d'attention transversaux

### 5.1 Zoom

L'overlay de fond perdu et la ligne de coupe doivent suivre le zoom de la page. Si l'overlay est enfant de la page (position absolute dans le conteneur page), le zoom CSS s'applique automatiquement.

### 5.2 Mode aperçu

En mode aperçu (remplacement des champs de fusion par les valeurs), l'overlay de fond perdu doit rester visible.

### 5.3 Multi-pages (recto/verso)

Chaque page du document doit avoir son propre overlay de fond perdu. Le fond perdu est identique sur toutes les pages (même valeur).

### 5.4 Import/Export round-trip

Le fond perdu ne modifie pas les coordonnées stockées des zones. Un document importé puis exporté sans modification doit produire un JSON identique (pas de dérive due à l'offset).

### 5.5 Blanc tournant laser (hors périmètre)

Le blanc tournant pour les documents sans fond perdu en impression laser sera traité séparément. Il impacte la génération de l'image de fond côté WebDev (Ghostscript), pas le Designer. Mémorisé pour un développement ultérieur.

---

## 6. Ordre de développement recommandé

| Phase | Dépend de | Prompt Cursor |
|-------|-----------|---------------|
| FP-1 : Dimensions page | — | Prompt #1 |
| FP-2 : Overlay visuel | FP-1 | Prompt #1 (même prompt) |
| FP-3 : Ligne de coupe | FP-1 | Prompt #1 (même prompt) |
| FP-4 : Contraintes géométriques | FP-1 | Prompt #2 |
| FP-5 : Offset visuel zones | FP-1, FP-4 | Prompt #2 (même prompt) |
| FP-6 : Export PSMD | — | Prompt #3 (indépendant) |

**Proposition** :
- **Prompt #1** : FP-1 + FP-2 + FP-3 (affichage visuel complet)
- **Prompt #2** : FP-4 + FP-5 (géométrie et positionnement des zones)
- **Prompt #3** : FP-6 (PSMD, indépendant)

---

## 7. Tests de validation globaux

| # | Test | Résultat attendu |
|---|------|------------------|
| T.1 | Charger document A4 sans fond perdu | Page 210×297mm, pas d'overlay, pas de ligne de coupe |
| T.2 | Charger document A4 avec fond perdu uniforme 3mm | Page 216×303mm, overlay sur 3mm autour, ligne de coupe rouge |
| T.3 | Charger document A4 avec fond perdu asymétrique (h=5, b=3, g=3, d=5) | Page 218×305mm, bandes de tailles différentes |
| T.4 | Placer une zone texte au bord du format fini (marge=0) | Zone acceptée, ne déborde pas dans le fond perdu |
| T.5 | Tenter de déplacer une zone dans le fond perdu | Zone bloquée au bord du format fini |
| T.6 | Exporter un document avec fond perdu | Coordonnées zones relatives au format fini (pas d'offset) |
| T.7 | Import → Export sans modification | JSON identique (round-trip) |
| T.8 | Zoom 50% / 150% avec fond perdu | Overlay et ligne de coupe suivent le zoom |
| T.9 | Document recto/verso avec fond perdu | Overlay sur les deux pages |
| T.10 | Export PSMD avec fond perdu uniforme 3mm | `<bleed><mode>1</mode><size>8.50</size></bleed>` |
| T.11 | Export PSMD sans fond perdu | `<bleed><mode>0</mode><size>0</size></bleed>` |

---

## 8. Fichiers impactés

| Fichier | Phases | Modifications |
|---------|--------|---------------|
| `script.js` | FP-1 à FP-5 | Dimensions page, overlay, contraintes, offset zones |
| `style.css` | FP-2, FP-3 | Classes `.bleed-overlay`, `.bleed-cutline` |
| `psmd-generator.js` | FP-6 | Section `<bleed>` dynamique |
| `index.html` | — | Aucune modification (éléments créés dynamiquement) |
