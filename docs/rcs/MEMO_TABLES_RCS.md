# Mémo — Tables RCS Marketeam

Aide-mémoire personnel. Un tableau par table, avec le rôle de chaque champ en une ligne.

> Pour la **procédure de création et le cycle de vie des agents**, voir le mémo dédié
> `MEMO_CREATION_AGENT_RCS.md`.

**Légende de la colonne « API »**

| Symbole | Signification |
|---|---|
| ↗ | Part dans le JSON envoyé à Infobip |
| ↙ | Vient d'Infobip (réponse ou webhook) |
| — | Interne à Marketeam, ne sort jamais |

---

## Vue d'ensemble

```
rcs_agent                          identités de marque déclarées chez Infobip
  ├── rcs_agent_testeur            numéros de test (200 max/agent, non supprimables)
  ├── rcs_agent_operateur          couverture par pays et opérateur
  └── rcs_agent_historique         journal du cycle de vie

dos_operation
  └── ope_rcs                      paramètres de la campagne RCS
        └── ope_rcs_carte          1 carte, ou 2 à 10 en carrousel
              └── ope_rcs_carte_bouton   0 à 4 boutons par carte

rcs_envoi                          1 ligne par destinataire
  └── rcs_clic                     0 à n clics par envoi
```

---

## 1. `rcs_agent`

L'identité de marque affichée sur le téléphone du destinataire.
⚠️ **Les longueurs reflètent exactement les limites de l'API** — ne pas les élargir.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsAgent` | INT auto | — | Clé interne Marketeam |
| `IdContact` | INT | — | Contact client à l'origine de la création |
| `IdClient` | INT | — | Propriétaire si agent rattaché à un client |
| `IdMarque` | INT | — | Propriétaire si agent rattaché à une marque |
| `SenderName` | VARCHAR(**40**) | ↗ | **Clé technique Infobip. Immuable.** 3-40 car., alphanum + `_` `-`, au moins une lettre |
| `NomAffichage` | VARCHAR(**40**) | ↗ | `displayName` — nom vu sur le téléphone |
| `NomMarque` | VARCHAR(100) | ↗ | `brand.brandName` |
| `Description` | VARCHAR(**100**) | ↗ | **Limite stricte de 100 car.** Très basse, facile à dépasser |
| `CategorieFacturation` | ENUM | ↗ | `NON_CONVERSATIONAL`. **Irréversible après demande de lancement** |
| `CasUsage` | ENUM | ↗ | OTP / TRANSACTIONAL / PROMOTIONAL / MULTI_USE |
| `RegionHebergement` | ENUM | ↗ | `EUROPE`. **Irréversible après création** |
| `Couleur` | CHAR(7) | ↗ | `#RRGGBB`, **contraste ≥ 4,5:1 sur blanc** |
| `LogoUrl` | VARCHAR(2048) | ↗ | JPG/PNG, **exactement 224 × 224 px**, ≤ 51 200 octets |
| `BanniereUrl` | VARCHAR(2048) | ↗ | JPG/PNG, **exactement 1440 × 448 px**, ≤ 204 800 octets |
| `ContactTelephone` | VARCHAR(20) | ↗ | E.164 avec `+`, ou national 3-20 chiffres |
| `ContactTelephoneLibelle` | VARCHAR(25) | ↗ | **Obligatoire si téléphone renseigné** |
| `ContactEmail` | VARCHAR(**100**) | ↗ | Email de contact de la marque |
| `ContactEmailLibelle` | VARCHAR(25) | ↗ | **Obligatoire si email renseigné** |
| `SiteWebUrl` | VARCHAR(2048) | ↗ | Site officiel |
| `SiteWebLibelle` | VARCHAR(25) | ↗ | **Obligatoire si site renseigné** |
| `ConfidentialiteUrl` | VARCHAR(2048) | ↗ | Doit mentionner opt-out, frais, fréquence. **1ʳᵉ cause de rejet** |
| `ConfidentialiteLibelle` | VARCHAR(25) | ↗ | Libellé du lien |
| `CguUrl` | VARCHAR(2048) | ↗ | Doit mentionner la non-revente des données |
| `CguLibelle` | VARCHAR(25) | ↗ | Libellé du lien |
| `PlatformApplicationId` | VARCHAR(255) | ↗ | Identifiant plateforme. **Modifiable à tout moment** |
| `PlatformEntityId` | VARCHAR(255) | ↗ | Identifiant entité. **Modifiable à tout moment** |
| `Statut` | ENUM (9 val.) | ↙ | `BROUILLON_LOCAL` (Marketeam) + les 8 statuts Infobip |
| `EstVerrouille` | TINYINT **généré** | — | Calculé depuis le statut. Pilote l'éditabilité des champs |
| `GoogleAgentId` | VARCHAR(100) | ↙ | Identifiant Google reçu par webhook. Utile au support |
| `MotifCorrection` | TEXT | ↙ | Consolidé depuis `launch-status` si `SENDER_UPDATE_REQUIRED` |
| `DateHeureCreationInfobip` | DATETIME | — | `POST /senders` réussi |
| `DateHeureDemandeLancement` | DATETIME | — | Demande transmise au chargé de compte |
| `DateHeureLancement` | DATETIME | — | Passage en `LAUNCHED*` |
| `DateHeureStatut` | DATETIME | ↙ | Dernier changement de statut |
| `DateHeureSynchro` | DATETIME | — | Dernière synchro avec l'API |
| `EstActif` | TINYINT(1) | — | **Décision Marketeam**, distincte du statut Infobip |

