/**
 * PT-specific discipline configuration for progress tracking and section definitions.
 * Ported from app/js/features/navigation/pt-discipline-config.js
 */

import {
  genericProgressCheck,
  hasAnyContent,
  isFieldComplete,
  type DisciplineProgressConfig,
  type ProgressStatus,
  type SectionData,
} from '$lib/config/progressUtils';

export interface SectionDef {
  id: string;
  label: string;
  icon: string;
}

export const ptSections: SectionDef[] = [
  { id: 'subjective', label: 'Subjective', icon: 'S' },
  { id: 'objective', label: 'Objective', icon: 'O' },
  { id: 'assessment', label: 'Assessment', icon: 'A' },
  { id: 'plan', label: 'Plan', icon: 'P' },
  { id: 'billing', label: 'Billing', icon: 'B' },
];

export const ptSubsections: Record<string, string[]> = {
  subjective: [
    'patient-profile',
    'history',
    'interview-qa',
    'pain-assessment',
    'red-flag-screening',
    'current-medications',
  ],
  objective: [
    'vital-signs',
    'systems-review',
    'inspection-palpation',
    'communication-cognition',
    'cardiovascular-pulmonary',
    'integumentary',
    'musculoskeletal',
    'neuromuscular',
    'standardized-assessments',
    'treatment-performed',
  ],
  assessment: [
    'primary-impairments',
    'icf-classification',
    'pt-diagnosis',
    'prognosis',
    'clinical-reasoning',
  ],
  plan: [
    'visit-parameters',
    'goal-setting',
    'treatment-narrative',
    'in-clinic-treatment-plan',
    'hep-plan',
    'patient-education',
  ],
  billing: ['diagnosis-codes', 'cpt-codes', 'orders-referrals'],
};

export const ptSubsectionLabels: Record<string, string> = {
  'patient-profile': 'Patient Profile',
  history: 'History',
  'interview-qa': 'Interview Q&A',
  'pain-assessment': 'Symptoms',
  'red-flag-screening': 'Red Flags / Screening',
  'current-medications': 'Medication & Supplements',
  'vital-signs': 'Vital Signs',
  'systems-review': 'Systems Review',
  'inspection-palpation': 'Inspection & Palpation',
  'communication-cognition': 'Communication / Cognition',
  'cardiovascular-pulmonary': 'Cardiovascular / Pulmonary',
  integumentary: 'Integumentary',
  musculoskeletal: 'Musculoskeletal',
  neuromuscular: 'Neuromuscular',
  'standardized-assessments': 'Standardized Assessments',
  'treatment-performed': 'Treatment Performed',
  'primary-impairments': 'Primary Impairments',
  'icf-classification': 'ICF Classification',
  'pt-diagnosis': 'Physical Therapy Diagnosis',
  prognosis: 'Prognosis',
  'clinical-reasoning': 'Clinical Impression',
  'visit-parameters': 'Visit Parameters',
  'goal-setting': 'Goals',
  'treatment-narrative': 'Treatment Narrative',
  'in-clinic-treatment-plan': 'In-Clinic Treatment Plan',
  'hep-plan': 'HEP',
  'patient-education': 'Patient Education',
  'diagnosis-codes': 'ICD-10 Codes',
  'cpt-codes': 'CPT Codes',
  'orders-referrals': 'Orders & Referrals',
};

