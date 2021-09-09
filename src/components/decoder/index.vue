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

  p.result {
    background-color: green;
    color: white;
    padding: 12px;
    border-radius: 10px;
  }

  p.error {
    background-color: red;
    color: white;
    padding: 12px;
    border-radius: 10px;
  }

  div.preview {
    width: 100%;
    position: relative;
    height: max-content;
  }

  div.preview video {
    width: 100%;
  }

  div.preview div.viewfinder {
    position: absolute;
    box-shadow: inset 0px 0px 0px 5px #009fff;
    border-radius: 5px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%)
  }

  div.canvases {
    display: flex;
    flex-direction: row;
  }

  div.canvases canvas.focus {
    display: none;
  }

  div.canvases div.debugViews {
    display: grid;
    grid-gap: 12px;
    grid-template-columns: auto auto auto auto auto;
  }

  div.canvases div.debugViews canvas {
    width: 160px;
    height: 160px;
  }
</style>

<template>
  <div>
    <h1 class="title">
      Decode
    </h1>

    <p class="label">
      Scanning... {{ progress || 0 }}%
    </p>
    <p
      v-if="result"
      class="result"
    >
      {{ result }}
    </p>
    <p
      v-if="error"
      class="error"
    >
      {{ error }}
    </p>

    <div class="preview">
      <div
        ref="viewfinder"
        class="viewfinder"
      />
      <video
        ref="preview"
        autoplay
        playsinline
      />
    </div>

    <div class="canvases">
      <canvas
        ref="focus"
        class="focus"
      />

      <div
        ref="debugViews"
        class="debugViews"
      />
    </div>
  </div>
</template>

<script>

import ShakeyCodeDecoder from '../../lib/decode';

export default {
  name: 'Decoder',

  data: () => ({
    stream: null,
    isScanning: false,
    fps: 5,
    scanInterval: null,
    result: '',
    error: '',
    progress: 0,

    debugViews: {},
    decoder: new ShakeyCodeDecoder(),
  }),

  async mounted() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      this.decoder._drawDebug = (id, content) => this.drawDebug(id, content);
      this.decoder.onResult = result => this.result = result;
      this.decoder.onSampleRecorded = ({ sampleProgress }) => this.progress = sampleProgress;

      this.startScan();
    } catch (error) {
      this.stopScan();

      this.error = error.message;
    }
  },

  beforeDestroy() {
    this.stopScan();
  },

  methods: {
    startScan() {
      try {
        const video = this.$refs.preview;
        video.srcObject = this.stream;

        this.scanInterval && clearInterval(this.scanInterval);
        this.scanInterval = setInterval(
          () => this.detectCode(),
          (1000 / this.fps)
        );

        this.isScanning = true;
      } catch (e) {
        this.error = e.message;
      }
    },

    stopScan() {
      this.scanInterval && clearInterval(this.scanInterval);

      this.stream.getTracks().forEach(track => track.stop());

      this.isScanning = false;
    },

    async detectCode() {
      const video = this.$refs.preview;
      const focus = this.$refs.focus;

      const scanArea = this.computeScanArea({ width: video.videoWidth, height: video.videoHeight });

      this.updateViewfinder(scanArea);

      focus.width = scanArea.width;
      focus.height = scanArea.height;

      focus.getContext('2d').clearRect(0, 0, scanArea.width, scanArea.height);
      focus.getContext('2d').drawImage(
        /* image = */ video,
        /* sx = */ scanArea.x,
        /* sy = */ scanArea.y,
        /* sWidth = */ scanArea.width,
        /* sHeight = */ scanArea.height,
        /* dx = */ 0,
        /* dy = */ 0,
        /* dWidth = */ focus.width,
        /* dHeight = */ focus.height
      );

      try {
        await this.decoder.decode(focus.toDataURL().split(',')[1]);
      } catch (e) {
        this.error = e.message;
        throw e;
      }
    },

    computeScanArea({ width, height }) {
      const scanAreaWidth = Math.max(width, height) / 2;
      const topCornerX = width === scanAreaWidth ? 0 : ((width - scanAreaWidth) / 2);
      const topCornerY = height === scanAreaWidth ? 0 : ((height - scanAreaWidth) / 2);

      const relativeWidth = scanAreaWidth / width;
      const relativeHeight = scanAreaWidth / height;

      return {
        width: scanAreaWidth,
        height: scanAreaWidth,
        relativeWidth,
        relativeHeight,
        x: topCornerX,
        y: topCornerY,
      };
    },

    updateViewfinder({ relativeWidth, relativeHeight }) {
      const viewfinder = this.$refs.viewfinder;
      const video = this.$refs.preview;

      const height = video.offsetHeight * relativeHeight;
      const width = video.offsetWidth * relativeWidth;

      viewfinder.style.width = `${width}px`;
      viewfinder.style.height = `${height}px`;
    },

    drawDebug(id, content) {
      let canvas;
      if (this.debugViews[id]) {
        canvas = this.debugViews[id].canvas;
      } else {
        const container = document.createElement('div');
        const title = document.createElement('h4');
        title.innerText = id;

        canvas = document.createElement('canvas');
        container.appendChild(title);
        container.appendChild(canvas);

        this.$refs.debugViews.appendChild(container);

        this.debugViews[id] = { container, canvas };
      }

      canvas.width = 160;
      canvas.height = 160;

      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

      let ratio = Math.min(canvas.width / content.width, canvas.height / content.height);
      let x = (canvas.width - content.width * ratio) / 2;
      let y = (canvas.height - content.height * ratio) / 2;

      var image = new Image();

      image.onload = function () {
        canvas.getContext('2d').drawImage(
          image,
          0,
          0,
          content.width,
          content.height,
          x,
          y,
          content.width * ratio,
          content.height * ratio
        );
      };

      image.src = content.data || content.toDataURL();
    },
  },
};
</script>
