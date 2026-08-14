/**
 * Trinity Total Home — IKO Dynasty roof net-cost close
 * Page 1: squares + price per square
 * Page 2: total cost less value, energy, and insurance
 *
 * Value-add percentages: JLC / Zonda Cost vs. Value 2025, asphalt shingle roof
 * replacement, census-division recoup at resale.
 * Energy: conservative $/square/year for replacing an aged roof with a new
 * architectural Dynasty system (envelope + ventilation + reflectance),
 * regionalized for climate and energy prices.
 * Insurance: typical new-roof / impact-capable credit applied to a regional
 * average HO-3 premium, or the homeowner's premium if entered.
 */

const STORAGE_KEY = "trinity-roof-v1";

const REGIONS = {
  "new-england": {
    name: "New England",
    states: "MA, CT, RI, NH, VT, ME",
    recoup: 0.626,
    recoupLabel: "62.6%",
    jobCostAvg: 35701,
    resaleAvg: 22346,
    energyPerSquare: 11,
    premium: 1850,
    insuranceDiscount: 0.12,
    energyStory:
      "New England winters punish a tired roof — ice dams, attic heat loss, and granule-bare shingles that soak up summer sun. A new IKO Dynasty architectural system, installed with ice-and-water shield and proper ventilation, typically trims that waste.",
    insuranceStory:
      "Massachusetts and the rest of New England often surcharge or limit coverage once a roof is past 15–20 years. A new architectural system commonly earns a premium credit and restores replacement-cost treatment instead of actual cash value.",
  },
  "middle-atlantic": {
    name: "Middle Atlantic",
    states: "NY, NJ, PA",
    recoup: 0.583,
    recoupLabel: "58.3%",
    jobCostAvg: 37201,
    resaleAvg: 21680,
    energyPerSquare: 12,
    premium: 1700,
    insuranceDiscount: 0.12,
    energyStory:
      "A worn Mid-Atlantic roof runs hotter in summer and drafts more in winter. Moving to a new Dynasty architectural system — sealed, ventilated, and built as a full assembly — is the usual efficiency step from an aged 3-tab or end-of-life laminate.",
    insuranceStory:
      "Carriers in New York, New Jersey, and Pennsylvania routinely ask roof age at renewal. Re-roofing with a wind-rated architectural system is one of the most common ways to keep a full replacement-cost policy and a cleaner premium.",
  },
  "south-atlantic": {
    name: "South Atlantic",
    states: "DE, MD, DC, VA, WV, NC, SC, GA, FL",
    recoup: 0.699,
    recoupLabel: "69.9%",
    jobCostAvg: 32253,
    resaleAvg: 22535,
    energyPerSquare: 17,
    premium: 2800,
    insuranceDiscount: 0.15,
    energyStory:
      "Cooling dominates this region. Replacing a dark, aged roof with a new Dynasty architectural system — especially a cooler, more reflective color — cuts attic heat and air-conditioning run time in a way northern climates rarely see.",
    insuranceStory:
      "Wind and hurricane rules make roof age a gate. A new wind-rated architectural system is often the difference between a standard policy and a surcharge, a higher deductible, or a non-renewal.",
  },
  "east-north-central": {
    name: "East North Central",
    states: "OH, IN, IL, MI, WI",
    recoup: 0.692,
    recoupLabel: "69.2%",
    jobCostAvg: 29253,
    resaleAvg: 20252,
    energyPerSquare: 12,
    premium: 1750,
    insuranceDiscount: 0.12,
    energyStory:
      "Great Lakes weather swings from humid summers to hard winters. A new Dynasty system restores the thermal cap on the house — less attic heat in July, fewer ice-dam conditions in January — versus a cracked, curled, end-of-life roof.",
    insuranceStory:
      "Midwest carriers watch roof age and wind claims. Re-roofing with an architectural Performance shingle is a standard premium-relief and coverage-quality move at renewal.",
  },
  "west-north-central": {
    name: "West North Central",
    states: "MN, IA, MO, ND, SD, NE, KS",
    recoup: 0.542,
    recoupLabel: "54.2%",
    jobCostAvg: 30693,
    resaleAvg: 16650,
    energyPerSquare: 11,
    premium: 3200,
    insuranceDiscount: 0.18,
    energyStory:
      "Prairie summers and polar winters make the roof a real energy surface. A new Dynasty architectural system tightens the envelope and sheds heat better than a hail-bruised, granule-stripped roof.",
    insuranceStory:
      "Hail alley. A new impact-capable architectural roof is one of the largest insurance levers in the country — often a double-digit credit, and sometimes the only way to keep a carrier.",
  },
  "east-south-central": {
    name: "East South Central",
    states: "KY, TN, AL, MS",
    recoup: 0.81,
    recoupLabel: "81.0%",
    jobCostAvg: 25939,
    resaleAvg: 21012,
    energyPerSquare: 15,
    premium: 2300,
    insuranceDiscount: 0.14,
    energyStory:
      "Long cooling seasons reward a new architectural roof. Dynasty replaces a heat-soaked, leaking old shingle field with a sealed, ventilated system that keeps the attic closer to outdoor shade temperature.",
    insuranceStory:
      "Storm and hail exposure still drive premiums here. A documented new roof is a common credit and a cleaner claims conversation after the next severe-weather season.",
  },
  "west-south-central": {
    name: "West South Central",
    states: "AR, LA, OK, TX",
    recoup: 0.681,
    recoupLabel: "68.1%",
    jobCostAvg: 27116,
    resaleAvg: 18478,
    energyPerSquare: 16,
    premium: 3800,
    insuranceDiscount: 0.18,
    energyStory:
      "Hot roofs cook attics across Texas and the Gulf. A new Dynasty architectural system — and a cooler color when the homeowner picks one — is a straightforward cooling-load cut versus a 15- to 25-year-old asphalt roof.",
    insuranceStory:
      "Texas and Oklahoma premiums are among the highest in the country, and roof condition is a primary rating factor. Re-roofing, especially with impact-rated laminates, is the classic 10–25% credit conversation.",
  },
  mountain: {
    name: "Mountain",
    states: "MT, ID, WY, CO, NM, AZ, UT, NV",
    recoup: 0.717,
    recoupLabel: "71.7%",
    jobCostAvg: 28475,
    resaleAvg: 20427,
    energyPerSquare: 13,
    premium: 2100,
    insuranceDiscount: 0.14,
    energyStory:
      "High sun and big temperature swings. A new Dynasty system reflects more solar load than a faded, dark, end-of-life roof and reseals the attic against dry-air leakage.",
    insuranceStory:
      "Hail, wildfire ember exposure, and roof age all show up on Mountain-state policies. A new architectural roof is a standard mitigation credit and a resale expectation.",
  },
  pacific: {
    name: "Pacific",
    states: "WA, OR, CA, AK, HI",
    recoup: 0.762,
    recoupLabel: "76.2%",
    jobCostAvg: 36391,
    resaleAvg: 27742,
    energyPerSquare: 14,
    premium: 1600,
    insuranceDiscount: 0.1,
    energyStory:
      "California cooling loads and Pacific Northwest moisture both punish an old roof. Dynasty as a full system — underlayment, flashing, ventilation — is the efficiency upgrade from a failing asphalt field.",
    insuranceStory:
      "In tight insurance markets, an aged roof can block a policy altogether. A new architectural system is often required at bind or renewal, with a modest credit once it is in place.",
  },
  national: {
    name: "United States",
    states: "national average",
    recoup: 0.675,
    recoupLabel: "67.5%",
    jobCostAvg: 31871,
    resaleAvg: 21501,
    energyPerSquare: 13,
    premium: 2230,
    insuranceDiscount: 0.12,
    energyStory:
      "Nationally, moving from an aged 3-tab or worn laminate to a new architectural Dynasty system is worth on the order of ten to twenty dollars per square each year in heating and cooling — more in the South, less in heating-dominated North.",
    insuranceStory:
      "Across the country, a new roof is one of the most widely offered homeowners credits, typically in the 5–20% range, with hail and wind states at the high end.",
  },
};

