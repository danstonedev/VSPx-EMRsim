// GatedPanels.js — Structured exam panels gated by Systems Review sub-categories
// Each builder returns a section-panel element for a specific clinical assessment area.

import { el } from '../../../ui/utils.js';
import { textAreaField } from '../../../ui/form-components.js';

// ── Option constants ──────────────────────────────────────
const SIDES = [
  { value: '', label: 'Side' },
  { value: 'L', label: 'Left' },
  { value: 'R', label: 'Right' },
  { value: 'B', label: 'Bilateral' },
];

const MAS_GRADES = [
  { value: '', label: 'Grade' },
  { value: '0', label: '0 — No increase' },
  { value: '1', label: '1 — Slight increase' },
  { value: '1+', label: '1+ — Catch & release' },
  { value: '2', label: '2 — More marked' },
  { value: '3', label: '3 — Considerable' },
  { value: '4', label: '4 — Rigid' },
];

const COORD_RESULT = [
  { value: '', label: '—' },
  { value: 'N', label: 'Normal' },
  { value: 'A', label: 'Abnormal' },
];

const CN_RESULT = [
  { value: '', label: '—' },
  { value: 'intact', label: 'Intact' },
  { value: 'impaired', label: 'Impaired' },
];

const PITTING = [
  { value: '', label: 'Grade' },
  { value: '0', label: '0 — None' },
  { value: '1+', label: '1+ — Trace (2 mm)' },
  { value: '2+', label: '2+ — Mild (4 mm)' },
  { value: '3+', label: '3+ — Moderate (6 mm)' },
  { value: '4+', label: '4+ — Severe (8 mm)' },
];

const WOUND_STAGES = [
  { value: '', label: 'Stage' },
  { value: 'I', label: 'Stage I' },
  { value: 'II', label: 'Stage II' },
  { value: 'III', label: 'Stage III' },
  { value: 'IV', label: 'Stage IV' },
  { value: 'unstageable', label: 'Unstageable' },
  { value: 'dti', label: 'Deep Tissue Injury' },
];

const DRAINAGE = [
  { value: '', label: 'Drainage' },
  { value: 'none', label: 'None' },
  { value: 'serous', label: 'Serous' },
  { value: 'sanguinous', label: 'Sanguinous' },
  { value: 'serosanguinous', label: 'Serosanguinous' },
  { value: 'purulent', label: 'Purulent' },
];

const ROMBERG = [
  { value: '', label: 'Select...' },
  { value: 'negative', label: 'Negative (Normal)' },
  { value: 'positive', label: 'Positive (Abnormal)' },
];

const ENDURANCE_TESTS = [
  { value: '', label: 'Select...' },
  { value: '6MWT', label: '6-Minute Walk Test' },
  { value: '2MWT', label: '2-Minute Walk Test' },
  { value: '2MST', label: '2-Minute Step Test' },
  { value: 'other', label: 'Other' },
];

const HEART_SOUNDS = [
  { value: '', label: 'Select...' },
  { value: 'normalS1S2', label: 'Normal S1/S2' },
  { value: 'murmur', label: 'Murmur Present' },
  { value: 'gallop', label: 'Gallop (S3/S4)' },
  { value: 'irregular', label: 'Irregular Rhythm' },
  { value: 'rub', label: 'Pericardial Rub' },
  { value: 'distant', label: 'Distant / Muffled' },
];

const LUNG_SOUNDS = [
  { value: '', label: 'Select...' },
  { value: 'clear', label: 'Clear' },
  { value: 'crackles', label: 'Crackles' },
  { value: 'wheezes', label: 'Wheezes' },
  { value: 'rhonchi', label: 'Rhonchi' },
  { value: 'stridor', label: 'Stridor' },
  { value: 'diminished', label: 'Diminished' },
  { value: 'absent', label: 'Absent' },
];

const COLOR_FINDINGS = [
  { id: 'erythema', label: 'Erythema' },
  { id: 'pallor', label: 'Pallor' },
  { id: 'cyanosis', label: 'Cyanosis' },
  { id: 'mottling', label: 'Mottling' },
  { id: 'ecchymosis', label: 'Ecchymosis' },
  { id: 'jaundice', label: 'Jaundice' },
];

const TEMP_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'normal', label: 'Normal' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'hot', label: 'Hot' },
];

