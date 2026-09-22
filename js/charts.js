function renderTrend(rows, bench) {
  if (!rows.length) return Plotly.purge("chart-trend");
  const bm = {};
  rows.forEach(r => { if (!bm[r.month_key]) bm[r.month_key] = {n:0,r:0}; bm[r.month_key].n++; bm[r.month_key].r += r.readmitted; });
  const k = Object.keys(bm).sort(), m = k.map(x => x + "-01");
  const vol = k.map(x => bm[x].n), rates = k.map(x => sdiv(bm[x].r, bm[x].n) * 100);
  const roll = rates.map((_, i) => mean(rates.slice(Math.max(0, i-2), i+1)));
  Plotly.react("chart-trend", [
    {x:m, y:vol, type:"bar", name:"Volume", yaxis:"y2", marker:{color:isDark()?"rgba(59,130,246,.14)":"rgba(59,130,246,.12)"}, hovertemplate:"%{y:,}<extra></extra>"},
    {x:m, y:rates, type:"scatter", mode:"lines+markers", name:"Monthly rate", line:{color:PALETTE.danger, width:2.6, shape:"spline"}, marker:{size:6, color:PALETTE.danger, line:{color:"white", width:1.5}}, hovertemplate:"%{y:.1f}%<extra></extra>"},
    {x:m, y:roll, type:"scatter", mode:"lines", name:"3-mo avg", line:{color:PALETTE.brand2, width:2, dash:"dot"}, hovertemplate:"%{y:.1f}%<extra></extra>"},
    {x:m, y:m.map(() => bench*100), type:"scatter", mode:"lines", name:"Benchmark", line:{color:PALETTE.success, width:1.8, dash:"dash"}, hovertemplate:"%{y:.1f}%<extra></extra>"}
  ], baseLayout({xaxis:{type:"date", tickformat:"%b %y"}, yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, yaxis2:{overlaying:"y", side:"right", showgrid:false, title:{text:"Volume", font:{size:11}}}, margin:{l:52, r:52, t:14, b:64}, legend:{orientation:"h", y:-.22, x:0}}), PLOT_CFG);
}

function renderCondRate(rows) {
  if (!rows.length) return Plotly.purge("chart-cond-rate");
  const bc = {};
  rows.forEach(r => { if (!bc[r.condition]) bc[r.condition] = {n:0,r:0}; bc[r.condition].n++; bc[r.condition].r += r.readmitted; });
  const e = Object.entries(bc).filter(([,v]) => v.n >= 20).map(([c,v]) => ({cond:c, rate:sdiv(v.r,v.n)*100, bench: CONDITION_SPEC[c] ? CONDITION_SPEC[c].base*100 : 15})).sort((a,b) => b.rate - a.rate);
  Plotly.react("chart-cond-rate", [
    {x:e.map(x=>x.rate), y:e.map(x=>x.cond), type:"bar", orientation:"h", marker:{color:e.map(x => x.rate > x.bench ? PALETTE.danger : PALETTE.brand), cornerradius:4}, text:e.map(x => x.rate.toFixed(1)+"%"), textposition:"outside", textfont:{size:11, color:isDark()?"#CBD5E1":"#334155"}, hovertemplate:"%{y}: %{x:.1f}%<extra></extra>", cliponaxis:false},
    {x:e.map(x=>x.bench), y:e.map(x=>x.cond), type:"scatter", mode:"markers", name:"Benchmark", marker:{color:PALETTE.success, size:11, symbol:"diamond", line:{color:"white", width:1.5}}, hovertemplate:"Benchmark %{x:.1f}%<extra></extra>"}
  ], baseLayout({xaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, yaxis:{automargin:true}, margin:{l:150, r:55, t:14, b:50}}), PLOT_CFG);
}

