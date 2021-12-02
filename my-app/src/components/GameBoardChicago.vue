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

        <div class="mt-1 mx-5 mp-1" v-if="![0,6].includes(game.phase)">
            <div class="row">
                <div class="col-6">

                    <div class="row-12">
                        <div class="text-center"><b>Declarations</b></div>
                        <b-form-checkbox-group
                            id="checkbox-group-1"
                            v-model="checkedPlots"
                            name="checkedPlots"
                        >

                        <table class="table table-bordered">
                            <tbody>
                                <tr>
                                    <td>
                                        <div>{{ getDeclarationPlayer(0) }}</div>
                                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                            <div class="container text-center">
                                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                                 && game.declarations[0] != null && game.declarations[0].available[game.winningCondition]" :value="game.declarations[0].id" />
                                                {{ game.declarations[0] == null ? '-' : game.declarations[0].d[game.winningCondition] }} ({{ getSniperProbability(0)}}%)
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{{ getDeclarationPlayer(1) }}</div>
                                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                            <div class="container text-center">
                                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                                 && game.declarations[1] != null && game.declarations[1].available[game.winningCondition]" :value="game.declarations[1].id" />
                                                {{ game.declarations[1] == null ? '-' : game.declarations[1].d[game.winningCondition] }} ({{ getSniperProbability(1)}}%)
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{{ getDeclarationPlayer(2) }}</div>
                                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                            <div class="container text-center">
                                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                                 && game.declarations[2] != null && game.declarations[2].available[game.winningCondition]" :value="game.declarations[2].id" />
                                                {{ game.declarations[2] == null ? '-' : game.declarations[2].d[game.winningCondition] }} ({{ getSniperProbability(2)}}%)
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div>{{ getDeclarationPlayer(3) }}</div>
                                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                            <div class="container text-center">
                                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                                 && game.declarations[3] != null && game.declarations[3].available[game.winningCondition]" :value="game.declarations[3].id" />
                                                {{ game.declarations[3] == null ? '-' : game.declarations[3].d[game.winningCondition] }} ({{ getSniperProbability(3)}}%)
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{{ getDeclarationPlayer(4) }}</div>
                                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                            <div class="container text-center">
                                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                                 && game.declarations[4] != null && game.declarations[4].available[game.winningCondition]" :value="game.declarations[4].id" />
                                                {{ game.declarations[4] == null ? '-' : game.declarations[4].d[game.winningCondition] }} ({{ getSniperProbability(4)}}%)
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{{ getDeclarationPlayer(5) }}</div>
                                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                            <div class="container text-center">
                                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                                 && game.declarations[5] != null && game.declarations[5].available[game.winningCondition]" :value="game.declarations[5].id" />
                                                {{ game.declarations[5] == null ? '-' : game.declarations[5].d[game.winningCondition] }} ({{ getSniperProbability(5)}}%)
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        </b-form-checkbox-group>
                    </div>

                    <div class="row justify-content-center" v-if="player.role == 1 && (game.phase === 3 || game.phase === 8)">
                        <div class="col-6 text-center">
                            <button type="button" @click='doneSpeculating()' class="btn btn-primary">Submit</button>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-6">
                            <div class="text-center"><b>Owners' Value Ranges</b></div>
                            <table class="table table-bordered">
                                <thead>
                                    <th scope="col">Condition</th>
                                    <th scope="col">Minimum Value</th>
                                    <th scope="col">Maximum Value</th>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Status Quo</td>
                                        <td>{{ game.boundaries.owner.noProject.low }}</td>
                                        <td>{{ game.boundaries.owner.noProject.high }}</td>
                                    </tr>
                                    <tr>
                                        <td>Project A</td>
                                        <td>{{ game.boundaries.owner.projectA.low }}</td>
                                        <td>{{ game.boundaries.owner.projectA.high }}</td>
                                    </tr>
                                    <tr>
                                        <td>Project B</td>
                                        <td>{{ game.boundaries.owner.projectB.low }}</td>
                                        <td>{{ game.boundaries.owner.projectB.high }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="col-6">
                            <div class="text-center"><b>Developers' Value Ranges</b></div>
                            <table class="table table-bordered">
                                <thead>
                                    <th scope="col">Condition</th>
                                    <th scope="col">Minimum Value</th>
                                    <th scope="col">Maximum Value</th>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Status Quo</td>
                                        <td>{{ game.boundaries.developer.noProject.low }}</td>
                                        <td>{{ game.boundaries.developer.noProject.high }}</td>
                                    </tr>
                                    <tr>
                                        <td>Project A</td>
                                        <td>{{ game.boundaries.developer.projectA.low }}</td>
                                        <td>{{ game.boundaries.developer.projectA.high }}</td>
                                    </tr>
                                    <tr>
                                        <td>Project B</td>
                                        <td>{{ game.boundaries.developer.projectB.low }}</td>
                                        <td>{{ game.boundaries.developer.projectB.high }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="col-6">
                    <!-- Actions -->
                    <div class="row" v-if="player.role > 1">
                        <div class="text-center"><b>My Value Information</b></div>
                        <table class="table table-bordered">
                            <thead>
                                <th scope="col">Condition</th>
                                <th scope="col">Value</th>
                                <th scope="col">Declaration</th>
                                <th scope="col">Tax Bill</th>
                                <th scope="col">Profit</th>
                                <th scope="col">Sniper Prob.</th>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Status Quo</td>
                                    <td>{{ player.property.v[0] }}</td>
                                    <td><input v-if="game.phase == 2 || game.winningCondition == 0" type="number" class="form-control" v-model="player.declaration[0]" name="player_declaration_0" id="player_declaration_0" aria-describedby="emailHelp" placeholder="500000" /></td>
                                    <td>{{ player.declaration[0] * game.taxRate / 100 }}</td>
                                    <td>{{ player.declaration[0] * ( 100 - game.taxRate) / 100 }}</td>
                                    <td>{{ (player.boundaries.noProject.high - player.declaration[0]) * 100 / (player.boundaries.noProject.high - player.boundaries.noProject.low) }}%</td>
                                </tr>
                                <tr>
                                    <td>Project A</td>
                                    <td>{{ player.property.v[1] }}</td>
                                    <td><input v-if="game.phase == 2 || game.winningCondition == 1" type="number" class="form-control" v-model="player.declaration[1]" name="player_declaration_1" id="player_declaration_1" aria-describedby="emailHelp" placeholder="500000" /></td>
                                    <td>{{ player.declaration[1] * game.taxRate / 100 }}</td>
                                    <td>{{ player.declaration[1] * ( 100 - game.taxRate) / 100 }}</td>
                                    <td>{{ (player.boundaries.projectA.high - player.declaration[1]) * 100 / (player.boundaries.projectA.high - player.boundaries.projectA.low) }}%</td>
                                </tr>
                                <tr>
                                    <td>Project B</td>
                                    <td>{{ player.property.v[2] }}</td>
                                    <td><input v-if="game.phase == 2 || game.winningCondition == 2" type="number" class="form-control" v-model="player.declaration[2]" name="player_declaration_2" id="player_declaration_2" aria-describedby="emailHelp" placeholder="500000" /></td>
                                    <td>{{ player.declaration[2] * game.taxRate / 100 }}</td>
                                    <td>{{ player.declaration[2] * ( 100 - game.taxRate) / 100 }}</td>
                                    <td>{{ (player.boundaries.projectB.high - player.declaration[2]) * 100 / (player.boundaries.projectB.high - player.boundaries.projectB.low) }}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="row justify-content-center" v-if="player.role > 1">
                        <div class="col-6 text-center">
                            <button type="button" @click='showPreview()' class="btn btn-primary">Preview</button>
                        </div>
                        <div class="col-6 text-center">
                            <button v-if="game.phase === 2 || game.phase === 7" type="button" @click='submitDeclaration()' class="btn btn-primary" >Submit</button>
                        </div>
                    </div>

                    <div class="row" v-if="player.role > 1">
                        <div class="text-center"><b>Results</b></div>
                        <table class="table table-bordered">
                            <thead>
                                <th scope="col">Round</th>
                                <th scope="col">Condition</th>
                                <th scope="col">Value</th>
                                <th scope="col">Declaration</th>
                                <th scope="col">Sniped</th>
                                <th scope="col">Snipe Profit/Loss</th>
                                <th scope="col">Taxes</th>
                                <th scope="col">Round Profit</th>
                            </thead>
                            <tbody>
                                <tr v-for="pEv in player.profitEvents" :key="pEv.id">
                                    <td>{{pEv.round}}.{{pEv.phase}}</td>
                                    <td>{{pEv.condition}}</td>
                                    <td>{{pEv.value}}</td>
                                    <td>{{pEv.declaration}}</td>
                                    <td>{{pEv.sniped ? 'Y' : 'N'}}</td>
                                    <td>{{pEv.snipeProfit}}</td>
                                    <td>{{pEv.taxes}}</td>
                                    <td>{{pEv.total}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="row" v-if="player.role == 1">
                        <div class="text-center"><b>Results</b></div>
                        <table class="table table-bordered">
                            <thead>
                                <th scope="col">Round</th>
                                <th scope="col">Condition</th>
                                <th scope="col">Property</th>
                                <th scope="col">Declaration</th>
                                <th scope="col">Sniped</th>
                                <th scope="col">Profit</th>
                            </thead>
                            <tbody>
                                <tr v-for="pEv in player.profitEvents" :key="pEv.id">
                                    <td>{{pEv.round}}.{{pEv.phase}}</td>
                                    <td>{{pEv.condition}}</td>
                                    <td>{{pEv.property}}</td>
                                    <td>{{pEv.declaration}}</td>
                                    <td>{{pEv.sniped ? 'Y' : 'N'}}</td>
                                    <td>{{pEv.snipeProfit}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <DoubleAuctionMarketChicago ref="doubleAuctionMarket" v-if="game.phase === 6"/>

    </div>
</template>
<script>
    import DoubleAuctionMarketChicago from './DoubleAuctionMarketChicago.vue';

    const roleMap = {
        1: "Sniper",
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
                checkedPlots: [],
                game: {
                    round: 1,
                    phase: 0,
                    ruleset: "",
                    properties: [],
                    declarations: [],
                    boundaries: null,
                    taxRate: null
                },
                player: {
                    title: "Starting ...",
                    name: "",
                    number: 0,
                    recoveryString: null,
                    role: null,
                    balance: 0,
                    shares: 0,
                    property: null,
                    declaration: [0, 0, 0],
                    profitEvents: []
                },
            };
        },
        components: {
            DoubleAuctionMarketChicago
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
            getSniperProbability(i){
                const declaration = this.game.declarations[i];

                if (declaration == null) {
                    console.log(`Could not find declaration ${i}`);
                    return null;
                }

                let boundaries = this.game.boundaries;

                if (declaration.role === 2) {
                    boundaries = this.game.boundaries.developer;
                } else if (declaration.role === 3) {
                    boundaries = this.game.boundaries.owner;
                } else {
                    console.log(`Role of player should be 2 or 3: ${declaration.role}`);
                    return null;
                }

                let low = null, high = null;

                if (this.game.winningCondition === 0) {
                    low = boundaries.noProject.low;
                    high = boundaries.noProject.high;
                } else if (this.game.winningCondition === 1) {
                    low = boundaries.projectA.low;
                    high = boundaries.projectA.high;
                } else if (this.game.winningCondition === 2) {
                    low = boundaries.projectB.low;
                    high = boundaries.projectB.high;
                }

                if (low == null || high == null) {
                    console.log(`Something wrong with the winning condition: ${this.game.winningCondition}`);
                    return null;
                }

                const value = declaration.d[this.game.winningCondition];

                return (high - value) * 100 / (high - low);
            },
            getDeclarationPlayer(i) {
                const declaration = this.game.declarations[i];

                if (declaration == null) {
                    console.log(`Could not find declaration ${i}`);
                    return 'Unavailable';
                }

                return roleMap[declaration.role] + ' ' + declaration.number;
            },
            doneSpeculating() {
                const self = this;

                console.log('Checked plots: ' + this.checkedPlots);

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "done-speculating",
                    "snipe": this.checkedPlots
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
            showPreview() {
                //TODO
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
                                self.player.title = `Player ${ev.data.number}`;
                                self.player.number = ev.data.number;
                                self.player.recoveryString = ev.data.recoveryString;
                                self.game.ruleset = ev.data.ruleset;
                                console.log('Recovery string: ' + self.player.recoveryString);
                                break;
                            case "assign-role":
                                self.game.boundaries = ev.data.boundaries;
                                self.game.taxRate = ev.data.taxRate;
                                self.player.boundaries 
                                self.player.role = ev.data.role;
                                self.player.title += ` (${roleMap[ev.data.role]})`;
                                self.player.balance = ev.data.balance;
                                self.player.shares = ev.data.shares;

                                if (self.player.role == 2) {
                                    self.player.boundaries = self.game.boundaries.developer;
                                } else if (self.player.role == 3) {
                                    self.player.boundaries = self.game.boundaries.owner;
                                }

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
                                self.game.declarations = ev.data.declarations;
                                self.game.winningCondition = ev.data.winningCondition;

                                console.log(self.game.declarations);

                                break;
                            case "lot-sold-to-speculator": {
                                const declaration = self.game.declarations.find(d => d.id === ev.data.id);

                                if (declaration != null) {
                                
                                    declaration.available[ev.data.condition] = false;
                                    console.log(`Property ${declaration.name} is not available any more under condition ${conditionMap[ev.data.condition]}`);
                                    self.$forceUpdate();
                                } else {
                                    console.error(`Declaration ${ev.data.id} not found.`);
                                }

                                self.updateSpeculationTable ++;

                                break;
                            }
                            case "profit": {
                                if (self.player.role === 1) { //Speculator
                                    self.player.profitEvents.push({
                                        "id": self.player.profitEvents.length,
                                        "round": ev.data.round,
                                        "phase": ev.data.phase,
                                        "condition": conditionMap[ev.data.condition],
                                        "declaration": ev.data.declaration,
                                        "sniped": ev.data.sniped,
                                        "snipeProfit": ev.data.snipeProfit,
                                        "property": `${roleMap[ev.data.role]}-${ev.data.owner}`
                                    });
                                } else { //Owner
                                    self.player.profitEvents.push({
                                        "id": self.player.profitEvents.length,
                                        "round": ev.data.round,
                                        "phase": ev.data.phase,
                                        "condition": conditionMap[ev.data.condition],
                                        "value": ev.data.value,
                                        "declaration": ev.data.declaration,
                                        "sniped": ev.data.sniped,
                                        "snipeProfit": -ev.data.snipeProfit,
                                        "taxes": ev.data.taxes,
                                        "total": ev.data.total
                                    });
                                }
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
                                self.game.winningCondition = ev.data.condition;
                                self.game.taxRate = ev.data.taxRate;
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
                            case "contract-fulfilled": 
                                self.$refs.doubleAuctionMarket.orderEvent(ev.data, "contract");
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
                            case "round-end":
                                self.game.phase = "-";
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

                this.connection.onerror = function() {
                    self.openWebSocket();
                }
            }
        },
        mounted () {
            this.game.id = parseInt(this.$route.params.id);
        }
    }
</script>