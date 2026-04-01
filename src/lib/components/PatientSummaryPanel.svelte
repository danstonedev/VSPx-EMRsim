<!--
  PatientSummaryPanel — patient profile tab content.
  Uses a single profile surface: editable for custom cases, read-only for VSP-linked cases.
-->
<script lang="ts">
  import PatientProfileFields from './PatientProfileFields.svelte';
  import { noteDraft } from '$lib/stores/noteSession';
  import type { CaseObj } from '$lib/store';
  import type { VspRecord } from '$lib/services/vspRegistry';

  interface Props {
    caseObj: CaseObj;
    vspPatient?: VspRecord | null;
  }

  let { caseObj, vspPatient = null }: Props = $props();

  const meta = $derived(caseObj?.meta ?? {});
  const history = $derived(caseObj?.history ?? {});
  const subjective = $derived($noteDraft.subjective ?? {});
  const isRegistryLinked = $derived.by(() => {
    const vspId = String(caseObj?.meta?.vspId ?? caseObj?.vspId ?? '').trim();
    return !!vspPatient || vspId.length > 0;
  });

  const encounterRows = $derived(
    [
      ['Setting', meta.setting],
      ['Diagnosis', meta.diagnosis],
      ['Acuity', meta.acuity],
    ].filter(([, value]) => value),
  );

  const allergies = $derived.by(() => {
    if (vspPatient?.allergies?.length) {
      return vspPatient.allergies.map((allergy) => {
        const parts = [allergy.name];
        if (allergy.severity) parts.push(`(${allergy.severity})`);
        if (allergy.reaction) parts.push(`- ${allergy.reaction}`);
        return parts.join(' ');
      });
    }
    return (history.allergies as string[] | undefined) ?? [];
  });

  const meds = $derived.by(() => {
    // Primary: structured medications from the active note draft (MedicationPanel)
    const draftMeds = subjective.medications;
    if (Array.isArray(draftMeds) && draftMeds.length > 0) {
      return draftMeds.map((m: { name: string; dose?: string; frequency?: string }) => {
        const parts = [m.name];
        if (m.dose) parts.push(m.dose);
        if (m.frequency) parts.push(m.frequency);
        return parts.join(' ');
      });
    }
    // Fallback: VSP registry patient record
    if (vspPatient?.activeMedications?.length) {
      return vspPatient.activeMedications.map((medication) => {
        const parts = [medication.name];
        if (medication.dose) parts.push(medication.dose);
        if (medication.frequency) parts.push(medication.frequency);
        if (medication.route) parts.push(`(${medication.route})`);
        return parts.join(' ');
      });
    }
    // Fallback: case history strings
    return (history.meds as string[] | undefined) ?? [];
  });

  const pmh = $derived.by(() => {
    if (vspPatient) {
      return [...(vspPatient.medicalHistory ?? []), ...(vspPatient.surgicalHistory ?? [])].filter(
        Boolean,
      );
    }
    return (history.pmh as string[] | undefined) ?? [];
  });

  const chiefComplaint = $derived(
    subjective.chiefComplaint ?? (history.chief_complaint as string | undefined) ?? '',
  );

  const emergencyContact = $derived.by(() => {
    if (!vspPatient?.emergencyContactName) return '';
    const parts = [vspPatient.emergencyContactName];
    if (vspPatient.emergencyContactRelationship) {
      parts.push(`(${vspPatient.emergencyContactRelationship})`);
    }
    if (vspPatient.emergencyContactPhone) parts.push(`- ${vspPatient.emergencyContactPhone}`);
    return parts.join(' ');
  });

  const insurance = $derived.by(() => {
    if (!vspPatient?.insuranceProvider) return '';
    const parts = [vspPatient.insuranceProvider];
    if (vspPatient.insurancePolicyNumber) parts.push(`#${vspPatient.insurancePolicyNumber}`);
    return parts.join(' ');
  });
</script>

<div class="patient-summary">
  <PatientProfileFields {caseObj} {vspPatient} readonly={isRegistryLinked} />

  {#if encounterRows.length > 0}
    <section class="summary-section">
      <h3 class="summary-section__heading">Encounter</h3>
      <dl class="kv-list">
        {#each encounterRows as [label, value]}
          <div class="kv-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  {#if chiefComplaint}
    <section class="summary-section">
      <h3 class="summary-section__heading">Chief Complaint</h3>
      <p class="summary-text">{chiefComplaint}</p>
    </section>
  {/if}

  <section class="summary-section">
    <h3 class="summary-section__heading">Allergies</h3>
    {#if allergies.length > 0}
      <ul class="summary-list">
        {#each allergies as allergy}
          <li>{allergy}</li>
        {/each}
      </ul>
    {:else}
      <p class="summary-text summary-text--muted">NKDA (No Known Drug Allergies)</p>
    {/if}
  </section>

  <section class="summary-section">
    <h3 class="summary-section__heading">Medications</h3>
    {#if meds.length > 0}
      <ul class="summary-list">
        {#each meds as med}
          <li>{med}</li>
        {/each}
      </ul>
    {:else}
      <p class="summary-text summary-text--muted">None documented</p>
    {/if}
  </section>

  {#if pmh.length > 0}
    <section class="summary-section">
      <h3 class="summary-section__heading">Medical History</h3>
      <ul class="summary-list">
        {#each pmh as item}
          <li>{item}</li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if emergencyContact}
    <section class="summary-section">
      <h3 class="summary-section__heading">Emergency Contact</h3>
      <p class="summary-text">{emergencyContact}</p>
    </section>
  {/if}

  {#if insurance}
    <section class="summary-section">
      <h3 class="summary-section__heading">Insurance</h3>
      <p class="summary-text">{insurance}</p>
    </section>
  {/if}
</div>

<style>
  .patient-summary {
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .summary-section {
    margin-bottom: 0.75rem;
  }

  .summary-section__heading {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-neutral-500, #737373);
    margin: 0 0 0.375rem;
  }

  .kv-list {
    margin: 0;
  }

  .kv-row {
    display: flex;
    gap: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .kv-row dt {
    flex-shrink: 0;
    width: 5rem;
    font-weight: 500;
    color: var(--color-neutral-600, #525252);
    font-size: 0.8125rem;
  }

  .kv-row dd {
    margin: 0;
    font-size: 0.8125rem;
  }

  .summary-text {
    margin: 0;
    line-height: 1.5;
  }

  .summary-list {
    margin: 0;
    padding-left: 1.25rem;
  }

  .summary-list li {
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }

  .summary-text--muted {
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
  }
</style>
