# Cahier des charges — Formatage des champs de fusion (Designer ↔ PrintShop Mail 7.x)

> **SOURCE DE VÉRITÉ du chantier.**
> Document de pilotage : le périmètre arrêté en §2 ne doit pas être remis en
> cause sans décision explicite du pilotage. Rédigé le 10/06/2026 à l'issue
> de l'analyse de faisabilité (conversation Designer / PSMD).
> **Phase 0 VALIDÉE le 10/06/2026** (test PSM 7, fichier
> `Test_formatage_des_champs`) — contrat prouvé, cf. §5 Phase 0.

---

## 1. Besoin (responsable de production)

Formater l'**affichage des champs de fusion** insérés dans les zones texte du
Designer, comme le permet PrintShop Mail, avec **concordance stricte
écran / print** :

- ce que l'utilisateur voit dans l'aperçu du Designer (mode `donneesApercu`)
  doit être identique à ce que PrintShop Mail 7.x imprime (BAT et production) ;
- le choix du format se fait **champ par champ, à l'endroit où il est inséré**
  (une même colonne peut être en majuscules dans le corps du courrier et en
  casse normale dans le pavé adresse).

Formats demandés à l'origine : casse de texte, dates, entiers, monétaire.
Le périmètre effectivement retenu est arrêté en §2.

---

## 2. Périmètre arrêté (décisions de pilotage — ne pas remettre en cause)

### 2.1 Voie technique unique : fonctions dans l'expression de la variable PSMD

Le formatage est porté **exclusivement** par des **fonctions dans
l'expression** de la variable PSMD :

```xml
<variable>
<name>Nom__MAJ</name>
<expression>UPPER([Nom])</expression>
...
</variable>
```

Le volet « Propriétés » de la variable PSM (section Format : catégories
Date / Unité monétaire / Nombre, locales, symboles, décimales, groupement —
éléments `<Locale_ID>`, `Currency_*`, `Number_*`, `<Date_Style>` du PSMD)
est **EXCLU** du chantier. Ces éléments continuent d'être émis tels quels
(valeurs par défaut actuelles de `generatePsmdVariable()`,
`psmd-generator.js` lignes 1429-1452).

**Seule exception (prouvée en Phase 0)** : dans la section `<variable>`,
**seuls `<expression>` et `<Formatting>` sont à paramétrer** :

| Format | `<expression>` | `<Formatting>` |
|---|---|---|
| Aucun (actuel) | `[X]` | `3` (inchangé) |
| Casse (MAJ/MIN/PRO) | `UPPER([X])` / `LOWER([X])` / `PROPER([X])` | `3` (inchangé) |
| Date | `DATE([X], "masque")` | **`0`** |

Tous les autres éléments de `<variable>` restent strictement identiques à la
sortie actuelle de `generatePsmdVariable()` (grammaire vérifiée identique
lors du test Phase 0).

### 2.2 Casse de texte (champs de type texte) — RETENU

| Option utilisateur | Fonction PSM 7.2 |
|---|---|
| Majuscule | `UPPER([Champ])` |
| Minuscule | `LOWER([Champ])` |
| Nom propre (1re lettre en majuscule) | `PROPER([Champ])` |

### 2.3 Dates — RETENU avec contrainte amont

Formats via `DATE([Champ], "masque")`. Masques disponibles (doc officielle
PSM 7.2) : `d`, `dd`, `ddd`, `dddd`, `m`, `mm`, `mmm`, `mmmm`, `yy` (et
combinaisons, ex. `"dd/mm/yyyy"`, `"dd mmmm yyyy"`, `"dddd dd mmmm yyyy"`).

Nécessite `<Formatting>0</Formatting>` sur la variable alias (prouvé en
Phase 0, cf. §2.1). **Rendu français validé** : avec `Locale_ID` 1036
(valeur déjà émise par défaut), les noms de mois et de jours sortent en
français — ex. « vendredi 01 mai 2026 ».

> **CONTRAINTE BLOQUANTE** : `DATE()` exige une valeur d'entrée au format
> **`YYYYMMDD`** (AAAAMMJJ). La **normalisation des colonnes dates en
> AAAAMMJJ se fait à l'import des bases** clients — c'est un **chantier
> connexe à spécifier séparément** (module d'import des bases, hors du
> présent document). Le Lot 2 (§5) ne démarre pas tant que cette
> normalisation n'est pas en place.

### 2.4 Entier / Monétaire — ABANDONNÉ

