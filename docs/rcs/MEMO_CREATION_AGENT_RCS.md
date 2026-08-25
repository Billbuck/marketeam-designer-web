# Mémo — Création et cycle de vie d'un agent RCS

Procédure complète de bout en bout : création, tests, mise en service, suivi.
Source : spécification OpenAPI Infobip 3.210.0.

---

## 1. Ce qui est automatisable, ce qui ne l'est pas

| Étape | Automatisable par API ? |
|---|---|
| Créer l'agent | **Oui** — `POST /rcs/1/senders` |
| Modifier l'agent | **Oui** — tant qu'il n'est pas verrouillé |
| Ajouter des testeurs | **Oui** |
| Envoyer des messages de test | **Oui** |
| **Demander la mise en service** | **NON — passe par le chargé de compte Infobip** |
| Suivre l'avancement du lancement | **Oui** — webhook + endpoint |

C'est le point structurant : le workflow Marketeam sera **mixte**. Tout est automatisable
sauf le déclenchement du lancement.

---

## 2. Les deux plafonds à connaître

| Limite | Valeur |
|---|---|
| Agents par compte Infobip | **10 au total** |
| Numéros de test | 20 par agent et par jour, **200 au total** |

⚠️ Les 10 agents sont la contrainte structurante. Si le modèle est « un agent par
client », la plateforme est bloquée à 10 clients RCS. **À faire relever par le chargé de
compte avant de développer l'écran de gestion.**

⚠️ Le quota de 200 testeurs **ne redescend jamais** : aucun endpoint de suppression
n'existe. En pratique sans conséquence (5 à 10 testeurs suffisent), mais ne pas ouvrir
l'ajout de testeurs librement aux clients.

---

## 3. Créer l'agent

```
POST /rcs/1/senders
Authorization: App <clé>
```

### Les 12 champs obligatoires

| Champ | Contrainte | Colonne Marketeam |
|---|---|---|
| `senderName` | 3 à 40 car., alphanumériques + `_` et `-`, **au moins une lettre**. **Non modifiable** | `SenderName` |
| `billingCategory` | `NON_CONVERSATIONAL` | `CategorieFacturation` |
| `useCase` | OTP / TRANSACTIONAL / **PROMOTIONAL** / MULTI_USE | `CasUsage` |
| `hostingRegion` | **`EUROPE`** — irréversible | `RegionHebergement` |
| `brand.brandName` | 1 à 100 car. | `NomMarque` |
| `displayName` | 1 à **40** car. — nom vu sur le téléphone | `NomAffichage` |
| `description` | 1 à **100** car. — limite très basse | `Description` |
| `color` | Hex `#RRGGBB`, **contraste ≥ 4,5:1 sur blanc** | `Couleur` |
| `logoUrl` | JPG/PNG, **exactement 224 × 224 px**, ≤ 51 200 octets | `LogoUrl` |
| `bannerUrl` | JPG/PNG, **exactement 1440 × 448 px**, ≤ 204 800 octets | `BanniereUrl` |
| `privacy.url` | URL publique HTTP/HTTPS | `ConfidentialiteUrl` |
| `termsOfService.url` | URL publique HTTP/HTTPS | `CguUrl` |

### La contrainte croisée

Au moins **un** contact parmi `phones`, `emails`, `websites`.
Chacun n'accepte **qu'un seul élément** et exige un `label` obligatoire de **25 caractères
maximum**.

⚠️ Oublier le `label` fait échouer la création. C'est une erreur facile.

### Les résolutions d'image sont exactes

224 × 224 et 1440 × 448 ne sont **pas des maximums** : ce sont des dimensions imposées.
Le module de compression Marketeam doit produire précisément ces tailles.

### JSON de création — exemple France

