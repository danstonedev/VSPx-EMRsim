// Simplified CommonJS schema validation for Azure Functions API
// This is a minimal version that validates essential fields without
// breaking on edge cases. The full validation happens on the frontend.

const ENUMS = {
  setting: ['Outpatient', 'Inpatient', 'Home Health', 'SNF', 'Acute Rehab', 'Other'],
  acuity: ['acute', 'subacute', 'chronic', 'unspecified'],
  sex: ['male', 'female', 'other', 'unspecified'],
};

function validateCase(c) {
  const errors = [];

  // Very minimal validation - just check for required structures
  if (!c) {
    errors.push('Case data is required');
    return errors;
  }

  // Check for meta.title (required)
  if (!c.meta || !c.meta.title) {
    errors.push('meta.title is required');
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
