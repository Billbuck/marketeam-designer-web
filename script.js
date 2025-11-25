document.addEventListener('DOMContentLoaded', () => {
    // --- ÉLÉMENTS DOM ---
    const a4Page = document.getElementById('a4-page');
    const btnAdd = document.getElementById('btn-add-zone');
    const btnDelete = document.getElementById('btn-delete-zone');
    const btnReset = document.getElementById('btn-reset');
    const btnGenerate = document.getElementById('btn-generate-json');
    const coordsPanel = document.getElementById('coords-panel');
    const lblSelected = document.getElementById('lbl-selected-zone');

    // Inputs du formulaire
    const inputContent = document.getElementById('input-content');
    const inputFont = document.getElementById('input-font');
    const inputSize = document.getElementById('input-size');
    const inputColor = document.getElementById('input-color');
    const inputAlign = document.getElementById('input-align');
    const inputValign = document.getElementById('input-valign');
    // Nouveaux inputs
    const inputBgColor = document.getElementById('input-bg-color');
    const chkTransparent = document.getElementById('chk-transparent');
    const chkLock = document.getElementById('chk-lock');
    const chkCopyfit = document.getElementById('chk-copyfit'); // Copy Fitting
    const inputLineHeight = document.getElementById('input-line-height'); // Interlignage

    // Inputs géométrie
    const inputX = document.getElementById('val-x');
    const inputY = document.getElementById('val-y');
    const inputW = document.getElementById('val-w');
    const inputH = document.getElementById('val-h');

    // Champs de fusion
    const mergeFieldsContainer = document.getElementById('merge-fields-list');
    const MERGE_FIELDS = ['Civilité', 'Nom', 'Prénom', 'Adresse 1', 'Adresse 2', 'CP', 'Ville', 'Téléphone', 'Champ 1'];

    // Initialisation des champs de fusion
    MERGE_FIELDS.forEach(field => {
        const tag = document.createElement('div');
        tag.classList.add('merge-tag');
        tag.innerText = field;
        tag.addEventListener('click', () => insertTag(field));
        // Pour le drag & drop (optionnel pour l'instant, mais prêt)
        tag.draggable = true;
        tag.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', `{{${field}}}`);
        });
        mergeFieldsContainer.appendChild(tag);
    });

    function insertTag(fieldName) {
        if (!inputContent) return;
        
        const start = inputContent.selectionStart;
        const end = inputContent.selectionEnd;
        const text = inputContent.value;
        const tag = `{{${fieldName}}}`;
        
        // Insertion au curseur
        inputContent.value = text.substring(0, start) + tag + text.substring(end);
        
        // Repositionner le curseur après le tag
        inputContent.selectionStart = inputContent.selectionEnd = start + tag.length;
        inputContent.focus();

        // Forcer la mise à jour de l'aperçu
        inputContent.dispatchEvent(new Event('input'));
    }

    const MM_PER_PIXEL = 25.4 / 96;
    let zoneCounter = 0;
    let selectedZoneId = null; 

    // --- STOCKAGE DES DONNÉES (Le "Cerveau") ---
    // Structure : { 'zone-1': { content: '...', font: '...', size: 12, ... }, ... }
    const zonesData = {}; 

    // --- 1. AJOUTER UNE ZONE ---
    btnAdd.addEventListener('click', () => {
        zoneCounter++;
        const id = `zone-${zoneCounter}`;
        
        // Initialiser les données par défaut pour cette zone
        zonesData[id] = {
            content: `Texte Zone ${zoneCounter}`,
            font: 'Roboto',
            size: 12,
            color: '#000000',
            align: 'left',
            valign: 'top',
            bgColor: '#ffffff',
            isTransparent: true, // Transparent par défaut
            locked: false,
            copyfit: false, // Désactivé par défaut
            lineHeight: 1.2 // Interlignage par défaut (120%)
        };

        createZoneDOM(id, zoneCounter);
        saveToLocalStorage(); // Sauvegarde auto
    });

    function createZoneDOM(id, labelNum, autoSelect = true) {
        const zone = document.createElement('div');
        zone.classList.add('zone');
        zone.id = id;
        
        // Style initial par défaut
        zone.style.width = '200px';
        zone.style.height = '40px';
        zone.style.left = '50px';
        zone.style.top = (50 + (labelNum * 20)) + 'px';
        zone.style.fontFamily = 'Roboto, sans-serif'; // Visuel web
        zone.style.fontSize = '12pt';
        zone.style.textAlign = 'left';
        zone.style.color = '#000000';
        // Styles par défaut fond/transparence
        zone.style.backgroundColor = 'transparent'; 
        // Alignement vertical par défaut (flex)
        zone.style.alignItems = 'flex-start'; 

        // Élément interne pour le texte (Aperçu)
        const contentSpan = document.createElement('div');
        contentSpan.classList.add('zone-content');
        contentSpan.innerText = zonesData[id].content;
        zone.appendChild(contentSpan);

        // Poignées
        ['nw', 'ne', 'sw', 'se'].forEach(pos => {
            const handle = document.createElement('div');
            handle.classList.add('handle', pos);
            handle.dataset.pos = pos;
            zone.appendChild(handle);
        });

        // Event: Sélection
        zone.addEventListener('mousedown', (e) => {
            if(e.target.classList.contains('handle')) return;
            selectZone(id);
        });

        a4Page.appendChild(zone);
        if (autoSelect) {
            selectZone(id);
        }
    }

    // --- 2. SÉLECTIONNER ET CHARGER LES DONNÉES ---
    function selectZone(id) {
        // Gestion visuelle de la sélection précédente
        if (selectedZoneId) {
            document.getElementById(selectedZoneId)?.classList.remove('selected');
        }
        selectedZoneId = id;
        const zoneEl = document.getElementById(id);
        zoneEl.classList.add('selected');

        // Activer l'interface
        btnDelete.disabled = false;
        coordsPanel.style.opacity = 1;
        coordsPanel.style.pointerEvents = 'auto';
        lblSelected.innerText = `Zone ${id.split('-')[1]}`;

        // CHARGER LES DONNÉES DANS LE FORMULAIRE
        const data = zonesData[id];
        inputContent.value = data.content;
        inputFont.value = data.font;
        inputSize.value = data.size;
        inputColor.value = data.color;
        inputAlign.value = data.align;
        inputValign.value = data.valign || 'top'; // Rétrocompatibilité
        inputBgColor.value = data.bgColor || '#ffffff';
        chkTransparent.checked = data.isTransparent !== undefined ? data.isTransparent : true;
        chkLock.checked = data.locked || false;
        chkCopyfit.checked = data.copyfit || false;
        inputLineHeight.value = data.lineHeight !== undefined ? data.lineHeight : 1.2; // Rétrocompatibilité
        
        // Gestion état UI couleur fond
        inputBgColor.disabled = chkTransparent.checked;

        // Mettre à jour les géométries
        updateGeomDisplay(zoneEl);
    }

    // --- 3. ÉCOUTEURS SUR LE FORMULAIRE (DATA BINDING) ---
    // Quand on tape dans le formulaire, on met à jour l'objet ET le visuel
    
    function updateActiveZoneData() {
        if (!selectedZoneId) return;
        const zoneEl = document.getElementById(selectedZoneId);
        const contentEl = zoneEl.querySelector('.zone-content');

        // Mise à jour de l'objet de données
        zonesData[selectedZoneId].content = inputContent.value;
        zonesData[selectedZoneId].font = inputFont.value;
        zonesData[selectedZoneId].size = inputSize.value;
        zonesData[selectedZoneId].color = inputColor.value;
        zonesData[selectedZoneId].align = inputAlign.value;
        zonesData[selectedZoneId].valign = inputValign.value;
        // Nouvelles propriétés
        zonesData[selectedZoneId].bgColor = inputBgColor.value;
        zonesData[selectedZoneId].isTransparent = chkTransparent.checked;
        zonesData[selectedZoneId].locked = chkLock.checked;
        zonesData[selectedZoneId].copyfit = chkCopyfit.checked;
        zonesData[selectedZoneId].lineHeight = parseFloat(inputLineHeight.value) || 1.2;

        // Gestion UI Checkbox
        inputBgColor.disabled = chkTransparent.checked;

        // Mise à jour visuelle (Aperçu approximatif)
        contentEl.innerText = inputContent.value;
        zoneEl.style.fontFamily = inputFont.value + ", sans-serif";
        // Note: Le rendu 'pt' web n'est pas 100% identique au print, mais proche
        
        // Application de la taille (Soit Copyfit, soit Taille Fixe)
        if (chkCopyfit.checked) {
            applyCopyfit(zoneEl, inputSize.value);
        } else {
            zoneEl.style.fontSize = inputSize.value + 'pt';
        }
        
        zoneEl.style.color = inputColor.value;
        
        // Fond
        if (chkTransparent.checked) {
            zoneEl.style.backgroundColor = 'transparent';
        } else {
            zoneEl.style.backgroundColor = inputBgColor.value;
        }

        // Verrouillage (Visuel)
        if (chkLock.checked) {
            zoneEl.classList.add('locked');
            // Cacher les poignées si verrouillé
            zoneEl.querySelectorAll('.handle').forEach(h => h.style.display = 'none');
        } else {
            zoneEl.classList.remove('locked');
            // Réafficher les poignées si sélectionné ET non verrouillé
            // (Mais attention, si on vient de déverrouiller, on veut peut-être voir les poignées tout de suite car on est sélectionné)
             if(selectedZoneId === zoneEl.id) {
                zoneEl.querySelectorAll('.handle').forEach(h => h.style.display = 'block');
             }
        }
        
        // Alignement Horizontal (géré par le texte lui-même)
        contentEl.style.textAlign = inputAlign.value;
        
        // Interlignage
        contentEl.style.lineHeight = inputLineHeight.value;
        
        // Alignement Vertical
        // Comme .zone-content est en flex-column, l'axe principal (vertical) est géré par justify-content
        contentEl.style.justifyContent = mapValignToFlex(inputValign.value);
        
        // Nettoyage des styles conflictuels sur le parent
        zoneEl.style.alignItems = 'normal'; 
        zoneEl.style.justifyContent = 'normal';

        // Appliquer le Copy Fitting si activé
        if (chkCopyfit.checked) {
            applyCopyfit(zoneEl, zonesData[selectedZoneId]);
        } else {
            // Si désactivé, on remet la taille normale définie
            zoneEl.style.fontSize = inputSize.value + 'pt';
        }

        saveToLocalStorage(); // Sauvegarder à chaque modif
    }

    // --- FONCTION COPY FITTING (Ajustement automatique) ---
    function applyCopyfit(zoneEl, maxSizePt) {
        if (!zoneEl) return;
        const contentEl = zoneEl.querySelector('.zone-content');
        // Si on passe un objet data au lieu d'un nombre, on extrait la taille
        const targetSize = typeof maxSizePt === 'object' ? parseInt(maxSizePt.size) : parseInt(maxSizePt); 
        
        if (isNaN(targetSize)) return;

        // Sauvegarder l'alignement vertical actuel pour le restaurer après
        const originalJustifyContent = contentEl.style.justifyContent || 'flex-start';
        
        // Temporairement mettre l'alignement en haut pour des calculs précis
        // (évite les problèmes avec flex-end qui peut fausser scrollHeight)
        contentEl.style.justifyContent = 'flex-start';

        let currentSize = targetSize;
        const minSize = 4; // Taille minimum de sécurité
        
        // 1. On commence par la taille max (Reset)
        zoneEl.style.fontSize = currentSize + 'pt';
        
        // 2. Tant que ça déborde, on réduit
        // On utilise une petite boucle de sécurité pour éviter le freeze navigateur
        let iterations = 0;
        while (
            (contentEl.scrollHeight > zoneEl.clientHeight || 
             contentEl.scrollWidth > zoneEl.clientWidth) && 
            currentSize > minSize &&
            iterations < 100
        ) {
            currentSize -= 0.5; 
            zoneEl.style.fontSize = currentSize + 'pt';
            iterations++;
        }
        
        // Restaurer l'alignement vertical original
        contentEl.style.justifyContent = originalJustifyContent;
    }

    // Helper pour l'alignement vertical flexbox (Axe principal en column)
    function mapValignToFlex(valign) {
        if (valign === 'middle') return 'center';
        if (valign === 'bottom') return 'flex-end';
        return 'flex-start'; // top
    }

    // Attacher les écouteurs
    [inputContent, inputFont, inputSize, inputColor, inputAlign, inputValign, inputBgColor, chkTransparent, chkLock, chkCopyfit, inputLineHeight].forEach(el => {
        el.addEventListener('input', updateActiveZoneData);
        el.addEventListener('change', updateActiveZoneData); // Pour checkbox/color
    });

    // --- 4. SUPPRESSION & DÉSÉLECTION ---
    
    // Désélectionner si clic en dehors (sur le fond ou le workspace)
    document.addEventListener('mousedown', (e) => {
        // Si on clique sur une zone, une poignée ou le panneau de contrôle, on ne fait rien
        if (e.target.closest('.zone') || e.target.closest('.handle') || e.target.closest('.toolbar')) {
            return;
        }
        
        // Sinon, on désélectionne
        deselectAll();
    });

    function deselectAll() {
        if (selectedZoneId) {
            document.getElementById(selectedZoneId)?.classList.remove('selected');
            selectedZoneId = null;
            
            // Désactiver le panneau
            btnDelete.disabled = true;
            coordsPanel.style.opacity = 0.5;
            coordsPanel.style.pointerEvents = 'none';
            lblSelected.innerText = "Aucune";
        }
    }

    btnDelete.addEventListener('click', () => {
        if (selectedZoneId) {
            const el = document.getElementById(selectedZoneId);
            el.remove();
            delete zonesData[selectedZoneId]; // Supprimer de la mémoire
            saveToLocalStorage(); // Sauvegarde après suppression
            
            lblSelected.innerText = "Aucune";
        }
    });

    // --- BOUTON RÉINITIALISER ---
    btnReset.addEventListener('click', () => {
        if (confirm("Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.")) {
            // 1. Supprimer toutes les zones du DOM
            document.querySelectorAll('.zone').forEach(el => el.remove());
            
            // 2. Vider la mémoire
            for (const key in zonesData) delete zonesData[key];
            
            // 3. Réinitialiser le compteur et la sélection
            zoneCounter = 0;
            selectedZoneId = null;
            deselectAll(); // Nettoyer l'interface
            
            // 4. Sauvegarder l'état vide
            saveToLocalStorage();
        }
    });

    // --- 5. DRAG & DROP (Repris et adapté) ---
    let isDragging = false, isResizing = false, currentHandle = null;
    let startX, startY, startLeft, startTop, startW, startH;

    document.addEventListener('mousedown', (e) => {
        if (selectedZoneId) {
            const zone = document.getElementById(selectedZoneId);
            // Vérifier si verrouillé
            if (zonesData[selectedZoneId].locked) return; 
            
            if (e.target.classList.contains('handle') && zone.contains(e.target)) {
                isResizing = true;
                currentHandle = e.target.dataset.pos;
                startX = e.clientX; startY = e.clientY;
                startW = zone.offsetWidth; startH = zone.offsetHeight;
                startLeft = zone.offsetLeft; startTop = zone.offsetTop;
                e.preventDefault();
            } else if (zone.contains(e.target)) {
                isDragging = true;
                startX = e.clientX; startY = e.clientY;
                startLeft = zone.offsetLeft; startTop = zone.offsetTop;
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!selectedZoneId) return;
        const zone = document.getElementById(selectedZoneId);

        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const maxLeft = a4Page.offsetWidth - zone.offsetWidth;
            const maxTop = a4Page.offsetHeight - zone.offsetHeight;

            zone.style.left = Math.max(0, Math.min(startLeft + dx, maxLeft)) + 'px';
            zone.style.top = Math.max(0, Math.min(startTop + dy, maxTop)) + 'px';
            updateGeomDisplay(zone);
        } else if (isResizing) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newW = startW, newH = startH;
            
            // Simplification redimensionnement (juste SE pour l'exemple, ou complet comme avant)
            if (currentHandle.includes('e')) newW = startW + dx;
            if (currentHandle.includes('w')) { /* ... logique complexe ... */ }
            if (currentHandle.includes('s')) newH = startH + dy;
            
            if (newW > 20) zone.style.width = newW + 'px';
            if (newH > 20) zone.style.height = newH + 'px';
            updateGeomDisplay(zone);
            
            // Recalculer le CopyFit pendant le redimensionnement pour effet temps réel
            if (zonesData[selectedZoneId].copyfit) {
                applyCopyfit(zone, zonesData[selectedZoneId].size);
            }
        }
    });

    document.addEventListener('mouseup', () => { isDragging = false; isResizing = false; });

    function updateGeomDisplay(el) {
        inputX.value = (el.offsetLeft * MM_PER_PIXEL).toFixed(2);
        inputY.value = (el.offsetTop * MM_PER_PIXEL).toFixed(2);
        inputW.value = (el.offsetWidth * MM_PER_PIXEL).toFixed(2);
        inputH.value = (el.offsetHeight * MM_PER_PIXEL).toFixed(2);
    }

    // --- 6. SAUVEGARDE / CHARGEMENT LOCAL ---
    function saveToLocalStorage() {
        // On ajoute la position/taille actuelle du DOM dans les données avant de sauver
        for (const [id, data] of Object.entries(zonesData)) {
            const el = document.getElementById(id);
            if (el) {
                data.x = el.offsetLeft;
                data.y = el.offsetTop;
                data.w = el.offsetWidth;
                data.h = el.offsetHeight;
            }
        }
        localStorage.setItem('marketeam_zones', JSON.stringify(zonesData));
        localStorage.setItem('marketeam_zone_counter', zoneCounter);
    }

    function loadFromLocalStorage() {
        const savedZones = localStorage.getItem('marketeam_zones');
        const savedCounter = localStorage.getItem('marketeam_zone_counter');

        if (savedZones && savedCounter) {
            zoneCounter = parseInt(savedCounter);
            const parsedZones = JSON.parse(savedZones);
            
            // Restaurer chaque zone
            for (const [id, data] of Object.entries(parsedZones)) {
                zonesData[id] = data;
                createZoneDOM(id, id.split('-')[1], false); // NE PAS auto-sélectionner pendant le chargement
                
                // Appliquer position/taille sauvegardées
                const zoneEl = document.getElementById(id);
                if (data.x) zoneEl.style.left = data.x + 'px';
                if (data.y) zoneEl.style.top = data.y + 'px';
                if (data.w) zoneEl.style.width = data.w + 'px';
                if (data.h) zoneEl.style.height = data.h + 'px';
                
                // APPLIQUER TOUS LES STYLES AVANT TOUT LE RESTE
                const contentEl = zoneEl.querySelector('.zone-content');
                
                // Couleurs (PRIORITÉ)
                zoneEl.style.color = data.color;
                contentEl.style.color = data.color;
                
                // Fond
                if (data.isTransparent) {
                    zoneEl.style.backgroundColor = 'transparent';
                } else {
                    zoneEl.style.backgroundColor = data.bgColor || '#ffffff';
                }
                
                // Police
                zoneEl.style.fontFamily = data.font + ", sans-serif";
                
                // Alignements (DOIT être avant copyfit car copyfit modifie temporairement justifyContent)
                contentEl.style.textAlign = data.align;
                contentEl.style.justifyContent = mapValignToFlex(data.valign || 'top');
                
                // Interlignage (DOIT être avant copyfit car scrollHeight dépend de lineHeight)
                contentEl.style.lineHeight = (data.lineHeight !== undefined ? data.lineHeight : 1.2);
                
                // Taille (Copyfit ou fixe) - DOIT être après alignements et interlignage
                if (data.copyfit) {
                    applyCopyfit(zoneEl, data.size);
                } else {
                    zoneEl.style.fontSize = data.size + 'pt';
                }
                
                // Verrouillage
                if (data.locked) {
                     zoneEl.classList.add('locked');
                     zoneEl.querySelectorAll('.handle').forEach(h => h.style.display = 'none');
                }
            }
        }
    }

    // Charger au démarrage
    loadFromLocalStorage();

    // --- 7. GÉNÉRATION ET TÉLÉCHARGEMENT JSON FINALE ---
    btnGenerate.addEventListener('click', () => {
        saveToLocalStorage(); // Sauvegarde aussi quand on génère le JSON
        const zonesOutput = [];
        
        // On parcourt l'objet de données
        for (const [id, data] of Object.entries(zonesData)) {
            const el = document.getElementById(id);
            if(el) { // Sécurité si élément DOM existe encore
                zonesOutput.push({
                    id: id,
                    // Positionnement Précis
                    geometry: {
                        x_mm: (el.offsetLeft * MM_PER_PIXEL).toFixed(2),
                        y_mm: (el.offsetTop * MM_PER_PIXEL).toFixed(2),
                        width_mm: (el.offsetWidth * MM_PER_PIXEL).toFixed(2),
                        height_mm: (el.offsetHeight * MM_PER_PIXEL).toFixed(2)
                    },
                    // Style & Contenu
                    content: data.content,
                    style: {
                        font: data.font,
                        size_pt: data.size,
                        color: data.color,
                        align: data.align,
                        valign: data.valign,
                        lineHeight: data.lineHeight !== undefined ? data.lineHeight : 1.2,
                        bgColor: data.isTransparent ? null : data.bgColor,
                        transparent: data.isTransparent,
                        locked: data.locked,
                        copyfit: data.copyfit
                    }
                });
            }
        }

        const output = {
            document: "a4_template.jpg",
            scale_reference: "96 DPI", // Important pour le moteur BAT
            generated_at: new Date().toISOString(),
            zones: zonesOutput
        };
        
        const jsonString = JSON.stringify(output, null, 2);
        
        // Téléchargement du fichier
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "template_vdp.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log("JSON généré et téléchargé.");
    });
});
