# Marketeam — Paiement Paybox : passation pour l'assistant de développement

> Document rédigé le 17/07/2026 à l'issue d'une journée de mise au point du paiement CB en production.
> Destinataire : assistant de développement (Cursor) travaillant sur les sources WLangage du dépôt `\webdev\Paiement sécurisé\`.
> Réponds toujours en français. Michel (le développeur) n'est pas expert monétique : accompagne chaque livraison d'une explication courte et pédagogique, sans jargon inutile.

---

## 1. Contexte projet

- Plateforme SaaS **Marketeam** développée en **WebDev (WLangage)**, hébergée sur serveur Windows/Apache 2.4, base **MariaDB** `marketeam` (serveur Debian).
- Le paiement repose sur le composant WebDev **« PaiementSécurisé »** de PC SOFT, fortement adapté au projet (collection `COL_PAIEMENTSECURISE`). Ne jamais supposer que le composant est identique à la version PC SOFT d'origine.
- PSP : **Paybox / Verifone**. Contrat de production : SITE `3736310`, RANG `01`, identifiant `106525242`, acquéreur Société Générale. Options actives sur le contrat : **PPPS+ (Paybox Direct Plus)** et Saisie manuelle. Le mot de passe des appels PPPS (paramètre `CLE`) est stocké en base dans `marketeam.prm_parametre` (clés `Paybox_Prod_Site`, `Paybox_Prod_Rang`, `Paybox_Prod_Identifiant_Site`, `Paybox_Prod_Cle`). **Ne jamais écrire cette clé en dur ni la logger.** (Un renouvellement de cette clé auprès du support Verifone est prévu par Michel.)
- Le front de paiement est un **modèle de champ `mldcPaiement`** réutilisé dans plusieurs pages selon le contexte (paiement d'une opération, d'un abonnement, de la réserve d'argent, etc.). Capture d'écran de référence : `Page_pgePaiement_utilisant_le_modèle_de_champ_mldcPaiement.jpg`. Champs notables : `saiCarteNumero`, `saiCarteCode` (CVV), `cboCarteMois`/`cboCarteAnnée`, `saiCarteBancairePorteur`, `saiCarteBancaireLibelle`, `intCarteMémoriser` (case « Mémoriser la carte en 1 clic »), `intCarteParDefaut`, `cboCarteBancaire` (liste des cartes enregistrées), boutons `btnCarteBanca…`, `btnNouvelleCa…`.
- Arborescence du dépôt :
  - `\webdev\Paiement sécurisé\mdlcPaiement\` : procédures serveur du modèle de champ
  - `\webdev\Paiement sécurisé\mdlcPaiement\Procédures Navigateur\` : procédures navigateur
  - `\webdev\Paiement sécurisé\mdlcPaiement\Code des boutons\` : code des boutons
  - `\webdev\Paiement sécurisé\pgePaiement\` : procédures de la page pgePaiement (tunnel de commande)
- Méthode de travail : Cursor produit du code WLangage complet, procédure par procédure ; Michel recopie dans l'IDE WebDev, compile, déploie, puis **teste en production réelle avec des paiements de 10 € annulés ensuite dans le back-office Vision** (procédure rodée). Livrer petit, tester, itérer.

## 2. Flux de paiement carte actuel (référence, validé en production)

1. Clic « Payer par carte » → `PaiementCarteBancaire()` (code des boutons) : configure l'objet `_psPaybox` (identifiants depuis `prm_parametre`, `Mode3DS=Vrai` pour une nouvelle carte, `VerifieSignaturePaybox=Vrai`, URLs de retour `PageRetour3DSecure` et `PageRetourServeurÀServeur`), puis `Paiement_Direct(...)`.
2. Vérification d'identité 3-D Secure v2 via **RemoteMPI** : POST vers `https://tpeweb.paybox.com/cgi/RemoteMPI.cgi` avec `IdMerchant, IdSession, Amount, Currency, CCNumber, CCExpDate, CVVCode, URLRetour, URLHttpDirect`.
3. Deux retours arrivent (ordre non garanti, quasi simultanés) :
   - **Retour navigateur** (POST, `act=ps_retour3DS`) → `OnRetourPaiement(URL_RETOUR3DS)` → `OnRetourPaiementPayBoxDirecte3DSecure` : si `StatusPBX = "Autorisation à faire"`, pause de 2 s (`Multitâche(-200)`) puis débit via **PPPS** `https://ppps.paybox.com/PPPS.php` (`VERSION=00104`, `TYPE=00003`, montant, carte, **`ID3D`** issu du RemoteMPI).
   - **Retour serveur-à-serveur** (GET, `act=ps_s2s3DS`) → `OnRetourPaiement(URL_S2S3DS)` → branche dédiée : vérification de la signature Paybox + accusé de réception `"Retour S2S fait"`, **rien d'autre** (pas de marquage, pas de redirection).
