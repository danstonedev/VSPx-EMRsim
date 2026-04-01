import { storage } from '../core/index.js';
import { navigate as urlNavigate } from '../core/url.js';
import { getCase, updateCase } from '../core/store.js';
import {
  getDraftTemplateId,
  listPilotProfessions,
  listPilotTemplatesForProfession,
} from '../core/noteCatalog.js';
import { el } from '../ui/utils.js';
import { createProgressTracker } from '../features/navigation/SidebarProgressTracker.js';
import { dieteticsDisciplineConfig } from '../features/navigation/dietetics-discipline-config.js';
import { ptDisciplineConfig } from '../features/navigation/pt-discipline-config.js';
import { createChartSidebar } from '../features/navigation/ChartSidebarOrchestrator.js';
import { getPatientDisplayName } from './CaseEditorUtils.js';
import { initializeDraft } from '../features/case-management/CaseInitialization.js';
import { getArtifactTypeLabel, openCaseFileViewer } from './dietetics/casefile_helpers.js';
import { createPilotNoteSession } from './dietetics/note_session_controller.js';
import { createPilotWorkspaceController } from './dietetics/note_workspace_adapters.js';
import { createPilotWorkspaceContent } from './dietetics/note_workspace_content.js';
import { createDieteticsPatientHeader } from './dietetics/patient_header.js';
import { createPilotWorkspaceSidebar } from './dietetics/note_workspace_sidebar.js';
import { ptSimpleSoapDisciplineConfig } from './dietetics/pt_note_workspace.js';
import {
  createDefaultDieteticsDraft,
  DIETETICS_DRAFT_PREFIX,
  DIETETICS_NCP_SECTIONS,
  DIETETICS_SECTION_RENDERERS,
  migrateDieteticsDraft,
} from './dietetics/dietetics_workspace.js';
import { renderPatientSummary } from '../features/navigation/panels/PatientSummaryPanel.js';
import { renderMyNotes } from '../features/navigation/panels/MyNotesPanel.js';
import { buildSignedNoteCaseFileEntry, upsertCaseFileEntry } from '../core/casefile-repository.js';

const PILOT_META_KEY = 'multidisciplinePilot';
const PT_WORKSPACE_STATE_PREFIX = 'pt_workspace_state_';
const PT_WORKSPACE_MODULES_PREFIX = 'pt_workspace_modules_';

function materialIcon(name) {
  return el('span', { class: 'material-symbols-outlined ncp-icon', 'aria-hidden': 'true' }, name);
}

function createWorkspaceBackButton({ onBack }) {
  return el(
    'button',
    {
      type: 'button',
      class: 'workspace-shell__back-btn',
      'aria-label': 'Back to workspace patient selection',
      title: 'Back to workspace',
      onclick: onBack,
    },
    [
      el(
        'span',
        {
          class: 'material-symbols-outlined workspace-shell__back-btn-icon',
          'aria-hidden': 'true',
        },
        'arrow_back',
      ),
    ],
  );
}

function createWorkspaceStagePlaceholder({ eyebrow, title, copy }) {
  return el('section', { class: 'workspace-shell__stage-placeholder' }, [
    eyebrow ? el('p', { class: 'workspace-shell__stage-eyebrow' }, eyebrow) : null,
    el('h2', { class: 'workspace-shell__stage-title' }, title),
    copy ? el('p', { class: 'workspace-shell__stage-copy' }, copy) : null,
  ]);
}

function applyWorkspaceCanvas() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return () => {};

  const previous = {
    maxWidth: appRoot.style.maxWidth,
    width: appRoot.style.width,
    margin: appRoot.style.margin,
    padding: appRoot.style.padding,
    background: appRoot.style.background,
  };

  appRoot.style.maxWidth = 'none';
  appRoot.style.width = '100%';
  appRoot.style.margin = '0';
  appRoot.style.padding = '0';
  appRoot.style.background = 'var(--editor-bg)';

  return () => {
    appRoot.style.maxWidth = previous.maxWidth;
    appRoot.style.width = previous.width;
    appRoot.style.margin = previous.margin;
    appRoot.style.padding = previous.padding;
    appRoot.style.background = previous.background;
  };
}

