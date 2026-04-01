/**
 * PT (Physical Therapy) note templates.
 *
 * Hierarchy:
 *   pt-base
 *   ├── pt-outpatient       → pt-outpatient-initial-eval, pt-outpatient-follow-up, pt-outpatient-discharge
 *   ├── pt-inpatient-acute  → pt-inpatient-acute-eval, pt-inpatient-acute-daily, pt-inpatient-acute-discharge
 *   ├── pt-inpatient-rehab  → pt-inpatient-rehab-eval, pt-inpatient-rehab-daily, pt-inpatient-rehab-discharge, pt-inpatient-rehab-conference
 *   ├── pt-snf              → pt-snf-eval, pt-snf-progress, pt-snf-discharge
 *   └── pt-home-health      → pt-home-health-soc, pt-home-health-recert, pt-home-health-discharge
 */

import type { NoteTemplate } from '../templateTypes';
import {
  SUBJECTIVE_DEFAULTS,
  OBJECTIVE_DEFAULTS,
  ASSESSMENT_DEFAULTS,
  PLAN_DEFAULTS,
  BILLING_DEFAULTS,
} from '../shared/soapDefaults';

// ─── PT Base ────────────────────────────────────────────────────────────────

export const ptBase: NoteTemplate = {
  id: 'pt-base',
  discipline: 'pt',
  setting: null,
  visitType: null,
  label: 'PT Base',
  description: 'Base configuration for all PT notes.',
  noteFormat: 'soap',
  sections: {
    subjective: SUBJECTIVE_DEFAULTS,
    objective: OBJECTIVE_DEFAULTS,
    assessment: ASSESSMENT_DEFAULTS,
    plan: PLAN_DEFAULTS,
    billing: BILLING_DEFAULTS,
  },
  defaultAssessments: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPATIENT
// ═══════════════════════════════════════════════════════════════════════════

export const ptOutpatient: NoteTemplate = {
  id: 'pt-outpatient',
  extends: 'pt-base',
  discipline: 'pt',
  setting: 'outpatient',
  visitType: null,
  label: 'PT Outpatient',
  description: 'Base for PT outpatient documentation.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '2x-week', duration: '8-weeks' },
  defaultAssessments: [
    { instrumentKey: 'oswestry-disability-index' },
    { instrumentKey: 'lower-extremity-functional-scale' },
    { instrumentKey: 'neck-disability-index' },
  ],
};

export const ptOutpatientEval: NoteTemplate = {
  id: 'pt-outpatient-initial-eval',
  extends: 'pt-outpatient',
  discipline: 'pt',
  setting: 'outpatient',
  visitType: 'initial-eval',
  label: 'PT Outpatient Initial Evaluation',
  description: 'Comprehensive initial evaluation — all sections expanded.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        'red-flag-screening': { visible: true, defaultOpen: true, required: true },
        'current-medications': { visible: true, defaultOpen: true },
      },
    },
  },
};

export const ptOutpatientFollowUp: NoteTemplate = {
  id: 'pt-outpatient-follow-up',
  extends: 'pt-outpatient',
  discipline: 'pt',
  setting: 'outpatient',
  visitType: 'follow-up',
  label: 'PT Outpatient Follow-Up',
  description: 'Abbreviated progress note — focused on interval changes.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
        'current-medications': { visible: false },
      },
    },
    objective: {
      visible: true,
      subsections: {
        'inspection-palpation': { visible: false },
        'communication-cognition': { visible: false },
        'cardiovascular-pulmonary': { visible: false },
        integumentary: { visible: false },
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

export const ptOutpatientDischarge: NoteTemplate = {
  id: 'pt-outpatient-discharge',
  extends: 'pt-outpatient',
  discipline: 'pt',
  setting: 'outpatient',
  visitType: 'discharge-summary',
  label: 'PT Outpatient Discharge Summary',
  description: 'Discharge — outcomes, goal attainment, disposition.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        'interview-qa': { visible: false },
        'red-flag-screening': { visible: false },
        'current-medications': { visible: false },
      },
    },
    objective: {
      visible: true,
      subsections: {
        'inspection-palpation': { visible: false },
        'communication-cognition': { visible: false },
        'cardiovascular-pulmonary': { visible: false },
        integumentary: { visible: false },
        'treatment-performed': { visible: false },
      },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INPATIENT ACUTE
// ═══════════════════════════════════════════════════════════════════════════

export const ptInpatientAcute: NoteTemplate = {
  id: 'pt-inpatient-acute',
  extends: 'pt-base',
  discipline: 'pt',
  setting: 'inpatient-acute',
  visitType: null,
  label: 'PT Inpatient Acute',
  description: 'PT in acute hospital setting — vitals and functional mobility emphasized.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'communication-cognition': { visible: true, defaultOpen: true },
        'cardiovascular-pulmonary': { visible: true, defaultOpen: true },
        integumentary: { visible: true, defaultOpen: true },
        musculoskeletal: { visible: true, defaultOpen: false },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '5x-week', duration: 'ongoing' },
  defaultAssessments: [
    { instrumentKey: 'berg-balance-scale' },
    { instrumentKey: 'timed-up-and-go' },
  ],
  prominentInterventionCategories: ['functional-training', 'gait-training', 'patient-education'],
};

export const ptInpatientAcuteEval: NoteTemplate = {
  id: 'pt-inpatient-acute-eval',
  extends: 'pt-inpatient-acute',
  discipline: 'pt',
  setting: 'inpatient-acute',
  visitType: 'initial-eval',
  label: 'PT Inpatient Acute Evaluation',
  description: 'Initial evaluation in acute hospital setting.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        'red-flag-screening': { visible: true, defaultOpen: true, required: true },
        'current-medications': { visible: true, defaultOpen: true },
      },
    },
  },
};

