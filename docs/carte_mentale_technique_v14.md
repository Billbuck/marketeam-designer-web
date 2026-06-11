# Carte Mentale Technique — Marketeam Designer × WebDev
## Document de référence permanent — V1.4 — Mars 2026

> **Usage** : Ce document est relu en début de chaque conversation de développement.
> Il décrit le système **tel qu'il existe réellement**, pas tel qu'il devrait être.
> Corrections et mises à jour après chaque phase validée.

---

## 1. Les 3 contextes d'exécution WebDev

C'est le point le plus critique pour éviter les erreurs d'architecture.

```
┌──────────────────────────────────────────────────────────────────────┐
│  CONTEXTE 1 : CODE SERVEUR WEBDEV (WLangage)                        │
│                                                                      │
│  S'exécute sur le serveur Windows IIS/Apache.                       │
│  Accès : BDD, fichiers disque, variables globales Partage.*,        │
│          structures stDesignerLoad, HTTP vers API externe            │
│  Déclenché par : chargement page, clic bouton, AjaxExécute()        │
│                                                                      │
│  Exemples : UploadFichier(), ComposerJsonDesignerCreation(),         │
│             SauvegarderPsmdServeur(), GenerationBatDepuisPsmd()      │
└──────────────────────────────────────────────────────────────────────┘
         ↕  pont via variables <synchronisé navigateur>
         ↕  pont via clic JS sur bouton WebDev
┌──────────────────────────────────────────────────────────────────────┐
│  CONTEXTE 2 : CODE NAVIGATEUR WEBDEV (WLangage compilé en JS)       │
│                                                                      │
│  S'exécute dans le navigateur, généré par WebDev.                   │
│  Accès : variables synchronisées, éléments de la page,              │
│          peut appeler du JavaScript pur                              │
│  Déclenché par : retour Ajax, événements navigateur                  │
│                                                                      │
│  Exemples : procédures navigateur de pgeLtrContenu,                  │
│             listener postMessage Designer                             │
└──────────────────────────────────────────────────────────────────────┘
         ↕  appel direct de fonction JS
         ↕  postMessage (iframe ↔ parent)
┌──────────────────────────────────────────────────────────────────────┐
│  CONTEXTE 3 : JAVASCRIPT PUR (script.js, psmd-generator.js)         │
│                                                                      │
│  S'exécute dans le navigateur, fichiers JS chargés dans le header.  │
│  Accès : DOM, PsmdGenerator, SetVariableWebDev()                    │
│  NE PEUT PAS accéder à : BDD, fichiers disque, Partage.*            │
│                                                                      │
│  Exemples : PsmdGenerator.generatePsmdFromJson(),                    │
│             GenererPsmdNavigateur(), Designer iframe (script.js)     │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.1 Mécanismes de pont entre contextes

| De → Vers | Mécanisme | Exemple |
|-----------|-----------|---------|
| Serveur → Navigateur | Variables `<synchronisé navigateur>` + retour Ajax | `gsJsonDesignerPreversion` |
| Navigateur JS → Serveur | Clic JavaScript sur bouton WebDev dont le traitement est serveur | `document.getElementById(BTN_TraiterMessage.Alias).click()` |
| Navigateur JS → JS pur | Appel de fonction direct | `PsmdGenerator.generatePsmdFromJson(jsonData)` |
| JS pur → Navigateur/Serveur | `SetVariableWebDev("gsXmlPsmd", valeur)` | Écriture variable synchronisée |
| Designer iframe → Parent | `postMessage(JSON)` | Export Designer → WebDev |
| Parent → Designer iframe | `postMessage(JSON)` | Chargement Designer |

### 1.2 Variables synchronisées clés

| Variable | Direction | Contenu | Statut |
|----------|-----------|---------|--------|
| `gsJsonDesignerPreversion` | Serveur → JS | JSON `stDesignerLoad` sérialisé complet pour génération PSMD | ⚠️ Obsolète — plus alimentée (architecture Node.js) |
| `gsXmlPsmd` | JS → Serveur | XML PSMD généré par `psmd-generator.js` | ⚠️ Obsolète — plus utilisée (architecture Node.js) |

### ⚠️ Règles absolues

- **Jamais `ExécuteJS()`** — remplacé par procédures navigateur + variables synchronisées
- **Jamais accéder à la BDD depuis JS pur** — toujours passer par le serveur
- **`psmd-generator.js`** doit être chargé dans le **header HTML** de `pgeLtrContenu`
- **`GenererPsmdNavigateur()` passe `jsonData.data`** à `generatePsmdFromJson()` — pas `jsonData`. Le JSON complet `stDesignerLoad` a une structure `{ action, auth, data, ... }` : le document est dans `.data`, pas à la racine. Passer `jsonData` au lieu de `jsonData.data` = pages introuvables, pas d'objet fond, noms de layout "Page 1"
- **Cache navigateur** : après toute modification de `psmd-generator.js`, forcer le rechargement (vider cache IIS ou modifier URL). Un PSMD de taille identique entre deux tests = version mise en cache

---

## 2. Architecture globale du projet

```
Navigateur (client)                         Serveur Windows
┌─────────────────────────┐                 ┌──────────────────────────┐
│  WebDev pgeLtrContenu   │                 │  WebDev (IIS)            │
│  ┌───────────────────┐  │   postMessage   │  ─ BDD MySQL             │
│  │  Designer iframe  │◄─┼─────────────────┤  ─ Fichiers disque       │
│  │  (script.js)      │  │                 │  ─ cpDesigner            │
│  └───────────────────┘  │                 │  ─ Partage.*             │
│  psmd-generator.js      │                 └──────────────────────────┘
│  (chargé en header)     │                          │
└─────────────────────────┘                          │ HTTP
                                            ┌────────┴─────────────┐
                                            │  API PSM PHP         │
                                            │  (Apache localhost)  │
                                            │  ports 8280-8296     │
                                            └────────┬─────────────┘
                                                     │ COM
                                            ┌────────┴─────────────┐
                                            │  PrintShop Mail      │
                                            │  (moteur PSMD)       │
                                            └──────────────────────┘
                                            ┌──────────────────────┐
                                            │  PyMuPdfExtract API  │
                                            │  Python/Flask :5000  │
                                            └──────────────────────┘
                                            ┌──────────────────────┐
                                            │  Ghostscript         │
                                            │  (PDF → JPG)         │
                                            └──────────────────────┘
