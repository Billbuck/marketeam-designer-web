# REPRISE PROJET - Marketeam Designer

## ÉTAT ACTUEL

**Dernière phase terminée** : Phase 4.2
**Prochain prompt à lancer** : Phase 5.1 (toolbar-data - champs de fusion)

---

## COMMITS EFFECTUÉS

| Commit | Description |
|--------|-------------|
| Phase 1.1 | Suppression #coords-panel (HTML + JS neutralisé) |
| Phase 2.1 | Remplacement HTML/CSS toolbar-texte (POC) |
| Phase 2.2 | Adaptation JS spinners, toggle-groups, checkboxes POC |
| Phase 3.1 | Ajout HTML/CSS/DOM toolbar-image (POC) |
| Phase 3.2 | Logique affichage toolbar-image par type de zone |
| Phase 4.1 | Ajout HTML/CSS/DOM toolbar-barcode + toolbar-qrcode (POC) |
| Phase 4.2 | Logique affichage toolbar-barcode + toolbar-qrcode |
| Phase 6.1 | Sidebar POC - HTML/CSS intégré (design Marketeam) |
| Phase 6.2 | Logique visibilité sections sidebar (POC) |
| Phase 6.2 | Connexions JS sidebar - visibilité sections, clics, alignements |

---

## PHASES RESTANTES

| Phase | Description | Statut |
|-------|-------------|--------|
| Phase 5 | Toolbar data (champs de fusion) | ⏳ À faire |
| Phase 6 | Sidebar (POC) | ⏳ À faire |
| Phase 7 | Nettoyage et tests | ⏳ À faire |

---

## ARCHITECTURE ACTUELLE

### Toolbars intégrées (fonctionnelles)
- `#quill-toolbar` → zones text/textQuill ✅
- `#image-toolbar` → zones image ✅
- `#barcode-toolbar` → zones barcode ✅
- `#qrcode-toolbar` → zones qr ✅

### Toolbars à créer
- `#data-toolbar` → champs de fusion (zones textQuill uniquement, si champs reçus)

### Sidebar
- Actuelle : ancienne version
- À faire : remplacer par POC sidebar

### Fichiers principaux
- `index.html` - Structure HTML
- `script.js` - Logique JS (~13500 lignes, monolithique)
- `style.css` - Styles CSS

---

## CONVENTIONS ÉTABLIES

### IDs des toolbars
- Toolbar texte : préfixe `quill-` (ex: `quill-input-font`)
- Toolbar image : préfixe `image-` (ex: `image-input-mode`)
- Toolbar barcode : préfixe `barcode-` (ex: `barcode-input-type`)
- Toolbar qrcode : préfixe `qrcode-` (ex: `qrcode-chk-transparent`)
- Toolbar data : préfixe `data-`

### Composants POC réutilisables
- `initSpinnerPoc(inputId, min, max, step, onChange)`
- `initToggleGroupPoc(groupId, onChange)`
- `initCheckboxPoc(checkboxId, onChange)`
- `setCheckboxPocState(checkboxId, checked)`

### Classes CSS POC
- `.toolbar-poc` - Container toolbar
- `.toolbar-header-poc` - Header draggable
- `.section-poc` - Section collapsible
- `.spinner-poc` - Input avec +/-
- `.toggle-group-poc` - Boutons mutuellement exclusifs
- `.checkbox-poc` - Checkbox custom

---

## RÈGLES CURSOR

### Standards JSDoc obligatoires
```javascript
/**
 * Description de la fonction
 * @param {type} nomParam - Description
 * @returns {type} Description du retour
 */
```

### Structure script.js - ORDRE CRITIQUE
| Type de code | Où le placer |
|--------------|--------------|
| `const xxx = document.getElementById()` | **SECTION 1 uniquement** |
| Constantes globales | Section 2 |
| Nouvelles fonctions | Près des fonctions similaires |
| Event listeners | Section 16 ou près des fonctions liées |

---

## WORKFLOW

1. Un prompt Cursor = une étape focalisée
2. Test après chaque étape
3. Commit si OK / Rollback + prompt corrigé si KO
4. Nouvelle conversation Cursor à chaque nouvelle phase

---

## FICHIERS POC DE RÉFÉRENCE

- `toolbar-texte.html` ✅ Intégré
- `toolbar-image.html` ✅ Intégré
- `toolbar-barcode.html` ✅ Intégré
- `toolbar-qrcode.html` ✅ Intégré
- `toolbar-data.html` - À intégrer (Phase 5)
- `test-integration.html` - Contient le POC sidebar à intégrer (Phase 6)

---

## POUR REPRENDRE

Copier ce fichier + le prompt de la phase en cours dans une nouvelle conversation Claude.
