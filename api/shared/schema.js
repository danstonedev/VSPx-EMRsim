export const ENUMS = {
  setting: ['Outpatient', 'Inpatient', 'Home Health', 'SNF', 'Acute Rehab', 'Other'],
  encounters: ['eval', 'daily', 'progress', 'discharge'],
  diagnosis: ['Musculoskeletal', 'Neurological', 'Cardiopulmonary', 'Integumentary', 'Other'],
  acuity: ['acute', 'subacute', 'chronic', 'unspecified'],
  sex: ['male', 'female', 'other', 'unspecified'],
  prognosis: ['excellent', 'good', 'fair', 'poor', 'guarded'],
  regions: ['lumbar-spine', 'cervical-spine', 'shoulder', 'knee', 'ankle', 'hip', 'elbow', 'wrist'],
  painQuality: [
    'sharp',
    'dull',
    'aching',
    'burning',
    'throbbing',
    'stabbing',
    'cramping',
    'tingling',
  ],
};

export function makeBlankCase() {
  return {
    meta: {
      title: '',
      setting: 'Outpatient',
      regions: [],
      acuity: 'unspecified',
      diagnosis: 'Musculoskeletal',
    },
    // Optional case-level modules attached by faculty (e.g., referrals, imaging, labs)
    modules: [],
    snapshot: {
      name: '',
      age: '',
      sex: 'unspecified',
      dob: '',
      teaser: '',
    },
    history: {
      chief_complaint: '',
      hpi: '',
      mechanism_of_injury: '',
      pain: {
        level: '',
        location: '',
        quality: '',
        aggravating_factors: '',
        easing_factors: '',
        onset: '',
        duration: '',
      },
      pmh: [],
      meds: [],
      red_flag_signals: [],
      functional_goals: [],
    },
    findings: {
      vitals: {
        bp: '',
        hr: '',
        rr: '',
        temp: '',
        o2sat: '',
        pain: '',
      },
      rom: {},
      mmt: {},
      special_tests: [],
      gait: {
        device: 'none',
        distance_m: 0,
        pattern: '',
        observations: '',
      },
      outcome_options: [],
    },
    // Updated structure to match actual usage in application
    exam: {
      vitals: {
        bp: '',
        hr: '',
        rr: '',
        temp: '',
        o2sat: '',
        pain: '',
      },
      inspection: {
        visual: '',
      },
      palpation: {
        findings: '',
      },
      range_of_motion: {},
      muscle_strength: {},
      special_tests: {},
      functional_assessment: '',
      gait: {
        pattern: '',
        device: '',
        observations: '',
      },
      regionalAssessments: {
        selectedRegions: [],
        rom: {},
        mmt: {},
        specialTests: {},
      },
    },
    assessment: {
      primaryImpairments: '',
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosis: '',
      prognosticFactors: '',
      clinicalReasoning: '',
      clinical_impression: '',
      icf_framework: {
        body_functions: '',
        activity_limitations: '',
        participation_restrictions: '',
      },
      visibility: {
        primaryImpairments: { studentKey: true, studentExaminer: true },
        bodyFunctions: { studentKey: true, studentExaminer: true },
        activityLimitations: { studentKey: true, studentExaminer: true },
        participationRestrictions: { studentKey: true, studentExaminer: true },
        ptDiagnosis: { studentKey: true, studentExaminer: false },
        prognosis: { studentKey: true, studentExaminer: false },
        prognosticFactors: { studentKey: true, studentExaminer: false },
        clinicalReasoning: { studentKey: true, studentExaminer: false },
      },
    },
    plan: {
      goals: [],
      interventions: [],
      frequency: '',
      duration: '',
      prognosis: '',
    },
    encounters: {
      eval: {
        notes_seed: '',
        completed_sections: [],
      },
      daily: [],
      progress: null,
      discharge: null,
    },
    assets: [],
  };
}

/**
 * Lightweight enum guard
 * @param {any} v
 * @param {readonly string[]} allowed
 */
function inEnum(v, allowed) {
  return allowed.includes(v);
}

