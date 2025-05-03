import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Login from './views/DiscordLogin.vue';
import Settings from './views/Settings.vue';


const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/settings', component: Settings },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
