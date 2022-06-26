<template>
    <div>
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ ruleset }}</b-nav-item>
                </b-navbar-nav>
                <div class="container justify-content-center">
                    <b-navbar-brand>
                        Market Log
                    </b-navbar-brand>
                </div>
                <b-navbar-nav class="ml-auto">
                    <button :disabled="marketLogs == null || marketLogs.length === 0" class="btn btn-success" @click="exportXlsx">Export</button>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div>
            <b-card no-body>
                <b-tabs card content-class="mt-3" v-model="roundIndex">
                    <b-tab v-for="i in indexes" :key="i">

                        <template #title>
                            Round {{ i + 1 }}
                        </template>

                        <div class="mx-5 mp-1">

                            <div class="row">
                                <table class="table table-bordered">
                                    <thead class="thead-dark">
                                        <th scope="col">Time</th>
                                        <th scope="col">Round</th>
                                        <th scope="col">Actor</th>
                                        <th scope="col">Action</th>
                                        <th scope="col">Quantity</th>
                                        <th scope="col">Price</th>
                                        <th scope="col">Buyer</th>
                                        <th scope="col">Seller</th>
                                        <th scope="col">Best Bid</th>
                                        <th scope="col">Best Ask</th>
                                        <th scope="col">Book</th>
                                    </thead>
                                    <tbody v-if="ruleset === 'Harberger'">
                                        <tr v-for="l in marketLogs[i][winningConditions[i]]" :key="l.id">
                                            <td>{{ l.time }}</td>
                                            <td>{{ l.round }}.{{ l.phase }}</td>
                                            <td>{{ getPlayer(l.actor.number, l.actor.role) }}</td>
                                            <td>{{ l.action }}</td>
                                            <td>{{ l.quantity }}</td>
                                            <td>{{ formatNumber(l.price) }}</td>
                                            <td>{{ l.buyer == null ? '' : getPlayer(l.buyer.number, l.buyer.role) }}</td>
                                            <td>{{ l.seller == null ? '' : getPlayer(l.seller.number, l.seller.role) }}</td>
                                            <td>{{  formatNumber(l.bestBid) }}</td>
                                            <td>{{  formatNumber(l.bestAsk) }}</td>
                                            <td>{{ l.book }}</td>
                                        </tr>
                                    </tbody>
                                    <tbody v-if="ruleset === 'Futarchy'">
                                        <tr><td colspan="100%" style="text-align: center;"><b>No Project</b></td></tr>
                                        <tr v-for="l in marketLogs[i][0]" :key="l.id">
                                            <td>{{ l.time }}</td>
                                            <td>{{ l.round }}.{{ l.phase }}</td>
                                            <td>{{ getPlayer(l.actor.number, l.actor.role) }}</td>
                                            <td>{{ l.action }}</td>
                                            <td>{{ l.quantity }}</td>
                                            <td>{{ formatNumber(l.price) }}</td>
                                            <td>{{ l.buyer == null ? '' : getPlayer(l.buyer.number, l.buyer.role) }}</td>
                                            <td>{{ l.seller == null ? '' : getPlayer(l.seller.number, l.seller.role) }}</td>
                                            <td>{{  formatNumber(l.bestBid) }}</td>
                                            <td>{{  formatNumber(l.bestAsk) }}</td>
                                            <td>{{ l.book }}</td>
                                        </tr>
                                        
                                        <tr><td colspan="100%" style="text-align: center;"><b>Project A</b></td></tr>
                                        <tr v-for="l in marketLogs[i][1]" :key="l.id">
                                            <td>{{ l.time }}</td>
                                            <td>{{ l.round }}.{{ l.phase }}</td>
                                            <td>{{ getPlayer(l.actor.number, l.actor.role) }}</td>
                                            <td>{{ l.action }}</td>
                                            <td>{{ l.quantity }}</td>
                                            <td>{{ formatNumber(l.price) }}</td>
                                            <td>{{ l.buyer == null ? '' : getPlayer(l.buyer.number, l.buyer.role) }}</td>
                                            <td>{{ l.seller == null ? '' : getPlayer(l.seller.number, l.seller.role) }}</td>
                                            <td>{{ formatNumber(l.bestBid) }}</td>
                                            <td>{{ formatNumber(l.bestAsk) }}</td>
                                            <td>{{ l.book }}</td>
                                        </tr>

                                        <tr><td colspan="100%" style="text-align: center;"><b>Project B</b></td></tr>
                                        <tr v-for="l in marketLogs[i][2]" :key="l.id">
                                            <td>{{ l.time }}</td>
                                            <td>{{ l.round }}.{{ l.phase }}</td>
                                            <td>{{ getPlayer(l.actor.number, l.actor.role) }}</td>
                                            <td>{{ l.action }}</td>
                                            <td>{{ l.quantity }}</td>
                                            <td>{{ formatNumber(l.price) }}</td>
                                            <td>{{ l.buyer == null ? '' : getPlayer(l.buyer.number, l.buyer.role) }}</td>
                                            <td>{{ l.seller == null ? '' : getPlayer(l.seller.number, l.seller.role) }}</td>
                                            <td>{{ formatNumber(l.bestBid) }}</td>
                                            <td>{{ formatNumber(l.bestAsk) }}</td>
                                            <td>{{ l.book }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </b-tab>
                </b-tabs>
            </b-card>
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
                roundIndex: 0,
                gameId: null,
                ruleset: null,
                marketLogs: null,
                winningConditions: null,
                indexes: null,
                conditions: null,
                players: null
            };
        },
        components: {
        },
        name: 'GameAnalysis',
        created() {
        },
        methods: {
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
                if (num == null || typeof num != 'number') {
                    return num;
                }

                return num.toLocaleString('en-US');
            },
            exportXlsx() {
                const self = this;

                const wb = XLSX.utils.book_new();

                self.indexes.forEach(index => {
                    const xls = [];

                    xls.push([
                        'Time',
                        'Phase',
                        'Actor',
                        'Action',
                        'Quantity',
                        'Price',
                        'Buyer',
                        'Seller',
                        'Best Bid',
                        'Best Ask',
                        'Book'
                    ]);

                    if (this.ruleset === 'Harberger') {
                        this.marketLogs[index][this.winningConditions[index]].forEach(r => {
                            xls.push([
                                r.time,
                                r.phase,
                                self.getPlayer(r.actor.number, r.actor.role),
                                r.action,
                                r.quantity,
                                r.price,
                                r.buyer == null ? '' : self.getPlayer(r.buyer.number, r.buyer.role),
                                r.seller == null ? '' : self.getPlayer(r.seller.number, r.seller.role),
                                r.bestBid,
                                r.bestAsk,
                                r.book
                            ]);
                        });
                    } else if (this.ruleset === 'Futarchy') {
                        this.marketLogs[index].forEach((m, i) => {
                            m.forEach(r => {
                                xls.push([
                                    r.time,
                                    r.phase,
                                    self.getPlayer(r.actor.number, r.actor.role),
                                    r.action,
                                    r.quantity,
                                    r.price,
                                    r.buyer == null ? '' : self.getPlayer(r.buyer.number, r.buyer.role),
                                    r.seller == null ? '' : self.getPlayer(r.seller.number, r.seller.role),
                                    r.bestBid,
                                    r.bestAsk,
                                    r.book,
                                    conditionMap[i]
                                ]);
                            });
                        });
                    }

                    /* convert state to workbook */
                    const ws = XLSX.utils.aoa_to_sheet(xls);
                    XLSX.utils.book_append_sheet(wb, ws, `Round ${index + 1}`);
                });

                /* generate file and send to client */
                XLSX.writeFile(wb, `${this.gameId}.market-log.xlsx`);
            }
        },
        async mounted () {
            const self = this;

            const token = localStorage.getItem("token");

            this.gameId = parseInt(this.$route.params.id);

            const response = await this.$http.get("/games/market-log", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.players = response.data.data.players;
            this.ruleset = response.data.data.ruleset;
            this.marketLogs = response.data.data.marketLogs;
            this.marketLogs.forEach(round => {
                round.forEach(condition => {
                    condition.forEach((e, i) => {
                        e.id = i;
                    })
                });
            });
            this.indexes = this.marketLogs.map((e, i) => i);
            this.winningConditions = response.data.data.winningConditions;
        }
    }
</script>