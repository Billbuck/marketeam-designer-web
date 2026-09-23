# Cahier des charges — Qualification RCS des bases de données

Version du 23 septembre 2026. Complète l'architecture asynchrone des lots 1-2 (22 septembre) par un mode synchrone : synchrone jusqu'à `Rcs_Qualification_AutoMax` portables, asynchrone au-delà (manuel uniquement).

## 1. Objet

Déterminer, pour chaque portable d'une base client (`clt_base` / `clt_base_ligne`), s'il est joignable en RCS, en SMS seulement, ou invalide, afin que :
- le tunnel RCS ne propose que des bases qualifiées et fraîches ;
- le devis compte les lignes RCS au prix RCS et les lignes SMS au prix SMS ;
- `batchRcs` n'envoie en RCS que les numéros RCS, en SMS direct les numéros SMS seul, et rien aux invalides.

Le service est **gratuit** pour le client : aucune opération, aucune facturation.

## 2. Décisions

| # | Point | Décision |
|---|---|---|
| 1 | Mode d'interrogation Infobip | **Hybride selon la taille.** Jusqu'à `Rcs_Qualification_AutoMax` portables distincts : **synchrone**, `POST /rcs/2/capability-check/query`, 500 numéros par appel, réponse complète dans la requête. Au-delà (bases très volumineuses, traitement manuel) : **asynchrone**, `POST /rcs/2/capability-check/notify`, 10 000 numéros par lot, résultats reçus par la page `pgeRcsCapacite`, lots suivis dans `clt_base_rcs_lot` ; un traitement long y est accepté. |
| 2 | Lieu d'exécution | `batchRcs` (scanner `ScannerQualification`). Le site ne fait que poser le statut `A_TRAITER`. |
| 3 | Parallélisme | `TâcheParallèleExécute`, `Rcs_Capacite_Parallelisme` tâches simultanées (4 au départ), une source de données par tâche. Réglé après mesure. |
| 4 | États d'une ligne (`EstRcs`) | `NULL` inconnu ; `1` RCS (`ENABLED`) ; `0` SMS seul (`UNREACHABLE`, `REJECTED_NETWORK`, `UNKNOWN_CODE` et tout autre code de non-capacité) ; `2` invalide (`INVALID_DESTINATION_ADDRESS`, ou numéro absent de la réponse). |
| 5 | Délais cibles | < 3 000 portables : 15 s ; < 20 000 : 1 min ; au-delà : 10 min. |
| 6 | Déclenchement | **Automatique à l'import** de toute base contenant des portables, plafonné à `Rcs_Qualification_AutoMax` (50 000 portables). Au-delà, et pour relancer : entrée de menu « Analyse RCS », visible seulement si le client a au moins un agent RCS actif. Le même seuil choisit le mode : synchrone en dessous, asynchrone au-dessus. |
| 7 | Fraîcheur | `Rcs_Qualification_ValiditeJours` = 30. Pas de relance automatique. Base périmée = non proposée dans le tunnel, message « analyse RCS à refaire ». |
| 8 | Progression | Timer de page (5 s) dans `pgeBddMesBasesDeDonnées`, actif tant qu'une base du client est `EN_COURS` : rafraîchit libellé et jauge. Jauge = `NbrTraiteRcs / NbrPortableRcs` dans les deux modes (en asynchrone, `NbrTraiteRcs` est mis à jour par `pgeRcsCapacite`). Pas de WebSocket dans cette version. |
| 9 | Affichage | Colonnes **Rcs** et **Sms** (nombres, comme Portable) — RCS + SMS + invalides = portables distincts ; colonne **Statut RCS** : libellé, et jauge en dessous pendant le traitement. |
| 10 | Export | Aucun résultat de qualification dans l'export Excel de la base. |
| 11 | Facturation Infobip | Vérification gratuite (Viorica, 22 sept.). À confirmer par écrit que le mode synchrone l'est aussi, et demander la limite de cadence (appels/minute). |

## 3. Modèle de données

