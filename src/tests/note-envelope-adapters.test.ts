import { describe, expect, it } from 'vitest';
import {
  noteEnvelopeToCaseFileEntry,
  noteEnvelopeToMyNotesEntry,
  noteEnvelopeToNoteData,
  noteEnvelopeToSignedNoteViewerModel,
} from '$lib/services/noteEnvelopeAdapters';
import type { NoteEnvelope } from '$lib/services/chartRecords';

const envelope: NoteEnvelope = {
  id: 'note_1',
  patientId: 'patient:legacy:case_1',
  encounterId: 'encounter:case_1:eval',
  legacyCaseId: 'case_1',
  legacyEncounterKey: 'eval',
  discipline: 'pt',
  templateId: 'pt.eval.v1',
  schemaVersion: 1,
  status: 'signed',
  version: 2,
  content: {
    noteTitle: 'Initial Evaluation',
    noteType: 'PT Evaluation',
    subjective: { chiefComplaint: 'Shoulder pain' },
  },
  meta: {
    signature: {
      name: 'Taylor PT',
      title: 'DPT',
      signedAt: '2026-03-26T22:00:00.000Z',
      version: 2,
    },
  },
  createdAt: '2026-03-26T21:00:00.000Z',
  updatedAt: '2026-03-26T22:00:00.000Z',
  signedAt: '2026-03-26T22:00:00.000Z',
};

describe('note envelope adapters', () => {
  it('converts an envelope into note data', () => {
    const note = noteEnvelopeToNoteData(envelope);
    expect(note.noteTitle).toBe('Initial Evaluation');
    expect(note.subjective).toEqual({ chiefComplaint: 'Shoulder pain' });
  });

  it('converts an envelope into my-notes card data', () => {
    const entry = noteEnvelopeToMyNotesEntry(envelope);
    expect(entry.title).toBe('Initial Evaluation');
    expect(entry.status).toBe('signed');
    expect(entry.signature?.name).toBe('Taylor PT');
  });

  it('converts an envelope into signed-note viewer data', () => {
    const model = noteEnvelopeToSignedNoteViewerModel(envelope, 'Alex Carter');
    expect(model.patientName).toBe('Alex Carter');
    expect(model.signature?.title).toBe('DPT');
    expect(model.note.noteType).toBe('PT Evaluation');
  });

  it('converts an envelope into a case-file entry', () => {
    const entry = noteEnvelopeToCaseFileEntry(envelope);
    expect(entry.category).toBe('Signed Notes');
    expect(entry.signedBy).toBe('Taylor PT');
    expect(entry.title).toBe('Initial Evaluation');
  });
});
