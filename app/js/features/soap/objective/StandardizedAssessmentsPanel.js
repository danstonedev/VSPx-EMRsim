import { el } from '../../../ui/utils.js';
import { textAreaField } from '../../../ui/form-components.js';
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
    'i',
  );
}

function isNumericType(definition) {
  return definition.measurementType === 'timed' || definition.measurementType === 'distance';
}

function getStatusLabel(assessment) {
  if (!assessment) return 'Not started';
  return assessment.status === 'complete' ? 'Complete' : 'In progress';
}

function getStatusClass(assessment) {
  if (!assessment) return 'is-idle';
  return assessment.status === 'complete' ? 'is-complete' : 'is-progress';
}

function getMetricLabel(assessment) {
  if (!assessment) return '';
  if (assessment.status === 'complete') {
    return (
      formatAssessmentScoreSummary(assessment) ||
      `${assessment.scores.total}/${assessment.scores.max}`
    );
  }
  if ((assessment.scores?.completedItems || 0) > 0) {
    return `Score ${assessment.scores.total}/${assessment.scores.max}`;
  }
  if ((assessment.notes || '').trim()) {
    return 'Notes added';
  }
  return '';
}

function createScoreChipGroup({ definition, assessment, item, onScoreChange }) {
  const scoreDescriptions = getScoreDescriptionMap(definition);
  const current = assessment?.responses?.[item.id];
  const currentScore =
    current === '' || current === null || current === undefined ? null : Number(current);
  const itemRubric = definition?.itemRubrics?.[item.id];
  const group = el('div', {
    class: 'std-score-group',
    role: 'group',
    'aria-label': `${item.label} score selection`,
  });

  getScoreOptions(definition).forEach((score) => {
    const specific = itemRubric?.scores?.[score];
    const fallback = scoreDescriptions[String(score)] || '';
    const desc = specific || fallback;
    const tip = desc ? `Score ${score}: ${desc}` : `Score ${score}`;
    const isChecked = currentScore === score;

    group.appendChild(
      el(
        'button',
        {
          type: 'button',
          class: `std-score-chip std-tip-target ${isChecked ? 'is-active' : ''}`,
          'data-tip': tip,
          'aria-pressed': isChecked ? 'true' : 'false',
          'aria-label': `${item.label} score ${score}${isChecked ? ', selected' : ''}`,
          onClick: () => onScoreChange(item.id, score),
        },
        el('span', { class: 'std-score-chip__text' }, String(score)),
      ),
    );
  });

  return group;
}

function createInstrumentTable({ definition, assessment, onScoreChange, onNumericBlur }) {
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
  const title = assessment?.title || definition.name;

  for (const item of definition.items || []) {
    const itemRubric = definition?.itemRubrics?.[item.id];
    const cue = itemRubric?.instructions || '';
    const currentValue = assessment?.responses?.[item.id];

    const scoreCell = isNumericType(definition)
      ? (() => {
          const input = document.createElement('input');
          input.type = 'text';
          input.inputMode = 'decimal';
          input.className = 'form-input form-input--normal std-assessment-numeric';
          input.placeholder = definition.unit || '';
          input.setAttribute('aria-label', item.label);
          input.value =
            currentValue === '' || currentValue === undefined || currentValue === null
              ? ''
              : String(currentValue);
          input.addEventListener('blur', (event) => onNumericBlur(item.id, event.target.value));
          return el('div', { class: 'std-assessment-numeric-wrap' }, [
            input,
            definition.unit ? el('span', { class: 'std-assessment-unit' }, definition.unit) : null,
          ]);
        })()
      : createScoreChipGroup({
          definition,
          assessment,
          item,
          onScoreChange,
        });

    tbody.appendChild(
      el('tr', { class: 'std-assessment-table__row' }, [
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
          scoreCell,
        ]),
      ]),
    );
  }

  table.append(el('caption', { class: 'sr-only' }, `${title} detailed item scoring`), thead, tbody);
  return el('div', { class: 'std-assessment-table-wrap' }, [table]);
}

