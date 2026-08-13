/**
 * Trinity T-chart — Grok Imagine flyover proxy
 *
 * Deploy later (does nothing until you do):
 *   1. npm i -g wrangler
 *   2. wrangler login
 *   3. cd worker
 *   4. wrangler secret put XAI_API_KEY
 *   5. wrangler secret put GOOGLE_MAPS_KEY   (optional; used if the page cannot send stills)
 *   6. wrangler deploy
 *   7. Paste the workers.dev URL into API setup on page 1
 *
 * Never put XAI_API_KEY in the GitHub Pages JavaScript.
 */

const ALLOWED_ORIGINS = [
  "https://zmilb43.github.io",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const FLYOVER_PROMPT = [
  "Cinematic continuous drone shot of this Massachusetts home.",
  "Start at curb-level matching the street view in <IMAGE_0>.",
  "The camera rises and flies up and over the house, ending in an overhead satellite view matching <IMAGE_1>.",
  "As the camera rises, the roof gains the solar panel layout from the RSA design in <IMAGE_2>.",
  "Photorealistic suburban home, natural daylight, no text, no logos, no watermarks,",
  "smooth camera move from eye level to nadir.",
].join(" ");

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
    },
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchAsDataUri(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`);
  const type = res.headers.get("content-type") || "image/jpeg";
  const buf = await res.arrayBuffer();
  return `data:${type};base64,${arrayBufferToBase64(buf)}`;
}

function mapsUrl(kind, address, key) {
  const loc = encodeURIComponent(address);
  if (kind === "street") {
    return `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${loc}&fov=80&key=${encodeURIComponent(key)}`;
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&zoom=20&maptype=satellite&size=640x400&key=${encodeURIComponent(key)}`;
}

async function resolveImage(preferred, fallbackUrl) {
  if (preferred && preferred.startsWith("data:")) return preferred;
  const url = preferred || fallbackUrl;
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    return await fetchAsDataUri(url);
  } catch {
    return "";
  }
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

  const street = await resolveImage(body.streetUrl || body.street, streetFallback);
  const satellite = await resolveImage(body.satelliteUrl || body.satellite, satFallback);
  const rsa = await resolveImage(body.rsa, "");

  const references = [street, satellite, rsa].filter(Boolean);
  if (!references.length) {
    return json(request, { error: "Need a Street View, satellite, or RSA image." }, 400);
  }

  const prompt = FLYOVER_PROMPT;

  const response = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-video-1.5",
      prompt,
      duration: 10,
      aspect_ratio: "16:9",
      resolution: "720p",
      reference_image_urls: references,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return json(
      request,
      { error: data.error?.message || data.error || "xAI did not start the video." },
      response.status
    );
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
    return json(
      request,
      { error: data.error?.message || data.error || "Could not read flyover status." },
      response.status
    );
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
    if (request.method !== "POST") {
      return json(request, { error: "POST only." }, 405);
    }

    const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";

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
