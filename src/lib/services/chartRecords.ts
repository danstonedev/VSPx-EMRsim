import { storage } from '$lib/storage';
import type { CaseObj, CasesMap, CaseWrapper } from '$lib/store';
import type { CaseFileCategory, CaseFileEntry } from '$lib/services/casefileRepository';
import type { NoteData } from '$lib/services/noteLifecycle';

const CHART_RECORDS_KEY = 'pt_emr_chart_records_v1';
const CHART_COUNTERS_KEY = 'pt_emr_chart_counters_v1';

export type ChartDiscipline = 'pt' | 'dietetics' | 'unknown';
export type NoteStatus = 'draft' | 'signed' | 'amended';

export interface ChartPatient {
  id: string;
  legacyCaseIds: string[];
  vspId?: string;
  name: string;
  dob?: string;
  sex?: string;
  age?: string;
  disciplineHints: ChartDiscipline[];
  encounterIds: string[];
  artifactIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChartEncounter {
  id: string;
  patientId: string;
  legacyCaseId: string;
  legacyEncounterKey: string;
  discipline: ChartDiscipline;
  templateId: string;
  status: NoteStatus;
  noteIds: string[];
  currentDraftNoteId?: string;
  currentSignedNoteId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteEnvelope {
  id: string;
  patientId: string;
  encounterId: string;
  legacyCaseId: string;
  legacyEncounterKey: string;
  discipline: ChartDiscipline;
  templateId: string;
  schemaVersion: number;
  status: NoteStatus;
  version: number;
  supersedesNoteId?: string;
  content: Record<string, unknown>;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
}

export interface ChartArtifact {
  id: string;
  patientId: string;
  encounterId?: string;
  legacyCaseId: string;
  category: string;
  title: string;
  date: string;
  content?: string;
  html?: string;
  signedBy?: string;
  noteType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportJobRecord {
  id: string;
  noteId: string;
  patientId: string;
  encounterId: string;
  templateId: string;
  format: string;
  sourceVersion: number;
  createdAt: string;
}

export interface ChartRecords {
  version: 1;
  patients: Record<string, ChartPatient>;
  encounters: Record<string, ChartEncounter>;
  notes: Record<string, NoteEnvelope>;
  artifacts: Record<string, ChartArtifact>;
  exportJobs: Record<string, ExportJobRecord>;
}

interface ChartCounters {
  note: number;
  artifact: number;
  exportJob: number;
}

const DEFAULT_RECORDS: ChartRecords = {
  version: 1,
  patients: {},
  encounters: {},
  notes: {},
  artifacts: {},
  exportJobs: {},
};

const DEFAULT_COUNTERS: ChartCounters = {
  note: 0,
  artifact: 0,
  exportJob: 0,
};

// ── In-memory cache ──────────────────────────────────────────
// loadRecords() is called 20+ times per save cycle across stores
// and derived computations. Caching avoids redundant JSON.parse
// of the same localStorage blob. The cache is invalidated on
// every saveRecords() call, so reads always reflect the latest
// persisted state.
let _cachedRecords: ChartRecords | null = null;

function loadRecords(): ChartRecords {
  if (_cachedRecords) return _cachedRecords;
  try {
    const raw = storage.getItem(CHART_RECORDS_KEY);
    if (!raw) {
      _cachedRecords = structuredClone(DEFAULT_RECORDS);
      return _cachedRecords;
    }
    const parsed = JSON.parse(raw) as Partial<ChartRecords>;
    _cachedRecords = {
      version: 1,
      patients: parsed.patients ?? {},
      encounters: parsed.encounters ?? {},
      notes: parsed.notes ?? {},
      artifacts: parsed.artifacts ?? {},
      exportJobs: parsed.exportJobs ?? {},
    };
    return _cachedRecords;
  } catch {
    _cachedRecords = structuredClone(DEFAULT_RECORDS);
    return _cachedRecords;
  }
}

function saveRecords(records: ChartRecords): void {
  storage.setItem(CHART_RECORDS_KEY, JSON.stringify(records));
  _cachedRecords = records; // update cache — next loadRecords() skips JSON.parse
}

/** Force the cache to re-read from localStorage. Call this if
 *  external code (e.g. another tab) might have modified the data. */
export function invalidateChartRecordsCache(): void {
  _cachedRecords = null;
}

function loadCounters(): ChartCounters {
  try {
    const raw = storage.getItem(CHART_COUNTERS_KEY);
    if (!raw) return { ...DEFAULT_COUNTERS };
    const parsed = JSON.parse(raw) as Partial<ChartCounters>;
    return {
      note: parsed.note ?? 0,
      artifact: parsed.artifact ?? 0,
      exportJob: parsed.exportJob ?? 0,
    };
  } catch {
    return { ...DEFAULT_COUNTERS };
  }
}

function nextCounter(key: keyof ChartCounters): number {
  const counters = loadCounters();
  counters[key] += 1;
  storage.setItem(CHART_COUNTERS_KEY, JSON.stringify(counters));
  return counters[key];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function removeItem<T>(items: T[], item: T): T[] {
  return items.filter((entry) => entry !== item);
}

export function getChartRecords(): ChartRecords {
  return loadRecords();
}

export interface ChartCaseContext {
  patient: ChartPatient | null;
  encounters: ChartEncounter[];
  draftNotes: NoteEnvelope[];
  signedNotes: NoteEnvelope[];
  artifacts: ChartArtifact[];
}

export function clearChartRecords(): void {
  storage.removeItem(CHART_RECORDS_KEY);
  storage.removeItem(CHART_COUNTERS_KEY);
  _cachedRecords = null;
}

export function getPatientIdForCase(caseId: string, caseObj?: CaseObj): string {
  const meta = asRecord(caseObj?.meta);
  const vspId = asString(meta.vspId) || asString(caseObj?.vspId);
  return vspId ? `patient:${vspId}` : `patient:legacy:${caseId}`;
}

export function getEncounterId(caseId: string, encounterKey: string): string {
  return `encounter:${caseId}:${encounterKey}`;
}

export function resolveDiscipline(
  caseObj?: CaseObj,
  draft?: Record<string, unknown>,
): ChartDiscipline {
  const meta = asRecord(caseObj?.meta);
  const profession =
    asString(meta.profession).toLowerCase() ||
    asString(meta.discipline).toLowerCase() ||
    asString(draft?.discipline).toLowerCase();
  if (profession.includes('diet')) return 'dietetics';
  if (profession.includes('pt') || profession.includes('physical')) return 'pt';
  return 'pt';
}

export function resolveTemplateId(
  discipline: ChartDiscipline,
  encounterKey: string,
  draft?: Record<string, unknown>,
): string {
  const explicitTemplateId = asString(draft?.templateId);
  if (explicitTemplateId) return explicitTemplateId;

  const noteType = asString(draft?.noteType).toLowerCase();
  if (discipline === 'dietetics') {
    return 'dietetics.adime.v1';
  }
  if (noteType === 'simple-soap' || encounterKey === 'soap') {
    return 'pt.soap.v1';
  }
  if (encounterKey === 'discharge') {
    return 'pt.discharge.v1';
  }
  if (encounterKey === 'followup') {
    return 'pt.followup.v1';
  }
  return 'pt.eval.v1';
}

export function extractPatientSnapshot(
  caseId: string,
  caseObj?: CaseObj,
): Pick<ChartPatient, 'id' | 'vspId' | 'name' | 'dob' | 'sex' | 'age'> {
  const meta = asRecord(caseObj?.meta);
  const snapshot = asRecord(caseObj?.snapshot);
  return {
    id: getPatientIdForCase(caseId, caseObj),
    vspId: asString(meta.vspId) || asString(caseObj?.vspId) || undefined,
    name:
      asString(snapshot.name) ||
      asString(caseObj?.patientName) ||
      asString(meta.patientName) ||
      asString(caseObj?.title) ||
      caseId,
    dob:
      asString(snapshot.dob) ||
      asString(caseObj?.patientDOB) ||
      asString(meta.patientDOB) ||
      undefined,
    sex:
      asString(snapshot.sex) || asString(caseObj?.patientGender) || asString(meta.sex) || undefined,
    age: asString(snapshot.age) || asString(caseObj?.patientAge) || asString(meta.age) || undefined,
  };
}

function ensurePatient(records: ChartRecords, caseId: string, caseObj?: CaseObj): ChartPatient {
  const now = new Date().toISOString();
  const snapshot = extractPatientSnapshot(caseId, caseObj);
  const discipline = resolveDiscipline(caseObj);
  const existing = records.patients[snapshot.id];
  const patient: ChartPatient = existing
    ? {
        ...existing,
        vspId: snapshot.vspId ?? existing.vspId,
        name: snapshot.name || existing.name,
        dob: snapshot.dob ?? existing.dob,
        sex: snapshot.sex ?? existing.sex,
        age: snapshot.age ?? existing.age,
        legacyCaseIds: addUnique(existing.legacyCaseIds, caseId),
        disciplineHints: addUnique(existing.disciplineHints, discipline),
        updatedAt: now,
      }
    : {
        id: snapshot.id,
        legacyCaseIds: [caseId],
        vspId: snapshot.vspId,
        name: snapshot.name,
        dob: snapshot.dob,
        sex: snapshot.sex,
        age: snapshot.age,
        disciplineHints: [discipline],
        encounterIds: [],
        artifactIds: [],
        createdAt: now,
        updatedAt: now,
      };
  records.patients[patient.id] = patient;
  return patient;
}

function ensureEncounter(
  records: ChartRecords,
  caseId: string,
  encounterKey: string,
  caseObj?: CaseObj,
  noteStatus: NoteStatus = 'draft',
): ChartEncounter {
  const now = new Date().toISOString();
  const patient = ensurePatient(records, caseId, caseObj);
  const id = getEncounterId(caseId, encounterKey);
  const discipline = resolveDiscipline(caseObj);
  const templateId = resolveTemplateId(discipline, encounterKey);
  const existing = records.encounters[id];
  const encounter: ChartEncounter = existing
    ? {
        ...existing,
        discipline,
        templateId,
        status: noteStatus === 'signed' || noteStatus === 'amended' ? noteStatus : existing.status,
        updatedAt: now,
      }
    : {
        id,
        patientId: patient.id,
        legacyCaseId: caseId,
        legacyEncounterKey: encounterKey,
        discipline,
        templateId,
        status: noteStatus,
        noteIds: [],
        createdAt: now,
        updatedAt: now,
      };
  records.encounters[id] = encounter;
  patient.encounterIds = addUnique(patient.encounterIds, id);
  records.patients[patient.id] = patient;
  return encounter;
}

/** Fast content-changed check: compares JSON serializations.
 *  This is a deep equality check (not shallow). It runs once per
 *  draft upsert. The cost is proportional to note size (~5-15 KB). */
function contentEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function upsertDraftNoteRecord(opts: {
  caseId: string;
  encounterKey: string;
  draft: Record<string, unknown>;
  caseObj?: CaseObj;
}): NoteEnvelope {
  const records = loadRecords();
  const now = new Date().toISOString();
  const patient = ensurePatient(records, opts.caseId, opts.caseObj);
  const encounter = ensureEncounter(records, opts.caseId, opts.encounterKey, opts.caseObj, 'draft');
  const draftMeta = asRecord(opts.draft.meta);
  const existing = encounter.currentDraftNoteId
    ? records.notes[encounter.currentDraftNoteId]
    : undefined;

  let note: NoteEnvelope;
  if (existing) {
    const nextVersion = contentEqual(existing.content, opts.draft)
      ? existing.version
      : existing.version + 1;
    note = {
      ...existing,
      patientId: patient.id,
      encounterId: encounter.id,
      legacyCaseId: opts.caseId,
      legacyEncounterKey: opts.encounterKey,
      discipline: resolveDiscipline(opts.caseObj, opts.draft),
      templateId: resolveTemplateId(
        resolveDiscipline(opts.caseObj, opts.draft),
        opts.encounterKey,
        opts.draft,
      ),
      schemaVersion: Number(draftMeta.schemaVersion ?? existing.schemaVersion ?? 1),
      status: 'draft',
      version: nextVersion,
      content: structuredClone(opts.draft),
      meta: structuredClone(draftMeta),
      updatedAt: now,
    };
  } else {
    note = {
      id: `note_${nextCounter('note')}`,
      patientId: patient.id,
      encounterId: encounter.id,
      legacyCaseId: opts.caseId,
      legacyEncounterKey: opts.encounterKey,
      discipline: resolveDiscipline(opts.caseObj, opts.draft),
      templateId: resolveTemplateId(
        resolveDiscipline(opts.caseObj, opts.draft),
        opts.encounterKey,
        opts.draft,
      ),
      schemaVersion: Number(draftMeta.schemaVersion ?? 1),
      status: 'draft',
      version: Number(draftMeta.version ?? 1),
      content: structuredClone(opts.draft),
      meta: structuredClone(draftMeta),
      createdAt: now,
      updatedAt: now,
    };
  }

  records.notes[note.id] = note;
  encounter.noteIds = addUnique(encounter.noteIds, note.id);
  encounter.currentDraftNoteId = note.id;
  encounter.updatedAt = now;
  records.encounters[encounter.id] = encounter;
  saveRecords(records);
  return note;
}

export function recordSignedNoteVersion(opts: {
  caseId: string;
  encounterKey: string;
  note: Record<string, unknown>;
  caseObj?: CaseObj;
  status?: Extract<NoteStatus, 'signed' | 'amended'>;
}): NoteEnvelope {
  const records = loadRecords();
  const now = new Date().toISOString();
  const patient = ensurePatient(records, opts.caseId, opts.caseObj);
  const encounter = ensureEncounter(
    records,
    opts.caseId,
    opts.encounterKey,
    opts.caseObj,
    opts.status ?? 'signed',
  );
  const draftMeta = asRecord(opts.note.meta);
  const previousSignedId = encounter.currentSignedNoteId;
  const previousSigned = previousSignedId ? records.notes[previousSignedId] : undefined;

  const note: NoteEnvelope = {
    id: `note_${nextCounter('note')}`,
    patientId: patient.id,
    encounterId: encounter.id,
    legacyCaseId: opts.caseId,
    legacyEncounterKey: opts.encounterKey,
    discipline: resolveDiscipline(opts.caseObj, opts.note),
    templateId: resolveTemplateId(
      resolveDiscipline(opts.caseObj, opts.note),
      opts.encounterKey,
      opts.note,
    ),
    schemaVersion: Number(draftMeta.schemaVersion ?? 1),
    status: opts.status ?? 'signed',
    version: Number(draftMeta.version ?? previousSigned?.version ?? 0) + 1,
    supersedesNoteId: previousSigned?.id,
    content: structuredClone(opts.note),
    meta: structuredClone(draftMeta),
    createdAt: now,
    updatedAt: now,
    signedAt: asString(draftMeta.signedAt) || now,
  };

  records.notes[note.id] = note;
  encounter.noteIds = addUnique(encounter.noteIds, note.id);
  encounter.currentSignedNoteId = note.id;
  encounter.status = note.status;
  encounter.updatedAt = now;
  records.encounters[encounter.id] = encounter;
  saveRecords(records);
  return note;
}

export function saveSignedNote(
  caseId: string,
  encounterKey: string,
  signedNote: NoteData,
  caseObj?: CaseObj,
): NoteEnvelope {
  const records = loadRecords();
  const now = new Date().toISOString();
  const patient = ensurePatient(records, caseId, caseObj);
  const encounter = ensureEncounter(records, caseId, encounterKey, caseObj, 'signed');
  const noteMeta = asRecord(signedNote.meta);

  const envelope: NoteEnvelope = {
    id: `note_${nextCounter('note')}`,
    patientId: patient.id,
    encounterId: encounter.id,
    legacyCaseId: caseId,
    legacyEncounterKey: encounterKey,
    discipline: resolveDiscipline(caseObj, signedNote as Record<string, unknown>),
    templateId: resolveTemplateId(
      resolveDiscipline(caseObj, signedNote as Record<string, unknown>),
      encounterKey,
      signedNote as Record<string, unknown>,
    ),
    schemaVersion: Number(noteMeta.schemaVersion ?? 1),
    status: 'signed',
    version: Number(noteMeta.version ?? noteMeta.signedVersion ?? 1),
    supersedesNoteId: encounter.currentSignedNoteId,
    content: structuredClone(signedNote as Record<string, unknown>),
    meta: structuredClone(noteMeta),
    createdAt: now,
    updatedAt: now,
    signedAt: asString(noteMeta.signedAt) || now,
  };

  // Mark the superseded note as 'amended' so the chain is visible
  if (envelope.supersedesNoteId && records.notes[envelope.supersedesNoteId]) {
    records.notes[envelope.supersedesNoteId].status = 'amended';
    records.notes[envelope.supersedesNoteId].updatedAt = now;
  }

  records.notes[envelope.id] = envelope;
  encounter.noteIds = addUnique(encounter.noteIds, envelope.id);
  encounter.currentSignedNoteId = envelope.id;
  encounter.status = 'signed';
  encounter.updatedAt = now;
  records.encounters[encounter.id] = encounter;
  saveRecords(records);
  return envelope;
}

export function upsertArtifactRecord(opts: {
  caseId: string;
  artifact: Partial<CaseFileEntry> & { title: string; category: string; date?: string };
  encounterKey?: string;
  caseObj?: CaseObj;
}): ChartArtifact {
  const records = loadRecords();
  const now = new Date().toISOString();
  const patient = ensurePatient(records, opts.caseId, opts.caseObj);
  const encounterId = opts.encounterKey
    ? getEncounterId(opts.caseId, opts.encounterKey)
    : undefined;
  const artifactId = asString(opts.artifact.id) || `artifact_${nextCounter('artifact')}`;
  const existing = records.artifacts[artifactId];

  const artifact: ChartArtifact = {
    id: artifactId,
    patientId: patient.id,
    encounterId,
    legacyCaseId: opts.caseId,
    category: opts.artifact.category,
    title: opts.artifact.title,
    date: opts.artifact.date ?? now,
    content: opts.artifact.content,
    html: opts.artifact.html,
    signedBy: opts.artifact.signedBy,
    noteType: opts.artifact.noteType,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  records.artifacts[artifact.id] = artifact;
  patient.artifactIds = addUnique(patient.artifactIds, artifact.id);
  records.patients[patient.id] = patient;
  saveRecords(records);
  return artifact;
}

export function deleteArtifact(artifactId: string): boolean {
  const records = loadRecords();
  const artifact = records.artifacts[artifactId];
  if (!artifact) return false;

  delete records.artifacts[artifactId];

  // Remove from parent patient's artifactIds
  for (const patient of Object.values(records.patients)) {
    patient.artifactIds = patient.artifactIds.filter((id) => id !== artifactId);
  }

  saveRecords(records);
  return true;
}

export function recordExportJob(opts: {
  noteId: string;
  format: string;
  templateId: string;
}): ExportJobRecord | null {
  const records = loadRecords();
  const note = records.notes[opts.noteId];
  if (!note) return null;
  const id = `export_${nextCounter('exportJob')}`;
  const exportJob: ExportJobRecord = {
    id,
    noteId: note.id,
    patientId: note.patientId,
    encounterId: note.encounterId,
    templateId: opts.templateId,
    format: opts.format,
    sourceVersion: note.version,
    createdAt: new Date().toISOString(),
  };
  records.exportJobs[id] = exportJob;
  saveRecords(records);
  return exportJob;
}

export function deleteCaseChartRecords(caseId: string): void {
  const records = loadRecords();
  const encounterIds = Object.keys(records.encounters).filter(
    (id) => records.encounters[id].legacyCaseId === caseId,
  );
  const noteIds = Object.keys(records.notes).filter(
    (id) => records.notes[id].legacyCaseId === caseId,
  );
  const artifactIds = Object.keys(records.artifacts).filter(
    (id) => records.artifacts[id].legacyCaseId === caseId,
  );

  for (const noteId of noteIds) delete records.notes[noteId];
  for (const encounterId of encounterIds) delete records.encounters[encounterId];
  for (const artifactId of artifactIds) delete records.artifacts[artifactId];

  for (const patient of Object.values(records.patients)) {
    patient.legacyCaseIds = removeItem(patient.legacyCaseIds, caseId);
    patient.encounterIds = patient.encounterIds.filter((id) => !encounterIds.includes(id));
    patient.artifactIds = patient.artifactIds.filter((id) => !artifactIds.includes(id));
    patient.updatedAt = new Date().toISOString();
    if (
      patient.legacyCaseIds.length === 0 &&
      patient.encounterIds.length === 0 &&
      patient.artifactIds.length === 0
    ) {
      delete records.patients[patient.id];
    }
  }

  saveRecords(records);
}

export function migrateLegacyCasesToChart(
  cases: CasesMap,
  drafts: Record<string, unknown> = {},
): ChartRecords {
  clearChartRecords();
  const records = loadRecords();

  for (const [caseId, wrapper] of Object.entries(cases)) {
    ensurePatient(records, caseId, wrapper.caseObj);
    const encounters = asRecord(wrapper.caseObj.encounters);
    for (const [encounterKey, encounterData] of Object.entries(encounters)) {
      ensureEncounter(records, caseId, encounterKey, wrapper.caseObj, 'draft');
      if (isRecord(encounterData)) {
        upsertDraftNoteRecord({
          caseId,
          encounterKey,
          draft: encounterData,
          caseObj: wrapper.caseObj,
        });
      }
    }

    const modules = Array.isArray(wrapper.caseObj.modules) ? wrapper.caseObj.modules : [];
    for (const moduleEntry of modules) {
      const artifact = asRecord(moduleEntry);
      const title = asString(artifact.title) || asString(artifact.name) || 'Artifact';
      upsertArtifactRecord({
        caseId,
        caseObj: wrapper.caseObj,
        artifact: {
          id: asString(artifact.id),
          title,
          category: (asString(artifact.category) || 'Other Documents') as CaseFileCategory,
          date: asString(artifact.date) || new Date().toISOString(),
          content: asString(artifact.content),
          html: asString(artifact.html) || undefined,
        },
      });
    }
  }

  for (const [draftKey, draft] of Object.entries(drafts)) {
    const match = draftKey.match(/^draft_(.+)_(.+)$/);
    if (!match || !isRecord(draft)) continue;
    const [, caseId, encounterKey] = match;
    const caseWrapper = cases[caseId];
    upsertDraftNoteRecord({
      caseId,
      encounterKey,
      draft,
      caseObj: caseWrapper?.caseObj,
    });
  }

  return getChartRecords();
}

export function listDraftNotesForCase(caseId: string): NoteEnvelope[] {
  const records = loadRecords();
  return Object.values(records.notes).filter(
    (note) => note.legacyCaseId === caseId && note.status === 'draft',
  );
}

export function listArtifactsForCase(caseId: string): ChartArtifact[] {
  const records = loadRecords();
  return Object.values(records.artifacts).filter((artifact) => artifact.legacyCaseId === caseId);
}

export function listSignedNotesForCase(caseId: string): NoteEnvelope[] {
  const records = loadRecords();
  return Object.values(records.notes).filter(
    (note) =>
      note.legacyCaseId === caseId && (note.status === 'signed' || note.status === 'amended'),
  );
}

export function getPatientForCase(caseId: string, caseObj?: CaseObj): ChartPatient | null {
  const records = loadRecords();
  const patientId = getPatientIdForCase(caseId, caseObj);
  return records.patients[patientId] ?? null;
}

export function listEncountersForCase(caseId: string): ChartEncounter[] {
  const records = loadRecords();
  return Object.values(records.encounters)
    .filter((encounter) => encounter.legacyCaseId === caseId)
    .sort((a, b) => a.legacyEncounterKey.localeCompare(b.legacyEncounterKey));
}

export function listNotesForEncounter(caseId: string, encounterKey: string): NoteEnvelope[] {
  const records = loadRecords();
  const encounterId = getEncounterId(caseId, encounterKey);
  return Object.values(records.notes)
    .filter((note) => note.encounterId === encounterId)
    .sort((a, b) => a.version - b.version);
}

export function getCurrentDraftNote(caseId: string, encounterKey: string): NoteEnvelope | null {
  const records = loadRecords();
  const encounter = records.encounters[getEncounterId(caseId, encounterKey)];
  return encounter?.currentDraftNoteId
    ? (records.notes[encounter.currentDraftNoteId] ?? null)
    : null;
}

export function getCurrentSignedNote(caseId: string, encounterKey: string): NoteEnvelope | null {
  const records = loadRecords();
  const encounter = records.encounters[getEncounterId(caseId, encounterKey)];
  return encounter?.currentSignedNoteId
    ? (records.notes[encounter.currentSignedNoteId] ?? null)
    : null;
}

export function listArtifactsForEncounter(caseId: string, encounterKey: string): ChartArtifact[] {
  const records = loadRecords();
  const encounterId = getEncounterId(caseId, encounterKey);
  return Object.values(records.artifacts).filter(
    (artifact) => artifact.encounterId === encounterId,
  );
}

export function getChartCaseContext(caseId: string, caseObj?: CaseObj): ChartCaseContext {
  return {
    patient: getPatientForCase(caseId, caseObj),
    encounters: listEncountersForCase(caseId),
    draftNotes: listDraftNotesForCase(caseId),
    signedNotes: listSignedNotesForCase(caseId),
    artifacts: listArtifactsForCase(caseId),
  };
}

export interface MyNotesEntry {
  id: string;
  title: string;
  encounter: number;
  encounterKey: string;
  encounterLabel: string;
  status: NoteStatus;
  lastModified: string;
  signature?: {
    name: string;
    title: string;
    signedAt: string;
    version: number;
  };
  data: Record<string, unknown>;
}

function encounterOrder(encounterKey: string): number {
  const order: Record<string, number> = {
    eval: 1,
    followup: 2,
    soap: 3,
    discharge: 4,
    nutrition: 1,
  };
  return order[encounterKey] ?? 99;
}

function encounterLabel(encounterKey: string): string {
  const labels: Record<string, string> = {
    eval: 'Initial Evaluation',
    followup: 'Follow-Up / Progress Note',
    soap: 'SOAP Progress Note',
    discharge: 'Discharge Summary',
    nutrition: 'Nutrition Care Process',
  };
  return labels[encounterKey] ?? encounterKey;
}

export function buildMyNotesEntries(caseId: string): MyNotesEntry[] {
  const records = loadRecords();
  return Object.values(records.notes)
    .filter((note) => note.legacyCaseId === caseId)
    .sort((a, b) => {
      const encounterSort =
        encounterOrder(a.legacyEncounterKey) - encounterOrder(b.legacyEncounterKey);
      if (encounterSort !== 0) return encounterSort;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .map((note) => ({
      id: note.id,
      title: encounterLabel(note.legacyEncounterKey) || `${note.templateId} v${note.version}`,
      encounter: encounterOrder(note.legacyEncounterKey),
      encounterKey: note.legacyEncounterKey,
      encounterLabel: encounterLabel(note.legacyEncounterKey),
      status: note.status,
      lastModified: note.updatedAt,
      signature: isRecord(note.meta.signature)
        ? {
            name: asString(note.meta.signature.name),
            title: asString(note.meta.signature.title),
            signedAt: asString(note.meta.signature.signedAt),
            version: Number(note.meta.signature.version ?? note.version),
          }
        : undefined,
      data: structuredClone(note.content),
    }));
}

export function buildCaseFileEntries(caseId: string): CaseFileEntry[] {
  const records = loadRecords();
  return Object.values(records.artifacts)
    .filter((artifact) => artifact.legacyCaseId === caseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((artifact) => ({
      id: artifact.id,
      category: artifact.category as CaseFileEntry['category'],
      title: artifact.title,
      date: artifact.date,
      content: artifact.content ?? '',
      html: artifact.html,
      signedBy: artifact.signedBy,
      noteType: artifact.noteType,
    }));
}

export function listExportJobsForCase(caseId: string): ExportJobRecord[] {
  const records = loadRecords();
  const noteIds = new Set(
    Object.values(records.notes)
      .filter((note) => note.legacyCaseId === caseId)
      .map((note) => note.id),
  );
  return Object.values(records.exportJobs)
    .filter((job) => noteIds.has(job.noteId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function syncCaseWrapperToChart(wrapper: CaseWrapper): void {
  const records = loadRecords();
  ensurePatient(records, wrapper.id, wrapper.caseObj);
  const encounters = asRecord(wrapper.caseObj.encounters);
  for (const encounterKey of Object.keys(encounters)) {
    ensureEncounter(records, wrapper.id, encounterKey, wrapper.caseObj, 'draft');
  }
  saveRecords(records);
}
