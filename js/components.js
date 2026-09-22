/* =========================================================
   COMPONENTS — KPI cards, chips, empty states
   ========================================================= */

function kpiCard({ label, value, unit, sub, subDir, spark, tone }) {
  return `<div class="kpi ${tone || ""}">
    <div class="kpi__label">${label}</div>
    <div class="kpi__value">${value}${unit ? `<span class="kpi__unit">${unit}</span>` : ""}</div>
    <div class="kpi__footer">
      <div class="kpi__sub ${subDir || ""}">${sub || ""}</div>
      ${spark || ""}
    </div>
  </div>`;
}

function kpiRow(items) {
  return items.map(kpiCard).join("");
}

function chipHTML(key, label) {
  return `<div class="chip" data-filter="${key}">${label}<button>×</button></div>`;
}

function renderChips() {
  const c = el("active-chips");
  if (!c) return;

  const chips = [];
  if (STATE.campus !== "ALL") chips.push(chipHTML("campus", "Hospital: " + STATE.campus));
  if (STATE.phase !== "ALL") chips.push(chipHTML("phase", "Phase: " + (PHASE_LABELS[STATE.phase] || STATE.phase)));
  if (STATE.condition !== "ALL") chips.push(chipHTML("condition", "Condition: " + STATE.condition));
  if (STATE.payer !== "ALL") chips.push(chipHTML("payer", "Payer: " + STATE.payer));
  if (STATE.disposition !== "ALL") chips.push(chipHTML("disposition", "Disposition: " + STATE.disposition));
  if (STATE.segment !== "ALL") chips.push(chipHTML("segment", "Segment: " + (SEGMENT_LABELS[STATE.segment] || STATE.segment)));
  if (STATE.minAge > 0) chips.push(chipHTML("minAge", "Age ≥ " + STATE.minAge));
  if (STATE.search) chips.push(chipHTML("search", `Search: "${STATE.search}"`));

  c.innerHTML = chips.join("");

  c.querySelectorAll(".chip").forEach(node => {
    const btn = node.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const f = node.dataset.filter;
      if (f === "minAge") {
        STATE.minAge = 0;
        const ai = el("f-age"); if (ai) ai.value = 0;
        const al = el("age-val"); if (al) al.textContent = "0";
      } else if (f === "search") {
        STATE.search = "";
        const s = el("patient-search"); if (s) s.value = "";
      } else {
        STATE[f] = "ALL";
        const sel = el("f-" + f);
        if (sel) sel.value = "ALL";
      }
      renderAll();
    });
  });
}

function emptyState(msg) {
  return `<div class="empty">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <p>${msg || "No data matches the current filters"}</p>
  </div>`;
}