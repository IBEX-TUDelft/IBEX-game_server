<template>
    <b-row >
        <b-col>
            <div class="row">
                <b-col class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Title</label>
                </b-col>
                <b-col class="form-group col-md-3">
                    <input type="text" class="form-control" v-model="title" name="title" id="title" aria-describedby="emailHelp" placeholder="For later lookup" />
                </b-col>
                <b-col class="form-group col-md-3">
                    <button type="button" @click='proposeNewName()' class="btn btn-primary">Propose Another</button>
                </b-col>
            </div>
            
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Number of Rounds</label>
                </div>
                <div class="form-group col-md-3">
                    <input @input="proposeNewName" type="number" class="form-control" v-model="round_count" name="round_count" id="round_count" aria-describedby="emailHelp" placeholder="6" />
                </div>
                <div class="form-group col-md-3 d-flex">
                    <b-form-checkbox type="checkbox" true-false="false" false-true="true" v-model="practice_round" name="practice_round" id="practice_round" class="d-flex align-items-center">
                        Add an Extra Practice Round
                    </b-form-checkbox>
                </div>
            </div>

            <div v-if="$parent.game_type != 'voting'" class="row">
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
                        <option v-for="session in sessions" :key="session" :value="session">{{session}}</option>
                    </select>
                </div>
            </div>

            <div v-if="$parent.game_type != 'voting'" class="row">
                <div class="form-group col-md-3 d-flex align-items-center">
                    Signals:
                </div>
                <div class="form-group col-md-3 d-flex">
                    <b-form-checkbox type="checkbox" true-false="false" false-true="true" v-model="generate_signals" name="generate_signals" id="generate_signals" class="d-flex align-items-center">
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

            <b-row>
                <b-col v-if="configurations[$parent.game_type].phaseTags != null">
                    <b-row class="row mb-3" v-for="i in Math.ceil(configurations[$parent.game_type].phaseTags.length / 3 + 1)" :key="i">
                        <b-col v-for="j in [0, 1, 2]" class="col-4" :key="3 * (i - 1) + j">
                            <b-row>
                                <b-col class="col-6" v-if="configurations[$parent.game_type].phaseTags.length > 3 * (i - 1) + j">
                                    <label htmlFor="exampleInputEmail1">{{  configurations[$parent.game_type].phaseTags[3 * (i - 1) + j] }} ({{ 3 * (i - 1) + j }})</label>
                                </b-col>
                                <b-col class="col-6" v-if="configurations[$parent.game_type].phaseTags.length > 3 * (i - 1) + j">
                                    <input type="number" class="form-control" v-model="phase_timers[3 * (i - 1) + j]" :name="`timer_phase_${3 * (i - 1) + j}`" :id="`timer_phase_${3 * (i - 1) + j}`" aria-describedby="emailHelp" />
                                </b-col>
                            </b-row>
                        </b-col>
                    </b-row>
                </b-col>
            </b-row>

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
                <div v-if="$parent.game_type != 'voting'" class="form-group col-md-3">
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
                <div v-if="$parent.game_type != 'voting'" class="form-group col-md-3">
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
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Show-up Fee (€)</label>
                </div>
                <div class="form-group col-md-9">
                    <input type="number" class="form-control" v-model="show_up_fee" name="show_up_fee" id="show_up_fee" aria-describedby="emailHelp" placeholder="5" />
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
                <div v-if="$parent.game_type != 'voting'" class="form-group col-md-3">
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

            <div v-if="$parent.game_type != 'voting'" class="row">
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

            <div v-if="$parent.game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Balance (for Sniping)*</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="cash_for_snipers" name="cash_for_snipers" id="cash_for_snipers" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div v-if="$parent.game_type != 'voting'" class="row">
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

            <div v-if="$parent.game_type != 'voting'" class="row">
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

            <div class="row">
                <div class="form-group col-md-3">* To Be Clarified</div>
            </div>
        </b-col>
    </b-row>
</template>

<script>
import harbergerDictionary from '../../assets/harberger.json';
import futarchyDictionary from '../../assets/futarchy.json';
import votingDictionary from '../../assets/voting.json';

import EventService from '../../services/EventService';
import * as DataService from '../../services/DataService'

