/**
 * Profession Registry — defines available professions and helpers for
 * multi-profession routing and session tracking.
 */

export const PROFESSIONS = {
  pt: {
    id: 'pt',
    name: 'Physical Therapy',
    shortName: 'PT',
    icon: '🏥',
    description: 'SOAP documentation, regional assessments, ICF framework, and billing',
    routePrefix: '', // existing routes use no prefix
    studentCases: '#/student/cases',
    instructorCases: '#/instructor/cases',
    storeKey: 'pt_emr_cases',
    color: 'var(--primary-600, #16a34a)',
  },
  dietetics: {
    id: 'dietetics',
    name: 'Dietetics',
    shortName: 'RDN',
    icon: '🥗',
    description: 'Nutrition Care Process, MNT scheduling, meal management',
    routePrefix: '#/dietetics',
    studentCases: '#/dietetics/student/cases',
    instructorCases: '#/dietetics/instructor/cases',
    storeKey: 'dietetics_emr_cases',
    color: 'var(--accent-orange, #e67e22)',
  },
};

const SESSION_KEY = 'emr_profession';

/**
 * Get the currently selected profession id.
 * Falls back to null if none has been chosen yet.
 */
export function getCurrentProfession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Set the current profession for this session.
 * @param {string} id - Profession id (e.g. 'pt', 'dietetics')
 */
export function setCurrentProfession(id) {
  try {
    if (id) {
      sessionStorage.setItem(SESSION_KEY, id);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

/**
 * Resolve the profession config object from an id.
 * Returns null for unknown ids.
 */
export function getProfessionById(id) {
  return PROFESSIONS[id] || null;
}

/**
 * Detect the profession from a route path.
 * @param {string} path - Hash route path (e.g. '#/dietetics/student/cases')
 * @returns {Object|null} Profession config or null
 */
export function getProfessionFromPath(path) {
  if (!path) return null;
  for (const prof of Object.values(PROFESSIONS)) {
    if (prof.routePrefix && path.startsWith(prof.routePrefix)) {
      return prof;
    }
  }
  // Default to PT for unprefixed routes
  if (path.startsWith('#/student') || path.startsWith('#/instructor')) {
    return PROFESSIONS.pt;
  }
  return null;
}

/**
 * Get all registered professions as an array.
 */
export function listProfessions() {
  return Object.values(PROFESSIONS);
}
