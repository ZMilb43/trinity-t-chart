/**
 * Trinity Total Home — Ben Franklin T-chart close
 * Page 1: utility + solar intake
 * Page 2: customer-facing comparison
 */

const STORAGE_KEY = "trinity-tchart-v1";
const KEYS_STORAGE = "trinity-tchart-keys";
const RSA_STORAGE = "trinity-tchart-rsa";
const HORIZON_YEARS = 10;
const RSA_MAX_EDGE = 1600;
const RSA_JPEG_QUALITY = 0.82;

/** Illustrative 10% annual climb from a 2020 baseline — matches the MA sales narrative. */
const MA_RATES = [
  { year: 2020, cents: 20.0 },
  { year: 2021, cents: 22.0 },
  { year: 2022, cents: 24.2 },
  { year: 2023, cents: 26.6 },
  { year: 2024, cents: 29.3 },
  { year: 2025, cents: 32.2 },
  { year: 2026, cents: 35.4 },
];

const els = {
  input: document.getElementById("screen-input"),
  chart: document.getElementById("screen-chart"),
  form: document.getElementById("intake-form"),
  name: document.getElementById("customer-name"),
  address: document.getElementById("home-address"),
  rsaPhoto: document.getElementById("rsa-photo"),
  rsaPreview: document.getElementById("rsa-preview"),
  rsaPreviewImg: document.getElementById("rsa-preview-img"),
  rsaClear: document.getElementById("rsa-clear"),
  googleKey: document.getElementById("google-maps-key"),
  workerUrl: document.getElementById("flyover-worker-url"),
  saveKeysBtn: document.getElementById("save-keys-btn"),
  keysStatus: document.getElementById("keys-status"),
  homeFlyover: document.getElementById("home-flyover"),
  visualizeWrap: document.getElementById("visualize-wrap"),
  visualizeBtn: document.getElementById("visualize-btn"),
  hideFlyoverBtn: document.getElementById("hide-flyover-btn"),
  flyoverAddress: document.getElementById("flyover-address"),
  flyoverPlayer: document.getElementById("flyover-player"),
  flyoverVideo: document.getElementById("flyover-video"),
  showStillsBtn: document.getElementById("show-stills-btn"),
  flyoverStills: document.getElementById("flyover-stills"),
  streetImg: document.getElementById("street-img"),
  streetPlaceholder: document.getElementById("street-placeholder"),
  satelliteImg: document.getElementById("satellite-img"),
  satellitePlaceholder: document.getElementById("satellite-placeholder"),
  rsaStillImg: document.getElementById("rsa-still-img"),
  rsaPlaceholder: document.getElementById("rsa-placeholder"),
  generateFlyover: document.getElementById("generate-flyover"),
  flyoverNote: document.getElementById("flyover-note"),
  stillZoom: document.getElementById("still-zoom"),
  stillZoomImg: document.getElementById("still-zoom-img"),
  stillZoomCap: document.getElementById("still-zoom-cap"),
  utilityName: document.getElementById("utility-name"),
  utilityRate: document.getElementById("utility-rate"),
  utilityKwh: document.getElementById("utility-kwh"),
  solarRate: document.getElementById("solar-rate"),
  solarKwh: document.getElementById("solar-kwh"),
  utilityRateHint: document.getElementById("utility-rate-hint"),
  solarRateHint: document.getElementById("solar-rate-hint"),
  sampleBtn: document.getElementById("sample-btn"),
  editBtn: document.getElementById("edit-btn"),
  walkBtn: document.getElementById("walk-btn"),
  walkHint: document.getElementById("walk-hint"),
  shareBtn: document.getElementById("share-btn"),
  sharedBanner: document.getElementById("shared-banner"),
  preparedFor: document.getElementById("prepared-for"),
  utilHead: document.getElementById("util-head"),
  utilHeadKicker: document.getElementById("util-head-kicker"),
  utilRate: document.getElementById("util-rate"),
  utilRateSub: document.getElementById("util-rate-sub"),
  solarRateOut: document.getElementById("solar-rate-out"),
  utilKwhOut: document.getElementById("util-kwh-out"),
  solarKwhOut: document.getElementById("solar-kwh-out"),
  coverageSub: document.getElementById("coverage-sub"),
  utilAnnual: document.getElementById("util-annual"),
  solarAnnual: document.getElementById("solar-annual"),
  annualSaveSub: document.getElementById("annual-save-sub"),
  utilMonthly: document.getElementById("util-monthly"),
  solarMonthly: document.getElementById("solar-monthly"),
  monthlySaveSub: document.getElementById("monthly-save-sub"),
  annualSolarCell: document.getElementById("annual-solar-cell"),
  monthlySolarCell: document.getElementById("monthly-solar-cell"),
  roofingInclude: document.getElementById("roofing-include"),
  roofingFields: document.getElementById("roofing-fields"),
  roofingPrice: document.getElementById("roofing-price"),
  roofingMonthly: document.getElementById("roofing-monthly"),
  batteryInclude: document.getElementById("battery-include"),
  batteryFields: document.getElementById("battery-fields"),
  batteryMonthly: document.getElementById("battery-monthly"),
  addonsPresent: document.getElementById("addons-present"),
  presentRoofingBtn: document.getElementById("present-roofing-btn"),
  presentBatteryBtn: document.getElementById("present-battery-btn"),
  costPop: document.getElementById("cost-pop"),
  costPopKicker: document.getElementById("cost-pop-kicker"),
  costPopTitle: document.getElementById("cost-pop-title"),
  costPopList: document.getElementById("cost-pop-list"),
  costPopVs: document.getElementById("cost-pop-vs"),
  costPopClose: document.getElementById("cost-pop-close"),
  horizonSolarLabel: document.getElementById("horizon-solar-label"),
  horizonUtil: document.getElementById("horizon-util"),
  horizonSolar: document.getElementById("horizon-solar"),
  horizonUtilLabel: document.getElementById("horizon-util-label"),
  horizonSave: document.getElementById("horizon-save"),
  hbarUtil: document.getElementById("hbar-util"),
  hbarSolar: document.getElementById("hbar-solar"),
  sparkline: document.getElementById("sparkline"),
  capHeadline: document.getElementById("solar-cap-headline"),
  capBody: document.getElementById("solar-cap-body"),
  capNum: document.getElementById("cap-num"),
  capCopy: document.getElementById("cap-copy"),
  capFoot: document.getElementById("cap-foot"),
  horizonKicker: document.getElementById("horizon-kicker"),
  horizonUtilPct: document.getElementById("horizon-util-pct"),
  horizonUtilStory: document.getElementById("horizon-util-story"),
  horizonCap: document.getElementById("horizon-cap"),
  disclaimer: document.getElementById("disclaimer"),
};

