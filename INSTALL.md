# Installation Guide

## Quick Installation

1. **Download the Extension**
   - Clone or download this repository to your local machine
   - Extract if downloaded as ZIP

2. **Enable Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `sloptube` directory (containing manifest.json)
   - The extension will appear in your extensions list

4. **Start Using**
   - Navigate to any YouTube video
   - The AI Voice Detector will automatically start analyzing
   - Look for the detector panel near the video information
   - Click the extension icon in the toolbar for settings

## Troubleshooting

### Extension Not Loading
- Ensure `manifest.json` is in the root of the selected folder
- Check that all required files are present
- Look for error messages in the extensions page

### No Detection Results
- Make sure you're on a YouTube video page
- Check that the video has audio and is playing
- Verify auto-analysis is enabled in settings

### Audio Context Issues
- Click play on the video to initialize audio context
- Some browsers require user interaction before audio access
- Check browser permissions for the extension

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Should work (Chromium-based)
- **Firefox**: Not supported (different extension format)
- **Safari**: Not supported

## Permissions Explained

- **activeTab**: Access to current YouTube tab for content injection
- **storage**: Save settings and analysis history locally
- **notifications**: Show alerts for high-confidence AI detection
- **host_permissions**: Access YouTube.com for audio analysis

## Performance Notes

- The extension runs analysis in real-time during video playback
- CPU usage is minimal due to optimized audio processing
- All analysis happens locally - no network requests
- Storage cleanup happens automatically for old results