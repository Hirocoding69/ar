import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

// ============================================
// CONFIGURATION - REPLACE THESE VALUES
// ============================================
// Replace VIDEO_URL_HERE with your video URL (must be HTTPS)
const VIDEO_URL = "./assets/vid.mp4";

// Replace TARGET_FILE_HERE with your .zpt file path
const TARGET_FILE = "./assets/500.zpt";
// ============================================

// Get DOM elements
const canvas = document.getElementById("canvas");
const loading = document.getElementById("loading");
const container = document.getElementById("ar-container");

// Scene setup
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Configure WebGL context for Zappar
ZapparThree.glContextSet(renderer.getContext());

// Zappar camera (v2.0.1 API)
const camera = new ZapparThree.Camera();

// Set scene background to camera feed
scene.background = camera.backgroundTexture;

// Image tracker (v2.0.1 API)
const imageTracker = new ZapparThree.ImageTrackerLoader().load(
  TARGET_FILE,
  () => {
    loading.classList.remove("active");
  },
  (error) => {
    console.error("Error loading tracker target:", error);
    loading.textContent = "Error loading tracker. Check console.";
  }
);

// Create anchor group for the tracker
const trackerGroup = new ZapparThree.ImageAnchorGroup(camera, imageTracker);
scene.add(trackerGroup);

// Video element for texture
const videoElement = document.createElement("video");
videoElement.src = VIDEO_URL;
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.setAttribute("playsinline", "");
videoElement.setAttribute("webkit-playsinline", "");
videoElement.crossOrigin = "anonymous";

// Video texture using Three.js VideoTexture
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

// Create plane geometry for video
// Adjust size as needed (width, height)
const planeWidth = 1.0;
const planeHeight = 0.75; // 4:3 aspect ratio (adjust based on your video)
const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
const planeMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  transparent: true,
  side: THREE.DoubleSide,
});
const videoPlane = new THREE.Mesh(planeGeometry, planeMaterial);

// Position the plane above the tracked image
// Adjust y position to set height above the image (positive Y = up)
videoPlane.position.set(0, 0.1, 0); // Slightly above the tracked image
videoPlane.rotation.x = -Math.PI / 2; // Rotate to lay flat on top

// Add plane to tracker group (v2.0.1 API)
trackerGroup.add(videoPlane);

// Start camera and video immediately (v2.0.1 API)
ZapparThree.permissionRequestUI()
  .then((granted) => {
    if (granted) {
      camera.start();
      // Start video playback
      videoElement
        .play()
        .then(() => {
          loading.style.display = "none";
        })
        .catch((error) => {
          console.error("Error playing video:", error);
        });
    } else {
      ZapparThree.permissionDeniedUI();
      loading.textContent = "Camera permission denied.";
    }
  })
  .catch((error) => {
    console.error("Error requesting camera permission:", error);
    loading.textContent = "Failed to start camera. Please grant permissions.";
  });

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update Zappar camera
  camera.updateFrame(renderer);

  // Video texture updates automatically when video plays

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation loop
animate();
