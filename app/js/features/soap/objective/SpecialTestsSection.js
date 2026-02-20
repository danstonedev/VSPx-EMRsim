/**
 * Special Tests Section Module
 * Special/Orthopedic tests assessment component
 */
import { el } from '../../../ui/utils.js';
import { createEditableTable } from './EditableTable.js';

/**
 * Creates a Special Tests assessment section
 * @param {string} regionKey - Region identifier
 * @param {object} region - Region configuration data
 * @param {object} testData - Current test data
 * @param {function} onChange - Change handler
 */
export function createSpecialTestsSection(regionKey, region, testData, onChange) {
  const container = el('div', {
    class: 'assessment-section special-tests-section mb-24',
  });

  const testResults = [
    { value: '', label: 'Not performed' },
    { value: 'positive', label: 'Positive' },
    { value: 'negative', label: 'Negative' },
    { value: 'inconclusive', label: 'Inconclusive' },
    { value: 'unable', label: 'Unable to perform' },
  ];

  // Convert region special tests to table format, then overlay any saved data
  const tableData = {};
  if (region.specialTests) {
    region.specialTests.forEach((test, index) => {
      const testId = `test-${index}`;
      tableData[testId] = {
        name: test.name,
        left: '',
        right: '',
      };
    });
  }
  // Overlay previously saved values (includes user-added rows)
  if (testData && typeof testData === 'object') {
    Object.keys(testData).forEach((id) => {
      const saved = testData[id];
      if (tableData[id]) {
        // Existing region test — restore left/right (and name if edited)
        tableData[id].left = saved.left || '';
        tableData[id].right = saved.right || '';
        if (saved.name) tableData[id].name = saved.name;
      } else {
        // User-added test — re-create the row
        tableData[id] = {
          name: saved.name || '',
          left: saved.left || '',
          right: saved.right || '',
        };
      }
    });
  }

  const table = createEditableTable({
    title: '', // hide green band title
    columns: [
      {
        field: 'name',
        label: 'Special Tests',
        short: 'Tests',
        width: 'calc(50% - 30px)',
        placeholder: 'Test name',
      },
      {
        field: 'left',
        label: 'Left',
        width: 'calc(25% - 15px)',
        type: 'select',
        options: testResults,
      },
      {
        field: 'right',
        label: 'Right',
        width: 'calc(25% - 15px)',
        type: 'select',
        options: testResults,
      },
    ],
    data: tableData,
    onChange: (newData) => {
      // Convert back to original format with L/R columns
      const updatedData = {};
      Object.keys(newData).forEach((testId) => {
        updatedData[testId] = {
          name: newData[testId].name,
          left: newData[testId].left,
          right: newData[testId].right,
        };
      });
      onChange(updatedData);
    },
    showAddButton: true,
    compactAddButton: true,
    addButtonText: '+ Add Test',
    actionsHeaderLabel: '',
    // Mark as no-normal to ensure the 3-column mobile grid variant (no trailing empty track)
    className: 'special-tests-table bilateral-table no-normal',
  });

  container.appendChild(table.element);

  // Removed test interpretation reference per requirements

  return {
    element: container,
    rebuild: table.rebuild,
    getData: () => testData,
    updateData: onChange,
  };
}

/**
 * Common special tests by region
 */
export const specialTestsByRegion = {
  'cervical-spine': [
    { name: 'Spurling Test', purpose: 'Cervical radiculopathy' },
    { name: 'Upper Limb Tension Test', purpose: 'Neural tension' },
    { name: 'Cervical Distraction Test', purpose: 'Cervical radiculopathy' },
    { name: 'Vertebral Artery Test', purpose: 'Vertebrobasilar insufficiency' },
    { name: 'Sharp-Purser Test', purpose: 'Atlantoaxial instability' },
  ],

  'lumbar-spine': [
    { name: 'Straight Leg Raise (SLR)', purpose: 'Neural tension/disc pathology' },
    { name: 'Slump Test', purpose: 'Neural tension' },
    { name: 'Prone Instability Test', purpose: 'Lumbar instability' },
    { name: 'Centralization Phenomena', purpose: 'Directional preference' },
    { name: 'FABERE/Patrick Test', purpose: 'Hip/SI joint pathology' },
    { name: 'Posterior Shear Test', purpose: 'SI joint dysfunction' },
  ],

  shoulder: [
    { name: 'Neer Impingement Sign', purpose: 'Subacromial impingement' },
    { name: 'Hawkins-Kennedy Test', purpose: 'Subacromial impingement' },
    { name: 'Empty Can Test', purpose: 'Supraspinatus pathology' },
    { name: 'External Rotation Lag Sign', purpose: 'Infraspinatus/teres minor pathology' },
    { name: 'Apprehension Test', purpose: 'Anterior shoulder instability' },
    { name: 'Load and Shift Test', purpose: 'Glenohumeral instability' },
  ],

  knee: [
    { name: 'Lachman Test', purpose: 'ACL integrity' },
    { name: 'Anterior Drawer Test', purpose: 'ACL integrity' },
    { name: 'Posterior Drawer Test', purpose: 'PCL integrity' },
    { name: 'McMurray Test', purpose: 'Meniscal tear' },
    { name: 'Valgus Stress Test', purpose: 'MCL integrity' },
    { name: 'Varus Stress Test', purpose: 'LCL integrity' },
    { name: 'Patellar Apprehension Test', purpose: 'Patellar instability' },
  ],

  ankle: [
    { name: 'Anterior Drawer Test', purpose: 'ATFL integrity' },
    { name: 'Talar Tilt Test', purpose: 'CFL integrity' },
    { name: 'Thompson Test', purpose: 'Achilles tendon rupture' },
    { name: 'Kleiger Test', purpose: 'Deltoid ligament/syndesmosis' },
    { name: 'Squeeze Test', purpose: 'Syndesmosis injury' },
  ],
};

/**
 * Helper function to get special tests by region
 */
export function getSpecialTests(region) {
  return specialTestsByRegion[region] || [];
}
