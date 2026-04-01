<!--
  ToneAssessment — structured Modified Ashworth Scale (MAS) tone documentation.
  Repeatable entries per muscle group with side and grade.
  Replaces the free-text tone textarea.
-->
<script lang="ts">
  import type { ToneEntry } from '$lib/types/sections';

  interface Props {
    entries: ToneEntry[];
    onUpdate: (entries: ToneEntry[]) => void;
  }

  let { entries, onUpdate }: Props = $props();

  const MAS_GRADES = [
    { value: '', label: 'Grade...' },
    { value: '0', label: '0 — No increase' },
    { value: '1', label: '1 — Slight catch and release' },
    { value: '1+', label: '1+ — Slight catch, min resistance' },
    { value: '2', label: '2 — Marked increase, full ROM' },
    { value: '3', label: '3 — Considerable increase, passive difficult' },
    { value: '4', label: '4 — Rigid' },
  ];

  const SIDES = [
    { value: '', label: 'Side...' },
    { value: 'L', label: 'Left' },
    { value: 'R', label: 'Right' },
    { value: 'bilateral', label: 'Bilateral' },
  ];

  const COMMON_MUSCLES = [
    'Biceps',
    'Triceps',
    'Wrist Flexors',
    'Wrist Extensors',
    'Finger Flexors',
    'Quadriceps',
    'Hamstrings',
    'Gastrocnemius/Soleus',
    'Hip Adductors',
    'Hip Flexors',
  ];

  function genId(): string {
    return `tone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addEntry() {
    const entry: ToneEntry = {
      id: genId(),
      muscleGroup: '',
      side: '',
      masGrade: '',
      notes: '',
    };
    onUpdate([...entries, entry]);
  }

  function removeEntry(id: string) {
    onUpdate(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof ToneEntry, value: string) {
    onUpdate(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }
</script>

<div class="ta">
  {#if entries.length === 0}
    <div class="ta__empty">
      No tone findings documented.
      <button type="button" class="ta__add-btn" onclick={addEntry}>Add Finding</button>
    </div>
  {:else}
    {#each entries as entry (entry.id)}
      <div class="ta__entry">
        <div class="ta__row">
          <label class="ta__field ta__field--grow">
            Muscle Group
            <input
              type="text"
              list="tone-muscles"
              value={entry.muscleGroup}
              placeholder="e.g., Biceps, Hamstrings..."
              oninput={(e) =>
                updateEntry(entry.id, 'muscleGroup', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="ta__field">
            Side
            <select
              value={entry.side}
              onchange={(e) => updateEntry(entry.id, 'side', (e.target as HTMLSelectElement).value)}
            >
              {#each SIDES as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
          <label class="ta__field">
            MAS Grade
            <select
              class="ta__select--wide"
              value={entry.masGrade}
              onchange={(e) =>
                updateEntry(entry.id, 'masGrade', (e.target as HTMLSelectElement).value)}
            >
              {#each MAS_GRADES as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
          <button
            type="button"
            class="ta__remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove tone finding">&times;</button
          >
        </div>
        <label class="ta__field ta__field--full">
          Notes
          <input
            type="text"
            value={entry.notes}
            placeholder="Velocity-dependent, clonus present, distribution..."
            oninput={(e) => updateEntry(entry.id, 'notes', (e.target as HTMLInputElement).value)}
          />
        </label>
      </div>
    {/each}

    <button type="button" class="ta__add-btn" onclick={addEntry}>+ Add Finding</button>
  {/if}
</div>

<datalist id="tone-muscles">
  {#each COMMON_MUSCLES as m}
    <option value={m}></option>
  {/each}
</datalist>

<style>
  .ta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ta__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .ta__entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
  }

  .ta__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .ta__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .ta__field--grow {
    flex: 1;
    min-width: 120px;
  }

  .ta__field--full {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
  }

  .ta__select--wide {
    min-width: 12rem;
  }

  .ta__remove {
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

  .ta__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .ta__add-btn {
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

  .ta__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
