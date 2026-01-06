import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";

const targetImage1 = new URL("../assets/two-targets/500.zpt", import.meta.url)
  .href;
const targetImage2 = new URL("../assets/two-targets/500_1.zpt", import.meta.url)
  .href;
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
videoElement.playsInline = true;
videoElement.setAttribute("playsinline", "");
videoElement.setAttribute("webkit-playsinline", "");
videoElement.crossOrigin = "anonymous";

// Create single video texture (shared by both planes)
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

// Function to create video plane that matches the tracked image dimensions
// The plane will be sized to fill the entire tracked image (1.0 x 1.0 in Zappar's coordinate system)
function createVideoPlane(material: THREE.MeshBasicMaterial) {
  // In Zappar's coordinate system, image trackers use a normalized size of 1.0 x 1.0
  // Create a plane that matches the full image dimensions so the video fills the entire image
  const planeWidth = 4.0;
  const planeHeight = 2.0;

  const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
  const plane = new THREE.Mesh(planeGeometry, material);

  // Position the plane flat on the tracked image (at image surface)
  // In Zappar's coordinate system, the image center is at (0, 0, 0)
  // The plane faces the camera by default (no rotation needed)
  plane.position.set(0, 0, 0);

  return Promise.resolve(plane);
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

// Video recording state
// let mediaRecorder: MediaRecorder | null = null;
// let recordedChunks: Blob[] = [];
// let isRecording = false;
// let canvasStream: MediaStream | null = null;
// let recordingMimeType: string = "video/webm";

createVideoPlane(planeMaterial).then((plane) => {
  videoPlane = plane;
  // Initially, don't add to any group and hide it - will be shown when a target is detected
  plane.visible = false;
});

// Show notification message
// function showNotification(message: string, duration: number = 3000) {
//   // Remove existing notification if any
//   const existing = document.getElementById("saveNotification");
//   if (existing) {
//     existing.remove();
//   }

//   const notification = document.createElement("div");
//   notification.id = "saveNotification";
//   notification.textContent = message;
//   notification.style.cssText = `
//     position: fixed;
//     top: 20px;
//     left: 50%;
//     transform: translateX(-50%);
//     background-color: rgba(0, 0, 0, 0.8);
//     color: white;
//     padding: 15px 25px;
//     border-radius: 25px;
//     font-size: 14px;
//     z-index: 2000;
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
//     animation: fadeIn 0.3s ease;
//   `;

//   // Add fade-in animation
//   const style = document.createElement("style");
//   style.textContent = `
//     @keyframes fadeIn {
//       from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
//       to { opacity: 1; transform: translateX(-50%) translateY(0); }
//     }
//   `;
//   if (!document.getElementById("notificationStyle")) {
//     style.id = "notificationStyle";
//     document.head.appendChild(style);
//   }

//   document.body.appendChild(notification);

//   // Auto-remove after duration
//   setTimeout(() => {
//     notification.style.opacity = "0";
//     notification.style.transition = "opacity 0.3s ease";
//     setTimeout(() => notification.remove(), 300);
//   }, duration);
// }

// Save video to phone gallery using Web Share API or download
// async function saveVideoToGallery(videoBlob: Blob): Promise<void> {
//   try {
//     showNotification("Preparing video...");

//     // Determine file extension and name
//     const extension = recordingMimeType.includes("mp4") ? "mp4" : "webm";
//     const fileName = `ar-recording-${Date.now()}.${extension}`;

//     // Create a File object for sharing
//     const videoFile = new File([videoBlob], fileName, {
//       type: recordingMimeType,
//     });

//     // Try Web Share API first (works on iOS Safari and Android Chrome)
//     if (
//       navigator.share &&
//       navigator.canShare &&
//       navigator.canShare({ files: [videoFile] })
//     ) {
//       try {
//         showNotification(
//           "Opening share menu... Select 'Save to Photos' to save to gallery"
//         );
//         await navigator.share({
//           files: [videoFile],
//           title: "AR Recording",
//           text: "Check out my AR video recording!",
//         });
//         showNotification("Video saved to gallery! ✓", 4000);
//         console.log("Video shared successfully - saved to gallery!");
//         return;
//       } catch (shareError: any) {
//         // User cancelled or share failed, fall through to download
//         if (shareError.name !== "AbortError") {
//           console.log(
//             "Web Share API not available or failed, using download:",
//             shareError
//           );
//           showNotification("Share cancelled, downloading video...");
//         } else {
//           // User cancelled - don't show error
//           return;
//         }
//       }
//     }

//     // Fallback: Download the video (user can save to gallery from downloads)
//     showNotification("Downloading video... Check your downloads folder");
//     downloadVideo(videoBlob, fileName);

//     // Also try to upload to API if needed (mock for now)
//     await uploadVideoToAPI(videoBlob);

//     showNotification(
//       "Video downloaded! You can save it to your gallery from Downloads",
//       5000
//     );
//   } catch (error) {
//     console.error("Error saving video:", error);
//     showNotification("Error saving video. Trying download...");
//     // Final fallback: download
//     const extension = recordingMimeType.includes("mp4") ? "mp4" : "webm";
//     downloadVideo(videoBlob, `ar-recording-${Date.now()}.${extension}`);
//   }
// }

// Mock API upload function (optional - can be replaced with real API)
// async function uploadVideoToAPI(videoBlob: Blob): Promise<void> {
//   // Mock API endpoint - replace with your actual API endpoint
//   const API_ENDPOINT = "https://api.example.com/upload";

//   try {
//     // Simulate API call delay
//     await new Promise((resolve) => setTimeout(resolve, 500));
//     console.log("Mock API upload: Video would be uploaded to:", API_ENDPOINT);
//     console.log("Video size:", (videoBlob.size / 1024 / 1024).toFixed(2), "MB");
//   } catch (error) {
//     console.error("Error uploading video:", error);
//   }
// }

// Helper function to download video
// function downloadVideo(blob: Blob, fileName?: string) {
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;

//   if (!fileName) {
//     const extension = recordingMimeType.includes("mp4") ? "mp4" : "webm";
//     fileName = `ar-recording-${Date.now()}.${extension}`;
//   }

//   a.download = fileName;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);

//   console.log(
//     "Video downloaded. On mobile, you can save it to your gallery from the downloads folder."
//   );
// }

// Get supported MIME type for recording
// function getSupportedMimeType(): string | null {
//   const types = [
//     "video/webm;codecs=vp9",
//     "video/webm;codecs=vp8",
//     "video/webm",
//     "video/mp4",
//   ];

//   for (const type of types) {
//     if (MediaRecorder.isTypeSupported(type)) {
//       return type;
//     }
//   }
//   return null;
// }

// Start recording function
// function startRecording() {
//   if (isRecording || !renderer.domElement) {
//     return;
//   }

//   try {
//     // Get the canvas stream from the renderer
//     canvasStream = renderer.domElement.captureStream(30); // 30 FPS

//     // Check if MediaRecorder is supported
//     const mimeType = getSupportedMimeType();
//     if (!mimeType) {
//       alert("Video recording is not supported in this browser");
//       return;
//     }

//     recordedChunks = [];
//     recordingMimeType = mimeType;

//     // Create MediaRecorder with best available codec
//     const options: MediaRecorderOptions = {
//       mimeType: mimeType,
//       videoBitsPerSecond: 2500000, // 2.5 Mbps
//     };

//     mediaRecorder = new MediaRecorder(canvasStream, options);

//     mediaRecorder.ondataavailable = (event) => {
//       if (event.data && event.data.size > 0) {
//         recordedChunks.push(event.data);
//       }
//     };

//     mediaRecorder.onstop = async () => {
//       const blob = new Blob(recordedChunks, { type: recordingMimeType });
//       console.log("Recording stopped. Video size:", blob.size, "bytes");

//       // Update UI
//       updateRecordingButton(false);

//       // Save to gallery (mobile) or download
//       await saveVideoToGallery(blob);
//     };

//     mediaRecorder.onerror = (event) => {
//       console.error("MediaRecorder error:", event);
//       stopRecording();
//     };

//     mediaRecorder.start(1000); // Collect data every second
//     isRecording = true;
//     updateRecordingButton(true);
//     console.log("Recording started");
//   } catch (error) {
//     console.error("Error starting recording:", error);
//     alert("Failed to start recording: " + error);
//   }
// }

// Stop recording function
// function stopRecording() {
//   if (!isRecording || !mediaRecorder) {
//     return;
//   }

//   try {
//     if (mediaRecorder.state !== "inactive") {
//       mediaRecorder.stop();
//     }
//     isRecording = false;

//     // Stop the canvas stream tracks
//     if (canvasStream) {
//       canvasStream.getTracks().forEach((track) => track.stop());
//       canvasStream = null;
//     }

//     console.log("Recording stopped");
//   } catch (error) {
//     console.error("Error stopping recording:", error);
//   }
// }

// Create recording button UI
// function createRecordingButton() {
//   const button = document.createElement("button");
//   button.id = "recordButton";
//   button.textContent = "Start Recording";
//   button.style.cssText = `
//     position: fixed;
//     bottom: 20px;
//     left: 50%;
//     transform: translateX(-50%);
//     padding: 15px 30px;
//     font-size: 16px;
//     font-weight: bold;
//     color: white;
//     background-color: #4CAF50;
//     border: none;
//     border-radius: 25px;
//     cursor: pointer;
//     z-index: 1000;
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
//     transition: all 0.3s ease;
//   `;

//   button.addEventListener("click", () => {
//     if (isRecording) {
//       stopRecording();
//     } else {
//       startRecording();
//     }
//   });

//   // Hover effect
//   button.addEventListener("mouseenter", () => {
//     button.style.transform = "translateX(-50%) scale(1.05)";
//   });

//   button.addEventListener("mouseleave", () => {
//     button.style.transform = "translateX(-50%) scale(1)";
//   });

//   document.body.appendChild(button);
//   return button;
// }

// Update recording button appearance
// function updateRecordingButton(recording: boolean) {
//   const button = document.getElementById("recordButton") as HTMLButtonElement;
//   if (button) {
//     if (recording) {
//       button.textContent = "Stop Recording";
//       button.style.backgroundColor = "#f44336";
//     } else {
//       button.textContent = "Start Recording";
//       button.style.backgroundColor = "#4CAF50";
//     }
//   }
// }

// Start camera when permission is granted (but don't play video yet)
ZapparThree.permissionRequestUI().then((granted) => {
  if (granted) {
    camera.start();
    // Video will only play when a target is detected (see render loop)
    // Create recording button after camera is ready
    // createRecordingButton();
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

      // Make sure video plane is visible
      if (videoPlane) {
        videoPlane.visible = true;
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

      // Make sure video plane is visible
      if (videoPlane) {
        videoPlane.visible = true;
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

      // Remove video plane from any tracker group and hide it completely
      if (currentTrackerGroup && videoPlane) {
        currentTrackerGroup.remove(videoPlane);
        currentTrackerGroup = null;
      }

      // Explicitly hide the video plane to ensure it's not visible
      if (videoPlane) {
        videoPlane.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(render);
