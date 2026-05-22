# Prompt Cursor — Designer : création de champs de fusion

## 0. Préambule — origine et latitude d'interprétation

> **Important.** Ce cahier des charges a été rédigé par une IA conversationnelle (Claude) à partir d'un échange avec le donneur d'ordre. **L'IA rédactrice n'a aucune visibilité sur le code source du projet Designer, ni sur le code WebDev / WLangage de la plateforme SaaS Marketeam.** Les références à des fichiers, fonctions, variables ou patterns existants (par exemple `pgeLtrContenu`, `gsJsonRecu`, `ServeurTraiterMessageDesigner()`, `upload-bdd.js`, `Partage.ClassHtmlTypeOperation()`) proviennent du contexte fourni par le donneur d'ordre et **doivent être vérifiées dans le code réel avant exploitation**.
>
> En conséquence, Cursor est explicitement encouragé à :
>
> 1. **Inspecter le code existant** avant toute implémentation pour valider les hypothèses architecturales du cahier des charges (structure des `postMessage`, conventions de nommage, organisation des fichiers, dépendances, état réel des composants mentionnés).
> 2. **Prendre des initiatives** sur les points d'UX et d'architecture laissés ouverts (placement exact des boutons, choix entre onglets ou radio dans la modale, ergonomie des actions d'édition / suppression, structure JSON optimale des messages, etc.).
> 3. **Adapter le cahier des charges** si l'analyse du code révèle des contraintes, conventions ou opportunités que la rédaction initiale ne pouvait pas anticiper. Toute adaptation significative doit être **documentée et justifiée** dans la réponse, pour validation par le donneur d'ordre.
> 4. **Signaler les incohérences** éventuelles entre le cahier des charges et la réalité du code (par exemple : un fichier ou une fonction mentionnés qui n'existeraient pas, un mécanisme `postMessage` structuré différemment de ce qui est décrit, etc.).
>
> Le cahier des charges doit être lu comme une **expression d'intention métier** précise et non comme une spécification technique exhaustive. Les règles métier (modèle de données, validation, principe d'unification, comportement à l'édition / suppression / renommage) sont en revanche **fermes** et ne doivent pas être réinterprétées sans validation du donneur d'ordre.

## 1. Contexte

Le Designer est l'application web (HTML / CSS / JavaScript pur, sans framework) intégrée par iframe à la plateforme SaaS Marketeam. Elle permet à l'utilisateur de composer des modèles de documents (lettre, enveloppe à fenêtre…) en intégrant des **champs de fusion** issus d'une base de données.

La communication entre la plateforme SaaS (parent, en WebDev / WLangage) et le Designer (iframe) se fait par `postMessage`. Le Designer dispose déjà :

- d'une popup **« Champ de fusion »** qui liste les champs disponibles et permet leur insertion par drag-and-drop dans le document ;
- d'un mécanisme `postMessage` entrant qui reçoit la liste des champs et un échantillon de la base de données ;
- d'un mécanisme `postMessage` sortant qui renvoie la liste des champs **utilisés** dans le modèle ;
- d'un pattern de bridge iframe (`upload-bdd.js` v3.1.0) qui contourne le bug WebDev 2026 de sandbox JavaScript.

Aujourd'hui le Designer **consomme** les champs reçus, sans pouvoir en créer.

## 2. Objectif

Permettre à l'utilisateur de **créer des champs de fusion directement dans le Designer**, en plus de ceux reçus depuis une base de données existante.

### Trois cas d'usage couverts

1. **Création d'un modèle à partir d'une base existante** : le Designer reçoit la liste des champs et l'échantillon (comportement actuel) **et** l'utilisateur peut ajouter des champs supplémentaires.
2. **Création d'un modèle sans base** : le Designer démarre avec une liste de champs vide ; l'utilisateur construit toute la structure de champs un par un.
3. **Tunnel de commande Courrier** : la base n'est pas encore importée à ce stade ; même mécanisme d'ajout de champs.

La fonctionnalité est **toujours active** — pas de booléen d'activation.

## 3. Principe directeur — unification de format, distinction de comportement

> **Tous les champs sont stockés et affichés de manière unifiée. Mais leur comportement diffère selon l'état de leur nom technique.**

### 3.1 Unification de format et d'affichage

- Pas de différenciation visuelle entre champs venant d'une base et champs ajoutés dans le Designer.
- Une **liste unique** de champs dans la popup, dans le même ordre et avec la même présentation.
- Une **structure JSON unique** dans les `postMessage` : tous les champs portent les mêmes propriétés (`libelle`, `champ`, `type`, `echantillon`).
- Le Designer ne conserve aucune notion d'« origine » d'un champ — il ne distingue que l'**état du nom technique**.

### 3.2 Distinction de comportement basée sur l'état du nom technique

| État de `champ` | Signification métier | Comportement |
|---|---|---|
| **Rempli** (ex: `Prenom`, `Champ2`) | Champ associé à un nom technique de la base de données (soit importé, soit mappé par la plateforme SaaS lors d'une vérification antérieure) | Libellé et type **figés**. Échantillon modifiable. Suppression interdite. |
| **Vide** (ou `null`) | Champ ajouté dans le Designer, **pas encore mappé** à la base de données | Libellé, type et échantillon modifiables. Suppression autorisée. |

### 3.3 Mapping du nom technique — responsabilité de la plateforme SaaS

Le Designer **n'attribue jamais** de nom technique aux champs spécifiques qu'il crée. Le nom technique reste vide jusqu'à ce que la plateforme SaaS effectue une **vérification de cohérence** entre le modèle et une base de données (bouton dédié dans l'interface SaaS, hors périmètre Designer). Lors de cette vérification, la SaaS associe les libellés du Designer aux libellés des champs de la base, et attribue les noms techniques (`Champ1`, `Champ2`, …) en conséquence.

À la ré-ouverture du modèle après vérification, les champs précédemment vides arrivent avec leur nom technique rempli et basculent automatiquement en mode « figé ».

### 3.4 Cohérence avec la base de données

La cohérence entre le modèle Designer et la base de données réellement exploitée n'est **pas** contrôlée par le Designer. Elle relève entièrement de l'interface SaaS (bouton de vérification dédié). C'est une décision explicite : on simplifie le Designer et on responsabilise l'utilisateur.

## 4. Modèle de données — un champ

Chaque champ porte **trois informations métier** + un échantillon optionnel :

| Propriété | Description | Source |
|---|---|---|
| `libelle` | Texte affiché à l'utilisateur (ex: « Prénom », « Véhicule ») | Préfini (champ standard) ou saisi (champ spécifique) |
| `champ` | Nom technique de la base de données (ex: `Prenom`, `Champ2`). **Peut être vide** pour un champ spécifique pas encore mappé. | Préfini (standard) ou attribué par la plateforme SaaS lors de la vérification (jamais par le Designer) |
| `type` | Code du type de donnée (ex: `TXT`, `DAT`, `MON`…) | Préfini (standard) ou sélectionné (spécifique) |
| `echantillon` | Valeur fictive d'exemple, **optionnelle** | Saisie par l'utilisateur, dans les deux cas |

L'**état de `champ`** (rempli ou vide) est l'unique critère qui détermine si le champ est modifiable / supprimable (cf. §3.2).

### Insertion dans le document

La syntaxe d'insertion utilisée dans le document est `{{libelle}}` — **le libellé**, pas le nom technique. C'est ce que voit et manipule l'utilisateur.
Exemples : `{{Prénom}}`, `{{Véhicule}}`, `{{Date de naissance}}`.

Le mapping `libelle ↔ champ` est maintenu en interne par le Designer pour pouvoir restituer le nom technique (ou son absence) à la plateforme SaaS via `postMessage`.

## 5. Listes de référence — transmises par la plateforme SaaS

Les listes suivantes ne sont **pas hardcodées** dans le Designer ; elles sont reçues via `postMessage` au chargement, car elles peuvent évoluer côté SaaS :

### 5.1 Liste des champs standard

Tableau de champs préfinis que l'utilisateur peut ajouter en un clic. Chaque entrée porte les trois informations (`libelle`, `champ`, `type`).

Exemples : Nom, Prénom, Société, Adresse 1, Code postal, Ville, Téléphone, Portable, Email, etc.

### 5.2 Liste des types disponibles

Tableau des types de données utilisables pour les champs spécifiques. Chaque entrée porte au minimum un code (`code`) et un libellé d'affichage (`libelle`).

Exemples envisagés : Texte, Date, Heure, Entier, Monétaire, Image (codes définis côté SaaS).

## 6. Spécifications fonctionnelles

### 6.1 Bouton « Ajouter un champ »

Ajouter un bouton **« Ajouter un champ »** en **haut** de la popup « Champ de fusion » existante. Au clic, ouverture d'une **modale de création de champ**.

### 6.2 Modale de création de champ

La modale propose **deux modes** au choix (radio ou onglets) :

#### Mode A — Champ standard

- Liste déroulante (ou liste cliquable) des champs standard reçus via `postMessage`.
- L'utilisateur sélectionne une entrée. **Le libellé et le type sont imposés** par la liste, non modifiables à la création.
- Le nom technique est repris tel quel depuis la liste standard.
- Champ optionnel : **valeur d'échantillon**.

#### Mode B — Champ spécifique

- Saisie libre du **libellé** (validation : voir §6.4).
- Sélection du **type** dans la liste reçue via `postMessage` (obligatoire).
- Le **nom technique** (`champ`) **reste vide** — le Designer **ne l'attribue jamais**. Il sera renseigné ultérieurement par la plateforme SaaS lors de la vérification de cohérence avec une base de données.
- Champ optionnel : **valeur d'échantillon**.

#### Format de la valeur d'échantillon selon le type

| Type | Format saisi / affiché |
|---|---|
| Texte / autres types textuels | Libre |
| Date | `JJ/MM/AAAA` (format français) |
| Heure | `HH:MM` |
| Entier | Numérique |
| Monétaire | Numérique avec symbole `€` (ex: `1 250,00 €`) |
| Image | **Placeholder** — pas d'upload, simple représentation visuelle |

### 6.3 Nom technique des champs spécifiques — non attribué par le Designer

- Le Designer **n'attribue jamais** de nom technique aux champs spécifiques. La propriété `champ` reste vide (`""` ou `null`, à harmoniser avec l'existant).
- Aucun compteur `Champn` n'est géré côté Designer.
- L'attribution du nom technique se fera ultérieurement, côté plateforme SaaS, lors de la **vérification de cohérence** entre le modèle et une base de données (par appariement des libellés).
- Une fois ce nom technique attribué, le champ revient au Designer (à la ré-ouverture du modèle) avec `champ` rempli, et bascule automatiquement en comportement « figé » (cf. §3.2).

### 6.4 Validation du libellé saisi

S'applique uniquement au libellé (le nom technique est interne, jamais saisi par l'utilisateur).

