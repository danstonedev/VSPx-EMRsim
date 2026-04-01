// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ObjectiveSection from '$lib/components/ObjectiveSection.svelte';
import StandardizedAssessmentsPanel from '$lib/components/StandardizedAssessmentsPanel.svelte';
import {
  createAssessmentInstance,
  normalizeAssessmentInstance,
  type AssessmentInstance,
} from '$lib/config/standardizedAssessments';
import { clearDraft } from '$lib/stores/noteSession';

function buildAssessment(
  key: string,
  overrides: Partial<AssessmentInstance> = {},
): AssessmentInstance {
  const assessment = createAssessmentInstance(key, overrides);
  if (!assessment) {
    throw new Error(`Failed to create assessment for ${key}`);
  }

  return assessment;
}

describe('StandardizedAssessmentsPanel', { timeout: 20000 }, () => {
  afterEach(() => {
    clearDraft();
  });

  it('renders all PT instrument cards and no add controls', () => {
    const { container } = render(StandardizedAssessmentsPanel, {
      assessments: [],
      onchange: vi.fn(),
    });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add assessment/i })).not.toBeInTheDocument();
    expect(screen.getByText('Berg Balance Scale')).toBeInTheDocument();
    expect(screen.getByText('Timed Up and Go (TUG)')).toBeInTheDocument();
    expect(screen.getByText('10-Meter Walk Test (10MWT)')).toBeInTheDocument();
    expect(screen.getByText('6-Minute Walk Test (6MWT)')).toBeInTheDocument();
    expect(screen.getByText('Lower Extremity Functional Scale (LEFS)')).toBeInTheDocument();
    expect(screen.getByText('Neck Disability Index (NDI)')).toBeInTheDocument();
    expect(screen.getByText('Oswestry Disability Index (ODI)')).toBeInTheDocument();
    expect(
      screen.getByText('Activities-specific Balance Confidence (ABC) Scale'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Not started')).toHaveLength(8);
    expect(container.querySelectorAll('.sa-card__toggle[aria-expanded="false"]')).toHaveLength(8);
  });

  it('expanding a card does not persist an assessment', async () => {
    const onchange = vi.fn();
    render(StandardizedAssessmentsPanel, {
      assessments: [],
      onchange,
    });

    const bergToggle = screen.getByRole('button', { name: /berg balance scale/i });
    await fireEvent.click(bergToggle);

    expect(bergToggle).toHaveAttribute('aria-expanded', 'true');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('does not persist an untouched numeric instrument on empty blur', async () => {
    const onchange = vi.fn();
    render(StandardizedAssessmentsPanel, {
      assessments: [],
      onchange,
    });

    await fireEvent.click(screen.getByRole('button', { name: /timed up and go/i }));

    const timeField = screen.getByRole('textbox', { name: /time/i });
    await fireEvent.blur(timeField, { target: { value: '' } });

    expect(onchange).not.toHaveBeenCalled();
  });

  it('creates a sparse persisted instance on first scoring interaction', async () => {
    const onchange = vi.fn();
    render(StandardizedAssessmentsPanel, {
      assessments: [],
      onchange,
    });

    await fireEvent.click(screen.getByRole('button', { name: /berg balance scale/i }));
    await fireEvent.click(screen.getByRole('button', { name: /sitting to standing score 4/i }));

    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.lastCall?.[0]).toEqual([
      expect.objectContaining({
        instrumentKey: 'berg-balance-scale',
        status: 'in-progress',
        responses: expect.objectContaining({
          sitting_to_standing: 4,
        }),
        scores: expect.objectContaining({
          total: 4,
          completedItems: 1,
          totalItems: 14,
        }),
      }),
    ]);
  });

  it(
    'updates the collapsed header summary for a partially scored instrument',
    { timeout: 10000 },
    async () => {
      const onchange = vi.fn();
      const { rerender } = render(StandardizedAssessmentsPanel, {
        assessments: [],
        onchange,
      });

      await fireEvent.click(screen.getByRole('button', { name: /berg balance scale/i }));
      await fireEvent.click(screen.getByRole('button', { name: /sitting to standing score 4/i }));

      await rerender({
        assessments: onchange.mock.lastCall?.[0] ?? [],
        onchange,
      });

      expect(screen.getByText('In progress')).toBeInTheDocument();
      expect(screen.getByText('Score 4/56')).toBeInTheDocument();
      expect(screen.getByText('1/14 items')).toBeInTheDocument();
    },
  );

  it('hydrates saved assessments and shows complete interpreted summaries', () => {
    const bergComplete = normalizeAssessmentInstance({
      instrumentKey: 'berg-balance-scale',
      responses: {
        sitting_to_standing: 4,
        standing_unsupported: 4,
        sitting_unsupported: 4,
        standing_to_sitting: 4,
        transfers: 4,
        standing_eyes_closed: 4,
        standing_feet_together: 4,
        reaching_forward: 4,
        retrieve_object_floor: 4,
        turn_to_look_behind: 4,
        turn_360: 4,
        place_alternate_foot: 4,
        tandem_stance: 4,
        single_leg_stance: 4,
      },
    });

    if (!bergComplete) {
      throw new Error('Failed to build complete Berg assessment');
    }

    render(StandardizedAssessmentsPanel, {
      assessments: [bergComplete],
      onchange: vi.fn(),
    });

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getAllByText('56/56 - Low fall risk').length).toBeGreaterThan(0);
    expect(screen.getByText('14/14 items')).toBeInTheDocument();
  });

  it('resets only the selected instrument and returns it to not started after rerender', async () => {
    const onchange = vi.fn();
    const berg = buildAssessment('berg-balance-scale', {
      responses: {
        sitting_to_standing: 4,
      },
    });
    const tug = buildAssessment('timed-up-and-go', {
      responses: {
        time: 12,
      },
    });
    const { rerender } = render(StandardizedAssessmentsPanel, {
      assessments: [berg, tug],
      onchange,
    });

    await fireEvent.click(screen.getByRole('button', { name: /reset berg balance scale/i }));

    expect(onchange.mock.lastCall?.[0]).toHaveLength(1);
    expect(onchange.mock.lastCall?.[0][0]).toEqual(
      expect.objectContaining({ instrumentKey: 'timed-up-and-go' }),
    );

    await rerender({
      assessments: onchange.mock.lastCall?.[0] ?? [],
      onchange,
    });

    const bergCard = screen
      .getByText('Berg Balance Scale')
      .closest('.sa-card') as HTMLElement | null;
    if (!bergCard) {
      throw new Error('Unable to locate Berg card');
    }

    expect(within(bergCard).getByText('Not started')).toBeInTheDocument();
    expect(
      within(bergCard).queryByRole('button', { name: /reset berg balance scale/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the subsection without the old add/defer gate in ObjectiveSection', () => {
    const { container } = render(ObjectiveSection);
    const subsection = container.querySelector(
      '[data-subsection="standardized-assessments"]',
    ) as HTMLElement | null;

    if (!subsection) {
      throw new Error('Unable to locate standardized assessments subsection');
    }

    expect(subsection.querySelector('.stb')).toBeNull();
    expect(within(subsection).getByText('Berg Balance Scale')).toBeInTheDocument();
  });
});
