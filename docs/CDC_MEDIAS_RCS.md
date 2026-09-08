# Cahier des charges — Gestion des médias RCS

> Module de gestion des images et vidéos destinées aux cartes RCS.
> Liste `pgeRcsMesMedias`, fiche `pgeRcsMedia`, sélecteur `pgiRcsMedia`.

**Version :** 1.2 — 26 août 2026
**Décisions arbitrées avec Michel, à ne pas remettre en cause sans validation.**

**Évolutions depuis la 1.0 :** la source n'est plus conservée ; toutes les
contraintes passent par `prm_parametre` ; nommage des pages aligné sur la
convention Marketeam.

---

## 1. Objectif et périmètre

Permettre au client de constituer une bibliothèque de médias RCS, puis de piocher
dedans lors de la composition d'une carte.

**Règle de doctrine Marketeam :**

- Dans la fiche média (`pgeRcsMedia`), le client **importe** ses fichiers depuis
  son poste. C'est le seul endroit du module où l'upload est autorisé.
- Dans la page de **composition** (`pgeRcs`), le client **ne peut pas importer**.
  Il choisit obligatoirement dans sa bibliothèque, via le sélecteur `pgiRcsMedia`.

**Hors périmètre :** la composition RCS elle-même, le tunnel, le devis.

---

## 2. Ce qui est réutilisé de l'existant

### 2.1 La table `ici_image`

Le module réutilise `ici_image` plutôt que de créer une table dédiée. Elle apporte
déjà les trois bibliothèques, les catégories, les dates de validité, `EstActif` et
`EstPartage`.

Le discriminant est la colonne `Type` (CHAR 3), avec deux nouvelles valeurs :

    __ICI_RCS_IMAGE__    image RCS
    __ICI_RCS_VIDEO__    vidéo RCS

Le cloisonnement est assuré par construction : toutes les requêtes existantes sur
`ici_image` filtrent déjà explicitement sur le type — la requête du sélecteur,
celle des catégories, et le filtre passé à `InitCboBibliothèque`. Les médias RCS
seront donc naturellement invisibles côté landing pages, sans modification du code
existant.

### 2.2 Les procédures partagées

Réutilisables telles quelles, il suffit de leur passer la bonne constante :

| Procédure | Rôle |
|---|---|
| `cpProjet.CheminClient` | Chemin de la bibliothèque personnelle |
| `cpProjet.CheminMarque` | Chemin de la bibliothèque marque |
| `cpProjet.CheminMarketeam` | Chemin de la bibliothèque Marketeam |
| `Partage.InitCboBibliothèque` | Alimentation de la combo bibliothèque |
| `Partage.FiltreBibliothèque` | Filtre SQL selon la bibliothèque choisie |
| `cpFonction.ValeurParametre` | Lecture des paramètres (§ 5) |
| `RedimentionneImage` | Redimensionnement — à vérifier : gère-t-elle le recadrage ? |

### 2.3 À créer

Un cas `__OPERATION_RCS__` dans `RepertoireTypeOperation`, renvoyant `"Rcs"`.

Les constantes de sous-répertoires : `__REP_IMAGE__` existe déjà ; il faut vérifier
l'existence de `__REP_VIDEO__`.

### 2.4 Convention de nommage des pages

Deux pages par univers : la liste au pluriel, la fiche au singulier.

| Univers | Liste | Fiche |
|---|---|---|
| Landing pages | `pgeIciMesMedias` | `pgeIciMedia` |
| RCS | `pgeRcsMesMedias` | `pgeRcsMedia` |

L'ancienne `pgeImage` portait un nom générique alors qu'elle ne gérait que les
médias des landing pages. Elle est renommée `pgeIciMedia`.

---

## 3. Arborescence et nommage

Construite par `CheminClient(IdClient, __OPERATION_RCS__, {sous-répertoire}, Vrai)`.
Le répertoire est créé automatiquement par `fRepCrée`.

```
…\ClientsDev\00000001\Rcs\
    Images\
        imgCard{IdImage}.{ext}       dérivé carte simple
        imgSldr{IdImage}.{ext}       dérivé carrousel
    Videos\
        vid{IdImage}.{ext}           la vidéo, servie telle quelle
        vgnCard{IdImage}.{ext}       vignette carte simple
        vgnSldr{IdImage}.{ext}       vignette carrousel
```

**La source n'est pas conservée.** Le fichier importé sert uniquement à générer les
dérivés, puis il est supprimé du répertoire d'upload.

> *Conséquence assumée :* modifier les dimensions cibles dans `prm_parametre`
> n'affectera que les imports suivants. Les médias déjà en bibliothèque conserveront
> leur ancien recadrage. Les ratios seront calés pendant la phase de développement,
> donc avant toute mise en production.

