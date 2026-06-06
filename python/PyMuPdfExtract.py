# =============================================================================
# PYMUPDF EXTRACT API - VERSION 2.4
# =============================================================================
# API HTTP pour extraire les informations des fichiers PDF
# Utilisé par WebDev pour analyser les PDF avant traitement
#
# Version : 2.4
# Date : Mars 2026
# Dépendances : PyMuPDF (fitz), Flask
#
# Principe :
#   L'API extrait les données brutes, WebDev décide quoi vérifier
#   (format, fond perdu, permissions, etc.)
#
# Usage :
#   python PyMuPdfExtract.py
#   → Démarre le serveur sur http://localhost:5000
#
# Endpoints :
#   GET /PyMuPdfExtract/status
#   GET /PyMuPdfExtract/validate?file=C:\chemin\document.pdf
#   GET /PyMuPdfExtract/formats
#   GET /PyMuPdfExtract/normalize_bleedbox?file=C:\chemin\document.pdf
#   GET /PyMuPdfExtract/inject_trim_bleed_boxes?file=C:\chemin\document.pdf&trim_x=5.0&trim_y=5.0&trim_w=210.0&trim_h=297.0&bleed=5.0
#
# =============================================================================

from flask import Flask, request, jsonify
import fitz  # PyMuPDF
import os

app = Flask(__name__)

# =============================================================================
# CONSTANTES
# =============================================================================

# Conversion : 1 point PDF = 0.352778 mm (72 points = 1 inch = 25.4 mm)
POINTS_TO_MM = 25.4 / 72.0
MM_TO_POINTS = 72.0 / 25.4

# Formats standards (largeur x hauteur en mm)
FORMATS_STANDARDS = {
    "A3": (297, 420),
    "A4": (210, 297),
    "A5": (148, 210),
    "A6": (105, 148),
    "DL": (110, 220),
    "C4": (229, 324),
    "C5": (162, 229),
    "C6": (114, 162),
    "Letter": (216, 279),
    "Legal": (216, 356),
}

# Tolérance pour la détection de format (en mm)
TOLERANCE_FORMAT_MM = 2.0


# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

def points_to_mm(points):
    """
    Convertit des points PDF en millimètres.
    
    Args:
        points (float): Valeur en points PDF
        
    Returns:
        float: Valeur en millimètres, arrondie à 2 décimales
    """
    return round(points * POINTS_TO_MM, 2)


def rect_to_mm(rect):
    """
    Convertit un rectangle PyMuPDF (en points) en dimensions mm.
    
    Args:
        rect (fitz.Rect): Rectangle PyMuPDF
        
    Returns:
        dict: Dictionnaire avec largeurMm, hauteurMm, xMm, yMm
    """
    return {
        "largeurMm": points_to_mm(rect.width),
        "hauteurMm": points_to_mm(rect.height),
        "xMm": points_to_mm(rect.x0),
        "yMm": points_to_mm(rect.y0)
    }


def detect_format(largeur_mm, hauteur_mm):
    """
    Détecte le format standard correspondant aux dimensions.
    Teste en portrait et paysage.
    
    Args:
        largeur_mm (float): Largeur en mm
        hauteur_mm (float): Hauteur en mm
        
    Returns:
        tuple: (nom_format, orientation) ou (None, None) si non détecté
    """
    for nom, (larg, haut) in FORMATS_STANDARDS.items():
        # Test portrait
        if (abs(largeur_mm - larg) <= TOLERANCE_FORMAT_MM and 
            abs(hauteur_mm - haut) <= TOLERANCE_FORMAT_MM):
            return nom, "portrait"
        # Test paysage
        if (abs(largeur_mm - haut) <= TOLERANCE_FORMAT_MM and 
            abs(hauteur_mm - larg) <= TOLERANCE_FORMAT_MM):
            return nom, "paysage"
    
    return None, None


