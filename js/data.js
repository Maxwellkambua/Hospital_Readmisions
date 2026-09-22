/* =========================================================
   DATA — PLOS Digital Health Table 3 calibrated generator
   Exposes: RAW_DATA, loadCohort(), generateCohort()
   ========================================================= */

let RAW_DATA = [];

/* ---------- Helpers ---------- */
function makeMRN(i) { return "KNH-2024-" + String(100000 + i).slice(-6); }

function makeInitials() {
  const f = "WKAMOJNEFZGHIBMDRST", l = "KAWOCHMAOKAMUODWACHEMUT";
  return f[Math.floor(rand() * f.length)] + "." + l[Math.floor(rand() * l.length)] + ".";
}

function chooseProvider(cond) {
  const s = CONDITION_SPEC[cond].specialty;
  const m = PROVIDERS.filter(p => p.specialty === s);
  const pool = m.length >= 2 ? m : PROVIDERS;
  return pool[Math.floor(rand() * pool.length)];
}

function distributeExact(total, shares) {
  const raw = shares.map(s => total * s);
  const floored = raw.map(v => Math.floor(v));
  let remainder = total - floored.reduce((a, b) => a + b, 0);
  const indexed = raw.map((v, i) => ({ i, frac: v - Math.floor(v) }));
  indexed.sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder && k < indexed.length; k++) floored[indexed[k].i]++;
  return floored;
}

function selectReadmittedIndices(patients, count) {
  if (count <= 0) return new Set();
  if (count >= patients.length) return new Set(patients.map((_, i) => i));
  const keys = patients.map((p, i) => ({
    i,
    key: -Math.log(rand() + 1e-9) / (p.risk_score + 0.05)
  }));
  keys.sort((a, b) => a.key - b.key);
  const picked = new Set();
  for (let k = 0; k < count; k++) picked.add(keys[k].i);
  return picked;
}

