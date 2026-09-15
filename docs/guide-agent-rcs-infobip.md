# Créer et configurer un agent RCS sur Infobip — guide pas à pas

Version du 14 septembre 2026, rédigé pour Marketeam. À relire avant chaque création d'agent pour un client.
Chemins d'accès indiqués en **gras** tels qu'ils apparaissent dans le portail Infobip (menu de gauche).

---

## 0. Comprendre en deux minutes

- Un **agent RCS** (Infobip dit *sender*) est l'identité qui apparaît sur le téléphone du destinataire : nom, logo, couleur, description, coordonnées. Un agent = une marque = un client Marketeam.
- Le cycle de vie d'un agent : **création** (chez Infobip, qui le déclare chez Google) → **tests** (vers des numéros testeurs déclarés) → **lancement** (validation par chaque opérateur : Orange, SFR, Bouygues, Free) → **en service**.
- Marketeam n'envoie qu'avec des agents **lancés** et déclarés dans sa table `rcs_agent`. Le reste (rapports, lectures, clics, réponses) fonctionne pour tous les agents grâce à une configuration **commune** faite une seule fois (chapitre 5).
- Doctrine Marketeam : agents **non conversationnels** (facturés au message), hébergés en **Europe**. Ces deux choix sont **irréversibles** après création.

---

## 1. Avant de commencer — ce qu'il faut demander au client

Tout est demandé dans le formulaire de création ; le plus long est de récupérer les éléments graphiques.

| Élément | Contrainte Infobip | Conseil |
|---|---|---|
| Nom affiché (*Display name*) | visible sur le téléphone | le nom de la marque tel que le public le connaît |
| Description | texte court visible sur le téléphone | à quoi sert l'agent (« Offres et actualités de … ») |
| Couleur principale | format `#RRGGBB`, contraste **≥ 4,5:1** sur du texte blanc | éviter les couleurs claires (jaune, cyan pâle) |
| Logo | **JPEG, exactement 224 × 224 px, 50 ko max** | fond uni, marge autour du logo |
| Bannière | **JPEG, exactement 1440 × 448 px, 200 ko max** | affichée en haut du profil de l'agent |
| Téléphone + libellé | E.164 (`+33…`) ou national | numéro du service client |
| Email + libellé | adresse valide | |
| Site web + libellé | commence par `https://` | |
| Politique de confidentialité | URL publique | obligatoire |
| Conditions générales | URL publique | obligatoire |

Le portail vérifie les images en temps réel : un fichier au mauvais format est refusé immédiatement, avant l'envoi.

**Décisions techniques, à prendre avant** :
- **Sender name** (identifiant technique) : sans espace, 40 caractères max, **immuable** et jamais visible du public. Convention Marketeam : le nom de la marque en un mot (ex. `Chronodirect`). C'est cette valeur exacte qui ira dans `rcs_agent.SenderName`.
- **Brand** : la marque propriétaire (choisir une existante ou en créer une) ; interne à Infobip.
- **Billing category** : **Non-conversational** (irréversible).
- **Hosting region** : **Europe** (irréversible).
- **Use case** : **Promotional** pour une marque qui fait du marketing ; **Multi-use** si elle enverra aussi des notifications de service.

---

## 2. Créer l'agent

1. **Channels and Numbers › Channels**.
2. Dans la liste des canaux, cliquer sur **RCS Business Messaging**.
3. Bloc *Create RCS Business Messaging sender* → bouton **Create sender**.
4. Remplir le formulaire avec les éléments du chapitre 1. Le panneau de droite montre l'aperçu tel que le verra le destinataire.
5. En bas : **Create sender** (envoie la demande à Google) ou **Save as draft** (pour finir plus tard).

Suivre l'avancement : **Channels and Numbers › Channels › RCS Business Messaging › onglet Senders**. Statuts rencontrés, dans l'ordre :

| Statut | Signification | Ce que tu peux faire |
|---|---|---|
| Draft | brouillon | modifier |
| Pending | demande en cours chez Infobip/Google | attendre |
| **In testing** | agent approuvé pour les tests | ajouter des testeurs, envoyer des tests, modifier |
| Pending launch | lancement demandé | attendre |
| Update required | Infobip demande une correction avant lancement | modifier puis redemander |
| Launched – In progress | lancé chez au moins un opérateur | envoyer aux opérateurs validés |
| Launch – Partial success | certains opérateurs ont refusé | redemander pour les manquants |
| **Launched** | en service | production |

