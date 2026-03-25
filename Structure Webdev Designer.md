// =============================================================================
// STRUCTURES DESIGNER VDP - VERSION 3.3
// Architecture contraintes à 3 niveaux (geometrie, style, global)
// =============================================================================

// =============================================================================
// SECTION 1 : STRUCTURES DE BASE (réutilisables)
// =============================================================================

// -----------------------------------------------------------------------------
// IDENTIFICATION DU DOCUMENT
// -----------------------------------------------------------------------------
stDesignerIdentification est une Structure
	'idDocument'			est une chaîne		<sérialise = "idDocument">			// Identifiant unique du document
	'nomDocument'			est une chaîne		<sérialise = "nomDocument">			// Nom affiché du document
	'dateCreation'			est une chaîne		<sérialise = "dateCreation">		// Date de création (format AAAA-MM-JJ)
fin

// -----------------------------------------------------------------------------
// COULEUR CMJN
// -----------------------------------------------------------------------------
stDesignerCouleurCMJN est une Structure
	'c'						est un entier		<sérialise = "c">					// Cyan (0-100)
	'M'						est un entier		<sérialise = "m">					// Magenta (0-100)
	'y'						est un entier		<sérialise = "y">					// Jaune (0-100)
	'k'						est un entier		<sérialise = "k">					// Noir (0-100)
fin

// -----------------------------------------------------------------------------
// GÉOMÉTRIE (position et dimensions en mm)
// -----------------------------------------------------------------------------
stDesignerGeometrie est une Structure
	'xMm'					est un réel			<sérialise = "xMm">					// Position X en mm (depuis le bord gauche)
	'yMm'					est un réel			<sérialise = "yMm">					// Position Y en mm (depuis le bord supérieur)
	'largeurMm'				est un réel			<sérialise = "largeurMm">			// Largeur en mm
	'hauteurMm'				est un réel			<sérialise = "hauteurMm">			// Hauteur en mm
fin

// -----------------------------------------------------------------------------
// BORDURE
// -----------------------------------------------------------------------------
stDesignerBordure est une Structure
	'epaisseur'				est un réel							<sérialise = "epaisseur">		// Épaisseur en pixels (0 = pas de bordure)
	'couleurCmjn'			est une stDesignerCouleurCMJN		<sérialise = "couleurCmjn">		// Couleur CMJN de la bordure
	'style'					est une chaîne						<sérialise = "style">			// Style : "solid", "dashed", "dotted"
fin

// -----------------------------------------------------------------------------
// FOND
// -----------------------------------------------------------------------------
stDesignerFond est une Structure
	'transparent'			est un booléen						<sérialise = "transparent">		// Vrai = fond transparent (couleurCmjn ignorée)
	'couleurCmjn'			est une stDesignerCouleurCMJN		<sérialise = "couleurCmjn">		// Couleur CMJN du fond
fin


// =============================================================================
// SECTION 2 : FORMAT DU DOCUMENT
// =============================================================================

// -----------------------------------------------------------------------------
// FOND PERDU
// -----------------------------------------------------------------------------
stDesignerFondPerdu est une Structure
	'actif'					est un booléen		<sérialise = "actif">				// Activer le fond perdu
	'hautMm'				est un réel			<sérialise = "hautMm">				// Fond perdu en haut en mm
	'basMm'					est un réel			<sérialise = "basMm">				// Fond perdu en bas en mm
	'gaucheMm'				est un réel			<sérialise = "gaucheMm">			// Fond perdu à gauche en mm
	'droiteMm'				est un réel			<sérialise = "droiteMm">			// Fond perdu à droite en mm
fin

// -----------------------------------------------------------------------------
// TRAITS DE COUPE
// -----------------------------------------------------------------------------
stDesignerTraitsCoupe est une Structure
	'actif'					est un booléen		<sérialise = "actif">				// Activer les traits de coupe
fin

