// BillingSection.js - PT-Specific Billing and CPT Codes
// Common physical therapy billing codes with time-based unit tracking

import { el } from '../../../ui/utils.js';
import { createCustomSelect } from '../../../ui/CustomSelect.js';

/**
 * PT Billing Component - Professional billing with CPT codes
 */
export const PTBilling = {
  /**
   * Creates comprehensive PT billing section
   * @param {Object} data - Current billing data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} PT billing section
   */
  create(data, updateField) {
    const section = el('div', {
      id: 'pt-billing',
      class: 'billing-section',
    });

    // ICD-10 Codes subsection anchor + title
    const diagnosisSection = el('div', { id: 'diagnosis-codes', class: 'section-anchor' }, [
      el('h4', { class: 'subsection-title' }, 'Diagnosis Codes (ICD-10)'),
    ]);
    section.append(diagnosisSection);

    // Initialize diagnosis codes array if not exists
    if (!Array.isArray(data.diagnosisCodes)) {
      data.diagnosisCodes = [];
    }

    // Add diagnosis code interface
    const diagnosisContainer = el('div', {
      class: 'billing-section-container',
      style: 'margin-bottom: 24px;',
    });
    section.append(diagnosisContainer);

    // Function to render diagnosis codes
    function renderDiagnosisCodes() {
      diagnosisContainer.replaceChildren();
      // No header here; the subsection title above already communicates context

      data.diagnosisCodes.forEach((codeEntry, index) => {
        const codeRow = createDiagnosisCodeRow(
          codeEntry,
          index,
          data,
          updateField,
          renderDiagnosisCodes,
        );
        diagnosisContainer.append(codeRow);
      });

      // Add compact + button
      const addButton = el(
        'div',
        {
          class: 'compact-add-btn',
          title: 'Add Diagnosis Code',
          onclick: () => {
            data.diagnosisCodes.push({
              code: '',
              description: '',
              label: '',
              isPrimary: data.diagnosisCodes.length === 0,
            });
            updateField('diagnosisCodes', data.diagnosisCodes);
            renderDiagnosisCodes();
          },
        },
        '+',
      );

      diagnosisContainer.append(addButton);
    }

    // Initial render - start with empty state
    renderDiagnosisCodes();

    // Initialize billing codes array if not exists
    if (!Array.isArray(data.billingCodes)) {
      data.billingCodes = [];
    }

    // CPT Codes subsection anchor + title
    const cptSection = el('div', { id: 'cpt-codes', class: 'section-anchor' }, [
      el('h4', { class: 'subsection-title' }, 'CPT Codes'),
    ]);
    section.append(cptSection);

    // Use shared CPT widget for Billing CPT Codes UI
    const cptWidget = createBillingCodesWidget(data, updateField);
    section.append(cptWidget.element);

    // Orders & Referrals subsection anchor + title
    if (!Array.isArray(data.ordersReferrals)) {
      data.ordersReferrals = [];
    }

    const ordersSection = el('div', { id: 'orders-referrals', class: 'section-anchor' }, [
      el('h4', { class: 'subsection-title' }, 'Orders & Referrals'),
    ]);
    section.append(ordersSection);

    const ordersContainer = el('div', {
      class: 'billing-section-container',
      style: 'margin-bottom: 24px;',
    });
    section.append(ordersContainer);

    function renderOrdersReferrals() {
      ordersContainer.replaceChildren();

      if (data.ordersReferrals.length > 0) {
        const header = el(
          'div',
          {
            class: 'codes-header',
            style: `
            display: grid;
    grid-template-columns: 140px 1fr 60px;
            gap: 12px;
            padding: var(--space-2) 0 var(--space-2) 0;
            margin: 16px 0 var(--space-3);
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
            text-transform: capitalize;
            letter-spacing: 0.3px;
            border-bottom: 3px solid var(--und-green);
          `,
          },
          [el('div', {}, 'Type'), el('div', {}, 'Details')],
        );
        ordersContainer.append(header);
      }

      data.ordersReferrals.forEach((entry, index) => {
        const row = createOrderReferralRow(entry, index, data, updateField, renderOrdersReferrals);
        ordersContainer.append(row);
      });

      const addButton = el(
        'div',
        {
          class: 'compact-add-btn',
          title: 'Add Order/Referral',
          onclick: () => {
            data.ordersReferrals.push({ type: '', details: '' });
            updateField('ordersReferrals', data.ordersReferrals);
            renderOrdersReferrals();
          },
        },
        '+',
      );

      ordersContainer.append(addButton);
    }

    renderOrdersReferrals();

    return section;
  },
};

