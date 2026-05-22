# Correctifs L8 → livrable L9

> Note de remontée à Cursor suite aux tests utilisateur du livrable L8.
>
> Cursor doit produire un **livrable L9** ciblé sur les interactions popup ↔ sidebar.
>
> Note préliminaire : L8 a globalement bien traité ses 4 points (A15, A16, A17, D12). Les ajustements ci-dessous concernent des cas non couverts par la doctrine D12 qui apparaissent à l'usage. Il s'agit cette fois de **consolider définitivement** la doctrine d'indépendance entre la popup « Champs de fusion » et la sélection courante.

---

## Principe directeur de cette livraison

La gestion des champs de fusion est une **entité globale du modèle**, accessible à tout moment, **indépendamment de la sélection courante** dans le document.

Ce principe avait été énoncé dès la D2 (L5) mais reste partiellement appliqué : il subsiste des liens résiduels entre la popup et la sélection qui dégradent l'expérience utilisateur dans plusieurs scénarios.

L9 vise à supprimer ces liens résiduels.

---

## A — Bug L8 à corriger

### A18 — Asymétrie de fermeture de la popup selon le mode d'ouverture

**Observé** :

Deux scénarios produisent des comportements **différents** :

| Scénario | Action utilisateur | Comportement actuel |
|---|---|---|
| **Sans zone sélectionnée** | Clic bouton « Champs » sidebar → popup ouvre. Double-clic sur un champ standard. | Popup **se ferme** après le double-clic. L'utilisateur doit ré-activer le bouton sidebar pour continuer. |
| **Avec zone texte sélectionnée** | Clic bouton « Champs » sidebar → popup ouvre. Double-clic sur un champ standard. | Popup **reste ouverte**. Double-clic suivant fonctionne. |

Même asymétrie avec le bouton **Confirmer** : ferme la popup si aucune zone n'est sélectionnée, reste ouverte si une zone texte est sélectionnée.

**Diagnostic suggéré** : la condition d'affichage de la popup est probablement réévaluée après chaque interaction (double-clic, Confirmer). Cette réévaluation est basée sur la présence d'une zone texte sélectionnée — ce qui referme la popup dans le premier scénario.

**Attendu** : voir la doctrine D14 ci-dessous. Une fois la popup ouverte, les interactions internes ne déclenchent **jamais** sa fermeture.

---

## D — Évolutions UX

### D13 — Section « Champs » de la sidebar visible en permanence

**Constat** : aujourd'hui, la section « Champs » de la sidebar (créée en L7/D11) est masquée quand une zone est sélectionnée — probablement par mimétisme avec le comportement de la section « Actions ». Conséquence concrète :

- L'utilisateur clique sur une zone texte pour y insérer des champs.
- Il réalise qu'il a besoin d'ajouter un nouveau champ à sa liste.
- La section « Champs » est masquée, le bouton est inaccessible.
- L'utilisateur doit **sortir** de la zone (clic ailleurs → désélection → la section « Champs » réapparaît), **activer le bouton « Champs »**, puis **re-sélectionner la zone** texte. **Trois clics inutiles** pour une action qui devrait n'en demander qu'un.

**Attendu** : la section « Champs » reste **visible en permanence** dans la sidebar, quelle que soit la sélection courante (zone texte, zone image, zone barcode, zone QR, ou aucune zone).

**Cohérence métier** : la section « Champs » a une nature différente de la section « Actions ». « Actions » regroupe des opérations contextuelles ponctuelles sur le document ; « Champs » est un **panneau de contrôle persistant** qui pilote la disponibilité des champs de fusion. Les deux ne devraient pas suivre le même mode d'affichage.

### D14 — Doctrine consolidée et définitive de fermeture de la popup

Cette doctrine **remplace et précise** les règles précédemment définies en L6, L7 et L8 sur l'ouverture/fermeture de la popup.

#### Principe fondateur

> Quand la popup « Champs de fusion » est **ouverte** (par clic sidebar ou par ouverture conditionnelle sur sélection de zone texte), elle **reste ouverte** tant que l'utilisateur n'a pas explicitement choisi de la fermer.

#### Actions qui ferment la popup

| Action | Effet |
|---|---|
| Clic sur la croix `X` en haut de la popup | Popup ferme + bouton sidebar devient inactif |
| Clic sur le bouton « Champs » sidebar (alors actif) | Popup ferme + bouton devient inactif |
| Clic sur une zone non-texte (image, barcode, QR) | Popup ferme (bouton sidebar reste actif) |
| Clic dans le document vide (aucune zone sélectionnée) | Popup ferme (bouton sidebar reste actif) |
| Passage en mode Aperçu | Popup masquée (état préservé pour le retour) |

#### Actions qui n'affectent JAMAIS l'état de la popup

| Action | Effet sur la popup |
|---|---|
| Sélection d'un champ standard dans la liste du formulaire | Rien (popup reste ouverte) |
| Double-clic sur un champ standard pour ajout | Rien (popup reste ouverte, conforme à D10/L7) |
| Clic sur le bouton « Confirmer » du formulaire d'ajout | Rien (popup reste ouverte ; vue retourne à la liste principale conformément aux comportements stabilisés en L7/D10) |
| Clic sur le bouton « Annuler » du formulaire d'ajout | Rien (popup reste ouverte ; vue retourne à la liste principale) |
| Clic sur la flèche « ← retour à la liste » | Rien (popup reste ouverte ; vue retourne à la liste principale) |
| Navigation entre onglets Standard / Spécifique | Rien |
| Édition d'un champ via le crayon | Rien (popup reste ouverte, bascule en mode édition) |
| Suppression d'un champ via la corbeille → confirmation | Rien (popup reste ouverte) |
| Saisie dans n'importe quel input de la popup | Rien |
| Drag&drop d'un champ depuis la popup vers une zone Quill | Rien (popup reste ouverte) |

