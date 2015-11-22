angular.module('BBStorage', [])
    .factory('bbStorage', ['$log', function($log) {
        return {
            set: function (name, value) {
                $log.debug('bb-storage.set()', name, value);
                var storage = {};
                storage[name] = value;
                chrome.storage.local.set(storage, function() {
                    $log.debug('bb-storage.set(): saved');
                });
            },
            get: function (name, callback) {
                $log.debug('bb-storage.get()', name);
                chrome.storage.local.get(name, function(items) {
                    $log.debug('bb-storage.get(): loaded', items[name]);
                    callback(items[name]);
                });
            }
        };
    }]);

angular.module('BBUtils', [])
    .factory('bbUtils', [function() {

        function indexByValue(array, key, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][key] === value) {
                    return i;
                }
            }
            return -1;
        }

        function indexByStr(array, key, value) {
            for (var i = 0; i < array.length; i += 1) {
                var val = array[i][key],
                    all = val && value;
                if (all && val.toString().toLowerCase() === value.toString().toLowerCase()) {
                    return i;
                }
            }
            return -1;
        }

        function normalizePrice(price) {
            var parts = ('' + price).split('/');
            if (parts.length === 2) {
                return (((+parts[0]) + (+parts[1])) / parts[1]).toFixed(2);
            } else {
                return (1.0 * price).toFixed(2);
            }
        }

        return {
            indexByValue: indexByValue,
            indexByStr: indexByStr,
            objByValue: function(array, key, value) {
                var i = indexByValue(array, key, value);
                if (i >= 0) {
                    return array[i];
                }
            },
            objByStr: function(array, key, value) {
                var i = indexByStr(array, key, value);
                if (i >= 0) {
                    return array[i];
                }
            },
            normalizePrice: normalizePrice,
            getPlaceOdds: function(winPrice, ew) {
                return ew && ((normalizePrice(winPrice) * 1.0 - 1) / ew.fraction + 1);
            }
        }
    }]);

angular.module('BBBetfair', [])
    .factory('bbBetfair', [function() {

    }]);

