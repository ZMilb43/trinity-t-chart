/**
 * Trinity T-chart — Grok Imagine flyover proxy
 * Version 6 — RSA layout is the authority for panel placement.
 * Also snapshots Street View / satellite / RSA for shared page-2 links.
 *
 * After editing this file, paste it into the Cloudflare Worker editor
 * and click Save and Deploy. GitHub Pages does not update the Worker.
 *
 * Secrets (Worker → Settings → Variables and secrets):
 *   XAI_API_KEY
 *   GOOGLE_MAPS_KEY  (second Google key, no HTTP-referrer lock)
 */

const VERSION = 6;

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90;

const ALLOWED_ORIGINS = [
  "https://zmilb43.github.io",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify({ v: VERSION, ...body }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
    },
  });
}

function xaiError(data, fallback) {
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.error?.message === "string") return data.error.message;
  if (typeof data?.message === "string") return data.message;
  return fallback;
}

function mimeFromContentType(type) {
  const raw = String(type || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (raw === "image/jpg" || raw === "image/jpeg") return "image/jpeg";
  if (raw === "image/png") return "image/png";
  if (raw === "image/webp") return "image/webp";
  return "";
}

function mapsUrl(kind, address, key) {
  const loc = encodeURIComponent(address);
  if (kind === "street") {
    return `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${loc}&fov=80&key=${encodeURIComponent(key)}`;
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&zoom=20&maptype=satellite&size=640x400&key=${encodeURIComponent(key)}`;
}

async function fetchImageBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const mime = mimeFromContentType(res.headers.get("content-type") || "image/jpeg");
  if (!mime) throw new Error("Not an image");
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 32) throw new Error("Image too small");
  return { bytes: buf, mime };
}

function dataUriToBytes(uri) {
  if (!uri || !uri.startsWith("data:")) return null;
  const comma = uri.indexOf(",");
  if (comma < 0) return null;
  const mime = mimeFromContentType(uri.slice(5, comma));
  if (!mime) return null;
  const payload = uri.slice(comma + 1).replace(/\s/g, "");
  if (!payload) return null;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  if (bytes.byteLength < 32) return null;
  return { bytes, mime };
}

function normalizeFileId(id) {
  const raw = String(id || "").trim();
  if (!raw) return "";
  return raw.startsWith("file_") ? raw : `file_${raw}`;
}

async function uploadImage(env, image, filename) {
  const form = new FormData();
  form.append("file", new Blob([image.bytes], { type: image.mime }), filename);
  const res = await fetch("https://api.x.ai/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.XAI_API_KEY}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(xaiError(data, `Could not upload ${filename}.`));
  }
  const id = normalizeFileId(data.id || data.file_id);
  if (!id) throw new Error(`xAI did not return a file id for ${filename}.`);
  return id;
}

function buildPrompt(hasStreet, hasSatellite, hasRsa) {
  const parts = [
    "Cinematic continuous drone shot of this specific Massachusetts home.",
    "Match the real house: same siding, windows, driveway, trees, and roof shape.",
  ];
  let i = 0;
  if (hasStreet) {
    parts.push(
      `Start at curb-level matching the street view in <IMAGE_${i}> as closely as possible.`
    );
    i += 1;
  } else {
    parts.push("Start at curb level in front of the house.");
  }
  if (hasSatellite) {
    parts.push(
      `The camera rises and flies up and over the house, ending in a nadir overhead view matching the satellite photo in <IMAGE_${i}>.`
    );
    i += 1;
  } else {
    parts.push("The camera rises and flies up and over the house to a nadir overhead view.");
  }
  if (hasRsa) {
    parts.push(
      `The solar array must match the RSA design in <IMAGE_${i}> as closely as possible.`,
      `Copy that RSA exactly: same roof faces with panels, same array outlines, same row counts, same panel orientation, same gaps and setbacks, same grouping.`,
      `Do not add panels the RSA does not show. Do not move arrays to other roof planes. Do not invent a generic solar roof.`,
      `<IMAGE_${i}> is the authority for every panel. Street and satellite are only for the house and camera path.`
    );
  }
  parts.push(
    "Photorealistic suburban home, natural daylight, no text, no logos, no watermarks, smooth camera move from eye level to nadir."
  );
  return parts.join(" ");
}

async function handleGenerate(request, env) {
  if (!env.XAI_API_KEY) {
    return json(request, { error: "XAI_API_KEY is not set on the Worker.", step: "config" }, 500);
  }

  const body = await request.json();
  const address = (body.address || "").trim();
  const googleKey = env.GOOGLE_MAPS_KEY || "";

  let street = null;
  let satellite = null;
  if (googleKey && address) {
    try {
      street = await fetchImageBytes(mapsUrl("street", address, googleKey));
    } catch {
      street = null;
    }
    try {
      satellite = await fetchImageBytes(mapsUrl("satellite", address, googleKey));
    } catch {
      satellite = null;
    }
  }
  const rsa = dataUriToBytes(body.rsa || "");

  const slots = [
    street && { image: street, name: street.mime === "image/png" ? "street.png" : "street.jpg" },
    satellite && {
      image: satellite,
      name: satellite.mime === "image/png" ? "satellite.png" : "satellite.jpg",
    },
    rsa && { image: rsa, name: rsa.mime === "image/png" ? "rsa.png" : "rsa.jpg" },
  ].filter(Boolean);

  if (!slots.length) {
    return json(
      request,
      {
        error:
          "Need an address (for Street View/satellite) or an RSA photo. Confirm GOOGLE_MAPS_KEY is on the Worker.",
        step: "images",
      },
      400
    );
  }

  const reference_images = [];
  for (const slot of slots) {
    try {
      reference_images.push({ file_id: await uploadImage(env, slot.image, slot.name) });
    } catch (error) {
      return json(
        request,
        { error: `Upload ${slot.name}: ${error.message}`, step: "upload" },
        500
      );
    }
  }

  const payload = {
    model: "grok-imagine-video-1.5",
    prompt: buildPrompt(Boolean(street), Boolean(satellite), Boolean(rsa)),
    duration: 10,
    aspect_ratio: "16:9",
    resolution: "720p",
    reference_images,
  };

  const response = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    return json(
      request,
      { error: `Imagine: ${xaiError(data, "xAI did not start the video.")}`, step: "imagine" },
      response.status
    );
  }

  const requestId = data.request_id || data.requestId;
  if (!requestId) {
    return json(request, { error: "xAI did not return a request id.", step: "imagine" }, 502);
  }

  return json(request, { requestId, status: data.status || "pending" });
}

async function handleStatus(request, env) {
  if (!env.XAI_API_KEY) {
    return json(request, { error: "XAI_API_KEY is not set on the Worker.", step: "config" }, 500);
  }

  const body = await request.json();
  const requestId = body.requestId || body.request_id;
  if (!requestId) return json(request, { error: "Missing requestId.", step: "status" }, 400);

  const response = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
    headers: { Authorization: `Bearer ${env.XAI_API_KEY}` },
  });
  const data = await response.json();
  if (!response.ok) {
    return json(
      request,
      { error: `Status: ${xaiError(data, "Could not read flyover status.")}`, step: "status" },
      response.status
    );
  }

  const status = data.status || "pending";
  const url = data.video?.url || data.url || "";
  return json(request, { status, url, requestId });
}

function bytesToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function newShareId() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

async function handleStill(request, env) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "satellite" ? "satellite" : "street";
  const address = (url.searchParams.get("address") || "").trim();
  const googleKey = env.GOOGLE_MAPS_KEY || "";
  if (!googleKey) {
    return json(request, { error: "GOOGLE_MAPS_KEY is not set on the Worker.", step: "config" }, 500);
  }
  if (!address) return json(request, { error: "Missing address.", step: "still" }, 400);
  try {
    const image = await fetchImageBytes(mapsUrl(kind, address, googleKey));
    return json(request, {
      dataUrl: `data:${image.mime};base64,${bytesToBase64(image.bytes)}`,
    });
  } catch (error) {
    return json(request, { error: error.message || "Could not fetch that photo.", step: "still" }, 502);
  }
}

async function handleSharePut(request, env) {
  if (!env.SHARE) {
    return json(
      request,
      { error: "Share storage is not bound. Run wrangler kv namespace create SHARE.", step: "share" },
      501
    );
  }
  const body = await request.json();
  const payload = body.payload || body;
  if (!payload || typeof payload !== "object") {
    return json(request, { error: "Missing share payload.", step: "share" }, 400);
  }
  const id = newShareId();
  await env.SHARE.put(id, JSON.stringify(payload), { expirationTtl: SHARE_TTL_SECONDS });
  return json(request, { id });
}

async function handleShareGet(request, env) {
  if (!env.SHARE) {
    return json(request, { error: "Share storage is not bound.", step: "share" }, 501);
  }
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return json(request, { error: "Missing id.", step: "share" }, 400);
  const raw = await env.SHARE.get(id);
  if (!raw) return json(request, { error: "That shared view expired or was not found.", step: "share" }, 404);
  return json(request, { payload: JSON.parse(raw) });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";

    try {
      if (request.method === "GET") {
        if (path.endsWith("/still")) return await handleStill(request, env);
        if (path.endsWith("/share")) return await handleShareGet(request, env);
        return json(request, { ok: true, service: "trinity-flyover", v: VERSION });
      }

      if (request.method !== "POST") {
        return json(request, { error: "GET or POST only." }, 405);
      }

      if (path.endsWith("/share")) return await handleSharePut(request, env);
      if (path.endsWith("/generate") || path === "/" || path === "/flyover") {
        return await handleGenerate(request, env);
      }
      if (path.endsWith("/status")) {
        return await handleStatus(request, env);
      }
      return json(request, { error: "Not found. Use /generate, /status, /still, or /share." }, 404);
    } catch (error) {
      return json(request, { error: error.message || "Worker error.", step: "worker" }, 500);
    }
  },
};
