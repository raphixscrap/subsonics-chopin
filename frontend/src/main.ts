import { createApp } from 'vue'
import { createPinia } from 'pinia';
import './assets/Global.scss'
import App from './App.vue'

const app = createApp(App);
const pinia = createPinia();
import router from './router';


app.use(pinia);
app.use(router);
app.mount('#app');
