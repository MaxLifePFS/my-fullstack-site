/* Defined Benefit Funding
 *
 * Funds a fixed retirement income out of a contribution schedule that can
 * differ year by year, at returns that can also differ year by year.
 *
 * The ledger is beginning-of-year flows, return credited at year end:
 *
 *   balance = (balance + contribution - payment) x (1 + rate_that_year)
 *
 * Solving for the contributions is the only subtle part. That recursion is
 * AFFINE in the contributions — scaling every contribution by k scales their
 * whole compounded effect by k, and the payments are untouched. So the final
 * balance as a function of a contribution pattern P scaled by k is a straight
 * line, and two runs pin it down exactly:
 *
 *   B0 = final balance with no contributions at all
 *   B1 = final balance with pattern P
 *   final(k) = B0 + k (B1 - B0)  =>  k = B0 / (B0 - B1)   for final(k) = 0
 *
 * Feed that a flat pattern of 1 and k is the level annual contribution. Feed it
 * the shape typed into the table and k is the multiple that shape needs. No
 * iteration, no root-finding, exact to floating point either way.
 */

const W = 760, H = 380, PAD = { left: 68, right: 16, top: 16, bottom: 34 };
const SVG_NS = "http://www.w3.org/2000/svg";

function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const byId = (id) => document.getElementById(id);

const pct = (v, dp) => `${v.toFixed(dp === undefined ? (v % 1 === 0 ? 0 : 1) : dp)}%`;
/* `|| 0` folds -0 into 0: a solved balance lands a hair either side of zero and
   would otherwise format as "-$0" */
const money0 = (v) => fmtCurrency(Math.round(v) || 0);

const DEFAULT_CONTRIB = 50000;

/* Year -> value, for the two editable columns. A value set on a year applies to
   that year and every year below it, until a later year sets a new one. Kept
   when the horizon shrinks, so lengthening it again restores what was typed. */
const contribChanges = new Map();
const rateChanges = new Map();

/* Expand a change map into a per-year series */
function series(map, count, fallback) {
  const out = [];
  let cur = fallback;
  for (let y = 1; y <= count; y++) {
    if (map.has(y)) cur = map.get(y);
    out.push(cur);
  }
  return out;
}

function readConfig() {
  const age = numInput("age", 57, 18, 100);
  const startYear = Math.round(numInput("start-year", 16, 1, 60));
  const L = Math.round(numInput("payout-years", 20, 1, 60));
  /* contributing past the day the income starts is not a thing this models */
  const contribYears = Math.min(
    Math.round(numInput("contrib-years", 15, 1, 60)), startYear - 1 || 1);
  const pmt = numInput("income", 0, 0, 1e9);
  const g = numInput("cola", 0, 0, 20) / 100;
  const tax = numInput("tax", 0, 0, 60) / 100;
  const defaultRate = numInput("rate", 8, -20, 30);

  const horizon = Math.max(startYear + L - 1, contribYears);
  return {
    age, startYear, L, contribYears, pmt, g, tax, defaultRate, horizon,
    rates: series(rateChanges, horizon, defaultRate),
    startAge: age + startYear - 1,
    endAge: age + startYear + L - 2,
  };
}

/* The contribution pattern currently typed into the table */
function pattern(cfg) {
  const raw = series(contribChanges, cfg.horizon, DEFAULT_CONTRIB);
  return raw.map((v, i) => (i < cfg.contribYears ? v : 0));
}

/* A flat $1 in every contribution year — the probe for the level solve */
function unitPattern(cfg) {
  return Array.from({ length: cfg.horizon }, (_, i) => (i < cfg.contribYears ? 1 : 0));
}

