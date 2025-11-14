// modal.js - extracted from ChartNavigation.js
import { el } from '../../ui/utils.js';
import { createCustomSelect } from '../../ui/CustomSelect.js';

function computeAgeFromDob(dobStr) {
  if (!dobStr) return '';
  const d = new Date(dobStr);
  if (isNaN(d)) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return String(age);
}

/* eslint-disable-next-line complexity */
export function openEditCaseModal(caseInfo, onSave) {
  const normalizeSex = (s) => {
    if (!s) return 'unspecified';
    const v = String(s).toLowerCase();
    if (v === 'prefer not to say' || v === 'prefer-not-to-say' || v === 'n/a' || v === 'na')
      return 'unspecified';
    if (['male', 'female', 'other', 'unspecified'].includes(v)) return v;
    return 'unspecified';
  };
  const normalizeAcuity = (a) => {
    if (!a) return 'unspecified';
    const v = String(a).toLowerCase();
    if (['acute', 'subacute', 'chronic', 'unspecified'].includes(v)) return v;
    if (v === 'routine') return 'unspecified';
    if (v === 'complex') return 'chronic';
    if (v === 'critical') return 'acute';
    return 'unspecified';
  };

  const caseSex = normalizeSex(caseInfo?.sex);
  const caseAcuity = normalizeAcuity(caseInfo?.acuity);
  const modulesLocal = Array.isArray(caseInfo.modules)
    ? JSON.parse(JSON.stringify(caseInfo.modules))
    : [];

  let modal;
  function close() {
    try {
      modal?.classList.remove('is-open');
      const card = modal?.querySelector('.popup-card-base');
      if (card) card.classList.remove('is-open');
      // Clean any inline fallback styles we may have set
      try {
        if (modal) modal.style.opacity = '';
        if (card) {
          card.style.opacity = '';
          card.style.transform = '';
        }
      } catch {}
      const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const removeNow = () => {
        try {
          modal?.remove();
        } catch {}
      };
      if (prefersReduce) return removeNow();
      modal?.addEventListener('transitionend', removeNow, { once: true });
      setTimeout(removeNow, 480);
    } catch {}
  }

  // Build modal content with full form parity
  const titleInput = el('input', {
    type: 'text',
    id: 'edit-title',
    class: 'instructor-form-input',
    required: true,
    value: caseInfo.title || '',
  });
  const ageInput = el('input', {
    type: 'number',
    id: 'edit-age',
    min: 0,
    max: 120,
    class: 'instructor-form-input',
    value: caseInfo.age || '',
    oninput: (e) => {
      const dobEl = document.getElementById('edit-dob');
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
  });
  const dobInput = el('input', {
    type: 'date',
    id: 'edit-dob',
    value: caseInfo.dob || '',
    class: 'instructor-form-input',
    oninput: (e) => {
      if (e.isTrusted) delete e.target.dataset.autofilled;
      const computed = computeAgeFromDob(e.target.value);
      if (computed) ageInput.value = computed;
    },
  });
  const sexSelect = createCustomSelect({
    options: [
      { value: '', label: 'Select...' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
      { value: 'unspecified', label: 'Prefer not to say' },
    ],
    value: caseSex || '',
    className: 'instructor-form-input',
    dataAttrs: { id: 'edit-gender' },
  }).element;
  const settingSelect = createCustomSelect({
    options: [
      { value: '', label: 'Select setting...' },
      { value: 'Outpatient', label: 'Outpatient' },
      { value: 'Inpatient', label: 'Inpatient' },
      { value: 'Home Health', label: 'Home Health' },
      { value: 'SNF', label: 'SNF' },
      { value: 'Acute Rehab', label: 'Acute Rehabilitation' },
      { value: 'Other', label: 'Other' },
    ],
    value: caseInfo.setting || '',
    className: 'instructor-form-input',
    dataAttrs: { id: 'edit-setting', required: 'true' },
  }).element;
  const acuitySelect = createCustomSelect({
    options: [
      { value: '', label: 'Select acuity...' },
      { value: 'acute', label: 'Acute' },
      { value: 'subacute', label: 'Subacute' },
      { value: 'chronic', label: 'Chronic' },
      { value: 'unspecified', label: 'Unspecified' },
    ],
    value: caseAcuity || '',
    className: 'instructor-form-input',
    dataAttrs: { id: 'edit-acuity' },
  }).element;

  modal = el(
    'div',
    {
      'data-modal': 'edit-case',
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
            el('h3', {}, 'Edit Case Details'),
            el(
              'button',
              { class: 'close-btn', onclick: () => close(), 'aria-label': 'Close' },
              '✕',
            ),
          ]),
          el('div', { class: 'modal-body case-details-body' }, [
            el('form', { id: 'edit-case-form', onsubmit: handleSubmit }, [
              // Title
              el('div', { class: 'instructor-form-field' }, [
                el('label', { class: 'instructor-form-label' }, 'Case Title *'),
                titleInput,
              ]),
              // Age + DOB row
              el('div', { class: 'd-flex gap-16 mb-16 flex-wrap' }, [
                el('div', { class: 'flex-1 minw-220' }, [
                  el('div', { class: 'instructor-form-field' }, [
                    el('label', { class: 'instructor-form-label' }, 'Patient Age'),
                    ageInput,
                  ]),
                ]),
                el('div', { class: 'flex-1 minw-220' }, [
                  el('div', { class: 'instructor-form-field' }, [
                    el('label', { class: 'instructor-form-label' }, 'DOB'),
                    dobInput,
                  ]),
                  el('div', { class: 'hint' }, 'Age auto-fills when DOB is entered.'),
                ]),
              ]),
              // Sex
              el('div', { class: 'instructor-form-field' }, [
                el('label', { class: 'instructor-form-label' }, 'Sex'),
                sexSelect,
              ]),
              // Setting
              el('div', { class: 'instructor-form-field' }, [
                el('label', { class: 'instructor-form-label' }, 'Clinical Setting *'),
                settingSelect,
              ]),
              // Acuity
              el('div', { class: 'instructor-form-field' }, [
                el('label', { class: 'instructor-form-label' }, 'Case Acuity'),
                acuitySelect,
              ]),
            ]),
          ]),
          el('div', { class: 'modal-actions' }, [
            el(
              'button',
              { type: 'button', class: 'btn secondary', onclick: () => close() },
              'Cancel',
            ),
            el(
              'button',
              { type: 'submit', class: 'btn primary', form: 'edit-case-form' },
              'Save Changes',
            ),
          ]),
        ],
      ),
    ],
  );

  document.body.append(modal);
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
    const card = modal.querySelector('.popup-card-base');
    if (card) card.classList.add('is-open');
    setTimeout(() => {
      try {
        const overlayStyle = getComputedStyle(modal);
        const cardStyle = card ? getComputedStyle(card) : null;
        if (overlayStyle && overlayStyle.opacity === '0') modal.style.opacity = '1';
        if (cardStyle && cardStyle.opacity === '0') {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }
      } catch {}
      titleInput?.focus();
    }, 90);
  });

  /* eslint-disable-next-line complexity */
  function handleSubmit(e) {
    e.preventDefault();
    const updated = {
      ...caseInfo,
      title: titleInput.value.trim(),
      setting: settingSelect.value,
      age: ageInput.value,
      sex: sexSelect.value,
      dob: dobInput.value,
      acuity: acuitySelect.value,
      modules: modulesLocal,
    };
    if ((!updated.age || updated.age === '') && updated.dob) {
      const computed = computeAgeFromDob(updated.dob);
      if (computed) updated.age = computed;
    }
    if ((!updated.dob || updated.dob === '') && updated.age) {
      const v = parseInt(updated.age, 10);
      if (!isNaN(v) && v > 0 && v <= 120) {
        const today = new Date();
        const y = today.getFullYear() - v;
        const m = today.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(today.getDate(), lastDay);
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        updated.dob = `${y}-${mm}-${dd}`;
      }
    }
    close();
    try {
      onSave?.(updated);
    } catch {}
  }
}
