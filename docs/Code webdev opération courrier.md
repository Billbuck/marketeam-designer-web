**** Code de l'ouverture de la page pgeLtrContenu 

**** Déclarations globales de pgeLltrContenu (serveur) : 

procédure pgeLtrContenu(_pIdOperation = 0)

_nIdOperation = _pIdOperation

// _stDocument			est une StructDocument
_mPoidsEnveloppe		est un monétaire
_sSourcePrintshop		est une chaîne
_sValeurPrecedente	est une chaîne
_nIndDesignerEnCours	est un entier 		// 0 = Enveloppe, 1 = Document 1, etc


_tabEnveloppeClient				est un tableau de structEnveloppeClient

Tunnel.__taaPageVisitée[PageCourante] = Vrai

gsJsonRecu					est une chaîne	<synchronisé navigateur>
gsJsonDesigner 			est une chaîne	<synchronisé navigateur>
gsJsonDocument				est une chaîne	<synchronisé navigateur>
gsXmlPsmd					est une chaîne	<synchronisé navigateur>

libModeleTitrePage	= "Contenu de votre enveloppe"

IFRM_Designer		= "/" + RépertoireWeb() + "/Designer/index.html"


**** Fin d'initialisation de pgeLtrContenu (serveur) :

sPsmdGeneratonJS est une chaîne = UTF8VersChaîne(fChargeTexte(fRepWeb() + "/Designer/psmd-generator.js"))

MaPage..HTMLEntête += RC + "<script type=""text/javascript"">" + RC + sPsmdGeneratonJS + RC + "</script>"

Init()

**** Chargement de pgeLtrContenu (onload navigateur) :

gsJsonRecu = gsJsonRecu
gsJsonDocument = gsJsonDocument
gsXmlPsmd = gsXm1Psmd

// Activation écoute messages Designer
EcouterMessagesIframe("gsJsonRecu", BTN_TraiterMessage.Alias)

// Lance un timer toutes les 9 minutes
Timer(NavKeepAlive, 9 min)


**** Code de la procédure Init() :

procédure Init()

celLtrConteneur.Plan = 1

InitEnveloppe()
InitZnrContenu()

**** Code de la procédure InitEnveloppe() : 

procédure InitEnveloppe()

InitTboEnveloppeClient()

intAdressageExpediteur	= __stOperation.stOperationLettre.stEnveloppe.EstAdressageExpediteur
intAdressageLogo 			= __stOperation.stOperationLettre.stEnveloppe.EstAdressageLogo
intAdressagePromotion	= __stOperation.stOperationLettre.stEnveloppe.EstAdressagePromotion

si HLitRecherchePremier(ltr_enveloppe,IdEnveloppe,__stOperation.stOperationLettre.IdEnveloppe) alors
	imgEnveloppe..Image		= "ext/Enveloppes/ltr-" + ltr_enveloppe.FichierApercu + "-out" + __SVG__
	libEnveloppeDesignation	= "Adressage enveloppe " + ltr_enveloppe.Libelle
fin

SelectionAdressage()

**** Code de la Procédure InitZnrContenu() :

procédure InitZnrContenu()


nInd					est un entier
stDocument				est une structDocument
sFiltre					est une chaîne
sBibliothèque			est une chaîne
nIdMarque				est un entier

znrLtrContenu.SupprimeTout()



pour tout stDocument de  __stOperation.stOperationLettre.tabStDocument

	nInd 			= znrLtrContenu.AjouteLigne()

	znrLtrContenu[nInd].attNumDocument = nInd

	// Initialisation de la bibliothèque
	cboTemp.SupprimeTout()
	sFiltre = "AND ltr_modele.IdSupport = " + stDocument.IdSupport +RC+ "AND ltr_modele.EstRectoVerso = " + stDocument.EstRectoVerso +RC+ "AND ltr_modele.EstFondPerdu = " + stDocument.EstFondPerdu
	si nInd = 1 _et_ __stOperation.stOperationLettre.stEnveloppe.NbrFenetre > 0 alors
		sFiltre += RC + "AND ltr_modele.EstPorteAdresse = 1"
	fin
	Partage.InitCboBibliothèque(cboTemp, ltr_modele..Nom, ltr_modele.IdModele..Nom, stDocument.IdModele, Vrai, Faux, sFiltre, __stOperation.IdClient)

	znrLtrContenu[nInd].attCboBibliothèqueContenu	= cboTemp..Contenu
	pour I = 1 _à_ cboTemp.Occurrence
		znrLtrContenu[nInd].attCboBibliothèqueGlien += [TAB] + cboTemp[I].ValeurMémorisée
	fin

	znrLtrContenu[nInd].attCboBibliothèqueValeur = cboTemp.ValeurMémorisée

	BibliothèqueValeurMemorisée(cboTemp, sBibliothèque, nIdMarque)
	InitCboTypeContenu(sBibliothèque, nIdMarque, stDocument.IdSupport, stDocument.EstRectoVerso, stDocument.EstFondPerdu, stDocument.IdSupportGrammage, nInd)

	znrLtrContenu[nInd].libSupportDesignation			= stDocument.Designation 	// stDocument.LibelleTypeSupport + " " + stDocument.LibelleSupport
	znrLtrContenu[nInd].attModeImpression				= stDocument.ModeImpression // On mémorise le mode d'impression précédent en cas de passage d'un mode doc fourni a un doc non fourni


	selon Vrai
		// Il s’agit d'un modèle

		cas stDocument.IdModele > 0
			znrLtrContenu[nInd].attCboSourceValeur 							= cboIdPosition(znrLtrContenu[nInd].attCboSouceGlien,"M")
			znrLtrContenu[nInd].attCboSelectionContenu							= znrLtrContenu[nInd].attCboModeleContenu
			znrLtrContenu[nInd].attCboSelectionValeur							= cboIdPosition(znrLtrContenu[nInd].attCboModeleGlien,stDocument.IdModele)
			znrLtrContenu[nInd].btnDocumentImporter..Visible 					= Faux
			znrLtrContenu[nInd].btnDocumentPersonnaliser..Visible				= (stDocument.EstPersonnalisable = Vrai)
			znrLtrContenu[nInd].btnDocumentAperçu..Visible						= Vrai
			znrLtrContenu[nInd].btnDocumentSupprimer..Visible					= Faux
			znrLtrContenu[nInd].attCboSourceEtat								= (__stOperation.stOperationLettre.IdCampagne = 0) ? Actif sinon Inactif
			znrLtrContenu[nInd].attCboSelectionEtat								= (__stOperation.stOperationLettre.IdCampagne = 0) ? Actif sinon Inactif
			znrLtrContenu[nInd].dispSupport[1].Visible							= Vrai

			//SelectionModèle(stDocument.IdModele,nInd)

		// Il s’agit d'un document client
		cas stDocument.IdDocumentClient > 0
			znrLtrContenu[nInd].attCboSourceValeur								= cboIdPosition(znrLtrContenu[nInd].attCboSouceGlien,"C")
			znrLtrContenu[nInd].attCboSelectionContenu							= znrLtrContenu[nInd].attCboDocumentContenu
			znrLtrContenu[nInd].attCboSelectionValeur							= cboIdPosition(znrLtrContenu[nInd].attCboDocumentGlien,stDocument.IdDocumentClient)
			znrLtrContenu[nInd].btnDocumentImporter..Visible 					= Faux
			znrLtrContenu[nInd].btnDocumentPersonnaliser..Visible				= Faux
			znrLtrContenu[nInd].btnDocumentAperçu..Visible						= Vrai
			znrLtrContenu[nInd].btnDocumentSupprimer..Visible					= Faux
			znrLtrContenu[nInd].attCboSourceEtat								= (__stOperation.stOperationLettre.IdCampagne = 0) ? Actif sinon Inactif
			znrLtrContenu[nInd].attCboSelectionEtat								= (__stOperation.stOperationLettre.IdCampagne = 0) ? Actif sinon Inactif
			znrLtrContenu[nInd].dispSupport[1].Visible							= Faux

		autre cas
			znrLtrContenu[nInd].attCboSourceValeur								= cboIdPosition(znrLtrContenu[nInd].attCboSouceGlien,"F")
			znrLtrContenu[nInd].attCboSelectionContenu							= stDocument.NomFichierOrigine
			znrLtrContenu[nInd].attCboSelectionValeur							= 1
			znrLtrContenu[nInd].btnDocumentImporter..Visible 					= Vrai
			znrLtrContenu[nInd].btnDocumentPersonnaliser..Visible				= (stDocument.EstDocumentEnAttente = Faux _et_ stDocument.JsonDesignerData <> "")
			znrLtrContenu[nInd].btnDocumentAperçu..Visible						= (stDocument.EstDocumentEnAttente = Faux)
			znrLtrContenu[nInd].btnDocumentSupprimer..Visible					= (stDocument.EstDocumentEnAttente = Faux)
			znrLtrContenu[nInd].attCboSourceEtat								= Actif
			znrLtrContenu[nInd].attCboSelectionEtat								= Actif
			znrLtrContenu[nInd].dispSupport[1].Visible							= Faux

	fin

	znrLtrContenu[nInd].attImage	= "ext/Supports/ltr-" + stDocument.FichierApercu  + "-out" + __SVG__

fin


**** Code de la procédure d'Upload d'un fichier PDF :

procédure UploadFichier()

// A FAIRE : SI gIdDemandeSmartSms > 0 ALORS gbAuMoinsUnChangementDeFichierEnModification = Vrai
nInd			est un entier
sBat			est une chaîne
sFond			est une chaîne
sFichier		est une chaîne
sMessage		est une chaîne

nInd																	= znrLtrContenu

__stOperation.stOperationLettre.NumeroDocumentEnCours	= nInd

SupprimeTout(__stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF)
SupprimeTout(__stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond)
SupprimeTout(__stOperation.stOperationLettre.tabStDocument[nInd].tabImageBat)
__stOperation.stOperationLettre.tabStDocument[nInd].JsonDesignerData = ""


si fFichierExiste(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __stOperation.stOperationLettre.tabStDocument[nInd].NomFichierTemp) alors
	fSupprime(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __stOperation.stOperationLettre.tabStDocument[nInd].NomFichierTemp)
fin

pour I = 1 _à_ __stOperation.stOperationLettre.tabStDocument[nInd].NombrePage
	// Suppression BAT
	si fFichierExiste(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __DOC_LTR_BAT__ + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp + "p" + I + __JPG__) alors
		fSupprime(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __DOC_LTR_BAT__ + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp + "p" + I + __JPG__)
	fin
	// Suppression fond Ghostscript
	si fFichierExiste(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __DOC_LTR_FOND__ + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp + "p" + I + __JPG__) alors
		fSupprime(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __DOC_LTR_FOND__ + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp + "p" + I + __JPG__)
	fin
fin

ZoneRépétéeSupprimeTout(popUploadFichierDocument.znrAperçuUpload)

