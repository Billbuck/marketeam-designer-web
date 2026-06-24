# Cahier des charges — Export CSV de production (Marketeam, Volet A)

**Statut :** contrat à valider avant implémentation.
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

- **Répertoire :** le répertoire `Bases` de l'opération, obtenu par
  `cpProjet.CheminFichier(pIdOperation, __REP_BASE__)`.
  Appelé depuis l'application WinDev de l'atelier, ce chemin est automatiquement le
  chemin réseau du serveur web (rien à transformer).
- **Nom :** `<Dossier>.csv`, où `<Dossier>` = `dos_operation.Dossier`.

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

### 4.1 Périmètre
Sont exportées **les colonnes définies dans la base** de l'opération
(`__stOperation.taaBaseChamp` / `dos_base_champ`) :
- les **champs standards** réellement présents (Civilite, Nom, Prenom, Societe,
  Enseigne, Contact, Reference, Adresse1-4, CodePostal, Ville, Pays, Tel, Portable,
  Email…) ;
- les **champs spécifiques** définis (Champ1…Champ30 renommés par leur libellé).

Plus deux colonnes techniques **systématiques** (dans **tous** les exports) :
- **`Code`** — code unique par destinataire (`dos_base_ligne.Code`), utilisé par le
  **QR interactif** en production (`@Code@`). Sans risque même hors opération interactive.
- **`Sequentiel`** — voir §4.3.

### 4.2 Noms des colonnes (en-têtes) — concordance stricte avec le PSMD
- **Champs standards** : nom standard inchangé (`Civilite`, `Nom`, `Adresse1`,
  `CodePostal`, `Ville`…), comme le PSMD.
- **Champs spécifiques** : libellé client passé par `Partage.SanitiseNomPsm`
  (ex. « Véhicule » → `Vehicule`, « Date de livraison » → `Date_de_livraison`),
  **exactement comme le PSMD**.
- **`Code`**, **`Sequentiel`** : inchangés.

**Principe de concordance :** les en-têtes réutilisent la **même logique de nommage**
que le PSMD — `Partage.SanitiseNomPsm` et, pour les spécifiques, le mapping
`Partage.ConstruireMappingPsmLibelle` (source unique déjà partagée par le PSMD et le
BAT). Par construction, **noms et casse sont identiques PSMD ↔ CSV**.

> **Point de vigilance (implémentation) :** quand deux libellés se réduisent au même nom
> sanitisé, `SanitiseNomPsm` ajoute un suffixe (`_2`, `_3`). Pour que le CSV et le PSMD
> attribuent ces suffixes **à l'identique**, l'export doit s'appuyer sur la même source de
> mapping et le même ordre de traitement que le PSMD (réutilisation de
> `ConstruireMappingPsmLibelle`).

### 4.3 Le séquentiel
- **Rôle :** repère pour **l'opérateur** — suivre l'avancement de la production et gérer
  la **séparation des lots**. Ce n'est pas un identifiant de fusion du document.
- **Continu sur toute l'opération**, du premier au dernier destinataire (une seule base).
- **Démarre à 1**, incrément de 1, dans l'ordre d'export.
- **Format : zéros en tête, largeur = nombre de chiffres du total de destinataires.**
  - 850 destinataires → `001` … `850`
  - 12 400 destinataires → `00001` … `12400`

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
| Encodage | **Windows-1252 (ANSI)** — conversion depuis UTF-8 |
| Séparateur de colonnes | **virgule** `,` |
| Encadrement des champs | **guillemets doubles sur TOUS les champs** (en-têtes + valeurs) ; guillemets internes doublés (`"` → `""`) |
| Fin de ligne | **CR+LF** (retour Windows) |
| 1re ligne | **en-têtes** (noms ci-dessus) |
| Lignes suivantes | **une par destinataire** |

La **virgule** comme séparateur fonctionne malgré la virgule décimale française
(`4 587,10 €`) **parce que chaque champ est entre guillemets**. La combinaison
« virgule + guillemets partout » est conservée telle quelle.

---

## 7. La procédure

- **Forme :** une procédure **partagée** (collection `Partage`), donc appelable aussi
  bien depuis WebDev que depuis l'application WinDev de l'atelier.
- **Entrée :** `pIdOperation`.
- **Sortie :** le **chemin complet** du CSV produit (ou vide en cas d'échec), pour que
  l'appelant l'inscrive ensuite dans le PSMD.
- **Déclenchement :** depuis l'interface de production (bouton « Générer le projet »).
  Le déclenchement lui-même relève du **chantier interface**, pas de celui-ci : ici on
  livre la procédure d'export, réutilisable.

---

## 8. Hors périmètre (chantiers liés)

- **`Rapprochement`** : colonne à **valeur fixe** (identique pour toute l'opération),
  dont la **source reste à définir** (vraisemblablement l'interface de production).
  Ajoutée au CSV dans le chantier rapprochement.
- **`Timbre`** : **PAS une valeur fixe**. C'est un **Datamatrix** (sur le document ou
  l'enveloppe) réunissant le **séquentiel postal**, le **montant d'affranchissement
  unitaire** et le **code Alliage**. Ce sera donc une **colonne générée**, traitée dans
  le **chantier Timbre**.
- **Brancher le CSV dans le PSMD** (renseigner la section « fichier de données ») =
  chantier **finalisation du PSMD**. Nécessite les codes attendus par Printshop, à
  obtenir via un PSMD de référence créé dans Printshop Mail.
- **Interface et bouton de déclenchement** = chantier interface de production.

> **Évolution future :** marqueur de **séparation de lots**. L'opérateur définit dans
> l'interface une taille de lot (ex. 435 plis, calculée selon le poids et l'épaisseur du
> pli fini) ; le système marque chaque multiple atteint (`00435`, `00870`…). Hors
> périmètre de l'export, mais l'export du séquentiel en est le socle.

---

## 9. Concordance garantie (résumé)

Même fonction de nommage des deux côtés (`SanitiseNomPsm` + `ConstruireMappingPsmLibelle`)
→ **en-têtes CSV = variables PSMD**. Mêmes valeurs formatées qu'au BAT
(`FormateValeurSortie`) → cohérence écran / BAT / production. Même format de fichier que
le BAT → Printshop lit le CSV de production comme celui du BAT.
