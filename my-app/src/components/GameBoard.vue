<template>
    <div>
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-nav-item active>Ruleset: {{ game.ruleset }}</b-nav-item>
                </b-navbar-nav>
                <div class="container justify-content-center">
                    <b-navbar-brand>
                        {{ player.title }}
                    </b-navbar-brand>
                </div>
                <b-navbar-nav class="ml-auto">
                    <b-nav-item active >Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active >Phase: {{ game.phase }}</b-nav-item>
                    <b-nav-item active v-if="game.phase === 6">Balance: {{ player.balance }}</b-nav-item>
                    <b-nav-item active v-if="game.phase === 6">Shares: {{ player.shares }}</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </div>
        <div class="mt-1 mx-5 ">
            <div class="alert" :class="item.style" v-for="item in lastThreeMessages" :key="item.id">
                {{ item.message }}
            </div>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="game.phase > 0 && player.role > 1">
            <div class="container justify-content-center">
                <p style="text-align:center;">Your Property Values Under Different Conditions</p>
            </div>
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Id</th>
                        <th scope="col">Name</th>
                        <th scope="col">No Development</th>
                        <th scope="col">Project A</th>
                        <th scope="col">Project B</th>
                    </tr>
                </thead>
                <tbody>
                        <tr>
                            <td>{{ player.property.id }}</td>
                            <td>{{ player.property.name }}</td>
                            <td>{{ formatNumber(player.property.v[0]) }}</td>
                            <td>{{ formatNumber(player.property.v[1]) }}</td>
                            <td>{{ formatNumber(player.property.v[2]) }}</td>
                        </tr>
                        <tr v-if="(game.phase == 2 || game.phase == 7) && (player.role == 2 || player.role == 3)">
                            <td colspan="2">
                                <button type="button" @click='submitDeclaration()' class="btn btn-danger">Submit Declaration</button>
                            </td>
                            <td>
                                <input type="number" class="form-control" v-model="player.declaration[0]" name="player_declaration_0" id="player_declaration_0" aria-describedby="emailHelp" placeholder="500000" />
                            </td>
                            <td>
                                <input type="number" class="form-control" v-model="player.declaration[1]" name="player_declaration_1" id="player_declaration_1" aria-describedby="emailHelp" placeholder="500000" />
                            </td>
                            <td>
                                <input type="number" class="form-control" v-model="player.declaration[2]" name="player_declaration_2" id="player_declaration_2" aria-describedby="emailHelp" placeholder="500000" />
                            </td>
                        </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="(game.phase === 3 || game.phase === 8) && player.role === 1 && game.declarations != null">
            <div class="container justify-content-center">
                <p style="text-align:center;">Properties and Their Declared Values</p>
            </div>
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Property</th>
                        <th scope="col">Owner</th>
                        <th scope="col">No Project</th>
                        <th scope="col">Project A</th>
                        <th scope="col">Project B</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="declaration in game.declarations" :key="declaration.id">
                        <td>{{ declaration.name }}</td>
                        <td>{{ declaration.owner }}</td>
                        <td>
                            {{ formatNumber(declaration.d[0]) }}
                            <button v-if="purchaseListIncludes(declaration.id, 0)" type="button" @click='addToPurchaseList(declaration.id, 0)' class="btn btn-primary">Buy</button>
                        </td>
                        <td>
                            {{ formatNumber(declaration.d[1]) }}
                            <button v-if="purchaseListIncludes(declaration.id, 1)" type="button" @click='addToPurchaseList(declaration.id, 1)' class="btn btn-primary">Buy</button>
                        </td>
                        <td>
                            {{ formatNumber(declaration.d[2]) }}
                            <button v-if="purchaseListIncludes(declaration.id, 2)" type="button" @click='addToPurchaseList(declaration.id, 2)' class="btn btn-primary">Buy</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="(game.phase === 3 || game.phase === 8) && player.role === 1 && game.declarations != null">
            <div class="container justify-content-center">
                <p style="text-align:center;">Purchase Priority List</p>
            </div>
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Property</th>
                        <th scope="col">Condition</th>
                        <th scope="col">Declared Value</th>
                        <th scope="col">Controls</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in player.lotPurchaseList" :key="order.id">
                        <td>{{ order.name }}</td>
                        <td>{{ conditionToString(order.condition) }}</td>
                        <td>{{ formatNumber(order.declaredValue) }}</td>
                        <td>
                            <button type="button" @click='moveUp(order.id, order.condition)' class="btn btn-success">Up</button>
                            <button type="button" @click='moveDown(order.id, order.condition)' class="btn btn-warning">Down</button>
                            <button type="button" @click='removeFromPurchaseList(order.id, order.condition)' class="btn btn-error">Remove</button>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="5">
                            <button type="button" @click='submitPurchaseList()' class="btn btn-danger">Submit Purchase List</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script>
    const roleMap = {
        1: "Speculator",
        2: "Developer",
        3: "Owner"
    };

    const styleMap = {
        "info": "alert-secondary",
        "notice": "alert-primary",
        "warning": "alert-warning",
        "error": "alert alert-danger",
        "fatal": "alert-dark",
    };

    const conditionMap = {
        0: "No Project",
        1: "Project A",
        2: "Project B",
    }

    export default {
        data() {
            return {
                firstConnection: true,
                connection: null,
                lastThreeMessages: [],
                messages: [],
                game: {
                    round: 1,
                    phase: 0,
                    ruleset: "",
                    properties: [],
                    declarations: null
                },
                player: {
                    title: "Joining ...",
                    name: "",
                    recoveryString: null,
                    role: null,
                    balance: 0,
                    shares: 0,
                    property: null,
                    declaration: [0, 0, 0],
                    lotPurchaseList: null
                },
            };
        },
        components: {
        },
        name: 'GameBoard',
        created() {
            window.addEventListener("load", this.openWebSocket);
        },
        methods: {
            addToPurchaseList(id, condition) {
                //TODO
            },
            moveUp(id, condition) {
                //TODO
            },
            moveDown(id, condition) {
                //TODO
            },
            removeFromPurchaseList(id, condition) {
                //TODO
            },
            purchaseListIncludes(id, condition) {
                //TODO
            },
            submitPurchaseList() {
                //TODO
            },
            conditionToString(c) {
                return conditionMap[c];
            },
            submitDeclaration() {
                const self = this;

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "declare",
                    "declaration": self.player.declaration
                });
            },
            formatNumber(num) {
                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
            },
            sendMessage(msg) {
                this.connection.send(JSON.stringify(msg));
            },
            openWebSocket() {
                const self = this;

                this.connection = new WebSocket(process.env.VUE_APP_WSS);

                this.connection.onmessage = function(event) {
                    const ev = JSON.parse(event.data);

                    if (ev.type === "event") {
                        //TODO: give structure to this logic
                        switch(ev.eventType) {
                            case "assign-name":
                                self.player.name = ev.data.name;
                                self.player.title = ev.data.name;
                                self.player.recoveryString = ev.data.recoveryString;
                                self.game.ruleset = ev.data.ruleset;
                                console.log('Recovery string: ' + self.player.recoveryString);
                                break;
                            case "assign-role":
                                self.player.role = ev.data.role;
                                self.player.title += ` (${roleMap[ev.data.role]})`;
                                self.player.balance = ev.data.balance;
                                self.player.shares = ev.data.shares;
                                self.player.property = ev.data.property;
                                self.player.declaration[0] = ev.data.property.v[0];
                                self.player.declaration[1] = ev.data.property.v[1];
                                self.player.declaration[2] = ev.data.property.v[2];
                                console.log(ev.data.property);
                                break;
                            case "phase-transition":
                                self.game.round = ev.data.round;
                                self.game.phase = ev.data.phase;
                                break;
                            case "declarations-published":
                                self.game.declarations = ev.data.declarations;
                                //TODO
                                break;
                            default:
                                console.error(`Type ${ev.type} was not understood`);
                        }
                    } else { //it is a mesasge
                        self.messages.push({
                            id: self.messages.length,
                            type: ev.type,
                            message: ev.message,
                            style: styleMap[ev.type]
                        });

                        if (self.lastThreeMessages.length < 3) {
                            self.lastThreeMessages = [self.messages[self.messages.length - 1], ...self.lastThreeMessages];
                        } else if (self.lastThreeMessages.length >= 3) {
                            self.lastThreeMessages = [self.messages[self.messages.length - 1], self.lastThreeMessages[0], self.lastThreeMessages[1]];
                        }
                    }
                }

                this.connection.onopen = function() {
                    console.log("Successfully connected to the websocket server...");

                    if (self.firstConnection) {
                        self.sendMessage({
                            "gameId": self.game.id,
                            "type": "join"
                        });
                        self.firstConnection = false;
                    } else {
                        self.sendMessage({
                            "gameId": self.game.id,
                            "type": "rejoin",
                            "recoveryString": self.player.recoveryString
                        });
                    }
                }

                this.connection.onclose = function() {
                    self.openWebSocket();
                }
            }
        },
        mounted () {
            this.game.id = parseInt(this.$route.params.id);
        }
    }
</script>