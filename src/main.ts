import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/main.scss'

import '@ui5/webcomponents/dist/Assets.js'
import '@ui5/webcomponents-fiori/dist/Assets.js'
import '@ui5/webcomponents-icons/dist/AllIcons.js'

import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js'
setTheme('sap_horizon_dark')

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('ui5-')

app.mount('#app')
