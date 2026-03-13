// GoalSetting.js - SMART Goals with ICF domain linkage and timeframe
// Students must link each goal to an ICF domain and a target timeframe

import { el } from '../../../ui/utils.js';

const TIMEFRAME_OPTIONS = [
  { value: '', label: '— timeframe —' },
  { value: '1-week', label: '1 week' },
  { value: '2-weeks', label: '2 weeks' },
  { value: '4-weeks', label: '4 weeks' },
  { value: '6-weeks', label: '6 weeks' },
  { value: '8-weeks', label: '8 weeks' },
  { value: '12-weeks', label: '12 weeks' },
  { value: 'discharge', label: 'By D/C' },
];

const ICF_OPTIONS = [
  { value: '', label: '— ICF domain —' },
  { value: 'body', label: 'Body Functions & Impairments' },
  { value: 'activity', label: 'Activity Limitations' },
  { value: 'participation', label: 'Participation Restrictions' },
];

/** Migrate from old goalsTable object format or seed an empty row */
function migrateGoals(data) {
  if (Array.isArray(data.goals)) return;
  if (data.goalsTable && typeof data.goalsTable === 'object') {
    data.goals = Object.values(data.goalsTable)
      .filter((r) => r.goalText || r.goal)
      .map((r) => ({ goal: r.goalText || r.goal || '', timeframe: '', icfDomain: '' }));
  } else {
    data.goals = [];
  }
  if (data.goals.length === 0) data.goals.push({ goal: '', timeframe: '', icfDomain: '' });
}

function makeSelect(options, value, onChange) {
  const sel = el('select', { class: 'goal-select combined-neuroscreen__input' });
  options.forEach((opt) => {
    const o = el('option', { value: opt.value }, opt.label);
    if (opt.value === value) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => onChange(sel.value));
  return sel;
}

function createGoalRow(entry, index, data, updateField, renderCallback) {
  const row = el('tr', {
    class: 'combined-neuroscreen-row intervention-row',
    'data-row-index': String(index),
  });

  // Drag handle
  row.appendChild(
    el(
      'td',
      {
        class: 'combined-neuroscreen-td intervention-drag-handle',
        draggable: 'true',
        title: 'Drag to reorder',
      },
      '⠿',
    ),
  );

  // Goal textarea
  const goalCell = el('td', { class: 'combined-neuroscreen-td' });
  const goalInput = el('textarea', {
    class: 'combined-neuroscreen__input',
    rows: 2,
    placeholder: 'State the measurable functional goal…',
    style: 'width: 100%; resize: vertical;',
  });
  goalInput.value = entry.goal || '';
  goalInput.addEventListener('input', () => {
    goalInput.style.height = 'auto';
    goalInput.style.height = `${goalInput.scrollHeight}px`;
  });
  goalInput.addEventListener('blur', () => {
    data.goals[index].goal = goalInput.value;
    updateField('goals', data.goals);
  });
  goalCell.appendChild(goalInput);
  row.appendChild(goalCell);

  // Timeframe select
  const tfCell = el('td', { class: 'combined-neuroscreen-td' });
  tfCell.appendChild(
    makeSelect(TIMEFRAME_OPTIONS, entry.timeframe || '', (v) => {
      data.goals[index].timeframe = v;
      updateField('goals', data.goals);
    }),
  );
  row.appendChild(tfCell);

  // Remove button
  const actionCell = el('td', { class: 'combined-neuroscreen-td action-col' });
  actionCell.appendChild(
    el(
      'button',
      {
        class: 'remove-btn',
        title: 'Remove goal',
        type: 'button',
        onclick: () => {
          data.goals.splice(index, 1);
          if (data.goals.length === 0) data.goals.push({ goal: '', timeframe: '', icfDomain: '' });
          updateField('goals', data.goals);
          renderCallback();
        },
      },
      '×',
    ),
  );
  row.appendChild(actionCell);

  return row;
}

function enableGoalDragReorder(tbody, items, onReorder) {
  let dragSrcIndex = null;

  tbody.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.intervention-row');
    if (!row || !e.target.classList.contains('intervention-drag-handle')) {
      e.preventDefault();
      return;
    }
    dragSrcIndex = parseInt(row.getAttribute('data-row-index'), 10);
    row.classList.add('intervention-row--dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragSrcIndex));
  });

  tbody.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.intervention-row');
    if (!target || parseInt(target.getAttribute('data-row-index'), 10) === dragSrcIndex) return;
    tbody
      .querySelectorAll('.intervention-row--drag-over')
      .forEach((r) => r.classList.remove('intervention-row--drag-over'));
    target.classList.add('intervention-row--drag-over');
  });

  tbody.addEventListener('dragleave', (e) => {
    const t = e.target.closest('.intervention-row');
    if (t) t.classList.remove('intervention-row--drag-over');
  });

  tbody.addEventListener('drop', (e) => {
    e.preventDefault();
    tbody
      .querySelectorAll('.intervention-row--drag-over')
      .forEach((r) => r.classList.remove('intervention-row--drag-over'));
    const targetRow = e.target.closest('.intervention-row');
    if (!targetRow) return;
    const toIndex = parseInt(targetRow.getAttribute('data-row-index'), 10);
    if (toIndex === dragSrcIndex || dragSrcIndex === null) return;
    const [moved] = items.splice(dragSrcIndex, 1);
    items.splice(toIndex, 0, moved);
    onReorder();
  });

  tbody.addEventListener('dragend', () => {
    tbody
      .querySelectorAll('.intervention-row--dragging')
      .forEach((r) => r.classList.remove('intervention-row--dragging'));
    dragSrcIndex = null;
  });
}

export const GoalSetting = {
  create(data, updateField) {
    migrateGoals(data);

    const section = el('div', {
      id: 'goal-setting',
      class: 'section-anchor goal-setting-subsection',
    });

    const container = el('div');
    section.append(container);

    function renderGoals() {
      container.replaceChildren();

      const table = el('table', {
        class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
        style: 'width: 100%;',
      });

      table.appendChild(
        el('colgroup', {}, [
          el('col', { style: 'width: 2rem;' }),
          el('col', { style: 'width: auto;' }),
          el('col', { style: 'width: 9rem;' }),
          el('col', { style: 'width: 3.75rem;' }),
        ]),
      );

      const addBtn = el(
        'button',
        {
          type: 'button',
          class: 'billing-row-add-btn',
          title: 'Add Goal',
          onclick: () => {
            data.goals.push({ goal: '', timeframe: '', icfDomain: '' });
            updateField('goals', data.goals);
            renderGoals();
          },
        },
        '+',
      );

      table.appendChild(
        el('thead', { class: 'combined-neuroscreen-thead' }, [
          el('tr', {}, [
            el(
              'th',
              { class: 'combined-neuroscreen-th billing-header intervention-drag-handle-col' },
              '',
            ),
            el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Goal'),
            el('th', { class: 'combined-neuroscreen-th billing-header' }, 'Timeframe'),
            el('th', { class: 'combined-neuroscreen-th billing-header action-col' }, [addBtn]),
          ]),
        ]),
      );

      const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });
      data.goals.forEach((entry, index) => {
        tbody.appendChild(createGoalRow(entry, index, data, updateField, renderGoals));
      });
      enableGoalDragReorder(tbody, data.goals, () => {
        updateField('goals', data.goals);
        renderGoals();
      });
      table.appendChild(tbody);
      container.appendChild(table);
    }

    renderGoals();
    return section;
  },
};
