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

  const computeBMI = (heightCm, weightKg) => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!isNaN(h) && !isNaN(w) && h > 0) {
      const m = h / 100;
      return (w / (m * m)).toFixed(1);
    }
    return '';
  };

  const cmToFtIn = (cm) => {
    const totalInches = parseFloat(cm) / 2.54;
    if (isNaN(totalInches) || totalInches <= 0) return { ft: '', inch: '' };
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches % 12);
    return { ft: String(inch === 12 ? ft + 1 : ft), inch: String(inch === 12 ? 0 : inch) };
  };

  const ftInToCm = (ft, inch) => {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inch) || 0;
    const totalInches = f * 12 + i;
    if (totalInches <= 0) return '';
    return (totalInches * 2.54).toFixed(1);
  };

  const kgToLbs = (kg) => {
    const v = parseFloat(kg);
    return isNaN(v) || v <= 0 ? '' : (v * 2.20462).toFixed(1);
  };

  const lbsToKg = (lbs) => {
    const v = parseFloat(lbs);
    return isNaN(v) || v <= 0 ? '' : (v / 2.20462).toFixed(1);
  };

  const parseImperialHeight = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return { ft: '', inch: '' };
    const primeMatch = s.match(/^(\d+)\s*[''′]\s*(\d+)\s*[""″]?\s*$/);
    if (primeMatch) return { ft: primeMatch[1], inch: primeMatch[2] };
    const spaceMatch = s.match(/^(\d+)\s+(\d+)$/);
    if (spaceMatch) return { ft: spaceMatch[1], inch: spaceMatch[2] };
    const dotMatch = s.match(/^(\d+)\.(\d+)$/);
    if (dotMatch) return { ft: dotMatch[1], inch: dotMatch[2] };
    const num = parseFloat(s);
    if (isNaN(num)) return { ft: '', inch: '' };
    if (num > 8) {
      const ft = Math.floor(num / 12);
      const inch = Math.round(num % 12);
      return { ft: String(ft), inch: String(inch) };
    }
    return { ft: String(Math.floor(num)), inch: '' };
  };

  const formatImperialHeight = (ft, inch) => {
    const f = ft ? String(ft) : '';
    const i = inch ? String(inch) : '';
    if (!f && !i) return '';
    if (f && i && i !== '0') return `${f}' ${i}"`;
    if (f) return `${f}'`;
    return `${i}"`;
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
    patientHeightFt: '',
    patientHeightIn: '',
    patientHeightCm: '',
    patientWeight: '',
    patientWeightKg: '',
    patientBmi: '',
    patientMeasurementUnit: 'imperial',
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

  // Detect if this patient came from the VSP registry (demographics are canonical)
  const isFromRegistry = !!data.__vspId;

  // Patient profile section with anchor
  const registryBadge = isFromRegistry
    ? el('span', { class: 'patient-profile--readonly-badge' }, '\u{1F512} From Registry')
    : null;
  const hpiHeader = el(
    'div',
    { class: 'section-panel__header' },
    [el('span', { class: 'section-panel__title' }, 'Patient Profile'), registryBadge].filter(
      Boolean,
    ),
  );
  const patientNameField = inputField({
    label: 'Full Name',
    value: data.patientName,
    onChange: isFromRegistry ? undefined : (v) => updateField('patientName', v),
    disabled: isFromRegistry,
    hint: isFromRegistry
      ? 'Sourced from patient registry'
      : 'Full patient name as documented for this case',
  });
  const patientBirthdayField = inputField({
    label: 'Date of Birth',
    type: 'date',
    value: data.patientBirthday,
    onChange: isFromRegistry ? undefined : (v) => updateField('patientBirthday', v),
    disabled: isFromRegistry,
    hint: isFromRegistry
      ? 'Sourced from patient registry'
      : "Use the date picker to select the patient's birth date",
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
    onChange: isFromRegistry ? undefined : (v) => updateField('patientGender', v),
    disabled: isFromRegistry,
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
    onChange: isFromRegistry ? undefined : (v) => updateField('patientGenderIdentityPronouns', v),
    disabled: isFromRegistry,
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
    onChange: isFromRegistry ? undefined : (v) => updateField('patientInterpreterNeeded', v),
    disabled: isFromRegistry,
  });
  const getBmiCategory = (bmi) => {
    const v = parseFloat(bmi);
    if (isNaN(v)) return null;
    if (v < 18.5) return { label: 'Underweight', modifier: 'underweight' };
    if (v < 25) return { label: 'Normal', modifier: 'normal' };
    if (v < 30) return { label: 'Overweight', modifier: 'overweight' };
    return { label: 'Obese', modifier: 'obese' };
  };

  // --- Migrate legacy data: compute cm/kg if only imperial values exist ---
  if (data.patientHeightFt && !data.patientHeightCm) {
    data.patientHeightCm = ftInToCm(data.patientHeightFt, data.patientHeightIn);
  }
  if (data.patientWeight && !data.patientWeightKg) {
    data.patientWeightKg = lbsToKg(data.patientWeight);
  }
  if (!data.patientMeasurementUnit) {
    data.patientMeasurementUnit = 'imperial';
  }

  let isMetric = data.patientMeasurementUnit === 'metric';

  const currentBmi = data.patientBmi || computeBMI(data.patientHeightCm, data.patientWeightKg);
  const bmiCategory = getBmiCategory(currentBmi);

  const bmiValueEl = el('span', { class: 'body-measurements__bmi-value' }, currentBmi || '—');
  const bmiBadgeEl = el(
    'span',
    {
      class:
        'body-measurements__bmi-badge' +
        (bmiCategory ? ` body-measurements__bmi-badge--${bmiCategory.modifier}` : ''),
    },
    bmiCategory ? bmiCategory.label : '',
  );

  const updateBmiDisplay = () => {
    const bmi = computeBMI(data.patientHeightCm, data.patientWeightKg);
    data.patientBmi = bmi;
    bmiValueEl.textContent = bmi || '—';
    const cat = getBmiCategory(bmi);
    bmiBadgeEl.textContent = cat ? cat.label : '';
    bmiBadgeEl.className =
      'body-measurements__bmi-badge' +
      (cat ? ` body-measurements__bmi-badge--${cat.modifier}` : '');
    onUpdate(data);
  };

  // Smart height input + unit toggle elements
  const heightInput = el('input', {
    class: 'body-measurements__input body-measurements__input--height',
    type: isMetric ? 'number' : 'text',
    inputmode: 'decimal',
    placeholder: isMetric ? 'cm' : '5\' 10"',
    value: isMetric
      ? data.patientHeightCm || ''
      : formatImperialHeight(data.patientHeightFt, data.patientHeightIn),
  });
  const heightUnitEl = el(
    'span',
    { class: 'body-measurements__unit' },
    isMetric ? 'cm' : 'ft / in',
  );

  heightInput.addEventListener('blur', () => {
    if (isMetric) {
      const cm = parseFloat(heightInput.value);
      data.patientHeightCm = isNaN(cm) || cm <= 0 ? '' : String(cm);
      const imp = cmToFtIn(data.patientHeightCm);
      data.patientHeightFt = imp.ft;
      data.patientHeightIn = imp.inch;
    } else {
      const parsed = parseImperialHeight(heightInput.value);
      data.patientHeightFt = parsed.ft;
      data.patientHeightIn = parsed.inch;
      heightInput.value = formatImperialHeight(parsed.ft, parsed.inch);
      data.patientHeightCm = ftInToCm(parsed.ft, parsed.inch);
    }
    // Keep legacy lbs in sync via kg
    data.patientWeight = data.patientWeightKg ? kgToLbs(data.patientWeightKg) : data.patientWeight;
    updateBmiDisplay();
  });

  const weightInput = el('input', {
    class: 'body-measurements__input body-measurements__input--weight',
    type: 'number',
    placeholder: isMetric ? 'kg' : 'lbs',
    value: isMetric ? data.patientWeightKg || '' : data.patientWeight || '',
    min: '0',
  });
  const weightUnitEl = el('span', { class: 'body-measurements__unit' }, isMetric ? 'kg' : 'lbs');

  weightInput.addEventListener('blur', () => {
    if (isMetric) {
      data.patientWeightKg = weightInput.value;
      data.patientWeight = kgToLbs(weightInput.value);
    } else {
      data.patientWeight = weightInput.value;
      data.patientWeightKg = lbsToKg(weightInput.value);
    }
    updateBmiDisplay();
  });

  // Toggle pill buttons
  const imperialBtn = el(
    'button',
    {
      type: 'button',
      class:
        'body-measurements__toggle-btn' +
        (isMetric ? '' : ' body-measurements__toggle-btn--active'),
    },
    'Imperial',
  );
  const metricBtn = el(
    'button',
    {
      type: 'button',
      class:
        'body-measurements__toggle-btn' +
        (isMetric ? ' body-measurements__toggle-btn--active' : ''),
    },
    'Metric',
  );

  const switchUnit = (toMetric) => {
    if (toMetric === isMetric) return;
    isMetric = toMetric;
    data.patientMeasurementUnit = isMetric ? 'metric' : 'imperial';

    imperialBtn.classList.toggle('body-measurements__toggle-btn--active', !isMetric);
    metricBtn.classList.toggle('body-measurements__toggle-btn--active', isMetric);

    if (isMetric) {
      heightInput.value = data.patientHeightCm || '';
      heightInput.placeholder = 'cm';
      heightInput.type = 'number';
      heightUnitEl.textContent = 'cm';
      weightInput.value = data.patientWeightKg || '';
      weightInput.placeholder = 'kg';
      weightUnitEl.textContent = 'kg';
    } else {
      heightInput.value = formatImperialHeight(data.patientHeightFt, data.patientHeightIn);
      heightInput.placeholder = '5\' 10"';
      heightInput.type = 'text';
      heightUnitEl.textContent = 'ft / in';
      weightInput.value = data.patientWeight || '';
      weightInput.placeholder = 'lbs';
      weightUnitEl.textContent = 'lbs';
    }
    onUpdate(data);
  };

  imperialBtn.addEventListener('click', () => switchUnit(false));
  metricBtn.addEventListener('click', () => switchUnit(true));

  const bodyMeasurementsStrip = el('div', { class: 'body-measurements' }, [
    el('div', { class: 'body-measurements__header' }, [
      el('span', { class: 'body-measurements__label' }, 'Body Measurements'),
      el('span', { class: 'body-measurements__toggle' }, [imperialBtn, metricBtn]),
    ]),
    el('div', { class: 'body-measurements__strip' }, [
      el('div', { class: 'body-measurements__group' }, [
        el('span', { class: 'body-measurements__group-label' }, 'Height'),
        heightInput,
        heightUnitEl,
      ]),
      el('div', { class: 'body-measurements__divider' }),
      el('div', { class: 'body-measurements__group' }, [
        el('span', { class: 'body-measurements__group-label' }, 'Weight'),
        weightInput,
        weightUnitEl,
      ]),
      el('div', { class: 'body-measurements__divider' }),
      el('div', { class: 'body-measurements__bmi' }, [
        el('span', { class: 'body-measurements__group-label' }, 'BMI'),
        bmiValueEl,
        bmiBadgeEl,
      ]),
    ]),
  ]);

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
      patientWorkStatusField,
      patientLivingSituationField,
      patientSocialSupportField,
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
