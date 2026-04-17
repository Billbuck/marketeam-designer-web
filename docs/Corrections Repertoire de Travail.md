# Corrections « Répertoire de Travail » — Procédures réécrites

## Principe
Chaque document porte `stDocument.Repertoire` = le répertoire où vivent ses fichiers.
Chaque enveloppe porte `stEnveloppe.RepertoireTravail` (nouveau champ).
Toutes les procédures utilisent ce répertoire au lieu de recalculer Upload en dur.


---
## 1. MODIFICATION DE LA STRUCTURE StructEnveloppe
---

Ajouter le membre suivant dans la structure StructEnveloppe :

```
RepertoireTravail		est une chaîne
```

Ce champ sera rempli :
- En création : par la page (= Upload)
- En modification (rechargement) : par ChargeStructOperationLettre (= répertoire BAT de l'opération)


---
## 2. CORRECTION : Chargement navigateur pgeLtrContenu (onload)
---

AVANT (ligne 42) :
```
gsXmlPsmd = gsXm1Psmd
```

APRES :
```
gsXmlPsmd = gsXmlPsmd
```

Note : gsXm1Psmd contenait un "1" au lieu d'un "l" minuscule.


---
## 3. PROCEDURE REECRITE : GenererPsmdServeurDocument()
---

```
procédure GenererPsmdServeurDocument(stDocument est une structDocument)

sNodeExe				est une chaîne	= INILit("NODE", "CHEMIN", "", NomFichierIni())
sNodeCli				est une chaîne	= INILit("NODE", "CLI", "", NomFichierIni())
sRepTravail			est une chaîne
sCodeTemp			est une chaîne
sCheminJsonTemp	est une chaîne
sCheminPsmd			est une chaîne
sNomFichierPsmd	est une chaîne
sCommande			est une chaîne

// ─── Validation du JSON en entrée ────────────────────────────────────────
si stDocument.JsonDesignerData = "" alors
	Trace("GenererPsmdServeur : pJsonDesigner vide")
	renvoyer Faux
fin

// ─── Validation de la configuration INI ──────────────────────────────────
si sNodeExe = "" ou sNodeCli = "" alors
	Trace("GenererPsmdServeur : section [NODE] manquante dans le fichier INI (CHEMIN / CLI)")
	renvoyer Faux
fin

// ─── Construction des chemins — UTILISE LE REPERTOIRE DU DOCUMENT ────────
sRepTravail			= stDocument.Repertoire
sCodeTemp			= stDocument.CodeTemp
sNomFichierPsmd	= __DOC_LTR_PSMD__ + sCodeTemp + ".psmd"
sCheminPsmd			= sRepTravail + sNomFichierPsmd
sCheminJsonTemp	= sRepTravail + "psmd_json_" + sCodeTemp + ".tmp"

// ─── Écriture du JSON dans le fichier temporaire ─────────────────────────
si pas fSauveTexte(sCheminJsonTemp, ChaîneVersUTF8(stDocument.JsonDesignerData)) alors
	Trace("GenererPsmdServeur : échec fSauveTexte JSON temp : " + sCheminJsonTemp)
	renvoyer Faux
fin

si fFichierExiste(sCheminPsmd) alors
	si pas fSupprime(sCheminPsmd) alors
		renvoyer Faux
	fin
fin

// ─── Construction et exécution de la commande ────────────────────────────
sCommande = ChaîneConstruit(
[
	"%1" "%2" "%3" "%4"
],
sNodeExe, sNodeCli, sCheminJsonTemp, sCheminPsmd)

Trace("GenererPsmdServeur : CMD = " + sCommande)

si pas LanceAppli(sCommande, exeIconise, exeBloquant) alors
	Trace("GenererPsmdServeur : LanceAppli a échoué — " + ErreurInfo(errComplet))
	renvoyer Faux
fin

// ─── Nettoyage du fichier JSON temporaire ────────────────────────────────
si fFichierExiste(sCheminJsonTemp) alors
	fSupprime(sCheminJsonTemp)
fin

// ─── Vérification de la présence du .psmd produit ────────────────────────
si pas fFichierExiste(sCheminPsmd) alors
	Trace("GenererPsmdServeur : .psmd introuvable après génération : " + sCheminPsmd)
	renvoyer Faux
fin

// ─── Mise à jour de la structure document ────────────────────────────────
stDocument.CheminPsmdTemp	= sCheminPsmd
stDocument.NomFichierPsmd	= sNomFichierPsmd

Trace("GenererPsmdServeur : .psmd généré avec succès : " + sCheminPsmd)
renvoyer Vrai
```


---
## 4. PROCEDURE REECRITE : GenererBatDocumentDepuisPsmd()
---

```
procédure GenererBatDocumentDepuisPsmd(stDocument est une structDocument)

sRepTravail					est une chaîne			= stDocument.Repertoire
sCheminPsmd					est une chaîne			= stDocument.CheminPsmdTemp
tabPrintshopData			est un tableau de stPrintshopData
stPrintshopData			est un stPrintshopData
stImageBat					est une structDocumentImage
sCheminJpg					est une chaîne
nPage							est un entier

// ─── Validation : le PSMD doit exister sur disque ────────────────────────
si sCheminPsmd = "" _ou_ pas fFichierExiste(sCheminPsmd) alors
	Trace("GenererBatDocumentDepuisPsmd : PSMD introuvable : " + sCheminPsmd)
	retour
fin

Trace("GenererBatDocumentDepuisPsmd : PSMD confirmé : " + sCheminPsmd)

// ─── Construction du tableau de fusion ───────────────────────────────────
si __tabEchantillonBaseLigne..Occurrence > 0 alors
	AjoutePrintshopData("Societe",    __tabEchantillonBaseLigne[1].Societe)
	AjoutePrintshopData("Civilite",   __tabEchantillonBaseLigne[1].Civilite)
	AjoutePrintshopData("Nom",        __tabEchantillonBaseLigne[1].Nom)
	AjoutePrintshopData("Prenom",     __tabEchantillonBaseLigne[1].Prenom)
	AjoutePrintshopData("Adresse1",   __tabEchantillonBaseLigne[1].Adresse1)
	AjoutePrintshopData("Adresse2",   __tabEchantillonBaseLigne[1].Adresse2)
	AjoutePrintshopData("Adresse3",   __tabEchantillonBaseLigne[1].Adresse3)
	AjoutePrintshopData("Adresse4",   __tabEchantillonBaseLigne[1].Adresse4)
	AjoutePrintshopData("CodePostal", __tabEchantillonBaseLigne[1].CodePostal)
	AjoutePrintshopData("Ville",      __tabEchantillonBaseLigne[1].Ville)
	AjoutePrintshopData("Sequentiel", "000123456")
	AjoutePrintshopData("Timbre",      "Affranchissement")
fin

// ─── Génération BAT JPG page par page ────────────────────────────────────
SupprimeTout(stDocument.tabImageBat)

pour nPage = 1 _à_ stDocument.NombrePage

	sCheminJpg	= sRepTravail + __DOC_LTR_BAT__ + stDocument.CodeTemp + "p" + nPage + __JPG__
	Trace("sCheminPsmd", sCheminPsmd)
	stImageBat	= Partage.GenerationBatDepuisPsmd(sCheminPsmd, sCheminJpg, nPage, tabPrintshopData)

	si stImageBat.CheminPhysique <> "" alors
		Ajoute(stDocument.tabImageBat, stImageBat)
	fin
fin

	procédure interne AjoutePrintshopData(pChamp, pValeur)
		stPrintshopData.Champ	= pChamp
		stPrintshopData.Valeur	= pValeur
		tabPrintshopData.Ajoute(stPrintshopData)
	fin
```


---
## 5. PROCEDURE REECRITE : GenererPsmdServeurEnveloppe()
---

```
procédure GenererPsmdServeurEnveloppe(stEnveloppe est une StructEnveloppe, pCodeTemp est une chaîne)

sNodeExe				est une chaîne	= INILit("NODE", "CHEMIN", "", NomFichierIni())
sNodeCli				est une chaîne	= INILit("NODE", "CLI",    "", NomFichierIni())
sRepTravail			est une chaîne
sCheminJsonTemp	est une chaîne
sCheminPsmd			est une chaîne
sNomFichierPsmd	est une chaîne
sCommande			est une chaîne

// ─── Validation du JSON en entrée ────────────────────────────────────────
si stEnveloppe.JsonDesignerData = "" alors
	Trace("GenererPsmdServeurEnveloppe : JsonDesignerData vide")
	renvoyer Faux
fin

// ─── Validation de la configuration INI ──────────────────────────────────
si sNodeExe = "" _ou_ sNodeCli = "" alors
	Trace("GenererPsmdServeurEnveloppe : section [NODE] manquante dans le fichier INI")
	renvoyer Faux
fin

// ─── Construction des chemins — UTILISE LE REPERTOIRE DE L'ENVELOPPE ─────
sRepTravail			= stEnveloppe.RepertoireTravail
sNomFichierPsmd	= __DOC_ENV_PSMD__ + pCodeTemp + ".psmd"
sCheminPsmd			= sRepTravail + sNomFichierPsmd
sCheminJsonTemp	= sRepTravail + "psmd_json_env_" + pCodeTemp + ".tmp"

// ─── Écriture du JSON dans le fichier temporaire ─────────────────────────
si pas fSauveTexte(sCheminJsonTemp, ChaîneVersUTF8(stEnveloppe.JsonDesignerData)) alors
	Trace("GenererPsmdServeurEnveloppe : échec fSauveTexte : " + sCheminJsonTemp)
	renvoyer Faux
fin

// ─── Suppression PSMD précédent si existant ───────────────────────────────
si fFichierExiste(sCheminPsmd) alors
	si pas fSupprime(sCheminPsmd) alors
		renvoyer Faux
	fin
fin

// ─── Construction et exécution de la commande ────────────────────────────
sCommande = ChaîneConstruit(
[
	"%1" "%2" "%3" "%4"
],
sNodeExe, sNodeCli, sCheminJsonTemp, sCheminPsmd)

Trace("GenererPsmdServeurEnveloppe : CMD = " + sCommande)

si pas LanceAppli(sCommande, exeIconise, exeBloquant) alors
	Trace("GenererPsmdServeurEnveloppe : LanceAppli échoué — " + ErreurInfo(errComplet))
	renvoyer Faux
fin

// ─── Nettoyage fichier JSON temporaire ───────────────────────────────────
si fFichierExiste(sCheminJsonTemp) alors
	fSupprime(sCheminJsonTemp)
fin

// ─── Vérification présence du .psmd produit ──────────────────────────────
si pas fFichierExiste(sCheminPsmd) alors
	Trace("GenererPsmdServeurEnveloppe : .psmd introuvable après génération : " + sCheminPsmd)
	renvoyer Faux
fin

// ─── Mise à jour de la structure enveloppe ───────────────────────────────
stEnveloppe.CheminPsmdEnveloppe		= sCheminPsmd
stEnveloppe.NomFichierPsmdEnveloppe	= sNomFichierPsmd

Trace("GenererPsmdServeurEnveloppe : .psmd généré : " + sCheminPsmd)
renvoyer Vrai
```


---
## 6. PROCEDURE REECRITE : GenererBatEnveloppeDepuisPsmd()
---

```
procédure GenererBatEnveloppeDepuisPsmd(stEnveloppe est une StructEnveloppe, pCodeTemp)

sRepTravail					est une chaîne			= stEnveloppe.RepertoireTravail
sCheminPsmd					est une chaîne			= stEnveloppe.CheminPsmdEnveloppe
tabPrintshopData			est un tableau de stPrintshopData
stPrintshopData			est un stPrintshopData
stImageBat					est une structDocumentImage
sCheminJpg					est une chaîne

// ─── Validation : le PSMD doit exister sur disque ────────────────────────
si sCheminPsmd = "" _ou_ pas fFichierExiste(sCheminPsmd) alors
	Trace("GenererBatEnveloppeDepuisPsmd : PSMD introuvable : " + sCheminPsmd)
	retour
fin

Trace("GenererBatEnveloppeDepuisPsmd : PSMD confirmé : " + sCheminPsmd)

// ─── Construction du tableau de fusion ───────────────────────────────────
si __tabEchantillonBaseLigne..Occurrence > 0 alors
	AjoutePrintshopData("Societe",    __tabEchantillonBaseLigne[1].Societe)
	AjoutePrintshopData("Civilite",   __tabEchantillonBaseLigne[1].Civilite)
	AjoutePrintshopData("Nom",        __tabEchantillonBaseLigne[1].Nom)
	AjoutePrintshopData("Prenom",     __tabEchantillonBaseLigne[1].Prenom)
	AjoutePrintshopData("Adresse1",   __tabEchantillonBaseLigne[1].Adresse1)
	AjoutePrintshopData("Adresse2",   __tabEchantillonBaseLigne[1].Adresse2)
	AjoutePrintshopData("Adresse3",   __tabEchantillonBaseLigne[1].Adresse3)
	AjoutePrintshopData("Adresse4",   __tabEchantillonBaseLigne[1].Adresse4)
	AjoutePrintshopData("CodePostal", __tabEchantillonBaseLigne[1].CodePostal)
	AjoutePrintshopData("Ville",      __tabEchantillonBaseLigne[1].Ville)
	AjoutePrintshopData("Sequentiel", "000123456")
	AjoutePrintshopData("Timbre",      "Affranchissement")
fin

// ─── Génération BAT JPG ─────────────────────────────────────────────────
VariableRAZ(stEnveloppe.EnveloppeBAT)

sCheminJpg	= sRepTravail + __DOC_ENV_BAT__ + pCodeTemp + __JPG__
Trace("sCheminPsmd", sCheminPsmd)
stImageBat	= Partage.GenerationBatDepuisPsmd(sCheminPsmd, sCheminJpg, 1, tabPrintshopData)

si stImageBat.CheminPhysique <> "" alors
	stEnveloppe.EnveloppeBAT = stImageBat
fin

	procédure interne AjoutePrintshopData(pChamp, pValeur)
		stPrintshopData.Champ	= pChamp
		stPrintshopData.Valeur	= pValeur
		tabPrintshopData.Ajoute(stPrintshopData)
	fin
```


---
## 7. PROCEDURE REECRITE : GenereVignetteDocument()
---

Ajout de deux paramètres optionnels en fin de signature.
Les appels existants (en création) continuent de fonctionner sans modification.

```
procédure GenereVignetteDocument(pPdf, pVignettes, pEstFondPerdu = Faux, pLargeurExterneMm = 0, pHauteurExterneMm = 0, pRepertoirePhysique = "", pCheminRelatif = "")

// ─── Si aucun répertoire passé, on prend Upload par défaut (rétrocompatibilité création) ─
si pRepertoirePhysique = "" alors
	pRepertoirePhysique	= cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"]
fin
si pCheminRelatif = "" alors
	pCheminRelatif			= cpProjet.__sHttpMarketeam + cpProjet.__sRepUpload + ["/"]
fin

tabVignette				est un tableau de structDocumentImage
stVignette				est une structDocumentImage
sLigneDeCommande		est une chaîne
sTexte					est une chaîne
sLigneCommande			est une chaîne	= INILit("GHOSTSCRIPT", "CHEMIN", "", NomFichierIni())
nNbrPage					est un entier	= PDFNombreDePages(pRepertoirePhysique + pPdf)
sOptionBox				est une chaîne
nLargeurPt				est un entier
nHauteurPt				est un entier

// ─── Choix de la commande selon présence ou absence de fond perdu ─────────
si pEstFondPerdu alors
	sOptionBox	= "-dUseBleedBox"
	nLargeurPt	= Arrondi(pLargeurExterneMm * 2.834645669, 0)
	nHauteurPt	= Arrondi(pHauteurExterneMm * 2.834645669, 0)
	sTexte =
	[
		"%1" -sDEVICE=jpeg -dNOPAUSE -dBATCH -dNOPROMPT -r300 -dJPEGQ=100 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dFIXEDMEDIA -dDEVICEWIDTHPOINTS=%5 -dDEVICEHEIGHTPOINTS=%6 %4 -o "%3" "%2"
	]
sinon
	sOptionBox	= "-dUseTrimBox"
	sTexte		=
	[
		"%1" -sDEVICE=jpeg -dNOPAUSE -dBATCH -dPDFFitPage -dNOPROMPT -r300 -dJPEGQ=100 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 %4 -o "%3" "%2"
	]
fin

si sLigneCommande <> "" alors

	si pEstFondPerdu alors
		sLigneDeCommande = ChaîneConstruit(sTexte, sLigneCommande, pRepertoirePhysique + pPdf, pRepertoirePhysique + pVignettes + "p%01d.jpg", sOptionBox, nLargeurPt, nHauteurPt)
	sinon
		sLigneDeCommande = ChaîneConstruit(sTexte, sLigneCommande, pRepertoirePhysique + pPdf, pRepertoirePhysique + pVignettes + "p%01d.jpg", sOptionBox)
	fin

	si pas LanceAppli(sLigneDeCommande, exeIconise, exeBloquant, pRepertoirePhysique) alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur :", ErreurInfo(errComplet))
		<fin>
	fin

	pour nPage = 1 _à_ nNbrPage
		stVignette.CheminPhysique	= pRepertoirePhysique + pVignettes + "p" + nPage + __JPG__
		stVignette.CheminRelatif	= pCheminRelatif + pVignettes + "p" + nPage + __JPG__
		tabVignette.Ajoute(stVignette)
	fin

sinon
	<compile si TypeConfiguration <> Webservice>
		Info("Erreur :", "Convertisseur non implémenté !")
	<fin>
fin

renvoyer tabVignette
```


---
## 8. PROCEDURE REECRITE : ChargeStructOperationLettre()
---

Seule la partie après `sdReqOpeLettre.LitPremier()` change.
Le SQL ne change pas. Voici le bloc complet du `si sdReqOpeLettre.LitPremier()` :

```
si sdReqOpeLettre.LitPremier() alors

	FichierVersMémoire(stOperationLettre, sdReqOpeLettre)
	FichierVersMémoire(stOperationLettre.stEnveloppe,sdReqOpeLettre)

	sBatCheminPhysique		= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_BAT__,Vrai)
	sBatCheminRelatif			= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_BAT__,Faux)

	sFondCheminPhysique	 	= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_FOND__,Vrai)
	sFondCheminRelatif	 	= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_FOND__,Faux)

	// ─── CORRECTION : fFichierExiste sur chemin PHYSIQUE (pas relatif) ───────
	si fFichierExiste(sFondCheminPhysique + __DOC_ENV_FOND__ + pIdOperation + __JPG__) alors
		stOperationLettre.stEnveloppe.EnveloppeFond.CheminPhysique	= sFondCheminPhysique 	+ __DOC_ENV_FOND__ + pIdOperation + __JPG__
		stOperationLettre.stEnveloppe.EnveloppeFond.CheminRelatif	= sFondCheminRelatif 	+ __DOC_ENV_FOND__ + pIdOperation + __JPG__
	fin

	si fFichierExiste(sBatCheminPhysique + __DOC_ENV_BAT__ + pIdOperation + __JPG__) alors
		stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique	= sBatCheminPhysique 	+ __DOC_ENV_BAT__ + pIdOperation + __JPG__
		stOperationLettre.stEnveloppe.EnveloppeBAT.CheminRelatif 	= sBatCheminRelatif 		+ __DOC_ENV_BAT__ + pIdOperation + __JPG__
	fin

	// ─── AJOUT : Renseigner le répertoire de travail de l'enveloppe ──────────
	stOperationLettre.stEnveloppe.RepertoireTravail = sBatCheminPhysique

	stOperationLettre.tabStDocument = ChargeTabStructLtrDocument(stOperationLettre.IdLettre,stOperationLettre.IdPackage,stOperationLettre.IdCampagne)

fin
```


---
## 9. PROCEDURE REECRITE : ChargeTabStructLtrDocument() — bloc rechargement
---

Seul le bloc `si pIdOperation > 0` (à l'intérieur de la boucle) change.
Le SQL et tout le reste de la procédure ne changent pas.
Voici le bloc qui remplace les lignes 1836-1857 :

```
	si pIdOperation > 0 alors
		stDocument.QuantiteDocumentClient			= sdReqChargeTabDocument.QuantiteDocumentClient
		stDocument.EstPdfClient							= sdReqChargeTabDocument.EstPdfClient
		stDocument.IdLettreContenu						= sdReqChargeTabDocument.IdLettreContenu
		stDocument.CodeTemp								= sdReqChargeTabDocument.IdLettreContenu
		stDocument.EstDocumentEnAttente				= sdReqChargeTabDocument.EstDocumentEnAttente
		stDocument.NomFichierOrigine					= sdReqChargeTabDocument.NomFichierOrigine

		// ─── AJOUT : Renseigner le répertoire du document ────────────────────
		stDocument.Repertoire							= cpProjet.CheminFichier(sdReqChargeTabDocument.IdLettre, __REP_DOCUMENT__, Vrai)
		stDocument.NomFichierTemp						= __DOC_LTR__ + sdReqChargeTabDocument.IdLettreContenu + __PDF__

		ChargeDocument(stDocument,sdReqChargeTabDocument.IdLettre)

	sinon
		stDocument.EstPdfClient							= (sdReqChargeTabDocument.IdModele = 0 _et_ sdReqChargeTabDocument.IdDocumentClient = 0)
		stDocument.EstDocumentEnAttente				= Vrai

		si sdReqChargeTabDocument.IdModele > 0 _ou_ sdReqChargeTabDocument.IdDocumentClient > 0 alors

			ChargeDocument(stDocument,sdReqChargeTabDocument.IdLettre)

		fin

	fin
```

Note : si `ChargeDocument` remplit déjà `Repertoire` et `NomFichierTemp`, les lignes ajoutées sont redondantes mais sans effet négatif. Si `ChargeDocument` ne les remplit PAS, ces lignes sont indispensables.


---
## 10. PROCEDURE REECRITE : DéplaceFichierUpload() — bloc __OPERATION_COURRIER__
---

Seules deux modifications dans le bloc courrier :
- A. Ajout de la mise à jour du RepertoireTravail de l'enveloppe après déplacement du BAT
- B. Ajout de la mise à jour de stDocument.Repertoire après déplacement des fichiers d'un document

Voici le bloc courrier complet réécrit :

```
	cas __OPERATION_COURRIER__

		// On sauvegarde le bat Enveloppe
		si stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique <> "" alors
			fDéplaceFichier(stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique, sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__)
			// ─── AJOUT A : Mise à jour du BAT et du répertoire de travail enveloppe ─
			stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique	= sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__
			stOperation.stOperationLettre.stEnveloppe.RepertoireTravail				= sRepertoireBat
		fin

		sListeBat += [" "] + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__

		pour tout stDocument de stOperation.stOperationLettre.tabStDocument
			// On mémorise la liste des documents de l'opération
			si stDocument.IdModele > 0 _ou_ stDocument.IdDocumentClient > 0 _ou_ stDocument.NomFichierOrigine <> "" alors
				sListeDocument += [" "] + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				pour NumPage = 1 _à_ stDocument.NombrePage
					sListeBat += [" "] + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__
					sListeFond += [" "] + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__
				fin
			fin

			si stDocument.EstUploadé = Vrai alors
				selon Vrai
					cas stDocument.IdModele > 0
						si ltr_modele.LitRecherchePremier(IdModele, stDocument.IdModele) alors
							selon Vrai
								cas ltr_modele.IdClient > 0
									sRepertoireClient = CheminClient(ltr_modele.IdClient, __OPERATION_COURRIER__, __REP_MODELE__, Vrai)
									si fFichierExiste(sRepertoireClient + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__) alors
										si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
											fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
										fin
										fCopieFichier(sRepertoireClient + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								cas ltr_modele.IdMarque > 0
									sRepertoireMarque = CheminMarque(ltr_modele.IdMarque, __OPERATION_COURRIER__, __REP_MODELE__, Vrai)
									si fFichierExiste(sRepertoireMarque + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__) alors
										si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
											fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
										fin
										fCopieFichier(sRepertoireMarque + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								autre cas : STOP
							fin

							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageBat..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageFond..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageFond[NumPage].CheminPhysique, sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

						fin

					cas stDocument.IdDocumentClient > 0
						si ltr_document_client.LitRecherchePremier(IdDocumentClient, stDocument.IdDocumentClient) alors
							selon Vrai
								cas ltr_document_client.IdClient > 0
									sRepertoireClient = CheminClient(ltr_document_client.IdClient, __OPERATION_COURRIER__, __REP_DOCUMENT__, Vrai)
									si fFichierExiste(sRepertoireClient + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__) alors
										si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
											fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
										fin
										fCopieFichier(sRepertoireClient + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								cas ltr_document_client.IdMarque > 0
									sRepertoireMarque = CheminMarque(ltr_document_client.IdMarque, __OPERATION_COURRIER__, __REP_DOCUMENT__, Vrai)
									si fFichierExiste(sRepertoireMarque + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__) alors
										si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
											fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
										fin
										fCopieFichier(sRepertoireMarque + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								autre cas : STOP
							fin

							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageBat..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageFond..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageFond[NumPage].CheminPhysique, sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

						fin

					autre cas
						// On déplace les documents PDF client
						si fFichierExiste(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __DOC_LTR__ + stDocument.CodeTemp + __PDF__) alors
							si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
								si pas fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
									Trace("Erreur supprimer Document", ErreurInfo(errComplet))
								fin
							fin
							si pas fDéplaceFichier(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __DOC_LTR__ + stDocument.CodeTemp + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
								Trace("Erreur déplace Document", ErreurInfo(errComplet))
							fin
						fin

						pour NumPage = 1 _à_ stDocument.NombrePage
							si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
								si pas fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									Trace("Erreur supprimer BAT", ErreurInfo(errComplet))
								fin
							fin
							si stDocument.tabImageBat..Occurrence >= NumPage alors
								si pas fDéplaceFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									Trace("Erreur déplace BAT", ErreurInfo(errComplet))
								fin
							fin
						fin

						pour NumPage = 1 _à_ stDocument.NombrePage
							si fFichierExiste(sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
								si pas fSupprime(sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									Trace("Erreur supprimer Fond", ErreurInfo(errComplet))
								fin
							fin
							si stDocument.tabImageFond..Occurrence >= NumPage alors
								si pas fDéplaceFichier(stDocument.tabImageFond[NumPage].CheminPhysique, sRepertoireFond + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									Trace("Erreur déplace Fond", ErreurInfo(errComplet))
								fin
							fin
						fin

				fin

				// ─── AJOUT B : Mise à jour du répertoire et du CodeTemp après déplacement ─
				stDocument.Repertoire		= sRepertoireDocument
				stDocument.CodeTemp			= stDocument.IdLettreContenu
				stDocument.NomFichierTemp	= __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				stDocument.EstUploadé		= Faux
			fin
		fin

		SupprimeFichiersInutiles(stOperation.TypeOperation)
```

Note : j'ai déplacé `stDocument.EstUploadé = Faux` à l'intérieur du bloc AJOUT B pour le regrouper avec les autres mises à jour de la structure. Le fonctionnel reste identique.


---
## 11. INITIALISATION du RepertoireTravail enveloppe en CREATION
---

Dans la procédure d'initialisation de la page `pgeLtrContenu`, après le `Init()` ou dans `InitEnveloppe()`, 
ajouter si l'opération est en création (pas de rechargement) :

```
si _nIdOperation = 0 alors
	__stOperation.stOperationLettre.stEnveloppe.RepertoireTravail = cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
fin
```

En modification, c'est `ChargeStructOperationLettre` (section 8 ci-dessus) qui le remplit.


---
## RESUME DES MODIFICATIONS
---

| # | Quoi | Type |
|---|------|------|
| 1 | StructEnveloppe : ajout `RepertoireTravail` | Structure |
| 2 | onload : gsXm1Psmd → gsXmlPsmd | Typo |
| 3 | GenererPsmdServeurDocument | Procédure réécrite |
| 4 | GenererBatDocumentDepuisPsmd | Procédure réécrite |
| 5 | GenererPsmdServeurEnveloppe | Procédure réécrite |
| 6 | GenererBatEnveloppeDepuisPsmd | Procédure réécrite |
| 7 | GenereVignetteDocument | Procédure réécrite (2 paramètres optionnels) |
| 8 | ChargeStructOperationLettre | fFichierExiste corrigé + RepertoireTravail |
| 9 | ChargeTabStructLtrDocument | Ajout Repertoire + NomFichierTemp |
| 10 | DéplaceFichierUpload | Mise à jour Repertoire/CodeTemp après déplacement |
| 11 | InitEnveloppe / pgeLtrContenu | Initialisation RepertoireTravail en création |
| 12 | ModificationCheminDesignerJson | Procédure interne réécrite (voir section 12) |


---
## 12. PROCEDURE INTERNE REECRITE : ModificationCheminDesignerJson() [V3]
---

Cette procédure interne se trouve dans AjoutModificationOperationCourrier().
Elle met à jour les chemins (cheminFond, urlFond) dans le JsonDesignerData
pour qu'ils pointent vers les répertoires définitifs de l'opération (ROP)
au lieu des répertoires d'upload.

IMPORTANT : Cette procédure ne doit PAS modifier stDocument.Repertoire
ni stDocument.NomFichierTemp car ces champs sont utilisés ensuite
par DéplaceFichierUpload() qui a besoin des chemins d'ORIGINE.
On utilise des variables locales à la place.

IMPORTANT : JsonDesignerData contient le bloc "data" directement (sans le wrapper
action/success/data de structDesignerExport). On utilise le type JSON natif
pour manipuler le JSON sans perte de données.

```
	procédure interne ModificationCheminDesignerJson(pIdOperation)

		sRepertoireFinalDocument	est une chaîne
		sNomFichierFinalPdf			est une chaîne
		sFondRepertoireRelatif		est une chaîne
		jDoc						est un JSON

		// ─── Garde : pas de JSON → rien à faire ─────────────────────────────
		si stDocument.JsonDesignerData = "" alors
			renvoyer Faux
		fin

		jDoc = ChaîneVersUTF8(stDocument.JsonDesignerData)

		// ─── [V3] Normalisation du format JSON ──────────────────────────────
		// ComposerJsonDesignerCreation produit le format complet (structDesignerLoad) :
		//   { "action":"load", "data":{ "pages":[...] }, "auth":{...}, ... }
		// Le Designer exporte seulement la partie data :
		//   { "pages":[...], "zonesTexte":[...], ... }
		// Si pages est absent à la racine mais présent sous data,
		// on normalise en extrayant la partie data.
		si jDoc.pages..Occurrence = 0 _et_ jDoc.data.pages..Occurrence > 0 alors
			Trace("ModificationCheminDesignerJson : normalisation format structDesignerLoad → data")
			stDocument.JsonDesignerData = JSONVersChaîne(jDoc.data)
			jDoc = ChaîneVersUTF8(stDocument.JsonDesignerData)
		fin

		// ─── Garde : pas de pages dans le JSON → rien à faire ────────────────
		si jDoc.pages..Occurrence = 0 alors
			renvoyer Faux
		fin

		selon Vrai

			// =========================================================================
			// CAS 1 : Dotation / Document client
			// =========================================================================
			cas stDocument.IdDocumentClient > 0
				si ltr_document_client.LitRecherchePremier(IdDocumentClient, stDocument.IdDocumentClient) alors
					sNomFichierFinalPdf = __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__

					selon Vrai
						cas ltr_document_client.IdMarque > 0
							sRepertoireFinalDocument	= CheminMarque(ltr_document_client.IdMarque, __OPERATION_COURRIER__, __REP_DOCUMENT__)
							sFondRepertoireRelatif		= cpProjet.CheminMarque(ltr_document_client.IdMarque, __OPERATION_COURRIER__, __REP_FOND__, Faux)

						cas ltr_document_client.IdClient > 0
							sRepertoireFinalDocument	= CheminClient(ltr_document_client.IdClient, __OPERATION_COURRIER__, __REP_DOCUMENT__)
							sFondRepertoireRelatif		= cpProjet.CheminClient(ltr_document_client.IdClient, __OPERATION_COURRIER__, __REP_FOND__, Faux)

						autre cas
							renvoyer Faux
					fin
				sinon
					renvoyer Faux
				fin

			// =========================================================================
			// CAS 2 : Modèle
			// =========================================================================
			cas stDocument.IdModele > 0
				si ltr_modele.LitRecherchePremier(IdModele, stDocument.IdModele) alors

					selon Vrai
						cas ltr_modele.IdMarque > 0
							sRepertoireFinalDocument	= CheminMarque(ltr_modele.IdMarque, __OPERATION_COURRIER__, __REP_MODELE__)
							sFondRepertoireRelatif		= cpProjet.CheminMarque(ltr_modele.IdMarque, __OPERATION_COURRIER__, __REP_FOND__, Faux)

						cas ltr_modele.IdClient > 0
							sRepertoireFinalDocument	= CheminClient(ltr_modele.IdClient, __OPERATION_COURRIER__, __REP_MODELE__)
							sFondRepertoireRelatif		= cpProjet.CheminClient(ltr_modele.IdClient, __OPERATION_COURRIER__, __REP_FOND__, Faux)

						autre cas
							renvoyer Faux
					fin

					sNomFichierFinalPdf = __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__

					si stDocument.EstDocumentEnAttente = Faux alors
						sFondRepertoireRelatif = cpProjet.CheminFichier(pIdOperation, __REP_FOND__, Faux)
					fin
				sinon
					renvoyer Faux
				fin

			// =========================================================================
			// CAS 3 : PDF client
			// =========================================================================
			cas pIdOperation > 0
				sNomFichierFinalPdf			= __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				sRepertoireFinalDocument	= CheminFichier(pIdOperation, __REP_DOCUMENT__)
				sFondRepertoireRelatif		= cpProjet.CheminFichier(pIdOperation, __REP_FOND__, Faux)

			autre cas
				renvoyer Faux

		fin

		// ─── Mise à jour des chemins fond dans le JSON ─────────────────────
		pour nNumPage = 1 _à_ stDocument.NombrePage
			si nNumPage <= jDoc.pages..Occurrence alors
				jDoc.pages[nNumPage].cheminFond		= sRepertoireFinalDocument + sNomFichierFinalPdf
				jDoc.pages[nNumPage].urlFond			= sFondRepertoireRelatif + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + nNumPage + __JPG__
			fin
		fin

		// ─── [V2] Mise à jour des chemins images Designer ───────────────────
		// Les images sont dans Upload à ce stade. Elles seront déplacées par
		// DéplaceFichierUpload APRÈS la sauvegarde en BDD. On met à jour les
		// chemins dans le JSON AVANT la sauvegarde pour que la BDD contienne
		// les chemins définitifs (Printshop).
		si jDoc.zonesImage..Occurrence > 0 alors

			sRepertoirePrintshopFinal est une chaîne = cpProjet.CheminFichier(pIdOperation, __REP_PRINTSHOP__, Vrai)
			sRepertoirePrintshopRelatif est une chaîne = cpProjet.CheminFichier(pIdOperation, __REP_PRINTSHOP__, Faux)

			pour nIndZone = 1 _à_ jDoc.zonesImage..Occurrence

				sAncienChemin est une chaîne = jDoc.zonesImage[nIndZone].source.nomFichier

				si sAncienChemin = "" alors
					continuer
				fin

				// Si déjà dans Printshop, ne pas toucher
				si Gauche(sAncienChemin, Taille(sRepertoirePrintshopFinal)) = sRepertoirePrintshopFinal alors
					continuer
				fin

				sNomFichierImage est une chaîne = fExtraitChemin(sAncienChemin, fFichier + fExtension)

				// Nouveau chemin physique (sera effectif après DéplaceFichierUpload)
				jDoc.zonesImage[nIndZone].source.nomFichier = sRepertoirePrintshopFinal + sNomFichierImage

				// Nouvelle URL web
				sUrlImage est une chaîne = sRepertoirePrintshopRelatif + sNomFichierImage
				sUrlImage = Remplace(sUrlImage, "\", "/")
				jDoc.zonesImage[nIndZone].source.valeur = sUrlImage

				Trace("ModificationCheminDesignerJson : image " + sNomFichierImage + " → " + sUrlImage)

			fin

		fin

		stDocument.JsonDesignerData = JSONVersChaîne(jDoc)

		renvoyer Vrai

	fin
```

### Différences avec l'ancienne version :

1. Variables locales `sRepertoireFinalDocument` et `sNomFichierFinalPdf` au lieu de modifier `stDocument.Repertoire` et `stDocument.NomFichierTemp`
2. Garde en entrée : si `JsonDesignerData` est vide → renvoyer Faux
3. Garde après désérialisation : si `pages..Occurrence = 0` → renvoyer Faux
4. Garde dans la boucle : `si nNumPage <= stDesignerExport.data.pages..Occurrence`
5. `autre cas` ajouté dans chaque `selon Vrai` → renvoyer Faux proprement
6. Les membres `stDocument.Repertoire` et `stDocument.NomFichierTemp` ne sont PLUS modifiés


---
## 13. RÉPERTOIRE TEMPORAIRE __REP_TEMP__ [V4]
---

### Principe

En modification, les fichiers générés par le Designer (PSMD, BAT, images extraites)
étaient écrits dans le répertoire `Documents/` de l'opération, mélangés avec les PDF.
On introduit un répertoire temporaire dédié `Temp/` dans le dossier de l'opération.

- **Création** : les fichiers continuent d'aller dans `Upload/` (pas de changement)
- **Modification** : les fichiers vont dans `...\AAAAT\Temp\` puis sont déplacés
  vers leurs répertoires définitifs par `DéplaceFichierUpload`

### 13.1 — Constante

Ajouter la constante `__REP_TEMP__` à côté des autres constantes `__REP_*` :

```
__REP_TEMP__			= "Temp\"
```

### 13.2 — Ajout de RepertoireTravail dans structDocument

Ajouter un nouveau membre dans `structDocument` :

```
RepertoireTravail		est une chaîne
```

Ce champ sépare le répertoire des fichiers **générés** (PSMD, BAT, images) du
répertoire du **document PDF** (`Repertoire`).

### 13.3 — Initialisation en CREATION

Dans la procédure d'initialisation de `pgeLtrContenu` ou dans `UploadFichier`,
quand un nouveau document est ajouté, initialiser :

```
stDocument.RepertoireTravail = cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
```

En création, `RepertoireTravail` = `Repertoire` = `Upload/`.

### 13.4 — Initialisation en MODIFICATION : ChargeTabStructLtrDocument (section 9)

Remplacer dans le bloc `si pIdOperation > 0` :

AVANT :
```
		// ─── AJOUT : Renseigner le répertoire du document ────────────────────
		stDocument.Repertoire							= cpProjet.CheminFichier(sdReqChargeTabDocument.IdLettre, __REP_DOCUMENT__, Vrai)
		stDocument.NomFichierTemp						= __DOC_LTR__ + sdReqChargeTabDocument.IdLettreContenu + __PDF__
```

APRES :
```
		// ─── Répertoire du document (PDF) ────────────────────────────────────
		stDocument.Repertoire							= cpProjet.CheminFichier(sdReqChargeTabDocument.IdLettre, __REP_DOCUMENT__, Vrai)
		stDocument.NomFichierTemp						= __DOC_LTR__ + sdReqChargeTabDocument.IdLettreContenu + __PDF__

		// ─── [V4] Répertoire de travail temporaire (PSMD, BAT, images) ──────
		stDocument.RepertoireTravail					= cpProjet.CheminFichier(sdReqChargeTabDocument.IdLettre, __REP_TEMP__, Vrai)
```

### 13.5 — Initialisation en MODIFICATION : ChargeStructOperationLettre (section 8)

Pour l'enveloppe, remplacer :

AVANT :
```
	// ─── AJOUT : Renseigner le répertoire de travail de l'enveloppe ──────────
	stOperationLettre.stEnveloppe.RepertoireTravail = sBatCheminPhysique
```

APRES :
```
	// ─── [V4] Répertoire de travail temporaire pour l'enveloppe ─────────────
	stOperationLettre.stEnveloppe.RepertoireTravail = cpProjet.CheminFichier(sdReqOpeLettre.IdLettre, __REP_TEMP__, Vrai)
```

### 13.6 — GenererPsmdServeurDocument (section 3)

Remplacer :

AVANT :
```
sRepTravail			= stDocument.Repertoire
```

APRES :
```
sRepTravail			= stDocument.RepertoireTravail

// Créer le répertoire s'il n'existe pas (cas Temp en modification)
si pas fRepExiste(sRepTravail) alors
	fRepCrée(sRepTravail)
fin
```

### 13.7 — GenererBatDocumentDepuisPsmd (section 4)

Remplacer :

AVANT :
```
sRepTravail					est une chaîne			= stDocument.Repertoire
```

APRES :
```
sRepTravail					est une chaîne			= stDocument.RepertoireTravail
```

### 13.8 — GenererPsmdServeurEnveloppe (section 5)

Ajouter la création du répertoire après `sRepTravail = stEnveloppe.RepertoireTravail` :

AVANT :
```
sRepTravail			= stEnveloppe.RepertoireTravail
sNomFichierPsmd	= __DOC_ENV_PSMD__ + pCodeTemp + ".psmd"
```

APRES :
```
sRepTravail			= stEnveloppe.RepertoireTravail

// [V4] Créer le répertoire s'il n'existe pas (cas Temp en modification)
si pas fRepExiste(sRepTravail) alors
	fRepCrée(sRepTravail)
fin

sNomFichierPsmd	= __DOC_ENV_PSMD__ + pCodeTemp + ".psmd"
```

### 13.9 — DéplaceFichierUpload (bloc document dans Corrections Images Designer.md)

Remplacer :

AVANT :
```
			// [V3] Mémoriser le répertoire source AVANT qu'il soit mis à jour par AJOUT B
			sRepertoireSourceDocument est une chaîne = stDocument.Repertoire
```

APRES :
```
			// [V4] Répertoire source = RepertoireTravail (Temp en modification, Upload en création)
			sRepertoireSourceDocument est une chaîne = stDocument.RepertoireTravail
```

### 13.10 — DéplaceFichierUpload : AJOUT B (mise à jour après déplacement)

Remplacer :

AVANT :
```
				// ─── AJOUT B : Mise à jour du répertoire et du CodeTemp après déplacement ─
				stDocument.Repertoire		= sRepertoireDocument
				stDocument.CodeTemp			= stDocument.IdLettreContenu
				stDocument.NomFichierTemp	= __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				stDocument.EstUploadé		= Faux
```

APRES :
```
				// ─── AJOUT B : Mise à jour du répertoire et du CodeTemp après déplacement ─
				stDocument.Repertoire		= sRepertoireDocument
				stDocument.RepertoireTravail	= sRepertoireDocument
				stDocument.CodeTemp			= stDocument.IdLettreContenu
				stDocument.NomFichierTemp	= __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				stDocument.EstUploadé		= Faux
```

### 13.11 — DéplaceFichierUpload : Nettoyage du répertoire Temp

À la fin du bloc `cas __OPERATION_COURRIER__`, après `SupprimeFichiersInutiles`,
ajouter le nettoyage du répertoire Temp :

```
		// [V4] Nettoyage du répertoire temporaire
		sRepertoireTemp est une chaîne = cpProjet.CheminFichier(stOperation.IdOperation, __REP_TEMP__)
		si fRepExiste(sRepertoireTemp) alors
			fRepSupprime(sRepertoireTemp, frRécursif)
			Trace("DéplaceFichierUpload [V4] : répertoire Temp supprimé → " + sRepertoireTemp)
		fin
```


---
## RESUME DES MODIFICATIONS V4
---

| # | Quoi | Type | Section |
|---|------|------|---------|
| 1 | `__REP_TEMP__ = "Temp\"` | Constante | 13.1 |
| 2 | `structDocument.RepertoireTravail` | Structure | 13.2 |
| 3 | Init création : `RepertoireTravail = Upload` | pgeLtrContenu | 13.3 |
| 4 | Init modification document : `RepertoireTravail = Temp` | ChargeTabStructLtrDocument | 13.4 |
| 5 | Init modification enveloppe : `RepertoireTravail = Temp` | ChargeStructOperationLettre | 13.5 |
| 6 | GenererPsmdServeurDocument : `sRepTravail = RepertoireTravail` + fRepCrée | Procédure | 13.6 |
| 7 | GenererBatDocumentDepuisPsmd : `sRepTravail = RepertoireTravail` | Procédure | 13.7 |
| 8 | GenererPsmdServeurEnveloppe : ajout fRepCrée | Procédure | 13.8 |
| 9 | DéplaceFichierUpload : source = `RepertoireTravail` | Procédure | 13.9 |
| 10 | DéplaceFichierUpload : AJOUT B met à jour `RepertoireTravail` | Procédure | 13.10 |
| 11 | DéplaceFichierUpload : suppression répertoire Temp | Procédure | 13.11 |
