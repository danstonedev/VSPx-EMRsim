// SystemsReview.js - APTA-aligned Systems Review with cascading sub-category triage
// Add / Defer segmented toggles per system.
// When Add → sub-category toggles cascade and gate specific exam panels.
// When Defer → user must select a clinical deferral reason.

import { el } from '../../../ui/utils.js';

// ── System definitions ────────────────────────────────────
const SYSTEMS = [
  { id: 'communication', label: 'Communication / Cognition' },
  { id: 'cardiovascular', label: 'Cardiovascular / Pulmonary' },
  { id: 'integumentary', label: 'Integumentary' },
  { id: 'musculoskeletal', label: 'Musculoskeletal' },
  { id: 'neuromuscular', label: 'Neuromuscular' },
  { id: 'standardizedFunctional', label: 'Standardized Functional Assessment' },
];

// ── Sub-categories per system ─────────────────────────────
const SUBCATEGORIES = {
  communication: [
    { id: 'orientation', label: 'Orientation & Alertness' },
    { id: 'memory', label: 'Memory & Attention' },
    { id: 'safetyAwareness', label: 'Safety Awareness' },
    { id: 'visionPerception', label: 'Vision & Perception' },
  ],
  cardiovascular: [
    { id: 'auscultation', label: 'Auscultation' },
    { id: 'edema', label: 'Edema' },
    { id: 'endurance', label: 'Exercise Tolerance' },
  ],
  integumentary: [
    { id: 'skinIntegrity', label: 'Skin Integrity' },
    { id: 'colorTemp', label: 'Color / Temperature' },
  ],
  musculoskeletal: [
    { id: 'rom', label: 'ROM / Flexibility' },
    { id: 'strength', label: 'Strength / MMT' },
    { id: 'specialTests', label: 'Joint Integrity / Special Tests' },
    { id: 'posture', label: 'Posture / Alignment' },
  ],
  neuromuscular: [
    { id: 'sensation', label: 'Sensation' },
    { id: 'reflexes', label: 'Reflexes' },
    { id: 'tone', label: 'Tone' },
    { id: 'cranialNerves', label: 'Cranial Nerves' },
    { id: 'coordination', label: 'Coordination' },
    { id: 'balance', label: 'Balance' },
    { id: 'gaitMobility', label: 'Gait / Functional Mobility' },
    { id: 'endurance', label: 'Endurance' },
  ],
};

// ── Deferral reason presets ───────────────────────────────
const DEFER_REASONS = [
  { value: '', label: '— Select reason —' },
  { value: 'not-indicated', label: 'Not clinically indicated' },
  { value: 'follow-up', label: 'Deferred to follow-up' },
  { value: 'unable-to-tolerate', label: 'Patient unable to tolerate' },
  { value: 'medical-precaution', label: 'Medical precaution' },
  { value: 'patient-declined', label: 'Patient declined' },
  { value: 'other-provider', label: 'Assessed by other provider' },
];

// ── Segmented toggle builder ──────────────────────────────
// Internal values: 'impaired' (Add), 'wnl' (Defer), '' (unselected).
function buildSegmentedToggle(currentStatus, onToggle) {
  const wrapper = el('div', { class: 'sr-toggle' });

  const btnAdd = el(
    'button',
    {
      type: 'button',
      class: `sr-toggle__btn sr-toggle__btn--add${currentStatus === 'impaired' ? ' sr-toggle__btn--active' : ''}`,
      onclick: () => {
        btnAdd.classList.add('sr-toggle__btn--active');
        btnDefer.classList.remove('sr-toggle__btn--active');
        onToggle('impaired');
      },
    },
    'Add',
  );
  const btnDefer = el(
    'button',
    {
      type: 'button',
      class: `sr-toggle__btn sr-toggle__btn--defer${currentStatus === 'wnl' ? ' sr-toggle__btn--active' : ''}`,
      onclick: () => {
        btnDefer.classList.add('sr-toggle__btn--active');
        btnAdd.classList.remove('sr-toggle__btn--active');
        onToggle('wnl');
      },
    },
    'Defer',
  );

  wrapper.append(btnAdd, btnDefer);
  return wrapper;
}

// ── Defer-reason dropdown builder ─────────────────────────
function buildDeferReasonSelect(currentValue, onSelect) {
  const select = el('select', { class: 'sr-defer-reason' });
  DEFER_REASONS.forEach((opt) => {
    const option = el('option', { value: opt.value }, opt.label);
    if (opt.value === (currentValue || '')) option.selected = true;
    select.append(option);
  });
  select.addEventListener('change', () => onSelect(select.value));
  return select;
}

/**
 * @param {Object} reviewData – persisted systems review data
 * @param {Function} onChange – called with updated reviewData on every change
 * @param {Function} [onGateChange] – called (no args) when any toggle changes,
 *   so ObjectiveSection can re-evaluate all panel gates.
 * @returns {HTMLElement}
 */
