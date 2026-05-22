# Correctifs L4 — bugs et évolutions UX (livrable L5)

> Note de remontée à Cursor suite aux tests utilisateur du livrable L4.
>
> À traiter **conjointement** avec l'amendement V2.3 du cahier des charges (document séparé `amendement-V2.3-cahier-des-charges.md`).
>
> Cursor doit produire un **livrable L5 de stabilisation** qui couvre : intégration de la V2.3 dans la spec, correction des bugs, mise en œuvre des évolutions UX.

---

## A — Bugs L4 à corriger

### A1 — Popup « Champs de fusion » affiche les champs standards à l'ouverture sans base

**Observé** : à l'ouverture du Designer en tunnel de commande sans base de données, la popup « Champs de fusion » contient les 20 champs standards (Référence, Société, Enseigne, Contact, Civilité, etc.).

**Attendu** : la popup doit être **vide** dans ce contexte. C'est à l'utilisateur de constituer sa liste via le bouton « + Ajouter un champ ». Cette décision a été actée en Q4 du cahier V2.2 (Option A : `champsFusion = []`).

**Hypothèse de cause** : `ComposerJsonDesignerModele.txt` ne respecte pas l'Option A pour le contexte sans base, OU le Designer injecte ses propres champs par défaut quelque part dans `loadFromWebDev` ou `updateMergeFieldsUI`.

**Action** : analyser le flux d'initialisation des champs et corriger pour que la popup soit vide quand `champsFusion = []` en entrée. Vérifier qu'aucune injection automatique ne contourne la décision.

### A2 — Modale d'édition d'un champ standard s'ouvre sur le mauvais onglet

**Observé** : cliquer sur l'icône crayon d'un champ standard (ex: « Société ») ouvre la modale sur l'onglet **Spécifique**.

**Attendu** : la modale doit s'ouvrir sur l'onglet **Standard** quand on édite un champ d'origine standard, et sur l'onglet **Spécifique** quand on édite un champ d'origine spécifique. Voir §3 de l'amendement V2.3 pour le critère discriminant (propriété `origine` à ajouter sur les champs).

### A3 — Navigation entre onglets non bloquée en mode édition

**Observé** : en mode édition, l'utilisateur peut cliquer librement entre les onglets Standard et Spécifique.

**Attendu** : en mode édition, la navigation entre onglets est **bloquée**. L'onglet ouvert dépend de l'origine du champ (cf. A2) et reste figé. En mode création (ajout d'un nouveau champ), la navigation reste libre comme aujourd'hui.

### A4 — Valeur d'échantillon non pré-remplie à l'ouverture en édition

**Observé** : à l'ouverture de la modale d'édition, le champ « échantillon » est vide.

**Attendu** : le champ « échantillon » doit être pré-rempli depuis `documentState.donneesApercu` si une valeur existe pour ce champ. Voir §2 de l'amendement V2.3 pour la logique précise (`donneesApercu` puis `echantillonDefaut` puis vide).

### A5 — Filtrage incomplet de l'onglet Standard dans la modale d'ajout

**Observé** : dans la modale d'ajout onglet Standard, certains champs déjà insérés dans la popup mère apparaissent quand même dans la liste (le récap L4 mentionnait un « état déjà inséré grisé », mais le filtrage est incomplet ou inopérant à l'usage).

**Attendu** : les champs déjà présents dans `documentState.champsFusion` doivent être **masqués** complètement de la liste de l'onglet Standard (pas seulement grisés). Sans encombrement visuel avec des entrées non actionnables.

### A6 — Alignement visuel des champs `SYS`

**Observé** : les champs de type `SYS` (Séquentiel, Affranchissement) ont leur libellé **aligné à droite** dans la popup « Champs de fusion », contrairement aux autres champs alignés à gauche. Avec en plus un encadré jaune à gauche et l'absence des actions inline crayon/poubelle (ce dernier point est correct).

