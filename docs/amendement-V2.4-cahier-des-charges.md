# Amendement V2.4 — cahier des charges Designer (ajout de champs de fusion)

> Amendement au document `docs/cahier_des_charges_creation_champs_fusion.md` (V2.3).
>
> À intégrer par Cursor en version **V2.4**, avec mise à jour du bandeau de version, de la filiation, et de l'annexe §14.
>
> Origine : remarques utilisateur recueillies après tests du livrable L5.

---

## 1. Changement de doctrine — critère de verrouillage par ORIGINE et non par NOM

### 1.1 Constat

Le critère de verrouillage actuel (V2.3) est « `nom` technique rempli = verrouillé ». Ce critère pose un problème concret : quand l'utilisateur ajoute un champ standard via la modale, ce champ a immédiatement un `nom` rempli (puisque c'est sa raison d'être), donc il devient immédiatement verrouillé. **L'utilisateur ne peut plus le supprimer**, alors que c'est lui qui vient de l'ajouter.

C'est incohérent : un champ que l'utilisateur a ajouté doit pouvoir être retiré, peu importe qu'il soit standard ou spécifique.

### 1.2 Nouveau critère — par origine du champ

Le critère de verrouillage devient **l'origine du champ**, pas l'état de son `nom` technique.

| Origine | Critère technique | Verrouillage |
|---|---|---|
| **Import** | Champ présent dans le JSON initial reçu via `postMessage` au chargement (donc venant d'une base associée à l'opération) | Libellé et type figés. Suppression interdite. **Échantillon modifiable**. |
| **Ajout** | Champ ajouté par l'utilisateur via la modale (peu importe standard ou spécifique) | Libellé, type, échantillon **librement modifiables**. Suppression autorisée. |

### 1.3 Modification de la propriété `origine`

La propriété `origine` introduite en V2.3 change de sémantique :

| V2.3 | V2.4 |
|---|---|
| Valeurs : `"standard"` / `"specifique"` | Valeurs : `"import"` / `"ajout"` |
| Sert au verrouillage **et** au choix de l'onglet en édition | Sert au **verrouillage uniquement** |

Pour le choix de l'onglet en édition (fix A2 livré en L5), un autre mécanisme est nécessaire — voir §1.5 ci-dessous.

### 1.4 Logique d'affectation de `origine` à la création / au chargement

| Contexte | Valeur de `origine` |
|---|---|
| Champ présent dans le JSON initial (`stLoad.champsFusion`) au chargement | `"import"` |
| Champ ajouté via la modale, onglet Standard | `"ajout"` |
| Champ ajouté via la modale, onglet Spécifique | `"ajout"` |
| Pour les modèles legacy sans propriété `origine` : tous les champs sont considérés comme `"import"` par sécurité (verrouillage par défaut) | `"import"` |

### 1.5 Détermination de l'onglet à ouvrir en édition

Le critère de l'onglet n'est plus l'`origine`. Il devient une **propriété secondaire** distincte. Deux approches possibles ; Cursor tranche après analyse du code :

- **Approche A** : ajouter une propriété explicite `categorie` (valeurs `"standard"` / `"specifique"`) sur chaque champ, renseignée à la création et préservée.
- **Approche B** : déduire à l'ouverture de la modale d'édition, par recherche du `nom` technique du champ dans `champsStandardDisponibles`. Si trouvé → onglet Standard ; sinon → onglet Spécifique.

L'approche A est plus robuste. L'approche B évite d'ajouter une propriété au modèle. À Cursor de choisir et de justifier.

### 1.6 Articulation avec `autoriserGestionChamps`

