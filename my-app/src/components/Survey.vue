<template>
    <b-row class="no-gutters justify-content-center flex-grow-1">
        <b-col class="no-gutters justify-content-center flex-grow-1">

            <b-form v-if="!sent">
                <b-row class="no-gutters justify-content-center flex-grow-1 mb-4">
                    <h3>{{ $parent.resolvePlaceHolder('present-survey') }}</h3>
                </b-row>

                <b-row class="no-gutters justify-content-center flex-grow-1" align-v="center">
                    <div class="form-group col-md-3">
                        <label htmlFor="exampleInputEmail1">Age</label>
                    </div>
                    <div class="form-group col-md-3">
                        <input type="number" class="form-control" v-model="age" name="age" id="age" aria-describedby="emailHelp" />
                    </div>
                </b-row>

                <b-row class="no-gutters justify-content-center flex-grow-1" align-v="center">
                    <div class="form-group col-md-3">
                        <label htmlFor="exampleInputEmail1">Gender</label>
                    </div>
                    <div class="form-group col-md-3">
                        <select class="form-control" v-model="gender" name="gender" id="gender" aria-describedby="emailHelp">
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </b-row>
                
                <b-row class="no-gutters justify-content-center flex-grow-1" align-v="center">
                    <div class="form-group col-md-3">
                        <label htmlFor="exampleInputEmail1">Year of study</label>
                    </div>
                    <div class="form-group col-md-3">
                        <select class="form-control" v-model="yearOfStudy" name="university" id="university" aria-describedby="emailHelp">
                            <option value="bsc1">bsc1</option>
                            <option value="bsc2">bsc2</option>
                            <option value="bsc3">bsc3</option>
                            <option value="bsc4">bsc1</option>
                            <option value="msc1">msc1</option>
                            <option value="msc2">msc2</option>
                            <option value="other">other</option>
                        </select>
                    </div>
                </b-row>

                <b-row class="no-gutters justify-content-center flex-grow-1" align-v="center">
                    <div class="form-group col-md-3">
                        <label htmlFor="exampleInputEmail1">Faculty</label>
                    </div>
                    <div class="form-group col-md-3">
                        <select class="form-control" v-model="faculty" name="faculty" id="faculty" aria-describedby="emailHelp">
                            <option value="TPM">TPM</option>
                            <option value="IDE">IDE</option>
                            <option value="3ME">3ME</option>
                            <option value="CEG">CEG</option>
                            <option value="EEMCS">EEMCS</option>
                            <option value="AE">AE</option>
                            <option value="AS">AS</option>
                            <option value="The Hague University of Applied Science">The Hague University of Applied Science</option>
                            <option value="InHolland">InHolland</option>
                            <option value="otherwise">otherwise</option>
                        </select>
                    </div>
                </b-row>

                <b-row class="no-gutters flex-grow-1" align-v="center">
                    <b-col class="form-group col-md-3"></b-col>

                    <b-col class="form-group col-md-3">
                        <label htmlFor="exampleInputEmail1">Rate how much risk you are generally willing to take</label>
                    </b-col>

                    <b-col class="form-group col-md-6">
                        <b-form-group v-slot="{ ariaDescribedby }">
                            <b-form-radio-group
                                id="radio-group-2"
                                v-model="risk"
                                :aria-describedby="ariaDescribedby"
                                name="radio-sub-component"
                                buttons
                                button-variant="outline-dark"
                            >
                                <b-form-radio
                                    name="risk_0"
                                    value="0"
                                >0 - Not willing to take any risk</b-form-radio>

                                <b-form-radio v-for="i in [1,2,3,4,5,6,7,8,9]" :key="i"
                                    :name="'risk_' + i"
                                    :value="i"
                                >{{ i }}</b-form-radio>

                                <b-form-radio
                                    name="risk_10"
                                    value="10"
                                >10 - Very willing to take risk</b-form-radio>
                            </b-form-radio-group>
                        </b-form-group>
                    </b-col>
                </b-row>

                <b-row class="no-gutters justify-content-center flex-grow-1">
                        <button type="button" @click='submit()' class="btn btn-danger">Send</button>
                </b-row>
            </b-form>
            <b-row v-else class="no-gutters justify-content-center flex-grow-1">
                <h2>Thank you!</h2>
            </b-row>
        </b-col>
    </b-row>
</template>
<script>
import { sendSurvey } from '../services/GameService';

export default {
    data() {
        return {
            sent: false,
            age: 20,
            gender: 'Female',
            yearOfStudy: 'bsc1',
            faculty: 'TPM',
            risk: 5
        }
    },
    methods: {
        async submit() {
            const self = this;

            const payload = {
                gameId: parseInt(self.$parent.game.id),
                number: parseInt(self.$parent.player.number),
                tag: self.$parent.player.tag,
                age: parseInt(self.age),
                gender: self.gender,
                yearOfStudy: self.yearOfStudy,
                faculty: self.faculty,
                risk: parseInt(self.risk)
            };

            try {
                await sendSurvey(payload);
                this.sent = true;
            } catch (err) {
                console.log('Something went wrong while sending the survey', err);
            }
        }
    }
}
</script>
