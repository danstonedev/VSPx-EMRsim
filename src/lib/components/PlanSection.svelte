<!--
  PlanSection — Goals, in-clinic interventions, HEP, frequency/duration.
  Mirrors original PlanMain.js + GoalSetting.js + TreatmentPlan.js
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';
  import { useNoteTemplate, isSubsectionVisible } from '$lib/config/templates';
  import GroupedToggleBoard from './GroupedToggleBoard.svelte';
  import InterventionTable from './inputs/InterventionTable.svelte';
  import { createDragReorder } from '$lib/utils/dragReorder';
  import { PT_INTERVENTIONS, scoreIntervention } from '$lib/config/ptCodes';
  import {
    FREQUENCY_OPTIONS,
    DURATION_OPTIONS,
    MODALITY_CATALOG,
  } from '$lib/config/interventionCatalog';
  import type { PlanData, PlanGoal, PlanIntervention } from '$lib/types/sections';

  const noteTemplate = useNoteTemplate();

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

  // TODO: derive discipline from session context once multi-discipline routing is wired
  const MODALITY_OPTIONS = MODALITY_CATALOG['pt'];

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

  const GOAL_TYPE_OPTIONS = [
    { value: '', label: 'Type…' },
    { value: 'stg', label: 'STG' },
    { value: 'ltg', label: 'LTG' },
  ];

  const GOAL_STATUS_OPTIONS = [
    { value: '', label: 'Status…' },
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'met', label: 'Met' },
    { value: 'not-met', label: 'Not Met' },
    { value: 'modified', label: 'Modified' },
  ];

  const EDUCATION_TOPICS = [
    'Home exercise program',
    'Activity modification',
    'Body mechanics / ergonomics',
    'Fall prevention',
    'Disease process education',
    'Pain neuroscience education',
    'Precautions / contraindications',
    'Expected recovery timeline',
    'When to contact provider',
    'Caregiver training',
    'Equipment / DME use',
    'Adherence strategies',
  ];

  const MODALITY_GROUPS = [
    {
      id: 'thermal-hydro',
      label: 'Thermal and Hydrotherapy',
      helper: 'Heat, cold, and immersion-based symptom modulation.',
      items: [
        'Hot Pack / Moist Heat',
        'Cold Pack / Cryotherapy',
        'Paraffin',
        'Whirlpool / Hydrotherapy',
        'Fluidotherapy',
      ].map((item) => ({ value: item, label: item })),
    },
    {
      id: 'electro',
      label: 'Electrotherapy and Feedback',
      helper: 'Neuromuscular activation, pain modulation, and cueing tools.',
      items: ['Electrical Stimulation (NMES/TENS)', 'Biofeedback'].map((item) => ({
        value: item,
        label: item,
      })),
    },
    {
      id: 'mechanical',
      label: 'Mechanical and Tissue Loading',
      helper: 'Mechanical, acoustic, and tissue-specific adjuncts.',
      items: ['Ultrasound', 'Mechanical Traction', 'Laser Therapy', 'Phonophoresis'].map(
        (item) => ({ value: item, label: item }),
      ),
    },
    {
      id: 'delivery',
      label: 'Medication Delivery',
      helper: 'Adjuncts used to deliver medication through the skin.',
      items: ['Iontophoresis'].map((item) => ({ value: item, label: item })),
    },
  ];

  const EDUCATION_TOPIC_GROUPS = [
    {
      id: 'home-program',
      label: 'Home Program and Adherence',
      helper: 'What the patient needs in order to carry the plan outside the clinic.',
      items: ['Home exercise program', 'Adherence strategies', 'Expected recovery timeline'].map(
        (item) => ({ value: item, label: item }),
      ),
    },
    {
      id: 'self-management',
      label: 'Self-Management and Mechanics',
      helper: 'How the patient should move, load, or interpret symptoms day to day.',
      items: [
        'Activity modification',
        'Body mechanics / ergonomics',
        'Pain neuroscience education',
        'Disease process education',
      ].map((item) => ({ value: item, label: item })),
    },
    {
      id: 'safety',
      label: 'Safety and Equipment',
      helper: 'Precautions, escalation points, and equipment use.',
      items: [
        'Fall prevention',
        'Precautions / contraindications',
        'When to contact provider',
        'Equipment / DME use',
      ].map((item) => ({ value: item, label: item })),
    },
    {
      id: 'support',
      label: 'Support System',
      helper: 'Teaching that involves family, caregivers, or helpers.',
      items: ['Caregiver training'].map((item) => ({ value: item, label: item })),
    },
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

  function onGoalType(index: number, e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    const updated = [...goals];
    updated[index] = { ...updated[index], goalType: val };
    updateGoals(updated);
  }

  function onGoalStatus(index: number, e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    const updated = [...goals];
    updated[index] = { ...updated[index], status: val };
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

  // ─── HEP Interventions ───

  const hepItems = $derived.by((): PlanIntervention[] => {
    const h = section.hepInterventions;
    return Array.isArray(h) ? h : [];
  });

  function updateHep(items: PlanIntervention[]) {
    updateField('plan', 'hepInterventions', [...items]);
  }

  // ─── Education Topics Checklist ───

  const educationTopics = $derived.by((): string[] => {
    const et = section.educationTopics;
    return Array.isArray(et) ? et : [];
  });

  function toggleEducationTopic(topic: string) {
    const updated = educationTopics.includes(topic)
      ? educationTopics.filter((t) => t !== topic)
      : [...educationTopics, topic];
    updateField('plan', 'educationTopics', updated);
  }
</script>

<div class="soap-section soap-plan">
  <!-- Visit Parameters -->
  {#if isSubsectionVisible(noteTemplate, 'plan', 'visit-parameters')}
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
  {/if}

  <!-- Goals -->
  {#if isSubsectionVisible(noteTemplate, 'plan', 'goal-setting')}
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
                    class="goal-row__select goal-row__select--narrow"
                    value={entry.goalType ?? ''}
                    onchange={(e) => onGoalType(i, e)}
                    aria-label="Goal {i + 1} type"
                  >
                    {#each GOAL_TYPE_OPTIONS as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
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
                  <select
                    class="goal-row__select"
                    value={entry.status ?? ''}
                    onchange={(e) => onGoalStatus(i, e)}
                    aria-label="Goal {i + 1} status"
                  >
                    {#each GOAL_STATUS_OPTIONS as opt}
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
  {/if}

  <!-- Treatment Narrative -->
  {#if isSubsectionVisible(noteTemplate, 'plan', 'treatment-narrative')}
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

      <GroupedToggleBoard
        label="Physical Modalities"
        helper="Group modalities by treatment intent so the student can find the right adjunct faster."
        groups={MODALITY_GROUPS}
        selected={modalities}
        onToggle={toggleModality}
        selectedLabel="Modalities already planned"
        emptyLabel="No modalities selected yet."
      />
    </CollapsibleSubsection>
  {/if}

  <!-- In-Clinic Treatment Plan -->
  {#if isSubsectionVisible(noteTemplate, 'plan', 'in-clinic-treatment-plan')}
    <CollapsibleSubsection
      title="In-Clinic Treatment Plan"
      open={openSubs.inClinic}
      onToggle={() => toggle('inClinic')}
      dataSubsection="in-clinic-treatment-plan"
    >
      <InterventionTable
        items={inClinic}
        onUpdate={updateInClinic}
        interventionLabel="Intervention"
        dosageLabel="Dose"
        interventionPlaceholder="Search or type intervention..."
        dosagePlaceholder="e.g., 3×10, 30s hold"
        emptyLabel="No interventions added yet."
        addLabel="Add Intervention"
        library={PT_INTERVENTIONS}
        scoreFn={scoreIntervention}
      />
    </CollapsibleSubsection>
  {/if}

  <!-- Home Exercise Program -->
  {#if isSubsectionVisible(noteTemplate, 'plan', 'hep-plan')}
    <CollapsibleSubsection
      title="Home Exercise Program (HEP)"
      open={openSubs.hep}
      onToggle={() => toggle('hep')}
      dataSubsection="hep-plan"
    >
      <InterventionTable
        items={hepItems}
        onUpdate={updateHep}
        interventionLabel="Exercise / Activity"
        dosageLabel="Dose / Frequency"
        interventionPlaceholder="Search or type exercise..."
        dosagePlaceholder="e.g., 3×10, 1×/day"
        emptyLabel="No exercises added yet."
        addLabel="Add Exercise"
        library={PT_INTERVENTIONS}
        scoreFn={scoreIntervention}
      />
    </CollapsibleSubsection>
  {/if}

  <!-- Patient Education -->
  {#if isSubsectionVisible(noteTemplate, 'plan', 'patient-education')}
    <CollapsibleSubsection
      title="Patient Education"
      open={openSubs.education}
      onToggle={() => toggle('education')}
      dataSubsection="patient-education"
    >
      <GroupedToggleBoard
        label="Topics Covered"
        helper="Organize education by what the patient is being asked to understand, do, or monitor."
        groups={EDUCATION_TOPIC_GROUPS}
        selected={educationTopics}
        onToggle={toggleEducationTopic}
        selectedLabel="Education already covered"
        emptyLabel="No education topics selected yet."
      />
      <label class="field-label">
        Education Notes
        <textarea
          rows="2"
          value={field('patientEducation')}
          oninput={(e) => onInput('patientEducation', e)}
          placeholder="Additional details, patient response to education, handouts provided, demonstrated understanding..."
        ></textarea>
      </label>
    </CollapsibleSubsection>
  {/if}
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

  .goal-row__select--narrow {
    flex: 0 0 auto;
    min-width: 70px;
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
