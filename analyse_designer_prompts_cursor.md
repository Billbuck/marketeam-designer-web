# Analyse du Designer Marketeam - Fonctionnalités et Prompts Cursor

## 1. Comparatif Fonctionnalités

### Légende
- ✅ Implémenté et conforme
- ⚠️ Implémenté mais à adapter
- ❌ Non implémenté

---

### A. Zones de Texte

| Fonctionnalité | Designer | JSON | Statut | Notes |
|----------------|----------|------|--------|-------|
| Création zone | ✅ | ✅ | ✅ | OK |
| Contenu texte | ✅ | ✅ | ✅ | OK |
| Police | Liste fixe | Dynamique | ⚠️ | Charger depuis JSON |
| Taille (pt) | ✅ | ✅ | ✅ | OK |
| Couleur texte | ✅ | ✅ | ✅ | OK |
| Alignement H | ✅ | ✅ | ✅ | OK |
| Alignement V | ✅ | ✅ | ✅ | OK |
| Interligne | ✅ | ✅ | ✅ | OK |
| Gras global | ✅ | ✅ | ✅ | OK |
| Fond transparent | ✅ | ✅ | ✅ | OK |
| Couleur fond | ✅ | ✅ | ✅ | OK |
| Bordure | ✅ | ✅ | ✅ | OK |
| Verrouillage | ✅ | ✅ | ✅ | OK |
| Copyfitting actif | ✅ | ✅ | ✅ | OK |
| Copyfitting tailleMin | Code OK | JSON | ⚠️ | Exposer dans UI |
| Copyfitting retourLigne | Code OK | JSON | ⚠️ | Exposer dans UI |
| Formatage partiel | ✅ | ✅ | ✅ | OK |
| Nom zone | Non éditable | ✅ | ⚠️ | Ajouter champ |
| Niveau (z-index) | ❌ | ✅ | ❌ | À implémenter |
| Rotation | ❌ | ✅ | ❌ | À implémenter |
| Supprimer lignes vides | ❌ | ✅ | ❌ | À implémenter |

### B. Zones QR Code / Code-barres

| Fonctionnalité | Designer | JSON | Statut | Notes |
|----------------|----------|------|--------|-------|
| QR Code | ✅ | ✅ | ✅ | OK |
| Code128 | ❌ | ✅ | ❌ | À implémenter |
| EAN13 | ❌ | ✅ | ❌ | À implémenter |
| Code39 | ❌ | ✅ | ❌ | À implémenter |
| DataMatrix | ❌ | ✅ | ❌ | À implémenter |
| Contenu éditable | ❌ | ✅ | ❌ | À implémenter |
| Couleur code | Code OK | ✅ | ⚠️ | Exposer dans UI |
| Couleur fond | Code OK | ✅ | ⚠️ | Exposer dans UI |
| Verrouillage | ✅ | ✅ | ✅ | OK |
| Niveau | ❌ | ✅ | ❌ | À implémenter |
| Rotation | ❌ | ✅ | ❌ | À implémenter |

### C. Zones Image

| Fonctionnalité | Designer | JSON | Statut | Notes |
|----------------|----------|------|--------|-------|
| Zone image | ❌ | ✅ | ❌ | Tout à créer |
| Source fixe | ❌ | ✅ | ❌ | URL statique |
| Source variable | ❌ | ✅ | ❌ | Depuis BDD |
| Source importée | ❌ | ✅ | ❌ | Upload utilisateur |
| Mode échelle | ❌ | ✅ | ❌ | aucun/étirer/proportionnel/remplir |
| Alignement H/V | ❌ | ✅ | ❌ | Dans le cadre |
| Page PDF | ❌ | ✅ | ❌ | Multi-pages |
| Bordure | ❌ | ✅ | ❌ | Comme texte |

### D. Champs de Fusion

| Fonctionnalité | Designer | JSON | Statut | Notes |
|----------------|----------|------|--------|-------|
| Liste dynamique | Liste fixe | Dynamique | ❌ | Charger depuis JSON |
| Syntaxe | `{{CHAMP}}` | `@CHAMP@` | ⚠️ | Adapter syntaxe |
| Type TXT | ❌ | ✅ | ❌ | Texte BDD |
| Type SYS | ❌ | ✅ | ❌ | Système |
| Type IMG | ❌ | ✅ | ❌ | Image variable |