/**
 * Reusable widget: CPT Billing Codes list with header, rows, and compact add button
 * Returns an object with element and a refresh method
 * @param {Object} data - billing data object containing billingCodes array
 * @param {Function} updateField - updater for billing fields, e.g., (field, value) => {}
 */
export function createBillingCodesWidget(data, updateField) {
  // Ensure array exists
  if (!Array.isArray(data.billingCodes)) data.billingCodes = [];

  const container = el('div', {
    class: 'billing-section-container',
    style: 'margin-bottom: 24px;',
  });

  function render() {
    container.replaceChildren();

    // Header when there are rows
    if (data.billingCodes.length > 0) {
      const header = el(
        'div',
        {
          class: 'codes-header',
          style: `
          display: grid;
          grid-template-columns: 2fr 80px 120px 60px;
          gap: 12px;
          padding: var(--space-2) 0 var(--space-2) 0;
          margin: 16px 0 var(--space-3);
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          text-transform: capitalize;
          letter-spacing: 0.3px;
          border-bottom: 3px solid var(--und-green);
        `,
        },
        [el('div', {}, 'Treatment Code'), el('div', {}, 'Units'), el('div', {}, 'Time Spent')],
      );
      container.append(header);
    }

    data.billingCodes.forEach((codeEntry, index) => {
      const codeRow = createBillingCodeRow(codeEntry, index, data, updateField, render);
      container.append(codeRow);
    });

    const addButton = el(
      'div',
      {
        class: 'compact-add-btn',
        title: 'Add Treatment Code',
        onclick: () => {
          data.billingCodes.push({ code: '', units: 1, description: '', label: '', timeSpent: '' });
          updateField('billingCodes', data.billingCodes);
          render();
        },
      },
      '+',
    );
    container.append(addButton);
  }

  render();
  return { element: container, refresh: render };
}

/**
 * Creates comprehensive PT billing section
 * @param {Object} billingData - Current billing data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete billing section
 */
export function createBillingSection(billingData, onUpdate) {
  const section = el('div', {
    class: 'billing-section',
    id: 'billing-section',
  });

  // Billing data should always be an object
  const data = billingData || {};

  // Initialize comprehensive data structure with default placeholder rows
  const defaultData = {
    diagnosisCodes: [{ code: '', description: '', isPrimary: true }],
    billingCodes: [{ code: '', units: '', timeSpent: '' }],
    ordersReferrals: [{ type: '', details: '' }],
  };

  // Merge with existing data, but ensure arrays are properly initialized
  const finalData = {
    ...defaultData,
    ...data,
    diagnosisCodes:
      Array.isArray(data?.diagnosisCodes) && data.diagnosisCodes.length > 0
        ? data.diagnosisCodes
        : defaultData.diagnosisCodes,
    billingCodes:
      Array.isArray(data?.billingCodes) && data.billingCodes.length > 0
        ? data.billingCodes
        : defaultData.billingCodes,
    ordersReferrals:
      Array.isArray(data?.ordersReferrals) && data.ordersReferrals.length > 0
        ? data.ordersReferrals
        : defaultData.ordersReferrals,
  };

  // Update helper
  const updateField = (field, value) => {
    finalData[field] = value;
    onUpdate(finalData);
  };

  // Create billing interface via PTBilling component
  section.append(PTBilling.create(finalData, updateField));

  return section;
}

/**
 * Creates a single diagnosis code row with ICD-10 selection
 */
