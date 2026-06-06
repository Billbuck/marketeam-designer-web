# Cahier des charges — Gestion dynamique des polices du Designer (dsn_police)

> **STATUT : SOURCE DE VÉRITÉ.** Ce document doit être rappelé dans chaque prompt
> Cursor relatif aux polices. Cursor ne doit JAMAIS dévier de ce cahier des
> charges. Toute évolution se fait en modifiant CE document d'abord.
>
> **MAJ (juin 2026)** : §3.1, §3.7, §3.8 et le schéma `dsn_police` amendés —
> passage de la combo unique à une **double combo en cascade famille → graisse**
> (ajout d'une colonne `Famille`). Le modèle de données (1 graisse = 1 ligne)
> reste inchangé ; seule la **présentation/sélection** évolue.
>
> **Contexte projet** : SaaS Marketeam (WebDev/WLangage) + Designer (HTML/CSS/JS,
> iframe, communication postMessage) + génération PSMD pour PrintShop Mail 7.x
> (« classique », Objectif Lune). Développement pur (pas de rétro-compatibilité).

---

## 1. Objectif

Remplacer la gestion **en dur** des polices du Designer par une gestion
**dynamique** basée sur la table `dsn_police`, à 3 niveaux de portée (générale,
marque, client), avec :
- injection de la liste des polices au Designer via postMessage ;
- sélection dynamique via une **double combo en cascade (famille → graisse)**,
  triée ;
- remontée des polices utilisées dans le document ;
- garantie de concordance entre la police **vue** (web) et la police **imprimée**
  (print PrintShop Mail).

---

## 2. État de l'existant (acquis, à NE PAS reconstruire)

Le « tuyau » postMessage existe DÉJÀ et fonctionne côté Designer :
- **Injection** : `policesDisponibles` à la racine du wrapper → le Designer la lit
  dans `loadFromWebDev` → `loadFontsFromJson()` (génère les `@font-face`) +
  `updateQuillFontSelectUI()` (alimente la combo).
- **Remontée** : `policesUtilisees` exporté à la racine via
  `extractPolicesUtilisees()` (scanne les zones, détecte gras/italique, enrichit
  avec les URLs).

**Pièce serveur MANQUANTE (état initial — résolue au Lot 0)** : la procédure
`cpDesigner.RemplirDesignerPolices(pIdClient)` est appelée
(`ComposerJsonDesignerCreation`, `ComposerJsonDesignerModele`) mais n'existait
pas → `policesDisponibles` arrivait vide `[]` et le Designer retombait sur
`DEFAULT_FONTS` (en dur dans `script.js`). Point de départ du Lot 0.

**Transmission au PSMD aujourd'hui** : `psmd-generator.js` écrit
`fontName = style.police || 'Roboto'` dans le `\fonttbl` du RTF. Le PSMD ne
transporte qu'un **nom de famille** (chaîne), aucun fichier embarqué.
`policesUtilisees` n'est pas encore exploité côté print.

---

## 3. Décisions validées (RÈGLES FERMES)

### 3.1 Modèle de données ET présentation en cascade (famille → graisse)

**Modèle de données (INCHANGÉ).** Chaque graisse reste **une ligne** dans
`dsn_police` (`Roboto`, `Roboto Light`, `Roboto Thin`, `Roboto Medium`,
`Roboto Black`…). Les variantes gras/italique de chaque graisse restent portées
par `BoldUrl` / `ItalicUrl` / `BoldItalicUrl` (cf. 3.2).

**Cas des poids 400 et 700 (paire de base / RIBBI) — RÈGLE GÉNÉRALE SANS
EXCEPTION.** Dans les polices statiques Google, les 4 styles Regular / Italic /
Bold (700) / Bold-Italic (700) partagent **un seul** nom interne (la famille nue,
ex. « Roboto »). En conséquence :
- l'entrée **400** est l'**ancre** : `NomTechnique` = famille nue ; elle porte le
  gras et le gras-italique via `BoldUrl` / `BoldItalicUrl`, atteints par le
  **bouton Gras** de l'éditeur ;
- les poids **700** et **700 italique** **ne créent JAMAIS d'entrée** propre : ils
  **alimentent uniquement** `BoldUrl` / `BoldItalicUrl` de l'ancre 400 (même
  principe que la variante italique du 400, qui n'a jamais d'entrée propre et
  alimente `ItalicUrl`) ;
