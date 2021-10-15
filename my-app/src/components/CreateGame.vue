<template>
    <div class="hello">
        <Header />
        <div class="container">
            <div class="row">
                <div class="col-md-12 mrgnbtm">
                <h2>Create a Game</h2>
                    <form>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label htmlFor="exampleInputEmail1">Title (for later retrieval)</label>
                            </div>
                            <div class="form-group col-md-8">
                                <input type="text" class="form-control" v-model="title" name="title" id="title" aria-describedby="emailHelp" placeholder="For later lookup" />
                            </div>
                        </div>
                        <h3>Game Parameters</h3>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label htmlFor="exampleInputEmail1">Game Type</label>
                            </div>
                            <div class="form-group col-md-8">
                                <select class="form-control" v-model="game_type" name="game_type" id="game_type" aria-describedby="emailHelp" placeholder="6" >
                                    <option value="harberger">Harberger</option>
                                    <option value="futarchy">Futarchy</option>
                                    <option value="voter">Voter</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label htmlFor="exampleInputEmail1">Number of Players</label>
                            </div>
                            <div class="form-group col-md-8">
                                <input type="text" class="form-control" v-model="player_number" name="player_number" id="player_number" aria-describedby="emailHelp" placeholder="12" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label htmlFor="exampleInputEmail1">Balance per Player</label>
                            </div>
                            <div class="form-group col-md-8">
                                <input type="text" class="form-control" v-model="balance" name="balance" id="balance" aria-describedby="emailHelp" placeholder="500000" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label htmlFor="exampleInputEmail1">Number of Rounds</label>
                            </div>
                            <div class="form-group col-md-8">
                                <input type="text" class="form-control" v-model="round_count" name="round_count" id="round_count" aria-describedby="emailHelp" placeholder="6" />
                            </div>
                        </div>
                        <!--div class="row">
                            <div class="form-group col-md-6">
                                <label htmlFor="exampleInputEmail1"></label>
                                <input type="text" class="form-control" v-model="firstName" name="firstname" id="firstname" aria-describedby="emailHelp" placeholder="First Name" />
                            </div>
                            <div class="form-group col-md-6">
                                <label htmlFor="exampleInputPassword1">Last Name</label>
                                <input type="text" class="form-control" v-model="lastName" name="lastname" id="lastname" placeholder="Last Name" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label htmlFor="exampleInputEmail1">Email</label>
                                <input type="text" class="form-control" v-model="email" name="email" id="email" aria-describedby="emailHelp" placeholder="Email" />
                            </div>
                        </div-->
                        <button type="button" @click='createGame()' class="btn btn-danger">Create</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Header from './Header.vue'

export default {
  name: 'CreateGame',
  data() {
    return {
      title: '',
      player_number: 12,
      balance: 500000,
      round_count: 5,
      game_type: 'harberger'
    }
  },
  components: {
      Header
  },
  methods: {
      createGame() {
          const payload = {
              title: this.title,
              playerNumber: this.player_number
          }
          this.$emit('createGame', payload)
          this.clearForm();
      },
      clearForm() {
          this.firstName = "";
          this.lastName = "";
          this.email = "";
      }
  }
}
</script>