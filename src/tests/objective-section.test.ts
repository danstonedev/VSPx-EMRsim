/**
 * Tests for ObjectiveData store logic — verifies vitals, nested fields,
 * regional assessments, special tests, and string field updates.
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

describe('Objective section — store data flow', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('updateField stores vitals as a nested object', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('objective', 'vitals', { bp: '120/80', hr: '72', rr: '16' });
    const vitals = get(noteDraft).objective.vitals;
    expect(vitals).toEqual({ bp: '120/80', hr: '72', rr: '16' });
  });

  it('updateField stores inspection nested object', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('objective', 'inspection', { visual: 'Antalgic gait, guarded posture' });
    expect(get(noteDraft).objective.inspection?.visual).toBe('Antalgic gait, guarded posture');
  });

  it('updateField stores palpation nested object', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('objective', 'palpation', { findings: 'Tenderness over L4-L5 spinous processes' });
    expect(get(noteDraft).objective.palpation?.findings).toBe(
      'Tenderness over L4-L5 spinous processes',
    );
  });

  it('stores regional assessments with ROM indexed map', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const assessments = {
      arom: {
        'L knee flexion': '0-110 deg',
        'L knee extension': '0 deg',
      },
      mmt: {
        'L quad': '4/5',
        'L hamstring': '3+/5',
      },
    };
    updateField('objective', 'regionalAssessments', assessments);
    const ra = get(noteDraft).objective.regionalAssessments!;
    expect(ra.arom!['L knee flexion']).toBe('0-110 deg');
    expect(ra.mmt!['L hamstring']).toBe('3+/5');
  });

  it('stores special tests with left/right/notes structure', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const assessments = {
      specialTests: {
        'Lachman L': 'positive',
        'Lachman L:notes': 'Soft endpoint L',
        'Lachman R': 'negative',
        'McMurray L': 'negative',
        'McMurray R': 'negative',
        'McMurray R:notes': '',
      },
    };
    updateField('objective', 'regionalAssessments', assessments);
    const st = get(noteDraft).objective.regionalAssessments!.specialTests!;
    expect(st['Lachman L']).toBe('positive');
    expect(st['Lachman L:notes']).toBe('Soft endpoint L');
    expect(st['McMurray R']).toBe('negative');
  });

  it('stores string fields: tone, coordination, balance', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('objective', 'tone', 'Normal');
    updateField('objective', 'coordination', 'Intact bilateral UE/LE');
    updateField('objective', 'balance', 'Impaired single-leg stance L');
    const o = get(noteDraft).objective;
    expect(o.tone).toBe('Normal');
    expect(o.coordination).toBe('Intact bilateral UE/LE');
    expect(o.balance).toBe('Impaired single-leg stance L');
  });

  it('stores text field for general observation', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('objective', 'text', 'Patient alert and oriented x4');
    expect(get(noteDraft).objective.text).toBe('Patient alert and oriented x4');
  });

  it('clearDraft resets objective to empty object', async () => {
    const { updateField, clearDraft, noteDraft } = await import('$lib/stores/noteSession');
    updateField('objective', 'vitals', { bp: '130/85' });
    updateField('objective', 'tone', 'Increased');
    clearDraft();
    expect(get(noteDraft).objective).toEqual({});
  });
});
