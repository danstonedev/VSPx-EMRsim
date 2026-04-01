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
import { saveSignedNote, type NoteEnvelope } from '$lib/services/chartRecords';
import { finalizeDraftSignature, type NoteData, type Signature } from '$lib/services/noteLifecycle';
import { refreshChartRecords } from '$lib/stores/chartRecords';
import { normalizeStandardizedAssessments } from '$lib/config/standardizedAssessments';
import {
  buildRobertCastellanoPtDemoDraft,
  isRobertCastellanoDemoPatient,
} from '$lib/config/demoPtNote';
import { MED_DB } from '$lib/config/medicationDb';
import type { MedicationRecord } from '$lib/types/sections';
import {
  allergySummary,
  computeAge,
  normalizeSex,
  resolvePatient,
} from '$lib/services/vspRegistry';
import type { CaseObj } from '$lib/store';
import type {
  SubjectiveData,
  ObjectiveData,
  AssessmentData,
  PlanData,
  BillingData,
  NutritionAssessmentData,
  NutritionDiagnosisData,
  NutritionInterventionData,
  NutritionMonitoringData,
  DieteticsBillingData,
} from '$lib/types/sections';

export type SectionId = 'subjective' | 'objective' | 'assessment' | 'plan' | 'billing';

export type DieteticsSectionId =
  | 'nutrition_assessment'
  | 'nutrition_diagnosis'
  | 'nutrition_intervention'
  | 'nutrition_monitoring'
  | 'billing';

export interface NoteDraft {
  subjective: SubjectiveData;
  objective: ObjectiveData;
  assessment: AssessmentData;
  plan: PlanData;
  billing: BillingData;
}

export interface DieteticsNoteDraft {
  nutrition_assessment: NutritionAssessmentData;
  nutrition_diagnosis: NutritionDiagnosisData;
  nutrition_intervention: NutritionInterventionData;
  nutrition_monitoring: NutritionMonitoringData;
  billing: DieteticsBillingData;
}

const emptyDraft: NoteDraft = {
  subjective: {},
  objective: {},
  assessment: {},
  plan: {},
  billing: {},
};

const emptyDieteticsDraft: DieteticsNoteDraft = {
  nutrition_assessment: {},
  nutrition_diagnosis: { pes_statements: [{ problem: '', etiology: '', signs_symptoms: '' }] },
  nutrition_intervention: {},
  nutrition_monitoring: {},
  billing: {},
};

export const noteDraft = writable<NoteDraft>({ ...emptyDraft });
export const dieteticsNoteDraft = writable<DieteticsNoteDraft>({ ...emptyDieteticsDraft });
export const isDirty = writable(false);

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Look up a medication name in the built-in DB to get its class and clinical alerts.
 */
function lookupMedDb(name: string): { class: string; alerts: MedicationRecord['alerts'] } {
  const lower = name.toLowerCase();
  const match = MED_DB.find(
    (m) => m.name.toLowerCase() === lower || m.brand.toLowerCase() === lower,
  );
  return match ? { class: match.class, alerts: [...match.alerts] } : { class: '', alerts: [] };
}

/**
 * Seed structured MedicationRecord[] from the VSP patient record or case history.
 * Only called when the draft has no medications yet (first load).
 */
function seedMedications(caseObj: Record<string, unknown> | undefined): MedicationRecord[] {
  // Try VSP patient first
  const vspPatient = resolvePatient(caseObj as CaseObj | undefined);
  if (vspPatient?.activeMedications?.length) {
    return vspPatient.activeMedications.map((m) => {
      const db = lookupMedDb(m.name);
      return {
        name: m.name,
        dose: m.dose ?? '',
        frequency: m.frequency ?? '',
        class: db.class,
        alerts: db.alerts,
      };
    });
  }

  // Fall back to case history strings (e.g. "Lisinopril 10mg QD")
  const history = (caseObj as Record<string, unknown>)?.history as
    | Record<string, unknown>
    | undefined;
  const historyMeds = (history?.meds as string[] | undefined) ?? [];
  if (historyMeds.length > 0) {
    return historyMeds.map((text) => {
      // Try to extract drug name (first word) for DB lookup
      const firstName = text.split(/\s+/)[0] ?? text;
      const db = lookupMedDb(firstName);
      return {
        name: text,
        dose: '',
        frequency: '',
        class: db.class,
        alerts: db.alerts,
        custom: db.class === '',
      };
    });
  }

  return [];
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean);
}

