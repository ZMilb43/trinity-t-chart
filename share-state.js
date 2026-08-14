/**
 * Frozen page-2 share links. Numbers live in the URL hash so GitHub Pages
 * does not need a database, and the payload is not sent to the server.
 */
function encodeSharePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeSharePayload(raw) {
  const pad = "===".slice((raw.length + 3) % 4);
  const bin = atob(raw.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function readShareHash() {
  const hash = String(location.hash || "").replace(/^#/, "");
  if (!hash) return "";
  if (!hash.includes("=")) return hash;
  return new URLSearchParams(hash).get("share") || "";
}

function buildShareLink(page, payload) {
  const url = new URL(page, location.href);
  url.search = "";
  url.hash = "share=" + encodeSharePayload(payload);
  return url.href;
}

async function shareOrCopy(url, title, text) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
  } catch (error) {
    if (error && error.name === "AbortError") return "cancelled";
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    window.prompt("Copy this link", url);
    return "prompted";
  }
}

function flashShareButton(btn, result) {
  if (!btn || result === "cancelled" || result === "shared") return;
  const prior = btn.textContent;
  btn.textContent = "Link copied";
  window.setTimeout(() => {
    btn.textContent = prior;
  }, 1800);
}
