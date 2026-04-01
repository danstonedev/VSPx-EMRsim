import { storage } from '$lib/storage';
import type { CaseObj } from '$lib/store';

const REGISTRY_KEY = 'vsp_registry';
const API_BASE = '/api/patients';
type ApiAvailability = 'unknown' | 'available' | 'unavailable';

export const SEX_OPTIONS = ['male', 'female', 'other', 'unspecified'] as const;
export const GENDER_IDENTITY_OPTIONS = [
  'man',
  'woman',
  'non-binary',
  'transgender man',
  'transgender woman',
  'other',
  'prefer not to say',
] as const;
export const RACE_OPTIONS = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or More Races',
  'Other',
  'Prefer not to say',
] as const;
export const ETHNICITY_OPTIONS = [
  'Hispanic or Latino',
  'Not Hispanic or Latino',
  'Prefer not to say',
] as const;
export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
  'Domestic Partner',
] as const;
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
] as const;
export const BLOOD_TYPE_OPTIONS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'Unknown',
] as const;
export const CODE_STATUS_OPTIONS = [
  'Full Code',
  'DNR',
  'DNR/DNI',
  'Comfort Measures Only',
  'Limited Code',
] as const;
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
] as const;

export interface VspAllergy {
  name: string;
  type: string;
  severity: string;
  reaction: string;
}

export interface VspMedication {
  name: string;
  dose: string;
  frequency: string;
  route: string;
}

export interface VspRecord {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  dob: string;
  sex: (typeof SEX_OPTIONS)[number];
  genderIdentity: string;
  pronouns: string;
  race: string;
  ethnicity: string;
  maritalStatus: string;
  preferredLanguage: string;
  interpreterNeeded: boolean;
  heightFt: string;
  heightIn: string;
  weightLbs: string;
  bloodType: string;
  phone: string;
  email: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceGroupNumber: string;
  allergies: VspAllergy[];
  medicalHistory: string[];
  surgicalHistory: string[];
  activeMedications: VspMedication[];
  codeStatus: string;
  primaryCareProvider: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
}

export type VspRegistryMap = Record<string, VspRecord>;

export interface VspPickerOption {
  id: string;
  label: string;
  summary: string;
  mrn: string;
  age: number | null;
  sex: VspRecord['sex'];
  patient: VspRecord;
}

export interface LinkedCasePatientFields {
  vspId: string;
  patientName: string;
  patientDOB: string;
  patientGender: string;
  patientAge: string;
  meta: Record<string, unknown>;
  subjective: Record<string, unknown>;
}

function generateId(): string {
  return `vsp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateMrn(): string {
  const num = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return `VSP-${num}`;
}

export function normalizeSex(val: unknown): VspRecord['sex'] {
  const v = String(val ?? '')
    .trim()
    .toLowerCase();
  if (v === 'm' || v === 'male') return 'male';
  if (v === 'f' || v === 'female') return 'female';
  if (v === 'other') return 'other';
  return 'unspecified';
}

export function normalizeDob(dob: unknown): string {
  if (!dob) return '';
  const raw = String(dob).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  return raw;
}

export function computeAge(dobIso: string): number | null {
  if (!dobIso) return null;
  const dob = new Date(`${dobIso}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 200 ? age : null;
}

export function computeBmi(heightInches: number, weightLbs: number): string | null {
  if (!heightInches || !weightLbs || heightInches <= 0 || weightLbs <= 0) return null;
  return ((weightLbs / (heightInches * heightInches)) * 703).toFixed(1);
}

function blankRecord(): VspRecord {
  return {
    id: '',
    mrn: '',
    firstName: '',
    lastName: '',
    middleName: '',
    preferredName: '',
    dob: '',
    sex: 'unspecified',
    genderIdentity: '',
    pronouns: '',
    race: '',
    ethnicity: '',
    maritalStatus: '',
    preferredLanguage: 'English',
    interpreterNeeded: false,
    heightFt: '',
    heightIn: '',
    weightLbs: '',
    bloodType: '',
    phone: '',
    email: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceGroupNumber: '',
    allergies: [],
    medicalHistory: [],
    surgicalHistory: [],
    activeMedications: [],
    codeStatus: 'Full Code',
    primaryCareProvider: '',
    createdAt: '',
    updatedAt: '',
  };
}

function trimStringFields<T extends Record<string, unknown>>(record: T): T {
  const next = { ...record };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string') {
      next[key as keyof T] = value.trim() as T[keyof T];
    }
  }
  return next;
}

