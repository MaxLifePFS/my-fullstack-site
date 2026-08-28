/* College Tuition Reduction
 *
 *   EFC          = I×rI + A×rA + i×ri + a×ra
 *   Financial aid = Cost of attendance − EFC        (floored at zero)
 *
 * where, per the model:
 *   I = parent AGI          A = parent net college asset
 *   i = student AGI         a = student net college asset
 *
 * "Net college asset" is the sum of the counted pool — bank savings, securities,
 * investment-property equity and 529 balances. The non-college pool (life insurance cash
 * value, retirement, primary-residence equity) carries a rate of zero by
 * definition: it never enters the equation, which is the whole lever.
 */

const COLLEGE_ROWS = ["bank", "stock", "prop", "c529"];
const SHELTER_ROWS = ["ins", "ret", "home"];

/* Sum a set of rows for one owner ("p" or "s") */
function sumRows(who, rows) {
  return rows.reduce((t, row) => t + numInput(`${who}-${row}`, 0, 0, 1e12), 0);
}

function readModel() {
  const coa = numInput("coa", 0, 0, 1e9);

  const rate = {
    pi: numInput("r-pi", 0, 0, 100) / 100,
    pa: numInput("r-pa", 0, 0, 100) / 100,
    si: numInput("r-si", 0, 0, 100) / 100,
    sa: numInput("r-sa", 0, 0, 100) / 100,
  };

  const owner = (who) => ({
    agi: numInput(`${who}-agi`, 0, 0, 1e12),
    college: sumRows(who, COLLEGE_ROWS),
    shelter: sumRows(who, SHELTER_ROWS),
  });

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
    coa, rate, parent, student, term, efc, aid,
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

  const noAid = m.aid === 0;
  return `
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
      <tr><td>Anything in the non-college pool</td><td>not in the equation</td>
          <td style="text-align:right"><b>${fmtCurrency(0)}</b></td></tr>
    </tbody>`;
}

function render() {
  const m = readModel();

  /* live subtotals beside the inputs — these are A and a */
  document.getElementById("p-college-sub").textContent = fmtCurrency(m.parent.college);
  document.getElementById("s-college-sub").textContent = fmtCurrency(m.student.college);
  document.getElementById("p-shelter-sub").textContent = fmtCurrency(m.parent.shelter);
  document.getElementById("s-shelter-sub").textContent = fmtCurrency(m.student.shelter);

  /* keep the stated equation in step with the rates actually entered */
  document.getElementById("eq-rpi").textContent = pct(m.rate.pi);
  document.getElementById("eq-rpa").textContent = pct(m.rate.pa);
  document.getElementById("eq-rsi").textContent = pct(m.rate.si);
  document.getElementById("eq-rsa").textContent = pct(m.rate.sa);

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
  document.querySelectorAll("input[type=number]").forEach((el) => {
    el.addEventListener("input", render);
  });
  render();
});
