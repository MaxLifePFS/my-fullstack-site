/* College Tuition Reduction
 *
 *   EFC           = I×rI + A×rA + i×ri + a×ra
 *   Financial aid = Cost of attendance − EFC        (floored at zero)
 *
 * where I/i are the parent's and student's AGI, and A/a are their net college
 * assets. What lands in A and a depends on the school type chosen in Step 1:
 *
 *   Public   A = bank + securities + rental-property equity + 529
 *
 *   Private  A = the same, plus
 *                  primary-residence equity, capped at capMult × parent AGI
 *                  business net worth   (market value − debt, floored at zero)
 *                  farm net worth       (market value − debt, floored at zero)
 *
 * Life insurance cash value and retirement savings are never counted under
 * either type — that is the lever the page is built around.
 */

const BASE_ROWS = ["bank", "stock", "prop", "c529"];
const NEVER_ROWS = ["ins", "ret"];

const CTYPE_NOTE = {
  public: "Public schools generally run the federal FAFSA formula on its own: the home, the " +
    "business and the farm stay out of the calculation entirely.",
  private: "Many private schools add the CSS Profile, which reaches further — primary-residence " +
    "equity counts (up to the cap set in Step 4), and business and farm assets count at net worth.",
};

/* Read a $ field, treating blank/invalid as zero */
const money = (id) => numInput(id, 0, 0, 1e12);

/* Sum a set of rows for one owner ("p" or "s") */
function sumRows(who, rows) {
  return rows.reduce((t, row) => t + money(`${who}-${row}`), 0);
}

function collegeType() {
  const picked = document.querySelector('input[name="ctype"]:checked');
  return picked ? picked.value : "public";
}

function readModel() {
  const coa = money("coa");
  const ctype = collegeType();
  const isPrivate = ctype === "private";

  const rate = {
    pi: numInput("r-pi", 0, 0, 100) / 100,
    pa: numInput("r-pa", 0, 0, 100) / 100,
    si: numInput("r-si", 0, 0, 100) / 100,
    sa: numInput("r-sa", 0, 0, 100) / 100,
  };
  const capMult = numInput("r-cap", 0, 0, 20);

  /* the cap is set by the PARENT's income, and applies to both columns */
  const homeCap = capMult * money("p-agi");

  const owner = (who) => {
    const base = sumRows(who, BASE_ROWS);
    const home = money(`${who}-home`);
    /* net worth cannot go below zero: a business in the red does not shelter
       the assets sitting beside it */
    const bizNet = Math.max(0, money(`${who}-biz`) - money(`${who}-bizdebt`));
    const farmNet = Math.max(0, money(`${who}-farm`) - money(`${who}-farmdebt`));
    const bizFarmNet = bizNet + farmNet;

    const homeCounted = isPrivate ? Math.min(home, homeCap) : 0;
    const conditional = isPrivate ? homeCounted + bizFarmNet : 0;
    const never = sumRows(who, NEVER_ROWS);

    return {
      agi: money(`${who}-agi`),
      base, home, homeCounted, bizNet, farmNet, bizFarmNet, conditional, never,
      college: base + conditional,
      /* everything the formula never sees, whichever school type */
      sheltered: never + (isPrivate ? home - homeCounted : home + bizFarmNet),
    };
  };

  const parent = owner("p");
  const student = owner("s");

  /* the four terms of the equation, kept separate so they can be shown */
  const term = {
    I: parent.agi * rate.pi,
    A: parent.college * rate.pa,
    i: student.agi * rate.si,
    a: student.college * rate.sa,
  };
  const efc = term.I + term.A + term.i + term.a;

  /* a school cannot award more than it costs, and never a negative amount */
  const aid = Math.max(0, coa - efc);

  return {
    coa, ctype, isPrivate, rate, capMult, homeCap, parent, student, term, efc, aid,
    parentShare: term.I + term.A,
    studentShare: term.i + term.a,
    covered: coa > 0 ? (aid / coa) * 100 : 0,
  };
}

function tile(label, value, sub, cls) {
  return `<div class="tile ${cls || ""}">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ""}
    </div>`;
}

const pct = (r) => `${(r * 100).toFixed(r * 100 % 1 === 0 ? 0 : 1)}%`;

