var counter = 0;
var polling = true;
var pollInterval = 5000;
var poller;

function readData() {
	counter += 1;
	console.log('ReadData: ', counter);
	chrome.runtime.sendMessage({data: counter});
}

function updatePolling() {
	if (polling && !poller) {
		poller = setInterval(readData, pollInterval);
		console.log('Polling started');
	} else {
		clearInterval(poller);
		poller = false;
		console.log('Polling stopped');
	}
}

var readyStateCheckInterval = setInterval(function () {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// This part of the script triggers when page is done loading
		console.log("Document loaded, starting polling");
		chrome.runtime.sendMessage({polling: polling});
		updatePolling();
	}
}, 10);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log('Message received', request);
	if (request.togglePolling) {
		polling = !polling;
		updatePolling();
	} else if (request.getSelection) {
		sendResponse(window.getSelection().toString());
	}
});