// -----------------------------------------------------------------------------
// FORMAT DOCUMENT COMPLET
// -----------------------------------------------------------------------------
stDesignerFormatDocument est une Structure
	'largeurMm'				est un réel							<sérialise = "largeurMm">			// Largeur du document en mm
	'hauteurMm'				est un réel							<sérialise = "hauteurMm">			// Hauteur du document en mm
	'fondPerdu'				est une stDesignerFondPerdu			<sérialise = "fondPerdu">			// Configuration fond perdu
	'traitsCoupe'			est une stDesignerTraitsCoupe		<sérialise = "traitsCoupe">			// Configuration traits de coupe
	'margeSecurite'			est un entier						<sérialise = "margeSecurite">		// Marge de sécurité en mm
	'largeurMaxImageMm'		est un entier						<sérialise = "largeurMaxImageMm">
	'hauteurMaxImageMm'		est un entier						<sérialise = "hauteurMaxImageMm">
fin


// =============================================================================
// SECTION 3 : POLICES DE CARACTÈRES
// =============================================================================

// -----------------------------------------------------------------------------
// CHAMP DE FUSION
// -----------------------------------------------------------------------------
stDesignerChampFusion est une Structure
	'nom'					est une chaîne		<sérialise = "nom">					// Nom du champ (ex: "NOM", "PRENOM")
	'type'					est une chaîne		<sérialise = "type">				// Type : "TXT", "IMG", "SYS"
	'libelle'				est une chaîne		<sérialise = "libelle">				// Libellé du champ
	'ordre'					est un entier		<sérialise = "ordre">				// Ordre d'affichage
fin

// -----------------------------------------------------------------------------
// POLICE DISPONIBLE (envoyée au Designer pour affichage dans la combo)
// -----------------------------------------------------------------------------
stDesignerPolice est une Structure
	'id'					est un entier		<sérialise = "id">					// ID en base de données (0 si non défini)
	'nom'					est une chaîne		<sérialise = "nom">					// Nom affiché dans la combo (ex: "Roboto")
	'url'					est une chaîne		<sérialise = "url">					// URL du fichier police principal (.ttf, .woff2)
	'weight'				est un entier		<sérialise = "weight">				// Poids CSS : 100=Thin, 300=Light, 400=Regular, 500=Medium, 700=Bold, 900=Black
	'style'					est une chaîne		<sérialise = "style">				// Style CSS : "normal" ou "italic"
	'boldUrl'				est une chaîne		<sérialise = "boldUrl">				// URL variante Bold (vide si non disponible)
	'italicUrl'				est une chaîne		<sérialise = "italicUrl">			// URL variante Italic (vide si non disponible)
	'boldItalicUrl'			est une chaîne		<sérialise = "boldItalicUrl">		// URL variante Bold+Italic (vide si non disponible)
fin

// -----------------------------------------------------------------------------
// URLS DES VARIANTES DE POLICE UTILISÉE (retournée à l'export)
// -----------------------------------------------------------------------------
stDesignerPoliceUtiliseeUrls est une Structure
	'regular'				est une chaîne		<sérialise = "regular">				// URL variante Regular (toujours renseignée)
	'bold'					est une chaîne		<sérialise = "bold">				// URL variante Bold (vide si non utilisée)
	'italic'				est une chaîne		<sérialise = "italic">				// URL variante Italic (vide si non utilisée)
	'boldItalic'			est une chaîne		<sérialise = "boldItalic">			// URL variante Bold+Italic (vide si non utilisée)
fin

// -----------------------------------------------------------------------------
// POLICE UTILISÉE (retournée à l'export pour génération PSMD)
// -----------------------------------------------------------------------------
stDesignerPoliceUtilisee est une Structure
	'nom'					est une chaîne							<sérialise = "nom">		// Nom de la police utilisée
	'urls'					est une stDesignerPoliceUtiliseeUrls	<sérialise = "urls">	// URLs des variantes utilisées
fin


// =============================================================================
// SECTION 4 : PAGES
// =============================================================================

