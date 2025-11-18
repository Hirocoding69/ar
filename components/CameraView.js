/**
 * Camera View Component
 * Handles camera permissions and initialization
 */

class CameraView {
    constructor() {
        this.stream = null;
        this.hasPermission = false;
        this.permissionError = null;
    }

    /**
     * Request camera permission
     * @returns {Promise<MediaStream>}
     */
    async requestPermission() {
        try {
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Request camera access with optimal settings for AR
            const constraints = {
                video: {
                    facingMode: 'environment', // Back camera
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 24 },
                    focusMode: 'continuous'
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.hasPermission = true;
            this.permissionError = null;
            
            return this.stream;
        } catch (error) {
            this.hasPermission = false;
            this.permissionError = error;
            
            // Provide user-friendly error messages
            let errorMessage = 'Camera access denied';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Camera does not support required settings.';
            } else {
                errorMessage = `Camera error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Stop camera stream
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.hasPermission = false;
    }

    /**
     * Check if camera permission is granted
     * @returns {Promise<boolean>}
     */
    async checkPermission() {
        try {
            // Note: Permission API is not widely supported for camera
            // This is a best-effort check
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'camera' });
                return result.state === 'granted';
            }
            return false;
        } catch (error) {
            // Permission API not supported or camera not in query list
            return false;
        }
    }

    /**
     * Get camera capabilities
     * @returns {Promise<Object>}
     */
    async getCapabilities() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return null;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : null;
            
            // Stop the test stream
            stream.getTracks().forEach(t => t.stop());
            
            return capabilities;
        } catch (error) {
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraView;
}

