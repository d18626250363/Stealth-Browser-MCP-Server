/**
 * Tool definitions and CDP-based handlers for the Electron stealth MCP server.
 *
 * All browser operations go through Chrome DevTools Protocol (CDP) on the
 * Electron BrowserWindow's webContents.debugger.
 */

// ── Tool definitions (MCP ListTools response) ──────────────────────────

export function getToolDefinitions() {
  return [
    // ── Navigation ──
    {
      name: "navigate",
      description:
        "Navigate to a URL. Waits for page load to complete.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "Full URL" } },
        required: ["url"],
      },
    },
    {
      name: "go_back",
      description: "Navigate back in history.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "go_forward",
      description: "Navigate forward in history.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "reload",
      description: "Reload the current page.",
      inputSchema: { type: "object", properties: {} },
    },

    // ── Interaction ──
    {
      name: "click",
      description:
        "Click an element by CSS selector. Finds the element center and dispatches real mouse events via CDP.",
      inputSchema: {
        type: "object",
        properties: { selector: { type: "string", description: "CSS selector" } },
        required: ["selector"],
      },
    },
    {
      name: "click_xy",
      description: "Click at exact viewport coordinates.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number", description: "X pixels from left" },
          y: { type: "number", description: "Y pixels from top" },
        },
        required: ["x", "y"],
      },
    },
    {
      name: "type",
      description:
        "Type text. If selector given, focuses it first (via .focus(), no click side-effect).",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to type" },
          selector: { type: "string", description: "Optional CSS selector to focus first" },
        },
        required: ["text"],
      },
    },
    {
      name: "type_xy",
      description:
        "Click at coordinates then type (for canvas/custom components without CSS selectors).",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          text: { type: "string" },
        },
        required: ["x", "y", "text"],
      },
    },
    {
      name: "keypress",
      description: "Press a key with optional modifiers. Key names: Enter, Escape, Tab, ArrowDown, a, etc.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Key name" },
          modifiers: {
            type: "array",
            items: { type: "string", enum: ["Ctrl", "Alt", "Shift", "Meta"] },
            description: "Modifier keys to hold",
          },
        },
        required: ["key"],
      },
    },
    {
      name: "scroll",
      description: "Scroll the page by delta pixels.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number", description: "Horizontal delta (px)" },
          y: { type: "number", description: "Vertical delta (px)" },
        },
        required: ["x", "y"],
      },
    },
    {
      name: "mousemove",
      description: "Move mouse cursor to viewport coordinates.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
        },
        required: ["x", "y"],
      },
    },

    // ── Read / Observe ──
    {
      name: "screenshot",
      description: "Take a screenshot (viewport or full page). Returns base64 PNG.",
      inputSchema: {
        type: "object",
        properties: { fullPage: { type: "boolean", description: "Full page capture" } },
      },
    },
    {
      name: "screenshot_element",
      description: "Take a screenshot of a specific element.",
      inputSchema: {
        type: "object",
        properties: { selector: { type: "string" } },
        required: ["selector"],
      },
    },
    {
      name: "evaluate",
      description: "Execute JavaScript in the page context and return the result.",
      inputSchema: {
        type: "object",
        properties: { script: { type: "string" } },
        required: ["script"],
      },
    },
    {
      name: "get_html",
      description: "Get the full HTML of the current page.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_text",
      description: "Get visible text of an element (or entire body if no selector).",
      inputSchema: {
        type: "object",
        properties: { selector: { type: "string", description: "Optional CSS selector" } },
      },
    },
    {
      name: "get_url",
      description: "Get the current page URL.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "snapshot",
      description:
        "Capture a structured snapshot of all interactive elements (inputs, buttons, links, selects) with tag, attributes, text, and viewport coordinates. Primary tool for discovering elements by data-testid, name, placeholder, aria-label, text, etc.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "element_info",
      description:
        "Get detailed info about a single element: coordinates, visibility, enabled state, all attributes, text.",
      inputSchema: {
        type: "object",
        properties: { selector: { type: "string" } },
        required: ["selector"],
      },
    },

    // ── Form helpers ──
    {
      name: "select_option",
      description: "Select an option in a <select> by value or label text.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string" },
          value: { type: "string", description: "Option value" },
          label: { type: "string", description: "Option label/text" },
        },
        required: ["selector"],
      },
    },
    {
      name: "upload_file",
      description: "Set file(s) on a <input type='file'> via CDP DOM protocol.",
      inputSchema: {
        type: "object",
        properties: {
          selector: { type: "string" },
          files: { type: "array", items: { type: "string" }, description: "Absolute file paths" },
        },
        required: ["selector", "files"],
      },
    },
    {
      name: "handle_dialog",
      description: "Accept or dismiss a JavaScript dialog (alert/confirm/prompt).",
      inputSchema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["accept", "dismiss"] },
          promptText: { type: "string", description: "Text for prompt dialogs" },
        },
        required: ["action"],
      },
    },

    // ── Wait ──
    {
      name: "wait",
      description: "Wait for a time duration or for a CSS selector to appear.",
      inputSchema: {
        type: "object",
        properties: {
          ms: { type: "number", description: "Milliseconds to wait" },
          selector: { type: "string", description: "CSS selector to wait for" },
        },
      },
    },
    {
      name: "wait_for_network",
      description: "Wait for network activity to become idle.",
      inputSchema: {
        type: "object",
        properties: {
          timeout: { type: "number", description: "Max wait ms (default: 10000)" },
          idleTime: { type: "number", description: "Silence required ms (default: 500)" },
        },
      },
    },

    // ── Network capture (packet sniffing / reverse engineering) ──
    {
      name: "network_capture_start",
      description:
        "Start capturing ALL network requests and responses (XHR, fetch, images, scripts, etc). Captures URL, method, headers, post body, response status, response headers, and response body for each request. Essential for reverse-engineering web app API calls.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "network_capture_stop",
      description:
        "Stop network capture and return all captured requests with their response bodies. Returns a JSON array of { url, method, status, requestHeaders, postData, responseHeaders, body, mimeType, timestamp }.",
      inputSchema: {
        type: "object",
        properties: {
          clear: { type: "boolean", description: "Clear captured data after returning (default: true)" },
        },
      },
    },
    {
      name: "network_get_response",
      description:
        "Get the full response body for a specific captured request by its requestId or URL pattern.",
      inputSchema: {
        type: "object",
        properties: {
          requestId: { type: "string", description: "Request ID from captured list" },
          urlPattern: { type: "string", description: "URL substring to match (finds first match)" },
        },
      },
    },

    // ── Recording (key-value selector based) ──
    {
      name: "record_start",
      description:
        "Start recording user interactions in the browser. Records clicks, inputs, and navigation — all as key-value selectors (data-testid > id > name > aria-label > text) — NOT coordinates. Reliable across window sizes.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "record_stop",
      description:
        "Stop recording and return the recorded steps as a reusable Flow JSON file. The flow uses semantic selectors and is ready for run_flow or export.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Optional flow name" },
          description: { type: "string", description: "Optional flow description" },
        },
      },
    },
    {
      name: "record_status",
      description: "Check whether recording is currently active and how many steps recorded.",
      inputSchema: { type: "object", properties: {} },
    },

    // ── Flow runner ──
    {
      name: "run_flow",
      description:
        "Execute a Flow JSON (recorded or hand-written). Supports variable substitution with {{VAR}}. Steps execute sequentially. Returns results for steps marked with save_as.",
      inputSchema: {
        type: "object",
        properties: {
          flow: {
            type: "object",
            description: "Flow object with { name?, vars?, steps: [...] }",
          },
          vars: {
            type: "object",
            description: "Variable values to substitute (merged with flow.vars)",
          },
        },
        required: ["flow"],
      },
    },
  ];
}

