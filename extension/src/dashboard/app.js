angular.module('BBStorage', [])
    .factory('bbStorage', ['$log', function($log) {
        return {
            set: function(name, value) {
                $log.debug('bb-storage.set()', name, value);
                var storage = {};
                storage[name] = value;
                chrome.storage.local.set(storage, function() {
                    $log.debug('bb-storage.set(): saved');
                });
            },
            get: function(name, callback) {
                $log.debug('bb-storage.get()', name);
                chrome.storage.local.get(name, function(items) {
                    $log.debug('bb-storage.get(): loaded', items[name]);
                    callback(items[name]);
                });
            },
            clean: function() {
                chrome.storage.local.clear();
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
            var price, digits;
            if (parts.length === 2) {
                price = (((+parts[0]) + (+parts[1])) / parts[1]);
            } else {
                price = (1.0 * price);
            }
            return Math.round(price * 100) / 100;
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
            },
            getMarketIds: function(str) {
                return str.replace(/([a-z./:#-]*market\/)([0-9.]*)([?a-z=0-9]*)/gmi, '$2').replace(/\n/gi, ',');
            },
            getMarketCount: function(str) {
                return this.getMarketIds(str).split(',').length;
            }
        }
    }]);

angular.module('BBBetfair', [])
    .factory('bbBetfair', [function() {

    }]);

angular.module('BBApp', ['BBStorage', 'BBUtils', 'BBProcessors'])
    .controller('MainCtrl', ['$scope', '$log', '$interval', 'bbStorage', 'bbUtils', 'bbProcessors', '$http',
    function($scope, $log, $interval, bbStorage, bbUtils, bbProcessors, $http) {
        $scope.data = 0;
        $scope.events = [];
        $scope.betfair = createBetfair();
        $scope.betfairPollInterval = 5000;
        $scope.maxOdds = 30;
        $scope.extraPlaceEvent = false;
        $scope.knownBookies = [
            {name: 'Bet 365', short: 'B365'},
            {name: 'Sky Bet', short: 'Sky'},
            //{name: 'Ladbrokes', short: 'Lads'},
            {name: 'Betfair Sportsbook', short: 'BFSB'},
            {name: 'Betfred', short: 'Bfr'},
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

        function ExtraPlaceRunner(name, knownBookies) {
            this.name = name;
            this.backStake = 10;
            this.bookies = knownBookies.map(function(bookie) {
                return {
                    name: bookie.name,
                    short: bookie.short,
                    ew: {
                        fraction: 100
                    }
                }
            });
        }
        ExtraPlaceRunner.prototype.recalculate = function() {
            this.backOdds = 0;
            var bestEwFraction = 100;
            this.bookies.forEach(function(bookie) {
                bookie.isBest = false;
                var price = bookie.backOdds * 1.0;
                if (price > this.backOdds && bookie.ew.fraction <= bestEwFraction) {
                    this.backOdds = price;
                    bestEwFraction = bookie.ew.fraction;
                }
            }, this);
            this.bookies.forEach(function(bookie) {
                var price = bookie.backOdds * 1.0;
                if (price === this.backOdds && bookie.ew.fraction === bestEwFraction) {
                    this.backOdds = price;
                    bookie.isBest = true;
                }
            }, this);
            if (this.backOdds <= 0) {
                this.backOdds = NaN;
            }
            this.place = this.place || {};
            this.place.backOdds = bbUtils.getPlaceOdds(this.backOdds, {places: 0, fraction: bestEwFraction});
            this.result = bbProcessors.eachWay(this, this.backStake, 5, {});
            $scope.recalculateExtraPlaceEvent();
        };
        ExtraPlaceRunner.prototype.updateBackOdds = function(bookie) {
            var myBookie = bbUtils.objByStr(this.bookies, 'name', bookie.name);
            if (myBookie) {
                if (bookie.ew) {
                    myBookie.ew = bookie.ew;
                }
                var market = bbUtils.objByStr(bookie.markets, 'name', 'Win');
                if (market) {
                    var runner = bbUtils.objByStr(market.runners, 'name', this.name);
                    if (runner) {
                        myBookie.backOdds = runner.backOdds;
                        this.recalculate();
                    }
                }
            }
        };
        ExtraPlaceRunner.prototype.updateLayOdds = function(runner, marketName) {
            if (/WIN/gi.test(marketName)) {
                this.layOdds = bbUtils.normalizePrice(runner.price);
                this.size = runner.size;
            } else if (/PLACE/gi.test(marketName)) {
                this.place = this.place || {};
                this.place.layOdds = bbUtils.normalizePrice(runner.price);
                this.place.size = runner.size;
            }
            this.recalculate();
        };

        $scope.createExtraPlaceRunner = function(name) {
            return new ExtraPlaceRunner(name, this.knownBookies);
        };

        // Poll betfair data for events
        $interval(function() {
            $scope.events.forEach(function(event) {
                if (event.betfair) {
                    var marketIds = bbUtils.getMarketIds(event.betfair);
                    $scope.betfair.getMarketPrices(marketIds, function(data) {
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
                bestResult;

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
                        bookie.processors.forEach(function(processor) {
                            if (processor.enabled) {
                                runner.result[processor.id] = processor.func(runner, bookie.backStake, bookie.layCommission, bookie);
                                var result = runner.result[processor.id];

                                if (processor.enabled && result && result.enough) {
                                    isProfit = isProfit || result.isProfit;
                                    isOk = isOk || result.isOk;
                                    if (!bestResult || bestResult.profit < result.profit) {
                                        bestResult = result;
                                    }
                                }
                            }
                        });
                    }
                });
            });
            bookie.summary = {
                text: !!bestResult ? bestResult.profit.toFixed(2) : '...',
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
                    var isDirect = tabData.data.source !== 'oddschecker';
                    oldBookie.tabId = tabData.id;
                    oldBookie.ew = newBookie.ew;
                    if (!oldBookie.isDirect || isDirect) {
                        $scope.updateBookiePrices(oldBookie, newBookie, dataTypes.back);
                        oldBookie.isDirect = isDirect;
                    }
                }
            });
        }

        function normalizeData(tabData) {
            tabData.data.bookies.forEach(function(bookie) {
                bookie.markets.forEach(function(market) {
                    market.runners.forEach(function(runner) {
                        runner.name = runner.name.replace(/'/gi, '');
                    });
                });
            });
        }

        function updateExtraPlaceBookies(event) {
            if ($scope.extraPlaceEvent) {
                if (event.bookies) {
                    event.bookies.forEach(function (bookie) {
                        if (bookie.markets) {
                            bookie.markets.forEach(function (market) {
                                // todo-Timur: only should check Win markets
                                if (market.runners) {
                                    market.runners.forEach(function (runner) {
                                        // Find EW runner or create a new one
                                        var epRunner = bbUtils.objByStr($scope.extraPlaceEvent.runners, 'name', runner.name);
                                        if (!epRunner) {
                                            epRunner = $scope.createExtraPlaceRunner(runner.name);
                                            $scope.extraPlaceEvent.runners.push(epRunner);
                                        }
                                        epRunner.updateBackOdds(bookie);
                                    })
                                }
                            })
                        }
                    });
                }
            }
        }

        function updateExtraPlaceLay(data) {
            if ($scope.extraPlaceEvent) {
                if (data && data.markets) {
                    data.markets.forEach(function (market) {
                        if (market.runners) {
                            market.runners.forEach(function (runner) {
                                // Find EW runner or create a new one
                                var epRunner = bbUtils.objByStr($scope.extraPlaceEvent.runners, 'name', runner.name);
                                if (epRunner) {
                                    epRunner.updateLayOdds(runner, market.name);
                                }
                            })
                        }
                    })
                }
            }
        }

        $scope.recalculateExtraPlaceEvent = function() {
            if ($scope.extraPlaceEvent) {
                var totals = {
                    any: false,
                    profit: 0,
                    liability: 0,
                    win: {
                        profit: 0,
                        liability: 0
                    },
                    place: {
                        profit: 0,
                        liability: 0
                    }
                };
                $scope.extraPlaceEvent.runners.forEach(function(runner) {
                    if (runner.result && runner.result.profit) {
                        totals.any = true;
                        totals.profit += runner.result.profit;
                        totals.win.profit += runner.result.win.profit;
                        totals.place.profit += runner.result.place.profit;
                    }
                });
                $scope.extraPlaceEvent.totals = totals;
            }
        };

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
                        layCommission: 5,
                        backWinnerTerms: 0,
                        processors: [
                            {name: 'Qualifier', id: 'q', func: bbProcessors.qualifier, enabled: true},
                            {name: 'Freebet', id: 'snr', func: bbProcessors.freeSnr, enabled: false},
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
                                    newBookie.marked = oldBookie.marked;
                                    for (var i = 0; i < newBookie.processors.length; i += 1) {
                                        if (i < oldBookie.processors.length) {
                                            newBookie.processors[i].enabled = oldBookie.processors[i].enabled;
                                        }
                                    }
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
                normalizeData(tabData);
                updateBookies(event, tabData);
                $scope.events.sort(function(a, b) {
                    return a.time > b.time ? 1 : a.time < b.time ? -1 : 0;
                });
                bbStorage.set(event.id, event);

                if ($scope.extraPlaceEvent && $scope.extraPlaceEvent.eventId === event.id) {
                    updateExtraPlaceBookies(event);
                }
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
                event.betfairCount = bbUtils.getMarketCount(event.betfair);
                event.betfairOk = getInterval(event.betfairLastUpdate) < $scope.betfairPollInterval * 2;
                event.betfairLastUpdate = new Date();
                event.bookies.forEach(function(bookie) {
                    $scope.updateBookiePrices(bookie, betfairData, dataTypes.betfair);
                });
                if ($scope.extraPlaceEvent && $scope.extraPlaceEvent.eventId === event.id) {
                    updateExtraPlaceLay(betfairData);
                }
            }
        };

        // for each event check if it has a bookie with this tab,
        // then clear the tabId and if that event doesn't have bookies with tabId, remove the event
        $scope.removeTab = function(tabId) {
            $scope.events = $scope.events.filter(function(event) {
                var hasOpenTabs = false;
                event.bookies.forEach(function(bookie) {
                    if (bookie.tabId === tabId) {
                        bookie.tabId = false;
                    } else {
                        hasOpenTabs = hasOpenTabs || !!bookie.tabId;
                    }
                });
                return hasOpenTabs;
            });
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

        $scope.selectExtraPlaceEvent = function(event) {
            if (event) {
                $scope.extraPlaceEvent = {
                    eventId: event.id,
                    runners: [],
                    summary: {}
                };
                updateExtraPlaceBookies(event);
            } else {
                $scope.extraPlaceEvent = false;
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
                }
                $scope.selectRunner(false);
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

        $scope.toggleRunnerExcluded = function(runner) {
            if (runner.lockedBackOdds === 0) {
                runner.lockedBackOdds = runner.price;
                $scope.lockRunnerPrice(runner, false);
            } else {
                runner.lockedBackOdds = 0;
                $scope.lockRunnerPrice(runner, true);
            }
        };

        $scope.testStorage = function() {
            bbStorage.set('bbTest', {id: 123, obj: {id: 1, name: 'test'}, arr: [{name: 'a1'}, {name: 'a2'}]});
            bbStorage.get('bbTest', function(value) {
                $log.debug('testStorage.get(): ', value);
            })
        };

        $scope.resetStorage = function() {
            bbStorage.clean();
        };

        $scope.sendToCalc = function(runner, processor) {
            $http.get('http://localhost:7777?b=' + runner.backOdds + '&l=' + runner.layOdds + '&c=' + $scope.selectedBookie.layCommission)
                .error(function(data, status) {
                    $log.debug('sendToCalc() error', data, status);
                });
        };
    }]);