<template>
    <div>
        <vue-confirm-dialog></vue-confirm-dialog>

        <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-navbar-brand>
                        {{ game.phase === 0 && game.round === 1 ? 'New Player' : player.tag }}: {{ player.instructions }}
                    </b-navbar-brand>
                </b-navbar-nav>
                <b-navbar-nav class="ml-auto">
                    <b-nav-item active v-if="timer.on === true">Time left: {{ timer.minutes }}:{{ timer.seconds }}</b-nav-item>
                    <b-nav-item active >Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active >Phase: {{ game.phase }}</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div class="b-container mt-1 mx-5">

            <div class="row d-flex align-items-center justify-content-center" style="height: 500px;" v-if="game.phase === 0">
                <b-button v-if="player.ready === false" size="lg" @click="signalReady" variant="primary">I am Ready</b-button>
                <div v-else>Waiting all players to join ...</div>
            </div>

            <div class="row" v-if="game.phase >= 1">
                <div class="col-8">
                    <div v-if="game.phase >= 2" class="row mb-1">
                        <div class="col-12 text-center">
                            <b>Conditions and Plot Values</b>
                        </div>
                    </div>

                    <div v-if="game.phase >= 2" class="row mb-1"> <!-- Compensation request -->
                        <b-form-group>

                            <div class="col-12">
                                <table v-if="player.role === 2" class="table table-bordered" style="table-layout: fixed;">
                                    <thead class="thead-dark">
                                        <th scope="col">Condition</th>
                                        <th scope="col">Value</th>
                                        <th v-if="game.phase >= 4" scope="col">Offer</th>
                                        <th v-if="game.phase === 4" scope="col">Profit</th>
                                    </thead>
                                    <tbody>
                                        <tr v-for="condition in game.conditions" :key="condition.id">
                                            <td>{{ condition.name }}</td>
                                            <td>{{ formatUs(player.property.v[condition.id]) }}</td>
                                            <td v-if="game.phase >= 4">
                                                <input v-if="condition.id != 0 && player.compensationOfferReceived != true" type="number" class="form-control" v-model="game.compensationOffers[condition.id]" :name="'condition_compensation_' + condition.id" :id="'condition_compensation_' + condition.id" aria-describedby="emailHelp" />
                                                <div v-if="game.phase >= 5">{{ formatUs(game.compensationOffers[condition.id]) }}</div>
                                            </td>
                                            <td v-if="game.phase === 4">
                                                <div>{{ formatUs(player.property.v[condition.id] - (game.compensationOffers[condition.id] != null ? game.compensationOffers[condition.id] : 0) * game.players.filter(p => p.role === 3).length) }}</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <table v-if="player.role === 3" class="table table-bordered" style="table-layout: fixed;">
                                    <thead class="thead-dark">
                                        <th scope="col">Condition</th>
                                        <th scope="col">Value</th>
                                        <th v-if="game.phase >= 3" scope="col">Request</th>
                                        <th v-if="game.phase >= 5" scope="col">Offer</th>
                                        <th v-if="game.phase === 3 || game.phase === 5" scope="col">Profit</th>
                                        <th v-if="game.phase === 5" scope="col">Accept</th>
                                    </thead>
                                    <tbody>
                                        <tr v-for="condition in game.conditions" :key="condition.id">
                                            <td>{{ condition.name }}</td>
                                            <td>{{ formatUs(player.property.v[condition.id]) }}</td>
                                            <td v-if="game.phase >= 3">
                                                <input v-if="condition.id != 0 && player.compensationRequestReceived === false && game.phase === 3" type="number" class="form-control" v-model="player.compensationRequests[condition.id]" :name="'player_compensation_' + condition.id" :id="'player_compensation_' + condition.id" aria-describedby="emailHelp" />
                                                <div v-if="condition.id != 0 && (player.compensationRequestReceived != false || game.phase !== 3)" >{{ formatUs(player.compensationRequests[condition.id]) }}</div>
                                            </td>
                                            <td v-if="game.phase >= 5">
                                                <div v-if="game.phase >= 5">{{ formatUs(game.compensationOffers[condition.id]) }}</div>
                                            </td>
                                            <td v-if="game.phase === 3">
                                                {{ formatUs(player.property.v[condition.id] + (player.compensationRequests[condition.id] != null ? parseInt(player.compensationRequests[condition.id]) : 0)) }}
                                            </td>
                                            <td v-if="game.phase === 5">
                                                {{ formatUs(player.property.v[condition.id] + (game.compensationOffers[condition.id] != null ? game.compensationOffers[condition.id] : 0)) }}
                                            </td>
                                            <td v-if="game.phase === 5">
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
                            <button v-if="!player.compensationRequestReceived && game.phase === 3 && player.role === 3" type="button" @click='submitCompensationRequest()' class="btn btn-primary" >Submit Request</button>
                            <button v-if="!player.compensationOfferReceived && player.role === 2 && game.phase === 4" type="button" @click='submitCompensationOffers()' class="btn btn-primary" >Submit Offer</button>
                            <button v-if="!player.compensationDecisionReceived && player.role === 3 && game.phase === 5" type="button" @click='submitCompensationDecisions()' class="btn btn-primary" >Submit Decision</button>
                        </div>
                    </div>

                    <div v-if="game.phase >= 1" class="row mb-1">
                        <div class="col-12 text-center">
                            <b>Plot matrix</b>
                        </div>
                    </div>

                    <div class="row mb-1" v-for="offset in [0,3]" :key="offset">
                        <div class="col-4" v-for="index in [0 + offset, 1 + offset, 2 + offset]" :key="index">
                            <DeveloperCard
                                v-if="game != null && game.players != null && game.players[index] != null"
                                :ref="'playerCard' + index"
                                :role="player.role"
                                :player="game.players[index]"
                                :game="game"
                                :owned="player.number === game.players[index].number"
                            />
                        </div>
                    </div>

                    <div v-if="game.boundaries != null"  class="row">

                        <div v-for="role in ['owner', 'developer']" :key="role" class="col-6">
                            <div class="text-center mb-1"><b>Value Ranges ({{ role }})</b></div>
                            <table class="table table-bordered" style="table-layout: fixed;">
                                <thead class="thead-dark">
                                    <th scope="col">Condition</th>
                                    <th scope="col">Minimum Value</th>
                                    <th scope="col">Maximum Value</th>
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

                <div class="col-4"> <!-- Player list -->

                    <div v-if="game.phase === 6" class="row mb-1">
                        <div class="col-12 text-center"><b>Final Result</b></div>
                    </div>

                    <div v-if="game.phase === 6" class="row mb-1">
                        <table class="table table-bordered">
                            <thead class="thead-dark">
                                <th scope="col">Condition</th>
                                <th scope="col">Value</th>
                                <th scope="col">Compensations</th>
                                <th scope="col">Total</th>
                            </thead>
                            <tbody>
                                <td>{{ game.conditions[player.result.condition].name }}</td>
                                <td>{{ formatUs(player.result.value) }}</td>
                                <td>{{ formatUs(player.result.compensation) }}</td>
                                <td>{{ formatUs(player.result.value + player.result.compensation) }}</td>
                            </tbody>
                        </table>
                    </div>

                    <div v-if="game.phase > 1" class="row mb-1"><div class="col-12 text-center"><b>Chat</b></div></div>

                    <div v-if="game.phase === 2" class="row mb-1">
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
                    </div>

                    <div v-if="game.phase === 2" class="row mb-1">
                        <b-form-textarea
                            id="message"
                            v-model="forms.outgoingChatMessage"
                            placeholder="Your message ..."
                            rows="3"
                            max-rows="6"
                        ></b-form-textarea>
                    </div>

                    <div v-if="game.phase === 2" class="row mb-1 justify-content-center">
                        <b-button @click="sendChatMessage" variant="primary">Send</b-button>
                    </div>

                    <div class="row">
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
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import DeveloperCard from './DeveloperCard.vue';
import { getGameStatus } from '../services/GameService'

