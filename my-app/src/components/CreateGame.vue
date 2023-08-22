<template>
    <b-container fluid class="no-gutters">
        <Header />

        <b-row class="d-flex">
            <b-col class="form-group col-3 align-items-center d-flex">
                <label htmlFor="exampleInputEmail1">Game Type</label>
            </b-col>
            <b-col class="form-group col-3">
                <select 
                    class="form-control" v-model="game_type" name="game_type" id="game_type" aria-describedby="emailHelp"
                    @change="onChangeGameType($event)" >
                    <option value="harberger">Harberger</option>
                    <option value="futarchy">Futarchy</option>
                    <option value="voting">Voting</option>
                    <option value="market">Double Auction</option>
                </select>
            </b-col>
        </b-row>

        <HarbergerFutarchyVoting v-if="['voting', 'harberger', 'futarchy'].includes(game_type)"  />
        <CreateMarket v-if="game_type === 'market'" />

        <b-row class="no-gutters justify-content-center flex-grow-1 p-3">
            <button type="button" @click='pushCreate()' class="btn btn-danger">Create</button>
        </b-row>
    </b-container>
</template>

<script>
import Header from './Header.vue'
import HarbergerFutarchyVoting from './createGames/CreateHarbergerFutarchyVoting.vue';
import CreateMarket from './createGames/CreateMarket.vue';

import EventService from '../services/EventService.js';
import { createGame } from '../services/GameService'

export default {
    name: 'CreateGame',
    data() {
        return {
            game_type: 'harberger'
        }
    },
    components: {
        Header,
        HarbergerFutarchyVoting,
        CreateMarket
    },
    methods: {
        onChangeGameType(event) {
            EventService.emit('game_type_changed', event);
        },
        pushCreate() {
            EventService.emit('go_ahead_with_game_creation');
        },
        createGameOnServer(payload) {
            createGame(payload).then((response) => {
                console.log(response);
                this.$router.push("/dashboard");
            });
        }
    },
    async mounted () {
        window.vue = this;
    }
}
</script>