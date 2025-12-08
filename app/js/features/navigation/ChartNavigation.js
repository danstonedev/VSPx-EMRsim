// ChartNavigation.js - Professional EMR-style navigation with progress tracking
import { el } from '../../ui/utils.js';
import { openEditCaseModal } from './modal.js';
// Note: icon utilities are used in other submodules; not needed directly here now
// Lazy-load attachments service on demand
let __attPromise;
function getAttachmentsService() {
  if (!__attPromise) {
    __attPromise = import('../../services/attachments.js').then((m) => m.attachments);
  }
  return __attPromise;
}

// Artifact category handling moved to artifacts-panel.js

// Persisted collapse state for top-level "Case File" artifact block
const CASEFILE_COLLAPSED_KEY = 'caseFileCollapsed_v1';
function loadCaseFileCollapsed() {
  try {
    return localStorage.getItem(CASEFILE_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}
function saveCaseFileCollapsed(v) {
  try {
    localStorage.setItem(CASEFILE_COLLAPSED_KEY, v ? '1' : '0');
  } catch {}
}
let caseFileCollapsed = loadCaseFileCollapsed();

// Persisted collapse state for section cards
const SECTION_COLLAPSE_KEY = 'sectionCollapse_v1';
function loadSectionCollapseState() {
  try {
    return JSON.parse(localStorage.getItem(SECTION_COLLAPSE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}
function saveSectionCollapseState(state) {
  try {
    localStorage.setItem(SECTION_COLLAPSE_KEY, JSON.stringify(state || {}));
  } catch {}
}
let sectionCollapseState = loadSectionCollapseState();

// Heuristic normalization for artifact type across legacy/new cases
function normalizeArtifactType(mod) {
  if (!mod) return 'other';
  let t = (mod.type || '').toString().toLowerCase().trim();
  const id = (mod.id || '').toString().toLowerCase();
  const title = (mod.title || '').toString().toLowerCase();
  // Supported artifact types for viewer classification
  const candidates = [
    'referral',
    'pmh',
    'imaging',
    'labs',
    'meds',
    'vitals',
    'prior-notes',
    'other',
  ];
  if (t && candidates.includes(t)) return t;
  // Infer from id prefix
  for (const k of candidates) {
    if (id.startsWith(`${k}-`)) return k;
  }
  // Infer from title keywords
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

// getCategoryForArtifact moved to artifacts-panel.js

/**
 * Creates SVG elements with proper namespace
 * @param {string} tag - SVG tag name
 * @param {Object} attrs - Attributes object
 * @param {Array} children - Child elements
 * @returns {SVGElement} SVG element
 */
// Helper kept for future SVG UI; suppress unused until needed
// eslint-disable-next-line no-unused-vars
function createSVGElement(tag, attrs = {}, children = []) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);

  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (!Array.isArray(children)) children = [children];
  children.forEach((child) => {
    if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Creates a mini progress ring for a section
 * @param {number} percentage - Progress percentage (0-100)
 * @param {number} size - Ring size in pixels
 * @param {string} color - Ring color
 * @returns {HTMLElement} SVG progress ring
 */
// removed unused createProgressRing

/**
 * Creates a subsection status indicator
 * @param {string} status - 'complete', 'partial', or 'empty'
 * @returns {HTMLElement} Status indicator
 */
function createSubsectionIndicator(status) {
  switch (status) {
    case 'complete':
      return el('span', { class: 'subsection-indicator subsection-indicator-complete' }, '✓');

    case 'partial':
      return el('div', { class: 'subsection-indicator subsection-indicator-partial' });

    default: // 'empty'
      return el('div', { class: 'subsection-indicator subsection-indicator-empty' });
  }
}

/**
 * Calculates progress percentage for a section based on completed fields
 * @param {Object} sectionData - Section data object
 * @param {string} sectionType - Type of section (subjective, objective, etc.)
 * @returns {number} Progress percentage (0-100)
 */
// removed unused calculateSectionProgress

/**
 * Determines subsection completion status with stricter validation
 * @param {any} subsectionData - Data for the subsection
 * @param {string} subsectionType - Type of subsection
 * @param {Object} fullSectionData - Full section data for context
 * @returns {string} Status: 'complete', 'partial', or 'empty'
 */
function getSubsectionStatus(subsectionData, subsectionType, fullSectionData = {}) {
  if (!subsectionData) return 'empty';

  // Define required fields for each subsection type
  const subsectionRequirements = {
    // Subjective subsections
    hpi: (data, section) => {
      // Chief complaint stored separately; detailed narrative may use one of several keys
      const chiefComplaint = section?.chiefComplaint || section?.chiefConcern;
      // Only treat explicit narrative fields as HPI text (do NOT fall back to whole subsection object)
      const hpiText =
        section?.historyOfPresentIllness ??
        section?.detailedHistoryOfCurrentCondition ??
        section?.hpi ??
        '';
      // Completion requires BOTH chief complaint and detailed narrative
      return isFieldComplete(chiefComplaint) && isFieldComplete(hpiText);
    },
    /* eslint-disable-next-line complexity */
    'pain-assessment': (data, section) => {
      const painData =
        section &&
        (section.painLocation ||
          section.painScale ||
          section.painQuality ||
          section.painPattern ||
          section.aggravatingFactors ||
          section.easingFactors)
          ? section
          : data;
      if (typeof painData !== 'object' || Array.isArray(painData)) return false;

      // Require all six inputs to mark complete
      const painLocation = painData.painLocation || painData.location;
      const painScale = painData.painScale || painData.scale;
      const painQuality = painData.painQuality || painData.quality;
      const painPattern = painData.painPattern || painData.pattern;
      const aggravatingFactors = painData.aggravatingFactors;
      const easingFactors = painData.easingFactors;

      return (
        isFieldComplete(painLocation) &&
        isFieldComplete(painScale) &&
        isFieldComplete(painQuality) &&
        isFieldComplete(painPattern) &&
        isFieldComplete(aggravatingFactors) &&
        isFieldComplete(easingFactors)
      );
    },
    'functional-status': (data, section) => {
      // Require all three fields in Functional Status subsection to be complete
      const functionalLimitations = section?.functionalLimitations;
      const priorLevel = section?.priorLevel;
      const patientGoals = section?.patientGoals;
      return (
        isFieldComplete(functionalLimitations) &&
        isFieldComplete(priorLevel) &&
        isFieldComplete(patientGoals)
      );
    },
    'additional-history': (data, section) => {
      // Require all three fields in Additional History subsection to be complete
      const medications = section?.medicationsCurrent;
      const redFlags = section?.redFlags;
      const additionalHistory = section?.additionalHistory;
      return (
        isFieldComplete(medications) &&
        isFieldComplete(redFlags) &&
        isFieldComplete(additionalHistory)
      );
    },

    // Objective subsections
    'regional-assessment': (data, section) => {
      const ra = section?.regionalAssessments || data?.regionalAssessments || data;
      if (!ra || typeof ra !== 'object') return false;
      // Tables store values as nested objects; count content if any non-empty value exists
      const hasRom = ra.rom && isFieldComplete(ra.rom);
      const hasMmt = ra.mmt && isFieldComplete(ra.mmt);
      const hasTests = ra.specialTests && isFieldComplete(ra.specialTests);
      // Mark complete if any of the three sub-areas has entries
      return Boolean(hasRom || hasMmt || hasTests);
    },
    inspection: (data, section) => {
      const inspection = section?.inspection?.visual || data;
      return isFieldComplete(inspection);
    },
    palpation: (data, section) => {
      const palpation = section?.palpation?.findings || data;
      return isFieldComplete(palpation);
    },
    neuro: (data, section) => {
      const neuro = section?.neuro?.screening || data;
      return isFieldComplete(neuro);
    },
    functional: (data, section) => {
      const functional = section?.functional?.assessment || data;
      return isFieldComplete(functional);
    },

    // Assessment subsections
    'primary-impairments': (data, section) => isFieldComplete(section?.primaryImpairments || data),
    'icf-classification': (data, section) => {
      const s = section || {};
      return (
        isFieldComplete(s.bodyFunctions) &&
        isFieldComplete(s.activityLimitations) &&
        isFieldComplete(s.participationRestrictions)
      );
    },
    'pt-diagnosis': (data, section) => isFieldComplete(section?.ptDiagnosis || data),
    'clinical-reasoning': (data, section) => isFieldComplete(section?.clinicalReasoning || data),

    // Plan subsections
    'treatment-plan': (data, section) =>
      isFieldComplete(section?.treatmentPlan || data?.treatmentPlan) &&
      isFieldComplete(section?.patientEducation || data?.patientEducation),
    'in-clinic-treatment-plan': (data, section) => {
      const hasRows = isFieldComplete(section?.exerciseTable || data?.exerciseTable);
      const hasFreq = isFieldComplete(section?.frequency || data?.frequency);
      const hasDur = isFieldComplete(section?.duration || data?.duration);
      // consider complete when at least one row plus schedule are provided
      return hasRows && hasFreq && hasDur;
    },
    'goal-setting': (data, section) => {
      // Consider complete when at least one goal entry exists
      const table = section?.goalsTable || data?.goalsTable;
      return isFieldComplete(table);
    },

    // Billing subsections
    'diagnosis-codes': (data, section) => {
      const arr = section?.diagnosisCodes || section?.icdCodes || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      return arr.every((code) => isFieldComplete(code.code));
    },
    'cpt-codes': (data, section) => {
      const arr = section?.billingCodes || section?.cptCodes || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // Require all visible inputs per CPT row: code, units (>0), and timeSpent (non-empty)
      return arr.every((item) => {
        const hasCode = isFieldComplete(item.code);
        const units = parseInt(item.units, 10);
        const hasValidUnits = !isNaN(units) && units > 0;
        const hasTime = isFieldComplete(item.timeSpent);
        return hasCode && hasValidUnits && hasTime;
      });
    },
    'orders-referrals': (data, section) => {
      const arr = section?.ordersReferrals || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // Require both Type and Details for each row
      return arr.every((item) => isFieldComplete(item.type) && isFieldComplete(item.details));
    },
    'billing-notes': (data, section) => {
      const notes = section?.skilledJustification || section?.treatmentNotes || data;
      return isFieldComplete(notes);
    },
  };

  // Helper function to check if a field is complete
  function isFieldComplete(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value))
      return value.length > 0 && value.some((item) => isFieldComplete(item));
    if (typeof value === 'object') {
      return Object.values(value).some((val) => isFieldComplete(val));
    }
    return Boolean(value);
  }

  // Check if we have a specific requirement for this subsection type
  const requirement = subsectionRequirements[subsectionType];
  if (requirement) {
    const isComplete = requirement(subsectionData, fullSectionData);
    return isComplete ? 'complete' : hasAnyContent(subsectionData) ? 'partial' : 'empty';
  }

  // Fallback to generic checking for unknown subsection types
  return genericSubsectionCheck(subsectionData);
}

/**
 * Helper function to check if there's any content in the subsection
 */
function hasAnyContent(subsectionData) {
  // Check if there's any non-empty content
  function hasContent(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return false; // booleans (e.g., flags) don’t count as content
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.some((item) => hasContent(item));
    if (typeof value === 'object') {
      return Object.values(value).some((val) => hasContent(val));
    }
    return Boolean(value);
  }

  return hasContent(subsectionData);
}

/**
 * Generic subsection checking for unknown types
 */
function genericSubsectionCheck(subsectionData) {
  if (Array.isArray(subsectionData)) {
    const completedItems = subsectionData.filter((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return Object.values(item).some((value) => value && value.toString().trim());
      }
      return false;
    });

    if (completedItems.length === 0) return 'empty';
    if (completedItems.length === subsectionData.length) return 'complete';
    return 'partial';
  }

  if (typeof subsectionData === 'string') {
    return subsectionData.trim() ? 'complete' : 'empty';
  }

  if (typeof subsectionData === 'object') {
    const values = Object.values(subsectionData);
    const completedValues = values.filter((value) => value && value.toString().trim());

    if (completedValues.length === 0) return 'empty';
    if (completedValues.length === values.length) return 'complete';
    return 'partial';
  }

  return 'empty';
}

// Compute age from a YYYY-MM-DD date string
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

// Collapse/expand subsection content while keeping the banner visible
function setSubsectionCollapsed(anchorEl, collapsed) {
  if (!anchorEl) return;
  const header = anchorEl.querySelector('h4.subsection-title');
  const children = Array.from(anchorEl.children || []);
  children.forEach((child) => {
    if (child !== header) {
      child.style.display = collapsed ? 'none' : '';
    }
  });
  if (header) header.style.opacity = collapsed ? '0.85' : '1';
}

// Attach right-aligned toggles to subsection banners and enforce visibility rules
function applySubsectionVisibilityControls({
  activeSection,
  isFacultyMode,
  caseData,
  onEditorSettingsChange,
}) {
  try {
    const sectionRoot = document.querySelector(`.${activeSection}-section`);
    if (!sectionRoot) return;
    const anchors = Array.from(sectionRoot.querySelectorAll('.section-anchor'));
    const visAll = caseData?.editorSettings?.visibility || {};
    const secVis = visAll[activeSection] || {};

    anchors.forEach((anchorEl) => {
      const subId = anchorEl.id;
      const visible = secVis[subId] !== false; // default true
      const header = anchorEl.querySelector('h4.subsection-title');
      if (!header) return;

      if (isFacultyMode) {
        // Flex the header to place toggle at right
        if (!header.dataset.flexified) {
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.justifyContent = 'space-between';
          header.dataset.flexified = 'true';
        }
        let toggleWrap = header.querySelector('.subsection-visibility-toggle');
        if (!toggleWrap) {
          toggleWrap = el(
            'label',
            {
              class: 'subsection-visibility-toggle und-toggle',
              style:
                'margin-left:auto; display:flex; align-items:center; gap:10px; font-weight:500; font-size:12px; color: var(--text-secondary); position: relative;',
            },
            [
              // Accessible checkbox drives the visual switch via sibling selectors
              el('input', {
                type: 'checkbox',
                class: 'und-toggle-input',
                'aria-label': 'Toggle subsection visibility',
                'aria-checked': 'false',
                style: 'position:absolute; opacity:0; width:0; height:0;',
              }),
              el('span', { class: 'und-toggle-track', 'aria-hidden': 'true' }, [
                el('span', { class: 'und-toggle-thumb' }),
              ]),
            ],
          );
          header.appendChild(toggleWrap);
        }
        const checkbox = toggleWrap.querySelector('input[type="checkbox"]');
        checkbox.checked = !!visible;
        checkbox.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
        checkbox.onchange = (e) => {
          const next = JSON.parse(JSON.stringify(caseData.editorSettings || { visibility: {} }));
          if (!next.visibility[activeSection]) next.visibility[activeSection] = {};
          next.visibility[activeSection][subId] = e.target.checked;
          setSubsectionCollapsed(anchorEl, !e.target.checked);
          onEditorSettingsChange?.(next);
          checkbox.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');
        };
        // In faculty view, keep banner; collapse content if off
        setSubsectionCollapsed(anchorEl, !visible);
        anchorEl.style.display = '';
      } else {
        // Student view: hide entire subsection if off
        anchorEl.style.display = visible ? '' : 'none';
      }
    });
  } catch (e) {
    console.warn('applySubsectionVisibilityControls error:', e);
  }
}

/**
 * Creates an editable case header for faculty mode
 * @param {Object} caseInfo - Case information object
 * @param {Function} onUpdate - Callback when case info is updated
 * @returns {HTMLElement} Editable case header
 */
/* istanbul ignore next */
/* eslint-disable no-unused-vars, complexity */
function createEditableCaseHeader(caseInfo, onUpdate, options = {}) {
  const preferEditOnClick = !!options.preferEditOnClick;
  const showEditButton = !!options.forceShowEditButton;
  const showPencil = !!options.showPencil; // default off
  // removed unused local state from earlier iterations

  const toggleButton = el(
    'button',
    {
      style: `
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px;
      margin-left: 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    `,
      title: 'Edit Case Details',
      type: 'button',
      onClick: (e) => {
        e.stopPropagation();
        openEditCaseModal({ ...caseInfo }, (updated) => {
          Object.assign(caseInfo, updated);
          titleDisplay.querySelector('h3').textContent = caseInfo.title || 'Untitled Case';
          const dobDisp = basicInfo.querySelector('#case-dob-display');
          if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
          updateBasicInfo();
          onUpdate?.(caseInfo);
        });
      },
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openEditCaseModal({ ...caseInfo }, (updated) => {
            Object.assign(caseInfo, updated);
            titleDisplay.querySelector('h3').textContent = caseInfo.title || 'Untitled Case';
            const dobDisp = basicInfo.querySelector('#case-dob-display');
            if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
            updateBasicInfo();
            onUpdate?.(caseInfo);
          });
        }
      },
    },
    ['✎'],
  );

  const titleDisplay = el('div', { class: 'case-title' }, [
    el('h3', { class: 'case-title-text' }, caseInfo.title || 'Untitled Case'),
    ...(showPencil ? [toggleButton] : []),
    ...(showEditButton
      ? [
          el(
            'button',
            {
              class: 'btn secondary',
              style: 'margin-left: 8px; padding:4px 8px; font-size:12px;',
              onclick: (e) => {
                e.stopPropagation();
                openEditCaseModal({ ...caseInfo }, (updated) => {
                  Object.assign(caseInfo, updated);
                  updateBasicInfo();
                  onUpdate?.(caseInfo);
                });
              },
            },
            'Edit',
          ),
        ]
      : []),
  ]);

  // Value spans for easy updates
  const settingValue = el('span', { class: 'value' }, caseInfo.setting || 'N/A');
  // Prefer displaying age computed from DOB when available for ongoing accuracy
  const ageValue = el(
    'span',
    { class: 'value' },
    computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A',
  );
  const sexValue = el('span', { class: 'value' }, caseInfo.sex || 'N/A');
  const acuityValue = el('span', { class: 'value' }, caseInfo.acuity || 'N/A');

  const basicInfo = el('div', { class: 'case-info-grid' }, [
    // Order: DOB, Age, Sex, Setting, Acuity (Title is above already)
    el('div', { class: 'case-info-row' }, [
      el('span', { class: 'label' }, 'DOB:'),
      el('span', { class: 'value', id: 'case-dob-display' }, caseInfo.dob || 'N/A'),
    ]),
    el('div', { class: 'case-info-row' }, [el('span', { class: 'label' }, 'Age:'), ageValue]),
    el('div', { class: 'case-info-row' }, [el('span', { class: 'label' }, 'Sex:'), sexValue]),
    el('div', { class: 'case-info-row' }, [
      el('span', { class: 'label' }, 'Setting:'),
      settingValue,
    ]),
    el('div', { class: 'case-info-row' }, [el('span', { class: 'label' }, 'Acuity:'), acuityValue]),
  ]);

  function updateBasicInfo() {
    settingValue.textContent = caseInfo.setting || 'N/A';
    ageValue.textContent = computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A';
    sexValue.textContent = caseInfo.sex || 'N/A';
    acuityValue.textContent = caseInfo.acuity || 'N/A';
    const dobDisp = basicInfo.querySelector('#case-dob-display');
    if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
  }

  // removed unused updateToggleDisplay

  const card = el(
    'div',
    {
      class: 'case-info-card',
      role: 'button',
      tabIndex: 0,
      title: preferEditOnClick ? 'Edit case details' : 'View full case details',
    },
    [titleDisplay, basicInfo],
  );
  card.addEventListener('click', () => openCaseDetailsModal(caseInfo));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCaseDetailsModal(caseInfo);
    }
  });
  return card;
}

