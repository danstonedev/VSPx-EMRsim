<!--
  MedicationPanel — Searchable medication entry with PT-relevant drug database.
  Type-ahead search from ~120 common drugs with clinical alert tags.
  Stores structured medications array + backward-compat summary string.
-->
<script lang="ts">
  import {
    type MedEntry,
    type AlertCategory,
    MED_DOSES,
    FREQ_OPTIONS,
    ALERT_LABELS,
    ALERT_COLORS,
    searchMedications,
  } from '$lib/config/medicationDb';

  interface MedicationRecord {
    name: string;
    dose: string;
    frequency: string;
    class: string;
    alerts: AlertCategory[];
    custom?: boolean;
  }

  interface Props {
    medications: MedicationRecord[];
    onUpdate: (meds: MedicationRecord[]) => void;
  }

  let { medications = [], onUpdate }: Props = $props();

  // Search state
  let searchQuery = $state('');
  let searchResults = $state<MedEntry[]>([]);
  let highlightIndex = $state(-1);
  let showResults = $state(false);

  function onSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchQuery = val;
    if (val.trim().length >= 2) {
      searchResults = searchMedications(val, 8);
      highlightIndex = -1;
      showResults = searchResults.length > 0;
    } else {
      searchResults = [];
      showResults = false;
    }
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (!showResults || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault();
        addCustomMed();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = Math.min(highlightIndex + 1, searchResults.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = Math.max(highlightIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < searchResults.length) {
        selectMed(searchResults[highlightIndex]);
      } else if (searchQuery.trim()) {
        addCustomMed();
      }
    } else if (e.key === 'Escape') {
      showResults = false;
    }
  }

  function selectMed(med: MedEntry) {
    const doses = MED_DOSES[med.name];
    const record: MedicationRecord = {
      name: med.name,
      dose: doses?.[0] ?? '',
      frequency: '',
      class: med.class,
      alerts: [...med.alerts],
    };
    const updated = [...medications, record];
    onUpdate(updated);
    searchQuery = '';
    searchResults = [];
    showResults = false;
  }

  function addCustomMed() {
    const record: MedicationRecord = {
      name: searchQuery.trim(),
      dose: '',
      frequency: '',
      class: '',
      alerts: [],
      custom: true,
    };
    const updated = [...medications, record];
    onUpdate(updated);
    searchQuery = '';
    searchResults = [];
    showResults = false;
  }

  function removeMed(idx: number) {
    const updated = medications.filter((_, i) => i !== idx);
    onUpdate(updated);
  }

  function updateMedField(idx: number, field: keyof MedicationRecord, value: string) {
    const updated = medications.map((m, i) => (i === idx ? { ...m, [field]: value } : m));
    onUpdate(updated);
  }

  function getDoses(name: string): string[] {
    return MED_DOSES[name] ?? [];
  }

  function onSearchBlur() {
    // Delay to allow click on result
    setTimeout(() => {
      showResults = false;
    }, 200);
  }
</script>

