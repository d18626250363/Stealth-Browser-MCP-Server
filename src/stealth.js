import { BrowserWindow } from "electron";
import path from "path";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * The anti-detection script injected via CDP Page.addScriptToEvaluateOnNewDocument.
 * Runs before any page JavaScript — invisible to page code.
 */
export const STEALTH_SCRIPT = `
(function() {
  // 1. Kill navigator.webdriver (Electron already leaves it unset, but seal it)
  Object.defineProperty(Navigator.prototype, 'webdriver', {
    get: () => false,
    configurable: true
  });

  // 2. Ensure window.chrome looks like normal Chrome
  if (!window.chrome) {
    window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = {};
  }

  // 3. Override permissions.query for notifications (common bot check)
  const origQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
  window.navigator.permissions.query = function(desc) {
    if (desc.name === 'notifications') {
      return Promise.resolve({ state: 'prompt', onchange: null });
    }
    return origQuery(desc);
  };

  // 4. Fix plugins if empty (some checks expect > 0)
  if (navigator.plugins && navigator.plugins.length === 0) {
    Object.defineProperty(Navigator.prototype, 'plugins', {
      get: () => {
        const arr = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '', length: 1 },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '', length: 2 }
        ];
        arr.item = (i) => arr[i] || null;
        arr.namedItem = (name) => arr.find(p => p.name === name) || null;
        arr.refresh = () => {};
        return arr;
      },
      configurable: true
    });
  }

  // 5. Fix navigator.languages
  if (!navigator.languages || navigator.languages.length === 0) {
    Object.defineProperty(Navigator.prototype, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true
    });
  }

  // 6. Fix navigator.platform
  if (!navigator.platform || navigator.platform === '') {
    Object.defineProperty(Navigator.prototype, 'platform', {
      get: () => 'Win32',
      configurable: true
    });
  }
})();
`;

/**
 * Create a BrowserWindow configured for maximum stealth.
 */
export function createStealthWindow(options = {}) {
  const win = new BrowserWindow({
    width: options.width || 1280,
    height: options.height || 800,
    show: options.show !== false,
    title: options.title || "Chrome",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      autoplayPolicy: "no-user-gesture-required",
    },
    ...options,
  });

  // Standard viewport / user agent
  win.webContents.setUserAgent(DEFAULT_UA);

  // The STEALTH_SCRIPT (injected via Page.addScriptToEvaluateOnNewDocument)
  // handles navigator.webdriver and all other anti-detection measures.
  // No post-load cleanup needed here — it would conflict with the injected script.

  // Don't quit when window is closed — MCP server needs to stay alive
  win.on("closed", () => {
    // We intentionally don't quit; MCP controls the session lifetime
  });

  return win;
}

/**
 * Attach CDP debugger and inject the stealth script.
 * Must be called before navigating to any page.
 */
export async function attachAndInject(win) {
  win.webContents.debugger.attach("1.3");
  await win.webContents.debugger.sendCommand(
    "Page.addScriptToEvaluateOnNewDocument",
    { source: STEALTH_SCRIPT }
  );
  return win.webContents.debugger;
}
