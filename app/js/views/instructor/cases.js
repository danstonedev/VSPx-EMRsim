import { route } from '../../core/router.js';
import {
  navigate as urlNavigate,
  buildLink as buildUrlLink,
  getRoute as getUrlRoute,
  setQueryParams as setUrlQuery,
} from '../../core/url.js';
import { createCustomSelect } from '../../ui/CustomSelect.js';
import { showConfirmModal } from '../../ui/ConfirmModal.js';
import { createCaseBadge, createAuthorBadge } from '../../ui/CaseBadge.js';
// Lazy-load store functions to avoid static/dynamic import mix warnings
async function _listCases() {
  const store = await import('../../core/store.js');
  if (typeof store.listCaseSummaries === 'function') {
    return store.listCaseSummaries();
  }
  // Fallback for older bundles: load full cases and map to summaries
  if (typeof store.listCases === 'function') {
    const list = await store.listCases();
    return (list || []).map((c) => ({
      id: c.id,
      title: c.title || c.caseObj?.meta?.title || 'Untitled Case',
      latestVersion: c.latestVersion || 0,
      isStored: true,
    }));
  }
  throw new Error('Store API not available');
}
async function _createCase(caseObj) {
  const { createCase } = await import('../../core/store.js');
  return createCase(caseObj);
}
async function _deleteCase(id) {
  const { deleteCase } = await import('../../core/store.js');
  return deleteCase(id);
}
import { generateCase } from '../../services/index.js';
import { el } from '../../ui/utils.js';
import {
  parseAndValidateCaseForm,
  createSortableHeader,
  handleSortClick,
  sortCases,
} from './InstructorCasesUtils.js';
// Stop importing JS icons; we'll use the HTML sprite via <use>

// Compute age from a YYYY-MM-DD string
function computeAgeFromDob(dobStr) {
  if (!dobStr) return '';
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 200 ? String(age) : '';
}

// Lightweight YouTube-style Share Popup
function showSharePopup(url) {
  const overlay = el('div', {
    class: 'modal-overlay popup-overlay-base',
    role: 'dialog',
    'aria-modal': 'true',
    onclick: (e) => {
      if (e.target === overlay) close();
    },
  });
  const statusEl = el('div', {
    class: 'small text-secondary mt-8',
    'aria-live': 'polite',
    className: 'small text-secondary mt-8 minh-1em',
  });

  let inputRef;
  const copyBtn = el(
    'button',
    {
      class: 'btn primary small',
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          statusEl.textContent = 'Link copied to clipboard';
        } catch {
          statusEl.textContent = 'Copy failed. Select the input and copy manually.';
        }
        setTimeout(() => (statusEl.textContent = ''), 2500);
      },
    },
    'Copy link',
  );

  const card = el(
    'div',
    {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': 'Share',
      class: 'popup-card-base bg-surface text-color br-lg shadow-modal p-20 w-92 maxw-520 relative',
      onclick: (e) => e.stopPropagation(),
    },
    [
      el('div', { class: 'd-flex ai-center jc-between mb-12' }, [
        el('h3', { class: 'm-0 fs-18 fw-600' }, 'Share link'),
        el('button', { class: 'btn icon', 'aria-label': 'Close', onclick: () => close() }, '✕'),
      ]),
      el('p', { class: 'small m-0 mb-8 text-secondary' }, 'Share this URL with students.'),
      el('div', { class: 'd-flex gap-8 ai-center' }, [
        (inputRef = el('input', {
          type: 'text',
          value: url,
          readOnly: true,
          class: 'form-input-standard w-100 box-border flex-1',
          onclick: (e) => {
            e.target.select();
          },
        })),
        copyBtn,
      ]),
      statusEl,
    ],
  );
  overlay.append(card);
  document.body.appendChild(overlay);
  function close() {
    overlay.classList.remove('is-open');
    card.classList.remove('is-open');
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const removeNow = () => {
      try {
        overlay.remove();
      } catch {
        /* element may not exist */
      }
    };
    if (prefersReduce) return removeNow();
    overlay.addEventListener('transitionend', removeNow, { once: true });
    setTimeout(removeNow, 450);
  }
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    card.classList.add('is-open');
    setTimeout(() => inputRef?.select(), 90);
  });
}

