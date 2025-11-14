/**
 * Combined ROM Section Module
 * Streamlined table combining AROM, PROM, and RIMs in a single view
 */
import { el } from '../../../ui/utils.js';
import { createCustomSelect } from '../../../ui/CustomSelect.js';

/**
 * @typedef {Object} ROMItem
 * @property {string} joint - Joint/movement name
 * @property {string} side - Side indicator: 'L', 'R', or '' for midline
 * @property {string} [normal] - Normal range of motion value
 */

/**
 * @typedef {Object} RegionData
 * @property {string} name - Region display name
 * @property {ROMItem[]} rom - Array of ROM measurement items
 */

/**
 * @typedef {Object} RIMOption
 * @property {string} value - Option value for data storage
 * @property {string} label - Human-readable label
 */

/**
 * @typedef {Object} CombinedRomSectionResult
 * @property {HTMLElement} element - The container element
 * @property {Function} rebuild - Function to rebuild the section
 * @property {Function} cleanup - Function to clean up event listeners and references
 */

// Component configuration constants
const COMBINED_ROM_CONFIG = {
  component: 'combined-rom',
  rimsOptions: [
    { value: '', label: '—' },
    { value: 'strong-painfree', label: 'Strong & Pain-free' },
    { value: 'strong-painful', label: 'Strong & Painful' },
    { value: 'weak-painfree', label: 'Weak & Pain-free' },
    { value: 'weak-painful', label: 'Weak & Painful' },
  ],
  inputAttrs: {
    type: 'text',
    inputmode: 'numeric',
    pattern: '\\d*',
  },
  regionPrefixMap: {
    hip: ['Hip '],
    knee: ['Knee '],
    ankle: ['Ankle '],
    shoulder: ['Shoulder '],
    elbow: ['Elbow '],
    'wrist-hand': ['Wrist ', 'Forearm '],
    'cervical-spine': ['Cervical '],
    'thoracic-spine': ['Thoracic '],
    'lumbar-spine': ['Lumbar '],
  },
};

/**
 * Creates a combined ROM assessment section with AROM, PROM, and RIMs columns
 * @param {string} regionKey - Region identifier (e.g., 'shoulder', 'hip')
 * @param {RegionData} region - Region configuration data
 * @param {Object.<string, string>} aromsData - Current AROM data (key-value pairs)
 * @param {Object.<string, string>} promsData - Current PROM data (key-value pairs)
 * @param {Object.<string, string>} rimsData - Current RIMs data (key-value pairs)
 * @param {(data: Object.<string, string>) => void} onAromChange - AROM change handler
 * @param {(data: Object.<string, string>) => void} onPromChange - PROM change handler
 * @param {(data: Object.<string, string>) => void} onRimChange - RIMs change handler
 * @returns {CombinedRomSectionResult}
 */
