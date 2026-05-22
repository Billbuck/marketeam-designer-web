# Correctifs L5 → livrable L6

> Note de remontée à Cursor suite aux tests utilisateur du livrable L5.
>
> À traiter **conjointement** avec l'amendement V2.4 du cahier des charges (document séparé `amendement-V2.4-cahier-des-charges.md`).
>
> Cursor doit produire un **livrable L6** qui couvre : intégration de la V2.4 dans la spec, correction des bugs, mise en œuvre des évolutions UX.

---

## A — Bugs L5 à corriger

### A7 — Bouton sidebar « Champs » avec triple état non intuitif

**Observé** :
1. Clic 1 sur bouton → popup ouvre, bouton actif (fond coloré).
2. Clic ailleurs → popup ferme, **bouton reste actif** (fond coloré) ← bug.
3. Clic 2 sur bouton → popup n'ouvre pas, bouton devient inactif.
4. Clic 3 sur bouton → popup ouvre, etc.

L'utilisateur perçoit cela comme un toggle à deux clics, ce qui est désorientant.

Par ailleurs, on observe un effet de bord lié à l'état du bouton : si le bouton est actif (mais popup fermée), la sélection d'une zone ouvre **automatiquement** la popup « Champs de fusion » en plus de la popup « Propriétés Texte ». Cet effet de bord contredit l'esprit de la D2 (« découpler la popup de Propriétés Texte »).

**Attendu** :
- Le bouton sidebar « Champs » est un **simple toggle d'affichage** de la popup.
- Son état visuel (actif/inactif) doit refléter **strictement** l'état d'affichage de la popup. Si la popup est fermée (peu importe la raison), le bouton est inactif.
- La popup ne s'ouvre **jamais automatiquement** à la sélection d'une zone. Elle s'ouvre uniquement sur clic explicite du bouton sidebar.
- Cliquer en dehors de la popup ferme la popup ET désactive le bouton sidebar.

### A8 — Bouton corbeille grisé sur un champ standard ajouté par l'utilisateur

**Observé** : après ajout d'un champ standard via la modale (onglet Standard), le bouton corbeille de ce champ est grisé. Impossible de supprimer un champ qu'on vient pourtant d'ajouter.

**Attendu** : ce bug est résolu par le **changement de doctrine du V2.4 §1** (critère de verrouillage par `origine` et non par `nom` rempli). Un champ ajouté par l'utilisateur a `origine = "ajout"` et est donc librement supprimable. À implémenter selon la nouvelle doctrine.

### A9 — Pré-remplissage de la valeur d'échantillon non appliqué à la création

**Observé** : à la création d'un champ (standard ou spécifique), le champ « valeur d'échantillon » dans la modale est vide. L'utilisateur doit saisir lui-même une valeur, ou laisser vide.

**Attendu** : à l'ajout d'un champ, la valeur d'échantillon doit être **pré-remplie automatiquement** selon l'algorithme de résolution unifié (V2.4 §2.1) :
1. Valeur saisie par l'utilisateur si existante → conservée.
2. Sinon, valeur de la fiche utilisateur si présente dans `donneesApercu` → utilisée.
3. Sinon, placeholder par défaut (V2.4 §2.3 pour les types, §2.4 pour les champs standards) → utilisé.

### A10 — Valeurs d'échantillon codées en dur pour certains champs standards

**Observé** : certains champs standards ont une valeur d'échantillon par défaut câblée en dur dans le code existant :
- Civilité → `MME ET M`
- Nom → `Caradec`
- Prénom → rien

Ce comportement est incohérent et révèle une vieille logique héritée à harmoniser.

**Attendu** : retirer toutes les valeurs d'échantillon codées en dur du code existant du Designer. Toute valeur par défaut passe désormais par l'algorithme de résolution unifié (V2.4 §2.1) et la table de placeholders (V2.4 §2.4).

### A11 — Liste des champs standards inadaptée au métier

**Observé** : la modale d'ajout, onglet Standard, propose des champs qui ne sont pas standards dans le métier Marketeam (« N° Client », « Logo entreprise », « Photo contact »).

**Attendu** : refonte complète de `RemplirDesignerChampsStandard.txt` selon la liste métier réelle du V2.4 §2.4 (18 entrées : Civilité, Nom, Prénom, Société, Enseigne, Contact, Référence, Adresse 1 à 4, Code postal, Ville, Pays, Téléphone, Portable, Email, Code Alliage).

### A12 — En mode édition, sélection de champ accessible et inopérante

**Observé** : en mode édition d'un champ existant, la zone de sélection/combo de champ reste visible et cliquable. Cliquer dessus pour sélectionner un autre champ est sans effet — c'est une UI fantôme.

**Attendu** : en mode édition, la liste/combo de sélection de champ est **masquée** (ou figée et non actionnable). L'en-tête du formulaire indique clairement le champ en cours de modification. Cf. V2.4 §4.

---

## D — Évolutions UX

### D4 — Hauteur de la popup adaptée au contenu

**Constat** : la popup « Champs de fusion » a une hauteur fixe qui produit un **double scroll** quand le contenu dépasse :
- Scroll interne dans la liste des champs.
- Scroll global de la popup elle-même.

C'est désorientant et l'utilisateur peut perdre des éléments. Cf. capture utilisateur.

**Objectif** : la popup doit s'adapter en hauteur à son contenu. **Pas de scroll** dans le cas général.

