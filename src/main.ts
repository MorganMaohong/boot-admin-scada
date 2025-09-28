import '@/assets/main.css'
// 通用字体
import 'vfonts/Lato.css'
// 等宽字体
import 'vfonts/FiraCode.css'
import { createApp } from 'vue'
import store from '@/stores'
import { loadSvg } from '@/icons'

import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import VueKonva from 'vue-konva'
import Vue3ColorPicker from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'
import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'
import './globals' // 注册 globalThis.le5leFn
// 1. 引入你需要的组件
import { NumberKeyboard } from 'vant'
// 2. 引入组件样式
import 'vant/lib/index.css'

const app = createApp(App)
loadSvg(app)

app.use(store)
app.use(router)
app.use(naive)
app.use(VueKonva)
app.use(Vue3ColorPicker)
app.use(VxeUITable)
app.use(NumberKeyboard)
app.mount('#app')
