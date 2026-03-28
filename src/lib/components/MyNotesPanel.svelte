<!--
  MyNotesPanel — lists draft/signed/amended notes for the active case.
  Port of app/js/features/navigation/panels/MyNotesPanel.js.
-->
<script lang="ts">
  import type { NoteData, Signature } from '$lib/services/noteLifecycle';

  interface NoteEntry {
    id: string;
    title: string;
    encounter: number;
    encounterLabel?: string;
    status: 'draft' | 'signed' | 'amended';
    lastModified: string;
    signature?: Signature;
    data: NoteData;
  }

  interface Props {
    notes: NoteEntry[];
    onContinueEditing?: (note: NoteEntry) => void;
    onView?: (note: NoteEntry) => void;
    onAmend?: (note: NoteEntry) => void;
  }

  let { notes, onContinueEditing, onView, onAmend }: Props = $props();

  const drafts = $derived(notes.filter((n) => n.status === 'draft'));
  const signed = $derived(notes.filter((n) => n.status === 'signed' || n.status === 'amended'));

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function statusBadgeClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'badge--draft';
      case 'signed':
        return 'badge--signed';
      case 'amended':
        return 'badge--amended';
      default:
        return '';
    }
  }
</script>

<div class="my-notes">
  <h2 class="my-notes__title">My Notes</h2>

  <!-- Drafts -->
  {#if drafts.length > 0}
    <div class="my-notes__group">
      <h3 class="my-notes__group-title">Drafts</h3>
      {#each drafts as note}
        <div class="note-card">
          <div class="note-card__header">
            <span class="note-card__title">{note.title}</span>
            <span class="note-card__badge {statusBadgeClass(note.status)}">Draft</span>
          </div>
          <div class="note-card__meta">
            {note.encounterLabel ?? `Encounter ${note.encounter}`} · Last modified {formatDate(
              note.lastModified,
            )}
          </div>
          <div class="note-card__actions">
            {#if onContinueEditing}
              <button
                type="button"
                class="btn btn--primary btn--sm"
                onclick={() => onContinueEditing?.(note)}>Continue Editing</button
              >
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Signed Notes -->
  {#if signed.length > 0}
    <div class="my-notes__group">
      <h3 class="my-notes__group-title">Signed Notes</h3>
      {#each signed as note}
        <div class="note-card note-card--signed">
          <div class="note-card__header">
            <span class="note-card__title">{note.title}</span>
            <span class="note-card__badge {statusBadgeClass(note.status)}">
              {note.status === 'amended' ? 'Amended' : 'Signed'}
            </span>
          </div>
          <div class="note-card__meta">
            {note.encounterLabel ?? `Encounter ${note.encounter}`}
            {#if note.signature}
              · Signed by {note.signature.name}
              · {formatDate(note.signature.signedAt)}
            {/if}
          </div>
          <div class="note-card__actions">
            {#if onView}
              <button
                type="button"
                class="btn btn--secondary btn--sm"
                onclick={() => onView?.(note)}>View</button
              >
            {/if}
            {#if onAmend}
              <button type="button" class="btn btn--outline btn--sm" onclick={() => onAmend?.(note)}
                >Amend</button
              >
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if notes.length === 0}
    <p class="my-notes__empty">No notes for this case yet.</p>
  {/if}
</div>

<style>
  .my-notes {
    padding: 1rem;
  }

  .my-notes__title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .my-notes__group {
    margin-bottom: 1.25rem;
  }

  .my-notes__group-title {
    margin: 0 0 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-neutral-500, #9e9e9e);
  }

  .note-card {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    background: var(--color-surface, #ffffff);
  }

  .note-card--signed {
    border-left: 3px solid var(--color-brand-green, #009a44);
  }

  .note-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .note-card__title {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .note-card__badge {
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .badge--draft {
    background: #fef3c7;
    color: #92400e;
  }

  .badge--signed {
    background: #dcfce7;
    color: #166534;
  }

  .badge--amended {
    background: #dbeafe;
    color: #1e40af;
  }

  .note-card__meta {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #9e9e9e);
    margin-bottom: 0.5rem;
  }

  .note-card__actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .btn--sm {
    padding: 0.3rem 0.625rem;
    font-size: 0.75rem;
  }

  .btn--primary {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--primary:hover {
    background: #007a35;
  }

  .btn--secondary {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-700, #616161);
  }

  .btn--secondary:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .btn--outline {
    background: transparent;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    color: var(--color-neutral-700, #616161);
  }

  .btn--outline:hover {
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }

  .my-notes__empty {
    font-size: 0.875rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
  }
</style>
