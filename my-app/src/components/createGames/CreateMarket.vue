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
                    <input type="number" class="form-control" v-model="market_timer" name="market_timer" id="market_timer" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <b-row>
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Transaction cost paid by sellers</label>
                </CreateCol3>

                <CreateCol3 class="form-group col-md-3 align-items-center">
                    <input type="number" class="form-control" v-model="seller_transaction_cost" name="seller_transaction_cost" id="seller_transaction_cost" aria-describedby="emailHelp" placeholder="6" />
                </CreateCol3>

                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Transaction cost paid by buyers</label>
                </CreateCol3>

                <CreateCol3 class="form-group col-md-3 align-items-center">
                    <input type="number" class="form-control" v-model="buyer_transaction_cost" name="buyer_transaction_cost" id="buyer_transaction_cost" aria-describedby="emailHelp" placeholder="6" />
                </CreateCol3>
            </b-row>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Real Value and Signal</h3>
                </div>
            </div>

            <b-row>
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Distribution Type</label>
                </CreateCol3>

                <CreateCol3>
                    <b-form-group>
                        <b-form-radio-group
                            id="distribution_type"
                            v-model="distribution_type"
                            name="distribution_type"
                        >
                            <b-form-radio value="linear">Uniform</b-form-radio>
                            <b-form-radio value="normal">Normal (Gaussian)</b-form-radio>
                        </b-form-radio-group>
                    </b-form-group>
                </CreateCol3>
            </b-row>

            <div class="row" v-if="distribution_type == 'normal'">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Mean</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="mean" name="mean" id="mean" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row" v-if="distribution_type == 'normal'">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Variance</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="variance" name="variance" id="variance" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row" v-if="distribution_type == 'linear'">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Minimum</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="linear_min" name="linear_min" id="linear_min" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row" v-if="distribution_type == 'linear'">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Maximum</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="linear_max" name="linear_max" id="linear_max" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <div class="row">
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Signal Error Range (%)</label>
                </CreateCol3>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="signal_error" name="signal_error" id="signal_error" aria-describedby="emailHelp" placeholder="6" />
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
                    <label htmlFor="exampleInputEmail1">Shares per Player</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="shares_per_player" name="shares_per_player" id="shares_per_player" aria-describedby="emailHelp" placeholder="6" />
                </div>

                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Cash per Player</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="cash_per_player" name="cash_per_player" id="cash_per_player" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>

            <b-row>
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Players (%) Knowing Both Signals</label>
                </CreateCol3>

                <CreateCol3 class="form-group col-md-3 align-items-center">
                    <input type="number" class="form-control" v-model="players_knowing_both_signals" name="players_knowing_both_signals" id="players_knowing_both_signals" aria-describedby="emailHelp" placeholder="6" />
                </CreateCol3>

                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Players (%) Knowing Only the Public Signal</label>
                </CreateCol3>

                <CreateCol3 class="form-group col-md-3 align-items-center">
                    <input type="number" class="form-control" v-model="players_knowing_public_signal" name="players_knowing_public_signal" id="players_knowing_public_signal" aria-describedby="emailHelp" placeholder="6" />
                </CreateCol3>
            </b-row>

            <b-row>
                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Players (%) Knowing Only the Private Signal</label>
                </CreateCol3>

                <CreateCol3 class="form-group col-md-3 align-items-center">
                    <input type="number" class="form-control" v-model="players_knowing_private_signal" name="players_knowing_private_signal" id="players_knowing_private_signal" aria-describedby="emailHelp" placeholder="6" />
                </CreateCol3>

                <CreateCol3>
                    <label htmlFor="exampleInputEmail1">Players (%) Not Knowing any Signal</label>
                </CreateCol3>

                <CreateCol3 class="form-group col-md-3 align-items-center">
                    <input type="number" class="form-control" v-model="players_knowing_no_signal" name="players_knowing_no_signal" id="players_knowing_no_signal" aria-describedby="emailHelp" placeholder="6" />
                </CreateCol3>
            </b-row>

            <b-row style="color: darkred;" v-if="getTotalKnowledgePercentage() != 100">
                <b-col class="col-12">
                    <p>The sum of the percentages given to the different groups of players must be exactly 100. Currently it is <b>{{ getTotalKnowledgePercentage() }}</b></p>
                </b-col>
            </b-row>
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
            distribution_type: 'linear',
            linear_min: 50,
            linear_max: 100,
            signal_error: 5,
            mean: 100,
            variance: 10,
            players_knowing_both_signals: 50,
            players_knowing_private_signal: 50,
            players_knowing_public_signal: 0,
            players_knowing_no_signal: 0,
            buyer_transaction_cost: 0,
            seller_transaction_cost: 0,
        }
    },
    components: {
        CreateCol3
    },
    methods: {
        getTotalKnowledgePercentage() {
            return parseInt(this.players_knowing_both_signals) + parseInt(this.players_knowing_no_signal) +
            parseInt(this.players_knowing_private_signal) + parseInt(this.players_knowing_public_signal);
        },
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
                players_knowing_private_signal: this.players_knowing_private_signal,
                players_knowing_public_signal: this.players_knowing_public_signal,
                players_knowing_both_signals: this.players_knowing_both_signals,
                players_knowing_no_signal: this.players_knowing_no_signal,
                mean: this.mean,
                variance: this.variance,
                distribution_type: this.distribution_type,
                linear_min: this.linear_min,
                linear_max: this.linear_max,
                signal_error: this.signal_error,
                buyer_transaction_cost: this.buyer_transaction_cost,
                seller_transaction_cost: this.seller_transaction_cost
            };
        }
    },
    async mounted() {
        this.proposeNewName();

        EventService.removeAllListeners('game_type_changed');
        EventService.on('game_type_changed', this.onChangeGameType);

        EventService.removeAllListeners('go_ahead_with_game_creation');
        EventService.on('go_ahead_with_game_creation', () => {
            if (this.getTotalKnowledgePercentage() == 100) {
                this.$parent.createGameOnServer(this.getPayload())
            }
        });
    }
}
</script>