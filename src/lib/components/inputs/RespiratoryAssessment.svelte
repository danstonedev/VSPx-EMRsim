<!--
  RespiratoryAssessment — structured heart sounds, lung auscultation,
  respiratory pattern, and cough assessment.
  Replaces the single auscultation free-text textarea.
-->
<script lang="ts">
  import type { LungAuscultationData, RespiratoryPatternData } from '$lib/types/sections';

  interface Props {
    heartSounds: string;
    lungAuscultation: LungAuscultationData;
    respiratoryPattern: RespiratoryPatternData;
    legacyAuscultation: string;
    onHeartSoundsChange: (value: string) => void;
    onLungChange: (data: LungAuscultationData) => void;
    onRespPatternChange: (data: RespiratoryPatternData) => void;
  }

  let {
    heartSounds,
    lungAuscultation,
    respiratoryPattern,
    legacyAuscultation,
    onHeartSoundsChange,
    onLungChange,
    onRespPatternChange,
  }: Props = $props();

  const LUNG_FINDINGS = [
    { value: '', label: 'Select...' },
    { value: 'clear', label: 'Clear' },
    { value: 'crackles', label: 'Crackles' },
    { value: 'wheezes', label: 'Wheezes' },
    { value: 'rhonchi', label: 'Rhonchi' },
    { value: 'diminished', label: 'Diminished' },
    { value: 'absent', label: 'Absent' },
    { value: 'stridor', label: 'Stridor' },
  ];

  const RESP_PATTERNS = [
    { value: '', label: 'Select...' },
    { value: 'normal', label: 'Normal / Regular' },
    { value: 'tachypneic', label: 'Tachypneic' },
    { value: 'bradypneic', label: 'Bradypneic' },
    { value: 'kussmaul', label: 'Kussmaul' },
    { value: 'cheyne-stokes', label: 'Cheyne-Stokes' },
    { value: 'paradoxical', label: 'Paradoxical' },
    { value: 'apneustic', label: 'Apneustic' },
  ];

  const COUGH_STRENGTH = [
    { value: '', label: 'Select...' },
    { value: 'strong', label: 'Strong' },
    { value: 'weak', label: 'Weak' },
    { value: 'absent', label: 'Absent' },
  ];

  const COUGH_PRODUCTIVITY = [
    { value: '', label: 'Select...' },
    { value: 'productive', label: 'Productive' },
    { value: 'non-productive', label: 'Non-productive' },
  ];

  // Show legacy migration notice if old data exists but new fields are empty
  const showLegacyNotice = $derived(
    legacyAuscultation.trim() !== '' &&
      !heartSounds &&
      !lungAuscultation.rightUpper &&
      !lungAuscultation.leftUpper &&
      !lungAuscultation.rightLower &&
      !lungAuscultation.leftLower,
  );

  function updateLung(field: keyof LungAuscultationData, value: string) {
    onLungChange({ ...lungAuscultation, [field]: value });
  }

  function updateResp(field: keyof RespiratoryPatternData, value: string) {
    onRespPatternChange({ ...respiratoryPattern, [field]: value });
  }
</script>

<div class="ra">
  {#if showLegacyNotice}
    <div class="ra__legacy">
      <strong>Previous notes:</strong>
      {legacyAuscultation}
    </div>
  {/if}

  <!-- Heart Sounds -->
  <label class="ra__field ra__field--full">
    Heart Sounds
    <input
      type="text"
      value={heartSounds}
      placeholder="S1/S2 regular, no murmurs/gallops/rubs..."
      oninput={(e) => onHeartSoundsChange((e.target as HTMLInputElement).value)}
    />
  </label>

  <!-- Lung Auscultation Grid -->
  <div class="ra__section-label">Lung Auscultation</div>
  <div class="ra__lung-grid">
    <label class="ra__field">
      Right Upper
      <select
        class=""
        value={lungAuscultation.rightUpper ?? ''}
        onchange={(e) => updateLung('rightUpper', (e.target as HTMLSelectElement).value)}
      >
        {#each LUNG_FINDINGS as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ra__field">
      Left Upper
      <select
        class=""
        value={lungAuscultation.leftUpper ?? ''}
        onchange={(e) => updateLung('leftUpper', (e.target as HTMLSelectElement).value)}
      >
        {#each LUNG_FINDINGS as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ra__field">
      Right Lower
      <select
        class=""
        value={lungAuscultation.rightLower ?? ''}
        onchange={(e) => updateLung('rightLower', (e.target as HTMLSelectElement).value)}
      >
        {#each LUNG_FINDINGS as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ra__field">
      Left Lower
      <select
        class=""
        value={lungAuscultation.leftLower ?? ''}
        onchange={(e) => updateLung('leftLower', (e.target as HTMLSelectElement).value)}
      >
        {#each LUNG_FINDINGS as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
  </div>
  <label class="ra__field ra__field--full">
    Auscultation Notes
    <input
      type="text"
      value={lungAuscultation.notes ?? ''}
      placeholder="Additional findings..."
      oninput={(e) => updateLung('notes', (e.target as HTMLInputElement).value)}
    />
  </label>

  <!-- Respiratory Pattern -->
  <div class="ra__section-label">Respiratory Pattern</div>
  <div class="ra__row">
    <label class="ra__field">
      Pattern
      <select
        class=""
        value={respiratoryPattern.pattern ?? ''}
        onchange={(e) => updateResp('pattern', (e.target as HTMLSelectElement).value)}
      >
        {#each RESP_PATTERNS as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ra__field">
      Accessory Muscle Use
      <select
        class=""
        value={respiratoryPattern.accessoryMuscleUse ?? ''}
        onchange={(e) => updateResp('accessoryMuscleUse', (e.target as HTMLSelectElement).value)}
      >
        <option value="">Select...</option>
        <option value="no">No</option>
        <option value="yes">Yes</option>
      </select>
    </label>
    <label class="ra__field">
      Cough Strength
      <select
        class=""
        value={respiratoryPattern.coughStrength ?? ''}
        onchange={(e) => updateResp('coughStrength', (e.target as HTMLSelectElement).value)}
      >
        {#each COUGH_STRENGTH as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
    <label class="ra__field">
      Cough Productivity
      <select
        class=""
        value={respiratoryPattern.coughProductivity ?? ''}
        onchange={(e) => updateResp('coughProductivity', (e.target as HTMLSelectElement).value)}
      >
        {#each COUGH_PRODUCTIVITY as opt}<option value={opt.value}>{opt.label}</option>{/each}
      </select>
    </label>
  </div>
  <label class="ra__field ra__field--full">
    Respiratory Notes
    <input
      type="text"
      value={respiratoryPattern.notes ?? ''}
      placeholder="Additional respiratory observations..."
      oninput={(e) => updateResp('notes', (e.target as HTMLInputElement).value)}
    />
  </label>
</div>

<style>
  .ra {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .ra__legacy {
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
    color: var(--color-neutral-600, #616161);
    background: var(--color-neutral-50, #fafafa);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    margin-bottom: 0.25rem;
  }

  .ra__section-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-500, #757575);
    margin-top: 0.375rem;
  }

  .ra__lung-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.375rem 0.75rem;
  }

  .ra__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .ra__field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .ra__field--full {
    width: 100%;
  }
</style>
