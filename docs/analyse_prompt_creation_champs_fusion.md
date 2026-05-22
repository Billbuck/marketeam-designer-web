# Analyse du prompt « Création de champs de fusion » + cahier des charges adapté

> ⚠️ **Statut : document d'historique d'analyse.** La spécification finale à
> jour est dans **`cahier_des_charges_creation_champs_fusion.md` (V2.1)**, qui
> intègre les décisions du donneur d'ordre du 11/05/2026 sur les 9 points du
> §4.11 ci-dessous, ainsi qu'une exigence UX complémentaire (rendu de la
> pastille avec le libellé). **Pour coder, se référer à la V2.1.**
>
> Le présent document conserve la trace de la confrontation au code et des 13
> adaptations recommandées, pour mémoire et traçabilité.

> **Document de travail** — synthèse de la confrontation entre le prompt initial
> `prompt-cursor-designer-ajout-champs.md` (rédigé par Claude sans visibilité sur
> le code source) et la réalité du dépôt `Marketeam Designer`.
>
> Périmètre : Designer (HTML/JS, `index.html` + `script.js`), couche WebDev
> (`webdev/cpDesigner/`, `webdev/pgeLtrContenu/`, `webdev/pgeLtrDocument/`,
> `webdev/Webservice/`), doc V3.3 (`docs/Structure Webdev Designer V3.md`).
>
> Auteur : analyse Cursor.
> Statut : V2 (initiale). **Superposée par V2.1** — voir encart ci-dessus.

---

## 1. Ce que j'ai compris du prompt

### Intention métier (ferme, à conserver)

- **Permettre à l'utilisateur de créer des champs de fusion dans le Designer**,
  en plus de ceux reçus de la BDD. Pas de booléen d'activation — la feature est
  **toujours active**.
- 3 cas couverts :
  1. modèle sur base existante,
  2. modèle sans base,
  3. tunnel courrier sans BDD encore importée.
- **Principe directeur** : *unification de format et d'affichage, distinction
  de comportement uniquement basée sur l'état du nom technique*. Pas d'icône
  ni de section qui distingue « champ BDD » vs « champ ajouté », uniquement un
  grisage des actions sur les champs mappés.
- **Le Designer n'attribue jamais de nom technique**. C'est la SaaS qui le
  fait via une « vérification de cohérence » (hors périmètre Designer) lors
  d'un appariement par libellé. Tant que ce n'est pas fait, `champ` reste vide.

### Comportement par état

| État de `champ` (nom tech) | Édition libellé/type | Édition échantillon | Suppression |
|---|---|---|---|
| **Rempli** (mappé BDD) | Non (figé) | Oui | Non |
| **Vide** (créé Designer) | Oui | Oui | Oui (avec confirmation si utilisé) |

### Modale « Ajouter un champ »

- 2 modes au choix (radio ou onglets) :
  - **Standard** : pioche dans la liste reçue par la SaaS, libellé/type imposés,
    nom technique repris tel quel, échantillon optionnel.
  - **Spécifique** : libellé libre + type au choix dans la liste reçue, nom
    technique **vide**, échantillon optionnel.
- Format de l'échantillon adapté au type (Date `JJ/MM/AAAA`, Heure `HH:MM`,
  Monétaire `€`, Image = placeholder visuel sans upload).

### Listes non hardcodées (transmises par la SaaS)

- `champsStandard` (Nom, Prénom, CP, …) — pour le mode « Standard ».
- `typesDisponibles` (TXT/DAT/HEU/INT/MON/IMG, codes définis côté SaaS) —
  pour le mode « Spécifique ».

### Validation libellé

- Accents OK, espaces OK, `-` et `_` OK, caractères spéciaux interdits, unicité
  (insensible à la casse), 35 caractères max (à confirmer).

### Contrats `postMessage`

- Le prompt **suggère** un message entrant `{action:"init", champs:[...],
  champsStandard:[...], typesDisponibles:[...]}` et un sortant
  `{action:"save", champs:[...]}`, mais demande explicitement à **vérifier
  l'existant et adapter**.

---

## 2. Confrontation au code — incohérences à signaler

C'est le bloc le plus important : plusieurs hypothèses du prompt sont
**incompatibles** avec le code actuel. Si on les applique telles quelles, on
casse la persistance, le pipeline PSMD, l'aperçu, l'enveloppe sans fenêtre, etc.

