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
                    <button :disabled="false" class="btn btn-success" @click="exportXlsx()">Export</button>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <b-card no-body>
                <b-tabs card v-model="roundIndex">
                    <b-tab v-for="round in rounds" :key="round.round">

                        <template #title>
                            Round {{ round.round }}
                        </template>

                        <div v-for="owner in players.filter(p => p.role === 3)" class="row" :key="owner.number">
                            <div class="text-center"><b>{{ owner.tag }}</b></div>
                            <table class="table table-bordered">
                                <thead class="thead-dark">
                                    <th scope="col">Condition</th>
                                    <th scope="col">Value</th>
                                    <th scope="col">Compensation Requested</th>
                                    <th scope="col">Compensation Offered</th>
                                    <th scope="col">Accepted</th>
                                </thead>
                                <tbody>
                                    <tr v-for="condition in conditions" :key="condition.id" :style="condition.id === winningCondition ? 'background-color: yellow;' : ''">
                                        <td>{{ condition.name }}</td>
                                        <td>{{ formatUs( owner.values[condition.id] ) }}</td>
                                        <td>{{ getCompensationRequest(round.round, owner.number, condition.id) }}</td>
                                        <td>{{ getCompensationOffered(round.round, condition.id) }}</td>
                                        <td>{{ getCompensationAccepted(round.round, owner.number, condition.id) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="row">
                            <div class="text-center"><b>Vote Results</b></div>
                            <table class="table table-bordered">
                                <thead class="thead-dark">
                                    <th scope="col">Condition</th>
                                    <th scope="col">Vote Count</th>
                                    <th scope="col">Tiebreaker Value</th>
                                </thead>
                                <tbody>
                                    <tr v-for="condition in conditions" :key="condition.id" :style="condition.id === winningCondition ? 'background-color: yellow;' : ''">
                                        <td>{{ condition.name }}</td>
                                        <td>{{ getStandingCounter(round.round, condition.id) }}</td>
                                        <td>{{ getStandingValue(round.round, condition.id) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="row">
                            <div><b>Profit ({{ conditions[getWinningCondition(round.round)].name }})</b></div>
                            <table class="table table-bordered">
                                <thead class="thead-dark">
                                    <th scope="col">Player</th>
                                    <th scope="col">Value</th>
                                    <th scope="col">Compensation</th>
                                    <th scope="col">Total</th>
                                </thead>
                                <tbody>
                                    <tr v-for="player in players" :key="player.number">
                                        <td>{{ player.tag }}</td>
                                        <td>{{ formatUs( player.values[getWinningCondition(round.round)] ) }}</td>
                                        <td>{{ getCompensationReceived(round.round, player.role) }}</td>
                                        <td>{{ getTotalProfit(round.round, player) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </b-tab>
                </b-tabs>
            </b-card>

        </div>
    </div>
</template>
<script>
    import XLSX from 'xlsx';

    export default {
        data() {
            return {
                gameId: null,
                ruleset: null,
                compensationRequests: null,
                compensationOffers: null,
                compensationDecisions: null,
                standings: null,
                winningCondition: null,
                conditions: null,
                players: null,
                roundIndex: 0,
                rounds: null
            };
        },
        components: {
        },
        name: 'GameAnalysisVoting',
        created() {
        },
        methods: {
            exportXlsx() {
                const self = this;

                const wb = XLSX.utils.book_new();

                self.rounds.forEach(round => {
                    const xls = [];

                    xls.push(['Owner']);

                    xls.push([
                        'Player',
                        'Condition',
                        'Value',
                        'Compensation Requested',
                        'Compensation Offered',
                        'Accepted'
                    ]);

                    this.players.filter(player => player.role === 3).forEach(owner => {
                        self.conditions.forEach(condition => {
                            xls.push([
                                owner.tag,
                                condition.name,
                                self.formatUs( owner.values[condition.id] ),
                                self.getCompensationRequest(round.round, owner.number, condition.id),
                                this.getCompensationOffered(round.round, condition.id),
                                this.getCompensationAccepted(round.round, owner.number, condition.id)
                            ]);
                        })
                    });

                    xls.push([]);

                    xls.push(['Vote Results']);

                    xls.push([
                        'Condition',
                        'Vote Count',
                        'Tiebreaker Value'
                    ]);

                    this.conditions.forEach(condition => {
                        xls.push([
                            condition.name,
                            this.getStandingCounter(round.round, condition.id),
                            this.getStandingValue(round.round, condition.id)
                        ]);
                    });

                    xls.push([]);

                    xls.push([`Profit (${self.conditions[self.getWinningCondition(round.round)].name})`]);

                    xls.push([
                        'Player',
                        'Value',
                        'Compensation',
                        'Total'
                    ]);

                    this.players.forEach(player => {
                        xls.push([
                            player.tag,
                            self.formatUs( player.values[self.getWinningCondition(1)] ),
                            self.getCompensationReceived(round.round, player.role),
                            self.getTotalProfit(1, player)
                        ]);
                    });

                    /* convert state to workbook */
                    const ws = XLSX.utils.aoa_to_sheet(xls);
                    XLSX.utils.book_append_sheet(wb, ws, `Round ${round.round}`);
                });

                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.game-analysis.xlsx`);
            },
            getCompensationRequest(roundNumber, number, condition) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[3] == null) {
                    return '';
                }

                const allCompensationRequests = round.results[3].compensationRequests;

                if (allCompensationRequests == null) {
                    return '';
                }

                const playerCompensationRequests = allCompensationRequests.find(acr => acr.number === number);

                if (playerCompensationRequests == null || playerCompensationRequests.compensationRequests == null) {
                    return '';
                }

                return this.formatUs(playerCompensationRequests.compensationRequests[condition]);
            },
            getCompensationOffered(roundNumber, condition) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[4] == null) {
                    return '';
                }

                const compensationOffers = round.results[4].compensationOffers;

                if (compensationOffers == null) {
                    return '';
                }

                return this.formatUs(compensationOffers[condition]);
            },
            getCompensationAccepted(roundNumber, number, condition) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[5] == null) {
                    return '';
                }

                const allCompensationDecisions = round.results[5].compensationDecisions;

                if (allCompensationDecisions == null) {
                    return '';
                }

                const playerCompensationDecisions = allCompensationDecisions.find(acd => acd.number = number);

                if (playerCompensationDecisions == null || playerCompensationDecisions.compensationDecisions == null) {
                    return '';
                }

                return playerCompensationDecisions.compensationDecisions[condition] === true ? 'Yes' : 'No';
            },
            getCompensationReceived(roundNumber, role) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[4] == null) {
                    return '';
                }

                const compensationOffers = round.results[4].compensationOffers;

                if (compensationOffers == null) {
                    return '';
                }

                const jackpot = compensationOffers[this.getWinningCondition(roundNumber)];

                if (role === 3) {
                    return this.formatUs(jackpot);
                } else {
                    return this.formatUs( - (this.players.length - 1 ) * jackpot );
                }
            },
            getTotalProfit(roundNumber, player) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[4] == null) {
                    return '';
                }

                const compensationOffers = round.results[4].compensationOffers;

                if (compensationOffers == null) {
                    return '';
                }

                const winningCondition = this.getWinningCondition(roundNumber);
                
                const jackpot = compensationOffers[winningCondition];

                if (player.role === 3) {
                    return this.formatUs(player.values[winningCondition] + jackpot);
                } else {
                    return this.formatUs(player.values[winningCondition] - (this.players.length - 1 ) * jackpot);
                }
            },
            getStandingCounter(roundNumber, condition) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[6] == null) {
                    return '';
                }

                const standings = round.results[6].standings;

                if (standings == null) {
                    return '';
                }

                return standings[condition].counter;
            },
            getStandingValue(roundNumber, condition) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[6] == null) {
                    return '';
                }

                const standings = round.results[6].standings;

                if (standings == null) {
                    return '';
                }

                return this.formatUs(standings[condition].value);
            },
            getWinningCondition(roundNumber) {
                if (this.rounds == null) {
                    return '';
                }

                const round = this.rounds.find(r => r.round === roundNumber);

                if (round == null) {
                    return '';
                }

                if (round.results == null || round.results[6] == null) {
                    return '';
                }

                return round.results[6].winningCondition;
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

            this.ruleset = response.data.data.ruleset;
            this.conditions = response.data.data.conditions;
            this.players = response.data.data.players;
            this.compensationRequests = response.data.data.compensationRequests;
            this.compensationOffers = response.data.data.compensationOffers;
            this.compensationDecisions = response.data.data.compensationDecisions;
            this.standings = response.data.data.standings;
            this.winningCondition = response.data.data.winningCondition;
            this.rounds = response.data.data.results;

            console.log(response.data.data);

            window.vue = this;
        }
    }
</script>