//var https = require('https'),
    // This is my fixed Betfair AppID
var BetfairAppID = 'Zn8PUTbCvmwDw1RX',
    eventTypes = {
        football: '1',
        horseRaces: '7'
    },
    knownHorseMarketNames = ['Each Way', 'To Be Placed'],
    debug = false;

// todo-timur:
function debugLog() {

}

function param(object) {
    var encodedString = '';
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            if (encodedString.length > 0) {
                encodedString += '&';
            }
            encodedString += encodeURI(prop + '=' + object[prop]);
        }
    }
    return encodedString;
}

/**
 * Request data from Betfair via HTTP
 * @param options
 * @param data
 * @param done
 * @returns {*}
 */
function request(options, data, done) {
    if (debug) {
        console.log('AJAX send', options, data);
    }
    var xhr = new XMLHttpRequest();
    var doneFunc = function(obj) {
        if (done) {
            done(obj);
        }
    };

    xhr.open(options.method || 'GET', encodeURI('https://' + options.url));
    for (var prop in options.headers) {
        if (options.headers.hasOwnProperty(prop)) {
            xhr.setRequestHeader(prop, options.headers[prop]);
        }
    }
    xhr.onload = function() {
        if (xhr.status === 200) {
            if (debug) {
                console.log('AJAX success', xhr.responseText);
            }
            try {
                var json = JSON.parse(xhr.responseText);
                doneFunc(json);
            } catch (e) {
                doneFunc({error: e});
            }
        } else {
            if (debug) {
                console.log('AJAX failed', xhr.status);
            }
            doneFunc({error: xhr.status});
        }
    };
    if (options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
        xhr.send(param(data));
    } else {
        xhr.send(JSON.stringify(data));
    }
}

/**
 * Special options for Betrair HTTP requests
 * @param url
 * @param sessionToken
 * @returns {object}
 */
function createOptions(url, sessionToken) {
    return {
        url: url,
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'X-Authentication': sessionToken,
            'X-Application': BetfairAppID,
            //'Access-Control-Allow-Origin': '',
            'Content-Type': 'application/json'
        }
    };
}

function post(cmd, data, done) {
    var options = createOptions('identitysso.betfair.com/api/' + cmd);
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    request(options, data, done);
}

function callApi(sessionToken, cmd, data, done) {
    var options = createOptions('api.betfair.com/exchange/betting/rest/v1.0/' + cmd + '/', sessionToken);
    if (debug) {
        console.log('betfair.callApi()', options.url, sessionToken, data);
    }
    request(options, data, done);
}

function matchMarketsAndPrices(markets, prices) {
    var result = {
        markets: [],
        debug: {
            markets: markets,
            prices: prices
        }
    };

    function find(array, callback) {
        var found = array.filter(callback);
        return found.length === 1 ? found[0] : undefined;
    }

    function findMarket(marketId) {
        return find(markets, function(market) {
            return market.marketId === marketId;
        });
    }

    function findRunner(marketInfo, selectionId) {
        return find(marketInfo.runners, function(runner) {
            return runner.selectionId === selectionId;
        });

    }

    if (Array.isArray(markets) && Array.isArray(prices)) {
        prices.forEach(function (marketData) {
            var marketId = marketData.marketId,
                marketInfo = findMarket(marketId);
            if (marketInfo) {
                var m = {
                    event: marketInfo.event,
                    eventType: marketInfo.eventType,
                    marketId: marketId,
                    marketName: marketInfo.marketName,
                    marketStartTime: marketInfo.marketStartTime,
                    lastMatchTime: marketData.lastMatchTime,
                    runners: []
                };

                if (Array.isArray(marketData.runners)) {
                    marketData.runners.forEach(function (runner) {
                        var marketRunner = findRunner(marketInfo, runner.selectionId),
                            availableToLay = runner.ex && runner.ex.availableToLay,
                            price = '?',
                            size = '?';
                        if (Array.isArray(availableToLay) && availableToLay.length) {
                            availableToLay = availableToLay[0];
                            price = availableToLay.price;
                            size = availableToLay.size;
                        }
                        if (marketRunner) {
                            var r = {
                                    name: marketRunner.runnerName,
                                    price: price,
                                    size: size
                                };
                            m.runners.push(r);
                        }
                    });
                }
                result.markets.push(m);
            }
        });
    }

    return result;
}

