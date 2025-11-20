# Privacy Policy for Visual History Search

**Last Updated**: November 20, 2025  
**Effective Date**: November 20, 2025

## Overview

Visual History Search is a browser extension that helps you search your browsing history visually. We are committed to protecting your privacy and being completely transparent about how this extension works.

**Core Principle**: Your data never leaves your device. We cannot see, access, or collect your browsing history, screenshots, or any personal information.

## Information We Collect

### What We Store Locally on Your Device

The extension stores the following information in your browser's local storage (IndexedDB):

1. **Screenshots**
   - JPEG images of web pages you visit (60% quality, compressed)
   - Encrypted using AES-256-GCM encryption
   - Stored only on your device

2. **Page Metadata**
   - Page title
   - URL
   - Domain name
   - Timestamp of visit
   - Dominant color (RGB values)
   - Boolean indicators (has images, has videos, has code)
   - Text content sample (up to 5,000 characters)

3. **Extension Settings**
   - Your preferences (retention period, excluded domains)
   - Encryption key (generated locally, never transmitted)
   - Enable/disable status

### What We DO NOT Collect

❌ We DO NOT collect, transmit, or store:
- Your personal information
- Passwords or login credentials
- Form data or input fields
- Credit card information
- Cookies or session tokens
- Mouse movements or clicks
- Keyboard input
- Location data
- Device identifiers
- IP addresses
- Any data from incognito/private browsing (by default)

## How We Use Your Information

All data processing happens **locally on your device**:

1. **Visual Search**: Screenshots and metadata enable you to search your history visually
2. **Color Search**: Dominant color extraction helps you find pages by appearance
3. **Text Search**: Indexed text content enables keyword searches
4. **Filtering**: Metadata enables filtering by date, content type, and domain

**We never transmit, sell, share, or monetize your data in any way.**

## Data Storage and Security

### Local Storage Only
- All data is stored in your browser's IndexedDB
- No servers, no cloud storage, no external databases
- Data never leaves your computer

### Encryption
- Screenshots are encrypted using **AES-256-GCM** (Advanced Encryption Standard, Galois/Counter Mode)
- Encryption key is generated locally and stored in Chrome's secure storage
- Industry-standard encryption used by governments and financial institutions

### Data Retention
- Free version: Last 30 days (configurable: 7, 14, or 30 days)
- Pro version: Up to 90 days or unlimited (optional paid upgrade)
- Automatic cleanup runs daily
- Manual cleanup available anytime
- Complete deletion available with one click

## Your Privacy Controls

You have complete control over your data:

### What You Can Control
1. **Enable/Disable Capture** - Turn off capturing at any time
2. **Exclude Specific Domains** - Blacklist sensitive sites (banks, health, etc.)
3. **Exclude Incognito Mode** - Enabled by default (private browsing never captured)
4. **Adjust Retention Period** - Choose how long to keep history
5. **Manual Cleanup** - Delete old entries on demand
6. **Complete Deletion** - Delete all data with one click

### Recommended Privacy Practices
We recommend:
- Excluding banking and financial websites
- Excluding health-related websites
- Excluding work email and sensitive work sites
- Keeping incognito exclusion enabled
- Setting shorter retention periods for sensitive activities
- Locking your computer when unattended

## Data Sharing and Third Parties

**We do not share your data with anyone.** Period.

- ❌ No third-party analytics
- ❌ No advertising networks
- ❌ No data brokers
- ❌ No affiliate tracking
- ❌ No telemetry or usage statistics
- ❌ No crash reporting services

The extension makes **zero network requests**. You can verify this by checking your browser's Developer Tools Network tab.

## Open Source Transparency

This extension is **open source** (MIT License):

- All source code is publicly available on GitHub
- Anyone can audit the code for security and privacy
- Community contributions are welcome
- You can verify there are no hidden tracking or data collection

**GitHub Repository**: [Link to your repo]

## Permissions Explained

The extension requests the following Chrome permissions:

### Required Permissions

1. **`tabs`** - To capture screenshots of web pages
   - Used only to create visual thumbnails
   - No access to page content beyond what's visible

2. **`storage`** - To save data locally on your device
   - All data stays on your device
   - No cloud or remote storage

3. **`unlimitedStorage`** - To store more than 5MB of data
   - Needed for storing screenshots of browsing history
   - Still 100% local storage

4. **`<all_urls>`** - To work on any website you visit
   - Required to capture screenshots of any site
   - Does not mean we access or transmit data
   - Standard for all screenshot/history extensions

### Permissions We Do NOT Request