- **tous les autres poids** (100, 200, 300, 500, 600, 800, 900) sont des entrées
  **autonomes** (nom de famille interne propre), avec régulier + italique
  seulement.
Il n'y a donc qu'une seule règle : seuls le **400** (ancre, 4 styles de base) et
les **poids non-RIBBI** (entrée + italique) existent dans la combo ; le **700**
est le gras de l'ancre, **jamais** une graisse à part.

**Présentation (NOUVEAU — remplace la combo unique à plat).** La sélection se
fait via **deux combos en cascade** :
- **Combo 1 — FAMILLE** : liste simple des familles (ex. « Roboto »),
  **sans recherche** (cf. 3.8).
- **Combo 2 — GRAISSE** : les graisses de la famille choisie (Regular, Light,
  Thin, Medium, Black…), **triées par poids** (cf. 3.7) ; **toujours affichée**,
  même si la famille ne possède qu'une seule graisse.

**Sélection par défaut (combo 2).** Au choix d'une famille, la combo 2
sélectionne par défaut la graisse **400 (Regular / Normal)**. Si la famille ne
possède **pas** de 400, sélectionner le **poids le plus proche de 400**.

**Règle d'or (NON NÉGOCIABLE).** La sélection (famille + graisse) se **résout
vers UNE entrée `dsn_police`** et écrit dans `zoneData.font` **le nom de cette
entrée**, exactement comme avant. L'identité appliquée (`zoneData.font`,
`NomTechnique`), le **print**, **`policesUtilisees`** et le **`@font-face`**
restent **strictement inchangés** : la cascade est une **pure couche de
présentation**. Tout stockage composite dans `zoneData.font` (ex. « famille|poids »)
est **interdit**.

**Donnée d'appui — colonne `Famille`.** Pour regrouper les graisses par famille
de façon fiable, `dsn_police` reçoit une colonne **`Famille`**. Le parsing du
`Nom` est **exclu** (familles multi-mots non séparables : « Source Sans 3 »,
« PT Serif », « Playfair Display », « Roboto Condensed »…). La colonne `Famille`
est **renseignée à l'import** (la famille brute Google `jItem.family` est déjà
connue à ce moment, sans devinette) et devra l'être pour les saisies manuelles
(Lots 3/4/5).

**Libellé de graisse (combo 2).** Obtenu **côté serveur**, source de vérité
unique, depuis `ici_police_weight`
(`dsn_police.Weight = ici_police_weight.Code AND EstPrincipal = 1`) ; le contrat
injecté est enrichi en conséquence (cf. §4). Le poids **400 garde l'affichage
« famille seule »** (libellé = nom de famille, pas « Regular »).

**Repli.** Une police **sans `Famille`** (ajout manuel non encore renseigné) est
traitée comme **sa propre famille à une seule graisse** → jamais perdue dans la
combo 1.

### 3.2 Variantes Gras/Italique : INTÉGRÉES à chaque entrée (Cas 1)
- Chaque entrée conserve ses variantes via `BoldUrl`, `ItalicUrl`,
  `BoldItalicUrl`.
- Les boutons **Gras** et **Italique** de l'éditeur restent actifs et basculent
  vers la variante correspondante **de cette graisse** (ex. l'italique de
  « Roboto Light » = `Roboto-LightItalic`).

### 3.3 Nom d'affichage ≠ nom technique (Approche 2)
- `dsn_police` distingue :
  - le **nom d'affichage** (libellé libre montré dans la combo du Designer) ;
  - le **nom technique** (= nom interne réel de la police, utilisé dans le
    `\fonttbl` du PSMD et pour la correspondance avec le fichier TTF).
