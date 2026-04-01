import { describe, expect, it } from 'vitest';

import {
  buildRobertCastellanoPtDemoDraft,
  ROBERT_CASTELLANO_DEMO_MRN,
} from '$lib/config/demoPtNote';
import { SEED_PATIENTS } from '$lib/config/seedPatients';
import { buildNotePresentation } from '$lib/services/notePresentation';
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

describe('note presentation', () => {
  it('preserves structured PT demo content as tables in export mode', () => {
    const note = buildRobertCastellanoPtDemoDraft(buildSeedPatient());
    const presentation = buildNotePresentation(note, 'export');
    const tableTitles = presentation
      .flatMap((section) => section.blocks)
      .filter((block) => block.kind === 'table')
      .map((block) => block.title);

    expect(tableTitles).toContain('Interview Q&A');
    expect(tableTitles).toContain('Current Medications');
    expect(tableTitles).toContain('Vitals Flowsheet');
    expect(tableTitles).toContain('Diagnosis Codes');
    expect(tableTitles).toContain('CPT Codes');
    expect(tableTitles).toContain('Goals');
  });

  it('does not emit standardized assessment tables when no instruments are persisted', () => {
    const presentation = buildNotePresentation(
      {
        subjective: {},
        objective: {
          standardizedAssessments: [],
        },
        assessment: {},
        plan: {},
        billing: {},
      },
      'export',
    );

    const tableTitles = presentation
      .flatMap((section) => section.blocks)
      .filter((block) => block.kind === 'table')
      .map((block) => block.title);

    expect(tableTitles).not.toContain('Standardized Assessments');
  });
});
