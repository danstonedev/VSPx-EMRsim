<!--
  BillingSection — Diagnosis-grouped billing (v2 architecture).
  ICD-10 search bar at top → each diagnosis becomes a collapsible card
  containing its linked CPT codes table + Orders/Referrals table.
  First diagnosis = primary (by position). Reorder with ↑↓ arrows.
  Ported from app/js/features/soap/billing/BillingSection.js
-->
<script lang="ts">
  import { noteDraft, updateField } from '$lib/stores/noteSession';
  import SearchableSelect from './SearchableSelect.svelte';
  import { PT_CPT_CODES, PT_ICD10_CODES, scoreCPTCode, scoreICD10Code } from '$lib/config/ptCodes';
  import type { DiagnosisCode, BillingCode, OrderEntry } from '$lib/types/sections';

  const section = $derived($noteDraft.billing);

  // ─── Diagnosis codes ───

  const diagnosisCodes = $derived(section.diagnosisCodes ?? []);
  const billingCodes = $derived(section.billingCodes ?? []);

  const ordersReferrals = $derived.by((): OrderEntry[] => {
    const raw = section.ordersReferrals;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
      return [{ type: 'Order', description: raw, linkedDiagnosisCode: getPrimaryCode() }];
    }
    return [];
  });

  function getPrimaryCode(): string {
    return diagnosisCodes[0]?.code ?? '';
  }

  // ─── Expand/collapse state for diagnosis cards ───

  let expandState = $state<Record<string, boolean>>({});

  function isExpanded(code: string): boolean {
    return expandState[code] ?? true; // default open
  }

  function toggleCard(code: string) {
    expandState = { ...expandState, [code]: !isExpanded(code) };
  }

  // ─── Diagnosis CRUD ───

  function addDiagnosis(value: string) {
    const match = PT_ICD10_CODES.find((c) => c.value === value);
    if (!match) return;
    // prevent duplicates
    if (diagnosisCodes.some((d) => d.code === match.value)) return;
    const entry: DiagnosisCode = {
      code: match.value,
      description: match.description,
      label: match.label,
      isPrimary: diagnosisCodes.length === 0,
    };
    const updated = [...diagnosisCodes, entry];
    applyPrimaryByPosition(updated);
    updateField('billing', 'diagnosisCodes', updated);
  }

  function removeDiagnosis(idx: number) {
    const removed = diagnosisCodes[idx];
    const updated = diagnosisCodes.filter((_, i) => i !== idx);
    applyPrimaryByPosition(updated);
    // Reassign orphaned billing codes and orders
    const fallback = updated[0]?.code ?? '';
    const fixedBilling = billingCodes.map((b) =>
      b.linkedDiagnosisCode === removed?.code ? { ...b, linkedDiagnosisCode: fallback } : b,
    );
    const fixedOrders = ordersReferrals.map((o) =>
      o.linkedDiagnosisCode === removed?.code ? { ...o, linkedDiagnosisCode: fallback } : o,
    );
    updateField('billing', 'diagnosisCodes', updated);
    updateField('billing', 'billingCodes', fixedBilling);
    updateField('billing', 'ordersReferrals', fixedOrders);
  }

  function moveDiagnosis(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= diagnosisCodes.length) return;
    const updated = [...diagnosisCodes];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    applyPrimaryByPosition(updated);
    updateField('billing', 'diagnosisCodes', updated);
  }

  function applyPrimaryByPosition(codes: DiagnosisCode[]) {
    codes.forEach((d, i) => (d.isPrimary = i === 0));
  }

  // ─── CPT codes CRUD (linked to a diagnosis) ───

  function getCPTForDiag(diagCode: string): BillingCode[] {
    return billingCodes.filter((b) => b.linkedDiagnosisCode === diagCode);
  }

  function addCPT(diagCode: string) {
    const entry: BillingCode = {
      code: '',
      description: '',
      label: '',
      units: 1,
      timeSpent: '',
      linkedDiagnosisCode: diagCode,
    };
    updateField('billing', 'billingCodes', [...billingCodes, entry]);
  }

  function selectCPTCode(globalIdx: number, value: string) {
    const match = PT_CPT_CODES.find((c) => c.value === value);
    if (!match) return;
    const updated = [...billingCodes];
    updated[globalIdx] = {
      ...updated[globalIdx],
      code: match.value,
      description: match.description,
      label: match.label,
    };
    updateField('billing', 'billingCodes', updated);
  }

  function updateCPTField(globalIdx: number, field: keyof BillingCode, value: string | number) {
    const updated = [...billingCodes];
    updated[globalIdx] = { ...updated[globalIdx], [field]: value };
    updateField('billing', 'billingCodes', updated);
  }

  function removeCPT(globalIdx: number) {
    updateField(
      'billing',
      'billingCodes',
      billingCodes.filter((_, i) => i !== globalIdx),
    );
  }

  /** Get the global index of a billing code in the flat array */
  function globalCPTIndex(diagCode: string, localIdx: number): number {
    let count = 0;
    for (let i = 0; i < billingCodes.length; i++) {
      if (billingCodes[i].linkedDiagnosisCode === diagCode) {
        if (count === localIdx) return i;
        count++;
      }
    }
    return -1;
  }

  // ─── Orders/Referrals CRUD (linked to a diagnosis) ───

  const ORDER_TYPES: OrderEntry['type'][] = ['Order', 'Referral', 'Imaging', 'Lab', 'Other'];

  function getOrdersForDiag(diagCode: string): OrderEntry[] {
    return ordersReferrals.filter((o) => o.linkedDiagnosisCode === diagCode);
  }

  function addOrder(diagCode: string) {
    const entry: OrderEntry = { type: 'Order', description: '', linkedDiagnosisCode: diagCode };
    updateField('billing', 'ordersReferrals', [...ordersReferrals, entry]);
  }

  function updateOrderField(globalIdx: number, field: keyof OrderEntry, value: string) {
    const updated = [...ordersReferrals];
    updated[globalIdx] = { ...updated[globalIdx], [field]: value };
    updateField('billing', 'ordersReferrals', updated);
  }

  function removeOrder(globalIdx: number) {
    updateField(
      'billing',
      'ordersReferrals',
      ordersReferrals.filter((_, i) => i !== globalIdx),
    );
  }

  function globalOrderIndex(diagCode: string, localIdx: number): number {
    let count = 0;
    for (let i = 0; i < ordersReferrals.length; i++) {
      if (ordersReferrals[i].linkedDiagnosisCode === diagCode) {
        if (count === localIdx) return i;
        count++;
      }
    }
    return -1;
  }

  // Search bar state
  let diagSearchValue = $state('');
