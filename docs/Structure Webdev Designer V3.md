// =============================================================================
// STRUCTURES DESIGNER VDP - VERSION 3.7
// Architecture contraintes à 3 niveaux (geometrie, style, global)
// V3.4 (11/05/2026) : ajout des structures et propriétés liées à la
//                     création de champs de fusion dans le Designer
//                     (cf. docs/cahier_des_charges_creation_champs_fusion.md V2.2)
//   - structDesignerChampFusion : ajout de localId + echantillonDefaut
//   - structDesignerChampStandard (NOUVEAU)
//   - structDesignerTypeChamp (NOUVEAU)
//   - structDesignerLoad : ajout de champsStandard + typesDisponibles
//   - structDesignerChamp.nom : peut valoir "LOCAL_<localId>" pour les
//     échantillons de champs créés dans le Designer non encore mappés
// V3.5 (19/05/2026) : amendement V2.3 du cahier des charges
//                     (cf. docs/amendement-V2.3-cahier-des-charges.md)
//   - structDesignerChampFusion : ajout de 'origine' (chaîne :
//     "standard" ou "specifique") — sert à figer l'onglet en édition.
//   - structDesignerLoad : ajout de 'autoriserGestionChamps' (booléen) —
//     verrouillage global de l'ajout/modification/suppression des champs.
//     Vrai par défaut si absent (compatibilité ascendante).
// V3.6 (19/05/2026 PM) : amendement V2.4 du cahier des charges
//                        (cf. docs/amendement-V2.4-cahier-des-charges.md)
//   - structDesignerChampFusion : 'origine' change de sémantique. Valeurs :
//     "import" (présent dans le JSON initial du load) ou "ajout" (créé par
//     l'utilisateur via la modale). Sert désormais au verrouillage
//     individuel (et non plus à figer l'onglet en édition).
//   - structDesignerChampFusion : ajout de 'categorie' (chaîne :
//     "standard" ou "specifique"). Reprend l'usage que faisait 'origine'
//     en V3.5 — sert à figer l'onglet en édition.
//   - structDesignerChampStandard : ajout de 'placeholderDefaut' (chaîne)
//     — valeur métier par défaut pour l'algorithme unifié de résolution
//     d'échantillon côté Designer.
// V3.7 (20/05/2026) : amendement V2.5 du cahier des charges
//                     (cf. docs/amendement-V2.5-cahier-des-charges.md)
//   - structDesignerChampFusion : NOUVEL ATTRIBUT JSON 'presenteEnBase'
//     (booléen). Pilote la couleur (vert / gris / rouge) et la
//     suppressibilité de chaque champ côté Designer.
//
//     ⚠️ SÉMANTIQUE PARTICULIÈRE : cet attribut est OPTIONNEL au sens
//     JSON. Trois états distincts :
//       - ABSENT du JSON   → régime A (« pas d'info ») : la SaaS ne
//         transmet pas cette donnée pour ce champ. Le Designer applique
//         son comportement par défaut V2.4 (verrouillage individuel
//         basé sur 'origine').
//       - Présent à Vrai   → régime B : le champ correspond à une
//         colonne réelle de la base BDD courante (mappage actif).
//       - Présent à Faux   → régime B : le champ ne correspond à
//         aucune colonne de la base BDD courante (champ orphelin ou
//         spécifique non mappé).
//
//     CALCUL CÔTÉ SAAS — opéré par certaines procédures spécifiques
//     (SelectionModèle.txt et code Ajax serveur de btnDocumentPersonnaliser
//     dans pgeLtrContenu) sur le JSON natif APRÈS la sérialisation
//     initiale de structDesignerLoad. Critères :
//       - Si pas de base active (toutes EstSupprime = Vrai) → attribut
//         absent (régime A)
//       - Si champ système (type = "SYS")                  → attribut absent
//       - Si nom non vide ET nom dans __stOperation.taaBaseChamp.Champ
//                                                          → Vrai
//       - Sinon (nom vide, ou champ orphelin)              → Faux
//
//     ⚠️ POURQUOI L'ATTRIBUT N'EST PAS DÉCLARÉ DANS LA STRUCTURE WL :
//     une déclaration `<sérialise = "presenteEnBase">` forcerait
//     Sérialise() à émettre `presenteEnBase: false` sur TOUS les
//     champs dès ComposerJsonDesignerCreation, ce qui ferait perdre
//     la distinction régime A vs régime B (« Faux explicite »). En
//     déclarant l'attribut UNIQUEMENT ici (documentation) et en
//     l'ajoutant dynamiquement sur le JSON natif côté procédures
//     SaaS, on garantit la sémantique « absent si non affecté ».
//
//     RÉCAPITULATIF DES ATTRIBUTS JSON POSSIBLES DE structDesignerChampFusion :
//       nom, type, libelle, ordre, localId, echantillonDefaut,
//       origine, categorie  → déclarés dans la structure WL
//                              (toujours présents dans le JSON)
//       presenteEnBase      → ajouté dynamiquement par la SaaS,
//                              présent UNIQUEMENT si calcul fait
// =============================================================================

// =============================================================================
// SECTION 1 : STRUCTURES DE BASE (réutilisables)
// =============================================================================

// -----------------------------------------------------------------------------
// IDENTIFICATION DU DOCUMENT
// -----------------------------------------------------------------------------
structDesignerIdentification est une Structure
	'idDocument'			est une chaîne		<sérialise = "idDocument">				// Identifiant unique du document
	'nomDocument'			est une chaîne		<sérialise = "nomDocument">			// Nom affiché du document
	'dateCreation'			est une chaîne		<sérialise = "dateCreation">			// Date de création (format AAAA-MM-JJ)
fin

// -----------------------------------------------------------------------------
// COULEUR CMJN
// -----------------------------------------------------------------------------
structDesignerCouleurCMJN est une Structure
	'c'						est un entier		<sérialise = "c">					// Cyan (0-100)
	'M'						est un entier		<sérialise = "m">					// Magenta (0-100)
	'y'						est un entier		<sérialise = "y">					// Jaune (0-100)
	'k'						est un entier		<sérialise = "k">					// Noir (0-100)