### E. Communication WebDev

| Fonctionnalité | Designer | JSON | Statut | Notes |
|----------------|----------|------|--------|-------|
| Charger JSON entrée | ❌ | ✅ | ❌ | Fonction loadFromWebDev() |
| Exporter JSON sortie | Format différent | ✅ | ⚠️ | Adapter format |
| Polices utilisées | ❌ | ✅ | ❌ | Extraire polices |
| Upload image | ❌ | ✅ | ❌ | API upload |

---

## 2. Priorisation des Développements

### SPRINT 1 : Communication WebDev (Fondation)
**Objectif** : Permettre l'échange de données entre WebDev et le Designer

1. **P1.1** - Fonction de chargement JSON WebDev
2. **P1.2** - Adaptation export JSON vers format défini
3. **P1.3** - Champs de fusion dynamiques
4. **P1.4** - Syntaxe `@CHAMP@`

### SPRINT 2 : Améliorations Zones Texte
**Objectif** : Compléter les fonctionnalités des zones texte

5. **P2.1** - Polices dynamiques depuis JSON
6. **P2.2** - Niveau (z-index) et gestion empilement
7. **P2.3** - Nom de zone éditable
8. **P2.4** - Suppression lignes vides

### SPRINT 3 : Zones Image
**Objectif** : Implémenter les zones image

9. **P3.1** - Création zone image (type fixe)
10. **P3.2** - Source variable (BDD)
11. **P3.3** - Upload image (importée)
12. **P3.4** - Modes d'affichage (échelle, alignement)

### SPRINT 4 : Zones Code-barres
**Objectif** : Généraliser les codes-barres

13. **P4.1** - Transformer QR en Code-barres générique
14. **P4.2** - Ajouter types (Code128, EAN13, etc.)
15. **P4.3** - Contenu éditable avec variables
16. **P4.4** - Panneau propriétés code-barres

### SPRINT 5 : Fonctionnalités avancées
**Objectif** : Compléter avec les fonctionnalités secondaires

17. **P5.1** - Rotation des zones
18. **P5.2** - Copyfitting avancé (UI)
19. **P5.3** - Aperçu avec données

---

## 3. Prompts Cursor

### PROMPT P1.1 - Chargement JSON WebDev

```
## Contexte
Je développe un éditeur VDP (Variable Data Publishing) en HTML/CSS/JS vanilla.
Le fichier principal est script.js (3900+ lignes).
L'éditeur doit charger sa configuration depuis un JSON fourni par WebDev.

## Fichiers à modifier
- script.js

## Structure JSON d'entrée (à charger)
Voir le fichier : structure_json_marketeam_designer.json

Les blocs principaux sont :
- identification : métadonnées du document
- formatDocument : dimensions, fond perdu, traits de coupe
- champsFusion : liste des champs disponibles (code, libelle, ordre, typeChamp)
- donneesApercu : données exemple pour prévisualisation
- polices : googleFonts et policesClient avec URLs TTF
- uploadImage : configuration upload
- pages : liste des pages avec fonds PDF/JPG
- zonesTexte, zonesImage, zonesCodeBarres : zones existantes

## Tâche
1. Créer une fonction `loadFromWebDev(jsonData)` qui :
   - Parse le JSON d'entrée
   - Initialise `documentState` avec les données
   - Convertit les zonesTexte/zonesImage/zonesCodeBarres vers le format interne
   - Crée les pages dans documentState.pages
   - Charge les fonds de page (images JPG)
   - Appelle loadCurrentPage() pour afficher

2. Créer une fonction `initFromUrlParam()` qui :
   - Vérifie si un paramètre URL `config` existe
   - Si oui, fetch le JSON depuis cette URL
   - Appelle loadFromWebDev() avec le résultat

3. Modifier le DOMContentLoaded pour :
   - Appeler initFromUrlParam() au démarrage
   - Si pas de paramètre, charger depuis localStorage (comportement actuel)

## Mapping des propriétés JSON → documentState

### zonesTexte
| JSON | documentState |
|------|---------------|
| id | id (clé) |
| page | → stocker dans pages[page-1].zones |
| nom | name |
| niveau | zIndex (nouveau) |
| verrouille | locked |
| rotation | rotation (nouveau) |
| geometrie.xMm | x (convertir mm→px) |
| geometrie.yMm | y (convertir mm→px) |
| geometrie.largeurMm | w (convertir mm→px) |
| geometrie.hauteurMm | h (convertir mm→px) |
| contenu | content |
| formatage | formatting (adapter debut/fin → start/end) |
| style.police | font |
| style.taillePt | size |
| style.couleur | color |
| style.gras | bold |
| style.interligne | lineHeight |
| style.alignementH | align |
| style.alignementV | valign |
| fond.transparent | isTransparent |
| fond.couleur | bgColor |
| bordure.epaisseur | border.width |
| bordure.couleur | border.color |
| bordure.style | border.style |
| copyfitting.actif | copyfit |
| copyfitting.tailleMinimum | copyfitMin (nouveau) |
| copyfitting.autoriserRetourLigne | copyfitWrap (nouveau) |
| supprimerLignesVides | removeEmptyLines (nouveau) |

### Conversion unités
- MM_PER_PIXEL = 25.4 / 96
- mm → px : valeur / MM_PER_PIXEL
- px → mm : valeur * MM_PER_PIXEL

## Contraintes
- Ne pas casser le fonctionnement actuel (localStorage)
- Garder la rétrocompatibilité
- Commenter le code en français
```