function buildAgeSexLead(caseObj: CaseObj | undefined): string {
  const age =
    asString((caseObj as Record<string, unknown> | undefined)?.patientAge) ||
    asString((caseObj?.meta as Record<string, unknown> | undefined)?.age);
  const sex = normalizeSex(
    asString((caseObj as Record<string, unknown> | undefined)?.patientGender) ||
      asString((caseObj?.meta as Record<string, unknown> | undefined)?.sex),
  );
  const sexLabel = sex && sex !== 'unspecified' ? sex : '';
  if (age && sexLabel) return `${age}-year-old ${sexLabel}`;
  if (age) return `${age}-year-old patient`;
  if (sexLabel) return `${sexLabel} patient`;
  return 'Patient';
}

function buildChiefComplaint(
  caseObj: CaseObj | undefined,
  vspPatient: ReturnType<typeof resolvePatient>,
): string {
  const history = (caseObj as Record<string, unknown> | undefined)?.history as
    | Record<string, unknown>
    | undefined;
  const explicitComplaint = asString(history?.chief_complaint);
  if (explicitComplaint) return explicitComplaint;

  const candidateDiagnoses = [
    asString((caseObj as Record<string, unknown> | undefined)?.diagnosis),
    asString((caseObj?.meta as Record<string, unknown> | undefined)?.diagnosis),
    ...asStringArray(history?.pmh),
    ...((vspPatient?.medicalHistory ?? [])
      .map((entry) => entry.trim())
      .filter(Boolean) as string[]),
  ].filter(Boolean);

  if (candidateDiagnoses.length === 0) return '';
  return `Evaluation related to ${candidateDiagnoses[0]}`;
}

function buildAdditionalHistory(
  caseObj: CaseObj | undefined,
  vspPatient: ReturnType<typeof resolvePatient>,
): string {
  const history = (caseObj as Record<string, unknown> | undefined)?.history as
    | Record<string, unknown>
    | undefined;
  const diagnoses = [
    ...asStringArray(history?.pmh),
    ...((vspPatient?.medicalHistory ?? [])
      .map((entry) => entry.trim())
      .filter(Boolean) as string[]),
  ];
  const surgeries = (vspPatient?.surgicalHistory ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);
  const allergies = allergySummary(vspPatient);
  const parts: string[] = [];

  if (diagnoses.length) parts.push(`PMH: ${diagnoses.join('; ')}`);
  if (surgeries.length) parts.push(`Surgical history: ${surgeries.join('; ')}`);
  if (allergies && allergies !== 'NKDA') parts.push(`Allergies: ${allergies}`);
  if (vspPatient?.primaryCareProvider) parts.push(`PCP: ${vspPatient.primaryCareProvider}`);

  return parts.join(' | ');
}

