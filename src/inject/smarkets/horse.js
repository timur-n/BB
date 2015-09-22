if (window.bb_getData) {
    throw new Error('Smarkets/horse');
}

window.bb_getData = function(result) {
    var $ = jQuery,
        time = false,
        name = $('#masthead h1 a').text().trim(),
        $markets = $('div.module.market');

    result.markets = result.markets || [];
    result.event = {
        name: name,
        time: time
    };

    $markets.each(function(index) {
        var $market = $(this),
            market = {
                name: $market.find('h3 a').text().trim(),
                runners: []
            },
            $runners = $market.find('table.market_depth tbody tr');

        market.name = market.name.replace(/\n/gi, ' ');
        market.name = market.name.replace(/To win/gi, 'Win');

        if (market.name.match(/To place/gi)) {
            //result.lay = result.lay || {ew: {places: '10'}};
            var match = /Top (\d)/g,
                values = match.exec(market.name),
                places = values[1];
            if (places) {
                result.ew = {
                    places: places
                }
            }
        }
        market.name = market.name.replace(/To place.*/gi, 'Place');

        $runners.each(function(){
            var $runner = $(this),
                $price = $runner.find('a.bid.best'),
                runner = {
                    name: $runner.find('th span.name').text().trim(),
                    price: $price.find('.price').text().trim(),
                    size: $price.find('.qty').text().trim()
                };
            runner.name = runner.name.replace(/[0-9]+\. /g, '');
            market.runners.push(runner);
        });

        result.markets.push(market);
    });

    return result;
};