fin

// -----------------------------------------------------------------------------
// GÉOMÉTRIE (position et dimensions en mm)
// -----------------------------------------------------------------------------
structDesignerGeometrie est une Structure
	'xMm'						est un réel			<sérialise = "xMm">					// Position X en mm (depuis le bord gauche)
	'yMm'						est un réel			<sérialise = "yMm">					// Position Y en mm (depuis le bord supérieur)
	'largeurMm'				est un réel			<sérialise = "largeurMm">			// Largeur en mm
	'hauteurMm'				est un réel			<sérialise = "hauteurMm">			// Hauteur en mm
fin

// -----------------------------------------------------------------------------
// BORDURE
// -----------------------------------------------------------------------------
structDesignerBordure est une Structure
	'epaisseur'				est un réel										<sérialise = "epaisseur">			// Épaisseur en pixels (0 = pas de bordure)
	'couleurCmjn'			est une structDesignerCouleurCMJN		<sérialise = "couleurCmjn">		// Couleur CMJN de la bordure
	'style'					est une chaîne									<sérialise = "style">				// Style : "solid", "dashed", "dotted"
fin

// -----------------------------------------------------------------------------
// FOND
// -----------------------------------------------------------------------------
structDesignerFond est une Structure
	'transparent'			est un booléen									<sérialise = "transparent">		// Vrai = fond transparent (couleurCmjn ignorée)
	'couleurCmjn'			est une structDesignerCouleurCMJN		<sérialise = "couleurCmjn">		// Couleur CMJN du fond
fin


// =============================================================================
// SECTION 2 : FORMAT DU DOCUMENT
// =============================================================================

// -----------------------------------------------------------------------------
// FOND PERDU
// -----------------------------------------------------------------------------
structDesignerFondPerdu est une Structure
	'actif'					est un booléen		<sérialise = "actif">				// Activer le fond perdu
	'hautMm'					est un réel			<sérialise = "hautMm">				// Valeur Haut du fond perdu en mm
	'basMm'					est un réel			<sérialise = "basMm">				// Valeur bas du fond perdu en mm
	'gaucheMm'				est un réel			<sérialise = "gaucheMm">			// Valeur gauche du fond perdu en mm
	'droiteMm'				est un réel			<sérialise = "droiteMm">			// Valeur droite du fond perdu en mm
fin

// -----------------------------------------------------------------------------
// TRAITS DE COUPE
// -----------------------------------------------------------------------------
structDesignerTraitsCoupe est une Structure
	'actif'					est un booléen		<sérialise = "actif">				// Activer les traits de coupe
fin

// -----------------------------------------------------------------------------
// FORMAT DOCUMENT COMPLET
// -----------------------------------------------------------------------------
structDesignerFormatDocument est une Structure
	'largeurMm'						est un réel										<sérialise = "largeurMm">					// Largeur du document en mm
	'hauteurMm'						est un réel										<sérialise = "hauteurMm">					// Hauteur du document en mm
	'fondPerdu'						est une structDesignerFondPerdu			<sérialise = "fondPerdu">					// Configuration fond perdu
	'traitsCoupe'					est une structDesignerTraitsCoupe		<sérialise = "traitsCoupe">				// Configuration traits de coupe
	'margeSecurite'				est un entier									<sérialise = "margeSecurite">				// Marge de sécurité en mm
	'largeurMaxImageMm'			est un entier									<sérialise = "largeurMaxImageMm">
	'hauteurMaxImageMm'			est un entier									<sérialise = "hauteurMaxImageMm">
	'formatPapierLargeurMm'		est un entier									<sérialise = "formatPapierLargeurMm">	// Largeur format papier SRA (DEVMODE)
	'formatPapierHauteurMm'		est un entier									<sérialise = "formatPapierHauteurMm">	// Hauteur format papier SRA (DEVMODE)
fin


// =============================================================================
// SECTION 3 : POLICES DE CARACTÈRES
// =============================================================================

// -----------------------------------------------------------------------------
// CHAMP DE FUSION
// -----------------------------------------------------------------------------
// V3.4 : un champ peut désormais avoir 'nom' vide ("") s'il a été créé dans
//        le Designer et n'est pas encore mappé à une colonne BDD. Dans ce
//        cas 'localId' est renseigné et sert de clé de substitution dans le
//        contenu (@LOCAL_<localId>@) et dans donneesApercu (nom = "LOCAL_<localId>").
//        À la "vérification de cohérence" côté SaaS, la plateforme attribue
//        un 'nom' technique au champ et la substitution @LOCAL_<id>@ -> @nom@
//        est effectuée par le Designer à la prochaine ouverture (cf. cahier
//        des charges §4.2).
// -----------------------------------------------------------------------------
structDesignerChampFusion est une Structure
	'nom'					est une chaîne		<sérialise = "nom">					// Nom technique du champ (ex: "NOM", "PRENOM", "Champ7"). Vide pour un champ non mappé.
	'type'					est une chaîne		<sérialise = "type">					// Code du type (cf. structDesignerTypeChamp - section 5.1)
	'libelle'				est une chaîne		<sérialise = "libelle">				// Libellé affiché du champ
	'ordre'					est un entier		<sérialise = "ordre">				// Ordre d'affichage
	'localId'				est une chaîne		<sérialise = "localId">				// V3.4 - UUID Designer pour les champs créés non mappés (vide pour les champs déjà mappés à la création)
	'echantillonDefaut'		est une chaîne		<sérialise = "echantillonDefaut">	// V3.4 - Valeur d'échantillon par défaut saisie à la création (optionnel)
	'origine'				est une chaîne		<sérialise = "origine">				// V3.6 - Origine du champ : "import" (présent dans le JSON initial reçu via postMessage 'load' — venant d'une base BDD ou pré-rempli par la SaaS) ou "ajout" (créé par l'utilisateur via la modale durant la session courante). Sert au VERROUILLAGE INDIVIDUEL (libellé/type figés + suppression interdite si "import"). Pour les champs legacy sans 'origine' : traité comme "import" par sécurité. ATTENTION : sémantique V3.6 différente de V3.5 (qui utilisait "standard"/"specifique").
	'categorie'				est une chaîne		<sérialise = "categorie">			// V3.6 - Sous-catégorie : "standard" (champ standard du référentiel champsStandard) ou "specifique" (champ créé librement). Sert au CHOIX DE L'ONGLET EN ÉDITION (cf. cahier des charges V2.4 §7.3.1). Renseignée à la création par la modale. Pour les champs legacy sans 'categorie' : déduction par recherche dans champsStandard (présence → "standard", sinon → "specifique").
	// V3.7 - presenteEnBase (booléen) : NON DÉCLARÉ DANS LA STRUCTURE WL,
	//        ajouté dynamiquement sur le JSON natif par les procédures SaaS
	//        de chargement (SelectionModèle.txt et code Ajax serveur de
	//        btnDocumentPersonnaliser dans pgeLtrContenu). Cf. en-tête de
	//        fichier V3.7 pour la sémantique complète. Trois états possibles
	//        côté JSON : absent (régime A) / Vrai (mappé) / Faux (orphelin).
	//        Pilote la couleur et la suppressibilité côté Designer V2.5.
