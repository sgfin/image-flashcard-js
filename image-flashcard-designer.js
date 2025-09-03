class BoxDesigner {
    constructor() {
        this.currentMode = 'design';
        this.selectedBox = null;
        this.selectedBoxes = new Set(); // Multi-selection support
        this.groups = {};
        this.boxes = [];
        this.linkGroups = []; // Array of Sets, each Set contains linked box IDs
        this.currentImage = null;
        this.nextBoxId = 1;
        this.isDragging = false;
        this.isResizing = false;
        this.isImageResizing = false;
        this.imageResizeMode = false;
        this.controlsPosition = 'right'; // Default position
        this.controlsOffsetX = 0; // Default X offset
        this.controlsOffsetY = 0; // Default Y offset
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Image upload
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });
        
        document.getElementById('resize-image-btn').addEventListener('click', () => {
            this.toggleImageResizeMode();
        });
        
        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Drag and drop
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });

        dropZone.addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        // Mode toggle
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setMode(e.target.value);
            });
        });

        // Group management
        document.getElementById('add-group-btn').addEventListener('click', () => {
            this.addGroup();
        });

        document.getElementById('new-group-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addGroup();
            }
        });

        // Box properties
        document.getElementById('box-label').addEventListener('input', (e) => {
            if (this.selectedBox) {
                this.updateBoxProperty('label', e.target.value);
            }
        });

        document.getElementById('box-answer').addEventListener('input', (e) => {
            if (this.selectedBox) {
                this.updateBoxProperty('answer', e.target.value);
            }
        });

        document.getElementById('box-group').addEventListener('change', (e) => {
            if (this.selectedBox) {
                this.updateBoxProperty('group', e.target.value);
            }
        });

        document.getElementById('box-link').addEventListener('change', (e) => {
            if (this.selectedBox) {
                this.linkBoxes(this.selectedBox.id, e.target.value);
            }
        });

        document.getElementById('use-group-label').addEventListener('change', (e) => {
            if (this.selectedBox) {
                this.updateBoxProperty('useGroupLabel', e.target.checked);
            }
        });

        document.getElementById('delete-box-btn').addEventListener('click', () => {
            if (this.selectedBox) {
                this.deleteBox(this.selectedBox.id);
            }
        });

        // Multi-selection controls
        document.getElementById('link-selected-btn').addEventListener('click', () => {
            this.linkSelectedBoxes();
        });

        document.getElementById('unlink-selected-btn').addEventListener('click', () => {
            this.unlinkSelectedBoxes();
        });

        document.getElementById('delete-selected-btn').addEventListener('click', () => {
            this.deleteSelectedBoxes();
        });

        // Quiz settings
        document.getElementById('controls-position').addEventListener('change', (e) => {
            this.controlsPosition = e.target.value;
            // Sync with preview selector
            document.getElementById('preview-controls-position').value = e.target.value;
            this.refreshPreviewIfActive();
        });

        // Preview mode quiz settings (sync both ways)
        document.getElementById('preview-controls-position').addEventListener('change', (e) => {
            this.controlsPosition = e.target.value;
            // Sync with design selector
            document.getElementById('controls-position').value = e.target.value;
            this.refreshPreviewIfActive();
        });

        // Offset controls
        document.getElementById('preview-controls-offset-x').addEventListener('input', (e) => {
            this.controlsOffsetX = parseInt(e.target.value) || 0;
            this.refreshPreviewIfActive();
        });

        document.getElementById('preview-controls-offset-y').addEventListener('input', (e) => {
            this.controlsOffsetY = parseInt(e.target.value) || 0;
            this.refreshPreviewIfActive();
        });

        // Quiz controls - delegate to live quiz in preview mode
        document.getElementById('reset-quiz-btn').addEventListener('click', () => {
            if (this.currentMode === 'preview' && this.liveQuiz) {
                this.liveQuiz.resetQuiz();
            } else {
                this.resetQuiz();
            }
        });

        document.getElementById('toggle-all-btn').addEventListener('click', () => {
            if (this.currentMode === 'preview' && this.liveQuiz) {
                this.liveQuiz.toggleAllBoxes();
            } else {
                this.toggleAllBoxes();
            }
        });

        // Data management

        document.getElementById('save-config-btn').addEventListener('click', () => {
            this.saveConfig();
        });

        document.getElementById('load-config-btn').addEventListener('click', () => {
            document.getElementById('load-config').click();
        });

        document.getElementById('load-config').addEventListener('change', (e) => {
            this.loadConfig(e.target.files[0]);
        });

        // Preview mode save/load (delegate to main functions)
        document.getElementById('preview-save-config-btn').addEventListener('click', () => {
            this.saveConfig();
        });

        document.getElementById('preview-load-config-btn').addEventListener('click', () => {
            document.getElementById('preview-load-config').click();
        });

        document.getElementById('preview-load-config').addEventListener('change', (e) => {
            this.loadConfig(e.target.files[0]);
        });

        // Image container clicks for box creation
        document.getElementById('image-wrapper').addEventListener('click', (e) => {
            if (this.currentMode === 'design' && this.currentImage && !this.isDragging && !this.isResizing && !this.imageResizeMode) {
                this.createBoxAtPosition(e);
            }
        });
    }

    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        // Save the original file for later use
        this.originalImageFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImage(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    }

    loadImage(src, filename) {
        const img = document.getElementById('target-image');
        const dropZone = document.getElementById('drop-zone');
        
        img.onload = () => {
            this.currentImage = {
                src: src,
                filename: filename,
                width: img.naturalWidth,
                height: img.naturalHeight
            };
            
            dropZone.style.display = 'none';
            img.style.display = 'block';
            
            // Show resize button and size display when image is loaded
            document.getElementById('resize-image-btn').style.display = 'inline-block';
            document.getElementById('image-size-display').style.display = 'inline-block';
            this.updateImageSizeDisplay();
            
            // Clear existing boxes when loading new image
            this.clearAllBoxes();
            this.updateUI();
            
            // Save current display dimensions for later use
            this.updateImageDisplayDimensions();
        };
        
        img.src = src;
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Update body class for styling
        const designer = document.querySelector('.box-designer');
        designer.classList.toggle('preview-mode', mode === 'preview');
        
        // Show/hide appropriate interfaces
        document.getElementById('design-controls').style.display = mode === 'design' ? 'block' : 'none';
        document.getElementById('quiz-interface').style.display = 'none'; // Always hide the gaudy interface
        
        // Show a minimal preview sidebar with essential controls
        document.getElementById('preview-sidebar').style.display = mode === 'preview' ? 'block' : 'none';
        
        if (mode === 'design') {
            this.enterDesignMode();
        } else {
            this.enterPreviewMode();
        }
    }

    enterDesignMode() {
        // Clean up any existing preview mode
        if (this.liveQuiz) {
            this.cleanupPreviewMode();
        }
        
        // Restore design mode boxes
        this.boxes.forEach(box => {
            const element = document.getElementById(`box-${box.id}`);
            if (element) {
                element.classList.remove('hidden');
                element.textContent = this.getDesignModeDisplayText(box);
                element.style.background = 'rgba(255, 255, 255, 0.85)';
                this.showResizeHandles(element, true);
                
                // Restore design mode event listeners
                element.onclick = (e) => {
                    e.stopPropagation();
                    if (e.shiftKey) {
                        this.toggleBoxInSelection(box);
                    } else {
                        this.selectBox(box);
                    }
                };
                element.onmousedown = (e) => {
                    this.startDragging(e, box);
                };
            }
        });
        
        this.clearAllSelections();
    }

    enterPreviewMode() {
        // Clear selection and hide design elements
        this.clearAllSelections();
        this.boxes.forEach(box => {
            const element = document.getElementById(`box-${box.id}`);
            if (element) {
                this.showResizeHandles(element, false);
            }
        });
        
        // Create live quiz using the actual runtime code
        this.createLivePreview();
    }

    createLivePreview() {
        // Get the image wrapper
        const imageWrapper = document.getElementById('image-wrapper');
        
        // Create a config object from current state
        const previewConfig = {
            groups: this.groups,
            boxes: this.boxes,
            linkGroups: this.linkGroups.map(group => Array.from(group))
        };
        
        // Hide the existing boxes overlay (design boxes)
        const designOverlay = document.getElementById('boxes-overlay');
        designOverlay.style.display = 'none';
        
        // Create a container for the live quiz
        const previewContainer = document.createElement('div');
        previewContainer.id = 'live-preview-container';
        previewContainer.style.cssText = 'position: relative; display: inline-block;';
        
        // Move the image into the preview container
        const img = document.getElementById('target-image');
        previewContainer.appendChild(img.cloneNode());
        
        // Replace the image wrapper content temporarily
        imageWrapper.appendChild(previewContainer);
        img.style.display = 'none';
        
        // Initialize the live quiz with options
        const options = {
            controlsPosition: this.controlsPosition,
            controlsOffsetX: this.controlsOffsetX,
            controlsOffsetY: this.controlsOffsetY
        };
        this.liveQuiz = new QuizImage(previewContainer, previewConfig, options);
        
        // Style the preview to match our design
        this.styleLivePreview();
    }

    styleLivePreview() {
        // Preview mode should show exactly what real websites will see
        // No custom styling overrides - let quiz-image.js handle all styling
    }

    cleanupPreviewMode() {
        // Remove live quiz elements
        const liveContainer = document.getElementById('live-preview-container');
        if (liveContainer) {
            liveContainer.remove();
        }
        
        // Restore original image
        const img = document.getElementById('target-image');
        img.style.display = 'block';
        
        // Show design overlay again
        const designOverlay = document.getElementById('boxes-overlay');
        designOverlay.style.display = 'block';
        
        // Remove preview styles
        const previewStyles = document.getElementById('preview-mode-styles');
        if (previewStyles) {
            previewStyles.remove();
        }
        
        this.liveQuiz = null;
    }

    refreshPreviewIfActive() {
        if (this.currentMode === 'preview') {
            // Recreate the live preview with updated data
            this.cleanupPreviewMode();
            this.createLivePreview();
            this.updateGroupToggles();
        }
    }

    createBoxAtPosition(e) {
        const img = document.getElementById('target-image');
        const imgRect = img.getBoundingClientRect();
        
        // Calculate position relative to image
        const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
        const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
        
        // Default box size (percentage of image)
        const width = 12;
        const height = 8;
        
        const box = {
            id: `box${this.nextBoxId++}`,
            label: this.getDefaultBoxLabel(),
            answer: '',
            x: Math.max(0, Math.min(100 - width, x - width/2)),
            y: Math.max(0, Math.min(100 - height, y - height/2)),
            width: width,
            height: height,
            group: '',
            useGroupLabel: false
        };
        
        this.boxes.push(box);
        this.createBoxElement(box);
        this.selectBox(box);
        this.updateUI();
    }

    createBoxElement(box) {
        const overlay = document.getElementById('boxes-overlay');
        const element = document.createElement('div');
        
        element.id = `box-${box.id}`;
        element.className = 'quiz-box';
        element.textContent = this.getBoxDisplayLabel(box);
        element.style.left = `${box.x}%`;
        element.style.top = `${box.y}%`;
        element.style.width = `${box.width}%`;
        element.style.height = `${box.height}%`;
        
        this.updateBoxAppearance(element, box);
        
        // Add event listeners
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentMode === 'design') {
                if (e.shiftKey) {
                    this.toggleBoxInSelection(box);
                } else {
                    this.selectBox(box);
                }
            } else {
                this.toggleLinkedBoxes(box.id, element);
            }
        });
        
        element.addEventListener('mousedown', (e) => {
            if (this.currentMode === 'design') {
                this.startDragging(e, box);
            }
        });
        
        overlay.appendChild(element);
        
        if (this.currentMode === 'design') {
            this.addResizeHandles(element, box);
        }
    }

    updateBoxAppearance(element, box) {
        const group = this.groups[box.group];
        if (group) {
            element.style.borderColor = group.color;
        } else {
            element.style.borderColor = '#64748b';
        }
        
        // Auto-resize text to fit
        this.autoResizeText(element);
    }

    autoResizeText(element) {
        if (!element.textContent || element.textContent.trim() === '') return;
        
        const minFontSize = 8; // Minimum readable size in pixels
        const maxFontSize = 16; // Maximum font size
        const padding = 8; // Account for padding
        
        // Start with default font size
        let fontSize = maxFontSize;
        element.style.fontSize = `${fontSize}px`;
        
        // Get container dimensions
        const containerWidth = element.offsetWidth - padding;
        const containerHeight = element.offsetHeight - padding;
        
        if (containerWidth <= 0 || containerHeight <= 0) return;
        
        // Create temporary element to measure text
        const tempElement = document.createElement('div');
        tempElement.style.position = 'absolute';
        tempElement.style.visibility = 'hidden';
        tempElement.style.whiteSpace = 'nowrap';
        tempElement.style.fontSize = `${fontSize}px`;
        tempElement.style.fontFamily = getComputedStyle(element).fontFamily;
        tempElement.style.fontWeight = getComputedStyle(element).fontWeight;
        tempElement.textContent = element.textContent;
        document.body.appendChild(tempElement);
        
        // Reduce font size until text fits
        while (fontSize > minFontSize) {
            tempElement.style.fontSize = `${fontSize}px`;
            const textWidth = tempElement.offsetWidth;
            const textHeight = tempElement.offsetHeight;
            
            // Check if text fits (allow for word wrapping)
            const fitsWidth = textWidth <= containerWidth || containerWidth > 50;
            const fitsHeight = textHeight <= containerHeight;
            
            if (fitsWidth && fitsHeight) {
                break;
            }
            
            fontSize -= 0.5;
        }
        
        // Clean up
        document.body.removeChild(tempElement);
        
        // Apply the calculated font size
        element.style.fontSize = `${Math.max(fontSize, minFontSize)}px`;
        
        // Allow word wrap for longer text
        if (element.offsetWidth > 60) {
            element.style.whiteSpace = 'normal';
            element.style.wordBreak = 'break-word';
        } else {
            element.style.whiteSpace = 'nowrap';
            element.style.overflow = 'hidden';
            element.style.textOverflow = 'ellipsis';
        }
    }

    addResizeHandles(element, box) {
        const handles = ['nw', 'ne', 'sw', 'se'];
        
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${position}`;
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startResizing(e, box, position);
            });
            element.appendChild(handle);
        });
    }

    showResizeHandles(element, show) {
        const handles = element.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.style.display = show ? 'block' : 'none';
        });
    }

    startDragging(e, box) {
        e.preventDefault();
        this.isDragging = true;
        
        const element = document.getElementById(`box-${box.id}`);
        const overlay = document.getElementById('boxes-overlay');
        const overlayRect = overlay.getBoundingClientRect();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = box.x;
        const startTop = box.y;
        
        const mouseMoveHandler = (e) => {
            const deltaX = ((e.clientX - startX) / overlayRect.width) * 100;
            const deltaY = ((e.clientY - startY) / overlayRect.height) * 100;
            
            box.x = Math.max(0, Math.min(100 - box.width, startLeft + deltaX));
            box.y = Math.max(0, Math.min(100 - box.height, startTop + deltaY));
            
            element.style.left = `${box.x}%`;
            element.style.top = `${box.y}%`;
        };
        
        const mouseUpHandler = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    startResizing(e, box, position) {
        e.preventDefault();
        this.isResizing = true;
        
        const element = document.getElementById(`box-${box.id}`);
        const overlay = document.getElementById('boxes-overlay');
        const overlayRect = overlay.getBoundingClientRect();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startBox = { ...box };
        
        const mouseMoveHandler = (e) => {
            const deltaX = ((e.clientX - startX) / overlayRect.width) * 100;
            const deltaY = ((e.clientY - startY) / overlayRect.height) * 100;
            
            switch (position) {
                case 'nw':
                    box.x = Math.max(0, startBox.x + deltaX);
                    box.y = Math.max(0, startBox.y + deltaY);
                    box.width = Math.max(5, startBox.width - deltaX);
                    box.height = Math.max(3, startBox.height - deltaY);
                    break;
                case 'ne':
                    box.y = Math.max(0, startBox.y + deltaY);
                    box.width = Math.max(5, Math.min(100 - box.x, startBox.width + deltaX));
                    box.height = Math.max(3, startBox.height - deltaY);
                    break;
                case 'sw':
                    box.x = Math.max(0, startBox.x + deltaX);
                    box.width = Math.max(5, startBox.width - deltaX);
                    box.height = Math.max(3, Math.min(100 - box.y, startBox.height + deltaY));
                    break;
                case 'se':
                    box.width = Math.max(5, Math.min(100 - box.x, startBox.width + deltaX));
                    box.height = Math.max(3, Math.min(100 - box.y, startBox.height + deltaY));
                    break;
            }
            
            element.style.left = `${box.x}%`;
            element.style.top = `${box.y}%`;
            element.style.width = `${box.width}%`;
            element.style.height = `${box.height}%`;
        };
        
        const mouseUpHandler = () => {
            this.isResizing = false;
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            
            // Resize text to fit after box resize
            this.autoResizeText(element);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    selectBox(box, addToSelection = false) {
        if (!addToSelection) {
            // Clear all previous selections
            this.clearAllSelections();
        }
        
        this.selectedBox = box;
        if (box) {
            this.selectedBoxes.add(box.id);
        }
        
        this.updateSelectionDisplay();
        this.updatePropertyPanel();
    }

    toggleBoxInSelection(box) {
        if (this.selectedBoxes.has(box.id)) {
            // Remove from selection
            this.selectedBoxes.delete(box.id);
            if (this.selectedBox && this.selectedBox.id === box.id) {
                // If this was the primary selected box, pick another one or clear
                this.selectedBox = this.selectedBoxes.size > 0 ? 
                    this.boxes.find(b => this.selectedBoxes.has(b.id)) : null;
            }
        } else {
            // Add to selection
            this.selectedBoxes.add(box.id);
            this.selectedBox = box;
        }
        
        this.updateSelectionDisplay();
        this.updatePropertyPanel();
    }

    clearAllSelections() {
        this.selectedBoxes.clear();
        this.selectedBox = null;
        this.updateSelectionDisplay();
    }

    updateSelectionDisplay() {
        // Update visual selection for all boxes
        this.boxes.forEach(b => {
            const element = document.getElementById(`box-${b.id}`);
            if (element) {
                const isSelected = this.selectedBoxes.has(b.id);
                const isPrimary = this.selectedBox && this.selectedBox.id === b.id;
                
                element.classList.toggle('selected', isSelected);
                element.classList.toggle('primary-selected', isPrimary);
                
                // Update text display
                if (this.currentMode === 'design') {
                    element.textContent = this.getDesignModeDisplayText(b);
                    this.autoResizeText(element);
                }
                
                // Enable resize handles only for primary selection
                if (isPrimary) {
                    this.enableBoxResize(b);
                } else {
                    this.showResizeHandles(element, false);
                }
            }
        });
    }

    updatePropertyPanel() {
        const multiSelection = this.selectedBoxes.size > 1;
        const hasSelection = this.selectedBoxes.size > 0;
        
        if (multiSelection) {
            // Show multi-selection controls
            document.getElementById('no-selection').style.display = 'none';
            document.getElementById('box-editor').style.display = 'none';
            document.getElementById('multi-selection-controls').style.display = 'block';
            document.getElementById('selected-count').textContent = `${this.selectedBoxes.size} boxes selected`;
        } else if (hasSelection && this.selectedBox) {
            // Show single box editor
            document.getElementById('no-selection').style.display = 'none';
            document.getElementById('box-editor').style.display = 'block';
            document.getElementById('multi-selection-controls').style.display = 'none';
            
            document.getElementById('box-label').value = this.selectedBox.label;
            document.getElementById('box-answer').value = this.selectedBox.answer;
            document.getElementById('box-group').value = this.selectedBox.group;
            document.getElementById('use-group-label').checked = this.selectedBox.useGroupLabel || false;
            
            this.updateBoxLinkSelect();
            this.updateLinkedBoxesDisplay();
        } else {
            // No selection
            document.getElementById('no-selection').style.display = 'block';
            document.getElementById('box-editor').style.display = 'none';
            document.getElementById('multi-selection-controls').style.display = 'none';
        }
    }

    // Enable resizing of boxes in design mode
    enableBoxResize(box) {
        const element = document.getElementById(`box-${box.id}`);
        if (!element || this.currentMode !== 'design') return;
        
        // Remove existing resize handles
        element.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        // Add fresh resize handles
        this.addResizeHandles(element, box);
    }

    updateBoxProperty(property, value) {
        if (!this.selectedBox) return;
        
        this.selectedBox[property] = value;
        
        const element = document.getElementById(`box-${this.selectedBox.id}`);
        if (element) {
            if (property === 'label' || property === 'useGroupLabel') {
                element.textContent = this.getDesignModeDisplayText(this.selectedBox);
                this.autoResizeText(element);
                this.refreshPreviewIfActive();
            } else if (property === 'group') {
                this.updateBoxAppearance(element, this.selectedBox);
                element.textContent = this.getDesignModeDisplayText(this.selectedBox);
                this.updateUI();
                this.refreshPreviewIfActive();
            } else if (property === 'answer') {
                this.refreshPreviewIfActive();
            }
        }
    }

    linkSelectedBoxes() {
        if (this.selectedBoxes.size < 2) {
            alert("Please select at least 2 boxes to link.");
            return;
        }

        const boxIds = Array.from(this.selectedBoxes);
        
        // Remove these boxes from any existing link groups
        boxIds.forEach(boxId => this.unlinkBox(boxId));
        
        // Create new link group
        const linkGroup = new Set(boxIds);
        this.linkGroups.push(linkGroup);
        
        this.updateUI();
        this.refreshPreviewIfActive();
        alert(`Linked ${boxIds.length} boxes together.`);
    }

    unlinkSelectedBoxes() {
        if (this.selectedBoxes.size === 0) {
            alert("Please select boxes to unlink.");
            return;
        }

        const boxIds = Array.from(this.selectedBoxes);
        boxIds.forEach(boxId => this.unlinkBox(boxId));
        
        this.updateUI();
        this.refreshPreviewIfActive();
        alert(`Unlinked ${boxIds.length} boxes.`);
    }

    deleteSelectedBoxes() {
        if (this.selectedBoxes.size === 0) {
            alert("Please select boxes to delete.");
            return;
        }

        const boxIds = Array.from(this.selectedBoxes);
        const confirmMessage = `Are you sure you want to delete ${boxIds.length} box${boxIds.length > 1 ? 'es' : ''}?`;
        
        if (confirm(confirmMessage)) {
            boxIds.forEach(boxId => this.deleteBox(boxId));
        }
    }

    linkBoxes(boxId1, boxId2) {
        // Legacy method for single box linking - convert to new system
        if (!boxId2) {
            this.unlinkBox(boxId1);
            return;
        }

        if (boxId1 === boxId2) {
            alert("Cannot link a box to itself.");
            return;
        }

        // Remove any existing links for both boxes
        this.unlinkBox(boxId1);
        this.unlinkBox(boxId2);

        // Create new link group with just these two boxes
        const linkGroup = new Set([boxId1, boxId2]);
        this.linkGroups.push(linkGroup);

        this.updateUI();
    }

    unlinkBox(boxId) {
        // Remove box from any link group
        this.linkGroups = this.linkGroups.filter(linkGroup => {
            linkGroup.delete(boxId);
            return linkGroup.size > 1; // Remove groups with only one box left
        });
    }

    getLinkedBoxes(boxId) {
        // Find the link group containing this box
        const linkGroup = this.linkGroups.find(group => group.has(boxId));
        if (linkGroup) {
            return Array.from(linkGroup).filter(id => id !== boxId);
        }
        return [];
    }

    getLinkGroup(boxId) {
        return this.linkGroups.find(group => group.has(boxId));
    }

    toggleLinkedBoxes(boxId, element) {
        // Toggle the main box
        this.toggleBoxVisibility(this.boxes.find(b => b.id === boxId), element);
        
        // Toggle all linked boxes in the same link group
        const linkedBoxIds = this.getLinkedBoxes(boxId);
        linkedBoxIds.forEach(linkedId => {
            const linkedBox = this.boxes.find(b => b.id === linkedId);
            const linkedElement = document.getElementById(`box-${linkedId}`);
            if (linkedBox && linkedElement) {
                this.toggleBoxVisibility(linkedBox, linkedElement);
            }
        });
    }

    deleteBox(boxId) {
        this.boxes = this.boxes.filter(box => box.id !== boxId);
        
        const element = document.getElementById(`box-${boxId}`);
        if (element) {
            element.remove();
        }
        
        if (this.selectedBox && this.selectedBox.id === boxId) {
            this.selectBox(null);
        }
        
        this.updateUI();
    }

    addGroup() {
        const nameInput = document.getElementById('new-group-name');
        const colorInput = document.getElementById('new-group-color');
        
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter a group name.');
            return;
        }
        
        const groupId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (this.groups[groupId]) {
            alert('A group with this name already exists.');
            return;
        }
        
        this.groups[groupId] = {
            name: name,
            color: colorInput.value,
            boxes: []
        };
        
        nameInput.value = '';
        this.updateUI();
        this.refreshPreviewIfActive();
    }

    deleteGroup(groupId) {
        // Remove group assignment from boxes
        this.boxes.forEach(box => {
            if (box.group === groupId) {
                box.group = '';
                const element = document.getElementById(`box-${box.id}`);
                if (element) {
                    this.updateBoxAppearance(element, box);
                }
            }
        });
        
        delete this.groups[groupId];
        this.updateUI();
    }

    updateUI() {
        this.updateGroupsList();
        this.updateGroupSelect();
        this.updateGroupToggles();
    }

    updateGroupsList() {
        const container = document.getElementById('groups-list');
        container.innerHTML = '';
        
        Object.entries(this.groups).forEach(([groupId, group]) => {
            const item = document.createElement('div');
            item.className = 'group-item';
            
            const boxCount = this.boxes.filter(box => box.group === groupId).length;
            
            item.innerHTML = `
                <div class="group-color" style="background-color: ${group.color}; cursor: pointer;" onclick="designer.showColorPicker('${groupId}', this)" title="Click to change color"></div>
                <div class="group-name" onclick="designer.editGroupName('${groupId}', this)" title="Click to rename group">${group.name} (${boxCount})</div>
                <div class="group-actions">
                    <button class="btn secondary" onclick="designer.deleteGroup('${groupId}')">Delete</button>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    updateGroupSelect() {
        const select = document.getElementById('box-group');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">No Group</option>';
        
        Object.entries(this.groups).forEach(([groupId, group]) => {
            const option = document.createElement('option');
            option.value = groupId;
            option.textContent = group.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    updateBoxLinkSelect() {
        const select = document.getElementById('box-link');
        const linkedBoxes = this.selectedBox ? this.getLinkedBoxes(this.selectedBox.id) : [];
        const currentLinkedBox = linkedBoxes.length > 0 ? linkedBoxes[0] : null;
        
        select.innerHTML = '<option value="">Not Linked</option>';
        
        // Add all other boxes as options
        this.boxes.forEach(box => {
            if (box.id !== this.selectedBox?.id) {
                const option = document.createElement('option');
                option.value = box.id;
                option.textContent = box.label || box.id;
                select.appendChild(option);
            }
        });
        
        select.value = currentLinkedBox || '';
    }

    updateLinkedBoxesDisplay() {
        const display = document.getElementById('linked-boxes-display');
        
        if (!this.selectedBox) {
            display.innerHTML = '';
            return;
        }
        
        const linkedBoxIds = this.getLinkedBoxes(this.selectedBox.id);
        
        if (linkedBoxIds.length === 0) {
            display.innerHTML = '';
        } else {
            const linkedBoxNames = linkedBoxIds.map(id => {
                const box = this.boxes.find(b => b.id === id);
                return box?.label || id;
            });
            
            const displayText = linkedBoxIds.length === 1 ? 
                `Linked to: ${linkedBoxNames[0]}` :
                `Linked to ${linkedBoxIds.length} boxes: ${linkedBoxNames.join(', ')}`;
                
            display.innerHTML = `<small style="color: var(--secondary-color);">${displayText}</small>`;
        }
    }

    updateGroupToggles() {
        if (this.currentMode !== 'preview') return;
        
        const container = document.getElementById('group-toggles');
        container.innerHTML = '';
        
        Object.entries(this.groups).forEach(([groupId, group]) => {
            const boxCount = this.boxes.filter(box => box.group === groupId).length;
            if (boxCount === 0) return;
            
            const toggle = document.createElement('div');
            toggle.className = 'group-toggle';
            
            toggle.innerHTML = `
                <div class="group-color" style="background-color: ${group.color}"></div>
                <div class="group-name">${group.name} (${boxCount})</div>
                <button class="btn group" style="border-left: 4px solid ${group.color};" onclick="designer.toggleGroupPreview('${groupId}', this)">Show ${group.name}</button>
            `;
            
            container.appendChild(toggle);
        });
    }

    toggleGroupPreview(groupId, button) {
        if (this.currentMode === 'preview' && this.liveQuiz) {
            // Delegate to the live quiz
            this.liveQuiz.toggleGroup(groupId, button);
        } else {
            // Fallback to original method
            this.toggleGroup(groupId);
        }
    }

    toggleGroup(groupId) {
        const groupBoxes = this.boxes.filter(box => box.group === groupId);
        // Check if any boxes are in label state (showing group labels)
        const anyInLabelState = groupBoxes.some(box => {
            const element = document.getElementById(`box-${box.id}`);
            if (!element) return false;
            const currentText = element.textContent;
            const groupLabel = this.getBoxDisplayLabel(box);
            return currentText === groupLabel && !element.classList.contains('hidden');
        });
        
        groupBoxes.forEach(box => {
            const element = document.getElementById(`box-${box.id}`);
            if (element) {
                if (anyInLabelState) {
                    // Show answers (set to answer state)
                    if (box.answer && box.answer.trim()) {
                        // Show answer
                        element.textContent = box.answer;
                        element.style.background = 'rgba(255, 255, 255, 1)';
                        element.classList.remove('hidden');
                        this.autoResizeText(element);
                    } else {
                        // No answer - show transparent
                        element.textContent = '';
                        element.style.background = 'transparent';
                        element.classList.add('hidden');
                    }
                } else {
                    // Hide answers (set to label state)
                    element.classList.remove('hidden');
                    element.textContent = this.getBoxDisplayLabel(box);
                    element.style.background = 'rgba(255, 255, 255, 1)';
                    this.autoResizeText(element);
                }
            }
        });
        
        // Update toggle button text
        const button = document.querySelector(`button[onclick="designer.toggleGroup('${groupId}')"]`);
        if (button) {
            button.textContent = anyInLabelState ? 'Hide' : 'Show';
        }
    }

    toggleBoxVisibility(box, element) {
        if (!element) element = document.getElementById(`box-${box.id}`);
        if (!element) return;
        
        // Check current state - if showing group label, switch to answer state
        const currentText = element.textContent;
        const groupLabel = this.getBoxDisplayLabel(box);
        
        if (currentText === groupLabel && !element.classList.contains('hidden')) {
            // Currently showing group label - switch to answer state
            if (box.answer && box.answer.trim()) {
                // Show answer
                element.textContent = box.answer;
                element.style.background = 'rgba(255, 255, 255, 1)';
                element.classList.remove('hidden');
                this.autoResizeText(element);
            } else {
                // No answer - show transparent
                element.textContent = '';
                element.style.background = 'transparent';
                element.classList.add('hidden');
            }
        } else {
            // Currently in answer state - switch back to group label
            element.textContent = groupLabel;
            element.style.background = 'rgba(255, 255, 255, 1)';
            element.classList.remove('hidden');
            this.autoResizeText(element);
        }
    }

    resetQuiz() {
        this.boxes.forEach(box => {
            const element = document.getElementById(`box-${box.id}`);
            if (element) {
                element.classList.remove('hidden');
                element.textContent = this.getBoxDisplayLabel(box);
                element.style.background = 'rgba(255, 255, 255, 1)';
                this.autoResizeText(element);
            }
        });
        
        this.updateGroupToggles();
    }

    toggleAllBoxes() {
        // Check if any boxes are in label state (showing group labels)
        const anyInLabelState = this.boxes.some(box => {
            const element = document.getElementById(`box-${box.id}`);
            if (!element) return false;
            const currentText = element.textContent;
            const groupLabel = this.getBoxDisplayLabel(box);
            return currentText === groupLabel && !element.classList.contains('hidden');
        });
        
        const button = document.getElementById('toggle-all-btn');
        
        if (anyInLabelState) {
            // Show answers (switch all boxes to answer state)
            this.boxes.forEach(box => {
                const element = document.getElementById(`box-${box.id}`);
                if (element) {
                    if (box.answer && box.answer.trim()) {
                        // Show answer
                        element.textContent = box.answer;
                        element.style.background = 'rgba(255, 255, 255, 1)';
                        element.classList.remove('hidden');
                        this.autoResizeText(element);
                    } else {
                        // No answer - show transparent
                        element.textContent = '';
                        element.style.background = 'transparent';
                        element.classList.add('hidden');
                    }
                }
            });
            button.textContent = 'Hide All';
        } else {
            // Hide answers (switch all boxes to label state)
            this.boxes.forEach(box => {
                const element = document.getElementById(`box-${box.id}`);
                if (element) {
                    element.classList.remove('hidden');
                    element.textContent = this.getBoxDisplayLabel(box);
                    element.style.background = 'rgba(255, 255, 255, 1)';
                    this.autoResizeText(element);
                }
            });
            button.textContent = 'Show All';
        }
        
        this.updateGroupToggles();
    }

    clearAllBoxes() {
        this.boxes = [];
        this.selectedBox = null;
        const overlay = document.getElementById('boxes-overlay');
        overlay.innerHTML = '';
        this.updateUI();
    }

    getDefaultBoxLabel() {
        return `Box ${this.boxes.length + 1}`;
    }

    getDesignModeDisplayText(box) {
        // In design mode, show box ID if selected, otherwise show the preview label
        if (this.selectedBox && this.selectedBox.id === box.id) {
            return box.id;
        }
        return this.getBoxDisplayLabel(box);
    }

    getBoxDisplayLabel(box) {
        // Check if we should use group label or custom label
        if (box.group && this.groups[box.group] && box.useGroupLabel) {
            // Use group label without number
            return this.groups[box.group].name;
        }
        
        // Use the custom label (could be blank)
        return box.label || '';
    }

    saveConfig() {
        const filename = prompt('Enter filename (without .json extension):', 'quiz-config');
        if (!filename) return;
        
        this.updateImageDisplayDimensions();
        
        const data = {
            image: this.currentImage ? this.currentImage.filename : '',
            imageDisplayDimensions: this.currentImage ? {
                width: this.currentImage.displayWidth || this.currentImage.width,
                height: this.currentImage.displayHeight || this.currentImage.height
            } : null,
            groups: this.groups,
            boxes: this.boxes,
            linkGroups: this.linkGroups.map(group => Array.from(group)), // Convert Sets to arrays for JSON
            controlsPosition: this.controlsPosition,
            controlsOffsetX: this.controlsOffsetX,
            controlsOffsetY: this.controlsOffsetY
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Also save the image with proper naming
        if (this.originalImageFile) {
            this.saveImageFile(filename);
        }
    }

    saveImageFile(configName) {
        if (!this.originalImageFile || !this.currentImage) return;
        
        const extension = this.originalImageFile.name.split('.').pop();
        const imageFilename = `${configName}.${extension}`;
        
        // Get current display dimensions
        const img = document.getElementById('target-image');
        const displayWidth = img.offsetWidth;
        const displayHeight = img.offsetHeight;
        
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas to display dimensions
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // Create image element to draw from
        const sourceImg = new Image();
        sourceImg.onload = () => {
            // Draw resized image to canvas
            ctx.drawImage(sourceImg, 0, 0, displayWidth, displayHeight);
            
            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = imageFilename;
                a.click();
                URL.revokeObjectURL(url);
            }, `image/${extension === 'jpg' ? 'jpeg' : extension}`, 0.95);
        };
        
        // Load the original image
        sourceImg.src = this.currentImage.src;
    }

    updateImageDisplayDimensions() {
        if (!this.currentImage) return;
        
        const img = document.getElementById('target-image');
        if (img) {
            this.currentImage.displayWidth = img.offsetWidth;
            this.currentImage.displayHeight = img.offsetHeight;
        }
        
        this.updateImageSizeDisplay();
    }

    updateImageSizeDisplay() {
        const img = document.getElementById('target-image');
        const display = document.getElementById('image-size-display');
        
        if (img && display) {
            const width = Math.round(img.offsetWidth);
            const height = Math.round(img.offsetHeight);
            display.textContent = `${width} × ${height} px`;
        }
    }

    toggleImageResizeMode() {
        this.imageResizeMode = !this.imageResizeMode;
        const button = document.getElementById('resize-image-btn');
        const wrapper = document.getElementById('image-wrapper');
        
        if (this.imageResizeMode) {
            button.textContent = 'Exit Resize';
            button.classList.add('success');
            wrapper.classList.add('resizing');
            this.addImageResizeHandles();
        } else {
            button.textContent = 'Resize Image';
            button.classList.remove('success');
            wrapper.classList.remove('resizing');
            this.removeImageResizeHandles();
        }
    }

    addImageResizeHandles() {
        const wrapper = document.getElementById('image-wrapper');
        
        // Remove existing handles
        this.removeImageResizeHandles();
        
        const handles = ['nw', 'ne', 'sw', 'se'];
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `image-resize-handle ${position}`;
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startImageResizing(e, position);
            });
            wrapper.appendChild(handle);
        });
    }

    removeImageResizeHandles() {
        const handles = document.querySelectorAll('.image-resize-handle');
        handles.forEach(handle => handle.remove());
    }

    startImageResizing(e, position) {
        e.preventDefault();
        this.isImageResizing = true;
        
        const img = document.getElementById('target-image');
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = img.offsetWidth;
        const startHeight = img.offsetHeight;
        const aspectRatio = startWidth / startHeight;
        
        const mouseMoveHandler = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth, newHeight;
            
            switch (position) {
                case 'se':
                    newWidth = Math.max(200, startWidth + deltaX);
                    newHeight = newWidth / aspectRatio;
                    break;
                case 'sw':
                    newWidth = Math.max(200, startWidth - deltaX);
                    newHeight = newWidth / aspectRatio;
                    break;
                case 'ne':
                    newHeight = Math.max(150, startHeight + deltaY);
                    newWidth = newHeight * aspectRatio;
                    break;
                case 'nw':
                    newHeight = Math.max(150, startHeight - deltaY);
                    newWidth = newHeight * aspectRatio;
                    break;
            }
            
            // Constrain to container
            const container = document.querySelector('.image-container');
            const maxWidth = container.offsetWidth - 40;
            const maxHeight = container.offsetHeight - 40;
            
            if (newWidth > maxWidth) {
                newWidth = maxWidth;
                newHeight = newWidth / aspectRatio;
            }
            
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = newHeight * aspectRatio;
            }
            
            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
            
            // Update real-time display during resize
            const display = document.getElementById('image-size-display');
            if (display) {
                display.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
            }
        };
        
        const mouseUpHandler = () => {
            this.isImageResizing = false;
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            
            // Update display dimensions
            this.updateImageDisplayDimensions();
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    loadConfig(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.importConfig(data);
            } catch (error) {
                alert('Invalid JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    importConfig(data) {
        // Clear existing data
        this.clearAllBoxes();
        this.groups = {};
        this.linkGroups = [];
        
        // Import groups
        if (data.groups) {
            this.groups = { ...data.groups };
        }
        
        // Import link groups (new format)
        if (data.linkGroups) {
            this.linkGroups = data.linkGroups.map(group => new Set(group));
        } else if (data.linkedBoxes) {
            // Convert old format to new format
            this.convertOldLinkingFormat(data.linkedBoxes);
        }
        
        // Import boxes
        if (data.boxes) {
            this.boxes = [...data.boxes];
            this.nextBoxId = Math.max(...this.boxes.map(b => parseInt(b.id.replace('box', '')) || 0)) + 1;
            
            // Create box elements
            this.boxes.forEach(box => {
                this.createBoxElement(box);
            });
        }
        
        // Import controls position setting
        if (data.controlsPosition) {
            this.controlsPosition = data.controlsPosition;
            document.getElementById('controls-position').value = data.controlsPosition;
            document.getElementById('preview-controls-position').value = data.controlsPosition;
        }
        
        // Import controls offset settings
        if (data.controlsOffsetX !== undefined) {
            this.controlsOffsetX = data.controlsOffsetX;
            document.getElementById('preview-controls-offset-x').value = data.controlsOffsetX;
        }
        if (data.controlsOffsetY !== undefined) {
            this.controlsOffsetY = data.controlsOffsetY;
            document.getElementById('preview-controls-offset-y').value = data.controlsOffsetY;
        }
        
        // Auto-resize image if dimensions are specified and image is loaded
        if (data.imageDisplayDimensions && this.currentImage) {
            this.resizeImageToConfigDimensions(data.imageDisplayDimensions);
        }
        
        this.updateUI();
        // Ensure proper mode styling is applied after loading
        this.setMode(this.currentMode);
        alert('Configuration loaded successfully!');
    }

    convertOldLinkingFormat(oldLinkedBoxes) {
        // Convert old 1:1 linking format to new group format
        const processedBoxes = new Set();
        
        Object.entries(oldLinkedBoxes).forEach(([boxId1, boxId2]) => {
            if (!processedBoxes.has(boxId1) && !processedBoxes.has(boxId2)) {
                const linkGroup = new Set([boxId1, boxId2]);
                this.linkGroups.push(linkGroup);
                processedBoxes.add(boxId1);
                processedBoxes.add(boxId2);
            }
        });
    }

    resizeImageToConfigDimensions(dimensions) {
        if (!this.currentImage || !dimensions.width || !dimensions.height) return;
        
        const img = document.getElementById('target-image');
        if (!img) return;
        
        // Update the image display dimensions
        img.style.width = `${dimensions.width}px`;
        img.style.height = `${dimensions.height}px`;
        
        // Update the current image object with the new dimensions
        this.currentImage.displayWidth = dimensions.width;
        this.currentImage.displayHeight = dimensions.height;
        
        // Update internal dimensions tracking
        this.updateImageDisplayDimensions();
        
        console.log(`Image resized to match config: ${dimensions.width}x${dimensions.height}px`);
    }

    editGroupName(groupId, nameElement) {
        const group = this.groups[groupId];
        if (!group) return;

        const currentText = nameElement.textContent;
        const currentName = group.name;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'group-name-edit';
        
        // Replace text with input
        nameElement.innerHTML = '';
        nameElement.appendChild(input);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                // Check if name already exists
                const existingGroup = Object.values(this.groups).find(g => g.name.toLowerCase() === newName.toLowerCase());
                if (existingGroup && existingGroup !== group) {
                    alert('A group with this name already exists.');
                    input.focus();
                    return;
                }
                
                group.name = newName;
                this.updateUI();
            } else {
                // Restore original
                nameElement.textContent = currentText;
            }
        };
        
        const cancelEdit = () => {
            nameElement.textContent = currentText;
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }

    showColorPicker(groupId, colorElement) {
        const group = this.groups[groupId];
        if (!group) return;

        // Create color picker popup
        const popup = document.createElement('div');
        popup.className = 'color-picker-popup';
        popup.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 200px;
        `;

        const rect = colorElement.getBoundingClientRect();
        popup.style.left = `${rect.right + 10}px`;
        popup.style.top = `${rect.top}px`;

        popup.innerHTML = `
            <h4 style="margin: 0 0 0.5rem 0;">Change ${group.name} Color</h4>
            <input type="color" id="color-input" value="${group.color}" style="width: 100%; height: 40px; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                <button id="apply-color" class="btn" style="flex: 1;">Apply</button>
                <button id="cancel-color" class="btn secondary" style="flex: 1;">Cancel</button>
            </div>
        `;

        document.body.appendChild(popup);

        // Handle apply
        popup.querySelector('#apply-color').addEventListener('click', () => {
            const newColor = popup.querySelector('#color-input').value;
            this.changeGroupColor(groupId, newColor);
            document.body.removeChild(popup);
        });

        // Handle cancel
        popup.querySelector('#cancel-color').addEventListener('click', () => {
            document.body.removeChild(popup);
        });

        // Close on outside click
        const closeHandler = (e) => {
            if (!popup.contains(e.target)) {
                document.body.removeChild(popup);
                document.removeEventListener('click', closeHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 100);
    }

    changeGroupColor(groupId, newColor) {
        if (!this.groups[groupId]) return;
        
        this.groups[groupId].color = newColor;
        
        // Update all boxes in this group
        this.boxes.forEach(box => {
            if (box.group === groupId) {
                const element = document.getElementById(`box-${box.id}`);
                if (element) {
                    this.updateBoxAppearance(element, box);
                }
            }
        });
        
        this.updateUI();
    }
}

// Initialize the designer when the page loads
let designer;
document.addEventListener('DOMContentLoaded', () => {
    designer = new BoxDesigner();
});