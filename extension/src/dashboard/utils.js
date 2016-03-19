angular.module('BBUtils', [])
    .factory('bbUtils', [function() {

        function indexByValue(array, key, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][key] === value) {
                    return i;
                }
            }
            return -1;
        }

        function indexByStr(array, key, value) {
            for (var i = 0; i < array.length; i += 1) {
                var val = array[i][key],
                    all = val && value;
                if (all) {
                    var str1 = val.toString().toLowerCase(),
                        str2 = value.toString().toLowerCase(),
                        stringsMatch = str1 === str2
                    // todo-timur: this doesn't work well for Betfair Sportsbook bookie detection, if finds Betfair instead (exchange)
                    /*|| str1.indexOf(str2) >= 0
                     || str2.indexOf(str1) >= 0*/;
                    if (stringsMatch) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function normalizePrice(price) {
            var parts = ('' + price).split('/');
            var newPrice;
            if (parts.length === 2) {
                newPrice = (((+parts[0]) + (+parts[1])) / parts[1]);
            } else {
                newPrice = (1.0 * price);
            }
            return Math.round(newPrice * 100) / 100;
        }

        return {
            indexByValue: indexByValue,
            indexByStr: indexByStr,
            objByValue: function(array, key, value) {
                var i = indexByValue(array, key, value);
                if (i >= 0) {
                    return array[i];
                }
            },
            objByStr: function(array, key, value) {
                var i = indexByStr(array, key, value);
                if (i >= 0) {
                    return array[i];
                }
            },
            normalizePrice: normalizePrice,
            getPlaceOdds: function(winPrice, ew) {
                return ew && ((normalizePrice(winPrice) * 1.0 - 1) / ew.fraction + 1);
            },
            getMarketIds: function(str) {
                return str.replace(/([a-z./:#-]*market\/)([0-9.]*)([?a-z=0-9]*)/gmi, '$2').replace(/\n/gi, ',');
            },
            getMarketCount: function(str) {
                return this.getMarketIds(str).split(',').length;
            }
        }
    }]);
