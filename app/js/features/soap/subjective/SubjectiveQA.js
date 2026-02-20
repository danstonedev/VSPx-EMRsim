// SubjectiveQA.js – Interview Q/A Builder
// Structured open-ended questions with patient responses, category tags, and scoring support

import { el, textareaAutoResize } from '../../../ui/utils.js';

/** Category tag options for Q/A items */
const QA_TAGS = [
  'Pain',
  'Function',
  'Work',
  'ADLs',
  'Red Flags',
  'Neuro',
  'Psychosocial',
  'Medication',
  'Sleep',
  'Goals',
  'Adherence',
];

/** Patterns that indicate a closed-ended (yes/no) question */
const CLOSED_PATTERNS = [
  /^do you\b/i,
  /^did you\b/i,
  /^are you\b/i,
  /^is it\b/i,
  /^is the\b/i,
  /^is your\b/i,
  /^were you\b/i,
  /^was it\b/i,
  /^have you\b/i,
  /^has it\b/i,
  /^can you\b/i,
  /^could you\b/i,
  /^would you\b/i,
  /^will you\b/i,
];

const QA_TARGET = 10;

// ─── Helpers ────────────────────────────────────────────────

function uid() {
  return `qa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

function isClosedEnded(text) {
  const trimmed = (text || '').trim();
  return CLOSED_PATTERNS.some((re) => re.test(trimmed));
}

// ─── Single Q/A Row ─────────────────────────────────────────

function createQARow(item, index, { onUpdate, onDelete, totalCount }) {
  const row = el('div', { class: 'qa-row', 'data-qa-id': item.id });

  // Drag handle
  const handle = el(
    'div',
    {
      class: 'qa-row__handle',
      draggable: 'true',
      title: 'Drag to reorder',
      'aria-label': 'Drag to reorder',
    },
    '⠿',
  );
  row.appendChild(handle);

  // Main content area
  const body = el('div', { class: 'qa-row__body' });

  // Number badge
  const badge = el('span', { class: 'qa-row__number' }, `Q${index + 1}`);

  // Question textarea
  const questionLabel = el('label', { class: 'qa-row__label' }, [badge, ' Question']);
  const questionTA = el('textarea', {
    class: 'qa-row__textarea form-textarea',
    rows: 2,
    placeholder: 'Enter your open-ended question…',
    value: item.question || '',
  });
  questionTA.value = item.question || '';
  textareaAutoResize(questionTA);

  // Closed-ended warning tooltip
  const closedWarning = el(
    'div',
    {
      class: 'qa-row__closed-warning',
      style: isClosedEnded(item.question) ? '' : 'display:none;',
    },
    [
      el('span', { class: 'qa-row__closed-icon', 'aria-hidden': 'true' }, '⚠'),
      el(
        'span',
        {},
        'This looks like a closed-ended question. Consider rephrasing to an open-ended question.',
      ),
    ],
  );

  questionTA.addEventListener('input', () => {
    closedWarning.style.display = isClosedEnded(questionTA.value) ? '' : 'none';
  });
  questionTA.addEventListener('blur', () => {
    item.question = questionTA.value;
    item.updatedAt = now();
    onUpdate();
  });

  // Response textarea
  const responseLabel = el('label', { class: 'qa-row__label' }, 'Patient Response');
  const responseTA = el('textarea', {
    class: 'qa-row__textarea form-textarea',
    rows: 2,
    placeholder: "Document the patient's response…",
    value: item.response || '',
  });
  responseTA.value = item.response || '';
  textareaAutoResize(responseTA);
  responseTA.addEventListener('blur', () => {
    item.response = responseTA.value;
    item.updatedAt = now();
    onUpdate();
  });

  body.append(questionLabel, questionTA, closedWarning, responseLabel, responseTA);

  // Tag chips
  const tagsRow = el('div', { class: 'qa-row__tags' });
  QA_TAGS.forEach((tag) => {
    const active = (item.tags || []).includes(tag);
    const chip = el(
      'button',
      {
        type: 'button',
        class: `qa-tag-chip ${active ? 'qa-tag-chip--active' : ''}`,
        onclick: () => {
          if (!item.tags) item.tags = [];
          const idx = item.tags.indexOf(tag);
          if (idx >= 0) {
            item.tags.splice(idx, 1);
            chip.classList.remove('qa-tag-chip--active');
          } else {
            item.tags.push(tag);
            chip.classList.add('qa-tag-chip--active');
          }
          item.updatedAt = now();
          onUpdate();
        },
      },
      tag,
    );
    tagsRow.appendChild(chip);
  });
  body.appendChild(tagsRow);

  row.appendChild(body);

  // Delete button
  const deleteBtn = el(
    'button',
    {
      type: 'button',
      class: 'qa-row__delete',
      title: 'Delete this Q/A',
      'aria-label': 'Delete this Q/A',
      onclick: () => onDelete(item.id),
    },
    '🗑',
  );
  // Don't allow deletion if it's the only row
  if (totalCount <= 1) deleteBtn.setAttribute('disabled', 'disabled');
  row.appendChild(deleteBtn);

  return row;
}

// ─── Drag-and-drop reorder ──────────────────────────────────

function enableDragReorder(container, items, onReorder) {
  let dragSrcId = null;

  container.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.qa-row');
    if (!row || !e.target.classList.contains('qa-row__handle')) {
      e.preventDefault();
      return;
    }
    dragSrcId = row.getAttribute('data-qa-id');
    row.classList.add('qa-row--dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcId);
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.qa-row');
    if (!target || target.getAttribute('data-qa-id') === dragSrcId) return;
    // Visual indicator
    container.querySelectorAll('.qa-row--drag-over').forEach((el) => {
      el.classList.remove('qa-row--drag-over');
    });
    target.classList.add('qa-row--drag-over');
  });

  container.addEventListener('dragleave', (e) => {
    const target = e.target.closest('.qa-row');
    if (target) target.classList.remove('qa-row--drag-over');
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    container.querySelectorAll('.qa-row--drag-over').forEach((el) => {
      el.classList.remove('qa-row--drag-over');
    });
    const targetRow = e.target.closest('.qa-row');
    if (!targetRow) return;
    const targetId = targetRow.getAttribute('data-qa-id');
    if (targetId === dragSrcId) return;

    const fromIdx = items.findIndex((i) => i.id === dragSrcId);
    const toIdx = items.findIndex((i) => i.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    onReorder();
  });

  container.addEventListener('dragend', () => {
    container.querySelectorAll('.qa-row--dragging').forEach((el) => {
      el.classList.remove('qa-row--dragging');
    });
    dragSrcId = null;
  });
}

// ─── Main Panel Builder ─────────────────────────────────────

/**
 * Creates the Interview Q/A panel
 * @param {Object} data - the subjective data object (will read/write data.qaItems)
 * @param {Function} onUpdate - called with updated data after any change
 * @returns {HTMLElement}
 */
export function createInterviewQAPanel(data, onUpdate) {
  // Ensure qaItems array exists
  if (!Array.isArray(data.qaItems)) data.qaItems = [];

  const wrapper = el('div', { class: 'qa-panel' });

  // ── Header with count indicator
  const header = el('div', { class: 'qa-panel__header' });
  const title = el('span', { class: 'qa-panel__title' }, 'Interview Q/A');

  const counter = el('span', { class: 'qa-panel__counter' });
  const updateCounter = () => {
    const count = data.qaItems.length;
    const atTarget = count >= QA_TARGET;
    counter.textContent = `Q/A completed: ${count}`;
    counter.className = `qa-panel__counter ${atTarget ? 'qa-panel__counter--met' : 'qa-panel__counter--under'}`;
    targetBadge.textContent = atTarget ? '✓ Target met' : `Target: ${QA_TARGET}`;
    targetBadge.className = `qa-panel__target ${atTarget ? 'qa-panel__target--met' : ''}`;
  };
  const targetBadge = el('span', { class: 'qa-panel__target' });

  header.append(title, el('span', { class: 'qa-panel__header-right' }, [counter, targetBadge]));

  // ── Body (contains rows)
  const body = el('div', { class: 'qa-panel__body' });
  const listContainer = el('div', { class: 'qa-panel__list' });

  const persist = () => {
    onUpdate(data);
  };

  const renderList = () => {
    listContainer.replaceChildren();
    data.qaItems.forEach((item, idx) => {
      listContainer.appendChild(
        createQARow(item, idx, {
          onUpdate: () => {
            persist();
            updateCounter();
          },
          onDelete: (id) => {
            data.qaItems = data.qaItems.filter((i) => i.id !== id);
            persist();
            renderList();
          },
          totalCount: data.qaItems.length,
        }),
      );
    });
    updateCounter();
  };

  enableDragReorder(listContainer, data.qaItems, () => {
    persist();
    renderList();
  });

  // ── Add button
  const addBtn = el(
    'button',
    {
      type: 'button',
      class: 'qa-panel__add-btn',
      onclick: () => {
        data.qaItems.push({
          id: uid(),
          question: '',
          response: '',
          tags: [],
          followUpNeeded: false,
          followUpNote: '',
          createdAt: now(),
          updatedAt: now(),
        });
        persist();
        renderList();
        // Scroll to and focus the new question textarea
        const rows = listContainer.querySelectorAll('.qa-row');
        const lastRow = rows[rows.length - 1];
        if (lastRow) {
          lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const ta = lastRow.querySelector('.qa-row__textarea');
          if (ta) setTimeout(() => ta.focus(), 120);
        }
      },
    },
    [el('span', { 'aria-hidden': 'true' }, '+'), ' Add Question'],
  );

  body.append(listContainer, addBtn);
  wrapper.append(header, body);

  // Initial render
  renderList();
  return wrapper;
}