export function createCombinedRomSection(
  regionKey,
  region,
  aromsData,
  promsData,
  rimsData,
  onAromChange,
  onPromChange,
  onRimChange,
) {
  const container = el('div', {
    class: 'assessment-section combined-rom-section mb-24',
  });

  // Key helpers: namespace keys per-region to avoid collisions across regions
  const prefixed = (base) => `${regionKey}:${base}`;
  const readVal = (obj, baseKey) => {
    const pk = prefixed(baseKey);
    return Object.prototype.hasOwnProperty.call(obj || {}, pk) ? obj[pk] : (obj || {})[baseKey];
  };
  const writeVal = (obj, baseKey, val) => {
    obj[prefixed(baseKey)] = val;
  };

  /**
   * Creates a custom select dropdown with RIM grading options
   * @param {string} value - Currently selected value
   * @param {(value: string) => void} onChange - Change handler callback
   * @returns {Object} Custom select instance
   */
  function createSelect(value, onChange) {
    const customSelect = createCustomSelect({
      value,
      options: COMBINED_ROM_CONFIG.rimsOptions,
      onChange,
      className: 'combined-rom-select',
      placeholder: '—',
      dataAttrs: {
        'data-component': COMBINED_ROM_CONFIG.component,
        'data-element': 'select',
      },
    });
    return customSelect;
  }

  /**
   * Creates a text input for degree values with degree symbol suffix
   * @param {string} value - Current input value
   * @param {(value: string) => void} onChange - Change handler callback
   * @param {string} [normalValue] - Normal range value for tooltip
   * @returns {HTMLElement} Wrapper element containing input and suffix
   */
  function createDegreeInput(value, onChange, normalValue) {
    const wrapper = el('div', {
      class: 'input-with-suffix',
      ...(normalValue ? { title: `Normal: ${normalValue}` } : {}),
    });
    const input = el('input', {
      ...COMBINED_ROM_CONFIG.inputAttrs,
      class: 'form-input-standard combined-rom-input',
      'data-component': COMBINED_ROM_CONFIG.component,
      'data-element': 'input',
      value: value || '',
      placeholder: '',
      onblur: (e) => onChange(e.target.value),
      ...(normalValue ? { 'aria-label': `Value (Normal ${normalValue})` } : {}),
    });
    const suffix = el('span', { class: 'input-suffix' }, '°');
    wrapper.appendChild(input);
    wrapper.appendChild(suffix);
    return wrapper;
  }

  // Build table structure
  const tableWrapper = el('div', { class: 'table-responsive' });
  const table = el('table', {
    class: 'table combined-rom-table',
    'data-component': COMBINED_ROM_CONFIG.component,
  });

  // Build header with grouped columns
  const thead = el('thead', { class: 'combined-rom-thead' });
  const headerRow1 = el('tr', {}, [
    el(
      'th',
      { rowspan: '2', class: 'combined-rom-th motion-col' },
      (region.name || '').toUpperCase(),
    ),
    el('th', { colspan: '3', class: 'combined-rom-th left-group' }, 'Left'),
    el('th', { colspan: '3', class: 'combined-rom-th right-group' }, 'Right'),
  ]);
  const headerRow2 = el('tr', {}, [
    el('th', { class: 'combined-rom-th sub-header' }, 'AROM'),
    el('th', { class: 'combined-rom-th sub-header' }, 'PROM'),
    el('th', { class: 'combined-rom-th sub-header' }, 'RIM'),
    el('th', { class: 'combined-rom-th sub-header divider-left' }, 'AROM'),
    el('th', { class: 'combined-rom-th sub-header' }, 'PROM'),
    el('th', { class: 'combined-rom-th sub-header' }, 'RIM'),
  ]);
  thead.appendChild(headerRow1);
  thead.appendChild(headerRow2);
  table.appendChild(thead);

  // Build table body
  const tbody = el('tbody', { class: 'combined-rom-tbody' });

  // Group items by joint name to combine left/right
  const grouped = {};
  region.rom.forEach((item) => {
    const jointName = item.joint;
    if (!grouped[jointName]) {
      grouped[jointName] = {
        name: jointName,
        normal: item.normal,
        left: null,
        right: null,
        midline: item.side === '',
      };
    }
    if (item.side === 'L') grouped[jointName].left = item;
    else if (item.side === 'R') grouped[jointName].right = item;
    else grouped[jointName].midline = true;
  });

  /**
   * Removes region-specific prefixes from joint names for cleaner display
   * @param {string} rk - Region key
   * @param {string} jointName - Full joint name with potential prefix
   * @returns {string} Cleaned joint name without prefix
   */
  const motionLabelFromJoint = (rk, jointName) => {
    const prefixes = COMBINED_ROM_CONFIG.regionPrefixMap[rk] || [];
    for (const p of prefixes) {
      if ((jointName || '').startsWith(p)) {
        return jointName.slice(p.length);
      }
    }
    return jointName;
  };

  Object.keys(grouped).forEach((jointName) => {
    const group = grouped[jointName];
    const row = el('tr', { class: 'combined-rom-row' });

    // Motion name
    row.appendChild(
      el(
        'td',
        { class: 'combined-rom-td motion-cell' },
        motionLabelFromJoint(regionKey, group.name),
      ),
    );

    if (group.midline) {
      // Midline movement (no left/right)
      const aromKey = jointName;
      const promKey = jointName;
      const rimKey = jointName;

      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td input-cell' },
          createDegreeInput(
            readVal(aromsData, aromKey),
            (val) => {
              writeVal(aromsData, aromKey, val);
              onAromChange(aromsData);
            },
            group.normal,
          ),
        ),
      );
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td input-cell' },
          createDegreeInput(
            readVal(promsData, promKey),
            (val) => {
              writeVal(promsData, promKey, val);
              onPromChange(promsData);
            },
            group.normal,
          ),
        ),
      );
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td select-cell' },
          createSelect(readVal(rimsData, rimKey), (val) => {
            writeVal(rimsData, rimKey, val);
            onRimChange(rimsData);
          }).element,
        ),
      );

      // Empty right side for midline movements
      row.appendChild(el('td', { class: 'combined-rom-td empty-cell divider-left' }, '—'));
      row.appendChild(el('td', { class: 'combined-rom-td empty-cell' }, '—'));
      row.appendChild(el('td', { class: 'combined-rom-td empty-cell' }, '—'));
    } else {
      // Bilateral movement
      const leftKey = `${jointName}_L`;
      const rightKey = `${jointName}_R`;

      // Left AROM
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td input-cell' },
          createDegreeInput(
            readVal(aromsData, leftKey),
            (val) => {
              writeVal(aromsData, leftKey, val);
              onAromChange(aromsData);
            },
            group.normal,
          ),
        ),
      );
      // Left PROM
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td input-cell' },
          createDegreeInput(
            readVal(promsData, leftKey),
            (val) => {
              writeVal(promsData, leftKey, val);
              onPromChange(promsData);
            },
            group.normal,
          ),
        ),
      );
      // Left RIM
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td select-cell' },
          createSelect(readVal(rimsData, leftKey), (val) => {
            writeVal(rimsData, leftKey, val);
            onRimChange(rimsData);
          }).element,
        ),
      );

      // Right AROM
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td input-cell divider-left' },
          createDegreeInput(
            readVal(aromsData, rightKey),
            (val) => {
              writeVal(aromsData, rightKey, val);
              onAromChange(aromsData);
            },
            group.normal,
          ),
        ),
      );
      // Right PROM
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td input-cell' },
          createDegreeInput(
            readVal(promsData, rightKey),
            (val) => {
              writeVal(promsData, rightKey, val);
              onPromChange(promsData);
            },
            group.normal,
          ),
        ),
      );
      // Right RIM
      row.appendChild(
        el(
          'td',
          { class: 'combined-rom-td select-cell' },
          createSelect(readVal(rimsData, rightKey), (val) => {
            writeVal(rimsData, rightKey, val);
            onRimChange(rimsData);
          }).element,
        ),
      );
    }

    // Normal value moved to tooltip on AROM/PROM cells

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);

  // Debug helper: expose component inspection when ?debug=1
  if (new URLSearchParams(window.location.search).get('debug') === '1') {
    if (!window.debugCombinedROM) {
      window.debugCombinedROM = {
        /**
         * Inspects Combined ROM element styles and attributes
         * @param {string} selector - CSS selector to find element
         * @returns {Object} Inspection data
         */
        inspect: (selector) => {
          const el = document.querySelector(selector);
          if (!el) return { error: 'Element not found' };

          const computed = window.getComputedStyle(el);
          return {
            element: el.tagName.toLowerCase(),
            classes: Array.from(el.classList),
            attributes: Array.from(el.attributes).map((a) => `${a.name}="${a.value}"`),
            computedStyles: {
              background: computed.background,
              backgroundColor: computed.backgroundColor,
              border: computed.border,
              borderBottom: computed.borderBottom,
              padding: computed.padding,
              minHeight: computed.minHeight,
              height: computed.height,
              boxShadow: computed.boxShadow,
              outline: computed.outline,
            },
            matchedRules: (() => {
              const rules = [];
              try {
                Array.from(document.styleSheets).forEach((sheet) => {
                  Array.from(sheet.cssRules || []).forEach((rule) => {
                    if (rule.selectorText && el.matches(rule.selectorText)) {
                      rules.push(rule.selectorText);
                    }
                  });
                });
              } catch (e) {
                rules.push(`Error: ${e.message}`);
              }
              return rules;
            })(),
          };
        },
        /**
         * Lists all Combined ROM elements in the document
         * @returns {Array} Array of element info
         */
        listElements: () => {
          const selects = document.querySelectorAll('select[data-component="combined-rom"]');
          const inputs = document.querySelectorAll('input[data-component="combined-rom"]');
          const tables = document.querySelectorAll('table[data-component="combined-rom"]');

          return {
            tables: tables.length,
            selects: selects.length,
            inputs: inputs.length,
            selectIds: Array.from(selects).map(
              (el, i) => `select[data-component="combined-rom"]:nth-of-type(${i + 1})`,
            ),
            inputIds: Array.from(inputs).map(
              (el, i) => `input[data-component="combined-rom"]:nth-of-type(${i + 1})`,
            ),
          };
        },
        /**
         * Gets the configuration used by Combined ROM component
         * @returns {Object} Component configuration
         */
        getConfig: () => COMBINED_ROM_CONFIG,
      };
      // eslint-disable-next-line no-console
      console.log(
        '🧪 Combined ROM Debug Helper loaded. Use window.debugCombinedROM.inspect(), .listElements(), or .getConfig()',
      );
    }
  }

  return {
    element: container,
    /**
     * Rebuilds the entire table with fresh data
     * Future implementation will accept new data parameter
     */
    rebuild: () => {
      // Future implementation: full rebuild with new data
      // For now, users should create a new section instance
    },
    /**
     * Cleans up event listeners and references
     * Call this when removing the component from the DOM
     */
    cleanup: () => {
      // Event listeners are bound via onchange/onblur inline handlers
      // which will be automatically cleaned up when elements are removed
      // No explicit cleanup needed currently, but this hook is available
      // for future use if we add external listeners or observers
    },
  };
}