### 2.1 Syntaxe d'insertion : `{{libelle}}` ⇒ FAUX, le code utilise `@NOM@`

Tout le pipeline (front + WebDev + PSMD) repose sans ambiguïté sur
**`@<NOM_TECHNIQUE>@`** :

```js
// script.js ~3236
function replaceMergeFields(text, record) {
    if (!text) return text;
    return text.replace(/@([A-Z0-9_]+)@/gi, (match, fieldName) => {
        return record[fieldName] !== undefined ? record[fieldName] : match;
    });
}

// script.js ~3924 (drag & drop)
e.dataTransfer.setData('text/plain', `@${fieldName}@`);

// script.js ~4404 (insertion)
const tag = `@${fieldNameNbsp}@`; // Syntaxe WebDev avec espaces insécables
```

Et la doc V3.3 le confirme :
`'contenu' … // Texte avec champs de fusion (@NOM@)`.

→ **Décision** : on **garde `@NOM@`**. Adopter `{{libelle}}` casserait :

- `replaceMergeFields` (aperçu fusion),
- `stripChampsFusionBindingsFromDocumentState` (mode `ChampsFusionInterdit`),
- les compteurs/estimations QR (`countMergeFields`, `estimateQrDataLength`,
  `calculateQrMinSizeMm`),
- la liaison `zonesImage.source.champFusion` / `zonesCodeBarres.champFusion`,
- `psmd_cli.js` et la chaîne PSMD côté serveur.

### 2.2 Modèle de données : `(libelle, champ, type, echantillon)` ⇒ inadapté

Le code et la doc V3.3 utilisent :

```wlangage
structDesignerChampFusion est une Structure
    'nom'      est une chaîne <sérialise = "nom">      // Nom du champ (ex: "NOM", "PRENOM")
    'type'     est une chaîne <sérialise = "type">     // Type : "TXT", "IMG", "SYS"
    'libelle'  est une chaîne <sérialise = "libelle">  // Libellé du champ
    'ordre'    est un entier  <sérialise = "ordre">    // Ordre d'affichage
fin
```

Et l'échantillon est dans une **structure parallèle** `donneesApercu`, qui
peut contenir **plusieurs lignes** (et pas une seule valeur unique par champ) :

```wlangage
structDesignerChamp est une Structure
    'nom'     est une chaîne <sérialise = "nom">
    'valeur'  est une chaîne <sérialise = "valeur">
fin

structDesignerEnregistrement est une Structure
    'Enregistrement' est un tableau <sérialise = "enregistrement"> de structDesignerChamp
fin
```

Conséquences :

- La propriété s'appelle **`nom`**, pas `champ`. Renommer côté Designer
  casserait `convertDonneesApercuFromWebDev`, `champ.nom` (utilisé dans
  `updateMergeFieldsUI`, `uploadZipToWebservice`, etc.) et le contrat WebDev.
- Il n'y a **pas de `echantillon` sur le champ** : il y a N enregistrements
  (souvent 5 ou 10) que l'utilisateur peut faire défiler avec la nav d'aperçu.
- L'**`ordre`** existe et conditionne le tri d'affichage.

### 2.3 Pas de clé pour les échantillons des champs non mappés

Si un champ a `nom = ""`, on ne peut plus l'indexer dans
`donneesApercu[i].enregistrement[j].nom`. **Ce point n'est pas traité par le
prompt** et il est bloquant.

### 2.4 Le contenu inséré est une clé technique — donc renommer le libellé n'a pas à propager dans le document

Le prompt §6.5 dit : « *si l'utilisateur modifie le libellé d'un champ non
mappé, tous les marqueurs `{{ancien libellé}}` doivent être mis à jour
automatiquement* ».

→ Comme on garde `@NOM@` (et non `{{libelle}}`), **le renommage du libellé
n'a aucun impact sur le document**. C'est une simplification importante
(et plus sûre — pas de risque de re-substitution lors du mapping SaaS).
Cette section doit être **supprimée** ou reformulée.

### 2.5 Mode `ChampsFusionInterdit` à respecter

Hérité de l'enveloppe sans fenêtre + documents intérieurs :
`ComposerJsonDesignerCreation` envoie `ChampsFusionInterdit = Vrai`, et le
Designer cache toute la toolbar Data + nettoie les liaisons :

```js
// script.js ~3979
if (champsFusionInterdit) {
    toolbarData.style.display = 'none';
    return;
}
```