4. États de `marketeam.clt_transaction.Etat` observés : `1` = en cours, `200` = validé, `500` = abandon/refus.

## 3. Travaux réalisés le 17/07/2026 — VALIDÉS EN PRODUCTION, NE PAS MODIFIER

| # | Fichier / objet | Correctif | Pourquoi |
|---|---|---|---|
| 1 | `OnRetourPaiementPayBoxDirecte3DSecure` | Ligne `FormulaireParamètreAjoute("ID3D", ParametresReçus["ID3D"])` **activée** ; les 8 anciens paramètres 3DS v1 (`3DSTATUS`…`3DSIGNVAL`) **commentés** | Sans ID3D, la banque refusait (code 00112 « transaction invalide ») : le débit n'était pas relié à l'authentification 3DS |
| 2 | `OnRetourPaiementPayBoxDirecte3DSecure` | `Multitâche(-200)` (pause 2 s) juste avant `PaiementPayBox_Direct(...)` | Paybox a besoin d'un instant pour finaliser le contexte 3DS ; sans pause, refus aléatoires 00017 « Statut PARes 3DS invalide » |
| 3 | `OnRetourPaiementPayBox` | Réécriture de la vérification de signature : sur les retours 3DS (paramètre **`Check`**, pas `sign`), la signature RSA‑SHA1 se vérifie sur la **chaîne brute `QUERY_STRING` URL‑décodée, de `IdSession=` jusqu'avant `&Check=`** (sans les paramètres propres `act/secid/fpay`), signature décodée en **Base64 standard** (pas BASE64URL), via `CertificatVérifieChaîne(..., certSignatureSeule+certSHA160)` avec la clé publique officielle Paybox (`paybox_pubkey.pem`, 1024 bits, inchangée depuis 2014, chemin `C:\Sites\Data\Marketeam\`) | La signature échouait systématiquement (mauvais nom de paramètre, Check laissé dans les données, mauvais décodage). Recette validée hors‑ligne par OpenSSL sur transactions réelles |
| 4 | `OnRetourPaiementPayBox` | Si `Check` présent : **aucune analyse de code erreur** (bloc « paiement OK ? » sauté) | Supprimait le faux « code erreur de retour <> inattendue » et le marquage REFUSÉ à tort |
| 5 | `OnRetourPaiement` (cas `:Fournisseur = PayBox`) | Nouvelle branche en tête : si `sAction = URL_S2S3DS` → vérification signature (via `OnRetourPaiementPayBox` sur variables locales), `XERREUR` si falsifié, accusé `AfficheUneChaine("Retour S2S fait","text/plain")`, `renvoyer Vrai` | Avant, cette notification empruntait la sortie navigateur (`ScriptAffichePOST`), corrompait le jeton de session WebDev et laissait des paiements pourtant débités bloqués à l'état 1 |
| 6 | Bloc `ServeurBanqueAdresseAjoute` (cas PayBox) | Liste IP à jour : `62.161.15.193`, `62.161.13.193`, `195.25.67.22` (ancienne, bientôt supprimée), `194.2.122.190` (ancienne). Supprimées : `195.101.99.76`, `194.2.122.158`, `195.25.7.166` | Renouvellement des plateformes Verifone (bandeau back-office Vision) |
| 7 | EVENT MariaDB `marketeam.nettoyage_transactions` (horaire) | Etat 1 depuis > 1 h → 500 ; purge de `clt_transaction.ObjetPaiement` pour Etat ≠ 1 depuis > 24 h | Transactions fantômes (client disparu) + pansement PCI |
| 8 | Traces temporaires | Lignes `XTRACE("BRUT = " + ValeurEnvironnement("QUERY_STRING",...))` dans les deux procédures de retour | Peuvent rester ; ne jamais y tracer de numéro de carte/CVV |