```

---

## 3. Structures de données clés

### 3.1 `StructDocument` — Structure réelle confirmée ✅

```wlangage
StructDocument est une Structure
    NomFichierOrigine          est une chaîne    // Nom original du PDF client
    NomFichierTemp             est une chaîne    // Chemin physique complet du PDF sur disque
    CodeTemp                   est une chaîne    // Code unique : IdContact + DateHeureSys()
    Repertoire                 est une chaîne    // Chemin physique répertoire upload
    TypeFichier                est une chaîne
    IdLettreContenu            est un entier
    IdTypeSupport              est un entier
    IdSupport                  est un entier
    IdSupportGrammage          est un entier
    IdPackageContenu           est un entier
    IdDocumentClient           est un entier
    IdModele                   est un entier
    IdPapier                   est un entier
    PeutEtrePorteAdresse       est un booléen
    FichierApercu              est une chaîne
    QuantiteDocumentClient     est un entier
    DelaiOffsetSupplementaire  est un entier
    DelaiLaserSupplementaire   est un entier
    EstBloquantHorsDotation    est un booléen
    EstPersonnalisable         est un booléen
    ModeImpression             est une chaîne
    ModeImpressionSelectionne  est une chaîne
    EstPdfClient               est un booléen
    EstDocumentEnAttente       est un booléen
    EstRectoVerso              est un booléen
    EstFondPerdu               est un booléen
    EstPapierCouche            est un booléen
    NombrePage                 est un entier
    EstUploadé                 est un booléen
    A4PliableMachine           est un booléen
    HauteurFerme               est un numérique(4,1)
    LargeurFerme               est un numérique(4,1)
    HauteurOuvert              est un numérique(4,1)
    LargeurOuvert              est un numérique(4,1)
    NbPageObligatoire          est un entier
    Poids                      est un monétaire
    PrixAchatContenu           est un monétaire
    DeductionContenu           est un monétaire
    LibelleTypeSupport         est une chaîne
    LibelleSupport             est une chaîne
    LibelleFormat              est une chaîne
    LibelleGrammage            est une chaîne
    LibellePapier              est une chaîne
    NbPageTotale               est un entier
    Designation                est une chaîne
    tabStBalise                est un tableau de structBalise
    tabPagePDF                 est un tableau de structPagePdf
    tabImageFond               est un tableau de structDocumentImage  // JPG fond Ghostscript (Designer)
    tabImageBat                est un tableau de structDocumentImage  // JPG BAT PrintShop (tunnel)
    JsonDesignerData           est une chaîne        // Bloc "data" JSON retourné par le Designer
    EstPersonnaliseDesigner    est un booléen         // Vrai = personnalisé via le Designer
    DateHeureDesigner          est une DateHeure      // Date/heure dernière sauvegarde Designer
    CheminPsmdTemp             est une chaîne         // Chemin physique complet du .psmd temporaire
    NomFichierPsmd             est une chaîne         // Nom du fichier PSMD (sans répertoire)
