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
                    <input type="number" class="form-control" v-model="round_count" name="round_count" id="round_count" aria-describedby="emailHelp" placeholder="6" />
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
            </div>
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
            <div v-if="game_type != 'voting'" class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Signal (Low)</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="signal_low" name="signal_low" id="signal_low" aria-describedby="emailHelp" step="0.1" />
                </div>
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Signal (High)</label>
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="signal_high" name="signal_high" id="signal_high" aria-describedby="emailHelp" step="0.1" />
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
                    <label htmlFor="exampleInputEmail1">Balance (for Buying Shares?)*</label>
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
            <!--div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Status Quo Value (Fixed)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="no_project_owner_fixed" name="no_project_owner_fixed" id="no_project_owner_fixed" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="no_project_dev_fixed" name="no_project_dev_fixed" id="no_project_dev_fixed" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div-->
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
            <!--div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Project A Value (Fixed)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_a_owner_fixed" name="project_a_owner_fixed" id="project_a_owner_fixed" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_a_dev_fixed" name="project_a_dev_fixed" id="project_a_dev_fixed" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div-->
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

            <!--div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Project B Value (Low)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_b_owner_low" name="project_b_owner_low" id="project_b_owner_low" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_b_dev_low" name="project_b_dev_low" id="project_b_dev_low" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Project B Value (Fixed)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_b_owner_fixed" name="project_b_owner_fixed" id="project_b_owner_fixed" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_b_dev_fixed" name="project_b_dev_fixed" id="project_b_dev_fixed" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-3">
                    <label htmlFor="exampleInputEmail1">Project B Value (High)</label>
                </div>
                <div class="form-group col-md-3">
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_b_owner_high" name="project_b_owner_high" id="project_b_owner_high" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-3">
                    <input type="number" class="form-control" v-model="project_b_dev_high" name="project_b_dev_high" id="project_b_dev_high" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div-->

            <button type="button" @click='createGame()' class="btn btn-danger">Create</button>
        </form>
        </div>
        <div class="p-5">* To Be Clarified</div>
    </div></b-col>
</template>

<script>
import { createGame } from '../services/GameService'
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

import Header from './Header.vue'

export default {
    name: 'CreateGame',
    data() {
        return {
            state: {

            },
            title: uniqueNamesGenerator({
                dictionaries: [colors, adjectives, animals],
                separator: " ",
                style: "capital"
            }),
            speculators_count: 6,
            speculator_balance: 18000,
            speculator_shares: 5,
            developers_count: 1,
            developer_balance: 18000,
            developer_shares: 5,
            owners_count: 5,
            owner_balance: 18000,
            owner_shares: 5,
            round_count: 5,
            game_type: 'harberger',
            minutes_for_trading: 10,
            minutes_for_sniping: 2,
            max_lot_purchases: 3,
            no_project_dev_low: 300000,
            no_project_dev_fixed: 350000,
            no_project_dev_high: 400000,
            no_project_owner_low: 350000,
            no_project_owner_fixed: 425000,
            no_project_owner_high: 500000,
            project_a_dev_low: 1000000,
            project_a_dev_fixed: 1150000,
            project_a_dev_high: 1300000,
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
            signal_high: 1.05
        }
    },
    components: {
        Header
    },
    methods: {
        proposeNewName() {
            this.title = uniqueNamesGenerator({
                dictionaries: [colors, adjectives, animals],
                separator: " ",
                style: "capital"
            });
        },
        onChangeGameType(event) {
            if (this.game_type === 'voting') {
                this.state.previousSpeculatorCount = this.speculators_count;
                this.speculators_count = 0;
            } else if (this.state.previousGameType === 'voting') {
                this.speculators_count = this.state.previousSpeculatorCount;
            }

            this.state.previousGameType = event.target.value;
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
                    high: this.signal_high
                },
                speculators: {
                    count: this.speculators_count,
                    balance: this.speculator_balance,
                    shares: this.speculator_shares,
                    max_lot_purchases: this.max_lot_purchases
                },
                developers: {
                    count: this.developers_count,
                    balance: this.developer_balance,
                    shares: this.developer_shares,
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
                round_count: this.round_count,
                game_type: this.game_type,
                minutes_for_trading: this.minutes_for_trading,
                minutes_for_sniping: this.minutes_for_sniping
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
  }
}
</script>