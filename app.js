// ==========================================
// --- ENVIRONMENT CONFIGURATION ---
// ==========================================
// Options: 'experimental', 'test', 'prod'
const APP_ENV = 'experimental'; 

if (APP_ENV !== 'prod') {
    const envBanner = document.createElement('div');
    envBanner.style.backgroundColor = '#D32F2F'; // Solid distinct red
    envBanner.style.color = '#FFFFFF';
    envBanner.style.textAlign = 'center';
    envBanner.style.fontWeight = '900';
    envBanner.style.padding = '4px 0';
    envBanner.style.fontSize = '0.9rem';
    envBanner.style.letterSpacing = '1px';
    envBanner.style.textTransform = 'uppercase';
    envBanner.style.flexShrink = '0';
    envBanner.style.width = '100%';
    envBanner.style.zIndex = '99999';
    envBanner.innerText = `${APP_ENV} ENVIRONMENT`;
    
    // Injects the banner at the very top of the app automatically
    document.body.insertBefore(envBanner, document.body.firstChild);
}


// ==========================================
// --- GLOBAL PWA & THEME LOGIC ---
// ==========================================
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') document.body.setAttribute('data-theme', 'dark');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}

const forceUpdateBtn = document.getElementById('force-update-btn');
if (forceUpdateBtn) {
    forceUpdateBtn.addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) { registration.unregister(); }
                caches.keys().then(keys => {
                    Promise.all(keys.map(key => caches.delete(key))).then(() => {
                        window.location.reload(true);
                    });
                });
            });
        } else { window.location.reload(true); }
    });
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Reg Failed: ', err));
    });
}

function showToast(message, isError = false) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.style.backgroundColor = isError ? 'var(--error-color)' : 'var(--success-color)';
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
window.showToast = showToast;


