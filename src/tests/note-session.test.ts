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

vi.mock('$lib/services/chartRecords', () => ({
  saveSignedNote: vi.fn(() => ({
    id: 'note_signed_1',
    status: 'signed',
    templateId: 'pt.eval.v1',
    version: 1,
  })),
}));

vi.mock('$lib/stores/chartRecords', () => ({
  refreshChartRecords: vi.fn(),
}));

import {
  noteDraft,
  dieteticsNoteDraft,
  isDirty,
  initDraft,
  updateField,
  updateSection,
  replaceSection,
  saveDraftNow,
  clearDraft,
  finalizeAndSaveSignedNote,
} from '$lib/stores/noteSession';

import { saveActiveDraft } from '$lib/stores/cases';
import { saveSignedNote } from '$lib/services/chartRecords';
import { refreshChartRecords } from '$lib/stores/chartRecords';

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

  it('initDraft preserves standardized assessments from an existing draft', async () => {
    vi.resetModules();
    vi.doMock('$lib/stores/cases', () => {
      const { writable } = require('svelte/store');
      const activeCase = writable({
        caseId: 'test-case',
        encounter: 'eval',
        caseWrapper: {
          caseObj: {
            encounters: {
              eval: {
                objective: {
                  text: 'Seed objective text',
                },
              },
            },
          },
        },
        draft: {
          objective: {
            standardizedAssessments: [
              {
                instrumentKey: 'berg-balance-scale',
                responses: {
                  sitting_to_standing: 4,
                  standing_unsupported: 4,
                  sitting_unsupported: 4,
                  standing_to_sitting: 4,
                  transfers: 4,
                  standing_eyes_closed: 4,
                  standing_feet_together: 4,
                  reaching_forward: 2,
                  retrieve_object_floor: 2,
                  turn_to_look_behind: 2,
                  turn_360: 2,
                  place_alternate_foot: 2,
                  tandem_stance: 2,
                  single_leg_stance: 2,
                },
              },
            ],
          },
        },
      });
      return {
        activeCase,
        saveActiveDraft: vi.fn(),
      };
    });
    const noteSession = await import('$lib/stores/noteSession');
    noteSession.clearDraft();
    noteSession.initDraft();
    const draft = get(noteSession.noteDraft);
    expect(draft.objective.text).toBe('Seed objective text');
    expect(draft.objective.standardizedAssessments).toHaveLength(1);
    expect(draft.objective.standardizedAssessments?.[0].instrumentKey).toBe('berg-balance-scale');
    expect(draft.objective.standardizedAssessments?.[0].scores.total).toBe(42);
    vi.resetModules();
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

  it('saveDraftNow persists standardized assessments inside objective', () => {
    initDraft();
    updateField('objective', 'standardizedAssessments', [
      {
        id: 'berg_1',
        discipline: 'pt',
        instrumentKey: 'berg-balance-scale',
        version: 1,
        title: 'Berg Balance Scale',
        status: 'in-progress',
        responses: {
          sitting_to_standing: 4,
          standing_unsupported: '',
        },
        scores: {
          total: 4,
          max: 56,
          completedItems: 1,
          totalItems: 14,
        },
        interpretation: '',
        notes: 'Observed mild sway',
        performedAt: '2026-03-27',
        assessor: 'Student PT',
      },
    ]);

    saveDraftNow();

    expect(saveActiveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        objective: expect.objectContaining({
          standardizedAssessments: expect.arrayContaining([
            expect.objectContaining({
              instrumentKey: 'berg-balance-scale',
              notes: 'Observed mild sway',
            }),
          ]),
        }),
      }),
    );
  });

  it('clearDraft resets to empty', () => {
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Something');
    clearDraft();

    const draft = get(noteDraft);
    expect(draft.subjective).toEqual({});
    expect(get(isDirty)).toBe(false);
  });

  it('finalizeAndSaveSignedNote signs, persists, refreshes, and clears the draft', () => {
    initDraft();
    updateField('subjective', 'chiefComplaint', 'Signed complaint');

    const envelope = finalizeAndSaveSignedNote('test-case', 'eval', {
      name: 'Jamie PT',
      title: 'DPT',
      signedAt: '2026-03-26T18:00:00.000Z',
      version: 1,
    });

    expect(saveSignedNote).toHaveBeenCalledTimes(1);
    expect(refreshChartRecords).toHaveBeenCalledTimes(1);
    expect(envelope.id).toBe('note_signed_1');
    expect(get(noteDraft).subjective).toEqual({});
    expect(get(isDirty)).toBe(false);
  });

  it('finalizeAndSaveSignedNote can persist an explicit dietetics note payload', () => {
    const dieteticsNote = {
      nutrition_assessment: {
        food_nutrition_history: 'Poor appetite for 3 days',
      },
      nutrition_diagnosis: {
        priority_diagnosis: 'Inadequate oral intake',
      },
      nutrition_intervention: {
        goals: 'Increase oral intake to >75% of meals',
      },
      nutrition_monitoring: {
        follow_up_plan: 'Reassess in 48 hours',
      },
      billing: {},
    };

    const envelope = finalizeAndSaveSignedNote(
      'test-case',
      'nutrition',
      {
        name: 'Jamie RD',
        title: 'RDN',
        signedAt: '2026-03-26T18:00:00.000Z',
        version: 1,
      },
      dieteticsNote,
    );

    expect(saveSignedNote).toHaveBeenCalledWith(
      'test-case',
      'nutrition',
      expect.objectContaining({
        nutrition_assessment: expect.objectContaining({
          food_nutrition_history: 'Poor appetite for 3 days',
        }),
      }),
      expect.anything(),
    );
    expect(envelope.id).toBe('note_signed_1');
    expect(get(dieteticsNoteDraft).nutrition_assessment).toEqual({});
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
