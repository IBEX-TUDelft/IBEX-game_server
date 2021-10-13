import Vue from 'vue'
import App from './App.vue'
import { BootstrapVue } from 'bootstrap-vue'
import router from './router'
import axios from "axios";

Vue.config.productionTip = false

Vue.use(BootstrapVue);

/*const base = axios.create({
  baseURL: "http://localhost:8080/api/v1" // replace on production env
});*/

const base = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  responseType: "json",
  headers: {
    Accept: "application/json"
  }
});

Vue.prototype.$http = base;

router.beforeEach((to, from, next) => {
  if (to.name === from.name) {
    return next();
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    const user = localStorage.getItem("username");

    console.log('Needs to be logged in: ' + user)
    console.log(user);
    if (user == null) {
      next({
        path: "/"
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
