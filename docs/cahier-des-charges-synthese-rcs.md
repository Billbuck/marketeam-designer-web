# Cahier des charges — Synthèse d'une opération RCS (`pgeRcsSynthese`)

Version du 28 septembre 2026. Décisions prises avec Michel les 28 septembre (structure, classification des retours, réponses masquées).

## 1. Objet

Donner aux salariés puis aux clients les résultats d'une opération RCS (et RCS interactif) avec la même ergonomie que la synthèse SMS (`pgeSmsSynthese`), en y ajoutant ce que le RCS apporte : lectures, canal réellement utilisé (RCS ou SMS de repli), interactions sur les boutons, réactions, réponses.

## 2. Décisions

| # | Point | Décision |
|---|---|---|
| 1 | Page | `pgeRcsSynthese`, créée par « Enregistrer sous » de `pgeSmsSynthese`, mêmes onglets et même timer d'actualisation ; `_sUnivers = __OPERATION_RCS__`. |
| 2 | Compteurs de synthèse | **Envoyés**, **Délivrés** (dont *n* par SMS de repli), **Lus** (RCS seulement, taux de lecture), **Interactions**, **Leads** ; chaque compteur avec son taux. Pas de compteur « Reçus » ambigu. |
| 3 | Classification des retours | Trois familles + une sous-famille : **Lead** (bouton Réaction ; bot allé au bout ; formulaire de landing), **Intention de contact** (Appel, Email, SMS, WhatsApp), **Interaction** (Web, Landing page Marketeam, Localisation / Itinéraire, Agenda, Application, réseaux sociaux, pages visitées, redirections), **Réponse** (texte libre, RCS ou SMS). |
| 4 | Réponses | **Masquées** en V1 (SMS comme RCS) : seul le nombre est affiché (taux de réponse) dans Rapport et Performance. V2 : classification par IA (intéressé / question / refus / insulte / autre), affichage des seules réponses utiles, promotion possible en lead. |
| 5 | Onglet détail | L'onglet Leads devient **« Retours »** : un seul tableau qui mélange leads, intentions de contact, interactions et redirections, avec des pastilles de comptage cliquables (Leads n · Intentions n · Interactions n · Redirections n) servant de filtre ; **ouvert par défaut sur Leads**. |
| 6 | Modèle de données | Une vue SQL `vue_ope_retour` (`UNION ALL` de `ope_rcs_clic`, `ope_cliquezici_lien`, `ope_cliquezici_clic`, `ope_rcs_reponse`, `ope_sms_reponse`) : une ligne par retour, avec `IdOperation`, `IdBaseLigne`, `Famille`, `Categorie`, `Libelle`, `Detail`, `DateHeure`, `Canal`. Un seul `SELECT` pour le tableau et les compteurs. |
| 7 | Compteurs de `structSynthèse` | Ajout de `NbrLu`, `NbrRepliSms`, `NbrInteractionUnique` (déjà existant pour la landing, étendu), `NbrIntentionContact`, `NbrReponse`, `NbrLeadUnique` (étendu aux réactions). Chargés par `Partage.ChargeSynthèseOperation` pour le type RCS. |
| 8 | Onglet Rapport | Graphe par statut d'envoi depuis `ope_rcs_envoi` avec libellés français (`rcs_code`), graphe **RCS / SMS de repli** (`CanalUtilise`), graphe opérateurs par `MccMnc` (même clé que `sms_operateur.PLMN`), courbe de diffusion (`DateHeureEnvoi`), ligne « lus : n (x %) », ligne « réponses reçues : n ». |
| 9 | Export Excel | Feuille `ChargeFeuilleExcelRcsRapport` (colonnes du SMS + canal utilisé, lu le, code et libellé d'échec) et feuille « Retours » (le tableau de l'onglet). Codes rapport à créer dans `cpRapportExcel`. |
| 10 | Réaction V2 | Trois types de Réaction (Message / Choix / Sélection), formulaire hébergé par `Bouton.awp`, résultats dans une table sœur de `ope_cliquezici_clic` (`ope_rcs_reaction`, colonnes `CasesCochees`, `Selection`, `DateHeure`) — chantier **séparé**, après la synthèse ; la vue `vue_ope_retour` l'intègre par une branche `UNION` supplémentaire. |

## 3. Classification — table de correspondance

| Source | Type de bouton / événement | Famille | Catégorie affichée |
|---|---|---|---|
| `ope_rcs_clic` | REACTION | Lead | Réaction |
| `ope_rcs_clic` | BOT (V2, si terminé) | Lead | Bot |
| `ope_cliquezici_clic` | formulaire landing | Lead | Formulaire |
| `ope_rcs_clic` | APPEL, EMAIL, SMS, WHATSAPP | Intention de contact | Appel / Email / SMS / WhatsApp |
| `ope_rcs_clic` | LIEN, LANDING, CARTE, ITINERAIRE, AGENDA, APPLICATION, INSTAGRAM, FACEBOOK, TIKTOK, YOUTUBE, LINKEDIN, RDV, AVIS, DOCUMENT | Interaction | libellé du sous-type |
| `ope_cliquezici_lien` | clic sur un lien / image / bannière de la landing | Interaction | Redirection |
| landing visitée (`NbrAudience`) | ouverture de la page | Interaction | Page visitée (compteur seulement) |
| `ope_rcs_reponse` | texte | Réponse | Réponse RCS (masquée V1) |
| `ope_sms_reponse` | texte sur le short code | Réponse | Réponse SMS (masquée V1) |
| STOP | — | exclu (compté dans NbrStop) | — |