def calculate_bleed(trimbox_mm, bleedbox_mm):
    """
    Calcule le fond perdu en mm.
    Le fond perdu est la différence entre BleedBox et TrimBox.
    
    Args:
        trimbox_mm (dict): TrimBox en mm
        bleedbox_mm (dict): BleedBox en mm
        
    Returns:
        dict: Fond perdu sur chaque côté (gauche, droite, haut, bas, minimum)
    """
    gauche = round(trimbox_mm["xMm"] - bleedbox_mm["xMm"], 2)
    haut = round(trimbox_mm["yMm"] - bleedbox_mm["yMm"], 2)
    droite = round((bleedbox_mm["xMm"] + bleedbox_mm["largeurMm"]) - 
                   (trimbox_mm["xMm"] + trimbox_mm["largeurMm"]), 2)
    bas = round((bleedbox_mm["yMm"] + bleedbox_mm["hauteurMm"]) - 
                (trimbox_mm["yMm"] + trimbox_mm["hauteurMm"]), 2)
    
    # Le minimum des 4 côtés (utile pour la validation côté WebDev)
    minimum = min(gauche, droite, haut, bas)
    
    return {
        "gauche": gauche,
        "droite": droite,
        "haut": haut,
        "bas": bas,
        "minimum": round(minimum, 2)
    }


def parse_rect(raw_str):
    """
    Parse une chaîne de rectangle PDF brut en liste de floats.
    Format attendu : "[x0 y0 x1 y1]"

    Args:
        raw_str (str): Chaîne brute issue de xref_get_key, ex: "[0 0 595.28 841.89]"

    Returns:
        list[float]: [x0, y0, x1, y1]
    """
    vals = raw_str.strip('[] ').split()
    return [float(v) for v in vals]


def fmt_rect(x0, y0, x1, y1):
    """
    Formate quatre coordonnées en chaîne de rectangle PDF.

    Args:
        x0 (float): Coin bas-gauche X (points)
        y0 (float): Coin bas-gauche Y (points)
        x1 (float): Coin haut-droit X (points)
        y1 (float): Coin haut-droit Y (points)

    Returns:
        str: Chaîne au format "[x0.4f y0.4f x1.4f y1.4f]"
    """
    return f"[{x0:.4f} {y0:.4f} {x1:.4f} {y1:.4f}]"


def get_document_metadata(doc):
    """
    Extrait les métadonnées du document PDF.
    
    Args:
        doc (fitz.Document): Document PyMuPDF
        
    Returns:
        dict: Métadonnées du document
    """
    metadata = doc.metadata or {}
    
    return {
        "format": metadata.get("format", ""),
        "title": metadata.get("title", ""),
        "author": metadata.get("author", ""),
        "subject": metadata.get("subject", ""),
        "keywords": metadata.get("keywords", ""),
        "creator": metadata.get("creator", ""),
        "producer": metadata.get("producer", ""),
        "creationDate": metadata.get("creationDate", ""),
        "modDate": metadata.get("modDate", ""),
        "encryption": metadata.get("encryption", None)
    }


def get_document_permissions(doc):
    """
    Extrait les permissions du document PDF.
    
    Args:
        doc (fitz.Document): Document PyMuPDF
        
    Returns:
        dict: Permissions du document
    """
    needs_pass = doc.needs_pass
    is_encrypted = doc.is_encrypted
    
    try:
        perms = doc.permissions
        if perms is None:
            permissions = {
                "print": True,
                "printHq": True,
                "copy": True,
                "edit": True,
                "annotate": True,
                "form": True,
                "accessibility": True,
                "assemble": True
            }
        else:
            permissions = {
                "print": bool(perms & fitz.PDF_PERM_PRINT),
                "printHq": bool(perms & fitz.PDF_PERM_PRINT_HQ),
                "copy": bool(perms & fitz.PDF_PERM_COPY),
                "edit": bool(perms & fitz.PDF_PERM_MODIFY),
                "annotate": bool(perms & fitz.PDF_PERM_ANNOTATE),
                "form": bool(perms & fitz.PDF_PERM_FORM),
                "accessibility": bool(perms & fitz.PDF_PERM_ACCESSIBILITY),
                "assemble": bool(perms & fitz.PDF_PERM_ASSEMBLE)
            }
    except Exception:
        permissions = {
            "print": True,
            "printHq": True,
            "copy": True,
            "edit": True,
            "annotate": True,
            "form": True,
            "accessibility": True,
            "assemble": True
        }
    
    return {
        "needsPassword": needs_pass,
        "isEncrypted": is_encrypted,
        "permissions": permissions
    }


