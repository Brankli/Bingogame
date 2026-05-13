import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import(/* webpackChunkName: "admin" */ '../views/AdminDashboard.vue')
  },
  {
    path: '/rooms/:roomId',
    name: 'rooms',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "rooms" */ '../views/RoomView.vue')
  },
  {
    path: '/bingo-rooms/:roomId',
    name: 'bingo-rooms',
    component: () => import(/* webpackChunkName: "bingo-rooms" */ '../views/BingoRoomView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