---

### PROMPT P1.2 - Export JSON vers format défini

```
## Contexte
Suite du développement de l'éditeur VDP.
L'export JSON actuel utilise un format différent de celui attendu par WebDev.

## Fichiers à modifier
- script.js (fonctions btnGenerate et btnGenerateJsonDebug)

## Structure JSON de sortie attendue
{
  "idDocument": "string",
  "dateModification": "ISO 8601",
  "policesUtilisees": [
    { "nom": "string", "variantes": ["regular", "bold"] }
  ],
  "zonesTexte": [...],
  "zonesImage": [...],
  "zonesCodeBarres": [...]
}

## Tâche
1. Créer une fonction `exportToWebDev()` qui génère le JSON au format défini

2. La structure de chaque zone doit correspondre EXACTEMENT au format JSON défini :
   - Utiliser les noms de propriétés en camelCase français (geometrie, largeurMm, etc.)
   - Convertir px → mm pour les géométries
   - Inclure TOUTES les propriétés même si valeur par défaut

3. Extraire automatiquement les polices utilisées :
   - Parcourir toutes les zones texte
   - Collecter les polices uniques
   - Déterminer les variantes (regular si non-gras, bold si gras)

4. Remplacer le bouton "Exporter JSON" actuel par cette fonction

5. Garder "Exporter JSON (debug)" pour le format actuel (utile pour debug)

## Mapping inverse documentState → JSON

### zonesTexte
| documentState | JSON |
|---------------|------|
| id | id |
| (depuis pages[i]) | page (numéro) |
| name | nom |
| zIndex | niveau |
| locked | verrouille |
| rotation | rotation |
| x, y, w, h (px) | geometrie.xMm/yMm/largeurMm/hauteurMm (mm) |
| content | contenu |
| formatting | formatage (adapter start/end → debut/fin) |
| font | style.police |
| size | style.taillePt |
| color | style.couleur |
| bold | style.gras |
| lineHeight | style.interligne |
| align | style.alignementH |
| valign | style.alignementV |
| isTransparent | fond.transparent |
| bgColor | fond.couleur |
| border.* | bordure.* |
| copyfit | copyfitting.actif |
| copyfitMin | copyfitting.tailleMinimum |
| copyfitWrap | copyfitting.autoriserRetourLigne |
| removeEmptyLines | supprimerLignesVides |

## Contraintes
- Format JSON strictement conforme à la documentation
- Toutes les zones de toutes les pages
- Pas de zones supprimées (elles n'existent plus)
```

---

### PROMPT P1.3 - Champs de fusion dynamiques

