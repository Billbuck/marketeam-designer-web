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
 * ║    node psmd_cli.js <chemin_json_entree> <chemin_psmd_sortie>               ║
 * ║                                                                              ║
 * ║  PARAMÈTRES :                                                               ║
 * ║    argv[2] : chemin du fichier JSON en entrée (encodage UTF-8)              ║
 * ║              Format accepté :                                               ║
 * ║                - JSON complet stDesignerLoad → le bloc "data" est extrait   ║
 * ║                - Bloc "data" seul (stDesignerDocument)                      ║
 * ║    argv[3] : chemin du fichier .psmd à produire (encodage UTF-8)            ║
 * ║                                                                              ║
 * ║  SORTIES :                                                                  ║
 * ║    Exit 0 : succès — fichier .psmd écrit à argv[3]                         ║
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
// ─────────────────────────────────────────────────────────────────────────────
var repSortie = path.dirname(cheminPsmdSortie);

if (result.images && result.images.length > 0) {
    for (var i = 0; i < result.images.length; i++) {
        var img = result.images[i];
        if (!img.fileName || !img.base64) continue;

        var cheminImage = path.join(repSortie, img.fileName);
        try {
            var bufferImage = Buffer.from(img.base64, 'base64');
            fs.writeFileSync(cheminImage, bufferImage);
            process.stdout.write('IMAGE:' + cheminImage + '\n');
        } catch (e) {
            process.stderr.write('AVERTISSEMENT : image non sauvegardée : ' + img.fileName + '\n');
            process.stderr.write(e.message + '\n');
            // Non bloquant — le PSMD est déjà écrit
        }
    }
}

// Succès : on écrit une confirmation sur stdout (lisible par WebDev via la sortie du processus)
process.stdout.write('OK:' + cheminPsmdSortie + '\n');
process.exit(0);