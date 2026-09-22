let __seed = 42;
function rand() { __seed = (__seed * 1664525 + 1013904223) % 4294967296; return __seed / 4294967296; }
function randn() { let u=0,v=0; while(u===0)u=rand(); while(v===0)v=rand(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function weightedPick(weights) { const r=rand(); let c=0; for(const[k,v]of Object.entries(weights)){c+=v;if(r<c)return k;} return Object.keys(weights)[0]; }
function pickN(arr,n){ const pool=[...arr],out=[]; for(let i=0;i<n&&pool.length;i++) out.push(pool.splice(Math.floor(rand()*pool.length),1)[0]); return out; }

const pct  = x => (x * 100).toFixed(1) + "%";
function money(x) {
  const a = Math.abs(x), s = x < 0 ? "-" : "";
  if (a >= 1e9) return s + "KSh " + (a/1e9).toFixed(2) + "B";
  if (a >= 1e6) return s + "KSh " + (a/1e6).toFixed(2) + "M";
  if (a >= 1e3) return s + "KSh " + (a/1e3).toFixed(0) + "K";
  return s + "KSh " + Math.round(a);
}
const moneyFull = x => (x<0?"-":"") + "KSh " + Math.round(Math.abs(x)).toLocaleString("en-KE");
const num = x => x.toLocaleString("en-KE");

const mean = a => a.length ? a.reduce((s,v)=>s+v,0)/a.length : 0;
const sum  = a => a.reduce((s,v)=>s+v,0);
const sdiv = (a,b) => b === 0 ? 0 : a / b;
const unique = a => [...new Set(a)];

const el = id => document.getElementById(id);
const setHTML = (id,h) => { const n = el(id); if (n) n.innerHTML = h; };
const qsa = (sel,r=document) => [...r.querySelectorAll(sel)];

const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

const PALETTE = {
  brand:"#3B82F6", brand2:"#6366F1", danger:"#EF4444", warning:"#F59E0B",
  success:"#10B981", info:"#06B6D4", purple:"#8B5CF6", pink:"#EC4899", slate:"#64748B"
};
const PARR = [PALETTE.brand, PALETTE.danger, PALETTE.success, PALETTE.warning, PALETTE.purple, PALETTE.info, PALETTE.pink, PALETTE.slate];
const PLOT_CFG = { displayModeBar:false, responsive:true };

function baseLayout(extra = {}) {
  const d = isDark();
  return Object.assign({
    margin:{l:52,r:22,t:14,b:44},
    font:{family:"'Inter',sans-serif",size:11.5,color:d?"#94A3B8":"#475569"},
    plot_bgcolor:"rgba(0,0,0,0)", paper_bgcolor:"rgba(0,0,0,0)", hovermode:"closest",
    hoverlabel:{bgcolor:d?"#1A2438":"#0F172A",bordercolor:"transparent",font:{color:"#F8FAFC",size:11.5}},
    xaxis:{gridcolor:d?"rgba(148,163,184,.10)":"rgba(148,163,184,.18)",zeroline:false},
    yaxis:{gridcolor:d?"rgba(148,163,184,.10)":"rgba(148,163,184,.18)",zeroline:false},
    legend:{orientation:"h",y:-.18,x:0,font:{size:11},bgcolor:"rgba(0,0,0,0)"}
  }, extra);
}

function sparkline(values, opts = {}) {
  if (!values.length) return "";
  const w = opts.width || 60, h = opts.height || 22;
  const color = opts.color || (values[values.length-1] >= values[0] ? "#EF4444" : "#10B981");
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const stepX = w / (values.length - 1 || 1);
  const pts = values.map((v,i) => [i*stepX, h - ((v-min)/range)*(h-4) - 2]);
  const d = pts.map((p,i) => (i===0?"M":"L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaD = d + ` L${w},${h} L0,${h} Z`;
  const id = "sg" + Math.random().toString(36).slice(2,8);
  return `<svg class="kpi__spark" width="${w}" height="${h}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.28"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${areaD}" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function toast(msg, type = "default", dur = 2400) {
  const c = el("toasts"); if (!c) return;
  const n = document.createElement("div");
  n.className = "toast" + (type !== "default" ? " " + type : "");
  n.textContent = msg;
  c.appendChild(n);
  setTimeout(() => { n.style.opacity = "0"; n.style.transition = "opacity 220ms"; setTimeout(() => n.remove(), 220); }, dur);
}

function downloadCSV(rows, filename) {
  if (!rows.length) { toast("Nothing to export", "error"); return; }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach(r => {
    lines.push(headers.map(h => {
      const v = r[h];
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${rows.length.toLocaleString("en-KE")} rows`, "success");
}