function renderERR(rows) {
  if (!rows.length) return Plotly.purge("chart-err");
  const bc = {};
  rows.forEach(r => { if (!bc[r.condition]) bc[r.condition] = {a:0,e:0,n:0}; bc[r.condition].a += r.readmitted; bc[r.condition].e += r.expected_p; bc[r.condition].n++; });
  const e = Object.entries(bc).filter(([,v]) => v.n >= 20 && v.e > 0).map(([c,v]) => ({cond:c, err:v.a/v.e})).sort((a,b) => b.err - a.err);
  Plotly.react("chart-err", [{x:e.map(x=>x.cond), y:e.map(x=>x.err), type:"bar", marker:{color:e.map(x => x.err > 1 ? PALETTE.danger : PALETTE.success), cornerradius:4}, text:e.map(x => x.err.toFixed(3)), textposition:"outside", textfont:{size:11, color:isDark()?"#CBD5E1":"#334155"}, hovertemplate:"%{x}: ERR %{y:.3f}<extra></extra>"}],
    baseLayout({xaxis:{tickangle:-28, automargin:true}, yaxis:{title:{text:"ERR", font:{size:11}}}, shapes:[{type:"line", x0:-.5, x1:e.length-.5, y0:1, y1:1, line:{color:isDark()?"#94A3B8":"#334155", width:1.8, dash:"dash"}}], margin:{l:55, r:25, t:24, b:100}, showlegend:false}), PLOT_CFG);
}

function renderCauseMix(rows) {
  if (!rows.length) return Plotly.purge("chart-cause");
  const rm = rows.filter(r => r.readmitted && r.readmission_cause);
  if (!rm.length) return Plotly.purge("chart-cause");
  const c = {}; rm.forEach(r => c[r.readmission_cause] = (c[r.readmission_cause] || 0) + 1);
  const e = Object.entries(c).sort((a,b) => b[1] - a[1]);
  const total = sum(e.map(x => x[1]));
  Plotly.react("chart-cause", [{labels:e.map(x=>x[0]), values:e.map(x=>x[1]), type:"pie", hole:.58, marker:{colors:PARR, line:{color:isDark()?"#131C2E":"white", width:2}}, textinfo:"percent", textfont:{size:11, color:"white"}, hovertemplate:"%{label}<br>%{value} (%{percent})<extra></extra>"}],
    baseLayout({margin:{l:10, r:10, t:10, b:10}, legend:{orientation:"v", y:.5, x:1.02, font:{size:10.5}}, annotations:[{text:`<b>${total}</b><br><span style="font-size:10px">readmits</span>`, x:.5, y:.5, showarrow:false, font:{size:14, color:isDark()?"#F1F5F9":"#0F172A"}}]}), PLOT_CFG);
}

function renderGauge(err) {
  const color = err > 1.05 ? PALETTE.danger : (err > .98 ? PALETTE.warning : PALETTE.success);
  const dark = isDark();
  Plotly.react("chart-gauge", [{type:"indicator", mode:"gauge+number+delta", value:err, number:{valueformat:".3f", font:{size:34, color, family:"Inter"}}, delta:{reference:1, valueformat:".3f", increasing:{color:PALETTE.danger}, decreasing:{color:PALETTE.success}}, gauge:{axis:{range:[.6,1.4], tickwidth:1, tickcolor:dark?"#475569":"#94A3B8", tickvals:[.6,.8,1,1.2,1.4], tickfont:{size:10}}, bar:{color, thickness:.68}, bgcolor:"rgba(0,0,0,0)", borderwidth:0, steps:[{range:[.6,1], color:dark?"rgba(16,185,129,.12)":"rgba(16,185,129,.08)"},{range:[1,1.4], color:dark?"rgba(239,68,68,.14)":"rgba(239,68,68,.08)"}], threshold:{line:{color:dark?"#94A3B8":"#334155", width:2.5}, thickness:.85, value:1}}}],
    baseLayout({margin:{l:24, r:24, t:20, b:6}}), PLOT_CFG);
}

function renderCondTrend(rows, bench) {
  if (!rows.length) return Plotly.purge("chart-cond-trend");
  const bm = {};
  rows.forEach(r => { if (!bm[r.month_key]) bm[r.month_key] = {n:0,r:0}; bm[r.month_key].n++; bm[r.month_key].r += r.readmitted; });
  const k = Object.keys(bm).sort(), m = k.map(x => x + "-01");
  const rates = k.map(x => sdiv(bm[x].r, bm[x].n) * 100);
  Plotly.react("chart-cond-trend", [
    {x:m, y:rates, type:"scatter", mode:"lines+markers", line:{color:PALETTE.brand, width:2.8, shape:"spline"}, marker:{size:6, color:PALETTE.brand, line:{color:"white", width:1.5}}, fill:"tozeroy", fillcolor:isDark()?"rgba(59,130,246,.12)":"rgba(59,130,246,.08)", name:"Rate", hovertemplate:"%{y:.1f}%<extra></extra>"},
    {x:m, y:m.map(() => bench*100), type:"scatter", mode:"lines", name:"Benchmark", line:{color:PALETTE.success, dash:"dash", width:1.8}, hovertemplate:"Bench %{y:.1f}%<extra></extra>"}
  ], baseLayout({xaxis:{type:"date", tickformat:"%b %y"}, yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, margin:{l:48, r:20, t:14, b:60}, legend:{orientation:"h", y:-.25}}), PLOT_CFG);
}

