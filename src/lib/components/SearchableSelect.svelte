<!--
  SearchableSelect — type-ahead dropdown for large option lists.
  Used for intervention search in Plan & code search in Billing.
  Generic: accepts any item with { value, label, category? }.
-->
<script
  lang="ts"
  generics="T extends { value: string; label: string; category?: string; description?: string }"
>
  interface Props {
    value: string;
    placeholder?: string;
    items: T[];
    scoreFn: (item: T, query: string) => number;
    onSelect: (value: string) => void;
    limit?: number;
  }

  let { value, placeholder = 'Search...', items, scoreFn, onSelect, limit = 15 }: Props = $props();

  // Unique ID per instance for ARIA relationships
  const uid = Math.random().toString(36).slice(2, 8);

  // Initialize to '' — $effect below syncs value on mount and prop changes
  let query = $state('');
  let open = $state(false);
  let highlightIdx = $state(-1);
  let inputEl: HTMLInputElement | undefined = $state();

  // Sync external value changes (runs before first paint in Svelte 5)
  $effect(() => {
    query = value;
  });

  const results = $derived.by(() => {
    const q = (query ?? '').trim().toLowerCase();
    if (!q || !open) return [];
    return items
      .map((item) => ({ ...item, _score: scoreFn(item, q) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  });

  function handleInput(e: Event) {
    query = (e.target as HTMLInputElement).value;
    open = true;
    highlightIdx = results.length ? 0 : -1;
  }

  function handleFocus() {
    if (query) open = true;
  }

  function select(item: T) {
    query = item.value;
    open = false;
    onSelect(item.value);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
      inputEl?.blur();
      return;
    }
    if (!results.length) {
      if (e.key === 'Enter') {
        e.preventDefault();
        open = false;
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIdx = (highlightIdx + 1) % results.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIdx = (highlightIdx - 1 + results.length) % results.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = results[highlightIdx >= 0 ? highlightIdx : 0];
      if (choice) select(choice);
    }
  }

  function handleBlur() {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      open = false;
    }, 150);
  }
</script>

<div class="searchable-select">
  <input
    bind:this={inputEl}
    type="text"
    role="combobox"
    aria-expanded={open && results.length > 0}
    aria-haspopup="listbox"
    aria-controls="ss-{uid}-listbox"
    aria-autocomplete="list"
    aria-activedescendant={open && highlightIdx >= 0 ? `ss-${uid}-opt-${highlightIdx}` : undefined}
    {placeholder}
    value={query}
    oninput={handleInput}
    onfocus={handleFocus}
    onblur={handleBlur}
    onkeydown={handleKeydown}
    autocomplete="off"
  />
  {#if open && results.length > 0}
    <ul class="searchable-select__dropdown" role="listbox" id="ss-{uid}-listbox">
      {#each results as item, idx}
        <li
          class="searchable-select__option"
          class:searchable-select__option--highlighted={idx === highlightIdx}
          role="option"
          id="ss-{uid}-opt-{idx}"
          aria-selected={idx === highlightIdx}
          onmousedown={(e) => {
            e.preventDefault();
            select(item);
          }}
          onmouseenter={() => {
            highlightIdx = idx;
          }}
        >
          <span class="searchable-select__label">{item.label}</span>
          {#if item.category}
            <span class="searchable-select__category">{item.category}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .searchable-select {
    position: relative;
    width: 100%;
  }

  /* Height, padding, border, focus styles handled by global app.css rules.
     Only width needed since the input must fill its container. */
  .searchable-select input {
    width: 100%;
  }

  .searchable-select__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 50;
    min-width: 100%;
    width: max-content;
    max-width: min(420px, 90vw);
    max-height: 240px;
    overflow-y: auto;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-top: 2px;
    list-style: none;
    padding: 0;
    margin-left: 0;
  }

  .searchable-select__option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 0.65rem;
    background: var(--color-surface, #ffffff);
    cursor: pointer;
    font-size: 0.875rem;
    text-align: left;
  }

  .searchable-select__option--highlighted {
    background: rgba(0, 154, 68, 0.12);
  }

  .searchable-select__option:hover {
    background: rgba(0, 154, 68, 0.08);
  }

  .searchable-select__label {
    font-weight: 600;
    flex: 1;
  }

  .searchable-select__category {
    color: var(--color-neutral-400, #9e9e9e);
    font-size: 0.8rem;
    white-space: nowrap;
  }
</style>