function createDiagnosisCodeRow(codeEntry, index, data, updateField, renderCallback) {
  const row = el('div', {
    class: 'code-row diagnosis-row',
    style: `
      display: grid;
      grid-template-columns: 1fr 60px;
      gap: 12px;
      padding: 4px 0;
      align-items: center;
      transition: background-color 0.15s ease;
    `,
  });

  // Add hover effect
  row.onmouseover = () => (row.style.background = 'rgba(249, 250, 251, 0.8)');
  row.onmouseout = () => (row.style.background = 'transparent');

  // ICD-10 Code Selection with inline label
  const codeContainer = el('div', { style: 'position: relative;' });
  const codeSelect = createCustomSelect({
    options: getPTICD10Codes().map((option) => ({
      value: option.value,
      label: option.label,
    })),
    value: codeEntry.code || '',
    className: 'billing-code-select',
    onChange: (newValue) => {
      data.diagnosisCodes[index].code = newValue;
      // Update both description and label based on selected code
      const selectedOption = getPTICD10Codes().find((opt) => opt.value === newValue);
      if (selectedOption) {
        data.diagnosisCodes[index].description = selectedOption.description;
        data.diagnosisCodes[index].label = selectedOption.label;
      } else {
        data.diagnosisCodes[index].description = '';
        data.diagnosisCodes[index].label = '';
      }
      updateField('diagnosisCodes', data.diagnosisCodes);
    },
  }).element;

  codeContainer.append(codeSelect);

  // Remove button (only show for non-primary or if multiple codes exist)
  let actionContainer = el('div', { style: 'display: flex; justify-content: center;' });
  if (!codeEntry.isPrimary || data.diagnosisCodes.length > 1) {
    const removeButton = el(
      'button',
      {
        type: 'button',
        class: 'remove-btn',
        onclick: () => {
          data.diagnosisCodes.splice(index, 1);
          // If we removed the primary, make the first remaining code primary
          if (codeEntry.isPrimary && data.diagnosisCodes.length > 0) {
            data.diagnosisCodes[0].isPrimary = true;
          }
          updateField('diagnosisCodes', data.diagnosisCodes);
          renderCallback();
        },
      },
      '×',
    );
    actionContainer.append(removeButton);
  }

  row.append(codeContainer, actionContainer);

  return row;
}

/**
 * Creates a single Orders/Referrals row
 */
function createOrderReferralRow(entry, index, data, updateField, renderCallback) {
  const row = el('div', {
    class: 'code-row orders-referrals-row',
    style: `
      display: grid;
  grid-template-columns: 140px 1fr 60px;
      gap: 12px;
      padding: 4px 0;
      align-items: center;
      transition: background-color 0.15s ease;
    `,
  });

  row.onmouseover = () => (row.style.background = 'rgba(249, 250, 251, 0.8)');
  row.onmouseout = () => (row.style.background = 'transparent');

  // Type select
  const typeSelect = createCustomSelect({
    options: [
      { value: '', label: 'Select type...' },
      { value: 'referral', label: 'Referral' },
      { value: 'order', label: 'Order/Prescription' },
      { value: 'consult', label: 'Consult' },
    ],
    value: entry.type || '',
    className: 'order-type-select',
    onChange: (newValue) => {
      data.ordersReferrals[index].type = newValue;
      updateField('ordersReferrals', data.ordersReferrals);
    },
  }).element;

  // Details input
  const detailsInput = el('input', {
    type: 'text',
    value: entry.details || '',
    placeholder: 'Order/referral details or notes',
    style: `
      width: 100%;
      padding: 4px 8px;
      border: 1px solid var(--input-border);
      border-radius: 4px;
      font-size: 14px;
      background: var(--input-bg);
      color: var(--text);
    `,
    onblur: (e) => {
      data.ordersReferrals[index].details = e.target.value;
      updateField('ordersReferrals', data.ordersReferrals);
    },
  });

  // Remove button
  const actionContainer = el('div', { style: 'display: flex; justify-content: center;' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.ordersReferrals.splice(index, 1);
        updateField('ordersReferrals', data.ordersReferrals);
        renderCallback();
      },
    },
    '×',
  );
  actionContainer.append(removeButton);

  row.append(typeSelect, detailsInput, actionContainer);
  return row;
}

/**
 * Creates a single billing code row with CPT selection and units
 */
