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

function test() {
	// Ask content script for selection and then speak it using TTS
	sendMessageToContent({getSelection: true}, function(response) {
		console.log('TTS test response', response);
		if (!response) {
			response = 'Can not get selection';
		}
		chrome.tts.speak(response);
	});
}

function initialize() {
	console.log('initializing');
	document.getElementById("start-stop-btn").addEventListener("click", startStop);
	document.getElementById("show-main-btn").addEventListener("click", showMainPage);
	document.getElementById("test-btn").addEventListener("click", test);
}

window.addEventListener("load", initialize);