Validation : 6 paiements consécutifs OK (signature vérifiée à chaque fois), parcours abandon OK, parcours « client fantôme » OK.

## 4. Failles restantes identifiées (objet du chantier)

- **F1 — Sérialisation de l'objet paiement** : `clt_transaction.ObjetPaiement` contient la sérialisation complète de l'objet, **y compris `CCNumber`, `CCExpDate`, `CVVCode` lisibles** (dump hexa). La purge à 24 h est un pansement : le correctif attendu est de **ne plus jamais sérialiser ces champs** (vider `CarteNuméro`, `CarteCVV`, `CarteDateExpiration`, `m_sCarte_Temps3DS` sitôt utilisés / avant `MiseajourObjetTransaction`). Critère de recette : un dump hexa d'`ObjetPaiement` ne doit plus contenir ni PAN ni CVV.
- **F2 — Table `marketeam.clt_carte_bancaire`** (structure ci-dessous) : la colonne `Cvv` (varbinary chiffré via `CarteBancaireEncrypte`) est **interdite par PCI‑DSS même chiffrée** → à ne plus alimenter puis à supprimer. La colonne `Token` contient très probablement le **PAN chiffré** (à confirmer en lisant le code appelant `CarteBancaireEncrypte`) → elle devra contenir le **jeton Paybox**. Colonnes saines pour l'affichage : `Libelle`, `Porteur`, `Marque`, `CodeEmetteur` (8 premiers chiffres), `CodeAuthenticite` (4 derniers), `DateExpiration`, `EstActif`, `EstDefaut`.

```
IdCarteBancaire (PK), IdClient, IdContact, Libelle, Porteur, CodeEmetteur, CodeAuthenticite,
Origine, Marque, Banque, Pays, Monnaie, DateExpiration (date), Token (varbinary 50),
DateExp (varbinary 50), Refabo (varbinary 50), Cvv (varbinary 50), EstActif, EstDefaut, DateHeureCreation
```

- **F3 — Paiement par carte enregistrée** (branche `IdCarteBancaire > 0` de `PaiementCarteBancaire()`) : aujourd'hui `Mode3DS = Faux`, CVV déchiffré depuis la base et renvoyé, activité « récurrent » même pour un clic client. Non conforme DSP2 : à refondre entièrement (voir §5).

**Première action du chantier : exécuter `SELECT COUNT(*) FROM marketeam.clt_carte_bancaire;`** — la production vient d'ouvrir, il n'y a probablement que des cartes de test. Si c'est le cas, la migration se réduit à une purge + `ALTER TABLE`. Sinon, les PAN existants ne pouvant pas être convertis en jetons sans rejouer un paiement, prévoir un ré-enregistrement par les clients.

## 5. Chantier « carte enregistrée » — cible : tokenisation Paybox Direct Plus

Principe : **plus aucun numéro de carte ni CVV stocké côté Marketeam**. Paybox conserve la carte et fournit un **jeton** (`PORTEUR`) utilisable pour les paiements suivants. L'option PPPS+ du contrat le permet.

