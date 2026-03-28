<!--
  ArtifactsPanel — grouped collapsible list of background documents.
  Port of app/js/features/navigation/artifacts-panel.js.
-->
<script lang="ts">
  interface Artifact {
    id: string;
    title: string;
    category: string;
    content: string;
    html?: string;
  }

  interface Props {
    artifacts: Artifact[];
    canEdit?: boolean;
    onView?: (artifact: Artifact) => void;
    onAdd?: () => void;
    onEditArtifact?: (artifact: Artifact) => void;
    onDelete?: (artifact: Artifact) => void;
  }

  let { artifacts, canEdit = false, onView, onAdd, onEditArtifact, onDelete }: Props = $props();

  /** Group artifacts by category */
  const grouped = $derived.by(() => {
    const groups = new Map<string, Artifact[]>();
    for (const a of artifacts) {
      const cat = a.category || 'Other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(a);
    }
    return groups;
  });

  let expandedCats = $state<Set<string>>(new Set());

  function toggleCat(cat: string) {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    expandedCats = next;
  }

  // Auto-expand first category
  $effect(() => {
    if (grouped.size > 0 && expandedCats.size === 0) {
      const first = [...grouped.keys()][0];
      if (first) expandedCats = new Set([first]);
    }
  });
</script>

<div class="artifacts">
  <div class="artifacts__header">
    <h2 class="artifacts__title">Background Documents</h2>
    {#if canEdit && onAdd}
      <button type="button" class="artifacts__add-btn" onclick={onAdd}>+ Add</button>
    {/if}
  </div>

  {#if artifacts.length === 0}
    <p class="artifacts__empty">
      {canEdit
        ? 'No documents yet. Click "Add" to create one.'
        : 'No background documents available.'}
    </p>
  {:else}
    {#each [...grouped.entries()] as [category, items]}
      <div class="artifacts__group">
        <button type="button" class="artifacts__group-header" onclick={() => toggleCat(category)}>
          <span
            class="artifacts__chevron"
            class:artifacts__chevron--open={expandedCats.has(category)}
            aria-hidden="true">▸</span
          >
          <span class="artifacts__group-label">{category}</span>
          <span class="artifacts__group-count">{items.length}</span>
        </button>

        {#if expandedCats.has(category)}
          <div class="artifacts__group-body">
            {#each items as artifact}
              <div class="artifacts__item">
                <button
                  type="button"
                  class="artifacts__item-btn"
                  onclick={() => onView?.(artifact)}
                >
                  <span class="artifacts__item-title">{artifact.title}</span>
                  <span class="artifacts__item-arrow" aria-hidden="true">→</span>
                </button>
                {#if canEdit}
                  <div class="artifacts__item-actions">
                    <button
                      type="button"
                      class="artifacts__action-btn"
                      aria-label="Edit {artifact.title}"
                      onclick={() => onEditArtifact?.(artifact)}>Edit</button
                    >
                    <button
                      type="button"
                      class="artifacts__action-btn artifacts__action-btn--danger"
                      aria-label="Delete {artifact.title}"
                      onclick={() => onDelete?.(artifact)}>Del</button
                    >
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .artifacts {
    padding: 1rem;
  }

  .artifacts__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .artifacts__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
  }

  .artifacts__add-btn {
    padding: 0.3rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    background: var(--color-surface, #ffffff);
    color: var(--color-brand-green, #009a44);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }

  .artifacts__add-btn:hover {
    background: rgba(0, 154, 68, 0.08);
    border-color: var(--color-brand-green, #009a44);
  }

  .artifacts__empty {
    font-size: 0.875rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
  }

  .artifacts__group {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .artifacts__group-header {
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

  .artifacts__group-header:hover {
    background: var(--color-neutral-100, #f0f0f0);
  }

  .artifacts__chevron {
    transition: transform 0.2s ease;
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .artifacts__chevron--open {
    transform: rotate(90deg);
  }

  .artifacts__group-label {
    font-weight: 600;
    flex: 1;
  }

  .artifacts__group-count {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    background: var(--color-neutral-200, #e0e0e0);
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
  }

  .artifacts__group-body {
    border-top: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .artifacts__item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .artifacts__item:last-child {
    border-bottom: none;
  }

  .artifacts__item-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    padding: 0.625rem 1rem;
    background: var(--color-surface, #ffffff);
    border: none;
    cursor: pointer;
    font-size: 0.8125rem;
    text-align: left;
  }

  .artifacts__item-btn:hover {
    background: var(--color-neutral-50, #fafafa);
  }

  .artifacts__item-title {
    flex: 1;
    font-weight: 500;
    color: var(--color-neutral-700, #616161);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .artifacts__item-arrow {
    color: var(--color-neutral-400, #9e9e9e);
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .artifacts__item-btn:hover .artifacts__item-arrow {
    color: var(--color-brand-green, #009a44);
  }

  .artifacts__item-actions {
    display: flex;
    gap: 0.25rem;
    padding-right: 0.5rem;
    flex-shrink: 0;
  }

  .artifacts__action-btn {
    padding: 0.2rem 0.4rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-neutral-500, #737373);
    font-size: 0.6875rem;
    font-weight: 600;
    cursor: pointer;
  }

  .artifacts__action-btn:hover {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-800, #262626);
  }

  .artifacts__action-btn--danger:hover {
    background: #fecaca;
    color: #dc2626;
  }
</style>
