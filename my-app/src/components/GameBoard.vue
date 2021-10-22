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
                    <b-nav-item active v-if="game.phase === 6">Balance: {{ player.balance }}</b-nav-item>
                    <b-nav-item active v-if="game.phase === 6">Shares: {{ player.shares }}</b-nav-item>
                    <b-nav-item active >Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active >Phase: {{ game.phase }}</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </div>
        <div class="mt-1 mx-5 ">
            <div class="alert" :class="item.style" v-for="item in lastThreeMessages" :key="item.id">
                {{ item.message }}
            </div>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="![0,6,9].includes(game.phase) && player.role > 1">
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
                <tbody :key="updateSpeculationTable">
                    <tr v-for="declaration in game.declarations" :key="declaration.id">
                        <td>{{ declaration.name }}</td>
                        <td>{{ declaration.owner }}</td>
                        <td>
                            <div class="row">
                                <div class="col">
                                    {{ formatNumber(declaration.d[0]) }}
                                </div>
                                <div class="col">
                                    <button v-if="declaration.available[0]" type="button" @click='sendPurchaseIntention(declaration.id, 0)' class="btn btn-primary">Buy</button>
                                    <p v-if="!declaration.available[0]">Sold</p>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="row">
                                <div class="col">
                                    {{ formatNumber(declaration.d[1]) }}
                                </div>
                                <div class="col">
                                    <button v-if="declaration.available[1]" type="button" @click='sendPurchaseIntention(declaration.id, 1)' class="btn btn-primary">Buy</button>
                                    <p v-if="!declaration.available[1]">Sold</p>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="row">
                                <div class="col">
                                    {{ formatNumber(declaration.d[2]) }}
                                </div>
                                <div class="col">
                                    <button v-if="declaration.available[2]" type="button" @click='sendPurchaseIntention(declaration.id, 2)' class="btn btn-primary">Buy</button>
                                    <p v-if="!declaration.available[2]">Sold</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="container justify-content-center">
                <p style="text-align:center;"><button type="button" @click='doneSpeculating()' class="btn btn-primary">I Finished Speculating</button></p>
            </div>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="game.phase === 6 && player.signals != null">
            <div class="container justify-content-center">
                <p style="text-align:center;">Signals</p>
            </div>
            <table class="table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">No Project</th>
                        <th scope="col">Project A</th>
                        <th scope="col">Project B</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ formatNumber(player.signals[0]) }}</td>
                        <td>{{ formatNumber(player.signals[1]) }}</td>
                        <td>{{ formatNumber(player.signals[2]) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <DoubleAuctionMarket v-if="game.phase === 6 && player.signals != null" ref="doubleAuctionMarket" />
    </div>
</template>
<script>
    import DoubleAuctionMarket from './DoubleAuctionMarket.vue';

    const roleMap = {
        1: "Speculator",
        2: "Developer",
        3: "Owner"
    };

    const styleMap = {
        "success": "alert-success",
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
                updateSpeculationTable: 0,
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
                    number: 0,
                    recoveryString: null,
                    role: null,
                    balance: 0,
                    shares: 0,
                    property: null,
                    declaration: [0, 0, 0]
                },
            };
        },
        components: {
            DoubleAuctionMarket
        },
        name: 'GameBoard',
        created() {
            window.addEventListener("load", this.openWebSocket);
        },
        methods: {
            sendPurchaseIntention(id, condition) {
                const self = this;

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "purchase-lot",
                    "lot": {
                        "id": id,
                        "condition": condition
                    }
                });
            },
            doneSpeculating() {
                const self = this;

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "done-speculating"
                });
            },
            conditionToString(c) {
                return conditionMap[c];
            },
            submitDeclaration() {
                const self = this;

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "declare",
                    "declaration": [
                        parseInt(self.player.declaration[0]),
                        parseInt(self.player.declaration[1]),
                        parseInt(self.player.declaration[2])
                    ]
                });
            },
            formatNumber(num) {
                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
            },
            sendMessage(msg) {
                this.connection.send(JSON.stringify(msg));
            },
            pushMessage(type, content) {
                const self = this;

                self.messages.push({
                    id: self.messages.length,
                    type: type,
                    message: content,
                    style: styleMap[type]
                });

                if (self.lastThreeMessages.length < 3) {
                    self.lastThreeMessages = [self.messages[self.messages.length - 1], ...self.lastThreeMessages];
                } else if (self.lastThreeMessages.length >= 3) {
                    self.lastThreeMessages = [self.messages[self.messages.length - 1], self.lastThreeMessages[0], self.lastThreeMessages[1]];
                }
            },
            openWebSocket() {
                const self = this;

                this.connection = new WebSocket(process.env.VUE_APP_WSS);

                this.connection.onmessage = function(event) {
                    const ev = JSON.parse(event.data);

                    if (ev.type === "event") {
                        //TODO: give structure to this logic
                        console.log(`New event: ${ev.eventType}`);
                        console.log(ev.data);

                        switch(ev.eventType) {    
                            case "assign-name":
                                self.player.name = ev.data.name;
                                self.player.title = ev.data.name;
                                self.player.number = ev.data.number;
                                self.player.recoveryString = ev.data.recoveryString;
                                self.game.ruleset = ev.data.ruleset;
                                console.log('Recovery string: ' + self.player.recoveryString);
                                break;
                            case "assign-role":
                                self.player.role = ev.data.role;
                                self.player.title += ` (${roleMap[ev.data.role]})`;
                                self.player.balance = ev.data.balance;
                                self.player.shares = ev.data.shares;
                                if (ev.data.property != null) {
                                    self.player.property = ev.data.property;
                                    self.player.declaration[0] = ev.data.property.v[0];
                                    self.player.declaration[1] = ev.data.property.v[1];
                                    self.player.declaration[2] = ev.data.property.v[2];
                                    console.log(ev.data.property);
                                }
                                break;
                            case "phase-transition":
                                self.game.round = ev.data.round;
                                self.game.phase = ev.data.phase;
                                break;
                            case "declarations-published":
                                self.game.declarations = ev.data;
                                console.log(self.game.declarations);
                                //TODO
                                break;
                            case "lot-sold-to-speculator": {
                                const declaration = self.game.declarations.find(d => d.id === ev.data.id);

                                if (declaration != null) {
                                    declaration.available[ev.data.condition] = false;
                                    console.log(`Property ${declaration.name} is not available any more under condition ${conditionMap[ev.data.condition]}`);
                                } else {
                                    console.error(`Declaration ${ev.data.id} not found.`);
                                }

                                self.updateSpeculationTable ++;

                                break;
                            }
                            case "speculation-with-profit": {
                                let msgContent = "";
                                let msgType = ""

                                if (ev.data.profit > 0) {
                                    msgType = "success";
                                    msgContent = `You have just realised a profit of ${ev.data.profit} on the speculation on ${ev.data.property.name}`;
                                } else {
                                    msgType = "warning";
                                    msgContent = `You have just realised a loss of ${-ev.data.profit} on the speculation on ${ev.data.property.name}`;
                                }

                                self.pushMessage(msgType, msgContent);
                                break;
                            }
                            case "value-signals": {
                                self.player.signals = ev.data.signals;
                                self.pushMessage("info", `Your signals: ${ev.data.signals}`);
                                break;
                            }
                            case "add-order":
                                self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "add");
                                break;
                            case "delete-order":
                                self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "delete");
                                break;
                            case "update-order":
                                self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "update");
                                break;
                            case "asset-movement": {
                                self.player.balance = ev.data.balance;
                                self.player.shares = ev.data.shares;

                                const movement = ev.data.movement;

                                if (movement.type == "purchase") {
                                    self.pushMessage("info", `Your bought ${movement.quantity} at ${movement.price} per shares for a total of ${movement.total}`);
                                } else if (movement.type == "sale") {
                                    self.pushMessage("info", `Your sold ${movement.quantity} at ${movement.price} per shares for a total of ${movement.total}`);
                                }

                                break;
                            }
                            case "tax-income":
                                self.pushMessage("info", `You have made a tax income of ${ev.data.amount}`);
                                break;
                            case "total-profit":
                                if (ev.data.amount >= 0) {
                                    self.pushMessage("success", `You have made a total profit of ${ev.data.amount}`);
                                } else {
                                    self.pushMessage("error", `You have made a total loss of ${-ev.data.amount}`);
                                }
                                break;
                            default:
                                console.error(`Type ${ev.type} was not understood`);
                        }
                    } else { //it is a message
                        self.pushMessage(ev.type, ev.message);
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