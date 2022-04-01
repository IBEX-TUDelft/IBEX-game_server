<template>
    <div>
        <vue-confirm-dialog></vue-confirm-dialog>
        <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <!--b-nav-item active>Ruleset: {{ game.ruleset }}</b-nav-item-->
                </b-navbar-nav>
                <div class="container justify-content-center">
                    <b-navbar-brand>
                        {{ player.title }}
                    </b-navbar-brand>
                </div>
                <b-navbar-nav class="ml-auto">
                    <b-nav-item active v-if="timer.on === true">Time left: {{ timer.minutes }}:{{ timer.seconds }}</b-nav-item>
                    <b-nav-item active >Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active >Phase: {{ game.phase }}</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="![0,6].includes(game.phase)">
            <div class="row">
                <div class="col-6">

                    <FutarchyMatrix :condition="game.winningCondition" :project="conditionToString(game.winningCondition)"
                     v-if="game.ruleset === 'Futarchy' && game.phase < 7"/>
                    <HarbergerMatrix
                        v-else
                        :condition="game.winningCondition"
                        :project="conditionToString(game.winningCondition)"
                        :game="game"
                        :player="player"
                        :checkedPlots="checkedPlots"
                        :getDeclarationPlayer="getDeclarationPlayer"
                        :getSniperProbability="getSniperProbability"
                     />

                    <div class="row justify-content-center" v-if="player.role == 1 && (game.phase === 3 || game.phase === 8) && player.hasToSpeculate">
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
                                    <tr :style="{'background-color': game.winningCondition === 0 ? 'yellow' : 'white'}">
                                        <td>Status Quo</td>
                                        <td>{{ formatUs(game.boundaries.owner.noProject.low) }}</td>
                                        <td>{{ formatUs(game.boundaries.owner.noProject.high) }}</td>
                                    </tr>
                                    <tr :style="{'background-color': game.winningCondition === 1 ? 'yellow' : 'white'}">
                                        <td>Project A</td>
                                        <td>{{ formatUs(game.boundaries.owner.projectA.low) }}</td>
                                        <td>{{ formatUs(game.boundaries.owner.projectA.high) }}</td>
                                    </tr>
                                    <tr :style="{'background-color': game.winningCondition === 2 ? 'yellow' : 'white'}">
                                        <td>Project B</td>
                                        <td>{{ formatUs(game.boundaries.owner.projectB.low) }}</td>
                                        <td>{{ formatUs(game.boundaries.owner.projectB.high) }}</td>
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
                                    <tr :style="{'background-color': game.winningCondition === 0 ? 'yellow' : 'white'}">
                                        <td>Status Quo</td>
                                        <td>{{ formatUs(game.boundaries.developer.noProject.low) }}</td>
                                        <td>{{ formatUs(game.boundaries.developer.noProject.high) }}</td>
                                    </tr>
                                    <tr :style="{'background-color': game.winningCondition === 1 ? 'yellow' : 'white'}">
                                        <td>Project A</td>
                                        <td>{{ formatUs(game.boundaries.developer.projectA.low) }}</td>
                                        <td>{{ formatUs(game.boundaries.developer.projectA.high) }}</td>
                                    </tr>
                                    <tr :style="{'background-color': game.winningCondition === 2 ? 'yellow' : 'white'}">
                                        <td>Project B</td>
                                        <td>{{ formatUs(game.boundaries.developer.projectB.low) }}</td>
                                        <td>{{ formatUs(game.boundaries.developer.projectB.high) }}</td>
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
                                    <td>{{ formatUs(player.property.v[0]) }}</td>
                                    <td><input v-if="game.phase == 2 || game.winningCondition == 0" type="number" class="form-control" v-model="player.declaration[0]" name="player_declaration_0" id="player_declaration_0" aria-describedby="emailHelp" /></td>
                                    <td>{{ formatUs(player.declaration[0] * game.taxRate / 100) }}</td>
                                    <td>{{ formatUs(player.declaration[0] * ( 100 - game.taxRate) / 100) }}</td>
                                    <td>{{ getMySniperProbability(0) }}%</td>
                                </tr>
                                <tr>
                                    <td>Project A</td>
                                    <td>{{ formatUs(player.property.v[1]) }}</td>
                                    <td><input v-if="game.phase == 2 || game.winningCondition == 1" type="number" class="form-control" v-model="player.declaration[1]" name="player_declaration_1" id="player_declaration_1" aria-describedby="emailHelp" /></td>
                                    <td>{{ formatUs(player.declaration[1] * game.taxRate / 100) }}</td>
                                    <td>{{ formatUs(player.declaration[1] * ( 100 - game.taxRate) / 100) }}</td>
                                    <td>{{ getMySniperProbability(1) }}%</td>
                                </tr>
                                <tr>
                                    <td>Project B</td>
                                    <td>{{ formatUs(player.property.v[2]) }}</td>
                                    <td><input v-if="game.phase == 2 || game.winningCondition == 2" type="number" class="form-control" v-model="player.declaration[2]" name="player_declaration_2" id="player_declaration_2" aria-describedby="emailHelp" /></td>
                                    <td>{{ formatUs(player.declaration[2] * game.taxRate / 100) }}</td>
                                    <td>{{ formatUs(player.declaration[2] * ( 100 - game.taxRate) / 100) }}</td>
                                    <td>{{ getMySniperProbability(2) }}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="row justify-content-center" v-if="player.role > 1">
                        <!--div class="col-6 text-center">
                            <button type="button" @click='showPreview()' class="btn btn-primary">Preview</button>
                        </div-->
                        <div class="col-12 text-center">
                            <button v-if="(game.phase === 2 || game.phase === 7) && player.hasToDeclare" type="button" @click='submitDeclaration()' class="btn btn-primary" >Submit</button>
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
                                    <td>{{formatUs(pEv.value)}}</td>
                                    <td>{{formatUs(pEv.declaration)}}</td>
                                    <td>{{pEv.sniped ? 'Y' : 'N'}}</td>
                                    <td>{{formatUs(pEv.snipeProfit)}}</td>
                                    <td>{{formatUs(pEv.taxes)}}</td>
                                    <td>{{formatUs(pEv.total)}}</td>
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
                                    <td>{{formatUs(pEv.declaration)}}</td>
                                    <td>{{pEv.sniped ? 'Y' : 'N'}}</td>
                                    <td>{{formatUs(pEv.snipeProfit)}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!--div class="row">
                        <button type="button" class="btn btn-primary btn-block" @click='completeCurrentPhase()'>End Current Phase</button>
                    </div-->
                </div>
            </div>
        </div>

        <!--div>{{ game.ruleset }}</div-->
        <DoubleAuctionMarketChicago ref="doubleAuctionMarket" v-if="game.phase === 6 && game.ruleset === 'Harberger'"
            :condition="game.winningCondition"
            :conditionName="conditionMap[game.winningCondition]"
            :connection="connection"
            :game="game"
            :player="player"
            :pushMessage="pushMessage"
            :formatNumber="formatNumber"
        />
        <DoubleAuctionMarketFutarchy ref="doubleAuctionMarket" v-if="game.phase === 6 && game.ruleset === 'Futarchy'"/>

    </div>
</template>
<script>
    import DoubleAuctionMarketChicago from './DoubleAuctionMarketChicago.vue';
    import DoubleAuctionMarketFutarchy from './DoubleAuctionMarketFutarchy.vue';
    import HarbergerMatrix from './HarbergerMatrix.vue';
    import FutarchyMatrix from './FutarchyMatrix.vue';

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
                checkedPlots: [[],[],[]],
                timer: {
                    on: false,
                    minutes: "00",
                    seconds: "00"
                },
                game: {
                    round: 1,
                    phase: 0,
                    ruleset: "",
                    properties: [],
                    declarations: [],
                    boundaries: null,
                    taxRate: null,
                    publicSignal: "TBD",
                    players: []
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
                    declaration: [null, null, null],
                    profitEvents: [],
                    hasToDeclare: false,
                    hasToSpeculate: false,
                },
            };
        },
        components: {
            DoubleAuctionMarketChicago,
            DoubleAuctionMarketFutarchy,
            HarbergerMatrix,
            FutarchyMatrix
        },
        name: 'GameBoard',
        created() {
            window.addEventListener("load", this.openWebSocket);
        },
        methods: {
            getGame() {
                return this.game;
            },
            getPlayer() {
                return this.player;
            },
            updateTimer() {
                const self = this;

                const secondsLeft = Math.round((self.timer.end - Date.now()) / 1000);

                const minutes = Math.floor(secondsLeft / 60);
                const seconds = secondsLeft % 60;

                self.timer.minutes = minutes.toString().padStart(2, '0');
                self.timer.seconds = seconds.toString().padStart(2, '0');

                if (minutes <= 0 && seconds <= 0) {
                    console.log('The timer has rung');
                    return;
                }

                console.log('Update');

                setTimeout(self.updateTimer, 1000);

                console.log('Timeout set');
            },
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
            getMySniperProbability(condition) {
                let low = null, high = null;

                if (condition === 0) {
                    low = this.player.boundaries.noProject.low;
                    high = this.player.boundaries.noProject.high;
                } else if (condition === 1) {
                    low = this.player.boundaries.projectA.low;
                    high = this.player.boundaries.projectA.high;
                } else if (condition === 2) {
                    low = this.player.boundaries.projectB.low;
                    high = this.player.boundaries.projectB.high;
                }

                const snipingProbability = (high - this.player.declaration[condition]) * 100 / (high - low);

                return Math.max(Math.min(snipingProbability, 100), 0);
            },
            getSniperProbability(playerIndex, condition){
                console.log(`Searching for player of declaration ${playerIndex} under condition ${condition}`);

                if (condition == null) {
                    if (this.game.winningCondition != null) {
                        condition = this.game.winningCondition;
                    } else {
                        console.log('Winning condition not known yet. Cannot calculate the sniper probability right now');
                        return;
                    }
                }

                const declaration = this.game.declarations[playerIndex];

                if (declaration == null) {
                    console.log(`Declarations of player not available at this stage`);
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

                if (condition === 0) {
                    low = boundaries.noProject.low;
                    high = boundaries.noProject.high;
                } else if (condition === 1) {
                    low = boundaries.projectA.low;
                    high = boundaries.projectA.high;
                } else if (condition === 2) {
                    low = boundaries.projectB.low;
                    high = boundaries.projectB.high;
                }

                if (low == null || high == null) {
                    console.log(`Something wrong with the winning condition: ${condition}`);
                    return null;
                }

                const value = declaration.d[condition];

                const snipingProbability = (high - value) * 100 / (high - low);

                return Math.max(Math.min(snipingProbability, 100), 0);
            },
            getDeclarationPlayer(i) {
                const declaration = this.game.declarations[i];

                if (declaration == null) {
                    console.log(`Could not find declaration ${i}`);

                    switch(i) {
                        case 0:
                            return "Owner 1";
                        case 1:
                            return "Developer";
                        default:
                            return `Owner ${i}`;
                    }
                }

                const player = this.game.players.find(p => p.number === declaration.number);

                return player.tag;
            },
            doneSpeculating() {
                const self = this;

                console.log('Checked plots: ' + this.checkedPlots);

                this.$confirm({
                    message: 'Do you confirm your choices?',
                    button: {
                        no: 'No',
                        yes: 'Yes'
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: confirm => {
                        if (confirm) {
                            self.sendMessage({
                                "gameId": self.game.id,
                                "type": "done-speculating",
                                "snipe": self.checkedPlots
                            });

                            //Reset the checkboxes
                            for (let i = 0; i < self.checkedPlots.length; i++) {
                                self.checkedPlots[i] = [];
                            }
                        }
                    }
                });
            },
            conditionToString(c) {
                return conditionMap[c];
            },
            submitDeclaration() {
                const self = this;

                const myDeclarations = [0, 0, 0];

                const myWarnings = [];

                console.log('My declarations:' + myDeclarations);

                for (let i = 0; i < 3; i++) {
                    const v = parseInt(self.player.declaration[i]);

                    console.log(v);

                    if (isNaN(v) || v == null) {
                        myWarnings.push(`Your declaration under condition ${conditionMap[i]} is empty: it might result in a massive loss`);
                        continue;
                    }

                    myDeclarations[i] = v;

                    let low = null, high = null;

                    if (i === 0) {
                        low = this.player.boundaries.noProject.low;
                        high = this.player.boundaries.noProject.high;
                    } else if (i === 1) {
                        low = this.player.boundaries.projectA.low;
                        high = this.player.boundaries.projectA.high;
                    } else if (i === 2) {
                        low = this.player.boundaries.projectB.low;
                        high = this.player.boundaries.projectB.high;
                    }

                    if (v < low) {
                        myWarnings.push(`Your declaration under condition ${conditionMap[i]} is less than the known minimum value (${low}), speculators will certainly target you`);
                    }

                    if (v > high) {
                        myWarnings.push(`Your declaration under condition ${conditionMap[i]} is greater than the known maximum value (${high}), this is certainly not optimal`);
                    }
                }

                let message = 'Do you confirm your declaration?' + myWarnings.join(' - ');

                this.$confirm({
                    message: message,
                    button: {
                        no: 'No',
                        yes: 'Yes'
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: confirm => {
                        if (confirm) {
                            self.sendMessage({
                                "gameId": self.game.id,
                                "type": "declare",
                                "declaration": myDeclarations
                            });
                        }
                    }
                });
            },
            showPreview() {
                //TODO
            },
            formatNumber(num) {
                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
            },
            formatUs(num) {
                if (num == null || typeof num != 'number') {
                    return num;
                }

                return num.toLocaleString('en-US');
            },
            completeCurrentPhase() {
                const self = this;

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "complete-current-phase"
                });
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
                                //self.player.title += ` (${roleMap[ev.data.role]})`;
                                self.player.balance = ev.data.balance;
                                self.player.shares = ev.data.shares;
                                self.player.wallet = ev.data.wallet;

                                if (self.player.role == 2) {
                                    self.player.boundaries = self.game.boundaries.developer;
                                } else if (self.player.role == 3) {
                                    self.player.boundaries = self.game.boundaries.owner;
                                }

                                if (ev.data.property != null) {
                                    self.player.property = ev.data.property;
                                    //self.player.declaration[0] = ev.data.property.v[0];
                                    //self.player.declaration[1] = ev.data.property.v[1];
                                    //self.player.declaration[2] = ev.data.property.v[2];
                                    console.log(ev.data.property);
                                }
                                break;
                            case "phase-transition":
                                self.game.round = ev.data.round;
                                self.game.phase = ev.data.phase;

                                if ((self.game.phase === 2 || self.game.phase === 7) && self.player.role > 1) {
                                    self.player.hasToDeclare = true;
                                }

                                if ((self.game.phase === 3 || self.game.phase === 8) && self.player.role === 1) {
                                    self.player.hasToSpeculate = true;
                                }

                                break;
                            case "set-timer":
                                console.log('Timer');

                                self.timer.end = ev.data.end;

                                self.updateTimer();

                                self.timer.on = true;
                                
                                break;
                            case "reset-timer":
                                self.timer.end = null;

                                self.timer.on = false;

                                break;
                            case "players-known":
                                self.game.players = ev.data.players;

                                self.player.tag = ev.data.players[self.player.number - 1].tag;
                                self.player.title = self.player.tag;

                                break;
                            case 'declaration-received':
                                self.player.hasToDeclare = false;
                                console.log('Confirmation received');
                                break;
                            case 'speculation-received':
                                self.player.hasToSpeculate = false;
                                console.log('Confirmation received');
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
                                        "property": `${roleMap[ev.data.role]} ${ev.data.owner}`
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
                                self.game.publicSignal = ev.data.publicSignal;
                                self.pushMessage("info", `Your signals: ${ev.data.signals}`);
                                break;
                            }
                            case "add-order":
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "add");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.order.condition}`].orderEvent(ev.data.order, "add");
                                }
                                break;
                            case "delete-order":
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "delete");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.order.condition}`].orderEvent(ev.data.order, "delete");
                                }
                                break;
                            case "update-order":
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "update");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.order.condition}`].orderEvent(ev.data.order, "update");
                                }
                                break;
                            case "contract-fulfilled": 
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data, "contract");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.condition}`].orderEvent(ev.data, "contract");
                                }
                                break;
                            case "asset-movement": {
                                self.player.wallet[ev.data.condition].balance = ev.data.balance;
                                self.player.wallet[ev.data.condition].shares = ev.data.shares;

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
                            case "winning-condition":
                                self.game.winningCondition = ev.data.winningCondition;
                                break;
                            default:
                                console.error(`Type ${ev.eventType} was not understood`);
                        }
                    } else { //it is a message
                        console.log(`${ev.type} - ${ev.message}`);
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
            window.vue = this;
        }
    }
</script>