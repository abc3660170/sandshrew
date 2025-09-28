import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Pull from '../pages/pull.vue';
import DockerPull from '../pages/DockerPull.vue';
import DockerPush from '../pages/DockerPush.vue';
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
                next({ path: '/npmjs/push' });
            } else {
                next({ path: '/npmjs/pull' });
            }
        },
    },
    {
        path: '/npmjs/push',
        name: 'npmjspush',
        component: Push
    },
    {
        path: '/npmjs/pull',
        name: 'npmjspull',
        component: Pull
    },
    {
        path: '/docker/pull',
        name: 'dockerpull',
        component: DockerPull
    },
    {
        path: '/docker/push',
        name: 'dockerpush',
        component: DockerPush
    }
];

const router = createRouter({
    routes,
    history: createWebHashHistory('/')
});

export default router;
