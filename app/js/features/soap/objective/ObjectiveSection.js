// ObjectiveSection.js - Comprehensive Objective Assessment Module
// Handles systematic clinical examination including inspection, palpation, regional assessments

import { textAreaField } from '../../../ui/form-components.js';
import { createMultiRegionalAssessment } from './RegionalAssessments.js';
import {
  createCombinedNeuroscreenSection,
  getNeuroscreenRegions,
} from './CombinedNeuroscreenSection.js';
import { el } from '../../../ui/utils.js';
import { buildSystemsReview, isSubcatImpaired } from './SystemsReview.js';
import {
  buildTonePanel,
  buildCoordinationPanel,
  buildBalancePanel,
  buildCranialNervesPanel,
  buildEndurancePanel,
  buildEdemaPanel,
  buildAuscultationPanel,
  buildSkinIntegrityPanel,
  buildColorTempPanel,
  buildOrientationPanel,
  buildMemoryAttentionPanel,
  buildSafetyAwarenessPanel,
  buildVisionPerceptionPanel,
  subsectionPanel,
} from './GatedPanels.js';
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

  // ── Gated panel groups ──────────────────────────────────
  // Each gate has a checkFn that returns true when the gate should be visible.
  // Sub-category toggles in Systems Review fire onGateChange (no args)
  // which re-evaluates every gate.
  const gates = [];
  const makeGate = (gateId, checkFn) => {
    const wrapper = el('div', {
      class: 'systems-gate',
      'data-gate': gateId,
    });
    wrapper.hidden = !checkFn();
    gates.push({ el: wrapper, check: checkFn });
    return wrapper;
  };

  const refreshGates = () => {
    for (const g of gates) g.el.hidden = !g.check();
  };

  // ── Always-visible panels ───────────────────────────────
  section.append(
    buildVitalsSection(data.vitals, (field, value) => updateField(`vitals.${field}`, value)),
  );

  // ── Systems Review (gateway triage) ─────────────────────
  section.append(
    buildSystemsReview(
      data.systemsReview || {},
      (updated) => {
        data.systemsReview = updated;
        onUpdate(data);
      },
      refreshGates,
    ),
  );

  // ── Data-driven category definitions ────────────────────
  // Each Systems Review parent maps to a category container.
  // Children are individually gated within the container.
  // To reorder the exam, reorder this array.
  // To add a panel, add one entry to the appropriate category.

  /** Build inline neuroscreen subsection (complex — region selector + tables) */
  const buildNeuroscreenSubsection = () => {
    const content = el('div', { class: 'subsection-panel__content' });
    const anchor = el(
      'div',
      {
        id: 'neurological-screening',
        class: 'subsection-panel',
      },
      [el('h4', { class: 'subsection-panel__title' }, 'Neurological Screening'), content],
    );

    const regionOptions = getNeuroscreenRegions();
    const selectedRegions = new Set(data.neuro.selectedRegions || []);
    const regionSelector = el('div', { class: 'region-selector mb-16' });
    const regionLabel = el('p', { class: 'region-selector__label' }, 'Select regions to assess:');
    const regionButtons = el('div', { class: 'region-buttons' });
    const neuroscreenTableContainer = el('div', { class: 'neuroscreen-table-container' });

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
      regionButtons.appendChild(button);
    });

    regionSelector.appendChild(regionLabel);
    regionSelector.appendChild(regionButtons);
    rebuildTables();

    content.appendChild(regionSelector);
    content.appendChild(neuroscreenTableContainer);
    return anchor;
  };

  const CATEGORIES = [
    {
      id: 'communication-cognition',
      title: 'Communication / Cognition',
      children: [
        {
          gateId: 'comm-orientation',
          system: 'communication',
          sub: 'orientation',
          build: () =>
            buildOrientationPanel(data.orientation, (u) => updateField('orientation', u)),
        },
        {
          gateId: 'comm-memory',
          system: 'communication',
          sub: 'memory',
          build: () =>
            buildMemoryAttentionPanel(data.memoryAttention, (u) =>
              updateField('memoryAttention', u),
            ),
        },
        {
          gateId: 'comm-safety',
          system: 'communication',
          sub: 'safetyAwareness',
          build: () =>
            buildSafetyAwarenessPanel(data.safetyAwareness, (u) =>
              updateField('safetyAwareness', u),
            ),
        },
        {
          gateId: 'comm-vision',
          system: 'communication',
          sub: 'visionPerception',
          build: () =>
            buildVisionPerceptionPanel(data.visionPerception, (u) =>
              updateField('visionPerception', u),
            ),
        },
      ],
    },
    {
      id: 'cardiovascular-pulmonary',
      title: 'Cardiovascular / Pulmonary',
      children: [
        {
          gateId: 'cv-auscultation',
          system: 'cardiovascular',
          sub: 'auscultation',
          build: () =>
            buildAuscultationPanel(data.auscultation, (u) => updateField('auscultation', u)),
        },
        {
          gateId: 'cv-edema',
          system: 'cardiovascular',
          sub: 'edema',
          build: () => buildEdemaPanel(data.edema, (u) => updateField('edema', u)),
        },
        {
          gateId: 'cv-endurance',
          check: () =>
            isSubcatImpaired(data.systemsReview, 'cardiovascular', 'endurance') ||
            isSubcatImpaired(data.systemsReview, 'neuromuscular', 'endurance'),
          build: () => buildEndurancePanel(data.endurance, (u) => updateField('endurance', u)),
        },
      ],
    },
    {
      id: 'integumentary',
      title: 'Integumentary',
      children: [
        {
          gateId: 'integ-skin',
          system: 'integumentary',
          sub: 'skinIntegrity',
          build: () =>
            buildSkinIntegrityPanel(data.skinIntegrity, (u) => updateField('skinIntegrity', u)),
        },
        {
          gateId: 'integ-color',
          system: 'integumentary',
          sub: 'colorTemp',
          build: () => buildColorTempPanel(data.colorTemp, (u) => updateField('colorTemp', u)),
        },
      ],
    },
    {
      id: 'musculoskeletal',
      title: 'Musculoskeletal',
      children: [
        {
          gateId: 'ms-regional',
          check: () =>
            ['rom', 'strength', 'specialTests', 'posture'].some((s) =>
              isSubcatImpaired(data.systemsReview, 'musculoskeletal', s),
            ),
          build: () =>
            buildRegionalSection(
              data.regionalAssessments || {},
              (d) => updateField('regionalAssessments', d),
              data.inspection,
              (v) => updateField('inspection.visual', v),
              data.palpation,
              (v) => updateField('palpation.findings', v),
            ),
        },
      ],
    },
    {
      id: 'neuromuscular',
      title: 'Neuromuscular',
      children: [
        {
          gateId: 'nm-neuroscreen',
          check: () =>
            isSubcatImpaired(data.systemsReview, 'neuromuscular', 'sensation') ||
            isSubcatImpaired(data.systemsReview, 'neuromuscular', 'reflexes'),
          build: buildNeuroscreenSubsection,
        },
        {
          gateId: 'nm-tone',
          system: 'neuromuscular',
          sub: 'tone',
          build: () => buildTonePanel(data.tone, (u) => updateField('tone', u)),
        },
        {
          gateId: 'nm-cranialNerves',
          system: 'neuromuscular',
          sub: 'cranialNerves',
          build: () =>
            buildCranialNervesPanel(data.cranialNerves, (u) => updateField('cranialNerves', u)),
        },
        {
          gateId: 'nm-coordination',
          system: 'neuromuscular',
          sub: 'coordination',
          build: () =>
            buildCoordinationPanel(data.coordination, (u) => updateField('coordination', u)),
        },
        {
          gateId: 'nm-balance',
          system: 'neuromuscular',
          sub: 'balance',
          build: () => buildBalancePanel(data.balance, (u) => updateField('balance', u)),
        },
        {
          gateId: 'nm-gaitMobility',
          system: 'neuromuscular',
          sub: 'gaitMobility',
          build: () =>
            subsectionPanel('functional-movement', 'Functional Movement Assessment', [
              textAreaField({
                label: 'Observations',
                value: data.functional.assessment || '',
                onChange: (v) => updateField('functional.assessment', v),
                hint: 'Transfers, bed mobility, ambulation quality, ADL performance, movement pattern deviations, compensatory strategies',
              }),
            ]),
        },
      ],
    },
  ];

  // ── Generic category builder ────────────────────────────
  // Two-level gating: category hides if no children active,
  // each child hides independently within.
  for (const cat of CATEGORIES) {
    const body = el('div', { class: 'section-panel__body' });
    const container = el('div', { id: cat.id, class: 'section-anchor section-panel' }, [
      el('div', { class: 'section-panel__header' }, [
        el('span', { class: 'section-panel__title' }, cat.title),
      ]),
      body,
    ]);

    const childChecks = [];
    for (const child of cat.children) {
      const checkFn =
        child.check || (() => isSubcatImpaired(data.systemsReview, child.system, child.sub));
      childChecks.push(checkFn);
      const subGate = makeGate(child.gateId, checkFn);
      subGate.append(child.build());
      body.append(subGate);
    }

    const catGate = makeGate(cat.id, () => childChecks.some((fn) => fn()));
    catGate.append(container);
    section.append(catGate);
  }

  // ── Always-visible: Treatment Performed ─────────────────
  const performedHeader = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Treatment Performed'),
  ]);
  const performedBody = el('div', { class: 'section-panel__body' }, [
    textAreaField({
      label: 'Treatment Description',
      value: data.treatmentPerformed.description || '',
      onChange: (v) => updateField('treatmentPerformed.description', v),
      hint: 'Describe all interventions performed: manual therapy, therapeutic exercise, modalities, patient education, parameters, and patient response',
    }),
  ]);
  const performed = el(
    'div',
    { id: 'treatment-performed', class: 'section-anchor section-panel' },
    [performedHeader, performedBody],
  );
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
    systemsReview: { systems: {} },
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
      description: '',
    },
    // Sub-category exam fields (gateway-gated) — objects, not strings
    tone: { entries: [], notes: '' },
    coordination: { tests: {}, notes: '' },
    balance: { notes: '' },
    cranialNerves: { nerves: {}, notes: '' },
    endurance: { notes: '' },
    edema: { entries: [], notes: '' },
    auscultation: { notes: '' },
    skinIntegrity: { wounds: [], notes: '' },
    colorTemp: { findings: [], notes: '' },
    orientation: { person: true, place: true, time: true, situation: true, notes: '' },
    memoryAttention: { notes: '' },
    safetyAwareness: { notes: '' },
    visionPerception: { notes: '' },
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
  data.systemsReview = data.systemsReview || { systems: {} };
  data.functional = data.functional || { assessment: '' };
  data.treatmentPerformed = data.treatmentPerformed || { description: '' };
  // Migrate legacy 4-field format into single description
  if (!data.treatmentPerformed.description) {
    const parts = [
      data.treatmentPerformed.patientEducation &&
        `Patient Education: ${data.treatmentPerformed.patientEducation}`,
      data.treatmentPerformed.modalities && `Modalities: ${data.treatmentPerformed.modalities}`,
      data.treatmentPerformed.therapeuticExercise &&
        `Therapeutic Exercise: ${data.treatmentPerformed.therapeuticExercise}`,
      data.treatmentPerformed.manualTherapy &&
        `Manual Therapy: ${data.treatmentPerformed.manualTherapy}`,
    ].filter(Boolean);
    if (parts.length) data.treatmentPerformed.description = parts.join('\n');
  }
  data.regionalAssessments = data.regionalAssessments || {
    selectedRegions: [],
    rom: {},
    mmt: {},
    specialTests: {},
    prom: {},
    promExcluded: [],
  };

  // Migrate legacy string values to object form for gated panel fields
  const migrateField = (val, defaults) => {
    if (!val || val === '') return { ...defaults };
    if (typeof val === 'string') return { ...defaults, notes: val };
    return { ...defaults, ...val };
  };
  data.tone = migrateField(data.tone, { entries: [], notes: '' });
  data.coordination = migrateField(data.coordination, { tests: {}, notes: '' });
  data.balance = migrateField(data.balance, { notes: '' });
  data.cranialNerves = migrateField(data.cranialNerves, { nerves: {}, notes: '' });
  data.endurance = migrateField(data.endurance, { notes: '' });
  data.edema = migrateField(data.edema, { entries: [], notes: '' });
  data.auscultation = migrateField(data.auscultation, { notes: '' });
  data.skinIntegrity = migrateField(data.skinIntegrity, { wounds: [], notes: '' });
  data.colorTemp = migrateField(data.colorTemp, { findings: [], notes: '' });
  data.orientation = migrateField(data.orientation, {
    person: true,
    place: true,
    time: true,
    situation: true,
    notes: '',
  });
  data.memoryAttention = migrateField(data.memoryAttention, { notes: '' });
  data.safetyAwareness = migrateField(data.safetyAwareness, { notes: '' });
  data.visionPerception = migrateField(data.visionPerception, { notes: '' });

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

