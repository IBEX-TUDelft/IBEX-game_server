<template>
    <b-container fluid class="no-gutters">
        <Header />
        <div class="table-responsive px-5">
            <table class="table table-bordered">
                <thead class="thead-dark">
                <tr>
                    <th scope="col">Game</th>
                    <th scope="col">Type</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Round</th>
                    <th scope="col">Phase</th>
                    <th scope="col">Join</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in games" :key="item.id">
                    <td>{{ item.title }}</td>
                    <td>{{ item.type }}</td>
                    <td>{{ item.assignedPlayers }}</td>
                    <td>{{ item.currentRound.number }}</td>
                    <td>{{ item.currentRound.phase }}</td>
                    <td>
                        <div class="row">
                            <div class="btn-toolbar col-md-3">
                                <button type="button" @click='joinGame(item.id)' class="btn btn-primary">Join</button>
                            </div>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </b-container>
</template>
<script>
import Header from './Header.vue'

const CHARACTERS ='abcdefghijklmnopqrstuvwxyz0123456789';

import * as GameService from '../services/GameService';

export default {
    name: 'Games',
    data() {
        return {
            games: []
        }
    },
    async mounted () {
        const response = await this.$http.get("/games/started");

        this.games = response.data.data.filter(game => game.ended_at == null);
    },
    components: {
        Header
    },
    methods: {
        generateString: function (length) {
            let result = '';

            const charactersLength = CHARACTERS.length;

            for ( let i = 0; i < length; i++ ) {
                result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
            }

            return result;
        },
        joinGame: async function (id) {
            const game = this.games.find(g => g.id === id);

            if (game == null) {
                console.error(`Could not find game with id ${id}`);
                return;
            }

            try {
                let routeData;

                if (game.type === 'voting') {
                    routeData = this.$router.resolve({path: `/voting/${id}/${this.generateString(63)}${game.assignedPlayers}`});
                } else if (game.type === 'market') {
                    const result = await GameService.joinMarketGame(id);
                    routeData = this.$router.resolve({path: result.redirect });
                } else {
                    routeData = this.$router.resolve({path: `/board/${id}/${this.generateString(63)}${game.assignedPlayers}`});
                }
                

                if (process.env.VUE_APP_ON_JOIN_GAME === 'push') {
                    this.$router.push({ path: routeData.href });
                } else {
                    window.open(routeData.href, '_blank');
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}
</script>