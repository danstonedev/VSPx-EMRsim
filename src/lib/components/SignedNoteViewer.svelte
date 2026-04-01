<!--
  SignedNoteViewer - read-only rendering of a signed/locked note.
  Uses the shared note presentation model and shared note renderer.
-->
<script lang="ts">
  import NotePresentationRenderer from '$lib/components/NotePresentationRenderer.svelte';
  import { buildNoteCssVars } from '$lib/services/noteAppearance';
  import type { Amendment, NoteData, Signature } from '$lib/services/noteLifecycle';
  import { buildNotePresentation } from '$lib/services/notePresentation';

  interface Props {
    note: NoteData;
    patientName?: string;
    onAmend?: () => void;
    onBack?: () => void;
  }

  let { note, patientName = '', onAmend, onBack }: Props = $props();

  const signature = $derived(note.meta?.signature as Signature | undefined);
  const amendments = $derived((note.amendments ?? []) as Amendment[]);
  const presentationSections = $derived(buildNotePresentation(note, 'export'));
  const noteThemeVars = buildNoteCssVars();

  const noteHeading = $derived.by(() => {
    const explicitTitle =
      typeof note.noteTitle === 'string' && note.noteTitle.trim() ? note.noteTitle.trim() : '';
    const explicitType =
      typeof note.noteType === 'string' && note.noteType.trim() ? note.noteType.trim() : '';
    if (explicitTitle) return explicitTitle;
    if (explicitType) return explicitType;
    return 'Clinical Note';
  });

  const noteSubheading = $derived.by(() => {
    const explicitType =
      typeof note.noteType === 'string' && note.noteType.trim() ? note.noteType.trim() : '';
    if (explicitType && explicitType !== noteHeading) return explicitType;
    if ('nutrition_assessment' in note) return 'Dietetics ADIME Note';
    return 'Finalized Read-Only Record';
  });

  const signedAtLabel = $derived.by(() => {
    const value =
      signature?.signedAt ??
      (typeof note.meta?.signedAt === 'string' ? note.meta.signedAt : undefined) ??
      '';
    return formatDate(value) || 'Not signed';
  });

  function formatDate(iso: string): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString();
  }
</script>

