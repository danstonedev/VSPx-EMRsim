/**
 * Dietetics note templates.
 *
 * Dietetics uses the ADIME format (Assessment, Diagnosis, Intervention, Monitoring/Evaluation)
 * rather than SOAP. The template system still controls section visibility and defaults,
 * but the editor renders ADIME components when noteFormat === 'adime'.
 *
 * Hierarchy:
 *   dietetics-base
 *   ├── dietetics-inpatient-acute  → eval, daily, discharge
 *   ├── dietetics-outpatient       → eval, follow-up
 *   ├── dietetics-snf              → eval, progress, discharge
 *   └── dietetics-home-health      → soc, recert, discharge
 */

import type { NoteTemplate } from '../templateTypes';

// ─── ADIME Section Defaults ────────────────────────────────────────────────

const NUTRITION_ASSESSMENT_DEFAULTS = {
  visible: true,
  subsections: {
    'anthropometric-data': { visible: true, defaultOpen: true, required: true },
    'biochemical-data': { visible: true, defaultOpen: true },
    'clinical-findings': { visible: true, defaultOpen: true, required: true },
    'dietary-history': { visible: true, defaultOpen: true, required: true },
    'functional-status': { visible: true, defaultOpen: false },
  },
};

const NUTRITION_DIAGNOSIS_DEFAULTS = {
  visible: true,
  subsections: {
    'pes-statements': { visible: true, defaultOpen: true, required: true },
    'nutrition-diagnoses': { visible: true, defaultOpen: true },
  },
};

const NUTRITION_INTERVENTION_DEFAULTS = {
  visible: true,
  subsections: {
    'food-nutrient-delivery': { visible: true, defaultOpen: true },
    'nutrition-education': { visible: true, defaultOpen: true, required: true },
    'nutrition-counseling': { visible: true, defaultOpen: false },
    'coordination-of-care': { visible: true, defaultOpen: false },
  },
};

const NUTRITION_MONITORING_DEFAULTS = {
  visible: true,
  subsections: {
    'monitoring-indicators': { visible: true, defaultOpen: true, required: true },
    'evaluation-criteria': { visible: true, defaultOpen: true },
    'follow-up-plan': { visible: true, defaultOpen: true },
  },
};

const DIETETICS_BILLING_DEFAULTS = {
  visible: true,
  subsections: {
    'diagnosis-codes': { visible: true, required: true },
    'cpt-codes': { visible: true, required: true },
    'orders-referrals': { visible: true },
  },
};

// ─── Dietetics Base ────────────────────────────────────────────────────────