export const ptInpatientAcuteDaily: NoteTemplate = {
  id: 'pt-inpatient-acute-daily',
  extends: 'pt-inpatient-acute',
  discipline: 'pt',
  setting: 'inpatient-acute',
  visitType: 'daily-note',
  label: 'PT Inpatient Acute Daily Note',
  description: 'Brief daily treatment note — session focus.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
        'current-medications': { visible: false },
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
        'treatment-narrative': { visible: false },
      },
    },
  },
};

export const ptInpatientAcuteDischarge: NoteTemplate = {
  id: 'pt-inpatient-acute-discharge',
  extends: 'pt-inpatient-acute',
  discipline: 'pt',
  setting: 'inpatient-acute',
  visitType: 'discharge-summary',
  label: 'PT Inpatient Acute Discharge',
  description: 'Discharge from acute care — disposition and recommendations.',
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
// INPATIENT REHAB (IRF)
// ═══════════════════════════════════════════════════════════════════════════

export const ptInpatientRehab: NoteTemplate = {
  id: 'pt-inpatient-rehab',
  extends: 'pt-base',
  discipline: 'pt',
  setting: 'inpatient-rehab',
  visitType: null,
  label: 'PT Inpatient Rehab (IRF)',
  description: 'Intensive rehabilitation facility — FIM-driven documentation.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'communication-cognition': { visible: true, defaultOpen: true },
        'cardiovascular-pulmonary': { visible: true, defaultOpen: true },
        musculoskeletal: { visible: true, defaultOpen: true },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '5x-week', duration: '2-weeks' },
  defaultAssessments: [
    { instrumentKey: 'berg-balance-scale' },
    { instrumentKey: 'timed-up-and-go' },
  ],
  settingFlags: { requireFIM: true },
};

export const ptInpatientRehabEval: NoteTemplate = {
  id: 'pt-inpatient-rehab-eval',
  extends: 'pt-inpatient-rehab',
  discipline: 'pt',
  setting: 'inpatient-rehab',
  visitType: 'initial-eval',
  label: 'PT IRF Initial Evaluation',
  description: 'Comprehensive IRF evaluation.',
  noteFormat: 'soap',
  sections: {},
};