const els = {
  input: document.getElementById("screen-input"),
  chart: document.getElementById("screen-chart"),
  form: document.getElementById("intake-form"),
  name: document.getElementById("customer-name"),
  region: document.getElementById("region"),
  regionHint: document.getElementById("region-hint"),
  squares: document.getElementById("squares"),
  pricePerSquare: document.getElementById("price-per-square"),
  liveMath: document.getElementById("live-math"),
  liveTotal: document.getElementById("live-total"),
  roofAge: document.getElementById("roof-age"),
  homeValue: document.getElementById("home-value"),
  insurancePremium: document.getElementById("insurance-premium"),
  premiumHint: document.getElementById("premium-hint"),
  sampleBtn: document.getElementById("sample-btn"),
  editBtn: document.getElementById("edit-btn"),
  walkBtn: document.getElementById("walk-btn"),
  walkHint: document.getElementById("walk-hint"),
  preparedFor: document.getElementById("prepared-for"),
  recapSquares: document.getElementById("recap-squares"),
  recapPps: document.getElementById("recap-pps"),
  recapTotal: document.getElementById("recap-total"),
  wfTotal: document.getElementById("wf-total"),
  wfTotalNote: document.getElementById("wf-total-note"),
  wfValue: document.getElementById("wf-value"),
  wfValueNote: document.getElementById("wf-value-note"),
  wfEnergy: document.getElementById("wf-energy"),
  wfEnergyNote: document.getElementById("wf-energy-note"),
  wfInsurance: document.getElementById("wf-insurance"),
  wfInsuranceNote: document.getElementById("wf-insurance-note"),
  wfNet: document.getElementById("wf-net"),
  wfNetTitle: document.getElementById("wf-net-title"),
  wfNetNote: document.getElementById("wf-net-note"),
  netRow: document.querySelector(".waterfall-row.is-net"),
  netPerSquare: document.getElementById("net-per-square"),
  valueHeadline: document.getElementById("value-headline"),
  valueBody: document.getElementById("value-body"),
  valueBadge: document.getElementById("value-badge"),
  valueBadgeCopy: document.getElementById("value-badge-copy"),
  energyBody: document.getElementById("energy-body"),
  energyBadge: document.getElementById("energy-badge"),
  energyBadgeCopy: document.getElementById("energy-badge-copy"),
  insuranceHeadline: document.getElementById("insurance-headline"),
  insuranceBody: document.getElementById("insurance-body"),
  insuranceBadge: document.getElementById("insurance-badge"),
  insuranceBadgeCopy: document.getElementById("insurance-badge-copy"),
  disclaimer: document.getElementById("disclaimer"),
  benefitPop: document.getElementById("benefit-pop"),
  benefitPopKicker: document.getElementById("benefit-pop-kicker"),
  benefitPopTitle: document.getElementById("benefit-pop-title"),
  benefitPopMath: document.getElementById("benefit-pop-math"),
  benefitPopBody: document.getElementById("benefit-pop-body"),
  benefitPopCites: document.getElementById("benefit-pop-cites"),
  benefitPopClose: document.getElementById("benefit-pop-close"),
};