→ **Le bouton « Ajouter un champ » doit aussi être désactivé** dans ce mode
(sinon on créerait des champs qui ne servent à rien).

### 2.6 Fichiers / fonctions cités par le prompt qui n'existent pas dans le repo

| Référence du prompt | Réalité |
|---|---|
| `upload-bdd.js v3.1.0` | **Aucun fichier** `upload-bdd.js` dans le repo. Il y a `webdev-bridge.js` (pattern NSPCS) et un upload ZIP via `uploadZipToWebservice` (`script.js` ~6405). À clarifier avec le donneur d'ordre. |
| `Partage.ClassHtmlTypeOperation()` | **Aucune occurrence** dans `webdev/Partage/`. Soit la procédure n'a pas été exportée, soit le nom est approximatif. À demander confirmation. |
| `gsJsonRecu`, `ServeurTraiterMessageDesigner()` | **OK existent** (`pgeLtrContenu/procédure ServeurTraiterMessageDesigner() page pgeLtrContenu.txt`). |
| `pgeLtrContenu` | **OK existe**. |

### 2.7 Contrat `postMessage` : pas de message dédié, on enrichit l'existant

- **Entrant** : aujourd'hui le Designer reçoit `{action:"load", auth, bases,
  constraints, limites, policesDisponibles, Theme, mode?, ZonePersonnalisation?,
  ChampsFusionInterdit?, data:{ ..., champsFusion, donneesApercu, ... }}`.
  Pas de `{action:"init"}`. → Il faut juste **ajouter `champsStandard` et
  `typesDisponibles`** à la racine (au niveau de `policesDisponibles`).
- **Sortant** : aujourd'hui c'est `{action:"validated", success:true,
  data:<exportToWebDev()>}` avec `data.champsFusion` et `data.donneesApercu`
  à l'intérieur. Pas de `{action:"save"}`. → Il faut juste **enrichir
  `data.champsFusion`** (avec `nom` vide pour les non-mappés), et
  `ServeurTraiterMessageDesigner` côté SaaS détecte la présence d'au moins
  un `nom = ""` pour proposer une vérification.

### 2.8 Mode template (`ComposerJsonDesignerModele`)

Aujourd'hui ce mode envoie quand même `champsFusion` et `donneesApercu`
calculés depuis `pTaaBaseChamp` (champs standards par défaut). Pour le cas
« modèle sans base », il faut soit :

- envoyer `champsFusion = []` au load et laisser l'utilisateur peupler via
  la modale (cohérent avec le prompt) ;
- ou continuer à charger une base « défaut » client.

À acter avec le donneur d'ordre.

### 2.9 Validation du libellé : à compléter

- Cohérence souhaitable avec la limite réelle BDD côté `champsFusion` SaaS
  (probablement 50 ou 100 caractères côté MariaDB) — la valeur 35 du prompt
  est marquée « à confirmer ».
- L'unicité doit aussi alerter si le libellé saisi correspond à un libellé
  d'un champ standard non encore inséré → proposer « ajouter le standard à
  la place » plutôt qu'un doublon non mappable.

### 2.10 Zones image / barcode liées à un champ non mappé

`zonesImage.source.champFusion` et `zonesCodeBarres.champFusion` portent
**le nom technique**. Tant que `nom = ""`, on ne peut pas générer le PSMD
avec une vraie source. Le prompt n'aborde pas ce point.

→ **Décision recommandée** : interdire de lier une zone image/barcode à un
champ non mappé tant que la SaaS n'a pas attribué le `nom` technique.
Tooltip « Ce champ doit d'abord être associé à la base via la vérification
de cohérence ».

---

## 3. Adaptations recommandées (avec justification)

| # | Adaptation | Justification |
|---|---|---|
| **A1** | **Garder la syntaxe `@NOM@`** dans le contenu inséré, **pas `{{libelle}}`** | Toute la chaîne (Designer JS, `replaceMergeFields`, RTF, PSMD, WebDev `RemplirDesignerApercu`, mode `ChampsFusionInterdit`) en dépend. Changer casserait tout. |
| **A2** | **Garder `champsFusion[]` au format actuel `{nom, libelle, type, ordre}`** | Compatible doc V3.3 + `convertDonneesApercuFromWebDev` + WebDev. La propriété `nom` joue le rôle du `champ` du prompt — elle peut simplement être **vide** pour les non-mappés. |
| **A3** | **Introduire un identifiant local stable `localId` (UUID Designer)** sur chaque champ créé non mappé | Sert de **clé de substitution à `nom`** : (a) dans le contenu Quill on insère `@LOCAL_xxxxxx@` au lieu de `@@`, (b) dans `donneesApercu[i].enregistrement[j].nom` la valeur d'échantillon est rangée sous cette clé locale, (c) à la ré-ouverture après mapping SaaS, le champ revient avec `nom` rempli + `localId` conservé : on substitue `@LOCAL_xxxxxx@` → `@NOM@` partout (contenu Quill, RTF, `zonesImage.source.champFusion`, `zonesCodeBarres.champFusion`). Et la SaaS doit **renvoyer le `localId` reçu au save** dans le `load` suivant pour permettre le rapprochement. Transparent pour l'utilisateur. |
| **A4** | **Stocker l'échantillon par-défaut sur le champ lui-même** (`echantillonDefaut`), en plus du remplissage de la 1ʳᵉ ligne de `donneesApercu` | Le prompt parle « d'un échantillon » optionnel ; le code attend un tableau d'enregistrements. Compromis : (a) extension de `structDesignerChampFusion` avec `echantillonDefaut` (pour les champs créés dans le Designer), (b) propagation automatique de cette valeur dans toutes les lignes de `donneesApercu` au save. Préserve la nav d'aperçu actuelle. |
| **A5** | **Pas de propagation au renommage** du libellé (suppression du §6.5 du prompt) | Conséquence directe de A1 + A3 : le libellé n'apparaît jamais dans le contenu, donc aucun marqueur à mettre à jour. C'est une *simplification gratuite*, à présenter explicitement. |
| **A6** | **Désactiver « Ajouter un champ » si `ChampsFusionInterdit = Vrai`** | Cohérent avec le masquage actuel de la toolbar Data, et avec le sens métier (document intérieur sans fenêtre = pas de fusion). |
| **A7** | **Interdire la liaison d'une zone image/barcode à un champ non mappé** | Sinon le PSMD n'a pas de clé pour aller chercher la valeur. Tooltip explicatif. Levable automatiquement après mapping SaaS. |
| **A8** | **Enrichir le `load` existant**, pas un nouveau `{action:"init"}` | À la racine du `load` (à côté de `policesDisponibles`) : `champsStandard` et `typesDisponibles`. Côté SaaS : 2 nouvelles procs `RemplirDesignerChampsStandard()` et `RemplirDesignerTypesDisponibles()` appelées dans `ComposerJsonDesignerCreation` et `…Modele`. Contrat sortant inchangé : `data.champsFusion` (avec `nom` vide pour les non-mappés) + `data.donneesApercu` (avec clés locales `LOCAL_xxx` pour les non-mappés). |
| **A9** | **Mettre à jour `docs/Structure Webdev Designer V3.md`** avec les nouvelles structures `structDesignerChampStandard`, `structDesignerTypeChamp`, et l'extension `structDesignerChampFusion.echantillonDefaut` + `structDesignerChampFusion.localId` + `structDesignerLoad.champsStandard` + `structDesignerLoad.typesDisponibles` | La doc V3.3 est aujourd'hui le contrat de référence avec WebDev. À garder à jour. |
| **A10** | **Réutiliser le pattern `modal-overlay`/`modal-box`** déjà présent dans `index.html` (cf. `confirmation-modal`, `template-limits-modal`, `collection-name-modal`) pour la nouvelle modale de création/édition | Cohérence visuelle, code CSS déjà disponible. |
| **A11** | **Ajouter les actions (édition / suppression) directement dans `.merge-tag`** | Évite une popup tierce. Icônes Material visibles toujours, désactivées (opacity + tooltip) sur les champs mappés. |
| **A12** | **Demander confirmation au donneur d'ordre** sur : `upload-bdd.js`, `Partage.ClassHtmlTypeOperation()`, longueur max libellé, comportement `ComposerJsonDesignerModele` quand « sans base », code/libellé exact des types `DAT`/`HEU`/`INT`/`MON` (le code n'utilise aujourd'hui que `TXT`/`IMG`/`SYS`) | Évite de partir sur des hypothèses fausses. |
| **A13** | **Champs standard insérés deviennent immédiatement « mappés »** (nom technique repris tel quel = mappage déjà fait par la liste standard) | Cohérent avec l'intention du prompt : libellé/type figés dès l'ajout. |

---

## 4. Cahier des charges adapté (V2)

> Version révisée, prête à validation. Reprend les intentions métier du prompt
> et y intègre les adaptations techniques. Les changements significatifs vs
> prompt initial sont signalés en **gras**.

### 4.0 Préambule

Cahier des charges révisé après confrontation au code réel du Designer
(`script.js`, `index.html`), à la doc V3.3 (`docs/Structure Webdev Designer V3.md`)
et aux procédures WebDev (`webdev/cpDesigner/`, `webdev/pgeLtrContenu/`). Les
choix techniques sont alignés avec l'existant ; les intentions métier sont
conservées.

### 4.1 Contexte

Inchangé par rapport au prompt initial. Pour rappel : iframe HTML/JS pur,
communication `postMessage` avec WebDev, popup « Champs de fusion » déjà
présente (`#toolbar-data` / `#merge-fields-list`), drag-and-drop d'insertion
existant.

