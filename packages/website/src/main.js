import { createApp } from 'vue'
import App from './App.vue'
import 'normalize.css';
import 'element3/lib/theme-chalk/index.css'
import router from "./router";
import Element3 from 'element3'
const app = createApp(App);
app.use(router);
app.use(Element3);
app.mount('#app')