**Garde-fou** : si le contenu dépasse la hauteur utile de l'écran (cas extrême : 30+ champs ajoutés), retomber sur un **scroll interne raisonnable** (le contenu de la liste scrolle dans une zone fixe à l'intérieur de la popup), mais jamais de scroll de la popup elle-même.

### D5 — Bouton « + Ajouter un champ » sticky en haut

**Objectif** : le bouton « + Ajouter un champ » doit rester **visible en permanence** en haut de la popup, même si on scrolle la liste des champs (cas extrême du D4). Aujourd'hui, il défile avec le contenu et disparaît rapidement.

### D6 — Refonte de l'en-tête du formulaire d'ajout/édition

**Constat** (cf. capture utilisateur) : l'en-tête de la vue formulaire est mal habillé :
- La flèche « retour à la liste » prend trop de largeur.
- Le titre « Ajouter un champ » se retrouve sur 3 lignes.
- Le rendu est disgracieux et perd l'utilisateur.

**Objectif** : refonte compacte de l'en-tête :
- Flèche réduite à une taille minimale.
- Titre sur **une seule ligne**.
- Disposition horizontale propre : `[← retour]   Ajouter un champ`.

### D7 — Simplification de l'onglet Standard

**Modifications attendues** :
- **Supprimer le texte d'aide** : « Choisissez un champ standard à ajouter à votre modèle. Le libellé et le type sont prédéfinis. »
- **Supprimer le filtre de recherche** « Rechercher / Filtrer la liste... ». La liste métier ne contient que 18 entrées, le filtre n'apporte rien.
- **Activer le double-clic** sur un champ pour ajout immédiat (cf. V2.4 §3) : double-clic sur « Civilité » → le champ est ajouté à la popup avec sa valeur d'échantillon calculée automatiquement, sans passer par le formulaire de saisie d'échantillon.

### D8 — Simplification de l'onglet Spécifique

**Modifications attendues** :
- **Supprimer le texte d'aide** : « Créez un champ personnalisé. Le nom technique sera attribué ultérieurement par la plateforme lors de la vérification de cohérence avec votre base de données. »
- **Aligner « Libellé »** et son input sur la **même ligne** (label à gauche, input à droite).
- **Aligner « Type »** et son combo sur la **même ligne** (idem).

### D9 — Supprimer l'aide textuelle en mode édition d'un champ standard

**Modification attendue** : supprimer le texte d'aide affiché en mode édition d'un champ standard : « Ce champ est associé à votre base de données. Seule la valeur d'échantillon est modifiable. »

Le verrouillage est déjà visible (champs grisés) ; l'utilisateur n'a pas besoin de cette explication.

---

## Priorité et ordre de livraison suggéré

L'ordre suivant minimise le retravail :

1. **Intégrer la V2.4** (amendement séparé) en premier :
   - Changement de doctrine sur le verrouillage (propriété `origine` avec valeurs `"import"` / `"ajout"`).
   - Choix de l'approche A ou B pour la détermination de l'onglet en édition (V2.4 §1.5).
   - Algorithme de résolution unifié de la valeur d'échantillon (V2.4 §2.1).
   - Refonte de la liste `RemplirDesignerChampsStandard.txt` (V2.4 §2.4).

2. **Corriger les bugs A7 à A12** en s'appuyant sur la nouvelle spec.

3. **Mettre en œuvre les évolutions UX D4 à D9**.

---

## Tests de non-régression à valider après L6

- Régressions L2/L3 toujours corrigées : espace automatique entre champs adjacents, fusion en aperçu avec champs vides supprimés.
- Comportements L5 toujours fonctionnels : booléen `autoriserGestionChamps`, onglet figé en édition, MergeTagBlot, etc.
- Pas de nouvelle TDZ en console au chargement (auditer comme en L5 pour les nouvelles variables introduites).

---

## Récapitulatif des fichiers attendus en livrable L6

| Fichier | Type | Contenu |
|---|---|---|
| `docs/cahier_des_charges_creation_champs_fusion.md` | Modif | V2.3 → V2.4 (intégration amendement) |
| `docs/Structure Webdev Designer V3.md` | Modif | V3.5 → V3.6 si la propriété `categorie` est ajoutée (Approche A de V2.4 §1.5) |
| `webdev/cpDesigner/RemplirDesignerChampsStandard.txt` | Refonte | Nouvelle liste métier (V2.4 §2.4) |
| `script.js` | Modif | Doctrine `origine` (`"import"`/`"ajout"`), algorithme de résolution échantillon, bugs A7–A12, UX D4–D9 |
| `style.css` | Modif | Hauteur popup adaptée (D4), bouton sticky (D5), en-tête formulaire compact (D6), alignements onglet Spécifique (D8) |
| `index.html` | Modif | Suppressions textes d'aide (D7, D8, D9), structure formulaire (D6, D8) |

---

## Point d'attention transversal

Vu les TDZ rencontrées en L5 (qui ont nécessité deux corrections successives), Cursor est invité à :
- **Auditer systématiquement** les nouvelles variables et fonctions introduites en L6 pour éviter qu'une lecture précoce dans la chaîne d'init ne déclenche une nouvelle TDZ.
- **Bump systématique** de `script.js` et `style.css` (et référence dans `index.html`) à chaque livraison, pour éviter les angles morts de cache navigateur.

Une fois L6 livré, le donneur d'ordre validera par tests, puis on attaquera le **chantier SaaS** (fonction de contrôle de cohérence + harmonisation Aperçu/BAT) qui est hors périmètre Designer.