// ── Tool handler ───────────────────────────────────────────────────────

export async function handleToolCall(ctrl, name, args) {
  switch (name) {
    // Navigation
    case "navigate":
      return textResult(await ctrl.navigate(args.url));
    case "go_back":
      return textResult(await ctrl.goBack());
    case "go_forward":
      return textResult(await ctrl.goForward());
    case "reload":
      return textResult(await ctrl.reload());

    // Interaction
    case "click":
      return textResult(await ctrl.click(args.selector));
    case "click_xy":
      return textResult(await ctrl.clickXY(args.x, args.y));
    case "type":
      return textResult(await ctrl.type(args.text, args.selector));
    case "type_xy":
      return textResult(await ctrl.typeXY(args.x, args.y, args.text));
    case "keypress":
      return textResult(await ctrl.keypress(args.key, args.modifiers || []));
    case "scroll":
      return textResult(await ctrl.scroll(args.x, args.y));
    case "mousemove":
      return textResult(await ctrl.mousemove(args.x, args.y));

    // Read
    case "screenshot":
      return imageResult(
        await ctrl.screenshot(args?.fullPage || false),
        "image/png"
      );
    case "screenshot_element":
      return imageResult(await ctrl.screenshotElement(args.selector), "image/png");
    case "evaluate":
      return textResult(JSON.stringify(await ctrl.evaluate(args.script)));
    case "get_html":
      return textResult(await ctrl.getHTML());
    case "get_text":
      return textResult(await ctrl.getText(args?.selector));
    case "get_url":
      return textResult(await ctrl.getURL());
    case "snapshot":
      return textResult(JSON.stringify(await ctrl.snapshot()));
    case "element_info":
      return textResult(JSON.stringify(await ctrl.elementInfo(args.selector)));

    // Forms
    case "select_option":
      return textResult(await ctrl.selectOption(args.selector, args?.value, args?.label));
    case "upload_file":
      return textResult(await ctrl.uploadFile(args.selector, args.files));
    case "handle_dialog":
      return textResult(await ctrl.handleDialog(args.action, args?.promptText));

    // Wait
    case "wait":
      return textResult(await ctrl.wait(args?.ms, args?.selector));
    case "wait_for_network":
      return textResult(await ctrl.waitForNetwork(args?.timeout, args?.idleTime));

    // Network capture
    case "network_capture_start":
      return textResult(await ctrl.networkCaptureStart());
    case "network_capture_stop":
      return textResult(JSON.stringify(await ctrl.networkCaptureStop(args?.clear !== false)));
    case "network_get_response":
      return textResult(JSON.stringify(await ctrl.networkGetResponse(args?.requestId, args?.urlPattern)));

    // Recording
    case "record_start":
      return textResult(await ctrl.recordStart());
    case "record_stop":
      return textResult(JSON.stringify(await ctrl.recordStop(args?.name, args?.description)));
    case "record_status":
      return textResult(JSON.stringify(await ctrl.recordStatus()));

    // Flow
    case "run_flow":
      return textResult(JSON.stringify(await ctrl.runFlow(args.flow, args?.vars || {})));

    default:
      return textResult(`Unknown tool: ${name}`);
  }
}

