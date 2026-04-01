<!--
  InterventionTable — shared drag-reorderable intervention/exercise table.
  Used by PlanSection for both In-Clinic and HEP tables.
  Accepts configurable column headers, placeholders, and intervention library.
-->
<script
  lang="ts"
  generics="T extends { value: string; label: string; category?: string; description?: string }"
>
  import type { PlanIntervention } from '$lib/types/sections';
  import SearchableSelect from '$lib/components/SearchableSelect.svelte';
  import { createDragReorder } from '$lib/utils/dragReorder';

  interface Props {
    items: PlanIntervention[];
    onUpdate: (items: PlanIntervention[]) => void;
    interventionLabel?: string;
    dosageLabel?: string;
    interventionPlaceholder?: string;
    dosagePlaceholder?: string;
    emptyLabel?: string;
    addLabel?: string;
    library: T[];
    scoreFn: (item: T, query: string) => number;
  }

  let {
    items,
    onUpdate,
    interventionLabel = 'Intervention',
    dosageLabel = 'Dose',
    interventionPlaceholder = 'Search or type intervention...',
    dosagePlaceholder = 'e.g., 3×10, 30s hold',
    emptyLabel = 'No interventions added yet.',
    addLabel = 'Add Intervention',
    library,
    scoreFn,
  }: Props = $props();

  // ── Actions ──

  function addItem() {
    onUpdate([...items, { intervention: '', dosage: '' }]);
  }

  function removeItem(index: number) {
    onUpdate(items.filter((_, i) => i !== index));
  }

  function onIntervention(index: number, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], intervention: value };
    onUpdate(updated);
  }

  function onDosage(index: number, e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    const updated = [...items];
    updated[index] = { ...updated[index], dosage: val };
    onUpdate(updated);
  }

  // ── Drag reorder ──

  let dragIdx = $state<number | null>(null);
  const drag = createDragReorder(
    () => items,
    (nextItems) => onUpdate(nextItems),
    (index) => {
      dragIdx = index;
    },
  );
</script>

<table class="ct-table it-table">
  <colgroup>
    <col style="width: 2rem;" />
    <col />
    <col style="width: 10rem;" />
    <col style="width: 3.75rem;" />
  </colgroup>
  <thead>
    <tr>
      <th class="ct-th ct-th--region" style="width:2rem"></th>
      <th class="ct-th">{interventionLabel}</th>
      <th class="ct-th">{dosageLabel}</th>
      <th class="ct-th ct-th--actions">
        <button type="button" class="ct-btn-add" onclick={addItem} aria-label={addLabel}>+</button>
      </th>
    </tr>
  </thead>
  <tbody>
    {#each items as entry, idx (idx)}
      <tr
        class="ct-row"
        class:ct-row--dragging={dragIdx === idx}
        ondragover={(e) => {
          e.preventDefault();
        }}
        ondrop={(e) => drag.drop(idx, e)}
      >
        <td class="it-drag-cell">
          <button
            type="button"
            class="ct-drag-handle"
            draggable="true"
            aria-label="Drag to reorder {interventionLabel.toLowerCase()} {idx + 1}"
            tabindex="-1"
            ondragstart={(e) => drag.dragStart(idx, e)}
            ondragend={() => {
              drag.dragEnd();
            }}>⠿</button
          >
        </td>
        <td>
          <SearchableSelect
            value={entry.intervention}
            placeholder={interventionPlaceholder}
            items={library}
            {scoreFn}
            onSelect={(v) => onIntervention(idx, v)}
          />
        </td>
        <td>
          <textarea
            rows="1"
            class="it-dose-input"
            value={entry.dosage}
            oninput={(e) => onDosage(idx, e)}
            placeholder={dosagePlaceholder}
          ></textarea>
        </td>
        <td class="it-action-col">
          <button
            type="button"
            class="ct-btn-remove"
            onclick={() => removeItem(idx)}
            aria-label="Remove {interventionLabel.toLowerCase()}">×</button
          >
        </td>
      </tr>
    {/each}
  </tbody>
</table>
{#if items.length === 0}
  <p class="ct-empty-hint">{emptyLabel}</p>
  <button type="button" class="it-btn-add" onclick={addItem}>+ {addLabel}</button>
{/if}

<style>
  .it-table {
    table-layout: fixed;
  }

  .it-table tbody td {
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid var(--color-neutral-150, #eeeeee);
    vertical-align: top;
  }

  .it-drag-cell {
    text-align: center;
    vertical-align: middle;
  }

  .it-dose-input {
    width: 100%;
    resize: vertical;
  }

  .it-action-col {
    text-align: center;
    width: 3.75rem;
  }

  .it-btn-add {
    background: none;
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    min-height: 44px;
    font-size: 0.8125rem;
    color: var(--color-brand-green, #009a44);
    cursor: pointer;
    font-weight: 600;
  }

  .it-btn-add:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
  }
</style>
