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
