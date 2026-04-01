/**
 * Seed patient for development/testing — a fully-populated VspRecord
 * with clinically realistic data suitable for both PT and Dietetics workflows.
 *
 * Inserted into the registry on first launch when no patients exist.
 */

import type { VspRecord } from '$lib/services/vspRegistry';

export const SEED_PATIENTS: Partial<VspRecord>[] = [
  {
    // ── Identity ────────────────────────────────────────────────────
    mrn: 'VSP-42652635',
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

    // ── Measurements ────────────────────────────────────────────────
    heightFt: '5',
    heightIn: '10',
    weightLbs: '214',
    bloodType: 'A+',

    // ── Contact ─────────────────────────────────────────────────────
    phone: '(701) 555-0147',
    email: 'rcastellano@email.com',
    addressStreet: '2418 University Ave',
    addressCity: 'Grand Forks',
    addressState: 'ND',
    addressZip: '58203',

    // ── Emergency Contact ───────────────────────────────────────────
    emergencyContactName: 'Linda Castellano',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '(701) 555-0193',

    // ── Insurance ───────────────────────────────────────────────────
    insuranceProvider: 'Blue Cross Blue Shield of North Dakota',
    insurancePolicyNumber: 'BCBS-88421076',
    insuranceGroupNumber: 'GRP-4420',

    // ── Clinical Status ─────────────────────────────────────────────
    codeStatus: 'Full Code',
    primaryCareProvider: 'Dr. Sarah Lindgren, MD',

    // ── Allergies ───────────────────────────────────────────────────
    allergies: [
      {
        name: 'Penicillin',
        type: 'Drug',
        severity: 'Moderate',
        reaction: 'Rash, hives',
      },
      {
        name: 'Sulfa drugs',
        type: 'Drug',
        severity: 'Mild',
        reaction: 'GI upset',
      },
      {
        name: 'Latex',
        type: 'Environmental',
        severity: 'Mild',
        reaction: 'Contact dermatitis',
      },
    ],

    // ── Medical History ─────────────────────────────────────────────
    medicalHistory: [
      'Type 2 Diabetes Mellitus (dx 2012)',
      'Hypertension (dx 2010)',
      'Hyperlipidemia',
      'Obesity (BMI 30.7)',
      'Osteoarthritis bilateral knees',
      'Lumbar degenerative disc disease L4-L5',
      'Peripheral neuropathy bilateral feet',
      'GERD',
      'Mild depression (managed)',
    ],

    // ── Surgical History ────────────────────────────────────────────
    surgicalHistory: [
      'Right total knee arthroplasty (2024-01-15)',
      'Appendectomy (1992)',
      'Cholecystectomy (2018)',
      'Carpal tunnel release right hand (2016)',
    ],

    // ── Active Medications ──────────────────────────────────────────
    activeMedications: [
      { name: 'Metformin', dose: '1000mg', frequency: 'BID', route: 'PO' },
      { name: 'Lisinopril', dose: '20mg', frequency: 'QD', route: 'PO' },
      { name: 'Atorvastatin', dose: '40mg', frequency: 'QHS', route: 'PO' },
      { name: 'Amlodipine', dose: '5mg', frequency: 'QD', route: 'PO' },
      { name: 'Gabapentin', dose: '300mg', frequency: 'TID', route: 'PO' },
      { name: 'Omeprazole', dose: '20mg', frequency: 'QD', route: 'PO' },
      { name: 'Aspirin', dose: '81mg', frequency: 'QD', route: 'PO' },
      { name: 'Oxycodone', dose: '5mg', frequency: 'Q6H PRN', route: 'PO' },
      { name: 'Sertraline', dose: '50mg', frequency: 'QD', route: 'PO' },
      { name: 'Vitamin D3', dose: '2000 IU', frequency: 'QD', route: 'PO' },
    ],
  },
];