fin

// -----------------------------------------------------------------------------
// CHAMP STANDARD (V3.4 - NOUVEAU)
// Référence transmise dans le message 'load' au niveau racine pour alimenter
// la modale "Ajouter un champ" du Designer (onglet Standard).
// -----------------------------------------------------------------------------
structDesignerChampStandard est une Structure
	'nom'					est une chaîne		<sérialise = "nom">					// Nom technique tel qu'il sera attribué au champ (ex: "Nom", "Prenom", "CodePostal")
	'libelle'				est une chaîne		<sérialise = "libelle">				// Libellé affiché dans la liste standard
	'type'					est une chaîne		<sérialise = "type">					// Code du type (cf. structDesignerTypeChamp)
	'placeholderDefaut'	est une chaîne		<sérialise = "placeholderDefaut">	// V3.6 - Valeur par défaut métier (ex: "Dupont" pour Nom, "75001" pour Code postal). Utilisée par l'algorithme unifié de résolution d'échantillon côté Designer (cf. cahier V2.4 §7.3.2 étape 4).
fin

// -----------------------------------------------------------------------------
// TYPE DE CHAMP DISPONIBLE (V3.4 - NOUVEAU)
// Référence transmise dans le message 'load' au niveau racine pour alimenter
// la modale "Ajouter un champ" du Designer (onglet Spécifique : combo Type).
//
// Liste exhaustive des codes V3.4 et leur correspondance avec les constantes
// WebDev :
//   TXT  Texte         <- __CHAMP_TYPE_TEXTE__         (chaîne libre)
//   ENT  Entier        <- __CHAMP_TYPE_ENTIER__        (numérique)
//   DEC  Décimal       <- __CHAMP_TYPE_DECIMAL__       (numérique)
//   MON  Monétaire     <- __CHAMP_TYPE_MONETAIRE__     (numérique)
//   DAT  Date          <- __CHAMP_TYPE_DATE__          (date/heure)
//   TIM  Heure         <- __CHAMP_TYPE_HEURE__         (date/heure)
//   EML  Email         <- __CHAMP_TYPE_EMAIL__         (chaîne contrainte)
//   TEL  Téléphone     <- __CHAMP_TYPE_TELEPHONE__     (chaîne contrainte)
//   SMS  Portable      <- __CHAMP_TYPE_PORTABLE__      (chaîne contrainte)
//   CDP  Code postal   <- __CHAMP_TYPE_CODEPOSTAL__    (chaîne contrainte)
//   URL  URL           <- __CHAMP_TYPE_URL__           (chaîne contrainte)
//   IMG  Image         <- __CHAMP_TYPE_IMAGE__         (placeholder visuel)
//   ALG  Alliage       <- __CHAMP_TYPE_ALLIAGE__       (chaîne libre métier - NPAI La Poste)
//
// Le code SYS reste réservé aux zones système injectées par WebDev (adresse
// destinataire, séquentiel, datamatrix...) et n'est PAS exposé dans
// typesDisponibles.
// -----------------------------------------------------------------------------
structDesignerTypeChamp est une Structure
	'code'					est une chaîne		<sérialise = "code">				// Code court du type (3 lettres, ex: "TXT", "DAT", "MON")
	'libelle'				est une chaîne		<sérialise = "libelle">				// Libellé affiché dans la combo (ex: "Texte", "Date", "Monétaire")
fin

// -----------------------------------------------------------------------------
// POLICE DISPONIBLE (envoyée au Designer pour affichage dans la combo)
// -----------------------------------------------------------------------------
structDesignerPolice est une Structure
	'id'							est un entier		<sérialise = "id">					// ID en base de données (0 si non défini)
	'nom'							est une chaîne		<sérialise = "nom">					// Nom AFFICHÉ dans la combo (libellé libre, ex: "Roboto Light")
	'nomTechnique'				est une chaîne		<sérialise = "nomTechnique">		// Nom INTERNE réel de la police (écrit dans le \fonttbl du PSMD au Lot 2 ; correspond au nom interne du TTF). Non lu par le JS web.
	'url'							est une chaîne		<sérialise = "url">					// URL du fichier police principal (.ttf, .woff2)
	'weight'						est un entier		<sérialise = "weight">				// Poids CSS : 100=Thin, 300=Light, 400=Regular, 500=Medium, 700=Bold, 900=Black
	'style'						est une chaîne		<sérialise = "style">				// Style CSS : "normal" ou "italic"
	'boldUrl'					est une chaîne		<sérialise = "boldUrl">				// URL variante Bold (vide si non disponible)
	'italicUrl'					est une chaîne		<sérialise = "italicUrl">			// URL variante Italic (vide si non disponible)
	'boldItalicUrl'			est une chaîne		<sérialise = "boldItalicUrl">		// URL variante Bold+Italic (vide si non disponible)
	'famille'					est une chaîne		<sérialise = "famille">				// Famille (cascade combo 1) = dsn_police.Famille ; repli = nom si vide
	'graisse'					est une chaîne		<sérialise = "graisse">				// Libellé de graisse (cascade combo 2) = ici_police_weight.Nom (EstPrincipal=1) pour Weight ; TEL QUEL (y compris 400)
