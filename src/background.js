// Background service worker - handles page capture and storage
importScripts('database.js');

const db = new SecureDB();
let isInitialized = false;

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Visual History Search installed');
  await initializeDB();
  
  // Set default settings
  await chrome.storage.local.set({
    enabled: true,
    daysToKeep: 30,
    excludeIncognito: true,
    excludeDomains: [],
    captureInterval: 3000 // Wait 3s before capturing (page fully loaded)
  });
});

// Initialize database
async function initializeDB() {
  try {
    await db.initEncryption();
    await db.openDB();
    isInitialized = true;
    console.log('Database initialized with encryption');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Ensure DB is initialized
async function ensureInitialized() {
  if (!isInitialized) {
    await initializeDB();
  }
}

// Listen for tab updates (page loads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only capture when page is fully loaded
  if (changeInfo.status === 'complete' && tab.url) {
    await capturePage(tab);
  }
});

// Capture page data and screenshot
async function capturePage(tab) {
  try {
    await ensureInitialized();
    
    // Get settings
    const settings = await chrome.storage.local.get([
      'enabled',
      'excludeIncognito',
      'excludeDomains'
    ]);
    
    // Check if capturing is enabled
    if (!settings.enabled) return;
    
    // Skip incognito tabs if configured
    if (settings.excludeIncognito && tab.incognito) return;
    
    // Skip excluded domains
    const url = new URL(tab.url);
    if (settings.excludeDomains?.includes(url.hostname)) return;
    
    // Skip non-http(s) protocols
    if (!tab.url.startsWith('http')) return;
    
    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;
    
    // Wait a bit to ensure page is fully rendered
    await new Promise(resolve => setTimeout(resolve, settings.captureInterval || 3000));
    
    // Capture screenshot
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'jpeg',
      quality: 60 // Balance quality and storage
    });
    
    // Get page content from content script
    const [pageData] = await chrome.tabs.sendMessage(tab.id, { action: 'getPageData' })
      .catch(() => [null]);
    
    if (!pageData) {
      console.warn('Could not get page data for:', tab.url);
      return;
    }
    
    // Extract domain
    const domain = url.hostname;
    
    // Calculate dominant color from screenshot
    const dominantColor = await getDominantColor(screenshot);
    
    // Prepare page data
    const pageRecord = {
      url: tab.url,
      title: tab.title || 'Untitled',
      domain,
      timestamp: Date.now(),
      dominantColor,
      textContent: pageData.textContent?.substring(0, 5000), // Limit to 5000 chars
      hasImages: pageData.hasImages,
      hasVideos: pageData.hasVideos,
      hasCode: pageData.hasCode
    };
    
    // Save to database
    await db.savePage(pageRecord, screenshot);
    
    console.log('Captured:', tab.title);
    
  } catch (error) {
    console.error('Error capturing page:', error);
  }
}

// Extract dominant color from screenshot
async function getDominantColor(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Sample center area (more likely to be content, not UI)
      const centerX = Math.floor(img.width / 2);
      const centerY = Math.floor(img.height / 2);
      const sampleSize = 50;
      
      const imageData = ctx.getImageData(
        Math.max(0, centerX - sampleSize),
        Math.max(0, centerY - sampleSize),
        Math.min(sampleSize * 2, img.width),
        Math.min(sampleSize * 2, img.height)
      );
      
      // Calculate average color
      let r = 0, g = 0, b = 0;
      const pixels = imageData.data.length / 4;
      
      for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
      }
      
      resolve({
        r: Math.round(r / pixels),
        g: Math.round(g / pixels),
        b: Math.round(b / pixels)
      });
    };
    img.onerror = () => resolve({ r: 128, g: 128, b: 128 }); // Default gray
    img.src = dataUrl;
  });
}

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    await ensureInitialized();
    
    switch (request.action) {
      case 'search':
        const results = await db.searchPages(request.query);
        sendResponse({ results });
        break;
        
      case 'getScreenshot':
        const screenshot = await db.getScreenshot(request.pageId);
        sendResponse({ screenshot });
        break;
        
      case 'getStats':
        const stats = await db.getStats();
        sendResponse({ stats });
        break;
        
      case 'cleanOldEntries':
        const deleted = await db.cleanOldEntries(request.daysToKeep);
        sendResponse({ deleted });
        break;
        
      case 'deleteAllData':
        await db.deleteAllData();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Periodic cleanup (daily)
chrome.alarms.create('cleanupOldEntries', { periodInMinutes: 1440 }); // 24 hours

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupOldEntries') {
    await ensureInitialized();
    const settings = await chrome.storage.local.get(['daysToKeep']);
    const deleted = await db.cleanOldEntries(settings.daysToKeep || 30);
    console.log(`Cleaned up ${deleted} old entries`);
  }
});
