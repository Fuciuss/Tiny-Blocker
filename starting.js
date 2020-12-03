chrome.runtime.onInstalled.addListener(function() {
    console.log('Tiny Blocker started.');

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {hostEquals: 'www.youtube.com'}, 
            })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


