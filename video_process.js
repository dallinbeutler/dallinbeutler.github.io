// import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
import * as Comlink from "./comlink.mjs";
import * as Base64 from "./base64.js";
// var potrace = require('potrace');

var detections=[];
var imgSaveRequested=0;

const video = document.getElementById('webcam_canvas');
const inputCanvas = document.getElementById('input_canvas');
const outputCanvas = document.getElementById('output_canvas');
const statusDiv = document.getElementById('status');
const captureButton = document.getElementById('capture');
const downloadLink = document.getElementById('download_svg');

const inputCtx = inputCanvas.getContext('2d');
const outputCtx = outputCanvas.getContext('2d');

// Set up canvas sizes
// inputCanvas.width = 2400;
// inputCanvas.height = 1600;
outputCanvas.width = 2400;
outputCanvas.height = 1600;

window.onload = (event) => {
  init();

  loadImg('saved_det');
}

async function init() {
  // WebWorkers use `postMessage` and therefore work with Comlink.
  const Apriltag = Comlink.wrap(new Worker("apriltag.js"));

  // must call this to init apriltag detector; argument is a callback for when the detector is ready
  window.apriltag = await new Apriltag(Comlink.proxy(() => {

    // set camera info; we must define these according to the device and image resolution for pose computation
    //window.apriltag.set_camera_info(double fx, double fy, double cx, double cy)

    window.apriltag.set_tag_size(5, .5);

    // start processing frames
    window.requestAnimationFrame(process_frame);
  }));
}

async function process_frame() {

  inputCanvas.width = video.videoWidth;
  inputCanvas.height = video.videoHeight;
  let ctx = inputCanvas.getContext("2d");

  let imageData;
  try {
    // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height);
    imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  } catch (err) {
    console.log("Failed to get video frame. Video not started ?");
    setTimeout(process_frame, 200); // try again in 0.5 s
    return;
  }
  let imageDataPixels = imageData.data;
  let grayscalePixels = new Uint8Array(ctx.canvas.width * ctx.canvas.height); // this is the grayscale image we will pass to the detector

  for (var i = 0, j = 0; i < imageDataPixels.length; i += 4, j++) {
    let grayscale = Math.round((imageDataPixels[i] + imageDataPixels[i + 1] + imageDataPixels[i + 2]) / 3);
    grayscalePixels[j] = grayscale; // single grayscale value
    imageDataPixels[i] = grayscale;
    imageDataPixels[i + 1] = grayscale;
    imageDataPixels[i + 2] = grayscale;
  }
  ctx.putImageData(imageData, 0, 0);

  // draw previous detection
  detections.forEach(det => {
    // draw tag borders
    ctx.beginPath();
      ctx.lineWidth = "5";
      ctx.strokeStyle = "blue";
      ctx.moveTo(det.corners[0].x, det.corners[0].y);
      ctx.lineTo(det.corners[1].x, det.corners[1].y);
      ctx.lineTo(det.corners[2].x, det.corners[2].y);
      ctx.lineTo(det.corners[3].x, det.corners[3].y);
      ctx.lineTo(det.corners[0].x, det.corners[0].y);
      ctx.font = "bold 20px Arial";
      var txt = ""+det.id;
      ctx.fillStyle = "blue";
      ctx.textAlign = "center";
      ctx.fillText(txt, det.center.x, det.center.y+5);
    ctx.stroke();
  });

  // detect aprilTag in the grayscale image given by grayscalePixels
  detections = await apriltag.detect(grayscalePixels, ctx.canvas.width, ctx.canvas.height);

  if (imgSaveRequested && detections.length > 0) {
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
      buttonToggle();
      loadImg('saved_det');
  }

  window.requestAnimationFrame(process_frame);
  return detections;
}

async function loadImg(targetHtmlElemId) {
  var detectData = localStorage.getItem('detectData');
  if (detectData) {
     let detectDataObj = JSON.parse(detectData);
     let savedPixels = Base64.base64ToBytes(LZString.decompressFromUTF16(detectDataObj.img_data));
     delete detectDataObj.img_data;

     const canvasSaved = document.getElementById(targetHtmlElemId+"_canvas");
     let ctx = canvasSaved.getContext("2d");
     canvasSaved.width = detectDataObj.img_width;
     canvasSaved.height = detectDataObj.img_height;
     let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
     imageData.data.set(savedPixels);
     ctx.putImageData(imageData, 0, 0);

     //console.log(detectDataObj.det_data);
     let detDataSaved = document.getElementById(targetHtmlElemId+"_data");
     detDataSaved.value=JSON.stringify(detectDataObj, null, 2);
  } else console.log("detectData not found");
}

