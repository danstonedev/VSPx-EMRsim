<!--
  BillingSection — editable billing SOAP fields.
  ICD-10 diagnosis codes, CPT billing codes, orders/referrals.
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';

  const section = $derived($noteDraft.billing);

  // Diagnosis codes
  type DiagCode = {
    code: string;
    description: string;
    label: string;
    isPrimary: boolean;
  };

  const diagnosisCodes = $derived((section.diagnosisCodes as DiagCode[]) ?? []);

  function onDiagInput(idx: number, field_name: keyof DiagCode, e: Event) {
    const val = (e.target as HTMLInputElement).value;
    const updated = [...diagnosisCodes];
    updated[idx] = { ...updated[idx], [field_name]: val };
    // Auto-build label from code + description
    if (field_name === 'code' || field_name === 'description') {
      updated[idx].label = `${updated[idx].code} – ${updated[idx].description}`;
    }
    updateField('billing', 'diagnosisCodes', updated);
  }

  function togglePrimary(idx: number) {
    const updated = diagnosisCodes.map((d, i) => ({
      ...d,
      isPrimary: i === idx,
    }));
    updateField('billing', 'diagnosisCodes', updated);
  }

  function addDiagnosis() {
    const updated = [
      ...diagnosisCodes,
      { code: '', description: '', label: '', isPrimary: diagnosisCodes.length === 0 },
    ];
    updateField('billing', 'diagnosisCodes', updated);
  }

  function removeDiagnosis(idx: number) {
    const updated = diagnosisCodes.filter((_, i) => i !== idx);
    // Ensure at least one is primary
    if (updated.length > 0 && !updated.some((d) => d.isPrimary)) {
      updated[0].isPrimary = true;
    }
    updateField('billing', 'diagnosisCodes', updated);
  }

  // Billing codes (CPT)
  type BillCode = {
    code: string;
    description: string;
    label: string;
    units: number;
    timeSpent: string;
  };

  const billingCodes = $derived((section.billingCodes as BillCode[]) ?? []);

  function onBillInput(idx: number, field_name: keyof BillCode, e: Event) {
    const target = e.target as HTMLInputElement;
    const val = field_name === 'units' ? parseInt(target.value) || 0 : target.value;
    const updated = [...billingCodes];
    updated[idx] = { ...updated[idx], [field_name]: val };
    if (field_name === 'code' || field_name === 'description') {
      updated[idx].label = `${updated[idx].code} – ${updated[idx].description}`;
    }
    updateField('billing', 'billingCodes', updated);
  }

  function addBillingCode() {
    const updated = [
      ...billingCodes,
      { code: '', description: '', label: '', units: 1, timeSpent: '' },
    ];
    updateField('billing', 'billingCodes', updated);
  }

  function removeBillingCode(idx: number) {
    updateField(
      'billing',
      'billingCodes',
      billingCodes.filter((_, i) => i !== idx),
    );
  }

  // Orders / Referrals (simple text)
  function field(key: string): string {
    return (section[key] as string) ?? '';
  }

  function onInput(key: string, e: Event) {
    updateField('billing', key, (e.target as HTMLTextAreaElement).value);
  }
</script>

