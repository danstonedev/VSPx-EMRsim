// Navigation and scroll management utilities for Case Editor
// Lazy navigation API to avoid static bundling of ChartNavigation
async function _getRefreshChartNavigation() {
  const { getRefreshChartNavigation } = await import('../features/navigation/api.js');
  return getRefreshChartNavigation();
}
import { getNearestVisibleAnchorId, scrollToAnchorExact } from './ScrollUtils.js';
import { getCaseInfoSnapshot, handleCaseInfoUpdate } from './CaseEditorUtils.js';

/**
 * Creates an intersection observer for tracking active sections
 * @param {Function} getHeaderOffsetPx - Function to get header offset
 * @param {string} active - Current active section
 * @param {Function} setActive - Function to set active section
 * @param {HTMLElement} chartNav - Chart navigation element
 * @param {Function} switchTo - Function to switch sections
 * @param {boolean} isFacultyMode - Faculty mode flag
 * @param {Object} c - Case object
 * @param {Object} draft - Draft object
 * @param {Function} save - Save function
 * @returns {IntersectionObserver} Intersection observer instance
 */
export function createActiveSectionObserver({
  getHeaderOffsetPx,
  active,
  setActive,
  chartNav,
  switchTo,
  isFacultyMode,
  c,
  draft,
  save,
  programmaticScrollBlockUntil,
  isProgrammaticScroll,
}) {
  const offset = Math.max(0, getHeaderOffsetPx());

  function setActiveSectionFromObserver(id) {
    if (!id || id === active) return;
    if (!['subjective', 'objective', 'assessment', 'plan', 'billing'].includes(id)) return;
    setActive(id);
    _getRefreshChartNavigation().then(
      (refreshChartNavigation) =>
        refreshChartNavigation &&
        refreshChartNavigation(chartNav, {
          activeSection: id,
          onSectionChange: (sectionId) => switchTo(sectionId),
          isFacultyMode,
          caseData: {
            ...c,
            ...draft,
            modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
            editorSettings: c.editorSettings || draft.editorSettings,
          },
          caseInfo: getCaseInfoSnapshot(c),
          onCaseInfoUpdate: (updatedInfo) =>
            handleCaseInfoUpdate(c, draft, updatedInfo, save, () => {
              if (window.refreshChartProgress) window.refreshChartProgress();
            }),
          onEditorSettingsChange: (nextSettings) => {
            draft.editorSettings = nextSettings;
            c.editorSettings = nextSettings;
            save();
            if (window.refreshChartProgress) window.refreshChartProgress();
          },
        }),
    );
  }

  return new IntersectionObserver(
    (entries) => {
      if (Date.now() < programmaticScrollBlockUntil || isProgrammaticScroll) return;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target.id || '').replace('section-', '');
        setActiveSectionFromObserver(id);
      }
    },
    { root: null, rootMargin: `-${offset + 8}px 0px -60% 0px`, threshold: 0.01 },
  );
}

/**
 * Sets up intersection observer for section tracking
 * @param {Object} params - Setup parameters
 * @returns {IntersectionObserver} Observer instance
 */
export function setupActiveSectionObserver(params) {
  const { activeObserver, sectionHeaders } = params;

  // Clean up existing observer
  try {
    if (activeObserver) activeObserver.disconnect();
  } catch {
    /* observer may already be disconnected */
  }

  const observer = createActiveSectionObserver(params);

  // Observe all section headers
  for (const header of Object.values(sectionHeaders)) {
    if (header && header.id) observer.observe(header);
  }

  return observer;
}

/**
 * Performs initial scroll if needed based on parameters
 * @param {Object} params - Scroll parameters
 * @returns {Object} Updated scroll state
 */
