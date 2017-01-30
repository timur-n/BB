/**
 * Betfair exchange data
 */

if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Betfair exchange)');
    }
    window.bb_getScraperName = 'bb_getBetfairExchange';
}

console.log('Betfair exchange');

window.bb_getBetfairExchange = function(result) {

    var $ = jQuery;
    var bb = window.bb; // defined in inject-lib.js
    var url = document.location.href;

    result = result || {};
    result.event = result.event || {};
    result.markets = result.markets || [{}];
    result.sport = 'Horse racing';
    if (/\/golf\//gi.test(url)) {
        result.sport = 'Golf';
        result.isGolf = true;
    } else if (/\/football\//gi.test(url)) {
        result.sport = 'Football';
        result.isFootball = true;
    }
    var venue = bb.getText($('.event-info .venue-name'));
    var regex = /([0-9:]*)([ A-z]*)([ (A-Z)]*)/gi;
    result.event.name = venue.replace(regex, '$2').trim();
    result.event.time = venue.replace(regex, '$1').trim();
    result.source = "betfair-exchange";
    result.betfair = url;

    var market = result.markets[0];
    market.name = bb.getText($('.generic-tabs-container .generic-tab-selected .market-tab-label'));
    if (!market.name) {
        market.name = bb.getText($('.marketview-header-bottom-container h2.market-type'));
    }
    if (result.isGolf) {
        market.name = market.name.replace(/winner/gi, 'Win').replace(/top 5 finish/gi, 'Place');
    }
    if (result.isFootball) {
        market.name = market.name.replace(/match odds/gi, 'Winner');
    }

    market.runners = [];
    var $runners = $('.mv-runner-list tr');
    $runners.each(function() {
        var $runner = $(this),
            runner = {
                name: bb.getTextNoChildren($runner.find('.runner-name')),
                price: bb.getText($runner.find('.first-lay-cell .bet-button-price')) || NaN,
                size: bb.getText($runner.find('.first-lay-cell .bet-button-size')).replace('£', '')
            };

        if (result.isFootball) {
            runner.name = runner.name
                .replace(/the draw/i, 'Draw')
                .replace(/C Palace/i, 'Crystal Palace');
        }

        if (runner.price !== "0") {
            market.runners.push(runner);
        }
    });

    return result;
};