**Attendu** : l'alignement à droite donne l'impression d'un libellé tronqué et désoriente l'utilisateur. **À aligner à gauche** comme les autres champs. La différenciation visuelle des champs `SYS` peut rester (encadré, absence d'actions inline), mais l'alignement du texte doit être homogène.

---

## D — Évolutions UX

### D1 — Intégrer la modale Ajout/Édition dans la popup « Champs de fusion »

**Constat** : entre la popup « Propriétés Texte », la popup « Champs de fusion » et la modale « Ajouter / Modifier un champ », l'utilisateur se retrouve avec trois fenêtres empilées. C'est trop, et c'est lourd sur écran réduit.

**Objectif** : fusionner la modale Ajout/Édition **à l'intérieur de** la popup « Champs de fusion ». Une seule fenêtre, qui bascule entre deux états selon l'action de l'utilisateur :

- **État liste** : affichage de la liste des champs disponibles (comportement actuel).
- **État formulaire** : affichage du formulaire d'ajout/édition (déclenché par clic sur « + Ajouter un champ » ou sur une icône crayon).

**Mécanisme suggéré** : remplacement complet du contenu de la popup (vue empilée) avec bouton « ← Retour à la liste » dans l'en-tête du formulaire pour revenir à l'état liste. Cursor peut proposer une variante alternative (accordéon, slide latéral) à valider avant codage si l'implémentation suggérée présente des contraintes.

**Cohérence à préserver** : les 3 modales actuelles (champ-fusion-modal, champ-delete-modal, champ-standard-suggest-modal) doivent être unifiées dans cette nouvelle approche. La confirmation de suppression et la modale de suggestion peuvent rester des sur-couches modales légères, mais le formulaire d'ajout/édition principal doit être inline.

### D2 — Découpler la popup « Champs de fusion » de la popup « Propriétés Texte »

**Constat** : aujourd'hui, la popup « Champs de fusion » s'ouvre automatiquement avec la popup « Propriétés Texte ». Elle est donc liée par contexte à une zone de texte précise. Conséquence : pour ajouter un champ à une zone image ou à une zone barcode, l'utilisateur doit d'abord créer une zone texte — c'est absurde.

**Objectif** : la popup « Champs de fusion » devient une **entité indépendante** du document, accessible à tout moment via un **bouton dédié dans la sidebar**.

**Précisions** :

- La popup ne s'ouvre plus automatiquement à l'ouverture de la popup « Propriétés Texte ».
- Un nouveau bouton est ajouté dans la sidebar (emplacement précis à proposer par Cursor en cohérence avec l'existant) qui permet d'ouvrir/fermer la popup « Champs de fusion ».
- La popup reste pleinement opérationnelle pour le drag-and-drop vers les zones texte (comportement actuel conservé), et **également utilisable pour configurer les zones image / barcode / QR** via leurs propres mécanismes de liaison (combos `champFusion`).
- État de la popup persistant durant la session : si l'utilisateur la ferme manuellement, elle reste fermée jusqu'à un nouveau clic sur le bouton sidebar.

### D3 — Densité de l'UI à améliorer

**Constat** : la popup « Champs de fusion » occupe trop d'espace à l'écran. Les lignes de champ font ~50 px de haut chacune pour très peu d'information utile (icône + libellé + actions). Sur la capture utilisateur, seulement 5 champs sont visibles sur toute la hauteur de la popup.

**Objectif** : refonte cosmétique pour gagner en densité sans perte de lisibilité.

**Pistes proposées** (Cursor peut adapter selon contraintes UI réelles) :

- Réduire la hauteur des lignes (cible : ~30-35 px).
- Réduire la taille de l'icône type-de-champ à gauche.
- Réduire la taille des boutons crayon/poubelle.
- Réduire le padding interne des items.
- Possiblement réduire la taille du bouton « + Ajouter un champ » et/ou le déplacer dans l'en-tête de la popup plutôt qu'en bandeau séparé.

**Critère de validation** : pouvoir afficher au moins 8-10 champs dans la hauteur de popup actuelle, contre 5 aujourd'hui.

Cursor produit une première proposition, l'utilisateur valide ou demande ajustement.

---

## Priorité et ordre de livraison suggéré

L'ordre suivant minimise le risque de retravail :

1. **D'abord, intégrer la V2.3** (amendement séparé) : nouvelle propriété `origine` sur les champs, nouveau booléen `autoriserGestionChamps` dans `stLoad`, source de l'échantillon `donneesApercu`, blocage onglet en édition.
2. **Ensuite, corriger les bugs A1 à A6**, en s'appuyant sur la spec mise à jour (A2 et A3 dépendent directement de la propriété `origine` ; A4 dépend directement de la nouvelle règle de pré-remplissage).
3. **Enfin, mettre en œuvre les évolutions UX D1, D2, D3**. Ces évolutions touchent l'architecture des popups et la sidebar — à faire après stabilisation fonctionnelle pour ne pas mélanger les natures de corrections.

**Tests de non-régression à valider après L5** :

- Régressions L2/L3 toujours corrigées : espace automatique entre champs adjacents, fusion en aperçu avec champs vides supprimés (test étiquette LA POSTE).
- Les 8 tests proposés par Cursor à la livraison L4.
- Les 5 tests complémentaires suggérés (persistance aller-retour, substitution post-mapping simulée, etc.).
- Les nouveaux comportements de la V2.3 (bouton désactivé quand `autoriserGestionChamps = Faux`, onglet figé en édition, échantillon pré-rempli depuis `donneesApercu`).

---

## Récapitulatif des fichiers attendus en livrable L5

| Fichier | Type | Contenu |
|---|---|---|
| `docs/cahier_des_charges_creation_champs_fusion.md` | Modif | V2.2 → V2.3 (intégration amendement) |
| `docs/Structure Webdev Designer V3.md` | Modif | V3.4 → V3.5 (`autoriserGestionChamps` dans `structDesignerLoad`) |
| `webdev/cpDesigner/ComposerJsonDesignerCreation.txt` | Patch | Ajout `stLoad.autoriserGestionChamps = Vrai` |
| `webdev/cpDesigner/ComposerJsonDesignerModele.txt` | Patch | Logique conditionnelle selon présence base |
| `script.js` | Modif | Correctifs A1–A6, propriété `origine`, source échantillon, onglet figé, refonte popup pour D1 et D2 |
| `style.css` | Modif | Densité D3, ajustements visuels |
| `index.html` | Modif | Bouton sidebar D2, restructuration popup D1 |

Une fois L5 livré, le donneur d'ordre validera par tests, puis on passera à la **fonction de contrôle de cohérence côté SaaS** (chantier indépendant).
