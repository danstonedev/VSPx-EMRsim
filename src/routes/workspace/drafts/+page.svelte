<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { manifestCases, cases, loadAllCases } from '$lib/stores/cases';
  import { chartRecords } from '$lib/stores/chartRecords';
  import { buildMyNotesEntries, type MyNotesEntry } from '$lib/services/chartRecords';
  import type { CaseWrapper } from '$lib/store';

  interface NoteIndexEntry extends MyNotesEntry {
    caseId: string;
    caseLabel: string;
  }

  let search = $state('');
  let loading = $state(true);

  onMount(async () => {
    await loadAllCases();
    loading = false;
  });

  const caseLabelMap = $derived.by(() => {
    const map = new Map<string, string>();

    for (const item of $manifestCases) {
      map.set(item.id, item.title ?? item.id);
    }

    for (const wrapper of $cases as CaseWrapper[]) {
      const caseObj = wrapper.caseObj ?? {};
      const title =
        (typeof caseObj.title === 'string' && caseObj.title) ||
        (typeof caseObj.patientName === 'string' && caseObj.patientName) ||
        wrapper.id;
      map.set(wrapper.id, title);
    }

    return map;
  });

  const allNotes = $derived.by(() => {
    void $chartRecords;

    const entries: NoteIndexEntry[] = [];
    for (const [caseId, caseLabel] of caseLabelMap.entries()) {
      for (const note of buildMyNotesEntries(caseId)) {
        entries.push({ ...note, caseId, caseLabel });
      }
    }

    return entries.sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
    );
  });

  const filteredNotes = $derived.by(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allNotes;
    return allNotes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.caseLabel.toLowerCase().includes(query) ||
        note.encounterKey.toLowerCase().includes(query) ||
        note.status.toLowerCase().includes(query)
      );
    });
  });

  const drafts = $derived(filteredNotes.filter((note) => note.status === 'draft'));
  const signedNotes = $derived(filteredNotes.filter((note) => note.status !== 'draft'));

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

  function encounterLabel(encounterKey: string): string {
    const labels: Record<string, string> = {
      eval: 'Initial Evaluation',
      followup: 'Follow-Up',
      soap: 'SOAP Progress',
      discharge: 'Discharge Summary',
    };
    return labels[encounterKey] ?? encounterKey;
  }

  function resumeDraft(note: NoteIndexEntry): void {
    goto(
      `/workspace/editor?case=${encodeURIComponent(note.caseId)}&encounter=${encodeURIComponent(note.encounterKey)}&tab=current-note`,
    );
  }

  function openSignedNote(note: NoteIndexEntry): void {
    goto(
      `/workspace/editor?case=${encodeURIComponent(note.caseId)}&encounter=${encodeURIComponent(note.encounterKey)}&tab=my-notes&note=${encodeURIComponent(note.id)}`,
    );
  }

  function openChart(note: NoteIndexEntry): void {
    goto(
      `/workspace/editor?case=${encodeURIComponent(note.caseId)}&encounter=${encodeURIComponent(note.encounterKey)}`,
    );
  }
</script>

<svelte:head>
  <title>My Drafts | UND EMR-Sim</title>
</svelte:head>