function renderLOSDist(rows) {
  if (!rows.length) return Plotly.purge("chart-los");
  const r = rows.filter(x => x.readmitted === 1).map(x => x.los_days);
  const n = rows.filter(x => x.readmitted === 0).map(x => x.los_days);
  Plotly.react("chart-los", [
    {x:n, type:"histogram", name:"Not readmitted", marker:{color:PALETTE.brand}, opacity:.75, nbinsx:28},
    {x:r, type:"histogram", name:"Readmitted", marker:{color:PALETTE.danger}, opacity:.75, nbinsx:28}
  ], baseLayout({barmode:"overlay", xaxis:{title:{text:"Length of stay (days)", font:{size:11}}}, yaxis:{title:{text:"Patients", font:{size:11}}}, margin:{l:48, r:20, t:14, b:60}, legend:{orientation:"h", y:-.25}}), PLOT_CFG);
}

function renderDispBar(rows) {
  if (!rows.length) return Plotly.purge("chart-disp");
  const bd = {};
  rows.forEach(r => { if (!bd[r.disposition]) bd[r.disposition] = {n:0,r:0}; bd[r.disposition].n++; bd[r.disposition].r += r.readmitted; });
  const e = Object.entries(bd).filter(([,v]) => v.n >= 10).map(([d,v]) => ({disp:d, rate:sdiv(v.r,v.n)*100, n:v.n})).sort((a,b) => b.rate - a.rate);
  Plotly.react("chart-disp", [{x:e.map(x=>x.disp), y:e.map(x=>x.rate), type:"bar", marker:{color:e.map((_,i) => PARR[i % PARR.length]), cornerradius:4}, text:e.map(x => x.rate.toFixed(1)+"%"), textposition:"outside", textfont:{size:11, color:isDark()?"#CBD5E1":"#334155"}, customdata:e.map(x=>x.n), hovertemplate:"%{x}<br>Rate %{y:.1f}%<br>n=%{customdata}<extra></extra>", cliponaxis:false}],
    baseLayout({xaxis:{tickangle:-18, automargin:true}, yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, margin:{l:52, r:20, t:22, b:80}, showlegend:false}), PLOT_CFG);
}

function renderBucketBar(target, rows, keyFn, xTitle, opts = {}) {
  if (!rows.length) return Plotly.purge(target);
  const bk = {};
  rows.forEach(r => { const k = keyFn(r); if (k === null) return; if (!bk[k]) bk[k] = {n:0,r:0}; bk[k].n++; bk[k].r += r.readmitted; });
  const keys = opts.order || Object.keys(bk).sort((a,b) => { const na=parseFloat(a),nb=parseFloat(b); return !isNaN(na)&&!isNaN(nb)?na-nb:a.localeCompare(b); });
  const rates = keys.map(k => bk[k] ? sdiv(bk[k].r, bk[k].n)*100 : 0);
  const counts = keys.map(k => bk[k] ? bk[k].n : 0);
  Plotly.react(target, [{x:keys, y:rates, type:"bar", marker:{color:rates.map(r => r > (opts.high||22) ? PALETTE.danger : r > (opts.mid||16) ? PALETTE.warning : PALETTE.brand), cornerradius:4}, text:rates.map(r => r.toFixed(1)+"%"), textposition:"outside", textfont:{size:10.5, color:isDark()?"#CBD5E1":"#334155"}, customdata:counts, hovertemplate:"%{x}<br>Rate %{y:.1f}%<br>n=%{customdata}<extra></extra>", cliponaxis:false}],
    baseLayout({xaxis:{title:{text:xTitle||"", font:{size:11}}}, yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, margin:{l:48, r:20, t:22, b:52}, showlegend:false}), PLOT_CFG);
}

