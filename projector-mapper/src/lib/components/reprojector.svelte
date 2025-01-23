<!-- <script lang="ts">
  import { onMount } from 'svelte';
  import {  } from 'mathjs';

  let video: HTMLVideoElement;
  let outputCanvas: HTMLCanvasElement;
  let status: HTMLDivElement;
  let { inputCanvas, ...rest} : { inputCanvas: HTMLCanvasElement} = $props()

  async function processImage(statusDiv:HTMLDivElement, inputWidth:number,inputHeight:number) {
  statusDiv.textContent = "Looking for AprilTags...";
  const points:any[] = [];
  let attempts = 0;
  const maxAttempts = 30;

  while (Object.keys(points).length < 4 && attempts < maxAttempts) {
      const detections = await process_frame(inputCanvas, video, outputCanvas, outputData);
      console.log(`Attempt ${attempts + 1}: Found ${detections?.length || 0} detections`);
      
      if (detections && detections.length > 0) {
          detections.forEach(detection => {
              // const id = detection.id.toString().padStart(2, '0');
              console.log(`Processing detection with ID: ${detection.id}`);
              // if (['00', '01', '10', '11'].includes(id)) {
                  points[detection.id] = detection
                  // };
              
          });
      }
      
      console.log('Current points:', points);
      statusDiv.textContent = `Found ${Object.keys(points).length} of 4 AprilTags... (Attempt ${attempts + 1})`;
      attempts++;

      // Increase delay to 500ms to ensure stable detections
      await new Promise(r => setTimeout(r, 500));
  }

  if (Object.keys(points).length < 4) {
      console.log('Final points collection:', points);
      statusDiv.textContent = `Could only detect ${Object.keys(points).length} AprilTags. Please try again.`;
      return;
  }

  statusDiv.textContent = "Processing image...";
  for (const id in points) {
      console.log(`Point ${id}:`, points[id]);
  }
  // Transform image
  const source = [
      // Python uses: points['00'] = (qr.rect.left + qr.rect.width, qr.rect.top)
      [points[2].center.x, points[2].center.y],          // bottom-left (ID 0)
      // Python uses: points['01'] = (qr.rect.left + qr.rect.width, qr.rect.top + qr.rect.height)
      [points[0].center.x, points[0].center.y],          // top-left (ID 1)
      // Python uses: points['11'] = (qr.rect.left, qr.rect.top + qr.rect.height)
      [points[1].center.x, points[1].center.y],          // top-right (ID 3)
      // Python uses: points['10'] = (qr.rect.left, qr.rect.top)
      [points[3].center.x, points[3].center.y]           // bottom-right (ID 2)
  ];
  const sourceScaled = source.map(point => [point[0] / inputWidth, point[1] / inputHeight]);
  
  // Target points in same order as Python:
  // [(0,1600), (0,0), (2400, 0), (2400,1600)]
  const target = [
    [0, inputHeight],                    // bottom-left
    [0, 0],                                      // top-left
    [inputWidth, 0],                     // top-right
    [inputWidth, inputHeight]    // bottom-right
]; 
   const targetScaled = [
  [0, 1],                    // bottom-left
  [0, 0],                                      // top-left
  [1, 0],                     // top-right
  [1, 1]    // bottom-right
];

  try {
      statusDiv.textContent = "Processing complete! Click the link to download your SVG.";
  } catch (err) {
      console.error("Error processing image:", err);
      statusDiv.textContent = "Error processing image. Please try again.";
  }
}

async function processLoop() {
  await processImage(status, inputCanvas.width, inputCanvas.height);
  setTimeout(processLoop, 1000);
}

  onMount(() => {
    console.log('onMount');
    processLoop();
  });
</script>
<canvas bind:this={outputCanvas} id="output_canvas"></canvas>
<div bind:this={status} id="status"></div> -->