```json
{
  "senderName": "MonEnseigne",
  "billingCategory": "NON_CONVERSATIONAL",
  "useCase": "PROMOTIONAL",
  "hostingRegion": "EUROPE",
  "brand": {
    "brandName": "Mon Enseigne SAS"
  },
  "displayName": "Mon Enseigne",
  "description": "Offres et informations de votre enseigne.",
  "color": "#0B78D0",
  "logoUrl": "https://cdn.marketeam.fr/agents/monenseigne/logo.png",
  "bannerUrl": "https://cdn.marketeam.fr/agents/monenseigne/banniere.jpg",
  "phones": [
    { "phoneNumber": "+33123456789", "label": "Service client" }
  ],
  "emails": [
    { "address": "contact@monenseigne.fr", "label": "Nous écrire" }
  ],
  "websites": [
    { "url": "https://www.monenseigne.fr", "label": "Site officiel" }
  ],
  "privacy": {
    "url": "https://www.monenseigne.fr/confidentialite",
    "label": "Confidentialité"
  },
  "termsOfService": {
    "url": "https://www.monenseigne.fr/cgu",
    "label": "Conditions"
  },
  "platform": {
    "applicationId": "marketeam-app",
    "entityId": "monenseigne-entity"
  }
}
```

Le bloc `platform` est facultatif, mais les identifiants doivent avoir été créés au
préalable côté Infobip. Ils restent **modifiables à tout moment**, contrairement au reste.

---

## 4. Les 8 statuts de l'agent

| Statut | Signification | Modifiable ? | Envoi possible ? |
|---|---|---|---|
| `BROUILLON_LOCAL` | **Statut Marketeam** — saisie en cours, pas encore envoyé | Oui | Non |
| `DRAFT` | Créé en brouillon depuis l'interface web Infobip | Oui | Non |
| `PENDING` | Création ou mise à jour en cours de traitement | Non | Non |
| `READY_FOR_TESTING` | Créé, déverrouillé, tests autorisés | Oui | **Testeurs APPROVED uniquement** |
| `PENDING_LAUNCH` | Lancement demandé. **Agent verrouillé** | **Non** | Non |
| `SENDER_UPDATE_REQUIRED` | Correction exigée après `PENDING_LAUNCH`. Déverrouillé | Oui | Non |
| `LAUNCHED_IN_PROGRESS` | Au moins un opérateur a validé | Non | **Oui** |
| `LAUNCHED_PARTIAL_SUCCESS` | Tous ont répondu, résultats mixtes | Non | **Oui** |
| `LAUNCHED` | Tous les opérateurs ont validé | Non | **Oui** |

### Le parcours réel

```
BROUILLON_LOCAL
      ↓  POST /rcs/1/senders
PENDING
      ↓
READY_FOR_TESTING  ←──────────────┐
      ↓  demande au chargé de compte │
PENDING_LAUNCH                     │ si TOUS les opérateurs rejettent
      ↓                            │
SENDER_UPDATE_REQUIRED ──┐         │
      ↓  correction       │         │
PENDING_LAUNCH ──────────┘         │
      ↓                            │
LAUNCHED_IN_PROGRESS ──────────────┘
      ↓
LAUNCHED
```

⚠️ **Le parcours n'est pas linéaire.** Plusieurs allers-retours possibles entre
`PENDING_LAUNCH` et `SENDER_UPDATE_REQUIRED`, sur plusieurs semaines. C'est la raison
d'être de la table `rcs_agent_historique`.

### `SENDER_UPDATE_REQUIRED` en détail

C'est le statut « il faut corriger avant de continuer ». Il survient **après**
`PENDING_LAUNCH` et **déverrouille** l'agent pour édition.

À ne pas confondre avec un rejet définitif : si **tous** les opérateurs rejettent,
l'agent retourne carrément en `READY_FOR_TESTING`.

**Causes probables, par fréquence :**

1. **Pages juridiques incomplètes** — de loin la première cause
2. Logo ou bannière non conformes aux résolutions exactes
3. Contraste de la couleur de marque insuffisant
4. Description ou nom d'affichage jugés trompeurs
5. Incohérence entre marque déclarée et site web

**Exemple de motif documenté par Infobip :** la politique de confidentialité doit
mentionner l'opt-out (« Text STOP to opt out »), la clause sur les frais de messagerie et
la fréquence d'envoi ; les conditions doivent préciser que les informations ne seront ni
vendues, ni louées, ni partagées.

