// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';

import ChartDetailPanelHarness from './fixtures/ChartDetailPanelHarness.svelte';
import {
  activeChartTab,
  CHART_PANEL_WIDTH_DEFAULT,
  CHART_PANEL_WIDTH_STORAGE_KEY,
  closePanel,
  isPanelOpen,
  openTab,
  panelWidth,
} from '$lib/stores/ui';

describe('ChartDetailPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    closePanel();
    panelWidth.set(CHART_PANEL_WIDTH_DEFAULT);
  });

  it('renders a header with the active tab label and closes from the header button', async () => {
    openTab('case-file');
    render(ChartDetailPanelHarness);

    expect(screen.getByRole('heading', { name: 'Shared Case File' })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Close Shared Case File' }));

    expect(get(activeChartTab)).toBeNull();
    expect(get(isPanelOpen)).toBe(false);
  });

  it('closes when escape is pressed', async () => {
    openTab('patient-summary');
    render(ChartDetailPanelHarness);

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(get(activeChartTab)).toBeNull();
    expect(get(isPanelOpen)).toBe(false);
  });

  it('restores a persisted width from localStorage on mount', async () => {
    localStorage.setItem(CHART_PANEL_WIDTH_STORAGE_KEY, '420');
    openTab('current-note');
    const { container } = render(ChartDetailPanelHarness);

    await waitFor(() => {
      const panel = container.querySelector('.chart-detail-panel');
      expect(panel).toHaveStyle('width: 420px');
    });
  });

  it('persists resized width after dragging the resize handle', async () => {
    openTab('current-note');
    const { container } = render(ChartDetailPanelHarness);
    const handle = container.querySelector('.chart-detail__resize-handle');

    if (!handle) {
      throw new Error('Expected resize handle to be rendered');
    }

    await fireEvent.pointerDown(handle, { clientX: 100 });
    await fireEvent.pointerMove(window, { clientX: 160 });
    await fireEvent.pointerUp(window);

    expect(get(panelWidth)).toBe(420);
    expect(localStorage.getItem(CHART_PANEL_WIDTH_STORAGE_KEY)).toBe('420');
  });
});
