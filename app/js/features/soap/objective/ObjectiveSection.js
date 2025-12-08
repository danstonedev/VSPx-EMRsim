// ObjectiveSection.js - Comprehensive Objective Assessment Module
// Handles systematic clinical examination including inspection, palpation, regional assessments

import { textAreaField, inputField } from '../../../ui/form-components.js';
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
    buildVitalsSection(data.vitals, (field, value) => updateField(`vitals.${field}`, value)),
  );

  section.append(
    buildObservationsSection(data.observations, (field, value) =>
      updateField(`observations.${field}`, value),
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
    vitals: {
      bpSystolic: '',
      bpDiastolic: '',
      hr: '',
      rr: '',
      spo2: '',
      temperature: '',
      heightFt: '',
      heightIn: '',
      weight: '',
      bmi: '',
    },
    observations: {
      generalAppearance: '',
      posture: '',
      gait: '',
    },
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
  data.vitals = data.vitals || {
    bpSystolic: '',
    bpDiastolic: '',
    hr: '',
    rr: '',
    spo2: '',
    temperature: '',
    heightFt: '',
    heightIn: '',
    weight: '',
    bmi: '',
  };
  data.observations = data.observations || {
    generalAppearance: '',
    posture: '',
    gait: '',
  };
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

function buildVitalsSection(vitals, onChange) {
  const container = el('div', { id: 'vital-signs', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Vital Signs'),
  ]);

  const table = el('table', {
    class: 'table combined-neuroscreen-table combined-neuroscreen-table--compact',
  });

  // Header
  const thead = el('thead', { class: 'combined-neuroscreen-thead' });
  const headerRow = el('tr', {}, [
    el(
      'th',
      {
        class: 'combined-neuroscreen-th level-col',
      },
      'Parameter',
    ),
    el('th', { class: 'combined-neuroscreen-th' }, 'Measurement'),
  ]);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

  // Helper for rows
  const createRow = (label, content) => {
    const row = el('tr', { class: 'combined-neuroscreen-row' });
    row.appendChild(
      el(
        'td',
        {
          class: 'combined-neuroscreen-td level-col',
        },
        label,
      ),
    );
    const contentCell = el('td', { class: 'combined-neuroscreen-td' }, content);
    row.appendChild(contentCell);
    return row;
  };

  // BP Row
  const bpContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      placeholder: 'Sys',
      value: vitals.bpSystolic || '',
      onblur: (e) => onChange('bpSystolic', e.target.value),
    }),
    el('span', { class: 'text-muted fw-bold' }, '/'),
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      placeholder: 'Dia',
      value: vitals.bpDiastolic || '',
      onblur: (e) => onChange('bpDiastolic', e.target.value),
    }),
    el('span', { class: 'text-muted' }, 'mmHg'),
  ]);
  tbody.appendChild(createRow('Blood Pressure', bpContent));

  // HR Row
  const hrContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      value: vitals.hr || '',
      onblur: (e) => onChange('hr', e.target.value),
    }),
    el('span', { class: 'text-muted' }, 'bpm'),
  ]);
  tbody.appendChild(createRow('Heart Rate', hrContent));

  // RR Row
  const rrContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      value: vitals.rr || '',
      onblur: (e) => onChange('rr', e.target.value),
    }),
    el('span', { class: 'text-muted' }, 'breaths/min'),
  ]);
  tbody.appendChild(createRow('Respiratory Rate', rrContent));

  // SpO2 Row
  const spo2Content = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      value: vitals.spo2 || '',
      onblur: (e) => onChange('spo2', e.target.value),
    }),
    el('span', { class: 'text-muted' }, '%'),
  ]);
  tbody.appendChild(createRow('SpO2', spo2Content));

  // Temperature Row
  const tempContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      value: vitals.temperature || '',
      onblur: (e) => onChange('temperature', e.target.value),
    }),
    el('span', { class: 'text-muted' }, '°F'),
  ]);
  tbody.appendChild(createRow('Temperature', tempContent));

  // Height Row
  const heightContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
      placeholder: 'ft',
      value: vitals.heightFt || '',
      onblur: (e) => {
        onChange('heightFt', e.target.value);
        updateBMI(e.target.value, vitals.heightIn, vitals.weight);
      },
    }),
    el('span', { class: 'text-muted' }, 'ft'),
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
      placeholder: 'in',
      value: vitals.heightIn || '',
      onblur: (e) => {
        onChange('heightIn', e.target.value);
        updateBMI(vitals.heightFt, e.target.value, vitals.weight);
      },
    }),
    el('span', { class: 'text-muted' }, 'in'),
  ]);
  tbody.appendChild(createRow('Height', heightContent));

  // Weight Row
  const weightContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    el('input', {
      class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
      value: vitals.weight || '',
      onblur: (e) => {
        onChange('weight', e.target.value);
        updateBMI(vitals.heightFt, vitals.heightIn, e.target.value);
      },
    }),
    el('span', { class: 'text-muted' }, 'lbs'),
  ]);
  tbody.appendChild(createRow('Weight', weightContent));

  // BMI Row (Read-only)
  const bmiInput = el('input', {
    class:
      'combined-neuroscreen__input combined-neuroscreen__input--md combined-neuroscreen__input--readonly',
    value: vitals.bmi || '',
    readonly: true,
    disabled: true,
  });
  const bmiContent = el('div', { class: 'combined-neuroscreen-input-group' }, [
    bmiInput,
    el('span', { class: 'text-muted' }, 'kg/m²'),
  ]);
  tbody.appendChild(createRow('BMI', bmiContent));

  // Helper to calculate and update BMI
  const updateBMI = (ft, inch, lbs) => {
    const f = parseFloat(ft);
    const i = parseFloat(inch);
    const w = parseFloat(lbs);

    if (!isNaN(f) && !isNaN(w)) {
      // Convert height to inches
      const totalInches = f * 12 + (isNaN(i) ? 0 : i);
      if (totalInches > 0) {
        // BMI Formula: 703 * weight (lbs) / [height (in)]^2
        const bmiVal = (703 * w) / (totalInches * totalInches);
        const bmiFixed = bmiVal.toFixed(1);
        bmiInput.value = bmiFixed;
        onChange('bmi', bmiFixed);
        return;
      }
    }
    // Clear if invalid
    if (bmiInput.value !== '') {
      bmiInput.value = '';
      onChange('bmi', '');
    }
  };

  table.appendChild(tbody);
  container.appendChild(table);
  return container;
}

function buildObservationsSection(observations, onChange) {
  const container = el('div', { id: 'general-observations', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'General Observations'),
  ]);

  container.append(
    textAreaField({
      label: 'General Appearance',
      hint: 'Mental Status & Affect (e.g., Alert & Oriented x3, Anxious)',
      value: observations.generalAppearance,
      onChange: (v) => onChange('generalAppearance', v),
    }),
    textAreaField({
      label: 'Posture',
      value: observations.posture,
      onChange: (v) => onChange('posture', v),
    }),
    textAreaField({
      label: 'Gait',
      value: observations.gait,
      onChange: (v) => onChange('gait', v),
    }),
  );
  return container;
}
