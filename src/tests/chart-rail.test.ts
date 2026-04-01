// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';

import ChartRail from '$lib/components/ChartRail.svelte';
import { activeChartTab, closePanel, isPanelOpen } from '$lib/stores/ui';

describe('ChartRail', () => {
  beforeEach(() => {
    closePanel();
  });

  it('renders the supported chart tabs with canonical labels', () => {
    render(ChartRail);

    expect(screen.getByRole('tab', { name: 'Note Guide' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Patient Profile' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Note History' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Shared Case File' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Shared File' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'My Notes' })).not.toBeInTheDocument();
  });

  it('updates active state and toggles the panel when tabs are clicked', async () => {
    render(ChartRail);

    const patientTab = screen.getByRole('tab', { name: 'Patient Profile' });
    await fireEvent.click(patientTab);

    expect(patientTab).toHaveAttribute('aria-selected', 'true');
    expect(get(activeChartTab)).toBe('patient-summary');
    expect(get(isPanelOpen)).toBe(true);

    await fireEvent.click(patientTab);

    expect(get(activeChartTab)).toBeNull();
    expect(get(isPanelOpen)).toBe(false);
  });

  it('supports roving keyboard navigation', async () => {
    render(ChartRail);

    const noteGuideTab = screen.getByRole('tab', { name: 'Note Guide' });
    const patientTab = screen.getByRole('tab', { name: 'Patient Profile' });
    const sharedCaseFileTab = screen.getByRole('tab', { name: 'Shared Case File' });

    noteGuideTab.focus();
    await fireEvent.keyDown(noteGuideTab, { key: 'ArrowDown' });
    expect(patientTab).toHaveFocus();

    await fireEvent.keyDown(patientTab, { key: 'End' });
    expect(sharedCaseFileTab).toHaveFocus();
  });
});
