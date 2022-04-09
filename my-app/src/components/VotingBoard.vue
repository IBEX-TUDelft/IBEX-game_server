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
                                        :player="game.players[0]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        :player="game.players[0]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Developer' ? 'border: 2px red solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        :player="game.players[1]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        :player="game.players[1]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Owner 2' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        :player="game.players[2]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        :player="game.players[2]"
                                        :game="game"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td :style="player.tag === 'Owner 3' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        :player="game.players[3]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        :player="game.players[3]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Owner 4' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        :player="game.players[4]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        :player="game.players[4]"
                                        :game="game"
                                    />
                                </td>
                                <td :style="player.tag === 'Owner 5' ? 'border: 2px yellow solid;' : ''">
                                    <DeveloperCard 
                                        v-if="player.role === 2"
                                        :player="game.players[5]"
                                        :game="game"
                                    />
                                    <OwnerCard
                                        v-else
                                        :player="game.players[5]"
                                        :game="game"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="game.players.length > 0" class="col-3"> <!-- Player list -->
                    <div class="text-center"><b>Chat</b></div>
                    <table class="table table-bordered text-center">
                        <tbody>
                            <tr v-for="message in game.players[game.selectedPlayer].messages" :key="message.number">
                                <td>{{ message.sender === player.number ? 'You' : game.players[game.selectedPlayer].tag }}: {{ message.text }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import DeveloperCard from './DeveloperCard.vue';
import OwnerCard from './OwnerCard.vue';

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
                selectedPlayer: 0,
                a: 1
            },
            player: {
                title: "Starting",
                instructions: "Wait for other players to join",
                name: "",
                number: 0,
                recoveryString: null,
                role: null
            }
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
                        case "set-timer":
                            self.timer.end = ev.data.end;

                            self.updateTimer();

                            self.timer.on = true;

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
        },
        sendMessage(msg) {
            this.connection.send(JSON.stringify(msg));
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
        }
    },
    mounted () {
        this.game.id = parseInt(this.$route.params.id);
        window.vue = this;
    },
    created() {
        window.addEventListener("load", this.openWebSocket);
    },
}
</script>