PSM 7.2 ne propose **aucune fonction d'expression** de formatage numérique
(séparateur de milliers, symbole monétaire). Liste officielle des fonctions
numériques vérifiée : `ABS`, `DIV`, `INT`, `MOD`, `ROUND`, `SGN`, `VAL`,
`STR` uniquement. Le seul vecteur aurait été le volet Propriétés, exclu
(§2.1). → **Hors périmètre** (cf. §6).

---

## 3. Architecture cible

Tous les noms de fichiers, procédures et lignes ci-dessous ont été vérifiés
dans le code au 10/06/2026.

### 3.1 Transmission du type fin aux champs de base

Aujourd'hui les champs des bases clients arrivent au Designer **aplatis** :
`IMG` si image, `TXT` pour tout le reste — alors que le type fin
(`structBaseChamp.Type`, alimenté via `Partage.CalculeTaaBaseChamp()`) existe
en amont (codes `DAT`, `ENT`, `MON`, etc. — correspondance officielle dans
`cpDesigner/procédure RemplirDesignerTypesDisponibles.txt` et
`docs/Structure Webdev Designer V3.md` §correspondances).

**Lever l'aplatissement dans les 3 sites** (passer `stChamp.Type` converti en
code Designer au lieu du `"TXT"` forfaitaire) :

| Site | Fichier | Lignes actuelles |
|---|---|---|
| 1 | `webdev/cpDesigner/procédure RemplirDesignerChampsFusion.txt` | 21-26 |
| 2 | `webdev/pgeLtrContenu/procédure SelectionModèle.txt` | ~755-759 |
| 3 | `webdev/pgeLtrContenu/Code bouton btnDocumentPersonnaliser.txt` | ~647-651 |

Risque côté Designer JS : faible — `script.js` ne teste que les codes `'SYS'`
et `'IMG'` (lignes 4376, 4459, 5265, 22379, 22493) ; tout autre code est
traité comme champ texte insérable, et la modale « Ajouter un champ » connaît
déjà l'ensemble des codes via `typesDisponibles`.

**Rétrocompatibilité** : les JSON stockés où `type = "TXT"` restent valides —
`TXT` = seules les options de **casse** sont proposées ; un champ date
historiquement stocké en `TXT` n'offre pas les masques de date tant qu'il n'a
pas été rechargé avec son type fin (les champs injectés par base sont
volatils — `injecteParBase="1"` — donc recalculés à chaque ouverture).
Aucune migration de données.

### 3.2 Stockage du format : attribut sur l'embed Quill `merge-tag`

- Blot concerné : `MergeTagBlot` (`script.js` lignes 2092-2123),
  enregistré sous `blotName = 'merge-tag'`, rendu `span.merge-tag-quill`.
- Valeur d'embed étendue : `{ key }` → **`{ key, format }`** ; reflet DOM
  dans un attribut **`data-format`** (à côté du `data-key` existant, source
  de vérité de la clé).
- **Persistance automatique** via `structDesignerZoneTexte.quillDelta`
  (chaîne JSON sérialisée — cf. `docs/Structure Webdev Designer V3.md`,
  section zones texte) : **aucune structure WLangage à modifier**, le détail
  des ops est opaque pour WebDev.
- **Absence d'attribut `format` = pas de format** (comportement actuel) :
  les quillDelta existants restent valides sans migration.
- Valeurs de `format` (proposition à figer en implémentation) :
  `"MAJ"` | `"MIN"` | `"PRO"` pour la casse ; `"DATE:<masque>"` pour les
  dates (ex. `"DATE:dd mmmm yyyy"`).

### 3.3 Pipeline PSMD : clés suffixées + variables alias

Rappel du fonctionnement actuel (vérifié) :

- `deltaToRtf()` (`script.js` ~26349-26355) sérialise chaque embed en
  `@KEY@` dans `contenuRtf` ;
- `psmd-generator.js` ne lit **ni** `quillDelta` **ni** `champsFusion` : il
  extrait les marqueurs du RTF (`extractMergeFields()`, regex
  `/@([A-Za-z0-9_ ]+)@/g`, ligne 444) et émet **une variable par nom
  unique** (`generatePsmdVariables()`, ligne 1514) + un `<data_field>` par
  nom (`generatePsmdDataField()`, ligne 1292) ;
- le PSMD déclare `<markers begin="@" end="@"/>` (ligne 1186) : PrintShop
  résout `@X@` par **nom de variable**, et la variable pointe la colonne
  via son expression `[X]`.

**Cible** :

