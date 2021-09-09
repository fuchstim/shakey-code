<style>
  html, body {
    margin: 0;
    padding: 0;
  }

  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }

  div.container {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  div.container div.content {
    z-index: 0;
    width: 80%;
    max-width: 500px;
    height: 100%;
    padding: 32px 48px 48px 48px;
    border-radius: 0 0 10px 10px;
    box-shadow: #f1f1f1 0 0 15px;
  }

  @media only screen and (max-width: 600px) {
    div.container div.content {
      width: 100%;
      max-width: 100%;
      border-radius: 0;
      box-shadow: none;
    }
  }
</style>

<template>
  <div id="app">
    <navigation style="position: relative; z-index: 1" />

    <div class="container">
      <router-view class="content" />
    </div>
  </div>
</template>

<script>

import navigation from './components/navigation';

export default {
  name: 'ShakeyDemo',

  components: {
    navigation,
  },

  data: () => ({ }),
};
</script>