**Prévention.** Fournir aux clients un **modèle de politique de confidentialité et de CGU**
intégrant d'emblée ces mentions. Économise des semaines par agent et devient un argument
de service.

---

## 5. Suivre le statut — trois mécanismes

### Webhook `RCS_SENDER_STATUS_UPDATE` — source principale

Toute opération sur un agent est traitée **de façon asynchrone**. L'événement arrive
quand c'est terminé.

```json
{
  "results": [
    {
      "event": "RCS_SENDER_STATUS_UPDATE",
      "senderName": "MonEnseigne",
      "senderStatus": "READY_FOR_TESTING",
      "googleAgentId": "monenseigne_axdawe0_agent",
      "updatedAt": "2026-08-21T16:38:24.000+0000",
      "platform": { "applicationId": "…", "entityId": "…" }
    }
  ]
}
```

Il livre aussi le `googleAgentId`, identifiant Google interne utile pour les échanges de
support. → colonne `rcs_agent.GoogleAgentId`.

### Webhook `RCS_SENDER_LAUNCH_STATUS_UPDATE` — avancement par opérateur

```json
{
  "results": [
    {
      "event": "RCS_SENDER_LAUNCH_STATUS_UPDATE",
      "senderName": "MonEnseigne",
      "senderStatus": "LAUNCHED_IN_PROGRESS",
      "coverage": [
        {
          "countryCode": "FR",
          "providers": [
            { "name": "ORANGE", "status": "COMPLETED", "updatedAt": "…" },
            { "name": "SFR", "status": "IN_PROGRESS", "updatedAt": "…" },
            { "name": "BOUYGUES", "status": "REJECTED",
              "rejectionReason": "Privacy policy needs opt-out…", "updatedAt": "…" }
          ]
        }
      ],
      "updatedAt": "…"
    }
  ]
}
```

→ alimente `rcs_agent_operateur`, une ligne par couple pays / opérateur.

⚠️ **Les deux webhooks exigent un abonnement explicite** au canal RCS avec le type
d'événement correspondant. Sans souscription, aucun événement n'est reçu.

### Endpoint de consultation

```
GET /rcs/1/senders/{senderName}/launch-status
```

Même contenu, en interrogation directe. Pour une resynchronisation ou un bouton
« Rafraîchir ». → alimente `rcs_agent.DateHeureSynchro`.

---

## 6. Les numéros de test

### Le principe

Un agent non lancé ne peut envoyer qu'à une liste blanche. Mais on ne peut pas inscrire
quelqu'un d'autorité : le propriétaire du téléphone doit **accepter**.

### Ajouter un testeur

```
POST /rcs/1/senders/{senderName}/test-numbers

{ "testNumber": "+33612345678", "primary": false }
```

Réponse **202** (accepté, pas fait) :

```json
{ "senderName": "MonEnseigne", "testNumber": "+33612345678", "status": "PENDING" }
```

Cet appel déclenche une **invitation directement sur le téléphone**, dans l'application
de messagerie du destinataire. Rien d'autre à faire : pas de code à transmettre, pas
d'email.

⚠️ **L'invitation arrive sur le téléphone, PAS par email.** À indiquer clairement dans
l'interface, sinon les testeurs attendront un mail qui ne viendra jamais.

### Les 4 statuts d'un testeur

| Statut | Signification |
|---|---|
| `PENDING` | Demande enregistrée, invitation en cours d'envoi |
| `WAITING_FOR_TESTER_ACCEPTANCE` | Invitation arrivée, pas encore de réponse |
| `APPROVED` | Accepté. **Le numéro peut recevoir des tests** |
| `EXPIRED` | Pas de réponse dans les 24 heures |

### Le délai de 24 heures

Le statut est rafraîchi automatiquement pendant 24 h après l'ajout. Sans acceptation, le
numéro passe en `EXPIRED`.

Relance possible — nouveau cycle de 24 h :