sFichier = UploadCopieFichier(uplDocumentUpload, cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"], "")

si sFichier <> "" _et_ Minuscule(fExtraitChemin(sFichier, fExtension)) = __PDF__ alors

	__stOperation.stOperationLettre.tabStDocument[nInd].EstUploadé					= Vrai
	__stOperation.stOperationLettre.tabStDocument[nInd].EstDocumentEnAttente	= Faux
	__stOperation.stOperationLettre.tabStDocument[nInd].EstPdfClient				= Vrai
	__stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp					= Partage.__vcUser.IDContact + "-" + DateHeureSys()
	__stOperation.stOperationLettre.tabStDocument[nInd].NomFichierOrigine		= Majuscule(fExtraitChemin(sFichier, fFichier + fExtension))
	__stOperation.stOperationLettre.tabStDocument[nInd].NomFichierTemp			= __DOC_LTR__ + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp + __PDF__
	__stOperation.stOperationLettre.tabStDocument[nInd].Repertoire					= cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"]


	sFond																								= __DOC_LTR_FOND__ + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp
	sBat																								= __DOC_LTR_BAT__  + __stOperation.stOperationLettre.tabStDocument[nInd].CodeTemp

	si fRenomme(cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + sFichier, cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"] + __stOperation.stOperationLettre.tabStDocument[nInd].NomFichierTemp) alors

		// ─────────────────────────────────────────────────────────
		// Phase 1 — Analyse PDF
		// ─────────────────────────────────────────────────────────
		sMessage = Partage.PdfAnalyseDocument(__stOperation.stOperationLettre.tabStDocument[nInd])

		si sMessage = "" alors

			// ─────────────────────────────────────────────────────────
			// Phase 1bis — Normalisation BleedBox si fond perdu
			// Recadre le PDF à sa BleedBox si MediaBox ≠ BleedBox
			// (PDF avec traits de coupe ou marges extérieures)
			// ─────────────────────────────────────────────────────────
			si __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1].EstFondPerdu alors

				stPage est une structPagePdf = __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1]

				Trace("MediaBox X, Y", stPage.MediaBoxXMm, stPage.MediaBoxYMm)
				Trace("MediaBox Largeur, Hauteur", stPage.MediaBoxLargeurMm, stPage.MediaBoxHauteurMm)

				Trace("BleedBox X, Y", stPage.BleedBoxXMm, stPage.BleedBoxYMm)
				Trace("BleedBox Largeur, Hauteur", stPage.BleedBoxLargeurMm, stPage.BleedBoxHauteurMm)

				Trace("TrimBox X, Y", stPage.TrimBoxXMm, stPage.TrimBoxYMm)
				Trace("TrimBox Largeur, Hauteur", stPage.TrimBoxLargeurMm, stPage.TrimBoxHauteurMm)



				si stPage.MediaBoxLargeurMm <> stPage.BleedBoxLargeurMm _ou_
					stPage.MediaBoxHauteurMm <> stPage.BleedBoxHauteurMm alors

					sUrlNormalize	est une chaîne	= "http://localhost:5000/PyMuPdfExtract/normalize_bleedbox?file=" + URLEncode(__stOperation.stOperationLettre.tabStDocument[nInd].Repertoire + __stOperation.stOperationLettre.tabStDocument[nInd].NomFichierTemp)
					hNormalize		est une httpRequête
					hRepNormalize	est un httpRéponse

					hNormalize.URL			= sUrlNormalize
					hNormalize.Méthode	= httpGet
					hRepNormalize			= hNormalize.Envoie()

					si hRepNormalize.CodeEtat = 200 alors
						vNorm est un Variant = JSONVersVariant(hRepNormalize.Contenu)
						si vNorm.success = Vrai alors
							Trace("NormalizeBleedBox : normalized = " + vNorm.normalized)
						sinon
							Trace("NormalizeBleedBox : erreur = " + vNorm.erreur)
						fin
					sinon
						Trace("NormalizeBleedBox : HTTP " + hRepNormalize.CodeEtat)
					fin

				fin

			fin

			// ─────────────────────────────────────────────────────
			// Phase 2 — Conversion JPG fond
			// ─────────────────────────────────────────────────────
			__stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond = Partage.GenereVignetteDocument(__stOperation.stOperationLettre.tabStDocument[nInd].NomFichierTemp, sFond, __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1].EstFondPerdu, __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1].LargeurExterne, __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1].HauteurExterne)
			// ─────────────────────────────────────────────────────
			// Phase 3 — Blanc tournant si pas de fond perdu
			// ─────────────────────────────────────────────────────
			si __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1].EstFondPerdu = Faux alors
				pour tout stVignette de __stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond
					Partage.AppliqueBlancTournant(stVignette.CheminPhysique, __stOperation.stOperationLettre.tabStDocument[nInd].LargeurOuvert, __stOperation.stOperationLettre.tabStDocument[nInd].HauteurOuvert)
				fin
			fin

			si __stOperation.stOperationLettre.EstEnveloppeFenetre = Faux alors
				pour nPage = 1 _à_ __stOperation.stOperationLettre.tabStDocument[nInd].NombrePage
					ZoneRépétéeAjoute(popUploadFichierDocument.znrAperçuUpload)
					si __stOperation.stOperationLettre.tabStDocument[nInd].tabImageBat..Occurrence >= nPage alors
						znrAperçuUpload[nPage].imgUpload = __stOperation.stOperationLettre.tabStDocument[nInd].tabImageBat[nPage].CheminPhysique
					sinon
						znrAperçuUpload[nPage].imgUpload = __stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond[nPage].CheminPhysique
					fin
					znrAperçuUpload[nPage].imgUpload..Visible = Vrai
				fin

				popUploadFichierDocument.btnValiderUpload..Visible			= Vrai
				znrLtrContenu[attNumDocument].attCboSelectionContenu		= __stOperation.stOperationLettre.tabStDocument[nInd].NomFichierOrigine
				znrLtrContenu[attNumDocument].attCboSelectionGlien			= 1
				znrLtrContenu[attNumDocument].attCboSelectionValeur		= ""

			sinon
				si nInd = 1 alors
					__stOperation.stOperationLettre.tabStDocument[nInd].JsonDesignerData = cpDesigner.ComposerJsonDesignerCreation(__stOperation, __tabEchantillonBaseLigne, __OPERATION_COURRIER__, Faux, nInd, -1, -1, -1, 1)
				sinon
					__stOperation.stOperationLettre.tabStDocument[nInd].JsonDesignerData = cpDesigner.ComposerJsonDesignerCreation(__stOperation, __tabEchantillonBaseLigne, __OPERATION_COURRIER__, Faux, nInd, -1, -1, -1, 0)
				fin


				si __stOperation.stOperationLettre.tabStDocument[nInd].JsonDesignerData <> "" alors
					si Partage.GenererPsmdServeurDocument(__stOperation.stOperationLettre.tabStDocument[nInd]) alors
						GenererBatDocumentDepuisPsmd(__stOperation.stOperationLettre.tabStDocument[nInd])
						si __stOperation.stOperationLettre.tabStDocument[nInd].tabPagePDF[1].EstFondPerdu = Faux alors
							pour tout stVignette de __stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond
								Partage.AppliqueBlancTournant(stVignette.CheminPhysique, __stOperation.stOperationLettre.tabStDocument[nInd].LargeurOuvert, __stOperation.stOperationLettre.tabStDocument[nInd].HauteurOuvert)
							fin
						fin
						AfficheVignettePopupUpload()
					sinon
						PopupAfficheMessage(
						"Erreur lors de la génération du document" + RC + "Merci de réitérer l'opération", "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
					fin
				sinon
					PopupAfficheMessage(
					"Erreur lors de la génération du document" + RC + "Merci de réitérer l'opération", "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
				fin
			fin

		sinon
			PopupAfficheMessage(sMessage, "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
		fin

	sinon
		PopupAfficheMessage("Erreur lors du renommage de votre fichier" + RC + "Merci de réitérer l'opération", "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
	fin

sinon
	PopupAfficheMessage("Erreur lors de l'importation de votre fichier" + RC + "Merci de réitérer l'opération", "Erreur", __OPERATION_COURRIER__, __TOAST_ANNULATION__)
fin


	procédure interne AfficheVignettePopupUpload()
		ZoneRépétéeSupprimeTout(popUploadFichierDocument.znrAperçuUpload)
		pour nPage = 1 _à_ __stOperation.stOperationLettre.tabStDocument[nInd].NombrePage

			ZoneRépétéeAjoute(popUploadFichierDocument.znrAperçuUpload)

			si __stOperation.stOperationLettre.tabStDocument[nInd].tabImageBat[nPage].CheminPhysique <> "" alors
				znrAperçuUpload[nPage].imgUpload = __stOperation.stOperationLettre.tabStDocument[nInd].tabImageBat[nPage].CheminPhysique
			sinon
				// Fallback sur le fond JPG si le BAT a échoué
				si __stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond..Occurrence >= nPage alors
					znrAperçuUpload[nPage].imgUpload = __stOperation.stOperationLettre.tabStDocument[nInd].tabImageFond[nPage].CheminPhysique
				fin
			fin

			znrAperçuUpload[nPage].imgUpload..Visible = Vrai
		fin
		
		// ─── Mise à jour UI ───────────────────────────────────────────────────────
		popUploadFichierDocument.btnValiderUpload..Visible						= Vrai
		znrLtrContenu[attNumDocument].attCboSelectionContenu					= __stOperation.stOperationLettre.tabStDocument[nInd].NomFichierOrigine
		znrLtrContenu[attNumDocument].attCboSelectionGlien						= 1
		znrLtrContenu[attNumDocument].attCboSelectionValeur					= ""
		znrLtrContenu[attNumDocument].btnDocumentPersonnaliser.Visible		= Vrai
	fin



**** Code de la procédure GenererPsmdServeurDocument() :

procédure GenererPsmdServeurDocument(stDocument est une structDocument)

sNodeExe				est une chaîne	= INILit("NODE", "CHEMIN", "", NomFichierIni())
sNodeCli				est une chaîne	= INILit("NODE", "CLI", "", NomFichierIni())
sRepUpload			est une chaîne
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

// ─── Construction des chemins ────────────────────────────────────────────
sRepUpload			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sCodeTemp			= stDocument.CodeTemp
sNomFichierPsmd	= __DOC_LTR_PSMD__ + sCodeTemp + ".psmd"
sCheminPsmd			= sRepUpload + sNomFichierPsmd
sCheminJsonTemp	= sRepUpload + "psmd_json_" + sCodeTemp + ".tmp"

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

// ─── Construction et exécution de la commande (même pattern que LanceAppli Ghostscript) ─
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
	// fSupprime(sCheminJsonTemp)
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



**** procédure GenererBatDocumentDepuisPsmd()

procédure GenererBatDocumentDepuisPsmd(stDocument est une structDocument)


sRepUpload					est une chaîne			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sCheminPsmd					est une chaîne			= stDocument.CheminPsmdTemp
tabPrintshopData			est un tableau de stPrintshopData
stPrintshopData			est un stPrintshopData
stImageBat					est une structDocumentImage
sCheminJpg					est une chaîne
nPage							est un entier

// ─── Validation : le PSMD doit exister sur disque ────────────────────────
si sCheminPsmd = "" _ou_ pas fFichierExiste(sCheminPsmd) alors
	Trace("SauvegarderPsmdServeur : PSMD introuvable : " + sCheminPsmd)
	retour
fin

Trace("SauvegarderPsmdServeur : PSMD confirmé : " + sCheminPsmd)

// ─── Construction du tableau de fusion ───────────────────────────────────
// Si échantillon disponible : 1er enregistrement de la base
// Sinon : tabPrintshopData vide → GenerationBatDepuisPsmd utilisera le fallback __vcUser
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

	sCheminJpg	= sRepUpload + __DOC_LTR_BAT__ + stDocument.CodeTemp + "p" + nPage + __JPG__
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



**** Code de la procédure GenerationBatDepuisPsmd()

procédure GenerationBatDepuisPsmd(pCheminPsmd est une chaîne, pCheminJpgSortie est une chaîne, pNumPage est un entier = 1, ptabPrintshopData est un tableau de stPrintshopData = [])

stImageBat			est une structDocumentImage
sServeurPsm			est une chaîne
sUrlPsm				est une chaîne
sJsonData			est une chaîne
hPsm					est une httpRequête
hReponse				est un httpRéponse
bufPrintshop		est un Buffer
imgPrintshop		est une Image

// ── Validation du PSMD ───────────────────────────────────────────────────
si pCheminPsmd = "" ou pas fFichierExiste(pCheminPsmd) alors
	Trace("GenerationBatDepuisPsmd : PSMD introuvable : " + pCheminPsmd)
	renvoyer stImageBat
fin

// ── Sérialisation JSON et appel API PSM PHP en POST ──────────────────────
Sérialise(ptabPrintshopData, sJsonData, psdJSON)
Trace("GenerationBatDepuisPsmd : JSON data = " + sJsonData)

sServeurPsm			= cpFonction.ValeurParametre("PSM_ServeurUrl", prm_parametre.ValChaine..Nom)
sUrlPsm				= "http://" + sServeurPsm + "psm_marketeam_jpg.php?p=" + URLEncode(pCheminPsmd) + "&l=" + pNumPage

Trace("GenerationBatDepuisPsmd : URL = " + sUrlPsm)

hPsm.URL					= sUrlPsm
hPsm.Méthode			= httpPost
hPsm.ContentType		= "application/x-www-form-urlencoded"
hPsm.Contenu			= "data=" + URLEncode(sJsonData)

hReponse					= hPsm.Envoie()

si ErreurDétectée alors
	Trace("GenerationBatDepuisPsmd : échec Envoie : " + ErreurInfo(errComplet))
	renvoyer stImageBat
fin

si hReponse.CodeEtat <> 200 alors
	Trace("GenerationBatDepuisPsmd : code HTTP " + hReponse.CodeEtat + " — " + hReponse.Contenu)
	renvoyer stImageBat
fin

si fFichierExiste(pCheminJpgSortie) alors
	si pas fSupprime(pCheminJpgSortie) alors
		renvoyer stImageBat
	fin
fin


bufPrintshop	= hReponse.Contenu.Décode(encodeBASE64)
imgPrintshop	= bufPrintshop

si imgPrintshop.SauveJPEG(pCheminJpgSortie, 100) alors
	stImageBat.CheminPhysique	= pCheminJpgSortie
	stImageBat.CheminRelatif	= Remplace(pCheminJpgSortie, cpProjet.__sMarketeamRepRacine, cpProjet.__sHttpMarketeam)
sinon
	Trace("GenerationBatDepuisPsmd : échec SauveJPEG : " + pCheminJpgSortie)
fin

renvoyer stImageBat



**** Code de la procédure procédure AppliqueBlancTournant() :

procédure AppliqueBlancTournant(pCheminJpg, pLargeurMm, pHauteurMm, pEpaisseurMm = 5)

sLigneCommande	est une chaîne	= INILit("IMAGEMAGICK", "CHEMIN", "", NomFichierIni())
sCommande		est une chaîne
nBordurePxX	est un entier
nBordurePxY	est un entier
imgJpg		est une Image

si sLigneCommande = "" alors
	renvoyer Faux
fin

si pas fFichierExiste(pCheminJpg) alors
	renvoyer Faux
fin

// Chargement de l'image pour connaître ses dimensions réelles en pixels
imgJpg	= pCheminJpg

// Calcul des bordures en pixels depuis les dimensions réelles du JPG
// Formule : (pixelsDimension × épaisseurMm) / dimensionDocumentMm
// Valeurs X et Y séparées car le ratio pixel/mm peut différer selon l'axe
nBordurePxX	= Arrondi((imgJpg..Largeur * pEpaisseurMm) / pLargeurMm, 0)
nBordurePxY	= Arrondi((imgJpg..Hauteur * pEpaisseurMm) / pHauteurMm, 0)

Trace("AppliqueBlancTournant : " + imgJpg..Largeur + "x" + imgJpg..Hauteur + "px / " + pLargeurMm + "x" + pHauteurMm + "mm -> bordure = " + nBordurePxX + "x" + nBordurePxY + "px")

// shave : supprime les bordures sur chaque bord (contenu perdu)
// border : ajoute des bordures blanches (mêmes dimensions finales)
sCommande = ChaîneConstruit(
[
	"%1" "%2" -shave %3x%4 -bordercolor white -border %3x%4 "%2"
],
sLigneCommande, pCheminJpg, nBordurePxX, nBordurePxY)

si pas LanceAppli(sCommande, exeIconise, exeBloquant) alors
	renvoyer Faux
fin

renvoyer Vrai



**** Code Serveur Ajax du bouton btnDocumentPersonnaliser :

nInd est un entier = znrLtrContenu

gsJsonDesigner						= __stOperation.stOperationLettre.tabStDocument[nInd].JsonDesignerData

// Basculer vers Plan 2 (iframe Designer)
_nIndDesignerEnCours 			= nInd
btnFerme.Visible					= Faux
grpBoutonProgression.Visible	= Faux
btnPrécédent.Visible				= Faux
btnSuivant.Visible				= Faux
grpTunnelNombre.Visible			= Faux
grpTunnelMontantHT.Visible		= Faux
btnAccueil.Etat					= Grisé
celLtrConteneur.Plan				= 2

**** Code Navigateur Retour de traitement Ajax après le clic sur le btnDocumentPersonnaliser :

// Envoyer le JSON au Designer
EnvoyerMessageIframe(gsJsonDesigner)
gsJsonDesigner = ""


**** Code de la fonction EnvoyerMessageIframe() :

function EnvoyerMessageIframe(jsonString) {
    var iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
        // Convertir la chaîne JSON en objet
        var message = JSON.parse(jsonString);
        iframe.contentWindow.postMessage(message, '*');
        console.log('📤 Message envoyé à iframe:', message);
        return true;
    } else {
        console.error('❌ iframe non trouvée');
        return false;
    }
}



**** Code Navigateur du bouton BTN_TraitementMessage :

btnFerme.Visible					= Vrai
grpBoutonProgression.Visible	= Vrai
btnPrécédent.Visible				= Vrai
btnSuivant.Visible				= Vrai
grpTunnelNombre.Visible			= Vrai
grpTunnelMontantHT.Visible		= Vrai
btnAccueil.Etat					= Actif
celLtrConteneur.Plan				= 1

AffichePopupProgression("Traitement en cours",__stOperation.TypeOperation)

AJAXExécuteAsynchrone(ajaxSynchroniseVariablesServeur+ajaxActualiseChamps, ServeurTraiterMessageDesigner, CallbackAsynchrone)

	procédure interne CallbackAsynchrone(vParam1 Variant <utile>, nParam2 entier <utile>)
		popJaugeProgression.Ferme()
	fin
	
	
	
**** Code de la procédure ServeurTraiterMessageDesigner() :

procédure ServeurTraiterMessageDesigner()


sJsonData	est une chaîne


si gsJsonRecu = "" alors renvoyer Faux

vMessage est un Variant = JSONVersVariant(gsJsonRecu)

si vMessage.action = Null alors renvoyer Faux

selon vMessage.action

	cas "validated"

		// L'utilisateur a validé son document dans le Designer
		si vMessage.success = Vrai alors
			// vMessage.data contient le JSON complet exporté par exportToWebDev()
			Trace("Document validé reçu du Designer")
			jDoc est un JSON = ChaîneVersUTF8(gsJsonRecu)
			sJsonData = JSONVersChaîne(jDoc.data)
			si sJsonData <> "" alors
				si _nIndDesignerEnCours = 0 alors
					// -----------------------------------//
					//              ENVELOPPE             //
					// -----------------------------------//
					__stOperation.stOperationLettre.stEnveloppe.JsonDesignerData = sJsonData
					si Partage.GenererPsmdServeurEnveloppe(__stOperation.stOperationLettre.stEnveloppe, __stOperation.CodeTemp) alors
						GenererBatEnveloppeDepuisPsmd(__stOperation.stOperationLettre.stEnveloppe, __stOperation.CodeTemp)
						intAdressageExpediteur.Etat		= Grisé
						intAdressageLogo.Etat				= Grisé
						intAdressagePromotion.Etat			= Grisé
						btnEnveloppeSupprimer..Visible	= Vrai
						btnEnveloppeAperçu.Visible			= Vrai
					fin
				sinon
					// -----------------------------------//
					//               DOCUMENT             //
					// -----------------------------------//
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
				fin
			fin

		sinon
			Trace("Validation échouée : " + vMessage.error)
		fin

	cas "cancelled"
		// L'utilisateur a annulé le projet
		Trace("Projet annulé par l'utilisateur")
		// TODO : Retour à la page précédente du tunnel
		// PageAffiche(PAGE_TunnelCommande, "")

	autre cas
		Trace("Action non gérée côté serveur : " + vMessage.action)

fin

gsJsonRecu = ""

renvoyer Vrai	



**** Code de la procédure GenererPsmdServeurEnveloppe() :

procédure GenererPsmdServeurEnveloppe(stEnveloppe est une StructEnveloppe, pCodeTemp est une chaîne)

sNodeExe				est une chaîne	= INILit("NODE", "CHEMIN", "", NomFichierIni())
sNodeCli				est une chaîne	= INILit("NODE", "CLI",    "", NomFichierIni())
sRepUpload			est une chaîne
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

// ─── Construction des chemins ────────────────────────────────────────────
sRepUpload			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sNomFichierPsmd	= __DOC_ENV_PSMD__ + pCodeTemp + ".psmd"
sCheminPsmd			= sRepUpload + sNomFichierPsmd
sCheminJsonTemp	= sRepUpload + "psmd_json_env_" + pCodeTemp + ".tmp"

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
// SI fFichierExiste(sCheminJsonTemp) ALORS fSupprime(sCheminJsonTemp) FIN

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


**** Code de la procédure GenererBatEnveloppeDepuisPsmd()

procédure GenererBatEnveloppeDepuisPsmd(stEnveloppe est une StructEnveloppe, pCodeTemp)

sRepUpload					est une chaîne			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sCheminPsmd					est une chaîne			= stEnveloppe.CheminPsmdEnveloppe
tabPrintshopData			est un tableau de stPrintshopData
stPrintshopData			est un stPrintshopData
stImageBat					est une structDocumentImage
sCheminJpg					est une chaîne

// ─── Validation : le PSMD doit exister sur disque ────────────────────────
si sCheminPsmd = "" _ou_ pas fFichierExiste(sCheminPsmd) alors
	Trace("SauvegarderPsmdServeur : PSMD introuvable : " + sCheminPsmd)
	retour
fin

Trace("SauvegarderPsmdServeur : PSMD confirmé : " + sCheminPsmd)

// ─── Construction du tableau de fusion ───────────────────────────────────
// Si échantillon disponible : 1er enregistrement de la base
// Sinon : tabPrintshopData vide → GenerationBatDepuisPsmd utilisera le fallback __vcUser
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
VariableRAZ(stEnveloppe.EnveloppeBAT)


sCheminJpg	= sRepUpload + __DOC_ENV_BAT__ + pCodeTemp + __JPG__
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

**** Code de la procédure GenererPsmdServeurDocument()

procédure GenererPsmdServeurDocument(stDocument est une structDocument)

sNodeExe				est une chaîne	= INILit("NODE", "CHEMIN", "", NomFichierIni())
sNodeCli				est une chaîne	= INILit("NODE", "CLI", "", NomFichierIni())
sRepUpload			est une chaîne
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

// ─── Construction des chemins ────────────────────────────────────────────
sRepUpload			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sCodeTemp			= stDocument.CodeTemp
sNomFichierPsmd	= __DOC_LTR_PSMD__ + sCodeTemp + ".psmd"
sCheminPsmd			= sRepUpload + sNomFichierPsmd
sCheminJsonTemp	= sRepUpload + "psmd_json_" + sCodeTemp + ".tmp"

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

// ─── Construction et exécution de la commande (même pattern que LanceAppli Ghostscript) ─
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
	// fSupprime(sCheminJsonTemp)
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


**** Code de la procédure GenererBatDocumentDepuisPsmd()

procédure GenererBatDocumentDepuisPsmd(stDocument est une structDocument)


sRepUpload					est une chaîne			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sCheminPsmd					est une chaîne			= stDocument.CheminPsmdTemp
tabPrintshopData			est un tableau de stPrintshopData
stPrintshopData			est un stPrintshopData
stImageBat					est une structDocumentImage
sCheminJpg					est une chaîne
nPage							est un entier

// ─── Validation : le PSMD doit exister sur disque ────────────────────────
si sCheminPsmd = "" _ou_ pas fFichierExiste(sCheminPsmd) alors
	Trace("SauvegarderPsmdServeur : PSMD introuvable : " + sCheminPsmd)
	retour
fin

Trace("SauvegarderPsmdServeur : PSMD confirmé : " + sCheminPsmd)

// ─── Construction du tableau de fusion ───────────────────────────────────
// Si échantillon disponible : 1er enregistrement de la base
// Sinon : tabPrintshopData vide → GenerationBatDepuisPsmd utilisera le fallback __vcUser
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

	sCheminJpg	= sRepUpload + __DOC_LTR_BAT__ + stDocument.CodeTemp + "p" + nPage + __JPG__
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



**** Code de la procédure AppliqueBlancTournant()

procédure AppliqueBlancTournant(pCheminJpg, pLargeurMm, pHauteurMm, pEpaisseurMm = 5)

sLigneCommande	est une chaîne	= INILit("IMAGEMAGICK", "CHEMIN", "", NomFichierIni())
sCommande		est une chaîne
nBordurePxX	est un entier
nBordurePxY	est un entier
imgJpg		est une Image

si sLigneCommande = "" alors
	renvoyer Faux
fin

si pas fFichierExiste(pCheminJpg) alors
	renvoyer Faux
fin

// Chargement de l'image pour connaître ses dimensions réelles en pixels
imgJpg	= pCheminJpg

// Calcul des bordures en pixels depuis les dimensions réelles du JPG
// Formule : (pixelsDimension × épaisseurMm) / dimensionDocumentMm
// Valeurs X et Y séparées car le ratio pixel/mm peut différer selon l'axe
nBordurePxX	= Arrondi((imgJpg..Largeur * pEpaisseurMm) / pLargeurMm, 0)
nBordurePxY	= Arrondi((imgJpg..Hauteur * pEpaisseurMm) / pHauteurMm, 0)

Trace("AppliqueBlancTournant : " + imgJpg..Largeur + "x" + imgJpg..Hauteur + "px / " + pLargeurMm + "x" + pHauteurMm + "mm -> bordure = " + nBordurePxX + "x" + nBordurePxY + "px")

// shave : supprime les bordures sur chaque bord (contenu perdu)
// border : ajoute des bordures blanches (mêmes dimensions finales)
sCommande = ChaîneConstruit(
[
	"%1" "%2" -shave %3x%4 -bordercolor white -border %3x%4 "%2"
],
sLigneCommande, pCheminJpg, nBordurePxX, nBordurePxY)

si pas LanceAppli(sCommande, exeIconise, exeBloquant) alors
	renvoyer Faux
fin

renvoyer Vrai



**** Code Serveur Ajax du bouton btnEnveloppePersonnaliser :

gsJsonDesigner = __stOperation.stOperationLettre.stEnveloppe.JsonDesignerData

_nIndDesignerEnCours				= 0
btnFerme.Visible					= Faux
grpBoutonProgression.Visible	= Faux
btnPrécédent.Visible				= Faux
btnSuivant.Visible				= Faux
grpTunnelNombre.Visible			= Faux
grpTunnelMontantHT.Visible		= Faux
btnAccueil.Etat					= Grisé
celLtrConteneur.Plan				= 2

*** Code Navigateur Retour de traitement Ajax après le clic sur btnDocumentPersonnaliser :

// Envoyer le JSON au Designer
si gsJsonDesigner <> "" alors
	EnvoyerMessageIframe(gsJsonDesigner)
	gsJsonDesigner = ""	
fin


***************************************************
***** ENREGISTREMENT D'UNE OPERATION COURRIER *****
***************************************************


**** Code de la procédure AjoutModificationOperationCourrier()

procédure AjoutModificationOperationCourrier(stOperation est une structOperation)

stDocument				est une structDocument
sTexteRequete			est une chaîne
sdReqLettreContenu	est une Source de Données
sListeDocument			est une chaîne
bEstModeCreation		est un booléen	= (stOperation.IdOperation = 0)		// On fait le test maintenant car après l'appel de AjoutModificationOperation l'IdOperation sera renseigné

// On met à jour le booléen pour calculer le statut de l'opération dans le trigger HF
stOperation.EstDocumentEnAttente = Faux
stOperation.EstInjectionEnAttente = Faux

pour tout stDocument de stOperation.stOperationLettre.tabStDocument
	si stDocument.EstDocumentEnAttente = Vrai alors
		si stDocument.EstPdfClient = Vrai _ou_ stDocument.IdModele > 0 alors // Si EstDocumentEnAttente est a VRAI et que IdModele > 0 c'est que la personnalisation n'a toujours pas été faite.
			stOperation.EstDocumentEnAttente = Vrai
		sinon
			stOperation.EstInjectionEnAttente = Vrai
		fin
	fin
fin

AjoutModificationOperation(stOperation)  // On ajoute / met à jour les données dans la table dos_operation

si bEstModeCreation alors
	ope_lettre.RAZ()
	ope_lettre.IdLettre				= stOperation.IdOperation
	ope_lettre.EstMarketing 		= stOperation.stOperationLettre.EstMarketing
sinon
	ope_lettre.LitRecherchePremier(IdLettre,stOperation.IdOperation)
	si pas ope_lettre.Trouve() alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur positionnement ope_lettre")
		<fin>
		renvoyer Faux
	fin
fin



ope_lettre.IdEnveloppe 							= stOperation.stOperationLettre.IdEnveloppe
ope_lettre.IdEnveloppeClient					= stOperation.stOperationLettre.IdEnveloppeClient
ope_lettre.IdTimbreTarif 						= stOperation.stOperationLettre.IdTimbreTarif
ope_lettre.IdPackage 							= stOperation.stOperationLettre.IdPackage
ope_lettre.IdCampagne	 						= stOperation.stOperationLettre.IdCampagne
ope_lettre.QuantiteEnveloppeClient	 		= stOperation.stOperationLettre.QuantiteEnveloppeClient
ope_lettre.EstAlliage 							= stOperation.stOperationLettre.EstAlliage
ope_lettre.EstAlliageClient					= stOperation.stOperationLettre.EstAlliageClient

ope_lettre.EstAdressageExpediteur			= stOperation.stOperationLettre.stEnveloppe.EstAdressageExpediteur
ope_lettre.EstAdressageLogo					= stOperation.stOperationLettre.stEnveloppe.EstAdressageLogo
ope_lettre.EstAdressagePromotion				= stOperation.stOperationLettre.stEnveloppe.EstAdressagePromotion
ope_lettre.JsonDesignerData					= stOperation.stOperationLettre.stEnveloppe.JsonDesignerData

si stOperation.stOperationLettre.IdEnveloppe = 0	 			alors ope_lettre.IdEnveloppe..Null = Vrai
si stOperation.stOperationLettre.IdTimbreTarif = 0 			alors ope_lettre.IdTimbreTarif..Null = Vrai
si stOperation.stOperationLettre.IdEnveloppeClient = 0 		alors ope_lettre.IdEnveloppeClient..Null = Vrai
si stOperation.stOperationLettre.IdPackage = 0 					alors ope_lettre.IdPackage..Null = Vrai
si stOperation.stOperationLettre.IdCampagne = 0 				alors ope_lettre.IdCampagne..Null = Vrai


si bEstModeCreation alors

	si pas ope_lettre.Ajoute() alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur :",ErreurInfo(errComplet))
		<fin>
		renvoyer Faux
	fin
sinon
	si pas ope_lettre.Modifie() alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur :",ErreurInfo(errComplet))
		<fin>
		renvoyer Faux
	fin
fin

// ******************************** Enregistrement des données de chaque document

pour tout stDocument de stOperation.stOperationLettre.tabStDocument
	si stDocument.IdLettreContenu = 0 alors
		ope_lettre_contenu.RAZ()
		ope_lettre_contenu.IdLettre = stOperation.IdOperation
	sinon
		ope_lettre_contenu.LitRecherchePremier(IdLettreContenu, stDocument.IdLettreContenu)
		si pas ope_lettre_contenu.Trouve() alors
			<compile si TypeConfiguration <> Webservice>
				Info("Erreur positionnement ope_lettre_contenu")
			<fin>
			renvoyer Faux
		fin
	fin


	ope_lettre_contenu.IdModele						= stDocument.IdModele
	ope_lettre_contenu.IdDocumentClient				= stDocument.IdDocumentClient
	ope_lettre_contenu.IdSupportGrammage			= stDocument.IdSupportGrammage
	ope_lettre_contenu.EstRectoVerso					= stDocument.EstRectoVerso
	ope_lettre_contenu.EstFondPerdu					= stDocument.EstFondPerdu
	ope_lettre_contenu.NombrePage						= stDocument.NombrePage
	ope_lettre_contenu.NomFichierOrigine			= stDocument.NomFichierOrigine
	ope_lettre_contenu.ModeImpression				= stDocument.ModeImpression
	ope_lettre_contenu.EstPdfClient					= stDocument.EstPdfClient
	ope_lettre_contenu.EstDocumentEnAttente		= stDocument.EstDocumentEnAttente
	ope_lettre_contenu.IdPackageContenu				= stDocument.IdPackageContenu
	ope_lettre_contenu.IdPapier						= stDocument.IdPapier
	ope_lettre_contenu.QuantiteDocumentClient		= stDocument.QuantiteDocumentClient
	ope_lettre_contenu.JsonDesignerData				= stDocument.JsonDesignerData


	si ope_lettre_contenu.IdModele = 0 				alors ope_lettre_contenu.IdModele..Null = Vrai
	si ope_lettre_contenu.IdDocumentClient = 0	alors ope_lettre_contenu.IdDocumentClient..Null = Vrai
	si ope_lettre_contenu.IdPackageContenu = 0 	alors ope_lettre_contenu.IdPackageContenu..Null = Vrai
	si ope_lettre_contenu.IdPapier = 0 				alors ope_lettre_contenu.IdPapier..Null = Vrai

	// Enregistrement du prix sélectionné
	si stDocument.IdLettreContenu = 0 alors
		si pas ope_lettre_contenu.Ajoute() alors
			<compile si TypeConfiguration <> Webservice>
				Info("Erreur :",ErreurInfo(errComplet))
			<fin>
			renvoyer Faux
		fin
		stDocument.IdLettreContenu = ope_lettre_contenu.IdLettreContenu
	sinon
		si pas ope_lettre_contenu.Modifie() alors
			<compile si TypeConfiguration <> Webservice>
				Info("Erreur :",ErreurInfo(errComplet))
			<fin>
			renvoyer Faux
		fin
	fin

	// On modifie le JsonDesignerData

	sListeDocument += [","] + stDocument.IdLettreContenu
fin


// ******************************** Enregistrement des données de chaque distributeur, ne concerne que Smarteva et Tracteva Laser
// En modification on supprime et on enregistre a nouveau
si bEstModeCreation = Faux alors
	sTexteRequete = ChaîneConstruit("DELETE FROM ope_lettre_distribution WHERE IdLettre = %1",stOperation.IdOperation)
	si pas sdReqLettreContenu.ExécuteRequêteSQL(ope_lettre_distribution..Connexion, hRequêteSansCorrection, sTexteRequete) alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur requête AjoutModificationOperationCourrier 1")
		<fin>
		renvoyer Faux
	fin
fin



// EN MODIFICATION ON SUPPRIME LES DOCUMENTS QUI NE SONT PLUS PRESENT

si sListeDocument <> "" alors
	sTexteRequete = ChaîneConstruit("DELETE FROM ope_lettre_contenu WHERE IdLettre = %1 AND IdLettreContenu NOT IN (%2)",stOperation.IdOperation,sListeDocument)
	si pas sdReqLettreContenu.ExécuteRequêteSQL(ltr_support..Connexion, hRequêteSansCorrection, sTexteRequete) alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur requête AjoutModificationOperationCourrier 2")
		<fin>
		renvoyer Faux
	fin
fin

renvoyer Vrai

fin:
sdReqLettreContenu.AnnuleDéclaration()



**** Code de la procédure AjoutModificationOperation()

procédure AjoutModificationOperation(stOperation est un structOperation)

bCreation est un booléen	= (stOperation.IdOperation = 0)



si bCreation = Vrai alors
	dos_operation.RAZ()
	stOperation.DateHeureCreation		= DateHeureSys()
	stOperation.UserCreation			= Partage.__vcUser.NomUser
	stOperation.Statut					= __Statut_Enregistrée__
sinon
	stOperation.DateHeureModification	= DateHeureSys()
	stOperation.UserModification		= Partage.__vcUser.NomUser

	si pas dos_operation.LitRecherchePremier(IdOperation, stOperation.IdOperation) alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur positionnement dos_operation")
		<fin>
		retour
	fin
fin

// **************************************************** Données communes à la création et à la modification
// On met à jour le booléen pour calculer le statut de l'opération dans le trigger HF


selon stOperation.TypeOperation
	cas __OPERATION_TRACTEVA__, __OPERATION_SMARTEVA__
		stOperation.EstBaseEnAttente = (stOperation.stOperationTract.IdEtude = 0)

	cas __OPERATION_RNVP__, __OPERATION_BLOCTEL__, __OPERATION_BASE_DE_DONNEES__
		stOperation.EstBaseEnAttente = Faux

	autre cas
		stOperation.EstBaseEnAttente = Vrai
		pour tout stBase de stOperation.tabBase
			si stBase.EstSupprime = Faux alors
				stOperation.EstBaseEnAttente = Faux
				sortir
			fin
		fin

fin


MémoireVersFichier(stOperation,dos_operation)

si stOperation.ElementManquant = ""								alors dos_operation.ElementManquant..Null = Vrai
si stOperation.EstEnvoiImmediat = Vrai							alors dos_operation.HeureEnvoiSouhaite..Null = Vrai // pas d'heure d'envoi en immediat l'envoi immédiatement après validation.
si pas HeureValide(stOperation.HeureEnvoiSouhaite ) 			alors dos_operation.HeureEnvoiSouhaite..Null = Vrai // Pas d'heure d'envoi pour le courrier
si pas DateHeureValide(stOperation.DateHeureValidation) 		alors dos_operation.DateHeureValidation..Null = Vrai
si pas DateHeureValide(stOperation.DateHeureRefus) 				alors dos_operation.DateHeureRefus..Null = Vrai
si pas DateHeureValide(stOperation.DateHeureLimiteValidation)	alors dos_operation.DateHeureLimiteValidation..Null = Vrai
si stOperation.IdClientFacturation <= 0 						alors dos_operation.IdClientFacturation..Null = Vrai
si stOperation.NumCommandeClient = "" 							alors dos_operation.NumCommandeClient..Null = Vrai
si stOperation.IdCoupon = 0 									alors dos_operation.IdCoupon..Null = Vrai
si pas DateHeureValide(stOperation.DateHeureModification)		alors dos_operation.DateHeureModification..Null = Vrai
si stOperation.UserModification = ""							alors dos_operation.UserModification..Null = Vrai

//si clt_client.LitRecherchePremier(IdClient,stOperation.IdClientFacturation) ALORS
//	dos_operation.EstFacturationMensuelle = clt_client.EstFacturationMensuelle
//	si dos_operation.EstFacturationMensuelle ALORS
//		dos_operation.EstPlafondEncoursDepasse = PlafondEncoursDépassé(stOperation.IdClientFacturation, clt_client.PlafondEncours, stOperation.MontantTTC, stOperation.IdOperation)
//	sinon
//		dos_operation.EstPlafondEncoursDepasse = faux
//	FIN
//	stOperation.EstPlafondEncoursDepasse = dos_operation.EstPlafondEncoursDepasse
//FIN

si bCreation alors
	dos_operation.CodeSite = Partage.__sCodeSite
	si pas dos_operation.Ajoute() alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur :",ErreurInfo(errComplet))
		<fin>
		retour
	fin

	stOperation.IdOperation = dos_operation.IdOperation

	Multitâche(-1)
	si dos_operation.LitRecherchePremier(IdOperation,stOperation.IdOperation) alors
		dos_operation.Dossier = EntierVersBase26(stOperation.IdOperation,5)
		si pas dos_operation.Modifie() alors
			<compile si TypeConfiguration <> Webservice>
				Info("Erreur :",ErreurInfo(errComplet))
			<fin>
			retour
		fin
	fin
	stOperation.Dossier = dos_operation.Dossier
sinon
	si pas dos_operation.Modifie() alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur :",ErreurInfo(errComplet))
		<fin>
		retour
	fin
fin

// on récupère le statut mis à jour par le Trigger
stOperation.Statut = dos_operation.Statut

// On enregistre le tableau des colonnes de rapport
si stOperation.IdOperation > 0 alors
	cpFonction.SupprimeEnregistrement(dos_operation_rapport..Nom, dos_operation_rapport.IdOperation..Nom + " = " + stOperation.IdOperation)
	pour tout stRapport de stOperation.tabRapport sur Ordre
		dos_operation_rapport.IdOperation		= stOperation.IdOperation
		dos_operation_rapport.Libelle			= stRapport.Libelle
		dos_operation_rapport.Champ				= stRapport.Champ
		dos_operation_rapport.Type				= stRapport.Type
		dos_operation_rapport.Ordre				= stRapport.Ordre
		dos_operation_rapport.EstObligatoire	= stRapport.EstObligatoire
		dos_operation_rapport.Ajoute()
	fin
fin

si stOperation.tabBase..Occurrence > 0 alors

	// Gestion des bases de données louées Zecible
	// On ne peux pas ré-exploiter une base de données louée
	pour tout stBase de stOperation.tabBase
		si stBase.IdZecible > 0 alors
			selon Vrai
				cas stBase.EstAjoute
					si clt_base.LitRecherchePremier(IdBase, stBase.IdBaseClient) alors
						si clt_base.EstActif = Vrai alors
							clt_base.EstActif = Faux
							clt_base.Modifie()
						fin
					fin

				cas stBase.EstSupprime
					si clt_base.LitRecherchePremier(IdBase, stBase.IdBaseClient) alors
						si clt_base.EstActif = Faux alors
							clt_base.EstActif = Vrai
							clt_base.Modifie()
						fin
					fin

				autre cas

			fin
		fin
	fin

	si EnregistrementBase(stOperation) alors
		selon stOperation.TypeOperation
			cas __OPERATION_SMS__		: EnregistrementProgrammationSms(stOperation)
			cas __OPERATION_VMS__		: EnregistrementProgrammationVms(stOperation)
			cas __OPERATION_EMAIL__ 	: EnregistrementProgrammationEmail(stOperation)
			cas __OPERATION_TEL__		: EnregistrementProgrammationTel(stOperation)
			autres cas
		fin


		// Dans le cas ou l'on repasse dans se code en cas d'un F5 on ne rajoute pas une deuxième fois la base...
		pour tout stBase de stOperation.tabBase
			si stBase.EstAjoute = Vrai alors
				stBase.EstAjoute = Faux
			fin
		fin
	sinon
		retour
	fin
fin




// Opération Tract
si stOperation.TypeOperation dans (__OPERATION_TRACTEVA__,  __OPERATION_SMARTEVA__) alors
	EnregistementProgrammationTract(stOperation)
fin

si stOperation.EstCliquezIci alors
	AjoutModificationNouveauCliquezIci(stOperation)
sinon
	// On supprime les précédentes lignes du devis et on recommence
	si bCreation = Faux alors
		cpFonction.SupprimeEnregistrement(ope_cliquezici..Nom, ope_cliquezici.IdCliquezIci..Nom + " = " + stOperation.IdOperation)
	fin
fin

AjoutModificationOperationLigne(stOperation)


***************************************************
***** CHARGEMENT D'UNE OPERATION COURRIER *****
***************************************************

**** Code de la procédure ChargeStructOperation()

procédure ChargeStructOperation(pIdOperation)

stOperation est une structOperation


si dos_operation.LitRecherchePremier(IdOperation, pIdOperation) alors

	FichierVersMémoire(stOperation,dos_operation)
	stOperation.CodeTemp = pIdOperation

	si stOperation.IdCoupon <> 0 alors
		clt_coupon.LitRecherchePremier(IdCoupon, stOperation.IdCoupon)
		si clt_coupon.Trouve() alors
			stOperation.TypeCoupon = clt_coupon.TypeCoupon
		fin
	fin

	// stOperation.IdAdresseFacturation = AdresseDeFacturation(stOperation.IdClientFacturation)

	// A conserver au dessus du chargement des structures des opérations
	// Chargement des bases de données
	si stOperation.TypeOperation pas dans (__OPERATION_TRACTEVA__, __OPERATION_SMARTEVA__) alors
		stOperation.tabRapport		= Partage.ChargeTabRapport(pIdOperation)
		stOperation.tabBase			= Partage.ChargeTabStructBase(pIdOperation)
		stOperation.taaBaseChamp	= Partage.CalculeTaaBaseChamp(stOperation.tabBase, Faux, Faux)
	fin

	selon stOperation.TypeOperation
		cas __OPERATION_COURRIER__ 	: stOperation.stOperationLettre 	= ChargeStructOperationLettre(pIdOperation)
		cas __OPERATION_TRACTEVA__	: stOperation.stOperationTract		= ChargeStructOperationTract(pIdOperation)
		cas __OPERATION_SMARTEVA__	: stOperation.stOperationTract		= ChargeStructOperationTract(pIdOperation)
		cas __OPERATION_SMS__		: stOperation.stOperationSms 		= ChargeStructOperationSms(pIdOperation)
		cas __OPERATION_VMS__		: stOperation.stOperationVms 		= ChargeStructOperationVms(pIdOperation)
		cas __OPERATION_TEL__		: stOperation.stOperationCallCenter	= ChargeStructOperationCallCenter(pIdOperation)
		cas __OPERATION_EMAIL__		: //stOperation.stOperationEmail = ChargeTabStructOperationEmail(pIdDossier,pIdOperation)
		autre cas
	fin


	si stOperation.EstCliquezIci = Vrai alors
		stOperation.stNouveauCliquezIci = ChargeStructNouveauCliquezIci(0,0,pIdOperation)
	fin

	// Chargement des dossier ligne
	stOperation.tabOperationLigne = ChargeTabStructOperationLigne(pIdOperation)


fin

renvoyer stOperation


**** Code de la procedure ChargeStructOperationLettre()

procédure ChargeStructOperationLettre(pIdOperation)

stOperationLettre				est une StructOperationLettre
sFondCheminPhysique			est une chaîne
sFondCheminRelatif			est une chaîne
sBatCheminPhysique			est une chaîne
sBatCheminRelatif				est une chaîne
sTexteRequete					est une chaîne
sdReqOpeLettre					est une Source de Données
sdReqRnvp						est une Source de Données

sTexteRequete =
[
	SELECT 
		ope_lettre.IdLettre,
		ope_lettre.EstMarketing,
		ope_lettre.EstAlliage,
		ope_lettre.EstAlliageClient,
		ope_lettre.IdEnveloppe,
		ope_lettre.IdEnveloppeClient,
		ope_lettre.QuantiteEnveloppeClient,
		ope_lettre.EstAdressageExpediteur,
		ope_lettre.EstAdressageLogo,
		ope_lettre.EstAdressagePromotion,
		ope_lettre.JsonDesignerData,
		ope_lettre.IdCampagne,
		ope_lettre.IdPackage,
		ope_lettre.IdTimbreTarif,
		ope_lettre.TypeDedoublonnage,
		ope_lettre.TypeRnvp,
		ope_lettre.IdRnvp,
		ope_lettre.AdressageExpediteur TexteAdressageExpediteur,
		ope_lettre.NomFichierEnveloppePersonnalise NomFichierOrigine,
		ope_lettre.HauteurEnveloppePersonnalise HauteurSurEnveloppe,
		ope_lettre.LargeurEnveloppePersonnalise LargeurSurEnveloppe,
		'[%__DOC_ENV_IMAGE__%][%pIdOperation%]' NomFichierTemp,
		ope_lettre.TypeFichierEnveloppePersonnalise TypeFichier,
		ope_lettre.TauxEncrageEnveloppePersonnalise TauxEncrageEnveloppe,
		
		IF(ltr_package.PrixUnitaire = 0 OR ltr_package.IdClient = [%Partage.__vcUser.IdClient%],1,0) EstPackageClient, 
		IF(ltr_package.PrixUnitaire > 0, 1, 0) EstPackageMarque,		
		IF(ltr_package_tarif.PrixUnitaire > 0, 1, 0) EstPackageMarketeam,
		IFNULL(ltr_package_tarif.PrixUnitaire, ltr_package.PrixUnitaire) PuVentePackage,
		ltr_package.PackageModeImpression,
		ltr_package.FraisFixeFacturation FraisFixePackage,
		ltr_package.PrixUnitaireAchat PuAchatPackage,
		ltr_package.MinimumFacturation,
		ltr_package.DelaiSupplementaire,
		ltr_package.SeuilMinPackage,
		ltr_package.DeductionEnveloppe,
		ltr_package.Previsionnelle,
		
		ltr_enveloppe.IdEnveloppe,
		ltr_enveloppe.IdInsertion,
		ltr_enveloppe.Libelle,
		ltr_enveloppe.Hauteur,
		ltr_enveloppe.Largeur,
		ltr_enveloppe.NbrFenetre,
		IF(ltr_enveloppe.NbrFenetre > 0,1,0) EstEnveloppeFenetre,
		ltr_enveloppe.PoidsInsertionMin,
		ltr_enveloppe.PoidsInsertionMax,
		ltr_enveloppe.NbrInsertionMax,
		ltr_enveloppe.Poids,
		ltr_enveloppe.PrixAchat PrixAchatEnveloppe,
		ltr_enveloppe.Type						

	FROM
		ope_lettre
		JOIN ltr_enveloppe ON ope_lettre.IdEnveloppe = ltr_enveloppe.IdEnveloppe
		LEFT JOIN ltr_package ON ltr_package.IdPackage = ope_lettre.IdPackage
		LEFT JOIN ltr_package_tarif ON ltr_package_tarif.IdPackage = ope_lettre.IdPackage AND ltr_package_tarif.IdPackPrestation = [%Partage.__vcUser.IdPackPrestation%]
	WHERE 
		IdLettre = %1
]


sTexteRequete = ChaîneConstruit(sTexteRequete,pIdOperation)

si pas sdReqOpeLettre.ExécuteRequêteSQL(ope_lettre..Connexion, hRequêteSansCorrection, sTexteRequete) alors
	<compile si TypeConfiguration <> Webservice>
		Info("Erreur requête")
	<fin>
	renvoyer stOperationLettre
fin

si sdReqOpeLettre.LitPremier() alors

	FichierVersMémoire(stOperationLettre, sdReqOpeLettre)
	FichierVersMémoire(stOperationLettre.stEnveloppe,sdReqOpeLettre)

	sBatCheminPhysique		= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_BAT__,Vrai)
	sBatCheminRelatif			= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_BAT__,Faux)

	sFondCheminPhysique	 	= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_FOND__,Vrai)
	sFondCheminRelatif	 	= cpProjet.CheminFichier(sdReqOpeLettre.IdLettre,__REP_FOND__,Faux)

	// Chargement de la vignette de l'enveloppe standard
	si fFichierExiste(sFondCheminRelatif + __DOC_ENV_FOND__ + pIdOperation + __JPG__) alors
		stOperationLettre.stEnveloppe.EnveloppeFond.CheminPhysique	= sFondCheminPhysique 	+ __DOC_ENV_FOND__ + pIdOperation + __JPG__
		stOperationLettre.stEnveloppe.EnveloppeFond.CheminRelatif	= sFondCheminRelatif 	+ __DOC_ENV_FOND__ + pIdOperation + __JPG__
	fin

	// Chargement de la vignette de l'enveloppe personnalisée
	si fFichierExiste(sBatCheminPhysique + __DOC_ENV_BAT__ + pIdOperation + __JPG__) alors
		stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique	= sBatCheminPhysique 	+ __DOC_ENV_BAT__ + pIdOperation + __JPG__
		stOperationLettre.stEnveloppe.EnveloppeBAT.CheminRelatif 	= sBatCheminRelatif 		+ __DOC_ENV_BAT__ + pIdOperation + __JPG__
	fin

 	// Chargement de l'image de la vignette de l'enveloppe personnalisée

	stOperationLettre.tabStDocument 		= ChargeTabStructLtrDocument(stOperationLettre.IdLettre,stOperationLettre.IdPackage,stOperationLettre.IdCampagne)

