<script lang="ts">
  import { onMount } from 'svelte';
  import {
    vspPatients,
    isRegistryLoading,
    initVspRegistry,
    createPatient,
    updatePatient,
    deletePatient,
    searchRegistryPatients,
  } from '$lib/stores/vspRegistry';
  import {
    displayName,
    computeAge,
    allergySummary,
    type VspRecord,
  } from '$lib/services/vspRegistry';
  import { showToast } from '$lib/components/Toast.svelte';
  import { showConfirmModal } from '$lib/components/ConfirmModal.svelte';
  import VspPatientForm from '$lib/components/VspPatientForm.svelte';

  type ViewMode = 'list' | 'create' | 'edit';

  let view = $state<ViewMode>('list');
  let editingPatient = $state<VspRecord | null>(null);
  let searchQuery = $state('');

  const filteredPatients = $derived.by(() => {
    const query = searchQuery.trim();
    if (!query) return $vspPatients;
    return searchRegistryPatients(query, Math.max($vspPatients.length, 50));
  });

  onMount(() => {
    initVspRegistry();
  });

  function handleCreate(fields: Partial<VspRecord>) {
    createPatient(fields);
    showToast('Patient created', { type: 'success', timeout: 2500 });
    view = 'list';
  }

  function handleEdit(fields: Partial<VspRecord>) {
    if (!editingPatient) return;
    updatePatient(editingPatient.id, fields);
    showToast('Patient updated', { type: 'success', timeout: 2500 });
    editingPatient = null;
    view = 'list';
  }

  function startEdit(patient: VspRecord) {
    editingPatient = patient;
    view = 'edit';
  }

  async function handleDelete(patient: VspRecord) {
    const confirmed = await showConfirmModal({
      title: 'Delete Patient',
      message: `Permanently delete ${displayPatientName(patient)} (VSP #: ${patient.mrn})? This cannot be undone.`,
      confirmText: 'delete',
      danger: true,
    });
    if (!confirmed) return;
    deletePatient(patient.id);
    showToast('Patient deleted', { type: 'info', timeout: 2500 });
  }

  function cancelForm() {
    editingPatient = null;
    view = 'list';
  }

  function displayPatientName(patient: VspRecord): string {
    return displayName(patient) || patient.preferredName || 'Unnamed patient';
  }

  function formatDob(dob: string): string {
    if (!dob) return 'Not listed';
    try {
      return new Date(`${dob}T00:00:00`).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dob;
    }
  }

  function formatSex(sex: VspRecord['sex']): string {
    return sex !== 'unspecified' ? sex.charAt(0).toUpperCase() + sex.slice(1) : 'Unspecified';
  }

  function formatLocation(patient: VspRecord): string {
    return (
      [patient.addressCity, patient.addressState].filter(Boolean).join(', ') ||
      'Location not listed'
    );
  }

  function formatUpdated(timestamp: string): string {
    if (!timestamp) return 'unknown';
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return timestamp;
    }
  }

  function preferredNameLabel(patient: VspRecord): string {
    const preferred = patient.preferredName.trim();
    if (!preferred) return '';
    return preferred.toLowerCase() === patient.firstName.trim().toLowerCase()
      ? ''
      : `Prefers ${preferred}`;
  }

  function diagnoses(patient: VspRecord): string[] {
    return (patient.medicalHistory ?? []).filter(Boolean);
  }

  function visibleDiagnoses(patient: VspRecord, limit = 3): string[] {
    return diagnoses(patient).slice(0, limit);
  }

  function hiddenDiagnosisCount(patient: VspRecord, limit = 3): number {
    return Math.max(diagnoses(patient).length - limit, 0);
  }

  function allergySignal(patient: VspRecord): string {
    const allergies = (patient.allergies ?? []).map((entry) => entry.name).filter(Boolean);
    if (allergies.length === 0) return 'NKDA';
    if (allergies.length === 1) return allergies[0];
    return `${allergies.length} allergies`;
  }

  function medSignal(patient: VspRecord): string {
    const count = patient.activeMedications?.length ?? 0;
    return `${count} med${count === 1 ? '' : 's'}`;
  }

  function surgerySignal(patient: VspRecord): string {
    const count = patient.surgicalHistory?.length ?? 0;
    return `${count} ${count === 1 ? 'surgery' : 'surgeries'}`;
  }