### 4.2 Objectif

Permettre à l'utilisateur de créer des champs de fusion supplémentaires depuis
le Designer, dans tous les flux : modèle sur base existante, modèle sans base,
tunnel courrier sans BDD encore importée. **Désactivé** dans le mode
`ChampsFusionInterdit = Vrai` (cohérence avec l'enveloppe sans fenêtre /
documents intérieurs).

### 4.3 Principe directeur

Inchangé : unification de format/affichage, distinction de comportement basée
uniquement sur l'**état du nom technique `nom`** :

- `nom` rempli → champ mappé (BDD ou standard) → libellé/type figés,
  suppression interdite, échantillon modifiable.
- `nom` vide → champ créé dans le Designer non encore mappé →
  libellé/type/échantillon modifiables, suppression autorisée.

L'attribution du `nom` reste **exclusivement à la charge de la SaaS**
(vérification de cohérence côté plateforme).

### 4.4 Modèle de données

**Adapté à l'existant** (cf. `structDesignerChampFusion` doc V3.3 + script.js) :

| Propriété | Description | Évolution |
|---|---|---|
| `nom` | Nom technique BDD (ex: `NOM`, `PRENOM`, `Champ7`). **Vide** pour un champ créé non mappé. | Existante ; autoriser la valeur vide |
| `libelle` | Texte affiché à l'utilisateur | Existante |
| `type` | Code du type (`TXT`, `IMG`, `SYS`, et ajouts éventuels `DAT`, `HEU`, `INT`, `MON`) | Existante ; vérifier les nouveaux codes côté WebDev |
| `ordre` | Ordre d'affichage | Existante |
| **`localId`** *(nouveau)* | UUID stable attribué par le Designer aux champs créés non mappés. Utilisé comme clé de substitution dans le contenu (`@LOCAL_xxx@`) et dans `donneesApercu`. | **Nouvelle propriété** ; renvoyée dans le save et reçue inchangée dans le load suivant |
| **`echantillonDefaut`** *(nouveau, optionnel)* | Valeur d'exemple par défaut pour le champ. Utilisée pour pré-remplir `donneesApercu` côté Designer. | **Nouvelle propriété** |

