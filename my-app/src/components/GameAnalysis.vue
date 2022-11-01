<template>
    <b-col><div class="d-flex flex-column h-100">
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
                <b-navbar-nav class="ml-auto mr-2">
                    <button :disabled="false" class="btn btn-success" @click="exportXlsx">Export</button>
                </b-navbar-nav>
                <b-navbar-nav>
                    <button :disabled="false" class="btn btn-success" @click="exportXlsxWide()">Export Wide</button>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <b-card no-body>
                <b-tabs card v-model="roundIndex">
                    <b-tab v-for="index in indexes" :key="index">

                        <template #title>
                            Round {{ index + 1 }}
                        </template>

                        <div class="mt-1 mx-5 mp-1">
                            <div class="row">
                                <div class="text-center"><b>First Declarations</b></div>
                                <table class="table table-bordered">
                                    <thead class="thead-dark">
                                        <th>Player</th>
                                        <th v-for="c in conditions" :key="'value-' + c.id">{{ c.name }} Value</th>
                                        <th v-for="c in conditions" :key="'declaration-' + c.id">{{ c.name }} Declaration</th>
                                        <th v-for="c in conditions" :key="'tax-' + c.id">{{ c.name }} Taxes</th>
                                    </thead>
                                    <tbody>
                                        <tr v-for="d in firstDeclarations[index]" :key="d.player + '-' + d.role + '-first'">
                                            <td>{{ getPlayer(d.player) }}</td>
                                            <td v-for="c in conditions" :key="'value-' + c.id">{{ formatUs(getValue(d, 'value', c.id)) }}</td>
                                            <td v-for="c in conditions" :key="'declaration-' + c.id">{{ formatUs(getValue(d, 'declaration', c.id)) }}</td>
                                            <td v-for="c in conditions" :key="'tax-' + c.id">{{ formatUs(getValue(d, 'taxes', c.id)) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="row">
                                <div class="text-center"><b>Winning Condition</b></div>
                                <table class="table table-bordered">
                                    <thead class="thead-dark">
                                        <th v-for="c in conditions" :key="c.id" scope="col">{{ c.name }} Value</th>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td v-for="c in conditions" :key="c.id">{{ getWinningCondition(index, c.id) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="row">
                                <div class="text-center"><b>Signals (Winning Condition highlighted)</b></div>
                                <table class="table table-bordered">
                                    <thead class="thead-dark">
                                        <th scope="col">Condition</th>
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
                                        <tr v-for="c in conditions" :key="c.id" :style="c.id === winningCondition[index] ? 'background-color: yellow;' : ''">
                                            <td>{{ c.name }}</td>
                                            <td>{{ signals != null ? formatUs(signals[index].publicSignal[c.id]) : '-' }}</td>
                                            <td>{{ getPrivateSignal(index, 0, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 1, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 2, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 3, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 4, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 5, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 6, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 7, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 8, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 9, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 10, c.id) }}</td>
                                            <td>{{ getPrivateSignal(index, 11, c.id) }}</td>
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
                                        <tr v-for="f in firstSnipes[index]" :key="f.id">
                                            <td>{{ getPlayer(f.player.number) }}</td>
                                            <td>{{ getPlayer(f.target.number) }}</td>
                                            <td :style="0 === winningCondition[index] ? 'background-color: yellow;' : ''">{{ getYesOrNo(f.snipes[0]) }}</td>
                                            <td :style="1 === winningCondition[index] ? 'background-color: yellow;' : ''">{{ getYesOrNo(f.snipes[1]) }}</td>
                                            <td :style="2 === winningCondition[index] ? 'background-color: yellow;' : ''">{{ getYesOrNo(f.snipes[2]) }}</td>
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
                                        <tr v-for="f in firstSnipeResults[index]" :key="f.id">
                                            <td>{{ getPlayer(f.player.number) }}</td>
                                            <td>{{ getPlayer(f.target.number) }}</td>
                                            <td>{{ formatUs(f.profit) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="row">
                                <div class="text-center"><b>Second Declarations</b></div>
                                <table class="table table-bordered">
                                    <thead class="thead-dark">
                                        <th>Player</th>
                                        <th v-for="c in conditions" :key="'value-' + c.id">{{ c.name }} Value</th>
                                        <th v-for="c in conditions" :key="'declaration-' + c.id">{{ c.name }} Declaration</th>
                                        <th v-for="c in conditions" :key="'tax-' + c.id">{{ c.name }} Taxes</th>
                                    </thead>
                                    <tbody>
                                        <tr v-for="d in secondDeclarations[index]" :key="d.player + '-' + d.role + '-second'">
                                            <td>{{ getPlayer(d.player, d.role) }}</td>
                                            <td v-for="c in conditions" :key="'value-' + c.id">{{ formatUs(getValue(d, 'value', c.id)) }}</td>
                                            <td v-for="c in conditions" :key="'declaration-' + c.id">{{ formatUs(getValue(d, 'declaration', c.id)) }}</td>
                                            <td v-for="c in conditions" :key="'tax-' + c.id">{{ formatUs(getValue(d, 'taxes', c.id)) }}</td>
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
                                        <tr v-for="f in secondSnipes[index]" :key="f.id">
                                            <td>{{ getPlayer(f.player.number) }}</td>
                                            <td>{{ getPlayer(f.target.number) }}</td>
                                            <td :style="0 === winningCondition ? 'background-color: yellow;' : ''">{{ getYesOrNo(f.snipes[0]) }}</td>
                                            <td :style="1 === winningCondition ? 'background-color: yellow;' : ''">{{ getYesOrNo(f.snipes[1]) }}</td>
                                            <td :style="2 === winningCondition ? 'background-color: yellow;' : ''">{{ getYesOrNo(f.snipes[2]) }}</td>
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
                                        <tr v-for="f in secondSnipeResults[index]" :key="f.id">
                                            <td>{{ getPlayer(f.player.number) }}</td>
                                            <td>{{ getPlayer(f.target.number) }}</td>
                                            <td>{{ formatUs(f.profit) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </b-tab>
                </b-tabs>
            </b-card>

        </div>
    </div></b-col>
</template>
<script>
    import XLSX from 'xlsx';

    export default {
        data() {
            return {
                gameId: null,
                startTime: null,
                ruleset: null,
                firstDeclarations: [],
                signals: null,
                winningCondition: null,
                firstSnipes: [],
                firstSnipeResults: [],
                secondDeclarations: [],
                secondSnipes: [],
                secondSnipeResults: [],
                roundIndex: 0,
                indexes: [],
                log: null,
                finalPrices: [],
                wallets: [],
                cashForSniping: []
            };
        },
        components: {
        },
        name: 'GameAnalysis',
        created() {
        },
        methods: {
            getConditionString(i) {
                console.log(i);
                console.log(this.conditions[i]);

                return this.conditions[i].name;
            },
            exportXlsx() {
                const self = this;

                const wb = XLSX.utils.book_new();

                self.rounds.forEach((round, i) => {
                    const xls = [];

                    let header;

                    if (self.firstDeclarations[i] != null) {
                        xls.push(['First Declarations']);

                        header = ['Player'];

                        ['Value', 'Declaration', 'Taxes'].forEach(tag => {
                            self.conditions.forEach(c => {
                                header.push(`${c.name} ${tag}`);
                            });
                        });

                        xls.push(header);

                        this.firstDeclarations[i].forEach(d => {
                            const row = [self.getPlayer(d.player)];

                            ['value', 'declaration', 'taxes'].forEach(tag => {
                                self.conditions.forEach(c => {
                                    row.push(self.formatUs(self.getValue(d, tag, c.id)));
                                });
                            });

                            xls.push(row);
                        });

                        xls.push([]);
                    }

                    xls.push(['Winning Condition']);

                    xls.push(self.conditions.map(c => `${c.name} Value`));
                    xls.push(self.conditions.map(c => self.getWinningCondition(i, c.id)));

                    xls.push([]);

                    xls.push(['Signals']);

                    header = ['Condition', 'Public'];

                    for (let j = 1; j <= 12; j++) {
                        if (i === 1) {
                            header.push(`Private #${j}`);
                        } else {
                            header.push(`#${j}`);
                        }
                    }

                    xls.push(header);

                    self.conditions.forEach(c => {
                        const row = [c.name, self.signals[i].publicSignal[c.id]];

                        for (let j = 0; j < 12; j++) {
                            row.push(self.getPrivateSignal(i, j, c.id))
                        }

                        xls.push(row);
                    });

                    xls.push([]);

                    if (self.firstSnipes[i] != null) {
                        xls.push(['First Snipes']);

                        header = ['Player', 'Target'];

                        self.conditions.forEach(c => {
                            header.push(c.name);
                        });

                        header.push('Snipe Executed');

                        xls.push(header);

                        self.firstSnipes[i].forEach(f => {
                            const row = [self.getPlayer(f.player.number), self.getPlayer(f.target.number)];

                            self.conditions.forEach(c => {
                                row.push(self.getYesOrNo(f.snipes[c.id]));
                            });

                            row.push(self.getYesOrNo(f.executed));

                            xls.push(row);
                        });

                        xls.push([]);
                    }

                    if (self.firstSnipeResults[i] != null) {
                        xls.push(['First Snipes Results']); 

                        xls.push(['Player', 'Target', 'Profit']);

                        this.firstSnipeResults[i].forEach(f => {
                            xls.push([
                                self.getPlayer(f.player.number),
                                self.getPlayer(f.target.number),
                                self.formatUs(f.profit)
                            ]);
                        });

                        xls.push([]);
                    }

                    if (self.secondDeclarations[i] != null) {
                        xls.push(['Second Declarations']);

                        header = ['Player'];

                        ['Value', 'Declaration', 'Taxes'].forEach(tag => {
                            self.conditions.forEach(c => {
                                header.push(`${c.name} ${tag}`);
                            });
                        });

                        xls.push(header);

                        this.secondDeclarations[i].forEach(d => {
                            const row = [self.getPlayer(d.player)];

                            ['value', 'declaration', 'taxes'].forEach(tag => {
                                self.conditions.forEach(c => {
                                    row.push(self.formatUs(self.getValue(d, tag, c.id)));
                                });
                            });

                            xls.push(row);
                        });

                        xls.push([]);
                    }

                    if (self.secondSnipes[i] != null) {
                        xls.push(['First Snipes']);

                        header = ['Player', 'Target'];

                        self.conditions.forEach(c => {
                            header.push(c.name);
                        });

                        header.push('Snipe Executed');

                        xls.push(header);

                        self.secondSnipes[i].forEach(f => {
                            const row = [self.getPlayer(f.player.number), self.getPlayer(f.target.number)];

                            self.conditions.forEach(c => {
                                row.push(self.getYesOrNo(f.snipes[c.id]));
                            });

                            row.push(self.getYesOrNo(f.executed));

                            xls.push(row);
                        });

                        xls.push([]);
                    }

                    if (self.secondSnipeResults[i] != null) {
                        xls.push(['Second Snipes Results']); 

                        xls.push(['Player', 'Target', 'Profit']);

                        this.secondSnipeResults[i].forEach(f => {
                            xls.push([
                                self.getPlayer(f.player.number),
                                self.getPlayer(f.target.number),
                                self.formatUs(f.profit)
                            ]);
                        });

                        xls.push([]);
                    }

                    /* convert state to workbook */
                    const ws = XLSX.utils.aoa_to_sheet(xls);
                    XLSX.utils.book_append_sheet(wb, ws, `Round ${round.round}`);
                });

                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.analysis.xlsx`);
            },
            exportXlsxWide() {
                const self = this;

                const wb = XLSX.utils.book_new();

                const xls = [];

                xls.push([
                    'session', 'players.number', 'round', 'players.tag', 'players.role', 'ruleset', 'Value_noProject', 'Value_projectA',
                    'Declaration1_noProject', 'Declaration1_projectA', 'Taxes1_noProject', 'Taxes1_projectA', 'ProjectOutcome', '',
                    'Signal_PublicNP', 'sig_pubP', 'SigPrivateNP', 'SigPrivateP', '',
                    'snipe1_TNP_owner1', 'snipe1_TNP_owner2', 'snipe1_TNP_owner3', 'snipe1_TNP_owner4', 'snipe1_TNP_owner5', 'snipe1_TNP_dev', '',
                    'snipe1_TP_owner1', 'snipe1_TP_owner2', 'snipe1_TP_owner3', 'snipe1_TP_owner4', 'snipe1_TP_owner5', 'snipe1_TP_dev', '',
                    'Dec1_Owner1_NP', 'Dec1_Owner2_NP', 'Dec1_Owner3_NP', 'Dec1_Owner4_NP', 'Dec1_Owner5_NP', 'Dec1_Dev_NP', '',
                    'Dec1_Owner1_P', 'Dec1_Owner2_P', 'Dec1_Owner3_P', 'Dec1_Owner4_P', 'Dec1_Owner5_P', 'Dec1_Dev_P', '',
                    'snipe1_TNP_owner1_result', 'snipe1_TNP_owner2_result', 'snipe1_TNP_owner3_result', 'snipe1_TNP_owner4_result', 'snipe1_TNP_owner5_result', 'snipe1_TNP_dev_result', '',
                    'snipe1_TP_owner1_result', 'snipe1_TP_owner2_result', 'snipe1_TP_owner3_result', 'snipe1_TP_owner4_result', 'snipe1_TP_owner5_result', 'snipe1_TP_dev_result', '',
                    'Declaration2_Outcome',	'Taxes2_Outcome', '',
                    'snipe2_TO_owner1', 'snipe2_TO_owner2',	'snipe2_TO_owner3', 'snipe2_TO_owner4', 'snipe2_TO_owner5', 'snipe2_TO_dev', '',
                    'Dec2_Owner1_O', 'Dec2_Owner2_O', 'Dec2_Owner3_O', 'Dec2_Owner4_O', 'Dec2_Owner5_O', 'Dec2_Dev_O', '',
                    'snipe2_TO_owner1_result', 'snipe2_TO_owner2_result', 'snipe2_TO_owner3_result', 'snipe2_TO_owner4_result', 'snipe2_TO_owner5_result', 'snipe2_TO_dev_result', '',
                    'Num_Bids_NP', 'Num_Asks_NP', 'Num_Buys_NP', 'Num_Sells_NP', 'Ending_Cash_NP', 'Ending_Shares_NP', '',
                    'Num_Bids_P', 'Num_Asks_P', 'Num_Buys_P', 'Num_Sells_P', 'Ending_Cash_P', 'Ending_Shares_P', '',
                    'snipe1_end_result', 'Property Value_min_Tax1', 'Trading_Result', 'snipe2_end_results', 'Property Value_min_Tax2'
                ]);                

                const ownerNumbers = [null, null, null, null, null, null];

                self.players.forEach(p => {
                    if (p.role === 1) {
                        return;
                    }

                    if (p.role === 3) {
                        const index = parseInt(p.tag.split(' ')[1]);

                        ownerNumbers[index - 1] = p.number;
                    } else if (p.role === 2) {
                        ownerNumbers[5] = p.number;
                    }
                });

                console.log("Owner numbers: ");
                console.log(ownerNumbers);

                self.rounds.forEach(round => {
                    const roundIdx = round.round - 1;

                    const winningCondition = self.winningCondition[roundIdx];

                    self.players.forEach(player => {
                        const xlsRow = [self.startTime,player.number,round.round, player.tag, player.role, self.ruleset];

                        self.conditions.forEach((c) => { //Values
                            const declaration = self.firstDeclarations[roundIdx].find(d => d.player === player.number);

                            if (declaration == null) {
                                xlsRow.push(null);
                                return;
                            }

                            xlsRow.push(declaration.value[c.id]);
                        });

                        self.conditions.forEach((c) => { //First declarations
                            const declaration = self.firstDeclarations[roundIdx].find(d => d.player === player.number);

                            if (declaration == null) {
                                xlsRow.push(null);
                                return;
                            }

                            xlsRow.push(declaration.declaration[c.id]);
                        });

                        self.conditions.forEach((c) => { //Taxes
                            const declaration = self.firstDeclarations[roundIdx].find(d => d.player === player.number);

                            if (declaration == null) {
                                xlsRow.push(null);
                                return;
                            }

                            xlsRow.push(declaration.taxes[c.id]);
                        });

                        xlsRow.push(self.conditions[winningCondition].key); //outcome

                        xlsRow.push(null);

                        self.conditions.forEach((c) => { //Public signals
                            const publicSignals = self.signals[roundIdx].publicSignal;

                            if (publicSignals == null) {
                                xlsRow.push(null);
                                return;
                            }

                            xlsRow.push(publicSignals[c.id]);
                        });

                        self.conditions.forEach((c) => { //Private signals
                            const privateSignals = self.signals[roundIdx].privateSignals;

                            if (privateSignals == null) {
                                xlsRow.push(null);
                                return;
                            }

                            xlsRow.push(privateSignals[player.number - 1][c.id]);
                        });

                        xlsRow.push(null);

                        self.conditions.forEach((c) => {
                            //First Sniping Attempts
                            if (player.role != 1) {
                                xlsRow.push(null, null, null, null, null, null);
                            } else {
                                ownerNumbers.forEach(on => {
                                    if (on == null) {
                                        xlsRow.push(null);
                                        return;                                    
                                    }

                                    const snipe = self.firstSnipes[roundIdx].find(fs => fs.player.number === player.number && fs.target.number === on);

                                    if (snipe == null) {
                                        xlsRow.push('N');
                                        return;
                                    }

                                    xlsRow.push(snipe.snipes[c.id] == null || !snipe.snipes[c.id] ? 'N' : 'Y');
                                });
                            }

                            xlsRow.push(null);//End of First Sniping Attempts
                        });

                        self.conditions.forEach((c) => {
                            //First Declarations
                            if (player.role != 1) {
                                xlsRow.push(null, null, null, null, null, null);
                            } else {
                                ownerNumbers.forEach(on => {
                                    if (on == null) {
                                        xlsRow.push(null);
                                        return;
                                    }

                                    const decl = self.firstDeclarations[roundIdx].find(fd => fd.player === on);

                                    if (decl == null) {
                                        xlsRow.push(null);
                                    } else {
                                        xlsRow.push(decl.declaration[c.id]);
                                    }
                                });
                            }

                            xlsRow.push(null);//End of First Declarations
                        });

                        self.conditions.forEach((c) => {
                            //First Snipe Results
                            if (player.role != 1) {
                                xlsRow.push(null, null, null, null, null, null);
                            } else {
                                ownerNumbers.forEach(on => {
                                    if (on == null) {
                                        xlsRow.push(null);
                                        return;
                                    }

                                    const result = self.firstSnipeResults[roundIdx].find(fd => fd.player.number === player.number && fd.target.number === on);

                                    if (result == null) {
                                        xlsRow.push(null);
                                    } else {
                                        if (c.id === winningCondition) {
                                            xlsRow.push(result.profit);
                                        } else {
                                            xlsRow.push(null);
                                        }
                                    }
                                });
                            }

                            xlsRow.push(null);//End of First Snipe Results
                        });

                        //Second Declarations and Taxes
                        const secondDeclaration = self.secondDeclarations[roundIdx].find(d => d.player === player.number);

                        if (secondDeclaration == null) {
                            xlsRow.push(null, null);
                        } else {
                            xlsRow.push(secondDeclaration.declaration[winningCondition]);
                            xlsRow.push(secondDeclaration.taxes[winningCondition]);
                        }//End pf Second Declarations and Taxes

                        xlsRow.push(null);

                        //Second Sniping Attempts
                        if (player.role != 1) {
                            xlsRow.push(null, null, null, null, null, null);
                        } else {
                            ownerNumbers.forEach(on => {
                                if (on == null) {
                                    xlsRow.push(null);
                                    return;                                    
                                }

                                const snipe = self.secondSnipes[roundIdx].find(fs => fs.player.number === player.number && fs.target.number === on);

                                if (snipe == null) {
                                    xlsRow.push('N');
                                    return;
                                }

                                xlsRow.push(snipe.snipes[winningCondition] == null || !snipe.snipes[winningCondition] ? 'N' : 'Y');
                            });
                        }

                        xlsRow.push(null);//End of First Sniping Attempts

                        //Second Declarations
                        if (player.role != 1) {
                            xlsRow.push(null, null, null, null, null, null);
                        } else {
                            ownerNumbers.forEach(on => {
                                if (on == null) {
                                    xlsRow.push(null);
                                    return;
                                }

                                const decl = self.secondDeclarations[roundIdx].find(fd => fd.player === on);

                                if (decl == null) {
                                    xlsRow.push(null);
                                } else {
                                    xlsRow.push(decl.declaration[winningCondition]);
                                }
                            });
                        }

                        xlsRow.push(null);//End of Second Declarations

                        //Second Snipe Results
                        if (player.role != 1) {
                            xlsRow.push(null, null, null, null, null, null);
                        } else {
                            ownerNumbers.forEach(on => {
                                if (on == null) {
                                    xlsRow.push(null);
                                    return;
                                }

                                const result = self.secondSnipeResults[roundIdx].find(fd => fd.player.number === player.number && fd.target.number === on);

                                if (result == null) {
                                    xlsRow.push(null);
                                } else {
                                    xlsRow.push(result.profit);
                                }
                            });
                        }

                        xlsRow.push(null);//End of Second Snipe Results

                        //Market Results
                        self.conditions.forEach((c) => {
                            const myActions = self.log[roundIdx][c.id]; //.filter(l => l.actor.number === player.number);

                            xlsRow.push(myActions.filter(a => a.action === 'added Sell' && a.actor.number === player.number).length);
                            xlsRow.push(myActions.filter(a => a.action === 'added Buy' && a.actor.number === player.number).length);
                            xlsRow.push(myActions.filter(a => a.buyer != null && a.buyer.number === player.number).length);
                            xlsRow.push(myActions.filter(a => a.seller != null && a.seller.number === player.number).length);
                            xlsRow.push(self.wallets[roundIdx].find(w => w.number === player.number).wallet[c.id].balance);
                            xlsRow.push(self.wallets[roundIdx].find(w => w.number === player.number).wallet[c.id].shares);
                            xlsRow.push(null);
                        });

                        let firstSnipeResult;
                        let firstTaxes;
                        let tradingResult;
                        let secondSnipeResult;
                        let secondTaxes;

                        const finalPrice = self.finalPrice[roundIdx];

                        tradingResult = (self.wallets[roundIdx].find(w => w.number === player.number).wallet[winningCondition].balance - player.balance) +
                        (self.wallets[roundIdx].find(w => w.number === player.number).wallet[winningCondition].shares - player.shares) * finalPrice

                        //Aggregate Results
                        if (player.role === 1) {
                            firstSnipeResult = self.firstSnipeResults[roundIdx].filter(sr => sr.player.number === player.number && sr.profit != null)
                                .map(sr => sr.profit).reduce((a, b) => a + b, 0);
                            firstTaxes = null; //Always for snipers
                            secondSnipeResult = self.secondSnipeResults[roundIdx].filter(sr => sr.player.number === player.number && sr.profit != null)
                                .map(sr => sr.profit).reduce((a, b) => a + b, 0);
                            secondTaxes = null; //Always for snipers
                        } else if (player.role === 2 || player.role === 3) {
                            firstSnipeResult = self.firstSnipeResults[roundIdx].filter(sr => sr.target.number === player.number && sr.profit != null)
                                .map(sr => sr.profit).reduce((a, b) => a - b, 0);
                            firstTaxes = self.firstDeclarations[roundIdx].find(d => d.player === player.number).taxes[self.winningCondition];
                            secondSnipeResult = self.secondSnipeResults[roundIdx].filter(sr => sr.target.number === player.number && sr.profit != null)
                                .map(sr => sr.profit).reduce((a, b) => a - b, 0);
                            secondTaxes = self.secondDeclarations[roundIdx].find(d => d.player === player.number).taxes[self.winningCondition];
                        }

                        xlsRow.push(firstSnipeResult);
                        xlsRow.push(firstTaxes);
                        xlsRow.push(tradingResult);
                        xlsRow.push(secondSnipeResult);
                        xlsRow.push(secondTaxes);

                        xls.push(xlsRow);
                    });

                });

                const ws = XLSX.utils.aoa_to_sheet(xls);
                XLSX.utils.book_append_sheet(wb, ws, `Session`);

                XLSX.writeFile(wb, `${this.gameId}.analysis.xlsx`);
            },
            extractDataFromObject(object, ...tags) {
                if (tags.length === 0 || object == null) {
                    return object;
                }

                let obj = object[tags[0]];

                if (tags.length >= 1) {
                    for (let i = 1; i < tags.length; i++) {
                        obj = obj[tags[i]];

                        if (obj == null) {
                            break;
                        }
                    }
                }

                return obj;
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
            getPrivateSignal(index, i, condition) {
                if (this.signals == null || this.signals[index] == null || this.signals[index].privateSignals[i] == null) {
                    return '-';
                }

                if (condition == null) {
                    condition = this.winningCondition;
                }

                return this.formatUs(this.signals[index].privateSignals[i][condition]);
            },
            getYesOrNo(bool) {
                if (bool == null) {
                    return '';
                }

                return bool ? 'Y' : 'N';
            },
            getWinningCondition(round, i) {
                if (this.winningCondition[round] == null) {
                    return '';
                }

                return this.winningCondition[round] === i ? 'Y' : 'N';
            },
            getPlayer(number) {
                const player = this.players.find(p => p.number === number);

                return player == null ? '-' : player.tag;
            },
            getDeclarationPlayer(i) {
                const declaration = this.game.declarations[i];

                if (declaration == null) {
                    console.log(`Could not find declaration ${i}`);
                    return 'Unavailable';
                }

                return this.players.find(p => p.number === declaration.player);
            },
            formatUs(num) {
                if (num == null || typeof num != 'number') {
                    return num;
                }

                return num.toLocaleString('en-US');
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

            this.rounds = response.data.data.results;
            this.ruleset = response.data.data.ruleset;
            this.players = response.data.data.players;
            this.conditions = response.data.data.conditions;
            this.startTime = response.data.data.startTime;

            function extractProperty (rounds, phase, property) {
                const result = [];

                rounds.forEach(r => {
                    if (r.phase[phase] == null) {
                        return
                    }

                    result.push(r.phase[phase][property]);
                })

                return result;
            }

            this.firstDeclarations = extractProperty(this.rounds, 2, 'declarations');
            this.signals = extractProperty(this.rounds, 5, 'signals');
            this.secondDeclarations = extractProperty(this.rounds, 7, 'declarations');
            this.secondSnipes = extractProperty(this.rounds, 8, 'snipes');
            this.secondSnipeResults = extractProperty(this.rounds, 8, 'snipeOutcomes');
            this.log = extractProperty(this.rounds, 6, 'log');
            this.wallets = extractProperty(this.rounds, 6, 'wallets');
            this.finalPrices = extractProperty(this.rounds, 6, 'finalPrices');
            this.cashForSniping = extractProperty(this.rounds, 8, 'cashForSniping');
            this.finalPrice = extractProperty(this.rounds, 8, 'finalPrice');

            if (this.ruleset == 'Harberger') {
                this.winningCondition = extractProperty(this.rounds, 3, 'winningCondition');
                this.firstSnipes = extractProperty(this.rounds, 4, 'snipes');
                this.firstSnipeResults = extractProperty(this.rounds, 4, 'snipeOutcomes');
            } else {
                this.winningCondition = extractProperty(this.rounds, 6, 'winningCondition');
                this.firstSnipes = extractProperty(this.rounds, 6, 'snipes');
                this.firstSnipeResults = extractProperty(this.rounds, 6, 'snipeOutcomes');
            }

            this.indexes = this.rounds.map((e, i) => i);

            window.vue = this;
        }
    }
</script>