Le booléen global `autoriserGestionChamps` (V2.3) reste prioritaire. Si `autoriserGestionChamps = Faux`, **tous** les champs sont verrouillés (même ceux d'origine `"ajout"`). Le tableau récapitulatif de V2.3 §3.3 est donc à mettre à jour :

| Origine du champ | `autoriserGestionChamps = Vrai` | `autoriserGestionChamps = Faux` |
|---|---|---|
| `"import"` | Libellé/type figés, échantillon modifiable, pas de suppression | Tout figé, pas de suppression |
| `"ajout"` | Tout modifiable, suppression autorisée | Tout figé, pas de suppression |

---

## 2. Logique unifiée des valeurs d'échantillon

### 2.1 Principe directeur

**À chaque ajout ou modification d'un champ**, la valeur d'échantillon doit être **pré-remplie automatiquement** selon l'algorithme suivant :

1. Si la valeur d'échantillon est **déjà saisie par l'utilisateur** → la conserver.
2. Sinon, si une valeur existe dans la **fiche utilisateur** (envoyée via `donneesApercu` au load) pour ce champ → utiliser cette valeur.
3. Sinon, utiliser le **placeholder par défaut** correspondant (cf. §2.3 et §2.4).

### 2.2 Source des valeurs « fiche utilisateur »

En création de modèle ou en tunnel sans base de données, la SaaS doit envoyer dans `donneesApercu` un enregistrement contenant les informations de l'utilisateur (Civilité, Nom, Prénom, Société, Adresse, etc.) pour servir d'échantillon par défaut. Ce mécanisme existe déjà partiellement (cf. test utilisateur observation 3) ; il doit être **généralisé et homogène**.

**Note pour la SaaS** : cette table d'échantillons doit également être **stockée côté SaaS** au moment de la sauvegarde du modèle, pour pouvoir :
- Régénérer le BAT avec les mêmes valeurs d'échantillon que l'aperçu Designer.
- Restituer les valeurs d'échantillon à la ré-ouverture du modèle pour modification.

Cette synchronisation est **hors périmètre Designer/Cursor** et fait partie du chantier SaaS suivant. Elle est mentionnée ici pour cohérence d'ensemble.

### 2.3 Table des placeholders par type — pour les champs spécifiques

Si un utilisateur crée un champ spécifique et ne saisit pas de valeur d'échantillon, le placeholder par défaut suivant est utilisé selon le type :

| Code | Type | Placeholder par défaut |
|---|---|---|
| `TXT` | Texte | `Texte exemple` |
| `ENT` | Entier | `42` |
| `DEC` | Décimal | `1 234,56` |
| `MON` | Monétaire | `1 250,00 €` |
| `DAT` | Date | `01/06/2026` |
| `TIM` | Heure | `14:30` |
| `EML` | Email | `jean.dupont@example.com` |
| `TEL` | Téléphone | `01.02.03.04.05` |
| `SMS` | Portable | `06.12.34.56.78` |
| `CDP` | Code postal | `75001` |
| `URL` | URL | `https://www.example.com` |
| `IMG` | Image | Placeholder visuel (icône image générique) |
| `ALG` | Alliage | `ALG001` |

### 2.4 Liste métier des champs standards + placeholders par défaut

Cette table remplace intégralement la liste actuelle de `RemplirDesignerChampsStandard()` (qui contenait des entrées inadaptées comme « N° Client », « Logo entreprise », « Photo contact »).

| Libellé | Nom technique | Type | Placeholder par défaut |
|---|---|---|---|
| Civilité | `Civilite` | `TXT` | `Monsieur` |
| Nom | `Nom` | `TXT` | `Dupont` |
| Prénom | `Prenom` | `TXT` | `Jean` |
| Société | `Societe` | `TXT` | `Société Exemple SAS` |
| Enseigne | `Enseigne` | `TXT` | `Enseigne Exemple` |
| Contact | `Contact` | `TXT` | `Jean Dupont` |
| Référence | `Reference` | `TXT` | `REF-12345` |
| Adresse 1 | `Adresse1` | `TXT` | `12 rue de l'Exemple` |
| Adresse 2 | `Adresse2` | `TXT` | `Bâtiment A` |
| Adresse 3 | `Adresse3` | `TXT` | `Résidence Les Jardins` |
| Adresse 4 | `Adresse4` | `TXT` | `Appartement 24` |
| Code postal | `CodePostal` | `CDP` | `75001` |
| Ville | `Ville` | `TXT` | `Paris` |
| Pays | `Pays` | `TXT` | `France` |
| Téléphone | `Telephone` | `TEL` | `01.02.03.04.05` |
| Portable | `Portable` | `SMS` | `06.12.34.56.78` |
| Email | `Email` | `EML` | `contact@example.com` |
| Code Alliage | `CodeAlliage` | `TXT` | `ALG001` |

### 2.5 Sortir les anciennes valeurs codées en dur

Le code existant du Designer contient des valeurs d'échantillon **codées en dur** pour certains champs standards (observations utilisateur : `MME ET M` pour Civilité, `Caradec` pour Nom, rien pour Prénom). Ces valeurs doivent être **retirées** du code et remplacées par l'algorithme de résolution unifié (§2.1).

---

## 3. Comportement d'ajout — double-clic sur un champ standard

Dans l'onglet Standard de la modale d'ajout, le **double-clic** sur un champ doit l'ajouter **immédiatement** à la liste des champs disponibles, **sans passer par la zone de saisie d'échantillon**.

La valeur d'échantillon est calculée automatiquement selon l'algorithme du §2.1 (fiche utilisateur si dispo → placeholder par défaut sinon).

L'utilisateur peut toujours, après ajout, éditer le champ pour modifier la valeur d'échantillon.

---

## 4. Mode édition — masquage de la sélection de champ

En mode **édition** d'un champ existant, la liste/combo de sélection de champ doit être **masquée** (ou figée et non actionnable). La modification d'un champ n'a vocation qu'à modifier les propriétés du champ existant (libellé, type, échantillon selon les règles de verrouillage), pas à le remplacer par un autre.

L'en-tête du formulaire indique clairement quel champ est en cours de modification.

---

## 5. Sections du cahier des charges V2.3 impactées

À mettre à jour par Cursor pour produire la V2.4 :

| Section V2.3 | Modification |
|---|---|
| Bandeau version | V2.3 → V2.4, ajouter ligne de filiation avec date amendement |
| §3 Principe directeur | Refondre §3.1 et §3.2 : critère par origine (`"import"` / `"ajout"`) et non plus par `nom` rempli. Mettre à jour le tableau §3.3 (cf. §1.6 ci-dessus). |
| §4 Modèle de données | Modifier la propriété `origine` (valeurs `"import"` / `"ajout"`). Ajouter éventuellement `categorie` (`"standard"` / `"specifique"`) si Approche A retenue (cf. §1.5). |
| §5.1 Codes Designer ↔ constantes WebDev | Inchangé. |
| §7.2 Modale d'ajout | Ajout de la section sur le double-clic en onglet Standard (§3 ci-dessus). |
| §7.2.3 Format échantillon par type | Ajouter la colonne « Placeholder par défaut » avec les valeurs du §2.3. |
| §7.3 Modale édition | Préciser le masquage de la sélection de champ (§4 ci-dessus). |
| §7.3.2 Source de la valeur d'échantillon | Refondre selon l'algorithme du §2.1 (déjà-saisi → fiche utilisateur → placeholder). |
| §7.5 Suppression | Mettre à jour le critère : suppression interdite uniquement pour `origine = "import"`. |
| §7.7 Actions inline | Mettre à jour les conditions de désactivation des icônes crayon/poubelle selon le nouveau critère. |
| §14 Annexe | Ajouter Q14 « Critère de verrouillage par origine », Q15 « Placeholders par défaut », Q16 « Double-clic en onglet Standard », Q17 « Masquage sélection en édition ». |

---

## 6. Procédures WebDev impactées

- `webdev/cpDesigner/RemplirDesignerChampsStandard.txt` : **refonte complète** avec la liste métier du §2.4. Les anciennes entrées (« N° Client », « Logo entreprise », « Photo contact ») sont retirées.
- Pas d'autres procédures WebDev impactées par cet amendement.

---

## 7. Point hors périmètre Designer — pour mémoire SaaS

Les observations utilisateur 3 et 4 (discordance Aperçu Designer / BAT) révèlent que **le pipeline de génération BAT côté SaaS n'utilise pas les mêmes données d'échantillon que l'Aperçu Designer** :

- L'Aperçu Designer prend les `echantillonDefaut` du modèle (visibles dans la modale d'édition).
- Le BAT prend la fiche utilisateur réelle pour les champs standards, et **rien** pour les champs spécifiques.

Ce désalignement est **hors périmètre Designer/Cursor**, mais il est documenté ici pour être traité dans le chantier SaaS suivant. La cible : **le BAT et l'Aperçu doivent produire le même résultat** quand on est dans le même contexte (modèle + base + enregistrement).

Mécanisme suggéré : la SaaS stocke avec le modèle la table des `echantillonDefaut` saisis par l'utilisateur, et le pipeline BAT les utilise en priorité quand il génère un BAT sans base réelle.

À traiter séparément.
