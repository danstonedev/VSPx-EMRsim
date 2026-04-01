<!--
  GaitAssessment — structured gait analysis documentation.
  Captures assistive device, assistance level, surface, distance/duration,
  auto-calculated gait speed, and per-side deviation checklist.
  Replaces the free-text Functional Assessment textarea.
-->
<script lang="ts">
  import type { GaitAssessmentData, GaitDeviationFinding } from '$lib/types/sections';

  interface Props {
    data: GaitAssessmentData;
    onUpdate: (data: GaitAssessmentData) => void;
  }

  let { data, onUpdate }: Props = $props();

  const ASSISTIVE_DEVICES = [
    { value: '', label: 'Select...' },
    { value: 'none', label: 'None' },
    { value: 'spc', label: 'SPC (Single Point Cane)' },
    { value: 'nbqc', label: 'NBQC (Narrow-Base Quad Cane)' },
    { value: 'wbqc', label: 'WBQC (Wide-Base Quad Cane)' },
    { value: 'lofstrand', label: 'Lofstrand Crutch' },
    { value: 'axillary-crutches', label: 'Axillary Crutches' },
    { value: 'fww', label: 'FWW (Front-Wheeled Walker)' },
    { value: 'rw', label: 'RW (Rolling Walker)' },
    { value: 'rollator', label: 'Rollator' },
    { value: 'platform-walker', label: 'Platform Walker' },
    { value: 'wheelchair', label: 'Wheelchair' },
    { value: 'other', label: 'Other' },
  ];

  const ASSISTANCE_LEVELS = [
    { value: '', label: 'Select...' },
    { value: 'independent', label: 'Independent' },
    { value: 'modified-independent', label: 'Modified Independent' },
    { value: 'supervision', label: 'Supervision' },
    { value: 'contact-guard', label: 'Contact Guard Assist (CGA)' },
    { value: 'min-assist', label: 'Minimal Assist (25%)' },
    { value: 'mod-assist', label: 'Moderate Assist (50%)' },
    { value: 'max-assist', label: 'Maximal Assist (75%)' },
    { value: 'dependent', label: 'Dependent' },
  ];

  const SURFACES = [
    { value: '', label: 'Select...' },
    { value: 'level', label: 'Level / Indoor' },
    { value: 'carpet', label: 'Carpet' },
    { value: 'uneven', label: 'Uneven / Outdoor' },
    { value: 'stairs', label: 'Stairs' },
    { value: 'ramp', label: 'Ramp' },
    { value: 'curb', label: 'Curb' },
    { value: 'grass', label: 'Grass' },
  ];

  const GAIT_DEVIATIONS = [
    'Trendelenburg',
    'Antalgic',
    'Circumduction',
    'Foot drop / Steppage',
    'Vaulting',
    'Reduced arm swing',
    'Festinating',
    'Ataxic / Wide-based',
    'Scissors',
    'Lateral trunk lean',
    'Knee hyperextension',
    'Hip hiking',
    'Decreased stance time',
    'Decreased step length',
  ];

  const SIDE_OPTIONS = [
    { value: '', label: '—' },
    { value: 'L', label: 'L' },
    { value: 'R', label: 'R' },
    { value: 'bilateral', label: 'Bi' },
  ];

  // Auto-calculate gait speed
  const computedGaitSpeed = $derived.by((): string => {
    const dist = parseFloat(data.distance || '');
    const dur = parseFloat(data.duration || '');
    if (!dist || !dur || dur <= 0) return '';
    const distMeters = data.distanceUnit === 'ft' ? dist * 0.3048 : dist;
    return (distMeters / dur).toFixed(2);
  });

  function update(field: keyof GaitAssessmentData, value: unknown) {
    onUpdate({ ...data, [field]: value });
  }

  function getDeviation(name: string): GaitDeviationFinding {
    return data.deviations?.[name] ?? { present: false, side: '' };
  }

  function updateDeviation(
    name: string,
    field: keyof GaitDeviationFinding,
    value: boolean | string,
  ) {
    const current = getDeviation(name);
    const updated = { ...current, [field]: value };
    if (field === 'present' && !value) updated.side = '';
    onUpdate({
      ...data,
      deviations: { ...(data.deviations ?? {}), [name]: updated },
    });
  }

  const deviationCount = $derived.by((): number => {
    if (!data.deviations) return 0;
    return Object.values(data.deviations).filter((d) => d.present).length;
  });
</script>

