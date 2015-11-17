angular.module('BBApp', [])
    .controller('MainCtrl', ['$scope', '$log', '$interval', function($scope, $log, $interval) {
        $scope.data = 0;
        $scope.events = [];
        $scope.betfair = createBetfair();
        $scope.betfairPollInterval = 5000;
        $scope.knownBookies = [
            {name: 'Bet 365', short: 'b365'},
            {name: 'Sky Bet', short: 'Sky'},
            {name: 'Ladbrokes', short: 'Lads'},
            {name: 'Betfair Sportsbook', short: 'BF'},
            {name: 'Paddy Power', short: 'Paddy'},
            {name: 'Bet Victor', short: 'BV'},
            {name: 'Coral', short: 'Coral'},
            {name: 'William Hill', short: 'WH'}
        ];

        var dataTypes = {
            back: 'back',
            betfair: 'bf',
            smarkets: 'sm'
        };

        // Poll betfair data for events
        $interval(function() {
            $scope.events.forEach(function(event) {
                $log.debug('Event', event);
                if (event.betfair) {
                    $scope.betfair.getMarketPrices(event.betfair, function(data) {
                        data.betfair = event.betfair;
                        $scope.updateBetfairData(data);
                    })
                }
            });
        }, $scope.betfairPollInterval);

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
            return $scope.arrayObjBy($scope.events, function(event) {
                return event.betfair === betfairId;
            });
/*
            return $scope.indexBy(function(event) {
                if (event.betfair) {
                    return $scope.arrayIndexBy(event.betfair, function(market) {
                        return market.id === betfairId;
                    });
                }
            });
*/
        };

        function updateSmarkets(event, tabData) {
            event.smarkets.data = tabData.data;
            event.data.bookies.forEach(function(item) {
                $scope.updateBookiePrices(item, tabData.data, 'smarkets');
            });
        }

        function normalizePrice(price) {
            var parts = ('' + price).split('/');
            if (parts.length === 2) {
                return (((+parts[0]) + (+parts[1])) / parts[1]).toFixed(2);
            } else {
                return (1.0 * price).toFixed(2);
            }
        }

        function recalculate(bookie) {
            bookie.summary = '+';
            bookie.markets.forEach(function(market) {
                market.runners.forEach(function(runner) {
                    runner.backOdds = normalizePrice(runner.price);
                    // todo-timur: find best lay odds (betfair/smarkets)
                    runner.layOdds = normalizePrice(runner.lay && runner.lay.bf && runner.lay.bf.price);
                });
            });
        }

        $scope.updateRunner = function(runner, dataType, price, size) {
            if (dataType === dataTypes.back) {
                runner.price = price;
            } else {
                runner.lay = runner.lay || {};
                runner.lay[dataType] = runner.lay[dataType] || {};
                runner.lay[dataType].price = price;
                runner.lay[dataType].size = size;
            }
        };

        $scope.updateBookiePrices = function(oldBookie, newData, dataType) {
            // Clear all prices first
            oldBookie.markets = oldBookie.markets || [];
            oldBookie.markets.forEach(function(item) {
                item.runners.forEach(function(runner) {
                    $scope.updateRunner(runner, dataType, NaN);
                });
            });
            // Now match all markets/runners and update prices
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
                                $scope.updateRunner(oldRunner, dataType, newRunner.price, newRunner.size);
                            } else if (dataType === dataTypes.back) {
                                oldMkt.runners.push(newRunner);
                            }
                        });
                    } else if (dataType === dataTypes.back) {
                        oldBookie.markets.push(newMkt);
                    }
                });
            }

            recalculate(oldBookie);
        };

        function updateBookies(event, tabData) {
            if (!tabData.data) {
                throw new Error('Tab data must have "data" property');
            }
            if (!tabData.data.bookies) {
                throw new Error('Tab data must have data.bookies property');
            }
            tabData.data.bookies.forEach(function(newBookie) {
                var oldBookie = $scope.arrayObjBy(event.bookies, function(item) {
                    return item.name === newBookie.name;
                });
                if (oldBookie) {
                    $scope.updateBookiePrices(oldBookie, newBookie, dataTypes.back);
                }
            });
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
                var name = tabData.data && tabData.data.event && (tabData.data.event.name + ' ' + tabData.data.event.time);
                var bookies = $scope.knownBookies.map(function(knownBookie) {
                    return {
                        name: knownBookie.name,
                        summary: ''
                    }
                });
                event = {
                    id: tabData.id,
                    name: name || tabData.url,
                    time: tabData.data && tabData.data.event && tabData.data.event.time,
                    data: tabData.data || {},
                    bookies: bookies,
                    smarkets: {}
                };
                $scope.events.push(event);
            } else {
                $log.debug('Unknown Smarkets tab data', tabData.url);
            }

            if (event) {
                event.url = tabData.url;
                event.betfair = tabData.betfair;
                event.data.bookies = event.data.bookies || [];
                if (isSmarkets) {
                    updateSmarkets(event, tabData);
                } else {
                    updateBookies(event, tabData);
                }
            }
            $scope.$apply();
        };

        $scope.updateBetfairData = function(betfairData) {
            $log.debug('++ Received betfair data', betfairData);
            var event = $scope.indexByBetfair(betfairData.betfair);
            if (event) {
                event.bookies.forEach(function(bookie) {
                    $scope.updateBookiePrices(bookie, betfairData, dataTypes.betfair);
                });
            }
        };

        $scope.removeTab = function(tabId) {
            var i = $scope.indexById(tabId);
            if (i >= 0) {
                $scope.events.splice(i, 1);
                $scope.$apply();
            }
        };

        $scope.testBetfair = function() {
            $scope.betfair.test(function(data) {
                $log.debug('+++ Betfair test', data);
            });
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

            if ($scope.selectedEvent && $scope.selectedEvent.bookies) {
                $scope.selectBookie($scope.selectedEvent.bookies[0]);
            } else {
                $scope.selectBookie(false);
                $scope.selectMarket(false);
                $scope.selectRunner(false);
            }
        };

        $scope.selectBookie = function(bookie) {
            $scope.selectedBookie = bookie;
            if ($scope.selectedEvent) {
                $scope.selectObj($scope.selectedEvent.bookies, bookie);
                if ($scope.selectedBookie && $scope.selectedBookie.markets.length) {
                    $scope.selectMarket($scope.selectedBookie.markets[0]);
                } else {
                    $scope.selectMarket(false);
                    $scope.selectRunner(false);
                }
            }
        };

        $scope.selectMarket = function(market) {
            $scope.selectedMarket = market;
            if ($scope.selectedBookie) {
                $scope.selectObj($scope.selectedBookie.markets, market);
            }
        };

        $scope.selectRunner = function(runner) {
            $scope.selectedRunner = runner;
            if ($scope.selectedMarket) {
                $scope.selectObj($scope.selectedMarket.runners, runner);
            }
        };
    }]);