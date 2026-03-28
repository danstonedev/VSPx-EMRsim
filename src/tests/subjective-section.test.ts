/**
 * Tests for SubjectiveData store logic — verifies that updateField, updateSection,
 * and clearDraft correctly manipulate the subjective section of the note draft.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock dependencies that noteSession imports at module level
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

describe('Subjective section — store data flow', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('updateField sets chiefComplaint on subjective section', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('subjective', 'chiefComplaint', 'Knee pain');
    const draft = get(noteDraft);
    expect(draft.subjective.chiefComplaint).toBe('Knee pain');
  });

  it('updateField sets painScale as a number', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('subjective', 'painScale', 7);
    const draft = get(noteDraft);
    expect(draft.subjective.painScale).toBe(7);
  });

  it('updateField sets painLocation as a string', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('subjective', 'painLocation', 'Left knee, anterior');
    expect(get(noteDraft).subjective.painLocation).toBe('Left knee, anterior');
  });

  it('stores and reads back qaItems array', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const qaItems = [
      { question: 'Onset?', response: '2 weeks ago' },
      { question: 'Mechanism?', response: 'Twisting injury during soccer' },
    ];
    updateField('subjective', 'qaItems', qaItems);
    const result = get(noteDraft).subjective.qaItems;
    expect(result).toHaveLength(2);
    expect(result![0].question).toBe('Onset?');
    expect(result![1].response).toBe('Twisting injury during soccer');
  });

  it('appending to qaItems preserves existing entries', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('subjective', 'qaItems', [{ question: 'Q1', response: 'R1' }]);
    // Simulate adding another pair
    const existing = get(noteDraft).subjective.qaItems ?? [];
    updateField('subjective', 'qaItems', [...existing, { question: 'Q2', response: 'R2' }]);
    expect(get(noteDraft).subjective.qaItems).toHaveLength(2);
  });

  it('stores redFlagScreening array with status changes', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const screening = [
      { item: 'Saddle anesthesia', status: 'not-screened' as const },
      { item: 'Bowel/bladder changes', status: 'negative' as const },
    ];
    updateField('subjective', 'redFlagScreening', screening);
    let flags = get(noteDraft).subjective.redFlagScreening!;
    expect(flags[0].status).toBe('not-screened');

    // Simulate updating a flag status
    const updated = flags.map((f, i) => (i === 0 ? { ...f, status: 'positive' as const } : f));
    updateField('subjective', 'redFlagScreening', updated);
    flags = get(noteDraft).subjective.redFlagScreening!;
    expect(flags[0].status).toBe('positive');
    expect(flags[1].status).toBe('negative');
  });

  it('multiple field updates accumulate within subjective', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('subjective', 'chiefComplaint', 'Low back pain');
    updateField('subjective', 'painScale', 5);
    updateField('subjective', 'aggravatingFactors', 'Sitting > 30 min');
    const s = get(noteDraft).subjective;
    expect(s.chiefComplaint).toBe('Low back pain');
    expect(s.painScale).toBe(5);
    expect(s.aggravatingFactors).toBe('Sitting > 30 min');
  });

  it('clearDraft resets subjective to empty object', async () => {
    const { updateField, clearDraft, noteDraft } = await import('$lib/stores/noteSession');
    updateField('subjective', 'chiefComplaint', 'Shoulder impingement');
    updateField('subjective', 'painScale', 8);
    clearDraft();
    const draft = get(noteDraft);
    expect(draft.subjective).toEqual({});
  });
});