// ==========================================
// --- ROLODEX LOGIC ---
// ==========================================
window.RoloGen = {
    hours12: () => Array.from({length: 12}, (_, i) => (i === 0 ? 12 : i).toString()),
    hours24: () => Array.from({length: 24}, (_, i) => i.toString()),
    mins60: () => Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')),
    ampm: () =>['AM', 'PM'],
    days31: () => Array.from({length: 31}, (_, i) => (i + 1).toString()),
    monthsSpec: () =>['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    years: (start, count) => Array.from({length: count}, (_, i) => (start + i).toString())
};

window.openRolodex = function(title, colsConfig, onSave) {
    let backdrop = document.getElementById('global-rolodex-backdrop');
    let sheet = document.getElementById('global-rolodex-sheet');
    
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'global-rolodex-backdrop';
        backdrop.className = 'bottom-sheet-backdrop';
        document.body.appendChild(backdrop);
        
        sheet = document.createElement('div');
        sheet.id = 'global-rolodex-sheet';
        sheet.className = 'bottom-sheet rolodex-sheet';
        document.body.appendChild(sheet);
    }
    
    let html = `
        <div class="rolodex-header">
            <div class="rolodex-cancel" onclick="document.getElementById('global-rolodex-backdrop').classList.remove('show'); document.getElementById('global-rolodex-sheet').classList.remove('show');">Cancel</div>
            <div class="rolodex-title">${title}</div>
            <div class="rolodex-save" id="rolo-save-btn">Save</div>
        </div>
        <div class="rolodex-body" id="rolo-body">
            <div class="rolodex-highlight"></div>
        </div>
    `;
    sheet.innerHTML = html;
    
    const bodyEl = document.getElementById('rolo-body');
    const ITEM_HEIGHT = 44; 
    let instances =[];

    colsConfig.forEach(col => {
        const wrapper = document.createElement('div');
        wrapper.className = 'rolodex-col-wrapper';
        if (col.flex) wrapper.style.flex = col.flex;

        const colEl = document.createElement('div');
        colEl.className = 'rolodex-col' + (col.suffixLabel ? ' has-suffix' : '');
        
        const innerEl = document.createElement('div');
        innerEl.className = 'rolodex-col-inner';
        
        let initialIndex = col.items.findIndex(x => x == col.selectedValue);
        if (initialIndex === -1) initialIndex = 0;

        const infinite = col.infinite !== false;

        function renderItems() {
            innerEl.innerHTML = '';
            if (infinite) {
                for (let i = 0; i < col.items.length * 3; i++) {
                    let d = document.createElement('div');
                    d.className = 'rolodex-item';
                    d.innerText = col.items[i % col.items.length];
                    innerEl.appendChild(d);
                }
            } else {
                col.items.forEach(val => {
                    let d = document.createElement('div');
                    d.className = 'rolodex-item';
                    d.innerText = val;
                    innerEl.appendChild(d);
                });
            }
        }
        renderItems();
        colEl.appendChild(innerEl);
        wrapper.appendChild(colEl);
        
        if (col.suffixLabel) {
            const sufEl = document.createElement('div');
            sufEl.className = 'rolodex-static-label';
            sufEl.innerText = col.suffixLabel;
            wrapper.appendChild(sufEl);
        }
        
        bodyEl.appendChild(wrapper);

        let currentY = infinite ? -(initialIndex + col.items.length) * ITEM_HEIGHT : -initialIndex * ITEM_HEIGHT;
        let startY = 0, isDragging = false, lastY = 0, velocity = 0;

        function updateTransform() {
            if (infinite) {
                const totalH = col.items.length * ITEM_HEIGHT;
                if (currentY > -totalH) currentY -= totalH;
                if (currentY < -(totalH * 2)) currentY += totalH;
            } else {
                const maxScroll = 0;
                const minScroll = -((col.items.length - 1) * ITEM_HEIGHT);
                if (currentY > maxScroll) currentY = maxScroll;
                if (currentY < minScroll) currentY = minScroll;
            }
            innerEl.style.transform = `translateY(${currentY}px)`;
            
            const centerIdx = Math.round(Math.abs(currentY) / ITEM_HEIGHT);
            Array.from(innerEl.children).forEach((child, i) => {
                if (i === centerIdx) child.classList.add('active');
                else child.classList.remove('active');
            });
        }

        colEl.addEventListener('touchstart', e => {
            isDragging = true;
            startY = e.touches[0].clientY - currentY;
            lastY = e.touches[0].clientY;
            velocity = 0;
            innerEl.style.transition = 'none';
        }, {passive: false});

        colEl.addEventListener('touchmove', e => {
            if (!isDragging) return;
            e.preventDefault();
            const y = e.touches[0].clientY;
            velocity = y - lastY;
            lastY = y;
            currentY = y - startY;
            updateTransform();
        }, {passive: false});

        colEl.addEventListener('touchend', () => {
            isDragging = false;
            innerEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            currentY += velocity * 5; 
            currentY = Math.round(currentY / ITEM_HEIGHT) * ITEM_HEIGHT;
            updateTransform();
        });

        // Mouse fallbacks
        colEl.addEventListener('mousedown', e => {
            isDragging = true;
            startY = e.clientY - currentY;
            lastY = e.clientY;
            velocity = 0;
            innerEl.style.transition = 'none';
        });
        window.addEventListener('mousemove', e => {
            if(!isDragging) return;
            const y = e.clientY;
            velocity = y - lastY;
            lastY = y;
            currentY = y - startY;
            updateTransform();
        });
        window.addEventListener('mouseup', () => {
            if(!isDragging) return;
            isDragging = false;
            innerEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            currentY += velocity * 5; 
            currentY = Math.round(currentY / ITEM_HEIGHT) * ITEM_HEIGHT;
            updateTransform();
        });

        updateTransform();

        instances.push(() => {
            const centerIdx = Math.round(Math.abs(currentY) / ITEM_HEIGHT);
            const actualIdx = infinite ? (centerIdx % col.items.length) : centerIdx;
            return { id: col.id, val: col.items[actualIdx] };
        });
    });

    document.getElementById('rolo-save-btn').onclick = () => {
        let result = {};
        instances.forEach(getVal => {
            const r = getVal();
            result[r.id] = r.val;
        });
        backdrop.classList.remove('show');
        sheet.classList.remove('show');
        if(onSave) onSave(result);
    };

    setTimeout(() => {
        backdrop.classList.add('show');
        sheet.classList.add('show');
    }, 10);
};