def get_document_fonts(doc):
    """
    Extrait la liste des polices utilisées dans tout le document.
    
    Args:
        doc (fitz.Document): Document PyMuPDF
        
    Returns:
        list: Liste des polices uniques avec leurs informations
    """
    fonts_set = {}
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        try:
            fonts_list = page.get_fonts(full=True)
            
            for font_info in fonts_list:
                if len(font_info) >= 5:
                    xref = font_info[0]
                    ext = font_info[1]
                    font_type = font_info[2]
                    basefont = font_info[3]
                    name = font_info[4]
                    
                    clean_name = basefont
                    if "+" in basefont:
                        clean_name = basefont.split("+", 1)[1]
                    
                    if clean_name not in fonts_set:
                        fonts_set[clean_name] = {
                            "nom": clean_name,
                            "nomComplet": basefont,
                            "type": font_type,
                            "extension": ext,
                            "pages": [page_num + 1]
                        }
                    else:
                        if (page_num + 1) not in fonts_set[clean_name]["pages"]:
                            fonts_set[clean_name]["pages"].append(page_num + 1)
        except Exception:
            pass
    
    fonts_list = sorted(fonts_set.values(), key=lambda x: x["nom"].lower())
    return fonts_list


def get_document_images(doc):
    """
    Extrait la liste des images présentes dans tout le document.
    
    Args:
        doc (fitz.Document): Document PyMuPDF
        
    Returns:
        list: Liste des images avec leurs informations
    """
    images_list = []
    images_seen = set()
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        try:
            page_images = page.get_images(full=True)
            
            for img_info in page_images:
                xref = img_info[0]
                
                if xref in images_seen:
                    for img in images_list:
                        if img["xref"] == xref:
                            if (page_num + 1) not in img["pages"]:
                                img["pages"].append(page_num + 1)
                            break
                    continue
                
                images_seen.add(xref)
                
                width = img_info[2]
                height = img_info[3]
                bpc = img_info[4]
                colorspace = img_info[5]
                name = img_info[7] if len(img_info) > 7 else ""
                filter_type = img_info[8] if len(img_info) > 8 else ""
                
                channels = 3 if colorspace in ["DeviceRGB", "RGB"] else (4 if colorspace in ["DeviceCMYK", "CMYK"] else 1)
                size_bytes = width * height * channels * (bpc / 8)
                size_ko = round(size_bytes / 1024, 1)
                
                images_list.append({
                    "xref": xref,
                    "nom": name,
                    "largeurPx": width,
                    "hauteurPx": height,
                    "bitsParComposant": bpc,
                    "espaceColorimetrique": colorspace,
                    "filtre": filter_type,
                    "tailleEstimeeKo": size_ko,
                    "pages": [page_num + 1]
                })
        except Exception:
            pass
    
    return images_list


def get_page_boxes(page):
    """
    Extrait toutes les PageBoxes d'une page PDF.
    
    Args:
        page (fitz.Page): Page PyMuPDF
        
    Returns:
        dict: Toutes les boxes en mm avec métadonnées
    """
    mediabox = rect_to_mm(page.mediabox)
    cropbox = rect_to_mm(page.cropbox)
    trimbox = rect_to_mm(page.trimbox)
    bleedbox = rect_to_mm(page.bleedbox)
    
    trimbox_defini = (page.trimbox != page.mediabox) or (page.trimbox != page.cropbox)
    bleedbox_defini = (page.bleedbox != page.mediabox) or (page.bleedbox != page.cropbox)
    
    fond_perdu = calculate_bleed(trimbox, bleedbox)
    
    format_detecte, orientation = detect_format(
        trimbox["largeurMm"], 
        trimbox["hauteurMm"]
    )
    
    rotation = page.rotation
    
    return {
        "mediabox": mediabox,
        "cropbox": cropbox,
        "trimbox": trimbox,
        "bleedbox": bleedbox,
        "trimboxDefini": trimbox_defini,
        "bleedboxDefini": bleedbox_defini,
        "fondPerdu": fond_perdu,
        "formatDetecte": format_detecte,
        "orientation": orientation,
        "rotation": rotation
    }


