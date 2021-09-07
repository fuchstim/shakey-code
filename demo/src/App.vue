
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;

  display: flex;
  flex-direction: row;
}
</style>


<template>
  <div id="app">
    <!-- <encoder style="width: 30%; margin-right: 24px" /> -->

    <!-- <decoder style="width: 70%" /> -->

    <decoder />
  </div>
</template>

<script>
import encoder from './components/encoder/index.vue';
import decoder from './components/decoder/index.vue';

export default {
  name: 'shakey-demo',

  data: () => ({ }),

  components: {
    encoder,
    decoder,
  },
};
</script>
