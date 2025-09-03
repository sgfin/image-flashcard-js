class QuizImage {
    constructor(container, config, options = {}) {
        this.container = container;
        this.config = config;
        this.groups = config.groups || {};
        this.boxes = config.boxes || [];
        this.options = options;
        this.controlsPosition = options.controlsPosition || 'right';
        this.controlsOffsetX = options.controlsOffsetX || 0;
        this.controlsOffsetY = options.controlsOffsetY || 0;
        this.quizVisible = false; // Start with quiz hidden by default
        
        // Handle both old and new linking formats
        if (config.linkGroups) {
            this.linkGroups = config.linkGroups.map(group => new Set(group));
        } else {
            this.linkGroups = [];
            // Convert old format if present
            if (config.linkedBoxes) {
                this.convertOldLinkingFormat(config.linkedBoxes);
            }
        }
        
        this.isInitialized = false;
        
        this.init();
    }

    convertOldLinkingFormat(oldLinkedBoxes) {
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

    async init() {
        if (this.isInitialized) return;
        
        // Wait for image to load
        const img = this.container.querySelector('img');
        if (img && !img.complete) {
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }
        
        this.createOverlay();
        this.createControls();
        this.createBoxes();
        this.isInitialized = true;
    }

    createOverlay() {
        // Wrap the image in a container if it's not already wrapped
        const img = this.container.querySelector('img');
        if (!img.parentElement.classList.contains('quiz-image-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'quiz-image-wrapper';
            wrapper.style.cssText = `
                position: relative;
                display: inline-block;
                max-width: 100%;
            `;
            
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
        }

        // Create overlay for boxes
        const overlay = document.createElement('div');
        overlay.className = 'quiz-boxes-overlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;
        
        img.parentElement.appendChild(overlay);
        this.overlay = overlay;
        
        // Hide overlay initially if quiz should be hidden
        if (!this.quizVisible) {
            this.overlay.style.display = 'none';
        }
    }

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'quiz-controls';
        
        // Position controls based on setting
        const baseStyles = `
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
        `;
        
        // Reset container layout first
        this.container.style.display = 'block';
        this.container.style.alignItems = '';
        
        if (this.controlsPosition === 'top') {
            controls.style.cssText = baseStyles + `
                margin-bottom: 1rem;
                transform: translate(${this.controlsOffsetX}px, ${this.controlsOffsetY}px);
            `;
            // Insert controls before the image wrapper
            const imageWrapper = this.container.querySelector('.quiz-image-wrapper');
            this.container.insertBefore(controls, imageWrapper);
        } else if (this.controlsPosition === 'left') {
            controls.style.cssText = baseStyles + `
                flex-direction: column;
                margin-right: 1rem;
                width: 200px;
                align-self: flex-start;
                transform: translate(${this.controlsOffsetX}px, ${this.controlsOffsetY}px);
            `;
            this.container.style.display = 'flex';
            this.container.style.alignItems = 'flex-start';
            this.container.style.justifyContent = 'center';
            // Insert controls before the image wrapper
            const imageWrapper = this.container.querySelector('.quiz-image-wrapper');
            this.container.insertBefore(controls, imageWrapper);
        } else if (this.controlsPosition === 'right') {
            controls.style.cssText = baseStyles + `
                flex-direction: column;
                margin-left: 1rem;
                width: 200px;
                align-self: flex-start;
                transform: translate(${this.controlsOffsetX}px, ${this.controlsOffsetY}px);
            `;
            this.container.style.display = 'flex';
            this.container.style.alignItems = 'flex-start';
            this.container.style.justifyContent = 'center';
            // Controls will be appended after image wrapper (default appendChild behavior)
        } else {
            // Default bottom
            controls.style.cssText = baseStyles + `
                margin-top: 1rem;
                transform: translate(${this.controlsOffsetX}px, ${this.controlsOffsetY}px);
            `;
            // Controls will be appended after image wrapper (default appendChild behavior)
        }

        // Show/Hide Quiz button (starts as "Show Image Quiz")
        const toggleQuizBtn = document.createElement('button');
        toggleQuizBtn.textContent = 'Show Image Quiz';
        toggleQuizBtn.className = 'quiz-btn quiz-btn-show';
        toggleQuizBtn.addEventListener('click', () => this.toggleQuizVisibility(toggleQuizBtn));
        controls.appendChild(toggleQuizBtn);

        // Reset button (hidden initially)
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.className = 'quiz-btn quiz-btn-secondary';
        resetBtn.style.display = this.quizVisible ? '' : 'none';
        resetBtn.addEventListener('click', () => this.resetQuiz());
        controls.appendChild(resetBtn);

        // Toggle all button (hidden initially)
        const toggleAllBtn = document.createElement('button');
        toggleAllBtn.textContent = 'Show All';
        toggleAllBtn.className = 'quiz-btn quiz-btn-primary';
        toggleAllBtn.style.display = this.quizVisible ? '' : 'none';
        toggleAllBtn.addEventListener('click', () => this.toggleAllBoxes());
        controls.appendChild(toggleAllBtn);

        // Group toggles (hidden initially)
        Object.entries(this.groups).forEach(([groupId, group]) => {
            const groupBoxes = this.boxes.filter(box => box.group === groupId);
            if (groupBoxes.length === 0) return;

            const groupBtn = document.createElement('button');
            groupBtn.textContent = `Show ${group.name}`;
            groupBtn.className = 'quiz-btn quiz-btn-group';
            groupBtn.style.borderLeft = `4px solid ${group.color}`;
            groupBtn.style.position = 'relative';
            groupBtn.style.paddingLeft = '1rem';
            groupBtn.style.display = this.quizVisible ? '' : 'none';
            groupBtn.addEventListener('click', () => this.toggleGroup(groupId, groupBtn));
            controls.appendChild(groupBtn);
        });

        // Only appendChild for bottom and right positions
        // Top and left are inserted before image wrapper above
        if (this.controlsPosition === 'bottom' || this.controlsPosition === 'right' || !this.controlsPosition) {
            this.container.appendChild(controls);
        }
        
        this.controls = controls;
    }

    createBoxes() {
        this.boxes.forEach(box => {
            const element = document.createElement('div');
            element.className = 'quiz-box-runtime';
            element.textContent = this.getBoxDisplayLabel(box);
            element.style.cssText = `
                position: absolute;
                left: ${box.x}%;
                top: ${box.y}%;
                width: ${box.width}%;
                height: ${box.height}%;
                border: 2px solid ${this.getBoxColor(box)};
                background: rgba(255, 255, 255, 1);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                font-size: 0.9rem;
                text-align: center;
                word-wrap: break-word;
                pointer-events: all;
                transition: all 0.2s;
                user-select: none;
                box-sizing: border-box;
            `;

            element.addEventListener('click', () => this.toggleLinkedBoxes(box, element));
            element.addEventListener('mouseenter', () => {
                if (!element.classList.contains('hidden')) {
                    element.style.background = 'rgba(255, 255, 255, 1)';
                    element.style.transform = 'scale(1.02)';
                    element.style.zIndex = '10';
                } else {
                    element.style.background = 'rgba(255, 255, 255, 0.1)';
                }
            });
            element.addEventListener('mouseleave', () => {
                if (!element.classList.contains('hidden')) {
                    element.style.background = 'rgba(255, 255, 255, 1)';
                    element.style.transform = 'scale(1)';
                    element.style.zIndex = '1';
                } else {
                    element.style.background = 'transparent';
                }
            });

            this.overlay.appendChild(element);
            box.element = element;
            
            // Auto-resize text to fit
            this.autoResizeText(element);
        });
    }

    getBoxColor(box) {
        const group = this.groups[box.group];
        return group ? group.color : '#64748b';
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

    toggleGroup(groupId, button) {
        const groupBoxes = this.boxes.filter(box => box.group === groupId);
        const group = this.groups[groupId];
        // Check if any boxes are in label state (showing group labels)
        const anyInLabelState = groupBoxes.some(box => {
            const currentText = box.element.textContent;
            const groupLabel = this.getBoxDisplayLabel(box);
            return currentText === groupLabel && !box.element.classList.contains('hidden');
        });

        groupBoxes.forEach(box => {
            if (anyInLabelState) {
                // Show answers (set to answer state)
                if (box.answer && box.answer.trim()) {
                    // Show answer
                    this.showBox(box.element, box.answer);
                    this.autoResizeText(box.element);
                } else {
                    // No answer - show transparent
                    this.hideBox(box.element);
                }
            } else {
                // Hide answers (set to label state)
                this.showBox(box.element, this.getBoxDisplayLabel(box));
                this.autoResizeText(box.element);
            }
        });

        button.textContent = anyInLabelState ? `Hide ${group.name}` : `Show ${group.name}`;
    }

    toggleBoxVisibility(box, element) {
        // Check current state - if showing group label, switch to answer state
        const currentText = element.textContent;
        const groupLabel = this.getBoxDisplayLabel(box);
        
        if (currentText === groupLabel && !element.classList.contains('hidden')) {
            // Currently showing group label - switch to answer state
            if (box.answer && box.answer.trim()) {
                // Show answer
                this.showBox(element, box.answer);
                this.autoResizeText(element);
            } else {
                // No answer - show transparent
                this.hideBox(element);
            }
        } else {
            // Currently in answer state - switch back to group label
            this.showBox(element, groupLabel);
            this.autoResizeText(element);
        }
    }

    getLinkedBoxes(boxId) {
        // Find the link group containing this box
        const linkGroup = this.linkGroups.find(group => group.has(boxId));
        if (linkGroup) {
            return Array.from(linkGroup).filter(id => id !== boxId);
        }
        return [];
    }

    toggleLinkedBoxes(box, element) {
        // Toggle the main box
        this.toggleBoxVisibility(box, element);
        
        // Toggle all linked boxes
        const linkedBoxIds = this.getLinkedBoxes(box.id);
        linkedBoxIds.forEach(linkedId => {
            const linkedBox = this.boxes.find(b => b.id === linkedId);
            if (linkedBox) {
                this.toggleBoxVisibility(linkedBox, linkedBox.element);
            }
        });
    }

    hideBox(element) {
        element.classList.add('hidden');
        element.style.background = 'transparent';
        element.style.color = 'transparent';
        element.textContent = '';
    }

    showBox(element, text) {
        element.classList.remove('hidden');
        element.style.background = 'rgba(255, 255, 255, 1)';
        element.style.color = '';
        element.textContent = text;
    }

    resetQuiz() {
        this.boxes.forEach(box => {
            this.showBox(box.element, this.getBoxDisplayLabel(box));
            this.autoResizeText(box.element);
        });

        // Reset group button text
        Object.entries(this.groups).forEach(([groupId, group]) => {
            const button = this.controls.querySelector(`button[style*="${group.color}"]`);
            if (button) {
                button.textContent = `Hide ${group.name}`;
            }
        });
    }

    toggleAllBoxes() {
        // Check if any boxes are in label state (showing group labels)
        const anyInLabelState = this.boxes.some(box => {
            const currentText = box.element.textContent;
            const groupLabel = this.getBoxDisplayLabel(box);
            return currentText === groupLabel && !box.element.classList.contains('hidden');
        });
        
        const button = this.controls.querySelector('.quiz-btn-primary');
        
        if (anyInLabelState) {
            // Show answers (switch all boxes to answer state)
            this.boxes.forEach(box => {
                if (box.answer && box.answer.trim()) {
                    // Show answer
                    this.showBox(box.element, box.answer);
                    this.autoResizeText(box.element);
                } else {
                    // No answer - show transparent
                    this.hideBox(box.element);
                }
            });
            button.textContent = 'Hide All';
        } else {
            // Hide answers (switch all boxes to label state)
            this.boxes.forEach(box => {
                this.showBox(box.element, this.getBoxDisplayLabel(box));
                this.autoResizeText(box.element);
            });
            button.textContent = 'Show All';
        }

        // Update group button text based on current state
        Object.entries(this.groups).forEach(([groupId, group]) => {
            const groupButton = this.controls.querySelector(`button[style*="${group.color}"]`);
            if (groupButton) {
                const groupBoxes = this.boxes.filter(b => b.group === groupId);
                const anyInLabelState = groupBoxes.some(b => {
                    const currentText = b.element.textContent;
                    const groupLabel = this.getBoxDisplayLabel(b);
                    return currentText === groupLabel && !b.element.classList.contains('hidden');
                });
                groupButton.textContent = anyInLabelState ? `Show ${group.name}` : `Hide ${group.name}`;
            }
        });
    }

    toggleQuizVisibility(button) {
        this.quizVisible = !this.quizVisible;
        
        if (this.quizVisible) {
            // Show quiz - make overlay and all controls visible
            this.overlay.style.display = 'block';
            
            // Show all other buttons
            const allButtons = this.controls.querySelectorAll('.quiz-btn');
            allButtons.forEach(btn => {
                if (btn !== button) {
                    btn.style.display = '';
                }
            });
            
            button.textContent = 'Hide Quiz';
            button.className = 'quiz-btn quiz-btn-hide';
        } else {
            // Hide quiz - hide all boxes and other controls
            this.overlay.style.display = 'none';
            
            // Hide all other buttons
            const allButtons = this.controls.querySelectorAll('.quiz-btn');
            allButtons.forEach(btn => {
                if (btn !== button) {
                    btn.style.display = 'none';
                }
            });
            
            button.textContent = 'Show Image Quiz';
            button.className = 'quiz-btn quiz-btn-show';
        }
    }
}

// Auto-initialize quiz images on page load
class QuizImageManager {
    constructor() {
        this.quizImages = [];
        this.init();
    }

    async init() {
        // Add CSS styles if not already present
        this.addStyles();
        
        // Initialize quiz images
        await this.initializeQuizImages();
    }

    addStyles() {
        if (document.getElementById('quiz-image-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'quiz-image-styles';
        styles.textContent = `
            .quiz-btn {
                background: #2563eb;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                transition: background-color 0.2s;
            }

            .quiz-btn:hover {
                background: #1d4ed8;
            }

            .quiz-btn-secondary {
                background: #64748b;
            }

            .quiz-btn-secondary:hover {
                background: #475569;
            }

            .quiz-btn-primary {
                background: #16a34a;
            }

            .quiz-btn-primary:hover {
                background: #15803d;
            }

            .quiz-btn-group {
                background: #f8fafc;
                color: #1e293b;
                border: 1px solid #e2e8f0;
            }

            .quiz-btn-group:hover {
                background: #f1f5f9;
            }

            .quiz-btn-show {
                background: #059669;
                color: white;
                font-weight: 600;
            }

            .quiz-btn-show:hover {
                background: #047857;
            }

            .quiz-btn-hide {
                background: #dc2626;
            }

            .quiz-btn-hide:hover {
                background: #b91c1c;
            }

            .quiz-box-runtime.hidden {
                background: transparent !important;
                color: transparent;
            }

            .quiz-box-runtime.hidden:hover {
                background: rgba(255, 255, 255, 0.1) !important;
            }

            @media (max-width: 768px) {
                .quiz-controls {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .quiz-controls button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    async initializeQuizImages() {
        const quizContainers = document.querySelectorAll('[data-quiz-config]');
        
        for (const container of quizContainers) {
            const configPath = container.dataset.quizConfig;
            try {
                const config = await this.loadConfig(configPath);
                // Extract options from config for QuizImage constructor
                const options = {
                    controlsPosition: config.controlsPosition || 'right',
                    controlsOffsetX: config.controlsOffsetX || 0,
                    controlsOffsetY: config.controlsOffsetY || 0
                };
                const quizImage = new QuizImage(container, config, options);
                this.quizImages.push(quizImage);
            } catch (error) {
                console.error(`Failed to load quiz config from ${configPath}:`, error);
            }
        }
    }

    async loadConfig(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.status}`);
        }
        return await response.json();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new QuizImageManager();
    });
} else {
    new QuizImageManager();
}

// Export for manual initialization
window.QuizImage = QuizImage;
window.QuizImageManager = QuizImageManager;