import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
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
    component: () => import('../views/AdminDashboard.vue')
  },
  {
    path: '/rooms/:roomId',
    name: 'rooms',
    component: () => import('../views/RoomView.vue')
  },
  {
    path: '/bingo-rooms/:roomId',
    name: 'bingo-rooms',
    component: () => import('../views/BingoRoomView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(), // ✅ FIX HERE
  routes
})

export default router