// SubjectiveSection.js - Comprehensive Subjective Assessment Module
// Handles pain assessment, functional status, and medical history collection

import { textAreaField } from '../../../ui/form-components.js';
import { el } from '../../../ui/utils.js';
import { MedicationPanel } from './MedicationPanel.js';
import { PainAssessment } from './PainAssessment.js';
import { RedFlagScreening } from './RedFlagScreening.js';
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

  // History of Present Illness section with anchor (includes Chief Concern, HPI narrative,
  // Interview Q/A, and medical history fields formerly in "Additional History")
  const hpiSection = el('div', { id: 'hpi', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'History'),
    textAreaField({
      label: 'Chief Concern',
      value: data.chiefComplaint,
      onChange: (v) => updateField('chiefComplaint', v),
      hint: "Patient's primary complaint in their own words — avoid paraphrasing or interpreting",
    }),
    textAreaField({
      label: 'History of Present Illness',
      value: data.historyOfPresentIllness,
      onChange: (v) => updateField('historyOfPresentIllness', v),
      hint: 'Onset & mechanism, duration, prior episodes, progression, prior treatments and response',
    }),
    MedicationPanel.create(data, updateField),
    RedFlagScreening.create(data, updateField),
    textAreaField({
      label: 'Additional Relevant History',
      value: data.additionalHistory,
      onChange: (v) => updateField('additionalHistory', v),
      hint: 'Prior surgeries, imaging results, previous PT episodes and response, relevant co-morbidities, family history',
    }),
    // Interview Q/A — structured open-ended questions
    createInterviewQAPanel(data, (updated) => {
      data.qaItems = updated.qaItems;
      onUpdate(data);
    }),
  ]);
  section.append(hpiSection);

  // Functional status section with anchor
  const functionalSection = el('div', { id: 'functional-status', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Functional Status'),
    textAreaField({
      label: 'Current Functional Limitations',
      value: data.functionalLimitations,
      onChange: (v) => updateField('functionalLimitations', v),
      hint: 'Mobility, ADLs, work tasks, recreation, sport — what is limited, avoided, or requires modification',
    }),
    textAreaField({
      label: 'Prior Level of Function',
      value: data.priorLevel,
      onChange: (v) => updateField('priorLevel', v),
      hint: 'Employment status, recreational activities, independence with ADLs prior to this episode',
    }),
    textAreaField({
      label: 'Patient Goals & Expectations',
      value: data.patientGoals,
      onChange: (v) => updateField('patientGoals', v),
      hint: 'Functional outcome goals: specific activities, roles, or performance levels the patient wants to achieve',
    }),
  ]);
  section.append(functionalSection);

  // Pain assessment section with anchor - Using improved PainAssessment module
  const painSection = el('div', { id: 'pain-assessment', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Symptoms'),
    PainAssessment.create(data, updateField),
  ]);
  section.append(painSection);

  return section;
}
