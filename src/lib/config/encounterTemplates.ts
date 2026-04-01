/**
 * Encounter template configurations — define which sections and subsections
 * are visible/required for each encounter type per discipline.
 *
 * This drives encounter-type differentiation: an initial evaluation shows
 * all subsections, while a progress note shows an abbreviated set.
 */

import type { DisciplineId } from '$lib/stores/auth';

export interface EncounterTemplateConfig {
  id: string;
  discipline: DisciplineId;
  encounterType: string;
  label: string;
  description: string;
  /** Sections that appear in the sidebar and editor */
  visibleSections: string[];
  /** Per-section: which subsections are visible. If absent, all subsections show. */
  visibleSubsections: Record<string, string[]>;
  /** Sections required for progress to reach 100% (subset of visibleSections) */
  requiredSections: string[];
}

// ─── PT Encounter Templates ─────────────────────────────────────────────────

export const ptEvalTemplate: EncounterTemplateConfig = {
  id: 'pt-eval',
  discipline: 'pt',
  encounterType: 'eval',
  label: 'PT Initial Evaluation',
  description: 'Comprehensive initial evaluation — all sections and subsections required.',
  visibleSections: ['subjective', 'objective', 'assessment', 'plan', 'billing'],
  visibleSubsections: {
    subjective: [
      'history',
      'interview-qa',
      'pain-assessment',
      'red-flag-screening',
      'current-medications',
    ],
    objective: [
      'vital-signs',
      'communication-cognition',
      'cardiovascular-pulmonary',
      'integumentary',
      'musculoskeletal',
      'neuromuscular',
      'treatment-performed',
    ],
    assessment: ['primary-impairments', 'icf-classification', 'pt-diagnosis', 'clinical-reasoning'],
    plan: ['goal-setting', 'in-clinic-treatment-plan', 'hep-plan'],
    billing: ['diagnosis-codes', 'cpt-codes', 'orders-referrals'],
  },
  requiredSections: ['subjective', 'objective', 'assessment', 'plan', 'billing'],
};

export const ptFollowupTemplate: EncounterTemplateConfig = {
  id: 'pt-followup',
  discipline: 'pt',
  encounterType: 'followup',
  label: 'PT Progress Note',
  description: 'Abbreviated progress note — focused on interval changes and goal progress.',
  visibleSections: ['subjective', 'objective', 'assessment', 'plan', 'billing'],
  visibleSubsections: {
    subjective: ['pain-assessment', 'interview-qa'],
    objective: ['vital-signs', 'musculoskeletal', 'treatment-performed'],
    assessment: ['clinical-reasoning'],
    plan: ['goal-setting', 'in-clinic-treatment-plan', 'hep-plan'],
    billing: ['diagnosis-codes', 'cpt-codes'],
  },
  requiredSections: ['subjective', 'objective', 'assessment', 'plan', 'billing'],
};

export const ptSoapTemplate: EncounterTemplateConfig = {
  id: 'pt-soap',
  discipline: 'pt',
  encounterType: 'soap',
  label: 'PT Daily SOAP Note',
  description: 'Brief daily treatment note — focused on session interventions and response.',
  visibleSections: ['subjective', 'objective', 'assessment', 'plan', 'billing'],
  visibleSubsections: {
    subjective: ['pain-assessment', 'interview-qa'],
    objective: ['vital-signs', 'treatment-performed'],
    assessment: ['clinical-reasoning'],
    plan: ['goal-setting', 'in-clinic-treatment-plan'],
    billing: ['diagnosis-codes', 'cpt-codes'],
  },
  requiredSections: ['subjective', 'objective', 'assessment', 'plan', 'billing'],
};

export const ptDischargeTemplate: EncounterTemplateConfig = {
  id: 'pt-discharge',
  discipline: 'pt',
  encounterType: 'discharge',
  label: 'PT Discharge Summary',
  description: 'Discharge documentation — outcomes, goal attainment, and disposition.',
  visibleSections: ['subjective', 'objective', 'assessment', 'plan'],
  visibleSubsections: {
    subjective: ['history', 'interview-qa'],
    objective: ['vital-signs', 'musculoskeletal', 'neuromuscular'],
    assessment: ['icf-classification', 'pt-diagnosis', 'clinical-reasoning'],
    plan: ['goal-setting', 'hep-plan'],
  },
  requiredSections: ['subjective', 'objective', 'assessment', 'plan'],
};

// ─── Dietetics Encounter Templates ──────────────────────────────────────────

export const dieteticsNcpTemplate: EncounterTemplateConfig = {
  id: 'dietetics-ncp',
  discipline: 'dietetics',
  encounterType: 'nutrition',
  label: 'Nutrition Care Process',
  description: 'Full ADIME documentation — all sections required.',
  visibleSections: [
    'nutrition-assessment',
    'nutrition-diagnosis',
    'nutrition-intervention',
    'nutrition-monitoring',
    'billing',
  ],
  visibleSubsections: {
    'nutrition-assessment': ['assessment-domains', 'assessment-screening'],
    'nutrition-diagnosis': ['pes-statements', 'priority-dx'],
    'nutrition-intervention': [
      'intervention-plan',
      'intervention-education',
      'intervention-coordination',
    ],
    'nutrition-monitoring': ['monitoring-indicators', 'monitoring-outcomes', 'monitoring-followup'],
    billing: ['billing-codes', 'billing-justification'],
  },
  requiredSections: [
    'nutrition-assessment',
    'nutrition-diagnosis',
    'nutrition-intervention',
    'nutrition-monitoring',
    'billing',
  ],
};

// ─── Registry & Lookup ──────────────────────────────────────────────────────

const ALL_TEMPLATES: EncounterTemplateConfig[] = [
  ptEvalTemplate,
  ptFollowupTemplate,
  ptSoapTemplate,
  ptDischargeTemplate,
  dieteticsNcpTemplate,
];

/** Look up an encounter template by its ID (e.g., 'pt-eval'). */
export function getEncounterTemplate(templateId: string): EncounterTemplateConfig | null {
  return ALL_TEMPLATES.find((t) => t.id === templateId) ?? null;
}

/** Look up by discipline + encounter type combo. */
export function getEncounterTemplateByType(
  discipline: DisciplineId,
  encounterType: string,
): EncounterTemplateConfig | null {
  return (
    ALL_TEMPLATES.find((t) => t.discipline === discipline && t.encounterType === encounterType) ??
    null
  );
}

/** List all templates for a given discipline. */
export function listEncounterTemplates(discipline?: DisciplineId): EncounterTemplateConfig[] {
  if (!discipline) return ALL_TEMPLATES;
  return ALL_TEMPLATES.filter((t) => t.discipline === discipline);
}
