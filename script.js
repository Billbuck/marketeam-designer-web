document.addEventListener('DOMContentLoaded', () => {
    // --- ÉLÉMENTS DOM ---
    const a4Page = document.getElementById('a4-page');
    const btnAdd = document.getElementById('btn-add-zone');
    const btnDelete = document.getElementById('btn-delete-zone');
    const coordsPanel = document.getElementById('coords-panel');
    const lblSelected = document.getElementById('lbl-selected-zone');

    // Inputs du formulaire
    const inputContent = document.getElementById('input-content');
    const inputFont = document.getElementById('input-font');
    const inputSize = document.getElementById('input-size');
    const inputColor = document.getElementById('input-color');
    const inputAlign = document.getElementById('input-align');

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
            align: 'left'
        };

        createZoneDOM(id, zoneCounter);
    });

    function createZoneDOM(id, labelNum) {
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
        selectZone(id);
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

        // Mise à jour visuelle (Aperçu approximatif)
        contentEl.innerText = inputContent.value;
        zoneEl.style.fontFamily = inputFont.value + ", sans-serif";
        // Note: Le rendu 'pt' web n'est pas 100% identique au print, mais proche
        zoneEl.style.fontSize = inputSize.value + 'pt'; 
        zoneEl.style.color = inputColor.value;
        zoneEl.style.justifyContent = mapAlignToFlex(inputAlign.value); // Pour centrer verticalement/horizontalement
        zoneEl.style.textAlign = inputAlign.value;
    }

    // Helper pour l'alignement flexbox CSS
    function mapAlignToFlex(align) {
        if (align === 'center') return 'center';
        if (align === 'right') return 'flex-end';
        return 'flex-start'; // left
    }

    // Attacher les écouteurs
    [inputContent, inputFont, inputSize, inputColor, inputAlign].forEach(el => {
        el.addEventListener('input', updateActiveZoneData);
    });

    // --- 4. SUPPRESSION ---
    btnDelete.addEventListener('click', () => {
        if (selectedZoneId) {
            const el = document.getElementById(selectedZoneId);
            el.remove();
            delete zonesData[selectedZoneId]; // Supprimer de la mémoire
            
            selectedZoneId = null;
            btnDelete.disabled = true;
            coordsPanel.style.opacity = 0.5;
            coordsPanel.style.pointerEvents = 'none';
            lblSelected.innerText = "Aucune";
        }
    });

    // --- 5. DRAG & DROP (Repris et adapté) ---
    let isDragging = false, isResizing = false, currentHandle = null;
    let startX, startY, startLeft, startTop, startW, startH;

    document.addEventListener('mousedown', (e) => {
        if (selectedZoneId) {
            const zone = document.getElementById(selectedZoneId);
            
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
        }
    });

    document.addEventListener('mouseup', () => { isDragging = false; isResizing = false; });

    function updateGeomDisplay(el) {
        inputX.value = (el.offsetLeft * MM_PER_PIXEL).toFixed(2);
        inputY.value = (el.offsetTop * MM_PER_PIXEL).toFixed(2);
        inputW.value = (el.offsetWidth * MM_PER_PIXEL).toFixed(2);
        inputH.value = (el.offsetHeight * MM_PER_PIXEL).toFixed(2);
    }

    // --- 6. GÉNÉRATION JSON FINALE ---
    window.generateJson = function() {
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
                        align: data.align
                    }
                });
            }
        }

        const output = {
            document: "a4_template.jpg",
            scale_reference: "96 DPI", // Important pour le moteur BAT
            zones: zonesOutput
        };
        
        return JSON.stringify(output, null, 2);
    };
});