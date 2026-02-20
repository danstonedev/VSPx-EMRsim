/**
 * Subsection validation utilities for progress tracking
 * Extracted from ChartNavigation.js to reduce complexity
 */

/**
 * Check if a field has meaningful content
 * @param {any} value - Value to check
 * @returns {boolean} True if field has content
 */
function isFieldComplete(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  if (Array.isArray(value)) return value.length > 0 && value.some((item) => isFieldComplete(item));
  if (typeof value === 'object') {
    return Object.values(value).some((val) => isFieldComplete(val));
  }
  return Boolean(value);
}

/**
 * Check if data has any content (for partial status determination)
 * @param {any} data - Data to check
 * @returns {boolean} True if any content exists
 */
function hasAnyContent(data) {
  if (Array.isArray(data)) {
    return data.some((item) => hasAnyContent(item));
  }
  if (typeof data === 'object' && data !== null) {
    return Object.values(data).some((value) => hasAnyContent(value));
  }
  return isFieldComplete(data);
}

/**
 * Extract pain data from section or data context
 * @param {Object} data - Subsection data
 * @param {Object} section - Full section context
 * @returns {Object} Pain data object
 */
function extractPainData(data, section) {
  return section &&
    (section.painLocation ||
      section.painScale ||
      section.painQuality ||
      section.painPattern ||
      section.aggravatingFactors ||
      section.easingFactors)
    ? section
    : data;
}

// Subjective Section Validators
export const SubjectiveValidators = {
  /**
   * Validate history of present illness completeness
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'history-present-illness': (data, section) => {
    const chiefComplaint =
      section?.chiefComplaint ?? section?.chief_complaint ?? section?.patientConcern ?? '';
    const hpiText = section?.detailedHistoryOfCurrentCondition ?? section?.hpi ?? '';
    // Completion requires BOTH chief complaint and detailed narrative
    return isFieldComplete(chiefComplaint) && isFieldComplete(hpiText);
  },

  /**
   * Validate pain assessment completeness (requires all 6 fields)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'pain-assessment': (data, section) => {
    const painData = extractPainData(data, section);
    if (typeof painData !== 'object' || Array.isArray(painData)) return false;

    const requiredFields = [
      painData.painLocation || painData.location,
      painData.painScale || painData.scale,
      painData.painQuality || painData.quality,
      painData.painPattern || painData.pattern,
      painData.aggravatingFactors,
      painData.easingFactors,
    ];

    return requiredFields.every((field) => isFieldComplete(field));
  },

  /**
   * Validate functional status completeness (requires all 3 fields)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'functional-status': (data, section) => {
    const functionalLimitations = section?.functionalLimitations;
    const priorLevel = section?.priorLevel;
    const patientGoals = section?.patientGoals;
    return (
      isFieldComplete(functionalLimitations) &&
      isFieldComplete(priorLevel) &&
      isFieldComplete(patientGoals)
    );
  },

  /**
   * Validate additional history completeness (requires all 3 fields)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'additional-history': (data, section) => {
    const medications = section?.medicationsCurrent;
    const redFlags = section?.redFlags;
    const additionalHistory = section?.additionalHistory;
    return (
      isFieldComplete(medications) &&
      isFieldComplete(redFlags) &&
      isFieldComplete(additionalHistory)
    );
  },
};

// Objective Section Validators
export const ObjectiveValidators = {
  /**
   * Validate regional assessment completeness
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'regional-assessment': (data, section) => {
    const ra = section?.regionalAssessments || data?.regionalAssessments || data;
    if (!ra || typeof ra !== 'object') return false;
    // Tables store values as nested objects; count content if any non-empty value exists
    const hasRom = ra.rom && isFieldComplete(ra.rom);
    const hasMmt = ra.mmt && isFieldComplete(ra.mmt);
    const hasTests = ra.specialTests && isFieldComplete(ra.specialTests);
    // Mark complete if any of the three sub-areas has entries
    return Boolean(hasRom || hasMmt || hasTests);
  },

  /**
   * Validate inspection findings
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  inspection: (data, section) => {
    const inspection = section?.inspection?.visual || data;
    return isFieldComplete(inspection);
  },

  /**
   * Validate palpation findings
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  palpation: (data, section) => {
    const palpation = section?.palpation?.findings || data;
    return isFieldComplete(palpation);
  },

  /**
   * Validate neurological screening
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  neuro: (data, section) => {
    const neuro = section?.neuro?.screening || data;
    return isFieldComplete(neuro);
  },

  /**
   * Validate functional assessment
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  functional: (data, section) => {
    const functional = section?.functional?.assessment || data;
    return isFieldComplete(functional);
  },
};

// Assessment Section Validators
export const AssessmentValidators = {
  /**
   * Validate primary impairments
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'primary-impairments': (data, section) => isFieldComplete(section?.primaryImpairments || data),

  /**
   * Validate ICF classification completeness (requires all 3 components)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'icf-classification': (data, section) => {
    const s = section || {};
    return (
      isFieldComplete(s.bodyFunctions) &&
      isFieldComplete(s.activityLimitations) &&
      isFieldComplete(s.participationRestrictions)
    );
  },

  /**
   * Validate PT diagnosis
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'pt-diagnosis': (data, section) => isFieldComplete(section?.ptDiagnosis || data),

  /**
   * Validate clinical reasoning
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'clinical-reasoning': (data, section) => isFieldComplete(section?.clinicalReasoning || data),
};

// Plan Section Validators
export const PlanValidators = {
  /**
   * Validate treatment plan completeness (requires both plan and education)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'treatment-plan': (data, section) =>
    isFieldComplete(section?.treatmentPlan || data?.treatmentPlan) &&
    isFieldComplete(section?.patientEducation || data?.patientEducation),

  /**
   * Validate in-clinic treatment plan (requires exercises and schedule)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'in-clinic-treatment-plan': (data, section) => {
    const hasRows = isFieldComplete(section?.exerciseTable || data?.exerciseTable);
    const hasFreq = isFieldComplete(section?.frequency || data?.frequency);
    const hasDur = isFieldComplete(section?.duration || data?.duration);
    // consider complete when at least one row plus schedule are provided
    return hasRows && hasFreq && hasDur;
  },

  /**
   * Validate goal setting completeness
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'goal-setting': (data, section) => {
    // Consider complete when at least one goal entry exists
    const table = section?.goalsTable || data?.goalsTable;
    return isFieldComplete(table);
  },
};

// Billing Section Validators
export const BillingValidators = {
  /**
   * Validate diagnosis codes completeness
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'diagnosis-codes': (data, section) => {
    const arr = section?.diagnosisCodes || section?.icdCodes || data;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.every((code) => isFieldComplete(code.code));
  },

  /**
   * Validate CPT codes completeness (requires code, units, and time)
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'cpt-codes': (data, section) => {
    const arr = section?.billingCodes || section?.cptCodes || data;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const diagnosisCodes = Array.isArray(section?.diagnosisCodes)
      ? section.diagnosisCodes.filter((code) => isFieldComplete(code?.code))
      : [];
    const requireDxLink = diagnosisCodes.length > 0;
    // Require all visible inputs per CPT row: code, units (>0), and timeSpent (non-empty)
    return arr.every((item) => {
      const hasCode = isFieldComplete(item.code);
      const units = parseInt(item.units, 10);
      const hasValidUnits = !isNaN(units) && units > 0;
      const hasTime = isFieldComplete(item.timeSpent);
      const hasDxLink = !requireDxLink || isFieldComplete(item.linkedDiagnosisCode);
      return hasCode && hasDxLink && hasValidUnits && hasTime;
    });
  },

  /**
   * Validate orders and referrals completeness
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'orders-referrals': (data, section) => {
    const arr = section?.ordersReferrals || data;
    if (!Array.isArray(arr) || arr.length === 0) return false;
    const diagnosisCodes = Array.isArray(section?.diagnosisCodes)
      ? section.diagnosisCodes.filter((code) => isFieldComplete(code?.code))
      : [];
    const requireDxLink = diagnosisCodes.length > 0;
    // Require both Type and Details for each row
    return arr.every(
      (item) =>
        isFieldComplete(item.type) &&
        (!requireDxLink || isFieldComplete(item.linkedDiagnosisCode)) &&
        isFieldComplete(item.details),
    );
  },

  /**
   * Validate billing notes completeness
   * @param {Object} data - Subsection data
   * @param {Object} section - Full section context
   * @returns {boolean} True if complete
   */
  'billing-notes': (data, section) => {
    const notes = section?.skilledJustification || section?.treatmentNotes || data;
    return isFieldComplete(notes);
  },
};

