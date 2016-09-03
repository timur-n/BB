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
		chrome.tts.getVoices(function(voices) {
			console.log(voices);
		});
		chrome.tts.speak(response, {lang: 'en-GB', gender: 'female', rate: 0.8});
	});
}

function betfairUpdate() {
	betfairIds = document.getElementById('betfair-input').value;
	console.log('New betfairIds', betfairIds);
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.extension.getBackgroundPage().setBetfairData(tabs[0].url, betfairIds);
	});
	sendMessageToContent({betfair: betfairIds})
}

function initialize() {
	console.log('initializing');
	chrome.extension.getBackgroundPage().test();
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		var data = chrome.extension.getBackgroundPage().getBetfairData(tabs[0].url);
		console.log('Get betfairIds', data);
		if (data) {
			betfairIds = data;
			document.getElementById('betfair-input').value = data;
		}
	});
	document.getElementById("start-stop-btn").addEventListener("click", startStop);
	document.getElementById("show-main-btn").addEventListener("click", showMainPage);
	document.getElementById("test-btn").addEventListener("click", test);
	document.getElementById("betfair-update").addEventListener("click", betfairUpdate);
	document.getElementById('betfair-input').setAttribute('value', betfairIds);
}

var betfairIds = '?';
window.addEventListener("load", initialize);
