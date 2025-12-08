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

    // ICD-10 Codes anchor (title removed per request)
    const diagnosisSection = el('div', { id: 'diagnosis-codes', class: 'section-anchor' });
    section.append(diagnosisSection);

    // Initialize diagnosis codes array if not exists
    if (!Array.isArray(data.diagnosisCodes)) {
      data.diagnosisCodes = [];
    }

    // Add diagnosis code interface
    const diagnosisContainer = el('div', {
      class: 'billing-section-container',
      style: 'margin-top: 12px; margin-bottom: 24px;',
    });
    section.append(diagnosisContainer);

    // Function to render diagnosis codes
    function renderDiagnosisCodes() {
      diagnosisContainer.replaceChildren();

      if (data.diagnosisCodes.length === 0) {
        // Empty state handled by adding a row below
      }

      const table = el('table', {
        class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
      });
      const thead = el('thead', { class: 'combined-neuroscreen-thead' }, [
        el('tr', {}, [
          el('th', { class: 'combined-neuroscreen-th level-col' }, 'Diagnosis Codes (ICD-10)'),
          el('th', { class: 'combined-neuroscreen-th' }, 'Description'),
          el('th', { class: 'combined-neuroscreen-th action-col' }, 'Action'),
        ]),
      ]);
      table.appendChild(thead);

      const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

      data.diagnosisCodes.forEach((codeEntry, index) => {
        if (!codeEntry.code && !codeEntry.description) {
          const searchRow = createDiagnosisSearchRow(
            codeEntry,
            index,
            data,
            updateField,
            renderDiagnosisCodes,
          );
          tbody.appendChild(searchRow);
        } else {
          const codeRow = createDiagnosisCodeRow(
            codeEntry,
            index,
            data,
            updateField,
            renderDiagnosisCodes,
          );
          tbody.appendChild(codeRow);
        }
      });
      table.appendChild(tbody);
      diagnosisContainer.appendChild(table);

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

    // CPT Codes anchor (title removed per request)
    const cptSection = el('div', { id: 'cpt-codes', class: 'section-anchor' });
    section.append(cptSection);

    // Use shared CPT widget for Billing CPT Codes UI
    const cptWidget = createBillingCodesWidget(data, updateField);
    section.append(cptWidget.element);

    // Orders & Referrals anchor (title removed per request)
    if (!Array.isArray(data.ordersReferrals)) {
      data.ordersReferrals = [];
    }

    const ordersSection = el('div', { id: 'orders-referrals', class: 'section-anchor' });
    section.append(ordersSection);

    const ordersContainer = el('div', {
      class: 'billing-section-container',
      style: 'margin-bottom: 24px;',
    });
    section.append(ordersContainer);

    function renderOrdersReferrals() {
      ordersContainer.replaceChildren();

      const table = el('table', {
        class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
      });
      const thead = el('thead', { class: 'combined-neuroscreen-thead' }, [
        el('tr', {}, [
          el('th', { class: 'combined-neuroscreen-th level-col' }, 'Orders & Referrals'),
          el('th', { class: 'combined-neuroscreen-th' }, 'Details'),
          el('th', { class: 'combined-neuroscreen-th action-col' }, 'Action'),
        ]),
      ]);
      table.appendChild(thead);

      const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

      data.ordersReferrals.forEach((entry, index) => {
        const row = createOrderReferralRow(entry, index, data, updateField, renderOrdersReferrals);
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      ordersContainer.appendChild(table);

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

    const table = el('table', {
      class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
    });

    // Header
    const thead = el('thead', { class: 'combined-neuroscreen-thead' }, [
      el('tr', {}, [
        el('th', { class: 'combined-neuroscreen-th level-col' }, 'CPT Codes'),
        el('th', { class: 'combined-neuroscreen-th' }, 'Units'),
        el('th', { class: 'combined-neuroscreen-th' }, 'Time Spent'),
        el('th', { class: 'combined-neuroscreen-th action-col' }, 'Action'),
      ]),
    ]);
    table.appendChild(thead);

    const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

    data.billingCodes.forEach((codeEntry, index) => {
      const codeRow = createBillingCodeRow(codeEntry, index, data, updateField, render);
      tbody.appendChild(codeRow);
    });

    table.appendChild(tbody);
    container.appendChild(table);

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
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // ICD-10 Code display only
  const codeCell = el('td', { class: 'combined-neuroscreen-td level-col' });
  codeCell.textContent = codeEntry.label || codeEntry.code || '';
  row.appendChild(codeCell);

  // Description (Read-only or auto-filled)
  const descCell = el('td', { class: 'combined-neuroscreen-td combined-neuroscreen-td--left' });
  descCell.textContent = codeEntry.description || '';
  row.appendChild(descCell);

  // Action (Remove button)
  const actionCell = el('td', { class: 'combined-neuroscreen-td' });
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
    actionCell.appendChild(removeButton);
  }
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates a search row for adding new diagnosis codes
 */
function createDiagnosisSearchRow(codeEntry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // Search Cell (spans 2 columns)
  const searchCell = el('td', {
    class: 'combined-neuroscreen-td level-col',
    colspan: '2',
    style: 'position: relative; overflow: visible;',
  });

  const searchInput = el('input', {
    type: 'text',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    placeholder: 'Search ICD-10 code or description…',
    style: 'width: 100%;',
    autofocus: true,
  });

  // Results list container
  const resultsList = el('div', {
    class: 'billing-search-results',
    style:
      'position: absolute; top: calc(100% + 2px); left: 0; width: 100%; border: 1px solid var(--color-border); border-radius: 0 0 8px 8px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.16); max-height: 260px; display: none; background: white; z-index: 100;',
  });

  let highlightIndex = -1;
  let currentResults = [];

  const codes = getPTICD10Codes().map((opt) => ({
    ...opt,
    _norm: normalizeOption(opt),
  }));

  const renderResults = () => {
    resultsList.replaceChildren();
    if (!currentResults.length) {
      resultsList.style.display = 'none';
      return;
    }
    resultsList.style.display = 'block';
    currentResults.forEach((item, idx) => {
      const { code, desc, friendlyLabel } = item._norm || {};
      const rightText = desc && desc.toLowerCase() !== friendlyLabel?.toLowerCase() ? desc : '';

      const resultRow = el(
        'div',
        {
          class: 'billing-search-result-row',
          style:
            'padding: 0.45rem 0.65rem; display:flex; justify-content:space-between; align-items:flex-start; gap: 0.65rem; cursor:pointer; font-size: 0.95rem; background: ' +
            (idx === highlightIndex ? 'rgba(0,154,68,0.12);' : 'white;'),
          onmouseenter: () => {
            highlightIndex = idx;
            Array.from(resultsList.children).forEach((child, cIdx) => {
              child.style.background = cIdx === idx ? 'rgba(0,154,68,0.12)' : 'white';
            });
          },
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            applySelection(item);
          },
        },
        [
          el(
            'div',
            { style: 'font-weight:600; min-width: 9rem;' },
            friendlyLabel || code || item.label || item.value,
          ),
          el(
            'div',
            { style: 'flex:1; color: var(--text-muted); text-align:left;' },
            rightText || '',
          ),
        ],
      );
      resultsList.appendChild(resultRow);
    });
  };

  const performSearch = () => {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      currentResults = [];
      renderResults();
      return;
    }
    currentResults = codes
      .map((item) => ({ ...item, _score: scoreOption(item, q) }))
      .filter((i) => i._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 10);
    highlightIndex = currentResults.length ? 0 : -1;
    renderResults();
  };

  const applySelection = (item) => {
    if (!item) return;
    // Update the current entry
    data.diagnosisCodes[index] = {
      code: item.value,
      description: item.description,
      label: item.label,
      isPrimary: index === 0,
    };
    updateField('diagnosisCodes', data.diagnosisCodes);
    renderCallback();
  };

  const commitSelection = () => {
    if (currentResults.length) {
      const choice = currentResults[highlightIndex >= 0 ? highlightIndex : 0];
      applySelection(choice);
    }
  };

  searchInput.addEventListener('input', () => performSearch());
  searchInput.addEventListener('keydown', (e) => {
    if (!currentResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = (highlightIndex + 1) % currentResults.length;
      renderResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = (highlightIndex - 1 + currentResults.length) % currentResults.length;
      renderResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection();
    }
  });

  searchCell.append(searchInput, resultsList);
  row.appendChild(searchCell);

  // Action (Remove button)
  const actionCell = el('td', { class: 'combined-neuroscreen-td' });
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      onclick: () => {
        data.diagnosisCodes.splice(index, 1);
        updateField('diagnosisCodes', data.diagnosisCodes);
        renderCallback();
      },
    },
    '×',
  );
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates a single Orders/Referrals row
 */
