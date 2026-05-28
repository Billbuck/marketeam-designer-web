# Cahier des charges — États et comportements des champs de fusion
## Marketeam Designer

**Statut :** Référence unique validée
**Périmètre :** Comportement de chaque type de champ dans la popup « Champs de fusion », dans les zones du document, et en aperçu/production.

Ce document est la **source de vérité** pour la déclaration et l'exploitation des champs de fusion. Toute correction du code doit être confrontée à cette grille. Il remplace les décisions implicites éparpillées dans le code.

---

## 1. Principes généraux

1. **Deux régimes** régissent tout le comportement :
   - **SANS base de données**
   - **AVEC base de données**

   Une **base supprimée** se comporte **exactement** comme s'il n'y avait jamais eu de base (régime SANS base).

2. **Trois couleurs** dans la popup et les zones, selon une cascade unique :

   ```
   Le champ est-il INSÉRÉ dans le document (exploité) ?
   ├─ NON  → GRIS   (déclaré mais pas utilisé)
   └─ OUI  → a-t-il une VALEUR résolvable ?
             ├─ OUI → VERT   (exploité + valeur)
             └─ NON → ROUGE  (exploité mais orphelin, sans valeur)
   ```

   Précision : le **ROUGE** s'affiche aussi dans la popup pour un champ absent de la base, **même non inséré** (voir §3).

