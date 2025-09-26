// SlopTube - AI Voice Detection Content Script
class AIVoiceDetector {
    constructor() {
        this.isAnalyzing = false;
        this.audioContext = null;
        this.analyser = null;
        this.videoElement = null;
        this.detectionResults = [];
        this.threshold = 0.7; // AI detection threshold
        this.settings = {
            threshold: 0.7,
            enableNotifications: false,
            enableAutoAnalysis: true
        };
        
        this.init();
    }
    
    async init() {
        console.log('SlopTube: Initializing AI voice detector...');
        
        // Load settings
        await this.loadSettings();
        
        // Wait for page to load and find video element
        this.findVideoElement();
        
        // Set up observers for page changes
        this.setupObservers();
        
        // Create UI elements
        this.createUI();
        
        // Listen for settings updates
        this.setupMessageListener();
    }
    
    async loadSettings() {
        try {
            const settings = await chrome.storage.sync.get({
                threshold: 0.7,
                enableNotifications: false,
                enableAutoAnalysis: true
            });
            this.settings = settings;
            this.threshold = settings.threshold;
        } catch (error) {
            console.error('SlopTube: Error loading settings:', error);
        }
    }
    
    setupMessageListener() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SETTINGS_UPDATED') {
                this.settings = message.settings;
                this.threshold = message.settings.threshold;
                this.updateUI(); // Refresh UI with new threshold
            }
        });
    }
    
    findVideoElement() {
        // Look for YouTube video element
        const video = document.querySelector('video');
        if (video && video !== this.videoElement) {
            this.videoElement = video;
            this.setupAudioAnalysis();
        }
        
        // Keep looking if not found yet
        if (!this.videoElement) {
            setTimeout(() => this.findVideoElement(), 1000);
        }
    }
    
    setupObservers() {
        // Observer for page navigation (YouTube is SPA)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if we need to reattach to new video
                    const newVideo = document.querySelector('video');
                    if (newVideo && newVideo !== this.videoElement) {
                        this.videoElement = newVideo;
                        this.setupAudioAnalysis();
                        this.updateUI();
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    async setupAudioAnalysis() {
        if (!this.videoElement) return;
        
        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create media element source
            const source = this.audioContext.createMediaElementSource(this.videoElement);
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect nodes
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Start analysis
            this.startAnalysis();
            
            console.log('SlopTube: Audio analysis setup complete');
            
        } catch (error) {
            console.error('SlopTube: Error setting up audio analysis:', error);
        }
    }
    
    startAnalysis() {
        if (this.isAnalyzing || !this.settings.enableAutoAnalysis) return;
        
        this.isAnalyzing = true;
        this.analyzeAudio();
    }
    
    analyzeAudio() {
        if (!this.analyser || !this.isAnalyzing) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const freqArray = new Float32Array(bufferLength);
        
        this.analyser.getByteTimeDomainData(dataArray);
        this.analyser.getFloatFrequencyData(freqArray);
        
        // Analyze audio features for AI detection
        const features = this.extractAudioFeatures(dataArray, freqArray);
        const aiProbability = this.detectAIVoice(features);
        
        // Update detection results
        this.updateDetectionResults(aiProbability);
        
        // Continue analysis
        if (this.isAnalyzing) {
            requestAnimationFrame(() => this.analyzeAudio());
        }
    }
    
    extractAudioFeatures(timeData, freqData) {
        // Extract features commonly associated with AI-generated voices
        const features = {};
        
        // 1. Spectral centroid (brightness)
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < freqData.length; i++) {
            const magnitude = Math.pow(10, freqData[i] / 20); // Convert dB to linear
            weightedSum += magnitude * i;
            magnitudeSum += magnitude;
        }
        
        features.spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
        
        // 2. Zero crossing rate (measure of voice naturalness)
        let zeroCrossings = 0;
        for (let i = 1; i < timeData.length; i++) {
            if ((timeData[i] >= 128) !== (timeData[i - 1] >= 128)) {
                zeroCrossings++;
            }
        }
        features.zeroCrossingRate = zeroCrossings / timeData.length;
        
        // 3. RMS Energy
        let rmsSum = 0;
        for (let i = 0; i < timeData.length; i++) {
            const sample = (timeData[i] - 128) / 128;
            rmsSum += sample * sample;
        }
        features.rmsEnergy = Math.sqrt(rmsSum / timeData.length);
        
        // 4. Spectral flatness (measure of noise-like quality)
        let geometricMean = 0;
        let arithmeticMean = 0;
        let count = 0;
        
        for (let i = 1; i < freqData.length; i++) {
            const magnitude = Math.pow(10, freqData[i] / 20);
            if (magnitude > 0) {
                geometricMean += Math.log(magnitude);
                arithmeticMean += magnitude;
                count++;
            }
        }
        
        if (count > 0) {
            geometricMean = Math.exp(geometricMean / count);
            arithmeticMean = arithmeticMean / count;
            features.spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
        } else {
            features.spectralFlatness = 0;
        }
        
        return features;
    }
    
    detectAIVoice(features) {
        // Simple heuristic-based AI voice detection
        // In a real implementation, this would use a trained ML model
        
        let aiScore = 0;
        
        // AI voices often have:
        // - Higher spectral centroid (more metallic/digital sound)
        // - Lower zero crossing rate (less natural variations)
        // - Consistent RMS energy (less human-like dynamics)
        // - Higher spectral flatness (more noise-like)
        
        // Normalize and weight features
        const normalizedCentroid = Math.min(features.spectralCentroid / 1000, 1);
        const normalizedZCR = Math.min(features.zeroCrossingRate * 10, 1);
        const normalizedRMS = Math.min(features.rmsEnergy * 5, 1);
        const normalizedFlatness = Math.min(features.spectralFlatness * 2, 1);
        
        // AI detection scoring (higher = more likely AI)
        aiScore += normalizedCentroid * 0.3; // Higher centroid suggests AI
        aiScore += (1 - normalizedZCR) * 0.3; // Lower ZCR suggests AI
        aiScore += (1 - normalizedRMS) * 0.2; // Too consistent RMS suggests AI
        aiScore += normalizedFlatness * 0.2; // Higher flatness suggests AI
        
        return Math.min(Math.max(aiScore, 0), 1);
    }
    
    updateDetectionResults(aiProbability) {
        const timestamp = Date.now();
        
        // Keep rolling window of last 10 seconds
        const windowSize = 10000; // 10 seconds
        this.detectionResults = this.detectionResults.filter(
            result => timestamp - result.timestamp < windowSize
        );
        
        // Add current result
        this.detectionResults.push({
            timestamp,
            aiProbability
        });
        
        // Calculate average probability
        const avgProbability = this.detectionResults.reduce(
            (sum, result) => sum + result.aiProbability, 0
        ) / this.detectionResults.length;
        
        // Update UI
        this.updateUI(avgProbability);
        
        // Store results
        this.storeResults(avgProbability);
    }
    
    createUI() {
        // Create detector indicator
        const indicator = document.createElement('div');
        indicator.id = 'sloptube-indicator';
        indicator.innerHTML = `
            <div class="sloptube-container">
                <div class="sloptube-icon">🤖</div>
                <div class="sloptube-status">
                    <div class="sloptube-title">AI Voice Detector</div>
                    <div class="sloptube-result">Analyzing...</div>
                    <div class="sloptube-confidence"></div>
                </div>
            </div>
        `;
        
        // Try to add to YouTube's info panel
        const targetContainer = document.querySelector('#info-contents') || 
                               document.querySelector('#secondary') || 
                               document.body;
        
        if (targetContainer) {
            targetContainer.appendChild(indicator);
        }
    }
    
    updateUI(aiProbability = 0) {
        const indicator = document.getElementById('sloptube-indicator');
        if (!indicator) return;
        
        const result = indicator.querySelector('.sloptube-result');
        const confidence = indicator.querySelector('.sloptube-confidence');
        
        if (aiProbability > this.threshold) {
            result.textContent = '⚠️ Likely AI-Generated';
            result.className = 'sloptube-result sloptube-ai-detected';
            
            // Notify background script if this is a new high-confidence detection
            if (this.settings.enableNotifications) {
                chrome.runtime.sendMessage({
                    type: 'AI_DETECTED',
                    data: { aiProbability }
                });
            }
        } else if (aiProbability > 0.3) {
            result.textContent = '🤔 Possibly AI-Generated';
            result.className = 'sloptube-result sloptube-ai-possible';
        } else {
            result.textContent = '✅ Likely Human Voice';
            result.className = 'sloptube-result sloptube-human-detected';
        }
        
        confidence.textContent = `Confidence: ${(aiProbability * 100).toFixed(1)}%`;
        
        // Send analysis complete message
        chrome.runtime.sendMessage({
            type: 'ANALYSIS_COMPLETE',
            data: { aiProbability }
        });
    }
    
    storeResults(avgProbability) {
        // Store results for popup display
        const videoId = this.getVideoId();
        if (videoId) {
            chrome.storage.local.set({
                [`sloptube_${videoId}`]: {
                    aiProbability: avgProbability,
                    timestamp: Date.now(),
                    url: window.location.href
                }
            });
        }
    }
    
    getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }
    
    stop() {
        this.isAnalyzing = false;
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

// Initialize when DOM is ready
let detector = null;

function initDetector() {
    if (!detector) {
        detector = new AIVoiceDetector();
    }
}

// Start detection
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetector);
} else {
    initDetector();
}

// Handle page navigation (YouTube SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Reinitialize on navigation
        setTimeout(initDetector, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (detector) {
        detector.stop();
    }
});