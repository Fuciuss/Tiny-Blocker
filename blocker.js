// Variables to store blocked sites and state
let blockedSites = [];
let masterBlockEnabled = true;
let currentListenerId = null;

// Initialize on extension load
chrome.storage.sync.get(['blockedSites', 'masterBlockEnabled'], function(result) {
    if (result.blockedSites) {
        blockedSites = result.blockedSites;
    }
    if (result.masterBlockEnabled !== undefined) {
        masterBlockEnabled = result.masterBlockEnabled;
    }
    updateBlockingRules();
});

// Listen for messages from options page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateBlockedSites') {
        // Reload blocked sites from storage
        chrome.storage.sync.get(['blockedSites'], function(result) {
            if (result.blockedSites) {
                blockedSites = result.blockedSites;
                updateBlockingRules();
            }
        });
    } else if (request.action === 'updateMasterToggle') {
        masterBlockEnabled = request.enabled;
        updateBlockingRules();
    }
});

// Listen for storage changes (in case multiple windows are open)
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
        if (changes.blockedSites) {
            blockedSites = changes.blockedSites.newValue || [];
            updateBlockingRules();
        }
        if (changes.masterBlockEnabled) {
            masterBlockEnabled = changes.masterBlockEnabled.newValue;
            updateBlockingRules();
        }
    }
});

// Blocking callback function
function blockingCallback(details) {
    // Check if blocking is enabled
    if (!masterBlockEnabled) {
        return {};
    }

    // Check if current URL matches any enabled blocked site
    const shouldBlock = blockedSites.some(site => {
        if (!site.enabled) return false;

        return site.urls.some(pattern => {
            // Convert simple wildcard pattern to regex
            const regexPattern = pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars
                .replace(/\*/g, '.*');  // Replace * with .*

            try {
                const regex = new RegExp('^' + regexPattern + '$');
                return regex.test(details.url);
            } catch (e) {
                console.error('Invalid pattern:', pattern, e);
                return false;
            }
        });
    });

    if (shouldBlock) {
        return {redirectUrl: chrome.extension.getURL("blocked.html")};
    }

    return {};
}

// Update blocking rules based on current state
function updateBlockingRules() {
    // Remove existing listener if it exists
    if (currentListenerId !== null) {
        chrome.webRequest.onBeforeRequest.removeListener(blockingCallback);
        currentListenerId = null;
    }

    // If master block is disabled, don't add any listeners
    if (!masterBlockEnabled) {
        return;
    }

    // Get all enabled URLs
    const allUrls = [];
    blockedSites.forEach(site => {
        if (site.enabled) {
            site.urls.forEach(url => {
                allUrls.push(url);
            });
        }
    });

    // If there are URLs to block, add the listener
    if (allUrls.length > 0) {
        // For simplicity, we'll listen to all URLs and filter in the callback
        // This is because Chrome doesn't allow dynamic URL patterns in the filter
        chrome.webRequest.onBeforeRequest.addListener(
            blockingCallback,
            {urls: ["<all_urls>"], types: ["main_frame", "sub_frame"]},
            ["blocking"]
        );
        currentListenerId = 1;  // Just a marker that listener is active
    }
}

// Initialize blocking rules
updateBlockingRules();