// Master validator registry
export const SUBSECTION_VALIDATORS = {
  // Subjective validators
  ...SubjectiveValidators,
  // Objective validators
  ...ObjectiveValidators,
  // Assessment validators
  ...AssessmentValidators,
  // Plan validators
  ...PlanValidators,
  // Billing validators
  ...BillingValidators,
};

/**
 * Generic subsection validation for unknown types
 * @param {any} subsectionData - Data to validate
 * @returns {'complete'|'partial'|'empty'} Validation status
 */
export function genericSubsectionCheck(subsectionData) {
  if (Array.isArray(subsectionData)) {
    const completedItems = subsectionData.filter((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return Object.values(item).some((value) => value && value.toString().trim());
      }
      return false;
    });

    if (completedItems.length === 0) return 'empty';
    if (completedItems.length === subsectionData.length) return 'complete';
    return 'partial';
  }

  if (typeof subsectionData === 'string') {
    return subsectionData.trim() ? 'complete' : 'empty';
  }

  if (typeof subsectionData === 'object') {
    const values = Object.values(subsectionData);
    const completedValues = values.filter((value) => value && value.toString().trim());

    if (completedValues.length === 0) return 'empty';
    if (completedValues.length === values.length) return 'complete';
    return 'partial';
  }

  return 'empty';
}

/**
 * Main validation function for subsection status
 * @param {any} subsectionData - Data for the subsection
 * @param {string} subsectionType - Type of subsection
 * @param {Object} fullSectionData - Full section data for context
 * @returns {'complete'|'partial'|'empty'} Status
 */
export function validateSubsectionStatus(subsectionData, subsectionType, fullSectionData = {}) {
  // Check if we have a specific validator for this subsection type
  const validator = SUBSECTION_VALIDATORS[subsectionType];
  if (validator) {
    const isComplete = validator(subsectionData, fullSectionData);
    return isComplete ? 'complete' : hasAnyContent(subsectionData) ? 'partial' : 'empty';
  }

  // Fallback to generic checking for unknown subsection types
  return genericSubsectionCheck(subsectionData);
}

// Export utilities for internal use
export { isFieldComplete, hasAnyContent };
