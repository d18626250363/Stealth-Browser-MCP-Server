# Electron Stealth

Standalone desktop application — real Chrome fingerprint browser + MCP automation server.

**Core value:** Not a lightweight Playwright/Puppeteer wrapper. Real Electron Chromium browser with `navigator.webdriver = false`, real `window.chrome`, 5 plugins, fingerprint identical to normal Chrome.

## Quick Start

### 1. Launch the app

```bash
# From source:
npm start

# Or double-click the built executable:
# dist/ElectronStealth-1.0.0.exe (Windows portable, no install needed)
```

- Browser window opens, showing the status page
- TCP MCP server starts on `127.0.0.1:19999`
- Window title shows connection status

### 2. Use with Claude Code (recommended)

Configure `~/.claude.json`:

```json
"mcpServers": {
  "electron-stealth": {
    "command": "node",
    "args": ["src/bridge.js"],
    "cwd": "<path-to-electron-stealth>"
  }
}
```

Restart Claude Code. Then use 32 MCP tools directly:

```
Open https://example.com
Screenshot
Get page HTML
Click [data-testid="submit-btn"]
Type test@example.com in input[name="email"]
```

### 3. Direct TCP access (without Claude Code)

```bash
# Run the example extraction script:
node scripts/extract_product.js

# Or write your own client connecting to 127.0.0.1:19999
```

---

## Architecture

```
┌─────────────────┐     stdio      ┌──────────────┐     TCP :19999     ┌────────────────────┐
│   Claude Code   │ ←───────────→ │  bridge.js   │ ←───────────────→ │  Electron Stealth  │
│   (MCP client)  │                │  (Node.js)   │                    │  (Chromium + MCP)  │
└─────────────────┘                └──────────────┘                    └────────────────────┘
                                                                       │
                                                                       ├─ BrowserWindow (visible)
                                                                       ├─ CDP debugger (stealth injection)
                                                                       ├─ TCP MCP Server
                                                                       └─ BrowserController (32 tools)
```

**Why not stdio direct?**

On Windows, Electron GUI apps cannot reliably communicate with the parent process via stdio (`ELECTRON_NO_ATTACH_CONSOLE` disconnects pipes). `bridge.js` solves this: it runs as a pure Node.js process connected to Claude Code's stdio, then forwards to the Electron app via TCP.

---

## All 32 Tools

| Category | Tool | Description |
|----------|------|-------------|
| **Navigation** | `navigate` | Open URL |
| | `go_back` | Navigate back |
| | `go_forward` | Navigate forward |
| | `reload` | Reload page |
| **Interaction** | `click` | Click by CSS selector |
| | `click_xy` | Click by coordinates |
| | `type` | Type text (optional selector focus) |
| | `type_xy` | Click at coords then type |
| | `keypress` | Key press (supports Ctrl/Alt/Shift/Meta) |
| | `scroll` | Scroll page |
| | `mousemove` | Move mouse |
| **Reading** | `screenshot` | Screenshot (viewport or full page) → base64 PNG |
| | `screenshot_element` | Element screenshot |
| | `evaluate` | Execute JS, return result |
| | `get_html` | Get complete HTML |
| | `get_text` | Get visible text |
| | `get_url` | Get current URL |
| | `snapshot` | Structured snapshot of interactive elements |
| | `element_info` | Detailed single-element info |
| **Forms** | `select_option` | Select dropdown option (value or label) |
| | `upload_file` | Upload files |
| | `handle_dialog` | Handle alert/confirm/prompt |
| **Wait** | `wait` | Wait for time or selector appearance |
| | `wait_for_network` | Wait for network idle |
| **Capture** | `network_capture_start` | Start capturing requests/responses |
| | `network_capture_stop` | Stop and return captured data |
| | `network_get_response` | Get response body for a request |
| **Record** | `record_start` | Start recording actions (key-value selectors) |
| | `record_stop` | Stop recording, return Flow JSON |
| | `record_status` | Check recording status |
| **Flow** | `run_flow` | Execute recorded/hand-written Flow, supports `{{VAR}}` |

---

## Stealth Detection

| Check | Status |
|-------|--------|
| `navigator.webdriver` | `false` |
| `window.chrome` | Real object |
| `navigator.plugins` | 5 |
| `navigator.platform` | `Win32` |
| `navigator.languages` | Configured |
| Chrome PDF Plugin | Present |
| Permissions.query('notifications') | `prompt` |

---

## Flow Recording

```bash
# 1. Start recording
record_start

# 2. Perform actions (manual browser or MCP)
click [data-testid="login-btn"]
type user@test.com in input[name="email"]
type password123 in input[type="password"]

# 3. Stop recording, get Flow JSON
record_stop name="Login Flow"

# 4. Replay anytime
run_flow flow={...}
```

Recording uses key-value selector priority: `data-testid` > `id` > `name` > `aria-label` > `placeholder` > `title` > `text` > `class` > `role` > `type`. Coordinate-independent, stable across window sizes.

---

## Network Capture

```bash
network_capture_start
navigate https://target-site.com
wait_for_network timeout=10000 idleTime=500
data = network_capture_stop()
# data.summary.xhrApiCalls  → API call list
# data.summary.byDomain      → Domain distribution
```

---

## Build

```bash
npm install
npm run build:portable
# Output: dist/ElectronStealth-1.0.0.exe (~73MB, single file, portable)
```

On macOS/Linux, adjust the `build.win.target` in `package.json` to your platform.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Page shows garbled text/CSS | Confirm latest version (base64-encoded fix) |
| Port in use | Close all Electron Stealth windows, or kill the process |
| MCP tools not visible | Restart Claude Code to load MCP config |
| Need Playwright Chromium? | No! Electron Stealth has its own Chromium |
| Blocked by anti-bot? | Uses real Chrome fingerprint, usually not blocked |
