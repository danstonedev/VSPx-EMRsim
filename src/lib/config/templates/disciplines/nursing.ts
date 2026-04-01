/**
 * Nursing note templates.
 *
 * Nursing uses SOAP format with emphasis on:
 *   - Systems review (cardiovascular, integumentary, neuro)
 *   - Vital signs (always required)
 *   - Patient education
 *   - Medication administration
 *
 * Hierarchy:
 *   nursing-base
 *   ├── nursing-inpatient-acute  → eval, daily, discharge
 *   ├── nursing-snf              → eval, progress, discharge
 *   ├── nursing-home-health      → soc, recert, discharge
 *   └── nursing-outpatient       → eval, follow-up
 */

import type { NoteTemplate } from '../templateTypes';
import {
  SUBJECTIVE_DEFAULTS,
  OBJECTIVE_DEFAULTS,
  ASSESSMENT_DEFAULTS,
  PLAN_DEFAULTS,
  BILLING_DEFAULTS,
} from '../shared/soapDefaults';

// ─── Nursing Base ──────────────────────────────────────────────────────────

export const nursingBase: NoteTemplate = {
  id: 'nursing-base',
  discipline: 'nursing',
  setting: null,
  visitType: null,
  label: 'Nursing Base',
  description: 'Base configuration for all nursing notes.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      ...SUBJECTIVE_DEFAULTS,
      subsections: {
        ...SUBJECTIVE_DEFAULTS.subsections,
        'current-medications': { visible: true, defaultOpen: true, required: true },
      },
    },
    objective: {
      ...OBJECTIVE_DEFAULTS,
      subsections: {
        ...OBJECTIVE_DEFAULTS.subsections,
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'cardiovascular-pulmonary': { visible: true, defaultOpen: true, required: true },
        integumentary: { visible: true, defaultOpen: true },
        'communication-cognition': { visible: true, defaultOpen: true },
        // Nursing doesn't focus on MSK systems testing
        musculoskeletal: { visible: false },
        neuromuscular: { visible: true, defaultOpen: false },
        'standardized-assessments': { visible: true, defaultOpen: false },
      },
    },
    assessment: ASSESSMENT_DEFAULTS,
    plan: {
      ...PLAN_DEFAULTS,
      subsections: {
        ...PLAN_DEFAULTS.subsections,
        'patient-education': { visible: true, required: true },
      },
    },
    billing: BILLING_DEFAULTS,
  },
  defaultAssessments: [],
  prominentInterventionCategories: [
    'medication-administration',
    'wound-care',
    'patient-education',
    'vital-signs-monitoring',
    'pain-management',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// INPATIENT ACUTE
// ═══════════════════════════════════════════════════════════════════════════

export const nursingInpatientAcute: NoteTemplate = {
  id: 'nursing-inpatient-acute',
  extends: 'nursing-base',
  discipline: 'nursing',
  setting: 'inpatient-acute',
  visitType: null,
  label: 'Nursing Inpatient Acute',
  description: 'Nursing in acute hospital — systems assessment, vitals, meds.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: 'every-shift', duration: 'ongoing' },
};

export const nursingInpatientAcuteEval: NoteTemplate = {
  id: 'nursing-inpatient-acute-eval',
  extends: 'nursing-inpatient-acute',
  discipline: 'nursing',
  setting: 'inpatient-acute',
  visitType: 'initial-eval',
  label: 'Nursing Inpatient Admission Assessment',
  description: 'Admission nursing assessment — comprehensive systems review.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        'red-flag-screening': { visible: true, defaultOpen: true, required: true },
        'current-medications': { visible: true, defaultOpen: true, required: true },
      },
    },
  },
};

export const nursingInpatientAcuteDaily: NoteTemplate = {
  id: 'nursing-inpatient-acute-daily',
  extends: 'nursing-inpatient-acute',
  discipline: 'nursing',
  setting: 'inpatient-acute',
  visitType: 'daily-note',
  label: 'Nursing Inpatient Shift Note',
  description: 'Shift assessment note — focused on changes from baseline.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
      },
    },
    assessment: {
      visible: true,
      subsections: {
        'primary-impairments': { visible: false },
        'icf-classification': { visible: false },
        'pt-diagnosis': { visible: false },
        prognosis: { visible: false },
      },
    },
    plan: {
      visible: true,
      subsections: {
        'visit-parameters': { visible: false },
        'goal-setting': { visible: false },
        'treatment-narrative': { visible: false },
      },
    },
  },
};

export const nursingInpatientAcuteDischarge: NoteTemplate = {
  id: 'nursing-inpatient-acute-discharge',
  extends: 'nursing-inpatient-acute',
  discipline: 'nursing',
  setting: 'inpatient-acute',
  visitType: 'discharge-summary',
  label: 'Nursing Inpatient Discharge',
  description: 'Discharge — patient education, med reconciliation, follow-up.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'treatment-performed': { visible: false },
      },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SNF
// ═══════════════════════════════════════════════════════════════════════════

export const nursingSnf: NoteTemplate = {
  id: 'nursing-snf',
  extends: 'nursing-base',
  discipline: 'nursing',
  setting: 'snf',
  visitType: null,
  label: 'Nursing Skilled Nursing Facility',
  description: 'Nursing in SNF — MDS-driven, ongoing skilled assessment.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: 'every-shift', duration: 'ongoing' },
  settingFlags: { requireMDS: true },
};

