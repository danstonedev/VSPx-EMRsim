// Modern Case Editor with Conservative Imports
import { route, storage } from '../core/index.js';
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

function applySubjectiveProfileSyncToCase(c, draft, incoming) {
  const nextName = String(incoming.patientName ?? incoming.title ?? '').trim();
  const nextDob = String(incoming.patientBirthday ?? incoming.dob ?? '');
  const nextAge = String(incoming.patientAge ?? incoming.age ?? '');
  const nextSex =
    String(incoming.patientGender ?? incoming.sex ?? '').toLowerCase() || 'unspecified';

  draft.subjective = draft.subjective || {};
  syncSubjectiveNameToCase(c, draft, nextName);
  syncSubjectiveDemographicsToCase(c, draft, { nextDob, nextAge, nextSex });
}

function syncSubjectiveNameToCase(c, draft, nextName) {
  if (nextName === '') return;
  c.caseTitle = nextName;
  c.title = nextName;
  c.patientName = nextName;
  c.meta = c.meta || {};
  c.meta.title = nextName;
  c.meta.patientName = nextName;
  c.snapshot = c.snapshot || {};
  c.snapshot.name = nextName;
  draft.noteTitle = nextName;
  draft.subjective.patientName = nextName;
}

function syncSubjectiveDemographicsToCase(c, draft, { nextDob, nextAge, nextSex }) {
  c.patientDOB = nextDob;
  c.patientAge = nextAge;
  c.patientGender = nextSex;
  c.snapshot = c.snapshot || {};
  c.snapshot.dob = nextDob;
  c.snapshot.age = nextAge;
  c.snapshot.sex = nextSex;
  draft.subjective.patientBirthday = nextDob;
  draft.subjective.patientAge = nextAge;
  draft.subjective.patientGender = nextSex;
}

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

  // For student-created patients (blank-*), seed draft.subjective from patient meta
  if (caseId && caseId.startsWith('blank')) {
    try {
      const raw = storage.getItem('patient_' + caseId);
      if (raw) {
        const meta = JSON.parse(raw);
        draft.subjective = draft.subjective || {};
        const sub = draft.subjective;
        // Only fill fields not already set in the draft
        if (!sub.patientName && meta.name) sub.patientName = meta.name;
        if (!sub.patientBirthday && meta.dob) {
          // Convert MM/DD/YYYY → YYYY-MM-DD for editor
          const parts = meta.dob.split('/');
          if (parts.length === 3)
            sub.patientBirthday = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        if (!sub.patientAge && meta.dob) {
          const parts = meta.dob.split('/');
          if (parts.length === 3) {
            const d = new Date(+parts[2], +parts[0] - 1, +parts[1]);
            const now = new Date();
            let age = now.getFullYear() - d.getFullYear();
            const md = now.getMonth() - d.getMonth();
            if (md < 0 || (md === 0 && now.getDate() < d.getDate())) age--;
            if (age >= 0 && age < 150) sub.patientAge = String(age);
          }
        }
        if (!sub.patientGender && meta.sex) sub.patientGender = meta.sex;
        if (!sub.patientGenderIdentityPronouns && meta.genderIdentityPronouns)
          sub.patientGenderIdentityPronouns = meta.genderIdentityPronouns;
        if (!sub.patientPreferredLanguage && meta.preferredLanguage)
          sub.patientPreferredLanguage = meta.preferredLanguage;
        if (!sub.patientInterpreterNeeded && meta.interpreterNeeded)
          sub.patientInterpreterNeeded = meta.interpreterNeeded;
      }
    } catch (_) {
      /* ignore parse errors */
    }
  }

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

  const handleProfileSync = (event) => {
    const incoming = event?.detail || {};
    if (!incoming || incoming.source !== 'subjective') return;

    applySubjectiveProfileSyncToCase(c, draft, incoming);

    // Write demographics back to patient metadata for student-created cases
    if (caseId && caseId.startsWith('blank')) {
      try {
        const raw = storage.getItem('patient_' + caseId);
        const meta = raw ? JSON.parse(raw) : { created: Date.now() };
        const name = String(incoming.patientName ?? incoming.title ?? '').trim();
        if (name) meta.name = name;
        const birthday = incoming.patientBirthday ?? incoming.dob ?? '';
        if (birthday) {
          // Editor stores YYYY-MM-DD, patient meta stores MM/DD/YYYY
          const parts = String(birthday).split('-');
          meta.dob = parts.length === 3 ? `${parts[1]}/${parts[2]}/${parts[0]}` : birthday;
        }
        const sex = String(incoming.patientGender ?? incoming.sex ?? '').toLowerCase();
        if (sex) meta.sex = sex;
        if (incoming.patientGenderIdentityPronouns != null)
          meta.genderIdentityPronouns = incoming.patientGenderIdentityPronouns;
        if (incoming.patientPreferredLanguage != null)
          meta.preferredLanguage = incoming.patientPreferredLanguage;
        if (incoming.patientInterpreterNeeded != null)
          meta.interpreterNeeded = incoming.patientInterpreterNeeded;
        storage.setItem('patient_' + caseId, JSON.stringify(meta));
      } catch (_) {
        /* ignore */
      }
    }

    updatePatientHeader();
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  };
  window.addEventListener('pt-emr-profile-sync', handleProfileSync, { signal: ac.signal });

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
  // Branch: use simple renderer for simple-soap notes
  let sectionRoots, sectionHeaders;
  if (draft.noteType === 'simple-soap') {
    const { renderAllSimpleSections } = await import('./SimpleSectionRenderer.js');
    ({ sectionRoots, sectionHeaders } = await renderAllSimpleSections(contentRoot, draft, save));
  } else {
    ({ sectionRoots, sectionHeaders } = await renderAllSections(contentRoot, draft, save));
  }

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

  // Initial nav state + optional deep link handling using modular configuration
  const onCaseInfoUpdate = createCaseInfoUpdateHandler({
    c,
    draft,
    save,
    caseId,
    storageAdapter: storage,
    onHeaderUpdate: updatePatientHeader,
  });
  const onEditorSettingsChange = createEditorSettingsHandler({ draft, c, save });

  const renderPatientHeaderActions = createPatientHeaderActionsRenderer(
    isFacultyMode,
    caseId,
    c,
    onCaseInfoUpdate,
  );
  renderPatientHeaderActions();
  // Set up IntersectionObserver for active section tracking
  setupActiveSectionObserverWrapper();

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
