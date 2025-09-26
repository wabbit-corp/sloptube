# SlopTube - AI Voice Detector

A Chrome extension that analyzes audio from YouTube videos to detect AI-generated voices using advanced audio analysis techniques.

## Features

- **Real-time Audio Analysis**: Continuously monitors audio from YouTube videos
- **AI Voice Detection**: Uses audio feature extraction to identify potentially AI-generated voices
- **Visual Indicators**: Shows detection results directly on YouTube video pages
- **History Tracking**: Keeps track of analyzed videos and results
- **Customizable Settings**: Adjustable detection threshold and notification preferences
- **Privacy-focused**: All analysis happens locally in the browser

## How It Works

SlopTube analyzes several audio characteristics that are commonly different between human and AI-generated voices:

1. **Spectral Centroid** - Measures the "brightness" of the audio
2. **Zero Crossing Rate** - Indicates naturalness of voice variations
3. **RMS Energy** - Analyzes consistency of audio levels
4. **Spectral Flatness** - Measures noise-like qualities

The extension combines these features using heuristic algorithms to provide a probability score for AI-generated content.

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The SlopTube icon should appear in your Chrome toolbar

## Usage

1. Navigate to any YouTube video
2. The extension will automatically start analyzing the audio
3. Look for the AI Voice Detector panel that appears near the video information
4. View results in real-time as the video plays
5. Click the extension icon in the toolbar to view detailed results and settings

## Detection Results

- **🤖 Likely AI-Generated** (Red) - High confidence AI detection (>70%)
- **🤔 Possibly AI-Generated** (Yellow) - Medium confidence (30-70%)
- **✅ Likely Human Voice** (Green) - Low AI probability (<30%)

## Settings

Access settings through the popup by clicking the extension icon:

- **Detection Threshold**: Adjust sensitivity (10%-100%)
- **Notifications**: Enable browser notifications for AI detection
- **Auto-Analysis**: Automatically analyze videos (recommended)

## Privacy & Security

- All audio analysis happens locally in your browser
- No audio data is sent to external servers
- Analysis results are stored locally and cleaned up automatically
- No personal information is collected or transmitted

## Technical Details

- Built with Chrome Extension Manifest V3
- Uses Web Audio API for real-time audio analysis
- Implements feature extraction algorithms for voice analysis
- Responsive design works on all screen sizes
- Compatible with YouTube's dynamic page loading

## Limitations

- Detection accuracy may vary based on audio quality
- Works best with clear speech audio
- May have false positives with heavily processed audio
- Requires audio playback to perform analysis
- Heuristic-based detection (not machine learning trained)

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is open source. Please check the repository for license details.

## Disclaimer

This tool provides estimates based on audio analysis and should not be considered definitive proof of AI-generated content. Results may vary and should be interpreted accordingly.