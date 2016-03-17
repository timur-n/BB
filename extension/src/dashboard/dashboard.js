function getScope() {
	var div = document.getElementById('main-div');
	if (div && angular) {
		return angular.element(div).scope();
	}
}

function dataCallback(data) {
	//console.log('Data callback', data);
	getScope().updateData(data);
}

chrome.extension.getBackgroundPage().register(dataCallback);

chrome.tabs.onRemoved.addListener(function callback(tabId) {
	console.log('Tab closed', tabId);
	getScope().removeTab(tabId);
});