export function performInitialScrollIfNeeded({
  currentSectionId,
  active,
  initialActiveSection,
  needsInitialPercentScroll,
  needsInitialAnchorScroll,
  initialScrollPercent,
  scrollToPercentWithinActive,
  initialAnchorParam,
  afterNextLayout,
}) {
  // If the user navigated away from the initially requested section before
  // the initial scroll fired, cancel the initial scroll behavior entirely.
  if (currentSectionId !== initialActiveSection) {
    const result = {
      needsInitialPercentScroll: false,
      needsInitialAnchorScroll: false,
    };

    // Also check for any transient pending anchor requests and clear them if no longer relevant
    try {
      if (window.__pendingAnchorScrollId && currentSectionId !== active) {
        window.__pendingAnchorScrollId = '';
      }
    } catch {
      /* pending anchor property may not exist */
    }

    return result;
  }

  if (currentSectionId !== active) return { needsInitialPercentScroll, needsInitialAnchorScroll };

  // If a pending anchor scroll was requested by the sidebar while changing sections, honor it first
  try {
    if (window.__pendingAnchorScrollId) {
      const id = String(window.__pendingAnchorScrollId);
      window.__pendingAnchorScrollId = '';
      // Attempt immediate scroll; retry lightly after next layout
      let ok = scrollToAnchorExact(id, 'smooth');
      afterNextLayout(() => {
        if (!ok) ok = scrollToAnchorExact(id, 'smooth');
      });
      setTimeout(() => {
        if (!ok) scrollToAnchorExact(id, 'smooth');
      }, 120);
      // Do not proceed with percent/anchor initial behavior in this pass
      return {
        needsInitialPercentScroll: false,
        needsInitialAnchorScroll: false,
      };
    }
  } catch {
    /* pending anchor scroll may not be available */
  }

  if (needsInitialPercentScroll && Number.isFinite(initialScrollPercent)) {
    let okP = scrollToPercentWithinActive(initialScrollPercent, active);
    afterNextLayout(() => {
      if (!okP) okP = scrollToPercentWithinActive(initialScrollPercent, active);
    });
    setTimeout(() => {
      if (!okP) okP = scrollToPercentWithinActive(initialScrollPercent, active);
      if (!okP) {
        // fallback to anchor or nearest visible anchor
        if (initialAnchorParam) {
          let ok = scrollToAnchorExact(initialAnchorParam);
          afterNextLayout(() => {
            if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
          });
          setTimeout(() => {
            if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
            if (!ok) {
              const fallbackId = getNearestVisibleAnchorId();
              if (fallbackId) scrollToAnchorExact(fallbackId);
            }
          }, 120);
        } else {
          const fallbackId = getNearestVisibleAnchorId();
          if (fallbackId) scrollToAnchorExact(fallbackId);
        }
      }
    }, 120);

    return {
      needsInitialPercentScroll: false,
      needsInitialAnchorScroll: false,
    };
  }

  if (needsInitialAnchorScroll && initialAnchorParam) {
    let ok = scrollToAnchorExact(initialAnchorParam);
    afterNextLayout(() => {
      if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
    });
    setTimeout(() => {
      if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
      if (!ok) {
        const fallbackId = getNearestVisibleAnchorId();
        if (fallbackId) scrollToAnchorExact(fallbackId);
      }
    }, 120);

    return {
      needsInitialPercentScroll,
      needsInitialAnchorScroll: false,
    };
  }

  return { needsInitialPercentScroll, needsInitialAnchorScroll };
}

/**
 * Creates a scroll function for scrolling within the active section
 * @param {Function} getSectionRoot - Function to get section root
 * @param {Function} getHeaderOffsetPx - Function to get header offset
 * @param {Object} sectionRoots - Section roots object
 * @returns {Function} Scroll function
 */
export function createScrollToPercentWithinActive(getSectionRoot, getHeaderOffsetPx, sectionRoots) {
  return function scrollToPercentWithinActive(pct, activeSection) {
    const root = getSectionRoot(sectionRoots, activeSection);
    if (!root) return false;
    const offset = getHeaderOffsetPx();
    const rect = root.getBoundingClientRect();
    const sectionTopAbs = window.scrollY + rect.top;
    const viewportH = window.innerHeight;
    const scrollable = Math.max(0, root.scrollHeight - (viewportH - offset));
    const clamped = Math.max(0, Math.min(1, pct ?? 0));
    const targetY = Math.max(0, sectionTopAbs - offset + scrollable * clamped);
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return true;
  };
}
