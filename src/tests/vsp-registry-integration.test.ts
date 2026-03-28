import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '$lib/storage';
import {
  buildLinkedCasePatientFields,
  clearRegistry,
  createPatient,
  linkCaseToPatient,
  searchPatientPickerOptions,
  searchPatients,
} from '$lib/services/vspRegistry';

describe('vsp registry integration helpers', () => {
  beforeEach(() => {
    storage.clear();
    clearRegistry();
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
  });

  it('searches patients by name and mrn', () => {
    const sarah = createPatient({ firstName: 'Sarah', lastName: 'Mitchell' });
    createPatient({ firstName: 'Jordan', lastName: 'Vale' });

    expect(searchPatients('sarah')[0]?.id).toBe(sarah.id);
    expect(searchPatients(sarah.mrn)[0]?.id).toBe(sarah.id);
  });

  it('builds picker options with summary metadata', () => {
    createPatient({
      firstName: 'Alex',
      lastName: 'Carter',
      dob: '1992-05-15',
      sex: 'female',
    });

    const option = searchPatientPickerOptions('alex')[0];
    expect(option.label).toBe('Alex Carter');
    expect(option.summary).toContain('Alex Carter');
    expect(option.patient.id).toBeTruthy();
  });

  it('builds linked case fields and applies them to a case object', () => {
    const patient = createPatient({
      firstName: 'Taylor',
      lastName: 'Bloom',
      dob: '1990-01-01',
      sex: 'female',
    });

    const linked = buildLinkedCasePatientFields(patient);
    expect(linked.vspId).toBe(patient.id);
    expect(linked.meta.vspId).toBe(patient.id);
    expect(linked.subjective.__vspId).toBe(patient.id);

    const caseObj = linkCaseToPatient(
      {
        title: 'Blank Eval',
        meta: { setting: 'Outpatient' },
      },
      patient,
    );

    expect(caseObj.vspId).toBe(patient.id);
    expect((caseObj.meta as Record<string, unknown>).vspId).toBe(patient.id);
    expect((caseObj.subjective as Record<string, unknown>).__vspId).toBe(patient.id);
    expect(caseObj.patientName).toBe('Taylor Bloom');
  });
});