Un lead se compte **par destinataire** (unique) ; les interactions et intentions se comptent par événement, avec le nombre de destinataires uniques à côté.

## 4. Onglets

### Synthèse
Identique au SMS pour le bandeau, les montants et le règlement. Jauges : **Progression** = délivrés / destinataires ; **Engagement** = lus / délivrés (RCS) ; **Transformation** = leads / lus. Sous les jauges : « dont n par SMS de repli », « n interactions », « n intentions de contact ».

### Informations
Identique (bases, filtres, emails de copie). Ajouter « n destinataires RCS, m par SMS de repli » d'après `CanalPrevu`.

### Statut, Devis, Règlement, Reprogrammer
Identiques (le planificateur RCS existe déjà).

### Rapport
Voir décision 8. Le tableau des erreurs utilise `rcs_code.Libelle` (français) ; un code sans libellé affiche le nom Infobip.

### Performance
- Bloc **Synthèse** : Envoyés · Délivrés (dont SMS de repli) · Lus · Interactions · Intentions de contact · Réponses (nombre seulement) · Leads, avec les taux (lus / délivrés, interactions / lus, leads / lus).
- Bloc **RCS interactif** (si landing) : pages visitées, redirections (graphe existant), offres.
- Tableau **Interactions par bouton** : libellé, sous-type, catégorie, clics, destinataires uniques (depuis `vue_ope_retour` groupée).

### Retours (ex-Leads)
Tableau `vue_ope_retour` pour l'opération : Destinataire (civilité, nom, prénom, portable), Catégorie, Libellé (bouton / lien / choix cochés), Date, Heure, Canal (RCS / SMS). Pastilles de filtre en en-tête (Leads par défaut). Les réponses n'apparaissent pas en V1. Export Excel du tableau filtré. Visible dès que l'opération est en diffusion (pas seulement au premier lead).

## 5. Modèle de données

```sql
CREATE OR REPLACE VIEW vue_ope_retour AS
SELECT 'RCS' Canal, c.IdOperation, c.IdBaseLigne, b.SousType Categorie,
       CASE WHEN b.SousType = 'REACTION' THEN 'LEAD'
            WHEN b.SousType IN ('APPEL','EMAIL','SMS','WHATSAPP') THEN 'INTENTION'
            ELSE 'INTERACTION' END Famille,
       c.LibelleBouton Libelle, NULL Detail, c.DateHeureClic DateHeure
FROM ope_rcs_clic c LEFT JOIN ope_rcs_bouton b ON b.IdRcsBouton = c.IdRcsBouton
UNION ALL
SELECT 'LANDING', l.IdCliquezIci, l.IdBaseLigne, 'REDIRECTION', 'INTERACTION', l.Libelle, l.Url, l.DateHeureClic
FROM ope_cliquezici_lien l
UNION ALL
SELECT 'LANDING', k.IdCliquezIci, k.IdBaseLigne, 'FORMULAIRE', 'LEAD', 'Formulaire', k.CasesCochees, k.DateHeureClic
FROM ope_cliquezici_clic k
UNION ALL
SELECT 'RCS', r.IdOperation, r.IdBaseLigne, 'REPONSE', 'REPONSE', 'Réponse', r.Texte, r.DateHeureReception
FROM ope_rcs_reponse r
UNION ALL
SELECT 'SMS', s.IdSms, s.IdBaseLigne, 'REPONSE', 'REPONSE', 'Réponse', s.Message, s.DateHeureReception
FROM ope_sms_reponse s;
```
(Noms de colonnes de `ope_cliquezici_lien`, `ope_cliquezici_clic` et `ope_sms_reponse` à vérifier par Cursor sur les CREATE TABLE ; les familles et catégories deviennent des constantes `__RETOUR_*`.)

## 6. Ordre de réalisation

1. Vue `vue_ope_retour` + constantes ; extension de `structSynthèse` et de `Partage.ChargeSynthèseOperation` (type RCS).
2. Page `pgeRcsSynthese` : copie, onglets Synthèse / Rapport / Performance / Retours adaptés ; accueil : bouton « Synthèse » des opérations RCS branché.
3. Export Excel (feuilles Rapport RCS et Retours).
4. Passage automatique de l'opération à « terminée » (aucune ligne en 10/20 et validité dépassée) — batchRcs.
5. V2 : classification IA des réponses ; Réaction Choix / Sélection ; bot.

## 7. Plan de test

Opération 3027 / 3061 / 3062 (prod, équipe) : compteurs cohérents avec `ope_rcs_envoi` (délivrés, lus, repli), interactions et leads visibles dans Retours avec le bon classement (« Ça m'intéresse » = Lead / Réaction, « En savoir plus » = Interaction / Lien, « Nous appeler » = Intention), réponses comptées mais absentes du tableau, export Excel conforme ; une opération SMS classique reste inchangée.
