<!-- <script lang="ts">
  import { onMount } from 'svelte';
  import {  } from 'mathjs';
  import { init } from '$lib/apriltagging';

  let video: HTMLVideoElement;
  let tagCanvas: HTMLCanvasElement;
  let status: HTMLDivElement;
  let outputData: HTMLTextAreaElement;

  async function initCamera(video:HTMLVideoElement, statusDiv:HTMLDivElement) {
  try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
      });
      video.srcObject = stream;
      await video.play(); // Ensure video is playing
      statusDiv.textContent = "Webcam initialized";
      console.log("Webcam initialized");
      return true;
  } catch (err) {
      console.error("Error accessing webcam:", err);
      statusDiv.textContent = "Error accessing webcam";
      return false;
  }
}

  onMount(() => {
    console.log('onMount');
    init(inputCanvas, video, outputCanvas, outputData);
    initCamera(video, status);
  });

</script>

<h1>Welcome to SvelteKitt</h1>
-->
<!-- svelte-ignore a11y_media_has_caption -->
<!-- <video bind:this={video} id="webcam_canvas" playsinline autoplay></video>
<canvas bind:this={tagCanvas} id="input_canvas"></canvas>

<style>
  canvas {
    border: 1px solid black;
  }
.hidden {
  display: none;
}

textarea {
  resize: none;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
}
video {
  background: #222;
  margin: 0 0 20px 0;
  --width: 100%;
  width: var(--width);
  height: calc(var(--width) * 0.75);
}

#input_canvas, #output_canvas {
  max-width: 100%;
  margin: 10px;
  border: 1px solid #ccc;
}
/* Style for all canvases */
canvas {
    width: 100%;
    height: auto;
    background-color: #ccc;
    border: 1px solid #ccc;
    margin: 0;  /* Remove margin since we're using grid gap */
}

/* Hide video element but keep it in flow */
/* #webcam_canvas {
    display: none;
} */

</style>  -->