fin



renvoyer stOperationLettre

fin:
sdReqOpeLettre.AnnuleDéclaration()
sdReqRnvp.AnnuleDéclaration()


**** Code de la procédure ChargeTabStructLtrDocument()

procédure ChargeTabStructLtrDocument(pIdOperation = 0,  pIdPackage = 0, pIdCampagne = 0)

stDocument					est une structDocument
sTexteRequete				est une chaîne
sdReqChargeTabDocument	est une Source de Données

tabDocument					est un tableau de structDocument
sWhere							est une chaîne
sSelect						est une chaîne
sFrom							est une chaîne

si pIdOperation <> 0 alors
	sTexteRequete =
	[
		SELECT
		ope_lettre_contenu.IdLettreContenu,
		ope_lettre_contenu.IdLettre,
		ope_lettre_contenu.IdSupportGrammage,
		ope_lettre_contenu.IdPackageContenu,
		ope_lettre_contenu.IdDocumentClient,
		ope_lettre_contenu.IdPapier,
		ope_lettre_contenu.IdModele,
		ope_lettre_contenu.ModeImpression,
		ope_lettre_contenu.EstPdfClient,
		ope_lettre_contenu.EstDocumentEnAttente,
		ope_lettre_contenu.EstRectoVerso,
		ope_lettre_contenu.EstFondPerdu,
		ope_lettre_contenu.QuantiteDocumentClient,
		ope_lettre_contenu.NombrePage,
		ope_lettre_contenu.NomFichierOrigine,
		ope_lettre_contenu.JsonDesignerData,
		ltr_support_grammage.A4PliableMachine,
		ltr_support_grammage.Poids,
		ltr_grammage.Libelle LibelleGrammage,
		ltr_type_support.IdTypeSupport,
		ltr_type_support.DelaiOffsetSupplementaire,
		ltr_type_support.DelaiLaserSupplementaire,
		ltr_type_support.Libelle LibelleTypeSupport,
		ltr_type_support.FichierApercu,
		ltr_support.IdSupport,
		ltr_support.Libelle LibelleSupport,
		ltr_support.Format LibelleFormat,
		ltr_support.HauteurFerme,
		ltr_support.LargeurFerme,
		ltr_support.HauteurOuvert,
		ltr_support.LargeurOuvert,
		ltr_support.NbPageObligatoire,
		ltr_support.NbPageTotale,
		
		ltr_papier.Libelle LibellePapier,
		ltr_papier.EstPapierCouche
		%2	
		FROM
		ltr_type_support, ltr_support, ltr_support_grammage, ltr_grammage, ltr_papier, ope_lettre, dos_operation, clt_client , ope_lettre_contenu %3 
		
		WHERE
		ope_lettre.IdLettre = dos_operation.IdOperation AND
		dos_operation.IdClient = clt_client.IdClient AND
		ope_lettre_contenu.IdLettre = ope_lettre.IdLettre AND
		ope_lettre_contenu.IdSupportGrammage = ltr_support_grammage.IdSupportGrammage AND
		ltr_support_grammage.IdSupport = ltr_support.IdSupport AND
		ltr_support.IdTypeSupport = ltr_type_support.IdTypeSupport AND
		ltr_support_grammage.IdGrammage = ltr_grammage.IdGrammage AND
		ope_lettre_contenu.IdPapier = ltr_papier.IdPapier AND
		ope_lettre.IdLettre = %1
		%4
	]

	si pIdPackage > 0 alors
		sSelect	= ",ltr_package_contenu.PrixAchatContenu, ltr_package_contenu.DeductionContenu"
		sFrom		= "LEFT JOIN ltr_package_contenu ON ope_lettre_contenu.IdPackageContenu = ltr_package_contenu.IdPackageContenu"
		//		sWhere = "AND ltr_support_grammage.IdSupportGrammage = ltr_package_contenu.IdSupportGrammage"
	fin

	sTexteRequete = ChaîneConstruit(sTexteRequete,pIdOperation,sSelect, sFrom, sWhere)