**Les 9 statuts**

| Statut | Modifiable ? | Envoi ? |
|---|---|---|
| `BROUILLON_LOCAL` *(Marketeam)* | Oui | Non |
| `DRAFT` | Oui | Non |
| `PENDING` | Non | Non |
| `READY_FOR_TESTING` | Oui | Testeurs `APPROVED` seulement |
| `PENDING_LAUNCH` | **Non — verrouillé** | Non |
| `SENDER_UPDATE_REQUIRED` | Oui | Non |
| `LAUNCHED_IN_PROGRESS` | Non | **Oui** |
| `LAUNCHED_PARTIAL_SUCCESS` | Non | **Oui** |
| `LAUNCHED` | Non | **Oui** |

> **Contraintes `CHECK`** : exactement un de `IdClient` / `IdMarque` ; au moins un contact
> parmi téléphone, email ou site.
> **Non garanti par la base** : la présence du libellé associé à chaque contact, et le
> fait que `IdContact` appartienne bien au client de `IdClient`.
>
> ⚠️ **Plafond de 10 agents** par compte Infobip. **Le lancement n'est pas dans l'API.**
> Voir `MEMO_CREATION_AGENT_RCS.md`.

---

## 2. `rcs_agent_testeur`

Numéros autorisés à recevoir tant que l'agent n'est pas lancé.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsAgentTesteur` | INT auto | — | Clé technique |
| `IdRcsAgent` | INT | — | Agent concerné |
| `Numero` | VARCHAR(20) | ↗ | **`+336…` pour l'API testeurs, `336…` sans `+` pour l'envoi** |
| `Libelle` | VARCHAR(60) | — | Nom du testeur (« Nicolas iPhone 15 ») |
| `TypeAppareil` | ENUM | — | INCONNU / IOS / ANDROID. **Saisie manuelle**, alerter si aucun iPhone |
| `Statut` | ENUM | ↙ | `PENDING` → `WAITING_FOR_TESTER_ACCEPTANCE` → `APPROVED` ou `EXPIRED` |
| `EstPrincipal` | TINYINT(1) | ↗ | `primary`. Un numéro principal pour **un seul agent** à la fois |
| `DateHeureAjout` | DATETIME | — | `POST test-numbers` |
| `DateHeureStatut` | DATETIME | ↙ | `updatedAt` renvoyé par Infobip |
| `DateHeureExpiration` | DATETIME | — | Ajout ou relance **+ 24 h**. Permet un compte à rebours |
| `NbRelances` | TINYINT | — | Nombre d'appels à `refresh` |
| `DateHeureDerniereRelance` | DATETIME | — | Dernière relance |
| `DateHeureDernierTest` | DATETIME | — | Dernier message de démonstration envoyé |

> ⚠️ **Aucun endpoint de suppression.** Le quota de 200 par agent ne redescend jamais.
> Sans gravité : une fois l'agent `LAUNCHED`, les testeurs ne servent plus à rien.
> ⚠️ **L'invitation arrive sur le téléphone**, pas par email, et **expire en 24 h**.
> Limites : 20 numéros par agent et par jour, 200 au total.

---

## 3. `rcs_agent_historique`

Journal du cycle de vie. Le parcours d'un agent **n'est pas linéaire**.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsAgentHistorique` | BIGINT auto | — | Clé technique |
| `IdRcsAgent` | INT | — | Agent concerné |
| `TypeEvenement` | ENUM (13 val.) | — | De `CREATION_LOCALE` à `DESACTIVATION` |
| `StatutAvant` / `StatutApres` | VARCHAR(30) | — | Transition observée |
| `CodePays` / `Operateur` | CHAR(2) / VARCHAR(50) | — | Si événement opérateur |
| `Detail` | TEXT | — | Motif de rejet, numéro concerné, message d'erreur |
| `Source` | ENUM | — | MARKETEAM / WEBHOOK / SYNCHRO |
| `DateHeureEvenement` | DATETIME | — | Horodatage |
| `UserCreation` | VARCHAR(35) | — | NULL si origine webhook |

