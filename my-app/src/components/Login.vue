<template>
  <div class="container">
    <b-card
      bg-variant="dark"
      header="Conditional Harberger Taxation"
      text-variant="white"
      class="text-center"
    >
      <b-card-text>Already have an account? Login Here!</b-card-text>
      <div class="row">
        <div class="col-lg-6 offset-lg-3 col-sm-10 offset-sm-1">
          <form
            class="text-center border border-primary p-5"
            style="margin-top:70px;height:auto;padding-top:100px !important;"
            @submit.prevent="loginUser"
          >
            <input
              type="text"
              id="username"
              class="form-control mb-5"
              placeholder="Username"
              v-model="login.username"
            />
            <!-- Password -->
            <input
              type="password"
              id="password"
              class="form-control mb-5"
              placeholder="Password"
              v-model="login.password"
            />
            <p>
              Dont have an account? Click
              <router-link to="/register"> here </router-link> to sign up
            </p>
            <!-- Sign in button -->
            <center>
              <button class="btn btn-primary btn-block w-75 my-4" type="submit">
                Sign in
              </button>
            </center>
          </form>
        </div>
      </div>
    </b-card>
  </div>
</template>
<script>
export default {
  data() {
    return {
      login: {
        username: "",
        password: ""
      }
    };
  },
  methods: {
    async loginUser() {
      this.$http.post("/auth/login", this.login)
      .then(response => {

        localStorage.setItem("username", response.data.data.user.username);
        localStorage.setItem("role", response.data.data.user.role);
        localStorage.setItem("id", response.data.data.user.id);
        localStorage.setItem("token", response.data.data.token);

        this.$router.push("/dashboard");
      })
      .catch(e => console.log(e));
    }
  },
  mounted () {
    const token = localStorage.getItem("token");

    if (token != null) {
      this.$http.get("/auth/check", { params: { token }}).then(() => {
        let home = process.env.VUE_APP_USER_HOME;

        if (home == null) {
          home = 'dashboard';
        }

        this.$router.push(`/${home}`);
      }).catch((e) => {
        console.error('While checking the access token', e);
      });
    } else {
      if (this.$route.path === '/') {
        this.$router.push(`${process.env.VUE_APP_GUEST_HOME}`);
      }
    }
  }
};
</script>