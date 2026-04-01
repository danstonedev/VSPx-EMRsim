/**
 * Shared chart-tab definitions used by the Svelte editor shell.
 * Migrated from app/shared/chartTabs.js
 */

export type SharedChartTabId =
  | 'current-note'
  | 'patient-summary'
  | 'my-notes'
  | 'case-file'
  | 'medications'
  | 'problems'
  | 'vitals'
  | 'results'
  | 'orders';

export interface SharedChartTabDefinition {
  id: SharedChartTabId;
  label: string;
  phase: number;
  materialIcon: string;
  legacyIcon: string;
}

export const CHART_TABS: readonly SharedChartTabDefinition[] = [
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

export function getChartTabs(maxPhase = 1): SharedChartTabDefinition[] {
  return CHART_TABS.filter((tab) => tab.phase <= maxPhase);
}

export function getChartTabLabelMap(maxPhase = 1): Record<string, string> {
  return Object.fromEntries(getChartTabs(maxPhase).map((tab) => [tab.id, tab.label]));
}

export function getChartTabById(tabId: string | null | undefined): SharedChartTabDefinition | null {
  if (!tabId) return null;
  return CHART_TABS.find((tab) => tab.id === tabId) ?? null;
}
