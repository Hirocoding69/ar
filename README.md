# Zappar WebAR Video Demo

A minimal WebAR project using Zappar SDK for Three.js that displays a video on a plane when an image target is detected.

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The server will start with HTTPS (Parcel will show you the URL, typically `https://localhost:1234`)

## Setup Instructions

### 1. Replace the Video URL

Open `src/main.js` and find this section (around line 7):

```javascript
// Replace VIDEO_URL_HERE with your video URL (must be HTTPS)
const VIDEO_URL = "VIDEO_URL_HERE";
```

Replace `'VIDEO_URL_HERE'` with your actual video URL. **Important:**

- The video URL must be served over HTTPS
- The video should be in a web-compatible format (MP4 recommended)
- Example: `const VIDEO_URL = 'https://example.com/video.mp4';`

### 2. Replace the Target File

In the same file, find this section (around line 10):

```javascript
// Replace TARGET_FILE_HERE with your .zpt file path
const TARGET_FILE = "TARGET_FILE_HERE";
```

Replace `'TARGET_FILE_HERE'` with the path to your `.zpt` file. This can be:

- A relative path: `'assets/target.zpt'`
- An absolute URL: `'https://example.com/target.zpt'`

**Note:** The `.zpt` file is a Zappar Image Tracker target file. You can create one using Zappar's tools at [zap.works](https://zap.works).

### 3. Build for Production

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory. The `--public-url='./'` flag ensures relative paths work correctly when deployed.

### 4. Testing

1. Run `npm start` to start the development server
2. Open the HTTPS URL shown in the terminal (typically `https://localhost:1234`)
3. Grant camera permissions when prompted (camera starts automatically)
4. Point your camera at the target image
5. The video should appear as a plane on top of the tracked image

## Features

- ✅ Clean project structure with npm packages
- ✅ ES module imports
- ✅ Parcel bundler with HTTPS support
- ✅ Camera starts automatically on page load
- ✅ Video loops automatically
- ✅ Plays inline (no fullscreen on mobile)
- ✅ Responsive design

## Browser Compatibility

- Chrome/Edge (recommended)
- Safari (iOS 11+)
- Firefox

## Deploying to Vercel

### Quick Deploy (Recommended)

1. **Push your code to GitHub** (if not already done)

2. **Go to [vercel.com](https://vercel.com)** and sign in with your GitHub account

3. **Click "Add New Project"**

4. **Import your GitHub repository**

5. **Vercel will auto-detect Parcel** - no configuration needed!

6. **Click "Deploy"**

That's it! Your site will be live with HTTPS automatically.

### Alternative: Deploy via Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. In your project directory, run:

   ```bash
   vercel
   ```

3. Follow the prompts to deploy

### Important Notes for Vercel Deployment

- ✅ Vercel automatically provides HTTPS (required for camera access)
- ✅ The `vercel.json` file is included for explicit configuration (optional)
- ✅ Make sure your `.zpt` file and video are accessible:
  - Host them on Vercel (place in `src/` directory) OR
  - Use absolute URLs (hosted elsewhere)
- ✅ After deployment, update `VIDEO_URL` and `TARGET_FILE` in `src/main.js` with your production URLs

## Troubleshooting

- **Video not playing**: Ensure the video URL is HTTPS and the video format is supported
- **Tracker not loading**: Check that the `.zpt` file path is correct and accessible
- **Camera not working**: Ensure you're on HTTPS and have granted camera permissions
- **Video not visible**: Check browser console for errors and verify the target image is being detected
- **Vercel deployment issues**: Make sure `vercel.json` is in the root directory and the build completes successfully
