# Cahier des charges — Synthèse d'une opération RCS (`pgeRcsSynthese`)

Version du 28 septembre 2026, mise à jour le 29 septembre (intégration : vue renommée `vue_rcs_retour`, colonne `Action` ; famille Redirection séparée ; réponses affichées dès la V1).

## 1. Objet

Donner aux salariés puis aux clients les résultats d'une opération RCS (et RCS interactif) avec la même ergonomie que la synthèse SMS (`pgeSmsSynthese`), en y ajoutant ce que le RCS apporte : lectures, canal réellement utilisé (RCS ou SMS de repli), interactions sur les boutons, réactions, réponses.

## 2. Décisions

| # | Point | Décision |
|---|---|---|
| 1 | Page | `pgeRcsSynthese`, créée par « Enregistrer sous » de `pgeSmsSynthese`, mêmes onglets et même timer d'actualisation ; `_sUnivers = __OPERATION_RCS__`. |
| 2 | Compteurs de synthèse | **Envoyés**, **Délivrés** (dont *n* par SMS de repli), **Lus** (RCS seulement, taux de lecture), **Interactions**, **Leads** ; chaque compteur avec son taux. Pas de compteur « Reçus » ambigu. |
| 3 | Classification des retours | **Cinq familles** (29/09) : **Lead** (bouton Réaction ; bot allé au bout ; formulaire de landing), **Intention de contact** (Appel, Email, SMS, WhatsApp), **Interaction** (Web, Landing page Marketeam, Localisation / Itinéraire, Agenda, Application, réseaux sociaux, pages visitées), **Redirection** (clics sur les liens / images / bannières de la landing), **Réponse** (texte libre, RCS ou SMS). |
| 4 | Réponses | **Affichées dès la V1** (29/09) : pastille « Réponses » dans l'onglet Retours, texte de la réponse dans la colonne Détail ; le nombre (taux de réponse) figure aussi dans Rapport et Performance. Chantier suivant (V2) : classification par IA (intéressé / question / refus / insulte / autre), promotion possible en lead. |
| 5 | Onglet détail | L'onglet Leads devient **« Retours »** : un seul tableau pour toutes les familles, filtré par le sélecteur `selFiltre` à cinq options avec comptage (Leads n · Intentions n · Interactions n · Redirections n · Réponses n) ; **ouvert par défaut sur Leads**. |
| 6 | Modèle de données | Une vue SQL `vue_rcs_retour` (`UNION ALL` de `ope_rcs_clic`, `ope_cliquezici_lien`, `ope_cliquezici_clic`, `ope_rcs_reponse`, `ope_sms_reponse`) : une ligne par retour, avec `IdOperation`, `IdBaseLigne`, `Famille`, `Action`, `Libelle`, `Detail`, `DateHeure`, `Canal`. Un seul `SELECT` pour le tableau et les compteurs. |
| 7 | Compteurs de `structSynthèse` | Ajout de `NbrLu`, `NbrRepliSms`, `NbrInteractionUnique` (déjà existant pour la landing, étendu), `NbrIntentionContact`, `NbrReponse`, `NbrLeadUnique` (étendu aux réactions). Chargés par `Partage.ChargeSynthèseOperation` pour le type RCS. |
| 8 | Onglet Rapport | Graphe par statut d'envoi depuis `ope_rcs_envoi` avec libellés français (`rcs_code`), graphe **RCS / SMS de repli** (`CanalUtilise`), graphe opérateurs par `MccMnc` (même clé que `sms_operateur.PLMN`), courbe de diffusion (`DateHeureEnvoi`), ligne « lus : n (x %) », ligne « réponses reçues : n ». |
| 9 | Export Excel | Feuille `ChargeFeuilleExcelRcsRapport` (colonnes du SMS + canal utilisé, lu le, code et libellé d'échec) et feuille « Retours » (le tableau de l'onglet). Codes rapport à créer dans `cpRapportExcel`. |
| 10 | Réaction V2 | Trois types de Réaction (Message / Choix / Sélection), formulaire hébergé par `Bouton.awp`, résultats dans une table sœur de `ope_cliquezici_clic` (`ope_rcs_reaction`, colonnes `CasesCochees`, `Selection`, `DateHeure`) — chantier **séparé**, après la synthèse ; la vue `vue_rcs_retour` l'intègre par une branche `UNION` supplémentaire. |

## 3. Classification — table de correspondance

| Source | Type de bouton / événement | Famille | Catégorie affichée |
|---|---|---|---|
| `ope_rcs_clic` | REACTION | Lead | Réaction |
| `ope_rcs_clic` | BOT (V2, si terminé) | Lead | Bot |
| `ope_cliquezici_clic` | formulaire landing | Lead | Formulaire |
| `ope_rcs_clic` | APPEL, EMAIL, SMS, WHATSAPP | Intention de contact | Appel / Email / SMS / WhatsApp |
| `ope_rcs_clic` | LIEN, LANDING, CARTE, ITINERAIRE, AGENDA, APPLICATION, INSTAGRAM, FACEBOOK, TIKTOK, YOUTUBE, LINKEDIN, RDV, AVIS, DOCUMENT | Interaction | libellé du sous-type |
| `ope_cliquezici_lien` | clic sur un lien / image / bannière de la landing | Redirection | Redirection |
| landing visitée (`NbrAudience`) | ouverture de la page | Interaction | Page visitée (compteur seulement) |
| `ope_rcs_reponse` | texte | Réponse | Réponse RCS (texte dans Détail) |
| `ope_sms_reponse` | texte sur le short code | Réponse | Réponse SMS (texte dans Détail) |
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
- Tableau **Interactions par bouton** : libellé, action, destinataires uniques (depuis `vue_rcs_retour` groupée, familles Interaction et Intention — les redirections ont leur propre tableau dans le bloc RCS interactif ; la colonne Clics a été retirée le 29/09, seule la mesure « destinataires » est présentée).