// -----------------------------------------------------------------------------
// PAGE DU DOCUMENT
// -----------------------------------------------------------------------------
stDesignerPage est une Structure
	'numero'				est un entier		<sérialise = "numero">				// Numéro de la page (1 = recto, 2 = verso)
	'nom'					est une chaîne		<sérialise = "nom">					// Nom de la page ("Recto", "Verso")
	'urlFond'				est une chaîne		<sérialise = "urlFond">				// URL de l'image de fond (vide = pas de fond)
fin


// =============================================================================
// SECTION 5 : CONTRAINTES DE ZONE (architecture à 3 niveaux)
// =============================================================================
// -----------------------------------------------------------------------------
// AREA DE CONTRAINTE
// Zone rectangulaire délimitant les déplacements/redimensionnements autorisés
// -----------------------------------------------------------------------------
stDesignerAreaContrainte est une Structure
	'xMm'					est un réel			<sérialise = "xMm">					// Position X du coin supérieur gauche en mm
	'yMm'					est un réel			<sérialise = "yMm">					// Position Y du coin supérieur gauche en mm
	'wMm'					est un réel			<sérialise = "wMm">					// Largeur de l'area en mm
	'hMm'					est un réel			<sérialise = "hMm">					// Hauteur de l'area en mm
fin

// -----------------------------------------------------------------------------
// CONTRAINTE GÉOMÉTRIE (communes à tous les types de zones)
// -----------------------------------------------------------------------------
stDesignerContrainteGeometrie est une Structure
	'positionFixe'			est un booléen						<sérialise = "positionFixe">	// Position X,Y non modifiable (drag bloqué). Défaut: false
	'locked'				est un booléen						<sérialise = "locked">			// Contrainte Template : position ET taille non modifiables en mode Standard. Défaut: false
	'minWMm'				est un réel							<sérialise = "minWMm">			// Largeur minimale en mm (0 = pas de minimum)
	'maxWMm'				est un réel							<sérialise = "maxWMm">			// Largeur maximale en mm (0 = pas de maximum)
	'minHMm'				est un réel							<sérialise = "minHMm">			// Hauteur minimale en mm (0 = pas de minimum)
	'maxHMm'				est un réel							<sérialise = "maxHMm">			// Hauteur maximale en mm (0 = pas de maximum)
	'area'					est une stDesignerAreaContrainte	<sérialise = "area">			// Zone autorisée (null = pas de contrainte)
fin

