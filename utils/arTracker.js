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
    this.markerBlobUrl = null; // Store Blob URL for cleanup
  }

  /**
   * Initialize MindAR with marker image
   * @param {string|File} markerImage - URL or File object for marker image
   * @returns {Promise<void>}
   */
  async initialize(markerImage) {
    try {
      // Wait for MindAR library to be available
      // It's loaded via ES module and exposed as global
      let MindARThreeClass = null;

      // First check if it's already available
      if (window.MINDAR?.MindARThree) {
        MindARThreeClass = window.MINDAR.MindARThree;
      } else if (window.MindARThree) {
        MindARThreeClass = window.MindARThree.MindARThree || window.MindARThree;
      } else if (window.MindAR?.MindARThree) {
        MindARThreeClass = window.MindAR.MindARThree;
      }

      // If not available, wait for it (either via event or polling)
      if (!MindARThreeClass) {
        const mindarReady = new Promise((resolve) => {
          // Listen for the ready event
          window.addEventListener("mindar-ready", resolve, { once: true });
        });

        // Also poll as fallback
        const pollForMindAR = async () => {
          let attempts = 0;
          const maxAttempts = 50; // Wait up to 5 seconds

          while (attempts < maxAttempts) {
            if (window.MINDAR?.MindARThree) {
              return window.MINDAR.MindARThree;
            }
            if (window.MindARThree) {
              return window.MindARThree.MindARThree || window.MindARThree;
            }
            if (window.MindAR?.MindARThree) {
              return window.MindAR.MindARThree;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
          }
          return null;
        };

        // Wait for either the event or polling to succeed
        MindARThreeClass = await Promise.race([
          mindarReady.then(
            () => window.MINDAR?.MindARThree || window.MindARThree
          ),
          pollForMindAR(),
        ]);
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

      // Handle marker image - can be File, data URL, or file path (string)
      // MindAR accepts .mind files (compiled) or image files (PNG/JPG)
      let markerUrl = markerImage;
      
      if (markerImage instanceof File) {
        // File object - create Blob URL
        markerUrl = URL.createObjectURL(markerImage);
        this.markerBlobUrl = markerUrl; // Store for cleanup
      } else if (typeof markerImage === "string") {
        if (markerImage.startsWith("data:")) {
          // Data URL - convert to Blob URL for better compatibility
          try {
            const response = await fetch(markerImage);
            const blob = await response.blob();
            markerUrl = URL.createObjectURL(blob);
            this.markerBlobUrl = markerUrl; // Store for cleanup
          } catch (error) {
            console.warn(
              "Failed to convert data URL to Blob URL, using data URL directly:",
              error
            );
            // Fall back to data URL if conversion fails
          }
        } else {
          // Regular file path (e.g., 'assets/target.mind') - use directly
          // MindAR will load it from the server
          markerUrl = markerImage;
        }
      }

      // Initialize MindAR
      // Note: imageTargetSrc can be a URL to an image file (PNG/JPG) or a compiled .mind file
      this.mindarThree = new MindARThreeClass({
        container: this.container,
        imageTargetSrc: markerUrl,
        maxTrack: this.options.maxTrack,
        warmupTolerance: this.options.warmupTolerance,
        missTolerance: this.options.missTolerance,
      });

      // Use MindAR's renderer, scene, and camera
      const { renderer, scene, camera } = this.mindarThree;
      this.renderer = renderer;
      this.scene = scene; // Use MindAR's scene, not create our own
      this.camera = camera;

      // Configure renderer for mobile
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;

      // Start MindAR
      await this.mindarThree.start();

      // Debug: Log what's available in mindarThree
      console.log('MindAR started. Available properties:', {
        hasAnchor: !!this.mindarThree.anchor,
        anchorType: this.mindarThree.anchor ? typeof this.mindarThree.anchor : 'undefined',
        hasAnchors: !!this.mindarThree.anchors,
        anchorsLength: this.mindarThree.anchors ? this.mindarThree.anchors.length : 0,
        hasController: !!this.mindarThree.controller,
        mindarThreeKeys: Object.keys(this.mindarThree).filter(k => !k.startsWith('_'))
      });

      // Try to get anchor - MindAR creates it during start
      // Try different ways to access the anchor
      let anchor = null;
      
      // Method 1: Check if anchor exists directly
      if (this.mindarThree.anchor) {
        if (this.mindarThree.anchor.group) {
          anchor = this.mindarThree.anchor.group;
          console.log('Found anchor via mindarThree.anchor.group');
        } else if (this.mindarThree.anchor instanceof THREE.Group) {
          anchor = this.mindarThree.anchor;
          console.log('Found anchor via mindarThree.anchor (is Group)');
        } else {
          console.log('anchor exists but structure:', Object.keys(this.mindarThree.anchor));
        }
      }
      
      // Method 2: Check anchors array (for multiple targets)
      if (!anchor && this.mindarThree.anchors && this.mindarThree.anchors.length > 0) {
        const firstAnchor = this.mindarThree.anchors[0];
        if (firstAnchor.group) {
          anchor = firstAnchor.group;
          console.log('Found anchor via mindarThree.anchors[0].group');
        } else if (firstAnchor instanceof THREE.Group) {
          anchor = firstAnchor;
          console.log('Found anchor via mindarThree.anchors[0] (is Group)');
        }
      }
      
      // Method 3: Try accessing through controller
      if (!anchor && this.mindarThree.controller) {
        const controller = this.mindarThree.controller;
        if (controller.anchors && controller.anchors.length > 0) {
          const firstAnchor = controller.anchors[0];
          if (firstAnchor.group) {
            anchor = firstAnchor.group;
            console.log('Found anchor via controller.anchors[0].group');
          }
        }
      }

      if (!anchor) {
        throw new Error('Failed to get AR anchor. Please check: 1) The marker file (target.mind) exists in assets folder, 2) The marker file is valid, 3) Check browser console for more details.');
      }

      this.anchor = anchor;
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

      if (this.mindarThree && this.renderer && this.scene && this.camera) {
        // MindAR handles its own update internally, we just need to render
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

        // Render the scene
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate();
  }

  /**
   * Get anchor group for attaching 3D objects
   * @returns {THREE.Group|null}
   */
  getAnchor() {
    // Return stored anchor if available, otherwise try to get it from mindarThree
    if (this.anchor) {
      return this.anchor;
    }
    if (this.mindarThree && this.mindarThree.anchor && this.mindarThree.anchor.group) {
      this.anchor = this.mindarThree.anchor.group;
      return this.anchor;
    }
    return null;
  }

  /**
   * Stop AR tracking
   */
  stop() {
    if (this.mindarThree) {
      this.mindarThree.stop();
      this.mindarThree = null;
    }

    // Clean up Blob URL if we created one
    if (this.markerBlobUrl) {
      URL.revokeObjectURL(this.markerBlobUrl);
      this.markerBlobUrl = null;
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
