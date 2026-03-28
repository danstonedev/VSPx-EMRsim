<!--
  AssessmentSection — ICF classification, PT diagnosis, clinical reasoning, prognosis.
  Collapsible subsections matching original AssessmentSection.js
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import type { AssessmentData } from '$lib/types/sections';
  import CollapsibleSubsection from './CollapsibleSubsection.svelte';

  const section = $derived($noteDraft.assessment);

  function field(key: keyof AssessmentData): string {
    return section[key] ?? '';
  }

  function onInput(key: keyof AssessmentData, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateField('assessment', key, target.value);
  }

  // Collapsible state
  let openSubs = $state<Record<string, boolean>>({
    impairments: true,
    icf: true,
    diagnosis: true,
    prognosis: true,
    reasoning: true,
  });

  function toggle(id: string) {
    openSubs = { ...openSubs, [id]: !openSubs[id] };
  }
</script>

<div class="soap-section soap-assessment">
  <!-- Primary Impairments -->
  <CollapsibleSubsection
    title="Primary Impairments"
    open={openSubs.impairments}
    onToggle={() => toggle('impairments')}
    dataSubsection="primary-impairments"
  >
    <textarea
      rows="3"
      value={field('primaryImpairments')}
      oninput={(e) => onInput('primaryImpairments', e)}
      placeholder="Prioritized list of impairments driving the patient's functional limitations (e.g., 'Decreased R shoulder flexion ROM, impaired rotator cuff strength, altered scapulohumeral rhythm')"
    ></textarea>
  </CollapsibleSubsection>

  <!-- ICF Classification -->
  <CollapsibleSubsection
    title="ICF Classification"
    open={openSubs.icf}
    onToggle={() => toggle('icf')}
    dataSubsection="icf-classification"
  >
    <label class="field-label">
      Body Functions, Structures & Impairments
      <span class="field-hint"
        >ICF b/s codes: muscle strength, joint mobility, pain, sensory integrity, posture, tissue
        integrity</span
      >
      <textarea
        rows="3"
        value={field('bodyFunctions')}
        oninput={(e) => onInput('bodyFunctions', e)}
        placeholder="Impairments in body functions (pain, ROM, strength, motor control)..."
      ></textarea>
    </label>
    <label class="field-label">
      Activity Limitations
      <span class="field-hint"
        >ICF d codes: walking, stairs, transfers, lifting, self-care, driving, occupational tasks</span
      >
      <textarea
        rows="2"
        value={field('activityLimitations')}
        oninput={(e) => onInput('activityLimitations', e)}
        placeholder="Specific activities the patient has difficulty performing..."
      ></textarea>
    </label>
    <label class="field-label">
      Participation Restrictions
      <span class="field-hint"
        >Social roles, occupational demands, recreational activities, community engagement</span
      >
      <textarea
        rows="2"
        value={field('participationRestrictions')}
        oninput={(e) => onInput('participationRestrictions', e)}
        placeholder="Life situations affected (work, recreation, social)..."
      ></textarea>
    </label>
  </CollapsibleSubsection>

  <!-- PT Diagnosis -->
  <CollapsibleSubsection
    title="Physical Therapy Diagnosis"
    open={openSubs.diagnosis}
    onToggle={() => toggle('diagnosis')}
    dataSubsection="pt-diagnosis"
  >
    <label class="field-label">
      PT Diagnosis / Movement System Diagnosis
      <input
        type="text"
        value={field('ptDiagnosis')}
        oninput={(e) => onInput('ptDiagnosis', e)}
        placeholder="e.g., Lumbar extension syndrome with mobility deficits"
      />
    </label>
  </CollapsibleSubsection>

  <!-- Prognosis -->
  <CollapsibleSubsection
    title="Prognosis"
    open={openSubs.prognosis}
    onToggle={() => toggle('prognosis')}
    dataSubsection="prognosis"
  >
    <div class="field-row">
      <label class="field-label field-label--select">
        Rating
        <select value={field('prognosis')} onchange={(e) => onInput('prognosis', e)}>
          <option value="">Select...</option>
          <option value="excellent">Excellent — Full recovery expected</option>
          <option value="good">Good — Significant improvement expected</option>
          <option value="fair">Fair — Moderate improvement expected</option>
          <option value="poor">Poor — Minimal improvement expected</option>
          <option value="guarded">Guarded — Uncertain outcome</option>
        </select>
      </label>
    </div>
    <label class="field-label">
      Prognostic Factors
      <textarea
        rows="2"
        value={field('prognosticFactors')}
        oninput={(e) => onInput('prognosticFactors', e)}
        placeholder="Positive factors (motivation, age, general health) and negative factors (comorbidities, chronicity, psychosocial barriers) affecting outcomes"
      ></textarea>
    </label>
  </CollapsibleSubsection>

  <!-- Clinical Reasoning -->
  <CollapsibleSubsection
    title="Clinical Reasoning"
    open={openSubs.reasoning}
    onToggle={() => toggle('reasoning')}
    dataSubsection="clinical-reasoning"
  >
    <label class="field-label">
      Clinical Impression
      <span class="field-hint"
        >Movement system diagnosis, contributing factors, tissue vs. movement-based hypothesis</span
      >
      <textarea
        rows="4"
        value={field('clinicalReasoning')}
        oninput={(e) => onInput('clinicalReasoning', e)}
        placeholder="Synthesize subjective/objective findings to justify movement system diagnosis and plan of care. Address tissue irritability, stage of healing, differential reasoning."
      ></textarea>
    </label>
  </CollapsibleSubsection>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 0;
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
    min-width: 0;
    margin-top: 0.5rem;
  }

  .field-label--select {
    flex: 0 0 280px;
  }

  .field-hint {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-weight: 400;
    font-style: italic;
  }
</style>
