/* MaxLife three-bucket illustration
   Bucket 1 = asset value, Bucket 2 = policy loan balance, Bucket 3 = death benefit.
   Uses fmtCurrency / fmtCompact / numInput / niceTicks from common.js */

(function () {
  var BOT = 375, TOP = 136, MAXH = BOT - TOP;
  var year = 1, timer = null, rows = [], cap = 1;

  /* Death benefit must stay at least this multiple of the asset value. Once the
     asset value grows past base face / CORRIDOR, the death benefit is lifted to
     keep the gap, which also keeps a net amount at risk to charge insurance on. */
  var CORRIDOR = 1.10;
  var CORRIDOR_PCT = Math.round((CORRIDOR - 1) * 100);

  function el(id) { return document.getElementById(id); }

  /* Year-by-year projection. Charges come out of the asset value before growth;
     the loan compounds and is never repaid. */
  function calc() {
    var P = numInput("premium", 100000, 0, 1e7),
        PY = numInput("prem-years", 20, 1, 80),
        r = numInput("rate", 8, 0, 20) / 100,
        F = numInput("face", 2000000, 0, 1e8),
        L = numInput("income", 500000, 0, 1e7),
        IS = numInput("income-start", 21, 1, 80),
        lr = numInput("loan-rate", 5, 0, 20) / 100,
        load = numInput("load", 6, 0, 30) / 100,
        admin = numInput("admin", 600, 0, 1e5),
        coi1 = numInput("coi", 1.5, 0, 50),
        coig = numInput("coi-growth", 9, 0, 25) / 100,
        H = numInput("horizon", 40, 5, 80);

    var cv = 0, ln = 0, borrowed = 0, dead = false, deadYear = 0, out = [];
    for (var y = 1; y <= H; y++) {
      if (!dead) {
        var db0 = Math.max(F, cv * CORRIDOR);
        var nar = Math.max(0, db0 - cv);          /* net amount at risk */
        var coi = nar / 1000 * coi1 * Math.pow(1 + coig, y - 1);
        var prem = y <= PY ? P : 0;
        var chg = prem * load + admin + coi;
        cv = Math.max(0, cv + prem - chg) * (1 + r);
        var take = y >= IS ? L : 0;
        borrowed += take;
        ln = (ln + take) * (1 + lr);
        var db = Math.max(F, cv * CORRIDOR);
        if (ln > cv && ln > 0) { dead = true; deadYear = y; }
        out.push({ cv: cv, ln: ln, db: db, chg: chg, borrowed: borrowed, take: take,
                   netCash: cv - ln, coi: coi,
                   net: Math.max(0, db - ln), dead: dead, prem: prem });
      } else {
        /* After lapse the policy terminates: no asset value, no death benefit.
           The loan balance is frozen for reference — in reality it becomes taxable income. */
        out.push({ cv: 0, ln: ln, db: 0, chg: 0, borrowed: borrowed, take: 0,
                   netCash: -ln, coi: 0, net: 0, dead: true, prem: 0 });
      }
    }
    out.lapseYear = deadYear;
    out.horizon = H;
    return out;
  }

  function h(v) { return Math.max(0, Math.min(MAXH, v / cap * MAXH)); }

  function setWater(rect, wave, height, top) {
    rect.setAttribute("y", top);
    rect.setAttribute("height", height);
    if (wave) {
      wave.setAttribute("transform", "translate(0," + top + ")");
      wave.setAttribute("opacity", height > 5 ? 1 : 0);
    }
  }

  /* Centre a band label, hiding it when the band is too thin to hold text */
  function band(node, top, height) {
    node.setAttribute("y", top + height / 2 + 4);
    node.setAttribute("opacity", height > 34 ? 1 : 0);
  }

  function render() {
    var d = rows[year - 1];
    if (!d) return;
    var h1 = h(d.cv), h2 = h(d.ln), hT = h(d.db);
    var hA = Math.min(h(Math.min(d.ln, d.db)), hT), hG = hT - hA;

    setWater(el("w1"), el("wv1"), h1, BOT - h1);
    setWater(el("w2"), el("wv2"), h2, BOT - h2);
    setWater(el("w3g"), null, hG, BOT - hG);
    setWater(el("w3a"), null, hA, BOT - hT);

    var w3 = el("wv3");
    w3.setAttribute("transform", "translate(0," + (BOT - hT) + ")");
    w3.setAttribute("opacity", hT > 5 ? 1 : 0);
    w3.setAttribute("stroke", hA > 5 ? "var(--series-3)" : "var(--series-2)");

    band(el("band-a"), BOT - hT, hA);
    band(el("band-g"), BOT - hG, hG);

    var lapsedNow = d.dead;
    el("w2").setAttribute("fill", lapsedNow ? "var(--crit)" : "var(--series-3)");
    el("w2").setAttribute("stroke", lapsedNow ? "var(--crit)" : "var(--series-3)");

    el("t1").textContent = fmtCompact(d.cv);
    el("t2").textContent = fmtCompact(d.ln);
    el("t3").textContent = fmtCompact(d.db);
    el("chg").textContent = d.chg > 0 ? fmtCompact(d.chg) + "/yr" : "—";
    el("net-lbl").textContent = "family keeps " + fmtCompact(d.net);
    el("warn").textContent = lapsedNow ? "policy has lapsed"
      : (d.ln > d.cv * 0.9 && d.ln > 0 ? "loan is outrunning bucket 1" : "");

    var paying = d.prem > 0;
    el("pour").setAttribute("opacity", paying ? 1 : 0);
    el("draw").setAttribute("opacity", (!lapsedNow && d.ln > 0) ? 1 : 0);

    el("year-label").textContent = "Year " + year + " — " +
      (lapsedNow ? "policy lapsed" : paying ? "paying premiums"
        : d.ln > 0 ? "taking tax-free income" : "growing, no premiums");
    el("year").value = year;

    el("tile-year").textContent = year;
    el("v-cv").textContent = fmtCurrency(d.cv);
    el("s-cv").textContent = "after " + fmtCurrency(d.chg) + " of charges this year";
    el("v-loan").textContent = fmtCurrency(d.ln);
    el("s-loan").textContent = fmtCurrency(d.borrowed) + " actually borrowed so far";
    el("v-db").textContent = fmtCurrency(d.db);
    el("s-db").textContent = d.cv * CORRIDOR > numInput("face", 2000000, 0, 1e8)
      ? "lifted by the " + (100 + CORRIDOR_PCT) + "% corridor" : "base death benefit";
    el("v-net").textContent = fmtCurrency(d.net);
    el("tile-net").className = "tile verdict " + (d.net > 0 ? "ok" : "bad");

    var ly = rows.lapseYear;
    el("v-lapse").textContent = ly ? "Year " + ly : "Never";
    el("s-lapse").textContent = ly ? "loan balance passes the asset value"
      : "within " + rows.horizon + " years";
    el("tile-lapse").className = "tile verdict " + (ly ? "bad" : "ok");

    moveYearMark();
    highlightRow();
  }

  /* ---- chart: asset value, loan, net asset value ---- */

  var CW = 760, CH = 380, CPAD = { top: 16, right: 16, bottom: 34, left: 68 };
  var geom = null;

  function svgEl(name, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function cssVar(n) {
    return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  }

  var SERIES = [
    { key: "cv", name: "Asset value", colour: "--series-1" },
    { key: "ln", name: "Loan balance", colour: "--series-3" },
    { key: "netCash", name: "Net asset value", colour: "--series-4" },
  ];

  function renderChart() {
    var svg = el("chart");
    svg.innerHTML = "";
    var years = rows.length, i, s;

    /* Net asset value goes negative if the loan ever passes the asset value, so the
       scale has to reach below zero rather than clipping the bad news away. */
    var maxV = 1, minV = 0;
    for (i = 0; i < rows.length; i++) {
      maxV = Math.max(maxV, rows[i].cv, rows[i].ln, rows[i].netCash);
      minV = Math.min(minV, rows[i].netCash);
    }
    var ticks = niceTicks(maxV, 5);
    var step = ticks.length > 1 ? ticks[1] - ticks[0] : maxV;
    var yMax = ticks[ticks.length - 1];
    var yMin = minV < 0 ? -Math.ceil(-minV / step) * step : 0;

    var span = Math.max(1, years - 1);
    var x = function (yr) { return CPAD.left + ((yr - 1) / span) * (CW - CPAD.left - CPAD.right); };
    var y = function (v) {
      return CH - CPAD.bottom - ((v - yMin) / (yMax - yMin)) * (CH - CPAD.top - CPAD.bottom);
    };
    geom = { x: x, y: y, years: years, span: span };

    var muted = cssVar("--text-muted"), grid = cssVar("--gridline"), base = cssVar("--baseline");

    for (var t = yMin; t <= yMax + step * 0.001; t += step) {
      var isZero = Math.abs(t) < step * 0.001;
      svg.appendChild(svgEl("line", {
        x1: CPAD.left, x2: CW - CPAD.right, y1: y(t), y2: y(t),
        stroke: isZero ? base : grid, "stroke-width": 1,
      }));
      var lbl = svgEl("text", {
        x: CPAD.left - 8, y: y(t) + 4, "text-anchor": "end",
        fill: muted, "font-size": 11, style: "font-variant-numeric: tabular-nums",
      });
      lbl.textContent = fmtCompact(t);
      svg.appendChild(lbl);
    }

    var xStep = Math.max(1, Math.ceil(years / 10));
    var xTicks = [];
    for (var yr = 1; yr <= years; yr += xStep) xTicks.push(yr);
    if (xTicks[xTicks.length - 1] !== years) {
      if (years - xTicks[xTicks.length - 1] < xStep / 2) xTicks.pop();
      xTicks.push(years);
    }
    for (i = 0; i < xTicks.length; i++) {
      var xl = svgEl("text", {
        x: x(xTicks[i]), y: CH - CPAD.bottom + 20, "text-anchor": "middle",
        fill: muted, "font-size": 11,
      });
      xl.textContent = xTicks[i];
      svg.appendChild(xl);
    }
    var axisTitle = svgEl("text", {
      x: CW - CPAD.right, y: CH - 4, "text-anchor": "end", fill: muted, "font-size": 11,
    });
    axisTitle.textContent = "Year";
    svg.appendChild(axisTitle);

    // the year the income starts, where the loan begins to build
    var IS = numInput("income-start", 21, 1, 80);
    if (IS >= 1 && IS <= years) {
      svg.appendChild(svgEl("line", {
        x1: x(IS), x2: x(IS), y1: CPAD.top, y2: CH - CPAD.bottom,
        stroke: base, "stroke-width": 1, "stroke-dasharray": "4 3",
      }));
      var isl = svgEl("text", {
        x: x(IS) + 6, y: CPAD.top + 12, "text-anchor": "start", fill: muted, "font-size": 11,
      });
      isl.textContent = "income starts";
      svg.appendChild(isl);
    }

    var surface = cssVar("--surface-1");
    for (var si = 0; si < SERIES.length; si++) {
      s = SERIES[si];
      var colour = cssVar(s.colour), pts = [];
      for (i = 0; i < rows.length; i++) pts.push(x(i + 1) + "," + y(rows[i][s.key]));
      svg.appendChild(svgEl("path", {
        d: "M" + pts.join(" L"), fill: "none", stroke: colour,
        "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round",
      }));
      var lastV = rows[rows.length - 1][s.key];
      svg.appendChild(svgEl("circle", { cx: x(years), cy: y(lastV), r: 6, fill: surface }));
      svg.appendChild(svgEl("circle", { cx: x(years), cy: y(lastV), r: 4, fill: colour }));
    }

    // marker that follows the timeline, plus the hover crosshair
    var mark = svgEl("g", { id: "year-mark" });
    mark.appendChild(svgEl("line", {
      id: "year-mark-line", y1: CPAD.top, y2: CH - CPAD.bottom,
      stroke: cssVar("--accent"), "stroke-width": 1.5, "stroke-dasharray": "5 4",
    }));
    svg.appendChild(mark);

    var hover = svgEl("g", { id: "hover-layer", style: "display:none" });
    hover.appendChild(svgEl("line", {
      id: "hover-line", y1: CPAD.top, y2: CH - CPAD.bottom, stroke: base, "stroke-width": 1,
    }));
    for (si = 0; si < SERIES.length; si++) {
      hover.appendChild(svgEl("circle", { id: "hdot-" + si + "-ring", r: 6, fill: surface }));
      hover.appendChild(svgEl("circle", { id: "hdot-" + si, r: 4, fill: cssVar(SERIES[si].colour) }));
    }
    svg.appendChild(hover);
  }

  function moveYearMark() {
    if (!geom) return;
    var line = el("year-mark-line");
    if (!line) return;
    line.setAttribute("x1", geom.x(year));
    line.setAttribute("x2", geom.x(year));
  }

  function setupChartHover() {
    var box = el("chart-box"), svg = el("chart"), tip = el("chart-tip");
    box.addEventListener("mousemove", function (ev) {
      if (!geom) return;
      var rect = svg.getBoundingClientRect();
      var px = ((ev.clientX - rect.left) / rect.width) * CW;
      var frac = (px - CPAD.left) / (CW - CPAD.left - CPAD.right);
      var yr = Math.round(Math.min(1, Math.max(0, frac)) * geom.span) + 1;
      var d = rows[yr - 1];
      if (!d) return;

      el("hover-layer").style.display = "";
      var hl = el("hover-line");
      hl.setAttribute("x1", geom.x(yr));
      hl.setAttribute("x2", geom.x(yr));
      var html = '<div class="tip-year">Year ' + yr + "</div>";
      for (var si = 0; si < SERIES.length; si++) {
        var s = SERIES[si], v = d[s.key], colour = cssVar(s.colour);
        el("hdot-" + si + "-ring").setAttribute("cx", geom.x(yr));
        el("hdot-" + si + "-ring").setAttribute("cy", geom.y(v));
        el("hdot-" + si).setAttribute("cx", geom.x(yr));
        el("hdot-" + si).setAttribute("cy", geom.y(v));
        html += '<div class="tip-row"><span class="k"><span style="background:' + colour +
          ';width:8px;height:8px;border-radius:2px;display:inline-block"></span>' + s.name +
          '</span><span class="v">' + fmtCurrency(v) + "</span></div>";
      }
      html += '<div class="tip-row"><span class="k">Death benefit</span><span class="v">' +
        fmtCurrency(d.db) + "</span></div>";
      tip.innerHTML = html;
      tip.style.display = "block";

      var boxRect = box.getBoundingClientRect();
      var tx = ev.clientX - boxRect.left;
      var flip = tx > boxRect.width - tip.offsetWidth - 30;
      tip.style.left = (flip ? tx - tip.offsetWidth - 14 : tx + 14) + "px";
      tip.style.top = Math.min(ev.clientY - boxRect.top + 10,
        boxRect.height - tip.offsetHeight - 6) + "px";
    });
    box.addEventListener("mouseleave", function () {
      tip.style.display = "none";
      var h = el("hover-layer");
      if (h) h.style.display = "none";
    });
  }

  /* ---- schedule table ---- */

  function renderTable() {
    var tbody = document.querySelector("#schedule tbody"), html = "", i;
    for (i = 0; i < rows.length; i++) {
      var d = rows[i], yr = i + 1;
      html += '<tr data-year="' + yr + '">' +
        "<td>" + yr + "</td>" +
        "<td>" + (d.prem ? fmtCurrency(d.prem) : "—") + "</td>" +
        "<td>" + (d.chg ? fmtCurrency(d.chg) : "—") + "</td>" +
        "<td>" + (d.take ? fmtCurrency(d.take) : "—") + "</td>" +
        "<td>" + fmtCurrency(d.cv) + "</td>" +
        "<td>" + fmtCurrency(d.ln) + "</td>" +
        "<td>" + (d.netCash < 0 ? "−" + fmtCurrency(-d.netCash) : fmtCurrency(d.netCash)) + "</td>" +
        "<td>" + fmtCurrency(d.db) + "</td>" +
        "<td>" + fmtCurrency(d.net) + "</td></tr>";
    }
    tbody.innerHTML = html;
  }

  function highlightRow() {
    var trs = document.querySelectorAll("#schedule tbody tr");
    for (var i = 0; i < trs.length; i++) {
      trs[i].className = (+trs[i].getAttribute("data-year") === year) ? "hl" : "";
    }
  }

  /* Recompute, then pick a round bucket capacity so all three share one scale */
  function rescale() {
    rows = calc();
    var max = 0;
    for (var i = 0; i < rows.length; i++) {
      max = Math.max(max, rows[i].cv, rows[i].ln, rows[i].db);
    }
    var ticks = niceTicks(max, 4);
    cap = ticks[ticks.length - 1] || 1;
    el("scale-note").textContent = "full bucket = " + fmtCompact(cap);
    el("year").max = rows.horizon;
    if (year > rows.horizon) year = rows.horizon;
    renderChart();
    renderTable();
    render();
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    el("play").textContent = "Play";
  }

  el("play").addEventListener("click", function () {
    if (timer) { stop(); return; }
    if (year >= rows.horizon) year = 1;
    el("play").textContent = "Pause";
    timer = setInterval(function () {
      year++;
      if (year >= rows.horizon) { year = rows.horizon; render(); stop(); return; }
      render();
    }, 220);
  });

  el("year").addEventListener("input", function () { stop(); year = +this.value; render(); });

  var inputs = document.querySelectorAll(".form-grid input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("input", function () { stop(); rescale(); });
  }

  setupChartHover();
  document.addEventListener("themechange", renderChart);
  rescale();
})();
