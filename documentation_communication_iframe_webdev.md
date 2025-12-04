# Documentation : Communication iframe ↔ WebDev

## Vue d'ensemble

Cette documentation décrit l'architecture de communication bidirectionnelle entre une iframe (application JavaScript) et une page WebDev, avec synchronisation des données vers le serveur.

### Flux de données complet

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUX COMPLET                                                   │
│                                                                 │
│  iframe (Application JS)                                        │
│       │                                                         │
│       │ window.parent.postMessage({action: "...", data: ...})   │
│       ▼                                                         │
│  navigateur WebDev (EcouterMessagesIframe)                      │
│       │                                                         │
│       │ SetVariableWebDev("nomVariable", json)                  │
│       ▼                                                         │
│  variable synchronisée navigateur → serveur                     │
│       │                                                         │
│       │ synchronisation automatique WebDev                      │
│       ▼                                                         │
│  code serveur WebDev (gsNomVariable)                            │
│       │                                                         │
│       ▼                                                         │
│  Base de données / Traitement métier                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prérequis et règles importantes

### Règle 1 : Casse des variables
La casse des noms de variables doit être **exactement identique** à la déclaration WebDev.

```
✅ gsJsonRecu (si déclaré "gsJsonRecu")
❌ GSJSONRECU
❌ GsJsonRecu
```

### Règle 2 : Initialisation obligatoire
Les variables synchronisées doivent être "touchées" en code navigateur au chargement de la page pour être visibles par l'API NSPCS.

```wl
// Code navigateur - Chargement de la page
gsJsonRecu = gsJsonRecu  // ou gsJsonRecu = ""
```

### Règle 3 : Nom de page automatique
Le nom de la page est récupéré automatiquement via l'API NSPCS, pas besoin de le passer en paramètre.

```javascript
var page = NSPCS.NSChamps.oGetPageCourante();
var nomPage = page.m_sAlias; // Ex: "PAGE_TESTDESIGNER"
```

---

## Configuration WebDev

### Étape 1 : Créer la variable globale synchronisée

Dans la page WebDev, déclarer une variable globale :

```wl
// Déclaration globale de la page
gsJsonRecu est une chaîne <synchronisé navigateur>
```

**Important** : 
- Type : Chaîne
- Portée : Serveur, synchronisée navigateur

### Étape 2 : Créer le champ iframe

1. Créer un champ **iframe** (ex: `IFRM_Designer`)
2. Définir l'URL dynamiquement en code serveur (Initialisation de la page) :

```wl
// Code serveur - Initialisation de la page
IFRM_Designer = "/" + RépertoireWeb() + "/MonDossier/index.html"
```

### Étape 3 : Créer un libellé pour le debug (optionnel)

Créer un champ **Libellé** (ex: `LIB_Messages`) pour afficher les messages reçus.

---

## Procédures navigateur JavaScript

### Procédure 1 : SetVariableWebDev

Écrit une valeur dans une variable WebDev synchronisée.

```javascript
function SetVariableWebDev(nomVariable, valeur) {
    try {
        var page = NSPCS.NSChamps.oGetPageCourante();
        page.xviGetVariable(nomVariable, page.m_sAlias, 1).vSetValeur(valeur, 0, {});
        console.log('✅ SetVariableWebDev("' + nomVariable + '") = ' + valeur);
        return true;
    } catch(e) {
        console.error('❌ SetVariableWebDev("' + nomVariable + '"):', e.message);
        return false;
    }
}
```

### Procédure 2 : GetVariableWebDev

Lit une valeur depuis une variable WebDev synchronisée.

```javascript
function GetVariableWebDev(nomVariable) {
    try {
        var page = NSPCS.NSChamps.oGetPageCourante();
        var variable = page.xviGetVariable(nomVariable, page.m_sAlias, 1);
        if (variable && variable.m_iValeur && variable.m_iValeur.m_tValeur !== undefined) {
            var valeur = variable.m_iValeur.m_tValeur;
            console.log('✅ GetVariableWebDev("' + nomVariable + '") = ' + valeur);
            return valeur;
        }
        console.warn('⚠️ GetVariableWebDev("' + nomVariable + '"): valeur vide ou non trouvée');
        return null;
    } catch(e) {
        console.error('❌ GetVariableWebDev("' + nomVariable + '"):', e.message);
        return null;
    }
}
```

### Procédure 3 : EnvoyerMessageIframe

Envoie un message à l'iframe via postMessage.

