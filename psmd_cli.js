/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                     MARKETEAM DESIGNER - PSMD CLI                           ║
 * ║          Génération de fichier .psmd côté serveur via Node.js               ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  Remplace la génération navigateur (GenererPsmdNavigateur + gsXmlPsmd)      ║
 * ║  par une exécution 100% serveur, sans aller-retour iframe.                  ║
 * ║                                                                              ║
 * ║  USAGE :                                                                    ║
 * ║    node psmd_cli.js <json> <psmd> [--no-bleed] [--imposition]               ║
 * ║                                                                              ║
 * ║  PARAMÈTRES :                                                               ║
 * ║    argv[2] : chemin du fichier JSON en entrée (encodage UTF-8)              ║
 * ║              Format accepté :                                               ║
 * ║                - JSON complet stDesignerLoad → le bloc "data" est extrait   ║
 * ║                - Bloc "data" seul (stDesignerDocument)                      ║
 * ║    argv[3] : chemin du fichier .psmd à produire (encodage UTF-8)            ║
 * ║    --no-bleed : (optionnel) désactive le fond perdu dans le PSMD généré     ║
 * ║                 Utile pour la génération de BAT (aperçu) afin d'éviter      ║
 * ║                 un bug de rendu des codes-barres dans CreateJPEGPreview      ║
 * ║    --imposition : (optionnel) active l'imposition automatique N-up          ║
 * ║                   sur feuille A3 (sans fond perdu) ou SRA3 (avec)           ║
 * ║                                                                              ║
 * ║  SORTIES :                                                                  ║
 * ║    Exit 0 : succès — fichier .psmd écrit à argv[3]                         ║
 * ║             + images base64 extraites dans le même répertoire              ║
 * ║             + manifeste <psmd>.images.json si images présentes             ║
 * ║    Exit 1 : erreur — message sur stderr, rien écrit                         ║
 * ║                                                                              ║
 * ║  DÉPENDANCE :                                                               ║
 * ║    psmd-generator.js doit être dans le même répertoire que ce fichier       ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

