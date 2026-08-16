/* Spend vs. Borrow: same savings and cash needs, funded two ways.
   A: cash needs come out of the assets.
   B: cash needs are borrowed against an insurance policy; the loan compounds
      and is never repaid. B is "out of money" when loan >= assets (net worth <= 0). */

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 760, H = 380;
const PAD = { top: 16, right: 16, bottom: 34, left: 64 };

let sim = null;       // {a, b, inputs}
let seriesList = [];  // [{name, colorVar, rows: [{year, value}]}]
let chartGeom = null;

function readInputs() {
  return {
    savings: numInput("savings", 100000, 0, 1e12),
    expense: numInput("expense", 60000, 0, 1e12),
    accYears: Math.round(numInput("acc-years", 20, 0, 100)),
    /* Each scenario carries its own growth rate so the two can be compared on
       different assumptions — e.g. a taxable fund against a policy account. */
    aRatePct: numInput("a-rate", 8, -50, 100),
    bRatePct: numInput("b-rate", 8, -50, 100),
    retire: numInput("retire", 300000, 0, 1e12),
    horizon: Math.round(numInput("horizon", 35, 1, 120)),
    premium: numInput("premium", 10000, 0, 1e12),
    loanRatePct: numInput("loan-rate", 5, 0, 50),
    coverage: numInput("coverage", 1000000, 0, 1e12),
  };
}

/* Beginning-of-year convention: all cash flows (savings, premium, cashout,
   borrowing) happen at the start of the year, then growth/interest applies. */
function simulate(inp) {
  const rA = inp.aRatePct / 100;
  const rB = inp.bRatePct / 100;
  const lr = inp.loanRatePct / 100;

  // Scenario A: single asset balance, cash needs deducted from it
  const a = { rows: [{ year: 0, balance: 0 }], depletionYear: null };
  let bal = 0;
  for (let y = 1; y <= inp.horizon; y++) {
    const flow = y <= inp.accYears ? inp.savings - inp.expense : -inp.retire;
    bal = (bal + flow) * (1 + rA);
    if (bal <= 0 && flow < 0) {
      a.rows.push({ year: y, balance: 0 });
      a.depletionYear = y;
      break;
    }
    a.rows.push({ year: y, balance: bal });
  }

  // Scenario B: assets untouched except the premium (paid every year); cash needs borrowed
  const b = { rows: [{ year: 0, assets: 0, loan: 0, net: 0 }], depletionYear: null, minNet: null };
  let assets = 0, loan = 0;
  for (let y = 1; y <= inp.horizon; y++) {
    const saving = y <= inp.accYears;
    assets = (assets + (saving ? inp.savings - inp.premium : -inp.premium)) * (1 + rB);
    loan = (loan + (saving ? inp.expense : inp.retire)) * (1 + lr);
    const net = assets - loan;
    if (net <= 0) {
      b.rows.push({ year: y, assets, loan, net: 0 });
      b.depletionYear = y;
      break;
    }
    b.rows.push({ year: y, assets, loan, net });
    if (y > inp.accYears && (b.minNet === null || net < b.minNet.net)) {
      b.minNet = { year: y, net };
    }
  }

  return { a, b, inputs: inp };
}

function readInputsAndRender() {
  sim = simulate(readInputs());
  seriesList = [
    { name: "A net worth", colorVar: "--series-1",
      rows: sim.a.rows.map(d => ({ year: d.year, value: d.balance })),
      depletionYear: sim.a.depletionYear },
    { name: "B net worth", colorVar: "--series-2",
      rows: sim.b.rows.map(d => ({ year: d.year, value: d.net })),
      depletionYear: sim.b.depletionYear },
    { name: "B assets", colorVar: "--series-3",
      rows: sim.b.rows.map(d => ({ year: d.year, value: d.assets })) },
    { name: "B loan", colorVar: "--series-4",
      rows: sim.b.rows.map(d => ({ year: d.year, value: d.loan })) },
  ];
  renderTiles();
  renderChart();
  renderTable();
  bkRescale();
}