### 5.1 Rappels API PPPS (toujours `VERSION=00104`)

- Types d'opération : `00001` auth seule · `00002` capture · `00003` auth+capture · `00004` crédit · `00005` annulation · `00051` auth seule **abonné** · `00052` débit **abonné** · `00053` auth+capture **abonné** · `00054` crédit abonné · `00055` annulation abonné · **`00056` inscription abonné** · `00057` modification abonné · **`00058` suppression abonné** · `00061` forçage abonné.
- **00056 (inscription)** : mêmes champs qu'une autorisation (`PORTEUR`=PAN, `DATEVAL`=MMAA, `CVV`, `MONTANT`, `DEVISE=978`, `REFERENCE`, `NUMQUESTION`, `DATEQ`, `ACTIVITE`) + **`REFABONNE` unique** (référence côté commerçant, ex. identifiant client + horodatage — le composant génère déjà `ReferenceAbonne`). Paybox fait une **autorisation seule** (sans débit), contrôle la carte, puis inscrit. **La réponse contient `PORTEUR` = le jeton** (ex. officiel : `PORTEUR=SLDLrcsLMPC`).
- **Paiement sur abonné (00051/00052/00053)** : `PORTEUR` = **jeton** (à la place du PAN) + `DATEVAL` + `REFABONNE`. **CVV non requis** (obligatoire seulement pour les types 1, 3, 4, 12).
- **Capture après une autorisation seule** (00001/00051/00056) : `TYPE=00002` avec `REFABONNE` + `NUMTRANS` + `NUMAPPEL` (pas le jeton) ; recommandation officielle : attendre quelques secondes et viser la même plateforme (`ppps.paybox.com`).
- `NUMQUESTION` : unique par jour (le composant utilise l'IdTransaction). `ACTIVITE` : utiliser les constantes existantes du composant (`PAYBOX_ACTIVITE_INTERNET` pour un client présent, `PAYBOX_ACTIVITE_RECURRENT` pour un prélèvement automatique).

### 5.2 Parcours A — Enregistrement d'une carte (case « Mémoriser » cochée)

Flux recommandé : vérification 3DS RemoteMPI (comme aujourd'hui) → **`00056` avec `ID3D`** (autorisation + inscription) → **capture `00002`** (REFABONNE + NUMTRANS + NUMAPPEL, après ~3 s). Le client paie donc sa commande ET sa carte est tokenisée en une seule autorisation.
**Point à valider au premier test réel** : l'acceptation du paramètre `ID3D` sur un `00056`. Si refus, repli : paiement classique `00003+ID3D`, puis `00056` séparé dans la foulée (petite autorisation supplémentaire, acceptable).
Stockage en base : `Token` = jeton chiffré (`CarteBancaireEncrypte`), `DateExp` = MMAA chiffré (nécessaire aux appels), `Refabo`, `CodeAuthenticite` (4 derniers), `CodeEmetteur`, `Libelle`, `Marque`, `EstDefaut`. **`Cvv` : ne plus jamais alimenter.**

### 5.3 Parcours B — Paiement 1-clic (client présent, CIT)

Version 1 : `00053` avec jeton, sans CVV, `ACTIVITE` internet. Position Verifone (DSP2) : les transactions sur abonnés peuvent bénéficier d'un cas d'exemption d'authentification — **à vérifier en test réel** avec la carte de Michel. Si la banque refuse en exigeant une authentification (refus 001xx), prévoir un repli « veuillez ressaisir votre carte » avec parcours 3DS complet, et poser au support Verifone (`support-paybox@verifone.com`) la question : « RemoteMPI accepte-t-il le jeton Direct Plus dans `CCNumber` pour authentifier un porteur sur carte enregistrée ? » (non documenté dans le manuel RemoteMPI v8.0).

### 5.4 Parcours C — Prélèvement automatique de fin de mois (MIT : factures, abonnements)

`00053` (ou `00051` puis `00002`) avec jeton, `ACTIVITE` récurrent, **sans CVV ni 3DS** — c'est le régime « marchand à l'initiative », adossé au paiement initial authentifié du parcours A. À prévoir : traitement planifié des échéances, `NUMQUESTION` uniques, gestion des refus (nouvel essai, notification au client, désactivation de l'échéance après N échecs).

### 5.5 Parcours D — Gestion des cartes par le client

Suppression d'une carte → appel `00058` (REFABONNE) + `EstActif=0` (ou DELETE). Carte expirée → signaler au client. Carte par défaut → `EstDefaut` (mécanisme existant dans l'UI).

### 5.6 Migration base

Après COUNT (§4) : purge des lignes obsolètes, `ALTER TABLE clt_carte_bancaire DROP COLUMN Cvv;` (une fois le code déployé qui ne la lit plus). `Token` en varbinary(50) suffit pour un jeton ≤ 19 caractères chiffré.

## 6. Règles impératives pour toute modification

1. **Ne pas modifier** les correctifs du §3 (validés en production).
2. WLangage français, style du composant respecté (`XTRACE`/`XERREUR`, `COL_PAIEMENTSECURISE.ParametresReçus`, `FormulaireParamètreAjoute`, `Décrypte`/`CarteBancaireEncrypte`…). Code livré complet, prêt à coller, sans nouvelle dépendance.
3. **Jamais** de PAN ni de CVV dans : les logs (XTRACE/XERREUR), la sérialisation (`ObjetPaiement`), la base, les commentaires. Affichage = marque + 4 derniers chiffres.
4. Une étape = une procédure ou un petit lot cohérent, avec sa recette de test (paiement 10 € réel + vérification Vision + logs + états en base).
5. Les identifiants Paybox viennent toujours de `prm_parametre` ; la clé `CLE` ne doit apparaître dans aucun fichier.
6. En cas de doute sur un comportement Paybox non documenté : proposer un test à 10 € plutôt que supposer.

## 7. Hors périmètre immédiat (ne pas traiter sans demande explicite)

- **PayPal** : chantier suivant, après la carte enregistrée.
- Renouvellement de la clé PPPS (action manuelle de Michel auprès du support Verifone) et remplacement de sa carte de test personnelle.
- Les autres moyens de paiement du `mldcPaiement` (réserve d'argent, prélèvement SEPA, virement, chèque) : inchangés.

## 8. Références documentaires

- Opérations de caisse Direct Plus (00051→00061, jeton) : https://www.paybox.com/espace-integrateur-documentation/les-solutions-paybox-direct-et-paybox-direct-plus/les-operations-de-caisse-direct-plus/
- Dictionnaire des données Paybox Direct / Direct Plus : https://www.paybox.com/espace-integrateur-documentation/dictionnaire-des-donnees/paybox-direct-et-direct-plus/
- 3-D Secure avec Paybox Direct (contexte ID3D) : https://www.paybox.com/espace-integrateur-documentation/les-solutions-paybox-direct-et-paybox-direct-plus/3d-secure/
- Manuel RemoteMPI v8.0 (PDF) : https://www1.paybox.com/wp-content/uploads/2017/08/ManuelIntegrationVerifone_RemoteMPI_V8.0_FR.pdf
- Manuel DSP2 / 3DSv2 v2.0 (PDF) : https://www.paybox.com/wp-content/uploads/2022/10/ManuelIntegrationPaybox_DSP2_FR-v2.0.pdf
- Manuel Paybox Direct v8.3 (PDF) : https://www.paybox.com/wp-content/uploads/2022/11/ManuelIntegrationVerifone_PayboxDirect_V8.3_FR.pdf
- Clé publique Paybox (signature) : http://www1.paybox.com/wp-content/uploads/2014/03/pubkey.pem