FIN
```

### 3.2 `structPagePdf` — Structure réelle confirmée ✅

```wlangage
structPagePdf est une Structure
    IdFormatImpression         est un entier
    EstPortrait                est un booléen
    EstFondPerdu               est un booléen
    NumeroPage                 est un entier
    HauteurInterne             est un réel       // TrimBox hauteur mm
    LargeurInterne             est un réel       // TrimBox largeur mm
    HauteurExterne             est un réel       // BleedBox hauteur mm
    LargeurExterne             est un réel       // BleedBox largeur mm
    HauteurFormat              est un réel
    LargeurFormat              est un réel
    Rotation                   est un numérique(3,1)
    FondPerduHautMm            est un réel       // Fond perdu haut en mm
    FondPerduBasMm             est un réel       // Fond perdu bas en mm
    FondPerduGaucheMm          est un réel       // Fond perdu gauche en mm
    FondPerduDroiteMm          est un réel       // Fond perdu droit en mm
    FondPerduMinimumMm         est un réel       // Minimum des 4 côtés
FIN
```

### 3.3 `structDocumentImage`

```wlangage
structDocumentImage est une Structure
    CheminRelatif              est une chaîne    // Chemin HTTP relatif (pour affichage navigateur)
    CheminPhysique             est une chaîne    // Chemin disque complet (pour traitements serveur)
FIN
```

### 3.4 `stDesignerPage` — Structure réelle confirmée ✅ (V1.1)

```wlangage
stDesignerPage est une Structure
    'numero'        est un entier       <sérialise = "numero">
    'nom'           est une chaîne      <sérialise = "nom">        // "Recto" ou "Verso"
    'urlFond'       est une chaîne      <sérialise = "urlFond">    // URL HTTP JPG fond Designer
    'cheminFond'    est une chaîne      <sérialise = "cheminFond"> // Chemin physique PDF (pour PSMD)