const ALERTNESS = [
  { value: '', label: 'Select...' },
  { value: 'alert', label: 'Alert' },
  { value: 'lethargic', label: 'Lethargic' },
  { value: 'obtunded', label: 'Obtunded' },
  { value: 'stuporous', label: 'Stuporous' },
  { value: 'comatose', label: 'Comatose' },
];

const SEVERITY_3 = [
  { value: '', label: 'Select...' },
  { value: 'intact', label: 'Intact' },
  { value: 'impaired', label: 'Impaired' },
  { value: 'unable', label: 'Unable to Assess' },
];

const ATTENTION = [
  { value: '', label: 'Select...' },
  { value: 'normal', label: 'Normal' },
  { value: 'decreased', label: 'Decreased' },
  { value: 'severelyImpaired', label: 'Severely Impaired' },
];

const COMMANDS = [
  { value: '', label: 'Select...' },
  { value: 'withEase', label: 'Follows with ease' },
  { value: 'withRepetition', label: 'With repetition' },
  { value: 'unable', label: 'Unable' },
];

const SUPERVISION = [
  { value: '', label: 'Select...' },
  { value: 'independent', label: 'Independent' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'cga', label: 'Contact Guard Assist' },
  { value: 'minAssist', label: 'Min Assist' },
  { value: 'modAssist', label: 'Mod Assist' },
  { value: 'maxAssist', label: 'Max Assist' },
  { value: 'dependent', label: 'Dependent' },
];

const INTACT_IMPAIRED = [
  { value: '', label: 'Select...' },
  { value: 'intact', label: 'Intact' },
  { value: 'impaired', label: 'Impaired' },
];

const IMPULSIVITY = [
  { value: '', label: 'Select...' },
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const AWARENESS = [
  { value: '', label: 'Select...' },
  { value: 'aware', label: 'Aware' },
  { value: 'partiallyAware', label: 'Partially Aware' },
  { value: 'unaware', label: 'Unaware' },
];

const FALL_RISK = [
  { value: '', label: 'Select...' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
];

const VF_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'intact', label: 'Intact' },
  { value: 'leftHH', label: 'Left Homonymous Hemianopsia' },
  { value: 'rightHH', label: 'Right Homonymous Hemianopsia' },
  { value: 'bilateral', label: 'Bilateral Deficit' },
  { value: 'other', label: 'Other' },
];

const NEGLECT = [
  { value: '', label: 'Select...' },
  { value: 'none', label: 'None' },
  { value: 'left', label: 'Left Neglect' },
  { value: 'right', label: 'Right Neglect' },
];

// ── Clinical reference data ───────────────────────────────
const CRANIAL_NERVES = [
  { id: 'I', name: 'Olfactory', test: 'Smell identification' },
  { id: 'II', name: 'Optic', test: 'Visual acuity / fields' },
  { id: 'III', name: 'Oculomotor', test: 'Pupil reaction, eye mvmt' },
  { id: 'IV', name: 'Trochlear', test: 'Down & inward gaze' },
  { id: 'V', name: 'Trigeminal', test: 'Facial sensation, jaw' },
  { id: 'VI', name: 'Abducens', test: 'Lateral gaze' },
  { id: 'VII', name: 'Facial', test: 'Expression, taste' },
  { id: 'VIII', name: 'Vestibulocochlear', test: 'Hearing, balance' },
  { id: 'IX', name: 'Glossopharyngeal', test: 'Gag reflex, swallow' },
  { id: 'X', name: 'Vagus', test: 'Phonation, "ahh"' },
  { id: 'XI', name: 'Accessory', test: 'Shrug, head turn' },
  { id: 'XII', name: 'Hypoglossal', test: 'Tongue protrusion' },
];

const COORD_TESTS = [
  { id: 'fingerToNose', label: 'Finger-to-Nose' },
  { id: 'heelToShin', label: 'Heel-to-Shin' },
  { id: 'ram', label: 'Rapid Alternating Movements' },
  { id: 'fingerTapping', label: 'Finger Tapping' },
  { id: 'rebound', label: 'Rebound Test' },
];

// ── Shared helpers ────────────────────────────────────────

