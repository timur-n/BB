var data;
var dataCallback;

function test() {
	console.log('TEST');
}

function register(callback) {
	dataCallback = callback;
}

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	chrome.pageAction.show(sender.tab.id);
	console.log('Background: message received', request);
	data = {
		id: sender.tab.id,
		url: sender.tab.url,
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