sinon

	// Ici on charge la structure d'un package ou d'un campagne !
	sTexteRequete =
	[
		SELECT
		ltr_package.IdMarque,
		ltr_package_contenu.IdSupportGrammage,
		ltr_package_contenu.IdPackageContenu,
		ltr_campagne_contenu.IdDocumentClient,
		ltr_package_contenu.IdPapier,
		ltr_campagne_contenu.IdModele,
		ltr_package_contenu.ModeImpression,
		ltr_package_contenu.EstRectoVerso,
		ltr_package_contenu.EstFondPerdu,
		ltr_package_contenu.NbrPage NombrePage,
		ltr_support_grammage.A4PliableMachine,
		ltr_support_grammage.Poids,
		ltr_grammage.Libelle LibelleGrammage,
		ltr_type_support.DelaiOffsetSupplementaire,
		ltr_type_support.DelaiLaserSupplementaire,
		ltr_type_support.IdTypeSupport,
		ltr_type_support.Libelle LibelleTypeSupport,
		ltr_type_support.FichierApercu,
		ltr_support.IdSupport,
		ltr_support.Libelle LibelleSupport,
		ltr_support.Format LibelleFormat,
		ltr_support.HauteurFerme,
		ltr_support.LargeurFerme,
		ltr_support.HauteurOuvert,
		ltr_support.LargeurOuvert,
		ltr_support.NbPageObligatoire,
		ltr_support.NbPageTotale,
		
		ltr_papier.Libelle LibellePapier,
		ltr_papier.EstPapierCouche,
		ltr_package_contenu.PrixAchatContenu, 
		ltr_package_contenu.DeductionContenu
		FROM
		ltr_type_support, ltr_support, ltr_support_grammage, ltr_grammage, ltr_papier, ltr_package, ltr_package_contenu LEFT JOIN ltr_campagne_contenu ON ltr_package_contenu.IdPackageContenu = ltr_campagne_contenu.IdPackageContenu AND ltr_campagne_contenu.IdCampagne = %2
		WHERE
		ltr_package.IdPackage = ltr_package_contenu.IdPackage AND
		ltr_package_contenu.IdSupportGrammage = ltr_support_grammage.IdSupportGrammage AND
		ltr_support_grammage.IdSupport = ltr_support.IdSupport AND
		ltr_support.IdTypeSupport = ltr_type_support.IdTypeSupport AND
		ltr_support_grammage.IdGrammage = ltr_grammage.IdGrammage AND
		ltr_package_contenu.IdPapier = ltr_papier.IdPapier AND
		ltr_package.IdPackage = %1
	]

	sTexteRequete = ChaîneConstruit(sTexteRequete,pIdPackage, pIdCampagne)

