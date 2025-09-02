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
                            <th scope="col" colspan="2">Player</th>
                            <th scope="col" colspan="3">Values</th>
                            <th scope="col" colspan="3">Wallet</th>
                            <th scope="col"></th>
                        </tr>
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Knows</th>
                            <th scope="col">Private Signal</th>
                            <th scope="col">Public Signal</th>
                            <th scope="col">Real Value</th>
                            <th scope="col">Cash</th>
                            <th scope="col">Shares</th>
                            <th scope="col">Total</th>
                            <th scope="col">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="player in players" :key="player.number">
                            <td>{{ player.number }}</td>
                            <td>{{ ["All (Admin)", "All", "Private", "Public", "Nothing"][player.role] }}</td>
                            <td>{{ player.signal }}</td>
                            <td>{{ results.phase[0].publicSignal }}</td>
                            <td>{{ realValue }}</td>
                            <td>{{ player.wallet.balance }}</td>
                            <td>{{ player.wallet.shares }}</td>
                            <td>{{ (player.wallet.balance + player.wallet.shares * realValue).toFixed(2) }}</td>
                            <td>{{ results.phase[2].profits.find(p => p.number === player.number)?.profit }}</td>
                        </tr>
                    </tbody>
                </table>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
    import dictionary from '../../assets/market.json';
    import * as MarketService from '../../services/MarketService';

    export default {
        data() {
            return {
                gameId: null,
                results: null,
                players: null,
                realValue: null
            };
        },
        components: {
        },
        name: 'GoodsMarketTradingLog',
        created() {
        },
        methods: {
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
                await MarketService.downloadResults(this.gameId, this.results, this.players, this.realValue);
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

            this.players = gameData.data.data.players;
            this.results = gameData.data.data.results[1];
            this.realValue = gameData.data.data.realValue;
        }
    }
</script>