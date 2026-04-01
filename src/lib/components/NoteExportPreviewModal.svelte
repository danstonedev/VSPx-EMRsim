<script module lang="ts">
  import { writable } from 'svelte/store';
  import type { NoteData, Signature } from '$lib/services/noteLifecycle';

  export interface NoteExportPreviewOptions {
    note: NoteData;
    patient: {
      name: string;
      dob?: string;
      caseId?: string;
    };
    noteTypeLabel?: string;
    existingSignature?: Signature | null;
    mode?: 'sign' | 'export';
  }

  interface PreviewConfig extends Omit<NoteExportPreviewOptions, 'mode' | 'noteTypeLabel'> {
    mode: 'sign' | 'export';
    noteTypeLabel: string;
    resolve: (result: NoteExportPreviewResult | null) => void;
  }

  export interface NoteExportPreviewResult {
    confirmed: boolean;
    signature?: Signature;
    note?: NoteData;
  }

  const config = writable<PreviewConfig | null>(null);

  export function openNoteExportPreview(
    opts: NoteExportPreviewOptions,
  ): Promise<NoteExportPreviewResult | null> {
    return new Promise((resolve) => {
      config.set({
        ...opts,
        mode: opts.mode ?? 'sign',
        noteTypeLabel: opts.noteTypeLabel ?? 'Clinical Note',
        resolve,
      });
    });
  }
</script>

