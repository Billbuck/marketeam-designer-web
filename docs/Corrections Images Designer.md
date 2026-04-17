# Corrections « Images Designer » — Gestion des images utilisateur

## Principe
Quand l'utilisateur importe des images dans le Designer, elles sont encodées en base64 dans le JSON.
Le `psmd_cli.js` les extrait et les sauvegarde sur le disque + écrit un manifeste.
Après la génération du BAT, on lit le manifeste pour :
- Remplir `source.nomFichier` (chemin physique) dans le JSON
- Remplir `source.valeur` (URL web) pour que le Designer puisse ré-afficher l'image
- Vider `source.imageBase64` pour alléger le JSON stocké en BDD


---
## HISTORIQUE DES VERSIONS
---

### V1 — Version initiale (session 30-31 mars 2026)
Première implémentation. Procédures créées :
- TraiterManifestImagesDesigner, DeplacerImagesDesignerJson
- Intégration dans ServeurTraiterMessageDesigner et DéplaceFichierUpload
- Correction script.js : updateImageFileInfoDisplay

**Bugs connus dans V1 (corrigés en V2) :**
- Désérialisation via `structDesignerExport` échoue → `zonesImage` toujours vide
- Backslash `\` dans les URL images générées (Remplace ne convertit pas `\` en `/`)
- Fichiers PSMD non déplacés de Upload vers Printshop
- Designer : `loadFromLocalStorage()` charge des données périmées d'une session précédente

### V2 — Corrections (session 2 avril 2026)
1. Désérialisation : type JSON natif au lieu de Désérialise(structDesignerExport)
2. Backslash URL : ajout de Remplace(sUrlImage, "\", "/")
3. PSMD : déplacement des fichiers .psmd dans DéplaceFichierUpload
4. script.js : détection postMessage sans wrapper + logs de diagnostic
5. ModificationCheminDesignerJson : mise à jour anticipée des chemins images (avant BDD)
6. DeplacerImagesDesignerJson : recherche du fichier dans Upload quand le chemin pointe déjà vers Printshop

### V3 — Corrections modification multi-images (session 2 avril 2026) — ⚠️ VERSION COURANTE
**Problème V2** : En modification, quand le JSON contient des images déjà traitées
(base64 purgé, URL et nomFichier renseignés), le code de nettoyage "orphelin" de
TraiterManifestImagesDesigner supprimait ces images du disque car elles n'étaient
pas dans le manifeste (pas de nouveau base64 à extraire).
De plus, le Designer ne préservait pas `nomFichier` entre import/export, empêchant
le générateur PSMD de référencer les images déjà extraites.

**Corrections V3 :**
1. **TraiterManifestImagesDesigner** : le nettoyage orphelin vérifie maintenant si `source.valeur` (URL) est renseignée — si oui, l'image est encore utilisée et ne doit PAS être supprimée
2. **script.js** : `nomFichier` est maintenant préservé dans le cycle import/export du Designer (convertZoneImageFromJson + convertZoneImageToJson)
3. **GenereVignetteEnveloppe** : ajout de l'appel TraiterManifestImagesDesigner pour nettoyer le manifeste de l'enveloppe
4. **ServeurTraiterMessageDesigner** : ajout garde `tabPagePDF..Occurrence > 0` avant accès à EstFondPerdu


---
## 1. PROCEDURE COMPLETE : TraiterManifestImagesDesigner() [V3]
---

Procédure partagée (Partage). Remplace INTEGRALEMENT la version précédente.
Appelée après GenererBatDocumentDepuisPsmd / GenererBatEnveloppeDepuisPsmd
et aussi après GenereVignetteEnveloppe.

```
procédure TraiterManifestImagesDesigner(sCheminPsmd est une chaîne, sJsonDesignerData est une chaîne <utile>)

sCheminManifeste		est une chaîne
sContenuManifeste		est une chaîne
vManifeste				est un Variant
jDoc					est un JSON
nNbTraitees				est un entier = 0