// Simple Case Details Modal
function openCaseDetailsModal(caseInfo) {
  const overlay = el('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const content = el('div', { class: 'modal-content case-details-modal' }, [
    el('div', { class: 'modal-header' }, [
      el('h3', {}, 'Case Details'),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'modal-body case-details-body' }, [
      el('div', { class: 'case-info-grid case-details-grid' }, [
        // Secondary details: Setting, Acuity
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Setting'),
          el('span', { class: 'value' }, caseInfo.setting || 'N/A'),
        ]),
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Acuity'),
          el('span', { class: 'value' }, caseInfo.acuity || 'N/A'),
        ]),
      ]),
    ]),
    el(
      'div',
      {
        class: 'modal-actions',
        style:
          'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border);',
      },
      [el('button', { class: 'btn secondary', onclick: () => overlay.remove() }, 'Close')],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  // Focus for accessibility
  setTimeout(() => {
    const btn = overlay.querySelector('.close-btn');
    btn?.focus();
  }, 0);
}

// Read-only Artifact viewer modal (student and faculty view)
function openViewArtifactModal(module, options = {}) {
  const { isFacultyMode = false, onEdit, onRemove } = options || {};
  const overlay = el('div', {
    class: 'modal-overlay popup-overlay-base',
    role: 'dialog',
    'aria-modal': 'true',
  });
  // Track object URLs created for thumbnails so we can revoke on close
  const urlsToRevoke = [];
  const title =
    module?.title ||
    (module?.type ? module.type[0].toUpperCase() + module.type.slice(1) : 'Artifact');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
  const content = el('div', { class: 'modal-content case-details-modal popup-card-base' }, [
    el('div', { class: 'modal-header' }, [
      el('h3', {}, title),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'modal-body case-details-body' }, [
      (() => {
        // Use the shared normalizer so new/legacy modules behave the same
        const t = normalizeArtifactType(module);
        if (!module.type) module.type = t;
        if (t === 'referral') {
          const d = module.data || {};
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el('div', { style: 'font-weight:600; margin-bottom:6px;' }, 'Referral'),
              el('div', { class: 'case-info-grid case-details-grid' }, [
                el('div', { class: 'case-info-row' }, [
                  el('span', { class: 'label' }, 'Date'),
                  el('span', { class: 'value' }, d.date || 'N/A'),
                ]),
                el('div', { class: 'case-info-row' }, [
                  el('span', { class: 'label' }, 'From'),
                  el('span', { class: 'value' }, d.source || 'N/A'),
                ]),
                el('div', { class: 'case-info-row' }, [
                  el('span', { class: 'label' }, 'Reason'),
                  el('span', { class: 'value' }, d.reason || 'N/A'),
                ]),
                d.notes
                  ? el('div', { class: 'case-info-row' }, [
                      el('span', { class: 'label' }, 'Notes'),
                      el('span', { class: 'value' }, d.notes || ''),
                    ])
                  : null,
              ]),
            ],
          );
        }
        if (t === 'imaging') {
          const d = module.data || {};
          const rows = [
            ['Study', module.title || 'Imaging Study'],
            ['Date', d.date || 'N/A'],
            ['Modality', d.modality || d.type || 'N/A'],
            ['Body Part', d.bodyPart || d.anatomy || 'N/A'],
            d.views ? ['Views', d.views] : null,
            d.findings ? ['Findings', d.findings] : null,
            d.impression ? ['Impression', d.impression] : null,
            d.notes ? ['Notes', d.notes] : null,
          ].filter(Boolean);
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el('div', { style: 'font-weight:600; margin-bottom:6px;' }, 'Imaging'),
              el(
                'div',
                { class: 'case-info-grid case-details-grid' },
                rows.map(([label, val]) =>
                  el('div', { class: 'case-info-row' }, [
                    el('span', { class: 'label' }, label),
                    el('span', { class: 'value' }, String(val)),
                  ]),
                ),
              ),
            ],
          );
        }
        if (t === 'labs') {
          const d = module.data || {};
          const rows = [
            ['Ordered', d.date || 'N/A'],
            ['Panel', d.panel || module.title || 'Labs'],
            d.results ? ['Results', d.results] : null,
            d.summary ? ['Summary', d.summary] : null,
            d.notes ? ['Notes', d.notes] : null,
          ].filter(Boolean);
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el('div', { style: 'font-weight:600; margin-bottom:6px;' }, 'Labs'),
              el(
                'div',
                { class: 'case-info-grid case-details-grid' },
                rows.map(([label, val]) =>
                  el('div', { class: 'case-info-row' }, [
                    el('span', { class: 'label' }, label),
                    el('span', { class: 'value' }, String(val)),
                  ]),
                ),
              ),
            ],
          );
        }
        if (t === 'meds') {
          const d = module.data || {};
          const rows = [
            ['Medication', d.name || module.title || 'Medication'],
            ['Dose', d.dose || 'N/A'],
            ['Route', d.route || 'N/A'],
            ['Frequency', d.frequency || 'N/A'],
            d.indication ? ['Indication', d.indication] : null,
            d.notes ? ['Notes', d.notes] : null,
          ].filter(Boolean);
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el('div', { style: 'font-weight:600; margin-bottom:6px;' }, 'Medications'),
              el(
                'div',
                { class: 'case-info-grid case-details-grid' },
                rows.map(([label, val]) =>
                  el('div', { class: 'case-info-row' }, [
                    el('span', { class: 'label' }, label),
                    el('span', { class: 'value' }, String(val)),
                  ]),
                ),
              ),
            ],
          );
        }
        if (t === 'vitals') {
          const d = module.data || {};
          const rows = [
            ['Date', d.date || 'N/A'],
            d.bp ? ['BP', d.bp] : null,
            d.hr ? ['HR', d.hr] : null,
            d.temp ? ['Temp', d.temp] : null,
            d.rr ? ['RR', d.rr] : null,
            d.spo2 ? ['SpO2', d.spo2] : null,
            d.weight ? ['Weight', d.weight] : null,
            d.height ? ['Height', d.height] : null,
            d.notes ? ['Notes', d.notes] : null,
          ].filter(Boolean);
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el('div', { style: 'font-weight:600; margin-bottom:6px;' }, 'Vitals'),
              el(
                'div',
                { class: 'case-info-grid case-details-grid' },
                rows.map(([label, val]) =>
                  el('div', { class: 'case-info-row' }, [
                    el('span', { class: 'label' }, label),
                    el('span', { class: 'value' }, String(val)),
                  ]),
                ),
              ),
            ],
          );
        }
        if (t === 'pmh' || t === 'prior-notes' || t === 'other') {
          const d = module.data || {};
          const rows = [
            ['Title', module.title || (t === 'pmh' ? 'Past Medical History' : 'Document')],
            d.date ? ['Date', d.date] : null,
            d.summary ? ['Summary', d.summary] : null,
            d.notes ? ['Notes', d.notes] : null,
          ].filter(Boolean);
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el(
                'div',
                { style: 'font-weight:600; margin-bottom:6px;' },
                t === 'pmh' ? 'Past Medical History' : module.title || 'Document',
              ),
              el(
                'div',
                { class: 'case-info-grid case-details-grid' },
                rows.map(([label, val]) =>
                  el('div', { class: 'case-info-row' }, [
                    el('span', { class: 'label' }, label),
                    el('span', { class: 'value' }, String(val)),
                  ]),
                ),
              ),
            ],
          );
        }
        // Generic fallback table for unknown types
        const entries = Object.entries(module.data || {});
        const hasRows = entries.length > 0;
        if (hasRows) {
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el(
                'div',
                { style: 'font-weight:600; margin-bottom:6px;' },
                module.title || 'Details',
              ),
              el(
                'div',
                { class: 'case-info-grid case-details-grid' },
                entries.map(([k, v]) =>
                  el('div', { class: 'case-info-row' }, [
                    el(
                      'span',
                      { class: 'label' },
                      k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
                    ),
                    el('span', { class: 'value' }, typeof v === 'string' ? v : JSON.stringify(v)),
                  ]),
                ),
              ),
            ],
          );
        }
        return el(
          'div',
          { style: 'font-size:12px; color: var(--text-secondary);' },
          'No details available.',
        );
      })(),
      (() => {
        const atts = Array.isArray(module?.data?.attachments) ? module.data.attachments : [];
        if (!atts.length) return null;
        return el('div', { style: 'margin-top:12px;' }, [
          el('div', { class: 'goal-section-title' }, 'Attachments'),
          el(
            'div',
            { style: 'display:flex; flex-direction:column; gap:8px;' },
            atts.map((m) => {
              const row = el('div', { style: 'display:flex; align-items:center; gap:8px;' }, []);
              const thumbWrap = el('div', {
                style:
                  'width:40px; height:40px; display:flex; align-items:center; justify-content:center;',
              });
              // Create a placeholder; fill with image if mimetype is image/*
              const isImg = (m.mime || '').startsWith('image/');
              if (isImg) {
                const img = el('img', {
                  style:
                    'width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid var(--border); background: var(--bg-secondary);',
                  alt: m.name || 'attachment',
                });
                thumbWrap.appendChild(img);
                // Async load object URL and set src, then track for revocation
                (async () => {
                  try {
                    const att = await getAttachmentsService();
                    const o = await att.createObjectURL(m.id);
                    if (o?.url) {
                      img.src = o.url;
                      urlsToRevoke.push(o.url);
                    }
                  } catch {}
                })();
              } else {
                thumbWrap.appendChild(el('span', { style: 'font-size:18px;' }, '📄'));
              }
              const nameSpan = el(
                'span',
                {
                  style:
                    'flex:1; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;',
                },
                `${m.name} (${Math.ceil((m.size || 0) / 1024)} KB)`,
              );
              row.appendChild(thumbWrap);
              row.appendChild(nameSpan);
              // Open button
              row.appendChild(
                el(
                  'button',
                  {
                    class: 'btn secondary',
                    style: 'font-size:12px; padding:6px 10px;',
                    onclick: async () => {
                      // In-page preview overlay
                      const overlay = document.createElement('div');
                      overlay.style.cssText =
                        'position:fixed; inset:0; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:10000;';
                      const panel = document.createElement('div');
                      panel.style.cssText =
                        'background:var(--surface); color:var(--text); max-width:90vw; max-height:90vh; width:min(1000px, 92vw); border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.35); display:flex; flex-direction:column;';
                      const header = document.createElement('div');
                      header.style.cssText =
                        'display:flex; align-items:center; gap:8px; padding:12px 14px; border-bottom:1px solid var(--border);';
                      const title = document.createElement('div');
                      title.style.cssText =
                        'flex:1; font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
                      title.textContent = m.name || 'Attachment';
                      const closeBtn = document.createElement('button');
                      closeBtn.className = 'btn secondary';
                      closeBtn.textContent = 'Close';
                      closeBtn.style.cssText = 'padding:6px 10px;';
                      header.appendChild(title);
                      header.appendChild(closeBtn);
                      const content = document.createElement('div');
                      content.style.cssText =
                        'padding:10px 14px; overflow:auto; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary);';
                      const footer = document.createElement('div');
                      footer.style.cssText =
                        'display:flex; gap:8px; justify-content:flex-end; padding:10px 14px; border-top:1px solid var(--border);';
                      const openTabBtn = document.createElement('button');
                      openTabBtn.className = 'btn secondary';
                      openTabBtn.textContent = 'Open in new tab';
                      openTabBtn.style.cssText = 'padding:6px 10px;';
                      const downloadBtn = document.createElement('button');
                      downloadBtn.className = 'btn secondary';
                      downloadBtn.textContent = 'Download';
                      downloadBtn.style.cssText = 'padding:6px 10px;';
                      footer.appendChild(openTabBtn);
                      footer.appendChild(downloadBtn);
                      panel.appendChild(header);
                      panel.appendChild(content);
                      panel.appendChild(footer);
                      overlay.appendChild(panel);
                      document.body.appendChild(overlay);

                      let objectUrl = null;
                      const cleanup = () => {
                        try {
                          if (objectUrl) URL.revokeObjectURL(objectUrl);
                        } catch {}
                        try {
                          overlay.remove();
                        } catch {}
                      };
                      closeBtn.addEventListener('click', cleanup);
                      overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) cleanup();
                      });

                      try {
                        const att = await getAttachmentsService();
                        const o = await att.createObjectURL(m.id);
                        if (!o?.url) throw new Error('No URL');
                        objectUrl = o.url;
                        const isImg = (m.mime || '').startsWith('image/');
                        const isPdf =
                          (m.mime || '').includes('pdf') || /\.pdf$/i.test(m.name || '');
                        if (isImg) {
                          const img = document.createElement('img');
                          img.src = objectUrl;
                          img.alt = m.name || 'image';
                          img.style.cssText =
                            'max-width:100%; max-height:78vh; object-fit:contain; border-radius:8px; background:#fff;';
                          content.replaceChildren();
                          content.appendChild(img);
                        } else if (isPdf) {
                          const iframe = document.createElement('iframe');
                          iframe.src = objectUrl;
                          iframe.style.cssText =
                            'width:86vw; max-width:calc(1000px - 28px); height:78vh; border:0; background:#fff;';
                          content.replaceChildren();
                          content.appendChild(iframe);
                        } else {
                          // Generic fallback: attempt iframe, else message
                          const info = document.createElement('div');
                          info.style.cssText =
                            'display:flex; flex-direction:column; align-items:center; gap:8px; padding:20px; color:var(--text-secondary);';
                          const icon = document.createElement('div');
                          icon.style.cssText = 'font-size:42px;';
                          icon.textContent = '📄';
                          const msg = document.createElement('div');
                          msg.style.cssText = 'font-size:14px;';
                          msg.textContent =
                            'Preview is not available for this file type. Use Open in new tab or Download.';
                          info.replaceChildren(icon, msg);
                          content.replaceChildren();
                          content.appendChild(info);
                        }

                        openTabBtn.addEventListener('click', () => {
                          const win2 = window.open(objectUrl, '_blank');
                          if (!win2) alert('Pop-up blocked. Please allow pop-ups.');
                        });
                        downloadBtn.addEventListener('click', () => {
                          const a = document.createElement('a');
                          a.href = objectUrl;
                          a.download = m.name || 'attachment';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        });
                      } catch (e) {
                        console.warn('Preview failed:', e);
                        content.textContent = 'Unable to preview this file.';
                      }
                    },
                  },
                  'Open',
                ),
              );
              // Download button
              {
                const btn = el(
                  'button',
                  {
                    class: 'btn secondary',
                    style: 'font-size:12px; padding:6px 10px;',
                  },
                  'Download',
                );
                btn.addEventListener('click', async () => {
                  try {
                    const att = await getAttachmentsService();
                    const o = await att.createObjectURL(m.id);
                    if (o?.url) {
                      const a = document.createElement('a');
                      a.href = o.url;
                      a.download = m.name || 'attachment';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setTimeout(() => {
                        try {
                          URL.revokeObjectURL(o.url);
                        } catch {}
                      }, 5000);
                    }
                  } catch (e) {
                    console.warn('Download attachment failed:', e);
                  }
                });
                row.appendChild(btn);
              }
              // Faculty-only: delete file from storage and remove reference
              if (isFacultyMode) {
                const delBtn = el(
                  'button',
                  {
                    class: 'btn secondary',
                    style: 'font-size:12px; padding:6px 10px; color:#e53e3e; border-color:#e53e3e;',
                    title: 'Delete file from storage and remove from this document',
                  },
                  'Delete File',
                );
                delBtn.addEventListener('click', async () => {
                  if (!confirm('Delete this file from storage and remove it from this document?'))
                    return;
                  try {
                    const att = await getAttachmentsService();
                    await att.delete(m.id);
                  } catch (e) {
                    console.warn('Delete file failed:', e);
                  }
                  try {
                    const nextAtts = (
                      Array.isArray(module?.data?.attachments) ? module.data.attachments : []
                    ).filter((x) => x.id !== m.id);
                    const updated = {
                      ...module,
                      data: { ...(module.data || {}), attachments: nextAtts },
                    };
                    onEdit?.(updated);
                    row.remove();
                  } catch {}
                });
                row.appendChild(delBtn);
              }
              return row;
            }),
          ),
        ]);
      })(),
    ]),
    el(
      'div',
      {
        class: 'modal-actions',
        style:
          'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border); display:flex; gap:8px;',
      },
      [
        ...(isFacultyMode
          ? (() => {
              const remBtn = el(
                'button',
                { class: 'btn secondary', style: 'border-color:#e53e3e; color:#e53e3e;' },
                'Remove',
              );
              remBtn.addEventListener('click', () => {
                if (confirm('Remove this background document?')) {
                  try {
                    onRemove?.(module.id);
                  } catch {}
                  overlay.remove();
                }
              });
              const editBtn = el('button', { class: 'btn primary' }, 'Edit');
              editBtn.addEventListener('click', () => {
                openEditArtifactModal(module, (updated) => {
                  try {
                    onEdit?.(updated);
                  } catch {}
                  overlay.remove();
                });
              });
              return [remBtn, editBtn];
            })()
          : []),
        (() => {
          const c = el('button', { class: 'btn secondary' }, 'Close');
          c.addEventListener('click', () => overlay.remove());
          return c;
        })(),
      ],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    content.classList.add('is-open');
  });
  // Fallback force-show if transitions sheet missing or class application fails
  setTimeout(() => {
    if (getComputedStyle(overlay).opacity === '0') {
      overlay.style.opacity = '1';
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }
  }, 80);
  const cleanup = () => {
    try {
      urlsToRevoke.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
    } catch {}
  };
  const close = () => {
    cleanup();
    overlay.remove();
  };
  // Patch close handlers to cleanup
  const xBtn = content.querySelector('.close-btn');
  if (xBtn) xBtn.addEventListener('click', close);
  overlay.addEventListener('remove', cleanup);
  setTimeout(() => xBtn?.focus(), 0);
}

