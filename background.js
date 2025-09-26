// SlopTube Background Script
chrome.runtime.onInstalled.addListener(() => {
    console.log('SlopTube AI Voice Detector installed');
    
    // Set default settings
    chrome.storage.sync.set({
        threshold: 0.7,
        enableNotifications: false,
        enableAutoAnalysis: true
    });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case 'AI_DETECTED':
            handleAIDetection(message.data, sender.tab);
            break;
        case 'ANALYSIS_COMPLETE':
            handleAnalysisComplete(message.data, sender.tab);
            break;
        default:
            break;
    }
});

async function handleAIDetection(data, tab) {
    try {
        const settings = await chrome.storage.sync.get(['enableNotifications']);
        
        if (settings.enableNotifications && data.aiProbability > 0.7) {
            // Show notification for high-confidence AI detection
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'SlopTube - AI Voice Detected',
                message: `AI-generated voice detected with ${Math.round(data.aiProbability * 100)}% confidence`,
                contextMessage: tab.title
            });
        }
        
        // Update badge
        updateBadge(tab.id, data.aiProbability);
        
    } catch (error) {
        console.error('Error handling AI detection:', error);
    }
}

function handleAnalysisComplete(data, tab) {
    // Update badge with final results
    updateBadge(tab.id, data.aiProbability);
}

function updateBadge(tabId, aiProbability) {
    if (aiProbability > 0.7) {
        chrome.action.setBadgeText({ text: '⚠️', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
    } else if (aiProbability > 0.3) {
        chrome.action.setBadgeText({ text: '?', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#ffaa00' });
    } else {
        chrome.action.setBadgeText({ text: '✓', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#44ff44' });
    }
}

// Clear badge when tab is closed or navigated away from YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && !changeInfo.url.includes('youtube.com')) {
        chrome.action.setBadgeText({ text: '', tabId });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.action.setBadgeText({ text: '', tabId });
});

// Periodic cleanup of old storage data
setInterval(async () => {
    try {
        const storage = await chrome.storage.local.get(null);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        const keysToRemove = [];
        
        for (const [key, value] of Object.entries(storage)) {
            if (key.startsWith('sloptube_') && value.timestamp) {
                if (now - value.timestamp > maxAge) {
                    keysToRemove.push(key);
                }
            }
        }
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            console.log(`Cleaned up ${keysToRemove.length} old analysis records`);
        }
        
    } catch (error) {
        console.error('Error during storage cleanup:', error);
    }
}, 60 * 60 * 1000); // Run every hour