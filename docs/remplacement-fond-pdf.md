# Remplacement du PDF de fond avec conservation de la personnalisation

**Statut : implémenté et testé OK le 10/06/2026.**
Périmètre : tunnel courrier, page `pgeLtrContenu`, documents source « Fichier » (PDF client). Aucune modification du Designer (`script.js`, `index.html`, `psmd-generator.js`) ni du pipeline de sauvegarde (`AjoutModificationOperationCourrier` / `ModificationCheminDesignerJson`).

## 1. Besoin

Permettre au responsable de production de remplacer le PDF de fond de page d'un document **déjà personnalisé** via le Designer (ex. un A4 recto remplacé par un nouvel A4 recto, même format, même orientation, même fond perdu) **sans perdre le JSON de personnalisation** (`JsonDesignerData` : zones, champs de fusion, contraintes).

Avant : tout ré-import passait par `NettoyerFichiersDocumentTemp`, qui vide `JsonDesignerData` (ligne « Reset des références fichiers ») — le remplacement détruisait donc la personnalisation, et le bouton « Importer » était masqué au stade personnalisé pour cette raison.

Fondement technique : les coordonnées des zones (`xMm`, `yMm`, `largeurMm`, `hauteurMm`) sont absolues en mm par rapport au **format fini** (TrimBox), sans aucun calage sur le fichier PDF lui-même. Seuls `pages[].cheminFond` / `pages[].urlFond` (chemins figés dans le JSON) et `formatDocument.fondPerdu` dépendent du fichier : le remplacement est sûr dès lors que format, orientation, nombre de pages et fond perdu sont identiques.

## 2. Principe

- Le bouton **« Importer »** (`btnDocumentImporter`, zone répétée `znrLtrContenu`) est désormais visible **aussi quand `EstPersonnaliseDesigner = Vrai`** — uniquement pour la source `"F"` (Fichier). Les sources `"M"` (Modèle) et `"C"` (Document client) restent masquées, comportement inchangé.
- Au clic, si le document est personnalisé, une **confirmation** est demandée (`PageAfficheDialogue(pgeOuiNon, ...)`) :
  « Le fond de page sera remplacé. La personnalisation sera conservée. Continuer ? »
- Le flux serveur `UploadFichier()` (pgeLtrContenu) détecte lui-même le mode remplacement (`bRemplacementFond = EstPersonnaliseDesigner _et_ JsonDesignerData <> ""`) et devient **non destructif** : tout PDF non conforme est rejeté **sans rien modifier** au document courant.
- Quand `EstPersonnaliseDesigner = Faux` : comportement historique strictement inchangé.

## 3. Flux détaillé (`UploadFichier`, mode `bRemplacementFond`)

1. **Sauvegarde** de `JsonDesignerData` et `DateHeureDesigner` avant tout nettoyage (pattern `sJsonDataModele` de `SelectionModèle`).
2. **Analyse du nouveau PDF sur une structure temporaire** — procédure interne `ControleConformiteRemplacement()` : copie `stDocTest` de la structure document (hérite `NombrePage`, `LargeurOuvert`/`HauteurOuvert`, `EstFondPerdu` → active les rejets existants), pointée sur le fichier uploadé. `PdfAnalyseDocument` vide `tabPagePDF` en entrée et supprime le fichier analysé en cas de rejet : le document courant et ses fichiers ne sont jamais touchés à ce stade.
3. **Contrôles de conformité** (échec → message clair + abandon, document intact) :
   - rejets historiques de `cpDesigner.PdfAnalyseDocument` : PDF valide, mot de passe, droit d'impression, nombre de pages attendu, format attendu, fond perdu attendu/symétrique, format standard, encrage en bordure ;
   - **fond perdu strict** : `tabPagePDF[1].FondPerdu*Mm` du nouveau PDF vs `formatDocument.fondPerdu` figé dans le JSON (tolérance 0,5 mm, gestion du format legacy `valeurMm`) ;
   - **orientation** : `EstPortrait` de chaque page vs orientation du document (`LargeurOuvert < HauteurOuvert`) ;
   - **nombre de pages** vs `pages..Occurrence` du JSON sauvegardé (normalisation wrapper → `data`).
