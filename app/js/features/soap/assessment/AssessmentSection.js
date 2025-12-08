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
  const data = assessmentData || {
    primaryImpairments: '',
    bodyFunctions: '',
    activityLimitations: '',
    participationRestrictions: '',
    ptDiagnosis: '',
    prognosis: '',
    prognosticFactors: '',
    clinicalReasoning: '',
  };

  // Initialize data structure if needed
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

  // Primary Impairments
  const impairmentSection = el('div', { id: 'primary-impairments', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Primary Impairments'),
    textAreaField({
      label: 'Key Physical Impairments Identified',
      value: finalData.primaryImpairments,
      onChange: (v) => updateField('primaryImpairments', v),
    }),
  ]);
  section.append(impairmentSection);

  // ICF Classification
  const icfSection = el('div', { id: 'icf-classification', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'ICF Classification'),
    textAreaField({
      label: 'Body Functions & Structures',
      value: finalData.bodyFunctions,
      onChange: (v) => updateField('bodyFunctions', v),
    }),
    textAreaField({
      label: 'Activity Limitations',
      value: finalData.activityLimitations,
      onChange: (v) => updateField('activityLimitations', v),
    }),
    textAreaField({
      label: 'Participation Restrictions',
      value: finalData.participationRestrictions,
      onChange: (v) => updateField('participationRestrictions', v),
    }),
  ]);
  section.append(icfSection);

  // PT Diagnosis & Prognosis
  const diagnosisSection = el('div', { id: 'pt-diagnosis', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Physical Therapy Diagnosis & Prognosis'),
    inputField({
      label: 'PT Diagnosis/Movement System Diagnosis',
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
      label: 'Prognostic Factors',
      value: finalData.prognosticFactors,
      onChange: (v) => updateField('prognosticFactors', v),
    }),
  ]);
  section.append(diagnosisSection);

  // Clinical Reasoning
  const reasoningSection = el('div', { id: 'clinical-reasoning', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Clinical Impression'),
    textAreaField({
      label: 'Clinical Reasoning & Hypothesis',
      value: finalData.clinicalReasoning,
      onChange: (v) => updateField('clinicalReasoning', v),
    }),
  ]);
  section.append(reasoningSection);

  return section;
}
