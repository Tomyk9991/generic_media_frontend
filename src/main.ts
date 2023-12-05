import { createApp } from "vue";
import "./styles.css";

// Icons
import '@mdi/font/css/materialdesignicons.css';
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import App from "./App.vue";

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { ImageBackendService } from "./services/Service";
import Login from "./components/pages/Login.vue";
import {createRouter, createWebHashHistory} from "vue-router";
import Profile from "./components/pages/Profile.vue";
import EditProfile from "./components/pages/EditProfile.vue";
import Friends from "./components/pages/Friends.vue";


const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark'
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
})

const routes = [
    { path: "/", component: Login },
    { path: "/gallery/:user", component: Profile },
    { path: "/gallery/:user/list", component: Profile },
    { path: "/edit", component: EditProfile },
    { path: "/friends", component: Friends }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes
});

createApp(App)
    .use(router)
    .use(vuetify)
    .provide('backendService', new ImageBackendService())
    .mount("#app");
