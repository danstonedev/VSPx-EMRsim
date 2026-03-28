<!--
  VspPatientForm — create/edit form for a Virtual Standardized Patient record.
  Used by the /workspace/registry route.
-->
<!-- svelte-ignore state_referenced_locally -->
<script lang="ts">
  import type { VspRecord } from '$lib/services/vspRegistry';
  import {
    SEX_OPTIONS,
    GENDER_IDENTITY_OPTIONS,
    RACE_OPTIONS,
    ETHNICITY_OPTIONS,
    MARITAL_STATUS_OPTIONS,
    LANGUAGE_OPTIONS,
    BLOOD_TYPE_OPTIONS,
    CODE_STATUS_OPTIONS,
    US_STATES,
  } from '$lib/services/vspRegistry';

  interface Props {
    initial?: Partial<VspRecord>;
    mode: 'create' | 'edit';
    onSave: (fields: Partial<VspRecord>) => void;
    onCancel: () => void;
  }

  let { initial = {}, mode, onSave, onCancel }: Props = $props();

  // ─── Form state ──────────────────────────────────────────────────
  let firstName = $state(initial.firstName ?? '');
  let middleName = $state(initial.middleName ?? '');
  let lastName = $state(initial.lastName ?? '');
  let preferredName = $state(initial.preferredName ?? '');
  let dob = $state(initial.dob ?? '');
  let sex = $state(initial.sex ?? 'unspecified');
  let genderIdentity = $state(initial.genderIdentity ?? '');
  let pronouns = $state(initial.pronouns ?? '');
  let race = $state(initial.race ?? '');
  let ethnicity = $state(initial.ethnicity ?? '');
  let maritalStatus = $state(initial.maritalStatus ?? '');
  let preferredLanguage = $state(initial.preferredLanguage ?? 'English');
  let interpreterNeeded = $state(initial.interpreterNeeded ?? false);

  let phone = $state(initial.phone ?? '');
  let email = $state(initial.email ?? '');
  let addressStreet = $state(initial.addressStreet ?? '');
  let addressCity = $state(initial.addressCity ?? '');
  let addressState = $state(initial.addressState ?? '');
  let addressZip = $state(initial.addressZip ?? '');

  let emergencyContactName = $state(initial.emergencyContactName ?? '');
  let emergencyContactRelationship = $state(initial.emergencyContactRelationship ?? '');
  let emergencyContactPhone = $state(initial.emergencyContactPhone ?? '');

  let insuranceProvider = $state(initial.insuranceProvider ?? '');
  let insurancePolicyNumber = $state(initial.insurancePolicyNumber ?? '');
  let insuranceGroupNumber = $state(initial.insuranceGroupNumber ?? '');

  let bloodType = $state(initial.bloodType ?? '');
  let codeStatus = $state(initial.codeStatus ?? 'Full Code');
  let primaryCareProvider = $state(initial.primaryCareProvider ?? '');

  // Nice-to-have
  let heightFt = $state(initial.heightFt ?? '');
  let heightIn = $state(initial.heightIn ?? '');
  let weightLbs = $state(initial.weightLbs ?? '');
  let allergiesText = $state(
    Array.isArray(initial.allergies) ? initial.allergies.map((a) => a.name).join(', ') : '',
  );
  let medicalHistoryText = $state(
    Array.isArray(initial.medicalHistory) ? initial.medicalHistory.join(', ') : '',
  );
  let surgicalHistoryText = $state(
    Array.isArray(initial.surgicalHistory) ? initial.surgicalHistory.join(', ') : '',
  );
  let activeMedsText = $state(
    Array.isArray(initial.activeMedications)
      ? initial.activeMedications.map((m) => `${m.name} ${m.dose}`).join(', ')
      : '',
  );

  const canSave = $derived(firstName.trim().length > 0 && lastName.trim().length > 0);

  function handleSubmit() {
    if (!canSave) return;

    const allergies = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, type: '', severity: '', reaction: '' }));

    const medicalHistory = medicalHistoryText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const surgicalHistory = surgicalHistoryText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const activeMedications = activeMedsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ name: text, dose: '', frequency: '', route: '' }));

    onSave({
      firstName,
      middleName,
      lastName,
      preferredName,
      dob,
      sex,
      genderIdentity,
      pronouns,
      race,
      ethnicity,
      maritalStatus,
      preferredLanguage,
      interpreterNeeded,
      phone,
      email,
      addressStreet,
      addressCity,
      addressState,
      addressZip,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceGroupNumber,
      bloodType,
      codeStatus,
      primaryCareProvider,
      heightFt,
      heightIn,
      weightLbs,
      allergies,
      medicalHistory,
      surgicalHistory,
      activeMedications,
    });
  }