function renderWorked(m) {
  const row = (sym, base, r, out) =>
    `<tr><td><i>${sym}</i></td><td>${fmtCurrency(base)}</td><td>× ${pct(r)}</td>
         <td style="text-align:right">${fmtCurrency(out)}</td></tr>`;

  /* under Private, say what got folded into A and a, and whether the cap bit */
  let build = "";
  if (m.isPrivate) {
    const line = (who, o) => {
      const bits = [];
      if (o.homeCounted > 0) {
        bits.push(o.home > m.homeCap
          ? `home equity ${fmtCurrency(o.home)} <b>capped at ${fmtCurrency(m.homeCap)}</b>`
          : `home equity ${fmtCurrency(o.home)}`);
      }
      if (o.bizFarmNet > 0) bits.push(`business and farm net worth ${fmtCurrency(o.bizFarmNet)}`);
      if (!bits.length) return "";
      return `<li>${who}: ${fmtCurrency(o.base)} of college assets plus ${bits.join(" and ")}
        = <b>${fmtCurrency(o.college)}</b></li>`;
    };
    const items = line("Parent", m.parent) + line("Student", m.student);
    if (items) {
      build = `<p>At a private school the home, business and farm join the counted pool:</p>
        <ul>${items}</ul>`;
    }
  }

  const noAid = m.aid === 0;
  return `${build}
    <table class="lever" style="margin-bottom:12px">
      <tbody>
        ${row("I", m.parent.agi, m.rate.pi, m.term.I)}
        ${row("A", m.parent.college, m.rate.pa, m.term.A)}
        ${row("i", m.student.agi, m.rate.si, m.term.i)}
        ${row("a", m.student.college, m.rate.sa, m.term.a)}
        <tr><td colspan="3"><b>Expected family contribution</b></td>
            <td style="text-align:right"><b>${fmtCurrency(m.efc)}</b></td></tr>
      </tbody>
    </table>
    <p>Cost of attendance ${fmtCurrency(m.coa)} − your share ${fmtCurrency(m.efc)} =
      <b>${fmtCurrency(m.aid)}</b> of need-based aid.
      ${noAid
        ? `Your share already covers the full cost, so this year generates no need-based award.`
        : `The school is being asked to cover ${m.covered.toFixed(0)}% of the bill.`}</p>
    <p>Of the ${fmtCurrency(m.efc)}, the parent side accounts for ${fmtCurrency(m.parentShare)}
      and the student side ${fmtCurrency(m.studentShare)}.</p>`;
}

function renderLever(m) {
  const per1k = (r) => fmtCurrency(1000 * r);
  const rows = [
    ["Parent college asset", "A", m.rate.pa],
    ["Student college asset", "a", m.rate.sa],
    ["Parent income", "I", m.rate.pi],
    ["Student income", "i", m.rate.si],
  ].sort((x, y) => x[2] - y[2]);

  return `<tbody>
      <tr><td colspan="2"><b>Each $1,000 assessed here…</b></td>
          <td style="text-align:right"><b>adds to your share</b></td></tr>
      ${rows.map(([name, sym, r]) =>
        `<tr><td>${name}</td><td><i>${sym}</i> × ${pct(r)}</td>
             <td style="text-align:right">${per1k(r)}</td></tr>`).join("")}
      <tr><td>Life insurance cash value or retirement savings</td><td>never in the equation</td>
          <td style="text-align:right"><b>${fmtCurrency(0)}</b></td></tr>
    </tbody>`;
}

const setText = (id, s) => { document.getElementById(id).textContent = s; };

function render() {
  const m = readModel();

  setText("ctype-note", CTYPE_NOTE[m.ctype]);

  /* the group heading and the conditional subtotal both depend on school type */
  setText("cond-hint", m.isPrivate
    ? "— counted at a private school"
    : "— not counted at a public school");
  setText("cond-sub-label", m.isPrivate
    ? "Added to the college pool"
    : "Not counted at a public school");
  setText("home-cap-label", m.isPrivate
    ? `counted after the ${m.capMult}× cap (${fmtCurrency(m.homeCap)})`
    : "not counted");

  for (const [who, o] of [["p", m.parent], ["s", m.student]]) {
    setText(`${who}-base-sub`, fmtCurrency(o.base));
    setText(`${who}-home-counted`, fmtCurrency(o.homeCounted));
    setText(`${who}-bizfarm-net`, fmtCurrency(o.bizFarmNet));
    setText(`${who}-cond-sub`, fmtCurrency(o.conditional));
    setText(`${who}-shelter-sub`, fmtCurrency(o.sheltered));
    setText(`${who}-college-sub`, fmtCurrency(o.college));
  }

  /* keep the stated equation in step with the rates actually entered */
  setText("eq-rpi", pct(m.rate.pi));
  setText("eq-rpa", pct(m.rate.pa));
  setText("eq-rsi", pct(m.rate.si));
  setText("eq-rsa", pct(m.rate.sa));

  document.getElementById("result-tiles").innerHTML = [
    tile("Your share (EFC)", fmtCurrency(m.efc), "what you are expected to pay", "hero"),
    tile("Financial aid", fmtCurrency(m.aid),
      m.aid > 0 ? `${m.covered.toFixed(0)}% of the cost of attendance`
                : "your share covers the full cost"),
    tile("From the parent side", fmtCurrency(m.parentShare),
      `income ${fmtCompact(m.term.I)} · assets ${fmtCompact(m.term.A)}`),
    tile("From the student side", fmtCurrency(m.studentShare),
      `income ${fmtCompact(m.term.i)} · assets ${fmtCompact(m.term.a)}`),
  ].join("");

  document.getElementById("worked").innerHTML = renderWorked(m);
  document.getElementById("lever-table").innerHTML = renderLever(m);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('input[type=number], input[name="ctype"]').forEach((el) => {
    el.addEventListener("input", render);
  });
  render();
});