function createAssessmentCard({
  definition,
  assessment,
  expanded,
  onToggle,
  onReset,
  onScoreChange,
  onNumericBlur,
  onNotesChange,
}) {
  const metricLabel = getMetricLabel(assessment);
  const summaryChildren = [
    el(
      'span',
      {
        class: `std-assessment-pill ${getStatusClass(assessment)}`,
      },
      getStatusLabel(assessment),
    ),
  ];

  if (assessment && metricLabel) {
    summaryChildren.push(el('span', { class: 'std-assessment-pill is-score' }, metricLabel));
  }

  if (assessment && assessment.scores?.totalItems) {
    summaryChildren.push(
      el(
        'span',
        { class: 'std-assessment-pill is-count' },
        `${assessment.scores.completedItems}/${assessment.scores.totalItems} items`,
      ),
    );
  }

  summaryChildren.push(
    el(
      'span',
      {
        class: `std-assessment-chevron ${expanded ? 'is-open' : ''}`,
        'aria-hidden': 'true',
      },
      '▾',
    ),
  );

  const header = el('div', { class: 'std-assessment-card__header' }, [
    el(
      'button',
      {
        type: 'button',
        class: 'std-assessment-card__toggle',
        'aria-expanded': expanded ? 'true' : 'false',
        'aria-controls': `std-assessment-details-${definition.key}`,
        onClick: onToggle,
      },
      [
        el('div', { class: 'std-assessment-card__identity' }, [
          el('span', { class: 'std-assessment-card__title' }, definition.name),
          el('span', { class: 'std-assessment-card__subtitle' }, definition.instructions),
        ]),
        el(
          'div',
          { class: 'std-assessment-summary', role: 'status', 'aria-live': 'polite' },
          summaryChildren,
        ),
      ],
    ),
    assessment
      ? el(
          'button',
          {
            type: 'button',
            class: 'btn btn--sm secondary std-assessment-reset-btn',
            onClick: onReset,
            'aria-label': `Reset ${definition.name}`,
          },
          'Reset',
        )
      : null,
  ]);

  const detailAssessment = assessment || createAssessmentInstance(definition.key);
  const detailsBody = el('div', { class: 'std-assessment-details__body' }, [
    el('div', { class: 'std-assessment-details__lead' }, [
      el(
        'p',
        { class: 'text-secondary fs-14 std-assessment-inline-help' },
        isNumericType(definition)
          ? 'Enter measured values for each item to save this instrument to the note.'
          : 'Select a score chip for each item. Hover or focus score chips and info icons for just-in-time rubric cues.',
      ),
      assessment
        ? el('div', { class: 'std-assessment-live-summary' }, [
            el('div', { class: 'std-assessment-live-summary__label' }, 'Live Summary'),
            el(
              'div',
              { class: 'std-assessment-live-summary__value' },
              formatAssessmentScoreSummary(assessment) ||
                `${assessment.scores?.total || 0}/${assessment.scores?.max || 0}`,
            ),
          ])
        : null,
    ]),
    createInstrumentTable({
      definition,
      assessment: detailAssessment,
      onScoreChange,
      onNumericBlur,
    }),
    textAreaField({
      label: 'Notes',
      value: assessment?.notes || '',
      onChange: onNotesChange,
      rows: 2,
      className: 'std-assessment-notes',
      hint: 'Only documented assessment data is exported. In-app tips are for guidance only.',
    }),
  ]);

  const details = el(
    'div',
    {
      id: `std-assessment-details-${definition.key}`,
      class: `std-assessment-details ${expanded ? 'is-open' : ''}`,
    },
    [detailsBody],
  );
  details.hidden = !expanded;

  return el('div', { class: 'gated-card std-assessment-card std-assessment-card--modern' }, [
    header,
    details,
  ]);
}

export function createStandardizedAssessmentsPanel(inputData, onChange) {
  const definitions = listAssessmentDefinitions().filter(
    (definition) => Array.isArray(definition.disciplines) && definition.disciplines.includes('pt'),
  );
  const definitionOrder = new Map(definitions.map((definition, index) => [definition.key, index]));
  let assessments = normalizeStandardizedAssessments(inputData);
  const expandedKeys = {};

  const cardsContainer = el('div', { class: 'gated-stack std-assessment-list' });

  function getAssessmentByKey(key) {
    return assessments.find((assessment) => assessment.instrumentKey === key) || null;
  }

  function commit(nextAssessments) {
    const dedupedByKey = new Map();
    normalizeStandardizedAssessments(nextAssessments).forEach((assessment) => {
      dedupedByKey.set(assessment.instrumentKey, assessment);
    });

    assessments = [...dedupedByKey.values()].sort((a, b) => {
      const aIndex = definitionOrder.get(a.instrumentKey) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = definitionOrder.get(b.instrumentKey) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });

    onChange(assessments);
    renderCards();
  }

  function upsertAssessment(key, updater) {
    const current = getAssessmentByKey(key) || createAssessmentInstance(key);
    if (!current) return;
    const next = assessments.filter((assessment) => assessment.instrumentKey !== key);
    commit([...next, updater(current)]);
  }

  function resetAssessment(key) {
    commit(assessments.filter((assessment) => assessment.instrumentKey !== key));
  }

  function renderCards() {
    cardsContainer.replaceChildren();

    definitions.forEach((definition) => {
      const assessment = getAssessmentByKey(definition.key);

      cardsContainer.appendChild(
        createAssessmentCard({
          definition,
          assessment,
          expanded: Boolean(expandedKeys[definition.key]),
          onToggle: () => {
            expandedKeys[definition.key] = !expandedKeys[definition.key];
            renderCards();
          },
          onReset: () => resetAssessment(definition.key),
          onScoreChange: (itemId, score) => {
            upsertAssessment(definition.key, (current) => {
              const currentValue = current.responses?.[itemId];
              const nextValue = currentValue === score ? '' : score;
              return {
                ...current,
                responses: {
                  ...(current.responses || {}),
                  [itemId]: nextValue,
                },
              };
            });
          },
          onNumericBlur: (itemId, raw) => {
            if (!assessment && !String(raw || '').trim()) return;

            upsertAssessment(definition.key, (current) => {
              const trimmed = String(raw || '').trim();
              const parsed = trimmed === '' ? '' : Number.parseFloat(trimmed);
              const value = Number.isFinite(parsed) ? parsed : '';
              return {
                ...current,
                responses: {
                  ...(current.responses || {}),
                  [itemId]: value,
                },
              };
            });
          },
          onNotesChange: (notes) => {
            if (!assessment && !String(notes || '').trim()) return;
            upsertAssessment(definition.key, (current) => ({ ...current, notes }));
          },
        }),
      );
    });
  }

  renderCards();

  return subsectionPanel('standardized-assessments', 'Standardized Functional Assessments', [
    el('div', { class: 'std-assessment-panel' }, [cardsContainer]),
  ]);
}
