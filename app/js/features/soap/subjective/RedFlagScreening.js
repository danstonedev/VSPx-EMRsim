// RedFlagScreening.js - Structured Red Flag Screening Panel
// Systematic checklist following PT clinical screening best practices
// Each flag: Not Screened → Denied (negative) → Present (positive finding)

import { el, textareaAutoResize } from '../../../ui/utils.js';

/**
 * PT red flag categories and items based on clinical practice guidelines.
 * Organized by pathology category to ensure systematic screening.
 */
const RED_FLAG_CATEGORIES = [
  {
    category: 'Cauda Equina / Cord Compression',
    items: [
      { id: 'saddle-anesthesia', label: 'Saddle anesthesia' },
      { id: 'bowel-bladder', label: 'Bowel / bladder dysfunction' },
      { id: 'bilateral-neuro', label: 'Bilateral neurological symptoms' },
      { id: 'progressive-weakness', label: 'Progressive lower extremity weakness' },
    ],
  },
  {
    category: 'Cancer / Malignancy',
    items: [
      { id: 'unexplained-weight-loss', label: 'Unexplained weight loss' },
      { id: 'cancer-history', label: 'History of cancer' },
      { id: 'constant-night-pain', label: 'Constant night pain unrelieved by position' },
      { id: 'age-new-onset', label: 'Age > 50 with new onset pain' },
    ],
  },
  {
    category: 'Fracture',
    items: [
      { id: 'major-trauma', label: 'Major trauma / mechanism' },
      { id: 'osteoporosis', label: 'Osteoporosis / steroid use' },
    ],
  },
  {
    category: 'Infection',
    items: [
      { id: 'fever-chills', label: 'Fever / chills / malaise' },
      { id: 'recent-infection', label: 'Recent infection or surgery' },
      { id: 'immunosuppression', label: 'Immunosuppression / IV drug use' },
    ],
  },
  {
    category: 'Vascular',
    items: [
      { id: 'dvt-signs', label: 'DVT signs (unilateral swelling, redness, warmth)' },
      { id: 'vbi-signs', label: 'VBI signs (dizziness, diplopia, dysarthria, drop attacks)' },
    ],
  },
  {
    category: 'Cardiac / Systemic',
    items: [
      { id: 'chest-pain', label: 'Chest pain / shortness of breath at rest' },
      { id: 'unexplained-diaphoresis', label: 'Unexplained diaphoresis' },
    ],
  },
  {
    category: 'Mental Health',
    items: [
      { id: 'phq2-little-interest', label: 'Little interest or pleasure in doing things (PHQ-2)' },
      { id: 'phq2-feeling-down', label: 'Feeling down, depressed, or hopeless (PHQ-2)' },
      { id: 'suicidal-ideation', label: 'Thoughts of self-harm or suicide' },
      {
        id: 'anxiety-excessive-worry',
        label: 'Excessive worry or anxiety affecting daily function',
      },
    ],
  },
  {
    category: 'Tobacco Use',
    items: [
      { id: 'tobacco-current', label: 'Current tobacco / nicotine use' },
      { id: 'tobacco-former', label: 'Former tobacco use' },
      { id: 'tobacco-never', label: 'Never used tobacco' },
    ],
  },
  {
    category: 'Alcohol Use',
    items: [
      { id: 'alcohol-current', label: 'Current alcohol use' },
      { id: 'alcohol-heavy', label: 'Heavy or binge drinking (≥ 4-5 drinks/occasion)' },
      { id: 'alcohol-cage-positive', label: 'CAGE screen positive (≥ 2 yes)' },
    ],
  },
];

/** Status values for each flag item */
const STATUS = {
  NOT_SCREENED: 'not-screened',
  DENIED: 'denied',
  PRESENT: 'present',
};

/** Cycle to next status on click */
function nextStatus(current) {
  if (current === STATUS.DENIED) return STATUS.PRESENT;
  if (current === STATUS.PRESENT) return STATUS.NOT_SCREENED;
  return STATUS.DENIED;
}

