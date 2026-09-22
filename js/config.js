/* =========================================================
   CONFIG — Kenya, calibrated to PLOS Digital Health
   Source: Table 3, "Enrolment, time to IVA, mortality,
   admissions and readmissions at sites in Kenya."
   ========================================================= */

const CONDITION_SPEC = {
  "Pneumonia":              { weight: 0.14, base: 0.162, hrrp: true,  cost: 38000,  los: 6.2,  icd: "J18.9",  specialty: "Paediatrics" },
  "Malaria":                { weight: 0.13, base: 0.118, hrrp: true,  cost: 24000,  los: 4.1,  icd: "B50.9",  specialty: "Internal Medicine" },
  "Gastroenteritis":        { weight: 0.11, base: 0.148, hrrp: true,  cost: 22000,  los: 4.8,  icd: "A09",    specialty: "Paediatrics" },
  "HIV-Related Illness":    { weight: 0.12, base: 0.186, hrrp: true,  cost: 52000,  los: 7.4,  icd: "B24",    specialty: "Internal Medicine" },
  "Tuberculosis":           { weight: 0.08, base: 0.142, hrrp: true,  cost: 46000,  los: 8.9,  icd: "A15.0",  specialty: "Pulmonology" },
  "Sickle Cell Crisis":     { weight: 0.06, base: 0.224, hrrp: true,  cost: 34000,  los: 5.6,  icd: "D57.0",  specialty: "Haematology" },
  "Sepsis":                 { weight: 0.09, base: 0.238, hrrp: false, cost: 68000,  los: 9.2,  icd: "A41.9",  specialty: "Internal Medicine" },
  "Stroke / CVA":           { weight: 0.07, base: 0.196, hrrp: false, cost: 84000,  los: 8.4,  icd: "I64",    specialty: "Neurology" },
  "Diabetes Complications": { weight: 0.08, base: 0.174, hrrp: false, cost: 44000,  los: 6.8,  icd: "E11.9",  specialty: "Internal Medicine" },
  "Meningitis":             { weight: 0.04, base: 0.212, hrrp: false, cost: 62000,  los: 11.4, icd: "G03.9",  specialty: "Paediatrics" },
  "Hypertension / CVD":     { weight: 0.08, base: 0.156, hrrp: false, cost: 36000,  los: 5.2,  icd: "I10",    specialty: "Cardiology" }
};

/* Six real Kenyan referral hospitals — three intervention, three control */
const CAMPUS_SPEC = {
  "Kenyatta National Hospital": { weight: 0.21, effect:  0.04, beds: 1800, level: 6, county: "Nairobi",     role: "intervention", teaching: true,  stars: 4 },
  "Moi Teaching & Referral":    { weight: 0.18, effect:  0.06, beds: 1000, level: 6, county: "Uasin Gishu", role: "intervention", teaching: true,  stars: 3 },
  "Coast General Hospital":     { weight: 0.13, effect:  0.02, beds: 700,  level: 5, county: "Mombasa",    role: "intervention", teaching: false, stars: 3 },
  "Thika Level 5 Hospital":     { weight: 0.18, effect: -0.06, beds: 400,  level: 5, county: "Kiambu",     role: "control",      teaching: false, stars: 4 },
  "Embu Level 5 Hospital":      { weight: 0.14, effect: -0.08, beds: 350,  level: 5, county: "Embu",       role: "control",      teaching: false, stars: 4 },
  "Kisii Teaching & Referral":  { weight: 0.16, effect: -0.04, beds: 450,  level: 5, county: "Kisii",      role: "control",      teaching: true,  stars: 3 }
};

/* Real numbers from PLOS Digital Health Table 3 */
const STUDY_CALIBRATION = {
  scale: 10,  // Scale up 10x for richer charts. Rates stay exact.
  periods: {
    baseline:       { months: [0, 11] },
    implementation: { months: [12, 23] }
  },
  groups: {
    "baseline.intervention":       { admitted: 255, readmitted: 20, facilityRole: "intervention" },
    "baseline.control":            { admitted: 119, readmitted: 13, facilityRole: "control" },
    "implementation.intervention": { admitted: 164, readmitted: 21, facilityRole: "intervention" },
    "implementation.control":      { admitted: 148, readmitted: 27, facilityRole: "control" }
  }
};