function createBillingCodeRow(codeEntry, index, data, updateField, renderCallback) {
  const row = el('div', {
    class: 'code-row billing-row',
    style: `
      display: grid;
      grid-template-columns: 2fr 80px 120px 60px;
      gap: 12px;
      padding: 4px 0;
      align-items: center;
      transition: background-color 0.15s ease;
    `,
  });

  // Add hover effect
  row.onmouseover = () => (row.style.background = 'var(--und-green-light)');
  row.onmouseout = () => (row.style.background = 'transparent');

  // CPT Code Selection
  const codeSelect = createCustomSelect({
    options: getPTCPTCodes().map((option) => ({
      value: option.value,
      label: option.label,
    })),
    value: codeEntry.code || '',
    className: 'editable-table__select billing-cpt-select',
    onChange: (newValue) => {
      data.billingCodes[index].code = newValue;
      // Update both description and label based on selected code
      const selectedOption = getPTCPTCodes().find((opt) => opt.value === newValue);
      if (selectedOption) {
        data.billingCodes[index].description = selectedOption.description;
        data.billingCodes[index].label = selectedOption.label;
      } else {
        data.billingCodes[index].description = '';
        data.billingCodes[index].label = '';
      }
      updateField('billingCodes', data.billingCodes);
      renderCallback();
    },
  }).element;

  // Units input (for time-based codes)
  const unitsInput = el('input', {
    type: 'number',
    value: codeEntry.units || 1,
    min: 1,
    max: 8,
    class: 'editable-table__input',
    style: 'width: 100%; text-align: center;',
    onblur: (e) => {
      data.billingCodes[index].units = parseInt(e.target.value) || 1;
      updateField('billingCodes', data.billingCodes);
    },
  });

  // Time spent input
  const timeInput = el('input', {
    type: 'text',
    value: codeEntry.timeSpent || '',
    placeholder: '30 minutes',
    class: 'editable-table__input',
    style: 'width: 100%;',
    onblur: (e) => {
      data.billingCodes[index].timeSpent = e.target.value;
      updateField('billingCodes', data.billingCodes);
    },
  });

  // Remove button
  const actionContainer = el('div', { style: 'display: flex; justify-content: center;' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.billingCodes.splice(index, 1);
        updateField('billingCodes', data.billingCodes);
        renderCallback();
      },
    },
    '×',
  );

  actionContainer.append(removeButton);
  row.append(codeSelect, unitsInput, timeInput, actionContainer);

  return row;
}

/**
 * Top 25 PT CPT codes used in practice
 */