1. **Clé suffixée dans le RTF** : un embed formaté est sérialisé
   `@Nom__MAJ@` (suffixes proposés : `__MAJ`, `__MIN`, `__PRO`,
   `__DATE<n>` pour les masques — le suffixe ne contient que `[A-Za-z0-9_]`
   pour rester compatible avec la regex d'extraction du générateur).
   L'embed Designer conserve la **clé propre** dans `data-key` ; le suffixe
   n'apparaît qu'à la sérialisation RTF. Le re-parse RTF → ops
   (`MERGE_TAG_RE = /@([^@\n]+)@/g`, `script.js` ligne 26165) doit
   **redécouper** `Nom__MAJ` en `{ key: "Nom", format: "MAJ" }`.
2. **Variables alias** dans `generatePsmdVariables()` : pour chaque marqueur
   suffixé, émettre une variable `Nom__MAJ` dont l'expression enveloppe la
   colonne réelle :
   - `UPPER([Nom])` / `LOWER([Nom])` / `PROPER([Nom])` — `<Formatting>`
     inchangé (`3`) ;
   - `DATE([DateLivraison], "dd mmmm yyyy")` — **`<Formatting>0</Formatting>`**
     (contrat Phase 0, cf. §2.1). Tous les autres éléments de `<variable>`
     restent identiques à la sortie actuelle de `generatePsmdVariable()`.
3. **`data_field` sur la colonne réelle uniquement** : adapter la collecte
   `allMergeFields` (`psmd-generator.js` lignes 2534-2580) pour **mapper
   alias → colonne** (un marqueur `@Nom__MAJ@` produit le data_field `Nom`,
   jamais `Nom__MAJ`), sans doublon si la colonne est aussi utilisée sans
   format.
4. **Substitutions `LOCAL_xxx`** : étendre les motifs string de
   `webdev/cpDesigner/procédure GenererPsmdServeurDocument.txt`
   (commentaire lignes 72-81) pour couvrir les clés suffixées :
   `"@LOCAL_xxx__MAJ@" → "@Champ3__MAJ@"`. Le motif b
   (`"key":"LOCAL_xxx"`) reste inchangé puisque l'embed garde la clé propre.

### 3.4 UI : clic droit / double-clic sur la pastille

- **Aucun handler n'existe aujourd'hui** sur les embeds `span.merge-tag-quill`
  dans l'éditeur (les handlers `dblclick`/crayon/poubelle de `script.js`
  ~5441-5479 concernent les chips de la **popup** « Champs de fusion », pas
  l'éditeur Quill).
- L'embed est `contenteditable=false` et son CSS (`style.css` ~4111) ne
  bloque pas les événements pointeur → délégation possible sur `quill.root` :
  `contextmenu` (avec `preventDefault`, voie privilégiée) et/ou `dblclick`,
  cible résolue par `e.target.closest('.merge-tag-quill')`.
- Résolution du champ et de son type : `data-key` → `findChampByKey()`
  (`script.js` ligne 4411) → `champ.type` → **popup de format** n'affichant
  que les options du type (`TXT`/chaînes : casse ; `DAT` : masques de date).
- Point d'attention : `refreshMergeTagsInAllZones()` (`script.js` ligne
  15266) réécrit le `textContent` des pastilles → l'indicateur visuel de
  format (badge, cf. §3.5) doit y être intégré pour survivre aux refresh.

### 3.5 Aperçu écran et hors aperçu

