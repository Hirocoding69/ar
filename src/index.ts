import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

const targetImage1 = new URL("https://sambo-test-dev.s3.ap-southeast-1.amazonaws.com/500.zpt", import.meta.url)
  .href;
const targetImage2 = new URL("https://sambo-test-dev.s3.ap-southeast-1.amazonaws.com/500_1.zpt", import.meta.url)
  .href;
const videoUrl = new URL("https://sambo-test-dev.s3.ap-southeast-1.amazonaws.com/vid.mp4", import.meta.url).href;

// ----------------------------------
// Renderer
// ----------------------------------
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
document.body.appendChild(renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----------------------------------
// Camera & Scene
// ----------------------------------
const camera = new ZapparThree.Camera();
ZapparThree.glContextSet(renderer.getContext());

const scene = new THREE.Scene();
scene.background = camera.backgroundTexture;

// ----------------------------------
// Trackers
// ----------------------------------
const manager = new ZapparThree.LoadingManager();

const tracker1 = new ZapparThree.ImageTrackerLoader(manager).load(targetImage1);
const tracker2 = new ZapparThree.ImageTrackerLoader(manager).load(targetImage2);

const trackerGroup1 = new ZapparThree.ImageAnchorGroup(camera, tracker1);
const trackerGroup2 = new ZapparThree.ImageAnchorGroup(camera, tracker2);

scene.add(trackerGroup1);
scene.add(trackerGroup2);

// ----------------------------------
// Video
// ----------------------------------
const videoElement = document.createElement("video");
videoElement.src = videoUrl;
videoElement.loop = true;
videoElement.playsInline = true;
videoElement.setAttribute("playsinline", "");
videoElement.setAttribute("webkit-playsinline", "");
videoElement.crossOrigin = "anonymous";
videoElement.autoplay = false;
videoElement.muted = false;
videoElement.preload = "metadata";
videoElement.removeAttribute("autoplay");
videoElement.load();
videoElement.pause();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

// ----------------------------------
// Video Plane
// ----------------------------------
const planeGeometry = new THREE.PlaneGeometry(4, 2);
const planeMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

const videoPlane = new THREE.Mesh(planeGeometry, planeMaterial);
videoPlane.visible = false;

// ----------------------------------
// State
// ----------------------------------
let currentTrackerGroup: ZapparThree.ImageAnchorGroup | null = null;
let trackingReady = false;
let hasSeenFirstTarget = false;
let activeAnchors = new Set<ZapparThree.ImageAnchor>();

// ----------------------------------
// Tracking Events
// ----------------------------------
tracker1.onVisible.bind((anchor) => {
  console.log("Tracker 1: Image detected!");
  activeAnchors.add(anchor);
  // alert("Image tracked and recognized! (Target 1)");
});

tracker1.onNotVisible.bind((anchor) => {
  console.log("Tracker 1: Tracking lost!");
  activeAnchors.delete(anchor);
  if (activeAnchors.size === 0) {
    // alert("Tracking lost!");
  }
});

tracker2.onVisible.bind((anchor) => {
  console.log("Tracker 2: Image detected!");
  activeAnchors.add(anchor);
  // alert("Image tracked and recognized! (Target 2)");
});

tracker2.onNotVisible.bind((anchor) => {
  console.log("Tracker 2: Tracking lost!");
  activeAnchors.delete(anchor);
  if (activeAnchors.size === 0) {
    // alert("Tracking lost!");
  }
});

// ----------------------------------
// Recording State
// ----------------------------------
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let isRecording: boolean = false;

// ----------------------------------
// UI Controls
// ----------------------------------
const recordButton = document.createElement("button");
recordButton.textContent = "⏺ Record";
recordButton.style.cssText = `
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 30px;
  font-size: 18px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  z-index: 1000;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
`;
document.body.appendChild(recordButton);

const recordingIndicator = document.createElement("div");
recordingIndicator.style.cssText = `
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: rgba(255, 68, 68, 0.9);
  color: white;
  border-radius: 20px;
  font-weight: bold;
  display: none;
  z-index: 1000;
  animation: pulse 1.5s infinite;
`;
recordingIndicator.textContent = "● RECORDING";
document.body.appendChild(recordingIndicator);

// Add pulse animation
const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

// ----------------------------------
// Recording Functions
// ----------------------------------
function startRecording() {
  recordedChunks = [];

  const canvas = renderer.domElement;
  const stream = canvas.captureStream(30); // 30 FPS

  // Add audio from the AR video if it's playing
  if (!videoElement.paused && !videoElement.muted) {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(videoElement);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);

      destination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track);
      });
    } catch (err) {
      console.warn("Could not capture audio:", err);
    }
  }

  const options = {
    mimeType: "video/webm;codecs=vp9",
    videoBitsPerSecond: 2500000,
  };

  // Fallback for iOS/Safari
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options.mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/mp4";
    }
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `ar-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    };

    mediaRecorder.start();
    isRecording = true;

    recordButton.textContent = "⏹ Stop";
    recordButton.style.background = "#444";
    recordingIndicator.style.display = "block";
  } catch (err) {
    console.error("Error starting recording:", err);
    alert("Recording not supported on this device");
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;

    recordButton.textContent = "⏺ Record";
    recordButton.style.background = "#ff4444";
    recordingIndicator.style.display = "none";
  }
}

recordButton.addEventListener("click", () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

// ----------------------------------
// Permissions
// ----------------------------------
ZapparThree.permissionRequestUI().then((granted) => {
  if (granted) {
    camera.start();
  } else {
    ZapparThree.permissionDeniedUI();
  }
});

// ----------------------------------
// Render Loop
// ----------------------------------
function render() {
  requestAnimationFrame(render);

  camera.updateFrame(renderer);

  if (!trackingReady) {
    trackingReady = true;
    renderer.render(scene, camera);
    return;
  }

  const tracker1Active = tracker1.anchors.size > 0;
  const tracker2Active = tracker2.anchors.size > 0;

  if (tracker1Active || tracker2Active) {
    hasSeenFirstTarget = true;
  }

  if (tracker1Active && hasSeenFirstTarget) {
    tracker2.enabled = false;

    if (currentTrackerGroup !== trackerGroup1) {
      if (currentTrackerGroup) currentTrackerGroup.remove(videoPlane);
      trackerGroup1.add(videoPlane);
      currentTrackerGroup = trackerGroup1;
    }

    videoPlane.visible = true;

    if (videoElement.paused) {
      videoElement.play().catch(console.error);
    }
  } else if (tracker2Active && hasSeenFirstTarget) {
    tracker1.enabled = false;

    if (currentTrackerGroup !== trackerGroup2) {
      if (currentTrackerGroup) currentTrackerGroup.remove(videoPlane);
      trackerGroup2.add(videoPlane);
      currentTrackerGroup = trackerGroup2;
    }

    videoPlane.visible = true;

    if (videoElement.paused) {
      videoElement.play().catch(console.error);
    }
  } else {
    if (!videoElement.paused) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }

    tracker1.enabled = true;
    tracker2.enabled = true;

    if (currentTrackerGroup) {
      currentTrackerGroup.remove(videoPlane);
      currentTrackerGroup = null;
    }

    videoPlane.visible = false;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(render);
