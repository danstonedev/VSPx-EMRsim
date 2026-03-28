<!--
  ArtifactFormModal — add or edit a case file artifact (referral, imaging, lab, etc.).
  Faculty can attach files via drag-and-drop, stored in IndexedDB.
-->
<script module lang="ts">
  import { writable } from 'svelte/store';
  import type { ChartArtifact } from '$lib/services/chartRecords';
  import type { CaseFileCategory as ArtifactCategory } from '$lib/services/casefileRepository';

  interface ArtifactFormConfig {
    caseId: string;
    existing?: ChartArtifact | null;
    resolve: (result: ArtifactFormResult | null) => void;
  }

  export interface ArtifactFormResult {
    title: string;
    category: ArtifactCategory;
    date: string;
    content: string;
    attachmentIds: string[];
  }

  const config = writable<ArtifactFormConfig | null>(null);

  /**
   * Open the artifact form modal for creating a new artifact.
   */
  export function openAddArtifactModal(caseId: string): Promise<ArtifactFormResult | null> {
    return new Promise((resolve) => {
      config.set({ caseId, resolve });
    });
  }

  /**
   * Open the artifact form modal for editing an existing artifact.
   */
  export function openEditArtifactModal(
    caseId: string,
    existing: ChartArtifact,
  ): Promise<ArtifactFormResult | null> {
    return new Promise((resolve) => {
      config.set({ caseId, existing, resolve });
    });
  }
</script>

<script lang="ts">
  import { CASEFILE_CATEGORIES, type CaseFileCategory } from '$lib/services/casefileRepository';
  import { attachments, type AttachmentMeta } from '$lib/services/attachments';

  const cfg = $derived($config);
  const isEditMode = $derived(!!cfg?.existing);

  // Exclude 'Signed Notes' — those are system-generated
  const categoryOptions = Object.values(CASEFILE_CATEGORIES).filter(
    (c) => c !== CASEFILE_CATEGORIES.SIGNED_NOTE,
  );

  let title = $state('');
  let category = $state<CaseFileCategory | ''>('');
  let date = $state('');
  let content = $state('');
  let errorMessage = $state('');
  let isSubmitting = $state(false);
  let titleInput = $state<HTMLInputElement | undefined>(undefined);
  let dialogEl = $state<HTMLDivElement | undefined>(undefined);

  // Attachment state
  let savedAttachments = $state<AttachmentMeta[]>([]);
  let isDragOver = $state(false);

  // Pre-populate on open
  $effect(() => {
    if (!cfg) return;
    if (cfg.existing) {
      title = cfg.existing.title;
      category = cfg.existing.category as CaseFileCategory;
      date = cfg.existing.date?.slice(0, 10) ?? '';
      content = cfg.existing.content ?? '';
    } else {
      title = '';
      category = '';
      date = new Date().toISOString().slice(0, 10);
      content = '';
    }
    errorMessage = '';
    isSubmitting = false;
    savedAttachments = [];

    const focusTimer = window.setTimeout(() => titleInput?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  });

  function validate(): boolean {
    if (!title.trim()) {
      errorMessage = 'Title is required.';
      return false;
    }
    if (!category) {
      errorMessage = 'Category is required.';
      return false;
    }
    errorMessage = '';
    return true;
  }

  function confirm() {
    if (!validate() || !cfg) return;
    isSubmitting = true;
    cfg.resolve({
      title: title.trim(),
      category: category as CaseFileCategory,
      date: date || new Date().toISOString().slice(0, 10),
      content: content.trim(),
      attachmentIds: savedAttachments.map((a) => a.id),
    });
    close();
  }

  function cancel() {
    cfg?.resolve(null);
    close();
  }

  function close() {
    title = '';
    category = '';
    date = '';
    content = '';
    errorMessage = '';
    isSubmitting = false;
    savedAttachments = [];
    config.set(null);
  }

  // ─── Attachment handling ───

  async function handleFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      try {
        const meta = await attachments.save(file);
        savedAttachments = [...savedAttachments, meta];
      } catch {
        errorMessage = `Failed to save "${file.name}".`;
      }
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  async function removeAttachment(id: string) {
    await attachments.delete(id);
    savedAttachments = savedAttachments.filter((a) => a.id !== id);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ─── Focus trap & keyboard ───

  function handleKeydown(e: KeyboardEvent) {
    if (!cfg) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      confirm();
    }
  }

  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !dialogEl) return;
    const focusable = Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    handleKeydown(e);
    trapFocus(e);
  }}
/>