function createBetfair() {

    function getMarketUrl(eventTypeId, marketId) {
        switch (eventTypeId + '') {
            case eventTypes.football:
                return 'www.betfair.com/exchange/football/market?id=' + marketId;
            case eventTypes.horseRaces:
                return 'www.betfair.com/exchange/horseracing/#/market/' + marketId;
            default:
                return '?';
        }
    }


    var betfair = {};

    betfair.loggedOn = false;

    betfair.login = function(done) {
        var loginData = {
            username: 'timurn',
            password: 'pkLcHiBjbZ4HFslGyW4z'
        };
        var loginDone = function(data) {
            if (data.status === 'SUCCESS') {
                betfair.loggedOn = true;
                betfair.sessionToken = data.token;
            }
            console.log('Betfair login done, sessionToken: ', betfair.sessionToken);
            done(data);
        };

        post('login', loginData, loginDone);
    };

    betfair.logout = function(done) {
        //callSso('logout', this.sessionToken, false, done);
    };

    betfair.call = function(cmd, params, done) {

        function func() {
            callApi(betfair.sessionToken, cmd, params, done);
        }

        function loginDone(data) {
            func();
        }

        if (this.loggedOn) {
            func();
        } else {
            this.login(loginDone);
        }
    };

    betfair.test = function(done) {
        var params = {
                    filter: {}
                };
        this.call('listEventTypes', params, done);
    };

    function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function getMarketTypeCodes(eventTypeId) {
        switch (eventTypeId + '') {
            case eventTypes.football:
                return ['CORRECT_SCORE_NEW'];
            case eventTypes.horseRaces:
                return ['WIN', 'PLACE'];
            default:
                return void 0
        }
    }

    function renameMarket(market) {
        if (market.eventType && market.eventType.id === eventTypes.horseRaces) {
            if (market.marketName === 'To Be Placed') {
                return 'Place';
            } else if (/[1-9] TBP/gi.test(market.marketName)) {
                return 'Place';
            } else if (market.marketName === 'Each Way') {
                return market.marketName;
            } else {
                return 'Win';
            }
        }
        return market.name;
    }

    betfair.getPrices = function(params, done) {
        var marketData,
            marketParams = {
                filter: {},
                marketProjection: [
                    'EVENT',
                    'EVENT_TYPE',
                    'MARKET_START_TIME',
                    'RUNNER_DESCRIPTION'
                ],
                maxResults: 200
            };

        if (params.marketIds) {
            marketParams.filter = {
                marketIds: params.marketIds.split(',')
            }
        } else {
            var today = new Date(),
                fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                toDate = addDays(fromDate, 2);

            marketParams.filter = {
                textQuery: params.event.name,
                eventTypeIds: [
                    params.event.typeId
                ],
                marketStartTime: {
                    from: fromDate,
                    to: toDate
                },
                marketTypeCodes: getMarketTypeCodes(params.event.typeId)
            }
        }

        function lmcDone(data) {
            marketData = data;
            if (data.length) {
                var marketIds = data.map(function (item) {
                        return item.marketId;
                    }),
                    priceParams = {
                        marketIds: marketIds,
                        priceProjection: {
                            priceData: ['EX_BEST_OFFERS']
                        }
                    };
                betfair.call('listMarketBook', priceParams, lmbDone);
            } else {
                lmbDone({error: data});
            }
        }

        function lmbDone(priceData) {
            var result = matchMarketsAndPrices(marketData, priceData);
            result.markets.forEach(function(market) {
                market.name = renameMarket(market);
                if (market.event && market.eventType) {
                    market.url = getMarketUrl(market.eventType.id, market.marketId);
                }
            });
            done(result);
        }

        betfair.call('listMarketCatalogue', marketParams, lmcDone);
    };

    betfair.matchMarketsAndPrices = matchMarketsAndPrices;
    betfair.getMarketUrl = getMarketUrl;

    betfair.getMarketPrices = function(marketIds, done) {
        betfair.getPrices({marketIds: marketIds}, done);
    };

    return betfair;
}