# Afya Analytics · Kenya Readmission Dashboard

An interactive, single-page analytics dashboard for hospital 30-day readmission performance, calibrated to real published Kenyan data.

## Data source

Admission and readmission counts are calibrated to **Table 3** of:

> Ansermino JM, et al. *Enrolment, time to IVA, mortality, admissions and readmissions at sites in Kenya.* **PLOS Digital Health**, 2025. DOI: 10.1371/journal.pdig.0000466

| Group | Phase | Admitted | Readmitted | Rate |
|---|---|---|---|---|
| Intervention site | Baseline | 255 | 20 | 7.84% |
| Control site | Baseline | 119 | 13 | 10.92% |
| Intervention site | Implementation | 164 | 21 | 12.80% |
| Control site | Implementation | 148 | 27 | 18.24% |
| **Total** | | **686** | **81** | **11.81%** |

Counts are scaled **10×** for interactive granularity. Readmission rates stay exact.

## File structure

```
readmission/
├── index.html              Main markup
├── README.md               This file
├── css/
│   └── styles.css          Design system + animations
├── data/
│   └── kenya_readmissions.csv  (optional — for real data)
└── js/
    ├── config.js           Conditions, facilities, calibration constants
    ├── utils.js            Formatting, math, seeded RNG, Plotly config
    ├── data.js             PLOS-calibrated cohort generator
    ├── data-api.js         (optional) Real API integration stub
    ├── state.js            Filter state + applyFilters()
    ├── components.js       KPI cards, chips, empty states
    ├── charts.js           Plotly renderers
    ├── tables.js           HTML table renderers
    ├── tabs.js             Tab orchestration
    └── main.js             Bootstrap + event wiring
```

## Running locally

```bash

# Node.js
npx serve .

# Then open http://localhost:8000
```

No build step. All scripts are loaded via `<script src>` in dependency order.

## Deploying

### GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:your-username/repo.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: main / root**.

Your dashboard will be live at `https://your-username.github.io/repo/`.

### Netlify (drag-and-drop)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your project folder onto the page
3. Done — Netlify gives you a live URL in ~10 seconds

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Cloudflare Pages, S3, nginx

Upload the folder. Entry point is `index.html`. Nothing else is needed.

## Connecting real data

Two options:

**Option A — CSV.** Place a CSV at `data/kenya_readmissions.csv`. Edit `COLUMN_ALIASES` in `js/data.js` to match your column names. The loader tries CSV first, falls back to synthetic.

**Option B — REST API.** Include `js/data-api.js` in `index.html` and change `loadCohort()` to `loadCohortFromAPI()` in `js/main.js`. Configure the endpoint in the `API_CONFIG` object.

### Expected row schema

| Field | Type | Description |
|---|---|---|
| patient_id | string | Unique patient identifier |
| mrn | string | Medical record number |
| discharge_date | ISO date | Index admission discharge |
| campus | string | Facility name |
| condition | string | Cohort / DRG grouping |
| payer | string | SHA / NHIF / Private / Cash / Employer / Exempt |
| disposition | string | Home / Home-Based Care / Referral / DAMA |
| age | number | Patient age in years |
| comorb | number | Comorbidity count |
| prior_adm | number | Prior admissions in trailing 12 months |
| prior_ed | number | Prior ED visits in trailing 6 months |
| los_days | number | Index LOS in days |
| index_cost | number | Cost in KES |
| risk_score | number | Predicted 30-day probability (0–1) |
| expected_p | number | Expected probability under reference model |
| readmitted | 0 or 1 | Observed 30-day readmission |
| days_to_readmit | number or null | Days to readmission |
| readmission_cost | number | Cost of readmission in KES |

## Kenya data sources

### National systems

| Source | Purpose | Access |
|---|---|---|
| **KHIS / DHIS2** | Aggregated facility data | [hiskenya.org](https://hiskenya.org) — request credentials from MoH Division of Health Informatics |
| **National Data Warehouse** | Patient-level EMR data | IRB + NACOSTI + Health Data Controller approval |
| **KenyaEMR** | Facility-level EMR | On-site via hospital IT |
| **MFL Registry** | Facility master list | [kmhfl.health.go.ke](https://kmhfl.health.go.ke) |

### Research datasets

- **Figshare — Kenya admissions/readmissions** (this dashboard's source)
- **NIAID Data Discovery Portal** — NIH-funded Kenya research
- **KNBS Data Archive** — national statistics

### Approval process for official data

1. **IRB approval** — institutional ethics committee
2. **NACOSTI licence** — research permit
3. **Health Data Controller approval** — Ministry of Health sign-off

Contact: `kmhd@health.go.ke`

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl + K` | Focus search |
| `⌘/Ctrl + Shift + L` | Toggle dark mode |
| `Esc` | Clear search |

## License

MIT — free to use, modify, and distribute.

## Citation

If you use this dashboard in research or reporting, please cite:

```
Ansermino JM, et al. (2025). Enrolment, time to IVA, mortality,
admissions and readmissions at sites in Kenya.
PLOS Digital Health. DOI: 10.1371/journal.pdig.0000466
```