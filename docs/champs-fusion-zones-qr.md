# Champs de fusion dans les zones QR — DnD accessible + libellés lisibles

> **Source de vérité** du chantier « champs de fusion dans les panneaux QR
> intelligents » (Variante 2 validée le 11/06/2026).

---

## 1. Constat (recette du 11/06/2026)

1. **Le drag & drop existait déjà de bout en bout** mais était inaccessible :
   - pastilles draggables (`dragstart`, script.js ~5732) ;
   - handlers `dragover`/`drop` complets sur les inputs QR
     (`attachQrFieldListeners`, ~3444-3519) ;
   - insertion par double-clic dans le dernier input QR focalisé
     (`insertTag`, branche `barcode`, ~6663).
   La serrure : la règle **D14 ligne 7** (`evaluateFieldsPopupForSelection`)
   fermait la popup « Champs de fusion » dès qu'une zone code-barres était
   sélectionnée → plus aucune pastille visible à glisser.
2. **Placeholders obsolètes** : les 12 placeholders de `QR_TYPES_CONFIG`
   montraient une syntaxe `@CHAMP@` à taper à la main (`@NOM@`, `@CP@`,
   `@TELEPHONE@`, `@ID@`…), doublement fausse (noms inexistants + casse)
   et contraire au chantier nommage (`docs/nommage-variables-psm.md`).

## 2. Décision — Variante 2

Les inputs du panneau QR affichent des références **lisibles**
`@Vehicule@` (libellé), mais le JSON stocké conserve les **clés
techniques** `@LOCAL_xxx@` / `@Nom@`. Le libellé n'existe **que dans
l'affichage** des inputs.

### Principe central (invariant)

| Couche | Contenu |
|---|---|
| Inputs du panneau QR (affichage) | `@<libellé>@` — ex. `@Véhicule@`, `@Civilité@` |
| `zoneData.qrConfig.fields` / `champFusion` (JSON stocké) | `@LOCAL_xxx@` / `@Nom@` — **inchangé** |
| Chaîne PSMD / BAT / nommage (motifs a/a2/b/c, paires BAT) | **strictement inchangée** |

- **Affichage** (`renderQrFields`) : clés → libellés via la table
  bidirectionnelle (`getQrChampMappings`, source : `documentState.champsFusion`
  + `champsStandardDisponibles` — même logique de clé que les pastilles :
  `LOCAL_<localId>` si localId réel, sinon `nom`).
- **Sauvegarde** (`saveQrFieldsToZone`) : libellés → clés, y compris dans
  les valeurs mixtes (texte + plusieurs champs).
- **DnD / double-clic** : le texte inséré dans un input QR est
  `@<libellé>@` (traduction faite **au drop / à l'insertion**, pas au
  `dragstart` — le `dataTransfer` reste `@KEY@` pour ne pas perturber les
  autres cibles, zones texte Quill notamment).

### Serrure D14 assouplie

Zone code-barres **de type QR Code** (`typeCodeBarres === 'qrcode'`,
section « QR Code Intelligent » active) sélectionnée → la popup
« Champs de fusion » reste **disponible** (même règle que les zones
texte). Les codes-barres classiques (Code128, EAN…, qui passent par un
select) et les zones image / QR système conservent la règle historique
(popup fermée). Les scénarios D14/A18 (intent/shown, fermeture
contextuelle, réouverture en un clic) sont conservés à l'identique pour
les autres types de zones.

## 3. Règles de traduction

### Aller (clé → libellé, affichage)

- Motif reconnu : `@KEY@` avec `KEY` en `[A-Za-z0-9_\u00A0]` (clés
  techniques uniquement — ne touche jamais un email littéral
  `contact@exemple.com`).
- Clé connue dans la table → `@<libellé>@`. Clé inconnue → laissée brute
  (anomalie visible, signalée par la validation).

### Retour (libellé → clé, sauvegarde)

Pour chaque paire `@…@` du texte (NBSP normalisés, comparaison de
libellé **insensible à la casse**) :

