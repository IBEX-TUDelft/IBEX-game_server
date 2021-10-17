import Vue from 'vue'
import VueRouter from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import Login from '../components/Login.vue';
import CreateGame from '../components/CreateGame.vue';
import GameMasterBoard from '../components/GameMasterBoard';
import GameBoard from '../components/GameBoard';
import GameLobby from '../components/GameLobby';

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Home',
    component: Dashboard,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/newgame',
    name: 'Create a Game',
    component: CreateGame,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/masterboard/:id',
    name: 'Game Master Board',
    component: GameMasterBoard,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/board/:id',
    name: 'Game Board',
    component: GameBoard
  },
  {
    path: '/lobby',
    name: 'Game Lobby',
    component: GameLobby
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