**Pas de dérivé vidéo.** On ne recadre pas une vidéo. Le fichier part tel quel vers
Infobip, c'est le téléphone qui l'ajuste. Seule la vignette a deux dérivés.

**Nommage sans zéros de tête**, conforme à la convention existante des noms de
fichiers (`InitZnrImage` construit `__DOC_ICI_IMAGE__ + IdImage` sans padding).
Le padding `08d` ne concerne que les noms de **répertoires**.

**Extension** : celle du fichier importé, telle que stockée dans
`ici_image.TypeFichier`.

⚠️ **L'IdImage n'existe qu'après insertion en base.** Suivre le motif déjà en place
dans `pgeIciMedia` : upload sous un nom temporaire aléatoire dans le répertoire
d'upload, puis génération, déplacement et renommage définitif après l'insertion.
Le fichier temporaire est supprimé en fin de traitement, comme le fait déjà
`pgeIciMedia` à la fermeture de la page.

### Les trois bibliothèques sont conservées

Personnelle (client), marque, Marketeam. Même logique que les médias landing.

---

## 4. Import d'une image

### Enchaînement

1. Le client renseigne : bibliothèque, catégorie, nom, dates de validité, partage
2. Il téléverse son fichier
3. Contrôles de conformité, tous pilotés par `prm_parametre` (§ 5)
4. Génération du dérivé **carte** → `imgCard{IdImage}`
5. Génération du dérivé **carrousel** → `imgSldr{IdImage}`
6. **Affichage des deux recadrages** pour validation visuelle
7. Enregistrement en base, déplacement des dérivés, suppression du fichier temporaire

### Le recadrage

**Centré automatique.** Un outil de repositionnement manuel serait mieux mais
constitue un développement à part — à envisager si les clients le réclament.

**Consigne à afficher dans l'écran :** le carrousel rogne les côtés. Tout élément
important — logo, prix, texte incrusté — doit rester au centre de l'image.

### Les PNG transparents

**Aplatissement automatique sur fond blanc** à la génération des dérivés. Le fond
de la bulle RCS n'est pas nécessairement blanc sur le téléphone du destinataire, et
le client n'a aucun moyen de le prévoir.

---

## 5. Paramétrage — `prm_parametre`

**Aucune valeur en dur dans le code.** Toutes les contraintes sont lues via
`cpFonction.ValeurParametre`, sur le modèle des paramètres existants
(`ImageUploadTailleMax`, `ImageUploadLargeurMin`…).

### 5.1 Images

| Paramètre | Type | Valeur indicative | Rôle |
|---|---|---|---|
| `Rcs_Image_FormatsAcceptes` | Chaîne | `jpg,jpeg,png` | Extensions autorisées à l'import |
| `Rcs_Image_TailleMaxKo` | Numérique | 5120 | Poids maximum du fichier importé |
| `Rcs_Image_LargeurMin` | Numérique | 1280 | Largeur minimale acceptée |
| `Rcs_Image_HauteurMin` | Numérique | 960 | Hauteur minimale acceptée |
| `Rcs_Image_LargeurMax` | Numérique | 6000 | Largeur maximale acceptée |
| `Rcs_Image_HauteurMax` | Numérique | 6000 | Hauteur maximale acceptée |
| `Rcs_Image_QualiteJpeg` | Numérique | 85 | Qualité de compression des dérivés |

### 5.2 Dimensions des dérivés

Ces quatre paramètres **portent le ratio** : inutile de le stocker séparément.

| Paramètre | Type | Valeur indicative | Rôle |
|---|---|---|---|
| `Rcs_Card_Largeur` | Numérique | 1440 | Largeur du dérivé carte simple |
| `Rcs_Card_Hauteur` | Numérique | 960 | Hauteur du dérivé carte simple |
| `Rcs_Sldr_Largeur` | Numérique | 1280 | Largeur du dérivé carrousel |
| `Rcs_Sldr_Hauteur` | Numérique | 960 | Hauteur du dérivé carrousel |
| `Rcs_Derive_TailleMaxKo` | Numérique | 1024 | Poids cible des dérivés après compression |

### 5.3 Vidéos

| Paramètre | Type | Valeur indicative | Rôle |
|---|---|---|---|
| `Rcs_Video` | Numérique | 0 | Active la vidéo dans l'interface. 0 = masquée |
| `Rcs_Video_FormatsAcceptes` | Chaîne | `mp4,webm,m4v,3gp` | Extensions autorisées |
| `Rcs_Video_TailleMaxKo` | Numérique | 20480 | Poids maximum |
| `Rcs_Video_DureeMaxSec` | Numérique | 60 | Durée maximale |
| `Rcs_Video_VignettePosition` | Numérique | 20 | Position de l'extraction, en pourcentage de la durée |

