<template>
    <b-col><div class="d-flex flex-column h-100">

        <error-list :warningList="[]"></error-list>
        <confirm></confirm>
        <acknowledge></acknowledge>

        <b-row class="no-gutters justify-content-center">
            <b-col>
                <b-navbar class="mb-0" id="navbar" toggleable="md" type="dark" variant="info" >
                    <b-navbar-nav>
                        <b-navbar-brand>
                            <Transition name="slide-fade">
                                <div v-if="showIntructions">
                                    {{ player == null || player.tag == null || player.tag === '' ? 'New Player' : player.tag }}: {{ player.instructions }}
                                </div>
                            </Transition>
                        </b-navbar-brand>
                    </b-navbar-nav>
                    <b-navbar-nav class="ml-auto">
                        <b-nav-item active v-if="timer.on === true">Time left: {{ timer.minutes }}:{{ timer.seconds }}</b-nav-item>
                        <b-nav-item active v-if="!game.over">Round: {{ game.round }}</b-nav-item>
                        <b-nav-item active v-if="!game.over">Phase: {{ game.phase }}</b-nav-item>
                        <b-nav-item active v-if="game.over">Game Over</b-nav-item>
                    </b-navbar-nav>
                </b-navbar>
            </b-col>
        </b-row>

        <b-row class="no-gutters justify-content-center flex-grow-1" v-if="game.phase === 0">
            <b-col class="d-flex align-items-center justify-content-center flex-column">
                <b-row class="">
                    <b-button v-if="player.ready === false" size="lg" @click="signalReady" variant="primary">I am Ready</b-button>
                    <div v-else>Waiting all players to join ...</div>
                </b-row>
            </b-col>
        </b-row>

        <b-row class="d-flex flex-row no-gutters" v-if="![0,6,9].includes(game.phase)">
            <div class="d-flex flex-column col-6">

                <HarbergerMatrix
                    ref="neighborhood"
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

                <b-row class="no-gutters" v-if="game.boundaries != null">

                    <div v-for="role in ['owner', 'developer']" :key="role" class="col-6 p-1">
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
                                    <td class="text-right">{{ formatUs(game.boundaries[role][condition.key].low) }}</td>
                                    <td class="text-right">{{ formatUs(game.boundaries[role][condition.key].high) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </b-row>

            </div>

            <div class="col-6">
                <!-- Actions -->
                <b-row class="d-flex flex-row no-gutters p-1" v-if="player.role > 1">
                    <div class="text-center mb-1"><b>My Value Information</b></div>
                    <table class="table table-bordered">
                        <thead class="thead-dark">
                            <th scope="col">Condition</th>
                            <th scope="col">Value</th>
                            <th scope="col">Declaration</th>
                            <th scope="col">Tax Bill ({{formatUs(game.taxRate)}}%)</th>
                            <th scope="col">Profit</th>
                            <th scope="col">Sniper Prob.</th>
                        </thead>
                        <tbody>
                            <tr v-for="condition in game.conditions.filter(c => game.winningCondition == null || game.winningCondition === c.id)" :key="condition.id">
                                <td>{{ condition.name }}</td>
                                <td class="text-right">{{ formatUs(player.property.v[condition.id]) }}</td>
                                <td>
                                    <b-form-input @keydown="isAllowed" @mouseleave="$event.target.blur()" lazy-formatter :formatter="reformat" v-if="[2,7].includes(game.phase) && (game.winningCondition == null || game.winningCondition == condition.id) && player.hasToDeclare" class="form-control" v-model="player.declaration[condition.id]" name="player_declaration_0" id="player_declaration_0" aria-describedby="emailHelp" />
                                    <div v-else>
                                        <div v-if="(game.winningCondition == null || game.winningCondition === condition.id) && player.declaration != null">
                                            <div class="text-right" v-if="player.declaration != null && player.declaration[condition.id] != null">
                                                {{ player.declaration[condition.id]}}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-right">
                                    <div v-if="(game.winningCondition == null || game.winningCondition === condition.id) && player.declaration != null">
                                        {{ formatUs(parseFormatted(player.declaration[condition.id], 0) * game.taxRate / 100) }}
                                    </div>
                                </td>
                                <td class="text-right">
                                    <div v-if="(game.winningCondition == null || game.winningCondition === condition.id) && player.declaration != null">
                                        {{ formatUs(player.property.v[condition.id] - parseFormatted(player.declaration[condition.id], 0)* ( game.taxRate) / 100) }}
                                    </div>
                                </td>
                                <td class="text-right">
                                    <div v-if="game.winningCondition == null || game.winningCondition === condition.id">
                                        {{ getMySniperProbability(condition.id) }}%
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </b-row>

                <b-row class="d-flex flex-row no-gutters p-1 justify-content-center" v-if="player.role > 1">
                    <div class="col-12 text-center">
                        <button v-if="(game.phase === 2 || game.phase === 7) && player.hasToDeclare" type="button" @click='submitDeclaration()' class="btn btn-primary" >Submit</button>
                    </div>
                </b-row>

            </div>
        </b-row>

        <DoubleAuctionMarketSingle ref="doubleAuctionMarket" v-if="game.phase === 6 && game.ruleset === 'Harberger'"
            :condition="game.winningCondition"
            :conditionName="conditionToString(game.winningCondition)"
            :connection="connection"
            :game="game"
            :player="player"
            :pushMessage="pushMessage"
        />
        <DoubleAuctionMarketFutarchy ref="doubleAuctionMarket" v-if="game.phase === 6 && game.ruleset === 'Futarchy'"/>

        <Summaries ref="summaries" :summaries="player.summaries"/>
        
    </div></b-col>
</template>
<script>
    import DoubleAuctionMarketSingle from './DoubleAuctionMarketSingle.vue';
    import DoubleAuctionMarketFutarchy from './DoubleAuctionMarketFutarchy.vue';
    import HarbergerMatrix from './HarbergerMatrix.vue';
    import ErrorList from './modals/ErrorList.vue';
    import Confirm from './modals/Confirm.vue';
    import Acknowledge from './modals/Acknowledge.vue';
    import Summaries from './Summaries.vue';
    import dictionary from '../assets/harberger.json';
    import { LocalizedNumberParser } from 'localized-number-parser';
    import { getGameStatus } from '../services/GameService'
    import EventService from '../services/EventService';
    import FormatService from '../services/FormatService';

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
                showIntructions: true,
                updateSpeculationTable: 0,
                firstConnection: true,
                connection: null,
                dictionary: {},
                lastThreeMessages: [],
                messages: [],
                checkedPlots: [],
                modals: {
                    errorList: {
                        show: false,
                        description: 'There is a problem',
                        warnings: [],
                        callback: null
                    }, confirm: {
                        show: false,
                        title: 'Confirmation Request',
                        description: 'There is a problem',
                        callback: null
                    }, acknowledge: {
                        show: false,
                        title: 'Notice',
                        description: 'Look at This',
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
                    round: 0,
                    phase: 0,
                    ruleset: "",
                    properties: [],
                    declarations: [],
                    boundaries: null,
                    taxRate: null,
                    publicSignal: "TBD",
                    players: [],
                    conditions: [],
                    initialTaxRate: null,
                    finalTaxRate: null
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
                    summaries: [],
                    firstDeclaration: null,
                    firstTaxes: null,
                    firstRepurchase: null,
                    market: null,
                    secondDeclaration: null,
                    secondTaxes: null,
                    secondRepurchase: null
                },
            };
        },
        components: {
            DoubleAuctionMarketSingle,
            DoubleAuctionMarketFutarchy,
            HarbergerMatrix,
            ErrorList,
            Confirm,
            Acknowledge,
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

                const snipingProbability = (high - this.parseFormatted(this.player.declaration[condition],0)) * 100 / (high - low);

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

                if (player == null) {
                    console.log(`Could not find player number ${declaration.number}`);
                    return '-';
                }

                return player.tag;
            },
            async doneSpeculating() {
                const self = this;
                
                console.log('Checked plots: ' + this.checkedPlots);

                const confirm = await this.confirm('speculator-submit-title', 'speculator-submit-description');

                if (! confirm) {
                    return;
                }

                const snipes = [];

                this.game.conditions.forEach(() => {
                    snipes.push([]);
                })

                this.checkedPlots.forEach((snipe) => {
                    const [player, condition] = snipe.split('.');

                    snipes[parseInt(condition)].push(parseInt(player));
                });

                console.log(snipes);

                this.sendMessage({
                    "gameId": self.game.id,
                    "type": "done-speculating",
                    "snipe": snipes
                });
 
                this.checkedPlots = [];
            },
            conditionToString(c) {
                if (this.game.conditions[c] != null)
                    return this.game.conditions[c].name;
                
                return null;
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

                    const v = this.parseFormatted(self.player.declaration[i]);

                    console.log(v);

                    if (isNaN(v) || v == null) {
                        myWarnings.push(`Your declaration under condition ${this.conditionToString(i)} is empty: it might result in a massive loss`);
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
                        myWarnings.push(`Your declaration under condition ${this.conditionToString(i)} is less than the known minimum value (${low}), speculators will certainly target you`);
                    }

                    if (v > high) {
                        myWarnings.push(`Your declaration under condition ${this.conditionToString(i)} is greater than the known maximum value (${high}), this is certainly not optimal`);
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

                    console.log(self.game.declarations);

                    if (self.game.declarations[self.player.number - 1] == null) {
                        self.game.declarations[self.player.number - 1] = {
                            "d": myDeclarations
                        };
                    } else {
                        self.game.declarations[self.player.number - 1].d = myDeclarations;
                    }

                    self.$refs['neighborhood'].$forceUpdate();
                }

                this.modals.errorList.show = true;
            },
            formatUs(num) {
                return this.formatService.format(num);
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

                this.player.firstDeclaration = null;
                this.player.firstTaxes = null;
                this.player.firstRepurchase = null;
                this.player.market = null;
                this.player.secondDeclaration = null;
                this.player.secondTaxes = null;
                this.player.secondRepurchase = null;

                this.game.winningCondition = null,
                this.phase = 0;
                this.game.declaration = [null, null, null],
                this.publicSignal = "TBD";

                this.game.players.forEach(p => p.snipe = null);
            },
            recover(gameData) {
                const self = this;

                console.log(gameData);
                //TODO

                this.resetToPhaseZero();
                
                for (const prop in gameData.player) {
                    self.player[prop] = gameData.player[prop];
                }

                if (self.player.summaries == null) {
                    self.player.summaries = [];
                }

                if (self.player.doneSpeculating != null) {
                    self.player.hasToSpeculate = !self.player.doneSpeculating;
                }

                if (self.player.property != null && self.player.property.d != null) {
                    self.player.declaration = self.player.property.d.map(n => self.formatUs(n));
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

                if (self.player.sniped != null) {
                    self.player.snipes.forEach(sn => {
                        if (self.player.role === 1) {
                            const target = self.game.players.find(p => p.number === sn.target.number);
                            target.snipe = sn.profit;
                        }
                    });
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

                        EventService.emit(ev.eventType, ev.data);

                        switch(ev.eventType) {
                            case 'ready-received':
                                self.player.ready = true;
                                break;
                            case "assign-name":
                                self.player.title = `Player ${ev.data.number}`;
                                self.player.number = ev.data.number;
                                self.game.ruleset = ev.data.ruleset;
                                break;
                            case "assign-role":
                                self.game.boundaries = ev.data.boundaries;
                                self.game.conditions = ev.data.conditions;
                                self.game.taxRate = ev.data.taxRate;
                                self.game.initialTaxRate = ev.data.initialTaxRate;
                                self.game.finalTaxRate = ev.data.finalTaxRate;
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

                                var phaseInstructions = self.dictionary.instructions.phases[self.game.phase][
                                    [null, 'speculator', 'developer', 'owner'][self.player.role]
                                ];

                                self.showIntructions = false;

                                setTimeout(() => {
                                    self.player.instructions = phaseInstructions;

                                    self.showIntructions = true;
                                }, 1000);

                                if (self.game.phase === 1) {
                                    self.game.declarations = [null, null, null];
                                    self.player.declaration = [null, null, null];
                                    self.player.hasToDeclare = true;
                                }

                                if (self.game.phase === 6) {
                                    setTimeout(() => {
                                        EventService.emit('clear-contracts');
                                    }, 50)
                                }
                                if (self.game.phase === 7) {
                                    self.player.hasToDeclare = true;
                                }

                                if ((self.game.phase === 3 || self.game.phase === 8) && self.player.role === 1) {
                                    self.checkedPlots = [];
                                    self.player.hasToSpeculate = true;
                                }

                                if (ev.data.phase === 0) { //New round
                                    self.resetToPhaseZero();
                                }

                                if (self.game.winningCondition != null) {
                                    if (self.game.phase <= 7 && self.player.firstDeclaration == null) {
                                        self.player.firstDeclaration = self.parseFormatted(self.player.declaration[self.game.winningCondition]);
                                        self.player.firstTaxes = self.game.initialTaxRate * self.player.firstDeclaration / 100;
                                    }

                                    if (self.game.phase > 6) {
                                        if (self.player.market == null) {
                                            self.player.market = {};
                                        }

                                        self.player.market.balance = self.player.wallet[self.game.winningCondition].balance;
                                        self.player.market.shares = self.player.wallet[self.game.winningCondition].shares;
                                    }

                                    if (
                                        self.game.phase > 7 ||
                                        (self.game.phase === 7 && self.player.hasToDeclare === false)
                                    ) {
                                        self.player.secondDeclaration = self.parseFormatted(self.player.declaration[self.game.winningCondition]);
                                        self.player.secondTaxes = self.game.finalTaxRate * self.player.secondDeclaration / 100;
                                    }
                                }

                                if (self.game.phase > 0) {
                                    self.updateSummary();
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
                            case 'first-snipes':
                                var profit = 0;

                                ev.data.snipes.forEach(sn => {
                                    profit += sn.profit;

                                    if (self.player.role === 1) {
                                        const target = self.game.players.find(p => p.number === sn.target.number);
                                        target.snipe = sn.profit;
                                    }
                                });

                                if (self.player.role !== 1) {
                                    profit = -profit;
                                }

                                self.player.firstRepurchase = profit;

                                break;
                            case 'second-snipes':
                                var secondProfit = 0;

                                ev.data.snipes.forEach(sn => {
                                    secondProfit += sn.profit;

                                    if (self.player.role === 1) {
                                        const target = self.game.players.find(p => p.number === sn.target.number);
                                        target.snipe = sn.profit;
                                    }
                                });

                                if (self.player.role !== 1) {
                                    secondProfit = -secondProfit;
                                }

                                self.player.secondRepurchase = secondProfit;
                                
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
                                        "property": self.game.players.find(p => p.number === ev.data.owner).tag
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
                                self.acknowledge('order-refused', ev.data.message);
                                break;
                            case 'round-summary':
                                var summaryIdx = self.player.summaries.findIndex(s => s.round = ev.data.round);

                                if (summaryIdx != -1) {
                                    if (ev.data.round === 0) {
                                        console.log('Removing the initial round');
                                        self.player.summaries.shift();
                                    } else {
                                        console.log(`Removing the result row of round ${ev.data.round} with the consolidated one from the server`);
                                        self.player.summaries[summaryIdx] = ev.data;
                                    }
                                } else {
                                    if (ev.data.round != 0) {
                                        console.log(`Adding the result row of round ${ev.data.round} from the server`);
                                        self.player.summaries.unshift(ev.data);
                                    } else {
                                        console.log('Removing the initial round');
                                        self.player.summaries.shift();
                                    }
                                }

                                break;
                            case 'game-over':
                                self.game.over = true;
                                break;
                            case 'final-price':
                                self.player.market = {
                                    "price": ev.data.price,
                                    "balance": self.player.wallet[self.game.winningCondition].balance,
                                    "shares": self.player.wallet[self.game.winningCondition].shares
                                };
                                
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
            },
            resolvePlaceHolder(placeholder) {
                if (this.dictionary == null) {
                    console.warn('No dictionary available');
                    return placeholder;
                }

                if (this.dictionary.placeHolders == null) {
                    console.warn('No placeholders in the dictionary');
                    return placeholder;
                }

                if (this.dictionary.placeHolders[placeholder] == null) {
                    console.warn(`Placeholder not found in the dictionary: ${placeholder}`);
                    return placeholder;
                }

                return this.dictionary.placeHolders[placeholder];
            },
            acknowledge(titlePlaceholder, descriptionPlaceholder) {
                this.modals.acknowledge.title = this.resolvePlaceHolder(titlePlaceholder);
                this.modals.acknowledge.description = this.resolvePlaceHolder(descriptionPlaceholder);
                this.modals.acknowledge.show = true;
            },
            async confirm(titlePlaceholder, descriptionPlaceholder) {
                this.modals.confirm.title = this.resolvePlaceHolder(titlePlaceholder);
                this.modals.confirm.description = this.resolvePlaceHolder(descriptionPlaceholder);
                this.modals.confirm.show = true;

                const result = await new Promise((resolve) => {
                    this.modals.confirm.confirm = () => {
                        resolve(true);
                    };

                    this.modals.confirm.cancel = () => {
                        resolve(false);
                    };
                });

                this.modals.confirm.show = false;

                return result;
            }, isAllowed(e) {
                if (![8,9,37,38,39,40,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,105,104,105,188,190].includes(e.which)) {
                    console.log(`Sorry ${e.which}`)
                    e.preventDefault();
                    return false;
                }

                return true;
            },reformat(stringValue) {
                if (stringValue == null || stringValue.trim() === '') {
                    return stringValue;
                }

                return this.formatService.reformat(stringValue);
            }, formatInput(e) {
                if (e == null) {
                    return;
                }

                console.log('You typed ' + e.which);

                if (![8,9,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,105,104,105,188,190].includes(e.which)) {
                    console.log(`Sorry ${e.which}`)
                    e.preventDefault();
                    return false;
                }

                let format = this.format;

                if (Number.isNaN(new LocalizedNumberParser(format).parse(e.target.value))) {
                    return true;
                }

                const currentValueString = e.target.value;
                let currentValue = null;

                try {
                    currentValue = new LocalizedNumberParser(format).parse(currentValueString);

                    if (currentValue != null) {
                        console.log(`Current value string: ${currentValueString}, parsed into ${currentValue} (${typeof currentValue}). Format: ${format}`);
                    } else {
                        console.log(`Current value string: ${currentValueString} can't be parsed into a ${format} value because the parser return a null value`);
                    }
                } catch (err) {
                    console.err(`Current value string: ${currentValueString} can't be parsed into a ${format} value because of an exception`, err);
                }

                let newValue;

                switch(e.which) {
                    case 48: case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:

                        if (!e.target.value.endsWith('.') && !e.target.value.endsWith(',')) {
                            e.target.value = this.formatUs(parseFloat(currentValue.toString() + (e.which - 48).toString())).slice(0, -1);
                        }

                        return true;
                    case 96: case 97: case 98: case 99: case 100: case 101: case 102: case 103: case 104: case 105:

                        if (!e.target.value.endsWith('.') && !e.target.value.endsWith(',')) {
                            e.target.value = this.formatUs(parseFloat(currentValue.toString() + (e.which - 96).toString())).slice(0, -1);
                        }

                        return true;
                    case 9: /*Tab*/
                        return true;
                    case 188: /*Comma*/ case 190: /*Dot*/
                        var character = e.which === 188 ? ',' : '.';

                        try {
                            newValue = new LocalizedNumberParser(format).parse(currentValueString + character);

                            if (Number.isNaN(newValue)) {
                                throw new Error('The parser returned a non value');
                            }

                            return true;
                        } catch (err) {
                            e.preventDefault();
                            console.error(`Can't add ${character} to ${e.target.value}`, err);
                            return false;
                        }
                    case 8: //Backspace
                        if (currentValueString == null || currentValueString.trim() === '' || currentValueString.slice(0, -1).trim() === '') {
                            return true;
                        }

                        e.target.value =
                            this.formatUs(new LocalizedNumberParser(format).parse(currentValueString.slice(0, -1))) +
                            e.target.value.charAt(e.target.value.length - 1);

                        return true;
                    default:
                        e.preventDefault();
                        return false;
                }
            }, parseFormatted(numericalString, def) {
                console.log(`Parsing ${numericalString} (${typeof numericalString}), `)

                if (numericalString == null) {
                    return def;
                }

                const result = new LocalizedNumberParser(this.format).parse(numericalString);

                if (Number.isNaN(result)) {
                    console.error(`Could not parse ${numericalString} (${typeof numericalString}) into a number according to format ${this.format}`);
                    return def;
                }

                return result;
            }, extractDataFromObject(def, object, ...tags) {
                if (object == null) {
                    return def;
                }

                if (tags.length === 0) {
                    return object;
                }

                let obj = object[tags[0]];

                if (tags.length >= 1) {
                    for (let i = 1; i < tags.length; i++) {
                        obj = obj[tags[i]];

                        if (obj == null) {
                            break;
                        }
                    }
                }

                if (obj == null) {
                    return def;
                }

                return obj;
            }, getSummary() {
                const summary = {};
                
                summary.round = this.game.round;

                if (this.game.winningCondition == null) {
                    return summary;
                }

                const winningCondition = this.game.winningCondition;

                summary.condition = winningCondition;

                if (this.player.role != 1) {
                    summary.value = this.player.property.v[winningCondition];

                    summary.firstDeclaration = this.player.firstDeclaration;
                    summary.firstTaxes = this.player.firstTaxes;

                    summary.secondDeclaration = this.player.secondDeclaration;
                    summary.secondTaxes = this.player.secondTaxes;
                }

                summary.firstRepurchase = this.player.firstRepurchase;

                summary.market = this.player.market;

                summary.secondRepurchase = this.player.secondRepurchase;
                
                return summary;
            }, updateSummary() {
                const summaryIdx = this.player.summaries.findIndex(s => s.round === this.game.round);

                if (summaryIdx == -1) {
                    console.log(`Adding a new summary of round ${this.game.round}`);
                    this.player.summaries.unshift(this.getSummary());
                } else {
                    console.log(`Updating the summary of round ${this.game.round} (element ${summaryIdx})`);
                    this.player.summaries[summaryIdx] = this.getSummary();
                }

                this.$refs['summaries'].$forceUpdate();
            }
        },
        mounted () {
            const self = this;

            this.game.id = parseInt(this.$route.params.id);
            this.player.recovery = this.$route.params.recovery;
            window.vue = this;

            this.dictionary = dictionary;

            if (dictionary.parameters.format != null) {
                this.format = dictionary.parameters.format;
            }

            this.formatService = new FormatService(this.format);

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

                    console.log('AWAITING TO RECOVER THE DATA');

                    await new Promise(resolve => setTimeout(resolve, 1)); //allows the refs to load

                    self.recover(response.gameData);

                    console.log('DATA RECOVERED');

                    await new Promise(resolve => setTimeout(resolve, 1)); //allows the refs to load

                    EventService.on('component-ready', () => {
                        EventService.emit('data-recovered', response.gameData);
                    });
                }

                if (self.game.phase > 0) {
                    self.updateSummary();
                }

                var phaseInstructions = self.dictionary.instructions.phases[self.game.phase][
                    [null, 'speculator', 'developer', 'owner'][self.player.role != null ? self.player.role : 1]
                ];

                self.player.instructions = phaseInstructions;

                try {
                    self.openWebSocket();
                } catch (err) {
                    console.log(err);
                }
            });
        }
    }
</script>
<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(50px);
  opacity: 0;
}
</style>