var button = document.getElementById('capture');
button.addEventListener('click', function() {
  buttonToggle();
  //console.log("setImgSaveRequested", imgSaveRequested);
});

function buttonToggle() {
  if (imgSaveRequested == 0) {
    button.innerHTML = "Saving next detection... (press to cancel)";
    imgSaveRequested = 1;
    button.className += " active";
  } else {
    button.innerHTML = "Save next detection (local storage)";
    imgSaveRequested = 0;
    button.className.replace(" active", "");
  }
}

// Initialize webcam
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        video.srcObject = stream;
        await video.play(); // Ensure video is playing
        return true;
    } catch (err) {
        console.error("Error accessing webcam:", err);
        statusDiv.textContent = "Error accessing webcam";
        return false;
    }
}

// Port of the Python perspective transform coefficient calculator
function findCoeffs(source, target) {
    const matrix = [];
    for (let i = 0; i < 4; i++) {
        const [x, y] = target[i];
        const [u, v] = source[i];
        matrix.push([x, y, 1, 0, 0, 0, -u*x, -u*y]);
        matrix.push([0, 0, 0, x, y, 1, -v*x, -v*y]);
    }
    
    const A = math.matrix(matrix);
    const B = math.flatten(source);
    
    const AT = math.transpose(A);
    const ATA = math.multiply(AT, A);
    const ATAinv = math.inv(ATA);
    const ATB = math.multiply(AT, B);
    
    return math.flatten(math.multiply(ATAinv, ATB))._data;
}

// Process frame and detect QR codes
// function processFrame() {
//     if (video.readyState === video.HAVE_ENOUGH_DATA) {
//         inputCtx.drawImage(video, 0, 0);
//         const imageData = inputCtx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
        
//         const code = jsQR(imageData.data, imageData.width, imageData.height);
//         if (code) {
//             return code;
//         }
//     }
//     return null;
// }

// Main processing function
async function processImage() {
    statusDiv.textContent = "Looking for AprilTags...";
    const points = {};
    let attempts = 0;
    const maxAttempts = 30;

    while (Object.keys(points).length < 4 && attempts < maxAttempts) {
        const detections = await process_frame();
        if (detections && detections.length > 0) {
            detections.forEach(detection => {
                points[detection.id] = detection;
            });
        }
        
        statusDiv.textContent = `Found ${Object.keys(points).length} of 4 AprilTags... (Attempt ${attempts + 1})`;
        attempts++;
        await new Promise(r => setTimeout(r, 500));
    }

    if (Object.keys(points).length < 4) {
        statusDiv.textContent = `Could only detect ${Object.keys(points).length} AprilTags. Please try again.`;
        return;
    }

    statusDiv.textContent = "Processing image...";
    
    try {
        // Define source points from AprilTag centers (normalized)
        const source = [
            [points[0].center.x / inputCanvas.width, points[0].center.y / inputCanvas.height], // top-left
            [points[1].center.x / inputCanvas.width, points[1].center.y / inputCanvas.height], // top-right
            [points[2].center.x / inputCanvas.width, points[2].center.y / inputCanvas.height], // bottom-left
            [points[3].center.x / inputCanvas.width, points[3].center.y / inputCanvas.height]  // bottom-right
        ];

        // Define target points (normalized)
        const target = [
            [0, 0],     // top-left
            [1, 0],     // top-right
            [0, 1],     // bottom-left
            [1, 1]      // bottom-right
        ];

        const coeffs = findCoeffs(source, target);
        
        // Set output canvas size
        outputCanvas.width = inputCanvas.width;
        outputCanvas.height = inputCanvas.height;
        
        // Clear and prepare output canvas
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        // Apply transform
        outputCtx.save();
        //outputCtx.drawImage(inputCanvas, 0, 0);
        // Scale to full canvas size
        outputCtx.scale(outputCanvas.width, outputCanvas.height);
        
        const matrix = [
          coeffs[0], coeffs[1], coeffs[2],
          coeffs[3], coeffs[4], coeffs[5],
          coeffs[6], coeffs[7], 1
        ];
        
        outputCtx.setTransform(
          matrix[0], matrix[3],
          matrix[1], matrix[4],
          matrix[2], matrix[5]
        );
        
        // Draw the transformed image
        outputCtx.drawImage(inputCanvas,0,0,outputCanvas.width, outputCanvas.height);
        outputCtx.restore();
        
        statusDiv.textContent = "Processing complete!";
    } catch (err) {
        console.error("Error processing image:", err);
        statusDiv.textContent = "Error processing image. Please try again.";
    }
}

// Event listeners
captureButton.addEventListener('click', processImage);

async function processLoop() {
  await processImage();
  setTimeout(processLoop, 1000);
}

// Initialize camera on load
window.addEventListener('load', initCamera);
processLoop();