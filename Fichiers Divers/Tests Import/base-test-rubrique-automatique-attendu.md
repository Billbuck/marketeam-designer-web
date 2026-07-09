# Base de test — validation RubriqueAutomatique v2 (refonte 09/07/2026)

Fichier : `base-test-rubrique-automatique.csv` (séparateur `;`, 25 colonnes, 12 lignes).
À importer via le webservice SANS mapping fourni (déclenche le mapping automatique).

## Résultats attendus au mapping

### Champs STANDARD (15 attendus : 14 colonnes + 1 composite Contact)

| Colonne du fichier | Code attendu | Ce qui est testé |
|---|---|---|
| Référence client | REF | règle `REF` (et pas piégée par PREF) |
| Civilité | CIV | règle simple |
| Nom | NOM | mot complet `=NOM` |
| Prénom | PRN | règle simple |
| → Contact (composite) | CTC | inséré automatiquement (Civ + Nom + Prénom) |
| Raison sociale | SOC | « raison SOCiale » contient SOC |
| Adresse 1 | AD1 | règle `ADR+1` |
| Adresse 2 | AD2 | cascade : AD1 pris → AD2 |
| BP | AD3 | `=BP` mot complet + cascade : AD2 pris → AD3 |
| Code postal | CDP | règle `C+POS` |
| Ville | VIL | règle `VILL` |
| Pays | PYS | règle `PAY` (non piégée par PAYE) |
| Téléphone fixe | TEL | règle `TEL+FIX` |
| Portable | PTB | règle `PORTABLE` |
| Email | EML | règle `MAIL` |

### Champs OPTIONNELS (10 attendus) — AUCUNE colonne ne doit disparaître

| Colonne du fichier | Type attendu | Ce qui est testé |
|---|---|---|
| Date Rdv | **Date** | LE bug d'origine : visible + pré-typé Date par l'en-tête |
| Interlocuteur | Texte | ex-exclusion silencieuse → visible |
| Vendeur | Texte | ex-exclusion silencieuse → visible |
| Hôtel | Texte | faux positif corrigé : ne doit PAS être mappé Téléphone |
| Payeur | Texte | faux positif corrigé : ne doit PAS être mappé Pays |
| Préférence | Texte | faux positif corrigé : ne doit PAS être mappé Référence |
| Naissance | **Date** | inférence par le CONTENU (en-tête muet, valeurs = dates) |
| Montant panier | **Décimal** | inférence par le contenu (valeurs `125,50`…) |
| Nb commandes | **Entier** | inférence par le contenu |
| Contact secondaire | **Email** | « Contact … » non exact → optionnel, puis contenu = emails |
| Code interne | **Texte** | garde-fou zéro de tête (`09234`) : ne doit PAS devenir Entier |

## Échec du test si…

- une colonne du fichier n'apparaît ni en standard ni en optionnel ;
- Hôtel arrive en Téléphone, Payeur en Pays ou Préférence en Référence ;
- Code interne arrive en Entier (perte du zéro de tête) ;
- Naissance / Montant panier / Nb commandes / Contact secondaire restent en Texte
  (inférence de contenu non appelée → vérifier l'appel à AffineTypesOptionnels
  dans BddImportation / BddImportationMultipart).
