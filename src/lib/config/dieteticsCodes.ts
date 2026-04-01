// Dietetics/Nutrition-specific billing codes — CPT and ICD-10
// Used by BillingSection when discipline === 'dietetics'
//
// Code vintage: CY2025 CMS Physician Fee Schedule / ICD-10-CM FY2025
// Last reviewed: 2026-04-01
// Next review:   After CMS CY2026 PFS final rule (~Nov 2025) and ICD-10-CM FY2026 (~Oct 2025)
// Source:        AMA CPT codebook; Academy of Nutrition and Dietetics MNT billing guides
// NOTE: This is an educational simulator — codes are representative, not claims-grade.

import type { CPTCode, ICD10Code } from './ptCodes';

// ─── Dietetics CPT Codes ───

export const DIETETICS_CPT_CODES: CPTCode[] = [
  // Medical Nutrition Therapy (MNT)
  {
    value: '97802',
    label: '97802 — MNT Initial Assessment, Individual',
    description:
      'Medical nutrition therapy; initial assessment and intervention, individual, face-to-face with the patient, each 15 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97803',
    label: '97803 — MNT Reassessment, Individual',
    description:
      'Medical nutrition therapy; reassessment and intervention, individual, face-to-face with the patient, each 15 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '97804',
    label: '97804 — MNT Group',
    description: 'Medical nutrition therapy; group (2 or more individuals), each 30 minutes',
    timed: true,
    category: 'therapeutic',
  },

  // Evaluation & Management (E/M) — Office/Outpatient Visits
  {
    value: '99211',
    label: '99211 — Office Visit, Level 1',
    description:
      'Office or other outpatient visit; may not require the presence of a physician or other qualified health care professional',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99212',
    label: '99212 — Office Visit, Level 2',
    description: 'Office or other outpatient visit; straightforward medical decision making',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99213',
    label: '99213 — Office Visit, Level 3',
    description: 'Office or other outpatient visit; low level of medical decision making',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99214',
    label: '99214 — Office Visit, Level 4',
    description: 'Office or other outpatient visit; moderate level of medical decision making',
    timed: false,
    category: 'evaluation',
  },
  {
    value: '99215',
    label: '99215 — Office Visit, Level 5',
    description: 'Office or other outpatient visit; high level of medical decision making',
    timed: false,
    category: 'evaluation',
  },

  // Education & Training — Self-Management
  {
    value: '98960',
    label: '98960 — Self-Management Education, Individual',
    description:
      'Education and training for patient self-management by a qualified, nonphysician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; individual patient',
    timed: true,
    category: 'other',
  },
  {
    value: '98961',
    label: '98961 — Self-Management Education, Group 2–4',
    description:
      'Education and training for patient self-management by a qualified, nonphysician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; 2–4 patients',
    timed: true,
    category: 'other',
  },
  {
    value: '98962',
    label: '98962 — Self-Management Education, Group 5–8',
    description:
      'Education and training for patient self-management by a qualified, nonphysician health care professional using a standardized curriculum, face-to-face with the patient, each 30 minutes; 5–8 patients',
    timed: true,
    category: 'other',
  },

  // Health Behavior Assessment & Intervention
  {
    value: '96156',
    label: '96156 — Health Behavior Assessment',
    description:
      'Health behavior assessment, or reassessment (ie, health-focused clinical interview, behavioral observations, clinical decision making)',
    timed: false,
    category: 'therapeutic',
  },
  {
    value: '96158',
    label: '96158 — Health Behavior Intervention, Individual, Initial 30 min',
    description: 'Health behavior intervention, individual, face-to-face; initial 30 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96159',
    label: '96159 — Health Behavior Intervention, Individual, Each Addl 15 min',
    description:
      'Health behavior intervention, individual, face-to-face; each additional 15 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96164',
    label: '96164 — Health Behavior Intervention, Group, Initial 30 min',
    description:
      'Health behavior intervention, group (2 or more patients), face-to-face; initial 30 minutes',
    timed: true,
    category: 'therapeutic',
  },
  {
    value: '96165',
    label: '96165 — Health Behavior Intervention, Group, Each Addl 15 min',
    description:
      'Health behavior intervention, group (2 or more patients), face-to-face; each additional 15 minutes',
    timed: true,
    category: 'therapeutic',
  },

  // Diabetes Self-Management Training (DSMT)
  {
    value: 'G0108',
    label: 'G0108 — DSMT, Individual',
    description:
      'Diabetes outpatient self-management training services, individual, per 30 minutes',
    timed: true,
    category: 'other',
  },
  {
    value: 'G0109',
    label: 'G0109 — DSMT, Group',
    description:
      'Diabetes outpatient self-management training services, group session (2 or more), per 30 minutes',
    timed: true,
    category: 'other',
  },
];

// ─── Dietetics ICD-10 Codes ───

