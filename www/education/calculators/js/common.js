/* Shared helpers for all calculators */

const fmtFull = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0,
});
const fmtCompactFmt = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
});

function fmtCurrency(v) { return fmtFull.format(v); }
function fmtCompact(v) { return fmtCompactFmt.format(v); }

/* Read a numeric input, clamped to [min, max]; falls back to def when empty/invalid */
function numInput(id, def, min, max) {
  const v = parseFloat(document.getElementById(id).value);
  if (!isFinite(v)) return def;
  return Math.min(max, Math.max(min, v));
}

/* "Nice" axis ticks: returns array of clean tick values from 0 up past max */
function niceTicks(max, count) {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  let step = mag;
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (mag * m >= rough) { step = mag * m; break; }
  }
  const ticks = [];
  for (let t = 0; t <= max + step * 0.001; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/* Theme toggle: follows OS by default; button cycles light/dark and persists */
(function initTheme() {
  const saved = localStorage.getItem("fincalc-theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.dataset.theme = saved;
  }
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isDark = document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme &&
          matchMedia("(prefers-color-scheme: dark)").matches);
      const next = isDark ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("fincalc-theme", next);
      document.dispatchEvent(new CustomEvent("themechange"));
    });
  });
})();
