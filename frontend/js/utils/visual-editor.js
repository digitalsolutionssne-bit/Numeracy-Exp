// =========================================================
// visual-editor.js - On-device layout customizer for Admins
// =========================================================

(function() {
    if (localStorage.getItem('numpal_admin_edit_mode') !== 'true') return;

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
        initVisualEditor();
    });

    let isEditModeActive = true; 
    let currentSelectedId = null;

    function initVisualEditor() {
        document.body.classList.add('numpal-edit-mode');
        
        // Inject Floating Action Bar
        const bar = document.createElement('div');
        bar.id = 'visual-editor-ui';
        bar.style.position = 'fixed';
        bar.style.bottom = '10px';
        bar.style.left = '50%';
        bar.style.transform = 'translateX(-50%)';
        bar.style.background = '#333';
        bar.style.color = '#fff';
        bar.style.padding = '10px 20px';
        bar.style.borderRadius = '30px';
        bar.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        bar.style.gap = '15px';
        bar.style.zIndex = '999999';
        bar.style.fontFamily = 'sans-serif';

        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = 'Mode: EDITING';
        toggleBtn.style.background = '#4CAF50';
        toggleBtn.style.color = '#fff';
        toggleBtn.style.border = 'none';
        toggleBtn.style.padding = '8px 16px';
        toggleBtn.style.borderRadius = '15px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontWeight = 'bold';

        toggleBtn.addEventListener('click', () => {
            isEditModeActive = !isEditModeActive;
            if (isEditModeActive) {
                toggleBtn.innerText = 'Mode: EDITING';
                toggleBtn.style.background = '#4CAF50';
                document.body.classList.add('numpal-edit-mode');
            } else {
                toggleBtn.innerText = 'Mode: NAVIGATE';
                toggleBtn.style.background = '#FF9800';
                document.body.classList.remove('numpal-edit-mode');
            }
        });

        const exitBtn = document.createElement('button');
        exitBtn.innerText = 'Finish & Save';
        exitBtn.style.background = '#F44336';
        exitBtn.style.color = '#fff';
        exitBtn.style.border = 'none';
        exitBtn.style.padding = '8px 16px';
        exitBtn.style.borderRadius = '15px';
        exitBtn.style.cursor = 'pointer';
        exitBtn.style.fontWeight = 'bold';

        exitBtn.addEventListener('click', () => {
            localStorage.setItem('numpal_admin_edit_mode', 'false');
            document.body.classList.remove('numpal-edit-mode');
            
            // Navigate back to Admin Dashboard
            const rootPath = window.location.pathname.includes('/frontend/pages/') ? 'admin.html' : 'frontend/pages/admin.html';
            window.location.href = rootPath;
        });

        bar.appendChild(toggleBtn);
        bar.appendChild(exitBtn);
        document.body.appendChild(bar);

        // Inject Config Panel (Draggable)
        const panel = document.createElement('div');
        panel.id = 'visual-editor-panel';
        panel.style.position = 'fixed';
        // Initialize at a sensible default position without transform to allow simple left/top dragging
        panel.style.top = '60px';
        panel.style.left = Math.max(10, (window.innerWidth - 300) / 2) + 'px';
        panel.style.width = '300px';
        panel.style.background = '#fff';
        panel.style.color = '#333';
        panel.style.padding = '20px';
        panel.style.borderRadius = '16px';
        panel.style.boxShadow = '0 15px 35px rgba(0,0,0,0.4)';
        panel.style.zIndex = '9999999';
        panel.style.display = 'none';
        panel.style.flexDirection = 'column';
        panel.style.gap = '15px';
        panel.style.fontFamily = 'sans-serif';
        panel.style.boxSizing = 'border-box';

        // Drag Handle / Header
        const header = document.createElement('div');
        header.style.cursor = 'move';
        header.style.background = '#e0e0e0';
        header.style.padding = '12px';
        header.style.borderRadius = '16px 16px 0 0';
        header.style.margin = '-20px -20px 10px -20px';
        header.style.fontWeight = 'bold';
        header.style.textAlign = 'center';
        header.style.color = '#555';
        header.style.userSelect = 'none';
        header.innerText = '✋ Drag to Move Pane';
        
        // Drag Logic
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const startDrag = (e) => {
            isDragging = true;
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const rect = panel.getBoundingClientRect();
            dragOffsetX = clientX - rect.left;
            dragOffsetY = clientY - rect.top;
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            panel.style.left = (clientX - dragOffsetX) + 'px';
            panel.style.top = (clientY - dragOffsetY) + 'px';
        };

        const stopDrag = () => { isDragging = false; };

        header.addEventListener('mousedown', startDrag);
        header.addEventListener('touchstart', startDrag, {passive: false});
        document.addEventListener('mousemove', onDrag, {passive: false});
        document.addEventListener('touchmove', onDrag, {passive: false});
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);

        panel.appendChild(header);

        // UI Body
        const panelBody = document.createElement('div');
        panelBody.style.display = 'flex';
        panelBody.style.flexDirection = 'column';
        panelBody.style.gap = '15px';
        panelBody.innerHTML = `
            <div style="text-align:center;">
                <h3 style="margin:0; color:#2196F3; font-size:1.2rem;">Adjust Component</h3>
                <p id="ve-selected-id" style="margin:5px 0 0 0; font-size:0.8rem; color:#888;"></p>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.9rem; font-weight:bold;">Font Size (<span id="ve-val-fs">100</span>%)</label>
                <input type="range" id="ve-fs" min="50" max="300" step="5" value="100">
            </div>
            
            <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.9rem; font-weight:bold;">Scale Size (<span id="ve-val-sc">100</span>%)</label>
                <input type="range" id="ve-sc" min="50" max="300" step="5" value="100">
            </div>

            <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.9rem; font-weight:bold;">Move Left/Right (<span id="ve-val-x">0</span>px)</label>
                <input type="range" id="ve-x" min="-300" max="300" step="5" value="0">
            </div>

            <div style="display:flex; flex-direction:column; gap:4px;">
                <label style="font-size:0.9rem; font-weight:bold;">Move Up/Down (<span id="ve-val-y">0</span>px)</label>
                <input type="range" id="ve-y" min="-300" max="300" step="5" value="0">
            </div>

            <label style="display:flex; align-items:center; gap:8px; font-weight:bold; color:#F44336; margin-top:5px;">
                <input type="checkbox" id="ve-hide" style="width:20px; height:20px;"> Hide Component
            </label>
            
            <div style="display:flex; justify-content:space-between; margin-top:10px;">
                <button id="ve-btn-reset" style="padding:8px; background:#ddd; border:none; border-radius:8px; cursor:pointer;">Reset</button>
                <button id="ve-btn-close" style="padding:8px 16px; background:#2196F3; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Done</button>
            </div>
        `;
        
        panel.appendChild(panelBody);
        document.body.appendChild(panel);

        // Bind Sliders
        const slFs = document.getElementById('ve-fs');
        const slSc = document.getElementById('ve-sc');
        const slX = document.getElementById('ve-x');
        const slY = document.getElementById('ve-y');
        const cbHide = document.getElementById('ve-hide');

        const vFs = document.getElementById('ve-val-fs');
        const vSc = document.getElementById('ve-val-sc');
        const vX = document.getElementById('ve-val-x');
        const vY = document.getElementById('ve-val-y');

        function liveUpdate() {
            if (!currentSelectedId) return;
            const updates = {
                fontSize: parseInt(slFs.value),
                scale: parseInt(slSc.value),
                x: parseInt(slX.value),
                y: parseInt(slY.value),
                hidden: cbHide.checked
            };
            vFs.innerText = updates.fontSize;
            vSc.innerText = updates.scale;
            vX.innerText = updates.x;
            vY.innerText = updates.y;
            
            window.StyleManager.updateElementStyle(currentSelectedId, updates);
        }

        slFs.addEventListener('input', liveUpdate);
        slSc.addEventListener('input', liveUpdate);
        slX.addEventListener('input', liveUpdate);
        slY.addEventListener('input', liveUpdate);
        cbHide.addEventListener('change', liveUpdate);

        document.getElementById('ve-btn-reset').addEventListener('click', () => {
            slFs.value = 100; slSc.value = 100; slX.value = 0; slY.value = 0; cbHide.checked = false;
            liveUpdate();
        });

        document.getElementById('ve-btn-close').addEventListener('click', () => {
            panel.style.display = 'none';
            currentSelectedId = null;
        });

        // Intercept Clicks globally
        document.addEventListener('click', (e) => {
            if (!isEditModeActive) return;
            
            // Allow interactions with the editor UI itself
            if (e.target.closest('#visual-editor-ui') || e.target.closest('#visual-editor-panel')) return;

            const target = e.target.closest('[data-edit-id]');
            if (!target) return;

            e.preventDefault();
            e.stopPropagation();

            currentSelectedId = target.getAttribute('data-edit-id');
            document.getElementById('ve-selected-id').innerText = `ID: ${currentSelectedId}`;
            
            const currentStyles = window.StyleManager.getStyle(currentSelectedId);
            slFs.value = currentStyles.fontSize || 100;
            slSc.value = currentStyles.scale || 100;
            slX.value = currentStyles.x || 0;
            slY.value = currentStyles.y || 0;
            cbHide.checked = currentStyles.hidden || false;
            
            vFs.innerText = slFs.value;
            vSc.innerText = slSc.value;
            vX.innerText = slX.value;
            vY.innerText = slY.value;

            panel.style.display = 'flex';
        }, true); 
    }
})();