import { el } from '../../ui/utils.js';
import { isFieldComplete } from '../../features/navigation/SidebarProgressTracker.js';

export const PT_V2_SECTIONS = [
  { id: 'subjective', label: 'Subjective', icon: 'patient_list' },
  { id: 'objective', label: 'Objective', icon: 'biotech' },
  { id: 'assessment', label: 'Assessment', icon: 'clinical_notes' },
  { id: 'plan', label: 'Plan', icon: 'playlist_add_check' },
  { id: 'billing', label: 'Billing', icon: 'receipt_long' },
];

export const PT_SIMPLE_SOAP_SECTIONS = PT_V2_SECTIONS.filter((section) => section.id !== 'billing');

export const ptSimpleSoapDisciplineConfig = {
  sections: PT_SIMPLE_SOAP_SECTIONS,
  subsections: {
    subjective: ['subjective'],
    objective: ['objective'],
    assessment: ['assessment'],
    plan: ['plan'],
  },
  subsectionLabels: {
    subjective: 'Subjective',
    objective: 'Objective',
    assessment: 'Assessment',
    plan: 'Plan',
  },
  dataResolvers: {
    subjective: (section) => section?.subjective,
    objective: (section) => section?.objective,
    assessment: (section) => section?.assessment,
    plan: (section) => section?.plan,
  },
  requirements: {
    subjective: (value) => isFieldComplete(value),
    objective: (value) => isFieldComplete(value),
    assessment: (value) => isFieldComplete(value),
    plan: (value) => isFieldComplete(value),
  },
  sectionKeyMap: {
    subjective: 'simpleSOAP',
    objective: 'simpleSOAP',
    assessment: 'simpleSOAP',
    plan: 'simpleSOAP',
  },
};

async function renderStandardPtSection(sectionId, draft, onDraftChange) {
  if (sectionId === 'subjective') {
    const { createSubjectiveSection } =
      await import('../../features/soap/subjective/SubjectiveSection.js');
    return createSubjectiveSection(draft.subjective || {}, (data) => {
      draft.subjective = data;
      onDraftChange(draft);
    });
  }

  if (sectionId === 'objective') {
    const { createObjectiveSection } =
      await import('../../features/soap/objective/ObjectiveSection.js');
    return createObjectiveSection(draft.objective || {}, (data) => {
      draft.objective = data;
      onDraftChange(draft);
    });
  }

  if (sectionId === 'assessment') {
    const { createAssessmentSection } =
      await import('../../features/soap/assessment/AssessmentSection.js');
    return createAssessmentSection(draft.assessment || {}, (data) => {
      draft.assessment = data;
      onDraftChange(draft);
    });
  }

  if (sectionId === 'plan') {
    const { createPlanSection } = await import('../../features/soap/plan/PlanMain.js');
    return createPlanSection(draft.plan || {}, (data) => {
      draft.plan = data;
      onDraftChange(draft);
    });
  }

  if (sectionId === 'billing') {
    const { createBillingSection } = await import('../../features/soap/billing/BillingSection.js');
    return createBillingSection(draft.billing || {}, (data) => {
      draft.billing = data;
      onDraftChange(draft);
    });
  }

  return el('div', { class: 'note-editor__pilot-panel-status' }, 'Section unavailable.');
}

async function renderSimpleSoapSection(sectionId, draft, onDraftChange) {
  const { createAllSimpleSections } = await import('../../features/soap/SimpleSOAPSection.js');
  const sections = createAllSimpleSections(draft, () => onDraftChange(draft));
  return (
    sections.find((section) => section.id === sectionId)?.content ||
    el('div', {}, 'Section unavailable.')
  );
}

export function getPtSectionsForTemplate(templateId) {
  return templateId === 'pt-simple-soap' ? PT_SIMPLE_SOAP_SECTIONS : PT_V2_SECTIONS;
}

export async function renderPtSectionWorkspace({ templateId, sectionId, draft, onDraftChange }) {
  return templateId === 'pt-simple-soap'
    ? await renderSimpleSoapSection(sectionId, draft, onDraftChange)
    : await renderStandardPtSection(sectionId, draft, onDraftChange);
}