def validate_pdf(file_path):
    """
    Analyse un fichier PDF et extrait ses informations complètes.
    L'API extrait les données, WebDev décide quoi vérifier selon le contexte.
    
    Args:
        file_path (str): Chemin complet du fichier PDF
        
    Returns:
        dict: Résultat complet de l'analyse
    """
    result = {
        "success": False,
        "fichier": os.path.basename(file_path),
        "cheminComplet": file_path,
        "estUnPdf": False,
        "nombrePages": 0,
        "metadata": {},
        "securite": {},
        "polices": [],
        "images": [],
        "pages": [],
        "messages": [],
        "erreurs": []
    }
    
    if not os.path.exists(file_path):
        result["erreurs"].append(f"Fichier non trouvé : {file_path}")
        return result
    
    if not file_path.lower().endswith('.pdf'):
        result["erreurs"].append("Le fichier n'est pas un PDF (extension incorrecte)")
        return result
    
    try:
        doc = fitz.open(file_path)
        
        result["estUnPdf"] = doc.is_pdf
        
        if not doc.is_pdf:
            result["erreurs"].append("Le fichier n'est pas un PDF valide")
            doc.close()
            return result
        
        result["nombrePages"] = len(doc)
        
        result["metadata"] = get_document_metadata(doc)
        result["securite"] = get_document_permissions(doc)
        result["polices"] = get_document_fonts(doc)
        result["images"] = get_document_images(doc)
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_info = get_page_boxes(page)
            page_info["numero"] = page_num + 1
            
            if page_info["rotation"] != 0:
                result["messages"].append(
                    f"Page {page_num + 1} : rotation de {page_info['rotation']}°"
                )
            
            result["pages"].append(page_info)
        
        doc.close()
        result["success"] = True
        
    except Exception as e:
        result["erreurs"].append(f"Erreur lors de l'analyse du PDF : {str(e)}")
    
    return result