fin

// -----------------------------------------------------------------------------
// URLS DES VARIANTES DE POLICE UTILISÉE (retournée à l'export)
// -----------------------------------------------------------------------------
structDesignerPoliceUtiliseeUrls est une Structure
	'regular'				est une chaîne		<sérialise = "regular">				// URL variante Regular (toujours renseignée)
	'bold'					est une chaîne		<sérialise = "bold">					// URL variante Bold (vide si non utilisée)
	'italic'					est une chaîne		<sérialise = "italic">				// URL variante Italic (vide si non utilisée)
	'boldItalic'			est une chaîne		<sérialise = "boldItalic">			// URL variante Bold+Italic (vide si non utilisée)
fin

// -----------------------------------------------------------------------------
// POLICE UTILISÉE (retournée à l'export pour génération PSMD)
// -----------------------------------------------------------------------------
structDesignerPoliceUtilisee est une Structure
	'nom'						est une chaîne										<sérialise = "nom">		// Nom de la police utilisée
	'urls'					est une structDesignerPoliceUtiliseeUrls	<sérialise = "urls">		// URLs des variantes utilisées
fin


// =============================================================================
// SECTION 4 : PAGES
// =============================================================================

// -----------------------------------------------------------------------------
// PAGE DU DOCUMENT
// -----------------------------------------------------------------------------
structDesignerPage est une Structure
	'numero'					est un entier			<sérialise = "numero">				// Numéro de la page (1 = recto, 2 = verso)
	'nom'						est une chaîne			<sérialise = "nom">					// Nom de la page ("Recto", "Verso")
	'urlFond'				est une chaîne			<sérialise = "urlFond">				// URL de l'image de fond (vide = pas de fond)
	'cheminFond'			est une chaîne			<sérialise = "cheminFond">
fin


// =============================================================================
// SECTION 5 : CONTRAINTES DE ZONE (architecture à 3 niveaux)
// =============================================================================
// -----------------------------------------------------------------------------
// AREA DE CONTRAINTE
// Zone rectangulaire délimitant les déplacements/redimensionnements autorisés
// -----------------------------------------------------------------------------
structDesignerAreaContrainte est une Structure
	'xMm'					est un réel			<sérialise = "xMm">					// Position X du coin supérieur gauche en mm
	'yMm'					est un réel			<sérialise = "yMm">					// Position Y du coin supérieur gauche en mm
	'wMm'					est un réel			<sérialise = "wMm">					// Largeur de l'area en mm
	'hMm'					est un réel			<sérialise = "hMm">					// Hauteur de l'area en mm
fin

// -----------------------------------------------------------------------------
// CONTRAINTE GÉOMÉTRIE (communes à tous les types de zones)
// -----------------------------------------------------------------------------
structDesignerContrainteGeometrie est une Structure
	'positionFixe'			est un booléen									<sérialise = "positionFixe">	// Position X,Y non modifiable (drag bloqué). Défaut: false
	'locked'					est un booléen									<sérialise = "locked">			// Contrainte Template : position ET taille non modifiables en mode Standard. Défaut: false
	'minWMm'					est un réel										<sérialise = "minWMm">			// Largeur minimale en mm (0 = pas de minimum)
	'maxWMm'					est un réel										<sérialise = "maxWMm">			// Largeur maximale en mm (0 = pas de maximum)
	'minHMm'					est un réel										<sérialise = "minHMm">			// Hauteur minimale en mm (0 = pas de minimum)
	'maxHMm'					est un réel										<sérialise = "maxHMm">			// Hauteur maximale en mm (0 = pas de maximum)
	'area'					est une structDesignerAreaContrainte	<sérialise = "area">				// Zone autorisée (null = pas de contrainte)
fin

// -----------------------------------------------------------------------------
// CONTRAINTE GLOBAL (communes à tous les types de zones)
// SOURCE DE VÉRITÉ pour systeme, imprimable, selectionnable, toolbarAffichable
// -----------------------------------------------------------------------------
structDesignerContrainteGlobal est une Structure
	'systeme'					est un booléen		<sérialise = "systeme">					// Zone système (entièrement protégée). Défaut: false
	'systemeLibelle'			est une chaîne		<sérialise = "systemeLibelle">		// Libellé affiché dans le badge système. Défaut: ""
	'nonSupprimable'			est un booléen		<sérialise = "nonSupprimable">		// Zone non supprimable. Défaut: false
	'imprimable'				est un booléen		<sérialise = "imprimable">				// Zone imprimée. Défaut: true (ATTENTION)
	'selectionnable'			est un booléen		<sérialise = "selectionnable">		// Zone sélectionnable. Défaut: true
	'toolbarAffichable'		est un booléen		<sérialise = "toolbarAffichable">	// Toolbar visible à la sélection. Défaut: true
	'pageModifiable'			est un booléen		<sérialise = "pageModifiable">		// Peut changer de page (Recto/Verso). Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - TEXTE
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
structDesignerContrainteStyleTexte est une Structure
	'contenuModifiable'			est un booléen	<sérialise = "contenuModifiable">		// Contenu texte modifiable. Défaut: true
	'typographieModifiable'		est un booléen	<sérialise = "typographieModifiable">	// Section Typographie modifiable. Défaut: true
	'alignementsModifiable'		est un booléen	<sérialise = "alignementsModifiable">	// Section Alignements modifiable. Défaut: true
	'fondModifiable'				est un booléen	<sérialise = "fondModifiable">			// Section Fond modifiable. Défaut: true
	'bordureModifiable'			est un booléen	<sérialise = "bordureModifiable">		// Section Bordure modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - IMAGE
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
structDesignerContrainteStyleImage est une Structure
	'typeSourceModifiable'		est un booléen	<sérialise = "typeSourceModifiable">	// Peut basculer Image fixe / Champ fusion. Défaut: true
	'imageModifiable'				est un booléen	<sérialise = "imageModifiable">			// Peut changer l'image. Défaut: true
	'affichageModifiable'		est un booléen	<sérialise = "affichageModifiable">		// Section Affichage modifiable. Défaut: true
	'fondModifiable'				est un booléen	<sérialise = "fondModifiable">			// Section Fond modifiable. Défaut: true
	'bordureModifiable'			est un booléen	<sérialise = "bordureModifiable">		// Section Bordure modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - CODE-BARRES (barcode)
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
structDesignerContrainteStyleBarcode est une Structure
	'typeCodeModifiable'			est un booléen	<sérialise = "typeCodeModifiable">		// Peut changer le type de code. Défaut: true
	'typeSourceModifiable'		est un booléen	<sérialise = "typeSourceModifiable">	// Peut basculer Valeur fixe / Champ fusion. Défaut: true
	'donneesModifiable'			est un booléen	<sérialise = "donneesModifiable">		// Peut modifier la valeur ou le champ. Défaut: true
	'apparenceModifiable'		est un booléen	<sérialise = "apparenceModifiable">		// Section Affichage modifiable. Défaut: true
	'fondModifiable'				est un booléen	<sérialise = "fondModifiable">			// Section Fond modifiable. Défaut: true
