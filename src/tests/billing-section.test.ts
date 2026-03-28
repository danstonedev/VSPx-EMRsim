/**
 * Tests for BillingData store logic — verifies diagnosis codes, billing codes,
 * orders/referrals arrays, and legacy string format handling.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import type { DiagnosisCode, BillingCode, OrderEntry } from '$lib/types/sections';

vi.mock('$lib/stores/cases', () => ({
  activeCase: {
    subscribe: vi.fn((fn: Function) => {
      fn({});
      return vi.fn();
    }),
  },
  saveActiveDraft: vi.fn(),
}));
vi.mock('$lib/services/chartRecords', () => ({
  saveSignedNote: vi.fn(),
}));
vi.mock('$lib/services/noteLifecycle', () => ({
  finalizeDraftSignature: vi.fn(),
}));
vi.mock('$lib/stores/chartRecords', () => ({
  refreshChartRecords: vi.fn(),
}));

describe('Billing section — store data flow', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('stores diagnosis codes array with primary flag', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const codes: DiagnosisCode[] = [
      {
        code: 'M17.11',
        description: 'Primary osteoarthritis, right knee',
        label: 'OA R knee',
        isPrimary: true,
      },
      {
        code: 'M25.561',
        description: 'Pain in right knee',
        label: 'Knee pain R',
        isPrimary: false,
      },
    ];
    updateField('billing', 'diagnosisCodes', codes);
    const result = get(noteDraft).billing.diagnosisCodes!;
    expect(result).toHaveLength(2);
    expect(result[0].isPrimary).toBe(true);
    expect(result[1].isPrimary).toBe(false);
    expect(result[0].code).toBe('M17.11');
  });

  it('updates primary diagnosis flag (set new primary)', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const codes: DiagnosisCode[] = [
      { code: 'M17.11', description: 'OA R knee', label: 'OA R knee', isPrimary: true },
      { code: 'M25.561', description: 'Pain R knee', label: 'Pain R knee', isPrimary: false },
    ];
    updateField('billing', 'diagnosisCodes', codes);

    // Switch primary to second code
    const current = get(noteDraft).billing.diagnosisCodes!;
    const updated = current.map((c, i) => ({ ...c, isPrimary: i === 1 }));
    updateField('billing', 'diagnosisCodes', updated);

    const result = get(noteDraft).billing.diagnosisCodes!;
    expect(result[0].isPrimary).toBe(false);
    expect(result[1].isPrimary).toBe(true);
  });

  it('updates code and description on a diagnosis entry', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const codes: DiagnosisCode[] = [
      { code: 'PLACEHOLDER', description: '', label: '', isPrimary: true },
    ];
    updateField('billing', 'diagnosisCodes', codes);

    const current = get(noteDraft).billing.diagnosisCodes!;
    const updated = current.map((c) => ({
      ...c,
      code: 'S83.511A',
      description: 'Sprain of ACL of right knee, initial encounter',
      label: 'ACL sprain R',
    }));
    updateField('billing', 'diagnosisCodes', updated);
    const result = get(noteDraft).billing.diagnosisCodes![0];
    expect(result.code).toBe('S83.511A');
    expect(result.description).toContain('ACL');
  });

  it('stores billing codes with units and linked diagnosis', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const billingCodes: BillingCode[] = [
      {
        code: '97110',
        description: 'Therapeutic exercises',
        label: 'Ther Ex',
        units: 2,
        timeSpent: '30 min',
        linkedDiagnosisCode: 'M17.11',
      },
      {
        code: '97140',
        description: 'Manual therapy',
        label: 'Manual Tx',
        units: 1,
        timeSpent: '15 min',
        linkedDiagnosisCode: 'M17.11',
      },
    ];
    updateField('billing', 'billingCodes', billingCodes);
    const result = get(noteDraft).billing.billingCodes!;
    expect(result).toHaveLength(2);
    expect(result[0].units).toBe(2);
    expect(typeof result[0].units).toBe('number');
    expect(result[1].linkedDiagnosisCode).toBe('M17.11');
  });

  it('stores orders/referrals as OrderEntry array', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const orders: OrderEntry[] = [
      {
        type: 'Referral',
        description: 'Ortho consult for surgical eval',
        linkedDiagnosisCode: 'S83.511A',
      },
      {
        type: 'Imaging',
        description: 'MRI right knee without contrast',
        linkedDiagnosisCode: 'S83.511A',
      },
    ];
    updateField('billing', 'ordersReferrals', orders);
    const result = get(noteDraft).billing.ordersReferrals as OrderEntry[];
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('Referral');
    expect(result[1].type).toBe('Imaging');
  });

  it('changes order type on an existing entry', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const orders: OrderEntry[] = [
      { type: 'Order', description: 'Knee brace', linkedDiagnosisCode: 'M17.11' },
    ];
    updateField('billing', 'ordersReferrals', orders);

    const current = get(noteDraft).billing.ordersReferrals as OrderEntry[];
    const updated = current.map((o) => ({ ...o, type: 'Other' as const }));
    updateField('billing', 'ordersReferrals', updated);
    expect((get(noteDraft).billing.ordersReferrals as OrderEntry[])[0].type).toBe('Other');
  });

  it('stores legacy string format for ordersReferrals', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('billing', 'ordersReferrals', 'Refer to orthopedics for surgical consultation');
    const result = get(noteDraft).billing.ordersReferrals;
    expect(typeof result).toBe('string');
    expect(result).toBe('Refer to orthopedics for surgical consultation');
  });

  it('clearDraft resets billing to empty object', async () => {
    const { updateField, clearDraft, noteDraft } = await import('$lib/stores/noteSession');
    updateField('billing', 'diagnosisCodes', [
      { code: 'M17.11', description: 'OA', label: 'OA', isPrimary: true },
    ]);
    updateField('billing', 'billingCodes', [
      {
        code: '97110',
        description: 'Ther Ex',
        label: 'Ther Ex',
        units: 1,
        timeSpent: '15 min',
        linkedDiagnosisCode: 'M17.11',
      },
    ]);
    clearDraft();
    expect(get(noteDraft).billing).toEqual({});
  });
});