1. le contenu est une **clé connue** (`LOCAL_xxx`, `Nom`, ou le nom
   technique `Champ3` d'un champ mappé — alias reconnu) → conservée telle
   quelle (priorité aux clés : pas d'ambiguïté possible, le back-office
   interdit un libellé homonyme d'un standard) ;
2. le contenu est un **libellé connu** → traduit en clé ;
3. sinon → **non traduit**, enregistré tel quel + **signalement visuel**
   (voir §4).

### Cas limites (règles assumées, pas de sur-conception)

- **Libellé contenant `@`** : exclu de la table → le champ s'affiche et
  s'insère sous sa clé brute `@LOCAL_xxx@` (pas d'échappement).
- **Libellés dupliqués** après normalisation : premier rencontré gagne
  (ordre `champsFusion` puis standards).
- **Texte contenant plusieurs `@` littéraux** (ex. deux emails dans un
  même input) : la détection par paires peut signaler à tort un « champ
  inconnu » — signalement **non bloquant**, la valeur est enregistrée
  telle quelle.

## 4. Validation à la sauvegarde

- Une paire `@X@` non reconnue (faute de frappe, champ renommé/supprimé)
  → **contour rouge** de l'input + message court « Champ inconnu : “X” »
  (pattern « Police manquante » §3.10), classe `qr-field-unknown`.
- **Non bloquant** : si l'utilisateur valide quand même, la valeur brute
  part telle quelle dans le JSON → le PSMD émettra `[X]` sans colonne de
  données correspondante → champ vide au BAT (comportement actuel d'une
  clé inconnue, désormais **visible** au lieu de silencieux).
- La validation est rejouée au rendu du panneau (réouverture → l'erreur
  réapparaît tant qu'elle n'est pas corrigée).

## 5. Aides à la saisie

- Les 12 placeholders de `QR_TYPES_CONFIG` ne montrent **plus aucune
  syntaxe `@Champ@`** : exemples de valeurs réelles (« Dupont »,
  « https://www.exemple.com », « 75001 »…).
- Une ligne d'aide unique en tête du panneau : « Glissez un champ de
  fusion dans un champ ci-dessous, ou double-cliquez sur sa pastille. »

## 6. Politique de validation pré-export (`checkDocumentIntegrity`)

> **Décision de pilotage (11/06/2026)** : la complétude des **données**
> n'est **pas** jugée par le Designer — l'échantillon `donneesApercu`
> (~20 enregistrements) n'est pas représentatif. Elle relève d'un futur
> **contrôle serveur sur la totalité des données** (tunnel Check +
> opération prête), hors périmètre ici.

Le Designer ne juge que la **structure** :

| Cas | Verdict |
|---|---|
| Champ **requis** du panneau laissé entièrement vide (aucune saisie) | **Bloquant** (problème de construction) |
| Valeur statique (sans `@KEY@`) mal formée | **Bloquant** — validée **une seule fois** (pas de boucle échantillons) |
| Valeur substituée **non vide** mal formée sur un enregistrement | **Bloquant** (enregistrement cité) |
| Valeur substituée **vide** sur un enregistrement (`@KEY@` présent dans la saisie) | **Pas d'erreur** (client sans email/téléphone plausible) |

Règles associées (11/06/2026) :

- **vCard** : champs requis pilotés par `QR_TYPES_CONFIG` (source unique,
  cohérente avec l'astérisque UI et la spec vCard) — seul **Nom** est
  obligatoire. L'ancienne règle codée en dur (Prénom, Société,
  Téléphone/Mobile) est supprimée.
- **Latitude/longitude** : virgule décimale française acceptée
  (« 48,8566 » ≡ « 48.8566 »), motif numérique **strict** (rejet des
  troncatures silencieuses `parseFloat("48,8566") → 48`), bornes ±90/±180
  inchangées (`parseCoordinate`).

## 7. Hors périmètre / invariants

- Format du JSON stocké inchangé ; chaîne PSMD/BAT inchangée (motifs
  a/a2/b/c, paires BAT, contrat `docs/nommage-variables-psm.md` intacts).
- Pas de pastilles/jetons dans les inputs (Variante 3, éventuelle V2).
- Zones de texte Quill et mécanisme de formatage (casse/dates) : non
  touchés.
