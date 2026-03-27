<!--
  Workspace Editor — the main note-editing workspace with chart rail + sidebar.
  Ported from app/js/views/pt_workspace_v2.js
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ChartRail from '$lib/components/ChartRail.svelte';
  import ChartDetailPanel from '$lib/components/ChartDetailPanel.svelte';
  import PatientHeader from '$lib/components/PatientHeader.svelte';
  import PatientSummaryPanel from '$lib/components/PatientSummaryPanel.svelte';
  import SubjectiveSection from '$lib/components/SubjectiveSection.svelte';
  import ObjectiveSection from '$lib/components/ObjectiveSection.svelte';
  import AssessmentSection from '$lib/components/AssessmentSection.svelte';
  import PlanSection from '$lib/components/PlanSection.svelte';
  import BillingSection from '$lib/components/BillingSection.svelte';
  import { activeCase, loadActiveCase, clearActiveCase } from '$lib/stores/cases';
  import { activeChartTab, isPanelOpen, closePanel } from '$lib/stores/ui';
  import { initDraft, saveDraftNow, clearDraft, isDirty } from '$lib/stores/noteSession';
  import type { CaseObj } from '$lib/store';

  // SOAP sections
  const soapSections = [
    { id: 'subjective', label: 'Subjective', icon: 'S' },
    { id: 'objective', label: 'Objective', icon: 'O' },
    { id: 'assessment', label: 'Assessment', icon: 'A' },
    { id: 'plan', label: 'Plan', icon: 'P' },
    { id: 'billing', label: 'Billing', icon: 'B' },
  ] as const;

  let activeSection = $state('subjective');
  let caseLoaded = $state(false);
  let loadError = $state('');

  // Load case from URL params
  onMount(() => {
    const caseId = $page.url.searchParams.get('case');
    const encounter = $page.url.searchParams.get('encounter') ?? 'eval';

    if (!caseId) {
      loadError = 'No case ID specified.';
      return;
    }

    try {
      loadActiveCase(caseId, encounter);
      initDraft();
      caseLoaded = true;
    } catch {
      loadError = `Failed to load case "${caseId}".`;
    }
  });

  onDestroy(() => {
    if ($isDirty) saveDraftNow();
    clearDraft();
    clearActiveCase();
    closePanel();
  });

  const caseObj = $derived($activeCase.caseWrapper?.caseObj as CaseObj | undefined);

  function goBack() {
    if ($isDirty) saveDraftNow();
    goto('/workspace/cases');
  }

  function selectSection(sectionId: string) {
    activeSection = sectionId;
  }

  function handleSave() {
    saveDraftNow();
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
    <PatientHeader {caseObj} onBack={goBack} />

    <div class="workspace-shell__body">
      <!-- Chart rail -->
      <ChartRail />

      <!-- Detail panel (slides out from rail) -->
      <ChartDetailPanel>
        {#if $activeChartTab === 'patient-summary'}
          <PatientSummaryPanel {caseObj} />
        {:else if $activeChartTab === 'current-note'}
          <div class="panel-placeholder">
            <h3>Note Sections</h3>
            <nav class="section-nav" aria-label="SOAP sections">
              {#each soapSections as section}
                <button
                  class="section-nav__btn"
                  class:section-nav__btn--active={activeSection === section.id}
                  onclick={() => selectSection(section.id)}
                  type="button"
                >
                  <span class="section-nav__icon">{section.icon}</span>
                  <span class="section-nav__label">{section.label}</span>
                </button>
              {/each}
            </nav>
          </div>
        {:else if $activeChartTab === 'my-notes'}
          <div class="panel-placeholder">
            <p>My Notes panel — drafts and signed notes will appear here.</p>
          </div>
        {:else if $activeChartTab === 'case-file'}
          <div class="panel-placeholder">
            <p>Case File panel — artifacts and filed documents will appear here.</p>
          </div>
        {/if}
      </ChartDetailPanel>

      <!-- Main content area -->
      <div class="workspace-shell__main-stage" class:has-panel={$isPanelOpen}>
        <div class="note-editor">
          <div class="note-editor__header">
            <h2 class="note-editor__title">
              {soapSections.find((s) => s.id === activeSection)?.label ?? 'Note'}
            </h2>
            <span class="note-editor__encounter">
              {$activeCase.encounter === 'eval' ? 'Initial Evaluation' : $activeCase.encounter}
            </span>
            <div class="note-editor__actions">
              {#if $isDirty}
                <span class="save-indicator save-indicator--unsaved">Unsaved</span>
              {:else}
                <span class="save-indicator save-indicator--saved">Saved</span>
              {/if}
              <button type="button" class="btn btn--primary btn--sm" onclick={handleSave}>
                Save Draft
              </button>
            </div>
          </div>

          <!-- SOAP section tabs (mobile/inline) -->
          <nav class="soap-tabs" aria-label="SOAP sections">
            {#each soapSections as section}
              <button
                type="button"
                class="soap-tabs__btn"
                class:soap-tabs__btn--active={activeSection === section.id}
                onclick={() => selectSection(section.id)}
              >
                <span class="soap-tabs__icon">{section.icon}</span>
                <span class="soap-tabs__label">{section.label}</span>
              </button>
            {/each}
          </nav>

          <div class="note-editor__body">
            {#if activeSection === 'subjective'}
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
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .workspace-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .workspace-shell__body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .workspace-shell__main-stage {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
    background: var(--color-editor-bg, color-mix(in srgb, #eeeeee 80%, white));
    transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .workspace-shell__main-stage.has-panel {
    /* Content shifts when panel is open (not overlapping) */
  }

  .note-editor {
    max-width: clamp(900px, 82vw, 1200px);
    margin: 0 auto;
  }

  .note-editor__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0;
    padding: 0.625rem 1rem;
    background: linear-gradient(180deg, #424242 0%, #525252 100%);
    border-radius: 8px 8px 0 0;
    flex-wrap: wrap;
    color: white;
  }

  .note-editor__title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .note-editor__encounter {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .note-editor__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .save-indicator {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .save-indicator--unsaved {
    color: var(--color-brand-orange, #ff671f);
  }

  .save-indicator--saved {
    color: rgba(255, 255, 255, 0.7);
  }

  .note-editor__body {
    min-height: 400px;
    background: white;
    border-radius: 0 0 8px 8px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  /* SOAP section tabs — styled like original green section dividers */
  .soap-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 0;
    background: var(--color-section-divider, #009a44);
    overflow-x: auto;
    border-radius: 0;
  }

  .soap-tabs__btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1.25rem;
    min-height: 42px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    transition:
      color 0.12s,
      background 0.12s;
  }

  .soap-tabs__btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }

  .soap-tabs__btn--active {
    color: white;
    border-bottom-color: white;
    background: rgba(0, 0, 0, 0.12);
  }

  .soap-tabs__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.2);
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
  }

  .soap-tabs__btn--active .soap-tabs__icon {
    background: rgba(255, 255, 255, 0.35);
  }

  /* Section nav inside the detail panel */
  .section-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 0.75rem;
  }

  .section-nav__btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: 0.875rem;
    color: var(--color-neutral-700, #525252);
    transition: background 0.12s;
  }

  .section-nav__btn:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .section-nav__btn--active {
    background: var(--color-brand-green, #009a44);
    color: white;
    font-weight: 600;
  }

  .section-nav__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--color-neutral-200, #e0e0e0);
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .section-nav__btn--active .section-nav__icon {
    background: rgba(255, 255, 255, 0.25);
    color: white;
  }

  .panel-placeholder {
    font-size: 0.875rem;
  }

  .panel-placeholder h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .panel-placeholder p {
    color: var(--color-neutral-500, #737373);
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
</style>
