<style scoped>
  h1.title {
    margin-top: 0;
  }

  p.label {
    margin-bottom: 2px;
  }

  input {
    width: calc(100% - 36px);
    border-radius: 10px;
    border: none;
    background-color: #f1f1f1;
    padding: 8px 16px;
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
    <h1 class="title">
      Encode
    </h1>

    <p class="label">
      Input code here:
    </p>
    <input
      v-model="input"
      type="text"
      autofocus
    >

    <p
      v-if="error"
      id="error"
    >
      {{ error }}
    </p>

    <img
      v-if="result"
      :src="result"
    >
  </div>
</template>

<script>

import ShakeyCodeEncoder from '../../lib/encode';

export default {
  name: 'Encoder',

  data: () => ({
    input: undefined,
    error: null,
    result: null,
    encoder: new ShakeyCodeEncoder(),
  }),

  watch: {
    async input(code) {
      try {
        const result = await this.encoder.encode(code);
        this.error = null;
        this.result = result;
      } catch (error) {
        this.error = error.message;
        this.result = null;
      }
    },
  },

  mounted() { this.input = ''; },
};
</script>
