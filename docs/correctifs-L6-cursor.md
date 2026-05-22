# Correctifs L6 → livrable L7

> Note de remontée à Cursor suite aux tests utilisateur du livrable L6.
>
> Cursor doit produire un **livrable L7** de stabilisation finale.
>
> Note préliminaire positive : l'interface de la popup « Champs de fusion » est globalement bien améliorée après L6 (algorithme unifié, doctrine `origine`, refonte UX). Les retours ci-dessous sont des ajustements de finition, pas des refontes.

---

## A — Bugs L6 à corriger

### A13 — Pré-remplissage de l'échantillon non appliqué sur SIMPLE clic en onglet Standard

**Observé** :
- Onglet Standard, **simple clic** sur un champ (ex: « Nom ») pour le sélectionner → le formulaire d'échantillon apparaît avec un champ « Échantillon » **vide**, alors qu'il devrait afficher `Dupont` (placeholder par défaut du champ standard).
- Onglet Standard, **double-clic** sur un champ (ex: « Prénom ») → le champ est bien ajouté avec son placeholder `Jean` (le bug n'apparaît pas sur ce chemin).

**Diagnostic suggéré** : l'algorithme unifié `resolveEchantillonValue(champ, options)` n'est pas appelé sur le chemin du simple clic, ou il est appelé avec un contexte qui ne consulte pas le `placeholderDefaut` du champ standard.

Le bug A9 du correctif L5 → L6 demandait précisément ce pré-remplissage automatique pour tous les contextes d'ajout. Le contexte `'create-standard'` est manifestement défaillant.

**Attendu** : alignement du comportement simple clic sur celui du double-clic. À la sélection d'un champ standard (simple clic), le champ « Échantillon » du formulaire doit être pré-rempli selon l'algorithme V2.4 §2.1 :
1. Valeur saisie par l'utilisateur (rien à la sélection, donc inapplicable).
2. Valeur de la fiche utilisateur dans `donneesApercu` si présente.
3. `placeholderDefaut` du champ standard sinon.

L'utilisateur peut toujours modifier cette valeur dans le champ « Échantillon » avant de cliquer sur Confirmer.

### A14 — Listener click-outside trop agressif, fermeture imprévisible de la popup

**Observé** : la popup « Champs de fusion » se ferme dans des cas non souhaités. L'utilisateur perçoit le comportement comme **chaotique** : clics sur le canvas pour sélectionner une zone, clics sur la sidebar pour basculer d'outil, clics dans d'autres popups, etc. La popup ferme dans des situations où l'utilisateur n'a aucune intention de la fermer.

**Diagnostic** : le listener `mousedown` global ajouté en L6 pour le fix A7 (closeFieldsPopup sur clic en dehors) est trop large dans son interprétation des clics « en dehors ». Tout clic qui n'est pas strictement dans la popup elle-même est interprété comme une demande de fermeture, ce qui ne correspond pas à l'intention utilisateur dans la majorité des cas.

**Attendu** : **retirer complètement le listener click-outside**. Revenir à un modèle simple où **l'utilisateur ouvre et ferme explicitement** la popup :

- Clic sur le bouton « Champs » de la sidebar → ouvre ou ferme (toggle).
- Clic sur la croix `X` en haut à droite de la popup → ferme.
- Aucun autre événement ne déclenche la fermeture.

L'état du bouton sidebar reste strictement synchronisé avec l'état d'affichage de la popup (le fix A7 sur ce point reste valide).

**Bénéfice collatéral** : cette modification supprime aussi le risque drag&drop signalé par Cursor en point ouvert L6 (« si l'utilisateur drague un champ depuis la popup, le `mousedown` initial pourrait fermer la popup »). Le risque disparaît avec le listener.

---

## D — Évolutions UX

### D10 — Double-clic Standard : rester dans le formulaire après ajout

**Constat** : un cas d'usage très réaliste est l'ajout consécutif de plusieurs champs standards par un utilisateur préparant un nouveau modèle (ex: Nom, Prénom, Adresse 1, Code postal, Ville…). Aujourd'hui, chaque double-clic ajoute le champ ET ferme le formulaire pour revenir à la liste principale. L'utilisateur doit alors cliquer à nouveau sur « + Ajouter un champ » pour ajouter le suivant. C'est un aller-retour pénible.

**Objectif** : sur **double-clic** en onglet Standard, ajouter le champ MAIS **rester dans le formulaire** sur l'onglet Standard, avec le champ ajouté **disparu de la liste des propositions** (cohérent avec le filtrage existant A5 qui masque les champs déjà insérés). L'utilisateur peut enchaîner plusieurs double-clics. Il sort manuellement du formulaire via la flèche « ← retour à la liste » quand il a terminé.

**À conserver tel quel (pas de changement)** :
- **Simple clic + bouton Confirmer** en onglet Standard : ajout du champ ET retour automatique à la liste principale (comportement actuel L6 conservé).
- **Onglet Spécifique, bouton Confirmer** : ajout du champ ET retour automatique à la liste principale (comportement actuel L6 conservé).

**Tableau récapitulatif des comportements après L7** :

| Action utilisateur | Comportement après ajout |
|---|---|
| Onglet Standard, double-clic sur un champ | **Reste dans le formulaire**, champ disparaît de la liste |
| Onglet Standard, simple clic + Confirmer | Retour à la liste principale (inchangé) |
| Onglet Spécifique, saisie + Confirmer | Retour à la liste principale (inchangé) |

### D11 — Sortir le bouton « Champs » de la section Actions de la sidebar et créer une section dédiée

**Constat** : le bouton « Champs » de la sidebar a été ajouté en L5/D2 dans la section « Actions » de la sidebar. Mais sa nature est différente des autres boutons d'action — c'est un toggle d'affichage de panneau, pas une action ponctuelle sur le document.

**Objectif** : créer une **nouvelle section dédiée** dans la sidebar :

- **Nom de section** : « Champs ».
- **Position** : **juste en dessous** de la section « Actions ».
- **Contenu** : le bouton « Champs » (toggle d'affichage de la popup) y est déplacé.

Cette section restera dédiée pour la suite — d'autres contrôles liés aux champs de fusion pourraient s'y ajouter ultérieurement (filtres, modes d'affichage, etc.).

---

## Priorité

L7 est un livrable de finition. L'ordre n'a pas d'impact fort, mais je suggère :

1. **A14** d'abord (retrait du listener click-outside) : c'est la modification la plus impactante en termes d'expérience utilisateur, et elle simplifie le code en supprimant une mécanique qui s'était révélée trop agressive.
2. **A13** ensuite (pré-remplissage simple clic) : alignement sur le chemin double-clic qui fonctionne déjà.
3. **D10** ensuite : ajustement comportemental ciblé.
4. **D11** en dernier : modification structurelle de la sidebar, indépendante du reste.

---

## Tests de non-régression à valider après L7

- Régressions L2/L3 toujours corrigées : espace automatique entre champs adjacents, fusion en aperçu avec champs vides supprimés.
- Comportements L5/L6 toujours fonctionnels : `autoriserGestionChamps`, doctrine `origine`/`categorie`, algorithme unifié `resolveEchantillonValue`, MergeTagBlot.
- Pas de nouvelle TDZ en console au chargement.
- Bouton « Champs » sidebar (dans sa nouvelle section) : ouvre/ferme bien la popup. État visuel synchronisé.
- Popup ne se ferme **plus jamais** automatiquement sur clic ailleurs.

---

## Récapitulatif des fichiers attendus en livrable L7

| Fichier | Type | Contenu |
|---|---|---|
| `script.js` | Modif | Fix A13 (chemin simple clic), fix A14 (retrait listener), D10 (double-clic reste dans formulaire) |
| `style.css` | Modif | Ajustements éventuels pour D11 (section sidebar) |
| `index.html` | Modif | Restructuration sidebar pour D11 (nouvelle section « Champs ») |

Bump systématique : `script.js?v=59`, `style.css?v=59`, références mises à jour dans `index.html`.

Pas d'autre fichier impacté (pas de modification du cahier des charges V2.4, pas de modification des procédures WebDev, pas de modification de la structure WebDev).

---

## Point d'attention transversal — audit anti-TDZ

Reconduction de la consigne L6 : audit systématique des nouvelles variables et fonctions introduites en L7. Avec en plus une vigilance sur le **retrait** du listener click-outside — vérifier qu'aucune référence orpheline ne subsiste vers `closeFieldsPopup` ou des fonctions associées qui n'auraient plus de raison d'être après le retrait.
