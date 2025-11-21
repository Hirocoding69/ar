# MindAR Image Tracking Demo

A web-based augmented reality application using MindAR for image target tracking with 3D model overlays.

## 🚀 Features

- **Image Target Tracking**: Recognizes and tracks a target image (poster)
- **3D Model Overlay**: Displays a GLB model when the target is detected
- **Real-time Tracking**: Smooth tracking as the poster moves
- **Web-based**: Runs entirely in the browser using WebXR/WebRTC

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A webcam-enabled device (for testing)

## 🛠️ Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd ar-video-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up target files:**
   - See sections below for creating `poster.mind` and `model.glb`

## 🎯 Setting Up the Image Target

### Step 1: Prepare Your Target Image

1. Create or choose an image to use as your AR target (e.g., `poster.png`)
   - Recommended size: 800x600 pixels or larger
   - High contrast images work best
   - Avoid blurry or low-resolution images

2. Place your image in the `assets` folder

### Step 2: Compile to .mind File

You have two options:

#### Option A: Using MindAR Web Compiler (Recommended)

1. Visit: https://mind-ar.github.io/mind-ar-js-doc/tools/compile
2. Upload your `poster.png` image
3. Download the generated `poster.mind` file
4. Place it in `./assets/poster.mind`

#### Option B: Using MindAR CLI

1. Install the CLI globally:
   ```bash
   npm install -g @mindar/mindar-cli
   ```

2. Compile your image:
   ```bash
   mindar-image-target ./assets/poster.png
   ```

3. Move the generated `poster.mind` to `./assets/poster.mind`

## 🎨 Setting Up the 3D Model

### Option 1: Download a Free Model

1. Visit one of these sites:
   - [Sketchfab](https://sketchfab.com) - Filter by "Downloadable" and "GLB"
   - [Poly Haven](https://polyhaven.com/models)
   - [Free3D](https://free3d.com)

2. Download a GLB model

3. Place it in `./assets/model.glb`

### Option 2: Create Your Own

1. Use **Blender**:
   - Create or import your 3D model
   - Export as GLB format
   - Place in `./assets/model.glb`

2. Use **Three.js Editor**:
   - Visit https://threejs.org/editor/
   - Create your model
   - Export as GLB

### Option 3: Use a Simple Test Model

For quick testing, you can use the sample model that may have been downloaded, or create a simple cube in Blender.

## 🏃 Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - The terminal will show a local URL (usually `http://localhost:5173`)
   - Open this URL in your browser
   - **Important**: Use HTTPS or localhost (required for camera access)

3. **Allow camera permissions** when prompted

4. **Point your camera at the target image** (the poster you compiled)

5. **Watch the 3D model appear** when the target is detected!

## 📁 Project Structure

```
ar-video-demo/
├── assets/
│   ├── poster.png          # Your target image
│   ├── poster.mind         # Compiled MindAR target file
│   └── model.glb           # Your 3D model
├── mindar-init.js          # MindAR initialization module
├── scene.js                # 3D scene setup with GLTFLoader
├── main.js                 # Main entry point
├── index.html              # HTML file
├── package.json            # Dependencies
└── README.md               # This file
```

## 🔧 Customization

### Adjusting Model Scale and Position

Edit `main.js` to modify the model settings:

```javascript
await setupScene(anchor, './assets/model.glb', {
  scale: 1,              // Change scale (1 = original size)
  position: [0, 0, 0],   // [x, y, z] position
  rotation: [0, 0, 0],   // [x, y, z] rotation in radians
});
```

### Changing the Target Image

1. Replace `./assets/poster.png` with your new image
2. Recompile to generate a new `poster.mind` file
3. Update the path in `main.js` if needed:
   ```javascript
   await initializeMindAR('./assets/your-new-target.mind')
   ```

### Changing the 3D Model

1. Replace `./assets/model.glb` with your new model
2. Update the path in `main.js` if needed:
   ```javascript
   await setupScene(anchor, './assets/your-model.glb', {...})
   ```

## 🐛 Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Try a different browser (Chrome/Edge recommended)

### Model Not Appearing
- Verify `model.glb` exists and is a valid GLB file
- Check browser console for loading errors
- Ensure the target image is clearly visible and well-lit

### Target Not Detecting
- Ensure `poster.mind` is properly compiled
- Use a high-contrast, clear target image
- Ensure good lighting conditions
- Hold the target steady and at a reasonable distance

### Build Errors
- Run `npm install` again to ensure all dependencies are installed
- Check Node.js version (v16+ required)
- Clear `node_modules` and reinstall if needed

## 📚 Resources

- [MindAR Documentation](https://mind-ar.github.io/mind-ar-js-doc/)
- [Three.js Documentation](https://threejs.org/docs/)
- [GLTF/GLB Format](https://www.khronos.org/gltf/)

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to submit issues or pull requests to improve this demo!

