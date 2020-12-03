var callback = function() {
    // redirects to local blocked page
    return {redirectUrl: chrome.extension.getURL("blocked.html")};

}
var urls = {urls: ["https://*.youtube.com/*"]};

var opt_extraInforSpec = ["blocking"];

chrome.webRequest.onBeforeRequest.addListener(callback, urls, opt_extraInforSpec);