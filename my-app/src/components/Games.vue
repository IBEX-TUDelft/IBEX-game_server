<template>
        <div class="table-responsive px-5">
            <table class="table table-bordered">
                <thead class="thead-dark">
                <tr>
                    <th scope="col">Game</th>
                    <th scope="col">Created</th>
                    <th scope="col">Last Update</th>
                    <th scope="col">Round</th>
                    <th scope="col">Ended</th>
                    <th scope="col">Controls</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="item in games" :key="item.id">
                    <td>{{ item.title }}</td>
                    <td>{{ item.created_at }}</td>
                    <td>{{ item.updated_at }}</td>
                    <td>{{ item.phase_number }}</td>
                    <td>{{ item.ended_at }}</td>
                    <td>
                        <div class="btn-toolbar pull-right col-md-12">
                            <button type="button" @click='detailGame()' class="btn btn-primary mr-1">Details</button>
                            <button v-if="item.round_number == null || item.round_number == 0" type="button" @click="startGame(item.id)" class="btn btn-success mr-1">Start</button>
                            <button v-if="item.round_number != null && item.ended_at != null" type="button" @click='endGame()' class="btn btn-warning mr-1">Force End</button>
                            <button type="button" @click='deleteGame(item.id)' class="btn btn-danger">Delete</button>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
</template>

<script>
    export default {
        name: 'Games',
        props: ['games'],
        methods: {
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

                    this.$router.push(`/masterboard/${id}`);
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

                    this.games = records.data.data;

                    console.log('Game ' + id + ' deleted.');

                    //this.$router.go();
                } catch (e) {
                    console.log(e);
                }
            }
        }
     }
</script>