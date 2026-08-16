# Synthèse consommation — Notifications (puis Webservices)

Cadrage d’interface pour `pgeConsoNotification` (et, ensuite, `pgeConsoWebservice`).

**Modèle à recopier :** la page existante **« Ma consommation »** (consommation des opérations).  
On **n’utilise plus** les 3 cartes / blocs côte à côte.

Le détail ligne à ligne n’apparaît **pas** à l’écran : il part dans un **Excel** via le webservice, grâce à une **colonne Export** sur chaque ligne de type.

---

## 1. Principes

### 1.1 Une seule présentation pour les 3 pages de conso
| Page | Contenu des lignes |
|------|-------------------|
| Ma consommation (opérations) | Déjà en place (référence visuelle) |
| Notifications | SMS / VMS / Email |
| Webservices | SMS webservice d’abord, autres supports plus tard |

Même bandeau, même tableau, même ligne Total.

### 1.2 Plus de filtre Type, ajout d'un filtre Contact
Le filtre Type servait à alléger les longues listes. Les listes disparaissent.  
Filtres conservés : **Année / Mois / Société / Contact**.

Le filtre **Contact** (combo `cboContact`) liste les contacts
(`clt_contact`, via la colonne `IdContact` des tables `ope_*`) ayant réellement
consommé sur la sélection, avec « < Tous > » par défaut.

### 1.3 Une ligne = un type, pas un envoi
Le tableau affiche **uniquement les types qui ont de la consommation** sur la sélection (comme « Ma consommation »).  
Pas de ligne à 0.

### 1.4 Périmètre des chiffres
Tous les chiffres suivent les filtres de la page :
- Année (obligatoire)
- Mois (0 = toute l’année)
- Société (0 = toutes les sociétés du périmètre client)
- Contact (0 = tous les contacts)

---

## 2. Bandeau haut (identique à « Ma consommation »)

À gauche / centre :
- Titre de page (ex. « Notifications » / « Webservices »)
- Combo **Année**
- Combo **Mois**
- Combo **Société**
- Combo **Contact** (« < Tous > » par défaut)

À droite, sous « Total sur la période » :
- **Payé** (couleur positive / bleue)
- **Impayé** (rouge)
- **Total** (Payé + Impayé)

Pas de bouton Excel dans le bandeau : l’export est **par ligne** (voir §4).

---

## 3. Tableau de synthèse

Reprendre la structure de « Ma consommation » : en-têtes groupés **Opération** | **Montant**, plus une colonne **Export**.

| Colonne | Libellé | Contenu | Alignement |
|---------|---------|---------|------------|
| Icône | (sans titre) | Icône du type (mêmes icônes Marketeam) | Centre |
| Type | Type | Libellé métier (`Partage.LibelleTypeProjet`) | Gauche |
| Nombre | Nombre | Nombre d’envois / d’enregistrements | Droite |
| Quantité | Quantité | Unités facturées | Droite |
| Montant HT | Montant HT | Somme HT | Droite |
| Montant TTC | Montant TTC | Somme TTC | Droite |
| Reste à payer | Reste à payer | Somme TTC des lignes non payées | Droite |
| Export | (icône / sans titre) | Bouton d’export Excel **de ce type seulement** | Centre |

### 3.1 Ligne Total (en bas)
Comme « Ma consommation » :
- Icône logo Marketeam
- Libellé `Total`
- Somme de Nombre, Quantité, HT, TTC, Reste à payer
- Couleur bleue comme l’existant
- **Pas de bouton Export** sur cette ligne

### 3.2 Contrôle de cohérence
Par ligne : `Reste à payer ≤ Montant TTC`  
Bandeau : `Payé + Impayé = Total`  
Bandeau Impayé = somme des « Reste à payer » des lignes  
Bandeau Total = somme des Montant TTC des lignes  
Bandeau Payé = Total − Impayé

---

## 4. Colonne Export

Un bouton **par ligne de type** (pas sur le Total).

| Clic sur | Fichier Excel |
|----------|----------------|
| Ligne SMS | Détail des SMS de la sélection |
| Ligne VMS | Détail des VMS de la sélection |
| Ligne Email | Détail des emails de la sélection |

Périmètre = **filtres de la page** (Année / Mois / Société / Contact) + **le type de la ligne**.

Pas d’export « tout en un » pour commencer.

Si une ligne n’a rien à exporter (ne devrait pas arriver : la ligne n’existe que s’il y a de la conso) : ne pas afficher le bouton, ou message d’information.

---

## 5. Contenu de l’Excel (inchangé)

Maximum d’informations utiles, **sans n° d’enregistrement interne**.

Colonnes prévues (à adapter selon le type) :
- Société
- Destinataire
- Jour
- Date
- Heure
- Type de support
- Message (voir règle ci-dessous)
- Objet (email, si disponible)
- Nombre / quantité facturée
- Montant HT, taux TVA, Montant TTC
- Payé / Impayé
- Reste à payer

### Règle « Message »
| Type | Dans la cellule Excel |
|------|------------------------|
| SMS | Texte du SMS |
| VMS | Lien URL vers le fichier audio |
| Email | Lien URL vers la page d’aperçu du mail |

Une **feuille** suffit (un fichier = un type, puisque l’export est par ligne).

---

## 6. Lignes Notifications (`pgeConsoNotification`)

Ordre si plusieurs types présents : **SMS**, puis **VMS**, puis **Email**.