export const ptDataResolvers: Record<string, (section: SectionData) => unknown> = {
  'patient-profile': (section) => ({
    patientName: section?.patientName,
    patientBirthday: section?.patientBirthday,
    patientAge: section?.patientAge,
    patientGender: section?.patientGender,
    patientGenderIdentityPronouns: section?.patientGenderIdentityPronouns,
    patientPreferredLanguage: section?.patientPreferredLanguage,
    patientWorkStatusOccupation: section?.patientWorkStatusOccupation,
    patientLivingSituationHomeEnvironment: section?.patientLivingSituationHomeEnvironment,
  }),
  history: (section) => ({
    chiefComplaint: section?.chiefComplaint,
    historyOfPresentIllness: section?.historyOfPresentIllness,
    functionalLimitations: section?.functionalLimitations,
    additionalHistory: section?.additionalHistory,
    priorLevel: section?.priorLevel,
    patientGoals: section?.patientGoals,
  }),
  'current-medications': (section) => ({
    medications: section?.medications,
    medicationsCurrent: section?.medicationsCurrent,
  }),
  'pain-assessment': (section) => ({
    location: section?.painLocation,
    scale: section?.painScale,
    quality: section?.painQuality,
    pattern: section?.painPattern,
    aggravatingFactors: section?.aggravatingFactors,
    easingFactors: section?.easingFactors,
  }),
  'red-flag-screening': (section) => ({
    redFlagScreening: section?.redFlagScreening,
    redFlags: section?.redFlags,
  }),
  'interview-qa': (section) => ({ qaItems: section?.qaItems }),
  'vital-signs': (section) => ({
    vitals: section?.vitals,
    vitalsSeries: section?.vitalsSeries,
  }),
  'systems-review': (section) => section?.systemsReview,
  'inspection-palpation': (section) => ({
    inspection: section?.inspection,
    palpation: section?.palpation,
  }),
  'communication-cognition': (section) => ({
    orientation: section?.orientation,
    memoryAttention: section?.memoryAttention,
    safetyAwareness: section?.safetyAwareness,
    visionPerception: section?.visionPerception,
  }),
  'cardiovascular-pulmonary': (section) => ({
    auscultation: section?.auscultation,
    edema: section?.edema,
    endurance: section?.endurance,
  }),
  integumentary: (section) => ({
    skinIntegrity: section?.skinIntegrity,
    colorTemp: section?.colorTemp,
  }),
  musculoskeletal: (section) => ({
    regionalAssessments: section?.regionalAssessments,
    rom: section?.rom,
    mmt: section?.mmt,
    specialTests: section?.specialTests,
  }),
  neuromuscular: (section) => ({
    neuro: section?.neuro,
    tone: section?.tone,
    cranialNerves: section?.cranialNerves,
    coordination: section?.coordination,
    balance: section?.balance,
    standardizedAssessments: section?.standardizedAssessments,
    functional: section?.functional,
  }),
  'standardized-assessments': (section) => section?.standardizedAssessments,
  'treatment-performed': (section) => section?.treatmentPerformed,
  'primary-impairments': (section) => section?.primaryImpairments,
  'icf-classification': (section) => ({
    bodyFunctions: section?.bodyFunctions,
    activityLimitations: section?.activityLimitations,
    participationRestrictions: section?.participationRestrictions,
  }),
  'pt-diagnosis': (section) => section?.ptDiagnosis,
  prognosis: (section) => ({
    prognosis: section?.prognosis,
    prognosticFactors: section?.prognosticFactors,
  }),
  'clinical-reasoning': (section) => section?.clinicalReasoning,
  'visit-parameters': (section) => ({
    frequency: section?.frequency,
    duration: section?.duration,
  }),
  'goal-setting': (section) => section?.goals,
  'treatment-narrative': (section) => ({
    treatmentPlan: section?.treatmentPlan,
    exerciseFocus: section?.exerciseFocus,
    exercisePrescription: section?.exercisePrescription,
    manualTherapy: section?.manualTherapy,
    modalities: section?.modalities,
  }),
  'in-clinic-treatment-plan': (section) => section?.inClinicInterventions,
  'hep-plan': (section) => section?.hepInterventions,
  'patient-education': (section) => section?.patientEducation,
  'diagnosis-codes': (section) => section?.diagnosisCodes,
  'cpt-codes': (section) => section?.billingCodes,
  'orders-referrals': (section) => section?.ordersReferrals,
};

type RequirementFn = (data: unknown, section: SectionData) => boolean;

