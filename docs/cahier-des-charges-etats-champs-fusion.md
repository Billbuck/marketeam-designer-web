# Cahier des charges — États et comportements des champs de fusion
## Marketeam Designer

**Statut :** Référence unique validée — conformité du code attestée par tests.
**Périmètre :** Comportement de chaque type de champ dans la popup « Champs de fusion », dans les zones du document, en aperçu, et en production (BAT, PSMD).

Ce document est la **source de vérité** pour la déclaration et l'exploitation des champs de fusion. Toute évolution du code doit être confrontée à cette grille. Il remplace les décisions implicites éparpillées dans le code.

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
   **Tout champ absent de la base** (standard ou spécifique) est **ROUGE**, sa **valeur en aperçu et en production est VIDE**, et son **insertion est bloquée**.
   *Objectif : ne jamais imprimer une mauvaise donnée (notamment l'adresse de l'expéditeur à la place du destinataire) ; n'exploiter que les champs réellement présents dans la base.*

4. **Sources de valeur selon le régime :**
   - **SANS base :** Standard → **fiche client** · Spécifique → **échantillon** (obligatoire)
   - **AVEC base :** champ présent → **base** · champ absent → **vide (rouge)**

5. **La base prime toujours.** Un champ qui correspond à une colonne de la base prend les valeurs de la base, jamais l'échantillon ni la fiche client.

6. **Échantillon obligatoire** pour tout champ spécifique (valeur de repli sans base).

7. **Champs système** (Séquentiel, Timbre) : **retirés de la popup** « Champs de fusion » et de toute combo utilisateur. Ils existent uniquement en coulisses pour la production (PSMD, tri postal, affranchissement). Ils ne sont **jamais vidés** par les règles de gestion des absents.

8. **Marqueur dans le contenu :**
   - Standard → `@nom@` (nom technique, ex `@Civilite@`)
   - Spécifique → `@LOCAL_<identifiant>@` (identifiant stable)

   Le marqueur d'un spécifique est **stable** : il reste `@LOCAL_<id>@` quel que soit le régime, et n'est **jamais réécrit** dans le contenu du document. La conversion vers un nom technique (`@Champ3@`) intervient uniquement à la génération PSMD côté production, jamais dans le contenu stocké.

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

---

## 5. Synthèse des sources de valeur

| Régime | Standard | Spécifique |
|---|---|---|
| SANS base | Fiche client | Échantillon (obligatoire) |
| AVEC base — présent | Base | Base |
| AVEC base — absent | **Vide (rouge)** | **Vide (rouge)** |

La **fiche client** ne sert **que** sans base.
L'**échantillon** ne sert **que** sans base.
**Avec base, seule la base alimente.**

Cette règle vaut **dans tous les chemins** : aperçu Designer, BAT, PSMD de production. Aucun chemin ne doit injecter de valeur de la fiche client ou d'échantillon résiduel pour un champ absent en régime avec base.

---

## 6. Présentation dans la popup « Champs de fusion »

### Tri

La liste de la popup est triée en **3 groupes**, dans cet ordre :

1. **Champs exploités** (verts) — insérés dans le document, avec valeur résolvable.
2. **Champs en erreur** (rouges) — absents de la base courante, à signaler à l'utilisateur.
3. **Champs non exploités** (gris) — déclarés mais pas insérés.

À l'intérieur de chaque groupe : l'ordre du postMessage (= l'ordre canonique d'envoi des champs par le métier). Pas de tri alphabétique, pas de distinction standard/spécifique dans le tri — c'est uniquement l'**état** du champ qui détermine sa position.

### Comportement du bouton « Champs »

L'état du bouton « Champs » de la sidebar reflète **toujours** l'état réel de la popup :
- Popup ouverte → bouton actif.
- Popup fermée → bouton inactif, **quel que soit le chemin de fermeture** (clic sur le bouton, croix, clic en dehors, ouverture du Designer).

Un seul clic sur « Champs » doit toujours suffire à rouvrir la popup quand elle est fermée.

---

## 7. État de conformité

Tous les points fondamentaux de ce cahier sont **conformes** dans le code, validés par tests fonctionnels complets (régimes sans base et avec base, cycles base, transitions, aperçu, BAT, PSMD).

| Règle | Conformité |
|---|---|
| Champs système retirés de la popup et des combos utilisateur | ✅ |
| Champ absent en régime avec base → rouge, vide, insertion bloquée | ✅ |
| Insertion d'un champ absent bloquée (popup, drag & drop, combos) | ✅ |
| Fiche client jamais utilisée comme source en régime avec base — **valable pour l'aperçu, le BAT et le PSMD** | ✅ |
| Spécifique présent en base : libellé et type figés | ✅ |
| Libellé et type d'un spécifique modifiables sans base | ✅ |
| Retrait de base d'un spécifique présent → fige l'échantillon, devient autonome | ✅ |
| Reconnexion dynamique au rechargement d'une base correspondante | ✅ |
| Production PSMD : conversion `@LOCAL_xxx@` → nom technique inchangée | ✅ |
| Catégorie standard / spécifique correctement attribuée à chaque champ | ✅ |
| Marqueur `@LOCAL_xxx@` stable, jamais réécrit dans le contenu | ✅ |
| Tri popup en 3 groupes (exploités / erreurs / non exploités) | ✅ |
| Bouton « Champs » synchronisé avec l'état réel de la popup | ✅ |

### Notes pour l'évolution

- L'identification d'un champ comme **standard** repose sur sa présence dans la liste officielle des champs standards du métier. L'ajout futur d'un nouveau standard à cette liste est automatiquement pris en compte sans modification du Designer.
- Les **champs système** (Séquentiel, Timbre) gardent leur traitement à part dans tous les mécanismes : ils ne sont jamais affichés à l'utilisateur, jamais vidés par les règles d'absence, et restent gérés par les automatismes de production.

---

*Fin du cahier des charges.*
