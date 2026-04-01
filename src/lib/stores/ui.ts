/**
 * UI state store — tracks the active chart rail tab, panel open state, etc.
 */

import { writable } from 'svelte/store';

export type ChartTab = 'current-note' | 'patient-summary' | 'my-notes' | 'case-file';

export const CHART_PANEL_WIDTH_STORAGE_KEY = 'chart-detail-panel-width-v1';
export const CHART_PANEL_WIDTH_DEFAULT = 360;
export const CHART_PANEL_WIDTH_MIN = 280;
export const CHART_PANEL_WIDTH_MAX = 560;

export function clampPanelWidth(width: number): number {
  return Math.min(CHART_PANEL_WIDTH_MAX, Math.max(CHART_PANEL_WIDTH_MIN, Math.round(width)));
}

export const activeChartTab = writable<ChartTab | null>(null);
export const isPanelOpen = writable(false);
export const panelWidth = writable(CHART_PANEL_WIDTH_DEFAULT);

/** Open a chart rail tab */
export function openTab(tab: ChartTab): void {
  activeChartTab.set(tab);
  isPanelOpen.set(true);
}

/** Close the chart detail panel */
export function closePanel(): void {
  isPanelOpen.set(false);
  activeChartTab.set(null);
}

/** Toggle a tab — close if already open, open otherwise */
export function toggleTab(tab: ChartTab): void {
  activeChartTab.update((current) => {
    if (current === tab) {
      isPanelOpen.set(false);
      return null;
    }
    isPanelOpen.set(true);
    return tab;
  });
}
