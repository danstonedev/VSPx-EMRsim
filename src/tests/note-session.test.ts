/**
 * Tests for the note session store.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';

// Mock the cases store before importing noteSession
vi.mock('$lib/stores/cases', () => {
  const { writable } = require('svelte/store');
  const activeCase = writable({
    caseId: 'test-case',
    encounter: 'eval',
    caseWrapper: {
      caseObj: {
        encounters: {
          eval: {
            subjective: {
              chiefComplaint: 'Right shoulder pain',
              painScale: '6',
            },
            objective: {
              text: 'Alert, cooperative',
              vitals: { bp: '120/80', hr: '72' },
            },
            assessment: {
              ptDiagnosis: 'Impingement syndrome',
              prognosis: 'good',
            },
            plan: {
              frequency: '2x/week',
              goalsTable: {
                goal_1: { goalText: 'Decrease pain to ≤3/10' },
              },
            },
          },
        },
      },
    },
    draft: null,
  });
  return {
    activeCase,
    saveActiveDraft: vi.fn(),
  };
});

import {
  noteDraft,
  isDirty,
  initDraft,
  updateField,
  updateSection,
  replaceSection,
  saveDraftNow,
  clearDraft,
} from '$lib/stores/noteSession';

import { saveActiveDraft } from '$lib/stores/cases';

describe('noteSession store', () => {
  beforeEach(() => {
    clearDraft();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearDraft();
  });

  it('starts with empty draft', () => {
    const draft = get(noteDraft);
    expect(draft.subjective).toEqual({});
    expect(draft.objective).toEqual({});
    expect(draft.assessment).toEqual({});
    expect(draft.plan).toEqual({});
    expect(draft.billing).toEqual({});
    expect(get(isDirty)).toBe(false);
  });

  it('initDraft merges encounter seed data', () => {
    initDraft();
    const draft = get(noteDraft);
    expect(draft.subjective.chiefComplaint).toBe('Right shoulder pain');
    expect(draft.subjective.painScale).toBe('6');
    expect(draft.objective.text).toBe('Alert, cooperative');
    expect((draft.objective.vitals as Record<string, string>).bp).toBe('120/80');
    expect(draft.assessment.ptDiagnosis).toBe('Impingement syndrome');
    expect(draft.plan.frequency).toBe('2x/week');
    expect(get(isDirty)).toBe(false);
  });

  it('updateField sets a single field and marks dirty', () => {
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Left knee pain');
    const draft = get(noteDraft);
    expect(draft.subjective.chiefComplaint).toBe('Left knee pain');
    expect(get(isDirty)).toBe(true);
  });

  it('updateField does not clobber other fields', () => {
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Updated');
    const draft = get(noteDraft);
    expect(draft.subjective.painScale).toBe('6');
  });

  it('updateSection merges multiple fields', () => {
    initDraft();
    updateSection('assessment', {
      ptDiagnosis: 'New diagnosis',
      prognosis: 'excellent',
    });
    const draft = get(noteDraft);
    expect(draft.assessment.ptDiagnosis).toBe('New diagnosis');
    expect(draft.assessment.prognosis).toBe('excellent');
  });

  it('replaceSection replaces entire section', () => {
    initDraft();
    replaceSection('billing', { diagnosisCodes: [{ code: 'M75.41' }] });
    const draft = get(noteDraft);
    expect(draft.billing.diagnosisCodes).toEqual([{ code: 'M75.41' }]);
    // Should NOT have old fields
    expect(Object.keys(draft.billing)).toEqual(['diagnosisCodes']);
  });

  it('saveDraftNow calls saveActiveDraft and clears dirty', () => {
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Test');
    expect(get(isDirty)).toBe(true);

    saveDraftNow();
    expect(saveActiveDraft).toHaveBeenCalledTimes(1);
    expect(get(isDirty)).toBe(false);
  });

  it('clearDraft resets to empty', () => {
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Something');
    clearDraft();

    const draft = get(noteDraft);
    expect(draft.subjective).toEqual({});
    expect(get(isDirty)).toBe(false);
  });

  it('auto-save triggers after delay', async () => {
    vi.useFakeTimers();
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Trigger auto-save');

    // Before timer fires
    expect(saveActiveDraft).not.toHaveBeenCalled();

    // Advance past auto-save delay
    vi.advanceTimersByTime(2000);

    expect(saveActiveDraft).toHaveBeenCalledTimes(1);
    expect(get(isDirty)).toBe(false);

    vi.useRealTimers();
  });
});
