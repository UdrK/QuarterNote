import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './assets/main.css';
import { initTheme } from './composables/useTheme';
import { initI18n, t } from './i18n';

initTheme();
initI18n();

const app = createApp(App);
app.config.globalProperties.$t = t;
app.use(router);
app.mount('#app');
