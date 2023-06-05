import Vue from 'vue'
import VueRouter from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import Login from '../components/Login.vue';
import CreateGame from '../components/CreateGame.vue';
import GameMasterBoard from '../components/GameMasterBoard';
import VotingBoard from '../components/VotingBoard';
import GameBoardChicago from '../components/GameBoardChicago';
import GameLobby from '../components/GameLobby';
import GameAnalysis from '../components/GameAnalysis';
import GameAnalysisVoting from '../components/GameAnalysisVoting';
import GameMarketLog from '../components/GameMarketLog';
import GameChatLog from '../components/GameChatLog';
import GameSurveys from '../components/GameSurveys';


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
    path: '/board/:id/:recovery',
    name: 'Game Board',
    component: GameBoardChicago
  },
  {
    path: '/voting/:id/:recovery',
    name: 'Voting Board',
    component: VotingBoard
  },
  {
    path: '/lobby',
    name: 'Game Lobby',
    component: GameLobby
  },
  {
    path: '/analyse/:id',
    name: 'Game Analysis',
    component: GameAnalysis
  },
  {
    path: '/market/:id',
    name: 'Market Log',
    component: GameMarketLog
  },
  {
    path: '/chat/:id',
    name: 'Chat Log',
    component: GameChatLog
  },
  {
    path: '/analyse-voting/:id',
    name: 'Game Analysis Voting',
    component: GameAnalysisVoting
  },
  {
    path: '/surveys/:id',
    name: 'Game Surveys',
    component: GameSurveys
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
