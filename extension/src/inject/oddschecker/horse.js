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

    var bb = window.bb; // defined in inject-lib.js
    var $ = jQuery,
        $bookies = $('.eventTable .eventTableHeader td aside a'),
        $rows = $('#oddsTableContainer .evTabRow'),
        $ewRow = $('#etfEW td[data-ew-div]');

    result.event = result.event || {};
    result.event.name = bb.getText($('.left-if-has-race-info h1'))
        .replace(/(monday|tuesday|wendesday|thursday|friday|saturday|sunday)/gi, '')
        .replace(/ winner betting odds/gi, '')
        .replace(/[0-9:]*/gi, '')
        .trim();
    result.event.time = $('.left-if-has-race-info .beta-caption5').text();
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
                    fraction: $ew.attr('data-ew-div').replace(/(1)\/([0-9])/gi, '$2') || '100',
                    places: $ew.attr('data-ew-places') || '1'
                }
            }
        }
    });

    result.debug = result.debug || {runners: []};
    result.debug.rows = $rows.length;
    $rows.each(function() {
        var $row = $(this);
        var runnerName = bb.getTextNoChildren($row.find('td a.selTxt'));
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
    result.test = "Test";
    return result;
};
