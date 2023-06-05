<template>
    <b-col><div class="d-flex flex-column h-100">
        <Header />
        <div class="px-5">
        <form>
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Title</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="text" class="form-control" v-model="title" name="title" id="title" aria-describedby="emailHelp" placeholder="For later lookup" />
                </div>
                <div>
                    <button type="button" @click='proposeNewName()' class="btn btn-primary">Propose Another</button>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Game Type</label>
                </div>
                <div class="form-group col-md-3">
                    <select 
                        class="form-control" v-model="game_type" name="game_type" id="game_type" aria-describedby="emailHelp"
                        @change="onChangeGameType($event)" >
                        <option value="harberger">Harberger</option>
                        <option value="futarchy">Futarchy</option>
                        <option value="voting">Voting</option>
                    </select>
                </div>
            </div>
            
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Number of Rounds</label>
                </div>
                <div class="form-group col-md-3">
                    <input @input="proposeNewName" type="number" class="form-control" v-model="round_count" name="round_count" id="round_count" aria-describedby="emailHelp" placeholder="6" />
                </div>
                    <b-form-checkbox type="checkbox" true-false="false" false-true="true" v-model="practice_round" name="practice_round" id="practice_round">
                        Add an Extra Practice Round
                    </b-form-checkbox>
            </div>

            <!--div v-if="game_type === 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Seconds for Deliberation</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="seconds_for_deliberation" name="seconds_for_deliberation" id="seconds_for_deliberation" aria-describedby="emailHelp" placeholder="10" />
                </div>
            </div>

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Minutes for Trading</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="minutes_for_trading" name="minutes_for_trading" id="minutes_for_trading" aria-describedby="emailHelp" placeholder="10" />
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Minutes for Sniping</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="minutes_for_sniping" name="minutes_for_sniping" id="minutes_for_sniping" aria-describedby="emailHelp" placeholder="2" />
                </div>
            </div-->

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Initial Tax Rate</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="tax_rate_initial" name="tax_rate_initial" id="tax_rate_initial" aria-describedby="emailHelp" placeholder="10" />
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Final Tax Rate</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="tax_rate_final" name="tax_rate_final" id="tax_rate_final" aria-describedby="emailHelp" placeholder="10" />
                </div>
            </div>
            
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Session Number</label>
                </div>
                <div class="form-group col-md-3">
                    <select 
                        class="form-control" v-model="session_number" name="session_number" id="session_number" aria-describedby="emailHelp"
                        @change="proposeNewName"
                    >
                        <option v-for="session in sessions" :key="session.id" :value="session.id">{{session.id}}</option>
                    </select>
                </div>
            </div>

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    Signals:
                </div>
                <div class="form-group col-md-3">
                    <b-form-checkbox type="checkbox" true-false="false" false-true="true" v-model="generate_signals" name="generate_signals" id="generate_signals">
                        Generate Signals Dynamically
                    </b-form-checkbox>
                </div>
                <div class="form-group col-md-2" v-if="generate_signals === true">
                    <label htmlFor="exampleInputEmail1">Signal (Low)</label>
                </div>
                <div class="form-group col-md-1" v-if="generate_signals === true">
                    <input type="number" class="form-control" v-model="signal_low" name="signal_low" id="signal_low" aria-describedby="emailHelp" step="0.1" />
                </div>
                <div class="form-group col-md-2" v-if="generate_signals === true">
                    <label htmlFor="exampleInputEmail1">Signal (High)</label>
                </div>
                <div class="form-group col-md-1" v-if="generate_signals === true">
                    <input type="number" class="form-control" v-model="signal_high" name="signal_high" id="signal_high" aria-describedby="emailHelp" step="0.1" />
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Timers of Phases</h3>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#0</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_0" name="timer_phase_0" id="timer_phase_0" aria-describedby="emailHelp" />
                </div>

                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#1</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_1" name="timer_phase_1" id="timer_phase_1" aria-describedby="emailHelp" />
                </div>

                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#2</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_2" name="timer_phase_2" id="timer_phase_2" aria-describedby="emailHelp" />
                </div>

                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#3</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_3" name="timer_phase_3" id="timer_phase_3" aria-describedby="emailHelp" />
                </div>

                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#4</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_4" name="timer_phase_4" id="timer_phase_4" aria-describedby="emailHelp" />
                </div>

                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#5</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_5" name="timer_phase_5" id="timer_phase_5" aria-describedby="emailHelp" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#6</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_6" name="timer_phase_6" id="timer_phase_6" aria-describedby="emailHelp" />
                </div>

                <div class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#7</label>
                </div>
                <div class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_7" name="timer_phase_7" id="timer_phase_7" aria-describedby="emailHelp" />
                </div>

                <div v-if="game_type != 'voting'" class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#8</label>
                </div>
                <div v-if="game_type != 'voting'" class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_8" name="timer_phase_8" id="timer_phase_8" aria-describedby="emailHelp" />
                </div>

                <div v-if="game_type != 'voting'" class="form-group col-md-1">
                    <label htmlFor="exampleInputEmail1">#9</label>
                </div>
                <div v-if="game_type != 'voting'" class="form-group col-md-1">
                    <input type="number" class="form-control" v-model="timer_phase_9" name="timer_phase_9" id="timer_phase_9" aria-describedby="emailHelp" />
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Scores and Rewards</h3>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1"></label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Speculators</label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Owners</label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Developers</label>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Base Points</label>
                </div>
                <div v-if="game_type != 'voting'" class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="speculators_base_points" name="speculators_base_points" id="speculators_base_points" aria-describedby="emailHelp" placeholder="6" />
                </div>
                <div v-else class="form-group col-md-3">

                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="owners_base_points" name="owners_base_points" id="owners_base_points" aria-describedby="emailHelp" placeholder="1" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="developers_base_points" name="developers_base_points" id="developers_base_points" aria-describedby="emailHelp" placeholder="5" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Reward Scale Factor</label>
                </div>
                <div v-if="game_type != 'voting'" class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="speculators_reward_scale_factor" name="speculators_reward_scale_factor" id="speculators_reward_scale_factor" aria-describedby="emailHelp" placeholder="6" />
                </div>
                <div v-else class="form-group col-md-3">

                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="owners_reward_scale_factor" name="owners_reward_scale_factor" id="owners_reward_scale_factor" aria-describedby="emailHelp" placeholder="1" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="developers_reward_scale_factor" name="developers_reward_scale_factor" id="developers_reward_scale_factor" aria-describedby="emailHelp" placeholder="5" />
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Players</h3>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1"></label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Speculators</label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Owners</label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Developers</label>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Count</label>
                </div>
                <div v-if="game_type != 'voting'" class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="speculators_count" name="speculators_count" id="speculators_count" aria-describedby="emailHelp" placeholder="6" />
                </div>
                <div v-else class="form-group col-md-3">

                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="owners_count" name="owners_count" id="owners_count" aria-describedby="emailHelp" placeholder="1" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="developers_count" name="developers_count" id="developers_count" aria-describedby="emailHelp" placeholder="5" />
                </div>
            </div>

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Balance (for Buying Shares)</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="speculator_balance" name="speculator_balance" id="speculator_balance" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="owner_balance" name="owner_balance" id="owner_balance" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="developer_balance" name="developer_balance" id="developer_balance" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Balance (for Sniping)*</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="cash_for_snipers" name="cash_for_snipers" id="cash_for_snipers" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Shares</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="speculator_shares" name="speculator_shares" id="speculator_shares" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="owner_shares" name="owner_shares" id="owner_shares" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="developer_shares" name="developer_shares" id="developer_shares" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Purchase Proposals per Phase (Max)</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="max_lot_purchases" name="max_lot_purchases" id="max_lot_purchases" aria-describedby="emailHelp" placeholder="10" />
                </div>
            </div>

            <div class="row">
                <div class="col-md-12 mt-3 mb-3">
                    <h3>Lot Value Boundaries per Role and Condition</h3>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1"></label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Speculators</label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Owners</label>
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Developers</label>
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Status Quo Value (Low)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="no_project_owner_low" name="no_project_owner_low" id="no_project_owner_low" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="no_project_dev_low" name="no_project_dev_low" id="no_project_dev_low" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Status Quo Value (High)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="no_project_owner_high" name="no_project_owner_high" id="no_project_owner_high" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="no_project_dev_high" name="no_project_dev_high" id="no_project_dev_high" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Project A Value (Low)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_a_owner_low" name="project_a_owner_low" id="project_a_owner_low" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_a_dev_low" name="project_a_dev_low" id="project_a_dev_low" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Project A Value (High)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_a_owner_high" name="project_a_owner_high" id="project_a_owner_high" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_a_dev_high" name="project_a_dev_high" id="project_a_dev_high" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <button type="button" @click='createGame()' class="btn btn-danger">Create</button>
        </form>
        </div>
        <div class="p-5">* To Be Clarified</div>
    </div></b-col>
