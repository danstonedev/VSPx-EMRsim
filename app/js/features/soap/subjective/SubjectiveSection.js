// SubjectiveSection.js - Comprehensive Subjective Assessment Module
// Handles pain assessment, functional status, and medical history collection

import { textAreaField } from '../../../ui/form-components.js';
import { el } from '../../../ui/utils.js';
import { PainAssessment } from './PainAssessment.js';
import { createInterviewQAPanel } from './SubjectiveQA.js';

/**
 * Creates the complete subjective assessment section with structured pain assessment,
 * functional status evaluation, and comprehensive medical history collection
 * @param {Object} subjectiveData - Current subjective assessment data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete subjective section
 */
export function createSubjectiveSection(subjectiveData, onUpdate) {
  const section = el('div', { class: 'subjective-section' });

  // Initialize data structure if needed
  const data = {
    chiefComplaint: '',
    historyOfPresentIllness: '',
    painLocation: '',
    painScale: '',
    painQuality: '',
    painPattern: '',
    aggravatingFactors: '',
    easingFactors: '',
    functionalLimitations: '',
    priorLevel: '',
    patientGoals: '',
    medicationsCurrent: '',
    redFlags: '',
    additionalHistory: '',
    ...subjectiveData,
  };

  // Update helper
  const updateField = (field, value) => {
    data[field] = value;
    onUpdate(data);
  };

  // History of Present Illness section with anchor (includes Chief Concern)
  const hpiSection = el('div', { id: 'hpi', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'History'),
    textAreaField({
      label: 'Chief Concern',
      value: data.chiefComplaint,
      onChange: (v) => updateField('chiefComplaint', v),
      placeholder: "Primary reason for seeking physical therapy (in patient's own words)...",
    }),
    textAreaField({
      label: 'Detailed history of current condition',
      value: data.historyOfPresentIllness,
      onChange: (v) => updateField('historyOfPresentIllness', v),
      placeholder: 'Include onset, mechanism of injury, previous episodes, progression...',
    }),
  ]);
  section.append(hpiSection);

  // Pain assessment section with anchor - Using improved PainAssessment module
  const painSection = el('div', { id: 'pain-assessment', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Symptoms'),
    PainAssessment.create(data, updateField),
  ]);
  section.append(painSection);

  // Interview Q/A section with anchor — structured open-ended questions
  const qaSection = el('div', { id: 'interview-qa', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Interview Q/A'),
    createInterviewQAPanel(data, (updated) => {
      // Merge qaItems back into data and persist
      data.qaItems = updated.qaItems;
      onUpdate(data);
    }),
  ]);
  section.append(qaSection);

  // Functional status section with anchor
  const functionalSection = el('div', { id: 'functional-status', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Functional Status'),
    textAreaField({
      label: 'Current Functional Limitations',
      value: data.functionalLimitations,
      onChange: (v) => updateField('functionalLimitations', v),
      placeholder: 'Describe specific activities or movements that are limited...',
    }),
    textAreaField({
      label: 'Prior Level of Function',
      value: data.priorLevel,
      onChange: (v) => updateField('priorLevel', v),
      placeholder: "Describe patient's functional level before current episode...",
    }),
    textAreaField({
      label: 'Patient Goals & Expectations',
      value: data.patientGoals,
      onChange: (v) => updateField('patientGoals', v),
      placeholder: 'What does the patient hope to achieve through PT?',
    }),
  ]);
  section.append(functionalSection);

  // Additional history section with anchor
  const additionalHistorySection = el(
    'div',
    { id: 'additional-history', class: 'section-anchor' },
    [
      el('h4', { class: 'subsection-title' }, 'Additional History'),
      textAreaField({
        label: 'Current Medications',
        value: data.medicationsCurrent,
        onChange: (v) => updateField('medicationsCurrent', v),
        placeholder: 'List current medications, dosages, and relevance to condition...',
      }),
      textAreaField({
        label: 'Red Flags/Screening',
        value: data.redFlags,
        onChange: (v) => updateField('redFlags', v),
        placeholder: 'Note any red flags or screening findings...',
      }),
      textAreaField({
        label: 'Additional Relevant History',
        value: data.additionalHistory,
        onChange: (v) => updateField('additionalHistory', v),
        placeholder: 'Include surgical history, imaging results, prior therapy...',
      }),
    ],
  );
  section.append(additionalHistorySection);

  return section;
}
