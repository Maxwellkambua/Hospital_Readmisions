/* =========================================================
   MAIN — Bootstrap
   Uses var to avoid duplicate-declaration errors across files
   ========================================================= */

console.log("[main.js] Loaded");

var CURRENT_ROWS = [];

function renderAll() {
  CURRENT_ROWS = applyFilters();
  var cc = el("cohort-count");
  if (cc) cc.textContent = num(CURRENT_ROWS.length);
  if (typeof renderChips === "function") renderChips();
  var fn = TAB_RENDERERS[STATE.tab];
  if (fn) fn(CURRENT_ROWS);
}

function on(id, ev, fn) {
  var n = el(id);
  if (!n) { console.warn("[main.js] Missing #" + id); return; }
  n.addEventListener(ev, fn);
}

function initTabs() {
  qsa(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      qsa(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      qsa(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var panel = el("panel-" + btn.dataset.tab);
      if (panel) panel.classList.add("active");
      STATE.tab = btn.dataset.tab;
      renderAll();
    });
  });
}

function initFilters() {
  var fill = function (id, vals, label) {
    var n = el(id);
    if (!n) return;
    n.innerHTML = '<option value="ALL">' + label + "</option>" +
      vals.map(function (v) { return '<option value="' + v + '">' + v + "</option>"; }).join("");
  };
  fill("f-campus", CAMPUSES, "All Hospitals");
  fill("f-condition", CONDITIONS, "All Conditions");
  fill("f-payer", PAYERS, "All Payers");
  fill("f-disposition", DISPOSITIONS, "All Dispositions");

  ["f-campus", "f-phase", "f-condition", "f-payer", "f-disposition", "f-segment"].forEach(function (id) {
    on(id, "change", function (e) {
      STATE[id.replace("f-", "")] = e.target.value;
      renderAll();
    });
  });

  on("f-age", "input", function (e) {
    STATE.minAge = parseInt(e.target.value, 10);
    var al = el("age-val");
    if (al) al.textContent = e.target.value;
    renderAll();
  });
}

function initConditionSelect() {
  on("cond-select", "change", function () {
    var c = el("cond-select").value;
    renderConditionDetail(applyFilters().filter(function (r) { return r.condition === c; }), c);
  });
}

function initPeriodToggle() {
  qsa(".period-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      qsa(".period-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      STATE.period = btn.dataset.period;
      renderAll();
    });
  });
}

function initSearch() {
  var input = el("patient-search");
  if (!input) return;
  var t;
  input.addEventListener("input", function (e) {
    clearTimeout(t);
    t = setTimeout(function () {
      STATE.search = e.target.value;
      renderAll();
    }, 220);
  });
}

function initReset() {
  on("reset-filters", "click", function () {
    resetFilters();
    ["f-campus", "f-phase", "f-condition", "f-payer", "f-disposition"].forEach(function (id) {
      var n = el(id); if (n) n.value = "ALL";
    });
    var s = el("f-segment"); if (s) s.value = "ALL";
    var a = el("f-age"); if (a) a.value = 0;
    var al = el("age-val"); if (al) al.textContent = "0";
    var srch = el("patient-search"); if (srch) srch.value = "";
    qsa(".period-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.period === "all");
    });
    renderAll();
    if (typeof toast === "function") toast("Filters reset", "success");
  });
}

function initTheme() {
  var saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  on("theme-toggle", "click", function () {
    var next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    renderAll();
    if (typeof toast === "function") toast(next === "dark" ? "Dark mode" : "Light mode");
  });
}

function initSidebar() {
  var sb = el("sidebar");
  if (!sb) return;
  on("sidebar-toggle", "click", function () { sb.classList.toggle("collapsed"); });
  on("menu-toggle", "click", function () { sb.classList.toggle("mobile-open"); });
  document.addEventListener("click", function (e) {
    if (!sb.classList.contains("mobile-open")) return;
    if (sb.contains(e.target)) return;
    if (e.target.closest("#menu-toggle")) return;
    sb.classList.remove("mobile-open");
  });
}

function initExport() {
  on("export-btn", "click", function () {
    if (!CURRENT_ROWS.length) {
      if (typeof toast === "function") toast("Nothing to export", "error");
      return;
    }
    var clean = CURRENT_ROWS.map(function (r) {
      return {
        mrn: r.mrn, initials: r.initials, age: r.age, sex: r.sex,
        hospital: r.campus, county: r.county,
        study_phase: r.study_phase, site_role: r.site_role,
        condition: r.condition, payer: r.payer, disposition: r.disposition,
        provider: r.provider_name, charlson: r.charlson_index,
        los_days: r.los_days, index_cost_kes: Math.round(r.index_cost),
        social_risk: r.social_risk,
        chp_assigned: r.chp_assigned,
        followup_7d_scheduled: r.followup_7d_scheduled,
        risk_score: r.risk_score.toFixed(3),
        readmitted: r.readmitted,
        days_to_readmit: r.days_to_readmit,
        readmission_cost_kes: Math.round(r.readmission_cost)
      };
    });
    downloadCSV(clean, "kenya_readmissions_" + new Date().toISOString().slice(0, 10) + ".csv");
  });
}

function initTargeting() {
  ["n-target", "rrr", "prog-cost"].forEach(function (id) {
    on(id, "input", function () {
      if (STATE.tab === "target") renderTargetTab(applyFilters());
    });
  });
}

function initShortcuts() {
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      var input = el("patient-search");
      if (input) input.focus();
    }
    if (e.key === "Escape") {
      var inp = el("patient-search");
      if (inp && document.activeElement === inp) {
        inp.value = "";
        STATE.search = "";
        renderAll();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      var toggle = el("theme-toggle");
      if (toggle) toggle.click();
    }
  });
}

async function boot() {
  console.log("[main.js] Boot");

  if (typeof loadCohort !== "function") {
    console.error("[main.js] loadCohort not defined — check js/data.js");
    return;
  }
  if (typeof CAMPUSES === "undefined") {
    console.error("[main.js] CAMPUSES not defined — check js/config.js");
    return;
  }

  try {
    await loadCohort();
  } catch (err) {
    console.error("[main.js] loadCohort failed:", err);
    return;
  }

  if (!RAW_DATA || !RAW_DATA.length) {
    console.error("[main.js] RAW_DATA empty after load");
    return;
  }

  console.log("[main.js] Rows:", RAW_DATA.length);

  try {
    initTabs();
    initFilters();
    initConditionSelect();
    initPeriodToggle();
    initSearch();
    initReset();
    initTheme();
    initSidebar();
    initExport();
    initTargeting();
    initShortcuts();
  } catch (err) {
    console.error("[main.js] init failed:", err);
  }

  try {
    renderAll();
    console.log("[main.js] ✓ Ready. View:", applyFilters().length);
    if (typeof toast === "function") {
      toast("Loaded " + RAW_DATA.length.toLocaleString() + " admissions", "success", 3200);
    }
  } catch (err) {
    console.error("[main.js] render failed:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  setTimeout(boot, 0);
}

window.boot = boot;