function runLedger(cfg, contribs) {
  const rows = [];
  let bal = 0, totalContributed = 0, totalIncome = 0, totalReturn = 0;
  let balanceAtStart = 0, depletedYear = null;

  for (let y = 1; y <= cfg.horizon; y++) {
    const c = contribs[y - 1] || 0;
    const drawing = y >= cfg.startYear && y < cfg.startYear + cfg.L;
    const draw = drawing ? cfg.pmt * Math.pow(1 + cfg.g, y - cfg.startYear) : 0;

    /* the balance the income starts from, before the first payment comes out */
    if (y === cfg.startYear) balanceAtStart = bal + c;

    bal += c - draw;
    if (bal < -0.005 && depletedYear === null) depletedYear = y;
    const rate = cfg.rates[y - 1] / 100;
    const ret = bal * rate;
    bal += ret;

    totalContributed += c;
    totalIncome += draw;
    totalReturn += ret;
    rows.push({
      year: y, age: cfg.age + y - 1,
      contribution: c, rate: cfg.rates[y - 1], draw, ret, balance: bal,
    });
  }
  return {
    rows, totalContributed, totalIncome, totalReturn, balanceAtStart, depletedYear,
    residual: rows.length ? rows[rows.length - 1].balance : 0,
  };
}

/* The multiple `base` has to be scaled by so the last payment empties the plan.
   Exact, because the final balance is affine in the contributions. */
function solveScale(cfg, base) {
  const zero = new Array(cfg.horizon).fill(0);
  const B0 = runLedger(cfg, zero).residual;
  const B1 = runLedger(cfg, base).residual;
  const slope = B1 - B0;
  if (!isFinite(slope) || Math.abs(slope) < 1e-9) return null;
  return B0 / (B0 - B1);
}

/* Level annual contribution that funds the benefit exactly */
function levelContribution(cfg) {
  return solveScale(cfg, unitPattern(cfg));
}

function tile(label, value, sub, cls) {
  return `<div class="tile ${cls || ""}">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ""}
    </div>`;
}

function renderVerdict(cfg, run, level) {
  const node = byId("verdict");
  const funded = Math.abs(run.residual) < 1;

  if (run.depletedYear !== null) {
    const row = run.rows[run.depletedYear - 1];
    node.className = "verdict-line bad";
    node.innerHTML = `Your schedule <b class="bad">runs out in year ${run.depletedYear}</b>
      (age ${row.age}) — before the ${cfg.L} payments are done. It funds
      ${run.rows.filter((d) => d.draw > 0 && d.balance > -0.005).length} of them.
      ${level !== null ? `A level ${money0(level)} a year would cover all ${cfg.L}.` : ""}`;
    return;
  }
  if (funded) {
    node.className = "verdict-line ok";
    /* don't print the sub-dollar residual here — rounding would show "$1"
       right after the word "exactly" */
    node.innerHTML = `Your schedule <b class="ok">funds the benefit exactly</b> —
      the last of the ${cfg.L} payments empties the plan.`;
    return;
  }
  node.className = run.residual > 0 ? "verdict-line ok" : "verdict-line bad";
  node.innerHTML = run.residual > 0
    ? `Your schedule funds all ${cfg.L} payments and <b class="ok">leaves
       ${money0(run.residual)}</b> at the end — more than the benefit needs.`
    : `Your schedule <b class="bad">falls ${money0(-run.residual)} short</b> by the end.`;
}

