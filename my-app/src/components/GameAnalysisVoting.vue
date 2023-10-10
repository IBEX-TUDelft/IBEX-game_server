<template>
    <b-col><div class="d-flex flex-column h-100">
        <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ ruleset }}</b-nav-item>
                </b-navbar-nav>
                <b-navbar-nav class="container justify-content-center">
                    <b-navbar-brand>
                        Results Overview
                    </b-navbar-brand>
                </b-navbar-nav>
                <b-navbar-nav class="mr-1">
                    <button :disabled="false" class="btn btn-success" @click="exportXlsx()">Export</button>
                </b-navbar-nav>
                <b-navbar-nav>
                    <button :disabled="false" class="btn btn-success" @click="exportXlsxWide()">Export Wide</button>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <b-card no-body>
                <b-tabs card v-model="roundIndex" v-if="rounds != null">
                    <b-tab v-for="round in rounds.filter(r => r.round > 0)" :key="round.round">

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
                                        <td>{{ formatUs( getPlayerValues(owner.number, round.round)[condition.id] ) }}</td>
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

                        <div v-if="[0,1].includes(getWinningCondition(round.round))" class="row">
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
                                        <td>{{ formatUs( getPlayerValues(player.number, round.round)[getWinningCondition(round.round)] ) }}</td>
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
    </div></b-col>
