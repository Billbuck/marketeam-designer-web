# Cahier des charges — QR Code interactif : URL de test vs production (Marketeam)

**Statut : V2 validée le 16/07/2026** — remplace l'approche 1 (V1 du document).
**Décisions donneur d'ordre (16/07/2026) :**
- le QR de test identifie **l'opération** (pas un destinataire, pas une `tmp_structure`) ;
- la landing de test est **générée au moment du scan** depuis la dernière version **enregistrée** ;
- **pas d'enregistrement automatique** à la validation Designer : un BAT fabriqué avant le
  premier enregistrement scanne « en cours de création » et doit être régénéré ensuite.

---

## 1. L'objectif, en une phrase

L'utilisateur de la plateforme scanne le QR de son BAT courrier interactif et voit
**la landing page telle qu'il l'a enregistrée**, personnalisée avec la même personne
que celle affichée sur le BAT — sans jamais polluer le tracking de production.

---

## 2. Le principe retenu (V2)

Une landing page n'est jamais stockée toute prête : elle est **cuisinée à chaque visite**
à partir de la recette enregistrée en base (`ope_cliquezici` + `ope_cliquezici_bloc`,
réécrites à chaque enregistrement de l'opération). Le mode test s'appuie directement
dessus :

- Le QR du BAT contient une URL de test qui identifie **l'opération**.
- Au scan, le serveur (`MaPage` du projet Landing Page) cuisine la page depuis la
  **dernière version enregistrée** de l'opération.
- Si l'opération n'a jamais été enregistrée : page générique **« Landing en cours de création »**.

Conséquences :
- jamais de page périmée ou fantôme : le scan montre soit « en construction »,
  soit un état réellement enregistré ;
- un abandon de modification ne laisse aucune trace (rien à nettoyer) ;
- `tmp_structure` n'est **pas** utilisée par ce mécanisme — elle reste dédiée aux
  aperçus iframe et SMS, sans aucune modification.

*(L'idée V1 — page de test figée dans `tmp_structure` à l'enregistrement — est abandonnée :
elle pouvait servir une version périmée, et sa purge cassait le QR. L'idée intermédiaire
d'un booléen « version officielle » dans `tmp_structure` est abandonnée aussi : la version
officielle existe déjà, c'est `ope_cliquezici`.)*

---

## 3. Les trois formes d'URL

| Forme | Signification | Comportement serveur |
|---|---|---|
| `cliquez.info/@<code>` | tests actuels (aperçu iframe, SMS) | inchangé : lecture `tmp_structure` |
| `cliquez.info/!<code-opération>` | **scan d'un BAT courrier** (nouveau) | mode test par opération (cf. §4) |
| `cliquez.info/<code>` | production (un code par destinataire) | inchangé : page réelle + tracking |

- Le marqueur `!` est un caractère qui voyage bien dans une URL. Le `#` a été écarté :
  tout ce qui suit un `#` n'est **jamais transmis au serveur** (le navigateur le garde pour lui).
- Le `!` est imprimé dans le QR du BAT : même scanné des mois plus tard, un BAT reste
  un test. Aucun risque de fausser les statistiques de production.
- `<code-opération>` ne doit **pas** être l'IdOperation en clair (les numéros se suivent,
  un curieux pourrait tous les essayer et voir les pages des autres clients). Utiliser un
  code non devinable : `base62(IdOperation)` + courte signature (mécanique HMAC existante),
  ou code aléatoire stocké sur l'opération. Choix d'implémentation à trancher au codage.

---

## 4. Le mode test par opération (nouvelle branche de `MaPage`)

Au scan de `!<code-opération>` :

1. **Opération introuvable** (code inconnu, opération jamais enregistrée, marqueur
   « pas encore de numéro ») → page générique **« Landing en cours de création »**.
2. **Opération trouvée** → génération de la page depuis `ope_cliquezici` /
   `ope_cliquezici_bloc` (dernier enregistrement), avec les règles TEST :
   - **pas de tracking** (`TrackingComptabilise` / `TrackingEnregistre` non appelés) ;
   - **pas de vrais leads** : le formulaire se comporte comme dans les aperçus actuels ;
   - **pas de contrôle des 30 jours** (`DateHeurePriseEnCharge`) — en test, l'opération
     n'est pas encore partie en production.

**Personnalisation — même règle que le BAT :**

| L'opération a… | Le BAT affiche | La landing de test affiche |
|---|---|---|
| une base injectée | la 1re personne de la base (`dos_base_ligne`) | la même 1re personne |
| pas de base | les infos de l'utilisateur de la plateforme | les mêmes infos (contact de l'opération) |

