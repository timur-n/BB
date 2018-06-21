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
            <td class="bb-runners__cell">{{runner.backOdds}}</td>
            <td class="bb-runners__cell">{{runner.layOdds}}</td>
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
