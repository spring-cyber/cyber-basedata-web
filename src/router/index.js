import * as VueRouter from 'vue-router';
import NotFound from '@/components/error/404.vue';
import Layout from '@/views/layout/index.vue';
import { LoginPage } from 'cyber-web-ui';
import Logo from '../assets/img/logo/twins.svg';
import defaultRoutes from './modules/default';

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    children: [],
  },
  import.meta.env.MODE == 'development'
    ? {
        path: '/login',
        component: LoginPage,
        props: {
          logo: Logo,
        },
      }
    : {},
  {
    path: '/:catchAll(.*)',
    name: '404',
    component: NotFound,
  }
];

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes: routes
});

export default router;
