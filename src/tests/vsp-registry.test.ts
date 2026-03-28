import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '$lib/storage';
import {
  clearRegistry,
  computeAge,
  createPatient,
  deletePatient,
  displayName,
  getPatient,
  listPatients,
  normalizeDob,
  normalizeSex,
  patientSummary,
  resolvePatient,
  updatePatient,
} from '$lib/services/vspRegistry';

describe('vsp registry service', () => {
  beforeEach(() => {
    storage.clear();
    clearRegistry();
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
  });

  it('creates and retrieves a patient record', () => {
    const patient = createPatient({
      firstName: 'Sarah',
      lastName: 'Mitchell',
      dob: '05/15/1992',
      sex: 'female',
    });

    expect(patient.id).toMatch(/^vsp_/);
    expect(patient.mrn).toMatch(/^VSP-/);
    expect(patient.dob).toBe('1992-05-15');
    expect(patient.sex).toBe('female');
    expect(getPatient(patient.id)?.lastName).toBe('Mitchell');
  });

  it('lists patients sorted by last name then first name', () => {
    createPatient({ firstName: 'Bri', lastName: 'Young' });
    createPatient({ firstName: 'Alex', lastName: 'Adams' });

    const patients = listPatients();
    expect(patients.map((p) => p.lastName)).toEqual(['Adams', 'Young']);
  });

  it('updates mutable patient fields only', () => {
    const patient = createPatient({ firstName: 'Jamie', lastName: 'Stone', sex: 'male' });
    const updated = updatePatient(patient.id, {
      firstName: 'Jordan',
      sex: 'other',
      mrn: 'SHOULD-NOT-CHANGE',
    });

    expect(updated?.firstName).toBe('Jordan');
    expect(updated?.sex).toBe('other');
    expect(updated?.mrn).toBe(patient.mrn);
  });

  it('deletes a patient record', () => {
    const patient = createPatient({ firstName: 'Delete', lastName: 'Me' });
    expect(deletePatient(patient.id)).toBe(true);
    expect(getPatient(patient.id)).toBeNull();
  });

  it('resolves a patient from case meta vspId', () => {
    const patient = createPatient({ firstName: 'Avery', lastName: 'Cole' });
    const resolved = resolvePatient({
      meta: { vspId: patient.id },
    });

    expect(resolved?.id).toBe(patient.id);
  });

  it('provides name and summary helpers', () => {
    const patient = createPatient({
      firstName: 'Taylor',
      middleName: 'J',
      lastName: 'Bloom',
      preferredName: 'Tay',
      dob: '1990-01-01',
      sex: 'female',
    });

    expect(displayName(patient)).toBe('Taylor J Bloom');
    expect(patientSummary(patient)).toContain('Tay');
  });

  it('normalizes sex and dob and computes age', () => {
    expect(normalizeSex('M')).toBe('male');
    expect(normalizeDob('1/2/2000')).toBe('2000-01-02');
    expect(computeAge('2000-01-02')).not.toBeNull();
  });
});