function renderRiskDist(rows) {
  if (!rows.length) return Plotly.purge("chart-riskscore");
  const n = rows.filter(r => !r.readmitted).map(r => r.risk_score);
  const y = rows.filter(r => r.readmitted).map(r => r.risk_score);
  Plotly.react("chart-riskscore", [
    {x:n, type:"histogram", name:"Not readmitted", marker:{color:PALETTE.brand}, opacity:.75, nbinsx:35, histnorm:"probability density"},
    {x:y, type:"histogram", name:"Readmitted", marker:{color:PALETTE.danger}, opacity:.75, nbinsx:35, histnorm:"probability density"}
  ], baseLayout({barmode:"overlay", xaxis:{title:{text:"Predicted probability", font:{size:11}}, tickformat:".0%"}, yaxis:{title:{text:"Density", font:{size:11}}}, margin:{l:48, r:20, t:14, b:60}, legend:{orientation:"h", y:-.25}}), PLOT_CFG);
}

function heatmap(target, rows, xB, yB, xKey, yKey, xT, yT) {
  if (!rows.length) return Plotly.purge(target);
  const z = [], t = [];
  yB.forEach(yb => {
    const zr = [], tr = [];
    xB.forEach(xb => {
      const cell = rows.filter(r => { const xv = r[xKey], yv = r[yKey]; return xv >= xb.lo && xv <= xb.hi && yv >= yb.lo && yv <= yb.hi; });
      const rate = cell.length ? sdiv(sum(cell.map(r => r.readmitted)), cell.length) * 100 : 0;
      zr.push(cell.length >= 10 ? rate : null);
      tr.push(cell.length >= 10 ? rate.toFixed(1)+"%" : "n/a");
    });
    z.push(zr); t.push(tr);
  });
  Plotly.react(target, [{z, x:xB.map(b=>b.label), y:yB.map(b=>b.label), type:"heatmap", colorscale:[[0,isDark()?"#0B3B2E":"#ECFDF5"],[.4,isDark()?"#7C5A00":"#FEF3C7"],[.7,isDark()?"#9A3412":"#FB923C"],[1,isDark()?"#7F1D1D":"#DC2626"]], text:t, texttemplate:"%{text}", textfont:{size:12, color:isDark()?"#F1F5F9":"#0F172A", family:"Inter"}, hovertemplate:`${yT} %{y} · ${xT} %{x}<br>Rate %{z:.1f}%<extra></extra>`, colorbar:{title:{text:"Rate %", font:{size:10.5}}, ticksuffix:"%", thickness:10, len:.85, outlinewidth:0}}],
    baseLayout({xaxis:{title:{text:xT, font:{size:11}}, side:"bottom"}, yaxis:{title:{text:yT, font:{size:11}}, autorange:"reversed"}, margin:{l:78, r:78, t:12, b:54}}), PLOT_CFG);
}

function renderDaysHist(rows) {
  const rm = rows.filter(r => r.readmitted === 1);
  if (!rm.length) return Plotly.purge("chart-days");
  Plotly.react("chart-days", [{x:rm.map(r => r.days_to_readmit), type:"histogram", nbinsx:30, marker:{color:PALETTE.brand, line:{color:isDark()?"#131C2E":"white", width:1}}, hovertemplate:"Day %{x}<br>%{y} readmissions<extra></extra>"}],
    baseLayout({xaxis:{title:{text:"Days from discharge", font:{size:11}}, dtick:2}, yaxis:{title:{text:"Readmissions", font:{size:11}}},
      shapes:[
        {type:"rect", x0:0, x1:7, y0:0, y1:1, yref:"paper", fillcolor:"rgba(239,68,68,.08)", line:{width:0}, layer:"below"},
        {type:"rect", x0:7, x1:14, y0:0, y1:1, yref:"paper", fillcolor:"rgba(245,158,11,.06)", line:{width:0}, layer:"below"},
        {type:"line", x0:7, x1:7, y0:0, y1:1, yref:"paper", line:{color:PALETTE.danger, dash:"dash", width:1.6}},
        {type:"line", x0:14, x1:14, y0:0, y1:1, yref:"paper", line:{color:PALETTE.warning, dash:"dash", width:1.6}}
      ],
      annotations:[
        {x:3.5, y:1, yref:"paper", text:"Days 0–7 · Critical", showarrow:false, yshift:-18, font:{size:10.5, color:PALETTE.danger}},
        {x:10.5, y:1, yref:"paper", text:"Days 8–14", showarrow:false, yshift:-18, font:{size:10.5, color:PALETTE.warning}}
      ],
      margin:{l:52, r:22, t:34, b:50}
    }), PLOT_CFG);
}

