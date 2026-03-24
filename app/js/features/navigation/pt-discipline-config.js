// pt-discipline-config.js — PT-specific progress tracking configuration
//
// Supplies sections, subsections, data resolvers, labels, and completion
// requirements to SidebarProgressTracker for Physical Therapy SOAP notes.
//
// Usage:
//   import { ptDisciplineConfig } from './pt-discipline-config.js';
//   import { createProgressTracker } from './SidebarProgressTracker.js';
//   const tracker = createProgressTracker(ptDisciplineConfig);

import { isFieldComplete } from './SidebarProgressTracker.js';

// ── Plan helper resolvers (shared by requirements + resolvers) ─────

function getPlanInterventionRows(data, section) {
  return (
    section?.inClinicInterventions ||
    data?.inClinicInterventions ||
    section?.exerciseTable ||
    data?.exerciseTable
  );
}

function getPlanGoalRows(data, section) {
  return section?.goals || data?.goals || section?.goalsTable || data?.goalsTable;
}

function getPlanScheduleCompletion(data, section) {
  return {
    hasFreq: isFieldComplete(section?.frequency || data?.frequency),
    hasDur: isFieldComplete(section?.duration || data?.duration),
  };
}

function isPatientProfileComplete(section) {
  return (
    isFieldComplete(section?.patientName) &&
    isFieldComplete(section?.patientBirthday) &&
    isFieldComplete(section?.patientAge) &&
    isFieldComplete(section?.patientGender)
  );
}

// ── Section definitions ────────────────────────────────────────────

export const ptSections = [
  { id: 'subjective', label: 'Subjective', icon: '◉' },
  { id: 'objective', label: 'Objective', icon: '⚬' },
  { id: 'assessment', label: 'Assessment', icon: '⬢' },
  { id: 'plan', label: 'Plan', icon: '▪' },
  { id: 'billing', label: 'Billing', icon: '⬟' },
];

// ── Subsection IDs per section ─────────────────────────────────────

export const ptSubsections = {
  subjective: [
    'hpi',
    'history',
    'interview-qa',
    'pain-assessment',
    'red-flag-screening',
    'current-medications',
  ],
  objective: [
    'vital-signs',
    'systems-review',
    'communication-cognition',
    'cardiovascular-pulmonary',
    'integumentary',
    'musculoskeletal',
    'neuromuscular',
    'treatment-performed',
  ],
  assessment: ['primary-impairments', 'icf-classification', 'pt-diagnosis', 'clinical-reasoning'],
  plan: ['goal-setting', 'in-clinic-treatment-plan', 'hep-plan'],
  billing: ['diagnosis-codes', 'cpt-codes', 'orders-referrals'],
};

// ── Human-readable labels ──────────────────────────────────────────

export const ptSubsectionLabels = {
  hpi: 'Patient Profile',
  history: 'History',
  'interview-qa': 'Interview Q&A',
  'pain-assessment': 'Symptoms',
  'red-flag-screening': 'Red Flags / Screening',
  'current-medications': 'Medication & Supplements',
  'systems-review': 'Systems Review',
  'vital-signs': 'Vital Signs',
  'treatment-performed': 'Treatment Performed',
  'communication-cognition': 'Communication / Cognition',
  'cardiovascular-pulmonary': 'Cardiovascular / Pulmonary',
  integumentary: 'Integumentary',
  musculoskeletal: 'Musculoskeletal',
  neuromuscular: 'Neuromuscular',
  'primary-impairments': 'Primary Impairments',
  'icf-classification': 'ICF Classification',
  'pt-diagnosis': 'Physical Therapy Diagnosis & Prognosis',
  'clinical-reasoning': 'Clinical Impression',
  'in-clinic-treatment-plan': 'In-Clinic Treatment Plan',
  'goal-setting': 'Goals',
  'hep-plan': 'HEP',
  'diagnosis-codes': 'ICD-10 Codes',
  'cpt-codes': 'CPT Codes',
  'billing-notes': 'Billing Notes',
  'orders-referrals': 'Orders & Referrals',
};

