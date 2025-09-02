<template>
    <b-col>
        <div class="d-flex flex-column h-100">
            <div>
                <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                    <b-navbar-nav>
                        <b-nav-item active>Ruleset: Goods Market</b-nav-item>
                    </b-navbar-nav>
                    <div class="container justify-content-center">
                        <b-navbar-brand>
                            Goods Market Trading Log
                        </b-navbar-brand>
                    </div>
                    <b-navbar-nav class="ml-auto">
                        <button :disabled="marketLog == null || marketLog.length === 0" class="btn btn-success" @click="exportXlsx">Export</button>
                    </b-navbar-nav>
                </b-navbar>
            </div>

            <div>
                <b-card no-body>
                    <b-row>
                        <b-col>
                            <table class="table table-bordered">
                                <thead class="thead-dark">
                                    <tr>
                                        <th scope="col">Time</th>
                                        <th scope="col">Round</th>
                                        <th scope="col">Actor</th>
                                        <th scope="col">Action</th>
                                        <th scope="col">Price</th>
                                        <th scope="col">Buyer</th>
                                        <th scope="col">Seller</th>
                                        <th scope="col">Best Bid</th>
                                        <th scope="col">Best Ask</th>
                                        <th scope="col">Book</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="entry in marketLog" :key="entry.id">
                                        <td>{{ formatTimestamp(entry.time) }}</td>
                                        <td>{{ entry.round }}</td>
                                        <td>{{ entry.actor == null ? '' : entry.actor.number }}</td>
                                        <td>{{ entry.action }}</td>
                                        <td>{{ formatNumber(entry.price) }}</td>
                                        <td>{{ entry.buyer == null ? '' : entry.buyer.number }}</td>
                                        <td>{{ entry.seller == null ? '' : entry.seller.number }}</td>
                                        <td>{{ formatNumber(entry.bestBid) }}</td>
                                        <td>{{ formatNumber(entry.bestAsk) }}</td>
                                        <td>{{ entry.book }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </b-col>
                    </b-row>
                </b-card>
            </div>
        </div>
    </b-col>
</template>

<script>
    import * as GoodsMarketService from '../../services/GoodsMarketService';
    import dictionary from '../../assets/goods-market.json';

    export default {
        data() {
            return {
                gameId: null,
                marketLog: null,
                players: null
            };
        },
        components: {
        },
        name: 'GoodsMarketTradingLog',
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
            formatTimestamp(timestamp) {
                if (timestamp == null || typeof timestamp != 'number') {
                    return timestamp;
                }

                const options = {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }

                return new Date(timestamp).toLocaleString(dictionary.parameters.format, options);
            },
            async exportXlsx() {
                await GoodsMarketService.downloadMarketLog(this.gameId, this.marketLog);
            }
        },
        async mounted () {
            const self = this;

            const token = localStorage.getItem("token");

            this.gameId = parseInt(this.$route.params.id);

            const response = await this.$http.get("games/goods-market/market-log", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.players = response.data.data.players;
            this.marketLog = response.data.data.marketLog;
        }
    }
</script>