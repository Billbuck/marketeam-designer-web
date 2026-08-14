# Blocs synthèse par type de support — `pgeConsoNotification`

Document d’interface pour le **cœur de la page** : 3 blocs de synthèse (SMS / VMS / Email).  
Les totaux globaux (Payé / Impayé / Total) et le bouton Excel sont hors périmètre de ce document, sauf quand un lien logique est nécessaire.

---

## 1. Principes communs aux 3 blocs

### 1.1 Rôle
Chaque bloc résume la consommation **d’un seul type de support** pour la sélection courante (Année, Mois, Société).

Le détail ligne à ligne n’apparaît **pas** ici : il est réservé à l’export Excel.

### 1.2 Affichage : toujours les 3 blocs
Les **3 blocs sont toujours affichés** (SMS, VMS, Email), quel que soit le volume.

Il n’y a **plus de filtre Type d’opération** : ce filtre servait à alléger les longues listes, qui disparaissent de la page.

### 1.3 Disposition
Les 3 blocs sont posés dans un **champ disposition** (pas de zone répétée).  
Ordre de gauche à droite (ou de haut en bas sur mobile / étroit) :

1. SMS  
2. VMS  
3. Email  

La disposition reste **stable** : les 3 emplacements sont toujours présents.

### 1.4 Périmètre des chiffres
Tous les chiffres d’un bloc sont calculés avec **exactement les mêmes filtres** que la page :
- Année (obligatoire)
- Mois (0 = toute l’année)
- Société (0 = toutes les sociétés du périmètre client)

Chaque bloc calcule **son propre type** (SMS / VMS / Email).

### 1.5 Style / lisibilité (indications)
- Titre du bloc bien visible + icône du type de support (réutiliser les icônes déjà utilisées dans Marketeam.Direct).
- Montants alignés à droite, format monétaire cohérent avec le reste de l’appli.
- Impayé mis en évidence (couleur d’alerte, comme le total Impayé global).
- Payé en couleur « OK » / neutre positive.
- Pas de bouton « aperçu » dans les blocs (le détail = Excel).
- Bloc à **0** : mêmes libellés, valeurs à zéro (pas de masquage du bloc). Aspect un peu plus « neutre / grisé » possible, sans le faire disparaître.

---

## 2. Informations communes à afficher dans chaque bloc

Chaque bloc présente les éléments suivants.

| Zone | Libellé écran (proposition) | Contenu | Remarque |
|------|-----------------------------|---------|----------|
| En-tête | — | Icône du type | Même logique visuelle que l’existant |
| En-tête | — | Titre du type | Ex. « Notification SMS », « Message vocal (VMS) », « Notification Email » |
| Volume | Envois | Nombre d’opérations / d’envois | Entier (`0` si rien) |
| Volume | Unités facturées | Quantité facturée | Voir particularités par type ; SMS seulement en variante allégée |
| Montants | Montant HT | Somme des HT | Monétaire (`0,000 €` si rien) |
| Montants | Montant TTC | Somme des TTC | Monétaire |
| Paiement | Payé | Somme TTC des lignes payées | Monétaire, couleur positive |
| Paiement | Impayé | Somme TTC des lignes non payées | Monétaire, couleur alerte |
| Paiement | Total | Payé + Impayé (= Montant TTC) | Non affiché dans le bloc — voir §6 |

### Contrôle de cohérence interne (par bloc)
`Payé + Impayé = Montant TTC`  
Si écart : bug de calcul / de filtre à corriger côté code.

---

## 3. Bloc SMS

### 3.1 Identité
- **Code type :** notification SMS (constante métier existante, ex. `__OPERATION_SMS_NOTIFICATION__`)
- **Titre proposé :** `Notification SMS`
- **Icône :** icône SMS / notification SMS du projet

### 3.2 Lignes d’information à afficher

