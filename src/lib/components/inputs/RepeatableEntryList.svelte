<!--
  RepeatableEntryList — shared wrapper for repeatable structured entry patterns.
  Provides: empty state, entry card chrome, add/remove buttons, consistent styling.
  Content of each entry is provided via the {#snippet} pattern.

  Usage:
    <RepeatableEntryList
      entries={myEntries}
      emptyLabel="No items documented."
      addLabel="Add Item"
      onAdd={handleAdd}
      onRemove={handleRemove}
    >
      {#snippet entry(item, index)}
        <div class="my-fields">...</div>
      {/snippet}
    </RepeatableEntryList>
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    entries: { id: string }[];
    emptyLabel?: string;
    addLabel?: string;
    onAdd: () => void;
    onRemove: (id: string) => void;
    entry: Snippet<[{ id: string }, number]>;
  }

  let {
    entries,
    emptyLabel = 'No entries documented.',
    addLabel = 'Add Entry',
    onAdd,
    onRemove,
    entry,
  }: Props = $props();
</script>

<div class="rel">
  {#if entries.length === 0}
    <div class="rel__empty">
      {emptyLabel}
      <button type="button" class="rel__add-btn" onclick={onAdd}>{addLabel}</button>
    </div>
  {:else}
    {#each entries as item, index (item.id)}
      <div class="rel__entry">
        <button
          type="button"
          class="rel__remove"
          onclick={() => onRemove(item.id)}
          aria-label="Remove entry">&times;</button
        >
        {@render entry(item, index)}
      </div>
    {/each}
    <button type="button" class="rel__add-btn" onclick={onAdd}>+ {addLabel}</button>
  {/if}
</div>

<style>
  .rel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .rel__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .rel__entry {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 2rem 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
  }

  .rel__remove {
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-500, #757575);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
  }

  .rel__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .rel__add-btn {
    align-self: flex-start;
    padding: 0.3rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    transition: all 0.12s;
  }

  .rel__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
