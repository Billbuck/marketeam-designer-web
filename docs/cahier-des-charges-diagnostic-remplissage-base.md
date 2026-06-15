# Cahier des charges — Diagnostic de remplissage de la base (Check)

**Chantier 2**
Version 1.0 — 15/06/2026
Statut : fond verrouillé — points techniques à objectiver (prompt d'analyse).

> Reformulation du chantier initial. Le besoin de départ (« contrôle des champs
> QR/code-barres vides ») a été **élargi** par le donneur d'ordre en un
> **diagnostic de remplissage de toute la base**, sur tous les champs utilisés.
> Raison : le système ne peut pas juger ce qui est « essentiel » aux yeux de
> l'utilisateur (un champ vide n'est pas forcément un problème : Adresse 2,
> l'email d'une vCard…). Il fournit donc un **fait objectif** — le taux de
> remplissage — et **laisse l'utilisateur décider** (ex. réimporter une base
> incomplète).

---

## 0. Objectif

Donner à l'utilisateur un **diagnostic objectif** de la qualité de remplissage de
sa base, pour les champs réellement utilisés dans ses documents, afin qu'il
décide lui-même des actions (réimport, correction…). **Le système n'impose
aucune valeur et ne juge pas ce qui est essentiel.**

---

## 1. Nature du contrôle

- **Diagnostic, NON bloquant en soi.** Il informe, il ne refuse rien.
- Lancé **à la demande** au clic sur le bouton **Check** (`btnVerifieConcordance`,
  page `pgeLtrContenu`), **en plus** de la vérification de concordance existante,
  **uniquement si une base est présente**.
- **Non bloquant à la création** d'une opération.
- En revanche : **avoir effectué le Check devient obligatoire AVANT de valider**
  l'opération (verrou procédural, cf. §5) — pour forcer la prise de conscience,
  jamais pour dicter les valeurs.
- Doit aussi être lançable **hors tunnel, depuis le dashboard**.

---

## 2. Périmètre des champs analysés

**Tous les champs réellement insérés dans l'ENSEMBLE des documents de
l'opération** (pas tous les champs de la base, pas un seul document).

- Source : `cpDesigner.CollecteChampsInseresDocument` (collecte déjà les champs
  insérés, QR/code-barres compris), à **agréger sur tous les documents** (le mode
  « tous documents » existe déjà : `VerifieConcordanceBaseDesigner(stOperation, 0)`).
- Un champ utilisé dans plusieurs documents = compté une fois.

---

## 3. Données produites par champ

Pour chaque champ utilisé, le diagnostic fournit :

| Donnée | Description |
|---|---|
| **Libellé** | Nom lisible du champ. |
| **Taux de remplissage** | % d'enregistrements où la valeur est non vide → affiché en **jauge**. |
| **Min** | selon le type (voir ci-dessous). |
| **Max** | selon le type (voir ci-dessous). |

**En-tête du rapport** : nombre total d'enregistrements analysés.

### 3.1 Min / Max — pilotés par le type du champ (`structBaseChamp.Type`)

Même aiguillage par type que le reste du projet :

- **Texte** (TXT, EML, URL, CDP, ALG, TEL, SMS…) → **longueur** (nb de caractères)
  min/max. Repère une anomalie de taille (ex. un prénom à 180 caractères).
- **Numérique** (ENT, DEC, MON) → **valeur** min/max. Repère un montant aberrant.
- **Date** (DAT) → **valeur** min/max. Repère une date hors plage (ex. 1850).
- **Coordonnée** (COO), **Heure** (TIM), **Image** (IMG) → à trancher au cas par
  cas (a priori longueur ou non pertinent — à objectiver).

### 3.2 Définition de « vide » (taux de remplissage)

- Vide = `NULL` **ou** chaîne vide `""`.
- **Conséquence du « 0 » à l'import** : un champ numérique vide/invalide devient
  `"0"` à l'import (`CleanNumerique`) → **jamais vide** → taux ≈ **100 %**.
  C'est **assumé** : pour les numériques, c'est le **min/max de valeur** qui est
  l'information utile, pas la jauge.
- Le taux est donc surtout parlant pour les champs **texte** (email, champs
  métier…) — exactement la cible du besoin.