export function migrateRecord(input: Partial<VspRecord> & Record<string, unknown>): VspRecord {
  const record = { ...blankRecord(), ...input } as VspRecord & Record<string, unknown>;
  if (typeof record.allergies === 'string') {
    const rawAllergies = record.allergies as string;
    record.allergies = rawAllergies
      ? rawAllergies.split(',').map((name: string) => ({
          name: name.trim(),
          type: '',
          severity: '',
          reaction: '',
        }))
      : [];
  }
  if (record.name && !record.firstName && !record.lastName) {
    const parts = String(record.name).trim().split(/\s+/);
    record.firstName = parts[0] || '';
    record.lastName = parts.slice(1).join(' ') || '';
    delete record.name;
  }
  if (!Array.isArray(record.medicalHistory)) record.medicalHistory = [];
  if (!Array.isArray(record.surgicalHistory)) record.surgicalHistory = [];
  if (!Array.isArray(record.activeMedications)) record.activeMedications = [];
  if (!Array.isArray(record.allergies)) record.allergies = [];
  record.sex = normalizeSex(record.sex);
  record.dob = normalizeDob(record.dob);
  return trimStringFields(record);
}

function loadRegistry(): VspRegistryMap {
  try {
    const raw = storage.getItem(REGISTRY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<VspRecord>>;
    const next: VspRegistryMap = {};
    for (const id of Object.keys(parsed)) {
      next[id] = migrateRecord(parsed[id] as Partial<VspRecord> & Record<string, unknown>);
    }
    return next;
  } catch {
    return {};
  }
}

function saveRegistry(registry: VspRegistryMap): void {
  storage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

let synced = false;
let apiAvailability: ApiAvailability = 'unknown';

function markApiAvailable(): void {
  apiAvailability = 'available';
}

function markApiUnavailable(): void {
  apiAvailability = 'unavailable';
}

function shouldTryServer(): boolean {
  return apiAvailability !== 'unavailable';
}

export async function syncFromServer(): Promise<boolean> {
  if (!shouldTryServer()) {
    return false;
  }

  try {
    const res = await fetch(API_BASE);
    if (!res.ok) {
      if (res.status === 404 || res.status === 405) {
        markApiUnavailable();
      }
      return false;
    }

    const serverMap = (await res.json()) as Record<string, Partial<VspRecord>>;
    const local = loadRegistry();
    for (const [id, record] of Object.entries(serverMap)) {
      local[id] = migrateRecord(record as Partial<VspRecord> & Record<string, unknown>);
    }
    saveRegistry(local);
    synced = true;
    markApiAvailable();
    return true;
  } catch {
    markApiUnavailable();
    return false;
  }
}

function pushToServer(patient: VspRecord): void {
  if (!shouldTryServer()) {
    return;
  }

  fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patient),
  })
    .then((res) => {
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        markApiUnavailable();
        return;
      }
      markApiAvailable();
    })
    .catch(() => {
      markApiUnavailable();
    });
}

function deleteFromServer(patientId: string): void {
  if (!shouldTryServer()) {
    return;
  }

  fetch(`${API_BASE}?id=${encodeURIComponent(patientId)}`, {
    method: 'DELETE',
  })
    .then((res) => {
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        markApiUnavailable();
        return;
      }
      markApiAvailable();
    })
    .catch(() => {
      markApiUnavailable();
    });
}

export function initRegistry(): Promise<boolean> {
  return syncFromServer();
}

export function hasSyncedRegistry(): boolean {
  return synced;
}

export function displayName(record: Partial<VspRecord> | null | undefined): string {
  if (!record) return '';
  if (record.name && !record.firstName) return record.name;
  return [record.firstName, record.middleName, record.lastName].filter(Boolean).join(' ');
}

export function patientSummary(record: Partial<VspRecord> | null | undefined): string {
  if (!record) return '';
  const name = record.preferredName || displayName(record) || 'Unnamed';
  const age = computeAge(record.dob ?? '');
  const ageText = age != null ? `${age} yo` : '';
  const sexText =
    record.sex && record.sex !== 'unspecified'
      ? record.sex.charAt(0).toUpperCase() + record.sex.slice(1)
      : '';
  const parts = [ageText, sexText].filter(Boolean).join(', ');
  return parts ? `${name} (${parts})` : name;
}

export function allergySummary(record: Partial<VspRecord> | null | undefined): string {
  if (!record || !Array.isArray(record.allergies) || record.allergies.length === 0) return 'NKDA';
  return record.allergies
    .map((allergy) => allergy.name)
    .filter(Boolean)
    .join(', ');
}

export function listPatients(): VspRecord[] {
  return Object.values(loadRegistry()).sort((a, b) => {
    const last = (a.lastName || '').localeCompare(b.lastName || '');
    return last !== 0 ? last : (a.firstName || '').localeCompare(b.firstName || '');
  });
}

export function getPatient(vspId: string | null | undefined): VspRecord | null {
  if (!vspId) return null;
  return loadRegistry()[vspId] ?? null;
}

export function createPatient(fields: Partial<VspRecord> = {}): VspRecord {
  const registry = loadRegistry();
  const id = generateId();
  const now = new Date().toISOString();
  const record = migrateRecord({
    ...blankRecord(),
    ...fields,
    id,
    mrn: fields.mrn || generateMrn(),
    sex: normalizeSex(fields.sex),
    dob: normalizeDob(fields.dob),
    createdAt: now,
    updatedAt: now,
  });
  registry[id] = record;
  saveRegistry(registry);
  pushToServer(record);
  return record;
}

