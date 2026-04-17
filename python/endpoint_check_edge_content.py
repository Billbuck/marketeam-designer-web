"""
Endpoint PyMuPdfExtract : check_edge_content
=============================================
Analyse les bords d'un PDF pour calculer le taux d'encrage dans une bande
de N mm sur chaque côté du document fini (TrimBox).

Utile pour les documents sans fond perdu : détecte le contenu graphique
trop proche du bord et quantifie le risque au massicotage.

À intégrer dans l'application Flask PyMuPdfExtract existante.

Appel :
  GET /PyMuPdfExtract/check_edge_content?file=<chemin>&margin_mm=3&threshold=250&page=0

Paramètres :
  file        : chemin complet du fichier PDF (obligatoire)
  margin_mm   : largeur de la bande de contrôle en mm (défaut: 3)
  threshold   : seuil RGB 0-255 ; pixel avec un canal < seuil = "encré" (défaut: 250)
  page        : numéro de page 1-based, 0 = toutes les pages (défaut: 0)

Réponse JSON :
  {
    "success": true,
    "marginMm": 3,
    "threshold": 250,
    "renderDpi": 150,
    "pages": [
      {
        "page": 1,
        "documentWidthMm": 210.0,
        "documentHeightMm": 297.0,
        "marginCheckedMm": 3,
        "marginCheckedPx": 18,
        "inkCoverage": {
          "top":    85.2,
          "bottom": 92.7,
          "left":    0.0,
          "right":   0.0
        }
      }
    ]
  }

  inkCoverage : pourcentage 0.0 à 100.0 de pixels encrés dans chaque bande de bordure.
"""

import os
import urllib.parse
import fitz  # PyMuPDF
from flask import request, jsonify


RENDER_DPI = 150
MM_PER_INCH = 25.4
PT_PER_INCH = 72.0


def _strip_ink_coverage(samples, stride, n, w, h, x0, y0, x1, y1, threshold):
    """
    Calcule le taux d'encrage (0.0 - 100.0) dans un rectangle de la pixmap.
    Un pixel est "encré" si au moins un de ses canaux RGB est < threshold.
    """
    x1 = min(x1, w)
    y1 = min(y1, h)

    total_pixels = 0
    inked_pixels = 0

    for y in range(y0, y1):
        row_offset = y * stride
        for x in range(x0, x1):
            px_offset = row_offset + x * n
            r = samples[px_offset]
            g = samples[px_offset + 1]
            b = samples[px_offset + 2]
            total_pixels += 1
            if r < threshold or g < threshold or b < threshold:
                inked_pixels += 1

    if total_pixels == 0:
        return 0.0

    return round(inked_pixels / total_pixels * 100, 1)


def register_check_edge_content(app):
    """Enregistre l'endpoint /PyMuPdfExtract/check_edge_content sur l'app Flask."""

    @app.route('/PyMuPdfExtract/check_edge_content', methods=['GET'])
    def check_edge_content():
        try:
            # ── Paramètres ────────────────────────────────────────
            file_path = request.args.get('file', '')
            margin_mm = float(request.args.get('margin_mm', '3'))
            threshold = int(request.args.get('threshold', '250'))
            page_filter = int(request.args.get('page', '0'))

            if not file_path:
                return jsonify({"success": False, "error": "Paramètre 'file' manquant"})

            file_path = urllib.parse.unquote(file_path)

            if not os.path.exists(file_path):
                return jsonify({"success": False, "error": f"Fichier introuvable : {file_path}"})

            # ── Ouverture du PDF ──────────────────────────────────
            doc = fitz.open(file_path)
            pages_results = []

            page_range = range(len(doc))
            if page_filter > 0:
                if page_filter > len(doc):
                    doc.close()
                    return jsonify({
                        "success": False,
                        "error": f"Page {page_filter} inexistante (document: {len(doc)} pages)"
                    })
                page_range = range(page_filter - 1, page_filter)

            # ── Analyse page par page ─────────────────────────────
            for page_idx in page_range:
                page = doc[page_idx]

                # TrimBox = format fini du document
                # PyMuPDF : si non définie → CropBox → MediaBox
                trimbox = page.trimbox

                doc_width_mm = round(trimbox.width / PT_PER_INCH * MM_PER_INCH, 2)
                doc_height_mm = round(trimbox.height / PT_PER_INCH * MM_PER_INCH, 2)

                # Rendu de la zone TrimBox uniquement, RGB sans alpha
                mat = fitz.Matrix(RENDER_DPI / PT_PER_INCH, RENDER_DPI / PT_PER_INCH)
                pix = page.get_pixmap(matrix=mat, clip=trimbox, alpha=False)

                w = pix.width
                h = pix.height

                # Conversion marge mm → pixels
                margin_px = max(1, int(round(margin_mm / MM_PER_INCH * RENDER_DPI)))
                margin_px = min(margin_px, w // 3, h // 3)

                samples = pix.samples
                stride = pix.stride
                n = pix.n  # 3 (RGB)

                # Calcul du taux d'encrage sur chaque bande de bordure
                top = _strip_ink_coverage(
                    samples, stride, n, w, h,
                    0, 0, w, margin_px, threshold
                )
                bottom = _strip_ink_coverage(
                    samples, stride, n, w, h,
                    0, h - margin_px, w, h, threshold
                )
                left = _strip_ink_coverage(
                    samples, stride, n, w, h,
                    0, 0, margin_px, h, threshold
                )
                right = _strip_ink_coverage(
                    samples, stride, n, w, h,
                    w - margin_px, 0, w, h, threshold
                )

                pages_results.append({
                    "page": page_idx + 1,
                    "documentWidthMm": doc_width_mm,
                    "documentHeightMm": doc_height_mm,
                    "marginCheckedMm": margin_mm,
                    "marginCheckedPx": margin_px,
                    "inkCoverage": {
                        "top": top,
                        "bottom": bottom,
                        "left": left,
                        "right": right
                    }
                })

                pix = None

            doc.close()

            return jsonify({
                "success": True,
                "marginMm": margin_mm,
                "threshold": threshold,
                "renderDpi": RENDER_DPI,
                "pages": pages_results
            })

        except Exception as e:
            return jsonify({"success": False, "error": str(e)})
