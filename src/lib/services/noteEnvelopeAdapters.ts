import type { CaseFileEntry } from '$lib/services/casefileRepository';
import type { NoteData, Signature } from '$lib/services/noteLifecycle';
import type { MyNotesEntry, NoteEnvelope } from '$lib/services/chartRecords';

export interface SignedNoteViewerModel {
  id: string;
  title: string;
  patientName?: string;
  status: NoteEnvelope['status'];
  note: NoteData;
  signature?: Signature;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

export function noteEnvelopeToNoteData(envelope: NoteEnvelope): NoteData {
  return structuredClone(envelope.content) as NoteData;
}

export function noteEnvelopeToMyNotesEntry(envelope: NoteEnvelope): MyNotesEntry {
  const content = asRecord(envelope.content);
  const signature = asRecord(envelope.meta.signature);
  const encounterMap: Record<string, number> = {
    eval: 1,
    followup: 2,
    soap: 3,
    discharge: 4,
    nutrition: 1,
  };

  const encounterLabels: Record<string, string> = {
    eval: 'Initial Evaluation',
    followup: 'Follow-Up / Progress Note',
    soap: 'SOAP Progress Note',
    discharge: 'Discharge Summary',
    nutrition: 'Nutrition Care Process',
  };

  return {
    id: envelope.id,
    title:
      encounterLabels[envelope.legacyEncounterKey] ?? `${envelope.templateId} v${envelope.version}`,
    encounter: encounterMap[envelope.legacyEncounterKey] ?? 99,
    encounterKey: envelope.legacyEncounterKey,
    encounterLabel: encounterLabels[envelope.legacyEncounterKey] ?? envelope.legacyEncounterKey,
    status: envelope.status,
    lastModified: envelope.updatedAt,
    signature: signature.name
      ? {
          name: asString(signature.name),
          title: asString(signature.title),
          signedAt: asString(signature.signedAt),
          version: Number(signature.version ?? envelope.version),
        }
      : undefined,
    data: structuredClone(content),
  };
}

export function noteEnvelopeToSignedNoteViewerModel(
  envelope: NoteEnvelope,
  patientName?: string,
): SignedNoteViewerModel {
  const content = noteEnvelopeToNoteData(envelope);
  const signatureRecord = asRecord(envelope.meta.signature);
  const signature = signatureRecord.name
    ? ({
        name: asString(signatureRecord.name),
        title: asString(signatureRecord.title),
        signedAt: asString(signatureRecord.signedAt),
        version: Number(signatureRecord.version ?? envelope.version),
      } satisfies Signature)
    : undefined;

  const viewerLabels: Record<string, string> = {
    eval: 'Initial Evaluation',
    followup: 'Follow-Up / Progress Note',
    soap: 'SOAP Progress Note',
    discharge: 'Discharge Summary',
    nutrition: 'Nutrition Care Process',
  };

  return {
    id: envelope.id,
    title:
      viewerLabels[envelope.legacyEncounterKey] ?? `${envelope.templateId} v${envelope.version}`,
    patientName,
    status: envelope.status,
    note: content,
    signature,
  };
}

const caseFileLabels: Record<string, string> = {
  eval: 'Initial Evaluation',
  followup: 'Follow-Up / Progress Note',
  soap: 'SOAP Progress Note',
  discharge: 'Discharge Summary',
  nutrition: 'Nutrition Care Process',
};

export function noteEnvelopeToCaseFileEntry(envelope: NoteEnvelope): CaseFileEntry {
  const content = asRecord(envelope.content);
  const signature = asRecord(envelope.meta.signature);
  return {
    id: envelope.id,
    category: 'Signed Notes',
    title: caseFileLabels[envelope.legacyEncounterKey] ?? 'Signed Note',
    date: envelope.signedAt ?? envelope.updatedAt,
    content: '',
    html: typeof content.html === 'string' ? content.html : undefined,
    signedBy: asString(signature.name) || undefined,
    noteType: caseFileLabels[envelope.legacyEncounterKey] || undefined,
  };
}
