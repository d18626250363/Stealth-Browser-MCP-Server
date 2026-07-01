# Changelog

## 1.0.0 (2025-07-01)

Initial public release.

- Electron standalone desktop app with stealth Chromium fingerprint
- TCP MCP server on port 19999 (JSON-RPC 2.0)
- 32 CDP-based automation tools: navigate, click, type, screenshot, evaluate, snapshot, network capture, flow recording/playback
- `bridge.js` for stdio ↔ TCP relay (Claude Code MCP integration)
- Anti-detection: navigator.webdriver=false, real window.chrome, 5 plugins, platform/language spoofing
- Base64-encoded start page (prevents CSS rendering issues)
- Port conflict detection with user-friendly error dialog
- Flow runner with `{{VAR}}` substitution and error handling
- Network capture with XHR/API call summary
- Recording with semantic key-value selectors (coordinate-independent)
