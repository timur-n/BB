if (window.bb_getData) {
    throw new Error('Smarkets/football');
}

window.bb_getData = function(result) {
    var $ = jQuery,
        home = $('#masthead span.home').text().trim(),
        away = $('#masthead span.away').text().trim(),
        $time = $('#masthead h2'),
        $time2 = $time.clone(),
        time = $time2.remove('abbr').text().trim(),
        $markets = $('div.module.market');
    result.event = {
        name: home + ' v ' + away,
        time: time
    };
    result.markets = result.markets || [];
    result.debug = {markets: $markets.length};

    $markets.each(function(index) {
        var $market = $(this),
            market = {
                name: $market.find('h3 a.single_market').text().trim(),
                runners: []
            },
            $runners = $market.find('table.market_depth tbody tr');
        $runners.each(function(index){
            var $runner = $(this),
                $price = $runner.find('a.bid.best'),
                runner = {
                    name: $runner.find('th').text().trim(),
                    price: $price.find('.price').text().trim(),
                    size: $price.find('.qty').text().trim()
                };
            if (market.name.match(/Winner/g)) {
                runner.id = (['Home wins', 'Draw', 'Away wins'])[index];
            }
            if (market.name.match(/Correct Score/gi)) {
                if (runner.name.match(/0 \- 0/gi)) {
                    runner.id = '0 - 0';
                }
            }
            market.runners.push(runner);
        });
        result.markets.push(market);
    });

    result.markets.forEach(function(market) {
        if (market.name === 'Winner') {
            market.name = 'Match Odds';
        }
    });

    return result;
};