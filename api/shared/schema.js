// Simplified CommonJS schema validation for Azure Functions API
// Mirrors essential frontend validation rules to prevent bad data in Cosmos DB.

const ENUMS = {
  setting: ['Outpatient', 'Inpatient', 'Home Health', 'SNF', 'Acute Rehab', 'Other'],
  encounters: ['eval', 'daily', 'progress', 'discharge'],
  diagnosis: ['Musculoskeletal', 'Neurological', 'Cardiopulmonary', 'Integumentary', 'Other'],
  acuity: ['acute', 'subacute', 'chronic', 'unspecified'],
  sex: ['male', 'female', 'other', 'unspecified'],
  prognosis: ['excellent', 'good', 'fair', 'poor', 'guarded'],
};

function validateCase(c) {
  const errors = [];

  if (!c) {
    errors.push('Case data is required');
    return errors;
  }

  // meta
  if (!c.meta || !c.meta.title) {
    errors.push('meta.title is required');
  }
  if (c.meta) {
    if (c.meta.setting && !ENUMS.setting.includes(c.meta.setting))
      errors.push('meta.setting invalid');
    if (c.meta.diagnosis && !ENUMS.diagnosis.includes(c.meta.diagnosis))
      errors.push('meta.diagnosis invalid');
    if (c.meta.acuity && !ENUMS.acuity.includes(c.meta.acuity)) errors.push('meta.acuity invalid');
  }

  // snapshot
  if (c.snapshot && c.snapshot.sex && !ENUMS.sex.includes(c.snapshot.sex)) {
    errors.push('snapshot.sex invalid');
  }

  // history arrays
  if (c.history) {
    if (c.history.pmh !== undefined && !Array.isArray(c.history.pmh))
      errors.push('history.pmh must be array');
    if (c.history.meds !== undefined && !Array.isArray(c.history.meds))
      errors.push('history.meds must be array');
    if (c.history.red_flag_signals !== undefined && !Array.isArray(c.history.red_flag_signals))
      errors.push('history.red_flag_signals must be array');
  }

  // assessment prognosis
  if (c.assessment && c.assessment.prognosis && !ENUMS.prognosis.includes(c.assessment.prognosis)) {
    errors.push('assessment.prognosis invalid');
  }

  return errors;
}

function ensureDataIntegrity(caseData) {
  if (!caseData) return caseData;

  // Ensure basic structures exist
  if (!caseData.meta) caseData.meta = {};
  if (!caseData.snapshot) caseData.snapshot = {};
  if (!caseData.history) caseData.history = {};
  if (!caseData.findings) caseData.findings = {};
  if (!caseData.encounters) caseData.encounters = {};
  if (!Array.isArray(caseData.modules)) caseData.modules = [];

  return caseData;
}

module.exports = {
  ENUMS,
  validateCase,
  ensureDataIntegrity,
};