let walking = false;
let walkIndex = 0;
let rsaDataUrl = null;
let flyoverVideoUrl = null;
let flyoverBusy = false;
let flyoverOpen = false;
let presentRoofing = false;
let presentBattery = false;
let costDetail = null;
let costPopKind = null;
let sharedMode = false;
const stepNodes = () =>
  [...document.querySelectorAll("#screen-chart [data-step]")].filter((node) => !node.hidden);

function selectedEscalator() {
  const checked = document.querySelector('input[name="solar-escalator"]:checked');
  const n = Number(checked && checked.value);
  return Number.isFinite(n) ? n : 0.0299;
}

function setEscalator(value) {
  const radio = document.querySelector(
    `input[name="solar-escalator"][value="${value}"]`
  );
  if (radio) radio.checked = true;
}

function selectedUtilityEscalator() {
  const checked = document.querySelector('input[name="utility-escalator"]:checked');
  return checked && checked.value === "5" ? 0.05 : 0.1;
}

function setUtilityEscalator(rate) {
  const n = Number(rate);
  const isFive = n === 5 || (n > 0 && n <= 0.075);
  const radio = document.querySelector(
    `input[name="utility-escalator"][value="${isFive ? "5" : "10"}"]`
  );
  if (radio) radio.checked = true;
}

function utilityPathCopy(rate) {
  if (rate <= 0.075) {
    return {
      kicker: "If rates follow the longer-term path",
      pct: "5% / year",
      story: "in line with longer-term Massachusetts trends",
      pace: "5% annual utility increases (longer-term Massachusetts pace)",
      leftover: "5%",
    };
  }
  return {
    kicker: "If the next decade looks like the last",
    pct: "10% / year",
    story: "in line with Massachusetts since 2020",
    pace: "10% annual utility increases (the Massachusetts pace since 2020)",
    leftover: "10%",
  };
}

function capLabel(rate) {
  if (rate <= 0) return "0%";
  return `${(rate * 100).toFixed(2)}%`;
}

function capCopy(rate) {
  const pct = capLabel(rate);
  if (rate <= 0) {
    return {
      headline: "No annual increase. <em>Locked in.</em>",
      body: "Your solar kWh price does not go up. Year one is the same as year ten — written into the agreement. No August surprise. No uncapped climb. You know the number before you sign.",
      badge: "0%",
      badgeCopy: "annual increase<br />your rate never goes up",
      foot: "Locked in — no annual increase",
    };
  }
  if (rate >= 0.0299) {
    return {
      headline: `Capped at <em>${pct}</em> a year. Guaranteed.`,
      body: `Your solar kWh price can rise less than 3% annually — <strong>${pct}</strong>, written into the agreement. No August surprise. No uncapped climb. You know the number before you sign, and it stays honest for the life of the contract.`,
      badge: pct,
      badgeCopy: "annual increase<br />less than 3%, guaranteed",
      foot: "Written into the agreement",
    };
  }
  return {
    headline: `Capped at <em>${pct}</em> a year. Guaranteed.`,
    body: `Your solar kWh price can rise <strong>${pct}</strong> annually — written into the agreement. No August surprise. No uncapped climb. You know the number before you sign, and it stays honest for the life of the contract.`,
    badge: pct,
    badgeCopy: "annual increase<br />guaranteed in the agreement",
    foot: "Written into the agreement",
  };
}

