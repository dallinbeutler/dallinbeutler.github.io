export async function initCamera(video:HTMLVideoElement) {
  let webcamReady = false;
    while (!webcamReady) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
      });
      video.srcObject = stream;
      await video.play(); // Ensure video is playing
      console.log("Webcam initialized");
      webcamReady = true;
    } catch (err) {
      console.error("Error accessing webcam:", err);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }

}