function textResult(text) {
  return { content: [{ type: "text", text: String(text) }] };
}

function imageResult(base64, mimeType) {
  return {
    content: [
      { type: "image", data: base64, mimeType },
      { type: "text", text: `[Screenshot: ${base64.length} chars base64]` },
    ],
  };
}

// ── BrowserController ──────────────────────────────────────────────────

export class BrowserController {
  constructor(win) {
    this.win = win;
    this._loadResolve = null;
    this._loadTimeout = null;

    // Network capture state
    this._networkCapturing = false;
    this._networkRequests = new Map();
    this._networkHandler = null;

    // Recording state
    this._recording = false;
    this._recordedSteps = [];

    win.webContents.debugger.on("message", (_event, method, params) => {
      // Page load tracking
      if (method === "Page.loadEventFired" && this._loadResolve) {
        this._clearLoadWait();
        this._loadResolve();
      }
      // Network capture
      if (this._networkCapturing) {
        this._handleNetworkEvent(method, params);
      }
    });
  }

  get dbg() {
    return this.win.webContents.debugger;
  }

  async send(method, params = {}) {
    return this.dbg.sendCommand(method, params);
  }

  // ── Page load tracking ───────────────────────────────────────────

  _clearLoadWait() {
    if (this._loadTimeout) clearTimeout(this._loadTimeout);
    this._loadTimeout = null;
    this._loadResolve = null;
  }

  _waitForLoad(timeoutMs = 30000) {
    if (this._loadResolve) return this._loadResolve;
    return new Promise((resolve) => {
      this._loadResolve = resolve;
      this._loadTimeout = setTimeout(() => {
        this._clearLoadWait();
        resolve();
      }, timeoutMs);
    });
  }

  // ── Navigation ────────────────────────────────────────────────────

  async navigate(url) {
    const loadPromise = this._waitForLoad();
    const result = await this.send("Page.navigate", { url });
    if (result.errorText) {
      this._clearLoadWait();
      throw new Error(`Navigation failed: ${result.errorText}`);
    }
    // Race: load event vs readyState fallback (handles data: URLs, same-URL nav)
    const readyPromise = new Promise((resolve) => {
      const check = async () => {
        try {
          const state = await this.evaluate("document.readyState");
          if (state === "complete") resolve();
          else setTimeout(check, 300);
        } catch { setTimeout(check, 300); }
      };
      setTimeout(check, 2000);
    });
    await Promise.race([loadPromise, readyPromise]);
    this._clearLoadWait();
    return `Navigated to: ${url}`;
  }

  async goBack() {
    const hist = await this.send("Page.getNavigationHistory");
    if (hist.entries[hist.currentIndex - 1]) {
      const idx = hist.currentIndex - 1;
      const loadPromise = this._waitForLoad(5000);
      await this.send("Page.navigateToHistoryEntry", {
        entryId: hist.entries[idx].id,
      });
      await loadPromise;
      return "Navigated back";
    }
    return "No back entry in history";
  }

  async goForward() {
    const hist = await this.send("Page.getNavigationHistory");
    if (hist.entries[hist.currentIndex + 1]) {
      const idx = hist.currentIndex + 1;
      const loadPromise = this._waitForLoad(5000);
      await this.send("Page.navigateToHistoryEntry", {
        entryId: hist.entries[idx].id,
      });
      await loadPromise;
      return "Navigated forward";
    }
    return "No forward entry in history";
  }

  async reload() {
    const loadPromise = this._waitForLoad();
    await this.send("Page.reload");
    await loadPromise;
    return "Page reloaded";
  }

  // ── Screenshot ────────────────────────────────────────────────────

  async screenshot(fullPage = false) {
    if (fullPage) {
      const metrics = await this.send("Page.getLayoutMetrics");
      const cssContentSize =
        metrics.cssContentSize && metrics.cssContentSize.width > 0
          ? metrics.cssContentSize
          : metrics.contentSize;
      const result = await this.send("Page.captureScreenshot", {
        clip: {
          x: 0,
          y: 0,
          width: cssContentSize.width,
          height: cssContentSize.height,
          scale: 1,
        },
        captureBeyondViewport: true,
      });
      return result.data;
    }
    const result = await this.send("Page.captureScreenshot");
    return result.data;
  }

  async screenshotElement(selector) {
    const { x, y, width, height } = await this._getDocumentRect(selector);
    const result = await this.send("Page.captureScreenshot", {
      clip: { x, y, width, height, scale: 1 },
      captureBeyondViewport: true,
    });
    return result.data;
  }

  // ── Mouse ─────────────────────────────────────────────────────────

  async click(selector) {
    const rect = await this._getBoundingRect(selector);
    return this.clickXY(
      Math.round(rect.x + rect.width / 2),
      Math.round(rect.y + rect.height / 2)
    );
  }

