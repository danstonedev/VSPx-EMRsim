import { storage as defaultStorage } from './adapters/storageAdapter.js';
import { buildEditorHash } from './noteCatalog.js';

const UNIFIED_NOTES_KEY = 'unified_note_envelopes';
const PRESERVATION_STATE_KEY = 'storage_preservation_state_v1';
const DIET_CASES_KEY = 'dietetics_emr_cases';

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadJsonMap(storageAdapter, key) {
  return safeJsonParse(storageAdapter.getItem(key), {}) || {};
}

function saveJsonMap(storageAdapter, key, value) {
  storageAdapter.setItem(key, JSON.stringify(value));
}

function inferPtTemplateId(draft, encounter) {
  if (draft?.meta?.templateId) return draft.meta.templateId;
  if (draft?.noteType === 'simple-soap') return 'pt-simple-soap';
  if (
    String(encounter || '')
      .toLowerCase()
      .includes('simple')
  )
    return 'pt-simple-soap';
  return 'pt-eval';
}

function inferNoteStatus(draft) {
  if (draft?.meta?.signature) {
    return draft?.amendments?.length ? 'amended' : 'signed';
  }
  return 'draft';
}

function buildPtPatientName(caseId, draft, storageAdapter) {
  const draftName = String(draft?.subjective?.patientName || draft?.noteTitle || '').trim();
  if (draftName) return draftName;
  const patientMeta = safeJsonParse(storageAdapter.getItem(`patient_${caseId}`), null);
  const patientName = String(patientMeta?.name || '').trim();
  return patientName || 'Untitled PT Note';
}

function buildDieteticsPatientName(caseId, draft, dietCases) {
  const caseName = String(dietCases?.[caseId]?.caseObj?.meta?.patientName || '').trim();
  if (caseName) return caseName;
  return String(draft?.meta?.patientName || '').trim() || 'Untitled Dietetics Note';
}

function extractPtCaseIdAndEncounter(key) {
  const parts = String(key || '').split('_');
  if (parts.length < 3) return null;
  const encounter = parts[parts.length - 1];
  const caseId = parts.slice(1, -1).join('_');
  return caseId ? { caseId, encounter } : null;
}

function createLegacyEnvelopeId(prefix, key) {
  return `${prefix}:${key}`;
}

function upsertEnvelope(envelopes, envelope) {
  if (!envelope?.id) return;
  envelopes[envelope.id] = {
    ...(envelopes[envelope.id] || {}),
    ...envelope,
  };
}

function buildPtEnvelope(storageAdapter, key, draft) {
  const parsed = extractPtCaseIdAndEncounter(key);
  if (!parsed) return null;
  const { caseId, encounter } = parsed;
  const templateId = inferPtTemplateId(draft, encounter);
  const patientId =
    draft?.meta?.canonicalPatientId || draft?.meta?.patientId || draft?.subjective?.__vspId || '';

  return {
    id: createLegacyEnvelopeId('legacy-pt', key),
    patientId,
    patientName: buildPtPatientName(caseId, draft, storageAdapter),
    professionId: 'pt',
    templateId,
    status: inferNoteStatus(draft),
    migratedFrom: key,
    launchSource: 'legacy-cache-preservation',
    compatibility: {
      routeCaseId: caseId,
      encounter,
      routeHash: buildEditorHash({
        professionId: 'pt',
        caseId,
        encounter,
        isFacultyMode: false,
      }),
      shell: caseId.startsWith('blank') ? 'legacy-pt-student' : 'legacy-pt',
      storageKeys: [key],
    },
    meta: {
      sourceVersion: 1,
      preservedAt: new Date().toISOString(),
    },
  };
}

function buildDieteticsEnvelope(key, draft, dietCases, isFacultyMode = false) {
  const caseId = String(key || '').replace(/^dietetics_draft_/, '');
  if (!caseId) return null;
  const caseMeta = dietCases?.[caseId]?.caseObj?.meta || {};
  const patientId = caseMeta.patientId || caseMeta.vspId || draft?.meta?.patientId || '';

  return {
    id: createLegacyEnvelopeId('legacy-diet', key),
    patientId,
    patientName: buildDieteticsPatientName(caseId, draft, dietCases),
    professionId: 'dietetics',
    templateId: 'dietetics-ncp',
    status: inferNoteStatus(draft),
    migratedFrom: key,
    launchSource: 'legacy-cache-preservation',
    compatibility: {
      routeCaseId: caseId,
      encounter: 'nutrition',
      routeHash: buildEditorHash({
        professionId: 'dietetics',
        caseId,
        encounter: 'nutrition',
        isFacultyMode,
      }),
      shell: 'dietetics-workspace',
      storageKeys: [key],
    },
    meta: {
      sourceVersion: 1,
      preservedAt: new Date().toISOString(),
    },
  };
}

function summarizeKeys(keys) {
  return {
    ptDraftCount: keys.filter((key) => key.startsWith('draft_')).length,
    dietDraftCount: keys.filter((key) => key.startsWith('dietetics_draft_')).length,
    localPatientCount: keys.filter((key) => key.startsWith('patient_')).length,
  };
}

export function ensureStoragePreservation(storageAdapter = defaultStorage) {
  const keys = storageAdapter.keys();
  const envelopes = loadJsonMap(storageAdapter, UNIFIED_NOTES_KEY);
  const dietCases = loadJsonMap(storageAdapter, DIET_CASES_KEY);
  let migratedPt = 0;
  let migratedDiet = 0;

  keys.forEach((key) => {
    if (key.startsWith('draft_')) {
      const draft = safeJsonParse(storageAdapter.getItem(key), null);
      if (!draft) return;
      upsertEnvelope(envelopes, buildPtEnvelope(storageAdapter, key, draft));
      migratedPt += 1;
      return;
    }

    if (key.startsWith('dietetics_draft_')) {
      const draft = safeJsonParse(storageAdapter.getItem(key), null);
      if (!draft) return;
      upsertEnvelope(envelopes, buildDieteticsEnvelope(key, draft, dietCases));
      migratedDiet += 1;
    }
  });

  saveJsonMap(storageAdapter, UNIFIED_NOTES_KEY, envelopes);
  const summary = summarizeKeys(keys);
  const state = {
    version: 1,
    lastRunAt: new Date().toISOString(),
    migratedPtDrafts: migratedPt,
    migratedDieteticsDrafts: migratedDiet,
    unifiedEnvelopeCount: Object.keys(envelopes).length,
    ...summary,
    destructiveChangesApplied: false,
  };
  saveJsonMap(storageAdapter, PRESERVATION_STATE_KEY, state);
  return state;
}

export function readStoragePreservationState(storageAdapter = defaultStorage) {
  return loadJsonMap(storageAdapter, PRESERVATION_STATE_KEY);
}