4. **Nettoyage différé** : `NettoyerFichiersDocumentTemp(nInd)` n'est appelé qu'une fois la conformité validée (il vide `JsonDesignerData`/`CodeTemp` — sauvegardés à l'étape 1).
5. **Pipeline d'import standard inchangé** : nouveau `CodeTemp`, renommage en `Ltr{CodeTemp}.pdf`, Phase 1 analyse, Phase 1bis `normalize_bleedbox`, Phase 2 fonds JPG (`GenereVignetteDocument`), Phase 3 blanc tournant si non fond perdu.
6. **Ré-ancrage** : `cpDesigner.ReecritCheminsUploadJson(sJsonSauvegarde, sRepUpload, sRepUploadRel, nouveauCodeTemp, NombrePage, Vrai)` réécrit `pages[].cheminFond`/`urlFond` (+ chemins `zonesImage`) vers l'upload — zones, champs de fusion et contraintes conservés tels quels.
7. **Restauration** dans la structure : `JsonDesignerData` réécrit, `EstPersonnaliseDesigner = Vrai`, `DateHeureDesigner` restaurée.
8. **Régénération PSMD + BAT**, ordre identique à `btnRegenererBat` : `GenererPsmdServeurDocument` → `GenererBatDocumentDepuisPsmd` → `TraiterManifestImagesDesigner` → blanc tournant fond + BAT si non fond perdu → `AfficheVignettePopupUpload()`. En cas d'échec PSMD, la personnalisation est déjà restaurée : message d'erreur sans reset (BAT régénérable via « Régénérer le BAT »).

Garde-fou du bloc `fin:` : le reset destructif historique ne s'exécute qu'en mode normal. En mode remplacement sur échec : suppression du fichier uploadé résiduel + restauration défensive des champs sauvegardés si le nettoyage différé avait déjà eu lieu.

La **sauvegarde de l'opération** reste inchangée : `AjoutModificationOperationCourrier` → `ModificationCheminDesignerJson` réécrit `cheminFond`/`urlFond` vers les répertoires définitifs, régénère le PSMD, puis `DéplaceFichierUpload` déplace les fichiers.

## 4. Procédure extraite : `cpDesigner.ReecritCheminsUploadJson`

Ex-procédure **interne** de `pgeAccueil.ActionOperationDupliquer`, désormais **publique dans `cpDesigner`**, comportement identique :

- `pages[].cheminFond` → `{upload}\Ltr{CodeTemp}.pdf` et `pages[].urlFond` → `{uploadRel}/LtrFond{CodeTemp}p{n}.jpg` (si `pReecrirePages`) ;
- `zonesImage[].source.nomFichier`/`valeur` → upload, avec copie du fichier image ;
- pas de régénération PSMD (à la charge de l'appelant ou de la sauvegarde).

Protection ajoutée : si l'image d'une zone est **déjà à l'emplacement cible** (`source = destination`, cas du remplacement dans le même répertoire Upload), la copie est sautée — l'enchaînement historique `fSupprime(sDest)` + `fCopieFichier` aurait détruit le fichier. Sans incidence sur la duplication (source ≠ destination toujours).

`ActionOpérationDupliquer` appelle désormais la version partagée sur ses 2 sites (JSON enveloppe et JSON documents).

## 5. Limites et V2

- **Modèles non couverts** : `pgeLtrDocument` (bibliothèque de modèles) vide toujours `JsonDesignerData` à l'upload d'un nouveau PDF (`UploadFichier()` de la page) ; `SelectionModèle` (pgeLtrContenu) recharge l'état du modèle. Le remplacement de fond sur un modèle personnalisé = V2.
- **Remplacement depuis le Designer écarté** : le Designer traite `cheminFond`/`urlFond` en lecture seule (pass-through) et n'a pas de canal d'upload de PDF ; l'ajouter exigerait un nouveau message + analyse serveur + rechargement en cours d'édition, pour aucun gain fonctionnel.
- Le remplacement exige un PDF strictement conforme (même format fini, même orientation, même nombre de pages, même fond perdu à 0,5 mm près) ; tout écart est rejeté pour garantir l'absence de décalage des zones.

## 6. Fichiers concernés

| Fichier | Nature |
|---|---|
| `webdev/cpDesigner/procédure ReecritCheminsUploadJson.txt` | **Créé** — extraction en procédure partagée + protection source = destination |
| `webdev/pgeAccueil/procédure ActionOpérationDupliquer.txt` | Modifié — 2 appels vers `cpDesigner.ReecritCheminsUploadJson`, procédure interne supprimée |
| `webdev/pgeLtrContenu/procédure InitZnrContenu.txt` | Modifié — `btnDocumentImporter..Visible = Vrai` (cas Fichier) |
| `webdev/pgeLtrContenu/procédure trtCboDocumentSelection.txt` | Modifié — idem (cas `"F"`) |
| `webdev/pgeLtrContenu/Code bouton btnDocumentImporter.txt` | **Créé** — code de clic avec confirmation (à câbler dans l'éditeur WebDev) |
| `webdev/pgeLtrContenu/procédure UploadFichier.txt` | Modifié — mode `bRemplacementFond` : sauvegarde/contrôles/`ControleConformiteRemplacement`/ré-ancrage/restauration/régénération |