---

## 5. Cycle de vie du contenu du QR (zone `sys-qr-cliquezici`)

- Le contenu de la zone QR est posé à la composition du wrapper Designer et fait partie
  du `JsonDesignerData` ; le BAT est une image : ses pixels encodent le QR tel qu'il
  était au moment de la génération.
- **Avant le premier enregistrement** (`IdOperation` inexistant) : la zone contient le
  marqueur « pas encore de numéro » (ex. `!0`). Le scan affiche « en cours de création »
  — c'est la vérité.
- **Au premier enregistrement** : le contenu de la zone est réécrit avec la vraie URL
  `!<code-opération>` (point d'accroche existant : `AjoutModificationOperationCourrier`
  réécrit déjà le JSON et régénère le PSMD).
- **Décision donneur d'ordre : pas d'enregistrement automatique** à la validation
  Designer. Un BAT fabriqué avant le premier enregistrement garde donc son QR
  « en construction » ; il faut **régénérer le BAT** (réouverture Designer ou bouton
  Régénérer) après enregistrement pour obtenir le QR définitif. Ce cas ne concerne que
  la toute première session de création.
- Une fois l'opération enregistrée une fois, l'URL est stable pour toujours : toutes
  les régénérations de BAT sortent avec le bon QR, sans autre mécanique.

---

## 6. Ce qui ne change pas

- **Production** : le QR encodera `cliquez.info/<code>` avec `@Code@` résolu par
  destinataire à la fusion — traité au module d'export (Volet A). Rappel : le champ
  `Code` du destinataire doit être présent à la fusion PSMD de production.
- **`tmp_structure`** : structure, usage (aperçus iframe/SMS via `@`) et purge inchangés.
  Le point de vigilance V1 sur sa purge disparaît : le QR de test ne dépend plus d'elle.
- **`GenereTmpStructure`** : inchangée.

---

## 7. Implémenté le 16/07/2026 — architecture finale à trois points

**LE point d'autorité du contenu du QR est la génération du PSMD**
(`GenererPsmdServeurDocument`) : à chaque génération (BAT comme production), le bloc
d'injection impose l'URL de test `!<CodeTest>` dans toutes les zones `zonesQR` de la
copie temporaire. C'était l'ancien bloc « URL générique » (marketeam.com) qui écrasait
le QR à chaque BAT — cause du premier échec de recette. Au module d'export production,
ce même bloc devra poser `@Code@` par destinataire.

Les deux autres points, par confort/cohérence :
1. **Composition Designer** (`RemplirDesignerZoneSystemeQrInteractif` +
   `UrlTestQrInteractif`) : la zone naît avec la bonne URL (ou `!0`).
2. **Premier enregistrement** (`AjoutModificationOperationCourrier` +
   `ReecritUrlQrInteractifJson`) : le JSON stocké est mis à la vraie URL
   (toutes les zones `zonesQR` — les QR « lien personnel » sont des
   `zonesCodeBarres`, jamais touchés).

Autres éléments livrés :
- `dos_operation.CodeTest` : code aléatoire 10 caractères, unique, généré par
  `AjoutModificationOperation` (script `ALTER TABLE dos_operation - CodeTest.txt`) ;
- branche `!` dans `MaPage` + page « Landing en cours de création » intégrée ;
- leads : déjà neutralisés (l'écriture exige un `_nIdBaseLigne` réel, absent en test) ;
  tracking et contrôle 30 jours : la branche `!` ne les exécute pas ;
- personnalisation sans base : `ChargeBaseLigneContact` (contact de l'opération) ;
  avec base : première ligne (`ChargeUneBaseLigne(…, Vrai)`), la même personne que le BAT.

Reste au backlog :
- affichage du QR dans le canvas du Designer (montre un QR de démonstration à
  l'écran ; le BAT, lui, est juste) — correctif Designer JS, cosmétique ;
- test téléphone de bout en bout après déploiement de la landing ;
- dépréciation du paramètre `Url_Courrier_Interactif_Generique` (ne sert plus
  que de repli théorique).

---

## 8. Hors périmètre

- Module d'export de production (Volet A) — y compris la résolution `@Code@`.
- Modification des pages de test/production existantes au-delà de la branche `!`.
- QR de rapprochement (`sys-qr-rapprochement`) — mécanisme distinct.
