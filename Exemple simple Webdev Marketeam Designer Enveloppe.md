

// =============================================================================
// EXEMPLE SIMPLE : Enveloppe avec adresse expéditeur + destinataire
// =============================================================================


// =============================================================================
// CODE SERVEUR AJAX
// =============================================================================

stDocument		est une stDesignerDocument
stLoad			est une stDesignerLoad
stContraintes	est une stDesignerConstraints
stBase 			est une stDesignerBase
stAuth 			est une stDesignerAuth
stPage			est une stDesignerPage
stLimites		est une stDesignerLimites
stBaseListe 	est une stDesignerBaseListe

// =============================================================================
// IDENTIFICATION
// =============================================================================
stDocument.identification.idDocument				= "ENV-SIMPLE-2025"
stDocument.identification.nomDocument			= "Enveloppe Simple"
stDocument.identification.dateCreation			= DateVersChaîne(DateSys(), "AAAA-MM-JJ")

// =============================================================================
// FORMAT DOCUMENT (Enveloppe DL : 229mm x 114mm)
// =============================================================================
stDocument.formatDocument.largeurMm				= 229
stDocument.formatDocument.hauteurMm				= 114
stDocument.formatDocument.fondPerdu.actif		= Faux
stDocument.formatDocument.fondPerdu.valeurMm		= 0
stDocument.formatDocument.traitsCoupe.actif		= Faux
stDocument.formatDocument.margeSecurite			= 5
stDocument.formatDocument.largeurMaxImageMm		= 229 / 2
stDocument.formatDocument.hauteurMaxImageMm		= 114 / 2

// =============================================================================
// CHAMPS DE FUSION
// =============================================================================
stChampFusion est une stDesignerChampFusion

stChampFusion.nom		= "Civilite"
stChampFusion.type		= "TXT"
stChampFusion.libelle	= "Civilité"
stChampFusion.ordre		= 1
stDocument.champsFusion.Ajoute(stChampFusion)

stChampFusion.nom		= "Nom"
stChampFusion.libelle	= "Nom"
stChampFusion.type		= "TXT"
stChampFusion.ordre		= 2
stDocument.champsFusion.Ajoute(stChampFusion)

stChampFusion.nom		= "Prenom"
stChampFusion.libelle	= "Prénom"
stChampFusion.type		= "TXT"
stChampFusion.ordre		= 3
stDocument.champsFusion.Ajoute(stChampFusion)

stChampFusion.nom		= "Adresse1"
stChampFusion.libelle	= "Adresse 1"
stChampFusion.type		= "TXT"
stChampFusion.ordre		= 4
stDocument.champsFusion.Ajoute(stChampFusion)

stChampFusion.nom		= "CodePostal"
stChampFusion.libelle	= "Code postal"
stChampFusion.type		= "TXT"
stChampFusion.ordre		= 5
stDocument.champsFusion.Ajoute(stChampFusion)

stChampFusion.nom		= "Ville"
stChampFusion.libelle	= "Ville"
stChampFusion.type		= "TXT"
stChampFusion.ordre		= 6
stDocument.champsFusion.Ajoute(stChampFusion)

stChampFusion.nom		= "Champ1"
stChampFusion.libelle	= "Image"
stChampFusion.type		= "IMG"
stChampFusion.ordre		= 7
stDocument.champsFusion.Ajoute(stChampFusion)


// =============================================================================
// ÉCHANTILLONS DE DONNÉES (pour aperçu)
// =============================================================================
stChamp	est une stDesignerChamp
stEnreg	est une stDesignerEnregistrement

// --- Échantillon 1 ---
VariableRAZ(stEnreg)

VariableRAZ(stChamp)
stChamp.nom		= "Civilite"
stChamp.valeur	= "Monsieur"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Nom"
stChamp.valeur	= "DUPONT"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Prenom"
stChamp.valeur	= "Jean"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Adresse1"
stChamp.valeur	= "12 rue des Lilas"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "CodePostal"
stChamp.valeur	= "75009"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Ville"
stChamp.valeur	= "PARIS"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Champ1"
stChamp.valeur	= "IciBan333.png"
stEnreg.enregistrement.Ajoute(stChamp)

stDocument.donneesApercu.Ajoute(stEnreg)


// --- Échantillon 2 ---
VariableRAZ(stEnreg)