</script>

<svelte:head>
  <title>VSP Registry | UND EMR-Sim</title>
</svelte:head>

<div class="registry-page">
  {#if view === 'create'}
    <VspPatientForm mode="create" onSave={handleCreate} onCancel={cancelForm} />
  {:else if view === 'edit' && editingPatient}
    <VspPatientForm
      mode="edit"
      initial={editingPatient}
      onSave={handleEdit}
      onCancel={cancelForm}
    />
  {:else}
    <div class="registry-header">
      <div class="registry-header__left">
        <div>
          <h1 class="registry-title">VSP Patient Registry</h1>
          <p class="registry-subtitle">
            Searchable case bank for faculty assignment by patient name, VSP #, and multi-D
            diagnoses.
          </p>
        </div>
        <span class="registry-count">
          {$vspPatients.length} patient{$vspPatients.length !== 1 ? 's' : ''}
        </span>
      </div>
      <button
        type="button"
        class="btn btn--primary"
        onclick={() => {
          view = 'create';
        }}
      >
        <span class="material-symbols-outlined btn-icon" aria-hidden="true">person_add</span>
        New Patient
      </button>
    </div>

    <div class="registry-toolbar">
      <div class="registry-search">
        <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
        <input
          type="text"
          class="search-input"
          bind:value={searchQuery}
          placeholder="Search by name, VSP #, or diagnosis..."
          aria-label="Search patients"
        />
        {#if searchQuery}
          <button
            type="button"
            class="search-clear"
            onclick={() => {
              searchQuery = '';
            }}
            aria-label="Clear search"
          >
            x
          </button>
        {/if}
      </div>
      <p class="registry-toolbar__note">
        {#if searchQuery}
          {filteredPatients.length} match{filteredPatients.length !== 1 ? 'es' : ''} for "{searchQuery}"
        {:else}
          Faculty view emphasizes case fit, diagnoses, and assignment-ready context.
        {/if}
      </p>
    </div>

    {#if $isRegistryLoading}
      <div class="registry-empty">
        <span class="material-symbols-outlined empty-icon" aria-hidden="true">hourglass_top</span>
        <p>Loading registry...</p>
      </div>
    {:else if $vspPatients.length === 0}
      <div class="registry-empty">
        <span class="material-symbols-outlined empty-icon" aria-hidden="true">group_off</span>
        <p>No patients in the registry yet.</p>
        <button
          type="button"
          class="btn btn--primary"
          onclick={() => {
            view = 'create';
          }}
        >
          Create First Patient
        </button>
      </div>
    {:else if filteredPatients.length === 0}
      <div class="registry-empty">
        <span class="material-symbols-outlined empty-icon" aria-hidden="true">search_off</span>
        <p>No patients match "<strong>{searchQuery}</strong>"</p>
        <p class="registry-empty__hint">
          Try a name, VSP #, or diagnosis like "COPD" or "diabetes".
        </p>
        <button
          type="button"
          class="btn btn--ghost"
          onclick={() => {
            searchQuery = '';
          }}
        >
          Clear search
        </button>
      </div>
    {:else}
      <div class="registry-table-shell">
        <table class="registry-table">
          <thead>
            <tr>
              <th scope="col">Patient</th>
              <th scope="col">VSP #</th>
              <th scope="col">Profile</th>
              <th scope="col">Multi-D Diagnoses</th>
              <th scope="col">Case Signals</th>
              <th scope="col" class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPatients as patient (patient.id)}
              {@const age = computeAge(patient.dob)}
              {@const patientName = displayPatientName(patient)}
              {@const alias = preferredNameLabel(patient)}
              {@const diagnosisPreview = visibleDiagnoses(patient)}
              {@const remainingDiagnoses = hiddenDiagnosisCount(patient)}
              <tr>
                <td data-label="Patient">
                  <div class="patient-cell">
                    <div class="patient-cell__primary">
                      <span class="patient-name">{patientName}</span>
                      {#if alias}
                        <span class="patient-alias">{alias}</span>
                      {/if}
                    </div>
                    <div class="patient-cell__secondary">
                      {#if patient.pronouns}
                        <span>{patient.pronouns}</span>
                      {/if}
                      <span>{formatLocation(patient)}</span>
                    </div>
                  </div>
                </td>
                <td data-label="VSP #">
                  <div class="mrn-cell">
                    <code class="mrn-code">{patient.mrn}</code>
                    <span class="cell-note">Updated {formatUpdated(patient.updatedAt)}</span>
                  </div>
                </td>
                <td data-label="Profile">
                  <div class="profile-cell">
                    <span
                      >{age != null ? `${age} yo` : 'Age unavailable'} / {formatSex(
                        patient.sex,
                      )}</span
                    >
                    <span class="cell-note">DOB {formatDob(patient.dob)}</span>
                    <span class="cell-note">
                      {patient.preferredLanguage || 'Language not listed'}
                      {patient.interpreterNeeded ? ' / Interpreter needed' : ''}
                    </span>
                  </div>
                </td>
                <td data-label="Multi-D Diagnoses">
                  {#if diagnosisPreview.length > 0}
                    <div class="chip-wrap">
                      {#each diagnosisPreview as diagnosis}
                        <span class="chip chip--diagnosis">{diagnosis}</span>
                      {/each}
                      {#if remainingDiagnoses > 0}
                        <span class="chip chip--muted">+{remainingDiagnoses} more</span>
                      {/if}
                    </div>
                  {:else}
                    <span class="cell-note">No diagnoses listed</span>
                  {/if}
                </td>
                <td data-label="Case Signals">
                  <div class="chip-wrap chip-wrap--tight">
                    <span class="chip chip--signal">{patient.codeStatus}</span>
                    <span class="chip chip--signal">{medSignal(patient)}</span>
                    <span class="chip chip--signal">{allergySignal(patient)}</span>
                    {#if (patient.surgicalHistory?.length ?? 0) > 0}
                      <span class="chip chip--signal">{surgerySignal(patient)}</span>
                    {/if}
                  </div>
                  <div class="cell-note">{allergySummary(patient)}</div>
                </td>
                <td data-label="Actions">
                  <div class="patient-actions">
                    <button
                      type="button"
                      class="btn btn--sm btn--ghost"
                      onclick={() => startEdit(patient)}
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                      Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn--sm btn--danger-ghost"
                      onclick={() => handleDelete(patient)}
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
</div>

<style>
  .registry-page {
    max-width: 1320px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  .registry-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .registry-header__left {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .registry-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-neutral-800, #262626);
  }

  .registry-subtitle {
    margin: 0.4rem 0 0;
    max-width: 52rem;
    color: var(--color-neutral-600, #525252);
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .registry-count {
    display: inline-flex;
    align-items: center;
    min-height: 2.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #f1f5f9, #f8fafc);
    border: 1px solid #dbe3ec;
    font-size: 0.8125rem;
    color: var(--color-neutral-600, #525252);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }

  .btn--primary {
    background: var(--color-brand-green, #009a44);
    color: white;
  }

  .btn--primary:hover {
    background: #007a35;
  }

  .btn--ghost {
    background: transparent;
    color: var(--color-neutral-600, #525252);
  }

  .btn--ghost:hover {
    background: var(--color-neutral-100, #f0f0f0);
  }

  .btn--sm {
    padding: 0.3125rem 0.625rem;
    font-size: 0.8125rem;
  }

  .btn--danger-ghost {
    background: transparent;
    color: var(--color-neutral-500, #737373);
  }

  .btn--danger-ghost:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  .btn-icon {
    font-size: 1.125rem;
  }

  .registry-toolbar {
    display: grid;
    grid-template-columns: minmax(320px, 1.4fr) minmax(220px, 1fr);
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .registry-search {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.25rem;
    color: var(--color-neutral-400, #a3a3a3);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 2.4rem 0.75rem 2.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 10px;
    font-size: 0.9rem;
    color: var(--color-neutral-800, #262626);
    background: var(--color-surface, #ffffff);
  }

  .search-input:focus {
    outline: 2px solid var(--color-brand-green, #009a44);
    outline-offset: 1px;
  }

  .search-clear {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-neutral-400, #a3a3a3);
    padding: 0.25rem;
    border-radius: 4px;
    line-height: 1;
  }

  .search-clear:hover {
    color: var(--color-neutral-700, #404040);
    background: var(--color-neutral-100, #f0f0f0);
  }

  .registry-toolbar__note {
    margin: 0;
    color: var(--color-neutral-600, #525252);
    font-size: 0.875rem;
    line-height: 1.45;
  }

  .registry-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-neutral-500, #737373);
  }

  .empty-icon {
    font-size: 3rem;
    color: var(--color-neutral-300, #d4d4d4);
    display: block;
    margin-bottom: 0.75rem;
  }

  .registry-empty p {
    margin: 0 0 1rem;
    font-size: 0.9375rem;
  }

  .registry-empty__hint {
    color: var(--color-neutral-500, #737373);
    margin-top: -0.25rem;
  }

  .registry-table-shell {
    overflow-x: auto;
    border-radius: 18px;
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    background:
      linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.98)),
      var(--color-surface, #ffffff);
    box-shadow: 0 16px 38px rgba(15, 23, 42, 0.06);
  }

  .registry-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1080px;
  }

  .registry-table th,
  .registry-table td {
    padding: 1rem;
    border-bottom: 1px solid #e8edf3;
    vertical-align: top;
  }

  .registry-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(248, 250, 252, 0.98);
    text-align: left;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-neutral-500, #737373);
  }

  .registry-table tbody tr:hover {
    background: rgba(241, 245, 249, 0.65);
  }

  .registry-table tbody tr:last-child td {
    border-bottom: none;
  }

  .patient-cell,
  .mrn-cell,
  .profile-cell {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .patient-cell__primary,
  .patient-cell__secondary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.75rem;
    align-items: center;
  }

  .patient-name {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-neutral-900, #171717);
  }

  .patient-alias,
  .cell-note,
  .patient-cell__secondary {
    color: var(--color-neutral-500, #737373);
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  .mrn-code {
    display: inline-block;
    width: fit-content;
    padding: 0.2rem 0.45rem;
    border-radius: 0.45rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .chip-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .chip-wrap--tight {
    margin-bottom: 0.45rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 1.9rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.78rem;
    line-height: 1.25;
  }

  .chip--diagnosis {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }

  .chip--signal {
    background: #f8fafc;
    border: 1px solid #dbe3ec;
    color: #334155;
  }

  .chip--muted {
    background: #fafaf9;
    border: 1px solid #e7e5e4;
    color: #57534e;
  }

  .actions-heading {
    text-align: right;
  }

  .patient-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .patient-actions .material-symbols-outlined {
    font-size: 1rem;
    vertical-align: text-bottom;
  }

  @media (max-width: 980px) {
    .registry-toolbar {
      grid-template-columns: 1fr;
    }

    .registry-table {
      min-width: 0;
    }

    .registry-table thead {
      display: none;
    }

    .registry-table,
    .registry-table tbody,
    .registry-table tr,
    .registry-table td {
      display: block;
      width: 100%;
    }

    .registry-table tbody {
      padding: 0.5rem;
    }

    .registry-table tr {
      margin-bottom: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      background: #ffffff;
      overflow: hidden;
    }

    .registry-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #eef2f7;
    }

    .registry-table td:last-child {
      border-bottom: none;
    }

    .registry-table td::before {
      content: attr(data-label);
      display: block;
      margin-bottom: 0.4rem;
      font-size: 0.73rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-neutral-500, #737373);
    }

    .patient-actions {
      justify-content: flex-start;
    }
  }

  @media (max-width: 640px) {
    .registry-page {
      padding: 1rem;
    }

    .registry-header__left {
      align-items: flex-start;
    }

    .registry-title {
      font-size: 1.35rem;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }

    .patient-actions .btn {
      width: auto;
    }
  }
</style>
