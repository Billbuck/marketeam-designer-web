# Cahier des charges — Designer : création de champs de fusion (V2.5)

> **Version finale**, autonome, prête à implémentation.
>
> Statut : validée par le donneur d'ordre le 11/05/2026 (V2.1) puis amendée
> l'après-midi du 11/05/2026 (V2.2 — codes types définitifs + 4 précisions de
> relecture). Amendée à nouveau le 19/05/2026 (V2.3 — verrouillage global de
> la gestion des champs + propriété `origine` + pré-remplissage échantillon
> en édition + verrouillage onglet en édition). Amendée le 19/05/2026 PM
> (V2.4 — **changement de doctrine** : critère de verrouillage par origine
> du champ (`"import"` / `"ajout"`) et non plus par `nom` rempli ; algorithme
> unifié de résolution de la valeur d'échantillon ; refonte de la liste
> métier des champs standards). **Couvert par le livrable L6**.
> Amendée le 20/05/2026 (V2.5 — **deuxième changement de doctrine** :
> suppressibilité refondue par **usage fonctionnel** combiné à la **présence
> en base**, et non plus par `origine` ; signalisation visuelle vert/gris/rouge
> dans la popup ; popup d'alerte au désalignement modèle ↔ base ; nouvel
> attribut JSON optionnel `presenteEnBase`). Couvert par le livrable **L11**
> et patches WebDev associés (Structure V3.7, SelectionModèle, btnDocumentPersonnaliser).
>
> Filiation :
>
> - Prompt initial : `prompt-cursor-designer-ajout-champs.md` (rédigé par Claude
>   sans visibilité sur le code source).
> - Analyse + adaptations : `docs/analyse_prompt_creation_champs_fusion.md`
>   (V2 — confrontation au code, 13 adaptations, 9 points à trancher).
> - Décisions du donneur d'ordre du 11/05/2026 (les 9 points + une exigence UX
>   supplémentaire sur le rendu de la pastille).
> - Amendement V2.2 (11/05/2026 PM) : 4 précisions de relecture + liste
>   définitive des 13 codes types WebDev (`TXT`, `ENT`, `DEC`, `MON`, `DAT`,
>   `TIM`, `EML`, `TEL`, `SMS`, `CDP`, `URL`, `IMG`, `ALG`).
> - Amendement V2.3 (19/05/2026) : `docs/amendement-V2.3-cahier-des-charges.md`
>   et `docs/correctifs-L4-cursor.md` — ajout `autoriserGestionChamps`,
>   propriété `origine`, source d'échantillon en édition, verrouillage onglet
>   en édition, 6 bugs L4 (A1–A6), 3 évolutions UX (D1–D3). **Note** :
>   l'amendement §1.3 inversait les noms `ComposerJsonDesignerCreation` /
>   `ComposerJsonDesignerModele` — le présent document utilise les noms
>   conformes au code réel (`Creation` = tunnel courrier, `Modele` = template).
> - Amendement V2.4 (19/05/2026 PM) :
>   `docs/amendement-V2.4-cahier-des-charges.md` et
>   `docs/correctifs-L5-cursor.md` — **changement de doctrine** sur le
>   critère de verrouillage (par origine `"import"`/`"ajout"` et non par
>   `nom` rempli), nouvelle propriété `categorie` (`"standard"`/`"specifique"`,
>   Approche A), algorithme unifié de résolution de la valeur d'échantillon,
>   table de placeholders par type + par champ standard, double-clic onglet
>   Standard, masquage sélection en édition, refonte liste métier
>   `RemplirDesignerChampsStandard` (18 entrées), 6 bugs L5 (A7–A12),
>   6 évolutions UX (D4–D9).
> - Amendement V2.5 (20/05/2026) :
>   `docs/amendement-V2.5-cahier-des-charges.md` — **changement de doctrine
>   sur la suppressibilité** : pilotage par usage fonctionnel (champ
>   exploité ou non dans le document) combiné à la présence du champ
>   dans la base de données (attribut `presenteEnBase` envoyé par la
>   SaaS). L'attribut `origine` (V2.4) reste conservé pour la
>   traçabilité interne (libellé/type figés en édition) mais ne pilote
>   plus la corbeille. Signalisation visuelle vert/gris/rouge dans la
>   popup. Popup d'alerte session-once au désalignement modèle ↔ base.
>   Couvert par le livrable L11 (refonte Designer) et les patches WebDev
>   préalables (Structure V3.7 + SelectionModèle + btnDocumentPersonnaliser).
>
> Le présent document **se suffit à lui-même** pour coder.

---

## 1. Contexte

Le Designer est l'application web (HTML/CSS/JS pur, sans framework) embarquée
en iframe dans le tunnel courrier WebDev de la plateforme SaaS Marketeam. Elle
permet de composer des modèles de documents (lettre, enveloppe à fenêtre, …)
en intégrant des champs de fusion issus d'une base de données.

Communication parent ↔ iframe : `postMessage`, via les actions :

- entrante `{ action: "load", … }` (cf. `structDesignerLoad` doc V3.3),
- sortante `{ action: "validated", success, data }` produite par
  `exportToWebDev()` puis traitée côté SaaS par `gsJsonRecu` /
  `ServeurTraiterMessageDesigner()` (page `pgeLtrContenu`).

État existant côté Designer (à préserver) :

- popup « Champs de fusion » : `#toolbar-data` / `#merge-fields-list` /
  pastilles `.merge-tag` (cf. `index.html` ~3324, `script.js` ~3818).
- mécanisme d'insertion par drag-and-drop et double-clic — texte brut
  `@<NOM_TECHNIQUE>@` injecté dans Quill (cf. `script.js` ~4392 `insertTag`).
- mode `ChampsFusionInterdit = Vrai` qui désactive entièrement la mécanique
  de fusion (toolbar Data masquée, liaisons nettoyées au chargement, cf.
  `script.js` ~3848 et ~23190).
- bridge iframe `webdev-bridge.js` (pattern NSPCS) — à conserver tel quel.

## 2. Objectif

Permettre à l'utilisateur de **créer des champs de fusion supplémentaires
depuis le Designer** dans tous les flux :

1. modèle sur base existante,
2. modèle sans base,
3. tunnel courrier sans BDD encore importée.

Feature **toujours active**, sauf si `ChampsFusionInterdit = Vrai` (alors le
bouton « Ajouter un champ » est désactivé, cohérent avec le masquage actuel
de la toolbar Data).

## 3. Principe directeur

**Unification de format et d'affichage, distinction de comportement basée
sur l'origine du champ** (verrouillage individuel V2.4 — libellé / type),
**modulée par un verrouillage global au niveau du document** (V2.3 —
`autoriserGestionChamps`), **et complétée par une doctrine de
suppressibilité fonctionnelle** (V2.5 — couleur + supprimabilité pilotées
par l'usage du champ dans le document et la présence en base).

**V2.5 — refonte de la suppressibilité.** L'attribut `origine` (`"import"` /
`"ajout"`) ne pilote plus la corbeille. Il reste utilisé pour figer le
libellé et le type côté modale (édition d'un champ importé interdite) mais
n'est plus le critère utilisateur de suppression. La suppression est
désormais pilotée par :

1. La présence du champ dans la base de données sélectionnée
   (attribut JSON `presenteEnBase` envoyé par la SaaS).
2. L'usage du champ dans une zone du document (table interne
   `champsExploites` maintenue par le Designer).

Deux régimes en résultent (cf. §7.5 et §7.9) : régime A (pas de base, ou
mode modèle) et régime B (base associée). La couleur de la bordure gauche
de chaque entrée dans la popup signale ce statut (vert/gris/rouge).

> **Changement de doctrine V2.4** : le critère de verrouillage individuel
> a été modifié — il était basé sur l'état du `nom` technique (rempli =
> verrouillé) jusqu'à V2.3, ce qui posait problème car un champ standard
> ajouté par l'utilisateur via la modale a immédiatement un `nom` rempli
> et devenait donc immédiatement verrouillé : impossible de supprimer un
> champ qu'on venait pourtant d'ajouter. Désormais le critère est
> l'**origine** du champ (`"import"` venant du JSON initial, ou `"ajout"`
> créé par l'utilisateur). Cf. amendement V2.4 §1.

### 3.1 Verrouillage individuel — critère par `origine` (V2.4)

| `origine` | Sémantique | Édition libellé/type | Édition échantillon | Suppression |
|---|---|---|---|---|
| **`"import"`** | Champ présent dans le JSON initial reçu via `postMessage` au chargement (venant d'une base associée à l'opération, ou pré-rempli par la SaaS) | Non (figé) | Oui | Non |
| **`"ajout"`** | Champ ajouté par l'utilisateur via la modale (peu importe onglet Standard ou Spécifique) | Oui | Oui | Oui (avec confirmation si utilisé) |

