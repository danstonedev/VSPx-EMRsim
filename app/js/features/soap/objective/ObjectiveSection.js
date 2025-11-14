// ObjectiveSection.js - Comprehensive Objective Assessment Module
// Handles systematic clinical examination including inspection, palpation, regional assessments

import { textAreaField } from '../../../ui/form-components.js';
import { createMultiRegionalAssessment } from './RegionalAssessments.js';
import { el } from '../../../ui/utils.js';
// CPT widget is intentionally only rendered in BillingSection to avoid duplication

/**
 * Creates the complete objective assessment section with systematic examination approach
 * @param {Object} objectiveData - Current objective assessment data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete objective section
 */
export function createObjectiveSection(objectiveData, onUpdate) {
  const section = el('div', { class: 'objective-section' });

  const data = normalizeObjectiveData(objectiveData);
  const updateField = makeUpdateField(data, onUpdate);

  // Systematic examination approach
  section.append(
    buildTextAreaSection(
      'general-observations',
      'General Observations & Vital Signs',
      'Posture, Gait, Appearance, Vitals',
      data.text,
      (v) => updateField('text', v),
    ),
  );

  // Inspection
  section.append(
    buildTextAreaSection(
      'inspection',
      'Inspection',
      'Visual Assessment (swelling, deformity, skin changes, asymmetry)',
      data.inspection.visual || '',
      (v) => updateField('inspection.visual', v),
    ),
  );

  // Palpation
  section.append(
    buildTextAreaSection(
      'palpation',
      'Palpation',
      'Tenderness, Temperature, Muscle Tone, Tissue Quality',
      data.palpation.findings || '',
      (v) => updateField('palpation.findings', v),
    ),
  );

  // Regional Assessment
  section.append(
    buildRegionalSection(data.regionalAssessments || {}, (assessmentData) =>
      updateField('regionalAssessments', assessmentData),
    ),
  );

  // Neurological screening
  section.append(
    buildTextAreaSection(
      'neurological-screening',
      'Neurological Screening',
      'Reflexes, Sensation, Dermatomes, Myotomes, Neural Tension',
      data.neuro.screening || '',
      (v) => updateField('neuro.screening', v),
    ),
  );

  // Functional movement assessment
  section.append(
    buildTextAreaSection(
      'functional-movement',
      'Functional Movement Assessment',
      'Transfers, Ambulation, ADL Performance, Movement Patterns',
      data.functional.assessment || '',
      (v) => updateField('functional.assessment', v),
    ),
  );

  // Treatment Performed subsection
  const performed = el('div', { id: 'treatment-performed', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Treatment Performed'),
    textAreaField({
      label: 'Patient Education',
      value: data.treatmentPerformed.patientEducation || '',
      onChange: (v) => updateField('treatmentPerformed.patientEducation', v),
    }),
    textAreaField({
      label: 'Modalities',
      value: data.treatmentPerformed.modalities || '',
      onChange: (v) => updateField('treatmentPerformed.modalities', v),
    }),
    textAreaField({
      label: 'Therapeutic Exercise',
      value: data.treatmentPerformed.therapeuticExercise || '',
      onChange: (v) => updateField('treatmentPerformed.therapeuticExercise', v),
    }),
    textAreaField({
      label: 'Manual Therapy',
      value: data.treatmentPerformed.manualTherapy || '',
      onChange: (v) => updateField('treatmentPerformed.manualTherapy', v),
    }),
  ]);
  section.append(performed);

  // CPT Codes widget is rendered only in BillingSection to ensure single source of truth
  return section;
}

function normalizeObjectiveData(obj = {}) {
  const base = {
    text: '',
    inspection: { visual: '' },
    palpation: { findings: '' },
    neuro: { screening: '' },
    functional: { assessment: '' },
    regionalAssessments: {
      selectedRegions: [],
      rom: {},
      mmt: {},
      specialTests: {},
      prom: {},
      promExcluded: [],
    },
    treatmentPerformed: {
      patientEducation: '',
      modalities: '',
      therapeuticExercise: '',
      manualTherapy: '',
    },
  };
  const data = { ...base, ...obj };
  data.inspection = data.inspection || { visual: '' };
  data.palpation = data.palpation || { findings: '' };
  data.neuro = data.neuro || { screening: '' };
  data.functional = data.functional || { assessment: '' };
  data.treatmentPerformed = data.treatmentPerformed || {
    patientEducation: '',
    modalities: '',
    therapeuticExercise: '',
    manualTherapy: '',
  };
  data.regionalAssessments = data.regionalAssessments || {
    selectedRegions: [],
    rom: {},
    mmt: {},
    specialTests: {},
    prom: {},
    promExcluded: [],
  };
  return data;
}

function makeUpdateField(data, onUpdate) {
  return (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!data[parent]) data[parent] = {};
      data[parent][child] = value;
    } else {
      data[field] = value;
    }
    onUpdate(data);
  };
}

function buildTextAreaSection(id, title, label, value, onChange) {
  return el('div', { id, class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, title),
    textAreaField({ label, value, onChange }),
  ]);
}

function buildRegionalSection(regionalAssessments, onChange) {
  console.log('=== BUILD REGIONAL SECTION CALLED ===', regionalAssessments);
  const regionalSection = el('div', { id: 'regional-assessment', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Regional Assessment'),
  ]);
  console.log('=== ABOUT TO CALL createMultiRegionalAssessment ===');
  const multiAssessment = createMultiRegionalAssessment(regionalAssessments, onChange);
  regionalSection.append(multiAssessment.element);
  return regionalSection;
}