export default {
    data() {
        return {
            connection: null,
            timer: {
                on: false,
                minutes: "00",
                seconds: "00"
            },
            forms: {
                messageRecipients: [],
                outgoingChatMessage: "",
                selectedCondition: 0
            },
            game: {
                winningCondition: null,
                round: 1,
                phase: 0,
                ruleset: "Voting",
                conditions: [],
                players: [],
                compensationOffers: [],
                messages: [],
                messageBoxes: []
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
                result: null
            }
        }
    },
    components: {
        DeveloperCard
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

                                self.forms.messageRecipients = [];
                                self.forms.outgoingChatMessage = '';
                                self.forms.selectedCondition = 0;
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
                        case 'phase-instructions':
                            self.player.instructions = ev.data.instructions;
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

                            break;
                        case 'final-profit':
                            self.player.result = ev.data;

                            break;
                        case 'round-end':
                            /*self.game.compensationOffers = [];
                            self.game.messages = [];

                            self.player.compensationRequests = [];
                            self.player.compensationRequestReceived = false;
                            self.player.compensationOfferReceived = false;
                            self.player.compensationDecisions = [];
                            self.player.compensationDecisionReceived = false;

                            self.forms.messageRecipients = [];
                            self.forms.outgoingChatMessage = "";
                            self.forms.selectedCondition = 0;*/

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
                this.$confirm({
                    message: 'Select at least one recipient or click on a message to reply to it',
                    button: {
                        yes: 'Continue'
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: () => {}
                });
                return;
            }

            if (self.forms.outgoingChatMessage == null || self.forms.outgoingChatMessage.trim().length === 0) {
                this.$confirm({
                    message: 'You can\t send an empty message',
                    button: {
                        yes: 'Continue'
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: () => {}
                });
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
                    /*const tags = [];

                    self.game.players.forEach(p => {
                        if (self.player.number === p.number) {
                            tags.push('You');
                            return;
                        }

                        if (message.to.includes(p.number) || message.sender === p.number) {
                            tags.push(p.tag);
                        }
                    });

                    message.participants = tags.slice(0, tags.length - 1).join(', ') + ' and ' + tags[tags.length - 1];*/
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
            if (num == null || typeof num != 'number') {
                return num;
            }

            return num.toLocaleString('en-US');
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

            const confirm = await new Promise(resolve => {
                this.$confirm({
                    "message": "Are you sure? You can't change the request later.",
                    "button": {
                        "yes": "Continue",
                        "no": "Cancel"
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: resolve
                });
            });

            if (!confirm) {
                return
            }

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-request",
                "compensationRequests": self.player.compensationRequests.map(c => parseInt(c))
            });
        },
        async submitCompensationOffers() {
            const self = this;

            const confirm = await new Promise(resolve => {
                this.$confirm({
                    "message": "Are you sure? You can't change the offer later.",
                    "button": {
                        "yes": "Continue",
                        "no": "Cancel"
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: resolve
                });
            });

            if (!confirm) {
                return
            }

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-offer",
                "compensationOffers": self.game.compensationOffers.map(c => parseInt(c))
            });
        },
        findPlayerByNumber(number) {
            return this.game.players.find(p => p.number === number);
        },
        async submitCompensationDecisions() {
            const self = this;

            const confirm = await new Promise(resolve => {
                this.$confirm({
                    "message": "Are you sure? You can't change your decision later.",
                    "button": {
                        "yes": "Continue",
                        "no": "Cancel"
                    },
                    /**
                     * Callback Function
                     * @param {Boolean} confirm
                     */
                    callback: resolve
                });
            });

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

        this.openWebSocket();
    }
}
</script>