#### Critère discriminant simple à implémenter

Une interaction est **interne à la popup** (donc ne ferme pas) si la cible du clic appartient :
- À la popup elle-même (`#toolbar-data` ou conteneur équivalent).
- À une de ses sous-modales (modale de confirmation suppression `#champ-delete-modal`, modale de suggestion standard `#champ-standard-suggest-modal`).

Toute autre cible est externe, et son comportement de fermeture est défini par le tableau ci-dessus.

#### Cas mode Aperçu (rappel D12/L8)

L'**état du bouton « Champs »** est préservé durant le mode Aperçu. La popup est masquée durant l'Aperçu. Au retour en mode édition, si le bouton était actif et qu'une zone texte est sélectionnée, la popup se ré-ouvre automatiquement (cohérent avec la doctrine).

---

## Synthèse des comportements définitifs après L9

Pour traçabilité, voici le tableau de référence consolidé (qui remplace l'ensemble des tableaux des notes précédentes) :

| Action utilisateur | État du bouton | État de la popup |
|---|---|---|
| Ouverture du Designer | Inactif | Fermée |
| Clic sur le bouton « Champs » sidebar (inactif → actif) | Actif | Ouverte |
| Clic sur le bouton « Champs » sidebar (actif → inactif) | Inactif | Fermée |
| Clic sur la croix `X` de la popup | Inactif | Fermée |
| Sélection d'une zone de texte, bouton actif | Actif (inchangé) | Ouverte |
| Sélection d'une zone de texte, bouton inactif | Inactif (inchangé) | Fermée |
| Sélection d'une zone image/barcode/QR, bouton actif | Actif (inchangé) | Fermée |
| Clic dans le document vide (aucune zone), bouton actif | Actif (inchangé) | Fermée |
| **Interaction interne à la popup** (double-clic, Confirmer, etc.) | Inchangé | **Inchangée** |
| Passage en mode Aperçu | Préservé | Masquée |
| Retour de mode Aperçu, bouton actif + zone texte sélectionnée | Actif | Ouverte |

---

## Priorité

L9 est un livrable de finition. Les 3 points sont liés et doivent être traités en bloc :

1. **D13** d'abord : modification structurelle de la sidebar (rendre la section « Champs » toujours visible). Modification ciblée, devrait être rapide.
2. **A18 / D14** ensuite : refonte du mécanisme de gestion de l'état de la popup pour éliminer les liens résiduels avec la sélection courante. Suivre strictement le tableau de la synthèse.

---

## Tests de non-régression à valider après L9

- Régressions L2/L3 toujours corrigées.
- Comportements L5/L6/L7/L8 toujours fonctionnels.
- Pas de TDZ en console.

### Tests spécifiques L9

**D13** : section « Champs » visible en sidebar à tout moment :
- Aucune sélection → section « Champs » visible.
- Sélection d'une zone texte → section « Champs » toujours visible.
- Sélection d'une zone image → section « Champs » toujours visible.
- Sélection d'une zone QR → section « Champs » toujours visible.

**A18 / D14** : suivre intégralement le tableau de la synthèse, ligne par ligne. Validation particulière des scénarios de fermeture asymétrique précédemment observés :

- Scénario 1 : sans zone sélectionnée, ouvrir popup, double-cliquer sur plusieurs champs standards d'affilée → popup reste ouverte, ajouts s'enchaînent sans aller-retour.
- Scénario 2 : sans zone sélectionnée, ouvrir popup, simple clic sur un champ standard → formulaire d'ajout. Cliquer Confirmer → popup reste ouverte, retour à la liste principale.
- Scénario 3 : avec zone texte sélectionnée, mêmes manipulations → comportement identique.
- Scénario 4 : popup ouverte, drag d'un champ vers une zone Quill → popup reste ouverte pendant et après le drag.

---

## Récapitulatif des fichiers attendus en livrable L9

| Fichier | Type | Contenu |
|---|---|---|
| `script.js` | Modif | Refonte du mécanisme de gestion d'état popup (A18 / D14) |
| `style.css` | Modif si nécessaire | Section sidebar visible en permanence (D13) |
| `index.html` | Modif | Restructuration sidebar pour D13 si nécessaire |

Bump systématique : `script.js?v=61`, `style.css?v=61` si modifié.

Pas de modification du cahier des charges V2.4 ni des procédures WebDev ni de la structure WebDev.

---

## Point d'attention transversal

La doctrine D14 a vocation à être **définitive**. Si Cursor identifie un cas d'usage où l'application stricte de cette doctrine produit un comportement contre-intuitif, qu'il le signale **avant codage** plutôt que d'introduire des exceptions. L'objectif est de stabiliser une logique simple et prévisible, pas d'empiler des cas particuliers.

Audit anti-TDZ habituel.