VariableRAZ(stChamp)
stChamp.nom		= "Civilite"
stChamp.valeur	= "Madame"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Nom"
stChamp.valeur	= "MARTIN"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Prenom"
stChamp.valeur	= "Sophie"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Adresse1"
stChamp.valeur	= "45 avenue Victor Hugo"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "CodePostal"
stChamp.valeur	= "69003"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Ville"
stChamp.valeur	= "LYON"
stEnreg.enregistrement.Ajoute(stChamp)

VariableRAZ(stChamp)
stChamp.nom		= "Champ1"
stChamp.valeur	= "IciBan645.png"
stEnreg.enregistrement.Ajoute(stChamp)


stDocument.donneesApercu.Ajoute(stEnreg)

// =============================================================================
// PAGE
// =============================================================================
stPage.nom		= "Recto"
stPage.numero	= 1
stPage.urlFond	= "env-dl-fen-45.png"

stDocument.pages.Ajoute(stPage)

// =============================================================================
// ZONE 1 : Adresse expéditeur (SYSTÈME - non modifiable)
// =============================================================================
stZoneExpediteur est une stDesignerZoneTexte

// --- Identification ---
stZoneExpediteur.id											= "zone-expediteur"
stZoneExpediteur.page										= 1
stZoneExpediteur.nom										= "Adresse expéditeur"
stZoneExpediteur.niveau										= 1
stZoneExpediteur.rotation									= 0

// --- Préférence utilisateur (V3.1) ---
stZoneExpediteur.verrouille									= Faux				// Préférence utilisateur (onglet Personnalisation)

// --- Géométrie ---
stZoneExpediteur.geometrie.xMm								= 10
stZoneExpediteur.geometrie.yMm								= 10
stZoneExpediteur.geometrie.largeurMm						= 80
stZoneExpediteur.geometrie.hauteurMm						= 15

// --- Contenu fixe ---
stZoneExpediteur.contenu									= "CHRONODIRECT" + Caract(10) + "1 Rue Bleue" + Caract(10) + "75009 PARIS"
stZoneExpediteur.supprimerLignesVides						= 0

// --- Style ---
stZoneExpediteur.style.police								= "Roboto"
stZoneExpediteur.style.taillePt								= 10
stZoneExpediteur.style.couleurCmjn.c						= 0
stZoneExpediteur.style.couleurCmjn.m						= 0
stZoneExpediteur.style.couleurCmjn.y						= 0
stZoneExpediteur.style.couleurCmjn.k						= 100
stZoneExpediteur.style.gras									= Faux
stZoneExpediteur.style.interligne							= 1.3
stZoneExpediteur.style.alignementH							= "left"
stZoneExpediteur.style.alignementV							= "middle"

// --- Fond transparent ---
stZoneExpediteur.fond.transparent							= Vrai
stZoneExpediteur.fond.couleurCmjn.c							= 0
stZoneExpediteur.fond.couleurCmjn.m							= 0
stZoneExpediteur.fond.couleurCmjn.y							= 0
stZoneExpediteur.fond.couleurCmjn.k							= 0

// --- Pas de bordure ---
stZoneExpediteur.bordure.epaisseur							= 0
stZoneExpediteur.bordure.couleurCmjn.c						= 0
stZoneExpediteur.bordure.couleurCmjn.m						= 0
stZoneExpediteur.bordure.couleurCmjn.y						= 0
stZoneExpediteur.bordure.couleurCmjn.k						= 0
stZoneExpediteur.bordure.style								= "solid"

// --- Copyfitting ---
stZoneExpediteur.copyfitting.actif							= Faux
stZoneExpediteur.copyfitting.tailleMinimum					= 6
stZoneExpediteur.copyfitting.autoriserRetourLigne			= Faux

// =============================================================================
// CONTRAINTES ZONE EXPEDITEUR (Architecture 3 niveaux V3.1)
// =============================================================================

// --- GEOMETRIE : Contraintes de position et taille ---
stZoneExpediteur.contrainte.geometrie.positionFixe			= Vrai				// Position figée (pas de drag)
stZoneExpediteur.contrainte.geometrie.locked				= Faux				// Contrainte Template : immobile en mode Standard
stZoneExpediteur.contrainte.geometrie.minWMm				= 50				// Largeur min 50mm
stZoneExpediteur.contrainte.geometrie.maxWMm				= 100				// Largeur max 100mm
stZoneExpediteur.contrainte.geometrie.minHMm				= 10				// Hauteur min 10mm
stZoneExpediteur.contrainte.geometrie.maxHMm				= 20				// Hauteur max 20mm
// stZoneExpediteur.contrainte.geometrie.area		= Null				// Pas d'area (zone autorisée)

