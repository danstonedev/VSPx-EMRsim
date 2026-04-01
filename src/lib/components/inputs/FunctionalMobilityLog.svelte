<!--
  FunctionalMobilityLog — structured functional mobility / transfer documentation.
  Repeatable entries for bed mobility, transfers, and wheelchair mobility.
  Captures activity, assistance level, cues, device, and notes.
-->
<script lang="ts">
  import type { FunctionalMobilityEntry } from '$lib/types/sections';

  interface Props {
    entries: FunctionalMobilityEntry[];
    onUpdate: (entries: FunctionalMobilityEntry[]) => void;
  }

  let { entries, onUpdate }: Props = $props();

  const ACTIVITIES = [
    { value: '', label: 'Select activity...' },
    { value: 'rolling-l', label: 'Rolling — Left' },
    { value: 'rolling-r', label: 'Rolling — Right' },
    { value: 'supine-to-sit', label: 'Supine ↔ Sit' },
    { value: 'sit-to-stand', label: 'Sit ↔ Stand' },
    { value: 'stand-pivot', label: 'Stand Pivot Transfer' },
    { value: 'sliding-board', label: 'Sliding Board Transfer' },
    { value: 'bed-to-chair', label: 'Bed ↔ Chair' },
    { value: 'chair-to-toilet', label: 'Chair ↔ Toilet' },
    { value: 'car-transfer', label: 'Car Transfer' },
    { value: 'floor-to-stand', label: 'Floor ↔ Stand' },
    { value: 'wheelchair-mobility', label: 'Wheelchair Mobility' },
    { value: 'scooting', label: 'Scooting in Bed' },
    { value: 'other', label: 'Other' },
  ];

  const ASSISTANCE_LEVELS = [
    { value: '', label: 'Select...' },
    { value: 'independent', label: 'Independent' },
    { value: 'modified-independent', label: 'Modified Independent' },
    { value: 'supervision', label: 'Supervision' },
    { value: 'contact-guard', label: 'Contact Guard (CGA)' },
    { value: 'min-assist', label: 'Min Assist (25%)' },
    { value: 'mod-assist', label: 'Mod Assist (50%)' },
    { value: 'max-assist', label: 'Max Assist (75%)' },
    { value: 'dependent', label: 'Dependent' },
    { value: 'not-tested', label: 'Not Tested' },
  ];

  const CUE_OPTIONS = [
    { value: '', label: 'Select...' },
    { value: 'none', label: 'None' },
    { value: 'verbal', label: 'Verbal' },
    { value: 'tactile', label: 'Tactile' },
    { value: 'verbal-tactile', label: 'Verbal + Tactile' },
  ];

  const DEVICE_OPTIONS = [
    { value: '', label: 'Select...' },
    { value: 'none', label: 'None' },
    { value: 'bed-rail', label: 'Bed Rail' },
    { value: 'trapeze', label: 'Trapeze' },
    { value: 'walker', label: 'Walker' },
    { value: 'transfer-board', label: 'Transfer Board' },
    { value: 'gait-belt', label: 'Gait Belt' },
    { value: 'stand-pivot-disc', label: 'Stand Pivot Disc' },
    { value: 'mechanical-lift', label: 'Mechanical Lift' },
    { value: 'other', label: 'Other' },
  ];

  function genId(): string {
    return `fm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addEntry() {
    onUpdate([
      ...entries,
      {
        id: genId(),
        activity: '',
        assistanceLevel: '',
        cues: '',
        device: '',
        notes: '',
      },
    ]);
  }

  function removeEntry(id: string) {
    onUpdate(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof FunctionalMobilityEntry, value: string) {
    onUpdate(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }
</script>

<div class="fm">
  {#if entries.length === 0}
    <div class="fm__empty">
      No functional mobility documented.
      <button type="button" class="fm__add-btn" onclick={addEntry}>Add Activity</button>
    </div>
  {:else}
    {#each entries as entry (entry.id)}
      <div class="fm__entry">
        <div class="fm__row">
          <label class="fm__field fm__field--grow">
            Activity
            <select
              value={entry.activity}
              onchange={(e) =>
                updateEntry(entry.id, 'activity', (e.target as HTMLSelectElement).value)}
            >
              {#each ACTIVITIES as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="fm__field">
            Assistance Level
            <select
              value={entry.assistanceLevel}
              onchange={(e) =>
                updateEntry(entry.id, 'assistanceLevel', (e.target as HTMLSelectElement).value)}
            >
              {#each ASSISTANCE_LEVELS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <button
            type="button"
            class="fm__remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove activity">&times;</button
          >
        </div>
        <div class="fm__row">
          <label class="fm__field">
            Cues
            <select
              value={entry.cues}
              onchange={(e) => updateEntry(entry.id, 'cues', (e.target as HTMLSelectElement).value)}
            >
              {#each CUE_OPTIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="fm__field">
            Device
            <select
              value={entry.device}
              onchange={(e) =>
                updateEntry(entry.id, 'device', (e.target as HTMLSelectElement).value)}
            >
              {#each DEVICE_OPTIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="fm__field fm__field--grow">
            Notes
            <input
              type="text"
              value={entry.notes}
              placeholder="Specifics, safety concerns..."
              oninput={(e) => updateEntry(entry.id, 'notes', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      </div>
    {/each}

    <button type="button" class="fm__add-btn" onclick={addEntry}>+ Add Activity</button>
  {/if}
</div>

<style>
  .fm {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .fm__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .fm__entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
  }

  .fm__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .fm__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .fm__field--grow {
    flex: 1;
    min-width: 120px;
  }

  .fm__remove {
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

  .fm__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .fm__add-btn {
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

  .fm__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