fin

// -----------------------------------------------------------------------------
// CONTRAINTE STYLE - QR CODE MARKETEAM (qr)
// Contrôle quelles sections de la toolbar sont modifiables
// -----------------------------------------------------------------------------
structDesignerContrainteStyleQR est une Structure
	'couleursModifiable'		est un booléen	<sérialise = "couleursModifiable">		// Section Couleurs modifiable. Défaut: true
fin

structDesignerContrainteStyle est une Structure
	'contenuModifiable'					est un booléen		<sérialise = "contenuModifiable">
	'typographieModifiable'				est un booléen		<sérialise = "typographieModifiable">
	'alignementsModifiable'				est un booléen		<sérialise = "alignementsModifiable">
	'fondModifiable'						est un booléen		<sérialise = "fondModifiable">
	'bordureModifiable'					est un booléen		<sérialise = "bordureModifiable">
	'typeSourceModifiable'				est un booléen		<sérialise = "typeSourceModifiable">
	'imageModifiable'						est un booléen		<sérialise = "imageModifiable">
	'affichageModifiable'				est un booléen		<sérialise = "affichageModifiable">
	'typeCodeModifiable'					est un booléen		<sérialise = "typeCodeModifiable">
	'donneesModifiable'					est un booléen		<sérialise = "donneesModifiable">
	'apparenceModifiable'				est un booléen		<sérialise = "apparenceModifiable">
	'couleursModifiable'					est un booléen		<sérialise = "couleursModifiable">
fin

// -----------------------------------------------------------------------------
// CONTRAINTE DE ZONE COMPLÈTE (structure à 3 niveaux)
// -----------------------------------------------------------------------------
structDesignerZoneContrainte est une Structure
	'Géométrie'				est une structDesignerContrainteGeometrie	<sérialise = "geometrie">	// Contraintes de position et taille
	'style'					est une structDesignerContrainteStyle		<sérialise = "style">		// Contraintes de style (structure selon type de zone)
	'global'					est une structDesignerContrainteGlobal		<sérialise = "global">		// Contraintes comportementales
fin


// =============================================================================
// SECTION 6 : ZONES TEXTE
// =============================================================================
structDesignerStyleTexte est une Structure
	'police'				est une chaîne						<sérialise = "police">				// Nom de la police (ex: "Roboto")
	'taillePt'				est un réel							<sérialise = "taillePt">			// Taille en points
	'couleurCmjn'			est une structDesignerCouleurCMJN		<sérialise = "couleurCmjn">			// Couleur du texte CMJN
	'gras'					est un booléen						<sérialise = "gras">				// OBSOLÈTE - utiliser formatage partiel
	'interligne'			est un réel							<sérialise = "interligne">			// Facteur d'interlignage (1.0 = normal)
	'alignementH'			est une chaîne						<sérialise = "alignementH">			// "left", "center", "right", "justify"
	'alignementV'			est une chaîne						<sérialise = "alignementV">			// "top", "middle", "bottom"
fin

// -----------------------------------------------------------------------------
// COPYFITTING (réduction automatique de la taille)
// -----------------------------------------------------------------------------
structDesignerCopyfitting est une Structure
	'actif'					est un booléen		<sérialise = "actif">					// Activer le copy fitting
	'tailleMinimum'			est un entier		<sérialise = "tailleMinimum">			// Taille minimum en points
	'autoriserRetourLigne'	est un booléen		<sérialise = "autoriserRetourLigne">	// Autoriser retour à la ligne automatique
fin

// -----------------------------------------------------------------------------
// FORMATAGE PARTIEL - STYLES
// -----------------------------------------------------------------------------
structDesignerFormatageStyles est une Structure
	'gras'					est un booléen						<sérialise = "gras">				// Appliquer gras
	'souligne'				est un booléen						<sérialise = "souligne">			// Appliquer souligné
	'Couleur'				est une chaîne						<sérialise = "couleur">				// Couleur hex (ex: "#FF0000")
fin

// -----------------------------------------------------------------------------
// FORMATAGE PARTIEL (gras, souligné, couleur sur une portion de texte)
// -----------------------------------------------------------------------------
structDesignerFormatage est une Structure
	'debut'					est un entier						<sérialise = "debut">				// Index de début (caractère)
	'fin'					est un entier						<sérialise = "fin">					// Index de fin (caractère)
	'styles'				est une structDesignerFormatageStyles	<sérialise = "styles">				// Styles à appliquer
fin