| # | Libellé | Donnée | Format | Exemple |
|---|---------|--------|--------|---------|
| 1 | Envois | Nombre de lignes SMS (enregistrements) | Entier | `1 248` ou `0` |
| 2 | SMS facturés | Somme de `NbrSmsFacture` | Entier | `1 512` ou `0` |
| 3 | Montant HT | Somme `MontantHT` | Monétaire | `453,600 €` |
| 4 | Montant TTC | Somme `MontantTTC` | Monétaire | `544,320 €` |
| 5 | Payé | Somme TTC où `EstPaye = Vrai` | Monétaire | `400,000 €` |
| 6 | Impayé | Somme TTC où `EstPaye = Faux` | Monétaire | `144,320 €` |

### 3.3 Particularité SMS
Sur SMS, **« Envois »** et **« SMS facturés »** peuvent différer  
(un même envoi peut facturer plusieurs SMS).  
Les **deux** informations sont utiles pour la transparence client.

### 3.4 Ce qu’on n’affiche pas dans le bloc
- Texte des messages
- Destinataires
- Liste des envois
- Lien Excel spécifique au bloc (l’export est global, filtré par la page)

---

## 4. Bloc VMS

### 4.1 Identité
- **Code type :** VMS unitaire (ex. `__OPERATION_VMS_UNITAIRE__`)
- **Titre proposé :** `Message vocal (VMS)`
- **Icône :** icône VMS / vocal du projet

### 4.2 Lignes d’information à afficher

| # | Libellé | Donnée | Format | Exemple |
|---|---------|--------|--------|---------|
| 1 | Envois | Nombre de VMS | Entier | `86` ou `0` |
| 2 | Montant HT | Somme `MontantHT` | Monétaire | `129,000 €` |
| 3 | Montant TTC | Somme `MontantTTC` | Monétaire | `154,800 €` |
| 4 | Payé | Somme TTC payée | Monétaire | `100,000 €` |
| 5 | Impayé | Somme TTC impayée | Monétaire | `54,800 €` |

### 4.3 Particularité VMS
- Pas de « texte message » à l’écran : l’audio est dans l’Excel (lien URL).
- Pas de 2ᵉ ligne volume (1 VMS = 1 unité facturée).

### 4.4 Ce qu’on n’affiche pas dans le bloc
- Lecteur audio
- Liens vers les fichiers
- Destinataires / liste

---

## 5. Bloc Email

### 5.1 Identité
- **Code type :** notification email (ex. `__OPERATION_EMAIL_NOTIFICATION__`)
- **Titre proposé :** `Notification Email`
- **Icône :** icône email du projet

### 5.2 Lignes d’information à afficher

| # | Libellé | Donnée | Format | Exemple |
|---|---------|--------|--------|---------|
| 1 | Envois | Nombre d’emails | Entier | `312` ou `0` |
| 2 | Montant HT | Somme `MontantHT` | Monétaire | `78,000 €` |
| 3 | Montant TTC | Somme `MontantTTC` | Monétaire | `93,600 €` |
| 4 | Payé | Somme TTC payée | Monétaire | `93,600 €` |
| 5 | Impayé | Somme TTC impayée | Monétaire | `0,000 €` |

### 5.3 Particularité Email
- Contenu du mail non affiché dans le bloc : aperçu via **lien web** dans l’Excel.

### 5.4 Ce qu’on n’affiche pas dans le bloc
- Objet / corps du mail
- Lien d’aperçu
- Destinataires / liste

---

## 6. Variante d’affichage « allégée » (recommandée)

### Toujours afficher (dans chaque bloc)
1. En-tête (icône + titre)  
2. **Envois**  
3. **SMS facturés** → **uniquement sur le bloc SMS**  
4. Montant HT  
5. Montant TTC  
6. Payé  
7. Impayé  

### Ne pas dupliquer
- Sur VMS et Email : pas de ligne « Unités facturées ».  
- « Total » du bloc : **ne pas l’afficher** (déjà = Montant TTC ; les totaux globaux sont en haut de page).

### Schéma type d’un bloc (avec conso)

```
┌─────────────────────────────────────┐
│  [icône]  Notification SMS          │
│─────────────────────────────────────│
│  Envois                    1 248    │
│  SMS facturés              1 512    │  ← SMS seulement
│─────────────────────────────────────│
│  Montant HT              453,600 €  │
│  Montant TTC             544,320 €  │
│─────────────────────────────────────│
│  Payé                    400,000 €  │
│  Impayé                  144,320 €  │
└─────────────────────────────────────┘
```

