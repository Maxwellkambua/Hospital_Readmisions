/* =========================================================
   FILTER STATE & APPLICATION
   ========================================================= */

const FILTERS = {
  campus: "ALL",
  condition: "ALL",
  payer: "ALL",
  disposition: "ALL",
  segment: "ALL",
  minAge: 18
};

/**
 * Apply the current FILTERS state against RAW_DATA.
 * Returns a filtered array of admission records.
 */
function applyFilters() {
  return RAW_DATA.filter(r =>
    (FILTERS.campus === "ALL"      || r.campus === FILTERS.campus) &&
    (FILTERS.condition === "ALL"   || r.condition === FILTERS.condition) &&
    (FILTERS.payer === "ALL"       || r.payer === FILTERS.payer) &&
    (FILTERS.disposition === "ALL" || r.disposition === FILTERS.disposition) &&
    (FILTERS.segment !== "hrrp"     || r.hrrp) &&
    (FILTERS.segment !== "highrisk" || r.risk_score >= 0.30) &&
    r.age >= FILTERS.minAge
  );
}

/**
 * Compute mix-weighted national benchmark for a set of rows.
 */
function nationalBenchmark(rows) {
  if (!rows.length) return 0.15;
  const counts = {};
  rows.forEach(r => counts[r.condition] = (counts[r.condition] || 0) + 1);

  let bench = 0;
  Object.entries(counts).forEach(([c, n]) => {
    bench += (n / rows.length) * CONDITION_SPEC[c].base;
  });
  return bench;
}

/**
 * Populate the sidebar select dropdowns from a values array.
 */
function populateSelect(id, values, allLabel) {
  const sel = el(id);
  sel.innerHTML = `<option value="ALL">${allLabel}</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join("");
}

/**
 * Bind sidebar controls to FILTERS and trigger re-render.
 */
function initFilters(onChange) {
  populateSelect("f-campus",      CAMPUSES,     "All Campuses");
  populateSelect("f-condition",   CONDITIONS,   "All Conditions");
  populateSelect("f-payer",       PAYERS,       "All Payers");
  populateSelect("f-disposition", DISPOSITIONS, "All Dispositions");

  ["f-campus", "f-condition", "f-payer", "f-disposition", "f-segment"]
    .forEach(id => {
      el(id).addEventListener("change", e => {
        FILTERS[id.replace("f-", "")] = e.target.value;
        onChange();
      });
    });

  el("f-age").addEventListener("input", e => {
    FILTERS.minAge = parseInt(e.target.value, 10);
    el("age-val").textContent = e.target.value;
    onChange();
  });
}