/** Subsection panel — lightweight inner wrapper used inside category containers */
export function subsectionPanel(id, title, children) {
  const panelChildren = [];
  if (title) {
    panelChildren.push(el('h4', { class: 'subsection-panel__title' }, title));
  }
  panelChildren.push(el('div', { class: 'subsection-panel__content' }, children));
  return el('div', { id, class: 'subsection-panel' }, panelChildren);
}

function compactSelect(value, options, onChange) {
  const s = document.createElement('select');
  s.className = 'combined-neuroscreen__input';
  options.forEach((opt) => {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === (value || '')) o.selected = true;
    s.appendChild(o);
  });
  s.addEventListener('change', (e) => onChange(e.target.value));
  return s;
}

function compactInput(value, placeholder, onChange, style) {
  return el('input', {
    class: 'combined-neuroscreen__input combined-neuroscreen__input--md',
    style: style || '',
    placeholder,
    value: value || '',
    onblur: (e) => onChange(e.target.value),
  });
}

function metricField(label, value, unitText, onChange) {
  return el('div', { class: 'gated-metric' }, [
    el('span', { class: 'gated-metric__label' }, label),
    el(
      'div',
      { class: 'gated-metric__row' },
      [
        compactInput(value, '', onChange),
        unitText ? el('span', { class: 'gated-metric__unit' }, unitText) : null,
      ].filter(Boolean),
    ),
  ]);
}

function metricSelect(label, value, options, onChange) {
  return el('div', { class: 'gated-metric' }, [
    el('span', { class: 'gated-metric__label' }, label),
    compactSelect(value, options, onChange),
  ]);
}

function notesField(value, onChange) {
  const field = textAreaField({
    label: 'Notes',
    value: value || '',
    onChange,
    rows: 1,
    className: 'gated-notes__textarea',
  });
  const textarea = field.querySelector('textarea');
  if (textarea) textarea.setAttribute('data-max-rows', '5');
  return el('div', { class: 'gated-notes' }, [field]);
}

function childCard(title, children) {
  return el('div', { class: 'gated-card' }, [
    el('div', { class: 'gated-card__header' }, [el('span', {}, title)]),
    ...children,
  ]);
}

function removeBtn(onClick) {
  return el('button', { type: 'button', class: 'gated-remove-btn', onclick: onClick }, '×');
}

function addBtn(label, onClick) {
  return el(
    'button',
    { type: 'button', class: 'btn btn--sm secondary gated-add-btn', onclick: onClick },
    label,
  );
}

function emptyState(text) {
  return el('div', { class: 'gated-empty' }, text);
}

function tableShell(headers) {
  const table = el('table', {
    class: 'table combined-neuroscreen-table combined-neuroscreen-table--compact',
  });
  const thead = el('thead', { class: 'combined-neuroscreen-thead' });
  const tr = el('tr');
  headers.forEach((h) => tr.appendChild(el('th', { class: 'combined-neuroscreen-th' }, h)));
  thead.appendChild(tr);
  table.appendChild(thead);
  return table;
}

function tableRow(cells) {
  const tr = el('tr', { class: 'combined-neuroscreen-row' });
  cells.forEach((c) => {
    const td = el('td', { class: 'combined-neuroscreen-td' });
    if (typeof c === 'string') td.textContent = c;
    else if (c) td.appendChild(c);
    tr.appendChild(td);
  });
  return tr;
}

