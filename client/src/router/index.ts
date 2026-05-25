import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import BingoRoomView from '../views/BingoRoomView.vue'
import { useAuth } from '@/store/auth'
import { AuthService } from '@/services/AuthService'

const authService = new AuthService()

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboard,
  },
  {
    path: '/rooms/:roomId',
    name: 'rooms',
    redirect: (to) => ({
      name: 'bingo-rooms',
      params: { roomId: String(to.params.roomId) },
    }),
  },
  {
    path: '/bingo-rooms/:roomId',
    name: 'bingo-rooms',
    component: BingoRoomView,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.name !== 'admin-dashboard') {
    return true
  }

  const token = localStorage.getItem('token')
  if (!token) {
    return { name: 'home' }
  }

  const auth = useAuth()
  if (!auth.user) {
    try {
      const { data } = await authService.me()
      auth.setUser(data)
    } catch {
      localStorage.removeItem('token')
      return { name: 'home' }
    }
  }

  if (String(auth.user?.role || '').toLowerCase() !== 'admin') {
    return { name: 'home' }
  }

  return true
})

export default router
