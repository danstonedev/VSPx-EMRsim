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
  import { activeCase, loadActiveCase, saveActiveDraft, clearActiveCase } from '$lib/stores/cases';
  import { activeChartTab, isPanelOpen, closePanel } from '$lib/stores/ui';
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
      caseLoaded = true;
    } catch {
      loadError = `Failed to load case "${caseId}".`;
    }
  });

  onDestroy(() => {
    clearActiveCase();
    closePanel();
  });

  const caseObj = $derived($activeCase.caseWrapper?.caseObj as CaseObj | undefined);
  const draft = $derived($activeCase.draft ?? {});

  function goBack() {
    goto('/workspace/cases');
  }

  function selectSection(sectionId: string) {
    activeSection = sectionId;
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
          </div>

          <div class="note-editor__body">
            {#if activeSection === 'subjective'}
              <div class="section-content">
                <h3>Chief Complaint</h3>
                <p>{caseObj.history?.chief_complaint ?? 'Not documented'}</p>

                <h3>History of Present Illness</h3>
                <p>{caseObj.history?.hpi ?? 'Not documented'}</p>

                {#if caseObj.history?.pain}
                  <h3>Pain Assessment</h3>
                  <dl class="clinical-data">
                    {#each Object.entries(caseObj.history.pain) as [key, value]}
                      <div class="clinical-data__row">
                        <dt>{key.replace(/_/g, ' ')}</dt>
                        <dd>{value}</dd>
                      </div>
                    {/each}
                  </dl>
                {/if}

                {#if caseObj.history?.functional_goals?.length}
                  <h3>Patient Goals</h3>
                  <ul>
                    {#each caseObj.history.functional_goals as goal}
                      <li>{goal}</li>
                    {/each}
                  </ul>
                {/if}
              </div>
            {:else if activeSection === 'objective'}
              <div class="section-content">
                {#if caseObj.findings?.vitals}
                  <h3>Vital Signs</h3>
                  <dl class="clinical-data">
                    {#each Object.entries(caseObj.findings.vitals) as [key, value]}
                      <div class="clinical-data__row">
                        <dt>{key.toUpperCase()}</dt>
                        <dd>{value}</dd>
                      </div>
                    {/each}
                  </dl>
                {/if}

                {#if caseObj.findings?.gait}
                  <h3>Gait Assessment</h3>
                  <dl class="clinical-data">
                    {#each Object.entries(caseObj.findings.gait) as [key, value]}
                      <div class="clinical-data__row">
                        <dt>{key.replace(/_/g, ' ')}</dt>
                        <dd>{value}</dd>
                      </div>
                    {/each}
                  </dl>
                {/if}

                <p class="placeholder-hint">
                  Full objective editor (ROM tables, MMT, special tests) will be ported in the next
                  phase.
                </p>
              </div>
            {:else if activeSection === 'assessment'}
              <div class="section-content">
                <p class="placeholder-hint">
                  Assessment section editor — clinical reasoning, ICF classification, and PT
                  diagnosis will be ported in the next phase.
                </p>
              </div>
            {:else if activeSection === 'plan'}
              <div class="section-content">
                <p class="placeholder-hint">
                  Plan section editor — goals, treatment plan, and HEP will be ported in the next
                  phase.
                </p>
              </div>
            {:else if activeSection === 'billing'}
              <div class="section-content">
                <p class="placeholder-hint">
                  Billing section — ICD-10/CPT codes and orders will be ported in the next phase.
                </p>
              </div>
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
    transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .workspace-shell__main-stage.has-panel {
    /* Content shifts when panel is open (not overlapping) */
  }

  .note-editor {
    max-width: 800px;
    margin: 0 auto;
  }

  .note-editor__header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--color-brand-600, #16a34a);
  }

  .note-editor__title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-neutral-900, #171717);
  }

  .note-editor__encounter {
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #737373);
    font-weight: 500;
  }

  .note-editor__body {
    min-height: 400px;
  }

  .section-content h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem;
    color: var(--color-neutral-700, #404040);
  }

  .section-content h3:first-child {
    margin-top: 0;
  }

  .section-content p {
    line-height: 1.6;
    margin: 0 0 0.75rem;
  }

  .section-content ul {
    margin: 0 0 0.75rem;
    padding-left: 1.25rem;
  }

  .section-content li {
    margin-bottom: 0.25rem;
    line-height: 1.5;
  }

  .clinical-data {
    margin: 0 0 1rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .clinical-data__row {
    display: flex;
    gap: 0.75rem;
    padding: 0.375rem 0;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .clinical-data__row dt {
    flex-shrink: 0;
    width: 10rem;
    font-weight: 500;
    font-size: 0.8125rem;
    color: var(--color-neutral-600, #525252);
    text-transform: capitalize;
  }

  .clinical-data__row dd {
    margin: 0;
    font-size: 0.875rem;
  }

  .placeholder-hint {
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    padding: 2rem 0;
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
    border-radius: 0.375rem;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: 0.875rem;
    color: var(--color-neutral-700, #404040);
    transition: background 0.12s;
  }

  .section-nav__btn:hover {
    background: var(--color-neutral-200, #e5e5e5);
  }

  .section-nav__btn--active {
    background: var(--color-brand-100, #dcfce7);
    color: var(--color-brand-800, #166534);
    font-weight: 600;
  }

  .section-nav__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--color-neutral-200, #e5e5e5);
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .section-nav__btn--active .section-nav__icon {
    background: var(--color-brand-600, #16a34a);
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

  .btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  .btn--primary {
    background: var(--color-brand-600, #16a34a);
    color: white;
  }

  .btn--primary:hover {
    background: var(--color-brand-700, #15803d);
  }
</style>
