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

### 2.3 Dates — RETENU (pré-requis amont SATISFAIT)

Formats via `DATE([Champ], "masque")`. Masques disponibles (doc officielle
PSM 7.2) : `d`, `dd`, `ddd`, `dddd`, `m`, `mm`, `mmm`, `mmmm`, `yy` (et
combinaisons, ex. `"dd/mm/yyyy"`, `"dd mmmm yyyy"`, `"dddd dd mmmm yyyy"`).

Nécessite `<Formatting>0</Formatting>` sur la variable alias (prouvé en
Phase 0, cf. §2.1). **Rendu français validé** : avec `Locale_ID` 1036
(valeur déjà émise par défaut), les noms de mois et de jours sortent en
français — ex. « vendredi 01 mai 2026 ».

> **PRÉ-REQUIS AAAAMMJJ — ✅ SATISFAIT (constat du 10/06/2026)** : `DATE()`
> exige une valeur d'entrée au format **`YYYYMMDD`** (AAAAMMJJ). Constat
> empirique : les colonnes dates sont **déjà normalisées AAAAMMJJ à
> l'import des bases** — un champ `DAT` inséré sans format affiche
> « 20260501 » brut dans le Designer. Le module d'import est hors de ce
> workspace ; le constat est acté sans vérification du code d'import.
> Le Lot 2 peut démarrer.

#### 2.3.1 Règle « défaut implicite » (décision de pilotage — Option A)

Un champ de type `DAT` ne s'affiche **JAMAIS brut**. Sans format choisi par
l'utilisateur, le masque par défaut **JJ/MM/AAAA** (`dd/mm/yyyy`) s'applique
**d'office**, à l'écran (aperçu) **ET** à l'impression (PSMD) :

- **Aucun attribut `format` n'est stocké pour le défaut** → les documents
  existants contenant des champs date en bénéficient automatiquement,
  **sans migration**.
- Pour les champs `DAT`, la popup ne propose **pas** d'option « Aucun » :
  elle propose les masques, le défaut étant JJ/MM/AAAA (coché si aucun
  format stocké).
- Conséquence de conception : le défaut implicite est appliqué **à la
  sérialisation** (cf. §3.3) — `psmd-generator.js` reste agnostique.

#### 2.3.2 Masques proposés dans la popup (besoin production — étendu à 6 masques en recette du 10/06/2026)