Les vignettes vidéo utilisent les mêmes dimensions cibles que les images (§ 5.2).

### 5.4 Interface

| Paramètre | Type | Valeur indicative | Rôle |
|---|---|---|---|
| `Rcs_BoutonCommun` | Numérique | 0 | Affiche les boutons communs dans `pgeRcs` |

### 5.5 Affichage des contraintes

Les libellés d'aide affichés à l'écran — formats acceptés, résolution minimale,
poids maximum — doivent être **construits depuis les paramètres**, jamais écrits en
dur. Modifier un plafond ne doit pas obliger à retoucher la page.

---

## 6. Contraintes — origine et statut

### 6.1 Ce que dit réellement l'API

La spécification Infobip n'impose que le format de fichier et une taille maximale
de 100 Mo. **Elle n'impose aucun ratio.** Les valeurs indicatives du § 5.2 viennent
de la documentation d'usage : elles minimisent le recadrage à l'affichage, sans
plus. L'API acceptera n'importe quel ratio.

C'est précisément pour cela qu'elles sont paramétrables : elles seront ajustées
après essais sur téléphone réel, pendant la phase de développement.

### 6.2 Formats exposés

**Images :** JPEG et PNG uniquement. L'API en accepte davantage, mais le GIF animé
rend mal selon les messageries et l'offre reste volontairement limitée.

**Vidéos :** les formats de `Rcs_Video_FormatsAcceptes`, dans les limites de ce que
l'API accepte — `mp4`, `mpeg`, `mpeg4`, `m4v`, `webm`, `h263`.

### 6.3 Poids réel et bande passante

L'API autorise 100 Mo, mais la limite utile est bien plus basse : c'est Marketeam
qui supporte la bande passante, et un téléchargement lent fait perdre des
destinataires avant l'affichage.

### 6.4 Support opérateur

⚠️ La spécification Infobip précise que **le support de certains types de contenu
varie selon l'opérateur mobile**. Tout format doit être testé sur les quatre
opérateurs français avant ouverture aux clients.

---

## 7. Import d'une vidéo

### Statut : structuré, mais fermé au démarrage

Comme les boutons communs, la vidéo est **développée maintenant mais masquée**
derrière le paramètre `Rcs_Video` à 0.

Ouverture seulement après tests concluants sur les quatre opérateurs français.

**Jamais en carrousel.** Une vidéo par carte sur dix cartes n'a aucun sens, et le
poids serait déraisonnable. Carte simple uniquement.

### Enchaînement

1. Le client renseigne les mêmes métadonnées que pour une image
2. Il téléverse sa vidéo
3. Contrôles de format, de poids et de durée depuis `prm_parametre`
4. Sauvegarde dans `Videos\vid{IdImage}.{ext}`
5. **Extraction automatique de la vignette par FFmpeg**, à la position définie par
   `Rcs_Video_VignettePosition`
6. Recadrage automatique de la vignette aux deux dimensions cibles
7. Affichage de la vignette obtenue
8. **Le client peut la remplacer** par une image de son choix, qui passe alors par
   la même chaîne de recadrage
9. Enregistrement

### FFmpeg

FFmpeg est **installé sur le serveur**. Appel en ligne de commande depuis WLangage.

Principe : lire la durée avec `ffprobe`, appliquer le pourcentage du paramètre,
extraire l'image à cet instant. Ordre de grandeur de la commande, **syntaxe exacte
à vérifier par Cursor** :

```
ffprobe -v error -show_entries format=duration -of csv=p=0 {video}
ffmpeg -ss {instant} -i {video} -frames:v 1 -q:v 2 {sortie}.jpg
```

**Pourquoi une position en pourcentage et non la première image :** beaucoup de
vidéos démarrent sur un fondu au noir. Une image prise trop tôt donne une vignette
noire.

⚠️ **Le recadrage d'une vignette vidéo est sévère.** Une vidéo est généralement en
16:9 ; passer en 4:3 fait perdre un quart de la largeur. C'est précisément pour ça
que le remplacement manuel doit rester possible.

---

## 8. Les écrans

Accessible depuis le menu, sous une nouvelle brique **RCS** placée sous la brique
SMS, avec deux entrées :

    Mes modèles de RCS
    Mes médias (images et vidéos)

### 8.1 `pgeRcsMesMedias` — la liste

Point d'entrée du module. Affiche les médias RCS du client avec les mêmes filtres
que le sélecteur : bibliothèque, catégorie, recherche par nom.

