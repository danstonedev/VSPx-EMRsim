/**
 * UI state store — tracks the active chart rail tab, panel open state, etc.
 */

import { writable } from 'svelte/store';

export type ChartTab = 'current-note' | 'patient-summary' | 'my-notes' | 'case-file';

export const activeChartTab = writable<ChartTab | null>(null);
export const isPanelOpen = writable(false);
export const panelWidth = writable(360);

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
