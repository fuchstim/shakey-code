
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>


<template>
  <div id="app">

    Please select a video input:
    <button v-for="(input, index) in videoInputs" :key="index" @click="() => setVideoInput(input.deviceId)">
      {{input.label}}
    </button>
    <button @click="() => stopVideoInput()">
      Stop
    </button>

    <canvas ref="viewfinder" style="width: 640px; height: 480px" />

    <canvas ref="scanArea" />

  </div>
</template>

<script>
import { decode } from './scanner';
export default {
  name: 'shakey-demo',

  data: () => ({
    videoInputs: [],
    fps: 10,
    interval: null,
  }),

  async mounted() {
    if(!navigator.mediaDevices) {
      this.videoInputs = [];
      console.error('no media devices found.')
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(({ kind }) => kind === 'videoinput');

    this.videoInputs = videoInputs;
  },

  methods: {
    setVideoInput(deviceId) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId } })
        .then(stream => {
          const track = stream.getVideoTracks()[0];

          const imageCapture = new ImageCapture(track);

          this.interval && clearInterval(this.interval);
          this.interval = setInterval(() => { this.detectCode(imageCapture); }, 1000 / this.fps)
        })
        .catch(error => {
          console.error(error)
        });
    },

    stopVideoInput() {
      this.interval && clearInterval(this.interval);
    },

    detectCode(imageCapture) {
      imageCapture.grabFrame()
        .then(async img => {
          const canvas = this.$refs.viewfinder;

          canvas.width = getComputedStyle(canvas).width.split('px')[0];
          canvas.height = getComputedStyle(canvas).height.split('px')[0];

          let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
          let x = (canvas.width - img.width * ratio) / 2;
          let y = (canvas.height - img.height * ratio) / 2;

          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
              x, y, img.width * ratio, img.height * ratio);

          const viewFinder = this.computeScanArea({ width: canvas.width, height: canvas.height });
          const scanArea = canvas.getContext('2d').getImageData(viewFinder.topCorner.x, viewFinder.topCorner.y, viewFinder.width, viewFinder.height);

          const context = canvas.getContext('2d');
          context.beginPath();
          context.lineWidth = "5";
          context.strokeStyle = "#009fff";
          context.rect(viewFinder.topCorner.x, viewFinder.topCorner.y, viewFinder.width, viewFinder.height);
          context.stroke();

          const image = this.imageDataToBase64(scanArea)

          try {
            const result = await decode(image);

            console.log(result);
          } catch(e) {
            console.error(e.message)
          }
        });
    },

    computeScanArea({ width, height }) {
      const scanAreaWidth = Math.floor(width / 4);
      const topCornerX = Math.floor((width / 2) - (scanAreaWidth / 2));
      const topCornerY = Math.floor((height / 2) - (scanAreaWidth / 2));

      return { width: scanAreaWidth, height: scanAreaWidth, topCorner: { x: topCornerX, y: topCornerY } };
    },

    imageDataToBase64(imagedata) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = imagedata.width;
      canvas.height = imagedata.height;
      ctx.putImageData(imagedata, 0, 0);

      return canvas.toDataURL();
    }
  }
};
</script>
