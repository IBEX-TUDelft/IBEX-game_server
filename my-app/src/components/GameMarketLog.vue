<template>
    <b-col>
        <div class="d-flex flex-column h-100">
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
                        <button :disabled="marketLog == null || marketLog.length === 0" class="btn btn-success"
                            @click="exportXlsx">Export</button>
                    </b-navbar-nav>
                </b-navbar>
            </div>

            <div>
                <b-card no-body>
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
                                <tbody>
                                    <tr>
                                        <td colspan="100%" style="text-align: center;"></td>
                                    </tr>
                                    <tr v-for="l in marketLog" :key="l.id">
                                        <td>{{ l.time }}</td>
                                        <td>{{ l.round }}.{{ l.phase }}</td>
                                        <td>{{ l.actor == null ? '' : l.actor.number }}</td>
                                        <td>{{ l.action }}</td>
                                        <td>{{ l.quantity }}</td>
                                        <td>{{ formatNumber(l.price) }}</td>
                                        <td>{{ l.buyer == null ? '' : l.buyer.number }}</td>
                                        <td>{{ l.seller == null ? '' : l.seller.number }}</td>
                                        <td>{{ formatNumber(l.bestBid) }}</td>
                                        <td>{{ formatNumber(l.bestAsk) }}</td>
                                        <td>{{ l.book }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </b-card>
            </div>
        </div>
    </b-col>
</template>
<script>
import * as XLSX from "xlsx";

export default {
    data() {
        return {
            roundIndex: 0,
            gameId: null,
            ruleset: null,
            marketLog: null,
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
        getPlayer(number) {
            if (number == null) {
                return 'n/a';
            }

            return this.players.find(p => p.number === number).tag;
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

                const headers = [
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
                ];

                if (this.ruleset === 'Harberger') {
                    xls.push(headers);

                    this.marketLog[index][this.winningConditions[index]].forEach(r => {
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
                    headers.push('Condition');

                    xls.push(headers);

                    this.marketLog[index].forEach((m, i) => {
                        if (i + 1 > this.conditions.length) {
                            return;
                        }

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
                                self.conditions[i].name
                            ]);
                        });
                    });
                }

                /* convert state to workbook */
                const ws = XLSX.utils.aoa_to_sheet(xls);
                XLSX.utils.book_append_sheet(wb, ws, `Round ${index}`);
            });

            /* generate file and send to client */
            XLSX.writeFile(wb, `${this.gameId}.market-log.xlsx`);
        }
    },
    async mounted() {
        const self = this;

        const token = localStorage.getItem("token");

        this.gameId = parseInt(this.$route.params.id);

        const response = await this.$http.get("/games/market/market-log", {
            params: {
                token,
                game_id: self.gameId
            }
        });

        this.players = response.data.data.players;
        this.ruleset = response.data.data.ruleset;
        this.marketLog = response.data.data.marketLog;
    }
}
</script>