function normalizeStoredDob(rawDob = '') {
  const value = String(rawDob || '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return value;
}

function loadJsonFromStorage(key, fallback = null) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJsonToStorage(key, value, label = 'storage item') {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[PT Workspace] Failed to save ${label}:`, err);
  }
}

function buildSyntheticPtCaseObject(caseId, draft) {
  const patientMeta = loadJsonFromStorage(`patient_${caseId}`, null);
  const patientName =
    draft?.subjective?.patientName || patientMeta?.name || draft?.noteTitle || 'PT Patient';
  const dob = normalizeStoredDob(patientMeta?.dob || draft?.subjective?.patientBirthday || '');
  const sex = patientMeta?.sex || draft?.subjective?.patientGender || 'unspecified';

  return {
    title: patientName,
    caseTitle: patientName,
    patientName,
    patientDOB: dob,
    patientGender: sex,
    meta: {
      title: patientName,
      patientName,
      dob,
      sex,
      vspId: patientMeta?.vspId || draft?.subjective?.__vspId || '',
      preferredLanguage:
        patientMeta?.preferredLanguage || draft?.subjective?.patientPreferredLanguage || 'English',
      interpreterNeeded:
        patientMeta?.interpreterNeeded || draft?.subjective?.patientInterpreterNeeded || '',
      allergies: patientMeta?.allergies || '',
    },
    snapshot: {
      name: patientName,
      dob,
      sex,
    },
    encounters: { eval: {} },
    modules: [],
  };
}

function hydrateLocalWorkspaceFallbacks(caseObj, caseId) {
  const nextCaseObj = caseObj || {};
  nextCaseObj.meta = nextCaseObj.meta || {};

  const savedPilotState = loadJsonFromStorage(`${PT_WORKSPACE_STATE_PREFIX}${caseId}`, {});
  if (savedPilotState && typeof savedPilotState === 'object') {
    nextCaseObj.meta[PILOT_META_KEY] = {
      ...(nextCaseObj.meta[PILOT_META_KEY] || {}),
      ...savedPilotState,
    };
  }

  const savedModules = loadJsonFromStorage(`${PT_WORKSPACE_MODULES_PREFIX}${caseId}`, null);
  if (
    Array.isArray(savedModules) &&
    (!Array.isArray(nextCaseObj.modules) || !nextCaseObj.modules.length)
  ) {
    nextCaseObj.modules = savedModules;
  } else {
    nextCaseObj.modules = Array.isArray(nextCaseObj.modules) ? nextCaseObj.modules : [];
  }

  return nextCaseObj;
}

async function loadPtWorkspaceContext(caseId, encounter, isFacultyMode) {
  const caseWrapper = caseId ? await getCase(caseId).catch(() => null) : null;
  const storedCaseObj = caseWrapper?.caseObj || null;
  const draftManager = initializeDraft(caseId, encounter, isFacultyMode, storedCaseObj, false);
  const ptDraft = draftManager?.draft || null;

  const caseObj = storedCaseObj || buildSyntheticPtCaseObject(caseId, ptDraft);
  hydrateLocalWorkspaceFallbacks(caseObj, caseId);

  return {
    caseWrapper,
    caseObj,
    ptDraft,
  };
}

function loadStoredDieteticsDraft(caseId, caseObj) {
  const storedDraft = loadJsonFromStorage(`${DIETETICS_DRAFT_PREFIX}${caseId}`, null);
  return migrateDieteticsDraft(storedDraft || createDefaultDieteticsDraft(caseObj));
}

function saveStoredDieteticsDraft(caseId, draft) {
  saveJsonToStorage(`${DIETETICS_DRAFT_PREFIX}${caseId}`, draft, 'dietetics draft');
}

export async function renderPtWorkspaceV2(wrapper, query, isFacultyMode = false) {
  const caseId = query.get('case') || '';
  const encounter = query.get('encounter') || 'eval';
  const requestedProfession = query.get('profession') || '';
  const requestedTemplateId = query.get('template') || '';

  if (!caseId) {
    wrapper.replaceChildren(el('p', {}, 'No case specified.'));
    return;
  }

  document.body.classList.remove(
    'has-chart-rail',
    'chart-panel-open',
    'workspace-shell-header-global',
  );
  document.body.classList.remove('pt-workspace-shell-route');
  const releaseWorkspaceCanvas = applyWorkspaceCanvas();

  wrapper.replaceChildren(el('p', {}, 'Loading workspace...'));

  const { caseWrapper, caseObj, ptDraft } = await loadPtWorkspaceContext(
    caseId,
    encounter,
    isFacultyMode,
  );

  caseObj.meta = caseObj.meta || {};
  const meta = caseObj.meta;
  const patientName = getPatientDisplayName(caseObj);
  const currentPtTemplateId = getDraftTemplateId(ptDraft, encounter);
  let dietDraft = loadStoredDieteticsDraft(caseId, caseObj);

  const dietTracker = createProgressTracker(dieteticsDisciplineConfig);
  const ptTracker = createProgressTracker(ptDisciplineConfig);
  const ptSimpleTracker = createProgressTracker(ptSimpleSoapDisciplineConfig);

  function savePilotState(updates) {
    const next = {
      ...(caseObj.meta[PILOT_META_KEY] || {}),
      ...updates,
    };
    caseObj.meta[PILOT_META_KEY] = next;

    if (caseWrapper?.id) {
      updateCase(caseWrapper.id, caseObj).catch((err) => {
        console.warn('[PT Workspace] Failed to persist workspace state:', err);
      });
    } else {
      saveJsonToStorage(`${PT_WORKSPACE_STATE_PREFIX}${caseId}`, next, 'workspace state');
    }

    return next;
  }

  const noteSession = createPilotNoteSession({
    caseId,
    caseObj,
    patientName,
    dietDraft,
    isFacultyMode,
    requestedProfession,
    requestedTemplateId,
    defaultProfession: 'pt',
    defaultTemplateId: currentPtTemplateId,
    pilotMetaKey: PILOT_META_KEY,
    dietDraftPrefix: DIETETICS_DRAFT_PREFIX,
    ptDraftOwnerCaseId: caseId,
    resolvePtEncounterId: () => encounter || 'eval',
    savePilotState,
    saveDietDraft: (nextDraft) => saveStoredDieteticsDraft(caseId, nextDraft),
  });

  let updateSidebarStatus = () => {};
  let rerenderCurrentNoteWorkspace = () => {};
  let activeWorkspaceTab = 'current-note';

  function showSavedIndicator() {
    const indicator = wrapper.querySelector('.note-editor__save-indicator');
    if (indicator) {
      indicator.textContent = 'Saved';
      indicator.classList.add('saved');
      setTimeout(() => indicator.classList.remove('saved'), 1500);
    }
  }

  const workspaceController = createPilotWorkspaceController({
    noteSession,
    dietTracker,
    ptTracker,
    ptSimpleTracker,
    ncpSections: DIETETICS_NCP_SECTIONS,
    dieteticSectionRenderers: DIETETICS_SECTION_RENDERERS,
    onDieteticsDraftChange: handleDieteticsDraftChange,
    onPtDraftChange: handlePtDraftChange,
  });

  function handleDieteticsDraftChange(nextDraft) {
    dietDraft = noteSession.updateDietDraft(nextDraft);
    noteSession.handleDieteticsDraftChange(nextDraft, () => updateSidebarStatus());
    updateSidebarStatus();
    showSavedIndicator();
  }

  function handlePtDraftChange(templateId, nextDraft) {
    noteSession.handlePtDraftChange(templateId, nextDraft, () => updateSidebarStatus());
    updateSidebarStatus();
    showSavedIndicator();
  }

  noteSession.syncGlobals(() => updateSidebarStatus());

  function syncPatientHeaderHeight() {
    const h = patientHeader.offsetHeight || 0;
    document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
    return h;
  }

  function getCaseModules() {
    return Array.isArray(caseObj.modules) ? caseObj.modules : [];
  }

  function saveCaseModules(nextModules) {
    caseObj.modules = Array.isArray(nextModules) ? nextModules : [];
    if (caseWrapper?.id) {
      updateCase(caseWrapper.id, caseObj).catch((err) => {
        console.warn('[PT Workspace] Failed to persist case modules:', err);
      });
      return;
    }
    saveJsonToStorage(`${PT_WORKSPACE_MODULES_PREFIX}${caseId}`, caseObj.modules, 'case file');
  }

  function saveSignedNoteToCasefile(draftLike, rawContext = {}) {
    if (!draftLike?.meta?.signature) return null;

    const context = {
      caseId,
      professionId: noteSession.getSelectedProfession(),
      encounterId: noteSession.getSelectedTemplateId() === 'dietetics-ncp' ? 'nutrition' : '',
      templateId: noteSession.getSelectedTemplateId(),
      ...rawContext,
    };

    const sourceKey =
      rawContext.sourceKey ||
      (context.professionId === 'dietetics'
        ? `${DIETETICS_DRAFT_PREFIX}${context.caseId || caseId}`
        : `draft_${context.caseId || caseId}_${context.encounterId || encounter}`);

    const entry = buildSignedNoteCaseFileEntry({
      draft: draftLike,
      caseId: context.caseId || caseId,
      professionId: context.professionId,
      encounterId: context.encounterId,
      templateId: context.templateId,
      sourceKey,
    });

    const nextModules = upsertCaseFileEntry(getCaseModules(), entry);
    saveCaseModules(nextModules);
    return entry;
  }

  const backToWorkspaceButton = createWorkspaceBackButton({
    onBack: () => {
      urlNavigate('/workspace', {
        role: isFacultyMode ? 'faculty' : 'student',
        profession: noteSession.getSelectedProfession(),
        template: noteSession.getSelectedTemplateId(),
      });
    },
  });

  const patientHeaderController = createDieteticsPatientHeader({
    meta,
    patientName,
    materialIcon,
    backButton: backToWorkspaceButton,
    professionOptions: listPilotProfessions(),
    selectedProfession: noteSession.getSelectedProfession(),
    noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
    selectedTemplateId: noteSession.getSelectedTemplateId(),
    onProfessionChange: (professionId) => {
      noteSession.setSelectedProfession(professionId);
      workspaceController.ensureValidActiveSection();
      patientHeaderController.updateSelectors({
        professionOptions: listPilotProfessions(),
        selectedProfession: noteSession.getSelectedProfession(),
        noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
        selectedTemplateId: noteSession.getSelectedTemplateId(),
      });
      noteSession.syncGlobals(() => updateSidebarStatus());
      rerenderCurrentNoteWorkspace();
      renderWorkspaceStage(activeWorkspaceTab);
      updateSidebarStatus();
      syncPatientHeaderHeight();
    },
    onNoteTypeChange: (templateId) => {
      noteSession.setSelectedTemplateId(templateId);
      workspaceController.ensureValidActiveSection();
      patientHeaderController.updateSelectors({
        professionOptions: listPilotProfessions(),
        selectedProfession: noteSession.getSelectedProfession(),
        noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
        selectedTemplateId: noteSession.getSelectedTemplateId(),
      });
      noteSession.syncGlobals(() => updateSidebarStatus());
      rerenderCurrentNoteWorkspace();
      renderWorkspaceStage(activeWorkspaceTab);
      updateSidebarStatus();
      syncPatientHeaderHeight();
    },
  });
  const patientHeader = patientHeaderController.element;

  function launchPilotTemplate(templateId = noteSession.getSelectedTemplateId()) {
    noteSession.launchTemplate(templateId);
    workspaceController.ensureValidActiveSection();
    patientHeaderController.updateSelectors({
      professionOptions: listPilotProfessions(),
      selectedProfession: noteSession.getSelectedProfession(),
      noteTypeOptions: listPilotTemplatesForProfession(noteSession.getSelectedProfession()),
      selectedTemplateId: noteSession.getSelectedTemplateId(),
    });
    noteSession.syncGlobals(() => updateSidebarStatus());
    rerenderCurrentNoteWorkspace();
    renderWorkspaceStage(activeWorkspaceTab);
    updateSidebarStatus();
  }

  const contentController = createPilotWorkspaceContent({
    workspaceController,
    onSyncGlobals: () => noteSession.syncGlobals(() => updateSidebarStatus()),
  });
  const contentPane = contentController.contentPane;
  const renderContent = contentController.renderContent;
  const realignContentTop = contentController.realignTop || (() => {});
  const mainStage = el('div', {
    class: 'note-editor main-content-with-sidebar workspace-shell__main-stage',
  });

  function createContextStage() {
    return el('div', { class: 'workspace-shell__context-pane' });
  }

  function renderWorkspaceStage(tabId = activeWorkspaceTab) {
    activeWorkspaceTab = tabId || '';
    const isCurrentNote = activeWorkspaceTab === 'current-note';
    patientHeaderController.setNoteContextVisible(isCurrentNote);
    syncPatientHeaderHeight();
    mainStage.setAttribute('data-active-tab', activeWorkspaceTab || 'none');

    if (isCurrentNote) {
      mainStage.replaceChildren(contentPane);
      Promise.resolve(renderContent({ forceScrollTop: true })).then(() =>
        realignContentTop({ onlyWhenNearTop: true }),
      );
      return;
    }

    const contextPane = createContextStage();

    if (activeWorkspaceTab === 'patient-summary') {
      renderPatientSummary(contextPane, caseObj || {});
      mainStage.replaceChildren(contextPane);
      return;
    }

    if (activeWorkspaceTab === 'my-notes') {
      renderMyNotes(contextPane, caseObj || {}, caseId);
      mainStage.replaceChildren(contextPane);
      return;
    }

    if (activeWorkspaceTab === 'case-file') {
      contextPane.appendChild(
        createWorkspaceStagePlaceholder({
          eyebrow: 'Shared Case File',
          title: 'Shared Case File is active in the chart panel',
          copy: 'Use the left workspace panel to review artifacts, filed notes, and supporting documents for this patient.',
        }),
      );
      mainStage.replaceChildren(contextPane);
      return;
    }

    contextPane.appendChild(
      createWorkspaceStagePlaceholder({
        eyebrow: 'Workspace',
        title: 'Choose a chart section to continue',
        copy: 'Select Patient Profile, Note Guide, Note History, or Shared Case File from the rail to continue working in this chart.',
      }),
    );
    mainStage.replaceChildren(contextPane);
  }

  const sidebarController = createPilotWorkspaceSidebar({
    caseObj: caseObj || {},
    isFacultyMode,
    getCaseModules,
    saveCaseModules,
    openCaseFileViewer: (moduleItem, opts) =>
      openCaseFileViewer(moduleItem, { ...opts, isFacultyMode }),
    getArtifactTypeLabel,
    noteSession,
    workspaceController,
    onSectionChange: () => {
      if (activeWorkspaceTab === 'current-note') {
        renderContent();
      }
    },
    onLaunch: launchPilotTemplate,
    materialIcon,
  });
  const sidebar = sidebarController.sidebar;
  rerenderCurrentNoteWorkspace = sidebarController.rerenderCurrentNoteWorkspace;
  updateSidebarStatus = sidebarController.updateSidebarStatus;
  const refreshCaseFileView = sidebarController.refreshCaseFileView;

  const chartSidebar = createChartSidebar({
    notesSidebar: sidebar,
    caseObj: caseObj || {},
    caseId,
    maxPhase: 1,
    defaultTab: 'current-note',
    onTabChange: (tabId) => {
      renderWorkspaceStage(tabId || '');
    },
    embedStrategy: {
      embed(elToMount, container) {
        elToMount.classList.add('note-editor__sidebar--embedded');
        container.appendChild(elToMount);
      },
      restore(elToMount) {
        elToMount.classList.remove('note-editor__sidebar--embedded');
      },
    },
  });

  document.body.classList.add('has-chart-rail');
  document.body.classList.add('workspace-shell-header-global');
  document.body.classList.add('pt-workspace-shell-route');
  wrapper.replaceChildren();
  wrapper.append(
    el('div', { class: 'workspace-shell workspace-shell--pt' }, [
      patientHeader,
      el('div', { class: 'workspace-shell__body' }, [chartSidebar.wrapper, mainStage]),
    ]),
  );
  syncPatientHeaderHeight();

  if (typeof window !== 'undefined') {
    window.saveSignedNoteToCasefile = ({ draft, context } = {}) => {
      const record = saveSignedNoteToCasefile(draft, context);
      refreshCaseFileView();
      return record;
    };
    window.refreshCaseFileView = refreshCaseFileView;
  }

  try {
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => {
        syncPatientHeaderHeight();
        if (activeWorkspaceTab === 'current-note') {
          realignContentTop({ onlyWhenNearTop: true });
        }
      });
      ro.observe(patientHeader);
      window.__ptWorkspaceHeaderResizeObserver?.disconnect?.();
      window.__ptWorkspaceHeaderResizeObserver = ro;
    }
  } catch {
    /* safe fallback */
  }

  renderWorkspaceStage('current-note');

  return () => {
    releaseWorkspaceCanvas();
    document.body.classList.remove(
      'has-chart-rail',
      'chart-panel-open',
      'workspace-shell-header-global',
      'pt-workspace-shell-route',
    );
  };
}