// -----------------------------------------------------------------------------
// ZONE TEXTE (V3.3 - format unifié)
// -----------------------------------------------------------------------------
structDesignerZoneTexte est une Structure
	// --- Identification ---
	'id'					est une chaîne						<sérialise = "id">									// Identifiant unique (ex: "zone-1")
	'page'					est un entier						<sérialise = "page">								// Numéro de page (1 = recto, 2 = verso)
	'nom'					est une chaîne						<sérialise = "nom">									// Nom de la zone (optionnel)
	'niveau'				est un entier						<sérialise = "niveau">								// Ordre d'empilement (z-index)
	'rotation'				est un entier						<sérialise = "rotation">							// Rotation en degrés

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen						<sérialise = "verrouille">							// Préférence utilisateur : zone figée (onglet Personnalisation)

	// --- Géométrie ---
	'Géométrie'				est une structDesignerGeometrie			<sérialise = "geometrie">							// Position et dimensions

	// --- Contenu ---
	'contenu'				est une chaîne						<sérialise = "contenu">								// Texte avec champs de fusion (@NOM@)
	'formatage'				est un tableau						<sérialise = "formatage"> de structDesignerFormatage	// Formatage partiel
	'quillDelta'			est une chaîne						<sérialise = "quillDelta">							// Contenu Quill au format Delta (pour édition WYSIWYG)
	'contenuRtf'			est une chaîne						<sérialise = "contenuRtf">
	'supprimerLignesVides'	est un entier						<sérialise = "supprimerLignesVides">				// 0=Conserver, 1=Supprimer si variable vide

	// --- Apparence ---
	'style'					est une structDesignerStyleTexte		<sérialise = "style">								// Style typographique
	'Fond'					est une structDesignerFond				<sérialise = "fond">								// Fond de la zone
	'bordure'				est une structDesignerBordure			<sérialise = "bordure">								// Bordure de la zone
	'copyfitting'			est une structDesignerCopyfitting		<sérialise = "copyfitting">							// Configuration copy fitting

	// --- Contraintes ---
	'contrainte'			est une structDesignerZoneContrainte	<sérialise = "contrainte">							// Toutes les contraintes (format 3 niveaux)
fin


// =============================================================================
// SECTION 7 : ZONES IMAGE
// =============================================================================

// -----------------------------------------------------------------------------
// SOURCE IMAGE
// -----------------------------------------------------------------------------
structDesignerSourceImage est une Structure
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
structDesignerRedimensionnement est une Structure
	'mode'					est une chaîne		<sérialise = "mode">				// "initial", "ajuster", "couper"
	'alignementH'			est une chaîne		<sérialise = "alignementH">			// "left", "center", "right"
	'alignementV'			est une chaîne		<sérialise = "alignementV">			// "top", "middle", "bottom"
fin

// -----------------------------------------------------------------------------
// ZONE IMAGE
// -----------------------------------------------------------------------------
structDesignerZoneImage est une Structure
	// --- Identification ---
	'id'							est une chaîne											<sérialise = "id">
	'page'						est un entier											<sérialise = "page">
	'nom'							est une chaîne											<sérialise = "nom">
	'niveau'						est un entier											<sérialise = "niveau">
	'rotation'					est un entier											<sérialise = "rotation">

	// --- Préférence utilisateur ---
	'verrouille'				est un booléen											<sérialise = "verrouille">

	// --- Géométrie ---
	'Géométrie'					est une structDesignerGeometrie					<sérialise = "geometrie">

	// --- Contenu ---
	'source'						est une structDesignerSourceImage				<sérialise = "source">
	'redimensionnement'		est une structDesignerRedimensionnement		<sérialise = "redimensionnement">

	// --- Apparence ---
	'Fond'						est une structDesignerFond							<sérialise = "fond">
	'bordure'					est une structDesignerBordure						<sérialise = "bordure">

	// --- Contraintes ---
	'contrainte'				est une structDesignerZoneContrainte			<sérialise = "contrainte">
fin


// =============================================================================
// SECTION 8 : ZONES QR CODE (Landing pages Marketeam)
// =============================================================================

// -----------------------------------------------------------------------------
// COULEURS QR CODE
// -----------------------------------------------------------------------------
structDesignerCouleursQR est une Structure
	'codeCmjn'				est une structDesignerCouleurCMJN		<sérialise = "codeCmjn">
	'fondCmjn'				est une structDesignerCouleurCMJN		<sérialise = "fondCmjn">
fin

// -----------------------------------------------------------------------------
// ZONE QR CODE
// -----------------------------------------------------------------------------
structDesignerZoneQR est une Structure
	// --- Identification ---
	'id'						est une chaîne									<sérialise = "id">
	'page'					est un entier									<sérialise = "page">
	'nom'						est une chaîne									<sérialise = "nom">
	'niveau'					est un entier									<sérialise = "niveau">
	'rotation'				est un entier									<sérialise = "rotation">

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen									<sérialise = "verrouille">

	// --- Géométrie ---
	'Géométrie'				est une structDesignerGeometrie			<sérialise = "geometrie">

	// --- Contenu ---
	'typeCode'				est une chaîne									<sérialise = "typeCode">			// Toujours "QRCode"
	'contenu'				est une chaîne									<sérialise = "contenu">				// URL ou contenu du QR code

	// --- Apparence ---
	'Couleurs'				est une structDesignerCouleursQR			<sérialise = "couleurs">

	// --- Contraintes ---
	'contrainte'			est une structDesignerZoneContrainte	<sérialise = "contrainte">
fin


// =============================================================================
// SECTION 9 : ZONES CODE-BARRES (1D et 2D)
// =============================================================================

// -----------------------------------------------------------------------------
// ZONE CODE-BARRES
// Types supportés : code128, code39, ean13, ean8, upca, upce, itf14, datamatrix, qrcode
// -----------------------------------------------------------------------------
structDesignerZoneCodeBarres est une Structure
	// --- Identification ---
	'id'						est une chaîne									<sérialise = "id">
	'page'					est un entier									<sérialise = "page">
	'nom'						est une chaîne									<sérialise = "nom">
	'niveau'					est un entier									<sérialise = "niveau">
	'rotation'				est un entier									<sérialise = "rotation">

	// --- Préférence utilisateur ---
	'verrouille'			est un booléen									<sérialise = "verrouille">

	// --- Géométrie ---
	'Géométrie'				est une structDesignerGeometrie			<sérialise = "geometrie">

	// --- Contenu ---
	'typeCodeBarres'		est une chaîne									<sérialise = "typeCodeBarres">		// Type : "code128", "ean13", "datamatrix", "qrcode", etc.
	'forme'					est une chaîne									<sérialise = "forme">					// Forme DataMatrix : "square" (défaut) ou "rectangle" (12x36)
	'sourceType'			est une chaîne									<sérialise = "sourceType">				// "fixe" ou "champ"
	'champFusion'			est une chaîne									<sérialise = "champFusion">			// Nom du champ sans @ (vide si statique)
	'valeurStatique'		est une chaîne									<sérialise = "valeurStatique">		// Valeur si pas de champ fusion
	'texteLisible'			est une chaîne									<sérialise = "texteLisible">			// "aucun" ou "dessous"
	'taillePolice'			est un entier									<sérialise = "taillePolice">			// Taille du texte lisible en points
	'qrConfig'				est une chaîne									<sérialise = "qrConfig">				// Configuration QR intelligent (null si non applicable)

	// --- Apparence ---
	'couleurCmjn'			est une structDesignerCouleurCMJN		<sérialise = "couleurCmjn">			// Couleur du code
	'couleurFondCmjn'		est une structDesignerCouleurCMJN		<sérialise = "couleurFondCmjn">		// Couleur de fond
	'transparent'			est un booléen									<sérialise = "transparent">			// Fond transparent

	// --- Contraintes ---
	'contrainte'			est une structDesignerZoneContrainte	<sérialise = "contrainte">
