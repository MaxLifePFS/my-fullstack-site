/* Mutual Fund Compounding Power
   Two phases: contribute through year N, then draw a yearly income until the
   money runs out. Withdrawals come from a taxable account, so each one is part
   return of contributions (never taxed) and part gain (taxed) — split pro-rata,
   the way a brokerage reports it. Model, tiles, balance chart, schedule table. */

const SVG_NS = "http://www.w3.org/2000/svg";
const W = 760, H = 380;
const PAD = { top: 16, right: 16, bottom: 34, left: 64 };

let rows = [];
let chartGeom = null;

/* Contributions are entered in the table, not in a form field. This seeds the
   column on first load; typing an amount on year 1 replaces it everywhere. */
const START_CONTRIBUTION = 100000;

/* Contribution change points typed into the table: year -> amount. An amount
   entered on a year fills that year and every year below it, until a later year
   sets a new one. Kept when the term shrinks, so lengthening it again restores
   what was typed. */
const contribChanges = new Map();

/* Beginning-of-year flows, interest credited at year end.

   Tax: only the gain inside a withdrawal is taxable. The gain share of the
   account is (balance - basis) / balance, where basis is the contributions
   still in the account. The withdrawal is grossed up so the after-tax cash
   equals the income asked for:  gross = income / (1 - gainShare x taxRate). */
function computeSchedule(defaultC, ratePct, contribYears, income, taxPct, years) {
  const r = ratePct / 100;
  const t = taxPct / 100;
  const out = [{
    year: 0, contribution: 0, income: 0, tax: 0, gross: 0, interestYear: 0,
    balance: 0, totalContributed: 0, totalInterest: 0, totalIncome: 0, totalTax: 0,
  }];
  let balance = 0, basis = 0, current = defaultC;
  let totalContributed = 0, totalInterest = 0, totalIncome = 0, totalTax = 0;
  let depletionYear = null;

  for (let y = 1; y <= years; y++) {
    let contribution = 0, gotIncome = 0, tax = 0, gross = 0;
    let gainShare = 0, gainPart = 0, basisPart = 0, balBefore = balance, basisBefore = basis;

    if (y <= contribYears) {
      if (contribChanges.has(y)) current = contribChanges.get(y);
      contribution = current;
      balance += contribution;
      basis += contribution;
      totalContributed += contribution;
    } else if (income > 0 && balance > 0) {
      balBefore = balance;
      basisBefore = basis;
      gainShare = Math.max(0, Math.min(1, (balance - basis) / balance));
      const keep = 1 - gainShare * t;
      const wanted = keep > 0 ? income / keep : balance;
      gross = Math.min(wanted, balance);
      gainPart = gross * gainShare;      // the taxable slice of the withdrawal
      basisPart = gross - gainPart;      // your own money coming back, untaxed
      tax = gainPart * t;
      gotIncome = gross - tax;
      basis = Math.max(0, basis - basisPart);
      balance -= gross;
      totalIncome += gotIncome;
      totalTax += tax;
      if (balance <= 0.005) {
        balance = 0;
        if (depletionYear === null) depletionYear = y;
      }
    }

    const interestYear = balance * r;
    balance += interestYear;
    totalInterest += interestYear;

    out.push({
      year: y, contribution, income: gotIncome, tax, gross, interestYear,
      balance, totalContributed, totalInterest, totalIncome, totalTax,
      balBefore, basisBefore, gainShare, gainPart, basisPart,
    });
  }
  out.depletionYear = depletionYear;
  return out;
}

function readInputsAndRender() {
  const rate = numInput("rate", 8, -50, 100);
  const years = Math.round(numInput("years", 40, 1, 100));
  const contribYears = Math.min(years, Math.round(numInput("contrib-years", 20, 0, 100)));
  const income = numInput("withdrawal", 500000, 0, 1e12);
  const taxPct = numInput("tax-rate", 15, 0, 60);

  const focusInput = document.getElementById("focus-year");
  focusInput.max = years;
  const focusYear = Math.round(numInput("focus-year", years, 1, years));

  rows = computeSchedule(START_CONTRIBUTION, rate, contribYears, income, taxPct, years);

  renderTiles(focusYear, contribYears);
  renderTaxExample(taxPct);
  renderChart(contribYears);
  renderTable(focusYear, contribYears);
  bkRescale(contribYears);
}

