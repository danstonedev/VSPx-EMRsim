<!--
  PatientSummaryPanel — Read-only demographics shown in chart detail panel.
  Ported from app/js/features/navigation/panels/PatientSummaryPanel.js
-->
<script lang="ts">
  import type { CaseObj } from '$lib/store';

  interface Props {
    caseObj: CaseObj;
  }

  let { caseObj }: Props = $props();

  const snap = $derived(caseObj?.snapshot ?? {});
  const meta = $derived(caseObj?.meta ?? {});
  const history = $derived(caseObj?.history ?? {});

  // Identity rows
  const identityRows = $derived(
    [
      ['Name', snap.name],
      ['DOB', snap.dob],
      ['Age', snap.age],
      ['Sex', snap.sex],
      ['MRN', snap.mrn],
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

  // Clinical
  const allergies = $derived(history.allergies ?? []);
  const meds = $derived(history.meds ?? []);
  const pmh = $derived(history.pmh ?? []);
  const chiefComplaint = $derived(history.chief_complaint ?? '');
</script>

<div class="patient-summary">
  <!-- Hero section -->
  <section class="patient-summary__hero">
    <h2 class="patient-summary__name">{snap.name ?? 'Unknown Patient'}</h2>
    {#if snap.teaser}
      <p class="patient-summary__teaser">{snap.teaser}</p>
    {/if}
    <div class="patient-summary__chips">
      {#if snap.age}<span class="chip">{snap.age} y/o</span>{/if}
      {#if snap.sex}<span class="chip">{snap.sex}</span>{/if}
      {#if meta.setting}<span class="chip">{meta.setting}</span>{/if}
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
  {#if allergies.length > 0}
    <section class="summary-section">
      <h3 class="summary-section__heading">Allergies</h3>
      <ul class="summary-list">
        {#each allergies as allergy}
          <li>{allergy}</li>
        {/each}
      </ul>
    </section>
  {/if}

  <!-- Medications -->
  {#if meds.length > 0}
    <section class="summary-section">
      <h3 class="summary-section__heading">Medications</h3>
      <ul class="summary-list">
        {#each meds as med}
          <li>{med}</li>
        {/each}
      </ul>
    </section>
  {/if}

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
</style>
