// import * as Comlink from "./comlink.mjs";
import * as Comlink from "comlink";
import * as Base64 from "./base64.js";
import * as LZString from "lz-string";
import type { AprilTagInstance, AprilTagConstructor, AprilTagDetection } from './apriltag';

let apriltag: AprilTagInstance;

export async function initDetection(
    video: HTMLVideoElement
  , inputCanvas: HTMLCanvasElement
  , outputCanvas: HTMLCanvasElement
  , outputData?: HTMLTextAreaElement
) {
  
  // WebWorkers use `postMessage` and therefore work with Comlink.
  const Apriltag = Comlink.wrap<AprilTagConstructor>(
    new Worker(new URL('./apriltag.js', import.meta.url))
  );
    
  // Remove 'new' - just call Apriltag as a function
  apriltag = await new Apriltag(Comlink.proxy(() => {
    // set camera info; we must define these according to the device and image resolution for pose computation
    // apriltag.set_camera_info(fx: number, fy: number, cx: number, cy: number)
    console.log("initDetection");
    apriltag.set_tag_size(5, 0.5);
    requestAnimationFrame(() => process_frame( video, inputCanvas, outputCanvas, outputData));
  }));
}



export async function process_frame(
  video: HTMLVideoElement
  , step1: HTMLCanvasElement
  , step2: HTMLCanvasElement
  , outputData?: HTMLTextAreaElement
) {
  console.log("process_frame");
  step1.width = video.videoWidth;
  step1.height = video.videoHeight;
  let ctx = step1.getContext("2d");
  if (!ctx || !video ) {
    console.error("Failed to get canvas context");
    return;
  }
  let imageData;
  try {
    ctx.drawImage(video, 0, 0, step1.width, step1.height);
    imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  } catch (err) {
    console.log("Failed to get video frame. Video not started ?");
    setTimeout(process_frame, 200);
    return;
  }
  
  let imageDataPixels = imageData.data;
  let grayscalePixels = new Uint8Array(ctx.canvas.width * ctx.canvas.height);
  
  // Process 4 pixels at a time
  const length = imageDataPixels.length;
  for (let i = 0; i < length; i += 16) {
    // Unrolled loop for 4 pixels at once
    for (let k = 0; k < 16; k += 4) {
      const gray = ((imageDataPixels[i + k] * 19595 + 
                    imageDataPixels[i + k + 1] * 38469 + 
                    imageDataPixels[i + k + 2] * 7472) >> 16);
      
      grayscalePixels[i >> 2 | (k >> 2)] = gray;
      imageDataPixels[i + k] = gray;
      imageDataPixels[i + k + 1] = gray;
      imageDataPixels[i + k + 2] = gray;
    }
  }
  
  // ctx.putImageData(imageData, 0, 0);
  // detect aprilTag in the grayscale image given by grayscalePixels
  const detections = await apriltag.detect(grayscalePixels, ctx.canvas.width, ctx.canvas.height);
  drawDetections(detections, ctx);

  if (detections.length > 0) {
      let savep = Base64.bytesToBase64(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data);
      var det = JSON.stringify({
        det_data: detections,
        // det_data: detections[0],
        img_data: LZString.compressToUTF16(savep),
        img_width:  ctx.canvas.width,
        img_height: ctx.canvas.height
      });

      //console.log("Saving detection data.");
      localStorage.setItem("detectData", det);

      loadImg(step2, outputData);

  }

  requestAnimationFrame(() => process_frame(video, step1, step2, outputData));
  
  drawDetections(detections, ctx);

  return detections;
}



async function drawDetections(
  detections: AprilTagDetection[],
  ctx: CanvasRenderingContext2D
) {

  detections.forEach((det:any) => {
    // draw tag borders
    ctx.beginPath()
    ctx.lineWidth = 5
    ctx.strokeStyle = "blue"
    ctx.moveTo(det.corners[0].x, det.corners[0].y)
    ctx.lineTo(det.corners[1].x, det.corners[1].y)
    ctx.lineTo(det.corners[2].x, det.corners[2].y)
    ctx.lineTo(det.corners[3].x, det.corners[3].y)
    ctx.lineTo(det.corners[0].x, det.corners[0].y)
    ctx.font = "bold 20px Arial"
    var txt = ""+det.id
    ctx.fillStyle = "blue"
    ctx.textAlign = "center"
    ctx.fillText(txt, det.center.x, det.center.y+5)
    ctx.stroke()
  });
}

async function loadImg(canvas:HTMLCanvasElement, databox?:HTMLTextAreaElement) {
  var detectData = localStorage.getItem('detectData');
  if (detectData) {
     let detectDataObj = JSON.parse(detectData);
     let savedPixels = Base64.base64ToBytes(LZString.decompressFromUTF16(detectDataObj.img_data));
     delete detectDataObj.img_data;

     
     let ctx = canvas.getContext("2d");
     if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }
     canvas.width = detectDataObj.img_width;
     canvas.height = detectDataObj.img_height;
     let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     imageData.data.set(savedPixels);
     ctx.putImageData(imageData, 0, 0);

     //console.log(detectDataObj.det_data);
     if (databox) {
      databox.value=JSON.stringify(detectDataObj, null, 2);
     }
  } else console.log("detectData not found");
}