</script>

<div class="billing-section">
  <!-- ─── ICD-10 Search Bar ─── -->
  <div class="dx-search">
    <label class="dx-search__label">Diagnosis Codes (ICD-10)</label>
    <div class="dx-search__input">
      <SearchableSelect
        value={diagSearchValue}
        placeholder="Search and add ICD-10 diagnosis..."
        items={PT_ICD10_CODES}
        scoreFn={scoreICD10Code}
        onSelect={(v) => {
          addDiagnosis(v);
          diagSearchValue = '';
        }}
      />
    </div>
    {#if diagnosisCodes.length === 0}
      <p class="dx-search__hint">Search above to add your first diagnosis code.</p>
    {/if}
  </div>

  <!-- ─── Diagnosis Cards ─── -->
  {#if diagnosisCodes.length > 0}
    <div class="dx-cards">
      {#each diagnosisCodes as diag, idx (diag.code || idx)}
        {@const diagCPT = getCPTForDiag(diag.code)}
        {@const diagOrders = getOrdersForDiag(diag.code)}
        <div class="dx-card" class:dx-card--primary={idx === 0}>
          <!-- Card Header -->
          <button
            type="button"
            class="dx-card__header"
            onclick={() => toggleCard(diag.code || `idx-${idx}`)}
          >
            <span class="dx-card__badge">{idx + 1}</span>
            <span
              class="dx-card__chevron"
              class:dx-card__chevron--open={isExpanded(diag.code || `idx-${idx}`)}
              aria-hidden="true">&#9656;</span
            >
            <span class="dx-card__title">
              <strong>{diag.code}</strong>
              {#if diag.description}
                <span class="dx-card__desc">&mdash; {diag.description}</span>
              {/if}
            </span>
            {#if idx === 0}
              <span class="dx-card__primary-tag">Primary</span>
            {/if}
            <span class="dx-card__counts">
              {diagCPT.length} CPT, {diagOrders.length} orders
            </span>
          </button>

          <!-- Reorder & Remove controls -->
          <div class="dx-card__controls">
            {#if diagnosisCodes.length > 1}
              <button
                type="button"
                class="dx-card__move"
                disabled={idx === 0}
                aria-label="Move diagnosis up"
                onclick={() => moveDiagnosis(idx, -1)}>&#9650;</button
              >
              <button
                type="button"
                class="dx-card__move"
                disabled={idx === diagnosisCodes.length - 1}
                aria-label="Move diagnosis down"
                onclick={() => moveDiagnosis(idx, 1)}>&#9660;</button
              >
            {/if}
            <button
              type="button"
              class="dx-card__remove"
              aria-label="Remove diagnosis"
              onclick={() => removeDiagnosis(idx)}>&times;</button
            >
          </div>

          <!-- Card Body (collapsible) -->
          {#if isExpanded(diag.code || `idx-${idx}`)}
            <div class="dx-card__body">
              <!-- CPT Codes Table -->
              <div class="dx-card__subtable">
                <div class="subtable-header">
                  <span class="subtable-title">CPT Billing Codes</span>
                  <button
                    type="button"
                    class="ct-btn-add subtable-add"
                    onclick={() => addCPT(diag.code)}>+</button
                  >
                </div>
                {#if diagCPT.length > 0}
                  <table class="ct-table code-table">
                    <thead>
                      <tr>
                        <th class="ct-th ct-th--region col-code">CPT Code</th>
                        <th class="ct-th">Description</th>
                        <th class="ct-th col-units">Units</th>
                        <th class="ct-th col-time">Time</th>
                        <th class="ct-th col-action"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each diagCPT as bill, localIdx}
                        {@const gIdx = globalCPTIndex(diag.code, localIdx)}
                        <tr class="ct-row">
                          <td class="ct-td col-code">
                            <SearchableSelect
                              value={bill.code}
                              placeholder="Search CPT..."
                              items={PT_CPT_CODES}
                              scoreFn={scoreCPTCode}
                              onSelect={(v) => selectCPTCode(gIdx, v)}
                            />
                          </td>
                          <td class="ct-td">
                            <input
                              type="text"
                              class="ct-input cell-input"
                              value={bill.description}
                              oninput={(e) =>
                                updateCPTField(
                                  gIdx,
                                  'description',
                                  (e.target as HTMLInputElement).value,
                                )}
                              placeholder="Therapeutic Exercise"
                            />
                          </td>
                          <td class="ct-td col-units">
                            <input
                              type="number"
                              class="ct-input cell-input cell-input--center"
                              min="1"
                              max="8"
                              value={bill.units}
                              oninput={(e) =>
                                updateCPTField(
                                  gIdx,
                                  'units',
                                  parseInt((e.target as HTMLInputElement).value) || 1,
                                )}
                            />
                          </td>
                          <td class="ct-td col-time">
                            <input
                              type="text"
                              class="ct-input cell-input cell-input--center"
                              value={bill.timeSpent}
                              oninput={(e) =>
                                updateCPTField(
                                  gIdx,
                                  'timeSpent',
                                  (e.target as HTMLInputElement).value,
                                )}
                              placeholder="15 min"
                            />
                          </td>
                          <td class="ct-td col-action">
                            <button
                              type="button"
                              class="ct-btn-remove"
                              onclick={() => removeCPT(gIdx)}
                              aria-label="Remove CPT code">&times;</button
                            >
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                {:else}
                  <p class="ct-empty-hint">No CPT codes linked to this diagnosis.</p>
                {/if}
              </div>

              <!-- Orders & Referrals Table -->
              <div class="dx-card__subtable">
                <div class="subtable-header">
                  <span class="subtable-title">Orders &amp; Referrals</span>
                  <button
                    type="button"
                    class="ct-btn-add subtable-add"
                    onclick={() => addOrder(diag.code)}>+</button
                  >
                </div>
                {#if diagOrders.length > 0}
                  <table class="ct-table code-table">
                    <thead>
                      <tr>
                        <th class="ct-th ct-th--region col-type">Type</th>
                        <th class="ct-th">Details</th>
                        <th class="ct-th col-action"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each diagOrders as order, localIdx}
                        {@const gIdx = globalOrderIndex(diag.code, localIdx)}
                        <tr class="ct-row">
                          <td class="ct-td col-type">
                            <select
                              class="ct-select"
                              value={order.type}
                              onchange={(e) =>
                                updateOrderField(
                                  gIdx,
                                  'type',
                                  (e.target as HTMLSelectElement).value,
                                )}
                            >
                              {#each ORDER_TYPES as ot}
                                <option value={ot}>{ot}</option>
                              {/each}
                            </select>
                          </td>
                          <td class="ct-td">
                            <input
                              type="text"
                              class="ct-input cell-input"
                              value={order.description}
                              oninput={(e) =>
                                updateOrderField(
                                  gIdx,
                                  'description',
                                  (e.target as HTMLInputElement).value,
                                )}
                              placeholder="Describe order or referral..."
                            />
                          </td>
                          <td class="ct-td col-action">
                            <button
                              type="button"
                              class="ct-btn-remove"
                              onclick={() => removeOrder(gIdx)}
                              aria-label="Remove order">&times;</button
                            >
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                {:else}
                  <p class="ct-empty-hint">No orders linked to this diagnosis.</p>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .billing-section {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ─── Diagnosis Search Bar ─── */

  .dx-search {
    padding: 0.75rem 0;
  }

  .dx-search__label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-600, #616161);
    margin-bottom: 0.5rem;
  }

  .dx-search__input {
    max-width: 100%;
  }

  .dx-search__hint {
    font-size: 0.8125rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-style: italic;
    margin: 0.5rem 0 0;
  }

  /* ─── Diagnosis Cards ─── */

  .dx-cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .dx-card {
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    background: var(--color-surface, #ffffff);
    transition: border-color 0.15s;
  }

  .dx-card--primary {
    border-color: var(--color-brand-green, #009a44);
    border-width: 2px;
  }

  .dx-card__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.625rem 3rem 0.625rem 0.75rem;
    background: var(--color-neutral-50, #fafafa);
    border: none;
    border-bottom: 1px solid var(--color-neutral-100, #f0f0f0);
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: var(--color-neutral-800, #333333);
    font-size: 0.875rem;
    transition: background 0.1s;
  }

  .dx-card__header:hover {
    background: var(--color-neutral-100, #f0f0f0);
  }

  .dx-card__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background: var(--color-neutral-700, #424242);
    color: #ffffff;
    font-size: 0.6875rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .dx-card--primary .dx-card__badge {
    background: var(--color-brand-green, #009a44);
  }

  .dx-card__chevron {
    font-size: 0.75rem;
    color: var(--color-neutral-400, #9e9e9e);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .dx-card__chevron--open {
    transform: rotate(90deg);
  }

  .dx-card__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dx-card__title strong {
    font-weight: 700;
  }

  .dx-card__desc {
    color: var(--color-neutral-500, #757575);
    font-weight: 400;
  }

  .dx-card__primary-tag {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--color-brand-green, #009a44);
    color: #ffffff;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .dx-card__counts {
    font-size: 0.6875rem;
    color: var(--color-neutral-400, #9e9e9e);
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* ─── Card Controls (reorder + remove) ─── */

  .dx-card__controls {
    position: absolute;
    top: 0;
    right: 0;
    height: auto;
    display: flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.5rem 0.375rem;
    z-index: 1;
  }

  .dx-card__move {
    width: 1.375rem;
    height: 1.375rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-500, #757575);
    font-size: 0.625rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s;
  }

  .dx-card__move:hover:not(:disabled) {
    background: var(--color-neutral-100, #f0f0f0);
    color: var(--color-neutral-800, #333333);
  }

  .dx-card__move:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .dx-card__remove {
    width: 1.375rem;
    height: 1.375rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--color-neutral-400, #9e9e9e);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .dx-card__remove:hover {
    background: #fecaca;
    color: #dc2626;
  }

  /* ─── Card Body ─── */

  .dx-card__body {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ─── Subtable (CPT / Orders) ─── */

  .dx-card__subtable {
    border: 1px solid var(--color-neutral-100, #f0f0f0);
    border-radius: 6px;
    overflow: hidden;
  }

  .subtable-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.375rem 0.625rem;
    background: var(--color-neutral-100, #f5f5f5);
    border-bottom: 1px solid var(--color-neutral-200, #e0e0e0);
  }

  .subtable-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-600, #616161);
  }

  .subtable-add {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 4px;
    border: 1px solid var(--ct-region-bg);
    background: transparent;
    color: var(--color-brand-green, #009a44);
  }

  .subtable-add:hover {
    background: var(--color-brand-green, #009a44);
    color: #ffffff;
  }

  /* ─── Column widths ─── */

  .col-code {
    width: 150px;
  }

  .col-units {
    width: 65px;
  }

  .col-time {
    width: 85px;
  }

  .col-type {
    width: 100px;
  }

  .col-action {
    width: 36px;
    text-align: center;
  }

  .cell-input--center {
    text-align: center;
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  @media (max-width: 640px) {
    .col-code {
      width: 120px;
    }
    .dx-card__desc {
      display: none;
    }
  }
</style>