// ─── Construction du chemin manifeste ────────────────────────────────────
sCheminManifeste = sCheminPsmd + ".images.json"

si pas fFichierExiste(sCheminManifeste) alors
	Trace("TraiterManifestImagesDesigner : manifeste introuvable : " + sCheminManifeste)
	retour
fin

// ─── Lecture du manifeste ────────────────────────────────────────────────
sContenuManifeste = fChargeTexte(sCheminManifeste)

si sContenuManifeste = "" _ou_ sContenuManifeste = "[]" alors
	fSupprime(sCheminManifeste)
	Trace("TraiterManifestImagesDesigner : manifeste vide, rien à traiter")
	retour
fin

// ─── Parsing du JSON Designer (type JSON natif = préserve tous les champs) ─
si sJsonDesignerData = "" alors
	fSupprime(sCheminManifeste)
	retour
fin

jDoc = ChaîneVersUTF8(sJsonDesignerData)

si jDoc.zonesImage..Occurrence = 0 alors
	fSupprime(sCheminManifeste)
	Trace("TraiterManifestImagesDesigner : aucune zone image dans le JSON")
	retour
fin

// ─── Parsing du manifeste (tableau Variant) ──────────────────────────────
vManifeste = JSONVersVariant(sContenuManifeste)

// ─── BOUCLE 1 : Traiter les NOUVELLES images (présentes dans le manifeste) ─
// Pour chaque zone image du JSON, chercher si elle apparaît dans le manifeste.
// Si oui : remplir nomFichier, valeur (URL), vider base64.
pour nIndZone = 1 _à_ jDoc.zonesImage..Occurrence

	sZoneId est une chaîne = jDoc.zonesImage[nIndZone].id

	pour nIndManif = 1 _à_ Dimension(vManifeste)

		si vManifeste[nIndManif].zoneId = sZoneId alors

			sFullPath	est une chaîne = vManifeste[nIndManif].fullPath
			sFileName	est une chaîne = vManifeste[nIndManif].fileName

			// [V3] Si le manifeste contient une entrée sans fichier valide
			// (ex: fullPath="0" quand psmd_cli n'a pas de base64 à extraire),
			// l'image a déjà été traitée lors d'une session précédente → ignorer
			si sFullPath = "" _ou_ sFullPath = "0" _ou_ pas fFichierExiste(sFullPath) alors
				Trace("TraiterManifestImagesDesigner : zone " + sZoneId + " → manifeste sans fichier valide (" + sFullPath + "), conserve l'existant")
				sortir
			fin

			// Supprimer l'ancienne image physique si elle a changé (remplacement)
			sAncienFichier est une chaîne = jDoc.zonesImage[nIndZone].source.nomFichier
			si sAncienFichier <> "" _et_ sAncienFichier <> sFullPath _et_ fFichierExiste(sAncienFichier) alors
				fSupprime(sAncienFichier)
				Trace("TraiterManifestImagesDesigner : ancienne image remplacée, supprimée : " + sAncienFichier)
			fin

			// Chemin physique
			jDoc.zonesImage[nIndZone].source.nomFichier = sFullPath

			// URL web : racine physique → racine HTTP, puis \ → /
			sUrlImage est une chaîne = Remplace(sFullPath, cpProjet.__sMarketeamRepRacine, cpProjet.__sHttpMarketeam)
			sUrlImage = Remplace(sUrlImage, "\", "/")
			jDoc.zonesImage[nIndZone].source.valeur = sUrlImage

			// Purger le base64
			jDoc.zonesImage[nIndZone].source.imageBase64 = ""

			nNbTraitees++
			Trace("TraiterManifestImagesDesigner : zone " + sZoneId + " → " + sFileName)
			sortir

		fin

	fin

fin

// ─── BOUCLE 2 : Nettoyage des images SUPPRIMÉES par l'utilisateur ───────
// Une zone est considérée comme "orpheline" (image supprimée) UNIQUEMENT si :
//   - elle n'est PAS dans le manifeste (pas de nouveau base64 extrait)
//   - ET elle n'a PAS de base64
//   - ET elle n'a PAS d'URL (valeur) → pas d'image déjà traitée
// Si l'URL est renseignée, l'image existe encore (traitée lors d'une session
// précédente) → on ne touche à rien.
pour nIndZone = 1 _à_ jDoc.zonesImage..Occurrence

	sAncienFichier est une chaîne = jDoc.zonesImage[nIndZone].source.nomFichier

	si sAncienFichier = "" alors
		continuer
	fin

	// Vérifier si ce zoneId est dans le manifeste
	bTrouveDansManifeste est un booléen = Faux
	pour nIndManif = 1 _à_ Dimension(vManifeste)
		si vManifeste[nIndManif].zoneId = jDoc.zonesImage[nIndZone].id alors
			bTrouveDansManifeste = Vrai
			sortir
		fin
	fin

	// Déjà traité en boucle 1 → passer
	si bTrouveDansManifeste alors
		continuer
	fin

	// Si l'URL (valeur) est renseignée → image encore utilisée, ne pas toucher
	si jDoc.zonesImage[nIndZone].source.valeur <> "" alors
		continuer
	fin

	// Si base64 présent → image pas encore extraite, ne pas toucher
	si jDoc.zonesImage[nIndZone].source.imageBase64 <> "" alors
		continuer
	fin

	// Arrivé ici : pas dans manifeste, pas de base64, pas d'URL → orpheline
	si fFichierExiste(sAncienFichier) alors
		fSupprime(sAncienFichier)
		Trace("TraiterManifestImagesDesigner : image orpheline supprimée : " + sAncienFichier)
	fin
	jDoc.zonesImage[nIndZone].source.nomFichier = ""
	nNbTraitees++

fin

// ─── Re-sérialisation du JSON ────────────────────────────────────────────
si nNbTraitees > 0 alors
	sJsonDesignerData = JSONVersChaîne(jDoc)
	Trace("TraiterManifestImagesDesigner : " + nNbTraitees + " image(s) traitée(s), base64 purgé")
fin

// ─── Suppression du manifeste ────────────────────────────────────────────
fSupprime(sCheminManifeste)
```


---
## 2. MODIFICATION : ServeurTraiterMessageDesigner()
---

Ajouter l'appel à `TraiterManifestImagesDesigner` après chaque génération de BAT.

### Pour l'ENVELOPPE (cas `_nIndDesignerEnCours = 0`) :

AVANT :
```
__stOperation.stOperationLettre.stEnveloppe.JsonDesignerData = sJsonData
si Partage.GenererPsmdServeurEnveloppe(__stOperation.stOperationLettre.stEnveloppe, __stOperation.CodeTemp) alors
	GenererBatEnveloppeDepuisPsmd(__stOperation.stOperationLettre.stEnveloppe, __stOperation.CodeTemp)
	intAdressageExpediteur.Etat		= Grisé
	intAdressageLogo.Etat				= Grisé
	intAdressagePromotion.Etat			= Grisé
	btnEnveloppeSupprimer..Visible	= Vrai
	btnEnveloppeAperçu.Visible			= Vrai
fin
```

APRES :
```
__stOperation.stOperationLettre.stEnveloppe.JsonDesignerData = sJsonData
si Partage.GenererPsmdServeurEnveloppe(__stOperation.stOperationLettre.stEnveloppe, __stOperation.CodeTemp) alors
	GenererBatEnveloppeDepuisPsmd(__stOperation.stOperationLettre.stEnveloppe, __stOperation.CodeTemp)
	Partage.TraiterManifestImagesDesigner(__stOperation.stOperationLettre.stEnveloppe.CheminPsmdEnveloppe, __stOperation.stOperationLettre.stEnveloppe.JsonDesignerData)
	intAdressageExpediteur.Etat		= Grisé
	intAdressageLogo.Etat				= Grisé
	intAdressagePromotion.Etat			= Grisé
	btnEnveloppeSupprimer..Visible	= Vrai
	btnEnveloppeAperçu.Visible			= Vrai
fin
```


### Pour le DOCUMENT (cas `_nIndDesignerEnCours > 0`) :

AVANT :
```
__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].JsonDesignerData = sJsonData
si Partage.GenererPsmdServeurDocument(__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours]) alors
	GenererBatDocumentDepuisPsmd(__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours])
	si __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].tabPagePDF[1].EstFondPerdu = Faux alors
		pour tout stVignette de __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].tabImageFond
			Partage.AppliqueBlancTournant(stVignette.CheminPhysique, __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].LargeurOuvert, __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].HauteurOuvert)
		fin
	fin