export const nursingSnfEval: NoteTemplate = {
  id: 'nursing-snf-eval',
  extends: 'nursing-snf',
  discipline: 'nursing',
  setting: 'snf',
  visitType: 'initial-eval',
  label: 'Nursing SNF Admission Assessment',
  description: 'SNF admission — comprehensive nursing assessment.',
  noteFormat: 'soap',
  sections: {},
};

export const nursingSnfProgress: NoteTemplate = {
  id: 'nursing-snf-progress',
  extends: 'nursing-snf',
  discipline: 'nursing',
  setting: 'snf',
  visitType: 'progress-note',
  label: 'Nursing SNF Progress Note',
  description: 'Weekly or interval progress note.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
      },
    },
    assessment: {
      visible: true,
      subsections: {
        'primary-impairments': { visible: false },
        'icf-classification': { visible: false },
        prognosis: { visible: false },
      },
    },
  },
};

export const nursingSnfDischarge: NoteTemplate = {
  id: 'nursing-snf-discharge',
  extends: 'nursing-snf',
  discipline: 'nursing',
  setting: 'snf',
  visitType: 'discharge-summary',
  label: 'Nursing SNF Discharge Summary',
  description: 'SNF discharge — outcomes and disposition.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: { 'treatment-performed': { visible: false } },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOME HEALTH
// ═══════════════════════════════════════════════════════════════════════════

export const nursingHomeHealth: NoteTemplate = {
  id: 'nursing-home-health',
  extends: 'nursing-base',
  discipline: 'nursing',
  setting: 'home-health',
  visitType: null,
  label: 'Nursing Home Health',
  description: 'Nursing in home health — OASIS-driven, wound care and med management.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '3x-week', duration: '8-weeks' },
  settingFlags: { requireOASIS: true },
};

export const nursingHomeHealthSoc: NoteTemplate = {
  id: 'nursing-home-health-soc',
  extends: 'nursing-home-health',
  discipline: 'nursing',
  setting: 'home-health',
  visitType: 'start-of-care',
  label: 'Nursing Home Health Start of Care',
  description: 'Start of care — comprehensive home assessment, OASIS.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        'red-flag-screening': { visible: true, defaultOpen: true, required: true },
        'current-medications': { visible: true, defaultOpen: true, required: true },
      },
    },
  },
};

export const nursingHomeHealthRecert: NoteTemplate = {
  id: 'nursing-home-health-recert',
  extends: 'nursing-home-health',
  discipline: 'nursing',
  setting: 'home-health',
  visitType: 'recertification',
  label: 'Nursing Home Health Recertification',
  description: 'Recertification — continued skilled need justification.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
      },
    },
    assessment: {
      visible: true,
      subsections: {
        'primary-impairments': { visible: false },
        'icf-classification': { visible: false },
      },
    },
  },
};

export const nursingHomeHealthDischarge: NoteTemplate = {
  id: 'nursing-home-health-discharge',
  extends: 'nursing-home-health',
  discipline: 'nursing',
  setting: 'home-health',
  visitType: 'discharge-summary',
  label: 'Nursing Home Health Discharge',
  description: 'Home health discharge — outcomes, med reconciliation, follow-up.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: { 'treatment-performed': { visible: false } },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPATIENT (clinic nursing)
// ═══════════════════════════════════════════════════════════════════════════

export const nursingOutpatient: NoteTemplate = {
  id: 'nursing-outpatient',
  extends: 'nursing-base',
  discipline: 'nursing',
  setting: 'outpatient',
  visitType: null,
  label: 'Nursing Outpatient',
  description: 'Outpatient/clinic nursing documentation.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: 'as-needed', duration: 'per-visit' },
};

export const nursingOutpatientEval: NoteTemplate = {
  id: 'nursing-outpatient-eval',
  extends: 'nursing-outpatient',
  discipline: 'nursing',
  setting: 'outpatient',
  visitType: 'initial-eval',
  label: 'Nursing Outpatient Assessment',
  description: 'Clinic nursing initial assessment.',
  noteFormat: 'soap',
  sections: {},
};

export const nursingOutpatientFollowUp: NoteTemplate = {
  id: 'nursing-outpatient-follow-up',
  extends: 'nursing-outpatient',
  discipline: 'nursing',
  setting: 'outpatient',
  visitType: 'follow-up',
  label: 'Nursing Outpatient Follow-Up',
  description: 'Clinic follow-up visit note.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
      },
    },
    assessment: {
      visible: true,
      subsections: {
        'primary-impairments': { visible: false },
        'icf-classification': { visible: false },
        prognosis: { visible: false },
      },
    },
  },
};

// ─── Export all Nursing templates ──────────────────────────────────────────

export const NURSING_TEMPLATES: NoteTemplate[] = [
  nursingBase,
  // Inpatient Acute
  nursingInpatientAcute,
  nursingInpatientAcuteEval,
  nursingInpatientAcuteDaily,
  nursingInpatientAcuteDischarge,
  // SNF
  nursingSnf,
  nursingSnfEval,
  nursingSnfProgress,
  nursingSnfDischarge,
  // Home Health
  nursingHomeHealth,
  nursingHomeHealthSoc,
  nursingHomeHealthRecert,
  nursingHomeHealthDischarge,
  // Outpatient
  nursingOutpatient,
  nursingOutpatientEval,
  nursingOutpatientFollowUp,
];