<div class="soap-section soap-billing">
  <fieldset class="soap-fieldset">
    <legend>ICD-10 Diagnosis Codes</legend>
    {#if diagnosisCodes.length > 0}
      <table class="code-table">
        <thead>
          <tr>
            <th class="col-primary">Primary</th>
            <th class="col-code">Code</th>
            <th>Description</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          {#each diagnosisCodes as diag, i}
            <tr>
              <td class="col-primary">
                <input
                  type="radio"
                  name="primary-dx"
                  checked={diag.isPrimary}
                  onchange={() => togglePrimary(i)}
                />
              </td>
              <td class="col-code">
                <input
                  type="text"
                  value={diag.code}
                  oninput={(e) => onDiagInput(i, 'code', e)}
                  placeholder="M75.41"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={diag.description}
                  oninput={(e) => onDiagInput(i, 'description', e)}
                  placeholder="Impingement syndrome, right shoulder"
                />
              </td>
              <td class="col-action">
                <button
                  type="button"
                  class="btn-remove"
                  onclick={() => removeDiagnosis(i)}
                  aria-label="Remove diagnosis {i + 1}">×</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="empty-hint">No diagnosis codes added yet.</p>
    {/if}
    <button type="button" class="btn-add" onclick={addDiagnosis}>+ Add Diagnosis Code</button>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>CPT Billing Codes</legend>
    {#if billingCodes.length > 0}
      <table class="code-table">
        <thead>
          <tr>
            <th class="col-code">Code</th>
            <th>Description</th>
            <th class="col-units">Units</th>
            <th class="col-time">Time</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          {#each billingCodes as bill, i}
            <tr>
              <td class="col-code">
                <input
                  type="text"
                  value={bill.code}
                  oninput={(e) => onBillInput(i, 'code', e)}
                  placeholder="97110"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={bill.description}
                  oninput={(e) => onBillInput(i, 'description', e)}
                  placeholder="Therapeutic Exercise"
                />
              </td>
              <td class="col-units">
                <input
                  type="number"
                  min="1"
                  value={bill.units}
                  oninput={(e) => onBillInput(i, 'units', e)}
                />
              </td>
              <td class="col-time">
                <input
                  type="text"
                  value={bill.timeSpent}
                  oninput={(e) => onBillInput(i, 'timeSpent', e)}
                  placeholder="15 min"
                />
              </td>
              <td class="col-action">
                <button
                  type="button"
                  class="btn-remove"
                  onclick={() => removeBillingCode(i)}
                  aria-label="Remove billing code {i + 1}">×</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="empty-hint">No billing codes added yet.</p>
    {/if}
    <button type="button" class="btn-add" onclick={addBillingCode}>+ Add Billing Code</button>
  </fieldset>

  <fieldset class="soap-fieldset">
    <legend>Orders & Referrals</legend>
    <textarea
      rows="3"
      value={field('ordersReferrals')}
      oninput={(e) => onInput('ordersReferrals', e)}
      placeholder="Additional orders, referrals, imaging requests..."
    ></textarea>
  </fieldset>
</div>

<style>
  .soap-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .soap-fieldset {
    border: 1px solid var(--color-neutral-200, #e5e5e5);
    border-radius: 0.5rem;
    padding: 1rem 1.25rem;
    margin: 0;
  }

  .soap-fieldset legend {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--color-neutral-700, #404040);
    padding: 0 0.25rem;
  }

  .soap-fieldset > textarea {
    width: 100%;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.5;
    font-family: inherit;
    color: var(--color-neutral-900, #171717);
    background: var(--color-white, #fff);
    resize: vertical;
    margin-top: 0.5rem;
    box-sizing: border-box;
  }

  .soap-fieldset > textarea:focus {
    outline: 2px solid var(--color-brand-500, #22c55e);
    outline-offset: -1px;
    border-color: var(--color-brand-500, #22c55e);
  }

  .code-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }

  .code-table th {
    text-align: left;
    font-weight: 600;
    font-size: 0.8125rem;
    padding: 0.375rem 0.5rem;
    border-bottom: 2px solid var(--color-neutral-200, #e5e5e5);
    color: var(--color-neutral-600, #525252);
  }

  .code-table td {
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
  }

  .code-table input[type='text'],
  .code-table input[type='number'] {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    border-radius: 0.25rem;
    font-size: 0.8125rem;
    font-family: inherit;
    box-sizing: border-box;
  }

  .code-table input:focus {
    outline: 2px solid var(--color-brand-500, #22c55e);
    outline-offset: -1px;
    border-color: var(--color-brand-500, #22c55e);
  }

  .col-primary {
    width: 60px;
    text-align: center;
  }

  .col-code {
    width: 100px;
  }

  .col-units {
    width: 70px;
  }

  .col-time {
    width: 90px;
  }

  .col-action {
    width: 40px;
  }

  .btn-remove {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-neutral-400, #a3a3a3);
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    border-radius: 0.25rem;
  }

  .btn-remove:hover {
    color: var(--color-error-600, #dc2626);
    background: var(--color-error-50, #fef2f2);
  }

  .empty-hint {
    font-size: 0.8125rem;
    color: var(--color-neutral-400, #a3a3a3);
    font-style: italic;
    margin: 0.5rem 0;
  }

  .btn-add {
    background: none;
    border: 1px dashed var(--color-neutral-300, #d4d4d4);
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
    color: var(--color-brand-600, #16a34a);
    cursor: pointer;
    font-weight: 500;
  }

  .btn-add:hover {
    background: var(--color-neutral-50, #fafafa);
    border-color: var(--color-brand-400, #4ade80);
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
</style>
