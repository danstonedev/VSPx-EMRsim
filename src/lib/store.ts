/**
 * Case & draft store — TypeScript port of app/js/core/store.js
 *
 * Key storage keys:
 * - pt_emr_cases        → all cases (JSON object keyed by case ID)
 * - pt_emr_case_counter → auto-increment counter for case IDs
 * - draft_<caseId>_<encounter> → per-encounter drafts
 */

import { storage } from './storage';
import {
  deleteCaseChartRecords,
  syncCaseWrapperToChart,
  upsertDraftNoteRecord,
} from '$lib/services/chartRecords';
import { refreshChartRecords } from '$lib/stores/chartRecords';

const CASES_KEY = 'pt_emr_cases';
const CASE_COUNTER_KEY = 'pt_emr_case_counter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaseSnapshot {
  name?: string;
  dob?: string;
  age?: string;
  sex?: string;
  mrn?: string;
  teaser?: string;
  [key: string]: unknown;
}

export interface CaseMeta {
  setting?: string;
  diagnosis?: string;
  acuity?: string;
  profession?: string;
  discipline?: string;
  [key: string]: unknown;
}

export interface CaseHistory {
  allergies?: unknown[];
  meds?: unknown[];
  pmh?: unknown[];
  chief_complaint?: string;
  [key: string]: unknown;
}

export interface CaseObj {
  id?: string;
  patientName?: string;
  diagnosis?: string;
  snapshot?: CaseSnapshot;
  meta?: CaseMeta;
  history?: CaseHistory;
  [key: string]: unknown;
}

export interface CaseWrapper {
  id: string;
  caseObj: CaseObj;
  [key: string]: unknown;
}

export type CasesMap = Record<string, CaseWrapper>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadCasesFromStorage(): CasesMap {
  try {
    const stored = storage.getItem(CASES_KEY);
    if (stored) {
      return JSON.parse(stored) as CasesMap;
    }
    return {};
  } catch (error) {
    console.error('Failed to load cases from storage:', error);
    return {};
  }
}

function saveCasesToStorage(cases: CasesMap): boolean {
  try {
    storage.setItem(CASES_KEY, JSON.stringify(cases));
    return true;
  } catch (error) {
    console.error('Failed to save cases to storage:', error);
    return false;
  }
}

function getNextCaseId(): string {
  let counter = parseInt(storage.getItem(CASE_COUNTER_KEY) ?? '0', 10);
  counter++;
  storage.setItem(CASE_COUNTER_KEY, counter.toString());
  return `case_${counter}`;
}

// ---------------------------------------------------------------------------
// Public API (mirrors original store.js exports)
// ---------------------------------------------------------------------------

export function listCases(): CasesMap {
  return loadCasesFromStorage();
}

export function getCase(id: string): CaseWrapper | null {
  const cases = loadCasesFromStorage();
  return cases[id] ?? null;
}

export function createCase(caseObj: CaseObj): CaseWrapper {
  const id = getNextCaseId();
  const wrapper: CaseWrapper = { id, caseObj: { ...caseObj, id } };
  const cases = loadCasesFromStorage();
  cases[id] = wrapper;
  saveCasesToStorage(cases);
  syncCaseWrapperToChart(wrapper);
  refreshChartRecords();
  return wrapper;
}

export function updateCase(id: string, caseObj: CaseObj): boolean {
  const cases = loadCasesFromStorage();
  if (!cases[id]) return false;
  cases[id].caseObj = { ...caseObj, id };
  const ok = saveCasesToStorage(cases);
  if (ok) {
    syncCaseWrapperToChart(cases[id]);
    refreshChartRecords();
  }
  return ok;
}

export function deleteCase(id: string): boolean {
  const cases = loadCasesFromStorage();
  if (!cases[id]) return false;
  delete cases[id];
  const ok = saveCasesToStorage(cases);
  if (ok) {
    deleteCaseChartRecords(id);
    refreshChartRecords();
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

function draftKey(caseId: string, encounter: string): string {
  return `draft_${caseId}_${encounter}`;
}

export function saveDraft(caseId: string, encounter: string, draft: unknown): void {
  storage.setItem(draftKey(caseId, encounter), JSON.stringify(draft));
  if (draft && typeof draft === 'object' && !Array.isArray(draft)) {
    upsertDraftNoteRecord({
      caseId,
      encounterKey: encounter,
      draft: draft as Record<string, unknown>,
      caseObj: getCase(caseId)?.caseObj ?? undefined,
    });
    refreshChartRecords();
  }
}

export function loadDraft(caseId: string, encounter: string): unknown | null {
  const raw = storage.getItem(draftKey(caseId, encounter));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function listDrafts(): string[] {
  const drafts: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith('draft_')) {
      drafts.push(key);
    }
  }
  return drafts;
}
