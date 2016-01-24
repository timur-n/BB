angular.module('mocks', [])
    .factory('bbStorage', function() {
        return {
            set: function() {},
            get: function() {}
        };
    });

describe('Main app', function() {

    describe('BBUtils', function() {

        var svc;

        beforeEach(function() {
            module('BBUtils');
            var $injector = angular.injector(['BBUtils']);
            svc = $injector.get('bbUtils');
        });

        describe('indexByValue', function() {
            it('should find index by integer value', function () {
                var array = [{id: 1}, {id: 2}, {id: 3}];
                var i = svc.indexByValue(array, 'id', 3);
                expect(i).toBe(2);
                i = svc.indexByValue(array, 'id', 5);
                expect(i).toBe(-1);
                i = svc.indexByValue(array, 'none', 3);
                expect(i).toBe(-1);
                i = svc.indexByValue([], 'id', 3);
                expect(i).toBe(-1);
            });

            it('should find index by bool', function () {
                var i = svc.indexByValue([{b: false}, {b: false}, {b: true}], 'b', true);
                expect(i).toBe(2);
            });
        });

        describe('objByValue', function() {
            it('should find object by integer value', function () {
                var array = [{id: 1}, {id: 2}, {id: 3}];
                var i = svc.objByValue(array, 'id', 3);
                expect(i).toBe(array[2]);
                i = svc.objByValue(array, 'id', 5);
                expect(i).toBeUndefined();
                i = svc.objByValue(array, 'none', 3);
                expect(i).toBeUndefined();
                i = svc.objByValue([], 'id', 3);
                expect(i).toBeUndefined();
            });

            it('should not fail when object does not have given key', function() {
                var array = [{id: 1}];
                expect(function() {
                    var obj = svc.objByValue(array, 'none', 'test');
                }).not.toThrow();
            });
        });

        describe('objByStr', function() {
            it('should find object by integer value', function () {
                var array = [{id: 'String 1'}, {id: 'STRING 2'}, {id: 'string 3'}];
                var i = svc.objByStr(array, 'id', 'String 1');
                expect(i).toBe(array[0]);
                i = svc.objByStr(array, 'id', 'String 2');
                expect(i).toBe(array[1]);
                i = svc.objByStr(array, 'id', 'STRING 3');
                expect(i).toBe(array[2]);
                i = svc.objByValue([], 'id', 'Test');
                expect(i).toBeUndefined();
            });

            it('should not fail when object does not have given key', function() {
                var array = [{id: 1}];
                expect(function() {
                    var obj = svc.objByStr(array, 'none', 'test');
                }).not.toThrow();
            });
        });

        describe('getMarketIds', function() {
            it('should allow URLs separated by new line', function() {
                var str = 'https://www.betfair.com/exchange/plus/#/horse-racing/market/1.122124024\nhttps://www.betfair.com/exchange/plus/#/horse-racing/market/1.122124025?nodeId=27619263';
                var result = svc.getMarketIds(str);
                expect(result).toBe('1.122124024,1.122124025');
            });

            it('should allow more than 2 URLs separated by new line', function() {
                var str = 'https://www.betfair.com/exchange/plus/#/football/market/1.122285642\nhttps://www.betfair.com/exchange/plus/#/football/market/1.122285637\nhttps://www.betfair.com/exchange/plus/#/football/market/1.122285639';
                var result = svc.getMarketIds(str);
                expect(result).toBe('1.122285642,1.122285637,1.122285639');
            });
        });

        describe('normalizePrice', function() {
            it('should not display decimals if none', function() {
                expect(svc.normalizePrice(11.000)).toBe(11);
            });
            it('should display decimals when any', function() {
                expect(svc.normalizePrice(11.500)).toBe(11.5);
            });
            it('should display max 2 decimals', function() {
                expect(svc.normalizePrice(1.2345)).toBe(1.23);
            });
        });
    });

    describe('Controller', function() {
        var $scope, ctrl;

        beforeEach(module('BBApp'));
        beforeEach(module('mocks'));
        beforeEach(inject(function($controller, $rootScope, _$log_, _$interval_, _bbStorage_, _bbUtils_) { // inject mocked service
            $scope = $rootScope.$new();
            ctrl = $controller('MainCtrl', {
                $scope: $scope,
                $log: _$log_,
                $interval: _$interval_,
                bbStorage: _bbStorage_,
                bbUtils: _bbUtils_
            });
        }));

        it('should determine Smarkets url', function() {
            expect($scope.isSmarkets('http://smarkets.com/event/32323')).toBe(true);
            expect($scope.isSmarkets('http://skybet.com/event/32323')).toBe(false);
        });

        function simpleData(time) {
            return {
                event: {
                    name: 'Test Event',
                    time: time || '10:00'
                },
                bookies: [
                    {
                        name: 'Sky Bet', // name must be in the knownBookies list, otherwise it'll be filtered out
                        ew: {
                            fraction: 5,
                            places: 3
                        },
                        markets: [
                            {
                                name: 'market 1',
                                runners: [
                                    {name: 'runner 1', price: '10'},
                                    {name: 'runner 2', price: '20'}
                                ]
                            }
                        ]
                    }
                ]
            }
        }

        it('should create simple test data', function() {
            var data = simpleData();
            //expect(data.betfair).toBe('123456'); not needed?
            expect(data.bookies).toBeDefined();
            expect(data.bookies.length).toBe(1);
            var bookie = data.bookies[0];
            expect(bookie.markets.length).toBe(1);
            expect(bookie.markets[0].runners.length).toBe(2);
            expect(bookie.ew).toBeDefined();
            expect(bookie.ew.fraction).toBe(5);
            expect(bookie.ew.places).toBe(3);
        });

        it('should update Bookie data in existing event', function() {
            // Initial state
            $scope.knownBookies = [{name: 'B1'}, {name: 'Sky Bet'}, {name: 'B3'}];
            $scope.updateData({
                id: 1,
                data: simpleData(),
                bookies: [{name: 'B1'}, {name: 'Sky Bet'}, {name: 'B3'}],
                url: 'http://skybet.com/event/1'
            });

            // Updated state - same data with updated prices
            var tabData = {
                id: 1,
                data: simpleData(),
                url: 'http://skybet.com/event/1'
            };
            tabData.data.bookies[0].markets[0].runners[0].price = '11';
            tabData.data.bookies[0].markets[0].runners[1].price = '21';

            $scope.updateData(tabData);
            expect($scope.events.length).toBe(1);
            expect($scope.events[0].bookies.length).toBe(3); // same as known bookies
            var b = $scope.events[0].bookies[1];
            expect(b.name).toBe('Sky Bet');
            expect(b.markets.length).toBe(1);
            expect(b.markets[0].runners.length).toBe(2);
            var r = b.markets[0].runners[0];
            expect(r.price).toBe('11');
            expect(r.backOdds).toBe(11);
            r = b.markets[0].runners[1];
            expect(r.price).toBe('21');
            //expect(JSON.stringify(b)).toBe(false);
            // todo-timur: normalize runner names (' etc.)
        });

        it('should update Betfair data in existing event', function() {
            $scope.updateData({
                id: 1,
                data: simpleData(),
                url: 'http://skybet.com/event/1'
            });
            expect($scope.events.length).toBe(1);
            $scope.events[0].betfair = '123456';
            // Betfair data must match simpleData()
            $scope.updateBetfairData({
                betfair: '123456',
                markets: [
                    {
                        event: {},
                        eventType: {},
                        name: 'market 1',
                        runners: [
                            {name: 'runner 3', price: '33', size: 300},
                            {name: 'runner 2', price: '22', size: 200},
                            {name: 'runner 1', price: '11.5', size: 100}
                        ]
                    }
                ]
            });
            expect($scope.events.length).toBe(1);
            var event = $scope.events[0];
            expect(event.bookies.length).toBeGreaterThan(2);
            var bookie = event.bookies[1];
            expect(bookie.name).toBe('Sky Bet');
            expect(bookie.markets.length).toBe(1);
            var market = bookie.markets[0];
            expect(market.runners.length).toBe(2);
            var runner = market.runners[0];
            expect(runner.name).toBe('runner 1');
            expect(runner.backOdds).toBe(10);
            expect(runner.lay).toBeDefined();
            expect(runner.lay.bf).toBeDefined();
            expect(runner.lay.bf.price).toBe('11.5');
            expect(runner.lay.bf.size).toBe(100);
            expect(runner.layOdds).toBe(11.5);
            runner = market.runners[1];
            expect(runner.name).toBe('runner 2');
        });

        it('should add event if not found', function() {
            var tabData = {
                id: 2,
                data: simpleData(),
                url: 'http://skybet.com/event/2'
            };

            $scope.updateData(tabData);
            expect($scope.events.length).toBe(1);
            var event = $scope.events[0];
            expect(event.name).toBe('Test Event 10:00');
            expect(event.time).toBe('10:00');
            expect(event.bookies.length).toBe($scope.knownBookies.length);
            var bookie = event.bookies[0];
            expect(bookie.name).toBe('Bet 365');
            expect(bookie.backStake).toBe(10);
            expect(bookie.layCommission).toBe(5);
        });

        it('should apply selected processors', function() {
            $scope.updateData({
                id: 1,
                data: simpleData()
            });
            expect($scope.events.length).toBe(1);
            var event = $scope.events[0];
            expect(event.bookies.length).toBe($scope.knownBookies.length);
            var bookie = event.bookies[1];
            expect(bookie.name).toBe('Sky Bet');
            expect(bookie.processors).toBeDefined();
            expect(bookie.processors.length > 0).toBeTruthy();
        });

        it('should allow locking runner price', function() {
            $scope.updateData({
                id: 1,
                data: simpleData()
            });
            var runner = $scope.events[0].bookies[1].markets[0].runners[0];
            expect(runner.backOdds).toBe(10);
            var tabData = {
                id: 1,
                data: simpleData()
            };
            tabData.data.bookies[0].markets[0].runners[0].price = '11/1';
            $scope.updateData(tabData);
            expect(runner.backOdds).toBe(12);

            runner.lockedBackOdds = '15';
            $scope.lockRunnerPrice(runner, true);
            expect(runner.backOdds).toBe(15);

            tabData = {
                id: 1,
                data: simpleData()
            };
            tabData.data.bookies[0].markets[0].runners[0].price = '4/1';
            $scope.updateData(tabData);
            expect(runner.backOdds).toBe(15);
        });

        it('should remove event if there are no tabs streaming its data', function() {
            $scope.updateData({
                id: 100,
                data: simpleData()
            });
            $scope.updateData({
                id: 200,
                data: simpleData('12:00') // make this event 2nd after sorting
            });
            var bookie = $scope.events[0].bookies[1];
            expect(bookie.name).toBe('Sky Bet'); // just sanity check
            expect(bookie.tabId).toBe(100);
            $scope.removeTab(100);
            expect($scope.events.length).toBe(1);
            expect($scope.events[0].time).toBe('12:00');
        });

        describe('Extra Place view', function() {
            it('should create EP runner', function() {
                var runner = $scope.createExtraPlaceRunner('EPRunner');
                expect(runner.name).toBe('EPRunner');
                expect(runner.bookies.length).toBe($scope.knownBookies.length);
            });

            it('should update EP runner price for bookie', function() {
                var runner = $scope.createExtraPlaceRunner('EPRunner');
                var bookie = {
                    name: 'Sky Bet',
                    markets: [
                        {
                            name: 'Doh'
                        },
                        {
                            name: 'Win',
                            runners: [
                                {
                                    name: 'Dude',
                                    backOdds: 10
                                },
                                {
                                    name: 'EPRunner',
                                    backOdds: 15
                                }
                            ]
                        }
                    ]
                };
                runner.updateBackOdds(bookie);
                var sky = runner.bookies[1];
                expect(sky.name).toBe('Sky Bet');
                expect(sky.backOdds).toBe(15);
                expect(sky.isBest).toBe(true);
                expect(runner.backOdds).toBe(15);

                bookie.markets[1].runners[1].backOdds = 12;
                runner.updateBackOdds(bookie);
                sky = runner.bookies[1];
                expect(sky.isBest).toBe(true);
                expect(runner.backOdds).toBe(12);

                bookie = {
                    name: 'Bet 365',
                    markets: [
                        {
                            name: 'Win',
                            runners: [
                                {
                                    name: 'EPRunner',
                                    backOdds: 14
                                }
                            ]
                        }
                    ]
                };
                runner.updateBackOdds(bookie);
                sky = runner.bookies[1];
                expect(sky.isBest).toBe(false);
                var b365 = runner.bookies[0];
                expect(b365.isBest).toBe(true);
                expect(runner.backOdds).toBe(14);
            });

            it('should update lay prices', function() {
                $scope.updateData({
                    id: 1,
                    data: simpleData()
                });

                var event = $scope.events[0];
                $scope.selectExtraPlaceEvent(event);

                event.betfair = '123456';
                // Betfair data must match simpleData()
                $scope.updateBetfairData({
                    betfair: '123456',
                    markets: [
                        {
                            event: {},
                            eventType: {},
                            name: 'Win',
                            runners: [
                                {name: 'runner 3', price: '33', size: 300},
                                {name: 'runner 2', price: '22', size: 200},
                                {name: 'runner 1', price: '11.5', size: 100}
                            ]
                        },
                        {
                            event: {},
                            eventType: {},
                            name: 'Place',
                            runners: [
                                {name: 'runner 3', price: '13.3', size: 30},
                                {name: 'runner 2', price: '12.2', size: 20},
                                {name: 'runner 1', price: '3.5', size: 10}
                            ]
                        }
                    ]
                });

                var runner = $scope.extraPlaceEvent.runners[0];
                expect(runner.layOdds).toBe(11.5);
            });

            it('should allow selecting ExtraPlace event', function() {
                expect($scope.extraPlaceEvent).toBe(false);
                $scope.updateData({
                    id: 100,
                    data: simpleData()
                });
                var event = $scope.events[0];
                $scope.selectExtraPlaceEvent(event);
                expect($scope.extraPlaceEvent).toBeTruthy();
                expect($scope.extraPlaceEvent.eventId).toBeTruthy();
                expect($scope.extraPlaceEvent.eventId).toBe(event.id);
                var runner = $scope.extraPlaceEvent.runners[0];
                expect(runner).toBeDefined();
                expect(runner.name).toBe('runner 1');
                expect(runner.backStake).toBe(10);
            });

            it('should calculate totals', function() {
                $scope.extraPlaceEvent = {
                    runners: [
                        {
                            name: 'runner 1',
                            result: {
                                profit: 1,
                                liability: 1000,
                                win: {
                                    profit: 10,
                                    liability: 100
                                },
                                place: {
                                    profit: -9,
                                    liability: 120
                                }
                            }
                        },
                        {
                            name: 'runner 2',
                            result: {
                                profit: 2,
                                liability: 2000,
                                win: {
                                    profit: 20,
                                    liability: 200
                                },
                                place: {
                                    profit: -18,
                                    liability: 220
                                }
                            }
                        }
                    ]
                };
                $scope.recalculateExtraPlaceEvent();
                expect($scope.extraPlaceEvent.totals.profit).toBe(3); // Sum(profits)
                expect($scope.extraPlaceEvent.totals.liability).toBe(2000); // Max(liabilities)
                expect($scope.extraPlaceEvent.totals.isProfit).toBe(true);
                expect($scope.extraPlaceEvent.totals.isOk).toBe(false);
            });

            describe('Runner', function() {
                it('should toggle bookie isSelected flag', function() {
                    var runner = $scope.createExtraPlaceRunner('test');
                    expect(runner.bookies.length).toBeGreaterThan(3);
                    expect(runner.isLocked('winBack')).toBeFalsy();
                    runner.toggle(runner.bookies[0]);
                    expect(runner.bookies[0].isSelected).toBeTruthy();
                    expect(runner.isLocked('winBack')).toBeTruthy();
                    runner.toggle(runner.bookies[0]);
                    expect(runner.bookies[0].isSelected).toBeFalsy();
                    expect(runner.isLocked('winBack')).toBeTruthy();
                });
            });
        });
    });
});