/* Verdict for the "Money runs out" hero tile of each column */
function verdict(depletionYear, accYears, horizon, growing) {
  if (depletionYear !== null) {
    return {
      cls: "bad", big: `Year ${depletionYear}`,
      sub: `Depleted in withdrawal year ${depletionYear - accYears}`,
    };
  }
  return growing
    ? { cls: "ok", big: "Never", sub: "Keeps growing for good" }
    : { cls: "", big: `> ${horizon} yrs`, sub: `Still solvent at year ${horizon} (shrinking)` };
}

function renderTiles() {
  const { a, b, inputs } = sim;
  const accA = a.rows[Math.min(inputs.accYears, a.rows.length - 1)].balance;
  const accB = b.rows[Math.min(inputs.accYears, b.rows.length - 1)];
  const lastA = a.rows[a.rows.length - 1], prevA = a.rows[a.rows.length - 2];
  const lastB = b.rows[b.rows.length - 1], prevB = b.rows[b.rows.length - 2];
  const growingA = a.depletionYear === null && (!prevA || lastA.balance >= prevA.balance);
  const growingB = b.depletionYear === null && (!prevB || lastB.net >= prevB.net);
  const vA = verdict(a.depletionYear, inputs.accYears, inputs.horizon, growingA);
  const vB = verdict(b.depletionYear, inputs.accYears, inputs.horizon, growingB);

  document.getElementById("tiles-a").innerHTML = `
    <div class="tile verdict ${vA.cls}">
      <div class="label">Money runs out</div>
      <div class="value">${vA.big}</div>
      <div class="sub">${vA.sub} — withdrawing ${fmtCurrency(inputs.retire)}/yr from year ${inputs.accYears + 1}</div>
    </div>
    <div class="tile">
      <div class="label">Assets after saving phase</div>
      <div class="value" style="font-size:1.3rem">${fmtCurrency(accA)}</div>
      <div class="sub">End of year ${inputs.accYears}; cash needs paid from assets</div>
    </div>
    <div class="tile">
      <div class="label">Max sustainable withdrawal</div>
      <div class="value" style="font-size:1.3rem">${fmtCurrency(Math.max(0, accA * inputs.aRatePct / 100))}/yr</div>
      <div class="sub">${inputs.aRatePct}% of the year-${inputs.accYears} balance</div>
    </div>`;

  document.getElementById("tiles-b").innerHTML = `
    <div class="tile verdict ${vB.cls}">
      <div class="label">Money runs out</div>
      <div class="value">${vB.big}</div>
      <div class="sub">${vB.sub} — borrowing ${fmtCurrency(inputs.retire)}/yr at ${inputs.loanRatePct}%, never repaid</div>
    </div>
    <div class="tile">
      <div class="label">Assets / loan after saving phase</div>
      <div class="value" style="font-size:1.3rem">${fmtCurrency(accB.assets)} / ${fmtCurrency(accB.loan)}</div>
      <div class="sub">Net worth ${fmtCurrency(accB.net)} at end of year ${inputs.accYears}</div>
    </div>
    <div class="tile">
      <div class="label">Lowest net worth after retiring</div>
      <div class="value" style="font-size:1.3rem">${b.minNet ? fmtCurrency(b.minNet.net) : "—"}</div>
      <div class="sub">${b.minNet ? `In year ${b.minNet.year}, then rising` : "No drawdown years simulated"}</div>
    </div>`;
}