sinon
	PopupAfficheMessage(
	"Erreur lors de la génération du document" + RC + "Merci de réitérer l'opération", "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
fin
```

APRES :
```
__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].JsonDesignerData = sJsonData
si Partage.GenererPsmdServeurDocument(__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours]) alors
	GenererBatDocumentDepuisPsmd(__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours])
	Partage.TraiterManifestImagesDesigner(__stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].CheminPsmdTemp, __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].JsonDesignerData)
	si __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].tabPagePDF[1].EstFondPerdu = Faux alors
		pour tout stVignette de __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].tabImageFond
			Partage.AppliqueBlancTournant(stVignette.CheminPhysique, __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].LargeurOuvert, __stOperation.stOperationLettre.tabStDocument[_nIndDesignerEnCours].HauteurOuvert)
		fin
	fin
sinon
	PopupAfficheMessage(
	"Erreur lors de la génération du document" + RC + "Merci de réitérer l'opération", "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
fin
```

---
## 3. NOUVELLE PROCEDURE : DeplacerImagesDesignerJson() [V3]
---

Procédure partagée (Partage) à créer.
Déplace les fichiers images Designer vers le répertoire Printshop de l'opération
et met à jour les chemins dans le JsonDesignerData.

Appelée depuis DéplaceFichierUpload pour chaque document et pour l'enveloppe.

IMPORTANT : Même approche que TraiterManifestImagesDesigner — on utilise le type
JSON natif pour éviter les problèmes de désérialisation et préserver tous les champs.

[V3] Ajout du 3ème paramètre optionnel `sRepertoireSource` :
En modification, les fichiers générés se trouvent dans le répertoire Documents
de l'opération (stDocument.Repertoire), pas dans Upload.
ModificationCheminDesignerJson a déjà mis à jour les chemins vers Printshop
AVANT la sauvegarde BDD, donc le chemin JSON pointe vers Printshop mais le
fichier physique est dans Documents/. Le fallback Upload ne suffit plus,
il faut aussi chercher dans le répertoire source.

```
procédure DeplacerImagesDesignerJson(sJsonDesignerData est une chaîne <utile>, sRepertoirePrintshop est une chaîne, sRepertoireSource est une chaîne = "")

jDoc				est un JSON
sAncienChemin		est une chaîne
sNomFichier			est une chaîne
sNouveauChemin		est une chaîne
nNbDeplacees		est un entier = 0

// ─── Garde : pas de JSON → rien à faire ─────────────────────────────────
si sJsonDesignerData = "" alors
	retour
fin

jDoc = ChaîneVersUTF8(sJsonDesignerData)

si jDoc.zonesImage..Occurrence = 0 alors
	retour
fin

// ─── Parcours des zones image ────────────────────────────────────────────
pour nInd = 1 _à_ jDoc.zonesImage..Occurrence

	sAncienChemin = jDoc.zonesImage[nInd].source.nomFichier

	// Pas de fichier physique référencé → zone sans image fixe, on passe
	si sAncienChemin = "" alors
		continuer
	fin

	sNomFichier		= fExtraitChemin(sAncienChemin, fFichier + fExtension)
	sNouveauChemin	= sRepertoirePrintshop + sNomFichier

	// Si le chemin pointe déjà vers Printshop (mis à jour par
	// ModificationCheminDesignerJson AVANT la sauvegarde BDD),
	// vérifier si le fichier existe physiquement à destination.
	// Sinon, le chercher dans Upload puis dans le répertoire source.
	si Gauche(sAncienChemin, Taille(sRepertoirePrintshop)) = sRepertoirePrintshop alors

		si fFichierExiste(sAncienChemin) alors
			continuer
		fin

		// Chercher dans Upload (cas création)
		sCheminUpload est une chaîne = cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\" + sNomFichier

		si fFichierExiste(sCheminUpload) alors
			si fFichierExiste(sNouveauChemin) alors
				fSupprime(sNouveauChemin)
			fin
			si fDéplaceFichier(sCheminUpload, sNouveauChemin) alors
				nNbDeplacees++
				Trace("DeplacerImagesDesignerJson : déplacé depuis Upload " + sNomFichier + " → " + sRepertoirePrintshop)
			sinon
				Trace("DeplacerImagesDesignerJson : échec déplacement " + sCheminUpload + " → " + sNouveauChemin)
			fin

		// [V3] Chercher dans le répertoire source (cas modification : Documents/)
		sinonsi sRepertoireSource <> "" alors
			sCheminSource est une chaîne = sRepertoireSource + sNomFichier
			si fFichierExiste(sCheminSource) alors
				si fFichierExiste(sNouveauChemin) alors
					fSupprime(sNouveauChemin)
				fin
				si fDéplaceFichier(sCheminSource, sNouveauChemin) alors
					nNbDeplacees++
					Trace("DeplacerImagesDesignerJson : déplacé depuis Repertoire " + sNomFichier + " → " + sRepertoirePrintshop)
				sinon
					Trace("DeplacerImagesDesignerJson : échec déplacement " + sCheminSource + " → " + sNouveauChemin)
				fin
			sinon
				Trace("DeplacerImagesDesignerJson : fichier introuvable (Printshop, Upload, Repertoire) : " + sNomFichier)
			fin
		sinon
			Trace("DeplacerImagesDesignerJson : fichier introuvable (Printshop, Upload) : " + sNomFichier)
		fin

		continuer

	fin

	// Le fichier existe-t-il sur le disque ?
	si pas fFichierExiste(sAncienChemin) alors
		Trace("DeplacerImagesDesignerJson : fichier introuvable : " + sAncienChemin)
		continuer
	fin

	// ─── Déplacement vers __REP_PRINTSHOP__ ──────────────────────────────
	si fFichierExiste(sNouveauChemin) alors
		fSupprime(sNouveauChemin)
	fin

	si fDéplaceFichier(sAncienChemin, sNouveauChemin) alors
		jDoc.zonesImage[nInd].source.nomFichier = sNouveauChemin
		sUrlImage est une chaîne = Remplace(sNouveauChemin, cpProjet.__sMarketeamRepRacine, cpProjet.__sHttpMarketeam)
		sUrlImage = Remplace(sUrlImage, "\", "/")
		jDoc.zonesImage[nInd].source.valeur = sUrlImage
		nNbDeplacees++
		Trace("DeplacerImagesDesignerJson : déplacé " + sNomFichier + " → " + sRepertoirePrintshop)
	sinon
		Trace("DeplacerImagesDesignerJson : échec déplacement " + sAncienChemin + " → " + sNouveauChemin)
	fin

fin

// ─── Re-sérialisation si au moins un déplacement ─────────────────────────
si nNbDeplacees > 0 alors
	sJsonDesignerData = JSONVersChaîne(jDoc)
	Trace("DeplacerImagesDesignerJson : " + nNbDeplacees + " image(s) déplacée(s)")
fin
```


---
## 4. MODIFICATION : DéplaceFichierUpload() — bloc __OPERATION_COURRIER__ [V2]
---

Quatre ajouts dans le bloc courrier existant :

### A. Après le déplacement du BAT enveloppe, déplacer le PSMD et les images Designer de l'enveloppe :

AVANT :
```
		// On sauvegarde le bat Enveloppe
		si stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique <> "" alors
			fDéplaceFichier(stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique, sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__)
			stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique	= sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__
			stOperation.stOperationLettre.stEnveloppe.RepertoireTravail				= sRepertoireBat
		fin
```

APRES :
```
		// On sauvegarde le bat Enveloppe
		si stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique <> "" alors
			fDéplaceFichier(stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique, sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__)
			stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique	= sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__
			stOperation.stOperationLettre.stEnveloppe.RepertoireTravail				= sRepertoireBat
		fin

		// Déplacer le PSMD de l'enveloppe vers Printshop
		si stOperation.stOperationLettre.stEnveloppe.CheminPsmdEnveloppe <> "" _et_ fFichierExiste(stOperation.stOperationLettre.stEnveloppe.CheminPsmdEnveloppe) alors
			sNouveauCheminPsmd est une chaîne = sRepertoirePrintshop + __DOC_ENV_PSMD__ + stOperation.IdOperation + ".psmd"
			si fFichierExiste(sNouveauCheminPsmd) alors
				fSupprime(sNouveauCheminPsmd)
			fin
			si fDéplaceFichier(stOperation.stOperationLettre.stEnveloppe.CheminPsmdEnveloppe, sNouveauCheminPsmd) alors
				stOperation.stOperationLettre.stEnveloppe.CheminPsmdEnveloppe		= sNouveauCheminPsmd
				stOperation.stOperationLettre.stEnveloppe.NomFichierPsmdEnveloppe	= __DOC_ENV_PSMD__ + stOperation.IdOperation + ".psmd"
				Trace("DéplaceFichierUpload : PSMD enveloppe déplacé → " + sNouveauCheminPsmd)
			sinon
				Trace("DéplaceFichierUpload : échec déplacement PSMD enveloppe", ErreurInfo(errComplet))
			fin
		fin

		// [V3] Déplacer les images Designer de l'enveloppe vers Printshop
		// 3ème paramètre = répertoire source (RepertoireTravail de l'enveloppe)
		Partage.DeplacerImagesDesignerJson(stOperation.stOperationLettre.stEnveloppe.JsonDesignerData, sRepertoirePrintshop, stOperation.stOperationLettre.stEnveloppe.RepertoireTravail)
```


### B. Après le bloc AJOUT B (mise à jour Repertoire du document), déplacer le PSMD, les BAT et les images Designer du document :

Le bloc complet autour de ces ajouts devient :

```
			// [V4] Répertoire source = RepertoireTravail (Temp en modification, Upload en création)
			sRepertoireSourceDocument est une chaîne = stDocument.RepertoireTravail

			si stDocument.EstUploadé = Vrai alors
				selon Vrai
					// ... tout le code existant de déplacement ...
				fin

				// ─── AJOUT B : Mise à jour du répertoire et du CodeTemp après déplacement ─
				stDocument.Repertoire		= sRepertoireDocument
				stDocument.RepertoireTravail	= sRepertoireDocument
				stDocument.CodeTemp			= stDocument.IdLettreContenu
				stDocument.NomFichierTemp	= __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				stDocument.EstUploadé		= Faux
			fin

			// ─── [V3] Déplacement BAT en modification ───────────────────────
			// En modification, les BAT sont générés dans stDocument.Repertoire
			// (= Documents/) mais doivent aller dans sRepertoireBat (= Bat/).
			// En création, les BAT sont déjà déplacés dans le bloc EstUploadé.
			pour NumPage = 1 _à_ stDocument.NombrePage
				si stDocument.tabImageBat..Occurrence >= NumPage alors
					sCheminBatActuel est une chaîne = stDocument.tabImageBat[NumPage].CheminPhysique
					sCheminBatFinal est une chaîne = sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__
					si sCheminBatActuel <> sCheminBatFinal _et_ fFichierExiste(sCheminBatActuel) alors
						si fFichierExiste(sCheminBatFinal) alors
							fSupprime(sCheminBatFinal)
						fin
						si fDéplaceFichier(sCheminBatActuel, sCheminBatFinal) alors
							stDocument.tabImageBat[NumPage].CheminPhysique = sCheminBatFinal
							Trace("DéplaceFichierUpload [V3] : BAT modif déplacé → " + sCheminBatFinal)
						sinon
							Trace("DéplaceFichierUpload [V3] : échec déplacement BAT " + sCheminBatActuel, ErreurInfo(errComplet))
						fin
					fin
				fin
			fin

			// Déplacer le PSMD du document vers Printshop
			si stDocument.CheminPsmdTemp <> "" _et_ fFichierExiste(stDocument.CheminPsmdTemp) alors
				sNouveauCheminPsmd est une chaîne = sRepertoirePrintshop + __DOC_LTR_PSMD__ + stDocument.IdLettreContenu + ".psmd"
				si fFichierExiste(sNouveauCheminPsmd) alors
					fSupprime(sNouveauCheminPsmd)
				fin
				si fDéplaceFichier(stDocument.CheminPsmdTemp, sNouveauCheminPsmd) alors
					stDocument.CheminPsmdTemp	= sNouveauCheminPsmd
					stDocument.NomFichierPsmd	= __DOC_LTR_PSMD__ + stDocument.IdLettreContenu + ".psmd"
					Trace("DéplaceFichierUpload : PSMD document déplacé → " + sNouveauCheminPsmd)
				sinon
					Trace("DéplaceFichierUpload : échec déplacement PSMD document", ErreurInfo(errComplet))
				fin
			fin

			// [V3] Déplacer les images Designer du document vers Printshop
			// Le 3ème paramètre = répertoire source (Documents/ en modification, Upload/ en création)
			Partage.DeplacerImagesDesignerJson(stDocument.JsonDesignerData, sRepertoirePrintshop, sRepertoireSourceDocument)
		fin
```

IMPORTANT : Les blocs BAT, PSMD et images sont placés EN DEHORS du `si stDocument.EstUploadé = Vrai`.
Cela permet de les déplacer en modification (l'utilisateur re-valide un document déjà sauvegardé → 
nouveaux fichiers dans le répertoire de travail, pas encore dans les répertoires définitifs).

Le bloc BAT utilise une comparaison `sCheminBatActuel <> sCheminBatFinal` pour ne pas
re-déplacer un BAT déjà au bon endroit (sécurité en cas de double appel).


---
## Résumé des modifications [V3]
---

| # | Fichier/Procédure | Modification | Version |
|---|-------------------|-------------|---------|
| 1 | Partage.TraiterManifestImagesDesigner | Nouvelle procédure : lit manifeste, purge base64, remplit nomFichier/valeur, corrige backslashes URL. [V3] Ne supprime pas les images ayant un URL valide (orphan guard) | V2+V3 |
| 2 | ServeurTraiterMessageDesigner (enveloppe) | Ajout appel TraiterManifestImagesDesigner après BAT | V2 |
| 3 | ServeurTraiterMessageDesigner (document) | Ajout appel TraiterManifestImagesDesigner après BAT | V2 |
| 4 | Partage.DeplacerImagesDesignerJson | Déplace images vers Printshop. [V3] Ajout 3ème paramètre `sRepertoireSource` : cherche aussi dans Documents/ en modification | V2→V3 |
| 5 | DéplaceFichierUpload (enveloppe) | Déplacement PSMD enveloppe + appel DeplacerImagesDesignerJson avec RepertoireTravail | V2→V3 |
| 6 | DéplaceFichierUpload (document) | [V3] Déplacement BAT hors EstUploadé + PSMD + images avec Repertoire source | V2→V3 |
| 7 | Designer script.js | Ne pas charger localStorage quand dans un iframe (évite les données périmées) |