fin
```

> ⚠️ `cheminFond` ajouté en V1.1. Même valeur pour Recto et Verso (même PDF).
> C'est `pdf_pagenumber_expression` dans le PSMD qui différencie les pages (1 ou 2).

### 3.5 `stDesignerLoad` — Structure JSON envoyée au Designer

| Membre | Type | Rôle |
|--------|------|------|
| `action` | chaîne | Toujours `"load"` |
| `auth` | `stDesignerAuth` | Credentials + URLs webservice |
| `bases` | `stDesignerBaseListe` | Bases de données de l'opération |
| `theme` | chaîne | Thème CSS (`"LTR"`, `"MKT"`, etc.) |
| `Document` | `stDesignerDocument` | Document complet (format, pages, zones) |
| `constraints` | `stDesignerConstraints` | Autorisations et limites |
| `limites` | `stDesignerLimites` | Limites ZIP images |
| `policesDisponibles` | tableau `stDesignerPolice` | Polices disponibles dans l'UI |

### 3.6 `stDesignerDocument` — Membres clés

| Membre | Contenu |
|--------|---------|
| `identification` | id, nom, date |
| `formatDocument` | largeurMm, hauteurMm, fondPerdu, traitsCoupe, margeSecurite |
| `pages` | tableau `stDesignerPage` (urlFond + cheminFond) ✅ V1.1 |
| `zonesTexte` | tableau `stDesignerZoneTexte` |
| `zonesImage` | tableau `stDesignerZoneImage` |
| `zonesQR` | tableau `stDesignerZoneQR` |
| `zonesCodeBarres` | tableau `stDesignerZoneCodeBarres` |
| `champsFusion` | tableau `stDesignerChampFusion` |
| `donneesApercu` | tableau `stDesignerEnregistrement` |

---

## 4. Workflow complet Phase 4 — Pré-version BAT ✅ V1.4

### Workflow réel — FONCTIONNEL (validé 17/03/2026) — Architecture 100% serveur

```
SERVEUR — UploadFichier()
│
├─ Phase 1 : Partage.PdfAnalyseDocument() → tabPagePDF rempli          [✅]
│     Contrôles : fond perdu attendu vs réel, symétrie fond perdu
│     Stocke : MediaBox/BleedBox/TrimBox coords dans tabPagePDF[n]
│
├─ Phase 1bis : SI EstFondPerdu ET MediaBox ≠ BleedBox (PDF mal formé)  [✅ V1.4]
│     → GET normalize_bleedbox (PyMuPdfExtract V2.3)
│     → MediaBox = BleedBox (valeurs raw PDF) via xref_set_key
│     → Contenu PDF préservé — aucun re-rendu
│
├─ Phase 2 : Partage.GenereVignette(pEstFondPerdu, pLargeurExt, pHauteurExt) [✅]
│     SI fond perdu → -dFIXEDMEDIA -dUseBleedBox + dimensions BleedBox
│     SI pas fond perdu → -dPDFFitPage -dUseTrimBox
│     → tabImageFond (LtrFond*)
│
├─ Phase 3 : SI pas EstFondPerdu →                                       [✅]
│     AppliqueBlancTournant(cheminJpg, LargeurOuvert, HauteurOuvert)
│
├─ ComposerJsonDesignerCreation() → sJsonDesigner                        [✅]
│     → pages[n].cheminFond = chemin physique PDF (normalisé)
│     → formatPapierLargeurMm / formatPapierHauteurMm depuis ltr_format_impression
│
├─ Partage.GenererPsmdServeur(stDocument) → .psmd via Node.js            [✅]
│
└─ GenererBatDepuisPsmd(stDocument) → BAT JPG via API PSM PHP            [✅]
       → POST JSON données fusion → tabImageBat