> Contexte d'import (acté) : seuls les enregistrements ayant une **adresse valide**
> (Code Postal + Ville + au moins une ligne d'adresse) sont chargés en base. Le
> « 100 % » est donc relatif à cette base déjà filtrée ; les champs d'adresse
> essentiels sont garantis présents.

---

## 4. Déclenchement (deux entrées)

1. **Tunnel** : bouton Check `btnVerifieConcordance` (`pgeLtrContenu`). Après /
   à côté de la concordance, si une base est présente → exécuter le diagnostic et
   afficher le rapport.
2. **Dashboard** : même diagnostic lançable hors tunnel (entrée à objectiver —
   où et comment sur le dashboard).

---

## 5. Verrou « Check effectué » (avant validation)

- **Mémoriser sur l'opération** qu'un Check a été effectué (ex. un horodatage
  `DateHeureCheckRemplissage` — nom à confirmer).
- **Réinvalider** ce marqueur dès que **la base change** (réimport, ajout/retrait
  d'une base, changement de filtre) — sinon on validerait sur un diagnostic
  périmé. **Même patron que la validation**, déjà annulée si l'opération est
  modifiée.
- **`OpérationPrêtePourValidation`** bloque la validation tant que le Check n'a pas
  été (re)fait depuis le dernier changement de base.
- Le verrou porte sur le **fait d'avoir regardé** le diagnostic, **pas** sur son
  résultat : l'utilisateur peut valider même avec un taux faible (il a pris sa
  décision en connaissance de cause).

---

## 6. Points techniques à objectiver (prompt d'analyse Cursor)

1. **Collecte agrégée** : confirmer comment réutiliser `CollecteChampsInseresDocument`
   en mode « tous documents » pour obtenir la liste unique des champs utilisés +
   leur libellé + leur type fin (`structBaseChamp.Type`).
2. **Requête SQL de diagnostic** :
   - sur **quelle table** (rappel du modèle : `clt_base_ligne` = source,
     `dos_base_ligne` = copie de travail ; `ChargeEchantillonTabBaseLigne` lit
     l'une ou l'autre selon `EstAjoute`) — mais **sans `LIMIT 20`**, sur **toute**
     la base, avec le **même WHERE** (bases, filtres) ;
   - **COUNT** des non-vides / total par colonne, + **MIN/MAX** par colonne ;
   - **Caveat stockage chaîne** : dates en `AAAAMMJJ` (tri texte correct),
     numériques à **virgule décimale** (tri texte **incorrect** → `CAST`/conversion
     nécessaire), longueurs via `CHAR_LENGTH`. À cadrer par type.
   - **Performance** : viser **une seule requête** calculant toutes les colonnes
     utilisées en une passe, plutôt qu'une requête par champ.
3. **Verrou « Check effectué »** : où persister le marqueur (champ sur
   `dos_operation` ?), et **où l'invalider** (points du code où la base change :
   `AjouteBaseDeDonnées`, retrait de base, réimport, filtre).
4. **Entrée dashboard** : où et comment déclencher le même diagnostic hors tunnel.
5. **Structure de retour** : définir la structure produite par la procédure
   serveur (ex. `structRemplissageBase` = nb enregistrements + tableau de
   `structRemplissageChamp` { Libelle, Champ, Type, NbRenseignes, NbTotal, Taux,
   Min, Max }) — consommée par la popup.

---

## 7. UI (à détailler après le fond)

- Nouvelle **popup** plus riche que la popup texte actuelle : **zone répétée /
  table** avec une **jauge** par champ + colonnes Min / Max.
- En-tête : nombre d'enregistrements analysés.
- Le serveur fournit la **donnée** (§6.5) ; la construction de la popup est côté
  WebDev.

---

## 8. Hors périmètre

- Le diagnostic ne **bloque jamais** sur un taux faible (seul le **fait de l'avoir
  lancé** est requis avant validation).
- Le système ne décide pas quels champs sont « obligatoires » / « essentiels ».
- Pas de configuration de règles par l'utilisateur.

---

## 9. Décisions actées

- **Recadrage** : du « contrôle QR/code-barres vides » vers un **diagnostic de
  remplissage de toute la base** sur les champs utilisés — 15/06/2026.
- **Ancrage objectif** : taux de remplissage + min/max, **jamais** un jugement
  « essentiel » (impossible à deviner) — 15/06/2026.
- **Min/Max par type** : longueur (texte) / valeur (numérique, date) — 15/06/2026.
- **Non bloquant** à la création ; **Check obligatoire avant validation** (verrou
  procédural, invalidé si la base change) — 15/06/2026.
- **Double entrée** : tunnel (bouton Check) + dashboard — 15/06/2026.
- **Modèle de données** (rappel) : `clt_base*` (source) **injecté dans** `dos_base*`
  (copie de travail), jamais l'inverse.