function renderDOWBar(rows) {
  if (!rows.length) return Plotly.purge("chart-dow");
  const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], order = [1,2,3,4,5,6,0];
  const bd = {};
  rows.forEach(r => { if (!bd[r.dow]) bd[r.dow] = {n:0,r:0}; bd[r.dow].n++; bd[r.dow].r += r.readmitted; });
  const rates = order.map(d => bd[d] ? sdiv(bd[d].r, bd[d].n)*100 : 0);
  Plotly.react("chart-dow", [{x:order.map(d => names[d]), y:rates, type:"bar", marker:{color:order.map(d => [0,6].includes(d) ? PALETTE.warning : PALETTE.brand), cornerradius:4}, text:rates.map(r => r.toFixed(1)+"%"), textposition:"outside", textfont:{size:10.5, color:isDark()?"#CBD5E1":"#334155"}, hovertemplate:"%{x}: %{y:.1f}%<extra></extra>", cliponaxis:false}],
    baseLayout({yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, margin:{l:48, r:18, t:22, b:40}, showlegend:false}), PLOT_CFG);
}

function renderDischargeHour(rows) {
  if (!rows.length) return Plotly.purge("chart-dischour");
  const buckets = [{label:"6–9",lo:6,hi:9},{label:"10–13",lo:10,hi:13},{label:"14–17",lo:14,hi:17},{label:"18–21",lo:18,hi:21},{label:"22+",lo:22,hi:23}];
  const rates = buckets.map(b => { const cell = rows.filter(r => r.discharge_hour >= b.lo && r.discharge_hour <= b.hi); return {label:b.label, rate: cell.length ? sdiv(sum(cell.map(r => r.readmitted)), cell.length)*100 : 0}; });
  Plotly.react("chart-dischour", [{x:rates.map(b => b.label), y:rates.map(b => b.rate), type:"bar", marker:{color:rates.map(b => b.rate > 20 ? PALETTE.danger : b.rate > 16 ? PALETTE.warning : PALETTE.brand), cornerradius:4}, text:rates.map(b => b.rate.toFixed(1)+"%"), textposition:"outside", textfont:{size:10.5, color:isDark()?"#CBD5E1":"#334155"}, hovertemplate:"%{x}:00 · %{y:.1f}%<extra></extra>", cliponaxis:false}],
    baseLayout({xaxis:{title:{text:"Discharge hour", font:{size:11}}}, yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, margin:{l:48, r:18, t:22, b:46}, showlegend:false}), PLOT_CFG);
}

function renderProviderScatter(rows) {
  if (!rows.length) return Plotly.purge("chart-prov-scatter");
  const bp = {};
  rows.forEach(r => { if (!bp[r.provider_id]) bp[r.provider_id] = {id:r.provider_id, name:r.provider_name, spec:r.provider_specialty, n:0, a:0, e:0}; const p = bp[r.provider_id]; p.n++; p.a += r.readmitted; p.e += r.expected_p; });
  const pts = Object.values(bp).filter(p => p.n >= 30).map(p => ({x:p.n, y:p.a/p.e, name:p.name, spec:p.spec}));
  if (!pts.length) return Plotly.purge("chart-prov-scatter");
  Plotly.react("chart-prov-scatter", [{x:pts.map(p=>p.x), y:pts.map(p=>p.y), text:pts.map(p=>p.name), customdata:pts.map(p=>[p.spec,p.x]), type:"scatter", mode:"markers", marker:{size:pts.map(p => Math.max(10, Math.sqrt(p.x)*1.4)), color:pts.map(p => p.y > 1.05 ? PALETTE.danger : p.y > .98 ? PALETTE.warning : PALETTE.success), opacity:.85, line:{color:"white", width:1.5}}, hovertemplate:"<b>%{text}</b><br>%{customdata[0]}<br>Volume %{x}<br>ERR %{y:.3f}<extra></extra>"}],
    baseLayout({xaxis:{title:{text:"Admissions volume", font:{size:11}}}, yaxis:{title:{text:"Excess Readmission Ratio", font:{size:11}}}, shapes:[{type:"line", x0:0, x1:1, xref:"paper", y0:1, y1:1, line:{color:isDark()?"#94A3B8":"#64748B", dash:"dash", width:1.6}}], margin:{l:55, r:22, t:14, b:50}, showlegend:false}), PLOT_CFG);
}

