<!--
  DieteticsBillingSection — MNT billing for dietetics notes.
  CPT codes (97802-97804), units, time, ICD-10 codes, and medical necessity justification.
  Ported from app/js/views/dietetics/dietetics_workspace.js renderBillingSection()
-->
<script lang="ts">
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { dieteticsNoteDraft, updateDieteticsField } from '$lib/stores/noteSession';
  import type { DieteticsBillingData } from '$lib/types/sections';

  const MNT_CPT_CODES = [
    { value: '', label: '— Select CPT —' },
    { value: '97802', label: '97802 — MNT Initial Assessment (15 min)' },
    { value: '97803', label: '97803 — MNT Re-assessment (15 min)' },
    { value: '97804', label: '97804 — MNT Group Counseling (30 min)' },
  ];

  const section = $derived($dieteticsNoteDraft.billing);

  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string): void {
    collapsed = { ...collapsed, [id]: !isCollapsed(id) };
  }

  function field(key: keyof DieteticsBillingData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function onInput(key: keyof DieteticsBillingData, e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateDieteticsField('billing', key, target.value);
  }
</script>

<div class="section-panel">
  <div class="section-panel__header">
    <h2 class="section-panel__title">
      <span class="material-symbols-outlined ncp-icon" aria-hidden="true">receipt_long</span>
      Billing
    </h2>
  </div>

  <CollapsibleSubsection
    title="MNT Billing Codes"
    open={!isCollapsed('billing-codes')}
    onToggle={() => toggleCollapse('billing-codes')}
    dataSubsection="billing-codes"
  >
    <div class="inline-row">
      <div class="inline-row__cell">
        <label class="form-label" for="db-cpt">CPT Code</label>
        <select id="db-cpt" value={field('cpt_code')} onchange={(e) => onInput('cpt_code', e)}>
          {#each MNT_CPT_CODES as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
      <div class="inline-row__cell">
        <label class="form-label" for="db-units">Units</label>
        <input
          id="db-units"
          type="number"
          placeholder="Number of 15-min units"
          value={field('units')}
          oninput={(e) => onInput('units', e)}
        />
      </div>
    </div>

    <div class="inline-row">
      <div class="inline-row__cell">
        <label class="form-label" for="db-time">Time (minutes)</label>
        <input
          id="db-time"
          type="number"
          placeholder="Total face-to-face time"
          value={field('time_minutes')}
          oninput={(e) => onInput('time_minutes', e)}
        />
      </div>
      <div class="inline-row__cell">
        <label class="form-label" for="db-icd10">ICD-10 Diagnosis Codes</label>
        <input
          id="db-icd10"
          type="text"
          placeholder="e.g. E11.65, E44.0"
          value={field('diagnosis_codes')}
          oninput={(e) => onInput('diagnosis_codes', e)}
        />
      </div>
    </div>
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Medical Necessity"
    open={!isCollapsed('billing-justification')}
    onToggle={() => toggleCollapse('billing-justification')}
    dataSubsection="billing-justification"
  >
    <div class="form-group">
      <label class="form-label" for="db-justification">Justification</label>
      <textarea
        id="db-justification"
        rows="2"
        placeholder="Medical necessity statement supporting the nutrition intervention"
        value={field('justification')}
        oninput={(e) => onInput('justification', e)}
      ></textarea>
    </div>
  </CollapsibleSubsection>
</div>

<style>
  .section-panel__header {
    margin-bottom: 0.5rem;
  }

  .section-panel__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-neutral-900, #1a1a1a);
    margin: 0;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    margin-bottom: 0.25rem;
  }

  textarea {
    resize: vertical;
    min-height: 3rem;
  }

  .inline-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .inline-row__cell {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 640px) {
    .inline-row {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
