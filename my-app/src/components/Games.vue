<template>
        <div class="table-responsive px-5">
            <table class="table table-bordered">
                <thead class="thead-dark">
                <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Game</th>
                    <th scope="col">Created</th>
                    <th scope="col">Controls</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in games" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.title }}</td>
                    <td>{{ item.created_at }}</td>
                    <td>
                        <div class="btn-toolbar pull-right row-12">
                            <div class="mr-2">
                                <button v-if="item.started === false && item.ended_at == null" type="button" @click="startGame(item.id)" class="btn btn-success mr-1">Start</button>
                            </div>
                            <div class="mr-2">
                                <button type="button" @click='deleteGame(item.id)' class="btn btn-danger">Delete</button>
                            </div>
                            <div class="mr-2">
                                <button type="button" @click='analyseGame(item.id, item.type)' class="btn btn-primary">Analyse</button>
                            </div>
                            <div class="mr-2">
                                <button type="button" @click='interationLog(item.id, item.type)' class="btn btn-primary">{{ item.type.toString().toLowerCase() === 'voting' ? 'Chat' : 'Market'}} Log</button>
                            </div>
                            <div class="mr-2">
                                <button type="button" @click='surveys(item.id)' class="btn btn-primary">Surveys</button>
                            </div>
                            <div class="mr-2">
                                <button type="button" @click='gameJson(item.id)' class="btn btn-primary">{{ item.id }}.log.json</button>
                            </div>
                            <div class="">
                                <button type="button" @click='downloadAll(item.id, item.type)' class="btn btn-success">Download All</button>
                            </div>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
</template>

<script>
import { getGameJson } from '../services/GameService';
import * as VotingService from '../services/VotingService';
import * as HarbergerFutarchyService from '../services/HarbergerFutarchyService';

export default {
    name: 'Games',
    props: ['games'],
    methods: {
        async gameJson(id) {
            try {
                const jsonData = await getGameJson(id);

                const blob = new Blob([jsonData.toString()], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `${id}.log.json`;

                link.click();

                URL.revokeObjectURL(url);
            } catch (e) {
                console.log(e);
            }
        },
        detailGame() {

        },
        startGame: async function (id) {
            const token = localStorage.getItem("token");

            try {
                await this.$http.get("/games/start", {
                    params: {
                        token,
                        game_id: id
                    }
                });

                console.log('Game ' + id + ' started.'),

                this.$router.push(`/lobby`);
            } catch (e) {
                console.log(e);
            }
        },
        endGame() {

        },
        deleteGame: async function(id) {
            const token = localStorage.getItem("token");

            try {
                const records = await this.$http.get("/games/delete", {
                    params: {
                        token,
                        game_id: id
                    }
                });

                // eslint-disable-next-line
                this.games = records.data.data;

                console.log('Game ' + id + ' deleted.');

                //this.$router.go();
            } catch (e) {
                console.log(e);
            }
        },
        analyseGame: async function (id, type) {
            let subPath = 'analyse';

            console.log('TYPE ' + type)
            if (type?.toString().toLowerCase() === 'voting') {
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

            if (type?.toString().toLowerCase() === 'voting') {
                subPath = 'chat';
            }

            try {
                const routeData = this.$router.resolve({path: `/${subPath}/${id}`});
                console.log('HRef:' + routeData.href);
                window.open(routeData.href, '_blank');
            } catch (e) {
                console.log(e);
            }
        },
        surveys: async function(id) {
            try {
                const routeData = this.$router.resolve({path: `/surveys/${id}`});
                console.log('HRef:' + routeData.href);
                window.open(routeData.href, '_blank');
            } catch (e) {
                console.log(e);
            }
        },
        async downloadAll(id, type) {
            switch(type) {
                case 'Voting':
                    return await VotingService.downloadAll(id);
                case 'Harberger':
                case 'Futarchy':
                    return await HarbergerFutarchyService.downloadAll(id);
                default:
                    console.log(`Type not recognized (or TODO): ${type}`);
            }
        }
    }
    }
</script>