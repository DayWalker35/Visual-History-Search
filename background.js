// Background service worker - handles page capture and storage
// Database implementation inline to avoid module issues

let db = null;
let encryptionKey = null;
const dbName = 'VisualHistoryDB';
const dbVersion = 1;

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
    captureInterval: 3000
  });
});

// Initialize database and encryption
async function initializeDB() {
  try {
    await initEncryption();
    await openDB();
    console.log('Database initialized with encryption');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Initialize encryption key
async function initEncryption() {
  const stored = await chrome.storage.local.get(['encryptionKey']);
  
  if (stored.encryptionKey) {
    encryptionKey = await crypto.subtle.importKey(
      'jwk',
      stored.encryptionKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } else {
    encryptionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exportedKey = await crypto.subtle.exportKey('jwk', encryptionKey);
    await chrome.storage.local.set({ encryptionKey: exportedKey });
  }
}

// Open IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains('pages')) {
        const pageStore = database.createObjectStore('pages', { keyPath: 'id', autoIncrement: true });
        pageStore.createIndex('url', 'url', { unique: false });
        pageStore.createIndex('timestamp', 'timestamp', { unique: false });
        pageStore.createIndex('domain', 'domain', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('screenshots')) {
        const screenshotStore = database.createObjectStore('screenshots', { keyPath: 'pageId' });
        screenshotStore.createIndex('pageId', 'pageId', { unique: true });
      }
    };
  });
}

// Encrypt data
async function encrypt(data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    encodedData
  );
  
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encryptedData))
  };
}

// Decrypt data
async function decrypt(encryptedObj) {
  const iv = new Uint8Array(encryptedObj.iv);
  const data = new Uint8Array(encryptedObj.data);
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    data
  );
  
  const decodedData = new TextDecoder().decode(decryptedData);
  return JSON.parse(decodedData);
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await capturePage(tab);
  }
});

// Capture page
async function capturePage(tab) {
  try {
    if (!db || !encryptionKey) {
      await initializeDB();
    }
    
    const settings = await chrome.storage.local.get([
      'enabled',
      'excludeIncognito',
      'excludeDomains'
    ]);
    
    if (!settings.enabled) return;
    if (settings.excludeIncognito && tab.incognito) return;
    if (!tab.url.startsWith('http')) return;
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;
    
    const url = new URL(tab.url);
    if (settings.excludeDomains?.includes(url.hostname)) return;
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'jpeg',
      quality: 60
    });
    
    const [pageData] = await chrome.tabs.sendMessage(tab.id, { action: 'getPageData' })
      .catch(() => [null]);
    
    if (!pageData) return;
    
    const dominantColor = await getDominantColor(screenshot);
    
    const pageRecord = {
      url: tab.url,
      title: tab.title || 'Untitled',
      domain: url.hostname,
      timestamp: Date.now(),
      dominantColor,
      textContent: pageData.textContent?.substring(0, 5000),
      hasImages: pageData.hasImages,
      hasVideos: pageData.hasVideos,
      hasCode: pageData.hasCode
    };
    
    await savePage(pageRecord, screenshot);
    console.log('Captured:', tab.title);
    
  } catch (error) {
    console.error('Error capturing page:', error);
  }
}

// Save page to database
async function savePage(pageData, screenshot) {
  const transaction = db.transaction(['pages', 'screenshots'], 'readwrite');
  const pageStore = transaction.objectStore('pages');
  const pageRequest = pageStore.add(pageData);
  
  return new Promise((resolve, reject) => {
    pageRequest.onsuccess = async () => {
      const pageId = pageRequest.result;
      
      if (screenshot) {
        const encryptedScreenshot = await encrypt(screenshot);
        const screenshotStore = transaction.objectStore('screenshots');
        await screenshotStore.add({
          pageId,
          screenshot: encryptedScreenshot
        });
      }
      
      resolve(pageId);
    };
    
    pageRequest.onerror = () => reject(pageRequest.error);
  });
}

// Get dominant color
async function getDominantColor(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const centerX = Math.floor(img.width / 2);
      const centerY = Math.floor(img.height / 2);
      const sampleSize = 50;
      
      const imageData = ctx.getImageData(
        Math.max(0, centerX - sampleSize),
        Math.max(0, centerY - sampleSize),
        Math.min(sampleSize * 2, img.width),
        Math.min(sampleSize * 2, img.height)
      );
      
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
    img.onerror = () => resolve({ r: 128, g: 128, b: 128 });
    img.src = dataUrl;
  });
}

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (!db) await initializeDB();
    
    switch (request.action) {
      case 'search':
        const results = await searchPages(request.query);
        sendResponse({ results });
        break;
        
      case 'getScreenshot':
        const screenshot = await getScreenshot(request.pageId);
        sendResponse({ screenshot });
        break;
        
      case 'getStats':
        const stats = await getStats();
        sendResponse({ stats });
        break;
        
      case 'cleanOldEntries':
        const deleted = await cleanOldEntries(request.daysToKeep);
        sendResponse({ deleted });
        break;
        
      case 'deleteAllData':
        await deleteAllData();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  })();
  
  return true;
});

// Search pages
async function searchPages(query = {}) {
  const { text, color, startDate, endDate, limit = 50 } = query;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pages'], 'readonly');
    const store = transaction.objectStore('pages');
    const request = store.getAll();
    
    request.onsuccess = () => {
      let results = request.result;
      
      if (text) {
        const searchText = text.toLowerCase();
        results = results.filter(page => 
          page.title?.toLowerCase().includes(searchText) ||
          page.url?.toLowerCase().includes(searchText) ||
          page.textContent?.toLowerCase().includes(searchText)
        );
      }
      
      if (color) {
        results = results.filter(page => {
          if (!page.dominantColor || !color) return false;
          const r = page.dominantColor.r - color.r;
          const g = page.dominantColor.g - color.g;
          const b = page.dominantColor.b - color.b;
          const distance = Math.sqrt(r * r + g * g + b * b);
          return distance < 50;
        });
      }
      
      if (startDate) {
        results = results.filter(page => page.timestamp >= startDate);
      }
      if (endDate) {
        results = results.filter(page => page.timestamp <= endDate);
      }
      
      results.sort((a, b) => b.timestamp - a.timestamp);
      results = results.slice(0, limit);
      
      resolve(results);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Get screenshot
async function getScreenshot(pageId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['screenshots'], 'readonly');
    const store = transaction.objectStore('screenshots');
    const request = store.get(pageId);
    
    request.onsuccess = async () => {
      if (request.result && request.result.screenshot) {
        const decrypted = await decrypt(request.result.screenshot);
        resolve(decrypted);
      } else {
        resolve(null);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Get stats
async function getStats() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pages'], 'readonly');
    const store = transaction.objectStore('pages');
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      resolve({
        totalPages: countRequest.result
      });
    };
    
    countRequest.onerror = () => reject(countRequest.error);
  });
}

// Clean old entries
async function cleanOldEntries(daysToKeep = 30) {
  const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pages', 'screenshots'], 'readwrite');
    const pageStore = transaction.objectStore('pages');
    const screenshotStore = transaction.objectStore('screenshots');
    const index = pageStore.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoffDate);
    
    const request = index.openCursor(range);
    const deletedIds = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        deletedIds.push(cursor.value.id);
        cursor.delete();
        cursor.continue();
      } else {
        deletedIds.forEach(id => screenshotStore.delete(id));
        resolve(deletedIds.length);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Delete all data
async function deleteAllData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => {
      chrome.storage.local.clear(() => resolve());
    };
    request.onerror = () => reject(request.error);
  });
}
