import * as THREE from "three";

/**
 * Loads MindAR library dynamically from CDN
 * @returns {Promise<Object>} MindARThree class
 */
async function loadMindAR() {
  // Check if already loaded
  if (window.MINDAR?.IMAGE?.MindARThree) {
    console.log("MindAR already loaded");
    return window.MINDAR.IMAGE.MindARThree;
  }

  console.log("Loading MindAR from CDN...");

  // Try to load as ES module - use full URL so Vite doesn't try to resolve it
  // The import map in index.html will still help resolve "three" dependency inside MindAR
  try {
    await import(
      "https://cdn.jsdelivr.net/npm/mind-ar@1.2.3/dist/mindar-image-three.prod.js"
    );
    console.log("MindAR module imported");
  } catch (error) {
    console.warn("jsdelivr failed, trying unpkg...", error);
    try {
      await import(
        "https://unpkg.com/mind-ar@1.2.3/dist/mindar-image-three.prod.js"
      );
      console.log("MindAR module imported from unpkg");
    } catch (fallbackError) {
      console.error("Both CDNs failed:", fallbackError);
      throw new Error(
        "Failed to load MindAR from CDN. Please check your internet connection."
      );
    }
  }

  // Wait for window.MINDAR to be set (module execution is async)
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds
  while (attempts < maxAttempts) {
    if (window.MINDAR?.IMAGE?.MindARThree) {
      console.log("MindAR ready!");
      return window.MINDAR.IMAGE.MindARThree;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  throw new Error(
    "MindAR module loaded but window.MINDAR not set. This may be a compatibility issue."
  );
}

/**
 * Initializes MindAR with image target tracking
 * @param {string} imageTargetPath - Path to the .mind target file
 * @returns {Promise<Object>} Object containing renderer, scene, camera, and anchor
 */
export async function initializeMindAR(
  imageTargetPath = "./assets/poster.mind"
) {
  // Load or wait for MindAR to be available
  const MindARThree = await loadMindAR();

  // Get container element
  const container = document.querySelector("#container") || document.body;

  // Create MindAR controller
  const mindarThree = new MindARThree({
    container: container,
    imageTargetSrc: imageTargetPath,
  });

  const { renderer, scene, camera } = mindarThree;

  // Configure renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Get the anchor group (this is where we'll attach 3D objects)
  const anchor = mindarThree.addAnchor(0);

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    mindarThree,
    renderer,
    scene,
    camera,
    anchor,
  };
}
