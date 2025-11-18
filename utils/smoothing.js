/**
 * Smoothing utilities for AR tracking
 * Implements exponential smoothing and Kalman-like filtering for stable tracking
 */

class SmoothingFilter {
    constructor(alpha = 0.7, beta = 0.5) {
        this.alpha = alpha; // Position smoothing factor
        this.beta = beta;   // Velocity smoothing factor
        this.position = null;
        this.velocity = null;
        this.lastTime = null;
    }

    /**
     * Smooth a 3D position using exponential smoothing
     * @param {THREE.Vector3} newPosition - New position from AR tracking
     * @param {number} deltaTime - Time since last update in seconds
     * @returns {THREE.Vector3} - Smoothed position
     */
    smoothPosition(newPosition, deltaTime) {
        if (!this.position) {
            this.position = newPosition.clone();
            this.velocity = new THREE.Vector3(0, 0, 0);
            this.lastTime = Date.now();
            return this.position;
        }

        // Calculate velocity
        const positionDelta = new THREE.Vector3().subVectors(newPosition, this.position);
        const currentVelocity = positionDelta.multiplyScalar(1 / Math.max(deltaTime, 0.001));

        // Smooth velocity
        if (this.velocity) {
            this.velocity.lerp(currentVelocity, this.beta);
        } else {
            this.velocity = currentVelocity.clone();
        }

        // Predict position using velocity
        const predictedPosition = this.position.clone().add(
            this.velocity.clone().multiplyScalar(deltaTime)
        );

        // Smooth between predicted and actual
        this.position.lerp(newPosition, this.alpha);

        return this.position.clone();
    }

    /**
     * Smooth a quaternion rotation
     * @param {THREE.Quaternion} newRotation - New rotation from AR tracking
     * @param {number} deltaTime - Time since last update in seconds
     * @returns {THREE.Quaternion} - Smoothed rotation
     */
    smoothRotation(newRotation, deltaTime) {
        if (!this.rotation) {
            this.rotation = newRotation.clone();
            return this.rotation;
        }

        // Use slerp for quaternion interpolation
        this.rotation.slerp(newRotation, this.alpha);
        return this.rotation.clone();
    }

    reset() {
        this.position = null;
        this.velocity = null;
        this.rotation = null;
        this.lastTime = null;
    }
}

class KalmanFilter {
    constructor(processNoise = 0.01, measurementNoise = 0.25) {
        this.processNoise = processNoise;
        this.measurementNoise = measurementNoise;
        this.estimated = null;
        this.errorCovariance = null;
    }

    /**
     * Apply Kalman filter to a 3D position
     * @param {THREE.Vector3} measurement - Measured position
     * @returns {THREE.Vector3} - Filtered position
     */
    filter(measurement) {
        if (!this.estimated) {
            this.estimated = measurement.clone();
            this.errorCovariance = new THREE.Vector3(1, 1, 1);
            return this.estimated;
        }

        // Prediction step
        const predictedErrorCovariance = this.errorCovariance.clone().addScalar(this.processNoise);

        // Update step
        const kalmanGain = predictedErrorCovariance.clone().divideScalar(
            predictedErrorCovariance.x + this.measurementNoise
        );

        const innovation = new THREE.Vector3().subVectors(measurement, this.estimated);
        this.estimated.add(innovation.multiply(kalmanGain));
        this.errorCovariance = predictedErrorCovariance.multiplyScalar(1 - kalmanGain.x);

        return this.estimated.clone();
    }

    reset() {
        this.estimated = null;
        this.errorCovariance = null;
    }
}

/**
 * Combined smoothing filter for AR tracking
 * Uses exponential smoothing for fast response and Kalman for stability
 */
class ARSmoothingFilter {
    constructor(options = {}) {
        this.smoothingAlpha = options.smoothingAlpha || 0.7;
        this.smoothingBeta = options.smoothingBeta || 0.5;
        this.kalmanEnabled = options.kalmanEnabled !== false;
        
        this.smoothingFilter = new SmoothingFilter(this.smoothingAlpha, this.smoothingBeta);
        this.kalmanFilter = this.kalmanEnabled ? new KalmanFilter() : null;
        
        this.lastUpdateTime = null;
        this.position = null;
        this.rotation = null;
        this.isTracking = false;
    }

    /**
     * Update filter with new tracking data
     * @param {THREE.Vector3} position - New position
     * @param {THREE.Quaternion} rotation - New rotation
     * @param {boolean} isTracking - Whether marker is currently detected
     * @returns {Object} - Smoothed position and rotation
     */
    update(position, rotation, isTracking) {
        const currentTime = Date.now();
        const deltaTime = this.lastUpdateTime 
            ? (currentTime - this.lastUpdateTime) / 1000 
            : 0.016; // Default to 60fps if first frame
        
        this.lastUpdateTime = currentTime;

        if (!isTracking) {
            // When tracking is lost, gradually fade out
            if (this.position) {
                // Keep last known position but mark as not tracking
                this.isTracking = false;
                return {
                    position: this.position.clone(),
                    rotation: this.rotation ? this.rotation.clone() : new THREE.Quaternion(),
                    isTracking: false
                };
            }
            return null;
        }

        // Apply Kalman filter first if enabled
        let filteredPosition = position;
        if (this.kalmanFilter) {
            filteredPosition = this.kalmanFilter.filter(position);
        }

        // Apply exponential smoothing
        const smoothedPosition = this.smoothingFilter.smoothPosition(filteredPosition, deltaTime);
        const smoothedRotation = this.smoothingFilter.smoothRotation(rotation, deltaTime);

        this.position = smoothedPosition;
        this.rotation = smoothedRotation;
        this.isTracking = true;

        return {
            position: smoothedPosition,
            rotation: smoothedRotation,
            isTracking: true
        };
    }

    reset() {
        this.smoothingFilter.reset();
        if (this.kalmanFilter) {
            this.kalmanFilter.reset();
        }
        this.position = null;
        this.rotation = null;
        this.isTracking = false;
        this.lastUpdateTime = null;
    }

    /**
     * Get current smoothed state
     */
    getState() {
        return {
            position: this.position ? this.position.clone() : null,
            rotation: this.rotation ? this.rotation.clone() : null,
            isTracking: this.isTracking
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SmoothingFilter, KalmanFilter, ARSmoothingFilter };
}

