function sendMessageToContent(message, callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			console.log('Content script response', response);
			if (callback) {
				callback(response);
			}
		});
	});
}

function startStop() {
	console.log('startStop');
	sendMessageToContent({togglePolling: true});
	chrome.extension.getBackgroundPage().test();
}

function showMainPage() {
	chrome.tabs.create({url: chrome.extension.getURL('src/dashboard/index.html')});
}

function initialize() {
	console.log('initializing');
	chrome.extension.getBackgroundPage().test();
	showMainPage();
}

window.addEventListener("load", initialize);
