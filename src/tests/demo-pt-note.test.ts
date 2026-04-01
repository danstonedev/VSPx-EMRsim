import { describe, expect, it } from 'vitest';

import {
  buildRobertCastellanoPtDemoDraft,
  isRobertCastellanoDemoPatient,
  ROBERT_CASTELLANO_DEMO_MRN,
} from '$lib/config/demoPtNote';
import { SEED_PATIENTS } from '$lib/config/seedPatients';
import type { VspRecord } from '$lib/services/vspRegistry';

function buildSeedPatient(): VspRecord {
  const seed = SEED_PATIENTS[0] as Partial<VspRecord>;

  return {
    id: 'vsp_demo_robert',
    mrn: ROBERT_CASTELLANO_DEMO_MRN,
    firstName: 'Robert',
    middleName: 'James',
    lastName: 'Castellano',
    preferredName: 'Bob',
    dob: '1958-04-12',
    sex: 'male',
    genderIdentity: 'man',
    pronouns: 'he/him',
    race: 'White',
    ethnicity: 'Not Hispanic or Latino',
    maritalStatus: 'Married',
    preferredLanguage: 'English',
    interpreterNeeded: false,
    heightFt: '5',
    heightIn: '10',
    weightLbs: '214',
    bloodType: 'A+',
    phone: '(701) 555-0147',
    email: 'rcastellano@email.com',
    addressStreet: '2418 University Ave',
    addressCity: 'Grand Forks',
    addressState: 'ND',
    addressZip: '58203',
    emergencyContactName: 'Linda Castellano',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '(701) 555-0193',
    insuranceProvider: 'Blue Cross Blue Shield of North Dakota',
    insurancePolicyNumber: 'BCBS-88421076',
    insuranceGroupNumber: 'GRP-4420',
    allergies: [],
    medicalHistory: [],
    surgicalHistory: [],
    activeMedications: [],
    codeStatus: 'Full Code',
    primaryCareProvider: 'Dr. Sarah Lindgren, MD',
    createdAt: '2026-03-30T00:00:00.000Z',
    updatedAt: '2026-03-30T00:00:00.000Z',
    ...seed,
  };
}

describe('demo PT note builder', () => {
  it('identifies Robert Castellano as the demo patient', () => {
    const patient = buildSeedPatient();
    expect(isRobertCastellanoDemoPatient(patient)).toBe(true);
    expect(
      isRobertCastellanoDemoPatient({
        firstName: 'Alice',
        lastName: 'Nguyen',
        dob: '1988-06-10',
        mrn: 'VSP-00000001',
      }),
    ).toBe(false);
  });

  it('builds a fully populated PT demo draft', () => {
    const patient = buildSeedPatient();
    const draft = buildRobertCastellanoPtDemoDraft(patient);

    expect(draft.subjective.patientName).toContain('Robert');
    expect(draft.subjective.chiefComplaint).toContain('Right knee');
    expect(draft.subjective.redFlagScreening?.some((item) => item.status === 'present')).toBe(true);
    expect(draft.subjective.qaItems).toHaveLength(3);
    expect(draft.subjective.medications?.length).toBeGreaterThan(3);

    expect(draft.objective.vitalsSeries).toHaveLength(1);
    expect(draft.objective.regionalAssessments?.selectedRegions).toEqual(['knee', 'lumbar-spine']);
    expect(draft.objective.neuroscreenData?.selectedRegions).toEqual(['lower-extremity']);
    expect(draft.objective.standardizedAssessments).toHaveLength(1);
    expect(draft.objective.standardizedAssessments?.[0].instrumentKey).toBe('berg-balance-scale');
    expect(draft.objective.standardizedAssessments?.[0].status).toBe('complete');

    expect(draft.assessment.ptDiagnosis).toContain('Post-surgical right knee');
    expect(draft.plan.frequency).toBe('2x-week');
    expect(draft.plan.goals).toHaveLength(3);
    expect(draft.billing.diagnosisCodes).toHaveLength(3);
    expect(draft.billing.billingCodes).toHaveLength(3);
    expect(Array.isArray(draft.billing.ordersReferrals)).toBe(true);
  });
});