export default {
    name: 'CreateHarbergerFutarchyVoting',
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
            speculators_base_points: null,
            owners_base_points: null,
            developers_base_points: null,
            speculators_reward_scale_factor: null,
            owners_reward_scale_factor: null,
            developers_reward_scale_factor: null,
            phase_timers: [null, 12, 120, 120, 3, 3, 600, 120, 120, 30],
            dictionary: {
                futarchy: futarchyDictionary,
                harberger: harbergerDictionary,
                voting: votingDictionary
            },
            configurations: {
                futarchy: {},
                harberger: {},
                voting: {}
            },
            show_up_fee: 5
        }
    },
    components: {
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

            return `${localStorage.username} ${month}, ${day}${suffix} ${date.getHours()}:${date.getMinutes()} [${this.$parent.game_type}]`
                + ` [${this.round_count} rds] [ds ${this.session_number}]`;
        },
        proposeNewName() {
            this.title = this.generateName();
        },
        onChangeGameType(event) {
            if (!['voting', 'harberger', 'futarchy'].includes(event.target.value)) {
                return;
            }

            this.proposeNewName();

            if (this.$parent.game_type === 'voting') {
                this.state.previousSpeculatorCount = this.speculators_count;
                this.speculators_count = 0;
            } else if (this.state.previousGameType === 'voting') {
                this.speculators_count = this.state.previousSpeculatorCount;
            }

            this.state.previousGameType = event.target.value;

            this.speculators_base_points = this.configurations[this.$parent.game_type].defaultBasePoints.speculator;
            this.owners_base_points = this.configurations[this.$parent.game_type].defaultBasePoints.owner;
            this.developers_base_points = this.configurations[this.$parent.game_type].defaultBasePoints.developer;
            this.speculators_reward_scale_factor = this.configurations[this.$parent.game_type].defaultRewardScaleFactor.speculator;
            this.owners_reward_scale_factor = this.configurations[this.$parent.game_type].defaultRewardScaleFactor.owner;
            this.developers_reward_scale_factor = this.configurations[this.$parent.game_type].defaultRewardScaleFactor.developer;

            this.phase_timers = [...this.configurations[this.$parent.game_type].timers];

            this.no_project_dev_low = this.configurations[this.$parent.game_type].defaultBoundaries.developer.noproject.low;
            this.no_project_dev_high = this.configurations[this.$parent.game_type].defaultBoundaries.developer.noproject.high;
            this.no_project_owner_low = this.configurations[this.$parent.game_type].defaultBoundaries.owner.noproject.low;
            this.no_project_owner_high = this.configurations[this.$parent.game_type].defaultBoundaries.owner.noproject.high;
            this.project_a_dev_low = this.configurations[this.$parent.game_type].defaultBoundaries.developer.project.low;
            this.project_a_dev_high = this.configurations[this.$parent.game_type].defaultBoundaries.developer.project.high;
            this.project_a_owner_low = this.configurations[this.$parent.game_type].defaultBoundaries.owner.project.low;
            this.project_a_owner_high = this.configurations[this.$parent.game_type].defaultBoundaries.owner.project.high;
        },
        getPayload() {
            return {
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
                    phase_0: this.phase_timers[0],
                    phase_1: this.phase_timers[1],
                    phase_2: this.phase_timers[2],
                    phase_3: this.phase_timers[3],
                    phase_4: this.phase_timers[4],
                    phase_5: this.phase_timers[5],
                    phase_6: this.phase_timers[6],
                    phase_7: this.phase_timers[7],
                    phase_8: this.phase_timers[8],
                    phase_9: this.phase_timers[9]
                },
                round_count: this.round_count,
                game_type: this.$parent.game_type,
                practice: this.practice_round,
                minutes_for_trading: this.minutes_for_trading,
                minutes_for_sniping: this.minutes_for_sniping,
                session_number: this.session_number,
                seconds_for_deliberation: this.seconds_for_deliberation,
                show_up_fee: this.show_up_fee
            }
        }
    },
    async mounted () {
        const self = this;

        this.sessions = await DataService.getSessionsCount();
        
        this.title = this.generateName();

        for (let mode of ['voting', 'harberger', 'futarchy']) {
            const dictionary = self.dictionary[mode];

            self.configurations[mode].timers = dictionary.timers;
            self.configurations[mode].defaultBasePoints = dictionary.defaultBasePoints;
            self.configurations[mode].defaultRewardScaleFactor = dictionary.defaultRewardScaleFactor;
            self.configurations[mode].defaultBoundaries = dictionary.defaultBoundaries;

            self.configurations[mode].phaseTags = [];
            
            dictionary.instructions.phases.forEach(phase => {
                self.configurations[mode].phaseTags.push(phase.tag);
            });
        }

        self.speculators_base_points =  self.configurations[self.$parent.game_type].defaultBasePoints.speculator,
        self.owners_base_points = self.configurations[self.$parent.game_type].defaultBasePoints.owner,
        self.developers_base_points = self.configurations[self.$parent.game_type].defaultBasePoints.developer,
        self.speculators_reward_scale_factor = self.configurations[self.$parent.game_type].defaultRewardScaleFactor.speculator,
        self.owners_reward_scale_factor = self.configurations[self.$parent.game_type].defaultRewardScaleFactor.owner,
        self.developers_reward_scale_factor = self.configurations[self.$parent.game_type].defaultRewardScaleFactor.developer,

        self.phase_timers = [...self.configurations[self.$parent.game_type].timers];

        self.no_project_dev_low = self.configurations[self.$parent.game_type].defaultBoundaries.developer.noproject.low;
        self.no_project_dev_high = self.configurations[self.$parent.game_type].defaultBoundaries.developer.noproject.high;
        self.no_project_owner_low = self.configurations[self.$parent.game_type].defaultBoundaries.owner.noproject.low;
        self.no_project_owner_high = self.configurations[self.$parent.game_type].defaultBoundaries.owner.noproject.high;
        self.project_a_dev_low = self.configurations[self.$parent.game_type].defaultBoundaries.developer.project.low;
        self.project_a_dev_high = self.configurations[self.$parent.game_type].defaultBoundaries.developer.project.high;
        self.project_a_owner_low = self.configurations[self.$parent.game_type].defaultBoundaries.owner.project.low;
        self.project_a_owner_high = self.configurations[self.$parent.game_type].defaultBoundaries.owner.project.high;

        EventService.removeAllListeners('game_type_changed');
        EventService.on('game_type_changed', this.onChangeGameType);

        EventService.removeAllListeners('go_ahead_with_game_creation');
        EventService.on('go_ahead_with_game_creation', () => {
            this.$parent.createGameOnServer(this.getPayload())
        });
    }
}
</script>