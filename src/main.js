import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router/index.js';
import CyberWeb from 'cyber-web-ui';
import '@/assets/style/main.less';
import 'virtual:windi.css';
import './permission.js';

const app = createApp(App);
app.use(CyberWeb).use(router).mount('#app');