function showCaseCreationModal() {
  const modal = el('div', {
    'data-modal': 'create-case',
    class:
      'modal-overlay popup-overlay-base fixed inset-0 overlay-50 d-flex ai-center jc-center z-modal',
    onclick: (e) => {
      if (e.target === modal) close();
    },
  });
  const card = el(
    'div',
    {
      class: 'modal-content case-details-modal popup-card-base',
      onclick: (e) => e.stopPropagation(),
    },
    [
      el('div', { class: 'modal-header' }, [
        el('h3', {}, 'Create Case'),
        el('button', { class: 'close-btn', onclick: () => close(), 'aria-label': 'Close' }, '✕'),
      ]),
      el('div', { class: 'modal-body case-details-body' }, [
        el('form', { onsubmit: (e) => handleCaseCreation(e) }, [
          el('div', { class: 'instructor-form-field' }, [
            el('label', { class: 'instructor-form-label', for: 'case-title' }, 'Case Title *'),
            el('input', {
              id: 'case-title',
              name: 'case-title',
              type: 'text',
              required: true,
              placeholder: 'e.g., Shoulder Impingement (R)',
              class: 'instructor-form-input',
            }),
          ]),
          el('div', { class: 'instructor-form-field' }, [
            el('label', { class: 'instructor-form-label', for: 'case-dob' }, 'DOB'),
            el('input', {
              type: 'date',
              id: 'case-dob',
              name: 'case-dob',
              class: 'instructor-form-input',
              oninput: (e) => {
                if (e.isTrusted) delete e.target.dataset.autofilled;
                const computed = computeAgeFromDob(e.target.value);
                if (computed) {
                  const ageEl = document.getElementById('case-age');
                  if (ageEl) ageEl.value = computed;
                }
              },
            }),
            el('div', { class: 'hint' }, 'Age auto-fills when DOB is entered.'),
          ]),
          el('div', { class: 'd-flex gap-16 mb-16 flex-wrap' }, [
            el('div', { class: 'flex-1 minw-220' }, [
              el('div', { class: 'instructor-form-field' }, [
                el('label', { class: 'instructor-form-label', for: 'case-age' }, 'Patient Age *'),
                el('input', {
                  type: 'number',
                  id: 'case-age',
                  name: 'case-age',
                  required: true,
                  min: 0,
                  max: 120,
                  placeholder: '25',
                  class: 'instructor-form-input',
                  oninput: (e) => {
                    const dobEl = document.getElementById('case-dob');
                    if (!dobEl) return;
                    if (dobEl.value && dobEl.dataset.autofilled !== 'age') return;
                    const v = parseInt(e.target.value, 10);
                    if (isNaN(v) || v <= 0 || v > 120) return;
                    const today = new Date();
                    const y = today.getFullYear() - v;
                    const m = today.getMonth();
                    const lastDay = new Date(y, m + 1, 0).getDate();
                    const d = Math.min(today.getDate(), lastDay);
                    const mm = String(m + 1).padStart(2, '0');
                    const dd = String(d).padStart(2, '0');
                    dobEl.value = `${y}-${mm}-${dd}`;
                    dobEl.dataset.autofilled = 'age';
                  },
                }),
              ]),
            ]),
            el('div', { class: 'flex-1 minw-220' }, [
              el('div', { class: 'instructor-form-field' }, [
                el('label', { class: 'instructor-form-label', for: 'case-gender' }, 'Sex *'),
                el(
                  'select',
                  {
                    id: 'case-gender',
                    name: 'case-gender',
                    required: true,
                    class: 'instructor-form-input',
                  },
                  [
                    el('option', { value: '' }, 'Select...'),
                    el('option', { value: 'male' }, 'Male'),
                    el('option', { value: 'female' }, 'Female'),
                    el('option', { value: 'other' }, 'Other'),
                    el('option', { value: 'prefer-not-to-say' }, 'Prefer not to say'),
                  ],
                ),
              ]),
            ]),
          ]),
          el('div', { class: 'instructor-form-field' }, [
            el(
              'label',
              { class: 'instructor-form-label', for: 'case-setting' },
              'Clinical Setting *',
            ),
            el(
              'select',
              {
                id: 'case-setting',
                name: 'case-setting',
                required: true,
                class: 'instructor-form-input',
              },
              [
                el('option', { value: '' }, 'Select setting...'),
                el('option', { value: 'Outpatient' }, 'Outpatient'),
                el('option', { value: 'Inpatient' }, 'Inpatient'),
                el('option', { value: 'Home Health' }, 'Home Health'),
                el('option', { value: 'SNF' }, 'Skilled Nursing Facility (SNF)'),
                el('option', { value: 'Acute Rehab' }, 'Acute Rehabilitation'),
                el('option', { value: 'Other' }, 'Other'),
              ],
            ),
          ]),
          el('div', { class: 'instructor-form-field' }, [
            el('label', { class: 'instructor-form-label', for: 'case-acuity' }, 'Case Acuity *'),
            el(
              'select',
              {
                id: 'case-acuity',
                name: 'case-acuity',
                required: true,
                class: 'instructor-form-input',
              },
              [
                el('option', { value: '' }, 'Select acuity...'),
                el('option', { value: 'acute' }, 'Acute - Recent onset'),
                el('option', { value: 'subacute' }, 'Subacute - Ongoing condition'),
                el('option', { value: 'chronic' }, 'Chronic - Long-term condition'),
                el('option', { value: 'unspecified' }, 'Unspecified'),
              ],
            ),
          ]),
        ]),
      ]),
      el(
        'div',
        {
          class: 'modal-actions',
          style:
            'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border); gap:16px;',
        },
        [
          el(
            'button',
            {
              type: 'button',
              class: 'btn secondary',
              onclick: () => close(),
            },
            'Cancel',
          ),
          el(
            'button',
            {
              type: 'submit',
              class: 'btn primary',
              onclick: (e) => {
                e.preventDefault();
                const modal = e.target.closest('.modal-content');
                const form = modal?.querySelector('.modal-body form');
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                }
              },
            },
            'Create Case',
          ),
        ],
      ),
    ],
  );
  modal.append(card);
  document.body.appendChild(modal);
  function close() {
    modal.classList.remove('is-open');
    card.classList.remove('is-open');
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const removeNow = () => {
      try {
        modal.remove();
      } catch {
        /* element may not exist */
      }
    };
    if (prefersReduce) return removeNow();
    modal.addEventListener('transitionend', removeNow, { once: true });
    setTimeout(removeNow, 480);
  }
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    card.classList.add('is-open');
    setTimeout(() => document.getElementById('case-title')?.focus(), 100);
  });
}

