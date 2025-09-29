# Tiny Blocker - Chrome Extension (Manifest V3)

A lightweight website blocker Chrome extension that helps you stay focused and productive by blocking distracting websites.

## Features

- **Dynamic Website Blocking**: Add and remove websites from your block list through an intuitive options page
- **Quick Add Popular Sites**: One-click buttons to block popular distracting sites (YouTube, Reddit, X/Twitter, LinkedIn, Facebook, Instagram, TikTok, Netflix)
- **Individual Site Toggle**: Enable/disable blocking for specific sites without removing them
- **Master Block Switch**: Temporarily disable all blocking with a single toggle
- **Custom URL Patterns**: Support for wildcard patterns to block entire domains or specific paths
- **Real-time Updates**: Changes take effect immediately without restarting the extension

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the Tiny Blocker directory
5. The extension is now installed and ready to use!

## Usage

### Adding Sites to Block

1. Click the Tiny Blocker icon in your Chrome toolbar
2. Click "Manage Blocked Sites" or right-click the icon and select "Options"
3. Use the form to add custom websites:
   - Enter a website name (e.g., "YouTube")
   - Enter a URL pattern (e.g., `*://*.youtube.com/*`)
4. Or use the Quick Add buttons for popular sites

### URL Pattern Examples

- `*://*.example.com/*` - Blocks all subdomains of example.com
- `https://example.com/*` - Blocks only HTTPS version of example.com
- `*://example.com/path/*` - Blocks specific paths

### Managing Blocked Sites

- **Toggle Individual Sites**: Use the switch next to each site to enable/disable blocking
- **Remove Sites**: Click the "Remove" button to permanently delete a site from your list
- **Master Toggle**: Use the master switch to temporarily disable all blocking

## Technical Details

- **Manifest Version**: V3 (Compatible with Chrome's latest requirements)
- **Permissions**:
  - `storage` - Save your blocked sites list
  - `declarativeNetRequest` - Block websites efficiently
  - `declarativeNetRequestWithHostAccess` - Redirect to blocked page
- **Architecture**: Service worker-based background script for better performance

## Migration from V2

This extension has been migrated from Manifest V2 to V3 to ensure compatibility with Chrome beyond June 2025. Key changes include:
- Replaced `webRequestBlocking` with `declarativeNetRequest`
- Converted background scripts to service worker
- Updated to use dynamic rules for real-time blocking updates

## Privacy

Tiny Blocker respects your privacy:
- All settings are stored locally in Chrome's sync storage
- No data is sent to external servers
- The extension only blocks sites you explicitly add to your list

## Future Features

- Site timers for time-based blocking
- Blocking schedules (e.g., block during work hours)
- Password protection for settings
- Blocking statistics and productivity insights

## Support

If you encounter any issues or have suggestions, please create an issue on the project repository.