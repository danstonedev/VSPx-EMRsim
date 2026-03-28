/**
 * Tests for AssessmentData store logic — verifies all 8 string fields,
 * sequential updates, and clearDraft reset behavior.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

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

describe('Assessment section — store data flow', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('stores ptDiagnosis field', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('assessment', 'ptDiagnosis', 'Lumbar radiculopathy');
    expect(get(noteDraft).assessment.ptDiagnosis).toBe('Lumbar radiculopathy');
  });

  it('stores prognosis field', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('assessment', 'prognosis', 'Good — expected full return to sport in 8 weeks');
    expect(get(noteDraft).assessment.prognosis).toBe(
      'Good — expected full return to sport in 8 weeks',
    );
  });

  it('stores all 8 assessment string fields', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const fields: Array<[string, string]> = [
      ['primaryImpairments', 'Decreased L knee ROM, impaired gait'],
      ['bodyFunctions', 'b710 Mobility of joint, b770 Gait pattern'],
      ['activityLimitations', 'Difficulty with stairs and prolonged walking'],
      ['participationRestrictions', 'Unable to participate in recreational soccer'],
      ['ptDiagnosis', 'L knee ACL sprain grade II'],
      ['prognosis', 'Good'],
      ['prognosticFactors', 'Young age, high motivation, no comorbidities'],
      ['clinicalReasoning', 'Impairment-driven approach targeting ROM and strength'],
    ];

    for (const [key, value] of fields) {
      updateField('assessment', key, value);
    }

    const a = get(noteDraft).assessment;
    expect(a.primaryImpairments).toBe('Decreased L knee ROM, impaired gait');
    expect(a.bodyFunctions).toBe('b710 Mobility of joint, b770 Gait pattern');
    expect(a.activityLimitations).toBe('Difficulty with stairs and prolonged walking');
    expect(a.participationRestrictions).toBe('Unable to participate in recreational soccer');
    expect(a.ptDiagnosis).toBe('L knee ACL sprain grade II');
    expect(a.prognosis).toBe('Good');
    expect(a.prognosticFactors).toBe('Young age, high motivation, no comorbidities');
    expect(a.clinicalReasoning).toBe('Impairment-driven approach targeting ROM and strength');
  });

  it('sequential updates overwrite previous values', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('assessment', 'prognosis', 'Fair');
    updateField('assessment', 'prognosis', 'Good');
    updateField('assessment', 'prognosis', 'Excellent');
    expect(get(noteDraft).assessment.prognosis).toBe('Excellent');
  });

  it('updates to one field do not overwrite another', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('assessment', 'ptDiagnosis', 'Rotator cuff tendinopathy');
    updateField('assessment', 'prognosis', 'Good');
    const a = get(noteDraft).assessment;
    expect(a.ptDiagnosis).toBe('Rotator cuff tendinopathy');
    expect(a.prognosis).toBe('Good');
  });

  it('updateSection sets multiple fields at once', async () => {
    const { updateSection, noteDraft } = await import('$lib/stores/noteSession');
    updateSection('assessment', {
      ptDiagnosis: 'Cervical strain',
      prognosis: 'Fair',
      clinicalReasoning: 'Pain-limited progression',
    });
    const a = get(noteDraft).assessment;
    expect(a.ptDiagnosis).toBe('Cervical strain');
    expect(a.prognosis).toBe('Fair');
    expect(a.clinicalReasoning).toBe('Pain-limited progression');
  });

  it('clearDraft resets assessment to empty object', async () => {
    const { updateField, clearDraft, noteDraft } = await import('$lib/stores/noteSession');
    updateField('assessment', 'ptDiagnosis', 'Lateral epicondylitis');
    updateField('assessment', 'prognosis', 'Good');
    updateField('assessment', 'clinicalReasoning', 'Progressive loading protocol');
    clearDraft();
    expect(get(noteDraft).assessment).toEqual({});
  });
});
