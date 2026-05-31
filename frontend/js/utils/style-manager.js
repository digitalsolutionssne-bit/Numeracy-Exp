// ==========================================
// style-manager.js - Handles custom profiles
// ==========================================

window.StyleManager = {
    init: function() {
        // Run immediately to inject styles
        this.applyStyles();
    },
    
    applyStyles: function() {
        const activeProfileId = localStorage.getItem('numpal_active_profile') || null;
        const profiles = JSON.parse(localStorage.getItem('numpal_profiles') || '{}');
        const isEditMode = localStorage.getItem('numpal_admin_edit_mode') === 'true';
        
        let cssString = '';
        
        if (activeProfileId && profiles[activeProfileId] && profiles[activeProfileId].styles) {
            for (const [editId, rules] of Object.entries(profiles[activeProfileId].styles)) {
                let ruleStr = '';
                
                if (rules.fontSize && rules.fontSize !== 100) {
                    ruleStr += `font-size: ${rules.fontSize}% !important; `;
                }
                
                if (rules.hidden) {
                    if (isEditMode) {
                        // Ghost mode so the Admin can still select and unhide it
                        ruleStr += `opacity: 0.3 !important; border: 2px dashed #F44336 !important; display: block !important; `;
                    } else {
                        ruleStr += `display: none !important; `;
                    }
                } else {
                    let transformStr = '';
                    if (rules.x || rules.y) transformStr += `translate(${rules.x || 0}px, ${rules.y || 0}px) `;
                    if (rules.scale && rules.scale !== 100) transformStr += `scale(${rules.scale / 100}) `;
                    
                    if (transformStr) {
                        ruleStr += `transform: ${transformStr} !important; `;
                    }
                }
                
                if (ruleStr) {
                    cssString += `[data-edit-id="${editId}"] { ${ruleStr} transition: all 0.2s ease-out; }\n`;
                }
            }
        }
        
        // Setup Editor Mode CSS
        if (isEditMode) {
            cssString += `
                body.numpal-edit-mode [data-edit-id] {
                    cursor: crosshair !important;
                    outline: 2px dashed #4CAF50;
                    outline-offset: 2px;
                }
                body.numpal-edit-mode [data-edit-id]:hover {
                    outline: 4px solid #4CAF50 !important;
                    background-color: rgba(76, 175, 80, 0.1) !important;
                }
            `;
        }
        
        let styleEl = document.getElementById('numpal-custom-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'numpal-custom-styles';
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = cssString;
    },
    
    updateElementStyle: function(editId, updates) {
        const activeProfileId = localStorage.getItem('numpal_active_profile');
        if(!activeProfileId) return;
        
        const profiles = JSON.parse(localStorage.getItem('numpal_profiles') || '{}');
        if(!profiles[activeProfileId]) return;
        
        if (!profiles[activeProfileId].styles) profiles[activeProfileId].styles = {};
        if (!profiles[activeProfileId].styles[editId]) {
            profiles[activeProfileId].styles[editId] = { fontSize: 100, scale: 100, x: 0, y: 0, hidden: false };
        }
        
        profiles[activeProfileId].styles[editId] = { ...profiles[activeProfileId].styles[editId], ...updates };
        localStorage.setItem('numpal_profiles', JSON.stringify(profiles));
        
        this.applyStyles();
    },
    
    getStyle: function(editId) {
        const activeProfileId = localStorage.getItem('numpal_active_profile');
        if(!activeProfileId) return { fontSize: 100, scale: 100, x: 0, y: 0, hidden: false };
        
        const profiles = JSON.parse(localStorage.getItem('numpal_profiles') || '{}');
        if(!profiles[activeProfileId] || !profiles[activeProfileId].styles || !profiles[activeProfileId].styles[editId]) {
            return { fontSize: 100, scale: 100, x: 0, y: 0, hidden: false };
        }
        return profiles[activeProfileId].styles[editId];
    }
};

window.StyleManager.init();