/* ---------- Single patient ---------- */
function makePatient(baseIndex, facility, period, monthRange, role) {
  const condWeights = {};
  CONDITIONS.forEach(c => condWeights[c] = CONDITION_SPEC[c].weight);
  const condition = weightedPick(condWeights);
  const spec = CONDITION_SPEC[condition];
  const campusSpec = CAMPUS_SPEC[facility];
  const payer = weightedPick(PAYER_WEIGHTS);
  const provider = chooseProvider(condition);
  const sex = rand() < 0.53 ? "F" : "M";
  const ethnicity = weightedPick({ Kikuyu:.17, Luo:.11, Luhya:.14, Kalenjin:.13, Kamba:.10, Kisii:.06, Somali:.06, Other:.23 });
  const region = weightedPick({
    "Nairobi Metro":.24, "Central Kenya":.16, "Rift Valley":.18, "Western Kenya":.12,
    "Nyanza":.11, "Coastal":.09, "Eastern":.07, "North Eastern":.03
  });

  const age = Math.max(0, Math.min(95, Math.round(38 + randn() * 22)));
  const comorb = Math.max(0, Math.min(10, Math.round(1.8 + randn() * 1.5)));
  const charlson = Math.max(0, Math.min(15, Math.round(comorb * 1.2 + randn() * .8 + 1)));
  const comorbList = pickN(COMORBIDITIES, comorb);
  const medCount = Math.max(1, Math.min(20, Math.round(4 + comorb * 1.2 + randn() * 2)));
  const priorAdm = Math.max(0, Math.min(8, Math.round(.7 + randn() * 1)));
  const priorEd = Math.max(0, Math.min(10, Math.round(.9 + randn() * 1)));
  const priorReadm30 = priorAdm >= 2 && rand() < .32;

  const socialRisk = Math.max(0, Math.min(10, Math.round(
    2.5 +
    (payer === "Cash / Self-Pay" || payer === "Exempt / Waiver" ? 2 : 0) +
    (region === "North Eastern" || region === "Eastern" ? 1.5 : 0) +
    randn() * 1.8
  )));
  const livesAlone = rand() < (.10 + socialRisk * .025);
  const hasCaregiver = !livesAlone && rand() < .80;
  const distance = Math.max(.5, Math.round((Math.abs(randn() * 22) + 3) * 10) / 10);
  const mobilePhone = rand() < (.94 - socialRisk * .03);
  const transportAccess = socialRisk < 5 ? "Good" : socialRisk < 8 ? "Limited" : "Poor";

  const snfLogit = -2.4 + .04 * (age - 34) + .12 * comorb + socialRisk * .05;
  let pRef4 = 1 / (1 + Math.exp(-snfLogit));
  pRef4 = Math.max(.01, Math.min(.45, pRef4));
  const u = rand();
  let disposition;
  if (u < pRef4) disposition = "Referral to Level 4";
  else if (u < pRef4 + .06) disposition = "Referral to Level 5";
  else if (u < pRef4 + .09) disposition = "Discharged Against Advice";
  else if (u < pRef4 + .27) disposition = "Home-Based Care";
  else disposition = "Discharged Home";

  const [mLo, mHi] = monthRange;
  const monthIdx = mLo + Math.floor(rand() * (mHi - mLo + 1));
  const dayOffset = Math.round((monthIdx + rand()) * DAYS_PER_MONTH);
  const dd = new Date(2024, 0, 1);
  dd.setDate(dd.getDate() + dayOffset);
  const month = dd.getMonth();
  const season = [2,3,4].includes(month) ? .14 : ([9,10,11].includes(month) ? .09 : ([6,7].includes(month) ? -.06 : 0));
  const dischargeHour = Math.max(6, Math.min(22, Math.round(13 + randn() * 3)));
  const lateDischarge = dischargeHour >= 17;

  let los = 1;
  const losMean = spec.los * (campusSpec.level === 6 ? 1.15 : .92);
  for (let k = 0; k < 3; k++) los += -Math.log(rand()) * (losMean / 3);
  los = Math.max(1, Math.min(45, Math.round(los * 10) / 10));
  const icuDays = rand() < (.10 + comorb * .015) ? Math.round(rand() * los * .35 * 10) / 10 : 0;
  const followup = rand() < (.58 - socialRisk * .035);
  const chp = rand() < (.72 - socialRisk * .04);

  let logit = Math.log(spec.base / (1 - spec.base));
  logit += .016 * (age - 34) + .12 * (comorb - 1.8) + .09 * (charlson - 4) * .6;
  logit += .17 * (priorAdm - .7) + .07 * (priorEd - .9);
  logit += priorReadm30 ? .38 : 0;
  logit += DISP_EFF[disposition] + PAYER_EFF[payer] + campusSpec.effect + provider.effect + season;
  logit -= .012 * (monthIdx - 11.5) + socialRisk * .032;
  logit += livesAlone ? .16 : 0;
  logit -= hasCaregiver ? .12 : 0;
  logit -= followup ? .20 : 0;
  logit -= chp ? .10 : 0;
  logit += lateDischarge ? .12 : 0;
  logit += icuDays > 0 ? .09 : 0;
  logit += (transportAccess === "Poor") ? .14 : (transportAccess === "Limited" ? .07 : 0);

  const p = 1 / (1 + Math.exp(-logit));
  const expectedRisk =
    .016 * (age - 34) + .12 * (comorb - 1.8) +
    .17 * (priorAdm - .7) + .07 * (priorEd - .9) +
    DISP_EFF[disposition] + PAYER_EFF[payer] + socialRisk * .028;
  let expectedP = spec.base * Math.exp(.85 * expectedRisk);
  expectedP = Math.max(.005, Math.min(.75, expectedP));

  const idxCost = spec.cost * Math.exp(randn() * .30);
  const dow = dd.getDay();
  const mk = dd.getFullYear() + "-" + String(dd.getMonth() + 1).padStart(2, "0");

  return {
    patient_id: "P" + (100000 + baseIndex),
    mrn: makeMRN(baseIndex),
    initials: makeInitials(),
    sex, ethnicity, region,
    distance_km: distance,
    mobile_phone: mobilePhone,
    transport_access: transportAccess,

    campus: facility,
    county: campusSpec.county,
    facility_level: campusSpec.level,
    study_phase: period,
    site_role: role,

    condition,
    hrrp: spec.hrrp,
    icd10: spec.icd,
    payer,
    disposition,
    provider_id: provider.id,
    provider_name: provider.name,
    provider_specialty: provider.specialty,

    age, comorb,
    comorb_list: comorbList.join(", "),
    charlson_index: charlson,
    medication_count: medCount,
    social_risk: socialRisk,
    lives_alone: livesAlone,
    has_caregiver: hasCaregiver,

    prior_adm: priorAdm,
    prior_ed: priorEd,
    prior_readmission_30d: priorReadm30,

    discharge_date: dd,
    discharge_hour: dischargeHour,
    month_key: mk,
    month_index: monthIdx,
    dow,

    los_days: los,
    icu_days: icuDays,
    index_cost: idxCost,

    followup_7d_scheduled: followup,
    chp_assigned: chp,

    risk_score: p,
    risk_tier: p >= .45 ? "Critical" : p >= .30 ? "High" : p >= .18 ? "Moderate" : "Low",
    expected_p: expectedP,

    readmitted: 0,
    days_to_readmit: null,
    readmission_cause: null,
    readmission_diagnosis: null,
    readmission_cost: 0
  };
}

