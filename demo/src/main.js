import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import routes from './routes.js';

Vue.config.productionTip = false;

new Vue({
  router: new VueRouter({ routes }),
  render(h) { return h(App); },
}).$mount('#app');
