/**
 * OT (Occupational Therapy) note templates.
 *
 * Hierarchy:
 *   ot-base
 *   ├── ot-outpatient       → ot-outpatient-initial-eval, ot-outpatient-follow-up, ot-outpatient-discharge
 *   ├── ot-inpatient-acute  → ot-inpatient-acute-eval, ot-inpatient-acute-daily, ot-inpatient-acute-discharge
 *   ├── ot-inpatient-rehab  → ot-inpatient-rehab-eval, ot-inpatient-rehab-daily, ot-inpatient-rehab-discharge, ot-inpatient-rehab-conference
 *   ├── ot-snf              → ot-snf-eval, ot-snf-progress, ot-snf-discharge
 *   ├── ot-home-health      → ot-home-health-soc, ot-home-health-recert, ot-home-health-discharge
 *   └── ot-pediatric        → ot-pediatric-eval, ot-pediatric-follow-up, ot-pediatric-discharge
 */

import type { NoteTemplate } from '../templateTypes';
import {
  SUBJECTIVE_DEFAULTS,
  OBJECTIVE_DEFAULTS,
  ASSESSMENT_DEFAULTS,
  PLAN_DEFAULTS,
  BILLING_DEFAULTS,
} from '../shared/soapDefaults';

// ─── OT Base ───────────────────────────────────────────────────────────────