// ==========================================
// --- TEACHER CONFIG MANAGER ENGINE ---
// ==========================================

const GAS_CONFIG_URL = ''; // Add your App Script Endpoint here to sync globally

const ConfigManager = {
    defaultConfig: {
        fontSize: 16,
        uiScale: 1.0,
        walletCols: 2,
        orderItems: 1,
        orderCashier: 2
    },

    getProfiles: function() {
        const stored = localStorage.getItem('numpal_profiles');
        return stored ? JSON.parse(stored) : { "Local Default": this.defaultConfig };
    },

    getActiveProfileName: function() {
        return localStorage.getItem('numpal_active_profile') || "Local Default";
    },

    applyConfig: function(config) {
        const root = document.documentElement;
        root.style.setProperty('--base-font-size', `${config.fontSize}px`);
        root.style.setProperty('--ui-scale', config.uiScale);
        root.style.setProperty('--wallet-cols', config.walletCols);
        root.style.setProperty('--order-items', config.orderItems);
        root.style.setProperty('--order-cashier', config.orderCashier);
    },

    init: function() {
        const profiles = this.getProfiles();
        const activeName = this.getActiveProfileName();
        this.applyConfig(profiles[activeName] || this.defaultConfig);

        // Optional: Attempt Global Fetch if URL exists
        if (GAS_CONFIG_URL) {
            fetch(`${GAS_CONFIG_URL}?action=getConfig`)
                .then(res => res.json())
                .then(data => {
                    if(data && data.globalConfig) {
                        profiles["Global Default"] = data.globalConfig;
                        localStorage.setItem('numpal_profiles', JSON.stringify(profiles));
                        if(activeName === "Global Default") this.applyConfig(data.globalConfig);
                    }
                }).catch(e => console.log("Offline or Global Fetch failed."));
        }
    }
};

ConfigManager.init();

// --- TEACHER UI OVERLAY ---
function buildTeacherUI() {
    let backdrop = document.getElementById('teacher-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'teacher-backdrop';
        backdrop.className = 'bottom-sheet-backdrop';
        document.body.appendChild(backdrop);
        
        let sheet = document.createElement('div');
        sheet.id = 'teacher-sheet';
        sheet.className = 'bottom-sheet teacher-panel';
        document.body.appendChild(sheet);
    }
    
    const profiles = ConfigManager.getProfiles();
    const activeProfile = ConfigManager.getActiveProfileName();
    const curConf = profiles[activeProfile] || ConfigManager.defaultConfig;

    let profileOptions = Object.keys(profiles).map(name => `<option value="${name}" ${name === activeProfile ? 'selected' : ''}>${name}</option>`).join('');

    document.getElementById('teacher-sheet').innerHTML = `
        <div class="rolodex-header" style="justify-content:space-between; padding:0 0 15px 0; border:none;">
            <div class="rolodex-title" style="font-size:1.6rem; color:var(--primary-color);">Teacher Dashboard</div>
            <div class="rolodex-cancel" onclick="closeTeacherUI()">Close</div>
        </div>

        <div class="teacher-group">
            <label>Active Profile</label>
            <select id="tc-profile-select" onchange="switchTeacherProfile(this.value)">
                ${profileOptions}
            </select>
        </div>

        <div class="teacher-group">
            <label>Base Font Size (<span id="tc-font-val">${curConf.fontSize}</span>px)</label>
            <input type="range" id="tc-font" min="12" max="32" value="${curConf.fontSize}" oninput="updateLiveConfig()">
        </div>

        <div class="teacher-group">
            <label>UI Scaling (<span id="tc-scale-val">${curConf.uiScale}</span>x)</label>
            <input type="range" id="tc-scale" min="0.7" max="2.0" step="0.1" value="${curConf.uiScale}" oninput="updateLiveConfig()">
        </div>

        <div class="teacher-group">
            <label>Wallet Grid Columns</label>
            <select id="tc-cols" onchange="updateLiveConfig()">
                <option value="2" ${curConf.walletCols == 2 ? 'selected' : ''}>2 Columns (Big Coins)</option>
                <option value="3" ${curConf.walletCols == 3 ? 'selected' : ''}>3 Columns (Medium)</option>
                <option value="4" ${curConf.walletCols == 4 ? 'selected' : ''}>4 Columns (Dense)</option>
            </select>
        </div>

        <div class="teacher-group">
            <label>Purchasing Layout Order</label>
            <select id="tc-order" onchange="updateLiveConfig()">
                <option value="1,2" ${curConf.orderItems == 1 ? 'selected' : ''}>Items First, Cashier Second</option>
                <option value="2,1" ${curConf.orderItems == 2 ? 'selected' : ''}>Cashier First, Items Second</option>
            </select>
        </div>

        <div class="teacher-row">
            <button class="primary-btn" style="background-color: var(--success-color);" onclick="saveTeacherConfig('current')">Save Changes</button>
        </div>
        <div class="teacher-row">
            <button class="primary-btn" style="background-color: #9C27B0;" onclick="saveTeacherConfig('new')">Save as New Profile</button>
        </div>
    `;

    document.getElementById('teacher-backdrop').classList.add('show');
    document.getElementById('teacher-sheet').classList.add('show');
}

