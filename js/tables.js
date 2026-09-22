/* =========================================================
   TABLES — Kenya Readmission Dashboard
   ========================================================= */

function th(cols) {
  return "<thead><tr>" + cols.map(c => `<th>${c}</th>`).join("") + "</tr></thead>";
}

function renderCampusTable(rows) {
  if (!rows.length) { setHTML("table-campus", emptyState("No data")); return; }

  const bc = {};
  rows.forEach(r => {
    if (!bc[r.campus]) bc[r.campus] = { n: 0, r: 0, e: 0, c: 0 };
    bc[r.campus].n++;
    bc[r.campus].r += r.readmitted;
    bc[r.campus].e += r.expected_p;
    if (r.readmitted) bc[r.campus].c += r.readmission_cost;
  });

  const e = Object.entries(bc).map(([c, v]) => ({
    campus: c,
    n: v.n,
    rate: sdiv(v.r, v.n),
    err: sdiv(v.r, v.e),
    excess: (v.r - v.e) * (365 / (STUDY_MONTHS * DAYS_PER_MONTH)),
    cost: v.c,
    meta: CAMPUS_SPEC[c]
  })).sort((a, b) => b.err - a.err);

  let h = '<div class="table-wrap"><table>' +
    th(["Facility", "Beds", "Stars", "Volume", "Rate", "ERR", "Excess", "Cost"]) +
    "<tbody>";

  e.forEach(x => {
    const badge = x.err > 1.05
      ? '<span class="badge high">Above peer</span>'
      : x.err > .98
        ? '<span class="badge mid">At peer</span>'
        : '<span class="badge low">Below peer</span>';
    const stars = "★".repeat(x.meta.stars) + "☆".repeat(5 - x.meta.stars);
    const errCol = x.err > 1 ? "var(--danger-500)" : "var(--success-500)";

    h += `<tr>
      <td><b>${x.campus}</b></td>
      <td>${x.meta.beds}</td>
      <td><span class="stars">${stars}</span></td>
      <td>${num(x.n)}</td>
      <td>${pct(x.rate)}</td>
      <td><b style="color:${errCol}">${x.err.toFixed(3)}</b></td>
      <td>${x.excess > 0 ? "+" : ""}${x.excess.toFixed(0)}</td>
      <td>${money(x.cost)}</td>
    </tr>`;
  });

  setHTML("table-campus", h + "</tbody></table></div>");
}

function renderHighRiskTable(rows) {
  if (!rows.length) { setHTML("table-highrisk", emptyState("No patients")); return; }
  const top = [...rows].sort((a, b) => b.risk_score - a.risk_score).slice(0, 20);

  let h = '<div class="table-wrap"><table>' +
    th(["MRN", "Initials", "Age", "Condition", "Hospital", "Charlson", "Prior Adm.", "Disposition", "Follow-up", "Risk"]) +
    "<tbody>";

  top.forEach(p => {
    const cls = p.risk_score > .45 ? "high" : p.risk_score > .30 ? "mid" : "low";
    const fu = p.followup_7d_scheduled
      ? '<span class="badge low">Scheduled</span>'
      : '<span class="badge high">Missing</span>';
    h += `<tr>
      <td><b>${p.mrn}</b></td>
      <td>${p.initials}</td>
      <td>${p.age}</td>
      <td>${p.condition}</td>
      <td>${p.campus}</td>
      <td>${p.charlson_index}</td>
      <td>${p.prior_adm}</td>
      <td>${p.disposition}</td>
      <td>${fu}</td>
      <td><span class="badge ${cls}">${pct(p.risk_score)}</span></td>
    </tr>`;
  });

  setHTML("table-highrisk", h + "</tbody></table></div>");
}

function renderProviderTable(rows) {
  if (!rows.length) { setHTML("table-providers", emptyState("No data")); return; }

  const bp = {};
  rows.forEach(r => {
    if (!bp[r.provider_id]) bp[r.provider_id] = {
      id: r.provider_id, name: r.provider_name, spec: r.provider_specialty,
      n: 0, a: 0, e: 0, cost: 0
    };
    const p = bp[r.provider_id];
    p.n++;
    p.a += r.readmitted;
    p.e += r.expected_p;
    if (r.readmitted) p.cost += r.readmission_cost;
  });

  const e = Object.values(bp)
    .filter(p => p.n >= 50)
    .map(p => ({
      ...p,
      rate: sdiv(p.a, p.n),
      err: sdiv(p.a, p.e),
      expectedRate: sdiv(p.e, p.n)
    }))
    .sort((a, b) => b.err - a.err);

  let h = '<div class="table-wrap"><table>' +
    th(["Provider", "Specialty", "Volume", "Rate", "Expected", "ERR", "Excess", "Cost", "Status"]) +
    "<tbody>";

  e.forEach(p => {
    const badge = p.err > 1.05
      ? '<span class="badge high">Above peer</span>'
      : p.err > .98
        ? '<span class="badge mid">At peer</span>'
        : '<span class="badge low">Below peer</span>';
    const errCol = p.err > 1 ? "var(--danger-500)" : "var(--success-500)";
    h += `<tr>
      <td><b>${p.name}</b></td>
      <td>${p.spec}</td>
      <td>${num(p.n)}</td>
      <td>${pct(p.rate)}</td>
      <td>${pct(p.expectedRate)}</td>
      <td><b style="color:${errCol}">${p.err.toFixed(3)}</b></td>
      <td>${(p.a - p.e).toFixed(1)}</td>
      <td>${money(p.cost)}</td>
      <td>${badge}</td>
    </tr>`;
  });

  setHTML("table-providers", h + "</tbody></table></div>");
}

function renderTargetTable(sorted) {
  if (!sorted.length) { setHTML("table-target", emptyState("No patients")); return; }
  const top = sorted.slice(0, 20);

  let h = '<div class="table-wrap"><table>' +
    th(["#", "MRN", "Age", "Condition", "Hospital", "Charlson", "Social Risk", "Disposition", "Risk", "Priority"]) +
    "<tbody>";

  top.forEach((p, i) => {
    const cls = p.risk_score > .45 ? "high" : p.risk_score > .30 ? "mid" : "low";
    const prio = p.risk_score > .45 ? "Critical" : p.risk_score > .30 ? "High" : "Moderate";
    h += `<tr>
      <td><b>${i + 1}</b></td>
      <td>${p.mrn}</td>
      <td>${p.age}</td>
      <td>${p.condition}</td>
      <td>${p.campus}</td>
      <td>${p.charlson_index}</td>
      <td>${p.social_risk}/10</td>
      <td>${p.disposition}</td>
      <td><b>${pct(p.risk_score)}</b></td>
      <td><span class="badge ${cls}">${prio}</span></td>
    </tr>`;
  });

  setHTML("table-target", h + "</tbody></table></div>");
}