function getPTCPTCodes() {
  return [
    { value: '', label: 'Select CPT Code...', description: '' },

    // Time-Based Codes (Most Common)
    {
      value: '97110',
      label: '97110 - Therapeutic Exercise',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; therapeutic exercises to develop strength and endurance, range of motion and flexibility',
    },
    {
      value: '97112',
      label: '97112 - Neuromuscular Re-education',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; neuromuscular reeducation of movement, balance, coordination, kinesthetic sense, posture, and/or proprioception',
    },
    {
      value: '97116',
      label: '97116 - Gait Training',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; gait training (includes stair climbing)',
    },
    {
      value: '97140',
      label: '97140 - Manual Therapy',
      description:
        'Manual therapy techniques (eg, mobilization/manipulation, manual lymphatic drainage, manual traction), 1 or more regions, each 15 minutes',
    },
    {
      value: '97530',
      label: '97530 - Therapeutic Activities',
      description:
        'Therapeutic activities, direct (one-on-one) patient contact (use of dynamic activities to improve functional performance), each 15 minutes',
    },
    {
      value: '97535',
      label: '97535 - Self-Care Training',
      description:
        'Self-care/home management training (eg, activities of daily living (ADL) and compensatory training, meal preparation, safety procedures, and instructions in use of assistive technology devices/adaptive equipment) direct one-on-one contact, each 15 minutes',
    },

    // Modality Codes (Time-Based)
    {
      value: '97012',
      label: '97012 - Mechanical Traction',
      description: 'Application of a modality to 1 or more areas; traction, mechanical',
    },
    {
      value: '97014',
      label: '97014 - Electrical Stimulation',
      description:
        'Application of a modality to 1 or more areas; electrical stimulation (unattended)',
    },
    {
      value: '97035',
      label: '97035 - Ultrasound',
      description: 'Application of a modality to 1 or more areas; ultrasound, each 15 minutes',
    },
    {
      value: '97039',
      label: '97039 - Unlisted Modality',
      description: 'Unlisted modality (specify type and time if constant attendance)',
    },

    // Evaluation Codes (Non-Time Based)
    {
      value: '97161',
      label: '97161 - PT Evaluation Low Complexity',
      description:
        'Physical therapy evaluation: low complexity, requiring these components: A history with no personal factors and/or comorbidities that impact the plan of care; An examination of body system(s) using standardized tests and measures addressing 1-2 elements from any of the following: body structures and functions, activity limitations, and/or participation restrictions; A clinical presentation with stable and/or uncomplicated characteristics; and Clinical decision making of low complexity using standardized patient assessment instrument and/or measurable assessment of functional outcome. Typically 20 minutes are spent face-to-face with the patient and/or family.',
    },
    {
      value: '97162',
      label: '97162 - PT Evaluation Moderate Complexity',
      description:
        'Physical therapy evaluation: moderate complexity, requiring these components: A history of present problem with 1-2 personal factors and/or comorbidities that impact the plan of care; An examination of body systems using standardized tests and measures in addressing a total of 3 or more elements from any of the following: body structures and functions, activity limitations, and/or participation restrictions; An evolving clinical presentation with changing characteristics; and Clinical decision making of moderate complexity using standardized patient assessment instrument and/or measurable assessment of functional outcome. Typically 30 minutes are spent face-to-face with the patient and/or family.',
    },
    {
      value: '97163',
      label: '97163 - PT Evaluation High Complexity',
      description:
        'Physical therapy evaluation: high complexity, requiring these components: A history of present problem with 3 or more personal factors and/or comorbidities that impact the plan of care; An examination of body systems using standardized tests and measures addressing a total of 4 or more elements from any of the following: body structures and functions, activity limitations, and/or participation restrictions; A clinical presentation with unstable and unpredictable characteristics; and Clinical decision making of high complexity using standardized patient assessment instrument and/or measurable assessment of functional outcome. Typically 45 minutes are spent face-to-face with the patient and/or family.',
    },
    {
      value: '97164',
      label: '97164 - PT Re-evaluation',
      description:
        'Re-evaluation of physical therapy established plan of care, requiring these components: An examination including a review of history and use of standardized tests and measures is required; and Revised plan of care using a standardized patient assessment instrument and/or measurable assessment of functional outcome Typically 20 minutes are spent face-to-face with the patient and/or family.',
    },

    // Additional Common Codes
    {
      value: '97010',
      label: '97010 - Hot/Cold Packs',
      description: 'Application of a modality to 1 or more areas; hot or cold packs',
    },
    {
      value: '97018',
      label: '97018 - Paraffin Bath',
      description: 'Application of a modality to 1 or more areas; paraffin bath',
    },
    {
      value: '97022',
      label: '97022 - Whirlpool',
      description: 'Application of a modality to 1 or more areas; whirlpool',
    },
    {
      value: '97032',
      label: '97032 - Electrical Stimulation (Manual)',
      description:
        'Application of a modality to 1 or more areas; electrical stimulation (manual), each 15 minutes',
    },
    {
      value: '97033',
      label: '97033 - Iontophoresis',
      description: 'Application of a modality to 1 or more areas; iontophoresis, each 15 minutes',
    },
    {
      value: '97034',
      label: '97034 - Contrast Baths',
      description: 'Application of a modality to 1 or more areas; contrast baths, each 15 minutes',
    },
    {
      value: '97113',
      label: '97113 - Aquatic Therapy',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; aquatic therapy with therapeutic exercises',
    },
    {
      value: '97124',
      label: '97124 - Massage',
      description:
        'Therapeutic procedure, 1 or more areas, each 15 minutes; massage, including effleurage, petrissage and/or tapotement (stroking, compression, percussion)',
    },
    {
      value: '97150',
      label: '97150 - Group Therapy',
      description:
        'Therapeutic procedure(s), group (2 or more individuals). Group therapy procedures involve constant attendance of the physician or other qualified health care professional (ie, therapist), but by definition do not require one-on-one patient contact by the same physician or other qualified health care professional.',
    },
    {
      value: '97542',
      label: '97542 - Wheelchair Management Training',
      description: 'Wheelchair management (eg, assessment, fitting, training), each 15 minutes',
    },
    {
      value: '97750',
      label: '97750 - Physical Performance Test',
      description:
        'Physical performance test or measurement (eg, musculoskeletal, functional capacity), with written report, each 15 minutes',
    },
    {
      value: '97755',
      label: '97755 - Assistive Technology Assessment',
      description:
        'Assistive technology assessment (eg, to restore, augment or compensate for existing function, optimize functional tasks and/or maximize environmental accessibility), direct one-on-one contact, with written report, each 15 minutes',
    },
  ];
}

/**
 * Determines if a CPT code is time-based (requires units)
 */
// function isTimeBasedCode(code) {
//   const timeBasedCodes = [
//     '97110',
//     '97112',
//     '97116',
//     '97140',
//     '97530',
//     '97535',
//     '97032',
//     '97033',
//     '97034',
//     '97035',
//     '97113',
//     '97124',
//     '97542',
//     '97750',
//     '97755',
//   ];
//   return timeBasedCodes.includes(code);
// }

/**
 * Top 25 ICD-10 diagnosis codes commonly used in Physical Therapy
 */
