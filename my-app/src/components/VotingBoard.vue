<template>
    <div>
        <vue-confirm-dialog></vue-confirm-dialog>

        <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
                <b-navbar-nav>
                    <b-navbar-brand>
                        {{ player.title }}: {{ player.instructions }}
                    </b-navbar-brand>
                </b-navbar-nav>
                <b-navbar-nav class="ml-auto">
                    <b-nav-item active v-if="timer.on === true">Time left: {{ timer.minutes }}:{{ timer.seconds }}</b-nav-item>
                    <b-nav-item active >Round: {{ game.round }}</b-nav-item>
                    <b-nav-item active >Phase: {{ game.phase }}</b-nav-item>
                </b-navbar-nav>
            </b-navbar>
        </div>

        <div class="mt-1 mx-5 mp-1">
            <div class="row">

                <div v-if="game.players.length > 0 && game.conditions.length > 0" class="col-9">
                    <table class="table table-bordered" style="table-layout: fixed;">
                        <tbody>
                            <tr>
                                <td :style="player.tag === 'Owner 1' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard
                                        v-if="player.role === 2"
                                        ref="playerCard0"
                                        :player="game.players[0]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        ref="playerCard0"
                                        :player="game.players[0]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Developer' ? 'border: 2px red solid;' : ''">
                                    <DeveloperCard
                                        v-if="player.role === 2"
                                        ref="playerCard1"
                                        :player="game.players[1]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        ref="playerCard1"
                                        :player="game.players[1]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Owner 2' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        ref="playerCard2"
                                        :player="game.players[2]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        ref="playerCard2"
                                        :player="game.players[2]"
                                        :game="game"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td :style="player.tag === 'Owner 3' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        ref="playerCard3"
                                        :player="game.players[3]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        ref="playerCard3"
                                        :player="game.players[3]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Owner 4' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        ref="playerCard4"
                                        :player="game.players[4]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        ref="playerCard4"
                                        :player="game.players[4]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Owner 5' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        ref="playerCard5"
                                        :player="game.players[5]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        ref="playerCard5"
                                        :player="game.players[5]"
                                        :game="game"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <button v-if="!player.compensationOfferReceived && player.role === 2 && game.phase === 4" type="button" @click='submitCompensationOffers()' class="btn btn-primary" >Submit</button>
                </div>

                <div v-if="game.players.length > 0" class="col-3"> <!-- Player list -->
                    <div v-if="player.role === 3 && game.phase === 3" class="row mb-1"> <!-- Compensation request -->
                        <div class="text-center"><b>Compensation Requests</b></div>
                        <table class="table table-bordered">
                            <thead>
                                <th scope="col">Condition</th>
                                <th scope="col">Value</th>
                                <th scope="col">Request</th>
                            </thead>
                            <tbody>
                                <tr v-for="condition in game.conditions" :key="condition.id">
                                    <td>{{ condition.name }}</td>
                                    <td>{{ formatUs(player.property.v[condition.id]) }}</td>
                                    <td><input type="number" class="form-control" v-model="player.compensationRequests[condition.id]" :name="'player_compensation_' + condition.id" :id="'player_compensation_' + condition.id" aria-describedby="emailHelp" /></td>
                                </tr>
                            </tbody>
                        </table>

                        <button v-if="!player.compensationRequestReceived" type="button" @click='submitCompensationRequest()' class="btn btn-primary" >Submit</button>
                    </div>

                    <div v-if="player.role === 2 && game.phase === 4" class="row mb-1"> <!-- Compensation request -->
                        <div class="text-center"><b>Make a Compensation Offer</b></div>
                        <table class="table table-bordered">
                            <thead>
                                <th scope="col">Condition</th>
                                <th scope="col">Offer</th>
                            </thead>
                            <tbody>
                                <tr v-for="condition in game.conditions" :key="condition.id">
                                    <td>{{ condition.name }}</td>
                                    <td><input type="number" class="form-control" v-model="game.compensationOffers[condition.id]" :name="'condition_compensation_' + condition.id" :id="'condition_compensation_' + condition.id" aria-describedby="emailHelp" /></td>
                                </tr>
                            </tbody>
                        </table>

                        <button v-if="!player.compensationOfferReceived" type="button" @click='submitCompensationOffers()' class="btn btn-primary" >Submit</button>
                    </div>

                    <div v-if="player.role === 3 && game.phase === 5" class="row mb-1"> <!-- Compensation request -->
                        <div class="text-center"><b>Compensation Offers</b></div>
                        <table class="table table-bordered">
                            <thead>
                                <th scope="col">Condition</th>
                                <th scope="col">Value</th>
                                <th scope="col">Offer</th>
                                <th scope="col">Accept</th>
                            </thead>
                            <tbody>
                                <tr v-for="condition in game.conditions" :key="condition.id">
                                    <td>{{ condition.name }}</td>
                                    <td>{{ formatUs(player.property.v[condition.id]) }}</td>
                                    <td>{{ formatUs(player.property.lastOffer[condition.id]) }}</td>
                                    <td>
                                        <b-form-checkbox v-model="player.compensationDecisions[condition.id]" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <button v-if="!player.compensationDecisionReceived" type="button" @click='submitCompensationDecisions()' class="btn btn-primary" >Submit</button>
                    </div>

                    <div class="row mb-1 text-center"><b>Chat ({{ game.selectedPlayer == null ? 'Select player' : game.selectedPlayer.tag }})</b></div>

                    <div class="row mb-1">
                        <b-form-textarea
                            id="message"
                            v-model="outgoing_chat_message"
                            placeholder="Your message ..."
                            rows="3"
                            max-rows="6"
                        ></b-form-textarea>
                    </div>

                    <div class="row mb-1 justify-content-center">
                        <b-button @click="sendChatMessage" variant="primary">Send</b-button>
                    </div>

                    <div class="row">
                        <table class="table table-bordered">
                            <tbody>
                                <tr v-for="message in (game.selectedPlayer == null ? [] : game.selectedPlayer.messages)" :key="message.number">
                                    <td>{{ message.sender === player.number ? 'You' : game.selectedPlayer.tag }}: {{ message.text }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import DeveloperCard from './DeveloperCard.vue';
import OwnerCard from './OwnerCard.vue';
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
            game: {
                winningCondition: null,
                round: 1,
                phase: 0,
                ruleset: "Voting",
                conditions: [],
                players: [],
                selectedPlayerIndex: -1,
                selectedPlayer: null,
                compensationOffers: []
            },
            player: {
                title: "Starting",
                instructions: "Wait for other players to join",
                name: "",
                tag: "",
                number: 0,
                recoveryString: null,
                role: null,
                property: null,
                compensationRequests: [],
                compensationRequestReceived: false,
                compensationOfferReceived: false,
                compensationDecisions: [],
                compensationDecisionReceived: false
            },
            outgoing_chat_message: ''
        }
    },
    components: {
        DeveloperCard,
        OwnerCard
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
                        case "game-data":
                            self.player = ev.data.player;
                            self.game.players = ev.data.players;
                            self.game.conditions = ev.data.conditions;
                            break;
                        case "phase-transition":
                            self.game.round = ev.data.round;
                            self.game.phase = ev.data.phase;
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
                            self.player.title = self.player.tag;

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

                            sender.messages.push(ev.data);

                            self.$refs[`playerCard${sender.id}`].signalNewMessage();

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

                            break;
                        case 'compensation-offer-received':
                            self.player.compensationOfferReceived = true;

                            break;
                        case 'compensation-decision-received':
                            self.player.compensationDecisionReceived = true;

                            break;
                        case 'compensation-offer-made':
                            self.player.property.lastOffer = ev.data.compensationOffers;

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

            self.game.selectedPlayer.messages.push({
                "sender": self.player.number,
                "to": self.game.selectedPlayer.number,
                "text": self.outgoing_chat_message
            });

            this.sendMessage({
                "gameId": self.game.id,
                "type": "chat-with-player",
                "to": self.game.selectedPlayer.number,
                "text": self.outgoing_chat_message
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
        recover(data) {
            console.log(data);
            //TODO
        },
        setSelectedPlayer(playerIndex) {
            if (this.game.selectedPlayerIndex > -1) {
                this.$refs[`playerCard${this.game.selectedPlayerIndex}`].signalActivePlayer(false);
            }

            this.game.selectedPlayerIndex = playerIndex;
            this.game.selectedPlayer = this.game.players[playerIndex];

            if (this.game.selectedPlayerIndex > -1) {
                this.$refs[`playerCard${this.game.selectedPlayerIndex}`].signalActivePlayer(true);
            }
        },
        formatUs(num) {
            if (num == null || typeof num != 'number') {
                return num;
            }

            return num.toLocaleString('en-US');
        },
        submitCompensationRequest() {
            const self = this;

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-request",
                "compensationRequests": self.player.compensationRequests.map(c => parseInt(c))
            });
        },
        submitCompensationOffers() {
            const self = this;

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-offer",
                "compensationOffers": self.game.compensationOffers
            });
        },
        findPlayerByNumber(number) {
            return this.game.players.find(p => p.number === number);
        },
        submitCompensationDecisions() {
            const self = this;

            this.sendMessage({
                "gameId": self.game.id,
                "type": "compensation-decision",
                "compensationDecisions": self.player.compensationDecisions
            });
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

        if (response.data != null) {
            this.recover(response.data);
        }

        this.openWebSocket();
    }
}
</script>
