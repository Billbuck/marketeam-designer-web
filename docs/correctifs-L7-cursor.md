# Correctifs L7 → livrable L8

> Note de remontée à Cursor suite aux tests utilisateur du livrable L7.
>
> Cursor doit produire un **livrable L8** de stabilisation finale.
>
> Note préliminaire : L7 a globalement amélioré l'expérience, mais 4 problèmes nécessitent encore des ajustements. Le plus important est une **doctrine consolidée** sur le bouton « Champs » de la sidebar et son lien avec la popup. Le précédent correctif L7/A14 (« retrait complet du listener click-outside ») est ici **partiellement annulé** au profit d'une doctrine plus nuancée et plus utile à l'usage.

---

## A — Bugs L7 à corriger

### A15 — Section « Champs » de la sidebar ne réapparaît pas au retour du mode Aperçu

**Observé** : après être passé en mode Aperçu puis revenu en mode édition, la section « Champs » de la sidebar (introduite en L7/D11) a disparu.

**Diagnostic suggéré** : la fonction qui masque/restaure les sections sidebar lors du toggle Aperçu / Édition n'a pas été mise à jour pour inclure la nouvelle section « Champs ». Probablement un oubli lors de l'ajout de la section en L7.

**Attendu** : la section « Champs » doit être restaurée à l'identique au retour du mode Aperçu, comme les autres sections de la sidebar.

### A16 — Audit complet et suppression des valeurs d'échantillon hardcodées résiduelles

**Observé** : malgré la refonte L6 censée supprimer toutes les valeurs hardcodées (bug A10 du précédent correctif), il subsiste des valeurs d'échantillon **codées en dur** dans le code JavaScript pour certains champs standards :

- Société : `Acme Corporation` (au lieu de `Société Exemple SAS` envoyé par la SaaS)
- Email : `jean.dupont@acme.com` (au lieu de `contact@example.com` envoyé par la SaaS)
- Probablement d'autres (« Etc... » de l'utilisateur).

Ces valeurs n'apparaissent **nulle part dans la procédure WebDev `RemplirDesignerChampsStandard.txt`**. Elles sont câblées en dur côté Designer JavaScript et écrasent les valeurs envoyées par la SaaS.

**Action demandée** : **audit complet** de `script.js` à la recherche de toutes les valeurs hardcodées résiduelles de placeholders et de valeurs d'échantillon.

**Méthode suggérée** :
1. Grep sur les chaînes connues : `Acme`, `jean.dupont@acme`, `MME ET M`, `Caradec`, et toute autre valeur suspecte d'origine inconnue.
2. Inventaire de toutes les tables, constantes, et fonctions de génération de valeur d'échantillon dans `script.js`.
3. Vérifier qu'il n'existe **plus aucune source de placeholder** autre que :
   - Les valeurs saisies par l'utilisateur dans la modale.
   - Les valeurs présentes dans `donneesApercu` (fiche utilisateur envoyée par la SaaS).
   - Les `placeholderDefaut` envoyés par la SaaS via `champsStandardDisponibles`.
   - La table `PLACEHOLDERS_PAR_TYPE` interne au Designer (légitime, pour les champs spécifiques uniquement).
4. Supprimer toute autre source résiduelle.
5. **Restituer un rapport** de l'audit : liste exhaustive des valeurs hardcodées trouvées et supprimées.

**Attendu** : la **source unique** des placeholders pour les champs standards est désormais la SaaS via `champsStandardDisponibles[*].placeholderDefaut`. Le Designer ne contient plus aucune table de fallback hardcodée pour les standards.

### A17 — Échantillon ne se rafraîchit pas au changement de sélection dans la liste Standards

**Observé** : dans le formulaire d'ajout en onglet Standard, simple clic sur un champ (ex: « Nom ») → l'échantillon se pré-remplit correctement (ex: `Dupont`). Mais si l'utilisateur sélectionne ensuite un autre champ (ex: « Prénom »), **l'échantillon reste sur la valeur du premier** (`Dupont`) au lieu de se mettre à jour (`Jean`).

**Diagnostic suggéré** : l'algorithme `resolveEchantillonValue` est appelé une seule fois à l'ouverture du formulaire, et pas à chaque changement de sélection dans la liste des standards. Il manque un écouteur sur l'événement de **sélection d'item** dans la liste qui déclenche le recalcul de l'échantillon.

