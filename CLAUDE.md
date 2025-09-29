# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tiny Blocker is a lightweight Chrome extension (Manifest V2) that blocks access to specified websites (currently YouTube) by redirecting users to a custom blocked page.

## Architecture

The extension consists of three main components:

1. **Background Scripts** (blocker.js, starting.js)
   - `blocker.js`: Implements the core blocking functionality using Chrome's webRequest API
   - `starting.js`: Handles extension initialization and declarativeContent rules for page action visibility

2. **User Interface**
   - `blocked.html`: Bootstrap-styled page shown when a site is blocked
   - `popup.html`: Extension popup (currently minimal implementation)

3. **Configuration**
   - `manifest.json`: Chrome extension manifest defining permissions and scripts

## Key Implementation Details

- **Blocking Mechanism**: Uses `chrome.webRequest.onBeforeRequest` with blocking mode to intercept and redirect requests
- **Current Target**: YouTube domains (`https://*.youtube.com/*`)
- **Redirect Behavior**: Blocked sites redirect to local `blocked.html` file
- **Page Action**: Shows extension icon only on YouTube pages via declarativeContent API

## Development Notes

- Extension uses Manifest V2 (note: Chrome is deprecating V2 in favor of V3)
- No build process or package manager - vanilla JavaScript
- External dependencies: Bootstrap 4.4.1 (loaded from CDN in blocked.html)
- Missing file: `alertScript.js` referenced in popup.html but not present in repository

## Future Features (per readme.txt)

- Dynamic addition and removal of blocked sites
- Site timers for time-based blocking