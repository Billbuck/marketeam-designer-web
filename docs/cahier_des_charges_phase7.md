# Cahier des Charges - Phase 7 : Mode Standard - Application des contraintes

**Date** : 9 janvier 2026  
**Projet** : Marketeam Designer - Mode Template V2

---

## Objectif

En **mode Standard**, appliquer les contraintes définies par le créateur du template. Les sections/éléments contraints deviennent **invisibles** (ou grisés si trop complexe).

**Rappel** : En mode Template, le créateur peut toujours tout modifier (les contraintes ne s'appliquent pas à lui).

---

## 1. Contraintes Globales

| Contrainte | Action en Mode Standard | Statut |
|------------|-------------------------|--------|
| `global.selectionnable = false` | Zone non sélectionnable | ✅ Déjà implémenté |
| `global.toolbarAffichable = false` | Toolbar masquée | ✅ Déjà implémenté |
| `global.systeme = true` | Zone complètement inerte | ✅ Déjà implémenté |
| `global.nonSupprimable = true` | Bouton supprimer **masqué** | ❌ À implémenter |
| `global.pageModifiable = false` | Section "Page" (dropdown) **invisible** | ❌ À implémenter |
| `global.imprimable` | Géré dans export PSMD uniquement | ✅ Pas d'action UI |

---

## 2. Contraintes Géométriques (UI)

| Contrainte | Action en Mode Standard | Statut |
|------------|-------------------------|--------|
| `geometrie.locked = true` | Section "Géométrie" **invisible** | ❌ À implémenter |
| `geometrie.locked = true` | Checkbox "Verrouiller" **cochée + grisée** | ❌ À implémenter |
| `geometrie.locked = true` | Poignées de resize masquées | ✅ Déjà implémenté |
| `geometrie.locked = true` | Drag bloqué | ✅ Déjà implémenté |
| `geometrie.locked = true` | Resize bloqué | ✅ Déjà implémenté |
| `geometrie.positionFixe = true` | Section "Géométrie" **invisible** | ❌ À implémenter |
| `geometrie.positionFixe = true` | Drag bloqué | ✅ Déjà implémenté |

---

## 3. Contraintes de Style - Zone Texte (`textQuill`)

| Contrainte | Action en Mode Standard |
|------------|-------------------------|
| `style.contenuModifiable = false` | Zone Quill en **readonly** |
| `style.typographieModifiable = false` | Section `typography` **invisible** |
| `style.alignementsModifiable = false` | Section `paragraph` **invisible** |
| `style.fondModifiable = false` | Section `background` **invisible** |
| `style.bordureModifiable = false` | Section `border` **invisible** |

---

## 4. Contraintes de Style - Zone Image (`image`)

| Contrainte | Action en Mode Standard |
|------------|-------------------------|
| `style.typeSourceModifiable = false` | Boutons radio Fixe/Champ **invisibles** |
| `style.imageModifiable = false` | Contrôles upload/sélection **invisibles** |
| `style.affichageModifiable = false` | Section `display` **invisible** |
| `style.fondModifiable = false` | Section `background` **invisible** |
| `style.bordureModifiable = false` | Section `border` **invisible** |

---

## 5. Contraintes de Style - Zone Code-barres (`barcode`)

| Contrainte | Action en Mode Standard |
|------------|-------------------------|
| `style.typeCodeModifiable = false` | Section `barcode-type` **invisible** |
| `style.typeSourceModifiable = false` | Boutons radio Fixe/Champ **invisibles** |
| `style.donneesModifiable = false` | Champs valeur/sélection + section `qr-smart` **invisibles** |
| `style.apparenceModifiable = false` | Section `display` **invisible** |
| `style.fondModifiable = false` | Section `background` **invisible** |

---

## 6. Contraintes de Style - Zone QR Marketeam (`qr`)

| Contrainte | Action en Mode Standard |
|------------|-------------------------|
| `style.couleursModifiable = false` | Section `background` **invisible** |

---

## 7. Règles de visibilité des sections

### Principe général

Si une contrainte `*Modifiable = false` :
1. Masquer les contrôles (inputs, selects, checkboxes, boutons)
2. Masquer les libellés associés
3. Masquer le titre de la section si **tous** ses éléments sont masqués

### Fallback

Si masquer individuellement est trop complexe : **griser** la section entière avec opacité réduite + `pointer-events: none`.

---

## 8. Sections toolbar par type (data-section-id)

### Toolbar Texte (`quill-toolbar`)

| Section | `data-section-id` | Contrainte |
|---------|-------------------|------------|
| Page | `page` | `global.pageModifiable` |
| Typographie | `typography` | `style.typographieModifiable` |
| Alignements | `paragraph` | `style.alignementsModifiable` |
| Fond | `background` | `style.fondModifiable` |
| Bordure | `border` | `style.bordureModifiable` |
| Géométrie | `geometry` | `geometrie.locked` ou `geometrie.positionFixe` |
| Zone | `zone` | Checkbox "Verrouiller" grisée si `geometrie.locked` |

### Toolbar Image (`image-toolbar`)

| Section | `data-section-id` | Contrainte |
|---------|-------------------|------------|
| Page | `page` | `global.pageModifiable` |
| Source | `source` | `style.typeSourceModifiable` + `style.imageModifiable` |
| Affichage | `display` | `style.affichageModifiable` |
| Fond | `background` | `style.fondModifiable` |
| Bordure | `border` | `style.bordureModifiable` |
| Géométrie | `geometry` | `geometrie.locked` ou `geometrie.positionFixe` |
| Zone | `zone` | Checkbox "Verrouiller" grisée si `geometrie.locked` |

### Toolbar Barcode (`barcode-toolbar`)

| Section | `data-section-id` | Contrainte |
|---------|-------------------|------------|
| Page | `page` | `global.pageModifiable` |
| Type de code | `barcode-type` | `style.typeCodeModifiable` |
| Données | `data` | `style.typeSourceModifiable` + `style.donneesModifiable` |
| QR Intelligent | `qr-smart` | `style.donneesModifiable` |
| Affichage | `display` | `style.apparenceModifiable` |
| Fond | `background` | `style.fondModifiable` |
| Géométrie | `geometry` | `geometrie.locked` ou `geometrie.positionFixe` |
| Zone | `zone` | Checkbox "Verrouiller" grisée si `geometrie.locked` |

### Toolbar QR Marketeam (`qrcode-toolbar`)

| Section | `data-section-id` | Contrainte |
|---------|-------------------|------------|
| Page | `page` | `global.pageModifiable` |
| Fond | `background` | `style.couleursModifiable` |
| Géométrie | `geometry` | `geometrie.locked` ou `geometrie.positionFixe` |
| Zone | `zone` | Checkbox "Verrouiller" grisée si `geometrie.locked` |

---

## 9. Hors scope Phase 7

- Ajout de `toolbarAffichable` dans l'onglet Contraintes (tâche séparée)
- Contraintes géométriques temps réel (déjà implémentées en Phase 6)

---

## 10. Critères de validation

1. ✅ En mode Standard, les sections contraintes sont invisibles
2. ✅ En mode Standard, Quill est readonly si `contenuModifiable = false`
3. ✅ En mode Standard, checkbox "Verrouiller" est cochée + grisée si `locked = true`
4. ✅ En mode Standard, bouton supprimer est masqué si `nonSupprimable = true`
5. ✅ En mode Template, toutes les sections restent visibles et modifiables
6. ✅ Pas de régression sur les fonctionnalités existantes
