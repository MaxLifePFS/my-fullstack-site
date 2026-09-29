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

/* Every user-facing string goes through t(). The page re-renders on
   "langchange", so JS-built prose switches with the rest of the page. */
const t = (en, zh) => (document.documentElement.dataset.lang === "zh" ? zh : en);

const BASE_ROWS = ["bank", "stock", "prop", "c529"];
const NEVER_ROWS = ["ins", "ret"];

const ctypeNote = () => ({
  public: t("Public schools generally run the federal FAFSA formula on its own: the home, the "
          + "business and the farm stay out of the calculation entirely.",
            "公立学校通常只采用联邦 FAFSA 公式：自住房、企业与农场完全不进入计算。"),
  private: t("Many private schools add the CSS Profile, which reaches further — primary-residence "
           + "equity counts (up to the cap set in Step 4), and business and farm assets count at net worth.",
             "许多私立学校会加用 CSS Profile，口径更宽 —— 自住房净值要计入（以第四步设定的上限为限），"
           + "企业与农场则按净值计入。"),
});

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
          ? t(`home equity ${fmtCurrency(o.home)} <b>capped at ${fmtCurrency(m.homeCap)}</b>`,
              `自住房净值 ${fmtCurrency(o.home)}，<b>上限 ${fmtCurrency(m.homeCap)}</b>`)
          : t(`home equity ${fmtCurrency(o.home)}`, `自住房净值 ${fmtCurrency(o.home)}`));
      }
      if (o.bizFarmNet > 0) bits.push(t(`business and farm net worth ${fmtCurrency(o.bizFarmNet)}`,
                                        `企业与农场净值 ${fmtCurrency(o.bizFarmNet)}`));
      if (!bits.length) return "";
      return t(`<li>${who}: ${fmtCurrency(o.base)} of college assets plus ${bits.join(" and ")}
        = <b>${fmtCurrency(o.college)}</b></li>`,
        `<li>${who}：计入资产 ${fmtCurrency(o.base)}，加上 ${bits.join("、")}
        = <b>${fmtCurrency(o.college)}</b></li>`);
    };
    const items = line(t("Parent", "家长"), m.parent) + line(t("Student", "学生"), m.student);
    if (items) {
      build = t(`<p>At a private school the home, business and farm join the counted pool:</p>
        <ul>${items}</ul>`,
        `<p>在私立学校，自住房、企业与农场都会进入计入池：</p>
        <ul>${items}</ul>`);
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
        <tr><td colspan="3"><b>${t("Expected family contribution", "家庭预期供款")}</b></td>
            <td style="text-align:right"><b>${fmtCurrency(m.efc)}</b></td></tr>
      </tbody>
    </table>
    ${t(`<p>Cost of attendance ${fmtCurrency(m.coa)} − your share ${fmtCurrency(m.efc)} =
      <b>${fmtCurrency(m.aid)}</b> of need-based aid.
      ${noAid
        ? "Your share already covers the full cost, so this year generates no need-based award."
        : `The school is being asked to cover ${m.covered.toFixed(0)}% of the bill.`}</p>
    <p>Of the ${fmtCurrency(m.efc)}, the parent side accounts for ${fmtCurrency(m.parentShare)}
      and the student side ${fmtCurrency(m.studentShare)}.</p>`,
      `<p>就读总成本 ${fmtCurrency(m.coa)} − 您的份额 ${fmtCurrency(m.efc)} =
      需求型助学金 <b>${fmtCurrency(m.aid)}</b>。
      ${noAid
        ? "您的份额已覆盖全部成本，因此当年不产生需求型助学金。"
        : `学校需要承担账单的 ${m.covered.toFixed(0)}%。`}</p>
    <p>在这 ${fmtCurrency(m.efc)} 当中，家长方为 ${fmtCurrency(m.parentShare)}，
      学生方为 ${fmtCurrency(m.studentShare)}。</p>`)}`;
}

function renderLever(m) {
  const per1k = (r) => fmtCurrency(1000 * r);
  const rows = [
    [t("Parent college asset", "家长计入资产"), "A", m.rate.pa],
    [t("Student college asset", "学生计入资产"), "a", m.rate.sa],
    [t("Parent income", "家长收入"), "I", m.rate.pi],
    [t("Student income", "学生收入"), "i", m.rate.si],
  ].sort((x, y) => x[2] - y[2]);

  return `<tbody>
      <tr><td colspan="2"><b>${t("Each $1,000 assessed here…", "此处每计入 $1,000…")}</b></td>
          <td style="text-align:right"><b>${t("adds to your share", "使您的份额增加")}</b></td></tr>
      ${rows.map(([name, sym, r]) =>
        `<tr><td>${name}</td><td><i>${sym}</i> × ${pct(r)}</td>
             <td style="text-align:right">${per1k(r)}</td></tr>`).join("")}
      <tr><td>${t("Life insurance cash value or retirement savings", "人寿保险现金价值或退休储蓄")}</td>
          <td>${t("never in the equation", "从不进入公式")}</td>
          <td style="text-align:right"><b>${fmtCurrency(0)}</b></td></tr>
    </tbody>`;
}

const setText = (id, s) => { document.getElementById(id).textContent = s; };

function render() {
  const m = readModel();

  setText("ctype-note", ctypeNote()[m.ctype]);

  /* the group heading and the conditional subtotal both depend on school type */
  setText("cond-hint", m.isPrivate
    ? t("— counted at a private school", "—— 私立学校计入")
    : t("— not counted at a public school", "—— 公立学校不计入"));
  setText("cond-sub-label", m.isPrivate
    ? t("Added to the college pool", "计入资产池")
    : t("Not counted at a public school", "公立学校不计入"));
  setText("home-cap-label", m.isPrivate
    ? t(`counted after the ${m.capMult}× cap (${fmtCurrency(m.homeCap)})`,
        `按 ${m.capMult}× 上限计入后（${fmtCurrency(m.homeCap)}）`)
    : t("not counted", "不计入"));

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
    tile(t("Your share (EFC)", "您的份额（家庭预期供款）"), fmtCurrency(m.efc),
      t("what you are expected to pay", "学校预期由您支付的金额"), "hero"),
    tile(t("Financial aid", "需求型助学金"), fmtCurrency(m.aid),
      m.aid > 0 ? t(`${m.covered.toFixed(0)}% of the cost of attendance`,
                    `占就读总成本的 ${m.covered.toFixed(0)}%`)
                : t("your share covers the full cost", "您的份额已覆盖全部成本")),
    tile(t("From the parent side", "家长方"), fmtCurrency(m.parentShare),
      t(`income ${fmtCompact(m.term.I)} · assets ${fmtCompact(m.term.A)}`,
        `收入 ${fmtCompact(m.term.I)} · 资产 ${fmtCompact(m.term.A)}`)),
    tile(t("From the student side", "学生方"), fmtCurrency(m.studentShare),
      t(`income ${fmtCompact(m.term.i)} · assets ${fmtCompact(m.term.a)}`,
        `收入 ${fmtCompact(m.term.i)} · 资产 ${fmtCompact(m.term.a)}`)),
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
document.addEventListener("langchange", render);
