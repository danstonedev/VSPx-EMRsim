// PlanMain.js - Main Plan Module (SOAP-P)
// Comprehensive treatment planning and goal setting

// form-components are imported within subsections as needed
import { el } from '../../../ui/utils.js';
import { TreatmentPlan } from './TreatmentPlan.js';
import { GoalSetting } from './GoalSetting.js';

/**
 * Creates the complete SOAP Plan section
 * Evidence-based treatment planning with SMART goals
 * @param {Object} planData - Current plan data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete plan section
 */
export function createPlanSection(planData, onUpdate) {
  const section = el('div', {
    class: 'plan-section',
    id: 'plan-section',
  });

  // Initialize plan data structure
  let data = {
    // Treatment planning
    interventions: [],
    frequency: '',
    duration: '',
    ...planData,
  };

  // Initialize comprehensive data structure for PT practice
  data = {
    // Treatment approach and interventions
    treatmentPlan: '',
    exerciseFocus: '',
    exercisePrescription: '',
    manualTherapy: '',
    modalities: [],

    // Editable table data
    exerciseTable: {},
    manualTherapyTable: {},
    modalitiesTable: {},
    scheduleTable: {},
    progressTable: {},
    educationTable: {},
    goalsTable: {},

    // Scheduling and goals
    frequency: '',
    duration: '',
    shortTermGoals: '',
    longTermGoals: '',
    patientEducation: '',

    // Merge with provided planData
    ...planData,
  };

  // Update helper
  const updateField = (field, value) => {
    data[field] = value;
    syncPlanLegacyFields(data);
    onUpdate(data);
  };

  // Create subsections (SMART Goals first, then Plan of Care)
  section.append(GoalSetting.create(data, updateField));
  section.append(TreatmentPlan.create(data, updateField));

  syncPlanLegacyFields(data);

  return section;
}

function syncPlanLegacyFields(data) {
  if (Array.isArray(data?.goals)) {
    const nextGoalsTable = {};
    data.goals.forEach((row, index) => {
      if (!row || typeof row !== 'object') return;
      if (!row.goal && !row.timeframe && !row.icfDomain) return;
      nextGoalsTable[`goal_${index + 1}`] = {
        goalText: row.goal || '',
        timeframe: row.timeframe || '',
        icfDomain: row.icfDomain || '',
      };
    });
    data.goalsTable = nextGoalsTable;
  }

  if (Array.isArray(data?.inClinicInterventions)) {
    const nextExerciseTable = {};
    data.inClinicInterventions.forEach((row, index) => {
      if (!row || typeof row !== 'object') return;
      if (!row.intervention && !row.dosage) return;
      const parts = [String(row.intervention || '').trim(), String(row.dosage || '').trim()].filter(
        Boolean,
      );
      nextExerciseTable[`ex_${index + 1}`] = {
        exerciseText: parts.join(' - '),
      };
    });
    data.exerciseTable = nextExerciseTable;
  }
}

// Export alias for consistency
export { createPlanSection as PlanSection };
