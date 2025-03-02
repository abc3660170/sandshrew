import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Pull from '../pages/pull.vue';
import Push from '../pages/push.vue';
import { getEnv } from '../utils';

interface EnvData {
    fronttype: string;
}

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        component: {
            template: '<div>Loading...</div>' // 加载指示器
        },
        beforeEnter: async (_, __, next) => {
            const data: EnvData = await getEnv();
            if (data.fronttype === 'pelipper') {
                next({ path: '/push' });
            } else {
                next({ path: '/pull' });
            }
        },
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
