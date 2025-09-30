// Popup script for Tiny Blocker
let masterBlockEnabled = true;
let blockedSites = [];

// Load current state when popup opens
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentState();
    setupEventListeners();
});

function loadCurrentState() {
    chrome.storage.sync.get(['blockedSites', 'masterBlockEnabled'], function(result) {
        if (result.blockedSites) {
            blockedSites = result.blockedSites;
        }

        if (result.masterBlockEnabled !== undefined) {
            masterBlockEnabled = result.masterBlockEnabled;
        }

        updateUI();
    });
}

function updateUI() {
    const statusElement = document.getElementById('status');
    const toggleBtn = document.getElementById('toggleBtn');
    const blockedCountElement = document.getElementById('blockedCount');

    // Update status display
    if (masterBlockEnabled) {
        statusElement.textContent = 'Blocking is ENABLED';
        statusElement.className = 'status enabled';
        toggleBtn.textContent = 'Disable Blocking';
        toggleBtn.className = 'btn btn-toggle disable';
    } else {
        statusElement.textContent = 'Blocking is DISABLED';
        statusElement.className = 'status disabled';
        toggleBtn.textContent = 'Enable Blocking';
        toggleBtn.className = 'btn btn-toggle enable';
    }

    // Update blocked sites count and statistics
    const activeCount = blockedSites.filter(site => site.enabled).length;
    const totalCount = blockedSites.length;

    // Calculate total blocks from blockLog
    const totalBlocks = blockedSites.reduce((sum, site) => {
        return sum + ((site.blockLog && site.blockLog.length) || 0);
    }, 0);

    // Find most blocked site
    const mostBlocked = blockedSites.reduce((max, site) => {
        const count = (site.blockLog && site.blockLog.length) || 0;
        const maxCount = (max.blockLog && max.blockLog.length) || 0;
        return count > maxCount ? site : max;
    }, {});

    if (totalCount === 0) {
        blockedCountElement.innerHTML = 'No sites blocked';
    } else {
        let html = `Blocking ${activeCount} of ${totalCount} sites`;
        html += `<br><strong>Total blocks: ${totalBlocks}</strong>`;

        if (totalBlocks > 0 && mostBlocked.name) {
            const mostBlockedCount = (mostBlocked.blockLog && mostBlocked.blockLog.length) || 0;
            html += `<br><small>Most blocked: ${mostBlocked.name} (${mostBlockedCount}x)</small>`;
        }

        blockedCountElement.innerHTML = html;
    }
}

function setupEventListeners() {
    // Toggle button
    document.getElementById('toggleBtn').addEventListener('click', function() {
        masterBlockEnabled = !masterBlockEnabled;
        chrome.storage.sync.set({ masterBlockEnabled: masterBlockEnabled }, function() {
            // Notify service worker
            chrome.runtime.sendMessage({
                action: 'updateMasterToggle',
                enabled: masterBlockEnabled
            }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError);
                }
                updateUI();
            });
        });
    });

    // Options button
    document.getElementById('optionsBtn').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
        window.close();  // Close the popup after opening options
    });
}