export function updatePatient(vspId: string, fields: Partial<VspRecord> = {}): VspRecord | null {
  const registry = loadRegistry();
  const existing = registry[vspId];
  if (!existing) return null;

  const next: VspRecord = {
    ...existing,
    ...fields,
    id: existing.id,
    mrn: existing.mrn,
    createdAt: existing.createdAt,
    sex: fields.sex !== undefined ? normalizeSex(fields.sex) : existing.sex,
    dob: fields.dob !== undefined ? normalizeDob(fields.dob) : existing.dob,
    updatedAt: new Date().toISOString(),
  };
  registry[vspId] = migrateRecord(next as Partial<VspRecord> & Record<string, unknown>);
  saveRegistry(registry);
  pushToServer(registry[vspId]);
  return registry[vspId];
}

export function deletePatient(vspId: string): boolean {
  const registry = loadRegistry();
  if (!registry[vspId]) return false;
  delete registry[vspId];
  saveRegistry(registry);
  deleteFromServer(vspId);
  return true;
}

export function resolvePatient(caseObj: CaseObj | null | undefined): VspRecord | null {
  const meta = (caseObj?.meta ?? {}) as Record<string, unknown>;
  const vspId = String(meta.vspId || caseObj?.vspId || '').trim();
  return getPatient(vspId);
}

export function searchPatients(query: string, limit = 25): VspRecord[] {
  const normalized = query.trim().toLowerCase();
  const patients = listPatients();
  if (!normalized) return patients.slice(0, limit);

  const scored = patients
    .map((patient) => {
      const diagnoses = (patient.medicalHistory ?? []).filter(Boolean);
      const haystack = [
        displayName(patient),
        patient.preferredName,
        patient.mrn,
        ...diagnoses,
        patient.phone,
        patient.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      let score = 0;
      if (displayName(patient).toLowerCase().startsWith(normalized)) score += 5;
      if ((patient.preferredName || '').toLowerCase().startsWith(normalized)) score += 4;
      if ((patient.mrn || '').toLowerCase().startsWith(normalized)) score += 4;
      if (diagnoses.some((diagnosis) => diagnosis.toLowerCase().startsWith(normalized))) score += 4;
      if (haystack.includes(normalized)) score += 2;

      return { patient, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const last = a.patient.lastName.localeCompare(b.patient.lastName);
      return last !== 0 ? last : a.patient.firstName.localeCompare(b.patient.firstName);
    });

  return scored.slice(0, limit).map((entry) => entry.patient);
}

export function toPickerOption(patient: VspRecord): VspPickerOption {
  const age = computeAge(patient.dob);
  return {
    id: patient.id,
    label: displayName(patient) || patient.preferredName || 'Unnamed',
    summary: patientSummary(patient),
    mrn: patient.mrn,
    age,
    sex: patient.sex,
    patient,
  };
}

export function listPatientPickerOptions(limit = 50): VspPickerOption[] {
  return listPatients().slice(0, limit).map(toPickerOption);
}

export function searchPatientPickerOptions(query: string, limit = 25): VspPickerOption[] {
  return searchPatients(query, limit).map(toPickerOption);
}

export function buildLinkedCasePatientFields(patient: VspRecord): LinkedCasePatientFields {
  const age = computeAge(patient.dob);
  const name = displayName(patient) || patient.preferredName || 'Unnamed';

  return {
    vspId: patient.id,
    patientName: name,
    patientDOB: patient.dob,
    patientGender: patient.sex,
    patientAge: age != null ? String(age) : '',
    meta: {
      vspId: patient.id,
      patientName: name,
      dob: patient.dob,
      sex: patient.sex,
      age: age != null ? String(age) : '',
    },
    subjective: {
      patientName: name,
      patientBirthday: patient.dob,
      patientGender: patient.sex,
      patientAge: age != null ? String(age) : '',
      __vspId: patient.id,
    },
  };
}

export function linkCaseToPatient(caseObj: CaseObj, patient: VspRecord): CaseObj {
  const linked = buildLinkedCasePatientFields(patient);
  const currentMeta =
    caseObj.meta && typeof caseObj.meta === 'object' && !Array.isArray(caseObj.meta)
      ? (caseObj.meta as Record<string, unknown>)
      : {};
  const currentSubjective =
    caseObj.subjective &&
    typeof caseObj.subjective === 'object' &&
    !Array.isArray(caseObj.subjective)
      ? (caseObj.subjective as Record<string, unknown>)
      : {};

  return {
    ...caseObj,
    vspId: patient.id,
    patientName: linked.patientName,
    patientDOB: linked.patientDOB,
    patientGender: linked.patientGender,
    patientAge: linked.patientAge,
    meta: {
      ...currentMeta,
      ...linked.meta,
    },
    subjective: {
      ...currentSubjective,
      ...linked.subjective,
    },
  };
}

export function clearRegistry(): void {
  storage.removeItem(REGISTRY_KEY);
  synced = false;
}

export function getRegistrySnapshot(): VspRegistryMap {
  return loadRegistry();
}
