<!--
  NutritionMonitoringSection — ADIME "M/E" section.
  Repeatable monitoring indicators with current/target values, outcomes, and follow-up plan.
-->
<script lang="ts">
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import {
    dieteticsNoteDraft,
    updateDieteticsField,
    replaceDieteticsSection,
  } from '$lib/stores/noteSession';
  import type { NutritionMonitoringData, MonitoringEntry } from '$lib/types/sections';

  const MONITORING_INDICATORS = [
    { value: '', label: '— Select Indicator —' },
    { value: 'FH-1', label: 'FH-1 Food and Nutrient Intake' },
    { value: 'FH-7', label: 'FH-7 Food and Nutrient Administration' },
    { value: 'AD-1', label: 'AD-1 Body Composition / Growth' },
    { value: 'BD-1', label: 'BD-1 Nutritional Anemia Profile' },
    { value: 'BD-1.2', label: 'BD-1.2 Biochemical Index' },
    { value: 'BD-1.3', label: 'BD-1.3 Electrolyte / Renal Profile' },
    { value: 'BD-1.4', label: 'BD-1.4 Gastrointestinal Profile' },
    { value: 'BD-1.5', label: 'BD-1.5 Glucose / Endocrine Profile' },
    { value: 'BD-1.6', label: 'BD-1.6 Inflammatory Profile' },
    { value: 'BD-1.7', label: 'BD-1.7 Lipid Profile' },
    { value: 'PD-1', label: 'PD-1 Nutrition-Focused Physical Findings' },
    { value: 'CH-1', label: 'CH-1 Patient / Client History' },
  ];

  const TIMELINE_OPTIONS = [
    { value: '', label: 'Timeline...' },
    { value: 'next-visit', label: 'Next visit' },
    { value: '1-week', label: '1 week' },
    { value: '2-weeks', label: '2 weeks' },
    { value: '1-month', label: '1 month' },
    { value: '3-months', label: '3 months' },
    { value: 'ongoing', label: 'Ongoing' },
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

  // ── Repeatable Monitoring Entries ──

  function genId(): string {
    return `mon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const monitoringEntries = $derived.by((): MonitoringEntry[] => {
    const arr = section.monitoringEntries;
    if (Array.isArray(arr) && arr.length > 0) return arr;
    // Legacy migration: convert single indicator/criteria to an entry
    const legacyInd = section.indicators;
    const legacyCrit = section.criteria;
    if (
      (typeof legacyInd === 'string' && legacyInd) ||
      (typeof legacyCrit === 'string' && legacyCrit)
    ) {
      return [
        {
          id: 'migrated',
          indicator: legacyInd ?? '',
          currentValue: '',
          targetValue: legacyCrit ?? '',
          timeline: '',
        },
      ];
    }
    return [];
  });

  function updateEntries(entries: MonitoringEntry[]) {
    replaceDieteticsSection('nutrition_monitoring', {
      ...section,
      monitoringEntries: [...entries],
    });
  }

  function addEntry() {
    updateEntries([
      ...monitoringEntries,
      { id: genId(), indicator: '', currentValue: '', targetValue: '', timeline: '' },
    ]);
  }

  function removeEntry(id: string) {
    updateEntries(monitoringEntries.filter((e) => e.id !== id));
  }

  function updateEntryField(id: string, key: keyof MonitoringEntry, value: string) {
    updateEntries(monitoringEntries.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
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
    title="Monitoring Indicators"
    open={!isCollapsed('monitoring-indicators')}
    onToggle={() => toggleCollapse('monitoring-indicators')}
    dataSubsection="monitoring-indicators"
  >
    {#if monitoringEntries.length === 0}
      <div class="mon-empty">
        No monitoring indicators documented.
        <button type="button" class="mon-add-btn" onclick={addEntry}>Add Indicator</button>
      </div>
    {:else}
      {#each monitoringEntries as entry (entry.id)}
        <div class="mon-entry">
          <button
            type="button"
            class="mon-remove"
            onclick={() => removeEntry(entry.id)}
            aria-label="Remove indicator">&times;</button
          >
          <div class="mon-row">
            <label class="mon-field mon-field--grow">
              Indicator
              <select
                value={entry.indicator}
                onchange={(e) =>
                  updateEntryField(entry.id, 'indicator', (e.target as HTMLSelectElement).value)}
              >
                {#each MONITORING_INDICATORS as opt}<option value={opt.value}>{opt.label}</option
                  >{/each}
              </select>
            </label>
            <label class="mon-field">
              Re-evaluate
              <select
                value={entry.timeline}
                onchange={(e) =>
                  updateEntryField(entry.id, 'timeline', (e.target as HTMLSelectElement).value)}
              >
                {#each TIMELINE_OPTIONS as opt}<option value={opt.value}>{opt.label}</option>{/each}
              </select>
            </label>
          </div>
          <div class="mon-row">
            <label class="mon-field mon-field--grow">
              Current Value
              <input
                type="text"
                value={entry.currentValue}
                placeholder="Current measurement or status"
                oninput={(e) =>
                  updateEntryField(entry.id, 'currentValue', (e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="mon-field mon-field--grow">
              Target Value
              <input
                type="text"
                value={entry.targetValue}
                placeholder="Target / benchmark"
                oninput={(e) =>
                  updateEntryField(entry.id, 'targetValue', (e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        </div>
      {/each}
      <button type="button" class="mon-add-btn" onclick={addEntry}>+ Add Indicator</button>
    {/if}
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
        rows="2"
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
        rows="2"
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

  /* ─── Monitoring Entries ─── */

  .mon-empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #757575);
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
  }

  .mon-entry {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 2rem 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    background: var(--color-neutral-50, #fafafa);
    margin-bottom: 0.375rem;
  }

  .mon-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .mon-field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--color-neutral-600, #616161);
    min-width: 0;
  }

  .mon-field--grow {
    flex: 1;
    min-width: 120px;
  }

  .mon-remove {
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
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

  .mon-remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .mon-add-btn {
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

  .mon-add-btn:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
    color: var(--color-brand-green, #009a44);
  }

  @media (max-width: 640px) {
    .mon-row {
      flex-direction: column;
    }
  }
</style>