fin


si pas sdReqChargeTabDocument.ExécuteRequêteSQL(ltr_support..Connexion, hRequêteSansCorrection, sTexteRequete) alors
	<compile si TypeConfiguration <> Webservice>
		Info("Erreur requête")
	<fin>
fin

pour tout sdReqChargeTabDocument
	VariableRAZ(stDocument)

	stDocument.TypeFichier							= __PDF__

	stDocument.IdTypeSupport						= sdReqChargeTabDocument.IdTypeSupport
	stDocument.IdSupport								= sdReqChargeTabDocument.IdSupport
	stDocument.IdSupportGrammage					= sdReqChargeTabDocument.IdSupportGrammage
	stDocument.IdPackageContenu					= sdReqChargeTabDocument.IdPackageContenu
	stDocument.IdDocumentClient					= sdReqChargeTabDocument.IdDocumentClient
	stDocument.IdModele								= sdReqChargeTabDocument.IdModele
	stDocument.IdPapier								= sdReqChargeTabDocument.IdPapier
	stDocument.JsonDesignerData					= sdReqChargeTabDocument.JsonDesignerData
	stDocument.ModeImpression						= __MODE_AUTOMATIQUE__ //sdReqChargeTabDocument.ModeImpression
	stDocument.ModeImpressionSelectionne		= sdReqChargeTabDocument.ModeImpression
	stDocument.EstRectoVerso						= sdReqChargeTabDocument.EstRectoVerso
	stDocument.EstFondPerdu							= sdReqChargeTabDocument.EstFondPerdu
	stDocument.EstPapierCouche						= sdReqChargeTabDocument.EstPapierCouche
	stDocument.NombrePage							= sdReqChargeTabDocument.NombrePage
	stDocument.A4PliableMachine					= sdReqChargeTabDocument.A4PliableMachine
	stDocument.HauteurFerme							= sdReqChargeTabDocument.HauteurFerme
	stDocument.LargeurFerme							= sdReqChargeTabDocument.LargeurFerme
	stDocument.HauteurOuvert						= sdReqChargeTabDocument.HauteurOuvert
	stDocument.LargeurOuvert						= sdReqChargeTabDocument.LargeurOuvert
	stDocument.NbPageObligatoire					= sdReqChargeTabDocument.NbPageObligatoire
	stDocument.Poids									= sdReqChargeTabDocument.Poids
	stDocument.DelaiLaserSupplementaire			= sdReqChargeTabDocument.DelaiLaserSupplementaire
	stDocument.DelaiOffsetSupplementaire		= sdReqChargeTabDocument.DelaiOffsetSupplementaire
	stDocument.LibelleSupport						= sdReqChargeTabDocument.LibelleSupport
	stDocument.LibelleTypeSupport					= sdReqChargeTabDocument.LibelleTypeSupport
	stDocument.LibelleFormat						= sdReqChargeTabDocument.LibelleFormat
	stDocument.LibelleGrammage						= sdReqChargeTabDocument.LibelleGrammage
	stDocument.LibellePapier						= sdReqChargeTabDocument.LibellePapier
	stDocument.NbPageTotale							= sdReqChargeTabDocument.NbPageTotale
	stDocument.FichierApercu						= sdReqChargeTabDocument.FichierApercu
	si pIdPackage > 0 alors
		stDocument.PrixAchatContenu				= sdReqChargeTabDocument.PrixAchatContenu
		stDocument.DeductionContenu				= sdReqChargeTabDocument.DeductionContenu
	fin
	stDocument.EstUploadé = Faux

	LibelleDocumentDesignation(stDocument)

	si pIdOperation > 0 alors
		stDocument.QuantiteDocumentClient			= sdReqChargeTabDocument.QuantiteDocumentClient
		stDocument.EstPdfClient							= sdReqChargeTabDocument.EstPdfClient
		stDocument.IdLettreContenu						= sdReqChargeTabDocument.IdLettreContenu
		stDocument.CodeTemp								= sdReqChargeTabDocument.IdLettreContenu
		stDocument.EstDocumentEnAttente				= sdReqChargeTabDocument.EstDocumentEnAttente
		stDocument.NomFichierOrigine					= sdReqChargeTabDocument.NomFichierOrigine

		ChargeDocument(stDocument,sdReqChargeTabDocument.IdLettre)


	sinon
		stDocument.EstPdfClient							= (sdReqChargeTabDocument.IdModele = 0 _et_ sdReqChargeTabDocument.IdDocumentClient = 0)
		stDocument.EstDocumentEnAttente				= Vrai

		si sdReqChargeTabDocument.IdModele > 0 _ou_ sdReqChargeTabDocument.IdDocumentClient > 0 alors

			ChargeDocument(stDocument,sdReqChargeTabDocument.IdLettre)

		fin

	fin

	tabDocument.Ajoute(stDocument)
fin



fin:
sdReqChargeTabDocument.AnnuleDéclaration()
renvoyer tabDocument


**** Code de la procédure DéplaceFichierUpload() :

procédure DéplaceFichierUpload(stOperation est une structOperation)

stDocument			est une structDocument
sListeBat			est une chaîne
sListeFond			est une chaîne
sListeDocument		est une chaîne

sRepertoireDocument, sRepertoireBat, sRepertoireFond, sRepertoirePrintshop, sRepertoireEnveloppe, sRepertoireClient, sRepertoireMarque	sont des chaînes

sRepertoireDocument			= cpProjet.CheminFichier(stOperation.IdOperation, __REP_DOCUMENT__)
sRepertoireBat					= cpProjet.CheminFichier(stOperation.IdOperation, __REP_BAT__)
sRepertoireFond				= cpProjet.CheminFichier(stOperation.IdOperation, __REP_FOND__)
sRepertoirePrintshop			= cpProjet.CheminFichier(stOperation.IdOperation, __REP_PRINTSHOP__)
sRepertoireEnveloppe			= cpProjet.CheminFichier(stOperation.IdOperation, __REP_ENVELOPPE__)