// Fallback: inject transitions if stylesheet not present (defensive for caching scenarios)
if (
  typeof document !== 'undefined' &&
  !document.querySelector('link[href*="transitions.css"], style[data-inline-transitions]')
) {
  const style = document.createElement('style');
  style.dataset.inlineTransitions = 'true';
  style.textContent = `.popup-overlay-base{opacity:0;transition:opacity 380ms ease}.popup-overlay-base.is-open{opacity:1}.popup-card-base{opacity:0;transform:scale(.975);transition:opacity 340ms ease,transform 320ms ease}.popup-card-base.is-open{opacity:1;transform:scale(1)}@media (prefers-reduced-motion:reduce){.popup-overlay-base,.popup-card-base{transition:none!important;transform:none!important}}`;
  document.head.appendChild(style);
}

// Prompt-driven Case Generation Modal
function showPromptGenerationModal() {
  const modal = el(
    'div',
    {
      class:
        'modal-overlay popup-overlay-base fixed inset-0 overlay-50 d-flex ai-center jc-center z-modal',
      onclick: (e) => {
        if (e.target === modal) close();
      },
    },
    [
      el(
        'div',
        {
          class: 'modal-content case-details-modal popup-card-base',
          onclick: (e) => e.stopPropagation(),
        },
        [
          el('div', { class: 'modal-header' }, [
            el('h3', {}, 'Generate Case from Prompt'),
            el(
              'button',
              { class: 'close-btn', onclick: () => close(), 'aria-label': 'Close' },
              '✕',
            ),
          ]),
          el('div', { class: 'modal-body case-details-body' }, [
            el(
              'p',
              { class: 'hint' },
              "Provide a short scenario and anchors; we'll seed a realistic draft you can edit.",
            ),
            // Title (optional)
            el('div', { class: 'instructor-form-field' }, [
              el(
                'label',
                { class: 'instructor-form-label', for: 'gen-title' },
                'Case Title (optional)',
              ),
              el('input', {
                id: 'gen-title',
                name: 'gen-title',
                type: 'text',
                placeholder: 'e.g., Rotator Cuff Tendinopathy (R)',
                class: 'instructor-form-input',
              }),
            ]),
            // Scenario prompt
            el('div', { class: 'instructor-form-field' }, [
              el(
                'label',
                { class: 'instructor-form-label', for: 'gen-prompt' },
                'Scenario Prompt (1–3 sentences) *',
              ),
              el('textarea', {
                id: 'gen-prompt',
                name: 'gen-prompt',
                rows: 3,
                placeholder: 'Key history/context to ground the case...',
                class: 'instructor-form-input resize-vertical',
              }),
            ]),
            // Structured anchors row 1
            el('div', { class: 'd-flex gap-16 mb-16 flex-wrap' }, [
              // Region
              (() => {
                const regions = [
                  'shoulder',
                  'knee',
                  'low back',
                  'neck',
                  'ankle',
                  'hip',
                  'elbow',
                  'wrist',
                ];
                const sel = createCustomSelect({
                  options: [
                    { value: '', label: 'Select region...' },
                    ...regions.map((r) => ({ value: r, label: r })),
                  ],
                  value: '',
                  className: 'instructor-form-input',
                  dataAttrs: { id: 'gen-region' },
                }).element;
                return el('div', { class: 'flex-1 minw-200' }, [
                  el('div', { class: 'instructor-form-field' }, [
                    el(
                      'label',
                      { class: 'instructor-form-label', for: 'gen-region' },
                      'Body Region *',
                    ),
                    sel,
                  ]),
                ]);
              })(),
              // Condition
              el('div', { class: 'flex-1 minw-200' }, [
                el('div', { class: 'instructor-form-field' }, [
                  el(
                    'label',
                    { class: 'instructor-form-label', for: 'gen-condition' },
                    'Suspected Condition *',
                  ),
                  el('input', {
                    id: 'gen-condition',
                    name: 'gen-condition',
                    type: 'text',
                    placeholder: 'e.g., Rotator cuff tendinopathy',
                    class: 'instructor-form-input',
                  }),
                ]),
              ]),
            ]),
            // Structured anchors row 2
            el('div', { class: 'd-flex gap-16 mb-16 flex-wrap' }, [
              // Setting
              (() => {
                const sel = createCustomSelect({
                  options: [
                    { value: '', label: 'Select setting...' },
                    { value: 'Outpatient', label: 'Outpatient' },
                    { value: 'Inpatient', label: 'Inpatient' },
                    { value: 'Home Health', label: 'Home Health' },
                    { value: 'SNF', label: 'SNF' },
                    { value: 'Acute Rehab', label: 'Acute Rehab' },
                  ],
                  value: '',
                  className: 'instructor-form-input',
                  dataAttrs: { id: 'gen-setting' },
                }).element;
                return el('div', { class: 'flex-1 minw-200' }, [
                  el('div', { class: 'instructor-form-field' }, [
                    el(
                      'label',
                      { class: 'instructor-form-label', for: 'gen-setting' },
                      'Clinical Setting *',
                    ),
                    sel,
                  ]),
                ]);
              })(),
              // Acuity
              (() => {
                const sel = createCustomSelect({
                  options: [
                    { value: '', label: 'Select acuity...' },
                    { value: 'acute', label: 'Acute' },
                    { value: 'subacute', label: 'Subacute' },
                    { value: 'chronic', label: 'Chronic' },
                  ],
                  value: '',
                  className: 'instructor-form-input',
                  dataAttrs: { id: 'gen-acuity' },
                }).element;
                return el('div', { class: 'flex-1 minw-200' }, [
                  el('div', { class: 'instructor-form-field' }, [
                    el('label', { class: 'instructor-form-label', for: 'gen-acuity' }, 'Acuity *'),
                    sel,
                  ]),
                ]);
              })(),
            ]),
            // Structured anchors row 3
            el('div', { class: 'd-flex gap-16 mb-16 flex-wrap' }, [
              el('div', { class: 'flex-1 minw-160' }, [
                el('div', { class: 'instructor-form-field' }, [
                  el('label', { class: 'instructor-form-label', for: 'gen-age' }, 'Age (yrs)'),
                  el('input', {
                    id: 'gen-age',
                    name: 'gen-age',
                    type: 'number',
                    min: 1,
                    max: 120,
                    placeholder: '45',
                    class: 'instructor-form-input',
                  }),
                ]),
              ]),
              el('div', { class: 'flex-1 minw-180' }, [
                el('div', { class: 'instructor-form-field' }, [
                  el('label', { class: 'instructor-form-label', for: 'gen-sex' }, 'Sex'),
                  (() => {
                    const sel = createCustomSelect({
                      options: [
                        { value: '', label: 'Select...' },
                        { value: 'female', label: 'Female' },
                        { value: 'male', label: 'Male' },
                        { value: 'unspecified', label: 'Unspecified' },
                      ],
                      value: '',
                      className: 'instructor-form-input',
                      dataAttrs: { id: 'gen-sex', name: 'gen-sex' },
                    }).element;
                    return sel;
                  })(),
                ]),
              ]),
              el('div', { class: 'flex-1 minw-200' }, [
                el('div', { class: 'instructor-form-field' }, [
                  el('label', { class: 'instructor-form-label', for: 'gen-pain' }, 'Pain (0–10)'),
                  el('input', {
                    id: 'gen-pain',
                    name: 'gen-pain',
                    type: 'number',
                    min: 0,
                    max: 10,
                    step: '1',
                    placeholder: '5',
                    class: 'instructor-form-input',
                  }),
                ]),
              ]),
            ]),
            // Functional goal
            el('div', { class: 'instructor-form-field' }, [
              el(
                'label',
                { class: 'instructor-form-label', for: 'gen-goal' },
                'Functional Goal (optional)',
              ),
              el('input', {
                id: 'gen-goal',
                name: 'gen-goal',
                type: 'text',
                placeholder: 'e.g., reach overhead to place dishes',
                class: 'instructor-form-input',
              }),
            ]),
          ]),
          // Buttons footer
          el(
            'div',
            {
              class: 'modal-actions',
              style:
                'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border); gap:16px;',
            },
            [
              el('button', { class: 'btn secondary', onclick: () => close() }, 'Cancel'),
              el(
                'button',
                { class: 'btn primary', onclick: () => handlePromptGeneration(modal) },
                'Generate Case',
              ),
            ],
          ),
        ],
      ),
    ],
  );
  document.body.appendChild(modal);
  function close() {
    modal.classList.remove('is-open');
    const cardEl = modal.querySelector('.popup-card-base');
    if (cardEl) cardEl.classList.remove('is-open');
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const removeNow = () => {
      try {
        modal.remove();
      } catch {
        /* element may not exist */
      }
    };
    if (prefersReduce) return removeNow();
    modal.addEventListener('transitionend', removeNow, { once: true });
    setTimeout(removeNow, 480);
  }
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    const cardEl = modal.querySelector('.popup-card-base');
    if (cardEl) cardEl.classList.add('is-open');
    setTimeout(() => document.getElementById('gen-prompt')?.focus(), 80);
  });
}

