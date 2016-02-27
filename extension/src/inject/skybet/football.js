/**
 * skybet data
 */

if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Sky football)');
    }
    window.bb_getScraperName = 'bb_getSkyFootball';
}

window.bb_getSkyFootball = function() {
    var result = {
            bookies: [{name: 'Sky Bet', markets: []}],
            debug: {
                markets: []
            }
        },
        markets = result.bookies[0].markets,
        $root = $('#content'),
        $panels = $root.find('.mktgrp.mktgrp1'),
        $subtitle = $root.find('.content-head .sub-head'),
        time = getTextNoChildren($subtitle),
        home = '',
        away = '';

    if (!$panels.length) {
        $panels = $root.find('div [data-class-id]');
    }

    function getText($item) {
        return $item.text().trim().replace(/\s*\n\s*/g, ' ');
    }

    function getTextNoChildren($item) {
        return getText($item.clone().children().remove().end());
    }

    function renameMarket(name) {
        return name
            .replace(/Full Time Result/gi, 'Match Odds')
            .replace(/Half-Time\/Full-Time/gi, 'HT / FT');
    }

    function renameRunner(marketName, name, home, away) {
        var newName = name
            .replace(/Manchester City/gi, 'Man City')
            .replace(/Manchester Utd/gi, 'Man Utd')
            .replace(/Sheffield Wednesday/gi, 'Sheff Wed')
            .replace(/Manchester United/gi, 'Man Utd');
        if (/Correct Score/gi.test(marketName)) {
            newName = bb.normalizeCorrectScore(newName, home, away);
            result.debug.markets.push({oldName: name, name: newName, home: home, away: away});
        }
        if (/HT \/ FT/gi.test(marketName)) {
            newName = bb.normalizeHtFt(newName);
        }
        return newName;
    }

    function isKnownMarket(name) {
        var knownMarkets = ['Match Odds', 'Correct Score', 'HT / FT', 'Under/Over 2.5 Goals'];
        return knownMarkets.indexOf(name) >= 0;
    }

    function collectMarkets($parent, selector) {
        var $markets = $parent.find(selector);
        $markets.each(function() {
            var $market = $(this),
                $marketName = $market.find('.section-head'),
                marketName = renameMarket(getTextNoChildren($marketName));
            //result.debug.markets.push(marketName);
            if (marketName && isKnownMarket(marketName)) {
                var market = {
                    name: marketName,
                    runners: []
                };
                var $runners = $market.find('table.mkt td a.oc-odds-desc');
                $runners.each(function() {
                    var $runner = $(this),
                        runner = {
                            name: renameRunner(marketName, getText($runner.find('span.oc-desc')), home, away),
                            price: getText($runner.find('b.odds'))
                        };
                    if (runner.name) {
                        market.runners.push(runner);
                    }
                });
/*
                if (/Correct Score/gi.test(market.name)) {
                    market.runners.sort(function(a, b) {
                        return a > b;
                    });
                }
*/
                markets.push(market);
            }
        });
    }

/*
    var $boost = $('.priceboost-mktgrp');
    result.boostRunner = getRunnerName($boost.find('.oc-runner h4'));
    result.boostPrice = $boost.find('.oc-priceboost .odds').text().trim();
*/
    result.event = {
        name: getText($root.find('.content-head h1')),
        time: time.replace(/([A-Za-z0-9 ]*)\|([A-Za-z0-9 ]*)\| ()/gi, '$3')
    };
    if (!result.event.name) {
        result.event.name = getText($('.breadcrumb-live span.current'));
        result.event.time = 'Live';
    }

    var nameRexExp = /([A-z ]*)(.v.)([A-z ]*)/gi;
    home = renameRunner('', result.event.name.replace(nameRexExp, '$1'));
    away = renameRunner('', result.event.name.replace(nameRexExp, '$3'));
    result.event.name = home + ' v ' + away;
    result.debug.homeOrAway = {
        home: home,
        away: away
    };
    if (!$panels.length) {
        $panels = $();
    }

    $panels.each(function() {
        var $panel = $(this);
        collectMarkets($panel, '.market2-3col');
        collectMarkets($panel, '.market3-2col');
    });

    return result;
};