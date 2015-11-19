function backWinner(runner, backStake, layCommission, options) {
    var result = calcQualifier(runner, backStake, layCommission);
    var backWinnerOdds = (options.backWinnerTerms || 10000) + 1;
    if (runner.backOdds < backWinnerOdds) {
        result.profit = NaN;
        result.isProfit = false;
        result.isOk = false;
    }
}