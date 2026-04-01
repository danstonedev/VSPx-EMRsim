<!--
  CaseFilePanel — grouped case file viewer.
  Port of app/js/views/dietetics/casefile_helpers.js (read-only view portion).
-->
<script lang="ts">
  import type { CaseFileEntry, CaseFileCategory } from '$lib/services/casefileRepository';
  import { groupByCategory, getCategoryLabel } from '$lib/services/casefileRepository';

  interface Props {
    entries: CaseFileEntry[];
    onViewEntry?: (entry: CaseFileEntry) => void;
    onAmendNote?: (entry: CaseFileEntry) => void;
  }

  let { entries, onViewEntry, onAmendNote }: Props = $props();

  const grouped = $derived(groupByCategory(entries));

  let expandedCats = $state<Set<string>>(new Set());

  function toggleCat(cat: string) {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    expandedCats = next;
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  // Start with first category expanded
  $effect(() => {
    if (grouped.size > 0 && expandedCats.size === 0) {
      const first = [...grouped.keys()][0];
      if (first) expandedCats = new Set([first]);
    }
  });
</script>

<div class="casefile">
  <h2 class="casefile__title">Shared Case File</h2>

  {#if entries.length === 0}
    <p class="casefile__empty">No documents in the case file yet.</p>
  {:else}
    {#each [...grouped.entries()] as [category, items]}
      <div class="casefile__group">
        <button type="button" class="casefile__group-header" onclick={() => toggleCat(category)}>
          <span
            class="casefile__chevron"
            class:casefile__chevron--open={expandedCats.has(category)}
            aria-hidden="true">▸</span
          >
          <span class="casefile__group-label">{getCategoryLabel(category)}</span>
          <span class="casefile__group-count">{items.length}</span>
        </button>

        {#if expandedCats.has(category)}
          <div class="casefile__group-body">
            {#each items as entry}
              <div class="casefile__entry">
                <div class="casefile__entry-header">
                  <span class="casefile__entry-title">{entry.title}</span>
                  <span class="casefile__entry-date">{formatDate(entry.date)}</span>
                </div>
                {#if entry.signedBy}
                  <div class="casefile__entry-meta">Signed by {entry.signedBy}</div>
                {/if}
                <div class="casefile__entry-actions">
                  {#if onViewEntry}
                    <button type="button" class="btn btn--sm" onclick={() => onViewEntry?.(entry)}
                      >View</button
                    >
                  {/if}
                  {#if onAmendNote && entry.category === 'Signed Notes'}
                    <button
                      type="button"
                      class="btn btn--sm btn--outline"
                      onclick={() => onAmendNote?.(entry)}>Amend</button
                    >
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .casefile {
    padding: 1rem;
  }

  .casefile__title {
    margin: 0 0 1rem;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .casefile__empty {
    font-size: 0.875rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
  }

  .casefile__group {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .casefile__group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--color-neutral-50, #fafafa);
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    text-align: left;
  }

  .casefile__group-header:hover {
    background: var(--color-neutral-100, #f0f0f0);
  }

  .casefile__chevron {
    transition: transform 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    font-size: 0;
    line-height: 0;
    color: var(--color-neutral-400, #9e9e9e);
    overflow: hidden;
  }

  .casefile__chevron::before {
    content: '';
    width: 0.4rem;
    height: 0.4rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg) translate(-8%, -8%);
  }

  .casefile__chevron--open {
    transform: rotate(90deg);
  }

  .casefile__group-label {
    font-weight: 600;
    flex: 1;
  }

  .casefile__group-count {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    background: var(--color-neutral-200, #e0e0e0);
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
  }

  .casefile__group-body {
    border-top: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .casefile__entry {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .casefile__entry:last-child {
    border-bottom: none;
  }

  .casefile__entry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .casefile__entry-title {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .casefile__entry-date {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #9e9e9e);
    white-space: nowrap;
  }

  .casefile__entry-meta {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #a3a3a3);
    margin-top: 0.25rem;
  }

  .casefile__entry-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .btn {
    padding: 0.3rem 0.625rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-700, #616161);
  }

  .btn:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .btn--outline {
    background: transparent;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
  }

  .btn--outline:hover {
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
    background: transparent;
  }

  .btn--sm {
    padding: 0.3rem 0.625rem;
    font-size: 0.75rem;
  }
</style>