/* ---- Chart ---- */

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function el(name, attrs) {
  const e = document.createElementNS(SVG_NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function renderChart() {
  const svg = document.getElementById("chart");
  svg.innerHTML = "";

  const years = Math.max(1, ...seriesList.map(s => s.rows[s.rows.length - 1].year));
  const maxVal = Math.max(1, ...seriesList.flatMap(s => s.rows.map(d => d.value)));
  const ticks = niceTicks(maxVal, 5);
  const yMax = ticks[ticks.length - 1];

  const x = year => PAD.left + (year / years) * (W - PAD.left - PAD.right);
  const y = v => H - PAD.bottom - (v / yMax) * (H - PAD.top - PAD.bottom);
  chartGeom = { x, y, years };

  const muted = cssVar("--text-muted"), grid = cssVar("--gridline"), base = cssVar("--baseline");
  const surface = cssVar("--surface-1");

  for (const t of ticks) {
    if (t > 0) svg.appendChild(el("line", {
      x1: PAD.left, x2: W - PAD.right, y1: y(t), y2: y(t),
      stroke: grid, "stroke-width": 1,
    }));
    const lbl = el("text", {
      x: PAD.left - 8, y: y(t) + 4, "text-anchor": "end",
      fill: muted, "font-size": 11, style: "font-variant-numeric: tabular-nums",
    });
    lbl.textContent = fmtCompact(t);
    svg.appendChild(lbl);
  }

  const xStep = Math.max(1, Math.ceil(years / 12));
  for (let yr = 0; yr <= years; yr += xStep) {
    const lbl = el("text", {
      x: x(yr), y: H - PAD.bottom + 20, "text-anchor": "middle",
      fill: muted, "font-size": 11,
    });
    lbl.textContent = yr;
    svg.appendChild(lbl);
  }
  const axisTitle = el("text", {
    x: W - PAD.right, y: H - 4, "text-anchor": "end", fill: muted, "font-size": 11,
  });
  axisTitle.textContent = "Year";
  svg.appendChild(axisTitle);

  svg.appendChild(el("line", {
    x1: PAD.left, x2: W - PAD.right, y1: y(0), y2: y(0),
    stroke: base, "stroke-width": 1,
  }));

  // Lines + end markers
  const labels = [];
  for (const s of seriesList) {
    const color = cssVar(s.colorVar);
    const pts = s.rows.map(d => `${x(d.year)},${y(d.value)}`);
    svg.appendChild(el("path", {
      d: "M" + pts.join(" L"), fill: "none",
      stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round",
    }));
    const last = s.rows[s.rows.length - 1];
    svg.appendChild(el("circle", { cx: x(last.year), cy: y(last.value), r: 6, fill: surface }));
    svg.appendChild(el("circle", { cx: x(last.year), cy: y(last.value), r: 4, fill: color }));
    if (s.depletionYear !== null && s.depletionYear !== undefined) {
      labels.push({ ly: y(last.value) - 10, lx: x(last.year) - 8, text: `${s.name}: depleted yr ${s.depletionYear}` });
    }
  }
  // Direct-label only the two net-worth endpoints (the comparison the chart is about)
  for (const s of seriesList.slice(0, 2)) {
    if (s.depletionYear !== null && s.depletionYear !== undefined) continue;
    const last = s.rows[s.rows.length - 1];
    labels.push({ ly: y(last.value) - 10, lx: x(last.year) - 8, text: `${s.name}: ${fmtCompact(last.value)}` });
  }
  // Nudge colliding end labels apart (right-anchored, so vertical spacing is what matters)
  labels.sort((p, q) => p.ly - q.ly);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].ly - labels[i - 1].ly < 15) labels[i].ly = labels[i - 1].ly + 15;
  }
  for (const l of labels) {
    const t = el("text", {
      x: l.lx, y: Math.max(PAD.top + 10, Math.min(H - PAD.bottom - 4, l.ly)),
      "text-anchor": "end",
      fill: cssVar("--text-primary"), "font-size": 12, "font-weight": 600,
    });
    t.textContent = l.text;
    svg.appendChild(t);
  }

  // Hover layer: crosshair + one dot per series
  const hover = el("g", { id: "hover-layer", style: "display:none" });
  hover.appendChild(el("line", {
    id: "hover-line", y1: PAD.top, y2: H - PAD.bottom,
    stroke: base, "stroke-width": 1,
  }));
  seriesList.forEach((s, i) => {
    hover.appendChild(el("circle", { id: `hover-dot-${i}-ring`, r: 6, fill: surface }));
    hover.appendChild(el("circle", { id: `hover-dot-${i}`, r: 4 }));
  });
  svg.appendChild(hover);
}

