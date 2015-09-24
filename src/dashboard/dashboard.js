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
		$scope.knownBookies = ['Bet 365', 'Sky Bet', 'Ladbrokes'];

		$scope.indexBy = function(callback) {
			for (var i = 0; i < $scope.events.length; i += 1) {
				if (callback($scope.events[i])) {
					return i;
				}
			}
			return -1;
		};

		$scope.indexById = function(id) {
			return $scope.indexBy(function(event) {
				return event.id === id;
			});
		};

		$scope.indexBySmarkets = function(smarketsId) {
			return $scope.indexBy(function(event) {
				return event.smarketsUrl === smarketsId;
			});
		};

		$scope.indexByBetfair = function(betfairId) {
			return $scope.indexBy(function(event) {
				return event.betfairId === betfairId;
			});
		};

		function updateSmarkets(event, tabData) {
			event.smarkets = tabData.data;
		}

		function updateBookies(event, tabData) {
			event.data = tabData.data;
			for (var i = 0; i < $scope.events.length; i += 1) {
				if (callback($scope.events[i])) {
					return i;
				}
			}
			event.name = tabData.url;
		}

		$scope.updateData = function(tabData) {
			var i,
				isSmarkets = tabData.url.match('smarkets');
			if (isSmarkets) {
				i = $scope.indexBySmarkets(tabData.url);
			} else {
				i = $scope.indexById(tabData.id);
			}
			var event;
			if (i >= 0) {
				event = $scope.events[i];
			} else if (!isSmarkets) {
				event = {id: tabData.id};
				$scope.events.push(event);
			} else {
				$log.debug('Unknown Smarkets tab data', tabData.url);
			}

			if (event) {
				if (isSmarkets) {
					updateSmarkets(event, tabData);
				} else {
					updateBookies(event, tabData);
				}
			}
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