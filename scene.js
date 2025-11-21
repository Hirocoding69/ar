import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Sets up the 3D scene with model, lights, and attaches to anchor
 * @param {THREE.Group} anchor - MindAR anchor group to attach objects to
 * @param {string} modelPath - Path to the .glb model file
 * @param {Object} options - Configuration options (scale, position, etc.)
 * @returns {Promise<THREE.Group>} The loaded model group
 */
export async function setupScene(anchor, modelPath = './assets/model.glb', options = {}) {
  const {
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  } = options;

  // Create ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  anchor.group.add(ambientLight);

  // Create directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  anchor.group.add(directionalLight);

  // Load GLB model
  const loader = new GLTFLoader();
  
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // Scale the model
        model.scale.set(scale, scale, scale);

        // Position the model
        model.position.set(...position);

        // Rotate the model
        model.rotation.set(...rotation);

        // Attach model to anchor
        anchor.group.add(model);

        console.log('Model loaded successfully:', modelPath);
        resolve(model);
      },
      (progress) => {
        // Loading progress
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`Loading model: ${percent.toFixed(2)}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
        reject(error);
      }
    );
  });
}

