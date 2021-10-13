<template>
  <div class="hello">
    <Header />
    <div class="container mrgnbtm">
          <div class="row">
            <div class="col-md-8">
                <CreateUser @createUser="userCreate($event)" />
            </div>
            <div class="col-md-4">
                <DisplayBoard :numberOfUsers="numberOfUsers" @getAllUsers="getAllUsers()" />
            </div>
          </div>
    </div>
    <div class="row mrgnbtm">
        <Users v-if="users.length > 0" :users="users" />
        <Games v-if="games.length > 0" :games="games" />
    </div>
  </div>
</template>

<script>
import Header from './Header.vue'
import CreateUser from './CreateUser.vue'
import DisplayBoard from './DisplayBoard.vue'
import Users from './Users.vue'
import Games from './Games.vue'
import { getAllUsers, createUser } from '../services/UserService'
import { listGames } from '../services/GameService'

export default {
  name: 'Dashboard',
  components: {
    Header,
    CreateUser,
    DisplayBoard,
    Users,
    Games
  },
  data() {
      return {
          users: [],
          numberOfUsers: 0,
          games: [],
          numberOfGames: 0
      }
  },
  methods: {
    getAllData: async function () {
      getAllUsers().then(response => {
        console.log(response)
        this.users = response
        this.numberOfUsers = this.users.length
      });

      const gameRecords = await listGames();

      this.games = gameRecords;
      this.numberOfGames = gameRecords.length;
    },
    userCreate(data) {
      console.log('data:::', data)
      createUser(data).then(response => {
        console.log(response);
        this.getAllUsers();
      });
    }
  },
  mounted () {
    this.getAllData();
  }
}
</script>