(function() {

    angular.module('bb.known-bookies', [])
        .provider('KnownBookies', function() {
            this.$get = function() {
                return [
                    {name: 'Bet 365', short: 'B365'},
                    {name: 'Sky Bet', short: 'Sky'},
                    //{name: 'Ladbrokes', short: 'Lads'},
                    {name: 'Betfair Sportsbook', short: 'BFSB'},
                    {name: 'Betfred', short: 'Bfr'},
                    {name: 'Totesport', short: 'Tote'},
                    {name: 'Paddy Power', short: 'Paddy'},
                    {name: 'Bet Victor', short: 'BVic'},
                    {name: 'Coral', short: 'Coral'},
                    //{name: 'Boylesports', short: 'Boyle'},
                    // {name: 'Winner', short: 'Winner'},
                    {name: 'William Hill', short: 'WH'},
                    {name: '188Bet', short: 'b188'},
                    {name: 'Betstars', short: 'Betstars'},
                    // {name: '32Red Bet', short: 'r32'},
                    {name: 'Betway', short: 'bw'},
                    {name: 'Black Type', short: 'bt'}
                ];
            }
        });

    angular.module('bb.runners', [
        "ngMaterial",
        "bb.known-bookies",
    ])
    .component('bbRunners', {
        bindings: {
            runners: "<",
            bookies: "<",
            totals: "<",
        },
        template: `
<table class="bb-runners__table">
    <thead>
        <tr class="bb-runners__header">
            <th rowspan="2">Runners <span class="badge">{{$ctrl.runners.length}}</span></th>
            <th rowspan="2" ng-repeat="knownBookie in $ctrl.knownBookies" class="bookie-header" ng-class="{greyed: knownBookie.disabled}">
                <div class="bookie" ng-class="knownBookie.short" ng-click="$ctrl.toggleBookie(knownBookie)"></div>
            </th>
            <th rowspan="2">Stake</th>
            <th colspan="5">Win</th>
            <th colspan="5">Place</th>
            <th colspan="2">Total</th>
        </tr>
        <tr>
            <th>Back<md-tooltip>Back odds</md-tooltip></th>
            <th>Lay<md-tooltip>Lay odds</md-tooltip></th>
            <th>Stake<md-tooltip>Lay stake</md-tooltip></th>
            <th>Liab<md-tooltip>Liability</md-tooltip></th>
            <th>P/L<md-tooltip>Profit/Loss</md-tooltip></th>
            <th>Back<md-tooltip>Back odds</md-tooltip></th>
            <th>Lay<md-tooltip>Lay odds</md-tooltip></th>
            <th>Stake<md-tooltip>Lay stake</md-tooltip></th>
            <th>Liab<md-tooltip>Liability</md-tooltip></th>
            <th>P/L<md-tooltip>Profit/Loss</md-tooltip></th>
            <th>Liab<md-tooltip>Liability</md-tooltip></th>
            <th>P/L<md-tooltip>Profit/Loss</md-tooltip></th>
        </tr>
        <tr class="ew-terms">
            <td>Each way terms</td>
            <td ng-repeat="bookie in $ctrl.bookies track by $index" class="ew-terms">
                <p class="ew-places">{{bookie.ew.places}}</p>
                <p class="ew-fraction">1/{{bookie.ew.fraction}}</p>
            </td>
            <td colspan="3"></td>
            <td></td>
            <td>{{$ctrl.totals.win.liability | number:2}}</td>
            <td>{{$ctrl.totals.win.profit | number:2}}</td>
            <td colspan="2"></td>
            <td></td>
            <td>{{$ctrl.totals.place.liability | number:2}}</td>
            <td>{{$ctrl.totals.place.profit | number:2}}</td>
            <td>{{$ctrl.totals.liability | number:2}}</td>
            <td class="profit" ng-class="{green: $ctrl.totals.isProfit, yellow: $ctrl.totals.isOk}">
                {{$ctrl.totals.profit | number:2}}
            </td>
        </tr>
    </thead>
    <tbody>
        <tr class="bb-runners__row"
            ng-repeat="runner in $ctrl.runners"
            ng-class="{disabled: runner.disabled}"
        >
            <td class="bb-runners__cell bb-runners__name" ng-click="$ctrl.click()">{{runner.name}}</td>
            <td class="bb-runners__cell bb-runners__price" ng-repeat="bookie in runner.bookies track by $index"
                ng-class="{'subtle': !bookie.isBest || bookie.disabled, selected: bookie.isSelected}"
            >
                <a ng-click="runner.toggle(bookie)">{{bookie.backOdds}}</a>
            </td>
            <td>
                <md-input-container class="bb-runners__input-container">
                    <input class="bb-runners__stake-input" type="number" ng-model="runner.stake">
                </md-input-container>
            </td>
            <td class="bb-runners__cell back-odds" ng-class="{locked: runner.isLocked('winBack')}">
                <input type="number" ng-model="runner.backOdds" maxlength="4" ng-show="runner.isLocked('winBack')">
                <span class="back-odds-readonly" ng-show="!runner.isLocked('winBack')">{{runner.backOdds|number:2}}</span>
                <a ng-click="runner.toggleLock('winBack')"><i class="fa fa-lock"></i></a>
            </td>
            <td class="lay-odds" ng-class="{locked: runner.isLocked('winLay')}">
                <input type="number" ng-model="runner.layOdds" maxlength="4" ng-show="runner.isLocked('winLay')">
                <span class="lay-odds-readonly" ng-show="!runner.isLocked('winLay')">{{runner.layOdds}}</span>
                <sub class="lay-size">{{runner.size | number:0}}</sub>
                <div class="bb-runners__lock-btn">
                    <md-button class="md-icon-button" ng-click="runner.toggleLock('winLay')">
                        <i class="fa fa-lock"></i>
                        <md-tooltip>Lock value</md-tooltip>
                    </md-button>
                </div>
            </td>
            <td>{{runner.result.win.layStake | number:2}}</td>
            <td class="liability">{{runner.result.win.liability | number:2}}</td>
            <td>{{runner.result.win.lostProfit | number:2}}</td>
            <td class="back-odds" ng-class="{locked: runner.isLocked('winBack')}">{{runner.place.backOdds}}</td>
            <td class="lay-odds" ng-class="{locked: runner.isLocked('placeLay')}">
                <input type="number" ng-model="runner.place.layOdds" maxlength="4" ng-show="runner.isLocked('placeLay')">
                <span class="lay-odds-readonly" ng-show="!runner.isLocked('placeLay')">{{runner.place.layOdds}}</span>
                <sub class="lay-size">{{runner.place.size | number:0}}</sub>
                <a ng-click="runner.toggleLock('placeLay')"><i class="fa fa-lock"></i></a>
            </td>
            <td>{{runner.result.place.layStake | number:2}}</td>
            <td class="liability">{{runner.result.place.liability | number:2}}</td>
            <td>{{runner.result.place.lostProfit | number:2}}</td>
            <td class="liability">{{runner.result.liability | number:2}}</td>
            <td class="profit" ng-click="runner.toggleRunner()" ng-class="{green: runner.result.isProfit, yellow: runner.result.isOk}">{{runner.result.lostProfit | number:2}} ({{runner.result.profit | number:2}})</td>
        </tr>
    </tbody>
`,
        controller: function(
            $window,
            KnownBookies,
        ) {
            this.knownBookies = [...KnownBookies];

            this.toggleBookie = knownBookie => {
                knownBookie.disabled = !knownBookie.disabled;
                this.runners.forEach(runner => {
                    runner.bookies
                        .filter(bookie => bookie.name.toLowerCase() === knownBookie.name.toLowerCase())
                        .forEach(bookie => bookie.disabled = knownBookie.disabled);
                });
            };
        },
    });
})();