**Insertion dans le document — décision majeure vs prompt initial** :
La syntaxe insérée est **`@<clé>@`** où `<clé>` est :

- `nom` (nom technique) si le champ est mappé,
- `LOCAL_<localId>` si le champ n'est pas encore mappé.

→ **Aucune propagation au renommage de libellé** (le libellé n'apparaît pas
dans le contenu). Le §6.5 du prompt initial est donc supprimé.

**Substitution post-mapping** : à la ré-ouverture, pour chaque champ dont
`localId` correspond à une entrée précédemment vide et dont `nom` est désormais
rempli, le Designer remplace en cascade dans :

- contenus Quill / RTF de toutes les zones texte,
- `zonesImage.source.champFusion`,
- `zonesCodeBarres.champFusion`,
- `qrConfig.fields[*]`,

les occurrences `@LOCAL_<localId>@` → `@<nom>@`.

### 4.5 Listes transmises par la SaaS

À la **racine du message `load` existant** (au niveau de `policesDisponibles`,
et non dans `data`) :

```json
"champsStandard": [
  { "nom": "NOM", "libelle": "Nom", "type": "TXT" },
  { "nom": "PRENOM", "libelle": "Prénom", "type": "TXT" },
  { "nom": "CP", "libelle": "Code postal", "type": "TXT" }
],
"typesDisponibles": [
  { "code": "TXT", "libelle": "Texte" },
  { "code": "DAT", "libelle": "Date" },
  { "code": "HEU", "libelle": "Heure" },
  { "code": "INT", "libelle": "Entier" },
  { "code": "MON", "libelle": "Monétaire" },
  { "code": "IMG", "libelle": "Image" }
]
```