let walking = false;
let walkIndex = 0;
let lastModel = null;
let openBenefit = null;
const stepNodes = () =>
  [...document.querySelectorAll("#screen-chart [data-step]")].filter((node) => !node.hidden);

function parseMoney(raw) {
  const n = Number(String(raw || "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseNumber(raw) {
  const n = Number(String(raw || "").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function money(n, digits = 0) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return n < 0 ? `−${formatted}` : formatted;
}

function pctLabel(rate) {
  const rounded = Math.round(rate * 1000) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function regionOf(id) {
  return REGIONS[id] || REGIONS["new-england"];
}

function selectedHorizon() {
  const checked = document.querySelector('input[name="horizon-years"]:checked');
  const n = Number(checked && checked.value);
  return n === 10 || n === 25 ? n : 20;
}

function setHorizon(years) {
  const radio = document.querySelector(`input[name="horizon-years"][value="${years}"]`);
  if (radio) radio.checked = true;
}

function readInputs() {
  return {
    name: els.name.value.trim(),
    region: els.region.value,
    squares: parseNumber(els.squares.value),
    pricePerSquare: parseMoney(els.pricePerSquare.value),
    roofAge: parseNumber(els.roofAge.value),
    homeValue: parseMoney(els.homeValue.value),
    insurancePremium: parseMoney(els.insurancePremium.value),
    horizonYears: selectedHorizon(),
  };
}

function compute(data) {
  const region = regionOf(data.region);
  const squares = data.squares;
  const pps = data.pricePerSquare;
  const total = Math.round(squares * pps);
  const valueAdd = Math.round(total * region.recoup);
  const premium = data.insurancePremium > 0 ? data.insurancePremium : region.premium;
  const usedEnteredPremium = data.insurancePremium > 0;
  const energyAnnual = Math.round(squares * region.energyPerSquare);
  const insuranceAnnual = Math.round(premium * region.insuranceDiscount);
  const years = data.horizonYears;
  const energyTotal = energyAnnual * years;
  const insuranceTotal = insuranceAnnual * years;
  const net = total - valueAdd - energyTotal - insuranceTotal;
  return {
    region,
    squares,
    pps,
    total,
    valueAdd,
    premium,
    usedEnteredPremium,
    energyAnnual,
    insuranceAnnual,
    years,
    energyTotal,
    insuranceTotal,
    net,
    roofAge: data.roofAge,
    homeValue: data.homeValue,
    name: data.name,
  };
}

function saveInputs() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      name: els.name.value,
      region: els.region.value,
      squares: els.squares.value,
      pricePerSquare: els.pricePerSquare.value,
      roofAge: els.roofAge.value,
      homeValue: els.homeValue.value,
      insurancePremium: els.insurancePremium.value,
      horizonYears: selectedHorizon(),
    })
  );
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    els.name.value = data.name || "";
    els.region.value = data.region || "new-england";
    els.squares.value = data.squares || "";
    els.pricePerSquare.value = data.pricePerSquare || "";
    els.roofAge.value = data.roofAge || "";
    els.homeValue.value = data.homeValue || "";
    els.insurancePremium.value = data.insurancePremium || "";
    if (data.horizonYears) setHorizon(data.horizonYears);
  } catch {
    /* ignore */
  }
}

