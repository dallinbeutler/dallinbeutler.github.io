<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  import * as THREE from 'three'
  import { initCamera } from '$lib/video'
  import { onMount } from 'svelte';
  import { initDetection } from '$lib/apriltagging';

  let video: HTMLVideoElement;
  let canvas1: HTMLCanvasElement;
  let canvas2: HTMLCanvasElement;
  let data: HTMLTextAreaElement;

  onMount(async () => {
    console.log(video);
    await initCamera(video);
    initDetection(video, canvas1, canvas2,data);
  });

</script>
<!-- svelte-ignore a11y_media_has_caption -->
<video bind:this={video}  playsinline autoplay hidden class="fs"></video>
<canvas bind:this={canvas1} class="fs canvas1"></canvas>
<canvas bind:this={canvas2} class="fs canvas2"></canvas>
<Canvas >
  <Scene/>
</Canvas>
<textarea bind:value={data} class="foot"></textarea>
<style>
.fs{
  position: absolute;
    top: 0;
    left: 0;
    /* width: 100%; */
    /* height: 100%; */
  background: #222;
  --width: 100%;
    width: var(--width);
    height: calc(var(--width) * 0.75);
}

  .hidden {
  display: none;
}
  .fullscreen {
    position: absolute;
    top: 0;
    left: 0;
    /* width: 100%; */
    /* height: 100%; */
  }
  canvas {
    position: absolute;
    width: 100%;
    height: auto;
    background-color: #ccc;
    border: 1px solid #ccc;
    margin: 0;  /* Remove margin since we're using grid gap */
  }
  .canvas1 {
    background-color: red;
    opacity: 0.5;
    visibility: hidden;
  }
  .canvas2 {
    background-color: blue;
    opacity: 0.5;
  }
  .foot{
    bottom: 0;
    left: 0;
    width: 100%;
  }
</style>
