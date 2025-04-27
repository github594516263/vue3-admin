import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupRouter } from './router'
;(async function () {
  const app = createApp(App)

  app.use(createPinia())
  setupRouter(app)

  // Mount when the route is ready
  // https://next.router.vuejs.org/api/#isready
  // await router.isReady()
  router.isReady().then(() => app.mount('#app', true))
})()