<script lang="ts">
  import NotePresentationRenderer from '$lib/components/NotePresentationRenderer.svelte';
  import { buildNoteCssVars } from '$lib/services/noteAppearance';
  import { SIGNATURE_STORAGE_NAME, SIGNATURE_STORAGE_TITLE } from '$lib/services/noteLifecycle';
  import { buildNotePresentation } from '$lib/services/notePresentation';

  const cfg = $derived($config);
  const noteThemeVars = buildNoteCssVars();

  let name = $state('');
  let title = $state('');
  let attested = $state(false);
  let activeElement = $state<HTMLInputElement | undefined>(undefined);
  let previewNote = $state<NoteData | null>(null);

  function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  function setPath(record: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let cursor = record;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      const next = cursor[key];
      if (!next || typeof next !== 'object' || Array.isArray(next)) {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
  }

  function formatSignedAt(value: string | undefined): string {
    if (!value) return 'Not signed';
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) return value;
    return timestamp.toLocaleString();
  }

  function updatePreviewField(sectionKey: string, path: string, value: string): void {
    if (!previewNote) return;
    const next = structuredClone(previewNote) as Record<string, unknown>;
    const sectionRecord = asRecord(next[sectionKey]);
    setPath(sectionRecord, path, value);
    next[sectionKey] = sectionRecord;
    previewNote = next as NoteData;
  }

  const previewSections = $derived(
    cfg && previewNote ? buildNotePresentation(previewNote, cfg.mode) : [],
  );
  const previewSignature = $derived.by(() => {
    if (!cfg) return null;
    return cfg.existingSignature ?? (cfg.note.meta?.signature as Signature | undefined) ?? null;
  });
  const previewSignedAt = $derived.by(() => {
    if (!cfg) return '';
    return formatSignedAt(
      cfg.existingSignature?.signedAt ??
        (typeof cfg.note.meta?.signedAt === 'string' ? cfg.note.meta.signedAt : undefined),
    );
  });
  const canConfirm = $derived.by(() => {
    if (!cfg) return false;
    if (cfg.mode === 'export') return true;
    return name.trim().length > 0 && title.trim().length > 0 && attested;
  });

  $effect(() => {
    if (!cfg) return;
    previewNote = structuredClone(cfg.note);
    name = cfg.existingSignature?.name ?? localStorage.getItem(SIGNATURE_STORAGE_NAME) ?? '';
    title = cfg.existingSignature?.title ?? localStorage.getItem(SIGNATURE_STORAGE_TITLE) ?? '';
    attested = false;
    queueMicrotask(() => activeElement?.focus());
  });

  function close() {
    config.set(null);
  }

  function cancel() {
    cfg?.resolve(null);
    close();
  }

  function confirm() {
    if (!cfg || !canConfirm) return;
    const snapshotNote = previewNote ? ($state.snapshot(previewNote) as NoteData) : cfg.note;
    if (cfg.mode === 'export') {
      cfg.resolve({ confirmed: true, note: snapshotNote });
      close();
      return;
    }

    localStorage.setItem(SIGNATURE_STORAGE_NAME, name.trim());
    localStorage.setItem(SIGNATURE_STORAGE_TITLE, title.trim());
    const signature: Signature = {
      name: name.trim(),
      title: title.trim(),
      signedAt: new Date().toISOString(),
      version: 1,
    };
    cfg.resolve({ confirmed: true, signature, note: snapshotNote });
    close();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!cfg) return;
    if (event.key === 'Escape') cancel();
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && canConfirm) {
      event.preventDefault();
      confirm();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if cfg}
  <div
    class="preview-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Note review before sign or export"
    style={noteThemeVars}
  >
    <div class="preview-modal">
      <div class="preview-modal__header">
        <div>
          <div class="preview-modal__eyebrow">
            {cfg.mode === 'sign' ? 'Review Before Signing' : 'Export Preview'}
          </div>
          <h2 class="preview-modal__title">{cfg.noteTypeLabel}</h2>
        </div>
        <button
          class="preview-modal__close"
          type="button"
          onclick={cancel}
          aria-label="Close preview"
        >
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <div class="preview-modal__body">
        <section class="preview-sheet preview-sheet--patient">
          <div class="preview-grid">
            <div>
              <span class="preview-label">Patient</span>
              <div class="preview-value">{cfg.patient.name || 'Patient'}</div>
            </div>
            <div>
              <span class="preview-label">DOB</span>
              <div class="preview-value">{cfg.patient.dob || 'N/A'}</div>
            </div>
            <div>
              <span class="preview-label">Case ID</span>
              <div class="preview-value">{cfg.patient.caseId || 'N/A'}</div>
            </div>
          </div>
        </section>

        <section class="preview-sheet">
          {#if cfg.mode === 'sign'}
            <p class="preview-hint">
              Review the note below. Plain-text fields remain editable until you sign.
            </p>
          {/if}
          {#if previewSections.length > 0}
            <NotePresentationRenderer
              sections={previewSections}
              variant="preview"
              onFieldChange={updatePreviewField}
            />
          {:else}
            <p class="preview-empty">No populated note fields are available for preview yet.</p>
          {/if}
        </section>

        {#if cfg.mode === 'sign'}
          <section class="preview-sheet preview-sheet--signature">
            <div class="preview-signature-section">
              <h3 class="preview-signature-title">Signature</h3>
              <div class="preview-signature-grid">
                <label class="preview-input">
                  <span>Full Name</span>
                  <input
                    bind:value={name}
                    bind:this={activeElement}
                    type="text"
                    placeholder="Jane Doe, SPT"
                  />
                </label>
                <label class="preview-input">
                  <span>Title / Credentials</span>
                  <input bind:value={title} type="text" placeholder="Student Physical Therapist" />
                </label>
              </div>
              <label class="preview-attest">
                <input bind:checked={attested} type="checkbox" />
                <span
                  >I attest that this documentation is accurate and ready for signature and export.</span
                >
              </label>
            </div>
          </section>
        {:else if previewSignature}
          <section class="preview-sheet preview-sheet--signature">
            <div class="preview-signature-section">
              <h3 class="preview-signature-title">Signature on Export</h3>
              <div class="preview-signature-summary">
                <div>
                  <span class="preview-label">Signed By</span>
                  <div class="preview-value">{previewSignature.name}</div>
                </div>
                <div>
                  <span class="preview-label">Title</span>
                  <div class="preview-value">{previewSignature.title}</div>
                </div>
                <div>
                  <span class="preview-label">Signed At</span>
                  <div class="preview-value">{previewSignedAt}</div>
                </div>
              </div>
            </div>
          </section>
        {/if}
      </div>

      <div class="preview-modal__actions">
        <button class="preview-btn preview-btn--ghost" type="button" onclick={cancel}>Cancel</button
        >
        <button
          class="preview-btn preview-btn--primary"
          type="button"
          disabled={!canConfirm}
          onclick={confirm}
        >
          {#if cfg.mode === 'sign'}
            Sign &amp; Download
          {:else}
            Download .docx
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .preview-overlay {
    position: fixed;
    inset: 0;
    z-index: 10020;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--note-overlay-bg);
    backdrop-filter: blur(5px);
  }

  .preview-modal {
    width: min(1080px, 100%);
    max-height: min(92vh, 980px);
    display: flex;
    flex-direction: column;
    background: var(--note-modal-bg);
    border-radius: var(--note-radius-shell);
    overflow: hidden;
    box-shadow: var(--note-shadow-modal);
  }

  .preview-modal__header,
  .preview-modal__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: var(--note-modal-toolbar-bg);
    color: var(--note-white);
  }

  .preview-modal__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview-modal__eyebrow {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.68;
    margin-bottom: 0.2rem;
  }

  .preview-modal__title {
    margin: 0;
    font-size: 1.15rem;
  }

  .preview-modal__close {
    width: 2.25rem;
    height: 2.25rem;
    display: grid;
    place-items: center;
    border-radius: var(--note-radius-pill);
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: var(--note-white);
    cursor: pointer;
  }

  .preview-sheet {
    background: var(--note-sheet-bg);
    border-radius: var(--note-radius-sheet);
    padding: 1rem 1.1rem;
    box-shadow: var(--note-shadow-sheet);
  }

  .preview-sheet--patient {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .preview-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--note-muted-soft);
    margin-bottom: 0.25rem;
  }

  .preview-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--note-ink);
  }

  .preview-signature-title {
    margin: 0 0 0.8rem;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--note-ink);
  }

  .preview-empty {
    margin: 0;
    color: var(--note-muted-soft);
  }

  .preview-hint {
    margin: 0 0 0.6rem;
    font-size: 0.86rem;
    color: var(--note-muted-soft);
  }

  .preview-signature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .preview-signature-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
  }

  .preview-input {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--note-muted);
  }

  .preview-input input {
    min-height: 2.75rem;
    border-radius: var(--note-radius-metric);
    border: 1px solid var(--note-border-input);
    padding: 0.7rem 0.85rem;
    font-size: 0.95rem;
  }

  .preview-attest {
    margin-top: 0.9rem;
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    color: var(--note-muted);
    font-size: 0.86rem;
  }

  .preview-btn {
    min-height: 2.5rem;
    padding: 0.55rem 1rem;
    border-radius: var(--note-radius-button);
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .preview-btn--ghost {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    color: var(--note-white);
  }

  .preview-btn--primary {
    background: var(--note-accent);
    color: var(--note-white);
  }

  .preview-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 840px) {
    .preview-grid,
    .preview-signature-grid,
    .preview-signature-summary {
      grid-template-columns: 1fr;
    }
  }
</style>
