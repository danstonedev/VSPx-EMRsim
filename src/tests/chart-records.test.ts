import { beforeEach, describe, expect, it } from 'vitest';
import { storage } from '$lib/storage';
import { createCase, deleteCase, getCase, saveDraft } from '$lib/store';
import {
  buildCaseFileEntries,
  buildMyNotesEntries,
  clearChartRecords,
  getChartCaseContext,
  getChartRecords,
  getEncounterId,
  getCurrentDraftNote,
  getCurrentSignedNote,
  getPatientIdForCase,
  listArtifactsForCase,
  listExportJobsForCase,
  listNotesForEncounter,
  migrateLegacyCasesToChart,
  recordSignedNoteVersion,
  saveSignedNote,
  upsertArtifactRecord,
} from '$lib/services/chartRecords';
import { recordExportAudit } from '$lib/services/exportAudit';

describe('chart records service', () => {
  beforeEach(() => {
    storage.clear();
    clearChartRecords();
  });

  it('mirrors created cases into normalized patient and encounter records', () => {
    const wrapper = createCase({
      patientName: 'Morgan Hart',
      snapshot: { name: 'Morgan Hart', dob: '1990-01-02', sex: 'female' },
      encounters: {
        eval: { subjective: { chiefComplaint: 'Shoulder pain' } },
      },
    });

    const records = getChartRecords();
    const patientId = getPatientIdForCase(wrapper.id, wrapper.caseObj);
    const encounterId = getEncounterId(wrapper.id, 'eval');

    expect(records.patients[patientId]).toBeDefined();
    expect(records.patients[patientId].name).toBe('Morgan Hart');
    expect(records.encounters[encounterId]).toBeDefined();
    expect(records.encounters[encounterId].patientId).toBe(patientId);
  });

  it('writes draft saves through to draft note envelopes', () => {
    const wrapper = createCase({
      patientName: 'Taylor Bloom',
      encounters: { eval: {} },
    });

    saveDraft(wrapper.id, 'eval', {
      subjective: { chiefComplaint: 'Neck pain' },
      meta: { schemaVersion: 2 },
    });

    const records = getChartRecords();
    const encounter = records.encounters[getEncounterId(wrapper.id, 'eval')];
    expect(encounter.currentDraftNoteId).toBeTruthy();
    const note = records.notes[encounter.currentDraftNoteId!];
    expect(note.status).toBe('draft');
    expect(note.content.subjective).toEqual({ chiefComplaint: 'Neck pain' });
    expect(note.schemaVersion).toBe(2);
  });

  it('records immutable signed note versions separately from drafts', () => {
    const wrapper = createCase({
      patientName: 'Avery Cole',
      encounters: { eval: {} },
    });

    saveDraft(wrapper.id, 'eval', {
      subjective: { chiefComplaint: 'Low back pain' },
      meta: { version: 1, signedAt: '2026-03-26T10:00:00.000Z' },
    });

    const signed = recordSignedNoteVersion({
      caseId: wrapper.id,
      encounterKey: 'eval',
      caseObj: getCase(wrapper.id)?.caseObj ?? undefined,
      note: {
        subjective: { chiefComplaint: 'Low back pain' },
        meta: { version: 1, signedAt: '2026-03-26T10:00:00.000Z' },
      },
    });

    const records = getChartRecords();
    const encounter = records.encounters[getEncounterId(wrapper.id, 'eval')];
    expect(encounter.currentSignedNoteId).toBe(signed.id);
    expect(records.notes[signed.id].status).toBe('signed');
    expect(records.notes[signed.id].version).toBe(2);
  });

  it('migrates legacy drafts and modules into normalized notes and artifacts', () => {
    const cases = {
      case_1: {
        id: 'case_1',
        caseObj: {
          patientName: 'Jordan Vale',
          encounters: {
            eval: {
              subjective: { chiefComplaint: 'Hip pain' },
            },
          },
          modules: [
            {
              id: 'artifact_lab_1',
              title: 'CBC Results',
              category: 'Lab Results',
              date: '2026-03-01T00:00:00.000Z',
              content: 'Normal',
            },
          ],
        },
      },
    };

    const records = migrateLegacyCasesToChart(cases, {
      draft_case_1_followup: {
        subjective: { chiefComplaint: 'Improving hip pain' },
      },
    });

    expect(Object.values(records.notes)).toHaveLength(2);
    expect(listArtifactsForCase('case_1')).toHaveLength(1);
    expect(records.artifacts.artifact_lab_1.title).toBe('CBC Results');
  });

  it('preserves explicit artifacts and removes chart records when deleting a case', () => {
    const wrapper = createCase({
      patientName: 'Harper Diaz',
      encounters: { eval: {} },
    });

    upsertArtifactRecord({
      caseId: wrapper.id,
      artifact: {
        title: 'MRI Shoulder',
        category: 'Imaging & Reports',
      },
      caseObj: wrapper.caseObj,
    });

    expect(listArtifactsForCase(wrapper.id)).toHaveLength(1);
    expect(deleteCase(wrapper.id)).toBe(true);
    expect(Object.values(getChartRecords().patients)).toHaveLength(0);
  });

  it('builds selector-friendly case context and note entries', () => {
    const wrapper = createCase({
      patientName: 'Skyler Quinn',
      snapshot: { name: 'Skyler Quinn' },
      encounters: { eval: {} },
    });

    saveDraft(wrapper.id, 'eval', {
      noteTitle: 'Initial Evaluation',
      subjective: { chiefComplaint: 'Ankle pain' },
      meta: {
        signature: {
          name: 'Alex PT',
          title: 'DPT',
          signedAt: '2026-03-26T11:00:00.000Z',
          version: 1,
        },
      },
    });

    const signed = recordSignedNoteVersion({
      caseId: wrapper.id,
      encounterKey: 'eval',
      caseObj: wrapper.caseObj,
      note: {
        noteTitle: 'Initial Evaluation',
        subjective: { chiefComplaint: 'Ankle pain' },
        meta: {
          signature: {
            name: 'Alex PT',
            title: 'DPT',
            signedAt: '2026-03-26T11:00:00.000Z',
            version: 1,
          },
        },
      },
    });

    upsertArtifactRecord({
      caseId: wrapper.id,
      artifact: {
        title: 'Signed Eval',
        category: 'Signed Notes',
        signedBy: 'Alex PT',
      },
      encounterKey: 'eval',
      caseObj: wrapper.caseObj,
    });

    const context = getChartCaseContext(wrapper.id, wrapper.caseObj);
    expect(context.patient?.name).toBe('Skyler Quinn');
    expect(context.encounters).toHaveLength(1);
    expect(getCurrentDraftNote(wrapper.id, 'eval')).not.toBeNull();
    expect(getCurrentSignedNote(wrapper.id, 'eval')?.id).toBe(signed.id);
    expect(listNotesForEncounter(wrapper.id, 'eval').length).toBeGreaterThanOrEqual(2);

    const myNotes = buildMyNotesEntries(wrapper.id);
    expect(myNotes[0].title).toBe('Initial Evaluation');

    const caseFile = buildCaseFileEntries(wrapper.id);
    expect(caseFile).toHaveLength(1);
    expect(caseFile[0].signedBy).toBe('Alex PT');
  });

  it('records export audit jobs against signed notes', () => {
    const wrapper = createCase({
      patientName: 'Remy Ford',
      encounters: { eval: {} },
    });

    const signed = recordSignedNoteVersion({
      caseId: wrapper.id,
      encounterKey: 'eval',
      caseObj: wrapper.caseObj,
      note: {
        noteTitle: 'PT Eval',
        subjective: { chiefComplaint: 'Wrist pain' },
        meta: { signedAt: '2026-03-26T14:00:00.000Z' },
      },
    });

    const audit = recordExportAudit({
      noteId: signed.id,
      templateId: signed.templateId,
      format: 'docx',
    });

    expect(audit).not.toBeNull();
    const jobs = listExportJobsForCase(wrapper.id);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].noteId).toBe(signed.id);
    expect(jobs[0].sourceVersion).toBe(signed.version);
  });

  it('saveSignedNote persists a signed envelope and updates encounter pointers', () => {
    const wrapper = createCase({
      patientName: 'Drew Lane',
      encounters: { eval: {} },
    });

    const envelope = saveSignedNote(wrapper.id, 'eval', {
      noteTitle: 'PT Eval',
      subjective: { chiefComplaint: 'Hip pain' },
      meta: {
        signedAt: '2026-03-26T19:00:00.000Z',
        version: 4,
        schemaVersion: 2,
      },
    });

    const records = getChartRecords();
    const encounter = records.encounters[getEncounterId(wrapper.id, 'eval')];
    expect(envelope.status).toBe('signed');
    expect(envelope.signedAt).toBe('2026-03-26T19:00:00.000Z');
    expect(encounter.currentSignedNoteId).toBe(envelope.id);
    expect(records.notes[envelope.id].schemaVersion).toBe(2);
  });
});