// Small path accessor to avoid optional chaining branches in validators
function getPath(obj, path) {
  return path.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function pushIfMissing(obj, path, message, errors) {
  const v = getPath(obj, path);
  if (v === undefined || v === null || v === '') errors.push(message);
}

function pushIfPresentAndNotEnum(obj, path, allowed, message, errors) {
  const v = getPath(obj, path);
  if (v !== undefined && v !== '' && !inEnum(v, allowed)) errors.push(message);
}

function pushIfPresentAndNotArray(obj, path, message, errors) {
  const v = getPath(obj, path);
  if (v !== undefined && !Array.isArray(v)) errors.push(message);
}

/**
 * Validate meta block
 * @param {any} c
 * @param {string[]} e
 */
function validateMeta(c, e) {
  // required
  pushIfMissing(c, ['meta', 'title'], 'meta.title is required', e);
  // enums
  pushIfPresentAndNotEnum(c, ['meta', 'setting'], ENUMS.setting, 'meta.setting invalid', e);
  pushIfPresentAndNotEnum(c, ['meta', 'diagnosis'], ENUMS.diagnosis, 'meta.diagnosis invalid', e);
  pushIfPresentAndNotEnum(c, ['meta', 'acuity'], ENUMS.acuity, 'meta.acuity invalid', e);
}

/**
 * Validate snapshot block
 * @param {any} c
 * @param {string[]} e
 */
function validateSnapshot(c, e) {
  if (!c?.snapshot) e.push('snapshot is missing');
  if (c?.snapshot?.sex && !inEnum(c.snapshot.sex, ENUMS.sex)) e.push('snapshot.sex invalid');
}

/**
 * Validate history block
 * @param {any} c
 * @param {string[]} e
 */
function validateHistory(c, e) {
  if (!c?.history) {
    e.push('history is missing');
    return;
  }
  pushIfPresentAndNotArray(
    c,
    ['history', 'red_flag_signals'],
    'history.red_flag_signals must be array',
    e,
  );
  pushIfPresentAndNotArray(c, ['history', 'pmh'], 'history.pmh must be array', e);
  pushIfPresentAndNotArray(c, ['history', 'meds'], 'history.meds must be array', e);
}

/**
 * Validate presence of core structures
 * @param {any} c
 * @param {string[]} e
 */
function validateStructures(c, e) {
  if (!c?.findings) e.push('findings is missing');
  if (!c?.encounters) e.push('encounters is missing');
}

/**
 * Validate assessment specific enums
 * @param {any} c
 * @param {string[]} e
 */
function validateAssessment(c, e) {
  if (c?.assessment?.prognosis && !inEnum(c.assessment.prognosis, ENUMS.prognosis)) {
    e.push('assessment.prognosis invalid');
  }
}

// Enhanced validation with specific field checks (decomposed)
export function validateCase(c) {
  const e = [];
  validateMeta(c, e);
  validateSnapshot(c, e);
  validateHistory(c, e);
  validateStructures(c, e);
  validateAssessment(c, e);
  return e;
}

// Data integrity helpers
function syncExamAndFindings(caseData) {
  if (!caseData.exam && caseData.findings) caseData.exam = { ...caseData.findings };
  if (!caseData.findings && caseData.exam) caseData.findings = { ...caseData.exam };
}

function ensureModulesArray(caseData) {
  if (!Array.isArray(caseData.modules)) caseData.modules = [];
}

function ensureAssessmentVisibility(caseData) {
  if (caseData.assessment && !caseData.assessment.visibility) {
    caseData.assessment.visibility = {
      primaryImpairments: { studentKey: true, studentExaminer: true },
      bodyFunctions: { studentKey: true, studentExaminer: true },
      activityLimitations: { studentKey: true, studentExaminer: true },
      participationRestrictions: { studentKey: true, studentExaminer: true },
      ptDiagnosis: { studentKey: true, studentExaminer: false },
      prognosis: { studentKey: true, studentExaminer: false },
      prognosticFactors: { studentKey: true, studentExaminer: false },
      clinicalReasoning: { studentKey: true, studentExaminer: false },
    };
  }
}

function normalizeEnums(caseData) {
  // Acuity mapping
  if (caseData.meta) {
    const mapAcuity = (a) => {
      if (!a) return undefined;
      const v = String(a).toLowerCase();
      if (ENUMS.acuity.includes(v)) return v;
      if (v === 'routine') return 'unspecified';
      if (v === 'complex') return 'chronic';
      if (v === 'critical') return 'acute';
      return 'unspecified';
    };
    const normA = mapAcuity(caseData.meta.acuity);
    if (normA) caseData.meta.acuity = normA;
  }
  // Sex mapping
  if (caseData.snapshot) {
    const mapSex = (s) => {
      if (!s) return undefined;
      const v = String(s).toLowerCase();
      if (ENUMS.sex.includes(v)) return v;
      if (v === 'prefer not to say' || v === 'prefer-not-to-say' || v === 'n/a' || v === 'na')
        return 'unspecified';
      return 'unspecified';
    };
    const normS = mapSex(caseData.snapshot.sex);
    if (normS) caseData.snapshot.sex = normS;
  }
}

// New helper functions for data integrity (decomposed)
export function ensureDataIntegrity(caseData) {
  try {
    syncExamAndFindings(caseData);
    ensureModulesArray(caseData);
    ensureAssessmentVisibility(caseData);
    normalizeEnums(caseData);
  } catch {}
  return caseData;
}

export function migrateOldCaseData(caseData) {
  // Handle old string-based assessment format
  if (typeof caseData.assessment === 'string') {
    const oldAssessment = caseData.assessment;
    caseData.assessment = {
      primaryImpairments: oldAssessment,
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosis: '',
      prognosticFactors: '',
      clinicalReasoning: '',
    };
  }

  // Handle old subjective format
  if (typeof caseData.subjective === 'string') {
    const oldSubjective = caseData.subjective;
    caseData.subjective = {
      chiefComplaint: '',
      historyOfPresentIllness: oldSubjective,
      painLocation: '',
      painScale: '',
      painQuality: '',
      aggravatingFactors: '',
      easingFactors: '',
      pastMedicalHistory: '',
      medications: '',
      functionalGoals: '',
      additionalHistory: '',
    };
  }

  return ensureDataIntegrity(caseData);
}
