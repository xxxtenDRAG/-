import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'monitor',
        component: () => import('@/views/MonitorView.vue'),
        meta: { title: '监控预警台' },
      },
      {
        path: 'simulate',
        name: 'simulate',
        component: () => import('@/views/SimulateView.vue'),
        meta: { title: '事件模拟控制台' },
      },
      {
        path: 'alarms',
        name: 'alarms',
        component: () => import('@/views/AlarmsView.vue'),
        meta: { title: '告警中心' },
      },
      {
        path: 'chat',
        name: 'chat',
        component: () => import('@/views/ChatView.vue'),
        meta: { title: '智能问答' },
      },
      {
        path: 'kb',
        name: 'kb',
        component: () => import('@/views/KbView.vue'),
        meta: { title: '知识库管理' },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? `${String(title)} · 鹅疫智答` : '鹅疫智答 · 风险预警平台'
})

export default router