</script>

<form
  class="patient-form"
  onsubmit={(e) => {
    e.preventDefault();
    handleSubmit();
  }}
>
  <h2 class="form-title">{mode === 'create' ? 'New VSP Patient' : 'Edit Patient'}</h2>

  <!-- Demographics -->
  <fieldset class="form-section">
    <legend>Demographics</legend>
    <div class="field-row field-row--3">
      <label class="form-field">
        First Name <span class="required">*</span>
        <input type="text" bind:value={firstName} required />
      </label>
      <label class="form-field">
        Middle Name
        <input type="text" bind:value={middleName} />
      </label>
      <label class="form-field">
        Last Name <span class="required">*</span>
        <input type="text" bind:value={lastName} required />
      </label>
    </div>
    <div class="field-row field-row--3">
      <label class="form-field">
        Preferred Name
        <input type="text" bind:value={preferredName} />
      </label>
      <label class="form-field">
        Date of Birth
        <input type="date" bind:value={dob} />
      </label>
      <label class="form-field">
        Sex
        <select bind:value={sex}>
          {#each SEX_OPTIONS as opt}
            <option value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          {/each}
        </select>
      </label>
    </div>
    <div class="field-row field-row--3">
      <label class="form-field">
        Gender Identity
        <select bind:value={genderIdentity}>
          <option value="">—</option>
          {#each GENDER_IDENTITY_OPTIONS as opt}
            <option value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          {/each}
        </select>
      </label>
      <label class="form-field">
        Pronouns
        <input type="text" bind:value={pronouns} placeholder="e.g. she/her" />
      </label>
      <label class="form-field">
        Race
        <select bind:value={race}>
          <option value="">—</option>
          {#each RACE_OPTIONS as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>
    </div>
    <div class="field-row field-row--3">
      <label class="form-field">
        Ethnicity
        <select bind:value={ethnicity}>
          <option value="">—</option>
          {#each ETHNICITY_OPTIONS as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>
      <label class="form-field">
        Marital Status
        <select bind:value={maritalStatus}>
          <option value="">—</option>
          {#each MARITAL_STATUS_OPTIONS as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>
      <label class="form-field">
        Preferred Language
        <select bind:value={preferredLanguage}>
          {#each LANGUAGE_OPTIONS as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>
    </div>
    <label class="form-field form-field--inline">
      <input type="checkbox" bind:checked={interpreterNeeded} />
      Interpreter needed
    </label>
  </fieldset>

  <!-- Contact -->
  <fieldset class="form-section">
    <legend>Contact Information</legend>
    <div class="field-row field-row--2">
      <label class="form-field">
        Phone
        <input type="tel" bind:value={phone} placeholder="(555) 123-4567" />
      </label>
      <label class="form-field">
        Email
        <input type="email" bind:value={email} />
      </label>
    </div>
    <label class="form-field">
      Street Address
      <input type="text" bind:value={addressStreet} />
    </label>
    <div class="field-row field-row--3">
      <label class="form-field">
        City
        <input type="text" bind:value={addressCity} />
      </label>
      <label class="form-field">
        State
        <select bind:value={addressState}>
          <option value="">—</option>
          {#each US_STATES as st}
            <option value={st}>{st}</option>
          {/each}
        </select>
      </label>
      <label class="form-field">
        ZIP
        <input type="text" bind:value={addressZip} maxlength="10" />
      </label>
    </div>
  </fieldset>

  <!-- Emergency Contact -->
  <fieldset class="form-section">
    <legend>Emergency Contact</legend>
    <div class="field-row field-row--3">
      <label class="form-field">
        Name
        <input type="text" bind:value={emergencyContactName} />
      </label>
      <label class="form-field">
        Relationship
        <input type="text" bind:value={emergencyContactRelationship} />
      </label>
      <label class="form-field">
        Phone
        <input type="tel" bind:value={emergencyContactPhone} />
      </label>
    </div>
  </fieldset>

  <!-- Insurance -->
  <fieldset class="form-section">
    <legend>Insurance</legend>
    <div class="field-row field-row--3">
      <label class="form-field">
        Provider
        <input type="text" bind:value={insuranceProvider} />
      </label>
      <label class="form-field">
        Policy Number
        <input type="text" bind:value={insurancePolicyNumber} />
      </label>
      <label class="form-field">
        Group Number
        <input type="text" bind:value={insuranceGroupNumber} />
      </label>
    </div>
  </fieldset>

  <!-- Medical -->
  <fieldset class="form-section">
    <legend>Medical</legend>
    <div class="field-row field-row--3">
      <label class="form-field">
        Blood Type
        <select bind:value={bloodType}>
          <option value="">—</option>
          {#each BLOOD_TYPE_OPTIONS as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>
      <label class="form-field">
        Code Status
        <select bind:value={codeStatus}>
          {#each CODE_STATUS_OPTIONS as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </label>
      <label class="form-field">
        Primary Care Provider
        <input type="text" bind:value={primaryCareProvider} />
      </label>
    </div>
    <div class="field-row field-row--3">
      <label class="form-field">
        Height (ft)
        <input type="number" bind:value={heightFt} min="0" max="9" />
      </label>
      <label class="form-field">
        Height (in)
        <input type="number" bind:value={heightIn} min="0" max="11" />
      </label>
      <label class="form-field">
        Weight (lbs)
        <input type="number" bind:value={weightLbs} min="0" />
      </label>
    </div>
    <label class="form-field">
      Allergies <span class="hint">(comma-separated)</span>
      <input type="text" bind:value={allergiesText} placeholder="Penicillin, Latex, NKDA" />
    </label>
    <label class="form-field">
      Medical History <span class="hint">(comma-separated)</span>
      <input type="text" bind:value={medicalHistoryText} placeholder="Hypertension, Diabetes" />
    </label>
    <label class="form-field">
      Surgical History <span class="hint">(comma-separated)</span>
      <input type="text" bind:value={surgicalHistoryText} placeholder="Appendectomy 2019" />
    </label>
    <label class="form-field">
      Active Medications <span class="hint">(comma-separated)</span>
      <input
        type="text"
        bind:value={activeMedsText}
        placeholder="Lisinopril 10mg, Metformin 500mg"
      />
    </label>
  </fieldset>

  <!-- Actions -->
  <div class="form-actions">
    <button type="button" class="btn btn--cancel" onclick={onCancel}>Cancel</button>
    <button type="submit" class="btn btn--save" disabled={!canSave}>
      {mode === 'create' ? 'Create Patient' : 'Save Changes'}
    </button>
  </div>
</form>

<style>
  .patient-form {
    max-width: 720px;
    margin: 0 auto;
  }

  .form-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1.25rem;
    color: var(--color-neutral-800, #262626);
  }

  .form-section {
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .form-section legend {
    font-weight: 600;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-neutral-600, #525252);
    padding: 0 0.5rem;
  }

  .field-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.625rem;
  }

  .field-row--2 > * {
    flex: 1;
  }
  .field-row--3 > * {
    flex: 1;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.1875rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--color-neutral-600, #525252);
    margin-bottom: 0.5rem;
  }

  .form-field--inline {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .form-field input[type='text'],
  .form-field input[type='email'],
  .form-field input[type='tel'],
  .form-field input[type='date'],
  .form-field input[type='number'],
  .form-field select {
    padding: 0.4375rem 0.625rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    font-size: 0.875rem;
    color: var(--color-neutral-800, #262626);
    background: var(--color-surface, #ffffff);
  }

  .form-field input:focus,
  .form-field select:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .required {
    color: #dc2626;
  }
  .hint {
    font-weight: 400;
    color: var(--color-neutral-400, #a3a3a3);
  }

  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .btn {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }

  .btn--cancel {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-700, #616161);
  }

  .btn--cancel:hover {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .btn--save {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--save:hover:not(:disabled) {
    background: #007a35;
  }
  .btn--save:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .field-row {
      flex-direction: column;
    }
  }
</style>
