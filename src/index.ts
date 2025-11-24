import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

const targetImage1 = new URL(
  "../assets/two-targets/target1.zpt",
  import.meta.url
).href;
const targetImage2 = new URL(
  "../assets/two-targets/Cambodia_NBC_500_riels_2014.00.00_B429a_P66_2295088_r.jpg.zpt",
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
// Both trackers are configured, but Zappar will only track one image at a time
// When target1 is detected, videoPlane1 shows. When target2 is detected, videoPlane2 shows.
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

// Function to create video plane that matches the tracked image dimensions
// The plane will be sized based on the video's aspect ratio and scaled to match the image
function createVideoPlane(material: THREE.MeshBasicMaterial) {
  // Wait for video metadata to get aspect ratio
  return new Promise<THREE.Mesh>((resolve) => {
    const createPlane = () => {
      // Get video dimensions
      const videoWidth = videoElement.videoWidth || 1920;
      const videoHeight = videoElement.videoHeight || 1080;
      const videoAspectRatio = videoWidth / videoHeight;

      // In Zappar's coordinate system, image trackers use a normalized size
      // We'll use 1.0 as the base size and scale based on aspect ratio
      // For portrait images, use height as base; for landscape, use width as base
      let planeWidth = 1.0;
      let planeHeight = 1.0;

      if (videoAspectRatio > 1) {
        // Landscape video - use width as base
        planeWidth = 1.0;
        planeHeight = 1.0 / videoAspectRatio;
      } else {
        // Portrait video - use height as base
        planeWidth = 1.0 * videoAspectRatio;
        planeHeight = 1.0;
      }

      const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const plane = new THREE.Mesh(planeGeometry, material);

      // Position the plane flat on the tracked image (at image surface)
      // In Zappar's coordinate system, the image center is at (0, 0, 0)
      // The plane faces the camera by default (no rotation needed)
      plane.position.set(0, 0, 0);

      resolve(plane);
    };

    if (videoElement.readyState >= 2) {
      // Video metadata already loaded
      createPlane();
    } else {
      // Wait for video metadata
      videoElement.addEventListener("loadedmetadata", createPlane, {
        once: true,
      });
    }
  });
}

// Create material for video planes
const planeMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  transparent: true,
  side: THREE.DoubleSide,
});

// Create a single video plane that will be moved between tracker groups
// Only one video will play at a time - whichever target is being tracked
let videoPlane: THREE.Mesh | null = null;
let currentTrackerGroup: ZapparThree.ImageAnchorGroup | null = null;

createVideoPlane(planeMaterial).then((plane) => {
  videoPlane = plane;
  // Initially, don't add to any group - will be added when a target is detected
});

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

  // Check which tracker is visible and show video only on ONE at a time
  if (videoPlane) {
    const tracker1Visible = trackerGroup1.visible;
    const tracker2Visible = trackerGroup2.visible;

    // Priority: tracker1 first, then tracker2
    // Only ONE tracker can be active at a time
    if (tracker1Visible) {
      // Tracker1 detected - disable tracker2 and show video on tracker1
      tracker2.enabled = false;

      if (currentTrackerGroup !== trackerGroup1) {
        if (currentTrackerGroup) {
          currentTrackerGroup.remove(videoPlane);
        }
        trackerGroup1.add(videoPlane);
        currentTrackerGroup = trackerGroup1;
      }

      // Play video when target is detected
      if (videoElement.paused) {
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    } else if (tracker2Visible) {
      // Tracker2 detected (and tracker1 is not) - disable tracker1 and show video on tracker2
      tracker1.enabled = false;

      if (currentTrackerGroup !== trackerGroup2) {
        if (currentTrackerGroup) {
          currentTrackerGroup.remove(videoPlane);
        }
        trackerGroup2.add(videoPlane);
        currentTrackerGroup = trackerGroup2;
      }

      // Play video when target is detected
      if (videoElement.paused) {
        videoElement.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    } else {
      // Neither visible - pause video, re-enable both trackers and remove video visual
      if (!videoElement.paused) {
        videoElement.pause();
      }

      tracker1.enabled = true;
      tracker2.enabled = true;

      if (currentTrackerGroup) {
        currentTrackerGroup.remove(videoPlane);
        currentTrackerGroup = null;
      }
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(render);
