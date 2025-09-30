// Service Worker for Tiny Blocker - Manifest V3
// Combines functionality from blocker.js and starting.js

// Variables to store blocked sites and state
let blockedSites = [];
let masterBlockEnabled = true;

// Rule ID counter for dynamic rules
let nextRuleId = 1;

// Initialize on extension install/update
chrome.runtime.onInstalled.addListener(function(details) {
    console.log('Tiny Blocker installed/updated.');

    // Initialize storage if this is a fresh install
    if (details.reason === 'install') {
        chrome.storage.sync.set({
            blockedSites: [],
            masterBlockEnabled: true
        });
    }

    // Migrate existing sites to add blockLog if missing
    if (details.reason === 'update') {
        chrome.storage.sync.get(['blockedSites'], function(result) {
            if (result.blockedSites && result.blockedSites.length > 0) {
                const updated = result.blockedSites.map(site => {
                    if (site.blockLog === undefined) {
                        return { ...site, blockLog: [] };
                    }
                    return site;
                });
                chrome.storage.sync.set({ blockedSites: updated });
            }
        });
    }

    // Load initial state and set up rules
    loadAndApplyRules();
});

// Load state on service worker startup
chrome.runtime.onStartup.addListener(function() {
    loadAndApplyRules();
});

// Also load when service worker wakes up
loadAndApplyRules();

// Function to load state and apply blocking rules
async function loadAndApplyRules() {
    try {
        const result = await chrome.storage.sync.get(['blockedSites', 'masterBlockEnabled']);

        blockedSites = result.blockedSites || [];
        masterBlockEnabled = result.masterBlockEnabled !== undefined ? result.masterBlockEnabled : true;

        await updateBlockingRules();
    } catch (error) {
        console.error('Error loading rules:', error);
    }
}

// Listen for messages from options page and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateBlockedSites') {
        // Reload blocked sites from storage and update rules
        chrome.storage.sync.get(['blockedSites'], async function(result) {
            if (result.blockedSites) {
                blockedSites = result.blockedSites;
                await updateBlockingRules();
                sendResponse({ success: true });
            }
        });
        return true; // Keep message channel open for async response
    } else if (request.action === 'updateMasterToggle') {
        masterBlockEnabled = request.enabled;
        updateBlockingRules().then(() => {
            sendResponse({ success: true });
        });
        return true; // Keep message channel open for async response
    } else if (request.action === 'getBlockedUrl') {
        // Return the blocked URL from the tab's navigation
        sendResponse({ success: true });
        return true;
    }
});

// Listen for storage changes (in case multiple windows are open)
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
        let needsUpdate = false;

        if (changes.blockedSites) {
            blockedSites = changes.blockedSites.newValue || [];
            needsUpdate = true;
        }

        if (changes.masterBlockEnabled) {
            masterBlockEnabled = changes.masterBlockEnabled.newValue;
            needsUpdate = true;
        }

        if (needsUpdate) {
            updateBlockingRules();
        }
    }
});

// Function to update declarativeNetRequest rules based on current state
async function updateBlockingRules() {
    try {
        // Get existing dynamic rules
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const existingRuleIds = existingRules.map(rule => rule.id);

        // Remove all existing dynamic rules
        if (existingRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: existingRuleIds
            });
        }

        // If master block is disabled, don't add any rules
        if (!masterBlockEnabled) {
            console.log('Master blocking disabled, no rules added');
            return;
        }

        // Create new rules for enabled sites
        const newRules = [];
        let ruleId = 1;

        for (const site of blockedSites) {
            if (site.enabled) {
                // Create a rule for each URL pattern of the site
                for (const urlPattern of site.urls) {
                    // Convert wildcard patterns to declarativeNetRequest format
                    // Remove protocol if present and create a more flexible pattern
                    let processedPattern = urlPattern;

                    // Handle various URL pattern formats
                    if (processedPattern.includes('://')) {
                        // Extract the domain part
                        const parts = processedPattern.split('://');
                        if (parts.length > 1) {
                            processedPattern = parts[1];
                        }
                    }

                    // Remove trailing /* if present
                    processedPattern = processedPattern.replace(/\/\*$/, '');

                    // Create the rule
                    const rule = {
                        id: ruleId++,
                        priority: 1,
                        action: {
                            type: "redirect",
                            redirect: {
                                extensionPath: `/blocked.html?site=${encodeURIComponent(site.name)}&id=${site.id}`
                            }
                        },
                        condition: {
                            urlFilter: processedPattern,
                            resourceTypes: ["main_frame", "sub_frame"]
                        }
                    };

                    newRules.push(rule);

                    // Also add a rule for www version if not already included
                    if (!processedPattern.startsWith('www.') && !processedPattern.includes('*.')) {
                        const wwwRule = {
                            id: ruleId++,
                            priority: 1,
                            action: {
                                type: "redirect",
                                redirect: {
                                    extensionPath: `/blocked.html?site=${encodeURIComponent(site.name)}&id=${site.id}`
                                }
                            },
                            condition: {
                                urlFilter: 'www.' + processedPattern,
                                resourceTypes: ["main_frame", "sub_frame"]
                            }
                        };
                        newRules.push(wwwRule);
                    }
                }
            }
        }

        // Add the new rules
        if (newRules.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: newRules
            });
            console.log(`Added ${newRules.length} blocking rules`);
        } else {
            console.log('No sites to block');
        }

    } catch (error) {
        console.error('Error updating blocking rules:', error);
    }
}

// Open options page when extension icon is clicked (if no popup)
chrome.action.onClicked.addListener(function(tab) {
    chrome.runtime.openOptionsPage();
});