Côté WebDev : 2 nouvelles procédures à ajouter dans `webdev/cpDesigner/`,
appelées par `ComposerJsonDesignerCreation` ET `ComposerJsonDesignerModele` :

- `RemplirDesignerChampsStandard(pIdClient)` → `tableau de structDesignerChampStandard`
- `RemplirDesignerTypesDisponibles()` → `tableau de structDesignerTypeChamp`

### 4.6 Spécifications fonctionnelles

#### 4.6.1 Bouton « Ajouter un champ »

Ajouter en **haut du panneau `#toolbar-data` / `.toolbar-content-data`**,
juste au-dessus de `.fields-list`. Style cohérent avec le thème dynamique
(variables CSS `--theme-primary`).
**Désactivé visuellement (grisé + tooltip) si `champsFusionInterdit === true`**.

#### 4.6.2 Modale de création de champ

Réutiliser le pattern existant `modal-overlay` + `modal-box` (ex.
`confirmation-modal`, `template-limits-modal`).
**UX recommandée** : 2 onglets (`Standard` / `Spécifique`) — plus lisible et
plus extensible que des radios.

##### Mode A — Standard

- Liste cliquable (puis combo si ≥ 10 entrées) des `champsStandard` reçus,
  filtrable par recherche.
- Sélection → libellé/type/`nom` (technique) imposés depuis l'entrée standard.
- Champ optionnel : valeur d'échantillon, format adapté au type.

##### Mode B — Spécifique

- Saisie libre du libellé (validation §4.6.4).
- Combo des types depuis `typesDisponibles` (obligatoire).
- `nom` technique reste vide ; `localId` généré à la confirmation.
- Champ optionnel : valeur d'échantillon, format adapté au type.

##### Format de la valeur d'échantillon par type

*(inchangé vs prompt — **à valider** que les codes `DAT`/`HEU`/`INT`/`MON`
sont bien définis côté SaaS, le code Designer ne connaît aujourd'hui que
`TXT`/`IMG`/`SYS`)*

| Type | Format saisi / affiché |
|---|---|
| Texte / autres types textuels | Libre |
| Date | `JJ/MM/AAAA` (format français) |
| Heure | `HH:MM` |
| Entier | Numérique |
| Monétaire | Numérique avec symbole `€` (ex: `1 250,00 €`) |
| Image | **Placeholder** — pas d'upload, simple représentation visuelle |

#### 4.6.3 Édition d'un champ existant

Action déclenchée depuis l'icône crayon dans `.merge-tag` (cf. §4.6.7).

- **Champ non mappé** (`nom` vide) : libellé, type, échantillon modifiables.
- **Champ mappé** (`nom` rempli) : seul l'échantillon est modifiable.
  Libellé/type **désactivés** dans la modale, avec tooltip « Champ associé à
  la base de données ».

#### 4.6.4 Validation du libellé

| Règle | Valeur |
|---|---|
| Accents | Autorisés |
| Espaces | Autorisés |
| Caractères spéciaux | Interdits sauf `-` et `_` |
| Regex recommandée | `/^[\p{L}\p{N} _\-]+$/u` |
| Unicité | Insensible à la casse, sur l'ensemble des `libelle` du modèle |
| Unicité vs standards | **Si le libellé saisi correspond à un libellé d'un `champsStandard` non encore inséré, proposer « Ajouter le standard à la place » plutôt que créer un doublon non mappable** *(garde-fou ajouté)* |
| Longueur max | **À aligner avec la longueur du libellé en BDD côté SaaS** (35 du prompt à confirmer ; possiblement 50 ou 100) |

#### 4.6.5 Suppression d'un champ

- Champ **non mappé** : suppression autorisée. Si utilisé dans le document
  (parcourir **toutes les pages** via `documentState.pages`, pas seulement la
  courante), demander confirmation explicite et purger les marqueurs
  `@LOCAL_<localId>@` + détacher les zones image/barcode liées.
