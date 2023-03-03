<template>
    <b-col><div class="d-flex flex-column h-100">
        <confirm></confirm>
        <acknowledge></acknowledge>

        <b-row class="no-gutters justify-content-center">
            <b-col>
                <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
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
                    <b-button v-if="player.ready === false" size="lg" @click="signalReady" variant="primary">{{ resolvePlaceHolder('ready-button') }}</b-button>
                    <div v-else>{{ resolvePlaceHolder('waiting-for-others') }}</div>
                </b-row>
            </b-col>
        </b-row>

        <b-row v-if="game.phase < 7" class="flex-row no-gutters">

            <div class="d-flex flex-column col-8" v-if="game.phase >= 1">
                <b-row v-if="game.phase >= 2" class="no-gutters py-1 px-2">
                    <div class="col-12 text-center">
                        <b>{{ resolvePlaceHolder('conditions-plot-values-title') }}</b>
                    </div>
                </b-row>

                <b-row v-if="game.phase >= 2" class="no-gutters py-1 px-2">
                    <b-form-group>

                        <div class="col-12 p-0">
                            <table v-if="player.role === 2" class="table table-bordered" style="table-layout: fixed;">
                                <thead class="thead-dark">
                                    <th scope="col">Condition</th>
                                    <th scope="col">Value (Project Impact)</th>
                                    <th v-if="game.phase >= 4" scope="col">Offer</th>
                                    <th v-if="game.phase === 4 || game.phase === 5 || game.phase === 6" scope="col">Profit</th>
                                </thead>
                                <tbody>
                                    <tr v-for="condition in game.conditions" :key="condition.id">
                                        <td>{{ condition.name }}</td>
                                        <td>{{ formatUs(player.property.v[condition.id]) }} {{ condition.id === 0 ? '' : '(' + formatUs(player.property.v[condition.id] - player.property.v[0]) + ')' }}</td>
                                        <td v-if="game.phase >= 4">
                                            <b-form-input @keydown="isAllowed" @keyup="onChange" v-if="condition.id != 0 && player.compensationOfferReceived != true" class="form-control" v-model="game.compensationOffers[condition.id]" :name="'condition_compensation_' + condition.id" :id="'condition_compensation_' + condition.id" aria-describedby="emailHelp" />
                                            <div v-if="game.phase >= 5">{{ formatUs(game.compensationOffers[condition.id]) }}</div>
                                        </td>
                                        <td v-if="game.phase === 4 || game.phase === 5 || game.phase === 6">
                                            <div>{{ formatUs(player.property.v[condition.id] - parseFormatted(extractDataFromObject('0', game.compensationOffers, condition.id)) * game.players.filter(p => p.role === 3).length) }}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table v-if="player.role === 3" class="table table-bordered" style="table-layout: fixed;">
                                <thead class="thead-dark">
                                    <th scope="col">Condition</th>
                                    <th scope="col">Value (Project Impact)</th>
                                    <th v-if="game.phase >= 3" scope="col">Request</th>
                                    <th v-if="game.phase >= 5" scope="col">Offer</th>
                                    <th v-if="game.phase === 3 || game.phase === 4 || game.phase === 5 || game.phase === 6" scope="col">Profit</th>
                                    <th v-if="game.phase === 6" scope="col">Vote</th>
                                </thead>
                                <tbody>
                                    <tr v-for="condition in game.conditions" :key="condition.id">
                                        <td>{{ condition.name }}</td>
                                        <td>{{ formatUs(player.property.v[condition.id]) }} {{ condition.id === 0 ? '' : '(' + formatUs(player.property.v[condition.id] - player.property.v[0]) + ')' }}</td>
                                        <td v-if="game.phase >= 3">
                                            <b-form-input @keydown="isAllowed" @keyup="onChange" v-if="condition.id != 0 && player.compensationRequestReceived === false && game.phase === 3" class="form-control" v-model="player.compensationRequests[condition.id]" :name="'player_compensation_' + condition.id" :id="'player_compensation_' + condition.id" aria-describedby="emailHelp" />
                                            <div v-if="condition.id != 0 && (player.compensationRequestReceived != false || game.phase !== 3)" >{{ formatUs(player.compensationRequests[condition.id]) }}</div>
                                        </td>
                                        <td v-if="game.phase >= 5" :style="game.phase === 5 ? 'background-color: yellow;' : ''">
                                            <div  v-if="game.phase >= 5">{{ formatUs(game.compensationOffers[condition.id]) }}</div>
                                        </td>
                                        <td v-if="game.phase === 3 || game.phase === 4">
                                            {{ formatUs(player.property.v[condition.id] + parseFormatted(player.compensationRequests[condition.id], 0)) }}
                                        </td>
                                        <td v-if="game.phase === 5 || game.phase == 6">
                                            {{ formatUs(player.property.v[condition.id] + extractDataFromObject(0, game.compensationOffers, condition.id)) }}
                                        </td>
                                        <td v-if="game.phase === 6" style="background-color: yellow;">
                                            <b-form-radio
                                                v-model="forms.selectedCondition"
                                                :name="'select-condition-' + condition.id"
                                                :value="condition.id"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                    </b-form-group>

                    <div class="col-12 mb-1 text-center">
                        <button v-if="!player.compensationRequestReceived && game.phase === 3 && player.role === 3" type="button" @click='submitCompensationRequest()' class="btn btn-primary" >{{ resolvePlaceHolder('submit-request-button') }}</button>
                        <button v-if="!player.compensationOfferReceived && player.role === 2 && game.phase === 4" type="button" @click='submitCompensationOffers()' class="btn btn-primary" >{{ resolvePlaceHolder('submit-offer-button') }}</button>
                        <button v-if="!player.compensationDecisionReceived && player.role === 3 && game.phase === 6" type="button" @click='submitCompensationDecisions()' class="btn btn-primary" >{{ resolvePlaceHolder('submit-decision-button') }}</button>
                    </div>
                </b-row>

                <b-row v-if="game.phase >= 1" class="no-gutters py-1 px-2">
                    <div class="col-12 text-center">
                        <b>{{ resolvePlaceHolder('plot-matrix') }}</b>
                    </div>
                </b-row>

                <b-row class="no-gutters py-1 px-2" >
                    <div class="col-4 px-1" v-for="index in [0,1,2]" :key="index">
                        <DeveloperCard
                            v-if="game != null && game.players != null && game.players[index] != null"
                            :ref="'playerCard' + index"
                            :role="player.role"
                            :player="game.players[index]"
                            :game="game"
                            :owned="player.number === game.players[index].number"
                        />
                    </div>
                </b-row>

                <b-row class="no-gutters pb-1 px-2" v-if="game.players.length > 3">
                    <div class="col-4 px-1" v-for="index in [3,4,5]" :key="index">
                        <DeveloperCard
                            v-if="game != null && game.players != null && game.players[index] != null"
                            :ref="'playerCard' + index"
                            :role="player.role"
                            :player="game.players[index]"
                            :game="game"
                            :owned="player.number === game.players[index].number"
                        />
                    </div>
                </b-row>

                <b-row v-if="game.boundaries != null"  class="no-gutters py-1 px-2">

                    <div v-for="role in ['owner', 'developer']" :key="role" class="col-6 p-1">
                        <div class="text-center"><b>Value Ranges ({{ role }})</b></div>
                        <table class="table table-bordered mb-0" style="table-layout: fixed;">
                            <thead class="thead-dark">
                                <th scope="col">Condition</th>
                                <th scope="col">Minimum Value</th>
                                <th scope="col">Maximum Value</th>
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

            <div class="d-flex flex-column col-4" v-if="game.phase >= 1"> <!-- Player list -->

                <b-row v-if="game.phase === 4 && player.role === 2" class="no-gutters py-1 px-2"><div class="col-12 text-center"><b>Requests</b></div></b-row>

                <b-row v-if="game.phase === 4 && player.role === 2" class="no-gutters py-1 px-2">
                    <table class="table table-bordered" style="table-layout: fixed;">
                        <thead class="thead-dark">
                            <th scope="col">Player</th>
                            <th scope="col">Request</th>
                        </thead>
                        <tbody>
                            <tr v-for="p in game.players.filter(p => p.role === 3).map(p => { return { n: p.number, t: p.tag, r: p.property.lastOffer[1] }; }).sort((a, b) => b.r - a.r)"
                                :key="p.n">
                                <td>{{ p.t }}</td>
                                <td>{{ formatUs(p.r) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </b-row>

                <b-row v-if="game.phase > 1" class="no-gutters py-1 px-2"><div class="col-12 text-center"><b>Chat</b></div></b-row>

                <b-row v-if="game.phase === 2 || game.phase === 5" class="d-flex flex-row no-gutters py-1 px-2">
                    <div class="col-6">
                        <b-form-checkbox-group
                            id="message-recipients"
                            v-model="forms.messageRecipients"
                            name="message-recipients"
                            stacked
                        >
                            <b-form-checkbox v-for="p in game.players.filter(i => i.number != player.number)" :key="p.number" :value="p.number">
                                {{ p.tag }}</b-form-checkbox>
                        </b-form-checkbox-group>
                    </div>
                    <div class="col-6 text-center">
                        <b-button size="sm" block @click="forms.messageRecipients = game.players.filter(p => p.number != player.number).map(p => p.number)" variant="primary" class="mb-1">Select All</b-button>
                        <b-button size="sm" block @click="forms.messageRecipients = game.players.filter(p => p.role != 2 && p.number != player.number).map(p => p.number)" variant="primary" class="mb-1">Select Owners</b-button>
                        <b-button size="sm" block @click="forms.messageRecipients = []" variant="primary">Deselect All</b-button>
                    </div>
                </b-row>

                <b-row v-if="game.phase === 2 || game.phase === 5" class="no-gutters py-1 px-2">
                    <b-form-textarea
                        id="message"
                        v-model="forms.outgoingChatMessage"
                        placeholder="Your message ..."
                        rows="3"
                        max-rows="6"
                    ></b-form-textarea>
                </b-row>

                <b-row v-if="game.phase === 2 || game.phase === 5" class="no-gutters justify-content-center py-1 px-2">
                    <b-button @click="sendChatMessage" variant="primary">Send</b-button>
                </b-row>

                <b-row class="d-flex flex-1 flex-row no-gutters py-1 px-2" style="height: 300px; display: flex; overflow: scroll;">
                    <div v-for="box in game.messageBoxes" :key="box.participants" class="col-12 mb-1 px-0">
                        <b-card
                            :header="box.participants"
                            header-tag="header"
                            @click="forms.messageRecipients = box.people.filter(i => i != player.number)"
                        >
                            <b-card-text class="px-0">
                                <div v-for="message in box.messages" :key="message.time">
                                    <b>{{ (message.sender === player.number ? 'You' : game.players.find(p => p.number === message.sender).tag) }}</b>: {{ message.text }}
                                </div>
                            </b-card-text>
                        </b-card>
                    </div>
                </b-row>
            </div>

        </b-row>

        <b-row class="flex-row no-gutters no-gutters pb-1 px-2">
            <b-col class="d-flex flex-column">
                <b-row class="d-flex flex-row no-gutters mb-1">
                    <div class="col-12 text-center"><b>Results ({{game.over ? 'Reward round in yellow' : 'Current round in yellow'}})</b></div>
                </b-row>

                <b-row class="d-flex flex-row no-gutters">
                    <table class="table table-bordered" style="table-layout: fixed;">
                        <thead class="thead-dark">
                            <th scope="col">Round</th>
                            <th scope="col">Winning Condition</th>
                            <th scope="col">Votes for Project</th>
                            <th scope="col">Value</th>
                            <th scope="col">Compensations</th>
                            
                            <th scope="col">Total</th>
                        </thead>
                        <tbody>
                            <tr v-for="summary in player.summaries" :key="summary.round" :style="((summary.round === game.round) && !game.over) || ((game.reward != null) && game.reward.round === summary.round) ? 'background-color: yellow;' : ''">
                                <td>{{ summary.round != 0 ? summary.round : 'practice' }}</td>
                                <td>{{ summary.condition == null ? 'To be Determined' : game.conditions[summary.condition].name }}</td>
                                <td>{{ getTally(summary.round) }}</td>
                                <td>{{ summary.value == null ? '' : formatUs(summary.value) }}</td>
                                <td>{{ summary.compensation == null ? '' : formatUs(summary.compensation) }}</td>
                                <td>{{ summary.profit == null ? '' : formatUs(summary.profit)}}</td>
                            </tr>
                        </tbody>
                    </table>
                </b-row>
            </b-col>
        </b-row>

        <b-row class="no-gutters justify-content-center flex-grow-1" v-if="game.reward != null">
            <p>{{ resolvePlaceHolder(
                'reward-earned',
                game.reward.round,
                formatUs(game.reward.points),
                game.reward.exchange.toFixed(6),
                game.reward.reward
            )}}</p>
        </b-row>
    </div></b-col>
</template>

<script>
import DeveloperCard from './DeveloperCard.vue';
import Confirm from './modals/Confirm.vue';
import Acknowledge from './modals/Acknowledge.vue';
import { getGameStatus } from '../services/GameService'
import dictionary from '../assets/voting.json';
import { LocalizedNumberParser } from 'localized-number-parser';
import FormatService from '../services/FormatService';

export default {
    data() {
        return {
            showIntructions: true,
            connection: null,
            dictionary: {},
            format: 'en-US',
            timer: {
                on: false,
                minutes: "00",
                seconds: "00"
            },
            forms: {
                messageRecipients: [],
                outgoingChatMessage: "",
                selectedCondition: null
            },
            game: {
                winningCondition: null,
                round: 0,
                phase: 0,
                ruleset: "Voting",
                conditions: [],
                players: [],
                compensationOffers: [],
                messages: [],
                messageBoxes: [],
                over: false
            },
            player: {
                instructions: "",
                name: "",
                tag: "New Player",
                number: 0,
                recoveryString: null,
                role: null,
                property: null,
                ready: false,
                compensationRequests: [],
                compensationRequestReceived: false,
                compensationOfferReceived: false,
                compensationDecisions: [],
                compensationDecisionReceived: false,
                result: null,
                summaries: []
            },
            modals: {
                confirm: {
                    show: false,
                    title: 'Confirmation Request',
                    description: 'There is a problem',
                    callback: null
                }, acknowledge: {
                    show: false,
                    title: 'Confirmation Request',
                    description: 'There is a problem',
                    callback: null
                }
            },
        }
    },
    components: {
        DeveloperCard,
        Confirm,
        Acknowledge
    },
    methods: {
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
                            }, 2000);

                            if (ev.data.phase === 0) {
                                console.log('A NEW ROUND HAS BEGUN');
                                
                                self.game.compensationOffers = [];
                                self.game.messages = [];
                                self.game.messageBoxes = [];

                                self.player.compensationRequests = [];
                                self.player.compensationRequestReceived = false;
                                self.player.compensationOfferReceived = false;
                                self.player.compensationDecisions = [];
                                self.player.compensationDecisionReceived = false;
                                self.player.ready = false;

                                self.forms.messageRecipients = [];
                                self.forms.outgoingChatMessage = '';
                                self.forms.selectedCondition = null;
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
                        case 'assign-role':
                            self.player.role = ev.data.role;
                            self.player.property = ev.data.property;
                            self.player.number = ev.data.number;
                            self.player.tag = ev.data.tag;
                            self.player.id = ev.data.id;

                            self.game.boundaries = ev.data.boundaries;
                            self.game.conditions = ev.data.conditions;

                            break;
                        case 'players-known':
                            self.game.players = ev.data.players;

                            self.game.players.forEach((p,i) => {
                                p.messages = [];
                                p.compensationOffers = [];
                                p.id = i;
                            });

                            self.game.players[self.player.id].property = self.player.property;

                            break;
                        case 'message-received':
                            var sender = self.game.players.find(p => p.number === ev.data.sender);

                            if (sender == null) {
                                return console.error(`Player ${ev.data.sender} not found`);
                            }

                            var tags = [];

                            self.game.players.forEach(p => {
                                if (self.player.number === p.number) {
                                    tags.push('You');
                                    return;
                                }

                                if (ev.data.to.includes(p.number) || ev.data.sender === p.number) {
                                    tags.push(p.tag);
                                }
                            });

                            ev.data.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];
                            
                            self.game.messages.push(ev.data);

                            self.addMessage(ev.data);

                            break;
                        case 'compensation-request-received':
                            self.player.compensationRequestReceived = true;

                            break;
                        case 'compensation-requests-received':
                            ev.data.compensationRequests.forEach( cr => {
                                const player = self.findPlayerByNumber(cr.number);

                                if (player == null) {
                                    console.error(`Could not find player ${cr.number}`)
                                    return;
                                }

                                if (player.property == null) {
                                    player.property = {}
                                }

                                player.property.lastOffer = cr.compensationRequests;
                            });

                            for (let prop in self.$refs) {
                                self.$refs[prop][0].$forceUpdate();
                            }

                            break;
                        case 'compensation-offer-received':
                            self.player.compensationOfferReceived = true;

                            break;
                        case 'compensation-decision-received':
                            self.player.compensationDecisionReceived = true;

                            break;
                        case 'compensation-offer-made':
                            self.player.property.lastOffer = ev.data.compensationOffers;
                            self.game.compensationOffers = ev.data.compensationOffers;

                            /*if (self.player.role === 3) {
                                if (self.player.property.v[0] > self.player.property.v[1] + self.game.compensationOffers[1]) {
                                    self.acknowledge('compensation-insufficient-owner-title', 'compensation-insufficient-owner-description');
                                }
                            }*/
                            break;
                        case 'final-profit':
                            self.player.result = ev.data;

                            break;
                        case 'round-end':
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
                        case 'reward':
                            self.game.reward = ev.data;
                            break;
                        default:
                            console.error(`Type ${ev.eventType} was not understood`);
                    }
                } else { //it is a message
                    console.log(`${ev.type} - ${ev.message}`);
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
        sendMessage(msg) {
            this.connection.send(JSON.stringify(msg));
        },
        sendChatMessage() {
            const self = this;

            const tags = ['You'];

            if (self.forms.messageRecipients.length === 0) {
                this.acknowledge('message-problem-title', 'message-no-recipients-description');
                return;
            }

            if (self.forms.outgoingChatMessage == null || self.forms.outgoingChatMessage.trim().length === 0) {
                this.acknowledge('message-problem-title', 'message-empty-description"');
                return;
            }

            self.game.players.forEach(p => {
                if (self.forms.messageRecipients.includes(p.number)) {
                    tags.push(p.tag);
                }
            });

            const message = {
                "sender": self.player.number,
                "to": self.forms.messageRecipients,
                "text": self.forms.outgoingChatMessage,
                "participants": tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1],
                "time": Date.now()
            };

            self.addMessage(message);

            self.game.messages.push(message);

            this.sendMessage({
                "gameId": self.game.id,
                "type": "chat-with-players",
                "to": self.forms.messageRecipients,
                "text": self.forms.outgoingChatMessage
            });

            self.forms.outgoingChatMessage = '';
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
        recover(gameData) {
            const self = this;

            console.log(gameData);
            //TODO

            for (const prop in self.player) {
                if (typeof self.player[prop] === "function") {
                    continue;
                }

                self.player[prop] = null;
            }

            if (self.player.summaries == null) {
                self.player.summaries = [];
            }

            self.player.compensationRequestReceived = false;
            self.player.compensationOfferReceived = false;
            self.player.compensationDecisionReceived = false;
            self.player.compensationRequests = [];
            self.player.compensationDecisions = [];
            
            for (const prop in gameData.player) {
                self.player[prop] = gameData.player[prop];
            }

            self.game = gameData.game;
            self.game.messageBoxes = [];

            if (self.game.messages != null) {
                self.game.messages.forEach(message => {
                    self.addMessage(message);
                });
            }

            if (gameData.game.compensationRequests != null) {
                gameData.game.compensationRequests.forEach(cr => {
                    const player = self.findPlayerByNumber(cr.number);

                    if (player == null) {
                        console.error(`Could not find player ${cr.number}`)
                        return;
                    }

                    if (player.property == null) {
                        player.property = {}
                    }

                    player.property.lastOffer = cr.compensationRequests;
                })
            }

            if (gameData.timer != null) {
                self.timer.end = gameData.timer > Date.now() ? gameData.timer : Date.now();

                self.updateTimer();

                self.timer.on = true;
            }
        },
        formatUs(num) {
            return this.formatService.format(num);
        }, reformat(stringValue) {
            return this.formatService.reformat(stringValue);
        },
        signalReady() {
            const self = this;

            this.sendMessage({
                "gameId": self.game.id,
                "type": "player-is-ready",
            });
        },
        async submitCompensationRequest() {
            const self = this;

            const confirm = await this.confirm('submit-request-title', 'submit-request-description');

            console.log(confirm);

            if (!confirm) {
                return
            }

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-request",
                "compensationRequests": self.player.compensationRequests.map(c => new LocalizedNumberParser(self.format).parse(c))
            });
        },
        async submitCompensationOffers() {
            const self = this;

            let confirm;

            let likelyVotes = 0;

            const compensations = self.game.compensationOffers.map(c => new LocalizedNumberParser(self.format).parse(c));

            this.game.players.forEach(p => {
                if (p.role != 3) {
                    return;
                }

                if (compensations[1] >= p.property.lastOffer[1]) {
                    likelyVotes++;
                }
            });

            if (likelyVotes >= (this.game.players.length - 1) / 2) {
                confirm = await this.confirm('submit-offer-title', 'submit-offer-description');
            } else {
                confirm = await this.confirm('compensation-insufficient-dev-title', 'compensation-insufficient-dev-description');
            }

            if (!confirm) {
                return
            }

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-offer",
                "compensationOffers": compensations
            });
        },
        findPlayerByNumber(number) {
            return this.game.players.find(p => p.number === number);
        },
        async submitCompensationDecisions() {
            const self = this;

            const confirm = await this.confirm('submit-decision-title', 'submit-decision-description');

            if (!confirm) {
                return
            }

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-decision",
                "compensationDecisions": [self.forms.selectedCondition]
            });
        },
        addMessage(message) {
            const self = this;

            const people = [message.sender, ...message.to];

            let box = this.game.messageBoxes.find(mb => {
                let counter = 0;

                people.forEach(number => {
                    if (mb.people.includes(number)) {
                        counter++;
                    }
                });

                return counter === mb.people.length && counter === people.length;
            })

            if (box == null) {
                box = {
                    "people": people,
                    "messages": []
                }

                const tags = [];

                self.game.players.forEach(p => {
                    if (self.player.number === p.number) {
                        tags.push('You');
                        return;
                    }

                    if (message.to.includes(p.number) || message.sender === p.number) {
                        tags.push(p.tag);
                    }
                });

                box.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];

                this.game.messageBoxes.push(box);
            }

            box.messages = [{
                "time": message.time,
                "sender": message.sender,
                "text": message.text},
                ...box.messages
            ];

            box.last = message.time;

            this.game.messageBoxes.sort((a,b) => b.last - a.last);
        },
        resolvePlaceHolder(placeholder, ...parameters) {
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


            let line = this.dictionary.placeHolders[placeholder];

            if (parameters != null) {
                parameters.forEach((p, i) => {
                    line = line.replace('${' + i + '}', p);
                })
            }

            return line;
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
        }, parseFormatted(numericalString, def) {
            console.log(`Parsing ${numericalString} (${typeof numericalString}), `)

            if (numericalString == null) {
                return def;
            }

            if (typeof numericalString == 'number') {
                return numericalString;
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
        }, isAllowed(e) {
            if (![8,9,37,38,39,40,46,48,49,50,51,52,53,54,55,56,57,96,97,98,99,100,101,102,103,104,105,110,188,190].includes(e.which)) {
                console.log(`Sorry ${e.which}`)
                e.preventDefault();
                return false;
            }

            return true;
        }, onChange(e) {
            if (!this.isAllowed(e)) {
                return false;
            }

            if (e.target.value == null || e.target.value.trim() == '') {
                return;
            }

            if ([37, 39].includes(e.which)) {
                return;
            }

            const valueToCaret = e.target.value.substring(0, e.target.selectionStart);

            if (valueToCaret == null || valueToCaret.trim() == '') {
                e.target.selectionStart = 0;
                e.target.selectionEnd = 0;

                return;
            }

            let key = e.key;

            if ([8, 46].includes(e.which)) {
                key = valueToCaret[valueToCaret.length - 1];

                if (key === '.') {
                    key = valueToCaret[valueToCaret.length - 2];
                }
            }

            const relativePositionOfKey = valueToCaret.split(key).length - 1;
            
            e.target.value = this.reformat(e.target.value);

            let caret = 0;
            let repetitionOfKeys = 0;

            while (repetitionOfKeys < relativePositionOfKey) {
                if (e.target.value.charAt(caret) === key) {
                    repetitionOfKeys++;
                }

                if (caret === e.target.value.length) {
                    break;
                }

                caret ++;
            }

            e.target.selectionStart = caret;
            e.target.selectionEnd = caret;
        }, getSummary() {
            const summary = {};
            
            summary.round = this.game.round;

            if (this.game.phase === 7) {
                summary.condition = this.player.result.condition;
                summary.value = this.player.property.v[this.player.result.condition];
                summary.compensation = this.player.result.compensation;
                summary.tally = this.player.result.tally;
                summary.profit = this.player.result.value + this.player.result.compensation;
            }

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

            this.$forceUpdate();
        }, getRequestMedian() {
            const items = this.game.players.filter(p => p.role === 3)
                .filter(p => p.property != null && p.property.lastOffer != null)
                .map(p => { return { n: p.number, t: p.tag, r: p.property.lastOffer[1] }; })
                .sort((a, b) => b.r - a.r);
            
            if (items == null || items.length === 0) {
                return 0;
            }

            if (items.length === 1) {
                return items[0].r;
            }

            var half = Math.floor(items.length / 2);
    
            if (items.length % 2)
                return items[half].r;
            
            return (items[half - 1].r + items[half].r) / 2.0;
        }, test(e, scope) {
            console.log('EVENT')
            console.log(e);
            console.log(scope)
            console.log('END EVtT')
        }, getTally(round) {
            if (this.player.summaries == null) {
                return '';
            }

            const summary = this.player.summaries.find(s => s.round === round);

            if (summary == null) {
                return '';
            }

            if (summary.condition == null || summary.tally == null) {
                return '';
            }

            if (summary.condition === 1) {
                return summary.tally;
            } else {
                return this.game.players.length - 1 - summary.tally;
            }
        }
    },
    async mounted () {
        this.game.id = parseInt(this.$route.params.id);
        this.player.recovery = this.$route.params.recovery;
        window.vue = this;

        console.log(`${process.env.VUE_APP_API}`);

        const response = await getGameStatus(this.$route.params.id, this.$route.params.recovery);

        console.log('Status: ');
        console.log(response);

        if (response.canJoin != true) {
            console.log('The game is full');
            return;
        }

        if (response.gameData != null) {
            this.recover(response.gameData);
        }

        this.dictionary = dictionary;

        if (dictionary.parameters.format != null) {
            this.format = dictionary.parameters.format;
        }

        this.formatService = new FormatService(this.format);

        if (this.game.phase > 0) {
            this.updateSummary();
        }

        var phaseInstructions = this.dictionary.instructions.phases[this.game.phase][
            [null, 'speculator', 'developer', 'owner'][this.player.role != null ? this.player.role : 3]
        ];

        this.player.instructions = phaseInstructions;

        try {
            this.openWebSocket();
        } catch (err) {
            console.log(err);
        }
    }
}
</script>
<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 2.0s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100px);
  opacity: 0;
}
</style>