window.closeTeacherUI = function() {
    document.getElementById('teacher-backdrop').classList.remove('show');
    document.getElementById('teacher-sheet').classList.remove('show');
    ConfigManager.init(); // Revert to saved if cancelled
}

window.updateLiveConfig = function() {
    const font = document.getElementById('tc-font').value;
    const scale = document.getElementById('tc-scale').value;
    const cols = document.getElementById('tc-cols').value;
    const orderArr = document.getElementById('tc-order').value.split(',');

    document.getElementById('tc-font-val').innerText = font;
    document.getElementById('tc-scale-val').innerText = scale;

    ConfigManager.applyConfig({
        fontSize: font, uiScale: scale, walletCols: cols,
        orderItems: orderArr[0], orderCashier: orderArr[1]
    });
}

window.switchTeacherProfile = function(profileName) {
    localStorage.setItem('numpal_active_profile', profileName);
    buildTeacherUI();
    ConfigManager.init();
}

window.saveTeacherConfig = function(mode) {
    const profiles = ConfigManager.getProfiles();
    let profileName = document.getElementById('tc-profile-select').value;
    
    const newConfig = {
        fontSize: document.getElementById('tc-font').value,
        uiScale: document.getElementById('tc-scale').value,
        walletCols: document.getElementById('tc-cols').value,
        orderItems: document.getElementById('tc-order').value.split(',')[0],
        orderCashier: document.getElementById('tc-order').value.split(',')[1]
    };

    if (mode === 'new') {
        profileName = prompt("Enter a name for this new profile:");
        if (!profileName) return;
    }

    profiles[profileName] = newConfig;
    localStorage.setItem('numpal_profiles', JSON.stringify(profiles));
    localStorage.setItem('numpal_active_profile', profileName);
    
    showToast("Configuration Saved!", false);
    buildTeacherUI();
}

// Hidden Trigger: Press and hold top-bar h1 for 2.5 seconds
document.querySelectorAll('.top-bar h1').forEach(header => {
    let pressTimer;
    header.addEventListener('pointerdown', (e) => {
        pressTimer = setTimeout(() => { buildTeacherUI(); }, 2500);
    });
    header.addEventListener('pointerup', () => clearTimeout(pressTimer));
    header.addEventListener('pointerleave', () => clearTimeout(pressTimer));
});
