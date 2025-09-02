<template>
    <b-container fluid class="no-gutters">

        <b-navbar id="navbar" toggleable="md" type="dark" variant="info" style="margin-left: -15px; margin-right: -15px;">
            <b-navbar-nav>
                <b-nav-item active>Ruleset: Goods Market</b-nav-item>
            </b-navbar-nav>
            <div class="container justify-content-center">
                <b-navbar-brand>
                    Goods Market Results
                </b-navbar-brand>
            </div>
            <b-navbar-nav class="ml-auto">
                <button :disabled="results == null || results.length === 0" class="btn btn-success" @click="exportXlsx">Export</button>
            </b-navbar-nav>
        </b-navbar>

        <b-row>
            <b-col>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <tr style="text-align: center;">
                            <th scope="col"></th>
                            <th scope="col" colspan="2">Median Valuations</th>
                            <th scope="col" colspan="4">Initial Wallet</th>
                            <th scope="col" colspan="4">Final Wallet</th>
                            <th scope="col"></th>
                        </tr>
                        <tr>
                            <th scope="col">Player</th>
                            <th scope="col">High Quality Good</th>
                            <th scope="col">Low Quality Good</th>
                            <th scope="col">Cash</th>
                            <th scope="col">High Quality Goods</th>
                            <th scope="col">Low Quality Goods</th>
                            <th scope="col">Total</th>
                            <th scope="col">Cash</th>
                            <th scope="col">High Quality Goods</th>
                            <th scope="col">Low Quality Goods</th>
                            <th scope="col">Total</th>
                            <th scope="col">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in results" :key="entry.id">
                            <td>{{ entry.number }}</td>
                            <td>{{ entry.signals.highQualitySignal }}</td>
                            <td>{{ entry.signals.lowQualitySignal }}</td>
                            <td>{{ entry.initialWallet.cash }}</td>
                            <td>{{ entry.initialWallet.goods.filter(g => g.quality === 'good').length }}</td>
                            <td>{{ entry.initialWallet.goods.filter(g => g.quality === 'bad').length }}</td>
                            <td>{{ getInitialWalletValue(entry) }}</td>
                            <td>{{ entry.finalWallet.cash }}</td>
                            <td>{{ entry.finalWallet.goods.filter(g => g.quality === 'good').length }}</td>
                            <td>{{ entry.finalWallet.goods.filter(g => g.quality === 'bad').length }}</td>
                            <td>{{ getFinalWalletValue(entry) }}</td>
                            <td>{{ getProfit(entry) }}</td>
                        </tr>
                        <tr>
                            <td colspan = "11"><b>Total Welfare</b></td>
                            <td><b>{{ results?.reduce((acc, r) => Math.round((acc + getProfit(r)) * 100) / 100, 0) }}</b></td>
                        </tr>
                    </tbody>
                </table>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import dictionary from '../../assets/goods-market.json';
    import * as GoodMarketService from '../../services/GoodsMarketService';

    export default {
        data() {
            return {
                gameId: null,
                results: null,
                players: null,
                highQualityValue: null,
                lowQualityValue: null
            };
        },
        components: {
        },
        name: 'GoodsMarketTradingLog',
        created() {
        },
        methods: {
            getInitialWalletValue(result) {
                const wallet = result.initialWallet;

                let value = wallet.cash;

                value += wallet.goods.filter(g => g.quality === 'good').length * result.signals.highQualitySignal;
                value += wallet.goods.filter(g => g.quality === 'bad').length * result.signals.lowQualitySignal;

                return value.toFixed(2);
            },
            getFinalWalletValue(result) {
                const wallet = result.finalWallet;

                let value = wallet.cash;

                value += wallet.goods.filter(g => g.quality === 'good').length * result.signals.highQualitySignal;
                value += wallet.goods.filter(g => g.quality === 'bad').length * result.signals.lowQualitySignal;

                return value.toFixed(2);
            },
            getProfit(result) {
                const expected = Math.round((this.getFinalWalletValue(result) - this.getInitialWalletValue(result)) * 100) / 100;

                if (expected !== result.profit) {
                    throw new Error(`Profit mismatch for player ${result.number}: expected ${expected}, got ${result.profit}`);
                }

                return expected;
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
                await GoodMarketService.downloadResults(this.gameId, this.results);
            }
        },
        async mounted () {
            const self = this;

            const token = localStorage.getItem("token");

            this.gameId = parseInt(this.$route.params.id);

            const gameData = await this.$http.get("/games/data", {
                params: {
                    token,
                    game_id: self.gameId
                }
            });

            this.players = gameData.data.data.players.filter(p => p.role != 0);

            this.results = gameData.data.data.results[1].phase[2].profits.filter (profit => this.players.find(pl => pl.number === profit.number) != null);

            this.highQualityValue = gameData.data.data.parameters.high_quality_value;
            this.lowQualityValue = gameData.data.data.parameters.low_quality_value;
        }
    }
</script>