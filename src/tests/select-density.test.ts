// @vitest-environment jsdom

import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import RegionalAssessmentPicker from '$lib/components/RegionalAssessmentPicker.svelte';
import StandardizedAssessmentsPanel from '$lib/components/StandardizedAssessmentsPanel.svelte';

describe('shared select density variants', () => {
  it('renders standardized assessments without an instrument picker select', () => {
    render(StandardizedAssessmentsPanel, {
      assessments: [],
      onchange: vi.fn(),
    });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('Berg Balance Scale')).toBeInTheDocument();
  });

  it('renders regional assessment table selects with dense styling', () => {
    render(RegionalAssessmentPicker, {
      selectedRegions: ['knee'],
      arom: {},
      prom: {},
      rims: {},
      endFeel: {},
      mmt: {},
      specialTests: {},
      mmtCustomRows: {},
      onUpdate: vi.fn(),
    });

    const tableSelect = screen.getAllByRole('combobox')[0];
    expect(tableSelect).toHaveClass('ct-select');
    expect(tableSelect).toHaveClass('ct-select--dense');
  });
});
