const PILOT_NOTE_CATALOG = {
  pt: {
    professionId: 'pt',
    professionLabel: 'Physical Therapy',
    templates: [
      {
        id: 'pt-eval',
        label: 'PT Initial Evaluation (SOAP)',
        shortLabel: 'PT Evaluation',
        encounter: 'pilot-eval',
      },
      {
        id: 'pt-simple-soap',
        label: 'PT Simple SOAP Note',
        shortLabel: 'PT Simple SOAP',
        encounter: 'pilot-simple-soap',
      },
    ],
  },
  dietetics: {
    professionId: 'dietetics',
    professionLabel: 'Dietetics',
    templates: [
      {
        id: 'dietetics-ncp',
        label: 'Nutrition Care Process Note',
        shortLabel: 'NCP Note',
        encounter: 'nutrition',
      },
    ],
  },
};

export function listPilotProfessions() {
  return Object.values(PILOT_NOTE_CATALOG).map(({ professionId, professionLabel }) => ({
    id: professionId,
    label: professionLabel,
  }));
}

export function listPilotTemplatesForProfession(professionId) {
  return PILOT_NOTE_CATALOG[professionId]?.templates || [];
}

export function getPilotTemplate(templateId) {
  const allTemplates = Object.values(PILOT_NOTE_CATALOG).flatMap((entry) => entry.templates);
  return allTemplates.find((template) => template.id === templateId) || null;
}

export function getProfessionLabel(professionId) {
  return PILOT_NOTE_CATALOG[professionId]?.professionLabel || 'Unknown Profession';
}

export function isDieteticsDraft(draft) {
  return Boolean(draft && (draft.nutrition_assessment || draft.nutrition_diagnosis));
}

export function getDraftProfessionId(draft) {
  return isDieteticsDraft(draft) ? 'dietetics' : 'pt';
}

export function getDraftTemplateId(draft, encounter = '') {
  if (isDieteticsDraft(draft)) return 'dietetics-ncp';
  if (draft?.noteType === 'simple-soap') return 'pt-simple-soap';
  if (
    String(encounter || '')
      .toLowerCase()
      .includes('simple')
  )
    return 'pt-simple-soap';
  return 'pt-eval';
}

export function getDraftTemplateLabel(draft, encounter = '') {
  const template = getPilotTemplate(getDraftTemplateId(draft, encounter));
  return template?.label || 'Clinical Note';
}

export function buildEditorHash({ professionId, caseId, encounter = '', isFacultyMode = false }) {
  const mode = isFacultyMode ? 'instructor' : 'student';

  if (professionId === 'dietetics') {
    return `#/dietetics/${mode}/editor?case=${encodeURIComponent(caseId)}`;
  }

  const resolvedEncounter = encounter || 'eval';
  return `#/${mode}/editor?case=${encodeURIComponent(caseId)}&v=0&encounter=${encodeURIComponent(resolvedEncounter)}`;
}
