/**
 * AR Tracker utility
 * Handles MindAR initialization and marker tracking
 */

class ARTracker {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      maxTrack: options.maxTrack || 1,
      warmupTolerance: options.warmupTolerance || 0,
      missTolerance: options.missTolerance || 10,
      ...options,
    };

    this.mindarThree = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.anchor = null;
    this.isInitialized = false;
    this.isTracking = false;
    this.trackingConfidence = 0;
    this.onTrackingUpdate = null;
    this.frameCount = 0;
    this.lastFpsTime = Date.now();
    this.fps = 0;
  }

  /**
   * Initialize MindAR with marker image
   * @param {string|File} markerImage - URL or File object for marker image
   * @returns {Promise<void>}
   */
  async initialize(markerImage) {
    try {
      // Wait for MindAR library to be available
      // The CDN script exposes it as MINDAR (all caps) with MINDAR.MindARThree
      let MindARThreeClass = null;
      let attempts = 0;
      const maxAttempts = 50; // Wait up to 5 seconds

      while (!MindARThreeClass && attempts < maxAttempts) {
        // Check for MINDAR.MindARThree (most common when loaded via script tag)
        if (typeof window.MINDAR !== "undefined" && window.MINDAR.MindARThree) {
          MindARThreeClass = window.MINDAR.MindARThree;
          break;
        }
        // Check for direct MindARThree global
        if (typeof window.MindARThree !== "undefined") {
          MindARThreeClass =
            window.MindARThree.MindARThree || window.MindARThree;
          break;
        }
        // Check for MindAR (camelCase)
        if (typeof window.MindAR !== "undefined" && window.MindAR.MindARThree) {
          MindARThreeClass = window.MindAR.MindARThree;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!MindARThreeClass) {
        console.error("Available globals:", {
          MINDAR: typeof window.MINDAR,
          MindARThree: typeof window.MindARThree,
          MindAR: typeof window.MindAR,
        });
        throw new Error(
          "MindAR library is not loaded. Please ensure the script is included in your HTML and loaded before initializing AR."
        );
      }

      // Convert File to data URL if needed
      let markerUrl = markerImage;
      if (markerImage instanceof File) {
        markerUrl = await this.fileToDataURL(markerImage);
      }

      // Create Three.js scene
      this.scene = new THREE.Scene();

      // Initialize MindAR
      this.mindarThree = new MindARThreeClass({
        container: this.container,
        imageTargetSrc: markerUrl,
        maxTrack: this.options.maxTrack,
        warmupTolerance: this.options.warmupTolerance,
        missTolerance: this.options.missTolerance,
      });

      const { renderer, scene, camera } = this.mindarThree;
      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;

      // Configure renderer for mobile
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;

      // Start MindAR
      await this.mindarThree.start();

      this.isInitialized = true;

      // Start render loop
      this.startRenderLoop();

      return true;
    } catch (error) {
      console.error("Failed to initialize AR:", error);
      throw error;
    }
  }

  /**
   * Convert File to data URL
   * @param {File} file - File object
   * @returns {Promise<string>}
   */
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Start render loop
   */
  startRenderLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      // Update FPS
      this.frameCount++;
      const now = Date.now();
      if (now - this.lastFpsTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      if (this.mindarThree) {
        this.mindarThree.update();

        // Check tracking status
        const anchor = this.mindarThree.anchor;
        if (anchor && anchor.visible) {
          const wasTracking = this.isTracking;
          this.isTracking = true;

          // Get transformation matrix
          const matrix = anchor.group.matrixWorld;
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          matrix.decompose(position, quaternion, scale);

          // Estimate confidence based on marker size and stability
          // This is a heuristic since MindAR doesn't directly provide confidence
          const markerSize = scale.length();
          this.trackingConfidence = Math.min(
            1.0,
            Math.max(0.5, markerSize / 2)
          );

          // Notify listeners
          if (this.onTrackingUpdate) {
            this.onTrackingUpdate({
              isTracking: true,
              position,
              rotation: quaternion,
              scale,
              confidence: this.trackingConfidence,
              matrix,
            });
          }
        } else {
          if (this.isTracking) {
            this.isTracking = false;
            this.trackingConfidence = 0;

            if (this.onTrackingUpdate) {
              this.onTrackingUpdate({
                isTracking: false,
                position: null,
                rotation: null,
                scale: null,
                confidence: 0,
                matrix: null,
              });
            }
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Get anchor group for attaching 3D objects
   * @returns {THREE.Group|null}
   */
  getAnchor() {
    if (!this.mindarThree || !this.mindarThree.anchor) {
      return null;
    }
    return this.mindarThree.anchor.group;
  }

  /**
   * Stop AR tracking
   */
  stop() {
    if (this.mindarThree) {
      this.mindarThree.stop();
      this.mindarThree = null;
    }
    this.isInitialized = false;
    this.isTracking = false;
    this.trackingConfidence = 0;
  }

  /**
   * Get current tracking state
   */
  getTrackingState() {
    return {
      isTracking: this.isTracking,
      confidence: this.trackingConfidence,
      fps: this.fps,
    };
  }

  /**
   * Resize renderer
   */
  resize() {
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    if (this.camera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ARTracker;
}