Modelée sur `pgeIciMesMedias`, en filtrant sur les deux nouveaux types.
Depuis chaque ligne : ouvrir la fiche, dupliquer, désactiver.

### 8.2 `pgeRcsMedia` — la fiche

Import et modification d'un média. Modelée sur `pgeIciMedia` (ex-`pgeImage`),
mais simplifiée :

**Ce qu'on garde** — bibliothèque, catégorie, nom, dates de validité, actif,
partagé, upload.

**Ce qu'on retire** — les types YouTube et grattage, qui n'existent pas en RCS.
Et **l'aperçu du fichier importé**, puisqu'il n'est pas conservé.

**Ce qu'on ajoute** — l'aperçu des deux recadrages générés, la consigne de zone de
sécurité, et pour la vidéo le bloc vignette avec remplacement manuel.

---

## 9. Le sélecteur `pgiRcsMedia`

Page interne dédiée, **à créer, pas à réutiliser depuis `pgiImage`**.

### Pourquoi une page dédiée

**Le filtre d'exclusion de `pgiImage` est faux pour le RCS.** `InitZnrImage` retire
les images déjà utilisées — logique pour une landing page où chaque image
n'apparaît qu'une fois, faux en RCS où la même image peut servir sur plusieurs
cartes.

**Le bloc de style n'a pas de sens.** `popBlocStyle` gère alignement, marges et
couleur de fond. Le RCS n'a rien de tout ça : l'image remplit la zone média.

**Le type est figé en dur** à trois endroits dans `pgiImage`.

**Le motif `selon PageCourante()`.** Une page interne WebDev ne sait pas appeler
son hôte de façon générique. Réutiliser `pgiImage` obligerait à ajouter `PGERCS`
dans chacun de ces `selon`, en touchant du code en production sur trois pages de
landing.

### Contrat de sortie

Identique à `SelectionImage` de `pgiImage` — c'est exactement ce dont `pgeRcs` a
besoin :

| Variable | Contenu |
|---|---|
| `_sImageCheminRelatif` | Chemin web — alimente `MediaUrl` |
| `_sImageCheminPhysique` | Chemin disque |
| `_stValeurImage.IdImage` | Identifiant en base |
| `_stValeurImage.Libelle` | Nom du média |

**Quel dérivé renvoyer ?** Le sélecteur doit connaître le type de message en cours
— `CARD` ou `CAROUSEL` — pour pointer sur `imgCard` ou `imgSldr`.

Si le client bascule de carte simple à carrousel après avoir choisi ses images, les
chemins doivent être **recalculés** : même `IdImage`, autre dérivé. À traiter dans
`pgeRcs`, pas dans le sélecteur.

### Filtres

Bibliothèque, catégorie, recherche par nom — comme `pgiImage`.

Et un filtre sur le type : images seules, ou images et vidéos selon le paramètre
`Rcs_Video` et le format de message en cours.

---

## 10. Ce qui reste ouvert

| Point | À trancher par |
|---|---|
| Valeurs définitives des paramètres du § 5 | Michel, après essais |
| Existence de `__REP_VIDEO__` | Cursor, à vérifier |
| `RedimentionneImage` gère-t-elle le recadrage, ou seulement la mise à l'échelle ? | Cursor, à vérifier |
| Validation des ratios sur téléphone réel | Recette |

---

## 11. Récapitulatif des décisions

1. Réutilisation de `ici_image` avec deux nouvelles valeurs de `Type`
2. Trois bibliothèques conservées : personnelle, marque, Marketeam
3. Arborescence `Rcs\Images\` et `Rcs\Videos\`
4. **La source n'est pas conservée** — elle ne servait qu'à la phase de mise au point
5. Deux dérivés image : carte et carrousel, dimensions paramétrables
6. Recadrage centré automatique, pas d'outil de repositionnement
7. PNG transparents aplatis automatiquement sur fond blanc
8. Pas de dérivé vidéo, la vidéo part telle quelle
9. Vignette vidéo extraite par FFmpeg, position paramétrable, recadrée en deux versions
10. Remplacement manuel de la vignette possible
11. Vidéo développée mais masquée derrière `Rcs_Video`, jamais en carrousel
12. Pas de carte horizontale, donc pas de média portrait
13. Sélecteur `pgiRcsMedia` dédié, pas de réutilisation de `pgiImage`
14. Nommage aligné : `pgeRcsMesMedias` pour la liste, `pgeRcsMedia` pour la fiche.
    `pgeImage` renommée en `pgeIciMedia`
15. **Aucune contrainte en dur** — tout passe par `prm_parametre`