- **Mode aperçu (`donneesApercu`)** : point de substitution unique
  `createMergedDelta()` (`script.js` lignes 15642-15710) — appliquer le
  format à la valeur substituée :
  - casse : `toUpperCase()` / `toLowerCase()` / casse « Nom propre »
    (capitalisation de la 1re lettre de chaque mot, gestion des tirets et
    apostrophes à préciser en implémentation pour coller au `PROPER` de PSM) ;
  - dates : entrée **AAAAMMJJ** (garantie par le chantier connexe
    d'import, §2.3) → rendu du masque via tables de mois / jours FR
    (`mmmm` → janvier…, `dddd` → lundi…). Si la valeur n'est pas un
    AAAAMMJJ valide : affichage brut sans format (pas d'erreur bloquante).
  - même logique dans `replaceMergeFields()` (rétrocompatibilité des
    contenus texte brut pré-blot).
- **Hors aperçu** (mode placeholder) : la pastille continue d'afficher le
  libellé du champ (résolveur `setMergeTagDisplayResolver`, `script.js`
  ligne 1906, configuré ~27633) **complété d'un badge** indiquant le format
  actif (ex. « ↑ », « ↓ », « Aa », « 📅 masque » — design à préciser).

---

## 4. Concordance écran / print — règle d'or

PrintShop Mail (via le PSMD) **fait foi** : le BAT est produit par PSM
lui-même. L'aperçu JS du Designer doit **mimer** le rendu des fonctions
`UPPER`/`LOWER`/`PROPER`/`DATE` de PSM 7.2, pas l'inverse. Tout écart
constaté en Phase 0 ou en recette se résout en alignant le JS sur PSM.

---

## 5. Lots

### Phase 0 — Test bloquant — ✅ VALIDÉE le 10/06/2026

Test réalisé par le responsable de production sur PrintShop Mail 7
(fichier `Test_formatage_des_champs`). **Résultats — contrat prouvé** :

- **Grammaire** : la section `<variable>` du PSMD de test est **identique**
  à la sortie de `generatePsmdVariable()` — seuls `<expression>` et
  `<Formatting>` sont à paramétrer, tout le reste est inchangé.
- **Casse** : expressions `UPPER([X])` / `LOWER([X])` / `PROPER([X])`
  acceptées et rendues correctement, avec `<Formatting>3</Formatting>`
  (valeur actuelle, inchangée).
- **Date** : expression `DATE([X], "masque")` acceptée et rendue
  correctement, avec **`<Formatting>0</Formatting>`**.
- **Rendu français OK** : avec `Locale_ID` 1036 (déjà émis par défaut),
  mois et jours sortent en français — ex. « vendredi 01 mai 2026 ».

La voie technique est donc confirmée ; les Lots 1 et 2 peuvent s'appuyer
sur ce contrat sans test PSM supplémentaire.

### Lot 1 — Casse de texte

- Transmission du type fin (3 sites WLangage, §3.1) — nécessaire dès le
  Lot 1 pour distinguer les champs texte des futurs champs date.
- Embed `{ key, format }` + `data-format` (§3.2).
- Popup de format sur `contextmenu`/`dblclick` (§3.4) — options
  Majuscule / Minuscule / Nom propre / Aucun.
- Sérialisation RTF suffixée + variables alias + mapping `data_fields` +
  motifs `LOCAL_xxx` (§3.3).
- Aperçu écran + badge pastille (§3.5).

### Lot 2 — Dates

- **Pré-requis bloquant** : chantier connexe de normalisation **AAAAMMJJ**
  des colonnes dates à l'import des bases (spécification séparée).
- Popup de format : masques de date pour les champs `DAT`.
- Alias `DATE([Champ], "masque")` + rendu aperçu FR (§3.5).

---

## 6. Hors périmètre (V1)

- **Entier / Monétaire** : abandonné (aucune fonction d'expression PSM 7.2,
  cf. §2.4).
- **Volet Propriétés PSM** (catégories Date/Monétaire/Nombre de la variable) :
  exclu (cf. §2.1).
- **Modèles (`pgeLtrDocument`)** : le formatage n'est pas proposé dans le
  tunnel de création/édition de modèles en V1 ; uniquement le tunnel courrier
  (`pgeLtrContenu`). L'extension aux modèles sera étudiée après recette V1.
- Normalisation AAAAMMJJ à l'import des bases : chantier **connexe**,
  spécifié séparément (pré-requis du Lot 2, pas un livrable de ce chantier).

---

## 7. Fichiers impactés (récapitulatif)

| Fichier | Nature de l'impact |
|---|---|
| `webdev/cpDesigner/procédure RemplirDesignerChampsFusion.txt` | Type fin (lignes 21-26) |
| `webdev/pgeLtrContenu/procédure SelectionModèle.txt` | Type fin (~755-759) |
| `webdev/pgeLtrContenu/Code bouton btnDocumentPersonnaliser.txt` | Type fin (~647-651) |
| `script.js` — `MergeTagBlot` (2092-2123) | `{ key, format }` + `data-format` |
| `script.js` — `deltaToRtf` (~26349) / `MERGE_TAG_RE` (26165) | Suffixes `__XXX` aller/retour |
| `script.js` — `createMergedDelta` (15642) / `replaceMergeFields` | Application du format en aperçu |
| `script.js` — `refreshMergeTagsInAllZones` (15266) / résolveur (1906) | Badge de format sur pastille |
| `script.js` — nouvelle popup de format (delegation `quill.root`) | UI contextmenu/dblclick |
| `psmd-generator.js` — `generatePsmdVariables` (1514) / `generatePsmdVariable` (1429) | Variables alias `UPPER`/`LOWER`/`PROPER`/`DATE` + `<Formatting>` 3/0 |
| `psmd-generator.js` — collecte `allMergeFields` (2534-2580) / `generatePsmdDataField` (1292) | Mapping alias → colonne réelle |
| `webdev/cpDesigner/procédure GenererPsmdServeurDocument.txt` | Motifs `@LOCAL_xxx__SUFFIXE@` (72-81) |
| Module d'import des bases (hors workspace Designer) | Chantier connexe AAAAMMJJ (Lot 2) |
