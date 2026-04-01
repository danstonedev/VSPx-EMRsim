<!--
  EdemaAssessment — structured edema documentation with repeatable entries.
  Each entry captures: location, grade, type, circumference with landmark.
  Replaces free-text edema textarea.
-->
<script lang="ts">
  import type { EdemaEntry } from '$lib/types/sections';

  interface Props {
    entries: EdemaEntry[];
    onUpdate: (entries: EdemaEntry[]) => void;
  }

  let { entries, onUpdate }: Props = $props();

  const LOCATIONS = [
    { value: '', label: 'Select location...' },
    { value: 'bilateral-le', label: 'Bilateral LE' },
    { value: 'l-le', label: 'Left LE' },
    { value: 'r-le', label: 'Right LE' },
    { value: 'l-ue', label: 'Left UE' },
    { value: 'r-ue', label: 'Right UE' },
    { value: 'bilateral-ue', label: 'Bilateral UE' },
    { value: 'l-hand', label: 'Left Hand' },
    { value: 'r-hand', label: 'Right Hand' },
    { value: 'l-foot', label: 'Left Foot' },
    { value: 'r-foot', label: 'Right Foot' },
    { value: 'sacral', label: 'Sacral' },
    { value: 'periorbital', label: 'Periorbital' },
    { value: 'other', label: 'Other' },
  ];

  const GRADES = [
    { value: '', label: 'Grade...' },
    { value: '0', label: '0 — None' },
    { value: 'trace', label: 'Trace' },
    { value: '1+', label: '1+ — Mild (2mm)' },
    { value: '2+', label: '2+ — Moderate (4mm)' },
    { value: '3+', label: '3+ — Severe (6mm)' },
    { value: '4+', label: '4+ — Very severe (8mm+)' },
  ];

  const TYPES = [
    { value: '', label: 'Type...' },
    { value: 'pitting', label: 'Pitting' },
    { value: 'non-pitting', label: 'Non-pitting' },
  ];

  function genId(): string {
    return `edema-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addEntry() {
    const entry: EdemaEntry = {
      id: genId(),
      location: '',
      locationOther: '',
      grade: '',
      type: '',
      circumference: '',
      landmark: '',
      notes: '',
    };
    onUpdate([...entries, entry]);
  }

  function removeEntry(id: string) {
    onUpdate(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof EdemaEntry, value: string) {
    onUpdate(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }
</script>

<div class="ea">
  {#if entries.length === 0}
    <div class="ea__empty">
      No edema findings documented.
      <button type="button" class="ea__add-btn" onclick={addEntry}>Add Finding</button>
    </div>
  {:else}
    {#each entries as entry (entry.id)}
      <div class="ea__entry">
        <div class="ea__row">
          <label class="ea__field">
            Location
            <select
              value={entry.location}
              onchange={(e) =>
                updateEntry(entry.id, 'location', (e.target as HTMLSelectElement).value)}
            >
              {#each LOCATIONS as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>

          {#if entry.location === 'other'}
            <label class="ea__field ea__field--grow">
              Specify
              <input
                type="text"
                class="ea__input"
                value={entry.locationOther}
                placeholder="Location..."
                oninput={(e) =>
                  updateEntry(entry.id, 'locationOther', (e.target as HTMLInputElement).value)}
              />
            </label>
          {/if}

          <label class="ea__field">
            Grade
            <select
              value={entry.grade}
              onchange={(e) =>
                updateEntry(entry.id, 'grade', (e.target as HTMLSelectElement).value)}
            >
              {#each GRADES as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>

          <label class="ea__field">
            Type
            <select
              value={entry.type}
              onchange={(e) => updateEntry(entry.id, 'type', (e.target as HTMLSelectElement).value)}
            >
              {#each TYPES as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>

          <button
            type="button"
            class="ea__remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove edema finding">&times;</button
          >
        </div>

        <div class="ea__row">
          <label class="ea__field ea__field--sm">
            Circumference
            <div class="ea__measure">
              <input
                type="text"
                inputmode="numeric"
                class="ea__input--sm"
                value={entry.circumference}
                placeholder="cm"
                oninput={(e) =>
                  updateEntry(entry.id, 'circumference', (e.target as HTMLInputElement).value)}
              /><span class="ea__unit">cm</span>
            </div>
          </label>

          <label class="ea__field ea__field--grow">
            Landmark
            <input
              type="text"
              value={entry.landmark}
              placeholder="e.g., 10 cm above lateral malleolus"
              oninput={(e) =>
                updateEntry(entry.id, 'landmark', (e.target as HTMLInputElement).value)}
            />
          </label>

          <label class="ea__field ea__field--grow">
            Notes
            <input
              type="text"
              value={entry.notes}
              placeholder="Additional findings..."
              oninput={(e) => updateEntry(entry.id, 'notes', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      </div>
    {/each}

    <button type="button" class="ea__add-btn" onclick={addEntry}>+ Add Finding</button>
  {/if}
</div>

<style>
  .ea {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ea__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .ea__entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
  }

  .ea__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .ea__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .ea__field--grow {
    flex: 1;
    min-width: 120px;
  }

  .ea__field--sm {
    flex: 0 0 auto;
  }

  .ea__input--sm {
    width: 3.5rem;
    text-align: center;
  }

  .ea__measure {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .ea__unit {
    font-size: 0.6875rem;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .ea__remove {
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
    margin-bottom: 0.125rem;
  }

  .ea__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .ea__add-btn {
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

  .ea__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
