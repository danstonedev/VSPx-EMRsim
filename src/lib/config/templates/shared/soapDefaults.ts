/**
 * Default SOAP section/subsection structure shared across PT, OT, SLP, Nursing.
 *
 * Discipline templates extend these defaults rather than redefining every subsection.
 * Only fields that differ from the base need to be overridden.
 */

import type { SectionTemplateConfig } from '../templateTypes';

/** Shared subjective section — history, interview, pain, red flags, meds. */
export const SUBJECTIVE_DEFAULTS: SectionTemplateConfig = {
  visible: true,
  subsections: {
    history: { visible: true, defaultOpen: true, required: true },
    'interview-qa': { visible: true, defaultOpen: false },
    'pain-assessment': { visible: true, defaultOpen: true, required: true },
    'red-flag-screening': { visible: true, defaultOpen: false },
    'current-medications': { visible: true, defaultOpen: false },
  },
};

/** Shared objective section — all current subsections visible by default. */
export const OBJECTIVE_DEFAULTS: SectionTemplateConfig = {
  visible: true,
  subsections: {
    'vital-signs': { visible: true, defaultOpen: true },
    'inspection-palpation': { visible: true, defaultOpen: false },
    'communication-cognition': { visible: true, defaultOpen: false },
    'cardiovascular-pulmonary': { visible: true, defaultOpen: false },
    integumentary: { visible: true, defaultOpen: false },
    musculoskeletal: { visible: true, defaultOpen: true, required: true },
    neuromuscular: { visible: true, defaultOpen: true },
    'standardized-assessments': { visible: true, defaultOpen: false },
    'treatment-performed': { visible: true, defaultOpen: true },
  },
};

/** Shared assessment section. */
export const ASSESSMENT_DEFAULTS: SectionTemplateConfig = {
  visible: true,
  subsections: {
    'primary-impairments': { visible: true, required: true },
    'icf-classification': { visible: true },
    'pt-diagnosis': { visible: true, required: true },
    prognosis: { visible: true },
    'clinical-reasoning': { visible: true, required: true },
  },
};

/** Shared plan section. */
export const PLAN_DEFAULTS: SectionTemplateConfig = {
  visible: true,
  subsections: {
    'visit-parameters': { visible: true },
    'goal-setting': { visible: true, required: true },
    'treatment-narrative': { visible: true },
    'in-clinic-treatment-plan': { visible: true },
    'hep-plan': { visible: true },
    'patient-education': { visible: true },
  },
};

/** Shared billing section. */
export const BILLING_DEFAULTS: SectionTemplateConfig = {
  visible: true,
  subsections: {
    'diagnosis-codes': { visible: true, required: true },
    'cpt-codes': { visible: true, required: true },
    'orders-referrals': { visible: true },
  },
};
