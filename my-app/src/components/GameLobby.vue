<template>
    <div>
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
                        <div class="btn-toolbar pull-right col-md-12">
                            <button type="button" @click='joinGame(item.id)' class="btn btn-primary">Join</button>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
<script>
import Header from './Header.vue'

export default {
    name: 'Games',
    data() {
        return {
            games: []
        }
    },
    async mounted () {
        const response = await this.$http.get("/games/started");

        this.games = response.data.data;
    },
    components: {
        Header
    },
    methods: {
        joinGame: async function (id) {
            try {
                const routeData = this.$router.resolve({path: `/board/${id}`});
                console.log('HRef:' + routeData.href);
                window.open(routeData.href, '_blank');
                //this.$router.push(`/board/${id}`);
            } catch (e) {
                console.log(e);
            }
        }
    }
}
</script>