</template>
<script>
    import XLSX from 'xlsx';

    export default {
        data() {
            return {
                gameId: null,
                ruleset: null,
                dataset: null,
                compensationRequests: null,
                compensationOffers: null,
                compensationDecisions: null,
                standings: null,
                winningCondition: null,
                playerValues: null,
                conditions: null,
                players: null,
                roundIndex: 0,
                rounds: null,
                rewards: null,
                surveys: [],
                rewardRound: null
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
                                self.formatUs( self.getPlayerValues(owner.number, round.round)[condition.id] ),
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
                            self.formatUs( self.getPlayerValues(player.number, round.round)[self.getWinningCondition(1)] ),
                            self.getCompensationReceived(round.round, player.role),
                            self.getTotalProfit(1, player)
                        ]);
                    });

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
                    'session', 'dataset' ,'players.number', 'round', 'players.tag', 'players.role', 'ruleset', 'Value_noProject', 'Value_projectA',
                    '', 'Compensation_Req', 'Request_Submitted','Compensation_Offer', 'Offer_Submitted', 'Compens_Delta', 'Vote', 'Num_Votes_for project', 'Total Value',
                    'Project Realized', 'Optimal_Outcome', 'Reward Round', 'Base Points', 'Points', 'Final Score', 'Factor', 'Exchange Rate', 'Reward', 'Payment_Token',
                    'Age', 'Gender', 'Year_of_Study', 'Faculty', 'Risk_Choice'
                ]);                

                self.rounds.forEach(round => {
                    try {
                        const roundNr = round.round;
                        const winningCondition = self.getWinningCondition(round.round);
                        
                        const conditionTotals = [];

                        self.players.forEach(player => {
                            self.conditions.forEach((c, i) => {
                                if (conditionTotals[i] == null) {
                                    conditionTotals[i] = 0;
                                }

                                const values = self.getPlayerValues(player.number, round.round);

                                console.log(values[i]);

                                conditionTotals[i] += values[i];
                            });
                        });

                        let max = 0;
                        let bestConditions = [];

                        conditionTotals.forEach((ct, i) => {
                            if (ct < max) {
                                return;
                            } else if (ct === max) {
                                bestConditions.push(i);
                            } else {
                                bestConditions = [i];
                                max = ct;
                            }
                        })

                        console.log('Condition totals: ');
                        console.log(conditionTotals);
                        console.log('Best conditions: ');
                        console.log(bestConditions);
                        console.log('Value: ' + max);

                        self.players.forEach(player => {
                            const values = self.getPlayerValues(player.number, round.round);
                            let compensationReq = self.extractDataFromObject(self.compensationRequests[roundNr].find(cr => cr.number === player.number), 'compensationRequests', 1);

                            let requestSubmitted = player.role === 3 ? 'Yes' : '';

                            console.log(`Player ${player.number} (${player.role}): `);
                            console.log(compensationReq);

                            if (compensationReq == null && player.role === 3) {
                                compensationReq = 0;
                                requestSubmitted = 'No';
                            }

                            const compensationOffer = self.compensationOffers[roundNr][1];
                            const compensationOfferNumber = isNaN(parseInt(compensationOffer)) ? 0 : parseInt(compensationOffer);

                            //const requestSubmitted = player.role != 2 ? (isNaN(parseInt(compensationReq)) ? 'No' : 'Yes') : '';
                            const compensationReqNumber = isNaN(parseInt(compensationReq)) ? 0 : parseInt(compensationReq);
                            const compensationDelta = player.role != 2 ? (compensationOfferNumber - compensationReqNumber) : '';
                            const offerSubmitted = player.role === 2 ? (isNaN(parseInt(compensationOffer)) ? 'No' : 'Yes') : '';

                            let total = values[winningCondition];

                            let compensationOfferWinningCondition = 0;

                            if (
                                    self.compensationOffers != null &&
                                    self.compensationOffers[roundNr] != null &&
                                    self.compensationOffers[roundNr][winningCondition] != null &&
                                    !isNaN(parseInt(self.compensationOffers[roundNr][winningCondition]))
                            ) {
                                compensationOfferWinningCondition = parseInt(self.compensationOffers[roundNr][winningCondition]);
                            }

                            if (player.role === 2) {
                                total -= self.players.filter(p => p.role === 3).length * compensationOfferWinningCondition;
                            } else {
                                total += compensationOfferWinningCondition;
                            }

                            let playerReward;

                            if (self.rewards != null) {
                                playerReward = self.rewards.find(r => r.number === player.number);
                            }

                            const survey = self.surveys.find(s => s.number === player.number);

                            xls.push([self.startTime,self.dataset,player.number,round.round, player.tag, player.role, self.ruleset, values[0], values[1],
                            '',compensationReq, requestSubmitted, compensationOfferNumber, offerSubmitted, compensationDelta, self.getCompensationAccepted(round.round, player.number, 1),
                            self.getStandingCounter(round.round, 1), total, winningCondition === 1 ? 'Yes' : 'No', bestConditions.includes(winningCondition) ? 'Yes' : 'No', self.rewardRound,
                            playerReward?.basePoints, playerReward?.profit, playerReward?.points, playerReward?.factor, playerReward?.exchange, playerReward?.reward, player.paymentToken,
                            survey?.age, survey?.gender, survey?.yearOfStudy, survey?.faculty, survey?.risk
                            ]);
                        });
                    } catch (e) {
                        console.log(`Couldn't process round: ${e.message}`);
                    }
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
            getCompensationRequest(roundNumber, number, condition) {
                const compensationRequests = this.compensationRequests[roundNumber].find(acd => acd.number === number);

                if (compensationRequests == null || compensationRequests.compensationRequests == null) {
                    return null;
                }

                return compensationRequests.compensationRequests[condition];
            },
            getCompensationOffered(roundNumber, condition) {
                if (this.compensationOffers[roundNumber][condition] == null) {
                    return null;
                }

                return this.formatUs(this.compensationOffers[roundNumber][condition]);
            },
            getCompensationAccepted(roundNumber, number, condition) {
                const player = this.players.find(p => p.number === number);

                if (player == null || player.role != 3) {
                    return '';
                }

                const playerCompensationDecisions = this.compensationDecisions[roundNumber].find(acd => acd.number === number);

                if (playerCompensationDecisions == null || playerCompensationDecisions.compensationDecisions == null) {
                    return 'Abs';
                }

                return playerCompensationDecisions.compensationDecisions.includes(condition) ? 'Yes' : 'No';
            },
            getCompensationReceived(roundNumber, role) {
                const jackpot = this.compensationOffers[roundNumber][this.winningCondition[roundNumber]];

                console.log('jackpot: ' + jackpot);

                if (jackpot == null || jackpot === 0) {
                    return 0;
                }

                if (role === 3) {
                    return this.formatUs(jackpot);
                } else {
                    return this.formatUs( - (this.players.length - 1 ) * jackpot );
                }
            },
            getTotalProfit(roundNumber, player) {
                const compensationOffers = this.compensationOffers[roundNumber];
                const winningCondition = this.winningCondition[roundNumber];
                
                const jackpot = compensationOffers[winningCondition];

                const playerValue = this.getPlayerValues(player.number, roundNumber)[winningCondition];

                if (player.role === 3) {
                    return this.formatUs(playerValue + jackpot);
                } else {
                    return this.formatUs(playerValue - (this.players.length - 1 ) * jackpot);
                }
            },
            getPlayerValues(playerNumber, roundNumber) {
                if (
                    this.playerValues == null ||
                    this.playerValues[roundNumber] == null
                ) {
                    console.log(`WITH ROUND ${roundNumber} PLAYER ${playerNumber}`);
                    return null;
                }

                return this.playerValues[roundNumber].find(p => p.number === playerNumber).values;
            },
            getStandingCounter(roundNumber, condition) {
                if (
                    this.standings == null ||
                    this.standings[roundNumber] == null ||
                    this.standings[roundNumber][condition] == null
                ) {
                    console.log(`WITH ROUND ${roundNumber} CONDITION ${condition}`);
                    return null;
                }

                return this.standings[roundNumber][condition].counter;
            },
            getStandingValue(roundNumber, condition) {
                if (
                    this.standings == null ||
                    this.standings[roundNumber] == null ||
                    this.standings[roundNumber][condition] == null
                ) {
                    console.log(`WITH ROUND ${roundNumber} CONDITION ${condition}`);
                    return null;
                }

                return this.standings[roundNumber][condition].value;
            },
            getWinningCondition(roundNumber) {
                return this.winningCondition[roundNumber];
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

            const surveyResponse = await this.$http.get("/games/surveys", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.rewardRound = response.data.data.rewardRound;
            this.ruleset = response.data.data.ruleset;
            this.surveys = surveyResponse.data.data.records;

            function extractProperty (rounds, phase, property) {
                const result = [];

                rounds.forEach(r => {
                    if (r.phase[phase] == null) {
                        result.push(null);
                        return
                    }

                    result.push(r.phase[phase][property]);
                })

                return result;
            }

            this.ruleset = response.data.data.ruleset;
            this.dataset = response.data.data.dataset;
            this.conditions = response.data.data.conditions;
            this.players = response.data.data.players;
            this.rounds = response.data.data.results;
            this.startTime = response.data.data.startTime;
            this.rewards = response.data.data.rewards;
            
            this.playerValues = extractProperty(this.rounds, 1, 'players');
            this.compensationRequests = extractProperty(this.rounds, 3, 'compensationRequests');
            this.compensationOffers = extractProperty(this.rounds, 4, 'compensationOffers');
            this.compensationDecisions = extractProperty(this.rounds, 6, 'compensationDecisions');
            this.standings = extractProperty(this.rounds, 7, 'standings');
            this.winningCondition = extractProperty(this.rounds, 7, 'winningCondition');

            console.log(response.data.data);

            window.vue = this;
        }
    }
</script>