/**
 * skybet data
 */

if (window.bb_getData) {
    throw new Error('Skybet/horse');
}

window.bb_getData = function() {
    var result = {};
    var $items = $('#racecard-form .js-analytics-openclose'),
        market = {
            name: 'Win',
            runners: []
        };
    $items.each(function(index){
        var $item = $(this),
            name = $item.find('.runner-info h4').clone().children().remove().end().text().trim(),
            odds = $item.find('td.win .odds').text().trim();
        market.runners.push({
            name: name.replace(/\s*\n\s*/g, ' '),
            price: odds
        });
    });
    result.event = {
        name: $('.breadcrumb a[data-analytics*=Event]').text().trim(),
        time: $('.breadcrumb span.strong').text().trim()
    };
    result.bookies = [{name: 'Sky Bet', markets: []}];
    result.bookies[0].markets.push(market);

    var ew = $('.fr.market-note span').text().trim();
    if (ew) {
        var regex = /Each Way: 1\/(\d).*(\d) places/g,
            values = regex.exec(ew);
        result.ew = {
            fraction: values[1],
            places: values[2]
        }
    }

    return result;
};
