<!--
  PlanSection — editable plan SOAP fields.
  Goals table, in-clinic treatment, HEP exercises, frequency/duration.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';

  const section = $derived($noteDraft.plan);

  function field(key: string): string {
    return (section[key] as string) ?? '';
  }

  function onInput(key: string, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateField('plan', key, target.value);
  }

  // Goals table
  type GoalEntry = { goalText: string };
  const goalsTable = $derived((section.goalsTable as Record<string, GoalEntry>) ?? {});
  const goalEntries = $derived(Object.entries(goalsTable));

  function onGoalInput(goalKey: string, e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    const updated = { ...goalsTable, [goalKey]: { goalText: val } };
    updateField('plan', 'goalsTable', updated);
  }

  function addGoal() {
    const nextIdx = Object.keys(goalsTable).length + 1;
    const updated = { ...goalsTable, [`goal_${nextIdx}`]: { goalText: '' } };
    updateField('plan', 'goalsTable', updated);
  }

  function removeGoal(key: string) {
    const updated = { ...goalsTable };
    delete updated[key];
    updateField('plan', 'goalsTable', updated);
  }

  // Exercise table (HEP)
  type ExerciseEntry = { exerciseText: string };
  const exerciseTable = $derived((section.exerciseTable as Record<string, ExerciseEntry>) ?? {});
  const exerciseEntries = $derived(Object.entries(exerciseTable));

  function onExerciseInput(exKey: string, e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    const updated = { ...exerciseTable, [exKey]: { exerciseText: val } };
    updateField('plan', 'exerciseTable', updated);
  }

  function addExercise() {
    const nextIdx = Object.keys(exerciseTable).length + 1;
    const updated = { ...exerciseTable, [`ex_${nextIdx}`]: { exerciseText: '' } };
    updateField('plan', 'exerciseTable', updated);
  }

  function removeExercise(key: string) {
    const updated = { ...exerciseTable };
    delete updated[key];
    updateField('plan', 'exerciseTable', updated);
  }
</script>

<div class="soap-section soap-plan">
  <fieldset class="soap-fieldset">
    <legend>Visit Parameters</legend>
    <div class="field-row">
      <label class="field-label">
        Frequency
        <input
          type="text"
          value={field('frequency')}
          oninput={(e) => onInput('frequency', e)}
          placeholder="e.g. 2x per week"
        />
      </label>
      <label class="field-label">
        Duration
        <input
          type="text"
          value={field('duration')}
          oninput={(e) => onInput('duration', e)}
          placeholder="e.g. 6–8 weeks"
        />
      </label>
    </div>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Treatment Plan</legend>
    <textarea
      rows="4"
      value={field('treatmentPlan')}
      oninput={(e) => onInput('treatmentPlan', e)}
      placeholder="Manual therapy, therapeutic exercise, modalities, neuromuscular re-ed..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Patient Education</legend>
    <textarea
      rows="3"
      value={field('patientEducation')}
      oninput={(e) => onInput('patientEducation', e)}
      placeholder="Activity modification, expectations, adherence strategies..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Goals</legend>
    {#if goalEntries.length > 0}
      <div class="list-items">
        {#each goalEntries as [key, goal], i}
          <div class="list-item">
            <span class="list-item__num">{i + 1}.</span>
            <textarea
              rows="2"
              value={goal.goalText}
              oninput={(e) => onGoalInput(key, e)}
              placeholder="SMART goal..."
            ></textarea>
            <button
              type="button"
              class="btn-remove"
              onclick={() => removeGoal(key)}
              aria-label="Remove goal {i + 1}">×</button
            >
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-hint">No goals added yet.</p>
    {/if}
    <button type="button" class="btn-add" onclick={addGoal}>+ Add Goal</button>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Home Exercise Program (HEP)</legend>
    {#if exerciseEntries.length > 0}
      <div class="list-items">
        {#each exerciseEntries as [key, ex], i}
          <div class="list-item">
            <span class="list-item__num">{i + 1}.</span>
            <textarea
              rows="2"
              value={ex.exerciseText}
              oninput={(e) => onExerciseInput(key, e)}
              placeholder="Exercise description with sets/reps/frequency..."
            ></textarea>
            <button
              type="button"
              class="btn-remove"
              onclick={() => removeExercise(key)}
              aria-label="Remove exercise {i + 1}">×</button
            >
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-hint">No exercises added yet.</p>
    {/if}
    <button type="button" class="btn-add" onclick={addExercise}>+ Add Exercise</button>
  </fieldset>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .soap-fieldset {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin: 0;
    background: white;
  }

  .soap-fieldset legend {
    font-weight: 600;
    font-size: 0.875rem;
    color: white;
    padding: 0.375rem 0.75rem;
    background: linear-gradient(180deg, #424242 0%, #525252 100%);
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .soap-fieldset > textarea {
    margin-top: 0.5rem;
  }

  .field-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #616161);
    flex: 1;
    min-width: 140px;
  }

  .list-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .list-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .list-item__num {
    flex-shrink: 0;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-neutral-500, #737373);
    padding-top: 0.75rem;
    min-width: 1.5rem;
  }

  .btn-remove {
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

  .btn-remove:hover {
    color: #dc2626;
    background: #fef2f2;
  }

  .empty-hint {
    font-size: 0.8125rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    margin: 0.5rem 0;
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
</style>