{#if cfg}
  <div class="af-overlay">
    <div
      class="af-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="af-title"
      tabindex="-1"
      bind:this={dialogEl}
    >
      <div class="af-header">
        <h2 id="af-title">{isEditMode ? 'Edit Artifact' : 'Add Artifact'}</h2>
        <button type="button" class="af-close" aria-label="Close" onclick={cancel}>&times;</button>
      </div>

      <div class="af-body">
        <label class="af-field">
          <span>Title <span class="af-required">*</span></span>
          <input
            type="text"
            bind:this={titleInput}
            bind:value={title}
            placeholder="e.g., Referral from Dr. Smith"
            aria-required="true"
          />
        </label>

        <div class="af-row">
          <label class="af-field af-field--grow">
            <span>Category <span class="af-required">*</span></span>
            <select bind:value={category} aria-required="true">
              <option value="">Select category</option>
              {#each categoryOptions as opt}
                <option value={opt}>{opt}</option>
              {/each}
            </select>
          </label>

          <label class="af-field">
            <span>Date</span>
            <input type="date" bind:value={date} />
          </label>
        </div>

        <label class="af-field">
          <span>Content / Notes</span>
          <textarea
            bind:value={content}
            rows="4"
            placeholder="Enter document content, findings, notes..."
          ></textarea>
        </label>

        <!-- Attachment drop zone -->
        <div class="af-field">
          <span>Attachments</span>
          <div
            class="af-dropzone"
            class:af-dropzone--active={isDragOver}
            role="button"
            tabindex="0"
            ondrop={handleDrop}
            ondragover={handleDragOver}
            ondragleave={() => {
              isDragOver = false;
            }}
            onclick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.onchange = () => {
                if (input.files) handleFiles(input.files);
              };
              input.click();
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
            }}
          >
            <span class="af-dropzone__text"> Drop files here or click to browse </span>
          </div>

          {#if savedAttachments.length > 0}
            <ul class="af-attachments">
              {#each savedAttachments as att (att.id)}
                <li class="af-attachment">
                  <span class="af-attachment__name">{att.name}</span>
                  <span class="af-attachment__size">{formatFileSize(att.size)}</span>
                  <button
                    type="button"
                    class="af-attachment__remove"
                    aria-label="Remove {att.name}"
                    onclick={() => removeAttachment(att.id)}>&times;</button
                  >
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        {#if errorMessage}
          <p class="af-error" role="alert">{errorMessage}</p>
        {/if}
      </div>

      <div class="af-actions">
        <button type="button" class="btn btn--ghost" onclick={cancel} disabled={isSubmitting}
          >Cancel</button
        >
        <button type="button" class="btn btn--primary" onclick={confirm} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Artifact'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .af-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
  }

  .af-modal {
    width: min(100%, 36rem);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    animation: af-enter 0.2s ease;
  }

  .af-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .af-header h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-neutral-900, #171717);
  }

  .af-close {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--color-neutral-500, #737373);
    font-size: 1.25rem;
    cursor: pointer;
  }

  .af-close:hover {
    background: var(--color-neutral-100, #f5f5f5);
    color: var(--color-neutral-800, #262626);
  }

  .af-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    display: grid;
    gap: 1rem;
  }

  .af-field {
    display: grid;
    gap: 0.3rem;
  }

  .af-field > span:first-child {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-600, #525252);
  }

  .af-required {
    color: #dc2626;
  }

  .af-field input,
  .af-field select,
  .af-field textarea {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--color-neutral-900, #171717);
    background: var(--color-surface, #ffffff);
  }

  .af-field input:focus,
  .af-field select:focus,
  .af-field textarea:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .af-field textarea {
    resize: vertical;
    min-height: 80px;
  }

  .af-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
  }

  .af-field--grow {
    min-width: 0;
  }

  /* ─── Drop zone ─── */

  .af-dropzone {
    border: 2px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    padding: 1.25rem;
    text-align: center;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .af-dropzone:hover,
  .af-dropzone--active {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.04);
  }

  .af-dropzone__text {
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #737373);
  }

  /* ─── Attachment list ─── */

  .af-attachments {
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.375rem;
  }

  .af-attachment {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    background: var(--color-neutral-50, #fafafa);
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 6px;
    font-size: 0.8125rem;
  }

  .af-attachment__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--color-neutral-800, #262626);
  }

  .af-attachment__size {
    flex-shrink: 0;
    color: var(--color-neutral-400, #a3a3a3);
    font-size: 0.75rem;
  }

  .af-attachment__remove {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-neutral-400, #a3a3a3);
    font-size: 1rem;
    cursor: pointer;
  }

  .af-attachment__remove:hover {
    background: #fecaca;
    color: #dc2626;
  }

  /* ─── Error & actions ─── */

  .af-error {
    margin: 0;
    padding: 0.625rem 0.75rem;
    border: 1px solid rgba(220, 38, 38, 0.25);
    border-radius: 6px;
    background: rgba(254, 226, 226, 0.5);
    color: #991b1b;
    font-size: 0.8125rem;
  }

  .af-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  @keyframes af-enter {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .af-modal {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .af-row {
      grid-template-columns: 1fr;
    }
  }
</style>
