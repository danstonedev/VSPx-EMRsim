import {
  resolvePatient,
  displayName,
  allergySummary,
  computeAge,
  computeBmi,
} from './vsp-registry.js';

export function resolvePatientProfile(caseObj, draftLike = null) {
  const vsp = resolvePatient(caseObj);
  const draft = getSubjectiveDraft(draftLike);
  const meta = caseObj.meta || {};
  const snap = caseObj.snapshot || {};

  const name = vsp
    ? displayName(vsp)
    : pickFirst(
        draft.patientName,
        snap.name,
        meta.patientName,
        caseObj.patientName,
        'Unknown Patient',
      );
  const preferredName = pickFirst(vsp?.preferredName, snap.preferredName, meta.preferredName);
  const dob = pickFirst(vsp?.dob, draft.patientBirthday, caseObj.patientDOB, snap.dob, meta.dob);
  const age = pickFirst(computeAge(dob), draft.patientAge, snap.age, meta.age);
  const sex = capitalize(
    pickFirst(vsp?.sex, draft.patientGender, caseObj.patientGender, snap.sex, meta.sex),
  );
  const mrn = pickFirst(vsp?.mrn, caseObj.mrn, snap.mrn, meta.mrn);
  const pronouns = pickFirst(
    vsp?.pronouns,
    draft.patientGenderIdentityPronouns,
    caseObj.patientGenderIdentityPronouns,
    meta.genderIdentityPronouns,
  );
  const genderIdentity = pickFirst(vsp?.genderIdentity, meta.genderIdentity);
  const language = pickFirst(
    vsp?.preferredLanguage,
    draft.patientPreferredLanguage,
    meta.preferredLanguage,
    'English',
  );
  const interpreter = normalizeYesNo(
    pickFirst(vsp?.interpreterNeeded, draft.patientInterpreterNeeded, meta.interpreterNeeded),
  );
  const race = pickFirst(vsp?.race, meta.race);
  const ethnicity = pickFirst(vsp?.ethnicity, meta.ethnicity);
  const maritalStatus = pickFirst(vsp?.maritalStatus, meta.maritalStatus);
  const bloodType = pickFirst(vsp?.bloodType, meta.bloodType);
  const codeStatus = pickFirst(vsp?.codeStatus, snap.codeStatus, meta.codeStatus);
  const allergies = vsp ? allergySummary(vsp) : pickFirst(meta.allergies, snap.allergies, 'NKDA');
  const allergyDetails = formatAllergyDetails(vsp?.allergies, allergies);
  const activeMedications = formatMedicationDetails(vsp?.activeMedications);
  const medicalHistory = normalizeList(vsp?.medicalHistory);
  const surgicalHistory = normalizeList(vsp?.surgicalHistory);
  const primaryCareProvider = pickFirst(vsp?.primaryCareProvider, meta.primaryCareProvider);
  const insuranceProvider = pickFirst(vsp?.insuranceProvider, meta.insuranceProvider);
  const insurancePolicyNumber = pickFirst(vsp?.insurancePolicyNumber, meta.insurancePolicyNumber);
  const insuranceGroupNumber = pickFirst(vsp?.insuranceGroupNumber, meta.insuranceGroupNumber);
  const setting = pickFirst(caseObj.setting, meta.setting);
  const encounter = pickFirst(caseObj.encounterType, meta.encounterType);
  const phone = formatPhone(pickFirst(vsp?.phone, meta.phone));
  const email = pickFirst(vsp?.email, meta.email);
  const address = formatAddress(vsp, meta);
  const emergencyContact = formatEmergencyContact(vsp, meta);
  const height = formatHeight(vsp, draft, meta);
  const weight = formatWeight(vsp, draft, meta);
  const bmi = formatBmi(vsp, draft, meta);
  const workStatus = pickFirst(draft.patientWorkStatusOccupation, meta.patientWorkStatusOccupation);
  const livingSituation = pickFirst(
    draft.patientLivingSituationHomeEnvironment,
    meta.patientLivingSituationHomeEnvironment,
  );
  const socialSupport = pickFirst(draft.patientSocialSupport, meta.patientSocialSupport);
  const demographicNotes = pickFirst(draft.patientDemographics, meta.patientDemographics);

  const identityRows = compactRows([
    ['Full Name', name],
    ['Preferred Name', preferredName],
    ['MRN', mrn],
    ['DOB', formatDob(dob)],
    ['Age', age !== '' && age != null ? String(age) : ''],
    ['Sex', sex],
    ['Gender Identity', genderIdentity],
    ['Pronouns', pronouns],
    ['Race', race],
    ['Ethnicity', ethnicity],
    ['Marital Status', maritalStatus],
    ['Blood Type', bloodType],
  ]);

  const encounterRows = compactRows([
    ['Setting', setting],
    ['Encounter Type', encounter],
    ['Primary Care Provider', primaryCareProvider],
    ['Preferred Language', language],
    ['Interpreter Needed', interpreter],
    ['Code Status', codeStatus],
  ]);

  const contactRows = compactRows([
    ['Phone', phone],
    ['Email', email],
    ['Address', address],
    ['Emergency Contact', emergencyContact],
  ]);

  const coverageRows = compactRows([
    ['Insurance', insuranceProvider],
    ['Policy Number', insurancePolicyNumber],
    ['Group Number', insuranceGroupNumber],
  ]);

  const anthropometricRows = compactRows([
    ['Height', height],
    ['Weight', weight],
    ['BMI', bmi],
  ]);

  const clinicalBackground = [
    ...medicalHistory,
    ...surgicalHistory.map((item) => `Surgical history: ${item}`),
    ...activeMedications.map((item) => `Medication: ${item}`),
    workStatus ? `Work status: ${workStatus}` : '',
    livingSituation ? `Living situation: ${livingSituation}` : '',
    socialSupport ? `Social support: ${socialSupport}` : '',
    demographicNotes ? `Notes: ${demographicNotes}` : '',
  ].filter(Boolean);

  return {
    name,
    preferredName,
    mrn,
    dob,
    dobDisplay: formatDob(dob),
    age: age !== '' && age != null ? String(age) : '',
    sex,
    pronouns,
    genderIdentity,
    race,
    ethnicity,
    maritalStatus,
    bloodType,
    language,
    interpreter,
    setting,
    encounter,
    primaryCareProvider,
    codeStatus,
    allergies,
    allergyDetails,
    phone,
    email,
    address,
    emergencyContact,
    insuranceProvider,
    insurancePolicyNumber,
    insuranceGroupNumber,
    height,
    weight,
    bmi,
    workStatus,
    livingSituation,
    socialSupport,
    demographicNotes,
    activeMedications,
    medicalHistory,
    surgicalHistory,
    identityRows,
    encounterRows,
    contactRows,
    coverageRows,
    anthropometricRows,
    clinicalBackground,
    heroChips: [
      mrn ? `MRN ${mrn}` : '',
      formatDob(dob) ? `DOB ${formatDob(dob)}` : '',
      age !== '' && age != null ? `Age ${age}` : '',
      sex ? `Sex ${sex}` : '',
      pronouns,
      setting || encounter ? [setting, encounter].filter(Boolean).join(' / ') : '',
    ].filter(Boolean),
  };
}