export function buildSystemsReview(reviewData, onChange, onGateChange) {
  const data = normalizeReviewData(reviewData);
  const fire = () => {
    onChange(data);
    if (onGateChange) onGateChange();
  };

  const header = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Systems Review'),
  ]);

  const list = el('div', { class: 'sr-list' });

  SYSTEMS.forEach((sys) => {
    const entry = data.systems[sys.id];
    const subcats = SUBCATEGORIES[sys.id] || [];

    // ── Sub-category drawer (hidden until system = Add) ───
    const subcatDrawer = el('div', { class: 'sr-subcats' });
    subcatDrawer.hidden = entry.status !== 'impaired';

    // ── System-level defer reason (shown when system = Defer) ──
    const sysDeferWrap = el('div', { class: 'sr-defer-wrap' });
    sysDeferWrap.hidden = entry.status !== 'wnl' || entry.status === '';
    sysDeferWrap.append(
      buildDeferReasonSelect(entry.deferReason, (val) => {
        entry.deferReason = val;
        fire();
      }),
    );

    subcats.forEach((sub) => {
      const subStatus = entry.subcategories[sub.id] || 'wnl';

      // Defer reason for this child (shown when child = Defer)
      const subDeferWrap = el('div', { class: 'sr-defer-wrap sr-defer-wrap--sub' });
      subDeferWrap.hidden = subStatus !== 'wnl';
      subDeferWrap.append(
        buildDeferReasonSelect(entry.deferReasons?.[sub.id], (val) => {
          entry.deferReasons[sub.id] = val;
          fire();
        }),
      );

      const row = el('div', { class: 'sr-subcat-row' }, [
        el('span', { class: 'sr-subcat-label' }, sub.label),
        buildSegmentedToggle(subStatus, (newStatus) => {
          entry.subcategories[sub.id] = newStatus;
          subDeferWrap.hidden = newStatus !== 'wnl';
          if (newStatus === 'impaired') {
            // Clear defer reason when switching to Add
            delete entry.deferReasons[sub.id];
          }
          fire();
        }),
        subDeferWrap,
      ]);
      subcatDrawer.append(row);
    });

    // ── System-level row ──────────────────────────────────
    const systemRow = el('div', { class: 'sr-system' }, [
      el('span', { class: 'sr-system-label' }, sys.label),
      buildSegmentedToggle(entry.status, (newStatus) => {
        entry.status = newStatus;
        subcatDrawer.hidden = newStatus !== 'impaired';
        sysDeferWrap.hidden = newStatus !== 'wnl';

        if (newStatus === 'impaired') {
          // Clear system-level defer reason
          entry.deferReason = '';
          // Default all children to Add
          subcats.forEach((sub) => {
            entry.subcategories[sub.id] = 'impaired';
            delete entry.deferReasons[sub.id];
          });
          // Update child toggle buttons + hide their defer dropdowns
          subcatDrawer.querySelectorAll('.sr-subcat-row').forEach((row) => {
            const btns = row.querySelectorAll('.sr-toggle__btn');
            if (btns.length === 2) {
              btns[0].classList.add('sr-toggle__btn--active'); // Add on
              btns[1].classList.remove('sr-toggle__btn--active'); // Defer off
            }
            const dw = row.querySelector('.sr-defer-wrap');
            if (dw) dw.hidden = true;
          });
        } else {
          // Switching to Defer → clear all child states
          subcats.forEach((sub) => {
            entry.subcategories[sub.id] = 'wnl';
          });
        }
        fire();
      }),
    ]);

    const block = el('div', { class: 'sr-block' }, [systemRow, sysDeferWrap, subcatDrawer]);
    list.append(block);
  });

  const body = el('div', { class: 'section-panel__body' });
  body.append(list);

  return el('div', { id: 'systems-review', class: 'section-anchor section-panel' }, [header, body]);
}

// ── Data helpers ──────────────────────────────────────────

/** Ensure every system has status + subcategories + deferral fields */
function normalizeReviewData(raw) {
  const out = { systems: {} };
  const existing = (raw && raw.systems) || {};
  SYSTEMS.forEach((sys) => {
    const old = existing[sys.id] || {};
    const subcats = {};
    const deferReasons = {};
    (SUBCATEGORIES[sys.id] || []).forEach((sub) => {
      subcats[sub.id] = old.subcategories?.[sub.id] || 'wnl';
      if (old.deferReasons?.[sub.id]) deferReasons[sub.id] = old.deferReasons[sub.id];
    });
    // Migrate old tri-state: treat 'not-tested' as unselected
    let status = old.status || '';
    if (status === 'not-tested') status = '';
    out.systems[sys.id] = {
      status,
      subcategories: subcats,
      deferReason: old.deferReason || '',
      deferReasons,
    };
  });
  return out;
}

/** Quick check: is the review at least partially filled? */
export function isSystemsReviewComplete(reviewData) {
  if (!reviewData?.systems) return false;
  return SYSTEMS.some((sys) => reviewData.systems[sys.id]?.status === 'impaired');
}

/** Returns true when a system's gate is open (status = impaired / Add) */
export function isGateOpen(reviewData, systemId) {
  return reviewData?.systems?.[systemId]?.status === 'impaired';
}

/** Returns true when a specific sub-category should reveal its panel */
export function isSubcatImpaired(reviewData, systemId, subcatId) {
  const sys = reviewData?.systems?.[systemId];
  return sys?.status === 'impaired' && sys?.subcategories?.[subcatId] === 'impaired';
}

export { SYSTEMS, SUBCATEGORIES, DEFER_REASONS };