### Schéma type d’un bloc (sans conso)

```
┌─────────────────────────────────────┐
│  [icône]  Notification SMS          │
│─────────────────────────────────────│
│  Envois                        0    │
│  SMS facturés                  0    │  ← SMS seulement
│─────────────────────────────────────│
│  Montant HT                0,000 €  │
│  Montant TTC               0,000 €  │
│─────────────────────────────────────│
│  Payé                      0,000 €  │
│  Impayé                    0,000 €  │
└─────────────────────────────────────┘
```

VMS / Email : même structure **sans** la ligne « SMS facturés ».

---

## 7. Cohérence avec les totaux globaux (bandeau haut)

| Total global | Formule |
|--------------|---------|
| Payé | Payé SMS + Payé VMS + Payé Email |
| Impayé | Impayé SMS + Impayé VMS + Impayé Email |
| Total | Payé global + Impayé global |

---

## 8. États d’interface

| Situation | Comportement |
|-----------|--------------|
| Conso sur les 3 types | 3 blocs avec leurs chiffres |
| Conso sur 1 ou 2 types seulement | 3 blocs toujours visibles ; le(s) type(s) sans conso à **0** |
| Aucune conso sur la sélection | 3 blocs à **0** + message explicite global (voir §8.1) |
| Changement de filtre Année / Mois / Société | Recalcul des 3 blocs + totaux |

Pas d’état « chargement ligne à ligne » : les blocs sont des **agrégats** (rapides).

### 8.1 Message quand aucune consommation

En plus des 3 blocs à zéro, afficher un message clair, par exemple :

> Aucune consommation pour cette sélection.

Emplacement suggéré : sous les totaux globaux / au-dessus ou sous les 3 blocs.  
Le bouton Excel peut rester visible ; s’il n’y a rien à exporter, l’export renverra un fichier vide ou un message d’information (à trancher au moment du webservice).

---

## 9. Récapitulatif « checklist interface » par bloc

### Bloc SMS — champs à prévoir
- [ ] Icône SMS  
- [ ] Titre  
- [ ] Libellé + valeur **Envois**  
- [ ] Libellé + valeur **SMS facturés**  
- [ ] Libellé + valeur **Montant HT**  
- [ ] Libellé + valeur **Montant TTC**  
- [ ] Libellé + valeur **Payé**  
- [ ] Libellé + valeur **Impayé**  
- [ ] Toujours visible (y compris à 0)  

### Bloc VMS — champs à prévoir
- [ ] Icône VMS  
- [ ] Titre  
- [ ] Libellé + valeur **Envois**  
- [ ] Libellé + valeur **Montant HT**  
- [ ] Libellé + valeur **Montant TTC**  
- [ ] Libellé + valeur **Payé**  
- [ ] Libellé + valeur **Impayé**  
- [ ] Toujours visible (y compris à 0)  

### Bloc Email — champs à prévoir
- [ ] Icône Email  
- [ ] Titre  
- [ ] Libellé + valeur **Envois**  
- [ ] Libellé + valeur **Montant HT**  
- [ ] Libellé + valeur **Montant TTC**  
- [ ] Libellé + valeur **Payé**  
- [ ] Libellé + valeur **Impayé**  
- [ ] Toujours visible (y compris à 0)  

### Page — hors blocs
- [ ] Message « Aucune consommation pour cette sélection. » (visible seulement si les 3 blocs sont à 0)

---

## 10. Hors blocs (rappel pour alignement global)

- Filtres : **Année / Mois / Société** uniquement (**plus de filtre Type**)
- Totaux globaux Payé / Impayé / Total  
- Bouton **Exporter Excel**  
  - mêmes filtres (Année / Mois / Société)  
  - **1 feuille par type** (SMS / VMS / Email)  
  - SMS = texte du message ; VMS = lien audio ; Email = lien aperçu web  

---

*Document de cadrage interface — à ajuster si les libellés métier officiels diffèrent (ex. intitulés exacts des types dans `Partage.LibelleTypeProjet`).*
