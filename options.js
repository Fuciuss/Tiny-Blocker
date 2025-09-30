// Default blocked sites structure
let blockedSites = [];
let masterBlockEnabled = true;

// Load sites from storage on page load
document.addEventListener('DOMContentLoaded', function() {
    loadBlockedSites();
    setupEventListeners();
});

// Load blocked sites from Chrome storage
function loadBlockedSites() {
    chrome.storage.sync.get(['blockedSites', 'masterBlockEnabled'], function(result) {
        if (result.blockedSites) {
            // Migrate old blockCount to blockLog
            blockedSites = result.blockedSites.map(site => {
                if (site.blockCount !== undefined && site.blockLog === undefined) {
                    const { blockCount, ...rest } = site;
                    return { ...rest, blockLog: [] };
                } else if (site.blockLog === undefined) {
                    return { ...site, blockLog: [] };
                }
                return site;
            });
            // Save migrated data
            if (JSON.stringify(blockedSites) !== JSON.stringify(result.blockedSites)) {
                saveBlockedSites();
            }
        } else {
            // Initialize with empty array if no sites saved
            blockedSites = [];
            saveBlockedSites();
        }

        if (result.masterBlockEnabled !== undefined) {
            masterBlockEnabled = result.masterBlockEnabled;
        } else {
            masterBlockEnabled = true;
            chrome.storage.sync.set({ masterBlockEnabled: true });
        }

        document.getElementById('masterToggle').checked = masterBlockEnabled;
        updateMasterToggleUI();
        renderSitesList();
    });
}

// Save blocked sites to Chrome storage
function saveBlockedSites() {
    chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
        // Notify service worker to update blocking rules
        chrome.runtime.sendMessage({ action: 'updateBlockedSites' }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
            }
        });
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Add site button
    document.getElementById('addSiteBtn').addEventListener('click', addNewSite);

    // Enter key support for input fields
    document.getElementById('websiteUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewSite();
        }
    });

    document.getElementById('websiteName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewSite();
        }
    });

    // Master toggle
    document.getElementById('masterToggle').addEventListener('change', function(e) {
        masterBlockEnabled = e.target.checked;
        chrome.storage.sync.set({ masterBlockEnabled: masterBlockEnabled });
        updateMasterToggleUI();
        chrome.runtime.sendMessage({ action: 'updateMasterToggle', enabled: masterBlockEnabled }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
            }
        });
    });

    // Quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(button => {
        button.addEventListener('click', function() {
            const name = this.getAttribute('data-name');
            const urls = this.getAttribute('data-url').split(',');

            // Check if already exists
            const exists = blockedSites.some(site => site.name === name);
            if (exists) {
                alert(`${name} is already in your blocked list!`);
                return;
            }

            const newSite = {
                id: Date.now(),
                name: name,
                urls: urls,
                enabled: true,
                blockLog: []
            };

            blockedSites.push(newSite);
            saveBlockedSites();
            renderSitesList();

            // Visual feedback
            this.style.backgroundColor = '#4caf50';
            this.style.color = 'white';
            this.textContent = '✓ Added';
            setTimeout(() => {
                this.style.backgroundColor = '#e3f2fd';
                this.style.color = '#1976d2';
                this.textContent = name;
            }, 1500);
        });
    });
}

// Add new site to the blocked list
function addNewSite() {
    const nameInput = document.getElementById('websiteName');
    const urlInput = document.getElementById('websiteUrl');

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name || !url) {
        alert('Please enter both website name and URL pattern');
        return;
    }

    // Check if site already exists
    const exists = blockedSites.some(site =>
        site.name.toLowerCase() === name.toLowerCase() ||
        site.urls.includes(url)
    );

    if (exists) {
        alert('This website is already in your blocked list!');
        return;
    }

    // Create new site object
    const newSite = {
        id: Date.now(),
        name: name,
        urls: [url],
        enabled: true,
        blockLog: []
    };

    blockedSites.push(newSite);
    saveBlockedSites();
    renderSitesList();

    // Clear inputs
    nameInput.value = '';
    urlInput.value = '';
    nameInput.focus();
}

// Render the list of blocked sites
function renderSitesList() {
    const container = document.getElementById('sitesList');

    if (blockedSites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No websites blocked yet.</p>
                <p>Add websites using the form above or quick add buttons.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    blockedSites.forEach(site => {
        const siteElement = document.createElement('div');
        siteElement.className = 'site-item';
        const blockCount = (site.blockLog && site.blockLog.length) || 0;
        siteElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="flex-grow-1">
                    <div class="site-url">${site.name}</div>
                    <small class="text-muted">${site.urls.join(', ')}</small>
                    <br>
                    <small class="text-muted"><strong>Blocked:</strong> ${blockCount} time${blockCount !== 1 ? 's' : ''}</small>
                </div>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-outline-secondary mr-2" data-site-id="${site.id}" style="padding: 5px 10px; font-size: 12px;" title="Reset counter" onclick="resetCounter(${site.id})">Reset</button>
                    <label class="toggle-switch mr-3">
                        <input type="checkbox" ${site.enabled ? 'checked' : ''} data-site-id="${site.id}">
                        <span class="slider"></span>
                    </label>
                    <button class="btn btn-remove btn-sm" data-site-id="${site.id}">Remove</button>
                </div>
            </div>
        `;

        // Add toggle event listener
        const toggle = siteElement.querySelector('input[type="checkbox"]');
        toggle.addEventListener('change', function(e) {
            const siteId = parseInt(e.target.getAttribute('data-site-id'));
            const site = blockedSites.find(s => s.id === siteId);
            if (site) {
                site.enabled = e.target.checked;
                saveBlockedSites();
            }
        });

        // Add remove button event listener
        const removeBtn = siteElement.querySelector('.btn-remove');
        removeBtn.addEventListener('click', function(e) {
            const siteId = parseInt(e.target.getAttribute('data-site-id'));
            if (confirm('Are you sure you want to remove this website from the blocked list?')) {
                blockedSites = blockedSites.filter(s => s.id !== siteId);
                saveBlockedSites();
                renderSitesList();
            }
        });

        container.appendChild(siteElement);
    });
}

// Update master toggle UI
function updateMasterToggleUI() {
    const container = document.getElementById('masterToggleContainer');
    if (masterBlockEnabled) {
        container.classList.remove('disabled');
    } else {
        container.classList.add('disabled');
    }
}

// Reset counter for a specific site
function resetCounter(siteId) {
    const site = blockedSites.find(s => s.id === siteId);
    if (site) {
        site.blockLog = [];
        saveBlockedSites();
        renderSitesList();
    }
}

// Make resetCounter available globally for onclick handler
window.resetCounter = resetCounter;