// GoalSetting.js - SMART Goals with ICF domain linkage and timeframe
// Students must link each goal to an ICF domain and a target timeframe

import { el, textareaAutoResize } from '../../../ui/utils.js';

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
  if (data.goals.length === 0) {
    for (let i = 0; i < 4; i++) data.goals.push({ goal: '', timeframe: '', icfDomain: '' });
  }
}

function createGoalRow(entry, index, data, updateField, renderCallback) {
  const row = el('div', {
    class: 'goal-row',
    'data-row-index': String(index),
  });

  // Drag handle
  row.appendChild(
    el(
      'span',
      {
        class: 'goal-row__handle',
        draggable: 'true',
        title: 'Drag to reorder',
      },
      '⠿',
    ),
  );

  // Goal textarea
  const goalInput = el('textarea', {
    class: 'goal-row__input form-textarea',
    rows: 1,
    placeholder: 'State the measurable functional goal…',
  });
  goalInput.value = entry.goal || '';
  textareaAutoResize(goalInput);
  goalInput.addEventListener('blur', () => {
    data.goals[index].goal = goalInput.value;
    updateField('goals', data.goals);
  });
  row.appendChild(goalInput);

  // Remove button
  row.appendChild(
    el(
      'button',
      {
        class: 'goal-row__remove',
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

  return row;
}

function enableGoalDragReorder(container, items, onReorder) {
  let dragSrcIndex = null;

  container.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.goal-row');
    if (!row || !e.target.classList.contains('goal-row__handle')) {
      e.preventDefault();
      return;
    }
    dragSrcIndex = parseInt(row.getAttribute('data-row-index'), 10);
    row.classList.add('goal-row--dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragSrcIndex));
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.goal-row');
    if (!target || parseInt(target.getAttribute('data-row-index'), 10) === dragSrcIndex) return;
    container
      .querySelectorAll('.goal-row--drag-over')
      .forEach((r) => r.classList.remove('goal-row--drag-over'));
    target.classList.add('goal-row--drag-over');
  });

  container.addEventListener('dragleave', (e) => {
    const t = e.target.closest('.goal-row');
    if (t) t.classList.remove('goal-row--drag-over');
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container
      .querySelectorAll('.goal-row--drag-over')
      .forEach((r) => r.classList.remove('goal-row--drag-over'));
    const targetRow = e.target.closest('.goal-row');
    if (!targetRow) return;
    const toIndex = parseInt(targetRow.getAttribute('data-row-index'), 10);
    if (toIndex === dragSrcIndex || dragSrcIndex === null) return;
    const [moved] = items.splice(dragSrcIndex, 1);
    items.splice(toIndex, 0, moved);
    onReorder();
  });

  container.addEventListener('dragend', () => {
    container
      .querySelectorAll('.goal-row--dragging')
      .forEach((r) => r.classList.remove('goal-row--dragging'));
    dragSrcIndex = null;
  });
}

export const GoalSetting = {
  create(data, updateField) {
    migrateGoals(data);

    const addBtn = el(
      'button',
      {
        type: 'button',
        class: 'section-panel__action-btn',
        title: 'Add Goal',
        onclick: () => {
          data.goals.push({ goal: '', timeframe: '', icfDomain: '' });
          updateField('goals', data.goals);
          renderGoals();
          // Focus the new row's textarea
          const rows = listContainer.querySelectorAll('.goal-row');
          const last = rows[rows.length - 1];
          if (last) {
            last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const ta = last.querySelector('.goal-row__input');
            if (ta) setTimeout(() => ta.focus(), 120);
          }
        },
      },
      '+',
    );

    const section = el('div', {
      id: 'goal-setting',
      class: 'section-anchor section-panel',
    });

    const header = el('div', { class: 'section-panel__header' }, [
      el('span', { class: 'section-panel__title' }, 'SMART Goals'),
      addBtn,
    ]);

    const body = el('div', { class: 'section-panel__body' });
    const listContainer = el('div', { class: 'goal-list' });
    body.append(listContainer);
    section.append(header, body);

    function renderGoals() {
      listContainer.replaceChildren();
      data.goals.forEach((entry, index) => {
        listContainer.appendChild(createGoalRow(entry, index, data, updateField, renderGoals));
      });
      enableGoalDragReorder(listContainer, data.goals, () => {
        updateField('goals', data.goals);
        renderGoals();
      });
    }

    renderGoals();
    return section;
  },
};
