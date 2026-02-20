// SectionSwitcher.js - Modular section switching and navigation utilities

import { setQueryParams } from '../core/url.js';
// Lazy navigation API (avoids static import of large ChartNavigation module)
async function _getRefreshChartNavigation() {
  const { getRefreshChartNavigation } = await import('../features/navigation/api.js');
  return getRefreshChartNavigation();
}

/**
 * Creates a section switcher function with proper state management
 * @param {Object} options - Configuration options
 * @returns {Function} Section switcher function
 */
export function createSectionSwitcher(options) {
  const {
    sections,
    active,
    setActive,
    setNeedsInitialPercentScroll,
    setNeedsInitialAnchorScroll,
    setProgrammaticScrollBlockUntil,
    setIsProgrammaticScroll,
    chartNav,
    isFacultyMode,
    c,
    draft,
    getCaseDataForNavigation,
    getCaseInfo,
    updateCaseObject,
    updatePatientHeader,
    debouncedSave,
    save,
    handleSectionScroll,
    getSectionHeader,
    getSectionRoot,
    scrollToAnchorExact,
    getHeaderOffsetPx,
    performInitialScrollWrapper,
    ac, // AbortController for event cleanup
  } = options;

  const isValidSection = (s) => sections.includes(s);

  return function switchTo(s) {
    if (!isValidSection(s)) return;

    const changingSection = s !== active;
    setActive(s);

    // User selection overrides any pending initial scroll behavior
    setNeedsInitialPercentScroll(false);
    setNeedsInitialAnchorScroll(false);

    // Prevent scroll-driven active recalculation for the duration of the smooth scroll
    setProgrammaticScrollBlockUntil(Date.now() + 700); // ~0.7s window
    setIsProgrammaticScroll(true);

    // Sync section to URL (replace by default to avoid history spam)
    try {
      setQueryParams({ section: s });
    } catch (err) {
      console.warn('[SectionSwitcher] setQueryParams failed:', err);
    }

    if (changingSection) {
      // Update chart navigation only if the logical active section changed.
      _getRefreshChartNavigation().then(
        (refreshChartNavigation) =>
          refreshChartNavigation &&
          refreshChartNavigation(chartNav, {
            activeSection: s,
            onSectionChange: (sectionId) => switchTo(sectionId),
            isFacultyMode: isFacultyMode,
            caseData: getCaseDataForNavigation(c, draft),
            caseInfo: getCaseInfo(c),
            onCaseInfoUpdate: (updatedInfo) => {
              updateCaseObject(c, updatedInfo, draft);
              updatePatientHeader();
              debouncedSave();
            },
            onEditorSettingsChange: (nextSettings) => {
              draft.editorSettings = nextSettings;
              c.editorSettings = nextSettings;
              save();
              if (window.refreshChartProgress) window.refreshChartProgress();
            },
          }),
      );
    }

    // Scroll logic (single attempt + minimal fallback) kept intentionally lean
    handleSectionScroll(
      s,
      getSectionHeader,
      getSectionRoot,
      scrollToAnchorExact,
      getHeaderOffsetPx,
    );

    // Clear programmatic flag on scroll end or timeout
    const clearProg = () => {
      setIsProgrammaticScroll(false);
      window.removeEventListener('scrollend', clearProg);
    };
    try {
      window.addEventListener('scrollend', clearProg, { once: true, signal: ac.signal });
    } catch {
      // scrollend not supported; fallback timeout
      setTimeout(() => setIsProgrammaticScroll(false), 800);
    }

    performInitialScrollWrapper(s);
  };
}

/**
 * Creates scroll event cleanup handlers
 * @param {AbortController} ac - Abort controller for cleanup
 * @param {Function} setIsProgrammaticScroll - Function to set programmatic scroll flag
 * @returns {Function} Function to setup scroll end listeners
 */
export function createScrollEndHandler(ac, setIsProgrammaticScroll) {
  return function setupScrollEndListener() {
    // Clear programmatic flag on scroll end or timeout
    const clearProg = () => {
      setIsProgrammaticScroll(false);
      window.removeEventListener('scrollend', clearProg);
    };
    try {
      window.addEventListener('scrollend', clearProg, { once: true, signal: ac.signal });
    } catch {
      // scrollend not supported; fallback timeout
      setTimeout(() => setIsProgrammaticScroll(false), 800);
    }
  };
}
