<template>
  <b-navbar class="p-0" id="navbar" toggleable="md" type="dark" variant="info" style="margin-left: -15px; margin-right: -15px;">
    <b-nav>
      <b-nav-item v-if="user != null">
        <b-button style="width: 125px" v-if="$route.path != '/dashboard'" variant="primary" @click="dashboard">Home</b-button>
        <b-nav-text style="width: 125px; text-align: center;" v-else>Home</b-nav-text>
      </b-nav-item>
    </b-nav>
    <div class="container justify-content-center">
      <b-navbar-brand>
        {{ $route.name }}
      </b-navbar-brand>
    </div>
    <b-nav style="flex-wrap: nowrap;" class="justify-content-center">
      <b-nav-item v-if="user != null">
        <b-button style="width: 125px" v-if="$route.path != '/restore'" variant="primary" @click="restore">Restore</b-button>
        <b-nav-text style="width: 125px; text-align: center;" v-else>Restore</b-nav-text>
      </b-nav-item>
      <b-nav-item v-if="user != null">
        <b-button style="width: 125px" v-if="$route.path != '/simulation'" variant="primary" @click="simulation">Simulation</b-button>
        <b-nav-text style="width: 125px; text-align: center;" v-else>Simulation</b-nav-text>
      </b-nav-item>
      <b-nav-item v-if="user != null">
        <b-button style="width: 125px" v-if="$route.path != '/newgame'" variant="primary" @click="newGame">New Game</b-button>
        <b-nav-text style="width: 125px; text-align: center;" v-else>New Game</b-nav-text>
      </b-nav-item>
      <b-nav-item v-if="user != null">
        <b-button style="width: 125px" v-if="$route.path != '/lobby'" variant="primary" @click="lobby">Game Lobby</b-button>
        <b-nav-text style="width: 125px; text-align: center;" v-else>Game Lobby</b-nav-text>
      </b-nav-item>
      <b-nav-item>
        <b-button v-if="user != null" style="width: 125px" variant="danger" @click="logUserOut">Logout {{ username }}</b-button>
        <b-button v-else style="width: 125px" variant="primary" @click="login">Login</b-button>
      </b-nav-item>
    </b-nav>
  </b-navbar>
</template>

<script>
import VueJwtDecode from "vue-jwt-decode";

export default {
  data() {
    return {
      username: localStorage.username,
      user: null
    };
  },
  methods: {
    getUserDetails() {
      let token = localStorage.getItem("token");

      if (token == null) {
        return;
      }
      
      try {
        let decoded = VueJwtDecode.decode(token);
        this.user = decoded;
      } catch (error) {
        // return error in production env
        console.log(error, "error from decoding token");
      }
    },
    logUserOut() {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("id");
      this.$router.push("/");
    },
    newGame() {
      this.$router.push("/newgame");
    },
    lobby() {
      this.$router.push("/lobby");
    },
    dashboard() {
      this.$router.push("/dashboard");
    },
    simulation() {
      this.$router.push("/simulation");
    },
    restore() {
      this.$router.push("/restore");
    },
    login() {
      this.$router.push("/login");
    }
  },
  created() {
    this.getUserDetails();
  }
};
</script>

<style>
#navbar {
  margin-bottom: 15px;
}
</style>
