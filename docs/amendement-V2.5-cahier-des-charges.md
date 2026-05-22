# Amendement V2.5 — cahier des charges Designer

> Amendement au document `docs/cahier_des_charges_creation_champs_fusion.md` (V2.4).
>
> À intégrer par Cursor en version **V2.5**.
>
> Origine : observations utilisateur sur le scénario « modèle + base de données » dans le tunnel courrier. Le cas d'un désalignement entre les champs du modèle et les colonnes de la base sélectionnée n'était pas couvert par la V2.4.
>
> Cet amendement introduit une **doctrine de suppressibilité fonctionnelle** des champs et un **mécanisme de signalisation visuelle** des champs selon leur statut vis-à-vis de la base.

---

## 1. Changement de doctrine — suppressibilité par usage fonctionnel

### 1.1 Constat

Le critère de suppressibilité actuel (V2.4) est exclusivement basé sur la propriété `origine` :
- `origine = "import"` → champ non supprimable.
- `origine = "ajout"` → champ supprimable.

Ce critère devient insuffisant dans le scénario du tunnel avec base de données : un champ présent dans le modèle mais absent de la base réelle (donc inutilisable) reste non-supprimable parce qu'il est marqué `origine = "import"`. L'utilisateur est bloqué avec un champ qui ne lui sert à rien et qu'il ne peut pas retirer.

### 1.2 Nouveau critère — par usage fonctionnel

La **suppressibilité** d'un champ devient pilotée par deux critères combinés :

1. **Présence du champ dans la base de données sélectionnée** (le cas échéant).
2. **Usage du champ dans une zone du document** (texte Quill, image avec source merge-tag, code-barres avec source merge-tag, etc.).

La propriété `origine` (V2.4) **reste valide pour la persistance et la traçabilité interne** mais n'est plus le critère utilisateur de suppressibilité.

### 1.3 Régimes de fonctionnement

#### Régime A — Tunnel SANS base de données sélectionnée, et création/édition de modèle

S'applique :
- Au tunnel courrier quand aucune base de données n'est associée à l'opération (`bAvecBase = Faux`).
- À la création et à l'édition de modèles (mode `pgeLtrDocument`).

| État du champ | Couleur | Supprimable ? |
|---|---|---|
| Non exploité dans aucune zone du document | Gris | **Oui** |
| Exploité dans au moins une zone du document | Vert | **Non** |

L'utilisateur peut **ajouter** des champs librement via la modale « + Ajouter un champ ».

Le booléen `autoriserGestionChamps = Vrai` (inchangé).

#### Régime B — Tunnel AVEC base de données sélectionnée

S'applique au tunnel courrier quand une base est associée à l'opération (`bAvecBase = Vrai`).

| État du champ | Couleur | Supprimable ? |
|---|---|---|
| Présent en base ET non exploité dans le document | Gris | **Non** |
| Présent en base ET exploité dans le document | Vert | **Non** |
| Absent de la base ET non exploité dans le document | Rouge | **Oui** |
| Absent de la base ET exploité dans le document | Rouge | **Non** |

L'utilisateur **ne peut pas ajouter** de champs.

Le booléen `autoriserGestionChamps = Faux` (inchangé).

**Logique sous-jacente** : les champs gris/verts viennent de la base et l'utilisateur n'a pas la main dessus. Seuls les champs rouges (résidus du modèle absents de la base) sont supprimables — et uniquement après que l'utilisateur a retiré toutes leurs occurrences des zones du document.

### 1.4 Tableau récapitulatif consolidé

| Régime | Origine du champ | Présence en base | Exploité ? | Couleur | Supprimable ? | Ajout possible ? |
|---|---|---|---|---|---|---|
| A | (toutes) | n/a | Non | Gris | Oui | Oui |
| A | (toutes) | n/a | Oui | Vert | Non | Oui |
| B | (toutes) | Oui | Non | Gris | Non | Non |
| B | (toutes) | Oui | Oui | Vert | Non | Non |
| B | (toutes) | Non | Non | Rouge | Oui | Non |
| B | (toutes) | Non | Oui | Rouge | Non | Non |

La propriété `origine` est conservée pour usage interne (persistance, traçabilité du modèle, transitions session N → N+1) mais ne pilote plus directement l'UX de suppressibilité.

---

## 2. Mécanisme de signalisation visuelle dans la popup « Champs de fusion »

### 2.1 Présentation visuelle

Chaque entrée de la liste de la popup affiche une **bordure colorée à gauche** indiquant son statut :

