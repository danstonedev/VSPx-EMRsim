<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createCase, saveDraft } from '$lib/store';
  import type { CaseObj } from '$lib/store';
  import {
    initVspRegistry,
    vspPatients,
    isRegistryLoading,
    searchRegistryPatients,
    createPatient as createVspPatient,
  } from '$lib/stores/vspRegistry';
  import {
    displayName,
    computeAge,
    normalizeSex,
    allergySummary,
    type VspRecord,
  } from '$lib/services/vspRegistry';

  // ─── Role / discipline / template catalog ────────────────────────────────

  const ROLES = [
    { id: 'student', label: 'Student' },
    { id: 'faculty', label: 'Faculty' },
  ] as const;

  const PROFESSIONS = [
    { id: 'pt', label: 'Physical Therapy', shortLabel: 'PT' },
    { id: 'dietetics', label: 'Dietetics', shortLabel: 'RDN' },
  ] as const;

  interface NoteTemplate {
    id: string;
    label: string;
    shortLabel: string;
    encounter: string;
  }

  const TEMPLATES: Record<string, NoteTemplate[]> = {
    pt: [
      {
        id: 'pt-eval',
        label: 'PT Initial Evaluation (SOAP)',
        shortLabel: 'PT Evaluation',
        encounter: 'eval',
      },
      {
        id: 'pt-simple-soap',
        label: 'PT Simple SOAP Note',
        shortLabel: 'PT Simple SOAP',
        encounter: 'eval',
      },
    ],
    dietetics: [
      {
        id: 'dietetics-ncp',
        label: 'Nutrition Care Process Note',
        shortLabel: 'NCP Note',
        encounter: 'nutrition',
      },
    ],
  };

  // ─── State ───────────────────────────────────────────────────────────────

  let selectedRole = $state('student');
  let selectedProfession = $state('pt');
  let selectedTemplate = $state('pt-eval');
  let selectedPatient = $state<VspRecord | null>(null);
  let search = $state('');
  let showCreateForm = $state(false);
  let newFirstName = $state('');
  let newLastName = $state('');
  let submitting = $state(false);

  const templates = $derived(TEMPLATES[selectedProfession] ?? []);
  const filteredPatients = $derived(
    search ? searchRegistryPatients(search, 50) : ($vspPatients as VspRecord[]),
  );

  function selectProfession(id: string) {
    selectedProfession = id;
    const tpls = TEMPLATES[id] ?? [];
    selectedTemplate = tpls[0]?.id ?? '';
  }

  onMount(async () => {
    await initVspRegistry();
  });

  function buildCaseObj(patient: VspRecord, template: NoteTemplate): CaseObj {
    const name = displayName(patient) || `${patient.firstName} ${patient.lastName}`;
    const age = computeAge(patient.dob);
    const sex = normalizeSex(patient.sex) || 'unspecified';
    const setting = selectedProfession === 'dietetics' ? 'Inpatient' : 'Outpatient';

    return {
      title: name,
      caseTitle: name,
      patientName: name,
      patientDOB: patient.dob || '',
      patientAge: age != null ? String(age) : '',
      patientGender: sex,
      meta: {
        title: name,
        patientName: name,
        patientId: patient.id,
        vspId: patient.id,
        dob: patient.dob || '',
        sex,
        setting,
        acuity: 'unspecified',
        professionId: selectedProfession,
        templateId: template.id,
        preferredLanguage: patient.preferredLanguage || 'English',
        interpreterNeeded: !!patient.interpreterNeeded,
        pronouns: patient.pronouns || '',
      },
      snapshot: {
        name,
        dob: patient.dob || '',
        age: age != null ? String(age) : '',
        sex,
        mrn: patient.mrn || '',
        preferredLanguage: patient.preferredLanguage || 'English',
        interpreterNeeded: !!patient.interpreterNeeded,
        pronouns: patient.pronouns || '',
      },
      history: {
        allergies: patient.allergies?.map((a) => a.name).filter(Boolean) ?? [],
        meds:
          patient.activeMedications
            ?.map(
              (m) =>
                `${m.name}${m.dose ? ` ${m.dose}` : ''}${m.frequency ? ` ${m.frequency}` : ''}`,
            )
            .filter(Boolean) ?? [],
        pmh: [...(patient.medicalHistory ?? []), ...(patient.surgicalHistory ?? [])].filter(
          Boolean,
        ),
      },
      encounters: { eval: {} },
      modules: [],
    } as CaseObj;
  }

  function buildDraft(patient: VspRecord, caseId: string) {
    const name = displayName(patient) || `${patient.firstName} ${patient.lastName}`;
    return {
      noteTitle: name,
      subjective: {
        patientName: name,
        patientBirthday: patient.dob || '',
        patientAge: computeAge(patient.dob) ?? '',
        patientGender: normalizeSex(patient.sex) || '',
        patientGenderIdentityPronouns: patient.pronouns || '',
        patientPreferredLanguage: patient.preferredLanguage || 'English',
        patientInterpreterNeeded: patient.interpreterNeeded ? 'yes' : 'no',
        patientHeightFt: patient.heightFt || '',
        patientHeightIn: patient.heightIn || '',
        patientWeight: patient.weightLbs || '',
        patientAllergies: allergySummary(patient),
        __vspId: patient.id,
      },
      __savedAt: Date.now(),
      meta: {
        caseId,
        encounterId: 'eval',
        professionId: selectedProfession,
        templateId: selectedTemplate,
        patientId: patient.id,
        canonicalPatientId: patient.id,
        launchSource: 'unified-funnel',
      },
    };
  }

  async function launch() {
    if (!selectedPatient || !selectedTemplate || submitting) return;
    submitting = true;

    try {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (!template) return;

      const caseObj = buildCaseObj(selectedPatient, template);
      const wrapper = createCase(caseObj);
      const encounter = template.encounter || 'eval';
      const draft = buildDraft(selectedPatient, wrapper.id);
      saveDraft(wrapper.id, encounter, draft);

      await goto(`/workspace/editor?case=${wrapper.id}&encounter=${encounter}`);
    } finally {
      submitting = false;
    }
  }

  function quickCreatePatient() {
    if (!newFirstName.trim() && !newLastName.trim()) return;
    const record = createVspPatient({
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
    });
    selectedPatient = record;
    newFirstName = '';
    newLastName = '';
    showCreateForm = false;
  }