We do not request:
- ❌ Network/API access (can't send data anywhere)
- ❌ Cookie access
- ❌ History API access
- ❌ Downloads access
- ❌ Bookmarks access
- ❌ Identity/OAuth access

## Children's Privacy

This extension is not directed at children under 13. We do not knowingly collect information from children. If a parent or guardian believes we have collected information from a child under 13, please contact us and we will delete it (though we don't collect data in the first place).

## International Users

This extension works the same worldwide:
- All data stored locally regardless of location
- No data transfers across borders (nothing leaves your device)
- Complies with GDPR, CCPA, and similar privacy regulations

### GDPR Compliance (EU Users)

Under GDPR, you have the right to:
- ✅ **Access**: View all your data (it's all in your browser)
- ✅ **Rectification**: Modify settings anytime
- ✅ **Erasure**: Delete all data with one click
- ✅ **Portability**: Export your data (feature in development)
- ✅ **Restriction**: Disable capture anytime
- ✅ **Object**: Uninstall removes everything

**Legal Basis**: Your consent and legitimate interest in using the extension

### CCPA Compliance (California Users)

Under CCPA:
- ✅ We do not sell your personal information
- ✅ We do not share your personal information
- ✅ You can delete your data anytime
- ✅ You can opt-out of collection by disabling capture

## Data Breaches

**Risk**: Extremely low because:
- No servers to breach
- No database to hack
- No network to intercept
- All data encrypted locally

**If your device is compromised**:
- The main risk is physical access to your unlocked computer
- This is the same risk as your browser's built-in history
- We recommend: lock your computer, use full-disk encryption, strong passwords

**Notification**: If we discover a security vulnerability in the extension code itself, we will:
1. Release a fix immediately
2. Notify users via Chrome Web Store
3. Post details on GitHub
4. Report to appropriate security channels

## Changes to This Privacy Policy

We may update this policy to:
- Clarify existing practices
- Reflect changes in regulations
- Add new features (with your consent)

**How we'll notify you**:
- Update "Last Updated" date at top
- Highlight changes in release notes
- Post announcement on GitHub
- Chrome Web Store listing updated

**Material changes** (affecting how we handle data) will require:
- Clear notification to users
- Option to opt-out or uninstall
- At least 30 days notice

## Your Rights

You have the right to:
1. **Know what data is collected** - This policy lists everything
2. **Access your data** - It's all in your browser's storage
3. **Delete your data** - One-click deletion in settings
4. **Disable collection** - Toggle off in settings
5. **Uninstall completely** - All data removed automatically
6. **Export your data** - Feature coming in v1.5
7. **Lodge a complaint** - Contact us or relevant authority

## Security Measures

We implement security best practices:

**Technical Measures**:
- AES-256-GCM encryption for all screenshots
- Web Crypto API (browser's native crypto)
- Isolated storage (other extensions can't access)
- No external dependencies (reduces attack surface)
- Content Security Policy enforcement
- Regular security audits

**Operational Measures**:
- Open source code (transparent)
- Community security reviews
- Prompt security updates
- Responsible disclosure program
- Minimal permissions requested

## Compliance Summary

| Regulation | Compliance Status |
|------------|------------------|
| GDPR (EU) | ✅ Fully Compliant |
| CCPA (California) | ✅ Fully Compliant |
| PIPEDA (Canada) | ✅ Fully Compliant |
| DPA (UK) | ✅ Fully Compliant |
| LGPD (Brazil) | ✅ Fully Compliant |

**Reason**: We don't collect, transmit, or store user data on servers.

## Contact Information

**Questions about privacy?**

- **Email**: stellarquantumember@gmail.com
- **Security Issues**: stellarquantumember@gmail.com
- **GitHub**: DayWalker35

**Response Time**: We aim to respond within 48 hours.

## Transparency Report

We commit to publishing an annual transparency report including:
- Number of user requests (access, deletion)
- Number of security incidents (if any)
- Number of government requests (expecting zero)
- Extension usage statistics (if we add privacy-friendly analytics)

**Current Status**: No data requests, no security incidents, no government requests.

## Legal Information

**Developer**: Derek Bateman  
**Location**: United States  

**Jurisdiction**: This privacy policy is governed by the laws of the United States.

## Disclaimer

This extension is provided "as is" without warranties. While we implement strong security measures, we cannot guarantee:
- Protection from physical device access
- Protection from device-level malware
- Chrome never having vulnerabilities
- Zero bugs in our code (though we fix them promptly)

**Standard security practices apply**: Lock your computer, use strong passwords, keep software updated, enable full-disk encryption.

## Summary (Plain English)

**What we do**:
- ✅ Help you search your browsing history visually
- ✅ Store screenshots locally on your device, encrypted
- ✅ Give you complete control over your data
- ✅ Keep everything private and local

**What we DON'T do**:
- ❌ Send your data anywhere
- ❌ Track or monitor you
- ❌ Sell or share your information
- ❌ Use analytics or telemetry
- ❌ Access your passwords or personal info

**Bottom line**: Your data is yours. We can't see it, access it, or collect it. Ever.

---

**Acceptance**

By installing and using Visual History Search, you acknowledge that you have read and understood this Privacy Policy.

**Have questions?** Contact us anytime at stellarquantumember@gmail.com

---

*This privacy policy is written to be understood by humans, not just lawyers. If anything is unclear, please ask.*