export const otBase: NoteTemplate = {
  id: 'ot-base',
  discipline: 'ot',
  setting: null,
  visitType: null,
  label: 'OT Base',
  description: 'Base configuration for all OT notes.',
  noteFormat: 'soap',
  sections: {
    subjective: SUBJECTIVE_DEFAULTS,
    objective: {
      ...OBJECTIVE_DEFAULTS,
      subsections: {
        ...OBJECTIVE_DEFAULTS.subsections,
        // OT emphasizes UE function, cognition, and ADL performance
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        musculoskeletal: { visible: true, defaultOpen: true, required: true },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
    assessment: ASSESSMENT_DEFAULTS,
    plan: PLAN_DEFAULTS,
    billing: BILLING_DEFAULTS,
  },
  defaultAssessments: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPATIENT
// ═══════════════════════════════════════════════════════════════════════════

export const otOutpatient: NoteTemplate = {
  id: 'ot-outpatient',
  extends: 'ot-base',
  discipline: 'ot',
  setting: 'outpatient',
  visitType: null,
  label: 'OT Outpatient',
  description: 'Base for OT outpatient documentation.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '2x-week', duration: '8-weeks' },
  defaultAssessments: [
    { instrumentKey: 'disabilities-of-arm-shoulder-hand' },
    { instrumentKey: 'canadian-occupational-performance-measure' },
  ],
};

export const otOutpatientEval: NoteTemplate = {
  id: 'ot-outpatient-initial-eval',
  extends: 'ot-outpatient',
  discipline: 'ot',
  setting: 'outpatient',
  visitType: 'initial-eval',
  label: 'OT Outpatient Initial Evaluation',
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

export const otOutpatientFollowUp: NoteTemplate = {
  id: 'ot-outpatient-follow-up',
  extends: 'ot-outpatient',
  discipline: 'ot',
  setting: 'outpatient',
  visitType: 'follow-up',
  label: 'OT Outpatient Follow-Up',
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

export const otOutpatientDischarge: NoteTemplate = {
  id: 'ot-outpatient-discharge',
  extends: 'ot-outpatient',
  discipline: 'ot',
  setting: 'outpatient',
  visitType: 'discharge-summary',
  label: 'OT Outpatient Discharge Summary',
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
        'treatment-performed': { visible: false },
      },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INPATIENT ACUTE
// ═══════════════════════════════════════════════════════════════════════════

export const otInpatientAcute: NoteTemplate = {
  id: 'ot-inpatient-acute',
  extends: 'ot-base',
  discipline: 'ot',
  setting: 'inpatient-acute',
  visitType: null,
  label: 'OT Inpatient Acute',
  description: 'OT in acute hospital — ADL, cognition, UE function emphasized.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        integumentary: { visible: true, defaultOpen: true },
        musculoskeletal: { visible: true, defaultOpen: true },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '5x-week', duration: 'ongoing' },
  defaultAssessments: [
    { instrumentKey: 'montreal-cognitive-assessment' },
    { instrumentKey: 'barthel-index' },
  ],
};

export const otInpatientAcuteEval: NoteTemplate = {
  id: 'ot-inpatient-acute-eval',
  extends: 'ot-inpatient-acute',
  discipline: 'ot',
  setting: 'inpatient-acute',
  visitType: 'initial-eval',
  label: 'OT Inpatient Acute Evaluation',
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

export const otInpatientAcuteDaily: NoteTemplate = {
  id: 'ot-inpatient-acute-daily',
  extends: 'ot-inpatient-acute',
  discipline: 'ot',
  setting: 'inpatient-acute',
  visitType: 'daily-note',
  label: 'OT Inpatient Acute Daily Note',
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

export const otInpatientAcuteDischarge: NoteTemplate = {
  id: 'ot-inpatient-acute-discharge',
  extends: 'ot-inpatient-acute',
  discipline: 'ot',
  setting: 'inpatient-acute',
  visitType: 'discharge-summary',
  label: 'OT Inpatient Acute Discharge',
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

export const otInpatientRehab: NoteTemplate = {
  id: 'ot-inpatient-rehab',
  extends: 'ot-base',
  discipline: 'ot',
  setting: 'inpatient-rehab',
  visitType: null,
  label: 'OT Inpatient Rehab (IRF)',
  description: 'Intensive rehabilitation facility — FIM-driven, ADL-focused.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        musculoskeletal: { visible: true, defaultOpen: true },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '5x-week', duration: '2-weeks' },
  defaultAssessments: [
    { instrumentKey: 'barthel-index' },
    { instrumentKey: 'montreal-cognitive-assessment' },
  ],
  settingFlags: { requireFIM: true },
};

export const otInpatientRehabEval: NoteTemplate = {
  id: 'ot-inpatient-rehab-eval',
  extends: 'ot-inpatient-rehab',
  discipline: 'ot',
  setting: 'inpatient-rehab',
  visitType: 'initial-eval',
  label: 'OT IRF Initial Evaluation',
  description: 'Comprehensive IRF evaluation.',
  noteFormat: 'soap',
  sections: {},
};

export const otInpatientRehabDaily: NoteTemplate = {
  id: 'ot-inpatient-rehab-daily',
  extends: 'ot-inpatient-rehab',
  discipline: 'ot',
  setting: 'inpatient-rehab',
  visitType: 'daily-note',
  label: 'OT IRF Daily Note',
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

export const otInpatientRehabDischarge: NoteTemplate = {
  id: 'ot-inpatient-rehab-discharge',
  extends: 'ot-inpatient-rehab',
  discipline: 'ot',
  setting: 'inpatient-rehab',
  visitType: 'discharge-summary',
  label: 'OT IRF Discharge Summary',
  description: 'IRF discharge — FIM outcomes, goal attainment, disposition.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: { 'treatment-performed': { visible: false } },
    },
    billing: { visible: false },
  },
};

export const otInpatientRehabConference: NoteTemplate = {
  id: 'ot-inpatient-rehab-conference',
  extends: 'ot-inpatient-rehab',
  discipline: 'ot',
  setting: 'inpatient-rehab',
  visitType: 'team-conference',
  label: 'OT IRF Team Conference',
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
// SNF
// ═══════════════════════════════════════════════════════════════════════════

export const otSnf: NoteTemplate = {
  id: 'ot-snf',
  extends: 'ot-base',
  discipline: 'ot',
  setting: 'snf',
  visitType: null,
  label: 'OT Skilled Nursing Facility',
  description: 'OT in SNF — ADL focus, MDS-driven.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '5x-week', duration: '4-weeks' },
  defaultAssessments: [
    { instrumentKey: 'barthel-index' },
    { instrumentKey: 'montreal-cognitive-assessment' },
  ],
  settingFlags: { requireMDS: true },
};

export const otSnfEval: NoteTemplate = {
  id: 'ot-snf-eval',
  extends: 'ot-snf',
  discipline: 'ot',
  setting: 'snf',
  visitType: 'initial-eval',
  label: 'OT SNF Initial Evaluation',
  description: 'SNF initial evaluation — full assessment.',
  noteFormat: 'soap',
  sections: {},
};

export const otSnfProgress: NoteTemplate = {
  id: 'ot-snf-progress',
  extends: 'ot-snf',
  discipline: 'ot',
  setting: 'snf',
  visitType: 'progress-note',
  label: 'OT SNF Weekly Progress Note',
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

export const otSnfDischarge: NoteTemplate = {
  id: 'ot-snf-discharge',
  extends: 'ot-snf',
  discipline: 'ot',
  setting: 'snf',
  visitType: 'discharge-summary',
  label: 'OT SNF Discharge Summary',
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

export const otHomeHealth: NoteTemplate = {
  id: 'ot-home-health',
  extends: 'ot-base',
  discipline: 'ot',
  setting: 'home-health',
  visitType: null,
  label: 'OT Home Health',
  description: 'OT in home health — OASIS-driven, home safety and ADL focus.',
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
    { instrumentKey: 'barthel-index' },
    { instrumentKey: 'canadian-occupational-performance-measure' },
  ],
  settingFlags: { requireOASIS: true },
};

export const otHomeHealthSoc: NoteTemplate = {
  id: 'ot-home-health-soc',
  extends: 'ot-home-health',
  discipline: 'ot',
  setting: 'home-health',
  visitType: 'start-of-care',
  label: 'OT Home Health Start of Care',
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

export const otHomeHealthRecert: NoteTemplate = {
  id: 'ot-home-health-recert',
  extends: 'ot-home-health',
  discipline: 'ot',
  setting: 'home-health',
  visitType: 'recertification',
  label: 'OT Home Health Recertification',
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

export const otHomeHealthDischarge: NoteTemplate = {
  id: 'ot-home-health-discharge',
  extends: 'ot-home-health',
  discipline: 'ot',
  setting: 'home-health',
  visitType: 'discharge-summary',
  label: 'OT Home Health Discharge',
  description: 'Home health discharge — outcomes and home program.',
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
// PEDIATRIC
// ═══════════════════════════════════════════════════════════════════════════

export const otPediatric: NoteTemplate = {
  id: 'ot-pediatric',
  extends: 'ot-base',
  discipline: 'ot',
  setting: 'pediatric',
  visitType: null,
  label: 'OT Pediatric',
  description: 'OT pediatric — sensory, developmental, and fine motor focus.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: false },
        'cardiovascular-pulmonary': { visible: false },
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        musculoskeletal: { visible: true, defaultOpen: true, required: true },
        neuromuscular: { visible: true, defaultOpen: true, required: true },
      },
    },
  },
  defaultVisitParams: { frequency: '1x-week', duration: '12-weeks' },
  defaultAssessments: [{ instrumentKey: 'peabody-developmental-motor-scales' }],
};

export const otPediatricEval: NoteTemplate = {
  id: 'ot-pediatric-eval',
  extends: 'ot-pediatric',
  discipline: 'ot',
  setting: 'pediatric',
  visitType: 'initial-eval',
  label: 'OT Pediatric Initial Evaluation',
  description: 'Comprehensive pediatric evaluation.',
  noteFormat: 'soap',
  sections: {},
};

export const otPediatricFollowUp: NoteTemplate = {
  id: 'ot-pediatric-follow-up',
  extends: 'ot-pediatric',
  discipline: 'ot',
  setting: 'pediatric',
  visitType: 'follow-up',
  label: 'OT Pediatric Follow-Up',
  description: 'Pediatric follow-up — interval changes and progress.',
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

export const otPediatricDischarge: NoteTemplate = {
  id: 'ot-pediatric-discharge',
  extends: 'ot-pediatric',
  discipline: 'ot',
  setting: 'pediatric',
  visitType: 'discharge-summary',
  label: 'OT Pediatric Discharge Summary',
  description: 'Pediatric discharge — developmental outcomes and home program.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: { 'treatment-performed': { visible: false } },
    },
    billing: { visible: false },
  },
};

// ─── Export all OT templates ──────────────────────────────────────────────

export const OT_TEMPLATES: NoteTemplate[] = [
  otBase,
  // Outpatient
  otOutpatient,
  otOutpatientEval,
  otOutpatientFollowUp,
  otOutpatientDischarge,
  // Inpatient Acute
  otInpatientAcute,
  otInpatientAcuteEval,
  otInpatientAcuteDaily,
  otInpatientAcuteDischarge,
  // Inpatient Rehab (IRF)
  otInpatientRehab,
  otInpatientRehabEval,
  otInpatientRehabDaily,
  otInpatientRehabDischarge,
  otInpatientRehabConference,
  // SNF
  otSnf,
  otSnfEval,
  otSnfProgress,
  otSnfDischarge,
  // Home Health
  otHomeHealth,
  otHomeHealthSoc,
  otHomeHealthRecert,
  otHomeHealthDischarge,
  // Pediatric
  otPediatric,
  otPediatricEval,
  otPediatricFollowUp,
  otPediatricDischarge,
];
