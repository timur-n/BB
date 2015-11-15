if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Oddschecker)');
    }
    window.bb_getScraperName = 'bb_getOddscheker';
}

window.bb_getOddscheker = function(result) {
    result = result || {};

    //result.bookies = result.bookies || {};
    var bookies = [];

    var $ = jQuery,
        $bookies = $('.eventTable .eventTableHeader td aside a'),
        $rows = $('.eventTable .eventTableRow'),
        $ewRow = $('.eventTable .eventTableFooter');

    result.event = result.event || {};
    result.event.name = $('.nav-popout.selected').clone().children().remove().end().text();
    result.event.time = $('.event li.selected a').text();

    $bookies.each(function() {
        var $bookie = $(this);
        var bookieName = $bookie.attr('title') || 'NOT FOUND';
        bookies.push({name: bookieName});
    });

    $rows.each(function() {
        var $row = $(this);
        var runnerName = $row.find('td a.popup.selTxt').text().trim();
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
            bookie.markets = bookie.markets || [{name: 'Win', runners: []}];
            var market = bookie.markets[0];
            market.runners.push({name: runnerName, price: price});
        });
    });

    result.bookies = bookies;
    return result;
};