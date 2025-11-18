# AR Video Tracker

A mobile-optimized web application that uses Augmented Reality (AR) to play videos anchored to physical markers like cards or paper money. The video tracks the marker's position and orientation in real-time.

## Features

- **Real-time 6DOF Tracking**: Position and rotation tracking on all axes
- **Smooth Video Playback**: Videos stay locked to markers with minimal jitter
- **Custom Markers**: Upload your own marker images
- **Mobile Optimized**: Works on iOS Safari and Android Chrome
- **Debug Mode**: View tracking confidence, FPS, and position data
- **Smooth Interpolation**: Kalman filtering and exponential smoothing for stable tracking

## Technology Stack

- **MindAR**: Image-based AR tracking library
- **Three.js**: 3D rendering engine
- **GSAP**: Smooth animations (optional)
- **Vanilla JavaScript**: Lightweight, no framework overhead

## Getting Started

### Prerequisites

- Modern mobile browser (iOS Safari 11+, Chrome Android 80+)
- HTTPS connection (required for camera access)
- Camera permissions

### Installation

1. Clone or download this repository
2. Serve the files using a local web server (required for camera access)

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

3. Open `http://localhost:8000` in your mobile browser
4. Allow camera permissions when prompted

### Usage

1. **Upload Marker Image**
   - Click on the marker upload area
   - Select a high-contrast image (minimum 300x300px)
   - Recommended: Images with distinct corners and patterns
   - Avoid: Solid colors, reflective surfaces, low contrast

2. **Upload Video**
   - Click on the video upload area
   - Select an MP4 or WebM video file
   - Video will play automatically when marker is detected

3. **Start AR Experience**
   - Click "Start AR Experience"
   - Point your camera at the marker
   - Video will appear anchored to the marker

4. **Use Default Marker**
   - Click "Use Default Marker" to use a built-in marker pattern
   - Print or display the marker on a screen
   - Point camera at the marker

## Marker Requirements

For best tracking results, your marker should:

- **High Contrast**: Clear distinction between light and dark areas
- **Rich Features**: Multiple corners, edges, and unique patterns
- **Minimum Size**: 300x300 pixels (larger is better)
- **Unique Pattern**: Avoid repetitive or symmetrical patterns
- **Non-reflective**: Matte surfaces work best
- **Stable**: Keep marker flat and still during tracking

### Example Good Markers

- Playing cards (especially face cards with complex patterns)
- Paper money (bills with detailed designs)
- QR codes or barcodes
- Custom printed markers with high-contrast patterns
- Magazine covers with distinct graphics

## Performance

- **Target FPS**: 30+ FPS on mid-range phones
- **Tracking Latency**: <100ms
- **Initial Detection**: <2 seconds
- **Video Rendering**: <50ms after detection

## Browser Compatibility

- ✅ iOS Safari 11+
- ✅ Chrome Android 80+
- ✅ Chrome Desktop (for testing)
- ✅ Firefox (limited support)
- ❌ Internet Explorer (not supported)

## Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS (or localhost)
- Check browser permissions for camera access
- Try refreshing the page
- Some browsers require user interaction before camera access

### Marker Not Detecting

- Ensure good lighting (avoid low light)
- Hold marker steady and flat
- Move closer to marker (optimal distance: 20-50cm)
- Use a high-contrast marker image
- Check that marker is fully visible in camera view

### Video Not Playing

- Ensure video file is in supported format (MP4/WebM)
- Check that video has loaded (wait for "loadeddata" event)
- Some browsers require user interaction before autoplay
- Try tapping the video area

### Performance Issues

- Reduce video resolution/bitrate
- Use smaller marker images
- Close other applications
- Ensure good lighting for better tracking

## Project Structure

```
ar-video-demo/
├── index.html              # Main HTML file
├── styles.css              # Application styles
├── App.js                  # Main application logic
├── components/
│   ├── CameraView.js      # Camera permission handling
│   └── VideoOverlay.js    # Video rendering component
├── utils/
│   ├── arTracker.js       # AR tracking logic
│   └── smoothing.js       # Tracking smoothing algorithms
└── README.md              # This file
```

## Advanced Features

### Debug Mode

Click the settings icon (⚙️) in the AR view to enable debug mode. This shows:
- Tracking confidence score
- Current FPS
- Marker position (x, y, z)
- Marker rotation (pitch, yaw, roll)

### Customization

You can customize tracking behavior by modifying parameters in `App.js`:

```javascript
this.arTracker = new ARTracker(container, {
    maxTrack: 1,              // Maximum markers to track
    warmupTolerance: 0,       // Frames before considering marker valid
    missTolerance: 10         // Frames before considering marker lost
});
```

Smoothing can be adjusted in `VideoOverlay.js`:

```javascript
this.smoothingFilter = new ARSmoothingFilter({
    smoothingAlpha: 0.8,      // Position smoothing (0-1, higher = smoother)
    smoothingBeta: 0.6,       // Velocity smoothing (0-1)
    kalmanEnabled: true       // Enable Kalman filtering
});
```

## Limitations

- Requires HTTPS (except localhost)
- Camera access must be granted
- Performance depends on device capabilities
- Tracking quality depends on lighting and marker quality
- Some mobile browsers have autoplay restrictions

## Future Enhancements

- Multiple marker support (different videos per marker)
- Video playlist for single marker
- Playback controls (play/pause via tap)
- Save favorite markers
- Share AR experience via URL
- Marker training/calibration tool
- Support for NFT (Natural Feature Tracking) markers

## License

This project is open source and available for personal and commercial use.

## Credits

- [MindAR](https://github.com/hiukim/mind-ar-js) - AR tracking library
- [Three.js](https://threejs.org/) - 3D graphics library
- [GSAP](https://greensock.com/gsap/) - Animation library

## Support

For issues, questions, or contributions, please open an issue on the repository.

# ar
