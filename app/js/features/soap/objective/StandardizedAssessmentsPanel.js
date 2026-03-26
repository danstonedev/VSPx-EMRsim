import { el } from '../../../ui/utils.js';
import { textAreaField } from '../../../ui/form-components.js';
import { buildBrandedModal, closeBrandedModal, openBrandedModal } from '../../../ui/ModalShell.js';
import { subsectionPanel } from './GatedPanels.js';
import {
  createAssessmentInstance,
  formatAssessmentScoreSummary,
  listAssessmentDefinitions,
  normalizeStandardizedAssessments,
} from './standardized-assessment-definitions.js';

function getScoreOptions(definition) {
  const min = definition.scoreRange?.min ?? 0;
  const max = definition.scoreRange?.max ?? 4;
  const values = [];
  for (let score = min; score <= max; score += 1) values.push(score);
  return values;
}

function getScoreDescriptionMap(definition) {
  const map = {};
  if (!Array.isArray(definition?.rubricScale)) return map;
  for (const row of definition.rubricScale) {
    map[String(row.score)] = row.description || '';
  }
  return map;
}

function createInfoTip(text, label) {
  if (!text) return null;
  return el(
    'button',
    {
      type: 'button',
      class: 'std-inline-tip std-tip-target',
      'aria-label': label || text,
      'data-tip': text,
    },
    '?',
  );
}

function createScoreRadioGroup({ definition, assessment, item, scoreDescriptions, onScoreChange }) {
  const scoreValues = getScoreOptions(definition);
  const current = assessment.responses?.[item.id];
  const currentScore =
    current === '' || current === null || current === undefined ? null : Number(current);
  const itemRubric = definition?.itemRubrics?.[item.id];
  const group = el('div', {
    class: 'std-score-group',
    role: 'group',
    'aria-label': `${item.label} score selection`,
  });

  scoreValues.forEach((score) => {
    const isChecked = currentScore === score;
    const specific = itemRubric?.scores?.[score];
    const fallback = scoreDescriptions[String(score)] || '';
    const desc = specific || fallback;
    const tip = desc ? `Score ${score}: ${desc}` : `Score ${score}`;
    const chip = el(
      'button',
      {
        type: 'button',
        class: `std-score-chip std-tip-target ${isChecked ? 'is-active' : ''}`,
        'data-tip': tip,
        'aria-pressed': isChecked ? 'true' : 'false',
        'aria-label': `${item.label} score ${score}${isChecked ? ', selected' : ''}`,
        onClick: () => {
          const shouldClear = chip.getAttribute('aria-pressed') === 'true';
          const nextValue = shouldClear ? '' : score;

          group.querySelectorAll('.std-score-chip').forEach((button) => {
            button.setAttribute('aria-pressed', 'false');
            button.classList.remove('is-active');
          });

          if (!shouldClear) {
            chip.setAttribute('aria-pressed', 'true');
            chip.classList.add('is-active');
          }

          onScoreChange(item.id, nextValue);
        },
      },
      el('span', { class: 'std-score-chip__text' }, String(score)),
    );
    group.appendChild(chip);
  });

  return group;
}

function createInstrumentTable(definition, assessment, onScoreChange) {
  const scoreDescriptions = getScoreDescriptionMap(definition);
  const table = el('table', { class: 'std-assessment-table' });
  const thead = el('thead', { class: 'std-assessment-table__head' }, [
    el('tr', { class: 'std-assessment-table__row std-assessment-table__row--head' }, [
      el(
        'th',
        {
          class: 'std-assessment-table__head-cell std-assessment-table__head-cell--item',
          scope: 'col',
        },
        'Item',
      ),
      el(
        'th',
        {
          class: 'std-assessment-table__head-cell std-assessment-table__head-cell--score',
          scope: 'col',
        },
        'Score',
      ),
    ]),
  ]);
  const tbody = el('tbody', { class: 'std-assessment-table__body' });
  const title = assessment.title || definition.name;

  for (const item of definition.items || []) {
    const score = assessment.responses?.[item.id];
    const itemRubric = definition?.itemRubrics?.[item.id];
    const cue = itemRubric?.instructions || itemRubric?.focus || '';
    const hasScore =
      score !== '' && score !== null && score !== undefined && Number.isFinite(Number(score));
    const row = el('tr', { class: `std-assessment-table__row ${hasScore ? 'is-scored' : ''}` }, [
      el(
        'td',
        {
          class:
            'std-assessment-table__cell std-assessment-table__cell--item std-assessment-item-cell',
        },
        [
          el('div', { class: 'std-assessment-item-wrap' }, [
            el('span', { class: 'std-assessment-item-label' }, item.label),
            createInfoTip(cue, `Instructions for ${item.label}`),
          ]),
        ],
      ),
      el('td', { class: 'std-assessment-table__cell std-assessment-table__cell--score' }, [
        createScoreRadioGroup({
          definition,
          assessment,
          item,
          scoreDescriptions,
          onScoreChange,
        }),
      ]),
    ]);
    tbody.appendChild(row);
  }

  table.append(el('caption', { class: 'sr-only' }, `${title} detailed item scoring`), thead, tbody);
  return el('div', { class: 'std-assessment-table-wrap' }, [table]);
}

