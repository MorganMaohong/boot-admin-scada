import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { bootstrapAuthFromUrl, getAuthToken } from '@/utils/auth'

const Layouts = () => import('../Layout/index.vue')
const AccessRequired = () => import('@/views/access-required/index.vue')
const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH)
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes: [
    {
      path: '/access-required',
      name: 'AccessRequired',
      component: AccessRequired,
    },
    {
      path: '/',
      name: 'Home',
      component: Layouts,
      redirect: '/edit',
      children: [
        {
          path: '/edit',
          component: () => import('@/views/edit/index.vue'),
          name: 'Edit',
          meta: {
            title: '编辑器',
          },
        },
      ],
    },
    {
      path: '/preview',
      component: () => import('@/views/preview/index.vue'),
      name: 'Preview',
      meta: {
        title: '预览',
      },
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (to.path === '/access-required') {
    next()
    return
  }

  const token = getAuthToken() || bootstrapAuthFromUrl()
  if (!token) {
    next({ path: '/access-required', replace: true })
    return
  }

  next()
})

export default router