function seedSubjectiveFromCaseContext(
  subjective: SubjectiveData,
  caseObj: CaseObj | undefined,
): SubjectiveData {
  const seeded = { ...subjective };
  const history = (caseObj as Record<string, unknown> | undefined)?.history as
    | Record<string, unknown>
    | undefined;
  const vspPatient = resolvePatient(caseObj);

  if (vspPatient) {
    if (!seeded.patientName) {
      seeded.patientName =
        asString((caseObj as Record<string, unknown> | undefined)?.patientName) ||
        asString((caseObj?.meta as Record<string, unknown> | undefined)?.patientName);
    }
    if (!seeded.patientBirthday) seeded.patientBirthday = vspPatient.dob || '';
    if (!seeded.patientAge) {
      const age = computeAge(vspPatient.dob);
      seeded.patientAge = age != null ? String(age) : '';
    }
    if (!seeded.patientGender) seeded.patientGender = normalizeSex(vspPatient.sex) || '';
    if (!seeded.patientGenderIdentityPronouns)
      seeded.patientGenderIdentityPronouns = vspPatient.pronouns || '';
    if (!seeded.patientPreferredLanguage)
      seeded.patientPreferredLanguage = vspPatient.preferredLanguage || 'English';
    if (!seeded.patientInterpreterNeeded)
      seeded.patientInterpreterNeeded = vspPatient.interpreterNeeded ? 'yes' : 'no';
    if (!seeded.patientHeightFt) seeded.patientHeightFt = vspPatient.heightFt || '';
    if (!seeded.patientHeightIn) seeded.patientHeightIn = vspPatient.heightIn || '';
    if (!seeded.patientWeight) seeded.patientWeight = vspPatient.weightLbs || '';
    if (!seeded.__vspId) seeded.__vspId = vspPatient.id;
  }

  if (!seeded.chiefComplaint) {
    seeded.chiefComplaint = buildChiefComplaint(caseObj, vspPatient);
  }

  if (!seeded.historyOfPresentIllness) {
    const explicitHpi = asString(history?.hpi);
    if (explicitHpi) {
      seeded.historyOfPresentIllness = explicitHpi;
    } else if (seeded.chiefComplaint) {
      const lead = buildAgeSexLead(caseObj);
      seeded.historyOfPresentIllness = `${lead} presents for PT evaluation related to ${seeded.chiefComplaint.toLowerCase()}.`;
    }
  }

  if (!seeded.additionalHistory) {
    seeded.additionalHistory = buildAdditionalHistory(caseObj, vspPatient);
  }

  return seeded;
}

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
  const vspPatient = resolvePatient(caseObj as CaseObj | undefined);
  const demoPtDraft =
    encounter === 'eval' && vspPatient && isRobertCastellanoDemoPatient(vspPatient)
      ? buildRobertCastellanoPtDemoDraft(vspPatient)
      : null;

  const mergedSubjective = seedSubjectiveFromCaseContext(
    {
      ...(demoPtDraft?.subjective ?? {}),
      ...(seed.subjective ?? {}),
      ...(existingDraft.subjective ?? {}),
    } as SubjectiveData,
    caseObj as CaseObj | undefined,
  );

  // Seed medications from VSP/case history if not already in the draft
  const existingMeds = (mergedSubjective as SubjectiveData).medications;
  if (!Array.isArray(existingMeds) || existingMeds.length === 0) {
    const seeded = seedMedications(caseObj as Record<string, unknown> | undefined);
    if (seeded.length > 0) {
      (mergedSubjective as SubjectiveData).medications = seeded;
    }
  }

  noteDraft.set({
    subjective: mergedSubjective as SubjectiveData,
    objective: {
      ...(demoPtDraft?.objective ?? {}),
      ...(seed.objective ?? {}),
      ...(existingDraft.objective ?? {}),
      standardizedAssessments: normalizeStandardizedAssessments(
        ((existingDraft.objective as Record<string, unknown> | undefined)
          ?.standardizedAssessments ??
          (seed.objective as Record<string, unknown> | undefined)?.standardizedAssessments ??
          demoPtDraft?.objective.standardizedAssessments ??
          []) as unknown[],
      ),
    },
    assessment: {
      ...(demoPtDraft?.assessment ?? {}),
      ...(seed.assessment ?? {}),
      ...(existingDraft.assessment ?? {}),
    },
    plan: { ...(demoPtDraft?.plan ?? {}), ...(seed.plan ?? {}), ...(existingDraft.plan ?? {}) },
    billing: {
      ...(demoPtDraft?.billing ?? {}),
      ...(seed.billing ?? {}),
      ...(existingDraft.billing ?? {}),
    },
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

/** Track whether the last save failed, so we can avoid spamming error toasts. */
let lastSaveFailed = false;

/**
 * Save the current draft to storage immediately.
 * Persists whichever draft type matches the active encounter.
 */
export function saveDraftNow(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  const state = get(activeCase);
  const encounter = state.encounter ?? 'eval';
  try {
    if (encounter === 'nutrition') {
      const draft = get(dieteticsNoteDraft);
      saveActiveDraft(draft as unknown as Record<string, unknown>);
    } else {
      const draft = get(noteDraft);
      saveActiveDraft(draft as unknown as Record<string, unknown>);
    }
    if (lastSaveFailed) {
      lastSaveFailed = false;
      autoSaveError.set(null);
    }
    isDirty.set(false);
  } catch (err) {
    if (!lastSaveFailed) {
      lastSaveFailed = true;
      autoSaveError.set(
        err instanceof DOMException && err.name === 'QuotaExceededError'
          ? 'Storage full — your changes may not be saved. Export your note or clear old drafts.'
          : 'Unable to save draft. Your recent changes may be lost.',
      );
    }
  }
}

/** Exposed so the editor can subscribe and show error toasts. */
export const autoSaveError = writable<string | null>(null);

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
  dieteticsNoteDraft.set({ ...emptyDieteticsDraft });
  isDirty.set(false);
}

// ─── Dietetics Draft ──────────────────────────────────────────────────────

/**
 * Initialize the dietetics note draft from the active case.
 * Mirrors initDraft() but for the NCP (ADIME) section shape.
 */
export function initDieteticsDraft(): void {
  const state = get(activeCase);
  const caseObj = state.caseWrapper?.caseObj;
  const encounter = state.encounter ?? 'nutrition';

  const encounterData =
    (caseObj as Record<string, unknown>)?.encounters != null
      ? ((caseObj as Record<string, unknown>).encounters as Record<string, unknown>)[encounter]
      : null;

  const seed = (encounterData ?? {}) as Record<string, Record<string, unknown>>;
  const existingDraft = (state.draft ?? {}) as Partial<DieteticsNoteDraft>;

  // Migrate legacy flat-string format to structured objects
  const merged = migrateDieteticsDraftFields({
    nutrition_assessment: {
      ...(seed.nutrition_assessment ?? {}),
      ...(existingDraft.nutrition_assessment ?? {}),
    } as NutritionAssessmentData,
    nutrition_diagnosis: {
      ...(seed.nutrition_diagnosis ?? {}),
      ...(existingDraft.nutrition_diagnosis ?? {}),
    } as NutritionDiagnosisData,
    nutrition_intervention: {
      ...(seed.nutrition_intervention ?? {}),
      ...(existingDraft.nutrition_intervention ?? {}),
    } as NutritionInterventionData,
    nutrition_monitoring: {
      ...(seed.nutrition_monitoring ?? {}),
      ...(existingDraft.nutrition_monitoring ?? {}),
    } as NutritionMonitoringData,
    billing: {
      ...(seed.billing ?? {}),
      ...(existingDraft.billing ?? {}),
    } as DieteticsBillingData,
  });

  dieteticsNoteDraft.set(merged);
  isDirty.set(false);
}

/**
 * Migrate legacy string-based dietetics draft fields to structured objects.
 * Matches migrateDieteticsDraft() from dietetics_workspace.js.
 */
function migrateDieteticsDraftFields(draft: DieteticsNoteDraft): DieteticsNoteDraft {
  if (typeof draft.nutrition_assessment === 'string') {
    draft.nutrition_assessment = {
      food_nutrition_history: draft.nutrition_assessment as unknown as string,
    };
  }
  if (typeof draft.nutrition_diagnosis === 'string') {
    draft.nutrition_diagnosis = {
      pes_statements: [
        {
          problem: '',
          etiology: '',
          signs_symptoms: draft.nutrition_diagnosis as unknown as string,
        },
      ],
    };
  }
  if (typeof draft.nutrition_intervention === 'string') {
    draft.nutrition_intervention = {
      goals: draft.nutrition_intervention as unknown as string,
    };
  }
  if (typeof draft.nutrition_monitoring === 'string') {
    draft.nutrition_monitoring = {
      outcomes: draft.nutrition_monitoring as unknown as string,
    };
  }
  if (typeof draft.billing === 'string') {
    draft.billing = {
      justification: draft.billing as unknown as string,
    };
  }
  // Ensure pes_statements array exists
  if (!draft.nutrition_diagnosis.pes_statements?.length) {
    draft.nutrition_diagnosis.pes_statements = [{ problem: '', etiology: '', signs_symptoms: '' }];
  }
  return draft;
}

/**
 * Update a single field in a dietetics section.
 */
export function updateDieteticsField(
  section: DieteticsSectionId,
  key: string,
  value: unknown,
): void {
  dieteticsNoteDraft.update((d) => ({
    ...d,
    [section]: { ...d[section], [key]: value },
  }));
  isDirty.set(true);
  scheduleAutoSave();
}

/**
 * Replace an entire dietetics section.
 */
export function replaceDieteticsSection(
  section: DieteticsSectionId,
  data: Record<string, unknown>,
): void {
  dieteticsNoteDraft.update((d) => ({
    ...d,
    [section]: data,
  }));
  isDirty.set(true);
  scheduleAutoSave();
}

/**
 * Clear the dietetics draft.
 */
export function clearDieteticsDraft(): void {
  dieteticsNoteDraft.set({ ...emptyDieteticsDraft });
}

export function finalizeAndSaveSignedNote(
  caseId: string,
  encounterKey: string,
  signature: Signature,
  note: NoteData = get(noteDraft) as unknown as NoteData,
): NoteEnvelope {
  const signed = finalizeDraftSignature(note, signature);
  const envelope = saveSignedNote(
    caseId,
    encounterKey,
    signed,
    get(activeCase).caseWrapper?.caseObj,
  );
  refreshChartRecords();
  clearDraft();
  return envelope;
}