```javascript
function EnvoyerMessageIframe(jsonString) {
    var iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
        var message = JSON.parse(jsonString);
        iframe.contentWindow.postMessage(message, '*');
        console.log('📤 Message envoyé à iframe:', message);
        return true;
    } else {
        console.error('❌ iframe non trouvée');
        return false;
    }
}
```

### Procédure 4 : EcouterMessagesIframe

Écoute les messages provenant de l'iframe et les stocke dans une variable synchronisée.

```javascript
function EcouterMessagesIframe(aliasLibelle, nomVariable) {
    var idLibelle = aliasLibelle ? "tz" + aliasLibelle : null;
    var messageCount = 0;
    
    console.log("🎧 Écoute iframe activée (variable: " + nomVariable + ")");
    
    window.addEventListener('message', function(event) {
        // Ignorer les messages sans action
        if (!event.data || !event.data.action) return;
        
        messageCount++;
        var time = new Date().toLocaleTimeString();
        var msg = '[' + time + '] #' + messageCount + ' : ' + event.data.action;
        
        console.log('📩 Message reçu:', event.data);
        
        // Mettre à jour le libellé (si fourni)
        if (idLibelle) {
            var element = document.getElementById(idLibelle);
            if (element) {
                var td = element.querySelector('td');
                if (td) {
                    td.textContent = msg;
                } else {
                    element.textContent = msg;
                }
            }
        }
        
        // Stocker dans la variable synchronisée (si fournie)
        if (nomVariable) {
            var jsonComplet = JSON.stringify(event.data);
            SetVariableWebDev(nomVariable, jsonComplet);
        }
    });
}
```

---

## Code de chargement de la page

### Code navigateur - Chargement

```wl
// Initialisation des variables synchronisées (obligatoire pour NSPCS)
gsJsonRecu = gsJsonRecu

// Activer l'écoute des messages de l'iframe
EcouterMessagesIframe(LIB_Messages.Alias, "gsJsonRecu")
```

**Note** : Le nom de variable `"gsJsonRecu"` doit être exactement comme déclaré.

---

## Code côté iframe (application JavaScript)

### Écouter les messages du parent

```javascript
// Écoute des messages provenant de WebDev
window.addEventListener('message', function(event) {
    console.log('📩 Message reçu du parent:', event.data);
    
    if (!event.data || !event.data.action) return;
    
    switch(event.data.action) {
        case 'ping':
            // Répondre avec pong
            window.parent.postMessage({
                action: 'pong',
                timestamp: Date.now()
            }, '*');
            break;
            
        case 'load':
            // Charger des données
            if (event.data.data) {
                // Traiter les données reçues
                console.log('Données à charger:', event.data.data);
            }
            break;
            
        case 'export':
            // Exporter les données vers WebDev
            var exportData = {
                action: 'exportResult',
                data: { /* données à exporter */ },
                timestamp: Date.now()
            };
            window.parent.postMessage(exportData, '*');
            break;
    }
});
```

### Envoyer un message au parent

```javascript
// Envoyer un message à WebDev
function envoyerAuParent(action, data) {
    window.parent.postMessage({
        action: action,
        data: data,
        timestamp: Date.now()
    }, '*');
}

// Exemples d'utilisation
envoyerAuParent('ready', null);
envoyerAuParent('save', { zones: [...], settings: {...} });
envoyerAuParent('error', { message: 'Erreur de validation' });
```

### Signaler que l'iframe est prête

```javascript
// Au chargement de l'iframe
document.addEventListener('DOMContentLoaded', function() {
    // Attendre un court instant pour s'assurer que le parent est prêt
    setTimeout(function() {
        window.parent.postMessage({ action: 'ready' }, '*');
        console.log('📤 Signal ready envoyé au parent');
    }, 500);
});
```

---

## Utilisation côté WebDev

### Envoyer un message à l'iframe

```wl
// Code navigateur - Clic sur un bouton
// Note : Les guillemets doivent être doublés en WebDev
EnvoyerMessageIframe("{""action"": ""ping""}")

// Avec des données
EnvoyerMessageIframe("{""action"": ""load"", ""data"": {""id"": 123}}")
```

### Lire les données côté serveur

```wl
// Code serveur - Après réception d'un message
SI gsJsonRecu <> "" ALORS
    // Parser le JSON
    vDocument est un Variant = JSONVersVariant(gsJsonRecu)
    
    // Accéder aux données
    sAction est une chaîne = vDocument.action
    
    SI sAction = "exportResult" ALORS
        // Traiter les données exportées
        vData est un Variant = vDocument.data
        // ...
    FIN
FIN
```