Cf. §4 pour la propriété `origine` et §1.4 de l'amendement V2.4 pour la
logique d'affectation. À la ré-ouverture d'un document, les champs créés
en `"ajout"` lors d'une session précédente sont reçus avec `origine =
"import"` (ils sont désormais partie intégrante du modèle persisté côté
SaaS) — comportement intentionnel.

> **Champ legacy sans `origine`** : par sécurité, traité comme `"import"`
> (verrouillage par défaut).

### 3.2 Verrouillage global — booléen `autoriserGestionChamps` (V2.3)

Quand `autoriserGestionChamps = Faux` (cf. §5.2), **toute action de gestion
des champs est désactivée** sur l'ensemble du document, indépendamment du
verrouillage individuel : bouton « Ajouter un champ » désactivé, actions
inline crayon/poubelle désactivées sur tous les champs, modale d'ajout/édition
non accessible, **édition de la valeur d'échantillon également bloquée**
(cohérence : la valeur d'échantillon vient de la base elle-même dans ce
contexte).

### 3.3 Règle de combinaison (refondue V2.4)

Le verrouillage global prime sur l'individuel quand il est plus restrictif :

| `origine` du champ | `autoriserGestionChamps = Vrai` | `autoriserGestionChamps = Faux` |
|---|---|---|
| `"import"` | Libellé/type figés, échantillon modifiable, pas de suppression | Tout figé, pas de suppression |
| `"ajout"` | Tout modifiable, suppression autorisée | Tout figé, pas de suppression |

Si `ChampsFusionInterdit = Vrai` → la fusion entière est désactivée,
`autoriserGestionChamps` devient sans effet (pas de conflit possible).

### 3.4 Affichage

**Aucune** différenciation visuelle structurelle (pas de badge, pas de
couleur, pas de section séparée). Distinction perceptible uniquement via la
**désactivation discrète** des actions (état grisé + tooltip) sur les champs
d'origine `"import"` ou en mode `autoriserGestionChamps = Faux`.

## 4. Modèle de données

Aligné sur la doc V3.3 (`structDesignerChampFusion`) avec 2 extensions.

| Propriété | Description | Évolution |
|---|---|---|
| `nom` | Nom technique BDD (ex: `NOM`, `PRENOM`, `Champ7`). **Vide** pour un champ créé non mappé. | Existante ; **autoriser la valeur vide** |
| `libelle` | Texte affiché à l'utilisateur | Existante |
| `type` | Code du type (cf. §5 pour la liste définitive : `TXT`, `ENT`, `DEC`, `MON`, `DAT`, `TIM`, `EML`, `TEL`, `SMS`, `CDP`, `URL`, `IMG`, `ALG`, plus `SYS` réservé aux zones système). | Existante ; valeurs étendues |
| `ordre` | Ordre d'affichage | Existante |
| **`localId`** *(nouveau)* | UUID stable attribué par le Designer aux champs créés non mappés. Sert de clé de substitution dans le contenu (`@LOCAL_<localId>@`) et dans `donneesApercu`. Conservé même après attribution de `nom` (traçabilité). | Nouvelle propriété |
| **`echantillonDefaut`** *(nouveau, optionnel)* | Valeur d'exemple par défaut renseignée à la création/édition. Utilisée pour pré-remplir `donneesApercu` dans toutes les lignes côté Designer. | Nouvelle propriété |
| **`origine`** *(V2.3 introduite, V2.4 sémantique modifiée)* | Origine du champ : `"import"` (présent dans le JSON initial du load — venant d'une base BDD ou pré-rempli par la SaaS) ou `"ajout"` (créé par l'utilisateur via la modale durant la session courante). **Sert au verrouillage individuel** (cf. §3.1). Pour un champ legacy sans `origine` : traité comme `"import"` par sécurité. | Sémantique refondue V2.4 |
| **`categorie`** *(V2.4, nouveau — Approche A retenue)* | Sous-catégorie d'origine : `"standard"` (champ standard du référentiel `champsStandard`) ou `"specifique"` (champ créé librement). **Sert au choix de l'onglet en édition** (cf. §7.3.1) et à terme à d'autres règles métier (ex. style visuel). Renseignée à la création par la modale. Pour les champs legacy sans `categorie` : déduction par recherche dans `champsStandard` (présence → `"standard"`, sinon → `"specifique"`). | Nouvelle propriété |
| **`presenteEnBase`** *(V2.5, nouveau — optionnel)* | Booléen indiquant si le champ correspond à une colonne réelle de la base de données associée à l'opération. **3 états** : `Vrai` (mappé en base), `Faux` (orphelin), **absent du JSON** (régime A — pas de base associée). Calculé côté SaaS par `SelectionModèle.txt` et `btnDocumentPersonnaliser.txt` après construction du `champsFusion` final, par correspondance `nom = taaBaseChamp[*].Champ`. Les champs `SYS` ne portent jamais cet attribut. **Pilote la couleur (vert/gris/rouge) et la suppressibilité** (cf. §7.9 et §7.5). | Nouvelle propriété (cf. Structure WebDev V3.7) |

> **Persistance BDD côté SaaS du `localId`** : décision reportée. Côté
> Designer, le `localId` est **systématiquement** géré (généré, conservé,
> renvoyé au save).
>
> **Persistance BDD côté SaaS de `origine` / `categorie`** : les propriétés
> sont exportées dans `champsFusion[*]` au save. La persistance BDD est
> laissée à l'appréciation de la SaaS (utile pour la traçabilité mais non
> strictement nécessaire — le Designer recompute par heuristique à la
> ré-ouverture si absent).
>
> **Cohérence avec `localId`** :
>
> - Un champ `origine = "ajout"` peut avoir `localId` rempli (créé via
>   onglet Spécifique, sans `nom` technique) ou pas (créé via onglet
>   Standard, avec `nom` technique déjà attribué dès la création).
> - Un champ `origine = "import"` peut aussi avoir `localId` rempli (cas où
>   il a été créé en `"ajout"` lors d'une session précédente, sauvegardé,
>   puis ré-importé avec `origine = "import"` au load suivant — la SaaS
>   préserve `localId` pour traçabilité §4.2).

### 4.1 Syntaxe d'insertion dans le document

**Format technique stocké dans le contenu (Quill / RTF / export / PSMD)** :

- `@<nom>@` si le champ est mappé (`nom` rempli),
- `@LOCAL_<localId>@` si le champ n'est pas encore mappé (`nom` vide).

→ Pas de `{{libelle}}` ni de variation. Le pipeline existant (`replaceMergeFields`,
`countMergeFields`, `estimateQrDataLength`, `stripChampsFusionBindingsFromDocumentState`,
`zonesImage.source.champFusion`, `zonesCodeBarres.champFusion`,
`qrConfig.fields[*]`, `psmd_cli.js`, WebDev `RemplirDesignerApercu`) reste
inchangé sur le format.

> **Format affiché à l'utilisateur** : voir §7.8 (rendu de la pastille).

### 4.2 Substitution post-mapping

À la ré-ouverture, pour chaque champ dont `localId` correspond à une entrée
précédemment vide et dont `nom` est désormais rempli, le Designer remplace en
cascade :

- contenus Quill / RTF de toutes les zones texte de toutes les pages,
- `zonesImage.source.champFusion`,
- `zonesCodeBarres.champFusion`,
- `qrConfig.fields[*]`,

les occurrences `@LOCAL_<localId>@` → `@<nom>@`.

### 4.3 Pas de propagation du renommage de libellé

Conséquence directe de §4.1 : le libellé n'apparaît **jamais** dans le
contenu stocké (uniquement dans le rendu visuel via §7.8). Renommer le
libellé d'un champ non mappé n'a donc **aucun impact** sur le document
(simplification importante par rapport au prompt initial).

## 5. Listes transmises par la SaaS

Ajoutées à la **racine du message `load` existant** (au niveau de
`policesDisponibles`, et **non** dans `data`) :

```json
"champsStandard": [
  { "nom": "Nom",     "libelle": "Nom",         "type": "TXT", "placeholderDefaut": "Dupont" },
  { "nom": "Prenom",  "libelle": "Prénom",      "type": "TXT", "placeholderDefaut": "Jean" },
  { "nom": "CodePostal", "libelle": "Code postal", "type": "CDP", "placeholderDefaut": "75001" }
],
"typesDisponibles": [
  { "code": "TXT", "libelle": "Texte" },
  { "code": "ENT", "libelle": "Entier" },
  { "code": "DEC", "libelle": "Décimal" },
  { "code": "MON", "libelle": "Monétaire" },
  { "code": "DAT", "libelle": "Date" },
  { "code": "TIM", "libelle": "Heure" },
  { "code": "EML", "libelle": "Email" },
  { "code": "TEL", "libelle": "Téléphone" },
  { "code": "SMS", "libelle": "Portable" },
  { "code": "CDP", "libelle": "Code postal" },
  { "code": "URL", "libelle": "URL" },
  { "code": "IMG", "libelle": "Image" },
  { "code": "ALG", "libelle": "Alliage" }
]
```

> **Codes des types — liste définitive (V2.2)** : ces 13 codes correspondent
> aux constantes effectives côté WebDev et doivent être utilisés tels quels
> dans `RemplirDesignerTypesDisponibles()` et partout dans le code Designer.
> Le code `SYS` reste réservé aux zones système injectées par WebDev (adresse
> destinataire, séquentiel, datamatrix, etc.) et n'est pas exposé dans
> `typesDisponibles`.

#### 5.1 Correspondance codes Designer ↔ constantes WebDev

| Code Designer | Libellé affiché | Constante WebDev | Famille |
|---|---|---|---|
| `TXT` | Texte | `__CHAMP_TYPE_TEXTE__` | Chaîne libre |
| `ENT` | Entier | `__CHAMP_TYPE_ENTIER__` | Numérique |
| `DEC` | Décimal | `__CHAMP_TYPE_DECIMAL__` | Numérique |
| `MON` | Monétaire | `__CHAMP_TYPE_MONETAIRE__` | Numérique |
| `DAT` | Date | `__CHAMP_TYPE_DATE__` | Date/heure |
| `TIM` | Heure | `__CHAMP_TYPE_HEURE__` | Date/heure |
| `EML` | Email | `__CHAMP_TYPE_EMAIL__` | Chaîne contrainte |
| `TEL` | Téléphone | `__CHAMP_TYPE_TELEPHONE__` | Chaîne contrainte |
| `SMS` | Portable | `__CHAMP_TYPE_PORTABLE__` | Chaîne contrainte |
| `CDP` | Code postal | `__CHAMP_TYPE_CODEPOSTAL__` | Chaîne contrainte |
| `URL` | URL | `__CHAMP_TYPE_URL__` | Chaîne contrainte |
| `IMG` | Image | `__CHAMP_TYPE_IMAGE__` | Spécial (placeholder visuel) |
| `ALG` | Alliage | `__CHAMP_TYPE_ALLIAGE__` | Chaîne libre métier |

> **Note métier sur `ALG`** : le type Alliage correspond à un code utilisé
> dans le cadre d'un contrat Alliage entre le client et La Poste, pour la
> gestion des plis non distribuables (NPAI — N'habite Pas à l'Adresse
> Indiquée). C'est une chaîne de caractères libre, sans contrainte de format
> particulière.

#### 5.1bis Liste métier des champs standards (V2.4 §2.4)

Refonte complète V2.4 de `RemplirDesignerChampsStandard()` — la liste
précédente (« N° Client », « Logo entreprise », « Photo contact ») était
inadaptée au métier Marketeam. Nouvelle liste de référence (18 entrées),
avec **placeholder par défaut** à transporter dans
`structDesignerChampStandard` (cf. §10) :

| Libellé | Nom technique | Type | Placeholder par défaut |
|---|---|---|---|
| Civilité | `Civilite` | `TXT` | `Monsieur` |
| Nom | `Nom` | `TXT` | `Dupont` |
| Prénom | `Prenom` | `TXT` | `Jean` |
| Société | `Societe` | `TXT` | `Société Exemple SAS` |
| Enseigne | `Enseigne` | `TXT` | `Enseigne Exemple` |
| Contact | `Contact` | `TXT` | `Jean Dupont` |
| Référence | `Reference` | `TXT` | `REF-12345` |
| Adresse 1 | `Adresse1` | `TXT` | `12 rue de l'Exemple` |
| Adresse 2 | `Adresse2` | `TXT` | `Bâtiment A` |
| Adresse 3 | `Adresse3` | `TXT` | `Résidence Les Jardins` |
| Adresse 4 | `Adresse4` | `TXT` | `Appartement 24` |
| Code postal | `CodePostal` | `CDP` | `75001` |
| Ville | `Ville` | `TXT` | `Paris` |
| Pays | `Pays` | `TXT` | `France` |
| Téléphone | `Telephone` | `TEL` | `01.02.03.04.05` |
| Portable | `Portable` | `SMS` | `06.12.34.56.78` |
| Email | `Email` | `EML` | `contact@example.com` |
| Code Alliage | `CodeAlliage` | `TXT` | `ALG001` |

