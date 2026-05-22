# Amendement V2.3 — cahier des charges Designer (ajout de champs de fusion)

> Amendement au document `docs/cahier_des_charges_creation_champs_fusion.md` (V2.2).
>
> À intégrer par Cursor en version **V2.3**, avec mise à jour du bandeau de version, de la filiation, et de l'annexe §14.
>
> Origine : remarques utilisateur recueillies après tests du livrable L4.

---

## 1. Nouveau booléen `autoriserGestionChamps` dans `stLoad`

### 1.1 Motivation

Le Designer ne peut pas inférer de manière fiable si une base de données est sélectionnée. Les deux signaux qui sembleraient évidents sont en réalité ambigus :

- **Présence de champs au load** : toujours `vrai`, même sans base (la zone destinataire — adresse — charge ses champs systématiquement).
- **Présence d'enregistrements d'échantillon** : toujours `vrai`, même sans base (la fiche utilisateur est injectée comme échantillon par défaut).

Le Designer voit donc toujours « il y a des champs et il y a un échantillon », sans pouvoir distinguer le cas « base sélectionnée » du cas « pas de base ».

**Décision** : la SaaS sait exactement si une base est sélectionnée — elle le déclare au Designer via un booléen explicite dans `stLoad`.

### 1.2 Spécification

**Nouveau champ dans la structure `structDesignerLoad`** :

```
autoriserGestionChamps : booléen
```

- **Sémantique** : autorise (ou non) l'utilisateur à **ajouter, modifier et supprimer** des champs depuis le Designer.
- **Valeur par défaut si absent** : `Vrai` (compatibilité ascendante avec les versions antérieures du contrat).

### 1.3 Logique de remplissage côté SaaS

| Contexte d'ouverture | Procédure WebDev | Valeur de `autoriserGestionChamps` |
|---|---|---|
| Création/modification d'un modèle | `ComposerJsonDesignerCreation` | **`Vrai`** (toujours) |
| Tunnel de commande, **sans** base de données sélectionnée | `ComposerJsonDesignerModele` | **`Vrai`** |
| Tunnel de commande, **avec** base de données sélectionnée | `ComposerJsonDesignerModele` | **`Faux`** |

### 1.4 Effet côté Designer

Quand `autoriserGestionChamps = Faux` :

- **Bouton « + Ajouter un champ »** : désactivé visuellement (grisé) avec tooltip explicatif au survol. Suggestion de libellé : *« Une base de données est associée à cette commande. La gestion des champs s'effectue depuis la base. »*
- **Icône crayon (édition)** : masquée ou désactivée sur chaque ligne de la popup.
- **Icône poubelle (suppression)** : masquée ou désactivée sur chaque ligne.
- **Modale d'ajout/édition** : non accessible.
- **Édition de la valeur d'échantillon** : également verrouillée, par cohérence (la valeur d'échantillon vient de la base elle-même dans ce contexte).

### 1.5 Articulation avec le critère « `nom` rempli »

Deux mécanismes de verrouillage coexistent désormais :

| Niveau | Critère | Effet |
|---|---|---|
| **Verrouillage individuel par champ** | `nom` technique rempli | Libellé et type figés pour CE champ. Échantillon modifiable. Suppression interdite. |
| **Verrouillage global du document** | `autoriserGestionChamps = Faux` | Toute action de gestion désactivée sur TOUS les champs. Aucun ajout possible. |

**Règle de combinaison** : le verrouillage global prime sur l'individuel quand il est plus restrictif. Concrètement, si `autoriserGestionChamps = Faux`, l'utilisateur ne peut **rien** modifier — y compris l'échantillon des champs qui seraient localement modifiables.

Si `autoriserGestionChamps = Vrai`, c'est le critère individuel qui s'applique normalement (Lecture B).

---

## 2. Source de la valeur d'échantillon en mode édition

### 2.1 Comportement attendu

Quand l'utilisateur ouvre la modale d'édition d'un champ, la valeur affichée dans le champ « échantillon » doit être **pré-remplie** depuis la première ligne de `documentState.donneesApercu`, si une valeur existe pour ce champ.

Plus précisément :

1. **Si `donneesApercu` contient au moins un enregistrement** et que cet enregistrement a une valeur non vide pour la clé du champ (`nom` ou `LOCAL_<localId>`) → la modale pré-remplit le champ « échantillon » avec cette valeur.
2. **Sinon, si `echantillonDefaut` est renseigné sur le champ** → utiliser cette valeur.
3. **Sinon** → champ vide.

### 2.2 Persistance à la sauvegarde

Si l'utilisateur modifie la valeur d'échantillon dans la modale :

- La modification doit se propager dans **toutes les lignes de `donneesApercu`** où la valeur est actuellement vide ou identique à `echantillonDefaut`. Les valeurs réelles BDD (déjà différentes) ne doivent **pas** être écrasées.
- Le champ `echantillonDefaut` du champ est mis à jour avec la nouvelle valeur.

Ce comportement est cohérent avec `propagateEchantillonDefaut` déjà implémenté en L4. À vérifier qu'il est bien déclenché à l'édition (pas seulement à la création).

---

## 3. Verrouillage de l'onglet en mode édition

### 3.1 Comportement attendu

En mode **création** d'un champ : l'utilisateur peut naviguer librement entre les onglets « Standard » et « Spécifique ».

En mode **édition** d'un champ existant : l'onglet est **figé** selon l'origine du champ.

