<!--
  SubjectiveSection — editable subjective SOAP fields.
  Reads seed from encounter data, binds to noteDraft.subjective.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';

  const section = $derived($noteDraft.subjective);

  function field(key: string): string {
    return (section[key] as string) ?? '';
  }

  function onInput(key: string, e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateField('subjective', key, target.value);
  }
</script>

<div class="soap-section soap-subjective">
  <fieldset class="soap-fieldset">
    <legend>Chief Complaint</legend>
    <textarea
      rows="2"
      value={field('chiefComplaint')}
      oninput={(e) => onInput('chiefComplaint', e)}
      placeholder="Describe the chief complaint..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>History of Present Illness</legend>
    <textarea
      rows="4"
      value={field('historyOfPresentIllness')}
      oninput={(e) => onInput('historyOfPresentIllness', e)}
      placeholder="Describe onset, mechanism, progression..."
    ></textarea>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Pain Assessment</legend>
    <div class="field-row">
      <label class="field-label">
        Location
        <input
          type="text"
          value={field('painLocation')}
          oninput={(e) => onInput('painLocation', e)}
          placeholder="e.g. Right shoulder, anterior/lateral"
        />
      </label>
      <label class="field-label field-label--narrow">
        Pain Scale (0–10)
        <input
          type="number"
          min="0"
          max="10"
          value={field('painScale')}
          oninput={(e) => onInput('painScale', e)}
        />
      </label>
    </div>
    <label class="field-label">
      Quality
      <input
        type="text"
        value={field('painQuality')}
        oninput={(e) => onInput('painQuality', e)}
        placeholder="e.g. Sharp, aching, burning"
      />
    </label>
    <label class="field-label">
      Pattern
      <input
        type="text"
        value={field('painPattern')}
        oninput={(e) => onInput('painPattern', e)}
        placeholder="e.g. Intermittent, constant, worse in morning"
      />
    </label>
    <label class="field-label">
      Aggravating Factors
      <textarea
        rows="2"
        value={field('aggravatingFactors')}
        oninput={(e) => onInput('aggravatingFactors', e)}
        placeholder="Activities or positions that worsen symptoms..."
      ></textarea>
    </label>
    <label class="field-label">
      Easing Factors
      <textarea
        rows="2"
        value={field('easingFactors')}
        oninput={(e) => onInput('easingFactors', e)}
        placeholder="Activities or positions that relieve symptoms..."
      ></textarea>
    </label>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Functional Status</legend>
    <label class="field-label">
      Functional Limitations
      <textarea
        rows="3"
        value={field('functionalLimitations')}
        oninput={(e) => onInput('functionalLimitations', e)}
        placeholder="ADLs, work tasks, or recreational activities affected..."
      ></textarea>
    </label>
    <label class="field-label">
      Prior Level of Function
      <textarea
        rows="2"
        value={field('priorLevel')}
        oninput={(e) => onInput('priorLevel', e)}
        placeholder="Describe baseline functional abilities..."
      ></textarea>
    </label>
    <label class="field-label">
      Patient Goals
      <textarea
        rows="2"
        value={field('patientGoals')}
        oninput={(e) => onInput('patientGoals', e)}
        placeholder="Patient-stated goals for therapy..."
      ></textarea>
    </label>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Medical History</legend>
    <label class="field-label">
      Current Medications
      <textarea
        rows="2"
        value={field('medicationsCurrent')}
        oninput={(e) => onInput('medicationsCurrent', e)}
        placeholder="List current medications..."
      ></textarea>
    </label>
    <label class="field-label">
      Red Flags Screening
      <textarea
        rows="2"
        value={field('redFlags')}
        oninput={(e) => onInput('redFlags', e)}
        placeholder="Document red flag screening findings..."
      ></textarea>
    </label>
    <label class="field-label">
      Additional History
      <textarea
        rows="2"
        value={field('additionalHistory')}
        oninput={(e) => onInput('additionalHistory', e)}
        placeholder="PMH, surgical history, relevant social history..."
      ></textarea>
    </label>
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
  }

  .field-label--narrow {
    flex: 0 0 120px;
  }

  .soap-fieldset > textarea {
    margin-top: 0.5rem;
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
</style>
