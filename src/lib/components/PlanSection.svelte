<!--
  PlanSection — Goals, in-clinic interventions, HEP, frequency/duration.
  Mirrors original PlanMain.js + GoalSetting.js + TreatmentPlan.js
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import SearchableSelect from './SearchableSelect.svelte';
  import { createDragReorder } from '$lib/utils/dragReorder';
  import {
    FREQUENCY_OPTIONS,
    DURATION_OPTIONS,
    PT_INTERVENTIONS,
    scoreIntervention,
  } from '$lib/config/ptCodes';
  import type { PlanData, PlanGoal, PlanIntervention } from '$lib/types/sections';

  const section = $derived($noteDraft.plan);

  function field(key: keyof PlanData): string {
    const v = section[key];
    return typeof v === 'string' ? v : '';
  }

  function onInput(key: keyof PlanData, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateField('plan', key, target.value);
  }

  // ─── Collapsible state ───

  const MODALITY_OPTIONS = [
    'Ultrasound',
    'Electrical Stimulation (NMES/TENS)',
    'Iontophoresis',
    'Hot Pack / Moist Heat',
    'Cold Pack / Cryotherapy',
    'Paraffin',
    'Mechanical Traction',
    'Laser Therapy',
    'Biofeedback',
    'Whirlpool / Hydrotherapy',
    'Fluidotherapy',
    'Phonophoresis',
  ];

  let openSubs = $state<Record<string, boolean>>({
    schedule: true,
    goals: true,
    narrative: true,
    inClinic: true,
    hep: true,
    education: true,
  });

  function toggle(id: string) {
    openSubs = { ...openSubs, [id]: !openSubs[id] };
  }

  // ─── Goals (structured array format) ───

  const goals = $derived.by((): PlanGoal[] => {
    const g = section.goals;
    return Array.isArray(g) ? g : [];
  });

  function updateGoals(newGoals: PlanGoal[]) {
    updateField('plan', 'goals', [...newGoals]);
  }

  const TIMEFRAME_OPTIONS = [
    { value: '', label: 'Select timeframe…' },
    { value: '1-2 weeks', label: '1–2 weeks (STG)' },
    { value: '2-4 weeks', label: '2–4 weeks (STG)' },
    { value: '4-6 weeks', label: '4–6 weeks (STG)' },
    { value: '6-8 weeks', label: '6–8 weeks' },
    { value: '8-12 weeks', label: '8–12 weeks (LTG)' },
    { value: '3-6 months', label: '3–6 months (LTG)' },
    { value: 'discharge', label: 'At discharge (LTG)' },
  ];

  const ICF_DOMAIN_OPTIONS = [
    { value: '', label: 'ICF domain…' },
    { value: 'body-functions', label: 'Body Functions' },
    { value: 'body-structures', label: 'Body Structures' },
    { value: 'activity', label: 'Activity' },
    { value: 'participation', label: 'Participation' },
    { value: 'environmental', label: 'Environmental Factors' },
    { value: 'personal', label: 'Personal Factors' },
  ];

  function onGoalInput(index: number, e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    const updated = [...goals];
    updated[index] = { ...updated[index], goal: val };
    updateGoals(updated);
  }

  function onGoalTimeframe(index: number, e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    const updated = [...goals];
    updated[index] = { ...updated[index], timeframe: val };
    updateGoals(updated);
  }

  function onGoalIcfDomain(index: number, e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    const updated = [...goals];
    updated[index] = { ...updated[index], icfDomain: val };
    updateGoals(updated);
  }

  function addGoal() {
    updateGoals([...goals, { goal: '', timeframe: '', icfDomain: '' }]);
  }

  function removeGoal(index: number) {
    const updated = goals.filter((_, i) => i !== index);
    updateGoals(updated.length ? updated : [{ goal: '', timeframe: '', icfDomain: '' }]);
  }

  // ─── Goal drag-reorder ───

  let goalDragIdx = $state<number | null>(null);
  const goalDrag = createDragReorder(
    () => goals,
    updateGoals,
    (index) => {
      goalDragIdx = index;
    },
  );

  // ─── Modalities (checkbox array) ───

  const modalities = $derived.by((): string[] => {
    const m = section.modalities;
    return Array.isArray(m) ? m : [];
  });

  function toggleModality(mod: string) {
    const updated = modalities.includes(mod)
      ? modalities.filter((m) => m !== mod)
      : [...modalities, mod];
    updateField('plan', 'modalities', updated);
  }

  // ─── In-Clinic Interventions ───

  const inClinic = $derived.by((): PlanIntervention[] => {
    const ic = section.inClinicInterventions;
    return Array.isArray(ic) ? ic : [];
  });

  function updateInClinic(items: PlanIntervention[]) {
    updateField('plan', 'inClinicInterventions', [...items]);
  }

  function addInClinic() {
    updateInClinic([...inClinic, { intervention: '', dosage: '' }]);
  }

  function removeInClinic(index: number) {
    updateInClinic(inClinic.filter((_, i) => i !== index));
  }

  function onInClinicIntervention(index: number, value: string) {
    const updated = [...inClinic];
    updated[index] = { ...updated[index], intervention: value };
    updateInClinic(updated);
  }

  function onInClinicDosage(index: number, e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    const updated = [...inClinic];
    updated[index] = { ...updated[index], dosage: val };
    updateInClinic(updated);
  }

  // ─── In-Clinic drag-reorder ───

  let inClinicDragIdx = $state<number | null>(null);
  const icDrag = createDragReorder(
    () => inClinic,
    updateInClinic,
    (index) => {
      inClinicDragIdx = index;
    },
  );

  // ─── HEP Interventions ───

  const hepItems = $derived.by((): PlanIntervention[] => {
    const h = section.hepInterventions;
    return Array.isArray(h) ? h : [];
  });

  function updateHep(items: PlanIntervention[]) {
    updateField('plan', 'hepInterventions', [...items]);
  }

  function addHep() {
    updateHep([...hepItems, { intervention: '', dosage: '' }]);
  }

  function removeHep(index: number) {
    updateHep(hepItems.filter((_, i) => i !== index));
  }

  function onHepIntervention(index: number, value: string) {
    const updated = [...hepItems];
    updated[index] = { ...updated[index], intervention: value };
    updateHep(updated);
  }

  function onHepDosage(index: number, e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    const updated = [...hepItems];
    updated[index] = { ...updated[index], dosage: val };
    updateHep(updated);
  }

  // ─── HEP drag-reorder ───

  let hepDragIdx = $state<number | null>(null);
  const hepDrag = createDragReorder(
    () => hepItems,
    updateHep,
    (index) => {
      hepDragIdx = index;
    },
  );