function handlePromptGeneration(modal) {
  const v = (id) => (document.getElementById(id)?.value || '').trim();
  const prompt = v('gen-prompt');
  const region = v('gen-region');
  const condition = v('gen-condition');
  const setting = v('gen-setting');
  const acuity = v('gen-acuity');
  const age = parseInt(v('gen-age'), 10) || undefined;
  const sex = v('gen-sex') || 'unspecified';
  const pain = Math.max(0, Math.min(10, parseInt(v('gen-pain'), 10) || 0));
  const goal = v('gen-goal');
  let title = v('gen-title');

  if (!prompt || !region || !condition || !setting || !acuity) {
    alert('Please provide: Prompt, Region, Condition, Setting, and Acuity.');
    return;
  }
  if (!title) title = `${capitalize(region)} ${capitalizeFirst(condition)} (${capitalize(acuity)})`;

  const anchors = { title, prompt, region, condition, setting, acuity, age, sex, pain, goal };
  const generated = generateCase(anchors);
  createCaseFromGenerated(generated, modal);
}

function capitalize(s) {
  const t = (s || '').toString().trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}
function capitalizeFirst(s) {
  const t = (s || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function createCaseFromGenerated(caseData, modal) {
  (async () => {
    try {
      const newCase = await _createCase(caseData);
      if (modal) document.body.removeChild(modal);
      urlNavigate('/instructor/editor', { case: newCase.id });
    } catch (e) {
      console.error('Failed to create generated case:', e);
      alert('Could not create the case. See console for details.');
    }
  })();
}

function handleCaseCreation(e) {
  e.preventDefault();
  // Prevent duplicate submissions
  if (handleCaseCreation.submitting) return;
  handleCaseCreation.submitting = true;

  // Provide immediate UI feedback (disable submit button if present)
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"], .create-case-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
  }

  // Parse and validate form data
  const formData = parseAndValidateCaseForm();
  if (!formData) {
    alert('Please fill in all required fields.');
    // Re-enable submit on validation failure
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Case';
    }
    handleCaseCreation.submitting = false;
    return;
  }

  const { title, setting, age, gender, acuity, dobFinal } = formData;

  handleCaseCreationAsync(title, setting, age, gender, acuity, dobFinal)
    .catch(() => {
      // On error, re-enable submit so user can retry
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Case';
      }
    })
    .finally(() => {
      handleCaseCreation.submitting = false;
    });
}

