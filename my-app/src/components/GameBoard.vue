<template>
    <div>
          <div>
            <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
            <div class="container justify-content-center">
                <b-navbar-brand>
                    {{ player.title }}
                </b-navbar-brand>
            </div>
            <b-navbar-nav class="ml-auto">
                <b-nav-item active>Round: {{ game.round }}</b-nav-item>
                <b-nav-item active>Phase: {{ game.phase }}</b-nav-item>
            </b-navbar-nav>
            </b-navbar>
        </div>
        <div class="mt-1 mx-5 ">
            <div class="alert" :class="item.style" v-for="item in lastThreeMessages" :key="item.id">
                {{ item.message }}
            </div>
        </div>
    </div>
</template>
<script>
    //import Header from './Header.vue';

    const roleMap = {
        1: "Speculator",
        2: "Owner",
        3: "Developer",
    };

    const styleMap = {
        "info": "alert-secondary",
        "notice": "alert-primary",
        "warning": "alert-warning",
        "error": "alert alert-danger",
        "fatal": "alert-dark",
    };

    export default {
        data() {
            return {
                connection: null,
                lastThreeMessages: [],
                messages: [],
                game: {
                    round: 1,
                    phase: 0
                },
                player: {
                    title: "Joining ...",
                    name: "",
                    role: null
                }
            };
        },
        components: {
            //Header
        },
        name: 'GameBoard',
        methods: {
        },
        mounted () {
            const self = this;

            this.game.id = parseInt(this.$route.params.id);

            this.connection = new WebSocket(process.env.VUE_APP_WSS);

            this.connection.onmessage = function(event) {
                const ev = JSON.parse(event.data);

                if (ev.type === "event") {
                    //TODO: give structure to this logic
                    switch(ev.eventType) {
                        case "assign-name":
                            self.player.name = ev.data.name;
                            self.player.title = ev.data.name;
                            break;
                        case "assign-role":
                            self.player.role = ev.data.role;
                            self.player.title += ` (${roleMap[ev.data.role]})`;
                            break;
                        case "phase-transition":
                            self.game.round = ev.data.round;
                            self.game.phase = ev.data.phase;
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

            this.connection.onopen = function(event) {
                console.log(event)
                console.log("Successfully connected to the websocket server...");

                const msg = JSON.stringify({
                    "gameId": self.game.id,
                    "type": "join"
                });
                
                self.connection.send(msg);
            }
        }
    }
</script>