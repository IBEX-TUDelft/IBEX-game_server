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
                        <div class="row">
                            <div class="btn-toolbar col-md-4">
                                <button type="button" @click='joinGame(item.id)' class="btn btn-primary">Join</button>
                            </div>
                            <div class="btn-toolbar col-md-4">
                                <button type="button" @click='analyseGame(item.id, item.type)' class="btn btn-primary">Analyse</button>
                            </div>
                            <div class="btn-toolbar col-md-4">
                                <button type="button" @click='interationLog(item.id, item.type)' class="btn btn-primary">{{ item.type === 'voting' ? 'Chat' : 'Market'}} Log</button>
                            </div>
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

const CHARACTERS ='abcdefghijklmnopqrstuvwxyz0123456789';

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
                } else {
                    routeData = this.$router.resolve({path: `/board/${id}/${this.generateString(63)}${game.assignedPlayers}`});
                }
                
                console.log('HRef:' + routeData.href);
                window.open(routeData.href, '_blank');
            } catch (e) {
                console.log(e);
            }
        },
        analyseGame: async function (id, type) {
            let subPath = 'analyse';

            if (type === 'voting') {
                subPath = 'analyse-voting';
            }

            try {
                const routeData = this.$router.resolve({path: `/${subPath}/${id}`});
                console.log('HRef:' + routeData.href);
                window.open(routeData.href, '_blank');
            } catch (e) {
                console.log(e);
            }
        },
        interationLog: async function (id, type) {
            let subPath = 'market';

            if (type === 'voting') {
                subPath = 'chat';
            }

            try {
                const routeData = this.$router.resolve({path: `/${subPath}/${id}`});
                console.log('HRef:' + routeData.href);
                window.open(routeData.href, '_blank');
            } catch (e) {
                console.log(e);
            }
        }
    }
}
</script>