| Origine du champ | Onglet ouvert | Navigation entre onglets |
|---|---|---|
| Champ standard (importé depuis `champsStandard`, ou ajouté via l'onglet Standard) | **Standard** | **Bloquée** |
| Champ spécifique (créé via l'onglet Spécifique) | **Spécifique** | **Bloquée** |

### 3.2 Discrimination origine standard / spécifique

Le critère discriminant doit être robuste. Proposition : ajouter une propriété `origine` (type chaîne, valeurs `"standard"` ou `"specifique"`) à la structure du champ, renseignée à la création.

Alternative si on ne veut pas ajouter de propriété : utiliser le `nom` technique comme heuristique (les champs spécifiques ont un `nom` qui commence par `Champ` suivi d'un nombre, ou un `nom` vide avec `localId` rempli). Moins fiable. La propriété explicite est préférable.

À trancher par Cursor selon l'analyse du code existant.

---

## 4. Coexistence avec `ChampsFusionInterdit`

Le mode `ChampsFusionInterdit` (existant, pour les enveloppes sans fenêtre et documents intérieurs) et le nouveau booléen `autoriserGestionChamps` adressent des intentions différentes :

| Mécanisme | Intention | Effet sur l'utilisateur |
|---|---|---|
| `ChampsFusionInterdit` (existant) | Interdire toute fusion dans ce document | L'utilisateur ne peut **insérer aucun champ** dans le document. Toute la mécanique de fusion est désactivée. |
| `autoriserGestionChamps` (nouveau) | Empêcher la modification de la liste des champs disponibles | L'utilisateur ne peut **pas ajouter / modifier / supprimer** des champs, mais ceux qui existent peuvent toujours être **insérés** normalement (dans les zones où c'est permis). |

**Règle d'interaction** : si `ChampsFusionInterdit = Vrai`, l'état de `autoriserGestionChamps` est sans effet (puisque la fusion entière est désactivée). Pas de conflit possible.

---

## 5. Point ouvert — liste des champs standards à aligner

La liste actuelle de `RemplirDesignerChampsStandard()` (15 entrées livrées en L1) ne correspond pas au métier réel de Marketeam. Les champs effectivement utilisés côté plateforme sont par exemple : Référence, Société, Enseigne, Contact, Civilité, etc.

**Action requise du donneur d'ordre** : fournir la liste de référence métier des champs standards à exposer dans `RemplirDesignerChampsStandard()` — idéalement issue d'une table BDD existante (`prm_designer_champs_standard` ou équivalent) plutôt que figée dans la procédure WebDev.

Cette liste doit comporter, pour chaque champ standard :
- `nom` (nom technique, ex: `SOCIETE`)
- `libelle` (libellé d'affichage, ex: « Société »)
- `type` (code parmi les 13 codes V2.2 : `TXT`, `CDP`, `EML`, etc.)

**Non bloquant pour L5** mais à traiter avant clôture de la fonctionnalité.

---

## 6. Sections du cahier des charges V2.2 impactées

À mettre à jour par Cursor pour produire la V2.3 :

| Section V2.2 | Modification |
|---|---|
| Bandeau version | V2.2 → V2.3, ajouter ligne de filiation avec date amendement |
| §3 Principe directeur | Mentionner le nouveau verrouillage global `autoriserGestionChamps` à côté du verrouillage individuel par `nom` rempli |
| §5 / §5.1 Modèle de données | Ajouter la propriété `origine` sur les champs (option retenue cf. §3.2 ci-dessus) |
| §7.1 Bouton « Ajouter un champ » | Nouvelle condition de désactivation : `autoriserGestionChamps = Faux` |
| §7.3 Modale édition | Source de la valeur d'échantillon (cf. §2 ci-dessus) + verrouillage onglet (cf. §3 ci-dessus) |
| §7.5 Suppression | Désactivation supplémentaire quand `autoriserGestionChamps = Faux` |
| §7.7 Actions inline crayon/poubelle | Désactivation supplémentaire quand `autoriserGestionChamps = Faux` |
| §10 Structure WebDev | Ajouter `autoriserGestionChamps` dans `structDesignerLoad` (doc V3.4 → V3.5) |
| §14 Annexe décisions | Ajouter Q10 « Verrouillage global de la gestion des champs » et Q11 « Source de l'échantillon en édition » |

---

## 7. Procédures WebDev impactées

À mettre à jour également (livraison conjointe avec V2.3) :

- `webdev/cpDesigner/ComposerJsonDesignerCreation.txt` : ajouter `stLoad.autoriserGestionChamps = Vrai`.
- `webdev/cpDesigner/ComposerJsonDesignerModele.txt` : ajouter la logique conditionnelle selon présence d'une base de données sélectionnée.
- `docs/Structure Webdev Designer V3.md` : bumper V3.4 → V3.5, ajouter `autoriserGestionChamps` à `structDesignerLoad`.

---

## 8. Annexe — clarifications consolidées de doctrine

Pour mémoire (déjà acquis dans V2.2 mais utile à rappeler) :

- **Lecture B confirmée** : verrouillage ciblé par état du `nom` technique. Un champ avec `nom` rempli est verrouillé (libellé et type figés, suppression interdite). Un champ avec `nom` vide (et `localId` rempli) est librement modifiable.
- **Vision finale** : une fonction de contrôle de cohérence côté SaaS (hors périmètre Designer) validera les 3 risques (champs manquants en base, problèmes de typage, trous d'enregistrements) et attribuera les `nom` techniques aux `localId`.
- Le Designer **n'a pas pour rôle** d'empêcher les incohérences. Il permet la construction ; la fonction de contrôle SaaS arbitrera au moment opportun.
