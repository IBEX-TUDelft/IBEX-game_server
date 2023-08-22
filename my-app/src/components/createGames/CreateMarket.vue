<template>
    <b-row class="no-gutters justify-content-center flex-grow-1">
        <b-col>
            <div class="row">
                <b-col class="form-group col-md-12">
                    <h1>TODO: Not ready for testing</h1>
                </b-col>
            </div>

            <div class="row">
                <b-col class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Title</label>
                </b-col>
                <b-col class="form-group col-md-3">
                    <input type="text" class="form-control" v-model="title" name="title" id="title" aria-describedby="emailHelp" placeholder="For later lookup" />
                </b-col>
                <b-col class="form-group col-md-3">
                    <button type="button" @click='proposeNewName()' class="btn btn-primary">Restore Default</button>
                </b-col>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>General Setup</h3>
                </div>
            </div>

            <div class="row">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Market Time (minutes)</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="market_timer" name="market_timer" id="market_timer" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Information</label>
                </div>
                <div class="form-group col-md-3">
                    <select class="form-control" v-model="information" name="information" id="information" aria-describedby="emailHelp">
                        <option value="complete">Complete</option>
                        <option value="incomplete">Incomplete</option>
                        <option value="asymmetric">Asymmetric</option>
                    </select>
                </div>
                <div class="form-group col-md-3 align-items-center" v-if="information === 'asymmetric'">
                    <label htmlFor="exampleInputEmail1">Players (%) Knowing Their Private Signal</label>
                </div>
                <div class="form-group col-md-3 align-items-center" v-if="information === 'asymmetric'">
                    <input type="number" class="form-control" v-model="players_knowing_signal" name="players_knowing_signal" id="players_knowing_signal" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Distribution</h3>
                </div>
            </div>

            <div class="row">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Mean</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="mean" name="mean" id="mean" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Variance</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="variance" name="variance" id="variance" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Players</h3>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Minimum Number of Players</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="player_min_number" name="player_min_number" id="player_min_number" aria-describedby="emailHelp" placeholder="6" />
                </div>
                <div class="form-group col-md-6 d-flex">
                    <b-form-checkbox type="checkbox" true-false="false" false-true="true" v-model="use_bots" name="use_bots" id="use_bots" class="d-flex align-items-center">
                        Fill the ranks with automated players, if the player count at start time is below the minimum
                    </b-form-checkbox>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Maximum Number of Players</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="player_max_number" name="player_max_number" id="player_max_number" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Shares per Players</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="shares_per_player" name="shares_per_player" id="shares_per_player" aria-describedby="emailHelp" placeholder="6" />
                </div>

                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Cash per Players</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="cash_per_player" name="cash_per_player" id="cash_per_player" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>
        </b-col>
    </b-row>
</template>

<script>
import CreateCol3 from './CreateCol3.vue';
import EventService from '../../services/EventService.js';

export default {
    name: 'CreateMarket',
    data() {
        return {
            title: '',
            player_max_number: 400,
            player_min_number: 4,
            use_bots: false,
            shares_per_player: 1,
            cash_per_player: 100,
            market_timer: 5,
            information: 'complete',
            players_knowing_signal: 50,
            mean: 100,
            variance: 10
        }
    },
    components: {
        CreateCol3
    },
    methods: {
        generateName() {
            const date = new Date();
            const month = date.toLocaleString('default', { month: 'long' });
            const day = date.getDate();

            let suffix = 'th';

            if (day <= 3 || day >= 21) {
                switch (day % 10) {
                    case 1:
                        suffix = 'st';
                        break;
                    case 2:
                        suffix = 'nd';
                        break;
                    case 3:
                        suffix = 'rd';
                        break;
                    default:
                        break;
                }
            }

            return `${localStorage.username} ${month}, ${day}${suffix} ${date.getHours()}:${date.getMinutes()} [${this.$parent.game_type}]`;
        },
        proposeNewName() {
            this.title = this.generateName();
        },
        onChangeGameType(event) {
            if (!['market'].includes(event.target.value)) {
                return;
            }

            this.proposeNewName();

            console.log(event.target.value);

        },
        getPayload() {
            return {
                title: this.title,
                game_type: this.$parent.game_type,
                player_max_number: this.player_max_number,
                player_min_number: this.player_min_number,
                use_bots: this.use_bots,
                shares_per_player: this.shares_per_player,
                cash_per_player: this.cash_per_player,
                market_timer: this.market_timer,
                information: this.information,
                players_knowing_signal: this.players_knowing_signal
            };
        }
    },
    async mounted() {
        this.proposeNewName();

        EventService.removeAllListeners('game_type_changed');
        EventService.on('game_type_changed', this.onChangeGameType);

        EventService.removeAllListeners('go_ahead_with_game_creation');
        EventService.on('go_ahead_with_game_creation', () => {
            this.$parent.createGameOnServer(this.getPayload())
        });
    }
}
</script>