</script>

<svelte:head>
  <title>Unified Workspace | UND EMR-Sim</title>
</svelte:head>

<section class="workspace">
  <header class="workspace__hero">
    <p class="workspace__eyebrow">Workspace</p>
    <h1>Unified Workspace</h1>
    <p class="workspace__subtitle">Choose a mode, pick a patient, and continue.</p>
    <nav class="workspace__quick-links" aria-label="Quick links">
      <a href="/workspace/drafts" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">draft</span> Note Hub
      </a>
      <a href="/workspace/dietetics" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">hub</span> Multi-Discipline
      </a>
      <a href="/workspace/registry" class="quick-link">
        <span class="material-symbols-outlined" aria-hidden="true">group</span> VSP Registry
      </a>
    </nav>
  </header>

  <!-- Step 1: Mode -->
  <div class="workspace__card">
    <div class="workspace__card-header">
      <h2><span class="step-badge">1</span> Mode</h2>
      <span class="workspace__card-meta">Start here</span>
    </div>
    <div class="workspace__card-body workspace__card-body--dual">
      <div class="form-group">
        <label class="form-group__label" for="role-select">Role</label>
        <select id="role-select" class="form-input" bind:value={selectedRole}>
          {#each ROLES as role}
            <option value={role.id}>{role.label}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label class="form-group__label" for="profession-select">Discipline</label>
        <select
          id="profession-select"
          class="form-input"
          bind:value={selectedProfession}
          onchange={() => selectProfession(selectedProfession)}
        >
          {#each PROFESSIONS as prof}
            <option value={prof.id}>{prof.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Step 2: Patient -->
  <div class="workspace__card">
    <div class="workspace__card-header">
      <h2><span class="step-badge">2</span> Patient</h2>
      <div class="workspace__card-actions">
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          onclick={() => (showCreateForm = !showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ New Patient'}
        </button>
        <a href="/workspace/registry" class="btn btn--ghost btn--sm">Registry</a>
      </div>
    </div>
    <div class="workspace__card-body">
      {#if showCreateForm}
        <div class="quick-create">
          <input
            type="text"
            class="form-input"
            placeholder="First name"
            bind:value={newFirstName}
          />
          <input type="text" class="form-input" placeholder="Last name" bind:value={newLastName} />
          <button
            type="button"
            class="btn btn--primary btn--sm"
            disabled={!newFirstName.trim() && !newLastName.trim()}
            onclick={quickCreatePatient}>Create</button
          >
        </div>
      {/if}

      {#if selectedPatient}
        <div class="selected-patient">
          <span class="selected-patient__label">Selected:</span>
          <strong>{displayName(selectedPatient)}</strong>
          {#if selectedPatient.dob}
            <span class="selected-patient__meta">DOB: {selectedPatient.dob}</span>
          {/if}
          <button
            type="button"
            class="btn btn--ghost btn--xs"
            onclick={() => (selectedPatient = null)}>Change</button
          >
        </div>
      {/if}

      <input
        type="search"
        class="search-input"
        placeholder="Search patients..."
        bind:value={search}
        aria-label="Search patients"
      />

      {#if $isRegistryLoading}
        <p class="workspace__status">Loading patients...</p>
      {:else if filteredPatients.length === 0}
        <p class="workspace__status">
          {search ? `No patients matching "${search}"` : 'No patients yet. Create one to continue.'}
        </p>
      {:else}
        <div class="patient-grid">
          {#each filteredPatients as patient (patient.id)}
            <button
              type="button"
              class="patient-option"
              class:patient-option--selected={selectedPatient?.id === patient.id}
              onclick={() => (selectedPatient = patient)}
            >
              <span class="patient-option__name">{displayName(patient)}</span>
              <span class="patient-option__cat">
                {#if patient.dob}DOB: {patient.dob}{/if}
                {#if patient.sex}&middot; {patient.sex}{/if}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Step 3: Note Template -->
  <div class="workspace__card">
    <div class="workspace__card-header">
      <h2><span class="step-badge">3</span> Note Template</h2>
      <span class="workspace__card-meta">Choose a workspace</span>
    </div>
    <div class="workspace__card-body">
      <div class="encounter-grid">
        {#each templates as tpl}
          <button
            type="button"
            class="encounter-option"
            class:encounter-option--selected={selectedTemplate === tpl.id}
            aria-pressed={selectedTemplate === tpl.id}
            onclick={() => (selectedTemplate = tpl.id)}
          >
            <span class="encounter-option__label">{tpl.shortLabel}</span>
            <span class="encounter-option__detail">{tpl.label}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Launch -->
  <div class="workspace__launch">
    {#if selectedPatient && selectedTemplate}
      {@const prof = PROFESSIONS.find((p) => p.id === selectedProfession)}
      <p class="workspace__summary">
        <strong>{displayName(selectedPatient)}</strong> &middot;
        {prof?.shortLabel ?? selectedProfession} &middot;
        {ROLES.find((r) => r.id === selectedRole)?.label ?? selectedRole}
      </p>
    {:else}
      <p class="workspace__hint">Select a patient to continue.</p>
    {/if}
    <button
      type="button"
      class="btn btn--primary btn--lg"
      disabled={!selectedPatient || !selectedTemplate || submitting}
      onclick={launch}
    >
      {submitting
        ? 'Opening...'
        : selectedRole === 'student'
          ? 'Open Chart'
          : 'Open Faculty Workspace'}
    </button>
  </div>
</section>

<style>
  .workspace {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  .workspace__hero {
    text-align: center;
    margin-bottom: 2rem;
  }

  .workspace__eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-brand-green, #009a44);
    margin-bottom: 0.25rem;
  }

  .workspace__hero h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .workspace__subtitle {
    color: var(--color-neutral-500, #737373);
    font-size: 0.9375rem;
    margin: 0;
  }

  .workspace__quick-links {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .quick-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-600, #525252);
    text-decoration: none;
    background: var(--color-neutral-100, #f0f0f0);
    transition: background 0.12s;
  }

  .quick-link:hover {
    background: var(--color-neutral-200, #e0e0e0);
    color: var(--color-neutral-800, #262626);
  }

  .quick-link .material-symbols-outlined {
    font-size: 1.125rem;
  }

  .workspace__card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 12px;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }

  .workspace__card-header h2 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .step-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-brand-green, #009a44);
    color: white;
    font-size: 0.8125rem;
    font-weight: 700;
  }

  .workspace__card-body {
    padding: 1.25rem;
  }

  .search-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
    background: var(--color-surface, white);
  }

  .search-input:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: -1px;
    border-color: var(--color-brand-green, #009a44);
  }

  .workspace__status {
    color: var(--color-neutral-500, #737373);
    text-align: center;
    padding: 1.5rem 0;
    margin: 0;
  }

  .patient-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.625rem;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .patient-option {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 8px;
    background: var(--color-surface, white);
    cursor: pointer;
    text-align: left;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .patient-option:hover {
    border-color: var(--color-brand-green, #009a44);
  }

  .patient-option--selected {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.05);
    box-shadow: 0 0 0 1px var(--color-brand-green, #009a44);
  }

  .patient-option__name {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .patient-option__cat {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #737373);
  }

  .encounter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.625rem;
  }

  .encounter-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    padding: 0.875rem 1rem;
    border: 2px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 8px;
    background: var(--color-surface, white);
    cursor: pointer;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .encounter-option:hover {
    border-color: var(--color-brand-green, #009a44);
  }

  .encounter-option--selected {
    border-color: var(--color-brand-green, #009a44);
    background: rgba(0, 154, 68, 0.05);
    box-shadow: 0 0 0 1px var(--color-brand-green, #009a44);
  }

  .encounter-option__label {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .workspace__launch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: var(--color-neutral-50, #fafafa);
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 12px;
  }

  .workspace__summary {
    font-size: 0.9375rem;
    margin: 0;
  }

  .workspace__hint {
    font-size: 0.9375rem;
    color: var(--color-neutral-400, #a3a3a3);
    margin: 0;
  }

  .btn--lg {
    min-height: 48px;
    padding: 0.625rem 1.5rem;
    font-size: 1rem;
  }

  /* Dual-column mode card */
  .workspace__card-body--dual {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-group__label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-neutral-500, #737373);
  }

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-surface, white);
  }

  .form-input:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: -1px;
    border-color: var(--color-brand-green, #009a44);
  }

  /* Card header meta / actions */
  .workspace__card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.25rem;
    background: var(--color-neutral-50, #fafafa);
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .workspace__card-meta {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-weight: 500;
  }

  .workspace__card-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  /* Selected patient banner */
  .selected-patient {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(0, 154, 68, 0.06);
    border: 1px solid var(--color-brand-green, #009a44);
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .selected-patient__label {
    color: var(--color-neutral-500, #737373);
    font-size: 0.75rem;
  }

  .selected-patient__meta {
    color: var(--color-neutral-500, #737373);
    font-size: 0.8125rem;
  }

  /* Quick create form */
  .quick-create {
    display: flex;
    gap: 0.5rem;
    align-items: end;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
  }

  .quick-create .form-input {
    flex: 1;
  }

  /* Template detail text */
  .encounter-option__detail {
    font-size: 0.6875rem;
    color: var(--color-neutral-500, #737373);
    font-weight: 400;
  }

  /* Button small variants */
  .btn--sm {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
  }

  .btn--xs {
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
  }

  @media (max-width: 600px) {
    .workspace__card-body--dual {
      grid-template-columns: 1fr;
    }

    .workspace__quick-links {
      flex-wrap: wrap;
      justify-content: center;
    }

    .workspace__launch {
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }

    .quick-create {
      flex-direction: column;
    }
  }
</style>