// Add Artifact modal (faculty): collects title, type, and type-specific fields
export function openAddArtifactModal(onAdd) {
  const overlay = el('div', {
    class: 'modal-overlay popup-overlay-base',
    role: 'dialog',
    'aria-modal': 'true',
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
  let currentType = 'referral';
  const titleInput = el('input', {
    type: 'text',
    class: 'instructor-form-input',
    placeholder: 'Artifact title (e.g., Referral to PT)',
    value: '',
    'aria-label': 'Artifact title',
  });

  // Referral fields
  const ref = { date: '', source: '', reason: '', notes: '', attachments: [] };
  // Attachment picker (input + drag & drop zone)
  const fileInput = el('input', {
    type: 'file',
    multiple: true,
    accept: '*/*',
    style: 'display:none;',
    'aria-label': 'Select artifact files',
    onchange: async (e) => handleFiles(Array.from(e.target.files || [])),
  });
  const dropZone = el(
    'div',
    {
      class: 'attachment-drop-zone',
      style:
        'margin-top:4px; padding:12px; border:2px dashed var(--border); border-radius:6px; text-align:center; font-size:12px; color: var(--text-secondary); cursor:pointer; transition:background .15s, border-color .15s;',
      onclick: () => fileInput.click(),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      },
      tabindex: '0',
      role: 'button',
      'aria-label': 'Add attachments. Click or drag and drop files here',
    },
    [el('div', {}, 'Click or drag & drop files here')],
  );
  async function handleFiles(files) {
    if (!files.length) return;
    const att = await getAttachmentsService();
    if (!att?.isSupported()) {
      alert('Attachments not supported in this browser (IndexedDB unavailable).');
      return;
    }
    for (const f of files) {
      try {
        const meta = await att.save(f, f.name, f.type);
        // Also embed as data URL for portability when case shared
        const fr = new FileReader();
        const dataUrl = await new Promise((res, rej) => {
          fr.onerror = () => rej(fr.error);
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(f);
        }).catch(() => null);
        if (dataUrl) {
          meta.dataUrl = dataUrl;
          meta.embedStatus = 'embedded';
        }
        ref.attachments.push(meta);
      } catch (err) {
        console.warn('Failed to save attachment:', err);
      }
    }
    renderAttachmentList();
  }
  const dzHighlightOn = () => {
    dropZone.style.background = 'var(--surface-alt, var(--surface-muted))';
    dropZone.style.borderColor = 'var(--accent, var(--primary))';
  };
  const dzHighlightOff = () => {
    dropZone.style.background = '';
    dropZone.style.borderColor = 'var(--border)';
  };
  ['dragenter', 'dragover'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dzHighlightOn();
    }),
  );
  ['dragleave', 'dragend'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dzHighlightOff();
    }),
  );
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dzHighlightOff();
    handleFiles(Array.from(e.dataTransfer?.files || []));
  });
  const attList = el('div', { style: 'display:flex; flex-direction:column; gap:6px;' });
  function renderAttachmentList() {
    attList.replaceChildren();
    if (!ref.attachments || !ref.attachments.length) return;
    ref.attachments.forEach((m, idx) => {
      const row = el('div', { style: 'display:flex; align-items:center; gap:8px;' }, [
        el(
          'span',
          { style: 'flex:1; font-size:12px;' },
          `${m.name} (${Math.ceil((m.size || 0) / 1024)} KB)`,
        ),
        el(
          'button',
          {
            class: 'btn secondary',
            style: 'font-size:11px; padding:4px 8px;',
            title: 'Remove attachment (does not delete the stored file)',
            onclick: () => {
              ref.attachments.splice(idx, 1);
              renderAttachmentList();
            },
          },
          'Remove',
        ),
      ]);
      attList.appendChild(row);
    });
  }
  const refForm = el('div', { style: 'display:grid; gap:10px; margin-top: 8px;' }, [
    el('div', {}, [
      el('label', { class: 'instructor-form-label', for: 'artifact-date' }, 'Date'),
      el('input', {
        id: 'artifact-date',
        name: 'artifact-date',
        type: 'date',
        class: 'instructor-form-input',
        oninput: (e) => (ref.date = e.target.value),
      }),
    ]),
    el('div', {}, [
      el(
        'label',
        { class: 'instructor-form-label', for: 'artifact-source' },
        'From (provider/department)',
      ),
      el('input', {
        id: 'artifact-source',
        name: 'artifact-source',
        type: 'text',
        class: 'instructor-form-input',
        oninput: (e) => (ref.source = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label', for: 'artifact-reason' }, 'Reason'),
      el('input', {
        id: 'artifact-reason',
        name: 'artifact-reason',
        type: 'text',
        class: 'instructor-form-input',
        oninput: (e) => (ref.reason = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label', for: 'artifact-notes' }, 'Notes'),
      el('textarea', {
        id: 'artifact-notes',
        name: 'artifact-notes',
        class: 'instructor-form-input',
        style: 'min-height:68px;',
        oninput: (e) => (ref.notes = e.target.value),
      }),
    ]),
  ]);

  const content = el('div', { class: 'modal-content case-details-modal popup-card-base' }, [
    el('div', { class: 'modal-header' }, [
      el('h3', {}, 'Add Case Artifact'),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'modal-body case-details-body' }, [
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Title *'),
        titleInput,
      ]),
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Type *'),
        el(
          'select',
          { class: 'instructor-form-input', onchange: (e) => (currentType = e.target.value) },
          [
            el('option', { value: 'referral', selected: '' }, 'Referral'),
            el('option', { value: 'pmh' }, 'Past Medical History'),
            el('option', { value: 'imaging' }, 'Imaging'),
            el('option', { value: 'labs' }, 'Labs'),
            el('option', { value: 'meds' }, 'Medications'),
            el('option', { value: 'vitals' }, 'Vitals'),
            el('option', { value: 'prior-notes' }, 'Prior Notes'),
            el('option', { value: 'other' }, 'Other'),
          ],
        ),
      ]),
      refForm,
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Attachments (optional)'),
        fileInput,
        dropZone,
        el('div', { class: 'hint' }, 'Images or documents are stored locally in your browser.'),
        attList,
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
            class: 'btn secondary',
            style: 'margin-right:4px;' /* minor separate before gap spacing */,
            onclick: () => overlay.remove(),
          },
          'Cancel',
        ),
        el(
          'button',
          {
            class: 'btn primary',
            onclick: () => {
              const title = (titleInput.value || '').trim();
              if (!title) {
                alert('Please enter a title for this artifact.');
                titleInput.focus();
                return;
              }
              const id = `${currentType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const mod = { id, type: currentType, title, data: {} };
              if (currentType === 'referral') {
                mod.data = { ...ref };
              } else if (ref.attachments && ref.attachments.length) {
                // For non-referral types, still allow attachments
                mod.data.attachments = [...ref.attachments];
              }
              onAdd?.(mod);
              overlay.remove();
            },
          },
          'Add Artifact',
        ),
      ],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    content.classList.add('is-open');
  });
  setTimeout(() => {
    if (getComputedStyle(overlay).opacity === '0') {
      overlay.style.opacity = '1';
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }
  }, 80);
  setTimeout(() => titleInput?.focus(), 0);
}

// Edit Artifact modal (faculty): similar to Add but pre-populated and updates existing module
function openEditArtifactModal(module, onSave) {
  const overlay = el('div', {
    class: 'modal-overlay popup-overlay-base',
    role: 'dialog',
    'aria-modal': 'true',
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });

  let currentType = module?.type || 'referral';
  const titleInput = el('input', {
    type: 'text',
    class: 'instructor-form-input',
    placeholder: 'Artifact title',
    value: module?.title || '',
    'aria-label': 'Artifact title',
  });

  // Referral fields
  const ref = {
    date: module?.data?.date || '',
    source: module?.data?.source || '',
    reason: module?.data?.reason || '',
    notes: module?.data?.notes || '',
    attachments: Array.isArray(module?.data?.attachments) ? [...module.data.attachments] : [],
  };
  const fileInput = el('input', {
    type: 'file',
    multiple: true,
    accept: '*/*',
    style: 'display:none;',
    'aria-label': 'Select artifact files',
    onchange: async (e) => handleFilesEdit(Array.from(e.target.files || [])),
  });
  const dropZone = el(
    'div',
    {
      class: 'attachment-drop-zone',
      style:
        'margin-top:4px; padding:12px; border:2px dashed var(--border); border-radius:6px; text-align:center; font-size:12px; color: var(--text-secondary); cursor:pointer; transition:background .15s, border-color .15s;',
      onclick: () => fileInput.click(),
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      },
      tabindex: '0',
      role: 'button',
      'aria-label': 'Add attachments. Click or drag and drop files here',
    },
    [el('div', {}, 'Click or drag & drop files here')],
  );
  async function handleFilesEdit(files) {
    if (!files.length) return;
    const att = await getAttachmentsService();
    if (!att?.isSupported()) {
      alert('Attachments not supported in this browser (IndexedDB unavailable).');
      return;
    }
    for (const f of files) {
      try {
        const meta = await att.save(f, f.name, f.type);
        const fr = new FileReader();
        const dataUrl = await new Promise((res, rej) => {
          fr.onerror = () => rej(fr.error);
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(f);
        }).catch(() => null);
        if (dataUrl) {
          meta.dataUrl = dataUrl;
          meta.embedStatus = 'embedded';
        }
        ref.attachments.push(meta);
      } catch (err) {
        console.warn('Failed to save attachment:', err);
      }
    }
    renderAttachmentList();
  }
  const dzHighlightOn = () => {
    dropZone.style.background = 'var(--surface-alt, var(--surface-muted))';
    dropZone.style.borderColor = 'var(--accent, var(--primary))';
  };
  const dzHighlightOff = () => {
    dropZone.style.background = '';
    dropZone.style.borderColor = 'var(--border)';
  };
  ['dragenter', 'dragover'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dzHighlightOn();
    }),
  );
  ['dragleave', 'dragend'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dzHighlightOff();
    }),
  );
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dzHighlightOff();
    handleFilesEdit(Array.from(e.dataTransfer?.files || []));
  });
  const attList = el('div', { style: 'display:flex; flex-direction:column; gap:6px;' });
  function renderAttachmentList() {
    attList.replaceChildren();
    if (!ref.attachments || !ref.attachments.length) return;
    ref.attachments.forEach((m, idx) => {
      const row = el('div', { style: 'display:flex; align-items:center; gap:8px;' }, [
        el(
          'span',
          { style: 'flex:1; font-size:12px;' },
          `${m.name} (${Math.ceil((m.size || 0) / 1024)} KB)`,
        ),
        el(
          'button',
          {
            class: 'btn secondary',
            style: 'font-size:11px; padding:4px 8px;',
            title: 'Remove attachment from this document',
            onclick: () => {
              ref.attachments.splice(idx, 1);
              renderAttachmentList();
            },
          },
          'Remove',
        ),
      ]);
      attList.appendChild(row);
    });
  }
  const refForm = el('div', { style: 'display:grid; gap:10px; margin-top: 8px;' }, [
    el('div', {}, [
      el('label', { class: 'instructor-form-label', for: 'artifact-edit-date' }, 'Date'),
      el('input', {
        id: 'artifact-edit-date',
        name: 'artifact-edit-date',
        type: 'date',
        class: 'instructor-form-input',
        value: ref.date,
        oninput: (e) => (ref.date = e.target.value),
      }),
    ]),
    el('div', {}, [
      el(
        'label',
        { class: 'instructor-form-label', for: 'artifact-edit-source' },
        'From (provider/department)',
      ),
      el('input', {
        id: 'artifact-edit-source',
        name: 'artifact-edit-source',
        type: 'text',
        class: 'instructor-form-input',
        value: ref.source,
        oninput: (e) => (ref.source = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label', for: 'artifact-edit-reason' }, 'Reason'),
      el('input', {
        id: 'artifact-edit-reason',
        name: 'artifact-edit-reason',
        type: 'text',
        class: 'instructor-form-input',
        value: ref.reason,
        oninput: (e) => (ref.reason = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label', for: 'artifact-edit-notes' }, 'Notes'),
      el(
        'textarea',
        {
          id: 'artifact-edit-notes',
          name: 'artifact-edit-notes',
          class: 'instructor-form-input',
          style: 'min-height:68px;',
          oninput: (e) => (ref.notes = e.target.value),
        },
        ref.notes,
      ),
    ]),
  ]);

  const content = el('div', { class: 'modal-content case-details-modal popup-card-base' }, [
    el('div', { class: 'modal-header' }, [
      el('h3', {}, 'Edit Background Document'),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'modal-body case-details-body' }, [
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Title *'),
        titleInput,
      ]),
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Type *'),
        el(
          'select',
          {
            class: 'instructor-form-input',
            onchange: (e) => (currentType = e.target.value),
          },
          [
            el(
              'option',
              { value: 'referral', selected: currentType === 'referral' ? '' : undefined },
              'Referral',
            ),
            el(
              'option',
              { value: 'pmh', selected: currentType === 'pmh' ? '' : undefined },
              'Past Medical History',
            ),
            el(
              'option',
              { value: 'imaging', selected: currentType === 'imaging' ? '' : undefined },
              'Imaging',
            ),
            el(
              'option',
              { value: 'labs', selected: currentType === 'labs' ? '' : undefined },
              'Labs',
            ),
            el(
              'option',
              { value: 'meds', selected: currentType === 'meds' ? '' : undefined },
              'Medications',
            ),
            el(
              'option',
              { value: 'vitals', selected: currentType === 'vitals' ? '' : undefined },
              'Vitals',
            ),
            el(
              'option',
              { value: 'prior-notes', selected: currentType === 'prior-notes' ? '' : undefined },
              'Prior Notes',
            ),
            el(
              'option',
              { value: 'other', selected: currentType === 'other' ? '' : undefined },
              'Other',
            ),
          ],
        ),
      ]),
      refForm,
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Attachments'),
        fileInput,
        dropZone,
        el('div', { class: 'hint' }, 'Add images or documents (stored locally in your browser).'),
        attList,
      ]),
    ]),
    el(
      'div',
      {
        class: 'modal-actions',
        style:
          'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border); display:flex; gap:8px;',
      },
      [
        el('button', { class: 'btn secondary', onclick: () => overlay.remove() }, 'Cancel'),
        el(
          'button',
          {
            class: 'btn primary',
            onclick: () => {
              const title = (titleInput.value || '').trim();
              if (!title) {
                alert('Please enter a title.');
                titleInput.focus();
                return;
              }
              const updated = { id: module.id, type: currentType, title, data: {} };
              if (currentType === 'referral') {
                updated.data = { ...ref };
              } else if (ref.attachments && ref.attachments.length) {
                updated.data.attachments = [...ref.attachments];
              }
              onSave?.(updated);
              overlay.remove();
            },
          },
          'Save Changes',
        ),
      ],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    content.classList.add('is-open');
  });
  setTimeout(() => {
    if (getComputedStyle(overlay).opacity === '0') {
      overlay.style.opacity = '1';
      content.style.opacity = '1';
      content.style.transform = 'scale(1)';
    }
  }, 80);
  setTimeout(() => titleInput?.focus(), 0);
  renderAttachmentList();
}

// Edit Case Details Modal (faculty): mirrors Create New Case layout
// openEditCaseModal is now sourced from './modal.js'

export function createChartNavigation(config) {
  const {
    activeSection,
    onSectionChange,
    caseData = {},
    caseInfo = {},
    isFacultyMode = false,
    onEditorSettingsChange,
  } = config;

  // Define top-level sections only; subsections will be derived from DOM anchors to keep sidebar in sync with editor content
  const sections = [
    { id: 'subjective', label: 'Subjective', icon: '◉' },
    { id: 'objective', label: 'Objective', icon: '⚬' },
    { id: 'assessment', label: 'Assessment', icon: '⬢' },
    { id: 'plan', label: 'Plan', icon: '▪' },
    { id: 'billing', label: 'Billing', icon: '⬟' },
  ];

  // Map known subsection IDs to data accessors for accurate status
  const subsectionDataResolvers = {
    // Subjective
    hpi: (section) => ({
      chiefComplaint: section?.chiefComplaint,
      historyOfPresentIllness: section?.historyOfPresentIllness,
    }),
    'pain-assessment': (section) => ({
      location: section?.painLocation,
      scale: section?.painScale,
      quality: section?.painQuality,
      pattern: section?.painPattern,
      aggravatingFactors: section?.aggravatingFactors,
      easingFactors: section?.easingFactors,
    }),
    'functional-status': (section) => ({
      functionalLimitations: section?.functionalLimitations,
      priorLevel: section?.priorLevel,
      patientGoals: section?.patientGoals,
    }),
    'additional-history': (section) => ({
      medicationsCurrent: section?.medicationsCurrent,
      redFlags: section?.redFlags,
      additionalHistory: section?.additionalHistory,
    }),
    // Objective
    'general-observations': (section) => section?.text,
    inspection: (section) => section?.inspection?.visual,
    palpation: (section) => section?.palpation?.findings,
    'regional-assessment': (section) => ({
      rom: section?.rom,
      mmt: section?.mmt,
      specialTests: section?.specialTests,
      regionalAssessments: section?.regionalAssessments,
    }),
    'neurological-screening': (section) => section?.neuro?.screening,
    'functional-movement': (section) => section?.functional?.assessment,
    'treatment-performed': (section) => section?.treatmentPerformed,
    // Assessment
    'primary-impairments': (section) => section?.primaryImpairments,
    'icf-classification': (section) => ({
      bodyFunctions: section?.bodyFunctions,
      activityLimitations: section?.activityLimitations,
      participationRestrictions: section?.participationRestrictions,
    }),
    'pt-diagnosis': (section) => section?.ptDiagnosis,
    'clinical-reasoning': (section) => section?.clinicalReasoning,
    // Plan (dynamic from existing anchors in Plan components)
    'treatment-plan': (section) => section, // composite within Plan
    'in-clinic-treatment-plan': (section) => ({
      exerciseTable: section?.exerciseTable,
      frequency: section?.frequency,
      duration: section?.duration,
    }),
    'goal-setting': (section) => ({
      frequency: section?.frequency,
      duration: section?.duration,
      goalsTable: section?.goalsTable,
    }),
    // Billing
    'diagnosis-codes': (section) => section?.diagnosisCodes || section?.icdCodes,
    'cpt-codes': (section) => section?.billingCodes || section?.cptCodes,
    'billing-notes': (section) => section?.skilledJustification || section?.treatmentNotes,
    'orders-referrals': (section) => section?.ordersReferrals,
  };

  // Title extraction helper (use only text nodes, ignore toggle UI like the banner 'Show' control)
  const extractTitle = (anchorEl) => {
    const h = anchorEl.querySelector('.subsection-title');
    if (h) {
      // Collect only TEXT_NODE contents to avoid including toggle label text
      const text = Array.from(h.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) return text;
      // Fallback: strip a trailing 'Show' if present
      const raw = (h.textContent || '').trim();
      return raw.replace(/\s*Show\s*$/i, '').trim();
    }
    return anchorEl.getAttribute('data-title') || anchorEl.id || 'Subsection';
  };

  // Fallback subsection map and titles (used when section is not currently rendered)
  const subsectionFallbackMap = {
    subjective: ['hpi', 'pain-assessment', 'functional-status', 'additional-history'],
    objective: [
      'general-observations',
      'inspection',
      'palpation',
      'regional-assessment',
      'neurological-screening',
      'functional-movement',
      'treatment-performed',
    ],
    assessment: ['primary-impairments', 'icf-classification', 'pt-diagnosis', 'clinical-reasoning'],
    plan: ['goal-setting', 'treatment-plan', 'in-clinic-treatment-plan'],
    billing: ['diagnosis-codes', 'cpt-codes', 'orders-referrals'],
  };
  const subsectionTitleMap = {
    hpi: 'History',
    'pain-assessment': 'Symptoms',
    'functional-status': 'Functional Status',
    'additional-history': 'Additional History',
    'general-observations': 'General Observations & Vital Signs',
    inspection: 'Inspection',
    palpation: 'Palpation',
    'regional-assessment': 'Regional Assessment',
    'neurological-screening': 'Neurological Screening',
    'functional-movement': 'Functional Movement',
    'treatment-performed': 'Treatment Performed',
    'primary-impairments': 'Primary Impairments',
    'icf-classification': 'ICF Classification',
    'pt-diagnosis': 'PT Diagnosis',
    'clinical-reasoning': 'Clinical Reasoning',
    'goal-setting': 'Goal Setting',
    'in-clinic-treatment-plan': 'In-Clinic Treatment Plan',
    'diagnosis-codes': 'Diagnosis Codes',
    'cpt-codes': 'CPT Codes',
    'billing-notes': 'Billing Notes',
    'orders-referrals': 'Orders & Referrals',
    'regional-assessment': 'Regional Assessment',
    'neurological-screening': 'Neurological Screening',
    'functional-movement': 'Functional Movement Assessment',
    'treatment-performed': 'Treatment Performed',
    'primary-impairments': 'Primary Impairments',
    'icf-classification': 'ICF Classification',
    'pt-diagnosis': 'Physical Therapy Diagnosis & Prognosis',
    'clinical-reasoning': 'Clinical Impression',
    'treatment-plan': 'Plan of Care',
    'in-clinic-treatment-plan': 'Treatment Plan',
    'goal-setting': 'Goals',
    'diagnosis-codes': 'ICD-10 Codes',
    'cpt-codes': 'CPT Codes',
    'orders-referrals': 'Orders & Referrals',
  };

  function getSubsectionsForSection(sectionId, activeSectionId) {
    // If the section is active, prefer DOM-derived anchors
    if (sectionId === activeSectionId) {
      const contentRoot = document.querySelector('.section-content');
      const sectionRoot = contentRoot?.querySelector(`.${sectionId}-section`);
      if (sectionRoot) {
        let anchors = Array.from(sectionRoot.querySelectorAll('.section-anchor'));
        // In student mode, hide subsections toggled off by instructor
        const vis = caseData?.editorSettings?.visibility?.[sectionId];
        if (vis && typeof vis === 'object') {
          anchors = anchors.filter((a) => vis[a.id] !== false);
        }
        if (anchors.length) {
          return anchors.map((a) => ({
            id: a.id,
            label:
              a.querySelector('.subsection-title')?.textContent || subsectionTitleMap[a.id] || a.id,
          }));
        }
      }
    }
    // Fallback to expected anchors
    let ids = subsectionFallbackMap[sectionId] || [];
    const vis = caseData?.editorSettings?.visibility?.[sectionId];
    if (vis && typeof vis === 'object') {
      ids = ids.filter((id) => vis[id] !== false);
    }
    return ids.map((id) => ({ id, label: subsectionTitleMap[id] || id }));
  }

  // Tri-state section status from its subsections
  function calculateSectionStatus(sectionId, caseDataObj, activeSectionId) {
    const sectionData = caseDataObj?.[sectionId] || {};
    const subs = getSubsectionsForSection(sectionId, activeSectionId);
    if (!subs.length) return 'empty';
    let sawComplete = false;
    let sawEmpty = false;
    for (const sub of subs) {
      const resolver = subsectionDataResolvers[sub.id];
      const data = resolver ? resolver(sectionData) : sectionData?.[sub.id];
      const status = getSubsectionStatus(data, sub.id, sectionData);
      if (status === 'partial') return 'partial';
      if (status === 'complete') sawComplete = true;
      if (status === 'empty') sawEmpty = true;
    }
    if (sawComplete && sawEmpty) return 'partial';
    return sawComplete ? 'complete' : 'empty';
  }

  // Helper: tri-state section status (no percentage)
  const getProgressStatus = (sectionId, caseData = {}) => {
    const status = calculateSectionStatus(sectionId, caseData, activeSection);
    return { status };
  };

  // Simple tri-state dot indicator
  const createProgressIndicator = (status) => {
    const colors = {
      empty: 'var(--border)',
      partial: 'var(--und-orange)',
      complete: 'var(--und-green)',
    };
    const color = colors[status] || 'var(--border)';
    return el('div', {
      style: `width: 12px; height: 12px; border-radius: 50%; background: ${status === 'empty' ? 'var(--bg)' : color}; border: 2px solid ${color}; margin-right: 10px; flex-shrink:0;`,
    });
  };

  // Create section header (collapsible card toggle)
  const createSectionNav = (section, isCollapsed, rebuild) => {
    const isActive = section.id === activeSection;
    const progressInfo = getProgressStatus(section.id, config.caseData);
    // Determine dirty (unsaved / partial) state: treat 'partial' as dirty indicator
    let isDirty = progressInfo.status === 'partial';
    try {
      // Optional deeper dirty detection: compare serialized subsection data snapshot
      const original = window.__initialCaseSnapshot?.[section.id];
      const current = config.caseData?.[section.id];
      if (!isDirty && original && current) {
        const origStr = JSON.stringify(original);
        const curStr = JSON.stringify(current);
        if (origStr !== curStr) isDirty = true;
      }
    } catch {}

    // New layout: label left, arrow (twisty) right, no progress dot. Status will be on card border.
    const navItem = el(
      'div',
      {
        class: `section-nav-item ${isActive ? 'active' : ''}`,
        'data-section-id': section.id,
        'aria-current': isActive ? 'page' : undefined,
        'aria-expanded': String(!isCollapsed),
        role: 'button',
        tabindex: '0',
        onClick: () => {
          // Preserve scroll position of sidebar before rebuild to avoid jump
          let scrollEl = null;
          let prevScroll = 0;
          try {
            scrollEl = navItem.closest('.chart-navigation');
            if (scrollEl) prevScroll = scrollEl.scrollTop;
          } catch {}
          sectionCollapseState[section.id] = !isCollapsed;
          saveSectionCollapseState(sectionCollapseState);
          rebuild();
          // Restore scroll position & refocus equivalent button after rebuild
          try {
            if (scrollEl) {
              requestAnimationFrame(() => {
                scrollEl.scrollTop = prevScroll;
                const replacement = scrollEl.querySelector(
                  `.section-nav-item[data-section-id="${section.id}"]`,
                );
                if (replacement) replacement.focus({ preventScroll: true });
              });
            }
          } catch {}
        },
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Same handling as click for keyboard activation
            let scrollEl = null;
            let prevScroll = 0;
            try {
              scrollEl = navItem.closest('.chart-navigation');
              if (scrollEl) prevScroll = scrollEl.scrollTop;
            } catch {}
            sectionCollapseState[section.id] = !isCollapsed;
            saveSectionCollapseState(sectionCollapseState);
            rebuild();
            try {
              if (scrollEl) {
                requestAnimationFrame(() => {
                  scrollEl.scrollTop = prevScroll;
                  const replacement = scrollEl.querySelector(
                    `.section-nav-item[data-section-id="${section.id}"]`,
                  );
                  if (replacement) replacement.focus({ preventScroll: true });
                });
              }
            } catch {}
          }
        },
        // Inline layout kept minimal; spacing now handled purely via CSS to avoid conflicts
        style:
          'display:flex; align-items:center; width:100%; background:none; border:none; text-align:left; cursor:pointer;',
        title: 'Toggle section',
      },
      [
        el(
          'span',
          {
            class: 'nav-label',
            // font-size now controlled in CSS (sidebar.css) for consistent scaling
            style: `flex:1; font-weight:${isActive ? '600' : '500'}; text-align:left; margin:0;`,
          },
          section.label,
        ),
        // Removed dirty-indicator circle per updated design
        el(
          'span',
          {
            class: 'twisty-right',
            style:
              'width:14px; display:inline-block; color:var(--text-secondary); margin-left:auto; text-align:right;',
          },
          isCollapsed ? '▶' : '▼',
        ),
      ],
    );

    // Hover effects handled in CSS

    return navItem;
  };

  // Create subsection table of contents dynamically; derive from DOM if active else fallback
  const createSubsectionTOC = (section, isCollapsed) => {
    const subs = getSubsectionsForSection(section.id, activeSection);
    return el(
      'div',
      { class: 'subsection-toc' },
      subs.map((sub) => {
        const sectionData = config.caseData?.[section.id];
        // Resolve data by ID using mapping if available
        const resolver = subsectionDataResolvers[sub.id];
        let subsectionData = resolver ? resolver(sectionData) : (sectionData?.[sub.id] ?? null);
        const subsectionStatus = getSubsectionStatus(subsectionData, sub.id, sectionData);

        const row = el(
          'div',
          {
            class: 'subsection-item',
            style: `display:flex; align-items:center; padding:4px 8px; font-size:12px; cursor:pointer; transition:all 0.2s ease; border-radius:4px;`,
            role: 'button',
            tabIndex: 0,
            onClick: () => {
              if (section.id !== activeSection) {
                // Stage target subsection ID in a temporary callback to run after section mount
                try {
                  window.__pendingAnchorScrollId = sub.id;
                  window.__scrollToPendingSubsection = () => {
                    requestAnimationFrame(() => {
                      const elTarget = document.getElementById(sub.id);
                      if (!elTarget || elTarget.offsetParent === null) return;
                      const cs = getComputedStyle(document.documentElement);
                      const topbarH = parseInt(
                        (cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(),
                        10,
                      );
                      const dividerH = parseInt(
                        (cs.getPropertyValue('--section-divider-h') || '').replace('px', '').trim(),
                        10,
                      );
                      const tb = isNaN(topbarH) ? 72 : topbarH;
                      const sd = isNaN(dividerH) ? 0 : dividerH;
                      const sticky = document.getElementById('patient-sticky-header');
                      const sh = sticky && sticky.offsetParent !== null ? sticky.offsetHeight : 0;
                      const rect = elTarget.getBoundingClientRect();
                      const targetY = Math.max(0, window.scrollY + rect.top - (tb + sh + sd));
                      window.scrollTo({ top: targetY, behavior: 'smooth' });
                      try {
                        if (window.__pendingAnchorScrollId === sub.id)
                          window.__pendingAnchorScrollId = '';
                      } catch {}
                    });
                  };
                } catch {}
                onSectionChange(section.id);
              } else {
                // Same section: immediate scroll without leaving stale pending id
                try {
                  if (window.__pendingAnchorScrollId === sub.id)
                    window.__pendingAnchorScrollId = '';
                } catch {}
                requestAnimationFrame(() => {
                  const elTarget = document.getElementById(sub.id);
                  if (!elTarget || elTarget.offsetParent === null) return;
                  const cs = getComputedStyle(document.documentElement);
                  const topbarH = parseInt(
                    (cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(),
                    10,
                  );
                  const dividerH = parseInt(
                    (cs.getPropertyValue('--section-divider-h') || '').replace('px', '').trim(),
                    10,
                  );
                  const tb = isNaN(topbarH) ? 72 : topbarH;
                  const sd = isNaN(dividerH) ? 0 : dividerH;
                  const sticky = document.getElementById('patient-sticky-header');
                  const sh = sticky && sticky.offsetParent !== null ? sticky.offsetHeight : 0;
                  const rect = elTarget.getBoundingClientRect();
                  const targetY = Math.max(0, window.scrollY + rect.top - (tb + sh + sd));
                  window.scrollTo({ top: targetY, behavior: 'smooth' });
                });
              }
            },
            onKeyDown: (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const click = row && typeof row.click === 'function' ? row.click.bind(row) : null;
                if (click) click();
              }
            },
          },
          [createSubsectionIndicator(subsectionStatus), el('span', {}, sub.label)],
        );

        // No sidebar toggles; toggles live in subsection banners now

        return row;
      }),
    );
  };

  // Allow student to rename blank notes: prefer draft.noteTitle when present
  const computedCaseInfo = { ...caseInfo };
  try {
    const isStudent = !isFacultyMode;
    const isBlank =
      typeof (caseData?.id || '') === 'string' ? String(caseData.id).startsWith('blank') : false;
    const draft = window && window.currentDraft ? window.currentDraft : null;
    if (isStudent && isBlank && draft) {
      if (draft.noteTitle && draft.noteTitle.trim()) {
        computedCaseInfo.title = draft.noteTitle.trim();
      }
    }
  } catch {}

  // Create the sidebar navigation
  // Modules available on the case object (draft-safe)
  const currentModules = Array.isArray((config.caseData || {}).modules)
    ? config.caseData.modules
    : [];

  // Standalone CASE FILE header (full-width in sidebar)
  // Inline styles enforce visual in case of stylesheet load/cascade issues.
  const caseFileHeader = el(
    'h4',
    {
      class: 'case-file-header',
      style:
        'background:#00883A;display:flex;align-items:center;justify-content:center;margin:0;padding:0;height:56px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;font-size:clamp(0.95rem,2.7vw,1.125rem);color:#fff;border:0;border-bottom:2px solid #fff;box-sizing:border-box;',
    },
    [
      el(
        'span',
        {
          class: 'case-file-badge',
          role: 'button',
          tabIndex: 0,
          'aria-label': 'Case File',
          'aria-expanded': String(!caseFileCollapsed),
          'aria-controls': 'artifact-block',
          title: 'Toggle Case File',
        },
        'Case File',
      ),
    ],
  );

  const sidebar = el(
    'div',
    {
      class: 'chart-navigation',
      role: 'complementary',
      'aria-label': 'Chart navigation',
      tabindex: '-1',
    },
    [
      // CASE FILE header row aligned with patient header
      caseFileHeader,

      // Navigation panel (white card stack)
      el(
        'div',
        {
          class: 'sidebar-nav-panel',
          role: 'navigation',
          'aria-label': 'Chart sections',
        },
        [
          // Case info card removed per design; patient info now lives in sticky header above content.
          // Case File (formerly Background Information/Artifacts): list and controls
          (() => {
            const container = el('div', {
              id: 'artifact-block',
              class: 'artifact-block grouped-artifacts',
            });
            // Lazy-mount artifacts panel via standard panel contract
            (async () => {
              try {
                const [{ mountPanel }, { idleImport }] = await Promise.all([
                  import('../../core/mount-panel.js'),
                  import('../../core/prefetch.js'),
                ]);
                const currentModules = Array.isArray((config.caseInfo || {}).modules)
                  ? config.caseInfo.modules
                  : [];
                mountPanel(container, () => import('./artifacts-panel.js'), {
                  modules: currentModules,
                  isFacultyMode: !!config.isFacultyMode,
                  onViewArtifact: (m) =>
                    openViewArtifactModal(m, {
                      isFacultyMode: !!config.isFacultyMode,
                      onEdit: (updated) => {
                        const next = (currentModules || []).map((x) =>
                          x.id === updated.id ? { ...x, ...updated } : x,
                        );
                        const payload = { ...(config.caseInfo || {}), modules: next };
                        config.onCaseInfoUpdate?.(payload);
                      },
                      onRemove: (id) => {
                        const next = (currentModules || []).filter((x) => x.id !== id);
                        const payload = { ...(config.caseInfo || {}), modules: next };
                        config.onCaseInfoUpdate?.(payload);
                      },
                    }),
                  onAddClicked: () =>
                    openAddArtifactModal((mod) => {
                      const current = config.caseInfo?.modules || [];
                      const next = [...current, mod];
                      const payload = { ...(config.caseInfo || {}), modules: next };
                      config.onCaseInfoUpdate?.(payload);
                      // Force page reload to refresh the UI and show the new artifact
                      setTimeout(() => {
                        window.location.reload();
                      }, 300);
                    }),
                });
                // Warm the artifact panel code on idle
                idleImport(() => import('./artifacts-panel.js'));
              } catch (e) {
                console.warn('Failed to render artifacts panel:', e);
              }
            })();
            return container;
          })(),
          // Extra padding before section trackers
          el('div', { style: 'height: 20px;' }),
          // My Note header (toggleable)
          (() => {
            const noteHeader = el(
              'h4',
              {
                class: 'current-encounter-header',
                role: 'button',
                tabIndex: 0,
                'aria-label': 'My Note',
                'aria-expanded': 'true',
                title: 'Toggle My Note sections',
              },
              'My Note',
            );
            // Aggregate status to drive underline color
            try {
              const statuses = sections.map((s) => getProgressStatus(s.id, config.caseData).status);
              const hasComplete = statuses.includes('complete');
              const hasEmpty = statuses.includes('empty');
              const hasPartial = statuses.includes('partial');
              let agg = 'empty';
              if (hasPartial || (hasComplete && hasEmpty)) agg = 'partial';
              else if (hasComplete && !hasPartial && !hasEmpty) agg = 'complete';
              noteHeader.setAttribute('data-status', agg);
            } catch {}
            // Toggle handler finds the adjacent note-sections wrapper
            const toggle = () => {
              try {
                const container = noteHeader.nextElementSibling;
                if (!container || !container.classList.contains('note-sections')) return;
                const isCollapsed = container.classList.contains('is-collapsed');
                noteHeader.setAttribute('aria-expanded', String(isCollapsed));
                if (!isCollapsed) {
                  // collapse
                  const h = container.scrollHeight;
                  container.style.maxHeight = h + 'px';
                  container.style.opacity = '1';
                  container.style.transform = 'translateY(0)';
                  void container.offsetHeight;
                  container.classList.add('is-collapsed');
                  container.style.maxHeight = '0px';
                  container.style.opacity = '0';
                  container.style.transform = 'translateY(-6px)';
                } else {
                  // expand
                  container.classList.remove('is-collapsed');
                  container.style.maxHeight = container.scrollHeight + 'px';
                  container.style.opacity = '1';
                  container.style.transform = 'translateY(0)';
                  const done = () => {
                    try {
                      container.style.maxHeight = 'none';
                      container.removeEventListener('transitionend', done);
                    } catch {}
                  };
                  container.addEventListener('transitionend', done);
                }
              } catch {}
            };
            noteHeader.addEventListener('click', toggle);
            noteHeader.addEventListener('keydown', (e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle();
              }
            });
            return noteHeader;
          })(),
          // Section cards + subsections (collapsible)
          (() => {
            const sectionsContainer = el('div', { class: 'sections-container' });
            const rebuild = () => {
              sectionsContainer.replaceChildren(
                ...sections.map((section) => {
                  // Default collapsed unless active, with persisted override
                  const hasState = Object.prototype.hasOwnProperty.call(
                    sectionCollapseState,
                    section.id,
                  );
                  // For 'plan' section: remove auto open/close behavior (user-controlled only)
                  // Other sections still default to collapsed when not active.
                  let collapsed;
                  if (section.id === 'plan') {
                    collapsed = hasState ? !!sectionCollapseState[section.id] : true; // start collapsed unless user expands
                  } else {
                    collapsed = hasState
                      ? !!sectionCollapseState[section.id]
                      : section.id !== activeSection;
                  }
                  const isActive = section.id === activeSection;
                  // Capture immutable initial snapshot once for dirty comparison
                  if (!window.__initialCaseSnapshot && config.caseData) {
                    try {
                      window.__initialCaseSnapshot = JSON.parse(JSON.stringify(config.caseData));
                    } catch {}
                  }
                  const card = el(
                    'div',
                    { class: `section-card ${collapsed ? 'collapsed' : ''}` },
                    [
                      createSectionNav(section, collapsed, rebuild),
                      createSubsectionTOC(section, collapsed),
                    ],
                  );
                  // Add status class for border styling (empty | partial | complete)
                  try {
                    const prog = getProgressStatus(section.id, config.caseData);
                    card.classList.add(`section-status-${prog.status}`);
                  } catch {}
                  if (isActive) card.classList.add('active');
                  // Mark collapsed state on inner TOC for CSS animation
                  if (collapsed) {
                    const toc = card.querySelector('.subsection-toc');
                    if (toc) toc.setAttribute('data-collapsed', 'true');
                  }
                  return card;
                }),
              );
              // After rebuild, if a deferred scroll callback exists (after section change), run it once
              if (typeof window.__scrollToPendingSubsection === 'function') {
                const fn = window.__scrollToPendingSubsection;
                window.__scrollToPendingSubsection = null;
                try {
                  fn();
                } catch {}
              }
            };
            rebuild();
            // Wrap in a collapsible container controlled by My Note header
            const wrapper = el('div', {
              class: 'note-sections',
              style: 'max-height:none; opacity:1; transform:translateY(0);',
            });
            wrapper.appendChild(sectionsContainer);
            return wrapper;
          })(),
          // Footer actions: Sign & Export (Word) — lazy-loaded panel
          (() => {
            const mountNode = el('div', { class: 'nav-panel nav-sign-export' });
            // Lazy mount using standard panel contract
            setTimeout(() => {
              import('../../core/mount-panel.js').then(({ mountPanel }) => {
                try {
                  mountPanel(mountNode, () => import('./sign-export-panel.js'), {
                    caseData: config.caseData || {},
                  });
                } catch (e) {
                  console.warn('Failed to mount sign-export panel:', e);
                }
              });
            }, 0);

            // Schedule idle prefetch to warm the panel code for subsequent navigations
            try {
              import('../../core/prefetch.js').then(({ idleImport }) => {
                idleImport(() => import('./sign-export-panel.js'));
              });
            } catch {}

            return mountNode;
          })(),
        ],
      ),
    ],
  );

  // Attach toggle behavior for the CASE FILE header now that the artifact block exists
  try {
    const badge = caseFileHeader.querySelector('.case-file-badge');
    const artifactBlock = sidebar.querySelector('#artifact-block');
    const applyInitial = () => {
      if (!artifactBlock || !badge) return;
      if (caseFileCollapsed) {
        artifactBlock.classList.add('is-collapsed');
        artifactBlock.style.maxHeight = '0px';
        artifactBlock.style.opacity = '0';
        artifactBlock.style.transform = 'translateY(-6px)';
        badge.setAttribute('aria-expanded', 'false');
      } else {
        artifactBlock.classList.remove('is-collapsed');
        artifactBlock.style.maxHeight = 'none';
        artifactBlock.style.opacity = '1';
        artifactBlock.style.transform = 'translateY(0)';
        badge.setAttribute('aria-expanded', 'true');
      }
    };
    applyInitial();

    const toggleCaseFile = () => {
      if (!artifactBlock || !badge) return;
      const isCollapsed = artifactBlock.classList.contains('is-collapsed');
      badge.setAttribute('aria-expanded', String(isCollapsed));
      if (!isCollapsed) {
        // collapse
        const h = artifactBlock.scrollHeight;
        artifactBlock.style.maxHeight = h + 'px';
        artifactBlock.style.opacity = '1';
        artifactBlock.style.transform = 'translateY(0)';
        void artifactBlock.offsetHeight; // reflow
        artifactBlock.classList.add('is-collapsed');
        artifactBlock.style.maxHeight = '0px';
        artifactBlock.style.opacity = '0';
        artifactBlock.style.transform = 'translateY(-6px)';
        caseFileCollapsed = true;
        saveCaseFileCollapsed(true);
      } else {
        // expand
        artifactBlock.classList.remove('is-collapsed');
        artifactBlock.style.maxHeight = artifactBlock.scrollHeight + 'px';
        artifactBlock.style.opacity = '1';
        artifactBlock.style.transform = 'translateY(0)';
        const done = () => {
          try {
            artifactBlock.style.maxHeight = 'none';
            artifactBlock.removeEventListener('transitionend', done);
          } catch {}
        };
        artifactBlock.addEventListener('transitionend', done);
        caseFileCollapsed = false;
        saveCaseFileCollapsed(false);
      }
    };
    if (badge) {
      badge.addEventListener('click', toggleCaseFile);
      badge.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleCaseFile();
        }
      });
    }
  } catch {}

  // Ensure content starts full width on small screens (nav closed)
  setTimeout(() => {
    /* layout offsets handled by drawer CSS */
  }, 100);

  // Removed experimental auto-scroll activation (was forcing view jump). Consider reintroducing with IntersectionObserver later.

  // Expose a reusable toggle for header hamburger and FAB
  window.toggleMobileNav = function toggleMobileNav() {
    try {
      const isOpen = sidebar.classList.contains('mobile-open');
      const nowOpen = !isOpen;
      sidebar.classList.toggle('mobile-open', nowOpen);
      document.body.classList.toggle('mobile-drawer-open', nowOpen);
      return nowOpen;
    } catch {
      return false;
    }
  };

  // Enhance current section content with banner toggles + visibility rules
  setTimeout(() => {
    applySubsectionVisibilityControls({
      activeSection,
      isFacultyMode,
      caseData,
      onEditorSettingsChange,
    });
  }, 0);

  return sidebar;
}

/**
 * Updates the save status in the sidebar
 * @param {HTMLElement} sidebar - The sidebar element
 * @param {string} status - Save status: 'saving', 'saved', 'error'
 */
export function updateSaveStatus(sidebar, status) {
  const statusDot = sidebar.querySelector('.status-dot');
  const statusText = sidebar.querySelector('.autosave-status span:last-child');

  if (statusDot && statusText) {
    switch (status) {
      case 'saving':
        statusDot.style.background = 'var(--warn)';
        statusText.textContent = 'Saving...';
        break;
      case 'saved':
        statusDot.style.background = 'var(--success)';
        statusText.textContent = 'Saved';
        break;
      case 'error':
        statusDot.style.background = 'var(--danger)';
        statusText.textContent = 'Save failed';
        break;
    }
  }
}

/**
 * Refreshes the chart navigation with updated progress data
 * @param {HTMLElement} sidebar - The sidebar element to refresh
 * @param {Object} config - Updated navigation configuration
 */
// refreshChartNavigation moved to progress.js

/**
 * Creates anchors for subsections to enable smooth scrolling
 * @param {string} sectionId - Section identifier
 * @param {Array} subsections - Array of subsection objects
 * @returns {Array} Array of anchor elements
 */
export function createSectionAnchors(sectionId, subsections) {
  return subsections.map((sub) =>
    el('div', {
      id: sub.id,
      class: 'section-anchor',
      // scroll-margin-top handled via CSS to account for patient header height dynamically
    }),
  );
}
