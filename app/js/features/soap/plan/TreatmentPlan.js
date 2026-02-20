// TreatmentPlan.js - Comprehensive PT Treatment Planning
// Evidence-based intervention selection and scheduling

import { el, textareaAutoResize } from '../../../ui/utils.js';
import { textAreaField, selectField } from '../../../ui/form-components.js';
import { createCustomSelect } from '../../../ui/CustomSelect.js';

/**
 * Treatment Plan Component - Comprehensive PT intervention planning
 * Uses the standard table system for consistent styling with billing/assessment tables.
 */
export const TreatmentPlan = {
  /**
   * Creates treatment plan section with PT-specific interventions
   * @param {Object} data - Current plan data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} Treatment plan section
   */
  create(data, updateField) {
    const container = el('div', {
      style: 'max-width: 100%;',
    });

    // Migrate old exercise table schema if needed
    migrateExerciseTable(data, updateField);

    // --- In-Clinic Treatment Plan Section ---
    const inClinicSection = el('div', {
      id: 'in-clinic-treatment-plan',
      class: 'section-anchor treatment-plan-subsection',
    });
    container.append(inClinicSection);

    // Header
    inClinicSection.append(
      el(
        'h4',
        { class: 'subsection-title', style: 'margin-bottom: 8px;' },
        'In-Clinic Treatment Plan',
      ),
    );

    const inClinicContent = el('div', {
      class: 'billing-section-container',
    });
    inClinicSection.append(inClinicContent);

    // Treatment Schedule: Frequency + Duration side by side
    const scheduleRow = el('div', { class: 'treatment-plan-schedule' });
    const freqField = selectField({
      label: 'Frequency',
      value: data.frequency || '',
      options: getFrequencyOptions(),
      onChange: (v) => updateField('frequency', v),
    });
    const durField = selectField({
      label: 'Duration',
      value: data.duration || '',
      options: getDurationOptions(),
      onChange: (v) => updateField('duration', v),
    });
    scheduleRow.append(freqField, durField);
    inClinicContent.append(scheduleRow);

    if (!Array.isArray(data.inClinicInterventions)) {
      // Migrate from old exerciseTable if it exists and inClinicInterventions doesn't
      if (data.exerciseTable && Object.keys(data.exerciseTable).length > 0) {
        data.inClinicInterventions = Object.values(data.exerciseTable).map((row) => ({
          intervention: row.exerciseText || '',
          dosage: '',
          rationale: '',
        }));
      } else {
        data.inClinicInterventions = [];
      }
    }

    const interventionsContainer = el('div', {
      style: 'margin-bottom: 24px;',
    });
    inClinicContent.append(interventionsContainer);

    function renderInterventions() {
      interventionsContainer.replaceChildren();

      const table = el('table', {
        class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
      });

      // Colgroup: Intervention (auto), Dosage (10rem), Purpose (auto), Action (3.75rem)
      const colgroup = el('colgroup', {}, [
        el('col', { style: 'width: auto;' }),
        el('col', { style: 'width: 10rem;' }),
        el('col', { style: 'width: auto;' }),
        el('col', { style: 'width: 3.75rem;' }),
      ]);
      table.appendChild(colgroup);

      const thead = el('thead', { class: 'combined-neuroscreen-thead' }, [
        el('tr', {}, [
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Intervention'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Dose'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Purpose'),
          el('th', { class: 'combined-neuroscreen-th billing-header action-col' }, ''),
        ]),
      ]);
      table.appendChild(thead);

      const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

      data.inClinicInterventions.forEach((entry, index) => {
        const row = createInterventionRow(entry, index, data, updateField, renderInterventions);
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      interventionsContainer.appendChild(table);

      const addButton = el(
        'div',
        {
          class: 'compact-add-btn',
          title: 'Add Intervention',
          onclick: () => {
            data.inClinicInterventions.push({ intervention: '', dosage: '', rationale: '' });
            updateField('inClinicInterventions', data.inClinicInterventions);
            renderInterventions();
          },
        },
        '+',
      );

      interventionsContainer.append(addButton);
    }

    // Initial render
    if (data.inClinicInterventions.length === 0) {
      data.inClinicInterventions.push({ intervention: '', dosage: '', rationale: '' });
    }
    renderInterventions();

    // --- Home Exercise Program (HEP) Section ---
    const hepSection = el('div', {
      id: 'hep-plan',
      class: 'section-anchor treatment-plan-subsection',
      style: 'margin-top: 32px;',
    });
    container.append(hepSection);

    // Header
    hepSection.append(
      el(
        'h4',
        { class: 'subsection-title', style: 'margin-bottom: 8px;' },
        'Home Exercise Program (HEP)',
      ),
    );

    const hepContent = el('div', {
      class: 'billing-section-container',
      style: 'padding: 0; box-shadow: none; border: none; background: transparent;',
    });
    hepSection.append(hepContent);

    if (!Array.isArray(data.hepInterventions)) {
      data.hepInterventions = [];
    }

    const hepContainer = el('div', {
      style: 'margin-bottom: 24px;',
    });
    hepContent.append(hepContainer);

    function renderHep() {
      hepContainer.replaceChildren();

      const table = el('table', {
        class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
      });

      // Colgroup: Intervention (auto), Dosage (10rem), Purpose (auto), Action (3.75rem)
      const colgroup = el('colgroup', {}, [
        el('col', { style: 'width: auto;' }),
        el('col', { style: 'width: 10rem;' }),
        el('col', { style: 'width: auto;' }),
        el('col', { style: 'width: 3.75rem;' }),
      ]);
      table.appendChild(colgroup);

      const thead = el('thead', { class: 'combined-neuroscreen-thead' }, [
        el('tr', {}, [
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Exercise / Activity'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Dose / Frequency'),
          el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Purpose'),
          el('th', { class: 'combined-neuroscreen-th billing-header action-col' }, ''),
        ]),
      ]);
      table.appendChild(thead);

      const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

      data.hepInterventions.forEach((entry, index) => {
        const row = createHepRow(entry, index, data, updateField, renderHep);
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      hepContainer.appendChild(table);

      const addButton = el(
        'div',
        {
          class: 'compact-add-btn',
          title: 'Add HEP Exercise',
          onclick: () => {
            data.hepInterventions.push({ intervention: '', dosage: '', rationale: '' });
            updateField('hepInterventions', data.hepInterventions);
            renderHep();
          },
        },
        '+',
      );

      hepContainer.append(addButton);
    }

    // Initial render
    if (data.hepInterventions.length === 0) {
      data.hepInterventions.push({ intervention: '', dosage: '', rationale: '' });
    }
    renderHep();

    return container;
  },
};

/**
 * Migrate old exercise table format to new single-text format
 */
function migrateExerciseTable(data, updateField) {
  const tbl = data.exerciseTable || {};
  const keys = Object.keys(tbl);
  if (keys.length === 0) return;
  const first = tbl[keys[0]];
  if (first && Object.prototype.hasOwnProperty.call(first, 'exerciseText')) return;
  const newTbl = {};
  keys.forEach((id) => {
    const row = tbl[id] || {};
    const parts = [];
    if (row.exercise) parts.push(String(row.exercise));
    const sets = row.sets ? String(row.sets) : '';
    const reps = row.reps ? String(row.reps) : '';
    if (sets || reps) parts.push(`[${sets}${sets && reps ? ' x ' : ''}${reps}]`);
    if (row.intensity) parts.push(`Intensity: ${row.intensity}`);
    if (row.frequency) parts.push(`Freq: ${row.frequency}`);
    if (row.notes) parts.push(`Notes: ${row.notes}`);
    newTbl[id] = { exerciseText: parts.join(' • ').trim() };
  });
  updateField('exerciseTable', newTbl);
}

/**
 * Frequency options for scheduling
 */
function getFrequencyOptions() {
  return [
    { value: '', label: 'Select...' },
    { value: '1x-week', label: '1x/week' },
    { value: '2x-week', label: '2x/week' },
    { value: '3x-week', label: '3x/week' },
    { value: '4x-week', label: '4x/week' },
    { value: '5x-week', label: '5x/week' },
    { value: '2x-day', label: '2x/day' },
    { value: 'prn', label: 'PRN' },
  ];
}

/**
 * Duration options for scheduling
 */
function getDurationOptions() {
  return [
    { value: '', label: 'Select...' },
    { value: '2-weeks', label: '2 weeks' },
    { value: '4-weeks', label: '4 weeks' },
    { value: '6-weeks', label: '6 weeks' },
    { value: '8-weeks', label: '8 weeks' },
    { value: '12-weeks', label: '12 weeks' },
    { value: '16-weeks', label: '16 weeks' },
    { value: '6-months', label: '6 months' },
    { value: 'ongoing', label: 'Ongoing' },
  ];
}

function createInterventionRow(entry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // 1. Intervention Search/Input
  const searchCell = el('td', {
    class: 'combined-neuroscreen-td',
    style: 'position: relative; overflow: visible;',
  });

  const searchInput = el('input', {
    type: 'text',
    value: entry.intervention || '',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    placeholder: 'Search or type intervention...',
    style: 'width: 100%;',
    onblur: (e) => {
      // Delay to allow click on results
      setTimeout(() => {
        data.inClinicInterventions[index].intervention = e.target.value;
        updateField('inClinicInterventions', data.inClinicInterventions);
      }, 200);
    },
  });

  const resultsList = el('div', {
    class: 'billing-search-results',
    style:
      'position: absolute; top: calc(100% + 2px); left: 0; width: 100%; border: 1px solid var(--color-border); border-radius: 0 0 8px 8px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.16); max-height: 260px; display: none; background: white; z-index: 9999;',
  });

  let highlightIndex = -1;
  let currentResults = [];

  const interventions = getPTInterventions().map((opt) => ({
    ...opt,
    _norm: normalizeInterventionOption(opt),
  }));

  const renderResults = () => {
    resultsList.replaceChildren();
    if (!currentResults.length) {
      resultsList.style.display = 'none';
      return;
    }
    resultsList.style.display = 'block';
    currentResults.forEach((item, idx) => {
      const { label, category } = item._norm || {};

      const resultRow = el(
        'div',
        {
          class: 'billing-search-result-row',
          style:
            'padding: 0.45rem 0.65rem; display:flex; justify-content:space-between; align-items:flex-start; gap: 0.65rem; cursor:pointer; font-size: 0.95rem; background: ' +
            (idx === highlightIndex ? 'rgba(0,154,68,0.12);' : 'white;'),
          onmouseenter: () => {
            highlightIndex = idx;
            Array.from(resultsList.children).forEach((child, cIdx) => {
              child.style.background = cIdx === idx ? 'rgba(0,154,68,0.12)' : 'white';
            });
          },
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            applySelection(item);
          },
        },
        [
          el('div', { style: 'font-weight:600; flex:1; text-align:left;' }, label || item.value),
          el('div', { style: 'color: var(--text-muted); font-size: 0.85rem;' }, category || ''),
        ],
      );
      resultsList.appendChild(resultRow);
    });
  };

  const performSearch = () => {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      currentResults = [];
      renderResults();
      return;
    }
    currentResults = interventions
      .map((item) => ({ ...item, _score: scoreInterventionOption(item, q) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 15);
    highlightIndex = currentResults.length ? 0 : -1;
    renderResults();
  };

  const applySelection = (item) => {
    if (!item) return;
    searchInput.value = item.value;
    data.inClinicInterventions[index].intervention = item.value;

    updateField('inClinicInterventions', data.inClinicInterventions);
    resultsList.style.display = 'none';
  };

  const commitSelection = () => {
    if (currentResults.length) {
      const choice = currentResults[highlightIndex >= 0 ? highlightIndex : 0];
      applySelection(choice);
    }
  };

  searchInput.addEventListener('input', () => performSearch());
  searchInput.addEventListener('keydown', (e) => {
    if (!currentResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = (highlightIndex + 1) % currentResults.length;
      renderResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
      renderResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection();
    }
  });

  searchCell.append(searchInput, resultsList);
  row.appendChild(searchCell);

  // 3. Dosage / Parameters
  const dosageInput = el(
    'textarea',
    {
      class: 'combined-neuroscreen__input resize-vertical',
      rows: 1,
      placeholder: 'e.g., 3x10, 30s hold',
      onblur: (e) => {
        data.inClinicInterventions[index].dosage = e.target.value;
        updateField('inClinicInterventions', data.inClinicInterventions);
      },
    },
    entry.dosage || '',
  );
  textareaAutoResize(dosageInput);
  const dosageCell = el('td', { class: 'combined-neuroscreen-td' });
  dosageCell.appendChild(dosageInput);
  row.appendChild(dosageCell);

  // 3. Purpose / Goal
  const rationaleInput = el(
    'textarea',
    {
      class: 'combined-neuroscreen__input resize-vertical',
      rows: 1,
      placeholder: 'Why are you doing this?',
      onblur: (e) => {
        data.inClinicInterventions[index].rationale = e.target.value;
        updateField('inClinicInterventions', data.inClinicInterventions);
      },
    },
    entry.rationale || '',
  );
  textareaAutoResize(rationaleInput);
  const rationaleCell = el('td', { class: 'combined-neuroscreen-td' });
  rationaleCell.appendChild(rationaleInput);
  row.appendChild(rationaleCell);

  // 5. Action (Remove button)
  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.inClinicInterventions.splice(index, 1);
        updateField('inClinicInterventions', data.inClinicInterventions);
        renderCallback();
      },
    },
    '×',
  );
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

function createHepRow(entry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // 1. Intervention Search/Input
  const searchCell = el('td', {
    class: 'combined-neuroscreen-td',
    style: 'position: relative; overflow: visible;',
  });

  const searchInput = el('input', {
    type: 'text',
    value: entry.intervention || '',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    placeholder: 'Search or type exercise...',
    style: 'width: 100%;',
    onblur: (e) => {
      // Delay to allow click on results
      setTimeout(() => {
        data.hepInterventions[index].intervention = e.target.value;
        updateField('hepInterventions', data.hepInterventions);
      }, 200);
    },
  });

  const resultsList = el('div', {
    class: 'billing-search-results',
    style:
      'position: absolute; top: calc(100% + 2px); left: 0; width: 100%; border: 1px solid var(--color-border); border-radius: 0 0 8px 8px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.16); max-height: 260px; display: none; background: white; z-index: 9999;',
  });

  let highlightIndex = -1;
  let currentResults = [];

  const interventions = getPTInterventions().map((opt) => ({
    ...opt,
    _norm: normalizeInterventionOption(opt),
  }));

  const renderResults = () => {
    resultsList.replaceChildren();
    if (!currentResults.length) {
      resultsList.style.display = 'none';
      return;
    }
    resultsList.style.display = 'block';
    currentResults.forEach((item, idx) => {
      const { label, category } = item._norm || {};

      const resultRow = el(
        'div',
        {
          class: 'billing-search-result-row',
          style:
            'padding: 0.45rem 0.65rem; display:flex; justify-content:space-between; align-items:flex-start; gap: 0.65rem; cursor:pointer; font-size: 0.95rem; background: ' +
            (idx === highlightIndex ? 'rgba(0,154,68,0.12);' : 'white;'),
          onmouseenter: () => {
            highlightIndex = idx;
            Array.from(resultsList.children).forEach((child, cIdx) => {
              child.style.background = cIdx === idx ? 'rgba(0,154,68,0.12)' : 'white';
            });
          },
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            applySelection(item);
          },
        },
        [
          el('div', { style: 'font-weight:600; flex:1; text-align:left;' }, label || item.value),
          el('div', { style: 'color: var(--text-muted); font-size: 0.85rem;' }, category || ''),
        ],
      );
      resultsList.appendChild(resultRow);
    });
  };

  const performSearch = () => {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      currentResults = [];
      renderResults();
      return;
    }
    currentResults = interventions
      .map((item) => ({ ...item, _score: scoreInterventionOption(item, q) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 15);
    highlightIndex = currentResults.length ? 0 : -1;
    renderResults();
  };

  const applySelection = (item) => {
    if (!item) return;
    searchInput.value = item.value;
    data.hepInterventions[index].intervention = item.value;

    updateField('hepInterventions', data.hepInterventions);
    resultsList.style.display = 'none';
  };

  const commitSelection = () => {
    if (currentResults.length) {
      const choice = currentResults[highlightIndex >= 0 ? highlightIndex : 0];
      applySelection(choice);
    }
  };

  searchInput.addEventListener('input', () => performSearch());
  searchInput.addEventListener('keydown', (e) => {
    if (!currentResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = (highlightIndex + 1) % currentResults.length;
      renderResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
      renderResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection();
    }
  });

  searchCell.append(searchInput, resultsList);
  row.appendChild(searchCell);

  // 2. Dosage / Parameters
  const dosageInput = el(
    'textarea',
    {
      class: 'combined-neuroscreen__input resize-vertical',
      rows: 1,
      placeholder: 'e.g., 3x10, 1x/day',
      onblur: (e) => {
        data.hepInterventions[index].dosage = e.target.value;
        updateField('hepInterventions', data.hepInterventions);
      },
    },
    entry.dosage || '',
  );
  textareaAutoResize(dosageInput);
  const dosageCell = el('td', { class: 'combined-neuroscreen-td' });
  dosageCell.appendChild(dosageInput);
  row.appendChild(dosageCell);

  // 3. Purpose / Goal
  const rationaleInput = el(
    'textarea',
    {
      class: 'combined-neuroscreen__input resize-vertical',
      rows: 1,
      placeholder: 'Why are you doing this?',
      onblur: (e) => {
        data.hepInterventions[index].rationale = e.target.value;
        updateField('hepInterventions', data.hepInterventions);
      },
    },
    entry.rationale || '',
  );
  textareaAutoResize(rationaleInput);
  const rationaleCell = el('td', { class: 'combined-neuroscreen-td' });
  rationaleCell.appendChild(rationaleInput);
  row.appendChild(rationaleCell);

  // 4. Action (Remove button)
  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.hepInterventions.splice(index, 1);
        updateField('hepInterventions', data.hepInterventions);
        renderCallback();
      },
    },
    '×',
  );
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

