// SubjectiveSection.js - Comprehensive Subjective Assessment Module
// Handles pain assessment, functional status, and medical history collection

import { inputField, selectField, textAreaField } from '../../../ui/form-components.js';
import { el } from '../../../ui/utils.js';
import { MedicationPanel } from './MedicationPanel.js';
import { PainAssessment } from './PainAssessment.js';
import { RedFlagScreening } from './RedFlagScreening.js';
import { createInterviewQAPanel } from './SubjectiveQA.js';

/**
 * Creates the complete subjective assessment section with structured pain assessment,
 * functional status evaluation, and comprehensive medical history collection
 * @param {Object} subjectiveData - Current subjective assessment data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete subjective section
 */
export function createSubjectiveSection(subjectiveData, onUpdate) {
  const section = el('div', { class: 'subjective-section' });

  const DEFAULT_PRONOUNS_BY_SEX = {
    female: 'Woman (she/her)',
    male: 'Man (he/him)',
    other: 'Non-binary (they/them)',
    unspecified: 'Prefer not to say',
  };

  const normalizeGender = (value) => {
    const v = String(value || '')
      .trim()
      .toLowerCase();
    if (!v) return '';
    if (v === 'prefer-not-to-say' || v === 'prefer not to say') return 'unspecified';
    if (['male', 'female', 'other', 'unspecified'].includes(v)) return v;
    return v;
  };

  const getDefaultPronounsForSex = (sexValue) => {
    const normalized = normalizeGender(sexValue) || 'unspecified';
    return DEFAULT_PRONOUNS_BY_SEX[normalized] || '';
  };

  const isDefaultPronounsValue = (value) => {
    if (!value) return false;
    return Object.values(DEFAULT_PRONOUNS_BY_SEX).includes(String(value));
  };

  const COMMON_LANGUAGE_OPTIONS = [
    'English',
    'Spanish',
    'Mandarin Chinese',
    'Hindi',
    'Arabic',
    'Bengali',
    'Portuguese',
    'Russian',
    'French',
    'Urdu',
  ];

  const normalizeInterpreter = (value) => {
    const v = String(value || '')
      .trim()
      .toLowerCase();
    if (v === 'yes' || v === 'no') return v;
    return '';
  };

  const getDefaultInterpreterForLanguage = (languageValue) => {
    const normalized = String(languageValue || '')
      .trim()
      .toLowerCase();
    if (!normalized) return '';
    return normalized === 'english' ? 'no' : 'yes';
  };

  const computeAgeFromDob = (dobValue) => {
    if (!dobValue) return '';
    const dob = new Date(dobValue);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDelta = today.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age >= 0 && age < 200 ? String(age) : '';
  };

  const normalizeDobForInput = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const mm = slashMatch[1].padStart(2, '0');
      const dd = slashMatch[2].padStart(2, '0');
      const yyyy = slashMatch[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Initialize data structure if needed
  const data = {
    patientName: '',
    patientBirthday: '',
    patientAge: '',
    patientGender: '',
    patientGenderIdentityPronouns: '',
    patientPreferredLanguage: '',
    patientInterpreterNeeded: '',
    patientWorkStatusOccupation: '',
    patientLivingSituationHomeEnvironment: '',
    patientSocialSupport: '',
    patientDemographics: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    painLocation: '',
    painScale: '',
    painQuality: '',
    painPattern: '',
    aggravatingFactors: '',
    easingFactors: '',
    functionalLimitations: '',
    priorLevel: '',
    patientGoals: '',
    medicationsCurrent: '',
    redFlags: '',
    additionalHistory: '',
    ...subjectiveData,
  };

  data.patientBirthday = normalizeDobForInput(data.patientBirthday);
  data.patientGender = normalizeGender(data.patientGender);
  if (!data.patientGenderIdentityPronouns) {
    data.patientGenderIdentityPronouns = getDefaultPronounsForSex(data.patientGender);
  }

  data.patientPreferredLanguage = String(data.patientPreferredLanguage || '').trim() || 'English';
  data.patientInterpreterNeeded = normalizeInterpreter(data.patientInterpreterNeeded);
  if (!data.patientInterpreterNeeded) {
    data.patientInterpreterNeeded = getDefaultInterpreterForLanguage(data.patientPreferredLanguage);
  }

  if ((!data.patientAge || String(data.patientAge).trim() === '') && data.patientBirthday) {
    data.patientAge = computeAgeFromDob(data.patientBirthday);
  }

  const PROFILE_SYNC_FIELDS = new Set([
    'patientName',
    'patientBirthday',
    'patientAge',
    'patientGender',
    'patientGenderIdentityPronouns',
  ]);

  const emitProfileSync = () => {
    const sex = normalizeGender(data.patientGender);
    window.dispatchEvent(
      new CustomEvent('pt-emr-profile-sync', {
        detail: {
          source: 'subjective',
          title: data.patientName || '',
          patientName: data.patientName || '',
          patientBirthday: data.patientBirthday || '',
          patientAge: data.patientAge || '',
          patientGender: sex,
          patientGenderIdentityPronouns: data.patientGenderIdentityPronouns || '',
          dob: data.patientBirthday || '',
          age: data.patientAge || '',
          sex,
        },
      }),
    );
  };

  const syncBirthdayDerivedAge = () => {
    data.patientAge = computeAgeFromDob(data.patientBirthday);
    if (patientAgeControl) patientAgeControl.value = data.patientAge;
    if (patientBirthdayControl) patientBirthdayControl.value = data.patientBirthday;
  };

  const syncSexDefaults = (value, previousSex, previousPronouns) => {
    data.patientGender = normalizeGender(value);
    const previousDefault = getDefaultPronounsForSex(previousSex);
    const shouldApplyDefault = !previousPronouns || previousPronouns === previousDefault;
    if (shouldApplyDefault) {
      data.patientGenderIdentityPronouns = getDefaultPronounsForSex(data.patientGender);
      if (patientPronounsControl) patientPronounsControl.value = data.patientGenderIdentityPronouns;
    }
    if (patientGenderControl) patientGenderControl.value = data.patientGender;
  };

  const syncLanguageDefaults = (value, previousLanguage, previousInterpreter) => {
    data.patientPreferredLanguage = String(value || '').trim();
    const previousDefault = getDefaultInterpreterForLanguage(previousLanguage);
    const shouldApplyDefault = !previousInterpreter || previousInterpreter === previousDefault;
    if (shouldApplyDefault) {
      data.patientInterpreterNeeded = getDefaultInterpreterForLanguage(
        data.patientPreferredLanguage,
      );
      if (patientInterpreterControl)
        patientInterpreterControl.value = data.patientInterpreterNeeded;
    }
    if (patientLanguageControl) patientLanguageControl.value = data.patientPreferredLanguage;
  };

  // Update helper
  const updateField = (field, value) => {
    const previousSex = data.patientGender;
    const previousPronouns = data.patientGenderIdentityPronouns;
    const previousLanguage = data.patientPreferredLanguage;
    const previousInterpreter = data.patientInterpreterNeeded;

    data[field] = field === 'patientBirthday' ? normalizeDobForInput(value) : value;
    if (field === 'patientGender') syncSexDefaults(value, previousSex, previousPronouns);
    if (field === 'patientPreferredLanguage') {
      syncLanguageDefaults(value, previousLanguage, previousInterpreter);
    }
    if (field === 'patientInterpreterNeeded') {
      data.patientInterpreterNeeded = normalizeInterpreter(value);
      if (patientInterpreterControl)
        patientInterpreterControl.value = data.patientInterpreterNeeded;
    }
    if (field === 'patientBirthday') syncBirthdayDerivedAge();

    onUpdate(data);

    if (PROFILE_SYNC_FIELDS.has(field)) emitProfileSync();
  };

  const pickControl = (fieldNode) => fieldNode.querySelector('input, select, textarea');

  // Patient profile section with anchor
  const hpiHeader = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Patient Profile'),
  ]);
  const patientNameField = inputField({
    label: 'Full Name',
    value: data.patientName,
    onChange: (v) => updateField('patientName', v),
    hint: 'Full patient name as documented for this case',
  });
  const patientBirthdayField = inputField({
    label: 'Date of Birth',
    type: 'date',
    value: data.patientBirthday,
    onChange: (v) => updateField('patientBirthday', v),
    hint: "Use the date picker to select the patient's birth date",
    autocomplete: 'bday',
    min: '1900-01-01',
    max: new Date().toISOString().slice(0, 10),
  });
  const patientAgeField = inputField({
    label: 'Age',
    type: 'number',
    value: data.patientAge,
    disabled: true,
    hint: 'Auto-calculated from Date of Birth',
  });
  const patientGenderField = selectField({
    label: 'Sex',
    value: data.patientGender,
    options: [
      { value: '', label: 'Select sex' },
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'other', label: 'Other' },
      { value: 'unspecified', label: 'Prefer not to say' },
    ],
    onChange: (v) => updateField('patientGender', v),
  });
  const patientPronounsField = selectField({
    label: 'Gender Identity / Pronouns',
    value: data.patientGenderIdentityPronouns,
    options: [
      { value: '', label: 'Select option' },
      { value: 'Woman (she/her)', label: 'Woman (she/her)' },
      { value: 'Man (he/him)', label: 'Man (he/him)' },
      { value: 'Non-binary (they/them)', label: 'Non-binary (they/them)' },
      { value: 'Trans woman (she/her)', label: 'Trans woman (she/her)' },
      { value: 'Trans man (he/him)', label: 'Trans man (he/him)' },
      { value: 'Prefer not to say', label: 'Prefer not to say' },
      { value: 'Use name only', label: 'Use name only' },
    ],
    onChange: (v) => updateField('patientGenderIdentityPronouns', v),
  });
  const patientLanguageField = selectField({
    label: 'Preferred Language',
    value: data.patientPreferredLanguage,
    options: [
      { value: '', label: 'Select language' },
      ...COMMON_LANGUAGE_OPTIONS.map((language) => ({ value: language, label: language })),
      { value: 'Other / Custom', label: 'Other / Custom' },
    ],
    onChange: (v) => updateField('patientPreferredLanguage', v),
  });
  const patientInterpreterField = selectField({
    label: 'Interpreter Needed',
    value: data.patientInterpreterNeeded,
    options: [
      { value: '', label: 'Select option' },
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    onChange: (v) => updateField('patientInterpreterNeeded', v),
  });
  const patientWorkStatusField = textAreaField({
    label: 'Work Status & Occupation',
    value: data.patientWorkStatusOccupation,
    onChange: (v) => updateField('patientWorkStatusOccupation', v),
    hint: 'Employment status, role, physical demands, schedule, and work-related barriers',
  });
  const patientLivingSituationField = textAreaField({
    label: 'Living Situation / Home Environment',
    value: data.patientLivingSituationHomeEnvironment,
    onChange: (v) => updateField('patientLivingSituationHomeEnvironment', v),
    hint: 'Housing setup, stairs, equipment, accessibility concerns, and environmental factors',
  });
  const patientSocialSupportField = textAreaField({
    label: 'Social Support',
    value: data.patientSocialSupport,
    onChange: (v) => updateField('patientSocialSupport', v),
    hint: 'Family/caregiver support, transportation, and community resources',
  });

  const patientNameControl = pickControl(patientNameField);
  const patientBirthdayControl = pickControl(patientBirthdayField);
  const patientAgeControl = pickControl(patientAgeField);
  const patientGenderControl = pickControl(patientGenderField);
  const patientPronounsControl = pickControl(patientPronounsField);
  const patientLanguageControl = pickControl(patientLanguageField);
  const patientInterpreterControl = pickControl(patientInterpreterField);

  const focusNextFocusable = (current) => {
    const focusables = Array.from(
      section.querySelectorAll(
        'input, select, textarea, button, [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((node) => !node.disabled && node.tabIndex !== -1);
    const idx = focusables.indexOf(current);
    if (idx < 0 || idx + 1 >= focusables.length) return;
    focusables[idx + 1].focus();
  };

  if (patientBirthdayControl) {
    patientBirthdayControl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        patientBirthdayControl.blur();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        focusNextFocusable(patientBirthdayControl);
      }
    });
  }

  const dobAgeRow = el('div', { class: 'patient-profile-inline-row' }, [
    el('div', { class: 'patient-profile-inline-row__cell' }, [patientBirthdayField]),
    el('div', { class: 'patient-profile-inline-row__cell' }, [patientAgeField]),
  ]);
  const sexPronounsRow = el('div', { class: 'patient-profile-inline-row' }, [
    el('div', { class: 'patient-profile-inline-row__cell' }, [patientGenderField]),
    el('div', { class: 'patient-profile-inline-row__cell' }, [patientPronounsField]),
  ]);
  const languageInterpreterRow = el('div', { class: 'patient-profile-inline-row' }, [
    el('div', { class: 'patient-profile-inline-row__cell' }, [patientLanguageField]),
    el('div', { class: 'patient-profile-inline-row__cell' }, [patientInterpreterField]),
  ]);
  const interviewQASection = el(
    'div',
    { id: 'interview-qa', class: 'section-anchor section-panel' },
    [
      el('div', { class: 'section-panel__header' }, [
        el('span', { class: 'section-panel__title' }, 'Interview Q&A'),
      ]),
      el('div', { class: 'section-panel__body' }, [
        createInterviewQAPanel(data, (updated) => {
          data.qaItems = updated.qaItems;
          onUpdate(data);
        }),
      ]),
    ],
  );

  const hpiBody = el('div', { class: 'section-panel__body' }, [
    patientNameField,
    dobAgeRow,
    sexPronounsRow,
    languageInterpreterRow,
    patientWorkStatusField,
    patientLivingSituationField,
    patientSocialSupportField,
  ]);
  const hpiSection = el('div', { id: 'hpi', class: 'section-anchor section-panel' }, [
    hpiHeader,
    hpiBody,
  ]);
  section.append(hpiSection);

  // History section — Chief Concern, HPI, Functional Limitations
  const historySection = el('div', { id: 'history', class: 'section-anchor section-panel' }, [
    el('div', { class: 'section-panel__header' }, [
      el('span', { class: 'section-panel__title' }, 'History'),
    ]),
    el('div', { class: 'section-panel__body' }, [
      textAreaField({
        label: 'Chief Concern',
        value: data.chiefComplaint,
        onChange: (v) => updateField('chiefComplaint', v),
        hint: "Patient's primary complaint in their own words — avoid paraphrasing or interpreting",
      }),
      textAreaField({
        label: 'History of Present Illness',
        value: data.historyOfPresentIllness,
        onChange: (v) => updateField('historyOfPresentIllness', v),
        hint: 'Onset & mechanism, duration, prior episodes, progression, prior treatments and response',
      }),
      textAreaField({
        label: 'Additional Relevant History',
        value: data.additionalHistory,
        onChange: (v) => updateField('additionalHistory', v),
        hint: 'Prior surgeries, imaging results, previous PT episodes and response, relevant co-morbidities, family history',
      }),
      textAreaField({
        label: 'Current Functional Limitations',
        value: data.functionalLimitations,
        onChange: (v) => updateField('functionalLimitations', v),
        hint: 'Mobility, ADLs, work tasks, recreation, sport — what is limited, avoided, or requires modification',
      }),
      textAreaField({
        label: 'Prior Level of Function',
        value: data.priorLevel,
        onChange: (v) => updateField('priorLevel', v),
        hint: 'Employment status, recreational activities, independence with ADLs prior to this episode',
      }),
      textAreaField({
        label: 'Patient Goals & Expectations',
        value: data.patientGoals,
        onChange: (v) => updateField('patientGoals', v),
        hint: 'Functional outcome goals: specific activities, roles, or performance levels the patient wants to achieve',
      }),
    ]),
  ]);
  section.append(historySection);

  // Interview Q&A section
  section.append(interviewQASection);

  // Pain assessment section with anchor - Using improved PainAssessment module
  const painHeader = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Symptoms'),
  ]);
  const painBody = el('div', { class: 'section-panel__body' }, [
    PainAssessment.create(data, updateField),
  ]);
  const painSection = el('div', { id: 'pain-assessment', class: 'section-anchor section-panel' }, [
    painHeader,
    painBody,
  ]);
  section.append(painSection);

  const redFlagsHeader = el('div', { class: 'section-panel__header' }, [
    el('span', { class: 'section-panel__title' }, 'Red Flags / Screening'),
  ]);
  const redFlagsBody = el('div', { class: 'section-panel__body' }, [
    RedFlagScreening.create(data, updateField),
  ]);
  const redFlagsSection = el(
    'div',
    { id: 'red-flag-screening', class: 'section-anchor section-panel' },
    [redFlagsHeader, redFlagsBody],
  );
  section.append(redFlagsSection);

  // Medication & supplements section
  const medSection = el(
    'div',
    { id: 'current-medications', class: 'section-anchor section-panel' },
    [
      el('div', { class: 'section-panel__header' }, [
        el('span', { class: 'section-panel__title' }, 'Medication & Supplements'),
      ]),
      el('div', { class: 'section-panel__body' }, [MedicationPanel.create(data, updateField)]),
    ],
  );
  section.append(medSection);

  const resolveIncomingAge = (incoming) => {
    const incomingDob = incoming.patientBirthday ?? incoming.dob;
    if (incomingDob) return computeAgeFromDob(incomingDob);
    return incoming.patientAge ?? incoming.age;
  };

  const applyIncomingSyncMap = (syncMap) => {
    let changed = false;
    syncMap.forEach(({ key, value, control }) => {
      if (value === undefined) return;
      const normalized = String(value || '');
      if (normalized === String(data[key] || '')) return;
      data[key] = normalized;
      if (control) control.value = normalized;
      changed = true;
    });
    return changed;
  };

  const maybeApplyIncomingPronounDefault = (incoming, changed) => {
    if ((incoming.patientGender ?? incoming.sex) === undefined) return changed;
    if (incoming.patientGenderIdentityPronouns !== undefined) return changed;

    const incomingSex = normalizeGender(incoming.patientGender ?? incoming.sex);
    if (
      data.patientGenderIdentityPronouns &&
      !isDefaultPronounsValue(data.patientGenderIdentityPronouns)
    ) {
      return changed;
    }

    const mapped = getDefaultPronounsForSex(incomingSex);
    if (mapped === data.patientGenderIdentityPronouns) return changed;
    data.patientGenderIdentityPronouns = mapped;
    if (patientPronounsControl) patientPronounsControl.value = mapped;
    return true;
  };

  const handleProfileSync = (event) => {
    const incoming = event?.detail || {};
    if (!incoming || incoming.source === 'subjective') return;

    const syncMap = [
      {
        key: 'patientName',
        value: incoming.patientName ?? incoming.title,
        control: patientNameControl,
      },
      {
        key: 'patientBirthday',
        value: normalizeDobForInput(incoming.patientBirthday ?? incoming.dob),
        control: patientBirthdayControl,
      },
      {
        key: 'patientAge',
        value: resolveIncomingAge(incoming),
        control: patientAgeControl,
      },
      {
        key: 'patientGender',
        value: normalizeGender(incoming.patientGender ?? incoming.sex),
        control: patientGenderControl,
      },
      {
        key: 'patientGenderIdentityPronouns',
        value: incoming.patientGenderIdentityPronouns,
        control: patientPronounsControl,
      },
    ];

    let changed = applyIncomingSyncMap(syncMap);
    changed = maybeApplyIncomingPronounDefault(incoming, changed);

    if (changed) onUpdate(data);
  };

  window.addEventListener('pt-emr-profile-sync', handleProfileSync);

  return section;
}