// -----------------------------------------------------------------------------
// CONTRAINTE GLOBAL (communes à tous les types de zones)
// SOURCE DE VÉRITÉ pour systeme, imprimable, selectionnable, toolbarAffichable
// -----------------------------------------------------------------------------
stDesignerContrainteGlobal est une Structure
	'systeme'				est un booléen		<sérialise = "systeme">				// Zone système (entièrement protégée). Défaut: false
	'systemeLibelle'		est une chaîne		<sérialise = "systemeLibelle">		// Libellé affiché dans le badge système. Défaut: ""
	'nonSupprimable'		est un booléen		<sérialise = "nonSupprimable">		// Zone non supprimable. Défaut: false
	'imprimable'			est un booléen		<sérialise = "imprimable">			// Zone imprimée. Défaut: true (ATTENTION)
	'selectionnable'		est un booléen		<sérialise = "selectionnable">		// Zone sélectionnable. Défaut: true
	'toolbarAffichable'		est un booléen		<sérialise = "toolbarAffichable">	// Toolbar visible à la sélection. Défaut: true
	'pageModifiable'		est un booléen		<sérialise = "pageModifiable">		// Peut changer de page (Recto/Verso). Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - TEXTE
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
stDesignerContrainteStyleTexte est une Structure
	'contenuModifiable'			est un booléen	<sérialise = "contenuModifiable">		// Contenu texte modifiable. Défaut: true
	'typographieModifiable'		est un booléen	<sérialise = "typographieModifiable">	// Section Typographie modifiable. Défaut: true
	'alignementsModifiable'		est un booléen	<sérialise = "alignementsModifiable">	// Section Alignements modifiable. Défaut: true
	'fondModifiable'			est un booléen	<sérialise = "fondModifiable">			// Section Fond modifiable. Défaut: true
	'bordureModifiable'			est un booléen	<sérialise = "bordureModifiable">		// Section Bordure modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - IMAGE
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
stDesignerContrainteStyleImage est une Structure
	'typeSourceModifiable'		est un booléen	<sérialise = "typeSourceModifiable">	// Peut basculer Image fixe / Champ fusion. Défaut: true
	'imageModifiable'			est un booléen	<sérialise = "imageModifiable">			// Peut changer l'image. Défaut: true
	'affichageModifiable'		est un booléen	<sérialise = "affichageModifiable">		// Section Affichage modifiable. Défaut: true
	'fondModifiable'			est un booléen	<sérialise = "fondModifiable">			// Section Fond modifiable. Défaut: true
	'bordureModifiable'			est un booléen	<sérialise = "bordureModifiable">		// Section Bordure modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - CODE-BARRES (barcode)
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
stDesignerContrainteStyleBarcode est une Structure
	'typeCodeModifiable'		est un booléen	<sérialise = "typeCodeModifiable">		// Peut changer le type de code. Défaut: true
	'typeSourceModifiable'		est un booléen	<sérialise = "typeSourceModifiable">	// Peut basculer Valeur fixe / Champ fusion. Défaut: true
	'donneesModifiable'			est un booléen	<sérialise = "donneesModifiable">		// Peut modifier la valeur ou le champ. Défaut: true
	'apparenceModifiable'		est un booléen	<sérialise = "apparenceModifiable">		// Section Affichage modifiable. Défaut: true
	'fondModifiable'			est un booléen	<sérialise = "fondModifiable">			// Section Fond modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - QR CODE MARKETEAM (qr)
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
stDesignerContrainteStyleQR est une Structure
	'couleursModifiable'		est un booléen	<sérialise = "couleursModifiable">		// Section Couleurs modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE DE ZONE COMPLÈTE (structure à 3 niveaux)
// -----------------------------------------------------------------------------
stDesignerZoneContrainte est une Structure
	'geometrie'				est une stDesignerContrainteGeometrie	<sérialise = "geometrie">	// Contraintes de position et taille
	'style'					est un Variant							<sérialise = "style">		// Contraintes de style (structure selon type de zone)
	'global'				est une stDesignerContrainteGlobal		<sérialise = "global">		// Contraintes comportementales
fin


// =============================================================================
// SECTION 6 : ZONES TEXTE
// =============================================================================
stDesignerStyleTexte est une Structure
	'police'				est une chaîne						<sérialise = "police">				// Nom de la police (ex: "Roboto")
	'taillePt'				est un réel							<sérialise = "taillePt">			// Taille en points
	'couleurCmjn'			est une stDesignerCouleurCMJN		<sérialise = "couleurCmjn">			// Couleur du texte CMJN
	'gras'					est un booléen						<sérialise = "gras">				// OBSOLÈTE - utiliser formatage partiel
	'interligne'			est un réel							<sérialise = "interligne">			// Facteur d'interlignage (1.0 = normal)
	'alignementH'			est une chaîne						<sérialise = "alignementH">			// "left", "center", "right", "justify"
	'alignementV'			est une chaîne						<sérialise = "alignementV">			// "top", "middle", "bottom"
fin

// -----------------------------------------------------------------------------
// COPYFITTING (réduction automatique de la taille)
// -----------------------------------------------------------------------------
stDesignerCopyfitting est une Structure
	'actif'					est un booléen		<sérialise = "actif">					// Activer le copy fitting
	'tailleMinimum'			est un entier		<sérialise = "tailleMinimum">			// Taille minimum en points
	'autoriserRetourLigne'	est un booléen		<sérialise = "autoriserRetourLigne">	// Autoriser retour à la ligne automatique
