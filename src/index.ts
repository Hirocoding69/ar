import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

const targetImage1 = new URL("../assets/two-targets/500.zpt", import.meta.url)
  .href;
const targetImage2 = new URL("../assets/two-targets/500_1.zpt", import.meta.url)
  .href;
const videoUrl = new URL("../assets/video/vid.mp4", import.meta.url).href;

// ----------------------------------
// Renderer
// ----------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
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
let trackingReady = false; // 🔒 prevents first-frame autoplay

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

  // 🔒 Ignore first frame (Zappar init frame)
  if (!trackingReady) {
    trackingReady = true;
    renderer.render(scene, camera);
    return;
  }

  const tracker1Active = trackerGroup1.visible;
  const tracker2Active = trackerGroup2.visible;

  if (tracker1Active) {
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
  } else if (tracker2Active) {
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
