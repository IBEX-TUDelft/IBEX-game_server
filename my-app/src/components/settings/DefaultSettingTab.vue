<template>
    <b-tab :title="name">
        <div class="px-5">
        <form>
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Number of Rounds</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="round_count" name="round_count" id="round_count" aria-describedby="emailHelp" placeholder="6" />
                </div>
                    <b-form-checkbox type="checkbox" true-false="false" false-true="true" v-model="practice_round" name="practice_round" id="practice_round">
                        Add an Extra Practice Round
                    </b-form-checkbox>
            </div>

            <div v-if="type === 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Seconds for Deliberation</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="seconds_for_deliberation" name="seconds_for_deliberation" id="seconds_for_deliberation" aria-describedby="emailHelp" placeholder="10" />
                </div>
            </div>

            <div v-if="type != 'voting'" class="row">
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
            </div>

            <div v-if="type != 'voting'" class="row">
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

            <div v-if="type != 'voting'" class="row">
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
                <div v-if="type != 'voting'" class="form-group col-md-3">
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
                <div v-if="type != 'voting'" class="form-group col-md-3">
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
                <div v-if="type != 'voting'" class="form-group col-md-3">
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

            <div v-if="type != 'voting'" class="row">
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

            <div v-if="type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Balance (for Sniping)*</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="cash_for_snipers" name="cash_for_snipers" id="cash_for_snipers" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>

            <div v-if="type != 'voting'" class="row">
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

            <div v-if="type != 'voting'" class="row">
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

            <button type="button" @click='saveSettings()' class="btn btn-danger">Save</button>
        </form>
        </div>
        <div class="p-5">* To Be Clarified</div>

    </b-tab>
</template>
<script>
import { loadTemplate, loadTemplateList, saveTemplate } from '../services/GameService'

export default {
    props: ['name', 'type'],
    methods: {
        async saveTemplate(template) {
            return await saveTemplate(template);
        },
        async loadList(type) {
            return await loadTemplateList(type);
        },
        async loadTemplate(id) {
            return loadTemplate(id);
        }
    },
    async mounted () {

    }
}
</script>