function renderSpecialty(rows) {
  if (!rows.length) return Plotly.purge("chart-specialty");
  const bs = {};
  rows.forEach(r => { if (!bs[r.provider_specialty]) bs[r.provider_specialty] = {n:0,r:0}; bs[r.provider_specialty].n++; bs[r.provider_specialty].r += r.readmitted; });
  const e = Object.entries(bs).filter(([,v]) => v.n >= 30).map(([s,v]) => ({spec:s, rate:sdiv(v.r,v.n)*100})).sort((a,b) => b.rate - a.rate);
  Plotly.react("chart-specialty", [{x:e.map(x=>x.spec), y:e.map(x=>x.rate), type:"bar", marker:{color:PARR.slice(0, e.length), cornerradius:4}, text:e.map(x => x.rate.toFixed(1)+"%"), textposition:"outside", textfont:{size:11, color:isDark()?"#CBD5E1":"#334155"}, hovertemplate:"%{x}<br>Rate %{y:.1f}%<extra></extra>", cliponaxis:false}],
    baseLayout({xaxis:{tickangle:-18, automargin:true}, yaxis:{title:{text:"Rate (%)", font:{size:11}}, ticksuffix:"%"}, margin:{l:48, r:18, t:22, b:80}, showlegend:false}), PLOT_CFG);
}

function renderWhatIf(sorted, rrr, progCost, avgCost) {
  if (!sorted.length) return Plotly.purge("chart-whatif");
  const totalN = sorted.length, steps = 32;
  const xs = [], net = [], gross = [], cost = [];
  for (let i = 1; i <= steps; i++) {
    const n = Math.round((i/steps) * Math.min(totalN, 6000));
    const cohort = sorted.slice(0, n);
    const exp = sum(cohort.map(r => r.risk_score));
    const avoided = exp * rrr;
    const g = avoided * avgCost, c = n * progCost;
    xs.push(Math.round(n * (365 / (STUDY_MONTHS * DAYS_PER_MONTH))));
    net.push(g - c); gross.push(g); cost.push(c);
  }
  Plotly.react("chart-whatif", [
    {x:xs, y:net, type:"scatter", mode:"lines", name:"Net savings", line:{color:PALETTE.success, width:3, shape:"spline"}, fill:"tozeroy", fillcolor:isDark()?"rgba(16,185,129,.12)":"rgba(16,185,129,.10)", hovertemplate:"Enroll %{x}<br>Net %{y:,.0f}<extra></extra>"},
    {x:xs, y:gross, type:"scatter", mode:"lines", name:"Gross savings", line:{color:PALETTE.brand, width:2, dash:"dot", shape:"spline"}, hovertemplate:"Enroll %{x}<br>Savings %{y:,.0f}<extra></extra>"},
    {x:xs, y:cost, type:"scatter", mode:"lines", name:"Program cost", line:{color:PALETTE.danger, width:2, dash:"dot", shape:"spline"}, hovertemplate:"Enroll %{x}<br>Cost %{y:,.0f}<extra></extra>"}
  ], baseLayout({xaxis:{title:{text:"Patients enrolled per year", font:{size:11}}}, yaxis:{title:{text:"Annual KSh impact", font:{size:11}}, tickprefix:"KSh ", tickformat:",.0f"}, shapes:[{type:"line", x0:0, x1:Math.max(...xs), y0:0, y1:0, line:{color:isDark()?"#64748B":"#94A3B8", width:1, dash:"dash"}}], margin:{l:80, r:22, t:14, b:60}, legend:{orientation:"h", y:-.22}}), PLOT_CFG);
}