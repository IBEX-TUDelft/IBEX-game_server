<template>
  <div>
    <b-navbar id="navbar" toggleable="md" type="dark" variant="info">
      <b-navbar-brand href="#" @click="dashboard">
          Back Home
      </b-navbar-brand>
      <div class="container justify-content-center">
        <b-navbar-brand>
            {{ $route.name }}
        </b-navbar-brand>
      </div>
      <b-navbar-nav class="ml-auto">
        <b-nav-text>{{ username }} | </b-nav-text>
        <b-nav-item @click="newGame" active>New Game | </b-nav-item>
        <b-nav-item @click="lobby" active>Game Lobby | </b-nav-item>
        <b-nav-item @click="logUserOut" active>Logout</b-nav-item>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import VueJwtDecode from "vue-jwt-decode";

export default {
  data() {
    return {
      username: localStorage.username
    };
  },
  methods: {
    getUserDetails() {
      let token = localStorage.getItem("token");
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
