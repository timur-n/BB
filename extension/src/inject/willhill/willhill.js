if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Willhill)');
    }
    window.bb_getScraperName = 'bb_getWillhill';
}

window.bb_getWillhill = function() {
    var result = {
            event: {name: 'Test event', time: '20:00'},
            bookies: [{name: 'William Hill', markets: []}]
        },
        markets = result.bookies[0].markets;
    //markets.push({name: 'Test market', runners: [{name: 'Test1', price: 10}]});

    function renameMarket(name) {
        return name
            .replace(/Match Betting Live/gi, 'Match Odds')
            .replace(/Match Betting/gi, 'Match Odds');
    }

    function isKnownMarket(name) {
        var knownMarkets = ['Match Odds', 'Correct Score', 'Half-Time/Full-Time', 'Under/Over 2.5 Goals'];
        return knownMarkets.indexOf(name) >= 0;
    }


    var $markets = $('#primaryCollectionContainer div[id*=ip_market]');
    result.debug = {
        marketsLength: $markets.length,
        markets: []
    };
    $markets.each(function() {
        var $market = $(this),
            name = renameMarket($market.find('span[id*=ip_market_name]').text().trim());
        result.debug.markets.push(name);
        if (isKnownMarket(name)) {
            var market = {
                name: name || $market.find('span').text(),
                runners: []
            };
            var $runners = $market.find('div[id*=ip_oddsBtn]');
            $runners.each(function() {
                var $runner = $(this);
                var runner = {
                    name: $runner.find('.eventselection').text().trim(),
                    price: $runner.find('.eventprice').text().trim()
                };
                market.runners.push(runner);
            });
            markets.push(market);
        }
    });

    return result;
};