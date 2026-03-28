export interface ExportTemplateDefinition {
  id: string;
  discipline: string;
  label: string;
  rendererKey: string;
}

const EXPORT_TEMPLATES: Record<string, ExportTemplateDefinition> = {
  'pt.eval.v1': {
    id: 'pt.eval.v1',
    discipline: 'pt',
    label: 'PT Evaluation',
    rendererKey: 'docx-v2',
  },
  'pt.followup.v1': {
    id: 'pt.followup.v1',
    discipline: 'pt',
    label: 'PT Follow-Up',
    rendererKey: 'docx-v2',
  },
  'pt.soap.v1': {
    id: 'pt.soap.v1',
    discipline: 'pt',
    label: 'PT SOAP Note',
    rendererKey: 'docx-v2',
  },
  'pt.discharge.v1': {
    id: 'pt.discharge.v1',
    discipline: 'pt',
    label: 'PT Discharge Summary',
    rendererKey: 'docx-v2',
  },
  'dietetics.adime.v1': {
    id: 'dietetics.adime.v1',
    discipline: 'dietetics',
    label: 'Dietetics ADIME Note',
    rendererKey: 'docx-v2',
  },
};

export function resolveExportTemplate(templateId: string): ExportTemplateDefinition | null {
  return EXPORT_TEMPLATES[templateId] ?? null;
}

export function listExportTemplates(): ExportTemplateDefinition[] {
  return Object.values(EXPORT_TEMPLATES);
}
