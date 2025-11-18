/**
 * Main Application
 * Orchestrates AR tracking, video playback, and UI
 */

class App {
  constructor() {
    this.currentScreen = "loading";
    // Paths to assets folder files
    this.markerPath = "assets/target.mind";
    this.videoPath = "assets/video.mp4";

    this.arTracker = null;
    this.videoOverlay = null;
    this.cameraView = new CameraView();

    this.debugMode = false;
    this.fps = 0;
    this.lastTrackingUpdate = null;

    this.init();
  }

  /**
   * Initialize application
   */
  async init() {
    this.setupEventListeners();
    this.showScreen("setup");
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Start AR button
    document.getElementById("start-ar-btn").addEventListener("click", () => {
      this.startAR();
    });

    // Back button
    document.getElementById("back-btn").addEventListener("click", () => {
      this.stopAR();
      this.showScreen("setup");
    });

    // Debug toggle
    document.getElementById("debug-toggle").addEventListener("click", () => {
      this.toggleDebug();
    });

    // Window resize
    window.addEventListener("resize", () => {
      if (this.arTracker) {
        this.arTracker.resize();
      }
    });

    // Handle orientation change
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        if (this.arTracker) {
          this.arTracker.resize();
        }
      }, 100);
    });
  }

  /**
   * Update start button state
   */
  updateStartButton() {
    const startBtn = document.getElementById("start-ar-btn");
    const hasMarker = this.markerFile || this.defaultMarkerUrl;
    const hasVideo = this.videoFile;
    startBtn.disabled = !(hasMarker && hasVideo);
  }

  /**
   * Use default marker
   */
  useDefaultMarker() {
    this.markerFile = null;
    const markerPreview = document.getElementById("marker-preview");
    markerPreview.classList.add("hidden");
    document
      .getElementById("marker-upload-area")
      .querySelector(".upload-placeholder")
      .classList.remove("hidden");
    this.updateStartButton();
  }

  /**
   * Show specific screen
   * @param {string} screenName - Name of screen to show
   */
  showScreen(screenName) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const screen = document.getElementById(`${screenName}-screen`);
    if (screen) {
      screen.classList.add("active");
      this.currentScreen = screenName;
    }
  }

  /**
   * Update loading message
   * @param {string} message - Loading message
   */
  updateLoadingMessage(message) {
    document.getElementById("loading-message").textContent = message;
  }

  /**
   * Start AR experience
   */
  async startAR() {
    try {
      this.showScreen("loading");
      this.updateLoadingMessage("Requesting camera access...");

      // Request camera permission
      await this.cameraView.requestPermission();
      this.updateLoadingMessage("Loading video...");

      // Load video from assets folder
      const videoElement = document.createElement("video");
      videoElement.src = this.videoPath;
      videoElement.crossOrigin = "anonymous";
      videoElement.loop = true;
      videoElement.muted = true; // Required for autoplay on mobile
      videoElement.playsInline = true; // Required for iOS
      videoElement.preload = "auto";

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoElement.addEventListener("loadeddata", resolve, { once: true });
        videoElement.addEventListener("error", reject, { once: true });
        videoElement.load();
      });

      // Initialize AR tracker
      const container = document.getElementById("ar-container");
      this.arTracker = new ARTracker(container, {
        maxTrack: 1,
        warmupTolerance: 0,
        missTolerance: 10,
      });

      // Set up tracking callback
      this.arTracker.onTrackingUpdate = (trackingData) => {
        this.handleTrackingUpdate(trackingData);
      };

      // Initialize AR with marker from assets folder
      this.updateLoadingMessage("Initializing AR tracking...");
      await this.arTracker.initialize(this.markerPath);
      this.updateLoadingMessage("Setting up video overlay...");

      // Get anchor and create video overlay
      const anchor = this.arTracker.getAnchor();
      if (!anchor) {
        throw new Error("Failed to get AR anchor");
      }

      this.videoOverlay = new VideoOverlay(anchor, videoElement, {
        width: 1,
        autoplay: true,
        loop: true,
      });

      // Show AR screen
      this.showScreen("ar");
      this.updateUserMessage("Point camera at your marker");
    } catch (error) {
      console.error("Failed to start AR:", error);
      alert(`Failed to start AR: ${error.message}`);
      this.showScreen("setup");
    }
  }

  /**
   * Handle tracking updates
   * @param {Object} trackingData - Tracking data from AR tracker
   */
  handleTrackingUpdate(trackingData) {
    this.lastTrackingUpdate = trackingData;

    // Update video overlay
    if (this.videoOverlay) {
      this.videoOverlay.update(trackingData);
    }

    // Update UI
    this.updateTrackingUI(trackingData);

    // Update debug info
    if (this.debugMode) {
      this.updateDebugInfo(trackingData);
    }
  }

  /**
   * Update tracking UI
   * @param {Object} trackingData - Tracking data
   */
  updateTrackingUI(trackingData) {
    const indicator = document.getElementById("tracking-indicator");
    const text = document.getElementById("tracking-text");

    if (trackingData.isTracking) {
      indicator.classList.add("tracking");
      text.textContent = "Tracking marker";
      this.updateUserMessage("");
    } else {
      indicator.classList.remove("tracking");
      text.textContent = "Searching for marker...";
      this.updateUserMessage("Point camera at your marker");
    }
  }

  /**
   * Update debug information
   * @param {Object} trackingData - Tracking data
   */
  updateDebugInfo(trackingData) {
    const state = this.arTracker.getTrackingState();

    document.getElementById("debug-confidence").textContent =
      trackingData.confidence ? trackingData.confidence.toFixed(2) : "0.00";
    document.getElementById("debug-fps").textContent = state.fps;

    if (trackingData.position) {
      const pos = trackingData.position;
      document.getElementById("debug-position").textContent = `${pos.x.toFixed(
        2
      )}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
    } else {
      document.getElementById("debug-position").textContent = "N/A";
    }

    if (trackingData.rotation) {
      const euler = new THREE.Euler().setFromQuaternion(trackingData.rotation);
      document.getElementById("debug-rotation").textContent = `${(
        (euler.x * 180) /
        Math.PI
      ).toFixed(1)}°, ${((euler.y * 180) / Math.PI).toFixed(1)}°, ${(
        (euler.z * 180) /
        Math.PI
      ).toFixed(1)}°`;
    } else {
      document.getElementById("debug-rotation").textContent = "N/A";
    }
  }

  /**
   * Update user message
   * @param {string} message - Message to display
   */
  updateUserMessage(message) {
    const messageEl = document.getElementById("user-message");
    messageEl.textContent = message;
  }

  /**
   * Toggle debug mode
   */
  toggleDebug() {
    this.debugMode = !this.debugMode;
    const debugPanel = document.getElementById("debug-panel");
    if (this.debugMode) {
      debugPanel.classList.remove("hidden");
    } else {
      debugPanel.classList.add("hidden");
    }
  }

  /**
   * Stop AR experience
   */
  stopAR() {
    if (this.videoOverlay) {
      this.videoOverlay.dispose();
      this.videoOverlay = null;
    }

    if (this.arTracker) {
      this.arTracker.stop();
      this.arTracker = null;
    }

    if (this.cameraView) {
      this.cameraView.stop();
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.app = new App();
  });
} else {
  window.app = new App();
}