function getPTICD10Codes() {
  return [
    { value: '', label: 'Select ICD-10 Code...', description: '' },

    // Low Back Pain (Most Common)
    { value: 'M54.5', label: 'M54.5 - Low back pain', description: 'Low back pain, unspecified' },
    {
      value: 'M51.36',
      label: 'M51.36 - Other intervertebral disc degeneration, lumbar region',
      description: 'Disc degeneration in lumbar spine',
    },
    {
      value: 'M54.16',
      label: 'M54.16 - Radiculopathy, lumbar region',
      description: 'Nerve root compression in lumbar spine',
    },

    // Neck Pain
    { value: 'M54.2', label: 'M54.2 - Cervicalgia', description: 'Neck pain, unspecified' },
    {
      value: 'M50.30',
      label: 'M50.30 - Other cervical disc degeneration, unspecified cervical region',
      description: 'Cervical disc degeneration',
    },
    {
      value: 'M54.12',
      label: 'M54.12 - Radiculopathy, cervical region',
      description: 'Nerve root compression in cervical spine',
    },

    // Shoulder Conditions
    {
      value: 'M75.41',
      label: 'M75.41 - Impingement syndrome of right shoulder',
      description: 'Impingement syndrome, right shoulder',
    },
    {
      value: 'M75.21',
      label: 'M75.21 - Bicipital tendinitis, right shoulder',
      description: 'Bicipital tendinitis, right shoulder',
    },
    {
      value: 'M25.511',
      label: 'M25.511 - Pain in right shoulder',
      description: 'Right shoulder pain, unspecified cause',
    },
    {
      value: 'M25.512',
      label: 'M25.512 - Pain in left shoulder',
      description: 'Left shoulder pain, unspecified cause',
    },
    {
      value: 'M75.30',
      label: 'M75.30 - Calcific tendinitis of unspecified shoulder',
      description: 'Calcific deposits in shoulder tendons',
    },
    {
      value: 'M75.100',
      label:
        'M75.100 - Unspecified rotator cuff tear or rupture of unspecified shoulder, not specified as traumatic',
      description: 'Rotator cuff pathology',
    },

    // Knee Conditions
    {
      value: 'M25.561',
      label: 'M25.561 - Pain in right knee',
      description: 'Right knee pain, unspecified cause',
    },
    {
      value: 'M25.562',
      label: 'M25.562 - Pain in left knee',
      description: 'Left knee pain, unspecified cause',
    },
    {
      value: 'M17.10',
      label: 'M17.10 - Unilateral primary osteoarthritis, unspecified knee',
      description: 'Knee osteoarthritis, one side',
    },
    {
      value: 'S83.511A',
      label: 'S83.511A - Sprain of anterior cruciate ligament of right knee, initial encounter',
      description: 'ACL injury, right knee, first treatment',
    },

    // Hip Conditions
    {
      value: 'M25.551',
      label: 'M25.551 - Pain in right hip',
      description: 'Right hip pain, unspecified cause',
    },
    {
      value: 'M25.552',
      label: 'M25.552 - Pain in left hip',
      description: 'Left hip pain, unspecified cause',
    },
    {
      value: 'M16.10',
      label: 'M16.10 - Unilateral primary osteoarthritis, unspecified hip',
      description: 'Hip osteoarthritis, one side',
    },

    // General Musculoskeletal
    {
      value: 'M79.3',
      label: 'M79.3 - Panniculitis, unspecified',
      description: 'Inflammation of subcutaneous fat tissue',
    },
    {
      value: 'M62.81',
      label: 'M62.81 - Muscle weakness (generalized)',
      description: 'Generalized muscle weakness',
    },
    {
      value: 'M25.50',
      label: 'M25.50 - Pain in unspecified joint',
      description: 'Joint pain, location not specified',
    },

    // Ankle/Foot Conditions
    {
      value: 'M25.571',
      label: 'M25.571 - Pain in right ankle and joints of right foot',
      description: 'Right ankle/foot pain',
    },
    {
      value: 'M25.572',
      label: 'M25.572 - Pain in left ankle and joints of left foot',
      description: 'Left ankle/foot pain',
    },
    {
      value: 'S93.401A',
      label: 'S93.401A - Sprain of unspecified ligament of right ankle, initial encounter',
      description: 'Right ankle sprain, first treatment',
    },

    // Balance and Gait
    {
      value: 'R26.81',
      label: 'R26.81 - Unsteadiness on feet',
      description: 'Balance impairment, unsteadiness',
    },
    {
      value: 'R26.2',
      label: 'R26.2 - Difficulty in walking, not elsewhere classified',
      description: 'Walking difficulty, gait dysfunction',
    },
  ];
}
