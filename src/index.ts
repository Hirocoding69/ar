import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

const targetImage1 = new URL(
  "../assets/two-targets/target1.zpt",
  import.meta.url
).href;
const targetImage2 = new URL(
  "../assets/two-targets/target2.zpt",
  import.meta.url
).href;
// Single video that will play on both trackers
const videoUrl = new URL("../assets/video/vid.mp4", import.meta.url).href;
// ZapparThree provides a LoadingManager that shows a progress bar while
// the assets are downloaded
const manager = new ZapparThree.LoadingManager();

// Setup ThreeJS in the usual way
const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Setup a Zappar camera instead of one of ThreeJS's cameras
const camera = new ZapparThree.Camera();

// The Zappar library needs your WebGL context, so pass it
ZapparThree.glContextSet(renderer.getContext());

// Create a ThreeJS Scene and set its background to be the camera background texture
const scene = new THREE.Scene();
scene.background = camera.backgroundTexture;

// Camera permission is handled after video setup

// Set up our image tracker groups
// Pass our loading manager in to ensure the progress bar works correctly
const tracker1 = new ZapparThree.ImageTrackerLoader(manager).load(targetImage1);
const tracker2 = new ZapparThree.ImageTrackerLoader(manager).load(targetImage2);

const trackerGroup1 = new ZapparThree.ImageAnchorGroup(camera, tracker1);
const trackerGroup2 = new ZapparThree.ImageAnchorGroup(camera, tracker2);
scene.add(trackerGroup1);
scene.add(trackerGroup2);

// Create single video element (shared by both trackers)
const videoElement = document.createElement("video");
videoElement.src = videoUrl;
videoElement.loop = true;
videoElement.muted = true;
videoElement.playsInline = true;
videoElement.setAttribute("playsinline", "");
videoElement.setAttribute("webkit-playsinline", "");
videoElement.crossOrigin = "anonymous";

// Create single video texture (shared by both planes)
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

// Create video planes with shared material
const planeWidth = 1.0;
const planeHeight = 0.75; // Adjust based on your video aspect ratio
const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
const planeMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

// Both planes use the same material/texture (shared instance)
const videoPlane1 = new THREE.Mesh(planeGeometry, planeMaterial);
const videoPlane2 = new THREE.Mesh(planeGeometry, planeMaterial);

// Position the planes above the tracked images
videoPlane1.position.set(0, 0.1, 0);
videoPlane1.rotation.x = -Math.PI / 2; // Lay flat on top

videoPlane2.position.set(0, 0.1, 0);
videoPlane2.rotation.x = -Math.PI / 2; // Lay flat on top

trackerGroup1.add(videoPlane1);
trackerGroup2.add(videoPlane2);

// Start video playback when camera is ready
ZapparThree.permissionRequestUI().then((granted) => {
  if (granted) {
    camera.start();
    // Start video playback (single video for both trackers)
    videoElement.play().catch((error) => {
      console.error("Error playing video:", error);
    });
  } else {
    ZapparThree.permissionDeniedUI();
  }
});

// Set up our render loop
function render() {
  requestAnimationFrame(render);
  camera.updateFrame(renderer);

  renderer.render(scene, camera);
}

requestAnimationFrame(render);
