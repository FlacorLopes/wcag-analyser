import { createRouter, createWebHistory } from 'vue-router'
import AnalyserView from '../views/AnalyserView.vue'
import HistoryView from '../views/HistoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'analyser',
      component: AnalyserView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
  ],
})

export default router
