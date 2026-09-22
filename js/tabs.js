function renderExecTab(rows) {
  if (!rows.length) { setHTML("exec-kpis", emptyState()); return; }
  const n = rows.length, rm = rows.filter(r => r.readmitted === 1);
  const rate = sdiv(rm.length, n), bench = nationalBenchmark(rows), delta = rate - bench;
  const exp = sum(rows.map(r => r.expected_p)), err = sdiv(rm.length, exp);
  const avgDays = rm.length ? mean(rm.map(r => r.days_to_readmit)) : 0;
  const readmCost = sum(rm.map(r => r.readmission_cost));
  const excessAnnual = Math.max(0, err - 1) * exp * (365 / (STUDY_MONTHS * DAYS_PER_MONTH));
  const excessCost = excessAnnual * mean(rows.map(r => r.index_cost));

  const md = {};
  rows.forEach(r => { if (!md[r.month_key]) md[r.month_key] = {n:0,r:0}; md[r.month_key].n++; md[r.month_key].r += r.readmitted; });
  const monthlyRates = Object.keys(md).sort().map(k => sdiv(md[k].r, md[k].n) * 100);

  setHTML("exec-kpis", kpiRow([
    {label:"Admissions", value:num(n), sub:"in view"},
    {label:"Readmission rate", value:pct(rate), sub:`${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta*100).toFixed(1)} pp vs benchmark`, subDir:delta > 0 ? "up" : "down", tone:delta > 0 ? "warn" : "good", spark:sparkline(monthlyRates)},
    {label:"Excess Readmission Ratio", value:err.toFixed(3), sub:err > 1 ? "Above national model" : "Below national model", subDir:err > 1 ? "up" : "down", tone:err > 1 ? "warn" : "good"},
    {label:"Avg days to readmit", value:avgDays.toFixed(1), sub:"of 30-day window"},
    {label:"Readmission cost", value:money(readmCost), sub:`${num(rm.length)} events`, tone:"info"},
    {label:"Est. annual excess cost", value:money(excessCost), sub:excessCost > 0 ? "Readmission burden" : "No excess", tone:excessCost > 0 ? "warn" : "good"}
  ]));

  renderTrend(rows, bench);
  renderCondRate(rows);
  renderERR(rows);
  renderCauseMix(rows);
  renderCampusTable(rows);
}

function renderConditionTab(rows) {
  const sel = el("cond-select"); if (!sel) return;
  const avail = unique(rows.map(r => r.condition)).sort();
  const cur = [...sel.options].map(o => o.value);
  if (cur.join(",") !== avail.join(",")) {
    const c = sel.value;
    sel.innerHTML = avail.map(x => `<option value="${x}">${x}</option>`).join("");
    if (avail.includes(c)) sel.value = c;
  }
  const selected = sel.value || avail[0];
  if (!selected) return;
  renderConditionDetail(rows.filter(r => r.condition === selected), selected);
}

function renderConditionDetail(rows, condition) {
  if (!rows.length) { setHTML("cond-kpis", emptyState()); return; }
  const n = rows.length, rm = rows.filter(r => r.readmitted === 1);
  const rate = sdiv(rm.length, n), bench = CONDITION_SPEC[condition].base;
  const exp = sum(rows.map(r => r.expected_p)), err = sdiv(rm.length, exp);
  const avgLos = mean(rows.map(r => r.los_days));
  const readmCost = sum(rm.map(r => r.readmission_cost));
  const avgDays = rm.length ? mean(rm.map(r => r.days_to_readmit)) : 0;

  setHTML("cond-kpis", kpiRow([
    {label:"Volume", value:num(n), sub:"admissions"},
    {label:"Readmission rate", value:pct(rate), sub:`vs ${pct(bench)} national`, tone:rate > bench ? "warn" : "good"},
    {label:"ERR", value:err.toFixed(3), sub:err > 1 ? "Above expected" : "Below expected", tone:err > 1 ? "warn" : "good"},
    {label:"Avg LOS", value:avgLos.toFixed(1) + "d", sub:"index stay"},
    {label:"Avg days to readmit", value:avgDays.toFixed(1), sub:"of 30-day window"},
    {label:"Readmission cost", value:money(readmCost), sub:`${rm.length} events`, tone:"info"}
  ]));

  renderGauge(err);
  renderCondTrend(rows, bench);
  renderLOSDist(rows);
  renderDispBar(rows);
}