### Lire les données côté navigateur

```wl
// Code navigateur
sValeur est une chaîne = GetVariableWebDev("gsJsonRecu")
SI sValeur <> "" ALORS
    // Traiter la valeur
    Info(sValeur)
FIN
```

---

## Structure des messages recommandée

### Format standard

```json
{
    "action": "nomAction",
    "data": { },
    "timestamp": 1234567890
}
```

### Actions courantes

| Action | Direction | Description |
|--------|-----------|-------------|
| `ready` | iframe → WebDev | L'iframe est chargée et prête |
| `ping` | WebDev → iframe | Test de connexion |
| `pong` | iframe → WebDev | Réponse au ping |
| `load` | WebDev → iframe | Charger des données dans l'iframe |
| `export` | WebDev → iframe | Demander l'export des données |
| `exportResult` | iframe → WebDev | Données exportées |
| `save` | iframe → WebDev | Sauvegarder les données |
| `error` | bidirectionnel | Signaler une erreur |

---

## Débogage

### Console navigateur

Vérifier le contexte de la console (sélecteur "top" vs iframe).

### Tester l'API NSPCS

```javascript
// Vérifier que NSPCS est disponible
console.log("NSPCS existe ?", typeof NSPCS !== 'undefined');

// Voir le nom de la page
var page = NSPCS.NSChamps.oGetPageCourante();
console.log("Nom page:", page.m_sAlias);

// Tester l'accès à une variable
try {
    var v = page.xviGetVariable("gsJsonRecu", page.m_sAlias, 1);
    console.log("Variable trouvée:", v ? "OUI" : "NON");
} catch(e) {
    console.log("Erreur:", e.message);
}
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `L'élément 'XXX' n'existe pas` | Mauvaise casse du nom de variable | Utiliser exactement la casse de la déclaration |
| `NSPCS is not defined` | Console dans le contexte iframe | Sélectionner "top" dans le sélecteur de contexte |
| Variable vide côté serveur | Variable non initialisée | Ajouter `gsVar = gsVar` au chargement navigateur |

---

## Checklist d'intégration

- [ ] Variable globale déclarée (chaîne, synchronisée navigateur)
- [ ] Champ iframe créé avec URL dynamique
- [ ] Procédure `SetVariableWebDev` créée
- [ ] Procédure `GetVariableWebDev` créée
- [ ] Procédure `EnvoyerMessageIframe` créée
- [ ] Procédure `EcouterMessagesIframe` créée
- [ ] Code navigateur chargement : initialisation variable + écoute
- [ ] Iframe : écoute des messages du parent
- [ ] Iframe : envoi du signal "ready" au chargement
- [ ] Test ping/pong validé
- [ ] Test lecture serveur validé

---

## Exemple complet minimaliste

### Déclaration globale WebDev

```wl
gsJsonRecu est une chaîne <synchronisé navigateur>
```

### Code serveur - Initialisation

```wl
IFRM_MonApp = "/" + RépertoireWeb() + "/App/index.html"
```

### Code navigateur - Chargement

```wl
gsJsonRecu = gsJsonRecu
EcouterMessagesIframe(LIB_Messages.Alias, "gsJsonRecu")
```

### Code navigateur - Bouton Envoyer

```wl
EnvoyerMessageIframe("{""action"": ""ping""}")
```

### Code serveur - Bouton Lire

```wl
Info("Reçu : " + gsJsonRecu)
```

### HTML iframe minimal

```html
<!DOCTYPE html>
<html>
<head>
    <title>App iframe</title>
</head>
<body>
    <h1>Application iframe</h1>
    <div id="log"></div>
    
    <script>
        // Écoute des messages
        window.addEventListener('message', function(event) {
            if (!event.data || !event.data.action) return;
            
            document.getElementById('log').innerHTML += 
                '<p>Reçu: ' + event.data.action + '</p>';
            
            if (event.data.action === 'ping') {
                window.parent.postMessage({
                    action: 'pong',
                    timestamp: Date.now()
                }, '*');
            }
        });
        
        // Signal ready au chargement
        setTimeout(function() {
            window.parent.postMessage({ action: 'ready' }, '*');
        }, 500);
    </script>
</body>
</html>
```

---

## Historique des versions

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-12-03 | Version initiale - Communication validée |

---

## Auteur

Documentation créée dans le cadre du projet **Marketeam Designer** - Intégration VDP Designer avec WebDev.
