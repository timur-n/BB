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

    result = result || {};
    result.event = result.event || {};
    result.markets = result.markets || [{}];
    result.debug = {
        url: document.location.href
    };
    var venue = bb.getText($('.event-info .venue-name'));
    var regex = /([0-9:]*)([ A-z]*)([ (A-Z)]*)/gi;
    result.event.name = venue.replace(regex, '$2').trim();
    result.event.time = venue.replace(regex, '$1').trim();
    result.source = "betfair-exchange";

    var market = result.markets[0];
    market.name = bb.getText($('.generic-tabs-container .generic-tab-selected .market-tab-label'));
    if (!market.name) {
        market.name = bb.getText($('.marketview-header-bottom-container h2.market-type'));
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

        if (runner.price !== "0") {
            market.runners.push(runner);
        }
    });

    return result;
};

