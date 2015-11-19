function calcFreebet(runner, backStake, layCommission) {
    var layCommissionPc = layCommission / 100,
        backReturn = runner.backOdds * backStake,
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