- Raison : PrintShop Mail / RTF ne transporte qu'**un seul** nom et cherche la
  police par ce nom exact (pas d'alias cosmétique natif côté PSM). Le découplage
  cosmétique/technique se fait donc **chez nous** : libellé libre côté Designer,
  nom technique écrit dans le PSMD.

### 3.4 Stratégie PRINT : sous-dossier `Fonts` à côté du PSMD (Option C)
- **Architecture à 2 machines** :
  - **Serveur Web** : stocke les polices (`dsn_police` + fichiers), génère les
    BAT et les PSMD.
  - **Serveur de production (atelier)** : exécute PrintShop Mail (impression),
    pilote les imprimantes, hébergera les interfaces de gestion (générales,
    marques) et doit exploiter les polices clients.
- **Mécanisme** : à la génération du PSMD (serveur Web), déposer les fichiers de
  police **utilisés** (via `policesUtilisees`) dans un sous-dossier `Fonts`
  **à côté** du PSMD. Le PSMD + son sous-dossier `Fonts` voyagent ensemble vers
  l'atelier ; PSM lit les polices localement (priorité : dossier du document →
  sous-dossier `Fonts` → dossier système).
- **Fondement documenté (PSM 7.x, Windows)** : PSM lit les polices installées
  système ET tout fichier de police situé dans le même dossier que le document
  ou dans un sous-dossier `Fonts` du dossier du document. L'atelier est sous
  Windows → mécanisme applicable.
- **Avantages** : autonome (aucune police à installer/maintenir sur l'atelier),
  pas de partage réseau pour les polices, cloisonné (chaque job emporte ses
  polices, y compris clients).

### 3.5 Règle de copie des fichiers dans le sous-dossier `Fonts`
- Pour chaque police **utilisée** dans le document, copier
  **SYSTÉMATIQUEMENT** ses fichiers de variantes **qui existent** : regular +
  italic + gras + gras-italique.
- Choix de **robustesse** : on ne conditionne pas la copie à l'usage effectif de
  chaque variante ; dès qu'une police est utilisée, ses variantes existantes
  l'accompagnent (sécurise le cas où l'utilisateur bascule en gras/italique).
