// artifacts-panel.js
// Renders the Case File artifacts panel (grouped list with collapse toggles and add button)
// This module is loaded on demand by ChartNavigation to keep the main bundle smaller.

import { el } from '../../ui/utils.js';
import { createIcon } from '../../ui/Icons.js';

// Local persistence of category collapse state
const ARTIFACT_COLLAPSE_KEY = 'artifactCategoryCollapse_v1';
function loadArtifactCollapseState() {
  try {
    return JSON.parse(localStorage.getItem(ARTIFACT_COLLAPSE_KEY) || '{}') || {};
  } catch (err) {
    console.warn('[ArtifactsPanel] Failed to load collapse state:', err);
    return {};
  }
}
function saveArtifactCollapseState(state) {
  try {
    localStorage.setItem(ARTIFACT_COLLAPSE_KEY, JSON.stringify(state || {}));
  } catch (err) {
    console.warn('[ArtifactsPanel] Failed to save collapse state:', err);
  }
}

// Category metadata & type normalization
const ARTIFACT_CATEGORY_META = {
  referral: { label: 'Referrals', order: 1 },
  pmh: { label: 'Past Medical History', order: 2 },
  imaging: { label: 'Imaging', order: 3 },
  labs: { label: 'Labs', order: 4 },
  meds: { label: 'Medications', order: 5 },
  vitals: { label: 'Vitals', order: 6 },
  'prior-notes': { label: 'Prior Notes', order: 7 },
  other: { label: 'Other', order: 99 },
};

function normalizeArtifactType(mod) {
  if (!mod) return 'other';
  let t = (mod.type || '').toString().toLowerCase().trim();
  const id = (mod.id || '').toString().toLowerCase();
  const title = (mod.title || '').toString().toLowerCase();
  const candidates = Object.keys(ARTIFACT_CATEGORY_META);
  if (t && candidates.includes(t)) return t;
  for (const k of candidates) {
    if (id.startsWith(`${k}-`)) return k;
  }
  const rules = [
    ['referral', /(referral|refer|consult)/i],
    ['pmh', /(past medical history|pmh|history)/i],
    ['imaging', /(x-?ray|radiograph|mri|ct\b|ultra\s?sound|us\b)/i],
    ['labs', /(lab|cbc|cmp|blood work|test)/i],
    ['meds', /(medication|meds|rx|prescription)/i],
    ['vitals', /(vital|blood pressure|bp\b|heart rate|hr\b|temperature|temp\b)/i],
    ['prior-notes', /(note|progress|previous)/i],
  ];
  for (const [k, re] of rules) {
    if (re.test(title)) return k;
  }
  return 'other';
}

function getCategoryForArtifact(mod) {
  const t = normalizeArtifactType(mod);
  return ARTIFACT_CATEGORY_META[t] ? t : 'other';
}

/**
 * Render artifacts panel into a provided container element.
 * @param {HTMLElement} container target container (will get id/class applied)
 * @param {Object} options
 * @param {Array} options.modules caseInfo.modules
 * @param {boolean} options.isFacultyMode control rendering of add button
 * @param {Function} options.onViewArtifact (mod) => void
 * @param {Function} options.onAddClicked () => void
 */
export function render(container, options) {
  const { modules = [], isFacultyMode = false, onViewArtifact, onAddClicked } = options || {};
  if (!container) return { cleanup() {} };
  container.id = 'artifact-block';
  container.className = 'artifact-block grouped-artifacts';

  const items = Array.isArray(modules) ? modules : [];
  // Group items by category
  const grouped = {};
  items.forEach((m) => {
    const cat = getCategoryForArtifact(m);
    (grouped[cat] = grouped[cat] || []).push(m);
  });
  const categories = Object.keys(grouped)
    .sort(
      (a, b) =>
        (ARTIFACT_CATEGORY_META[a]?.order || 999) - (ARTIFACT_CATEGORY_META[b]?.order || 999),
    )
    .map((k) => ({ key: k, meta: ARTIFACT_CATEGORY_META[k], items: grouped[k] }))
    .filter((c) => c.items && c.items.length);

  let collapseState = loadArtifactCollapseState();

  function renderCategory(cat) {
    const isCollapsed = !!collapseState[cat.key];
    const header = el(
      'button',
      {
        class: 'artifact-cat-header',
        'aria-expanded': String(!isCollapsed),
        onclick: () => {
          collapseState[cat.key] = !collapseState[cat.key];
          saveArtifactCollapseState(collapseState);
          container.replaceChildren(...build());
        },
      },
      [
        el(
          'span',
          { class: 'twisty', style: 'display:inline-block; width:12px;' },
          isCollapsed ? '▶' : '▼',
        ),
        el(
          'span',
          { style: 'flex:1; text-align:left;' },
          `${cat.meta?.label || cat.key} (${cat.items.length})`,
        ),
      ],
    );

    const itemButtons = cat.items.map((m) => {
      const title = m.title || (m.type ? m.type[0].toUpperCase() + m.type.slice(1) : 'Artifact');
      return el(
        'button',
        {
          class: 'artifact-entry subsection-item',
          style:
            'display:flex; align-items:center; gap:6px; width:100%; background:none; border:none;',
          onClick: () => onViewArtifact?.(m),
          title: 'View artifact',
        },
        [createIcon('file'), el('span', { class: 'artifact-entry-title' }, title)],
      );
    });

    return el('div', { class: 'artifact-category' }, [
      header,
      isCollapsed
        ? el('div')
        : el('div', { class: 'artifact-list', style: 'margin-top:4px;' }, itemButtons),
    ]);
  }

  function build() {
    const nodes = categories.map(renderCategory);
    if (isFacultyMode) {
      nodes.push(
        el(
          'div',
          { class: 'combined-neuroscreen-footer artifact-add-footer', style: 'margin-top:6px;' },
          el(
            'div',
            {
              class: 'compact-add-btn',
              title: 'Add background document',
              onclick: () => onAddClicked?.(),
            },
            '+',
          ),
        ),
      );
    }
    if (!nodes.length && isFacultyMode) {
      nodes.push(
        el(
          'div',
          { style: 'font-size:12px; margin:4px 0; color: var(--text-secondary);' },
          'No artifacts yet.',
        ),
        el(
          'div',
          { class: 'combined-neuroscreen-footer artifact-add-footer', style: 'margin-top:6px;' },
          el(
            'div',
            {
              class: 'compact-add-btn',
              title: 'Add background document',
              onclick: () => onAddClicked?.(),
            },
            '+',
          ),
        ),
      );
    }
    return nodes;
  }

  container.replaceChildren(...build());

  return {
    cleanup() {
      try {
        container.replaceChildren();
      } catch {
        /* element may not exist */
      }
    },
  };
}

// (legacy alias removed)
