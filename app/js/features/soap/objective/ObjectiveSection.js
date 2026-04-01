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
import { createStandardizedAssessmentsPanel } from './StandardizedAssessmentsPanel.js';
import { normalizeStandardizedAssessments } from './standardized-assessment-definitions.js';
// CPT widget is intentionally only rendered in BillingSection to avoid duplication

const VITAL_FIELDS = [
  'bpSystolic',
  'bpDiastolic',
  'hr',
  'rr',
  'spo2',
  'temperature',
  'heightFt',
  'heightIn',
  'weight',
  'bmi',
];

function createEmptyVitals() {
  return {
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
}

function normalizeVitalsRecord(vitals = {}) {
  const next = createEmptyVitals();
  for (const field of VITAL_FIELDS) {
    const raw = vitals[field];
    next[field] = raw === undefined || raw === null ? '' : String(raw);
  }
  return next;
}

function generateVitalsEntryId() {
  return `vs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeVitalsSeries(vitals, series) {
  const normalized = Array.isArray(series)
    ? series
        .map((entry, index) => {
          if (!entry || typeof entry !== 'object') return null;
          return {
            id: entry.id || generateVitalsEntryId(),
            label: (entry.label || '').trim() || `Measurement ${index + 1}`,
            time: entry.time || '',
            vitals: normalizeVitalsRecord(entry.vitals || {}),
          };
        })
        .filter(Boolean)
    : [];

  if (normalized.length > 0) return normalized;

  return [
    {
      id: generateVitalsEntryId(),
      label: 'Measurement 1',
      time: '',
      vitals: normalizeVitalsRecord(vitals || {}),
    },
  ];
}

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
    buildVitalsSection(data, (selectedVitals, vitalsSeries, activeId) => {
      data.vitals = normalizeVitalsRecord(selectedVitals);
      data.vitalsSeries = normalizeVitalsSeries(data.vitals, vitalsSeries);
      data.vitalsActiveId = activeId;
      onUpdate(data);
    }),
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
    {
      id: 'standardized-functional',
      title: 'Standardized Functional Assessments',
      children: [
        {
          gateId: 'sfa-assessments',
          check: () => true,
          build: () =>
            createStandardizedAssessmentsPanel(data.standardizedAssessments || [], (u) =>
              updateField('standardizedAssessments', u),
            ),
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
    vitals: createEmptyVitals(),
    vitalsSeries: [],
    vitalsActiveId: '',
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
    standardizedAssessments: [],
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
  data.vitals = normalizeVitalsRecord(data.vitals || {});
  data.vitalsSeries = normalizeVitalsSeries(data.vitals, data.vitalsSeries);
  if (
    !data.vitalsActiveId ||
    !data.vitalsSeries.some((entry) => entry.id === data.vitalsActiveId)
  ) {
    data.vitalsActiveId = data.vitalsSeries[0].id;
  }
  const activeVitals =
    data.vitalsSeries.find((entry) => entry.id === data.vitalsActiveId)?.vitals ||
    data.vitalsSeries[0].vitals;
  data.vitals = normalizeVitalsRecord(activeVitals);
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
  data.standardizedAssessments = normalizeStandardizedAssessments(data.standardizedAssessments);
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

function buildVitalsSection(objectiveData, onChange) {
  let vitalsSeries = normalizeVitalsSeries(objectiveData.vitals, objectiveData.vitalsSeries);
  let activeEntryId =
    objectiveData.vitalsActiveId &&
    vitalsSeries.some((entry) => entry.id === objectiveData.vitalsActiveId)
      ? objectiveData.vitalsActiveId
      : vitalsSeries[0].id;
  let pendingHeaderAction = null;

  const getActiveEntry = () =>
    vitalsSeries.find((entry) => entry.id === activeEntryId) || vitalsSeries[0];

  const createNewMeasurement = (index, preferredLabel = null) => ({
    id: generateVitalsEntryId(),
    label:
      preferredLabel === null
        ? index === 1
          ? 'Measurement 1'
          : index === 2
            ? 'Measurement 2'
            : `Measurement ${index}`
        : preferredLabel,
    time: '',
    vitals: createEmptyVitals(),
  });

  const commitVitals = () => {
    const activeEntry = getActiveEntry();
    onChange(activeEntry.vitals, vitalsSeries, activeEntry.id);
  };

  const addMeasurement = (preferredLabel = '') => {
    const entry = createNewMeasurement(vitalsSeries.length + 1, preferredLabel);
    vitalsSeries = [...vitalsSeries, entry];
    activeEntryId = entry.id;
    renderVitalsTable();
    commitVitals();
  };

  const removeMeasurement = (entryId) => {
    if (vitalsSeries.length <= 1) return;
    vitalsSeries = vitalsSeries.filter((entry) => entry.id !== entryId);
    if (!vitalsSeries.some((entry) => entry.id === activeEntryId)) {
      activeEntryId = vitalsSeries[0].id;
    }
    renderVitalsTable();
    commitVitals();
  };

  const updateMeasurementMeta = (entryId, key, value) => {
    const entry = vitalsSeries.find((item) => item.id === entryId);
    if (!entry) return;
    entry[key] = (value || '').trim();
    activeEntryId = entryId;
    commitVitals();
  };

  const consumePendingHeaderAction = (entryId) => {
    if (pendingHeaderAction === entryId) {
      pendingHeaderAction = null;
      return true;
    }
    return false;
  };

  const updateVitalField = (entryId, field, value) => {
    const entry = vitalsSeries.find((item) => item.id === entryId);
    if (!entry) return;
    entry.vitals[field] = value || '';
    activeEntryId = entryId;
    commitVitals();
  };

  const header = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Vital Signs'),
  ]);
  const body = el('div', { class: 'section-panel__body' });
  const container = el('div', { id: 'vital-signs', class: 'section-anchor section-panel' }, [
    header,
    body,
  ]);

  const tableWrap = el('div', { class: 'vitals-table-scroll' });
  const table = el('table', {
    class: 'table combined-neuroscreen-table combined-neuroscreen-table--compact vitals-flowsheet',
  });

  const rows = [
    {
      label: 'Blood Pressure',
      render: (entry) =>
        el(
          'div',
          { class: 'combined-neuroscreen-input-group vitals-cell-group vitals-cell-group--bp' },
          [
            el('input', {
              class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
              placeholder: 'Sys',
              value: entry.vitals.bpSystolic || '',
              onfocus: () => {
                activeEntryId = entry.id;
              },
              onblur: (e) => updateVitalField(entry.id, 'bpSystolic', e.target.value),
            }),
            el('span', { class: 'text-muted fw-bold' }, '/'),
            el('input', {
              class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
              placeholder: 'Dia',
              value: entry.vitals.bpDiastolic || '',
              onfocus: () => {
                activeEntryId = entry.id;
              },
              onblur: (e) => updateVitalField(entry.id, 'bpDiastolic', e.target.value),
            }),
            el('span', { class: 'text-muted' }, 'mmHg'),
          ],
        ),
    },
    {
      label: 'Heart Rate',
      render: (entry) =>
        el('div', { class: 'combined-neuroscreen-input-group vitals-cell-group' }, [
          el('input', {
            class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
            value: entry.vitals.hr || '',
            onfocus: () => {
              activeEntryId = entry.id;
            },
            onblur: (e) => updateVitalField(entry.id, 'hr', e.target.value),
          }),
          el('span', { class: 'text-muted' }, 'bpm'),
        ]),
    },
    {
      label: 'Respiratory Rate',
      render: (entry) =>
        el('div', { class: 'combined-neuroscreen-input-group vitals-cell-group' }, [
          el('input', {
            class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
            value: entry.vitals.rr || '',
            onfocus: () => {
              activeEntryId = entry.id;
            },
            onblur: (e) => updateVitalField(entry.id, 'rr', e.target.value),
          }),
          el('span', { class: 'text-muted' }, 'breaths/min'),
        ]),
    },
    {
      label: 'SpO2',
      render: (entry) =>
        el('div', { class: 'combined-neuroscreen-input-group vitals-cell-group' }, [
          el('input', {
            class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
            value: entry.vitals.spo2 || '',
            onfocus: () => {
              activeEntryId = entry.id;
            },
            onblur: (e) => updateVitalField(entry.id, 'spo2', e.target.value),
          }),
          el('span', { class: 'text-muted' }, '%'),
        ]),
    },
    {
      label: 'Temperature',
      render: (entry) =>
        el('div', { class: 'combined-neuroscreen-input-group vitals-cell-group' }, [
          el('input', {
            class: 'combined-neuroscreen__input combined-neuroscreen__input--sm',
            value: entry.vitals.temperature || '',
            onfocus: () => {
              activeEntryId = entry.id;
            },
            onblur: (e) => updateVitalField(entry.id, 'temperature', e.target.value),
          }),
          el('span', { class: 'text-muted' }, '°F'),
        ]),
    },
  ];

  const renderVitalsTable = () => {
    table.replaceChildren();

    const thead = el('thead', { class: 'combined-neuroscreen-thead' });
    const headerRow = el('tr', { class: 'combined-neuroscreen-row vitals-header-row' });
    headerRow.appendChild(
      el('th', { class: 'combined-neuroscreen-th level-col vitals-param-col' }, 'Parameter'),
    );

    vitalsSeries.forEach((entry) => {
      const measurementHeader = el(
        'th',
        { class: 'combined-neuroscreen-th vitals-measurement-col' },
        [
          el(
            'div',
            {
              class: 'vitals-col-header-bar' + (vitalsSeries.length > 1 ? ' has-delete' : ''),
            },
            [
              el('input', {
                class: 'combined-neuroscreen__input vitals-col-name',
                placeholder: 'Checkpoint name',
                value: entry.label || '',
                onfocus: () => {
                  activeEntryId = entry.id;
                },
                onblur: (e) => {
                  if (consumePendingHeaderAction(entry.id)) return;
                  updateMeasurementMeta(entry.id, 'label', e.target.value);
                },
              }),
              ...(vitalsSeries.length > 1
                ? [
                    el(
                      'button',
                      {
                        type: 'button',
                        class: 'remove-btn vitals-delete-inline-btn',
                        'aria-label': 'Delete checkpoint column',
                        title: 'Delete this checkpoint column',
                        onpointerdown: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          pendingHeaderAction = entry.id;
                          removeMeasurement(entry.id);
                        },
                        onclick: (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (consumePendingHeaderAction(entry.id)) return;
                          removeMeasurement(entry.id);
                        },
                      },
                      '×',
                    ),
                  ]
                : []),
            ],
          ),
        ],
      );
      headerRow.appendChild(measurementHeader);
    });

    headerRow.appendChild(
      el('th', { class: 'combined-neuroscreen-th vitals-add-col' }, [
        el(
          'button',
          {
            type: 'button',
            class: 'compact-add-btn vitals-add-inline-btn',
            'aria-label': 'Add checkpoint column',
            title: 'Add blank checkpoint column',
            onclick: () => addMeasurement(''),
          },
          '+',
        ),
      ]),
    );

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });
    rows.forEach((rowDef) => {
      const row = el('tr', { class: 'combined-neuroscreen-row' });
      row.appendChild(
        el('td', { class: 'combined-neuroscreen-td level-col vitals-param-col' }, rowDef.label),
      );
      vitalsSeries.forEach((entry) => {
        row.appendChild(
          el('td', { class: 'combined-neuroscreen-td vitals-value-col' }, rowDef.render(entry)),
        );
      });
      row.appendChild(el('td', { class: 'combined-neuroscreen-td vitals-add-col-spacer' }, ''));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  };

  tableWrap.appendChild(table);
  body.append(tableWrap);
  renderVitalsTable();
  return container;
}