function createAssessmentModal({ assessment, definition, onClose, onUpdate }) {
  const dialogId = `std-assessment-dialog-${assessment.id}`;
  const titleId = `${dialogId}-title`;
  const scoreId = `${dialogId}-score`;
  const helpId = `${dialogId}-help`;
  let workingAssessment = assessment;

  const scoreSummaryText = el(
    'p',
    { id: scoreId, class: 'std-assessment-modal__score text-secondary fs-14' },
    `Current score: ${formatAssessmentScoreSummary(assessment) || 'Not yet scored'}`,
  );

  function commitWorkingAssessment(updated, afterUpdate) {
    workingAssessment = updated;
    onUpdate(updated, (normalized) => {
      if (normalized) workingAssessment = normalized;
      if (afterUpdate) afterUpdate(normalized);
    });
  }

  const footerCloseButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--sm secondary',
      onClick: onClose,
    },
    'Close',
  );
  const modal = buildBrandedModal({
    title: assessment.title || definition.name,
    titleId,
    headerLead: el('div', { class: 'std-assessment-modal__heading' }, [
      el(
        'h4',
        { id: titleId, class: 'std-assessment-modal__title' },
        assessment.title || definition.name,
      ),
      scoreSummaryText,
    ]),
    overlayClass: 'std-assessment-modal-overlay',
    contentClass: 'std-assessment-modal popup-card-base',
    headerClass: 'std-assessment-modal__header',
    bodyClass: 'std-assessment-modal__body',
    footerClass: 'std-assessment-modal__actions',
    closeButtonClass: 'std-assessment-close-btn',
    showCloseButton: false,
    contentTag: 'section',
    closeLabel: `Close ${assessment.title || definition.name} details`,
    bodyChildren: [
      el(
        'p',
        { id: helpId, class: 'text-secondary fs-14 std-assessment-inline-help' },
        'Select a score chip for each item. Hover or focus score chips and info icons for just-in-time rubric cues.',
      ),
      createInstrumentTable(definition, assessment, (itemId, next) => {
        const updated = {
          ...workingAssessment,
          responses: {
            ...(workingAssessment.responses || {}),
            [itemId]: next === '' ? '' : Number(next),
          },
        };
        commitWorkingAssessment(updated, (normalized) => {
          scoreSummaryText.textContent = `Current score: ${formatAssessmentScoreSummary(normalized) || 'Not yet scored'}`;
        });
      }),
      el('div', { class: 'std-assessment-modal__meta' }, [
        textAreaField({
          label: 'Notes',
          value: assessment.notes || '',
          onChange: (value) => {
            const updated = { ...workingAssessment, notes: value };
            commitWorkingAssessment(updated);
          },
          rows: 1,
          hint: 'Only documented assessment data is exported. In-app tips are for guidance only.',
        }),
      ]),
    ],
    footerChildren: [footerCloseButton],
    onRequestClose: onClose,
  });

  modal.card.id = dialogId;
  modal.card.setAttribute('aria-describedby', scoreId);
  return { overlay: modal.overlay, closeButton: footerCloseButton };
}