/* A worked example built from the live numbers, so it can never go stale. Shows
   the first drawdown year in full, then contrasts it with the last one — the
   taxable share climbs as contributions are drawn out and gains are left behind. */
function renderTaxExample(taxPct) {
  const box = document.getElementById("tax-example");
  const draws = rows.filter(d => d.gross > 0);
  if (!draws.length) {
    box.innerHTML = '<p>Set an income above and a worked example will appear here.</p>';
    return;
  }
  const pct = v => (v * 100).toFixed(1) + "%";
  const f = draws[0];
  /* Compare against the last year that paid a FULL income. The year the money
     runs out pays whatever is left, so using it would make "the same income"
     quote a smaller figure than the example above. */
  const target = Math.max.apply(null, draws.map(d => d.income));
  const full = draws.filter(d => d.income >= target - 1);
  const l = full[full.length - 1];

  let html =
    '<div class="worked">' +
      '<div class="worked-head">Year ' + f.year + ' — the first withdrawal</div>' +
      '<p class="step-figs">The account holds ' + fmtCurrency(f.balBefore) + ', of which ' +
        fmtCurrency(f.basisBefore) + ' is money you put in. That makes <b>' +
        pct(f.gainShare) + ' of every dollar you take out a gain</b>.</p>' +
      '<ul class="step-figs">' +
        '<li>You want <b>' + fmtCurrency(f.income) + '</b> to spend.</li>' +
        '<li>So you sell <b>' + fmtCurrency(f.gross) + '</b> — of that, ' +
          fmtCurrency(f.gainPart) + ' is gain and ' + fmtCurrency(f.basisPart) +
          ' is your own money back.</li>' +
        '<li>Tax = ' + taxPct + '% × ' + fmtCurrency(f.gainPart) + ' = <b>' +
          fmtCurrency(f.tax) + '</b>. The ' + fmtCurrency(f.basisPart) + ' is not taxed.</li>' +
        '<li>You receive ' + fmtCurrency(f.gross) + ' − ' + fmtCurrency(f.tax) +
          ' = <b>' + fmtCurrency(f.income) + '</b>.</li>' +
      '</ul>' +
    '</div>';

  if (l.year > f.year) {
    const more = l.tax - f.tax;
    html +=
      '<p class="step-figs"><b>It costs more every year.</b> Each withdrawal takes your own ' +
      'contributions out first, leaving a bigger share of gain behind. By year ' + l.year +
      ' the account is ' + pct(l.gainShare) + ' gain, so the same ' + fmtCurrency(l.income) +
      ' of spending money needs ' + fmtCurrency(l.gross) + ' sold and costs <b>' +
      fmtCurrency(l.tax) + '</b> in tax' +
      (more > 0 ? ' — ' + fmtCurrency(more) + ' more than year ' + f.year : '') + '.</p>' +
      '<p>Across the whole drawdown you hand over <b>' + fmtCurrency(l.totalTax) +
      '</b> in tax to receive ' + fmtCurrency(l.totalIncome) + ' of income.</p>';
  }
  box.innerHTML = html;
}

function renderTiles(focusYear, contribYears) {
  const at = rows[focusYear];
  const last = rows[rows.length - 1];
  const dep = rows.depletionYear;
  document.getElementById("tile-year").textContent = focusYear;

  const runsOut = dep
    ? { cls: "bad", big: "Year " + dep, sub: "drawdown year " + (dep - contribYears) }
    : (last.balance > 0
        ? { cls: "ok", big: "Not within " + last.year + " yrs", sub: fmtCurrency(last.balance) + " left at year " + last.year }
        : { cls: "bad", big: "Empty", sub: "nothing left" });

  document.getElementById("result-tiles").innerHTML =
    '<div class="tile hero"><div class="label">Balance left at year ' + focusYear + '</div>' +
      '<div class="value">' + fmtCurrency(at.balance) + '</div>' +
      '<div class="sub">' + (focusYear <= contribYears ? "still contributing" : "drawing income") + '</div></div>' +
    '<div class="tile verdict ' + runsOut.cls + '"><div class="label">Money runs out</div>' +
      '<div class="value" style="font-size:1.4rem">' + runsOut.big + '</div>' +
      '<div class="sub">' + runsOut.sub + '</div></div>' +
    '<div class="tile"><div class="label">Total contributed</div>' +
      '<div class="value" style="font-size:1.4rem">' + fmtCurrency(at.totalContributed) + '</div>' +
      '<div class="sub">through year ' + Math.min(focusYear, contribYears) + '</div></div>' +
    '<div class="tile"><div class="label">Income received</div>' +
      '<div class="value" style="font-size:1.4rem">' + fmtCurrency(at.totalIncome) + '</div>' +
      '<div class="sub">after tax, to year ' + focusYear + '</div></div>' +
    '<div class="tile"><div class="label">Tax paid on gains</div>' +
      '<div class="value" style="font-size:1.4rem">' + fmtCurrency(at.totalTax) + '</div>' +
      '<div class="sub">to year ' + focusYear + '</div></div>';
}

