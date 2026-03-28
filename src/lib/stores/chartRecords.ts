import { derived, readable, writable, type Readable } from 'svelte/store';
import type { CaseObj } from '$lib/store';
import {
  getChartCaseContext,
  getChartRecords,
  listSignedNotesForCase,
  type NoteEnvelope,
  type ChartCaseContext,
  type ChartRecords,
} from '$lib/services/chartRecords';

const chartRecordsState = writable<ChartRecords>(getChartRecords());

export const chartRecords = {
  subscribe: chartRecordsState.subscribe,
};

export function refreshChartRecords(): ChartRecords {
  const next = getChartRecords();
  chartRecordsState.set(next);
  return next;
}

export function getChartCaseContextSnapshot(caseId: string, caseObj?: CaseObj): ChartCaseContext {
  return getChartCaseContext(caseId, caseObj);
}

export function createChartCaseContextStore(caseId: string, caseObj?: CaseObj) {
  return derived(chartRecordsState, () => getChartCaseContext(caseId, caseObj));
}

export const signedNotesForActiveCase: Readable<NoteEnvelope[]> = readable<NoteEnvelope[]>(
  [],
  (set) => {
    let currentCaseId: string | null = null;
    let stopActiveCase: (() => void) | undefined;

    const update = () => {
      if (!currentCaseId) {
        set([]);
        return;
      }
      set(listSignedNotesForCase(currentCaseId));
    };

    const stopChart = chartRecordsState.subscribe(() => {
      update();
    });

    void import('$lib/stores/cases').then(({ activeCase }) => {
      stopActiveCase = activeCase.subscribe(($activeCase) => {
        currentCaseId = $activeCase.caseId;
        update();
      });
    });

    return () => {
      stopChart();
      stopActiveCase?.();
    };
  },
);
