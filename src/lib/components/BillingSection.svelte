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
  import { useNoteTemplate, isSubsectionVisible } from '$lib/config/templates';
  import { getBillingCodes } from '$lib/config/billingCatalog';
  import type { CPTCode } from '$lib/config/ptCodes';

  // TODO: derive discipline from session context once multi-discipline routing is wired
  const billingCodeSet = getBillingCodes('pt');
  import type {
    DiagnosisCode,
    BillingCode,
    OrderEntry,
    OrderType,
    OrderUrgency,
    OrderStatus,
  } from '$lib/types/sections';

  const noteTemplate = useNoteTemplate();

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
    const match = billingCodeSet.icd10Codes.find((c) => c.value === value);
    if (!match) return;
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

  /** Look up CPTCode metadata for a given code string. */
  function getCPTMeta(code: string): CPTCode | undefined {
    return billingCodeSet.cptCodes.find((c) => c.value === code);
  }

  function addCPT(diagCode: string) {
    const entry: BillingCode = {
      code: '',
      description: '',
      label: '',
      units: 1,
      timeSpent: '',
      modifier: '',
      linkedDiagnosisCode: diagCode,
    };
    updateField('billing', 'billingCodes', [...billingCodes, entry]);
  }

  function selectCPTCode(globalIdx: number, value: string) {
    const match = billingCodeSet.cptCodes.find((c) => c.value === value);
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

  const ORDER_TYPES: OrderType[] = [
    'Order',
    'Referral',
    'Imaging',
    'Lab',
    'DME',
    'Home Health',
    'Specialist Consult',
    'Procedure',
    'Prescription',
    'Other',
  ];

  const ORDER_URGENCY: { value: OrderUrgency; label: string }[] = [
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'stat', label: 'STAT' },
  ];

  const ORDER_STATUS: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'sent', label: 'Sent' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  /** Placeholder hints for each order type. */
  const ORDER_PLACEHOLDERS: Record<OrderType, string> = {
    Order: 'e.g., PT 2-3x/wk for 6 weeks',
    Referral: 'e.g., Orthopedic consult for surgical evaluation',
    Imaging: 'e.g., MRI lumbar spine without contrast',
    Lab: 'e.g., CBC, CMP, ESR, CRP',
    DME: 'e.g., Rolling walker with seat, standard wheelchair',
    'Home Health': 'e.g., Home PT 2x/wk, home safety evaluation',
    'Specialist Consult': 'e.g., Pain management for injection evaluation',
    Procedure: 'e.g., Trigger point injection, joint aspiration',
    Prescription: 'e.g., Lidocaine 5% patch, Meloxicam 15mg daily',
    Other: 'Describe order details...',
  };

  function getOrdersForDiag(diagCode: string): OrderEntry[] {
    return ordersReferrals.filter((o) => o.linkedDiagnosisCode === diagCode);
  }

  function addOrder(diagCode: string) {
    const entry: OrderEntry = {
      type: 'Order',
      description: '',
      linkedDiagnosisCode: diagCode,
      urgency: 'routine',
      status: 'pending',
      orderingProvider: '',
      dateNeeded: '',
      facility: '',
      notes: '',
    };
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

  // ─── CPT Modifiers ───

  const CPT_MODIFIERS = [
    { value: '', label: 'None' },
    { value: '59', label: '59 – Distinct Procedural Service' },
    { value: 'GP', label: 'GP – PT Plan of Care' },
    { value: 'GO', label: 'GO – OT Plan of Care' },
    { value: 'GN', label: 'GN – SLP Plan of Care' },
    { value: 'KX', label: 'KX – Therapy Cap Exception' },
    { value: '25', label: '25 – Significant, Separately Identifiable E/M' },
    { value: '76', label: '76 – Repeat Procedure, Same Physician' },
    { value: '77', label: '77 – Repeat Procedure, Another Physician' },
    { value: '97', label: '97 – Habilitative Services' },
  ];

  // ─── Time presets (minutes) ───

  const TIME_PRESETS = [
    { value: '', label: '—' },
    { value: '8', label: '8 min' },
    { value: '15', label: '15 min' },
    { value: '23', label: '23 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '60 min' },
  ];

  // ─── 8-Minute Rule Calculator ───

  function unitsFromMinutes(minutes: number): number {
    if (minutes < 8) return 0;
    if (minutes <= 22) return 1;
    if (minutes <= 37) return 2;
    if (minutes <= 52) return 3;
    if (minutes <= 67) return 4;
    if (minutes <= 82) return 5;
    if (minutes <= 97) return 6;
    if (minutes <= 112) return 7;
    return Math.ceil(minutes / 15);
  }

  function parseMinutes(timeStr: string): number {
    const m = timeStr.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  // ─── Billing Summary ───

  const billingSummary = $derived.by(() => {
    let timedMinutes = 0;
    let untimedCount = 0;
    let totalUnits = 0;
    for (const b of billingCodes) {
      const meta = getCPTMeta(b.code);
      const mins = parseMinutes(b.timeSpent ?? '');
      const units = typeof b.units === 'number' ? b.units : 1;
      totalUnits += units;
      if (meta?.timed) {
        timedMinutes += mins;
      } else if (meta && !meta.timed) {
        untimedCount++;
      } else {
        timedMinutes += mins; // unknown codes treated as timed
      }
    }
    const suggestedTimedUnits = unitsFromMinutes(timedMinutes);
    return {
      timedMinutes,
      untimedCount,
      totalUnits,
      suggestedTimedUnits,
      codeCount: billingCodes.length,
    };
  });

  let diagSearchValue = $state('');
</script>

<div class="billing-section section-panel">
  <!-- ─── ICD-10 Search Bar ─── -->
  {#if isSubsectionVisible(noteTemplate, 'billing', 'diagnosis-codes')}
    <div class="dx-search">
      <div class="dx-search__label">
        <span class="material-symbols-outlined dx-search__icon" aria-hidden="true">diagnosis</span>
        Diagnosis Codes (ICD-10)
      </div>
      <div class="dx-search__input">
        <SearchableSelect
          value={diagSearchValue}
          placeholder="Search ICD-10 by code or description..."
          items={billingCodeSet.icd10Codes}
          scoreFn={billingCodeSet.scoreICD10}
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
  {/if}

  <!-- ─── Billing Summary Bar ─── -->
  {#if billingSummary.codeCount > 0}
    <div class="billing-summary">
      <div class="billing-summary__item">
        <span class="billing-summary__value">{billingSummary.codeCount}</span>
        <span class="billing-summary__label">CPT Codes</span>
      </div>
      <div class="billing-summary__divider"></div>
      <div class="billing-summary__item">
        <span class="billing-summary__value">{billingSummary.totalUnits}</span>
        <span class="billing-summary__label">Total Units</span>
      </div>
      <div class="billing-summary__divider"></div>
      <div class="billing-summary__item">
        <span class="billing-summary__value">{billingSummary.timedMinutes} min</span>
        <span class="billing-summary__label">Timed Codes</span>
      </div>
      {#if billingSummary.untimedCount > 0}
        <div class="billing-summary__divider"></div>
        <div class="billing-summary__item">
          <span class="billing-summary__value">{billingSummary.untimedCount}</span>
          <span class="billing-summary__label">Untimed Codes</span>
        </div>
      {/if}
      {#if billingSummary.timedMinutes >= 8}
        <div class="billing-summary__divider"></div>
        <div class="billing-summary__item billing-summary__item--rule">
          <span class="billing-summary__value">{billingSummary.suggestedTimedUnits}</span>
          <span class="billing-summary__label">8-Min Rule</span>
        </div>
      {/if}
      {#if billingSummary.timedMinutes >= 8 && billingSummary.totalUnits !== billingSummary.suggestedTimedUnits + billingSummary.untimedCount}
        <div class="billing-summary__alert">
          <span class="material-symbols-outlined billing-summary__alert-icon" aria-hidden="true"
            >warning</span
          >
          Units mismatch — billed {billingSummary.totalUnits}, expected {billingSummary.suggestedTimedUnits +
            billingSummary.untimedCount} per 8-min rule
        </div>
      {/if}
    </div>
  {/if}

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
              {diagCPT.length} CPT{diagOrders.length > 0 ? `, ${diagOrders.length} orders` : ''}
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
              {#if isSubsectionVisible(noteTemplate, 'billing', 'cpt-codes')}
                <div class="dx-card__subtable">
                  <div class="subtable-header">
                    <span class="subtable-title">
                      <span class="material-symbols-outlined subtable-icon" aria-hidden="true"
                        >receipt_long</span
                      >
                      CPT Billing Codes
                    </span>
                    <button
                      type="button"
                      class="subtable-add"
                      onclick={() => addCPT(diag.code)}
                      aria-label="Add CPT code"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">add</span>
                    </button>
                  </div>
                  {#if diagCPT.length > 0}
                    <div class="cpt-list">
                      {#each diagCPT as bill, localIdx}
                        {@const gIdx = globalCPTIndex(diag.code, localIdx)}
                        {@const meta = getCPTMeta(bill.code)}
                        <div class="cpt-row">
                          <!-- Row 1: CPT code search (full width) -->
                          <div class="cpt-row__code">
                            <span class="cpt-cell__label">CPT Code</span>
                            <div class="cpt-row__code-inner">
                              <div class="cpt-code-search">
                                <SearchableSelect
                                  value={bill.code}
                                  placeholder="Search by code or name — e.g. 97110, therapeutic exercise..."
                                  items={billingCodeSet.cptCodes}
                                  scoreFn={billingCodeSet.scoreCPT}
                                  onSelect={(v) => selectCPTCode(gIdx, v)}
                                />
                              </div>
                              {#if bill.code && meta}
                                <span
                                  class="cpt-badge"
                                  class:cpt-badge--timed={meta.timed}
                                  class:cpt-badge--untimed={!meta.timed}
                                >
                                  {meta.timed ? 'Timed' : 'Untimed'}
                                </span>
                              {/if}
                              <button
                                type="button"
                                class="ct-btn-remove"
                                onclick={() => removeCPT(gIdx)}
                                aria-label="Remove CPT code">&times;</button
                              >
                            </div>
                          </div>
                          <!-- Row 2: Description (full width, shown when code selected) -->
                          {#if bill.code}
                            <div class="cpt-row__desc">
                              <span class="cpt-desc-text">{bill.description}</span>
                            </div>
                          {/if}
                          <!-- Row 3: Modifier, Units, Time -->
                          <div class="cpt-row__details">
                            <div class="cpt-cell cpt-cell--modifier">
                              <span class="cpt-cell__label">Modifier</span>
                              <select
                                value={bill.modifier ?? ''}
                                onchange={(e) =>
                                  updateCPTField(
                                    gIdx,
                                    'modifier',
                                    (e.target as HTMLSelectElement).value,
                                  )}
                              >
                                {#each CPT_MODIFIERS as mod}
                                  <option value={mod.value}>{mod.label}</option>
                                {/each}
                              </select>
                            </div>
                            <div class="cpt-cell cpt-cell--units">
                              <span class="cpt-cell__label">Units</span>
                              <input
                                type="number"
                                class="cell-input--center"
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
                            </div>
                            <div class="cpt-cell cpt-cell--time">
                              <span class="cpt-cell__label">Time</span>
                              {#if meta?.timed !== false}
                                <select
                                  value={bill.timeSpent ?? ''}
                                  onchange={(e) =>
                                    updateCPTField(
                                      gIdx,
                                      'timeSpent',
                                      (e.target as HTMLSelectElement).value,
                                    )}
                                >
                                  {#each TIME_PRESETS as tp}
                                    <option value={tp.value}>{tp.label}</option>
                                  {/each}
                                </select>
                              {:else}
                                <span class="ct-na">N/A</span>
                              {/if}
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="ct-empty-hint">
                      <span class="material-symbols-outlined ct-empty-icon" aria-hidden="true"
                        >playlist_add</span
                      >
                      No CPT codes linked. Click <strong>+</strong> to add a billing code.
                    </div>
                  {/if}
                </div>
              {/if}

              <!-- Orders & Referrals -->
              {#if isSubsectionVisible(noteTemplate, 'billing', 'orders-referrals')}
                <div class="dx-card__subtable">
                  <div class="subtable-header subtable-header--orders">
                    <span class="subtable-title">
                      <span class="material-symbols-outlined subtable-icon" aria-hidden="true"
                        >assignment</span
                      >
                      Orders &amp; Referrals
                    </span>
                    <button
                      type="button"
                      class="subtable-add"
                      onclick={() => addOrder(diag.code)}
                      aria-label="Add order or referral"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">add</span>
                    </button>
                  </div>
                  {#if diagOrders.length > 0}
                    <div class="order-list">
                      {#each diagOrders as order, localIdx}
                        {@const gIdx = globalOrderIndex(diag.code, localIdx)}
                        <div class="order-entry">
                          <div class="order-entry__top">
                            <div class="order-field order-field--type">
                              <span class="order-field__label">Type</span>
                              <select
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
                            </div>
                            <div class="order-field order-field--urgency">
                              <span class="order-field__label">Urgency</span>
                              <select
                                class:urgency--urgent={order.urgency === 'urgent'}
                                class:urgency--stat={order.urgency === 'stat'}
                                value={order.urgency ?? 'routine'}
                                onchange={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'urgency',
                                    (e.target as HTMLSelectElement).value,
                                  )}
                              >
                                {#each ORDER_URGENCY as u}
                                  <option value={u.value}>{u.label}</option>
                                {/each}
                              </select>
                            </div>
                            <div class="order-field order-field--status">
                              <span class="order-field__label">Status</span>
                              <select
                                class:status--sent={order.status === 'sent'}
                                class:status--completed={order.status === 'completed'}
                                class:status--cancelled={order.status === 'cancelled'}
                                value={order.status ?? 'pending'}
                                onchange={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'status',
                                    (e.target as HTMLSelectElement).value,
                                  )}
                              >
                                {#each ORDER_STATUS as s}
                                  <option value={s.value}>{s.label}</option>
                                {/each}
                              </select>
                            </div>
                            <button
                              type="button"
                              class="ct-btn-remove order-remove"
                              onclick={() => removeOrder(gIdx)}
                              aria-label="Remove order">&times;</button
                            >
                          </div>
                          <div class="order-entry__mid">
                            <div class="order-field order-field--desc">
                              <span class="order-field__label">Description</span>
                              <input
                                type="text"
                                value={order.description}
                                oninput={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'description',
                                    (e.target as HTMLInputElement).value,
                                  )}
                                placeholder={ORDER_PLACEHOLDERS[order.type] ?? 'Describe order...'}
                              />
                            </div>
                          </div>
                          <div class="order-entry__bottom">
                            <div class="order-field order-field--sm">
                              <span class="order-field__label">Ordering Provider</span>
                              <input
                                type="text"
                                value={order.orderingProvider ?? ''}
                                oninput={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'orderingProvider',
                                    (e.target as HTMLInputElement).value,
                                  )}
                                placeholder="Dr. Smith, PT"
                              />
                            </div>
                            <div class="order-field order-field--sm">
                              <span class="order-field__label">Facility / Destination</span>
                              <input
                                type="text"
                                value={order.facility ?? ''}
                                oninput={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'facility',
                                    (e.target as HTMLInputElement).value,
                                  )}
                                placeholder="Clinic or facility name"
                              />
                            </div>
                            <div class="order-field order-field--date">
                              <span class="order-field__label">Date Needed</span>
                              <input
                                type="date"
                                value={order.dateNeeded ?? ''}
                                oninput={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'dateNeeded',
                                    (e.target as HTMLInputElement).value,
                                  )}
                              />
                            </div>
                          </div>
                          {#if order.notes !== undefined && order.notes !== ''}
                            <div class="order-entry__notes">
                              <span class="order-field__label">Notes</span>
                              <textarea
                                rows="2"
                                value={order.notes ?? ''}
                                oninput={(e) =>
                                  updateOrderField(
                                    gIdx,
                                    'notes',
                                    (e.target as HTMLTextAreaElement).value,
                                  )}
                                placeholder="Additional notes..."
                              ></textarea>
                            </div>
                          {/if}
                          {#if order.notes === undefined || order.notes === ''}
                            <button
                              type="button"
                              class="order-notes-toggle"
                              onclick={() => updateOrderField(gIdx, 'notes', ' ')}
                              >+ Add notes</button
                            >
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="ct-empty-hint">
                      <span class="material-symbols-outlined ct-empty-icon" aria-hidden="true"
                        >note_add</span
                      >
                      No orders linked. Click <strong>+</strong> to add an order or referral.
                    </div>
                  {/if}
                </div>
              {/if}
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

  /* ─── Billing Summary Bar ─── */

  .billing-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    background: var(--color-neutral-50, #fafafa);
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px;
    margin-bottom: 0.625rem;
  }

  .billing-summary__divider {
    width: 1px;
    height: 2rem;
    background: var(--color-neutral-200, #e0e0e0);
    flex-shrink: 0;
  }

  .billing-summary__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    min-width: 3.5rem;
  }

  .billing-summary__value {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--color-neutral-800, #333333);
    line-height: 1.2;
  }

  .billing-summary__label {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-neutral-500, #757575);
    white-space: nowrap;
  }

  .billing-summary__item--rule .billing-summary__value {
    color: var(--color-brand-green, #009a44);
  }

  .billing-summary__alert {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #bf360c;
    background: #fff3e0;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    border: 1px solid #ffcc80;
    margin-left: auto;
  }

  .billing-summary__alert-icon {
    font-size: 0.9rem;
    color: #e65100;
  }

  /* ─── Diagnosis Search Bar ─── */

  .dx-search {
    padding: 0.75rem 0;
  }

  .dx-search__label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-600, #616161);
    margin-bottom: 0.5rem;
  }

  .dx-search__icon {
    font-size: 1rem;
    color: var(--color-neutral-500, #757575);
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
    padding: 0.625rem 3.5rem 0.625rem 0.75rem;
    background: var(--color-neutral-50, #fafafa);
    border: none;
    border-bottom: 1px solid var(--color-neutral-100, #f0f0f0);
    border-radius: 8px 8px 0 0;
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
  }

  .subtable-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.625rem;
    background: var(--color-neutral-100, #f5f5f5);
    border-bottom: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 6px 6px 0 0;
  }

  .subtable-header--orders {
    background: #f3f0ff;
    border-bottom-color: #e0d8f5;
  }

  .subtable-title {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-600, #616161);
  }

  .subtable-icon {
    font-size: 0.875rem;
  }

  .subtable-add {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-neutral-300, #d4d4d4);
    background: var(--color-surface, #ffffff);
    color: var(--color-brand-green, #009a44);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
  }

  .subtable-add :global(.material-symbols-outlined) {
    font-size: 1rem;
  }

  .subtable-add:hover {
    background: var(--color-brand-green, #009a44);
    border-color: var(--color-brand-green, #009a44);
    color: #ffffff;
  }

  /* ─── CPT Card List ─── */

  .cpt-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .cpt-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--color-neutral-100, #f0f0f0);
    transition: background 0.1s;
  }

  .cpt-row:last-child {
    border-bottom: none;
  }

  .cpt-row:hover {
    background: var(--color-neutral-50, #fafafa);
  }

  /* Row 1: full-width code search */
  .cpt-row__code {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .cpt-row__code-inner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cpt-code-search {
    flex: 1;
    min-width: 0;
  }

  /* Row 2: description text */
  .cpt-row__desc {
    padding: 0.15rem 0;
  }

  /* Row 3: modifier / units / time */
  .cpt-row__details {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .cpt-cell {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .cpt-cell__label {
    font-size: 0.5625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .cpt-cell--modifier {
    width: 200px;
    flex-shrink: 0;
  }

  .cpt-cell--units {
    width: 55px;
    flex-shrink: 0;
  }

  .cpt-cell--time {
    width: 90px;
    flex-shrink: 0;
  }

  .cpt-desc-text {
    font-size: 0.8rem;
    color: var(--color-neutral-600, #616161);
    line-height: 1.3;
    font-style: italic;
  }

  /* All input/select/textarea sizing handled by global app.css
     :is(.section-panel) rules — no scoped overrides needed. */

  .ct-na {
    display: block;
    text-align: center;
    font-size: 0.7rem;
    color: var(--color-neutral-400, #9e9e9e);
    font-style: italic;
    padding: 0.3rem 0;
  }

  .ct-btn-remove {
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--color-neutral-200, #e0e0e0);
    border-radius: 4px;
    background: var(--color-surface, #ffffff);
    color: var(--color-neutral-400, #9e9e9e);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
    flex-shrink: 0;
  }

  .ct-btn-remove:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .ct-empty-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    color: var(--color-neutral-400, #9e9e9e);
  }

  .ct-empty-icon {
    font-size: 1rem;
  }

  /* ─── CPT Badges ─── */

  .cpt-badge {
    display: inline-flex;
    align-items: center;
    align-self: center;
    flex-shrink: 0;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .cpt-badge--timed {
    background: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  .cpt-badge--untimed {
    background: #f3e5f5;
    color: #7b1fa2;
    border: 1px solid #e1bee7;
  }

  .cell-input--center {
    text-align: center;
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* ─── Orders & Referrals ─── */

  .order-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .order-entry {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--color-neutral-100, #f0f0f0);
  }

  .order-entry:last-child {
    border-bottom: none;
  }

  .order-entry__top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .order-entry__mid {
    display: flex;
    gap: 0.5rem;
  }

  .order-entry__bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .order-entry__notes {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .order-field {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .order-field__label {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-neutral-500, #757575);
  }

  .order-field--type {
    width: 130px;
    flex-shrink: 0;
  }

  .order-field--urgency {
    width: 90px;
    flex-shrink: 0;
  }

  .order-field--status {
    width: 100px;
    flex-shrink: 0;
  }

  .order-field--desc {
    flex: 1;
    min-width: 200px;
  }

  .order-field--sm {
    flex: 1;
    min-width: 140px;
  }

  .order-field--date {
    width: 140px;
    flex-shrink: 0;
  }

  .order-remove {
    align-self: flex-end;
    margin-left: auto;
  }

  .order-notes-toggle {
    align-self: flex-start;
    background: none;
    border: none;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-neutral-400, #9e9e9e);
    cursor: pointer;
    padding: 0.125rem 0;
  }

  .order-notes-toggle:hover {
    color: var(--color-brand-green, #009a44);
  }

  /* Urgency color coding */
  .urgency--urgent {
    color: #e65100;
    border-color: #ff9800;
  }

  .urgency--stat {
    color: #c62828;
    border-color: #ef5350;
    font-weight: 700;
  }

  /* Status color coding */
  .status--sent {
    color: #1565c0;
    border-color: #42a5f5;
  }

  .status--completed {
    color: #2e7d32;
    border-color: #66bb6a;
  }

  .status--cancelled {
    color: var(--color-neutral-400, #9e9e9e);
    border-color: var(--color-neutral-300, #d4d4d4);
    text-decoration: line-through;
  }

  @media (max-width: 640px) {
    .cpt-row__details {
      flex-direction: column;
      align-items: stretch;
    }

    .cpt-cell--modifier,
    .cpt-cell--units,
    .cpt-cell--time {
      width: 100%;
    }

    .dx-card__desc {
      display: none;
    }

    .order-entry__bottom {
      flex-direction: column;
    }

    .order-field--sm,
    .order-field--date {
      width: 100%;
    }
  }
</style>
