# Cahier des charges — Export CSV de production (Marketeam, Volet A)

**Statut :** validé. Procédure implémentée (`Partage.ExporteBaseOperationCsv`),
testée en écriture sur le Bureau. Reste : emplacement final + branchement dans le PSMD.
**Périmètre :** la procédure qui exporte la base d'une opération Courrier en CSV,
prête à être lue par Printshop Mail à l'atelier. Première brique du module de production.

---

## 1. Objectif

Produire, pour une opération, **un fichier CSV** des destinataires :
- **lisible directement par Printshop Mail** (format aligné sur celui du BAT, qui
  fonctionne déjà) ;
- dont les **noms de colonnes sont identiques aux variables du PSMD** (vérification
  visuelle à l'atelier + correspondance automatique des champs).

Le PSMD pointera ensuite vers ce CSV (étape de finalisation, traitée à part).

---

## 2. Emplacement et nom du fichier

- **Cible finale :** le répertoire `Bases` de l'opération, obtenu par
  `cpProjet.CheminFichier(pIdOperation, __REP_BASE__)`. Appelé depuis l'application
  WinDev de l'atelier, ce chemin est automatiquement le chemin réseau du serveur web
  (rien à transformer).
- **Nom :** `<Dossier>.csv`, où `<Dossier>` = `dos_operation.Dossier`.
- **Étape de test actuelle :** écriture sur le **Bureau** (`SysRep(srBureau)`) ;
  l'emplacement final (`Bases`) sera branché ensuite.

---

## 3. Source des données

- Table `dos_base_ligne` de l'opération.
- **Une seule base au final :** même si l'utilisateur a sélectionné plusieurs sources
  `clt_base`, elles sont fusionnées en **une seule** base de travail. Il n'y a donc
  jamais de question de « plusieurs bases » à l'export.
- `dos_base_ligne` ne contient déjà **que les destinataires à adresse valide** (filtrés
  à l'injection par `EnregistrementBase`). Aucun filtrage supplémentaire à prévoir.
- **Une ligne CSV par destinataire.**

---

## 4. Colonnes exportées

### 4.1 Périmètre et ordre
Ordre des colonnes : **`Sequentiel`**, **`Code`**, puis les colonnes de la base.
(L'ordre est sans incidence fonctionnelle — Printshop apparie par **nom** de colonne,
pas par position — mais il est fixé ainsi pour la lisibilité à l'atelier.)

- **`Sequentiel`** (systématique) — voir §4.3.
- **`Code`** (systématique) — code unique par destinataire (`dos_base_ligne.Code`),
  utilisé par le **QR interactif** en production (`@Code@`). Sans risque même hors
  opération interactive.
- **Colonnes de la base** définies (`taaBaseChamp` / `dos_base_champ`) :
  - **champs standards** présents (Civilite, Nom, Prenom, Societe, Enseigne, Contact,
    Reference, Adresse1-4, CodePostal, Ville, Pays, Tel, Portable, Email…) ;
  - **champs spécifiques** définis (Champ1…Champ30 renommés par leur libellé).

### 4.2 Noms des colonnes (en-têtes) — concordance stricte avec le PSMD
- **Champs standards** : nom standard inchangé (`Civilite`, `Nom`, `Adresse1`,
  `CodePostal`, `Ville`…), comme le PSMD.
- **Champs spécifiques** : libellé client passé par `Partage.SanitiseNomPsm`
  (ex. « Véhicule » → `Vehicule`, « Date de livraison » → `Date_de_livraison`),
  **exactement comme le PSMD**.
- **`Code`**, **`Sequentiel`** : inchangés.

**Principe de concordance :** les en-têtes appliquent `Partage.SanitiseNomPsm` au
libellé de chaque colonne, avec **la même liste de noms réservés** que
`Partage.ConstruireMappingPsmLibelle` (qui nomme les variables du PSMD et du BAT).
Par construction, **noms et casse sont identiques PSMD ↔ CSV**, suffixes `_2`/`_3`
compris.

> **Parité des listes réservées :** la liste réservée existe en deux exemplaires
> (dans `ConstruireMappingPsmLibelle` et dans l'export). Elles **doivent rester
> identiques**. Décision actée : `Image` a été retiré des **deux** listes (un champ
> client « Image » garde donc son nom `Image` ; les vraies zones du générateur
> s'appellent « Image N » / « Zone Image … » avec espaces, donc sans collision). Toute
> modification future d'une liste doit être répercutée sur l'autre — ou, mieux, les deux
> devraient à terme lire une **source unique**.

### 4.3 Le séquentiel
- **Rôle :** repère pour **l'opérateur** — suivre l'avancement de la production et gérer
  la **séparation des lots**. Ce n'est pas un identifiant de fusion du document.
- **Continu sur toute l'opération**, du premier au dernier destinataire (une seule base).
- **Démarre à 1**, incrément de 1, dans l'ordre d'export.
- **Format : zéros en tête sur une largeur FIXE de 6 chiffres** (`000001`, `000002`…
  jusqu'à `999999` ; au-delà, le nombre s'étend automatiquement). Choix délibéré, plus
  simple qu'une largeur variable et compatible avec l'évolution « séparation de lots ».

---

## 5. Valeurs

- Chaque valeur passe par **`Partage.FormateValeurSortie(valeur, type)`**.
- Le **type** de chaque colonne vient de `taaBaseChamp` (`structBaseChamp.Type`).
- Rappels du contrat de formatage : dates en **AAAAMMJJ brut**, coordonnées brutes,
  numériques avec espace insécable (`1 234`, `4 587,10 €`), téléphones `0X XX XX XX XX`,
  texte / email / URL / code postal inchangés.
- **`Code`** : pass-through (texte). **`Sequentiel`** : tel que formaté en §4.3.
- Colonne vide → valeur vide (champ `""`).

---

## 6. Format physique du fichier (identique au BAT)

Aligné sur ce que l'API du BAT (`psm_marketeam_jpg.php`) fabrique et que Printshop lit
déjà sans problème :

| Élément | Valeur |
|---|---|
| Encodage | **Windows-1252 (ANSI)** |
| Séparateur de colonnes | **virgule** `,` |
| Encadrement des champs | **guillemets doubles sur TOUS les champs** (en-têtes + valeurs) ; guillemets internes doublés (`"` → `""`) |
| Fin de ligne | **CR+LF** (retour Windows) |
| 1re ligne | **en-têtes** |
| Lignes suivantes | **une par destinataire** |

La **virgule** comme séparateur fonctionne malgré la virgule décimale française
(`4 587,10 €`) **parce que chaque champ est entre guillemets**.

> **Encodage — note technique :** le projet WinDev/WebDev est déclaré en **ANSI**. Les
> chaînes sont donc nativement en Windows-1252, et l'écriture du fichier sort directement
> au bon encodage — **aucune conversion `UnicodeVersAnsi` n'est nécessaire** (en ajouter
> une sur une chaîne déjà ANSI serait inutile, voire risqué). Vérifié sur un export réel
> (accents et `€` corrects en Windows-1252).

---

## 7. La procédure

- **Nom :** `Partage.ExporteBaseOperationCsv(pIdOperation)`.
- **Forme :** procédure **partagée**, appelable depuis WebDev comme depuis l'application
  WinDev de l'atelier.
- **Chargement :** `Partage.ChargeStructOperation(pIdOperation)` (peuple `tabBase` +
  `taaBaseChamp`).
- **Sortie :** le **chemin complet** du CSV produit (ou `""` en cas d'échec), pour que
  l'appelant l'inscrive ensuite dans le PSMD.
- **Déclenchement :** depuis l'interface de production (bouton « Générer le projet »).
  Le déclenchement relève du **chantier interface**, pas de celui-ci.

---

## 8. Hors périmètre (chantiers liés)

- **`Rapprochement`** : colonne à **valeur fixe** (identique pour l'opération), source à
  définir (vraisemblablement l'interface de production). Chantier rapprochement.
- **`Timbre`** : **PAS une valeur fixe**. C'est un **Datamatrix** (sur le document ou
  l'enveloppe) réunissant le **séquentiel postal**, le **montant d'affranchissement
  unitaire** et le **code Alliage** ; ce sera une **colonne générée**, traitée au
  **chantier Timbre**.
- **Emplacement final** (`Bases` via `CheminFichier`) : à brancher après le test Bureau.
- **Brancher le CSV dans le PSMD** (renseigner la section « fichier de données ») =
  chantier **finalisation du PSMD**. Nécessite les codes attendus par Printshop, à
  obtenir via un PSMD de référence créé dans Printshop Mail.
- **Interface et bouton de déclenchement** = chantier interface de production.

> **Évolution future :** marqueur de **séparation de lots**. L'opérateur définit dans
> l'interface une taille de lot (ex. 435 plis, selon le poids et l'épaisseur du pli
> fini) ; le système marque chaque multiple atteint. Le séquentiel en est le socle.

---

## 9. Concordance garantie (résumé)

Même fonction de nommage et **même liste réservée** des deux côtés (`SanitiseNomPsm`)
→ **en-têtes CSV = variables PSMD**. Mêmes valeurs formatées qu'au BAT
(`FormateValeurSortie`) → cohérence écran / BAT / production. Même format de fichier que
le BAT (et projet ANSI → Windows-1252 natif) → Printshop lit le CSV de production comme
celui du BAT.
