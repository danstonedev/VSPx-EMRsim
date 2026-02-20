// EditorSetupManager.js - Handles editor setup and initialization

import { el } from '../ui/utils.js';
import { onRouteChange } from '../core/url.js';
import { createChartNavigationForEditor } from './CaseEditorUtils.js';

/**
 * Creates editor setup manager for complex initialization logic
 * @param {Object} options - Setup options
 * @returns {Object} Setup result with components and functions
 */
export async function setupEditor(options) {
  const {
    c,
    draft,
    isFacultyMode,
    initialSectionParam,
    isValidSection,
    switchTo,
    save,
    refreshChartProgress,
  } = options;

  // Initialize active section
  let active = isValidSection(initialSectionParam) ? initialSectionParam : 'subjective';

  // Create chart navigation sidebar first
  const chartNav = await createChartNavigationForEditor({
    c,
    draft,
    isFacultyMode,
    switchTo,
    save,
    refreshChartProgress,
  });

  // Setup global window properties
  setupGlobalProperties(draft, save);

  return {
    active,
    chartNav,
  };
}

/**
 * Sets up global window properties for draft and save functions
 * @param {Object} draft - Draft object
 * @param {Function} save - Save function
 */
function setupGlobalProperties(draft, save) {
  // Make draft available globally for goal linking
  window.currentDraft = draft;
  window.saveDraft = save;
}

/**
 * Creates main container with sidebar and content
 * @param {HTMLElement} patientHeader - Patient header element
 * @returns {Object} Container elements
 */
export function createMainContainer(patientHeader) {
  const contentRoot = el('div', { id: 'section', class: 'section-content' });
  const mainContainer = el('div', { class: 'main-content-with-sidebar' }, [
    patientHeader,
    contentRoot,
  ]);

  return {
    contentRoot,
    mainContainer,
  };
}

/**
 * Sets up resize observer for header height tracking
 * @param {HTMLElement} patientHeader - Patient header element
 * @param {AbortController} ac - Abort controller for cleanup
 * @returns {ResizeObserver|null} Resize observer instance
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
      // Fallback: recompute on resize in environments without ResizeObserver
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
    /* ResizeObserver may not be available */
    return null;
  }
}

/**
 * Sets up route change handling
 * @param {Function} switchTo - Section switch function
 * @param {Function} isValidSection - Section validation function
 * @param {string} currentActive - Current active section for comparison
 * @returns {Function|null} Route cleanup function
 */
export function setupRouteHandling(switchTo, isValidSection, currentActive) {
  try {
    const offRoute = onRouteChange((e) => {
      const { params } = e.detail || {};
      const next = params && params.section ? String(params.section).toLowerCase() : '';
      if (next && next !== currentActive && isValidSection(next)) {
        switchTo(next);
      }
    });
    return offRoute;
  } catch (err) {
    console.warn('[EditorSetupManager] route change listener setup failed:', err);
    return null;
  }
}
