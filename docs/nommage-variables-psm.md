# Contrat de nommage des variables PSM — libellés des champs spécifiques

> **SOURCE DE VÉRITÉ du nommage des variables PrintShop Mail.**
> Rédigé le 10/06/2026 (Piste 1 validée à l'issue de l'analyse de la
> conversation Designer/PSMD). Ce contrat s'impose à tous les flux qui
> émettent des noms de colonnes ou de variables vers PrintShop Mail,
> **y compris le futur module d'export CSV de production**.

---

## 1. Objectif

Le PSMD et les données de fusion (BAT aujourd'hui, export production
demain) parlent le **libellé du champ** — `@Vehicule@`,
`@Date_de_livraison@` — et **plus jamais la colonne physique**
(`@Champ1@`, `@Champ2@` de `clt_base_ligne`).

Besoin d'origine (responsable de production) : pouvoir **vérifier
visuellement à l'atelier** la cohérence entre les variables du PSMD
ouvertes dans PrintShop Mail et les colonnes du fichier de données.

## 2. Contexte décisif

- Le **module d'export CSV de production N'EXISTE PAS ENCORE** (dernière
  étape du projet). Le présent contrat **s'impose à lui** : il DEVRA
  produire ses en-têtes de colonnes via `Partage.SanitiseNomPsm()` (même
  fonction, mêmes entrées) pour garantir l'égalité stricte
  variables PSMD ↔ en-têtes CSV.
- Le commentaire historique de `GenererPsmdServeurDocument.txt` (L18/A44,
  anciennes lignes ~52-53) affirmait que la production chargeait un CSV
  aux noms techniques (`Civilite, Champ3, Champ4…`) : **obsolète, corrigé
  le 10/06/2026** — il décrivait un export qui n'a jamais été construit.
- Par construction (même fonction de nommage des deux côtés), **la casse
  et les noms sont identiques** entre PSMD et CSV : les inconnues PSM
  (sensibilité à la casse du matching, en-têtes avec espaces) sont
  **neutralisées** sans test préalable.

## 3. Règle `Partage.SanitiseNomPsm(sLibelle, sNomsReserves)`

Étapes appliquées au libellé d'origine, dans l'ordre :

1. **Translittération des accents** : `é→e`, `à→a`, `ç→c`, `ô→o`…
   (via `SansAccent()` WLangage).
2. **Tout caractère hors `[A-Za-z0-9_]` → `_`** — **LES ESPACES AUSSI**
   (les en-têtes CSV avec espaces ne sont pas testés dans PSM, on ne s'y
   aventure pas). Ex. : « Date de livraison » → `Date_de_livraison`.
3. **Compactage des `__`** (doubles underscores) en `_` : protège le
   mécanisme des suffixes de formatage `__MAJ` / `__MIN` / `__PRO` /
   `__DATE1..6` — un nom sanitisé ne peut JAMAIS contenir `__`, le
   découpage `@Nom__SUF@` reste donc sans ambiguïté.
4. **Nettoyage** : suppression des `_` de tête et de queue ; si le
   résultat est vide → `Champ` (puis unicité ci-dessous).
5. **Unicité vs liste réservée** (comparaison **insensible à la casse**) :
   si le nom est déjà pris → suffixe `_2`, `_3`…
   La liste réservée comprend :
   - les **standards** (`StructBaseLigne`) : `Reference`, `Societe`,
     `Enseigne`, `Contact`, `Civilite`, `Nom`, `Prenom`, `Adresse1..4`,
     `CodePostal`, `Ville`, `Pays`, `Tel`, `Portable`, `Email`, `Code`,
     `CodeAlliage`, `Sexe`, `Profil` ;
   - les **colonnes physiques** `Champ1..Champ30` (évite toute ambiguïté
     si un client nomme un champ « Champ3 ») ;
   - les **SYS** : `Sequentiel`, `Timbre`, `Rapprochement` ;
   - les **noms du générateur** : `Image`, `Zone_Image` (les noms réels
     `Image N` / `Zone Image …` contiennent des espaces, donc aucune
     collision possible après l'étape 2 — réservés par précaution) ;
   - les **autres libellés déjà émis** dans le même document (la liste
     s'enrichit au fil du mapping).

> **Note (10/06/2026)** : l'interface back-office interdit déjà la création
> d'un champ portant le nom d'une colonne standard. La règle d'unicité de
> `SanitiseNomPsm` reste néanmoins en place (**ceinture de sécurité**) :
> elle couvre les collisions **post-sanitisation** (« Véhicule » /
> « Vehicule » → même nom) et les noms réservés du générateur, et
> **s'imposera au futur module d'export production**.

### Exemples

| Libellé client | Nom PSM émis |
|---|---|
| Vehicule | `Vehicule` |
| Véhicule | `Vehicule` |
| Date de livraison | `Date_de_livraison` |
| Prix T.T.C. | `Prix_T_T_C` |
| Nom (collision standard) | `Nom_2` |
| Véhicule + Vehicule (2 champs) | `Vehicule` + `Vehicule_2` |

Le jeu de caractères résultant (`[A-Za-z0-9_]`) est un sous-ensemble
strict de ce qu'accepte la regex d'extraction du générateur PSMD
(`extractMergeFields`, `psmd-generator.js` : `[A-Za-z0-9_ ]`) et de
l'encodage RTF ASCII (aucun `\'XX`).

## 4. Architecture — source unique du mapping

`Partage.ConstruireMappingPsmLibelle(sJsonDesignerData)` est la
**SEULE** procédure qui construit le mapping
`"LOCAL_<localId>" → libellé sanitisé`, à partir de :

- `champsFusion[*]` du JSON Designer (`localId` réel + `libelle`) ;
- `__stOperation.taaBaseChamp[libelle]` (existence d'une correspondance
  base — les champs spécifiques **non mappés** restent en `LOCAL_xxx`,
  comportement inchangé) ;
- `SanitiseNomPsm()` avec la liste réservée du §3, enrichie au fil de
  l'eau (unicité intra-document).

Consommateurs (pas deux logiques — toujours cette procédure) :

| Consommateur | Usage |
|---|---|
| `GenererPsmdServeurDocument` | Substitutions string sur la copie JSON (motifs a, a2, b, c) : `@LOCAL_xxx@` → `@Vehicule@`, `@LOCAL_xxx__MAJ@` → `@Vehicule__MAJ@`, `"key"`, `"champFusion"` → tout le PSMD (variables, alias, data_fields, expressions QR/images) suit mécaniquement |
| `GenererBatDocumentDepuisPsmd` | **Ajout** des paires `{libellé sanitisé, valeur}` dans `tabPrintshopData` (en plus des paires `ChampN` / `LOCAL_xxx` existantes, conservées pour l'aperçu écran et la rétro-compatibilité du canal BAT) |
| Module d'export production (futur) | En-têtes de colonnes du CSV = mêmes noms, via le même mapping |

## 5. Hors périmètre / invariants

- **Champs standards inchangés** (`Civilite`, `Nom`, `Ville`… déjà
  lisibles) — le mapping ne contient que les spécifiques à `localId` réel.
- **SYS inchangés** (`Sequentiel`, `Timbre`, `Rapprochement`).
- **JSON Designer stocké intact** : embeds `LOCAL_xxx` (doctrine de survie
  aux changements de base), `champsFusion[*].nom = ChampN` — la bascule
  se fait uniquement sur la copie temporaire envoyée à `psmd_cli.js` et
  dans les données BAT.
- **`script.js` et `psmd-generator.js` non modifiés** ; contrat Phase 0
  (grammaire `<variable>`) inchangé.
