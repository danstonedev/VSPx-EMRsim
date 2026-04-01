/**
 * Chart Tab Configuration
 * Defines the icon-rail tabs for the Hybrid Two-Panel chart navigation.
 * Tabs are discipline-agnostic; phase field controls rollout gating.
 */

import { getChartTabs as getSharedChartTabs } from '../../../shared/chartTabs.js';

/**
 * Returns tabs available at the given phase level.
 * @param {number} [maxPhase=1] - Maximum phase to include (1, 2, or 3)
 * @returns {Array<{id: string, icon: string, label: string, phase: number}>}
 */
export function getChartTabs(maxPhase = 1) {
  return getSharedChartTabs(maxPhase).map((tab) => ({
    id: tab.id,
    icon: tab.legacyIcon,
    label: tab.label,
    phase: tab.phase,
  }));
}