```

### ⚠️ Éléments supprimés / obsolètes (ne plus utiliser)

| Élément | Remplacé par |
|---------|-------------|
| `gsJsonDesignerPreversion` | `sJsonDesigner` variable locale dans `UploadFichier` |
| `gsXmlPsmd` | Fichier `.psmd` écrit directement par Node.js |
| `GenererPsmdNavigateur()` (JS) | `Partage.GenererPsmdServeur()` (WLangage) |
| `BTN_TraiterMessage` (bouton caché) | Appel direct `GenererBatDepuisPsmd()` |
| `SauvegarderPsmdServeur()` | **Renommée** `GenererBatDepuisPsmd()` |

---

## 5. Workflow Designer — Personnalisation (Phases 5-7)

```
Designer iframe → exportToWebDev() → postMessage
Listener postMessage → sJsonDesigner reçu
→ Partage.GenererPsmdServeur(sJsonDesigner, nIndex)  [Node.js → .psmd]
→ GenererBatDepuisPsmd()                             [BAT JPG → tabImageBat]
→ Sauvegarde JSON Designer en BDD
→ BAT final affiché
```

> ⚠️ Architecture à définir pour le workflow complet Phases 5-7 (prochaine session)

---

## 6. Recensement des procédures WebDev

### 6.1 Collection `cpDesigner`

| Procédure | Rôle | État |
|-----------|------|------|
| `RemplirDesignerAuth()` | Bloc credentials + URLs webservice | ✅ |
| `RemplirDesignerBases()` | Liste bases BDD de l'opération | ✅ |
| `RemplirDesignerConstraints()` | Autorisations et limites globales | ✅ |
| `RemplirDesignerLimites()` | Limites ZIP (taille, formats) | ✅ |
| `RemplirDesignerIdentification()` | id, nom, type document | ✅ |
| `RemplirDesignerFormat()` | Dimensions + fond perdu 4 côtés | ✅ |
| `RemplirDesignerChampsFusion()` | Champs @NOM@, @PRENOM@... | ✅ |
| `RemplirDesignerPolices()` | Polices disponibles dans l'UI | ✅ |
| `RemplirDesignerApercu()` | Échantillon données publipostage | ✅ |
| `RemplirDesignerPages(pEstRectoVerso, pTabDocumentImage, pCheminPdfFond)` | Pages + urlFond (JPG) + cheminFond (PDF) | ✅ V1.1 |
| `RemplirDesignerZonesSystemeDocument()` | Zone adresse + RTF Verdana 10pt complet | ✅ V1.1 |
| `RemplirDesignerZonesSystemeEnveloppe()` | Zones système sur enveloppe | ✅ |
| `ComposerJsonDesignerCreation()` | Orchestrateur JSON création ET réouverture (recomposition systématique du wrapper, data repris du JSON sauvegardé) — inclut formatPapierLargeurMm/HauteurMm depuis ltr_format_impression | ✅ V1.3 |
| `ComposerJsonDesignerModification()` | ~~Orchestrateur JSON modification~~ — **supprimée juin 2026** (code mort, jamais appelée ; la réouverture passe par `Creation`) | ❌ |

### 6.2 Collection `Partage`

| Procédure | Rôle | État |
|-----------|------|------|
| `PdfAnalyseDocument()` | Analyse PDF via PyMuPdfExtract (port 5000) | ✅ |
| `GenereVignette(pPdf, pVignettes, pEstFondPerdu, pLargeurExterneMm, pHauteurExterneMm)` | PDF → JPG via Ghostscript — BleedBox avec dimensions explicites si fond perdu | ✅ V1.3 |
| `AppliqueBlancTournant(pCheminJpg, pLargeurMm, pHauteurMm, pEpaisseurMm)` | Bordure blanche intérieure sur JPG — calcul px depuis dimensions réelles | ✅ V1.2 |
| `GenererPsmdServeur(stDocument est une StructDocument)` | JSON Designer → .psmd via Node.js (psmd_cli.js) | ✅ V1.2 |
| `GenerationBatDepuisPsmd(pCheminPsmd, pCheminJpgSortie, pNumPage, ptabPrintshopData)` | PSMD → JPG via API PSM PHP — POST JSON données fusion | ✅ V1.2 |

### 6.3 Procédures serveur — pgeLtrContenu

| Procédure | Rôle | État |
|-----------|------|------|
| `UploadFichier()` | Upload PDF + Phases 1-1bis-2-3-4 — normalise BleedBox si nécessaire | ✅ V1.4 |
| `GenererBatDepuisPsmd(stDocument)` | Lit CheminPsmdTemp → construit tabPrintshopData → génère BAT JPG | ✅ V1.2 |
| `ServeurTraiterMessageDesigner()` | Traite le JSON validé par le Designer → GenererPsmdServeur + GenererBatDepuisPsmd | ✅ V1.3 |

### 6.4 Procédures navigateur — pgeLtrContenu (⚠️ obsolètes)

| Procédure | Rôle | État |
|-----------|------|------|
| `GenererPsmdNavigateur()` | ~~Appelle psmd-generator.js + pont vers serveur~~ | ⚠️ Obsolète — à supprimer |
| `SauvegarderPsmdServeur()` | ~~Sauve XML PSMD sur disque~~ | ⚠️ Renommée `GenererBatDepuisPsmd()` |

### 6.5 JavaScript pur

| Fichier | Rôle | Taille |
|---------|------|--------|
| `psmd-generator.js` | Génération XML PSMD depuis JSON (navigateur ET Node.js) | ~2 400 lignes |
| `psmd_cli.js` | Wrapper Node.js CLI pour psmd-generator.js (serveur) | ~120 lignes |
| `script.js` | Éditeur Designer (Quill.js, zones, export) | ~24 000 lignes |

### 6.6 Configuration INI serveur

```ini
[GHOSTSCRIPT]
CHEMIN=<chemin gs.exe>

