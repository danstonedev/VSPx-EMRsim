/**
 * SLP (Speech-Language Pathology) note templates.
 *
 * Hierarchy:
 *   slp-base
 *   ├── slp-outpatient       → slp-outpatient-initial-eval, slp-outpatient-follow-up, slp-outpatient-discharge
 *   ├── slp-inpatient-acute  → slp-inpatient-acute-eval, slp-inpatient-acute-daily, slp-inpatient-acute-discharge
 *   ├── slp-inpatient-rehab  → slp-inpatient-rehab-eval, slp-inpatient-rehab-daily, slp-inpatient-rehab-discharge
 *   ├── slp-snf              → slp-snf-eval, slp-snf-progress, slp-snf-discharge
 *   ├── slp-home-health      → slp-home-health-soc, slp-home-health-recert, slp-home-health-discharge
 *   └── slp-pediatric        → slp-pediatric-eval, slp-pediatric-follow-up, slp-pediatric-discharge
 */

import type { NoteTemplate } from '../templateTypes';
import {
  SUBJECTIVE_DEFAULTS,
  OBJECTIVE_DEFAULTS,
  ASSESSMENT_DEFAULTS,
  PLAN_DEFAULTS,
  BILLING_DEFAULTS,
} from '../shared/soapDefaults';

// ─── SLP Base ──────────────────────────────────────────────────────────────

