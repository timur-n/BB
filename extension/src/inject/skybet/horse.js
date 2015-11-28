/**
 * skybet data
 */

if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Sky horse)');
    }
    window.bb_getScraperName = 'bb_getSkyHorse';
}

window.bb_getSkyHorse = function() {
    var result = {};

    var $items = $('#racecard-form .js-analytics-openclose'),
        market = {
            name: 'Win',
            runners: []
        };

    function getRunnerName($item) {
        return $item.clone().children().remove().end().text().trim().replace(/\s*\n\s*/g, ' ');
    }

    var $boost = $('.priceboost-mktgrp');
    result.boostRunner = getRunnerName($boost.find('.oc-runner h4'));
    result.boostPrice = $boost.find('.oc-priceboost .odds').text().trim();

    $items.each(function(index){
        var $item = $(this),
            name = getRunnerName($item.find('.runner-info h4')),
            odds = $item.find('td.win .odds').text().trim();
        if (name === result.boostRunner) {
            odds = result.boostPrice;
        }
        if (!name.match(/Unnamed [2nd ]*favourite/gi)) {
            market.runners.push({
                name: name,
                price: odds
            });
        }
    });

    var time = $('.breadcrumb span.strong').text().trim().split(':');
    time[0] *= 1;
    if (time[0] < 10) {
        time[0] += 12;
    }
    time[0] += '';
    result.event = {
        name: $('.breadcrumb a[data-analytics*=Event]').text().trim(),
        time: time.join(':')
    };
    result.bookies = [{name: 'Sky Bet', markets: []}];
    result.bookies[0].markets.push(market);

    var ew = $('.fr.market-note span').text().trim();
    if (ew) {
        var regex = /Each Way: 1\/(\d).*(\d) places/g,
            values = regex.exec(ew);
        result.bookies[0].ew = {
            fraction: values[1],
            places: values[2]
        }
    }

    return result;
};