function buildRegionalSection(
  regionalAssessments,
  onChange,
  inspection,
  onInspectionChange,
  palpation,
  onPalpationChange,
) {
  const body = el('div', { class: 'subsection-panel__content' });
  const regionalSection = el('div', { id: 'regional-assessment', class: 'subsection-panel' }, [
    el('h4', { class: 'subsection-panel__title' }, 'Regional Assessment'),
    body,
  ]);
  body.append(
    textAreaField({
      label: 'Inspection',
      hint: 'Visual Assessment (swelling, deformity, skin changes, asymmetry)',
      value: inspection?.visual || '',
      onChange: onInspectionChange,
    }),
    textAreaField({
      label: 'Palpation',
      hint: 'Tenderness, Temperature, Muscle Tone, Tissue Quality',
      value: palpation?.findings || '',
      onChange: onPalpationChange,
    }),
  );
  const multiAssessment = createMultiRegionalAssessment(regionalAssessments, onChange);
  body.append(multiAssessment.element);
  return regionalSection;
}

function buildVitalsSection(vitals, onChange) {
  const header = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Vital Signs'),
  ]);
  const body = el('div', { class: 'section-panel__body' });
  const container = el('div', { id: 'vital-signs', class: 'section-anchor section-panel' }, [
    header,
    body,
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
  body.appendChild(table);
  return container;
}