export const slpBase: NoteTemplate = {
  id: 'slp-base',
  discipline: 'slp',
  setting: null,
  visitType: null,
  label: 'SLP Base',
  description: 'Base configuration for all SLP notes.',
  noteFormat: 'soap',
  sections: {
    subjective: SUBJECTIVE_DEFAULTS,
    objective: {
      ...OBJECTIVE_DEFAULTS,
      subsections: {
        ...OBJECTIVE_DEFAULTS.subsections,
        // SLP emphasizes communication, cognition; de-emphasizes MSK
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        musculoskeletal: { visible: false },
        neuromuscular: { visible: true, defaultOpen: true },
        // Inspection-palpation covers oral-motor exam for SLP
        'inspection-palpation': { visible: true, defaultOpen: true, required: true },
        'cardiovascular-pulmonary': { visible: false },
        integumentary: { visible: false },
      },
    },
    assessment: ASSESSMENT_DEFAULTS,
    plan: PLAN_DEFAULTS,
    billing: BILLING_DEFAULTS,
  },
  defaultAssessments: [],
  prominentInterventionCategories: [
    'speech-production',
    'language-therapy',
    'cognitive-communication',
    'swallowing-therapy',
    'voice-therapy',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// OUTPATIENT
// ═══════════════════════════════════════════════════════════════════════════

export const slpOutpatient: NoteTemplate = {
  id: 'slp-outpatient',
  extends: 'slp-base',
  discipline: 'slp',
  setting: 'outpatient',
  visitType: null,
  label: 'SLP Outpatient',
  description: 'Base for SLP outpatient documentation.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '2x-week', duration: '8-weeks' },
  defaultAssessments: [{ instrumentKey: 'boston-naming-test' }],
};

export const slpOutpatientEval: NoteTemplate = {
  id: 'slp-outpatient-initial-eval',
  extends: 'slp-outpatient',
  discipline: 'slp',
  setting: 'outpatient',
  visitType: 'initial-eval',
  label: 'SLP Outpatient Initial Evaluation',
  description: 'Comprehensive SLP initial evaluation.',
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

export const slpOutpatientFollowUp: NoteTemplate = {
  id: 'slp-outpatient-follow-up',
  extends: 'slp-outpatient',
  discipline: 'slp',
  setting: 'outpatient',
  visitType: 'follow-up',
  label: 'SLP Outpatient Follow-Up',
  description: 'Progress note — interval changes and treatment response.',
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

export const slpOutpatientDischarge: NoteTemplate = {
  id: 'slp-outpatient-discharge',
  extends: 'slp-outpatient',
  discipline: 'slp',
  setting: 'outpatient',
  visitType: 'discharge-summary',
  label: 'SLP Outpatient Discharge Summary',
  description: 'Discharge — outcomes and recommendations.',
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
      subsections: { 'treatment-performed': { visible: false } },
    },
    billing: { visible: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// INPATIENT ACUTE
// ═══════════════════════════════════════════════════════════════════════════

export const slpInpatientAcute: NoteTemplate = {
  id: 'slp-inpatient-acute',
  extends: 'slp-base',
  discipline: 'slp',
  setting: 'inpatient-acute',
  visitType: null,
  label: 'SLP Inpatient Acute',
  description: 'SLP in acute hospital — dysphagia, cognition, communication.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: true, defaultOpen: true, required: true },
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        'inspection-palpation': { visible: true, defaultOpen: true, required: true },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '5x-week', duration: 'ongoing' },
  defaultAssessments: [{ instrumentKey: 'montreal-cognitive-assessment' }],
};

export const slpInpatientAcuteEval: NoteTemplate = {
  id: 'slp-inpatient-acute-eval',
  extends: 'slp-inpatient-acute',
  discipline: 'slp',
  setting: 'inpatient-acute',
  visitType: 'initial-eval',
  label: 'SLP Inpatient Acute Evaluation',
  description: 'Initial evaluation — bedside swallow, communication screen.',
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

export const slpInpatientAcuteDaily: NoteTemplate = {
  id: 'slp-inpatient-acute-daily',
  extends: 'slp-inpatient-acute',
  discipline: 'slp',
  setting: 'inpatient-acute',
  visitType: 'daily-note',
  label: 'SLP Inpatient Acute Daily Note',
  description: 'Brief daily treatment note.',
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

export const slpInpatientAcuteDischarge: NoteTemplate = {
  id: 'slp-inpatient-acute-discharge',
  extends: 'slp-inpatient-acute',
  discipline: 'slp',
  setting: 'inpatient-acute',
  visitType: 'discharge-summary',
  label: 'SLP Inpatient Acute Discharge',
  description: 'Discharge — swallow status, communication level, recommendations.',
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
// INPATIENT REHAB (IRF)
// ═══════════════════════════════════════════════════════════════════════════

export const slpInpatientRehab: NoteTemplate = {
  id: 'slp-inpatient-rehab',
  extends: 'slp-base',
  discipline: 'slp',
  setting: 'inpatient-rehab',
  visitType: null,
  label: 'SLP Inpatient Rehab (IRF)',
  description: 'SLP in IRF — intensive communication and swallow rehabilitation.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '5x-week', duration: '2-weeks' },
  defaultAssessments: [{ instrumentKey: 'montreal-cognitive-assessment' }],
  settingFlags: { requireFIM: true },
};

export const slpInpatientRehabEval: NoteTemplate = {
  id: 'slp-inpatient-rehab-eval',
  extends: 'slp-inpatient-rehab',
  discipline: 'slp',
  setting: 'inpatient-rehab',
  visitType: 'initial-eval',
  label: 'SLP IRF Initial Evaluation',
  description: 'Comprehensive IRF SLP evaluation.',
  noteFormat: 'soap',
  sections: {},
};

export const slpInpatientRehabDaily: NoteTemplate = {
  id: 'slp-inpatient-rehab-daily',
  extends: 'slp-inpatient-rehab',
  discipline: 'slp',
  setting: 'inpatient-rehab',
  visitType: 'daily-note',
  label: 'SLP IRF Daily Note',
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

export const slpInpatientRehabDischarge: NoteTemplate = {
  id: 'slp-inpatient-rehab-discharge',
  extends: 'slp-inpatient-rehab',
  discipline: 'slp',
  setting: 'inpatient-rehab',
  visitType: 'discharge-summary',
  label: 'SLP IRF Discharge Summary',
  description: 'IRF discharge — communication and swallow outcomes.',
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
// SNF
// ═══════════════════════════════════════════════════════════════════════════

export const slpSnf: NoteTemplate = {
  id: 'slp-snf',
  extends: 'slp-base',
  discipline: 'slp',
  setting: 'snf',
  visitType: null,
  label: 'SLP Skilled Nursing Facility',
  description: 'SLP in SNF — MDS-driven, dysphagia management focus.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '5x-week', duration: '4-weeks' },
  settingFlags: { requireMDS: true },
};

export const slpSnfEval: NoteTemplate = {
  id: 'slp-snf-eval',
  extends: 'slp-snf',
  discipline: 'slp',
  setting: 'snf',
  visitType: 'initial-eval',
  label: 'SLP SNF Initial Evaluation',
  description: 'SNF initial evaluation.',
  noteFormat: 'soap',
  sections: {},
};

export const slpSnfProgress: NoteTemplate = {
  id: 'slp-snf-progress',
  extends: 'slp-snf',
  discipline: 'slp',
  setting: 'snf',
  visitType: 'progress-note',
  label: 'SLP SNF Weekly Progress Note',
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

export const slpSnfDischarge: NoteTemplate = {
  id: 'slp-snf-discharge',
  extends: 'slp-snf',
  discipline: 'slp',
  setting: 'snf',
  visitType: 'discharge-summary',
  label: 'SLP SNF Discharge Summary',
  description: 'SNF discharge — communication and swallow outcomes.',
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

export const slpHomeHealth: NoteTemplate = {
  id: 'slp-home-health',
  extends: 'slp-base',
  discipline: 'slp',
  setting: 'home-health',
  visitType: null,
  label: 'SLP Home Health',
  description: 'SLP in home health — OASIS-driven.',
  noteFormat: 'soap',
  sections: {},
  defaultVisitParams: { frequency: '2x-week', duration: '8-weeks' },
  settingFlags: { requireOASIS: true },
};

export const slpHomeHealthSoc: NoteTemplate = {
  id: 'slp-home-health-soc',
  extends: 'slp-home-health',
  discipline: 'slp',
  setting: 'home-health',
  visitType: 'start-of-care',
  label: 'SLP Home Health Start of Care',
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

export const slpHomeHealthRecert: NoteTemplate = {
  id: 'slp-home-health-recert',
  extends: 'slp-home-health',
  discipline: 'slp',
  setting: 'home-health',
  visitType: 'recertification',
  label: 'SLP Home Health Recertification',
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

export const slpHomeHealthDischarge: NoteTemplate = {
  id: 'slp-home-health-discharge',
  extends: 'slp-home-health',
  discipline: 'slp',
  setting: 'home-health',
  visitType: 'discharge-summary',
  label: 'SLP Home Health Discharge',
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

export const slpPediatric: NoteTemplate = {
  id: 'slp-pediatric',
  extends: 'slp-base',
  discipline: 'slp',
  setting: 'pediatric',
  visitType: null,
  label: 'SLP Pediatric',
  description: 'SLP pediatric — speech, language, feeding, and developmental focus.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: {
        'vital-signs': { visible: false },
        'communication-cognition': { visible: true, defaultOpen: true, required: true },
        'inspection-palpation': { visible: true, defaultOpen: true, required: true },
        neuromuscular: { visible: true, defaultOpen: true },
      },
    },
  },
  defaultVisitParams: { frequency: '2x-week', duration: '12-weeks' },
};

export const slpPediatricEval: NoteTemplate = {
  id: 'slp-pediatric-eval',
  extends: 'slp-pediatric',
  discipline: 'slp',
  setting: 'pediatric',
  visitType: 'initial-eval',
  label: 'SLP Pediatric Initial Evaluation',
  description: 'Comprehensive pediatric SLP evaluation.',
  noteFormat: 'soap',
  sections: {},
};

export const slpPediatricFollowUp: NoteTemplate = {
  id: 'slp-pediatric-follow-up',
  extends: 'slp-pediatric',
  discipline: 'slp',
  setting: 'pediatric',
  visitType: 'follow-up',
  label: 'SLP Pediatric Follow-Up',
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

export const slpPediatricDischarge: NoteTemplate = {
  id: 'slp-pediatric-discharge',
  extends: 'slp-pediatric',
  discipline: 'slp',
  setting: 'pediatric',
  visitType: 'discharge-summary',
  label: 'SLP Pediatric Discharge Summary',
  description: 'Pediatric discharge — communication and feeding outcomes.',
  noteFormat: 'soap',
  sections: {
    objective: {
      visible: true,
      subsections: { 'treatment-performed': { visible: false } },
    },
    billing: { visible: false },
  },
};

// ─── Export all SLP templates ─────────────────────────────────────────────

export const SLP_TEMPLATES: NoteTemplate[] = [
  slpBase,
  // Outpatient
  slpOutpatient,
  slpOutpatientEval,
  slpOutpatientFollowUp,
  slpOutpatientDischarge,
  // Inpatient Acute
  slpInpatientAcute,
  slpInpatientAcuteEval,
  slpInpatientAcuteDaily,
  slpInpatientAcuteDischarge,
  // Inpatient Rehab
  slpInpatientRehab,
  slpInpatientRehabEval,
  slpInpatientRehabDaily,
  slpInpatientRehabDischarge,
  // SNF
  slpSnf,
  slpSnfEval,
  slpSnfProgress,
  slpSnfDischarge,
  // Home Health
  slpHomeHealth,
  slpHomeHealthSoc,
  slpHomeHealthRecert,
  slpHomeHealthDischarge,
  // Pediatric
  slpPediatric,
  slpPediatricEval,
  slpPediatricFollowUp,
  slpPediatricDischarge,
];