/* ---- Chart: one series, the balance ---- */

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function el(name, attrs) {
  const e = document.createElementNS(SVG_NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function renderChart(contribYears) {
  const svg = document.getElementById("chart");
  svg.innerHTML = "";

  const years = rows[rows.length - 1].year;
  const maxVal = Math.max(...rows.map(d => d.balance), 1);
  const ticks = niceTicks(maxVal, 5);
  const yMax = ticks[ticks.length - 1];

  /* The plot starts at year 1 — year 0 is the empty "before the first
     contribution" state and carries no information. */
  const span = Math.max(1, years - 1);
  const x = year => PAD.left + ((year - 1) / span) * (W - PAD.left - PAD.right);
  const y = v => H - PAD.bottom - (v / yMax) * (H - PAD.top - PAD.bottom);
  chartGeom = { x, y, years, span };
  const plot = rows.filter(d => d.year >= 1);

  const s1 = cssVar("--series-1");
  const muted = cssVar("--text-muted"), grid = cssVar("--gridline"), base = cssVar("--baseline");

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

  const xStep = Math.max(1, Math.ceil(years / 10));
  const xTicks = [];
  for (let yr = 1; yr <= years; yr += xStep) xTicks.push(yr);
  if (xTicks[xTicks.length - 1] !== years) {
    if (years - xTicks[xTicks.length - 1] < xStep / 2) xTicks.pop();
    xTicks.push(years);
  }
  for (const yr of xTicks) {
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

  // where the income starts — the turn from saving to spending
  if (contribYears >= 1 && contribYears < years) {
    const bx = x(contribYears + 1);
    svg.appendChild(el("line", {
      x1: bx, x2: bx, y1: PAD.top, y2: H - PAD.bottom,
      stroke: base, "stroke-width": 1, "stroke-dasharray": "4 3",
    }));
    const lbl = el("text", {
      x: bx + 6, y: PAD.top + 12, "text-anchor": "start", fill: muted, "font-size": 11,
    });
    lbl.textContent = "income starts";
    svg.appendChild(lbl);
  }

  const pts = plot.map(d => `${x(d.year)},${y(d.balance)}`);
  svg.appendChild(el("path", {
    d: `M${x(1)},${y(0)} L` + pts.join(" L") + ` L${x(years)},${y(0)} Z`,
    fill: s1, "fill-opacity": 0.1,
  }));
  svg.appendChild(el("path", {
    d: "M" + pts.join(" L"), fill: "none",
    stroke: s1, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round",
  }));

  const lastRow = plot[plot.length - 1];
  const surface = cssVar("--surface-1");
  svg.appendChild(el("circle", { cx: x(lastRow.year), cy: y(lastRow.balance), r: 6, fill: surface }));
  svg.appendChild(el("circle", { cx: x(lastRow.year), cy: y(lastRow.balance), r: 4, fill: s1 }));
  const endLbl = el("text", {
    x: x(lastRow.year) - 8, y: y(lastRow.balance) - 10, "text-anchor": "end",
    fill: cssVar("--text-primary"), "font-size": 12, "font-weight": 600,
  });
  endLbl.textContent = fmtCompact(lastRow.balance);
  svg.appendChild(endLbl);

  const hover = el("g", { id: "hover-layer", style: "display:none" });
  hover.appendChild(el("line", {
    id: "hover-line", y1: PAD.top, y2: H - PAD.bottom,
    stroke: base, "stroke-width": 1,
  }));
  hover.appendChild(el("circle", { id: "hover-dot-ring", r: 6, fill: surface }));
  hover.appendChild(el("circle", { id: "hover-dot", r: 4, fill: s1 }));
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
    const year = Math.round(Math.min(1, Math.max(0, frac)) * chartGeom.span) + 1;
    const d = rows[year];
    if (!d) return;

    const { x, y } = chartGeom;
    const hover = svg.querySelector("#hover-layer");
    hover.style.display = "";
    const line = svg.querySelector("#hover-line");
    line.setAttribute("x1", x(year));
    line.setAttribute("x2", x(year));
    svg.querySelector("#hover-dot-ring").setAttribute("cx", x(year));
    svg.querySelector("#hover-dot-ring").setAttribute("cy", y(d.balance));
    svg.querySelector("#hover-dot").setAttribute("cx", x(year));
    svg.querySelector("#hover-dot").setAttribute("cy", y(d.balance));

    const flow = d.contribution > 0
      ? `<div class="tip-row"><span class="k">Contribution</span><span class="v">${fmtCurrency(d.contribution)}</span></div>`
      : d.gross > 0
        ? `<div class="tip-row"><span class="k">Income</span><span class="v">${fmtCurrency(d.income)}</span></div>` +
          `<div class="tip-row"><span class="k">Tax paid</span><span class="v">${fmtCurrency(d.tax)}</span></div>`
        : "";
    tip.innerHTML = `<div class="tip-year">Year ${d.year}</div>` + flow +
      `<div class="tip-row"><span class="k">Interest</span><span class="v">${fmtCurrency(d.interestYear)}</span></div>` +
      `<div class="tip-row"><span class="k">Balance</span><span class="v">${fmtCurrency(d.balance)}</span></div>`;
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

function renderTable(focusYear, contribYears) {
  const tbody = document.querySelector("#schedule tbody");
  const yearRows = rows.filter(d => d.year > 0);

  /* Rebuild the row skeleton only when the term length changes — rebuilding on
     every keystroke would tear out the cell being typed in. */
  if (tbody.children.length !== yearRows.length) {
    tbody.innerHTML = "";
    for (const d of yearRows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.year}</td>
        <td class="cell-edit"><input type="number" class="cell-input" data-year="${d.year}"
              min="0" step="500" aria-label="Contribution for year ${d.year}"></td>
        <td class="c-income"></td>
        <td class="c-tax"></td>
        <td class="c-gross"></td>
        <td class="c-interest"></td>
        <td class="c-balance"></td>`;
      tbody.appendChild(tr);
    }
  }

  yearRows.forEach((d, i) => {
    const tr = tbody.children[i];
    tr.className = d.year === focusYear ? "hl" : "";
    const input = tr.querySelector("input.cell-input");
    const saving = d.year <= contribYears;
    input.disabled = !saving;
    if (document.activeElement !== input) {
      input.value = saving ? Math.round(d.contribution) : "";
    }
    input.classList.toggle("custom", saving && contribChanges.has(d.year));
    tr.querySelector(".c-income").textContent = d.gross > 0 ? fmtCurrency(d.income) : "—";
    tr.querySelector(".c-tax").textContent = d.gross > 0 ? fmtCurrency(d.tax) : "—";
    tr.querySelector(".c-gross").textContent = d.gross > 0 ? fmtCurrency(d.gross) : "—";
    tr.querySelector(".c-interest").textContent = fmtCurrency(d.interestYear);
    tr.querySelector(".c-balance").textContent = fmtCurrency(d.balance);
  });
}

/* ---- Bucket illustration ----
   One fixed scale for the whole run, taken from the balance's peak, so the water
   level moves only when the balance does. The bucket fills through the saving
   years and then drains once the income starts. */

const BK_BOT = 405, BK_MAXH = 239;
let bkYear = 1, bkTimer = null, bkCap = 1;

function byId(id) { return document.getElementById(id); }

function renderBucket(contribYears) {
  const d = rows[bkYear];
  if (!d) return;
  const last = rows[rows.length - 1];
  const dep = rows.depletionYear;

  const h = Math.max(0, Math.min(BK_MAXH, (d.balance / bkCap) * BK_MAXH));
  const top = BK_BOT - h;
  const water = byId("ci-water");
  water.setAttribute("y", top);
  water.setAttribute("height", h);
  const wave = byId("ci-wave");
  wave.setAttribute("transform", "translate(0," + top + ")");
  wave.setAttribute("opacity", h > 5 ? 1 : 0);

  const saving = d.contribution > 0;
  byId("ci-pour").setAttribute("opacity", saving ? 1 : 0);
  byId("ci-pour-amt").textContent = fmtCompact(d.contribution) + "/yr";
  // once the contributions stop, say so rather than leaving a gap
  byId("ci-phase").setAttribute("opacity", saving ? 0 : 1);

  const drawing = d.gross > 0;
  byId("ci-drain").setAttribute("opacity", drawing ? 1 : 0.2);
  byId("ci-drain-amt").textContent = drawing ? fmtCompact(d.income) + "/yr" : "—";
  byId("ci-tax-amt").textContent = drawing
    ? "+ " + fmtCompact(d.tax) + " tax — " + fmtCompact(d.gross) + " leaves the bucket" : "";

  byId("ci-val").textContent = fmtCurrency(d.balance);
  const dry = dep !== null && bkYear >= dep;
  byId("ci-status").textContent = dry ? "EMPTY — ran out in year " + dep : "";
  byId("ci-body").setAttribute("stroke", dry ? "var(--crit)" : "var(--baseline)");

  byId("bk-year-label").textContent = "Year " + bkYear + " — " +
    (dry ? "the bucket is dry" : saving ? "saving" : drawing ? "drawing income" : "holding");
  byId("bk-year").value = bkYear;
}

function bkRescale(contribYears) {
  let max = 1;
  for (const d of rows) max = Math.max(max, d.balance);
  const ticks = niceTicks(max, 4);
  bkCap = ticks[ticks.length - 1] || 1;
  byId("ci-scale").textContent = "full bucket = " + fmtCompact(bkCap) + " · one fixed scale";
  const years = rows[rows.length - 1].year;
  byId("bk-year").max = years;
  if (bkYear > years) bkYear = years;
  renderBucket(contribYears);
}

function bkStop() {
  if (bkTimer) { clearInterval(bkTimer); bkTimer = null; }
  byId("bk-play").textContent = "Play";
}

/* ---- Wire up ---- */

document.addEventListener("DOMContentLoaded", () => {
  for (const id of ["rate", "years", "contrib-years", "withdrawal", "tax-rate", "focus-year"]) {
    document.getElementById(id).addEventListener("input", readInputsAndRender);
  }

  /* Per-year contribution edits. Delegated, so the handler survives the row
     rebuilds that happen when the term length changes. */
  const tbody = document.querySelector("#schedule tbody");
  tbody.addEventListener("input", ev => {
    const input = ev.target.closest("input.cell-input");
    if (!input) return;
    const year = Number(input.dataset.year);
    const v = parseFloat(input.value);
    if (input.value.trim() === "" || !isFinite(v)) contribChanges.delete(year);
    else contribChanges.set(year, Math.max(0, v));
    readInputsAndRender();
  });
  // Leaving a cleared cell puts the inherited amount back in view
  tbody.addEventListener("focusout", ev => {
    if (ev.target.closest("input.cell-input")) readInputsAndRender();
  });

  document.getElementById("reset-contribs").addEventListener("click", () => {
    contribChanges.clear();
    readInputsAndRender();
  });

  byId("bk-play").addEventListener("click", () => {
    const years = rows[rows.length - 1].year;
    if (bkTimer) { bkStop(); return; }
    if (bkYear >= years) bkYear = 1;
    byId("bk-play").textContent = "Pause";
    bkTimer = setInterval(() => {
      bkYear++;
      if (bkYear >= years) { bkYear = years; renderBucket(); bkStop(); return; }
      renderBucket();
    }, 240);
  });
  byId("bk-year").addEventListener("input", function () {
    bkStop();
    bkYear = +this.value;
    renderBucket();
  });

  document.addEventListener("themechange", () => {
    renderChart(Math.round(numInput("contrib-years", 20, 0, 100)));
  });
  setupHover();
  readInputsAndRender();
});