<div class="signed-note-shell" style={noteThemeVars}>
  <article class="signed-note-page" aria-label="Signed note">
    <header class="signed-note-page__header">
      <div class="signed-note-page__eyebrow">Finalized Clinical Document</div>
      <div class="signed-note-page__title-row">
        <div>
          <h2 class="signed-note-page__title">{noteHeading}</h2>
          <p class="signed-note-page__subtitle">{noteSubheading}</p>
        </div>
        <div class="signed-note-page__status">Read Only</div>
      </div>

      <div class="signed-note-page__meta">
        {#if patientName}
          <div class="signed-note-page__meta-item">
            <span class="signed-note-page__meta-label">Patient</span>
            <span class="signed-note-page__meta-value">{patientName}</span>
          </div>
        {/if}
        <div class="signed-note-page__meta-item">
          <span class="signed-note-page__meta-label">Signed</span>
          <span class="signed-note-page__meta-value">{signedAtLabel}</span>
        </div>
        <div class="signed-note-page__meta-item">
          <span class="signed-note-page__meta-label">Version</span>
          <span class="signed-note-page__meta-value"
            >{signature?.version ?? note.meta?.version ?? 1}</span
          >
        </div>
      </div>
    </header>

    <div class="signed-note-page__body">
      {#if presentationSections.length > 0}
        <NotePresentationRenderer sections={presentationSections} variant="document" />
      {:else}
        <p class="signed-note-page__empty">
          No populated note fields are available for this record.
        </p>
      {/if}

      <section class="signed-note-section">
        <h3 class="signed-note-section__title">Electronic Signature</h3>
        {#if signature}
          <div class="signed-note-signature">
            <div class="signed-note-signature__row">
              <span class="signed-note-label">Signed By</span>
              <span class="signed-note-value">{signature.name}</span>
            </div>
            <div class="signed-note-signature__row">
              <span class="signed-note-label">Title</span>
              <span class="signed-note-value">{signature.title}</span>
            </div>
            <div class="signed-note-signature__row">
              <span class="signed-note-label">Signed At</span>
              <span class="signed-note-value">{formatDate(signature.signedAt)}</span>
            </div>
            {#if signature.licenseType}
              <div class="signed-note-signature__row">
                <span class="signed-note-label">License Type</span>
                <span class="signed-note-value">{signature.licenseType}</span>
              </div>
            {/if}
            {#if signature.licenseNumber}
              <div class="signed-note-signature__row">
                <span class="signed-note-label">License Number</span>
                <span class="signed-note-value">{signature.licenseNumber}</span>
              </div>
            {/if}
            {#if signature.credentials}
              <div class="signed-note-signature__row">
                <span class="signed-note-label">Credentials</span>
                <span class="signed-note-value">{signature.credentials}</span>
              </div>
            {/if}
          </div>
        {:else}
          <p class="signed-note-page__empty">No electronic signature was recorded for this note.</p>
        {/if}
      </section>

      {#if amendments.length > 0}
        <section class="signed-note-section">
          <h3 class="signed-note-section__title">Amendment History</h3>
          <div class="signed-note-amendments">
            {#each amendments as amend, i}
              <article class="signed-note-amendment">
                <div class="signed-note-amendment__title">Amendment {i + 1}</div>
                <div class="signed-note-amendment__body">
                  <div class="signed-note-amendment__row">
                    <span class="signed-note-label">Reason</span>
                    <span class="signed-note-value">{amend.reason}</span>
                  </div>
                  <div class="signed-note-amendment__row">
                    <span class="signed-note-label">Previous Signer</span>
                    <span class="signed-note-value">{amend.previousSignature.name}</span>
                  </div>
                  <div class="signed-note-amendment__row">
                    <span class="signed-note-label">Amended At</span>
                    <span class="signed-note-value">{formatDate(amend.amendedAt)}</span>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </article>

  {#if onBack || onAmend}
    <div class="signed-note-actions">
      {#if onBack}
        <button type="button" class="signed-note-button signed-note-button--ghost" onclick={onBack}>
          Back to Note History
        </button>
      {/if}
      {#if onAmend}
        <button
          type="button"
          class="signed-note-button signed-note-button--primary"
          onclick={onAmend}
        >
          Amend Note
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .signed-note-shell {
    display: grid;
    gap: 1rem;
    min-height: 100%;
    padding-bottom: 0.5rem;
  }

  .signed-note-page {
    background: var(--note-page-bg);
    border: 1px solid var(--note-border-soft);
    border-radius: var(--note-radius-shell);
    box-shadow: var(--note-shadow-page);
    overflow: hidden;
  }

  .signed-note-page__header {
    padding: 1.3rem 1.4rem 1rem;
    border-bottom: 1px solid var(--note-border-soft);
    background: var(--note-page-header-bg);
  }

  .signed-note-page__eyebrow {
    margin-bottom: 0.45rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--note-muted-soft);
  }

  .signed-note-page__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .signed-note-page__title {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 700;
    color: var(--note-ink);
  }

  .signed-note-page__subtitle {
    margin: 0.22rem 0 0;
    font-size: 0.92rem;
    color: var(--note-muted);
  }

  .signed-note-page__status {
    flex-shrink: 0;
    padding: 0.42rem 0.72rem;
    border-radius: var(--note-radius-pill);
    border: 1px solid var(--note-success-border);
    background: var(--note-success-bg);
    color: var(--note-accent-dark);
    font-size: 0.73rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .signed-note-page__meta {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    margin-top: 1rem;
  }

  .signed-note-page__meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .signed-note-page__meta-label,
  .signed-note-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--note-muted-soft);
  }

  .signed-note-page__meta-value,
  .signed-note-value {
    font-size: 0.96rem;
    color: var(--note-ink);
  }

  .signed-note-page__body {
    padding: 1.35rem 1.4rem 1.55rem;
    display: grid;
    gap: 1.6rem;
  }

  .signed-note-section__title {
    margin: 0 0 0.8rem;
    padding-left: 0.8rem;
    border-left: 4px solid var(--note-accent);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--note-accent);
  }

  .signed-note-signature {
    display: grid;
    gap: 0.7rem;
    padding: 1rem 1.05rem;
    border: 1px solid var(--note-success-border);
    border-radius: var(--note-radius-table);
    background: var(--note-signature-bg);
  }

  .signed-note-signature__row,
  .signed-note-amendment__row {
    display: grid;
    grid-template-columns: minmax(120px, 160px) 1fr;
    gap: 0.9rem;
    align-items: start;
  }

  .signed-note-amendments {
    display: grid;
    gap: 0.85rem;
  }

  .signed-note-amendment {
    border: 1px solid var(--note-warning-border);
    border-radius: var(--note-radius-table);
    background: var(--note-warning-bg);
    overflow: hidden;
  }

  .signed-note-amendment__title {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--note-warning-border);
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #92400e;
  }

  .signed-note-amendment__body {
    display: grid;
    gap: 0.7rem;
    padding: 0.95rem 1rem 1rem;
  }

  .signed-note-page__empty {
    margin: 0;
    color: var(--note-muted-soft);
    line-height: 1.6;
  }

  .signed-note-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .signed-note-button {
    min-height: 2.75rem;
    padding: 0.6rem 1rem;
    border-radius: var(--note-radius-button);
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
    transition:
      background 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease,
      transform 0.16s ease;
  }

  .signed-note-button:hover {
    transform: translateY(-1px);
  }

  .signed-note-button--ghost {
    background: rgba(255, 255, 255, 0.9);
    border-color: var(--note-border-soft);
    color: var(--note-ink-muted);
  }

  .signed-note-button--primary {
    background: var(--note-accent);
    color: var(--note-white);
  }

  @media (max-width: 760px) {
    .signed-note-page__title-row,
    .signed-note-page__meta {
      grid-template-columns: 1fr;
      display: grid;
    }

    .signed-note-page__status {
      justify-self: start;
    }

    .signed-note-signature__row,
    .signed-note-amendment__row {
      grid-template-columns: 1fr;
      gap: 0.3rem;
    }
  }
</style>