> Sans cette table, seul l'état courant est conservé — impossible de répondre à
> « pourquoi ça traîne depuis six semaines ? ». Alimente la frise chronologique affichée
> au client.

---

## 4. `rcs_agent_operateur`

Cache du statut de lancement, opérateur par opérateur. Table optionnelle.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsAgentOperateur` | INT auto | — | Clé technique |
| `IdRcsAgent` | INT | — | Agent concerné |
| `CodePays` | CHAR(2) | ↙ | ISO 3166-1 alpha-2 (`FR`) |
| `Operateur` | VARCHAR(50) | ↙ | Nom de l'opérateur retourné par Infobip |
| `Statut` | ENUM | ↙ | PENDING / IN_PROGRESS / COMPLETED / REJECTED |
| `MotifRejet` | TEXT | ↙ | Raison du refus quand l'opérateur rejette l'agent |
| `DateHeureStatut` | DATETIME | ↙ | Date du dernier changement |

> Alimentée par `GET /rcs/1/senders/{senderName}/launch-status`.

---

## 5. `ope_rcs`

Les paramètres de la campagne. Frère de `ope_sms`, rattaché à `dos_operation` par clé primaire partagée.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcs` | INT | — | = `IdOperation` de `dos_operation` |
| `IdRcsModele` | INT | — | Modèle réutilisable (table à créer) |
| `IdRcsAgent` | INT | — | Agent utilisé → alimente `sender` dans le JSON |
| `TypeContenu` | ENUM | ↗ | `CARD` ou `CAROUSEL` |
| `EstRcsInteractif` | TINYINT(1) | — | Dérivé : présence d'un bouton vers landing page. Pilote le tunnel et la facturation |
| `Orientation` | ENUM | ↗ | `VERTICAL` (image au-dessus) ou `HORIZONTAL` (image sur le côté). CARD seulement |
| `Alignement` | ENUM | ↗ | Côté de l'image en horizontal. **Obligatoire même en vertical**, où il est sans effet |
| `LargeurCarte` | ENUM | ↗ | `SMALL` / `MEDIUM`. Carrousel seulement, s'applique à **toutes** les cartes. Figé sur MEDIUM |
| `ModeleVariable` | VARCHAR(400) | — | Définition des champs de fusion (repris de `ope_sms`) |
| `EstRcsPersonnalise` | TINYINT(1) | — | Campagne personnalisée → 1 entrée `messages` par destinataire |
| `CampaignReferenceId` | VARCHAR(50) | ↗ | Étiquette de campagne. Revient dans tous les webhooks et logs Infobip |
| `ValiditeDuree` | SMALLINT | ↗ | Durée avant abandon si non livré |
| `ValiditeUnite` | ENUM | ↗ | SECONDS / MINUTES / HOURS |
| `FenetreJours` | VARCHAR(60) | ↗ | Jours de livraison autorisés, séparés par virgules (`MONDAY,TUESDAY…`) |
| `FenetreHeureDebut` | TIME | ↗ | Ouverture du créneau. **⚠️ En UTC, pas en heure de Paris** |
| `FenetreHeureFin` | TIME | ↗ | Fermeture du créneau. **⚠️ En UTC** |
| `EstRepliSms` | TINYINT(1) | — | Active le bloc `smsFailover` |
| `RepliSmsFrom` | VARCHAR(11) | ↗ | Expéditeur du SMS de repli (11 car. max, norme SMS) |
| `RepliSmsMessage` | VARCHAR(1200) | ↗ | Texte du repli. **GSM-7, 160 car. max, 1 segment.** Doit contenir le lien en clair + STOP |
| `RepliSmsEstUnicode` | TINYINT(1) | — | Toujours 0 depuis la règle du segment unique |
| `RepliCreditSms` | VARCHAR(1000) | — | Calcul des crédits SMS (repris de `ope_sms`) |
| `RepliCreditSmsUnicode` | VARCHAR(1000) | — | Sans objet depuis la règle du segment unique |
| `DateFin` | DATE | — | Fin de l'opération, gestion Marketeam |
| `HeureFin` | TIME | — | Fin de l'opération, gestion Marketeam |
| `Cadence` | MEDIUMINT | ↗ | Débit d'envoi → alimente `sendingSpeedLimit` |
| `Paquet` | SMALLINT | ↗ | Taille de lot, calculée d'après la cadence |
| `Pause` | TINYINT | ↗ | Temporisation entre lots |

