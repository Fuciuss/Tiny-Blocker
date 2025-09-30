// Script for the blocked page

document.addEventListener('DOMContentLoaded', function() {
    // Get site info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const siteName = urlParams.get('site');
    const siteId = urlParams.get('id');

    // Increment block count for this site
    if (siteId) {
        chrome.storage.sync.get(['blockedSites'], function(result) {
            if (result.blockedSites) {
                const sites = result.blockedSites;
                const site = sites.find(s => s.id === parseInt(siteId));

                if (site) {
                    // Initialize blockLog if it doesn't exist
                    if (site.blockLog === undefined) {
                        site.blockLog = [];
                    }

                    // Log this block instance with timestamp
                    site.blockLog.push({
                        timestamp: new Date().toISOString()
                    });

                    // Save back to storage
                    chrome.storage.sync.set({ blockedSites: sites });

                    // Update the display with site name and count
                    if (siteName) {
                        const heading = document.querySelector('h1');
                        heading.textContent = `${siteName} Blocked`;

                        const blockInfo = document.createElement('p');
                        blockInfo.className = 'text-muted';
                        const blockCount = site.blockLog.length;
                        blockInfo.textContent = `Blocked ${blockCount} time${blockCount !== 1 ? 's' : ''}`;
                        heading.after(blockInfo);
                    }
                }
            }
        });
    }

    // Go Back button
    document.getElementById('goBackBtn').addEventListener('click', function() {
        window.history.back();
    });

    // Manage Blocks button
    document.getElementById('manageBlocksBtn').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});