async function handleCaseCreationAsync(title, setting, age, gender, acuity, dob) {
  try {
    // Create the case with proper structure and metadata
    const normalizeSex = (s) => {
      if (!s) return 'unspecified';
      const v = String(s).toLowerCase();
      if (v === 'prefer-not-to-say') return 'unspecified';
      if (['male', 'female', 'other', 'unspecified'].includes(v)) return v;
      return 'unspecified';
    };

    const caseData = {
      title,
      setting,
      patientAge: age,
      patientGender: gender,
      acuity,
      patientDOB: dob || undefined,
      createdBy: 'faculty',
      createdAt: new Date().toISOString(),
      meta: {
        title,
        setting,
        patientAge: age,
        patientGender: gender,
        acuity,
        patientDOB: dob || undefined,
      },
      snapshot: {
        age: String(age ?? ''),
        sex: normalizeSex(gender),
        dob: dob || '',
      },
      history: [],
      findings: {},
      encounters: {
        eval: {
          subjective: {},
          objective: {},
          assessment: {},
          plan: {},
        },
      },
    };

    const newCase = await _createCase(caseData);

    // Close modal (data attribute specific)
    const modal = document.querySelector('[data-modal="create-case"]');
    if (modal && modal.parentElement) modal.parentElement.removeChild(modal);

    // Navigate to editor with proper case ID
    urlNavigate('/instructor/editor', { case: newCase.id });
  } catch (error) {
    console.error('Error creating case:', error);
    alert('Error creating case. Please try again.');
  }
}

