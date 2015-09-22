/**
 * skybet data
 */

window.horse1 = function(result) {
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
    result.markets = result.markets || [];
    result.markets.push(market);

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

function horseAll(result) {

    function day(dayName, dayDate) {
        result.debug.days.push(dayName); //debug
        var $day = $('#cal-tab-' + dayName),
            $tracks = $day.find('.js-calendar-sort-meeting .calendar-event');
        $tracks.each(function(index) {
            var $track = $(this),
                trackName = $.trim($track.find('.start a').text()),
                $items = $track.find('.js-calendar-row');
            $items.each(function(index) {
                var $item = $(this),
                    $a = $item.find('a.js-calendar-event-link'),
                    url = $a.attr('href'),
                    time = $.trim($a.text()),
                    name = $.trim($item.find('span.additional-link strong').text());
                result.events.push({
                    date: normalizeDate(new Date(dayDate)),
                    index: index,
                    time: time,
                    name: trackName,
                    url: 'http://www.skybet.com' + url,
                    promo: name
                });
            });
        });
    }

    function getMonday(d) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    var days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        startDate = new Date(),
        monday = getMonday(new Date());

    result.events = result.events || [];
    result.debug = {days: []};

    // Today and 6 days ahead
    day('today', startDate);
    for (var i = 1; i < 7; i += 1) {
        var dayDate = addDays(startDate, i),
            nameIndex = dayDate.getDay();
        day(days[nameIndex], dayDate);
    }

    return result;
}
