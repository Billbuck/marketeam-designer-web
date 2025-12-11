/**
 * POC Quill.js - Marketeam Designer
 * Éditeur WYSIWYG de zones de texte avec double toolbar
 * 
 * @file quill-test.js
 * @version 4.0.0 - Phase Multi-zones
 * @description Support de plusieurs zones de texte indépendantes
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1 : RÉFÉRENCES DOM
    // ═══════════════════════════════════════════════════════════════════════
    
    // ─────────────────────────────────────────────────────────────────────────
    // Mini-toolbar contextuelle
    // ─────────────────────────────────────────────────────────────────────────
    
    /** @type {HTMLElement} Mini-toolbar contextuelle */
    const miniToolbar = document.getElementById('mini-toolbar');
    
    /** @type {HTMLButtonElement} Bouton gras partiel */
    const btnPartialBold = document.getElementById('btn-partial-bold');
    
    /** @type {HTMLButtonElement} Bouton souligner partiel */
    const btnPartialUnderline = document.getElementById('btn-partial-underline');
    
    /** @type {HTMLButtonElement} Bouton couleur partielle */
    const btnPartialColor = document.getElementById('btn-partial-color');
    
    /** @type {HTMLInputElement} Color picker partiel */
    const partialColorPicker = document.getElementById('partial-color-picker');
    
    // ─────────────────────────────────────────────────────────────────────────
    // Toolbar principale
    // ─────────────────────────────────────────────────────────────────────────
    
    /** @type {HTMLElement} Toolbar principale flottante */
    const mainToolbar = document.getElementById('main-toolbar');
    
    /** @type {HTMLElement} Header de la toolbar (draggable) */
    const toolbarHeader = document.getElementById('toolbar-header');
    
    /** @type {HTMLButtonElement} Bouton fermer toolbar */
    const toolbarClose = document.getElementById('toolbar-close');
    
    // Section Zone
    /** @type {HTMLInputElement} Checkbox verrouillage zone */
    const chkLocked = document.getElementById('chk-locked');
    
    // Section Typographie
    /** @type {HTMLSelectElement} Select police */
    const inputFont = document.getElementById('input-font');
    
    /** @type {HTMLSelectElement} Select taille */
    const inputSize = document.getElementById('input-size');
    
    /** @type {HTMLInputElement} Checkbox gras global */
    const chkBold = document.getElementById('chk-bold');
    
    /** @type {HTMLInputElement} Color picker couleur texte */
    const inputColor = document.getElementById('input-color');
    
    /** @type {HTMLSpanElement} Affichage valeur hex couleur */
    const colorValue = document.getElementById('color-value');
    
    // Section Alignements
    /** @type {HTMLElement} Groupe boutons alignement horizontal */
    const alignHGroup = document.getElementById('align-h-group');
    
    /** @type {HTMLElement} Groupe boutons alignement vertical */
    const alignVGroup = document.getElementById('align-v-group');
    
    /** @type {HTMLSelectElement} Select interligne */
    const inputLineHeight = document.getElementById('input-line-height');
    
    // Section Fond
    /** @type {HTMLInputElement} Checkbox fond transparent */
    const chkTransparent = document.getElementById('chk-transparent');
    
    /** @type {HTMLInputElement} Color picker couleur fond */
    const inputBgColor = document.getElementById('input-bg-color');
    
    /** @type {HTMLSpanElement} Affichage valeur hex fond */
    const bgColorValue = document.getElementById('bg-color-value');
    
    /** @type {HTMLElement} Ligne couleur fond (pour masquer/afficher) */
    const bgColorRow = document.getElementById('bg-color-row');
    
    // Section Bordure
    /** @type {HTMLInputElement} Input épaisseur bordure */
    const inputBorderWidth = document.getElementById('input-border-width');
    
    /** @type {HTMLInputElement} Color picker couleur bordure */
    const inputBorderColor = document.getElementById('input-border-color');
    
    /** @type {HTMLSelectElement} Select style bordure */
    const inputBorderStyle = document.getElementById('input-border-style');
    
    /** @type {HTMLElement} Ligne couleur bordure (pour masquer/afficher) */
    const borderColorRow = document.getElementById('border-color-row');
    
    /** @type {HTMLElement} Ligne style bordure (pour masquer/afficher) */
    const borderStyleRow = document.getElementById('border-style-row');
    
    // Section Géométrie
    /** @type {HTMLInputElement} Input position X */
    const valX = document.getElementById('val-x');
    
    /** @type {HTMLInputElement} Input position Y */
    const valY = document.getElementById('val-y');
    
    /** @type {HTMLInputElement} Input largeur */
    const valW = document.getElementById('val-w');
    
    /** @type {HTMLInputElement} Input hauteur */
    const valH = document.getElementById('val-h');
    
    // Section Options avancées
    /** @type {HTMLInputElement} Checkbox copyfit */
    const chkCopyfit = document.getElementById('chk-copyfit');
    
    /** @type {HTMLSelectElement} Select gestion lignes vides */
    const inputEmptyLines = document.getElementById('input-empty-lines');
    
    // ─────────────────────────────────────────────────────────────────────────
    // Conteneur de page et bouton ajouter zone
    // ─────────────────────────────────────────────────────────────────────────
    
    /** @type {HTMLElement} Conteneur de la page simulée */
    const pageContainer = document.getElementById('page-container');
    
    /** @type {HTMLButtonElement} Bouton ajouter zone */
    const btnAddZone = document.getElementById('btn-add-zone');
    
    // ─────────────────────────────────────────────────────────────────────────
    // Champs de fusion
    // ─────────────────────────────────────────────────────────────────────────
    
    /** @type {NodeListOf<HTMLButtonElement>} Boutons d'insertion de champs */
    const mergeButtons = document.querySelectorAll('.merge-btn');
    
    // ─────────────────────────────────────────────────────────────────────────
    // Aperçu de fusion
    // ─────────────────────────────────────────────────────────────────────────
    
    /** @type {HTMLButtonElement} Bouton activer aperçu */
    const btnPreview = document.getElementById('btn-preview');
    
    /** @type {HTMLElement} Conteneur des contrôles de navigation */
    const previewControls = document.getElementById('preview-controls');
    
    /** @type {HTMLButtonElement} Bouton enregistrement précédent */
    const btnPrev = document.getElementById('btn-prev');
    
    /** @type {HTMLButtonElement} Bouton enregistrement suivant */
    const btnNext = document.getElementById('btn-next');
    
    /** @type {HTMLSpanElement} Indicateur d'enregistrement courant */
    const recordIndicator = document.getElementById('record-indicator');
    
    /** @type {HTMLButtonElement} Bouton fermer aperçu */
    const btnClosePreview = document.getElementById('btn-close-preview');
    
    /** @type {HTMLElement} Barre des champs de fusion */
    const mergeFieldsBar = document.querySelector('.merge-fields-bar');
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2 : GESTION MULTI-ZONES
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @typedef {Object} BorderConfig
     * @property {number} width - Épaisseur en pixels
     * @property {string} color - Couleur (hex)
     * @property {'solid'|'dashed'|'dotted'} style - Style de bordure
     */
    
    /**
     * @typedef {Object} ZoneState
     * @property {string} id - Identifiant unique de la zone
     * @property {string} font - Police de caractères
     * @property {number} size - Taille en points
     * @property {string} color - Couleur du texte (hex)
     * @property {boolean} bold - Gras global
     * @property {number} lineHeight - Interligne
     * @property {'left'|'center'|'right'|'justify'} align - Alignement horizontal
     * @property {'top'|'middle'|'bottom'} valign - Alignement vertical
     * @property {string} bgColor - Couleur de fond (hex)
     * @property {boolean} isTransparent - Fond transparent
     * @property {boolean} locked - Zone verrouillée
     * @property {BorderConfig} border - Configuration bordure
     * @property {number} x - Position X en mm
     * @property {number} y - Position Y en mm
     * @property {number} width - Largeur en mm
     * @property {number} height - Hauteur en mm
     * @property {boolean} copyfit - Copy fitting activé
     * @property {0|1|2} emptyLines - Gestion lignes vides
     * @property {HTMLElement} element - Référence DOM de la zone
     * @property {Quill} quill - Instance Quill de la zone
     */
    
    /**
     * Compteur pour générer des IDs uniques de zones
     * @type {number}
     */
    let zoneIdCounter = 0;
    
    /**
     * Liste de toutes les zones créées
     * @type {ZoneState[]}
     */
    const zones = [];
    
    /**
     * Zone actuellement sélectionnée
     * @type {ZoneState|null}
     */
    let selectedZone = null;
    
    /**
     * Crée un nouvel état de zone avec les valeurs par défaut
     * @param {number} x - Position X en mm
     * @param {number} y - Position Y en mm
     * @returns {ZoneState} Nouvel état de zone
     */
    function createDefaultZoneState(x = 20, y = 20) {
        const id = `zone-${++zoneIdCounter}`;
        return {
            id: id,
            font: 'Roboto',
            size: 12,
            color: '#000000',
            bold: false,
            lineHeight: 1.2,
            align: 'left',
            valign: 'top',
            bgColor: '#ffffff',
            isTransparent: true,
            locked: false,
            border: {
                width: 0,
                color: '#000000',
                style: 'solid'
            },
            x: x,
            y: y,
            width: 80,
            height: 50,
            copyfit: false,
            emptyLines: 0,
            element: null,
            quill: null
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3 : CONFIGURATION QUILL
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Configuration des formats autorisés pour Quill
     * Seuls ces formats sont conservés lors du paste
     * @constant {string[]}
     */
    const ALLOWED_FORMATS = ['bold', 'italic', 'underline', 'color'];
    
    /**
     * Module Clipboard personnalisé pour filtrer le contenu collé
     * @extends Quill.import('modules/clipboard')
     */
    const Clipboard = Quill.import('modules/clipboard');
    const Delta = Quill.import('delta');
    
    class PlainClipboard extends Clipboard {
        /**
         * Intercepte le paste et filtre les formats non autorisés
         * @param {ClipboardEvent} e - Événement paste
         */
        onPaste(e) {
            e.preventDefault();
            const range = this.quill.getSelection();
            if (!range) return;
            
            const clipboardData = e.clipboardData || window.clipboardData;
            const html = clipboardData.getData('text/html');
            const text = clipboardData.getData('text/plain');
            
            if (html) {
                const filtered = this.filterHtml(html);
                const delta = this.quill.clipboard.convert(filtered);
                this.quill.updateContents(
                    new Delta().retain(range.index).delete(range.length).concat(delta),
                    'user'
                );
            } else if (text) {
                this.quill.insertText(range.index, text, 'user');
            }
            
            setTimeout(() => {
                const newRange = this.quill.getSelection();
                if (newRange) {
                    this.quill.setSelection(newRange.index, 0);
                }
            }, 0);
        }
        
        /**
         * Filtre le HTML pour ne garder que les formats autorisés
         * @param {string} html - HTML brut
         * @returns {string} HTML filtré
         */
        filterHtml(html) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const cleanNode = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent;
                }
                
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    return '';
                }
                
                const tagName = node.tagName.toLowerCase();
                let result = '';
                
                for (const child of node.childNodes) {
                    result += cleanNode(child);
                }
                
                if (tagName === 'b' || tagName === 'strong') {
                    return `<strong>${result}</strong>`;
                }
                if (tagName === 'i' || tagName === 'em') {
                    return `<em>${result}</em>`;
                }
                if (tagName === 'u') {
                    return `<u>${result}</u>`;
                }
                if (tagName === 'br') {
                    return '<br>';
                }
                if (tagName === 'p' || tagName === 'div') {
                    return `<p>${result}</p>`;
                }
                
                const style = node.getAttribute('style') || '';
                const colorMatch = style.match(/color:\s*([^;]+)/i);
                if (colorMatch && result) {
                    return `<span style="color: ${colorMatch[1]}">${result}</span>`;
                }
                
                return result;
            };
            
            return cleanNode(tempDiv);
        }
    }
    
    Quill.register('modules/clipboard', PlainClipboard, true);
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4 : CRÉATION DE ZONES
    // ═══════════════════════════════════════════════════════════════════════
    
    /** @constant {number} Conversion mm vers pixels (72 DPI) */
    const MM_TO_PX = 72 / 25.4;
    
    /** @constant {number} Conversion pixels vers mm */
    const PX_TO_MM = 25.4 / 72;
    
    /**
     * Convertit millimètres en pixels
     * @param {number} mm - Valeur en millimètres
     * @returns {number} Valeur en pixels
     */
    function mmToPx(mm) {
        return mm * MM_TO_PX;
    }
    
    /**
     * Convertit pixels en millimètres
     * @param {number} px - Valeur en pixels
     * @returns {number} Valeur en millimètres
     */
    function pxToMm(px) {
        return px * PX_TO_MM;
    }
    
    /**
     * Crée une nouvelle zone de texte dans le DOM
     * @param {ZoneState} zoneState - État de la zone à créer
     * @returns {HTMLElement} Élément DOM de la zone créée
     */
    function createZoneElement(zoneState) {
        if (!pageContainer) return null;
        
        // Créer la structure DOM de la zone
        const zoneFrame = document.createElement('div');
        zoneFrame.className = 'zone-frame';
        zoneFrame.id = zoneState.id;
        zoneFrame.dataset.zoneId = zoneState.id;
        
        zoneFrame.innerHTML = `
            <div class="zone-drag-handle"></div>
            <div class="zone-content">
                <div class="quill-editor-container"></div>
            </div>
            <div class="resize-handle resize-handle-se"></div>
            <div class="resize-handle resize-handle-e"></div>
            <div class="resize-handle resize-handle-s"></div>
        `;
        
        // Appliquer la position et les dimensions
        zoneFrame.style.left = `${mmToPx(zoneState.x)}px`;
        zoneFrame.style.top = `${mmToPx(zoneState.y)}px`;
        zoneFrame.style.width = `${mmToPx(zoneState.width)}px`;
        zoneFrame.style.height = `${mmToPx(zoneState.height)}px`;
        
        // Ajouter au conteneur
        pageContainer.appendChild(zoneFrame);
        
        // Stocker la référence DOM
        zoneState.element = zoneFrame;
        
        // Initialiser Quill pour cette zone
        const editorContainer = zoneFrame.querySelector('.quill-editor-container');
        const quillInstance = new Quill(editorContainer, {
            theme: 'snow',
            modules: {
                toolbar: false,
                clipboard: {
                    matchVisual: false
                }
            },
            placeholder: 'Saisissez votre texte...',
            formats: ALLOWED_FORMATS
        });
        
        zoneState.quill = quillInstance;
        
        // Appliquer les styles initiaux
        applyZoneStyles(zoneState);
        
        // Attacher les événements
        attachZoneEvents(zoneState);
        
        console.log(`✅ Zone créée: ${zoneState.id}`);
        
        return zoneFrame;
    }
    
    /**
     * Applique tous les styles à une zone
     * @param {ZoneState} zoneState - État de la zone
     * @returns {void}
     */
    function applyZoneStyles(zoneState) {
        if (!zoneState.element || !zoneState.quill) return;
        
        const editor = zoneState.quill.root;
        const zoneContent = zoneState.element.querySelector('.zone-content');
        const quillContainer = zoneState.element.querySelector('.quill-editor-container');
        const qlContainer = zoneState.element.querySelector('.ql-container');
        
        // Typographie
        editor.style.fontFamily = `'${zoneState.font}', sans-serif`;
        if (!zoneState.copyfit) {
            editor.style.fontSize = `${zoneState.size}pt`;
        }
        editor.style.color = zoneState.color;
        editor.style.fontWeight = zoneState.bold ? 'bold' : 'normal';
        editor.style.lineHeight = zoneState.lineHeight;
        editor.style.textAlign = zoneState.align;
        
        // Fond
        if (zoneState.isTransparent) {
            zoneState.element.style.backgroundColor = 'transparent';
        } else {
            zoneState.element.style.backgroundColor = zoneState.bgColor;
        }
        
        // Bordure
        if (zoneState.border.width > 0) {
            zoneState.element.classList.remove('no-user-border');
            zoneState.element.classList.add('has-user-border');
            zoneState.element.style.borderWidth = `${zoneState.border.width}px`;
            zoneState.element.style.borderStyle = zoneState.border.style;
            zoneState.element.style.borderColor = zoneState.border.color;
        } else {
            zoneState.element.classList.remove('has-user-border');
            zoneState.element.classList.add('no-user-border');
            zoneState.element.style.borderWidth = '';
            zoneState.element.style.borderStyle = '';
            zoneState.element.style.borderColor = '';
        }
        
        // Verrouillage
        zoneState.element.classList.toggle('locked', zoneState.locked);
        
        // ─────────────────────────────────────────────────────────────────────
        // ALIGNEMENT VERTICAL - Forcer les hauteurs auto pour que flexbox fonctionne
        // ─────────────────────────────────────────────────────────────────────
        if (quillContainer) {
            quillContainer.style.height = 'auto';
            quillContainer.style.flex = 'none';
        }
        if (qlContainer) {
            qlContainer.style.height = 'auto';
        }
        if (editor) {
            editor.style.height = 'auto';
            editor.style.minHeight = '0';
        }
        
        // Appliquer la classe d'alignement vertical
        if (zoneContent) {
            zoneContent.classList.remove('valign-top', 'valign-middle', 'valign-bottom');
            zoneContent.classList.add(`valign-${zoneState.valign}`);
        }
        
        // Recalculer le copyfit si activé
        if (zoneState.copyfit) {
            applyCopyfitToZone(zoneState);
        }
    }
    
    /**
     * Applique le copyfit à une zone spécifique
     * @param {ZoneState} zoneState - Zone à traiter
     * @returns {void}
     */
    function applyCopyfitToZone(zoneState) {
        if (!zoneState.copyfit || !zoneState.quill || !zoneState.element) return;
        
        const editor = zoneState.quill.root;
        const zoneContent = zoneState.element.querySelector('.zone-content');
        if (!editor || !zoneContent) return;
        
        const maxSize = zoneState.size;
        const minSize = 6;
        let currentSize = maxSize;
        
        editor.style.fontSize = `${currentSize}pt`;
        void zoneContent.offsetHeight;
        
        let iterations = 0;
        const maxIterations = 100;
        
        // Vérifier si overflow
        const isOverflowing = () => {
            return editor.scrollHeight > zoneContent.clientHeight;
        };
        
        // Phase 1 : Réduction rapide
        while (isOverflowing() && currentSize > minSize + 4 && iterations < 20) {
            currentSize -= 2;
            editor.style.fontSize = `${currentSize}pt`;
            void zoneContent.offsetHeight;
            iterations++;
        }
        
        // Phase 2 : Réduction fine
        while (isOverflowing() && currentSize > minSize && iterations < maxIterations) {
            currentSize -= 0.5;
            editor.style.fontSize = `${currentSize}pt`;
            void zoneContent.offsetHeight;
            iterations++;
        }
    }
    
    /**
     * Attache les événements à une zone (clic, drag, resize)
     * @param {ZoneState} zoneState - État de la zone
     * @returns {void}
     */
    function attachZoneEvents(zoneState) {
        const zoneFrame = zoneState.element;
        if (!zoneFrame) return;
        
        // Clic sur la zone = sélection
        zoneFrame.addEventListener('mousedown', (e) => {
            startInteraction();
            selectZone(zoneState);
            e.stopPropagation();
        });
        
        zoneFrame.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Drag handle
        const dragHandle = zoneFrame.querySelector('.zone-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', (e) => {
                if (zoneState.locked) return;
                startZoneDrag(e, zoneState);
                e.stopPropagation();
            });
        }
        
        // Resize handles
        const resizeHandles = zoneFrame.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (zoneState.locked) return;
                
                let direction = '';
                if (handle.classList.contains('resize-handle-se')) direction = 'se';
                else if (handle.classList.contains('resize-handle-e')) direction = 'e';
                else if (handle.classList.contains('resize-handle-s')) direction = 's';
                
                startZoneResize(e, zoneState, direction);
                e.stopPropagation();
            });
        });
        
        // Écouter les changements de sélection Quill pour la mini-toolbar
        zoneState.quill.on('selection-change', (range, oldRange, source) => {
            if (selectedZone !== zoneState) return;
            
            updatePartialBoldButton();
            updatePartialUnderlineButton();
            
            if (range && range.length > 0) {
                showMiniToolbar();
            } else {
                hideMiniToolbar();
            }
        });
        
        // Recalculer le layout quand le contenu change
        zoneState.quill.on('text-change', (delta, oldDelta, source) => {
            setTimeout(() => {
                if (zoneState.copyfit) {
                    applyCopyfitToZone(zoneState);
                }
            }, 10);
        });
    }
    
    /**
     * Ajoute une nouvelle zone de texte
     * @returns {ZoneState} La zone créée
     */
    function addNewZone() {
        // Calculer la position pour éviter les chevauchements
        const offsetX = (zones.length % 3) * 30;
        const offsetY = Math.floor(zones.length / 3) * 20;
        
        const newZone = createDefaultZoneState(20 + offsetX, 20 + offsetY);
        zones.push(newZone);
        
        createZoneElement(newZone);
        selectZone(newZone);
        
        // Mettre un texte par défaut
        newZone.quill.setText('Nouvelle zone de texte');
        
        console.log(`📦 Nouvelle zone ajoutée. Total: ${zones.length}`);
        
        return newZone;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5 : SÉLECTION DE ZONES
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Sélectionne une zone de texte
     * @param {ZoneState} zoneState - Zone à sélectionner
     * @returns {void}
     */
    function selectZone(zoneState) {
        // Désélectionner l'ancienne zone si différente
        if (selectedZone && selectedZone !== zoneState) {
            deselectZone();
        }
        
        selectedZone = zoneState;
        
        if (zoneState.element) {
            zoneState.element.classList.add('selected');
        }
        
        // Afficher la toolbar et synchroniser avec l'état de cette zone
        showMainToolbar('selectZone()');
        syncToolbarWithZone(zoneState);
        
        // Focus sur l'éditeur Quill de cette zone
        if (zoneState.quill) {
            zoneState.quill.focus();
        }
        
        console.log(`✅ Zone sélectionnée: ${zoneState.id}`);
    }
    
    /**
     * Désélectionne la zone actuellement sélectionnée
     * @returns {void}
     */
    function deselectZone() {
        if (!selectedZone) return;
        
        if (selectedZone.element) {
            selectedZone.element.classList.remove('selected');
        }
        
        hideMainToolbar('deselectZone()');
        hideMiniToolbar();
        
        console.log(`⬜ Zone désélectionnée: ${selectedZone.id}`);
        
        selectedZone = null;
    }
    
    /**
     * Synchronise la toolbar avec l'état d'une zone spécifique
     * @param {ZoneState} zoneState - Zone dont on affiche les propriétés
     * @returns {void}
     */
    function syncToolbarWithZone(zoneState) {
        // Typographie
        if (inputFont) inputFont.value = zoneState.font;
        if (inputSize) inputSize.value = zoneState.size;
        if (chkBold) chkBold.checked = zoneState.bold;
        if (inputColor) inputColor.value = zoneState.color;
        if (colorValue) colorValue.textContent = zoneState.color;
        
        // Alignements
        if (alignHGroup) {
            alignHGroup.querySelectorAll('.align-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === zoneState.align);
            });
        }
        if (alignVGroup) {
            alignVGroup.querySelectorAll('.align-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === zoneState.valign);
            });
        }
        if (inputLineHeight) inputLineHeight.value = zoneState.lineHeight;
        
        // Fond
        if (chkTransparent) chkTransparent.checked = zoneState.isTransparent;
        if (inputBgColor) {
            inputBgColor.value = zoneState.bgColor;
            inputBgColor.disabled = zoneState.isTransparent;
        }
        if (bgColorValue) bgColorValue.textContent = zoneState.bgColor;
        
        // Bordure
        if (inputBorderWidth) inputBorderWidth.value = zoneState.border.width;
        if (inputBorderColor) inputBorderColor.value = zoneState.border.color;
        if (inputBorderStyle) inputBorderStyle.value = zoneState.border.style;
        updateBorderOptionsVisibility();
        
        // Géométrie
        if (valX) valX.value = zoneState.x.toFixed(1);
        if (valY) valY.value = zoneState.y.toFixed(1);
        if (valW) valW.value = zoneState.width.toFixed(1);
        if (valH) valH.value = zoneState.height.toFixed(1);
        
        // Options avancées
        if (chkCopyfit) chkCopyfit.checked = zoneState.copyfit;
        if (inputEmptyLines) inputEmptyLines.value = zoneState.emptyLines;
        
        // Zone
        if (chkLocked) chkLocked.checked = zoneState.locked;
    }
    
    /**
     * Met à jour la visibilité des options de bordure
     * @returns {void}
     */
    function updateBorderOptionsVisibility() {
        const hasBorder = selectedZone ? selectedZone.border.width > 0 : false;
        
        if (borderColorRow) {
            borderColorRow.style.display = hasBorder ? 'flex' : 'none';
        }
        if (borderStyleRow) {
            borderStyleRow.style.display = hasBorder ? 'flex' : 'none';
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6 : MINI-TOOLBAR
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Affiche la mini-toolbar au-dessus de la zone sélectionnée
     * @returns {void}
     */
    function showMiniToolbar() {
        if (!miniToolbar || !selectedZone || !selectedZone.element) return;
        
        // Vérifier qu'il y a bien une sélection de texte
        if (selectedZone.quill) {
            const range = selectedZone.quill.getSelection();
            if (!range || range.length === 0) {
                return;
            }
        }
        
        miniToolbar.style.display = 'flex';
        updateMiniToolbarPosition();
    }
    
    /**
     * Masque la mini-toolbar
     * @returns {void}
     */
    function hideMiniToolbar() {
        if (miniToolbar) {
            miniToolbar.style.display = 'none';
        }
    }
    
    /**
     * Met à jour la position de la mini-toolbar
     * @returns {void}
     */
    function updateMiniToolbarPosition() {
        if (!miniToolbar || !selectedZone || !selectedZone.element || miniToolbar.style.display === 'none') return;
        
        const zoneRect = selectedZone.element.getBoundingClientRect();
        const toolbarRect = miniToolbar.getBoundingClientRect();
        
        let x = zoneRect.left + (zoneRect.width / 2) - (toolbarRect.width / 2);
        let y = zoneRect.top - toolbarRect.height - 12;
        
        x = Math.max(10, Math.min(x, window.innerWidth - toolbarRect.width - 10));
        y = Math.max(10, y);
        
        if (y < 10) {
            y = zoneRect.bottom + 12;
            miniToolbar.classList.add('below');
        } else {
            miniToolbar.classList.remove('below');
        }
        
        miniToolbar.style.left = `${x}px`;
        miniToolbar.style.top = `${y}px`;
    }
    
    /**
     * Applique le gras à la sélection Quill de la zone active
     * @returns {void}
     */
    function applyPartialBold() {
        if (!selectedZone || !selectedZone.quill) return;
        
        const range = selectedZone.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }
        
        const format = selectedZone.quill.getFormat(range);
        selectedZone.quill.format('bold', !format.bold);
        updatePartialBoldButton();
    }
    
    /**
     * Applique le soulignement à la sélection
     * @returns {void}
     */
    function applyPartialUnderline() {
        if (!selectedZone || !selectedZone.quill) return;
        
        const range = selectedZone.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }
        
        const format = selectedZone.quill.getFormat(range);
        selectedZone.quill.format('underline', !format.underline);
        updatePartialUnderlineButton();
    }
    
    /**
     * Applique une couleur à la sélection
     * @param {string} color - Couleur hexadécimale
     * @returns {void}
     */
    function applyPartialColor(color) {
        if (!selectedZone || !selectedZone.quill) return;
        
        const range = selectedZone.quill.getSelection();
        if (!range || range.length === 0) {
            alert('Veuillez sélectionner du texte à formater');
            return;
        }
        
        selectedZone.quill.format('color', color);
    }
    
    /**
     * Met à jour l'état visuel du bouton gras partiel
     * @returns {void}
     */
    function updatePartialBoldButton() {
        if (!selectedZone || !selectedZone.quill || !btnPartialBold) return;
        
        const range = selectedZone.quill.getSelection();
        if (range) {
            const format = selectedZone.quill.getFormat(range);
            btnPartialBold.classList.toggle('active', !!format.bold);
        }
    }
    
    /**
     * Met à jour l'état visuel du bouton souligner partiel
     * @returns {void}
     */
    function updatePartialUnderlineButton() {
        if (!selectedZone || !selectedZone.quill || !btnPartialUnderline) return;
        
        const range = selectedZone.quill.getSelection();
        if (range) {
            const format = selectedZone.quill.getFormat(range);
            btnPartialUnderline.classList.toggle('active', !!format.underline);
        }
    }
    
    /**
     * Initialise les événements de la mini-toolbar
     * @returns {void}
     */
    function initMiniToolbarEvents() {
        if (btnPartialBold) {
            btnPartialBold.addEventListener('click', (e) => {
                e.stopPropagation();
                applyPartialBold();
                selectedZone?.quill?.focus();
            });
        }
        
        if (btnPartialUnderline) {
            btnPartialUnderline.addEventListener('click', (e) => {
                e.stopPropagation();
                applyPartialUnderline();
                selectedZone?.quill?.focus();
            });
        }
        
        if (btnPartialColor && partialColorPicker) {
            btnPartialColor.addEventListener('click', (e) => {
                e.stopPropagation();
                partialColorPicker.click();
            });
            
            partialColorPicker.addEventListener('input', (e) => {
                applyPartialColor(e.target.value);
                selectedZone?.quill?.focus();
            });
        }
        
        // Empêcher la propagation depuis la mini-toolbar
        if (miniToolbar) {
            miniToolbar.addEventListener('mousedown', (e) => {
                startInteraction();
                e.stopPropagation();
            });
            
            miniToolbar.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7 : TOOLBAR PRINCIPALE - ÉVÉNEMENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Affiche la toolbar principale
     * @param {string} reason - Raison de l'affichage
     * @returns {void}
     */
    function showMainToolbar(reason = 'unknown') {
        if (mainToolbar) {
            mainToolbar.style.display = 'flex';
        }
    }
    
    /**
     * Masque la toolbar principale
     * @param {string} reason - Raison de la fermeture
     * @returns {void}
     */
    function hideMainToolbar(reason = 'unknown') {
        if (mainToolbar && mainToolbar.style.display !== 'none') {
            mainToolbar.style.display = 'none';
        }
    }
    
    /**
     * Initialise les boutons d'alignement horizontal
     * @returns {void}
     */
    function initAlignHButtons() {
        if (!alignHGroup) return;
        
        const buttons = alignHGroup.querySelectorAll('.align-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!selectedZone) return;
                
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedZone.align = btn.dataset.value;
                applyZoneStyles(selectedZone);
            });
        });
    }
    
    /**
     * Initialise les boutons d'alignement vertical
     * @returns {void}
     */
    function initAlignVButtons() {
        if (!alignVGroup) return;
        
        const buttons = alignVGroup.querySelectorAll('.align-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!selectedZone) return;
                
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedZone.valign = btn.dataset.value;
                applyZoneStyles(selectedZone);
                e.stopPropagation();
            });
        });
    }
    
    /**
     * Initialise les inputs de géométrie
     * @returns {void}
     */
    function initGeometryInputs() {
        if (valX) {
            valX.addEventListener('input', () => {
                if (!selectedZone) return;
                const val = parseFloat(valX.value);
                if (!isNaN(val) && val >= 0) {
                    selectedZone.x = val;
                    applyGeometryToZone(selectedZone);
                    updateMiniToolbarPosition();
                }
            });
        }
        
        if (valY) {
            valY.addEventListener('input', () => {
                if (!selectedZone) return;
                const val = parseFloat(valY.value);
                if (!isNaN(val) && val >= 0) {
                    selectedZone.y = val;
                    applyGeometryToZone(selectedZone);
                    updateMiniToolbarPosition();
                }
            });
        }
        
        if (valW) {
            valW.addEventListener('input', () => {
                if (!selectedZone) return;
                const val = parseFloat(valW.value);
                if (!isNaN(val) && val >= 10) {
                    selectedZone.width = val;
                    applyGeometryToZone(selectedZone);
                    updateMiniToolbarPosition();
                    if (selectedZone.copyfit) {
                        applyCopyfitToZone(selectedZone);
                    }
                }
            });
        }
        
        if (valH) {
            valH.addEventListener('input', () => {
                if (!selectedZone) return;
                const val = parseFloat(valH.value);
                if (!isNaN(val) && val >= 10) {
                    selectedZone.height = val;
                    applyGeometryToZone(selectedZone);
                    updateMiniToolbarPosition();
                    if (selectedZone.copyfit) {
                        applyCopyfitToZone(selectedZone);
                    }
                }
            });
        }
    }
    
    /**
     * Applique les valeurs de géométrie à une zone DOM
     * @param {ZoneState} zoneState - Zone à mettre à jour
     * @returns {void}
     */
    function applyGeometryToZone(zoneState) {
        if (!zoneState.element) return;
        
        zoneState.element.style.left = `${mmToPx(zoneState.x)}px`;
        zoneState.element.style.top = `${mmToPx(zoneState.y)}px`;
        zoneState.element.style.width = `${mmToPx(zoneState.width)}px`;
        zoneState.element.style.height = `${mmToPx(zoneState.height)}px`;
    }
    
    /**
     * Initialise tous les événements de la toolbar principale
     * @returns {void}
     */
    function initToolbarEvents() {
        // Section Zone - Verrouillage
        if (chkLocked) {
            chkLocked.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.locked = chkLocked.checked;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Typographie - Police
        if (inputFont) {
            inputFont.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.font = inputFont.value;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Typographie - Taille
        if (inputSize) {
            inputSize.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.size = parseInt(inputSize.value) || 12;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Typographie - Gras global
        if (chkBold) {
            chkBold.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.bold = chkBold.checked;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Typographie - Couleur texte
        if (inputColor && colorValue) {
            inputColor.addEventListener('input', () => {
                if (!selectedZone) return;
                selectedZone.color = inputColor.value;
                colorValue.textContent = inputColor.value;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Alignements - Interligne
        if (inputLineHeight) {
            inputLineHeight.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.lineHeight = parseFloat(inputLineHeight.value) || 1.2;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Fond - Transparent
        if (chkTransparent && inputBgColor) {
            chkTransparent.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.isTransparent = chkTransparent.checked;
                inputBgColor.disabled = chkTransparent.checked;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Fond - Couleur de fond
        if (inputBgColor && bgColorValue) {
            inputBgColor.addEventListener('input', () => {
                if (!selectedZone) return;
                selectedZone.bgColor = inputBgColor.value;
                bgColorValue.textContent = inputBgColor.value;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Bordure - Épaisseur
        if (inputBorderWidth) {
            inputBorderWidth.addEventListener('input', () => {
                if (!selectedZone) return;
                selectedZone.border.width = parseInt(inputBorderWidth.value) || 0;
                updateBorderOptionsVisibility();
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Bordure - Couleur
        if (inputBorderColor) {
            inputBorderColor.addEventListener('input', () => {
                if (!selectedZone) return;
                selectedZone.border.color = inputBorderColor.value;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Bordure - Style
        if (inputBorderStyle) {
            inputBorderStyle.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.border.style = inputBorderStyle.value;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Options avancées - Copyfit
        if (chkCopyfit) {
            chkCopyfit.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.copyfit = chkCopyfit.checked;
                applyZoneStyles(selectedZone);
            });
        }
        
        // Section Options avancées - Lignes vides
        if (inputEmptyLines) {
            inputEmptyLines.addEventListener('change', () => {
                if (!selectedZone) return;
                selectedZone.emptyLines = parseInt(inputEmptyLines.value) || 0;
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8 : DRAG & RESIZE
    // ═══════════════════════════════════════════════════════════════════════
    
    /** @type {boolean} Drag toolbar en cours */
    let isToolbarDragging = false;
    
    /** @type {boolean} Drag zone en cours */
    let isZoneDragging = false;
    
    /** @type {boolean} Resize zone en cours */
    let isResizing = false;
    
    /** @type {string} Direction du resize */
    let resizeDirection = '';
    
    /** @type {{x: number, y: number}} Position de départ */
    let dragStart = { x: 0, y: 0 };
    
    /** @type {{x: number, y: number, w: number, h: number}} Géométrie de départ */
    let elementStart = { x: 0, y: 0, w: 0, h: 0 };
    
    /** @type {ZoneState|null} Zone en cours de drag/resize */
    let activeZoneForDrag = null;
    
    /**
     * Démarre le drag d'une zone
     * @param {MouseEvent} e - Événement souris
     * @param {ZoneState} zoneState - Zone à déplacer
     * @returns {void}
     */
    function startZoneDrag(e, zoneState) {
        if (zoneState.locked) return;
        
        isZoneDragging = true;
        activeZoneForDrag = zoneState;
        dragStart = { x: e.clientX, y: e.clientY };
        elementStart = {
            x: zoneState.element.offsetLeft,
            y: zoneState.element.offsetTop,
            w: zoneState.element.offsetWidth,
            h: zoneState.element.offsetHeight
        };
        
        zoneState.element.classList.add('dragging');
        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }
    
    /**
     * Démarre le resize d'une zone
     * @param {MouseEvent} e - Événement souris
     * @param {ZoneState} zoneState - Zone à redimensionner
     * @param {string} direction - Direction du resize
     * @returns {void}
     */
    function startZoneResize(e, zoneState, direction) {
        if (zoneState.locked) return;
        
        isResizing = true;
        activeZoneForDrag = zoneState;
        resizeDirection = direction;
        dragStart = { x: e.clientX, y: e.clientY };
        elementStart = {
            x: zoneState.element.offsetLeft,
            y: zoneState.element.offsetTop,
            w: zoneState.element.offsetWidth,
            h: zoneState.element.offsetHeight
        };
        
        document.body.style.cursor = direction === 'se' ? 'se-resize' : direction === 'e' ? 'e-resize' : 's-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }
    
    /**
     * Initialise le drag de la toolbar principale
     * @returns {void}
     */
    function initToolbarDrag() {
        if (!toolbarHeader || !mainToolbar) return;
        
        toolbarHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.toolbar-close')) return;
            
            isToolbarDragging = true;
            dragStart = { x: e.clientX, y: e.clientY };
            
            const rect = mainToolbar.getBoundingClientRect();
            elementStart = { x: rect.left, y: rect.top, w: 0, h: 0 };
            
            mainToolbar.style.transition = 'none';
            document.body.style.cursor = 'move';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
    }
    
    /**
     * Gestionnaire global de mousemove
     * @param {MouseEvent} e - Événement souris
     * @returns {void}
     */
    function handleMouseMove(e) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Drag toolbar
        if (isToolbarDragging && mainToolbar) {
            let newX = elementStart.x + deltaX;
            let newY = elementStart.y + deltaY;
            
            const maxX = window.innerWidth - mainToolbar.offsetWidth;
            const maxY = window.innerHeight - mainToolbar.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            mainToolbar.style.left = `${newX}px`;
            mainToolbar.style.top = `${newY}px`;
            mainToolbar.style.right = 'auto';
        }
        
        // Drag zone
        if (isZoneDragging && activeZoneForDrag && activeZoneForDrag.element && pageContainer) {
            let newX = elementStart.x + deltaX;
            let newY = elementStart.y + deltaY;
            
            const maxX = pageContainer.offsetWidth - elementStart.w;
            const maxY = pageContainer.offsetHeight - elementStart.h;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            activeZoneForDrag.element.style.left = `${newX}px`;
            activeZoneForDrag.element.style.top = `${newY}px`;
            
            activeZoneForDrag.x = pxToMm(newX);
            activeZoneForDrag.y = pxToMm(newY);
            
            if (selectedZone === activeZoneForDrag) {
                if (valX) valX.value = activeZoneForDrag.x.toFixed(1);
                if (valY) valY.value = activeZoneForDrag.y.toFixed(1);
            }
            updateMiniToolbarPosition();
        }
        
        // Resize zone
        if (isResizing && activeZoneForDrag && activeZoneForDrag.element && pageContainer) {
            let newW = elementStart.w;
            let newH = elementStart.h;
            
            if (resizeDirection.includes('e') || resizeDirection === 'se') {
                newW = Math.max(80, elementStart.w + deltaX);
            }
            if (resizeDirection.includes('s') || resizeDirection === 'se') {
                newH = Math.max(40, elementStart.h + deltaY);
            }
            
            const maxW = pageContainer.offsetWidth - activeZoneForDrag.element.offsetLeft;
            const maxH = pageContainer.offsetHeight - activeZoneForDrag.element.offsetTop;
            
            newW = Math.min(newW, maxW);
            newH = Math.min(newH, maxH);
            
            activeZoneForDrag.element.style.width = `${newW}px`;
            activeZoneForDrag.element.style.height = `${newH}px`;
            
            activeZoneForDrag.width = pxToMm(newW);
            activeZoneForDrag.height = pxToMm(newH);
            
            if (selectedZone === activeZoneForDrag) {
                if (valW) valW.value = activeZoneForDrag.width.toFixed(1);
                if (valH) valH.value = activeZoneForDrag.height.toFixed(1);
            }
            updateMiniToolbarPosition();
        }
    }
    
    /**
     * Gestionnaire global de mouseup
     * @returns {void}
     */
    function handleMouseUp() {
        if (isToolbarDragging) {
            saveToolbarPosition();
        }
        
        if (isZoneDragging && activeZoneForDrag) {
            activeZoneForDrag.element?.classList.remove('dragging');
        }
        
        // Recalculer après resize (capturer la zone avant de la réinitialiser)
        if (isResizing && activeZoneForDrag && activeZoneForDrag.copyfit) {
            const zoneToUpdate = activeZoneForDrag;
            setTimeout(() => {
                applyCopyfitToZone(zoneToUpdate);
            }, 10);
        }
        
        isToolbarDragging = false;
        isZoneDragging = false;
        isResizing = false;
        resizeDirection = '';
        activeZoneForDrag = null;
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        if (mainToolbar) {
            mainToolbar.style.transition = '';
        }
    }
    
    /** @constant {string} Clé localStorage pour position toolbar */
    const TOOLBAR_POSITION_KEY = 'quill-poc-toolbar-position';
    
    /**
     * Sauvegarde la position de la toolbar
     * @returns {void}
     */
    function saveToolbarPosition() {
        if (!mainToolbar) return;
        
        const rect = mainToolbar.getBoundingClientRect();
        const position = { x: rect.left, y: rect.top };
        localStorage.setItem(TOOLBAR_POSITION_KEY, JSON.stringify(position));
    }
    
    /**
     * Restaure la position de la toolbar
     * @returns {void}
     */
    function restoreToolbarPosition() {
        if (!mainToolbar) return;
        
        const saved = localStorage.getItem(TOOLBAR_POSITION_KEY);
        if (saved) {
            try {
                const position = JSON.parse(saved);
                mainToolbar.style.left = `${position.x}px`;
                mainToolbar.style.top = `${position.y}px`;
                mainToolbar.style.right = 'auto';
            } catch (e) {
                // Position invalide
            }
        }
    }
    
    // Attacher les gestionnaires globaux
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9 : FUSION DE CHAMPS - APERÇU
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Base de données simulée pour l'aperçu de fusion
     * @constant {Object[]}
     */
    const MOCK_DATABASE = [
        {
            NOM: 'DUPONT',
            PRENOM: 'Jean',
            SOCIETE: 'Acme Corporation',
            ADRESSE: '123 rue de la Paix',
            CP: '75001',
            VILLE: 'Paris'
        },
        {
            NOM: 'MARTIN',
            PRENOM: 'Marie',
            SOCIETE: 'Tech Solutions SAS',
            ADRESSE: '45 avenue des Champs',
            CP: '69002',
            VILLE: 'Lyon'
        },
        {
            NOM: 'BERNARD',
            PRENOM: 'Pierre',
            SOCIETE: 'Global Services',
            ADRESSE: '8 boulevard Victor Hugo',
            CP: '33000',
            VILLE: 'Bordeaux'
        },
        {
            NOM: 'PETIT',
            PRENOM: 'Sophie',
            SOCIETE: 'Innovation Labs',
            ADRESSE: '92 rue Nationale',
            CP: '59000',
            VILLE: 'Lille'
        },
        {
            NOM: 'ROBERT',
            PRENOM: 'François',
            SOCIETE: 'Delta Industries',
            ADRESSE: '17 place Bellecour',
            CP: '13001',
            VILLE: 'Marseille'
        }
    ];
    
    /**
     * État de l'aperçu de fusion
     * @type {Object}
     */
    const previewState = {
        isActive: false,
        currentIndex: 0,
        originalContents: [] // Contenu original de chaque zone
    };
    
    /**
     * Active le mode aperçu de fusion
     * @returns {void}
     */
    function activatePreview() {
        // Sauvegarder le contenu original de toutes les zones
        previewState.originalContents = zones.map(zone => ({
            id: zone.id,
            content: zone.quill ? zone.quill.root.innerHTML : ''
        }));
        
        previewState.isActive = true;
        previewState.currentIndex = 0;
        
        if (btnPreview) btnPreview.style.display = 'none';
        if (previewControls) previewControls.style.display = 'flex';
        if (mergeFieldsBar) mergeFieldsBar.classList.add('preview-mode');
        
        // Désactiver l'édition de toutes les zones
        zones.forEach(zone => {
            if (zone.quill) zone.quill.disable();
        });
        
        displayMergedContent(0);
        updateNavigationButtons();
    }
    
    /**
     * Désactive le mode aperçu
     * @returns {void}
     */
    function deactivatePreview() {
        // Restaurer le contenu original de toutes les zones
        previewState.originalContents.forEach(saved => {
            const zone = zones.find(z => z.id === saved.id);
            if (zone && zone.quill) {
                zone.quill.root.innerHTML = saved.content;
            }
        });
        
        previewState.isActive = false;
        
        if (btnPreview) btnPreview.style.display = 'flex';
        if (previewControls) previewControls.style.display = 'none';
        if (mergeFieldsBar) mergeFieldsBar.classList.remove('preview-mode');
        
        // Réactiver l'édition de toutes les zones
        zones.forEach(zone => {
            if (zone.quill) zone.quill.enable();
        });
    }
    
    /**
     * Affiche le contenu fusionné pour un enregistrement
     * @param {number} index - Index de l'enregistrement
     * @returns {void}
     */
    function displayMergedContent(index) {
        if (index < 0 || index >= MOCK_DATABASE.length) return;
        
        const record = MOCK_DATABASE[index];
        
        // Fusionner chaque zone
        previewState.originalContents.forEach(saved => {
            const zone = zones.find(z => z.id === saved.id);
            if (!zone || !zone.quill) return;
            
            let mergedContent = saved.content;
            
            Object.keys(record).forEach(field => {
                const regex = new RegExp(`@${field}@`, 'g');
                mergedContent = mergedContent.replace(regex, record[field]);
            });
            
            zone.quill.root.innerHTML = mergedContent;
            
            // Recalculer le copyfit
            if (zone.copyfit) {
                applyCopyfitToZone(zone);
            }
        });
        
        updateRecordIndicator();
    }
    
    /**
     * Met à jour l'indicateur d'enregistrement
     * @returns {void}
     */
    function updateRecordIndicator() {
        if (recordIndicator) {
            recordIndicator.textContent = `${previewState.currentIndex + 1} / ${MOCK_DATABASE.length}`;
        }
    }
    
    /**
     * Met à jour l'état des boutons de navigation
     * @returns {void}
     */
    function updateNavigationButtons() {
        if (btnPrev) {
            btnPrev.disabled = previewState.currentIndex === 0;
        }
        if (btnNext) {
            btnNext.disabled = previewState.currentIndex >= MOCK_DATABASE.length - 1;
        }
    }
    
    /**
     * Navigue vers l'enregistrement précédent
     * @returns {void}
     */
    function goToPrevRecord() {
        if (previewState.currentIndex > 0) {
            previewState.currentIndex--;
            displayMergedContent(previewState.currentIndex);
            updateNavigationButtons();
        }
    }
    
    /**
     * Navigue vers l'enregistrement suivant
     * @returns {void}
     */
    function goToNextRecord() {
        if (previewState.currentIndex < MOCK_DATABASE.length - 1) {
            previewState.currentIndex++;
            displayMergedContent(previewState.currentIndex);
            updateNavigationButtons();
        }
    }
    
    /**
     * Initialise les événements de l'aperçu
     * @returns {void}
     */
    function initPreviewEvents() {
        if (btnPreview) {
            btnPreview.addEventListener('click', activatePreview);
        }
        
        if (btnClosePreview) {
            btnClosePreview.addEventListener('click', deactivatePreview);
        }
        
        if (btnPrev) {
            btnPrev.addEventListener('click', goToPrevRecord);
        }
        
        if (btnNext) {
            btnNext.addEventListener('click', goToNextRecord);
        }
        
        document.addEventListener('keydown', (e) => {
            if (!previewState.isActive) return;
            
            if (e.key === 'ArrowLeft') {
                goToPrevRecord();
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                goToNextRecord();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                deactivatePreview();
                e.preventDefault();
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 10 : INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Initialise les sections collapsibles
     * @returns {void}
     */
    function initCollapsibleSections() {
        const sectionHeaders = document.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.collapsible');
                if (section) {
                    section.classList.toggle('collapsed');
                }
            });
        });
    }
    
    /**
     * Initialise l'insertion des champs de fusion
     * @returns {void}
     */
    function initMergeFieldsInsertion() {
        mergeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!selectedZone || !selectedZone.quill) return;
                if (previewState.isActive) return;
                
                const field = btn.dataset.field;
                const range = selectedZone.quill.getSelection(true);
                selectedZone.quill.insertText(range.index, `@${field}@`);
                selectedZone.quill.setSelection(range.index + field.length + 2);
            });
        });
    }
    
    /**
     * Flag indiquant qu'une interaction est en cours
     * @type {boolean}
     */
    let isInteractingWithZoneOrToolbar = false;
    
    /**
     * Active le flag d'interaction
     * @returns {void}
     */
    function startInteraction() {
        isInteractingWithZoneOrToolbar = true;
    }
    
    /**
     * Désactive le flag d'interaction après un délai
     * @returns {void}
     */
    function endInteraction() {
        setTimeout(() => {
            isInteractingWithZoneOrToolbar = false;
        }, 50);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // INITIALISATION AU CHARGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    
    // Sections collapsibles
    initCollapsibleSections();
    
    // Position toolbar depuis localStorage
    restoreToolbarPosition();
    
    // Drag toolbar
    initToolbarDrag();
    
    // Boutons d'alignement
    initAlignHButtons();
    initAlignVButtons();
    
    // Inputs de géométrie
    initGeometryInputs();
    
    // Événements de la toolbar principale
    initToolbarEvents();
    
    // Événements de la mini-toolbar
    initMiniToolbarEvents();
    
    // Aperçu de fusion
    initPreviewEvents();
    
    // Insertion des champs de fusion
    initMergeFieldsInsertion();
    
    // Événement de fermeture de la toolbar
    if (toolbarClose) {
        toolbarClose.addEventListener('click', () => {
            deselectZone();
        });
    }
    
    // Bouton ajouter zone
    if (btnAddZone) {
        btnAddZone.addEventListener('click', () => {
            addNewZone();
        });
    }
    
    // Clic sur le fond = désélectionner
    if (pageContainer) {
        pageContainer.addEventListener('click', (e) => {
            if (e.target === pageContainer) {
                deselectZone();
            }
        });
    }
    
    // Listener mouseup pour fin d'interaction
    document.addEventListener('mouseup', (e) => {
        if (isInteractingWithZoneOrToolbar) {
            endInteraction();
        }
    });
    
    // Fermeture toolbar quand clic dehors
    document.addEventListener('click', (e) => {
        if (!mainToolbar || mainToolbar.style.display === 'none') return;
        if (isInteractingWithZoneOrToolbar) return;
        
        deselectZone();
    });
    
    // Empêcher la propagation depuis la toolbar
    if (mainToolbar) {
        mainToolbar.addEventListener('mousedown', (e) => {
            startInteraction();
            e.stopPropagation();
        });
        
        mainToolbar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Événement scroll/resize pour repositionner mini-toolbar
    window.addEventListener('resize', updateMiniToolbarPosition);
    window.addEventListener('scroll', updateMiniToolbarPosition, true);
    
    // Créer une première zone au chargement
    const firstZone = addNewZone();
    if (firstZone && firstZone.quill) {
        firstZone.quill.setText('Bonjour @NOM@,\n\nBienvenue chez @SOCIETE@ !\n\nCordialement');
    }
});
