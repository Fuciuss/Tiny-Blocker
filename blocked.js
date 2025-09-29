// Script for the blocked page

document.addEventListener('DOMContentLoaded', function() {
    // Go Back button
    document.getElementById('goBackBtn').addEventListener('click', function() {
        window.history.back();
    });

    // Manage Blocks button
    document.getElementById('manageBlocksBtn').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});