import {
  isFieldComplete,
  type DisciplineProgressConfig,
  type SectionData,
} from '$lib/config/progressUtils';

export const dieteticsSections = [
  { id: 'nutrition-assessment', label: 'Assessment', icon: 'A' },
  { id: 'nutrition-diagnosis', label: 'Diagnosis', icon: 'D' },
  { id: 'nutrition-intervention', label: 'Intervention', icon: 'I' },
  { id: 'nutrition-monitoring', label: 'Monitoring', icon: 'M' },
  { id: 'billing', label: 'Billing', icon: 'B' },
];

export const dieteticsSubsections: Record<string, string[]> = {
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

export const dieteticsSubsectionLabels: Record<string, string> = {
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

export const dieteticsDataResolvers: Record<string, (section: SectionData) => unknown> = {
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
  'pes-statements': (section) => section?.pes_statements,
  'priority-dx': (section) => section?.priority_diagnosis,
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
  'monitoring-indicators': (section) => ({
    indicators: section?.indicators,
    criteria: section?.criteria,
  }),
  'monitoring-outcomes': (section) => section?.outcomes,
  'monitoring-followup': (section) => section?.follow_up_plan,
  'billing-codes': (section) => ({
    cpt_code: section?.cpt_code,
    units: section?.units,
    time_minutes: section?.time_minutes,
    diagnosis_codes: section?.diagnosis_codes,
  }),
  'billing-justification': (section) => section?.justification,
};

type RequirementFn = (data: unknown, section: SectionData) => boolean;

export const dieteticsRequirements: Record<string, RequirementFn> = {
  'assessment-domains': (_data, section) => {
    const domains = [
      section?.food_nutrition_history,
      section?.anthropometric,
      section?.biochemical,
      section?.nutrition_focused_pe,
      section?.client_history,
    ];
    return domains.every((value) => isFieldComplete(value));
  },
  'assessment-screening': (_data, section) =>
    isFieldComplete(section?.malnutrition_risk) && isFieldComplete(section?.estimated_needs),
  'pes-statements': (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.some(
      (row) =>
        isFieldComplete((row as Record<string, unknown>)?.problem) &&
        isFieldComplete((row as Record<string, unknown>)?.etiology) &&
        isFieldComplete((row as Record<string, unknown>)?.signs_symptoms),
    );
  },
  'priority-dx': (data) => isFieldComplete(data),
  'intervention-plan': (_data, section) =>
    isFieldComplete(section?.strategy) &&
    isFieldComplete(section?.diet_order) &&
    isFieldComplete(section?.goals),
  'intervention-education': (_data, section) =>
    isFieldComplete(section?.education_topics) && isFieldComplete(section?.counseling_notes),
  'intervention-coordination': (data) => isFieldComplete(data),
  'monitoring-indicators': (_data, section) =>
    isFieldComplete(section?.indicators) && isFieldComplete(section?.criteria),
  'monitoring-outcomes': (data) => isFieldComplete(data),
  'monitoring-followup': (data) => isFieldComplete(data),
  'billing-codes': (_data, section) =>
    isFieldComplete(section?.cpt_code) &&
    isFieldComplete(section?.units) &&
    isFieldComplete(section?.time_minutes),
  'billing-justification': (data) => isFieldComplete(data),
};

export const dieteticsDisciplineConfig: DisciplineProgressConfig = {
  sections: dieteticsSections,
  subsections: dieteticsSubsections,
  subsectionLabels: dieteticsSubsectionLabels,
  dataResolvers: dieteticsDataResolvers,
  requirements: dieteticsRequirements,
  sectionKeyMap: {
    'nutrition-assessment': 'nutrition_assessment',
    'nutrition-diagnosis': 'nutrition_diagnosis',
    'nutrition-intervention': 'nutrition_intervention',
    'nutrition-monitoring': 'nutrition_monitoring',
  },
};
