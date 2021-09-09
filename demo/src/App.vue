
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
    <router-view />
  </div>
</template>

<script>

export default {
  name: 'shakey-demo',

  data: () => ({ }),

  components: { },
};
</script>