fin


// =============================================================================
// SECTION 10 : CONTRAINTES GLOBALES DU DOCUMENT
// =============================================================================

// -----------------------------------------------------------------------------
// AUTORISATIONS DE CRÉATION PAR TYPE DE ZONE
// -----------------------------------------------------------------------------
structDesignerConstraintsAutorisations est une Structure
	'texte'					est un booléen		<sérialise = "texte">				// Autoriser création zones texte
	'Image'					est un booléen		<sérialise = "image">				// Autoriser création zones image
	'qr'						est un booléen		<sérialise = "qr">					// Autoriser création QR Code Marketeam
	'barcode'				est un booléen		<sérialise = "barcode">				// Autoriser création codes-barres
fin

// -----------------------------------------------------------------------------
// LIMITES DE NOMBRE PAR TYPE DE ZONE
// Valeur -1 = illimité, 0 = interdit, >0 = nombre maximum
// -----------------------------------------------------------------------------
structDesignerConstraintsLimites est une Structure
	'texte'					est un entier		<sérialise = "texte">				// Limite zones texte (-1 = illimité)
	'Image'					est un entier		<sérialise = "image">				// Limite zones image (-1 = illimité)
	'qr'						est un entier		<sérialise = "qr">					// Limite QR Code (-1 = illimité)
	'barcode'				est un entier		<sérialise = "barcode">				// Limite codes-barres (-1 = illimité)
fin

// -----------------------------------------------------------------------------
// CONTRAINTES GLOBALES DU DOCUMENT
// -----------------------------------------------------------------------------
structDesignerConstraints est une Structure
	'autorisations'			est une structDesignerConstraintsAutorisations	<sérialise = "autorisations">
	'limites'					est une structDesignerConstraintsLimites			<sérialise = "limites">
fin


// =============================================================================
// SECTION 11 : DONNÉES D'APERÇU
// =============================================================================

// V3.4 : 'nom' peut valoir "LOCAL_<localId>" pour les échantillons des
//        champs créés dans le Designer non encore mappés (cf.
//        structDesignerChampFusion.localId). Une fois le mapping effectué
//        côté SaaS, le Designer substitue ces clés par le 'nom' technique
//        réel à la prochaine sauvegarde.
structDesignerChamp est une Structure
	'nom'					est une chaîne		<sérialise = "nom">					// Nom technique du champ ; peut valoir "LOCAL_<localId>" pour les champs Designer non mappés (V3.4)
	'valeur'				est une chaîne		<sérialise = "valeur">				// Valeur d'échantillon
fin

structDesignerEnregistrement est une Structure
	'Enregistrement'		est un tableau		<sérialise = "enregistrement"> de structDesignerChamp
fin


// =============================================================================
// SECTION 12 : DOCUMENT COMPLET
// =============================================================================

structDesignerDocument est une Structure
	'identification'		est une structDesignerIdentification		<sérialise = "identification">
	'formatDocument'		est une structDesignerFormatDocument		<sérialise = "formatDocument">
	'champsFusion'			est un tableau							<sérialise = "champsFusion"> de structDesignerChampFusion
	'donneesApercu'			est un tableau							<sérialise = "donneesApercu"> de structDesignerEnregistrement
	'polices'				est un tableau							<sérialise = "polices"> de structDesignerPolice
	'policesUtilisees'		est un tableau							<sérialise = "policesUtilisees"> de structDesignerPoliceUtilisee
	'pages'					est un tableau							<sérialise = "pages"> de structDesignerPage
	'zonesTexte'			est un tableau							<sérialise = "zonesTexte"> de structDesignerZoneTexte
	'zonesQR'				est un tableau							<sérialise = "zonesQR"> de structDesignerZoneQR
	'zonesCodeBarres'		est un tableau							<sérialise = "zonesCodeBarres"> de structDesignerZoneCodeBarres
	'zonesImage'			est un tableau							<sérialise = "zonesImage"> de structDesignerZoneImage
fin

structDesignerLimites est une Structure
	'zipMaxFileSize'		est un entier				<sérialise = "zipMaxFileSize">
	'zipMinImageSize'		est un entier				<sérialise = "zipMinImageSize">
	'zipMaxImageSize'		est un entier				<sérialise = "zipMaxImageSize">
	'zipExtensions'			est un tableau				<sérialise = "zipAcceptedImageExtensions"> de chaînes
fin

// =============================================================================
// SECTION 13 : MESSAGES POSTMESSAGE
// =============================================================================

