if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Willhill)');
    }
    window.bb_getScraperName = 'bb_getWillhill';
}

window.bb_getWillhill = function() {
    var $contentHead = $('#contentHead h2');
    var result = {
            event: {
                name: bb.getText($contentHead).replace(/([A-z ]*)( - All Markets)/gi, '$1'),
                time: bb.getText($('#eventDetailsHeader span')).replace(/(.*)([0-9]{2}:[0-9]{2})(.*)/gi, '$2')
            },
            bookies: [{name: 'William Hill', markets: []}]
        },
        markets = result.bookies[0].markets;
    //markets.push({name: 'Test market', runners: [{name: 'Test1', price: 10}]});

    var home = bb.getHome(result.event.name);
    var away = bb.getAway(result.event.name);


    function renameRunner(name, marketName, home, away) {
        var newName = name
            .replace(/Manchester City/gi, 'Man City')
            .replace(/Manchester Utd/gi, 'Man Utd')
            .replace(/Manchester United/gi, 'Man Utd');
        if ('Correct Score' === marketName) {
            newName = bb.normalizeCorrectScore(newName, home, away);
        }
        if ('HT / FT' === marketName) {
            newName = bb.normalizeHtFt(newName);
        }
        return newName;
    }

    function renameMarket(name) {
        return name
            .replace(/Match Betting Live/gi, 'Match Odds')
            .replace(/Match Betting/gi, 'Match Odds')
            .replace(/Live Score/gi, 'Correct Score')
            .replace(/Double Result/gi, 'HT / FT')
            .replace(/Total Match Goals Over\/Under/gi, 'Over/Under')
            .replace(/(Match Under\/Over )([1-5]\.5 Goals)( Live)/gi, 'Over/Under $2');
    }

    function isKnownMarket(name) {
        var knownMarkets = ['Match Odds', 'Correct Score', 'HT / FT', 'Over/Under 2.5 Goals'];
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
                var $runner = $(this),
                    runnerName = renameRunner(bb.getText($runner.find('.eventselection')), market.name, home, away);
                if (runnerName) {
                    var runner = {
                        name: runnerName,
                        price: bb.getText($runner.find('.eventprice'))
                    };
                    market.runners.push(runner);
                }
            });
            markets.push(market);
        }
    });

    return result;
};