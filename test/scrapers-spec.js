describe('Scrapers', function() {

    afterEach(function() {
        $('body').empty();
    });

    describe('Smarkets', function() {
        it('should scrape horse page', function() {
        });
    });

    describe('Inject', function() {
        describe('lib', function() {
            it('should create lib', function() {
                expect(window.bb).toBeDefined();
            });

            it('should normalize Correct Score values', function() {
                expect(window.bb.normalizeCorrectScore('QPR 2-0', 'QPR', 'Fullham')).toBe('2 - 0');
                expect(window.bb.normalizeCorrectScore('Fullham 2-0', 'QPR', 'Fullham')).toBe('0 - 2');
                expect(window.bb.normalizeCorrectScore('Draw 1-1', 'QPR', 'Fullham')).toBe('1 - 1');
                expect(window.bb.normalizeCorrectScore('QPR 5-1', 'QPR', 'Fullham')).toBe('');
                expect(window.bb.normalizeCorrectScore('Fullham 1-5', 'QPR', 'Fullham')).toBe('');
                expect(window.bb.normalizeCorrectScore('Draw 5-5', 'QPR', 'Fullham')).toBe('');

                var name = 'Manchester Utd 2-1'.replace(/Manchester Utd/gi, 'Man Utd');
                expect(window.bb.normalizeCorrectScore(name, 'home', 'Man Utd')).toBe('1 - 2');
            });
        });
    });

    describe('Oddschecker', function() {
        it('should scrape page', function() {
            var html = '';
            $('body').append($(html));

            var result = {};
            window.bb_getOddschekerHorse(result);
            expect(result.event).toBeDefined();
            expect(result.event.name).toBe('Leicester');
            expect(result.event.time).toBe('14:45');
            expect(result.bookies).toBeDefined();
            expect(result.bookies.length).toBe(24);
            var bookie = result.bookies[0];
            expect(bookie.name).toBe('Bet 365');
            expect(bookie.markets).toBeDefined();
            expect(bookie.markets.length).toBe(1);
            var market = bookie.markets[0];
            expect(market.name).toBe('Win');
            expect(market.runners).toBeDefined();
            expect(market.runners.length).toBe(4);
            var runner = market.runners[0];
            expect(runner.name).toBe('Stephanie Frances');
            expect(runner.price).toBe('1.8');
            runner = market.runners[1];
            expect(runner.name).toBe('Red Spinner');
            expect(runner.price).toBe('3.75');
            runner = market.runners[2];
            expect(runner.name).toBe('Pine Creek');
            expect(runner.price).toBe('5');
            runner = market.runners[3];
            expect(runner.name).toBe('Exitas');
            expect(runner.price).toBe('15');
        });
    });

    describe('Willhill', function() {
        it('should scrape page', function() {
            // todo-timur: add runners html and tests
            var html =
                '<div id="contentHead"><h2>Real Madrid v Roma - All Markets</h2><span id="eventDetailsHeader"><span>Bet until : 08 Mar  -19:45 UK</span></span></div>' +
                '<div id="primaryCollectionContainer">' +
                    '<div id="ip_market_1"><span id="ip_market_name_1">Match Betting</span></div>' +
                '</div>';
            $('body').append($(html));

            var result = window.bb_getWillhill();
            expect(result.event).toBeDefined();
            expect(result.event.name).toBe('Real Madrid v Roma');
            expect(result.event.time).toBe('19:45');
            expect(result.bookies).toBeDefined();
            expect(result.bookies.length).toBe(1);
            var bookie = result.bookies[0];
            expect(bookie.name).toBe('William Hill');
            expect(bookie.markets).toBeDefined();
            expect(bookie.markets.length).toBe(1);
            var market = bookie.markets[0];
            expect(market.name).toBe('Match Odds');
            expect(market.runners).toBeDefined();
/*
            expect(market.runners.length).toBe(4);
            var runner = market.runners[0];
            expect(runner.name).toBe('Stephanie Frances');
            expect(runner.price).toBe('1.8');
            runner = market.runners[1];
            expect(runner.name).toBe('Red Spinner');
            expect(runner.price).toBe('3.75');
            runner = market.runners[2];
            expect(runner.name).toBe('Pine Creek');
            expect(runner.price).toBe('5');
            runner = market.runners[3];
            expect(runner.name).toBe('Exitas');
            expect(runner.price).toBe('15');
*/
        });
    });

    describe('Bet Victor', function() {
        it('should scrape football page', function() {
            var html = '';
            $('body').append($(html));

            var result = window.bb_getBetvictorFootball();
            expect(result.event).toBeDefined();
            expect(result.event.name).toBe('West Ham v Sunderland');
            expect(result.event.time).toBe('12:45');

            expect(result.bookies.length).toBe(1);
            var bookie = result.bookies[0];
            expect(bookie.markets.length).toBe(2);
            var mkt = bookie.markets[0];
            expect(mkt.name).toBe('Match Odds');
            expect(mkt.runners.length).toBe(2);
            var runner = mkt.runners[0];
            expect(runner.name).toBe('Runner11');
            expect(runner.price).toBe('19/10');
            runner = mkt.runners[1];
            expect(runner.name).toBe('Runner12');
            expect(runner.price).toBe('5/4');

            mkt = bookie.markets[1];
            expect(mkt.name).toBe('Correct Score');
            expect(mkt.runners.length).toBe(3);
            runner = mkt.runners[0];
            expect(runner.name).toBe('1 - 0');
            expect(runner.price).toBe('11/1');
            runner = mkt.runners[1];
            expect(runner.name).toBe('0 - 0');
            expect(runner.price).toBe('15/1');
            runner = mkt.runners[2];
            expect(runner.name).toBe('0 - 1');
            expect(runner.price).toBe('10/4');
        });
        it('should scrape football page', function() {
            var html = '<div id="center_content">' +
                '<div class="coupon_header scrollable">' +
                    '<div class="coupon_header_titles">' +
                        '<h4><span class="localized-time"><em>Saturday</em>12:45</span></h4>' +
                        '<h1>\nStoke City v Aston Villa\n</h1>' +
                    '</div>' +
                '</div>' +
            '</div>';
            $('body').append($(html));

            var result = window.bb_getBetvictorFootball();
            expect(result.debug).toBeDefined();
            expect(result.debug.home).toBe('Stoke City');
            expect(result.debug.away).toBe('Aston Villa');
        });
    });

    fdescribe('Betfair Exchange', function() {

        beforeEach(function () {
            jasmine.getFixtures().fixturesPath = "base/test/html";  // path to templates
        });

        it('should scrape horses page', function() {
            jasmine.getFixtures().load('betfair-horse-win.html');
            var result = window.bb_getBetfairExchange();
            expect(result.event).toBeDefined();
            expect(result.event.name).toBe('Newmarket');
            expect(result.event.time).toBe('15:30');
            expect(result.source).toBe('betfair-exchange');
            expect(result.markets).toBeDefined();
            expect(result.markets.length).toBe(1);
            var mkt = result.markets[0];
            expect(mkt.name).toBe('Win');
            expect(mkt.runners).toBeDefined();
            expect(mkt.runners.length).toBe(7);
            var runner = mkt.runners[0];
            expect(runner.name).toBe('Churchill');
            expect(runner.price).toBe('1.77');
            expect(runner.size).toBe('338');
            //expect($('#jasmine-fixtures').html()).toBe('Test');
        });
    });
});