```
PUT /rcs/1/senders/{senderName}/test-numbers/{testNumber}/refresh
```

→ colonnes `DateHeureExpiration`, `NbRelances`, `DateHeureDerniereRelance`.

### Consulter — deux endpoints, une nuance

```
GET /rcs/1/senders/{senderName}/test-numbers?page=0&size=20
```

⚠️ Les statuts renvoyés par la **liste** correspondent au dernier moment de mise à jour,
pas forcément à l'état actuel.

```
GET /rcs/1/senders/{senderName}/test-numbers/{testNumber}
```

Le **détail** vérifie en temps réel. → à brancher sur un bouton « Vérifier maintenant ».

### Le drapeau `primary`

Règle particulière : un numéro ne peut être principal que pour **un seul agent**, mais un
agent peut avoir **plusieurs** numéros principaux.

Conséquence : marquer un numéro comme principal pour l'agent B lui retire automatiquement
ce statut chez l'agent A.

```
PATCH /rcs/1/senders/{senderName}/test-numbers/{testNumber}
{ "primary": true }
```

### Pas de suppression

Aucun endpoint `DELETE`. Un numéro ajouté reste. Ne pas prévoir de bouton « Supprimer » :
au mieux un masquage local.

**Sans gravité en pratique** : une fois l'agent `LAUNCHED`, les numéros de test ne servent
plus à rien — le filtre disparaît, tout le monde reçoit. Le quota repart à zéro pour
chaque nouvel agent.

---

## 7. Envoyer un message de test

**Il n'existe pas d'endpoint de test.** On utilise exactement le même appel qu'en
production :

```
POST /rcs/2/messages
```

C'est le **statut de l'agent** qui fait office de filtre :

| Statut de l'agent | Comportement |
|---|---|
| `READY_FOR_TESTING` | Seuls les numéros `APPROVED` reçoivent, les autres sont rejetés |
| `LAUNCHED*` | Tout le monde reçoit |

⚠️ **Format du numéro différent selon l'endpoint** :

| Usage | Format |
|---|---|
| Gestion des testeurs | `+33612345678` (avec `+`) |
| Envoi de message | `33612345678` (**sans `+`**) |

Normaliser dans le code — c'est une source de perte de temps classique.

### Contrôles avant d'envoyer

1. L'agent est en `READY_FOR_TESTING` ou mieux
2. Le numéro est en `APPROVED`
3. Le média est accessible **publiquement en HTTPS** — cause d'échec la plus fréquente
   en recette

---

## 8. Le bouton « Tester mon agent » — spécification Marketeam

**Principe retenu :** un message de démonstration **standard**, généré automatiquement
par Marketeam à partir de la fiche de l'agent. Le client n'a rien à composer.

**Activation :** dès que l'agent est en `READY_FOR_TESTING` et qu'au moins un testeur est
en `APPROVED`.

**Contenu généré automatiquement :**

