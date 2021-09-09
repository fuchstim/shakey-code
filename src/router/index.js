import Vue from 'vue';
import VueRouter from 'vue-router';

import Encoder from '../components/encoder';
import Decoder from '../components/decoder';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/encode' },
  { path: '/encode', component: Encoder },
  { path: '/decode', component: Decoder },
];

const router = new VueRouter({
  routes,
});

export default router;
