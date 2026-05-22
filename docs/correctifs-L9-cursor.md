# Correctifs L9 → livrable L10 (Phase 1)

> Note de remontée à Cursor après tests utilisateur complets du livrable L9.
>
> Cursor doit produire un **livrable L10** de finition cosmétique côté Designer.
>
> Note préliminaire : la doctrine D14 fonctionne désormais comme attendu (popup persistante avec ouverture/fermeture maîtrisée). Les remarques ci-dessous concernent **uniquement le Designer** et sont indépendantes du chantier SaaS qui suit. Quatre points cosmétiques, regroupables en deux thèmes.
>
> Le reste des observations utilisateur (champs spécifiques mal restitués en tunnel, BAT incomplet, valeurs d'échantillon non transmises au pipeline PSMD) relève du chantier WebDev/SaaS qui sera traité séparément.

---

## A — Bugs à corriger

### A19 — Tooltip d'un champ spécifique affiche `@LOCAL_xxx@` au lieu du libellé

**Observé** : au survol d'un champ spécifique dans la popup « Champs de fusion », le tooltip affiche :

> *« Couleur (TXT) - Double-clic ou glisser pour insérer @LOCAL_f2682de57ee8@ »*

L'identifiant interne `@LOCAL_xxx@` ne devrait jamais être visible par l'utilisateur. C'est de la plomberie technique qui doit rester invisible.

**Cause probable** : la fonction qui construit le tooltip prend la propriété `nom` directement (qui vaut `LOCAL_xxx` pour un champ spécifique non mappé) au lieu de passer par le résolveur d'affichage `mergeTagDisplayResolver` qui sait transformer cet identifiant en libellé humain.

**Attendu** : voir la doctrine de reformulation des tooltips au §D15 ci-dessous. Le tooltip doit afficher le **libellé** du champ (« Couleur »), jamais son identifiant technique.

### A20 — Z-index des modales de confirmation

**Observé** :
- Quand l'utilisateur clique sur la corbeille d'un champ → la modale de confirmation de suppression s'ouvre **derrière** la popup « Champs de fusion » (cf. capture).
- Quand l'utilisateur clique sur le bouton de validation du Designer → la modale « Confirmer la validation » s'ouvre **derrière** la popup « Champs de fusion » (cf. capture).

Dans les deux cas, le contenu de la modale est partiellement masqué par la popup, ce qui empêche une lecture confortable et peut induire en erreur.

**Attendu** : les modales de confirmation sont des **sur-couches modales** au sens strict du terme — elles doivent passer **au-dessus** de tout autre élément de l'interface, y compris la popup « Champs de fusion ».

**Implémentation suggérée** : ajuster la hiérarchie de `z-index` :

- Popup « Champs de fusion » (`toolbar-data` ou équivalent) : reste à son niveau actuel.
- Modale de confirmation de suppression (`champ-delete-modal`) : `z-index` supérieur.
- Modale « Confirmer la validation » : `z-index` supérieur.
- Modale de suggestion standard (`champ-standard-suggest-modal`) : à vérifier également pour cohérence, devrait également passer au-dessus.

Cursor définit les valeurs précises selon les conventions CSS du projet.

---

## D — Évolutions UX

### D15 — Reformulation des tooltips de champ

**Constat** : les tooltips actuels mélangent libellé, code de type, et identifiant technique. Le résultat est confus pour l'utilisateur, surtout pour les champs spécifiques où l'identifiant technique fuit dans l'interface (cf. A19).

**Tooltip actuel** :
> *« Prénom (TXT) - Double-clic ou glisser pour insérer @Prenom@ »*
>
> *« Couleur (TXT) - Double-clic ou glisser pour insérer @LOCAL_f2682de57ee8@ »*

**Tooltip attendu** :
> *« Double-clic ou glisser pour insérer le champ Prénom dans une zone de texte »*
>
> *« Double-clic ou glisser pour insérer le champ Couleur dans une zone de texte »*

**Règle générale** : le tooltip mentionne **uniquement le libellé** du champ. Pas de code de type, pas d'identifiant technique, pas de syntaxe `@...@`. Le format est uniforme pour tous les types de champs (standard, spécifique, système).

**Cas particulier des champs système** : pour les champs `SYS` (Séquentiel, Affranchissement, etc.) qui ne sont pas insérables manuellement, le tooltip doit refléter ce comportement — par exemple :

> *« Champ système : Séquentiel »*

Ou tout autre libellé qui indique le caractère non insérable. À Cursor de proposer la formulation cohérente avec le reste de l'UI.

### D16 — Optionnel : suppression du code de type entre parenthèses

Le code de type entre parenthèses (`TXT`, `EML`, `CDP`, etc.) qui apparaît actuellement dans certaines parties de l'UI (notamment la liste des champs standards de la modale d'ajout) est de la plomberie technique également. À évaluer s'il doit rester visible dans la popup principale, ou être réservé à la modale d'ajout/édition où il a une utilité réelle (choix du type pour un champ spécifique).

**Décision recommandée** : conserver le code de type dans la modale d'ajout (où il aide au choix), le retirer des tooltips et des libellés courants (où il encombre).

À discuter et à trancher par Cursor selon ce qu'il observe dans le code existant.

---

## Priorité et ordre de livraison

L10 est un livrable court de finition cosmétique. Pas de risque architectural, pas de refonte. L'ordre suivant est suggéré :

1. **A19 + D15** : refonte du calcul des tooltips. Centraliser dans une fonction unique qui produit le libellé final, appelée partout où un tooltip est généré.
2. **A20** : ajustement des `z-index` des modales de confirmation.
3. **D16** (optionnel) : nettoyage des codes de type dans les libellés courants si Cursor le juge cohérent.

---

## Tests de non-régression après L10

- Toutes les régressions et corrections des livraisons précédentes restent fonctionnelles (doctrine D14 du bouton « Champs », algorithme unifié `resolveEchantillonValue`, MergeTagBlot, etc.).
- Aucune nouvelle TDZ en console au chargement.
- Tooltips au survol corrects pour tous les types de champs (standard, spécifique, système).
- Modales de confirmation (suppression, validation, suggestion standard) toutes au-dessus de la popup « Champs de fusion ».

---

## Récapitulatif des fichiers attendus en livrable L10

| Fichier | Type | Contenu |
|---|---|---|
| `script.js` | Modif | A19 / D15 — refonte de la génération des tooltips |
| `style.css` | Modif | A20 — ajustement des `z-index` des modales |
| `index.html` | Modif si nécessaire | D16 si nettoyage des codes de type |

Bump systématique : `script.js?v=62`, `style.css?v=62`.

Pas de modification du cahier des charges V2.4, ni des procédures WebDev, ni de la structure WebDev.

---

## Note sur la suite

Le chantier majeur restant après L10 est entièrement **côté SaaS WebDev**. Il concerne la **fidélité de restitution des modèles** dans le tunnel de commande et l'**harmonisation Aperçu Designer / BAT**. Ce chantier sera traité directement par le donneur d'ordre dans WebDev/WLangage, hors périmètre Cursor.

Cursor peut considérer le périmètre **Designer** (HTML/CSS/JS) comme **stabilisé** après L10, sauf découvertes ultérieures à l'usage.