def inject_trim_bleed_boxes(file_path, trim_x_mm, trim_y_mm, trim_w_mm, trim_h_mm, bleed_mm):
    """
    Injecte TrimBox et BleedBox dans un PDF qui n'en possède pas.

    Cas d'usage : PDF exporté avec fond perdu inclus dans les dimensions de page
    (ex : 220×307 mm pour A4+5 mm) sans TrimBox ni BleedBox dans les métadonnées.
    WebDev a calculé les valeurs correctes ; cette fonction les écrit dans le fichier.

    Comportement :
      - Si au moins une page possède déjà une TrimBox ou une BleedBox explicite,
        l'opération est annulée (injected=False) sans modifier le fichier.
      - Sinon, pour chaque page :
          TrimBox  = rectangle centré fourni par WebDev (en mm → convertis en points)
          BleedBox = MediaBox existante (inchangée, string raw réutilisé)
          CropBox  = supprimée (hérite de la MediaBox)
      - La MediaBox n'est PAS modifiée.
      - Sauvegarde via fichier .tmp pour éviter les erreurs de verrou Windows.

    Args:
        file_path  (str):   Chemin complet du fichier PDF
        trim_x_mm  (float): Coin bas-gauche X de la TrimBox en mm
        trim_y_mm  (float): Coin bas-gauche Y de la TrimBox en mm
        trim_w_mm  (float): Largeur de la TrimBox en mm (format fini)
        trim_h_mm  (float): Hauteur de la TrimBox en mm (format fini)
        bleed_mm   (float): Valeur du fond perdu en mm (symétrique — info seule, non recalculée)

    Returns:
        dict: {
            "success":  bool,
            "injected": bool,   # False si boîtes déjà présentes ou injection inutile
            "fichier":  str,
            "bleedMm":  float,
            "erreur":   str     # présent uniquement si success=False
        }
    """
    if not os.path.exists(file_path):
        return {"success": False, "injected": False, "erreur": f"Fichier introuvable : {file_path}"}

    try:
        doc = fitz.open(file_path)

        # --- Étape 1 : vérifier l'absence de boîtes explicites ---
        for page in doc:
            xref = page.xref
            tb_raw = doc.xref_get_key(xref, 'TrimBox')
            bb_raw = doc.xref_get_key(xref, 'BleedBox')
            if tb_raw[0] != 'null' or bb_raw[0] != 'null':
                doc.close()
                return {
                    "success":  True,
                    "injected": False,
                    "fichier":  os.path.basename(file_path),
                    "bleedMm":  0.0
                }

        # --- Étape 2 : convertir les dimensions en points ---
        trim_x_pt  = trim_x_mm  * MM_TO_POINTS
        trim_y_pt  = trim_y_mm  * MM_TO_POINTS
        trim_w_pt  = trim_w_mm  * MM_TO_POINTS
        trim_h_pt  = trim_h_mm  * MM_TO_POINTS
        trim_x1_pt = trim_x_pt + trim_w_pt
        trim_y1_pt = trim_y_pt + trim_h_pt

        # --- Étape 3 : validation sur la première page ---
        first_page = doc[0]
        mb_raw_first = doc.xref_get_key(first_page.xref, 'MediaBox')
        if mb_raw_first[0] != 'null':
            mb_vals = parse_rect(mb_raw_first[1])
            mb_w = mb_vals[2] - mb_vals[0]
            mb_h = mb_vals[3] - mb_vals[1]
            # Tolérance 1 point (~0.35 mm) pour absorber les arrondis exporteurs
            if trim_w_pt > mb_w + 1.0 or trim_h_pt > mb_h + 1.0:
                doc.close()
                return {
                    "success":  False,
                    "injected": False,
                    "erreur":   (
                        f"Format fini ({trim_w_mm}×{trim_h_mm}mm) supérieur à la "
                        f"MediaBox ({round(mb_w * POINTS_TO_MM, 1)}×{round(mb_h * POINTS_TO_MM, 1)}mm)"
                    )
                }

        # --- Étape 4 : injection sur toutes les pages ---
        trim_rect_str = fmt_rect(trim_x_pt, trim_y_pt, trim_x1_pt, trim_y1_pt)

        for page in doc:
            xref = page.xref

            # Lire la MediaBox raw de cette page (BleedBox = MediaBox)
            mb_raw = doc.xref_get_key(xref, 'MediaBox')
            bleed_rect_str = mb_raw[1] if mb_raw[0] != 'null' else trim_rect_str

            doc.xref_set_key(xref, 'TrimBox',  trim_rect_str)
            doc.xref_set_key(xref, 'BleedBox', bleed_rect_str)
            try:
                doc.xref_del_key(xref, 'CropBox')
            except Exception:
                pass  # CropBox absente ou non supprimable — ignoré

        # --- Étape 5 : sauvegarde via .tmp (évite erreur verrou Windows) ---
        temp_path = file_path + ".tmp"
        doc.save(temp_path, garbage=4, deflate=True)
        doc.close()

        if os.path.exists(file_path):
            os.remove(file_path)
        os.rename(temp_path, file_path)

        return {
            "success":  True,
            "injected": True,
            "fichier":  os.path.basename(file_path),
            "bleedMm":  bleed_mm
        }

    except Exception as e:
        return {"success": False, "injected": False, "erreur": str(e)}


# =============================================================================
# ENDPOINTS API
# =============================================================================

@app.route('/PyMuPdfExtract/status', methods=['GET'])
def status():
    """
    Endpoint de vérification que l'API est en ligne.
    
    Returns:
        JSON: {"status": "ok", "version": "2.4"}
    """
    return jsonify({
        "status": "ok",
        "version": "2.4",
        "service": "PyMuPdfExtract API",
        "pymupdf_version": fitz.version[0]
    })


