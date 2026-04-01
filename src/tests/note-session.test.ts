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

  it('initDraft seeds registry-linked PT notes with patient history when subjective is blank', async () => {
    vi.resetModules();
    vi.doMock('$lib/stores/cases', () => {
      const { writable } = require('svelte/store');
      const activeCase = writable({
        caseId: 'registry-case',
        encounter: 'eval',
        caseWrapper: {
          caseObj: {
            patientAge: '61',
            patientGender: 'male',
            meta: { vspId: 'vsp_123', patientName: 'James Rivera', sex: 'male' },
            history: {},
            encounters: { eval: {} },
          },
        },
        draft: { subjective: {} },
      });
      return {
        activeCase,
        saveActiveDraft: vi.fn(),
      };
    });
    vi.doMock('$lib/services/vspRegistry', () => ({
      resolvePatient: vi.fn(() => ({
        id: 'vsp_123',
        dob: '1965-07-23',
        sex: 'male',
        pronouns: 'he/him',
        preferredLanguage: 'English',
        interpreterNeeded: false,
        heightFt: '5',
        heightIn: '10',
        weightLbs: '212',
        primaryCareProvider: 'Dr. Michael Okafor',
        medicalHistory: ['Lumbar spinal stenosis', 'Chronic low back pain'],
        surgicalHistory: ['L4-L5 laminectomy (2024)'],
        allergies: [
          { name: 'Codeine', type: 'Medication', severity: 'Moderate', reaction: 'Nausea' },
        ],
        activeMedications: [{ name: 'Gabapentin', dose: '300 mg', frequency: 'TID', route: 'PO' }],
      })),
      normalizeSex: vi.fn((value: string) => {
        const normalized = String(value || '').toLowerCase();
        if (normalized === 'male' || normalized === 'm') return 'male';
        if (normalized === 'female' || normalized === 'f') return 'female';
        return 'unspecified';
      }),
      computeAge: vi.fn(() => 61),
      allergySummary: vi.fn(() => 'Codeine'),
    }));

    const noteSession = await import('$lib/stores/noteSession');
    noteSession.clearDraft();
    noteSession.initDraft();
    const draft = get(noteSession.noteDraft);

    expect(draft.subjective.chiefComplaint).toContain('Lumbar spinal stenosis');
    expect(draft.subjective.historyOfPresentIllness).toContain('presents for PT evaluation');
    expect(draft.subjective.additionalHistory).toContain('PMH: Lumbar spinal stenosis');
    expect(draft.subjective.additionalHistory).toContain(
      'Surgical history: L4-L5 laminectomy (2024)',
    );
    expect(draft.subjective.additionalHistory).toContain('Allergies: Codeine');
    expect(draft.subjective.medications).toHaveLength(1);
    expect(draft.subjective.__vspId).toBe('vsp_123');
    vi.resetModules();
  });

  it('initDraft layers the full demo note for Robert Castellano even when an older draft is sparse', async () => {
    vi.resetModules();
    vi.doMock('$lib/stores/cases', () => {
      const { writable } = require('svelte/store');
      const activeCase = writable({
        caseId: 'demo-case',
        encounter: 'eval',
        caseWrapper: {
          caseObj: {
            patientAge: '67',
            patientGender: 'male',
            meta: { vspId: 'vsp_demo_robert', patientName: 'Robert Castellano', sex: 'male' },
            history: {},
            encounters: { eval: {} },
          },
        },
        draft: {
          subjective: {
            patientName: 'Robert Castellano',
          },
        },
      });
      return {
        activeCase,
        saveActiveDraft: vi.fn(),
      };
    });
    vi.doMock('$lib/services/vspRegistry', () => ({
      resolvePatient: vi.fn(() => ({
        id: 'vsp_demo_robert',
        mrn: 'VSP-42652635',
        firstName: 'Robert',
        middleName: 'James',
        lastName: 'Castellano',
        preferredName: 'Bob',
        dob: '1958-04-12',
        sex: 'male',
        genderIdentity: 'man',
        pronouns: 'he/him',
        race: 'White',
        ethnicity: 'Not Hispanic or Latino',
        maritalStatus: 'Married',
        preferredLanguage: 'English',
        interpreterNeeded: false,
        heightFt: '5',
        heightIn: '10',
        weightLbs: '214',
        bloodType: 'A+',
        phone: '(701) 555-0147',
        email: 'rcastellano@email.com',
        addressStreet: '2418 University Ave',
        addressCity: 'Grand Forks',
        addressState: 'ND',
        addressZip: '58203',
        emergencyContactName: 'Linda Castellano',
        emergencyContactRelationship: 'Spouse',
        emergencyContactPhone: '(701) 555-0193',
        insuranceProvider: 'Blue Cross Blue Shield of North Dakota',
        insurancePolicyNumber: 'BCBS-88421076',
        insuranceGroupNumber: 'GRP-4420',
        allergies: [{ name: 'Penicillin', type: 'Drug', severity: 'Moderate', reaction: 'Rash' }],
        medicalHistory: [
          'Lumbar degenerative disc disease L4-L5',
          'Osteoarthritis bilateral knees',
        ],
        surgicalHistory: ['Right total knee arthroplasty (2024-01-15)'],
        activeMedications: [
          { name: 'Metformin', dose: '1000mg', frequency: 'BID', route: 'PO' },
          { name: 'Lisinopril', dose: '20mg', frequency: 'QD', route: 'PO' },
          { name: 'Gabapentin', dose: '300mg', frequency: 'TID', route: 'PO' },
        ],
        codeStatus: 'Full Code',
        primaryCareProvider: 'Dr. Sarah Lindgren, MD',
        createdAt: '2026-03-30T00:00:00.000Z',
        updatedAt: '2026-03-30T00:00:00.000Z',
      })),
      normalizeSex: vi.fn((value: string) => {
        const normalized = String(value || '').toLowerCase();
        if (normalized === 'male' || normalized === 'm') return 'male';
        if (normalized === 'female' || normalized === 'f') return 'female';
        return 'unspecified';
      }),
      computeAge: vi.fn(() => 67),
      allergySummary: vi.fn(() => 'Penicillin'),
      displayName: vi.fn(() => 'Robert James Castellano'),
    }));

    const noteSession = await import('$lib/stores/noteSession');
    noteSession.clearDraft();
    noteSession.initDraft();
    const draft = get(noteSession.noteDraft);

    expect(draft.subjective.chiefComplaint).toContain('Right knee');
    expect(draft.objective.standardizedAssessments).toHaveLength(1);
    expect(draft.plan.frequency).toBe('2x-week');
    expect(draft.billing.diagnosisCodes).toHaveLength(3);
    expect(draft.subjective.patientName).toBe('Robert Castellano');
    vi.resetModules();
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
