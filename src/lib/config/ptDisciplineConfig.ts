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
import type { SystemState } from '$lib/config/systemsReview';

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
    'history',
    'interview-qa',
    'pain-assessment',
    'red-flag-screening',
    'current-medications',
  ],
  objective: [
    'vital-signs',
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
  history: 'History',
  'interview-qa': 'Interview Q&A',
  'pain-assessment': 'Symptoms',
  'red-flag-screening': 'Red Flags / Screening',
  'current-medications': 'Medication & Supplements',
  'vital-signs': 'Vital Signs',
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getSystemState(section: SectionData, systemId: string): SystemState | null {
  const systemsReview = asRecord(asRecord(section)?.systemsReview);
  const state = systemsReview?.[systemId];
  return (asRecord(state) as SystemState | null) ?? null;
}

function isDeferredSystemComplete(section: SectionData, systemId: string): boolean {
  const state = getSystemState(section, systemId);
  return state?.status === 'wnl' && isFieldComplete(state.deferReason);
}

function isEveryEnteredRowComplete<T>(value: unknown, isRowComplete: (row: T) => boolean): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;

  const meaningfulRows = value.filter((row) => hasAnyContent(row));
  if (meaningfulRows.length === 0) return false;
  if (meaningfulRows.length !== value.length) return false;

  return meaningfulRows.every((row) => isRowComplete(row as T));
}

function hasCompleteAssessmentSet(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (entry) =>
        asRecord(entry)?.status === 'complete' &&
        Number(asRecord(asRecord(entry)?.scores)?.completedItems) ===
          Number(asRecord(asRecord(entry)?.scores)?.totalItems),
    )
  );
}

function isGoalRowComplete(row: unknown): boolean {
  const goal = asRecord(row);
  return isFieldComplete(goal?.goal) && isFieldComplete(goal?.timeframe);
}

function isPlanInterventionComplete(row: unknown): boolean {
  const intervention = asRecord(row);
  return isFieldComplete(intervention?.intervention) && isFieldComplete(intervention?.dosage);
}

function isTreatmentEntryComplete(row: unknown): boolean {
  const entry = asRecord(row);
  return isFieldComplete(entry?.description);
}

function hasSystemDocumentation(section: SectionData, systemId: string, details: unknown): boolean {
  if (isDeferredSystemComplete(section, systemId)) return true;
  return getSystemState(section, systemId)?.status === 'impaired' && hasAnyContent(details);
}

export const ptDataResolvers: Record<string, (section: SectionData) => unknown> = {
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
  'inspection-palpation': (section) => ({
    inspection: section?.inspection,
    palpation: section?.palpation,
  }),
  'communication-cognition': (section) => ({
    systemState: getSystemState(section, 'communication'),
    arousalLevel: section?.arousalLevel,
    orientation: section?.orientation,
    hearingStatus: section?.hearingStatus,
    speechStatus: section?.speechStatus,
    memoryAttention: section?.memoryAttention,
    safetyAwareness: section?.safetyAwareness,
    visionPerception: section?.visionPerception,
  }),
  'cardiovascular-pulmonary': (section) => ({
    systemState: getSystemState(section, 'cardiovascular'),
    heartSounds: section?.heartSounds,
    auscultation: section?.auscultation,
    lungAuscultation: section?.lungAuscultation,
    respiratoryPattern: section?.respiratoryPattern,
    edema: section?.edema,
    edemaAssessments: section?.edemaAssessments,
    endurance: section?.endurance,
  }),
  integumentary: (section) => ({
    systemState: getSystemState(section, 'integumentary'),
    skinIntegrity: section?.skinIntegrity,
    colorTemp: section?.colorTemp,
  }),
  musculoskeletal: (section) => ({
    systemState: getSystemState(section, 'musculoskeletal'),
    postureAssessment: section?.postureAssessment,
    regionalAssessments: section?.regionalAssessments,
    rom: section?.rom,
    mmt: section?.mmt,
    specialTests: section?.specialTests,
  }),
  neuromuscular: (section) => ({
    systemState: getSystemState(section, 'neuromuscular'),
    neuro: section?.neuro,
    neuroscreenData: section?.neuroscreenData,
    tone: section?.tone,
    toneAssessments: section?.toneAssessments,
    coordination: section?.coordination,
    balance: section?.balance,
    functional: section?.functional,
  }),
  'standardized-assessments': (section) => section?.standardizedAssessments,
  'treatment-performed': (section) => ({
    interventions: section?.interventions,
    treatmentPerformed: section?.treatmentPerformed,
  }),
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
  'inspection-palpation': (data) => hasAnyContent(data),
  'communication-cognition': (_data, section) => {
    const details = {
      arousalLevel: section?.arousalLevel,
      orientation: section?.orientation,
      hearingStatus: section?.hearingStatus,
      speechStatus: section?.speechStatus,
      memoryAttention: section?.memoryAttention,
      safetyAwareness: section?.safetyAwareness,
      visionPerception: section?.visionPerception,
    };
    return hasSystemDocumentation(section, 'communication', details);
  },
  'cardiovascular-pulmonary': (_data, section) => {
    const details = {
      heartSounds: section?.heartSounds,
      auscultation: section?.auscultation,
      lungAuscultation: section?.lungAuscultation,
      respiratoryPattern: section?.respiratoryPattern,
      edema: section?.edema,
      edemaAssessments: section?.edemaAssessments,
      endurance: section?.endurance,
    };
    return hasSystemDocumentation(section, 'cardiovascular', details);
  },
  integumentary: (_data, section) => {
    const details = {
      skinIntegrity: section?.skinIntegrity,
      colorTemp: section?.colorTemp,
    };
    return hasSystemDocumentation(section, 'integumentary', details);
  },
  musculoskeletal: (_data, section) => {
    const regionalAssessments = asRecord(section?.regionalAssessments);
    const details = {
      postureAssessment: section?.postureAssessment,
      arom: regionalAssessments?.arom,
      prom: regionalAssessments?.prom,
      rims: regionalAssessments?.rims,
      endFeel: regionalAssessments?.endFeel,
      mmt: regionalAssessments?.mmt,
      specialTests: regionalAssessments?.specialTests,
    };
    return hasSystemDocumentation(section, 'musculoskeletal', details);
  },
  neuromuscular: (_data, section) => {
    const details = {
      neuro: section?.neuro,
      neuroscreenData: section?.neuroscreenData,
      tone: section?.tone,
      toneAssessments: section?.toneAssessments,
      coordination: section?.coordination,
      balance: section?.balance,
      functional: section?.functional,
    };
    return hasSystemDocumentation(section, 'neuromuscular', details);
  },
  'standardized-assessments': (data) => {
    return hasCompleteAssessmentSet(data);
  },
  'treatment-performed': (data, section) => {
    return (
      isEveryEnteredRowComplete(section?.interventions, isTreatmentEntryComplete) ||
      isFieldComplete(section?.treatmentPerformed) ||
      isEveryEnteredRowComplete(asRecord(data)?.interventions, isTreatmentEntryComplete) ||
      isFieldComplete(asRecord(data)?.treatmentPerformed)
    );
  },
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
  'goal-setting': (data) => isEveryEnteredRowComplete(data, isGoalRowComplete),
  'treatment-narrative': (data) => hasAnyContent(data),
  'in-clinic-treatment-plan': (data) => isEveryEnteredRowComplete(data, isPlanInterventionComplete),
  'hep-plan': (data) => isEveryEnteredRowComplete(data, isPlanInterventionComplete),
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
      (item: { type: string; description: string }) =>
        isFieldComplete(item.type) && isFieldComplete(item.description),
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