| Option utilisateur | Masque PSM | Suffixe | Exemple attendu | Statut |
|---|---|---|---|---|
| JJ/MM/AAAA | `dd/mm/yyyy` | `__DATE1` | 10/12/2026 | **DÉFAUT** (jamais stocké sur l'embed) |
| JJ Mois AAAA | `dd mmmm yyyy` | `__DATE2` | 10 décembre 2026 | stocké `"DATE:dd mmmm yyyy"` |
| JJ Mois abrégé AAAA | `dd mmm yyyy` | `__DATE3` | 10 déc. 2026 | stocké `"DATE:dd mmm yyyy"` |
| Jour JJ Mois AAAA | `dddd dd mmmm yyyy` | `__DATE4` | mardi 10 décembre 2026 | stocké `"DATE:dddd dd mmmm yyyy"` |
| Jour abrégé JJ Mois AAAA | `ddd dd mmmm yyyy` | `__DATE5` | mar. 10 décembre 2026 | stocké `"DATE:ddd dd mmmm yyyy"` |
| Jour abr. JJ Mois abr. AAAA | `ddd dd mmm yyyy` | `__DATE6` | mar. 10 déc. 2026 | stocké `"DATE:ddd dd mmm yyyy"` |

Les suffixes ne contiennent que `[A-Za-z0-9_]` (compatibilité regex
d'extraction du générateur). La table suffixe ↔ masque est **dupliquée**
dans `script.js` et `psmd-generator.js` (pas de module partagé entre les
deux fichiers — toute évolution doit être reportée des deux côtés).

> **⚠️ À CONFRONTER AU BAT** : les masques abrégés `mmm` / `ddd`
> (`__DATE3`, `__DATE5`, `__DATE6`) n'ont **pas été testés en Phase 0**
> (seuls `dd/mm/yyyy`, `dd mmmm yyyy`, `dddd dd mmmm yyyy` l'ont été).
> Les abréviations FR retenues pour l'aperçu JS (cf. §3.5) devront être
> comparées au rendu réel PSM 7 au BAT, et le JS aligné si écart
> (règle d'or §4 : PSM fait foi).

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
- **Absence d'attribut `format` = pas de format explicite** : les
  quillDelta existants restent valides sans migration. Pour un champ `DAT`,
  l'absence d'attribut = **défaut implicite JJ/MM/AAAA** (§2.3.1), appliqué
  à la sérialisation et à l'aperçu — jamais stocké.
- Valeurs de `format` : `"MAJ"` | `"MIN"` | `"PRO"` pour la casse ;
  `"DATE:<masque>"` pour les dates (ex. `"DATE:dd mmmm yyyy"`), stocké
  **UNIQUEMENT si différent du défaut** JJ/MM/AAAA.

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
   `@Nom__MAJ@` (suffixes : `__MAJ`, `__MIN`, `__PRO`, `__DATE1`,
   `__DATE2`, `__DATE3` — cf. table §2.3.2 ; le suffixe ne contient que
   `[A-Za-z0-9_]` pour rester compatible avec la regex d'extraction du
   générateur). L'embed Designer conserve la **clé propre** dans
   `data-key` ; le suffixe n'apparaît qu'à la sérialisation RTF. Le
   re-parse RTF → ops (`MERGE_TAG_RE = /@([^@\n]+)@/g`, `script.js` ligne
   26165) doit **redécouper** `Nom__MAJ` en `{ key: "Nom", format: "MAJ" }`
   (`__DATE1` re-parse SANS format stocké — c'est le défaut implicite).
   **Défaut implicite dates (§2.3.1)** : appliqué À LA SÉRIALISATION —
   `deltaToRtf` (et le contenu plat) émettent `__DATE1` pour tout embed
   dont le champ résolu (`findChampByKey`) est de type `DAT` sans format
   explicite. Le générateur PSMD reste agnostique (il ne connaît pas les
   types : il ne lit que les marqueurs du RTF).
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
5. **Style des embeds dans le RTF** (correctif de recette du 10/06/2026 —
   lacune historique V2.5, pas une régression des Lots 1/2) : les
   attributs Quill portés par un embed merge-tag (`bold`, `italic`,
   `underline`, `color`) sont traduits en RTF **comme ceux des ops
   texte** — le marqueur est émis dans un **groupe stylé**
   `{\b \ul \cfN @KEY__SUF@}`, conformément à la règle PSM 7 « *le style
   d'une variable dépend du style de son premier délimiteur* » (le `@`
   ouvrant est dans la run stylée ; le marqueur `@...@` reste intact pour
   `extractMergeFields`). En conséquence :
   - la pré-collecte des couleurs de `deltaToRtf` inclut les embeds
     (leur couleur entre dans la `colortbl`) ;
   - le canal plat (`quillDeltaToTextAndFormatage`) annote le `formatage`
     partiel sur la plage du marqueur ;
   - le re-parse RTF → ops (`pushSegmentWithMergeTags`) restitue les
     `attributes` sur l'embed reconstruit (round-trip complet) ;
   - les reconstructions d'embed lors des substitutions de clés
     (`substituteLocalIdsInDelta`, `rewriteZoneReferencesAfterPromotion`)
     recopient `op.attributes`.

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
  que les options du type (`TXT`/chaînes : casse + « Aucun » ; `DAT` : les
  3 masques §2.3.2 **sans** « Aucun », coche sur le masque actif — défaut
  JJ/MM/AAAA si aucun format stocké).
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
  - dates : entrée **AAAAMMJJ** (normalisée à l'import des bases, constat
    §2.3) → rendu du masque via tables de mois / jours FR (`mmmm` →
    janvier…, `dddd` → lundi…), aligné sur le rendu PSM constaté en
    Phase 0 : « vendredi 01 mai 2026 » (minuscules, `dd` sur 2 chiffres).
    Formes abrégées (`mmm` → « janv., févr., mars, avr., mai, juin,
    juil., août, sept., oct., nov., déc. » ; `ddd` → « lun., mar., mer.,
    jeu., ven., sam., dim. ») : **abréviations non testées en Phase 0 —
    à confronter au rendu réel PSM au BAT et à aligner si écart**
    (cf. §2.3.2). Le format effectif d'un embed `DAT` sans format stocké
    est le défaut JJ/MM/AAAA (§2.3.1). Si la valeur n'est pas un AAAAMMJJ
    valide : affichage brut sans format (pas d'erreur bloquante).
  - même logique dans `replaceMergeFields()` (rétrocompatibilité des
    contenus texte brut pré-blot).
- **Hors aperçu** (mode placeholder) : la pastille continue d'afficher le
  libellé du champ (résolveur `setMergeTagDisplayResolver`, `script.js`
  ligne 1906, configuré ~27633) **complété d'un badge** indiquant le format
  actif. Design arrêté en recette du 10/06/2026 :
  - casse : « AB » / « ab » / « Ab » ;
  - date : badge **unique « JMA »**, affiché UNIQUEMENT quand un format
    date explicite (≠ défaut) est posé — le défaut implicite reste sans
    badge ;
  - taille de police **FIXE en pixels** (indépendante du corps de la
    zone : un texte en corps 36+ ne produit plus de badge géant).

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

- **Pré-requis AAAAMMJJ : ✅ satisfait** (constat empirique du 10/06/2026,
  cf. §2.3 — colonnes dates déjà normalisées à l'import des bases).
- Règle « défaut implicite » JJ/MM/AAAA (§2.3.1) : appliquée à la
  sérialisation et à l'aperçu, jamais stockée → rétroactive sur les
  documents existants sans migration.
- Popup de format : les 3 masques §2.3.2 pour les champs `DAT`, sans
  option « Aucun », coche sur le masque actif.
- Sérialisation : suffixes `__DATE1`/`__DATE2`/`__DATE3` (y compris le
  défaut implicite) ; motif a2 de `GenererPsmdServeurDocument` étendu aux
  suffixes dates.
- Alias `DATE([Colonne], "masque")` + `<Formatting>0</Formatting>` (contrat
  Phase 0) ; data_field sur la colonne réelle.
- Aperçu : rendu FR AAAAMMJJ → masque (§3.5) + badge pastille.

---

## 6. Hors périmètre (V1)

- **Entier / Monétaire** : abandonné (aucune fonction d'expression PSM 7.2,
  cf. §2.4).
- **Volet Propriétés PSM** (catégories Date/Monétaire/Nombre de la variable) :
  exclu (cf. §2.1).
- **Modèles (`pgeLtrDocument`)** : le formatage n'est pas proposé dans le
  tunnel de création/édition de modèles en V1 ; uniquement le tunnel courrier
  (`pgeLtrContenu`). L'extension aux modèles sera étudiée après recette V1.
- Normalisation AAAAMMJJ à l'import des bases : **déjà en place** (constat
  du 10/06/2026, cf. §2.3) — le module d'import reste hors de ce chantier
  et de ce workspace.

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
