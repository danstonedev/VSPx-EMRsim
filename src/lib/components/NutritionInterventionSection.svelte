<!--
  NutritionInterventionSection — ADIME "I" section.
  Strategy selection, diet order, goals, education, counseling, and care coordination.
  Ported from app/js/views/dietetics/dietetics_workspace.js renderInterventionSection()
-->
<script lang="ts">
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { dieteticsNoteDraft, updateDieteticsField } from '$lib/stores/noteSession';
  import type { NutritionInterventionData } from '$lib/types/sections';

  const INTERVENTION_STRATEGIES = [
    { value: '', label: '— Select Strategy —' },
    { value: 'ND-1', label: 'ND-1 Meals and Snacks' },
    { value: 'ND-2', label: 'ND-2 Enteral / Parenteral Nutrition' },
    { value: 'ND-3', label: 'ND-3 Supplements' },
    { value: 'ND-4', label: 'ND-4 Feeding Assistance' },
    { value: 'ND-5', label: 'ND-5 Nutrition-Related Medication Management' },
    { value: 'E-1', label: 'E-1 Nutrition Education — content' },
    { value: 'E-2', label: 'E-2 Nutrition Education — application' },
    { value: 'C-1', label: 'C-1 Nutrition Counseling — theoretical basis' },
    { value: 'C-2', label: 'C-2 Nutrition Counseling — strategies' },
    { value: 'RC-1', label: 'RC-1 Coordination of Nutrition Care' },
  ];

  const section = $derived($dieteticsNoteDraft.nutrition_intervention);

  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string): void {
    collapsed = { ...collapsed, [id]: !isCollapsed(id) };
  }

  function field(key: keyof NutritionInterventionData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function onInput(key: keyof NutritionInterventionData, e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateDieteticsField('nutrition_intervention', key, target.value);
  }
</script>

<div class="section-panel">
  <div class="section-panel__header">
    <h2 class="section-panel__title">
      <span class="material-symbols-outlined ncp-icon" aria-hidden="true">medication</span>
      Nutrition Intervention
    </h2>
  </div>

  <CollapsibleSubsection
    title="Intervention Planning"
    open={!isCollapsed('intervention-plan')}
    onToggle={() => toggleCollapse('intervention-plan')}
    dataSubsection="intervention-plan"
  >
    <div class="inline-row">
      <div class="inline-row__cell">
        <label class="form-label" for="ni-strategy">Intervention Strategy</label>
        <select
          id="ni-strategy"
          class="form-select"
          value={field('strategy')}
          onchange={(e) => onInput('strategy', e)}
        >
          {#each INTERVENTION_STRATEGIES as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
      <div class="inline-row__cell">
        <label class="form-label" for="ni-diet-order">Diet Order / Prescription</label>
        <input
          id="ni-diet-order"
          class="form-input"
          type="text"
          placeholder="e.g. Regular diet, 2g Na restriction, Carb-controlled"
          value={field('diet_order')}
          oninput={(e) => onInput('diet_order', e)}
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="ni-goals">Nutrition Goals</label>
      <textarea
        id="ni-goals"
        class="form-textarea"
        rows="3"
        placeholder="Measurable goals related to the nutrition diagnosis"
        value={field('goals')}
        oninput={(e) => onInput('goals', e)}
      ></textarea>
    </div>
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Education & Counseling"
    open={!isCollapsed('intervention-education')}
    onToggle={() => toggleCollapse('intervention-education')}
    dataSubsection="intervention-education"
  >
    <div class="form-group">
      <label class="form-label" for="ni-education">Education Topics</label>
      <textarea
        id="ni-education"
        class="form-textarea"
        rows="3"
        placeholder="Topics covered, materials provided, patient understanding..."
        value={field('education_topics')}
        oninput={(e) => onInput('education_topics', e)}
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label" for="ni-counseling">Counseling Notes</label>
      <textarea
        id="ni-counseling"
        class="form-textarea"
        rows="3"
        placeholder="Behavioral strategies, motivational interviewing notes..."
        value={field('counseling_notes')}
        oninput={(e) => onInput('counseling_notes', e)}
      ></textarea>
    </div>
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Care Coordination"
    open={!isCollapsed('intervention-coordination')}
    onToggle={() => toggleCollapse('intervention-coordination')}
    dataSubsection="intervention-coordination"
  >
    <div class="form-group">
      <label class="form-label" for="ni-coordination">Coordination of Care</label>
      <textarea
        id="ni-coordination"
        class="form-textarea"
        rows="3"
        placeholder="Referrals, communication with RN/MD/pharmacy/dietary staff"
        value={field('coordination')}
        oninput={(e) => onInput('coordination', e)}
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