### 5.2 Booléen `autoriserGestionChamps` (V2.3 — racine du load)

Nouveau champ booléen ajouté à la **racine du message `load`** (au même
niveau que `champsStandard` / `typesDisponibles`) :

```json
"autoriserGestionChamps": true
```

#### Sémantique

Autorise (ou non) l'utilisateur à **ajouter, modifier et supprimer** des
champs depuis le Designer. Quand `Faux`, le verrouillage global décrit en
§3.2 et §3.3 s'applique.

#### Valeur par défaut si absent

**`Vrai`** (compatibilité ascendante avec les versions antérieures du contrat
qui n'envoient pas ce flag).

#### Logique de remplissage côté SaaS

> ⚠️ **Note** : l'amendement `amendement-V2.3-cahier-des-charges.md` §1.3
> inversait les rôles des deux procédures. Le tableau ci-dessous utilise les
> noms RÉELS conformes au code (cf. `webdev/cpDesigner/`).

| Contexte d'ouverture | Procédure WebDev RÉELLE | Valeur |
|---|---|---|
| Création/modification d'un modèle de document | `ComposerJsonDesignerModele` (`mode = "template"`) | **`Vrai`** (toujours) |
| Tunnel de commande, **sans** base de données sélectionnée | `ComposerJsonDesignerCreation` | **`Vrai`** + `champsFusion = []` + `donneesApercu = []` (cf. fix bug A1) |
| Tunnel de commande, **avec** base de données sélectionnée | `ComposerJsonDesignerCreation` | **`Faux`** + `champsFusion = champs de la base` (comportement actuel) |

Test côté WebDev pour détecter "avec/sans base" dans `ComposerJsonDesignerCreation` :
à confirmer (probablement `stOperation.tabBase..Occurrence > 0`, à valider
par le donneur d'ordre).

Côté WebDev : 2 nouvelles procédures à ajouter dans `webdev/cpDesigner/`,
appelées par `ComposerJsonDesignerCreation` ET `ComposerJsonDesignerModele` :

- `RemplirDesignerChampsStandard(pIdClient)` →
  `tableau de structDesignerChampStandard`
- `RemplirDesignerTypesDisponibles()` →
  `tableau de structDesignerTypeChamp`

## 6. Comportement par flux

> Tableau mis à jour V2.3 — ajout colonne `autoriserGestionChamps`.
> Tableau mis à jour V2.4 — clarification : tous les champs reçus au load
> sont d'origine `"import"` (verrouillage individuel selon §3.1).

| Flux | `champsFusion` au load | `autoriserGestionChamps` | `champsStandard` | `typesDisponibles` | Bouton « Ajouter un champ » |
|---|---|---|---|---|---|
| Tunnel courrier (`ComposerJsonDesignerCreation`) avec base | champs BDD (origine `"import"`) | **`Faux`** | envoyés | envoyés | **Désactivé** (verrouillage global §3.2) |
| Tunnel courrier (`ComposerJsonDesignerCreation`) sans base | **`[]`** (fix A1) | **`Vrai`** | envoyés | envoyés | Actif |
| Modèle (`ComposerJsonDesignerModele`, `mode="template"`) | **`[]`** (Q4 option A) ou champs déjà persistés (origine `"import"`) | **`Vrai`** | envoyés | envoyés | Actif |
| Document intérieur sans fenêtre (`ChampsFusionInterdit = Vrai`) | `[]` (vide imposé) | sans effet | envoyés (mais inutilisés) | envoyés (mais inutilisés) | **Désactivé** (toolbar Data masquée) |

## 7. Spécifications fonctionnelles

### 7.1 Bouton « Ajouter un champ »

Position : en **haut du panneau `#toolbar-data` / `.toolbar-content-data`**,
juste au-dessus de `.fields-count`. Style cohérent avec le thème
(`--theme-primary`, `--theme-primary-light`). En V2.3, le bouton peut être
déplacé dans l'en-tête de la popup pour gagner en densité (cf. D3).

État :

- Actif par défaut.
- Désactivé visuellement (grisé + tooltip) dans les cas suivants :
  - `champsFusionInterdit === true` (mode enveloppe sans fenêtre — tooltip
    *« Personnalisation par champs BDD indisponible pour ce document »*).
  - **V2.3** : `autoriserGestionChamps === false` (mode tunnel avec base BDD
    — tooltip *« Une base de données est associée à cette commande. La
    gestion des champs s'effectue depuis la base. »*).

### 7.2 Modale de création / édition (UX par onglets)

> **V2.5** : l'ajout d'un nouveau champ via la modale n'est possible qu'en
> **régime A** (= `autoriserGestionChamps = Vrai` côté Designer). En régime B
> (base BDD associée à l'opération), le bouton « + Ajouter un champ » est
> désactivé par `autoriserGestionChamps = Faux` côté SaaS (`bAvecBase = Vrai`
> → `autoriserGestionChamps = Faux` dans `ComposerJsonDesignerCreation.txt`).
> Cohérent avec le tableau §7.9 du présent cahier.

Réutiliser le pattern existant `modal-overlay` + `modal-box` (cf.
`confirmation-modal`, `template-limits-modal`, `collection-name-modal` dans
`index.html`). 2 onglets :

```
┌────────────────────────────────────────────────────┐
│  Ajouter un champ                          [×]     │
├────────────────────────────────────────────────────┤
│  [ Standard ] [ Spécifique ]                       │
├────────────────────────────────────────────────────┤
│  …contenu de l'onglet actif…                       │
├────────────────────────────────────────────────────┤
│                  [ Annuler ]  [ Confirmer ]        │
└────────────────────────────────────────────────────┘
```

#### 7.2.1 Onglet « Standard »

- Liste cliquable des entrées `champsStandard` reçues.
- **V2.4 (D7)** : pas de champ recherche (la liste métier ne contient que
  18 entrées, le filtre est superflu et alourdit l'UI).
- **V2.4 (D7)** : pas de texte d'aide introductif (« Choisissez un champ
  standard… »).
- **Filtrage A5** : les standards déjà insérés sont **masqués** (et non
  grisés) de la liste pour éviter les doublons. En mode édition d'un
  champ standard, son propre item reste visible (et pré-sélectionné).
- Sélection simple → met en surbrillance l'item. Bouton « Confirmer »
  s'active. L'utilisateur peut ensuite saisir une valeur d'échantillon
  personnalisée AVANT de cliquer Confirmer.
- **V2.4 (§3 — D7) — double-clic = ajout IMMÉDIAT** : double-cliquer sur
  un item du référentiel standard l'ajoute directement à la liste des
  champs disponibles, **sans passer par la zone de saisie d'échantillon
  ni nécessiter de cliquer sur Confirmer**. La modale se ferme. La
  valeur d'échantillon est calculée automatiquement via l'algorithme
  unifié (§7.3.2). L'utilisateur peut toujours éditer le champ après ajout
  pour modifier la valeur d'échantillon.
- À la confirmation (clic Confirmer ou double-clic) :
  - ajout au `documentState.champsFusion` avec `ordre = max(ordre existant) + 1` ;
  - `origine = "ajout"` (V2.4 §1.4) → librement supprimable/modifiable ;
  - `categorie = "standard"` (V2.4 §1.5 — Approche A) → onglet figé en
    édition (cf. §7.3.1) ;
  - pas de `localId` (le champ est déjà mappé avec son `nom` standard) ;
  - `echantillonDefaut` calculé via l'algorithme unifié (§7.3.2).

#### 7.2.2 Onglet « Spécifique »

- **V2.4 (D8)** : pas de texte d'aide introductif (« Créez un champ
  personnalisé… »).
- **V2.4 (D8)** : alignement compact label/input sur la **même ligne**
  (label à gauche, input à droite) pour Libellé et Type. Plus dense et
  plus lisible.
- Saisie libre du `libelle` (validation §7.4).
- Combo des types depuis `typesDisponibles` (obligatoire).
- `nom` technique laissé **vide**, `localId` généré à la confirmation
  (UUID v4 ou équivalent stable, préfixe non requis dans le `localId`
  lui-même — le préfixe `LOCAL_` n'apparaît que dans la clé d'insertion
  `@LOCAL_<localId>@`).
- Champ optionnel : valeur d'`echantillonDefaut`, format adapté au type.
- À la confirmation : ajout au `documentState.champsFusion` avec :
  - `ordre = max(ordre existant) + 1` ;
  - `origine = "ajout"` (V2.4 §1.4) ;
  - `categorie = "specifique"` (V2.4 §1.5) ;
  - `localId` généré ;
  - `echantillonDefaut` calculé via l'algorithme unifié (§7.3.2).

#### 7.2.3 Format et placeholder par défaut par type

> **V2.4** : ajout de la colonne « Placeholder par défaut » utilisée par
> l'algorithme unifié de résolution d'échantillon (§7.3.2 étape 3) pour
> les champs **spécifiques**. Pour les champs standards, le placeholder
> vient de la liste métier (cf. §5.1bis) transportée dans le
> `placeholderDefaut` de `structDesignerChampStandard`.

| Code | Type | Format d'échantillon attendu | Placeholder par défaut (V2.4) | Validation à la saisie |
|---|---|---|---|---|
| `TXT` | Texte | Libre | `Texte exemple` | Aucune (longueur raisonnable, ex. 200 car. max) |
| `ENT` | Entier | Numérique sans décimale (ex: `42`) | `42` | Regex `^-?\d+$` |
| `DEC` | Décimal | Numérique avec virgule française (ex: `1 234,56`) | `1 234,56` | Regex tolérant les espaces fines et la virgule |
| `MON` | Monétaire | Numérique avec symbole `€` (ex: `1 250,00 €`) | `1 250,00 €` | Format français, suffixe `€` optionnel à la saisie, ajouté à l'affichage |
| `DAT` | Date | `JJ/MM/AAAA` (ex: `15/06/2026`) | `01/06/2026` | Masque + validation date réelle |
| `TIM` | Heure | `HH:MM` (ex: `14:30`) | `14:30` | Masque + validation 24h |
| `EML` | Email | Format email valide (ex: `jean@example.com`) | `jean.dupont@example.com` | Regex email standard |
| `TEL` | Téléphone | Format français (ex: `01 23 45 67 89`) | `01.02.03.04.05` | Regex tolérant espaces/points, 10 chiffres |
| `SMS` | Portable | Format français (ex: `06 12 34 56 78`) | `06.12.34.56.78` | Comme `TEL` mais commence par `06` ou `07` |
| `CDP` | Code postal | 5 chiffres (ex: `75009`) | `75001` | Regex `^\d{5}$` |
| `URL` | URL | URL complète avec schéma (ex: `https://example.com`) | `https://www.example.com` | Validation URL standard |
| `IMG` | Image | **Placeholder visuel** (pas d'upload) | (icône image générique) | Aucune |
| `ALG` | Alliage | Code Alliage La Poste, chaîne libre | `ALG001` | Libre — utilisé dans le cadre des contrats Alliage La Poste pour la gestion des NPAI |

> **Note sur la validation à la saisie** : la validation s'applique à la
> **valeur d'échantillon** saisie dans la modale d'ajout/édition. C'est un
> garde-fou pour que l'échantillon affiché à l'aperçu soit représentatif
> du type. La validation n'a pas d'impact sur les valeurs réelles de la
> base (gérées hors Designer).

### 7.3 Édition d'un champ existant

Action déclenchée depuis l'icône crayon dans `.merge-tag` (cf. §7.7).

Ouvre la **même modale** que la création, en mode édition, pré-remplie.

#### 7.3.1 Onglet figé selon `categorie` (V2.4)

> **V2.4** : critère refondé. Le choix de l'onglet en édition n'est plus
> basé sur `origine` (qui sert désormais au verrouillage, cf. §3.1) mais
> sur la nouvelle propriété `categorie` (Approche A, cf. amendement §1.5).

En mode édition (contrairement au mode création où la navigation est libre),
**l'onglet est figé** selon la valeur de `champ.categorie` :

| `categorie` | Onglet ouvert | Navigation entre onglets |
|---|---|---|
| `"standard"` | Standard (item du champ pré-sélectionné, désactivé) | Bloquée |
| `"specifique"` | Spécifique | Bloquée |
| Absente (legacy) | Déduction par recherche dans `champsStandard` (présence → `"standard"`, sinon → `"specifique"`) | Bloquée |

Implémentation : masquer visuellement l'onglet non actif (`hidden`).

#### 7.3.2 Algorithme UNIFIÉ de résolution de la valeur d'échantillon (V2.4)

> **V2.4 §2.1** : algorithme **centralisé dans une seule fonction**
> `resolveEchantillonValue(champ, options)` utilisée systématiquement dans
> les 4 contextes suivants :
>
> 1. **Création onglet Standard** (clic Confirmer) — calcul à la création.
> 2. **Création onglet Standard** (double-clic V2.4 §3) — calcul à la
>    création.
> 3. **Création onglet Spécifique** (clic Confirmer) — calcul à la création.
> 4. **Ouverture en édition** d'un champ existant — pré-remplissage du
>    champ "valeur d'échantillon".

##### Ordre de priorité

1. **Valeur déjà saisie par l'utilisateur dans la modale** (input
   `champ-fusion-echantillon` non vide) → la conserver telle quelle.
   *(Ne s'applique qu'au clic Confirmer, pas au double-clic ni à
   l'ouverture en édition.)*
2. Sinon, valeur de l'**`echantillonDefaut`** déjà attribué au champ (cas
   édition d'un champ existant qui en a un) → utiliser cette valeur.
3. Sinon, valeur de la **fiche utilisateur** : 1ʳᵉ ligne de
   `documentState.donneesApercu` pour la clé du champ (`nom` ou
   `LOCAL_<localId>`) si présente et non vide → utiliser cette valeur.
4. Sinon, **placeholder par défaut** :
   - Si champ standard (cf. §5.1bis) → `placeholderDefaut` reçu de la SaaS
     dans `champsStandardDisponibles`.
   - Sinon (champ spécifique) → placeholder par défaut du **type**
     (cf. table §7.2.3).
5. Sinon (cas extrême) → chaîne vide.

##### Suppression des valeurs codées en dur (V2.4 §2.5, bug A10)

Le code existant pouvait contenir des valeurs d'échantillon codées en dur
côté Designer pour certains champs standards (« MME ET M » pour Civilité,
« Caradec » pour Nom…). Ces valeurs doivent être **retirées intégralement**
du Designer. Toute valeur par défaut transite désormais par
`resolveEchantillonValue`.

#### 7.3.3 Modifications applicables (V2.4 — refondé doctrine origine)

> **V2.4** : critère refondé selon le tableau §3.3 (origine + verrouillage
> global combinés).

- Champ d'**origine `"ajout"`**, `autoriserGestionChamps = Vrai` :
  `libelle`, `type`, échantillon **librement modifiables**.
- Champ d'**origine `"import"`**, `autoriserGestionChamps = Vrai` :
  seul l'**échantillon** est modifiable. `libelle` et `type` désactivés
  (cf. tooltip §7.3.5).
- **`autoriserGestionChamps = Faux`** (V2.3) : la modale d'édition n'est
  **pas accessible** (icône crayon désactivée). Si elle est forcée par
  programme, **tous** les champs sont en lecture seule, y compris
  l'échantillon.

#### 7.3.4 Masquage de la sélection de champ en édition (V2.4 §4, bug A12)

> **V2.4** : en mode édition d'un champ existant, la **liste/combo de
> sélection de champ** (dans l'onglet pré-sélectionné) est **masquée**
> (ou figée et non actionnable). La modification d'un champ n'a vocation
> qu'à modifier ses propriétés, pas à le remplacer par un autre.

L'en-tête du formulaire indique clairement quel champ est en cours de
modification (libellé du champ visible).

#### 7.3.5 Bandeau d'information

> **V2.4 (D9)** : suppression du bandeau d'aide « Ce champ est associé à
> votre base de données. Seule la valeur d'échantillon est modifiable. »
> Le verrouillage est déjà visible (champs grisés) et le bandeau alourdit
> l'UI sans apport.

Conservé uniquement pour le cas `autoriserGestionChamps = Faux` (verrouillage
global), où le motif n'est pas évident depuis la seule désactivation visuelle.

#### 7.3.6 Persistance à la sauvegarde

Si l'utilisateur modifie la valeur d'échantillon :

- La modification se propage dans **toutes les lignes de `donneesApercu`**
  où la valeur est actuellement vide OU identique à l'ancien
  `echantillonDefaut`. Les valeurs réelles BDD (déjà différentes) ne sont
  **pas** écrasées.
- Le champ `echantillonDefaut` du champ est mis à jour avec la nouvelle
  valeur.

Comportement déjà en place via `propagateEchantillonDefaut` (L4) — à
vérifier qu'il est bien déclenché à l'édition, pas seulement à la création.

### 7.4 Validation du libellé

S'applique en création **et** en édition.

| Règle | Valeur |
|---|---|
| Accents | Autorisés |
| Espaces | Autorisés |
| Caractères spéciaux | Interdits sauf `-` et `_` |
| Regex de validation | `/^[\p{L}\p{N} _\-]+$/u` (non vide après `trim`) |
| Unicité | Insensible à la casse, sur l'ensemble des `libelle` du modèle (incluant les champs déjà présents) |
| Garde-fou « doublon avec un standard non inséré » | Si le libellé saisi correspond (insensible casse) à un `libelle` de `champsStandard` non encore présent dans `champsFusion`, **proposer « Ajouter le standard à la place »** plutôt que créer un doublon non mappable |
| Longueur max | **35 caractères** (Q3 confirmé) |

Erreurs affichées sous le champ libellé dans la modale, en temps réel
(message rouge + bouton « Confirmer » désactivé).

### 7.5 Suppression d'un champ

> **V2.5 — refonte du critère de suppressibilité.** La décision « ce champ
> est-il supprimable ? » ne se base plus uniquement sur la propriété
> `origine`. Le nouveau critère croise **l'usage dans le document** et
> **la présence en base** (cf. §7.9 pour le tableau exhaustif).
>
> En résumé :
> - **Régime A** (pas de base BDD) : un champ est supprimable s'il n'est
>   exploité dans aucune zone du document.
> - **Régime B** (base BDD associée) : seuls les champs **rouges** (=
>   absents de la base) sont supprimables, et uniquement s'ils n'ont
>   plus aucune occurrence dans le document.
>
> La sous-section §7.5.1 ci-dessous (procédure détaillée de purge) reste
> intégralement valide — elle décrit le comportement *technique* qui
> s'applique dès lors que la suppression est autorisée par le tableau §7.9.

Action déclenchée depuis l'icône poubelle dans `.merge-tag` (cf. §7.7).

#### 7.5.1 Champ non mappé (`nom` vide)

- Vérifier l'usage **dans toutes les pages** (`documentState.pages.forEach`),
  pas seulement la courante. Considérer comme « utilisé » :
  - tout contenu Quill ou RTF contenant `@LOCAL_<localId>@`,
  - toute `zonesImage.source.champFusion === "LOCAL_<localId>"` (avec
    `source.type === "champ"`),
  - toute `zonesCodeBarres.champFusion === "LOCAL_<localId>"` (avec
    `sourceType === "champ"`),
  - toute valeur de `qrConfig.fields[*]` contenant
    `@LOCAL_<localId>@`.
- Si **non utilisé** : suppression directe.
- Si **utilisé** : modale de confirmation explicite (réutiliser le pattern
  `confirmation-modal`) précisant **le décompte détaillé** :
  - nombre d'occurrences dans le contenu texte (Quill / RTF de toutes les
    pages),
  - nombre de zones image affectées (`zonesImage[*].source.champFusion ===
    "LOCAL_<localId>"` avec `source.type === "champ"`),
  - nombre de zones code-barres affectées (`zonesCodeBarres[*].champFusion
    === "LOCAL_<localId>"` avec `sourceType === "champ"`),
  - nombre de références dans `qrConfig.fields[*]`.

  Exemple de message : « Le champ "Couleur préférée" est utilisé : 3
  occurrences dans le texte, 1 zone image, 2 zones code-barres seront
  affectées. Confirmer la suppression ? »

  À la confirmation :

  - retirer le champ de `documentState.champsFusion`,
  - purger toutes les occurrences `@LOCAL_<localId>@` du contenu,
  - basculer les zones image/barcode liées en `type/sourceType = "fixe"` et
    vider `champFusion` (cohérent avec
    `stripChampsFusionBindingsFromDocumentState`),
  - nettoyer les entrées `donneesApercu[i].enregistrement[j]` portant
    `nom = "LOCAL_<localId>"`.

#### 7.5.2 Champ d'origine `"import"` (V2.4)

> **V2.4** : critère refondu. Le critère « `nom` rempli » est remplacé par
> « `origine = "import"` ».

Icône poubelle désactivée (opacity 0.4 + `pointer-events:none`) avec tooltip
*« Champ importé, non supprimable »*.
Justification : ces champs viennent du JSON initial (base BDD ou modèle
sauvegardé) ; les supprimer rendrait incohérent le mapping côté SaaS et la
correspondance avec la base.

#### 7.5.3 Verrouillage global (V2.3)

Si `autoriserGestionChamps = Faux`, **l'icône poubelle est désactivée sur
tous les champs** (peu importe leur `origine`). Tooltip :
*« Une base de données est associée à cette commande. La gestion des champs
s'effectue depuis la base. »*

### 7.6 Zones image / barcode liées à un champ non mappé

**Décision Q7 retenue** : autoriser la liaison via `localId` (et non
interdire).

Implémentation côté Designer :

- Les combos de sélection de champ (zones image et barcode) listent
  **également** les champs non mappés ; la valeur effective stockée dans
  `champFusion` est alors `LOCAL_<localId>`.
- Aucun blocage côté Designer ; la zone fonctionne comme une zone liée à un
  champ mappé pour tout ce qui est UI (mise à jour visuelle, aperçu, etc.).
- Au mapping ultérieur (cf. §4.2), les `LOCAL_<localId>` sont substitués par
  le `nom` réel dans `champFusion`.

#### 7.6.1 Condition associée — à garantir côté SaaS

> **Important** : la SaaS doit **bloquer toute exploitation effective du
> modèle** (génération PSMD réelle, lancement de commande) tant qu'il
> subsiste au moins une référence `@LOCAL_xxx@` ou `LOCAL_xxx` dans :
>
> - le contenu de toute zone texte (Quill / RTF),
> - `zonesImage[*].source.champFusion`,
> - `zonesCodeBarres[*].champFusion`,
> - `qrConfig.fields[*]` (toute zone code-barres / QR).
>
> Le bouton de vérification de cohérence côté SaaS attribue les `nom`
> techniques aux `localId`, et ne libère l'exploitation qu'une fois tous les
> `localId` résolus.

Si cette condition ne peut pas être garantie côté SaaS, retomber sur l'option
de sécurité « interdire la liaison des zones image/barcode à un champ non
mappé » (les options correspondantes seraient alors désactivées dans les
combos avec tooltip explicatif).

### 7.7 UX dans la liste des champs (`.merge-tag`)

Boutons d'action **inline** dans chaque pastille de la popup champs, à
droite du nom :

```
┌─ merge-tag ──────────────────────────────────┐
│  📄  Prénom                       [✏]  [🗑] │  ← champ mappé : 🗑 grisé + tooltip
└──────────────────────────────────────────────┘
┌─ merge-tag ──────────────────────────────────┐
│  📄  Couleur préférée             [✏]  [🗑] │  ← champ non mappé : 🗑 actif
└──────────────────────────────────────────────┘
```

- Icônes Material 16px (`edit`, `delete_outline`).
- Visibles toujours.
- **V2.5 — refonte** : l'état de la **poubelle** est désormais piloté
  par la doctrine de suppressibilité fonctionnelle (cf. §7.9, tableau
  des régimes A/B). La condition d'activation devient :
  - **Régime A + champ non exploité** → poubelle **active**, tooltip
    « Supprimer ce champ ».
  - **Régime A + champ exploité** → poubelle grisée, tooltip
    *« Champ exploité dans le document, non supprimable »*.
  - **Régime B + champ vert (exploité, présent en base)** → poubelle
    grisée, tooltip *« Champ exploité dans le document, non supprimable »*.
  - **Régime B + champ gris (non exploité, présent en base)** → poubelle
    grisée, tooltip *« Champ issu de la base de données, non supprimable »*.
  - **Régime B + champ rouge exploité (absent de base, exploité)** →
    poubelle grisée, tooltip *« Champ exploité dans le document, retirez
    d'abord ses occurrences pour pouvoir le supprimer »*.
  - **Régime B + champ rouge non exploité (absent de base)** → poubelle
    **active**, tooltip « Supprimer ce champ ».
  L'ancienne logique (poubelle = active uniquement si `origine = "ajout"`)
  est remplacée. La propriété `origine` reste utilisée pour piloter le
  **crayon** (édition libellé/type figée si `origine = "import"`).
- Le **drag-and-drop** et le **double-clic d'insertion** (existants) sont
  conservés — les boutons d'action `stopPropagation` pour ne pas déclencher
  l'insertion.
- **V2.3** : si `autoriserGestionChamps = Faux`, **les deux** icônes
  (crayon ET poubelle) sont désactivées sur tous les champs avec tooltip
  *« Une base de données est associée à cette commande. La gestion des
  champs s'effectue depuis la base. »* Cohérent avec le verrouillage
  global §3.2.
- **V2.3 (bug A6)** : pour les champs de type `SYS`, le libellé doit
  rester **aligné à gauche** comme les autres champs (l'absence d'actions
  inline ne doit pas déclencher un alignement à droite). Cf. correctifs CSS.

### 7.8 Rendu de la pastille de fusion dans les zones de texte (NOUVEAU)

> **Exigence UX critique issue de Q1.**

#### 7.8.1 Constat

Aujourd'hui, lors de l'insertion d'un champ « Véhicule » (libellé) dont le
nom technique est `Champ2`, le texte `@Champ2@` apparaît brut dans la zone
Quill — ce qui est **désorientant** pour l'utilisateur, qui s'attend à voir
« Véhicule ». Idem pour tous les champs `@Champ1@`, `@Champ2@`, etc.

#### 7.8.2 Exigence

> **Dans la zone de texte Quill, et partout où le champ est rendu
> visuellement à l'utilisateur, la pastille de fusion doit afficher le
> LIBELLÉ du champ, et non son nom technique.**
>
> Le contenu HTML/RTF/export sous-jacent reste inchangé : `@<nom>@` ou
> `@LOCAL_<localId>@`. Le pipeline PSMD (`exportToWebDev`,
> `convertZoneTexteToJson`, `psmd_cli.js`, génération BAT, etc.) continue de
> fonctionner exactement comme aujourd'hui.

#### 7.8.3 Implémentation technique recommandée

Solution standard Quill : **Custom Blot Embed** (inline embed) qui :

1. Stocke en interne la **clé technique** (`PRENOM`, `Champ2`,
   `LOCAL_a1b2c3`).
2. Rend en HTML une `<span class="merge-tag-quill" data-key="…">…libellé…</span>`
   avec le libellé résolu depuis `documentState.champsFusion`.
3. Implémente `value()` qui renvoie `@<clé>@` — c'est cette valeur qui est
   utilisée par Quill lors de la conversion en texte (`getText()`) et par
   notre conversion Delta → texte/RTF dans `exportToWebDev`.

Étapes d'intégration :

- Créer le blot `MergeTagBlot` qui étend `Quill.import('blots/embed')`.
- L'enregistrer via `Quill.register('formats/merge-tag', MergeTagBlot, true)`.
- Dans `insertTag(fieldName)`, remplacer
  `quill.insertText(insertIndex, '@…@', 'user')` par
  `quill.insertEmbed(insertIndex, 'merge-tag', { key: fieldName }, 'user')`.
- À l'**import** depuis WebDev (`loadFromWebDev` →
  `convertZoneTexteFromJson`), parser le contenu pour repérer les motifs
  `@[A-Za-z0-9_\u00A0]+@` et les transformer en blots `merge-tag` lors de la
  reconstruction du Delta Quill.
- À l'**export** (`exportToWebDev` → `convertZoneTexteToJson`), s'assurer
  que les blots `merge-tag` sont sérialisés en `@<clé>@` dans le contenu
  texte / RTF (déjà couvert si `value()` est correctement implémenté).
- Pour le **mode aperçu** (`replaceMergeFields`) : **scénario A privilégié**
  — `value()` du blot doit renvoyer `@<clé>@` de telle sorte que
  `quill.getText()` restitue le texte plat avec les `@KEY@`, ce qui permet à
  `replaceMergeFields` (qui opère aujourd'hui sur du texte plat via une
  regex `/@([A-Z0-9_]+)@/gi`) de continuer à fonctionner **sans aucune
  réécriture**. Le rendu visuel (libellé) sera reconstruit après la
  substitution. **Scénario B (fallback)** : si `getText()` ne peut pas
  restituer correctement les `@KEY@` à cause d'une contrainte Quill
  (caractères spéciaux dans le blot, sérialisation alternative, etc.),
  alors adapter `replaceMergeFields` pour parcourir directement les blots
  `merge-tag` et substituer leur rendu. Dans ce cas, signaler explicitement
  le basculement dans le code (commentaire + log) pour traçabilité.

#### 7.8.4 Résolution du libellé à afficher

Source : `documentState.champsFusion`.

- Pour un blot `merge-tag` de clé `PRENOM` → chercher
  `champsFusion.find(c => c.nom === "PRENOM")` → afficher `c.libelle`.
- Pour un blot `merge-tag` de clé `LOCAL_a1b2c3` → chercher
  `champsFusion.find(c => c.localId === "a1b2c3")` → afficher `c.libelle`.

#### 7.8.5 Fallback de sécurité

Si le libellé n'est pas retrouvable (corruption, désynchronisation, champ
supprimé alors qu'une référence subsiste, etc.), **afficher la clé brute**
sous la forme `@<clé>@` — comportement identique à aujourd'hui. Aucune
exception silencieuse, log console en mode `DEBUG`.

#### 7.8.6 Mise à jour réactive

Lorsque l'utilisateur édite le `libelle` d'un champ non mappé via la modale
(§7.3), tous les blots `merge-tag` correspondants doivent **rafraîchir leur
rendu visuel** sans modifier le contenu sous-jacent. Mécanisme : parcourir
toutes les zones Quill, identifier les blots dont la clé correspond au
champ édité, appeler `update()` ou re-rendre via une réinsertion silencieuse.

#### 7.8.7 Hors zones texte Quill

Cette exigence concerne aussi :

- **Les inputs QR Code intelligent** (cf. `script.js` ~4444) qui acceptent
  `@CHAMP@` dans `qrConfig.fields[*]` : **option 1 retenue (V2.2)** —
  conserver l'affichage texte brut `@CHAMP@` dans l'input (pas de rendu
  visuel transformé) et **ajouter un tooltip d'aide** au survol qui résout
  les `@CHAMP@` détectés dans la valeur de l'input. Exemple de tooltip :
  « `@CHAMP2@` = Véhicule, `@PRENOM@` = Prénom ». Implémentation simple
  via parsing regex à la volée + survol natif `title=` ou tooltip
  thématisé. **Pas de chantier supplémentaire** pour un rendu visuel
  transformé dans ces inputs en V1.
- **Les combos « Champ de fusion »** des zones image et barcode : afficher
  le `libelle` (ce qui est déjà le cas aujourd'hui pour la plupart). Pour
  les champs non mappés exposés via `localId` (cf. §7.6), les afficher avec
  leur `libelle` et marquer la valeur effective en interne sur
  `LOCAL_<localId>`.

### 7.9 (V2.5) — Popup d'alerte au désalignement modèle ↔ base

> **Section ajoutée en V2.5** (cf. amendement V2.5 §3).

#### 7.9.1 Déclenchement

À l'ouverture du Designer dans le tunnel courrier **avec base de données
sélectionnée** (régime B — au moins un champ non-SYS porte l'attribut
`presenteEnBase`), si **au moins un champ exploité dans une zone du
document est absent de la base** (= au moins un champ rouge exploité),
une popup d'alerte s'affiche.

#### 7.9.2 Contenu

- **Message d'introduction** : *« Les champs suivants sont utilisés dans
  le document mais absents de la base de données sélectionnée. Leur
  valeur sera vide lors de la fusion. »*
- **Liste** des libellés des champs concernés, **un par ligne**.
  Chaque libellé est précédé d'un pictogramme d'alerte ⚠ (rouge),
  affiché en italique pour rappeler subtilement le statut « anormal ».
- **Un seul bouton** : « **OK** ».

Modale `#alerte-desalignement-modal` dans `index.html`, style aligné
sur le pattern existant `.modal-overlay` + `.modal-box`. Z-index élevé
(L10) pour passer au-dessus de la popup « Champs de fusion ».

#### 7.9.3 Comportement

- Popup **non bloquante** au-delà du clic OK.
- Le clic sur OK ferme la popup et permet l'accès normal au Designer.
- La popup **ne se ré-affiche pas** tant que l'utilisateur reste dans
  la session courante du Designer (flag interne
  `alerteDesalignementAffichee = true` après affichage, réinitialisé à
  `false` à chaque `loadFromWebDev`).
- Si l'utilisateur ferme et rouvre le Designer, la popup se ré-affiche
  si le désalignement persiste.

#### 7.9.4 Cas où la popup ne s'affiche PAS

- **Régime A** (pas de base de données associée) : aucun champ ne porte
  `presenteEnBase`, le concept de désalignement n'a pas de sens.
- **Régime B + aucun champ exploité absent de la base** (cas nominal
  aligné) : pas d'alerte.
- **Régime B + champs absents mais NON exploités** : pas d'alerte —
  ces champs apparaissent en rouge dans la popup mais sont supprimables
  par l'utilisateur, ils ne cassent pas la fusion.
- **`ChampsFusionInterdit = Vrai`** : pas d'alerte (la mécanique de
  fusion est désactivée de toute façon).

### 7.10 (V2.5) — Signalisation visuelle vert / gris / rouge dans la popup

> **Section ajoutée en V2.5** (cf. amendement V2.5 §2).

#### 7.10.1 Bordure colorée à gauche de chaque pastille

Chaque entrée de la popup « Champs de fusion » porte une **bordure colorée
à gauche** (`border-left: 3px solid <couleur>`) indiquant son statut V2.5.

| Couleur | Code hexadécimal | Critère | Doctrine V2.5 |
|---|---|---|---|
| **Vert** | `#2E7D32` (Material Green 800) | Champ exploité dans au moins une zone du document | Régimes A et B |
| **Gris** | `#9E9E9E` (Material Grey 500) | Régime A non exploité, OU régime B présent en base + non exploité | Régimes A et B |
| **Rouge** | `#C62828` (Material Red 800) | Champ absent de la base (régime B uniquement, exploité ou non) | Régime B |
| **Jaune-orangé** | `#EAB400` (existant) | Champs `SYS` (Sequentiel, Affranchissement) — **non affectés par V2.5** | Tous régimes |

Implémentation CSS : `.merge-tag-status-vert | -gris | -rouge | -sys` dans
`style.css`, calcul de la couleur par le helper `getChampStatusV25(champ, regime)`
dans `script.js`.

#### 7.10.2 Distinction des champs spécifiques

Les champs **spécifiques** (`categorie = "specifique"`) restent visuellement
distingués des champs **standards** par un **style typographique** appliqué
au libellé : `font-style: italic`. Classe CSS `.merge-tag-specifique`,
combinable avec n'importe quelle bordure couleur sans surcharge visuelle.

Choix de design retenu : l'italique est subtil, lisible sur toutes les
couleurs de bordure, et n'ajoute aucun élément visuel supplémentaire qui
encombrerait la popup déjà dense (cf. D3 V2.3).

#### 7.10.3 Mécanisme d'entretien dynamique

- **Scan initial** au load : reconstruction de la table interne
  `champsExploites = { <clé>: <nombre d'occurrences> }` par parcours
  de toutes les zones de toutes les pages (texte Quill, image, barcode, QR).
  Clé = `nom` non vide OU `LOCAL_<localId>` pour les spécifiques non mappés.
- **Entretien** : `champsExploites` est reconstruite à chaque appel de
  `saveState()` (= après tout changement du document : frappe Quill
  debouncée, undo/redo, suppression/création de zone, etc.), via la
  fonction `notifyChampsExploitesMayHaveChanged()` débouncée à 100 ms.
- **Rafraîchissement visuel** : à chaque mise à jour de `champsExploites`,
  `updateMergeFieldsUI(mergeFields)` est rappelée → recalcul des classes
  CSS `merge-tag-status-*` et de l'état désactivé/activé de chaque corbeille.

Coût négligeable : un document typique (< 100 champs, < 50 zones) est
re-scanné en quelques millisecondes. Le debounce 100 ms évite les
appels redondants pendant la frappe rapide.

#### 7.10.4 Sources scannées

| Type de zone | Source(s) de référence à un champ |
|---|---|
| `textQuill` | `zoneData.quillDelta.ops[*].insert['merge-tag'].key` (via helpers `isMergeTagOp` / `extractMergeTagKey` existants) |
| `image` | `zoneData.source.champFusion` si `zoneData.source.type === 'champ'` |
| `barcode` | `zoneData.champFusion` direct + tokens `@KEY@` dans `zoneData.qrConfig.fields[*]` (regex `@([A-Za-z0-9_]+)@`) |
| `qr` | idem `barcode` (mêmes champs `champFusion` + `qrConfig.fields`) |

### 7.11 (V2.5 / L18) — Correspondance dynamique libellé modèle ↔ base BDD

> **Section ajoutée en L18/A29** — chantier mapping dynamique.

#### 7.11.1 Principe

Quand un modèle est exploité dans le tunnel courrier **avec une base de
données sélectionnée**, la correspondance entre les champs du modèle et
les colonnes de la base est calculée **dynamiquement** à chaque ouverture
du Designer, par **matching de libellé** (et non par nom technique).

- **Source canonique** : `__stOperation.taaBaseChamp` est un tableau
  associatif WLangage dont la **clé est le libellé client** (ex.
  `"Véhicule"`, `"Couleur"`, `"Civilité"`, `"Adresse 1"`) et la valeur
  une `structBaseChamp` contenant le nom technique de la colonne MariaDB
  (`stBaseChamp.Champ` = `"Champ3"` par exemple), le type, l'ordre, etc.
- **Uniformité** : ce format est utilisé pour TOUTES les colonnes,
  standards (Civilité, Nom, Prénom, Adresse 1…) ET clients personnalisés
  (Champ1-Champ30 renommés en Véhicule, Couleur, Image…). Vérifié par
  audit des exemples JSON et confirmé par `RemplirDesignerChampsFusion`
  qui itère `pour tout stChamp, sLibellé de pTaaBaseChamp` puis assigne
  `stUnChamp.libelle = sLibellé`.

#### 7.11.2 Contraintes structurelles

1. **Mapping dynamique non persistant** : le mapping est recalculé à
   chaque ouverture du Designer selon la base sélectionnée à cet instant.
   **JAMAIS figé** dans le contenu stocké du modèle. Le modèle reste
   **générique** et réutilisable avec n'importe quelle base.
2. **Marqueurs stables** : le contenu du modèle (zones texte, RTF,
   `quillDelta`) conserve toujours ses marqueurs `@LOCAL_<localId>@`.
   La correspondance ne réécrit JAMAIS ces marqueurs.
3. **Workflow utilisateur** : automatique, aucune intervention.

#### 7.11.3 Procédures SaaS impactées

| Procédure | Modification |
|---|---|
| `webdev/pgeLtrContenu/procédure SelectionModèle.txt` | 4 étapes A/B/C/D insérées entre l'application des valeurs du modèle et la restauration des `constraints` |
| `webdev/pgeLtrContenu/Code bouton btnDocumentPersonnaliser.txt` | Idem (symétrique) |
| `webdev/cpDesigner/procédure GenererBatDocumentDepuisPsmd.txt` | **Aucune modification** — déjà conforme (refonte L16/A26) |
| `webdev/cpDesigner/procédure ComposerJsonDesignerCreation.txt` | **Aucune modification** — sans modèle, tous les champs viennent déjà de `taaBaseChamp` (`presenteEnBase = Vrai` par construction) |
| Designer `script.js` | **Aucune modification** — exploite déjà `presenteEnBase` (V2.5) |
| Structures WebDev | **Aucune modification** — pas de nouvel attribut JSON |

#### 7.11.4 Les 4 étapes (dans cet ordre)

**Étape A — Mapping libellé → nom technique** (réécriture en mémoire)

Pour chaque champ non-SYS de `champsFusion` final :

```wlangage
si __stOperation.taaBaseChamp[champ.libelle]..Existe alors
    champ.nom = __stOperation.taaBaseChamp[champ.libelle].Champ
fin
```

→ Le nom technique du champ pointe désormais vers la colonne BDD réelle.
Réécriture **dans `jsWrapper` uniquement**, jamais en BDD.

**Étape B — Calcul `presenteEnBase` par libellé**

Remplace le critère historique (V2.5 par nom technique, L11) :

```wlangage
si __stOperation.taaBaseChamp[champ.libelle]..Existe alors
    champ.presenteEnBase = Vrai
sinon
    champ.presenteEnBase = Faux
fin
```

→ Plus simple, plus correct. Fonctionne uniformément pour les champs
spécifiques avec `nom=""` (le matching se fait par libellé, pas par nom).

**Étape C — Injection des colonnes base non utilisées**

Les colonnes de `taaBaseChamp` dont le libellé n'apparaît dans aucun
champ du modèle (et qui ne sont pas SYS) sont ajoutées à `champsFusion`
en GRIS (présent en base + non exploité) :

```
nom            = stBaseChamp.Champ
libelle        = clé (libellé)
type           = "IMG" si stBaseChamp.Type = image, sinon "TXT"
ordre          = stBaseChamp.Ordre
origine        = "import"
categorie      = "specifique"          (décision donneur d'ordre §7.11.6)
presenteEnBase = Vrai
```

Garde-fou : exclure les libellés `"Séquentiel"` et `"Affranchissement"`
si jamais ils apparaissent comme clés dans `taaBaseChamp` (cas tordu où
un client renomme un Champ7 en `"Séquentiel"`).

**Étape D — Injection des valeurs LOCAL_<localId> dans `donneesApercu`**

Pour chaque champ du modèle ayant un `localId` ET une correspondance
trouvée en étape A, injecter dans CHAQUE enregistrement de
`donneesApercu` une paire :

```
{ nom: "LOCAL_<localId>", valeur: <valeur de la colonne base correspondante> }
```

Mécanique :
1. `sNomTechBase = taaBaseChamp[champ.libelle].Champ`
2. Pour chaque enregistrement de `donneesApercu`, chercher l'entrée
   `{nom: sNomTechBase}` (déjà peuplée par `RemplirDesignerApercu`)
3. Récupérer sa valeur
4. Ajouter (ou mettre à jour si déjà présente) une entrée
   `{nom: "LOCAL_<localId>", valeur: <valeur>}`

→ Le pipeline BAT (`GenererBatDocumentDepuisPsmd` refonte L16/A26) lit
`donneesApercu[1].enregistrement[*]` et envoie tout à PrintShop Mail.
Les marqueurs `@LOCAL_xxx@` du RTF sont alors résolus avec la **vraie
valeur de la colonne base** correspondante (et non plus avec l'
`echantillonDefaut` figé du modèle).

#### 7.11.5 Comportement attendu (matrice)

| Cas | Couleur Designer | `presenteEnBase` | BAT |
|---|---|---|---|
| Libellé modèle ↔ colonne base trouvée | Vert (si exploité) ou Gris (si non) | `Vrai` | Valeur de la colonne base |
| Libellé modèle ↔ aucune colonne base | Rouge | `Faux` | `echantillonDefaut` du modèle (préservé) → popup d'alerte si exploité |
| Colonne base non utilisée par le modèle | Gris (non exploitée) | `Vrai` | Pas de marqueur dans le RTF, valeur disponible si l'utilisateur insère le champ |
| Champ SYS (Sequentiel, Affranchissement) | Jaune-orangé | (absent) | Valeur simulée envoyée par la SaaS |

#### 7.11.6 Décisions du donneur d'ordre (L18)

| # | Question | Décision |
|---|---|---|
| 1 | Format des clés `taaBaseChamp` pour les standards | Audit confirme : uniformément indexé par libellé (Civilité, Nom, Prénom, Adresse 1…). Matching unique, pas de mécanisme dual nécessaire. |
| 2 | `categorie` des colonnes base injectées (étape C) | `"specifique"` systématiquement. Les Champ1-Champ30 client ne sont pas des champs métier standards. |
| 3 | Persistance du mapping en BDD | NON. Le modèle reste générique. Recalcul à chaque ouverture. Le contenu garde ses `@LOCAL_xxx@` stables. |

#### 7.11.7 Régime A (sans base) — non affecté

Si aucune base n'est associée (`taaBaseChamp` vide → `bAvecBaseLocal = Faux`),
**tout le bloc 4 étapes est court-circuité**. Le comportement antérieur
(V2.4 + V2.5 régime A) est préservé sans modification. La popup d'alerte
ne se déclenche pas (pas de `presenteEnBase` envoyé → régime A appliqué
côté Designer).

## 8. Contrats `postMessage`

### 8.1 Architecture — enrichir l'existant

Pas de nouveau message. On enrichit `{action:"load"}` (entrée) et
`{action:"validated"}` (sortie). Compatible avec `gsJsonRecu` et
`ServeurTraiterMessageDesigner()` côté `pgeLtrContenu`. Compatible avec
`webdev-bridge.js` (NSPCS).

### 8.2 Message entrant `load` — extraits (uniquement les ajouts)

```json
{
  "action": "load",
  "auth": { "...": "..." },
  "bases": { "...": "..." },
  "policesDisponibles": [],
  "champsStandard": [
    { "nom": "NOM",    "libelle": "Nom",    "type": "TXT" },
    { "nom": "PRENOM", "libelle": "Prénom", "type": "TXT" }
  ],
  "typesDisponibles": [
    { "code": "TXT", "libelle": "Texte" },
    { "code": "DAT", "libelle": "Date" }
  ],
  "data": {
    "champsFusion": [
      { "nom": "PRENOM", "libelle": "Prénom", "type": "TXT", "ordre": 3 },
      { "nom": "Champ7", "libelle": "Véhicule", "type": "TXT", "ordre": 12, "localId": "a1b2c3" },
      { "nom": "", "libelle": "Couleur préférée", "type": "TXT", "ordre": 13, "localId": "d4e5f6", "echantillonDefaut": "Bleu" }
    ],
    "donneesApercu": [
      { "enregistrement": [
        { "nom": "PRENOM",       "valeur": "Jean" },
        { "nom": "Champ7",       "valeur": "Cayenne" },
        { "nom": "LOCAL_d4e5f6", "valeur": "Bleu" }
      ] }
    ]
  }
}
```

Notes :

- Le 2ᵉ champ illustre un champ **précédemment non mappé** (`localId`
  `a1b2c3` conservé) que la SaaS a depuis associé à `Champ7`. Le Designer
  substitue `@LOCAL_a1b2c3@` → `@Champ7@` dans tout le contenu à la lecture
  (cf. §4.2).
- Les enregistrements d'aperçu pour les champs encore non mappés sont
  indexés par `LOCAL_<localId>`.

### 8.3 Message sortant `validated` — extraits

```json
{
  "action": "validated",
  "success": true,
  "data": {
    "champsFusion": [
      { "nom": "PRENOM", "libelle": "Prénom", "type": "TXT", "ordre": 3 },
      { "nom": "Champ7", "libelle": "Véhicule", "type": "TXT", "ordre": 12, "localId": "a1b2c3" },
      { "nom": "", "libelle": "Date de livraison", "type": "DAT", "ordre": 14, "localId": "g7h8i9", "echantillonDefaut": "15/06/2026" }
    ],
    "donneesApercu": [ "..." ]
  }
}
```

Côté SaaS, `ServeurTraiterMessageDesigner` détecte qu'au moins un mapping
reste à faire si `data.champsFusion[*].nom = ""`. Aucun signal supplémentaire
n'est envoyé — c'est l'absence de `nom` qui sert de signal.

### 8.4 Compatibilité ascendante

- Si le `load` n'envoie pas `champsStandard` / `typesDisponibles`, la modale
  reste ouvrable mais l'onglet « Standard » affiche « Aucun champ standard
  disponible » et l'onglet « Spécifique » utilise une liste minimale
  (`TXT`, `IMG`).
- Si le `load` envoie des `champsFusion` sans `localId` ni `echantillonDefaut`,
  ils sont traités comme aujourd'hui (champs mappés classiques).

## 9. Mode template (`ComposerJsonDesignerModele`)

Décision Q4 retenue (option A) : `champsFusion = []` au load, l'utilisateur
peuple via la modale. Listes `champsStandard` et `typesDisponibles`
**toujours envoyées**.

Côté WebDev, dans `webdev/cpDesigner/procédure ComposerJsonDesignerModele.txt`,
remplacer le bloc actuel :

```wlangage
stLoad.Document.champsFusion  = RemplirDesignerChampsFusion(pTaaBaseChamp)
stLoad.Document.donneesApercu = RemplirDesignerApercu(pTabEchantillon, pTaaBaseChamp)
```

par :

```wlangage
// Mode template sans base : champs vides, l'utilisateur peuple via la modale Designer
tabChampsVide  est un tableau de structDesignerChampFusion
tabApercuVide  est un tableau de structDesignerEnregistrement
stLoad.Document.champsFusion  = tabChampsVide
stLoad.Document.donneesApercu = tabApercuVide

// Listes de référence pour la modale "Ajouter un champ"
stLoad.champsStandard     = RemplirDesignerChampsStandard(pIdClient)
stLoad.typesDisponibles   = RemplirDesignerTypesDisponibles()
```

## 10. Documentation à mettre à jour

`docs/Structure Webdev Designer V3.md` → V3.5 (passage V3.4 → V3.5 en V2.3).

V3.4 (déjà fait) :

- **Section 3** (`structDesignerChampFusion`) : ajout des champs `localId`
  (chaîne) et `echantillonDefaut` (chaîne).
- **Nouvelle section** : `structDesignerChampStandard` (`nom`, `libelle`,
  `type`).
- **Nouvelle section** : `structDesignerTypeChamp` (`code`, `libelle`).
  Inclure dans le commentaire de la structure la liste exhaustive des 13
  codes V2.2 et leurs constantes WebDev associées (cf. §5.1 du présent
  cahier).
- **Section 13** (`structDesignerLoad`) : ajout des propriétés
  `champsStandard` (tableau de `structDesignerChampStandard`) et
  `typesDisponibles` (tableau de `structDesignerTypeChamp`).
- **Section 11** (`structDesignerEnregistrement` / `structDesignerChamp`) :
  préciser que `nom` peut valoir `LOCAL_<localId>` pour les champs non encore
  mappés.

V3.5 (V2.3) :

- **Section 3** (`structDesignerChampFusion`) : ajout du champ `origine`
  (chaîne, valeurs `"standard"` ou `"specifique"`).
- **Section 13** (`structDesignerLoad`) : ajout du booléen
  `autoriserGestionChamps` (cf. §5.2 du présent cahier).

V3.6 (V2.4) :

- **Section 3** (`structDesignerChampFusion`) :
  - Sémantique de `origine` modifiée : valeurs `"import"` ou `"ajout"`
    (et non plus `"standard"`/`"specifique"`). Sert au verrouillage
    individuel (cf. §3.1).
  - Ajout du champ `categorie` (chaîne, valeurs `"standard"` ou
    `"specifique"` — Approche A retenue, cf. amendement §1.5). Sert au
    choix de l'onglet en édition (cf. §7.3.1).
- **`structDesignerChampStandard`** : ajout du champ `placeholderDefaut`
  (chaîne, optionnel) — valeur par défaut métier transportée par la SaaS
  pour alimenter l'algorithme unifié de résolution d'échantillon
  (§7.3.2 étape 4).

V3.7 (V2.5) :

- **Section 3** (`structDesignerChampFusion`) : **nouvel attribut JSON
  `presenteEnBase`** (booléen optionnel). Trois états : `Vrai` (mappé
  en base), `Faux` (orphelin), **absent du JSON** (régime A — pas de
  base associée). Pilote la couleur (vert/gris/rouge) et la
  suppressibilité côté Designer (cf. §7.10, §7.5).
- ⚠️ Sérialisation particulière : l'attribut **n'est PAS déclaré dans
  la structure WLangage** (sinon `Sérialise()` produirait
  `presenteEnBase: false` sur tous les champs et la distinction
  « régime A » vs « régime B + Faux explicite » serait perdue).
  L'attribut est ajouté **dynamiquement** sur le JSON natif côté SaaS
  par les procédures `SelectionModèle.txt` et `btnDocumentPersonnaliser.txt`
  (cf. Structure V3.7 en-tête pour le détail).

## 11. Contraintes techniques

- HTML/CSS/JS pur, sans framework. Quill déjà chargé en CDN (cf.
  `index.html` ~9).
- Pas de `localStorage` / `sessionStorage` pour les données métier (la
  persistance est gérée par la SaaS via `postMessage`). Note : `sessionStorage`
  est utilisé par `script.js` pour `authConfig` et `localStorage` pour la
  persistance temporaire du `documentState` — on ne touche pas à ces
  mécanismes existants.
- Bridge iframe : préserver le pattern `webdev-bridge.js` (NSPCS) actuel.
- Robustesse `postMessage` : valider la structure des messages reçus avant
  traitement (déjà en place dans `loadFromWebDev`).
- Cohérence avec l'existant : reprendre les conventions de nommage CSS
  (`.merge-tag`, `.fields-list`, `.toolbar-data`, `.modal-overlay`,
  `.modal-box`) et le système de variables CSS du thème
  (`--theme-primary`, `--theme-primary-light`, etc.).

## 12. Livrables

| # | Lot | Description |
|---|---|---|
| L1 | **Doc V3.4** | Mise à jour de `docs/Structure Webdev Designer V3.md` (cf. §10) + 2 procédures WebDev `RemplirDesignerChampsStandard.txt` et `RemplirDesignerTypesDisponibles.txt` dans `webdev/cpDesigner/` + patch des appels dans `ComposerJsonDesignerCreation.txt` et `ComposerJsonDesignerModele.txt` |
| L2 | **Designer — backend JS** | Génération `localId`, gestion `echantillonDefaut`, enrichissement `loadFromWebDev` (lecture `champsStandard`, `typesDisponibles`, `localId`, `echantillonDefaut`), enrichissement `exportToWebDev` (export `localId`, `echantillonDefaut`, indexation `donneesApercu` par `LOCAL_<localId>`), substitution post-mapping (cf. §4.2), mise à jour `stripChampsFusionBindingsFromDocumentState` pour gérer `LOCAL_<localId>` |
| L3 | **Designer — Quill custom blot** | Création `MergeTagBlot` (cf. §7.8), enregistrement, adaptation de `insertTag`, parsing à l'import dans `convertZoneTexteFromJson`, sérialisation à l'export, mode aperçu, fallback de sécurité, mise à jour réactive sur édition de libellé |
| L4 | **Designer — UI** | Bouton « Ajouter un champ » (§7.1), modale 2 onglets (§7.2), validation libellé temps réel (§7.4), édition (§7.3), suppression avec confirmation (§7.5), actions inline crayon/poubelle dans `.merge-tag` (§7.7), CSS aligné avec le thème |
| L11 | **Designer — doctrine V2.5** | Refonte suppressibilité fonctionnelle (§7.5, §7.7 V2.5), table interne `champsExploites` + entretien dynamique (§7.10.3), signalisation visuelle vert/gris/rouge (§7.10), popup d'alerte au désalignement (§7.9), exploitation du nouvel attribut `presenteEnBase`. Patches WebDev préalables : Structure V3.7, `SelectionModèle.txt`, `btnDocumentPersonnaliser.txt`. |

Le donneur d'ordre demande **L1, L2/L3, L4 en séquence**, avec validation à
chaque étape. **L11 vient après L10** (stabilisation du Designer) et **après
les patches WebDev V3.7** (qui transmettent `presenteEnBase`).

## 13. Hors périmètre Designer (côté SaaS)

À traiter par la plateforme SaaS, indépendamment :

- Bouton de **vérification de cohérence** entre le modèle et la BDD
  exploitée : appariement des libellés, attribution des `nom` techniques aux
  `localId`, écriture en BDD.
- **Blocage de l'exploitation effective** du modèle (génération PSMD réelle)
  tant qu'il reste au moins un `LOCAL_<localId>` non résolu (cf. §7.6.1).
  Si cette condition n'est pas garantie, retomber sur l'option « interdire
  la liaison des zones image/barcode à un champ non mappé » côté Designer.
- **Persistance optionnelle** du `localId` en BDD à côté du `nom` technique
  attribué, pour traçabilité (Q9 : décision reportée).

## 14. Annexe — décisions du donneur d'ordre (11/05/2026)

Synthèse pour mémoire des 9 points du §4.11 de l'analyse :

| # | Question | Décision |
|---|---|---|
| Q1 | Syntaxe `@NOM@` / `@LOCAL_xxx@` | Oui, conservée techniquement + **rendu pastille = libellé** (§7.8) |
| Q2 | Codes `DAT/HEU/INT/MON` | Existent côté SaaS, à récupérer en BDD au dev |
| **Q2 bis** | **Liste finale des codes types (V2.2)** | **13 codes WebDev intégrés tels quels : `TXT`, `ENT`, `DEC`, `MON`, `DAT`, `TIM`, `EML`, `TEL`, `SMS`, `CDP`, `URL`, `IMG`, `ALG`** (avec corrections `HEU` → `TIM` et `INT` → `ENT` par rapport au prompt initial). Voir §5.1 pour la table de correspondance avec les constantes WebDev. |
| Q3 | Longueur max libellé | 35 caractères |
| Q4 | Mode template sans base | `champsFusion = []` |
| Q5 | `upload-bdd.js v3.1.0` | Référence retirée (inexistant dans le repo) |
| Q6 | `Partage.ClassHtmlTypeOperation()` | Référence retirée (sans rapport avec ce projet) |
| Q7 | Liaison zones image/barcode à champ non mappé | Autorisée via `localId`, condition côté SaaS (§7.6.1) |
| Q8 | UX modale | Onglets |
| Q9 | Persistance `localId` en BDD SaaS | Reportée — `localId` géré côté Designer dans tous les cas |
| **Q10 (V2.3)** | **Verrouillage global de la gestion des champs** | Nouveau booléen `autoriserGestionChamps` à la racine du load. `Faux` quand une base BDD est associée à la commande → désactive bouton « Ajouter », icônes crayon/poubelle, modale, édition échantillon. Cohabite avec le verrouillage individuel par `nom` rempli (cf. §3.3 règle de combinaison). Valeur par défaut si absent : `Vrai`. |
| **Q11 (V2.3)** | **Source de la valeur d'échantillon en édition** | Priorité : 1) `documentState.donneesApercu[0]` pour la clé du champ si non vide ; 2) `champ.echantillonDefaut` ; 3) vide. À la sauvegarde, `propagateEchantillonDefaut` propage la nouvelle valeur dans les lignes vides de `donneesApercu` sans écraser les valeurs BDD réelles. |
| **Q12 (V2.3)** | **Critère discriminant standard/spécifique pour figer l'onglet en édition** | Propriété explicite `origine: "standard" \| "specifique"` sur le champ. Renseignée à la création par la modale. Pour les champs legacy sans `origine` : déduction par recherche dans `champsStandard` (présence → `"standard"`, sinon `"specifique"`). |
| **Q13 (V2.3, lié bug A1)** | **Comportement tunnel sans base** | `ComposerJsonDesignerCreation` doit envoyer `champsFusion = []` + `donneesApercu = []` + `autoriserGestionChamps = Vrai` quand aucune base n'est sélectionnée. Test métier exact à confirmer côté WebDev (probablement `stOperation.tabBase..Occurrence = 0`). |
| **Q14 (V2.4)** | **Critère de verrouillage par origine** | Refonte de doctrine : le critère « `nom` rempli = verrouillé » est remplacé par « `origine = "import"` = verrouillé ». Un champ ajouté par l'utilisateur (`origine = "ajout"`) est librement modifiable/supprimable, peu importe qu'il soit standard ou spécifique. Combiné avec `autoriserGestionChamps` (cf. §3.3). |
| **Q15 (V2.4)** | **Placeholders par défaut** | Algorithme unifié `resolveEchantillonValue(champ, options)` centralisé : 1) valeur saisie, 2) `echantillonDefaut` existant, 3) fiche utilisateur (`donneesApercu[0]`), 4) `placeholderDefaut` pour standards / par type pour spécifiques. Plus aucune valeur codée en dur côté Designer (fix bug A10). |
| **Q16 (V2.4)** | **Double-clic en onglet Standard** | Double-clic sur un item standard → ajout immédiat à la liste, **sans passer par la zone d'échantillon ni Confirmer**. Valeur d'échantillon calculée auto via algo unifié. Édition possible après ajout. |
| **Q17 (V2.4)** | **Masquage sélection en édition + Approche A pour `categorie`** | En édition, la liste/combo de sélection de champ est masquée (l'édition ne sert qu'à modifier les propriétés, pas à remplacer). Onglet figé selon nouvelle propriété explicite `categorie` (Approche A retenue de l'amendement §1.5) — plus robuste qu'une déduction heuristique. |
| **Q18 (V2.5)** | **Doctrine de suppressibilité fonctionnelle** | Refonte : la corbeille est désormais pilotée par 1) la présence du champ dans la base BDD sélectionnée (attribut `presenteEnBase`) et 2) l'usage du champ dans le document (table interne `champsExploites`). L'ancien critère « `origine = "ajout"` = supprimable » est remplacé. Deux régimes A (pas de base, ou mode modèle) et B (base associée) — cf. tableau §7.9 et amendement V2.5 §1.4. `origine` reste utilisée pour figer le libellé/type en édition. |
| **Q19 (V2.5)** | **Signalisation visuelle vert/gris/rouge** | Bordure colorée à gauche de chaque pastille dans la popup : vert `#2E7D32` (exploité), gris `#9E9E9E` (non exploité), rouge `#C62828` (absent de la base, régime B). Jaune-orangé `#EAB400` préservé pour les champs `SYS`. Distinction des champs spécifiques (`categorie = "specifique"`) par `font-style: italic` sur le libellé — combinable avec n'importe quelle couleur de bordure sans surcharger l'UI. |
| **Q20 (V2.5)** | **Popup d'alerte au désalignement** | Affichée à l'ouverture du Designer en régime B si au moins un champ exploité a `presenteEnBase = Faux`. Liste des libellés concernés, un par ligne. Bouton OK unique, non bloquante. Un seul affichage par session de Designer (flag `alerteDesalignementAffichee` réinitialisé à chaque `loadFromWebDev`). |
| **Q21 (V2.5 / L18)** | **Correspondance dynamique libellé modèle ↔ base BDD** | Cf. §7.11. Le matching se fait par LIBELLÉ (pas par nom technique) via `__stOperation.taaBaseChamp[champ.libelle]`. Recalcul à chaque ouverture du Designer, jamais persisté. Le modèle reste générique. Les marqueurs `@LOCAL_<localId>@` du contenu sont stables. Les valeurs injectées sous clé `LOCAL_<localId>` dans `donneesApercu` (étape D) permettent au pipeline BAT de résoudre les marqueurs avec les vraies valeurs de la colonne base. |