- **Un seul `Fonts` par projet (UNION).** Tous les documents d'une opération
  partagent le même répertoire de sortie (`RepertoireTravail\Fonts\`). Ce `Fonts`
  unique contient l'**union dédupliquée** des polices utilisées par **tous** les
  documents du projet (+ l'enveloppe). La copie ne se raisonne donc pas document
  par document isolément, mais à l'échelle du projet.
- **Déclenchement** : (a) copie **par document** à la génération du PSMD (avant le
  rendu BAT) — l'union se construit au fil des documents ; (b) **purge +
  reconstruction complète** du `Fonts` au point de **validation** du projet
  (paquet final propre, sans fichier orphelin).
- **Source du fichier** : copie depuis le cache global (`police_<IdPolice>_*.ttf`).
  Le **nom du fichier dans `Fonts` est libre** (PSM résout par le nom interne
  nameID 1, pas par le nom de fichier) → on conserve le nommage du cache.
- **Aperçu des MODÈLES** : répertoire de sortie distinct → son **propre** `Fonts`,
  traité de la même façon (cohérence avec la substitution 2B déjà appliquée au BAT
  modèle).
- **Non-conformité** : seules les polices **gérées sans fichier** ou **inconnues**
  (cf. classification §3.10) sont tracées (par document) et remontées en **alerte
  visible** à la validation (liste consolidée), **sans bloquer** la génération.
  Les polices **système** (§3.10) sont ignorées.

### 3.6 Portée à 3 niveaux
- **Générale** : `IdMarque IS NULL AND IdClient IS NULL` → visible par tous.
- **Marque** : `IdMarque NOT NULL`, `IdClient IS NULL` → visible pour la marque.
- **Client** : `IdMarque IS NULL`, `IdClient NOT NULL` → visible pour le client.
- Sélection pour un contexte = union des 3 (générales + marque(s) du client +
  client). `IdMarque` non présent dans `stOperation` → le dériver du client via
  `clt_client_marque` (même pattern que les collections).

### 3.7 Tri des combos
- **Combo 1 (familles)** : **Marque**, puis **Client**, puis **Alphabétique**.
  Tri fait **à la source WebDev** (avant injection) ; la combo JS rend l'ordre
  reçu tel quel.
- **Combo 2 (graisses)** : tri par **poids croissant** (`Weight`).

### 3.8 Combos de sélection (remplace la recherche « contient » du Lot 1)
- **Combo 1 (familles)** : **liste simple, SANS recherche.**
- **Combo 2 (graisses)** : liste **dépendante** de la famille choisie.
- La combo éditable filtrable « contient » (livrée au Lot 1) est **abandonnée**
  au profit de la cascade.
- **Réversible** : un filtre sur la combo familles pourra être réintroduit
  ultérieurement si la liste des familles devient longue (faible coût) — **non
  retenu pour l'instant**.

### 3.9 Génération multi-format (réutilisation de l'existant)
- Le donneur d'ordre dispose DÉJÀ d'un outil web (projet landing pages) qui, à
  partir d'un seul fichier de police, génère toutes les variantes de format
  (TTF, SVG, EOT, WOFF2).
- À RÉUTILISER pour alimenter `dsn_police` lors de l'upload d'une police (remplir
  `Url` / `BoldUrl` / `ItalicUrl` / `BoldItalicUrl`).
- **[À VÉRIFIER]** emplacement exact de cet outil et API réutilisable.

### 3.10 Polices système, classification unifiée et non-suppression (soft-delete)

**Liste des polices système (source unique).** Les polices présentes sur
l'atelier sans fichier dans `Fonts` (la Verdana du pavé adresse, et les polices
Windows standard Arial / Georgia / Times New Roman / Courier New) sont déclarées
dans un **paramètre éditable** `prm_parametre.Polices_Systeme` (CSV), exposé par
`cpDesigner.RemplirDesignerPolicesSysteme()` et :
- injecté dans le JSON de chargement (`policesSysteme`, à côté de
  `policesDisponibles`) pour le Designer (alerte d'ouverture) ;
- lu au serveur pour la classification à la validation.
Une seule vérité, pas de double liste divergente. Valeur initiale :
`Verdana,Arial,Georgia,Times New Roman,Courier New`.

**Classification unifiée d'une police utilisée (ouverture ET validation) :**
- **gérée** = présente dans `dsn_police` (**active OU inactive**, cf. soft-delete)
  → besoin d'un fichier print ; alerte **à la validation** si le fichier manque ;
- **système** = présente dans `Polices_Systeme` → présente sur l'atelier,
  **ignorée** ;
- **inconnue** = ni l'une ni l'autre → **alerte** (ouverture + validation).
La **combo** ne propose que les polices **actives** ; la détermination « gérée »
s'appuie en revanche sur la présence en base, **active ou inactive**.

**Non-suppression (soft-delete) — RÈGLE FERME (Lots 3-5).** On ne supprime
**jamais** physiquement une police de `dsn_police` ni son fichier de cache. Une
police retirée passe `EstActif = 0` (plus proposée dans la combo) mais **demeure
en base + cache** → tout document qui la référence continue de s'imprimer
correctement. Couvre les cas modèle / duplication / opération en pause référençant
une police « retirée ». (Le scope **Google général** suit un cycle distinct :
reconstruction complète à l'import ; un éventuel retrait de famille appliquera la
même logique de non-perte le moment venu.)

**Alerte à l'ouverture (filet de sécurité, lot ultérieur).** En miroir de l'alerte
« champ manquant » (drapeau serveur + classification JS au load + modale non
bloquante, une fois par session), le Designer signale les polices **inconnues**
d'un document. Avec le soft-delete, ce cas devient rare ; l'alerte reste un filet
pour les orphelins hérités.

---

## 4. Points À VÉRIFIER / À TESTER (avant ou pendant le lot concerné)

- **[CONFIRMÉ — TEST PSM, juin 2026]** Validé fichiers en main : PSM 7.x lit
  les TTF d'un sous-dossier `Fonts` **sans installation** et **exploite les
  variantes gras/italique** qui y sont présentes. La résolution gras/italique se
  fait par **nom de base + attribut RTF (`\b` / `\i`)** — **hypothèse A**, pas de
  nom propre par variante. Le nom à écrire dans le `\fonttbl` = le **nom interne
  « Family name » (nameID 1)** de la graisse. Rappel du constat (polices Google
  statiques) : les 4 styles de base (Regular/Bold/Italic/Bold-Italic) partagent
  **un seul** nom de famille interne (ex. « Roboto ») ; chaque autre graisse a
  **son propre** nom de famille interne (ex. « Roboto Light ») avec seulement
  normal + italique. **Conséquence : `NomTechnique` doit valoir ce nom interne
  (nameID 1).**
- **[TRANCHÉ — Lot 2A]** Source des fichiers print : **télécharger les `.ttf`
  directement depuis les URLs Google** déjà stockées (`Url`/`BoldUrl`/…) et les
  **mettre en cache à l'import** dans un dossier global de polices côté serveur
  Web (**stratégie A**). Le sous-dossier `Fonts` voisin du PSMD (§3.5) est une
  copie issue de ce cache au moment de la génération. L'outil multi-format
  « landing pages » (§3.9) **n'est pas** utilisé pour le Lot 2 (réservé aux
  uploads manuels, Lots 3-5) et reste introuvable à ce stade.
- **[TRANCHÉ — Lot 2A]** `NomTechnique` est **lu directement dans le fichier TTF**
  (nameID 1, enregistrement Windows prioritaire) au moment du téléchargement — et
  **non** dérivé des libellés, qui divergent pour les graisses en deux mots
  (« SemiBold » interne vs « Semi Bold » libellé).
- **[À CONFIRMER]** Un client peut-il appartenir à plusieurs marques
  (`clt_client_marque`) → union de toutes ses marques (par défaut) ou marque
  principale ?
- **[TRANCHÉ]** Schéma `dsn_police` : ajout de la colonne **`Famille`** (cf. 3.1),
  renseignée à l'import et prévue pour les saisies manuelles. La structure
  `structDesignerPolice` porte déjà le **nom technique** et est **enrichie de
  `famille`** (+ le libellé de graisse pour la combo 2). La portée
  IdMarque/IdClient n'a pas à remonter au Designer (sélection serveur uniquement).

---

## 5. Découpage en LOTS (indépendants, ordonnés)

### Lot 0 — Fondation DB & lecture
- Créer / finaliser la table `dsn_police` (colonnes existantes + **nom technique**
  cf. 3.3 + **colonne `Famille`** cf. 3.1).
- Implémenter `cpDesigner.RemplirDesignerPolices(pIdClient)` : lecture 3 niveaux
  (3.6), tri Marque/Client/Alphabétique (3.7), renvoi de la liste injectée dans
  `policesDisponibles`, **enrichie de `famille` et du libellé de graisse**
  (cf. 3.1, §4).
- **Amendement post-Lot 0 (cascade)** : ajout de la colonne `Famille`
  (renseignée à l'import via `pFamily`/`jItem.family`) + enrichissement du
  contrat (`structDesignerPolice` + `RemplirDesignerPolices`). Un **re-import**
  (UPSERT) peuple `Famille` sur les entrées Google déjà présentes.
- **Résultat testable** : le wrapper contient les polices de la base, avec
  famille + libellé de graisse ; le Designer les charge (`@font-face`) et peuple
  les combos.
- **Dépend de** : rien.

### Lot 1 — Combos en cascade (famille → graisse)
- Remplacer la combo unique par **deux combos en cascade** (3.1, 3.7, 3.8) :
  combo famille (liste simple, sans recherche) → combo graisse (triée par poids,
  toujours affichée).
- **Couche de présentation pure** : la sélection se résout vers une entrée
  unique ; `zoneData.font` = nom de l'entrée, application via le mécanisme
  existant (`<select>` masqué + `dispatch change`), **inchangé**.
- Pré-sélection à l'ouverture d'une zone : retrouver l'entrée par son nom
  (`policesDisponibles.find(p => p.nom === ...)`), puis positionner combo 1 et 2
  via `police.famille` / `police.weight` (donnée d'appui enrichie au Lot 0).
- **Dépend de** : Lot 0 (incl. colonne `Famille` + contrat enrichi).

### Lot 2 — Concordance PRINT (CRITIQUE)
- Génération du sous-dossier `Fonts` à côté du PSMD avec les polices utilisées et
  leurs variantes existantes (3.4, 3.5).
- Écriture du **nom technique** dans le `\fonttbl` (3.3).
- Exploitation de `policesUtilisees` pour la copie + éventuel contrôle de
  conformité (alerte si une police utilisée n'a pas de fichier print
  disponible).
- **TEST PSM** (cf. §4).
- Préserver l'ensemble PSMD + sous-dossier `Fonts` lors du transfert Web→atelier.
- **Dépend de** : Lot 0. À traiter TÔT (risque n°1).

### Lot 3 — Interface CLIENT (SaaS)
- Page de gestion des polices du client (upload + CRUD), sur le patron des pages
  de gestion existantes (upload + listing par `IdClient`). **Renseigner `Famille`
  à la saisie.**
- **Dépend de** : Lot 0 (+ outil multi-format §3.9 pour générer les variantes).

### Lot 4 — Back office MARQUES
- CRUD des polices niveau marque (sur le serveur de production / atelier, cf.
  3.4). **Renseigner `Famille` à la saisie.**
- **Dépend de** : Lot 0.

### Lot 5 — Back office GÉNÉRAL
- CRUD des polices générales (`IdMarque`/`IdClient` NULL). **Renseigner `Famille`
  à la saisie.**
- **Dépend de** : Lot 0.

### Lot D (transverse) — Génération multi-format
- Brancher l'outil existant (landing pages) pour remplir les `*Url` à l'upload.
- **Dépend de** : localisation de l'outil. **Alimente** : Lots 3/4/5.

**Ordre conseillé** : Lot 0 (+ amendement cascade) → (Lot 1 + Lot 2 en parallèle,
Lot 2 prioritaire car risque print) → puis interfaces (Lot D, 3, 4, 5).

---

## 6. Garde-fous pour Cursor (rappel méthode)

- Cursor voit le **vrai code** : utiliser les vrais noms, confirmer les
  signatures réelles. Prendre l'initiative ; l'objectif prime.
- **Ne pas reconstruire** le tuyau postMessage (injection + remontée) : il existe
  (§2).
- Respecter STRICTEMENT les règles du §3. En cas de doute ou de conflit avec le
  code réel, **le signaler** plutôt que dévier.
- **Cascade = couche de présentation uniquement** : ne jamais toucher l'identité
  appliquée, `policesUtilisees`, le print ni le `@font-face` (cf. règle d'or
  3.1).
- Travailler **lot par lot** ; ne pas empiéter sur les lots suivants.
- Ne pas coder les points marqués **[À VÉRIFIER]/[À TESTER]** (§4) tant qu'ils ne
  sont pas tranchés par le donneur d'ordre.

---

*Source de vérité — à rappeler dans chaque prompt Cursor relatif aux polices du
Designer. Toute modification du besoin passe par une mise à jour de ce document.*
