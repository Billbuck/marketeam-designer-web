# Cahier des charges — Gestion dynamique des polices du Designer (dsn_police)

> **STATUT : SOURCE DE VÉRITÉ.** Ce document doit être rappelé dans chaque prompt
> Cursor relatif aux polices. Cursor ne doit JAMAIS dévier de ce cahier des
> charges. Toute évolution se fait en modifiant CE document d'abord.
>
> **MAJ (juin 2026) — cascade** : §3.1, §3.7, §3.8 et le schéma `dsn_police`
> amendés — passage de la combo unique à une **double combo en cascade famille →
> graisse** (ajout d'une colonne `Famille`). Le modèle de données (1 graisse =
> 1 ligne) reste inchangé ; seule la **présentation/sélection** évolue.
>
> **MAJ (juin 2026) — ajout Google Font + finitions** : ajout de la fonctionnalité
> **« ajouter une Google Font depuis le Designer »** (§3.11), des **décisions
> techniques** consolidées (§3.12), et précisions sur la **combo cherchable
> « commence par »** (§3.8) et sur **`EstActif=0` = traité comme manquante côté
> Designer** (§3.10). Découpage en lots mis à jour (statuts FAIT). La fonctionnalité
> est **développée et testée**.
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
  triée, la combo famille étant **cherchable (« commence par »)** ;
- **ajout d'une Google Font à la volée depuis le Designer** (police
  communautaire, disponible pour tous dès l'ajout) ;
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

**Pièce serveur (résolue au Lot 0)** : la procédure
`cpDesigner.RemplirDesignerPolices(pIdClient)` est appelée
(`ComposerJsonDesignerCreation`, `ComposerJsonDesignerModification`,
`ComposerJsonDesignerModele`) et alimente `policesDisponibles` (filtre
`EstActif = 1`, cf. §3.10). Le Designer ne retombe sur `DEFAULT_FONTS` (en dur
dans `script.js`) que si la liste est vide.

**Transmission au PSMD** : `psmd-generator.js` écrit le **nom technique** de la
police dans le `\fonttbl` du RTF (cf. §3.3). Le PSMD ne transporte qu'un **nom de
famille** (chaîne), aucun fichier embarqué ; les fichiers voyagent dans le
sous-dossier `Fonts` (§3.4).

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

**Présentation (cascade — remplace la combo unique à plat).** La sélection se
fait via **deux combos en cascade** :
- **Combo 1 — FAMILLE** : liste des familles (ex. « Roboto »), **cherchable
  « commence par »** (cf. 3.8).
- **Combo 2 — GRAISSE** : les graisses de la famille choisie (Regular, Light,
  Thin, Medium, Black…), **triées par poids** (cf. 3.7) ; **toujours affichée**,
  même si la famille ne possède qu'une seule graisse.

