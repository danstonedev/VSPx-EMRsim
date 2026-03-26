import { storage as defaultStorage } from './adapters/storageAdapter.js';
import {
  buildEditorHash,
  listPilotProfessions,
  listPilotTemplatesForProfession,
} from './noteCatalog.js';
import { allergySummary, computeAge, displayName, normalizeSex } from './vsp-registry.js';

const UNIFIED_NOTES_KEY = 'unified_note_envelopes';
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

function createId(prefix, now, randomToken) {
  return `${prefix}-${now().toString(36)}-${randomToken()}`;
}

function toUsDob(isoDob) {
  if (!isoDob || !/^\d{4}-\d{2}-\d{2}$/.test(String(isoDob))) return '';
  const [year, month, day] = String(isoDob).split('-');
  return `${month}/${day}/${year}`;
}

function buildPatientName(patientRecord) {
  return (
    displayName(patientRecord) ||
    [patientRecord?.firstName, patientRecord?.lastName].filter(Boolean).join(' ') ||
    'Unknown Patient'
  );
}

function buildAllergySummary(patientRecord) {
  const summary = allergySummary(patientRecord);
  return summary === 'NKDA' ? '' : summary;
}

function buildPtCompatPatientMeta(patientRecord, now) {
  return {
    name: buildPatientName(patientRecord),
    dob: toUsDob(patientRecord?.dob),
    sex: normalizeSex(patientRecord?.sex),
    genderIdentityPronouns: patientRecord?.pronouns || '',
    preferredLanguage: patientRecord?.preferredLanguage || 'English',
    interpreterNeeded: patientRecord?.interpreterNeeded ? 'yes' : '',
    heightFt: patientRecord?.heightFt || '',
    heightIn: patientRecord?.heightIn || '',
    weightLbs: patientRecord?.weightLbs || '',
    vspId: patientRecord?.id || '',
    created: now(),
    unifiedSource: true,
  };
}

function buildPtDraftFromPatient(patientRecord, templateId, compatCaseId, now) {
  const patientName = buildPatientName(patientRecord);
  const subjective = {
    patientName,
    patientBirthday: patientRecord?.dob || '',
    patientAge: computeAge(patientRecord?.dob) ?? '',
    patientGender: normalizeSex(patientRecord?.sex) || '',
    patientGenderIdentityPronouns: patientRecord?.pronouns || '',
    patientPreferredLanguage: patientRecord?.preferredLanguage || 'English',
    patientInterpreterNeeded: patientRecord?.interpreterNeeded ? 'yes' : 'no',
    patientHeightFt: patientRecord?.heightFt || '',
    patientHeightIn: patientRecord?.heightIn || '',
    patientWeight: patientRecord?.weightLbs || '',
    __vspId: patientRecord?.id || '',
  };

  const draft = {
    noteTitle: patientName,
    subjective,
    __savedAt: now(),
    meta: {
      caseId: compatCaseId,
      encounterId: 'eval',
      professionId: 'pt',
      templateId,
      patientId: patientRecord?.id || '',
      canonicalPatientId: patientRecord?.id || '',
      launchSource: 'unified-funnel',
    },
  };

  if (templateId === 'pt-simple-soap') {
    draft.noteType = 'simple-soap';
    draft.simpleSOAP = { subjective: '', objective: '', assessment: '', plan: '' };
  } else {
    draft.noteType = 'standard';
  }

  return draft;
}

