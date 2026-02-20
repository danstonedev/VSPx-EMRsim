/**
 * Case Editor utility functions to reduce complexity
 * Extracted from case_editor.js to improve maintainability
 */

/**
 * Get title from various case properties
 * @param {Object} c - Case object
 * @returns {string} Case title
 */
function getCaseTitle(c) {
  return c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case';
}

/**
 * Get setting from various case properties
 * @param {Object} c - Case object
 * @returns {string} Case setting
 */
function getCaseSetting(c) {
  return c.setting || (c.meta && c.meta.setting) || 'Outpatient';
}

/**
 * Get field value with fallback chain
 * @param {Object} c - Case object
 * @param {Array} keys - Keys to try in order
 * @param {string} defaultValue - Default value if none found
 * @returns {string} Field value
 */
function getFieldWithFallback(c, keys, defaultValue = '') {
  for (const key of keys) {
    const value = key.includes('.') ? getNestedValue(c, key) : c[key];
    if (value) return value;
  }
  return defaultValue;
}

/**
 * Get nested object value by dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path
 * @returns {any} Value or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get patient demographics from various case properties
 * @param {Object} c - Case object
 * @returns {Object} Demographics object
 */
function getPatientDemographics(c) {
  return {
    age: getFieldWithFallback(c, ['patientAge', 'age', 'snapshot.age']),
    sex: getFieldWithFallback(c, ['patientGender', 'sex', 'snapshot.sex'], 'N/A'),
    dob: getFieldWithFallback(c, ['patientDOB', 'dob', 'snapshot.dob']),
  };
}

/**
 * Extract consolidated case information from multiple sources
 * @param {Object} c - Case object
 * @returns {Object} Consolidated case info
 */
export function getCaseInfo(c) {
  const demographics = getPatientDemographics(c);

  return {
    title: getCaseTitle(c),
    setting: getCaseSetting(c),
    age: demographics.age,
    sex: demographics.sex,
    acuity: c.acuity || (c.meta && c.meta.acuity) || 'unspecified',
    dob: demographics.dob,
    modules: Array.isArray(c.modules) ? c.modules : [],
  };
}

/**
 * Extract patient display name from various case properties
 * @param {Object} c - Case object
 * @returns {string} Patient display name
 */
export function getPatientDisplayName(c) {
  const sources = [
    c.patientName,
    c.name,
    c.meta?.patientName,
    c.meta?.title,
    c.snapshot?.patientName,
    c.snapshot?.name,
    c.caseTitle,
    c.title,
  ];

  return sources.find((name) => name && typeof name === 'string' && name.trim()) || 'Untitled Case';
}

/**
 * Get consolidated case data for chart navigation
 * @param {Object} c - Case object
 * @param {Object} draft - Draft object
 * @returns {Object} Case data for navigation
 */
export function getCaseDataForNavigation(c, draft) {
  return {
    ...c,
    ...draft,
    modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
    editorSettings: c.editorSettings || draft.editorSettings,
  };
}

/**
 * Update case object with new case info
 * @param {Object} c - Case object to update
 * @param {Object} updatedInfo - New case information
 * @param {Object} draft - Draft object to update (optional)
 */
export function updateCaseObject(c, updatedInfo, draft = null) {
  // Update primary fields
  c.caseTitle = updatedInfo.title;
  c.title = updatedInfo.title;
  c.setting = updatedInfo.setting;
  c.patientAge = updatedInfo.age;
  c.patientGender = updatedInfo.sex;
  c.acuity = updatedInfo.acuity;
  c.patientDOB = updatedInfo.dob;
  c.modules = Array.isArray(updatedInfo.modules) ? updatedInfo.modules : c.modules || [];

  // Keep canonical containers in sync
  c.meta = c.meta || {};
  c.meta.title = updatedInfo.title;
  c.meta.setting = updatedInfo.setting;
  c.meta.acuity = updatedInfo.acuity;

  c.snapshot = c.snapshot || {};
  c.snapshot.age = updatedInfo.age;
  c.snapshot.sex = (updatedInfo.sex || '').toLowerCase() || 'unspecified';
  c.snapshot.dob = updatedInfo.dob;

  // Update draft if provided
  if (draft && Array.isArray(updatedInfo.modules)) {
    draft.modules = updatedInfo.modules;
  }
}

/**
 * Parse query parameters for case editor
 * @param {URLSearchParams} qs - Query parameters
 * @returns {Object} Parsed parameters
 */
export function parseEditorQueryParams(qs) {
  const caseId = qs.get('case');
  const encounter = qs.get('encounter') || 'eval';
  const isKeyMode = qs.get('key') === 'true';
  const initialSectionParam = (qs.get('section') || '').toLowerCase();
  const initialAnchorParam = qs.get('anchor') || '';
  const spParamRaw = qs.get('sp');
  const initialScrollPercent = spParamRaw !== null ? parseFloat(spParamRaw) : NaN;

  return {
    caseId,
    encounter,
    isKeyMode,
    initialSectionParam,
    initialAnchorParam,
    initialScrollPercent,
  };
}

