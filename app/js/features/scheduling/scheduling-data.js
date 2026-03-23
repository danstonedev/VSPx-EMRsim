/**
 * Scheduling Reference Data — appointment types, priorities, NCP steps,
 * tube feeding formulas, and meal round defaults for dietetics.
 */

export const APPOINTMENT_TYPES = [
  {
    id: 'initial-assessment',
    label: 'Initial Nutrition Assessment',
    defaultDuration: 60,
    cpt: '97802',
  },
  { id: 'follow-up', label: 'Follow-up / Re-assessment', defaultDuration: 30, cpt: '97803' },
  { id: 'mnt-individual', label: 'MNT Counseling — Individual', defaultDuration: 45, cpt: '97802' },
  { id: 'mnt-group', label: 'MNT Counseling — Group', defaultDuration: 60, cpt: '97804' },
  { id: 'meal-rounds', label: 'Meal Rounds', defaultDuration: 30, cpt: '' },
  { id: 'tube-feeding-check', label: 'Tube Feeding Check', defaultDuration: 15, cpt: '' },
  { id: 'consult', label: 'Consult (New Referral)', defaultDuration: 45, cpt: '97802' },
  { id: 'idt-round', label: 'Interdisciplinary Team Round', defaultDuration: 30, cpt: '' },
  { id: 'discharge-planning', label: 'Discharge Planning', defaultDuration: 30, cpt: '' },
  { id: 'education-session', label: 'Education Session', defaultDuration: 45, cpt: '' },
];

export const PRIORITY_LEVELS = [
  { id: 'urgent', label: 'Urgent', color: '#dc2626', sortWeight: 0 },
  { id: 'high', label: 'High', color: '#ea580c', sortWeight: 1 },
  { id: 'routine', label: 'Routine', color: '#2563eb', sortWeight: 2 },
  { id: 'low', label: 'Low', color: '#6b7280', sortWeight: 3 },
];

export const NCP_STEPS = [
  { id: 'assessment', label: 'Assessment', color: '#7c3aed' },
  { id: 'diagnosis', label: 'Diagnosis', color: '#0891b2' },
  { id: 'intervention', label: 'Intervention', color: '#059669' },
  { id: 'monitoring', label: 'Monitoring & Evaluation', color: '#ca8a04' },
];

export const APPOINTMENT_STATUSES = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'no-show', label: 'No-Show' },
];

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', defaultTime: '08:00' },
  { id: 'lunch', label: 'Lunch', defaultTime: '12:00' },
  { id: 'dinner', label: 'Dinner', defaultTime: '17:00' },
  { id: 'snack', label: 'Snack', defaultTime: '14:30' },
];

export const TUBE_FEEDING_METHODS = [
  { id: 'continuous', label: 'Continuous' },
  { id: 'bolus', label: 'Bolus' },
];

export const COMMON_FORMULAS = [
  'Osmolite 1.5',
  'Jevity 1.5',
  'Glucerna 1.5',
  'Nepro',
  'Peptamen 1.5',
  'Vital AF',
  'Impact Advanced Recovery',
  'Nutren 2.0',
  'Isosource HN',
  'Promote',
];

/**
 * Create an empty appointment object with defaults.
 */
export function createBlankAppointment(overrides = {}) {
  return {
    id: `appt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    duration: 30,
    type: 'initial-assessment',
    status: 'scheduled',
    priority: 'routine',
    location: '',
    reason: '',
    notes: '',
    ncp_step: 'assessment',
    cpt_code: '97802',
    recurring: false,
    recurrence_pattern: null,
    ...overrides,
  };
}

/**
 * Create an empty meal round entry with defaults.
 */
export function createBlankMealRound(overrides = {}) {
  return {
    id: `mr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().slice(0, 10),
    mealType: 'lunch',
    patients: [],
    notes: '',
    completed: false,
    ...overrides,
  };
}

/**
 * Create an empty tube feeding schedule entry.
 */
export function createBlankTubeFeeding(overrides = {}) {
  return {
    id: `tf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    patient: '',
    formula: 'Osmolite 1.5',
    method: 'continuous',
    rate: '60 mL/hr',
    startTime: '06:00',
    endTime: '22:00',
    goalCalories: 1800,
    notes: '',
    ...overrides,
  };
}

/**
 * Resolve a priority config by id.
 */
export function getPriorityById(id) {
  return PRIORITY_LEVELS.find((p) => p.id === id) || PRIORITY_LEVELS[2]; // default routine
}

/**
 * Resolve an appointment type config by id.
 */
export function getAppointmentTypeById(id) {
  return APPOINTMENT_TYPES.find((t) => t.id === id) || APPOINTMENT_TYPES[0];
}

/**
 * Sort appointments by time, then priority.
 */
export function sortAppointments(appointments) {
  return [...appointments].sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    const prioA = getPriorityById(a.priority).sortWeight;
    const prioB = getPriorityById(b.priority).sortWeight;
    return prioA - prioB;
  });
}

/**
 * Create default scheduling data for a new case.
 */
export function createDefaultSchedulingData() {
  return {
    appointments: [],
    mealRounds: [],
    tubeFeedingSchedule: [],
    dailyCensus: {
      date: new Date().toISOString().slice(0, 10),
      totalPatients: 0,
      highRisk: 0,
      newConsults: 0,
      discharges: 0,
    },
  };
}
