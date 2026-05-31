// ==========================================
// admin.js - Admin Dashboard Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Basic Management UI Elements
    const profileSelect = document.getElementById('profile-select');
    const btnCreate = document.getElementById('btn-create-profile');
    const btnDelete = document.getElementById('btn-delete-profile');
    const btnEnterEditor = document.getElementById('btn-enter-editor');
    
    // Manual Backup UI Elements
    const configData = document.getElementById('config-data');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const exportMsg = document.getElementById('export-msg');
    
    // Cloud Sync UI Elements
    const radioSyncTypes = document.getElementsByName('cloudSyncType');
    const cloudNewGroup = document.getElementById('cloud-new-group');
    const cloudUpdateGroup = document.getElementById('cloud-update-group');
    const cloudNewName = document.getElementById('cloud-new-name');
    const cloudUpdateName = document.getElementById('cloud-update-name');
    const cloudVersionDesc = document.getElementById('cloud-version-desc');
    const btnCloudBackup = document.getElementById('btn-cloud-backup');
    
    const cloudDownloadName = document.getElementById('cloud-download-name');
    const cloudDownloadVersion = document.getElementById('cloud-download-version');
    const btnCloudDownload = document.getElementById('btn-cloud-download');
    const btnRefreshCloud = document.getElementById('btn-refresh-cloud');

    let globalCloudData = {};

    // ==========================================
    // Local Profile Management Logic
    // ==========================================

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
        localStorage.setItem('numpal_admin_edit_mode', 'true');
        window.location.href = '../../index.html';
    });

    // ==========================================
    // Manual Backup Logic
    // ==========================================

    btnExport.addEventListener('click', () => {
        const payload = { version: "1.0", profiles: getProfiles() };
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
            for (const [id, profile] of Object.entries(payload.profiles)) {
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

    // ==========================================
    // Cloud Sync Logic
    // ==========================================

    async function apiCall(payload) {
        if (!navigator.onLine) {
            throw new Error("You are offline. Please connect to the internet.");
        }
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.error && result.error === true) {
            throw new Error(result.message || "Unknown API Error");
        }
        return result;
    }

    async function fetchCloudData() {
        try {
            if(typeof window.showToast === 'function') window.showToast("Loading Cloud Profiles...");
            btnRefreshCloud.disabled = true;
            btnRefreshCloud.innerText = "⏳ Loading...";

            const res = await apiCall({ action: 'getProfiles' });
            globalCloudData = res.db || {};
            
            populateCloudDropdowns();
            
            if(typeof window.showToast === 'function') window.showToast("Cloud Data Sync Complete!");
        } catch (err) {
            alert("Failed to load cloud profiles: " + err.message);
        } finally {
            btnRefreshCloud.disabled = false;
            btnRefreshCloud.innerText = "🔄 Refresh Cloud Profiles";
        }
    }

    function populateCloudDropdowns() {
        const profileNames = Object.keys(globalCloudData);
        
        cloudUpdateName.innerHTML = '';
        cloudDownloadName.innerHTML = '';
        
        if (profileNames.length === 0) {
            cloudUpdateName.innerHTML = '<option value="">No profiles in cloud</option>';
            cloudDownloadName.innerHTML = '<option value="">No profiles in cloud</option>';
            cloudDownloadVersion.innerHTML = '';
            return;
        }

        profileNames.forEach(name => {
            const opt1 = document.createElement('option');
            opt1.value = name; opt1.textContent = name;
            cloudUpdateName.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = name; opt2.textContent = name;
            cloudDownloadName.appendChild(opt2);
        });

        populateVersionsDropdown();
    }

    function populateVersionsDropdown() {
        const selectedProfile = cloudDownloadName.value;
        cloudDownloadVersion.innerHTML = '';

        if (!selectedProfile || !globalCloudData[selectedProfile]) return;

        const history = globalCloudData[selectedProfile];
        // Sort history by version descending (newest first)
        const sortedHistory = [...history].sort((a,b) => b.version - a.version);

        sortedHistory.forEach(v => {
            const dateStr = new Date(v.timestamp).toLocaleDateString();
            const opt = document.createElement('option');
            opt.value = v.version;
            opt.textContent = `v${v.version} - ${v.description} (${dateStr})`;
            cloudDownloadVersion.appendChild(opt);
        });
    }

    cloudDownloadName.addEventListener('change', populateVersionsDropdown);

    radioSyncTypes.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'new') {
                cloudNewGroup.style.display = 'block';
                cloudUpdateGroup.style.display = 'none';
            } else {
                cloudNewGroup.style.display = 'none';
                cloudUpdateGroup.style.display = 'block';
            }
        });
    });

    btnCloudBackup.addEventListener('click', async () => {
        const syncType = document.querySelector('input[name="cloudSyncType"]:checked').value;
        const description = cloudVersionDesc.value.trim() || "Manual Backup";
        const profiles = getProfiles();
        const activeId = getActiveProfileId();
        const activeStyles = profiles[activeId].styles || {};
        
        let payload = { description, styles: activeStyles };

        if (syncType === 'new') {
            const newName = cloudNewName.value.trim();
            if (!newName) return alert("Please enter a new profile name.");
            payload.action = 'saveProfile';
            payload.profileName = newName;
        } else {
            const updateName = cloudUpdateName.value;
            if (!updateName) return alert("Please select an existing cloud profile.");
            payload.action = 'addVersion';
            payload.profileName = updateName;
        }

        try {
            btnCloudBackup.disabled = true;
            btnCloudBackup.innerText = "⏳ Saving to Cloud...";
            
            const res = await apiCall(payload);
            
            if (res.success === false && res.error === "NAME_CONFLICT") {
                alert("This profile name already exists in the cloud! To avoid overwriting it, please choose a different name, or select 'Update Existing' to add a new version to it.");
                return;
            }

            if (res.success === false && res.error === "NOT_FOUND") {
                alert("The selected profile no longer exists in the cloud. Please refresh.");
                return;
            }

            if(typeof window.showToast === 'function') window.showToast("Successfully backed up to Google Drive!");
            cloudNewName.value = '';
            cloudVersionDesc.value = '';
            
            // Reload data to reflect changes
            await fetchCloudData();

        } catch (err) {
            alert("Backup failed: " + err.message);
        } finally {
            btnCloudBackup.disabled = false;
            btnCloudBackup.innerText = "☁️ Save to Google Drive";
        }
    });

    btnCloudDownload.addEventListener('click', () => {
        const profileName = cloudDownloadName.value;
        const versionStr = cloudDownloadVersion.value;

        if (!profileName || !versionStr) return alert("Please select a valid profile and version to download.");

        const history = globalCloudData[profileName];
        const selectedVersionData = history.find(v => v.version.toString() === versionStr.toString());

        if (!selectedVersionData) return alert("Version data not found.");

        const profiles = getProfiles();
        const newId = 'cloud_' + Date.now();
        profiles[newId] = {
            name: `${profileName} (v${versionStr})`,
            styles: selectedVersionData.styles || {}
        };
        
        saveProfiles(profiles);
        setActiveProfileId(newId);
        refreshProfileDropdown();
        
        if(typeof window.showToast === 'function') window.showToast("Cloud Profile downloaded and applied successfully!");
    });

    btnRefreshCloud.addEventListener('click', fetchCloudData);

    // Initialize Local Dropdown
    refreshProfileDropdown();
    
    // Auto-fetch cloud profiles on load
    fetchCloudData();
});