var data;
var dataCallback;
var betfairData = {};

function test() {
	console.log('TEST');
}

function register(callback) {
	dataCallback = callback;
}

function getStorageKey(eventId) {
	return 'bb_betfair-' + eventId;
}

function setBetfairData(eventId, data) {
	console.log('setBetfairData', eventId, data);
	betfairData[eventId] = data;
	var storage = {};
	storage[getStorageKey(eventId)] = data;
	chrome.storage.local.set(storage, function() {
		console.log('setBetfairData: saved');
	});
}

function getBetfairData(eventId, callback) {
	console.log('getBetfairData', eventId);
	var key = getStorageKey(eventId);
	chrome.storage.local.get(key, function(items) {
		betfairData[eventId] = items[key];
		console.log('getBetfairData: loaded', betfairData[eventId]);
		callback(betfairData[eventId]);
	});
}

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	chrome.pageAction.show(sender.tab.id);
	console.log('Background: message received', request);
	data = {
		id: sender.tab.id,
		url: sender.tab.url,
		betfair: betfairData[sender.tab.url],
		data: request.data
	};
	if (dataCallback) {
		try {
			dataCallback(data);
		} catch(e) {
		}
	}
	sendResponse();
});


/*
// For long-lived external connections:
chrome.runtime.onConnectExternal.addListener(function(port) {
	console.log('External connection');
	port.onMessage.addListener(function(msg) {
		console.log('External message', msg);
		port.postMessage({ok: true, data: data});
	});
});
*/
