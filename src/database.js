// Secure local database handler with encryption
class SecureDB {
  constructor() {
    this.dbName = 'VisualHistoryDB';
    this.dbVersion = 1;
    this.db = null;
    this.encryptionKey = null;
  }

  // Initialize encryption key (generated once per install)
  async initEncryption() {
    const stored = await chrome.storage.local.get(['encryptionKey']);
    
    if (stored.encryptionKey) {
      // Import existing key
      this.encryptionKey = await crypto.subtle.importKey(
        'jwk',
        stored.encryptionKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } else {
      // Generate new key
      this.encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Store key
      const exportedKey = await crypto.subtle.exportKey('jwk', this.encryptionKey);
      await chrome.storage.local.set({ encryptionKey: exportedKey });
    }
  }

  // Open IndexedDB connection
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for page visits
        if (!db.objectStoreNames.contains('pages')) {
          const pageStore = db.createObjectStore('pages', { keyPath: 'id', autoIncrement: true });
          pageStore.createIndex('url', 'url', { unique: false });
          pageStore.createIndex('timestamp', 'timestamp', { unique: false });
          pageStore.createIndex('domain', 'domain', { unique: false });
          pageStore.createIndex('dominantColor', 'dominantColor', { unique: false });
        }
        
        // Store for screenshots (encrypted)
        if (!db.objectStoreNames.contains('screenshots')) {
          const screenshotStore = db.createObjectStore('screenshots', { keyPath: 'pageId' });
          screenshotStore.createIndex('pageId', 'pageId', { unique: true });
        }
        
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Encrypt data using AES-GCM
  async encrypt(data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encodedData
    );
    
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData))
    };
  }

  // Decrypt data
  async decrypt(encryptedObj) {
    const iv = new Uint8Array(encryptedObj.iv);
    const data = new Uint8Array(encryptedObj.data);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );
    
    const decodedData = new TextDecoder().decode(decryptedData);
    return JSON.parse(decodedData);
  }

  // Save page visit with screenshot
  async savePage(pageData, screenshot) {
    const transaction = this.db.transaction(['pages', 'screenshots'], 'readwrite');
    
    // Save page metadata
    const pageStore = transaction.objectStore('pages');
    const pageRequest = pageStore.add(pageData);
    
    return new Promise((resolve, reject) => {
      pageRequest.onsuccess = async () => {
        const pageId = pageRequest.result;
        
        // Encrypt and save screenshot
        if (screenshot) {
          const encryptedScreenshot = await this.encrypt(screenshot);
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

  // Search pages by various criteria
  async searchPages(query = {}) {
    const { text, color, domain, startDate, endDate, limit = 50 } = query;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages'], 'readonly');
      const store = transaction.objectStore('pages');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let results = request.result;
        
        // Filter by text in title or URL
        if (text) {
          const searchText = text.toLowerCase();
          results = results.filter(page => 
            page.title?.toLowerCase().includes(searchText) ||
            page.url?.toLowerCase().includes(searchText) ||
            page.textContent?.toLowerCase().includes(searchText)
          );
        }
        
        // Filter by color
        if (color) {
          results = results.filter(page => 
            this.colorDistance(page.dominantColor, color) < 50
          );
        }
        
        // Filter by domain
        if (domain) {
          results = results.filter(page => 
            page.domain === domain
          );
        }
        
        // Filter by date range
        if (startDate) {
          results = results.filter(page => page.timestamp >= startDate);
        }
        if (endDate) {
          results = results.filter(page => page.timestamp <= endDate);
        }
        
        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp);
        
        // Limit results
        results = results.slice(0, limit);
        
        resolve(results);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get screenshot for a page
  async getScreenshot(pageId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['screenshots'], 'readonly');
      const store = transaction.objectStore('screenshots');
      const request = store.get(pageId);
      
      request.onsuccess = async () => {
        if (request.result && request.result.screenshot) {
          const decrypted = await this.decrypt(request.result.screenshot);
          resolve(decrypted);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Calculate color distance (simple RGB distance)
  colorDistance(color1, color2) {
    if (!color1 || !color2) return 999;
    const r = color1.r - color2.r;
    const g = color1.g - color2.g;
    const b = color1.b - color2.b;
    return Math.sqrt(r * r + g * g + b * b);
  }

  // Clean old entries (keep last 30 days for free version)
  async cleanOldEntries(daysToKeep = 30) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages', 'screenshots'], 'readwrite');
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
          // Delete associated screenshots
          deletedIds.forEach(id => screenshotStore.delete(id));
          resolve(deletedIds.length);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage stats
  async getStats() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages'], 'readonly');
      const store = transaction.objectStore('pages');
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        resolve({
          totalPages: countRequest.result,
          storageUsed: 'calculating...' // Chrome storage API can provide this
        });
      };
      
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  // Delete all data (for privacy/uninstall)
  async deleteAllData() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => {
        chrome.storage.local.clear(() => resolve());
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecureDB;
}
