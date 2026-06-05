import '@/assets/main.css'
import '@/styles/form-modal.scss'
import '@/styles/manage-panel.scss'
import 'vfonts/Lato.css'
import { createApp } from 'vue'
import naive from 'naive-ui'
import { applyNaiveDropdownDefaults } from '@/plugins/naive-dropdown-defaults'
import store from '@/stores'
import { loadSvg } from '@/icons'
import App from './App.vue'
import router from './router'
import './globals'

async function bootstrap() {
  const app = createApp(App)

  app.use(store)
  app.use(router)
  app.use(naive)
  applyNaiveDropdownDefaults(app)

  const [{ default: VueKonva }, { default: Vue3ColorPicker }, { default: VxeUITable }] = await Promise.all([
    import('vue-konva'),
    import('vue3-colorpicker'),
    import('vxe-table'),
  ])

  await Promise.all([
    import('vue3-colorpicker/style.css'),
    import('vxe-table/lib/style.css'),
    import('vfonts/FiraCode.css'),
  ])

  loadSvg(app)
  app.use(VueKonva)
  app.use(Vue3ColorPicker)
  app.use(VxeUITable)
  app.mount('#app')
}

void bootstrap()