3. **Règle centrale — AVEC base :**
   Seule la **base** alimente les valeurs. **La fiche client n'intervient JAMAIS** lorsqu'une base est présente.
   **Tout champ absent de la base** (standard ou spécifique) est **ROUGE**, sa **valeur en aperçu est VIDE**, et son **insertion est bloquée**.
   *Objectif : ne jamais imprimer une mauvaise donnée (notamment dans l'adresse destinataire) ; n'exploiter que les champs réellement présents dans la base.*

4. **Sources de valeur selon le régime :**
   - **SANS base :** Standard → **fiche client** · Spécifique → **échantillon** (obligatoire)
   - **AVEC base :** champ présent → **base** · champ absent → **vide (rouge)**

5. **La base prime toujours.** Un champ qui correspond à une colonne de la base prend les valeurs de la base, jamais l'échantillon ni la fiche client.

6. **Échantillon obligatoire** pour tout champ spécifique (toujours une valeur de repli sans base).

7. **Champs système** (Séquentiel, Timbre) : **retirés de la popup** « Champs de fusion ». Ils ne sont pas exploitables par l'utilisateur ; ils existent uniquement en coulisses pour la production (PSMD, tri postal, affranchissement).

8. **Marqueur dans le contenu :**
   - Standard → `@nom@` (nom technique, ex `@Civilite@`)
   - Spécifique → `@LOCAL_<identifiant>@` (identifiant stable)

---

## 2. RÉGIME SANS BASE

Deux types exploitables dans la popup : **Standard** et **Spécifique**.

| Comportement | STANDARD | SPÉCIFIQUE |
|---|---|---|
| **Couleur** | inséré = vert · non inséré = gris (jamais rouge) | inséré = vert · non inséré = gris (jamais rouge) |
| **Supprimable** | inséré = non · non inséré = oui | inséré = non · non inséré = oui |
| **Renommer (libellé)** | **Non** | **Oui** |
| **Changer le type** | **Non** | **Oui** |
| **Valeur en aperçu** | Fiche client (ex « Monsieur ») | Échantillon (obligatoire) |
| **Marqueur** | `@nom@` | `@LOCAL_xxx@` |
| **Si on ajoute une base** | présent en base → se connecte · absent → rouge | colonne de même libellé → se connecte · absent → rouge |

*Pas de rouge en régime sans base : le standard a toujours la fiche client, le spécifique a toujours son échantillon obligatoire.*

---

## 3. RÉGIME AVEC BASE

Quatre situations, selon le type (Standard / Spécifique) et la présence ou non d'une colonne correspondante dans la base.

| Comportement | STANDARD présent | STANDARD absent | SPÉCIFIQUE présent | SPÉCIFIQUE absent |
|---|---|---|---|---|
| **Couleur** | inséré = vert · non inséré = gris | **ROUGE** (popup + zone), même non inséré | inséré = vert · non inséré = gris | **ROUGE** (popup + zone), même non inséré |
| **Supprimable** | **Non** (vient de la base) | **Oui** (pour nettoyer) | **Non** (vient de la base) | **Oui** (pour nettoyer) |
| **Renommer (libellé)** | Non | Non | Non | Non |
| **Changer le type** | Non | Non | Non | Non |
| **Valeur en aperçu** | Base (destinataires) | **VIDE** | Base (destinataires) | **VIDE** |
| **Insertion** | autorisée | **Bloquée** | autorisée | **Bloquée** |
| **Marqueur** | `@nom@` | `@nom@` (affiché rouge) | `@LOCAL_xxx@` | `@LOCAL_xxx@` (affiché rouge) |
| **Si on RETIRE la base** | reste, bascule sur fiche client (plus rouge) | repasse sans base → redevient exploitable (fiche client) | fige automatiquement la dernière valeur base comme échantillon, puis devient un **spécifique sans base** (vert, renommable, type modifiable, supprimable si non inséré) | repasse sans base → reprend son échantillon (plus rouge) |
| **Si on CHANGE de base** | se reconnecte à la nouvelle base | si la nouvelle base contient la colonne → devient présent (vert) | se reconnecte à la nouvelle base | si la nouvelle base contient le libellé → devient présent (vert) |

---

## 4. Règle de reconnexion (transition sans base → avec base)

Un champ figé sur un échantillon (cas du spécifique dont la base a été retirée) **n'est jamais figé définitivement**.

Lorsqu'on (re)charge une base contenant le **libellé** de ce champ, il se **reconnecte** automatiquement et reprend les **valeurs dynamiques** de la base (par destinataire). L'échantillon figé n'est qu'un **repli temporaire**, utilisé uniquement tant qu'aucune base correspondante n'est présente.

> C'est le point qui a causé les principaux bugs : un champ ne doit **jamais** rester collé sur une ancienne valeur figée (ex « Opel ») quand une base correspondante est rechargée.

---

## 5. Synthèse des sources de valeur

| Régime | Standard | Spécifique |
|---|---|---|
| SANS base | Fiche client | Échantillon (obligatoire) |
| AVEC base — présent | Base | Base |
| AVEC base — absent | **Vide (rouge)** | **Vide (rouge)** |

La **fiche client** ne sert **que** sans base. L'**échantillon** ne sert **que** sans base. **Avec base, seule la base alimente.**

---

## 6. Points à confronter au code existant

Cette grille étant la cible, voici les divergences probables à vérifier dans le code actuel (à confirmer lors de la confrontation) :

1. **Champs système (Séquentiel, Timbre)** : actuellement affichés dans la popup → **à retirer**.
2. **Champ absent de la base** : le code actuel le fait *disparaître* (standards purgés) ou *survivre sur l'échantillon/fiche client* → il doit désormais devenir **ROUGE + valeur vide + insertion bloquée**.
3. **Insertion d'un champ absent de la base** : doit être **bloquée**.
4. **Fiche client** : ne doit **jamais** alimenter un champ lorsqu'une base est présente.
5. **Spécifique présent en base** : doit être **non renommable** et **type figé** (à vérifier dans le code).
6. **Libellé d'un spécifique SANS base** : doit être **modifiable** (ancien « Problème 3 » — le code force `origine="import"` au chargement, ce qui fige le libellé à tort).
7. **Retrait de base d'un spécifique présent** : doit **figer la dernière valeur base comme échantillon** et rendre le champ autonome (renommable, type modifiable).
8. **Reconnexion dynamique** : un champ figé doit reprendre les valeurs base si une base correspondante est rechargée (par libellé pour les spécifiques, par nom technique pour les standards).
9. **Conversion PSMD** (production) : inchangée — les marqueurs sont convertis en noms techniques (`@Champ3@`, `@Civilite@`) à la génération du PSMD.

---

*Fin du cahier des charges.*
