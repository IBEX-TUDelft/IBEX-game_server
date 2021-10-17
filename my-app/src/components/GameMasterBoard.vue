<template>
    <div>
        <Header />
        <div v-for="message in messages" :key="message">
            {{ message }}
        </div>
    </div>
</template>
<script>
    import Header from './Header.vue';

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
        name: 'GameMasterBoard',
        methods: {
        },
        mounted () {
            this.game.id = this.$route.params.id;

            this.connection = new WebSocket(process.env.VUE_APP_WSS);

            this.connection.onmessage = function(event) {
                console.log(event);
                this.messages.push(event);
            }

            this.connection.onopen = function(event) {
                console.log(event)
                console.log("Successfully connected to the websocket server...")
            }
        }
    }
</script>
