import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router/index.js';
import axios from '@/api';
import CyberWeb from 'cyber-web-ui';
import '@/assets/style/main.less';
import 'virtual:windi.css';
import './permission.js';

const app = createApp(App);
app.config.globalProperties.$axios = axios;
app.use(CyberWeb).use(router).mount('#app');
