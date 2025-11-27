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
    const chkBold = document.getElementById('chk-bold'); // Gras
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
        chkBold,
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
    let selectedZoneIds = []; // Tableau pour la sélection multiple
    let copiedZoneData = null; // Données de la zone copiée pour le copier-coller
    
    // Déclarer zoomLevel tôt pour qu'il soit disponible partout
    let zoomLevel = 1.0; // 100% par défaut

    // --- SYSTÈME DE FORMATS DE DOCUMENT ---
    // Formats prédéfinis (dimensions en pixels à 96 DPI)
    const DOCUMENT_FORMATS = {
        'A4': { width: 794, height: 1123, name: 'A4' },
        'A3': { width: 1123, height: 1587, name: 'A3' },
        'A5': { width: 559, height: 794, name: 'A5' },
        'Letter': { width: 816, height: 1056, name: 'Letter (US)' },
        'Legal': { width: 816, height: 1344, name: 'Legal (US)' }
    };

    // Format par défaut (A4)
    const DEFAULT_FORMAT = 'A4';

    // --- STOCKAGE DES DONNÉES (Le "Cerveau") ---
    // Nouvelle structure hiérarchique multipage avec dimensions
    let documentState = {
        currentPageIndex: 0, // 0 = Recto
        pages: [
            { 
                id: 'page-1', 
                name: 'Recto', 
                image: 'a4_template_recto.jpg', 
                format: DEFAULT_FORMAT, // Format de la page
                width: DOCUMENT_FORMATS[DEFAULT_FORMAT].width, // Largeur en pixels
                height: DOCUMENT_FORMATS[DEFAULT_FORMAT].height, // Hauteur en pixels
                zones: {} 
            },
            { 
                id: 'page-2', 
                name: 'Verso', 
                image: 'a4_template_verso.jpg', 
                format: DEFAULT_FORMAT,
                width: DOCUMENT_FORMATS[DEFAULT_FORMAT].width,
                height: DOCUMENT_FORMATS[DEFAULT_FORMAT].height,
                zones: {} 
            }
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

    // --- FONCTIONS HELPER POUR LES DIMENSIONS DE PAGE ---
    // Obtenir la largeur de la page courante (en pixels)
    function getPageWidth() {
        const currentPage = getCurrentPage();
        // Priorité : données sauvegardées > dimensions du DOM > format par défaut
        if (currentPage && currentPage.width) {
            return currentPage.width;
        }
        // Fallback : lire depuis le DOM si disponible
        if (a4Page && a4Page.offsetWidth > 0) {
            return a4Page.offsetWidth;
        }
        // Fallback final : format par défaut
        return DOCUMENT_FORMATS[DEFAULT_FORMAT].width;
    }

    // Obtenir la hauteur de la page courante (en pixels)
    function getPageHeight() {
        const currentPage = getCurrentPage();
        // Priorité : données sauvegardées > dimensions du DOM > format par défaut
        if (currentPage && currentPage.height) {
            return currentPage.height;
        }
        // Fallback : lire depuis le DOM si disponible
        if (a4Page && a4Page.offsetHeight > 0) {
            return a4Page.offsetHeight;
        }
        // Fallback final : format par défaut
        return DOCUMENT_FORMATS[DEFAULT_FORMAT].height;
    }

    // Appliquer les dimensions de la page courante au DOM
    function applyPageDimensions() {
        const width = getPageWidth();
        const height = getPageHeight();
        if (a4Page) {
            a4Page.style.width = width + 'px';
            a4Page.style.height = height + 'px';
        }
    }

    // --- FONCTION POUR CALCULER LE CENTRE DE LA VUE ACTUELLE ---
    function getCenterOfView() {
        // Utiliser zoomLevel s'il est défini, sinon 1.0 par défaut
        const currentZoom = typeof zoomLevel !== 'undefined' ? zoomLevel : 1.0;
        
        // Calculer le centre du viewport (workspace visible)
        const viewportCenterX = workspace.scrollLeft + workspace.clientWidth / 2;
        const viewportCenterY = workspace.scrollTop + workspace.clientHeight / 2;
        
        // Obtenir la position de #a4-page dans le workspace-canvas
        const a4PageRect = a4Page.getBoundingClientRect();
        const canvasRect = workspaceCanvas.getBoundingClientRect();
        
        // Position relative de #a4-page dans le canvas
        const a4PageOffsetX = a4PageRect.left - canvasRect.left + workspace.scrollLeft;
        const a4PageOffsetY = a4PageRect.top - canvasRect.top + workspace.scrollTop;
        
        // Calculer la position relative au centre de #a4-page (sans zoom)
        const centerX = (viewportCenterX - a4PageOffsetX) / currentZoom;
        const centerY = (viewportCenterY - a4PageOffsetY) / currentZoom;
        
        // S'assurer que la position est dans les limites de la page
        const pageWidth = getPageWidth();
        const pageHeight = getPageHeight();
        const maxX = Math.max(0, Math.min(pageWidth, centerX));
        const maxY = Math.max(0, Math.min(pageHeight, centerY));
        
        return { x: maxX, y: maxY };
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
            bold: false, // Gras désactivé par défaut
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
        
        // Calculer le centre de la vue pour positionner la nouvelle zone
        const centerView = getCenterOfView();
        const defaultZoneWidth = zoneType === 'qr' ? 100 : 200;
        const defaultZoneHeight = zoneType === 'qr' ? 100 : 40;
        
        // Positionner au centre de la vue, moins la moitié de la taille de la zone
        const zoneX = centerView.x - (defaultZoneWidth / 2);
        const zoneY = centerView.y - (defaultZoneHeight / 2);
        
        if (zoneType === 'qr') {
            const defaultSize = zoneData.w || zoneData.h || 100;
            zone.style.width = defaultSize + 'px';
            zone.style.height = defaultSize + 'px';
            // Utiliser la position sauvegardée si elle existe, sinon le centre de la vue
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : zoneX) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : zoneY) + 'px';
            zone.style.backgroundColor = '#ffffff';
            const qrWrapper = document.createElement('div');
            qrWrapper.classList.add('zone-content');
            qrWrapper.innerHTML = getQrPlaceholderSvg();
            zone.appendChild(qrWrapper);
        } else {
            // Style initial par défaut pour le texte
            zone.style.width = '200px';
            zone.style.height = '40px';
            // Utiliser la position sauvegardée si elle existe, sinon le centre de la vue
            zone.style.left = (zoneData.x !== undefined ? zoneData.x : zoneX) + 'px';
            zone.style.top = (zoneData.y !== undefined ? zoneData.y : zoneY) + 'px';
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
            selectZone(id, e);
        });

        a4Page.appendChild(zone);
        if (autoSelect) {
            selectZone(id);
        }
    }

    // --- COPIE/COLLER DE ZONES ---
    
    // Copier la zone sélectionnée
    function copySelectedZone() {
        // Vérifier qu'une seule zone est sélectionnée
        if (selectedZoneIds.length !== 1) {
            return; // Ne rien faire si aucune zone ou plusieurs zones sélectionnées
        }
        
        const zoneId = selectedZoneIds[0];
        const zonesData = getCurrentPageZones();
        const zoneData = zonesData[zoneId];
        
        // Vérifier que c'est une zone de texte (pas QR)
        if (!zoneData || zoneData.type !== 'text') {
            return; // Ne copier que les zones de texte
        }
        
        const zoneEl = document.getElementById(zoneId);
        if (!zoneEl) return;
        
        // Copier toutes les propriétés de la zone
        copiedZoneData = {
            type: 'text',
            content: zoneData.content || '',
            font: zoneData.font || 'Roboto',
            size: zoneData.size || 12,
            color: zoneData.color || '#000000',
            align: zoneData.align || 'left',
            valign: zoneData.valign || 'top',
            bgColor: zoneData.bgColor || '#ffffff',
            isTransparent: zoneData.isTransparent !== undefined ? zoneData.isTransparent : true,
            locked: false, // Toujours réinitialiser à false pour la copie
            copyfit: zoneData.copyfit || false,
            bold: zoneData.bold || false,
            lineHeight: zoneData.lineHeight !== undefined ? zoneData.lineHeight : 1.2,
            // Géométrie : utiliser les dimensions actuelles du DOM
            w: zoneEl.offsetWidth,
            h: zoneEl.offsetHeight,
            // Position de référence (sera décalée lors du collage)
            x: zoneEl.offsetLeft,
            y: zoneEl.offsetTop
        };
    }
    
    // Coller la zone copiée
    function pasteZone() {
        // Vérifier qu'il y a des données copiées
        if (!copiedZoneData) {
            return; // Rien à coller
        }
        
        // Créer un nouvel ID pour la zone dupliquée
        documentState.zoneCounter++;
        zoneCounter = documentState.zoneCounter;
        const newId = `zone-${zoneCounter}`;
        const zonesData = getCurrentPageZones();
        
        // Créer une copie des données avec un décalage de position
        const pageWidth = getPageWidth();
        const pageHeight = getPageHeight();
        const offsetY = 20; // Décalage de 20px vers le bas
        
        // Calculer la nouvelle position (20px en dessous)
        const newX = copiedZoneData.x;
        const newY = Math.min(copiedZoneData.y + offsetY, pageHeight - copiedZoneData.h);
        
        // Créer les données de la nouvelle zone
        zonesData[newId] = {
            type: 'text',
            content: copiedZoneData.content,
            font: copiedZoneData.font,
            size: copiedZoneData.size,
            color: copiedZoneData.color,
            align: copiedZoneData.align,
            valign: copiedZoneData.valign,
            bgColor: copiedZoneData.bgColor,
            isTransparent: copiedZoneData.isTransparent,
            locked: false, // Toujours false pour la copie
            copyfit: copiedZoneData.copyfit,
            bold: copiedZoneData.bold,
            lineHeight: copiedZoneData.lineHeight,
            // Position et taille
            x: newX,
            y: newY,
            w: copiedZoneData.w,
            h: copiedZoneData.h
        };
        
        // Créer la zone dans le DOM
        createZoneDOM(newId, zoneCounter, true);
        
        // Appliquer tous les styles depuis les données copiées
        const newZoneEl = document.getElementById(newId);
        if (newZoneEl) {
            const contentEl = newZoneEl.querySelector('.zone-content');
            const zoneData = zonesData[newId];
            
            // Position et taille
            newZoneEl.style.left = newX + 'px';
            newZoneEl.style.top = newY + 'px';
            newZoneEl.style.width = zoneData.w + 'px';
            newZoneEl.style.height = zoneData.h + 'px';
            
            // Contenu
            if (contentEl) {
                contentEl.innerText = zoneData.content || '';
            }
            
            // Police
            newZoneEl.style.fontFamily = zoneData.font + ", sans-serif";
            
            // Taille (Copyfit ou fixe)
            if (zoneData.copyfit) {
                applyCopyfit(newZoneEl, zoneData.size);
            } else {
                newZoneEl.style.fontSize = zoneData.size + 'pt';
            }
            
            // Gras
            if (zoneData.bold) {
                newZoneEl.style.fontWeight = 'bold';
                if (contentEl) contentEl.style.fontWeight = 'bold';
            } else {
                newZoneEl.style.fontWeight = 'normal';
                if (contentEl) contentEl.style.fontWeight = 'normal';
            }
            
            // Couleur
            newZoneEl.style.color = zoneData.color;
            if (contentEl) contentEl.style.color = zoneData.color;
            
            // Fond
            if (zoneData.isTransparent) {
                newZoneEl.style.backgroundColor = 'transparent';
            } else {
                newZoneEl.style.backgroundColor = zoneData.bgColor;
            }
            
            // Alignements
            if (contentEl) {
                contentEl.style.textAlign = zoneData.align;
                contentEl.style.justifyContent = mapValignToFlex(zoneData.valign);
                contentEl.style.lineHeight = zoneData.lineHeight;
            }
        }
        
        // Sauvegarder
        saveToLocalStorage();
    }

    // --- 2. SÉLECTION MULTIPLE ---
    
    // Ajouter une zone à la sélection
    function addToSelection(id) {
        if (!selectedZoneIds.includes(id)) {
            selectedZoneIds.push(id);
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                zoneEl.classList.add('selected');
            }
            updateSelectionUI();
        }
    }

    // Retirer une zone de la sélection
    function removeFromSelection(id) {
        const index = selectedZoneIds.indexOf(id);
        if (index > -1) {
            selectedZoneIds.splice(index, 1);
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                zoneEl.classList.remove('selected');
            }
            updateSelectionUI();
        }
    }

    // Mettre à jour l'affichage des poignées selon la sélection
    function updateHandlesVisibility() {
        const count = selectedZoneIds.length;
        const zonesData = getCurrentPageZones();
        
        // D'abord, masquer les poignées de TOUTES les zones de la page
        const allZones = document.querySelectorAll('.zone');
        allZones.forEach(zoneEl => {
            const handles = zoneEl.querySelectorAll('.handle');
            handles.forEach(h => h.style.display = 'none');
        });
        
        // Ensuite, afficher les poignées uniquement pour les zones sélectionnées (si sélection unique et non verrouillée)
        if (count === 1) {
            const zoneId = selectedZoneIds[0];
            const zoneEl = document.getElementById(zoneId);
            if (zoneEl) {
                const zoneData = zonesData[zoneId];
                const isLocked = zoneData && zoneData.locked;
                
                if (!isLocked) {
                    // Sélection unique et non verrouillée : afficher les poignées
                    const handles = zoneEl.querySelectorAll('.handle');
                    handles.forEach(h => h.style.display = 'block');
                }
            }
        }
    }

    // Mettre à jour l'interface selon la sélection
    function updateSelectionUI() {
        const count = selectedZoneIds.length;
        
        if (count === 0) {
            // Aucune sélection
            btnDelete.disabled = true;
            coordsPanel.style.display = 'none';
            coordsPanel.style.pointerEvents = 'none';
            lblSelected.innerText = "-";
        } else if (count === 1) {
            // Sélection unique : afficher les propriétés de la zone
            const id = selectedZoneIds[0];
            btnDelete.disabled = false;
            coordsPanel.style.display = 'block';
            coordsPanel.style.pointerEvents = 'auto';
            lblSelected.innerText = `Zone ${id.split('-')[1]}`;
            
            // Charger les données de la zone unique
            loadZoneDataToForm(id);
        } else {
            // Sélection multiple : afficher le nombre de zones
            btnDelete.disabled = false;
            coordsPanel.style.display = 'block';
            coordsPanel.style.pointerEvents = 'auto';
            lblSelected.innerText = `${count} zones sélectionnées`;
            
            // Masquer ou désactiver les champs de propriétés en mode multi-sélection
            setMultiSelectionMode(true);
        }
        
        // Mettre à jour l'affichage des poignées
        updateHandlesVisibility();
        
        // Afficher/masquer les sections d'alignement et taille
        updateAlignmentToolbarVisibility();
    }

    // Charger les données d'une zone dans le formulaire
    function loadZoneDataToForm(id) {
        const zonesData = getCurrentPageZones();
        const data = zonesData[id];
        if (!data) return;
        
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
            chkBold.checked = false;
            inputLineHeight.value = 1.0;
        } else {
            setTextControlsEnabled(true);
            inputContent.value = data.content || '';
            inputFont.value = data.font || 'Roboto';
            inputSize.value = data.size || 12;
            inputColor.value = data.color || '#000000';
            inputAlign.value = data.align || 'left';
            inputValign.value = data.valign || 'top';
            inputBgColor.value = data.bgColor || '#ffffff';
            chkTransparent.checked = data.isTransparent !== undefined ? data.isTransparent : true;
            chkCopyfit.checked = data.copyfit || false;
            chkBold.checked = data.bold || false;
            inputLineHeight.value = data.lineHeight !== undefined ? data.lineHeight : 1.2;
        }
        chkLock.checked = data.locked || false;
        
        // Gestion état UI couleur fond
        inputBgColor.disabled = chkTransparent.checked;

        // Mettre à jour les géométries
        const zoneEl = document.getElementById(id);
        if (zoneEl) {
            updateGeomDisplay(zoneEl);
        }
        
        // Désactiver le mode multi-sélection
        setMultiSelectionMode(false);
    }

    // Activer/désactiver le mode multi-sélection dans le formulaire
    function setMultiSelectionMode(enabled) {
        // Masquer/afficher tout le conteneur des propriétés individuelles
        const propertiesContent = document.getElementById('zone-properties-content');
        if (propertiesContent) {
            propertiesContent.style.display = enabled ? 'none' : '';
        }
        
        // Désactiver tous les champs en mode multi-sélection (pour sécurité, même si masqués)
        textControls.forEach(ctrl => {
            if (ctrl) {
                ctrl.disabled = enabled;
            }
        });
        // Masquer les géométries en mode multi-sélection
        const geomInputs = [inputX, inputY, inputW, inputH];
        geomInputs.forEach(input => {
            if (input) {
                input.style.display = enabled ? 'none' : '';
            }
        });
    }

    // Mettre à jour la visibilité de la toolbar d'alignement, taille et espacement
    function updateAlignmentToolbarVisibility() {
        const alignmentSection = document.getElementById('alignment-section');
        const sizeSection = document.getElementById('size-section');
        const spacingSection = document.getElementById('spacing-section');
        const count = selectedZoneIds.length;
        
        if (alignmentSection) {
            alignmentSection.style.display = count >= 2 ? 'block' : 'none';
        }
        if (sizeSection) {
            sizeSection.style.display = count >= 2 ? 'block' : 'none';
        }
        if (spacingSection) {
            spacingSection.style.display = count >= 3 ? 'block' : 'none';
        }
    }

    // --- FONCTIONS D'ALIGNEMENT ---
    
    // Aligner les zones sélectionnées par rapport à la première zone (référence)
    function alignZones(direction) {
        if (selectedZoneIds.length < 2) return;
        
        const referenceId = selectedZoneIds[0];
        const referenceZone = document.getElementById(referenceId);
        if (!referenceZone) return;
        
        const refRect = {
            left: referenceZone.offsetLeft,
            top: referenceZone.offsetTop,
            right: referenceZone.offsetLeft + referenceZone.offsetWidth,
            bottom: referenceZone.offsetTop + referenceZone.offsetHeight,
            centerX: referenceZone.offsetLeft + referenceZone.offsetWidth / 2,
            centerY: referenceZone.offsetTop + referenceZone.offsetHeight / 2
        };
        
        // Aligner toutes les autres zones par rapport à la référence
        for (let i = 1; i < selectedZoneIds.length; i++) {
            const zoneId = selectedZoneIds[i];
            const zone = document.getElementById(zoneId);
            if (!zone) continue;
            
            const zonesData = getCurrentPageZones();
            if (zonesData[zoneId] && zonesData[zoneId].locked) continue; // Ignorer les zones verrouillées
            
            switch(direction) {
                case 'left':
                    zone.style.left = refRect.left + 'px';
                    break;
                case 'center':
                    zone.style.left = (refRect.centerX - zone.offsetWidth / 2) + 'px';
                    break;
                case 'right':
                    zone.style.left = (refRect.right - zone.offsetWidth) + 'px';
                    break;
                case 'top':
                    zone.style.top = refRect.top + 'px';
                    break;
                case 'middle':
                    zone.style.top = (refRect.centerY - zone.offsetHeight / 2) + 'px';
                    break;
                case 'bottom':
                    zone.style.top = (refRect.bottom - zone.offsetHeight) + 'px';
                    break;
            }
            
            // S'assurer que la zone reste dans les limites de la page
            const maxLeft = a4Page.offsetWidth - zone.offsetWidth;
            const maxTop = a4Page.offsetHeight - zone.offsetHeight;
            zone.style.left = Math.max(0, Math.min(parseFloat(zone.style.left), maxLeft)) + 'px';
            zone.style.top = Math.max(0, Math.min(parseFloat(zone.style.top), maxTop)) + 'px';
        }
        
        saveToLocalStorage();
    }

    // --- FONCTIONS DE TAILLE ---
    
    // Appliquer la même largeur que la première zone (référence)
    function applySameWidth() {
        if (selectedZoneIds.length < 2) return;
        
        const referenceId = selectedZoneIds[0];
        const referenceZone = document.getElementById(referenceId);
        if (!referenceZone) return;
        
        const refWidth = referenceZone.offsetWidth;
        const zonesData = getCurrentPageZones();
        
        for (let i = 1; i < selectedZoneIds.length; i++) {
            const zoneId = selectedZoneIds[i];
            const zone = document.getElementById(zoneId);
            if (!zone) continue;
            
            if (zonesData[zoneId] && zonesData[zoneId].locked) continue; // Ignorer les zones verrouillées
            
            // Pour les QR codes, appliquer aussi la hauteur
            if (zonesData[zoneId] && zonesData[zoneId].type === 'qr') {
                zone.style.width = refWidth + 'px';
                zone.style.height = refWidth + 'px';
            } else {
                zone.style.width = refWidth + 'px';
            }
            
            // S'assurer que la zone reste dans les limites
            const maxLeft = a4Page.offsetWidth - zone.offsetWidth;
            const currentLeft = parseFloat(zone.style.left) || 0;
            zone.style.left = Math.max(0, Math.min(currentLeft, maxLeft)) + 'px';
        }
        
        saveToLocalStorage();
    }

    // Appliquer la même hauteur que la première zone (référence)
    function applySameHeight() {
        if (selectedZoneIds.length < 2) return;
        
        const referenceId = selectedZoneIds[0];
        const referenceZone = document.getElementById(referenceId);
        if (!referenceZone) return;
        
        const refHeight = referenceZone.offsetHeight;
        const zonesData = getCurrentPageZones();
        
        for (let i = 1; i < selectedZoneIds.length; i++) {
            const zoneId = selectedZoneIds[i];
            const zone = document.getElementById(zoneId);
            if (!zone) continue;
            
            if (zonesData[zoneId] && zonesData[zoneId].locked) continue; // Ignorer les zones verrouillées
            
            // Pour les QR codes, appliquer aussi la largeur
            if (zonesData[zoneId] && zonesData[zoneId].type === 'qr') {
                zone.style.height = refHeight + 'px';
                zone.style.width = refHeight + 'px';
            } else {
                zone.style.height = refHeight + 'px';
            }
            
            // S'assurer que la zone reste dans les limites
            const maxTop = a4Page.offsetHeight - zone.offsetHeight;
            const currentTop = parseFloat(zone.style.top) || 0;
            zone.style.top = Math.max(0, Math.min(currentTop, maxTop)) + 'px';
        }
        
        saveToLocalStorage();
    }

    // SÉLECTIONNER UNE ZONE (avec gestion Ctrl+clic)
    function selectZone(id, event = null) {
        const isCtrlPressed = event && (event.ctrlKey || event.metaKey);
        const isAlreadySelected = selectedZoneIds.includes(id);
        
        if (isCtrlPressed) {
            // Mode multi-sélection : ajouter ou retirer de la sélection
            if (isAlreadySelected) {
                removeFromSelection(id);
            } else {
                addToSelection(id);
            }
        } else {
            // Sélection simple : remplacer la sélection actuelle
            // MAIS : si la zone cliquée est déjà dans une sélection multiple, ne pas remplacer
            // (pour permettre le drag groupé sans Ctrl)
            if (isAlreadySelected && selectedZoneIds.length > 1) {
                // Ne rien faire, garder la sélection multiple pour permettre le drag groupé
                return;
            }
            
            // Désélectionner toutes les zones
            selectedZoneIds.forEach(zoneId => {
                document.getElementById(zoneId)?.classList.remove('selected');
            });
            selectedZoneIds = [id];
            
            // Sélectionner la nouvelle zone
            const zoneEl = document.getElementById(id);
            if (zoneEl) {
                zoneEl.classList.add('selected');
            }
            
            updateSelectionUI();
        }
    }

    // --- 3. ÉCOUTEURS SUR LE FORMULAIRE (DATA BINDING) ---
    // Quand on tape dans le formulaire, on met à jour l'objet ET le visuel
    
    function updateActiveZoneData() {
        // Ne fonctionne qu'en mode sélection unique
        if (selectedZoneIds.length !== 1) return;
        
        const selectedId = selectedZoneIds[0];
        const zoneEl = document.getElementById(selectedId);
        if (!zoneEl) return;
        
        const zonesData = getCurrentPageZones();
        const zoneType = zonesData[selectedId].type || 'text';
        const contentEl = zoneEl.querySelector('.zone-content');

        if (zoneType === 'qr') {
            zonesData[selectedId].locked = chkLock.checked;
            if (chkLock.checked) {
                zoneEl.classList.add('locked');
            } else {
                zoneEl.classList.remove('locked');
            }
            // Mettre à jour l'affichage des poignées (prend en compte sélection + verrouillage)
            updateHandlesVisibility();
            saveToLocalStorage();
            return;
        }

        // Mise à jour de l'objet de données
        zonesData[selectedId].content = inputContent.value;
        zonesData[selectedId].font = inputFont.value;
        zonesData[selectedId].size = inputSize.value;
        zonesData[selectedId].color = inputColor.value;
        zonesData[selectedId].align = inputAlign.value;
        zonesData[selectedId].valign = inputValign.value;
        // Nouvelles propriétés
        zonesData[selectedId].bgColor = inputBgColor.value;
        zonesData[selectedId].isTransparent = chkTransparent.checked;
        zonesData[selectedId].locked = chkLock.checked;
        zonesData[selectedId].copyfit = chkCopyfit.checked;
        zonesData[selectedId].bold = chkBold.checked;
        zonesData[selectedId].lineHeight = parseFloat(inputLineHeight.value) || 1.2;

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
        
        // Gras
        if (chkBold.checked) {
            zoneEl.style.fontWeight = 'bold';
            contentEl.style.fontWeight = 'bold';
        } else {
            zoneEl.style.fontWeight = 'normal';
            contentEl.style.fontWeight = 'normal';
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
        } else {
            zoneEl.classList.remove('locked');
        }
        // Mettre à jour l'affichage des poignées (prend en compte sélection + verrouillage)
        updateHandlesVisibility();
        
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
            applyCopyfit(zoneEl, zonesData[selectedId].size);
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
    [inputContent, inputFont, inputSize, inputColor, inputAlign, inputValign, inputBgColor, chkTransparent, chkLock, chkCopyfit, chkBold, inputLineHeight].forEach(el => {
        el.addEventListener('input', updateActiveZoneData);
        el.addEventListener('change', updateActiveZoneData); // Pour checkbox/color
    });

    // --- FONCTIONS D'ESPACEMENT ---
    
    // Ajuster l'écartement horizontal entre les zones (uniforme)
    function spaceZonesHorizontally() {
        if (selectedZoneIds.length < 3) return;
        
        const zonesData = getCurrentPageZones();
        
        // Récupérer toutes les zones avec leurs positions
        const zones = selectedZoneIds
            .map(id => {
                const zone = document.getElementById(id);
                if (!zone) return null;
                if (zonesData[id] && zonesData[id].locked) return null; // Ignorer les zones verrouillées
                return {
                    id: id,
                    element: zone,
                    left: zone.offsetLeft,
                    width: zone.offsetWidth
                };
            })
            .filter(z => z !== null);
        
        if (zones.length < 3) return;
        
        // Trier par position X (de gauche à droite)
        zones.sort((a, b) => a.left - b.left);
        
        // Calculer l'espace total disponible
        const firstZone = zones[0];
        const lastZone = zones[zones.length - 1];
        const totalWidth = (lastZone.left + lastZone.width) - firstZone.left;
        
        // Calculer la largeur totale des zones
        const totalZonesWidth = zones.reduce((sum, z) => sum + z.width, 0);
        
        // Calculer l'espace disponible pour l'écartement
        const availableSpace = totalWidth - totalZonesWidth;
        
        // Calculer l'écartement uniforme entre chaque zone
        const spacing = availableSpace / (zones.length - 1);
        
        // Positionner chaque zone avec l'écartement uniforme
        let currentX = firstZone.left;
        for (let i = 0; i < zones.length; i++) {
            if (i === 0) {
                // La première zone garde sa position
                currentX = firstZone.left;
            } else {
                // Les autres zones sont positionnées avec l'écartement
                currentX += zones[i - 1].width + spacing;
            }
            
            // S'assurer que la zone reste dans les limites de la page
            const maxLeft = a4Page.offsetWidth - zones[i].width;
            zones[i].element.style.left = Math.max(0, Math.min(currentX, maxLeft)) + 'px';
        }
        
        saveToLocalStorage();
    }

    // Ajuster l'écartement vertical entre les zones (uniforme)
    function spaceZonesVertically() {
        if (selectedZoneIds.length < 3) return;
        
        const zonesData = getCurrentPageZones();
        
        // Récupérer toutes les zones avec leurs positions
        const zones = selectedZoneIds
            .map(id => {
                const zone = document.getElementById(id);
                if (!zone) return null;
                if (zonesData[id] && zonesData[id].locked) return null; // Ignorer les zones verrouillées
                return {
                    id: id,
                    element: zone,
                    top: zone.offsetTop,
                    height: zone.offsetHeight
                };
            })
            .filter(z => z !== null);
        
        if (zones.length < 3) return;
        
        // Trier par position Y (de haut en bas)
        zones.sort((a, b) => a.top - b.top);
        
        // Calculer l'espace total disponible
        const firstZone = zones[0];
        const lastZone = zones[zones.length - 1];
        const totalHeight = (lastZone.top + lastZone.height) - firstZone.top;
        
        // Calculer la hauteur totale des zones
        const totalZonesHeight = zones.reduce((sum, z) => sum + z.height, 0);
        
        // Calculer l'espace disponible pour l'écartement
        const availableSpace = totalHeight - totalZonesHeight;
        
        // Calculer l'écartement uniforme entre chaque zone
        const spacing = availableSpace / (zones.length - 1);
        
        // Positionner chaque zone avec l'écartement uniforme
        let currentY = firstZone.top;
        for (let i = 0; i < zones.length; i++) {
            if (i === 0) {
                // La première zone garde sa position
                currentY = firstZone.top;
            } else {
                // Les autres zones sont positionnées avec l'écartement
                currentY += zones[i - 1].height + spacing;
            }
            
            // S'assurer que la zone reste dans les limites de la page
            const maxTop = a4Page.offsetHeight - zones[i].height;
            zones[i].element.style.top = Math.max(0, Math.min(currentY, maxTop)) + 'px';
        }
        
        saveToLocalStorage();
    }

    // --- ÉCOUTEURS POUR LES BOUTONS D'ALIGNEMENT ET TAILLE ---
    const btnAlignLeft = document.getElementById('btn-align-left');
    const btnAlignCenter = document.getElementById('btn-align-center');
    const btnAlignRight = document.getElementById('btn-align-right');
    const btnAlignTop = document.getElementById('btn-align-top');
    const btnAlignMiddle = document.getElementById('btn-align-middle');
    const btnAlignBottom = document.getElementById('btn-align-bottom');
    const btnSameWidth = document.getElementById('btn-same-width');
    const btnSameHeight = document.getElementById('btn-same-height');
    const btnSpaceHorizontal = document.getElementById('btn-space-horizontal');
    const btnSpaceVertical = document.getElementById('btn-space-vertical');

    if (btnAlignLeft) btnAlignLeft.addEventListener('click', () => alignZones('left'));
    if (btnAlignCenter) btnAlignCenter.addEventListener('click', () => alignZones('center'));
    if (btnAlignRight) btnAlignRight.addEventListener('click', () => alignZones('right'));
    if (btnAlignTop) btnAlignTop.addEventListener('click', () => alignZones('top'));
    if (btnAlignMiddle) btnAlignMiddle.addEventListener('click', () => alignZones('middle'));
    if (btnAlignBottom) btnAlignBottom.addEventListener('click', () => alignZones('bottom'));
    if (btnSameWidth) btnSameWidth.addEventListener('click', () => applySameWidth());
    if (btnSameHeight) btnSameHeight.addEventListener('click', () => applySameHeight());
    if (btnSpaceHorizontal) btnSpaceHorizontal.addEventListener('click', () => spaceZonesHorizontally());
    if (btnSpaceVertical) btnSpaceVertical.addEventListener('click', () => spaceZonesVertically());

    // --- 4. SUPPRESSION & DÉSÉLECTION ---
    
    // Gestion de la modale de suppression
    const modalOverlay = document.getElementById('confirmation-modal');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalConfirm = document.getElementById('btn-modal-confirm');

    function showDeleteConfirmation() {
        if (selectedZoneIds.length > 0) {
            modalOverlay.classList.remove('hidden');
        }
    }

    function hideDeleteConfirmation() {
        modalOverlay.classList.add('hidden');
    }

    function confirmDeletion() {
        if (selectedZoneIds.length > 0) {
            const zonesData = getCurrentPageZones();
            // Supprimer toutes les zones sélectionnées
            selectedZoneIds.forEach(zoneId => {
                const el = document.getElementById(zoneId);
                if (el) el.remove();
                delete zonesData[zoneId];
            });
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
        // Désélectionner toutes les zones
        selectedZoneIds.forEach(zoneId => {
            document.getElementById(zoneId)?.classList.remove('selected');
        });
        selectedZoneIds = [];
        
        // Cacher complètement le panneau et vider toutes les valeurs
        btnDelete.disabled = true;
        coordsPanel.style.display = 'none';
        coordsPanel.style.pointerEvents = 'none';
        
        // Vider tous les champs
        inputContent.value = '';
        inputFont.value = 'Roboto';
        inputSize.value = 12;
        inputColor.value = '#000000';
        inputAlign.value = 'left';
        inputValign.value = 'top';
        inputBgColor.value = '#ffffff';
        chkTransparent.checked = true;
        chkCopyfit.checked = false;
        chkBold.checked = false;
        chkLock.checked = false;
        inputLineHeight.value = 1.2;
        inputX.value = '';
        inputY.value = '';
        inputW.value = '';
        inputH.value = '';
        lblSelected.innerText = "-";
        setTextControlsEnabled(true);
        
        // Masquer les sections d'alignement et taille
        updateAlignmentToolbarVisibility();
        
        // Masquer les poignées (aucune sélection)
        updateHandlesVisibility();
    }

    btnDelete.addEventListener('click', () => {
        showDeleteConfirmation();
    });

    // Raccourci clavier : Touche Suppr pour supprimer, Ctrl+C pour copier, Ctrl+V pour coller
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

        // Ne pas intercepter si l'utilisateur tape dans un input ou textarea (sauf pour Delete)
        const isInInput = e.target.matches('input, textarea');
        
        // Copier (Ctrl+C ou Cmd+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isInInput) {
            e.preventDefault();
            copySelectedZone();
            return;
        }
        
        // Coller (Ctrl+V ou Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isInInput) {
            e.preventDefault();
            pasteZone();
            return;
        }

        if (selectedZoneIds.length > 0 && (e.key === 'Delete' || e.key === 'Del')) {
            // Ne pas supprimer si l'utilisateur tape dans un input ou textarea
            if (isInInput) return;
            
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
        selectedZoneIds = [];
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
        selectedZoneIds = [];
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
    // Stockage des positions initiales de toutes les zones sélectionnées pour le déplacement groupé
    let startPositions = []; // Tableau de {id, left, top, width, height}

    document.addEventListener('mousedown', (e) => {
        // Si on est en mode pan (Espace pressé ou clic molette), ne pas permettre le drag des zones
        if (spacePressed || e.button === 1) {
            return; // Laisser le pan gérer
        }
        
        // Vérifier si on clique sur une zone sélectionnée (pour le drag/resize)
        if (selectedZoneIds.length > 0) {
            const zonesData = getCurrentPageZones();
            
            // Trouver quelle zone sélectionnée a été cliquée (si une)
            let clickedZone = null;
            let clickedZoneId = null;
            
            for (const zoneId of selectedZoneIds) {
                const zoneEl = document.getElementById(zoneId);
                if (zoneEl && zoneEl.contains(e.target)) {
                    // Vérifier si cette zone n'est pas verrouillée
                    if (!zonesData[zoneId] || !zonesData[zoneId].locked) {
                        clickedZone = zoneEl;
                        clickedZoneId = zoneId;
                        break;
                    }
                }
            }
            
            if (!clickedZone) return; // Aucune zone sélectionnée cliquée ou toutes verrouillées
            
            // Gestion du redimensionnement (handle)
            // Ne permettre le redimensionnement que si une seule zone est sélectionnée
            if (e.target.classList.contains('handle') && clickedZone.contains(e.target)) {
                if (selectedZoneIds.length > 1) {
                    // Sélection multiple : empêcher le redimensionnement
                    e.preventDefault();
                    return;
                }
                // Redimensionnement : seulement la zone cliquée (sélection unique)
                isResizing = true;
                currentHandle = e.target.dataset.pos;
                startX = e.clientX; startY = e.clientY;
                startW = clickedZone.offsetWidth; startH = clickedZone.offsetHeight;
                startLeft = clickedZone.offsetLeft; startTop = clickedZone.offsetTop;
                e.preventDefault();
            } else if (clickedZone.contains(e.target) && !e.target.classList.contains('handle')) {
                // Déplacement : sauvegarder les positions de TOUTES les zones sélectionnées
                isDragging = true;
                startX = e.clientX; startY = e.clientY;
                startLeft = clickedZone.offsetLeft; startTop = clickedZone.offsetTop;
                
                // Sauvegarder les positions initiales de toutes les zones sélectionnées
                startPositions = [];
                selectedZoneIds.forEach(zoneId => {
                    const zoneEl = document.getElementById(zoneId);
                    if (zoneEl) {
                        // Vérifier si la zone n'est pas verrouillée
                        const zoneData = zonesData[zoneId];
                        if (!zoneData || !zoneData.locked) {
                            startPositions.push({
                                id: zoneId,
                                left: zoneEl.offsetLeft,
                                top: zoneEl.offsetTop,
                                width: zoneEl.offsetWidth,
                                height: zoneEl.offsetHeight
                            });
                        }
                    }
                });
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (selectedZoneIds.length === 0) return;

        if (isDragging) {
            // Calculer le déplacement relatif (sans vérification de Ctrl - naturel)
            const dx = (e.clientX - startX) / zoomLevel;
            const dy = (e.clientY - startY) / zoomLevel;
            
            // Obtenir les dimensions de la page (dynamiques)
            const pageWidth = getPageWidth();
            const pageHeight = getPageHeight();
            
            // Déplacer toutes les zones sélectionnées ensemble (sans besoin de Ctrl)
            const zonesData = getCurrentPageZones();
            startPositions.forEach(pos => {
                const zoneEl = document.getElementById(pos.id);
                if (!zoneEl) return;
                
                // Vérifier si la zone n'est pas verrouillée
                const zoneData = zonesData[pos.id];
                if (zoneData && zoneData.locked) return; // Ignorer les zones verrouillées
                
                // Calculer la nouvelle position
                const newLeft = pos.left + dx;
                const newTop = pos.top + dy;
                
                // Appliquer les contraintes de limites pour cette zone
                const maxLeft = pageWidth - pos.width;
                const maxTop = pageHeight - pos.height;
                
                // Positionner la zone en respectant les limites
                zoneEl.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
                zoneEl.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
            });
            
            // Mettre à jour l'affichage géométrique seulement si une seule zone est sélectionnée
            if (selectedZoneIds.length === 1) {
                const firstSelectedId = selectedZoneIds[0];
                const zone = document.getElementById(firstSelectedId);
                if (zone) {
                    updateGeomDisplay(zone);
                }
            }
        } else if (isResizing) {
            const firstSelectedId = selectedZoneIds[0];
            const zone = document.getElementById(firstSelectedId);
            if (!zone) return;
            const zonesData = getCurrentPageZones();
            const dx = (e.clientX - startX) / zoomLevel;
            const dy = (e.clientY - startY) / zoomLevel;
            let newW = startW, newH = startH;
            
            // Simplification redimensionnement (juste SE pour l'exemple, ou complet comme avant)
            if (currentHandle.includes('e')) newW = startW + dx;
            if (currentHandle.includes('w')) { /* ... logique complexe ... */ }
            if (currentHandle.includes('s')) newH = startH + dy;
            
            if (zonesData[firstSelectedId].type === 'qr') {
                const size = Math.max(40, Math.max(newW, newH));
                zone.style.width = size + 'px';
                zone.style.height = size + 'px';
            } else {
                if (newW > 20) zone.style.width = newW + 'px';
                if (newH > 20) zone.style.height = newH + 'px';
                
                // Recalculer le CopyFit pendant le redimensionnement pour effet temps réel
                if (zonesData[firstSelectedId].copyfit) {
                    applyCopyfit(zone, zonesData[firstSelectedId].size);
                }
            }
            updateGeomDisplay(zone);
        }
    });

    document.addEventListener('mouseup', () => {
        // Sauvegarder après le déplacement groupé (avant de réinitialiser)
        if (isDragging && startPositions.length > 0) {
            saveToLocalStorage();
        }
        
        isDragging = false; 
        isResizing = false;
        startPositions = []; // Nettoyer les positions sauvegardées
    });

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
            // S'assurer que la page a les dimensions par défaut (A4)
            const defaultFormat = DOCUMENT_FORMATS[DEFAULT_FORMAT];
            if (!documentState.pages[0].width || !documentState.pages[0].height) {
                documentState.pages[0].format = DEFAULT_FORMAT;
                documentState.pages[0].width = defaultFormat.width;
                documentState.pages[0].height = defaultFormat.height;
            }
            if (!documentState.pages[1].width || !documentState.pages[1].height) {
                documentState.pages[1].format = DEFAULT_FORMAT;
                documentState.pages[1].width = defaultFormat.width;
                documentState.pages[1].height = defaultFormat.height;
            }
            
            documentState.pages[0].zones = parsedZones;
            
            // Charger la page courante
            loadCurrentPage();
            
            // Sauvegarder immédiatement dans le nouveau format
            saveToLocalStorage();
        } else {
            // Aucune donnée sauvegardée : s'assurer qu'on est sur la page 0 (Recto)
            documentState.currentPageIndex = 0;
            // Appliquer les dimensions par défaut
            applyPageDimensions();
        }
    }

    function loadCurrentPage() {
        const currentPage = getCurrentPage();
        const zonesData = currentPage.zones;
        
        // S'assurer que la page a des dimensions (migration/rétrocompatibilité)
        if (!currentPage.width || !currentPage.height) {
            // Si pas de dimensions, utiliser le format par défaut
            const defaultFormat = DOCUMENT_FORMATS[DEFAULT_FORMAT];
            currentPage.format = currentPage.format || DEFAULT_FORMAT;
            currentPage.width = currentPage.width || defaultFormat.width;
            currentPage.height = currentPage.height || defaultFormat.height;
        }
        
        // Appliquer les dimensions au DOM
        applyPageDimensions();
        
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
                
                // Gras
                if (data.bold) {
                    zoneEl.style.fontWeight = 'bold';
                    if (contentEl) contentEl.style.fontWeight = 'bold';
                } else {
                    zoneEl.style.fontWeight = 'normal';
                    if (contentEl) contentEl.style.fontWeight = 'normal';
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
                }
            }
        }
        
        // Mettre à jour l'affichage des poignées après le chargement de toutes les zones
        updateHandlesVisibility();
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
    
    // Appliquer les dimensions de la page courante au démarrage
    // (loadCurrentPage() l'applique déjà, mais on s'assure ici aussi)
    applyPageDimensions();
    
    // Initialiser l'UI de navigation
    updatePageNavigationUI();
    
    // Initialiser la visibilité des sections d'alignement et taille
    updateAlignmentToolbarVisibility();

    // --- FONCTION DE CHANGEMENT DE PAGE ---
    function switchPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= documentState.pages.length) {
            console.warn('Index de page invalide:', pageIndex);
            return;
        }

        // 1. Sauvegarder l'état de la page actuelle (positions, styles)
        saveToLocalStorage();

        // 2. Vider la sélection multiple avant de changer de page
        selectedZoneIds.forEach(zoneId => {
            document.getElementById(zoneId)?.classList.remove('selected');
        });
        selectedZoneIds = [];
        
        // 3. Désélectionner toute zone active
        deselectAll();

        // 3. Vider le workspace (supprimer toutes les zones du DOM)
        document.querySelectorAll('.zone').forEach(el => el.remove());

        // 4. Changer l'index de page courante
        documentState.currentPageIndex = pageIndex;

        // 5. Changer l'image de fond et appliquer les dimensions
        const bgImg = document.getElementById('a4-background');
        const currentPage = getCurrentPage();
        if (bgImg) {
            bgImg.src = currentPage.image;
        }
        
        // Appliquer les dimensions de la nouvelle page
        applyPageDimensions();

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
                            copyfit: data.copyfit,
                            bold: data.bold || false
                        }
                    });
                }
            }
            
            return {
                page_id: page.id,
                page_name: page.name,
                image: page.image,
                format: page.format || DEFAULT_FORMAT,
                width: page.width || DOCUMENT_FORMATS[DEFAULT_FORMAT].width,
                height: page.height || DOCUMENT_FORMATS[DEFAULT_FORMAT].height,
                zones: zonesOutput
            };
        });

        const output = {
            document: "template_multipage",
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
    const CANVAS_PADDING = 60;

    function setZoom(level) {
        // Limiter le zoom entre 25% et 300%
        zoomLevel = Math.max(0.25, Math.min(3.0, level));
        
        if (!a4Page) return;
        
        // Appliquer le zoom avec transform: scale()
        a4Page.style.transform = `scale(${zoomLevel})`;
        a4Page.style.transformOrigin = 'center center';
        
        // Calculer les dimensions du document zoomé (utiliser les dimensions dynamiques)
        const pageWidth = getPageWidth();
        const pageHeight = getPageHeight();
        const scaledWidth = pageWidth * zoomLevel;
        const scaledHeight = pageHeight * zoomLevel;
        
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
        if (workspaceCanvas) {
            workspaceCanvas.style.width = canvasWidth + 'px';
            workspaceCanvas.style.height = canvasHeight + 'px';
        }
        
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