var fs   = require('fs');
var path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Chargement de psmd-generator.js (même répertoire que ce fichier)
// Il expose PsmdGenerator sur global automatiquement en environnement Node.js
// ─────────────────────────────────────────────────────────────────────────────
try {
    require(path.join(__dirname, 'psmd-generator.js'));
} catch (e) {
    process.stderr.write('ERREUR : impossible de charger psmd-generator.js\n');
    process.stderr.write(e.message + '\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation des arguments
// ─────────────────────────────────────────────────────────────────────────────
var args = process.argv.slice(2);

if (args.length < 2) {
    process.stderr.write('USAGE : node psmd_cli.js <chemin_json_entree> <chemin_psmd_sortie>\n');
    process.exit(1);
}

var cheminJsonEntree = args[0];
var cheminPsmdSortie = args[1];
var noBleed     = args.indexOf('--no-bleed') !== -1;
var imposition  = args.indexOf('--imposition') !== -1;

// ─────────────────────────────────────────────────────────────────────────────
// Lecture du fichier JSON
// ─────────────────────────────────────────────────────────────────────────────
var contenuJson;
try {
    contenuJson = fs.readFileSync(cheminJsonEntree, 'utf8');
} catch (e) {
    process.stderr.write('ERREUR : lecture JSON impossible : ' + cheminJsonEntree + '\n');
    process.stderr.write(e.message + '\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing JSON
// ─────────────────────────────────────────────────────────────────────────────
var jsonParse;
try {
    jsonParse = JSON.parse(contenuJson);
} catch (e) {
    process.stderr.write('ERREUR : JSON invalide dans ' + cheminJsonEntree + '\n');
    process.stderr.write(e.message + '\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction du bloc "data"
// ComposerJsonDesignerCreation sérialise un stDesignerLoad complet,
// mais generatePsmdFromJson n'attend que le sous-bloc "data".
// On accepte les deux formats pour flexibilité.
// ─────────────────────────────────────────────────────────────────────────────
var jsonDoc = jsonParse.data ? jsonParse.data : jsonParse;

if (!jsonDoc) {
    process.stderr.write('ERREUR : bloc "data" introuvable dans le JSON\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Option --no-bleed : générer un PSMD au format fini (A4, etc.)
// sans fond perdu ni format papier SRA — pour la génération BAT (aperçu JPEG)
// Corrige un bug de rendu des codes-barres dans CreateJPEGPreviewOfLayout
// quand le bleed est en mode "Ajouter à la tâche" sur un format SRA
//
// IMPORTANT : on ne touche PAS à fondPerdu.actif car les bounds de l'image
// de fond PDF ont besoin des valeurs de fond perdu pour déborder correctement.
// On utilise _bleedModeOverride = 0 pour forcer bleed mode=0 et marges=0
// dans les sections <preferences> et <imposition> du PSMD.
// ─────────────────────────────────────────────────────────────────────────────
if (noBleed && jsonDoc.formatDocument) {
    jsonDoc.formatDocument._bleedModeOverride = 0;
    delete jsonDoc.formatDocument.formatPapierLargeurMm;
    delete jsonDoc.formatDocument.formatPapierHauteurMm;
}

// ─────────────────────────────────────────────────────────────────────────────
// Option --imposition : active l'imposition N-up automatique.
// Le générateur calcule le schéma (colonnes×lignes) et les dimensions feuille
// (A3 sans fond perdu, SRA3 avec) à partir du format document.
// ─────────────────────────────────────────────────────────────────────────────
if (imposition && jsonDoc.formatDocument) {
    jsonDoc.formatDocument._impositionEnabled = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Génération PSMD
// ─────────────────────────────────────────────────────────────────────────────
var result;
try {
    result = global.PsmdGenerator.generatePsmdFromJson(jsonDoc);
} catch (e) {
    process.stderr.write('ERREUR : generatePsmdFromJson a levé une exception\n');
    process.stderr.write(e.message + '\n');
    process.exit(1);
}

if (!result || !result.xml) {
    process.stderr.write('ERREUR : generatePsmdFromJson a retourné un résultat vide\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Écriture du fichier .psmd
// PrintShop Mail attend du XML en UTF-8 (cohérent avec encoding="UTF-8" du PSMD)
// ─────────────────────────────────────────────────────────────────────────────
try {
    fs.writeFileSync(cheminPsmdSortie, result.xml, 'utf8');
} catch (e) {
    process.stderr.write('ERREUR : écriture PSMD impossible : ' + cheminPsmdSortie + '\n');
    process.stderr.write(e.message + '\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sauvegarde des images exportées (zones image fixes avec base64)
// Les images sont sauvegardées dans le même répertoire que le fichier .psmd
// Un manifeste JSON est écrit pour que WebDev puisse retrouver les fichiers
// ─────────────────────────────────────────────────────────────────────────────
var repSortie = path.dirname(cheminPsmdSortie);
var manifeste = [];

if (result.images && result.images.length > 0) {
    for (var i = 0; i < result.images.length; i++) {
        var img = result.images[i];
        if (!img.fileName || !img.base64) continue;

        var cheminImage = path.join(repSortie, img.fileName);
        try {
            var base64Data = img.base64;
            var commaIndex = base64Data.indexOf(',');
            if (commaIndex !== -1) {
                base64Data = base64Data.substring(commaIndex + 1);
            }
            var bufferImage = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(cheminImage, bufferImage);
            manifeste.push({
                fileName: img.fileName,
                zoneId: img.zoneId || '',
                fullPath: cheminImage
            });
            process.stdout.write('IMAGE:' + cheminImage + '\n');
        } catch (e) {
            process.stderr.write('AVERTISSEMENT : image non sauvegardée : ' + img.fileName + '\n');
            process.stderr.write(e.message + '\n');
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Écriture du manifeste images (même chemin que le PSMD + .images.json)
// Toujours écrit, même vide, pour que WebDev sache qu'il n'y a pas d'images
// ─────────────────────────────────────────────────────────────────────────────
var cheminManifeste = cheminPsmdSortie + '.images.json';
try {
    fs.writeFileSync(cheminManifeste, JSON.stringify(manifeste, null, 2), 'utf8');
} catch (e) {
    process.stderr.write('AVERTISSEMENT : manifeste non écrit : ' + cheminManifeste + '\n');
    process.stderr.write(e.message + '\n');
}

// Succès
process.stdout.write('OK:' + cheminPsmdSortie + '\n');
process.exit(0);
process.exit(0);