<div class="med-panel">
  <!-- Search input -->
  <div class="med-panel__search-wrap">
    <input
      type="text"
      class="med-panel__search-input"
      placeholder="Search medication by name, brand, or class…"
      autocomplete="off"
      value={searchQuery}
      oninput={onSearchInput}
      onkeydown={onSearchKeydown}
      onfocus={() => {
        if (searchResults.length) showResults = true;
      }}
      onblur={onSearchBlur}
    />
    {#if showResults}
      <div class="med-panel__results" role="listbox">
        {#each searchResults as med, idx}
          <button
            type="button"
            class="med-panel__result-row"
            class:med-panel__result-row--highlight={idx === highlightIndex}
            role="option"
            aria-selected={idx === highlightIndex}
            onmousedown={(e: MouseEvent) => {
              e.preventDefault();
              selectMed(med);
            }}
            onmouseenter={() => {
              highlightIndex = idx;
            }}
          >
            <span class="med-panel__result-name">
              <strong>{med.name}</strong>
              <span class="med-panel__result-brand">({med.brand})</span>
            </span>
            <span class="med-panel__result-class">{med.class}</span>
            {#if med.alerts.length > 0}
              <span class="med-panel__result-alerts">
                {#each med.alerts as alert}
                  <span
                    class="med-alert-tag"
                    style="background: {ALERT_COLORS[alert]}20; color: {ALERT_COLORS[
                      alert
                    ]}; border-color: {ALERT_COLORS[alert]}40;">{ALERT_LABELS[alert]}</span
                  >
                {/each}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Medication list -->
  {#if medications.length > 0}
    <div class="med-panel__list">
      {#each medications as med, idx}
        <div class="med-panel__entry">
          <div class="med-panel__entry-header">
            <span class="med-panel__entry-name">{med.name}</span>
            {#if med.class}
              <span class="med-panel__entry-class">{med.class}</span>
            {/if}
            {#each med.alerts as alert}
              <span
                class="med-alert-tag med-alert-tag--sm"
                style="background: {ALERT_COLORS[alert]}20; color: {ALERT_COLORS[
                  alert
                ]}; border-color: {ALERT_COLORS[alert]}40;">{ALERT_LABELS[alert]}</span
              >
            {/each}
            <button
              type="button"
              class="med-panel__entry-remove"
              aria-label="Remove {med.name}"
              onclick={() => removeMed(idx)}>✕</button
            >
          </div>
          <div class="med-panel__entry-fields">
            {#if getDoses(med.name).length > 0}
              <select
                class="med-panel__dose-select"
                value={med.dose}
                onchange={(e) => updateMedField(idx, 'dose', (e.target as HTMLSelectElement).value)}
              >
                <option value="">Dose…</option>
                {#each getDoses(med.name) as dose}
                  <option value={dose}>{dose}</option>
                {/each}
              </select>
            {:else}
              <input
                type="text"
                class="med-panel__dose-input"
                placeholder="Dose"
                value={med.dose}
                oninput={(e) => updateMedField(idx, 'dose', (e.target as HTMLInputElement).value)}
              />
            {/if}
            <select
              class="med-panel__freq-select"
              value={med.frequency}
              onchange={(e) =>
                updateMedField(idx, 'frequency', (e.target as HTMLSelectElement).value)}
            >
              {#each FREQ_OPTIONS as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="med-panel__empty">
      No medications added. Search above to add from database or type a custom name.
    </p>
  {/if}

  <div class="med-panel__count">
    {medications.length} medication{medications.length !== 1 ? 's' : ''} recorded
    {#if medications.some((m) => m.alerts.includes('fall'))}
      <span
        class="med-alert-tag med-alert-tag--sm"
        style="background: {ALERT_COLORS.fall}20; color: {ALERT_COLORS.fall};"
        >⚠ Fall risk meds present</span
      >
    {/if}
  </div>
</div>

<style>
  .med-panel__search-wrap {
    position: relative;
    margin-bottom: 0.75rem;
  }

  .med-panel__search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    background: var(--color-surface, #ffffff);
  }

  .med-panel__search-input:focus {
    outline: none;
    border-color: var(--color-brand-green, #009a44);
    box-shadow: 0 0 0 2px rgba(0, 154, 68, 0.15);
  }

  .med-panel__results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 0 0 6px 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    max-height: 280px;
    overflow-y: auto;
  }

  .med-panel__result-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-size: 0.8125rem;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .med-panel__result-row:hover,
  .med-panel__result-row--highlight {
    background: rgba(0, 154, 68, 0.06);
  }

  .med-panel__result-name {
    flex: 1;
    min-width: 0;
  }

  .med-panel__result-brand {
    color: var(--color-neutral-500, #757575);
    font-size: 0.75rem;
    margin-left: 0.25rem;
  }

  .med-panel__result-class {
    font-size: 0.6875rem;
    color: var(--color-neutral-500, #757575);
    background: var(--color-neutral-100, #f5f5f5);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
  }

  .med-panel__result-alerts {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .med-alert-tag {
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.0625rem 0.375rem;
    border-radius: 3px;
    border: 1px solid;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .med-alert-tag--sm {
    font-size: 0.5625rem;
    padding: 0 0.25rem;
  }

  .med-panel__list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .med-panel__entry {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    background: var(--color-neutral-50, #fafafa);
  }

  .med-panel__entry-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
    margin-bottom: 0.375rem;
  }

  .med-panel__entry-name {
    font-weight: 600;
    font-size: 0.8125rem;
  }

  .med-panel__entry-class {
    font-size: 0.6875rem;
    color: var(--color-neutral-500, #757575);
    background: var(--color-neutral-100, #f5f5f5);
    padding: 0.0625rem 0.375rem;
    border-radius: 3px;
  }

  .med-panel__entry-remove {
    margin-left: auto;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-neutral-400, #9e9e9e);
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
    line-height: 1;
  }

  .med-panel__entry-remove:hover {
    background: var(--color-neutral-200, #e0e0e0);
    color: #d32f2f;
  }

  .med-panel__entry-fields {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .med-panel__dose-select,
  .med-panel__dose-input,
  .med-panel__freq-select {
    font-size: 0.8125rem;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    min-width: 100px;
  }

  .med-panel__dose-input {
    flex: 0 0 120px;
  }

  .med-panel__empty {
    font-size: 0.8125rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-style: italic;
    margin: 0.25rem 0 0.5rem;
  }

  .med-panel__count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-neutral-500, #757575);
    padding-top: 0.25rem;
    border-top: 1px solid var(--color-neutral-100, #f5f5f5);
  }
</style>