```
## Contexte
L'éditeur VDP a actuellement une liste fixe de champs de fusion.
Ils doivent être chargés dynamiquement depuis le JSON WebDev.

## Fichiers à modifier
- script.js
- index.html (si nécessaire pour le conteneur)

## Code actuel à remplacer
```javascript
const MERGE_FIELDS = ['Civilité', 'Nom', 'Prénom', 'Adresse 1', 'Adresse 2', 'CP', 'Ville', 'Téléphone', 'Champ 1'];
```

## Structure JSON des champs
"champsFusion": [
  {
    "code": "CIVILITE",      // Code technique
    "libelle": "Civilité",   // Libellé affiché
    "ordre": 1,              // Ordre d'affichage
    "typeChamp": "TXT"       // TXT, SYS ou IMG
  }
]

## Tâche
1. Supprimer la constante MERGE_FIELDS

2. Créer une variable `let mergeFields = []` pour stocker les champs

3. Créer une fonction `loadMergeFields(champsFusion)` qui :
   - Vide le conteneur #merge-fields-list
   - Trie les champs par ordre
   - Pour chaque champ, crée un tag avec :
     - Le libellé affiché
     - Un attribut data-code avec le code technique
     - Une classe selon le type (merge-tag-txt, merge-tag-sys, merge-tag-img)
   - Au clic, insère `@CODE@` (pas `{{libelle}}`)

4. Modifier insertTag() pour utiliser le code technique :
   - Ancienne syntaxe : `{{Civilité}}`
   - Nouvelle syntaxe : `@CIVILITE@`

5. Appeler loadMergeFields() depuis loadFromWebDev()

6. Style CSS différent selon le type :
   - TXT : bleu (actuel)
   - SYS : violet
   - IMG : vert

## HTML du tag
<div class="merge-tag merge-tag-txt" data-code="CIVILITE" draggable="true">
  Civilité
</div>

## Contraintes
- Rétrocompatibilité : si pas de champsFusion, utiliser une liste par défaut
- Les champs IMG ne sont utilisables que dans les zones image (griser sinon)
```

---

### PROMPT P1.4 - Adaptation syntaxe champs fusion

```
## Contexte
La syntaxe des champs de fusion doit passer de {{CHAMP}} à @CHAMP@.

## Fichiers à modifier
- script.js

## Tâche
1. Dans insertTag(), changer :
   - Ancien : `{{${fieldName}}}`
   - Nouveau : `@${fieldCode}@`

2. Dans le placeholder du textarea :
   - Ancien : "Ex: Cher {{NOM}},"
   - Nouveau : "Ex: Cher @NOM@,"

3. Créer une fonction `convertLegacySyntax(content)` qui :
   - Détecte les `{{...}}`
   - Les convertit en `@...@`
   - Utile pour migration des anciens documents

4. Dans l'affichage (renderFormattedContent), mettre en évidence les @CHAMP@ :
   - Regex : /@([A-Z0-9_]+)@/g
   - Style : fond coloré pour visualiser les variables

## Contraintes
- Ne pas casser les documents existants
- Convertir automatiquement l'ancienne syntaxe au chargement
```

---

### PROMPT P2.1 - Polices dynamiques

```
## Contexte
Les polices sont actuellement une liste fixe dans le HTML.
Elles doivent être chargées dynamiquement depuis le JSON et les fichiers TTF.

## Fichiers à modifier
- script.js
- index.html (select #input-font)
- style.css (si nécessaire pour @font-face)

## Structure JSON des polices
"polices": {
  "googleFonts": [
    {
      "nom": "Roboto",
      "variantes": [
        { "style": "regular", "urlTtf": "https://..." },
        { "style": "bold", "urlTtf": "https://..." }
      ]
    }
  ],
  "policesClient": [...]
}

## Tâche
1. Créer une fonction `loadFonts(policesConfig)` qui :
   - Parcourt googleFonts et policesClient
   - Pour chaque police, crée une règle @font-face dynamique
   - Ajoute une balise <style> au document
   - Peuple le <select> #input-font avec les options

2. Générer le CSS @font-face :
```css
@font-face {
  font-family: 'NomPolice';
  src: url('urlTtf') format('truetype');
  font-weight: normal; /* ou bold */
  font-style: normal;
}
```

3. Pour chaque police avec variante bold, créer 2 règles @font-face

4. Mettre à jour le <select> :
   - Vider les options existantes
   - Ajouter une option par police
   - Sélectionner la première par défaut

5. Appeler loadFonts() depuis loadFromWebDev()

## Contraintes
- Précharger les polices avant d'afficher le document
- Gérer les erreurs de chargement (police fallback)
- Afficher un indicateur de chargement pendant le téléchargement
```

