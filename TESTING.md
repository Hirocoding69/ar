Testing Guide - Run Locally

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

This will install:

- `three` - Three.js 3D library
- `vite` - Development server

**Note:** MindAR is loaded via CDN in `index.html`, so no npm package is needed for it.

### Step 2: Create the MindAR Target File

You need to compile your `poster.png` into a `.mind` file:

**Option A: Using Web Compiler (Easiest)**

1. Open: https://mind-ar.github.io/mind-ar-js-doc/tools/compile
2. Click "Choose File" and select `assets/poster.png`
3. Click "Compile"
4. Download the generated file
5. Save it as `assets/poster.mind`

**Option B: Using CLI**

```bash
npm install -g @mindar/mindar-cli
mindar-image-target assets/poster.png
# Move the generated .mind file to assets/poster.mind
```

### Step 3: Verify Required Files

Make sure you have:

- ✅ `assets/poster.png` (you have this)
- ✅ `assets/poster.mind` (you need to create this)
- ✅ `assets/model.glb` (you have this)

### Step 4: Start the Development Server

```bash
npm run dev
```

You should see output like:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser

1. **Open the URL** shown (usually `http://localhost:5173`)
2. **Allow camera permissions** when prompted
3. **Print or display** your `poster.png` image on a screen
4. **Point your camera** at the poster image
5. **Watch the 3D model appear!** 🎉

## 🧪 Testing Checklist

- [ ] Dependencies installed (`npm install` completed)
- [ ] `poster.mind` file exists in `assets/` folder
- [ ] Development server running (`npm run dev`)
- [ ] Browser opened to localhost URL
- [ ] Camera permissions granted
- [ ] Target image (poster.png) visible to camera
- [ ] 3D model appears when target is detected
- [ ] Model tracks as you move the poster

## 🔧 Troubleshooting

### "Cannot find module 'mindar-image-three'"

```bash
npm install
```

### "Failed to load poster.mind"

- Make sure `assets/poster.mind` exists
- Verify the file was compiled correctly
- Check browser console for specific error

### Camera not working

- Use **HTTPS** or **localhost** (required for camera access)
- Check browser permissions (Settings → Privacy → Camera)
- Try a different browser (Chrome/Edge recommended)

### Model not appearing

- Check browser console for errors
- Verify `model.glb` is a valid GLB file
- Ensure target image is clearly visible and well-lit

### "Target not detected"

- Use a high-contrast, clear image
- Ensure good lighting
- Hold the poster steady
- Try printing the image larger

## 📱 Testing on Mobile

1. Find your computer's local IP address:

   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

2. Start Vite with host flag:

   ```bash
   npm run dev -- --host
   ```

3. Open the Network URL on your mobile device (must be on same WiFi)

4. Test with your phone's camera!

## 🎯 Expected Behavior

1. **Initialization**: Status shows "Initializing..."
2. **Ready**: Status changes to "Ready - Point camera at target"
3. **Detecting**: Status shows "Searching for target..." (yellow)
4. **Tracking**: Status shows "Target Detected! 🎉" (green) and 3D model appears
5. **Lost**: When target moves out of view, status returns to "Searching..."

## 💡 Tips for Best Results

- **Print the poster** on paper for physical testing
- **Use good lighting** - avoid shadows on the target
- **Hold steady** - let the camera focus before moving
- **Use high contrast** images for better detection
- **Test at different distances** - find the optimal range