/**
 * Calculate header offset height for scrolling
 * @returns {number} Offset in pixels
 */
export function calculateHeaderOffset() {
  const cs = getComputedStyle(document.documentElement);
  const topbarH = parseInt((cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(), 10);
  const tb = isNaN(topbarH) ? 72 : topbarH;
  const sticky = document.getElementById('patient-sticky-header');
  const sh = sticky && sticky.offsetParent !== null ? sticky.offsetHeight : 0;

  // Include the in-content sticky section divider height so anchors land fully below it
  const dividerH = parseInt(
    (cs.getPropertyValue('--section-divider-h') || '').replace('px', '').trim(),
    10,
  );
  const sd = isNaN(dividerH) ? 0 : dividerH;
  return tb + sh + sd;
}

/**
 * Get patient DOB from case data
 * @param {Object} c - Case object
 * @returns {string} DOB value
 */
export function getPatientDOB(c) {
  return c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '';
}

/**
 * Get patient sex from case data
 * @param {Object} c - Case object
 * @returns {string} Sex value
 */
export function getPatientSex(c) {
  return c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || '';
}

/**
 * Format date of birth to MM-DD-YYYY format
 * @param {string} dob - Date of birth string
 * @returns {string} Formatted date or original string
 */
export function formatDOB(dob) {
  if (!dob) return '';

  // Parse YYYY-MM-DD as a local date
  const parseLocalDateYMD = (str) => {
    if (!str || typeof str !== 'string') return null;
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, year, month, day] = match;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  };

  const d = parseLocalDateYMD(dob);
  if (d) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  return dob;
}

/**
 * Check if user can edit case (faculty mode or blank case)
 * @param {boolean} isFacultyMode - Whether in faculty mode
 * @param {string|number} caseId - Case identifier
 * @returns {boolean} Whether editing is allowed
 */
export function canEditCase(isFacultyMode, caseId) {
  let canEdit = !!isFacultyMode;
  // Allow students to edit if working on a blank note
  try {
    const idStr = String(caseId || '');
    if (!canEdit && idStr.startsWith('blank')) canEdit = true;
  } catch (err) {
    console.warn('[CaseEditorUtils] canEditCase check failed:', err);
  }
  return canEdit;
}

/**
 * Get target anchor ID for section scrolling
 * @param {string} sectionId - Section identifier
 * @returns {string} Target anchor ID
 */
function getTargetAnchorId(sectionId) {
  let pendingAnchorId = '';
  try {
    if (window.__pendingAnchorScrollId) {
      pendingAnchorId = String(window.__pendingAnchorScrollId);
      window.__pendingAnchorScrollId = '';
    }
  } catch {
    /* pending anchor property may not exist */
  }

  const preferredAnchorBySection = {
    subjective: 'hpi',
    objective: 'regional-assessment',
    assessment: 'primary-impairments',
    plan: 'goal-setting',
    billing: 'diagnosis-codes',
  };

  return pendingAnchorId || preferredAnchorBySection[sectionId];
}

/**
 * Handle accessibility focus and announcements
 * @param {string} sectionId - Section identifier
 * @param {Element} header - Header element
 * @param {Element} root - Root element
 */
function handleSectionAccessibility(sectionId, header, root) {
  try {
    const focusTarget = header || root;
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  } catch {
    /* element may not exist */
  }

  try {
    const announcer = document.getElementById('route-announcer');
    if (announcer) announcer.textContent = `Moved to ${sectionId} section`;
  } catch {
    /* element may not exist */
  }
}

/**
 * Handle section switching scroll logic
 * @param {string} sectionId - Section to scroll to
 * @param {Function} getSectionHeader - Get section header element
 * @param {Function} getSectionRoot - Get section root element
 * @param {Function} scrollToAnchorExact - Scroll to anchor function
 * @param {Function} getHeaderOffsetPx - Get header offset function
 */