const PROVIDERS = [
  { id:"DR-2001", name:"Dr. Wanjiku Kamau",     specialty:"Internal Medicine", effect:-0.09 },
  { id:"DR-2002", name:"Dr. Otieno Ochieng",    specialty:"Internal Medicine", effect: 0.08 },
  { id:"DR-2003", name:"Dr. Amina Hassan",      specialty:"Paediatrics",       effect:-0.11 },
  { id:"DR-2004", name:"Dr. Kipchoge Rotich",   specialty:"Paediatrics",       effect: 0.05 },
  { id:"DR-2005", name:"Dr. Njeri Mwangi",      specialty:"Cardiology",        effect:-0.06 },
  { id:"DR-2006", name:"Dr. Odhiambo Were",     specialty:"Cardiology",        effect: 0.07 },
  { id:"DR-2007", name:"Dr. Fatuma Ali",        specialty:"Pulmonology",       effect:-0.04 },
  { id:"DR-2008", name:"Dr. Kiprono Cheruiyot", specialty:"Pulmonology",       effect: 0.10 },
  { id:"DR-2009", name:"Dr. Atieno Omondi",     specialty:"Haematology",       effect:-0.03 },
  { id:"DR-2010", name:"Dr. Muthoni Karanja",   specialty:"Neurology",         effect: 0.06 },
  { id:"DR-2011", name:"Dr. Barasa Wafula",     specialty:"Neurology",         effect:-0.05 },
  { id:"DR-2012", name:"Dr. Zainab Mohamed",    specialty:"Haematology",       effect: 0.04 }
];

const DISP_EFF = {
  "Discharged Home":          -0.16,
  "Home-Based Care":           0.14,
  "Referral to Level 4":       0.32,
  "Referral to Level 5":       0.20,
  "Discharged Against Advice": 0.68
};

const PAYER_EFF = {
  "SHA (Social Health Authority)": -0.04,
  "Private Insurance":             -0.18,
  "NHIF (Legacy)":                  0.02,
  "Cash / Self-Pay":                0.14,
  "Employer Scheme":               -0.10,
  "Exempt / Waiver":                0.06
};

const PAYER_WEIGHTS = {
  "SHA (Social Health Authority)": 0.25,
  "Private Insurance":             0.08,
  "NHIF (Legacy)":                 0.15,
  "Cash / Self-Pay":               0.40,
  "Employer Scheme":               0.06,
  "Exempt / Waiver":               0.06
};

const READMISSION_CAUSES = [
  "Same-condition exacerbation","Pneumonia / respiratory","Malaria / febrile illness",
  "Gastroenteritis / dehydration","Sepsis / infection","HIV-related opportunistic infection",
  "Medication non-adherence","Sickle cell crisis","Tuberculosis relapse","Post-surgical complication"
];
const CAUSE_WEIGHTS = [0.26,0.15,0.11,0.10,0.09,0.08,0.07,0.06,0.05,0.03];

const COMORBIDITIES = [
  "HIV","Diabetes","Hypertension","Anaemia","Malnutrition","Tuberculosis",
  "Sickle Cell","CKD","Asthma","Epilepsy","Rheumatic Heart Disease","Cancer"
];

const REGIONS = ["Nairobi Metro","Central Kenya","Rift Valley","Western Kenya","Nyanza","Coastal","Eastern","North Eastern"];

const CONDITIONS   = Object.keys(CONDITION_SPEC);
const CAMPUSES     = Object.keys(CAMPUS_SPEC);
const PAYERS       = Object.keys(PAYER_WEIGHTS);
const DISPOSITIONS = Object.keys(DISP_EFF);

const COHORT_SIZE  = 18000;   // Used only by fallback synthetic generator
const STUDY_MONTHS = 24;
const DAYS_PER_MONTH = 30.4;