fin

// -----------------------------------------------------------------------------
// FORMATAGE PARTIEL - STYLES
// -----------------------------------------------------------------------------
stDesignerFormatageStyles est une Structure
	'gras'					est un booléen						<sérialise = "gras">				// Appliquer gras
	'souligne'				est un booléen						<sérialise = "souligne">			// Appliquer souligné
	'couleur'				est une chaîne						<sérialise = "couleur">				// Couleur hex (ex: "#FF0000")
fin

// -----------------------------------------------------------------------------
// FORMATAGE PARTIEL (gras, souligné, couleur sur une portion de texte)
// -----------------------------------------------------------------------------
stDesignerFormatage est une Structure
	'debut'					est un entier						<sérialise = "debut">				// Index de début (caractère)
	'fin'					est un entier						<sérialise = "fin">					// Index de fin (caractère)
	'styles'				est une stDesignerFormatageStyles	<sérialise = "styles">				// Styles à appliquer
fin

// -----------------------------------------------------------------------------
// ZONE TEXTE (V3.3 - format unifié)
// -----------------------------------------------------------------------------
stDesignerZoneTexte est une Structure
	// --- Identification ---
	'id'					est une chaîne						<sérialise = "id">									// Identifiant unique (ex: "zone-1")
	'page'					est un entier						<sérialise = "page">								// Numéro de page (1 = recto, 2 = verso)
	'nom'					est une chaîne						<sérialise = "nom">									// Nom de la zone (optionnel)
	'niveau'				est un entier						<sérialise = "niveau">								// Ordre d'empilement (z-index)
	'rotation'				est un entier						<sérialise = "rotation">							// Rotation en degrés

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen						<sérialise = "verrouille">							// Préférence utilisateur : zone figée (onglet Personnalisation)

	// --- Géométrie ---
	'geometrie'				est une stDesignerGeometrie			<sérialise = "geometrie">							// Position et dimensions

	// --- Contenu ---
	'contenu'				est une chaîne						<sérialise = "contenu">								// Texte avec champs de fusion (@NOM@)
	'formatage'				est un tableau						<sérialise = "formatage"> de stDesignerFormatage	// Formatage partiel
	'quillDelta'			est un Variant						<sérialise = "quillDelta">							// Contenu Quill au format Delta (pour édition WYSIWYG)
	'contenuRtf'			est une chaîne						<sérialise = "contenuRtf">
	'supprimerLignesVides'	est un entier						<sérialise = "supprimerLignesVides">				// 0=Conserver, 1=Supprimer si variable vide

	// --- Apparence ---
	'style'					est une stDesignerStyleTexte		<sérialise = "style">								// Style typographique
	'fond'					est une stDesignerFond				<sérialise = "fond">								// Fond de la zone
	'bordure'				est une stDesignerBordure			<sérialise = "bordure">								// Bordure de la zone
	'copyfitting'			est une stDesignerCopyfitting		<sérialise = "copyfitting">							// Configuration copy fitting

	// --- Contraintes ---
	'contrainte'			est une stDesignerZoneContrainte	<sérialise = "contrainte">							// Toutes les contraintes (format 3 niveaux)
fin


// =============================================================================
// SECTION 7 : ZONES IMAGE
// =============================================================================

// -----------------------------------------------------------------------------
// SOURCE IMAGE
// -----------------------------------------------------------------------------
stDesignerSourceImage est une Structure
	'type'					est une chaîne		<sérialise = "type">				// "fixe", "champ", "url"
	'valeur'				est une chaîne		<sérialise = "valeur">				// URL ou nom du champ de fusion
	'nomOriginal'			est une chaîne		<sérialise = "nomOriginal">			// Nom du fichier uploadé
	'imageBase64'			est une chaîne		<sérialise = "imageBase64">			// Données base64 de l'image compressée
	'largeurPx'				est un entier		<sérialise = "largeurPx">			// Largeur image en pixels (pour calcul DPI)
	'hauteurPx'				est un entier		<sérialise = "hauteurPx">			// Hauteur image en pixels (pour calcul DPI)
