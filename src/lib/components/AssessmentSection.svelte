<!--
  AssessmentSection — editable assessment SOAP fields.
  ICF classification, PT diagnosis, clinical reasoning, prognosis.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';

  const section = $derived($noteDraft.assessment);

  function field(key: string): string {
    return (section[key] as string) ?? '';
  }

  function onInput(key: string, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    updateField('assessment', key, target.value);
  }
</script>

<div class="soap-section soap-assessment">
  <fieldset class="soap-fieldset">
    <legend>Primary Impairments</legend>
    <textarea
      rows="3"
      value={field('primaryImpairments')}
      oninput={(e) => onInput('primaryImpairments', e)}
      placeholder="Summarize the primary impairments identified..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>ICF Classification</legend>
    <label class="field-label">
      Body Functions & Structures
      <textarea
        rows="3"
        value={field('bodyFunctions')}
        oninput={(e) => onInput('bodyFunctions', e)}
        placeholder="Impairments in body functions (pain, ROM, strength, motor control)..."
      ></textarea>
    </label>
    <label class="field-label">
      Activity Limitations
      <textarea
        rows="2"
        value={field('activityLimitations')}
        oninput={(e) => onInput('activityLimitations', e)}
        placeholder="Specific activities the patient has difficulty performing..."
      ></textarea>
    </label>
    <label class="field-label">
      Participation Restrictions
      <textarea
        rows="2"
        value={field('participationRestrictions')}
        oninput={(e) => onInput('participationRestrictions', e)}
        placeholder="Life situations affected (work, recreation, social)..."
      ></textarea>
    </label>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>PT Diagnosis</legend>
    <textarea
      rows="2"
      value={field('ptDiagnosis')}
      oninput={(e) => onInput('ptDiagnosis', e)}
      placeholder="Physical therapy diagnosis with ICD-10 codes..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Prognosis</legend>
    <div class="prognosis-row">
      <label class="field-label field-label--select">
        Rating
        <select value={field('prognosis')} onchange={(e) => onInput('prognosis', e)}>
          <option value="">Select...</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="guarded">Guarded</option>
          <option value="poor">Poor</option>
        </select>
      </label>
    </div>
    <label class="field-label">
      Prognostic Factors
      <textarea
        rows="2"
        value={field('prognosticFactors')}
        oninput={(e) => onInput('prognosticFactors', e)}
        placeholder="Positive and negative prognostic factors..."
      ></textarea>
    </label>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Clinical Reasoning</legend>
    <textarea
      rows="4"
      value={field('clinicalReasoning')}
      oninput={(e) => onInput('clinicalReasoning', e)}
      placeholder="Synthesize findings, differential reasoning, and justification for diagnosis and plan..."
    ></textarea>
  </fieldset>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .soap-fieldset {
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin: 0;
  }

  .soap-fieldset legend {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-neutral-700, #404040);
    padding: 0 0.25rem;
  }

  .soap-fieldset > textarea {
    width: 100%;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.5;
    font-family: inherit;
    color: var(--color-neutral-900, #171717);
    background: var(--color-white, #fff);
    resize: vertical;
    margin-top: 0.5rem;
    box-sizing: border-box;
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #525252);
    flex: 1;
    min-width: 0;
    margin-top: 0.75rem;
  }

  .field-label--select {
    flex: 0 0 200px;
  }

  .field-label textarea,
  .field-label select {
    width: 100%;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.5;
    font-family: inherit;
    color: var(--color-neutral-900, #171717);
    background: var(--color-white, #fff);
    box-sizing: border-box;
  }

  .field-label textarea {
    resize: vertical;
  }

  .field-label textarea:focus,
  .field-label select:focus,
  .soap-fieldset > textarea:focus {
    outline: 2px solid var(--color-brand-500, #22c55e);
    outline-offset: -1px;
    border-color: var(--color-brand-500, #22c55e);
  }

  .prognosis-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }
</style>