function renderRiskTab(rows) {
  if (!rows.length) return;
  const cB = [{label:"0-1",lo:0,hi:1},{label:"2-3",lo:2,hi:3},{label:"4-5",lo:4,hi:5},{label:"6-7",lo:6,hi:7},{label:"8+",lo:8,hi:99}];
  renderBucketBar("chart-comorb", rows, r => { const b = cB.find(x => r.comorb >= x.lo && r.comorb <= x.hi); return b ? b.label : null; }, "Comorbidity count", {order:cB.map(b=>b.label), high:28, mid:20});

  const pB = [{label:"0",lo:0,hi:0},{label:"1",lo:1,hi:1},{label:"2",lo:2,hi:2},{label:"3",lo:3,hi:3},{label:"4+",lo:4,hi:99}];
  renderBucketBar("chart-prior", rows, r => { const b = pB.find(x => r.prior_adm >= x.lo && r.prior_adm <= x.hi); return b ? b.label : null; }, "Prior admissions (12mo)", {order:pB.map(b=>b.label), high:28, mid:20});

  const sB = [{label:"0-2",lo:0,hi:2},{label:"3-4",lo:3,hi:4},{label:"5-6",lo:5,hi:6},{label:"7-8",lo:7,hi:8},{label:"9-10",lo:9,hi:10}];
  renderBucketBar("chart-social", rows, r => { const b = sB.find(x => r.social_risk >= x.lo && r.social_risk <= x.hi); return b ? b.label : null; }, "Social risk score", {order:sB.map(b=>b.label), high:25, mid:18});

  const bp = {};
  rows.forEach(r => { if (!bp[r.payer]) bp[r.payer] = {n:0,r:0}; bp[r.payer].n++; bp[r.payer].r += r.readmitted; });
  const pe = Object.entries(bp).map(([p,v]) => ({payer:p, rate:sdiv(v.r,v.n)*100})).sort((a,b) => b.rate - a.rate);
  Plotly.react("chart-payer", [{x:pe.map(x=>x.rate), y:pe.map(x=>x.payer), type:"bar", orientation:"h", marker:{color:pe.map((_,i) => PARR[i % PARR.length]), cornerradius:4}, text:pe.map(x => x.rate.toFixed(1)+"%"), textposition:"outside", textfont:{size:11, color:isDark()?"#CBD5E1":"#334155"}, hovertemplate:"%{y}: %{x:.1f}%<extra></extra>", cliponaxis:false}],
    baseLayout({xaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, yaxis:{automargin:true}, margin:{l:170, r:42, t:14, b:42}, showlegend:false}), PLOT_CFG);

  renderRiskDist(rows);

  const ageB = [{label:"0-14",lo:0,hi:14},{label:"15-24",lo:15,hi:24},{label:"25-44",lo:25,hi:44},{label:"45-64",lo:45,hi:64},{label:"65+",lo:65,hi:99}];
  const comB = [{label:"0-1",lo:0,hi:1},{label:"2-3",lo:2,hi:3},{label:"4-5",lo:4,hi:5},{label:"6+",lo:6,hi:99}];
  heatmap("chart-heat", rows, comB, ageB, "comorb", "age", "Comorbidity", "Age band");
  renderHighRiskTable(rows);
}