/* ---------- Full cohort generator ---------- */
function generateCohort() {
  const rows = [];
  const SCALE = STUDY_CALIBRATION.scale;

  const facilityShares = { intervention: [], control: [] };
  const facilityNames  = { intervention: [], control: [] };
  CAMPUSES.forEach(name => {
    const role = CAMPUS_SPEC[name].role;
    facilityNames[role].push(name);
    facilityShares[role].push(CAMPUS_SPEC[name].weight);
  });
  ["intervention", "control"].forEach(role => {
    const total = facilityShares[role].reduce((a, b) => a + b, 0);
    facilityShares[role] = facilityShares[role].map(s => s / total);
  });

  let idx = 0;
  const causew = {};
  READMISSION_CAUSES.forEach((c, i) => causew[c] = CAUSE_WEIGHTS[i]);

  Object.entries(STUDY_CALIBRATION.periods).forEach(([periodName, periodDef]) => {
    ["intervention", "control"].forEach(role => {
      const group = STUDY_CALIBRATION.groups[`${periodName}.${role}`];
      if (!group) return;

      const targetAdmitted   = group.admitted   * SCALE;
      const targetReadmitted = group.readmitted * SCALE;

      const admPerFacility = distributeExact(targetAdmitted,   facilityShares[role]);
      const rdmPerFacility = distributeExact(targetReadmitted, facilityShares[role]);

      facilityNames[role].forEach((facility, fi) => {
        const nAdm = admPerFacility[fi];
        const nRdm = rdmPerFacility[fi];

        const batch = [];
        for (let i = 0; i < nAdm; i++) {
          batch.push(makePatient(idx++, facility, periodName, periodDef.months, role));
        }

        const readmitSet = selectReadmittedIndices(batch, nRdm);

        batch.forEach((p, i) => {
          if (readmitSet.has(i)) {
            p.readmitted = 1;
            let d = 0;
            for (let k = 0; k < 2; k++) d += -Math.log(rand()) * 6;
            p.days_to_readmit = Math.max(1, Math.min(30, Math.round(d)));
            p.readmission_cause = weightedPick(causew);
            p.readmission_diagnosis = p.icd10;
            p.readmission_cost = p.index_cost * Math.max(.2, .92 + randn() * .25);
          }
        });

        rows.push(...batch);
      });
    });
  });

  return rows;
}

/* ---------- Public loader ---------- */
async function loadCohort() {
  console.log("[data.js] Generating cohort from PLOS Digital Health Table 3 calibration…");
  RAW_DATA = generateCohort();
  const totalAdm = RAW_DATA.length;
  const totalRdm = RAW_DATA.filter(r => r.readmitted).length;
  console.log(`[data.js] ✓ ${totalAdm.toLocaleString()} admissions`);
  console.log(`[data.js] ✓ ${totalRdm.toLocaleString()} readmissions (${(totalRdm / totalAdm * 100).toFixed(2)}%)`);
  return { source: "plos-calibrated", count: totalAdm };
}