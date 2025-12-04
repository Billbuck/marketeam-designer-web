# Structures WLangage - Designer VDP

> **Version** : 1.0  
> **Date** : 2024-12-05  
> **Statut** : Validé et fonctionnel

Ce document contient toutes les structures WLangage utilisées pour la communication entre WebDev et le Designer VDP via JSON.

---

## Table des matières

1. [Identification](#identification)
2. [Format Document](#format-document)
3. [Champs de Fusion](#champs-de-fusion)
4. [Polices](#polices)
5. [Pages](#pages)
6. [Géométrie](#géométrie)
7. [Bordure](#bordure)
8. [Style Texte](#style-texte)
9. [Fond](#fond)
10. [Copyfitting](#copyfitting)
11. [Formatage Partiel](#formatage-partiel)
12. [Zone Texte](#zone-texte)
13. [Zone Code-Barres](#zone-code-barres)
14. [Document Complet](#document-complet)
15. [Messages Communication](#messages-communication)
16. [Points Techniques Importants](#points-techniques-importants)
17. [Exemple JSON Complet](#exemple-json-complet)

---

## Identification

```wl
stDesignerIdentification est une Structure
    'idDocument'        est une chaîne  <sérialise = "idDocument">
    'nomDocument'       est une chaîne  <sérialise = "nomDocument">
    'dateCreation'      est une chaîne  <sérialise = "dateCreation">
FIN
```

---

## Format Document

```wl
stDesignerFondPerdu est une Structure
    'actif'             est un booléen  <sérialise = "actif">
    'valeurMm'          est un réel     <sérialise = "valeurMm">
FIN

stDesignerTraitsCoupe est une Structure
    'actif'             est un booléen  <sérialise = "actif">
FIN

stDesignerFormatDocument est une Structure
    'largeurMm'         est un réel                         <sérialise = "largeurMm">
    'hauteurMm'         est un réel                         <sérialise = "hauteurMm">
    'fondPerdu'         est une stDesignerFondPerdu         <sérialise = "fondPerdu">
    'traitsCoupe'       est une stDesignerTraitsCoupe       <sérialise = "traitsCoupe">
FIN
```

---

## Champs de Fusion

```wl
stDesignerChampFusion est une Structure
    'nom'               est une chaîne  <sérialise = "nom">
    'type'              est une chaîne  <sérialise = "type">
FIN
```

**Types possibles** : `"TXT"` (texte), `"SYS"` (système), `"IMG"` (image)

---

## Polices

```wl
stDesignerPolice est une Structure
    'nom'               est une chaîne  <sérialise = "nom">
    'url'               est une chaîne  <sérialise = "url">
FIN
```

**Note** : L'URL doit pointer vers un fichier TTF, WOFF ou WOFF2.

---

## Pages

```wl
stDesignerPage est une Structure
    'numero'            est un entier   <sérialise = "numero">
    'nom'               est une chaîne  <sérialise = "nom">
    'urlFond'           est une chaîne  <sérialise = "urlFond">
FIN
```

**Note** : `numero` est 1-based (1 = première page).

---

## Géométrie

```wl
stDesignerGeometrie est une Structure
    'xMm'               est un réel <sérialise = "xMm">
    'yMm'               est un réel <sérialise = "yMm">
    'largeurMm'         est un réel <sérialise = "largeurMm">
    'hauteurMm'         est un réel <sérialise = "hauteurMm">
FIN
```

**Note** : Toutes les valeurs sont en millimètres. La conversion mm ↔ pixels est gérée par le Designer.

---

## Bordure

```wl
stDesignerBordure est une Structure
    'epaisseur'         est un réel     <sérialise = "epaisseur">
    'couleur'           est une chaîne  <sérialise = "couleur">
    'style'             est une chaîne  <sérialise = "style">
FIN
```

**Valeurs de style** : `"solid"` (plein), `"dashed"` (tirets)

---

## Style Texte

```wl
stDesignerStyleTexte est une Structure
    'police'            est une chaîne  <sérialise = "police">
    'taillePt'          est un réel     <sérialise = "taillePt">
    'couleur'           est une chaîne  <sérialise = "couleur">
    'gras'              est un booléen  <sérialise = "gras">
    'interligne'        est un réel     <sérialise = "interligne">
    'alignementH'       est une chaîne  <sérialise = "alignementH">
    'alignementV'       est une chaîne  <sérialise = "alignementV">
FIN
```

**Valeurs alignementH** : `"left"`, `"center"`, `"right"`, `"justify"`  
**Valeurs alignementV** : `"top"`, `"middle"`, `"bottom"`

---

## Fond

```wl
stDesignerFond est une Structure
    'transparent'       est un booléen  <sérialise = "transparent">
    'couleur'           est une chaîne  <sérialise = "couleur">
FIN
```

---

## Copyfitting

```wl
stDesignerCopyfitting est une Structure
    'actif'                     est un booléen  <sérialise = "actif">
    'tailleMinimum'             est un entier   <sérialise = "tailleMinimum">
    'autoriserRetourLigne'      est un booléen  <sérialise = "autoriserRetourLigne">
FIN
```

---

## Formatage Partiel

Le formatage partiel permet d'appliquer des styles (gras, couleur) à une portion du texte.

```wl
stDesignerFormatageStyles est une Structure
    'gras'              est un booléen  <sérialise = "gras">
    'couleur'           est une chaîne  <sérialise = "couleur">
FIN

stDesignerFormatage est une Structure
    'debut'             est un entier                       <sérialise = "debut">
    'fin'               est un entier                       <sérialise = "fin">
    'styles'            est une stDesignerFormatageStyles   <sérialise = "styles">
FIN
```

**Exemple** : Pour mettre "Bonjour" en gras dans "Bonjour Michel" :
```wl
stFormat.debut = 0
stFormat.fin = 7
stFormat.styles.gras = Vrai
```

---

## Zone Texte

```wl
stDesignerZoneTexte est une Structure
    'id'                        est une chaîne                  <sérialise = "id">
    'page'                      est un entier                   <sérialise = "page">
    'nom'                       est une chaîne                  <sérialise = "nom">
    'niveau'                    est un entier                   <sérialise = "niveau">
    'rotation'                  est un entier                   <sérialise = "rotation">
    'verrouille'                est un booléen                  <sérialise = "verrouille">
    'supprimerLignesVides'      est un booléen                  <sérialise = "supprimerLignesVides">
    'geometrie'                 est une stDesignerGeometrie     <sérialise = "geometrie">
    'contenu'                   est une chaîne                  <sérialise = "contenu">
    'formatage'                 est un tableau                  <sérialise = "formatage"> de stDesignerFormatage
    'style'                     est une stDesignerStyleTexte    <sérialise = "style">
    'fond'                      est une stDesignerFond          <sérialise = "fond">
    'bordure'                   est une stDesignerBordure       <sérialise = "bordure">
    'copyfitting'               est une stDesignerCopyfitting   <sérialise = "copyfitting">
FIN
```

---

## Zone Code-Barres

```wl
stDesignerCouleursCodeBarres est une Structure
    'code'              est une chaîne  <sérialise = "code">
    'fond'              est une chaîne  <sérialise = "fond">
FIN

stDesignerZoneCodeBarres est une Structure
    'id'                est une chaîne                          <sérialise = "id">
    'page'              est un entier                           <sérialise = "page">
    'typeCode'          est une chaîne                          <sérialise = "typeCode">
    'contenu'           est une chaîne                          <sérialise = "contenu">
    'nom'               est une chaîne                          <sérialise = "nom">
    'niveau'            est un entier                           <sérialise = "niveau">
    'rotation'          est un entier                           <sérialise = "rotation">
    'verrouille'        est un booléen                          <sérialise = "verrouille">
    'geometrie'         est une stDesignerGeometrie             <sérialise = "geometrie">
    'couleurs'          est une stDesignerCouleursCodeBarres    <sérialise = "couleurs">
FIN
```

**Types de code-barres** : `"QRCode"`, `"Code128"`, `"EAN13"`, `"Code39"`, `"DataMatrix"`, `"PDF417"`, `"EanUcc128"`, `"UPCA"`, `"UPCE"`

---

## Document Complet

```wl
stDesignerDocument est une Structure
    'identification'        est une stDesignerIdentification    <sérialise = "identification">
    'formatDocument'        est une stDesignerFormatDocument    <sérialise = "formatDocument">
    'champsFusion'          est un tableau                      <sérialise = "champsFusion"> de stDesignerChampFusion
    'polices'               est un tableau                      <sérialise = "polices"> de stDesignerPolice
    'pages'                 est un tableau                      <sérialise = "pages"> de stDesignerPage
    'zonesTexte'            est un tableau                      <sérialise = "zonesTexte"> de stDesignerZoneTexte
    'zonesCodeBarres'       est un tableau                      <sérialise = "zonesCodeBarres"> de stDesignerZoneCodeBarres
FIN
```

---

## Messages Communication

### Message Load (WebDev → Designer)

```wl
stDesignerLoad est une Structure
    'action'            est une chaîne              <sérialise = "action">
    'data'              est une stDesignerDocument  <sérialise = "data">
FIN
```

**Usage** : `stLoad.action = "load"`

### Message Export (Designer → WebDev)

```wl
stDesignerExport est une Structure
    'action'            est une chaîne              <sérialise = "action">
    'success'           est un booléen              <sérialise = "success">
    'data'              est une stDesignerDocument  <sérialise = "data">
FIN
```

**Usage** : Reçu avec `action = "exported"`

---

## Points Techniques Importants

| Sujet | Règle |
|-------|-------|
| **Retour à la ligne** | Utiliser `Chr(10)` et **NON** `RC` dans les contenus (sinon décalage des positions de formatage) |
| **Formatage partiel** | Utiliser des variables distinctes pour chaque annotation (`stFormat1`, `stFormat2`...) |
| **Couleurs** | Format hexadécimal avec # : `"#D32F2F"` |
| **Pages** | Numérotation 1-based dans JSON (1 = première page) |
| **Géométrie** | Toutes les valeurs en millimètres |
| **Polices** | URL vers fichier TTF, WOFF ou WOFF2 |

---

## Exemple JSON Complet

```json
{
    "action": "load",
    "data": {
        "identification": {
            "idDocument": "DOC-2024-001",
            "nomDocument": "Mailing Fidélité",
            "dateCreation": "2024-12-05"
        },
        "formatDocument": {
            "largeurMm": 210,
            "hauteurMm": 297,
            "fondPerdu": {
                "actif": false,
                "valeurMm": 3
            },
            "traitsCoupe": {
                "actif": false
            }
        },
        "champsFusion": [
            {"nom": "CIVILITE", "type": "TXT"},
            {"nom": "NOM", "type": "TXT"},
            {"nom": "PRENOM", "type": "TXT"}
        ],
        "polices": [
            {"nom": "Roboto", "url": "https://example.com/fonts/Roboto.ttf"}
        ],
        "pages": [
            {"numero": 1, "nom": "Recto", "urlFond": "https://example.com/fond_recto.jpg"},
            {"numero": 2, "nom": "Verso", "urlFond": "https://example.com/fond_verso.jpg"}
        ],
        "zonesTexte": [
            {
                "id": "zone-1",
                "page": 1,
                "nom": "Adresse",
                "niveau": 1,
                "rotation": 0,
                "verrouille": false,
                "supprimerLignesVides": true,
                "geometrie": {
                    "xMm": 120,
                    "yMm": 45,
                    "largeurMm": 80,
                    "hauteurMm": 35
                },
                "contenu": "@CIVILITE@ @PRENOM@ @NOM@",
                "formatage": [],
                "style": {
                    "police": "Roboto",
                    "taillePt": 11,
                    "couleur": "#000000",
                    "gras": false,
                    "interligne": 1.2,
                    "alignementH": "left",
                    "alignementV": "top"
                },
                "fond": {
                    "transparent": true,
                    "couleur": "#FFFFFF"
                },
                "bordure": {
                    "epaisseur": 0,
                    "couleur": "#000000",
                    "style": "solid"
                },
                "copyfitting": {
                    "actif": false,
                    "tailleMinimum": 6,
                    "autoriserRetourLigne": true
                }
            }
        ],
        "zonesCodeBarres": [
            {
                "id": "zone-qr-1",
                "page": 1,
                "typeCode": "QRCode",
                "contenu": "https://example.com/client/@NUM_CLIENT@",
                "nom": "QR Client",
                "niveau": 1,
                "rotation": 0,
                "verrouille": false,
                "geometrie": {
                    "xMm": 170,
                    "yMm": 250,
                    "largeurMm": 25,
                    "hauteurMm": 25
                },
                "couleurs": {
                    "code": "#000000",
                    "fond": "#FFFFFF"
                }
            }
        ]
    }
}
```

---

## À Implémenter (Prochaines étapes)

- [ ] **Marges de sécurité** : Zone visuelle dans le Designer indiquant les limites d'impression
- [ ] **Zones image** : Structure `stDesignerZoneImage`
- [ ] **Données d'aperçu** : Valeurs de test pour les champs de fusion
- [ ] **Export PrintShop Mail** : Génération du format .psmd

---

## Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2024-12-05 | Version initiale - Structures validées et fonctionnelles |