// ── Panel 1: Tone Assessment (Modified Ashworth Scale) ────
export function buildTonePanel(data, onChange) {
  if (!data.entries) data.entries = [];

  const listContainer = el('div');
  const render = () => {
    listContainer.innerHTML = '';
    if (data.entries.length === 0) {
      listContainer.appendChild(emptyState('No muscle groups assessed yet.'));
      return;
    }
    const table = tableShell(['Muscle Group', 'Side', 'MAS Grade', '']);
    const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });
    data.entries.forEach((entry, i) => {
      tbody.appendChild(
        tableRow([
          compactInput(entry.muscle, 'e.g. Biceps', (v) => {
            entry.muscle = v;
            onChange(data);
          }),
          compactSelect(entry.side, SIDES, (v) => {
            entry.side = v;
            onChange(data);
          }),
          compactSelect(entry.grade, MAS_GRADES, (v) => {
            entry.grade = v;
            onChange(data);
          }),
          removeBtn(() => {
            data.entries.splice(i, 1);
            onChange(data);
            render();
          }),
        ]),
      );
    });
    table.appendChild(tbody);
    listContainer.appendChild(table);
  };

  render();

  return subsectionPanel('tone-assessment', '', [
    childCard('Tone Assessment', [
      listContainer,
      addBtn('+ Add Muscle Group', () => {
        data.entries.push({ muscle: '', side: '', grade: '' });
        onChange(data);
        render();
      }),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 2: Coordination & Motor Control ─────────────────
export function buildCoordinationPanel(data, onChange) {
  if (!data.tests) data.tests = {};
  COORD_TESTS.forEach((t) => {
    if (!data.tests[t.id]) data.tests[t.id] = { L: '', R: '' };
  });

  const table = tableShell(['Test', 'Left', 'Right']);
  const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

  COORD_TESTS.forEach((test) => {
    const entry = data.tests[test.id];
    tbody.appendChild(
      tableRow([
        test.label,
        compactSelect(entry.L, COORD_RESULT, (v) => {
          entry.L = v;
          onChange(data);
        }),
        compactSelect(entry.R, COORD_RESULT, (v) => {
          entry.R = v;
          onChange(data);
        }),
      ]),
    );
  });

  table.appendChild(tbody);

  return subsectionPanel('coordination-assessment', '', [
    childCard('Coordination & Motor Control', [
      table,
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 3: Balance Assessment ───────────────────────────
export function buildBalancePanel(data, onChange) {
  const u = (field) => (v) => {
    data[field] = v;
    onChange(data);
  };

  return subsectionPanel('balance-assessment', '', [
    childCard('Balance Assessment', [
      el('div', { class: 'gated-grid' }, [
        metricField('Berg Balance Scale', data.berg, '/56', u('berg')),
        metricField('Timed Up & Go', data.tug, 'sec', u('tug')),
        metricField('Single Leg Stance — L', data.singleLegL, 'sec', u('singleLegL')),
        metricField('Single Leg Stance — R', data.singleLegR, 'sec', u('singleLegR')),
        metricSelect('Romberg Test', data.romberg, ROMBERG, u('romberg')),
        metricField('Functional Reach', data.functionalReach, 'in', u('functionalReach')),
        metricField('Dynamic Gait Index', data.dgi, '/24', u('dgi')),
        metricField('ABC Scale', data.abcScale, '%', u('abcScale')),
      ]),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 4: Cranial Nerve Screening ──────────────────────
export function buildCranialNervesPanel(data, onChange) {
  if (!data.nerves) data.nerves = {};
  CRANIAL_NERVES.forEach((cn) => {
    if (data.nerves[cn.id] === undefined) data.nerves[cn.id] = '';
  });

  const table = tableShell(['CN', 'Name', 'Test', 'Result']);
  const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

  CRANIAL_NERVES.forEach((cn) => {
    tbody.appendChild(
      tableRow([
        cn.id,
        cn.name,
        cn.test,
        compactSelect(data.nerves[cn.id], CN_RESULT, (v) => {
          data.nerves[cn.id] = v;
          onChange(data);
        }),
      ]),
    );
  });

  table.appendChild(tbody);

  return subsectionPanel('cranial-nerves', '', [
    childCard('Cranial Nerve Screening', [
      table,
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 5: Endurance / Exercise Tolerance ───────────────
export function buildEndurancePanel(data, onChange) {
  const u = (field) => (v) => {
    data[field] = v;
    onChange(data);
  };

  const enduranceCard = el('div', { class: 'gated-card' }, [
    el('div', { class: 'gated-card__header' }, [el('span', {}, 'Endurance / Exercise Tolerance')]),
    el('div', { class: 'gated-grid' }, [
      metricSelect('Test Used', data.testUsed, ENDURANCE_TESTS, u('testUsed')),
      metricField('Distance', data.distance, 'm', u('distance')),
      metricField('RPE (Borg)', data.rpe, '/20', u('rpe')),
      metricField('HR — Rest', data.hrRest, 'bpm', u('hrRest')),
      metricField('HR — Peak', data.hrPeak, 'bpm', u('hrPeak')),
      metricField('Recovery Time', data.recoveryMin, 'min', u('recoveryMin')),
      metricField('SpO\u2082 — Rest', data.spo2Rest, '%', u('spo2Rest')),
      metricField('SpO\u2082 — Lowest', data.spo2Low, '%', u('spo2Low')),
    ]),
    notesField(data.notes, (v) => {
      data.notes = v;
      onChange(data);
    }),
  ]);

  return subsectionPanel('endurance-assessment', '', [enduranceCard]);
}

// ── Panel 6: Edema Assessment ─────────────────────────────
export function buildEdemaPanel(data, onChange) {
  if (!data.entries) data.entries = [];

  const listContainer = el('div');
  const render = () => {
    listContainer.innerHTML = '';
    if (data.entries.length === 0) {
      listContainer.appendChild(emptyState('No edema measurements recorded.'));
      return;
    }
    data.entries.forEach((entry, i) => {
      const measurementCard = el('div', { class: 'gated-card' }, [
        el('div', { class: 'gated-card__header' }, [
          el('span', {}, `Measurement #${i + 1}`),
          removeBtn(() => {
            data.entries.splice(i, 1);
            onChange(data);
            render();
          }),
        ]),
        el('div', { class: 'gated-grid' }, [
          el('div', { class: 'gated-metric' }, [
            el('span', { class: 'gated-metric__label' }, 'Location'),
            compactInput(entry.location, 'e.g. Ankle', (v) => {
              entry.location = v;
              onChange(data);
            }),
          ]),
          metricSelect('Side', entry.side, SIDES, (v) => {
            entry.side = v;
            onChange(data);
          }),
          metricSelect('Pitting', entry.pitting, PITTING, (v) => {
            entry.pitting = v;
            onChange(data);
          }),
          metricField('Circumference (cm)', entry.circumference, '', (v) => {
            entry.circumference = v;
            onChange(data);
          }),
        ]),
      ]);
      listContainer.appendChild(measurementCard);
    });
  };

  render();

  const edemaCard = el('div', { class: 'gated-card' }, [
    el('div', { class: 'gated-card__header' }, [el('span', {}, 'Edema Assessment')]),
    listContainer,
    addBtn('+ Add Measurement', () => {
      data.entries.push({
        location: '',
        side: '',
        pitting: '',
        circumference: '',
      });
      onChange(data);
      render();
    }),
    notesField(data.notes, (v) => {
      data.notes = v;
      onChange(data);
    }),
  ]);

  return subsectionPanel('edema-assessment', '', [edemaCard]);
}

// ── Panel 7: Auscultation ─────────────────────────────────
export function buildAuscultationPanel(data, onChange) {
  const u = (field) => (v) => {
    data[field] = v;
    onChange(data);
  };

  const table = el('table', {
    class: 'table combined-neuroscreen-table combined-neuroscreen-table--compact',
  });
  const thead = el('thead', { class: 'combined-neuroscreen-thead' });
  thead.appendChild(
    el('tr', {}, [
      el('th', { class: 'combined-neuroscreen-th level-col' }, 'Sounds'),
      el('th', { class: 'combined-neuroscreen-th' }, 'Finding'),
    ]),
  );
  table.appendChild(thead);

  const makeRow = (label, value, options, onSelect) => {
    const row = el('tr', { class: 'combined-neuroscreen-row' });
    row.appendChild(el('td', { class: 'combined-neuroscreen-td level-col' }, label));
    const cell = el('td', { class: 'combined-neuroscreen-td' });
    cell.appendChild(compactSelect(value, options, onSelect));
    row.appendChild(cell);
    return row;
  };

  const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });
  tbody.appendChild(makeRow('Heart', data.heartSounds, HEART_SOUNDS, u('heartSounds')));
  tbody.appendChild(makeRow('Left Lung', data.lungLeft, LUNG_SOUNDS, u('lungLeft')));
  tbody.appendChild(makeRow('Right Lung', data.lungRight, LUNG_SOUNDS, u('lungRight')));
  table.appendChild(tbody);

  const containedContent = el('div', { class: 'gated-card' }, [
    el('div', { class: 'gated-card__header' }, [el('span', {}, 'Auscultation')]),
    table,
    notesField(data.notes, (v) => {
      data.notes = v;
      onChange(data);
    }),
  ]);

  return subsectionPanel('auscultation-assessment', '', [containedContent]);
}

// ── Panel 8: Skin Integrity (wound cards) ─────────────────
export function buildSkinIntegrityPanel(data, onChange) {
  if (!data.wounds) data.wounds = [];

  const listContainer = el('div');
  const render = () => {
    listContainer.innerHTML = '';
    if (data.wounds.length === 0) {
      listContainer.appendChild(emptyState('No wounds documented.'));
      return;
    }
    data.wounds.forEach((wound, i) => {
      const card = el('div', { class: 'gated-card' }, [
        el('div', { class: 'gated-card__header' }, [
          el('span', {}, `Wound #${i + 1}`),
          removeBtn(() => {
            data.wounds.splice(i, 1);
            onChange(data);
            render();
          }),
        ]),
        el('div', { class: 'gated-grid' }, [
          el('div', { class: 'gated-metric', style: 'grid-column: 1 / -1;' }, [
            el('span', { class: 'gated-metric__label' }, 'Location'),
            compactInput(wound.location, 'e.g. Sacrum, L lateral malleolus', (v) => {
              wound.location = v;
              onChange(data);
            }),
          ]),
          el('div', { class: 'gated-metric' }, [
            el('span', { class: 'gated-metric__label' }, 'Size (cm)'),
            el('div', { class: 'gated-metric__row' }, [
              compactInput(
                wound.length,
                'L',
                (v) => {
                  wound.length = v;
                  onChange(data);
                },
                'max-width:60px',
              ),
              el('span', { class: 'gated-metric__unit' }, '×'),
              compactInput(
                wound.width,
                'W',
                (v) => {
                  wound.width = v;
                  onChange(data);
                },
                'max-width:60px',
              ),
              el('span', { class: 'gated-metric__unit' }, '×'),
              compactInput(
                wound.depth,
                'D',
                (v) => {
                  wound.depth = v;
                  onChange(data);
                },
                'max-width:60px',
              ),
              el('span', { class: 'gated-metric__unit' }, 'cm'),
            ]),
          ]),
          metricSelect('Stage', wound.stage, WOUND_STAGES, (v) => {
            wound.stage = v;
            onChange(data);
          }),
          metricSelect('Drainage', wound.drainage, DRAINAGE, (v) => {
            wound.drainage = v;
            onChange(data);
          }),
        ]),
      ]);
      listContainer.appendChild(card);
    });
  };

  render();

  return subsectionPanel('skin-integrity', '', [
    childCard('Skin Integrity', [
      listContainer,
      addBtn('+ Add Wound', () => {
        data.wounds.push({
          location: '',
          length: '',
          width: '',
          depth: '',
          stage: '',
          drainage: '',
        });
        onChange(data);
        render();
      }),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 9: Color & Temperature ──────────────────────────
export function buildColorTempPanel(data, onChange) {
  if (!Array.isArray(data.findings)) data.findings = [];

  const pills = el('div', { class: 'finding-pills' });

  COLOR_FINDINGS.forEach((f) => {
    const isActive = data.findings.includes(f.id);
    const btn = el(
      'button',
      {
        type: 'button',
        class: `finding-pill${isActive ? ' finding-pill--on' : ''}`,
        onclick: () => {
          const idx = data.findings.indexOf(f.id);
          if (idx >= 0) {
            data.findings.splice(idx, 1);
            btn.classList.remove('finding-pill--on');
          } else {
            data.findings.push(f.id);
            btn.classList.add('finding-pill--on');
          }
          onChange(data);
        },
      },
      f.label,
    );
    pills.appendChild(btn);
  });

  return subsectionPanel('color-temperature', '', [
    childCard('Color & Temperature', [
      el(
        'span',
        { class: 'gated-metric__label', style: 'margin-bottom:6px;display:block;' },
        'Findings (select all that apply)',
      ),
      pills,
      el('div', { class: 'gated-grid' }, [
        el('div', { class: 'gated-metric' }, [
          el('span', { class: 'gated-metric__label' }, 'Location'),
          compactInput(data.location, 'e.g. Bilateral lower extremities', (v) => {
            data.location = v;
            onChange(data);
          }),
        ]),
        metricSelect('Temperature', data.temperature, TEMP_OPTIONS, (v) => {
          data.temperature = v;
          onChange(data);
        }),
      ]),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 10: Orientation & Alertness ─────────────────────
export function buildOrientationPanel(data, onChange) {
  const dims = ['person', 'place', 'time', 'situation'];
  dims.forEach((d) => {
    if (data[d] === undefined) data[d] = true;
  });

  const summaryEl = el('div', { class: 'orient-summary' });

  const updateSummary = () => {
    const count = dims.filter((d) => data[d]).length;
    summaryEl.textContent =
      count === 4 ? 'Oriented ×4' : count === 0 ? 'Disoriented' : `Oriented ×${count}`;
  };
  updateSummary();

  const toggles = el('div', { class: 'orient-toggles' });

  dims.forEach((dim) => {
    const label = dim.charAt(0).toUpperCase() + dim.slice(1);
    const btn = el(
      'button',
      {
        type: 'button',
        class: `orient-toggle${data[dim] ? ' orient-toggle--on' : ''}`,
        onclick: () => {
          data[dim] = !data[dim];
          btn.classList.toggle('orient-toggle--on', data[dim]);
          btn.textContent = `${data[dim] ? '✓' : '✗'} ${label}`;
          updateSummary();
          onChange(data);
        },
      },
      `${data[dim] ? '✓' : '✗'} ${label}`,
    );
    toggles.appendChild(btn);
  });

  return subsectionPanel('orientation-alertness', '', [
    childCard('Orientation & Alertness', [
      el(
        'span',
        { class: 'gated-metric__label', style: 'margin-bottom:6px;display:block;' },
        'Oriented to:',
      ),
      toggles,
      summaryEl,
      el('div', { class: 'gated-grid' }, [
        metricField('GCS Score', data.gcs, '/15', (v) => {
          data.gcs = v;
          onChange(data);
        }),
        metricSelect('Alertness Level', data.alertnessLevel, ALERTNESS, (v) => {
          data.alertnessLevel = v;
          onChange(data);
        }),
      ]),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 11: Memory & Attention ──────────────────────────
export function buildMemoryAttentionPanel(data, onChange) {
  const u = (field) => (v) => {
    data[field] = v;
    onChange(data);
  };

  return subsectionPanel('memory-attention', '', [
    childCard('Memory & Attention', [
      el('div', { class: 'gated-grid' }, [
        metricSelect('Short-Term Recall', data.shortTerm, SEVERITY_3, u('shortTerm')),
        metricSelect('Long-Term Memory', data.longTerm, SEVERITY_3, u('longTerm')),
        metricSelect('Attention Span', data.attention, ATTENTION, u('attention')),
        metricSelect('Multi-Step Commands', data.followCommands, COMMANDS, u('followCommands')),
      ]),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 12: Safety Awareness ────────────────────────────
export function buildSafetyAwarenessPanel(data, onChange) {
  const u = (field) => (v) => {
    data[field] = v;
    onChange(data);
  };

  return subsectionPanel('safety-awareness', '', [
    childCard('Safety Awareness', [
      el('div', { class: 'gated-grid' }, [
        metricSelect(
          'Supervision Level',
          data.supervisionLevel,
          SUPERVISION,
          u('supervisionLevel'),
        ),
        metricSelect('Judgment', data.judgment, INTACT_IMPAIRED, u('judgment')),
        metricSelect('Impulsivity', data.impulsivity, IMPULSIVITY, u('impulsivity')),
        metricSelect(
          'Awareness of Limitations',
          data.awarenessOfLimitations,
          AWARENESS,
          u('awarenessOfLimitations'),
        ),
        metricSelect('Fall Risk', data.fallRisk, FALL_RISK, u('fallRisk')),
      ]),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}

// ── Panel 13: Vision & Perception ─────────────────────────
export function buildVisionPerceptionPanel(data, onChange) {
  const u = (field) => (v) => {
    data[field] = v;
    onChange(data);
  };

  return subsectionPanel('vision-perception', '', [
    childCard('Vision & Perception', [
      el('div', { class: 'gated-grid' }, [
        metricSelect('Visual Field Deficits', data.visualFields, VF_OPTIONS, u('visualFields')),
        metricSelect('Visual Neglect', data.neglectSide, NEGLECT, u('neglectSide')),
        metricSelect(
          'Depth Perception',
          data.depthPerception,
          INTACT_IMPAIRED,
          u('depthPerception'),
        ),
        metricSelect(
          'Spatial Awareness',
          data.spatialAwareness,
          INTACT_IMPAIRED,
          u('spatialAwareness'),
        ),
      ]),
      notesField(data.notes, (v) => {
        data.notes = v;
        onChange(data);
      }),
    ]),
  ]);
}
