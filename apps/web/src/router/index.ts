import { createRouter, createWebHistory } from 'vue-router'
import AnalyserView from '../views/AnalyserView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'analyser',
      component: AnalyserView,
    },
  ],
})

export default router