- Champ **mappé** : icône poubelle désactivée + tooltip.

#### 4.6.6 Zones image / barcode liées à un champ non mappé *(nouveau)*

La sélection d'un champ non mappé comme source d'une zone image
(`source.type = "champ"`) ou barcode (`sourceType = "champ"`) est
**interdite tant que la SaaS n'a pas attribué le `nom` technique**. L'option
correspondante est désactivée dans les combos avec tooltip explicatif. Levée
automatiquement après mapping (le champ a alors un `nom` valide).

#### 4.6.7 UX dans la liste

- Boutons d'action **inline** dans `.merge-tag` (icônes Material 16px) :
  crayon (édition), poubelle (suppression).
- **Aucune** différenciation visuelle entre champs mappés et non mappés
  (badge, couleur, section…).
- Sur les champs mappés : poubelle grisée (opacity 0.4 +
  `pointer-events:none`) avec tooltip ; crayon visible mais ouvre la modale
  en mode lecture-seule pour libellé/type.
- Drag-and-drop et double-clic d'insertion **conservés tels quels**.

### 4.7 Contrats `postMessage`

#### 4.7.1 Architecture — enrichir l'existant, pas créer

- Pas de nouveau message `init`/`save`. On enrichit `{action:"load"}` et
  `{action:"validated"}`.
- Compatible avec `gsJsonRecu` et `ServeurTraiterMessageDesigner()` actuels
  côté `pgeLtrContenu`.
- Compatible avec `webdev-bridge.js` (NSPCS). *(`upload-bdd.js v3.1.0`
  mentionné par le prompt n'a pas été retrouvé dans le repo — à clarifier
  avec le donneur d'ordre.)*

#### 4.7.2 Message entrant `load` (extraits — uniquement les ajouts)

```json
{
  "action": "load",
  "auth": { },
  "bases": { },
  "policesDisponibles": [ ],
  "champsStandard": [
    { "nom": "NOM", "libelle": "Nom", "type": "TXT" }
  ],
  "typesDisponibles": [
    { "code": "TXT", "libelle": "Texte" }
  ],
  "data": {
    "champsFusion": [
      { "nom": "PRENOM", "libelle": "Prénom", "type": "TXT", "ordre": 3 },
      { "nom": "Champ7", "libelle": "Véhicule", "type": "TXT", "ordre": 12, "localId": "LOCAL_a1b2c3" },
      { "nom": "", "libelle": "Couleur préférée", "type": "TXT", "ordre": 13, "localId": "LOCAL_d4e5f6", "echantillonDefaut": "Bleu" }
    ],
    "donneesApercu": [
      { "enregistrement": [
        { "nom": "PRENOM", "valeur": "Jean" },
        { "nom": "Champ7", "valeur": "Cayenne" },
        { "nom": "LOCAL_d4e5f6", "valeur": "Bleu" }
      ] }
    ]
  }
}
```

Notes :

- Le 2ᵉ champ illustre un champ **précédemment non mappé** (`localId` conservé)
  que la SaaS a depuis associé à `Champ7` — le Designer substitue
  `@LOCAL_a1b2c3@` → `@Champ7@` dans tout le contenu à la lecture.
- Les enregistrements d'aperçu pour les champs encore non mappés sont indexés
  par `LOCAL_<localId>`.

#### 4.7.3 Message sortant `validated` (extraits — inchangé sur la forme)

```json
{
  "action": "validated",
  "success": true,
  "data": {
    "champsFusion": [
      { "nom": "PRENOM", "libelle": "Prénom", "type": "TXT", "ordre": 3 },
      { "nom": "Champ7", "libelle": "Véhicule", "type": "TXT", "ordre": 12, "localId": "LOCAL_a1b2c3" },
      { "nom": "", "libelle": "Date de livraison", "type": "DAT", "ordre": 14, "localId": "LOCAL_g7h8i9", "echantillonDefaut": "15/06/2026" }
    ],
    "donneesApercu": [ ]
  }
}
```

Côté SaaS, `ServeurTraiterMessageDesigner` sait qu'au moins un mapping reste à
faire si `data.champsFusion[*].nom = ""`. Aucun signal supplémentaire n'est
envoyé — c'est l'absence de `nom` qui sert de signal.

#### 4.7.4 Compatibilité ascendante

- Si un client SaaS plus ancien n'envoie pas `champsStandard` /
  `typesDisponibles`, la modale reste ouvrable mais le mode « Standard »
  affiche « Aucun champ standard disponible » et le mode « Spécifique »
  utilise une liste de types par défaut hardcodée minimale (`TXT`, `IMG`).
- Si un message ancien arrive avec des `champsFusion` sans `localId` ni
  `echantillonDefaut`, ils sont traités comme aujourd'hui (champs mappés
  classiques).

