<template>
    <div>
        <Header />
        <div class="border m-5 p-5">
            <div class="alert" :class="item.style" v-for="item in messages" :key="item.id">
                {{ item.message }}
            </div>
        </div>
    </div>
</template>
<script>
    import Header from './Header.vue';

    const styleMap = {
        "info": "alert-secondary",
        "notice": "alert-primary",
        "warning": "alert-warning",
        "error": "alert alert-danger",
        "fatal": "alert-dark",
    }
    export default {
        data() {
            return {
                connection: null,
                messages: [],
                game: {}
            };
        },
        components: {
            Header
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
                console.log(event);
                self.messages.push({
                    id: self.messages.length,
                    type: ev.type,
                    message: ev.message,
                    style: styleMap[ev.type]
                });

                while (self.messages.length > 5) {
                    self.messages.shift();
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