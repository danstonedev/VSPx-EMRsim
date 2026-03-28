<!--
  PatientSummaryPanel — Read-only demographics shown in chart detail panel.
  Ported from app/js/features/navigation/panels/PatientSummaryPanel.js
-->
<script lang="ts">
  import type { CaseObj } from '$lib/store';
  import {
    computeAge,
    displayName,
    allergySummary,
    type VspRecord,
  } from '$lib/services/vspRegistry';

  interface Props {
    caseObj: CaseObj;
    vspPatient?: VspRecord | null;
  }

  let { caseObj, vspPatient = null }: Props = $props();

  const snap = $derived(caseObj?.snapshot ?? {});
  const meta = $derived(caseObj?.meta ?? {});
  const history = $derived(caseObj?.history ?? {});

  // When a VSP patient is resolved, prefer live registry data over stale snapshot
  const patientName = $derived(
    vspPatient ? displayName(vspPatient) : (snap.name ?? 'Unknown Patient'),
  );
  const patientAge = $derived(
    vspPatient
      ? computeAge(vspPatient.dob) != null
        ? String(computeAge(vspPatient.dob))
        : ''
      : (snap.age ?? ''),
  );
  const patientSex = $derived(vspPatient?.sex ?? snap.sex ?? '');
  const patientDob = $derived(vspPatient?.dob ?? snap.dob ?? '');
  const patientMrn = $derived(vspPatient?.mrn ?? snap.mrn ?? '');

  // Identity rows — merge VSP + snapshot
  const identityRows = $derived(
    [
      ['Name', patientName],
      ['DOB', patientDob],
      ['Age', patientAge],
      ['Sex', patientSex],
      ['MRN', patientMrn],
      ['Pronouns', vspPatient?.pronouns ?? snap.pronouns ?? ''],
      ['Language', vspPatient?.preferredLanguage ?? snap.preferredLanguage ?? ''],
    ].filter(([, v]) => v),
  );

  // Encounter rows
  const encounterRows = $derived(
    [
      ['Setting', meta.setting],
      ['Diagnosis', meta.diagnosis],
      ['Acuity', meta.acuity],
    ].filter(([, v]) => v),
  );

  // Clinical — prefer live VSP data, fall back to case history
  const allergies = $derived.by(() => {
    if (vspPatient?.allergies?.length) {
      return vspPatient.allergies.map((a) => {
        const parts = [a.name];
        if (a.severity) parts.push(`(${a.severity})`);
        if (a.reaction) parts.push(`— ${a.reaction}`);
        return parts.join(' ');
      });
    }
    return (history.allergies as string[] | undefined) ?? [];
  });

  const meds = $derived.by(() => {
    if (vspPatient?.activeMedications?.length) {
      return vspPatient.activeMedications.map((m) => {
        const parts = [m.name];
        if (m.dose) parts.push(m.dose);
        if (m.frequency) parts.push(m.frequency);
        if (m.route) parts.push(`(${m.route})`);
        return parts.join(' ');
      });
    }
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

  const chiefComplaint = $derived((history.chief_complaint as string | undefined) ?? '');

  // Additional VSP-only fields
  const emergencyContact = $derived.by(() => {
    if (!vspPatient?.emergencyContactName) return '';
    const parts = [vspPatient.emergencyContactName];
    if (vspPatient.emergencyContactRelationship)
      parts.push(`(${vspPatient.emergencyContactRelationship})`);
    if (vspPatient.emergencyContactPhone) parts.push(`— ${vspPatient.emergencyContactPhone}`);
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
  <!-- Hero section -->
  <section class="patient-summary__hero">
    <h2 class="patient-summary__name">{patientName}</h2>
    {#if snap.teaser}
      <p class="patient-summary__teaser">{snap.teaser}</p>
    {/if}
    <div class="patient-summary__chips">
      {#if patientAge}<span class="chip">{patientAge} y/o</span>{/if}
      {#if patientSex}<span class="chip">{patientSex}</span>{/if}
      {#if meta.setting}<span class="chip">{meta.setting}</span>{/if}
      {#if patientMrn}<span class="chip chip--muted">{patientMrn}</span>{/if}
    </div>
  </section>

  <!-- Identity -->
  {#if identityRows.length > 0}
    <section class="summary-section">
      <h3 class="summary-section__heading">Identity</h3>
      <dl class="kv-list">
        {#each identityRows as [label, value]}
          <div class="kv-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  <!-- Encounter -->
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

  <!-- Chief Complaint -->
  {#if chiefComplaint}
    <section class="summary-section">
      <h3 class="summary-section__heading">Chief Complaint</h3>
      <p class="summary-text">{chiefComplaint}</p>
    </section>
  {/if}

  <!-- Allergies -->
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

  <!-- Medications -->
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

  <!-- PMH -->
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

  <!-- Emergency Contact (VSP only) -->
  {#if emergencyContact}
    <section class="summary-section">
      <h3 class="summary-section__heading">Emergency Contact</h3>
      <p class="summary-text">{emergencyContact}</p>
    </section>
  {/if}

  <!-- Insurance (VSP only) -->
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
  }

  .patient-summary__hero {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-neutral-200, #e5e5e5);
    margin-bottom: 0.75rem;
  }

  .patient-summary__name {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }

  .patient-summary__teaser {
    font-size: 0.8125rem;
    color: var(--color-neutral-600, #525252);
    margin: 0 0 0.5rem;
    line-height: 1.4;
  }

  .patient-summary__chips {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .chip {
    background: var(--color-brand-100, #dcfce7);
    color: var(--color-brand-800, #166534);
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
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

  .chip--muted {
    background: var(--color-neutral-100, #f5f5f5);
    color: var(--color-neutral-600, #525252);
  }
</style>
