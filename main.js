import { initializeMindAR } from "./mindar-init.js";
import { setupScene } from "./scene.js";

/**
 * Main application entry point
 */
async function main() {
  try {
    console.log("Initializing MindAR...");

    // Initialize MindAR
    const { mindarThree, renderer, scene, camera, anchor } =
      await initializeMindAR("https://files.catbox.moe/ny0k47.mind");

    console.log("Loading 3D scene...");

    // Setup scene with model
    await setupScene(anchor, "https://files.catbox.moe/wd27s4.glb", {
      scale: 0.1, // Reduced from 1 to make model smaller (10% of original size)
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    });

    console.log("Starting MindAR tracking...");

    // Start MindAR tracking
    await mindarThree.start();

    // Start render loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Update status display
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent = "Status: Ready - Point camera at target";
      statusEl.className = "status-detecting";
    }

    // Track detection events
    anchor.onTargetFound = () => {
      if (statusEl) {
        statusEl.textContent = "Status: Target Detected! 🎉";
        statusEl.className = "status-tracking";
      }
    };

    anchor.onTargetLost = () => {
      if (statusEl) {
        statusEl.textContent = "Status: Searching for target...";
        statusEl.className = "status-detecting";
      }
    };

    console.log("MindAR is running! Point camera at the target image.");
  } catch (error) {
    console.error("Failed to initialize MindAR:", error);
    alert("Failed to initialize AR. Please check the console for details.");
  }
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