### 6.1 Notification SMS
- **Code :** `__OPERATION_SMS_NOTIFICATION__`
- **Nombre :** nombre d’enregistrements (envois)
- **Quantité :** somme de `NbrSmsFacture` (peut être > Nombre)

### 6.2 Message vocal (VMS)
- **Code :** `__OPERATION_VMS_UNITAIRE__`
- **Nombre :** nombre de VMS
- **Quantité :** = Nombre (1 VMS = 1 unité)

### 6.3 Notification Email
- **Code :** `__OPERATION_EMAIL_NOTIFICATION__`
- **Nombre :** nombre d’emails
- **Quantité :** = Nombre (1 email = 1 unité)

### 6.4 Ce qu’on n’affiche pas dans le tableau
- Texte des messages, destinataires, liste des envois
- Lecteur audio, objet / corps du mail
- Bouton aperçu « œil » sur chaque envoi

---

## 7. Lignes Webservices (`pgeConsoWebservice`) — plus tard

Même tableau, même colonne Export.

**Aujourd’hui :** seul le SMS webservice est branché (`__OPERATION_SMS_WEBSERVICE__`).  
**Ensuite :** étendre aux autres supports (SMS interactif, Email, Courrier, Tract, etc.) quand la liste réelle sera confirmée.

Jusque-là : une ligne SMS si conso, sinon message vide.

---

## 8. États d’interface

| Situation | Comportement |
|-----------|--------------|
| Conso sur 1, 2 ou 3 types | Une ligne par type concerné + ligne Total |
| Aucune conso | Tableau masqué + message : « Aucune consommation pour cette sélection. » |
| Changement Année / Mois / Société | Recalcul des lignes + totaux du bandeau |

Les chiffres sont des **agrégats** (rapides). Pas de chargement de milliers de lignes à l’écran.

---

## 9. Checklist interface (Notifications)

Bandeau
- [ ] Titre
- [ ] Combo Année / Mois / Société
- [ ] Payé / Impayé / Total
- [ ] **Pas** de combo Type
- [ ] **Pas** de bouton Excel global

Tableau (copie de « Ma consommation »)
- [ ] En-têtes groupés Opération / Montant
- [ ] Colonnes : icône, Type, Nombre, Quantité, HT, TTC, Reste à payer, **Export**
- [ ] Ligne Total (sans Export)
- [ ] Une ligne seulement s’il y a de la conso
- [ ] Message si aucune conso

---

## 10. Répartition du travail

- **Toi :** recopier l’interface de « Ma consommation » sur les 2 pages + colonne Export.
- **Moi :** requêtes de synthèse (agrégats), totaux, appel webservice Excel, contenu Excel (texte SMS / lien audio VMS / lien aperçu email).

---

## 11. Export Excel — implémentation (livrée le 16/08/2026)

### 11.1 Aiguillage du webservice `WS_Rapport_Excel`
Le webservice existant est réutilisé tel quel (même URL, même cryptage).
Trois nouveaux codes de rapport (constantes projet à créer) :

| Constante | Valeur | Contenu |
|-----------|--------|---------|
| `__RAPPORT_CONSO_SMS__` | `CSN` | Détail des SMS de notification |
| `__RAPPORT_CONSO_VMS__` | `CVU` | Détail des VMS unitaires |
| `__RAPPORT_CONSO_EMAIL__` | `CEN` | Détail des emails de notification |

### 11.2 Format du paramètre crypté (5 champs, comme l’existant)
`IdClient(mère) | IdContact(connecté) | TypeRapport | 0 | Année;Mois;IdSociété;IdContact`

Le 4e champ (IdOperation) vaut `0` : un rapport de conso n’est pas lié à une
opération. Le 5e champ transporte les filtres de la page (0 = tous).

### 11.3 Procédures (collection `cpRapportExcel`)
- `RapportExcel` : vérification d’opération rendue conditionnelle
  (`si nIdOperation > 0`) + 3 nouveaux cas d’aiguillage.
- `ChargeRapportExcelCartoucheConso` : cartouche (société, contact, période).
- `ChargeFeuilleExcelConsoSms` / `ConsoVms` / `ConsoEmail` : une feuille de
  détail par support, ligne Total en bas, mêmes filtres SQL que la page.

### 11.4 Page : bouton `btnExport`
Voir `Code bouton btnExport.txt` : toast navigateur + code serveur Ajax qui
construit l’URL cryptée et l’ouvre (`ScriptAffiche`).

### 11.5 Points en suspens
- [ ] **Constantes** : ajouter `__RAPPORT_CONSO_SMS__ / _VMS__ / _EMAIL__` dans le projet WebDev.
- [ ] **Modèles Excel** : `GénèreFichierExcel` ouvre `fRepDonnées()\Excel\<TypeOperation>-xls-rapport.xlsx` ; il faut les modèles `SMN-…`, `VMU-…`, `EMN-…` (copies d’un modèle existant) et que `cpProjet.CouleurTypeOperation` connaisse ces 3 types.
- [ ] **Lien audio VMS** : `vms_message` n’a pas de chemin de fichier — règle de construction de l’URL à définir (via `IdPbxMessage` ?).
- [ ] **Aperçu email** : page/URL d’aperçu du `ContenuHtml` à créer, puis à insérer dans la feuille Email.

---

*Cadrage mis à jour le 16/08/2026 — modèle « Ma consommation » + export par ligne + webservice Excel livré.*
