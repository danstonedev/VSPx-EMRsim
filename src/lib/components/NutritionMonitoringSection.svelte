<!--
  NutritionMonitoringSection — ADIME "M/E" section.
  Monitoring indicators, evaluation criteria, outcomes, and follow-up plan.
  Ported from app/js/views/dietetics/dietetics_workspace.js renderMonitoringSection()
-->
<script lang="ts">
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { dieteticsNoteDraft, updateDieteticsField } from '$lib/stores/noteSession';
  import type { NutritionMonitoringData } from '$lib/types/sections';

  const MONITORING_INDICATORS = [
    { value: '', label: '— Select Indicator —' },
    { value: 'FH-1', label: 'FH-1 Food and Nutrient Intake' },
    { value: 'FH-7', label: 'FH-7 Food and Nutrient Administration' },
    { value: 'AD-1', label: 'AD-1 Body Composition / Growth' },
    { value: 'BD-1', label: 'BD-1 Nutritional Anemia Profile' },
    { value: 'BD-1.2', label: 'BD-1.2 Biochemical Index' },
    { value: 'PD-1', label: 'PD-1 Nutrition-Focused Physical Findings' },
    { value: 'CH-1', label: 'CH-1 Patient / Client History' },
  ];

  const section = $derived($dieteticsNoteDraft.nutrition_monitoring);

  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string): void {
    collapsed = { ...collapsed, [id]: !isCollapsed(id) };
  }

  function field(key: keyof NutritionMonitoringData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function onInput(key: keyof NutritionMonitoringData, e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateDieteticsField('nutrition_monitoring', key, target.value);
  }
</script>

<div class="section-panel">
  <div class="section-panel__header">
    <h2 class="section-panel__title">
      <span class="material-symbols-outlined ncp-icon" aria-hidden="true">monitoring</span>
      Monitoring & Evaluation
    </h2>
  </div>

  <CollapsibleSubsection
    title="Indicators & Criteria"
    open={!isCollapsed('monitoring-indicators')}
    onToggle={() => toggleCollapse('monitoring-indicators')}
    dataSubsection="monitoring-indicators"
  >
    <div class="inline-row">
      <div class="inline-row__cell">
        <label class="form-label" for="nm-indicator">Monitoring Indicator</label>
        <select
          id="nm-indicator"
          class="form-select"
          value={field('indicators')}
          onchange={(e) => onInput('indicators', e)}
        >
          {#each MONITORING_INDICATORS as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
      <div class="inline-row__cell">
        <label class="form-label" for="nm-criteria">Evaluation Criteria</label>
        <input
          id="nm-criteria"
          class="form-input"
          type="text"
          placeholder="Target value or clinical benchmark"
          value={field('criteria')}
          oninput={(e) => onInput('criteria', e)}
        />
      </div>
    </div>
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Outcomes"
    open={!isCollapsed('monitoring-outcomes')}
    onToggle={() => toggleCollapse('monitoring-outcomes')}
    dataSubsection="monitoring-outcomes"
  >
    <div class="form-group">
      <label class="form-label" for="nm-outcomes">Outcome Documentation</label>
      <textarea
        id="nm-outcomes"
        class="form-textarea"
        rows="4"
        placeholder="Compare current status to previous assessment and intervention goals"
        value={field('outcomes')}
        oninput={(e) => onInput('outcomes', e)}
      ></textarea>
    </div>
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Follow-Up Plan"
    open={!isCollapsed('monitoring-followup')}
    onToggle={() => toggleCollapse('monitoring-followup')}
    dataSubsection="monitoring-followup"
  >
    <div class="form-group">
      <label class="form-label" for="nm-followup">Follow-Up Plan</label>
      <textarea
        id="nm-followup"
        class="form-textarea"
        rows="3"
        placeholder="Reassessment timeline, continued monitoring, discharge criteria"
        value={field('follow_up_plan')}
        oninput={(e) => onInput('follow_up_plan', e)}
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
    color: #1a1a1a;
    margin: 0;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #4a4a4a;
    margin-bottom: 0.25rem;
  }

  .form-textarea,
  .form-input,
  .form-select {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid #ccc;
    border-radius: 5px;
    font: inherit;
    font-size: 0.85rem;
    color: #1a1a1a;
    background: #fff;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .form-textarea:focus,
  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--color-brand-green, #009a44);
    box-shadow: 0 0 0 2px rgba(0, 154, 68, 0.12);
  }

  .form-textarea {
    resize: vertical;
    min-height: 3rem;
  }

  .inline-row {
    display: flex;
    gap: 1rem;
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
