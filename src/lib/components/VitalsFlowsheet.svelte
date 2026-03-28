<!--
  VitalsFlowsheet — multi-measurement vitals tracker.
  Renders a flowsheet table: rows = vital parameters, columns = time-stamped checkpoints.
  Users can add/remove measurement columns and record vitals at different times.
  Ported from app/js/features/soap/objective/ObjectiveSection.js buildVitalsSection()
-->
<script lang="ts">
  import type { VitalsRecord, VitalsEntry } from '$lib/types/sections';

  interface Props {
    series: VitalsEntry[];
    activeId: string;
    onUpdate: (series: VitalsEntry[], activeId: string) => void;
  }

  let { series, activeId, onUpdate }: Props = $props();

  // ── ID generation ──

  function genId(): string {
    return `vs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // ── Row definitions ──

  interface VitalRow {
    key: string;
    label: string;
    unit: string;
    isBp?: boolean;
    placeholder?: string;
  }

  const VITAL_ROWS: VitalRow[] = [
    { key: 'bp', label: 'Blood Pressure', unit: 'mmHg', isBp: true },
    { key: 'hr', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
    { key: 'rr', label: 'Resp. Rate', unit: 'br/min', placeholder: '16' },
    { key: 'spo2', label: 'SpO₂', unit: '%', placeholder: '98' },
    { key: 'temperature', label: 'Temperature', unit: '°F', placeholder: '98.6' },
    { key: 'pain', label: 'Pain (0–10)', unit: '', placeholder: '0' },
  ];

  // ── Actions ──

  function addColumn() {
    const entry: VitalsEntry = {
      id: genId(),
      label: '',
      time: '',
      vitals: {},
    };
    onUpdate([...series, entry], entry.id);
  }

  function removeColumn(entryId: string) {
    if (series.length <= 1) return;
    const next = series.filter((e) => e.id !== entryId);
    const nextActiveId = next.some((e) => e.id === activeId) ? activeId : next[0].id;
    onUpdate(next, nextActiveId);
  }

  function updateLabel(entryId: string, value: string) {
    const next = series.map((e) => (e.id === entryId ? { ...e, label: value } : e));
    onUpdate(next, entryId);
  }

  function updateVitalField(entryId: string, field: keyof VitalsRecord, value: string) {
    const next = series.map((e) =>
      e.id === entryId ? { ...e, vitals: { ...e.vitals, [field]: value } } : e,
    );
    onUpdate(next, entryId);
  }

  function getVital(entry: VitalsEntry, field: keyof VitalsRecord): string {
    return entry.vitals[field] ?? '';
  }

  function columnLabel(entry: VitalsEntry, index: number): string {
    return entry.label || `Measurement ${index + 1}`;
  }
</script>

<div class="vf-wrap">
  <div class="ct-wrap">
    <table class="ct-table vf-table">
      <thead>
        <tr>
          <th class="ct-th ct-th--region vf-param-col">VITALS</th>
          {#each series as entry, idx (entry.id)}
            <th class="ct-th vf-col-th">
              <div class="vf-col-header">
                <input
                  class="vf-col-label"
                  type="text"
                  placeholder="Measurement {idx + 1}"
                  value={entry.label}
                  onfocus={(e) => (e.target as HTMLInputElement).select()}
                  onblur={(e) => updateLabel(entry.id, (e.target as HTMLInputElement).value)}
                />
                {#if series.length > 1}
                  <button
                    type="button"
                    class="vf-col-del"
                    aria-label="Remove {columnLabel(entry, idx)}"
                    onclick={() => removeColumn(entry.id)}>&times;</button
                  >
                {/if}
              </div>
            </th>
          {/each}
          <th class="ct-th vf-add-th">
            <button
              type="button"
              class="ct-btn-add vf-add-btn"
              aria-label="Add measurement column"
              onclick={addColumn}>+</button
            >
          </th>
        </tr>
      </thead>
      <tbody>
        {#each VITAL_ROWS as row}
          <tr class="ct-row">
            <td class="ct-td ct-td--label vf-param-col">
              <span class="vf-param-name">{row.label}</span>
              {#if row.unit}<span class="vf-param-unit">{row.unit}</span>{/if}
            </td>
            {#each series as entry (entry.id)}
              <td class="ct-td vf-val-td">
                {#if row.isBp}
                  <div class="vf-bp">
                    <input
                      class="ct-input vf-input vf-input--bp"
                      type="text"
                      inputmode="numeric"
                      placeholder="Sys"
                      aria-label="Systolic blood pressure"
                      value={getVital(entry, 'bpSystolic')}
                      onblur={(e) =>
                        updateVitalField(
                          entry.id,
                          'bpSystolic',
                          (e.target as HTMLInputElement).value,
                        )}
                    />
                    <span class="vf-bp-slash" aria-hidden="true">/</span>
                    <input
                      class="ct-input vf-input vf-input--bp"
                      type="text"
                      inputmode="numeric"
                      placeholder="Dia"
                      aria-label="Diastolic blood pressure"
                      value={getVital(entry, 'bpDiastolic')}
                      onblur={(e) =>
                        updateVitalField(
                          entry.id,
                          'bpDiastolic',
                          (e.target as HTMLInputElement).value,
                        )}
                    />
                  </div>
                {:else}
                  <input
                    class="ct-input vf-input"
                    type="text"
                    inputmode="numeric"
                    placeholder={row.placeholder ?? ''}
                    value={getVital(entry, row.key as keyof VitalsRecord)}
                    onblur={(e) =>
                      updateVitalField(
                        entry.id,
                        row.key as keyof VitalsRecord,
                        (e.target as HTMLInputElement).value,
                      )}
                  />
                {/if}
              </td>
            {/each}
            <td class="ct-td vf-add-spacer"></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  /* ─── Container ─── */

  .vf-wrap {
    width: 100%;
    border: 2px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 6px;
    overflow: hidden;
  }

  /* Table overrides (ct-table handles border-collapse, border-spacing, border, shadow) */
  .vf-table {
    min-width: 380px;
    table-layout: auto;
  }

  /* ─── Header ─── */

  .vf-param-col {
    width: 130px;
    min-width: 100px;
    padding-left: 0.75rem;
  }

  .vf-col-th {
    min-width: 140px;
  }

  .vf-col-header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .vf-col-label {
    flex: 1;
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
    text-align: center;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .vf-col-label::placeholder {
    color: rgba(255, 255, 255, 0.45);
    font-weight: 500;
  }

  .vf-col-label:focus {
    outline: none;
    border-color: var(--color-brand-green, #009a44);
    background: rgba(255, 255, 255, 0.15);
  }

  .vf-col-del {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border: none;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .vf-col-del:hover {
    background: #dc2626;
    color: #ffffff;
  }

  .vf-add-th {
    width: 2.75rem;
    text-align: center;
  }

  /* Size override: ct-btn-add is 1.75rem, this component uses 2rem */
  .vf-add-btn {
    width: 2rem;
    height: 2rem;
  }

  /* ─── Body ─── */

  /* Zebra striping via ct-row--alt alternative: nth-child approach */
  .vf-table tbody tr:nth-child(even) td {
    background: var(--ct-row-alt);
  }

  .vf-param-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-neutral-800, #333333);
    display: block;
    line-height: 1.2;
  }

  .vf-param-unit {
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--color-neutral-400, #9e9e9e);
    text-transform: lowercase;
  }

  .vf-val-td {
    min-width: 140px;
  }

  /* ─── Inputs ─── */

  .vf-input {
    width: 100%;
    max-width: 72px;
    margin: 0 auto;
    text-align: center;
  }

  .vf-input::placeholder {
    color: var(--color-neutral-400, #a3a3a3);
    font-weight: 400;
  }

  .vf-input--bp {
    max-width: 52px;
  }

  /* BP split pair */
  .vf-bp {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .vf-bp-slash {
    font-weight: 700;
    color: var(--color-neutral-500, #757575);
    font-size: 0.9375rem;
    flex-shrink: 0;
  }

  .vf-add-spacer {
    width: 2.75rem;
  }

  @media (max-width: 640px) {
    .vf-col-th {
      min-width: 115px;
    }
    .vf-param-col {
      width: 85px;
      min-width: 85px;
    }
  }
</style>
