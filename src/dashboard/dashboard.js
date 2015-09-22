function getScope() {
	var div = document.getElementById('main-div');
	if (div && angular) {
		return angular.element(div).scope();
	}
}

function dataCallback(data) {
	console.log('Data callback', data);
	getScope().updateData(data);
}

chrome.extension.getBackgroundPage().register(dataCallback);

chrome.tabs.onRemoved.addListener(function callback(tabId) {
	console.log('Tab closed', tabId);
	getScope().removeTab(tabId);
});

angular.module('BBApp', [])
	.controller('MainCtrl', ['$scope', '$log', function($scope, $log) {
		$scope.data = 0;
		$scope.events = [];
		$scope.betfair = createBetfair();

		$scope.indexById = function(id) {
			for (var i = 0; i < $scope.events.length; i += 1) {
				if ($scope.events[i].id === id) {
					return i;
				}
			}
			return -1;
		};

		$scope.updateData = function(tabData) {
			var i = $scope.indexById(tabData.id);
			var event;
			if (i < 0) {
				event = {id: tabData.id};
				$scope.events.push(event);
			} else {
				event = $scope.events[i];
			}
			event.data = tabData.data;
			event.name = tabData.url;
			$scope.$apply();
		};

		$scope.removeTab = function(tabId) {
			var i = $scope.indexById(tabId);
			if (i >= 0) {
				$scope.events.splice(i, 1);
				$scope.$apply();
			}
		};

		$scope.testBetfair = function() {
			$scope.betfair.test();
		}
	}]);