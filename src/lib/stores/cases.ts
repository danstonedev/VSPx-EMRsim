/**
 * Svelte reactive case store — wraps the imperative store.ts with Svelte 5 runes.
 * Provides reactive state for cases, drafts, and the active case.
 */

import { writable, derived, get } from 'svelte/store';
import {
  listCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  saveDraft,
  loadDraft,
  listDrafts,
  type CaseObj,
  type CaseWrapper,
} from '$lib/store';
import { getManifest, flattenManifestCases, type ManifestCase } from '$lib/manifest';

// ---------------------------------------------------------------------------
// Case list store
// ---------------------------------------------------------------------------

export const cases = writable<CaseWrapper[]>([]);
export const manifestCases = writable<ManifestCase[]>([]);
export const isLoading = writable(false);

/** Load cases from storage + manifest into reactive stores */
export async function loadAllCases(): Promise<void> {
  isLoading.set(true);
  try {
    // Load stored cases
    const stored = listCases();
    const arr = Object.values(stored);
    cases.set(arr);

    // Load manifest cases
    const manifest = await getManifest();
    if (manifest) {
      manifestCases.set(flattenManifestCases(manifest));
    }
  } finally {
    isLoading.set(false);
  }
}

// ---------------------------------------------------------------------------
// Active case store (for workspace editor)
// ---------------------------------------------------------------------------

export interface ActiveCaseState {
  caseId: string | null;
  caseWrapper: CaseWrapper | null;
  encounter: string;
  draft: Record<string, unknown> | null;
}

const defaultActiveCase: ActiveCaseState = {
  caseId: null,
  caseWrapper: null,
  encounter: 'eval',
  draft: null,
};

export const activeCase = writable<ActiveCaseState>(defaultActiveCase);

/** Load a specific case into the active case store */
export function loadActiveCase(caseId: string, encounter = 'eval'): void {
  const wrapper = getCase(caseId);
  const draft = loadDraft(caseId, encounter) as Record<string, unknown> | null;
  activeCase.set({
    caseId,
    caseWrapper: wrapper,
    encounter,
    draft,
  });
}

/** Save the current draft for the active case */
export function saveActiveDraft(data: Record<string, unknown>): void {
  const state = get(activeCase);
  if (!state.caseId) return;
  saveDraft(state.caseId, state.encounter, data);
  activeCase.update((s) => ({ ...s, draft: data }));
}

/** Clear the active case */
export function clearActiveCase(): void {
  activeCase.set(defaultActiveCase);
}

// ---------------------------------------------------------------------------
// Draft scanning (for case library status)
// ---------------------------------------------------------------------------

export interface DraftInfo {
  caseId: string;
  encounter: string;
  hasContent: boolean;
}

/** Scan all drafts and return structured info */
export function scanAllDrafts(): DraftInfo[] {
  const draftKeys = listDrafts();
  const results: DraftInfo[] = [];
  for (const key of draftKeys) {
    const match = key.match(/^draft_(.+)_(.+)$/);
    if (match) {
      const data = loadDraft(match[1], match[2]);
      results.push({
        caseId: match[1],
        encounter: match[2],
        hasContent:
          data != null &&
          typeof data === 'object' &&
          Object.keys(data as Record<string, unknown>).length > 0,
      });
    }
  }
  return results;
}

/** Derived: map of caseId → draft status */
export function getDraftStatusMap(): Map<string, { encounter: string; hasContent: boolean }> {
  const drafts = scanAllDrafts();
  const map = new Map<string, { encounter: string; hasContent: boolean }>();
  for (const d of drafts) {
    map.set(d.caseId, { encounter: d.encounter, hasContent: d.hasContent });
  }
  return map;
}