---

## 3. Tester l'agent (statut *In testing*)

Tant que l'agent n'est pas lancé, il ne peut écrire qu'à des **numéros testeurs** déclarés.

1. **Channels and Numbers › Channels › RCS Business Messaging › Senders** → cliquer sur l'agent.
2. Onglet **Test devices** → **Add device** → numéro au format E.164 (`+33670299592`) → **Create**.
3. Le testeur reçoit une invitation sur son téléphone et doit l'**accepter** ; le numéro passe de *Pending* à *Ready*.
4. Envoyer un test : soit depuis le portail (**Test devices › Send test message**), soit depuis Marketeam avec une ligne dans `ope_rcs_unitaire` (RCS texte) — voir chapitre 6.

Vérifier avec des téléphones variés : Android (Google Messages) et iPhone (l'affichage diffère : sur iPhone les boutons d'une carte sont regroupés sous « Options »).

---

## 4. Lancer l'agent

1. Avant de demander : **Channels and Numbers › Channels › RCS Business Messaging › onglet Overview › Discover launch requirements** → choisir *France* → voir les exigences par opérateur.
2. **Senders** → l'agent → **Request sender launch** → pays *France* → email qui recevra les mises à jour → (facultatif) informations pour le chargé de compte → **Next** → remplir le questionnaire de lancement.
3. Un email confirme la prise en compte. Le lancement est validé **opérateur par opérateur** ; le chargé de compte Infobip (Viorica Negoi) suit le dossier — la relancer si un opérateur tarde.
4. Quand le statut est **Launched** : les numéros testeurs sont retirés, l'agent est en production.

---

## 5. Configurer les messages entrants (indispensable pour Marketeam)

Sans cette étape, les clics sur les boutons, les réponses et les STOP restent chez Infobip et **n'arrivent jamais dans Marketeam**.

### 5.1 Ce qui existe déjà, une fois pour toutes (ne pas refaire)
- **Developer Tools › Subscriptions Management › onglet Notification profiles** : profil `marketeam-rcs-entrants`, URL `https://rcs.marketeam.direct/KANNEL_WEB/FR/RcsEntrant.awp?k=<jeton>` (le jeton est dans `prm_parametre`, clé `Rcs_Webhook_Cle`).
- **Developer Tools › Subscriptions Management › onglet Subscriptions** : abonnement `RCS-entrants-Marketeam`, canal RCS, événements *Inbound message*, *Suggestion*, *Click*, sans filtre, relié au profil ci-dessus.

Une seule souscription couvre **tous les agents** du compte. Si un jour le jeton change (`Rcs_Webhook_Cle`), c'est le profil de notification qu'il faut modifier.

### 5.2 À faire pour CHAQUE nouvel agent
1. **Channels and Numbers › Channels › RCS Business Messaging › Senders** → cliquer sur l'agent.
2. Section **Inbound configuration** → bouton **Set default** (ou menu ⋮ › *Edit inbound configuration* si une configuration existe).
3. *Forwarding action* = **Follow subscription** → l'abonnement `RCS-entrants-Marketeam` s'affiche.
4. *Non-forwarding action* : ne rien cocher.
5. *Application* = **default**, *Entity* vide (sinon le bouton reste grisé).
6. **Add configuration**.

### 5.3 Le mot-clé STOP
Infobip ajoute par défaut un mot-clé `STOP` avec l'action **Block** (mise sur liste de blocage Infobip) et *Follow subscription*. Marketeam reçoit donc le STOP (blocage dans `dos_base_ligne_erreur` + confirmation facturée), et Infobip bloque aussi de son côté. Point ouvert au 14/09/2026 : décider si l'action « Block » côté Infobip est conservée (un numéro bloqué chez Infobip ne se débloque que dans leur portail, et la confirmation Marketeam pourrait être refusée). Ne pas tester avec un numéro que l'on veut garder joignable.

Les rapports de **livraison** et de **lecture** n'ont rien à configurer ici : Marketeam envoie l'adresse de retour dans chaque message (`Rcs_Webhook_Url`).

---

## 6. Déclarer l'agent dans Marketeam

Tant que les pages de gestion des agents n'existent pas dans le site, l'agent se déclare en base :

