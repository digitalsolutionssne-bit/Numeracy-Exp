// ==========================================
// admin.js - Admin Dashboard Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const profileSelect = document.getElementById('profile-select');
    const btnCreate = document.getElementById('btn-create-profile');
    const btnDelete = document.getElementById('btn-delete-profile');
    const btnEnterEditor = document.getElementById('btn-enter-editor');
    const configData = document.getElementById('config-data');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const exportMsg = document.getElementById('export-msg');

    function getProfiles() {
        return JSON.parse(localStorage.getItem('numpal_profiles') || '{}');
    }

    function saveProfiles(profiles) {
        localStorage.setItem('numpal_profiles', JSON.stringify(profiles));
    }

    function getActiveProfileId() {
        return localStorage.getItem('numpal_active_profile');
    }

    function setActiveProfileId(id) {
        localStorage.setItem('numpal_active_profile', id);
    }

    function refreshProfileDropdown() {
        const profiles = getProfiles();
        const activeId = getActiveProfileId();
        
        // Ensure at least a default profile exists
        if (Object.keys(profiles).length === 0) {
            const defaultId = 'profile_' + Date.now();
            profiles[defaultId] = { name: 'Default Layout', styles: {} };
            saveProfiles(profiles);
            setActiveProfileId(defaultId);
        }

        profileSelect.innerHTML = '';
        for (const [id, profile] of Object.entries(getProfiles())) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = profile.name;
            if (id === getActiveProfileId()) {
                opt.selected = true;
            }
            profileSelect.appendChild(opt);
        }
    }

    profileSelect.addEventListener('change', (e) => {
        setActiveProfileId(e.target.value);
        if(typeof window.showToast === 'function') window.showToast('Profile applied successfully!');
    });

    btnCreate.addEventListener('click', () => {
        const name = prompt("Enter a name for the new profile:");
        if (name && name.trim()) {
            const profiles = getProfiles();
            const newId = 'profile_' + Date.now();
            profiles[newId] = { name: name.trim(), styles: {} };
            saveProfiles(profiles);
            setActiveProfileId(newId);
            refreshProfileDropdown();
            if(typeof window.showToast === 'function') window.showToast('Profile created!');
        }
    });

    btnDelete.addEventListener('click', () => {
        const profiles = getProfiles();
        const activeId = getActiveProfileId();
        
        if (Object.keys(profiles).length <= 1) {
            alert("Cannot delete the only remaining profile.");
            return;
        }

        if (confirm(`Are you sure you want to delete profile: "${profiles[activeId].name}"?`)) {
            delete profiles[activeId];
            saveProfiles(profiles);
            
            // Set active to first available
            const firstId = Object.keys(profiles)[0];
            setActiveProfileId(firstId);
            refreshProfileDropdown();
            if(typeof window.showToast === 'function') window.showToast('Profile deleted.');
        }
    });

    btnEnterEditor.addEventListener('click', () => {
        const activeId = getActiveProfileId();
        if (!activeId) {
            alert("Please select or create a profile first.");
            return;
        }
        // Set mode flag and redirect to main app index
        localStorage.setItem('numpal_admin_edit_mode', 'true');
        window.location.href = '../../index.html';
    });

    btnExport.addEventListener('click', () => {
        const payload = {
            version: "1.0",
            profiles: getProfiles()
        };
        const jsonStr = JSON.stringify(payload, null, 2);
        configData.value = jsonStr;
        
        navigator.clipboard.writeText(jsonStr).then(() => {
            exportMsg.style.display = 'block';
            setTimeout(() => { exportMsg.style.display = 'none'; }, 3000);
        }).catch(err => {
            console.error('Clipboard copy failed', err);
            if(typeof window.showToast === 'function') window.showToast('Export generated. Please copy text manually.');
        });
    });

    btnImport.addEventListener('click', () => {
        try {
            const inputData = configData.value.trim();
            if (!inputData) throw new Error("No data to import.");
            
            const payload = JSON.parse(inputData);
            if (!payload.profiles) throw new Error("Invalid format. Missing 'profiles' object.");

            const currentProfiles = getProfiles();
            // Merge profiles
            for (const [id, profile] of Object.entries(payload.profiles)) {
                // To avoid overriding locally created profiles with same timestamp ID by coincidence,
                // we create fresh IDs for imported profiles, unless they explicitly want to overwrite (we'll just create new)
                const newId = 'imported_' + id + '_' + Date.now();
                currentProfiles[newId] = {
                    name: profile.name + " (Imported)",
                    styles: profile.styles || {}
                };
            }
            saveProfiles(currentProfiles);
            refreshProfileDropdown();
            
            configData.value = '';
            if(typeof window.showToast === 'function') window.showToast('Configurations imported successfully!');

        } catch (err) {
            alert("Import failed: " + err.message);
        }
    });

    // Initialize
    refreshProfileDropdown();
});