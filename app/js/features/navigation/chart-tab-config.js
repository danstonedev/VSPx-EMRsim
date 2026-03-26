/**
 * Chart Tab Configuration
 * Defines the icon-rail tabs for the Hybrid Two-Panel chart navigation.
 * Tabs are discipline-agnostic; phase field controls rollout gating.
 */

const CHART_TABS = [
  { id: 'patient-summary', icon: 'user', label: 'Patient Profile', phase: 1 },
  { id: 'current-note', icon: 'edit', label: 'Current Note', phase: 1 },
  { id: 'my-notes', icon: 'assignment', label: 'My Notes', phase: 1 },
  { id: 'case-file', icon: 'folder', label: 'Case File', phase: 1 },
  { id: 'medications', icon: 'medication', label: 'Meds', phase: 2 },
  { id: 'problems', icon: 'list-alt', label: 'Problems', phase: 2 },
  { id: 'vitals', icon: 'monitor-heart', label: 'Vitals', phase: 2 },
  { id: 'results', icon: 'science', label: 'Results', phase: 2 },
  { id: 'orders', icon: 'assignment', label: 'Orders', phase: 3 },
];

/**
 * Returns tabs available at the given phase level.
 * @param {number} [maxPhase=1] - Maximum phase to include (1, 2, or 3)
 * @returns {Array<{id: string, icon: string, label: string, phase: number}>}
 */
export function getChartTabs(maxPhase = 1) {
  return CHART_TABS.filter((tab) => tab.phase <= maxPhase);
}
