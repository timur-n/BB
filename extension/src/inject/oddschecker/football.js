if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Oddschecker football)');
    }
    window.bb_getScraperName = 'bb_getOddschekerFootball';
}

window.bb_getOddschekerFootball = function(result) {
    result = result || {};

    //result.bookies = result.bookies || {};
    var bookies = [];

    var $ = jQuery,
        $bookies = $('.eventTable .eventTableHeader td aside a'),
        $rows = $('.eventTable .eventTableRow'),
        $ewRow = $('.eventTable .eventTableFooter');

    // Make array of [Home, Away, MarketName]
    var s = $('.page-description.module h1').text().replace(/([A-Z ]*)( V )([A-Z ]*)( - )([A-Z ]*)( BETTING ODDS)/gi, '$1/$3/$5').split('/');
    var home = s[0],
        away = s[1],
        marketName = s[2];
    result.event = result.event || {};
    result.event.name = home + ' v ' + away;
    result.event.time = $('.page-description.module .event span.date').text().replace(/([A-Za-z0-9 ]*)( \/ )([0-9:]*)/gi, '$3');

    $bookies.each(function() {
        var $bookie = $(this);
        var bookieName = $bookie.attr('title') || 'NOT FOUND';
        bookies.push({name: bookieName});
    });

    $rows.each(function() {
        var $row = $(this);
        var runnerName = $row.find('td a.popup.selTxt').text().trim();
        if (/Correct Score/gi.test(marketName)) {
            runnerName = bb.normalizeCorrectScore(runnerName, home, away);
            //result.debug.markets.push({oldName: name, name: newName, home: home, away: away});
        }
        //result.debug.runners.push(runnerName);
        var $cells = $row.find('td[data-odig]');
        //result.debug.cells = result.debug.cells || $cells.length;
        if (bookies.length !== $cells.length) {
            throw new Error('Bookies count does not match odds cell count, runner [' + runnerName + ']');
        }
        $cells.each(function(index) {
            var $cell = $(this);
            var price = $cell.text().trim();
            //result.debug.bookies = result.debug.bookies || bookieName;
            //result.debug.bookie = result.debug.bookie || bookie;
            var bookie = bookies[index];
            bookie.markets = bookie.markets || [{name: marketName, runners: []}];
            var market = bookie.markets[0];
            if (runnerName) {
                market.runners.push({name: runnerName, price: price});
            }
        });
    });

    result.bookies = bookies;
    return result;
};