export const ptRequirements: Record<string, RequirementFn> = {
  'patient-profile': (data) => hasAnyContent(data),
  history: (_data, section) => {
    return (
      isFieldComplete(section?.chiefComplaint) &&
      isFieldComplete(section?.historyOfPresentIllness) &&
      isFieldComplete(section?.functionalLimitations) &&
      isFieldComplete(section?.additionalHistory) &&
      isFieldComplete(section?.priorLevel) &&
      isFieldComplete(section?.patientGoals)
    );
  },
  'current-medications': (_data, section) => {
    const meds = section?.medications;
    return Array.isArray(meds) && meds.length > 0;
  },
  'pain-assessment': (_data, section) => {
    if (typeof section !== 'object' || Array.isArray(section) || !section) return false;
    return (
      isFieldComplete(section.painLocation) &&
      isFieldComplete(section.painScale) &&
      isFieldComplete(section.painQuality) &&
      isFieldComplete(section.painPattern) &&
      isFieldComplete(section.aggravatingFactors) &&
      isFieldComplete(section.easingFactors)
    );
  },
  'red-flag-screening': (_data, section) => {
    const flags = section?.redFlagScreening;
    return (
      Array.isArray(flags) &&
      (flags as Array<{ status: string }>).some((item) => item.status !== 'not-screened')
    );
  },
  'interview-qa': (_data, section) => {
    const items = section?.qaItems;
    return Array.isArray(items)
      ? (items as Array<{ question: string; response: string }>).some(
          (item) => isFieldComplete(item?.question) && isFieldComplete(item?.response),
        )
      : false;
  },
  'vital-signs': (data) => hasAnyContent(data),
  'systems-review': (data) => isFieldComplete(data),
  'inspection-palpation': (data) => hasAnyContent(data),
  'communication-cognition': (data) => hasAnyContent(data),
  'cardiovascular-pulmonary': (data) => hasAnyContent(data),
  integumentary: (data) => hasAnyContent(data),
  musculoskeletal: (data) => {
    const section = data as SectionData;
    if (!section || typeof section !== 'object') return false;
    return (
      isFieldComplete(section.rom) ||
      isFieldComplete(section.mmt) ||
      isFieldComplete(section.specialTests)
    );
  },
  neuromuscular: (data) => hasAnyContent(data),
  'standardized-assessments': (data) => {
    return Array.isArray(data) && data.length > 0;
  },
  'treatment-performed': (data) => isFieldComplete(data),
  'primary-impairments': (data, section) => isFieldComplete(section?.primaryImpairments ?? data),
  'icf-classification': (_data, section) =>
    isFieldComplete(section?.bodyFunctions) &&
    isFieldComplete(section?.activityLimitations) &&
    isFieldComplete(section?.participationRestrictions),
  'pt-diagnosis': (data, section) => isFieldComplete(section?.ptDiagnosis ?? data),
  prognosis: (data) => hasAnyContent(data),
  'clinical-reasoning': (data, section) => isFieldComplete(section?.clinicalReasoning ?? data),
  'visit-parameters': (data) => {
    const section = data as SectionData;
    return isFieldComplete(section?.frequency) && isFieldComplete(section?.duration);
  },
  'goal-setting': (data) => isFieldComplete(data),
  'treatment-narrative': (data) => hasAnyContent(data),
  'in-clinic-treatment-plan': (data) => isFieldComplete(data),
  'hep-plan': (data) => isFieldComplete(data),
  'patient-education': (data) => isFieldComplete(data),
  'diagnosis-codes': (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every((item: { code: string }) => isFieldComplete(item.code));
  },
  'cpt-codes': (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(
      (item: { code: string; units: number; timeSpent: string }) =>
        isFieldComplete(item.code) && item.units > 0 && isFieldComplete(item.timeSpent),
    );
  },
  'orders-referrals': (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(
      (item: { type: string; details: string }) =>
        isFieldComplete(item.type) && isFieldComplete(item.details),
    );
  },
};

export function getSubsectionStatus(
  subsectionData: unknown,
  subsectionType: string,
  fullSectionData: SectionData,
): ProgressStatus {
  if (subsectionData === undefined || subsectionData === null) return 'empty';

  const requirement = ptRequirements[subsectionType];
  if (requirement) {
    const isComplete = requirement(subsectionData, fullSectionData);
    return isComplete ? 'complete' : hasAnyContent(subsectionData) ? 'partial' : 'empty';
  }
  return genericProgressCheck(subsectionData);
}

export function getSectionStatus(
  sectionId: string,
  draftData: Record<string, Record<string, unknown>>,
): ProgressStatus {
  const sectionData = draftData[sectionId];
  const subIds = ptSubsections[sectionId] ?? [];
  if (subIds.length === 0) return 'empty';

  const statuses = subIds.map((subId) => {
    const resolver = ptDataResolvers[subId];
    const subData = resolver ? resolver(sectionData) : sectionData?.[subId];
    return getSubsectionStatus(subData, subId, sectionData);
  });

  if (statuses.every((status) => status === 'complete')) return 'complete';
  if (statuses.every((status) => status === 'empty')) return 'empty';
  return 'partial';
}

export const ptDisciplineConfig: DisciplineProgressConfig = {
  sections: ptSections,
  subsections: ptSubsections,
  subsectionLabels: ptSubsectionLabels,
  dataResolvers: ptDataResolvers,
  requirements: ptRequirements,
};
