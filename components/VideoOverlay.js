/**
 * Video Overlay Component
 * Renders video on a plane that tracks the marker
 */

class VideoOverlay {
    constructor(anchor, videoElement, options = {}) {
        this.anchor = anchor;
        this.videoElement = videoElement;
        this.options = {
            width: options.width || 1,
            height: options.height || 0.5625, // 16:9 aspect ratio
            autoplay: options.autoplay !== false,
            loop: options.loop !== false,
            ...options
        };

        this.videoTexture = null;
        this.videoPlane = null;
        this.mesh = null;
        this.isPlaying = false;
        this.smoothingFilter = null;
        this.lastPosition = null;
        this.lastRotation = null;

        this.init();
    }

    /**
     * Initialize video overlay
     */
    init() {
        // Create video texture
        this.videoTexture = new THREE.VideoTexture(this.videoElement);
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBFormat;
        this.videoTexture.flipY = false; // MindAR uses flipped Y

        // Calculate aspect ratio from video
        if (this.videoElement.videoWidth && this.videoElement.videoHeight) {
            const aspect = this.videoElement.videoWidth / this.videoElement.videoHeight;
            this.options.height = this.options.width / aspect;
        }

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(
            this.options.width,
            this.options.height
        );

        // Create material with video texture
        const material = new THREE.MeshBasicMaterial({
            map: this.videoTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0
        });

        // Create mesh
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position video at marker center
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);

        // Add to anchor - MindAR will update the anchor's transform automatically
        if (this.anchor) {
            this.anchor.add(this.mesh);
        }

        // Set up video event listeners
        this.setupVideoListeners();

        // Initialize smoothing filter
        this.smoothingFilter = new ARSmoothingFilter({
            smoothingAlpha: 0.8,
            smoothingBeta: 0.6,
            kalmanEnabled: true
        });
    }

    /**
     * Set up video event listeners
     */
    setupVideoListeners() {
        this.videoElement.addEventListener('loadedmetadata', () => {
            // Update aspect ratio when video loads
            if (this.videoElement.videoWidth && this.videoElement.videoHeight) {
                const aspect = this.videoElement.videoWidth / this.videoElement.videoHeight;
                this.options.height = this.options.width / aspect;
                
                if (this.mesh) {
                    this.mesh.geometry.dispose();
                    this.mesh.geometry = new THREE.PlaneGeometry(
                        this.options.width,
                        this.options.height
                    );
                }
            }
        });

        this.videoElement.addEventListener('play', () => {
            this.isPlaying = true;
        });

        this.videoElement.addEventListener('pause', () => {
            this.isPlaying = false;
        });

        this.videoElement.addEventListener('ended', () => {
            if (this.options.loop) {
                this.videoElement.currentTime = 0;
                this.videoElement.play();
            }
        });
    }

    /**
     * Update video position and rotation based on tracking
     * @param {Object} trackingData - Tracking data from AR tracker
     */
    update(trackingData) {
        if (!this.mesh || !trackingData) return;

        if (trackingData.isTracking) {
            // Update smoothing filter
            const smoothed = this.smoothingFilter.update(
                trackingData.position,
                trackingData.rotation,
                true
            );

            if (smoothed) {
                // Note: The anchor's transform is automatically updated by MindAR
                // The smoothing filter helps reduce jitter in the tracking data
                // but MindAR handles the actual transform application
                // We store the smoothed data for potential future use or debugging

                // Play video if not playing
                if (!this.isPlaying && this.videoElement.readyState >= 2) {
                    this.play();
                }
            }
        } else {
            // Update filter with tracking lost
            this.smoothingFilter.update(null, null, false);
            
            // Pause video when marker is lost
            if (this.isPlaying) {
                this.pause();
            }
        }

        // Update video texture
        if (this.videoTexture && this.isPlaying) {
            this.videoTexture.needsUpdate = true;
        }
    }

    /**
     * Play video
     */
    play() {
        if (this.videoElement && this.videoElement.readyState >= 2) {
            this.videoElement.play().catch(err => {
                console.warn('Video play failed:', err);
            });
        }
    }

    /**
     * Pause video
     */
    pause() {
        if (this.videoElement) {
            this.videoElement.pause();
        }
    }

    /**
     * Set video scale
     * @param {number} scale - Scale factor
     */
    setScale(scale) {
        if (this.mesh) {
            this.mesh.scale.set(scale, scale, scale);
        }
    }

    /**
     * Set video opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setOpacity(opacity) {
        if (this.mesh && this.mesh.material) {
            this.mesh.material.opacity = Math.max(0, Math.min(1, opacity));
        }
    }

    /**
     * Dispose resources
     */
    dispose() {
        if (this.videoTexture) {
            this.videoTexture.dispose();
        }
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            if (this.anchor) {
                this.anchor.remove(this.mesh);
            }
        }
        if (this.smoothingFilter) {
            this.smoothingFilter.reset();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoOverlay;
}