structDesignerLoad est une Structure
	'action'						est une chaîne										<sérialise = "action">					// Toujours "load"
	'auth'						est une structDesignerAuth						<sérialise = "auth">
	'bases'						est une structDesignerBaseListe				<sérialise = "bases">					// Les bases de données utilisé dans l'opération
	'Theme'						est une chaîne ANSI								<sérialise = "theme">					// Pour définir la couleur du thème
	'Document'					est une structDesignerDocument				<sérialise = "data">						// Document à charger
	'constraints'				est une structDesignerConstraints			<sérialise = "constraints">			// Contraintes globales
	'limites'					est une structDesignerLimites					<sérialise = "limites">					// Limites sur les images acceptées
	'policesDisponibles'		est un tableau										<sérialise = "policesDisponibles"> de structDesignerPolice
	// V3.4 - Listes de référence pour la modale "Ajouter un champ" du Designer.
	//        Toujours envoyées (création tunnel ET création modèle), même quand
	//        ChampsFusionInterdit = Vrai (le bouton est juste désactivé côté Designer).
	'champsStandard'			est un tableau										<sérialise = "champsStandard"> de structDesignerChampStandard
	'typesDisponibles'		est un tableau										<sérialise = "typesDisponibles"> de structDesignerTypeChamp
	// V3.5 - Verrouillage global de la gestion des champs (ajout/modif/suppression).
	//        Vrai par défaut (compatibilité ascendante).
	//        Faux = base BDD associée à la commande : ajout/modif/suppression bloqués.
	//        Voir ComposerJsonDesignerCreation (tunnel) qui le passe à Faux quand
	//        stOperation.tabBase..Occurrence > 0 (base sélectionnée).
	//        ComposerJsonDesignerModele (template) le laisse toujours à Vrai.
	'autoriserGestionChamps'	est un booléen									<sérialise = "autoriserGestionChamps">
	// Voir ComposerJsonDesignerCreation : Vrai pour document intérieur si enveloppe sans fenêtre (pas de fusion BDD)
	'ChampsFusionInterdit'		est un booléen									<sérialise = "ChampsFusionInterdit">
	// --- Zone de personnalisation (optionnel) : rectangle autorisé par index de page ---s
	'ZonePersonnalisation'	est un tableau										<sérialise = "ZonePersonnalisation"> de structDesignerZonePersonnalisationPage
	// Si tu préfères l’objet { "0": {...}, "1": {...} } : utilise une chaîne JSON + Sérialise vers JSON,
	// ou une structure dédiée projet (tableau associatif clé chaîne → stDesignerZonePersonnalisationPage).
fin

structDesignerBase est une Structure
	IdBase					est un entier						<sérialise = "IdBase">
	origine					est une chaîne						<sérialise = "origine">
fin

structDesignerBaseListe est une Structure
	pListe 					est un tableau   					<sérialise = "liste"> de structDesignerBase
fin

structDesignerAuth est une Structure
	IdClient						est un entier						<sérialise = "idClient">
	IdContact					est un entier						<sérialise = "idContact">
	SecretKey					est une chaîne						<sérialise = "secretKey">
	UrlWebservice				est une chaîne						<sérialise = "urlWebservice">
	UrlCollectionListe		est une chaîne						<sérialise = "urlCollectionListe">
fin


structDesignerExport est une Structure
	'action'					est une chaîne									<sérialise = "action">				// Toujours "exported"
	'success'				est un booléen									<sérialise = "success">				// Succès de l'export
	'data'					est une structDesignerDocument			<sérialise = "data">					// Document exporté
fin

structDesignerZoneSystemeTexte est une Structure
	Id								est une chaîne
	Nom							est une chaîne
	Page							est un entier
	Contenu						est une chaîne
	PosX							est un entier
	PosY							est un entier
	Largeur						est un entier
	Hauteur						est un entier
	Police						est une chaîne
	TaillePt						est une chaîne
	AlignementV					est une chaîne
	AlignementH					est une chaîne
	FondTransparent			est un booléen
	BordureEpaisseur			est un entier
	BordureStyle				est une chaîne
	Imprimable					est un booléen
fin

structDesignerZoneSystemeDatamatrix est une Structure
	Id								est une chaîne
	Nom							est une chaîne
	Page							est un entier
	SourceType					est une chaîne	// "fixe" ou "champ"
	ChampFusion					est une chaîne	// Nom du champ sans @ (vide si statique)
	ValeurStatique				est une chaîne
	PosX							est un entier
	PosY							est un entier
	Largeur						est un entier
	Hauteur						est un entier
	Forme							est une chaîne
	FondTransparent			est un booléen
	Imprimable					est un booléen
fin


// =============================================================================
// SECTION 13 bis : ZONE DE PERSONNALISATION (message load → Designer)
// =============================================================================
// Délimite, par PAGE (index 0 = 1re page / recto si le document commence par le recto),
// le rectangle (mm, repère format fini : origine coin haut-gauche) où l’utilisateur peut
// créer / déplacer / redimensionner les zones. Indépendant de l’« area » par zone
// (stDesignerAreaContrainte) qui borne le contenu à l’intérieur d’une zone.
//
// Sérialisation JSON : propriété "ZonePersonnalisation" (casse recommandée ; le Designer
// accepte aussi "zonePersonnalisation" en secours).
//
// Formes acceptées côté Designer après sérialisation JSON :
//   • Objet avec clés de page en chaîne : "0", "1", "2", …  →  { "0": { ... }, "1": { ... } }
//   • Tableau : l’indice du tableau = index de page (0, 1, …)
// « Pas de limite » pour une page : absence de clé pour cette page (objet) ou pas d’élément
// à cet index (tableau plus court / trou).
// =============================================================================

// -----------------------------------------------------------------------------
// RECTANGLE AUTORISÉ POUR UNE PAGE (mm, format fini)
// Même sémantique que stDesignerGeometrie (xMm, yMm, largeurMm, hauteurMm).
// Soit tu réutilises stDesignerGeometrie, soit tu gardes ce type dédié pour la doc métier.
// -----------------------------------------------------------------------------
structDesignerZonePersonnalisationPage est une Structure
	'xMm'				est un réel		<sérialise = "xMm">			// Coin supérieur gauche du rectangle autorisé (mm depuis le bord gauche du format fini)
	'yMm'				est un réel		<sérialise = "yMm">			// Coin supérieur gauche (mm depuis le bord supérieur du format fini)
	'largeurMm'		est un réel		<sérialise = "largeurMm">	// Largeur du rectangle autorisé (mm)
	'hauteurMm'		est un réel		<sérialise = "hauteurMm">	// Hauteur du rectangle autorisé (mm)
fin