function buildPtCaseData(patientRecord, options = {}) {
  const patientName = buildPatientName(patientRecord);
  const age = computeAge(patientRecord?.dob);
  const setting = options.setting || 'Outpatient';
  const acuity = options.acuity || 'unspecified';
  const sex = normalizeSex(patientRecord?.sex) || 'unspecified';
  const title = options.title || `${patientName} PT Note`;
  const allergies = buildAllergySummary(patientRecord);

  return {
    title,
    caseTitle: title,
    patientName,
    patientDOB: patientRecord?.dob || '',
    patientAge: age != null ? String(age) : '',
    patientGender: sex,
    meta: {
      title,
      patientName,
      patientId: patientRecord?.id || '',
      vspId: patientRecord?.id || '',
      dob: patientRecord?.dob || '',
      sex,
      setting,
      acuity,
      preferredLanguage: patientRecord?.preferredLanguage || 'English',
      interpreterNeeded: !!patientRecord?.interpreterNeeded,
      pronouns: patientRecord?.pronouns || '',
      allergies,
    },
    snapshot: {
      name: patientName,
      dob: patientRecord?.dob || '',
      age: age != null ? String(age) : '',
      sex,
      preferredLanguage: patientRecord?.preferredLanguage || 'English',
      interpreterNeeded: !!patientRecord?.interpreterNeeded,
      pronouns: patientRecord?.pronouns || '',
      allergies,
    },
    encounters: {
      eval: {},
    },
    modules: [],
  };
}

function buildDieteticsCaseData(patientRecord, options = {}) {
  const patientName = buildPatientName(patientRecord);
  const title = options.title || `${patientName} Dietetics Note`;
  const sex = normalizeSex(patientRecord?.sex) || 'unspecified';

  return {
    title,
    caseObj: {
      meta: {
        title,
        patientName,
        patientId: patientRecord?.id || '',
        vspId: patientRecord?.id || '',
        dob: patientRecord?.dob || '',
        sex,
        setting: options.setting || 'Inpatient',
        acuity: options.acuity || 'Routine',
        dietOrder: options.dietOrder || '',
        allergies: buildAllergySummary(patientRecord),
        preferredLanguage: patientRecord?.preferredLanguage || 'English',
        interpreterNeeded: !!patientRecord?.interpreterNeeded,
      },
      nutritionAssessment: '',
      nutritionDiagnosis: '',
      nutritionIntervention: '',
      nutritionMonitoring: '',
      scheduling: null,
      billing: '',
      modules: [],
    },
  };
}

function persistEnvelope(storageAdapter, envelope) {
  const map = loadJsonMap(storageAdapter, UNIFIED_NOTES_KEY);
  map[envelope.id] = envelope;
  saveJsonMap(storageAdapter, UNIFIED_NOTES_KEY, map);
  return envelope;
}

async function defaultCreatePtCase(caseData) {
  const { createCase } = await import('./store.js');
  return createCase(caseData);
}

function defaultSavePtDraft(storageAdapter, caseId, encounter, draftData) {
  storageAdapter.setItem(`draft_${caseId}_${encounter}`, JSON.stringify(draftData));
}

function saveDieteticsCase(storageAdapter, caseId, caseData) {
  const cases = loadJsonMap(storageAdapter, DIET_CASES_KEY);
  cases[caseId] = { id: caseId, title: caseData.title, caseObj: caseData.caseObj };
  saveJsonMap(storageAdapter, DIET_CASES_KEY, cases);
}

function createBaseEnvelope({
  noteId,
  patientRecord,
  professionId,
  templateId,
  isFacultyMode,
  context,
  now,
}) {
  return {
    id: noteId,
    patientId: patientRecord?.id || '',
    patientName: buildPatientName(patientRecord),
    professionId,
    templateId,
    status: 'draft',
    mode: isFacultyMode ? 'instructor' : 'student',
    createdAt: new Date(now()).toISOString(),
    launchSource: 'unified-funnel',
    context: {
      title: context.title || '',
      setting: context.setting || '',
      acuity: context.acuity || '',
      dietOrder: context.dietOrder || '',
    },
  };
}

export function listUnifiedFunnelProfessions() {
  return listPilotProfessions();
}

export function listUnifiedFunnelTemplates(professionId) {
  return listPilotTemplatesForProfession(professionId);
}

