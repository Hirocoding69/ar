# Assets Folder

Place your AR marker and video files in this folder.

## Required Files

1. **target.mind** - Compiled MindAR marker file
   - You can create this using the [MindAR Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
   - Upload a high-contrast image (PNG/JPG, minimum 300x300px)
   - Download the compiled `.mind` file
   - Rename it to `target.mind` and place it here

2. **video.mp4** - Video file to display on the marker
   - MP4 format recommended
   - The video will play when the marker is detected
   - Make sure the video is optimized for web (not too large)

## File Structure

```
assets/
  ├── target.mind    (required)
  ├── video.mp4      (required)
  └── README.md      (this file)
```

## Getting a Marker File

1. Go to https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload a high-contrast marker image
3. Download the compiled `.mind` file
4. Rename it to `target.mind` and place it in this folder

## Example Marker Images

Good marker images have:
- High contrast (black and white work best)
- Clear patterns or shapes
- No repeating patterns
- Minimum 300x300 pixels
- Square aspect ratio recommended

