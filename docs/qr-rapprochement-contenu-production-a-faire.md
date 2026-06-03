# QR Codes de rapprochement — Contenu à coder en production (à faire)

> **Note de rappel.** Ce document acte une correction d'analyse et décrit un
> chantier **futur** à mener dans l'outil de production (back office). Il ne
> remet **pas** en cause le travail déjà réalisé dans le tunnel et le Designer.

---

## 1. Correction d'analyse (le point clé)

Hypothèse initiale (abandonnée) : le QR de rapprochement serait un **champ
système par destinataire**, fourni comme une **colonne** du fichier de
production, au même titre que `Timbre` et `Séquentiel`.

**C'est faux.** Après relecture de la documentation de la machine de mise sous
pli : le contenu du QR de rapprochement **n'est pas constant par destinataire**.
Il **varie par DOCUMENT et par PAGE**.

Donc une seule valeur `Rapprochement` par ligne de base **ne suffit pas** : il
faut une valeur **par page de chaque document**, et cette valeur dépend en plus
du **contexte de production** (documents annexes réellement présents dans les
alimenteurs de la machine).

---

## 2. Nature réelle du contenu du QR

Le contenu encode (au minimum) :

- un **numéro de page** sur le pli (ex. `001`, `002`, `003`…) ;
- un **indicateur de position** de la page dans le pli :
  - `1` = **première** page,
  - `0` = page **intermédiaire**,
  - `2` = **dernière** page.

**Exemple** (un pli de 3 pages) :

| Page | Contenu QR | Signification |
|------|------------|---------------|
| Page 1 | `001` + `1` | 1ʳᵉ page |
| Page 2 | `002` + `0` | page intermédiaire |
| Page 3 | `003` + `2` | dernière page |

⚠️ Le codage réel est **plus complexe** : il fait appel aux **documents annexes**
en fonction de leur **présence effective dans les alimenteurs** de la machine de
mise sous pli. Le contenu exact dépend donc de la configuration de production au
moment de l'impression, pas seulement du document.

> Les valeurs ci-dessus (numéro de page + indicateur 1/0/2) sont un **exemple
> illustratif** issu d'une première lecture de la doc machine. La spécification
> exacte du codage (longueur, champs, gestion des annexes, symbologie) reste à
> formaliser à partir de la documentation complète de la machine.

---

## 3. Ce qu'il faudra faire : interface de codage en back office

> **À FAIRE (chantier futur, hors tunnel / hors Designer).**

Créer, dans l'**outil de production (back office)**, une **interface dédiée**
permettant de **coder en dur le contenu de chaque QR de rapprochement avant
l'impression**.

Cette interface devra :

- déterminer, pour **chaque document** d'un pli et **chaque page**, le contenu
  exact du QR (n° de page + indicateur de position + éléments liés aux annexes) ;
- tenir compte des **documents annexes effectivement présents** dans les
  alimenteurs de la machine de mise sous pli ;
- produire le contenu **figé** (codé en dur) injecté dans les QR **avant**
  l'impression / la génération du flux final.

Le contenu du QR est donc **calculé en production**, pas dans le tunnel ni dans
le Designer.

---

## 4. Ce qui N'EST PAS remis en cause (déjà fait et valide)

Tout le travail réalisé sur le QR de rapprochement reste **valide** — il portait
sur la **présence, l'emplacement et l'affichage** du QR, ce qui était le bon
périmètre :

- détection « document personnalisé » (Phases 1-2) ;
- **règle métier N ≥ 2** : QR requis si ≥ 2 documents personnalisés ;
- **zone QR système** `sys-qr-rapprochement` (fixe, bord droit, champ
  `Rapprochement`) — Phases 3a/3b ;
- **déclencheurs** d'injection/retrait (bouton « Régénérer le BAT », ajout
  dynamique en direct, ouverture du Designer) ;
- **source de géométrie unifiée** (constructeur serveur unique, template
  transmis au Designer) ;
- **blocage de la validation** sur `EstConformeQr` (Phase 6) ;
- **valeur d'aperçu** du BAT (ex. `RAPP000001`) — factice, pour le rendu visuel
  uniquement.

➡️ **Seul le CONTENU réel du QR change de nature** : il sera **codé en
production** (interface back office, point 3 ci-dessus), et non fourni comme une
colonne `Rapprochement` simple par destinataire.

---

## 5. Points à reprendre le moment venu

- [ ] Formaliser la **spécification exacte** du codage QR à partir de la
      documentation complète de la machine de mise sous pli (champs, longueurs,
      gestion des annexes, symbologie attendue).
- [ ] Concevoir l'**interface de codage** en back office (par document, par
      page, prise en compte des alimenteurs/annexes).
- [ ] Définir **où et quand** le contenu est figé dans le flux de production
      (avant impression / génération finale).
- [ ] Vérifier la **cohérence** entre le QR de rapprochement (présence gérée en
      amont) et le contenu codé en production (un document marqué « doit porter
      un QR » doit recevoir un contenu valide).
- [ ] Statuer sur la **valeur d'aperçu** du BAT : conserver `RAPP000001` comme
      simple démonstration, ou la faire ressembler au futur format réel
      (n° page + indicateur) pour un aperçu plus représentatif.

---

*Document de rappel — à relire au moment d'attaquer le chantier « contenu des QR
de rapprochement en production ».*