export function listUnifiedNoteEnvelopes(storageAdapter = defaultStorage) {
  return Object.values(loadJsonMap(storageAdapter, UNIFIED_NOTES_KEY));
}

export async function launchUnifiedNote(
  {
    patientRecord,
    professionId,
    templateId,
    isFacultyMode = false,
    title = '',
    setting = '',
    acuity = '',
    dietOrder = '',
  },
  deps = {},
) {
  if (!patientRecord?.id) {
    throw new Error('A canonical patient record is required to launch a unified note.');
  }
  if (!professionId) {
    throw new Error('professionId is required.');
  }
  if (!templateId) {
    throw new Error('templateId is required.');
  }

  const storageAdapter = deps.storage || defaultStorage;
  const now = deps.now || (() => Date.now());
  const randomToken = deps.randomToken || (() => Math.random().toString(36).slice(2, 6));
  const createPtCase = deps.createPtCase || defaultCreatePtCase;
  const savePtDraft =
    deps.savePtDraft ||
    ((caseId, encounter, draftData) =>
      defaultSavePtDraft(storageAdapter, caseId, encounter, draftData));

  const noteId = createId('note', now, randomToken);
  const context = {
    title: title.trim(),
    setting: setting.trim(),
    acuity: acuity.trim(),
    dietOrder: dietOrder.trim(),
  };
  const envelope = createBaseEnvelope({
    noteId,
    patientRecord,
    professionId,
    templateId,
    isFacultyMode,
    context,
    now,
  });

  if (professionId === 'pt' && !isFacultyMode) {
    const compatCaseId = createId('blank', now, randomToken);
    const patientMeta = buildPtCompatPatientMeta(patientRecord, now);
    const draft = buildPtDraftFromPatient(patientRecord, templateId, compatCaseId, now);
    storageAdapter.setItem(`patient_${compatCaseId}`, JSON.stringify(patientMeta));
    savePtDraft(compatCaseId, 'eval', draft);

    envelope.compatibility = {
      routeCaseId: compatCaseId,
      encounter: 'eval',
      routeHash: buildEditorHash({
        professionId: 'pt',
        caseId: compatCaseId,
        encounter: 'eval',
        isFacultyMode: false,
      }),
      shell: 'legacy-pt-student',
      storageKeys: [`patient_${compatCaseId}`, `draft_${compatCaseId}_eval`],
    };

    persistEnvelope(storageAdapter, envelope);
    return envelope;
  }

  if (professionId === 'pt') {
    const caseData = buildPtCaseData(patientRecord, context);
    const newCase = await createPtCase(caseData);
    const draft = buildPtDraftFromPatient(patientRecord, templateId, newCase.id, now);
    savePtDraft(newCase.id, 'eval', draft);

    envelope.compatibility = {
      routeCaseId: newCase.id,
      encounter: 'eval',
      routeHash: buildEditorHash({
        professionId: 'pt',
        caseId: newCase.id,
        encounter: 'eval',
        isFacultyMode: true,
      }),
      shell: 'legacy-pt-instructor',
      storageKeys: [`draft_${newCase.id}_eval`],
    };

    persistEnvelope(storageAdapter, envelope);
    return envelope;
  }

  if (professionId === 'dietetics') {
    const caseId = createId('diet_case', now, randomToken);
    const caseData = buildDieteticsCaseData(patientRecord, context);
    saveDieteticsCase(storageAdapter, caseId, caseData);

    envelope.compatibility = {
      routeCaseId: caseId,
      encounter: 'nutrition',
      routeHash: buildEditorHash({
        professionId: 'dietetics',
        caseId,
        encounter: 'nutrition',
        isFacultyMode,
      }),
      shell: 'dietetics-workspace',
      storageKeys: [DIET_CASES_KEY],
    };

    persistEnvelope(storageAdapter, envelope);
    return envelope;
  }

  throw new Error(`Unsupported profession "${professionId}".`);
}
