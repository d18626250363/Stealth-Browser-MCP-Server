import net from "node:net";
import fs from "node:fs";

const sock = new net.Socket();
let buf = "", rid = 0, pend = new Map();

function call(m, p = {}) {
  return new Promise((res, rej) => {
    const id = ++rid;
    sock.write(JSON.stringify({ jsonrpc: "2.0", id, method: "tools/call", params: { name: m, arguments: p } }) + "\n");
    const t = setTimeout(() => { pend.delete(id); rej(new Error("timeout:" + m)); }, 15000);
    pend.set(id, (r) => { clearTimeout(t); res(r.result); });
  });
}

sock.on("data", (c) => {
  buf += c.toString();
  const ls = buf.split("\n"); buf = ls.pop();
  for (const l of ls) {
    if (!l.trim()) continue;
    try { const m = JSON.parse(l); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } } catch {}
  }
});

sock.on("error", (e) => { console.error("Error:", e.message); process.exit(1); });

sock.connect(19999, "127.0.0.1", async () => {
  try {
    // Product title
    let r = await call("evaluate", { script: "document.title" });
    console.log("Title:", JSON.parse(r.content[0].text));

    // Price
    r = await call("evaluate", { script: `Array.from(document.querySelectorAll('[data-widget=\"webPrice\"]')).map(e=>e.innerText).join(' | ') || 'not found'` });
    console.log("Price:", JSON.parse(r.content[0].text));

    // Rating
    r = await call("evaluate", { script: `document.querySelector('[data-widget=\"webReviewStars\"]')?.getAttribute('aria-label') || 'no rating'` });
    console.log("Rating:", JSON.parse(r.content[0].text));

    // Images count
    r = await call("evaluate", { script: `document.querySelectorAll('img[src*=\"multimedia\"]').length` });
    console.log("Product images:", JSON.parse(r.content[0].text));

    // Breadcrumb
    r = await call("evaluate", { script: `Array.from(document.querySelectorAll('[data-widget=\"breadcrumb\"] a, nav[aria-label=\"Breadcrumb\"] a')).map(a=>a.innerText).join(' > ') || 'no breadcrumb'` });
    console.log("Breadcrumb:", JSON.parse(r.content[0].text));

    // Description text
    r = await call("evaluate", { script: `document.querySelector('[data-widget=\"webDescription\"]')?.innerText?.substring(0, 300) || 'no description widget'` });
    console.log("Description:", JSON.parse(r.content[0].text));

    // Full body text (first 800 chars)
    r = await call("evaluate", { script: "document.body.innerText.substring(0, 800)" });
    console.log("\nBody text preview:\n" + JSON.parse(r.content[0].text));

    // Screenshot
    r = await call("screenshot");
    const img = r.content.find((c) => c.type === "image");
    const outPath = "./screenshot.png";
    if (img) fs.writeFileSync(outPath, Buffer.from(img.data, "base64"));

    console.log(`\nDone. Screenshot: ${outPath}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
  sock.destroy();
  process.exit(0);
});