- Format `CARD`, orientation `VERTICAL`
- Image : visuel généré à la volée depuis `LogoUrl` centré sur un fond `Couleur`
  (le logo brut fait 224 × 224, donc carré — mal adapté au ratio 3:2 d'une carte)
- Titre : « Votre agent {NomAffichage} est actif »
- Description : explication que ce rendu est celui que verront les destinataires
- Un bouton `OPEN_URL` vers `SiteWebUrl`, avec un `postbackData` dédié

L'intérêt du bouton est de **valider la boucle complète** — envoi, livraison, lecture,
clic — sans qu'aucun contenu client n'existe encore.

**Destinataires :** tous les testeurs `APPROVED` par défaut, avec liste à cases cochées
pour permettre de cibler.

**Traçabilité :** enregistrer dans `rcs_envoi` avec un `CodeRcsType` dédié
(ex. `TESTAGENT`), **exclu des statistiques de campagne et de la facturation client**.
→ colonne `rcs_agent_testeur.DateHeureDernierTest`.

**Comportement selon le statut :** sur un agent `READY_FOR_TESTING`, le bouton vise les
numéros `APPROVED`. Sur un agent `LAUNCHED`, il vise n'importe quel numéro saisi. Même
bouton, comportement adapté — les équipes n'ont pas à comprendre la mécanique.

---

## 9. Ce qu'il faut vérifier pendant la recette

C'est la fenêtre qui ne se rouvre pas. À tester **sur iPhone ET Android en parallèle** :

- [ ] Nom et logo de l'agent corrects en haut de la conversation
- [ ] Image recadrée sans perte d'éléments importants sur les bords
- [ ] Libellé de bouton tenant sur une ligne
- [ ] En carrousel : cartes de hauteur homogène, pas de troncature
- [ ] **Sur iPhone avec taille de police agrandie** (réglages d'accessibilité,
      +2 ou 3 crans) : que reste-t-il de la description ? C'est le scénario qui casse
      le plus souvent les cartes
- [ ] Le clic sur le bouton remonte bien dans les webhooks
- [ ] Le DLR arrive avec un statut du groupe `DELIVERED`

Brancher les webhooks **dès la recette**, pas après : autant valider cette partie de la
chaîne avant la production.

---

## 10. Écrans à prévoir dans Marketeam

### Écran « Agents »

- Liste avec statut, code couleur, client ou marque propriétaire
- Création : formulaire des 12 champs obligatoires + contrôles de conformité
- Champs en lecture seule si `EstVerrouille` (colonne générée)
- Alerte visuelle forte si `SENDER_UPDATE_REQUIRED`, avec affichage du `MotifCorrection`
- Frise chronologique depuis `rcs_agent_historique`
- Bouton « Rafraîchir » → `GET /launch-status`
- Bascule `EstActif` (décision Marketeam, distincte du statut Infobip)

### Écran « Testeurs » (par agent)

- Ajout d'un numéro avec libellé et type d'appareil
- Statut avec code couleur, `EXPIRED` en évidence
- Compte à rebours depuis `DateHeureExpiration`
- Bouton « Relancer » sur les expirés
- Bouton « Vérifier maintenant » → endpoint de détail
- **Alerte si aucun testeur iPhone validé**
- **Alerte si aucun testeur `APPROVED`** : la recette est impossible
- Pas de bouton « Supprimer » (endpoint inexistant)

### Écran « Couverture » (par agent)

- Tableau pays / opérateur / statut depuis `rcs_agent_operateur`
- Affichage du `MotifRejet` en clair sur les lignes `REJECTED`

---

## 11. Notification obligatoire

Le passage en `SENDER_UPDATE_REQUIRED` est **le seul moment où une action est attendue**,
et où le délai de mise en service — déjà long — continue de courir.

Personne ne consulte spontanément un écran de suivi d'agent. **Prévenir activement** :
email au contact client et alerte dans la plateforme.

Dès réception du webhook de statut, appeler `launch-status` pour récupérer le
`rejectionReason` par opérateur et le présenter en clair au client.

---

## 12. Récapitulatif des pièges

| # | Piège |
|---|---|
| 1 | Le « launch » n'est **pas dans l'API** — chargé de compte obligatoire |
| 2 | Plafond de **10 agents** par compte |
| 3 | `hostingRegion` et `billingCategory` **irréversibles** |
| 4 | `senderName` **immuable** — c'est la clé Infobip |
| 5 | Logo 224 × 224 et bannière 1440 × 448 : résolutions **exactes** |
| 6 | `description` : **100 caractères maximum** |
| 7 | Chaque contact exige un **`label`** de 25 car. max |
| 8 | Contraste couleur **≥ 4,5:1 sur blanc** |
| 9 | Pages juridiques : **première cause de rejet** |
| 10 | Invitation testeur sur le **téléphone**, expire en **24 h** |
| 11 | **Aucune suppression** de numéro de test possible |
| 12 | Format du numéro : `+336…` pour les testeurs, `336…` pour l'envoi |
| 13 | Webhooks d'agent : **abonnement explicite** requis |
| 14 | Parcours **non linéaire** — d'où la table d'historique |
| 15 | Liste des testeurs : statuts potentiellement périmés, utiliser le détail |
