# 🛠️ Developer Guide

Technical documentation for contributors and developers who want to understand or modify Visual History Search.

## Project Structure

```
visual-history-search/
├── manifest.json          # Extension configuration
├── src/
│   ├── background.js      # Service worker - captures & manages storage
│   ├── content.js         # Content script - extracts page data
│   ├── database.js        # IndexedDB wrapper with encryption
│   ├── popup.html         # Search UI
│   ├── popup.js           # Search logic
│   ├── options.html       # Settings page
│   └── options.js         # Settings logic
├── icons/                 # Extension icons (16, 48, 128px)
├── README.md             # User documentation
├── QUICKSTART.md         # Quick setup guide
├── SECURITY.md           # Security documentation
├── MONETIZATION.md       # Business strategy
└── LICENSE               # MIT License
```

## Architecture Overview

### Data Flow

```
User Visits Page
      ↓
Content Script Injected
      ↓
Page Fully Loads (3s delay)
      ↓
Background Worker Captures Screenshot
      ↓
Content Script Extracts Page Data
      ↓
Database Encrypts & Stores
      ↓
User Searches
      ↓
Popup Queries Database
      ↓
Results Displayed
```

### Component Responsibilities

**background.js (Service Worker)**
- Monitors tab updates
- Captures screenshots via Chrome API
- Coordinates with content script
- Manages database operations
- Handles periodic cleanup
- Responds to popup messages

**content.js (Content Script)**
- Runs on every web page
- Extracts meaningful text content
- Detects page features (images, videos, code)
- Responds to background worker requests

**database.js (Storage Layer)**
- IndexedDB wrapper
- AES-256-GCM encryption
- Search functionality
- Data cleanup
- Storage statistics

**popup.js (UI Controller)**
- Search interface
- Filter management
- Result rendering
- Screenshot loading

**options.js (Settings)**
- User preferences
- Privacy controls
- Data management

## Key Technologies

### Browser APIs
- **Tabs API** - Screenshot capture
- **Storage API** - Settings persistence
- **Web Crypto API** - AES-GCM encryption
- **IndexedDB** - Local database

### No External Dependencies
Pure vanilla JavaScript. No build process, no npm packages, no frameworks.

**Why?**
- Smaller size
- Better security (less attack surface)
- Easier to audit
- Faster load times
- No supply chain attacks

## Security Implementation

### Encryption Details

```javascript
// Generate key (once per install)
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Encrypt screenshot
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

// Store: { iv: [bytes], data: [bytes] }
```

### Why AES-GCM?
- Authenticated encryption (integrity + confidentiality)
- Fast (hardware-accelerated)
- Secure (NIST-approved)
- Well-supported in browsers

### Storage Architecture

```
IndexedDB: VisualHistoryDB
├── pages (Object Store)
│   ├── id (auto-increment)
│   ├── url
│   ├── title
│   ├── domain
│   ├── timestamp
│   ├── dominantColor {r, g, b}
│   ├── textContent (5000 chars)
│   ├── hasImages (boolean)
│   ├── hasVideos (boolean)
│   └── hasCode (boolean)
│
├── screenshots (Object Store)
│   ├── pageId (key)
│   └── screenshot (encrypted data)
│
└── settings (Object Store)
    └── user preferences
```

**Indexes:**
- `url` - Fast URL lookups
- `timestamp` - Time-based queries
- `domain` - Domain filtering
- `dominantColor` - Color search

## Development Setup

### Prerequisites
- Chrome/Edge browser
- Text editor (VS Code recommended)
- Basic JavaScript knowledge

### Local Development

1. **Clone the repo**
```bash
git clone https://github.com/yourusername/visual-history-search
cd visual-history-search
```

2. **Load in Chrome**
- Go to `chrome://extensions`
- Enable "Developer mode"
- Click "Load unpacked"
- Select project folder

3. **Make changes**
- Edit files
- Go to `chrome://extensions`
- Click reload icon on extension
- Test changes