<section class="drafts-page">
  <header class="drafts-hero">
    <div>
      <p class="drafts-hero__eyebrow">Note Management</p>
      <h1>Drafts and Signed Notes</h1>
      <p class="drafts-hero__subtitle">
        Resume in-progress documentation, review signed notes, and jump back into the shared chart
        workflow.
      </p>
    </div>
    <div class="drafts-hero__actions">
      <a href="/workspace" class="btn btn--ghost">Open Workspace</a>
      <a href="/workspace/registry" class="btn btn--ghost">VSP Registry</a>
    </div>
  </header>

  <div class="drafts-toolbar">
    <input
      type="search"
      bind:value={search}
      class="drafts-search"
      placeholder="Search by patient, note title, encounter, or status..."
      aria-label="Search notes"
    />
    <div class="drafts-summary">
      <span>{drafts.length} draft{drafts.length === 1 ? '' : 's'}</span>
      <span>{signedNotes.length} signed/amended</span>
    </div>
  </div>

  {#if loading}
    <div class="drafts-empty">
      <h2>Loading note index...</h2>
      <p>Gathering cases, drafts, and signed notes.</p>
    </div>
  {:else if filteredNotes.length === 0}
    <div class="drafts-empty">
      <h2>No note records found</h2>
      <p>
        {search
          ? `No drafts or signed notes matched "${search}".`
          : 'Start from the workspace to create your first draft or signed note.'}
      </p>
      <a href="/workspace" class="btn btn--primary">Start Documentation</a>
    </div>
  {:else}
    <div class="drafts-grid">
      <section class="drafts-column">
        <div class="column-header">
          <h2>Active Drafts</h2>
          <span class="column-count">{drafts.length}</span>
        </div>

        {#if drafts.length === 0}
          <p class="column-empty">No active drafts right now.</p>
        {:else}
          {#each drafts as note (note.id)}
            <article class="note-card note-card--draft">
              <div class="note-card__header">
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.caseLabel}</p>
                </div>
                <span class="status-pill status-pill--draft">Draft</span>
              </div>
              <div class="note-card__meta">
                <span>{encounterLabel(note.encounterKey)}</span>
                <span>Updated {formatDate(note.lastModified)}</span>
              </div>
              <div class="note-card__actions">
                <button type="button" class="btn btn--primary" onclick={() => resumeDraft(note)}>
                  Resume Draft
                </button>
                <button type="button" class="btn btn--ghost" onclick={() => openChart(note)}>
                  Open Chart
                </button>
              </div>
            </article>
          {/each}
        {/if}
      </section>

      <section class="drafts-column">
        <div class="column-header">
          <h2>Signed Note History</h2>
          <span class="column-count">{signedNotes.length}</span>
        </div>

        {#if signedNotes.length === 0}
          <p class="column-empty">No signed notes yet.</p>
        {:else}
          {#each signedNotes as note (note.id)}
            <article class="note-card note-card--signed">
              <div class="note-card__header">
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.caseLabel}</p>
                </div>
                <span class="status-pill status-pill--signed">
                  {note.status === 'amended' ? 'Amended' : 'Signed'}
                </span>
              </div>
              <div class="note-card__meta">
                <span>{encounterLabel(note.encounterKey)}</span>
                <span>{formatDate(note.lastModified)}</span>
              </div>
              {#if note.signature}
                <p class="note-card__signature">
                  Signed by {note.signature.name}{note.signature.title
                    ? `, ${note.signature.title}`
                    : ''}
                </p>
              {/if}
              <div class="note-card__actions">
                <button type="button" class="btn btn--primary" onclick={() => openSignedNote(note)}>
                  View Signed Note
                </button>
                <button type="button" class="btn btn--ghost" onclick={() => openChart(note)}>
                  Open Chart
                </button>
              </div>
            </article>
          {/each}
        {/if}
      </section>
    </div>
  {/if}
</section>

<style>
  .drafts-page {
    max-width: 1180px;
    margin: 0 auto;
    padding: 2rem;
  }

  .drafts-hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .drafts-hero__eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 700;
    color: var(--color-brand-green, #009a44);
  }

  .drafts-hero h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .drafts-hero__subtitle {
    margin: 0.5rem 0 0;
    max-width: 54rem;
    color: var(--color-neutral-600, #525252);
  }

  .drafts-hero__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .drafts-toolbar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .drafts-search {
    flex: 1 1 340px;
    min-width: 260px;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .drafts-search:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .drafts-summary {
    display: flex;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--color-neutral-600, #525252);
    flex-wrap: wrap;
  }

  .drafts-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .drafts-column {
    padding: 1rem;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 248, 248, 0.98));
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .column-header h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .column-count {
    min-width: 2rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-600, #525252);
    font-size: 0.78rem;
    text-align: center;
  }

  .column-empty,
  .drafts-empty p {
    color: var(--color-neutral-600, #525252);
  }

  .note-card {
    padding: 1rem;
    border-radius: 14px;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    background: var(--color-surface, #ffffff);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.04);
  }

  .note-card + .note-card {
    margin-top: 0.85rem;
  }

  .note-card--draft {
    border-left: 4px solid #d97706;
  }

  .note-card--signed {
    border-left: 4px solid var(--color-brand-green, #009a44);
  }

  .note-card__header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .note-card__header h3 {
    margin: 0;
    font-size: 0.98rem;
  }

  .note-card__header p {
    margin: 0.3rem 0 0;
    font-size: 0.82rem;
    color: var(--color-neutral-500, #737373);
  }

  .note-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.85rem;
    font-size: 0.8rem;
    color: var(--color-neutral-500, #737373);
  }

  .note-card__signature {
    margin: 0.85rem 0 0;
    font-size: 0.82rem;
    color: var(--color-neutral-700, #404040);
  }

  .note-card__actions {
    display: flex;
    gap: 0.65rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .status-pill--draft {
    background: #fef3c7;
    color: #92400e;
  }

  .status-pill--signed {
    background: #dcfce7;
    color: #166534;
  }

  .drafts-empty {
    padding: 3rem 1.5rem;
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 16px;
    text-align: center;
    background: var(--color-neutral-50, #fafafa);
  }

  .drafts-empty h2 {
    margin: 0 0 0.5rem;
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

  @media (max-width: 860px) {
    .drafts-page {
      padding: 1.25rem;
    }

    .drafts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
