<template>
    <b-row class="no-gutters justify-content-center flex-grow-1">
        <b-col>
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
                    <label htmlFor="exampleInputEmail1">Trading Time (minutes)</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="timer_phase_1" name="timer_phase_1" id="timer_phase_1" aria-describedby="emailHelp" placeholder="6" />
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
                    <label htmlFor="exampleInputEmail1">Bad Good Chance (%)</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="bad_quality_ratio" name="bad_quality_ratio" id="bad_quality_ratio" aria-describedby="emailHelp" placeholder="6" />
                </div>

                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Cash per Player</label>
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
            bad_quality_ratio: 50,
            cash_per_player: 75,
            timer_phase_1: 5
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
                bad_quality_ratio: this.bad_quality_ratio,
                cash_per_player: this.cash_per_player,
                timer_phase_1: this.timer_phase_1 * 60,
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