/**
 * Betred horse odds
 */

if (!window.__karma__) {
    if (window.bb_getScraperName) {
        throw new Error('bb_getScraperName already registered (Betfred horse)');
    }
    window.bb_getScraperName = 'bb_getBetfredHorse';
}

console.log('Betfred horse');

window.bb_getBetfredHorse = function(result) {

    var $ = jQuery;
    var bb = window.bb; // defined in inject-lib.js
    var url = document.location.href;

    var result = {
            bookies: [{name: 'Betfred', markets: []}],
            isDirect: true
        },
        market = {
            name: 'Win',
            runners: []
        };
        $root = $('#sportframe').contents().find('.bonavtmpl .botab').eq(0),
        $racecard = $root.find('div.tbl.racecard'),
        eventText = bb.getText($racecard.find('h4 span:first-child')),
        eventRegex = /([A-z]*)( \d{2}\/\d{2} \()(\d{2}:\d{2})(\))/i,
        eventValues = eventRegex.exec(eventText),
        eventRegexNoDate = /([A-z]*)( )(\d{2}:\d{2})/i,
        eventValuesNoDate = eventRegex.exec(eventText),
        ewText = bb.getText($root.find('.EW')),
        ewRegex = /(EW: 1\/)(\d)(.*)/i,
        ewValues = ewRegex.exec(ewText),
        ewPlaces = ewValues[3].split(',');

    result.event = {
        name: eventValues[1] || eventValuesNoDate[1] || '???',
        time: eventValues[3] || eventValuesNoDate[3] || '00:00'
    };

    if (ewText) {
        result.bookies[0].ew = {
            fraction: ewValues[2],
            places: ewPlaces[ewPlaces.length - 1]
        }        
    }

    result.bookies[0].markets.push(market);
    result.sport = 'Horse racing';


    var $runners = $racecard.find('.racecardpooltab[id*="-win-"] table tbody tr');
    $runners.each(function() {
        var $runner = $(this),
            runner = {
                name: bb.getText($runner.find('td:nth-child(3)')) || '???',
                price: bb.getText($runner.find('td label span')) || NaN
            };

        if (! /(1st|2nd) Favourite/i.test(runner.name)) {
            market.runners.push(runner);
        }
    });

    return result;
};