| Règle | Valeur |
|---|---|
| Accents | **Autorisés** (é, è, à, ç…) |
| Espaces | **Autorisés** |
| Caractères spéciaux | **Interdits** (`!@#$%^&*()[]{}<>/\|"';:,.?` etc.) |
| Tirets `-` et underscore `_` | Autorisés |
| Unicité | **Obligatoire** sur l'ensemble des libellés du modèle (insensible à la casse recommandée) |
| Longueur maximale | **35 caractères** (à confirmer en cours d'implémentation) |

Les règles s'appliquent à la création **et à l'édition**. Erreurs de validation affichées clairement dans la modale.

### 6.5 Édition d'un champ existant

Depuis la popup « Champ de fusion », l'utilisateur peut accéder à l'**édition** de chaque champ (icône crayon, double-clic, ou menu contextuel — choix d'UX à proposer).

Le comportement dépend de l'état du nom technique (cf. §3.2) :

#### Champ avec `champ` **vide** (non mappé)

Sont **modifiables** : libellé, type, valeur d'échantillon.

#### Champ avec `champ` **rempli** (mappé à la base)

Sont **modifiables** : valeur d'échantillon **uniquement**.
Sont **figés** : libellé, type, nom technique.

L'UI doit refléter cette distinction sans introduire de différenciation visuelle structurelle (cf. §6.7) : les contrôles concernés sont simplement **désactivés** dans la modale d'édition, avec un tooltip explicatif au survol.

#### Comportement spécial — renommage du libellé (champ non mappé uniquement)

Si l'utilisateur modifie le libellé d'un champ **non mappé** déjà inséré dans le document, **tous les marqueurs `{{ancien libellé}}` présents dans le document doivent être mis à jour automatiquement** vers `{{nouveau libellé}}`.

Pour un champ mappé, le problème ne se pose pas puisque le libellé est figé.

### 6.6 Suppression d'un champ

Le comportement dépend de l'état du nom technique (cf. §3.2) :

#### Champ avec `champ` **vide** (non mappé)

Suppression **autorisée** depuis la popup (icône poubelle ou menu contextuel).

- Si le champ est **utilisé** dans le document, demander **confirmation explicite** à l'utilisateur (le marqueur deviendrait orphelin).
- À la confirmation, supprimer le champ de la liste **et** retirer tous ses marqueurs `{{libellé}}` du document.

#### Champ avec `champ` **rempli** (mappé à la base)

Suppression **interdite**. Le bouton de suppression est désactivé (grisé) avec un tooltip explicatif (ex: « Champ associé à la base de données, non supprimable »).

Justification : le nom technique étant lié à un champ de la base de données, supprimer le champ du Designer rendrait le mapping incohérent côté SaaS.

### 6.7 Différenciation visuelle — désactivation discrète des actions

Conformément au principe d'unification d'affichage (§3.1), il n'y a **ni icône, ni section séparée, ni couleur distinctive** entre les champs mappés et non mappés. La popup « Champ de fusion » présente une liste unique.

La distinction de comportement (§3.2) se traduit uniquement par la **désactivation visuelle (état grisé)** des boutons d'édition de libellé/type et de suppression sur les champs mappés. Un **tooltip** au survol explique la raison de la désactivation.

Cette approche minimaliste évite de polluer l'interface tout en restant compréhensible pour l'utilisateur.

## 7. Contrats `postMessage`

### 7.1 Recommandation d'architecture

Enrichir les messages existants plutôt que d'en créer de nouveaux, en restant cohérent avec :

- la variable globale `gsJsonRecu` côté SaaS,
- la fonction `ServeurTraiterMessageDesigner()` côté SaaS,
- le pattern de bridge iframe `upload-bdd.js` v3.1.0.

Inspecter le code existant et **proposer la structure JSON** la plus cohérente avec ce qui est déjà en place. Les exemples ci-dessous sont indicatifs.

### 7.2 Message entrant — SaaS → Designer (au chargement)

Doit transporter :

- La liste **unifiée** des champs déjà associés au modèle (avec `libelle`, `champ` rempli ou vide, `type`, `echantillon`).
- La liste des **champs standard** disponibles (référence).
- La liste des **types** disponibles (référence).

> **Note** : aucun compteur n'est transmis. Le Designer n'attribue pas de nom technique aux champs spécifiques.

Exemple de structure (à adapter à l'existant) :

```json
{
  "action": "init",
  "champs": [
    { "libelle": "Prénom", "champ": "Prenom", "type": "TXT", "echantillon": "Jean" },
    { "libelle": "Véhicule", "champ": "Champ2", "type": "TXT", "echantillon": "Cayenne" },
    { "libelle": "Couleur préférée", "champ": "", "type": "TXT", "echantillon": "Bleu" }
  ],
  "champsStandard": [
    { "libelle": "Nom", "champ": "Nom", "type": "TXT" },
    { "libelle": "Prénom", "champ": "Prenom", "type": "TXT" },
    { "libelle": "Code postal", "champ": "CP", "type": "TXT" }
  ],
  "typesDisponibles": [
    { "code": "TXT", "libelle": "Texte" },
    { "code": "DAT", "libelle": "Date" },
    { "code": "HEU", "libelle": "Heure" },
    { "code": "INT", "libelle": "Entier" },
    { "code": "MON", "libelle": "Monétaire" },
    { "code": "IMG", "libelle": "Image" }
  ]
}
```

Dans cet exemple, « Prénom » et « Véhicule » ont un nom technique rempli (champs mappés, lecture seule sur libellé et type), tandis que « Couleur préférée » a un nom technique vide (champ ajouté, encore modifiable).

### 7.3 Message sortant — Designer → SaaS (à la sauvegarde)

Doit transporter la liste **complète et unifiée** des champs du modèle, dans le même format que celui reçu (sauf les listes de référence, qui ne sont pas renvoyées). Les champs spécifiques nouvellement ajoutés ont leur `champ` vide — c'est le signal pour la SaaS qu'un mapping reste à faire.

```json
{
  "action": "save",
  "champs": [
    { "libelle": "Prénom", "champ": "Prenom", "type": "TXT", "echantillon": "Jean" },
    { "libelle": "Véhicule", "champ": "Champ2", "type": "TXT", "echantillon": "Cayenne" },
    { "libelle": "Date de livraison", "champ": "", "type": "DAT", "echantillon": "15/06/2026" }
  ]
}
```

### 7.4 Compatibilité avec l'existant

Le mécanisme `postMessage` qui renvoie la liste des champs **utilisés** dans le modèle (existant) doit continuer à fonctionner et rester compatible.

## 8. Contraintes techniques

- **Stack** : HTML / CSS / JavaScript pur, sans framework. Pas de jQuery sauf si déjà présent dans le projet.
- **Cohérence avec l'existant** : reprendre les conventions de nommage, le style CSS et les patterns du Designer actuel (notamment `pgeLtrContenu`, le système de classes utilitaires `Partage.ClassHtmlTypeOperation()`, etc.). Inspecter le code existant avant de coder.
- **Bridge iframe** : ne pas casser le pattern `upload-bdd.js` v3.1.0 qui contourne le bug WebDev 2026.
- **Aucun stockage navigateur** : pas de `localStorage` / `sessionStorage` (le Designer fonctionne en iframe et la persistance est gérée par la plateforme SaaS via `postMessage`).
- **Robustesse `postMessage`** : valider la structure des messages reçus avant traitement ; ignorer silencieusement les messages malformés.

## 9. Livrables attendus

1. Modification de la popup **« Champ de fusion »** : ajout du bouton « Ajouter un champ », ajout des actions d'édition et de suppression sur chaque entrée, avec **désactivation visuelle** de ces actions sur les champs ayant un nom technique rempli.
2. Création de la **modale de création / édition de champ** avec ses deux modes (standard / spécifique) et le comportement adapté à l'état du nom technique en édition.
3. Implémentation des **règles de validation** du libellé.
4. Implémentation du **renommage propagé** des marqueurs dans le document (champs non mappés uniquement).
5. Implémentation de la **suppression** avec confirmation si le champ est utilisé (champs non mappés uniquement).
6. Adaptation des **contrats `postMessage`** entrant et sortant — sans compteur, et en gérant correctement les noms techniques vides ou remplis.
7. Conservation de l'**unification de format** (aucune distinction structurelle dans la liste, structure JSON unique).
8. **Tooltips explicatifs** au survol des actions désactivées sur les champs mappés.

## 10. Points à valider en cours d'implémentation

À me remonter avant codage final :

- Structure JSON exacte des messages `postMessage` (à aligner avec l'existant après inspection du code).
- Limite de 35 caractères pour le libellé (à confirmer après essais d'affichage dans la popup et dans le document).
- UX précise des actions d'édition / suppression (icônes, menu contextuel, double-clic) : proposer une variante qui s'intègre au mieux à l'UI existante.