@app.route('/PyMuPdfExtract/validate', methods=['GET'])
def validate():
    """
    Endpoint principal d'analyse d'un PDF.
    
    Query Parameters:
        file (str): Chemin complet du fichier PDF (obligatoire)
        
    Returns:
        JSON: Résultat complet de l'analyse
        
    Exemple:
        GET /PyMuPdfExtract/validate?file=C:\\Documents\\test.pdf
    """
    file_path = request.args.get('file')
    
    if not file_path:
        return jsonify({
            "success": False,
            "erreurs": ["Paramètre 'file' obligatoire"]
        }), 400
    
    result = validate_pdf(file_path)
    
    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400


@app.route('/PyMuPdfExtract/formats', methods=['GET'])
def formats():
    """
    Retourne la liste des formats standards reconnus.
    
    Returns:
        JSON: Liste des formats avec leurs dimensions
    """
    formats_list = []
    for nom, (largeur, hauteur) in FORMATS_STANDARDS.items():
        formats_list.append({
            "nom": nom,
            "largeurMm": largeur,
            "hauteurMm": hauteur
        })
    
    return jsonify({
        "formats": formats_list
    })


@app.route('/PyMuPdfExtract/normalize_bleedbox', methods=['GET'])
def normalize_bleedbox():
    """
    Normalise un PDF en recadrant toutes ses PageBoxes sur la BleedBox.

    Opération conditionnelle — le crop n'est effectué que si
    MediaBox ≠ BleedBox (à la tolérance près). Sinon normalized=false.

    Principe de normalisation :
      - Nouvelle MediaBox = BleedBox originale repositionnée à (0,0)
      - Nouvelle BleedBox = [0, 0, largeur, hauteur]
      - Nouvelle TrimBox  = TrimBox originale recalculée relative à (0,0)
      - CropBox supprimée (héritée de la nouvelle MediaBox)
      Le contenu PDF n'est PAS re-rendu — seules les boîtes sont modifiées.
      Qualité du PDF préservée intégralement.

    Après normalisation, psmd-generator.js peut positionner les zones
    correctement car la TrimBox commence à (fondPerdu, fondPerdu) depuis (0,0).

    Query Parameters:
        file (str): Chemin complet du fichier PDF (obligatoire)

    Returns:
        JSON: {
            "success": true/false,
            "normalized": true/false,
            "fichier": "nom_fichier.pdf",
            "erreur": "..."
        }

    Exemple:
        GET /PyMuPdfExtract/normalize_bleedbox?file=C:\\Upload\\doc.pdf
    """
    file_path = request.args.get('file', '')

    if not file_path:
        return jsonify({"success": False, "erreur": "Paramètre 'file' manquant"}), 400

    if not os.path.exists(file_path):
        return jsonify({"success": False, "erreur": "Fichier introuvable : " + file_path}), 400

    try:
        doc = fitz.open(file_path)

        # Tolérance de 0.5 point (~0.18mm) pour absorber les arrondis PDF
        tolerance = 0.5
        needs_crop = False

        for page in doc:
            xref = page.xref
            mb_raw = doc.xref_get_key(xref, 'MediaBox')
            bb_raw = doc.xref_get_key(xref, 'BleedBox')
            if mb_raw[0] == 'null' or bb_raw[0] == 'null':
                continue
            mb_vals = parse_rect(mb_raw[1])
            bb_vals = parse_rect(bb_raw[1])
            if any(abs(mb_vals[i] - bb_vals[i]) > tolerance for i in range(4)):
                needs_crop = True
                break

        if not needs_crop:
            doc.close()
            return jsonify({
                "success": True,
                "normalized": False,
                "fichier": os.path.basename(file_path)
            })

        for page in doc:
            xref = page.xref
            bb_raw = doc.xref_get_key(xref, 'BleedBox')
            if bb_raw[0] == 'null':
                continue
            doc.xref_set_key(xref, 'MediaBox', bb_raw[1])
            try:
                doc.xref_del_key(xref, 'CropBox')
            except Exception:
                pass

        temp_path = file_path + ".tmp"
        doc.save(temp_path, garbage=4, deflate=True)
        doc.close()

        if os.path.exists(file_path):
            os.remove(file_path)
        os.rename(temp_path, file_path)

        return jsonify({
            "success": True,
            "normalized": True,
            "fichier": os.path.basename(file_path)
        })

    except Exception as e:
        return jsonify({"success": False, "erreur": str(e)}), 500


