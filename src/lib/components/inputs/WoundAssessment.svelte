<!--
  WoundAssessment — structured wound documentation with repeatable entries.
  Each wound captures: location, type, stage, dimensions, wound bed,
  exudate, odor, periwound, edges. Replaces skinIntegrity textarea.
-->
<script lang="ts">
  import type { WoundEntry } from '$lib/types/sections';

  interface Props {
    entries: WoundEntry[];
    onUpdate: (entries: WoundEntry[]) => void;
  }

  let { entries, onUpdate }: Props = $props();

  const WOUND_LOCATIONS = [
    { value: '', label: 'Select...' },
    { value: 'sacrum', label: 'Sacrum' },
    { value: 'coccyx', label: 'Coccyx' },
    { value: 'r-trochanter', label: 'R Greater Trochanter' },
    { value: 'l-trochanter', label: 'L Greater Trochanter' },
    { value: 'r-ischium', label: 'R Ischial Tuberosity' },
    { value: 'l-ischium', label: 'L Ischial Tuberosity' },
    { value: 'r-heel', label: 'R Heel' },
    { value: 'l-heel', label: 'L Heel' },
    { value: 'r-lateral-malleolus', label: 'R Lateral Malleolus' },
    { value: 'l-lateral-malleolus', label: 'L Lateral Malleolus' },
    { value: 'r-medial-malleolus', label: 'R Medial Malleolus' },
    { value: 'l-medial-malleolus', label: 'L Medial Malleolus' },
    { value: 'r-shin', label: 'R Anterior Shin' },
    { value: 'l-shin', label: 'L Anterior Shin' },
    { value: 'r-knee', label: 'R Knee' },
    { value: 'l-knee', label: 'L Knee' },
    { value: 'abdomen', label: 'Abdomen' },
    { value: 'r-upper-ext', label: 'R Upper Extremity' },
    { value: 'l-upper-ext', label: 'L Upper Extremity' },
    { value: 'other', label: 'Other' },
  ];

  const WOUND_TYPES = [
    { value: '', label: 'Select...' },
    { value: 'pressure-injury', label: 'Pressure Injury' },
    { value: 'surgical', label: 'Surgical' },
    { value: 'traumatic', label: 'Traumatic' },
    { value: 'venous', label: 'Venous Ulcer' },
    { value: 'arterial', label: 'Arterial Ulcer' },
    { value: 'diabetic', label: 'Diabetic / Neuropathic' },
    { value: 'skin-tear', label: 'Skin Tear' },
    { value: 'burn', label: 'Burn' },
    { value: 'other', label: 'Other' },
  ];

  const STAGES = [
    { value: '', label: 'Select...' },
    { value: 'stage-1', label: 'Stage I' },
    { value: 'stage-2', label: 'Stage II' },
    { value: 'stage-3', label: 'Stage III' },
    { value: 'stage-4', label: 'Stage IV' },
    { value: 'unstageable', label: 'Unstageable' },
    { value: 'dti', label: 'Deep Tissue Injury (DTI)' },
    { value: 'partial', label: 'Partial Thickness' },
    { value: 'full', label: 'Full Thickness' },
    { value: 'closed-surgical', label: 'Closed / Surgical' },
  ];

  const EXUDATE_AMOUNTS = [
    { value: '', label: '—' },
    { value: 'none', label: 'None' },
    { value: 'scant', label: 'Scant' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'copious', label: 'Copious' },
  ];

  const EXUDATE_TYPES = [
    { value: '', label: '—' },
    { value: 'serous', label: 'Serous' },
    { value: 'sanguineous', label: 'Sanguineous' },
    { value: 'serosanguineous', label: 'Serosanguineous' },
    { value: 'purulent', label: 'Purulent' },
  ];

  const PERIWOUND_OPTIONS = [
    { value: '', label: '—' },
    { value: 'intact', label: 'Intact' },
    { value: 'macerated', label: 'Macerated' },
    { value: 'erythematous', label: 'Erythematous' },
    { value: 'indurated', label: 'Indurated' },
    { value: 'calloused', label: 'Calloused' },
  ];

  const EDGE_OPTIONS = [
    { value: '', label: '—' },
    { value: 'attached', label: 'Attached / Well-defined' },
    { value: 'unattached', label: 'Unattached' },
    { value: 'rolled', label: 'Rolled (Epibole)' },
    { value: 'hyperkeratotic', label: 'Hyperkeratotic' },
  ];

  function genId(): string {
    return `wnd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function addEntry() {
    onUpdate([
      ...entries,
      {
        id: genId(),
        location: '',
        type: '',
        stage: '',
        length: '',
        width: '',
        depth: '',
        undermining: '',
        tunneling: '',
        woundBedGranulation: '',
        woundBedSlough: '',
        woundBedEschar: '',
        woundBedEpithelial: '',
        exudateAmount: '',
        exudateType: '',
        odor: '',
        periwound: '',
        woundEdges: '',
        notes: '',
      },
    ]);
  }

  function removeEntry(id: string) {
    onUpdate(entries.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof WoundEntry, value: string) {
    onUpdate(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  // Wound bed total %
  function bedTotal(entry: WoundEntry): number {
    return (
      (parseInt(entry.woundBedGranulation || '0') || 0) +
      (parseInt(entry.woundBedSlough || '0') || 0) +
      (parseInt(entry.woundBedEschar || '0') || 0) +
      (parseInt(entry.woundBedEpithelial || '0') || 0)
    );
  }
</script>

<div class="wa">
  {#if entries.length === 0}
    <div class="wa__empty">
      No wounds documented.
      <button type="button" class="wa__add-btn" onclick={addEntry}>Add Wound</button>
    </div>
  {:else}
    {#each entries as entry, idx (entry.id)}
      <details class="wa__entry" open>
        <summary class="wa__entry-header">
          <span
            >Wound {idx + 1}{entry.location
              ? ` — ${WOUND_LOCATIONS.find((l) => l.value === entry.location)?.label ?? entry.location}`
              : ''}</span
          >
          <button
            type="button"
            class="wa__remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove wound">&times;</button
          >
        </summary>

        <!-- Row 1: Location, Type, Stage -->
        <div class="wa__row">
          <label class="wa__field">
            Location
            <select
              value={entry.location}
              onchange={(e) =>
                updateEntry(entry.id, 'location', (e.target as HTMLSelectElement).value)}
            >
              {#each WOUND_LOCATIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="wa__field">
            Type
            <select
              value={entry.type}
              onchange={(e) => updateEntry(entry.id, 'type', (e.target as HTMLSelectElement).value)}
            >
              {#each WOUND_TYPES as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="wa__field">
            Stage / Classification
            <select
              value={entry.stage}
              onchange={(e) =>
                updateEntry(entry.id, 'stage', (e.target as HTMLSelectElement).value)}
            >
              {#each STAGES as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
        </div>

        <!-- Row 2: Dimensions -->
        <div class="wa__section-label">Dimensions (cm)</div>
        <div class="wa__row">
          <label class="wa__field wa__field--compact">
            Length
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.length}
              placeholder="L"
              oninput={(e) => updateEntry(entry.id, 'length', (e.target as HTMLInputElement).value)}
            />
          </label>
          <span class="wa__times">×</span>
          <label class="wa__field wa__field--compact">
            Width
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.width}
              placeholder="W"
              oninput={(e) => updateEntry(entry.id, 'width', (e.target as HTMLInputElement).value)}
            />
          </label>
          <span class="wa__times">×</span>
          <label class="wa__field wa__field--compact">
            Depth
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.depth}
              placeholder="D"
              oninput={(e) => updateEntry(entry.id, 'depth', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="wa__field wa__field--grow">
            Undermining
            <input
              type="text"
              class="wa__input"
              value={entry.undermining}
              placeholder="e.g., 2cm at 3 o'clock"
              oninput={(e) =>
                updateEntry(entry.id, 'undermining', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="wa__field wa__field--grow">
            Tunneling
            <input
              type="text"
              class="wa__input"
              value={entry.tunneling}
              placeholder="e.g., 1.5cm at 12 o'clock"
              oninput={(e) =>
                updateEntry(entry.id, 'tunneling', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <!-- Row 3: Wound Bed -->
        <div class="wa__section-label">
          Wound Bed (%)
          {#if bedTotal(entry) > 0}
            <span class="wa__bed-total" class:wa__bed-total--warn={bedTotal(entry) !== 100}>
              = {bedTotal(entry)}%
            </span>
          {/if}
        </div>
        <div class="wa__row">
          <label class="wa__field wa__field--compact">
            Granulation
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.woundBedGranulation}
              placeholder="%"
              oninput={(e) =>
                updateEntry(entry.id, 'woundBedGranulation', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="wa__field wa__field--compact">
            Slough
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.woundBedSlough}
              placeholder="%"
              oninput={(e) =>
                updateEntry(entry.id, 'woundBedSlough', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="wa__field wa__field--compact">
            Eschar
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.woundBedEschar}
              placeholder="%"
              oninput={(e) =>
                updateEntry(entry.id, 'woundBedEschar', (e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="wa__field wa__field--compact">
            Epithelial
            <input
              type="text"
              inputmode="numeric"
              class="wa__input--sm"
              value={entry.woundBedEpithelial}
              placeholder="%"
              oninput={(e) =>
                updateEntry(entry.id, 'woundBedEpithelial', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <!-- Row 4: Exudate, Odor, Periwound, Edges -->
        <div class="wa__row">
          <label class="wa__field">
            Exudate Amount
            <select
              value={entry.exudateAmount}
              onchange={(e) =>
                updateEntry(entry.id, 'exudateAmount', (e.target as HTMLSelectElement).value)}
            >
              {#each EXUDATE_AMOUNTS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="wa__field">
            Exudate Type
            <select
              value={entry.exudateType}
              onchange={(e) =>
                updateEntry(entry.id, 'exudateType', (e.target as HTMLSelectElement).value)}
            >
              {#each EXUDATE_TYPES as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="wa__field">
            Odor
            <select
              value={entry.odor}
              onchange={(e) => updateEntry(entry.id, 'odor', (e.target as HTMLSelectElement).value)}
            >
              <option value="">—</option>
              <option value="none">None</option>
              <option value="present">Present</option>
            </select>
          </label>
          <label class="wa__field">
            Periwound
            <select
              value={entry.periwound}
              onchange={(e) =>
                updateEntry(entry.id, 'periwound', (e.target as HTMLSelectElement).value)}
            >
              {#each PERIWOUND_OPTIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
          <label class="wa__field">
            Wound Edges
            <select
              value={entry.woundEdges}
              onchange={(e) =>
                updateEntry(entry.id, 'woundEdges', (e.target as HTMLSelectElement).value)}
            >
              {#each EDGE_OPTIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          </label>
        </div>

        <!-- Notes -->
        <label class="wa__field wa__field--full">
          Notes
          <input
            type="text"
            value={entry.notes}
            placeholder="Treatment applied, dressing type, additional findings..."
            oninput={(e) => updateEntry(entry.id, 'notes', (e.target as HTMLInputElement).value)}
          />
        </label>
      </details>
    {/each}

    <button type="button" class="wa__add-btn" onclick={addEntry}>+ Add Wound</button>
  {/if}
</div>

<style>
  .wa {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .wa__empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .wa__entry {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
    overflow: hidden;
  }

  .wa__entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    background: var(--color-neutral-50, #fafafa);
  }

  .wa__entry > :not(summary) {
    padding: 0 0.625rem;
    margin-bottom: 0.375rem;
  }

  .wa__section-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-500, #757575);
    padding: 0 0.625rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .wa__bed-total {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-brand-green, #009a44);
  }

  .wa__bed-total--warn {
    color: #dc2626;
  }

  .wa__row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.375rem;
    padding: 0 0.625rem;
  }

  .wa__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
    flex: 1;
  }

  .wa__field--compact {
    flex: 0 0 auto;
  }

  .wa__field--grow {
    flex: 2;
    min-width: 100px;
  }

  .wa__field--full {
    width: 100%;
    padding: 0 0.625rem;
  }

  .wa__times {
    font-weight: 700;
    color: var(--color-neutral-400, #9e9e9e);
    padding-bottom: 0.3rem;
  }

  .wa__input--sm {
    width: 3.5rem;
    text-align: center;
  }

  .wa__remove {
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

  .wa__remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .wa__add-btn {
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

  .wa__add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }
</style>
