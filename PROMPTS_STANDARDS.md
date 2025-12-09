## ⚠️ STANDARDS DE DOCUMENTATION À RESPECTER

Ce projet utilise une documentation JSDoc complète. Pour toute modification :

1. **Nouvelles fonctions** → Ajouter un bloc JSDoc complet :
```javascript
   /**
    * Description de la fonction
    * @param {type} nomParam - Description
    * @returns {type} Description du retour
    */
```

2. **Nouvelles propriétés dans une structure** → Mettre à jour le @typedef correspondant en début de fichier

3. **Nouveaux types de zones** → Créer un nouveau @typedef et l'ajouter à l'union ZoneData

4. **Types utilisés** :
   - DocumentState, PageData, ZoneData (et ses variantes)
   - SourceData, BorderData, RedimensionnementData
   - Tous les types *JsonWebDev pour l'import/export

5. **NE PAS** créer de fonctions sans documentation JSDoc
```

---

## Exemple concret

### Prompt SANS le standard (❌ risqué)
```
Ajoute une fonction pour dupliquer une zone