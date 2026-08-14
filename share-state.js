/**
 * Frozen page-2 share links. Numbers live in the URL hash so GitHub Pages
 * does not need a database, and the payload is not sent to the server.
 * Photo snapshots are stored on the flyover Worker when available.
 */
const DEFAULT_SHARE_WORKER = "https://trinity-flyover.zmlb43.workers.dev";
const SHARE_STILL_EDGE = 560;
const SHARE_STILL_QUALITY = 0.52;
const SHARE_URL_MAX = 24000;

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

function readShareParams() {
  const hash = String(location.hash || "").replace(/^#/, "");
  if (!hash) return { share: "", worker: "" };
  const params = new URLSearchParams(hash.includes("=") ? hash : "share=" + hash);
  return { share: params.get("share") || "", worker: params.get("u") || "" };
}

function readShareHash() {
  return readShareParams().share;
}

function buildShareLink(page, payload, workerUrl) {
  const url = new URL(page, location.href);
  url.search = "";
  if (typeof payload === "string" && payload.startsWith("w_")) {
    const parts = [`share=${payload}`];
    const worker = shareWorkerUrl(workerUrl);
    if (worker) parts.push(`u=${encodeURIComponent(worker)}`);
    url.hash = parts.join("&");
  } else {
    url.hash = "share=" + encodeSharePayload(payload);
  }
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
  const prior = btn.dataset.label || btn.textContent;
  btn.dataset.label = prior;
  btn.textContent = "Link copied";
  window.setTimeout(() => {
    btn.textContent = prior;
  }, 1800);
}

function shareWorkerUrl(configured) {
  const raw = String(configured || "").replace(/\/$/, "");
  if (/^https:\/\/[a-z0-9.-]+\.workers\.dev$/i.test(raw)) return raw;
  return DEFAULT_SHARE_WORKER;
}

function compressDataUrl(dataUrl, maxEdge = SHARE_STILL_EDGE, quality = SHARE_STILL_QUALITY) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve("");
      return;
    }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}

async function fetchShareStill(worker, kind, address) {
  if (!worker || !address) return "";
  try {
    const res = await fetch(
      `${worker}/still?kind=${encodeURIComponent(kind)}&address=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    if (!res.ok || !data.dataUrl) return "";
    return compressDataUrl(data.dataUrl);
  } catch {
    return "";
  }
}

async function fetchShareSnapshot(worker, address) {
  if (!worker || !address) return { st: "", sa: "" };
  try {
    const res = await fetch(`${worker}/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    if (res.ok && (data.st || data.sa)) {
      return {
        st: data.st ? await compressDataUrl(data.st) : "",
        sa: data.sa ? await compressDataUrl(data.sa) : "",
      };
    }
  } catch {
    /* fall through to /still */
  }
  const [st, sa] = await Promise.all([
    fetchShareStill(worker, "street", address),
    fetchShareStill(worker, "satellite", address),
  ]);
  return { st, sa };
}

async function uploadSharePayload(worker, payload) {
  if (!worker) return "";
  try {
    const res = await fetch(`${worker}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) return "";
    return String(data.id);
  } catch {
    return "";
  }
}

async function downloadSharePayload(worker, id) {
  const res = await fetch(`${worker}/share?id=${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok || !data.payload) {
    throw new Error(data.error || "Could not open that shared view.");
  }
  return data.payload;
}

function slimSharePayload(payload) {
  const encoded = encodeSharePayload(payload);
  if (encoded.length <= SHARE_URL_MAX) return payload;
  const noMaps = { ...payload, st: "", sa: "" };
  if (encodeSharePayload(noMaps).length <= SHARE_URL_MAX) return noMaps;
  const numbersOnly = { ...payload };
  delete numbersOnly.st;
  delete numbersOnly.sa;
  delete numbersOnly.rs;
  return numbersOnly;
}
