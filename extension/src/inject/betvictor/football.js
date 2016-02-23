
/**
 * Betvictor data
 */

if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Betvictor football)');
    }
    window.bb_getScraperName = 'bb_getBetvictorFootball';
}

window.bb_getBetvictorFootball = function() {
    var result = {
            bookies: [{name: 'Bet Victor', markets: []}]
        },
        markets = result.bookies[0].markets,
        $root = $('#center_content'),
        $panels = $root.find('.single_markets'),
        home = '',
        away = '';

    result.event = {
        name: bb.getTextNoChildren($root.find('.coupon_header_titles h1')),
        time: bb.getTextNoChildren($root.find('.coupon_header.scrollable .coupon_header_titles .localized-time'))
    };

    function renameMarket(name) {
        return name
            .replace(/([A-z ]*) - ([A-z ]*) - (90 Mins)/gi, '$2')
            .replace(/([A-z ]*) - (90 Mins)/gi, '$1')
            .replace(/Match Betting/gi, 'Match Odds')
            .replace(/Half Time \/ Full Time/gi, 'Half Time/Full Time');
    }

    function renameRunner(marketName, name, home, away) {
        var newName = name
            .replace(/Manchester City/gi, 'Man City')
            .replace(/Manchester Utd/gi, 'Man Utd')
            .replace(/Manchester United/gi, 'Man Utd');
        if (/Correct Score/gi.test(marketName)) {
            newName = bb.normalizeCorrectScore(newName, home, away);
        }
        if (/Half Time\/Full Time/gi.test(marketName)) {
            newName = newName.replace(/ - /gi, '/');
        }
        return newName;
    }

    function isKnownMarket(name) {
        var knownMarkets = ['Match Odds', 'Correct Score', 'Half Time/Full Time', 'Under/Over 2.5 Goals'];
        return knownMarkets.indexOf(name) >= 0;
    }

    var nameRexExp = /([A-z ]*)(.v.)([A-z ]*)/gi;
    home = result.event.name.replace(nameRexExp, '$1');
    away = result.event.name.replace(nameRexExp, '$3');
    result.debug = {
        home: renameRunner('', home),
        away: renameRunner('', away)
    };
    if (!$panels.length) {
        $panels = $();
    }

    result.debug.markets = $panels;

    $panels.each(function() {
        var $market = $(this),
            $marketName = $market.find('h4 span.coupon-title'),
            marketName = renameMarket(bb.getText($marketName));
        if (marketName && isKnownMarket(marketName)) {
            var market = {
                name: marketName,
                debug: $market,
                runners: []
            };
            var singleTable = $market.find('table').length === 1,
                selector = singleTable ? 'table' : 'table.full_list';
            var $runners = $market.find(selector + ' tr.body td.outcome_td');
            $runners.each(function() {
                var $runner = $(this),
                    runnerName = $runner.find('span.out_come.bet').attr('data-outcome_description');
                    runner = {
                        name: renameRunner(marketName, runnerName, home, away),
                        price: bb.getText($runner.find('a span.price'))
                    };
                if (runner.name) {
                    market.runners.push(runner);
                }
            });
            markets.push(market);
        }
    });

    return result;
};