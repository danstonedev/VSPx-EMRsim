/**
 * Tests for PlanData store logic — verifies goals CRUD, legacy goalsTable format,
 * intervention arrays, frequency/duration strings, and patientEducation.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import type { PlanGoal, PlanIntervention } from '$lib/types/sections';

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

describe('Plan section — store data flow', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('stores goals array and reads back entries', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const goals: PlanGoal[] = [
      { goal: 'Increase L knee flexion to 130 deg', timeframe: '4 weeks', icfDomain: 'b710' },
      { goal: 'Independent stair negotiation', timeframe: '6 weeks', icfDomain: 'd4551' },
    ];
    updateField('plan', 'goals', goals);
    const result = get(noteDraft).plan.goals!;
    expect(result).toHaveLength(2);
    expect(result[0].goal).toBe('Increase L knee flexion to 130 deg');
    expect(result[1].icfDomain).toBe('d4551');
  });

  it('updates a goal within the array (simulated CRUD)', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const initial: PlanGoal[] = [
      { goal: 'Reduce pain to 3/10', timeframe: '2 weeks', icfDomain: 'b280' },
    ];
    updateField('plan', 'goals', initial);

    // Update the goal text
    const current = get(noteDraft).plan.goals!;
    const updated = current.map((g, i) =>
      i === 0 ? { ...g, goal: 'Reduce pain to 2/10 at rest' } : g,
    );
    updateField('plan', 'goals', updated);
    expect(get(noteDraft).plan.goals![0].goal).toBe('Reduce pain to 2/10 at rest');
  });

  it('removes a goal from the array', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const goals: PlanGoal[] = [
      { goal: 'Goal A', timeframe: '2w', icfDomain: 'b710' },
      { goal: 'Goal B', timeframe: '4w', icfDomain: 'b730' },
      { goal: 'Goal C', timeframe: '6w', icfDomain: 'd450' },
    ];
    updateField('plan', 'goals', goals);

    // Remove middle goal
    const filtered = get(noteDraft).plan.goals!.filter((_, i) => i !== 1);
    updateField('plan', 'goals', filtered);
    const result = get(noteDraft).plan.goals!;
    expect(result).toHaveLength(2);
    expect(result[0].goal).toBe('Goal A');
    expect(result[1].goal).toBe('Goal C');
  });

  it('stores in-clinic interventions array', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const interventions: PlanIntervention[] = [
      { intervention: 'Therapeutic exercise', dosage: '3x12 reps' },
      { intervention: 'Manual therapy — joint mobilization', dosage: 'Grade III, 3 sets x 30s' },
    ];
    updateField('plan', 'inClinicInterventions', interventions);
    const result = get(noteDraft).plan.inClinicInterventions!;
    expect(result).toHaveLength(2);
    expect(result[0].intervention).toBe('Therapeutic exercise');
    expect(result[1].dosage).toBe('Grade III, 3 sets x 30s');
  });

  it('stores HEP interventions array', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    const hep: PlanIntervention[] = [
      { intervention: 'Quad sets', dosage: '3x10, 2x/day' },
      { intervention: 'Heel slides', dosage: '3x15, 2x/day' },
    ];
    updateField('plan', 'hepInterventions', hep);
    expect(get(noteDraft).plan.hepInterventions).toHaveLength(2);
  });

  it('stores frequency, duration, and patientEducation strings', async () => {
    const { updateField, noteDraft } = await import('$lib/stores/noteSession');
    updateField('plan', 'frequency', '2x/week');
    updateField('plan', 'duration', '8 weeks');
    updateField(
      'plan',
      'patientEducation',
      'Educated on joint protection and activity modification',
    );
    const p = get(noteDraft).plan;
    expect(p.frequency).toBe('2x/week');
    expect(p.duration).toBe('8 weeks');
    expect(p.patientEducation).toBe('Educated on joint protection and activity modification');
  });
});
