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
    const sourceScaled = source.map(point => [point[0] / inputCanvas.width, point[1] / inputCanvas.height]);
    
    // Target points in same order as Python:
    // [(0,1600), (0,0), (2400, 0), (2400,1600)]
    const target = [
      [0, inputCanvas.height],                    // bottom-left
      [0, 0],                                      // top-left
      [inputCanvas.width, 0],                     // top-right
      [inputCanvas.width, inputCanvas.height]    // bottom-right
  ]; 
     const targetScaled = [
    [0, 1],                    // bottom-left
    [0, 0],                                      // top-left
    [1, 0],                     // top-right
    [1, 1]    // bottom-right
];

    try {
        const coeffs = findCoeffs(sourceScaled, targetScaled);
        // const coeffs = findCoeffs( targetScaled,sourceScaled);
        // const coeffs = findCoeffs(target,sourceScaled );
        console.log("Source points:", source);
        console.log("Target points:", target);
        console.log("Transform coefficients:", coeffs);
        
        outputCanvas.width = video.videoWidth;
        outputCanvas.height = video.videoHeight;
        // Clear the output canvas
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        
        outputCtx.drawImage(inputCanvas, 0, 0);
        
        // Apply perspective transform
        outputCtx.save();
        

        // Calculate scale factors
        const scaleX = outputCanvas.width / inputCanvas.width;        
        const scaleY = outputCanvas.height / inputCanvas.height;

        
        // Apply transform with scaling compensation
        const transformMatrix = [
            coeffs[0]  , coeffs[3] ,
            coeffs[1] , coeffs[4] ,
            coeffs[2], coeffs[5]
        ];
        
        // Add translation to move to top left source point
        outputCtx.translate(source[1][0] , source[1][1] );
        outputCtx.transform(...transformMatrix);
        

        // Enable better scaling quality
        outputCtx.imageSmoothingEnabled = true;
        outputCtx.imageSmoothingQuality = 'high';
        
        outputCtx.drawImage(inputCanvas, 0, 0);
        outputCtx.drawImage(inputCanvas);
        outputCtx.restore();

        // // Threshold the image
        // const imageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        // for (let i = 0; i < imageData.data.length; i += 4) {
        //     const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
        //     const threshold = brightness > 120 ? 255 : 0;
        //     imageData.data[i] = threshold;
        //     imageData.data[i + 1] = threshold;
        //     imageData.data[i + 2] = threshold;
        //     imageData.data[i + 3] = 255; // Alpha channel
        // }
        // outputCtx.putImageData(imageData, 0, 0);

        // // Convert to SVG using Potrace
        // const svg = Potrace.fromCanvas(outputCanvas).toSVG();
        
        // // Enable download
        // downloadLink.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        // downloadLink.download = 'traced_drawing.svg';
        // downloadLink.style.display = 'block';
        
        statusDiv.textContent = "Processing complete! Click the link to download your SVG.";
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