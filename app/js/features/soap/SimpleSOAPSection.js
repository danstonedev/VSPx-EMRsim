// SimpleSOAPSection.js - Stripped-down SOAP Note with free-text areas
// One textarea per SOAP section: Subjective, Objective, Assessment, Plan

import { textAreaField } from '../../ui/form-components.js';
import { el } from '../../ui/utils.js';

/**
 * Creates a simple SOAP section with a single free-text textarea
 * @param {string} sectionKey - Data key (e.g. 'subjective')
 * @param {string} label - Display label for the textarea
 * @param {string} hint - Placeholder hint text
 * @param {string} value - Current value
 * @param {Function} onChange - Callback when value changes
 * @returns {HTMLElement} Section content element
 */
function createSimpleSection(sectionKey, label, hint, value, onChange) {
  return el('div', { class: 'simple-soap-section' }, [
    textAreaField({
      label,
      value: value || '',
      onChange,
      hint,
      rows: 6,
    }),
  ]);
}

/**
 * Section definitions for Simple SOAP Note
 */
const SIMPLE_SECTIONS = [
  {
    id: 'subjective',
    title: 'Subjective',
    label: 'Subjective',
    hint: "Patient history, chief complaint, symptoms, and relevant background in the patient's own words",
  },
  {
    id: 'objective',
    title: 'Objective',
    label: 'Objective',
    hint: 'Measurable findings: vitals, ROM, strength, gait, palpation, special tests, functional observations',
  },
  {
    id: 'assessment',
    title: 'Assessment',
    label: 'Assessment',
    hint: 'Clinical impression, PT diagnosis, impairments, activity limitations, prognosis, and clinical reasoning',
  },
  {
    id: 'plan',
    title: 'Plan',
    label: 'Plan',
    hint: 'Treatment plan, interventions, goals, frequency/duration, patient education, and referrals',
  },
];

/**
 * Creates all four simple SOAP sections
 * @param {Object} draft - Draft data object (expects draft.simpleSOAP = { subjective, objective, assessment, plan })
 * @param {Function} save - Save function
 * @returns {Array<{id: string, title: string, content: HTMLElement}>} Array of section descriptors
 */
export function createAllSimpleSections(draft, save) {
  // Ensure simpleSOAP data exists
  if (!draft.simpleSOAP) {
    draft.simpleSOAP = { subjective: '', objective: '', assessment: '', plan: '' };
  }

  return SIMPLE_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    content: createSimpleSection(
      section.id,
      section.label,
      section.hint,
      draft.simpleSOAP[section.id],
      (value) => {
        draft.simpleSOAP[section.id] = value;
        save();
      },
    ),
  }));
}

export { SIMPLE_SECTIONS };