route('#/instructor/cases', async (app) => {
  let allCases = [];

  // Tiny helper to create a sprite-based icon element
  function spriteIcon(name, { className = 'icon', size } = {}) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', className);
    // Default size for small buttons unless explicitly overridden
    const sz = size || '18px';
    svg.style.width = sz;
    svg.style.height = sz;
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#icon-${name}`);
    svg.appendChild(use);
    return svg;
  }

  let sortColumn = '';
  let sortDirection = 'asc';
  let searchTerm = '';

  function renderSearchAndTable() {
    const container = el('div', {});

    // Actions row (Search)
    const actionsRow = el('div', { class: 'd-flex gap-12 ai-center mb-20' }, [
      // Search bar
      el('input', {
        type: 'text',
        placeholder: 'Search cases by title, setting, diagnosis, or acuity...',
        value: searchTerm,
        class: 'form-input-standard w-100 box-border',
        onInput: (e) => {
          searchTerm = e.target.value.toLowerCase();
          renderTable();
        },
      }),
    ]);

    const tableContainer = el('div', { id: 'table-container', class: 'table-responsive' });

    container.append(actionsRow, tableContainer);

    function renderTable() {
      // Filter cases based on search
      let filteredCases = allCases.filter((c) => {
        if (!c) return false;
        const title = c.title || 'Untitled';
        const searchText = `${title}`.toLowerCase();
        return searchText.includes(searchTerm);
      });

      // Sort cases
      if (sortColumn) {
        sortCases(filteredCases, sortColumn, sortDirection);
      }

      const table = renderCaseTable(filteredCases);
      tableContainer.replaceChildren();
      tableContainer.append(table);
    }

    renderTable();
    return container;
  }

  function createSortableHeaderLocal(text, column) {
    const header = createSortableHeader(text, column, sortColumn, sortDirection, spriteIcon);

    // Add event listeners
    header.addEventListener('click', () => {
      const newSortState = handleSortClick(column, sortColumn, sortDirection);
      sortColumn = newSortState.sortColumn;
      sortDirection = newSortState.sortDirection;

      const tableContainer = document.getElementById('table-container');
      if (tableContainer && tableContainer.parentElement) {
        const container = tableContainer.parentElement;
        const newContainer = renderSearchAndTable();
        container.replaceChildren(...newContainer.children);
      }
    });

    return header;
  }

  async function loadAndRender() {
    app.replaceChildren(); // Clear previous content
    const loadingIndicator = el('div', { class: 'panel' }, 'Loading cases...');
    app.append(loadingIndicator);

    try {
      allCases = await _listCases();
    } catch (error) {
      console.error('Failed to load cases:', error);
      app.replaceChildren(); // Clear loading indicator
      app.append(
        el(
          'div',
          { class: 'panel error' },
          'Error loading cases. Please check the console for details.',
        ),
      );
      return;
    }

    app.replaceChildren(); // Clear loading indicator
    app.append(
      el('div', { class: 'panel' }, [
        el('div', { class: 'flex-between mb-20' }, [
          el('h2', {}, 'Faculty Dashboard'),
          el('div', { class: 'd-flex gap-10' }, [
            el(
              'button',
              {
                class: 'btn primary d-flex ai-center gap-8',
                onclick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  showCaseCreationModal();
                },
              },
              [spriteIcon('plus'), 'Create New Case'],
            ),
            // Feature flag: Prompt-based generation hidden until feature is production-ready.
            // To re-enable, set enablePromptGeneration=true (or remove condition) below.
            (() => {
              const enablePromptGeneration = false; // toggle here for future rollout
              if (!enablePromptGeneration) return null;
              return el(
                'button',
                {
                  class: 'btn secondary d-flex ai-center gap-8',
                  title: 'Generate a draft case from an AI prompt',
                  onclick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showPromptGenerationModal();
                  },
                },
                [spriteIcon('edit'), 'Generate from Prompt'],
              );
            })(),
          ]),
        ]),
        renderSearchAndTable(),
      ]),
    );

    // If navigated with ?create=true, open the creation modal automatically
    try {
      const { params } = getUrlRoute();
      if (params.create === 'true') {
        // Remove the param from the URL to avoid reopening on refresh
        setUrlQuery({ create: undefined }, { replace: true });
        showCaseCreationModal();
      }
    } catch {
      /* no-op */
    }
  }

  // Legacy filter UI and grouped rendering removed (unused and referenced undefined state)

  function renderCaseTable(cases) {
    if (cases.length === 0) {
      return el(
        'div',
        { class: 'text-center p-40 text-secondary' },
        searchTerm ? `No cases match "${searchTerm}"` : 'No cases have been created yet.',
      );
    }

    const table = el('table', { class: 'table cases-table' }, [
      el(
        'thead',
        {},
        el('tr', {}, [
          createSortableHeaderLocal('Case Title', 'title'),
          createSortableHeaderLocal('Setting', 'setting'),
          createSortableHeaderLocal('Diagnosis', 'diagnosis'),
          createSortableHeaderLocal('Acuity', 'acuity'),
          el('th', {}, 'Source'),
          el('th', {}, 'Author'),
          el('th', {}, ''),
        ]),
      ),
      el(
        'tbody',
        {},
        cases.map((c) => {
          const studentLink = buildUrlLink('/student/editor', {
            case: c.id,
            v: c.latestVersion || 0,
            encounter: 'eval',
          });

          const badge = createCaseBadge(c);
          const authorBadge = createAuthorBadge(c.createdByName, c.createdAt);

          return el('tr', {}, [
            el('td', {}, c.title || 'Untitled'),
            el('td', {}, ''),
            el('td', {}, ''),
            el('td', {}, ''),
            el('td', {}, badge || ''),
            el('td', {}, authorBadge || ''),
            el('td', { class: 'nowrap' }, [
              el('div', { class: 'd-inline-flex ai-center gap-6' }, [
                el(
                  'button',
                  {
                    class: 'btn small primary d-inline-flex ai-center gap-6',
                    onClick: async (e) => {
                      showSharePopup(studentLink);
                      try {
                        await navigator.clipboard.writeText(studentLink);
                      } catch {
                        /* clipboard write may not be available */
                      }
                      const btn = e.currentTarget || e.target;
                      const originalNodes = Array.from(btn.childNodes);
                      // Replace button content safely without parsing HTML
                      btn.replaceChildren(document.createTextNode('✓ Copied!'));
                      setTimeout(() => {
                        btn.replaceChildren(...originalNodes);
                      }, 2000);
                    },
                  },
                  [spriteIcon('share'), 'Share'],
                ),
                el(
                  'button',
                  {
                    class: 'btn small primary d-inline-flex ai-center gap-6',
                    onClick: () =>
                      urlNavigate('/instructor/editor', {
                        case: c.id,
                        v: c.latestVersion || 0,
                        encounter: 'eval',
                      }),
                  },
                  [spriteIcon('edit'), 'Edit'],
                ),
                el(
                  'button',
                  {
                    class: 'btn small primary d-inline-flex ai-center gap-6',
                    onClick: () =>
                      urlNavigate('/student/editor', {
                        case: c.id,
                        v: c.latestVersion || 0,
                        encounter: 'eval',
                      }),
                  },
                  [spriteIcon('preview'), 'Student View'],
                ),
                el(
                  'button',
                  {
                    class: 'btn small primary d-inline-flex ai-center gap-6',
                    onClick: () =>
                      urlNavigate('/student/editor', {
                        case: c.id,
                        v: c.latestVersion || 0,
                        encounter: 'eval',
                        key: 'true',
                      }),
                  },
                  [spriteIcon('preview'), 'Answer Key'],
                ),
                el(
                  'button',
                  {
                    class: 'btn small subtle-danger d-inline-flex ai-center gap-6',
                    onClick: async () => {
                      const confirmed = await showConfirmModal({
                        title: 'Delete Case',
                        message: el('div', {}, [
                          el('p', { class: 'mb-12' }, [
                            'Are you sure you want to delete ',
                            el('strong', {}, c.title),
                            '?',
                          ]),
                          el(
                            'p',
                            { class: 'text-secondary small' },
                            'This action cannot be undone. All patient data and student progress for this case will be permanently removed.',
                          ),
                        ]),
                        confirmText: c.title,
                        confirmLabel: 'Type the case name to confirm',
                        confirmButton: 'Delete Case',
                        danger: true,
                      });

                      if (confirmed) {
                        try {
                          await _deleteCase(c.id);
                          await loadAndRender(); // Reload all data and re-render the view
                        } catch (error) {
                          console.error('Failed to delete case:', error);
                          alert('Error deleting case. See console for details.');
                        }
                      }
                    },
                  },
                  [spriteIcon('delete'), 'Delete'],
                ),
              ]),
            ]),
          ]);
        }),
      ),
    ]);

    return table;
  }

  loadAndRender();
});
