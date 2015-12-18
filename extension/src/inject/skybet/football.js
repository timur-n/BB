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
            bookies: [{name: 'Sky Bet', markets: []}]
        },
        markets = result.bookies[0].markets;

    function getText($item) {
        return $item.text().trim().replace(/\s*\n\s*/g, ' ');
    }

    function getTextNoChildren($item) {
        return getText($item.clone().children().remove().end());
    }

    function renameMarket(name) {
        return name
            .replace(/Full Time Result/gi, 'Match Odds');
    }

    function isKnownMarket(name) {
        var knownMarkets = ['Match Odds', 'Correct Score', 'Half-Time/Full-Time', 'Under/Over 2.5 Goals'];
        return knownMarkets.indexOf(name) >= 0;
    }

    function collectMarkets($parent, selector) {
        var $markets = $parent.find(selector);
        $markets.each(function() {
            var $market = $(this),
                $marketName = $market.find('.section-head'),
                marketName = renameMarket(getTextNoChildren($marketName));
            if (marketName && isKnownMarket(marketName)) {
                var market = {
                    name: marketName,
                    runners: []
                };
                var $runners = $market.find('table.mkt td a.oc-odds-desc');
                $runners.each(function() {
                    var $runner = $(this),
                        runner = {
                            name: getText($runner.find('span.oc-desc')),
                            price: getText($runner.find('b.odds'))
                        };
                    market.runners.push(runner);
                });
                markets.push(market);
            }
        });
    }

/*
    var $boost = $('.priceboost-mktgrp');
    result.boostRunner = getRunnerName($boost.find('.oc-runner h4'));
    result.boostPrice = $boost.find('.oc-priceboost .odds').text().trim();
*/
    var $root = $('#content'),
        $panels = $root.find('.mktgrp.mktgrp1'),
        time = getTextNoChildren($root.find('.content-head .sub-head'));

    result.event = {
        name: getText($root.find('.content-head h1')),
        time: time.replace(/([A-Za-z0-9 ]*)\|([A-Za-z0-9 ]*)\| ()/gi, '$3')
    };

    $panels.each(function() {
        var $panel = $(this);
        collectMarkets($panel, '.market2-3col');
        collectMarkets($panel, '.market3-2col');
    });

    return result;
};