selon stOperation.TypeOperation

	cas __OPERATION_COURRIER__

		// On sauvegarde le bat Enveloppe
		si stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique <> "" alors
			fDéplaceFichier(stOperation.stOperationLettre.stEnveloppe.EnveloppeBAT.CheminPhysique, sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__)
		fin

		sListeBat += [" "] + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__

		pour tout stDocument de stOperation.stOperationLettre.tabStDocument
			// On mémorise la liste des documents de l'opération
			si stDocument.IdModele > 0 _ou_ stDocument.IdDocumentClient > 0 _ou_ stDocument.NomFichierOrigine <> "" alors
				sListeDocument += [" "] + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__
				// On mémorise la liste des bat et des fonds de l'opération
				pour NumPage = 1 _à_ stDocument.NombrePage
					sListeBat += [" "] + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__
					sListeFond += [" "] + __DOC_LTR_FOND__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__
				fin
			fin

			si stDocument.EstUploadé = Vrai alors
				selon Vrai
					cas stDocument.IdModele > 0
						// On déplace les documents PDF du modèle
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

							// On enregistre les images BAT
							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageBat..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

							// On enregistre les images fond
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

							// On enregistre les images BAT
							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageBat..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

							// On enregistre les images fond
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

						// On enregistre les images BAT
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

						// On enregistre les images fond
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
				stDocument.EstUploadé = Faux
			fin
		fin

		SupprimeFichiersInutiles(stOperation.TypeOperation)


	cas __OPERATION_SMARTEVA__, __OPERATION_TRACTEVA__

		TraceFin()

		// On sauvegarde le bat Enveloppe Personnalisée
		si fFichierExiste(sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__) alors
			si pas fSupprime(sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__) alors
				Trace("Erreur supprimer Enveloppe", ErreurInfo(errComplet))
			fin
		fin
		si stOperation.stOperationTract.EnveloppeApercuPersonnalisée.CheminPhysique <> "" alors
			si pas fDéplaceFichier(stOperation.stOperationTract.EnveloppeApercuPersonnalisée.CheminPhysique, sRepertoireBat + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__) alors
				Trace("Erreur déplace Enveloppe", ErreurInfo(errComplet))
			fin
		fin

		// Si SmartEva on mémorise dans la liste des vignettes bat
		si stOperation.TypeOperation = __OPERATION_SMARTEVA__ alors
			sListeBat += [" "] + __DOC_ENV_BAT__ + stOperation.IdOperation + __JPG__
		fin

		pour tout stDocument de stOperation.stOperationTract.tabStDocument
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
										fDéplaceFichier(sRepertoireClient + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								cas ltr_modele.IdMarque > 0
									sRepertoireMarque = CheminMarque(ltr_modele.IdMarque, __OPERATION_COURRIER__, __REP_MODELE__, Vrai)
									si fFichierExiste(sRepertoireMarque + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__) alors
										si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
											fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
										fin
										fDéplaceFichier(sRepertoireMarque + __DOC_LTR_MODELE__ + stDocument.IdModele + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								autre cas : STOP
							fin

							// On enregistre les images BAT
							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageBat..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

							// On enregistre les images fond
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
										fDéplaceFichier(sRepertoireClient + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								cas ltr_document_client.IdMarque > 0
									sRepertoireMarque = CheminMarque(ltr_document_client.IdMarque, __OPERATION_COURRIER__, __REP_DOCUMENT__, Vrai)
									si fFichierExiste(sRepertoireMarque + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__) alors
										si fFichierExiste(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__) alors
											fSupprime(sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
										fin
										fDéplaceFichier(sRepertoireMarque + __DOC_LTR_CLIENT__ + stDocument.IdDocumentClient + __PDF__, sRepertoireDocument + __DOC_LTR__ + stDocument.IdLettreContenu + __PDF__)
									fin

								autre cas : STOP
							fin

							// On enregistre les images BAT
							pour NumPage = 1 _à_ stDocument.NombrePage
								si fFichierExiste(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__) alors
									fSupprime(sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
								si stDocument.tabImageBat..Occurrence >= NumPage alors
									fCopieFichier(stDocument.tabImageBat[NumPage].CheminPhysique, sRepertoireBat + __DOC_LTR_BAT__ + stDocument.IdLettreContenu + "p" + NumPage + __JPG__)
								fin
							fin

							// On enregistre les images fond
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

						// On enregistre les images BAT
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

						// On enregistre les images fond
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
				stDocument.EstUploadé = Faux
			fin
		fin

		SupprimeFichiersInutiles(stOperation.TypeOperation)

	autre cas

fin


	procédure interne SupprimeFichiersInutiles(pTypeOperation)
		sListeFichier, sFichier sont des chaînes
		selon pTypeOperation
			cas __OPERATION_COURRIER__, __OPERATION_TRACTEVA__, __OPERATION_SMARTEVA__

				// On supprime les fichiers qui ne devraient pas être présents dans le répertoire des documents
				sListeFichier = fListeFichier(sRepertoireDocument + "*.*", frNonRécursif)
				pour toute chaîne sFichier de sListeFichier séparée par RC
					si pas Contient(sListeDocument, fExtraitChemin(sFichier, fFichier + fExtension), MotComplet) alors
						fSupprime(sFichier)
					fin
				fin

				// On supprime les fichiers qui ne devraient pas être présents dans le répertoire des BAT
				sListeFichier = fListeFichier(sRepertoireBat + "*.*", frNonRécursif)
				pour toute chaîne sFichier de sListeFichier séparée par RC
					si pas Contient(sListeBat, fExtraitChemin(sFichier, fFichier + fExtension), MotComplet) alors
						fSupprime(sFichier)
					fin
				fin

				// On supprime les fichiers qui ne devraient pas être présents dans le répertoire des fonds
				sListeFichier = fListeFichier(sRepertoireFond + "*.*", frNonRécursif)
				pour toute chaîne sFichier de sListeFichier séparée par RC
					si pas Contient(sListeFond, fExtraitChemin(sFichier, fFichier + fExtension), MotComplet) alors
						fSupprime(sFichier)
					fin
				fin

			autre cas

		fin

	fin
	
	
**** Code de la procédure PdfAnalyseDocument()

procédure PdfAnalyseDocument(stDocument est une structDocument)

sMessageErreur			est une chaîne
stResultat				est un stPyMuPdfResultat
stPagePdf				est une structPagePdf
nIdFormatImpression	est un entier
bEstNonStandard		est un booléen
rLargeurInterne		est un réel
rHauteurInterne		est un réel
rLargeurExterne		est un réel
rHauteurExterne		est un réel
rLargeurFormat			est un réel
rHauteurFormat			est un réel
// Variables pour la détection et l'injection du fond perdu sans boîtes PDF
rFondPerduDetecte		est un réel		// Valeur de fond perdu détectée (mm) — 0 si non détecté
bInjectionTentee		est un booléen	// Vrai = injection déjà tentée (évite appels multiples)
nIdFormatTest			est un entier	// IdFormatImpression retourné lors de la tentative
rLargeurFormatTest	est un réel		// Largeur format retournée lors de la tentative
rHauteurFormatTest	est un réel		// Hauteur format retournée lors de la tentative

stDocument.tabPagePDF.SupprimeTout()


// =========================================================================
// VÉRIFICATION : Le fichier existe t'il ?
// =========================================================================
si pas fFichierExiste(stDocument.Repertoire + stDocument.NomFichierTemp) alors
	sMessageErreur = "Document n'existe pas"
	renvoyer sMessageErreur
fin

// =========================================================================
// APPEL API PyMuPdfExtract
// =========================================================================
stResultat = cpPyMuPdfExtract.PyMuPdfExtract(stDocument.Repertoire + stDocument.NomFichierTemp)

// =========================================================================
// VÉRIFICATION : Succès de l'appel API
// =========================================================================
si stResultat.success = Faux alors
	sMessageErreur = "Erreur lors de l'analyse du PDF"
	si stResultat.erreurs..Occurrence > 0 alors
		sMessageErreur += " : " + stResultat.erreurs[1]
	fin
	renvoyer sMessageErreur
fin

// =========================================================================
// VÉRIFICATION : Est-ce un PDF valide ?
// =========================================================================
si stResultat.estUnPdf = Faux alors
	sMessageErreur = "Le fichier sélectionné n'est pas un PDF valide"
	renvoyer sMessageErreur
fin

// =========================================================================
// VÉRIFICATION : Mot de passe requis ?
// =========================================================================
si stResultat.securite.needsPassword > 0 alors
	sMessageErreur = "Document protégé par un mot de passe"
	renvoyer sMessageErreur
fin

// =========================================================================
// VÉRIFICATION : Impression autorisée ?
// =========================================================================
si stResultat.securite.Permissions.print = Faux alors
	sMessageErreur = "L'impression n'est pas autorisée sur ce PDF"
	renvoyer sMessageErreur
fin

// =========================================================================
// VÉRIFICATION : Nombre de pages attendu
// =========================================================================
si stDocument.NombrePage > 0 _et_ stResultat.nombrePages <> stDocument.NombrePage alors
	fSupprime(stDocument.Repertoire + stDocument.NomFichierTemp)
	sMessageErreur = "Nombre de page incorrect"
	renvoyer sMessageErreur
fin

stDocument.NombrePage = stResultat.nombrePages

// =========================================================================
// TRAITEMENT : Parcours de chaque page
// =========================================================================
pour tout stPage de stResultat.pages
	VariableRAZ(stPagePdf)
	stPagePdf.NumeroPage				= stPage.numero
	stPagePdf.Rotation				= stPage.rotation

	// -----------------------------------------------------------------
	// Dimensions brutes depuis l'API (déjà en mm)
	// TrimBox = format fini (interne), BleedBox = avec fond perdu (externe)
	// -----------------------------------------------------------------
	rLargeurInterne					= stPage.trimbox.largeurMm
	rHauteurInterne					= stPage.trimbox.hauteurMm
	rLargeurExterne					= stPage.bleedbox.largeurMm
	rHauteurExterne					= stPage.bleedbox.hauteurMm

	// Coordonnées exactes des boîtes PDF (pour normalize_bleedbox et inject)
	stPagePdf.MediaBoxXMm			= stPage.mediabox.xMm
	stPagePdf.MediaBoxYMm			= stPage.mediabox.yMm
	stPagePdf.MediaBoxLargeurMm	= stPage.mediabox.largeurMm
	stPagePdf.MediaBoxHauteurMm	= stPage.mediabox.hauteurMm

	stPagePdf.BleedBoxXMm			= stPage.bleedbox.xMm
	stPagePdf.BleedBoxYMm			= stPage.bleedbox.yMm
	stPagePdf.BleedBoxLargeurMm	= stPage.bleedbox.largeurMm
	stPagePdf.BleedBoxHauteurMm	= stPage.bleedbox.hauteurMm

	stPagePdf.TrimBoxXMm				= stPage.trimbox.xMm
	stPagePdf.TrimBoxYMm				= stPage.trimbox.yMm
	stPagePdf.TrimBoxLargeurMm		= stPage.trimbox.largeurMm
	stPagePdf.TrimBoxHauteurMm		= stPage.trimbox.hauteurMm

	Trace("=== DIAGNOSTIC FOND PERDU ===")
	Trace("LargeurInterne", rLargeurInterne)
	Trace("HauteurInterne", rHauteurInterne)
	Trace("LargeurExterne", rLargeurExterne)
	Trace("HauteurExterne", rHauteurExterne)
	Trace("MediaBoxLargeurMm", stPagePdf.MediaBoxLargeurMm)
	Trace("MediaBoxHauteurMm", stPagePdf.MediaBoxHauteurMm)
	Trace("BleedBoxLargeurMm", stPagePdf.BleedBoxLargeurMm)
	Trace("BleedBoxHauteurMm", stPagePdf.BleedBoxHauteurMm)
	Trace("TrimBoxLargeurMm", stPagePdf.TrimBoxLargeurMm)
	Trace("TrimBoxHauteurMm", stPagePdf.TrimBoxHauteurMm)

	// -----------------------------------------------------------------
	// Détection du fond perdu (BleedBox > TrimBox)
	// -----------------------------------------------------------------
	si stPage.fondPerdu.minimum > 0 alors
		stPagePdf.EstFondPerdu				= Vrai
		stPagePdf.FondPerduHautMm		= stPage.fondPerdu.haut
		stPagePdf.FondPerduBasMm		= stPage.fondPerdu.bas
		stPagePdf.FondPerduGaucheMm	= stPage.fondPerdu.Gauche
		stPagePdf.FondPerduDroiteMm	= stPage.fondPerdu.Droite
		stPagePdf.FondPerduMinimumMm	= stPage.fondPerdu.minimum

		// Avec fond perdu : tolérance serrée (3mm)
		nIdFormatImpression				= PdfRechercheFormatImpression(rLargeurInterne, rHauteurInterne, 3, rLargeurFormat, rHauteurFormat)
	sinon
		stPagePdf.EstFondPerdu	= Faux
		// Tolérance large (15mm)
		nIdFormatImpression				= PdfRechercheFormatImpression(rLargeurInterne, rHauteurInterne, 15, rLargeurFormat, rHauteurFormat)
	fin

	stPagePdf.IdFormatImpression		= nIdFormatImpression
	stPagePdf.LargeurFormat				= rLargeurFormat
	stPagePdf.HauteurFormat				= rHauteurFormat

	si nIdFormatImpression = 0 alors
		bEstNonStandard = Vrai
	fin

	// -----------------------------------------------------------------
	// Vérification format attendu (si renseigné)
	// -----------------------------------------------------------------
	si stDocument.LargeurOuvert > 0 _et_ stDocument.HauteurOuvert > 0 alors
		si stDocument.LargeurOuvert < stDocument.HauteurOuvert alors
			// Attendu en portrait
			si stDocument.LargeurOuvert <> Min(stPagePdf.LargeurFormat, stPagePdf.HauteurFormat) _ou_
				stDocument.HauteurOuvert <> Max(stPagePdf.LargeurFormat, stPagePdf.HauteurFormat) alors
				fSupprime(stDocument.Repertoire + stDocument.NomFichierTemp)
				sMessageErreur = "Format de document incorrect"
				renvoyer sMessageErreur
			fin
		sinon
			// Attendu en paysage
			si stDocument.HauteurOuvert <> Min(stPagePdf.LargeurFormat, stPagePdf.HauteurFormat) _ou_
				stDocument.LargeurOuvert <> Max(stPagePdf.LargeurFormat, stPagePdf.HauteurFormat) alors
				fSupprime(stDocument.Repertoire + stDocument.NomFichierTemp)
				sMessageErreur = "Format de document incorrect"
				renvoyer sMessageErreur
			fin
		fin
	fin

	// -----------------------------------------------------------------
	// Contrôle de cohérence : fond perdu attendu vs fond perdu réel
	// -----------------------------------------------------------------
	si stDocument.EstFondPerdu = Vrai _et_ stPagePdf.EstFondPerdu = Faux alors

		// Tentative de détection : PDF exporté avec fond perdu dans les dimensions
		// de page sans TrimBox/BleedBox définies (erreur fréquente des exporteurs).
		// rLargeurInterne et rHauteurInterne valent ici les dimensions de la MediaBox
		// entière (puisque TrimBox hérite de MediaBox quand aucune boîte n'est définie).
		// On ne tente l'injection qu'une seule fois pour tout le document.
		si bInjectionTentee = Faux alors
			bInjectionTentee	= Vrai
			rFondPerduDetecte	= 0

			// Un seul appel avec marge 15mm
			// La fonction cherche un format fini dont les dimensions sont
			nIdFormatTest = PdfRechercheFormatImpression(rLargeurInterne, rHauteurInterne, 15, rLargeurFormatTest, rHauteurFormatTest)

			si nIdFormatTest > 0 alors
				// Calculer le fond perdu depuis l'écart entre PDF et format fini
				// Le fond perdu doit être identique sur X et Y (symétrie obligatoire)
				rFondPerduX	est un réel	= (rLargeurInterne - rLargeurFormatTest) / 2
				rFondPerduY	est un réel	= (rHauteurInterne - rHauteurFormatTest) / 2

				si Abs(rFondPerduX - rFondPerduY) <= 0.5 _et_ rFondPerduX >= 1 alors
					rFondPerduDetecte = Arrondi(rFondPerduX, 1)
				fin
			fin

			// Format fini identifié → injection des boîtes dans le PDF
			si rFondPerduDetecte > 0 alors
				sUrlInject est une chaîne = "http://localhost:5000/PyMuPdfExtract/inject_trim_bleed_boxes" +...
				"?file=" + URLEncode(stDocument.Repertoire + stDocument.NomFichierTemp) +...
				"&trim_x=" + rFondPerduDetecte +...
				"&trim_y=" + rFondPerduDetecte +...
				"&trim_w=" + rLargeurFormatTest +...
				"&trim_h=" + rHauteurFormatTest +...
				"&bleed=" + rFondPerduDetecte


				hInject		est une httpRequête
				hRepInject	est un httpRéponse

				hInject.URL			= sUrlInject
				hInject.Méthode	= httpGet
				hRepInject			= hInject.Envoie()
				
				si hRepInject.CodeEtat = 200 alors
					vInject est un Variant = JSONVersVariant(hRepInject.Contenu)
					si vInject.success = Vrai alors
						Trace("InjectTrimBleedBoxes : injected=" + vInject.injected + " / bleedMm=" + vInject.bleedMm)
					sinon
						Trace("InjectTrimBleedBoxes : erreur API = " + vInject.erreur)
						rFondPerduDetecte = 0
					fin
				sinon
					Trace("InjectTrimBleedBoxes : HTTP " + hRepInject.CodeEtat)
					rFondPerduDetecte = 0
				fin
			fin
		fin


		// Fond perdu non détectable ou injection échouée → rejet
		si rFondPerduDetecte = 0 alors
			fSupprime(stDocument.Repertoire + stDocument.NomFichierTemp)
			sMessageErreur = "Votre document a été déclaré avec fond perdu" + RC + "mais aucun fond perdu n'a été détecté dans le PDF"
			renvoyer sMessageErreur
		fin

		// Injection réussie : mettre à jour stPagePdf pour la suite du traitement
		stPagePdf.EstFondPerdu				= Vrai
		stPagePdf.FondPerduHautMm			= rFondPerduDetecte
		stPagePdf.FondPerduBasMm			= rFondPerduDetecte
		stPagePdf.FondPerduGaucheMm		= rFondPerduDetecte
		stPagePdf.FondPerduDroiteMm		= rFondPerduDetecte
		stPagePdf.FondPerduMinimumMm		= rFondPerduDetecte

		// TrimBox = format fini centré dans la MediaBox
		stPagePdf.TrimBoxXMm					= rFondPerduDetecte
		stPagePdf.TrimBoxYMm					= rFondPerduDetecte
		stPagePdf.TrimBoxLargeurMm			= rLargeurInterne - 2 * rFondPerduDetecte
		stPagePdf.TrimBoxHauteurMm			= rHauteurInterne - 2 * rFondPerduDetecte

		// BleedBox = MediaBox (déjà stockée dans stPagePdf.MediaBox* ci-dessus)
		stPagePdf.BleedBoxXMm				= stPagePdf.MediaBoxXMm
		stPagePdf.BleedBoxYMm				= stPagePdf.MediaBoxYMm
		stPagePdf.BleedBoxLargeurMm		= stPagePdf.MediaBoxLargeurMm
		stPagePdf.BleedBoxHauteurMm		= stPagePdf.MediaBoxHauteurMm

		// Mettre à jour les variables locales utilisées par le bloc rotation ci-dessous
		// rLargeurExterne / rHauteurExterne restent inchangées (BleedBox = MediaBox = correct)
		rLargeurInterne						= stPagePdf.TrimBoxLargeurMm
		rHauteurInterne						= stPagePdf.TrimBoxHauteurMm

		// Recalculer IdFormatImpression avec les dimensions du format fini (TrimBox)
		nIdFormatImpression					= PdfRechercheFormatImpression(rLargeurInterne, rHauteurInterne, 3, rLargeurFormat, rHauteurFormat)
		stPagePdf.IdFormatImpression		= nIdFormatImpression
		stPagePdf.LargeurFormat				= rLargeurFormat
		stPagePdf.HauteurFormat				= rHauteurFormat

		// Réinitialiser bEstNonStandard si le format est maintenant reconnu
		// (il avait pu être mis Vrai lors de la recherche initiale avec les dimensions brutes)
		si nIdFormatImpression > 0 alors
			bEstNonStandard = Faux
		fin

	fin

	// -----------------------------------------------------------------
	// Contrôle : fond perdu doit être symétrique (même valeur sur les 4 côtés)
	// PrintShop Mail ne supporte qu'une valeur unique de bleed
	// -----------------------------------------------------------------
	si stPagePdf.EstFondPerdu alors
		si stPagePdf.FondPerduHautMm <> stPagePdf.FondPerduBasMm _ou_
			stPagePdf.FondPerduGaucheMm <> stPagePdf.FondPerduDroiteMm _ou_
			stPagePdf.FondPerduHautMm <> stPagePdf.FondPerduGaucheMm alors
			fSupprime(stDocument.Repertoire + stDocument.NomFichierTemp)
			sMessageErreur = "Le fond perdu du document doit être identique sur les 4 côtés" + RC +
			"Haut : " + stPagePdf.FondPerduHautMm + "mm — " +
			"Bas : " + stPagePdf.FondPerduBasMm + "mm — " +
			"Gauche : " + stPagePdf.FondPerduGaucheMm + "mm — " +
			"Droite : " + stPagePdf.FondPerduDroiteMm + "mm"
			renvoyer sMessageErreur
		fin
	fin

	// -----------------------------------------------------------------
	// Gestion de la rotation : ajuster les dimensions
	// -----------------------------------------------------------------
	selon stPage.rotation
		cas 0
			stPagePdf.LargeurInterne	= rLargeurInterne
			stPagePdf.HauteurInterne	= rHauteurInterne
			stPagePdf.LargeurExterne	= rLargeurExterne
			stPagePdf.HauteurExterne	= rHauteurExterne

		cas 90, 270
			// Rotation : permuter largeur et hauteur
			stPagePdf.LargeurInterne	= rHauteurInterne
			stPagePdf.HauteurInterne	= rLargeurInterne
			stPagePdf.LargeurExterne	= rHauteurExterne
			stPagePdf.HauteurExterne	= rLargeurExterne

		cas 180
			// 180° : dimensions identiques
			stPagePdf.LargeurInterne	= rLargeurInterne
			stPagePdf.HauteurInterne	= rHauteurInterne
			stPagePdf.LargeurExterne	= rLargeurExterne
			stPagePdf.HauteurExterne	= rHauteurExterne

		autre cas
			bEstNonStandard = Vrai
	fin

	// -----------------------------------------------------------------
	// Orientation
	// -----------------------------------------------------------------
	si stPagePdf.LargeurInterne < stPagePdf.HauteurInterne alors
		stPagePdf.EstPortrait = Vrai
	sinon
		stPagePdf.EstPortrait = Faux
	fin

	stDocument.tabPagePDF.Ajoute(stPagePdf)
fin

// =========================================================================
// VÉRIFICATION : Format non standard détecté
// =========================================================================
si bEstNonStandard = Vrai alors
	fSupprime(stDocument.Repertoire + stDocument.NomFichierTemp)
	sMessageErreur = "Format de document non standard"
	renvoyer sMessageErreur
fin

sMessageErreur = ""
renvoyer sMessageErreur


**** Code de la procédure GénéreVignetteDocument() :

procédure GenereVignetteDocument(pPdf, pVignettes, pEstFondPerdu = Faux, pLargeurExterneMm = 0, pHauteurExterneMm = 0)

sRepertoirePhysique	est une chaîne	= cpProjet.__sRepRacine + cpProjet.__sRepUpload + ["\"]
sCheminRelatif			est une chaîne	= cpProjet.__sHttpMarketeam + cpProjet.__sRepUpload + ["/"]
tabVignette				est un tableau de structDocumentImage
stVignette				est une structDocumentImage
sLigneDeCommande		est une chaîne
sTexte					est une chaîne
sLigneCommande			est une chaîne	= INILit("GHOSTSCRIPT", "CHEMIN", "", NomFichierIni())
nNbrPage					est un entier	= PDFNombreDePages(sRepertoirePhysique + pPdf)
sOptionBox				est une chaîne
nLargeurPt				est un entier
nHauteurPt				est un entier

// ─── Choix de la commande selon présence ou absence de fond perdu ─────────
si pEstFondPerdu alors
	// Fond perdu : BleedBox, dimensions explicites en points
	// -dPDFFitPage supprimé car il écrase -dUseBleedBox et force le rendu TrimBox
	sOptionBox	= "-dUseBleedBox"
	nLargeurPt	= Arrondi(pLargeurExterneMm * 2.834645669, 0)
	nHauteurPt	= Arrondi(pHauteurExterneMm * 2.834645669, 0)
//	sTexte		=
//	[
//		"%1" -sDEVICE=jpeg -dNOPAUSE -dBATCH -dNOPROMPT -r300 -dJPEGQ=100 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dDEVICEWIDTHPOINTS=%5 -dDEVICEHEIGHTPOINTS=%6 %4 -o "%3" "%2"
//	]
	sTexte =
	[
		"%1" -sDEVICE=jpeg -dNOPAUSE -dBATCH -dNOPROMPT -r300 -dJPEGQ=100 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dFIXEDMEDIA -dDEVICEWIDTHPOINTS=%5 -dDEVICEHEIGHTPOINTS=%6 %4 -o "%3" "%2"
	]
sinon
	// Pas de fond perdu : TrimBox, -dPDFFitPage pour ajuster automatiquement
	sOptionBox	= "-dUseTrimBox"
	sTexte		=
	[
		"%1" -sDEVICE=jpeg -dNOPAUSE -dBATCH -dPDFFitPage -dNOPROMPT -r300 -dJPEGQ=100 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 %4 -o "%3" "%2"
	]
fin

si sLigneCommande <> "" alors

	si pEstFondPerdu alors
		sLigneDeCommande = ChaîneConstruit(sTexte, sLigneCommande, sRepertoirePhysique + pPdf, sRepertoirePhysique + pVignettes + "p%01d.jpg", sOptionBox, nLargeurPt, nHauteurPt)
	sinon
		sLigneDeCommande = ChaîneConstruit(sTexte, sLigneCommande, sRepertoirePhysique + pPdf, sRepertoirePhysique + pVignettes + "p%01d.jpg", sOptionBox)
	fin

	si pas LanceAppli(sLigneDeCommande, exeIconise, exeBloquant, sRepertoirePhysique) alors
		<compile si TypeConfiguration <> Webservice>
			Info("Erreur :", ErreurInfo(errComplet))
		<fin>
	fin

	pour nPage = 1 _à_ nNbrPage
		stVignette.CheminPhysique	= sRepertoirePhysique + pVignettes + "p" + nPage + __JPG__
		stVignette.CheminRelatif	= sCheminRelatif + pVignettes + "p" + nPage + __JPG__
		tabVignette.Ajoute(stVignette)
	fin

sinon
	<compile si TypeConfiguration <> Webservice>
		Info("Erreur :", "Convertisseur non implémenté !")
	<fin>
fin

renvoyer tabVignette


**** Code de la procédure ComposerJsonDesignerCreation() :

procédure ComposerJsonDesignerCreation(stOperation est une structOperation, pTabEchantillon est un tableau de StructBaseLigne, pTheme est une chaîne, pEstEnveloppe est un booléen, pIndexDocument est un entier, pLimTexte est un entier = 0, pLimImage est un entier = 0, pLimBarcode est un entier = 0, pLimQr est un entier = 0)
stLoad			est une structDesignerLoad
sJsonDocument	est une chaîne

// =========================================================================
// BLOCS D'ENVIRONNEMENT (communs enveloppe / document)
// =========================================================================
stLoad.action					= "load"
stLoad.auth						= RemplirDesignerAuth(stOperation.IdClient, stOperation.IdContact)
stLoad.bases					= RemplirDesignerBases(stOperation.tabBase)
stLoad.constraints			= RemplirDesignerConstraints(pLimTexte, pLimImage, pLimQr, pLimBarcode)
stLoad.limites					= RemplirDesignerLimites()
stLoad.policesDisponibles	= RemplirDesignerPolices(stOperation.IdClient)
stLoad.Theme					= pTheme

// =========================================================================
// BLOCS DOCUMENT (data) - variables selon enveloppe ou document
// =========================================================================
si pEstEnveloppe alors

	// -----------------------------------------------------------------
	// ENVELOPPE
	// -----------------------------------------------------------------

	// Identification : libellé depuis l'enveloppe
	stLoad.Document.identification	= RemplirDesignerIdentification(stOperation.CodeTemp, "enveloppe", 1, stOperation.stOperationLettre.stEnveloppe.Libelle)

	// Format : pas de fond perdu pour l'enveloppe
	stLoad.Document.formatDocument	= RemplirDesignerFormat(stOperation.stOperationLettre.stEnveloppe.Largeur, stOperation.stOperationLettre.stEnveloppe.Hauteur, Faux, 0, 0, 0, 0)

	// Pages : recto seul, image de fond = aperçu vierge de l'enveloppe
	tabImagesEnv est un tableau de structDocumentImage
	tabImagesEnv.Ajoute(stOperation.stOperationLettre.stEnveloppe.EnveloppeFond)

	sCheminPdfEnv est une chaîne = cpProjet.__sRepRacine + "Enveloppes\" + stOperation.stOperationLettre.stEnveloppe.FichierApercu + __PDF__

	stLoad.Document.pages = RemplirDesignerPages(Faux, tabImagesEnv, sCheminPdfEnv)

	// Zones système enveloppe (A.11)
	// Adresse destinataire + séquentiel toujours
	// Datamatrix + mention La Poste
	RemplirDesignerZonesSystemeEnveloppe(stLoad.Document, stOperation.stOperationLettre.IdEnveloppe)

	// Zones personnalisables Adressage Expéditeur, Logo, Image promotionnelle
	si stOperation.stOperationLettre.stEnveloppe.EstAdressageExpediteur _ou_ stOperation.stOperationLettre.stEnveloppe.EstAdressageLogo _ou_ stOperation.stOperationLettre.stEnveloppe.EstAdressagePromotion alors
		stLoad.ZonePersonnalisation = RemplirDesignerZonesPersonnalisablesEnveloppe(stLoad.Document, stOperation.stOperationLettre.stEnveloppe)
	fin

sinon

	// -----------------------------------------------------------------
	// DOCUMENT
	// -----------------------------------------------------------------

	// Variable intermédiaire pour faciliter la lecture (copie, suffisant en lecture seule)
	stDoc est une structDocument = stOperation.stOperationLettre.tabStDocument[pIndexDocument]

	// Identification : libellé depuis le document
	stLoad.Document.identification = RemplirDesignerIdentification(stOperation.CodeTemp, "lettre", pIndexDocument, stDoc.Designation)

	// Format : fond perdu depuis les dimensions détaillées de structPagePdf
	si stDoc.EstFondPerdu _et_ stDoc.tabPagePDF..Occurrence >= 1 alors
		// Lecture du format papier associé (SRA4, SRA3...) depuis BDD
		nFormatPapierLargeur	est un réel		= 0
		nFormatPapierHauteur	est un réel		= 0
		nIdFormatImpression		est un entier	= stDoc.tabPagePDF[1].IdFormatImpression

		si ltr_format_impression.LitRecherchePremier(IdFormatImpression, nIdFormatImpression) alors
			si ltr_format_impression.IdFormatPapier > 0 alors
				si ltr_format_impression.LitRecherchePremier(IdFormatImpression, ltr_format_impression.IdFormatPapier) alors
					nFormatPapierLargeur	= ltr_format_impression.Largeur
					nFormatPapierHauteur	= ltr_format_impression.Hauteur
				fin
			fin
		fin

		stLoad.Document.formatDocument = RemplirDesignerFormat(
		stDoc.LargeurOuvert, stDoc.HauteurOuvert,
		Vrai,
		stDoc.tabPagePDF[1].FondPerduHautMm,
		stDoc.tabPagePDF[1].FondPerduBasMm,
		stDoc.tabPagePDF[1].FondPerduGaucheMm,
		stDoc.tabPagePDF[1].FondPerduDroiteMm,
		nFormatPapierLargeur,
		nFormatPapierHauteur)

	sinon
		stLoad.Document.formatDocument = RemplirDesignerFormat(stDoc.LargeurOuvert, stDoc.HauteurOuvert, Faux, 0, 0, 0, 0)
	fin

	// Pages : recto seul ou recto/verso, images de fond depuis tabImageFond
	stLoad.Document.pages = RemplirDesignerPages(stDoc.EstRectoVerso, stDoc.tabImageFond, stDoc.Repertoire + stDoc.NomFichierTemp)

	// Zone adresse destinataire si document porte-adresse (A.12)
	// Condition : enveloppe à fenêtre ET c'est le document 1 (porte-adresse)
	si stOperation.stOperationLettre.EstEnveloppeFenetre = Vrai _et_ pIndexDocument = 1
		RemplirDesignerZonesSystemeDocument(stLoad.Document, stOperation.stOperationLettre.IdEnveloppe)
	fin



fin


// =========================================================================
// BLOCS COMMUNS enveloppe / document
// =========================================================================

// Champs de fusion disponibles
stLoad.Document.champsFusion	= RemplirDesignerChampsFusion(stOperation.taaBaseChamp)

// Données d'aperçu (échantillon publipostage)
stLoad.Document.donneesApercu	= RemplirDesignerApercu(pTabEchantillon, stOperation.taaBaseChamp)


// Polices utilisées : vide en création (aucune police encore utilisée)
// Zones texte, image, QR, code-barres utilisateur : vides en création

// =========================================================================
// SÉRIALISATION EN JSON
// =========================================================================

Trace("cheminFond page 1 = [" + stLoad.Document.pages[1].cheminFond + "]")
Trace("Nombre de pages = " + stLoad.Document.pages..Occurrence)

Sérialise(stLoad, sJsonDocument, psdJSON + psdMiseEnForme)

sJsonDocument = sJsonDocument.Remplace("""##Null##""","null")

renvoyer sJsonDocument


**** Code de la procédure GenererPsmdServeurEnveloppe() :

procédure GenererPsmdServeurEnveloppe(stEnveloppe est une StructEnveloppe, pCodeTemp est une chaîne)

sNodeExe				est une chaîne	= INILit("NODE", "CHEMIN", "", NomFichierIni())
sNodeCli				est une chaîne	= INILit("NODE", "CLI",    "", NomFichierIni())
sRepUpload			est une chaîne
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

// ─── Construction des chemins ────────────────────────────────────────────
sRepUpload			= cpProjet.__sMarketeamRepRacine + cpProjet.__sRepUpload + "\"
sNomFichierPsmd	= __DOC_ENV_PSMD__ + pCodeTemp + ".psmd"
sCheminPsmd			= sRepUpload + sNomFichierPsmd
sCheminJsonTemp	= sRepUpload + "psmd_json_env_" + pCodeTemp + ".tmp"

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
// SI fFichierExiste(sCheminJsonTemp) ALORS fSupprime(sCheminJsonTemp) FIN

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

**** Code de la procédure SelectionAdressage() :

procédure SelectionAdressage()

__stOperation.stOperationLettre.stEnveloppe.EstAdressageExpediteur	= intAdressageExpediteur
__stOperation.stOperationLettre.stEnveloppe.EstAdressageLogo			= intAdressageLogo
__stOperation.stOperationLettre.stEnveloppe.EstAdressagePromotion		= intAdressagePromotion
__stOperation.stOperationLettre.stEnveloppe.JsonDesignerData			= cpDesigner.ComposerJsonDesignerCreation(__stOperation, __tabEchantillonBaseLigne, __stOperation.TypeOperation, Vrai, 0)


si intAdressageExpediteur = Faux _et_ intAdressageLogo = Faux _et_ intAdressagePromotion = Faux alors
	btnEnveloppePersonnaliser.Visible	= Faux
	btnEnveloppeSupprimer.Visible			= Faux
	btnEnveloppeAperçu.Visible				= Faux
	btnEnveloppeModèle.Visible				= Faux
	cboEnveloppeSelection.Etat				= Actif
sinon
	btnEnveloppePersonnaliser..Visible	= (cboEnveloppeSelection..ValeurMémorisée <= 0)
//	btnEnveloppeApercu..Visible			= (cboEnveloppeSelection..ValeurMémorisée <> 0)
//	btnEnveloppeSupprimer..Visible		= (cboEnveloppeSelection..ValeurMémorisée = -1)
//	btnEnveloppeModèle..Visible			= (cboEnveloppeSelection..ValeurMémorisée = -1)
//	cboEnveloppeSelection..Etat			= (cboEnveloppeSelection..ValeurMémorisée = -1) ? AffichageSeulement SINON Actif
fin


**** Code de la procédure InitTboEnveloppeClient() :

procédure InitTboEnveloppeClient()


stEnveloppeClient est une structEnveloppeClient

sTexteRequete est une chaîne
sdReq est une Source de Données <description = ltr_enveloppe_client>

TableauSupprimeTout(_tabEnveloppeClient)

//ListeSupprimeTout(cboEnveloppeSelection)
//ListeAjoute(cboEnveloppeSelection,"< Enveloppe client >" + gLien(null))

sTexteRequete =
[
	SELECT 
	ltr_enveloppe_client.IdEnveloppeClient,
	Libelle,
	EstBloquant,
	ltr_enveloppe_repartition.Quantite - IFNULL((SELECT SUM(QuantiteEnveloppeClient) FROM ope_lettre, dos_operation WHERE dos_operation.IdOperation = ope_lettre.IdLettre AND ope_lettre.IdEnveloppeClient=ltr_enveloppe_client.IdEnveloppeClient AND dos_operation.IdClient= [%__stOperation.IdClient%] AND dos_operation.Statut <> '[%__Statut_Annulée__%]'  AND IdLettre <> [%__stOperation.IdOperation%]),0) QuantiteStock
	FROM
	ltr_enveloppe_repartition, ltr_enveloppe_client
	WHERE
	ltr_enveloppe_client.IdEnveloppeClient  = ltr_enveloppe_repartition.IdEnveloppeClient AND
	ltr_enveloppe_client.IdEnveloppe = [%__stOperation.stOperationLettre.IdEnveloppe%] AND
	ltr_enveloppe_repartition.IdClient = [%__stOperation.IdClient%]
	UNION
	SELECT
	ltr_enveloppe_client.IdEnveloppeClient,
	Libelle,
	EstBloquant,
	QuantiteStock - IFNULL((SELECT SUM(QuantiteEnveloppeClient) FROM ope_lettre, dos_operation WHERE dos_operation.IdOperation = ope_lettre.IdLettre AND ope_lettre.IdEnveloppeClient=ltr_enveloppe_client.IdEnveloppeClient AND dos_operation.Statut <> '[%__Statut_Annulée__%]' AND IdLettre <> [%__stOperation.IdOperation%]),0) QuantiteStock
	FROM
	ltr_enveloppe_client
	WHERE
	ltr_enveloppe_client.IdEnveloppe = [%__stOperation.stOperationLettre.IdEnveloppe%] 
	AND ltr_enveloppe_client.IdClient = [%__stOperation.IdClient%]
	AND NOT EXISTS(SELECT * FROM ltr_enveloppe_repartition WHERE ltr_enveloppe_repartition.IdEnveloppeClient = ltr_enveloppe_client.IdEnveloppeClient LIMIT 1)
	ORDER BY 1
]

si pas HExécuteRequêteSQL(sdReq, ltr_enveloppe_client..Connexion, hRequêteSansCorrection, sTexteRequete) alors
	Info("Erreur requête")
	retour	
fin

pour tout sdReq
	si sdReq.EstBloquant = Faux _ou_ sdReq.QuantiteStock >= __stOperation.NbrDestinataire alors
//		ListeAjoute(cboEnveloppeSelection,sdReq.Libelle + gLien(sdReq.IdEnveloppeClient))
		VariableRAZ(stEnveloppeClient)
		stEnveloppeClient.EstBloquant 		= sdReq.EstBloquant
		stEnveloppeClient.IdEnveloppeClient	= sdReq.IdEnveloppeClient
		stEnveloppeClient.Libelle			= sdReq.Libelle
		Ajoute(_tabEnveloppeClient,stEnveloppeClient)
	fin
fin


fin:
HAnnuleDéclaration(sdReq)



**** Code de la procédure InitCboTypeContenu() :

procédure InitCboTypeContenu(pIdBibliothèque, pIdMarque, pIdSupport, pEstRectoVerso, pEstFondPerdu, pIdSupportGrammage, pIndice)

sTexteRequete				est une chaîne
//sTexteRequeteDocumentClient	est une chaîne
sdReqCbo					est une Source de Données
sWhere						est une chaîne
sWhereDocument				est une chaîne
nModele, nDocumentClient	sont des entiers
bEstBloquant				est un booléen
nQteDisponible				est un entier
sCurdate					est une chaîne


si cpConnexion.__sConnexion	= __CNX_PROD__ alors
	sCurdate = "CURDATE()"
sinon
	sCurdate = "'" + DateSys()	+ "'"
fin

si pIdBibliothèque = BibliothèqueMarque.Valeur alors
	sWhere = "AND ltr_modele.IdMarque = " + pIdMarque
fin

Partage.FiltreBibliothèque(pIdBibliothèque, ltr_modele..Nom, sWhere, Vrai, __stOperation.IdClient)

si pIndice = 1 _et_ __stOperation.stOperationLettre.stEnveloppe.NbrFenetre > 0 alors
	sWhereDocument = "AND EstPorteAdresse = 1"
fin

sTexteRequete =
[
	SELECT
	'M' Mode, 
	IdModele id,
	ltr_modele.Libelle
	FROM
	ltr_modele
	WHERE
	IdSupport = [%pIdSupport%]
	AND EstRectoVerso = [%pEstRectoVerso%]
	AND EstFondPerdu = [%pEstFondPerdu%]
	AND (ltr_modele.DateDebutUtilisation IS NULL OR ltr_modele.DateDebutUtilisation <= [%sCurdate%]) 
	AND (ltr_modele.DateFinUtilisation IS NULL OR ltr_modele.DateDebutUtilisation >= [%sCurdate%]) 
	[%sWhere%]
	[%sWhereDocument%]
]


//
//sTexteRequeteDocumentClient = 
//[
//	UNION
//	
//	SELECT
//	'C' Mode,
//	IdDocumentClient Id,
//	ltr_document_client.Libelle
//	FROM
//	ltr_document_client
//	WHERE
//	(IdMarque IS NULL OR EXISTS(SELECT clt_client_marque.IdMarque FROM clt_client_marque WHERE clt_client_marque.IdClient = IdClient AND clt_mere.IdClient = [%__stOperation.IdClient%])) 
//	AND (IdClient IS NULL OR EXISTS(SELECT clt_mere.IdMere FROM clt_mere WHERE clt_mere.IdMere = IdClient AND clt_mere.IdClient = [%__stOperation.IdClient%]))
//	AND IdSupportGrammage = [%pIdSupportGrammage%] 
//	AND QuantiteStock > 0
//	[%sWhereDocument%]
//]
//

//SI pIndice >  1 _ou_ __stOperation.stOperationLettre.stEnveloppe.NbrFenetre = 0 ALORS
//	sTexteRequete += RC + sTexteRequeteDocumentClient
//FIN


// A FAIRE : ajouter la gestion des dotations via coupons

si pas HExécuteRequêteSQL(sdReqCbo, ltr_modele..Connexion, hRequêteSansCorrection, sTexteRequete) alors
	Info("Erreur requête")
	retour	
fin

znrLtrContenu[pIndice].attCboModeleContenu 	= ""
znrLtrContenu[pIndice].attCboModeleGlien 		= ""

znrLtrContenu[pIndice].attCboDocumentContenu	= ""
znrLtrContenu[pIndice].attCboDocumentGlien 	= ""


pour tout sdReqCbo
	selon sdReqCbo.Mode
		cas "M"
			si VérifieAccèsFonction(TypeOperationVersCodeSupport(__stOperation.TypeOperation,0),PrintModèle) = Vrai alors
				nModele++
				Trace(sdReqCbo.Id,sdReqCbo.Libelle)
				znrLtrContenu[pIndice].attCboModeleContenu 		+= [RC] + sdReqCbo.Libelle + gLien(sdReqCbo.Id) 
				znrLtrContenu[pIndice].attCboModeleGlien 			+= [TAB] + sdReqCbo.Id
			fin
			
		cas "C"
			// on fait les contrôles de quantités sur les documents clients
			(bEstBloquant, nQteDisponible) = Partage.CalculDotationDocumentClient(__stOperation.IdOperation, __stOperation.IdClient, sdReqCbo.Id)
			si nQteDisponible >= __stOperation.NbrDestinataire _ou_ bEstBloquant = Faux alors
				nDocumentClient++
				znrLtrContenu[pIndice].attCboDocumentContenu	 	+= [RC] + sdReqCbo.Libelle + gLien(sdReqCbo.Id)
				znrLtrContenu[pIndice].attCboDocumentGlien 		+= [TAB] + sdReqCbo.Id
			fin
			
		autres cas 
	fin
fin


znrLtrContenu[pIndice].attCboSourceContenu			= "Fichier client"
znrLtrContenu[pIndice].attCboSouceGlien 			= "F"


si nModele > 0 alors
	si nModele > 1 alors
		znrLtrContenu[pIndice].attCboModeleContenu 		= "< Sélection >" + gLien(0) +RC+ znrLtrContenu[pIndice].attCboModeleContenu
		znrLtrContenu[pIndice].attCboModeleGlien 			= 0 +[TAB]+ znrLtrContenu[pIndice].attCboModeleGlien
	fin
	znrLtrContenu[pIndice].attCboSourceContenu 			+= [RC]  + "Modèle"
	znrLtrContenu[pIndice].attCboSouceGlien 				+= [TAB] + "M"
fin

si nDocumentClient > 0 alors
	si nDocumentClient > 1 alors
		znrLtrContenu[pIndice].attCboDocumentContenu 		= "< Sélection >" + gLien(0) +RC+ znrLtrContenu[pIndice].attCboDocumentContenu
		znrLtrContenu[pIndice].attCboDocumentGlien 		= 0 +[TAB]+ znrLtrContenu[pIndice].attCboDocumentGlien
	fin
	znrLtrContenu[pIndice].attCboSourceContenu 			+= [RC]  + "Document client"
	znrLtrContenu[pIndice].attCboSouceGlien 				+= [TAB] + "C"
fin

fin:
HAnnuleDéclaration(sdReqCbo)


**** Code de la procédure BibliothèqueValeurMemorisée() :

procédure BibliothèqueValeurMemorisée(pCboBibliothèque est un Champ, pBibliotheque, pIdMarque)

pBibliotheque	= ExtraitChaîne(pCboBibliothèque.ValeurMémorisée,1,"|")
pIdMarque		= ExtraitChaîne(pCboBibliothèque.ValeurMémorisée,2,"|")



