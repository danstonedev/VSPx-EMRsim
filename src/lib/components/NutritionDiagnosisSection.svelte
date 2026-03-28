<!--
  NutritionDiagnosisSection — ADIME "D" section.
  PES statements (Problem, Etiology, Signs & Symptoms) and priority diagnosis.
  Ported from app/js/views/dietetics/dietetics_workspace.js renderDiagnosisSection()
-->
<script lang="ts">
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { dieteticsNoteDraft, replaceDieteticsSection } from '$lib/stores/noteSession';
  import type { PesStatement } from '$lib/types/sections';

  const PES_PROBLEM_OPTIONS = [
    { value: '', label: '— Select Problem —' },
    { value: 'NI-2.1', label: 'NI-2.1 Inadequate oral intake' },
    { value: 'NI-5.1', label: 'NI-5.1 Increased nutrient needs' },
    { value: 'NI-5.2', label: 'NI-5.2 Malnutrition' },
    { value: 'NI-5.3', label: 'NI-5.3 Inadequate protein-energy intake' },
    { value: 'NI-5.10.1', label: 'NI-5.10.1 Inadequate mineral intake (specify)' },
    { value: 'NI-5.10.2', label: 'NI-5.10.2 Excessive mineral intake (specify)' },
    { value: 'NC-1.4', label: 'NC-1.4 Altered GI function' },
    { value: 'NC-2.2', label: 'NC-2.2 Altered nutrition-related lab values' },
    { value: 'NC-3.1', label: 'NC-3.1 Underweight' },
    { value: 'NC-3.3', label: 'NC-3.3 Overweight / obesity' },
    { value: 'NB-1.1', label: 'NB-1.1 Food- and nutrition-related knowledge deficit' },
    { value: 'NB-1.3', label: 'NB-1.3 Not ready for diet/lifestyle change' },
    { value: 'NB-2.1', label: 'NB-2.1 Physical inactivity' },
    { value: 'NB-2.3', label: 'NB-2.3 Self-feeding difficulty' },
  ];

  const section = $derived($dieteticsNoteDraft.nutrition_diagnosis);
  const pesStatements = $derived(
    section.pes_statements ?? [{ problem: '', etiology: '', signs_symptoms: '' }],
  );

  let collapsed = $state<Record<string, boolean>>({});

  function isCollapsed(id: string): boolean {
    return collapsed[id] ?? false;
  }

  function toggleCollapse(id: string): void {
    collapsed = { ...collapsed, [id]: !isCollapsed(id) };
  }

  function updatePesField(index: number, field: keyof PesStatement, value: string): void {
    const updated = pesStatements.map((pes, i) =>
      i === index ? { ...pes, [field]: value } : { ...pes },
    );
    replaceDieteticsSection('nutrition_diagnosis', {
      ...section,
      pes_statements: updated,
    });
  }

  function addPesRow(): void {
    const updated = [...pesStatements, { problem: '', etiology: '', signs_symptoms: '' }];
    replaceDieteticsSection('nutrition_diagnosis', {
      ...section,
      pes_statements: updated,
    });
  }

  function removePesRow(index: number): void {
    if (pesStatements.length <= 1) return;
    const updated = pesStatements.filter((_, i) => i !== index);
    replaceDieteticsSection('nutrition_diagnosis', {
      ...section,
      pes_statements: updated,
    });
  }

  function onPriorityInput(e: Event): void {
    const target = e.target as HTMLTextAreaElement;
    replaceDieteticsSection('nutrition_diagnosis', {
      ...section,
      priority_diagnosis: target.value,
    });
  }
</script>

<div class="section-panel">
  <div class="section-panel__header">
    <h2 class="section-panel__title">
      <span class="material-symbols-outlined ncp-icon" aria-hidden="true">search</span>
      Nutrition Diagnosis
    </h2>
  </div>

  <CollapsibleSubsection
    title="PES Statements"
    open={!isCollapsed('pes-statements')}
    onToggle={() => toggleCollapse('pes-statements')}
    dataSubsection="pes-statements"
  >
    <p class="form-hint">Document using Problem, Etiology, Signs & Symptoms format.</p>

    {#each pesStatements as pes, index}
      <div class="pes-row">
        <div class="pes-row__number">#{index + 1}</div>
        <div class="pes-row__fields">
          <div class="form-group">
            <label class="form-label" for="pes-p-{index}">Problem (P)</label>
            <select
              id="pes-p-{index}"
              class="form-select"
              value={pes.problem}
              onchange={(e) =>
                updatePesField(index, 'problem', (e.target as HTMLSelectElement).value)}
            >
              {#each PES_PROBLEM_OPTIONS as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
            <span class="form-hint-inline">IDNT nutrition diagnosis code</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="pes-e-{index}">Etiology (E)</label>
            <textarea
              id="pes-e-{index}"
              class="form-textarea"
              rows="2"
              placeholder="Related to..."
              value={pes.etiology}
              oninput={(e) =>
                updatePesField(index, 'etiology', (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="pes-s-{index}">Signs & Symptoms (S)</label>
            <textarea
              id="pes-s-{index}"
              class="form-textarea"
              rows="2"
              placeholder="As evidenced by..."
              value={pes.signs_symptoms}
              oninput={(e) =>
                updatePesField(index, 'signs_symptoms', (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
        </div>

        {#if pesStatements.length > 1}
          <button
            class="pes-row__remove"
            type="button"
            aria-label="Remove PES statement #{index + 1}"
            onclick={() => removePesRow(index)}
          >
            &times;
          </button>
        {/if}
      </div>
    {/each}

    <button class="btn-secondary-sm" type="button" onclick={addPesRow}>
      + Add PES Statement
    </button>
  </CollapsibleSubsection>

  <CollapsibleSubsection
    title="Priority Diagnosis"
    open={!isCollapsed('priority-dx')}
    onToggle={() => toggleCollapse('priority-dx')}
    dataSubsection="priority-dx"
  >
    <div class="form-group">
      <label class="form-label" for="nd-priority">Priority Nutrition Diagnosis</label>
      <textarea
        id="nd-priority"
        class="form-textarea"
        rows="3"
        placeholder="Identify the primary diagnosis to address first"
        value={section.priority_diagnosis ?? ''}
        oninput={onPriorityInput}
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

  .form-hint {
    font-size: 0.78rem;
    color: #777;
    margin: 0 0 0.75rem;
  }

  .form-hint-inline {
    font-size: 0.72rem;
    color: #999;
    margin-top: 0.15rem;
    display: block;
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
  .form-select:focus {
    outline: none;
    border-color: var(--color-brand-green, #009a44);
    box-shadow: 0 0 0 2px rgba(0, 154, 68, 0.12);
  }

  .form-textarea {
    resize: vertical;
    min-height: 2.5rem;
  }

  .pes-row {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    background: #fafafa;
    position: relative;
  }

  .pes-row__number {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--color-brand-green, #009a44);
    padding-top: 0.25rem;
    flex-shrink: 0;
    width: 2rem;
  }

  .pes-row__fields {
    flex: 1;
    min-width: 0;
  }

  .pes-row__remove {
    position: absolute;
    top: 0.35rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #999;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
  }

  .pes-row__remove:hover {
    color: #d32f2f;
  }

  .btn-secondary-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid #ccc;
    border-radius: 5px;
    background: #f5f5f5;
    color: #333;
    cursor: pointer;
    transition: background 0.12s;
  }

  .btn-secondary-sm:hover {
    background: #e8e8e8;
  }
</style>
