<!--
  ArtifactViewerModal — read-only viewer for case file artifacts.
  Shows title, category, date, content, and any attached files.
-->
<script module lang="ts">
  import { writable } from 'svelte/store';
  import type { ChartArtifact } from '$lib/services/chartRecords';

  interface ArtifactViewerConfig {
    artifact: ChartArtifact;
    canEdit?: boolean;
    resolve: (action: 'edit' | 'delete' | null) => void;
  }

  const config = writable<ArtifactViewerConfig | null>(null);

  /**
   * Open the artifact viewer modal.
   * Returns 'edit' if the user clicked Edit, 'delete' if Delete, null if closed.
   */
  export function openArtifactViewer(
    artifact: ChartArtifact,
    opts?: { canEdit?: boolean },
  ): Promise<'edit' | 'delete' | null> {
    return new Promise((resolve) => {
      config.set({ artifact, canEdit: opts?.canEdit, resolve });
    });
  }
</script>

<script lang="ts">
  const cfg = $derived($config);

  function close(action: 'edit' | 'delete' | null = null) {
    cfg?.resolve(action);
    config.set(null);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!cfg) return;
    if (e.key === 'Escape') close();
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if cfg}
  {@const art = cfg.artifact}
  <div
    class="av-overlay"
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="av-modal" role="dialog" aria-modal="true" aria-labelledby="av-title">
      <div class="av-header">
        <div class="av-header__meta">
          <span class="av-badge">{art.category}</span>
          {#if art.date}
            <span class="av-date">{formatDate(art.date)}</span>
          {/if}
        </div>
        <h2 id="av-title" class="av-title">{art.title}</h2>
        <button type="button" class="av-close" aria-label="Close" onclick={() => close()}
          >&times;</button
        >
      </div>

      <div class="av-body">
        {#if art.html}
          <div class="av-html">{@html art.html}</div>
        {:else if art.content}
          <pre class="av-content">{art.content}</pre>
        {:else}
          <p class="av-empty">No content available for this document.</p>
        {/if}

        {#if art.signedBy}
          <div class="av-signed">
            <span class="av-signed__label">Signed by</span>
            <span class="av-signed__name">{art.signedBy}</span>
          </div>
        {/if}
      </div>

      <div class="av-actions">
        {#if cfg.canEdit}
          <button
            type="button"
            class="btn btn--ghost btn--danger-ghost"
            onclick={() => close('delete')}
          >
            Delete
          </button>
          <button type="button" class="btn btn--secondary" onclick={() => close('edit')}>
            Edit
          </button>
        {/if}
        <button type="button" class="btn btn--primary" onclick={() => close()}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .av-overlay {
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

  .av-modal {
    width: min(100%, 48rem);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface, #ffffff);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    animation: av-enter 0.2s ease;
  }

  .av-header {
    position: relative;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .av-header__meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }

  .av-badge {
    display: inline-block;
    padding: 0.15rem 0.6rem;
    background: var(--color-neutral-100, #f5f5f5);
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 999px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-neutral-600, #525252);
  }

  .av-date {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #737373);
  }

  .av-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-neutral-900, #171717);
    padding-right: 2.5rem;
  }

  .av-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
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

  .av-close:hover {
    background: var(--color-neutral-100, #f5f5f5);
    color: var(--color-neutral-800, #262626);
  }

  .av-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .av-content {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-neutral-800, #262626);
  }

  .av-html {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--color-neutral-800, #262626);
  }

  .av-empty {
    margin: 2rem 0;
    text-align: center;
    color: var(--color-neutral-400, #a3a3a3);
    font-size: 0.875rem;
    font-style: italic;
  }

  .av-signed {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-neutral-200, #e5e5e5);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .av-signed__label {
    color: var(--color-neutral-500, #737373);
  }

  .av-signed__name {
    font-weight: 600;
    color: var(--color-neutral-800, #262626);
  }

  .av-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  @keyframes av-enter {
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
    .av-modal {
      animation: none;
    }
  }
</style>
