if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Oddschecker horse)');
    }
    window.bb_getScraperName = 'bb_getOddschekerHorse';
}

window.bb_getOddschekerHorse = function(result) {
    result = result || {};

    //result.bookies = result.bookies || {};
    var bookies = [],
        bookieHash = {};

    var $ = jQuery,
        $bookies = $('.eventTable .eventTableHeader td aside a'),
        $rows = $('.eventTable .eventTableRow,.eventTable .eventTableRowNonRunner'),
        $ewRow = $('#etfEW td[data-ew-div]');

    result.event = result.event || {};
    result.event.name = bb.getText($('.page-description h1'))
        .replace(/([A-z]*)([ 0-9:]*)([\w ]*)/gi, '$1');
    result.event.time = $('.event li.selected a').text();
    if (!result.event.time) {
        result.event.time = '00:00';
    }
    result.source = "oddschecker";

    $bookies.each(function() {
        var $bookie = $(this);
        var bookieName = $bookie.attr('title') || 'NOT FOUND';
        var bookie = {name: bookieName};
        bookies.push(bookie);
        var bookieId = $bookie.attr('data-bk');
        if (bookieId) {
            bookieHash[bookieId] = bookie;
        }
    });

    $ewRow.each(function() {
        var $ew = $(this);
        var bookieId = $ew.attr('data-bk');
        if (bookieId) {
            var bookie = bookieHash[bookieId];
            if (bookie) {
                bookie.ew = {
                    fraction: $ew.attr('data-ew-div').replace(/(1)\/([0-9])/gi, '$2'),
                    places: $ew.attr('data-ew-places')
                }
            }
        }
    });

    $rows.each(function() {
        var $row = $(this);
        var runnerName = $row.find('td a.selTxt').text().trim();
        //result.debug.runners.push(runnerName);
        var $cells = $row.find('td[data-odig]');
        //result.debug.cells = result.debug.cells || $cells.length;
        if (bookies.length === $cells.length) {
            $cells.each(function(index) {
                var $cell = $(this);
                var price = $cell.text().trim();
                //result.debug.bookies = result.debug.bookies || bookieName;
                //result.debug.bookie = result.debug.bookie || bookie;
                var bookie = bookies[index];
                bookie.markets = bookie.markets || [{name: 'Win', runners: []}];
                var market = bookie.markets[0];
                if (runnerName) {
                    market.runners.push({name: runnerName, price: price});
                }
            });
        } else if (runnerName) {
            throw new Error('Bookies count does not match odds cell count, runner [' + runnerName + ']');
        }
    });

    result.bookies = bookies;
    result.autoReload = 5 * 60 * 1000; // 5 min
    return result;
};