function setupHover() {
  const box = document.getElementById("chart-box");
  const svg = document.getElementById("chart");
  const tip = document.getElementById("chart-tip");

  box.addEventListener("mousemove", ev => {
    if (!chartGeom) return;
    const rect = svg.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * W;
    const frac = (px - PAD.left) / (W - PAD.left - PAD.right);
    const year = Math.round(Math.min(1, Math.max(0, frac)) * chartGeom.years);

    const { x, y } = chartGeom;
    const hover = svg.querySelector("#hover-layer");
    hover.style.display = "";
    const line = svg.querySelector("#hover-line");
    line.setAttribute("x1", x(year));
    line.setAttribute("x2", x(year));

    let rowsHtml = "";
    seriesList.forEach((s, i) => {
      const d = s.rows[year];
      const color = cssVar(s.colorVar);
      const ring = svg.querySelector(`#hover-dot-${i}-ring`);
      const dot = svg.querySelector(`#hover-dot-${i}`);
      const show = d ? "" : "none";
      ring.style.display = show; dot.style.display = show;
      if (d) {
        ring.setAttribute("cx", x(year)); ring.setAttribute("cy", y(d.value));
        dot.setAttribute("cx", x(year)); dot.setAttribute("cy", y(d.value));
        dot.setAttribute("fill", color);
      }
      rowsHtml += d ? `
        <div class="tip-row"><span class="k"><span style="background:${color};width:8px;height:8px;border-radius:2px;display:inline-block"></span>${s.name}</span><span class="v">${fmtCurrency(d.value)}</span></div>` : `
        <div class="tip-row"><span class="k">${s.name}</span><span class="v">ended</span></div>`;
    });
    tip.innerHTML = `<div class="tip-year">Year ${year}</div>` + rowsHtml;
    tip.style.display = "block";

    const boxRect = box.getBoundingClientRect();
    const tx = ev.clientX - boxRect.left;
    const flip = tx > boxRect.width - tip.offsetWidth - 30;
    tip.style.left = flip ? (tx - tip.offsetWidth - 14) + "px" : (tx + 14) + "px";
    tip.style.top = Math.min(ev.clientY - boxRect.top + 10, boxRect.height - tip.offsetHeight - 6) + "px";
  });

  box.addEventListener("mouseleave", () => {
    tip.style.display = "none";
    const hover = svg.querySelector("#hover-layer");
    if (hover) hover.style.display = "none";
  });
}

/* ---- Table ---- */