export const dieteticsBase: NoteTemplate = {
  id: 'dietetics-base',
  discipline: 'dietetics',
  setting: null,
  visitType: null,
  label: 'Dietetics Base',
  description: 'Base configuration for all dietetics notes.',
  noteFormat: 'adime',
  sections: {
    'nutrition-assessment': NUTRITION_ASSESSMENT_DEFAULTS,
    'nutrition-diagnosis': NUTRITION_DIAGNOSIS_DEFAULTS,
    'nutrition-intervention': NUTRITION_INTERVENTION_DEFAULTS,
    'nutrition-monitoring': NUTRITION_MONITORING_DEFAULTS,
    billing: DIETETICS_BILLING_DEFAULTS,
  },
  defaultAssessments: [],
  prominentInterventionCategories: [
    'medical-nutrition-therapy',
    'enteral-nutrition',
    'parenteral-nutrition',
    'nutrition-education',
    'diet-modification',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// INPATIENT ACUTE
// ═══════════════════════════════════════════════════════════════════════════

export const dieteticsInpatientAcute: NoteTemplate = {
  id: 'dietetics-inpatient-acute',
  extends: 'dietetics-base',
  discipline: 'dietetics',
  setting: 'inpatient-acute',
  visitType: null,
  label: 'Dietetics Inpatient Acute',
  description: 'Dietetics in acute hospital — malnutrition screening, tube feeds, TPN.',
  noteFormat: 'adime',
  sections: {},
  defaultVisitParams: { frequency: 'daily', duration: 'ongoing' },
};

export const dieteticsInpatientAcuteEval: NoteTemplate = {
  id: 'dietetics-inpatient-acute-eval',
  extends: 'dietetics-inpatient-acute',
  discipline: 'dietetics',
  setting: 'inpatient-acute',
  visitType: 'initial-eval',
  label: 'Dietetics Inpatient Initial Assessment',
  description: 'Comprehensive inpatient nutrition assessment.',
  noteFormat: 'adime',
  sections: {},
};

export const dieteticsInpatientAcuteDaily: NoteTemplate = {
  id: 'dietetics-inpatient-acute-daily',
  extends: 'dietetics-inpatient-acute',
  discipline: 'dietetics',
  setting: 'inpatient-acute',
  visitType: 'daily-note',
  label: 'Dietetics Inpatient Follow-Up',
  description: 'Daily follow-up — intake, tolerance, lab trends.',
  noteFormat: 'adime',
  sections: {
    'nutrition-assessment': {
      visible: true,
      subsections: {
        'functional-status': { visible: false },
      },
    },
    'nutrition-diagnosis': {
      visible: true,
      subsections: {
        'nutrition-diagnoses': { visible: false },
      },
    },
  },
};

export const dieteticsInpatientAcuteDischarge: NoteTemplate = {
  id: 'dietetics-inpatient-acute-discharge',
  extends: 'dietetics-inpatient-acute',
  discipline: 'dietetics',
  setting: 'inpatient-acute',
  visitType: 'discharge-summary',
  label: 'Dietetics Inpatient Discharge',
  description: 'Discharge — diet at discharge, education, outpatient follow-up.',
  noteFormat: 'adime',
  sections: {
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPATIENT
// ═══════════════════════════════════════════════════════════════════════════

export const dieteticsOutpatient: NoteTemplate = {
  id: 'dietetics-outpatient',
  extends: 'dietetics-base',
  discipline: 'dietetics',
  setting: 'outpatient',
  visitType: null,
  label: 'Dietetics Outpatient',
  description: 'Outpatient medical nutrition therapy.',
  noteFormat: 'adime',
  sections: {},
  defaultVisitParams: { frequency: 'weekly', duration: '6-weeks' },
};

export const dieteticsOutpatientEval: NoteTemplate = {
  id: 'dietetics-outpatient-eval',
  extends: 'dietetics-outpatient',
  discipline: 'dietetics',
  setting: 'outpatient',
  visitType: 'initial-eval',
  label: 'Dietetics Outpatient Initial Assessment',
  description: 'Comprehensive outpatient nutrition assessment and MNT plan.',
  noteFormat: 'adime',
  sections: {},
};

export const dieteticsOutpatientFollowUp: NoteTemplate = {
  id: 'dietetics-outpatient-follow-up',
  extends: 'dietetics-outpatient',
  discipline: 'dietetics',
  setting: 'outpatient',
  visitType: 'follow-up',
  label: 'Dietetics Outpatient Follow-Up',
  description: 'Follow-up — dietary adherence, weight trends, goal progress.',
  noteFormat: 'adime',
  sections: {
    'nutrition-assessment': {
      visible: true,
      subsections: {
        'functional-status': { visible: false },
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SNF
// ═══════════════════════════════════════════════════════════════════════════

export const dieteticsSnf: NoteTemplate = {
  id: 'dietetics-snf',
  extends: 'dietetics-base',
  discipline: 'dietetics',
  setting: 'snf',
  visitType: null,
  label: 'Dietetics Skilled Nursing Facility',
  description: 'Dietetics in SNF — MDS-driven, malnutrition and weight management.',
  noteFormat: 'adime',
  sections: {},
  defaultVisitParams: { frequency: 'weekly', duration: 'ongoing' },
  settingFlags: { requireMDS: true },
};

export const dieteticsSnfEval: NoteTemplate = {
  id: 'dietetics-snf-eval',
  extends: 'dietetics-snf',
  discipline: 'dietetics',
  setting: 'snf',
  visitType: 'initial-eval',
  label: 'Dietetics SNF Initial Assessment',
  description: 'SNF admission nutrition assessment.',
  noteFormat: 'adime',
  sections: {},
};

export const dieteticsSnfProgress: NoteTemplate = {
  id: 'dietetics-snf-progress',
  extends: 'dietetics-snf',
  discipline: 'dietetics',
  setting: 'snf',
  visitType: 'progress-note',
  label: 'Dietetics SNF Progress Note',
  description: 'Weekly/interval progress note.',
  noteFormat: 'adime',
  sections: {
    'nutrition-assessment': {
      visible: true,
      subsections: {
        'functional-status': { visible: false },
      },
    },
  },
};

export const dieteticsSnfDischarge: NoteTemplate = {
  id: 'dietetics-snf-discharge',
  extends: 'dietetics-snf',
  discipline: 'dietetics',
  setting: 'snf',
  visitType: 'discharge-summary',
  label: 'Dietetics SNF Discharge Summary',
  description: 'SNF discharge — diet at discharge, follow-up plan.',
  noteFormat: 'adime',
  sections: {
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOME HEALTH
// ═══════════════════════════════════════════════════════════════════════════

export const dieteticsHomeHealth: NoteTemplate = {
  id: 'dietetics-home-health',
  extends: 'dietetics-base',
  discipline: 'dietetics',
  setting: 'home-health',
  visitType: null,
  label: 'Dietetics Home Health',
  description: 'Dietetics in home health — OASIS-driven, home nutrition support.',
  noteFormat: 'adime',
  sections: {},
  defaultVisitParams: { frequency: '1x-week', duration: '8-weeks' },
  settingFlags: { requireOASIS: true },
};

export const dieteticsHomeHealthSoc: NoteTemplate = {
  id: 'dietetics-home-health-soc',
  extends: 'dietetics-home-health',
  discipline: 'dietetics',
  setting: 'home-health',
  visitType: 'start-of-care',
  label: 'Dietetics Home Health Start of Care',
  description: 'Start of care — comprehensive home nutrition assessment.',
  noteFormat: 'adime',
  sections: {},
};

export const dieteticsHomeHealthRecert: NoteTemplate = {
  id: 'dietetics-home-health-recert',
  extends: 'dietetics-home-health',
  discipline: 'dietetics',
  setting: 'home-health',
  visitType: 'recertification',
  label: 'Dietetics Home Health Recertification',
  description: 'Recertification — continued skilled need justification.',
  noteFormat: 'adime',
  sections: {},
};

export const dieteticsHomeHealthDischarge: NoteTemplate = {
  id: 'dietetics-home-health-discharge',
  extends: 'dietetics-home-health',
  discipline: 'dietetics',
  setting: 'home-health',
  visitType: 'discharge-summary',
  label: 'Dietetics Home Health Discharge',
  description: 'Home health discharge — diet status, education, follow-up.',
  noteFormat: 'adime',
  sections: {
    billing: { visible: false },
  },
};

// ─── Export all Dietetics templates ───────────────────────────────────────

export const DIETETICS_TEMPLATES: NoteTemplate[] = [
  dieteticsBase,
  // Inpatient Acute
  dieteticsInpatientAcute,
  dieteticsInpatientAcuteEval,
  dieteticsInpatientAcuteDaily,
  dieteticsInpatientAcuteDischarge,
  // Outpatient
  dieteticsOutpatient,
  dieteticsOutpatientEval,
  dieteticsOutpatientFollowUp,
  // SNF
  dieteticsSnf,
  dieteticsSnfEval,
  dieteticsSnfProgress,
  dieteticsSnfDischarge,
  // Home Health
  dieteticsHomeHealth,
  dieteticsHomeHealthSoc,
  dieteticsHomeHealthRecert,
  dieteticsHomeHealthDischarge,
];
