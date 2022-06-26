<template>
    <div>
        <vue-confirm-dialog></vue-confirm-dialog>

        <error-list :warningList="[]"></error-list>

        <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-navbar-brand>
                        {{ game.phase === 0 && game.round === 1 ? 'New Player' : player.tag }}: {{ player.instructions }}
                    </b-navbar-brand>
                </b-navbar-nav>
                <b-navbar-nav class="ml-auto">
                    <b-nav-item active v-if="timer.on === true">Time left: {{ timer.minutes }}:{{ timer.seconds }}</b-nav-item>
                    <b-nav-item active v-if="!game.over">Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active v-if="!game.over">Phase: {{ game.phase }}</b-nav-item>
                    <b-nav-item active v-if="game.over">Game Over</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div class="row d-flex align-items-center justify-content-center" style="height: 500px;" v-if="game.phase === 0">
            <b-button v-if="player.ready === false" size="lg" @click="signalReady" variant="primary">I am Ready</b-button>
            <div v-else>Waiting all players to join ...</div>
        </div>

        <div class="mt-1 mx-5 mp-1" v-if="![0,6,9].includes(game.phase)">
            <div class="row">
                <div class="col-6">

                    <FutarchyMatrix :condition="game.winningCondition" :project="conditionToString(game.winningCondition)"
                         v-if="game.ruleset === 'Futarchy' && game.phase < 7"/>
                    <HarbergerMatrix
                        v-else
                        :condition="game.conditions[game.winningCondition]"
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

                    <div v-if="game.boundaries != null"  class="row">

                        <div v-for="role in ['owner', 'developer']" :key="role" class="col-6">
                            <div class="text-center mb-1"><b>Value Ranges ({{ role }})</b></div>
                            <table class="table table-bordered" style="table-layout: fixed;">
                                <thead class="thead-dark">
                                    <th scope="col">Condition</th>
                                    <th scope="col">Minimum</th>
                                    <th scope="col">Maximum</th>
                                </thead>
                                <tbody>
                                    <tr v-for="condition in game.conditions" :key="condition.id"
                                        :style="{'background-color': game.winningCondition === condition.id ? 'yellow' : 'white'}">
                                        <td>{{ condition.name }}</td>
                                        <td>{{ formatUs(game.boundaries[role][condition.key].low) }}</td>
                                        <td>{{ formatUs(game.boundaries[role][condition.key].high) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>

                </div>

                <div class="col-6">
                    <!-- Actions -->
                    <div class="row" v-if="player.role > 1">
                        <div class="text-center mb-1"><b>My Value Information</b></div>
                        <table class="table table-bordered">
                            <thead class="thead-dark">
                                <th scope="col">Condition</th>
                                <th scope="col">Value</th>
                                <th scope="col">Declaration</th>
                                <th scope="col">Tax Bill</th>
                                <th scope="col">Profit</th>
                                <th scope="col">Sniper Prob.</th>
                            </thead>
                            <tbody>
                                <tr v-for="condition in game.conditions" :key="condition.id">
                                    <td>{{ condition.name }}</td>
                                    <td>{{ formatUs(player.property.v[condition.id]) }}</td>
                                    <td>
                                        <input v-if="[2,7].includes(game.phase) && (game.winningCondition == null || game.winningCondition == condition.id) && player.hasToDeclare" type="number" class="form-control" v-model="player.declaration[condition.id]" name="player_declaration_0" id="player_declaration_0" aria-describedby="emailHelp" />
                                        <div v-else>
                                            <!-- {{ game.winningCondition }} {{ condition.id }} {{ player.declaration}} -->
                                            <div v-if="(game.winningCondition == null || game.winningCondition === condition.id) && player.declaration != null">
                                                <div v-if="player.declaration != null && player.declaration[condition.id] != null">
                                                    {{ player.declaration[condition.id]}}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div v-if="(game.winningCondition == null || game.winningCondition === condition.id) && player.declaration != null">
                                            {{ player.declaration != null ? formatUs(player.declaration[condition.id] * game.taxRate / 100) : '' }}
                                        </div>
                                    </td>
                                    <td>
                                        <div v-if="(game.winningCondition == null || game.winningCondition === condition.id) && player.declaration != null">
                                            {{ player.declaration != null ? formatUs(player.declaration[condition.id] * ( 100 - game.taxRate) / 100): '' }}
                                        </div>
                                    </td>
                                    <td>
                                        <div v-if="game.winningCondition == null || game.winningCondition === condition.id">
                                            {{ getMySniperProbability(condition.id) }}%
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="row justify-content-center" v-if="player.role > 1">
                        <div class="col-12 text-center">
                            <button v-if="(game.phase === 2 || game.phase === 7) && player.hasToDeclare" type="button" @click='submitDeclaration()' class="btn btn-primary" >Submit</button>
                        </div>
                    </div>

                    <div class="row" v-if="player.role > 1">
                        <div class="text-center mb-1"><b>Results</b></div>
                        <table class="table table-bordered">
                            <thead class="thead-dark">
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
                        <div class="text-center mb-1"><b>Results</b></div>
                        <table class="table table-bordered">
                            <thead class="thead-dark">
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

                </div>
            </div>
        </div>

        <DoubleAuctionMarketChicago ref="doubleAuctionMarket" v-if="game.phase === 6 && game.ruleset === 'Harberger'"
            :condition="game.winningCondition"
            :conditionName="conditionToString(game.winningCondition)"
            :connection="connection"
            :game="game"
            :player="player"
            :pushMessage="pushMessage"
            :formatNumber="formatNumber"
        />
        <DoubleAuctionMarketFutarchy ref="doubleAuctionMarket" v-if="game.phase === 6 && game.ruleset === 'Futarchy'"/>

        <Summaries :summaries="player.summaries"/>
    </div>
</template>
<script>
    import DoubleAuctionMarketChicago from './DoubleAuctionMarketChicago.vue';
    import DoubleAuctionMarketFutarchy from './DoubleAuctionMarketFutarchy.vue';
    import HarbergerMatrix from './HarbergerMatrix.vue';
    import FutarchyMatrix from './FutarchyMatrix.vue';
    import ErrorList from './modals/ErrorList.vue';
    import Summaries from './Summaries.vue';

    import { getGameStatus } from '../services/GameService'

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
                modals: {
                    errorList: {
                        show: false,
                        description: 'There is a problem',
                        warnings: [],
                        callback: null
                    }
                },
                timer: {
                    on: false,
                    minutes: "00",
                    seconds: "00"
                },
                game: {
                    over: false,
                    winningCondition: null,
                    round: 1,
                    phase: 0,
                    ruleset: "",
                    properties: [],
                    declarations: [],
                    boundaries: null,
                    taxRate: null,
                    publicSignal: "TBD",
                    players: [],
                    conditions: []
                },
                player: {
                    instructions: "",
                    tag: "",
                    number: null,
                    recovery: null,
                    role: null,
                    boundaries: null,
                    wallet: null,
                    property: null,
                    declaration: [null, null, null],
                    profitEvents: [],
                    hasToDeclare: false,
                    hasToSpeculate: false,
                    ready: false,
                    summaries: []
                },
            };
        },
        components: {
            DoubleAuctionMarketChicago,
            DoubleAuctionMarketFutarchy,
            HarbergerMatrix,
            FutarchyMatrix,
            ErrorList,
            Summaries
        },
        name: 'GameBoard',
        methods: {
            getGame() {
                return this.game;
            },
            getPlayer() {
                return this.player;
            },
            signalReady() {
                const self = this;

                this.sendMessage({
                    "gameId": self.game.id,
                    "type": "player-is-ready",
                });
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

                setTimeout(self.updateTimer, 1000);
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

                return Math.max(Math.min(snipingProbability, 100), 0).toFixed(2);
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

                return Math.max(Math.min(snipingProbability, 100), 0).toFixed(2);
            },
            getDeclarationPlayer(i) {
                const declaration = this.game.declarations[i];

                console.log('Declaration:');
                console.log(declaration);

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

                console.log(this.game.players);

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

                for (let i = 0; i < self.game.conditions.length; i++) {
                    if (self.game.winningCondition != null && self.game.winningCondition != i) {
                        continue;
                    }

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

                if (myWarnings.length > 0) {
                    this.modals.errorList.description = 'There are some caveats with your declaration. Do you want to submit it anyway?'
                    + 'It will not be possible to change it at a later time.';
                    this.modals.errorList.warnings = myWarnings;
                } else {
                    this.modals.errorList.description = 'Do you want to proceed and submit your declaration?'
                    + 'It will not be possible to change it at a later time.';
                    this.modals.errorList.warnings = [];
                }

                this.modals.errorList.callback = () => {
                    self.sendMessage({
                        "gameId": self.game.id,
                        "type": "declare",
                        "declaration": myDeclarations
                    });
                }

                this.modals.errorList.show = true;
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
            resetToPhaseZero() {
                this.player.declaration = [null, null, null];
                this.player.profitEvents = [];
                this.player.hasToDeclare = false;
                this.player.hasToSpeculate = false;
                this.player.ready = false;
                this.player.signals = [];

                this.game.winningCondition = null,
                this.phase = 0;
                this.game.declaration = [null, null, null],
                this.publicSignal = "TBD";
            },
            recover(gameData) {
                const self = this;

                console.log(gameData);
                //TODO

                this.resetToPhaseZero();
                
                for (const prop in gameData.player) {
                    self.player[prop] = gameData.player[prop];
                }

                if (self.player.doneSpeculating != null) {
                    self.player.hasToSpeculate = !self.player.doneSpeculating;
                }

                if (self.player.property != null && self.player.property.d != null) {
                    self.player.declaration = self.player.property.d;
                }

                if (self.player.S != null) {
                    self.player.signals = self.player.S;
                }

                if (gameData.game.over != null) {
                    self.game.over = gameData.game.over;
                }

                for (const prop in gameData.game) {
                    self.game[prop] = gameData.game[prop];
                }

                if (self.game.boundaries != null) {
                    if (self.player.role == 2) {
                        self.player.boundaries = self.game.boundaries.developer;
                    } else if (self.player.role == 3) {
                        self.player.boundaries = self.game.boundaries.owner;
                    }
                }

                if (self.game.orders != null && self.game.orders.length > 0) {
                    if (self.game.ruleset === 'Harberger') {
                        if (self.game.orders[self.game.winningCondition] != null) {
                            self.game.orders[self.game.winningCondition].forEach(order => {
                                console.log(order);
                                self.$refs.doubleAuctionMarket.orderEvent(order, "add");
                            });
                        }
                    } else if (self.game.ruleset === 'Futarchy') {
                        self.game.orders.forEach((orderList) => {
                            if (orderList == null || orderList.length === 0) {
                                return;
                            }

                            orderList.forEach((order) => {
                                const ref = `doubleAuctionMarket${order.condition}`;

                                console.log(`Ref: ${ref}`);
                                self.$refs.doubleAuctionMarket.$refs[ref][0].orderEvent(order, "add");
                                self.$refs.doubleAuctionMarket.activityDetected(order.condition);
                            })
                        });
                    }
                }

                if (self.game.movementList != null && self.game.movementList.length > 0) {
                    if (self.game.ruleset === 'Harberger') {
                        if (self.game.movementList[self.game.winningCondition] != null) {
                            self.game.movementList[self.game.winningCondition].forEach((movement) => {
                                self.$refs.doubleAuctionMarket.orderEvent(movement, "contract");
                            });
                        }
                    } else if (self.game.ruleset === 'Futarchy') {
                        self.game.movementList.forEach(conditionMovements => {
                            if (conditionMovements == null || conditionMovements.length === 0) {
                                return;
                            }

                            conditionMovements.forEach((movement) => {
                                self.$refs.doubleAuctionMarket.contractCompleted(movement);
                                self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${movement.condition}`][0].orderEvent(movement, "contract");
                            });
                        });
                    }
                }

                if (gameData.timer != null) {
                    self.timer.end = gameData.timer > Date.now() ? gameData.timer : Date.now();

                    self.updateTimer();

                    self.timer.on = true;
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
                            case 'ready-received':
                                self.player.ready = true;
                                break;
                            case "assign-name":
                                self.player.title = `Player ${ev.data.number}`;
                                self.player.number = ev.data.number;
                                self.game.ruleset = ev.data.ruleset;
                                break;
                            case 'phase-instructions':
                                self.player.instructions = ev.data.instructions;
                                break;
                            case "assign-role":
                                self.game.boundaries = ev.data.boundaries;
                                self.game.conditions = ev.data.conditions;
                                self.game.taxRate = ev.data.taxRate;
                                self.player.role = ev.data.role;
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
                                    console.log(ev.data.property);
                                }
                                break;
                            case "phase-transition":
                                self.game.round = ev.data.round;
                                self.game.phase = ev.data.phase;

                                if (self.game.phase === 2 || self.game.phase === 7) {
                                    self.game.declarations = [null, null, null];

                                    if (self.player.role > 1) {
                                        self.player.hasToDeclare = true;
                                        self.player.declaration = [null, null, null];
                                    }
                                }

                                if ((self.game.phase === 3 || self.game.phase === 8) && self.player.role === 1) {
                                    self.player.hasToSpeculate = true;
                                }

                                if (ev.data.phase === 0) { //New round
                                    self.resetToPhaseZero();
                                }
                                break;
                            case "set-timer":
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
                            case 'speculation-with-profit': {
                                let msgContent = '';
                                let msgType = ''

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
                            case 'value-signals': {
                                self.player.signals = ev.data.signals;
                                self.game.winningCondition = ev.data.condition;
                                self.game.taxRate = ev.data.taxRate;
                                self.game.publicSignal = ev.data.publicSignal;
                                self.pushMessage("info", `Your signals: ${ev.data.signals}`);
                                break;
                            }
                            case 'add-order':
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "add");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    const ref = `doubleAuctionMarket${ev.data.order.condition}`;

                                    console.log(`Ref: ${ref}`);
                                    self.$refs.doubleAuctionMarket.$refs[ref][0].orderEvent(ev.data.order, "add");
                                    self.$refs.doubleAuctionMarket.activityDetected(ev.data.order.condition);
                                }
                                break;
                            case 'delete-order':
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "delete");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.order.condition}`][0].orderEvent(ev.data.order, "delete");
                                    self.$refs.doubleAuctionMarket.activityDetected(ev.data.order.condition);
                                }
                                break;
                            case 'update-order':
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data.order, "update");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.order.condition}`][0].orderEvent(ev.data.order, "update");
                                    self.$refs.doubleAuctionMarket.activityDetected(`tab-condition-${ev.data.order.condition}`);
                                }
                                break;
                            case 'contract-fulfilled': 
                                if (self.game.ruleset === 'Harberger') {
                                    self.$refs.doubleAuctionMarket.orderEvent(ev.data, "contract");
                                } else if (self.game.ruleset === 'Futarchy') {
                                    self.$refs.doubleAuctionMarket.contractCompleted(ev.data);
                                    self.$refs.doubleAuctionMarket.$refs[`doubleAuctionMarket${ev.data.condition}`][0].orderEvent(ev.data, "contract");
                                }
                                break;
                            case 'asset-movement': {
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
                            case 'tax-income':
                                self.pushMessage("info", `You have made a tax income of ${ev.data.amount}`);
                                break;
                            case 'total-profit':
                                if (ev.data.amount >= 0) {
                                    self.pushMessage("success", `You have made a total profit of ${ev.data.amount}`);
                                } else {
                                    self.pushMessage("error", `You have made a total loss of ${-ev.data.amount}`);
                                }
                                break;
                            case 'round-end':
                                self.resetToPhaseZero();
                                break;
                            case 'winning-condition':
                                self.game.winningCondition = ev.data.winningCondition;
                                break;
                            case 'order-refused':
                                self.$confirm({
                                    message: ev.data.message,
                                    button: {
                                        yes: 'Ok'
                                    },
                                    callback: () => {}
                                });
                                break;
                            case 'round-summary':
                                self.player.summaries.push(ev.data);
                                break;
                            case 'game-over':
                                self.game.over = true;
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

                    self.sendMessage({
                        "gameId": self.game.id,
                        "type": "join",
                        "recovery": self.player.recovery
                    });
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
            const self = this;

            this.game.id = parseInt(this.$route.params.id);
            this.player.recovery = this.$route.params.recovery;
            window.vue = this;

            console.log(`${process.env.VUE_APP_API}`);

            getGameStatus(this.$route.params.id, this.$route.params.recovery).then(async (response) => {
                console.log('Status: ');
                console.log(response);

                if (response.canJoin != true) {
                    console.log('The game is full');
                    return;
                }

                if (response.gameData != null) {
                    self.game.phase = response.gameData.game.phase;
                    self.game.ruleset = response.gameData.game.ruleset;

                    await new Promise(resolve => setTimeout(resolve, 1)); //allows the refs to load

                    self.recover(response.gameData);
                }

                try {
                    self.openWebSocket();
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }
</script>