export const ptInpatientRehabDaily: NoteTemplate = {
  id: 'pt-inpatient-rehab-daily',
  extends: 'pt-inpatient-rehab',
  discipline: 'pt',
  setting: 'inpatient-rehab',
  visitType: 'daily-note',
  label: 'PT IRF Daily Note',
  description: 'Daily treatment note — intensive rehab session.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
        'current-medications': { visible: false },
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

export const ptInpatientRehabDischarge: NoteTemplate = {
  id: 'pt-inpatient-rehab-discharge',
  extends: 'pt-inpatient-rehab',
  discipline: 'pt',
  setting: 'inpatient-rehab',
  visitType: 'discharge-summary',
  label: 'PT IRF Discharge Summary',
  description: 'IRF discharge — FIM outcomes, goal attainment, disposition.',
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

export const ptInpatientRehabConference: NoteTemplate = {
  id: 'pt-inpatient-rehab-conference',
  extends: 'pt-inpatient-rehab',
  discipline: 'pt',
  setting: 'inpatient-rehab',
  visitType: 'team-conference',
  label: 'PT IRF Team Conference',
  description: 'Team conference note — interdisciplinary goals and progress.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        'interview-qa': { visible: false },
        'red-flag-screening': { visible: false },
        'current-medications': { visible: false },
      },
    },
    objective: {
      visible: true,
      subsections: {
        'inspection-palpation': { visible: false },
        'treatment-performed': { visible: false },
      },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SNF (Skilled Nursing Facility)
// ═══════════════════════════════════════════════════════════════════════════

export const ptSnf: NoteTemplate = {
  id: 'pt-snf',
  extends: 'pt-base',
  discipline: 'pt',
  setting: 'snf',
  visitType: null,
  label: 'PT Skilled Nursing Facility',
  description: 'PT in SNF — weekly progress notes, MDS-driven.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '5x-week', duration: '4-weeks' },
  defaultAssessments: [
    { instrumentKey: 'berg-balance-scale' },
    { instrumentKey: 'timed-up-and-go' },
  ],
  settingFlags: { requireMDS: true },
};

export const ptSnfEval: NoteTemplate = {
  id: 'pt-snf-eval',
  extends: 'pt-snf',
  discipline: 'pt',
  setting: 'snf',
  visitType: 'initial-eval',
  label: 'PT SNF Initial Evaluation',
  description: 'SNF initial evaluation — full assessment.',
  noteFormat: 'soap',
  sections: {},
};

export const ptSnfProgress: NoteTemplate = {
  id: 'pt-snf-progress',
  extends: 'pt-snf',
  discipline: 'pt',
  setting: 'snf',
  visitType: 'progress-note',
  label: 'PT SNF Weekly Progress Note',
  description: 'Weekly progress note — skilled need justification.',
  noteFormat: 'soap',
  sections: {
    subjective: {
      visible: true,
      subsections: {
        history: { visible: false },
        'red-flag-screening': { visible: false },
      },
    },
    objective: {
      visible: true,
      subsections: {
        'inspection-palpation': { visible: false },
        'communication-cognition': { visible: false },
        'cardiovascular-pulmonary': { visible: false },
        integumentary: { visible: false },
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

export const ptSnfDischarge: NoteTemplate = {
  id: 'pt-snf-discharge',
  extends: 'pt-snf',
  discipline: 'pt',
  setting: 'snf',
  visitType: 'discharge-summary',
  label: 'PT SNF Discharge Summary',
  description: 'SNF discharge — outcomes and disposition.',
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
// HOME HEALTH
// ═══════════════════════════════════════════════════════════════════════════

export const ptHomeHealth: NoteTemplate = {
  id: 'pt-home-health',
  extends: 'pt-base',
  discipline: 'pt',
  setting: 'home-health',
  visitType: null,
  label: 'PT Home Health',
  description: 'PT in home health — OASIS-driven documentation.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'inspection-palpation': { visible: true, defaultOpen: true },
        integumentary: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '2x-week', duration: '8-weeks' },
  defaultAssessments: [
    { instrumentKey: 'timed-up-and-go' },
    { instrumentKey: 'berg-balance-scale' },
  ],
  settingFlags: { requireOASIS: true },
};

export const ptHomeHealthSoc: NoteTemplate = {
  id: 'pt-home-health-soc',
  extends: 'pt-home-health',
  discipline: 'pt',
  setting: 'home-health',
  visitType: 'start-of-care',
  label: 'PT Home Health Start of Care',
  description: 'Start of care — comprehensive home evaluation.',
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

export const ptHomeHealthRecert: NoteTemplate = {
  id: 'pt-home-health-recert',
  extends: 'pt-home-health',
  discipline: 'pt',
  setting: 'home-health',
  visitType: 'recertification',
  label: 'PT Home Health Recertification',
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

export const ptHomeHealthDischarge: NoteTemplate = {
  id: 'pt-home-health-discharge',
  extends: 'pt-home-health',
  discipline: 'pt',
  setting: 'home-health',
  visitType: 'discharge-summary',
  label: 'PT Home Health Discharge',
  description: 'Home health discharge — outcomes and home program.',
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

// ─── Export all PT templates ────────────────────────────────────────────────

export const PT_TEMPLATES: NoteTemplate[] = [
  ptBase,
  // Outpatient
  ptOutpatient,
  ptOutpatientEval,
  ptOutpatientFollowUp,
  ptOutpatientDischarge,
  // Inpatient Acute
  ptInpatientAcute,
  ptInpatientAcuteEval,
  ptInpatientAcuteDaily,
  ptInpatientAcuteDischarge,
  // Inpatient Rehab (IRF)
  ptInpatientRehab,
  ptInpatientRehabEval,
  ptInpatientRehabDaily,
  ptInpatientRehabDischarge,
  ptInpatientRehabConference,
  // SNF
  ptSnf,
  ptSnfEval,
  ptSnfProgress,
  ptSnfDischarge,
  // Home Health
  ptHomeHealth,
  ptHomeHealthSoc,
  ptHomeHealthRecert,
  ptHomeHealthDischarge,
];