// --- STYLE : Contraintes d'édition (toutes désactivées pour zone système) ---
stZoneExpediteur.contrainte.style.contenuModifiable			= Faux	// Contenu non modifiable
stZoneExpediteur.contrainte.style.typographieModifiable		= Faux	// Police/taille non modifiable
stZoneExpediteur.contrainte.style.alignementsModifiable		= Faux	// Alignements non modifiables
stZoneExpediteur.contrainte.style.fondModifiable			= Faux	// Fond non modifiable
stZoneExpediteur.contrainte.style.bordureModifiable			= Faux	// Bordure non modifiable

// --- GLOBAL : Contraintes comportementales ---
stZoneExpediteur.contrainte.global.systeme					= Faux	// Zone système (protégée)
stZoneExpediteur.contrainte.global.systemeLibelle			= "Adresse expéditeur"
stZoneExpediteur.contrainte.global.nonSupprimable			= Vrai	// Non supprimable
stZoneExpediteur.contrainte.global.imprimable				= Vrai	// Imprimée
stZoneExpediteur.contrainte.global.selectionnable			= Vrai	// Non sélectionnable
stZoneExpediteur.contrainte.global.toolbarAffichable		= Faux	// Pas de toolbar
stZoneExpediteur.contrainte.global.pageModifiable			= Faux	// Ne peut pas changer de page

// Ajouter au document
stDocument.zonesTexte.Ajoute(stZoneExpediteur)

// =============================================================================
// ZONE 2 : Adresse destinataire (position fixe, contenu modifiable)
// =============================================================================
stZoneDestinataire est une stDesignerZoneTexte

// --- Identification ---
stZoneDestinataire.id										= "zone-destinataire"
stZoneDestinataire.page										= 1
stZoneDestinataire.nom										= "Adresse destinataire"
stZoneDestinataire.niveau									= 2
stZoneDestinataire.rotation									= 0

// --- Préférence utilisateur (V3.1) ---
stZoneDestinataire.verrouille								= Faux				// Préférence utilisateur (onglet Personnalisation)

// --- Géométrie ---
stZoneDestinataire.geometrie.xMm							= 115
stZoneDestinataire.geometrie.yMm							= 49
stZoneDestinataire.geometrie.largeurMm						= 85
stZoneDestinataire.geometrie.hauteurMm						= 45

// --- Contenu avec champs de fusion ---
stZoneDestinataire.contenu									= "@Civilite@ @Nom@ @Prenom@" + Caract(10) + "@Adresse1@" + Caract(10) + "@CodePostal@ @Ville@"
stZoneDestinataire.supprimerLignesVides						= 1

// --- Style ---
stZoneDestinataire.style.police								= "Roboto"
stZoneDestinataire.style.taillePt							= 11
stZoneDestinataire.style.couleurCmjn.c						= 0
stZoneDestinataire.style.couleurCmjn.m						= 0
stZoneDestinataire.style.couleurCmjn.y						= 0
stZoneDestinataire.style.couleurCmjn.k						= 100
stZoneDestinataire.style.gras								= Faux
stZoneDestinataire.style.interligne							= 1.3
stZoneDestinataire.style.alignementH						= "left"
stZoneDestinataire.style.alignementV						= "middle"

// --- Fond transparent ---
stZoneDestinataire.fond.transparent							= Vrai
stZoneDestinataire.fond.couleurCmjn.c						= 0
stZoneDestinataire.fond.couleurCmjn.m						= 0
stZoneDestinataire.fond.couleurCmjn.y						= 0
stZoneDestinataire.fond.couleurCmjn.k						= 0

// --- Pas de bordure ---
stZoneDestinataire.bordure.epaisseur						= 0
stZoneDestinataire.bordure.couleurCmjn.c					= 0
stZoneDestinataire.bordure.couleurCmjn.m					= 0
stZoneDestinataire.bordure.couleurCmjn.y					= 0
stZoneDestinataire.bordure.couleurCmjn.k					= 0
stZoneDestinataire.bordure.style							= "solid"

// --- Copyfitting activé ---
stZoneDestinataire.copyfitting.actif						= Vrai
stZoneDestinataire.copyfitting.tailleMinimum				= 8
stZoneDestinataire.copyfitting.autoriserRetourLigne			= Vrai

// =============================================================================
// CONTRAINTES ZONE DESTINATAIRE (Architecture 3 niveaux V3.1)
// =============================================================================

