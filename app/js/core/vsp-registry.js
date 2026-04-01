/**
 * Virtual Standardized Patient (VSP) Registry
 *
 * Canonical patient identity store shared across all disciplines.
 * Each VSP record holds realistic EMR-grade demographics that are
 * consistent whether the patient appears in a PT SOAP note, a
 * Dietetics NCP note, or any future discipline.
 *
 * Cases link to a VSP via `caseObj.meta.vspId`.  When present, editors
 * resolve demographics from the registry instead of inline meta fields.
 *
 * Storage key: `vsp_registry` → { [vspId]: VSPRecord }
 *
 * Cloud sync: When `/api/patients` is reachable the registry pulls from
 * Cosmos DB on init and pushes mutations back.  localStorage acts as a
 * local cache / offline fallback.
 */
import { storage } from './adapters/storageAdapter.js';

const REGISTRY_KEY = 'vsp_registry';
const API_BASE = '/api/patients';

// ── Reference data ─────────────────────────────────────────────────

export const SEX_OPTIONS = ['male', 'female', 'other', 'unspecified'];

export const GENDER_IDENTITY_OPTIONS = [
  'man',
  'woman',
  'non-binary',
  'transgender man',
  'transgender woman',
  'other',
  'prefer not to say',
];

export const RACE_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or More Races',
  'Other',
  'Prefer not to say',
];

export const ETHNICITY_OPTIONS = [
  'Hispanic or Latino',
  'Not Hispanic or Latino',
  'Prefer not to say',
];

export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
  'Domestic Partner',
];

export const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'Mandarin',
  'Cantonese',
  'Vietnamese',
  'Korean',
  'Arabic',
  'French',
  'Russian',
  'Portuguese',
  'Tagalog',
  'Other',
];

export const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export const CODE_STATUS_OPTIONS = [
  'Full Code',
  'DNR',
  'DNR/DNI',
  'Comfort Measures Only',
  'Limited Code',
];

export const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
];

// ── Helpers ────────────────────────────────────────────────────────

