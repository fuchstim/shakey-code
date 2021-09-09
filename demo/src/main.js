import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import router from './router.js'

Vue.config.productionTip = false;

new Vue({
  router,
  render(h) { return h(App); }
}).$mount('#app');
