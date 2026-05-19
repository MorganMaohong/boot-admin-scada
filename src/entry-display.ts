import '@/assets/main.css'
import 'vfonts/Lato.css'
import { createApp } from 'vue'
import store from '@/stores'
import DisplayApp from './DisplayApp.vue'
import './globals'

function bootstrap() {
  const app = createApp(DisplayApp)
  app.use(store)
  app.mount('#app')
}

bootstrap()
