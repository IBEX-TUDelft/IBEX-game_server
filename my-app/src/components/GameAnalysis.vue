<template>
    <div>
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ ruleset }}</b-nav-item>
                </b-navbar-nav>
                <div class="container justify-content-center">
                    <b-navbar-brand>
                        Results Overview
                    </b-navbar-brand>
                </div>
                <b-navbar-nav class="ml-auto">
                    <!--b-nav-item active v-if="game.phase === 6">Balance: {{ player.balance }}</b-nav-item>
                    <b-nav-item active v-if="game.phase === 6">Shares: {{ player.shares }}</b-nav-item>
                    <b-nav-item active >Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active >Phase: {{ game.phase }}</b-nav-item-->
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div class="mt-1 mx-5 mp-1">
            <div class="row">
                <div class="col-11" />
                <div class="col-1">
                    <button :disabled="false" class="btn btn-success" @click="exportXlsx">Export</button>
                </div>
            </div>
            <div class="row">
                <div class="text-center"><b>First Declarations</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Player</th>
                        <th scope="col">Status Quo Value</th>
                        <th scope="col">Project A Value</th>
                        <th scope="col">Project B Value</th>
                        <th scope="col">Status Quo Declaration</th>
                        <th scope="col">Project A Declaration</th>
                        <th scope="col">Project B Declaration</th>
                        <th scope="col">Status Quo Taxes</th>
                        <th scope="col">Project A Taxes</th>
                        <th scope="col">Project B Taxes</th>
                    </thead>
                    <tbody>
                        <tr v-for="d in firstDeclarations" :key="d.id">
                            <td>{{ getPlayer(d.player, d.role) }}</td>
                            <td>{{ formatNumber(getValue(d, 'value', 0)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'value', 1)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'value', 2)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'declaration', 0)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'declaration', 1)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'declaration', 2)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'taxes', 0)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'taxes', 1)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'taxes', 2)) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>Winning Condition</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Status Quo Value</th>
                        <th scope="col">Project A Value</th>
                        <th scope="col">Project B Value</th>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{{ getWinningCondition(0) }}</td>
                            <td>{{ getWinningCondition(1) }}</td>
                            <td>{{ getWinningCondition(2) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>Signals (Winning Conditions Only)</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Public</th>
                        <th scope="col">Private #1</th>
                        <th scope="col">#2</th>
                        <th scope="col">#3</th>
                        <th scope="col">#4</th>
                        <th scope="col">#5</th>
                        <th scope="col">#6</th>
                        <th scope="col">#7</th>
                        <th scope="col">#8</th>
                        <th scope="col">#9</th>
                        <th scope="col">#10</th>
                        <th scope="col">#11</th>
                        <th scope="col">#12</th>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{{ signals != null ? formatNumber(signals.publicSignal) : '-' }}</td>
                            <td>{{ getPrivateSignal(0) }}</td>
                            <td>{{ getPrivateSignal(1) }}</td>
                            <td>{{ getPrivateSignal(2) }}</td>
                            <td>{{ getPrivateSignal(3) }}</td>
                            <td>{{ getPrivateSignal(4) }}</td>
                            <td>{{ getPrivateSignal(5) }}</td>
                            <td>{{ getPrivateSignal(6) }}</td>
                            <td>{{ getPrivateSignal(7) }}</td>
                            <td>{{ getPrivateSignal(8) }}</td>
                            <td>{{ getPrivateSignal(9) }}</td>
                            <td>{{ getPrivateSignal(10) }}</td>
                            <td>{{ getPrivateSignal(11) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>First Snipes</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Player</th>
                        <th scope="col">Target</th>
                        <th scope="col">Status Quo</th>
                        <th scope="col">Project A</th>
                        <th scope="col">Project B</th>
                        <th scope="col">Snipe Executed</th>
                    </thead>
                    <tbody>
                        <tr v-for="f in firstSnipes" :key="f.id">
                            <td>{{ getPlayer(f.player.number, f.player.role) }}</td>
                            <td>{{ getPlayer(f.target.number, f.target.role) }}</td>
                            <td>{{ getYesOrNo(f.snipes[0]) }}</td>
                            <td>{{ getYesOrNo(f.snipes[1]) }}</td>
                            <td>{{ getYesOrNo(f.snipes[2]) }}</td>
                            <td>{{ getYesOrNo(f.executed) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>First Snipes Results</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Player</th>
                        <th scope="col">Target</th>
                        <th scope="col">Profit</th>
                    </thead>
                    <tbody>
                        <tr v-for="f in firstSnipeResults" :key="f.id">
                            <td>{{ getPlayer(f.player.number, f.player.role) }}</td>
                            <td>{{ getPlayer(f.target.number, f.target.role) }}</td>
                            <td>{{ formatNumber(f.profit) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>Second Declarations</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Player</th>
                        <th scope="col">Status Quo Value</th>
                        <th scope="col">Project A Value</th>
                        <th scope="col">Project B Value</th>
                        <th scope="col">Status Quo Declaration</th>
                        <th scope="col">Project A Declaration</th>
                        <th scope="col">Project B Declaration</th>
                        <th scope="col">Status Quo Taxes</th>
                        <th scope="col">Project A Taxes</th>
                        <th scope="col">Project B Taxes</th>
                    </thead>
                    <tbody>
                        <tr v-for="d in secondDeclarations" :key="d.id">
                            <td>{{ getPlayer(d.player, d.role) }}</td>
                            <td>{{ formatNumber(getValue(d, 'value', 0)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'value', 1)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'value', 2)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'declaration', 0)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'declaration', 1)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'declaration', 2)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'taxes', 0)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'taxes', 1)) }}</td>
                            <td>{{ formatNumber(getValue(d, 'taxes', 2)) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>Second Snipes</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Player</th>
                        <th scope="col">Target</th>
                        <th scope="col">Status Quo</th>
                        <th scope="col">Project A</th>
                        <th scope="col">Project B</th>
                        <th scope="col">Snipe Executed</th>
                    </thead>
                    <tbody>
                        <tr v-for="f in secondSnipes" :key="f.id">
                            <td>{{ getPlayer(f.player.number, f.player.role) }}</td>
                            <td>{{ getPlayer(f.target.number, f.target.role) }}</td>
                            <td>{{ getYesOrNo(f.snipes[0]) }}</td>
                            <td>{{ getYesOrNo(f.snipes[1]) }}</td>
                            <td>{{ getYesOrNo(f.snipes[2]) }}</td>
                            <td>{{ getYesOrNo(f.executed) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="row">
                <div class="text-center"><b>Second Snipes Results</b></div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <th scope="col">Player</th>
                        <th scope="col">Target</th>
                        <th scope="col">Profit</th>
                    </thead>
                    <tbody>
                        <tr v-for="f in secondSnipeResults" :key="f.id">
                            <td>{{ getPlayer(f.player.number, f.player.role) }}</td>
                            <td>{{ getPlayer(f.target.number, f.target.role) }}</td>
                            <td>{{ formatNumber(f.profit) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script>
    import XLSX from 'xlsx';

    const roleMap = {
        1: "Sniper",
        2: "Developer",
        3: "Owner"
    };

    const conditionMap = {
        0: "No Project",
        1: "Project A",
        2: "Project B",
    }

    export default {
        data() {
            return {
                gameId: null,
                ruleset: null,
                firstDeclarations: [],
                signals: null,
                winningCondition: null,
                firstSnipes: [],
                firstSnipeResults: [],
                secondDeclarations: [],
                secondSnipes: [],
                secondSnipeResults: [],
            };
        },
        components: {
        },
        name: 'GameAnalysis',
        created() {
        },
        methods: {
            exportXlsx() {
                const self = this;

                const xls = [];

                xls.push(['First Declarations']);

                xls.push([
                    'Player',
                    'Status Quo Value',
                    'Project A Value',
                    'Project B Value',
                    'Status Quo Declaration',
                    'Project A Declaration',
                    'Project B Declaration',
                    'Status Quo Taxes',
                    'Project A Taxes',
                    'Project B Taxes'
                ]);

                this.firstDeclarations.forEach(d => {
                    xls.push([
                        self.getPlayer(d.player, d.role),
                        self.formatNumber(self.getValue(d, 'value', 0)),
                        self.formatNumber(self.getValue(d, 'value', 1)),
                        self.formatNumber(self.getValue(d, 'value', 2)),
                        self.formatNumber(self.getValue(d, 'declaration', 0)),
                        self.formatNumber(self.getValue(d, 'declaration', 1)),
                        self.formatNumber(self.getValue(d, 'declaration', 2)),
                        self.formatNumber(self.getValue(d, 'taxes', 0)),
                        self.formatNumber(self.getValue(d, 'taxes', 1)),
                        self.formatNumber(self.getValue(d, 'taxes', 2))
                    ]);
                });

                xls.push([]);

                xls.push(['Winning Condition']);

                xls.push([
                    'Status Quo Value',
                    'Project A Value',
                    'Project B Value'
                ]);

                xls.push([
                    self.getWinningCondition(0),
                    self.getWinningCondition(1),
                    self.getWinningCondition(2)
                ]);

                xls.push([]);

                xls.push(['Signals (Winning Conditions Only)']);

                xls.push([
                    'Public',
                    'Private #1',
                    '#2',
                    '#3',
                    '#4',
                    '#5',
                    '#6',
                    '#7',
                    '#8',
                    '#9',
                    '#10',
                    '#11',
                    '#12'
                ]);

                xls.push([
                    this.signals != null ? self.formatNumber(this.signals.publicSignal) : '-',
                    self.getPrivateSignal(0),
                    self.getPrivateSignal(1),
                    self.getPrivateSignal(2),
                    self.getPrivateSignal(3),
                    self.getPrivateSignal(4),
                    self.getPrivateSignal(5),
                    self.getPrivateSignal(6),
                    self.getPrivateSignal(7),
                    self.getPrivateSignal(8),
                    self.getPrivateSignal(9),
                    self.getPrivateSignal(10),
                    self.getPrivateSignal(11)
                ]);

                xls.push([]);

                if (this.firstSnipes != null) {
                    xls.push(['First Snipes']);

                    xls.push([
                        'Player',
                        'Target',
                        'Status Quo',
                        'Project A',
                        'Project B',
                        'Snipe Executed'
                    ]);

                    this.firstSnipes.forEach(f => {
                        xls.push([
                            self.getPlayer(f.player.number, f.player.role),
                            self.getPlayer(f.target.number, f.target.role),
                            self.getYesOrNo(f.snipes[0]),
                            self.getYesOrNo(f.snipes[1]),
                            self.getYesOrNo(f.snipes[2]),
                            self.getYesOrNo(f.executed)
                        ]);
                    });
                }

                xls.push([]);

                if (this.firstSnipeResults != null) {
                    xls.push(['First Snipes Results']); 

                    xls.push(['Player', 'Target', 'Profit']);

                    this.firstSnipeResults.forEach(f => {
                        xls.push([
                            self.getPlayer(f.player.number, f.player.role),
                            self.getPlayer(f.target.number, f.target.role),
                            self.formatNumber(f.profit)
                        ]);
                    });

                    xls.push([]);
                }

                if (this.secondDeclarations != null) {
                    xls.push(['Second Declarations']);

                    xls.push([
                        'Player',
                        'Status Quo Value',
                        'Project A Value',
                        'Project B Value',
                        'Status Quo Declaration',
                        'Project A Declaration',
                        'Project B Declaration',
                        'Status Quo Taxes',
                        'Project A Taxes',
                        'Project B Taxes'
                    ]);

                    this.secondDeclarations.forEach(d => {
                        xls.push([
                            self.getPlayer(d.player, d.role),
                            self.formatNumber(self.getValue(d, 'value', 0)),
                            self.formatNumber(self.getValue(d, 'value', 1)),
                            self.formatNumber(self.getValue(d, 'value', 2)),
                            self.formatNumber(self.getValue(d, 'declaration', 0)),
                            self.formatNumber(self.getValue(d, 'declaration', 1)),
                            self.formatNumber(self.getValue(d, 'declaration', 2)),
                            self.formatNumber(self.getValue(d, 'taxes', 0)),
                            self.formatNumber(self.getValue(d, 'taxes', 1)),
                            self.formatNumber(self.getValue(d, 'taxes', 2))
                        ]);
                    });

                    xls.push([]);
                }

                if (this.secondSnipes != null) {
                    xls.push(['Second Snipes']);

                    xls.push([
                        'Player',
                        'Target',
                        'Status Quo',
                        'Project A',
                        'Project B',
                        'Snipe Executed'
                    ]);

                    this.secondSnipes.forEach(f => {
                        xls.push([
                            self.getPlayer(f.player.number, f.player.role),
                            self.getPlayer(f.target.number, f.target.role),
                            self.getYesOrNo(f.snipes[0]),
                            self.getYesOrNo(f.snipes[1]),
                            self.getYesOrNo(f.snipes[2]),
                            self.getYesOrNo(f.executed)
                        ]);
                    });

                    xls.push([]);
                }

                if (this.secondSnipeResults != null) {
                    xls.push(['Second Snipes Results']); 

                    xls.push(['Player', 'Target', 'Profit']);

                    this.secondSnipeResults.forEach(f => {
                        xls.push([
                            self.getPlayer(f.player.number, f.player.role),
                            self.getPlayer(f.target.number, f.target.role),
                            self.formatNumber(f.profit)
                        ]);
                    });

                    xls.push([]);
                }

                console.log(xls);
                /* convert state to workbook */
                const ws = XLSX.utils.aoa_to_sheet(xls);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.game-analysis.xlsx`);
            },
            getValue(declaration, property, index) {
                let value
                
                if (index != null) {
                    value = declaration[property][index];
                } else {
                    value = declaration[property];
                }

                if (value < 0) {
                    return '';
                }

                return value;
            },
            getPrivateSignal(i) {
                if (this.signals == null || this.signals.privateSignals[i] == null) {
                    return '-';
                }

                return this.formatNumber(this.signals.privateSignals[i][this.winningCondition]);
            },
            getYesOrNo(bool) {
                if (bool == null) {
                    return '';
                }

                return bool ? 'Y' : 'N';
            },
            getWinningCondition(i) {
                if (this.winningCondition == null) {
                    return '';
                }

                return this.winningCondition === i ? 'Y' : 'N';
            },
            getPlayer(number, role) {
                return roleMap[role] + ' ' + number;
            },
            getDeclarationPlayer(i) {
                const declaration = this.game.declarations[i];

                if (declaration == null) {
                    console.log(`Could not find declaration ${i}`);
                    return 'Unavailable';
                }

                return roleMap[declaration.role] + ' ' + i;
            },
            conditionToString(c) {
                return conditionMap[c];
            },
            showPreview() {
                //TODO
            },
            formatNumber(num) {
                if (num == null) {
                    return '';
                }

                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
            }
        },
        async mounted () {
            const self = this;

            const token = localStorage.getItem("token");

            this.gameId = parseInt(this.$route.params.id);

            const response = await this.$http.get("/games/data", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.ruleset = response.data.data.ruleset;
            this.firstDeclarations = response.data.data.firstDeclarations;
            this.winningCondition = response.data.data.winningCondition;
            this.firstSnipes = response.data.data.firstSnipes;
            this.firstSnipeResults = response.data.data.firstSnipeResults;
            this.signals = response.data.data.signals;

            this.secondDeclarations = response.data.data.secondDeclarations;
            this.secondSnipes = response.data.data.secondSnipes;
            this.secondSnipeResults = response.data.data.secondSnipeResults;

            console.log(response.data.data);
        }
    }
</script>