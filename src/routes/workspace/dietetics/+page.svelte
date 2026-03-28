<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { manifestCases, cases, loadAllCases } from '$lib/stores/cases';
  import { chartRecords } from '$lib/stores/chartRecords';
  import {
    buildMyNotesEntries,
    getChartCaseContext,
    type MyNotesEntry,
  } from '$lib/services/chartRecords';
  import type { ManifestCase } from '$lib/manifest';
  import type { CaseWrapper } from '$lib/store';

  let loading = $state(true);
  let search = $state('');
  let selectedCaseId = $state('');

  onMount(async () => {
    await loadAllCases();
    if ($manifestCases[0]?.id) {
      selectedCaseId = $manifestCases[0].id;
    } else if (($cases[0] as CaseWrapper | undefined)?.id) {
      selectedCaseId = ($cases[0] as CaseWrapper).id;
    }
    loading = false;
  });

  const caseOptions = $derived.by(() => {
    const map = new Map<string, ManifestCase>();
    for (const item of $manifestCases) {
      map.set(item.id, item);
    }
    for (const wrapper of $cases as CaseWrapper[]) {
      if (!map.has(wrapper.id)) {
        map.set(wrapper.id, {
          id: wrapper.id,
          title:
            (typeof wrapper.caseObj.title === 'string' && wrapper.caseObj.title) ||
            (typeof wrapper.caseObj.patientName === 'string' && wrapper.caseObj.patientName) ||
            wrapper.id,
          file: '',
          category:
            typeof wrapper.caseObj.diagnosis === 'string' ? wrapper.caseObj.diagnosis : 'local',
        });
      }
    }

    const query = search.trim().toLowerCase();
    const options = [...map.values()];
    return options.filter((item) => {
      if (!query) return true;
      const title = (item.title ?? item.id).toLowerCase();
      const category = (item.category ?? '').toLowerCase();
      return (
        title.includes(query) || category.includes(query) || item.id.toLowerCase().includes(query)
      );
    });
  });

  const selectedCase = $derived(
    caseOptions.find((item) => item.id === selectedCaseId) ??
      $manifestCases.find((item) => item.id === selectedCaseId) ??
      null,
  );

  const selectedWrapper = $derived(
    ($cases as CaseWrapper[]).find((wrapper) => wrapper.id === selectedCaseId) ?? null,
  );

  const selectedContext = $derived.by(() => {
    void $chartRecords;
    if (!selectedCaseId) return null;
    return getChartCaseContext(selectedCaseId, selectedWrapper?.caseObj);
  });

  const selectedNotes = $derived.by(() => {
    void $chartRecords;
    if (!selectedCaseId) return [] as MyNotesEntry[];
    return buildMyNotesEntries(selectedCaseId).sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
    );
  });

  const latestNote = $derived(selectedNotes[0] ?? null);

  function openSharedChart(encounterKey = 'eval'): void {
    if (!selectedCaseId) return;
    goto(
      `/workspace/editor?case=${encodeURIComponent(selectedCaseId)}&encounter=${encodeURIComponent(encounterKey)}`,
    );
  }

  function openNoteHistory(note: MyNotesEntry): void {
    goto(
      `/workspace/editor?case=${encodeURIComponent(selectedCaseId)}&encounter=${encodeURIComponent(note.encounterKey)}&tab=my-notes&note=${encodeURIComponent(note.id)}`,
    );
  }

  function encounterLabel(encounterKey: string): string {
    const labels: Record<string, string> = {
      eval: 'Initial Evaluation',
      followup: 'Follow-Up',
      soap: 'SOAP Progress',
      discharge: 'Discharge Summary',
    };
    return labels[encounterKey] ?? encounterKey;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
</script>

<svelte:head>
  <title>Multidisciplinary Workspace | UND EMR-Sim</title>
</svelte:head>

<section class="multi-page">
  <header class="multi-hero">
    <div class="multi-hero__copy">
      <p class="multi-hero__eyebrow">Multidisciplinary V2</p>
      <h1>Shared Chart Workflow</h1>
      <p>
        Launch the shared chart, review note history, and manage a patient-centered chart record
        that can span PT and Dietetics workflows.
      </p>
    </div>
    <div class="multi-hero__actions">
      <a href="/workspace/drafts" class="btn btn--ghost">Note Management</a>
      <a href="/workspace/registry" class="btn btn--ghost">VSP Registry</a>
    </div>
  </header>

  <div class="status-banner">
    <strong>Current state:</strong>
    PT and Dietetics note editing, preview-before-sign, signed-note history, case-file merge, and DOCX
    export are live in the shared workspace.
  </div>

  <div class="multi-layout">
    <aside class="case-chooser">
      <div class="panel-header">
        <h2>Patient Cases</h2>
        <span>{caseOptions.length}</span>
      </div>

      <input
        type="search"
        class="search-input"
        bind:value={search}
        placeholder="Search cases..."
        aria-label="Search cases"
      />

      {#if loading}
        <p class="panel-empty">Loading cases...</p>
      {:else if caseOptions.length === 0}
        <p class="panel-empty">No cases available yet.</p>
      {:else}
        <div class="case-list">
          {#each caseOptions as item (item.id)}
            <button
              type="button"
              class="case-option"
              class:case-option--active={selectedCaseId === item.id}
              onclick={() => (selectedCaseId = item.id)}
            >
              <span class="case-option__title">{item.title ?? item.id}</span>
              <span class="case-option__meta">{item.category ?? item.id}</span>
            </button>
          {/each}
        </div>
      {/if}
    </aside>

    <div class="workspace-summary">
      {#if !selectedCase}
        <div class="summary-empty">
          <h2>Select a case</h2>
          <p>Choose a patient case to inspect its cross-discipline chart activity.</p>
        </div>
      {:else}
        <section class="summary-card">
          <div class="summary-card__header">
            <div>
              <p class="summary-card__eyebrow">Selected Case</p>
              <h2>{selectedCase.title ?? selectedCase.id}</h2>
              <p class="summary-card__meta">{selectedCase.category ?? 'shared chart case'}</p>
            </div>
            <div class="summary-card__actions">
              <button
                type="button"
                class="btn btn--primary"
                onclick={() => openSharedChart('eval')}
              >
                Open Shared Chart
              </button>
              <button
                type="button"
                class="btn btn--ghost"
                onclick={() => goto('/workspace/drafts')}
              >
                Open Note Hub
              </button>
            </div>
          </div>

          <div class="stats-grid">
            <article class="stat-card">
              <span class="stat-card__label">Encounters</span>
              <strong>{selectedContext?.encounters.length ?? 0}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-card__label">Draft Notes</span>
              <strong>{selectedContext?.draftNotes.length ?? 0}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-card__label">Signed Notes</span>
              <strong>{selectedContext?.signedNotes.length ?? 0}</strong>
            </article>
            <article class="stat-card">
              <span class="stat-card__label">Artifacts</span>
              <strong>{selectedContext?.artifacts.length ?? 0}</strong>
            </article>
          </div>
        </section>

        <section class="discipline-grid">
          <article class="discipline-card">
            <p class="discipline-card__eyebrow">PT Workflow</p>
            <h3>SOAP workspace ready</h3>
            <p>
              Initial eval, follow-up, SOAP progress, discharge, sign, export, and note history run
              through the shared chart.
            </p>
            <button type="button" class="btn btn--ghost" onclick={() => openSharedChart('eval')}>
              Launch PT Note
            </button>
          </article>

          <article class="discipline-card discipline-card--alt">
            <p class="discipline-card__eyebrow">Dietetics Workflow</p>
            <h3>Shared ADIME workspace ready</h3>
            <p>
              Dietetics notes now run through the shared chart editor, including preview, sign,
              export, and note history.
            </p>
            <button
              type="button"
              class="btn btn--ghost"
              onclick={() => openSharedChart('nutrition')}
            >
              Launch Dietetics Note
            </button>
          </article>
        </section>

        <section class="summary-card">
          <div class="panel-header">
            <h2>Recent Note Activity</h2>
            <span>{selectedNotes.length}</span>
          </div>

          {#if latestNote}
            <div class="latest-note">
              <div>
                <p class="latest-note__label">Most Recent</p>
                <h3>{latestNote.title}</h3>
                <p>
                  {encounterLabel(latestNote.encounterKey)} · {latestNote.status} · {formatDate(
                    latestNote.lastModified,
                  )}
                </p>
              </div>
              <button
                type="button"
                class="btn btn--primary"
                onclick={() => openNoteHistory(latestNote)}
              >
                Open Note
              </button>
            </div>
          {/if}

          {#if selectedNotes.length === 0}
            <p class="panel-empty">No note activity yet for this case.</p>
          {:else}
            <div class="note-list">
              {#each selectedNotes as note (note.id)}
                <button type="button" class="note-row" onclick={() => openNoteHistory(note)}>
                  <span>
                    <strong>{note.title}</strong>
                    <small>{encounterLabel(note.encounterKey)}</small>
                  </span>
                  <span class="note-row__meta">{formatDate(note.lastModified)}</span>
                </button>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
    </div>
  </div>
</section>

<style>
  .multi-page {
    max-width: 1220px;
    margin: 0 auto;
    padding: 2rem;
  }

  .multi-hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .multi-hero__eyebrow {
    margin: 0 0 0.4rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 700;
    color: var(--color-brand-green, #009a44);
  }

  .multi-hero h1 {
    margin: 0;
    font-size: 1.9rem;
  }

  .multi-hero p {
    margin: 0.55rem 0 0;
    max-width: 52rem;
    color: var(--color-neutral-600, #525252);
  }

  .multi-hero__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .status-banner {
    margin-bottom: 1.25rem;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: linear-gradient(90deg, rgba(0, 154, 68, 0.12), rgba(244, 244, 245, 0.92));
    border: 1px solid rgba(0, 154, 68, 0.2);
    color: var(--color-neutral-700, #404040);
  }

  .multi-layout {
    display: grid;
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    gap: 1.25rem;
  }

  .case-chooser,
  .summary-card {
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 16px;
    background: var(--color-surface, #ffffff);
  }

  .case-chooser {
    padding: 1rem;
    align-self: start;
    position: sticky;
    top: 88px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.85rem;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1rem;
  }

  .panel-header span {
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-600, #525252);
  }

  .search-input {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 10px;
    margin-bottom: 0.9rem;
  }

  .search-input:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .case-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    max-height: 65vh;
    overflow-y: auto;
  }

  .case-option {
    padding: 0.85rem 0.95rem;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 12px;
    background: var(--color-neutral-50, #fafafa);
    text-align: left;
    cursor: pointer;
  }

  .case-option--active {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.06);
  }

  .case-option__title {
    display: block;
    font-weight: 700;
  }

  .case-option__meta {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.78rem;
    color: var(--color-neutral-500, #737373);
  }

  .workspace-summary {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .summary-card {
    padding: 1rem;
  }

  .summary-card__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .summary-card__eyebrow {
    margin: 0 0 0.3rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-neutral-500, #737373);
  }

  .summary-card__header h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  .summary-card__meta {
    margin: 0.35rem 0 0;
    color: var(--color-neutral-600, #525252);
  }

  .summary-card__actions {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
  }

  .stats-grid,
  .discipline-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .stat-card,
  .discipline-card {
    padding: 1rem;
    border-radius: 14px;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    background: var(--color-neutral-50, #fafafa);
  }

  .stat-card__label,
  .discipline-card__eyebrow,
  .latest-note__label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-neutral-500, #737373);
    margin-bottom: 0.35rem;
  }

  .stat-card strong {
    font-size: 1.45rem;
  }

  .discipline-card h3,
  .latest-note h3 {
    margin: 0 0 0.4rem;
    font-size: 1.05rem;
  }

  .discipline-card p,
  .latest-note p,
  .panel-empty {
    margin: 0;
    color: var(--color-neutral-600, #525252);
  }

  .discipline-card--alt {
    background: linear-gradient(180deg, rgba(0, 154, 68, 0.06), rgba(255, 255, 255, 0.98));
  }

  .discipline-card .btn {
    margin-top: 0.9rem;
  }

  .latest-note {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    background: rgba(0, 154, 68, 0.05);
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .note-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .note-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 0.85rem 0.95rem;
    border-radius: 12px;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    background: var(--color-surface, #ffffff);
    text-align: left;
    cursor: pointer;
  }

  .note-row span {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .note-row small,
  .note-row__meta {
    color: var(--color-neutral-500, #737373);
  }

  .summary-empty {
    padding: 3rem 1.5rem;
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 16px;
    text-align: center;
    background: var(--color-neutral-50, #fafafa);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.6rem 0.95rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid transparent;
    text-decoration: none;
    cursor: pointer;
  }

  .btn--primary {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--ghost {
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-700, #404040);
    border-color: var(--color-neutral-300, #d4d4d4);
  }

  @media (max-width: 980px) {
    .multi-page {
      padding: 1.25rem;
    }

    .multi-layout {
      grid-template-columns: 1fr;
    }

    .case-chooser {
      position: static;
    }
  }

  @media (max-width: 700px) {
    .stats-grid,
    .discipline-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
