// SlopTube Popup JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentStatus();
    await loadHistory();
    await loadSettings();
    setupEventListeners();
});

async function loadCurrentStatus() {
    try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('youtube.com')) {
            document.getElementById('currentResult').innerHTML = `
                <span class="result-text">Not on YouTube</span>
                <span class="result-confidence"></span>
            `;
            return;
        }
        
        // Extract video ID from URL
        const videoId = extractVideoId(tab.url);
        
        if (!videoId) {
            document.getElementById('currentResult').innerHTML = `
                <span class="result-text">No video detected</span>
                <span class="result-confidence"></span>
            `;
            return;
        }
        
        // Get stored analysis results
        const result = await chrome.storage.local.get(`sloptube_${videoId}`);
        const analysis = result[`sloptube_${videoId}`];
        
        if (analysis) {
            updateCurrentStatus(analysis.aiProbability);
        } else {
            document.getElementById('currentResult').innerHTML = `
                <span class="result-text">Analyzing...</span>
                <span class="result-confidence"></span>
            `;
        }
    } catch (error) {
        console.error('Error loading current status:', error);
        document.getElementById('currentResult').innerHTML = `
            <span class="result-text">Error loading status</span>
            <span class="result-confidence"></span>
        `;
    }
}

function updateCurrentStatus(aiProbability) {
    const resultElement = document.getElementById('currentResult');
    const threshold = 0.7; // Default threshold
    
    let resultText = '';
    let resultClass = '';
    
    if (aiProbability > threshold) {
        resultText = '⚠️ Likely AI-Generated';
        resultClass = 'ai-detected';
    } else if (aiProbability > 0.3) {
        resultText = '🤔 Possibly AI-Generated';
        resultClass = 'ai-possible';
    } else {
        resultText = '✅ Likely Human Voice';
        resultClass = 'human-detected';
    }
    
    resultElement.innerHTML = `
        <span class="result-text ${resultClass}">${resultText}</span>
        <span class="result-confidence">${(aiProbability * 100).toFixed(1)}%</span>
    `;
}

async function loadHistory() {
    try {
        const storage = await chrome.storage.local.get(null);
        const historyList = document.getElementById('historyList');
        
        // Filter and sort sloptube results
        const sloptubeResults = Object.entries(storage)
            .filter(([key]) => key.startsWith('sloptube_'))
            .map(([key, value]) => ({
                videoId: key.replace('sloptube_', ''),
                ...value
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10); // Show last 10 results
        
        if (sloptubeResults.length === 0) {
            historyList.innerHTML = '<div class="no-history">No recent analysis available</div>';
            return;
        }
        
        historyList.innerHTML = sloptubeResults.map(result => {
            let resultClass = '';
            let resultText = '';
            
            if (result.aiProbability > 0.7) {
                resultClass = 'ai';
                resultText = 'AI';
            } else if (result.aiProbability > 0.3) {
                resultClass = 'possible';
                resultText = 'Maybe AI';
            } else {
                resultClass = 'human';
                resultText = 'Human';
            }
            
            const videoTitle = getVideoTitle(result.url) || 'YouTube Video';
            const timeAgo = formatTimeAgo(result.timestamp);
            
            return `
                <div class="history-item">
                    <a href="${result.url}" class="history-url" title="${videoTitle}">
                        ${videoTitle} • ${timeAgo}
                    </a>
                    <div class="history-result ${resultClass}">
                        ${resultText} (${(result.aiProbability * 100).toFixed(0)}%)
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers for history items
        historyList.querySelectorAll('.history-url').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.tabs.create({ url: link.href });
                window.close();
            });
        });
        
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyList').innerHTML = 
            '<div class="no-history">Error loading history</div>';
    }
}

async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            threshold: 0.7,
            enableNotifications: false,
            enableAutoAnalysis: true
        });
        
        document.getElementById('threshold').value = settings.threshold;
        document.querySelector('.threshold-value').textContent = 
            `${Math.round(settings.threshold * 100)}%`;
        
        document.getElementById('enableNotifications').checked = settings.enableNotifications;
        document.getElementById('enableAutoAnalysis').checked = settings.enableAutoAnalysis;
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function setupEventListeners() {
    // Threshold slider
    const thresholdSlider = document.getElementById('threshold');
    const thresholdValue = document.querySelector('.threshold-value');
    
    thresholdSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        thresholdValue.textContent = `${Math.round(value * 100)}%`;
        saveSettings();
    });
    
    // Checkboxes
    document.getElementById('enableNotifications').addEventListener('change', saveSettings);
    document.getElementById('enableAutoAnalysis').addEventListener('change', saveSettings);
    
    // Links
    document.getElementById('helpLink').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ 
            url: 'https://github.com/wabbit-corp/sloptube/blob/main/README.md' 
        });
    });
    
    document.getElementById('reportLink').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ 
            url: 'https://github.com/wabbit-corp/sloptube/issues' 
        });
    });
}

async function saveSettings() {
    try {
        const settings = {
            threshold: parseFloat(document.getElementById('threshold').value),
            enableNotifications: document.getElementById('enableNotifications').checked,
            enableAutoAnalysis: document.getElementById('enableAutoAnalysis').checked
        };
        
        await chrome.storage.sync.set(settings);
        
        // Notify content scripts about settings change
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url.includes('youtube.com')) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'SETTINGS_UPDATED',
                settings
            }).catch(() => {
                // Ignore errors if content script is not ready
            });
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function extractVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

function getVideoTitle(url) {
    // Try to extract video title from URL or use placeholder
    // In a real implementation, this could cache video titles
    return 'YouTube Video';
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else {
        return `${days}d ago`;
    }
}

// Refresh data every 5 seconds if popup is open
setInterval(async () => {
    await loadCurrentStatus();
}, 5000);