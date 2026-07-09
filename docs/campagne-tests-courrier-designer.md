# Campagne de tests — Opérations Courrier & Courrier Interactif

**Objet :** tester de bout en bout la création d'opérations Courrier et Courrier Interactif
(tunnel + Designer + BAT), sur la plateforme Marketeam.
**Public :** collaborateurs Marketeam (découverte de l'offre courrier et du Designer).
**Consigne générale :** suivre les scénarios dans l'ordre, cocher `[x]` la colonne **OK** si le
résultat observé correspond au résultat attendu, sinon laisser `[ ]` et **décrire l'écart dans
Remarques** (avec capture d'écran si possible). Noter aussi toute lenteur, message d'erreur ou
comportement surprenant, même hors des points listés.

> **Environnement de test :** préciser en tête de vos retours le **navigateur + version**
> (Chrome / Edge / Firefox / Safari) et la date du test. En cas de doute sur un affichage,
> faire **Ctrl+F5** (vider le cache) avant de conclure à un bug.

---

## 0. Prérequis — préparer le jeu d'essai

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 0.1 | Préparer un fichier client (CSV/Excel) d'au moins **10 lignes** avec : Civilité, Nom, Prénom, Adresse 1, Adresse 2, Code postal, Ville, Téléphone, Portable, Email, **+ 4 colonnes spécifiques** : `Montant` (ex. 1234,50), `DateRdv` (ex. 15/09/2026), `CodeClient` (ex. ABC12345), `Vehicule` (ex. Clio V) | Fichier prêt, quelques lignes volontairement incomplètes (adresse manquante, téléphone vide) pour tester les filtres | [ ] | |
| 0.2 | Importer cette base dans la bibliothèque client, en **typant** les colonnes : `Montant` = Monétaire, `DateRdv` = Date, `CodeClient` = **Code barres**, `Vehicule` = Texte | L'import aboutit ; les 4 types sont proposés dans la liste (dont **« Code barres »**) | [ ] | |
| 0.3 | Vérifier le contenu importé | Dates stockées au format AAAAMMJJ ; téléphones normalisés ; les lignes sans adresse restent présentes dans la base client (elles seront filtrées à l'injection) | [ ] | |

---

## 1. Scénario principal — 2 documents + enveloppe à fenêtre (fil rouge)

**Configuration :** opération **Courrier** avec **enveloppe C6 à fenêtre**, contenant
**2 documents** : un **A4 recto** (lettre) et un **flyer A6 recto/verso**.
Champs prévus : lettre = `Civilité/Nom/Prénom` + `Montant` ; flyer = `DateRdv` + `CodeClient`
(code-barres) ; **champ commun** aux deux = `Nom` + `Ville`.

### 1.A — Tunnel jusqu'au contenu

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 1.A.1 | Créer l'opération Courrier, choisir l'enveloppe **C6 à fenêtre** | Passage à l'étape contenu sans erreur | [ ] | |
| 1.A.2 | Associer la base importée en 0.2 | Base visible, nombre de destinataires cohérent | [ ] | |
| 1.A.3 | Page « Contenu de votre enveloppe » : ajouter les 2 documents (A4 recto par upload PDF, flyer A6 R/V par upload PDF) | 2 lignes dans la liste ; vignettes de fond générées ; boutons **Personnaliser** et **Aperçu** visibles par ligne | [ ] | |

### 1.B — Designer du document 1 (lettre A4)

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 1.B.1 | Cliquer **Personnaliser** sur la lettre | Le Designer s'ouvre **déjà ajusté à la page** (pas de zoom 25 % minuscule) — vérifier sur Firefox/Safari en particulier | [ ] | |
| 1.B.2 | Observer la page | Le **pavé adresse destinataire** (zone système) est présent dans la fenêtre, **non déplaçable/supprimable** ; le **datamatrix d'affranchissement** est en haut à droite | [ ] | |
| 1.B.3 | Barre latérale | Sections ZOOM, APERÇU, RÉINITIALISER, **ACTIONS (Texte, Image, Code-barres, QR Code interactif)**, CHAMPS, HISTORIQUE, VALIDATION toutes présentes | [ ] | |
| 1.B.4 | Ajouter une zone **Texte** : « Bonjour @Civilite@ @Nom@ @Prenom@, votre solde est de @Montant@ » (champs insérés via la popup **Champs**) | Les champs s'insèrent en pastilles ; la popup liste les colonnes de la base | [ ] | |
| 1.B.5 | Cliquer **Aperçu** et naviguer entre les enregistrements | Les pastilles sont remplacées par les vraies valeurs ; `@Montant@` s'affiche formaté (ex. « 1 234,50 € ») ; navigation 1/2/3… fluide | [ ] | |
| 1.B.6 | Tester **Annuler/Rétablir** (HISTORIQUE) après un déplacement de zone | Le déplacement s'annule puis se rétablit exactement | [ ] | |
| 1.B.7 | **Valider** | Retour à la plateforme ; vignette BAT mise à jour avec les données du 1er enregistrement ; bouton **Supprimer la personnalisation** apparu sur la ligne | [ ] | |

### 1.C — Designer du document 2 (flyer A6 R/V) + datamatrix de rapprochement

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 1.C.1 | **Personnaliser** le flyer ; ajouter une zone texte avec `@DateRdv@` et `@Nom@ @Ville@` | Insertion normale ; le flyer a 2 pages (recto/verso) navigables | [ ] | |
| 1.C.2 | Observer pendant l'ajout du champ | Le **datamatrix de rapprochement apparaît automatiquement** sur la page 1 (l'opération compte alors 2 documents personnalisés) — petit carré 8×8 mm, à ~198 mm du bord gauche / 90 mm du haut, **non déplaçable** | [ ] | |
| 1.C.3 | **Valider** le flyer | Retour plateforme ; sur la ligne de la **lettre** (doc 1), le bouton **« Régénérer le BAT »** apparaît | [ ] | |
| 1.C.4 | Cliquer **« Régénérer le BAT »** sur la lettre | Le BAT de la lettre se régénère **avec le datamatrix de rapprochement** ; le bouton **disparaît** | [ ] | |
| 1.C.5 | Faire **Précédent** puis **Suivant** pour revenir sur la page | Le bouton « Régénérer le BAT » **ne réapparaît pas** | [ ] | |
| 1.C.6 | Rouvrir le Designer du flyer, modifier la mise en page (déplacer une zone), valider | Le bouton « Régénérer le BAT » **ne réapparaît pas** sur la lettre | [ ] | |
| 1.C.7 | Rouvrir le flyer, **supprimer tous les champs** de la base, valider | Le datamatrix de rapprochement **disparaît du flyer** dans le Designer ; au retour, le bouton « Régénérer le BAT » **apparaît sur la lettre** (datamatrix à retirer) | [ ] | |
| 1.C.8 | Sans régénérer, tenter **Suivant** | **Blocage** avec le message « Merci de régénérer le BAT du document 1 (bouton « Régénérer le BAT ») » | [ ] | |
| 1.C.9 | Régénérer le BAT de la lettre puis **Suivant** | Le BAT de la lettre n'a **plus** de datamatrix ; la navigation passe | [ ] | |
| 1.C.10 | Remettre les champs dans le flyer (revenir à l'état 1.C.3-1.C.4) pour la suite | État rétabli, BAT à jour partout, aucun bouton de régénération visible | [ ] | |

### 1.D — Personnalisation de l'enveloppe

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 1.D.1 | Personnaliser l'**enveloppe** | Le Designer s'ouvre sur l'enveloppe C6 ; la section **ACTIONS est absente** (création de zones interdite) ; le pavé adresse et l'adresse expéditeur sont visibles | [ ] | |
| 1.D.2 | Modifier l'adresse expéditeur, **Valider** | Retour plateforme, vignette enveloppe mise à jour | [ ] | |
| 1.D.3 | **Rouvrir le Designer de la lettre** (doc 1) | La section **ACTIONS est revenue** (Texte, Image, Code-barres, QR) et la popup **Champs fonctionne** — point de contrôle d'une régression corrigée le 08/07 | [ ] | |

### 1.E — Audit de remplissage (enveloppe à fenêtre)

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 1.E.1 | Lancer le **contrôle de remplissage de la base** (bouton d'audit) | Dialogue modal avec jauges par champ exploité ; les lignes incomplètes du 0.1 font baisser les taux | [ ] | |
| 1.E.2 | Après audit, modifier la personnalisation d'un document et valider | Le marqueur d'audit est invalidé (l'audit doit être refait avant validation finale) | [ ] | |

---

## 2. Codes-barres (sur le flyer ou un document dédié)

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 2.1 | Ajouter une zone **Code-barres**, type **Code 128**, source « Valeur fixe » = `ABC-12345` | Le code-barres se dessine ; texte lisible en dessous si « Afficher texte » coché | [ ] | |
| 2.2 | Passer la source sur **« Champ de fusion »** et ouvrir la combo Champ | **Seuls les champs de type « Code barres »** sont proposés (`CodeClient`) — ni Téléphone, ni Montant, ni Texte | [ ] | |
| 2.3 | Associer `CodeClient` | **Dès la création**, le code-barres se dessine avec la valeur du **1er enregistrement** (pas de placeholder gris) | [ ] | |
| 2.4 | Mettre le type sur **EAN-13** avec `CodeClient` (valeur alphanumérique) | Badge rouge de validation (« 12 chiffres requis ») **dès la création** — pas seulement en aperçu | [ ] | |
| 2.5 | Revenir en Code 128 ; saisir **Zone de tranquillité = 4** (section TYPE DE CODE) | Le code rétrécit dans son cadre avec une marge blanche proportionnelle ; à **0**, il touche à nouveau le cadre | [ ] | |
| 2.6 | Passer le type sur **DataMatrix**, forme carrée, zone de tranquillité 2 | Rendu carré avec marge ; le champ « Zone de tranquillité » **reste visible** | [ ] | |
| 2.7 | Passer le type sur **QR Code** | Le champ « Zone de tranquillité » **disparaît** (non applicable aux QR) | [ ] | |
| 2.8 | Valider puis vérifier le **BAT** | Les codes-barres du BAT correspondent visuellement à l'aperçu Designer (taille de marge comprise) | [ ] | |

---

## 3. QR Code intelligent & images dynamiques

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 3.1 | Ajouter un **QR intelligent type URL** (`https://www.marketeam.fr?client=@Nom@`) | QR dessiné **dès la création** avec le 1er enregistrement ; résumé sous la zone | [ ] | |
| 3.2 | QR intelligent type **Téléphone** associé au champ Téléphone | QR dessiné dès la création (plus de « 2D Code / Numéro requis ») ; en aperçu, QR différent par enregistrement | [ ] | |
| 3.3 | QR intelligent type **vCard** (Nom, Prénom, Tél, Email par champs) | QR dense dessiné ; aperçu OK | [ ] | |
| 3.4 | Ajouter une zone **Image**, source **champ dynamique** liée à une collection d'images | La 1ère image de la collection s'affiche en création ; en aperçu, l'image change selon l'enregistrement | [ ] | |
| 3.5 | Ajouter une zone Image **fixe** (upload JPG) | Upload, affichage, redimensionnement (modes ajuster/remplir) corrects | [ ] | |

---

## 4. Courrier Interactif (QR Code interactif)

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 4.1 | Sur le doc 1, cliquer **« QR Code interactif »** (section ACTIONS) | Une zone QR avec badge **« QR Code Interactif »** apparaît, centrée ; déplaçable/redimensionnable mais **non supprimable** ; le bouton d'ajout disparaît (1 seul QR interactif autorisé) | [ ] | |
| 4.2 | **Valider** le document | Le titre de l'opération devient **« Opération Courrier Interactif »** | [ ] | |
| 4.3 | Vérifier le **BAT** | Le QR est présent ; **scanner le QR du BAT** avec un téléphone → il ouvre l'**URL générique** Marketeam (paramètre `Url_Courrier_Interactif_Generique`), pas une recherche Google | [ ] | |
| 4.4 | Cliquer **Suivant** en fin de page contenu | L'étape suivante est le **choix Cliquez-Ici** (pgeIciChoix), spécifique aux opérations interactives | [ ] | |

---

## 5. Cycle de vie : sauvegarde, réouverture, suppression, duplication

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 5.1 | **Enregistrer** l'opération (sauvegarde tunnel), retourner à l'accueil | L'opération apparaît dans la liste avec le bon statut | [ ] | |
| 5.2 | **Rouvrir** l'opération en modification | Documents, personnalisations, enveloppe et BAT retrouvés à l'identique ; **aucun bouton « Régénérer le BAT » intempestif** (les marqueurs sont persistés) | [ ] | |
| 5.3 | **Supprimer la personnalisation** d'un document | Confirmation demandée ; retour au fond seul ; vignette BAT redevenue « à vide » ; datamatrix retiré si plus requis | [ ] | |
| 5.4 | **Remplacer le fond** (réimporter un PDF) sur un document personnalisé | Confirmation ; la personnalisation est **conservée**, le fond change, le BAT se régénère | [ ] | |
| 5.5 | **Dupliquer** l'opération depuis l'accueil | Copie complète (documents, personnalisations, enveloppe) fonctionnelle et indépendante | [ ] | |
| 5.6 | **Aperçu** (bouton de ligne) sur chaque document | L'aperçu affiche le BAT (images nettes, URL correcte — pas d'erreur de chargement d'image) | [ ] | |

---

## 6. Multi-navigateurs (rejouer les points sensibles sur chaque navigateur)

À tester sur **Chrome, Edge, Firefox, Safari** (préciser versions). Points sensibles connus :

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 6.1 | Ouverture du Designer | Document **ajusté** dès l'ouverture (pas de 25 %) — surveiller **Safari** | [ ] | |
| 6.2 | **Plein écran** → travailler → **Valider** | Retour plateforme **cliquable immédiatement** (sortie automatique du plein écran) — surveiller **Safari** | [ ] | |
| 6.3 | Sélecteur de **couleur** d'une zone texte | Le dialogue s'ouvre et la couleur s'applique sur tous les navigateurs | [ ] | |
| 6.4 | **Pipette** du sélecteur de couleur | Chrome à jour : OK. **Edge : bug Chromium connu (gel complet du navigateur) tant qu'Edge n'embarque pas Chromium ≥ 150.0.7871.100 — ne pas insister, noter la version.** Firefox : pas de pipette (normal). Safari : pipette (loupe) du panneau macOS | [ ] | |
| 6.5 | Drag/resize de zones, saisie texte accentué (é, à, ç), copier-coller | Comportement identique sur les 4 navigateurs ; les accents survivent à la validation (vérifier sur le BAT) | [ ] | |

---

## 7. Cas limites & robustesse (pour les testeurs curieux)

| # | Action | Résultat attendu | OK | Remarques |
|---|---|---|---|---|
| 7.1 | Créer un champ spécifique au libellé accentué + espaces (« Date de livraison ») et l'utiliser | Pastille correcte à l'écran ; valeur correcte en aperçu et sur le BAT | [ ] | |
| 7.2 | Deux champs aux libellés proches (« Véhicule » / « Vehicule ») | Les deux coexistent sans écrasement (suffixe automatique côté impression) | [ ] | |
| 7.3 | Zone texte avec **copyfitting** (texte long dans petite zone) | Le texte se réduit jusqu'à la taille minimum, pas de débordement sur le BAT | [ ] | |
| 7.4 | Champ **Date** dans une zone texte avec un format d'affichage | Affichage formaté à l'écran ET sur le BAT (concordance écran/print) | [ ] | |
| 7.5 | Redimensionner une zone très précisément (panneau Géométrie en mm), valider, rouvrir | Les valeurs mm sont **conservées à l'identique** (pas de dérive 39,7 → 39,4) | [ ] | |
| 7.6 | Ouvrir/valider le Designer ~10 fois de suite (document ↔ enveloppe en alternance) | Aucune dégradation : boutons ACTIONS toujours corrects, champs disponibles, pas de fuite d'état entre sessions | [ ] | |
| 7.7 | Laisser le Designer ouvert 10 min puis valider | La validation aboutit (session maintenue) | [ ] | |

---

## Synthèse du testeur

| Rubrique | Verdict global | Commentaire libre |
|---|---|---|
| Tunnel & pages plateforme | ☐ OK ☐ KO | |
| Designer — zones & champs | ☐ OK ☐ KO | |
| Codes-barres / QR | ☐ OK ☐ KO | |
| Datamatrix de rapprochement & BAT | ☐ OK ☐ KO | |
| Courrier Interactif | ☐ OK ☐ KO | |
| Multi-navigateurs | ☐ OK ☐ KO | |
| Impression générale / ergonomie | ☐ OK ☐ KO | |

**Navigateur + version :** ………………………… **Testeur :** ………………………… **Date :** …………………………
