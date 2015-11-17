describe('Main app', function() {
    describe('Controller', function() {
        var $scope, createController, $log, $interval;

        beforeEach(function() {
            module('BBApp');

            inject(function ($injector, $rootScope, $controller) {
                $log = $injector.get('$log');
                $interval = $injector.get('$interval');

                createController = function () {
                    $scope = $rootScope.$new();
                    return $controller('MainCtrl', {
                        $scope: $scope,
                        $log: $log,
                        $interval: $interval
                    });
                };
            });
            createController();
        });

        it('should determine Smarkets url', function() {
            expect($scope.isSmarkets('http://smarkets.com/event/32323')).toBe(true);
            expect($scope.isSmarkets('http://skybet.com/event/32323')).toBe(false);
        });

        function simpleData() {
            return {
                event: {
                    name: 'Test Event',
                    time: '10:00'
                },
                bookies: [
                    {
                        name: 'Sky Bet', // name must be in the knownBookies list, otherwise it'll be filtered out
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
        });

        it('should update existing event (bookies data)', function() {
            $scope.knownBookies = [{name: 'B1'}, {name: 'Sky Bet'}, {name: 'B3'}];
            var data = simpleData();
            $scope.events.push({
                id: 1,
                data: data,
                bookies: [{name: 'B1'}, {name: 'Sky Bet'}, {name: 'B3'}],
                url: 'http://skybet.com/event/1'
            });

            var tabData = {
                id: 1,
                data: data,
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
            expect(r.backOdds).toBe('11.00');
            r = b.markets[0].runners[1];
            expect(r.price).toBe('21');
            //expect(JSON.stringify(b)).toBe(false);
        });

        it('should update existing event (Smarkets)', function() {
            $scope.events.push({
                id: 1,
                data: simpleData(),
                smarkets: {url: 'http://smarkets.com/event/1'}
            });
            var smarketsData = {
                id: 10, // different tab
                data: simpleData().bookies[0],
                url: 'http://smarkets.com/event/1'
            };
            smarketsData.data.name = 'smarkets';
            smarketsData.data.markets[0].runners[0].price = '100';
            smarketsData.data.markets[0].runners[1].price = '200';
            $scope.updateData(smarketsData);
            expect($scope.events.length).toBe(1);
            expect($scope.events[0].data.bookies.length).toBe(1);
            var b = $scope.events[0].data.bookies[0];
            expect(b.markets.length).toBe(1);
            expect(b.markets[0].runners.length).toBe(2);
            var r = b.markets[0].runners[0];
            expect(r.lay.smarkets.price).toBe('100');
            r = b.markets[0].runners[1];
            expect(r.lay.smarkets.price).toBe('200');
        });

        it('should update existing event (Betfair)', function() {
            $scope.updateData({
                id: 1,
                data: simpleData(),
                betfair: '123456',
                url: 'http://skybet.com/event/1'
            });
            expect($scope.events.length).toBe(1);
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
                            {name: 'runner 1', price: '11', size: 100}
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
            expect(runner.backOdds).toBe('10.00');
            expect(runner.lay).toBeDefined();
            expect(runner.lay.bf).toBeDefined();
            expect(runner.lay.bf.price).toBe('11');
            expect(runner.lay.bf.size).toBe(100);
            runner = market.runners[1];
            expect(runner.name).toBe('runner 2');

            // todo-timur: normalize runner names (' etc.)
        });

        it('should add event if not found (bookies data)', function() {
            $scope.events.push({id: 1});
            var tabData = {
                id: 2,
                data: simpleData(),
                betfair: '1234',
                url: 'http://skybet.com/event/2'
            };
            tabData.data.bookies[0].name = 'Bet 365';
            $scope.updateData(tabData);
            expect($scope.events.length).toBe(2);
            var event = $scope.events[1];
            expect(event.name).toBe('Test Event 10:00');
            expect(event.time).toBe('10:00');
            expect(event.data.bookies[0].name).toBe('Bet 365');
        });

        it('should not add event if not found and Smarkets data', function() {
            $scope.events.push({id: 1});
            $scope.updateData({id: 2, data: 'test', url: 'http://smarkets.com/event/2'});
            expect($scope.events.length).toBe(1);
            expect($scope.events[0].id).toBe(1);
        });

        it('should select only 1 event at a time', function() {
            $scope.events.push({id: 1});
            $scope.events.push({id: 2});
            $scope.events.push({id: 3});
            expect($scope.events[0].selected).toBeFalsy();
            expect($scope.events[1].selected).toBeFalsy();
            expect($scope.events[2].selected).toBeFalsy();
            expect($scope.selectedEvent).toBeFalsy();

            $scope.selectEvent($scope.events[0]);
            expect($scope.events[0].selected).toBeTruthy();
            expect($scope.events[1].selected).toBeFalsy();
            expect($scope.events[2].selected).toBeFalsy();
            expect($scope.selectedEvent).toBeTruthy();

            $scope.selectEvent($scope.events[2]);
            expect($scope.events[0].selected).toBeFalsy();
            expect($scope.events[1].selected).toBeFalsy();
            expect($scope.events[2].selected).toBeTruthy();
            expect($scope.selectedEvent).toBeTruthy();

            $scope.selectEvent($scope.events[1]);
            expect($scope.events[0].selected).toBeFalsy();
            expect($scope.events[1].selected).toBeTruthy();
            expect($scope.events[2].selected).toBeFalsy();
            expect($scope.selectedEvent).toBeTruthy();

            $scope.selectEvent(false);
            expect($scope.events[0].selected).toBeFalsy();
            expect($scope.events[1].selected).toBeFalsy();
            expect($scope.events[2].selected).toBeFalsy();
            expect($scope.selectedEvent).toBeFalsy();
        });
    });
});