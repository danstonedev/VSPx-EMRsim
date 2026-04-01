<!--
  InterventionLog — structured treatment/intervention documentation.
  Replaces the free-text treatmentPerformed textarea with repeatable entries
  that capture category, type, description, parameters, time, and response.
  Discipline-aware via interventionCatalog config.
-->
<script lang="ts">
  import type { InterventionEntry } from '$lib/types/sections';
  import {
    getCategoryOptions,
    getTypeOptions,
    PATIENT_RESPONSE_OPTIONS,
  } from '$lib/config/interventionCatalog';
  import type { DisciplineId } from '$lib/stores/auth';

  interface Props {
    entries: InterventionEntry[];
    discipline?: DisciplineId;
    onUpdate: (entries: InterventionEntry[]) => void;
  }

  let { entries, discipline = 'pt', onUpdate }: Props = $props();

  const categories = $derived(getCategoryOptions(discipline));

  function genId(): string {
    return `int-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function createEntry(): InterventionEntry {
    return {
      id: genId(),
      category: '',
      type: '',
      description: '',
      sets: '',
      reps: '',
      duration: '',
      intensity: '',
      timeMinutes: '',
      patientResponse: '',
      notes: '',
    };
  }

  function addEntry() {
    onUpdate([...entries, createEntry()]);
  }

  function removeEntry(id: string) {
    onUpdate(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof InterventionEntry, value: string) {
    onUpdate(
      entries.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, [field]: value };
        // Reset type when category changes
        if (field === 'category') updated.type = '';
        return updated;
      }),
    );
  }

  function getTypesForEntry(categoryId: string) {
    return getTypeOptions(discipline, categoryId);
  }
</script>

<div class="il">
  {#if entries.length === 0}
    <div class="il__empty">
      No interventions documented.
      <button type="button" class="il__add-btn" onclick={addEntry}>Add Intervention</button>
    </div>
  {:else}
    {#each entries as entry, idx (entry.id)}
      <div class="il__entry">
        <div class="il__header">
          <span class="il__number">{idx + 1}</span>
          <button
            type="button"
            class="il__remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove intervention">&times;</button
          >
        </div>

        <!-- Row 1: Category + Type -->
        <div class="il__row">
          <label class="il__field il__field--grow">
            Category
            <select
              value={entry.category}
              onchange={(e) =>
                updateEntry(entry.id, 'category', (e.target as HTMLSelectElement).value)}
            >
              <option value="">Select category...</option>
              {#each categories as cat}
                <option value={cat.id}>{cat.label}</option>
              {/each}
            </select>
          </label>

          {#if entry.category}
            {@const types = getTypesForEntry(entry.category)}
            {#if types.length > 0}
              <label class="il__field il__field--grow">
                Type
                <select
                  value={entry.type}
                  onchange={(e) =>
                    updateEntry(entry.id, 'type', (e.target as HTMLSelectElement).value)}
                >
                  <option value="">Select type...</option>
                  {#each types as t}
                    <option value={t.id}>{t.label}</option>
                  {/each}
                </select>
              </label>
            {/if}
          {/if}
        </div>

        <!-- Row 2: Description -->
        <label class="il__field il__field--full">
          Description
          <input
            type="text"
            value={entry.description}
            placeholder="Specific exercise / technique / modality details..."
            oninput={(e) =>
              updateEntry(entry.id, 'description', (e.target as HTMLInputElement).value)}
          />
        </label>

        <!-- Row 3: Parameters -->
        <div class="il__row">
          <label class="il__field il__field--compact">
            Sets
            <input
              type="text"
              inputmode="numeric"
              class="il__input--sm"
              value={entry.sets}
              placeholder="3"
              oninput={(e) => updateEntry(entry.id, 'sets', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="il__field il__field--compact">
            Reps
            <input
              type="text"
              inputmode="numeric"
              class="il__input--sm"
              value={entry.reps}
              placeholder="10"
              oninput={(e) => updateEntry(entry.id, 'reps', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="il__field il__field--compact">
            Duration
            <input
              type="text"
              class="il__input--sm"
              value={entry.duration}
              placeholder="10 min"
              oninput={(e) =>
                updateEntry(entry.id, 'duration', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="il__field il__field--compact">
            Intensity
            <input
              type="text"
              class="il__input--sm"
              value={entry.intensity}
              placeholder="mod"
              oninput={(e) =>
                updateEntry(entry.id, 'intensity', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="il__field il__field--compact">
            <span>Time <span class="il__unit">(min)</span></span>
            <input
              type="text"
              inputmode="numeric"
              class="il__input--sm"
              value={entry.timeMinutes}
              placeholder="15"
              oninput={(e) =>
                updateEntry(entry.id, 'timeMinutes', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <!-- Row 4: Patient Response + Notes -->
        <div class="il__row">
          <label class="il__field">
            Patient Response
            <select
              value={entry.patientResponse}
              onchange={(e) =>
                updateEntry(entry.id, 'patientResponse', (e.target as HTMLSelectElement).value)}
            >
              <option value="">Select response...</option>
              {#each PATIENT_RESPONSE_OPTIONS as opt}
                <option value={opt.id}>{opt.label}</option>
              {/each}
            </select>
          </label>
          <label class="il__field il__field--grow">
            Notes
            <input
              type="text"
              value={entry.notes}
              placeholder="Specifics about tolerance, pain response, functional change..."
              oninput={(e) => updateEntry(entry.id, 'notes', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      </div>
    {/each}

    <button type="button" class="il__add-btn" onclick={addEntry}>+ Add Intervention</button>
  {/if}
</div>

<style>
  .il {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .il__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .il__entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
  }

  .il__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .il__number {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-neutral-400, #9e9e9e);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .il__number::before {
    content: 'Intervention ';
  }

  .il__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .il__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .il__field--grow {
    flex: 1;
    min-width: 120px;
  }

  .il__field--full {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    width: 100%;
  }

  .il__field--compact {
    flex: 0 0 auto;
    min-width: 60px;
  }

  .il__input--sm {
    width: 4rem;
    text-align: center;
  }

  .il__unit {
    font-weight: 400;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .il__remove {
    flex-shrink: 0;
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

  .il__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .il__add-btn {
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

  .il__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