- **Vert** : champ exploité dans le document (avec ou sans base).
- **Gris** : champ non exploité dans le document, présence en base si régime B.
- **Rouge** : champ exploité ou non, **absent** de la base (régime B uniquement).

Convention visuelle alignée sur celle déjà utilisée pour les champs système (Séquentiel, Affranchissement) qui portent un identifiant jaune-orangé à gauche. Les trois couleurs vert/gris/rouge cohabitent avec celle des champs système. À Cursor de proposer les codes hexadécimaux précis en cohérence avec la charte graphique existante.

### 2.2 État de la corbeille selon la suppressibilité

L'icône corbeille à droite de chaque champ est :
- **Active** (cliquable) si le champ est supprimable selon le tableau §1.4.
- **Grisée** (non cliquable) sinon, avec un tooltip explicatif :
  - Champ vert (exploité) : « Champ exploité dans le document, non supprimable ».
  - Champ gris en régime B (présent en base) : « Champ issu de la base de données, non supprimable ».
  - Champ rouge exploité : « Champ exploité dans le document, retirez d'abord ses occurrences pour pouvoir le supprimer ».

### 2.3 Distinction des champs spécifiques dans la popup

Indépendamment du statut couleur, les champs **spécifiques** (`categorie = "specifique"`) restent visuellement distingués des champs standards par un autre marqueur (cf. évolution UX précédemment notée). À Cursor de proposer une combinaison cohérente — par exemple, la bordure colorée à gauche peut être doublée d'une icône ou d'un style typographique pour distinguer standard vs spécifique sans surcharger l'interface.

---

## 3. Popup d'alerte à l'ouverture du Designer (régime B uniquement)

### 3.1 Déclenchement

À l'ouverture du Designer dans le tunnel avec base de données sélectionnée, si **au moins un champ exploité dans une zone du document est absent de la base** (= au moins un champ rouge exploité), une popup d'alerte s'affiche.

### 3.2 Contenu

- Un **message d'introduction** : « Les champs suivants sont utilisés dans le document mais absents de la base de données sélectionnée. Leur valeur sera vide lors de la fusion. »
- La **liste des libellés** des champs concernés, **un par ligne**.
- Un seul bouton : **« OK »**.

### 3.3 Comportement

- Popup non bloquante au-delà du clic OK.
- Le clic sur OK ferme la popup et permet l'accès normal au Designer.
- La popup ne se ré-affiche pas tant que l'utilisateur reste dans la session du Designer (un seul affichage par ouverture).
- Si l'utilisateur ferme et rouvre le Designer, la popup se ré-affichera si le désalignement persiste.

### 3.4 Cas où la popup ne s'affiche pas

- Régime A (pas de base de données).
- Régime B mais aucun champ exploité absent de la base (cas nominal aligné).
- Régime B avec des champs absents mais **non exploités** — l'utilisateur n'est pas alerté car ces champs sont supprimables et ne cassent rien.

---

## 4. Mécanisme d'entretien dynamique de la table d'exploitation

### 4.1 Principe

À l'ouverture du Designer, un **scan unique** des zones du document construit une table interne `champsExploites` qui recense pour chaque champ s'il est utilisé dans au moins une zone.

