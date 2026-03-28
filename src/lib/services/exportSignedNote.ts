import { exportNoteToDocx, triggerDocxDownload } from '$lib/services/docxExport';
import { recordExportAudit } from '$lib/services/exportAudit';
import type { NoteEnvelope } from '$lib/services/chartRecords';

export interface ExportSignedNoteOptions {
  envelope: NoteEnvelope;
  patient: {
    name: string;
    dob?: string;
    caseId?: string;
  };
  filename?: string;
  autoDownload?: boolean;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'note';
}

export async function exportSignedNoteToDocxWithAudit({
  envelope,
  patient,
  filename,
  autoDownload = false,
}: ExportSignedNoteOptions): Promise<{ blob: Blob; filename: string }> {
  const blob = await exportNoteToDocx(envelope.content, patient, envelope.templateId);

  recordExportAudit({
    noteId: envelope.id,
    templateId: envelope.templateId,
    format: 'docx',
  });

  const resolvedFilename =
    filename ??
    `${sanitizeFilenamePart(patient.name)}_${sanitizeFilenamePart(envelope.legacyEncounterKey)}.docx`;

  if (autoDownload) {
    triggerDocxDownload(blob, resolvedFilename);
  }

  return { blob, filename: resolvedFilename };
}
