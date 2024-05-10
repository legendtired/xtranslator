chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === "install") {
        chrome.runtime.openOptionsPage();
    }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage()
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action == "openOptionsPage") {
      chrome.runtime.openOptionsPage();
  }
});