function updateRegionHint() {
  const region = regionOf(els.region.value);
  els.regionHint.textContent = `${region.name} recoups ${region.recoupLabel} of an asphalt roof at resale (JLC 2025). ${region.states}.`;
  els.premiumHint.textContent = els.insurancePremium.value.trim()
    ? "Using this home’s premium for the insurance line."
    : `Leave blank to use ${money(region.premium)} / year, the ${region.name} average in this model.`;
}

function updateLiveTotal() {
  const data = readInputs();
  if (!data.squares || !data.pricePerSquare) {
    els.liveMath.textContent = "Enter squares and price per square";
    els.liveTotal.textContent = "—";
    return;
  }
  const total = data.squares * data.pricePerSquare;
  const sqLabel =
    data.squares % 1 === 0 ? String(data.squares) : data.squares.toFixed(1).replace(/\.0$/, "");
  els.liveMath.textContent = `${sqLabel} squares × ${money(data.pricePerSquare)}`;
  els.liveTotal.textContent = money(Math.round(total));
}

function squaresLabel(n) {
  const rounded = n % 1 === 0 ? String(n) : n.toFixed(1).replace(/\.0$/, "");
  return `${rounded} sq`;
}

function jlcUrl(regionId) {
  if (regionId === "national") return "https://www.jlconline.com/cost-vs-value/2025/";
  return `https://www.jlconline.com/cost-vs-value/2025/${regionId}/`;
}