function parseMoney(raw) {
  const n = Number(String(raw || "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseRate(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1 ? n / 100 : n;
}

function money(n, digits = 0) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function kwh(n) {
  return `${Math.round(n).toLocaleString("en-US")} kWh`;
}

function centsLabel(rate) {
  return `${(rate * 100).toFixed(1)}¢`;
}

function rateHint(input, hintEl) {
  const rate = parseRate(input.value);
  hintEl.textContent = rate ? `${centsLabel(rate)} / kWh` : "$/kWh";
}

function normalizeWorkerUrl(raw) {
  let url = String(raw || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, "");
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, "");
}

function loadKeys() {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    if (!raw) return { googleKey: "", workerUrl: "" };
    const data = JSON.parse(raw);
    return {
      googleKey: (data.googleKey || "").trim(),
      workerUrl: normalizeWorkerUrl(data.workerUrl),
    };
  } catch {
    return { googleKey: "", workerUrl: "" };
  }
}

function saveKeys() {
  const googleKey = els.googleKey.value.trim();
  const workerUrl = normalizeWorkerUrl(els.workerUrl.value);
  localStorage.setItem(KEYS_STORAGE, JSON.stringify({ googleKey, workerUrl }));
  els.workerUrl.value = workerUrl;
  els.keysStatus.textContent = "Saved on this device.";
  renderFlyover();
}

function fillKeyFields() {
  const keys = loadKeys();
  els.googleKey.value = keys.googleKey;
  els.workerUrl.value = keys.workerUrl;
}