> **Pas de colonne « crédit RCS »** : un message Single compte pour 1, quels que soient sa
> longueur, son nombre de cartes ou de boutons.

---

## 6. `ope_rcs_carte`

Une carte simple, ou une carte du carrousel.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsCarte` | INT auto | — | Clé technique |
| `IdRcs` | INT | — | Opération de rattachement |
| `Ordre` | TINYINT | ↗ | Position dans le carrousel (1 à 10). Index **non unique** pour permettre les échanges |
| `Titre` | VARCHAR(400) | ↗ | **Gabarit.** Limite API 200 car. **après fusion**. Viser 40-60 en pratique |
| `Description` | VARCHAR(3000) | ↗ | **Gabarit.** Limite API 2000 car. après fusion. Viser 2-3 lignes |
| `MediaUrl` | VARCHAR(2048) | ↗ | URL publique HTTPS de l'image. Personnalisable par destinataire |
| `MediaContentType` | VARCHAR(50) | — | Type MIME. **Ne part pas dans le JSON** : pilote l'interface et la validation |
| `MediaHauteur` | ENUM | ↗ | SHORT 112 DP / MEDIUM 168 DP / TALL 264 DP. Figé sur MEDIUM |
| `MediaThumbnailUrl` | VARCHAR(2048) | ↗ | Vignette d'aperçu. **Vidéo uniquement** |
| `MediaLargeurPx` | SMALLINT | — | Contrôle d'homogénéité du ratio entre cartes |
| `MediaHauteurPx` | SMALLINT | — | Contrôle d'homogénéité du ratio entre cartes |

> **Règle d'homogénéité du carrousel** : la hauteur des premières cartes fixe celle de
> toutes. Les cartes plus longues sont **tronquées**, en commençant par la description.
> Harmoniser longueurs de texte, ratios d'image et nombre de boutons entre cartes.

---

## 7. `ope_rcs_carte_bouton`

Les boutons affichés **dans** la carte. 4 maximum, 1 ou 2 recommandés.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsCarteBouton` | INT auto | — | Clé technique. Sert aussi à générer le `PostbackData` |
| `IdRcsCarte` | INT | — | Carte de rattachement |
| `Ordre` | TINYINT | ↗ | Position dans la carte (1 à 4) |
| `TypeBouton` | ENUM | ↗ | `OPEN_URL` / `DIAL_PHONE` / `SHOW_LOCATION`. **REPLY et REQUEST_LOCATION interdits** (conversation facturée) |
| `EstBoutonInteractif` | TINYINT(1) | — | Bouton « Cliquez ici » vers landing page. CARD seulement, **1 seul par opération** |
| `IdLandingPage` | INT | — | Landing page associée |
| `Libelle` | VARCHAR(60) | ↗ | **Gabarit.** Limite API **25 car. après fusion**. Personnalisation déconseillée |
| `PostbackData` | VARCHAR(100) | ↗ | Étiquette invisible renvoyée au clic. **Seule source fiable du suivi de clics** |
| `Url` | VARCHAR(2048) | ↗ | Destination. Personnalisable par destinataire (suivi individuel) |
| `UrlApplication` | ENUM | ↗ | `BROWSER` (quitte la messagerie) ou `WEBVIEW` (fenêtre intégrée, plus fluide) |
| `UrlWebviewMode` | ENUM | ↗ | FULL / HALF / TALL. **Obligatoire si WEBVIEW** |
| `Telephone` | VARCHAR(20) | ↗ | Numéro appelé par `DIAL_PHONE`, format E.164 |
| `Latitude` | DECIMAL(9,6) | ↗ | `SHOW_LOCATION`. Précision ~10 cm |
| `Longitude` | DECIMAL(9,6) | ↗ | `SHOW_LOCATION` |
| `LibelleLieu` | VARCHAR(200) | ↗ | Nom du lieu affiché. 100 car. après fusion |

