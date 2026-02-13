# 🔍 Visual History Search

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/daywalker35/visual-history-search)](https://github.com/daywalker35/visual-history-search/releases)
[![Privacy First](https://img.shields.io/badge/privacy-first-green)](PRIVACY_POLICY.md)
[![Security Audit](https://img.shields.io/badge/security-audited-blue)](SECURITY_AUDIT.md)

**Search your browsing history the way you remember it** - by visuals, colors, and context.

## What Makes This Different?

Most browsers only let you search by URL or page title. But your brain doesn't remember URLs - it remembers:

- "It was a blue website about coffee..."
- "That page had a big graph in the middle..."
- "I was looking at code examples..."

Visual History Search captures screenshots and lets you search your actual browsing history visually.

## 🔒 Privacy & Security First

**Everything stays on YOUR device. Period.**

- ✅ **No servers** - No data ever leaves your computer
- ✅ **Encrypted storage** - All screenshots encrypted with AES-256-GCM
- ✅ **Open source** - Audit the code yourself
- ✅ **No tracking** - No analytics, no telemetry, nothing
- ✅ **Respects incognito** - Automatically excluded (configurable)
- ✅ **Easy to delete** - One-click to wipe all data

### How Encryption Works

1. On first install, a unique AES-256 encryption key is generated
2. Key stays in your browser's local storage (never transmitted)
3. Every screenshot is encrypted before storage
4. Only decrypted when you view search results
5. If you uninstall, all data and keys are deleted

## Features

### Current (MVP)

- 📸 **Automatic screenshots** - Captures pages as you browse
- 🔍 **Visual search** - Browse thumbnails of your history
- 🎨 **Color search** - Find pages by dominant color
- 📝 **Text search** - Search titles, URLs, and page content
- 🗓️ **Time filters** - "Today", "This week", etc.
- 🎯 **Content filters** - Find pages with images, videos, or code
- 🧹 **Auto-cleanup** - Keeps last 30 days (configurable)
- 📊 **Storage stats** - See how much space you're using

### Planned (Pro Version)

- ♾️ **Unlimited history** - Keep more than 30 days
- 🤖 **AI-powered search** - "Find pages similar to this"
- ☁️ **Encrypted sync** - Sync across your devices (using your own cloud)
- 🎨 **Custom themes** - Personalize the interface
- 📤 **Export archive** - Save your history as a portable archive

## Installation

### For Users (Chrome/Brave)

1. Download the latest release
2. Open Chrome/Brave and go to `chrome://extensions` or `brave://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `visual-history-search` folder
6. Done! Click the extension icon to start searching

### For Developers

```
git clone https://github.com/daywalker35/visual-history-search
cd visual-history-search
# No build step needed - it's pure JavaScript!
# Load as unpacked extension in Chrome or Brave
```

## Usage

1. **Browse normally** - Extension captures pages automatically
2. **Click the extension icon** - Open the search interface
3. **Search visually** - Type keywords or use filters
4. **Click any result** - Opens that page in a new tab

### Tips

- Use the color picker to find "that blue site"
- Filter by "Has Code" for technical pages
- Filter by "Today" to find something from earlier today
- Search works on titles, URLs, and page content

## Configuration

Click "Settings & Privacy" in the extension popup to:

- Enable/disable automatic capture
- Adjust retention period (7, 14, 30, 90 days)
- Exclude specific domains (e.g., banking sites)
- View storage usage
- Export or delete all data

## Technical Details

### Storage

- Uses IndexedDB for efficient local storage
- Screenshots compressed to JPEG (60% quality)
- Typical storage: ~100KB per page
- 1000 pages ≈ 100MB

### Permissions Required

- `tabs` - To capture screenshots of pages
- `storage` - To store encrypted data locally
- `unlimitedStorage` - For large history collections
- `<all_urls>` - To capture any website you visit

**Why we need these permissions:**

- We need `tabs` to take screenshots
- We need `storage` to save your history locally
- We never send data anywhere - it's all local

### Architecture

```
visual-history-search/
├── manifest.json          # Extension configuration (Manifest V3)
├── src/
│   ├── background.js      # Service worker - handles capture and storage
│   ├── content.js         # Content script - extracts page data
│   ├── database.js        # Encrypted IndexedDB handler (AES-256-GCM)
│   ├── popup.html         # Search interface
│   ├── popup.js           # Search UI controller
│   ├── options.html       # Settings page
│   └── options.js         # Settings controller
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
├── LICENSE
├── PRIVACY_POLICY.md
├── SECURITY.md
├── SECURITY_AUDIT.md
├── DEVELOPER.md
└── QUICKSTART.md
```

## FAQ

**Q: Does this slow down my browsing?**
A: No. Screenshots are captured 3 seconds after page load, and processing happens in the background.

**Q: Can I exclude certain websites?**
A: Yes! Go to Settings and add domains to exclude (e.g., banking sites).

**Q: What about incognito mode?**
A: Incognito tabs are automatically excluded by default.

**Q: How much storage does it use?**
A: About 100KB per page. 1000 pages = ~100MB. Free version auto-deletes after 30 days.

**Q: Can I export my data?**
A: Export feature is coming soon. Your data stays securely on your device.

**Q: How do I completely delete everything?**
A: Settings > Delete All Data. This cannot be undone.

**Q: Is this really private?**
A: Yes. Check the code yourself - it's open source. No servers, no tracking, no analytics.

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Setup

```
# Clone the repo
git clone https://github.com/daywalker35/visual-history-search

# No dependencies to install!
# Just load the extension in Chrome or Brave

# To test changes:
# 1. Make your edits
# 2. Go to chrome://extensions or brave://extensions
# 3. Click the reload icon on the extension
```

## Security

Found a security issue? Please see [SECURITY.md](SECURITY.md) for reporting instructions.

## License

MIT License - see [LICENSE](LICENSE) file

## Acknowledgments

Built with ❤️ for privacy-conscious users who want better tools without sacrificing their data.