// ── Data resolvers (extract subsection data from section object) ───

export const ptDataResolvers = {
  // Subjective
  hpi: (section) => ({
    patientName: section?.patientName,
    patientBirthday: section?.patientBirthday,
    patientAge: section?.patientAge,
    patientGender: section?.patientGender,
    patientDemographics: section?.patientDemographics,
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
  'interview-qa': (section) => ({
    qaItems: section?.qaItems,
  }),
  // Objective
  'systems-review': (section) => section?.systemsReview,
  'vital-signs': (section) => section?.vitals,
  'regional-assessment': (section) => ({
    rom: section?.rom,
    mmt: section?.mmt,
    specialTests: section?.specialTests,
    regionalAssessments: section?.regionalAssessments,
  }),
  'neurological-screening': (section) => section?.neuro?.screening,
  'functional-movement': (section) => section?.functional?.assessment,
  'tone-assessment': (section) => section?.tone,
  'coordination-assessment': (section) => section?.coordination,
  'balance-assessment': (section) => section?.balance,
  'cranial-nerves': (section) => section?.cranialNerves,
  'endurance-assessment': (section) => section?.endurance,
  'edema-assessment': (section) => section?.edema,
  'auscultation-assessment': (section) => section?.auscultation,
  'skin-integrity': (section) => section?.skinIntegrity,
  'color-temperature': (section) => section?.colorTemp,
  'orientation-alertness': (section) => section?.orientation,
  'memory-attention': (section) => section?.memoryAttention,
  'safety-awareness': (section) => section?.safetyAwareness,
  'vision-perception': (section) => section?.visionPerception,
  'treatment-performed': (section) => section?.treatmentPerformed,
  // Objective categories (aggregate children)
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
    functional: section?.functional,
  }),
  // Assessment
  'primary-impairments': (section) => section?.primaryImpairments,
  'icf-classification': (section) => ({
    bodyFunctions: section?.bodyFunctions,
    activityLimitations: section?.activityLimitations,
    participationRestrictions: section?.participationRestrictions,
  }),
  'pt-diagnosis': (section) => section?.ptDiagnosis,
  'clinical-reasoning': (section) => section?.clinicalReasoning,
  // Plan
  'treatment-plan': (section) => section,
  'in-clinic-treatment-plan': (section) => ({
    inClinicInterventions: section?.inClinicInterventions,
    exerciseTable: section?.exerciseTable,
    frequency: section?.frequency,
    duration: section?.duration,
  }),
  'goal-setting': (section) => ({
    goals: section?.goals,
    frequency: section?.frequency,
    duration: section?.duration,
    goalsTable: section?.goalsTable,
  }),
  // Billing
  'diagnosis-codes': (section) => section?.diagnosisCodes || section?.icdCodes,
  'cpt-codes': (section) => section?.billingCodes || section?.cptCodes,
  'billing-notes': (section) => section?.skilledJustification || section?.treatmentNotes,
  'orders-referrals': (section) => section?.ordersReferrals,
};

// ── Completion requirements (returns true when subsection is "done") ───