function mapsUrl(kind, address, key) {
  const loc = encodeURIComponent(address);
  if (kind === "street") {
    return `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${loc}&fov=80&key=${encodeURIComponent(key)}`;
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&zoom=20&maptype=satellite&size=640x400&key=${encodeURIComponent(key)}`;
}

function showStill(img, placeholder, src, emptyText) {
  const frame = img.closest(".still-frame");
  img.onload = () => {
    img.hidden = false;
    placeholder.hidden = true;
    if (frame) frame.classList.add("is-zoomable");
  };
  img.onerror = () => {
    img.removeAttribute("src");
    img.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = emptyText;
    if (frame) frame.classList.remove("is-zoomable");
  };
  if (!src) {
    img.removeAttribute("src");
    img.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = emptyText;
    if (frame) frame.classList.remove("is-zoomable");
    return;
  }
  placeholder.textContent = "Loading…";
  placeholder.hidden = false;
  img.hidden = true;
  if (frame) frame.classList.remove("is-zoomable");
  img.src = src;
}

function setRsaPreview(dataUrl) {
  rsaDataUrl = dataUrl || null;
  if (rsaDataUrl) {
    els.rsaPreviewImg.src = rsaDataUrl;
    els.rsaPreview.hidden = false;
    try {
      sessionStorage.setItem(RSA_STORAGE, rsaDataUrl);
    } catch {
      /* quota — keep in memory only */
    }
  } else {
    els.rsaPreviewImg.removeAttribute("src");
    els.rsaPreview.hidden = true;
    els.rsaPhoto.value = "";
    try {
      sessionStorage.removeItem(RSA_STORAGE);
    } catch {
      /* ignore */
    }
  }
}

function loadRsa() {
  try {
    const stored = sessionStorage.getItem(RSA_STORAGE);
    if (stored) setRsaPreview(stored);
  } catch {
    /* ignore */
  }
}

function fileToResizedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, RSA_MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", RSA_JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error("That file is not a usable image."));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderFlyover() {
  const address = els.address.value.trim();
  const keys = loadKeys();
  const hasHome = Boolean(address || rsaDataUrl);
  if (!hasHome) flyoverOpen = false;

  els.visualizeWrap.hidden = !hasHome || flyoverOpen;
  els.homeFlyover.hidden = !hasHome || !flyoverOpen;
  if (!hasHome) {
    flyoverVideoUrl = null;
    els.flyoverPlayer.hidden = true;
    els.flyoverStills.hidden = false;
    return;
  }
  if (!flyoverOpen) return;

  els.flyoverAddress.textContent = address || "RSA design for this proposal";

  if (keys.googleKey && address) {
    showStill(
      els.streetImg,
      els.streetPlaceholder,
      mapsUrl("street", address, keys.googleKey),
      "No street photo for this address."
    );
    showStill(
      els.satelliteImg,
      els.satellitePlaceholder,
      mapsUrl("satellite", address, keys.googleKey),
      "Satellite needs a working Google Maps key."
    );
  } else {
    showStill(
      els.streetImg,
      els.streetPlaceholder,
      "",
      address ? "Add a Google Maps key in API setup to load Street View." : "Street View"
    );
    showStill(
      els.satelliteImg,
      els.satellitePlaceholder,
      "",
      address ? "Add a Google Maps key in API setup to load satellite." : "Satellite"
    );
  }

  if (rsaDataUrl) {
    showStill(els.rsaStillImg, els.rsaPlaceholder, rsaDataUrl, "RSA design");
  } else {
    showStill(els.rsaStillImg, els.rsaPlaceholder, "", "RSA design");
  }

  els.flyoverPlayer.hidden = true;
  els.flyoverStills.hidden = false;
}

function flyoverErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error.message === "string") return error.message;
  return fallback;
}

async function readJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.includes("Hello")
        ? "The Worker is still Hello World. Paste worker/flyover.js in Cloudflare and deploy."
        : "The flyover service did not return JSON. Re-paste worker/flyover.js in Cloudflare."
    );
  }
}

async function generateFlyover() {
  const keys = loadKeys();
  const address = els.address.value.trim();
  if (!keys.workerUrl || flyoverBusy) return;
  if (!/^https:\/\/[a-z0-9.-]+\.workers\.dev$/i.test(keys.workerUrl)) {
    els.flyoverNote.textContent =
      "Worker URL should look like https://trinity-flyover.zmlb43.workers.dev — paste it from Cloudflare, then Save.";
    return;
  }

  flyoverBusy = true;
  els.generateFlyover.disabled = true;
  els.flyoverNote.textContent = "Building the flyover — usually 1 to 3 minutes.";

  try {
    const start = await fetch(`${keys.workerUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        rsa: rsaDataUrl,
      }),
    });
    const started = await readJsonResponse(start);
    if (Number(started.v) < 5) {
      throw new Error(
        `This Worker is v${started.v || 0}. Paste the latest worker/flyover.js in Cloudflare and Save and Deploy.`
      );
    }
    if (!start.ok) {
      throw new Error(flyoverErrorMessage(started.error, "Could not start the flyover."));
    }
    const requestId = started.requestId;
    if (!requestId) throw new Error("No request id from the flyover service.");

    const deadline = Date.now() + 4 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const poll = await fetch(`${keys.workerUrl}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const status = await readJsonResponse(poll);
      if (!poll.ok) {
        throw new Error(flyoverErrorMessage(status.error, "Flyover status failed."));
      }
      if (status.status === "done" && status.url) {
        flyoverVideoUrl = status.url;
        flyoverBusy = false;
        renderFlyover();
        return;
      }
      if (status.status === "expired" || status.status === "failed") {
        throw new Error("The flyover did not finish. Try again.");
      }
    }
    throw new Error("Timed out waiting for the flyover.");
  } catch (error) {
    const message = error && error.message ? error.message : "";
    if (error instanceof TypeError || /Failed to fetch|Load failed|NetworkError/i.test(message)) {
      els.flyoverNote.textContent =
        "Could not reach the Worker. Open API setup, paste https://trinity-flyover.zmlb43.workers.dev from Cloudflare, and Save.";
    } else {
      els.flyoverNote.textContent = message || "Flyover failed.";
    }
  } finally {
    flyoverBusy = false;
    const keysNow = loadKeys();
    els.generateFlyover.disabled = !keysNow.workerUrl;
  }
}

function readInputs() {
  const utilityRate = parseRate(els.utilityRate.value);
  const solarRate = parseRate(els.solarRate.value);
  const utilityKwh = Number(els.utilityKwh.value);
  const solarKwh = Number(els.solarKwh.value);

  return {
    name: els.name.value.trim(),
    utilityName: els.utilityName.value,
    utilityRate,
    solarRate,
    utilityKwh: Number.isFinite(utilityKwh) ? utilityKwh : 0,
    solarKwh: Number.isFinite(solarKwh) ? solarKwh : 0,
    solarEscalator: selectedEscalator(),
    utilityEscalator: selectedUtilityEscalator(),
    address: els.address.value.trim(),
    roofingInclude: els.roofingInclude.checked,
    roofingPrice: parseMoney(els.roofingPrice.value),
    roofingMonthly: parseMoney(els.roofingMonthly.value),
    batteryInclude: els.batteryInclude.checked,
    batteryMonthly: parseMoney(els.batteryMonthly.value),
  };
}

function saveInputs() {
  if (sharedMode) return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      name: els.name.value,
      utilityName: els.utilityName.value,
      utilityRate: els.utilityRate.value,
      utilityKwh: els.utilityKwh.value,
      solarRate: els.solarRate.value,
      solarKwh: els.solarKwh.value,
      solarEscalator: selectedEscalator(),
      utilityEscalator: selectedUtilityEscalator(),
      address: els.address.value,
      roofingInclude: els.roofingInclude.checked,
      roofingPrice: els.roofingPrice.value,
      roofingMonthly: els.roofingMonthly.value,
      batteryInclude: els.batteryInclude.checked,
      batteryMonthly: els.batteryMonthly.value,
    })
  );
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    els.name.value = data.name || "";
    els.utilityName.value = data.utilityName || "National Grid";
    els.utilityRate.value = data.utilityRate || "";
    els.utilityKwh.value = data.utilityKwh || "";
    els.solarRate.value = data.solarRate || "";
    els.solarKwh.value = data.solarKwh || "";
    if (data.solarEscalator != null) setEscalator(String(data.solarEscalator));
    if (data.utilityEscalator != null) setUtilityEscalator(data.utilityEscalator);
    els.address.value = data.address || "";
    els.roofingInclude.checked = Boolean(data.roofingInclude);
    els.roofingPrice.value = data.roofingPrice || "";
    els.roofingMonthly.value = data.roofingMonthly || "";
    els.batteryInclude.checked = Boolean(data.batteryInclude);
    els.batteryMonthly.value = data.batteryMonthly || "";
    syncAddonFields();
  } catch {
    /* ignore */
  }
}

function syncAddonFields() {
  els.roofingFields.hidden = !els.roofingInclude.checked;
  els.batteryFields.hidden = !els.batteryInclude.checked;
}

function quotedRoofing(data) {
  return Boolean(data.roofingInclude && data.roofingMonthly > 0);
}

function quotedBattery(data) {
  return Boolean(data.batteryInclude && data.batteryMonthly > 0);
}

function escalatingSum(yearOne, rate, years) {
  let total = 0;
  let bill = yearOne;
  for (let i = 0; i < years; i += 1) {
    total += bill;
    bill *= 1 + rate;
  }
  return total;
}

function drawSparkline() {
  const w = 320;
  const h = 88;
  const padX = 8;
  const padY = 10;
  const values = MA_RATES.map((d) => d.cents);
  const min = Math.min(...values) - 0.8;
  const max = Math.max(...values) + 0.6;
  const pts = MA_RATES.map((d, i) => {
    const x = padX + (i / (MA_RATES.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (d.cents - min) / (max - min)) * (h - padY * 2);
    return { x, y };
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
  const last = pts[pts.length - 1];

  els.sparkline.innerHTML = `
    <path d="${area}" fill="rgba(44,61,72,0.08)"></path>
    <path d="${d}" fill="none" stroke="#2c3d48" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
    <circle cx="${last.x}" cy="${last.y}" r="4.2" fill="#e8a317" stroke="#0b1f2a" stroke-width="1.2"></circle>
  `;
}

function kwhTimesRate(kwhValue, rate) {
  return `${Math.round(kwhValue).toLocaleString("en-US")} kWh × ${centsLabel(rate)}`;
}

function renderAddonsPresent(data) {
  const canRoof = quotedRoofing(data);
  const canBattery = quotedBattery(data);
  els.addonsPresent.hidden = !canRoof && !canBattery;
  els.presentRoofingBtn.hidden = !canRoof;
  els.presentBatteryBtn.hidden = !canBattery;
  els.presentRoofingBtn.setAttribute("aria-pressed", String(presentRoofing && canRoof));
  els.presentBatteryBtn.setAttribute("aria-pressed", String(presentBattery && canBattery));
}

function renderChart() {
  const data = readInputs();
  if (!data.utilityRate || !data.solarRate || !data.utilityKwh || !data.solarKwh) return;

  const leftoverKwh = Math.max(data.utilityKwh - data.solarKwh, 0);
  const hasLeftover = leftoverKwh > 0;

  const solarOnlyAnnual = Math.round(data.solarRate * data.solarKwh);
  const leftoverAnnual = Math.round(leftoverKwh * data.utilityRate);
  const utilAnnual = Math.round(data.utilityRate * data.utilityKwh);

  const solarOnlyMonthly = Math.round(solarOnlyAnnual / 12);
  const leftoverMonthly = Math.round(leftoverAnnual / 12);
  const roofingOn = presentRoofing && quotedRoofing(data);
  const batteryOn = presentBattery && quotedBattery(data);
  const roofingMonthly = roofingOn ? Math.round(data.roofingMonthly) : 0;
  const batteryMonthly = batteryOn ? Math.round(data.batteryMonthly) : 0;
  const roofingAnnual = roofingMonthly * 12;
  const batteryAnnual = batteryMonthly * 12;
  const solarSideMonthly = solarOnlyMonthly + leftoverMonthly + roofingMonthly + batteryMonthly;
  const solarSideAnnual = solarOnlyAnnual + leftoverAnnual + roofingAnnual + batteryAnnual;
  const utilMonthly = Math.round(utilAnnual / 12);

  const annualSave = utilAnnual - solarSideAnnual;
  const monthlySave = utilMonthly - solarSideMonthly;
  const coverage = (data.solarKwh / data.utilityKwh) * 100;
  const leftoverLabel = `${data.utilityName === "Utility" ? "Utility" : data.utilityName} leftover`;
  const solarEscalator = data.solarEscalator;
  const utilityEscalator = data.utilityEscalator;
  const cap = capCopy(solarEscalator);
  const utilPath = utilityPathCopy(utilityEscalator);
  const extraBits = [
    hasLeftover ? "leftover utility" : "",
    roofingOn ? "roof" : "",
    batteryOn ? "batteries" : "",
  ].filter(Boolean);
  const extraLabel = extraBits.length ? extraBits.join(" + ") : "";
  const showSplit = hasLeftover || roofingOn || batteryOn;

  const util10 = escalatingSum(utilAnnual, utilityEscalator, HORIZON_YEARS);
  const solar10 =
    escalatingSum(solarOnlyAnnual, solarEscalator, HORIZON_YEARS) +
    escalatingSum(leftoverAnnual, utilityEscalator, HORIZON_YEARS) +
    roofingAnnual * HORIZON_YEARS +
    batteryAnnual * HORIZON_YEARS;
  const save10 = util10 - solar10;
  const maxBar = Math.max(util10, solar10);

  els.preparedFor.textContent = data.name ? `Prepared for ${data.name}` : "";
  els.utilHead.textContent = data.utilityName === "Utility" ? "Utility" : data.utilityName;
  els.utilHeadKicker.textContent = "Utility";

  els.utilRate.textContent = centsLabel(data.utilityRate);
  els.utilRateSub.textContent = `${money(data.utilityRate, 3)} per kWh`;
  els.solarRateOut.textContent = centsLabel(data.solarRate);

  els.utilKwhOut.textContent = kwh(data.utilityKwh);
  els.solarKwhOut.textContent = kwh(data.solarKwh);
  els.coverageSub.textContent =
    coverage >= 100
      ? `covers ${Math.round(coverage)}% of usage`
      : `${kwh(leftoverKwh)} still from the utility`;

  els.utilAnnual.textContent = money(utilAnnual);
  els.solarAnnual.textContent = money(solarSideAnnual);
  els.annualSaveSub.textContent = showSplit
    ? annualSave > 0
      ? `${money(annualSave)} less · tap for split`
      : "tap for split"
    : annualSave > 0
      ? `${money(annualSave)} less in year one`
      : "year one";

  els.utilMonthly.textContent = money(utilMonthly);
  els.solarMonthly.textContent = money(solarSideMonthly);
  els.monthlySaveSub.textContent = showSplit
    ? monthlySave > 0
      ? `${money(monthlySave)} less · tap for split`
      : "tap for split"
    : monthlySave > 0
      ? `${money(monthlySave)} less each month`
      : "average month";

  [els.annualSolarCell, els.monthlySolarCell].forEach((cell) => {
    cell.classList.toggle("has-detail", showSplit);
    cell.setAttribute("role", showSplit ? "button" : "presentation");
    if (showSplit) cell.setAttribute("tabindex", "0");
    else cell.removeAttribute("tabindex");
  });

  costDetail = {
    leftoverLabel,
    utilAnnual,
    utilMonthly,
    annualSave,
    monthlySave,
    annualTotal: solarSideAnnual,
    monthlyTotal: solarSideMonthly,
    roofingPrice: roofingOn ? data.roofingPrice : 0,
    annual: [
      { name: "Solar", math: kwhTimesRate(data.solarKwh, data.solarRate), amount: solarOnlyAnnual },
      hasLeftover && {
        name: leftoverLabel,
        math: kwhTimesRate(leftoverKwh, data.utilityRate),
        amount: leftoverAnnual,
      },
      roofingOn && {
        name: "Roofing",
        math: data.roofingPrice ? `${money(data.roofingPrice)} financed` : "financed",
        amount: roofingAnnual,
      },
      batteryOn && { name: "Batteries", math: "monthly × 12", amount: batteryAnnual },
    ].filter(Boolean),
    monthly: [
      {
        name: "Solar",
        math: `${kwhTimesRate(data.solarKwh, data.solarRate)} ÷ 12`,
        amount: solarOnlyMonthly,
      },
      hasLeftover && {
        name: leftoverLabel,
        math: `${kwhTimesRate(leftoverKwh, data.utilityRate)} ÷ 12`,
        amount: leftoverMonthly,
      },
      roofingOn && { name: "Roofing", math: "financed monthly", amount: roofingMonthly },
      batteryOn && { name: "Batteries", math: "monthly", amount: batteryMonthly },
    ].filter(Boolean),
  };

  els.horizonUtilLabel.textContent = data.utilityName === "Utility" ? "Utility" : data.utilityName;
  els.horizonSolarLabel.textContent = extraLabel ? `Solar + ${extraLabel}` : "Solar";
  els.horizonUtil.textContent = money(util10);
  els.horizonSolar.textContent = money(solar10);
  els.horizonSave.textContent =
    save10 > 0
      ? `${money(save10)} less over 10 years — with a rate that cannot run away.`
      : "Ten-year totals using the escalators above.";

  els.capHeadline.innerHTML = cap.headline;
  els.capBody.innerHTML = cap.body;
  els.capNum.textContent = cap.badge;
  els.capCopy.innerHTML = cap.badgeCopy;
  els.capFoot.textContent = cap.foot;
  els.horizonKicker.textContent = utilPath.kicker;
  els.horizonUtilPct.textContent = utilPath.pct;
  els.horizonUtilStory.textContent = utilPath.story;
  els.horizonCap.textContent = capLabel(solarEscalator);
  els.disclaimer.textContent =
    `Comparison uses year-1 costs from the T-chart, then applies ${utilPath.pace} ` +
    `versus a ${capLabel(solarEscalator)} solar escalator. ` +
    `If production is below usage, solar-side annual and monthly totals include leftover utility ` +
    `kWh at today’s utility rate; that leftover still escalates at ${utilPath.leftover} in the 10-year view. ` +
    `Roofing and battery add-ons, when turned on, use the financed monthly × 12 with no escalator. ` +
    `Past utility increases do not guarantee future rates. Illustrative — not a savings guarantee.`;

  renderAddonsPresent(data);
  if (showSplit && costPopKind) openCostPop(costPopKind);
  else if (!showSplit) closeCostPop();

  els.hbarUtil.style.width = "0%";
  els.hbarSolar.style.width = "0%";
  requestAnimationFrame(() => {
    els.hbarUtil.style.width = `${(util10 / maxBar) * 100}%`;
    els.hbarSolar.style.width = `${(solar10 / maxBar) * 100}%`;
  });
}

function packShare() {
  return {
    v: 1,
    n: els.name.value.trim(),
    u: els.utilityName.value,
    ur: els.utilityRate.value,
    uk: els.utilityKwh.value,
    sr: els.solarRate.value,
    sk: els.solarKwh.value,
    se: (document.querySelector('input[name="solar-escalator"]:checked') || {}).value || "0.0299",
    ue: selectedUtilityEscalator(),
    ad: els.address.value.trim(),
    ri: els.roofingInclude.checked ? 1 : 0,
    rp: els.roofingPrice.value,
    rm: els.roofingMonthly.value,
    bi: els.batteryInclude.checked ? 1 : 0,
    bm: els.batteryMonthly.value,
  };
}

function applyShare(data) {
  if (!data || data.v !== 1) return false;
  els.name.value = data.n || "";
  els.utilityName.value = data.u || "National Grid";
  els.utilityRate.value = data.ur || "";
  els.utilityKwh.value = data.uk || "";
  els.solarRate.value = data.sr || "";
  els.solarKwh.value = data.sk || "";
  if (data.se != null) setEscalator(String(data.se));
  if (data.ue != null) setUtilityEscalator(data.ue);
  els.address.value = data.ad || "";
  els.roofingInclude.checked = Boolean(data.ri);
  els.roofingPrice.value = data.rp || "";
  els.roofingMonthly.value = data.rm || "";
  els.batteryInclude.checked = Boolean(data.bi);
  els.batteryMonthly.value = data.bm || "";
  syncAddonFields();
  const parsed = readInputs();
  return Boolean(parsed.utilityRate && parsed.solarRate && parsed.utilityKwh && parsed.solarKwh);
}

async function shareClose() {
  const data = readInputs();
  if (!data.utilityRate || !data.solarRate || !data.utilityKwh || !data.solarKwh) return;
  const url = buildShareLink("index.html", packShare());
  const result = await shareOrCopy(
    url,
    "Your Trinity solar close",
    "Here’s the T-chart from Trinity Total Home."
  );
  flashShareButton(els.shareBtn, result);
}

function bootShare() {
  const raw = readShareHash();
  if (!raw) return false;
  try {
    if (!applyShare(decodeSharePayload(raw))) return false;
    sharedMode = true;
    document.body.classList.add("is-shared");
    if (els.sharedBanner) els.sharedBanner.hidden = false;
    showScreen("chart");
    return true;
  } catch {
    return false;
  }
}

function showScreen(name) {
  if (sharedMode && name === "input") return;
  const presenting = name === "chart";
  els.input.hidden = presenting;
  els.chart.hidden = !presenting;
  els.input.inert = presenting;
  els.chart.inert = !presenting;
  els.input.classList.toggle("is-active", !presenting);
  els.chart.classList.toggle("is-active", presenting);
  document.body.classList.toggle("presenting", presenting);
  window.scrollTo(0, 0);
  if (presenting) {
    flyoverOpen = false;
    presentRoofing = false;
    presentBattery = false;
    renderChart();
    drawSparkline();
    renderFlyover();
  } else {
    setWalking(false);
    closeCostPop();
  }
}

function setWalking(on) {
  walking = on;
  walkIndex = 0;
  document.body.classList.toggle("is-walking", on);
  els.walkBtn.setAttribute("aria-pressed", String(on));
  els.walkHint.hidden = !on;
  stepNodes().forEach((node) => node.classList.remove("is-shown"));
  if (on) {
    els.hbarUtil.style.width = "0";
    els.hbarSolar.style.width = "0";
  } else if (!els.chart.hidden) {
    renderChart();
  }
}

function revealNext() {
  const steps = stepNodes();
  if (walkIndex >= steps.length) {
    setWalking(false);
    return;
  }
  const node = steps[walkIndex];
  node.classList.add("is-shown");
  if (node.classList.contains("horizon")) {
    requestAnimationFrame(() => renderChart());
  }
  walkIndex += 1;
  if (walkIndex >= steps.length) {
    els.walkHint.hidden = true;
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = readInputs();
  if (!data.utilityRate || !data.solarRate || !data.utilityKwh || !data.solarKwh) {
    return;
  }
  saveInputs();
  showScreen("chart");
});

els.sampleBtn.addEventListener("click", () => {
  els.name.value = "The Barrett family";
  els.utilityName.value = "National Grid";
  els.utilityRate.value = "0.32";
  els.utilityKwh.value = "10800";
  els.solarRate.value = "0.189";
  els.solarKwh.value = "11200";
  setEscalator("0.0299");
  els.roofingInclude.checked = true;
  els.roofingPrice.value = "28500";
  els.roofingMonthly.value = "219";
  els.batteryInclude.checked = true;
  els.batteryMonthly.value = "95";
  syncAddonFields();
  rateHint(els.utilityRate, els.utilityRateHint);
  rateHint(els.solarRate, els.solarRateHint);
});

els.editBtn.addEventListener("click", () => showScreen("input"));

els.walkBtn.addEventListener("click", () => {
  setWalking(!walking);
});
if (els.shareBtn) {
  els.shareBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    shareClose();
  });
}

els.utilityRate.addEventListener("input", () => rateHint(els.utilityRate, els.utilityRateHint));
els.solarRate.addEventListener("input", () => rateHint(els.solarRate, els.solarRateHint));

els.rsaPhoto.addEventListener("change", async () => {
  const file = els.rsaPhoto.files && els.rsaPhoto.files[0];
  if (!file) return;
  try {
    const dataUrl = await fileToResizedDataUrl(file);
    flyoverVideoUrl = null;
    setRsaPreview(dataUrl);
  } catch (error) {
    els.rsaPhoto.value = "";
    window.alert(error.message || "Could not use that photo.");
  }
});

els.rsaClear.addEventListener("click", () => {
  flyoverVideoUrl = null;
  setRsaPreview(null);
});

els.address.addEventListener("input", () => {
  flyoverVideoUrl = null;
});

els.saveKeysBtn.addEventListener("click", saveKeys);

els.visualizeBtn.addEventListener("click", () => {
  flyoverOpen = true;
  renderFlyover();
  els.homeFlyover.scrollIntoView({ behavior: "smooth", block: "start" });
});

els.hideFlyoverBtn.addEventListener("click", () => {
  flyoverOpen = false;
  closeStillZoom();
  renderFlyover();
});

function closeStillZoom() {
  els.stillZoom.hidden = true;
  els.stillZoomImg.removeAttribute("src");
}

function openStillZoom(img) {
  if (!img || img.hidden || !(img.currentSrc || img.src)) return;
  els.stillZoomImg.src = img.currentSrc || img.src;
  els.stillZoomImg.alt = img.alt || "";
  const caption = img.closest("figure") && img.closest("figure").querySelector("figcaption");
  els.stillZoomCap.textContent = caption ? caption.textContent : "";
  els.stillZoom.hidden = false;
}

els.flyoverStills.addEventListener("click", (event) => {
  const img = event.target.closest(".still-frame.is-zoomable img");
  if (img) openStillZoom(img);
});

els.stillZoom.addEventListener("click", closeStillZoom);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeStillZoom();
});

els.roofingInclude.addEventListener("change", syncAddonFields);
els.batteryInclude.addEventListener("change", syncAddonFields);

els.presentRoofingBtn.addEventListener("click", () => {
  presentRoofing = !presentRoofing;
  renderChart();
});

els.presentBatteryBtn.addEventListener("click", () => {
  presentBattery = !presentBattery;
  renderChart();
});

function closeCostPop() {
  costPopKind = null;
  els.costPop.hidden = true;
}

function openCostPop(kind) {
  if (!costDetail || !costDetail[kind] || costDetail[kind].length < 2) return;
  costPopKind = kind;
  const isAnnual = kind === "annual";
  const total = isAnnual ? costDetail.annualTotal : costDetail.monthlyTotal;
  const util = isAnnual ? costDetail.utilAnnual : costDetail.utilMonthly;
  const save = isAnnual ? costDetail.annualSave : costDetail.monthlySave;
  els.costPopKicker.textContent = isAnnual ? "Annual cost" : "Monthly cost";
  els.costPopTitle.textContent = `What’s in ${money(total)}`;
  els.costPopList.innerHTML =
    costDetail[kind]
      .map(
        (row) => `<p>
          <span>
            <span class="bd-name">${row.name}</span>
            <span class="bd-math">${row.math}</span>
          </span>
          <strong>${money(row.amount)}</strong>
        </p>`
      )
      .join("") +
    `<p class="bd-total"><span>Together</span><strong>${money(total)}</strong></p>`;
  els.costPopVs.textContent =
    save > 0
      ? `Utility is ${money(util)} — ${money(save)} less on this side.`
      : `Utility is ${money(util)} on this side.`;
  els.costPop.hidden = false;
}

els.annualSolarCell.addEventListener("click", () => openCostPop("annual"));
els.monthlySolarCell.addEventListener("click", () => openCostPop("monthly"));
els.annualSolarCell.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openCostPop("annual");
  }
});
els.monthlySolarCell.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openCostPop("monthly");
  }
});
els.costPop.addEventListener("click", (event) => {
  if (event.target === els.costPop || event.target.closest("#cost-pop-close")) closeCostPop();
});

["input", "change"].forEach((evt) => {
  els.form.addEventListener(evt, saveInputs);
});

document.querySelectorAll('input[name="utility-escalator"]').forEach((input) => {
  input.addEventListener("change", () => {
    saveInputs();
    if (!els.chart.hidden) renderChart();
  });
});

document.addEventListener("click", (event) => {
  if (!walking || els.chart.hidden) return;
  if (event.target.closest(".present-tools, a, .util-path, .home-flyover, .visualize-wrap, .still-zoom, .addons-present, .cost-pop, .has-detail")) return;
  revealNext();
});

document.addEventListener("keydown", (event) => {
  if (els.chart.hidden) return;
  if (event.key === "Escape") {
    if (!els.costPop.hidden) {
      closeCostPop();
      return;
    }
    if (sharedMode) return;
    showScreen("input");
    return;
  }
  if (!walking) return;
  if (event.key === " " || event.key === "ArrowRight" || event.key === "Enter") {
    event.preventDefault();
    revealNext();
  }
});

if (!bootShare()) {
  loadInputs();
  fillKeyFields();
  loadRsa();
  syncAddonFields();
  rateHint(els.utilityRate, els.utilityRateHint);
  rateHint(els.solarRate, els.solarRateHint);
  drawSparkline();
} else {
  syncAddonFields();
  rateHint(els.utilityRate, els.utilityRateHint);
  rateHint(els.solarRate, els.solarRateHint);
}
