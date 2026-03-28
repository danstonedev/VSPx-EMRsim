import { describe, expect, it } from 'vitest';
import {
  computeTotal,
  countCompletedItems,
  createAssessmentInstance,
  formatAssessmentScoreSummary,
  getAssessmentDefinition,
  listAssessmentDefinitions,
  normalizeAssessmentInstance,
  normalizeScoreValue,
  normalizeStandardizedAssessments,
} from '$lib/config/standardizedAssessments';

describe('standardized assessments config', () => {
  it('getAssessmentDefinition returns Berg with 14 items', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    expect(def?.items).toHaveLength(14);
  });

  it('getAssessmentDefinition returns null for unknown key', () => {
    expect(getAssessmentDefinition('nonexistent')).toBeNull();
  });

  it('listAssessmentDefinitions returns at least one entry', () => {
    expect(listAssessmentDefinitions().length).toBeGreaterThan(0);
  });

  it('normalizeScoreValue converts valid string scores', () => {
    expect(normalizeScoreValue('3', 0, 4)).toBe(3);
  });

  it('normalizeScoreValue preserves empty string as empty', () => {
    expect(normalizeScoreValue('', 0, 4)).toBe('');
  });

  it('normalizeScoreValue rejects out of range values', () => {
    expect(normalizeScoreValue('5', 0, 4)).toBe('');
  });

  it('normalizeScoreValue rejects null', () => {
    expect(normalizeScoreValue(null, 0, 4)).toBe('');
  });

  it('normalizeScoreValue rejects NaN', () => {
    expect(normalizeScoreValue(Number.NaN, 0, 4)).toBe('');
  });

  it('createAssessmentInstance returns a full assessment object', () => {
    const assessment = createAssessmentInstance('berg-balance-scale');
    expect(assessment).toMatchObject({
      instrumentKey: 'berg-balance-scale',
      title: 'Berg Balance Scale',
      discipline: 'pt',
    });
    expect(assessment?.id).toBeTruthy();
    expect(assessment?.responses).toBeTruthy();
    expect(assessment?.scores).toBeTruthy();
  });

  it('createAssessmentInstance starts in progress with 14 total items', () => {
    const assessment = createAssessmentInstance('berg-balance-scale');
    expect(assessment?.status).toBe('in-progress');
    expect(assessment?.scores.totalItems).toBe(14);
  });

  it('computeTotal sums all 4s to 56', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const responses = Object.fromEntries(def.items.map((item) => [item.id, 4])) as Record<
      string,
      number | ''
    >;

    expect(computeTotal(def, responses)).toBe(56);
  });

  it('computeTotal sums mixed scores correctly', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const responses = Object.fromEntries(
      def.items.map((item, index) => [item.id, index < 7 ? 4 : 2]),
    ) as Record<string, number | ''>;

    expect(computeTotal(def, responses)).toBe(42);
  });

  it('countCompletedItems counts all completed responses', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const responses = Object.fromEntries(def.items.map((item) => [item.id, 1])) as Record<
      string,
      number | ''
    >;

    expect(countCompletedItems(def, responses)).toBe(14);
  });

  it('countCompletedItems counts partial responses correctly', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const responses = Object.fromEntries(
      def.items.map((item, index) => [item.id, index < 5 ? 1 : '']),
    ) as Record<string, number | ''>;

    expect(countCompletedItems(def, responses)).toBe(5);
  });

  it('normalizeAssessmentInstance marks all 4s as complete with low fall risk', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const normalized = normalizeAssessmentInstance({
      instrumentKey: def.key,
      responses: Object.fromEntries(def.items.map((item) => [item.id, 4])),
    });

    expect(normalized?.status).toBe('complete');
    expect(normalized?.interpretation).toBe('Low fall risk');
  });

  it('normalizeAssessmentInstance maps total 42 to increased fall risk', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const normalized = normalizeAssessmentInstance({
      instrumentKey: def.key,
      responses: Object.fromEntries(def.items.map((item, index) => [item.id, index < 7 ? 4 : 2])),
    });

    expect(normalized?.scores.total).toBe(42);
    expect(normalized?.interpretation).toBe('Increased fall risk');
  });

  it('normalizeAssessmentInstance maps total 30 to high fall risk', () => {
    const def = getAssessmentDefinition('berg-balance-scale');
    if (!def) throw new Error('Missing Berg definition');

    const normalized = normalizeAssessmentInstance({
      instrumentKey: def.key,
      responses: Object.fromEntries(def.items.map((item, index) => [item.id, index < 2 ? 3 : 2])),
    });

    expect(normalized?.scores.total).toBe(30);
    expect(normalized?.interpretation).toBe('High fall risk');
  });

  it('formatAssessmentScoreSummary includes interpretation when present', () => {
    const assessment = normalizeAssessmentInstance({
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
    });

    if (!assessment) throw new Error('Assessment failed to normalize');
    expect(formatAssessmentScoreSummary(assessment)).toBe('42/56 - Increased fall risk');
  });

  it('formatAssessmentScoreSummary returns score only when no interpretation', () => {
    const assessment = createAssessmentInstance('berg-balance-scale');
    if (!assessment) throw new Error('Assessment failed to create');

    expect(formatAssessmentScoreSummary(assessment)).toBe('0/56');
  });

  it('normalizeStandardizedAssessments filters unknown instruments', () => {
    const normalized = normalizeStandardizedAssessments([
      { instrumentKey: 'berg-balance-scale' },
      { instrumentKey: 'bad-key' },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].instrumentKey).toBe('berg-balance-scale');
  });
});
