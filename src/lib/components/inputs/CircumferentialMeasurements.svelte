<!--
  CircumferentialMeasurements — repeatable limb girth measurements.
  Used alongside edema assessment for objective volumetric tracking.
  Captures location, side, measurement (cm), and bony landmark reference.
-->
<script lang="ts">
  import type { CircumferentialEntry } from '$lib/types/sections';

  interface Props {
    entries: CircumferentialEntry[];
    onUpdate: (entries: CircumferentialEntry[]) => void;
  }

  let { entries, onUpdate }: Props = $props();

  const LOCATIONS = [
    { value: '', label: 'Select location...' },
    { value: 'mid-thigh', label: 'Mid-Thigh' },
    { value: 'suprapatellar', label: 'Suprapatellar (10 cm above patella)' },
    { value: 'mid-patella', label: 'Mid-Patella' },
    { value: 'tibial-tuberosity', label: 'Tibial Tuberosity' },
    { value: 'mid-calf', label: 'Mid-Calf' },
    { value: 'ankle-figure8', label: 'Ankle Figure-8' },
    { value: 'mid-forearm', label: 'Mid-Forearm' },
    { value: 'wrist', label: 'Wrist' },
    { value: 'metacarpal', label: 'Metacarpal' },
    { value: 'other', label: 'Other' },
  ];

  function genId(): string {
    return `circ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addEntry() {
    onUpdate([
      ...entries,
      {
        id: genId(),
        location: '',
        locationOther: '',
        side: '',
        measurement: '',
        landmark: '',
      },
    ]);
  }

  function removeEntry(id: string) {
    onUpdate(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof CircumferentialEntry, value: string) {
    onUpdate(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }
</script>

<div class="circ">
  {#if entries.length === 0}
    <div class="circ__empty">
      No circumferential measurements documented.
      <button type="button" class="circ__add-btn" onclick={addEntry}>Add Measurement</button>
    </div>
  {:else}
    {#each entries as entry (entry.id)}
      <div class="circ__entry">
        <div class="circ__row">
          <label class="circ__field circ__field--grow">
            Location
            <select
              class="circ__select"
              value={entry.location}
              onchange={(e) =>
                updateEntry(entry.id, 'location', (e.target as HTMLSelectElement).value)}
            >
              {#each LOCATIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          {#if entry.location === 'other'}
            <label class="circ__field circ__field--grow">
              Specify
              <input
                type="text"
                class="circ__input"
                value={entry.locationOther}
                placeholder="Location description"
                oninput={(e) =>
                  updateEntry(entry.id, 'locationOther', (e.target as HTMLInputElement).value)}
              />
            </label>
          {/if}
          <label class="circ__field">
            Side
            <select
              class="circ__select"
              value={entry.side}
              onchange={(e) => updateEntry(entry.id, 'side', (e.target as HTMLSelectElement).value)}
            >
              <option value="">—</option>
              <option value="L">L</option>
              <option value="R">R</option>
              <option value="bilateral">Bilateral</option>
            </select>
          </label>
          <label class="circ__field">
            Measurement
            <div class="circ__measure">
              <input
                type="text"
                inputmode="numeric"
                class="circ__input circ__input--sm"
                value={entry.measurement}
                placeholder="0.0"
                oninput={(e) =>
                  updateEntry(entry.id, 'measurement', (e.target as HTMLInputElement).value)}
              />
              <span class="circ__unit">cm</span>
            </div>
          </label>
          <button
            type="button"
            class="circ__remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove measurement">&times;</button
          >
        </div>
        <label class="circ__field circ__field--full">
          Landmark Reference
          <input
            type="text"
            class="circ__input"
            value={entry.landmark}
            placeholder="e.g. 15 cm above lateral joint line"
            oninput={(e) => updateEntry(entry.id, 'landmark', (e.target as HTMLInputElement).value)}
          />
        </label>
      </div>
    {/each}
    <button type="button" class="circ__add-btn" onclick={addEntry}>+ Add Measurement</button>
  {/if}
</div>

<style>
  .circ {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .circ__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .circ__entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
  }

  .circ__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .circ__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .circ__field--grow {
    flex: 1;
    min-width: 120px;
  }

  .circ__field--full {
    width: 100%;
  }

  .circ__select,
  .circ__input {
    font-size: 0.75rem;
    padding: 0.3rem 0.4rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
  }

  .circ__input--sm {
    width: 3.5rem;
    text-align: center;
  }

  .circ__measure {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .circ__unit {
    font-size: 0.625rem;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .circ__remove {
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

  .circ__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .circ__add-btn {
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

  .circ__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
