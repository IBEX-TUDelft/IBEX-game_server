import Vue from 'vue'
import VueRouter from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import Login from '../components/Login.vue';
import CreateGame from '../components/CreateGame.vue';

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/me',
    name: 'Home',
    component: Dashboard,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/newgame',
    name: 'CreateGame',
    component: CreateGame,
    meta: {
      requiresAuth: true
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