angular.module('BBApp', ['BBStorage', 'BBUtils', 'BBProcessors'])
    .controller('MainCtrl', ['$scope', '$log', '$interval', 'bbStorage', 'bbUtils', 'bbProcessors',
    function($scope, $log, $interval, bbStorage, bbUtils, bbProcessors) {
        $scope.data = 0;
        $scope.events = [];
        $scope.betfair = createBetfair();
        $scope.betfairPollInterval = 5000;
        $scope.knownBookies = [
            {name: 'Bet 365', short: '365'},
            {name: 'Sky Bet', short: 'Sky'},
            {name: 'Ladbrokes', short: 'Lads'},
            {name: 'Betfair Sportsbook', short: 'BFSB'},
            {name: 'Paddy Power', short: 'Paddy'},
            {name: 'Bet Victor', short: 'BVic'},
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

        function updateSmarkets(event, tabData) {
            event.smarkets.data = tabData.data;
            event.data.bookies.forEach(function(item) {
                $scope.updateBookiePrices(item, tabData.data, 'smarkets');
            });
        }

        function recalculate(bookie) {
            var isProfit = false,
                isOk = false,
                max = -10000;

            bookie.markets.forEach(function(market) {
                market.runners.forEach(function(runner) {
                    if (!runner.locked) {
                        runner.backOdds = bbUtils.normalizePrice(runner.price);
                    }
                    // todo-timur: find best lay odds (betfair/smarkets)
                    runner.layOdds = bbUtils.normalizePrice(runner.lay && runner.lay.bf && runner.lay.bf.price);
                    runner.size = runner.lay && runner.lay.bf && runner.lay.bf.size;
                    runner.result = runner.result || {};
                    if (bookie.processors) {
                        bookie.processors.forEach(function (processor) {
                            if (processor.enabled) {
                                runner.result[processor.id] = processor.func(runner, bookie.backStake, bookie.layCommission, bookie);
                                var result = runner.result[processor.id];

                                if (processor.enabled && result && result.enough) {
                                    isProfit = isProfit || result.isProfit;
                                    isOk = isOk || result.isOk;
                                    if (result.isProfit || result.isOk) {
                                        max = Math.max(max, result.profit);
                                    }
                                }
                            }
                        });
                    }
                });
            });
            bookie.summary = {
                text: max > -100 ? max.toFixed(2) : '-',
                isProfit: isProfit,
                isOk: isOk && !isProfit
            };
        }

        $scope.updateRunner = function(runner, dataType, price, size) {
            if (dataType === dataTypes.back) {
                runner.price = price;
                if (!runner.selected) {
                    runner.lockedBackOdds = bbUtils.normalizePrice(price);
                }
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
                    var oldMkt = bbUtils.objByStr(oldBookie.markets, 'name', newMkt.name),
                        isPlaceLay = /PLACE/gi.test(newMkt.name) && dataType !== dataTypes.back;
                    if (!oldMkt && isPlaceLay) {
                        oldMkt = bbUtils.objByStr(oldBookie.markets, 'name', 'WIN');
                    }
                    if (oldMkt) {
                        newMkt.runners.forEach(function(newRunner) {
                            var oldRunner = bbUtils.objByStr(oldMkt.runners, 'name', newRunner.name);
                            if (oldRunner) {
                                if (!isPlaceLay) {
                                    $scope.updateRunner(oldRunner, dataType, newRunner.price, newRunner.size);
                                }
                                // Dirty hack to add E/W stuff
                                if (dataType === dataTypes.back && /WIN/gi.test(newMkt.name) && newData.ew) {
                                    oldRunner.place = oldRunner.place || {};
                                    oldRunner.place.backOdds = bbUtils.getPlaceOdds(oldRunner.backOdds, newData.ew);
                                } else if (isPlaceLay) {
                                    oldRunner.place = oldRunner.place || {};
                                    oldRunner.place.layOdds = bbUtils.normalizePrice(newRunner.price);
                                    oldRunner.place.size = newRunner.size;
                                }
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
                var oldBookie = bbUtils.objByStr(event.bookies, 'name', newBookie.name);
                if (oldBookie) {
                    oldBookie.tabId = tabData.id;
                    oldBookie.ew = newBookie.ew;
                    $scope.updateBookiePrices(oldBookie, newBookie, dataTypes.back);
                }
            });
        }

        $scope.updateData = function(tabData) {
            //$log.debug('Update data...', tabData);
            var eventId = tabData.data && tabData.data.event && (tabData.data.event.name + ' ' + tabData.data.event.time);
            var event = bbUtils.objByValue($scope.events, 'id', eventId);
            if (!event && eventId) {
                var name = 'New event';
                var bookies = $scope.knownBookies.map(function(knownBookie) {
                    return {
                        name: knownBookie.name,
                        backStake: 10,
                        layCommission: 2,
                        backWinnerTerms: 0,
                        processors: [
                            {name: 'Qualifier', id: 'q', func: bbProcessors.qualifier, enabled: true},
                            {name: 'Freebet', id: 'snr', func: bbProcessors.freeSnr, enabled: true},
                            {name: 'Each way', id: 'ew', func: bbProcessors.eachWay, enabled: true},
                            {name: 'Winner', id: 'winner', func: bbProcessors.backWinner, enabled: false}
                        ],
                        summary: {}
                    }
                });
                event = {
                    id: eventId,
                    name: name,
                    time: tabData.data && tabData.data.event && tabData.data.event.time,
                    data: tabData.data || {},
                    bookies: bookies,
                    smarkets: {}
                };
                bbStorage.get(event.id, function(value) {
                    if (value) {
                        event.betfair = value.betfair;
                        if (value.bookies && value.bookies.length) {
                            value.bookies.forEach(function(oldBookie) {
                                var newBookie = bbUtils.objByStr(event.bookies, 'name', oldBookie.name);
                                if (newBookie) {
                                    newBookie.layCommission = oldBookie.layCommission;
                                    newBookie.backStake = oldBookie.backStake;
                                }
                            });
                        }
                    }
                });
                $scope.events.push(event);
                //$log.debug('Event added', event);
            }

            if (event) {
                event.url = tabData.url;
                event.name = tabData.data && tabData.data.event && (tabData.data.event.name + ' ' + tabData.data.event.time);
                updateBookies(event, tabData);
                $scope.events.sort(function(a, b) {
                    return a.time > b.time ? 1 : a.time < b.time ? -1 : 0;
                });
                bbStorage.set(event.id, event);
            }

            //$log.debug('Updated data', $scope.events);
            $scope.$apply();
        };

        function getInterval(date) {
            var now = new Date();
            return now.getTime() - (date ? date.getTime() : 0);
        }

        $scope.updateBetfairData = function(betfairData) {
            $log.debug('++ Received betfair data', betfairData);
            var event = bbUtils.objByStr($scope.events, 'betfair', betfairData.betfair);
            if (event) {
                event.betfairCount = event.betfair.split(',').length;
                event.betfairOk = getInterval(event.betfairLastUpdate) < $scope.betfairPollInterval * 2;
                event.betfairLastUpdate = new Date();
                event.bookies.forEach(function(bookie) {
                    $scope.updateBookiePrices(bookie, betfairData, dataTypes.betfair);
                });
            }
        };

        $scope.removeTab = function(tabId) {
            // todo-timur: for each event check if it has a bookie with this tab, then clear the tabId and if that event doesn't have bookies with tabId, remove the event
        };

        $scope.testBetfair = function() {
            $scope.betfair.test(function(data) {
                $log.debug('+++ Betfair test', data);
            });
        };

        $scope.selectObj = function(array, obj, oldObj, name) {
            if (array) {
                array.forEach(function (item) {
                    item.selected = false;
                });
            }
            if (obj) {
                obj.selected = true;
            }
            if (oldObj) {
                oldObj.selected = false;
            }
        };

        $scope.selectBookie = function(event, bookie) {
            if ($scope.selectedBookie) {
                $scope.selectedBookie.selected = false;
            }
            $scope.selectedBookie = bookie;
            if (event) {
                $scope.selectObj(event.bookies, bookie);
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

        $scope.lockRunnerPrice = function(runner, locked) {
            runner.locked = locked;
            if (locked) {
                runner.backOdds = bbUtils.normalizePrice(runner.lockedBackOdds);
            } else {
                runner.backOdds = bbUtils.normalizePrice(runner.price);
            }
        };

        $scope.testStorage = function() {
            bbStorage.set('bbTest', {id: 123, obj: {id: 1, name: 'test'}, arr: [{name: 'a1'}, {name: 'a2'}]});
            bbStorage.get('bbTest', function(value) {
                $log.debug('testStorage.get(): ', value);
            })
        }
    }]);