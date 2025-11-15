// ObjectiveSection.js - Comprehensive Objective Assessment Module
// Handles systematic clinical examination including inspection, palpation, regional assessments

import { textAreaField } from '../../../ui/form-components.js';
import { createMultiRegionalAssessment } from './RegionalAssessments.js';
import {
  createCombinedNeuroscreenSection,
  getNeuroscreenRegions,
} from './CombinedNeuroscreenSection.js';
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
  const neuroscreenAnchor = el('div', {
    id: 'neurological-screening',
    class: 'section-anchor',
  });
  const neuroscreenTitle = el('h4', { class: 'subsection-title' }, 'Neurological Screening');

  // Region selector with buttons (multi-select)
  const regionOptions = getNeuroscreenRegions();
  const selectedRegions = new Set(data.neuro.selectedRegions || []);

  const regionSelector = el('div', { class: 'region-selector mb-16' });
  const regionLabel = el('p', { class: 'region-selector__label' }, 'Select regions to assess:');
  const regionButtons = el('div', { class: 'region-buttons' });
  const buttonsMap = {};

  // Table container
  const neuroscreenTableContainer = el('div', { class: 'neuroscreen-table-container' });

  // Function to rebuild all tables
  const rebuildTables = () => {
    neuroscreenTableContainer.innerHTML = '';
    if (selectedRegions.size === 0) {
      neuroscreenTableContainer.appendChild(
        el(
          'div',
          {
            style:
              'padding: 20px; text-align: center; color: var(--text-muted); background: var(--surface-secondary); border-radius: 6px;',
          },
          'Select one or more regions to assess.',
        ),
      );
      return;
    }

    Array.from(selectedRegions).forEach((regionKey) => {
      const newSection = createCombinedNeuroscreenSection(
        regionKey,
        data.neuro.dermatome || {},
        data.neuro.myotome || {},
        data.neuro.reflex || {},
        (d) => updateField('neuro.dermatome', d),
        (m) => updateField('neuro.myotome', m),
        (r) => updateField('neuro.reflex', r),
      );
      neuroscreenTableContainer.appendChild(newSection.element);
    });
  };

  // Create region buttons
  regionOptions.forEach((region) => {
    const isSelected = selectedRegions.has(region.value);
    const button = el(
      'button',
      {
        type: 'button',
        class: `btn pill-btn region-toggle-btn ${isSelected ? 'primary' : 'secondary'}`,
        onclick: () => {
          if (selectedRegions.has(region.value)) {
            selectedRegions.delete(region.value);
            button.classList.remove('primary');
            button.classList.add('secondary');
          } else {
            selectedRegions.add(region.value);
            button.classList.remove('secondary');
            button.classList.add('primary');
          }
          updateField('neuro.selectedRegions', Array.from(selectedRegions));
          rebuildTables();
        },
      },
      region.label,
    );
    buttonsMap[region.value] = button;
    regionButtons.appendChild(button);
  });

  regionSelector.appendChild(regionLabel);
  regionSelector.appendChild(regionButtons);

  // Initial render
  rebuildTables();

  neuroscreenAnchor.appendChild(neuroscreenTitle);
  neuroscreenAnchor.appendChild(regionSelector);
  neuroscreenAnchor.appendChild(neuroscreenTableContainer);
  section.append(neuroscreenAnchor);

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
    neuro: {
      screening: '',
      selectedRegions: [],
      dermatome: {},
      myotome: {},
      reflex: {},
    },
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
  data.neuro = data.neuro || {
    screening: '',
    selectedRegions: [],
    dermatome: {},
    myotome: {},
    reflex: {},
  };
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
