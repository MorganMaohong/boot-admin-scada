import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const Layouts = () => import('../Layout/index.vue')
console.log(import.meta.env)
const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH)
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes: [
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
    {
      path: '/display',
      component: () => import('@/views/display/index.vue'),
      name: 'Display',
      meta: {
        title: '画面',
      },
    },
  ],
})

export default router
