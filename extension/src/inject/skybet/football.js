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

    function renameMarket(name) {
        return name
            .replace(/Full Time Result/gi, 'Match Odds')
            .replace(/Half-Time\/Full-Time/gi, 'HT / FT')
            .replace(/Under\/Over/gi, 'Over/Under');
    }

    function renameRunner(marketName, name, home, away) {
        var newName = name
            .replace(/Manchester City/gi, 'Man City')
            .replace(/Manchester Utd/gi, 'Man Utd')
            .replace(/Sheffield Wednesday/gi, 'Sheff Wed')
            .replace(/Manchester United/gi, 'Man Utd');
        if ('HT / FT' === marketName) {
            newName = bb.normalizeHtFt(newName);
        }
        return newName;
    }

    function isKnownMarket(name) {
        var knownMarkets = ['Match Odds', 'Correct Score', 'HT / FT', 'Over/Under 2.5 Goals'];
        return knownMarkets.indexOf(name) >= 0;
    }

    result.event = {
        name: getText($root.find('.content-head h1')),
        time: time.replace(/([A-Za-z0-9 ]*)\|([A-Za-z0-9 ]*)\| ()/gi, '$3')
    };
    if (!result.event.name) {
        result.event.name = getText($('.breadcrumb-live span.current'));
        result.event.time = 'Live';
    }

    var nameRexExp = /([A-z ]*)(\sv\s)([A-z ]*)/i;
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