angular.module('BBBetfair', [])
    .factory('bbBetfair', [function() {

    }]);

angular.module('BBApp', ['BBStorage', 'BBUtils', 'BBProcessors'])
    .controller('MainCtrl', ['$scope', '$log', '$interval', 'bbStorage', 'bbUtils', 'bbProcessors', '$http', '$timeout', '$document',
    function($scope, $log, $interval, bbStorage, bbUtils, bbProcessors, $http, $timeout, $document) {
        $scope.data = 0;
        $scope.events = [];
        $scope.betfair = createBetfair();
        $scope.betfairPollInterval = 5000;
        $scope.extraPlaceEvent = false;
        $scope.knownBookies = [
            {name: 'Bet 365', short: 'B365'},
            //{name: 'Sky Bet', short: 'Sky'},
            //{name: 'Ladbrokes', short: 'Lads'},
            {name: 'Betfair Sportsbook', short: 'BFSB'},
            {name: 'Betfred', short: 'Bfr'},
            {name: 'Paddy Power', short: 'Paddy'},
            {name: 'Bet Victor', short: 'BVic'},
            {name: 'Coral', short: 'Coral'},
            //{name: 'Boylesports', short: 'Boyle'},
            {name: 'Winner', short: 'Winner'},
            {name: 'William Hill', short: 'WH'},
            {name: '188Bet', short: 'b188'},
            {name: 'Betstars', short: 'Betstars'},
            {name: '32Red Bet', short: 'r32'}
        ];
        $scope.isLogOn = false;
        bbStorage.get('bb-settings', function(settings) {
            if (settings) {
                $scope.betfairLogin = settings.login;
            }
        });

        var dataTypes = {
            back: 'back',
            betfair: 'bf',
            smarkets: 'sm'
        };

        function ExtraPlaceRunner(name, knownBookies) {
            this.name = name;
            this.backStake = 10;
            this.isSelected = false;
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
            var bestBackOdds = 0;
            var bestEwFraction = 100;
            this.bookies.forEach(function(bookie) {
                bookie.isBest = false;
                var price = bookie.backOdds * 1.0;
                if (price > bestBackOdds && bookie.ew.fraction <= bestEwFraction) {
                    bestBackOdds = price;
                    bestEwFraction = bookie.ew.fraction;
                }
            }, this);
            this.bookies.forEach(function(bookie) {
                var price = bookie.backOdds * 1.0;
                if (price === bestBackOdds && bookie.ew.fraction === bestEwFraction) {
                    bookie.isBest = true;
                }
            }, this);
            if (bestBackOdds <= 0) {
                bestBackOdds = NaN;
            }
            if (!this.isLocked('winBack')) {
                this.backOdds = bestBackOdds;
            }
            this.place = this.place || {};
            this.place.backOdds = bbUtils.getPlaceOdds(this.backOdds, {places: 0, fraction: bestEwFraction});
            this.result = bbProcessors.eachWay(this, this.backStake, $scope.extraPlaceEvent.layCommission || 0, {});
            $scope.recalculateExtraPlaceEvent();
        };
        ExtraPlaceRunner.prototype.updateBackOdds = function(bookie, excludedBookies) {
            var myBookie = bbUtils.objByStr(this.bookies, 'name', bookie.name);
            if (myBookie) {
                if (bookie.ew) {
                    myBookie.ew = bookie.ew;
                }
                if (excludedBookies && excludedBookies.indexOf(bookie.name) >= 0) {
                    myBookie.backOdds = 0;
                } else {
                    var market = bbUtils.objByStr(bookie.markets, 'name', 'Win');
                    if (market) {
                        var runner = bbUtils.objByStr(market.runners, 'name', this.name);
                        if (runner) {
                            myBookie.backOdds = runner.backOdds;
                            this.recalculate();
                        }
                    }
                }
            }
        };
        ExtraPlaceRunner.prototype.updateLayOdds = function(runner, marketName) {
            if (/WIN/gi.test(marketName)) {
                if (!this.isLocked('winLay')) {
                    this.layOdds = bbUtils.normalizePrice(runner.price);
                }
                this.size = runner.size;
            } else if (/PLACE/gi.test(marketName)) {
                this.place = this.place || {};
                if (!this.isLocked('placeLay')) {
                    this.place.layOdds = bbUtils.normalizePrice(runner.price);
                }
                this.place.size = runner.size;
            }
            this.recalculate();
        };
        ExtraPlaceRunner.prototype.toggleLock = function(name) {
            this.locks = this.locks || {};
            this.locks[name] = !this.locks[name];
        };
        ExtraPlaceRunner.prototype.isLocked = function(name) {
            return this.locks && this.locks[name];
        };
        ExtraPlaceRunner.prototype.getSelectedBookie = function() {
            this.bookies.forEach(function(b) {
                if (b.isSelected) {
                    return b;
                }
            });
        };
        ExtraPlaceRunner.prototype.toggle = function(bookie, unlock) {
            var selectedBookie;
            this.bookies.forEach(function(b) {
                if (b.isSelected) {
                    selectedBookie = b;
                }
                b.isSelected = false;
            });
            if (selectedBookie !== bookie) {
                if (selectedBookie) {
                    selectedBookie.isSelected = false;
                }
                bookie.isSelected = true;
            }
            if (bookie.isSelected && !this.isLocked('winBack') && !unlock) {
                this.toggleLock('winBack')
            }
            this.isBacked = bookie.isSelected;
        };
        ExtraPlaceRunner.prototype.toggleRunner = function() {
            this.isSelected = !this.isSelected;
            this.copyData();
        };
        ExtraPlaceRunner.prototype.copyData = function() {
            var date = new Date(),
                day = date.getDate(),
                month = date.getMonth() + 1,
                year = date.getFullYear(),
                dateStr = day + '/' + month + '/' + year + ' ' + $scope.extraPlaceEvent.time,
                bookie = this.getSelectedBookie() || '?',
                s1 = [
                    bookie,
                    'Qualifier',
                    dateStr,
                    $scope.extraPlaceEvent.name,
                    this.name,
                    this.backStake,
                    this.backOdds,
                    this.layOdds || 0,
                    this.result.win.layStake || 0,
                    $scope.extraPlaceEvent.layCommission
                ],
                s2 = [
                    bookie,
                    'Qualifier',
                    dateStr,
                    $scope.extraPlaceEvent.name,
                    this.name,
                    this.backStake,
                    this.place.backOdds,
                    this.place.layOdds || 0,
                    this.result.place.layStake || 0,
                    $scope.extraPlaceEvent.layCommission
                ];
            $scope.copiedText = s1.join('\t') + '\n' + s2.join('\t');
            $timeout(function() {
                $('#copied-text').focus().select();
                document.execCommand('copy');
            });
        };

        function log() {
            if ($scope.isLogOn) {
                $log.debug.apply(this, arguments);
            }
        }

        $scope.createExtraPlaceRunner = function(name) {
            return new ExtraPlaceRunner(name, this.knownBookies);
        };

        // Poll betfair data for events
        $interval(function() {
            $scope.betfair.setAccount($scope.betfairLogin, $scope.betfairPassword);
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
                bestResults = {};

            bookie.markets.forEach(function(market) {
                market.runners.forEach(function(runner) {
                    if (!runner.locked) {
                        runner.backOdds = bbUtils.normalizePrice(runner.price);
                    }
                    // todo-timur: find best lay odds (betfair/smarkets)
                    runner.layOdds = bbUtils.normalizePrice(runner.lay && runner.lay.bf && runner.lay.bf.price);
                    runner.size = runner.lay && runner.lay.bf && runner.lay.bf.size;
                    runner.result = runner.result || {};
                    runner.outOfRange = runner.backOdds > bookie.maxOdds || runner.backOdds < bookie.minOdds;
                    if (bookie.processors) {
                        bookie.processors.forEach(function(processor) {
                            if (processor.enabled) {
                                runner.result[processor.id] = processor.func(runner, bookie.backStake, bookie.layCommission, bookie);
                                var result = runner.result[processor.id];
                                result.isBest = false;
                                result.outOfRange = runner.outOfRange;

                                if (processor.enabled && result && result.enough && !result.outOfRange) {
                                    isProfit = isProfit || result.isProfit;
                                    isOk = isOk || result.isOk;
                                    var bestResult = bestResults[processor.id];
                                    if (!bestResult || bestResult.profit < result.profit) {
                                        bestResults[processor.id] = result;
                                    }
                                }
                            }
                        });
                    }
                });
            });
            bookie.bestResults = bestResults;
            var bestOverall;
            bookie.processors.forEach(function(processor) {
                var result = bestResults[processor.id];
                if (result) {
                    result.isBest = true;
                    if (!bestOverall || bestOverall.profit < result.profit) {
                        bestOverall = result;
                    }
                }
            });
            bookie.summary = {
                text: !!bestOverall ? bestOverall.profit.toFixed(2) : '...',
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
            // Clear all prices first, but only for back data
            if (dataType === dataTypes.back) {
                oldBookie.markets = oldBookie.markets || [];
                oldBookie.markets.forEach(function (item) {
                    item.runners.forEach(function (runner) {
                        $scope.updateRunner(runner, dataType, NaN);
                    });
                });
            }
            // Now match all markets/runners and update prices
            if (newData.markets) {
                newData.markets.forEach(function(newMkt) {
                    var oldMkt = bbUtils.objByStr(oldBookie.markets, 'name', newMkt.name);
                    var isPlaceLay = /PLACE/gi.test(newMkt.name) && dataType !== dataTypes.back;
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
                        runner.name = runner.name.replace(/'/gi, '').replace('-', ' ');
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
                                        epRunner.updateBackOdds(bookie, $scope.extraPlaceEvent.excludedBookies);
                                    })
                                }
                            })
                        }
                    });
                }

                if ($scope.extraPlaceEvent.loaded) {
                    bbStorage.set('EP-' + $scope.extraPlaceEvent.eventId, $scope.extraPlaceEvent);
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

        // todo-timur: tools for locking prices, bookies and exchanges; more styles for lay stakes etc.
        $scope.recalculateExtraPlaceEvent = function() {
            if ($scope.extraPlaceEvent) {
                var totals = {
                    any: false,
                    profit: 0,
                    liability: 0,
                    backStake: 10, // todo-timur: get average for isOk calculation?
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
                        totals.liability = Math.max(totals.liability, runner.result.liability);
                        totals.win.profit += runner.result.win.profit;
                        totals.place.profit += runner.result.place.profit;
                    }
                });
                totals.isProfit = totals.profit >= 0;
                totals.isOk = !totals.isProfit && (Math.abs(totals.profit) / totals.backStake < 0.1);
                $scope.extraPlaceEvent.totals = totals;
            }
        };

        $scope.extraPlaceFilterFn = function(value, index, array) {
            if ($scope.extraPlaceEvent && $scope.extraPlaceEvent.filter) {
                return value.result.profit >= $scope.extraPlaceEvent.filter
            } else {
                return true;
            }
        };

        $scope.getEventId = function(data) {
            return data && data.event && (data.event.name + ' ' + data.event.time);
        };

        $scope.isBetfairData = function(data) {
            return data && data.source === 'betfair-exchange';
        };

        $scope.updateData = function(tabData) {
            log('updateData()', tabData);
            if ($scope.isBetfairData(tabData.data)) {
                return $scope.updateBetfairData(tabData.data);
            }

            var eventId = $scope.getEventId(tabData.data);
            var event = bbUtils.objByValue($scope.events, 'id', eventId);
            if (!event && eventId) {
                var name = 'Unknown';
                var bookies = $scope.knownBookies.map(function(knownBookie) {
                    return {
                        name: knownBookie.name,
                        backStake: 10,
                        minOdds: 1,
                        maxOdds: 180,
                        layCommission: 5,
                        backWinnerTerms: 0,
                        processors: [
                            {name: 'Qualifier', id: 'q', func: bbProcessors.qualifier, enabled: false},
                            {name: 'Freebet', id: 'snr', func: bbProcessors.freeSnr, enabled: false},
                            {name: 'Each way', id: 'ew', func: bbProcessors.eachWay, enabled: true}
                        ],
                        summary: {}
                    }
                });
                event = {
                    id: eventId,
                    name: tabData.data && tabData.data.event && tabData.data.event.name || name,
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
                                    newBookie.minOdds = oldBookie.minOdds;
                                    newBookie.maxOdds = oldBookie.maxOdds;
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
                if (event.name !== 'Unknown') {
                    $scope.events.push(event);
                }
                //$log.debug('Event added', event);
            }

            if (event) {
                event.url = tabData.url;
                event.title = event.name + ' ' + event.time;
                normalizeData(tabData);
                updateBookies(event, tabData);
                $scope.events.sort(function(a, b) {
                    return a.time > b.time ? 1 : a.time < b.time ? -1 : 0;
                });
                bbStorage.set(event.id, event);
                bbStorage.set('bb-settings', {
                    login: $scope.betfairLogin
                });

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
            log('updateBetfairData()', betfairData);
            var event = bbUtils.objByStr($scope.events, 'betfair', betfairData.betfair);
            if (!event && $scope.isBetfairData(betfairData)) {
                var eventId = $scope.getEventId(betfairData);
                event = bbUtils.objByStr($scope.events, 'id', eventId);
            }
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
                $scope.selectedBookie = false;
                $scope.extraPlaceEvent = {
                    eventId: event.id,
                    name: event.name,
                    time: event.time,
                    title: event.title,
                    layCommission: 5,
                    runners: [],
                    summary: {},
                    loaded: false
                };
                bbStorage.get('EP-' + event.id, function (value) {
                    if ($scope.extraPlaceEvent) {
                        if (value && value.runners) {
                            value.runners.forEach(function (savedRunner) {
                                var runner = bbUtils.objByStr($scope.extraPlaceEvent.runners, 'name', savedRunner.name);
                                if (runner) {
                                    runner.backStake = savedRunner.backStake;
                                    runner.locks = savedRunner.locks;
                                    runner.backOdds = savedRunner.backOdds;
                                    runner.layOdds = savedRunner.layOdds;
                                    if (runner.place && savedRunner.place) {
                                        runner.place.layOdds = savedRunner.place.layOdds;
                                    }
                                    savedRunner.bookies.forEach(function(savedBookie) {
                                        if (savedBookie.isSelected) {
                                            var bookie = bbUtils.objByStr(runner.bookies, 'name', savedBookie.name);
                                            if (bookie) {
                                                runner.toggle(bookie, true);
                                            }
                                        }
                                    });
                                }
                            });
                            $scope.extraPlaceEvent.excludedBookies = value.excludedBookies || [];
                            $scope.extraPlaceEvent.layCommission = value.layCommission;
                        }
                        $scope.extraPlaceEvent.loaded = true;
                    }
                });
                updateExtraPlaceBookies(event);
            } else {
                $scope.extraPlaceEvent = false;
            }
        };

        $scope.toggleExtraPlaceBookie = function(knownBookie) {
            if ($scope.extraPlaceEvent) {
                $scope.extraPlaceEvent.excludedBookies = $scope.extraPlaceEvent.excludedBookies || [];
                var excludedBookies = $scope.extraPlaceEvent.excludedBookies;
                var i = excludedBookies.indexOf(knownBookie.name);
                if (i >= 0) {
                    excludedBookies.splice(i, 1);
                } else {
                    excludedBookies.push(knownBookie.name);
                }
            }
        };

        $scope.isExtraPlaceBookieOn = function(knownBookie) {
            if ($scope.extraPlaceEvent && $scope.extraPlaceEvent.excludedBookies) {
                return $scope.extraPlaceEvent.excludedBookies.indexOf(knownBookie.name) < 0;
            } else {
                return true;
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