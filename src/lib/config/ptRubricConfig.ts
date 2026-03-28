/**
 * Default PT evaluation rubric — criteria mapped to ptDisciplineConfig section/subsection IDs.
 *
 * Faculty can use this as-is or as a starting template for custom rubrics.
 * Criteria cover documentation completeness, clinical reasoning, and billing accuracy.
 */
import type { RubricCriterion, RubricTemplate } from '$lib/types/grading';

const ptEvalCriteria: RubricCriterion[] = [
  // ─── Subjective ─────────────────────────────────────────────────────────
  {
    id: 'pt-subj-cc',
    label: 'Chief Complaint',
    description: "Concise statement of the reason for visit in the patient's own words.",
    maxPoints: 3,
    sectionId: 'subjective',
    subsectionId: 'history',
    category: 'Documentation Completeness',
  },
  {
    id: 'pt-subj-hpi',
    label: 'History of Present Illness',
    description:
      'Thorough narrative including onset, mechanism, duration, progression, and prior treatment.',
    maxPoints: 5,
    sectionId: 'subjective',
    subsectionId: 'history',
    category: 'Documentation Completeness',
  },
  {
    id: 'pt-subj-func',
    label: 'Functional Limitations & Prior Level',
    description: 'Clear description of ADL/IADL limitations and baseline function.',
    maxPoints: 4,
    sectionId: 'subjective',
    subsectionId: 'history',
    category: 'Documentation Completeness',
  },
  {
    id: 'pt-subj-pain',
    label: 'Pain Assessment',
    description:
      'Location, intensity (0-10), quality, pattern, aggravating/easing factors documented.',
    maxPoints: 4,
    sectionId: 'subjective',
    subsectionId: 'pain-assessment',
    category: 'Documentation Completeness',
  },
  {
    id: 'pt-subj-redflags',
    label: 'Red Flag Screening',
    description: 'Appropriate red flag categories screened with clear documentation of findings.',
    maxPoints: 3,
    sectionId: 'subjective',
    subsectionId: 'red-flag-screening',
    category: 'Patient Safety',
  },
  {
    id: 'pt-subj-meds',
    label: 'Medication Review',
    description: 'Current medications documented with dose, frequency, and clinical relevance.',
    maxPoints: 2,
    sectionId: 'subjective',
    subsectionId: 'current-medications',
    category: 'Documentation Completeness',
  },

  // ─── Objective ──────────────────────────────────────────────────────────
  {
    id: 'pt-obj-vitals',
    label: 'Vital Signs',
    description: 'BP, HR, RR, SpO2, temp recorded. Height/weight/BMI when clinically relevant.',
    maxPoints: 3,
    sectionId: 'objective',
    subsectionId: 'vital-signs',
    category: 'Documentation Completeness',
  },
  {
    id: 'pt-obj-sysreview',
    label: 'Systems Review',
    description: 'All APTA systems addressed (add or defer) with rationale for impaired systems.',
    maxPoints: 4,
    sectionId: 'objective',
    subsectionId: 'systems-review',
    category: 'Clinical Reasoning',
  },
  {
    id: 'pt-obj-msk',
    label: 'Musculoskeletal Assessment',
    description:
      'ROM, PROM, MMT, special tests documented for relevant regions. Bilateral comparison when indicated.',
    maxPoints: 5,
    sectionId: 'objective',
    subsectionId: 'musculoskeletal',
    category: 'Clinical Reasoning',
  },
  {
    id: 'pt-obj-neuro',
    label: 'Neuromuscular Assessment',
    description:
      'Dermatome, myotome, reflex testing when indicated. Tone, coordination, balance documented.',
    maxPoints: 4,
    sectionId: 'objective',
    subsectionId: 'neuromuscular',
    category: 'Clinical Reasoning',
  },
  {
    id: 'pt-obj-std-assess',
    label: 'Standardized Assessment Tools',
    description: 'Appropriate standardized tests selected and scored (e.g., Berg, TUG, 6MWT).',
    maxPoints: 3,
    sectionId: 'objective',
    subsectionId: 'musculoskeletal',
    category: 'Evidence-Based Practice',
  },
  {
    id: 'pt-obj-treatment',
    label: 'Treatment Performed',
    description: 'Clear documentation of interventions performed during the session.',
    maxPoints: 3,
    sectionId: 'objective',
    subsectionId: 'treatment-performed',
    category: 'Documentation Completeness',
  },

  // ─── Assessment ─────────────────────────────────────────────────────────
  {
    id: 'pt-assess-icf',
    label: 'ICF Classification',
    description:
      'Body functions/structures, activity limitations, and participation restrictions identified using ICF framework.',
    maxPoints: 5,
    sectionId: 'assessment',
    subsectionId: 'icf-classification',
    category: 'Clinical Reasoning',
  },
  {
    id: 'pt-assess-dx',
    label: 'PT Diagnosis / Movement System Diagnosis',
    description: 'Clear, specific movement system diagnosis supported by examination findings.',
    maxPoints: 4,
    sectionId: 'assessment',
    subsectionId: 'pt-diagnosis',
    category: 'Clinical Reasoning',
  },
  {
    id: 'pt-assess-prognosis',
    label: 'Prognosis & Prognostic Factors',
    description: 'Realistic prognosis with supporting and limiting prognostic factors.',
    maxPoints: 3,
    sectionId: 'assessment',
    subsectionId: 'pt-diagnosis',
    category: 'Clinical Reasoning',
  },
  {
    id: 'pt-assess-reasoning',
    label: 'Clinical Reasoning Quality',
    description:
      'Logical synthesis connecting subjective/objective findings to assessment conclusions.',
    maxPoints: 5,
    sectionId: 'assessment',
    subsectionId: 'clinical-reasoning',
    category: 'Clinical Reasoning',
  },

  // ─── Plan ───────────────────────────────────────────────────────────────
  {
    id: 'pt-plan-goals',
    label: 'SMART Goal Quality',
    description:
      'Goals are Specific, Measurable, Achievable, Relevant, Time-bound. Appropriate ICF domains and timeframes.',
    maxPoints: 5,
    sectionId: 'plan',
    subsectionId: 'goal-setting',
    category: 'Plan of Care',
  },
  {
    id: 'pt-plan-interventions',
    label: 'Intervention Selection',
    description:
      'Interventions are appropriate for diagnosis, evidence-supported, with dosage parameters.',
    maxPoints: 4,
    sectionId: 'plan',
    subsectionId: 'in-clinic-treatment-plan',
    category: 'Plan of Care',
  },
  {
    id: 'pt-plan-hep',
    label: 'Home Exercise Program',
    description:
      "HEP exercises are relevant, include dosage, and are appropriate for patient's level.",
    maxPoints: 3,
    sectionId: 'plan',
    subsectionId: 'hep-plan',
    category: 'Plan of Care',
  },
  {
    id: 'pt-plan-freq',
    label: 'Frequency & Duration',
    description: 'Visit frequency and duration justified by diagnosis and prognosis.',
    maxPoints: 2,
    sectionId: 'plan',
    subsectionId: 'goal-setting',
    category: 'Plan of Care',
  },

  // ─── Billing ────────────────────────────────────────────────────────────
  {
    id: 'pt-bill-dx',
    label: 'ICD-10 Code Accuracy',
    description: 'Diagnosis codes are specific, accurate, and support medical necessity.',
    maxPoints: 3,
    sectionId: 'billing',
    subsectionId: 'diagnosis-codes',
    category: 'Billing & Compliance',
  },
  {
    id: 'pt-bill-cpt',
    label: 'CPT Code Selection',
    description:
      'CPT codes match services rendered. Units and time are accurate. Linked diagnosis is appropriate.',
    maxPoints: 3,
    sectionId: 'billing',
    subsectionId: 'cpt-codes',
    category: 'Billing & Compliance',
  },
];

const totalMaxScore = ptEvalCriteria.reduce((sum, c) => sum + c.maxPoints, 0);

export const ptEvalRubric: RubricTemplate = {
  id: 'pt-eval-default-v1',
  name: 'PT Initial Evaluation — Default Rubric',
  discipline: 'pt',
  encounterType: 'eval',
  criteria: ptEvalCriteria,
  maxScore: totalMaxScore,
  createdBy: 'system',
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** All built-in PT rubric templates. */
export const ptRubricTemplates: RubricTemplate[] = [ptEvalRubric];

/** Look up a PT rubric by encounter type. */
export function getPtRubric(encounterType: string): RubricTemplate | null {
  return ptRubricTemplates.find((r) => r.encounterType === encounterType) ?? null;
}