function createOrderReferralRow(entry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // Type select
  const typeSelect = createCustomSelect({
    options: [
      { value: '', label: 'Select type...' },
      { value: 'referral', label: 'Referral' },
      { value: 'order', label: 'Order/Prescription' },
      { value: 'consult', label: 'Consult' },
    ],
    value: entry.type || '',
    className: 'combined-neuroscreen__input',
    onChange: (newValue) => {
      data.ordersReferrals[index].type = newValue;
      updateField('ordersReferrals', data.ordersReferrals);
    },
  }).element;

  const typeCell = el('td', { class: 'combined-neuroscreen-td level-col' });
  typeCell.appendChild(typeSelect);
  row.appendChild(typeCell);

  // Details input
  const detailsInput = el('input', {
    type: 'text',
    value: entry.details || '',
    placeholder: 'Order/referral details or notes',
    class: 'combined-neuroscreen__input combined-neuroscreen__input--left',
    onblur: (e) => {
      data.ordersReferrals[index].details = e.target.value;
      updateField('ordersReferrals', data.ordersReferrals);
    },
  });
  const detailsCell = el('td', { class: 'combined-neuroscreen-td' });
  detailsCell.appendChild(detailsInput);
  row.appendChild(detailsCell);

  // Remove button
  const actionCell = el('td', { class: 'combined-neuroscreen-td' });
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
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates a single billing code row with CPT selection and units
 */
function createBillingCodeRow(codeEntry, index, data, updateField, renderCallback) {
  const row = el('tr', { class: 'combined-neuroscreen-row' });

  // CPT Code Selection
  const codeSelect = createCustomSelect({
    options: getPTCPTCodes().map((option) => ({
      value: option.value,
      label: option.label,
    })),
    value: codeEntry.code || '',
    className: 'combined-neuroscreen__input',
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

  const codeCell = el('td', { class: 'combined-neuroscreen-td level-col' });
  codeCell.appendChild(codeSelect);
  row.appendChild(codeCell);

  // Units input (for time-based codes)
  const unitsInput = el('input', {
    type: 'number',
    value: codeEntry.units || 1,
    min: 1,
    max: 8,
    class: 'combined-neuroscreen__input',
    onblur: (e) => {
      data.billingCodes[index].units = parseInt(e.target.value) || 1;
      updateField('billingCodes', data.billingCodes);
    },
  });
  const unitsCell = el('td', { class: 'combined-neuroscreen-td' });
  unitsCell.appendChild(unitsInput);
  row.appendChild(unitsCell);

  // Time spent input
  const timeInput = el('input', {
    type: 'text',
    value: codeEntry.timeSpent || '',
    placeholder: '30 minutes',
    class: 'combined-neuroscreen__input',
    onblur: (e) => {
      data.billingCodes[index].timeSpent = e.target.value;
      updateField('billingCodes', data.billingCodes);
    },
  });
  const timeCell = el('td', { class: 'combined-neuroscreen-td' });
  timeCell.appendChild(timeInput);
  row.appendChild(timeCell);

  // Remove button
  const removeButton = el(
    'button',
    {
      type: 'button',
      class: 'remove-btn',
      title: 'Remove',
      onclick: () => {
        data.billingCodes.splice(index, 1);
        updateField('billingCodes', data.billingCodes);
        renderCallback();
      },
    },
    '×',
  );
  const actionCell = el('td', { class: 'combined-neuroscreen-td combined-neuroscreen-td--center' });
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

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

// Helper: Normalize code/description
function normalizeOption(opt) {
  const rawCode = (opt?.value || '').trim();
  const rawLabel = (opt?.label || '').trim();
  const rawDesc = (opt?.description || '').trim();
  let code = rawCode;
  let descFromLabel = '';
  const m = rawLabel.match(/^([A-Z0-9.]+)\s*[-–—:]\s*(.+)$/i);
  if (m) {
    if (!code) code = m[1];
    descFromLabel = m[2].trim();
  }
  const desc = rawDesc || descFromLabel;
  const friendlyLabel = desc ? desc : rawLabel || code;
  return { code, desc, friendlyLabel };
}

// Helper: Score match
function scoreOption(item, q) {
  const norm = item._norm || normalizeOption(item);
  const code = (norm.code || item.value || '').toLowerCase();
  const desc = (norm.desc || item.description || '').toLowerCase();
  const label = (norm.friendlyLabel || item.label || '').toLowerCase();
  if (code === q) return 100;
  if (code.startsWith(q)) return 90;
  if (label.startsWith(q)) return 80;
  if (desc.startsWith(q)) return 75;
  if (code.includes(q)) return 60;
  if (label.includes(q)) return 55;
  if (desc.includes(q)) return 50;
  return 0;
}

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