function generateId() {
  return `vsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Auto-generate a realistic MRN: VSP-XXXXXXXX */
function generateMrn() {
  const num = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `VSP-${num}`;
}

export function normalizeSex(val) {
  const v = String(val || '')
    .trim()
    .toLowerCase();
  if (v === 'm' || v === 'male') return 'male';
  if (v === 'f' || v === 'female') return 'female';
  if (v === 'other') return 'other';
  return 'unspecified';
}

/** Ensure DOB is stored as ISO YYYY-MM-DD. */
export function normalizeDob(dob) {
  if (!dob) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) return dob;
  const m = dob.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return dob;
}

/** Compute age from an ISO DOB string. */
export function computeAge(dobIso) {
  if (!dobIso) return null;
  const dob = new Date(dobIso + 'T00:00:00');
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 200 ? age : null;
}

/** Compute BMI from height (inches) and weight (lbs). */
export function computeBmi(heightInches, weightLbs) {
  if (!heightInches || !weightLbs || heightInches <= 0 || weightLbs <= 0) return null;
  return ((weightLbs / (heightInches * heightInches)) * 703).toFixed(1);
}

/** Build a blank patient record scaffold with all fields. */
function blankRecord() {
  return {
    // Identity
    id: '',
    mrn: '',
    firstName: '',
    lastName: '',
    middleName: '',
    preferredName: '',

    // Demographics
    dob: '',
    sex: 'unspecified',
    genderIdentity: '',
    pronouns: '',
    race: '',
    ethnicity: '',
    maritalStatus: '',
    preferredLanguage: 'English',
    interpreterNeeded: false,

    // Anthropometrics
    heightFt: '',
    heightIn: '',
    weightLbs: '',
    bloodType: '',

    // Contact
    phone: '',
    email: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',

    // Emergency contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',

    // Insurance
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceGroupNumber: '',

    // Clinical baseline
    allergies: [], // [{ name, type, severity, reaction }]
    medicalHistory: [], // [string]
    surgicalHistory: [], // [string]
    activeMedications: [], // [{ name, dose, frequency, route }]
    codeStatus: 'Full Code',
    primaryCareProvider: '',

    // Timestamps
    createdAt: '',
    updatedAt: '',
  };
}

// Backward compat: old records stored allergies as a string and name as a
// single concatenated field. Migrate in-place on read.
function migrateRecord(rec) {
  // Allergies: string → array
  if (typeof rec.allergies === 'string') {
    rec.allergies = rec.allergies
      ? rec.allergies
          .split(',')
          .map((a) => ({ name: a.trim(), type: '', severity: '', reaction: '' }))
      : [];
  }
  // Name: if `name` exists but `firstName`/`lastName` are empty, split it
  if (rec.name && !rec.firstName && !rec.lastName) {
    const parts = rec.name.trim().split(/\s+/);
    rec.firstName = parts[0] || '';
    rec.lastName = parts.slice(1).join(' ') || '';
    delete rec.name;
  }
  // Ensure array fields
  if (!Array.isArray(rec.medicalHistory)) rec.medicalHistory = [];
  if (!Array.isArray(rec.surgicalHistory)) rec.surgicalHistory = [];
  if (!Array.isArray(rec.activeMedications)) rec.activeMedications = [];
  if (!Array.isArray(rec.allergies)) rec.allergies = [];
  return rec;
}

// ── Storage ────────────────────────────────────────────────────────

function loadRegistry() {
  try {
    const raw = storage.getItem(REGISTRY_KEY);
    if (!raw) return {};
    const reg = JSON.parse(raw);
    // Migrate each record as it's loaded
    for (const id of Object.keys(reg)) {
      reg[id] = migrateRecord({ ...blankRecord(), ...reg[id] });
    }
    return reg;
  } catch {
    return {};
  }
}

function saveRegistry(registry) {
  storage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

// ── Cloud sync ─────────────────────────────────────────────────────

/**
 * Fetch all patients from the API and merge into localStorage.
 * Server records overwrite local records with the same id.
 * Returns true on success, false on failure (offline / auth / etc.).
 */
export async function syncFromServer() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) return false;
    const serverMap = await res.json(); // { [id]: record }
    const local = loadRegistry();
    // Merge: server wins for same id
    for (const [id, rec] of Object.entries(serverMap)) {
      local[id] = migrateRecord({ ...blankRecord(), ...rec });
    }
    saveRegistry(local);
    return true;
  } catch {
    return false;
  }
}

/** Push a patient record to the server (fire-and-forget). */
function pushToServer(patient) {
  fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  }).catch(() => {
    /* offline — local cache still has the data */
  });
}

/** Delete a patient from the server (fire-and-forget). */
function deleteFromServer(patientId) {
  fetch(`${API_BASE}?id=${encodeURIComponent(patientId)}`, {
    method: 'DELETE',
  }).catch(() => {
    /* offline */
  });
}

/**
 * Initialize the registry by pulling from the cloud.
 * Call once at app startup (e.g. in initializeApp).
 * Non-blocking — the app can render from localStorage immediately while
 * the fetch resolves in the background.
 */
export function initRegistry() {
  // Fire-and-forget; callers can await if they want fresh data
  return syncFromServer();
}

// ── Derived helpers ────────────────────────────────────────────────

/** Build a display name from structured name fields. */
export function displayName(rec) {
  if (!rec) return '';
  // Support legacy `name` field during migration
  if (rec.name && !rec.firstName) return rec.name;
  const parts = [rec.firstName, rec.middleName, rec.lastName].filter(Boolean);
  return parts.join(' ') || '';
}

/** Build a short summary string: "Name (Age yo, Sex)" */
export function patientSummary(rec) {
  if (!rec) return '';
  const n = rec.preferredName || displayName(rec) || 'Unnamed';
  const age = computeAge(rec.dob);
  const ageStr = age != null ? `${age} yo` : '';
  const sexStr =
    rec.sex && rec.sex !== 'unspecified' ? rec.sex.charAt(0).toUpperCase() + rec.sex.slice(1) : '';
  const parts = [ageStr, sexStr].filter(Boolean).join(', ');
  return parts ? `${n} (${parts})` : n;
}

/** Flat allergies string for display (comma-separated names). */
export function allergySummary(rec) {
  if (!rec || !Array.isArray(rec.allergies) || rec.allergies.length === 0) return 'NKDA';
  return rec.allergies
    .map((a) => a.name)
    .filter(Boolean)
    .join(', ');
}

// ── Public API ─────────────────────────────────────────────────────

/** List all VSP patients, sorted by last name then first name. */
export function listPatients() {
  return Object.values(loadRegistry()).sort((a, b) => {
    const cmp = (a.lastName || '').localeCompare(b.lastName || '');
    return cmp !== 0 ? cmp : (a.firstName || '').localeCompare(b.firstName || '');
  });
}

/** Get a single VSP patient by id. Returns null if not found. */
export function getPatient(vspId) {
  if (!vspId) return null;
  return loadRegistry()[vspId] || null;
}

/**
 * Create a new VSP patient record.
 * @param {Object} fields — any subset of the patient schema
 * @returns {Object} The created VSP record (includes generated id + mrn).
 */
export function createPatient(fields = {}) {
  const registry = loadRegistry();
  const id = generateId();
  const now = new Date().toISOString();
  const record = {
    ...blankRecord(),
    ...fields,
    id,
    mrn: fields.mrn || generateMrn(),
    sex: normalizeSex(fields.sex),
    dob: normalizeDob(fields.dob),
    createdAt: now,
    updatedAt: now,
  };
  // Trim string fields
  for (const [k, v] of Object.entries(record)) {
    if (typeof v === 'string') record[k] = v.trim();
  }
  registry[id] = migrateRecord(record);
  saveRegistry(registry);
  pushToServer(registry[id]);
  return registry[id];
}

/**
 * Update an existing VSP patient record.
 * Only the supplied fields are overwritten; others are preserved.
 */
export function updatePatient(vspId, fields = {}) {
  const registry = loadRegistry();
  const existing = registry[vspId];
  if (!existing) return null;

  for (const [k, v] of Object.entries(fields)) {
    if (k === 'id' || k === 'mrn' || k === 'createdAt') continue; // immutable
    if (k === 'sex') {
      existing.sex = normalizeSex(v);
      continue;
    }
    if (k === 'dob') {
      existing.dob = normalizeDob(v);
      continue;
    }
    if (typeof v === 'string') {
      existing[k] = v.trim();
      continue;
    }
    existing[k] = v;
  }
  existing.updatedAt = new Date().toISOString();
  registry[vspId] = existing;
  saveRegistry(registry);
  pushToServer(existing);
  return existing;
}

/** Delete a VSP patient. Returns true if it existed. */
export function deletePatient(vspId) {
  const registry = loadRegistry();
  if (!registry[vspId]) return false;
  delete registry[vspId];
  saveRegistry(registry);
  deleteFromServer(vspId);
  return true;
}

/**
 * Resolve patient demographics for a case object.
 *
 * If the case has `meta.vspId` and that patient exists in the registry,
 * return the canonical VSP record.  Otherwise return null so callers
 * can fall back to inline meta fields.
 */
export function resolvePatient(caseObj) {
  const vspId = caseObj?.meta?.vspId || caseObj?.vspId;
  return getPatient(vspId);
}
