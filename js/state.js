/* =========================================================
   STATE — Kenya Readmission Dashboard
   ========================================================= */

const STATE = {
  campus: "ALL",
  phase: "ALL",
  condition: "ALL",
  payer: "ALL",
  disposition: "ALL",
  segment: "ALL",
  minAge: 0,
  period: "all",
  search: "",
  tab: "exec"
};

const SEGMENT_LABELS = {
  ALL: "All Patients",
  hrrp: "Priority Cohorts",
  highrisk: "High Risk (≥30%)",
  followup: "No 7-Day Follow-up",
  livingalone: "Lives Alone",
  nochp: "No CHP Assigned",
  cash: "Cash / Self-Pay"
};

const PHASE_LABELS = {
  ALL: "All Phases",
  baseline: "Baseline",
  implementation: "Implementation"
};

function resetFilters() {
  STATE.campus = "ALL";
  STATE.phase = "ALL";
  STATE.condition = "ALL";
  STATE.payer = "ALL";
  STATE.disposition = "ALL";
  STATE.segment = "ALL";
  STATE.minAge = 0;
  STATE.search = "";
}

function maxMonthIndex() {
  return RAW_DATA.reduce((m, r) => Math.max(m, r.month_index), 0);
}

function periodRange() {
  const max = maxMonthIndex();
  if (STATE.period === "current") return [Math.max(0, max - 11), max];
  if (STATE.period === "prior")   return [Math.max(0, max - 23), Math.max(0, max - 12)];
  return [0, max];
}

function applyFilters() {
  const [lo, hi] = periodRange();
  const q = STATE.search.trim().toLowerCase();

  return RAW_DATA.filter(r => {
    if (r.month_index < lo || r.month_index > hi) return false;
    if (STATE.campus !== "ALL"      && r.campus !== STATE.campus) return false;
    if (STATE.phase !== "ALL"       && r.study_phase !== STATE.phase) return false;
    if (STATE.condition !== "ALL"   && r.condition !== STATE.condition) return false;
    if (STATE.payer !== "ALL"       && r.payer !== STATE.payer) return false;
    if (STATE.disposition !== "ALL" && r.disposition !== STATE.disposition) return false;
    if (r.age < STATE.minAge) return false;

    if (STATE.segment === "hrrp"        && !r.hrrp) return false;
    if (STATE.segment === "highrisk"    && r.risk_score < 0.30) return false;
    if (STATE.segment === "followup"    && r.followup_7d_scheduled) return false;
    if (STATE.segment === "livingalone" && !r.lives_alone) return false;
    if (STATE.segment === "nochp"       && r.chp_assigned) return false;
    if (STATE.segment === "cash"        && r.payer !== "Cash / Self-Pay") return false;

    if (q) {
      const hay = (r.mrn + " " + r.initials + " " + r.patient_id).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function nationalBenchmark(rows) {
  if (!rows.length) return 0.15;
  const counts = {};
  rows.forEach(r => counts[r.condition] = (counts[r.condition] || 0) + 1);
  let bench = 0;
  Object.entries(counts).forEach(([c, n]) => {
    const spec = CONDITION_SPEC[c];
    if (spec) bench += (n / rows.length) * spec.base;
  });
  return bench;
}