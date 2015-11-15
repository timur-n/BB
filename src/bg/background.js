var data;
var dataCallback;
var betfairData = {};

function test() {
	console.log('TEST');
}

function register(callback) {
	dataCallback = callback;
}

function setBetfairData(url, data) {
	console.log('setBetfairData', url, data);
	betfairData[url] = data;
}

function getBetfairData(url) {
	console.log('getBetfairData', url, betfairData[url]);
	return betfairData[url];
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