fin

// -----------------------------------------------------------------------------
// REDIMENSIONNEMENT IMAGE
// -----------------------------------------------------------------------------
stDesignerRedimensionnement est une Structure
	'mode'					est une chaîne		<sérialise = "mode">				// "initial", "ajuster", "couper"
	'alignementH'			est une chaîne		<sérialise = "alignementH">			// "left", "center", "right"
	'alignementV'			est une chaîne		<sérialise = "alignementV">			// "top", "middle", "bottom"
fin

// -----------------------------------------------------------------------------
// ZONE IMAGE
// -----------------------------------------------------------------------------
stDesignerZoneImage est une Structure
	// --- Identification ---
	'id'					est une chaîne							<sérialise = "id">
	'page'					est un entier							<sérialise = "page">
	'nom'					est une chaîne							<sérialise = "nom">
	'niveau'				est un entier							<sérialise = "niveau">
	'rotation'				est un entier							<sérialise = "rotation">

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen							<sérialise = "verrouille">

	// --- Géométrie ---
	'geometrie'				est une stDesignerGeometrie				<sérialise = "geometrie">

	// --- Contenu ---
	'source'				est une stDesignerSourceImage			<sérialise = "source">
	'redimensionnement'		est une stDesignerRedimensionnement		<sérialise = "redimensionnement">

	// --- Apparence ---
	'fond'					est une stDesignerFond					<sérialise = "fond">
	'bordure'				est une stDesignerBordure				<sérialise = "bordure">

	// --- Contraintes ---
	'contrainte'			est une stDesignerZoneContrainte		<sérialise = "contrainte">
	// Plafonds image (mm) : 0 ou absent = hériter de formatDocument.largeurMaxImageMm / hauteurMaxImageMm
	'largeurMaxImageMm'		est un entier							<sérialise = "largeurMaxImageMm">
	'hauteurMaxImageMm'		est un entier							<sérialise = "hauteurMaxImageMm">
fin


// =============================================================================
// SECTION 8 : ZONES QR CODE (Landing pages Marketeam)
// =============================================================================

// -----------------------------------------------------------------------------
// COULEURS QR CODE
// -----------------------------------------------------------------------------
stDesignerCouleursQR est une Structure
	'codeCmjn'				est une stDesignerCouleurCMJN		<sérialise = "codeCmjn">
	'fondCmjn'				est une stDesignerCouleurCMJN		<sérialise = "fondCmjn">
fin

// -----------------------------------------------------------------------------
// ZONE QR CODE
// -----------------------------------------------------------------------------
stDesignerZoneQR est une Structure
	// --- Identification ---
	'id'					est une chaîne						<sérialise = "id">
	'page'					est un entier						<sérialise = "page">
	'nom'					est une chaîne						<sérialise = "nom">
	'niveau'				est un entier						<sérialise = "niveau">
	'rotation'				est un entier						<sérialise = "rotation">

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen						<sérialise = "verrouille">

	// --- Géométrie ---
	'geometrie'				est une stDesignerGeometrie			<sérialise = "geometrie">

	// --- Contenu ---
	'typeCode'				est une chaîne						<sérialise = "typeCode">			// Toujours "QRCode"
	'contenu'				est une chaîne						<sérialise = "contenu">				// URL ou contenu du QR code

	// --- Apparence ---
	'couleurs'				est une stDesignerCouleursQR		<sérialise = "couleurs">

	// --- Contraintes ---
	'contrainte'			est une stDesignerZoneContrainte	<sérialise = "contrainte">
fin


// =============================================================================
// SECTION 9 : ZONES CODE-BARRES (1D et 2D)
// =============================================================================