function renderTable() {
  const tbody = document.querySelector("#schedule tbody");
  tbody.innerHTML = "";
  const years = Math.max(
    sim.a.rows[sim.a.rows.length - 1].year,
    sim.b.rows[sim.b.rows.length - 1].year);
  const inp = sim.inputs;
  for (let y = 1; y <= years; y++) {
    const dA = sim.a.rows[y], dB = sim.b.rows[y];
    const saving = y <= inp.accYears;
    // Both scenarios share these flows; only how the income is funded differs.
    const deposit = saving ? inp.savings : 0;
    const income = saving ? inp.expense : inp.retire;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${y}</td>
      <td>${fmtCurrency(deposit)}</td>
      <td>${fmtCurrency(income)}</td>
      <td>${dA ? fmtCurrency(dA.balance) : "—"}</td>
      <td>${dB ? fmtCurrency(dB.assets) : "—"}</td>
      <td>${dB ? fmtCurrency(dB.loan) : "—"}</td>
      <td>${dB ? fmtCurrency(dB.net) : "—"}</td>`;
    tbody.appendChild(tr);
  }
}

/* ---- Bucket illustration ----
   Water levels are the simulation's own numbers, so the picture and the table
   can never disagree.

   All three buckets share ONE fixed scale, computed once from the whole horizon
   and never changed as the years advance. That is what makes a water level mean
   something: it rises and falls only because the balance does. (An earlier
   version rescaled per year to keep every year legible — it made the levels
   jump around while the balances were climbing steadily, which is worse than
   any legibility it bought.) The cap follows the horizon input, so shortening
   the horizon zooms the whole illustration in. */

const BK_BOT = 405, BK_MAXH = 239;
let bkYear = 1, bkTimer = null, bkCap = 1;

function byId(id) { return document.getElementById(id); }

function bkFill(rectId, waveId, value) {
  const h = Math.max(0, Math.min(BK_MAXH, (value / bkCap) * BK_MAXH));
  const top = BK_BOT - h;
  const rect = byId(rectId);
  rect.setAttribute("y", top);
  rect.setAttribute("height", h);
  const wave = byId(waveId);
  wave.setAttribute("transform", "translate(0," + top + ")");
  wave.setAttribute("opacity", h > 5 ? 1 : 0);
}

function renderBuckets() {
  if (!sim) return;
  const inp = sim.inputs;
  const y = Math.min(bkYear, inp.horizon);
  const saving = y <= inp.accYears;

  // A's rows stop at depletion, so a missing row means the bucket is dry
  const dA = sim.a.rows[y];
  const aBal = dA ? dA.balance : 0;
  const bRows = sim.b.rows;
  const dB = bRows[y] || bRows[bRows.length - 1];

  bkFill("a-w", "a-wv", aBal);
  bkFill("b1-w", "b1-wv", dB.assets);
  bkFill("b2-w", "b2-wv", dB.loan);

  const cashNeed = saving ? inp.expense : inp.retire;
  const aDead = sim.a.depletionYear !== null && y >= sim.a.depletionYear;

  byId("a-pour").setAttribute("opacity", saving && !aDead ? 1 : 0);
  byId("a-pour-amt").textContent = fmtCompact(inp.savings) + "/yr";
  byId("a-drain").setAttribute("opacity", aDead ? 0 : 1);
  byId("a-drain-amt").textContent = fmtCompact(cashNeed) + "/yr";
  byId("a-val").textContent = fmtCurrency(aBal);
  byId("a-status").textContent = aDead
    ? "EMPTY — ran out in year " + sim.a.depletionYear : "";
  byId("a-body").setAttribute("stroke", aDead ? "var(--crit)" : "var(--baseline)");

  byId("b-pour").setAttribute("opacity", saving ? 1 : 0);
  byId("b-pour-amt").textContent =
    fmtCompact(Math.max(0, inp.savings - inp.premium)) + "/yr";
  byId("b-borrow-amt").textContent = fmtCompact(cashNeed) + "/yr";
  // the asset cost leaks out of bucket 1 every year, saving or retired
  byId("b1-drain").setAttribute("opacity", inp.premium > 0 ? 1 : 0);
  byId("b1-drain-amt").textContent = fmtCompact(inp.premium) + "/yr";
  byId("b1-val").textContent = fmtCurrency(dB.assets);
  byId("b2-val").textContent = fmtCurrency(dB.loan);

  const bDead = sim.b.depletionYear !== null && y >= sim.b.depletionYear;
  const status = byId("b-status");
  status.textContent = bDead
    ? "Loan overtook the assets in year " + sim.b.depletionYear
    : "Net worth " + fmtCurrency(dB.assets - dB.loan) + " — assets still cover the loan";
  status.setAttribute("fill", bDead ? "var(--crit)" : "var(--good)");

  byId("bk-year-label").textContent = "Year " + y + " — " +
    (saving ? "earning and spending" : "retired, drawing income");
  byId("bk-year").value = y;
}

/* One cap for the whole run, from the largest balance any bucket reaches. */
function bkRescale() {
  let max = 1;
  for (const d of sim.a.rows) max = Math.max(max, d.balance);
  for (const d of sim.b.rows) max = Math.max(max, d.assets, d.loan);
  const ticks = niceTicks(max, 4);
  bkCap = ticks[ticks.length - 1] || 1;
  byId("bk-scale").textContent = "full bucket = " + fmtCompact(bkCap) +
    " · one fixed scale for all three";
  byId("bk-year").max = sim.inputs.horizon;
  if (bkYear > sim.inputs.horizon) bkYear = sim.inputs.horizon;
  renderBuckets();
}

function bkStop() {
  if (bkTimer) { clearInterval(bkTimer); bkTimer = null; }
  byId("bk-play").textContent = "Play";
}

/* ---- Wire up ---- */

document.addEventListener("DOMContentLoaded", () => {
  const ids = ["savings", "expense", "acc-years", "a-rate", "b-rate", "retire", "horizon",
    "premium", "loan-rate", "coverage"];
  for (const id of ids) {
    document.getElementById(id).addEventListener("input", readInputsAndRender);
  }
  byId("bk-play").addEventListener("click", () => {
    if (bkTimer) { bkStop(); return; }
    if (bkYear >= sim.inputs.horizon) bkYear = 1;
    byId("bk-play").textContent = "Pause";
    bkTimer = setInterval(() => {
      bkYear++;
      if (bkYear >= sim.inputs.horizon) {
        bkYear = sim.inputs.horizon;
        renderBuckets();
        bkStop();
        return;
      }
      renderBuckets();
    }, 240);
  });
  byId("bk-year").addEventListener("input", function () {
    bkStop();
    bkYear = +this.value;
    renderBuckets();
  });

  document.addEventListener("themechange", renderChart);
  setupHover();
  readInputsAndRender();
});