<div class="ga">
  <!-- Row 1: Device, Assistance, Surface -->
  <div class="ga__row">
    <label class="ga__field">
      Assistive Device
      <select
        value={data.assistiveDevice ?? ''}
        onchange={(e) => update('assistiveDevice', (e.target as HTMLSelectElement).value)}
      >
        {#each ASSISTIVE_DEVICES as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ga__field">
      Level of Assistance
      <select
        value={data.assistanceLevel ?? ''}
        onchange={(e) => update('assistanceLevel', (e.target as HTMLSelectElement).value)}
      >
        {#each ASSISTANCE_LEVELS as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ga__field">
      Surface
      <select
        value={data.surface ?? ''}
        onchange={(e) => update('surface', (e.target as HTMLSelectElement).value)}
      >
        {#each SURFACES as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
  </div>

  <!-- Row 2: Distance, Duration, Gait Speed -->
  <div class="ga__row">
    <label class="ga__field ga__field--compact">
      Distance
      <div class="ga__measure">
        <input
          type="text"
          inputmode="numeric"
          class="ga__input--sm"
          value={data.distance ?? ''}
          placeholder="100"
          oninput={(e) => update('distance', (e.target as HTMLInputElement).value)}
        />
        <select
          value={data.distanceUnit ?? 'ft'}
          onchange={(e) => update('distanceUnit', (e.target as HTMLSelectElement).value)}
        >
          <option value="ft">ft</option>
          <option value="m">m</option>
        </select>
      </div>
    </label>
    <label class="ga__field ga__field--compact">
      Duration
      <div class="ga__measure">
        <input
          type="text"
          class="ga__input--sm"
          value={data.duration ?? ''}
          placeholder="45"
          oninput={(e) => update('duration', (e.target as HTMLInputElement).value)}
        />
        <span class="ga__unit">sec</span>
      </div>
    </label>
    <label class="ga__field ga__field--compact">
      Gait Speed
      <div class="ga__measure">
        <input
          type="text"
          class="ga__input--sm ga__input--readonly"
          value={computedGaitSpeed}
          readonly
          tabindex="-1"
          placeholder="auto"
        />
        <span class="ga__unit">m/s</span>
      </div>
    </label>
  </div>

  <!-- Gait Deviations Checklist -->
  <details class="ga__deviations" open={deviationCount > 0}>
    <summary class="ga__dev-header">
      Gait Deviations
      {#if deviationCount > 0}
        <span class="ga__dev-count">{deviationCount}</span>
      {/if}
    </summary>
    <div class="ga__dev-grid">
      {#each GAIT_DEVIATIONS as dev}
        {@const finding = getDeviation(dev)}
        <div class="ga__dev-item" class:ga__dev-item--active={finding.present}>
          <label class="ga__dev-label">
            <input
              type="checkbox"
              class="ga__checkbox"
              checked={finding.present}
              onchange={(e) =>
                updateDeviation(dev, 'present', (e.target as HTMLInputElement).checked)}
            />
            {dev}
          </label>
          {#if finding.present}
            <select
              value={finding.side}
              onchange={(e) => updateDeviation(dev, 'side', (e.target as HTMLSelectElement).value)}
            >
              {#each SIDE_OPTIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
            </select>
          {/if}
        </div>
      {/each}
    </div>
  </details>

  <!-- Notes -->
  <label class="ga__field ga__field--full">
    Notes
    <input
      type="text"
      value={data.notes ?? ''}
      placeholder="Gait pattern description, compensatory strategies, safety concerns..."
      oninput={(e) => update('notes', (e.target as HTMLInputElement).value)}
    />
  </label>
</div>

<style>
  .ga {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ga__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .ga__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
    flex: 1;
  }

  .ga__field--compact {
    flex: 0 0 auto;
  }

  .ga__field--full {
    width: 100%;
  }

  .ga__input--sm {
    width: 4rem;
    text-align: center;
  }

  .ga__input--readonly {
    font-weight: 600;
    cursor: default;
  }

  .ga__measure {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .ga__unit {
    font-size: 0.625rem;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .ga__deviations {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    overflow: hidden;
  }

  .ga__dev-header {
    padding: 0.375rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--color-neutral-700, #424242);
    background: var(--color-neutral-50, #fafafa);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .ga__dev-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--color-brand-green, #009a44);
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
  }

  .ga__dev-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.125rem 0.5rem;
    padding: 0.375rem 0.625rem;
  }

  .ga__dev-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0;
  }

  .ga__dev-item--active {
    background: rgba(0, 154, 68, 0.04);
    border-radius: 3px;
    padding: 0.125rem 0.25rem;
  }

  .ga__dev-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    white-space: nowrap;
  }

  .ga__checkbox {
    width: 13px;
    height: 13px;
    accent-color: var(--color-brand-green, #009a44);
  }
</style>
