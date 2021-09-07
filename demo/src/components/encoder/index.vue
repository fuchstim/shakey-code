<style scoped>
  input {
    width: 100%
  }

  p#error {
    background-color: red;
    color: white;
    padding: 5px;
  }

  img {
    width: 100%;
    height: auto;
  }
</style>

<template>
  <div style="width: 100%">
    <p>Input code here:</p>
    <input type="text" v-model="input"/>

    <p id="error" v-if="error">{{ error }}</p>

    <img v-if="result" :src="result" />
  </div>
</template>

<script>

import { encode } from '../../scanner'

export default {
  name: 'encoder',

  data: () => ({
    input: undefined,
    error: null,
    result: null
  }),

  watch: {
    input(code) {
      return encode(code)
        .then(r => {
          this.error = null;
          this.result = r;
        })
        .catch(e => {
          this.error = e.message;
          this.result = null;
        })
    }
  }
}
</script>
