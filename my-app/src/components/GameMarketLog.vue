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
                    <button :disabled="marketLog == null || marketLog.length === 0" class="btn btn-success" @click="exportXlsx">Export</button>
                </div>
            </div>
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
                        <tr v-for="l in marketLog" :key="l.id">
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
                        <tr v-for="l in marketLog[0]" :key="l.id">
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
                        <tr v-for="l in marketLog[1]" :key="l.id">
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
                        <tr v-for="l in marketLog[2]" :key="l.id">
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
                marketLog: null,
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

                const xls = [];

                if (this.ruleset === 'Harberger') {
                    this.marketLog.forEach(r => {
                        xls.push([
                            r.time,
                            r.round + '.' + r.phase,
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
                    this.marketLog.forEach((m, i) => {
                        m.forEach(r => {
                            xls.push([
                                r.time,
                                r.round + '.' + r.phase,
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

                console.log(xls);
                /* convert state to workbook */
                const ws = XLSX.utils.aoa_to_sheet(xls);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
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

            this.ruleset = response.data.data.ruleset;
            this.marketLog = response.data.data.marketLog;
        }
    }
</script>