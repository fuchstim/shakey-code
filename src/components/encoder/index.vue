<style scoped>
  h1.title {
    margin-top: 0;
  }

  p.label {
    margin-bottom: 2px;
  }

  input {
    width: 100%
  }

  p#error {
    background-color: red;
    color: white;
    padding: 12px;
    border-radius: 10px;
  }

  img {
    width: 100%;
    height: auto;
  }
</style>

<template>
  <div>
    <h1 class="title">Encode</h1>

    <p class="label">Input code here:</p>
    <input type="text" v-model="input"/>

    <p id="error" v-if="error">{{ error }}</p>

    <img v-if="result" :src="result" />
  </div>
</template>

<script>

import ShakeyCodeEncoder from '../../lib/encode'

export default {
  name: 'encoder',

  data: () => ({
    input: undefined,
    error: null,
    result: null,
    encoder: new ShakeyCodeEncoder()
  }),

  mounted() { this.input = '' },

  watch: {
    input(code) {
      return this.encoder.encode(code)
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