4. **Debug**
- Background worker: `chrome://extensions` → "Inspect views: service worker"
- Content script: Right-click page → Inspect → Console
- Popup: Right-click extension icon → Inspect popup

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Page capture works on various sites
- [ ] Search returns correct results
- [ ] Filters work correctly
- [ ] Screenshots load properly
- [ ] Settings persist
- [ ] Cleanup works
- [ ] Data export/delete works
- [ ] Privacy controls effective
- [ ] Performance acceptable

**Automated Testing:**
Currently none. Future: Add Jest tests for database.js logic.

## Performance Considerations

### Current Optimizations

1. **3-second capture delay**
   - Ensures page fully loaded
   - Avoids capturing loading states
   - Reduces resource usage

2. **JPEG compression (60%)**
   - Balance quality vs size
   - ~100KB per screenshot
   - Acceptable visual quality

3. **Text content limit (5000 chars)**
   - Captures enough for search
   - Prevents huge storage usage
   - Focuses on main content

4. **Lazy screenshot loading**
   - Thumbnails load on demand
   - Improves popup responsiveness
   - Reduces memory usage

### Performance Metrics

**Target:**
- Screenshot capture: <1s
- Search query: <100ms
- Popup open: <500ms
- Storage per page: ~100KB

**Current:**
- ✅ All targets met

## Adding New Features

### Example: Add Tag Support

1. **Update database schema**
```javascript
// In database.js openDB()
pageStore.createIndex('tags', 'tags', { 
  unique: false, 
  multiEntry: true 
});
```

2. **Capture tags**
```javascript
// In background.js capturePage()
const pageRecord = {
  // ... existing fields
  tags: extractTags(pageData)
};
```

3. **Add to search**
```javascript
// In database.js searchPages()
if (tags) {
  results = results.filter(page => 
    page.tags?.some(tag => tags.includes(tag))
  );
}
```

4. **Update UI**
```html
<!-- In popup.html -->
<button class="filter-btn" data-filter="tagged">Tagged</button>
```

## Common Issues

### Extension doesn't capture pages
**Causes:**
- Service worker not running
- Permissions denied
- Page blocked by CSP

**Debug:**
1. Check service worker console
2. Verify permissions in manifest
3. Test on different sites

### Search returns no results
**Causes:**
- Database not initialized
- Encryption key mismatch
- Data corrupted

**Debug:**
1. Check IndexedDB in DevTools
2. Verify encryption key exists
3. Try deleting and recreating DB

### High memory usage
**Causes:**
- Too many cached screenshots
- Memory leak in popup

**Solutions:**
- Lower retention period
- Clear old data
- Close and reopen popup

## Contributing Guidelines

### Code Style

**JavaScript:**
- Use `const` and `let`, never `var`
- Async/await over promises
- Descriptive variable names
- JSDoc comments for functions

**Example:**
```javascript
/**
 * Captures and encrypts a screenshot of the current page
 * @param {Object} tab - Chrome tab object
 * @returns {Promise<string>} Base64 encoded screenshot
 */
async function captureScreenshot(tab) {
  // Implementation
}
```

### Commit Messages
```
feat: Add color search filter
fix: Resolve screenshot capture bug on YouTube
docs: Update README with new features
perf: Optimize database query performance
```

### Pull Request Process

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**PR Checklist:**
- [ ] Code follows style guidelines
- [ ] Tested manually
- [ ] Documentation updated
- [ ] No breaking changes (or clearly noted)

## Resources

### Chrome Extension Development
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### Security
- [OWASP Browser Extension Security](https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Security_Cheat_Sheet.html)
- [Secure Coding Guidelines](https://web.dev/security/)

### Community
- [r/chrome_extensions](https://reddit.com/r/chrome_extensions)
- [Indie Hackers](https://www.indiehackers.com)

## License

MIT License - see LICENSE file for details.

## Contact

- **Issues**: GitHub Issues
- **Security**: security@yourproject.com
- **Twitter**: [@yourtwitter](https://twitter.com/yourtwitter)

---

**Happy coding!** 🚀

Questions? Open an issue or start a discussion on GitHub.
