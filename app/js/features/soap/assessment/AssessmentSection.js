// AssessmentSection.js - ICF Framework & Clinical Reasoning Module
// Handles comprehensive assessment using ICF classification and PT diagnosis

import { textAreaField, inputField, selectField } from '../../../ui/form-components.js';
import { el } from '../../../ui/utils.js';

/**
 * Creates the complete assessment section with clinical reasoning
 * @param {Object} assessmentData - Current assessment data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete assessment section
 */
export function createAssessmentSection(assessmentData, onUpdate) {
  const section = el('div', { class: 'assessment-section' });

  // Assessment data should always be an object
  const data = assessmentData || {};

  // Initialize data structure if needed (keep primaryImpairments for backward compat with saved data)
  const finalData = {
    primaryImpairments: '',
    bodyFunctions: '',
    activityLimitations: '',
    participationRestrictions: '',
    ptDiagnosis: '',
    prognosis: '',
    prognosticFactors: '',
    clinicalReasoning: '',
    ...data,
  };

  // Update helper
  const updateField = (field, value) => {
    finalData[field] = value;
    onUpdate(finalData);
  };

  // PT Diagnosis & Prognosis (top of section, includes clinical reasoning)
  const diagnosisSection = el('div', { id: 'pt-diagnosis', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Physical Therapy Diagnosis'),
    inputField({
      label: 'PT Diagnosis / Movement System Diagnosis',
      value: finalData.ptDiagnosis,
      onChange: (v) => updateField('ptDiagnosis', v),
      placeholder: 'e.g., Lumbar extension syndrome with mobility deficits',
    }),
    selectField({
      label: 'Prognosis',
      value: finalData.prognosis,
      options: [
        { value: 'excellent', label: 'Excellent - Full recovery expected' },
        { value: 'good', label: 'Good - Significant improvement expected' },
        { value: 'fair', label: 'Fair - Moderate improvement expected' },
        { value: 'poor', label: 'Poor - Minimal improvement expected' },
        { value: 'guarded', label: 'Guarded - Uncertain outcome' },
      ],
      onChange: (v) => updateField('prognosis', v),
    }),
    textAreaField({
      label: 'Clinical Impression',
      value: finalData.clinicalReasoning,
      onChange: (v) => updateField('clinicalReasoning', v),
      hint: 'Movement system diagnosis, contributing factors, tissue vs. movement-based hypothesis, response to examination findings',
    }),
  ]);
  section.append(diagnosisSection);

  // ICF Classification
  const icfSection = el('div', { id: 'icf-classification', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'ICF Summary'),
    textAreaField({
      label: 'Body Functions, Structures & Impairments',
      value: finalData.bodyFunctions,
      onChange: (v) => updateField('bodyFunctions', v),
      hint: 'ICF b/s codes: muscle strength, joint mobility, pain, sensory integrity, posture, tissue integrity',
    }),
    textAreaField({
      label: 'Activity Limitations',
      value: finalData.activityLimitations,
      onChange: (v) => updateField('activityLimitations', v),
      hint: 'ICF d codes: walking, stairs, transfers, lifting, self-care, driving, occupational tasks',
    }),
    textAreaField({
      label: 'Participation Restrictions',
      value: finalData.participationRestrictions,
      onChange: (v) => updateField('participationRestrictions', v),
      hint: 'Social roles, occupational demands, recreational activities, and community engagement affected by condition',
    }),
  ]);
  section.append(icfSection);

  return section;
}