export const DIETETICS_ICD10_CODES: ICD10Code[] = [
  // Diabetes Mellitus — Type 2
  {
    value: 'E11.9',
    label: 'E11.9 — Type 2 diabetes mellitus without complications',
    description: 'Type 2 diabetes mellitus without complications',
  },
  {
    value: 'E11.65',
    label: 'E11.65 — Type 2 diabetes mellitus with hyperglycemia',
    description: 'Type 2 diabetes mellitus with hyperglycemia',
  },
  {
    value: 'E11.21',
    label: 'E11.21 — Type 2 diabetes mellitus with diabetic nephropathy',
    description: 'Type 2 diabetes mellitus with diabetic nephropathy',
  },
  {
    value: 'E11.40',
    label: 'E11.40 — Type 2 diabetes mellitus with diabetic neuropathy, unspecified',
    description: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified',
  },
  {
    value: 'E11.22',
    label: 'E11.22 — Type 2 diabetes mellitus with diabetic chronic kidney disease',
    description: 'Type 2 diabetes mellitus with diabetic chronic kidney disease',
  },
  {
    value: 'E11.69',
    label: 'E11.69 — Type 2 diabetes mellitus with other specified complication',
    description: 'Type 2 diabetes mellitus with other specified complication',
  },

  // Diabetes Mellitus — Type 1
  {
    value: 'E10.9',
    label: 'E10.9 — Type 1 diabetes mellitus without complications',
    description: 'Type 1 diabetes mellitus without complications',
  },
  {
    value: 'E10.65',
    label: 'E10.65 — Type 1 diabetes mellitus with hyperglycemia',
    description: 'Type 1 diabetes mellitus with hyperglycemia',
  },

  // Diabetes Mellitus — Other
  {
    value: 'E13.9',
    label: 'E13.9 — Other specified diabetes mellitus without complications',
    description: 'Other specified diabetes mellitus without complications',
  },

  // Obesity & Overweight
  {
    value: 'E66.01',
    label: 'E66.01 — Morbid (severe) obesity due to excess calories',
    description: 'Morbid (severe) obesity due to excess calories',
  },
  {
    value: 'E66.09',
    label: 'E66.09 — Other obesity due to excess calories',
    description: 'Other obesity due to excess calories',
  },
  {
    value: 'E66.1',
    label: 'E66.1 — Drug-induced obesity',
    description: 'Drug-induced obesity',
  },
  {
    value: 'E66.3',
    label: 'E66.3 — Overweight',
    description: 'Overweight',
  },
  {
    value: 'E66.9',
    label: 'E66.9 — Obesity, unspecified',
    description: 'Obesity, unspecified',
  },
  {
    value: 'Z68.30',
    label: 'Z68.30 — BMI 30.0–30.9, adult',
    description: 'Body mass index (BMI) 30.0–30.9, adult',
  },
  {
    value: 'Z68.35',
    label: 'Z68.35 — BMI 35.0–35.9, adult',
    description: 'Body mass index (BMI) 35.0–35.9, adult',
  },
  {
    value: 'Z68.40',
    label: 'Z68.40 — BMI 40.0–44.9, adult',
    description: 'Body mass index (BMI) 40.0–44.9, adult',
  },
  {
    value: 'Z68.45',
    label: 'Z68.45 — BMI 45.0–49.9, adult',
    description: 'Body mass index (BMI) 45.0–49.9, adult',
  },

  // Malnutrition
  {
    value: 'E43',
    label: 'E43 — Unspecified severe protein-calorie malnutrition',
    description: 'Unspecified severe protein-calorie malnutrition',
  },
  {
    value: 'E44.0',
    label: 'E44.0 — Moderate protein-calorie malnutrition',
    description: 'Moderate protein-calorie malnutrition',
  },
  {
    value: 'E44.1',
    label: 'E44.1 — Mild protein-calorie malnutrition',
    description: 'Mild protein-calorie malnutrition',
  },
  {
    value: 'E46',
    label: 'E46 — Unspecified protein-calorie malnutrition',
    description: 'Unspecified protein-calorie malnutrition',
  },
  {
    value: 'T73.0XXA',
    label: 'T73.0XXA — Starvation, initial encounter',
    description: 'Effects of hunger; starvation, initial encounter',
  },

  // Lipid Disorders
  {
    value: 'E78.00',
    label: 'E78.00 — Pure hypercholesterolemia, unspecified',
    description: 'Pure hypercholesterolemia, unspecified',
  },
  {
    value: 'E78.1',
    label: 'E78.1 — Pure hypertriglyceridemia',
    description: 'Pure hypertriglyceridemia',
  },
  {
    value: 'E78.2',
    label: 'E78.2 — Mixed hyperlipidemia',
    description: 'Mixed hyperlipidemia',
  },
  {
    value: 'E78.5',
    label: 'E78.5 — Hyperlipidemia, unspecified',
    description: 'Hyperlipidemia, unspecified',
  },

  // Chronic Kidney Disease
  {
    value: 'N18.1',
    label: 'N18.1 — Chronic kidney disease, stage 1',
    description: 'Chronic kidney disease, stage 1',
  },
  {
    value: 'N18.2',
    label: 'N18.2 — Chronic kidney disease, stage 2 (mild)',
    description: 'Chronic kidney disease, stage 2 (mild)',
  },
  {
    value: 'N18.3',
    label: 'N18.3 — Chronic kidney disease, stage 3 (moderate)',
    description: 'Chronic kidney disease, stage 3 unspecified',
  },
  {
    value: 'N18.4',
    label: 'N18.4 — Chronic kidney disease, stage 4 (severe)',
    description: 'Chronic kidney disease, stage 4 (severe)',
  },
  {
    value: 'N18.5',
    label: 'N18.5 — Chronic kidney disease, stage 5',
    description: 'Chronic kidney disease, stage 5',
  },
  {
    value: 'N18.6',
    label: 'N18.6 — End stage renal disease (ESRD)',
    description: 'End stage renal disease',
  },

  // Electrolyte Imbalances
  {
    value: 'E87.6',
    label: 'E87.6 — Hypokalemia',
    description: 'Hypokalemia',
  },
  {
    value: 'E87.5',
    label: 'E87.5 — Hyperkalemia',
    description: 'Hyperkalemia',
  },

  // GI Conditions
  {
    value: 'K21.0',
    label: 'K21.0 — GERD with esophagitis',
    description: 'Gastro-esophageal reflux disease with esophagitis',
  },
  {
    value: 'K58.9',
    label: 'K58.9 — Irritable bowel syndrome without diarrhea',
    description: 'Irritable bowel syndrome without diarrhea',
  },
  {
    value: 'K50.90',
    label: "K50.90 — Crohn's disease, unspecified, without complications",
    description: "Crohn's disease, unspecified, without complications",
  },
  {
    value: 'K51.90',
    label: 'K51.90 — Ulcerative colitis, unspecified, without complications',
    description: 'Ulcerative colitis, unspecified, without complications',
  },
  {
    value: 'K90.0',
    label: 'K90.0 — Celiac disease',
    description: 'Celiac disease',
  },

  // Cardiovascular
  {
    value: 'I10',
    label: 'I10 — Essential (primary) hypertension',
    description: 'Essential (primary) hypertension',
  },
  {
    value: 'I25.10',
    label: 'I25.10 — Atherosclerotic heart disease of native coronary artery',
    description: 'Atherosclerotic heart disease of native coronary artery without angina pectoris',
  },
  {
    value: 'I50.9',
    label: 'I50.9 — Heart failure, unspecified',
    description: 'Heart failure, unspecified',
  },

  // Eating Disorders
  {
    value: 'F50.00',
    label: 'F50.00 — Anorexia nervosa, unspecified',
    description: 'Anorexia nervosa, unspecified',
  },
  {
    value: 'F50.01',
    label: 'F50.01 — Anorexia nervosa, restricting type',
    description: 'Anorexia nervosa, restricting type',
  },
  {
    value: 'F50.02',
    label: 'F50.02 — Anorexia nervosa, binge eating/purging type',
    description: 'Anorexia nervosa, binge eating/purging type',
  },
  {
    value: 'F50.2',
    label: 'F50.2 — Bulimia nervosa',
    description: 'Bulimia nervosa',
  },
  {
    value: 'F50.81',
    label: 'F50.81 — Binge eating disorder',
    description: 'Binge eating disorder',
  },
  {
    value: 'F50.89',
    label: 'F50.89 — Other specified eating disorder',
    description: 'Other specified eating disorder',
  },

  // Nutritional Deficiencies
  {
    value: 'E55.9',
    label: 'E55.9 — Vitamin D deficiency, unspecified',
    description: 'Vitamin D deficiency, unspecified',
  },
  {
    value: 'E53.8',
    label: 'E53.8 — Deficiency of other specified B group vitamins',
    description: 'Deficiency of other specified B group vitamins (includes B12 deficiency)',
  },
  {
    value: 'E61.1',
    label: 'E61.1 — Iron deficiency',
    description: 'Iron deficiency',
  },
  {
    value: 'D50.9',
    label: 'D50.9 — Iron deficiency anemia, unspecified',
    description: 'Iron deficiency anemia, unspecified',
  },

  // Counseling & Surveillance
  {
    value: 'Z71.3',
    label: 'Z71.3 — Dietary counseling and surveillance',
    description: 'Dietary counseling and surveillance',
  },
  {
    value: 'Z71.89',
    label: 'Z71.89 — Other specified counseling',
    description: 'Other specified counseling',
  },
];

// ─── Search scoring for dietetics codes ───

export function scoreDieteticsCPT(item: CPTCode, query: string): number {
  const q = query.toLowerCase();
  const v = item.value.toLowerCase();
  const l = item.label.toLowerCase();
  const d = item.description.toLowerCase();
  if (v === q) return 100;
  if (v.startsWith(q)) return 90;
  // Boost MNT codes for common dietetics search terms
  if (q === 'mnt' && (v === '97802' || v === '97803' || v === '97804')) return 85;
  if (l.startsWith(q)) return 80;
  if (l.includes(q)) return 60;
  if (d.includes(q)) return 40;
  return 0;
}

export function scoreDieteticsICD10(item: ICD10Code, query: string): number {
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
