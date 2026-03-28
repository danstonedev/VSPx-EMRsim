<!--
  VSP Patient Registry — faculty management view for Virtual Standardized Patients.
  Supports list, search/filter, create, edit, and delete.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import {
    vspPatients,
    isRegistryLoading,
    initVspRegistry,
    createPatient,
    updatePatient,
    deletePatient,
  } from '$lib/stores/vspRegistry';
  import {
    displayName,
    computeAge,
    patientSummary,
    allergySummary,
    type VspRecord,
  } from '$lib/services/vspRegistry';
  import { showToast } from '$lib/components/Toast.svelte';
  import { showConfirmModal } from '$lib/components/ConfirmModal.svelte';
  import VspPatientForm from '$lib/components/VspPatientForm.svelte';

  // ─── View state ──────────────────────────────────────────────────
  type ViewMode = 'list' | 'create' | 'edit';
  let view = $state<ViewMode>('list');
  let editingPatient = $state<VspRecord | null>(null);
  let searchQuery = $state('');

  // ─── Derived data ────────────────────────────────────────────────
  const filteredPatients = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return $vspPatients;
    return $vspPatients.filter((p) => {
      const name = displayName(p).toLowerCase();
      const mrn = p.mrn.toLowerCase();
      return name.includes(q) || mrn.includes(q);
    });
  });

  // ─── Lifecycle ───────────────────────────────────────────────────
  onMount(() => {
    initVspRegistry();
  });

  // ─── Actions ─────────────────────────────────────────────────────
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
      message: `Permanently delete ${displayName(patient)} (MRN: ${patient.mrn})? This cannot be undone.`,
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

  function formatDob(dob: string): string {
    if (!dob) return '—';
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
    <!-- List view -->
    <div class="registry-header">
      <div class="registry-header__left">
        <h1 class="registry-title">VSP Patient Registry</h1>
        <span class="registry-count"
          >{$vspPatients.length} patient{$vspPatients.length !== 1 ? 's' : ''}</span
        >
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

    <!-- Search -->
    <div class="registry-search">
      <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
      <input
        type="text"
        class="search-input"
        bind:value={searchQuery}
        placeholder="Search by name or MRN..."
        aria-label="Search patients"
      />
      {#if searchQuery}
        <button
          type="button"
          class="search-clear"
          onclick={() => {
            searchQuery = '';
          }}
          aria-label="Clear search">✕</button
        >
      {/if}
    </div>

    <!-- Loading state -->
    {#if $isRegistryLoading}
      <div class="registry-empty">
        <span class="material-symbols-outlined empty-icon" aria-hidden="true">hourglass_top</span>
        <p>Loading registry...</p>
      </div>
    {:else if filteredPatients.length === 0}
      <!-- Empty state -->
      <div class="registry-empty">
        {#if searchQuery}
          <span class="material-symbols-outlined empty-icon" aria-hidden="true">search_off</span>
          <p>No patients match "<strong>{searchQuery}</strong>"</p>
          <button
            type="button"
            class="btn btn--ghost"
            onclick={() => {
              searchQuery = '';
            }}
          >
            Clear search
          </button>
        {:else}
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
        {/if}
      </div>
    {:else}
      <!-- Patient cards -->
      <div class="patient-grid">
        {#each filteredPatients as patient (patient.id)}
          {@const age = computeAge(patient.dob)}
          <div class="patient-card" role="article" aria-label={displayName(patient)}>
            <div class="patient-card__header">
              <span class="patient-card__name">{displayName(patient)}</span>
              <span class="patient-card__mrn">{patient.mrn}</span>
            </div>
            <div class="patient-card__details">
              <div class="detail-row">
                <span class="detail-label">DOB</span>
                <span>{formatDob(patient.dob)}{age != null ? ` (${age} yo)` : ''}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Sex</span>
                <span
                  >{patient.sex !== 'unspecified'
                    ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)
                    : '—'}</span
                >
              </div>
              {#if patient.pronouns}
                <div class="detail-row">
                  <span class="detail-label">Pronouns</span>
                  <span>{patient.pronouns}</span>
                </div>
              {/if}
              <div class="detail-row">
                <span class="detail-label">Allergies</span>
                <span>{allergySummary(patient)}</span>
              </div>
              {#if patient.primaryCareProvider}
                <div class="detail-row">
                  <span class="detail-label">PCP</span>
                  <span>{patient.primaryCareProvider}</span>
                </div>
              {/if}
              {#if patient.phone}
                <div class="detail-row">
                  <span class="detail-label">Phone</span>
                  <span>{patient.phone}</span>
                </div>
              {/if}
            </div>
            <div class="patient-card__actions">
              <button
                type="button"
                class="btn btn--sm btn--ghost"
                onclick={() => startEdit(patient)}
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span> Edit
              </button>
              <button
                type="button"
                class="btn btn--sm btn--danger-ghost"
                onclick={() => handleDelete(patient)}
              >
                <span class="material-symbols-outlined" aria-hidden="true">delete</span> Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .registry-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  /* ─── Header ───────────────────────────────────── */
  .registry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .registry-header__left {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .registry-title {
    font-size: 1.375rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-neutral-800, #262626);
  }

  .registry-count {
    font-size: 0.8125rem;
    color: var(--color-neutral-500, #737373);
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

  /* ─── Search ───────────────────────────────────── */
  .registry-search {
    position: relative;
    margin-bottom: 1.25rem;
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
    padding: 0.625rem 2.25rem 0.625rem 2.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 8px;
    font-size: 0.875rem;
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

  /* ─── Empty / Loading ──────────────────────────── */
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

  /* ─── Patient Grid ─────────────────────────────── */
  .patient-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .patient-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 10px;
    overflow: hidden;
    transition: box-shadow 0.15s;
  }

  .patient-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .patient-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.875rem 1rem 0.5rem;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .patient-card__name {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-neutral-800, #262626);
  }

  .patient-card__mrn {
    font-size: 0.75rem;
    font-family: monospace;
    color: var(--color-neutral-400, #a3a3a3);
  }

  .patient-card__details {
    padding: 0.625rem 1rem;
  }

  .detail-row {
    display: flex;
    gap: 0.5rem;
    padding: 0.1875rem 0;
    font-size: 0.8125rem;
    color: var(--color-neutral-700, #404040);
  }

  .detail-label {
    font-weight: 600;
    min-width: 4.5rem;
    color: var(--color-neutral-500, #737373);
    flex-shrink: 0;
  }

  .patient-card__actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem 0.75rem;
    border-top: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .patient-card__actions .material-symbols-outlined {
    font-size: 1rem;
    vertical-align: text-bottom;
  }
</style>
