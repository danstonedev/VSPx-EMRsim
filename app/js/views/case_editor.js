// Modern Case Editor with Conservative Imports
import { route } from '../core/index.js';
import { onRouteChange } from '../core/url.js';
import { el } from '../ui/utils.js';
// SOAP sections now loaded dynamically for better code splitting
import {
  initializeCase,
  initializeDraft,
  createLoadingIndicator,
} from '../features/case-management/CaseInitialization.js';
import {
  getCaseInfo,
  getCaseDataForNavigation,
  updateCaseObject,
  parseEditorQueryParams,
  calculateHeaderOffset,
  handleSectionScroll,
  createChartNavigationForEditor,
} from './CaseEditorUtils.js';
import {
  getHeaderOffsetPx,
  getNearestVisibleAnchorId,
  scrollToAnchorExact,
  afterNextLayout,
  getSectionScrollPercent,
  scrollToPercentExact,
} from './ScrollUtils.js';
import {
  createPatientHeader,
  setupThemeObserver,
  createPatientHeaderUpdater,
  createPatientHeaderActionsRenderer,
} from './CaseEditorRenderer.js';
import { renderAllSections, getSectionRoot, getSectionHeader } from './SectionRenderer.js';
import {
  setupActiveSectionObserver,
  performInitialScrollIfNeeded,
  createScrollToPercentWithinActive,
} from './NavigationManager.js';
// Navigation helpers will be loaded lazily to reduce initial bundle size
let updateSaveStatus; // assigned via ensureChartNavFns()
let refreshChartNavigation; // assigned via ensureChartNavFns()
async function ensureChartNavFns() {
  if (!updateSaveStatus || !refreshChartNavigation) {
    const [saveMod, refreshMod] = await Promise.all([
      import('../features/navigation/saveStatus.js'),
      import('../features/navigation/progress.js'),
    ]);
    updateSaveStatus = saveMod.updateSaveStatus;
    refreshChartNavigation = refreshMod.refreshChartNavigation;
  }
  return { updateSaveStatus, refreshChartNavigation };
}
import { createSectionSwitcher } from './SectionSwitcher.js';
import {
  createInitialChartNavConfig,
  createCaseInfoUpdateHandler,
  createEditorSettingsHandler,
  createSaveWrapper,
} from './CaseInitializationManager.js';
import {
  validateCaseId,
  setupScrollHelpers,
  handleCaseInitializationError,
} from './CaseEditorValidation.js';
import {
  createEditorConfiguration,
  createScrollStateManager,
  createChartRefreshFunction,
} from './EditorConfigManager.js';
// Sticky green header removed per design update

// Modern modular SOAP section components

route('#/student/editor', async (app, qs) => {
  return renderCaseEditor(app, qs, false); // false = student mode
});

route('#/instructor/editor', async (app, qs) => {
  return renderCaseEditor(app, qs, true); // true = faculty mode
});

