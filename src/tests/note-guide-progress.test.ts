// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import SidebarProgressTracker from '$lib/components/SidebarProgressTracker.svelte';
import { ptDisciplineConfig } from '$lib/config/ptDisciplineConfig';
import {
  createAssessmentInstance,
  getAssessmentDefinition,
  normalizeAssessmentInstance,
} from '$lib/config/standardizedAssessments';
import { getProgressSubsectionStatus } from '$lib/services/progressTracker';
import { clearDraft, dieteticsNoteDraft, noteDraft } from '$lib/stores/noteSession';

describe('Note Guide progress logic', () => {
  afterEach(() => {
    clearDraft();
  });

  it('treats deferred communication review as complete when a deferral reason is documented', () => {
    const draft = {
      objective: {
        systemsReview: {
          communication: {
            status: 'wnl',
            subcategories: {},
            deferReason: 'not-indicated',
            deferReasons: {},
          },
        },
      },
    };

    expect(
      getProgressSubsectionStatus(
        ptDisciplineConfig,
        draft,
        'objective',
        'communication-cognition',
      ),
    ).toBe('complete');
  });

  it('treats partially scored standardized assessments as in progress until the instrument is fully scored', () => {
    const partialAssessment = createAssessmentInstance('berg-balance-scale', {
      responses: {
        sitting_to_standing: 4,
      },
    });
    const definition = getAssessmentDefinition('berg-balance-scale');

    if (!partialAssessment || !definition) {
      throw new Error('Failed to build Berg Balance Scale assessment fixtures');
    }

    const completeAssessment = normalizeAssessmentInstance({
      instrumentKey: definition.key,
      responses: Object.fromEntries(definition.items.map((item) => [item.id, 4])),
    });

    if (!completeAssessment) {
      throw new Error('Failed to normalize complete Berg Balance Scale assessment');
    }

    expect(
      getProgressSubsectionStatus(
        ptDisciplineConfig,
        { objective: { standardizedAssessments: [partialAssessment] } },
        'objective',
        'standardized-assessments',
      ),
    ).toBe('partial');

    expect(
      getProgressSubsectionStatus(
        ptDisciplineConfig,
        { objective: { standardizedAssessments: [completeAssessment] } },
        'objective',
        'standardized-assessments',
      ),
    ).toBe('complete');
  });

  it('uses structured order descriptions when calculating billing progress', () => {
    const draft = {
      billing: {
        ordersReferrals: [
          {
            type: 'Order',
            description: 'Lumbar spine radiographs',
            linkedDiagnosisCode: 'M54.50',
          },
        ],
      },
    };

    expect(
      getProgressSubsectionStatus(ptDisciplineConfig, draft, 'billing', 'orders-referrals'),
    ).toBe('complete');
  });

  it('requires both goal text and timeframe before goals count as complete', () => {
    const draft = {
      plan: {
        goals: [{ goal: 'Walk 400 feet with LRAD', timeframe: '', icfDomain: 'activity' }],
      },
    };

    expect(getProgressSubsectionStatus(ptDisciplineConfig, draft, 'plan', 'goal-setting')).toBe(
      'partial',
    );
  });
});

describe('SidebarProgressTracker', () => {
  afterEach(() => {
    clearDraft();
  });

  it('renders the sidebar as a section navigator without the old progress overview card', () => {
    render(SidebarProgressTracker, {
      activeSection: 'subjective',
      activeSubsection: null,
      mode: 'pt',
      draft: {
        subjective: {},
        objective: {},
        assessment: {},
        plan: {},
        billing: {},
      },
    });

    expect(screen.queryByLabelText(/progress overview/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /next recommended checkpoint/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /physical therapy section navigation/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subjective/i })).toBeInTheDocument();
  });

  it('uses the dietetics draft store when rendered in dietetics mode without an explicit draft prop', () => {
    noteDraft.set({
      subjective: {
        chiefComplaint: 'Knee pain',
        historyOfPresentIllness: 'Pain started after hiking',
        functionalLimitations: 'Unable to descend stairs',
        additionalHistory: 'History of OA',
        priorLevel: 'Independent community ambulation',
        patientGoals: 'Return to hiking',
      },
      objective: {},
      assessment: {},
      plan: {},
      billing: {},
    });
    dieteticsNoteDraft.set({
      nutrition_assessment: {},
      nutrition_diagnosis: { pes_statements: [{ problem: '', etiology: '', signs_symptoms: '' }] },
      nutrition_intervention: {},
      nutrition_monitoring: {},
      billing: {},
    });

    render(SidebarProgressTracker, {
      activeSection: 'nutrition-assessment',
      activeSubsection: null,
      mode: 'dietetics',
    });

    expect(screen.queryByLabelText(/progress overview/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /dietetics section navigation/i }),
    ).toBeInTheDocument();
  });
});