**Attendu** : à **chaque clic** sur un champ standard dans la liste du formulaire d'ajout, le champ « Échantillon » doit être **recalculé** via `resolveEchantillonValue(nouveauChamp, 'create-standard')` et **mis à jour** dans le formulaire.

Lien : ce bug est probablement lié au bug A13 du précédent correctif (qui visait le pré-remplissage à la sélection). A13 traitait le cas du premier clic ; A17 traite le cas des clics suivants. Le fix doit couvrir les deux.

---

## D — Évolutions UX

### D12 — Doctrine consolidée du bouton « Champs » de la sidebar

**Contexte** : la doctrine du bouton « Champs » a évolué au fil des livraisons. L'expérience utilisateur en conditions réelles a montré que le compromis le plus utile combine :
- Maîtrise par l'utilisateur via le toggle sidebar.
- Ouverture **conditionnelle** automatique selon le type de zone sélectionnée.
- Fermeture **automatique** quand aucune zone pertinente n'est sélectionnée.

#### Cycle de vie complet du bouton et de la popup

| Étape | Action utilisateur | État du bouton | État de la popup |
|---|---|---|---|
| 1 | Ouverture du Designer | **Inactif** (état initial) | Fermée |
| 2 | Clic sur le bouton « Champs » | Actif | **S'ouvre** |
| 3 | Sélection d'une zone de texte | Actif (inchangé) | Ouverte (déjà ouverte ou reste ouverte) |
| 4 | Clic dans le document vide (aucune zone) | Actif (inchangé) | **Se ferme automatiquement** |
| 5 | Sélection d'une nouvelle zone de texte | Actif (inchangé) | **Se ré-ouvre automatiquement** |
| 6 | Sélection d'une zone image / barcode / QR | Actif (inchangé) | **Se ferme automatiquement** (si ouverte) — ne s'ouvre **pas** automatiquement |
| 7 | Clic sur la croix `X` de la popup | **Devient inactif** | Se ferme |
| 8 | Clic sur le bouton « Champs » (deuxième fois) | **Devient inactif** | Se ferme |

#### Règles synthétiques

- L'**état du bouton** (actif / inactif) reflète l'**intention de l'utilisateur** de travailler avec les champs de fusion. Il ne change que sur action explicite (clic bouton ou clic croix).
- L'**état de la popup** (ouverte / fermée) reflète la **pertinence contextuelle** ET l'intention utilisateur :
  - Si bouton inactif → popup toujours fermée, aucune ouverture automatique.
  - Si bouton actif → popup ouverte **si et seulement si** une zone de texte est sélectionnée, OU si l'utilisateur vient de cliquer sur le bouton pour activer.
- **Aucune zone sélectionnée** = popup fermée (mais bouton peut rester actif).
- **Zone non-texte sélectionnée** = popup fermée (mais bouton peut rester actif).

#### Différences avec L7/A14

L'A14 du précédent correctif demandait le **retrait complet** du listener click-outside. La doctrine D12 réintroduit un mécanisme proche, mais **plus nuancé** :

- L7/A14 : ne ferme jamais sur clic ailleurs.
- L8/D12 : ferme sur clic dans le document vide **et** sur sélection d'une zone non pertinente, **mais sans toucher à l'état du bouton sidebar**.

L'utilisateur conserve la maîtrise : tant que son bouton « Champs » reste actif, la popup se ré-ouvre dès qu'il revient sur une zone de texte. Il n'a pas à re-cliquer sur le bouton à chaque fois.

#### Cas du drag&drop

Le drag&drop d'un champ depuis la popup vers une zone Quill **ne doit pas** déclencher la fermeture de la popup. À traiter dans l'implémentation pour exclure les événements de type `drag*` du mécanisme de fermeture, ou pour différer la détection au `mouseup` plutôt qu'au `mousedown`.

#### Cas du mode Aperçu (lié à A15)

- L'**état du bouton « Champs »** doit être **préservé** durant le mode Aperçu (le bouton reste actif s'il l'était à l'entrée).
- La **popup est cachée** durant le mode Aperçu (cohérent avec le masquage de la sidebar).
- Au **retour en mode édition**, la doctrine D12 reprend normalement : si le bouton est actif **et** qu'une zone de texte est sélectionnée, la popup se ré-ouvre automatiquement.