function renderWorked(cfg, run, level) {
  const rateSet = [...new Set(cfg.rates.slice(0, cfg.horizon))];
  const rateText = rateSet.length === 1
    ? `a flat ${pct(rateSet[0])}`
    : `returns that vary by year (${pct(Math.min(...rateSet))} to ${pct(Math.max(...rateSet))})`;

  const levelRun = level === null ? null
    : runLedger(cfg, unitPattern(cfg).map((v) => v * level));

  return `
    <p><b>The promise.</b> ${money0(cfg.pmt)} a year${cfg.g > 0
      ? `, rising ${pct(cfg.g * 100)} a year,` : ""} for ${cfg.L} years, the first payment at the
      beginning of year ${cfg.startYear} when you are ${cfg.startAge} and the last at
      ${cfg.endAge} — ${money0(run.totalIncome)} of income in total.</p>

    <p><b>What funds it.</b> With contributions in years 1–${cfg.contribYears} and ${rateText},
      the level amount that funds the benefit exactly is <b>${level === null
        ? "—" : money0(level)}</b> a year${level === null ? "" : `, or
      ${money0(level * cfg.contribYears)} contributed in total`}.</p>

    ${levelRun ? `<table class="lever" style="margin-top:12px">
      <tbody>
        <tr><td>${cfg.contribYears} contributions of ${money0(level)}</td>
            <td>${money0(levelRun.totalContributed)}</td></tr>
        <tr><td>Return earned over ${cfg.horizon} years</td>
            <td>${money0(levelRun.totalReturn)}</td></tr>
        <tr><td>Balance at the beginning of year ${cfg.startYear} (age ${cfg.startAge})</td>
            <td><b>${money0(levelRun.balanceAtStart)}</b></td></tr>
        <tr><td>${cfg.L} payments drawn out</td>
            <td>${money0(levelRun.totalIncome)}</td></tr>
        <tr><td>Left after the last payment</td>
            <td>${money0(levelRun.residual)}</td></tr>
      </tbody>
    </table>
    <p style="margin-top:12px">${money0(levelRun.totalContributed)} in, ${money0(
      levelRun.totalIncome)} out — ${(levelRun.totalIncome /
      (levelRun.totalContributed || 1)).toFixed(1)}× the money contributed, because
      ${money0(levelRun.totalReturn)} of it is return the plan earned along the way.</p>` : ""}

    <p><b>The deduction.</b> At ${pct(cfg.tax * 100)} today, the schedule you have entered
      (${money0(run.totalContributed)} over ${cfg.contribYears} years) is worth
      <b>${money0(run.totalContributed * cfg.tax)}</b> in tax, leaving
      ${money0(run.totalContributed * (1 - cfg.tax))} actually out of pocket. In the first year
      alone the deduction is worth ${money0((run.rows[0]?.contribution || 0) * cfg.tax)}.</p>`;
}

function renderSensitivity(cfg) {
  const lengths = [...new Set([10, 15, 20, 25, 30, cfg.L])].sort((a, b) => a - b);
  const body = lengths.map((L) => {
    const lvl = levelContribution({ ...cfg, L, horizon: Math.max(cfg.startYear + L - 1, cfg.contribYears),
      rates: series(rateChanges, Math.max(cfg.startYear + L - 1, cfg.contribYears), cfg.defaultRate) });
    const bold = L === cfg.L ? ' style="font-weight:700"' : "";
    return `<tr${bold}><td>${L} years${L === cfg.L ? " &larr; yours" : ""}</td>
        <td>through age ${cfg.startAge + L - 1}</td>
        <td>${lvl === null ? "—" : money0(lvl)}</td></tr>`;
  }).join("");
  return `<tbody>
      <tr><td><b>Payments run for…</b></td><td></td>
          <td style="text-align:right"><b>level contribution</b></td></tr>
      ${body}
    </tbody>`;
}