// -----------------------------------------------------------------------------
// ZONE CODE-BARRES
// Types supportés : code128, code39, ean13, ean8, upca, upce, itf14, datamatrix, qrcode
// -----------------------------------------------------------------------------
stDesignerZoneCodeBarres est une Structure
	// --- Identification ---
	'id'					est une chaîne						<sérialise = "id">
	'page'					est un entier						<sérialise = "page">
	'nom'					est une chaîne						<sérialise = "nom">
	'niveau'				est un entier						<sérialise = "niveau">
	'rotation'				est un entier						<sérialise = "rotation">

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen						<sérialise = "verrouille">

	// --- Géométrie ---
	'geometrie'				est une stDesignerGeometrie			<sérialise = "geometrie">

	// --- Contenu ---
	'typeCodeBarres'		est une chaîne						<sérialise = "typeCodeBarres">		// Type : "code128", "ean13", "datamatrix", "qrcode", etc.
	'forme'					est une chaîne						<sérialise = "forme">				// Forme DataMatrix : "square" (défaut) ou "rectangle" (12x36)
	'sourceType'			est une chaîne						<sérialise = "sourceType">			// "fixe" ou "champ"
	'champFusion'			est une chaîne						<sérialise = "champFusion">			// Nom du champ sans @ (vide si statique)
	'valeurStatique'		est une chaîne						<sérialise = "valeurStatique">		// Valeur si pas de champ fusion
	'texteLisible'			est une chaîne						<sérialise = "texteLisible">		// "aucun" ou "dessous"
	'taillePolice'			est un entier						<sérialise = "taillePolice">		// Taille du texte lisible en points
	'qrConfig'				est un Variant						<sérialise = "qrConfig">			// Configuration QR intelligent (null si non applicable)

	// --- Apparence ---
	'couleurCmjn'			est une stDesignerCouleurCMJN		<sérialise = "couleurCmjn">			// Couleur du code
	'couleurFondCmjn'		est une stDesignerCouleurCMJN		<sérialise = "couleurFondCmjn">		// Couleur de fond
	'transparent'			est un booléen						<sérialise = "transparent">			// Fond transparent

	// --- Contraintes ---
	'contrainte'			est une stDesignerZoneContrainte	<sérialise = "contrainte">
fin


// =============================================================================
// SECTION 10 : CONTRAINTES GLOBALES DU DOCUMENT
// =============================================================================

// -----------------------------------------------------------------------------
// AUTORISATIONS DE CRÉATION PAR TYPE DE ZONE
// -----------------------------------------------------------------------------
stDesignerConstraintsAutorisations est une Structure
	'texte'					est un booléen		<sérialise = "texte">				// Autoriser création zones texte
	'image'					est un booléen		<sérialise = "image">				// Autoriser création zones image
	'qr'					est un booléen		<sérialise = "qr">					// Autoriser création QR Code Marketeam
	'barcode'				est un booléen		<sérialise = "barcode">				// Autoriser création codes-barres
fin

// -----------------------------------------------------------------------------
// LIMITES DE NOMBRE PAR TYPE DE ZONE
// Valeur -1 = illimité, 0 = interdit, >0 = nombre maximum
// -----------------------------------------------------------------------------
stDesignerConstraintsLimites est une Structure
	'texte'					est un entier		<sérialise = "texte">				// Limite zones texte (-1 = illimité)
	'image'					est un entier		<sérialise = "image">				// Limite zones image (-1 = illimité)
	'qr'					est un entier		<sérialise = "qr">					// Limite QR Code (-1 = illimité)
	'barcode'				est un entier		<sérialise = "barcode">				// Limite codes-barres (-1 = illimité)
fin

// -----------------------------------------------------------------------------
// CONTRAINTES GLOBALES DU DOCUMENT
// -----------------------------------------------------------------------------
stDesignerConstraints est une Structure
	'autorisations'			est une stDesignerConstraintsAutorisations	<sérialise = "autorisations">
	'limites'				est une stDesignerConstraintsLimites		<sérialise = "limites">
