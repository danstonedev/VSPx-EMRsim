// Nursing-specific billing code reference data — CPT and ICD-10
// Used by BillingSection when discipline === 'nursing'
//
// Code vintage: CY2025 CMS Physician Fee Schedule / ICD-10-CM FY2025
// Last reviewed: 2026-04-01
// Next review:   After CMS CY2026 PFS final rule (~Nov 2025) and ICD-10-CM FY2026 (~Oct 2025)
// Source:        AMA CPT codebook; CMS MPFS lookup; ANA billing references
// NOTE: This is an educational simulator — codes are representative, not claims-grade.

import type { CPTCode, ICD10Code } from './ptCodes';

// ─── Nursing CPT Codes ───

export const NURSING_CPT_CODES: CPTCode[] = [
  // ── E/M: Office/Outpatient Visits ──
  {
    value: '99211',
    label: '99211 — Office/Outpatient Visit Level 1',
    description:
      'Office or other outpatient visit; may not require physician presence. Minimal problem.',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99212',
    label: '99212 — Office/Outpatient Visit Level 2',
    description:
      'Office or other outpatient visit for straightforward medical decision making (10-19 min).',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99213',
    label: '99213 — Office/Outpatient Visit Level 3',
    description:
      'Office or other outpatient visit for low-complexity medical decision making (20-29 min).',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99214',
    label: '99214 — Office/Outpatient Visit Level 4',
    description:
      'Office or other outpatient visit for moderate-complexity medical decision making (30-39 min).',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99215',
    label: '99215 — Office/Outpatient Visit Level 5',
    description:
      'Office or other outpatient visit for high-complexity medical decision making (40-54 min).',
    timed: false,
    category: 'evaluation',
  },

  // ── E/M: Emergency Department Visits ──
  {
    value: '99281',
    label: '99281 — ED Visit Level 1',
    description:
      'Emergency department visit; self-limited or minor problem, straightforward decision making.',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99282',
    label: '99282 — ED Visit Level 2',
    description:
      'Emergency department visit; low to moderate severity, low-complexity decision making.',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99283',
    label: '99283 — ED Visit Level 3',
    description:
      'Emergency department visit; moderate severity, moderate-complexity decision making.',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99284',
    label: '99284 — ED Visit Level 4',
    description:
      'Emergency department visit; high severity, moderate-complexity decision making; urgent evaluation required.',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99285',
    label: '99285 — ED Visit Level 5',
    description:
      'Emergency department visit; high severity with significant threat to life or function; high-complexity decision making.',
    timed: false,
    category: 'evaluation',
  },

  // ── IV Hydration & Infusion ──
  {
    value: '96360',
    label: '96360 — IV Hydration, Initial 31 min–1 hr',
    description: 'Intravenous infusion, hydration; initial, 31 minutes to 1 hour.',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96361',
    label: '96361 — IV Hydration, Each Additional Hour',
    description:
      'Intravenous infusion, hydration; each additional hour (list separately in addition to primary procedure).',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96365',
    label: '96365 — IV Infusion, Therapeutic/Prophylactic/Diagnostic, Initial Up to 1 hr',
    description:
      'Intravenous infusion for therapy, prophylaxis, or diagnosis; initial, up to 1 hour.',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96366',
    label: '96366 — IV Infusion, Each Additional Hour',
    description:
      'Intravenous infusion for therapy, prophylaxis, or diagnosis; each additional hour (add-on).',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96367',
    label: '96367 — IV Infusion, Additional Sequential Infusion Up to 1 hr',
    description:
      'Intravenous infusion for therapy, prophylaxis, or diagnosis; additional sequential infusion of a new substance/drug, up to 1 hour (add-on).',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96368',
    label: '96368 — IV Infusion, Concurrent Infusion',
    description:
      'Intravenous infusion for therapy, prophylaxis, or diagnosis; concurrent infusion (add-on).',
    timed: true,
    category: 'therapeutic',
  },

  // ── Injections / Pushes ──
  {
    value: '96372',
    label: '96372 — Therapeutic, Prophylactic, or Diagnostic Injection (SC or IM)',
    description:
      'Therapeutic, prophylactic, or diagnostic injection; subcutaneous or intramuscular.',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '96374',
    label: '96374 — IV Push, Single or Initial Substance/Drug',
    description:
      'Therapeutic, prophylactic, or diagnostic injection; intravenous push, single or initial substance/drug.',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '96375',
    label: '96375 — IV Push, Each Additional Sequential',
    description:
      'Therapeutic, prophylactic, or diagnostic injection; each additional sequential intravenous push of a new substance/drug (add-on).',
    timed: false,
    category: 'therapeutic',
  },

  // ── Wound Care ──
  {
    value: '97597',
    label: '97597 — Debridement, Open Wound, First 20 sq cm',
    description:
      'Debridement (e.g., high pressure waterjet with/without suction, sharp selective debridement with scissors, scalpel and forceps), open wound, first 20 sq cm or less.',
    timed: true,
    category: 'wound',
  },
  {
    value: '97598',
    label: '97598 — Debridement, Open Wound, Each Additional 20 sq cm',
    description:
      'Debridement, open wound, each additional 20 sq cm or part thereof (add-on to 97597).',
    timed: true,
    category: 'wound',
  },
  {
    value: '97602',
    label: '97602 — Non-selective Wound Debridement',
    description:
      'Removal of devitalized tissue from wound(s), non-selective debridement, without anesthesia (e.g., wet-to-moist dressings, enzymatic, abrasion).',
    timed: false,
    category: 'wound',
  },
  {
    value: '97605',
    label: '97605 — Negative Pressure Wound Therapy ≤ 50 sq cm',
    description:
      'Negative pressure wound therapy (e.g., vacuum assisted drainage collection), including topical application(s), wound assessment, and instructions; per session, total wound(s) surface area ≤ 50 sq cm.',
    timed: false,
    category: 'wound',
  },
  {
    value: '97606',
    label: '97606 — Negative Pressure Wound Therapy > 50 sq cm',
    description:
      'Negative pressure wound therapy (e.g., vacuum assisted drainage collection), including topical application(s), wound assessment, and instructions; per session, total wound(s) surface area > 50 sq cm.',
    timed: false,
    category: 'wound',
  },

  // ── Care Management ──
  {
    value: '99490',
    label: '99490 — Chronic Care Management, 20 min/month',
    description:
      'Chronic care management services, at least 20 minutes of clinical staff time directed by a physician or other qualified health care professional, per calendar month.',
    timed: false,
    category: 'other',
  },
  {
    value: '99491',
    label: '99491 — Complex Chronic Care Management, 30 min/month',
    description:
      'Chronic care management services provided personally by a physician or other qualified health care professional, at least 30 minutes per calendar month.',
    timed: false,
    category: 'other',
  },
  {
    value: '99487',
    label: '99487 — Complex Chronic Care Management, 60 min/month',
    description:
      'Complex chronic care management services, at least 60 minutes of clinical staff time directed by a physician or other qualified health care professional, per calendar month.',
    timed: false,
    category: 'other',
  },
  {
    value: '99484',
    label: '99484 — Behavioral Health Integration Care Management',
    description:
      'Care management services for behavioral health conditions, at least 20 minutes of clinical staff time per calendar month.',
    timed: false,
    category: 'other',
  },

  // ── Skilled Nursing / Home Visit ──
  {
    value: '99500',
    label: '99500 — Home Visit for Certification/Recertification',
    description:
      'Home visit for certification and plan of care for patient receiving Medicare-covered home health agency services.',
    timed: false,
    category: 'evaluation',
  },
  {
    value: 'G0162',
    label: 'G0162 — Skilled Nursing Facility, Per Diem',
    description:
      'Skilled services by a registered nurse (RN) for management and evaluation of the plan of care; each 15 minutes.',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: 'G0163',
    label: 'G0163 — Skilled Nursing Facility, LPN/LVN',
    description:
      "Skilled services of a licensed practical nurse (LPN/LVN) for the observation and assessment of the patient's condition; each 15 minutes.",
    timed: true,
    category: 'therapeutic',
  },
  {
    value: 'G0164',
    label: 'G0164 — Skilled Nursing Facility, Training/Education',
    description:
      'Skilled services of a registered nurse (RN) for training and education of the patient or family; each 15 minutes.',
    timed: true,
    category: 'therapeutic',
  },

  // ── Patient Education ──
  {
    value: '98960',
    label: '98960 — Self-Management Education, Individual, 30 min',
    description:
      'Education and training for patient self-management by a qualified, nonphysician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; individual patient.',
    timed: false,
    category: 'other',
  },
  {
    value: '98961',
    label: '98961 — Self-Management Education, Group (2–4), 30 min',
    description:
      'Education and training for patient self-management by a qualified, nonphysician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; 2–4 patients.',
    timed: false,
    category: 'other',
  },
  {
    value: '98962',
    label: '98962 — Self-Management Education, Group (5–8), 30 min',
    description:
      'Education and training for patient self-management by a qualified, nonphysician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; 5–8 patients.',
    timed: false,
    category: 'other',
  },
];