  async clickXY(x, y) {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseMoved", x, y, button: "left", clickCount: 0,
    });
    await sleep(50);
    await this.send("Input.dispatchMouseEvent", {
      type: "mousePressed", x, y, button: "left", clickCount: 1,
    });
    await sleep(30);
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseReleased", x, y, button: "left", clickCount: 1,
    });
    return `Clicked at (${x}, ${y})`;
  }

  async mousemove(x, y) {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseMoved", x, y, button: "none", clickCount: 0,
    });
    return `Mouse moved to (${x}, ${y})`;
  }

  // ── Keyboard ──────────────────────────────────────────────────────

  async type(text, selector) {
    if (selector) {
      await this.evaluate(
        `document.querySelector(${JSON.stringify(selector)})?.focus()`
      );
      await sleep(100);
    }
    for (const ch of text) {
      await this._typeChar(ch);
      await sleep(10);
    }
    return `Typed: "${text}"`;
  }

  async typeXY(x, y, text) {
    await this.clickXY(x, y);
    await sleep(100);
    for (const ch of text) {
      await this._typeChar(ch);
      await sleep(10);
    }
    return `Typed "${text}" at (${x}, ${y})`;
  }

  async _typeChar(ch) {
    const code = ch.charCodeAt(0);
    const isPrintable = code >= 32 && code <= 126;
    if (isPrintable) {
      await this.send("Input.dispatchKeyEvent", {
        type: "char", text: ch, unmodifiedText: ch, key: ch,
      });
    } else if (ch === "\n" || ch === "\r") {
      await this.send("Input.dispatchKeyEvent", {
        type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13,
      });
      await this.send("Input.dispatchKeyEvent", {
        type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13,
      });
    } else if (ch === "\t") {
      await this.send("Input.dispatchKeyEvent", {
        type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9,
      });
      await this.send("Input.dispatchKeyEvent", {
        type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9,
      });
    }
  }

  async keypress(key, modifiers = []) {
    const mods = [...modifiers];
    const vk = KEY_TO_VK[key] || key.toUpperCase().charCodeAt(0);
    const code = KEY_TO_CODE[key] || `Key${key.toUpperCase()}`;

    let flags = 0;
    for (const mod of mods) {
      await this.send("Input.dispatchKeyEvent", {
        type: "keyDown", key: mod, code: `${mod}Left`,
        windowsVirtualKeyCode: { Ctrl: 17, Alt: 18, Shift: 16, Meta: 91 }[mod],
        modifiers: flags,
      });
      flags |= { Ctrl: 2, Alt: 1, Shift: 8, Meta: 4 }[mod] || 0;
    }

    await this.send("Input.dispatchKeyEvent", {
      type: "keyDown", key, code, windowsVirtualKeyCode: vk, modifiers: flags,
    });
    await this.send("Input.dispatchKeyEvent", {
      type: "keyUp", key, code, windowsVirtualKeyCode: vk, modifiers: flags,
    });

    for (const mod of mods.reverse()) {
      flags &= ~({ Ctrl: 2, Alt: 1, Shift: 8, Meta: 4 }[mod] || 0);
      await this.send("Input.dispatchKeyEvent", {
        type: "keyUp", key: mod, code: `${mod}Left`,
        windowsVirtualKeyCode: { Ctrl: 17, Alt: 18, Shift: 16, Meta: 91 }[mod],
        modifiers: flags,
      });
    }

    return `Pressed key: ${key}${mods.length ? " + " + mods.join("+") : ""}`;
  }

  // ── Scroll ────────────────────────────────────────────────────────

  async scroll(deltaX, deltaY) {
    await this.send("Input.dispatchMouseEvent", {
      type: "mouseWheel", x: 0, y: 0, deltaX, deltaY,
    });
    return `Scrolled by (${deltaX}, ${deltaY})`;
  }

  // ── Evaluate / Read ───────────────────────────────────────────────

  async evaluate(script) {
    const result = await this.send("Runtime.evaluate", {
      expression: script,
      returnByValue: true,
      awaitPromise: true,
      timeout: 10000,
    });
    if (result.exceptionDetails) {
      throw new Error(`Evaluate error: ${JSON.stringify(result.exceptionDetails)}`);
    }
    return result.result?.value;
  }

  async getHTML() {
    return this.evaluate("document.documentElement.outerHTML");
  }

  async getText(selector) {
    if (selector) {
      return this.evaluate(
        `document.querySelector(${JSON.stringify(selector)})?.innerText || '(element not found)'`
      );
    }
    return this.evaluate("document.body?.innerText || '(no body)'");
  }

  async getURL() {
    return this.evaluate("location.href");
  }

  // ── Snapshot ─────────────────────────────────────────────────────

  async snapshot() {
    return this.evaluate(`(() => {
      const INTERACTIVE =
        'input,button,select,textarea,a[href],option,[role="button"],[role="link"],[role="textbox"],[role="combobox"],[role="listbox"],[role="checkbox"],[role="radio"],[tabindex],[contenteditable="true"],[data-testid],[onclick],[data-action]';
      const seen = new Set();
      const results = [];
      for (const el of document.querySelectorAll(INTERACTIVE)) {
        const tag = el.tagName.toLowerCase();
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') continue;
        const attrs = {};
        for (const name of ['id','name','type','placeholder','aria-label','data-testid','role','href','value','title','alt']) {
          const v = el.getAttribute(name);
          if (v !== null && v !== undefined) attrs[name] = v;
        }
        const text = (el.innerText || el.textContent || '').trim().substring(0, 120);
        const key = tag + '|' + JSON.stringify(attrs) + '|' + text + '|' + Math.round(rect.x) + ',' + Math.round(rect.y);
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({
          tag, attrs, text,
          x: Math.round(rect.x), y: Math.round(rect.y),
          w: Math.round(rect.width), h: Math.round(rect.height),
          disabled: !!el.disabled,
          checked: el.checked !== undefined ? el.checked : null,
          selected: el.selected !== undefined ? el.selected : null,
          visible: rect.width > 0 && rect.height > 0,
        });
      }
      return { elements: results, count: results.length, url: location.href, title: document.title };
    })()`);
  }

  async elementInfo(selector) {
    return this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const attrs = {};
      for (const a of el.attributes) { attrs[a.name] = a.value; }
      return {
        found: true,
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.textContent || '').trim().substring(0, 500),
        x: Math.round(r.x), y: Math.round(r.y),
        width: Math.round(r.width), height: Math.round(r.height),
        visible: r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
        enabled: !el.disabled,
        checked: el.checked !== undefined ? el.checked : null,
        selected: el.selected !== undefined ? el.selected : null,
        attrs,
      };
    })()`);
  }

  // ── Select ─────────────────────────────────────────────────────────

  async selectOption(selector, value, label) {
    const exists = await this.evaluate(
      `!!document.querySelector(${JSON.stringify(selector)})`
    );
    if (!exists) throw new Error(`Select element not found: "${selector}"`);

    if (value !== undefined) {
      await this.evaluate(
        `(() => { const s=document.querySelector(${JSON.stringify(selector)}); s.value=${JSON.stringify(value)}; s.dispatchEvent(new Event('change',{bubbles:true})); s.dispatchEvent(new Event('input',{bubbles:true})); })()`
      );
      return `Selected option value="${value}" in "${selector}"`;
    }
    if (label !== undefined) {
      const found = await this.evaluate(
        `(() => { const s=document.querySelector(${JSON.stringify(selector)}); const m=Array.from(s.options).find(o=>o.text.trim()===${JSON.stringify(label)}||o.label===${JSON.stringify(label)}); if(m){ s.value=m.value; s.dispatchEvent(new Event('change',{bubbles:true})); s.dispatchEvent(new Event('input',{bubbles:true})); return true; } return false; })()`
      );
      if (!found) throw new Error(`Option label="${label}" not found in "${selector}"`);
      return `Selected option label="${label}" in "${selector}"`;
    }
    throw new Error("Either 'value' or 'label' must be provided");
  }

  // ── Upload ────────────────────────────────────────────────────

  async uploadFile(selector, files) {
    await this.send("DOM.enable");
    const { root } = await this.send("DOM.getDocument");
    const { nodeId } = await this.send("DOM.querySelector", {
      nodeId: root.nodeId, selector,
    });
    if (!nodeId) throw new Error(`File input not found: "${selector}"`);
    await this.send("DOM.setFileInputFiles", {
      files: files.map((f) => f.replace(/\\/g, "/")),
      nodeId,
    });
    return `Uploaded ${files.length} file(s) to "${selector}"`;
  }

  // ── Dialog ─────────────────────────────────────────────────────────

  async handleDialog(action, promptText) {
    if (action === "accept") {
      await this.send("Page.handleJavaScriptDialog", {
        accept: true, promptText: promptText || "",
      });
      return "Dialog accepted";
    }
    await this.send("Page.handleJavaScriptDialog", { accept: false });
    return "Dialog dismissed";
  }

  // ── Wait ──────────────────────────────────────────────────────────

  async wait(ms, selector) {
    if (selector) {
      const timeout = ms || 30000;
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const exists = await this.evaluate(
          `!!document.querySelector(${JSON.stringify(selector)})`
        );
        if (exists) return `Element "${selector}" appeared`;
        await sleep(200);
      }
      throw new Error(`Timeout waiting for selector: "${selector}"`);
    }
    if (ms) {
      await sleep(ms);
      return `Waited ${ms}ms`;
    }
    const ready = await this.evaluate("document.readyState");
    if (ready === "complete") return "Page already loaded";
    await this._waitForLoad();
    return "Page loaded";
  }

  async waitForNetwork(timeout = 10000, idleTime = 500) {
    const start = Date.now();
    let lastActivity = Date.now();

    const handler = (_event, method) => {
      if (
        method === "Network.requestWillBeSent" ||
        method === "Network.loadingFinished" ||
        method === "Network.loadingFailed"
      ) {
        lastActivity = Date.now();
      }
    };

    this.win.webContents.debugger.on("message", handler);
    await this.send("Network.enable");

    try {
      while (Date.now() - start < timeout) {
        if (Date.now() - lastActivity >= idleTime) break;
        await sleep(100);
      }
      return Date.now() - lastActivity >= idleTime
        ? "Network is idle"
        : `Network still active after ${timeout}ms`;
    } finally {
      this.win.webContents.debugger.removeListener("message", handler);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // ── Network Capture (packet sniffing / reverse engineering) ───────
  // ═══════════════════════════════════════════════════════════════════

  async networkCaptureStart() {
    await this.send("Network.enable");
    this._networkCapturing = true;
    this._networkRequests.clear();
    return "Network capture started. All requests/responses will be recorded until network_capture_stop.";
  }

  async networkCaptureStop(clear = true) {
    this._networkCapturing = false;
    const requests = Array.from(this._networkRequests.values())
      .filter((r) => r.url && !r.url.startsWith("data:"))
      .map(({ _resolve, _reject, ...rest }) => rest);

    if (clear) this._networkRequests.clear();

    return {
      requests,
      count: requests.length,
      summary: summarizeRequests(requests),
    };
  }

  async networkGetResponse(requestId, urlPattern) {
    let entry;
    if (requestId) {
      entry = this._networkRequests.get(requestId);
    } else if (urlPattern) {
      for (const [id, req] of this._networkRequests) {
        if (req.url && req.url.includes(urlPattern)) {
          entry = req;
          break;
        }
      }
    }
    if (!entry) throw new Error("Request not found");
    if (!entry._hasBody) {
      try {
        const result = await this.send("Network.getResponseBody", {
          requestId: entry.requestId,
        });
        entry.body = result.base64Encoded
          ? `[base64: ${result.body.substring(0, 100)}...]`
          : result.body;
        entry._hasBody = true;
      } catch {
        entry.body = "[body unavailable]";
      }
    }
    const { _resolve, _reject, ...rest } = entry;
    return rest;
  }

  _handleNetworkEvent(method, params) {
    if (method === "Network.requestWillBeSent") {
      const req = {
        requestId: params.requestId,
        url: params.request?.url || "",
        method: params.request?.method || "GET",
        requestHeaders: params.request?.headers || {},
        postData: params.request?.postData || null,
        status: null,
        responseHeaders: null,
        mimeType: null,
        body: null,
        _hasBody: false,
        _resolve: null,
        _reject: null,
        timestamp: Date.now(),
      };
      this._networkRequests.set(params.requestId, req);
    } else if (method === "Network.responseReceived") {
      const req = this._networkRequests.get(params.requestId);
      if (req) {
        req.status = params.response?.status;
        req.responseHeaders = params.response?.headers || {};
        req.mimeType = params.response?.mimeType || "";
        req.timestamp = Date.now();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // ── Recording (key-value selector based, NOT coordinates) ─────────
  // ═══════════════════════════════════════════════════════════════════

  async recordStart() {
    this._recording = true;
    this._recordedSteps = [];

    // Inject the recorder script into the page
    await this.evaluate(`(() => {
      if (window.__stealthRecorderInstalled) return;
      window.__stealthRecorderInstalled = true;

      window.__stealthRecordedSteps = [];

      function bestSelector(el) {
        // 1. data-testid (best)
        if (el.getAttribute('data-testid')) return '[data-testid="' + el.getAttribute('data-testid') + '"]';
        // 2. id
        if (el.id && el.id.length > 0 && /^[a-zA-Z]/.test(el.id))
          return '#' + CSS.escape(el.id);
        // 3. name
        if (el.name) return el.tagName.toLowerCase() + '[name="' + el.name + '"]';
        // 4. aria-label
        if (el.getAttribute('aria-label'))
          return '[aria-label="' + el.getAttribute('aria-label') + '"]';
        // 5. placeholder
        if (el.placeholder)
          return el.tagName.toLowerCase() + '[placeholder="' + el.placeholder + '"]';
        // 6. Title
        if (el.title)
          return el.tagName.toLowerCase() + '[title="' + el.title + '"]';
        // 7. Text content for buttons/links
        if ((el.tagName === 'BUTTON' || el.tagName === 'A') && el.innerText.trim().length < 60)
          return el.tagName.toLowerCase() + ':has-text("' + el.innerText.trim().substring(0, 60) + '")';
        // 8. Unique class combo
        if (el.className && typeof el.className === 'string') {
          const cls = el.className.trim().split(/\\s+/).filter(c => c.length > 0 && !c.startsWith('_') && !c.match(/^[a-z][a-z0-9]+$/));
          if (cls.length === 0) {
            // Use the first meaningful class
            const allCls = el.className.trim().split(/\\s+/).filter(c => c.length > 0 && c.length < 30);
            if (allCls.length > 0) {
              const sel = el.tagName.toLowerCase() + '.' + allCls.slice(0, 2).map(c => CSS.escape(c)).join('.');
              if (document.querySelectorAll(sel).length === 1) return sel;
            }
          }
        }
        // 9. Fallback: role or type
        if (el.getAttribute('role')) return el.tagName.toLowerCase() + '[role="' + el.getAttribute('role') + '"]';
        if (el.type) return el.tagName.toLowerCase() + '[type="' + el.type + '"]';
        // 10. Last resort: nth-of-type path (brittle)
        const path = [];
        let cur = el;
        while (cur && cur !== document.body) {
          let seg = cur.tagName.toLowerCase();
          if (cur.id) { path.unshift('#' + CSS.escape(cur.id)); break; }
          const parent = cur.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
            if (siblings.length > 1) seg += ':nth-child(' + (Array.from(parent.children).indexOf(cur) + 1) + ')';
          }
          path.unshift(seg);
          cur = parent;
        }
        return path.join(' > ') || el.tagName.toLowerCase();
      }

      document.addEventListener('click', function(e) {
        if (!window.__stealthRecorderInstalled) return;
        const el = e.target.closest('a,button,input,select,textarea,[role="button"],[role="link"],[onclick]') || e.target;
        window.__stealthRecordedSteps.push({
          type: 'click',
          selector: bestSelector(el),
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.value || '').trim().substring(0, 80),
        });
      }, true);

      document.addEventListener('input', function(e) {
        if (!window.__stealthRecorderInstalled) return;
        const el = e.target;
        if (!el.matches('input,textarea,[contenteditable="true"]')) return;
        // Avoid duplicate input events for the same element in quick succession
        const last = window.__stealthRecordedSteps[window.__stealthRecordedSteps.length - 1];
        if (last && last._el === el && last.type === 'type' && Date.now() - last._ts < 2000) {
          last.text = el.value || el.textContent || '';
          last._ts = Date.now();
          return;
        }
        window.__stealthRecordedSteps.push({
          type: 'type',
          selector: bestSelector(el),
          text: el.value || el.textContent || '',
          _el: el,
          _ts: Date.now(),
        });
      }, true);

      document.addEventListener('change', function(e) {
        if (!window.__stealthRecorderInstalled) return;
        const el = e.target;
        if (el.tagName !== 'SELECT') return;
        window.__stealthRecordedSteps.push({
          type: 'select_option',
          selector: bestSelector(el),
          value: el.value,
          label: el.options[el.selectedIndex]?.text || '',
        });
      }, true);

      // Track navigation
      const origPushState = history.pushState;
      history.pushState = function() {
        window.__stealthRecordedSteps.push({
          type: 'navigate',
          url: location.href,
          _nav: 'pushState',
        });
        return origPushState.apply(this, arguments);
      };
    })()`);

    return "Recording started. Interact with the browser window — all actions will be captured as key-value selectors. Use record_stop to get the flow.";
  }

  async recordStop(name, description) {
    this._recording = false;

    // Retrieve steps from the page
    const steps = await this.evaluate(`(() => {
      const steps = window.__stealthRecordedSteps || [];
      // Clean up internal fields
      return steps.map(s => {
        const { _el, _ts, _nav, ...clean } = s;
        return clean;
      });
    })()`);

    // Clean up recorder
    await this.evaluate(`(() => {
      window.__stealthRecorderInstalled = false;
      delete window.__stealthRecordedSteps;
    })()`);

    // Merge navigation steps: if we have type steps that represent the final value,
    // and click+type pairs for the same element, consolidate
    const consolidated = consolidateSteps(steps);

    const flow = {
      name: name || "Recorded Flow",
      description: description || `Recorded at ${new Date().toISOString()}`,
      recordedAt: new Date().toISOString(),
      url: await this.getURL(),
      steps: consolidated,
      stepCount: consolidated.length,
    };

    this._recordedSteps = [];
    return flow;
  }

  async recordStatus() {
    const stepCount = await this.evaluate("(window.__stealthRecordedSteps || []).length");
    return {
      recording: this._recording,
      stepCount,
      steps: this._recordedSteps,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ── Flow Runner ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════

  async runFlow(flow, vars = {}) {
    const mergedVars = { ...(flow.vars || {}), ...vars };
    const results = {};
    const log = [];

    for (let i = 0; i < flow.steps.length; i++) {
      const rawStep = flow.steps[i];
      const step = substituteVars(rawStep, mergedVars);
      const stepName = step._name || `step_${i + 1}`;

      try {
        const result = await this._executeStep(step, stepName, mergedVars, results);
        log.push({ step: i + 1, name: stepName, ok: true, result });

        if (step.save_as) {
          results[step.save_as] = result;
        }
      } catch (err) {
        log.push({ step: i + 1, name: stepName, ok: false, error: err.message });
        if (!step.ignoreError) {
          return {
            ok: false,
            failedAt: stepName,
            error: err.message,
            log,
            results,
          };
        }
      }

      if (step.sleepAfter) {
        await sleep(step.sleepAfter);
      }
    }

    return { ok: true, log, results };
  }

  async _executeStep(step, stepName, vars, results) {
    // Handle various step type keys (normalized)
    if (step.navigate || step.url) {
      // navigate: "url" (string) or { url: "..." } (object)
      const url = typeof step.navigate === "string" ? step.navigate : (step.navigate?.url || step.url);
      return this.navigate(substituteStr(url, vars));
    }
    if (step.click) {
      // click: "selector" (string) or click: { selector: "..." } (object)
      const sel = typeof step.click === "string" ? step.click : step.click.selector;
      return this.click(substituteStr(sel, vars));
    }
    if (step.click_xy) {
      return this.clickXY(step.click_xy.x, step.click_xy.y);
    }
    if (step.type) {
      // type: "text" (string) or type: { text: "...", selector: "..." } (object)
      const text = typeof step.type === "string" ? step.type : step.type.text;
      const sel = step.selector || (step.type.selector);
      return this.type(substituteStr(text, vars), sel ? substituteStr(sel, vars) : undefined);
    }
    if (step.type_xy) {
      return this.typeXY(step.type_xy.x, step.type_xy.y, substituteStr(step.type_xy.text, vars));
    }
    if (step.keypress) {
      return this.keypress(step.keypress, step.modifiers || []);
    }
    if (step.scroll) {
      return this.scroll(step.scroll.x || 0, step.scroll.y || 0);
    }
    if (step.wait) {
      // wait: "selector" (string) or wait: { selector: "...", ms: N } (object)
      if (typeof step.wait === "string") {
        return this.wait(null, substituteStr(step.wait, vars));
      }
      return this.wait(
        step.wait.ms || step.wait_ms,
        step.wait.selector ? substituteStr(step.wait.selector, vars) : undefined
      );
    }
    if (step.wait_for_network) {
      return this.waitForNetwork(step.wait_for_network.timeout, step.wait_for_network.idleTime || 500);
    }
    if (step.evaluate) {
      // evaluate: "script" (string) or { script: "...", save_as: "..." } (object)
      const script = typeof step.evaluate === "string" ? step.evaluate : step.evaluate.script;
      const val = await this.evaluate(substituteStr(script, vars));
      if (step.save_as || (step.evaluate.save_as)) {
        results[step.save_as || step.evaluate.save_as] = val;
      }
      return val;
    }
    if (step.snapshot) {
      const snap = await this.snapshot();
      if (step.save_as || (step.snapshot.save_as)) {
        results[step.save_as || step.snapshot.save_as] = snap;
      }
      return snap;
    }
    if (step.select_option) {
      // select_option: "selector" (string) or { selector: "...", value/label: "..." } (object)
      const sel = typeof step.select_option === "string"
        ? step.select_option
        : step.select_option.selector;
      const val = step.select_option?.value;
      const lbl = step.select_option?.label;
      return this.selectOption(
        substituteStr(sel, vars),
        val ? substituteStr(val, vars) : undefined,
        lbl ? substituteStr(lbl, vars) : undefined
      );
    }
    if (step.upload_file) {
      return this.uploadFile(
        substituteStr(step.upload_file.selector, vars),
        step.upload_file.files
      );
    }
    if (step.screenshot) {
      // screenshot: true (boolean) or { fullPage: true, save_as: "..." } (object)
      const fullPage = typeof step.screenshot === "object" ? (step.screenshot.fullPage || false) : false;
      const b64 = await this.screenshot(fullPage);
      if (step.save_as || (step.screenshot.save_as)) {
        results[step.save_as || step.screenshot.save_as] = b64;
      }
      return `[screenshot: ${b64.length} chars]`;
    }
    if (step.sleep) {
      await sleep(step.sleep);
      return `Slept ${step.sleep}ms`;
    }
    if (step.handle_dialog) {
      return this.handleDialog(step.handle_dialog, step.promptText);
    }
    if (step.go_back) return this.goBack();
    if (step.reload) return this.reload();

    throw new Error(`Unknown step type: ${JSON.stringify(Object.keys(step))}`);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  async _getBoundingRect(selector) {
    const rect = await this.evaluate(
      `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)return null; const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; })()`
    );
    if (!rect) throw new Error(`Element not found: "${selector}"`);
    if (rect.width === 0 || rect.height === 0)
      throw new Error(`Element "${selector}" has zero size`);
    return rect;
  }

  async _getDocumentRect(selector) {
    const rect = await this.evaluate(
      `(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)return null; const r=el.getBoundingClientRect(); return {x:r.x+window.scrollX,y:r.y+window.scrollY,width:r.width,height:r.height}; })()`
    );
    if (!rect) throw new Error(`Element not found: "${selector}"`);
    if (rect.width === 0 || rect.height === 0)
      throw new Error(`Element "${selector}" has zero size`);
    return rect;
  }
}

// ── Flow helpers ──────────────────────────────────────────────────────

function substituteStr(str, vars) {
  if (typeof str !== "string") return str;
  return str.replace(/\{\{(\w[\w.]*)\}\}/g, (_, key) => {
    const val = key.split(".").reduce((o, k) => (o != null ? o[k] : undefined), vars);
    return val !== undefined ? val : `{{${key}}}`;
  });
}

function substituteVars(obj, vars) {
  if (typeof obj === "string") return substituteStr(obj, vars);
  if (Array.isArray(obj)) return obj.map((v) => substituteVars(v, vars));
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = substituteVars(v, vars);
    }
    return out;
  }
  return obj;
}

function consolidateSteps(steps) {
  // Merge type steps that replace previous type on same selector (only keep last)
  const out = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (
      s.type === "type" &&
      out.length > 0 &&
      out[out.length - 1].type === "type" &&
      out[out.length - 1].selector === s.selector
    ) {
      out[out.length - 1] = s; // replace with latest value
    } else {
      out.push({ ...s });
    }
  }
  return out;
}

function summarizeRequests(requests) {
  const byDomain = {};
  for (const r of requests) {
    try {
      const host = new URL(r.url).hostname;
      byDomain[host] = (byDomain[host] || 0) + 1;
    } catch {}
  }
  const xhrApi = requests.filter(
    (r) =>
      r.postData ||
      (r.responseHeaders &&
        (r.responseHeaders["content-type"] || "").includes("json"))
  );
  return {
    totalRequests: requests.length,
    xhrApiCalls: xhrApi.length,
    apiUrls: xhrApi.map((r) => ({ url: r.url, method: r.method, status: r.status })),
    byDomain,
  };
}

// ── Utilities ────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const KEY_TO_VK = {
  Enter: 13, Escape: 27, Tab: 9, Backspace: 8, Delete: 46,
  ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39,
  Home: 36, End: 35, PageUp: 33, PageDown: 34,
  F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117,
  F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
  Space: 32, Insert: 45, CapsLock: 20, NumLock: 144,
  ScrollLock: 145, Pause: 19,
};

const KEY_TO_CODE = {
  Enter: "Enter", Escape: "Escape", Tab: "Tab", Backspace: "Backspace",
  Delete: "Delete", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight",
  Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown",
  Space: "Space", Insert: "Insert", CapsLock: "CapsLock",
  NumLock: "NumLock", ScrollLock: "ScrollLock", Pause: "Pause",
  F1: "F1", F2: "F2", F3: "F3", F4: "F4", F5: "F5", F6: "F6",
  F7: "F7", F8: "F8", F9: "F9", F10: "F10", F11: "F11", F12: "F12",
};