function createAssessmentCard(assessment, definitionsByKey, onOpenDetails, onRemove) {
  const definition = definitionsByKey[assessment.instrumentKey];
  const title = assessment.title || definition?.name || 'Standardized Assessment';
  const statusText = assessment.status === 'complete' ? 'Complete' : 'In Progress';
  const scoreSummary = formatAssessmentScoreSummary(assessment);
  const completedItems = assessment.scores?.completedItems || 0;
  const totalItems = assessment.scores?.totalItems || 0;

  const header = el('div', { class: 'std-assessment-card__header' }, [
    el('h5', { class: 'std-assessment-card__title' }, title),
    el(
      'button',
      {
        type: 'button',
        class: 'btn btn--sm secondary',
        onClick: onRemove,
        title: `Remove ${title}`,
        'aria-label': `Remove ${title}`,
      },
      'Remove',
    ),
  ]);

  const summaryLine = el(
    'div',
    { class: 'std-assessment-summary', role: 'status', 'aria-live': 'polite' },
    [
      el(
        'span',
        {
          class: `std-assessment-pill ${
            assessment.status === 'complete' ? 'is-complete' : 'is-progress'
          }`,
        },
        statusText,
      ),
      scoreSummary
        ? el('span', { class: 'std-assessment-pill is-score' }, `Score ${scoreSummary}`)
        : null,
      totalItems
        ? el(
            'span',
            { class: 'std-assessment-pill is-count' },
            `${completedItems}/${totalItems} items`,
          )
        : null,
    ].filter(Boolean),
  );

  const metaLine = [
    assessment.assessor ? `Assessor: ${assessment.assessor}` : null,
    assessment.performedAt ? `Date: ${assessment.performedAt}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return el('div', { class: 'gated-card std-assessment-card' }, [
    header,
    summaryLine,
    metaLine ? el('p', { class: 'text-secondary fs-14 std-assessment-meta-line' }, metaLine) : null,
    el(
      'button',
      {
        type: 'button',
        class: 'btn btn--sm secondary std-assessment-open-btn',
        onClick: onOpenDetails,
        'aria-label': `Open ${title} detailed scoring`,
      },
      'Open Detailed Scoring',
    ),
  ]);
}

export function createStandardizedAssessmentsPanel(inputData, onChange) {
  const definitions = listAssessmentDefinitions();
  const definitionsByKey = Object.fromEntries(definitions.map((d) => [d.key, d]));
  let selectedInstrumentKey = definitions[0]?.key || '';
  let assessments = normalizeStandardizedAssessments(inputData);
  let activeModalCleanup = null;

  const cardsContainer = el('div', { class: 'gated-stack' });
  const sectionContent = el('div', { class: 'subsection-panel__content' });

  function commit(nextAssessments) {
    assessments = normalizeStandardizedAssessments(nextAssessments);
    onChange(assessments);
    renderCards();
  }

  function closeActiveModal() {
    if (!activeModalCleanup) return;
    activeModalCleanup();
    activeModalCleanup = null;
  }

  function openDetailsModal(index) {
    closeActiveModal();
    const current = assessments[index];
    if (!current) return;
    const definition = definitionsByKey[current.instrumentKey];
    if (!definition) return;

    const previousFocus = document.activeElement;
    const { overlay, closeButton } = createAssessmentModal({
      assessment: current,
      definition,
      onClose: () => closeActiveModal(),
      onUpdate: (updated, afterUpdate) => {
        const next = [...assessments];
        next[index] = updated;
        const normalizedNext = normalizeStandardizedAssessments(next);
        const normalizedItem = normalizedNext[index];
        assessments = normalizedNext;
        onChange(assessments);
        renderCards();
        if (afterUpdate && normalizedItem) afterUpdate(normalizedItem);
      },
    });

    const keyHandler = (event) => {
      if (event.key === 'Escape') closeActiveModal();
    };
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeActiveModal();
    });
    document.addEventListener('keydown', keyHandler);
    openBrandedModal(
      { overlay, card: overlay.querySelector('.popup-card-base') },
      { focusTarget: closeButton, focusDelay: 0 },
    );

    activeModalCleanup = () => {
      document.removeEventListener('keydown', keyHandler);
      closeBrandedModal(
        { overlay, card: overlay.querySelector('.popup-card-base') },
        {
          cleanup: () => {
            if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
          },
        },
      );
    };
  }

  function renderCards() {
    cardsContainer.replaceChildren();
    if (!assessments.length) {
      cardsContainer.appendChild(
        el(
          'p',
          { class: 'text-secondary fs-14' },
          'No standardized functional assessments added yet.',
        ),
      );
      return;
    }

    assessments.forEach((assessment, index) => {
      cardsContainer.appendChild(
        createAssessmentCard(
          assessment,
          definitionsByKey,
          () => openDetailsModal(index),
          () => {
            if (activeModalCleanup) closeActiveModal();
            const next = assessments.filter((_, i) => i !== index);
            commit(next);
          },
        ),
      );
    });
  }

  const selectId = 'standardized-assessment-instrument';
  const instrumentSelect = el('select', {
    id: selectId,
    class: 'combined-neuroscreen__input',
    'aria-describedby': 'standardized-assessment-help',
  });
  definitions.forEach((definition) => {
    instrumentSelect.appendChild(el('option', { value: definition.key }, definition.name));
  });
  instrumentSelect.addEventListener('change', (event) => {
    selectedInstrumentKey = event.target.value;
  });

  const addButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--sm secondary',
      onClick: () => {
        const newAssessment = createAssessmentInstance(selectedInstrumentKey);
        if (!newAssessment) return;
        commit([...assessments, newAssessment]);
      },
    },
    'Add Assessment',
  );

  sectionContent.append(
    el('div', { class: 'std-assessment-toolbar' }, [
      el('div', { class: 'gated-metric std-assessment-instrument' }, [
        el('label', { class: 'gated-metric__label', for: selectId }, 'Instrument'),
        instrumentSelect,
      ]),
      el('div', { class: 'std-assessment-actions' }, [addButton]),
    ]),
    el(
      'p',
      { id: 'standardized-assessment-help', class: 'text-secondary fs-14 std-assessment-help' },
      'Open detailed scoring to use fast score chips with inline tips.',
    ),
    cardsContainer,
  );

  renderCards();
  return subsectionPanel('standardized-assessments', 'Standardized Functional Assessments', [
    el('div', { class: 'std-assessment-panel' }, [sectionContent]),
  ]);
}
