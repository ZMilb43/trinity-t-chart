/**
 * Trinity T-chart — Grok Imagine flyover proxy
 * Version 3 — uploads stills to xAI Files API, then reference-to-video.
 *
 * After editing this file, paste it into the Cloudflare Worker editor
 * and click Save and Deploy. GitHub Pages does not update the Worker.
 *
 * Secrets (Worker → Settings → Variables and secrets):
 *   XAI_API_KEY
 *   GOOGLE_MAPS_KEY  (second Google key, no HTTP-referrer lock)
 */

const VERSION = 3;

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

function extensionFor(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function mapsUrl(kind, address, key) {
  const loc = encodeURIComponent(address);
  if (kind === "street") {
    return `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${loc}&fov=80&key=${encodeURIComponent(key)}`;
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&zoom=20&maptype=satellite&size=640x400&key=${encodeURIComponent(key)}`;
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

async function fetchImageBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const mime = mimeFromContentType(res.headers.get("content-type") || "image/jpeg");
  if (!mime) throw new Error("Not an image");
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 32) throw new Error("Image too small");
  return { bytes: buf, mime };
}

async function resolveImageBytes(preferred, fallbackUrl) {
  if (preferred && preferred.startsWith("data:")) {
    const fromData = dataUriToBytes(preferred);
    if (fromData) return fromData;
  }
  const urls = [preferred, fallbackUrl].filter(
    (url) => url && !String(url).startsWith("data:")
  );
  const unique = [...new Set(urls)];
  for (const url of unique) {
    try {
      return await fetchImageBytes(url);
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

async function uploadImage(env, image, filename) {
  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("expires_after", "3600");
  form.append("file", new Blob([image.bytes], { type: image.mime }), filename);
  const res = await fetch("https://api.x.ai/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.XAI_API_KEY}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(xaiError(data, "Could not upload a reference image."));
  }
  const id = data.id || data.file_id;
  if (!id) throw new Error("xAI did not return a file id.");
  return id;
}

function buildPrompt(street, satellite, rsa) {
  const parts = ["Cinematic continuous drone shot of this Massachusetts home."];
  let i = 0;
  if (street) {
    parts.push(`Start at curb-level matching the street view in <IMAGE_${i}>.`);
    i += 1;
  } else {
    parts.push("Start at curb level in front of the house.");
  }
  if (satellite) {
    parts.push(
      `The camera rises and flies up and over the house, ending in an overhead satellite view matching <IMAGE_${i}>.`
    );
    i += 1;
  } else {
    parts.push("The camera rises and flies up and over the house to a nadir overhead view.");
  }
  if (rsa) {
    parts.push(
      `As the camera rises, the roof gains the solar panel layout from the RSA design in <IMAGE_${i}>.`
    );
  }
  parts.push(
    "Photorealistic suburban home, natural daylight, no text, no logos, no watermarks, smooth camera move from eye level to nadir."
  );
  return parts.join(" ");
}

async function handleGenerate(request, env) {
  if (!env.XAI_API_KEY) {
    return json(request, { error: "XAI_API_KEY is not set on the Worker." }, 500);
  }

  const body = await request.json();
  const address = (body.address || "").trim();
  const googleKey = env.GOOGLE_MAPS_KEY || "";

  const streetFallback = googleKey && address ? mapsUrl("street", address, googleKey) : "";
  const satFallback = googleKey && address ? mapsUrl("satellite", address, googleKey) : "";

  const street = await resolveImageBytes(body.streetUrl || body.street, streetFallback);
  const satellite = await resolveImageBytes(body.satelliteUrl || body.satellite, satFallback);
  const rsa = await resolveImageBytes(body.rsa, "");

  const slots = [
    street && { image: street, name: `street.${extensionFor(street.mime)}` },
    satellite && { image: satellite, name: `satellite.${extensionFor(satellite.mime)}` },
    rsa && { image: rsa, name: `rsa.${extensionFor(rsa.mime)}` },
  ].filter(Boolean);

  if (!slots.length) {
    return json(request, { error: "Need a Street View, satellite, or RSA image." }, 400);
  }

  const fileIds = [];
  for (const slot of slots) {
    fileIds.push(await uploadImage(env, slot.image, slot.name));
  }

  const response = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-video-1.5",
      prompt: buildPrompt(street, satellite, rsa),
      duration: 10,
      aspect_ratio: "16:9",
      resolution: "720p",
      reference_images: fileIds.map((file_id) => ({ file_id })),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return json(request, { error: xaiError(data, "xAI did not start the video.") }, response.status);
  }

  const requestId = data.request_id || data.requestId;
  if (!requestId) {
    return json(request, { error: "xAI did not return a request id." }, 502);
  }

  return json(request, { requestId, status: data.status || "pending" });
}

async function handleStatus(request, env) {
  if (!env.XAI_API_KEY) {
    return json(request, { error: "XAI_API_KEY is not set on the Worker." }, 500);
  }

  const body = await request.json();
  const requestId = body.requestId || body.request_id;
  if (!requestId) return json(request, { error: "Missing requestId." }, 400);

  const response = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`, {
    headers: { Authorization: `Bearer ${env.XAI_API_KEY}` },
  });
  const data = await response.json();
  if (!response.ok) {
    return json(request, { error: xaiError(data, "Could not read flyover status.") }, response.status);
  }

  const status = data.status || "pending";
  const url = data.video?.url || data.url || "";
  return json(request, { status, url, requestId });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";

    if (request.method === "GET") {
      return json(request, { ok: true, service: "trinity-flyover" });
    }

    if (request.method !== "POST") {
      return json(request, { error: "POST only." }, 405);
    }

    try {
      if (path.endsWith("/generate") || path === "/" || path === "/flyover") {
        return await handleGenerate(request, env);
      }
      if (path.endsWith("/status")) {
        return await handleStatus(request, env);
      }
      return json(request, { error: "Not found. Use /generate or /status." }, 404);
    } catch (error) {
      return json(request, { error: error.message || "Worker error." }, 500);
    }
  },
};