---

### PROMPT P2.2 - Niveau (z-index)

```
## Contexte
Les zones doivent avoir un niveau (z-index) pour gérer l'empilement.
La zone avec le niveau le plus élevé est au premier plan.

## Fichiers à modifier
- script.js
- index.html (ajouter contrôle dans le panneau propriétés)
- style.css

## Tâche
1. Ajouter la propriété `niveau` (ou `zIndex`) dans les données de zone :
   - Valeur par défaut : 1
   - Min : 1, Max : 100

2. Ajouter un contrôle dans le panneau propriétés :
   - Label "Niveau"
   - Input number avec spin buttons
   - Position : après la géométrie

3. Appliquer le z-index au DOM :
   - Dans createZoneDOM() : `zone.style.zIndex = zoneData.niveau || 1`
   - Dans updateActiveZoneData() : mettre à jour si modifié

4. Ajouter des boutons rapides :
   - "Premier plan" : met le niveau au max des zones + 1
   - "Arrière-plan" : met le niveau à 1

5. Dans la toolbar multi-sélection, ajouter :
   - "Avancer" : +1 au niveau
   - "Reculer" : -1 au niveau

## HTML
<div class="style-row">
  <div class="input-group half">
    <label>Niveau</label>
    <input type="number" id="input-niveau" value="1" min="1" max="100">
  </div>
  <div class="input-group half">
    <button id="btn-front" class="btn-primary btn-small">
      <span class="material-icons">flip_to_front</span>
    </button>
    <button id="btn-back" class="btn-primary btn-small">
      <span class="material-icons">flip_to_back</span>
    </button>
  </div>
</div>

## Contraintes
- Les zones sélectionnées doivent toujours apparaître au-dessus (z-index temporaire)
- Restaurer le z-index normal à la désélection
```

---

### PROMPT P3.1 - Création zone image (type fixe)

```
## Contexte
L'éditeur doit permettre de créer des zones image.
On commence par le type "fixe" (URL statique).

## Fichiers à modifier
- script.js
- index.html (bouton + panneau propriétés)
- style.css

## Tâche
1. Ajouter un bouton "Zone image" dans la toolbar :
```html
<button id="btn-add-image" class="btn-primary">
  <span class="material-icons">image</span> Zone image
</button>
```

2. Créer la structure de données pour une zone image :
```javascript
{
  type: 'image',
  source: {
    type: 'fixe',        // 'fixe', 'variable', 'importee'
    urlImage: '',
    urlApercu: ''
  },
  affichage: {
    modeEchelle: 'proportionnel',  // 'aucun', 'etirer', 'proportionnel', 'remplir'
    conserverProportions: true,
    alignementH: 'center',
    alignementV: 'middle',
    pagePdf: 1
  },
  border: { width: 0, color: '#000000', style: 'solid' },
  locked: false,
  niveau: 1
}
```

3. Créer createImageZoneDOM(id) qui :
   - Crée un div.zone.zone-image
   - Affiche l'image ou un placeholder si pas d'URL
   - Applique le mode d'échelle CSS (object-fit)

4. Créer un panneau de propriétés spécifique aux images :
   - Input URL image
   - Select mode d'échelle
   - Select alignement H/V
   - Bordure (réutiliser le composant existant)

5. Mapping object-fit :
   - aucun : none
   - etirer : fill
   - proportionnel : contain
   - remplir : cover

## Placeholder image
Afficher une icône "image" Material Icons en gris si pas d'URL.

## Contraintes
- Redimensionnable comme les autres zones
- Poignées aux 4 coins
- Support drag & drop d'URL (bonus)
```

---

## 4. Projet WebDev de Test

### Structure du projet

```
/MARKETEAM_TEST_DESIGNER/
├── PAGE_Test.wdw           # Page principale
├── PAGE_Test.wdwi          # Infos page
├── COL_Designer.wwh        # Collection HTML Designer
├── BTN_Charger.wdw         # Bouton charger
├── BTN_Sauvegarder.wdw     # Bouton sauvegarder
├── EDT_JsonEntree.wdw      # Zone édition JSON entrée
├── EDT_JsonSortie.wdw      # Zone édition JSON sortie
└── Global/
    └── Declarations.wdw    # Variables globales
```

