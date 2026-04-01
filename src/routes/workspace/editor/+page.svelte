<!--
  Workspace Editor — the main note-editing workspace with chart rail + sidebar.
  Ported from app/js/views/pt_workspace_v2.js
-->
<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import { get } from 'svelte/store';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ChartRail from '$lib/components/ChartRail.svelte';
  import ChartDetailPanel from '$lib/components/ChartDetailPanel.svelte';
  import PatientHeader from '$lib/components/PatientHeader.svelte';
  import PatientSummaryPanel from '$lib/components/PatientSummaryPanel.svelte';
  import SidebarProgressTracker from '$lib/components/SidebarProgressTracker.svelte';
  import MyNotesPanel from '$lib/components/MyNotesPanel.svelte';
  import CaseFilePanel from '$lib/components/CaseFilePanel.svelte';
  import ArtifactsPanel from '$lib/components/ArtifactsPanel.svelte';
  import SignedNoteViewer from '$lib/components/SignedNoteViewer.svelte';
  import SubjectiveSection from '$lib/components/SubjectiveSection.svelte';
  import ObjectiveSection from '$lib/components/ObjectiveSection.svelte';
  import AssessmentSection from '$lib/components/AssessmentSection.svelte';
  import PlanSection from '$lib/components/PlanSection.svelte';
  import BillingSection from '$lib/components/BillingSection.svelte';
  import NutritionAssessmentSection from '$lib/components/NutritionAssessmentSection.svelte';
  import NutritionDiagnosisSection from '$lib/components/NutritionDiagnosisSection.svelte';
  import NutritionInterventionSection from '$lib/components/NutritionInterventionSection.svelte';
  import NutritionMonitoringSection from '$lib/components/NutritionMonitoringSection.svelte';
  import DieteticsBillingSection from '$lib/components/DieteticsBillingSection.svelte';
  import { openNoteExportPreview } from '$lib/components/NoteExportPreviewModal.svelte';
  import {
    openAddArtifactModal,
    openEditArtifactModal,
  } from '$lib/components/ArtifactFormModal.svelte';
  import { openArtifactViewer } from '$lib/components/ArtifactViewerModal.svelte';
  import { showToast } from '$lib/components/Toast.svelte';
  import { showConfirmModal, showReasonModal } from '$lib/components/ConfirmModal.svelte';
  import { ptDisciplineConfig } from '$lib/config/ptDisciplineConfig';
  import { dieteticsDisciplineConfig } from '$lib/config/dieteticsDisciplineConfig';
  import { hasAnyContent, type DisciplineProgressConfig } from '$lib/config/progressUtils';
  import {
    findTemplate,
    type SettingId,
    type VisitTypeId,
    type ResolvedNoteTemplate,
  } from '$lib/config/templates';
  import { activeCase, loadActiveCase, clearActiveCase } from '$lib/stores/cases';
  import { activeChartTab, isPanelOpen, closePanel, openTab } from '$lib/stores/ui';
  import {
    initDraft,
    initDieteticsDraft,
    saveDraftNow,
    clearDraft,
    isDirty,
    noteDraft,
    dieteticsNoteDraft,
    autoSaveError,
    finalizeAndSaveSignedNote,
  } from '$lib/stores/noteSession';
  import type { NoteData } from '$lib/services/noteLifecycle';
  import {
    buildCaseFileEntries,
    buildMyNotesEntries,
    getCurrentSignedNote,
    listArtifactsForCase,
    listSignedNotesForCase,
    upsertArtifactRecord,
    deleteArtifact,
    type NoteEnvelope,
    type ChartArtifact,
  } from '$lib/services/chartRecords';
  import { chartRecords, refreshChartRecords } from '$lib/stores/chartRecords';
  import { exportSignedNoteToDocxWithAudit } from '$lib/services/exportSignedNote';
  import { noteEnvelopeToCaseFileEntry } from '$lib/services/noteEnvelopeAdapters';
  import type { CaseFileEntry } from '$lib/services/casefileRepository';
  import type { CaseObj } from '$lib/store';
  import VspxChatTrigger from '$lib/components/VspxChatTrigger.svelte';
  import VspxChatWidget from '$lib/components/VspxChatWidget.svelte';
  import { checkEligibility } from '$lib/services/vspxAccess';
  import { canCreateCase, userDiscipline } from '$lib/stores/auth';
  import { resolveCasePatient } from '$lib/stores/vspRegistry';
  import type { VspRecord } from '$lib/services/vspRegistry';

  /** Short discipline labels for display. */
  const PROFESSIONS_MAP: Record<string, string> = {
    pt: 'PT',
    ot: 'OT',
    slp: 'SLP',
    nursing: 'Nursing',
    dietetics: 'Dietetics',
  };

  let activeSection = $state('subjective');
  let activeSubsection = $state<string | null>(null);
  let suppressSidebarSubsectionMotion = $state(false);
  let caseLoaded = $state(false);
  let loadError = $state('');

  // Signed note viewer state (shows SignedNoteViewer in the my-notes panel)
  let viewingNote = $state<NoteData | null>(null);

  // VSPx chat widget
  let vspxWidgetRef = $state<VspxChatWidget | null>(null);
  let vspxCallActive = $state(false);

  // Sign flow
  let isSigning = $state(false);

  // Note locked state — true after signing, prevents further editing
  let isNoteLocked = $state(false);

  // Amendment state — tracks whether we're amending a previously signed note
  let amendingFromNote = $state<NoteEnvelope | null>(null);
  let pendingSubsectionScrollTarget = $state<string | null>(null);
  let pendingSubsectionReleaseTimer: ReturnType<typeof setTimeout> | null = null;

  // Load case from URL params
  onMount(() => {
    const caseId = $page.url.searchParams.get('case');
    const encounter = $page.url.searchParams.get('encounter') ?? 'eval';
    const requestedTab = $page.url.searchParams.get('tab');
    const requestedNoteId = $page.url.searchParams.get('note');

    if (!caseId) {
      loadError = 'No case ID specified.';
      return;
    }

    try {
      loadActiveCase(caseId, encounter);
      if (encounter === 'nutrition') {
        initDieteticsDraft();
        activeSection = 'nutrition-assessment';
      } else {
        initDraft();
      }
      caseLoaded = true;
      if (
        requestedTab === 'patient-summary' ||
        requestedTab === 'my-notes' ||
        requestedTab === 'case-file'
      ) {
        openTab(requestedTab);
      } else {
        // Auto-open the Current Note sidebar (matches original _autoOpenDefault)
        openTab('current-note');
      }

      if (requestedNoteId) {
        const requestedNote = listSignedNotesForCase(caseId).find(
          (note) => note.id === requestedNoteId,
        );
        viewingNote = requestedNote ? (requestedNote.content as NoteData) : null;
      }
    } catch {
      loadError = `Failed to load case "${caseId}".`;
    }
  });

  onDestroy(() => {
    clearPendingSubsectionScroll();
    if ($isDirty) saveDraftNow();
    clearDraft();
    clearActiveCase();
    closePanel();
  });

  // Surface auto-save storage errors as toasts
  $effect(() => {
    const err = $autoSaveError;
    if (err) showToast(err, { type: 'error', timeout: 8000 });
  });

  const caseObj = $derived($activeCase.caseWrapper?.caseObj as CaseObj | undefined);

  // Resolve VSP patient from registry for live demographics
  const resolvedPatient = $derived.by(() => {
    return resolveCasePatient(caseObj ?? null);
  });

  const vspxEligibility = $derived.by(() => {
    const wrapper = $activeCase.caseWrapper ?? null;
    return checkEligibility(wrapper);
  });

  const editorMode = $derived.by((): string => {
    const raw = String(
      caseObj?.meta?.professionId ??
        caseObj?.meta?.profession ??
        caseObj?.meta?.discipline ??
        caseObj?.discipline ??
        $page.url.searchParams.get('discipline') ??
        $userDiscipline ??
        'pt',
    ).toLowerCase();
    if (raw.includes('diet')) return 'dietetics';
    if (raw === 'ot' || raw.includes('occupational')) return 'ot';
    if (raw === 'slp' || raw.includes('speech')) return 'slp';
    if (raw === 'nursing' || raw.includes('nurs')) return 'nursing';
    return 'pt';
  });

  // ─── Note template resolution ──────────────────────────────────────────
  // Maps existing encounter/setting strings to the template system's typed IDs.

  const ENCOUNTER_TO_VISIT_TYPE: Record<string, VisitTypeId> = {
    eval: 'initial-eval',
    followup: 'follow-up',
    soap: 'daily-note',
    discharge: 'discharge-summary',
    nutrition: 'initial-eval',
  };

  const SETTING_MAP: Record<string, SettingId> = {
    outpatient: 'outpatient',
    inpatient: 'inpatient-acute',
    'inpatient acute': 'inpatient-acute',
    'inpatient-acute': 'inpatient-acute',
    'acute rehab': 'inpatient-rehab',
    'inpatient rehab': 'inpatient-rehab',
    'inpatient-rehab': 'inpatient-rehab',
    irf: 'inpatient-rehab',
    snf: 'snf',
    'skilled nursing': 'snf',
    'home health': 'home-health',
    'home-health': 'home-health',
    pediatric: 'pediatric',
    'acute care': 'acute-care',
    'acute-care': 'acute-care',
  };

  const resolvedTemplate = $derived.by((): ResolvedNoteTemplate | null => {
    // Prefer the discipline stored with the case (professionId) over the user's global discipline
    const discipline = (editorMode as import('$lib/stores/auth').DisciplineId) ?? $userDiscipline;
    const rawSetting = (caseObj?.meta?.setting ?? '').toString().toLowerCase();
    const setting = SETTING_MAP[rawSetting] ?? null;
    const encounter = $activeCase.encounter ?? 'eval';
    const visitType = ENCOUNTER_TO_VISIT_TYPE[encounter] ?? null;
    return findTemplate(discipline, setting, visitType);
  });

  // Set template into Svelte context for section components.
  // setContext must be called synchronously during init, so we pass a getter
  // that always returns the current resolved template.
  setContext('noteTemplate', () => resolvedTemplate);

  const noteTypeLabel = $derived.by(() => {
    // If we have a resolved template, use its label directly
    if (resolvedTemplate?.label) return resolvedTemplate.label;

    // Fallback for cases without template resolution
    const encounter = $activeCase.encounter ?? '';
    const profLabel = PROFESSIONS_MAP[editorMode] ?? editorMode.toUpperCase();
    if (editorMode === 'dietetics') {
      if (encounter === 'nutrition') return 'Dietetics ADIME';
      if (encounter === 'followup') return 'Dietetics Follow-Up';
      return 'Dietetics Note';
    }
    if (encounter === 'eval') return `${profLabel} Initial Evaluation`;
    if (encounter === 'followup') return `${profLabel} Follow-Up`;
    if (encounter === 'soap') return `${profLabel} SOAP Progress Note`;
    if (encounter === 'discharge') return `${profLabel} Discharge Summary`;
    return 'Clinical Note';
  });
  const currentSectionLabel = $derived.by(() => {
    const sectionConfig =
      editorMode === 'dietetics' ? dieteticsDisciplineConfig.sections : ptDisciplineConfig.sections;
    return sectionConfig.find((section) => section.id === activeSection)?.label ?? activeSection;
  });

  // ─── Panel data ───────────────────────────────────────────────────────────

  /** All notes for the active case (drafts + signed), derived from live chart records. */
  const panelNotes = $derived.by(() => {
    if (!$activeCase.caseId) return [];
    void $chartRecords; // reactive dependency — re-runs whenever chart records change
    return buildMyNotesEntries($activeCase.caseId);
  });

  /**
   * Case file entries from caseObj (populated by faculty when creating the case).
   * Falls back to [] — structure depends on static case data files.
   */
  const caseFileEntries = $derived.by(() => {
    if (!$activeCase.caseId) return [];

    void $chartRecords;

    const legacyEntries = (() => {
      const cf = (caseObj as Record<string, unknown> | undefined)?.caseFile;
      return Array.isArray(cf) ? (cf as CaseFileEntry[]) : [];
    })();
    const normalizedEntries = buildCaseFileEntries($activeCase.caseId);
    const signedEntries = listSignedNotesForCase($activeCase.caseId).map((note) =>
      noteEnvelopeToCaseFileEntry(note),
    );

    const merged = [...legacyEntries, ...normalizedEntries, ...signedEntries];
    const deduped = new Map<string, CaseFileEntry>();
    for (const entry of merged) {
      deduped.set(entry.id, entry);
    }
    return [...deduped.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  });

  /**
   * Background document artifacts from caseObj.
   * Falls back to [] — structure depends on static case data files.
   */
  const artifactsList = $derived.by(() => {
    if (!$activeCase.caseId) return [];

    void $chartRecords;

    const legacyArtifacts = (() => {
      const arts = (caseObj as Record<string, unknown> | undefined)?.artifacts;
      return Array.isArray(arts)
        ? (arts as {
            id: string;
            title: string;
            category: string;
            content: string;
            html?: string;
          }[])
        : [];
    })();

    const normalizedArtifacts = listArtifactsForCase($activeCase.caseId).map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      category: artifact.category,
      content: artifact.content ?? '',
      html: artifact.html,
    }));

    const deduped = new Map<
      string,
      { id: string; title: string; category: string; content: string; html?: string }
    >();
    for (const artifact of [...legacyArtifacts, ...normalizedArtifacts]) {
      deduped.set(artifact.id, artifact);
    }
    return [...deduped.values()];
  });

  // ─── Actions ─────────────────────────────────────────────────────────────

  function goBack() {
    if ($isDirty) saveDraftNow();
    goto('/workspace/cases');
  }

  function getEditorScrollRoot(): HTMLElement | null {
    return document.querySelector('.note-editor__body');
  }

  function clearPendingSubsectionScroll() {
    pendingSubsectionScrollTarget = null;
    suppressSidebarSubsectionMotion = false;
    if (pendingSubsectionReleaseTimer) {
      clearTimeout(pendingSubsectionReleaseTimer);
      pendingSubsectionReleaseTimer = null;
    }
  }

  function schedulePendingSubsectionRelease(delay = 160) {
    if (pendingSubsectionReleaseTimer) clearTimeout(pendingSubsectionReleaseTimer);
    pendingSubsectionReleaseTimer = setTimeout(() => {
      pendingSubsectionReleaseTimer = null;
      pendingSubsectionScrollTarget = null;
      suppressSidebarSubsectionMotion = false;
    }, delay);
  }

  function isPendingSubsectionInView(scrollRoot: HTMLElement, subsectionId: string): boolean {
    const target = scrollRoot.querySelector<HTMLElement>(`[data-subsection="${subsectionId}"]`);
    if (!target) return true;

    const rootTop = scrollRoot.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    return Math.abs(targetTop - rootTop) <= 24;
  }

  function getClosestVisibleSubsectionId(scrollRoot: HTMLElement): string | null {
    const subsectionEls = [...scrollRoot.querySelectorAll<HTMLElement>('[data-subsection]')];
    if (subsectionEls.length === 0) return null;

    const rootTop = scrollRoot.getBoundingClientRect().top;
    let closestSubsectionId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const subsectionEl of subsectionEls) {
      const subsectionId = subsectionEl.dataset.subsection;
      if (!subsectionId) continue;

      const distanceFromFocusLine = Math.abs(
        subsectionEl.getBoundingClientRect().top - rootTop - 112,
      );

      if (distanceFromFocusLine < closestDistance) {
        closestDistance = distanceFromFocusLine;
        closestSubsectionId = subsectionId;
      }
    }

    return closestSubsectionId;
  }

  function syncActiveSubsectionFromScroll() {
    const scrollRoot = getEditorScrollRoot();
    if (!scrollRoot) return;

    if (pendingSubsectionScrollTarget) {
      if (isPendingSubsectionInView(scrollRoot, pendingSubsectionScrollTarget)) {
        activeSubsection = pendingSubsectionScrollTarget;
        schedulePendingSubsectionRelease();
      }
      return;
    }

    const closestSubsectionId = getClosestVisibleSubsectionId(scrollRoot);
    if (closestSubsectionId !== activeSubsection) {
      activeSubsection = closestSubsectionId;
    }
  }

  $effect(() => {
    if (!caseLoaded) return;

    activeSection;

    const scrollRoot = getEditorScrollRoot();
    if (!scrollRoot) return;

    let frameId = 0;
    const scheduleSync = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        syncActiveSubsectionFromScroll();
      });
    };

    scheduleSync();
    scrollRoot.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync);

    const observer = new MutationObserver(scheduleSync);
    observer.observe(scrollRoot, { childList: true, subtree: true });

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
      scrollRoot.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
    };
  });

  function selectSection(sectionId: string) {
    clearPendingSubsectionScroll();
    activeSection = sectionId;
    activeSubsection = null;

    requestAnimationFrame(() => {
      getEditorScrollRoot()?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function selectSubsection(sectionId: string, subId: string) {
    activeSection = sectionId;
    activeSubsection = subId;
    pendingSubsectionScrollTarget = subId;
    suppressSidebarSubsectionMotion = true;
    schedulePendingSubsectionRelease(1200);
    // Scroll to subsection after section renders
    requestAnimationFrame(() => {
      const scrollRoot = getEditorScrollRoot();
      const el = scrollRoot?.querySelector<HTMLElement>(`[data-subsection="${subId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      clearPendingSubsectionScroll();
      scrollRoot?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function handleSave() {
    saveDraftNow();
    showToast('Draft saved', { type: 'success', timeout: 2000 });
  }

  function getActiveDraftForEditor(): NoteData {
    return structuredClone(
      (editorMode === 'dietetics'
        ? get(dieteticsNoteDraft)
        : get(noteDraft)) as unknown as NoteData,
    );
  }

  function replaceActiveDraftForEditor(note: NoteData): void {
    const cloned = structuredClone(note);
    if (editorMode === 'dietetics') {
      dieteticsNoteDraft.set(
        cloned as unknown as import('$lib/stores/noteSession').DieteticsNoteDraft,
      );
    } else {
      noteDraft.set(cloned as unknown as import('$lib/stores/noteSession').NoteDraft);
    }
    isDirty.set(true);
  }

  function handleContinueEditing(note: { encounterKey?: string; encounter?: number }) {
    if (!$activeCase.caseId) return;
    const enc = note.encounterKey ?? String(note.encounter ?? '');
    goto(
      `/workspace/editor?case=${encodeURIComponent($activeCase.caseId)}&encounter=${encodeURIComponent(enc)}&tab=current-note`,
    );
  }

  function findSignedEnvelopeById(noteId: string): NoteEnvelope | null {
    if (!$activeCase.caseId) return null;
    return listSignedNotesForCase($activeCase.caseId).find((note) => note.id === noteId) ?? null;
  }

  function handleViewCaseFileEntry(entry: CaseFileEntry) {
    const note = findSignedEnvelopeById(entry.id);
    if (!note) return;
    openTab('my-notes');
    viewingNote = note.content as NoteData;
  }

  async function handleAmendNote(noteEntry: {
    id: string;
    data: NoteData;
    signature?: import('$lib/services/noteLifecycle').Signature;
  }) {
    if (!$activeCase.caseId) return;

    // Find the full envelope for the signed note being amended
    const envelope = findSignedEnvelopeById(noteEntry.id);

    // Ask for amendment reason
    const reason = await promptAmendmentReason();
    if (!reason) return; // User cancelled

    // Load the signed note content back into the draft store with amendment marker
    const noteData = { ...(noteEntry.data ?? {}) } as NoteData;
    const meta = { ...(noteData.meta ?? {}) };
    meta.amendingFrom = reason;
    if (noteEntry.signature) {
      meta.signature = { ...noteEntry.signature };
    }
    noteData.meta = meta;
    replaceActiveDraftForEditor(noteData);

    // Track which note we're amending for the supersedes chain
    amendingFromNote = envelope;
    isNoteLocked = false;
    viewingNote = null;

    // Switch to editing view
    openTab('current-note');
    showToast('Amending signed note — make changes and re-sign when ready.', {
      type: 'info',
      timeout: 4000,
    });
  }

  async function handleAmendFromCaseFile(entry: CaseFileEntry) {
    const envelope = findSignedEnvelopeById(entry.id);
    if (!envelope) return;
    const sig = envelope.meta?.signature as
      | import('$lib/services/noteLifecycle').Signature
      | undefined;
    await handleAmendNote({
      id: envelope.id,
      data: envelope.content as NoteData,
      signature: sig,
    });
  }

  async function promptAmendmentReason(): Promise<string | null> {
    return showReasonModal({
      title: 'Amend Signed Note',
      message:
        'Describe the reason for this amendment. The original signed note will be preserved and the amendment chain will be tracked.',
      reasonPlaceholder:
        'e.g., Correcting documented ROM values, adding omitted treatment details...',
    });
  }

  // ─── Artifact CRUD ─────────────────────────────────────────────────────

  async function handleAddArtifact() {
    if (!$activeCase.caseId) return;
    const result = await openAddArtifactModal($activeCase.caseId);
    if (!result) return;
    upsertArtifactRecord({
      caseId: $activeCase.caseId,
      artifact: {
        title: result.title,
        category: result.category,
        date: result.date,
        content: result.content,
      },
      encounterKey: $activeCase.encounter,
      caseObj,
    });
    refreshChartRecords();
    showToast(`Added "${result.title}"`, { type: 'success', timeout: 2000 });
  }

  async function handleViewArtifact(artifact: {
    id: string;
    title: string;
    category: string;
    content: string;
    html?: string;
  }) {
    const full = listArtifactsForCase($activeCase.caseId ?? '').find((a) => a.id === artifact.id);
    const chartArtifact: ChartArtifact = full ?? {
      id: artifact.id,
      patientId: '',
      legacyCaseId: $activeCase.caseId ?? '',
      category: artifact.category,
      title: artifact.title,
      date: new Date().toISOString(),
      content: artifact.content,
      html: artifact.html,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const action = await openArtifactViewer(chartArtifact, { canEdit: $canCreateCase });
    if (action === 'edit') handleEditArtifact(artifact);
    else if (action === 'delete') handleDeleteArtifact(artifact);
  }

  async function handleEditArtifact(artifact: {
    id: string;
    title: string;
    category: string;
    content: string;
    html?: string;
  }) {
    if (!$activeCase.caseId) return;
    const full = listArtifactsForCase($activeCase.caseId).find((a) => a.id === artifact.id);
    const existing: ChartArtifact = full ?? {
      id: artifact.id,
      patientId: '',
      legacyCaseId: $activeCase.caseId,
      category: artifact.category,
      title: artifact.title,
      date: new Date().toISOString(),
      content: artifact.content,
      html: artifact.html,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await openEditArtifactModal($activeCase.caseId, existing);
    if (!result) return;
    upsertArtifactRecord({
      caseId: $activeCase.caseId,
      artifact: {
        id: artifact.id,
        title: result.title,
        category: result.category,
        date: result.date,
        content: result.content,
      },
      encounterKey: $activeCase.encounter,
      caseObj,
    });
    refreshChartRecords();
    showToast(`Updated "${result.title}"`, { type: 'success', timeout: 2000 });
  }

  async function handleDeleteArtifact(artifact: { id: string; title: string }) {
    const confirmed = await showConfirmModal({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${artifact.title}"? This cannot be undone.`,
      confirmText: 'delete',
      danger: true,
    });
    if (!confirmed) return;
    deleteArtifact(artifact.id);
    refreshChartRecords();
    showToast(`Deleted "${artifact.title}"`, { type: 'info', timeout: 2000 });
  }

  /**
   * Pre-sign validation: checks all subsection requirements against the current draft.
   * Returns a list of incomplete subsection labels, or empty if all requirements are met.
   */
  function getIncompleteSubsections(): string[] {
    const config: DisciplineProgressConfig =
      editorMode === 'dietetics' ? dieteticsDisciplineConfig : ptDisciplineConfig;
    const draft = getActiveDraftForEditor() as Record<string, Record<string, unknown>>;
    const incomplete: string[] = [];

    for (const section of config.sections) {
      const sectionKey = config.sectionKeyMap?.[section.id] ?? section.id;
      const sectionData = draft[sectionKey];
      const subIds = config.subsections[section.id] ?? [];

      for (const subId of subIds) {
        const resolver = config.dataResolvers[subId];
        const subData = resolver ? resolver(sectionData) : sectionData?.[subId];
        const requirement = config.requirements[subId];

        if (!requirement) continue; // No requirement defined — skip

        const isComplete = requirement(subData, sectionData);
        if (!isComplete) {
          const label = config.subsectionLabels[subId] ?? subId;
          incomplete.push(`${section.label} → ${label}`);
        }
      }
    }
    return incomplete;
  }

  async function handleSign() {
    if (isSigning || isNoteLocked) return;

    // Pre-sign completeness check
    const incomplete = getIncompleteSubsections();
    if (incomplete.length > 0) {
      const listing = incomplete.map((item) => `  • ${item}`).join('\n');
      const proceed = await showConfirmModal({
        title: 'Incomplete Documentation',
        message: `${incomplete.length} section${incomplete.length > 1 ? 's' : ''} ha${incomplete.length > 1 ? 've' : 's'} incomplete required fields:\n\n${listing}\n\nDo you want to sign anyway?`,
        confirmLabel: 'Sign Anyway',
        cancelLabel: 'Go Back & Complete',
      });
      if (!proceed) return;
    }

    isSigning = true;
    try {
      if (!$activeCase.caseId) return;
      const caseId = $activeCase.caseId;
      const enc = $activeCase.encounter ?? 'eval';
      const safeName = (caseObj?.patientName ?? 'note').replace(/\s+/g, '_');
      const patient = {
        name: caseObj?.patientName ?? 'Patient',
        dob: String(caseObj?.snapshot?.dob ?? ''),
        caseId,
      };
      const draftNote = getActiveDraftForEditor();

      // Show export preview with signature capture
      const preview = await openNoteExportPreview({
        note: draftNote,
        patient,
        noteTypeLabel,
      });
      if (!preview?.signature) return;

      // Finalize signature on draft, save signed envelope, clear draft
      const envelope = finalizeAndSaveSignedNote(
        caseId,
        enc,
        preview.signature,
        preview.note ?? draftNote,
      );

      // Export to DOCX with audit trail
      const filename = `${safeName}_${enc}_${new Date().toISOString().slice(0, 10)}.docx`;
      await exportSignedNoteToDocxWithAudit({
        envelope,
        patient,
        filename,
        autoDownload: true,
      });

      // Lock the editor and reset amendment state
      isNoteLocked = true;
      amendingFromNote = null;

      showToast(`Signed and downloaded by ${preview.signature.name}`, {
        type: 'success',
        timeout: 3500,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[handleSign] export failed:', err);
      showToast(`Signing/export failed: ${msg}`, { type: 'error', timeout: 12000 });
    } finally {
      isSigning = false;
    }
  }

  let isExporting = $state(false);

  async function handleExport() {
    if (isExporting || !$activeCase.caseId) return;
    isExporting = true;
    try {
      const caseId = $activeCase.caseId;
      const enc = $activeCase.encounter ?? 'eval';
      const signed = getCurrentSignedNote(caseId, enc);
      const safeName = (caseObj?.patientName ?? 'note').replace(/\s+/g, '_');
      const patient = {
        name: caseObj?.patientName ?? 'Patient',
        dob: String(caseObj?.snapshot?.dob ?? ''),
        caseId,
      };

      if (signed) {
        const preview = await openNoteExportPreview({
          note: signed.content as NoteData,
          patient,
          noteTypeLabel,
          existingSignature:
            (signed.meta?.signature as
              | import('$lib/services/noteLifecycle').Signature
              | undefined) ?? null,
          mode: 'export',
        });
        if (!preview?.confirmed) return;
        await exportSignedNoteToDocxWithAudit({
          envelope: signed,
          patient,
          filename: `${safeName}_${enc}_${new Date().toISOString().slice(0, 10)}.docx`,
          autoDownload: true,
        });
        showToast('Signed note downloaded', { type: 'success', timeout: 2500 });
      } else {
        // No signed note exists — sign first, then export
        const draftNote = getActiveDraftForEditor();
        const preview = await openNoteExportPreview({
          note: draftNote,
          patient,
          noteTypeLabel,
        });
        if (!preview?.signature) return;

        const envelope = finalizeAndSaveSignedNote(
          caseId,
          enc,
          preview.signature,
          preview.note ?? draftNote,
        );
        await exportSignedNoteToDocxWithAudit({
          envelope,
          patient,
          filename: `${safeName}_${enc}_${new Date().toISOString().slice(0, 10)}.docx`,
          autoDownload: true,
        });
        isNoteLocked = true;
        amendingFromNote = null;
        showToast(`Signed and downloaded by ${preview.signature.name}`, {
          type: 'success',
          timeout: 2500,
        });
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[handleExport] export failed:', err);
      showToast(`Export failed: ${msg}`, { type: 'error', timeout: 12000 });
    } finally {
      isExporting = false;
    }
  }

  async function handleDiscard() {
    const confirmed = await showConfirmModal({
      title: 'Discard Draft',
      message: 'All unsaved changes for this encounter will be lost. This cannot be undone.',
      confirmText: 'discard',
      danger: true,
    });
    if (!confirmed) return;
    clearDraft();
    showToast('Draft discarded', { type: 'info' });
    goto('/workspace/cases');
  }
</script>

<svelte:head>
  <title>
    {caseObj?.snapshot?.name ?? 'Editor'} | UND EMR-Sim
  </title>
</svelte:head>

{#if loadError}
  <div class="editor-error">
    <h1>Unable to Load Case</h1>
    <p>{loadError}</p>
    <a href="/workspace/cases" class="btn btn--primary">Back to Case Library</a>
  </div>
{:else if !caseLoaded}
  <div class="editor-loading">
    <p>Loading case...</p>
  </div>
{:else if caseObj}
  <div class="workspace-shell">
    <!-- Patient header -->
    <div class="patient-header-row">
      <PatientHeader
        {caseObj}
        vspPatient={resolvedPatient}
        onBack={goBack}
        {noteTypeLabel}
        isDirty={$isDirty}
        {isSigning}
        {isExporting}
        {isNoteLocked}
        isAmending={!!amendingFromNote}
        onDiscard={handleDiscard}
        onSave={handleSave}
        onSign={handleSign}
        onExport={handleExport}
      />
      {#if vspxEligibility.canUseVspx && $activeCase.caseId}
        <VspxChatTrigger active={vspxCallActive} onclick={() => vspxWidgetRef?.open()} />
      {/if}
    </div>

    <div class="workspace-shell__body">
      <!-- Chart rail -->
      <ChartRail />

      <!-- Detail panel (slides out from rail) -->
      <ChartDetailPanel>
        {#if $activeChartTab === 'patient-summary'}
          <PatientSummaryPanel {caseObj} vspPatient={resolvedPatient} />
        {:else if $activeChartTab === 'current-note'}
          <SidebarProgressTracker
            {activeSection}
            {activeSubsection}
            suppressSubsectionMotion={suppressSidebarSubsectionMotion}
            mode={editorMode}
            onSelectSection={selectSection}
            onSelectSubsection={selectSubsection}
          />
        {:else if $activeChartTab === 'my-notes'}
          {#if viewingNote}
            <SignedNoteViewer
              note={viewingNote}
              patientName={caseObj?.patientName ?? ''}
              onBack={() => {
                viewingNote = null;
              }}
              onAmend={() => {
                const noteData = viewingNote;
                if (!noteData) return;
                const sig = noteData.meta?.signature as
                  | import('$lib/services/noteLifecycle').Signature
                  | undefined;
                const noteId =
                  panelNotes.find(
                    (n) => n.data === noteData || n.status === 'signed' || n.status === 'amended',
                  )?.id ?? '';
                handleAmendNote({ id: noteId, data: noteData, signature: sig });
              }}
            />
          {:else}
            <MyNotesPanel
              notes={panelNotes}
              onView={(n) => {
                viewingNote = n.data as NoteData;
              }}
              onContinueEditing={handleContinueEditing}
              onAmend={(n) => handleAmendNote({ id: n.id, data: n.data, signature: n.signature })}
            />
          {/if}
        {:else if $activeChartTab === 'case-file'}
          <CaseFilePanel
            entries={caseFileEntries}
            onViewEntry={handleViewCaseFileEntry}
            onAmendNote={handleAmendFromCaseFile}
          />
          {#if artifactsList.length > 0 || $canCreateCase}
            <hr class="panel-divider" />
            <ArtifactsPanel
              artifacts={artifactsList}
              canEdit={$canCreateCase}
              onView={handleViewArtifact}
              onAdd={handleAddArtifact}
              onEditArtifact={handleEditArtifact}
              onDelete={handleDeleteArtifact}
            />
          {/if}
        {/if}
      </ChartDetailPanel>

      <!-- Main content area -->
      <div class="workspace-shell__main-stage" class:has-panel={$isPanelOpen}>
        {#if isNoteLocked}
          <div class="note-locked-banner">
            <span class="note-locked-banner__icon">&#x2714;</span>
            <div class="note-locked-banner__text">
              <strong>Note Signed &amp; Locked</strong>
              <span
                >This note has been signed and exported. Open Note History to view or amend it.</span
              >
            </div>
          </div>
        {/if}
        {#if amendingFromNote}
          <div class="note-amending-banner">
            <span class="note-amending-banner__icon">&#x270F;</span>
            <div class="note-amending-banner__text">
              <strong>Amending Signed Note</strong>
              <span>Make changes and re-sign when ready. The original note will be preserved.</span>
            </div>
          </div>
        {/if}
        <div class="note-editor" class:note-editor--locked={isNoteLocked}>
          <div class="note-editor__body" tabindex="-1">
            <div class="note-editor__section-header" aria-live="polite">
              <h2 class="note-editor__section-title">{currentSectionLabel}</h2>
            </div>

            <div class="note-editor__content">
              {#key `${editorMode}:${activeSection}`}
                <div
                  class="note-editor__content-pane"
                  in:fly={{ y: 8, duration: 180, opacity: 0.18, easing: cubicOut }}
                  out:fade={{ duration: 110 }}
                >
                  {#if editorMode === 'dietetics'}
                    {#if activeSection === 'nutrition-assessment'}
                      <NutritionAssessmentSection />
                    {:else if activeSection === 'nutrition-diagnosis'}
                      <NutritionDiagnosisSection />
                    {:else if activeSection === 'nutrition-intervention'}
                      <NutritionInterventionSection />
                    {:else if activeSection === 'nutrition-monitoring'}
                      <NutritionMonitoringSection />
                    {:else if activeSection === 'billing'}
                      <DieteticsBillingSection />
                    {/if}
                  {:else if activeSection === 'subjective'}
                    <SubjectiveSection />
                  {:else if activeSection === 'objective'}
                    <ObjectiveSection />
                  {:else if activeSection === 'assessment'}
                    <AssessmentSection />
                  {:else if activeSection === 'plan'}
                    <PlanSection />
                  {:else if activeSection === 'billing'}
                    <BillingSection />
                  {/if}
                </div>
              {/key}
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if vspxEligibility.canUseVspx && $activeCase.caseId}
      <VspxChatWidget
        bind:this={vspxWidgetRef}
        vspxUrl={vspxEligibility.vspxUrl}
        caseId={$activeCase.caseId}
        onActiveChange={(active) => {
          vspxCallActive = active;
        }}
      />
    {/if}
  </div>
{/if}

<style>
  .patient-header-row {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }

  .patient-header-row > :global(:first-child) {
    flex: 1;
    min-width: 0;
  }

  .workspace-shell {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 72px - 28px);
    min-height: 0;
    overflow: hidden;
  }

  .workspace-shell__body {
    display: flex;
    align-items: stretch;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(6, 78, 59, 0.08), transparent 14rem),
      linear-gradient(90deg, #0f172a 0, #0f172a 112px, #f4f5f7 112px, #f4f5f7 100%);
  }

  .workspace-shell__main-stage {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    background:
      radial-gradient(circle at top right, rgba(0, 154, 68, 0.07), transparent 22rem),
      linear-gradient(180deg, #f4f5f7 0%, #eef1f3 100%);
    transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .note-editor {
    max-width: none;
    margin: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .note-editor__body {
    --editor-body-pad-top: 1.25rem;
    --editor-body-pad-x: 1.5rem;
    --editor-body-pad-bottom: 1.75rem;
    flex: 1;
    min-height: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 252, 252, 1));
    border-radius: 0;
    padding: var(--editor-body-pad-top) var(--editor-body-pad-x) var(--editor-body-pad-bottom);
    overflow-y: auto;
    overscroll-behavior: contain;
    box-shadow: none;
  }

  .note-editor__section-header {
    position: sticky;
    top: calc(var(--editor-body-pad-top) * -1);
    z-index: 3;
    display: flex;
    align-items: center;
    min-height: 2.5rem;
    margin: calc(var(--editor-body-pad-top) * -1) calc(var(--editor-body-pad-x) * -1) 0.7rem;
    padding: 0.55rem var(--editor-body-pad-x) 0.5rem;
    background: linear-gradient(
      90deg,
      var(--color-brand-green-dark, #007a35) 0%,
      var(--color-brand-green, #009a44) 100%
    );
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow:
      0 2px 8px rgba(0, 154, 68, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .note-editor__section-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ffffff;
  }

  .note-editor__content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .note-editor__content-pane {
    min-width: 0;
    will-change: transform, opacity;
  }

  .btn--primary {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--primary:hover {
    background: #007a35;
  }

  /* Panel divider between CaseFilePanel and ArtifactsPanel */
  .panel-divider {
    border: none;
    border-top: 1px solid var(--color-neutral-200, #e0e0e0);
    margin: 0;
  }

  /* Error / loading states */
  .editor-error,
  .editor-loading {
    padding: 3rem 2rem;
    text-align: center;
  }

  .editor-error h1 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .editor-error p {
    color: var(--color-neutral-500, #737373);
    margin-bottom: 1.5rem;
  }

  /* ── Locked / Amending Banners ──────────────────────────────────────────── */

  .note-locked-banner,
  .note-amending-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.85rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .note-locked-banner {
    background: linear-gradient(90deg, #dcfce7, #f0fdf4);
    color: #166534;
  }

  .note-amending-banner {
    background: linear-gradient(90deg, #dbeafe, #eff6ff);
    color: #1e40af;
  }

  .note-locked-banner__icon,
  .note-amending-banner__icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .note-locked-banner__text,
  .note-amending-banner__text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .note-locked-banner__text strong,
  .note-amending-banner__text strong {
    font-size: 0.85rem;
  }

  .note-locked-banner__text span,
  .note-amending-banner__text span {
    font-size: 0.78rem;
    opacity: 0.85;
  }

  /* Locked editor — gray out inputs */
  .note-editor--locked {
    pointer-events: none;
    opacity: 0.5;
    filter: grayscale(0.3);
  }

  @media (max-width: 860px) {
    .workspace-shell {
      height: auto;
      min-height: calc(100dvh - 72px - 28px);
    }

    .workspace-shell__main-stage {
      overflow-y: auto;
    }

    .note-editor__body {
      --editor-body-pad-x: 1rem;
    }

    .note-editor {
      height: auto;
    }

    .note-editor__body {
      min-height: 400px;
    }
  }
</style>