---

## 8. `rcs_envoi`

Une ligne par destinataire. Miroir de `sms_envoi`, enrichi du cycle de vie RCS.

### Identification et rattachement

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsEnvoi` | INT auto | — | Clé technique |
| `IdClient` / `IdContact` | INT | — | Client et contact destinataire |
| `IdOperation` / `TypeOperation` | INT / CHAR(3) | — | Campagne de rattachement |
| `IdFacture` / `TypeFacture` | INT / CHAR(3) | — | Facture de rattachement |
| `IdAbonnement` / `TypeAbonnement` | INT / CHAR(3) | — | Abonnement de rattachement |
| `Variable` | TEXT | — | Valeurs de personnalisation du destinataire |
| `CodeRcsType` | VARCHAR(16) | — | Nature de l'envoi (transposé de `CodeSmsType`) |
| `Portable` | CHAR(20) | ↗ | Numéro au format E.164 **sans `+` ni `00`** (`336…`) |

### Dates du cycle de vie

| Champ | Type | API | Rôle |
|---|---|---|---|
| `DateHeureDemande` | DATETIME | — | Création de la demande d'envoi |
| `DateHeureEnvoi` | DATETIME | — | Remise effective à Infobip |
| `DateHeureCapacite` | DATETIME | — | Date de la qualification RCS. **Périme vite** |
| `DateHeureStatut` | DATETIME | ↙ | `doneAt` du DLR — moment de la livraison ou de l'échec |
| `DateHeureLu` | DATETIME | ↙ | `seenAt` — **spécifique RCS**, impossible en SMS |

### Routage et facturation

| Champ | Type | API | Rôle |
|---|---|---|---|
| `CapaciteRcs` | ENUM | ↙ | `INCONNU` / `ENABLED` / `UNREACHABLE`. Résultat du capability check. **Alimente le devis** |
| `CanalUtilise` | ENUM | ↙ | `ATTENTE` → `RCS` ou `SMS`. **Colonne la plus importante : c'est elle qui porte la facturation réelle** |
| `TrafficType` | VARCHAR(20) | ↙ | Doit **toujours** valoir `SINGLE`. Autre valeur = sender mal configuré |
| `PrixUnitaire` | DECIMAL(10,5) | ↙ | Prix facturé par Infobip. Contrôle de marge |
| `Devise` | CHAR(3) | ↙ | Devise du prix |
| `MccMnc` | VARCHAR(10) | ↙ | Opérateur réel du destinataire (code pays + réseau) |

### Identifiants Infobip

| Champ | Type | API | Rôle |
|---|---|---|---|
| `BulkId` | VARCHAR(64) | ↙ | Identifiant du **lot** d'envoi |
| `MessageId` | VARCHAR(64) | ↗↙ | Identifiant du **message**. Imposé par Marketeam. **Clé de rapprochement des webhooks**, index UNIQUE |
| `CallbackData` | VARCHAR(200) | ↗↙ | Charge utile libre, revient dans tous les webhooks. Évite une jointure |

> **Trois niveaux d'identification** : `CampaignReferenceId` (campagne entière) →
> `BulkId` (lot) → `MessageId` (destinataire).

### Statut de livraison

| Champ | Type | API | Rôle |
|---|---|---|---|
| `StatutGroupeId` | TINYINT | ↙ | 1 PENDING / 2 UNDELIVERABLE / 3 DELIVERED / 4 EXPIRED / 5 REJECTED |
| `StatutGroupeNom` | VARCHAR(30) | ↙ | Libellé du groupe |
| `StatutId` | SMALLINT | ↙ | Code de statut détaillé |
| `StatutNom` | VARCHAR(50) | ↙ | Libellé détaillé (`PENDING_ACCEPTED`, `DELIVERED_TO_HANDSET`…) |
| `ErreurId` | SMALLINT | ↙ | Code d'erreur si échec |
| `ErreurNom` | VARCHAR(50) | ↙ | Libellé de l'erreur |
| `ErreurPermanente` | TINYINT(1) | ↙ | Si 1 : **ne pas retenter**, candidat liste noire |
| `NbTentatives` | TINYINT | — | Compteur de reprises Marketeam |

> `PENDING_ACCEPTED` en réponse HTTP signifie « accepté pour traitement », **pas livré**.
> La livraison réelle arrive plus tard par webhook.

---

## 9. `rcs_clic`

Un clic sur un bouton de carte, remonté par webhook. Le tracking de la landing page reste
sur les tables du SMS Interactif.

| Champ | Type | API | Rôle |
|---|---|---|---|
| `IdRcsClic` | BIGINT auto | — | Clé technique. BIGINT : table de volume |
| `IdRcsEnvoi` | INT | — | Envoi concerné |
| `IdOperation` | INT | — | Campagne, dénormalisé pour les rapports |
| `IdRcsCarte` | INT | — | Carte résolue depuis le `PostbackData`. **`ON DELETE SET NULL`** |
| `IdRcsCarteBouton` | INT | — | Bouton résolu depuis le `PostbackData`. **`ON DELETE SET NULL`** |
| `PostbackData` | VARCHAR(100) | ↙ | Valeur brute reçue. **Copie conservée** : survit à la modification du bouton |
| `LibelleBouton` | VARCHAR(60) | — | Libellé au moment du clic, historisé |
| `TypeBouton` | ENUM | — | Type au moment du clic, historisé |
| `DateHeureClic` | DATETIME | ↙ | `receivedAt` du webhook |
| `MessageIdEvenement` | VARCHAR(64) | ↙ | **Idempotence.** Index UNIQUE : évite de compter deux fois un webhook rejoué |

> **Pourquoi `SET NULL` et non CASCADE** : si le client modifie son carrousel après
> l'envoi, l'historique de clics doit survivre. D'où aussi la duplication du libellé.

---

## Les pièges à ne pas oublier

| # | Piège |
|---|---|
| 1 | `FenetreHeure*` est en **UTC**. 9 h Paris = 7 h UTC en été, 8 h en hiver. Conversion selon la date d'envoi |
| 2 | `PENDING_ACCEPTED` ≠ livré |
| 3 | Logs Infobip conservés **48 h** seulement |
| 4 | Webhooks **rejoués** → idempotence obligatoire, sinon rapports faussés en silence |
| 5 | `CapaciteRcs` **périme** → requalifier avant chaque campagne |
| 6 | Double imbrication `content.content` dans le JSON de carte |
| 7 | `alignment` obligatoire même en `VERTICAL` |
| 8 | Carrousel personnalisé : JSON 5 à 6× plus lourd → taille de lot **calculée**, pas figée |
| 9 | Troncature du carrousel non simulable dans l'aperçu → prévenir par indicateurs d'écart |
| 10 | Le sender RCS **n'est pas** le `LeFrom` du SMS |
| 11 | `SenderName` **immuable** : c'est la clé Infobip |
| 12 | `hostingRegion` et `billingCategory` **irréversibles** après création |
| 13 | Agent `READY_FOR_TESTING` → numéros de test uniquement |
| 14 | RCS Interactif → **mode personnalisé forcé** (URL unique par destinataire) |
| 15 | Emoji et caractères spéciaux comptent **2 à 4 caractères** dans les limites API |
| 16 | Le **« launch » n'est pas dans l'API** — chargé de compte Infobip obligatoire |
| 17 | **Plafond de 10 agents** par compte |
| 18 | Logo **224 × 224** et bannière **1440 × 448** : résolutions **exactes** |
| 19 | `description` d'agent : **100 caractères maximum** |
| 20 | Chaque contact d'agent exige un **`label`** de 25 car. — oubli = échec de création |
| 21 | Numéro : `+336…` pour les testeurs, `336…` **sans `+`** pour l'envoi |
| 22 | Invitation testeur sur le **téléphone**, expire en **24 h**, **non supprimable** |
| 23 | Webhooks d'agent : **abonnement explicite** requis, sinon rien n'arrive |

---

## Les limites à connaître par cœur

| Élément | Limite |
|---|---|
| Titre de carte | 200 caractères |
| Description | 2 000 caractères |
| Libellé de bouton | **25 caractères** |
| Boutons par carte | 4 (viser 1 à 2) |
| Cartes par carrousel | 2 à 10 |
| Repli SMS | **160 caractères GSM-7, 1 segment** (règle Marketeam) |
| Requête API | 10 Mo |
| Média | 100 Mo API — viser 1 à 2 Mo |
| Capability check asynchrone | 10 000 numéros |
| Capability check synchrone | 500 numéros, 1 à 10 recommandé |
| Agents par compte | **10** |
| Numéros de test | 20/agent/jour, **200 au total**, non supprimables |
| `senderName` | 3 à 40 car. |
| `displayName` d'agent | 40 caractères |
| `description` d'agent | **100 caractères** |
| Libellé de contact d'agent | 25 caractères |