// --- GEOMETRIE : Position fixe mais taille modifiable dans des bornes ---
stZoneDestinataire.contrainte.geometrie.positionFixe		= Vrai			// Position figée (pas de drag)
stZoneDestinataire.contrainte.geometrie.locked				= Vrai			// Contrainte Template : taille modifiable en mode Standard
stZoneDestinataire.contrainte.geometrie.minWMm				= 0			// Largeur min 70mm
stZoneDestinataire.contrainte.geometrie.maxWMm				= 0			// Largeur max 100mm
stZoneDestinataire.contrainte.geometrie.minHMm				= 0			// Hauteur min 35mm
stZoneDestinataire.contrainte.geometrie.maxHMm				= 0			// Hauteur max 55mm
// stZoneDestinataire.contrainte.geometrie.area			= Null			// Pas d'area

// --- STYLE : Contraintes d'édition (contenu modifiable, style partiel) ---
stZoneDestinataire.contrainte.style.contenuModifiable		= Faux		// Contenu modifiable
stZoneDestinataire.contrainte.style.typographieModifiable	= Faux		// Police/taille NON modifiable (imposés)
stZoneDestinataire.contrainte.style.alignementsModifiable	= Faux		// Alignements modifiables
stZoneDestinataire.contrainte.style.fondModifiable			= Faux		// Fond NON modifiable (transparent imposé)
stZoneDestinataire.contrainte.style.bordureModifiable		= Faux		// Bordure NON modifiable

// --- GLOBAL : Contraintes comportementales ---
stZoneDestinataire.contrainte.global.systeme				= Vrai		// Pas zone système
stZoneDestinataire.contrainte.global.systemeLibelle			= "Adresse Destinataire"
stZoneDestinataire.contrainte.global.nonSupprimable			= Vrai		// Non supprimable
stZoneDestinataire.contrainte.global.imprimable				= Vrai		// Imprimée
stZoneDestinataire.contrainte.global.selectionnable			= Faux		// Sélectionnable
stZoneDestinataire.contrainte.global.toolbarAffichable		= Faux		// Toolbar visible
stZoneDestinataire.contrainte.global.pageModifiable			= Faux		// Ne peut pas changer de page

// Ajouter au document
stDocument.zonesTexte.Ajoute(stZoneDestinataire)

// =============================================================================
// CONTRAINTES GLOBALES DU DOCUMENT
// =============================================================================

// --- Autorisations : aucune création autorisée ---
stContraintes.autorisations.texte					= Vrai
stContraintes.autorisations.image					= Vrai
stContraintes.autorisations.qr						= Vrai
stContraintes.autorisations.barcode					= Vrai

// --- Limites (ignorées car autorisations = Faux) ---
stContraintes.limites.texte							= 0
stContraintes.limites.image							= 0
stContraintes.limites.qr							= 0
stContraintes.limites.barcode						= 0

// =============================================================================
// CONSTRUIRE ET ENVOYER LE MESSAGE LOAD
// =============================================================================

stAuth.IdClient			= 1
stAuth.IdContact		= 1


stBase.IdBase 			= 26
stBase.origine			= "clt"
stBaseListe.Liste.Ajoute(stBase)

stBase.IdBase			= 28
stBase.origine			= "clt"
stBaseListe.Liste.Ajoute(stBase)

stBase.IdBase			= 232
stBase.origine			= "dos"
stBaseListe.Liste.Ajoute(stBase)


stLimites.zipMaxFileSize 	= 209715200 	// 200Mo
stLimites.zipMinImageSize 	= 10240 		// 10240 10Ko  30720 		// 30Ko
stLimites.zipMaxImageSize 	= 2097152 		// 2Mo
stLimites.zipExtensions 	= ["jpg", "jpeg", "png", "gif"]

stAuth.SecretKey			= __API_CLE_SECRET_KEY__
stAuth.UrlWebservice		= "http://localhost/v1/api/designer/image/upload"
stAuth.UrlCollectionListe	= "http://localhost/v1/api/designer/collection/liste"

stLoad.action				= "load"
stLoad.auth					= stAuth
stLoad.limites				= stLimites
stLoad.bases				= stBaseListe
stLoad.theme				= "LTR"
stLoad.document				= stDocument
stLoad.constraints			= stContraintes

// Sérialiser en JSON
Sérialise(stLoad, gsJsonDocument, psdJSON+psdMiseEnForme)



// =============================================================================
// CODE NAVIGATEUR RETOUR AJAX
// =============================================================================

EnvoyerMessageIframe(gsJsonDocument)



// =============================================================================
// CODE WEBDEV -> JAVASCRIPT DE LA PROCEDURE EnvoyerMessageIframe()
// =============================================================================


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