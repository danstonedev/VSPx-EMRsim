<!--
  NutritionAssessmentSection — ADIME "A" section.
  Five assessment domains, malnutrition screening, and estimated needs.
  Ported from app/js/views/dietetics/dietetics_workspace.js renderAssessmentSection()
-->
<script lang="ts">
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { dieteticsNoteDraft, updateDieteticsField } from '$lib/stores/noteSession';
  import type { NutritionAssessmentData } from '$lib/types/sections';

  const ASSESSMENT_DOMAINS: { id: keyof NutritionAssessmentData; label: string; hint: string }[] = [
    {
      id: 'food_nutrition_history',
      label: 'Food / Nutrition-Related History',
      hint: 'Document food and nutrition-related history findings',
    },
    {
      id: 'anthropometric',
      label: 'Anthropometric Measurements',
      hint: 'Document anthropometric measurements findings',
    },
    {
      id: 'biochemical',
      label: 'Biochemical Data / Medical Tests / Procedures',
      hint: 'Document biochemical data findings',
    },
    {
      id: 'nutrition_focused_pe',
      label: 'Nutrition-Focused Physical Exam',
      hint: 'Document nutrition-focused physical exam findings',
    },
    { id: 'client_history', label: 'Client History', hint: 'Document client history findings' },
  ];

  const MALNUTRITION_CRITERIA = [
    { value: '', label: '— Select —' },
    { value: 'not-at-risk', label: 'Not at risk' },
    { value: 'at-risk', label: 'At risk of malnutrition' },
    { value: 'moderate', label: 'Moderate malnutrition' },
    { value: 'severe', label: 'Severe malnutrition' },
  ];

  const section = $derived($dieteticsNoteDraft.nutrition_assessment);

  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string): void {
    collapsed = { ...collapsed, [id]: !isCollapsed(id) };
  }

  function field(key: keyof NutritionAssessmentData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function onInput(key: keyof NutritionAssessmentData, e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateDieteticsField('nutrition_assessment', key, target.value);
  }
</script>

<div class="section-panel">
  <div class="section-panel__header">
    <h2 class="section-panel__title">
      <span class="material-symbols-outlined ncp-icon" aria-hidden="true">assignment</span>
      Nutrition Assessment
    </h2>
  </div>

  <CollapsibleSubsection
    title="Assessment Domains (ADIME)"
    open={!isCollapsed('assessment-domains')}
    onToggle={() => toggleCollapse('assessment-domains')}
    dataSubsection="assessment-domains"
  >
    {#each ASSESSMENT_DOMAINS as domain}
      <div class="form-group">
        <label class="form-label" for="na-{domain.id}">{domain.label}</label>
        <textarea
          id="na-{domain.id}"
          class="form-textarea"
          rows="2"
          placeholder={domain.hint}
          value={field(domain.id)}
          oninput={(e) => onInput(domain.id, e)}
        ></textarea>
      </div>
    {/each}
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Screening & Estimated Needs"
    open={!isCollapsed('assessment-screening')}
    onToggle={() => toggleCollapse('assessment-screening')}
    dataSubsection="assessment-screening"
  >
    <div class="inline-row">
      <div class="inline-row__cell">
        <label class="form-label" for="na-malnutrition">Malnutrition Risk</label>
        <select
          id="na-malnutrition"
          class="form-select"
          value={field('malnutrition_risk')}
          onchange={(e) => onInput('malnutrition_risk', e)}
        >
          {#each MALNUTRITION_CRITERIA as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </div>
      <div class="inline-row__cell">
        <label class="form-label" for="na-needs">Estimated Energy / Protein Needs</label>
        <input
          id="na-needs"
          class="form-input"
          type="text"
          placeholder="e.g. 1800-2000 kcal, 70-85 g protein"
          value={field('estimated_needs')}
          oninput={(e) => onInput('estimated_needs', e)}
        />
      </div>
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

  :global(.ncp-icon) {
    font-size: 1.25rem;
    color: var(--color-brand-green, #009a44);
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
    min-height: 3.5rem;
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