async function renderCaseEditor(app, qs, isFacultyMode) {
  // AbortController for all event listeners in this view; router will call returned cleanup
  const ac = new AbortController();
  let offRoute = null;
  let activeObserver = null;
  let headerRO = null;

  // Parse query parameters using utility function
  const params = parseEditorQueryParams(qs);
  const {
    caseId,
    encounter,
    isKeyMode,
    initialSectionParam,
    initialAnchorParam,
    initialScrollPercent,
  } = params;

  // Helper: compute fixed header offset using utility function
  const getHeaderOffsetPxLocal = () => calculateHeaderOffset();

  // Setup scroll helpers for debugging using modular utility
  setupScrollHelpers({
    getHeaderOffsetPx: getHeaderOffsetPxLocal,
    getNearestVisibleAnchorId,
    scrollToAnchorExact,
    getSectionScrollPercent,
    scrollToPercentExact,
  });

  // Validate case ID and handle early returns using modular validation
  if (!validateCaseId(caseId, app)) {
    return; // Early return if validation failed
  }

  app.replaceChildren();
  const loadingIndicator = createLoadingIndicator();
  app.append(loadingIndicator);

  // Initialize case using modular function
  const caseResult = await initializeCase(caseId, isFacultyMode, isKeyMode);

  // Handle case initialization errors using modular handler
  if (handleCaseInitializationError(caseResult, app)) {
    return; // Early return if error was handled
  }

  const caseWrapper = caseResult;
  const c = caseWrapper.caseObj;

  app.replaceChildren(); // Clear loading indicator

  // For faculty mode with new cases, we'll show the integrated editor
  // No separate metadata form - everything is integrated

  // Configuration
  // const encReq = {}; // Encounter requirements configuration (reserved for future use)

  // Initialize draft using modular function - pass faculty mode for proper data handling
  const draftManager = initializeDraft(caseId, encounter, isFacultyMode, c, isKeyMode);
  let { draft, save: originalSave, hasUnsavedChanges } = draftManager;

  // --- Unsaved Changes Protection ---
  const onBeforeUnload = (e) => {
    if (hasUnsavedChanges && hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes.';
    }
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  ac.signal.addEventListener('abort', () => {
    window.removeEventListener('beforeunload', onBeforeUnload);
  });

  // Intercept internal navigation
  const onLinkClick = (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (
      !href ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    )
      return;
    if (link.hasAttribute('download') || link.target === '_blank') return;

    if (hasUnsavedChanges && hasUnsavedChanges()) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };
  document.body.addEventListener('click', onLinkClick, { capture: true });
  ac.signal.addEventListener('abort', () => {
    document.body.removeEventListener('click', onLinkClick, { capture: true });
  });
  // ----------------------------------

  // Create editor configuration using utility
  const editorConfig = createEditorConfiguration({
    initialSectionParam,
    qs,
    initialScrollPercent,
    initialAnchorParam,
  });

  const {
    sections,
    isValidSection,
    active: configActive,
    initialActiveSection,
    needsInitialPercentScroll: configNeedsInitialPercentScroll,
    needsInitialAnchorScroll: configNeedsInitialAnchorScroll,
  } = editorConfig;

  let active = configActive;
  let needsInitialPercentScroll = configNeedsInitialPercentScroll;
  let needsInitialAnchorScroll = configNeedsInitialAnchorScroll;

  // Create scroll state manager using utility
  const scrollStateManager = createScrollStateManager();
  const { getProgrammaticScrollBlockUntil, getIsProgrammaticScroll } = scrollStateManager;

  let programmaticScrollBlockUntil = getProgrammaticScrollBlockUntil();
  let isProgrammaticScroll = getIsProgrammaticScroll();

  // Sticky top bar removed; preview can be triggered from elsewhere if desired

  // Function to refresh chart navigation progress - placeholder until nav loaded
  let refreshChartProgress = () => {};

  // Create section switcher using modular utility - now we have all dependencies
  const switchTo = createSectionSwitcher({
    sections,
    active,
    setActive: (newActive) => {
      active = newActive;
    },
    setNeedsInitialPercentScroll: (value) => {
      needsInitialPercentScroll = value;
    },
    setNeedsInitialAnchorScroll: (value) => {
      needsInitialAnchorScroll = value;
    },
    setProgrammaticScrollBlockUntil: (value) => {
      programmaticScrollBlockUntil = value;
    },
    setIsProgrammaticScroll: (value) => {
      isProgrammaticScroll = value;
    },
    chartNav: null, // Will be set after chart nav creation
    isFacultyMode,
    c,
    draft,
    getCaseDataForNavigation,
    getCaseInfo,
    updateCaseObject,
    updatePatientHeader: () => {}, // Placeholder
    debouncedSave: () => {}, // Placeholder
    save: originalSave,
    handleSectionScroll,
    getSectionHeader,
    getSectionRoot,
    scrollToAnchorExact,
    getHeaderOffsetPx,
    performInitialScrollWrapper: () => {}, // Placeholder
    ac,
  });

  // Create chart navigation sidebar now that switchTo exists
  // Ensure navigation helpers available before building chart navigation
  await ensureChartNavFns();
  const chartNav = await createChartNavigationForEditor({
    c,
    draft,
    isFacultyMode,
    switchTo,
    save: originalSave,
    refreshChartProgress,
  });

  // Update the section switcher with the actual chartNav
  switchTo.chartNav = chartNav;

  // Create patient header using modular utility BEFORE it's used
  const headerElements = createPatientHeader(c);
  const { patientHeader, avatarEl, updatePatientAvatar } = headerElements;
  const updatePatientHeader = createPatientHeaderUpdater(c, caseWrapper, headerElements);

  // Wrap save function to include progress refresh and status updates
  const save = createSaveWrapper({
    originalSave,
    chartNav,
    // Defer updateSaveStatus retrieval until first invocation
    updateSaveStatus: async (...args) => {
      await ensureChartNavFns();
      updateSaveStatus?.(...args);
    },
  });

  // Update placeholders with actual functions
  switchTo.updatePatientHeader = updatePatientHeader;

  // Make draft available globally for goal linking
  window.currentDraft = draft;
  window.saveDraft = save;

  // Make chart refresh available globally for components
  window.refreshChartProgress = null; // Will be set after chart creation

  // Sticky top bar removed; preview can be triggered from elsewhere if desired

  // React to external URL changes (e.g., user edits hash or navigates)
  try {
    offRoute = onRouteChange((e) => {
      const { params } = e.detail || {};
      const next = params && params.section ? String(params.section).toLowerCase() : '';
      if (next && next !== active && isValidSection(next)) {
        switchTo(next);
      }
    });
  } catch (err) {
    console.warn('[CaseEditor] route change listener setup failed:', err);
  }

  // Create the actual refresh function to replace the placeholder
  refreshChartProgress = createChartRefreshFunction({
    chartNav,
    active,
    switchTo,
    isFacultyMode,
    getCaseDataForNavigation,
    getCaseInfo,
    c,
    draft,
    updateCaseObject,
    save: originalSave,
  });

  // Make chart refresh available globally for components
  window.refreshChartProgress = refreshChartProgress;

  // Setup theme observer for avatar updates
  const themeObserver = setupThemeObserver(avatarEl, updatePatientAvatar);

  // Setup resize observer for header height tracking
  try {
    if ('ResizeObserver' in window) {
      headerRO = new ResizeObserver(() => {
        const h = patientHeader.offsetHeight || 0;
        document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
      });
      headerRO.observe(patientHeader);
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
    }
  } catch {
    /* ResizeObserver may not be available */
  }

  // Create main content container with sidebar offset + header
  const contentRoot = el('div', { id: 'section', class: 'section-content' });
  const mainContainer = el('div', { class: 'main-content-with-sidebar' }, [
    patientHeader,
    contentRoot,
  ]);

  // Render all sections once to form a single scrolling page
  // Use modular section renderer (now loads SOAP sections dynamically)
  const { sectionRoots, sectionHeaders } = await renderAllSections(contentRoot, draft, save);

  // Create scroll utility function
  const scrollToPercentWithinActive = createScrollToPercentWithinActive(
    getSectionRoot,
    getHeaderOffsetPx,
    sectionRoots,
  );

  // Create wrapper for initial scroll handling that updates state variables
  const performInitialScrollWrapper = (currentSectionId) => {
    const result = performInitialScrollIfNeeded({
      currentSectionId,
      active,
      initialActiveSection,
      needsInitialPercentScroll,
      needsInitialAnchorScroll,
      initialScrollPercent,
      scrollToPercentWithinActive: (pct) => scrollToPercentWithinActive(pct, active),
      initialAnchorParam,
      afterNextLayout,
    });

    needsInitialPercentScroll = result.needsInitialPercentScroll;
    needsInitialAnchorScroll = result.needsInitialAnchorScroll;
  };

  // Create wrapper that maintains activeObserver state
  const setupActiveSectionObserverWrapper = () => {
    activeObserver = setupActiveSectionObserver({
      activeObserver,
      sectionHeaders,
      getHeaderOffsetPx,
      active,
      setActive: (newActive) => {
        active = newActive;
      },
      chartNav,
      switchTo,
      isFacultyMode,
      c,
      draft,
      save,
      programmaticScrollBlockUntil,
      isProgrammaticScroll,
    });
  };

  // Initialize the editor with sidebar navigation only
  app.append(chartNav, mainContainer);
  // Initialize header immediately so CSS var is ready before sections mount
  updatePatientHeader();
  const renderPatientHeaderActions = createPatientHeaderActionsRenderer(
    isFacultyMode,
    caseId,
    c,
    save,
  );
  renderPatientHeaderActions();
  // Set up IntersectionObserver for active section tracking
  setupActiveSectionObserverWrapper();
  // Initial nav state + optional deep link handling using modular configuration
  const onCaseInfoUpdate = createCaseInfoUpdateHandler({ c, draft, save });
  const onEditorSettingsChange = createEditorSettingsHandler({ draft, c, save });

  const initialConfig = createInitialChartNavConfig({
    active,
    switchTo,
    isFacultyMode,
    c,
    draft,
    onCaseInfoUpdate,
    onEditorSettingsChange,
  });

  // Lazy load nav helpers (already likely loaded, call defensively) before initial refresh
  await ensureChartNavFns();
  refreshChartNavigation(chartNav, initialConfig);
  // Perform initial anchor/percent scroll after content is laid out
  afterNextLayout(() => performInitialScrollWrapper(active));

  // Recreate observer on resize to keep rootMargin aligned with sticky header height
  window.addEventListener(
    'resize',
    () => {
      try {
        setupActiveSectionObserverWrapper();
      } catch {
        /* observer may not be available */
      }
    },
    { passive: true, signal: ac.signal },
  );

  // Return teardown so the router can clean this view on navigation
  return () => {
    offRoute?.();
    themeObserver?.disconnect?.();
    activeObserver?.disconnect?.();
    headerRO?.disconnect?.();
    ac.abort();
  };
}

/**
 * Creates an integrated case metadata panel for faculty editors
 * @param {Object} caseObj - Case object to edit
 * @param {Function} saveFunction - Function to save changes
 * @returns {HTMLElement} Metadata panel element
 */
// removed unused createCaseMetadataPanel