function normalizeInterventionOption(opt) {
  const value = (opt?.value || '').trim();
  const label = (opt?.label || '').trim();
  const category = (opt?.category || '').trim();
  return { value, label, category };
}

function scoreInterventionOption(item, q) {
  const norm = item._norm || normalizeInterventionOption(item);
  const value = (norm.value || '').toLowerCase();
  const label = (norm.label || '').toLowerCase();
  const category = (norm.category || '').toLowerCase();

  if (value === q) return 100;
  if (value.startsWith(q)) return 90;
  if (label.startsWith(q)) return 80;
  if (value.includes(q)) return 60;
  if (label.includes(q)) return 55;
  if (category.includes(q)) return 30;
  return 0;
}

function getPTInterventions() {
  return [
    { value: 'Squats', label: 'Squats', category: 'TherEx' },
    { value: 'Lunges', label: 'Lunges', category: 'TherEx' },
    { value: 'Heel Raises', label: 'Heel Raises', category: 'TherEx' },
    { value: 'Bridges', label: 'Bridges', category: 'TherEx' },
    { value: 'Clamshells', label: 'Clamshells', category: 'TherEx' },
    { value: 'Straight Leg Raise (SLR)', label: 'Straight Leg Raise (SLR)', category: 'TherEx' },
    { value: 'Short Arc Quads (SAQ)', label: 'Short Arc Quads (SAQ)', category: 'TherEx' },
    { value: 'Long Arc Quads (LAQ)', label: 'Long Arc Quads (LAQ)', category: 'TherEx' },
    { value: 'Hamstring Curls', label: 'Hamstring Curls', category: 'TherEx' },
    { value: 'Calf Stretch', label: 'Calf Stretch', category: 'TherEx' },
    { value: 'Hamstring Stretch', label: 'Hamstring Stretch', category: 'TherEx' },
    { value: 'Quad Stretch', label: 'Quad Stretch', category: 'TherEx' },
    { value: 'Piriformis Stretch', label: 'Piriformis Stretch', category: 'TherEx' },
    { value: 'Hip Flexor Stretch', label: 'Hip Flexor Stretch', category: 'TherEx' },
    { value: 'IT Band Stretch', label: 'IT Band Stretch', category: 'TherEx' },
    { value: 'Pec Stretch', label: 'Pec Stretch', category: 'TherEx' },
    { value: 'Lat Stretch', label: 'Lat Stretch', category: 'TherEx' },
    { value: 'Upper Trapezius Stretch', label: 'Upper Trapezius Stretch', category: 'TherEx' },
    { value: 'Levator Scapulae Stretch', label: 'Levator Scapulae Stretch', category: 'TherEx' },
    { value: 'Scalene Stretch', label: 'Scalene Stretch', category: 'TherEx' },
    {
      value: 'Cervical Retraction (Chin Tucks)',
      label: 'Cervical Retraction (Chin Tucks)',
      category: 'TherEx',
    },
    { value: 'Scapular Retraction', label: 'Scapular Retraction', category: 'TherEx' },
    { value: 'Rows', label: 'Rows', category: 'TherEx' },
    { value: 'Lat Pulldowns', label: 'Lat Pulldowns', category: 'TherEx' },
    { value: 'Bicep Curls', label: 'Bicep Curls', category: 'TherEx' },
    { value: 'Tricep Extensions', label: 'Tricep Extensions', category: 'TherEx' },
    { value: 'Shoulder Flexion', label: 'Shoulder Flexion', category: 'TherEx' },
    { value: 'Shoulder Abduction', label: 'Shoulder Abduction', category: 'TherEx' },
    {
      value: 'Shoulder Internal Rotation',
      label: 'Shoulder Internal Rotation',
      category: 'TherEx',
    },
    {
      value: 'Shoulder External Rotation',
      label: 'Shoulder External Rotation',
      category: 'TherEx',
    },
    { value: 'Wall Walks', label: 'Wall Walks', category: 'TherEx' },
    { value: 'Pendulums', label: 'Pendulums', category: 'TherEx' },
    { value: 'Pulleys', label: 'Pulleys', category: 'TherEx' },
    { value: 'Wand Exercises', label: 'Wand Exercises', category: 'TherEx' },
    { value: 'Finger Walks', label: 'Finger Walks', category: 'TherEx' },
    { value: 'Wrist Flexion', label: 'Wrist Flexion', category: 'TherEx' },
    { value: 'Wrist Extension', label: 'Wrist Extension', category: 'TherEx' },
    { value: 'Wrist Radial Deviation', label: 'Wrist Radial Deviation', category: 'TherEx' },
    { value: 'Wrist Ulnar Deviation', label: 'Wrist Ulnar Deviation', category: 'TherEx' },
    { value: 'Grip Strengthening', label: 'Grip Strengthening', category: 'TherEx' },
    { value: 'Putty Exercises', label: 'Putty Exercises', category: 'TherEx' },
    { value: 'Tendon Gliding', label: 'Tendon Gliding', category: 'TherEx' },
    { value: 'Nerve Gliding', label: 'Nerve Gliding', category: 'TherEx' },
    { value: 'Core Stabilization', label: 'Core Stabilization', category: 'TherEx' },
    { value: 'Planks', label: 'Planks', category: 'TherEx' },
    { value: 'Side Planks', label: 'Side Planks', category: 'TherEx' },
    { value: 'Bird Dog', label: 'Bird Dog', category: 'TherEx' },
    { value: 'Dead Bug', label: 'Dead Bug', category: 'TherEx' },
    { value: 'Pelvic Tilts', label: 'Pelvic Tilts', category: 'TherEx' },
    {
      value: 'Transverse Abdominis Activation',
      label: 'Transverse Abdominis Activation',
      category: 'TherEx',
    },
    { value: 'Multifidus Activation', label: 'Multifidus Activation', category: 'TherEx' },
    { value: 'Kegels', label: 'Kegels', category: 'TherEx' },
    { value: 'Diaphragmatic Breathing', label: 'Diaphragmatic Breathing', category: 'TherEx' },
    { value: 'Pursed Lip Breathing', label: 'Pursed Lip Breathing', category: 'TherEx' },
    { value: 'Incentive Spirometry', label: 'Incentive Spirometry', category: 'TherEx' },
    { value: 'Coughing Techniques', label: 'Coughing Techniques', category: 'TherEx' },
    { value: 'Postural Drainage', label: 'Postural Drainage', category: 'TherEx' },
    { value: 'Percussion', label: 'Percussion', category: 'Manual Therapy' },
    { value: 'Vibration', label: 'Vibration', category: 'Manual Therapy' },
    { value: 'Shaking', label: 'Shaking', category: 'Manual Therapy' },
    { value: 'Rib Springing', label: 'Rib Springing', category: 'Manual Therapy' },
    {
      value: 'Joint Mobilization (Grade I-IV)',
      label: 'Joint Mobilization (Grade I-IV)',
      category: 'Manual Therapy',
    },
    {
      value: 'Joint Manipulation (Grade V)',
      label: 'Joint Manipulation (Grade V)',
      category: 'Manual Therapy',
    },
    {
      value: 'Soft Tissue Mobilization',
      label: 'Soft Tissue Mobilization',
      category: 'Manual Therapy',
    },
    { value: 'Myofascial Release', label: 'Myofascial Release', category: 'Manual Therapy' },
    { value: 'Trigger Point Release', label: 'Trigger Point Release', category: 'Manual Therapy' },
    { value: 'Friction Massage', label: 'Friction Massage', category: 'Manual Therapy' },
    {
      value: 'Instrument Assisted Soft Tissue Mobilization (IASTM)',
      label: 'Instrument Assisted Soft Tissue Mobilization (IASTM)',
      category: 'Manual Therapy',
    },
    { value: 'Cupping', label: 'Cupping', category: 'Manual Therapy' },
    { value: 'Dry Needling', label: 'Dry Needling', category: 'Manual Therapy' },
    {
      value: 'Muscle Energy Technique (MET)',
      label: 'Muscle Energy Technique (MET)',
      category: 'Manual Therapy',
    },
    { value: 'Strain-Counterstrain', label: 'Strain-Counterstrain', category: 'Manual Therapy' },
    { value: 'Craniosacral Therapy', label: 'Craniosacral Therapy', category: 'Manual Therapy' },
    { value: 'Visceral Manipulation', label: 'Visceral Manipulation', category: 'Manual Therapy' },
    { value: 'Lymphatic Drainage', label: 'Lymphatic Drainage', category: 'Manual Therapy' },
    { value: 'Traction (Manual)', label: 'Traction (Manual)', category: 'Manual Therapy' },
    { value: 'Traction (Mechanical)', label: 'Traction (Mechanical)', category: 'Modalities' },
    { value: 'Hot Pack', label: 'Hot Pack', category: 'Modalities' },
    { value: 'Cold Pack', label: 'Cold Pack', category: 'Modalities' },
    { value: 'Ice Massage', label: 'Ice Massage', category: 'Modalities' },
    { value: 'Vapocoolant Spray', label: 'Vapocoolant Spray', category: 'Modalities' },
    { value: 'Paraffin Bath', label: 'Paraffin Bath', category: 'Modalities' },
    { value: 'Fluidotherapy', label: 'Fluidotherapy', category: 'Modalities' },
    { value: 'Ultrasound', label: 'Ultrasound', category: 'Modalities' },
    { value: 'Phonophoresis', label: 'Phonophoresis', category: 'Modalities' },
    { value: 'Diathermy', label: 'Diathermy', category: 'Modalities' },
    { value: 'Infrared', label: 'Infrared', category: 'Modalities' },
    { value: 'Ultraviolet', label: 'Ultraviolet', category: 'Modalities' },
    { value: 'Laser Therapy', label: 'Laser Therapy', category: 'Modalities' },
    {
      value: 'Electrical Stimulation (TENS)',
      label: 'Electrical Stimulation (TENS)',
      category: 'Modalities',
    },
    {
      value: 'Electrical Stimulation (NMES)',
      label: 'Electrical Stimulation (NMES)',
      category: 'Modalities',
    },
    {
      value: 'Electrical Stimulation (FES)',
      label: 'Electrical Stimulation (FES)',
      category: 'Modalities',
    },
    {
      value: 'Electrical Stimulation (IFC)',
      label: 'Electrical Stimulation (IFC)',
      category: 'Modalities',
    },
    {
      value: 'Electrical Stimulation (High Volt)',
      label: 'Electrical Stimulation (High Volt)',
      category: 'Modalities',
    },
    {
      value: 'Electrical Stimulation (Russian)',
      label: 'Electrical Stimulation (Russian)',
      category: 'Modalities',
    },
    {
      value: 'Electrical Stimulation (Microcurrent)',
      label: 'Electrical Stimulation (Microcurrent)',
      category: 'Modalities',
    },
    { value: 'Iontophoresis', label: 'Iontophoresis', category: 'Modalities' },
    { value: 'Biofeedback', label: 'Biofeedback', category: 'Modalities' },
    { value: 'Compression (Pneumatic)', label: 'Compression (Pneumatic)', category: 'Modalities' },
    { value: 'Compression (Garments)', label: 'Compression (Garments)', category: 'Modalities' },
    { value: 'Compression (Bandaging)', label: 'Compression (Bandaging)', category: 'Modalities' },
    { value: 'Taping (Kinesio)', label: 'Taping (Kinesio)', category: 'Other' },
    { value: 'Taping (McConnell)', label: 'Taping (McConnell)', category: 'Other' },
    { value: 'Taping (Athletic)', label: 'Taping (Athletic)', category: 'Other' },
    { value: 'Bracing', label: 'Bracing', category: 'Other' },
    { value: 'Splinting', label: 'Splinting', category: 'Other' },
    { value: 'Orthotics', label: 'Orthotics', category: 'Other' },
    { value: 'Prosthetics', label: 'Prosthetics', category: 'Other' },
    {
      value: 'Assistive Device Training',
      label: 'Assistive Device Training',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Level Surfaces)',
      label: 'Gait Training (Level Surfaces)',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Uneven Surfaces)',
      label: 'Gait Training (Uneven Surfaces)',
      category: 'Gait Training',
    },
    { value: 'Gait Training (Stairs)', label: 'Gait Training (Stairs)', category: 'Gait Training' },
    { value: 'Gait Training (Curbs)', label: 'Gait Training (Curbs)', category: 'Gait Training' },
    { value: 'Gait Training (Ramps)', label: 'Gait Training (Ramps)', category: 'Gait Training' },
    {
      value: 'Gait Training (Obstacles)',
      label: 'Gait Training (Obstacles)',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Treadmill)',
      label: 'Gait Training (Treadmill)',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Overground)',
      label: 'Gait Training (Overground)',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Body Weight Supported)',
      label: 'Gait Training (Body Weight Supported)',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Robotic)',
      label: 'Gait Training (Robotic)',
      category: 'Gait Training',
    },
    {
      value: 'Gait Training (Virtual Reality)',
      label: 'Gait Training (Virtual Reality)',
      category: 'Gait Training',
    },
    {
      value: 'Balance Training (Static)',
      label: 'Balance Training (Static)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Dynamic)',
      label: 'Balance Training (Dynamic)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Reactive)',
      label: 'Balance Training (Reactive)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Anticipatory)',
      label: 'Balance Training (Anticipatory)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Perturbations)',
      label: 'Balance Training (Perturbations)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Dual Task)',
      label: 'Balance Training (Dual Task)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Eyes Closed)',
      label: 'Balance Training (Eyes Closed)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Foam)',
      label: 'Balance Training (Foam)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (BOSU)',
      label: 'Balance Training (BOSU)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Wobble Board)',
      label: 'Balance Training (Wobble Board)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Rocker Board)',
      label: 'Balance Training (Rocker Board)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Swiss Ball)',
      label: 'Balance Training (Swiss Ball)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Balance Training (Trampoline)',
      label: 'Balance Training (Trampoline)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Proprioceptive Training',
      label: 'Proprioceptive Training',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Kinesthetic Training',
      label: 'Kinesthetic Training',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Coordination Training',
      label: 'Coordination Training',
      category: 'Neuromuscular Re-ed',
    },
    { value: 'Agility Training', label: 'Agility Training', category: 'Neuromuscular Re-ed' },
    { value: 'Plyometrics', label: 'Plyometrics', category: 'Neuromuscular Re-ed' },
    {
      value: 'PNF (Proprioceptive Neuromuscular Facilitation)',
      label: 'PNF (Proprioceptive Neuromuscular Facilitation)',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'NDT (Neuro-Developmental Treatment)',
      label: 'NDT (Neuro-Developmental Treatment)',
      category: 'Neuromuscular Re-ed',
    },
    { value: 'Brunnstrom Approach', label: 'Brunnstrom Approach', category: 'Neuromuscular Re-ed' },
    { value: 'Rood Approach', label: 'Rood Approach', category: 'Neuromuscular Re-ed' },
    { value: 'Bobath Concept', label: 'Bobath Concept', category: 'Neuromuscular Re-ed' },
    { value: 'Vojta Method', label: 'Vojta Method', category: 'Neuromuscular Re-ed' },
    {
      value: 'Constraint-Induced Movement Therapy (CIMT)',
      label: 'Constraint-Induced Movement Therapy (CIMT)',
      category: 'Neuromuscular Re-ed',
    },
    { value: 'Mirror Therapy', label: 'Mirror Therapy', category: 'Neuromuscular Re-ed' },
    { value: 'Mental Practice', label: 'Mental Practice', category: 'Neuromuscular Re-ed' },
    { value: 'Motor Imagery', label: 'Motor Imagery', category: 'Neuromuscular Re-ed' },
    {
      value: 'Task-Specific Training',
      label: 'Task-Specific Training',
      category: 'Neuromuscular Re-ed',
    },
    { value: 'Functional Training', label: 'Functional Training', category: 'Neuromuscular Re-ed' },
    {
      value: 'Activities of Daily Living (ADL) Training',
      label: 'Activities of Daily Living (ADL) Training',
      category: 'Neuromuscular Re-ed',
    },
    {
      value: 'Instrumental Activities of Daily Living (IADL) Training',
      label: 'Instrumental Activities of Daily Living (IADL) Training',
      category: 'Neuromuscular Re-ed',
    },
    { value: 'Work Conditioning', label: 'Work Conditioning', category: 'Other' },
    { value: 'Work Hardening', label: 'Work Hardening', category: 'Other' },
    { value: 'Ergonomic Training', label: 'Ergonomic Training', category: 'Other' },
    { value: 'Body Mechanics Training', label: 'Body Mechanics Training', category: 'Other' },
    { value: 'Postural Training', label: 'Postural Training', category: 'Other' },
    { value: 'Transfer Training', label: 'Transfer Training', category: 'Other' },
    { value: 'Bed Mobility Training', label: 'Bed Mobility Training', category: 'Other' },
    {
      value: 'Wheelchair Mobility Training',
      label: 'Wheelchair Mobility Training',
      category: 'Other',
    },
    { value: 'Fall Prevention Training', label: 'Fall Prevention Training', category: 'Other' },
    { value: 'Safety Training', label: 'Safety Training', category: 'Other' },
    {
      value: 'Energy Conservation Training',
      label: 'Energy Conservation Training',
      category: 'Other',
    },
    { value: 'Joint Protection Training', label: 'Joint Protection Training', category: 'Other' },
    { value: 'Pacing Techniques', label: 'Pacing Techniques', category: 'Other' },
    { value: 'Relaxation Techniques', label: 'Relaxation Techniques', category: 'Other' },
    { value: 'Stress Management', label: 'Stress Management', category: 'Other' },
    { value: 'Pain Management', label: 'Pain Management', category: 'Other' },
    {
      value: 'Cognitive Behavioral Therapy (CBT) Principles',
      label: 'Cognitive Behavioral Therapy (CBT) Principles',
      category: 'Other',
    },
    {
      value: 'Motivational Interviewing Principles',
      label: 'Motivational Interviewing Principles',
      category: 'Other',
    },
    { value: 'Patient Education', label: 'Patient Education', category: 'Other' },
    { value: 'Family/Caregiver Education', label: 'Family/Caregiver Education', category: 'Other' },
    {
      value: 'Home Exercise Program (HEP) Instruction',
      label: 'Home Exercise Program (HEP) Instruction',
      category: 'Other',
    },
    { value: 'Discharge Planning', label: 'Discharge Planning', category: 'Other' },
    { value: 'Equipment Prescription', label: 'Equipment Prescription', category: 'Other' },
    { value: 'Environmental Modification', label: 'Environmental Modification', category: 'Other' },
    { value: 'Community Reintegration', label: 'Community Reintegration', category: 'Other' },
    { value: 'Return to Sport/Play', label: 'Return to Sport/Play', category: 'Other' },
    { value: 'Return to Work', label: 'Return to Work', category: 'Other' },
  ];
}