// ─── Nursing ICD-10 Codes ───

export const NURSING_ICD10_CODES: ICD10Code[] = [
  // ── Wound / Skin ──
  {
    value: 'L89.90',
    label: 'L89.90 — Pressure ulcer of unspecified site, unstageable',
    description: 'Pressure ulcer of unspecified site, unstageable.',
  },
  {
    value: 'L89.010',
    label: 'L89.010 — Pressure ulcer of right elbow, unstageable',
    description: 'Pressure ulcer of right elbow, unstageable.',
  },
  {
    value: 'L89.130',
    label: 'L89.130 — Pressure ulcer of right lower back, stage 3',
    description: 'Pressure ulcer of right lower back, stage 3. Full thickness tissue loss.',
  },
  {
    value: 'L89.150',
    label: 'L89.150 — Pressure ulcer of sacral region, unstageable',
    description: 'Pressure ulcer of sacral region, unstageable.',
  },
  {
    value: 'L89.152',
    label: 'L89.152 — Pressure ulcer of sacral region, stage 2',
    description: 'Pressure ulcer of sacral region, stage 2. Partial thickness loss of dermis.',
  },
  {
    value: 'L89.153',
    label: 'L89.153 — Pressure ulcer of sacral region, stage 3',
    description: 'Pressure ulcer of sacral region, stage 3. Full thickness skin loss.',
  },
  {
    value: 'L89.154',
    label: 'L89.154 — Pressure ulcer of sacral region, stage 4',
    description:
      'Pressure ulcer of sacral region, stage 4. Full thickness skin loss with exposed bone, tendon, or muscle.',
  },
  {
    value: 'L97.519',
    label: 'L97.519 — Non-pressure chronic ulcer of other part of right foot, unspecified severity',
    description:
      'Non-pressure chronic ulcer of other part of right foot with unspecified severity.',
  },
  {
    value: 'L97.529',
    label: 'L97.529 — Non-pressure chronic ulcer of other part of left foot, unspecified severity',
    description: 'Non-pressure chronic ulcer of other part of left foot with unspecified severity.',
  },
  {
    value: 'L97.919',
    label:
      'L97.919 — Non-pressure chronic ulcer of unspecified part of unspecified lower leg, unspecified severity',
    description: 'Non-pressure chronic ulcer of unspecified part of unspecified lower leg.',
  },
  {
    value: 'T81.49XA',
    label: 'T81.49XA — Infection following a procedure, other surgical site, initial encounter',
    description: 'Infection following a procedure, other surgical site, initial encounter.',
  },
  {
    value: 'L03.116',
    label: 'L03.116 — Cellulitis of left lower limb',
    description: 'Cellulitis of left lower limb.',
  },
  {
    value: 'L03.115',
    label: 'L03.115 — Cellulitis of right lower limb',
    description: 'Cellulitis of right lower limb.',
  },
  {
    value: 'L08.9',
    label: 'L08.9 — Local infection of the skin and subcutaneous tissue, unspecified',
    description: 'Local infection of the skin and subcutaneous tissue, unspecified.',
  },

  // ── Cardiovascular ──
  {
    value: 'I10',
    label: 'I10 — Essential (primary) hypertension',
    description: 'Essential (primary) hypertension.',
  },
  {
    value: 'I50.9',
    label: 'I50.9 — Heart failure, unspecified',
    description: 'Heart failure, unspecified.',
  },
  {
    value: 'I50.22',
    label: 'I50.22 — Chronic systolic (congestive) heart failure',
    description: 'Chronic systolic (congestive) heart failure.',
  },
  {
    value: 'I48.91',
    label: 'I48.91 — Unspecified atrial fibrillation',
    description: 'Unspecified atrial fibrillation.',
  },
  {
    value: 'I25.10',
    label:
      'I25.10 — Atherosclerotic heart disease of native coronary artery without angina pectoris',
    description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris.',
  },
  {
    value: 'I63.9',
    label: 'I63.9 — Cerebral infarction, unspecified',
    description: 'Cerebral infarction, unspecified.',
  },

  // ── Diabetes ──
  {
    value: 'E11.9',
    label: 'E11.9 — Type 2 diabetes mellitus without complications',
    description: 'Type 2 diabetes mellitus without complications.',
  },
  {
    value: 'E11.65',
    label: 'E11.65 — Type 2 diabetes mellitus with hyperglycemia',
    description: 'Type 2 diabetes mellitus with hyperglycemia.',
  },
  {
    value: 'E11.22',
    label: 'E11.22 — Type 2 diabetes mellitus with diabetic chronic kidney disease',
    description: 'Type 2 diabetes mellitus with diabetic chronic kidney disease.',
  },
  {
    value: 'E10.9',
    label: 'E10.9 — Type 1 diabetes mellitus without complications',
    description: 'Type 1 diabetes mellitus without complications.',
  },
  {
    value: 'E10.65',
    label: 'E10.65 — Type 1 diabetes mellitus with hyperglycemia',
    description: 'Type 1 diabetes mellitus with hyperglycemia.',
  },

  // ── Respiratory ──
  {
    value: 'J18.9',
    label: 'J18.9 — Pneumonia, unspecified organism',
    description: 'Pneumonia, unspecified organism.',
  },
  {
    value: 'J44.1',
    label: 'J44.1 — Chronic obstructive pulmonary disease with acute exacerbation',
    description: 'Chronic obstructive pulmonary disease with (acute) exacerbation.',
  },
  {
    value: 'J44.9',
    label: 'J44.9 — Chronic obstructive pulmonary disease, unspecified',
    description: 'Chronic obstructive pulmonary disease, unspecified.',
  },
  {
    value: 'J96.00',
    label: 'J96.00 — Acute respiratory failure, unspecified whether with hypoxia or hypercapnia',
    description: 'Acute respiratory failure, unspecified whether with hypoxia or hypercapnia.',
  },
  {
    value: 'R06.02',
    label: 'R06.02 — Shortness of breath',
    description: 'Shortness of breath.',
  },

  // ── Pain / Symptoms ──
  {
    value: 'R50.9',
    label: 'R50.9 — Fever, unspecified',
    description: 'Fever, unspecified.',
  },
  {
    value: 'R51.9',
    label: 'R51.9 — Headache, unspecified',
    description: 'Headache, unspecified.',
  },
  {
    value: 'R00.0',
    label: 'R00.0 — Tachycardia, unspecified',
    description: 'Tachycardia, unspecified.',
  },
  {
    value: 'R00.1',
    label: 'R00.1 — Bradycardia, unspecified',
    description: 'Bradycardia, unspecified.',
  },
  {
    value: 'R42',
    label: 'R42 — Dizziness and giddiness',
    description: 'Dizziness and giddiness (vertigo NOS, lightheadedness).',
  },
  {
    value: 'G89.29',
    label: 'G89.29 — Other chronic pain',
    description: 'Other chronic pain.',
  },

  // ── Falls / Injury ──
  {
    value: 'W19.XXXA',
    label: 'W19.XXXA — Unspecified fall, initial encounter',
    description: 'Unspecified fall, initial encounter.',
  },
  {
    value: 'R29.6',
    label: 'R29.6 — Repeated falls',
    description: 'Repeated falls. Tendency to fall.',
  },
  {
    value: 'Z91.81',
    label: 'Z91.81 — History of falling',
    description: 'History of falling. At risk for falling.',
  },

  // ── Infections ──
  {
    value: 'A41.9',
    label: 'A41.9 — Sepsis, unspecified organism',
    description: 'Sepsis, unspecified organism.',
  },
  {
    value: 'B95.61',
    label: 'B95.61 — MRSA as the cause of diseases classified elsewhere',
    description:
      'Methicillin susceptible Staphylococcus aureus infection as the cause of diseases classified elsewhere.',
  },
  {
    value: 'B96.20',
    label: 'B96.20 — Unspecified Escherichia coli as the cause of diseases classified elsewhere',
    description:
      'Unspecified Escherichia coli (E. coli) as the cause of diseases classified elsewhere.',
  },
  {
    value: 'N39.0',
    label: 'N39.0 — Urinary tract infection, site not specified',
    description: 'Urinary tract infection, site not specified.',
  },

  // ── Mental Status ──
  {
    value: 'R41.82',
    label: 'R41.82 — Altered mental status, unspecified',
    description: 'Altered mental status, unspecified.',
  },
  {
    value: 'F05',
    label: 'F05 — Delirium due to known physiological condition',
    description: 'Delirium due to known physiological condition.',
  },
];

// ─── Search scoring for nursing CPT codes ───

export function scoreNursingCPT(item: CPTCode, query: string): number {
  const q = query.toLowerCase();
  const v = item.value.toLowerCase();
  const l = item.label.toLowerCase();
  const d = item.description.toLowerCase();
  if (v === q) return 100;
  if (v.startsWith(q)) return 90;
  if (l.startsWith(q)) return 80;
  if (l.includes(q)) return 60;
  if (d.includes(q)) return 40;
  return 0;
}

// ─── Search scoring for nursing ICD-10 codes ───

export function scoreNursingICD10(item: ICD10Code, query: string): number {
  const q = query.toLowerCase();
  const v = item.value.toLowerCase();
  const l = item.label.toLowerCase();
  const d = item.description.toLowerCase();
  if (v === q) return 100;
  if (v.startsWith(q)) return 90;
  if (l.startsWith(q)) return 80;
  if (l.includes(q)) return 60;
  if (d.includes(q)) return 40;
  return 0;
}