1. Dans HeidiSQL, table `rcs_agent` : copier la ligne de `Chronodirect` (clic droit › *Exporter les lignes de la grille › SQL INSERT*) et adapter : `SenderName` (valeur **exacte** du portail), `NomAffichage`, `NomMarque`, `Description`, `Couleur`, `LogoUrl`, `BanniereUrl`, contacts, `IdClient` du client, `EstActif = 1` seulement quand l'agent est **Launched**.
2. Vérifier : `SELECT IdRcsAgent, SenderName, EstActif FROM rcs_agent;`
3. Premier test réel depuis Marketeam (l'agent doit être lancé, ou le numéro déclaré testeur) :
```sql
INSERT INTO ope_rcs_unitaire (IdOperation, IdBaseLigne, CodeLanding, IdRcsAgent, IdClient, IdContact, Origine, Portable, Message, Statut, DateHeureCreation, UserCreation)
VALUES (<une opération du client>, NULL, NULL, <IdRcsAgent>, <IdClient>, NULL, 'TST', '336XXXXXXXX', 'Test agent <nom>', '10', NOW(), 'Test');
```
puis `SELECT Statut, MessageId, CanalUtilise, StatutNom, DateHeureReception, DateHeureLu FROM ope_rcs_unitaire ORDER BY IdRcsUnitaire DESC LIMIT 1;` → attendu `90`, `RCS`, dates remplies.

---

## 7. La clé API (rappel, commun à tous les agents)

- **Developer Tools › API keys** : clé `ChronoRcs`, étendues `rcs:message:envoyer`, `rcs:gérer`, `rcs:logs:lecture`, `rcs:provision` (+ générales). **Adresses IP autorisées** : celles depuis lesquelles `batchRcs` sort sur Internet (`151.80.196.81` = sortie du Private Cloud OVH). Un serveur qui sort par une autre IP doit y être ajouté.
- **Date d'expiration : 10/09/2027.** À renouveler avant, puis `UPDATE prm_parametre SET ValChaine = '<nouvelle clé>' WHERE ClefRecherche = 'Rcs_Infobip_ApiKey';` et redémarrer `batchRcs`.
- Ne jamais mettre la clé dans Git, ni dans un export partagé.

---

## 8. Vérifier et dépanner

| Symptôme | Où regarder | Cause fréquente |
|---|---|---|
| Message non reçu, ligne en `15` | trace de `batchRcs` (`EnvoieInfobip HTTP …`) | 400 = JSON refusé (le détail est dans la réponse) ; 401/403 = clé ou IP non autorisée ; erreur système 3 = URL `Rcs_Infobip_Url` mal formée |
| Ligne reste en `20` | `Rcs_Webhook_Url` vide ? | l'adresse de retour n'est pas envoyée |
| Statut `80`, erreur `7002 EC_UNKNOWN_USER` | normal | numéro non compatible RCS ; repli SMS si l'opération en a un |
| Clics / réponses absents de `ope_rcs_clic` / `ope_rcs_reponse` | **Senders › agent › Inbound configuration** | configuration par défaut manquante (chapitre 5.2) |
| Pour voir les JSON reçus | `mkt-reports`, `CnxMySql.ini`, `LOG_RCS=1` | fichiers `RcsLogRapport_<date>.txt` et `RcsLogEntrant_<date>.txt` ; remettre à 0 après |
| Historique côté Infobip | **Analyze › Logs**, canal RCS | statut final, erreurs, prix, entrants |
| Codes inconnus | `SELECT * FROM rcs_code WHERE Libelle IS NULL;` | leur donner un libellé français |

---

## 9. Contacts

- Chargée de compte Infobip : Viorica Negoi (lancement des agents, questions tarifaires, activation du capability check).
- Sécurité / réseau : Thomas Chaillot (prestataire externe).

---

## Annexe A — Procédure complète : profil de notification, abonnement, rattachement à l'agent

Réalisée le 14 septembre 2026 pour l'agent Chronodirect. À refaire seulement si : le jeton `Rcs_Webhook_Cle` change (étape A1 uniquement), le compte Infobip change (tout), ou l'abonnement a été supprimé. Pour un **nouvel agent** sur le même compte, seule l'étape A3 est nécessaire.

### A1. Créer le profil de notification (porte l'URL de Marketeam)

1. Récupérer l'URL exacte à saisir :
```sql
SELECT CONCAT('https://rcs.marketeam.direct/KANNEL_WEB/FR/RcsEntrant.awp?k=', ValChaine)
FROM prm_parametre WHERE ClefRecherche = 'Rcs_Webhook_Cle';
```
2. Menu de gauche : **Developer Tools** (déplier) › **Subscriptions Management**.
3. Onglet **Notification profiles** → bouton **Create notification profile**.
4. Remplir uniquement :
   - *Notification profile name* : `marketeam-rcs-entrants` (lettres, chiffres, tirets ; pas d'espace) ;
   - *Webhook URL* : le résultat de la requête, collé tel quel.
5. Laisser vides : *Expert parameters*, *Security settings* (le jeton dans l'URL fait office d'authentification), *Certificate*, *Advanced settings*.
6. Enregistrer.

Si seul le jeton change : ouvrir ce profil, remplacer l'URL, enregistrer. Rien d'autre à toucher.

### A2. Créer l'abonnement (dit quels événements envoyer, et vers quel profil)

1. **Developer Tools › Subscriptions Management** → onglet **Subscriptions** → **Create subscription**. Un assistant en quatre écrans s'ouvre.
2. Écran **Category** :
   - *Subscription name* : `RCS-entrants-Marketeam` ;
   - *Subscription ID* : laisser la valeur générée ;
   - onglet *Channels* : cliquer sur la tuile **RCS** ; **Next**.
3. Écran **Events** : cocher **Inbound message** (réponses tapées, STOP), **Suggestion** (appuis sur les boutons — c'est ce qui alimente `ope_rcs_clic`), **Click**. Ne pas cocher *Delivery* ni *Seen* : ces rapports partent déjà par l'adresse incluse dans chaque message ; les cocher ferait des doublons. **Next**.
4. Écran **Filtering** : ne rien saisir (Users, Entity, Application, Resources vides) ; **Next**.
5. Écran **Notification profile** : choisir `marketeam-rcs-entrants` ; valider le résumé.
6. Contrôle : l'abonnement apparaît dans la liste avec *Channel* RCS, *Events* `INBOUND_MESSAGE, SUGGESTION, CLICK`, *Profile ID* `marketeam-rcs-entrants`.

Un seul abonnement suffit pour tous les agents du compte.

### A3. Rattacher l'agent à l'abonnement (à faire pour chaque agent)

1. **Channels and Numbers › Channels** → **RCS Business Messaging** → onglet **Senders** → cliquer sur l'agent.
2. Section **Inbound configuration**. Si elle affiche *No default configuration* : bouton **Set default**. Sinon : menu ⋮ › *Edit inbound configuration*.
3. Dans la fenêtre *Default inbound configuration* :
   - *Forwarding action* : **Follow subscription** → le nom et l'ID de `RCS-entrants-Marketeam` s'affichent (si un bandeau jaune *Subscription missing* apparaît, l'étape A2 n'est pas faite) ;
   - *Non-forwarding action* : ne rien cocher ;
   - *Application* : choisir **default** — tant que ce champ est vide, le bouton *Add configuration* reste grisé ; *Entity* : vide.
4. **Add configuration**.

### A4. Vérifier que ça marche

1. Sur `mkt-reports`, dans `CnxMySql.ini`, `LOG_RCS=1` (temporaire).
2. Depuis un téléphone qui a reçu un RCS de l'agent : appuyer sur un bouton, puis répondre un texte.
3. Contrôles :
   - fichier `RcsLogEntrant_<date>.txt` dans le répertoire de données du site reports : un JSON par événement (`message.type` = `SUGGESTION` avec `postbackData` pour un bouton, `TEXT` pour une réponse) ;
   - `SELECT * FROM ope_rcs_clic ORDER BY IdRcsClic DESC LIMIT 5;` → une ligne par appui, avec carte, bouton, libellé ;
   - `SELECT * FROM ope_rcs_reponse ORDER BY IdRcsReponse DESC LIMIT 5;` → la réponse texte.
4. Remettre `LOG_RCS=0`.

Résultat observé le 14/09/2026 : les appuis arrivent comme *Inbound message* de type `SUGGESTION` (pas comme événement séparé), avec le `pairedMessageId` du message d'origine ; une réponse texte arrive sans `pairedMessageId` et est rattachée par le numéro de portable (dernier envoi de moins de 3 jours). Les horodatages Infobip sont en `+0000` ou `+0100` et sont convertis en heure de Paris par la page.
