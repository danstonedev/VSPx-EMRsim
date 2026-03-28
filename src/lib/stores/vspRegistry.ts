import { derived, writable } from 'svelte/store';
import type { CaseObj } from '$lib/store';
import {
  buildLinkedCasePatientFields,
  clearRegistry,
  createPatient as createRegistryPatient,
  deletePatient as deleteRegistryPatient,
  getPatient,
  getRegistrySnapshot,
  initRegistry,
  listPatients,
  listPatientPickerOptions,
  resolvePatient,
  searchPatientPickerOptions,
  searchPatients,
  toPickerOption,
  updatePatient as updateRegistryPatient,
  type LinkedCasePatientFields,
  type VspPickerOption,
  type VspRecord,
} from '$lib/services/vspRegistry';

const registryState = writable<VspRecord[]>(listPatients());
const loadingState = writable(false);

export const vspPatients = {
  subscribe: registryState.subscribe,
};

export const isRegistryLoading = {
  subscribe: loadingState.subscribe,
};

export function refreshVspRegistry(): VspRecord[] {
  const next = listPatients();
  registryState.set(next);
  return next;
}

export async function initVspRegistry(): Promise<boolean> {
  loadingState.set(true);
  try {
    const ok = await initRegistry();
    refreshVspRegistry();
    return ok;
  } finally {
    loadingState.set(false);
  }
}

export function createPatient(fields: Partial<VspRecord> = {}): VspRecord {
  const record = createRegistryPatient(fields);
  refreshVspRegistry();
  return record;
}

export function updatePatient(vspId: string, fields: Partial<VspRecord> = {}): VspRecord | null {
  const record = updateRegistryPatient(vspId, fields);
  refreshVspRegistry();
  return record;
}

export function deletePatient(vspId: string): boolean {
  const ok = deleteRegistryPatient(vspId);
  if (ok) refreshVspRegistry();
  return ok;
}

export function clearVspRegistry(): void {
  clearRegistry();
  refreshVspRegistry();
}

export function getPatientSnapshot(vspId: string | null | undefined): VspRecord | null {
  return getPatient(vspId);
}

export function getRegistryMapSnapshot() {
  return getRegistrySnapshot();
}

export function resolveCasePatient(caseObj: CaseObj | null | undefined): VspRecord | null {
  return resolvePatient(caseObj);
}

export function searchRegistryPatients(query: string, limit = 25): VspRecord[] {
  return searchPatients(query, limit);
}

export function getPatientPickerOptions(limit = 50): VspPickerOption[] {
  return listPatientPickerOptions(limit);
}

export function searchRegistryPickerOptions(query: string, limit = 25): VspPickerOption[] {
  return searchPatientPickerOptions(query, limit);
}

export function getPatientPickerOption(vspId: string | null | undefined): VspPickerOption | null {
  const patient = getPatient(vspId);
  return patient ? toPickerOption(patient) : null;
}

export function buildCasePatientLinkFields(vspId: string): LinkedCasePatientFields | null {
  const patient = getPatient(vspId);
  return patient ? buildLinkedCasePatientFields(patient) : null;
}

export function createResolvedPatientStore(caseObjStore: {
  subscribe: (run: (value: CaseObj | null | undefined) => void) => () => void;
}) {
  return derived(caseObjStore, ($caseObj) => resolvePatient($caseObj));
}