/** Initialize screening data, migrating from legacy string if needed */
function initScreeningData(data) {
  if (Array.isArray(data.redFlagScreening) && data.redFlagScreening.length > 0) {
    // Ensure all known items exist (in case new categories were added)
    const existing = new Set(data.redFlagScreening.map((i) => i.id));
    for (const cat of RED_FLAG_CATEGORIES) {
      for (const item of cat.items) {
        if (!existing.has(item.id)) {
          data.redFlagScreening.push({
            id: item.id,
            status: STATUS.NOT_SCREENED,
            notes: '',
          });
        }
      }
    }
    return;
  }

  // Build fresh screening array
  data.redFlagScreening = RED_FLAG_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      id: item.id,
      status: STATUS.NOT_SCREENED,
      notes: '',
    })),
  );
}

/** Build a summary string from structured screening data for backward compat */
function buildSummaryString(screeningItems, additionalNotes) {
  const denied = [];
  const present = [];

  for (const cat of RED_FLAG_CATEGORIES) {
    for (const item of cat.items) {
      const entry = screeningItems.find((s) => s.id === item.id);
      if (!entry) continue;
      if (entry.status === STATUS.DENIED) {
        denied.push(item.label);
      } else if (entry.status === STATUS.PRESENT) {
        const detail = entry.notes ? ` (${entry.notes})` : '';
        present.push(`${item.label}${detail}`);
      }
    }
  }

  const parts = [];
  if (present.length) parts.push(`PRESENT: ${present.join('; ')}`);
  if (denied.length) parts.push(`Denied: ${denied.join(', ')}`);
  if (additionalNotes) parts.push(`Notes: ${additionalNotes}`);
  if (!parts.length) return '';
  return parts.join('. ');
}

/**
 * Red Flag Screening Component
 * Creates a structured checklist panel for systematic red flag screening.
 */
export const RedFlagScreening = {
  /**
   * @param {Object} data - Current subjective data (reads/writes redFlagScreening, redFlags, redFlagNotes)
   * @param {Function} updateField - Function to update a single field
   * @returns {HTMLElement}
   */
  create(data, updateField) {
    initScreeningData(data);

    const wrapper = el('div', { class: 'rf-panel' });

    // Persist helper — update structured data and derived summary string
    const persist = () => {
      updateField('redFlagScreening', data.redFlagScreening);
      updateField('redFlags', buildSummaryString(data.redFlagScreening, data.redFlagNotes || ''));
    };

    const statusBadge = el('span', { class: 'rf-panel__badge' });

    // ── Body
    const body = el('div', { class: 'rf-panel__body' });
    wrapper.append(body);

    function updateBadge() {
      const total = data.redFlagScreening.length;
      const screened = data.redFlagScreening.filter((i) => i.status !== STATUS.NOT_SCREENED).length;
      const positives = data.redFlagScreening.filter((i) => i.status === STATUS.PRESENT).length;

      statusBadge.textContent = `${screened}/${total} screened`;
      statusBadge.className = 'rf-panel__badge';
      if (positives > 0) {
        statusBadge.classList.add('rf-panel__badge--alert');
        statusBadge.textContent += ` · ${positives} positive`;
      } else if (screened === total) {
        statusBadge.classList.add('rf-panel__badge--clear');
      }
    }

    // ── Render categories
    function renderBody(options = {}) {
      const preserveScroll = !!options.preserveScroll;
      const focusFlagId = options.focusFlagId || '';
      const prevScrollY = preserveScroll ? window.scrollY : null;

      body.replaceChildren();

      // Top action bar
      const toolbar = el('div', { class: 'rf-panel__toolbar' });
      const denyAllBtn = el(
        'button',
        {
          type: 'button',
          class: 'rf-panel__deny-all-btn',
          onclick: () => {
            data.redFlagScreening.forEach((item) => {
              if (item.status === STATUS.NOT_SCREENED) {
                item.status = STATUS.DENIED;
              }
            });
            persist();
            renderBody();
          },
        },
        'Deny All Unscreened',
      );

      const resetBtn = el(
        'button',
        {
          type: 'button',
          class: 'rf-panel__reset-btn',
          onclick: () => {
            data.redFlagScreening.forEach((item) => {
              item.status = STATUS.NOT_SCREENED;
              item.notes = '';
            });
            persist();
            renderBody();
          },
        },
        'Reset',
      );
      toolbar.append(denyAllBtn, resetBtn);

      const topbar = el('div', { class: 'rf-panel__topbar' }, [
        toolbar,
        el('div', { class: 'rf-panel__topbar-right' }, [statusBadge]),
      ]);
      body.append(topbar);

      for (const cat of RED_FLAG_CATEGORIES) {
        const itemsList = el('div', { class: 'rf-panel__items' });
        for (const item of cat.items) {
          const entry = data.redFlagScreening.find((s) => s.id === item.id);
          if (!entry) continue;
          itemsList.append(createFlagRow(item, entry, persist, renderBody));
        }

        const catEl = el('div', { class: 'gated-card rf-panel__category' }, [
          el('div', { class: 'gated-card__header' }, [
            el('span', { class: 'rf-panel__category-label' }, cat.category),
          ]),
          itemsList,
        ]);
        body.append(catEl);
      }

      // Additional notes textarea
      const notesInput = el('textarea', {
        class:
          'rf-panel__notes-input combined-neuroscreen__input combined-neuroscreen__input--left',
        rows: 1,
        placeholder: 'Additional screening observations…',
        style: 'width: 100%; resize: vertical;',
      });
      notesInput.value = data.redFlagNotes || '';
      textareaAutoResize(notesInput);
      notesInput.addEventListener('blur', () => {
        data.redFlagNotes = notesInput.value;
        persist();
      });
      body.append(
        el('div', { class: 'gated-card rf-panel__notes-card' }, [
          el('div', { class: 'gated-card__header' }, [
            el('span', { class: 'rf-panel__notes-label' }, 'Notes'),
          ]),
          notesInput,
        ]),
      );

      updateBadge();

      if (preserveScroll) {
        requestAnimationFrame(() => {
          if (typeof prevScrollY === 'number') {
            window.scrollTo({ top: prevScrollY, left: window.scrollX, behavior: 'auto' });
          }
          if (focusFlagId) {
            const targetBtn = body.querySelector(
              `.rf-panel__status-btn[data-flag-id="${focusFlagId}"]`,
            );
            if (targetBtn) targetBtn.focus({ preventScroll: true });
          }
        });
      }
    }

    renderBody();
    return wrapper;
  },
};

