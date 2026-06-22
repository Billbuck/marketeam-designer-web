# Cahier des charges — QR Code interactif : URL de test vs production (Marketeam)

**Statut :** contrat validé avant implémentation. Périmètre : Volet B du back office de production.
**Décision donneur d'ordre :** approche 1 retenue (préparation de la page de test à l'enregistrement).

---

## 1. Objectif

Le QR interactif est aujourd'hui **fictif** : il contient le placeholder `https://landing.marketeam.fr/REMPLACER`
(posé par `RemplirDesignerZoneSystemeQrInteractif`, zone `sys-qr-cliquezici`).

Le travail consiste à **remplacer ce placeholder par la vraie URL courte redirectrice**, en distinguant
le **BAT (test)** de la **production**. Aucune donnée nouvelle à créer : la page de test, le code par
destinataire et la page de production existent déjà.

---

## 2. Mécanisme acquis (rappel)

Le QR porte un **lien court redirecteur** `cliquez.info/<code>` (paramètre `Url_CliquezIci` :
`clic.info` en dev, `cliquez.info` en prod), **et non** l'URL longue `index.awp?P2=…`
(celle-ci ne sert qu'à l'aperçu écran dans l'iframe).

| | URL dans le QR | `<code>` utilisé | Variable ? | Page servie |
|---|---|---|---|---|
| **BAT (test)** | `cliquez.info/@<code>` | `base62(IdStructure)` de `tmp_structure` | non — fixe pour tout le BAT | `tmp_structure` / `tmp_structure_bloc` |
| **Production** | `cliquez.info/<code>` | `dos_base_ligne.Code = base62(IdBaseLigne)` | oui — un par destinataire | `ope_cliquezici` / `ope_cliquezici_bloc` |

Le **`@`** est un caractère littéral qui signale au serveur landing « c'est un test ». Il disparaît en prod.

Acquis sans nouveau code :
- `dos_base_ligne.Code` est déjà généré par `EnregistrementBase` à l'injection `clt_base → dos_base`
  (y compris pour les opérations non interactives).
- La page de production est déjà écrite par `AjoutModificationNouveauCliquezIci` dans `ope_cliquezici`.
- `GenereTmpStructure(…, bRenvoiCode = Vrai)` fabrique la page de test et renvoie son code court.

---

## 3. Approche retenue — approche 1 (préparation à l'enregistrement)

Justification : le test emprunte **exactement le même canal** que la production
(`cliquez.info/<code>`, le `@` étant le seul différenciateur). Un seul mécanisme, déjà éprouvé côté SMS,
cohérent test/prod, sans second dispositif dédié au test.

À chaque **enregistrement d'une opération Courrier interactive** :
1. générer la page de test via `GenereTmpStructure(stNouveauCliquezIci, IdOperation, bRenvoiCode = Vrai)`
   et récupérer le **code court** ;
2. composer l'URL de test `Url_CliquezIci + "@" + code` ;
3. associer cette URL au QR `sys-qr-cliquezici` des documents de l'opération.

Résultat attendu : depuis la page d'accueil (liste des opérations en cours), l'utilisateur scanne le QR du
BAT et **sa page de test s'ouvre réellement**, déjà prête.

*Approche 2 (QR fixe appelant un webservice qui génère la page au scan) écartée : introduit un second
mécanisme existant uniquement pour le test, pour un bénéfice limité au BAT.*

---

## 4. Comportement attendu

### 4.1 BAT (test)
Contenu encodé dans le QR = `cliquez.info/@<code_test>`, **identique** pour tous les exemplaires du BAT.

### 4.2 Production
Contenu encodé dans le QR = `cliquez.info/@Code@` où `@Code@` est un **champ de fusion** résolu
par destinataire à la fusion → donne `cliquez.info/<code>` (sans `@`) sur chaque courrier.

### 4.3 Substitution du placeholder
Le placeholder `…/REMPLACER` est remplacé **au moment de la génération** (BAT puis production), pas figé
dans le JSON Designer stocké. Le contenu réel du QR n'existe donc qu'au niveau du document généré.

---

## 5. Point de vigilance

`tmp_structure` est une table de travail. La page de test ne doit **pas** être purgée tant que le BAT
d'une opération active reste consultable depuis la page d'accueil, sinon le QR de test pointe dans le vide.
À sécuriser (durée de vie longue, ou non-purge des structures liées à une opération en cours).

---

## 6. Jonction avec le Volet A (export de production)

Pour que `@Code@` se résolve en prod, le champ `Code` du destinataire doit être **présent à la fusion
PSMD de production** — donc sorti par le futur module d'export. À traiter dans le Volet A ; simplement acté ici.

---

## 7. À confirmer dans le code réel par Cursor (avant implémentation)

1. **Point d'injection exact** : où le contenu du QR `sys-qr-cliquezici` est transformé en image dans la
   génération du **BAT** (et de la production), pour y poser l'URL sans modifier le JSON Designer stocké.
2. **Canal du champ de fusion** : confirmer que le QR interactif peut porter `@Code@` jusqu'au PSMD,
   sur le modèle du QR de rapprochement (`ConstruireZoneQrRapprochement`, `sourceType = "champ"` /
   `champFusion`).
3. **Deux détails** : que `Url_CliquezIci` renvoie bien le domaine attendu selon l'environnement, et que
   `GenereTmpStructure(…, bRenvoiCode = Vrai)` renvoie le code court de test.

---

## 8. Hors périmètre

- Création de l'export de production (Volet A).
- Modification des pages de test ou de production (déjà existantes).
- QR de rapprochement (`sys-qr-rapprochement`) — distinct du QR interactif.
