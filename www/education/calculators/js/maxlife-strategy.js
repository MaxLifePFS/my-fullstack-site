/* MaxLife Strategy Loop
   Bucket 1 = assets (all income in, never cashed out)
   Bucket 2 = liability (borrowed against bucket 1)
   Bucket 3 = Airbnb property bought with the borrowed money
   The property's net rent pays the loan interest; the surplus pours back into
   bucket 1, which lifts borrowing capacity again — the self-financing loop.
   Uses fmtCurrency / fmtCompact / numInput / niceTicks from common.js */

(function () {
  var BOT = 425, MAXH = 240;
  var year = 1, timer = null, rows = [], cap = 1;

  function byId(id) { return document.getElementById(id); }

  function readInputs() {
    return {
      income: numInput("income", 100000, 0, 1e12),
      incomeYears: Math.round(numInput("income-years", 20, 0, 100)),
      assetRate: numInput("asset-rate", 8, -20, 30) / 100,
      ltv: numInput("ltv", 50, 0, 95) / 100,
      borrowStart: Math.round(numInput("borrow-start", 5, 1, 100)),
      loanRate: numInput("loan-rate", 5, 0, 30) / 100,
      propYield: numInput("prop-yield", 10, 0, 40) / 100,
      propAppr: numInput("prop-appr", 6, -20, 20) / 100,
      horizon: Math.round(numInput("horizon", 30, 2, 60)),
    };
  }

  /* Beginning-of-year flows, then a year of growth. */
  function simulate(inp) {
    var asset = 0, loan = 0, prop = 0, out = [];
    var underwaterYear = null;

    for (var y = 1; y <= inp.horizon; y++) {
      // 1. income pours into the asset bucket
      var income = y <= inp.incomeYears ? inp.income : 0;
      asset += income;

      // 2. borrow whatever headroom is left under the loan-to-value cap
      var borrowed = 0;
      if (y >= inp.borrowStart) {
        borrowed = Math.max(0, inp.ltv * asset - loan);
        loan += borrowed;
        prop += borrowed;          // the borrowed cash buys property
      }

      // 3. rent pays the interest; the surplus returns to the asset bucket
      var rent = inp.propYield * prop;
      var interest = inp.loanRate * loan;
      var net = rent - interest;
      if (net >= 0) asset += net;
      else loan += -net;           // shortfall capitalises onto the loan

      // 4. a year of growth
      asset *= (1 + inp.assetRate);
      prop *= (1 + inp.propAppr);

      var worth = asset + prop - loan;
      if (worth <= 0 && underwaterYear === null) underwaterYear = y;

      out.push({
        year: y, income: income, borrowed: borrowed, rent: rent,
        interest: interest, net: net, asset: asset, loan: loan,
        prop: prop, worth: worth,
      });
    }
    out.underwaterYear = underwaterYear;
    out.inputs = inp;
    return out;
  }

  /* ---- illustration ---- */

  function fill(rectId, waveId, value) {
    var h = Math.max(0, Math.min(MAXH, (value / cap) * MAXH));
    var top = BOT - h;
    var rect = byId(rectId);
    rect.setAttribute("y", top);
    rect.setAttribute("height", h);
    var wave = byId(waveId);
    wave.setAttribute("transform", "translate(0," + top + ")");
    wave.setAttribute("opacity", h > 5 ? 1 : 0);
  }

  function render() {
    var d = rows[year - 1];
    if (!d) return;
    var inp = rows.inputs;

    fill("w-asset", "wv-asset", d.asset);
    fill("w-loan", "wv-loan", d.loan);
    fill("w-prop", "wv-prop", d.prop);

    byId("in-pour").setAttribute("opacity", d.income > 0 ? 1 : 0);
    byId("in-amt").textContent = fmtCompact(d.income) + "/yr";

    byId("borrow-flow").setAttribute("opacity", d.borrowed > 0 ? 1 : 0.25);
    byId("borrow-amt").textContent = d.borrowed > 0 ? fmtCompact(d.borrowed) : "—";
    byId("buy-flow").setAttribute("opacity", d.borrowed > 0 ? 1 : 0.25);
    byId("buy-amt").textContent = d.borrowed > 0 ? fmtCompact(d.borrowed) : "—";

    byId("interest-amt").textContent =
      fmtCompact(d.rent) + " rent − " + fmtCompact(d.interest) + " interest";

    byId("v-asset").textContent = fmtCurrency(d.asset);
    byId("v-loan").textContent = fmtCurrency(d.loan);
    byId("v-prop").textContent = fmtCurrency(d.prop);

    // the return loop only runs when the rent actually covers the interest
    var loop = byId("loop-path");
    loop.setAttribute("opacity", d.net > 0 ? 1 : 0.2);
    loop.setAttribute("stroke", d.net > 0 ? "var(--series-2)" : "var(--crit)");
    byId("loop-amt").textContent = d.net >= 0
      ? fmtCompact(d.net) + "/yr back into the asset bucket"
      : fmtCompact(-d.net) + "/yr shortfall added to the loan";

    byId("bk-year-label").textContent = "Year " + year + " — " +
      (d.income > 0 ? "income in, " : "no new income, ") +
      (d.borrowed > 0 ? "borrowing and buying" : "holding");
    byId("bk-year").value = year;

    renderTiles(d);
    highlightRow();
  }

  function renderTiles(d) {
    byId("tile-year").textContent = d.year;
    var uw = rows.underwaterYear;
    byId("result-tiles").innerHTML =
      '<div class="tile"><div class="label">1 · Asset bucket</div>' +
        '<div class="value" style="font-size:1.4rem">' + fmtCurrency(d.asset) + '</div>' +
        '<div class="sub">never cashed out</div></div>' +
      '<div class="tile"><div class="label">2 · Liability</div>' +
        '<div class="value" style="font-size:1.4rem">' + fmtCurrency(d.loan) + '</div>' +
        '<div class="sub">' + Math.round(d.asset > 0 ? (d.loan / d.asset) * 100 : 0) +
        '% of assets, cap ' + Math.round(rows.inputs.ltv * 100) + '%</div></div>' +
      '<div class="tile"><div class="label">3 · Airbnb properties</div>' +
        '<div class="value" style="font-size:1.4rem">' + fmtCurrency(d.prop) + '</div>' +
        '<div class="sub">' + fmtCurrency(d.rent) + ' net rent this year</div></div>' +
      '<div class="tile verdict ' + (d.net >= 0 ? "ok" : "bad") + '">' +
        '<div class="label">Passive income back to assets</div>' +
        '<div class="value" style="font-size:1.4rem">' +
        (d.net >= 0 ? fmtCurrency(d.net) : "−" + fmtCurrency(-d.net)) + '</div>' +
        '<div class="sub">' + (d.net >= 0 ? "rent beats the interest" : "rent does not cover the interest") +
        '</div></div>' +
      '<div class="tile verdict ' + (d.worth > 0 ? "ok" : "bad") + '">' +
        '<div class="label">Net worth</div>' +
        '<div class="value" style="font-size:1.4rem">' + fmtCurrency(d.worth) + '</div>' +
        '<div class="sub">' + (uw ? "underwater from year " + uw
          : "assets + properties − liability") + '</div></div>';
  }

  /* ---- table ---- */

  function renderTable() {
    var tbody = document.querySelector("#schedule tbody");
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      var d = rows[i];
      html += '<tr data-year="' + d.year + '">' +
        "<td>" + d.year + "</td>" +
        "<td>" + (d.income ? fmtCurrency(d.income) : "—") + "</td>" +
        "<td>" + (d.borrowed ? fmtCurrency(d.borrowed) : "—") + "</td>" +
        "<td>" + fmtCurrency(d.rent) + "</td>" +
        "<td>" + fmtCurrency(d.interest) + "</td>" +
        "<td>" + (d.net >= 0 ? fmtCurrency(d.net) : "−" + fmtCurrency(-d.net)) + "</td>" +
        "<td>" + fmtCurrency(d.asset) + "</td>" +
        "<td>" + fmtCurrency(d.loan) + "</td>" +
        "<td>" + fmtCurrency(d.prop) + "</td>" +
        "<td>" + fmtCurrency(d.worth) + "</td></tr>";
    }
    tbody.innerHTML = html;
  }

  function highlightRow() {
    var trs = document.querySelectorAll("#schedule tbody tr");
    for (var i = 0; i < trs.length; i++) {
      trs[i].className = (+trs[i].dataset.year === year) ? "hl" : "";
    }
  }

  /* One cap for the whole run so a level moves only when the balance does. */
  function rescale() {
    rows = simulate(readInputs());
    var max = 1;
    for (var i = 0; i < rows.length; i++) {
      max = Math.max(max, rows[i].asset, rows[i].loan, rows[i].prop);
    }
    var ticks = niceTicks(max, 4);
    cap = ticks[ticks.length - 1] || 1;
    byId("ml-scale").textContent = "full bucket = " + fmtCompact(cap) + " · one fixed scale";
    byId("bk-year").max = rows.inputs.horizon;
    if (year > rows.inputs.horizon) year = rows.inputs.horizon;
    renderTable();
    render();
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    byId("bk-play").textContent = "Play";
  }

  byId("bk-play").addEventListener("click", function () {
    if (timer) { stop(); return; }
    if (year >= rows.inputs.horizon) year = 1;
    byId("bk-play").textContent = "Pause";
    timer = setInterval(function () {
      year++;
      if (year >= rows.inputs.horizon) { year = rows.inputs.horizon; render(); stop(); return; }
      render();
    }, 260);
  });

  byId("bk-year").addEventListener("input", function () {
    stop(); year = +this.value; render();
  });

  var inputs = document.querySelectorAll(".form-grid input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", function () { stop(); rescale(); });
  }

  rescale();
})();
