<template>
  <b-container fluid class="no-gutters">
    <Header />
    <div>
        <Games v-if="games.length > 0" :games="games" />
        <div v-else><p>No games to display. Click &quot;<b>New Game</b>&quot; on the right top menu to create a new one.</p></div>
    </div>
  </b-container>
</template>

<script>
import Header from './Header.vue'
//import CreateUser from './CreateUser.vue'
import Games from './Games.vue'
import { getAllUsers, createUser } from '../services/UserService'
import { listGames } from '../services/GameService'

export default {
  name: 'Dashboard',
  components: {
    Header,
//    CreateUser,
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
        this.users = response
        this.numberOfUsers = this.users.length
      });

      let gameRecords;

      try {
        gameRecords = await listGames();
      } catch(e) {
        console.log(e);
      }
      

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