---

## Priorité

L8 est un livrable de finition fine. Ordre suggéré :

1. **A15** (rapide) : restauration de la section « Champs » au retour du mode Aperçu. Modification ciblée.
2. **A16** (audit) : peut prendre du temps mais doit être fait en amont pour fournir des certitudes sur la source unique des placeholders.
3. **D12** (doctrine bouton) : impacte la logique de gestion des événements, à traiter en bloc.
4. **A17** (échantillon réactif à la sélection) : peut être traité en parallèle de D12 (deux mécanismes distincts).

---

## Tests de non-régression à valider après L8

- Régressions L2/L3 toujours corrigées : espace automatique entre champs adjacents, fusion en aperçu avec champs vides supprimés.
- Comportements L5/L6/L7 toujours fonctionnels : `autoriserGestionChamps`, doctrine `origine`/`categorie`, double-clic Standard reste dans le formulaire, section sidebar « Champs » dédiée.
- Pas de nouvelle TDZ en console au chargement.

### Tests spécifiques à L8

**A15 — Section sidebar préservée** :
- Ouvrir le Designer, vérifier section « Champs » visible.
- Passer en mode Aperçu → tout est masqué (attendu).
- Revenir en mode édition → la section « Champs » doit réapparaître à l'identique.

**A16 — Sources de placeholders** :
- Onglet Standard, sélectionner « Société » → échantillon doit afficher `Société Exemple SAS` (valeur de la SaaS).
- Sélectionner « Email » → échantillon doit afficher `contact@example.com`.
- Aucun placeholder ne doit présenter une valeur d'origine inconnue (« Acme Corporation », « jean.dupont@acme.com », etc.).
- Demander à Cursor de **fournir son rapport d'audit** (liste des valeurs hardcodées trouvées et supprimées).

**A17 — Échantillon réactif** :
- Onglet Standard, clic sur « Nom » → échantillon = `Dupont`.
- Sans confirmer, clic sur « Prénom » → échantillon doit changer en `Jean`.
- Continuer sur d'autres champs → vérifier que l'échantillon change à chaque clic.

**D12 — Doctrine bouton « Champs »** : suivre intégralement le tableau du cycle de vie (étapes 1 à 8) et valider chacun.
- Cas spécial : drag&drop d'un champ depuis la popup vers une zone Quill → la popup ne doit **pas** se fermer pendant ou après le drag.

---

## Récapitulatif des fichiers attendus en livrable L8

| Fichier | Type | Contenu |
|---|---|---|
| `script.js` | Modif | Fix A15 (restauration sidebar Aperçu), A16 (suppression hardcodés + rapport), A17 (échantillon réactif), D12 (doctrine bouton/popup) |
| `style.css` | Modif si nécessaire | Probablement pas de modification |
| `index.html` | Modif si nécessaire | Probablement pas de modification |

Bump systématique : `script.js?v=60` au moins.

Pas de modification du cahier des charges V2.4 (la doctrine D12 est une évolution du fonctionnement mais ne touche pas aux principes documentés). À discuter avec Cursor si une mise à jour du cahier est jugée utile pour traçabilité.

Pas de modification des procédures WebDev ni de la structure WebDev.

---

## Point d'attention transversal — anti-régression sur le mécanisme de fermeture

Cursor avait conçu en L6 un mécanisme global de fermeture (listener click-outside) qui s'est révélé trop agressif. En L7 il l'a complètement retiré. En L8 il faut le **réintroduire avec discernement** selon la doctrine D12, en gardant à l'esprit les leçons précédentes :

- Le mécanisme doit être **finement contextuel** (clic sur document vide ≠ clic dans une autre popup ≠ clic sur la sidebar).
- Il doit **distinguer** : clic sur une zone texte (popup ouvre), clic sur une zone non-texte (popup ferme), clic sur le document vide (popup ferme), interaction interne à la popup (rien ne se passe).
- Il ne doit **pas interférer** avec le drag&drop ni avec les modales secondaires (confirmation suppression, suggestion standard).

Garder le helper `closeFieldsPopup` créé en L6 et l'appeler aux endroits désormais identifiés.