### 4.8 Mode template (`ComposerJsonDesignerModele`)

**À acter** : pour le cas « modèle sans base » (cas 2 du prompt),
`ComposerJsonDesignerModele` doit-il :

- (a) envoyer `champsFusion = []` et laisser l'utilisateur peupler ?
  **Recommandation** : oui, c'est cohérent avec l'intention du prompt.
- (b) ou continuer à charger les champs de la base « défaut » client ?
  À préciser.

Dans tous les cas : **toujours envoyer `champsStandard` et `typesDisponibles`**
(sinon impossible de créer des champs en mode modèle).

### 4.9 Documentation à mettre à jour

`docs/Structure Webdev Designer V3.md` (V3.4 ?) — ajouts :

- Section 3 : extension de `structDesignerChampFusion` avec `localId` (chaîne)
  et `echantillonDefaut` (chaîne).
- Nouvelle section : `structDesignerChampStandard` (`nom`, `libelle`, `type`).
- Nouvelle section : `structDesignerTypeChamp` (`code`, `libelle`).
- Section 13 (`structDesignerLoad`) : ajouter `champsStandard` et
  `typesDisponibles`.
- Section 13 : préciser que `donneesApercu[i].enregistrement[j].nom` peut
  valoir `LOCAL_<localId>` pour les champs non encore mappés.

### 4.10 Contraintes techniques *(inchangé)*

- HTML/CSS/JS pur, pas de framework.
- Pas de `localStorage`/`sessionStorage` pour les données métier (uniquement
  persistance via `postMessage`). Note : `sessionStorage` est utilisé par
  `script.js` pour `authConfig` — on ne le touche pas.
- Bridge iframe : préserver le pattern `webdev-bridge.js` (NSPCS) actuel.
  **`upload-bdd.js v3.1.0` mentionné par le prompt à clarifier**.
- Robustesse : valider la structure des messages reçus avant traitement
  (déjà en place dans `loadFromWebDev`).

### 4.11 Points à valider avant codage

1. **Syntaxe d'insertion** : confirmation que l'on garde `@NOM@` /
   `@LOCAL_xxx@` (et **pas** `{{libelle}}`) — point bloquant.
2. **Codes des nouveaux types** : `DAT`, `HEU`, `INT`, `MON` existent-ils côté
   SaaS ? Quelle table BDD les définit ?
3. **Longueur max libellé** : valeur réelle BDD côté `champsFusion` SaaS.
4. **Mode template sans base** : `champsFusion = []` ou base client par défaut ?
5. **Existence de `upload-bdd.js v3.1.0`** : ce fichier n'est pas dans le
   repo, est-il dans une autre branche / autre projet ?
6. **Existence de `Partage.ClassHtmlTypeOperation()`** : fonction non trouvée,
   nom approximatif ou non exporté ?
7. **Comportement zones image/barcode liées à un champ non mappé** : interdire
   (recommandation) ou autoriser avec liaison via `localId` (plus complexe
   côté PSMD) ?
8. **UX** : onglets vs radios pour les 2 modes ?
9. **Persistance `localId`** : la BDD côté SaaS doit-elle stocker le `localId`
   à côté du `nom` technique attribué, pour la traçabilité de la première
   association ?

---

## 5. Suite proposée

Une fois ce document validé, options pour la suite :

- **(a)** Trancher les 9 points du §4.11 pour figer la version finale.
- **(b)** Rédiger les 2 procédures WebDev manquantes
  (`RemplirDesignerChampsStandard`, `RemplirDesignerTypesDisponibles`) et la
  mise à jour de `Structure Webdev Designer V3.md` (V3.4).
- **(c)** POC technique côté Designer : enrichissement `loadFromWebDev` /
  `exportToWebDev` + génération `localId` + substitution `@LOCAL_xxx@ → @NOM@`
  à la ré-ouverture.
- **(d)** POC UI côté Designer : bouton « Ajouter un champ » + modale (2
  onglets) + actions inline crayon/poubelle dans `.merge-tag`.
