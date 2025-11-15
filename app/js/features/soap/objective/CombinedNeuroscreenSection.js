/**
 * Combined Neuroscreen Section Module
 * Streamlined table for neurological screening with dermatomes, myotomes, and reflexes
 */
import { el } from '../../../ui/utils.js';
import { createCustomSelect } from '../../../ui/CustomSelect.js';

/**
 * @typedef {Object} NeuroscreenItem
 * @property {string} level - Spinal level (e.g., 'L4', 'C5', 'CN III')
 * @property {string} [reflex] - Reflex name if applicable
 */

/**
 * @typedef {Object} RegionData
 * @property {string} name - Region display name
 * @property {NeuroscreenItem[]} items - Array of neurological level items
 */

// Component configuration
const NEUROSCREEN_CONFIG = {
  component: 'combined-neuroscreen',
  dermatomeOptions: [
    { value: '', label: '—' },
    { value: 'intact', label: 'Intact' },
    { value: 'impaired', label: 'Impaired' },
    { value: 'absent', label: 'Absent' },
  ],
  myotomeOptions: [
    { value: '', label: '—' },
    { value: '5/5', label: '5/5 - Normal' },
    { value: '4/5', label: '4/5 - Good' },
    { value: '3/5', label: '3/5 - Fair' },
    { value: '2/5', label: '2/5 - Poor' },
    { value: '1/5', label: '1/5 - Trace' },
    { value: '0/5', label: '0/5 - Zero' },
  ],
  reflexOptions: [
    { value: '', label: '—' },
    { value: '4+', label: '4+ - Hyperactive' },
    { value: '3+', label: '3+ - Increased' },
    { value: '2+', label: '2+ - Normal' },
    { value: '1+', label: '1+ - Diminished' },
    { value: '0', label: '0 - Absent' },
  ],
};

// Regional data definitions
export const REGIONS = {
  'lower-extremity': {
    name: 'Lower Extremity',
    items: [
      { level: 'L1', reflex: null },
      { level: 'L2', reflex: null },
      { level: 'L3', reflex: 'Patellar' },
      { level: 'L4', reflex: 'Patellar' },
      { level: 'L5', reflex: null },
      { level: 'S1', reflex: 'Achilles' },
      { level: 'S2', reflex: null },
    ],
  },
  'upper-extremity': {
    name: 'Upper Extremity',
    items: [
      { level: 'C5', reflex: 'Biceps' },
      { level: 'C6', reflex: 'Brachioradialis' },
      { level: 'C7', reflex: 'Triceps' },
      { level: 'C8', reflex: null },
      { level: 'T1', reflex: null },
    ],
  },
  'cranial-nerves': {
    name: 'Cranial Nerves',
    items: [
      { level: 'CN I', reflex: null },
      { level: 'CN II', reflex: 'Pupillary' },
      { level: 'CN III', reflex: 'Pupillary' },
      { level: 'CN IV', reflex: null },
      { level: 'CN V', reflex: 'Corneal' },
      { level: 'CN VI', reflex: null },
      { level: 'CN VII', reflex: null },
      { level: 'CN VIII', reflex: null },
      { level: 'CN IX', reflex: 'Gag' },
      { level: 'CN X', reflex: 'Gag' },
      { level: 'CN XI', reflex: null },
      { level: 'CN XII', reflex: null },
    ],
  },
};

/**
 * Creates a combined neuroscreen assessment section
 * @param {string} regionKey - Region identifier
 * @param {Object.<string, string>} dermatomeData - Dermatome assessment data
 * @param {Object.<string, string>} myotomeData - Myotome assessment data
 * @param {Object.<string, string>} reflexData - Reflex assessment data
 * @param {(data: Object.<string, string>) => void} onDermatomeChange - Dermatome change handler
 * @param {(data: Object.<string, string>) => void} onMyotomeChange - Myotome change handler
 * @param {(data: Object.<string, string>) => void} onReflexChange - Reflex change handler
 * @returns {{ element: HTMLElement, rebuild: Function, cleanup: Function }}
 */
