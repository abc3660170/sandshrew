import { createRouter, createWebHashHistory } from 'vue-router';
import Pull from '../pages/pull';
import Push from '../pages/push';

//如首页和登录页和一些不用权限的公用页面
export const routes = [
    {
        path: '/',
        redirect: '/push'
    },
    {
        path: '/push',
        name: 'push',
        component: Push
    },
    {
        path: '/pull',
        name: 'pull',
        component: Pull
    }
];

const router = createRouter({
    routes,
    history: createWebHashHistory('/')
});

export default router;
