# CLAUDE.md — Electron Stealth

Project context for Claude Code and other AI coding assistants.

## What this project is

Standalone Electron desktop app that provides a real Chromium stealth browser + MCP TCP server (32 CDP automation tools). Used as a browser automation backend for Claude Code or any MCP-compatible client.

## Project structure

```
src/
├── main.js        Electron main process (window + TCP MCP server)
├── stealth.js     Anti-detection injection (CDP Page.addScriptToEvaluateOnNewDocument)
├── tools.js       32 MCP tool definitions + BrowserController (CDP handlers)
└── bridge.js      stdio ↔ TCP bridge for Claude Code MCP integration
scripts/
├── launch.bat            Windows double-click launcher
└── extract_product.js    Example TCP client (JSON-RPC 2.0)
```

## Architecture

- **Transport**: `bridge.js` (Node.js stdio process) ↔ TCP :19999 ↔ Electron MCP server
- **Browser control**: All operations go through CDP (`webContents.debugger`) — no Selenium, no Playwright
- **Stealth**: `Page.addScriptToEvaluateOnNewDocument` injects anti-detection before any page JS runs
- **Selectors**: Standard CSS only. No Playwright-specific selectors (text=, role=, >>). For text-based selection, use `snapshot` to discover elements then use CSS selectors or `evaluate` with querySelector

## Key constraints

- Windows GUI apps cannot use stdio for MCP (ELECTRON_NO_ATTACH_CONSOLE breaks pipes). The bridge solves this.
- Only one instance per port (19999). The app detects EADDRINUSE and shows an error dialog.
- All tools return `{ content: [{ type: "text"|"image", text: "...", data: "..." }] }` per MCP spec.
- Screenshots return base64 PNG in `content[].data` with `type: "image"`.

## Build

```bash
npm install
npm run build:portable
```

Requires electron-builder. On slow networks, set electron/electron-builder mirrors.

## No external dependencies at runtime

The packaged `.exe` is fully self-contained. No Playwright, no Chrome install, no external binaries needed.
