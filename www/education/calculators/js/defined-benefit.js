/* Defined Benefit Funding
 *
 * Works backwards from a promised income to the single deposit that funds it.
 *
 *   1. What the promise is worth on the day it starts. Payments are at the
 *      beginning of each year, so this is an annuity-DUE. With q = (1+g)/(1+r),
 *      where g is the annual increase in the payment:
 *
 *        PV(at start) = PMT x (1 - q^L) / (1 - q)        q != 1
 *                     = PMT x L                          q == 1  (g == r)
 *
 *   2. Discount that back over the deferral. The deposit lands at the beginning
 *      of year 1 and the income starts at the beginning of year `startYear`, so
 *      it compounds for startYear - 1 years:
 *
 *        Deposit = PV(at start) / (1+r)^(startYear - 1)
 *
 * The tax figure is the deduction's value in the contribution year at today's
 * rate. It is a deferral: the income drawn later is ordinary income then.
 */

const W = 760, H = 380, PAD = { left: 68, right: 16, top: 16, bottom: 34 };
const SVG_NS = "http://www.w3.org/2000/svg";

function el(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function readModel() {
  const age = numInput("age", 57, 18, 100);
  const startYear = numInput("start-year", 16, 1, 60);
  const defer = startYear - 1;                       // years of pure compounding
  const pmt = numInput("income", 0, 0, 1e9);
  const L = Math.round(numInput("payout-years", 1, 1, 60));
  const g = numInput("cola", 0, 0, 20) / 100;
  const r = numInput("rate", 0, -20, 30) / 100;
  const tax = numInput("tax", 0, 0, 60) / 100;

  /* 1. value of the promise on the day the first payment lands */
  const q = (1 + g) / (1 + r);
  const pvAtStart = Math.abs(q - 1) < 1e-12
    ? pmt * L
    : pmt * (1 - Math.pow(q, L)) / (1 - q);

  /* 2. discount back to today */
  const growth = Math.pow(1 + r, defer);
  const deposit = pvAtStart / growth;

  /* what it would take never to touch the principal, for comparison */
  const perpetuity = r > g ? pmt * (1 + r) / (r - g) : Infinity;

  /* the full ledger, so the answer can be checked rather than trusted */
  const rows = [];
  let bal = deposit;
  let totalIncome = 0, totalInterest = 0;
  for (let y = 1; y <= defer + L; y++) {
    const draw = (y >= startYear && y < startYear + L)
      ? pmt * Math.pow(1 + g, y - startYear) : 0;
    bal -= draw;
    const interest = bal * r;
    bal += interest;
    totalIncome += draw;
    totalInterest += interest;
    rows.push({
      year: y, age: age + y - 1,
      deposit: y === 1 ? deposit : 0,
      draw, interest, balance: bal,
    });
  }

  return {
    age, startYear, defer, pmt, L, g, r, tax,
    pvAtStart, growth, deposit, perpetuity, rows,
    totalIncome, totalInterest,
    taxSaved: deposit * tax,
    netCost: deposit * (1 - tax),
    startAge: age + defer,
    endAge: age + defer + L - 1,
    residual: rows.length ? rows[rows.length - 1].balance : 0,
  };
}

const pct = (v) => `${(v * 100).toFixed(v * 100 % 1 === 0 ? 0 : 1)}%`;
/* `|| 0` folds -0 into 0: the final balance lands a hair below zero and
   would otherwise format as "-$0" */
const money0 = (v) => fmtCurrency(Math.round(v) || 0);

function tile(label, value, sub, cls) {
  return `<div class="tile ${cls || ""}">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ""}
    </div>`;
}

/* Deposit needed for an arbitrary payout length, holding everything else */
function depositFor(m, L) {
  const q = (1 + m.g) / (1 + m.r);
  const pv = Math.abs(q - 1) < 1e-12 ? m.pmt * L : m.pmt * (1 - Math.pow(q, L)) / (1 - q);
  return pv / m.growth;
}

function renderSensitivity(m) {
  const lengths = [...new Set([10, 15, 20, 25, 30, m.L])].sort((a, b) => a - b);
  const body = lengths.map((L) => {
    const d = depositFor(m, L);
    const hl = L === m.L ? ' style="font-weight:700"' : "";
    return `<tr${hl}><td>${L} years${L === m.L ? " &larr; yours" : ""}</td>
        <td>through age ${m.startAge + L - 1}</td>
        <td>${money0(d)}</td></tr>`;
  }).join("");
  const perp = isFinite(m.perpetuity)
    ? `<tr><td>never depleted</td><td>principal untouched</td>
         <td>${money0(m.perpetuity / m.growth)}</td></tr>`
    : "";
  return `<tbody>
      <tr><td><b>Payments run for…</b></td><td></td>
          <td style="text-align:right"><b>deposit today</b></td></tr>
      ${body}${perp}
    </tbody>`;
}

function renderWorked(m) {
  const q = (1 + m.g) / (1 + m.r);
  const factor = Math.abs(q - 1) < 1e-12 ? m.L : (1 - Math.pow(q, m.L)) / (1 - q);

  return `
    <p><b>Step 1 — what the promise is worth the day it starts.</b>
      ${money0(m.pmt)} a year${m.g > 0 ? `, rising ${pct(m.g)} a year,` : ""} for ${m.L} years,
      paid at the beginning of each year and discounted at ${pct(m.r)}, is worth
      <b>${money0(m.pvAtStart)}</b> at the beginning of year ${m.startYear}
      (${money0(m.pmt)} × ${factor.toFixed(4)}).</p>

    <p><b>Step 2 — discount it back ${m.defer} years.</b> ${money0(m.pvAtStart)} ÷
      ${pct(m.r)} compounding over ${m.defer} years — that is ÷ ${m.growth.toFixed(4)} —
      gives a deposit today of <b>${money0(m.deposit)}</b>.</p>

    <p><b>Step 3 — the deduction.</b> At ${pct(m.tax)} today, a ${money0(m.deposit)} deductible
      contribution cuts this year's tax by <b>${money0(m.taxSaved)}</b>, so the money actually
      out of your pocket is ${money0(m.netCost)}.</p>

    <table class="lever" style="margin-top:12px">
      <tbody>
        <tr><td>Deposit at the beginning of year 1</td><td>${money0(m.deposit)}</td></tr>
        <tr><td>Grows for ${m.defer} years at ${pct(m.r)}</td>
            <td>× ${m.growth.toFixed(4)}</td></tr>
        <tr><td>Balance at the beginning of year ${m.startYear} (age ${m.startAge})</td>
            <td><b>${money0(m.pvAtStart)}</b></td></tr>
        <tr><td>${m.L} payments of ${money0(m.pmt)}${m.g > 0 ? " and rising" : ""}</td>
            <td>${money0(m.totalIncome)}</td></tr>
        <tr><td>Left over after the last payment</td><td>${money0(m.residual)}</td></tr>
      </tbody>
    </table>

    <p style="margin-top:12px">The ${money0(m.deposit)} deposit returns ${money0(m.totalIncome)}
      of income — ${(m.totalIncome / m.deposit).toFixed(1)}× the money in — because
      ${money0(m.totalInterest)} of it is interest the plan earned along the way.</p>`;
}

function renderChart(m) {
  const svg = document.getElementById("chart");
  svg.innerHTML = "";
  if (!m.rows.length) return;

  const years = m.rows.length;
  const maxVal = Math.max(...m.rows.map((d) => d.balance), m.deposit, 1);
  const ticks = niceTicks(maxVal, 5);
  const yMax = ticks[ticks.length - 1];

  const span = Math.max(1, years - 1);
  const x = (year) => PAD.left + ((year - 1) / span) * (W - PAD.left - PAD.right);
  const y = (v) => H - PAD.bottom - (Math.max(0, v) / yMax) * (H - PAD.top - PAD.bottom);

  const s1 = cssVar("--series-1"), s3 = cssVar("--series-3");
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
  if (m.startYear > 1 && m.startYear <= years) {
    const bx = x(m.startYear);
    svg.appendChild(el("line", {
      x1: bx, x2: bx, y1: PAD.top, y2: H - PAD.bottom,
      stroke: base, "stroke-width": 1, "stroke-dasharray": "4 3",
    }));
    const lbl = el("text", {
      x: bx + 6, y: PAD.top + 12, fill: muted, "font-size": 11,
    });
    lbl.textContent = `income starts, age ${m.startAge}`;
    svg.appendChild(lbl);
  }

  /* the balance line: accumulating leg, then the drawdown leg */
  const pts = m.rows.map((d) => `${x(d.year)},${y(d.balance)}`);
  const cut = Math.min(m.startYear - 1, m.rows.length);
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
}

let lastModel = null;

function render() {
  const m = readModel();
  lastModel = m;

  document.getElementById("start-derived").textContent =
    `${m.defer} years of growth · you are ${m.startAge}`;
  document.getElementById("payout-derived").textContent =
    `through age ${m.endAge}`;
  document.getElementById("sens-income").textContent =
    money0(m.pmt).replace("$", "");

  document.getElementById("eq").innerHTML =
    `<span class="term">Deposit today</span> =
     <span class="term"><span class="step">value of the promise</span> ÷
     (1 + ${pct(m.r)})<sup>${m.defer}</sup></span> =
     <span class="ans">${money0(m.deposit)}</span>`;

  document.getElementById("result-tiles").innerHTML = [
    tile("Deposit today", money0(m.deposit),
      `funds ${money0(m.pmt)} a year for ${m.L} years`, "hero"),
    tile("Tax saved this year", money0(m.taxSaved),
      `the deduction at ${pct(m.tax)}`),
    tile("Net out of pocket", money0(m.netCost), "deposit less the deduction"),
    tile("Balance when income starts", money0(m.pvAtStart),
      `beginning of year ${m.startYear}, age ${m.startAge}`),
    tile("Total income received", money0(m.totalIncome),
      `${(m.totalIncome / (m.deposit || 1)).toFixed(1)}× the deposit`),
  ].join("");

  document.getElementById("worked").innerHTML = renderWorked(m);
  document.getElementById("sens-table").innerHTML = renderSensitivity(m);

  const body = document.querySelector("#schedule tbody");
  body.innerHTML = m.rows.map((d) => `<tr${d.year === m.startYear ? ' class="hl"' : ""}>
      <td>${d.year}</td><td>${d.age}</td>
      <td>${d.deposit ? money0(d.deposit) : "—"}</td>
      <td>${d.draw ? money0(d.draw) : "—"}</td>
      <td>${money0(d.interest)}</td>
      <td>${money0(d.balance)}</td>
    </tr>`).join("");

  document.getElementById("residual-note").textContent =
    `The deposit is solved so the last payment empties the plan: ${money0(m.residual)} is left `
    + `after the final one. The highlighted row is the first payment. Interest is credited at the `
    + `end of each year, after that year's payment has been taken out.`;

  renderChart(m);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input[type=number]").forEach((n) => {
    n.addEventListener("input", render);
  });
  render();
});
document.addEventListener("themechange", () => { if (lastModel) renderChart(lastModel); });
