<template>
    <div>
        <Header />
        <div class="px-5">
        <form>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Title</label>
                </div>
                <div class="form-group col-md-4">
                    <input type="text" class="form-control" v-model="title" name="title" id="title" aria-describedby="emailHelp" placeholder="For later lookup" />
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Game Type</label>
                </div>
                <div class="form-group col-md-4">
                    <select class="form-control" v-model="game_type" name="game_type" id="game_type" aria-describedby="emailHelp" placeholder="6" >
                        <option value="harberger">Harberger</option>
                        <option value="futarchy">Futarchy</option>
                        <option value="voter">Voter</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Number of Rounds</label>
                </div>
                <div class="form-group col-md-4">
                    <input type="number" class="form-control" v-model="round_count" name="round_count" id="round_count" aria-describedby="emailHelp" placeholder="6" />
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Minutes for Trading</label>
                </div>
                <div class="form-group col-md-4">
                    <input type="number" class="form-control" v-model="minutes_for_trading" name="minutes_for_trading" id="minutes_for_trading" aria-describedby="emailHelp" placeholder="10" />
                </div>
            </div>
            <h3>Players</h3>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Speculators</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="speculators_count" name="speculators_count" id="speculators_count" aria-describedby="emailHelp" placeholder="6" />
                </div>
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Balance</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="speculator_balance" name="speculator_balance" id="speculator_balance" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Shares</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="speculator_shares" name="speculator_shares" id="speculator_shares" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Developers</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="developers_count" name="developers_count" id="developers_count" aria-describedby="emailHelp" placeholder="5" />
                </div>
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Balance</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="developer_balance" name="developer_balance" id="developer_balance" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Shares</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="developer_shares" name="developer_shares" id="developer_shares" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>
            <div class="row">
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Owners</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="owners_count" name="owners_count" id="owners_count" aria-describedby="emailHelp" placeholder="1" />
                </div>
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Balance</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="owner_balance" name="owner_balance" id="owner_balance" aria-describedby="emailHelp" placeholder="500000" />
                </div>
                <div class="form-group col-md-2">
                    <label htmlFor="exampleInputEmail1">Shares</label>
                </div>
                <div class="form-group col-md-2">
                    <input type="number" class="form-control" v-model="owner_shares" name="owner_shares" id="owner_shares" aria-describedby="emailHelp" placeholder="500000" />
                </div>
            </div>
            <button type="button" @click='createGame()' class="btn btn-danger">Create</button>
        </form>
        </div>
    </div>
</template>

<script>
import { createGame } from '../services/GameService'
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

import Header from './Header.vue'

export default {
  name: 'CreateGame',
  data() {
    return {
      title: uniqueNamesGenerator({
        dictionaries: [colors, adjectives, animals],
        separator: " ",
        style: "capital"
      }),
      speculators_count: 6,
      speculator_balance: 500000,
      speculator_shares: 5000,
      developers_count: 5,
      developer_balance: 500000,
      developer_shares: 5000,
      owners_count: 1,
      owner_balance: 500000,
      owner_shares: 5000,
      round_count: 5,
      game_type: 'harberger',
      minutes_for_trading: 10
    }
  },
  components: {
      Header
  },
  methods: {
      createGame() {
          const payload = {
              title: this.title,
              speculators: {
                  count: this.speculators_count,
                  balance: this.speculator_balance,
                  shares: this.speculator_shares
              },
              developers: {
                  count: this.developers_count,
                  balance: this.developer_balance,
                  shares: this.developer_shares
              },
              owners: {
                  count: this.owners_count,
                  balance: this.owner_balance,
                  shares: this.owner_shares
              },
              round_count: this.round_count,
              game_type: this.game_type,
              minutes_for_trading: this.minutes_for_trading
          }
          //this.$emit('createGame', payload)
          //this.clearForm();

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