</template>

<script>
import { createGame } from '../services/GameService'

import Header from './Header.vue'

import sessions from '../assets/sessions.json';

const defaultBasePoints = {
    "voting": {
        "speculator": 50000,
        "developer": 0,
        "owner": 10000
    },
    "harberger": {
        "speculator": 55000,
        "developer": 5000,
        "owner": 15000
    },
    "futarchy": {
        "speculator": 60000,
        "developer": 10000,
        "owner": 20000
    },
}

const defaultRewardScaleFactor = {
    "voting": {
        "speculator": 10000,
        "developer": 60000,
        "owner": 20000
    },
    "harberger": {
        "speculator": 11000,
        "developer": 65000,
        "owner": 22000
    },
    "futarchy": {
        "speculator": 12000,
        "developer": 68000,
        "owner": 27000
    },
}

export default {
    name: 'CreateGame',
    data() {
        return {
            state: {

            },
            title: '',
            speculators_count: 6,
            speculator_balance: 18000,
            speculator_shares: 5,
            developers_count: 1,
            developer_balance: 18000,
            developer_shares: 30,
            owners_count: 5,
            owner_balance: 18000,
            owner_shares: 6,
            round_count: 5,
            game_type: 'harberger',
            minutes_for_trading: 10,
            minutes_for_sniping: 2,
            max_lot_purchases: 3,
            no_project_dev_low: 250000,
            no_project_dev_fixed: 350000,
            no_project_dev_high: 450000,
            no_project_owner_low: 350000,
            no_project_owner_fixed: 425000,
            no_project_owner_high: 500000,
            project_a_dev_low: 450000,
            project_a_dev_fixed: 1150000,
            project_a_dev_high: 2500000,
            project_a_owner_low: 200000,
            project_a_owner_fixed: 275000,
            project_a_owner_high: 350000,
            project_b_dev_low: 1500000,
            project_b_dev_fixed: 1750000,
            project_b_dev_high: 2000000,
            project_b_owner_low: 100000,
            project_b_owner_fixed: 150000,
            project_b_owner_high: 200000,
            tax_rate_initial: 1,
            tax_rate_final: 25,
            signal_low: 0.95,
            signal_high: 1.05,
            generate_signals: false,
            practice_round: true,
            cash_for_snipers: 250000,
            session_number: 1,
            sessions: null,
            seconds_for_deliberation: 30,
            speculators_base_points: defaultBasePoints.harberger.speculator,
            owners_base_points: defaultBasePoints.harberger.owner,
            developers_base_points: defaultBasePoints.harberger.developer,
            speculators_reward_scale_factor: defaultRewardScaleFactor.harberger.speculator,
            owners_reward_scale_factor: defaultRewardScaleFactor.harberger.owner,
            developers_reward_scale_factor: defaultRewardScaleFactor.harberger.developer,
            timer_phase_0: null,
            timer_phase_1: 12,
            timer_phase_2: 120,
            timer_phase_3: 120,
            timer_phase_4: 3,
            timer_phase_5: 3,
            timer_phase_6: 600,
            timer_phase_7: 120,
            timer_phase_8: 120,
            timer_phase_9: 30
        }
    },
    components: {
        Header
    },
    methods: {
        generateName() {
            const date = new Date();
            const month = date.toLocaleString('default', { month: 'long' });
            const day = date.getDate();

            let suffix = 'th';

            if (day <= 3 || day >= 21){
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

            return `${localStorage.username} ${month}, ${day}${suffix} ${date.getHours()}:${date.getMinutes()} [${this.game_type}]`
                + ` [${this.round_count} rds] [ds ${this.session_number}]`;
        },
        proposeNewName() {
            this.title = this.generateName();
        },
        onChangeGameType(event) {
            this.proposeNewName();

            if (this.game_type === 'voting') {
                this.state.previousSpeculatorCount = this.speculators_count;
                this.speculators_count = 0;
            } else if (this.state.previousGameType === 'voting') {
                this.speculators_count = this.state.previousSpeculatorCount;
            }

            this.state.previousGameType = event.target.value;

            this.speculators_base_points = defaultBasePoints[this.game_type].speculator;
            this.owners_base_points = defaultBasePoints[this.game_type].owner;
            this.developers_base_points = defaultBasePoints[this.game_type].developer;
            this.speculators_reward_scale_factor = defaultRewardScaleFactor[this.game_type].speculator;
            this.owners_reward_scale_factor = defaultRewardScaleFactor[this.game_type].owner;
            this.developers_reward_scale_factor = defaultRewardScaleFactor[this.game_type].developer;

            this.timer_phase_0 = null;
            this.timer_phase_1 = 13;
            this.timer_phase_2 = 120;
            this.timer_phase_3 = 120;
            this.timer_phase_4 = 120;
            this.timer_phase_5 = 120;
            this.timer_phase_6 = 120;
            this.timer_phase_7 = 30;
        },
        createGame() {
            const payload = {
                title: this.title,
                tax_rate: {
                    initial: this.tax_rate_initial,
                    final: this.tax_rate_final
                },
                signal: {
                    low: this.signal_low,
                    high: this.signal_high,
                    generate: this.generate_signals
                },
                speculators: {
                    count: this.speculators_count,
                    balance: this.speculator_balance,
                    shares: this.speculator_shares,
                    max_lot_purchases: this.max_lot_purchases,
                    cash_for_snipers: this.cash_for_snipers,
                    base_points: this.speculators_base_points,
                    reward_scale_factor: this.speculators_reward_scale_factor
                },
                developers: {
                    count: this.developers_count,
                    balance: this.developer_balance,
                    shares: this.developer_shares,
                    base_points: this.developers_base_points,
                    reward_scale_factor: this.developers_reward_scale_factor,
                    profit: {
                        no_project: {
                            low: this.no_project_dev_low,
                            fixed: this.no_project_dev_fixed,
                            high: this.no_project_dev_high
                        },
                        project_a: {
                            low: this.project_a_dev_low,
                            fixed: this.project_a_dev_fixed,
                            high: this.project_a_dev_high
                        },
                        project_b: {
                            low: this.project_b_dev_low,
                            fixed: this.project_b_dev_fixed,
                            high: this.project_b_dev_high
                        }
                    }
                },
                owners: {
                    count: this.owners_count,
                    balance: this.owner_balance,
                    shares: this.owner_shares,
                    base_points: this.owners_base_points,
                    reward_scale_factor: this.owners_reward_scale_factor,
                    profit: {
                        no_project: {
                            low: this.no_project_owner_low,
                            fixed: this.no_project_owner_fixed,
                            high: this.no_project_owner_high
                        },
                        project_a: {
                            low: this.project_a_owner_low,
                            fixed: this.project_a_owner_fixed,
                            high: this.project_a_owner_high
                        },
                        project_b: {
                            low: this.project_b_owner_low,
                            fixed: this.project_b_owner_fixed,
                            high: this.project_b_owner_high
                        }
                    }
                },
                timers: {
                    phase_0: this.timer_phase_0,
                    phase_1: this.timer_phase_1,
                    phase_2: this.timer_phase_2,
                    phase_3: this.timer_phase_3,
                    phase_4: this.timer_phase_4,
                    phase_5: this.timer_phase_5,
                    phase_6: this.timer_phase_6,
                    phase_7: this.timer_phase_7,
                    phase_8: this.timer_phase_8,
                    phase_9: this.timer_phase_9
                },
                round_count: this.round_count,
                game_type: this.game_type,
                practice: this.practice_round,
                minutes_for_trading: this.minutes_for_trading,
                minutes_for_sniping: this.minutes_for_sniping,
                session_number: this.session_number,
                seconds_for_deliberation: this.seconds_for_deliberation
            }

            createGame(payload).then((response) => {
                console.log(response);
                this.$router.push("/dashboard");
            });
        },
        clearForm() {
            this.firstName = "";
            this.lastName = "";
            this.email = "";
        }
    },
    mounted () {
        this.sessions = sessions;

        this.title = this.generateName();
    }
}
</script>