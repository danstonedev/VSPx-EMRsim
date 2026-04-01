<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createCase, saveDraft } from '$lib/store';
  import type { CaseObj } from '$lib/store';
  import {
    initVspRegistry,
    isRegistryLoading,
    searchRegistryPatients,
  } from '$lib/stores/vspRegistry';
  import {
    displayName,
    computeAge,
    normalizeSex,
    allergySummary,
    type VspRecord,
  } from '$lib/services/vspRegistry';
  import {
    buildRobertCastellanoPtDemoDraft,
    isRobertCastellanoDemoPatient,
  } from '$lib/config/demoPtNote';
  import VspPatientForm from '$lib/components/VspPatientForm.svelte';
  import { listTemplates, type ResolvedNoteTemplate, type SettingId } from '$lib/config/templates';
  import type { DisciplineId } from '$lib/stores/auth';

  // ─── Role / discipline / setting catalog ─────────────────────────────────

  const ROLES = [
    { id: 'student', label: 'Student' },
    { id: 'faculty', label: 'Faculty' },
  ] as const;

  const PROFESSIONS: readonly { id: DisciplineId; label: string; shortLabel: string }[] = [
    { id: 'pt', label: 'Physical Therapy', shortLabel: 'PT' },
    { id: 'ot', label: 'Occupational Therapy', shortLabel: 'OT' },
    { id: 'slp', label: 'Speech-Language Pathology', shortLabel: 'SLP' },
    { id: 'nursing', label: 'Nursing', shortLabel: 'RN' },
    { id: 'dietetics', label: 'Dietetics', shortLabel: 'RDN' },
  ];

  const SETTINGS: readonly { id: SettingId | 'any'; label: string }[] = [
    { id: 'any', label: 'All Settings' },
    { id: 'outpatient', label: 'Outpatient' },
    { id: 'inpatient-acute', label: 'Inpatient Acute' },
    { id: 'inpatient-rehab', label: 'Inpatient Rehab (IRF)' },
    { id: 'snf', label: 'Skilled Nursing Facility' },
    { id: 'home-health', label: 'Home Health' },
    { id: 'pediatric', label: 'Pediatric' },
  ];

  /** Map template visitType to the encounter key the editor expects. */
  const VISIT_TYPE_TO_ENCOUNTER: Record<string, string> = {
    'initial-eval': 'eval',
    'follow-up': 'followup',
    'daily-note': 'soap',
    'progress-note': 'soap',
    'discharge-summary': 'discharge',
    recertification: 'eval',
    'team-conference': 'soap',
    'start-of-care': 'eval',
  };

  function encounterForTemplate(tpl: ResolvedNoteTemplate): string {
    if (tpl.discipline === 'dietetics') return 'nutrition';
    return VISIT_TYPE_TO_ENCOUNTER[tpl.visitType ?? ''] ?? 'eval';
  }

  // ─── Patient source types ───────────────────────────────────────────────

  type PatientSource =
    | { kind: 'registry'; record: VspRecord }
    | { kind: 'custom'; data: Partial<VspRecord> }
    | null;

  // ─── State ───────────────────────────────────────────────────────────────

  let selectedRole = $state('student');
  let selectedProfession = $state<DisciplineId>('pt');
  let selectedSetting = $state<SettingId | 'any'>('any');
  let selectedTemplateId = $state('');
  let patientSource = $state<PatientSource>(null);
  let search = $state('');
  let showCreateForm = $state(false);
  let submitting = $state(false);

  /** All visit-type templates for the chosen discipline + setting (excludes base templates). */
  const templates = $derived.by((): ResolvedNoteTemplate[] => {
    const all = listTemplates(
      selectedProfession,
      selectedSetting === 'any' ? undefined : selectedSetting,
    );
    // Only show leaf templates (those with a visitType) so students pick a concrete note type
    return all.filter((t) => t.visitType !== null);
  });

  // Auto-select first template when discipline/setting changes
  $effect(() => {
    const tpls = templates;
    if (tpls.length > 0 && !tpls.find((t) => t.id === selectedTemplateId)) {
      selectedTemplateId = tpls[0].id;
    }
  });

  const selectedTemplate = $derived(templates.find((t) => t.id === selectedTemplateId) ?? null);

  const searchResults = $derived(
    search.trim().length >= 2 ? searchRegistryPatients(search, 10) : [],
  );

  const hasPatient = $derived(patientSource !== null);
  const patientDisplayLabel = $derived.by(() => {
    if (!patientSource) return '';
    if (patientSource.kind === 'registry') return displayName(patientSource.record);
    const d = patientSource.data;
    return [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ') || 'Custom Patient';
  });

  function selectProfession(id: DisciplineId) {
    selectedProfession = id;
    selectedSetting = 'any';
    // template auto-selection handled by $effect above
  }

  onMount(async () => {
    await initVspRegistry();
  });

  // ─── Build case/draft from either source ────────────────────────────────

  function patientDataForCase(): VspRecord {
    if (!patientSource) throw new Error('No patient selected');
    if (patientSource.kind === 'registry') return patientSource.record;

    // For custom patients, synthesize a pseudo-record (not persisted to registry)
    const d = patientSource.data;
    return {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mrn: '',
      firstName: d.firstName ?? '',
      middleName: d.middleName ?? '',
      lastName: d.lastName ?? '',
      preferredName: d.preferredName ?? '',
      dob: d.dob ?? '',
      sex: (d.sex as VspRecord['sex']) ?? 'unspecified',
      genderIdentity: d.genderIdentity ?? '',
      pronouns: d.pronouns ?? '',
      race: d.race ?? '',
      ethnicity: d.ethnicity ?? '',
      maritalStatus: d.maritalStatus ?? '',
      preferredLanguage: d.preferredLanguage ?? 'English',
      interpreterNeeded: d.interpreterNeeded ?? false,
      phone: d.phone ?? '',
      email: d.email ?? '',
      addressStreet: d.addressStreet ?? '',
      addressCity: d.addressCity ?? '',
      addressState: d.addressState ?? '',
      addressZip: d.addressZip ?? '',
      emergencyContactName: d.emergencyContactName ?? '',
      emergencyContactRelationship: d.emergencyContactRelationship ?? '',
      emergencyContactPhone: d.emergencyContactPhone ?? '',
      insuranceProvider: d.insuranceProvider ?? '',
      insurancePolicyNumber: d.insurancePolicyNumber ?? '',
      insuranceGroupNumber: d.insuranceGroupNumber ?? '',
      bloodType: d.bloodType ?? '',
      codeStatus: d.codeStatus ?? '',
      primaryCareProvider: d.primaryCareProvider ?? '',
      heightFt: d.heightFt ?? '',
      heightIn: d.heightIn ?? '',
      weightLbs: d.weightLbs ?? '',
      allergies: d.allergies ?? [],
      medicalHistory: d.medicalHistory ?? [],
      surgicalHistory: d.surgicalHistory ?? [],
      activeMedications: d.activeMedications ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as VspRecord;
  }

  function buildCaseObj(patient: VspRecord, tpl: ResolvedNoteTemplate): CaseObj {
    const name = displayName(patient) || `${patient.firstName} ${patient.lastName}`;
    const age = computeAge(patient.dob);
    const sex = normalizeSex(patient.sex) || 'unspecified';
    const setting = tpl.setting
      ? (SETTINGS.find((s) => s.id === tpl.setting)?.label ?? 'Outpatient')
      : 'Outpatient';
    const isRegistry = patientSource?.kind === 'registry';
    const encounter = encounterForTemplate(tpl);
    const demoPtDraft =
      selectedProfession === 'pt' && encounter === 'eval' && isRobertCastellanoDemoPatient(patient)
        ? buildRobertCastellanoPtDemoDraft(patient)
        : null;

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
        patientId: isRegistry ? patient.id : undefined,
        vspId: isRegistry ? patient.id : undefined,
        dob: patient.dob || '',
        sex,
        setting,
        acuity: 'unspecified',
        professionId: selectedProfession,
        templateId: tpl.id,
        preferredLanguage: patient.preferredLanguage || 'English',
        interpreterNeeded: !!patient.interpreterNeeded,
        pronouns: patient.pronouns || '',
        patientSource: isRegistry ? 'registry' : 'custom',
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
      encounters: { [encounter]: demoPtDraft ?? {} },
      modules: [],
    } as CaseObj;
  }

  function buildDraft(patient: VspRecord, caseId: string, tpl: ResolvedNoteTemplate) {
    const name = displayName(patient) || `${patient.firstName} ${patient.lastName}`;
    const isRegistry = patientSource?.kind === 'registry';
    const encounter = encounterForTemplate(tpl);
    const demoPtDraft =
      selectedProfession === 'pt' && encounter === 'eval' && isRobertCastellanoDemoPatient(patient)
        ? buildRobertCastellanoPtDemoDraft(patient)
        : null;
    return {
      noteTitle: name || 'New Note',
      subjective: demoPtDraft?.subjective ?? {
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
        __vspId: isRegistry ? patient.id : undefined,
      },
      objective: demoPtDraft?.objective ?? {},
      assessment: demoPtDraft?.assessment ?? {},
      plan: demoPtDraft?.plan ?? {},
      billing: demoPtDraft?.billing ?? {},
      __savedAt: Date.now(),
      meta: {
        caseId,
        encounterId: encounter,
        professionId: selectedProfession,
        templateId: tpl.id,
        patientId: isRegistry ? patient.id : undefined,
        canonicalPatientId: isRegistry ? patient.id : undefined,
        launchSource: 'unified-funnel',
        patientSource: isRegistry ? 'registry' : 'custom',
      },
    };
  }

  async function launch() {
    if (!hasPatient || !selectedTemplate || submitting) return;
    submitting = true;

    try {
      const tpl = selectedTemplate;
      if (!tpl) return;

      const patient = patientDataForCase();
      const caseObj = buildCaseObj(patient, tpl);
      const wrapper = createCase(caseObj);
      const encounter = encounterForTemplate(tpl);
      const draft = buildDraft(patient, wrapper.id, tpl);
      saveDraft(wrapper.id, encounter, draft);

      await goto(`/workspace/editor?case=${wrapper.id}&encounter=${encounter}`);
    } finally {
      submitting = false;
    }
  }

  async function launchBlank() {
    if (!selectedTemplate || submitting) return;
    submitting = true;

    try {
      const tpl = selectedTemplate;
      if (!tpl) return;

      const setting = tpl.setting
        ? (SETTINGS.find((s) => s.id === tpl.setting)?.label ?? 'Outpatient')
        : 'Outpatient';
      const encounter = encounterForTemplate(tpl);
      const caseObj: CaseObj = {
        title: 'New Note',
        caseTitle: 'New Note',
        patientName: '',
        patientDOB: '',
        patientAge: '',
        patientGender: 'unspecified',
        meta: {
          title: 'New Note',
          patientName: '',
          sex: 'unspecified',
          setting,
          acuity: 'unspecified',
          professionId: selectedProfession,
          templateId: tpl.id,
          patientSource: 'blank',
        },
        snapshot: {},
        history: {},
        encounters: { [encounter]: {} },
        modules: [],
      } as CaseObj;

      const wrapper = createCase(caseObj);
      const draft = {
        noteTitle: 'New Note',
        subjective: {},
        __savedAt: Date.now(),
        meta: {
          caseId: wrapper.id,
          encounterId: encounter,
          professionId: selectedProfession,
          templateId: tpl.id,
          launchSource: 'unified-funnel',
          patientSource: 'blank',
        },
      };
      saveDraft(wrapper.id, encounter, draft);

      await goto(`/workspace/editor?case=${wrapper.id}&encounter=${encounter}`);
    } finally {
      submitting = false;
    }
  }

  function handleCustomPatientSave(fields: Partial<VspRecord>) {
    patientSource = { kind: 'custom', data: fields };
    showCreateForm = false;
  }

  function selectRegistryPatient(patient: VspRecord) {
    patientSource = { kind: 'registry', record: patient };
    search = '';
  }
</script>

<svelte:head>
  <title>Unified Workspace | UND EMR-Sim</title>
</svelte:head>

<section class="workspace">
  <header class="workspace__hero">
    <p class="workspace__eyebrow">Workspace</p>
    <h1>Unified Workspace</h1>
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

  <!-- Step 1: Patient -->
  <div class="workspace__card">
    <div class="workspace__card-header">
      <h2><span class="step-badge">1</span> Patient</h2>
      <div class="workspace__card-actions">
        {#if !showCreateForm && !patientSource}
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            onclick={() => (showCreateForm = true)}
          >
            + New Patient
          </button>
        {/if}
        <a href="/workspace/registry" class="btn btn--ghost btn--sm">Registry</a>
      </div>
    </div>
    <div class="workspace__card-body">
      {#if showCreateForm}
        <div class="custom-patient-form">
          <div class="custom-patient-notice">
            <span class="material-symbols-outlined" aria-hidden="true">info</span>
            <p>
              This patient is for <strong>this note only</strong> and will not be added to the VSP
              Registry. To add a permanent patient, use the
              <a href="/workspace/registry">Registry</a>.
            </p>
          </div>
          <VspPatientForm
            mode="create"
            onSave={handleCustomPatientSave}
            onCancel={() => (showCreateForm = false)}
          />
        </div>
      {:else if patientSource}
        <div class="selected-patient">
          <div class="selected-patient__info">
            <span
              class="selected-patient__badge"
              class:selected-patient__badge--registry={patientSource.kind === 'registry'}
              class:selected-patient__badge--custom={patientSource.kind === 'custom'}
            >
              {patientSource.kind === 'registry' ? 'Registry' : 'Custom'}
            </span>
            <strong>{patientDisplayLabel}</strong>
            {#if patientSource.kind === 'registry' && patientSource.record.dob}
              <span class="selected-patient__meta">DOB: {patientSource.record.dob}</span>
            {/if}
            {#if patientSource.kind === 'registry' && patientSource.record.mrn}
              <span class="selected-patient__meta">MRN: {patientSource.record.mrn}</span>
            {/if}
          </div>
          <button
            type="button"
            class="btn btn--ghost btn--xs"
            onclick={() => {
              patientSource = null;
              search = '';
            }}>Change</button
          >
        </div>
      {:else}
        <div class="patient-search-section">
          <input
            type="search"
            class="search-input"
            placeholder="Search registry patients by name or MRN..."
            bind:value={search}
            aria-label="Search registry patients"
          />

          {#if $isRegistryLoading}
            <p class="workspace__status">Loading registry...</p>
          {:else if search.trim().length > 0 && search.trim().length < 2}
            <p class="workspace__status">Type at least 2 characters to search...</p>
          {:else if search.trim().length >= 2 && searchResults.length === 0}
            <p class="workspace__status">No patients matching &ldquo;{search}&rdquo;</p>
          {:else if searchResults.length > 0}
            <ul class="search-results" role="listbox" aria-label="Patient search results">
              {#each searchResults as patient (patient.id)}
                <li>
                  <button
                    type="button"
                    class="search-result"
                    role="option"
                    aria-selected="false"
                    onclick={() => selectRegistryPatient(patient)}
                  >
                    <span class="search-result__name">{displayName(patient)}</span>
                    <span class="search-result__details">
                      {#if patient.mrn}<span class="search-result__mrn">{patient.mrn}</span>{/if}
                      {#if patient.dob}DOB: {patient.dob}{/if}
                      {#if patient.sex}&middot; {patient.sex}{/if}
                    </span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <!-- Step 2: Mode & Note Template -->
  <div class="workspace__card">
    <div class="workspace__card-header">
      <h2><span class="step-badge">2</span> Note Configuration</h2>
      <span class="workspace__card-meta"
        >{templates.length} template{templates.length !== 1 ? 's' : ''}</span
      >
    </div>
    <div class="workspace__card-body">
      <div class="config-dropdowns">
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
        <div class="form-group">
          <label class="form-group__label" for="setting-select">Setting</label>
          <select id="setting-select" class="form-input" bind:value={selectedSetting}>
            {#each SETTINGS as s}
              <option value={s.id}>{s.label}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label class="form-group__label" for="template-select">Note Template</label>
          {#if templates.length === 0}
            <select id="template-select" class="form-input" disabled>
              <option>No templates available</option>
            </select>
          {:else}
            <select id="template-select" class="form-input" bind:value={selectedTemplateId}>
              {#each templates as tpl}
                <option value={tpl.id}>{tpl.label}</option>
              {/each}
            </select>
          {/if}
        </div>
      </div>

      {#if selectedTemplate}
        <p class="template-description">{selectedTemplate.description}</p>
      {/if}
    </div>
  </div>

  <!-- Launch -->
  <div class="workspace__launch">
    {#if hasPatient && selectedTemplate}
      {@const prof = PROFESSIONS.find((p) => p.id === selectedProfession)}
      <p class="workspace__summary">
        <strong>{patientDisplayLabel}</strong> &middot;
        {prof?.shortLabel ?? selectedProfession} &middot;
        {selectedTemplate.label}
      </p>
    {:else}
      <p class="workspace__hint">Select a patient or start with a blank note.</p>
    {/if}
    <div class="workspace__launch-actions">
      <button
        type="button"
        class="btn btn--secondary btn--lg"
        disabled={submitting || !selectedTemplate}
        onclick={launchBlank}
      >
        {submitting ? 'Opening...' : 'Start Blank Note'}
      </button>
      <button
        type="button"
        class="btn btn--primary btn--lg"
        disabled={!hasPatient || !selectedTemplate || submitting}
        onclick={launch}
      >
        {submitting
          ? 'Opening...'
          : selectedRole === 'student'
            ? 'Open Chart'
            : 'Open Faculty Workspace'}
      </button>
    </div>
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

  /* Search results list */
  .search-results {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 8px;
    max-height: 280px;
    overflow-y: auto;
  }

  .search-results li + li {
    border-top: 1px solid var(--color-neutral-100, #f0f0f0);
  }

  .search-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: var(--color-surface, white);
    cursor: pointer;
    text-align: left;
    transition: background 0.12s;
  }

  .search-result:hover {
    background: rgba(0, 154, 68, 0.05);
  }

  .search-result__name {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .search-result__details {
    font-size: 0.75rem;
    color: var(--color-neutral-500, #737373);
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-result__mrn {
    font-family: monospace;
    font-size: 0.6875rem;
    color: var(--color-neutral-400, #a3a3a3);
  }

  /* Custom patient form wrapper */
  .custom-patient-form {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .custom-patient-notice {
    display: flex;
    gap: 0.625rem;
    align-items: flex-start;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-left: 3px solid var(--color-brand-green, #009a44);
    border-radius: 6px;
    background: rgba(0, 154, 68, 0.04);
    font-size: 0.8125rem;
    color: var(--color-neutral-600, #525252);
    line-height: 1.5;
  }

  .custom-patient-notice .material-symbols-outlined {
    color: var(--color-brand-green, #009a44);
    font-size: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .custom-patient-notice p {
    margin: 0;
  }

  .custom-patient-notice a {
    color: var(--color-brand-green, #009a44);
    font-weight: 600;
  }

  .config-dropdowns {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1rem;
  }

  .template-description {
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #737373);
    font-style: italic;
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

  .workspace__launch-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .btn--lg {
    min-height: 48px;
    padding: 0.625rem 1.5rem;
    font-size: 1rem;
  }

  .btn--secondary {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-700, #404040);
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
  }

  .btn--secondary:hover:not(:disabled) {
    background: var(--color-neutral-200, #e0e0e0);
  }

  .btn--secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 154, 68, 0.06);
    border: 1px solid var(--color-brand-green, #009a44);
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .selected-patient__info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .selected-patient__badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .selected-patient__badge--registry {
    background: rgba(0, 154, 68, 0.15);
    color: #006a2e;
  }

  .selected-patient__badge--custom {
    background: rgba(59, 130, 246, 0.15);
    color: #1e40af;
  }

  .selected-patient__meta {
    color: var(--color-neutral-500, #737373);
    font-size: 0.8125rem;
  }

  /* Patient search section */
  .patient-search-section {
    display: flex;
    flex-direction: column;
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

  @media (max-width: 820px) {
    .config-dropdowns {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 600px) {
    .config-dropdowns {
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

    .workspace__launch-actions {
      flex-direction: column;
      width: 100%;
    }

    .workspace__launch-actions .btn {
      width: 100%;
    }
  }
</style>
