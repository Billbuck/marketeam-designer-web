document.addEventListener('DOMContentLoaded', () => {
    // --- ÉLÉMENTS DOM ---
    const a4Page = document.getElementById('a4-page');
    const workspace = document.querySelector('.workspace');
    const workspaceCanvas = document.querySelector('.workspace-canvas');
    const btnAdd = document.getElementById('btn-add-zone');
    const btnAddQr = document.getElementById('btn-add-qr');
    const btnDelete = document.getElementById('btn-delete-zone');
    const btnReset = document.getElementById('btn-reset');
    const btnGenerate = document.getElementById('btn-generate-json');
    const coordsPanel = document.getElementById('coords-panel');
    const lblSelected = document.getElementById('lbl-selected-zone');
    
    // Contrôles de zoom
    const zoomSlider = document.getElementById('zoom-slider');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const zoomValue = document.getElementById('zoom-value');

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

    const textControls = [
        inputContent,
        inputFont,
        inputSize,
        inputColor,
        inputAlign,
        inputValign,
        inputBgColor,
        chkTransparent,
        chkCopyfit,
        inputLineHeight
    ];

    function setTextControlsEnabled(enabled) {
        textControls.forEach(ctrl => {
            if (!ctrl) return;
            ctrl.disabled = !enabled;
        });
        inputContent.placeholder = enabled ? "Ex: Cher {{NOM}}," : "Zone QR statique (non modifiable)";
    }

    setTextControlsEnabled(true);

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
    // Nouvelle structure hiérarchique multipage
    let documentState = {
        currentPageIndex: 0, // 0 = Recto
        pages: [
            { id: 'page-1', name: 'Recto', image: 'a4_template_recto.jpg', zones: {} },
            { id: 'page-2', name: 'Verso', image: 'a4_template_verso.jpg', zones: {} }
        ],
        zoneCounter: 0 // Compteur global pour ID uniques
    };

    // --- FONCTIONS HELPER POUR ACCÈS AUX DONNÉES ---
    function getCurrentPage() {
        return documentState.pages[documentState.currentPageIndex];
    }

    function getCurrentPageZones() {
        return getCurrentPage().zones;
    }

    function setCurrentPageZones(zones) {
        getCurrentPage().zones = zones;
    }

    // Rétrocompatibilité : zonesData pointe vers les zones de la page courante
    // (pour faciliter la migration progressive)
    function getZonesData() {
        return getCurrentPageZones();
    } 

    // --- 1. AJOUTER UNE ZONE ---
    btnAdd.addEventListener('click', () => {
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter; // Synchroniser pour compatibilité
        const id = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        
        // Initialiser les données par défaut pour cette zone
        zonesData[id] = {
            type: 'text',
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

    btnAddQr.addEventListener('click', () => {
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter; // Synchroniser pour compatibilité
        const id = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        zonesData[id] = {
            type: 'qr',
            qrColor: '#000000',
            bgColor: '#ffffff',
            locked: false
        };
        createZoneDOM(id, zoneCounter);
        saveToLocalStorage();
    });

    function createZoneDOM(id, labelNum, autoSelect = true) {
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[id] || {};
        const zoneType = zoneData.type || 'text';
        zonesData[id] = { type: zoneType, ...zoneData };

        const zone = document.createElement('div');
        zone.classList.add('zone');
        if (zoneType === 'qr') {
            zone.classList.add('zone-qr');
        }
        if (autoSelect) {
            zone.classList.add('zone-appear-anim');
            setTimeout(() => zone.classList.remove('zone-appear-anim'), 1000);
        }
        zone.id = id;
        
        if (zoneType === 'qr') {
            const defaultSize = zoneData.w || zoneData.h || 100;
            zone.style.width = defaultSize + 'px';
            zone.style.height = defaultSize + 'px';
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : 50) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : (50 + (labelNum * 20))) + 'px';
            zone.style.backgroundColor = '#ffffff';
            const qrWrapper = document.createElement('div');
            qrWrapper.classList.add('zone-content');
            qrWrapper.innerHTML = getQrPlaceholderSvg();
            zone.appendChild(qrWrapper);
        } else {
            // Style initial par défaut pour le texte
            zone.style.width = '200px';
            zone.style.height = '40px';
            zone.style.left = '50px';
            zone.style.top = (50 + (labelNum * 20)) + 'px';
            zone.style.fontFamily = 'Roboto, sans-serif';
            zone.style.fontSize = '12pt';
            zone.style.textAlign = 'left';
            zone.style.color = '#000000';
            zone.style.backgroundColor = 'transparent';
            zone.style.alignItems = 'flex-start';

            const contentSpan = document.createElement('div');
            contentSpan.classList.add('zone-content');
            contentSpan.innerText = zonesData[id]?.content || '';
            zone.appendChild(contentSpan);
        }

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
        const zonesData = getCurrentPageZones();
        const data = zonesData[id];
        const zoneType = data.type || 'text';
        zonesData[id].type = zoneType;

        if (zoneType === 'qr') {
            setTextControlsEnabled(false);
            inputContent.value = 'Zone QR statique (non modifiable)';
            inputFont.value = 'Roboto';
            inputSize.value = 12;
            inputColor.value = '#000000';
            inputAlign.value = 'center';
            inputValign.value = 'middle';
            inputBgColor.value = '#ffffff';
            chkTransparent.checked = false;
            chkCopyfit.checked = false;
            inputLineHeight.value = 1.0;
        } else {
            setTextControlsEnabled(true);
            inputContent.value = data.content;
            inputFont.value = data.font;
            inputSize.value = data.size;
            inputColor.value = data.color;
            inputAlign.value = data.align;
            inputValign.value = data.valign || 'top'; // Rétrocompatibilité
            inputBgColor.value = data.bgColor || '#ffffff';
            chkTransparent.checked = data.isTransparent !== undefined ? data.isTransparent : true;
            chkCopyfit.checked = data.copyfit || false;
            inputLineHeight.value = data.lineHeight !== undefined ? data.lineHeight : 1.2; // Rétrocompatibilité
        }
        chkLock.checked = data.locked || false;
        
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
        const zonesData = getCurrentPageZones();
        const zoneType = zonesData[selectedZoneId].type || 'text';
        const contentEl = zoneEl.querySelector('.zone-content');

        if (zoneType === 'qr') {
            zonesData[selectedZoneId].locked = chkLock.checked;
            if (chkLock.checked) {
                zoneEl.classList.add('locked');
                zoneEl.querySelectorAll('.handle').forEach(h => h.style.display = 'none');
            } else {
                zoneEl.classList.remove('locked');
                zoneEl.querySelectorAll('.handle').forEach(h => h.style.display = 'block');
            }
            saveToLocalStorage();
            return;
        }

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
        contentEl.style.color = inputColor.value;
        
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
            applyCopyfit(zoneEl, zonesData[selectedZoneId].size);
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

    function getQrPlaceholderSvg() {
        return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#ffffff" />
    <rect x="5" y="5" width="25" height="25" fill="#000000" />
    <rect x="70" y="5" width="25" height="25" fill="#000000" />
    <rect x="5" y="70" width="25" height="25" fill="#000000" />
    <rect x="32" y="32" width="12" height="12" fill="#000000" />
    <rect x="50" y="32" width="12" height="12" fill="#000000" />
    <rect x="32" y="50" width="12" height="12" fill="#000000" />
    <rect x="50" y="50" width="12" height="12" fill="#000000" />
</svg>`;
    }

    // Attacher les écouteurs
    [inputContent, inputFont, inputSize, inputColor, inputAlign, inputValign, inputBgColor, chkTransparent, chkLock, chkCopyfit, inputLineHeight].forEach(el => {
        el.addEventListener('input', updateActiveZoneData);
        el.addEventListener('change', updateActiveZoneData); // Pour checkbox/color
    });

    // --- 4. SUPPRESSION & DÉSÉLECTION ---
    
    // Gestion de la modale de suppression
    const modalOverlay = document.getElementById('confirmation-modal');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalConfirm = document.getElementById('btn-modal-confirm');

    function showDeleteConfirmation() {
        if (selectedZoneId) {
            modalOverlay.classList.remove('hidden');
        }
    }

    function hideDeleteConfirmation() {
        modalOverlay.classList.add('hidden');
    }

    function confirmDeletion() {
        if (selectedZoneId) {
            const el = document.getElementById(selectedZoneId);
            if (el) el.remove();
            const zonesData = getCurrentPageZones();
            delete zonesData[selectedZoneId];
            saveToLocalStorage();
            deselectAll();
        }
        hideDeleteConfirmation();
    }

    // Écouteurs pour la modale
    btnModalCancel.addEventListener('click', hideDeleteConfirmation);
    btnModalConfirm.addEventListener('click', confirmDeletion);
    
    // Fermer la modale en cliquant sur le fond gris
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideDeleteConfirmation();
        }
    });

    // Désélectionner si clic en dehors (sur le fond ou le workspace)
    document.addEventListener('mousedown', (e) => {
        // Si on clique sur une zone, une poignée, le panneau de contrôle ou la modale, on ne fait rien
        if (e.target.closest('.zone') || 
            e.target.closest('.handle') || 
            e.target.closest('.toolbar') ||
            e.target.closest('.modal-box')) {
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
            setTextControlsEnabled(true);
        }
    }

    btnDelete.addEventListener('click', () => {
        showDeleteConfirmation();
    });

    // Raccourci clavier : Touche Suppr pour supprimer
    document.addEventListener('keydown', (e) => {
        // Si la modale de suppression est ouverte
        if (!modalOverlay.classList.contains('hidden')) {
            if (e.key === 'Enter') confirmDeletion();
            if (e.key === 'Escape') hideDeleteConfirmation();
            return;
        }

        // Si la modale de réinitialisation est ouverte, ne pas gérer les autres touches
        if (!resetModal.classList.contains('hidden')) {
            return;
        }

        if (selectedZoneId && (e.key === 'Delete' || e.key === 'Del')) {
            // Ne pas supprimer si l'utilisateur tape dans un input ou textarea
            if (e.target.matches('input, textarea')) return;
            
            showDeleteConfirmation();
        }
    });

    // --- BOUTON RÉINITIALISER ---
    const resetModal = document.getElementById('reset-modal');
    const btnResetCancel = document.getElementById('btn-reset-cancel');
    const btnResetCurrentPage = document.getElementById('btn-reset-current-page');
    const btnResetAllPages = document.getElementById('btn-reset-all-pages');

    function showResetConfirmation() {
        // Afficher ou masquer le bouton "Toutes les pages" selon le nombre de pages
        if (documentState.pages.length > 1) {
            btnResetAllPages.style.display = 'inline-flex';
        } else {
            btnResetAllPages.style.display = 'none';
        }
        resetModal.classList.remove('hidden');
    }

    function hideResetConfirmation() {
        resetModal.classList.add('hidden');
    }

    function resetCurrentPage() {
        // 1. Supprimer toutes les zones du DOM de la page courante
        document.querySelectorAll('.zone').forEach(el => el.remove());
        
        // 2. Vider la mémoire de la page courante uniquement
        const zonesData = getCurrentPageZones();
        for (const key in zonesData) delete zonesData[key];
        
        // 3. Désélectionner
        selectedZoneId = null;
        deselectAll(); // Nettoyer l'interface
        
        // 4. Sauvegarder l'état
        saveToLocalStorage();
        
        hideResetConfirmation();
    }

    function resetAllPages() {
        // 1. Supprimer toutes les zones du DOM
        document.querySelectorAll('.zone').forEach(el => el.remove());
        
        // 2. Vider la mémoire de toutes les pages
        documentState.pages.forEach(page => {
            for (const key in page.zones) delete page.zones[key];
        });
        
        // 3. Réinitialiser le compteur global et la sélection
        documentState.zoneCounter = 0;
        zoneCounter = 0;
        selectedZoneId = null;
        deselectAll(); // Nettoyer l'interface
        
        // 4. Sauvegarder l'état vide
        saveToLocalStorage();
        
        hideResetConfirmation();
    }

    btnReset.addEventListener('click', () => {
        showResetConfirmation();
    });

    btnResetCancel.addEventListener('click', hideResetConfirmation);
    btnResetCurrentPage.addEventListener('click', resetCurrentPage);
    btnResetAllPages.addEventListener('click', resetAllPages);
    
    // Fermer la modale en cliquant sur le fond gris
    resetModal.addEventListener('click', (e) => {
        if (e.target === resetModal) {
            hideResetConfirmation();
        }
    });

    // Raccourci clavier : Escape pour fermer la modale de réinitialisation
    document.addEventListener('keydown', (e) => {
        // Si la modale de réinitialisation est ouverte
        if (!resetModal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                hideResetConfirmation();
            }
        }
    });

    // --- 5. DRAG & DROP (Repris et adapté) ---
    let isDragging = false, isResizing = false, currentHandle = null;
    let startX, startY, startLeft, startTop, startW, startH;

    document.addEventListener('mousedown', (e) => {
        // Si on est en mode pan (Espace pressé ou clic molette), ne pas permettre le drag des zones
        if (spacePressed || e.button === 1) {
            return; // Laisser le pan gérer
        }
        
        if (selectedZoneId) {
            const zone = document.getElementById(selectedZoneId);
            const zonesData = getCurrentPageZones();
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
            const dx = (e.clientX - startX) / zoomLevel;
            const dy = (e.clientY - startY) / zoomLevel;
            const maxLeft = a4Page.offsetWidth - zone.offsetWidth;
            const maxTop = a4Page.offsetHeight - zone.offsetHeight;

            zone.style.left = Math.max(0, Math.min(startLeft + dx, maxLeft)) + 'px';
            zone.style.top = Math.max(0, Math.min(startTop + dy, maxTop)) + 'px';
            updateGeomDisplay(zone);
        } else if (isResizing) {
            const zonesData = getCurrentPageZones();
            const dx = (e.clientX - startX) / zoomLevel;
            const dy = (e.clientY - startY) / zoomLevel;
            let newW = startW, newH = startH;
            
            // Simplification redimensionnement (juste SE pour l'exemple, ou complet comme avant)
            if (currentHandle.includes('e')) newW = startW + dx;
            if (currentHandle.includes('w')) { /* ... logique complexe ... */ }
            if (currentHandle.includes('s')) newH = startH + dy;
            
            if (zonesData[selectedZoneId].type === 'qr') {
                const size = Math.max(40, Math.max(newW, newH));
                zone.style.width = size + 'px';
                zone.style.height = size + 'px';
            } else {
                if (newW > 20) zone.style.width = newW + 'px';
                if (newH > 20) zone.style.height = newH + 'px';
                
                // Recalculer le CopyFit pendant le redimensionnement pour effet temps réel
                if (zonesData[selectedZoneId].copyfit) {
                    applyCopyfit(zone, zonesData[selectedZoneId].size);
                }
            }
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

    // --- 6. SAUVEGARDE / CHARGEMENT LOCAL ---
    function saveToLocalStorage() {
        // On ajoute la position/taille actuelle du DOM dans les données avant de sauver
        const zonesData = getCurrentPageZones();
        for (const [id, data] of Object.entries(zonesData)) {
            const el = document.getElementById(id);
            if (el) {
                data.x = el.offsetLeft;
                data.y = el.offsetTop;
                data.w = el.offsetWidth;
                data.h = el.offsetHeight;
            }
        }
        
        // Synchroniser le compteur global
        documentState.zoneCounter = zoneCounter;
        
        // Sauvegarder la nouvelle structure
        localStorage.setItem('marketeam_document_state', JSON.stringify(documentState));
        
        // Rétrocompatibilité : sauvegarder aussi l'ancien format pour la page courante
        localStorage.setItem('marketeam_zones', JSON.stringify(zonesData));
        localStorage.setItem('marketeam_zone_counter', zoneCounter);
    }

    function loadFromLocalStorage() {
        // Essayer de charger le nouveau format multipage
        const savedState = localStorage.getItem('marketeam_document_state');
        
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                // Vérifier que c'est bien la nouvelle structure
                if (parsedState.pages && Array.isArray(parsedState.pages)) {
                    documentState = parsedState;
                    zoneCounter = documentState.zoneCounter || 0;
                    
                    // FORCER la page 0 (Recto) au chargement initial
                    // (l'utilisateur peut ensuite naviguer manuellement)
                    documentState.currentPageIndex = 0;
                    
                    // Charger la page courante (maintenant Recto)
                    loadCurrentPage();
                    return;
                }
            } catch (e) {
                console.warn('Erreur lors du chargement du nouveau format, migration vers ancien format...', e);
            }
        }
        
        // MIGRATION : Ancien format détecté, migrer vers la page 0 (Recto)
        const savedZones = localStorage.getItem('marketeam_zones');
        const savedCounter = localStorage.getItem('marketeam_zone_counter');

        if (savedZones && savedCounter) {
            console.log('Migration des données anciennes vers le nouveau format multipage...');
            zoneCounter = parseInt(savedCounter);
            documentState.zoneCounter = zoneCounter;
            documentState.currentPageIndex = 0; // Forcer Recto lors de la migration
            const parsedZones = JSON.parse(savedZones);
            
            // Migrer toutes les zones vers la page 0 (Recto)
            documentState.pages[0].zones = parsedZones;
            
            // Charger la page courante
            loadCurrentPage();
            
            // Sauvegarder immédiatement dans le nouveau format
            saveToLocalStorage();
        } else {
            // Aucune donnée sauvegardée : s'assurer qu'on est sur la page 0 (Recto)
            documentState.currentPageIndex = 0;
        }
    }

    function loadCurrentPage() {
        const currentPage = getCurrentPage();
        const zonesData = currentPage.zones;
        
        // Mettre à jour l'image de fond
        const bgImg = document.getElementById('a4-background');
        if (bgImg) {
            bgImg.src = currentPage.image;
        }
        
        // Restaurer chaque zone de la page courante
        for (const [id, data] of Object.entries(zonesData)) {
            zonesData[id] = { type: data.type || 'text', ...data };
            createZoneDOM(id, id.split('-')[1], false); // NE PAS auto-sélectionner pendant le chargement
            
            // Appliquer position/taille sauvegardées
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                if (data.x !== undefined) zoneEl.style.left = data.x + 'px';
                if (data.y !== undefined) zoneEl.style.top = data.y + 'px';
                if (data.w !== undefined) zoneEl.style.width = data.w + 'px';
                if (data.h !== undefined) zoneEl.style.height = data.h + 'px';
                
                // APPLIQUER TOUS LES STYLES AVANT TOUT LE RESTE
                const contentEl = zoneEl.querySelector('.zone-content');
                const zoneType = zonesData[id].type || 'text';
                
                if (zoneType === 'qr') {
                    zoneEl.classList.add('zone-qr');
                    if (contentEl && !contentEl.innerHTML.trim()) {
                        contentEl.innerHTML = getQrPlaceholderSvg();
                    }
                    if (data.locked) {
                        zoneEl.classList.add('locked');
                        zoneEl.querySelectorAll('.handle').forEach(h => h.style.display = 'none');
                    }
                    continue;
                }
                
                // Couleurs (PRIORITÉ)
                if (data.color) {
                    zoneEl.style.color = data.color;
                    if (contentEl) contentEl.style.color = data.color;
                }
                
                // Fond
                if (data.isTransparent) {
                    zoneEl.style.backgroundColor = 'transparent';
                } else {
                    zoneEl.style.backgroundColor = data.bgColor || '#ffffff';
                }
                
                // Police
                if (data.font) {
                    zoneEl.style.fontFamily = data.font + ", sans-serif";
                }
                
                // Alignements (DOIT être avant copyfit car copyfit modifie temporairement justifyContent)
                if (contentEl) {
                    if (data.align) contentEl.style.textAlign = data.align;
                    contentEl.style.justifyContent = mapValignToFlex(data.valign || 'top');
                    
                    // Interlignage (DOIT être avant copyfit car scrollHeight dépend de lineHeight)
                    contentEl.style.lineHeight = (data.lineHeight !== undefined ? data.lineHeight : 1.2);
                }
                
                // Taille (Copyfit ou fixe) - DOIT être après alignements et interlignage
                if (data.copyfit) {
                    applyCopyfit(zoneEl, data.size);
                } else if (data.size) {
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

    // --- NAVIGATION MULTIPAGE ---
    const pageNavButtons = document.querySelectorAll('.page-nav-btn');
    pageNavButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            switchPage(index);
        });
    });

    // Charger au démarrage
    loadFromLocalStorage();
    
    // S'assurer que l'image de fond correspond à la page courante après le chargement
    // (loadFromLocalStorage() force déjà la page 0, mais on double-vérifie)
    const bgImg = document.getElementById('a4-background');
    if (bgImg) {
        bgImg.src = getCurrentPage().image;
    }
    
    // Initialiser l'UI de navigation
    updatePageNavigationUI();

    // --- FONCTION DE CHANGEMENT DE PAGE ---
    function switchPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
            console.warn('Index de page invalide:', pageIndex);
            return;
        }

        // 1. Sauvegarder l'état de la page actuelle (positions, styles)
        saveToLocalStorage();

        // 2. Désélectionner toute zone active
        deselectAll();

        // 3. Vider le workspace (supprimer toutes les zones du DOM)
        document.querySelectorAll('.zone').forEach(el => el.remove());

        // 4. Changer l'index de page courante
        documentState.currentPageIndex = pageIndex;

        // 5. Changer l'image de fond
        const bgImg = document.getElementById('a4-background');
        const currentPage = getCurrentPage();
        if (bgImg) {
            bgImg.src = currentPage.image;
        }

        // 6. Charger et afficher les zones de la nouvelle page
        loadCurrentPage();

        // 7. Remettre le zoom à 100% lors du changement de page
        setZoom(1.0);

        // 8. Mettre à jour l'interface de navigation
        updatePageNavigationUI();

        // 9. Le pan est préservé automatiquement
    }

    function updatePageNavigationUI() {
        // Mettre à jour les boutons de navigation
        const pageButtons = document.querySelectorAll('.page-nav-btn');
        pageButtons.forEach((btn, index) => {
            if (index === documentState.currentPageIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // --- 7. GÉNÉRATION ET TÉLÉCHARGEMENT JSON FINALE ---
    btnGenerate.addEventListener('click', () => {
        saveToLocalStorage(); // Sauvegarde aussi quand on génère le JSON
        
        // Générer le JSON pour toutes les pages
        const pagesOutput = documentState.pages.map((page, pageIndex) => {
            const zonesOutput = [];
            const zonesData = page.zones;
            
            // On parcourt l'objet de données de cette page
            for (const [id, data] of Object.entries(zonesData)) {
                // Note: Les zones du DOM ne sont visibles que pour la page courante
                // Pour les autres pages, on utilise les données sauvegardées
                const el = document.getElementById(id);
                
                let geometry;
                if (el && pageIndex === documentState.currentPageIndex) {
                    // Page courante : utiliser les dimensions du DOM
                    geometry = {
                        x_mm: (el.offsetLeft * MM_PER_PIXEL).toFixed(2),
                        y_mm: (el.offsetTop * MM_PER_PIXEL).toFixed(2),
                        width_mm: (el.offsetWidth * MM_PER_PIXEL).toFixed(2),
                        height_mm: (el.offsetHeight * MM_PER_PIXEL).toFixed(2)
                    };
                } else {
                    // Autres pages : utiliser les données sauvegardées
                    geometry = {
                        x_mm: (data.x * MM_PER_PIXEL).toFixed(2),
                        y_mm: (data.y * MM_PER_PIXEL).toFixed(2),
                        width_mm: (data.w * MM_PER_PIXEL).toFixed(2),
                        height_mm: (data.h * MM_PER_PIXEL).toFixed(2)
                    };
                }

                const zoneType = data.type || 'text';
                if (zoneType === 'qr') {
                    zonesOutput.push({
                        id,
                        type: 'qr',
                        geometry,
                        qr: {
                            color: data.qrColor || '#000000',
                            background: '#ffffff'
                        },
                        locked: data.locked || false
                    });
                } else {
                    zonesOutput.push({
                        id,
                        type: 'text',
                        geometry,
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
            
            return {
                page_id: page.id,
                page_name: page.name,
                image: page.image,
                zones: zonesOutput
            };
        });

        const output = {
            document: "a4_template_multipage",
            scale_reference: "96 DPI", // Important pour le moteur BAT
            generated_at: new Date().toISOString(),
            pages: pagesOutput
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

    // --- 8. FONCTIONNALITÉ ZOOM ---
    let zoomLevel = 1.0; // 100% par défaut
    const PAGE_WIDTH = 794;
    const PAGE_HEIGHT = 1123;
    const CANVAS_PADDING = 60;

    function setZoom(level) {
        // Limiter le zoom entre 25% et 200%
        zoomLevel = Math.max(0.25, Math.min(2.0, level));
        
        // Appliquer le zoom avec transform: scale()
        a4Page.style.transform = `scale(${zoomLevel})`;
        a4Page.style.transformOrigin = 'center center';
        
        // Calculer les dimensions du document zoomé
        const scaledWidth = PAGE_WIDTH * zoomLevel;
        const scaledHeight = PAGE_HEIGHT * zoomLevel;
        
        // Dimensions nécessaires pour le canvas (document + marge grise)
        const neededWidth = scaledWidth + CANVAS_PADDING * 2;
        const neededHeight = scaledHeight + CANVAS_PADDING * 2;
        
        // Dimensions du workspace (viewport)
        const workspaceWidth = workspace.clientWidth;
        const workspaceHeight = workspace.clientHeight;
        
        // Le canvas doit être au moins aussi grand que le workspace (pour le centrage)
        // ou plus grand si le document zoomé le nécessite
        const canvasWidth = Math.max(workspaceWidth, neededWidth);
        const canvasHeight = Math.max(workspaceHeight, neededHeight);
        
        // Appliquer la taille au canvas
        workspaceCanvas.style.width = canvasWidth + 'px';
        workspaceCanvas.style.height = canvasHeight + 'px';
        
        // Mettre à jour l'interface
        zoomSlider.value = Math.round(zoomLevel * 100);
        zoomValue.textContent = Math.round(zoomLevel * 100) + '%';
        
        // Centrer le document dans le workspace
        centerWorkspace();
    }

    function centerWorkspace() {
        // Dimensions du canvas et du workspace
        const canvasWidth = workspaceCanvas.offsetWidth;
        const canvasHeight = workspaceCanvas.offsetHeight;
        const workspaceWidth = workspace.clientWidth;
        const workspaceHeight = workspace.clientHeight;
        
        // Si le canvas est plus grand que le workspace, on centre via scroll
        // Sinon, le flexbox du canvas centre automatiquement le document
        const scrollLeft = Math.max(0, (canvasWidth - workspaceWidth) / 2);
        const scrollTop = Math.max(0, (canvasHeight - workspaceHeight) / 2);
        
        workspace.scrollLeft = scrollLeft;
        workspace.scrollTop = scrollTop;
    }

    // Event listeners pour les contrôles de zoom
    zoomSlider.addEventListener('input', (e) => {
        const level = parseInt(e.target.value) / 100;
        setZoom(level);
    });

    btnZoomIn.addEventListener('click', () => {
        setZoom(zoomLevel + 0.1);
    });

    btnZoomOut.addEventListener('click', () => {
        setZoom(zoomLevel - 0.1);
    });

    // Zoom avec molette (Ctrl + Molette)
    workspace.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(zoomLevel + delta);
        }
    }, { passive: false });

    // Initialiser le zoom à 100%
    setZoom(1.0);

    // --- 9. FONCTIONNALITÉ PAN (Déplacement du document) ---
    let isPanning = false;
    let panStartX, panStartY, panStartScrollLeft, panStartScrollTop;
    let spacePressed = false;
    let panPotential = false; // Pour le pan permanent (détection du mouvement)
    const PAN_THRESHOLD = 5; // Seuil de mouvement en pixels avant d'activer le pan

    // Détecter quand Espace est pressé
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault(); // Empêcher le scroll de page
            spacePressed = true;
            workspace.style.cursor = 'grab';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spacePressed = false;
            if (!isPanning) {
                workspace.style.cursor = '';
            }
        }
    });

    // Détecter le début du pan : Espace + clic gauche OU clic molette OU clic gauche sur fond (pan permanent)
    document.addEventListener('mousedown', (e) => {
        // Ne pas activer le pan si on clique sur une zone ou un élément interactif
        if (e.target.closest('.zone') || e.target.closest('.toolbar') || e.target.closest('button')) {
            return;
        }

        // Pan avec Espace + clic gauche (immédiat)
        if (e.button === 0 && spacePressed) {
            e.preventDefault();
            e.stopPropagation();
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartScrollLeft = workspace.scrollLeft;
            panStartScrollTop = workspace.scrollTop;
            workspace.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
        // Pan avec clic molette (immédiat)
        else if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartScrollLeft = workspace.scrollLeft;
            panStartScrollTop = workspace.scrollTop;
            workspace.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }
        // Pan permanent : clic gauche sur le fond (avec seuil de mouvement)
        else if (e.button === 0) {
            // On enregistre la position mais on n'active pas le pan tout de suite
            // On attend de voir si l'utilisateur bouge la souris
            panPotential = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panStartScrollLeft = workspace.scrollLeft;
            panStartScrollTop = workspace.scrollTop;
        }
    });

    // Déplacer le document pendant le pan
    document.addEventListener('mousemove', (e) => {
        // Pan permanent : activer le pan si on dépasse le seuil de mouvement
        if (panPotential && !isPanning && !isDragging && !isResizing) {
            const dx = Math.abs(e.clientX - panStartX);
            const dy = Math.abs(e.clientY - panStartY);
            
            // Si on a bougé de plus de PAN_THRESHOLD pixels, activer le pan
            if (dx > PAN_THRESHOLD || dy > PAN_THRESHOLD) {
                isPanning = true;
                panPotential = false;
                workspace.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
            }
        }
        
        // Pan actif : déplacer le document
        if (isPanning && !isDragging && !isResizing) {
            e.preventDefault();
            const dx = e.clientX - panStartX;
            const dy = e.clientY - panStartY;
            
            workspace.scrollLeft = panStartScrollLeft - dx;
            workspace.scrollTop = panStartScrollTop - dy;
        }
    });

    // Arrêter le pan
    document.addEventListener('mouseup', (e) => {
        if (isPanning) {
            isPanning = false;
            workspace.style.cursor = spacePressed ? 'grab' : '';
            document.body.style.userSelect = '';
        }
        
        // Si on n'a pas activé le pan (clic simple), permettre la désélection normale
        if (panPotential && !isPanning) {
            panPotential = false;
            // Le clic simple sera géré par le listener de désélection existant
        }
    });

});
