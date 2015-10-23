angular.module('BBApp', [])
    .controller('MainCtrl', ['$scope', '$log', function($scope, $log) {
        $scope.data = 0;
        $scope.events = [];
        $scope.betfair = createBetfair();
        $scope.knownBookies = ['Bet 365', 'Sky Bet', 'Ladbrokes', 'Betfair Sportsbook', 'Paddy Power', 'Bet Victor', 'Coral', 'William Hill'];

        $scope.isSmarkets = function(url) {
            return url.indexOf('smarkets.com') >= 0;
        };

        $scope.arrayIndexBy = function(array, callback) {
            for (var i = 0; i < array.length; i += 1) {
                if (callback(array[i])) {
                    return i;
                }
            }
            return -1;
        };

        $scope.arrayObjBy = function(array, callback) {
            var i = $scope.arrayIndexBy(array, callback);
            if (i >= 0) {
                return array[i];
            }
        };

        $scope.indexBy = function(callback) {
            return $scope.arrayIndexBy($scope.events, callback);
        };

        $scope.indexById = function(id) {
            return $scope.indexBy(function(event) {
                return event.id === id;
            });
        };

        $scope.indexBySmarkets = function(smarketsId) {
            return $scope.indexBy(function(event) {
                return event.smarkets && event.smarkets.url === smarketsId;
            });
        };

        $scope.indexByBetfair = function(betfairId) {
            return $scope.indexBy(function(event) {
                if (event.betfair) {
                    return $scope.arrayIndexBy(event.betfair, function(market) {
                        return market.id === betfairId;
                    });
                }
            });
        };

        function updateSmarkets(event, tabData) {
            event.smarkets.data = tabData.data;
            event.data.bookies.forEach(function(item) {
                $scope.updateBookiePrices(item, tabData.data, 'smarkets');
            });
        }

        $scope.updateRunner = function(runner, dataType, price) {
            if (dataType === 'back') {
                runner.price = price;
            } else {
                runner.lay = runner.lay || {};
                runner.lay[dataType] = runner.lay[dataType] || {};
                runner.lay[dataType].price = price;
            }
        };

        $scope.updateBookiePrices = function(oldBookie, newData, dataType) {
            // Clear all prices first
            if (oldBookie.markets) {
                oldBookie.markets.forEach(function(item) {
                    item.runners.forEach(function(runner) {
                        $scope.updateRunner(runner, dataType, NaN);
                    });
                });
            }
            // Now match all markets/runners and update prices
            // todo-timur: add re-calculation
            if (newData.markets) {
                newData.markets.forEach(function(newMkt) {
                    var oldMkt = $scope.arrayObjBy(oldBookie.markets, function(mkt) {
                        return mkt.name === newMkt.name;
                    });
                    if (oldMkt) {
                        newMkt.runners.forEach(function(newRunner) {
                            var oldRunner = $scope.arrayObjBy(oldMkt.runners, function(runner) {
                                return runner.name === newRunner.name;
                            });
                            if (oldRunner) {
                                $scope.updateRunner(oldRunner, dataType, newRunner.price);
                            } else {
                                oldMkt.runners.push(newRunner);
                            }
                        });
                    } else {
                        oldBookie.markets.push(newMkt);
                    }
                });
            }
        };

        function updateBookies(event, tabData) {
            if (!tabData.data) {
                throw new Error('Tab data must have "data" property');
            }
            if (!tabData.data.bookies) {
                throw new Error('Tab data must have data.bookies property');
            }
            var bookies = filterBookies(tabData.data.bookies);
            bookies.forEach(function(newBookie) {
                var oldBookie = $scope.arrayObjBy(event.data.bookies, function(item) {
                    return item.name === newBookie.name;
                });
                if (oldBookie) {
                    $scope.updateBookiePrices(oldBookie, newBookie, 'back');
                } else {
                    event.data.bookies.push(newBookie);
                }
            });
            event.url = tabData.url;
        }

        function filterBookies(bookies) {
            if (bookies && bookies.length) {
                return bookies.filter(function(bookie) {
                    return $scope.knownBookies.indexOf(bookie.name) >= 0;
                });
            }
            return bookies;
        }

        $scope.updateData = function(tabData) {
            var i,
                isSmarkets = $scope.isSmarkets(tabData.url);
            if (isSmarkets) {
                i = $scope.indexBySmarkets(tabData.url);
            } else {
                i = $scope.indexById(tabData.id);
            }
            var event;
            if (i >= 0) {
                event = $scope.events[i];
            } else if (!isSmarkets) {
                event = {id: tabData.id, smarkets: {}};
                $scope.events.push(event);
            } else {
                $log.debug('Unknown Smarkets tab data', tabData.url);
            }

            if (event) {
                event.data = event.data || {};
                event.data.bookies = event.data.bookies || [];
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
        };

        $scope.selectObj = function(array, obj) {
            if (array) {
                array.forEach(function (item) {
                    item.selected = false;
                });
            }
            if (obj) {
                obj.selected = true;
            }
        };

        $scope.selectEvent = function(event) {
            $scope.selectObj($scope.events, event);
            $scope.selectedEvent = event;
            if ($scope.selectedEvent.data.bookies.length) {
                $scope.selectBookie($scope.selectedEvent.data.bookies[0]);
            }
        };

        $scope.selectBookie = function(bookie) {
            if ($scope.selectedEvent) {
                $scope.selectObj($scope.selectedEvent.data.bookies, bookie);
                $scope.selectedBookie = bookie;
            }
        };
    }]);