export function getPatientProfileExportRows(profile) {
  return [
    ...profile.identityRows,
    ...profile.encounterRows,
    ['Allergies', profile.allergies],
    ...profile.contactRows,
    ...profile.coverageRows,
    ...profile.anthropometricRows,
  ].filter(([, value]) => value);
}

export function hasPatientProfileContent(profile) {
  return Boolean(
    profile &&
    (profile.identityRows.length ||
      profile.encounterRows.length ||
      profile.contactRows.length ||
      profile.coverageRows.length ||
      profile.anthropometricRows.length ||
      profile.clinicalBackground.length ||
      profile.allergies),
  );
}

function getSubjectiveDraft(draftLike) {
  if (draftLike?.subjective) return draftLike.subjective;
  if (draftLike && typeof draftLike === 'object') return draftLike;
  if (typeof window !== 'undefined' && window.currentDraft?.subjective) {
    return window.currentDraft.subjective;
  }
  return {};
}

function compactRows(rows) {
  return rows.filter(([, value]) => value);
}

function pickFirst(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value) && value.length) return value;
  }
  return '';
}

function formatDob(dobStr) {
  if (!dobStr) return '';
  const d = new Date(dobStr);
  if (Number.isNaN(d.getTime())) return String(dobStr);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeYesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (normalized === 'yes') return 'Yes';
  if (normalized === 'no') return 'No';
  return '';
}

function formatPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 10) return String(phone || '').trim();
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatAddress(vsp, meta) {
  const parts = [
    pickFirst(vsp?.addressStreet, meta.addressStreet),
    pickFirst(vsp?.addressCity, meta.addressCity),
    pickFirst(vsp?.addressState, meta.addressState),
    pickFirst(vsp?.addressZip, meta.addressZip),
  ].filter(Boolean);
  return parts.join(', ');
}

function formatEmergencyContact(vsp, meta) {
  const name = pickFirst(vsp?.emergencyContactName, meta.emergencyContactName);
  if (!name) return '';
  const relationship = pickFirst(
    vsp?.emergencyContactRelationship,
    meta.emergencyContactRelationship,
  );
  const phone = formatPhone(pickFirst(vsp?.emergencyContactPhone, meta.emergencyContactPhone));
  return [name, relationship, phone].filter(Boolean).join(' | ');
}

function formatHeight(vsp, draft, meta) {
  const cm = pickFirst(draft.patientHeightCm, meta.heightCm);
  const ft = pickFirst(vsp?.heightFt, draft.patientHeightFt, meta.heightFt);
  const inch = pickFirst(vsp?.heightIn, draft.patientHeightIn, meta.heightIn);
  const imperial = [ft ? `${ft}'` : '', inch || inch === 0 ? `${inch}"` : '']
    .filter(Boolean)
    .join(' ')
    .trim();
  if (cm && imperial) return `${imperial} (${cm} cm)`;
  if (imperial) return imperial;
  if (cm) return `${cm} cm`;
  return '';
}

function formatWeight(vsp, draft, meta) {
  const lbs = pickFirst(vsp?.weightLbs, draft.patientWeight, meta.weightLbs);
  const kg = pickFirst(draft.patientWeightKg, meta.weightKg);
  if (lbs && kg) return `${lbs} lbs (${kg} kg)`;
  if (lbs) return `${lbs} lbs`;
  if (kg) return `${kg} kg`;
  return '';
}

function formatBmi(vsp, draft, meta) {
  const explicit = pickFirst(draft.patientBmi, meta.patientBmi);
  if (explicit) return String(explicit);

  const heightInches =
    toNumber(pickFirst(vsp?.heightFt, draft.patientHeightFt, meta.heightFt)) * 12 +
    toNumber(pickFirst(vsp?.heightIn, draft.patientHeightIn, meta.heightIn));
  const weightLbs = toNumber(pickFirst(vsp?.weightLbs, draft.patientWeight, meta.weightLbs));
  if (heightInches > 0 && weightLbs > 0) return computeBmi(heightInches, weightLbs);

  const heightCm = toNumber(pickFirst(draft.patientHeightCm, meta.heightCm));
  const weightKg = toNumber(pickFirst(draft.patientWeightKg, meta.weightKg));
  if (heightCm > 0 && weightKg > 0) {
    const heightMeters = heightCm / 100;
    return (weightKg / (heightMeters * heightMeters)).toFixed(1);
  }

  return '';
}

function toNumber(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

function formatAllergyDetails(allergies, fallbackText) {
  if (!Array.isArray(allergies) || !allergies.length) {
    return fallbackText && fallbackText !== 'NKDA' ? [fallbackText] : [];
  }

  return allergies
    .map((allergy) =>
      [allergy?.name, allergy?.severity, allergy?.reaction].filter(Boolean).join(' | '),
    )
    .filter(Boolean);
}

function formatMedicationDetails(medications) {
  if (!Array.isArray(medications)) return [];
  return medications
    .map((medication) =>
      [medication?.name, medication?.dose, medication?.route, medication?.frequency]
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean);
}

function normalizeList(values) {
  return Array.isArray(values) ? values.filter(Boolean).map((value) => String(value)) : [];
}
