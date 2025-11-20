# Security Policy

## Our Commitment

Visual History Search is built with privacy and security as top priorities. We believe users should have full control over their data without compromise.

## Security Features

### 1. Local-Only Storage
- **All data stays on your device** - No servers, no cloud, no external transmission
- **No analytics or tracking** - We literally cannot see what you browse
- **No API calls** - Extension operates entirely offline

### 2. Encryption
- **AES-256-GCM encryption** for all screenshots
- **Unique key per installation** - Generated locally, never transmitted
- **Key storage** in Chrome/Brave secure storage API
- **Automatic cleanup** on uninstall

### 3. Privacy Controls
- **Incognito auto-exclusion** - Private browsing never captured by default
- **Domain exclusion** - Blacklist sensitive sites (banking, health, etc.)
- **One-click data deletion** - Complete removal of all data
- **No persistent identifiers** - Extension doesn't track you

### 4. Minimal Permissions
We only request permissions we absolutely need:
- `tabs` - To capture screenshots of pages
- `storage` - To save data locally (not cloud)
- `unlimitedStorage` - For large history collections
- `<all_urls>` - To work on any website you visit

**We don't request:**
- ❌ Network access (can't send data anywhere)
- ❌ Cookie access
- ❌ History API (we build our own)
- ❌ Bookmark access
- ❌ Download permissions

## What We Capture

**Captured data:**
- Screenshot (encrypted JPEG, 60% quality)
- Page title and URL
- Dominant color (RGB values)
- Text content sample (5000 chars max)
- Boolean flags (has images/videos/code)
- Timestamp

**NOT captured:**
- Passwords or form data
- Cookies or session tokens
- Your personal information
- Scroll position or interactions
- Anything in incognito mode (by default)

## Data Flow

```
1. You visit example.com
2. Extension waits 3 seconds (page fully loads)
3. Captures screenshot in browser
4. Encrypts screenshot with your local key
5. Saves to IndexedDB on YOUR computer
6. [End - data never leaves your device]
```

## Threat Model

### What We Protect Against

✅ **External attackers** - No network = no remote attacks
✅ **Other extensions** - Data encrypted, isolated storage
✅ **Accidental leaks** - No telemetry, no accidental transmission
✅ **Tracking/profiling** - No identifiers, no analytics

### What We Don't Protect Against

⚠️ **Physical access** - If someone has your computer unlocked, they can see your data (like any browser history)
⚠️ **Malware on your device** - Local malware could potentially access browser storage
⚠️ **Browser vulnerabilities** - We rely on Chrome's security model

### Recommendations

For maximum security:
1. **Exclude sensitive domains** - Add banking, health, work sites to exclusion list
2. **Use incognito for private browsing** - Enabled by default
3. **Set shorter retention** - Less history = less exposure
4. **Lock your computer** - Standard security practice
5. **Keep browser updated** - Patches security vulnerabilities

## Reporting Security Issues

**Found a vulnerability?** We take security seriously.

### Please DO:
1. Email: stellarquantumember@gmail.com (or create private issue on GitHub)
2. Provide details: steps to reproduce, impact, suggested fix
3. Give us reasonable time to fix before public disclosure
4. Act in good faith

### Please DON'T:
- Post security issues publicly before we've addressed them
- Test vulnerabilities on other users
- Access data you don't own

### Response Timeline
- I'll do my best to fix the issue within 48 hours

## Audit Trail

### Code Transparency
- **Open source** - All code is public on GitHub
- **No obfuscation** - Code is readable JavaScript
- **No external dependencies** - Pure browser APIs only
- **Build from source** - Users can verify the code

### Regular Reviews
We regularly review:
- Permissions requested
- Data collection practices
- Encryption implementation
- Third-party dependencies (none currently)

## Compliance

### Privacy Regulations
- **GDPR compliant** - User controls all data, can delete anytime
- **CCPA compliant** - No data selling (we don't have your data!)
- **No cookies** - Extension doesn't use cookies

### Browser Policies
- Follows Chrome/Brave Web Store policies
- Respects Content Security Policy
- Honors user's private browsing settings

## Security Best Practices for Users

### Essential Steps
1. **Review permissions** - Check what the extension can access
2. **Exclude sensitive sites** - Banking, health, work email
3. **Regular cleanup** - Delete old data you don't need
4. **Keep extension updated** - Updates include security fixes

### Advanced Users
1. **Audit the code** - It's open source!
2. **Monitor storage** - Settings → Storage stats
3. **Test in isolation** - Try in a fresh browser profile first
4. **Report issues** - Help us improve security

## Cryptographic Details

### Encryption Algorithm
- **Algorithm**: AES-GCM (Galois/Counter Mode)
- **Key size**: 256 bits
- **IV**: 12 bytes (96 bits), randomly generated per encryption
- **Authentication tag**: Included in ciphertext

### Key Management
- **Generation**: Web Crypto API (`crypto.subtle.generateKey`)
- **Storage**: Chrome's local storage API (encrypted by OS)
- **Lifetime**: Persists until extension uninstall
- **No key derivation**: Direct key usage (no passwords)

### Implementation
```javascript
// Key generation (once per install)
crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Encryption (per screenshot)
crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: randomIV },
  encryptionKey,
  data
);
```

## Updates and Maintenance

### Security Updates
- **Critical**: Immediate patch, auto-update pushed
- **Important**: Fixed in next release (< 7 days)
- **Minor**: Included in regular updates

### Version Changelog
All releases document security-relevant changes.

## Contact

- **Security issues**: stellarquantumember@gmail.com
- **General questions**: GitHub Issues

## Acknowledgments

Thanks to security researchers who help keep this project secure. Contributors will be listed here (with permission).

---

**Last updated**: 2025-01-15  
**Next review**: 2025-04-15

*This security policy is a living document and will be updated as the project evolves.*
