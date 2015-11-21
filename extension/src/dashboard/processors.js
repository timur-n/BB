angular.module('BBProcessors', [])
    .factory('bbProcessors', ['$log', function($log) {

        function calcQualifier(runner, backStake, layCommission) {

            var layCommissionPc = layCommission / 100,
                backReturn = runner.backOdds * backStake,
                result = {
                    backStake: backStake,
                    profit: NaN,
                    isProfit: false,
                    valid: true
                };

            // Lay stake, convert to fixed immediately to match betfair's numbers
            result.layStake = backReturn / (runner.layOdds - layCommissionPc);
            result.layStake = result.layStake.toFixed(2);

            // Lay risk (liability)
            result.liability = result.layStake * (runner.layOdds - 1);
            result.liability = result.liability.toFixed(2);

            // Profit/Loss
            result.profit = backReturn - result.liability - backStake;

            result.isProfit = result.profit >= 0;
            result.isOk = !result.isProfit && (Math.abs(result.profit) / backStake < 0.1);

            return result;
        }


        function calcFreebet(runner, backStake, layCommission) {
            var layCommissionPc = layCommission / 100,
                result = {
                    backStake: backStake,
                    profit: NaN,
                    isProfit: false,
                    valid: true
                };

            var backReturnSNR = (runner.backOdds - 1) * backStake;

            result.layStake = backReturnSNR / (runner.layOdds - layCommissionPc);
            result.layStake = result.layStake.toFixed(2);

            // Lay risk (liability)
            result.liability = result.layStake * (runner.layOdds - 1);
            result.liability = result.liability.toFixed(2);

            // Profit/Loss
            result.backProfit = backReturnSNR - result.liability;
            result.layProfit = result.layStake * (1 - layCommissionPc);
            result.profit = result.backProfit;

            result.isProfit = false;
            result.isOk = false;

            return result;
        }

        function backWinner(runner, backStake, layCommission, options) {
            var result = calcQualifier(runner, backStake, layCommission);
            var backWinnerOdds = (options.backWinnerTerms || 10000) + 1;
            if (runner.backOdds < backWinnerOdds) {
                result.profit = NaN;
                result.isProfit = false;
                result.isOk = false;
            }
            return result;
        }

        function calcEachWay(runner, backStake, layCommission, options) {
            var winResult = calcQualifier(runner, backStake, layCommission),
                placeResult = {profit: NaN};
            if (runner.place) {
                placeResult = calcQualifier(runner.place, backStake, 5); // todo-timur: betfair only?
            }
            var result = {
                win: winResult,
                place: placeResult,
                profit: winResult.profit + placeResult.profit
            };
            result.isProfit = result.profit >= 0;
            return result;
        }

        return {
            qualifier: calcQualifier,
            freeSnr: calcFreebet,
            backWinner: backWinner,
            eachWay: calcEachWay
        };
    }]);
