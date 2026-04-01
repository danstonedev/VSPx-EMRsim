/**
 * Shared chart-tab definitions used by both the legacy JS workspace shell and
 * the modern Svelte editor shell.
 */

/**
 * @typedef {'current-note' | 'patient-summary' | 'my-notes' | 'case-file' | 'medications' | 'problems' | 'vitals' | 'results' | 'orders'} SharedChartTabId
 */

/**
 * @typedef {{
 *   id: SharedChartTabId;
 *   label: string;
 *   phase: number;
 *   materialIcon: string;
 *   legacyIcon: string;
 * }} SharedChartTabDefinition
 */

/** @type {ReadonlyArray<SharedChartTabDefinition>} */
export const CHART_TABS = [
  {
    id: 'current-note',
    label: 'Note Guide',
    phase: 1,
    materialIcon: 'note_add',
    legacyIcon: 'edit',
  },
  {
    id: 'patient-summary',
    label: 'Patient Profile',
    phase: 1,
    materialIcon: 'person',
    legacyIcon: 'user',
  },
  {
    id: 'my-notes',
    label: 'Note History',
    phase: 1,
    materialIcon: 'library_books',
    legacyIcon: 'assignment',
  },
  {
    id: 'case-file',
    label: 'Shared Case File',
    phase: 1,
    materialIcon: 'folder',
    legacyIcon: 'folder',
  },
  {
    id: 'medications',
    label: 'Medications',
    phase: 2,
    materialIcon: 'medication',
    legacyIcon: 'medication',
  },
  {
    id: 'problems',
    label: 'Problems',
    phase: 2,
    materialIcon: 'list_alt',
    legacyIcon: 'list-alt',
  },
  {
    id: 'vitals',
    label: 'Vitals',
    phase: 2,
    materialIcon: 'monitor_heart',
    legacyIcon: 'monitor-heart',
  },
  {
    id: 'results',
    label: 'Results',
    phase: 2,
    materialIcon: 'science',
    legacyIcon: 'science',
  },
  {
    id: 'orders',
    label: 'Orders',
    phase: 3,
    materialIcon: 'assignment',
    legacyIcon: 'assignment',
  },
];

/**
 * @param {number} [maxPhase=1]
 * @returns {SharedChartTabDefinition[]}
 */
export function getChartTabs(maxPhase = 1) {
  return CHART_TABS.filter((tab) => tab.phase <= maxPhase);
}

/**
 * @param {number} [maxPhase=1]
 * @returns {Record<string, string>}
 */
export function getChartTabLabelMap(maxPhase = 1) {
  return Object.fromEntries(getChartTabs(maxPhase).map((tab) => [tab.id, tab.label]));
}

/**
 * @param {SharedChartTabId | string | null | undefined} tabId
 * @returns {SharedChartTabDefinition | null}
 */
export function getChartTabById(tabId) {
  if (!tabId) return null;
  return CHART_TABS.find((tab) => tab.id === tabId) ?? null;
}
