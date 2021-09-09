<style scoped>
  div.container {
    display: flex;
    flex-direction: row;
    justify-content: left;
    width: 100%;
    background-color: #009fff;
    height: 48px;
  }

  div.container img.icon {
    height: 100%;
    width: auto;
    margin: 0 24px;
  }

  div.container div.item {
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 18px;
    padding: 0 12px;
    text-decoration: none;
    color: white;
    transition: all .2s cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  div.container div.item:hover, div.container div.item.active {
    background-color: white;
    color: #009fff;
  }

  div.container div.item a {
    font-size: 18px;
    text-decoration: none;
    color: inherit;
    font-weight: bold;
  }
</style>

<template>
  <div class="container">
    <img
      class="icon"
      src="../../../public/shakey.png"
    >
    <div
      v-for="route in routes"
      :key="route.path"
      class="item"
      :class="{ active: $route.path === route.path }"
    >
      <router-link :to="route.path">
        {{ route.title }}
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Navigation',

  data: () => ({
    routes: [
      { path: '/encode', title: 'Encode' },
      { path: '/decode', title: 'Decode' },
    ],
  }),
};
</script>