### Pseudo-code WebDev (WLangage)

```wlangage
// === PAGE_Test - Déclarations ===
GLOBAL
    gsJsonConfig est une chaîne     // JSON envoyé au Designer
    gsJsonResultat est une chaîne   // JSON reçu du Designer
FIN

// === PAGE_Test - Initialisation ===
PROCEDURE Initialisation()
    // JSON de test par défaut
    gsJsonConfig = fChargeTexte("config_test.json")
    EDT_JsonEntree = gsJsonConfig
FIN

// === BTN_Charger - Clic ===
PROCEDURE Clic_BTN_Charger()
    // Envoyer le JSON au Designer (iframe)
    MonCode est une chaîne = [
        var iframe = document.getElementById('designer-iframe');
        var jsonData = %1;
        iframe.contentWindow.loadFromWebDev(jsonData);
    ]
    MonCode = ChaîneConstruit(MonCode, gsJsonConfig)
    NavigateurExécuteJS(MonCode)
FIN

// === BTN_Sauvegarder - Clic ===
PROCEDURE Clic_BTN_Sauvegarder()
    // Récupérer le JSON du Designer
    MonCode est une chaîne = [
        var iframe = document.getElementById('designer-iframe');
        var result = iframe.contentWindow.exportToWebDev();
        return JSON.stringify(result);
    ]
    gsJsonResultat = NavigateurExécuteJS(MonCode)
    EDT_JsonSortie = gsJsonResultat
FIN

// === HTML de la page ===
// <iframe id="designer-iframe" src="designer/index.html" style="width:100%; height:800px; border:none;"></iframe>
```

### Communication bidirectionnelle

```
┌─────────────────────────────────────────────────────────────┐
│                        WebDev                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ JSON Config  │───▶│   iframe     │───▶│ JSON Résultat│   │
│  │   (Entrée)   │    │  Designer    │    │   (Sortie)   │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   ▲                    ▲           │
│         │    loadFromWebDev()     exportToWebDev()          │
│         ▼                   │                    │           │
│  ┌──────────────────────────┴────────────────────┘          │
│  │              NavigateurExécuteJS()                        │
│  └───────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
```

### Fichier config_test.json

Utiliser le fichier `structure_json_marketeam_designer.json` généré précédemment.

---

## 5. Ordre d'exécution recommandé

| # | Prompt | Dépendances | Durée estimée |
|---|--------|-------------|---------------|
| 1 | P1.1 - Chargement JSON | - | 2h |
| 2 | P1.3 - Champs fusion dynamiques | P1.1 | 1h |
| 3 | P1.4 - Syntaxe @CHAMP@ | P1.3 | 30min |
| 4 | P1.2 - Export JSON | P1.1 | 1h30 |
| 5 | P2.1 - Polices dynamiques | P1.1 | 1h30 |
| 6 | P2.2 - Niveau (z-index) | - | 1h |
| 7 | P3.1 - Zone image fixe | P1.1 | 2h |
| 8 | P4.1 - Code-barres générique | - | 1h30 |

**Total estimé Sprint 1-2** : ~11h

---

## 6. Tests de validation

### Test P1.1 - Chargement
1. Ouvrir Designer avec `?config=url_json`
2. Vérifier que les pages sont créées
3. Vérifier que les zones apparaissent aux bonnes positions
4. Vérifier que les styles sont appliqués

### Test P1.2 - Export
1. Modifier des zones
2. Cliquer "Exporter JSON"
3. Comparer avec structure_json attendue
4. Vérifier que policesUtilisees est correct

### Test P1.3 - Champs fusion
1. Charger JSON avec champsFusion
2. Vérifier que les tags apparaissent
3. Cliquer sur un tag
4. Vérifier que @CODE@ est inséré

### Test communication WebDev
1. Ouvrir PAGE_Test
2. Cliquer "Charger"
3. Modifier dans le Designer
4. Cliquer "Sauvegarder"
5. Vérifier EDT_JsonSortie
