import Encoder from './components/encoder';
import Decoder from './components/decoder';

const routes = [
  { path: '/', redirect: '/encode' },
  { path: '/encode', component: Encoder },
  { path: '/decode', component: Decoder }
]

export default routes;