/* eslint-disable complexity */
export const ptRequirements = {
  // Subjective
  hpi: (_data, section) => isPatientProfileComplete(section),
  history: (_data, section) => {
    const chiefComplaint = section?.chiefComplaint || section?.chiefConcern;
    const hpiText =
      section?.historyOfPresentIllness ??
      section?.detailedHistoryOfCurrentCondition ??
      section?.hpi ??
      '';
    return (
      isFieldComplete(chiefComplaint) &&
      isFieldComplete(hpiText) &&
      isFieldComplete(section?.functionalLimitations) &&
      isFieldComplete(section?.additionalHistory) &&
      isFieldComplete(section?.priorLevel) &&
      isFieldComplete(section?.patientGoals)
    );
  },
  'current-medications': (_data, section) => {
    return Array.isArray(section?.medications)
      ? section.medications.length > 0
      : isFieldComplete(section?.medicationsCurrent);
  },
  'pain-assessment': (data, section) => {
    const painData =
      section &&
      (section.painLocation ||
        section.painScale ||
        section.painQuality ||
        section.painPattern ||
        section.aggravatingFactors ||
        section.easingFactors)
        ? section
        : data;
    if (typeof painData !== 'object' || Array.isArray(painData)) return false;
    return (
      isFieldComplete(painData.painLocation || painData.location) &&
      isFieldComplete(painData.painScale || painData.scale) &&
      isFieldComplete(painData.painQuality || painData.quality) &&
      isFieldComplete(painData.painPattern || painData.pattern) &&
      isFieldComplete(painData.aggravatingFactors) &&
      isFieldComplete(painData.easingFactors)
    );
  },
  'red-flag-screening': (_data, section) => {
    return Array.isArray(section?.redFlagScreening)
      ? section.redFlagScreening.some((i) => i.status !== 'not-screened')
      : isFieldComplete(section?.redFlags);
  },
  'interview-qa': (_data, section) => {
    return Array.isArray(section?.qaItems)
      ? section.qaItems.some((q) => isFieldComplete(q?.question) && isFieldComplete(q?.response))
      : false;
  },

  // Objective
  'regional-assessment': (data, section) => {
    const ra = section?.regionalAssessments || data?.regionalAssessments || data;
    if (!ra || typeof ra !== 'object') return false;
    const hasRom = ra.rom && isFieldComplete(ra.rom);
    const hasMmt = ra.mmt && isFieldComplete(ra.mmt);
    const hasTests = ra.specialTests && isFieldComplete(ra.specialTests);
    return Boolean(hasRom || hasMmt || hasTests);
  },
  neuro: (_data, section) => isFieldComplete(section?.neuro?.screening),
  functional: (_data, section) => isFieldComplete(section?.functional?.assessment),

  // Assessment
  'primary-impairments': (data, section) => isFieldComplete(section?.primaryImpairments || data),
  'icf-classification': (_data, section) => {
    return (
      isFieldComplete(section?.bodyFunctions) &&
      isFieldComplete(section?.activityLimitations) &&
      isFieldComplete(section?.participationRestrictions)
    );
  },
  'pt-diagnosis': (data, section) => isFieldComplete(section?.ptDiagnosis || data),
  'clinical-reasoning': (data, section) => isFieldComplete(section?.clinicalReasoning || data),

  // Plan
  'treatment-plan': (data, section) =>
    isFieldComplete(section?.treatmentPlan || data?.treatmentPlan) &&
    isFieldComplete(section?.patientEducation || data?.patientEducation),
  'in-clinic-treatment-plan': (data, section) => {
    const hasRows = isFieldComplete(getPlanInterventionRows(data, section));
    const { hasFreq, hasDur } = getPlanScheduleCompletion(data, section);
    return hasRows && hasFreq && hasDur;
  },
  'goal-setting': (data, section) => isFieldComplete(getPlanGoalRows(data, section)),

  // Billing
  'diagnosis-codes': (_data, section) => {
    const arr = section?.diagnosisCodes || section?.icdCodes;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((code) => isFieldComplete(code.code));
  },
  'cpt-codes': (_data, section) => {
    const arr = section?.billingCodes || section?.cptCodes;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((item) => {
      const hasCode = isFieldComplete(item.code);
      const units = parseInt(item.units, 10);
      const hasValidUnits = !isNaN(units) && units > 0;
      const hasTime = isFieldComplete(item.timeSpent);
      return hasCode && hasValidUnits && hasTime;
    });
  },
  'orders-referrals': (_data, section) => {
    const arr = section?.ordersReferrals;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((item) => isFieldComplete(item.type) && isFieldComplete(item.details));
  },
  'billing-notes': (_data, section) => {
    return isFieldComplete(section?.skilledJustification || section?.treatmentNotes);
  },
};
/* eslint-enable complexity */

// ── Assembled config ───────────────────────────────────────────────

export const ptDisciplineConfig = {
  sections: ptSections,
  subsections: ptSubsections,
  subsectionLabels: ptSubsectionLabels,
  dataResolvers: ptDataResolvers,
  requirements: ptRequirements,
};
