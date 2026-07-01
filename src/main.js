/**
 * Electron Stealth — Standalone Desktop App
 *
 * Double-click launch: opens a real Chrome-fingerprint browser + TCP MCP server.
 * Claude Code connects via bridge.js (stdio ↔ TCP :19999).
 *
 * Architecture:
 *   Browser Window (visible) ← CDP → TCP :19999 ← bridge.js ← Claude Code
 */

import { app, BrowserWindow, dialog } from "electron";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ReadBuffer, serializeMessage } from "@modelcontextprotocol/sdk/shared/stdio.js";
import net from "node:net";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createStealthWindow, attachAndInject } from "./stealth.js";
import { getToolDefinitions, handleToolCall, BrowserController } from "./tools.js";

const TCP_PORT = 19999;
const TCP_HOST = "127.0.0.1";

let ctrl = null;
let browserReady = false;
let mainWindow = null;
let tcpServer = null;

// ── MCP Server ─────────────────────────────────────────────────────

const mcpServer = new Server(
  { name: "electron-stealth", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: getToolDefinitions(),
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!browserReady || !ctrl) {
    return {
      content: [
        { type: "text", text: "Browser not ready. Please wait a moment and retry." },
      ],
    };
  }
  try {
    return await handleToolCall(ctrl, request.params.name, request.params.arguments);
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// ── TCP Bridge ──────────────────────────────────────────────────────

function startTCPServer() {
  tcpServer = net.createServer((socket) => {
    const readBuffer = new ReadBuffer();
    const remote = `${socket.remoteAddress}:${socket.remotePort}`;
    log(`MCP client connected: ${remote}`);

    socket.on("data", (chunk) => {
      readBuffer.append(chunk);
      while (true) {
        try {
          const message = readBuffer.readMessage();
          if (message === null) break;
          mcpServer._transport.onmessage(message);
        } catch (err) {
          log(`Parse error: ${err.message}`);
        }
      }
    });

    socket.on("close", () => log(`MCP client disconnected: ${remote}`));
    socket.on("error", (err) => log(`Socket error: ${err.message}`));

    mcpServer._transport.send = async (message) => {
      return new Promise((resolve) => {
        if (socket.destroyed) { resolve(); return; }
        socket.write(serializeMessage(message), () => resolve());
      });
    };

    mcpServer._transport.onclose = () => {
      if (!socket.destroyed) socket.end();
    };
  });

  tcpServer.on("error", (err) => {
    log(`TCP server error: ${err.message}`);
    if (err.code === "EADDRINUSE") {
      dialog.showErrorBox(
        "Port Conflict",
        `Port ${TCP_PORT} is already in use.\n\nAnother instance of Electron Stealth may already be running.\nCheck Task Manager for "Electron Stealth.exe" processes.`
      );
      app.quit();
    }
  });

  tcpServer.listen(TCP_PORT, TCP_HOST, () => {
    log(`TCP MCP server listening on ${TCP_HOST}:${TCP_PORT}`);
    updateTitle();
  });
}

// Fake transport so Server.connect() sets up internal state
const fakeTransport = {
  start: async () => {},
  close: async () => {},
  send: async () => {},
  onmessage: null,
  onclose: null,
  onerror: null,
};

// ── Logging ─────────────────────────────────────────────────────────

const logLines = [];
function log(msg) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${msg}`;
  logLines.push(line);
  if (logLines.length > 50) logLines.shift();
  console.error(line);
}

function updateTitle() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const url = ctrl ? "ready" : "loading...";
    mainWindow.setTitle(`Electron Stealth — MCP :${TCP_PORT} — ${url}`);
  }
}

// ── Start Page (base64-encoded to avoid encoding issues with CSS) ──

function buildStartPage() {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #1a1a2e; color: #e0e0e0; display: flex; justify-content: center;
  align-items: center; height: 100vh; text-align: center; }
.card { background: #16213e; border-radius: 12px; padding: 48px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3); max-width: 520px; }
h1 { font-size: 28px; margin-bottom: 8px; }
.status { display: inline-block; width: 10px; height: 10px; border-radius: 50%;
  background: #4ade80; margin-right: 8px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
.info { margin: 24px 0; text-align: left; background: #0f3460; border-radius: 8px;
  padding: 16px; font-size: 14px; line-height: 1.8; }
.info span { color: #f0a500; font-weight: bold; }
.hint { color: #888; font-size: 13px; margin-top: 16px; }
</style></head><body>
<div class="card">
  <h1><span class="status"></span>Electron Stealth</h1>
  <p style="color:#aaa;margin-top:4px;">Stealth Browser + MCP Server</p>
  <div class="info">
    <div>TCP MCP: <span>127.0.0.1:${TCP_PORT}</span></div>
    <div>Fingerprint: <span>Chrome 131 / Win32</span></div>
    <div>WebDriver: <span>hidden</span></div>
    <div>Tools: <span>32 (click, type, screenshot, evaluate, network capture, flow runner...)</span></div>
  </div>
  <p style="color:#ccc;font-size:14px;">
    Connect via Claude Code: configure MCP with <code>node bridge.js</code>
  </p>
  <p class="hint">Navigate to any URL using the MCP <code>navigate</code> tool<br>
  This window will render pages with a real Chrome fingerprint</p>
</div>
</body></html>`;
  return `data:text/html;base64,${Buffer.from(html, "utf-8").toString("base64")}`;
}

// ── App Lifecycle ───────────────────────────────────────────────────

async function main() {
  // Connect MCP server to fake transport (sets up internal state)
  await mcpServer.connect(fakeTransport);
  log("MCP server initialized");

  // Start TCP server immediately (don't wait for browser)
  startTCPServer();

  // Wait for Electron ready
  await app.whenReady();

  // Create the stealth browser window
  mainWindow = createStealthWindow({ width: 1280, height: 800 });
  log("Stealth window created");

  // Load start page (base64-encoded data URL — no encoding issues)
  await mainWindow.loadURL(buildStartPage());
  log("Start page loaded");

  // Attach CDP + inject stealth scripts
  await attachAndInject(mainWindow);
  log("CDP attached, stealth scripts injected");

  // Create browser controller
  ctrl = new BrowserController(mainWindow);
  browserReady = true;
  updateTitle();
  log("Browser ready — full automation available");

  // Update title on navigation
  mainWindow.webContents.on("page-title-updated", () => updateTitle());

  // Quit when window is closed (normal desktop app behavior)
  mainWindow.on("closed", () => {
    log("Browser window closed, shutting down");
    mainWindow = null;
    app.quit();
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  app.quit();
  process.exit(1);
});