function citeLink(href, label) {
  return `<a class="source-link" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function mathRow(name, math, amount) {
  return `<p>
    <span>
      <span class="bd-name">${name}</span>
      <span class="bd-math">${math}</span>
    </span>
    <strong>${amount}</strong>
  </p>`;
}

function benefitCopy(kind, m) {
  if (kind === "value") {
    const homeLine = m.homeValue
      ? ` On this ${money(m.homeValue)} home, ${money(m.valueAdd)} is ${((m.valueAdd / m.homeValue) * 100).toFixed(1)}% of today’s value.`
      : "";
    return {
      kicker: "Value add-back",
      title: `${m.region.recoupLabel} recoup in ${m.region.name}`,
      math:
        mathRow("This Dynasty roof", `${squaresLabel(m.squares)} × ${money(m.pps)}`, money(m.total)) +
        mathRow(
          `${m.region.name} recoup rate`,
          `JLC 2025 asphalt roof · ${m.region.states}`,
          m.region.recoupLabel
        ) +
        `<p class="bd-total"><span>Value add-back</span><strong>${money(m.valueAdd)}</strong></p>`,
      body:
        `JLC’s 2025 Cost vs. Value report estimates what buyers typically pay back at resale. ` +
        `In ${m.region.name}, a midrange asphalt roof job averages ${money(m.region.jobCostAvg)} and adds about ` +
        `${money(m.region.resaleAvg)} — ${m.region.recoupLabel} of cost. Applied to this contract, that is ` +
        `${money(m.valueAdd)}. It is a resale estimate, not a check at install.${homeLine}`,
      cites: [
        citeLink(jlcUrl(els.region.value), `JLC Cost vs. Value 2025 — ${m.region.name}`),
        citeLink("https://www.jlconline.com/cost-vs-value/2025/", "JLC Cost vs. Value 2025 — national (67.5% / 68%)"),
        citeLink(
          "https://www.morrisonshomeimprovement.com/copy-of-new-england-2024-cost-vs-value",
          "New England 2025 table (asphalt roof 62.6%)"
        ),
      ].join(""),
    };
  }

  if (kind === "energy") {
    return {
      kicker: "Energy efficiency",
      title: `${money(m.energyTotal)} over ${m.years} years`,
      math:
        mathRow("Roof size", squaresLabel(m.squares), squaresLabel(m.squares)) +
        mathRow(
          `${m.region.name} annual benefit`,
          `${money(m.region.energyPerSquare)} per square · aged roof → new Dynasty system`,
          money(m.energyAnnual)
        ) +
        mathRow("Benefit window", `${m.years} years at today’s dollars`, `${m.years} yrs`) +
        `<p class="bd-total"><span>Energy efficiency</span><strong>${money(m.energyTotal)}</strong></p>`,
      body:
        m.region.energyStory +
        ` This close uses ${money(m.region.energyPerSquare)} per square per year — in the range DOE and LBNL publish ` +
        `for moving off a dark, worn asphalt roof onto a new architectural system with a sealed, ventilated attic. ` +
        `IKO Dynasty is a laminated Performance shingle (ArmourZone, FastLock, Class 3 impact). Cool Colors Plus adds ` +
        `infrared-reflective granules (SRI 20+) where that color is selected. Not a utility-bill guarantee.`,
      cites: [
        citeLink("https://www.energy.gov/energysaver/cool-roofs", "U.S. DOE — Cool roofs"),
        citeLink("https://heatisland.lbl.gov/coolscience/cool-roofs", "LBNL Heat Island Group — Cool roofs"),
        citeLink("https://www.iko.com/na/product/dynasty/", "IKO Dynasty Performance shingles"),
        citeLink("https://www.iko.com/na/product/dynasty-cool-plus/", "IKO Dynasty Cool Colors Plus"),
      ].join(""),
    };
  }

  const premiumSource = m.usedEnteredPremium
    ? "this home’s annual premium"
    : `the ${m.region.name} average premium in this model`;
  const ageLine = m.roofAge ? ` This roof is about ${Math.round(m.roofAge)} years old.` : "";
  return {
    kicker: "Insurance benefits",
    title: `${money(m.insuranceTotal)} over ${m.years} years`,
    math:
      mathRow("Annual premium", premiumSource, money(m.premium)) +
      mathRow(
        "Typical new-roof credit",
        `${pctLabel(m.region.insuranceDiscount)} · ${m.region.name} (national conversation 5–25%)`,
        money(m.insuranceAnnual)
      ) +
      mathRow("Benefit window", `${m.years} years at today’s dollars`, `${m.years} yrs`) +
      `<p class="bd-total"><span>Insurance benefits</span><strong>${money(m.insuranceTotal)}</strong></p>`,
    body:
      m.region.insuranceStory +
      ageLine +
      ` Triple-I notes that stronger roofing and wind-mitigation work can cut premiums, and its 2024 roof toolkit ` +
      `puts impact-resistant credits commonly in the 5–35% range depending on state and carrier. ` +
      `This close uses ${pctLabel(m.region.insuranceDiscount)} of ${money(m.premium)} — ${money(m.insuranceAnnual)} a year. ` +
      `Some carriers also restore replacement-cost coverage only after a re-roof. Confirm with this home’s insurer.`,
    cites: [
      citeLink(
        "https://www.iii.org/article/12-ways-to-lower-your-homeowners-insurance-costs",
        "Triple-I — 12 ways to lower homeowners insurance costs"
      ),
      citeLink(
        "https://www.iii.org/sites/default/files/docs/pdf/triple-i_roof_toolkit_2024.pdf",
        "Triple-I — How your roof influences insurance (2024)"
      ),
      citeLink(
        "https://insuranceindustryblog.iii.org/why-roof-resilience-matters-more-than-ever/",
        "Triple-I — Why roof resilience matters"
      ),
      citeLink("https://ibhs.org/fortified/", "IBHS FORTIFIED Roof — resilience standard & discounts"),
    ].join(""),
  };
}

function closeBenefitPop() {
  openBenefit = null;
  if (!els.benefitPop) return;
  els.benefitPop.hidden = true;
  els.benefitPop.classList.remove("is-open");
}

function openBenefitPop(kind) {
  if (!lastModel || !els.benefitPop || !["value", "energy", "insurance"].includes(kind)) return;
  openBenefit = kind;
  const copy = benefitCopy(kind, lastModel);
  els.benefitPopKicker.textContent = copy.kicker;
  els.benefitPopTitle.textContent = copy.title;
  els.benefitPopMath.innerHTML = copy.math;
  els.benefitPopBody.textContent = copy.body;
  els.benefitPopCites.innerHTML = copy.cites;
  els.benefitPop.hidden = false;
  els.benefitPop.classList.add("is-open");
}

function renderChart() {
  const data = readInputs();
  if (!data.squares || !data.pricePerSquare) return;
  const m = compute(data);
  lastModel = m;
  const ageBit = m.roofAge
    ? ` This roof is about ${Math.round(m.roofAge)} years old.`
    : "";
  const valueShare = m.homeValue
    ? ` On a ${money(m.homeValue)} home, that add-back is ${((m.valueAdd / m.homeValue) * 100).toFixed(1)}% of today’s value.`
    : "";

  els.preparedFor.textContent = m.name ? `Prepared for ${m.name}` : "";

  els.recapSquares.textContent = squaresLabel(m.squares);
  els.recapPps.textContent = money(m.pps);
  els.recapTotal.textContent = money(m.total);

  els.wfTotal.textContent = money(m.total);
  els.wfTotalNote.textContent = `${squaresLabel(m.squares)} × ${money(m.pps)} · IKO Dynasty architectural system`;

  els.wfValue.textContent = `−${money(m.valueAdd)}`;
  els.wfValueNote.textContent = `${m.region.recoupLabel} recoup in ${m.region.name} · tap for sources`;

  els.wfEnergy.textContent = `−${money(m.energyTotal)}`;
  els.wfEnergyNote.textContent = `${money(m.energyAnnual)} / year × ${m.years} years · tap for sources`;

  els.wfInsurance.textContent = `−${money(m.insuranceTotal)}`;
  els.wfInsuranceNote.textContent = `${pctLabel(m.region.insuranceDiscount)} of ${money(m.premium)} / year · tap for sources`;

  const netIsGain = m.net < 0;
  els.netRow.classList.toggle("is-gain", netIsGain);
  els.wfNetTitle.textContent = netIsGain ? "Net gain after benefits" : "Net cost after benefits";
  els.wfNet.textContent = netIsGain ? money(Math.abs(m.net)) : money(m.net);
  els.wfNetNote.textContent = netIsGain
    ? "Benefits more than cover the contract price in this window"
    : "What remains after value, energy, and insurance";

  const perSq = m.squares ? m.net / m.squares : 0;
  els.netPerSquare.textContent = netIsGain
    ? `${money(Math.abs(m.net))} to the good — ${money(Math.abs(perSq))} per square, after benefits.`
    : `${money(m.net)} net — ${money(perSq)} per square, after benefits.`;

  els.valueHeadline.innerHTML = `${m.region.name} buyers recoup <em>${m.region.recoupLabel}</em>.`;
  els.valueBody.textContent =
    `JLC’s 2025 Cost vs. Value report puts a typical asphalt roof replacement in ${m.region.name} ` +
    `at ${money(m.region.jobCostAvg)}, adding about ${money(m.region.resaleAvg)} at resale — ` +
    `${m.region.recoupLabel} of cost. Applied to this ${money(m.total)} Dynasty roof, that is ` +
    `${money(m.valueAdd)} of value add-back.${valueShare}`;
  els.valueBadge.textContent = m.region.recoupLabel;
  els.valueBadgeCopy.textContent = `of project cost typically recouped at resale in ${m.region.name}`;

  els.energyBody.textContent =
    m.region.energyStory +
    ` In this model that is ${money(m.region.energyPerSquare)} per square per year, or ` +
    `${money(m.energyAnnual)} a year on ${squaresLabel(m.squares)} — ${money(m.energyTotal)} over ${m.years} years. ` +
    `IKO Dynasty is a laminated architectural Performance shingle (ArmourZone nailing, FastLock sealant, ` +
    `limited lifetime / 15-year Iron Clad). The jump is from an old, thin, leaking roof to a full new system.`;
  els.energyBadge.textContent = money(m.energyAnnual);
  els.energyBadgeCopy.textContent = `typical annual efficiency benefit on this roof, ${m.region.name}`;

  els.insuranceHeadline.innerHTML = m.roofAge
    ? `A ${Math.round(m.roofAge)}-year roof is a <em>rated</em> roof.`
    : "Carriers price the roof they see.";
  els.insuranceBody.textContent =
    m.region.insuranceStory +
    ageBit +
    ` This close uses a ${pctLabel(m.region.insuranceDiscount)} credit on ` +
    `${money(m.premium)} a year` +
    (m.usedEnteredPremium ? " (this home’s premium)" : ` (the ${m.region.name} average in the model)`) +
    ` — ${money(m.insuranceAnnual)} a year, ${money(m.insuranceTotal)} over ${m.years} years. ` +
    `Credits are carrier-specific; 5–25% is the national conversation, with hail and wind states at the top.`;
  els.insuranceBadge.textContent = money(m.insuranceAnnual);
  els.insuranceBadgeCopy.textContent = `typical annual premium relief after re-roofing, ${m.region.name}`;

  els.disclaimer.textContent =
    `Value add-back applies the ${m.region.name} asphalt-roof recoup rate from the 2025 Journal of Light Construction ` +
    `/ Zonda Cost vs. Value report (${m.region.recoupLabel}; national average 67.5%) to this contract price. ` +
    `That recoup is a resale estimate, not cash back at install. Energy is ${money(m.region.energyPerSquare)} per roof square ` +
    `per year × ${squaresLabel(m.squares)} × ${m.years} years — a conservative regional figure for replacing an aged asphalt roof ` +
    `with a new architectural IKO Dynasty system (ventilation, ice-and-water shield, restored envelope, modest reflectance). ` +
    `It is not a utility-bill guarantee and is not Dynasty Cool Colors Plus–specific. Insurance is ` +
    `${pctLabel(m.region.insuranceDiscount)} of ${money(m.premium)} / year × ${m.years} years` +
    (m.usedEnteredPremium ? " using the premium entered for this home." : ` using a ${m.region.name} average premium.`) +
    ` Actual carrier credits range roughly 5–25% and some policies require a new roof to bind or to keep replacement-cost coverage. ` +
    `Value, energy, and insurance accrue on different timelines. Illustrative kitchen-table math — not a savings, appraisal, or insurance guarantee.`;

  if (openBenefit) openBenefitPop(openBenefit);
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
  if (presenting) renderChart();
  else {
    setWalking(false);
    closeBenefitPop();
  }
}

function setWalking(on) {
  walking = on;
  walkIndex = 0;
  document.body.classList.toggle("is-walking", on);
  els.walkBtn.setAttribute("aria-pressed", String(on));
  els.walkHint.hidden = !on;
  stepNodes().forEach((node) => node.classList.remove("is-shown"));
  if (!on && !els.chart.hidden) renderChart();
}

function revealNext() {
  const steps = stepNodes();
  const remaining = steps.filter((node) => !node.classList.contains("is-shown"));
  if (!remaining.length) {
    setWalking(false);
    return;
  }
  const nextIndex = remaining[0].getAttribute("data-step");
  remaining
    .filter((node) => node.getAttribute("data-step") === nextIndex)
    .forEach((node) => node.classList.add("is-shown"));
  if (stepNodes().every((node) => node.classList.contains("is-shown"))) {
    els.walkHint.hidden = true;
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = readInputs();
  if (!data.squares || !data.pricePerSquare) return;
  saveInputs();
  showScreen("chart");
});

els.sampleBtn.addEventListener("click", () => {
  els.name.value = "The Barrett family";
  els.region.value = "new-england";
  els.squares.value = "26";
  els.pricePerSquare.value = "1095";
  els.roofAge.value = "22";
  els.homeValue.value = "625000";
  els.insurancePremium.value = "1840";
  setHorizon(20);
  updateRegionHint();
  updateLiveTotal();
});

els.editBtn.addEventListener("click", () => showScreen("input"));
els.walkBtn.addEventListener("click", () => setWalking(!walking));

["input", "change"].forEach((evt) => {
  els.form.addEventListener(evt, () => {
    saveInputs();
    updateRegionHint();
    updateLiveTotal();
  });
});

document.querySelectorAll('input[name="horizon-years"]').forEach((input) => {
  input.addEventListener("change", () => {
    saveInputs();
    if (!els.chart.hidden) renderChart();
  });
});

document.getElementById("waterfall").addEventListener("click", (event) => {
  const row = event.target.closest("[data-benefit]");
  if (!row || els.chart.hidden) return;
  event.preventDefault();
  event.stopPropagation();
  openBenefitPop(row.getAttribute("data-benefit"));
});

document.querySelectorAll("[data-benefit]").forEach((row) => {
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      openBenefitPop(row.getAttribute("data-benefit"));
    }
  });
});

if (els.benefitPop) {
  els.benefitPop.addEventListener("click", (event) => {
    if (event.target === els.benefitPop || event.target.closest("#benefit-pop-close")) {
      closeBenefitPop();
    }
  });
}

document.addEventListener("click", (event) => {
  if (!walking || els.chart.hidden) return;
  if (event.target.closest(".present-tools, a, .util-path, .has-detail, .cost-pop")) return;
  revealNext();
});

document.addEventListener("keydown", (event) => {
  if (els.chart.hidden) return;
  if (event.key === "Escape") {
    if (!els.benefitPop.hidden) {
      closeBenefitPop();
      return;
    }
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
updateRegionHint();
updateLiveTotal();
