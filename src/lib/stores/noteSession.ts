/**
 * Note session store — manages the active note draft with per-section state.
 * Ported from app/js/core/activeNoteSession.js
 *
 * Draft shape:
 * {
 *   subjective: { chiefComplaint, historyOfPresentIllness, painScale, ... },
 *   objective:  { vitals, systemsReview, regionalAssessments, ... },
 *   assessment: { bodyFunctions, ptDiagnosis, prognosis, ... },
 *   plan:       { goals, inClinicInterventions, hepInterventions, frequency, duration, ... },
 *   billing:    { diagnosisCodes, billingCodes, ordersReferrals }
 * }
 */

import { writable, get } from 'svelte/store';
import { activeCase, saveActiveDraft } from '$lib/stores/cases';

export type SectionId = 'subjective' | 'objective' | 'assessment' | 'plan' | 'billing';

export interface NoteDraft {
  subjective: Record<string, unknown>;
  objective: Record<string, unknown>;
  assessment: Record<string, unknown>;
  plan: Record<string, unknown>;
  billing: Record<string, unknown>;
}

const emptyDraft: NoteDraft = {
  subjective: {},
  objective: {},
  assessment: {},
  plan: {},
  billing: {},
};

export const noteDraft = writable<NoteDraft>({ ...emptyDraft });
export const isDirty = writable(false);

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize the note draft from the active case.
 * Merges case encounter seed data with any existing draft.
 */
export function initDraft(): void {
  const state = get(activeCase);
  const caseObj = state.caseWrapper?.caseObj;
  const encounter = state.encounter ?? 'eval';

  // Get encounter seed data from the case
  const encounterData =
    (caseObj as Record<string, unknown>)?.encounters != null
      ? ((caseObj as Record<string, unknown>).encounters as Record<string, unknown>)[encounter]
      : null;

  const seed = (encounterData ?? {}) as Record<string, Record<string, unknown>>;

  // Merge: existing draft takes priority over seed data
  const existingDraft = (state.draft ?? {}) as Partial<NoteDraft>;

  noteDraft.set({
    subjective: { ...(seed.subjective ?? {}), ...(existingDraft.subjective ?? {}) },
    objective: { ...(seed.objective ?? {}), ...(existingDraft.objective ?? {}) },
    assessment: { ...(seed.assessment ?? {}), ...(existingDraft.assessment ?? {}) },
    plan: { ...(seed.plan ?? {}), ...(existingDraft.plan ?? {}) },
    billing: { ...(seed.billing ?? {}), ...(existingDraft.billing ?? {}) },
  });
  isDirty.set(false);
}

/**
 * Update a single field in a section.
 */
export function updateField(section: SectionId, key: string, value: unknown): void {
  noteDraft.update((d) => ({
    ...d,
    [section]: { ...d[section], [key]: value },
  }));
  isDirty.set(true);
  scheduleAutoSave();
}

/**
 * Update multiple fields in a section at once.
 */
export function updateSection(section: SectionId, data: Record<string, unknown>): void {
  noteDraft.update((d) => ({
    ...d,
    [section]: { ...d[section], ...data },
  }));
  isDirty.set(true);
  scheduleAutoSave();
}

/**
 * Replace an entire section.
 */
export function replaceSection(section: SectionId, data: Record<string, unknown>): void {
  noteDraft.update((d) => ({
    ...d,
    [section]: data,
  }));
  isDirty.set(true);
  scheduleAutoSave();
}

/**
 * Save the current draft to storage immediately.
 */
export function saveDraftNow(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  const draft = get(noteDraft);
  saveActiveDraft(draft as unknown as Record<string, unknown>);
  isDirty.set(false);
}

/**
 * Schedule an auto-save (debounced 1.5s).
 */
function scheduleAutoSave(): void {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveDraftNow, 1500);
}

/**
 * Clear the note draft and cancel pending saves.
 */
export function clearDraft(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  noteDraft.set({ ...emptyDraft });
  isDirty.set(false);
}