</script>

<div class="soap-section soap-plan">
  <!-- Visit Parameters -->
  <CollapsibleSubsection
    title="Visit Parameters"
    open={openSubs.schedule}
    onToggle={() => toggle('schedule')}
    dataSubsection="visit-parameters"
  >
    <div class="field-row">
      <label class="field-label field-label--select">
        Frequency
        <select value={field('frequency')} onchange={(e) => onInput('frequency', e)}>
          {#each FREQUENCY_OPTIONS as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>
      <label class="field-label field-label--select">
        Duration
        <select value={field('duration')} onchange={(e) => onInput('duration', e)}>
          {#each DURATION_OPTIONS as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>
    </div>
  </CollapsibleSubsection>

  <!-- Goals -->
  <CollapsibleSubsection
    title="SMART Goals"
    open={openSubs.goals}
    onToggle={() => toggle('goals')}
    dataSubsection="goal-setting"
  >
    {#if goals.length > 0}
      <div class="goal-list">
        {#each goals as entry, i (i)}
          <div
            class="goal-row"
            class:goal-row--dragging={goalDragIdx === i}
            draggable="false"
            role="listitem"
            ondragover={(e) => goalDrag.dragOver(e)}
            ondrop={(e) => goalDrag.drop(i, e)}
          >
            <button
              type="button"
              class="goal-row__handle ct-drag-handle"
              draggable="true"
              aria-label="Drag to reorder goal {i + 1}"
              tabindex="-1"
              ondragstart={(e) => goalDrag.dragStart(i, e)}
              ondragend={goalDrag.dragEnd}>⠿</button
            >
            <div class="goal-row__body">
              <textarea
                class="goal-row__input"
                rows="2"
                value={entry.goal}
                oninput={(e) => onGoalInput(i, e)}
                placeholder="SMART goal: specific, measurable, achievable, relevant, time-bound (e.g., 'Pt will achieve 150° shoulder flexion AROM for overhead reaching within 4 weeks')"
              ></textarea>
              <div class="goal-row__meta">
                <select
                  class="goal-row__select"
                  value={entry.timeframe}
                  onchange={(e) => onGoalTimeframe(i, e)}
                  aria-label="Goal {i + 1} timeframe"
                >
                  {#each TIMEFRAME_OPTIONS as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
                <select
                  class="goal-row__select"
                  value={entry.icfDomain}
                  onchange={(e) => onGoalIcfDomain(i, e)}
                  aria-label="Goal {i + 1} ICF domain"
                >
                  {#each ICF_DOMAIN_OPTIONS as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
              </div>
            </div>
            <button
              type="button"
              class="goal-row__remove ct-btn-remove"
              onclick={() => removeGoal(i)}
              aria-label="Remove goal {i + 1}">×</button
            >
          </div>
        {/each}
      </div>
    {:else}
      <p class="ct-empty-hint">No goals added yet.</p>
    {/if}
    <button type="button" class="btn-add" onclick={addGoal}>+ Add Goal</button>
  </CollapsibleSubsection>

  <!-- Treatment Narrative -->
  <CollapsibleSubsection
    title="Treatment Narrative"
    open={openSubs.narrative}
    onToggle={() => toggle('narrative')}
    dataSubsection="treatment-narrative"
  >
    <label class="field-label">
      Treatment Plan / Approach
      <textarea
        rows="2"
        value={field('treatmentPlan')}
        oninput={(e) => onInput('treatmentPlan', e)}
        placeholder="Overall approach and clinical rationale linking impairments to interventions (e.g., 'Address ROM deficits through joint mobilization, strengthen rotator cuff via progressive resistance')"
      ></textarea>
    </label>
    <label class="field-label">
      Therapeutic Exercise Focus
      <textarea
        rows="2"
        value={field('exerciseFocus')}
        oninput={(e) => onInput('exerciseFocus', e)}
        placeholder="e.g. Rotator cuff strengthening, scapular stabilization, core activation"
      ></textarea>
    </label>
    <label class="field-label">
      Exercise Prescription (FITT)
      <textarea
        rows="2"
        value={field('exercisePrescription')}
        oninput={(e) => onInput('exercisePrescription', e)}
        placeholder="FITT parameters: Frequency (3x/week), Intensity (moderate RPE 4-6), Time (30 min), Type (strengthening, stretching, aerobic)"
      ></textarea>
    </label>
    <label class="field-label">
      Manual Therapy
      <textarea
        rows="2"
        value={field('manualTherapy')}
        oninput={(e) => onInput('manualTherapy', e)}
        placeholder="e.g. Joint mobilization (grade III GH), soft tissue mobilization to upper trap, myofascial release"
      ></textarea>
    </label>

    <div class="modalities-group">
      <span class="field-label" style="margin-bottom: 0.25rem;">Physical Modalities</span>
      <div class="modalities-grid">
        {#each MODALITY_OPTIONS as mod}
          <label class="modality-check">
            <input
              type="checkbox"
              checked={modalities.includes(mod)}
              onchange={() => toggleModality(mod)}
            />
            <span>{mod}</span>
          </label>
        {/each}
      </div>
    </div>
  </CollapsibleSubsection>

  <!-- In-Clinic Treatment Plan -->
  <CollapsibleSubsection
    title="In-Clinic Treatment Plan"
    open={openSubs.inClinic}
    onToggle={() => toggle('inClinic')}
    dataSubsection="in-clinic-treatment-plan"
  >
    <table class="ct-table intervention-table">
      <colgroup>
        <col style="width: 2rem;" />
        <col />
        <col style="width: 10rem;" />
        <col style="width: 3.75rem;" />
      </colgroup>
      <thead>
        <tr>
          <th class="ct-th ct-th--region" style="width:2rem"></th>
          <th class="ct-th">Intervention</th>
          <th class="ct-th">Dose</th>
          <th class="ct-th ct-th--actions">
            <button
              type="button"
              class="ct-btn-add"
              onclick={addInClinic}
              aria-label="Add intervention">+</button
            >
          </th>
        </tr>
      </thead>
      <tbody>
        {#each inClinic as entry, idx (idx)}
          <tr
            class="ct-row"
            class:ct-row--dragging={inClinicDragIdx === idx}
            ondragover={(e) => {
              e.preventDefault();
            }}
            ondrop={(e) => icDrag.drop(idx, e)}
          >
            <td class="drag-handle-cell">
              <button
                type="button"
                class="ct-drag-handle"
                draggable="true"
                aria-label="Drag to reorder intervention {idx + 1}"
                tabindex="-1"
                ondragstart={(e) => icDrag.dragStart(idx, e)}
                ondragend={() => {
                  icDrag.dragEnd();
                }}>⠿</button
              >
            </td>
            <td>
              <SearchableSelect
                value={entry.intervention}
                placeholder="Search or type intervention..."
                items={PT_INTERVENTIONS}
                scoreFn={scoreIntervention}
                onSelect={(v) => onInClinicIntervention(idx, v)}
              />
            </td>
            <td>
              <textarea
                rows="1"
                class="dose-input"
                value={entry.dosage}
                oninput={(e) => onInClinicDosage(idx, e)}
                placeholder="e.g., 3×10, 30s hold"
              ></textarea>
            </td>
            <td class="action-col">
              <button
                type="button"
                class="ct-btn-remove"
                onclick={() => removeInClinic(idx)}
                aria-label="Remove intervention">×</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if inClinic.length === 0}
      <p class="ct-empty-hint">No interventions added yet.</p>
      <button type="button" class="btn-add" onclick={addInClinic}>+ Add Intervention</button>
    {/if}
  </CollapsibleSubsection>

  <!-- Home Exercise Program -->
  <CollapsibleSubsection
    title="Home Exercise Program (HEP)"
    open={openSubs.hep}
    onToggle={() => toggle('hep')}
    dataSubsection="hep-plan"
  >
    <table class="ct-table intervention-table">
      <colgroup>
        <col style="width: 2rem;" />
        <col />
        <col style="width: 10rem;" />
        <col style="width: 3.75rem;" />
      </colgroup>
      <thead>
        <tr>
          <th class="ct-th ct-th--region" style="width:2rem"></th>
          <th class="ct-th">Exercise / Activity</th>
          <th class="ct-th">Dose / Frequency</th>
          <th class="ct-th ct-th--actions">
            <button type="button" class="ct-btn-add" onclick={addHep} aria-label="Add HEP exercise"
              >+</button
            >
          </th>
        </tr>
      </thead>
      <tbody>
        {#each hepItems as entry, idx (idx)}
          <tr
            class="ct-row"
            class:ct-row--dragging={hepDragIdx === idx}
            ondragover={(e) => {
              e.preventDefault();
            }}
            ondrop={(e) => hepDrag.drop(idx, e)}
          >
            <td class="drag-handle-cell">
              <button
                type="button"
                class="ct-drag-handle"
                draggable="true"
                aria-label="Drag to reorder exercise {idx + 1}"
                tabindex="-1"
                ondragstart={(e) => hepDrag.dragStart(idx, e)}
                ondragend={() => {
                  hepDrag.dragEnd();
                }}>⠿</button
              >
            </td>
            <td>
              <SearchableSelect
                value={entry.intervention}
                placeholder="Search or type exercise..."
                items={PT_INTERVENTIONS}
                scoreFn={scoreIntervention}
                onSelect={(v) => onHepIntervention(idx, v)}
              />
            </td>
            <td>
              <textarea
                rows="1"
                class="dose-input"
                value={entry.dosage}
                oninput={(e) => onHepDosage(idx, e)}
                placeholder="e.g., 3×10, 1×/day"
              ></textarea>
            </td>
            <td class="action-col">
              <button
                type="button"
                class="ct-btn-remove"
                onclick={() => removeHep(idx)}
                aria-label="Remove exercise">×</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if hepItems.length === 0}
      <p class="ct-empty-hint">No exercises added yet.</p>
      <button type="button" class="btn-add" onclick={addHep}>+ Add Exercise</button>
    {/if}
  </CollapsibleSubsection>

  <!-- Patient Education -->
  <CollapsibleSubsection
    title="Patient Education"
    open={openSubs.education}
    onToggle={() => toggle('education')}
    dataSubsection="patient-education"
  >
    <textarea
      rows="2"
      value={field('patientEducation')}
      oninput={(e) => onInput('patientEducation', e)}
      placeholder="Topics covered with patient: activity modification, precautions, expected recovery timeline, adherence strategies, when to contact provider"
    ></textarea>
  </CollapsibleSubsection>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ─── Field helpers ─── */

  .field-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.78125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 140px;
  }

  .field-label--select {
    flex: 0 0 200px;
  }

  /* ─── Goals ─── */

  .goal-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .goal-row {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    border-radius: 6px;
    transition:
      opacity 0.15s,
      background 0.1s;
  }

  .goal-row--dragging {
    opacity: 0.4;
  }

  .goal-row__handle {
    flex-shrink: 0;
    cursor: grab;
    font-size: 1rem;
    padding: 0.5rem 0.25rem;
    color: var(--color-neutral-400, #a3a3a3);
    user-select: none;
    /* Button reset */
    background: none;
    border: none;
    line-height: 1;
  }

  .goal-row__handle:active {
    cursor: grabbing;
  }

  .goal-row__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .goal-row__input {
    width: 100%;
    min-width: 0;
  }

  .goal-row__meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .goal-row__select {
    flex: 1;
    min-width: 120px;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 4px;
    font-size: 0.75rem;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-600, #616161);
  }

  .goal-row__select:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: -1px;
    border-color: var(--color-brand-green, #009a44);
  }

  .goal-row__remove {
    flex-shrink: 0;
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-neutral-400, #a3a3a3);
    cursor: pointer;
    padding: 0.375rem;
    line-height: 1;
    border-radius: 4px;
  }

  .goal-row__remove:hover {
    color: #dc2626;
    background: #fef2f2;
  }

  /* ─── Intervention tables ─── */

  .intervention-table {
    table-layout: fixed;
  }

  .intervention-table tbody td {
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid var(--color-neutral-150, #eeeeee);
    vertical-align: top;
  }

  .drag-handle-cell {
    text-align: center;
    vertical-align: middle;
  }

  .dose-input {
    width: 100%;
    resize: vertical;
  }

  .action-col {
    text-align: center;
    width: 3.75rem;
  }

  .btn-add {
    background: none;
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    min-height: 44px;
    font-size: 0.8125rem;
    color: var(--color-brand-green, #009a44);
    cursor: pointer;
    font-weight: 600;
  }

  .btn-add:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-green, #009a44);
  }

  /* Modalities */
  .modalities-group {
    margin-top: 0.75rem;
  }

  .modalities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.25rem 1rem;
  }

  .modality-check {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--color-neutral-700, #424242);
    cursor: pointer;
    padding: 0.25rem 0;
  }

  .modality-check input[type='checkbox'] {
    accent-color: var(--color-brand-green, #009a44);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
</style>
