// dietetics-discipline-config.js — Dietetics NCP progress tracking configuration
//
// Supplies sections, subsections, data resolvers, labels, and completion
// requirements to SidebarProgressTracker for Nutrition Care Process notes.
//
// Usage:
//   import { dieteticsDisciplineConfig } from './dietetics-discipline-config.js';
//   import { createProgressTracker } from './SidebarProgressTracker.js';
//   const tracker = createProgressTracker(dieteticsDisciplineConfig);

import { isFieldComplete } from './SidebarProgressTracker.js';

// ── Section definitions ────────────────────────────────────────────

export const dieteticsSections = [
  { id: 'nutrition-assessment', label: 'Nutrition Assessment', icon: 'assignment' },
  { id: 'nutrition-diagnosis', label: 'Nutrition Diagnosis', icon: 'search' },
  { id: 'nutrition-intervention', label: 'Nutrition Intervention', icon: 'medication' },
  { id: 'nutrition-monitoring', label: 'Monitoring & Evaluation', icon: 'monitoring' },
  { id: 'billing', label: 'Billing', icon: 'receipt_long' },
];

// ── Subsection IDs per section ─────────────────────────────────────

export const dieteticsSubsections = {
  'nutrition-assessment': ['assessment-domains', 'assessment-screening'],
  'nutrition-diagnosis': ['pes-statements', 'priority-dx'],
  'nutrition-intervention': [
    'intervention-plan',
    'intervention-education',
    'intervention-coordination',
  ],
  'nutrition-monitoring': ['monitoring-indicators', 'monitoring-outcomes', 'monitoring-followup'],
  billing: ['billing-codes', 'billing-justification'],
};

// ── Human-readable labels ──────────────────────────────────────────

export const dieteticsSubsectionLabels = {
  'assessment-domains': 'Assessment Domains (ADIME)',
  'assessment-screening': 'Screening & Estimated Needs',
  'pes-statements': 'PES Statements',
  'priority-dx': 'Priority Diagnosis',
  'intervention-plan': 'Intervention Planning',
  'intervention-education': 'Education & Counseling',
  'intervention-coordination': 'Care Coordination',
  'monitoring-indicators': 'Indicators & Criteria',
  'monitoring-outcomes': 'Outcomes',
  'monitoring-followup': 'Follow-Up Plan',
  'billing-codes': 'MNT Billing Codes',
  'billing-justification': 'Medical Necessity',
};

// ── Data resolvers (extract subsection data from section draft) ────

export const dieteticsDataResolvers = {
  // Nutrition Assessment
  'assessment-domains': (section) => ({
    food_nutrition_history: section?.food_nutrition_history,
    anthropometric: section?.anthropometric,
    biochemical: section?.biochemical,
    nutrition_focused_pe: section?.nutrition_focused_pe,
    client_history: section?.client_history,
  }),
  'assessment-screening': (section) => ({
    malnutrition_risk: section?.malnutrition_risk,
    estimated_needs: section?.estimated_needs,
  }),

  // Nutrition Diagnosis
  'pes-statements': (section) => section?.pes_statements,
  'priority-dx': (section) => section?.priority_diagnosis,

  // Nutrition Intervention
  'intervention-plan': (section) => ({
    strategy: section?.strategy,
    diet_order: section?.diet_order,
    goals: section?.goals,
  }),
  'intervention-education': (section) => ({
    education_topics: section?.education_topics,
    counseling_notes: section?.counseling_notes,
  }),
  'intervention-coordination': (section) => section?.coordination,

  // Monitoring & Evaluation
  'monitoring-indicators': (section) => ({
    indicators: section?.indicators,
    criteria: section?.criteria,
  }),
  'monitoring-outcomes': (section) => section?.outcomes,
  'monitoring-followup': (section) => section?.follow_up_plan,

  // Billing
  'billing-codes': (section) => ({
    cpt_code: section?.cpt_code,
    units: section?.units,
    time_minutes: section?.time_minutes,
    diagnosis_codes: section?.diagnosis_codes,
  }),
  'billing-justification': (section) => section?.justification,
};

// ── Completion requirements ────────────────────────────────────────

export const dieteticsRequirements = {
  // At least 1 of the 5 ADIME domain fields filled
  'assessment-domains': (_data, section) => {
    const domains = [
      section?.food_nutrition_history,
      section?.anthropometric,
      section?.biochemical,
      section?.nutrition_focused_pe,
      section?.client_history,
    ];
    return domains.every((d) => isFieldComplete(d));
  },

  'assessment-screening': (_data, section) => {
    return isFieldComplete(section?.malnutrition_risk) && isFieldComplete(section?.estimated_needs);
  },

  // At least one PES row with all 3 fields filled
  'pes-statements': (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.some(
      (row) =>
        isFieldComplete(row?.problem) &&
        isFieldComplete(row?.etiology) &&
        isFieldComplete(row?.signs_symptoms),
    );
  },

  'priority-dx': (data) => isFieldComplete(data),

  'intervention-plan': (_data, section) => {
    return (
      isFieldComplete(section?.strategy) &&
      isFieldComplete(section?.diet_order) &&
      isFieldComplete(section?.goals)
    );
  },

  'intervention-education': (_data, section) => {
    return isFieldComplete(section?.education_topics) && isFieldComplete(section?.counseling_notes);
  },

  'intervention-coordination': (data) => isFieldComplete(data),

  'monitoring-indicators': (_data, section) => {
    return isFieldComplete(section?.indicators) && isFieldComplete(section?.criteria);
  },

  'monitoring-outcomes': (data) => isFieldComplete(data),

  'monitoring-followup': (data) => isFieldComplete(data),

  'billing-codes': (_data, section) => {
    return (
      isFieldComplete(section?.cpt_code) &&
      isFieldComplete(section?.units) &&
      isFieldComplete(section?.time_minutes)
    );
  },

  'billing-justification': (data) => isFieldComplete(data),
};

// ── Assembled config ───────────────────────────────────────────────

export const dieteticsDisciplineConfig = {
  sections: dieteticsSections,
  subsections: dieteticsSubsections,
  subsectionLabels: dieteticsSubsectionLabels,
  dataResolvers: dieteticsDataResolvers,
  requirements: dieteticsRequirements,
  // Draft keys use snake_case; section IDs use kebab-case
  sectionKeyMap: {
    'nutrition-assessment': 'nutrition_assessment',
    'nutrition-diagnosis': 'nutrition_diagnosis',
    'nutrition-intervention': 'nutrition_intervention',
    'nutrition-monitoring': 'nutrition_monitoring',
  },
};
