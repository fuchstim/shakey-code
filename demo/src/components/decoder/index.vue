<style scoped>
  div#buttons {
    display: flex;
    flex-direction: row;
  }

  div#canvases {
    display: flex;
    flex-direction: row;
  }

  div#debugViews {
    display: grid;
    grid-gap: 12px;
    grid-template-columns: auto auto auto auto auto;
  }

  div#debugViews canvas {
    width: 160px;
    height: 160px;
  }
  p#result {
    background-color: green;
    color: white;
  }

  p#error {
    background-color: red;
    color: white;
  }
</style>

<template>
  <div style="width: 100%">
    <p>Please select a video input:</p>

    <div id="buttons">
      <!-- <button @click="() => listInputs()">Refresh inputs</button>

      <button v-if="isScanning" @click="() => stopScan()">
        Stop
      </button>

      <button v-else v-for="(input, index) in videoInputs" :key="index" @click="() => startScan(input.deviceId)">
        {{input.label}}
      </button> -->

      <button @click="startScan">
        Start
      </button>

      <button @click="stopScan">
        Stop
      </button>
    </div>

    <div id="canvases">
      <canvas ref="viewfinder" />

      <div id="debugViews" ref="debugViews" />
    </div>

    <video autoplay loop ref="inputVideo" src="../../demo.mp4" style="display: none" />

    <p id="result">{{result}}</p>
    <p id="error">{{error}}</p>
  </div>
</template>

<script>

import { decodeV2 } from '../../scanner';

export default {
  name: 'decoder',

  data: () => ({
    videoInputs: [],
    stream: null,
    isScanning: false,
    fps: 5,
    scanInterval: null,
    result: '',
    error: '',

    debugViews: {},
  }),

  methods: {
    async listInputs() {
      const mediaDevices = navigator.mediaDevices;
      if(!mediaDevices) { return; }

      const devices = await mediaDevices.enumerateDevices();
      this.videoInputs = devices.filter(({ kind }) => kind === 'videoinput');
    },

    async startScan() {
      try {
        // this.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });

        const video = this.$refs.inputVideo;
        video.play();

        this.scanInterval && clearInterval(this.scanInterval);
        this.scanInterval = setInterval(
          () => this.detectCode(video), 
          (1000 / this.fps)
        );

        this.isScanning = true;
      } catch(e) {
        this.error = e.message;
      }
    },

    stopScan() {
      this.scanInterval && clearInterval(this.scanInterval);

      // this.stream.getTracks().forEach(track => track.stop());

      this.$refs.inputVideo.pause();

      this.isScanning = false;
    },

    async detectCode(video) {
      const canvas = this.$refs.viewfinder;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      const viewFinder = this.computeScanArea({ width: canvas.width, height: canvas.height });
      const scanArea = canvas.getContext('2d').getImageData(viewFinder.topCorner.x, viewFinder.topCorner.y, viewFinder.width, viewFinder.height);

      const context = canvas.getContext('2d');
      context.beginPath();
      context.lineWidth = "5";
      context.strokeStyle = "#009fff";
      context.rect(viewFinder.topCorner.x, viewFinder.topCorner.y, viewFinder.width, viewFinder.height);
      context.stroke();

      const image = this.imageDataToBase64(scanArea);

      try {
        const result = await decodeV2(image, (id, content) => this.drawDebug(id, content));

        this.result = result;
      } catch(e) {
        this.error = e.message;
      }
    },

    computeScanArea({ width, height }) {
      const scanAreaWidth = Math.min(width, height);
      const topCornerX = width === scanAreaWidth ? 0 : ((width - scanAreaWidth) / 2);
      const topCornerY = height === scanAreaWidth ? 0 : ((height - scanAreaWidth) / 2);

      return { width: scanAreaWidth, height: scanAreaWidth, topCorner: { x: topCornerX, y: topCornerY } };
    },

    imageDataToBase64(imagedata) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imagedata.width;
      canvas.height = imagedata.height;
      ctx.putImageData(imagedata, 0, 0);

      return canvas.toDataURL();
    },

    drawDebug(id, content) {
      let canvas;
      if(this.debugViews[id]) {
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

      let ratio  = Math.min(canvas.width / content.width, canvas.height / content.height);
      let x = (canvas.width - content.width * ratio) / 2;
      let y = (canvas.height - content.height * ratio) / 2;

      var image = new Image();
      
      image.onload = function() {
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

      image.src = content.data;
    }
  }
}
</script>
