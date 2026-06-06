#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script JETABLE d'inspection des noms internes de polices TTF.
NE FAIT PARTIE D'AUCUN CODE DE PRODUCTION.

Lit tous les .ttf d'un dossier et imprime, pour chaque fichier, sa table 'name' :
  - nameID 1  = Family name
  - nameID 2  = Subfamily (Regular/Bold/Italic...)
  - nameID 4  = Full name
  - nameID 6  = PostScript name
  - nameID 16 = Typographic Family (si present)
  - nameID 17 = Typographic Subfamily (si present)

Usage :
  python inspect_ttf_names.py <dossier>
  python inspect_ttf_names.py <dossier> --recursif    (parcours recursif)

Prerequis :
  pip install fonttools
"""

import os
import sys

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.stderr.write(
        "ERREUR : la librairie 'fonttools' est absente.\n"
        "Installe-la avec :  pip install fonttools\n"
    )
    sys.exit(1)

# nameID -> libelle
NAME_IDS = [
    (1,  "nameID 1  Family name           "),
    (2,  "nameID 2  Subfamily             "),
    (4,  "nameID 4  Full name             "),
    (6,  "nameID 6  PostScript name       "),
    (16, "nameID 16 Typographic Family    "),
    (17, "nameID 17 Typographic Subfamily "),
]


def lire_nom(name_table, name_id):
    """Renvoie la valeur lisible d'un nameID, ou None si absent."""
    rec = name_table.getName(nameID=name_id, platformID=3, platEncID=1, langID=0x409)  # Windows/Unicode/EN-US
    if rec is None:
        rec = name_table.getName(nameID=name_id, platformID=1, platEncID=0, langID=0)   # Mac/Roman/EN
    if rec is None:
        # repli : premier enregistrement disponible pour ce nameID
        for r in name_table.names:
            if r.nameID == name_id:
                rec = r
                break
    if rec is None:
        return None
    try:
        return rec.toUnicode()
    except Exception:
        return rec.toBytes().decode("latin-1", "replace")


def inspecter_fichier(chemin):
    print("=" * 72)
    print("Fichier : " + os.path.basename(chemin))
    print("Chemin  : " + chemin)
    print("-" * 72)
    try:
        font = TTFont(chemin, lazy=True, fontNumber=0)
        name_table = font["name"]
    except Exception as e:
        print("  !! Impossible de lire la police : " + str(e))
        print("")
        return
    for nid, libelle in NAME_IDS:
        valeur = lire_nom(name_table, nid)
        if valeur is None:
            print("  " + libelle + ": (absent)")
        else:
            print("  " + libelle + ": " + valeur)
    try:
        font.close()
    except Exception:
        pass
    print("")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    recursif = "--recursif" in sys.argv

    if not args:
        sys.stderr.write("Usage : python inspect_ttf_names.py <dossier> [--recursif]\n")
        sys.exit(1)

    dossier = args[0]
    if not os.path.isdir(dossier):
        sys.stderr.write("ERREUR : dossier introuvable : " + dossier + "\n")
        sys.exit(1)

    fichiers = []
    if recursif:
        for racine, _dirs, noms in os.walk(dossier):
            for nom in noms:
                if nom.lower().endswith(".ttf"):
                    fichiers.append(os.path.join(racine, nom))
    else:
        for nom in os.listdir(dossier):
            if nom.lower().endswith(".ttf"):
                fichiers.append(os.path.join(dossier, nom))

    fichiers.sort()

    if not fichiers:
        print("Aucun fichier .ttf trouve dans : " + dossier)
        return

    print("Polices .ttf trouvees : " + str(len(fichiers)))
    print("")
    for chemin in fichiers:
        inspecter_fichier(chemin)


if __name__ == "__main__":
    main()