function renderTimingTab(rows) {
  if (!rows.length) return;
  renderDaysHist(rows);
  renderDOWBar(rows);
  const lB = [{label:"1-2d",lo:1,hi:2},{label:"3-4d",lo:3,hi:4},{label:"5-6d",lo:5,hi:6},{label:"7-9d",lo:7,hi:9},{label:"10+d",lo:10,hi:999}];
  renderBucketBar("chart-losbucket", rows, r => { const b = lB.find(x => r.los_days >= x.lo && r.los_days <= x.hi); return b ? b.label : null; }, "Index LOS", {order:lB.map(b=>b.label), high:22, mid:16});
  renderDischargeHour(rows);

  const camps = unique(rows.map(r => r.campus)).sort();
  const conds = unique(rows.map(r => r.condition)).sort();
  const z = [], t = [];
  camps.forEach(c => {
    const zr = [], tr = [];
    conds.forEach(co => {
      const cell = rows.filter(r => r.campus === c && r.condition === co);
      if (cell.length < 15) { zr.push(null); tr.push("n/a"); }
      else { const rate = sdiv(sum(cell.map(r => r.readmitted)), cell.length) * 100; zr.push(rate); tr.push(rate.toFixed(0) + "%"); }
    });
    z.push(zr); t.push(tr);
  });
  Plotly.react("chart-campus-heat", [{z, x:conds, y:camps, type:"heatmap", colorscale:[[0,isDark()?"#0B3B2E":"#ECFDF5"],[.4,isDark()?"#7C5A00":"#FEF3C7"],[.75,isDark()?"#9A3412":"#FB923C"],[1,isDark()?"#7F1D1D":"#DC2626"]], text:t, texttemplate:"%{text}", textfont:{size:11, color:isDark()?"#F1F5F9":"#0F172A"}, hovertemplate:"%{y} · %{x}<br>Rate %{z:.1f}%<extra></extra>", colorbar:{title:{text:"Rate %", font:{size:10.5}}, ticksuffix:"%", thickness:10, len:.85, outlinewidth:0}}],
    baseLayout({xaxis:{tickangle:-25, automargin:true}, yaxis:{automargin:true}, margin:{l:180, r:78, t:12, b:120}}), PLOT_CFG);
}

function renderProvidersTab(rows) {
  if (!rows.length) return;
  renderProviderScatter(rows);
  renderSpecialty(rows);
  renderProviderTable(rows);
}

function renderTargetTab(rows) {
  if (!rows.length) return;
  const nT = parseInt(el("n-target").value, 10);
  const rrr = parseInt(el("rrr").value, 10) / 100;
  const pc = parseInt(el("prog-cost").value, 10);
  el("n-target-val").textContent = num(nT);
  el("rrr-val").textContent = (rrr * 100).toFixed(0) + "%";
  el("prog-cost-val").textContent = moneyFull(pc);

  const sorted = [...rows].sort((a,b) => b.risk_score - a.risk_score);
  const af = 365 / (STUDY_MONTHS * DAYS_PER_MONTH);
  const at = Math.min(sorted.length, Math.round(nT / af));
  const enrolled = sorted.slice(0, at);
  const avgCost = mean(rows.filter(r => r.readmitted).map(r => r.readmission_cost)) || 45000;

  const expW = sum(enrolled.map(r => r.risk_score));
  const avoided = expW * rrr;
  const gross = avoided * avgCost;
  const cost = enrolled.length * pc;
  const net = gross - cost;
  const nnt = avoided > 0 ? enrolled.length / avoided : 0;

  setHTML("target-kpis", kpiRow([
    {label:"Enrolled (annualized)", value:num(enrolled.length), sub:"highest-risk first"},
    {label:"Readmissions avoided", value:avoided.toFixed(0), sub:"per year", tone:"good"},
    {label:"Gross savings", value:money(gross), sub:"at " + money(avgCost) + " avg cost", tone:"good"},
    {label:"Program cost", value:money(cost), sub:`${num(enrolled.length)} × ${moneyFull(pc)}`},
    {label:"Net savings", value:money(net), sub:net > 0 ? "Positive ROI" : "Negative ROI", tone:net > 0 ? "good" : "warn"},
    {label:"Number needed to treat", value:nnt.toFixed(1), sub:"per readmission avoided"}
  ]));
  renderWhatIf(sorted, rrr, pc, avgCost);
  renderTargetTable(sorted);
}

const TAB_RENDERERS = {
  exec: renderExecTab, condition: renderConditionTab, risk: renderRiskTab,
  timing: renderTimingTab, providers: renderProvidersTab, target: renderTargetTab,
  method: () => {}
};