Cette table est **entretenue à chaque modification** des zones :
- Insertion d'une pastille de champ → mise à jour de l'état du champ concerné.
- Suppression d'une pastille → recalcul de l'état du champ concerné (recherche d'autres occurrences résiduelles).
- Suppression d'une zone entière → recalcul des états des champs présents dans la zone.

L'état de la corbeille et la couleur du champ dans la popup sont rafraîchis à chaque mise à jour de cette table.

### 4.2 Sources à scanner

- Contenu Quill des zones texte (merge-tags `LOCAL_xxx` et `nom`).
- Source de chaque zone image (si type `merge-tag`).
- Source de chaque zone code-barres (si type `merge-tag`).
- Source de chaque zone QR (si type `merge-tag`).

### 4.3 Performance

Le scan unique à l'ouverture est acceptable pour un document typique (< 100 champs, < 50 zones). L'entretien dynamique est local (un seul champ rafraîchi par modification) donc négligeable.

---

## 5. Modèle de données — nouveau attribut `presenteEnBase`

### 5.1 Description

Pour piloter le statut couleur en régime B, chaque champ de `champsFusion` peut porter un attribut booléen `presenteEnBase` :
- `Vrai` : le champ est présent dans la base sélectionnée (correspondance par `nom` technique).
- `Faux` : le champ est absent de la base sélectionnée.
- Absent / `Null` : régime A applicable (pas de base).

### 5.2 Alimentation

Côté SaaS, dans `ComposerJsonDesignerCreation` ou la procédure équivalente qui prépare le wrapper :

1. Si `bAvecBase = Faux` : ne pas alimenter `presenteEnBase` (champs en régime A).
2. Si `bAvecBase = Vrai` :
   - Pour chaque champ retenu dans `champsFusion` final, vérifier si son `nom` technique correspond à une colonne de la base.
   - Si oui : `presenteEnBase = Vrai`.
   - Si non : `presenteEnBase = Faux`.
   - Pour les champs spécifiques non mappés (`nom = ""`, `localId` rempli) : `presenteEnBase = Faux` par défaut (un `localId` ne peut pas correspondre à une colonne réelle).
3. Les champs système (`type = "SYS"`) ne portent pas `presenteEnBase` (ils ne sont jamais affichés avec un statut couleur vert/gris/rouge).

### 5.3 Exploitation par le Designer

Le Designer exploite cet attribut, combiné à la table interne `champsExploites`, pour calculer la couleur et l'état de suppressibilité selon le tableau §1.4.

---

## 6. Sections du cahier V2.4 à mettre à jour

| Section V2.4 | Modification |
|---|---|
| Bandeau version | V2.4 → V2.5, ligne de filiation avec date amendement |
| §1 Principe directeur | Ajouter mention de la doctrine de suppressibilité fonctionnelle (§1 de l'amendement) |
| §3 Verrouillage des champs | Refondre : la suppressibilité est désormais pilotée par l'usage fonctionnel et la présence en base, pas par `origine`. Conserver la mention de `origine` comme attribut de traçabilité interne |
| §4 Modèle de données | Ajouter l'attribut `presenteEnBase` (booléen optionnel) |
| §7.2 Modale d'ajout | Préciser que l'ajout n'est possible qu'en régime A |
| §7.5 Suppression | Refondre selon les régimes A/B (§1.3 de l'amendement) |
| §7.7 Actions inline | Mettre à jour les conditions d'activation/désactivation de la corbeille selon le tableau §1.4 |
| Nouvelle §7.8 | Popup d'alerte au désalignement (§3 de l'amendement) |
| Nouvelle §7.9 | Signalisation visuelle vert/gris/rouge (§2 de l'amendement) |
| §10 Versions | Ajouter V2.5 avec changements |
| §14 Annexe | Ajouter Q18 (doctrine fonctionnelle), Q19 (signalisation visuelle), Q20 (popup d'alerte) |

---

## 7. Procédures WebDev impactées

| Procédure | Modification |
|---|---|
| `webdev/cpDesigner/ComposerJsonDesignerCreation.txt` | Ajouter le calcul de `presenteEnBase` pour chaque champ retenu, en régime B uniquement |
| `webdev/pgeLtrContenu/procédure SelectionModèle.txt` | Idem si la fusion des champs y est faite — cohérence avec les patches précédents |
| `webdev/pgeLtrContenu/btnDocumentPersonnaliser.txt` (code Ajax serveur) | Idem |
| Structure `structDesignerChampFusion` | Ajouter le membre `presenteEnBase` (booléen, valeur par défaut Faux) — V3.7 |

---

## 8. Limites et points hors périmètre

- **Cohérence persistante après sauvegarde** : si l'utilisateur supprime un champ rouge en session N, à la session N+1 le champ n'existe plus dans le modèle. Si la base est encore désalignée par ailleurs (autres champs absents), une nouvelle popup d'alerte sera affichée. Comportement intentionnel.
- **Cas où la base évolue entre deux sessions** : si une colonne est ajoutée à la base entre la session N et N+1, un champ rouge devient vert/gris à la session N+1. Géré naturellement par le recalcul à chaque ouverture du Designer.
- **Fonction de contrôle de cohérence SaaS** (chantier futur) : reste indispensable pour valider les modèles avant exploitation en production. Cette fonction interviendra à la sauvegarde finale (sortie de tunnel) et fera des vérifications plus poussées (typage des colonnes, valeurs nulles, etc.). La doctrine V2.5 ne s'y substitue pas — elle informe l'utilisateur en amont mais ne bloque pas.
- **Cas d'une base ajoutée ou modifiée pendant la session Designer** : non couvert par V2.5. La table `presenteEnBase` est calculée à l'ouverture et n'est pas rafraîchie en cours de session. Si l'utilisateur change de base via une autre interface, il devra rouvrir le Designer pour bénéficier d'un calcul à jour. À documenter et à reconsidérer si l'usage le justifie.
