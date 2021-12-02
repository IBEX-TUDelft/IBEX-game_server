<template>
    <div>
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ ruleset }}</b-nav-item>
                </b-navbar-nav>
                <div class="container justify-content-center">
                    <b-navbar-brand>
                        results
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
                            <td>{{ getValue(d, 'value', 0) }}</td>
                            <td>{{ getValue(d, 'value', 1) }}</td>
                            <td>{{ getValue(d, 'value', 2) }}</td>
                            <td>{{ getValue(d, 'declaration', 0) }}</td>
                            <td>{{ getValue(d, 'declaration', 1) }}</td>
                            <td>{{ getValue(d, 'declaration', 2) }}</td>
                            <td>{{ getValue(d, 'taxes', 0) }}</td>
                            <td>{{ getValue(d, 'taxes', 1) }}</td>
                            <td>{{ getValue(d, 'taxes', 2) }}</td>
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
                            <td></td>
                            <td></td>
                            <td></td>
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
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
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
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
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
                        <tr>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
<script>
    const roleMap = {
        1: "Sniper",
        2: "Developer",
        3: "Owner"
    };

    /*const styleMap = {
        "success": "alert-success",
        "info": "alert-secondary",
        "notice": "alert-primary",
        "warning": "alert-warning",
        "error": "alert alert-danger",
        "fatal": "alert-dark",
    };*/

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

            this.firstDeclarations = response.data.data.firstDeclarations;
        }
    }
</script>