export function handleSectionScroll(
  sectionId,
  getSectionHeader,
  getSectionRoot,
  scrollToAnchorExact,
  getHeaderOffsetPx,
) {
  const header = getSectionHeader(sectionId);
  const root = getSectionRoot(sectionId) || header;
  if (!root) return;

  const targetId = getTargetAnchorId(sectionId);
  let success = false;

  // Try to scroll to target anchor
  if (targetId) {
    success = scrollToAnchorExact(targetId, 'smooth');
  }

  // Fallback to first visible anchor
  if (!success) {
    const firstAnchor = root.querySelector('.section-anchor');
    if (firstAnchor) {
      success = scrollToAnchorExact(firstAnchor.id, 'smooth');
    }
  }

  // Final fallback to section top
  if (!success) {
    const offset = getHeaderOffsetPx();
    const rect = root.getBoundingClientRect();
    const y = Math.max(0, window.scrollY + rect.top - offset);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // Handle accessibility
  handleSectionAccessibility(sectionId, header, root);

  return { header, root };
}

/**
 * Handle case info updates and keep UI/data in sync
 * @param {Object} c - Case object
 * @param {Object} draft - Draft object
 * @param {Object} updatedInfo - Updated case information
 * @param {Function} save - Save function
 * @param {Function} updatePatientHeader - Update patient header function
 * @param {Function} renderPatientHeaderActions - Render patient header actions function
 */
export function handleCaseInfoUpdate(
  c,
  draft,
  updatedInfo,
  save,
  updatePatientHeader,
  renderPatientHeaderActions,
) {
  try {
    c.caseTitle = updatedInfo.title;
    c.title = updatedInfo.title;
    c.setting = updatedInfo.setting;
    c.patientAge = updatedInfo.age;
    c.patientGender = updatedInfo.sex;
    c.acuity = updatedInfo.acuity;
    c.patientDOB = updatedInfo.dob;
    if (Array.isArray(updatedInfo.modules)) {
      c.modules = updatedInfo.modules;
      draft.modules = updatedInfo.modules;
    }
    // Keep canonical containers in sync
    c.meta = c.meta || {};
    c.meta.title = updatedInfo.title;
    c.meta.setting = updatedInfo.setting;
    c.meta.acuity = updatedInfo.acuity;
    c.snapshot = c.snapshot || {};
    c.snapshot.age = updatedInfo.age;
    c.snapshot.sex = (updatedInfo.sex || '').toLowerCase() || 'unspecified';
    c.snapshot.dob = updatedInfo.dob;
    updatePatientHeader();
    renderPatientHeaderActions();
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  } catch (e) {
    console.warn('handleCaseInfoUpdate error:', e);
  }
}

/**
 * Get case info snapshot for editing
 * @param {Object} c - Case object
 * @returns {Object} Case info snapshot
 */
export function getCaseInfoSnapshot(c) {
  return getCaseInfo(c);
}

/**
 * Prepares case data for chart navigation
 * @param {Object} c - Case object
 * @param {Object} draft - Draft object
 * @returns {Object} Prepared case data
 */
export function prepareCaseDataForNavigation(c, draft) {
  return {
    ...c,
    ...draft,
    // Prefer draft.modules when present; otherwise use case modules
    modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
    editorSettings: c.editorSettings || draft.editorSettings,
  };
}

/**
 * Helper function to get a field with fallbacks
 * @param {Object} c - Case object
 * @param {Array} fieldPaths - Array of field paths to try
 * @param {string} defaultValue - Default value if none found
 * @returns {string} The resolved value
 */
function getFieldWithMultipleFallbacks(c, fieldPaths, defaultValue) {
  for (const fieldPath of fieldPaths) {
    const value = getNestedValue(c, fieldPath);
    if (value) return value;
  }
  return defaultValue;
}

/**
 * Prepares case info for chart navigation
 * @param {Object} c - Case object
 * @returns {Object} Prepared case info
 */
export function prepareCaseInfoForNavigation(c) {
  return {
    title: getFieldWithMultipleFallbacks(c, ['caseTitle', 'title', 'meta.title'], 'Untitled Case'),
    setting: getFieldWithMultipleFallbacks(c, ['setting', 'meta.setting'], 'Outpatient'),
    age: getFieldWithMultipleFallbacks(c, ['patientAge', 'age', 'snapshot.age'], ''),
    sex: getFieldWithMultipleFallbacks(c, ['patientGender', 'sex', 'snapshot.sex'], 'N/A'),
    acuity: getFieldWithMultipleFallbacks(c, ['acuity', 'meta.acuity'], 'unspecified'),
    dob: getFieldWithMultipleFallbacks(c, ['patientDOB', 'dob', 'snapshot.dob'], ''),
    modules: Array.isArray(c.modules) ? c.modules : [],
  };
}

/**
 * Creates chart navigation with case info integration
 * @param {Object} params - Navigation creation parameters
 * @returns {Promise<HTMLElement>} Chart navigation element
 */
export async function createChartNavigationForEditor({
  c,
  draft,
  isFacultyMode,
  switchTo,
  save,
  refreshChartProgress,
}) {
  // Temporary: still sourced from monolith via api (will point to submodule after split)
  const { getCreateChartNavigation } = await import('../features/navigation/api.js');
  const createChartNavigation = await getCreateChartNavigation();

  return createChartNavigation({
    activeSection: 'subjective',
    onSectionChange: (sectionId) => switchTo(sectionId),
    isFacultyMode,
    caseData: prepareCaseDataForNavigation(c, draft),
    caseInfo: prepareCaseInfoForNavigation(c),
    onCaseInfoUpdate: (updatedInfo) => {
      handleCaseInfoUpdate(c, draft, updatedInfo, save, refreshChartProgress);
    },
    onEditorSettingsChange: (nextSettings) => {
      draft.editorSettings = nextSettings;
      c.editorSettings = nextSettings;
      save();
      refreshChartProgress();
    },
  });
}
