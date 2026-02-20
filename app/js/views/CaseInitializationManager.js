// CaseInitializationManager.js - Handles complex case initialization and configuration

/**
 * Creates case data configuration object
 * @param {Object} c - Case object
 * @param {Object} draft - Draft object
 * @returns {Object} Case data configuration
 */
function createCaseDataConfig(c, draft) {
  return {
    ...c,
    ...draft,
    modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
    editorSettings: c.editorSettings || draft.editorSettings,
  };
}

/**
 * Gets case title from various sources
 * @param {Object} c - Case object
 * @returns {string} Case title
 */
function getCaseTitle(c) {
  return c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case';
}

/**
 * Gets case setting from various sources
 * @param {Object} c - Case object
 * @returns {string} Case setting
 */
function getCaseSetting(c) {
  return c.setting || (c.meta && c.meta.setting) || 'Outpatient';
}

/**
 * Gets patient age from various sources
 * @param {Object} c - Case object
 * @returns {string} Patient age
 */
function getPatientAge(c) {
  return c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '';
}

/**
 * Gets patient sex from various sources
 * @param {Object} c - Case object
 * @returns {string} Patient sex
 */
function getPatientSex(c) {
  return c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A';
}

/**
 * Gets case acuity from various sources
 * @param {Object} c - Case object
 * @returns {string} Case acuity
 */
function getCaseAcuity(c) {
  return c.acuity || (c.meta && c.meta.acuity) || 'unspecified';
}

/**
 * Gets patient DOB from various sources
 * @param {Object} c - Case object
 * @returns {string} Patient DOB
 */
function getPatientDOB(c) {
  return c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '';
}

/**
 * Creates case info configuration object
 * @param {Object} c - Case object
 * @returns {Object} Case info configuration
 */
function createCaseInfoConfig(c) {
  return {
    title: getCaseTitle(c),
    setting: getCaseSetting(c),
    age: getPatientAge(c),
    sex: getPatientSex(c),
    acuity: getCaseAcuity(c),
    dob: getPatientDOB(c),
    modules: Array.isArray(c.modules) ? c.modules : [],
  };
}

/**
 * Creates initial chart navigation configuration
 * @param {Object} options - Configuration options
 * @returns {Object} Chart navigation configuration
 */
export function createInitialChartNavConfig(options) {
  const { active, switchTo, isFacultyMode, c, draft, onCaseInfoUpdate, onEditorSettingsChange } =
    options;

  return {
    activeSection: active,
    onSectionChange: (sectionId) => switchTo(sectionId),
    isFacultyMode: isFacultyMode,
    caseData: createCaseDataConfig(c, draft),
    caseInfo: createCaseInfoConfig(c),
    onCaseInfoUpdate,
    onEditorSettingsChange,
  };
}

/**
 * Creates case info update handler
 * @param {Object} options - Handler options
 * @returns {Function} Case info update handler
 */
export function createCaseInfoUpdateHandler(options) {
  const { c, draft, save } = options;

  return function handleCaseInfoUpdate(updatedInfo) {
    // Update primary case properties
    c.caseTitle = updatedInfo.title;
    c.title = updatedInfo.title;
    c.setting = updatedInfo.setting;
    c.patientAge = updatedInfo.age;
    c.patientGender = updatedInfo.sex;
    c.acuity = updatedInfo.acuity;
    c.patientDOB = updatedInfo.dob;

    // Update modules if provided
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

    // Save changes and refresh progress
    save();
    if (window.refreshChartProgress) {
      window.refreshChartProgress();
    }
  };
}

/**
 * Creates editor settings change handler
 * @param {Object} options - Handler options
 * @returns {Function} Editor settings change handler
 */
export function createEditorSettingsHandler(options) {
  const { draft, c, save } = options;

  return function handleEditorSettingsChange(nextSettings) {
    draft.editorSettings = nextSettings;
    c.editorSettings = nextSettings;
    save();
    if (window.refreshChartProgress) {
      window.refreshChartProgress();
    }
  };
}

/**
 * Creates save wrapper with status updates and progress refresh
 * @param {Object} options - Save wrapper options
 * @returns {Function} Enhanced save function
 */
export function createSaveWrapper(options) {
  const { originalSave, chartNav, updateSaveStatus } = options;

  return async function save(...args) {
    // Update sidebar save status only (sticky header removed)
    updateSaveStatus(chartNav, 'saving');

    // Announce saving to screen readers
    try {
      const announcer = document.getElementById('route-announcer');
      if (announcer) announcer.textContent = 'Saving…';
    } catch {
      /* element may not exist */
    }

    try {
      await originalSave(...args);
      updateSaveStatus(chartNav, 'saved');
      try {
        const announcer = document.getElementById('route-announcer');
        if (announcer) announcer.textContent = 'All changes saved';
      } catch {
        /* element may not exist */
      }
      if (window.refreshChartProgress) window.refreshChartProgress();
    } catch (error) {
      updateSaveStatus(chartNav, 'error');
      try {
        const announcer = document.getElementById('route-announcer');
        if (announcer) announcer.textContent = 'Save failed';
      } catch {
        /* element may not exist */
      }
      console.error('Save failed:', error);
    }
  };
}

/**
 * Creates debounced save function
 * @param {Function} save - Save function to debounce
 * @param {Function} refreshChartProgress - Chart progress refresh function
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced save function
 */
export function createDebouncedSave(save, refreshChartProgress, delay = 500) {
  let saveTimeout;

  return function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      save();
      refreshChartProgress();
    }, delay);
  };
}
