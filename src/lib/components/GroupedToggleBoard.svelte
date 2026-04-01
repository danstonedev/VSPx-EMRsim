<script lang="ts">
  interface ToggleBoardItem {
    value: string;
    label: string;
    helper?: string;
  }

  interface ToggleBoardGroup {
    id: string;
    label: string;
    helper?: string;
    items: ToggleBoardItem[];
  }

  interface Props {
    label?: string;
    helper?: string;
    groups: ToggleBoardGroup[];
    selected: string[];
    onToggle: (value: string) => void;
    selectedLabel?: string;
    emptyLabel?: string;
  }

  let {
    label = '',
    helper = '',
    groups,
    selected,
    onToggle,
    selectedLabel = 'Selected',
    emptyLabel = 'Nothing selected yet',
  }: Props = $props();

  const itemLookup = $derived.by(() => {
    const lookup = new Map<string, ToggleBoardItem>();
    for (const group of groups) {
      for (const item of group.items) {
        lookup.set(item.value, item);
      }
    }
    return lookup;
  });

  const selectedItems = $derived.by(() =>
    selected
      .map((value) => itemLookup.get(value))
      .filter((item): item is ToggleBoardItem => item !== undefined),
  );

  function isSelected(value: string): boolean {
    return selected.includes(value);
  }
</script>

<section class="toggle-board">
  {#if label || helper}
    <header class="toggle-board__head">
      {#if label}
        <h3 class="toggle-board__label">{label}</h3>
      {/if}
      {#if helper}
        <p class="toggle-board__helper">{helper}</p>
      {/if}
    </header>
  {/if}

  <div class="toggle-board__summary" aria-live="polite">
    <span class="toggle-board__summary-label">{selectedLabel}</span>
    {#if selectedItems.length > 0}
      <div class="toggle-board__chips">
        {#each selectedItems as item}
          <span class="toggle-board__chip">{item.label}</span>
        {/each}
      </div>
    {:else}
      <p class="toggle-board__empty">{emptyLabel}</p>
    {/if}
  </div>

  <div class="toggle-board__groups">
    {#each groups as group}
      <section class="toggle-board__group">
        <header class="toggle-board__group-head">
          <h4 class="toggle-board__group-title">{group.label}</h4>
          {#if group.helper}
            <p class="toggle-board__group-helper">{group.helper}</p>
          {/if}
        </header>

        <div class="toggle-board__grid">
          {#each group.items as item}
            {@const active = isSelected(item.value)}
            <button
              type="button"
              class="toggle-board__item"
              class:toggle-board__item--active={active}
              aria-pressed={active ? 'true' : 'false'}
              onclick={() => onToggle(item.value)}
            >
              <span class="toggle-board__item-copy">
                <span class="toggle-board__item-label">{item.label}</span>
                {#if item.helper}
                  <span class="toggle-board__item-helper">{item.helper}</span>
                {/if}
              </span>
              <span class="toggle-board__item-state">{active ? 'Selected' : 'Select'}</span>
            </button>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</section>

<style>
  .toggle-board {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .toggle-board__head {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .toggle-board__label {
    margin: 0;
    font-size: 0.78125rem;
    font-weight: 700;
    color: var(--color-neutral-700, #404040);
  }

  .toggle-board__helper {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--color-neutral-500, #737373);
  }

  .toggle-board__summary {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.7rem 0.8rem;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--color-brand-green, #009a44) 12%, white);
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      color-mix(in srgb, var(--color-brand-green, #009a44) 4%, white)
    );
  }

  .toggle-board__summary-label {
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-neutral-500, #737373);
  }

  .toggle-board__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .toggle-board__chip {
    display: inline-flex;
    align-items: center;
    min-height: 1.7rem;
    padding: 0 0.65rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-brand-green, #009a44) 10%, white);
    color: var(--color-neutral-800, #262626);
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1;
  }

  .toggle-board__empty {
    margin: 0;
    font-size: 0.78125rem;
    color: var(--color-neutral-500, #737373);
  }

  .toggle-board__groups {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .toggle-board__group {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .toggle-board__group-head {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .toggle-board__group-title {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-neutral-700, #404040);
  }

  .toggle-board__group-helper {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--color-neutral-500, #737373);
  }

  .toggle-board__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 0.45rem;
  }

  .toggle-board__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 4.1rem;
    padding: 0.7rem 0.8rem;
    border: 1px solid color-mix(in srgb, var(--color-brand-gray, #aeaeae) 26%, white);
    border-radius: 12px;
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 12%, white),
      color-mix(in srgb, var(--color-brand-gray, #aeaeae) 20%, white)
    );
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.14s ease,
      background 0.14s ease,
      transform 0.14s ease,
      box-shadow 0.14s ease;
  }

  .toggle-board__item:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-brand-green, #009a44) 28%, white);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  }

  .toggle-board__item--active {
    border-color: color-mix(in srgb, var(--color-brand-green, #009a44) 48%, white);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-brand-green, #009a44) 12%, white),
      color-mix(in srgb, var(--color-brand-green, #009a44) 18%, white)
    );
    box-shadow: 0 10px 22px rgba(0, 154, 68, 0.08);
  }

  .toggle-board__item-copy {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    min-width: 0;
  }

  .toggle-board__item-label {
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-neutral-800, #262626);
  }

  .toggle-board__item-helper {
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--color-neutral-500, #737373);
  }

  .toggle-board__item-state {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 1.45rem;
    padding: 0 0.55rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: var(--color-neutral-600, #525252);
    font-size: 0.67rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .toggle-board__item--active .toggle-board__item-state {
    background: var(--color-brand-green, #009a44);
    color: #ffffff;
  }

  @media (max-width: 720px) {
    .toggle-board__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
