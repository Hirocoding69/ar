import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

const targetImage1 = new URL("../assets/two-targets/500.zpt", import.meta.url)
  .href;
const targetImage2 = new URL("../assets/two-targets/500_1.zpt", import.meta.url)
  .href;
const videoUrl = new URL("../assets/video/vid.mp4", import.meta.url).href;

const manager = new ZapparThree.LoadingManager();

const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const camera = new ZapparThree.Camera();

ZapparThree.glContextSet(renderer.getContext());

const scene = new THREE.Scene();
scene.background = camera.backgroundTexture;

const tracker1 = new ZapparThree.ImageTrackerLoader(manager).load(targetImage1);
const tracker2 = new ZapparThree.ImageTrackerLoader(manager).load(targetImage2);

const trackerGroup1 = new ZapparThree.ImageAnchorGroup(camera, tracker1);
const trackerGroup2 = new ZapparThree.ImageAnchorGroup(camera, tracker2);
scene.add(trackerGroup1);
scene.add(trackerGroup2);

const videoElement = document.createElement("video");
videoElement.src = videoUrl;
videoElement.loop = true;
videoElement.playsInline = true;
videoElement.setAttribute("playsinline", "");
videoElement.setAttribute("webkit-playsinline", "");
videoElement.crossOrigin = "anonymous";
videoElement.muted = true;
videoElement.pause();

const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

function createVideoPlane(material: THREE.MeshBasicMaterial) {
  const planeWidth = 4.0;
  const planeHeight = 2.0;

  const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const plane = new THREE.Mesh(planeGeometry, material);

  plane.position.set(0, 0, 0);

  return Promise.resolve(plane);
}

const planeMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

let videoPlane: THREE.Mesh | null = null;
let currentTrackerGroup: ZapparThree.ImageAnchorGroup | null = null;

createVideoPlane(planeMaterial).then((plane) => {
  videoPlane = plane;
  plane.visible = false;
});

ZapparThree.permissionRequestUI().then((granted) => {
  if (granted) {
    camera.start();
  } else {
    ZapparThree.permissionDeniedUI();
  }
});

function render() {
  requestAnimationFrame(render);
  camera.updateFrame(renderer);

  if (videoPlane) {
    const tracker1Visible = trackerGroup1.visible;
    const tracker2Visible = trackerGroup2.visible;

    if (tracker1Visible) {
      tracker2.enabled = false;

      if (currentTrackerGroup !== trackerGroup1) {
        if (currentTrackerGroup) {
          currentTrackerGroup.remove(videoPlane);
        }
        trackerGroup1.add(videoPlane);
        currentTrackerGroup = trackerGroup1;
      }

      if (videoPlane) {
        videoPlane.visible = true;
      }

      if (videoElement.paused) {
        videoElement.muted = false;
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    } else if (tracker2Visible) {
      tracker1.enabled = false;

      if (currentTrackerGroup !== trackerGroup2) {
        if (currentTrackerGroup) {
          currentTrackerGroup.remove(videoPlane);
        }
        trackerGroup2.add(videoPlane);
        currentTrackerGroup = trackerGroup2;
      }

      if (videoPlane) {
        videoPlane.visible = true;
      }

      if (videoElement.paused) {
        videoElement.muted = false;
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    } else {
      if (!videoElement.paused) {
        videoElement.pause();
        videoElement.muted = true;
      }

      tracker1.enabled = true;
      tracker2.enabled = true;

      if (currentTrackerGroup && videoPlane) {
        currentTrackerGroup.remove(videoPlane);
        currentTrackerGroup = null;
      }

      if (videoPlane) {
        videoPlane.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(render);