**Sélection par défaut (combo 2).** Au choix d'une famille, la combo 2
sélectionne par défaut la graisse **400 (Regular / Normal)**. Si la famille ne
possède **pas** de 400, sélectionner le **poids le plus proche de 400**
(`pickDefaultWeightEntry`). La **même** règle s'applique à l'aperçu de chaque
famille dans la combo 1 (l'aperçu utilise l'entrée 400/proche, pas la première
entrée rencontrée).

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
connue à ce moment) et devra l'être pour les saisies manuelles (Lots 3/4/5).

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
- `NomTechnique` est **lu directement dans le fichier TTF** (nameID 1,
  enregistrement Windows prioritaire) au moment du téléchargement — et **non**
  dérivé des libellés (qui divergent pour les graisses en deux mots :
  « SemiBold » interne vs « Semi Bold » libellé).

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
- **Fondement documenté ET CONFIRMÉ (PSM 7.x, Windows)** : PSM lit les polices
  installées système ET tout fichier de police situé dans le même dossier que le
  document ou dans un sous-dossier `Fonts`. La résolution gras/italique se fait
  par **nom de base + attribut RTF (`\b` / `\i`)** (hypothèse A confirmée), pas
  de nom propre par variante.
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
  documents du projet (+ l'enveloppe).
- **Déclenchement** : (a) copie **par document** à la génération du PSMD (avant le
  rendu BAT) — l'union se construit au fil des documents ; (b) **purge +
  reconstruction complète** du `Fonts` au point de **validation** du projet
  (paquet final propre, sans fichier orphelin).
- **Source du fichier** : copie depuis le cache global (`police_<IdPolice>_*.ttf`).
  Le **nom du fichier dans `Fonts` est libre** (PSM résout par le nom interne
  nameID 1, pas par le nom de fichier) → on conserve le nommage du cache.
- **Réimpression autonome** : un document déjà traité a son PSMD **et** son
  `Fonts` dans le dossier du projet → sa réimpression est **indépendante** de
  `dsn_police` et de l'état `EstActif` (cf. §3.10).
- **Non-conformité** : seules les polices **gérées sans fichier** ou **inconnues**
  (cf. classification §3.10) sont tracées et remontées en **alerte visible** à la
  validation, **sans bloquer** la génération. Les polices **système** (§3.10) sont
  ignorées.

### 3.6 Portée à 3 niveaux
- **Générale** : `IdMarque IS NULL AND IdClient IS NULL` → visible par tous.
- **Marque** : `IdMarque NOT NULL`, `IdClient IS NULL` → visible pour la marque.
- **Client** : `IdMarque IS NULL`, `IdClient NOT NULL` → visible pour le client.
- Sélection pour un contexte = union des 3 (générales + marque(s) du client +
  client). `IdMarque` non présent dans `stOperation` → le dériver du client via
  `clt_client_marque` (même pattern que les collections).

### 3.7 Tri des combos
- **Combo 1 (familles)** : **Marque**, puis **Client**, puis **Alphabétique**.
  Tri fait **à la source WebDev** (`RemplirDesignerPolices`, `ORDER BY CASE WHEN
  IdMarque… THEN 1 WHEN IdClient… THEN 2 ELSE 3 END, Nom`) ; la combo JS rend
  l'ordre reçu tel quel.
- **Combo 2 (graisses)** : tri par **poids croissant** (`Weight`).
- **Police ajoutée à chaud (§3.11)** : toujours de portée générale → insérée à sa
  place **alphabétique en partant du bas** du tableau (reste dans le bloc
  Standard, sans réordonner les blocs Marque/Client). Pas de tri serveur
  supplémentaire requis.

### 3.8 Combos de sélection — combo famille CHERCHABLE « commence par »
- **Combo 1 (familles)** : **combobox custom cherchable** (input + liste
  déroulante custom), filtre **« COMMENCE PAR »** (insensible casse/accents via
  `normaliseRecherche`). Remplace le `<select>` natif (non filtrable proprement).
  `#quill-input-font` masqué reste la **cible d'application** (inchangé).
  - **Ouverture fiable** : toggle au clic sur l'input (ouvre si fermé, ferme si
    ouvert) ; ne dépend plus du seul `focus`.
  - **Navigation clavier** : déroulant **ouvert** → ↑/↓ surlignent les
    suggestions, Entrée choisit ; déroulant **fermé** → ↑/↓ passent à la famille
    précédente/suivante (toutes sections Marque→Client→Standard) **et appliquent
    immédiatement** (prévisualisation, comme l'ancien `<select>`), arrêt aux
    extrémités (pas de wrap).
  - **Curseur** : main (`pointer`) au survol du champ.
- **Combo 2 (graisses)** : liste **dépendante** de la famille choisie, triée par
  poids (cf. 3.7).
- **Historique** : la combo éditable filtrable « contient » (envisagée au Lot 1)
  est **abandonnée** au profit de la cascade + « commence par ».

### 3.9 Génération multi-format (réutilisation de l'existant)
- Le donneur d'ordre dispose DÉJÀ d'un outil web (projet landing pages) qui, à
  partir d'un seul fichier de police, génère toutes les variantes de format
  (TTF, SVG, EOT, WOFF2).
- À RÉUTILISER pour alimenter `dsn_police` lors de l'upload **manuel** d'une
  police (remplir `Url` / `BoldUrl` / `ItalicUrl` / `BoldItalicUrl`) — Lots 3/4/5.
- **NON utilisé pour l'ajout Google Font** (§3.11), qui télécharge directement les
  `.ttf` depuis les URLs Google.
- **[À VÉRIFIER]** emplacement exact de cet outil et API réutilisable.

### 3.10 Polices système, classification unifiée, soft-delete (`EstActif`)

**Liste des polices système (source unique).** Les polices présentes sur
l'atelier sans fichier dans `Fonts` (la Verdana du pavé adresse, et les polices
Windows standard Arial / Georgia / Times New Roman / Courier New) sont déclarées
dans un **paramètre éditable** `prm_parametre.Polices_Systeme` (CSV), exposé par
`cpDesigner.RemplirDesignerPolicesSysteme()` et :
- injecté dans le JSON de chargement (`policesSysteme`) pour le Designer
  (classification d'ouverture) ;
- lu au serveur pour la classification à la validation.
Valeur initiale : `Verdana,Arial,Georgia,Times New Roman,Courier New`.

**Classification unifiée d'une police utilisée (ouverture ET validation) :**
- **gérée** = présente dans `dsn_police` **active** → besoin d'un fichier print ;
  alerte **à la validation** si le fichier manque ;
- **système** = présente dans `Polices_Systeme` → présente sur l'atelier,
  **ignorée** ;
- **inconnue / indisponible** = ni l'une ni l'autre → **alerte** (ouverture +
  validation) et traitement « manquante » côté Designer.

**Soft-delete (`EstActif`) — RÈGLE FERME.** On ne supprime **jamais**
physiquement une police de `dsn_police` ni son fichier de cache. Une police
retirée passe `EstActif = 0`.
- **Usage métier** : c'est l'**administrateur d'une marque** qui désactive une
  police (changement de charte → changement de police), afin que les **opérations
  en cours** puissent être terminées sans pouvoir créer de nouveau document avec
  l'ancienne police.
- **Côté Designer — `EstActif = 0` se comporte EXACTEMENT comme une police
  MANQUANTE.** `RemplirDesignerPolices` filtre `EstActif = 1` : une police
  désactivée n'est donc **pas** dans `policesDisponibles` → contour rouge, combo
  « (manquante) », alerte d'ouverture, **blocage de la validation**. Aucun
  chargement spécial, aucune mention « retirée », aucune liste de rendu séparée.
  Conséquence voulue : dupliquer une opération ou utiliser un modèle qui
  référence une police désactivée est **bloqué** (l'utilisateur doit choisir une
  autre police). **Aucun développement Designer n'est nécessaire** : ce
  comportement découle du filtre `EstActif = 1` et de `estPoliceManquante`.
- **Côté production — conservation des fichiers.** La ligne `dsn_police` et le
  fichier TTF sont **conservés** uniquement pour permettre à la production
  d'imprimer les documents en exploitation. La copie cache→`Fonts`
  (`CopiePolicesUtiliseesVersFonts`) **n'applique pas** le filtre `EstActif`.
  Une réimpression est de toute façon **autonome** (PSMD + `Fonts` déjà dans le
  dossier du projet, cf. §3.5).
- **[POINT PRODUCTION À SURVEILLER]** `SubstitueNomTechniquePolices` s'appuie sur
  `RemplirDesignerPolices` (filtre `EstActif = 1`) : la substitution
  nom affiché → `NomTechnique` du `\fonttbl` ne couvrirait pas une police
  `EstActif = 0` lors d'une **nouvelle** génération PSMD. Non bloquant aujourd'hui
  car (a) la réimpression est autonome et (b) la création avec une police
  désactivée est bloquée côté Designer. À traiter seulement si un besoin de
  re-génération PSMD d'une police désactivée apparaît.

**Alerte à l'ouverture (filet de sécurité).** Le Designer signale les polices
**indisponibles** (manquantes ou désactivées) d'un document : drapeau serveur +
classification JS au load (`classifierPolicesInconnues` via
`extractPolicesUtilisees`), modale non bloquante une fois par session, contour
rouge des zones concernées (`police-manquante`), libellé combo « (manquante) »,
et blocage de la validation (`checkDocumentIntegrity`). Les zones **système**
sont exclues du blocage (toujours sûres).

### 3.11 Ajout d'une Google Font depuis le Designer

**Besoin.** Segmentation clients : grands comptes = polices de marque (circuit
séparé) ; TPE/PME = Google Fonts. Permettre d'ajouter une Google Font à la volée
depuis le Designer (bouton « + » près de la combo Police). La police ajoutée est
**communautaire** (`Origine = 'google'`, `IdMarque`/`IdClient` NULL) : disponible
pour **tous** dès l'ajout. Les polices de marque ne passent PAS par ce circuit.

**Serveur — procédures (`cpDesigner`).**
- Catalogue Google via l'API officielle
  `https://www.googleapis.com/webfonts/v1/webfonts` (clé
  `prm_parametre.GoogleFonts_Api_Key`).
- Procédures partagées extraites de l'import existant :
  `RemplirLibellesGraisses()`, `TraiteFamilleGooglePolice()` (download TTF,
  lecture `NomTechnique` = nameID 1, règle paire de base 400/700, UPSERT),
  `AjouteGooglePoliceUnitaire(pFamily, pForcerMiseAJour, sStatut, sErreur)`.
- **UPSERT (non destructif) — RÈGLE FERME.** Clé d'unicité = `Famille + Weight`.
  Les `IdPolice` sont **PRÉSERVÉS** (jamais de DELETE+INSERT, car le document
  référence par **nom**, pas par `IdPolice`). Si la famille existe déjà : pas de
  ré-ajout par défaut ; mise à jour seulement si `pForcerMiseAJour = Vrai` ET
  version API > version stockée.
- **Colonne `dsn_police.Version`** (VARCHAR(20), defaut `''`) : version Google
  (`jItem.version`, ex. « v32 »), comparée en numérique (`Val(Milieu(version,2))`).
- Statuts de sortie : `added` / `exists` / `uptodate` / `updated` / `error`.
- Cache des fichiers : `RepCachePolices()` = `cpProjet.__sRepRacine + "Polices\"`,
  nommage `police_<IdPolice>_<suffixe>.ttf`.

**Serveur — WebService REST.**
- `DesignerPoliceAjout` (calqué sur `DesignerCollectionVerifie`) : entrée
  `famille` + `forcer` ; sortie JSON `{success, statut, famille, polices, error}`.
  Auth = SHA-256 de `secretKey + 'POST|/api/endpoint|' + idClient + '|' +
  idContact + '|' + timestamp`. Endpoint exposé + `prm_parametre.WS_Designer_Police_Ajoute`.
- `DesignerPoliceListe` → `ListeFamillesGoogle(pForcer)` : liste des familles
  Google, **cache fichier** `RepCachePolices() + "familles_google.json"`,
  **TTL 7 jours EN DUR** (pas de paramètre), refetch **paresseux** (à l'ouverture
  de la popup si le fichier dépasse 7 jours), forçable via `forcer = 1`.
  `prm_parametre.WS_Designer_Police_Liste`.

**Client — Designer (`script.js`, `index.html`, `style.css`).**
- Transport : `authConfig.urlPoliceAjout` / `urlPoliceListe` (alimentés par
  `RemplirDesignerAuth`, snippet à appliquer manuellement). Fonction
  `ajouteGooglePolice(famille, forcer)` (signature signée, timeout 60s).
- UI : bouton **« + »** (`#font-ajout-btn`) près de la combo Police + popup
  `#police-ajout-modal`. Mapping statuts (added/exists/uptodate/updated en vert,
  error en rouge).
- **Autocomplétion** : `chargeListeFamillesGoogle()` (cache mémoire),
  `renderPoliceAjoutSuggestions` — filtre **« commence par »** (cf. §3.8),
  navigation clavier. Le `mousedown` des items fait `stopPropagation` pour ne pas
  désélectionner la zone / fermer le panneau « Propriétés Texte ».
- **Fusion à chaud (sans recharger)** : après ajout réussi,
  `fusionnePolicesAjoutees(res.polices)` fusionne dans `policesDisponibles`
  (dédoublonnage par nom, **insertion alphabétique par le bas** cf. §3.7) →
  `loadFontsFromJson` (`@font-face`) → `updateQuillFontSelectUI` /
  `rebuildFontCombo` → si une zone texte est sélectionnée :
  `pickDefaultWeightEntry` + `applyFontByNom` + `refreshFontComboDisplay` →
  fermeture de la popup. La police apparaît dans la combo (aperçu en graisse
  400/proche) et s'applique immédiatement à la zone. **Règle d'or §3.1 respectée**
  (pure présentation côté combo ; identité/print/`policesUtilisees`/`@font-face`
  inchangés dans leur logique).

### 3.12 Décisions techniques (consolidées)

- **Colonnes URL en `TEXT`.** `Url`, `BoldUrl`, `ItalicUrl`, `BoldItalicUrl`
  passent de `VARCHAR(300)` à **`TEXT`**. Certaines URLs gstatic dépassent
  300 caractères (ex. Roboto Flex) et étaient **tronquées** à l'enregistrement →
  URL invalide → 404/CORS au chargement `@font-face`. Synchroniser le type dans
  l'analyse WebDev.
- **Quotage du `font-family` appliqué aux zones.** `applyQuillZoneStyles` (et la
  ligne de police par défaut) doivent **quoter** le nom :
  `font-family: '<nom>', sans-serif`. Un nom non quoté contenant un token
  commençant par un chiffre (ex. « Source Sans 3 ») est **invalide en CSS** et
  silencieusement ignoré → la police ne s'applique pas. Les `@font-face` et les
  `<option>` étaient déjà quotés ; seules les assignations de zone ne l'étaient
  pas.

---

## 4. Points À VÉRIFIER / À TESTER

- **[CONFIRMÉ — TEST PSM, juin 2026]** PSM 7.x lit les TTF d'un sous-dossier
  `Fonts` **sans installation** et **exploite les variantes gras/italique** par
  **nom de base + attribut RTF (`\b` / `\i`)** (hypothèse A). Le nom à écrire dans
  le `\fonttbl` = le **nom interne « Family name » (nameID 1)**. Polices Google
  statiques : les 4 styles de base partagent **un seul** nom interne ; chaque
  autre graisse a **son propre** nom interne (normal + italique). →
  `NomTechnique` = nameID 1.
- **[TRANCHÉ]** Source des fichiers print : **télécharger les `.ttf` depuis les
  URLs Google** stockées et les **mettre en cache à l'import** (stratégie A). Le
  sous-dossier `Fonts` est une copie issue du cache. L'outil multi-format §3.9
  n'est PAS utilisé pour Google (réservé aux uploads manuels) et reste introuvable.
- **[TRANCHÉ]** `NomTechnique` lu directement dans le TTF (nameID 1, Windows
  prioritaire).
- **[TRANCHÉ]** Schéma `dsn_police` : colonnes **`Famille`** (§3.1) et
  **`Version`** (§3.11) ajoutées ; colonnes URL en **`TEXT`** (§3.12). La
  structure `structDesignerPolice` porte le **nom technique**, la **famille** et
  le **libellé de graisse**. La portée IdMarque/IdClient n'a pas à remonter au
  Designer.
- **[À CONFIRMER]** Un client peut-il appartenir à plusieurs marques
  (`clt_client_marque`) → union de toutes ses marques (par défaut) ou marque
  principale ?

---

## 5. Découpage en LOTS (statuts à jour)

### Lot 0 — Fondation DB & lecture — **FAIT**
- Table `dsn_police` (colonnes + nom technique §3.3 + `Famille` §3.1 +
  `Version` §3.11 + URL en TEXT §3.12).
- `RemplirDesignerPolices(pIdClient)` : lecture 3 niveaux (3.6), tri
  Marque/Client/Alphabétique (3.7), filtre `EstActif = 1` (3.10), enrichie de
  `famille` + libellé de graisse.

### Lot 1 — Combos en cascade (famille → graisse) — **FAIT**
- Double combo cascade (3.1, 3.7) ; combo famille **cherchable « commence par »**
  + navigation clavier (3.8). Couche de présentation pure (règle d'or 3.1).

### Lot 2 — Concordance PRINT (CRITIQUE) — **FAIT (cœur)** ; finitions selon usage
- Sous-dossier `Fonts` (3.4, 3.5), nom technique dans le `\fonttbl` (3.3),
  exploitation de `policesUtilisees`. TEST PSM confirmé (§4).
- **[À SURVEILLER]** substitution `NomTechnique` vs `EstActif=0` (§3.10).

### Lot « Ajout Google Font depuis le Designer » — **FAIT** (§3.11)
- Serveur (UPSERT/Version/WebService/cache liste), client (popup, autocomplétion
  « commence par », fusion à chaud, insertion par le bas), correctifs (graisse
  d'aperçu, panneau préservé, troncature URL, quotage font-family).

### Lot 3 — Interface CLIENT (SaaS) — à faire
- Gestion des polices client (upload + CRUD), `Famille` à la saisie, soft-delete
  `EstActif` (3.10). Dépend de Lot 0 (+ outil multi-format §3.9).

### Lot 4 — Back office MARQUES — à faire
- CRUD polices niveau marque (atelier, 3.4), `Famille` à la saisie,
  **désactivation `EstActif=0`** par l'admin de marque (3.10). Dépend de Lot 0.

### Lot 5 — Back office GÉNÉRAL — à faire
- CRUD polices générales (`IdMarque`/`IdClient` NULL), `Famille` à la saisie.
  Dépend de Lot 0.

### Lot D (transverse) — Génération multi-format — à faire
- Brancher l'outil existant (landing pages) pour remplir les `*Url` à l'upload
  manuel. Dépend de la localisation de l'outil. Alimente Lots 3/4/5.

**Historique de décisions remplacées** (pour mémoire, NE PLUS appliquer) :
- Combo unique à plat → remplacée par la **cascade** (§3.1/3.8).
- Recherche « contient » → remplacée par **« commence par »** (§3.8).
- Purge **DELETE + INSERT** à l'import → remplacée par **UPSERT** (IdPolice
  préservés, §3.11).
- Soft-delete avec liste de rendu séparée des inactives → abandonné :
  **`EstActif=0` = manquante** côté Designer (§3.10).

---

## 6. Garde-fous pour Cursor (rappel méthode)

- Cursor voit le **vrai code** : utiliser les vrais noms, confirmer les
  signatures réelles. Prendre l'initiative ; l'objectif prime.
- **Ne pas reconstruire** le tuyau postMessage (injection + remontée) : il existe
  (§2).
- Respecter STRICTEMENT les règles du §3. En cas de doute ou de conflit avec le
  code réel, **le signaler** plutôt que dévier.
- **Cascade = couche de présentation uniquement** : ne jamais toucher l'identité
  appliquée, `policesUtilisees`, le print ni le `@font-face` (règle d'or 3.1).
- Travailler **lot par lot** ; ne pas empiéter sur les lots suivants.
- Ne pas coder les points marqués **[À VÉRIFIER]/[À TESTER]/[À SURVEILLER]** (§4,
  §3.10) tant qu'ils ne sont pas tranchés par le donneur d'ordre.

---

*Source de vérité — à rappeler dans chaque prompt Cursor relatif aux polices du
Designer. Toute modification du besoin passe par une mise à jour de ce document.*