fin


// =============================================================================
// SECTION 11 : DONNÉES D'APERÇU
// =============================================================================

stDesignerChamp est une Structure
	'nom'					est une chaîne		<sérialise = "nom">
	'valeur'				est une chaîne		<sérialise = "valeur">
fin

stDesignerEnregistrement est une Structure
	'enregistrement'		est un tableau		<sérialise = "enregistrement"> de stDesignerChamp
fin


// =============================================================================
// SECTION 12 : DOCUMENT COMPLET
// =============================================================================

stDesignerDocument est une Structure
	'identification'		est une stDesignerIdentification		<sérialise = "identification">
	'formatDocument'		est une stDesignerFormatDocument		<sérialise = "formatDocument">
	'champsFusion'			est un tableau							<sérialise = "champsFusion"> de stDesignerChampFusion
	'donneesApercu'			est un tableau							<sérialise = "donneesApercu"> de stDesignerEnregistrement
	'policesUtilisees'		est un tableau							<sérialise = "policesUtilisees"> de stDesignerPoliceUtilisee
	'pages'					est un tableau							<sérialise = "pages"> de stDesignerPage
	'zonesTexte'			est un tableau							<sérialise = "zonesTexte"> de stDesignerZoneTexte
	'zonesQR'				est un tableau							<sérialise = "zonesQR"> de stDesignerZoneQR
	'zonesCodeBarres'		est un tableau							<sérialise = "zonesCodeBarres"> de stDesignerZoneCodeBarres
	'zonesImage'			est un tableau							<sérialise = "zonesImage"> de stDesignerZoneImage
fin

stDesignerLimites est une Structure
	'zipMaxFileSize'		est un entier				<sérialise = "zipMaxFileSize">
	'zipMinImageSize'		est un entier				<sérialise = "zipMinImageSize">
	'zipMaxImageSize'		est un entier				<sérialise = "zipMaxImageSize">
	'zipExtensions'			est un tableau				<sérialise = "zipAcceptedImageExtensions"> de chaînes
fin

// =============================================================================
// SECTION 13 : MESSAGES POSTMESSAGE
// =============================================================================

stDesignerLoad est une Structure
	'action'				est une chaîne						<sérialise = "action">				// Toujours "load"
	'auth'					est une stDesignerAuth				<sérialise = "auth">
	'bases'					est une stDesignerBaseListe			<sérialise = "bases">				// Les bases de données utilisé dans l'opération
	'Theme'					est une chaîne ANSI					<sérialise = "theme">				// Pour définir la couleur du thème
	'document'				est une stDesignerDocument			<sérialise = "data">				// Document à charger
	'constraints'			est une stDesignerConstraints		<sérialise = "constraints">			// Contraintes globales
	'limites'				est une stDesignerLimites			<sérialise = "limites">				// Limites sur les images acceptées
	'policesDisponibles'	est un tableau						<sérialise = "policesDisponibles"> de stDesignerPolice
fin

stDesignerBase est une Structure
	IdBase					est un entier						<sérialise = "IdBase">
	origine					est une chaîne						<sérialise = "origine">
fin

stDesignerBaseListe est une Structure
	Liste 					est un tableau   					<sérialise = "liste"> de stDesignerBase
fin

stDesignerAuth est une Structure
	IdClient				est un entier						<sérialise = "idClient">
	IdContact				est un entier						<sérialise = "idContact">
	SecretKey				est une chaîne						<sérialise = "secretKey">
	UrlWebservice			est une chaîne						<sérialise = "urlWebservice">
	UrlCollectionListe		est une chaîne						<sérialise = "urlCollectionListe">
fin


stDesignerExport est une Structure
	'action'				est une chaîne						<sérialise = "action">				// Toujours "exported"
	'success'				est un booléen						<sérialise = "success">				// Succès de l'export
	'data'					est une stDesignerDocument			<sérialise = "data">				// Document exporté
fin

