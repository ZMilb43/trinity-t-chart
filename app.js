/**
 * Trinity Total Home — Ben Franklin T-chart close
 * Page 1: utility + solar intake
 * Page 2: customer-facing comparison
 */

const STORAGE_KEY = "trinity-tchart-v1";
const SOLAR_ESCALATOR = 0.0299;
const UTILITY_ESCALATOR = 0.10;
const HORIZON_YEARS = 10;

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
  horizonUtil: document.getElementById("horizon-util"),
  horizonSolar: document.getElementById("horizon-solar"),
  horizonUtilLabel: document.getElementById("horizon-util-label"),
  horizonSave: document.getElementById("horizon-save"),
  hbarUtil: document.getElementById("hbar-util"),
  hbarSolar: document.getElementById("hbar-solar"),
  sparkline: document.getElementById("sparkline"),
};

let walking = false;
let walkIndex = 0;
const stepNodes = () => [...document.querySelectorAll("#screen-chart [data-step]")];

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
  };
}

function saveInputs() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      name: els.name.value,
      utilityName: els.utilityName.value,
      utilityRate: els.utilityRate.value,
      utilityKwh: els.utilityKwh.value,
      solarRate: els.solarRate.value,
      solarKwh: els.solarKwh.value,
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
  } catch {
    /* ignore */
  }
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

function renderChart() {
  const data = readInputs();
  if (!data.utilityRate || !data.solarRate || !data.utilityKwh || !data.solarKwh) return;

  const utilAnnual = data.utilityRate * data.utilityKwh;
  const solarAnnual = data.solarRate * data.solarKwh;
  const utilMonthly = utilAnnual / 12;
  const solarMonthly = solarAnnual / 12;
  const annualSave = utilAnnual - solarAnnual;
  const monthlySave = utilMonthly - solarMonthly;
  const coverage = (data.solarKwh / data.utilityKwh) * 100;

  const util10 = escalatingSum(utilAnnual, UTILITY_ESCALATOR, HORIZON_YEARS);
  const solar10 = escalatingSum(solarAnnual, SOLAR_ESCALATOR, HORIZON_YEARS);
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
      ? `produced each year · covers ${Math.round(coverage)}% of usage`
      : `produced each year · ${Math.round(coverage)}% of usage`;

  els.utilAnnual.textContent = money(utilAnnual);
  els.solarAnnual.textContent = money(solarAnnual);
  els.annualSaveSub.textContent =
    annualSave > 0 ? `${money(annualSave)} less in year one` : "year one";

  els.utilMonthly.textContent = money(utilMonthly);
  els.solarMonthly.textContent = money(solarMonthly);
  els.monthlySaveSub.textContent =
    monthlySave > 0 ? `${money(monthlySave)} less each month` : "average month";

  els.horizonUtilLabel.textContent = data.utilityName === "Utility" ? "Utility" : data.utilityName;
  els.horizonUtil.textContent = money(util10);
  els.horizonSolar.textContent = money(solar10);
  els.horizonSave.textContent =
    save10 > 0
      ? `${money(save10)} less over 10 years — with a rate that cannot run away.`
      : "Ten-year totals using the escalators above.";

  els.hbarUtil.style.width = "0%";
  els.hbarSolar.style.width = "0%";
  requestAnimationFrame(() => {
    els.hbarUtil.style.width = `${(util10 / maxBar) * 100}%`;
    els.hbarSolar.style.width = `${(solar10 / maxBar) * 100}%`;
  });
}

function showScreen(name) {
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
    renderChart();
    drawSparkline();
  } else {
    setWalking(false);
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
  rateHint(els.utilityRate, els.utilityRateHint);
  rateHint(els.solarRate, els.solarRateHint);
});

els.editBtn.addEventListener("click", () => showScreen("input"));

els.walkBtn.addEventListener("click", () => {
  setWalking(!walking);
});

els.utilityRate.addEventListener("input", () => rateHint(els.utilityRate, els.utilityRateHint));
els.solarRate.addEventListener("input", () => rateHint(els.solarRate, els.solarRateHint));

["input", "change"].forEach((evt) => {
  els.form.addEventListener(evt, saveInputs);
});

document.addEventListener("click", (event) => {
  if (!walking || els.chart.hidden) return;
  if (event.target.closest(".present-tools")) return;
  revealNext();
});

document.addEventListener("keydown", (event) => {
  if (els.chart.hidden) return;
  if (event.key === "Escape") {
    showScreen("input");
    return;
  }
  if (!walking) return;
  if (event.key === " " || event.key === "ArrowRight" || event.key === "Enter") {
    event.preventDefault();
    revealNext();
  }
});

loadInputs();
rateHint(els.utilityRate, els.utilityRateHint);
rateHint(els.solarRate, els.solarRateHint);
drawSparkline();