export function createCombinedNeuroscreenSection(
  regionKey,
  dermatomeData,
  myotomeData,
  reflexData,
  onDermatomeChange,
  onMyotomeChange,
  onReflexChange,
) {
  const container = el('div', {
    class: 'assessment-section combined-neuroscreen-section mb-24',
  });

  const region = REGIONS[regionKey];
  if (!region) {
    container.appendChild(el('p', {}, `Invalid region: ${regionKey}`));
    return { element: container, rebuild: () => {}, cleanup: () => {} };
  }

  // Key helpers
  const prefixed = (base) => `${regionKey}:${base}`;
  const readVal = (obj, baseKey) => {
    const pk = prefixed(baseKey);
    return Object.prototype.hasOwnProperty.call(obj || {}, pk) ? obj[pk] : (obj || {})[baseKey];
  };
  const writeVal = (obj, baseKey, val) => {
    obj[prefixed(baseKey)] = val;
  };

  /**
   * Creates a grading select dropdown
   */
  function createDermatomeSelect(value, onChange) {
    return createCustomSelect({
      options: NEUROSCREEN_CONFIG.dermatomeOptions,
      value: value || '',
      className: 'combined-neuroscreen__select',
      onChange: (newValue) => onChange(newValue),
    }).element;
  }

  function createMyotomeSelect(value, onChange) {
    return createCustomSelect({
      options: NEUROSCREEN_CONFIG.myotomeOptions,
      value: value || '',
      className: 'combined-neuroscreen__select',
      onChange: (newValue) => onChange(newValue),
    }).element;
  }

  function createReflexSelect(value, onChange) {
    return createCustomSelect({
      options: NEUROSCREEN_CONFIG.reflexOptions,
      value: value || '',
      className: 'combined-neuroscreen__select',
      onChange: (newValue) => onChange(newValue),
    }).element;
  }

  /**
   * Builds the neuroscreen table
   */
  function buildTable() {
    const table = el('table', { class: 'table combined-neuroscreen-table' });

    // Table header
    const thead = el('thead', { class: 'combined-neuroscreen-thead' });
    const headerRow1 = el('tr', {}, [
      el('th', { rowspan: '2', class: 'combined-neuroscreen-th level-col' }, 'Spinal Level'),
      el('th', { colspan: '3', class: 'combined-neuroscreen-th left-group' }, 'Left'),
      el('th', { colspan: '3', class: 'combined-neuroscreen-th right-group' }, 'Right'),
    ]);
    const headerRow2 = el('tr', {}, [
      el('th', { class: 'combined-neuroscreen-th sub-header' }, 'Dermatome'),
      el('th', { class: 'combined-neuroscreen-th sub-header' }, 'Myotome'),
      el('th', { class: 'combined-neuroscreen-th sub-header' }, 'Reflex'),
      el('th', { class: 'combined-neuroscreen-th sub-header divider-left' }, 'Dermatome'),
      el('th', { class: 'combined-neuroscreen-th sub-header' }, 'Myotome'),
      el('th', { class: 'combined-neuroscreen-th sub-header' }, 'Reflex'),
    ]);
    thead.appendChild(headerRow1);
    thead.appendChild(headerRow2);
    table.appendChild(thead);

    // Table body
    const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

    region.items.forEach((item) => {
      const { level, reflex } = item;

      const row = el('tr', { class: 'combined-neuroscreen-row' });

      // Spinal level column
      const levelCell = el('td', { class: 'combined-neuroscreen-td level-col' }, level);

      // Left side cells
      const leftDermatomeKey = `${level}-L-dermatome`;
      const leftMyotomeKey = `${level}-L-myotome`;
      const leftReflexKey = `${level}-L-reflex`;

      const leftDermatomeCell = el('td', { class: 'combined-neuroscreen-td select-cell' });
      leftDermatomeCell.appendChild(
        createDermatomeSelect(readVal(dermatomeData, leftDermatomeKey), (newValue) => {
          writeVal(dermatomeData, leftDermatomeKey, newValue);
          onDermatomeChange(dermatomeData);
        }),
      );

      const leftMyotomeCell = el('td', { class: 'combined-neuroscreen-td select-cell' });
      leftMyotomeCell.appendChild(
        createMyotomeSelect(readVal(myotomeData, leftMyotomeKey), (newValue) => {
          writeVal(myotomeData, leftMyotomeKey, newValue);
          onMyotomeChange(myotomeData);
        }),
      );

      const leftReflexCell = el('td', { class: 'combined-neuroscreen-td select-cell' });
      if (reflex) {
        leftReflexCell.appendChild(
          createReflexSelect(readVal(reflexData, leftReflexKey), (newValue) => {
            writeVal(reflexData, leftReflexKey, newValue);
            onReflexChange(reflexData);
          }),
        );
      } else {
        leftReflexCell.classList.add('na-cell');
      }

      // Right side cells
      const rightDermatomeKey = `${level}-R-dermatome`;
      const rightMyotomeKey = `${level}-R-myotome`;
      const rightReflexKey = `${level}-R-reflex`;

      const rightDermatomeCell = el('td', {
        class: 'combined-neuroscreen-td select-cell divider-left',
      });
      rightDermatomeCell.appendChild(
        createDermatomeSelect(readVal(dermatomeData, rightDermatomeKey), (newValue) => {
          writeVal(dermatomeData, rightDermatomeKey, newValue);
          onDermatomeChange(dermatomeData);
        }),
      );

      const rightMyotomeCell = el('td', { class: 'combined-neuroscreen-td select-cell' });
      rightMyotomeCell.appendChild(
        createMyotomeSelect(readVal(myotomeData, rightMyotomeKey), (newValue) => {
          writeVal(myotomeData, rightMyotomeKey, newValue);
          onMyotomeChange(myotomeData);
        }),
      );

      const rightReflexCell = el('td', { class: 'combined-neuroscreen-td select-cell' });
      if (reflex) {
        rightReflexCell.appendChild(
          createReflexSelect(readVal(reflexData, rightReflexKey), (newValue) => {
            writeVal(reflexData, rightReflexKey, newValue);
            onReflexChange(reflexData);
          }),
        );
      } else {
        rightReflexCell.classList.add('na-cell');
      }

      row.appendChild(levelCell);
      row.appendChild(leftDermatomeCell);
      row.appendChild(leftMyotomeCell);
      row.appendChild(leftReflexCell);
      row.appendChild(rightDermatomeCell);
      row.appendChild(rightMyotomeCell);
      row.appendChild(rightReflexCell);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  }

  // Build initial table
  const table = buildTable();
  container.appendChild(table);

  return {
    element: container,
    rebuild: () => {
      container.innerHTML = '';
      const newTable = buildTable();
      container.appendChild(newTable);
    },
    cleanup: () => {
      container.innerHTML = '';
    },
  };
}

/**
 * Get all available regions
 */
export function getNeuroscreenRegions() {
  return Object.keys(REGIONS).map((key) => ({
    value: key,
    label: REGIONS[key].name,
  }));
}
