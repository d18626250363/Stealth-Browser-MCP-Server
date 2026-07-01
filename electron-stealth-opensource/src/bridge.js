#!/usr/bin/env node
/**
 * stdio ↔ TCP bridge for Electron Stealth.
 *
 * Claude Code MCP config:
 *   "command": "node", "args": ["bridge.js"],
 *   "cwd": "<electron-stealth directory>"
 *
 * Connects to the Electron Stealth TCP MCP server (default port 19999).
 * If the TCP server is not running, attempts to launch the Electron app first.
 */

import net from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TCP_PORT = parseInt(process.env.STEALTH_PORT || "19999", 10);
const TCP_HOST = process.env.STEALTH_HOST || "127.0.0.1";

let tcpSocket = null;
let connectTimer = null;
let connectAttempts = 0;
const MAX_ATTEMPTS = 60; // 30 seconds total

function connectTCP() {
  connectAttempts++;
  const socket = new net.Socket();

  socket.on("connect", () => {
    console.error("[bridge] Connected to Electron Stealth on port", TCP_PORT);
    tcpSocket = socket;
    connectAttempts = 0;
    if (connectTimer) clearTimeout(connectTimer);
  });

  socket.on("data", (chunk) => {
    // TCP → stdout (to Claude Code)
    process.stdout.write(chunk);
  });

  socket.on("close", () => {
    console.error("[bridge] TCP connection closed");
    tcpSocket = null;
    process.exit(0);
  });

  socket.on("error", () => {
    if (connectAttempts < MAX_ATTEMPTS) {
      connectTimer = setTimeout(connectTCP, 500);
    } else {
      console.error("[bridge] Could not connect to Electron Stealth after", MAX_ATTEMPTS, "attempts.");
      process.exit(1);
    }
  });

  socket.connect(TCP_PORT, TCP_HOST);
}

// ── Forward stdin → TCP ─────────────────────────────────────────────

process.stdin.on("data", (chunk) => {
  if (tcpSocket && !tcpSocket.destroyed) {
    tcpSocket.write(chunk);
  }
});

process.stdin.on("close", () => {
  console.error("[bridge] stdin closed, exiting");
  process.exit(0);
});

process.stdin.on("error", (err) => {
  console.error("[bridge] stdin error:", err.message);
});

process.on("exit", () => {
  if (tcpSocket) tcpSocket.destroy();
});

// ── Start connecting ────────────────────────────────────────────────
connectTCP();
