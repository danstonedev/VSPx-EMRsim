import { recordExportJob } from '$lib/services/chartRecords';
import { resolveExportTemplate } from '$lib/services/exportTemplates';

export interface RecordExportAuditInput {
  noteId: string;
  templateId: string;
  format?: string;
}

export function recordExportAudit({ noteId, templateId, format = 'docx' }: RecordExportAuditInput) {
  const template = resolveExportTemplate(templateId);
  if (!template) return null;
  return recordExportJob({
    noteId,
    templateId: template.id,
    format,
  });
}