@app.route('/PyMuPdfExtract/inject_trim_bleed_boxes', methods=['GET'])
def inject_trim_bleed_boxes_endpoint():
    """
    Injecte TrimBox et BleedBox dans un PDF qui n'en possède pas.

    Cas d'usage : PDF livré avec fond perdu inclus dans les dimensions de page
    (ex : 220×307 mm pour A4+5 mm) sans TrimBox ni BleedBox dans les métadonnées.
    WebDev calcule les valeurs correctes ; cet endpoint les écrit dans le fichier.

    Si le PDF possède déjà des boîtes explicites sur au moins une page,
    l'opération est annulée sans modifier le fichier (injected=false).

    Query Parameters:
        file      (str):   Chemin complet du fichier PDF (obligatoire)
        trim_x    (float): Coin bas-gauche X de la TrimBox en mm (obligatoire)
        trim_y    (float): Coin bas-gauche Y de la TrimBox en mm (obligatoire)
        trim_w    (float): Largeur de la TrimBox en mm — format fini (obligatoire)
        trim_h    (float): Hauteur de la TrimBox en mm — format fini (obligatoire)
        bleed     (float): Valeur du fond perdu en mm, symétrique (obligatoire)

    Returns:
        JSON: {
            "success":  true/false,
            "injected": true/false,
            "fichier":  "nom_fichier.pdf",
            "bleedMm":  5.0,
            "erreur":   "..."    # présent uniquement si success=false
        }

    Exemple:
        GET /PyMuPdfExtract/inject_trim_bleed_boxes
            ?file=C:\\Upload\\doc.pdf
            &trim_x=5.0&trim_y=5.0&trim_w=210.0&trim_h=297.0&bleed=5.0
    """
    file_path = request.args.get('file', '')
    if not file_path:
        return jsonify({"success": False, "erreur": "Paramètre 'file' manquant"}), 400

    if not os.path.exists(file_path):
        return jsonify({"success": False, "erreur": "Fichier introuvable : " + file_path}), 400

    # Validation et conversion des paramètres float
    float_params = {}
    for name in ('trim_x', 'trim_y', 'trim_w', 'trim_h', 'bleed'):
        raw = request.args.get(name)
        if raw is None:
            return jsonify({"success": False, "erreur": f"Paramètre '{name}' manquant"}), 400
        try:
            float_params[name] = float(raw)
        except ValueError:
            return jsonify({"success": False, "erreur": f"Paramètre '{name}' invalide : '{raw}' (float attendu)"}), 400

    result = inject_trim_bleed_boxes(
        file_path,
        float_params['trim_x'],
        float_params['trim_y'],
        float_params['trim_w'],
        float_params['trim_h'],
        float_params['bleed']
    )

    if result["success"]:
        return jsonify(result)
    else:
        return jsonify(result), 400


# =============================================================================
# POINT D'ENTRÉE
# =============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("PYMUPDF EXTRACT API - VERSION 2.4")
    print("=" * 60)
    print(f"PyMuPDF version : {fitz.version[0]}")
    print(f"Démarrage sur   : http://localhost:5000")
    print("")
    print("Principe :")
    print("  L'API extrait les données, WebDev décide quoi vérifier")
    print("")
    print("Endpoints :")
    print("  GET /PyMuPdfExtract/status                  - Vérifier que l'API est en ligne")
    print("  GET /PyMuPdfExtract/validate                - Analyser un PDF")
    print("  GET /PyMuPdfExtract/formats                 - Liste des formats standards")
    print("  GET /PyMuPdfExtract/normalize_bleedbox      - Recadrer PDF à sa BleedBox")
    print("  GET /PyMuPdfExtract/inject_trim_bleed_boxes - Injecter TrimBox/BleedBox dans un PDF sans boîtes")
    print("")
    print("Exemple :")
    print("  http://localhost:5000/PyMuPdfExtract/validate?file=C:\\Doc\\test.pdf")
    print("=" * 60)
    
    app.run(host='127.0.0.1', port=5000, debug=False)