function renderChart(cfg, run) {
  const svg = byId("chart");
  svg.innerHTML = "";
  if (!run.rows.length) return;

  const years = run.rows.length;
  const maxVal = Math.max(...run.rows.map((d) => d.balance), 1);
  const ticks = niceTicks(maxVal, 5);
  const yMax = ticks[ticks.length - 1];

  const span = Math.max(1, years - 1);
  const x = (year) => PAD.left + ((year - 1) / span) * (W - PAD.left - PAD.right);
  const y = (v) => H - PAD.bottom - (Math.max(0, v) / yMax) * (H - PAD.top - PAD.bottom);

  const s1 = cssVar("--series-1"), s3 = cssVar("--series-3"), crit = cssVar("--crit");
  const muted = cssVar("--text-muted"), grid = cssVar("--gridline"), base = cssVar("--baseline");

  for (const t of ticks) {
    if (t > 0) svg.appendChild(el("line", {
      x1: PAD.left, x2: W - PAD.right, y1: y(t), y2: y(t), stroke: grid, "stroke-width": 1,
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
  if (xTicks[xTicks.length - 1] !== years) xTicks.push(years);
  for (const yr of xTicks) {
    const lbl = el("text", {
      x: x(yr), y: H - PAD.bottom + 20, "text-anchor": "middle", fill: muted, "font-size": 11,
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
    x1: PAD.left, x2: W - PAD.right, y1: y(0), y2: y(0), stroke: base, "stroke-width": 1,
  }));

  /* where the saving turns into spending */
  if (cfg.startYear > 1 && cfg.startYear <= years) {
    const bx = x(cfg.startYear);
    svg.appendChild(el("line", {
      x1: bx, x2: bx, y1: PAD.top, y2: H - PAD.bottom,
      stroke: base, "stroke-width": 1, "stroke-dasharray": "4 3",
    }));
    const lbl = el("text", { x: bx + 6, y: PAD.top + 12, fill: muted, "font-size": 11 });
    lbl.textContent = `income starts, age ${cfg.startAge}`;
    svg.appendChild(lbl);
  }

  const pts = run.rows.map((d) => `${x(d.year)},${y(d.balance)}`);
  const cut = Math.min(cfg.startYear - 1, pts.length);
  if (cut > 0) {
    svg.appendChild(el("polyline", {
      points: pts.slice(0, cut).join(" "), fill: "none", stroke: s1, "stroke-width": 2.5,
    }));
  }
  if (cut < pts.length) {
    svg.appendChild(el("polyline", {
      points: pts.slice(Math.max(0, cut - 1)).join(" "), fill: "none",
      stroke: s3, "stroke-width": 2.5,
    }));
  }
  /* mark where the money ran out, if it did */
  if (run.depletedYear !== null) {
    const dx = x(run.depletedYear);
    svg.appendChild(el("line", {
      x1: dx, x2: dx, y1: PAD.top, y2: H - PAD.bottom, stroke: crit, "stroke-width": 1.5,
    }));
    const lbl = el("text", {
      x: dx - 6, y: PAD.top + 12, "text-anchor": "end", fill: crit, "font-size": 11,
    });
    lbl.textContent = "runs out";
    svg.appendChild(lbl);
  }
}

function renderTable(cfg, run) {
  const tbody = document.querySelector("#schedule tbody");

  /* Rebuild the skeleton only when the horizon changes — doing it on every
     keystroke would tear out the cell being typed in. */
  if (tbody.children.length !== run.rows.length) {
    tbody.innerHTML = "";
    for (const d of run.rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.year}</td>
        <td class="c-age"></td>
        <td class="cell-edit"><input type="number" class="cell-input" data-col="contrib"
              data-year="${d.year}" min="0" step="1000"
              aria-label="Contribution for year ${d.year}"></td>
        <td class="cell-edit"><input type="number" class="cell-input" data-col="rate"
              data-year="${d.year}" step="0.1"
              aria-label="Return percent for year ${d.year}"></td>
        <td class="c-draw"></td>
        <td class="c-ret"></td>
        <td class="c-bal"></td>`;
      tbody.appendChild(tr);
    }
  }

  run.rows.forEach((d, i) => {
    const tr = tbody.children[i];
    tr.className = d.year === cfg.startYear ? "hl" : "";
    tr.querySelector(".c-age").textContent = d.age;

    const cInput = tr.querySelector('input[data-col="contrib"]');
    const contributing = d.year <= cfg.contribYears;
    cInput.disabled = !contributing;
    if (document.activeElement !== cInput) {
      cInput.value = contributing ? Math.round(d.contribution) : "";
    }
    cInput.classList.toggle("custom", contributing && contribChanges.has(d.year));

    const rInput = tr.querySelector('input[data-col="rate"]');
    if (document.activeElement !== rInput) rInput.value = d.rate;
    rInput.classList.toggle("custom", rateChanges.has(d.year));

    tr.querySelector(".c-draw").textContent = d.draw ? money0(d.draw) : "—";
    tr.querySelector(".c-ret").textContent = money0(d.ret);
    tr.querySelector(".c-bal").textContent = money0(d.balance);
  });
}

let lastCfg = null, lastRun = null;

function render() {
  const cfg = readConfig();
  const run = runLedger(cfg, pattern(cfg));
  const level = levelContribution(cfg);
  lastCfg = cfg; lastRun = run;

  byId("contrib-derived").textContent =
    `${cfg.contribYears} contribution year${cfg.contribYears === 1 ? "" : "s"}`;
  byId("start-derived").textContent =
    `${cfg.startYear - 1} years of growth · you are ${cfg.startAge}`;
  byId("payout-derived").textContent = `through age ${cfg.endAge}`;

  byId("eq").innerHTML =
    `<span class="term">Level contribution</span>,
     <span class="term"><span class="step">years 1–${cfg.contribYears}</span></span> =
     <span class="ans">${level === null ? "—" : money0(level)}</span>
     <span style="font-size:.66em;font-weight:400;color:var(--text-secondary)">a year</span>`;

  renderVerdict(cfg, run, level);

  const levelTotal = level === null ? 0 : level * cfg.contribYears;
  byId("result-tiles").innerHTML = [
    tile("Level contribution", level === null ? "—" : money0(level),
      `each year, years 1–${cfg.contribYears}`, "hero"),
    tile("Total contributed", money0(levelTotal), `over ${cfg.contribYears} years`),
    tile("Tax saved", money0(levelTotal * cfg.tax), `the deduction at ${pct(cfg.tax * 100)}`),
    tile("Net out of pocket", money0(levelTotal * (1 - cfg.tax)), "contributions less the deduction"),
    tile("Total income received", money0(run.totalIncome),
      `${cfg.L} payments from age ${cfg.startAge}`),
  ].join("");

  byId("worked").innerHTML = renderWorked(cfg, run, level);
  byId("sens-table").innerHTML = renderSensitivity(cfg);

  renderTable(cfg, run);
  renderChart(cfg, run);

  byId("residual-note").textContent =
    `Flows happen at the beginning of the year; the return is credited at year end, after that `
    + `year's contribution or payment. The highlighted row is the first payment. `
    + `Your schedule leaves ${money0(run.residual)} after the last one.`;
}

document.addEventListener("DOMContentLoaded", () => {
  for (const id of ["age", "contrib-years", "start-year", "payout-years",
                    "income", "cola", "tax", "rate"]) {
    byId(id).addEventListener("input", render);
  }

  /* Per-year edits. Delegated, so the handler survives the row rebuilds that
     happen when the horizon changes. */
  const tbody = document.querySelector("#schedule tbody");
  tbody.addEventListener("input", (ev) => {
    const input = ev.target.closest("input.cell-input");
    if (!input) return;
    const year = Number(input.dataset.year);
    const map = input.dataset.col === "rate" ? rateChanges : contribChanges;
    const v = parseFloat(input.value);
    if (input.value.trim() === "" || !isFinite(v)) map.delete(year);
    else map.set(year, input.dataset.col === "rate" ? v : Math.max(0, v));
    render();
  });
  /* leaving a cleared cell puts the inherited value back in view */
  tbody.addEventListener("focusout", (ev) => {
    if (ev.target.closest("input.cell-input")) render();
  });

  byId("level-btn").addEventListener("click", () => {
    const cfg = readConfig();
    const level = levelContribution(cfg);
    if (level === null) return;
    contribChanges.clear();
    contribChanges.set(1, Math.round(level * 100) / 100);
    render();
  });

  byId("scale-btn").addEventListener("click", () => {
    const cfg = readConfig();
    const base = pattern(cfg);
    const k = solveScale(cfg, base);
    if (k === null) return;
    contribChanges.clear();
    base.slice(0, cfg.contribYears).forEach((v, i) => {
      contribChanges.set(i + 1, Math.round(v * k * 100) / 100);
    });
    render();
  });

  byId("reset-btn").addEventListener("click", () => {
    contribChanges.clear();
    rateChanges.clear();
    render();
  });

  render();
});
document.addEventListener("themechange", () => {
  if (lastCfg && lastRun) renderChart(lastCfg, lastRun);
});