### Existant, conservé
- `clt_base` : `StatutRcs` ENUM('NON','A_TRAITER','EN_COURS','TRAITE','ERREUR'), `DateHeureRcs`, `NbrRcs`, `NbrSmsSeul`.
- `clt_base_ligne.EstRcs` TINYINT NULL ; `dos_base_ligne.EstRcs` (recopié à l'injection).
- Constantes `__BASE_RCS_NON__`, `__BASE_RCS_A_TRAITER__`, `__BASE_RCS_EN_COURS__`, `__BASE_RCS_TRAITE__`, `__BASE_RCS_ERREUR__`.

### À ajouter
- `clt_base` : `NbrInvalide` INT UNSIGNED NULL ; `NbrPortableRcs` INT UNSIGNED NULL (portables distincts envoyés, dénominateur de la jauge) ; `NbrTraiteRcs` INT UNSIGNED NULL (numéros dont la réponse est reçue, numérateur, mis à jour après chaque appel).
- Constantes de ligne : `__LIGNE_RCS_INCONNU__` (NULL), `__LIGNE_RCS_OUI__` = 1, `__LIGNE_RCS_SMS__` = 0, `__LIGNE_RCS_INVALIDE__` = 2.
- Paramètres `prm_parametre` : `Rcs_Capacite_TailleLotSync` = 500 (synchrone) ; `Rcs_Capacite_TailleLot` = 10000 (asynchrone, existe) ; `Rcs_Capacite_Parallelisme` = 4 ; `Rcs_Qualification_AutoMax` = 50000 ; `Rcs_Qualification_ValiditeJours` = 30 (existe) ; `Rcs_Capacite_InactiviteMinutes` = 10.

### Conservé pour le mode asynchrone
- Table `clt_base_rcs_lot` (avec en plus `DateHeureDernierRetour` DATETIME NULL, posée par `pgeRcsCapacite` à chaque résultat), paramètre `Rcs_Capacite_Webhook_Url`, page `pgeRcsCapacite` (projet reports), procédure `cpRcs.EnvoieCapabilityCheck` (version notify).
- Paramètre nouveau `Rcs_Capacite_InactiviteMinutes` = 10 : en asynchrone, quand aucun résultat n'est arrivé depuis ce délai, les numéros sans réponse passent en invalide et la base est consolidée. Remplace l'échéance de 2 h.

## 4. Déroulement

1. **Import** (`pgeBddImport` ou procédure d'import) : après création de la base, si `NbrSms > 0` et `NbrSms <= Rcs_Qualification_AutoMax` → `StatutRcs = A_TRAITER`.
2. **Menu** « Analyse RCS » (`pgeBddMesBasesDeDonnées`) : mêmes conditions de visibilité qu'aujourd'hui + client avec un agent actif (`rcs_agent.IdClient`, `EstActif = 1`) ; clic → `A_TRAITER`.
3. **`ScannerQualification`** (`batchRcs`, toutes les 30 s) : pour chaque base `A_TRAITER` :
   - `EN_COURS`, `EstRcs = NULL` sur toutes les lignes, `NbrTraiteRcs = 0` ;
   - portables distincts non vides → `NbrPortableRcs` ;
   - découpage en paquets de `Rcs_Capacite_TailleLot` (500), exécution par `Rcs_Capacite_Parallelisme` tâches parallèles ; chaque tâche : `cpRcs.VerifieCapacite(sSender, tabNumeros)` → tableau (numéro, code) ; écriture des `EstRcs` (un `UPDATE … WHERE IdBase = … AND Portable IN (…)` par valeur : les RCS, puis les SMS, puis les invalides) ; les numéros absents de la réponse → invalide ; `NbrTraiteRcs += taille du paquet` ;
   - échec HTTP d'un paquet : nouvel essai une fois après 5 s ; second échec → numéros du paquet à `invalide` et compteur d'erreurs ; si plus de 10 % des paquets échouent → base `ERREUR` ;
   - fin : `TRAITE`, `DateHeureRcs = NOW()`, `NbrRcs`, `NbrSmsSeul`, `NbrInvalide` par `COUNT` ; ligne dans `tblQualification` (base, portables, durée, RCS / SMS / invalides).
   Ce qui précède est le **mode synchrone** (`NbrPortableRcs <= Rcs_Qualification_AutoMax`). Au-delà, **mode asynchrone** (existant, corrigé) : envoi des lots de 10 000 (`EnvoieCapabilityCheck`), `clt_base_rcs_lot` ; `pgeRcsCapacite` tague chaque résultat, incrémente `NbrRecu` et `clt_base.NbrTraiteRcs`, pose `DateHeureDernierRetour` ; le scanner consolide la base quand tous les lots sont complets, ou quand le dernier retour date de plus de `Rcs_Capacite_InactiviteMinutes` : les numéros restés `NULL` passent en invalide, puis `TRAITE` et compteurs.
4. **Page** `pgeBddMesBasesDeDonnées` : colonnes Rcs / Sms remplies si `TRAITE` ; colonne Statut RCS : « Analyse RCS en attente », « Analyse RCS en cours » + jauge `NbrTraiteRcs / NbrPortableRcs`, « Analyse RCS du JJ/MM/AAAA », « Analyse RCS en erreur » ; timer 5 s tant qu'une base est `A_TRAITER` ou `EN_COURS`.

## 5. Règles du tunnel et du devis (lot 3, inchangé)

- Tunnel RCS : bases `TRAITE` et `DateHeureRcs` de moins de `Rcs_Qualification_ValiditeJours` jours ; les autres grisées avec « Analyse RCS à faire / à refaire ».
- `EnregistrementBase` recopie `EstRcs` dans `dos_base_ligne`.
- Devis : `ROUTAGE_RCS` × lignes `EstRcs = 1` ; si repli SMS : `ROUTAGE_SMS` × lignes `EstRcs = 0` × segments du texte de repli ; sans repli : lignes SMS exclues et annoncées ; lignes invalides jamais comptées, annoncées (« n numéros invalides ignorés »).
- `EnregistrementProgrammationRcs` : `ope_rcs_envoi.CanalPrevu` = RCS pour `EstRcs = 1`, SMS pour `EstRcs = 0` si repli ; rien pour 2 et NULL.

## 6. Mesure préalable (avant tout développement)

Depuis `batchRcs` (procédure de test provisoire) : un appel `/rcs/2/capability-check/query` avec les numéros de la base « Base Test Nico », chronométré, puis 4 appels en parallèle.

**Résultats du 23 septembre 2026 (base 63, 91 portables distincts, sender Chronodirect)** :
- corps de requête `{ "sender": "…", "phoneNumbers": [ … ] }` ; réponse `{ "capabilityCheckResults": [ { "messageId", "phoneNumber", "code" }, … ] }`, **une entrée par numéro envoyé** ;
- appel unique : **362 ms** ; quatre appels en parallèle : **545 ms** au total (460 à 545 ms chacun), aucun code 429 ;
- codes observés : `ENABLED`, `UNREACHABLE`, `INVALID_DESTINATION_ADDRESS`, `REJECTED_NETWORK` ; le numéro resté sans réponse en asynchrone la veille est `INVALID_DESTINATION_ADDRESS` en synchrone ;
- extrapolation (500 numéros ≈ 1 s, parallélisme 4) : 3 000 portables ≈ 2 s, 20 000 ≈ 10 s, 50 000 ≈ 15 s, 500 000 ≈ 3 min. Les délais cibles du § 2 sont tenus ; `Rcs_Capacite_Parallelisme` = 4 confirmé.

**Seconde mesure, base réelle (base 65, 2 000 portables distincts, 4 paquets de 500 distincts)** :
- un paquet de 500 : **1,23 s**, réponse 49 Ko, 500 entrées sur 500 ; quatre paquets en parallèle : **1,74 s** au total (1,65 à 1,74 s chacun), pas de 429 ;
- extrapolation corrigée : 3 000 ≈ 2 s, 20 000 ≈ 17 s, 50 000 ≈ 45 s, 500 000 ≈ 7 min — délais cibles tenus ;
- répartition sur une base client française : **76,0 % `ENABLED`**, 22,1 % `UNREACHABLE`, 1,7 % `UNKNOWN_CODE`, 0,1 % `REJECTED_NETWORK`, aucun `INVALID_DESTINATION_ADDRESS`. Décision (Michel, 23 sept.) : `REJECTED_NETWORK` et `UNKNOWN_CODE` = SMS seul.

## 7. Plan de test

1. Base équipe (6 portables) : `TRAITE` en moins de 15 s, 5 / 1 / 0.
2. « Base Test Nico » (100 lignes, 91 portables distincts, numéros fictifs) : `TRAITE` en moins de 15 s, invalides comptés.
3. Base de 20 000 portables réels : moins d'une minute, jauge visible, colonnes cohérentes (RCS + SMS + invalides = portables distincts).
3b. Base de plus de 50 000 portables (mode asynchrone, lancée par le menu) : jauge qui progresse, consolidation au plus tard `Rcs_Capacite_InactiviteMinutes` après le dernier retour, silencieux comptés en invalides.
4. Import d'une base avec portables : passage automatique en `A_TRAITER` ; import d'une base de plus de 50 000 : pas d'automatique, menu disponible.
5. Client sans agent : menu absent.
6. Coupure réseau pendant un traitement : base `ERREUR`, relance possible par le menu.

## 8. Ordre de réalisation

1. Mesure (§ 6).
2. Base : colonnes, constantes, paramètres (dev puis prod).
3. `batchRcs` : `cpRcs.VerifieCapacite` + `ScannerQualification` synchrone parallèle, aiguillage par taille, consolidation par inactivité du mode asynchrone ; `pgeRcsCapacite` : `DateHeureDernierRetour`, `NbrTraiteRcs`, invalides.
4. Site : import automatique, menu conditionné, colonnes, statut, jauge, timer.
5. Lot 3 (tunnel + devis) puis lot 4 (envoi SMS direct).