### Retours (ex-Leads)
Tableau `vue_rcs_retour` pour l'opération : Destinataire (civilité, nom, prénom, portable), Action, Libellé (bouton / lien / choix cochés), Détail (URL, cases cochées, texte de la réponse), Date, Heure, Canal (RCS / SMS / Landing). Une ligne par destinataire, action et libellé, datée du dernier retour (29/09 — pas de colonne Nb) ; les réponses restent une ligne par texte. Sélecteur de filtre en en-tête, cinq familles comptées en destinataires uniques, Leads par défaut ; les réponses sont affichées dès la V1. Export Excel du tableau filtré. Visible dès que l'opération est en diffusion (pas seulement au premier lead).

## 5. Modèle de données

```sql
CREATE OR REPLACE VIEW vue_rcs_retour AS
SELECT 'RCS' Canal, c.IdOperation, c.IdBaseLigne,
       IFNULL(b.SousType, '') Action,
       CASE WHEN b.SousType = 'REACTION' THEN 'LEAD'
            WHEN b.SousType IN ('APPEL','EMAIL','SMS','WHATSAPP') THEN 'INTENTION'
            ELSE 'INTERACTION' END Famille,
       c.LibelleBouton Libelle, NULL Detail, c.DateHeureClic DateHeure
FROM ope_rcs_clic c
LEFT JOIN ope_rcs_bouton b ON b.IdRcsBouton = c.IdRcsBouton
WHERE c.IdBaseLigne IS NOT NULL
UNION ALL
SELECT 'LANDING', l.IdCliquezIci, l.IdBaseLigne, 'REDIRECTION', 'REDIRECTION', l.Libelle, l.Url, l.DateHeureClic
FROM ope_cliquezici_lien l
UNION ALL
SELECT 'LANDING', k.IdCliquezIci, k.IdBaseLigne, 'FORMULAIRE', 'LEAD', 'Formulaire', k.CasesCochees, k.DateHeureClic
FROM ope_cliquezici_clic k
UNION ALL
SELECT 'RCS', r.IdOperation, r.IdBaseLigne, 'REPONSE', 'REPONSE', 'Réponse', r.Texte, r.DateHeureReception
FROM ope_rcs_reponse r
WHERE r.IdOperation IS NOT NULL
UNION ALL
SELECT 'SMS', db.IdOperation, s.IdBaseLigne, 'REPONSE', 'REPONSE', 'Réponse', s.Reponse, s.DateHeure
FROM ope_sms_reponse s
JOIN dos_base_ligne dbl ON dbl.IdBaseLigne = s.IdBaseLigne
JOIN dos_base db ON db.IdBase = dbl.IdBase;
```
Écarts constatés à l'écriture, intégrés au script : `ope_sms_reponse` n'a ni `IdSms` ni `IdOperation` (rattachement par `dos_base_ligne` + `dos_base` ; colonnes `Reponse` et `DateHeure`) ; les clics et réponses des envois de test sont exclus (`IdBaseLigne` / `IdOperation` non nuls). Les familles sont les constantes `__RETOUR_FAMILLE_*` (LEAD, INTENTION, INTERACTION, REDIRECTION, REPONSE) ; les actions des clics RCS sont les `SousType` (`__RCS_ACTION_*`), complétés de REDIRECTION, FORMULAIRE et REPONSE.

## 6. Ordre de réalisation

1. Vue `vue_rcs_retour` + constantes ; extension de `structSynthèse` et de `Partage.ChargeSynthèseOperation` (type RCS).
2. Page `pgeRcsSynthese` : copie, onglets Synthèse / Rapport / Performance / Retours adaptés ; accueil : bouton « Synthèse » des opérations RCS branché.
3. Export Excel (feuilles Rapport RCS et Retours).
4. Passage automatique de l'opération à « terminée » (aucune ligne en 10/20 et validité dépassée) — batchRcs.
5. V2 : classification IA des réponses (chantier suivant — les réponses elles-mêmes sont affichées dès la V1) ; Réaction Choix / Sélection ; bot.

## 7. Plan de test

Opération 3027 / 3061 / 3062 (prod, équipe) : compteurs cohérents avec `ope_rcs_envoi` (délivrés, lus, repli), interactions et leads visibles dans Retours avec le bon classement (« Ça m'intéresse » = Lead / Réaction, « En savoir plus » = Interaction / Lien, « Nous appeler » = Intention, clic dans la landing = Redirection), réponses visibles sous la pastille Réponses avec leur texte en Détail, export Excel conforme ; une opération SMS classique reste inchangée.
