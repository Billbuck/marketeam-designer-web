# Cahier des charges — Formatage serveur des valeurs en sortie

**Procédure : `Partage.FormateValeurSortie`**
Version 1.1 — 15/06/2026
Statut : contrat verrouillé — prêt pour l'écriture du code.

> Évolution 1.1 : ajout d'un type de champ **« Coordonnée »**. Le risque
> « QR géo » est désormais traité par ce type (section dédiée §2.6) — l'ancienne
> analyse de risque est close.

---

## 0. Objectif

Mettre en forme les valeurs des champs de fusion **selon le type du champ**, à la
**sortie**, pour les rendre exploitables :

1. par les **échantillons envoyés au Designer** (aperçu + BAT) ;
2. par l'**export des fichiers de production** pour l'atelier.

**Un seul point de passage** → concordance écran/print garantie : la même valeur
formatée alimente l'aperçu, le BAT et, demain, l'export production.

C'est la concrétisation du « plan B » écarté côté Designer pour Entier/Monétaire
(aucune fonction d'expression PSM 7.2) : **le formatage vit dans la donnée.**

---

## 1. Contrat d'entrée (prouvé par `TraiteValeurLoadData`)

`FormateValeurSortie` est la procédure **symétrique** de `TraiteValeurLoadData`
(module d'import du webservice), qui prouve ce que contiennent **réellement** les
colonnes en base après import :

| Type | Constante | Contenu en base |
|---|---|---|
| Texte / Code postal / Alliage | `__CHAMP_TYPE_TEXTE/CODEPOSTAL/ALLIAGE__` | nettoyé, tronqué |
| Téléphone / Portable | `__CHAMP_TYPE_TELEPHONE/PORTABLE__` | `33XXXXXXXXX` (11 car.) ou NULL |
| Date | `__CHAMP_TYPE_DATE__` | **AAAAMMJJ** (8 chiffres) ou NULL |
| Heure | `__CHAMP_TYPE_HEURE__` | `HH:MM` ou `HH:MM:SS` |
| Email | `__CHAMP_TYPE_EMAIL__` | minuscule |
| URL | `__CHAMP_TYPE_URL__` | validée |
| Entier / Décimal / Monétaire | `__CHAMP_TYPE_ENTIER/DECIMAL/MONETAIRE__` | **virgule décimale, sans espace, sans séparateur de milliers, sans symbole** ; vide/invalide → `"0"` |

**Point clé** : les trois types numériques passent **tous par `CleanNumerique`**.
La distinction ENT / DEC / MON ne se fait pas en base : elle vient du **type fin
du champ** (`structBaseChamp.Type`) — l'information dont `FormateValeurSortie` a
besoin.

> **Nouveau type (v1.1)** : on ajoute un 14ᵉ type **« Coordonnée »** (cf. §2.6 et
> §8). Il n'existe pas encore dans `TraiteValeurLoadData` : il faudra y ajouter un
> `cas` à l'import (traitement dédié, jamais `CleanNumerique`).

---

## 2. Contrat de sortie

| Type champ | En base | Sortie | Exemple |
|---|---|---|---|
| Entier (ENT) | `1234` | séparateur milliers, 0 décimale | `1 234` |
| Décimal (DEC) | `1234,2` | séparateur milliers + 2 décimales | `1 234,20` |
| Monétaire (MON) | `4587,1` | séparateur milliers + 2 décimales + ` €` | `4 587,10 €` |
| **Coordonnée (COO)** | `48.8566` | **INCHANGÉ (point décimal, pleine précision)** | `48.8566` |
| **Date (DAT)** | `20260615` | **INCHANGÉ (AAAAMMJJ brut)** | `20260615` |
| Heure (TIM) | `14:30` | inchangé | `14:30` |
| Téléphone (TEL) | `33123456789` | `0X XX XX XX XX` | `01 23 45 67 89` |
| Portable (SMS) | `33612345678` | `0X XX XX XX XX` | `06 12 34 56 78` |
| Texte / Email / URL / CP / Alliage | nettoyé | inchangé (pass-through) | — |

### 2.1 Numériques (ENT / DEC / MON)

- **Séparateur de milliers : espace insécable `Caract(160)`** (jamais d'espace normal).
- **Décimales** : ENT → 0 ; DEC et MON → **toujours 2** (arrondi à 2).
- **Monétaire** : suffixe ` €` précédé d'un **espace insécable**.
- **Signe négatif conservé** : `-1 234,50`.
- **Valeur `"0"`** (numérique vide à l'import) : rendue formatée → `0`, `0,00`, `0,00 €`.

### 2.2 Dates (DAT) — INCHANGÉ

Restent en **AAAAMMJJ brut**. Raison : `DATE()` de PSM exige AAAAMMJJ, et les
masques de date du Designer (déjà livrés) produisent l'affichage final via
`DATE([Champ],"masque")`. Formater en amont casserait ce mécanisme.

### 2.3 Heure (TIM) — pass-through

Déjà au format `HH:MM(:SS)` à l'import. Renvoyée inchangée.

### 2.4 Téléphone / Portable (TEL / SMS)

`33XXXXXXXXX` → `0X XX XX XX XX` : retirer `33`, préfixer `0`, grouper par paires
séparées d'un **espace insécable** `Caract(160)`. Fonctionne fixes et mobiles.
Défensif : vide → vide ; non conforme → renvoyé tel quel.

### 2.5 Texte / Email / URL / Code postal / Alliage — pass-through

Déjà nettoyés à l'import. Renvoyés inchangés.

### 2.6 Coordonnée (COO) — NOUVEAU TYPE

Type dédié aux **latitudes / longitudes** utilisées dans les QR de géolocalisation.

**Règle (import ET sortie) : point décimal, pleine précision, aucun espace,
aucun arrondi, aucun symbole.**

- **À l'import** (`TraiteValeurLoadData`, nouveau `cas`) : retirer les espaces,
  **forcer le point décimal** (virgule → point), conserver toutes les décimales.
  → en base : `48.8566`.
- **À la sortie** (`FormateValeurSortie`) : **pass-through** (renvoyée telle quelle).

**Pourquoi un type à part :** une coordonnée a besoin de ~6 décimales et d'un
**point** (jamais de virgule). Le format DEC l'arrondirait à 2 et ajouterait un
espace → QR cassé. De plus, l'URI `geo:lat,lng` utilise la **virgule comme
séparateur lat/long** : une coordonnée contenant une virgule (`48,8566`) casse le
QR. Le type Coordonnée garantit le point décimal, ce dont le QR a besoin.

---

## 3. Signature & emplacement

```
Partage.FormateValeurSortie(pValeur est une chaîne, pType) : chaîne
```

- **Emplacement** : `webdev/Partage/` (partagée, comme `SanitiseNomPsm`).
- **Paramètres** : valeur brute (base) + type fin du champ. Pas de paramètre de
  taille (aucune re-troncature), pas de paramètre d'encodage (cf. §5.2).
- **Structure** : un `selon pType`, des procédures internes par type (miroir de
  `TraiteValeurLoadData`) : `FormateNumerique`, `FormateTelephone`. Coordonnée /
  Date / Heure / Texte / Email / URL / CP / Alliage → pass-through.

---

## 4. Les deux consommateurs

1. **Échantillons Designer** (aperçu + BAT) : appel unique dans
   `cpDesigner.RemplirDesignerApercu`, dans la boucle `pour tout stBaseChamp de
   taaBaseChamp` (cf. §5.1).
2. **Export production** (chantier 3) : valeurs formatées dans le CSV atelier
   (sauf dates AAAAMMJJ brut et coordonnées brutes).

> Le module d'export (chantier 3) n'existe pas encore. Ce chantier livre **la
> procédure + le branchement côté échantillons** ; l'export réutilisera la même
> procédure.

---

## 5. Points techniques — ACQUIS (analyse Cursor)

### 5.1 Point d'application côté échantillons — CONFIRMÉ

`cpDesigner.RemplirDesignerApercu` est le **seul** endroit où la valeur (par
enregistrement) et le type fin coexistent : boucle `pour tout stBaseChamp de
taaBaseChamp` (lignes 60-66), valeur ligne 64, type dans `stBaseChamp.Type`.
L'appel à `FormateValeurSortie(valeur, stBaseChamp.Type)` se place **dans cette
boucle**.

- Les champs SYS (Sequentiel, Timbre, Rapprochement) sont ajoutés **après** la
  boucle, hors `taaBaseChamp` → naturellement hors périmètre.
- `GenererBatDocumentDepuisPsmd` **relit `donneesApercu`** (déjà composé là) sans
  re-résoudre les valeurs → un seul formatage couvre **aperçu + BAT**.
- `structBaseChamp.Type` est garanti renseigné dans **les deux régimes** :
  - création : `ChargeTaaCltBaseChamp:46` (clt_base_champ.Type) →
    `AjouteBaseDeDonnées:26-28` → `pgeBaseDonnées/Valider:40`
    (`CalculeTaaBaseChamp`) → `taaBaseChamp` ;
  - modification : `ChargeTaaDosBaseChamp:48` (dos_base_champ.Type) via
    `ChargeTabStructBase` → `ChargeStructOperation`.
  - Seule réserve (hors workspace, non bloquante) : que ces colonnes BDD
    contiennent bien les codes `__CHAMP_TYPE_*` (sinon repli silencieux sur `TXT`)
    — même dépendance que les masques de date livrés.

### 5.2 Encodage (espace insécable + €) — CONFIRMÉ

Convention en place : `Sérialise(psdJSON+psdMiseEnForme)` → `ChaîneVersUTF8`
(parse) → `JSONVersChaîne` (émission) → `JSON.parse` + `postMessage`. **Aucune**
étape n'utilise `psdJSONEncodageUTF8` (0 occurrence réelle dans le dépôt). Donc
`Caract(160)` et `€` transitent sans double encodage.

### 5.3 Interaction avec la casse (UPPER/LOWER/PROPER) — CONFIRMÉ

Orthogonale au formatage : un champ numérique ne se voit pas proposer la casse, et
`applyCaseFormat` est neutre sur les chiffres/espaces/`€`. Aucun conflit.

---

## 6. Hors périmètre V1

- Format unique par colonne, pour tous les documents (limite assumée).
- Module d'export production = **chantier 3** (séparé).
- Contrôle de complétude des champs vides = **chantier 2** (séparé).

---

## 7. Historique des décisions

- **Entier/Monétaire côté Designer : ABANDONNÉ** (aucune fonction d'expression
  PSM 7.2). → Couvert ici par le formatage dans la donnée.
- **Séparateur de milliers** : espace insécable `Caract(160)` — 15/06/2026.
- **Téléphone/Portable** : mise en forme `0X XX XX XX XX` — 15/06/2026.
- **Risque QR géo** (lat/long pointant une colonne DEC/MON) : **clos** par
  l'ajout du type **Coordonnée** — 15/06/2026. La valeur reste brute (point
  décimal), le QR n'est jamais cassé.

---

## 8. Empreinte du nouveau type « Coordonnée »

Ajouter le type touche quelques points (le cœur de ce chantier reste les deux
`cas` de formatage) :

| # | Où | Quoi |
|---|---|---|
| 1 | Constantes WebDev | Nouvelle constante `__CHAMP_TYPE_COORDONNEE__` = code `COO` (à confirmer). |
| 2 | `TraiteValeurLoadData` (import) | Nouveau `cas` → forcer point décimal, pleine précision (jamais `CleanNumerique`). |
| 3 | `FormateValeurSortie` (sortie) | Nouveau `cas` → pass-through. |
| 4 | `RemplirDesignerTypesDisponibles` | Ajouter `COO` / libellé « Coordonnée » dans le combo Type de la modale « Ajouter un champ ». |
| 5 | Designer (modale création) | Placeholder coordonnée (ex. `48.8566`) ; validation légère possible (lat -90..90 / long -180..180). |
| 6 | Définition des champs (amont, hors workspace) | Pouvoir affecter `COO` à `clt_base_champ.Type` / `dos_base_champ.Type` quand l'utilisateur déclare une colonne « Coordonnée ». |

> Le code `COO` est proposé (1ʳᵉ lettres de « Coordonnée », cohérent avec
> DEC/MON/DAT). Alternative possible : `GPS`. À trancher au démarrage du code.
