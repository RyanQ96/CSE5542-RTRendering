import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'vuetify/styles'
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  icons: {
    defaultSet: "mdi",
  },
  components,
  directives,
})

const app = createApp(App)
app.use(vuetify).mount('#app')