function createFlagRow(item, entry, persist, renderBody) {
  const row = el('div', { class: 'rf-panel__row' });

  // Status button — cycles through Not Screened → Denied → Present
  const statusBtn = el('button', {
    type: 'button',
    class: `rf-panel__status-btn rf-panel__status-btn--${entry.status}`,
    'data-flag-id': item.id,
    title: statusTitle(entry.status),
    onclick: () => {
      entry.status = nextStatus(entry.status);
      if (entry.status !== STATUS.PRESENT) entry.notes = '';
      persist();
      renderBody({ preserveScroll: true, focusFlagId: item.id });
    },
  });
  statusBtn.textContent = statusIcon(entry.status);

  const label = el(
    'span',
    {
      class: `rf-panel__row-label ${entry.status === STATUS.PRESENT ? 'rf-panel__row-label--alert' : ''}`,
    },
    item.label,
  );

  const main = el('div', { class: 'rf-panel__row-main' }, [statusBtn, label]);
  row.append(main);

  // Notes input appears only when status is "present"
  if (entry.status === STATUS.PRESENT) {
    const notesInput = el('input', {
      type: 'text',
      class: 'rf-panel__row-notes combined-neuroscreen__input combined-neuroscreen__input--left',
      placeholder: 'Details…',
      value: entry.notes || '',
    });
    notesInput.addEventListener('blur', () => {
      entry.notes = notesInput.value;
      persist();
    });
    row.append(notesInput);
  }

  return row;
}

function statusIcon(status) {
  if (status === STATUS.DENIED) return '✓';
  if (status === STATUS.PRESENT) return '⚠';
  return '—';
}

function statusTitle(status) {
  if (status === STATUS.DENIED) return 'Denied (click to mark present)';
  if (status === STATUS.PRESENT) return 'Present (click to reset)';
  return 'Not screened (click to deny)';
}
