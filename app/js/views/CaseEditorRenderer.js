/**
 * Case Editor rendering functions
 * These functions break down the massive renderCaseEditor into smaller pieces
 */

import { el } from '../ui/utils.js';
import { createAuthorBadge } from '../ui/CaseBadge.js';
import {
  getCaseInfo,
  getPatientDisplayName,
  canEditCase,
  getPatientDOB,
  getPatientSex,
  formatDOB,
} from './CaseEditorUtils.js';
// Lazy accessor to avoid statically bundling navigation API
async function _getOpenEditCaseModal() {
  const { getOpenEditCaseModal } = await import('../features/navigation/api.js');
  return getOpenEditCaseModal();
}

/**
 * Create and setup patient header with avatar
 * @returns {Object} Header elements and functions
 */
export function createPatientHeader() {
  const patientHeaderNameEl = el('div', {}, '');
  const patientHeaderDemoEl = el('div', {}, '');
  const avatarEl = el('div', { class: 'patient-avatar', 'aria-hidden': 'true' }, []);

  // Asset mapping – user must place PNGs under app/img/avatars/
  const AVATAR_MAP = {
    male: { light: 'img/icon_male_light.png', dark: 'img/icon_male_dark.png' },
    female: { light: 'img/icon_female_light.png', dark: 'img/icon_female_dark.png' },
    neutral: { light: 'img/icon_unknown_light.png', dark: 'img/icon_unknown_dark.png' },
  };

  function normalizeSex(val) {
    if (!val) return 'neutral';
    const s = String(val).toLowerCase();
    if (s.startsWith('m')) return 'male';
    if (s.startsWith('f')) return 'female';
    return 'neutral';
  }

  function currentThemeMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updatePatientAvatar(rawSex) {
    const sex = normalizeSex(rawSex);
    const mode = currentThemeMode();
    if (avatarEl.dataset.sex === sex && avatarEl.dataset.mode === mode) return;

    avatarEl.dataset.sex = sex;
    avatarEl.dataset.mode = mode;
    const src = (AVATAR_MAP[sex] && AVATAR_MAP[sex][mode]) || AVATAR_MAP.neutral[mode];

    let img = avatarEl.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.decoding = 'async';
      img.className = 'patient-avatar-img';
      avatarEl.replaceChildren(img);
    }

    const altMap = {
      male: 'Male patient avatar',
      female: 'Female patient avatar',
      neutral: 'Patient avatar',
    };
    img.alt = altMap[sex] || 'Patient avatar';
    img.src = src;
  }

  // Apply CSS classes to reduce inline styles
  patientHeaderNameEl.className = 'patient-name-line';
  patientHeaderDemoEl.className = 'patient-demo-line';

  const patientHeader = el('div', { id: 'patient-sticky-header' }, [
    el('div', { class: 'patient-header-left' }, [
      avatarEl,
      el('div', { class: 'patient-header-text' }, [patientHeaderNameEl, patientHeaderDemoEl]),
    ]),
    el('div', { id: 'patient-header-actions' }, []),
  ]);

  // Initial neutral avatar
  updatePatientAvatar();

  return {
    patientHeader,
    patientHeaderNameEl,
    patientHeaderDemoEl,
    avatarEl,
    updatePatientAvatar,
  };
}

/**
 * Setup theme observer for avatar updates
 * @param {HTMLElement} avatarEl - Avatar element
 * @param {Function} updatePatientAvatar - Update function
 * @returns {MutationObserver} Observer instance
 */
export function setupThemeObserver(avatarEl, updatePatientAvatar) {
  const themeObserver = new MutationObserver((mutList) => {
    for (const m of mutList) {
      if (m.type === 'attributes' && m.attributeName === 'data-theme') {
        updatePatientAvatar(avatarEl.dataset.sex || 'neutral');
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });
  return themeObserver;
}

/**
 * Create patient header update function
 * @param {Object} c - Case object
 * @param {Object} caseWrapper - Full case wrapper with metadata
 * @param {Object} headerElements - Header elements from createPatientHeader
 * @returns {Function} Update function
 */
export function createPatientHeaderUpdater(c, caseWrapper, headerElements) {
  const { patientHeaderNameEl, patientHeaderDemoEl, updatePatientAvatar } = headerElements;

  return function updatePatientHeader() {
    try {
      const displayName = getPatientDisplayName(c);
      const dob = getPatientDOB(c);
      const sex = getPatientSex(c);

      updatePatientAvatar(sex);

      const dobFmt = formatDOB(dob);
      const dateText = dobFmt || dob || 'N/A';

      patientHeaderNameEl.replaceChildren();
      patientHeaderNameEl.append(el('span', { style: 'font-weight:700' }, displayName));

      patientHeaderDemoEl.replaceChildren();
      patientHeaderDemoEl.append(el('span', { class: 'patient-dob' }, dateText));

      // Add author attribution if available
      if (caseWrapper?.createdByName) {
        const authorBadge = createAuthorBadge(caseWrapper.createdByName, caseWrapper.createdAt);
        if (authorBadge) {
          patientHeaderDemoEl.append(' • ', authorBadge);
        }
      }

      // Update CSS variable for layout
      const h = headerElements.patientHeader.offsetHeight || 0;
      document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
    } catch {
      // Ignore errors
    }
  };
}

/**
 * Create patient header actions renderer
 * @param {boolean} isFacultyMode - Faculty mode flag
 * @param {string} caseId - Case ID
 * @param {Object} c - Case object
 * @param {Function} handleCaseInfoUpdate - Case info update handler
 * @returns {Function} Render function
 */
export function createPatientHeaderActionsRenderer(isFacultyMode, caseId, c, handleCaseInfoUpdate) {
  return function renderPatientHeaderActions() {
    const actions = document.getElementById('patient-header-actions');
    if (!actions) return;
    actions.replaceChildren();

    const canEdit = canEditCase(isFacultyMode, caseId);
    if (!canEdit) return;

    const getCaseInfoSnapshot = () => getCaseInfo(c);
    const openEdit = () => {
      _getOpenEditCaseModal().then((fn) => fn && fn(getCaseInfoSnapshot(), handleCaseInfoUpdate));
    };
    actions.append(el('button', { class: 'btn secondary', onclick: openEdit }, 'Edit'));
  };
}

/**
 * Setup header resize observer
 * @param {HTMLElement} patientHeader - Patient header element
 * @param {AbortController} ac - Abort controller for cleanup
 * @returns {ResizeObserver|null} Observer instance or null
 */
export function setupHeaderResizeObserver(patientHeader, ac) {
  try {
    if ('ResizeObserver' in window) {
      const headerRO = new ResizeObserver(() => {
        const h = patientHeader.offsetHeight || 0;
        document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
      });
      headerRO.observe(patientHeader);
      return headerRO;
    } else {
      // Fallback: recompute on resize
      window.addEventListener(
        'resize',
        () => {
          const h = patientHeader.offsetHeight || 0;
          document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
        },
        { passive: true, signal: ac.signal },
      );
      return null;
    }
  } catch {
    return null;
  }
}