[IMAGEMAGICK]
CHEMIN=<chemin magick.exe>

[NODE]
CHEMIN=C:\Program Files\nodejs\node.exe
CLI=<chemin physique psmd_cli.js>
```

### 6.7 API PHP PrintShop Mail — `psmthread.php`

| Paramètre | Valeur | Note |
|-----------|--------|------|
| `SetJPEGQuality(DPI, qualité)` | `(300, 100)` | 300 DPI, qualité max — V1.2 (était 175) |
| Redémarrage requis | `psm_autostart.php` | Après toute modification `psmthread.php` |

### 6.8 BDD — `ltr_format_impression`

| Colonne | Rôle |
|---------|------|
| `IdFormatImpression` | Clé primaire |
| `Format` | Code format (A4, SRA4, SRA3...) |
| `Largeur` / `Hauteur` | Dimensions en mm |
| `EstFeuillePapier` | 1 = format papier physique (SRA, A3...) |
| `IdFormatPapier` | FK vers le format papier SRA associé (ex: A4 → SRA4) |

Correspondances actives : A4 → SRA4 (225×320mm), A3 → SRA3 (320×450mm)

### 6.9 API Python PyMuPdfExtract — V2.3

| Endpoint | Rôle | Note |
|----------|------|------|
| `GET /PyMuPdfExtract/status` | Vérification API en ligne | |
| `GET /PyMuPdfExtract/validate?file=<chemin>` | Analyse complète PDF | Remplit tabPagePDF |
| `GET /PyMuPdfExtract/formats` | Liste formats standards | |
| `GET /PyMuPdfExtract/normalize_bleedbox?file=<chemin>` | Normalise PDF : MediaBox = BleedBox | V2.3 — valeurs raw PDF |

**`normalize_bleedbox` — principe clé V2.3** :
- Utilise `xref_get_key('BleedBox')` (valeurs **raw PDF natif**) — pas `page.bleedbox` (coordonnées transformées PyMuPDF)
- Écrit `MediaBox = BleedBox` sans remappage à (0,0) — le contenu n'est pas déplacé
- Supprime CropBox pour qu'elle hérite de la nouvelle MediaBox
- Sauvegarde via fichier `.tmp` pour éviter les erreurs de verrou Windows

---

## 7. Ce qui reste à implémenter

| Priorité | Sujet | Détail |
|----------|-------|--------|
| 🟡 Prochain | **Sauvegarde JSON Designer en BDD** | Post-validation → stocker `JsonDesignerData` en BDD liée à l'opération |
| ✅ Résolu autrement | **Réouverture d'un document existant** | Recomposition systématique du wrapper via `ComposerJsonDesignerCreation()` + injection du data sauvegardé (`ComposerJsonDesignerModification()` supprimée juin 2026, code mort) |
| 🟡 Prochain | **Formats fond perdu A5→SRA5, A6** | Correspondances dans `ltr_format_impression` + logique WebDev/psmd-generator (mémorisé) |
| 🟢 Plus tard | **Nettoyage obsolètes** | Supprimer `GenererPsmdNavigateur()`, `BTN_TraiterMessage`, `gsXmlPsmd`, `gsJsonDesignerPreversion` |

---

## 8. Faux bugs documentés — À NE PAS corriger

### ❌ `<n>` vs `<name>` dans `psmd-generator.js`

**Il n'y a PAS de bug `<name>` → `<n>` dans `psmd-generator.js`.**

Ce faux bug a été signalé à plusieurs reprises par Claude en mal interprétant les fichiers
PSMD. Un prompt Cursor erroné avait tenté de remplacer `<n>` par `<name>` — **régression**
qui a dû être annulée immédiatement.

**La réalité** : `psmd-generator.js` utilise correctement `<n>` partout.

**Règle absolue** : Ne jamais ouvrir de sujet de correction sur ce point. Si Claude le
mentionne à nouveau, lui rappeler cet historique et ignorer la suggestion.

---

## 9. Constantes et chemins

| Constante | Valeur / Rôle |
|-----------|--------------|
| `__DOC_LTR__` | Préfixe fichier PDF lettre |
| `__DOC_LTR_BAT__` | Préfixe fichier JPG BAT |
| `__DOC_LTR_PSMD__` | Préfixe fichier PSMD |
| `__PDF__` | Extension `.pdf` |
| `__JPG__` | Extension `.jpg` |
| `cpProjet.__sRepRacine` | Chemin physique racine serveur |
| `cpProjet.__sRepUpload` | Sous-répertoire upload |
| `cpProjet.__sMarketeamRepRacine` | Racine Marketeam (pour chemins relatifs BAT) |
| `cpProjet.__sHttpMarketeam` | URL HTTP base Marketeam |
| `PSM_ServeurUrl` | URL API PSM PHP (paramètre BDD `prm_parametre`) |

---

## 10. Règles non-négociables

| Règle | Détail |
|-------|--------|
| **V3.3 strict** | Propriétés françaises : `contenuRtf`, `alignementH/V`, `couleurCmjn`, etc. |
| **Encodage PSMD** | `ChaîneVersUTF8()` avant `fSauveTexte()` |
| **Anti-cache PSM** | `CloseDocument()` avant `OpenDocument()` dans l'API PSM PHP |
| **Anti-verrouillage CSV** | Nom unique (timestamp + aléatoire) + suppression après usage |
| **PNG vs JPEG** | JPEG pour images opaques (85%), PNG uniquement si transparence |
| **Chemin PDF dans PSMD** | Chemin physique Windows complet (ex: `D:\Marketeam\Upload\ltr-xxx.pdf`) |
| **JSDoc obligatoire** | Toute nouvelle fonction dans `script.js` ou `psmd-generator.js` |
| **Section 1 DOM** | `document.getElementById()` uniquement en Section 1 de `script.js` |
| **RTF zone adresse** | `\fnil` (pas `\fswiss`), `\colortbl`, `\cf1`, `\fs20`, `\line`/`\par` |
| **Cache navigateur** | Après modification `psmd-generator.js` : vider cache IIS avant test |
| **`nom` vs `name`** | WebDev sérialise `stDesignerPage.nom` (français) → `psmd-generator.js` lit `.nom \|\| .name` |
| **Round-trip opaque** | `cheminFond`, `formatPapierLargeurMm`, `formatPapierHauteurMm` : stockés à la réception du `load`, restitués à l'export `validated` — jamais recalculés côté serveur |
| **Fond Ghostscript** | Préfixe `__DOC_LTR_FOND__` (jamais `__DOC_LTR_BAT__`) — fichiers distincts pour éviter écrasement |
| **Fond perdu Ghostscript** | `-dFIXEDMEDIA -dUseBleedBox` + dimensions BleedBox en points — sans `-dPDFFitPage` |
| **DEVMODE fond perdu** | Utilise `formatPapierLargeurMm/HauteurMm` (SRA) — pas les dimensions BleedBox ni TrimBox |
| **Marges PSMD fond perdu** | `(formatPapierMm - BleedBoxMm) / 2` × 2.834645669 — centrage symétrique dans la feuille SRA |
| **normalize_bleedbox** | Utiliser `xref_get_key('BleedBox')` (raw PDF) — jamais `page.bleedbox` (coordonnées transformées PyMuPDF) |
| **normalize_bleedbox ordre** | Appelé AVANT Ghostscript — Phase 1bis dans `UploadFichier` |
| **Fond perdu symétrique** | Rejeté si les 4 côtés ne sont pas identiques (PrintShop Mail limite) |

---

*Marketeam Designer — Carte Mentale Technique V1.4 — 17 Mars 2026*
*Prochaine mise à jour : après implémentation sauvegarde JSON BDD (réouverture : recomposition via ComposerJsonDesignerCreation, juin 2026)*