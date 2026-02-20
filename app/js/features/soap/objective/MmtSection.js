/**
 * MMT Section Module
 * Manual Muscle Testing assessment component
 */
import { el } from '../../../ui/utils.js';
import { createEditableTable } from './EditableTable.js';

const MMT_GRADES = [
  { value: '', label: 'Not tested' },
  { value: '0/5', label: '0/5 - No contraction' },
  { value: '1/5', label: '1/5 - Trace contraction' },
  { value: '2/5', label: '2/5 - Full ROM gravity eliminated' },
  { value: '3/5', label: '3/5 - Full ROM against gravity' },
  { value: '4-/5', label: '4-/5 - Less than normal resistance' },
  { value: '4/5', label: '4/5 - Moderate resistance' },
  { value: '4+/5', label: '4+/5 - Nearly normal resistance' },
  { value: '5/5', label: '5/5 - Normal strength' },
];

/**
 * Creates a Manual Muscle Testing assessment section
 * Uses createEditableTable directly for a professional grouped header
 * with full add/delete support.
 * @param {string} regionKey - Region identifier
 * @param {object} region - Region configuration data
 * @param {object} mmtData - Current MMT data
 * @param {function} onChange - Change handler
 */
export function createMmtSection(regionKey, region, mmtData, onChange) {
  const container = el('div', {
    class: 'assessment-section mmt-section mb-24',
  });

  // Group bilateral items by muscle name to combine L/R into one row
  const grouped = {};
  (region.mmt || []).forEach((item) => {
    const baseName = item.name || item.muscle;
    if (!grouped[baseName]) grouped[baseName] = baseName;
  });

  // Convert grouped items to table data keyed by stable slug IDs
  const tableData = {};
  Object.keys(grouped).forEach((muscleName) => {
    const rowId = `mmt-${muscleName.toLowerCase().replace(/\s+/g, '-')}`;
    tableData[rowId] = {
      name: muscleName,
      left: '',
      right: '',
    };
  });

  // Overlay previously saved values (includes user-added rows)
  if (mmtData && typeof mmtData === 'object') {
    Object.keys(mmtData).forEach((id) => {
      const saved = mmtData[id];
      if (saved && typeof saved === 'object') {
        if (tableData[id]) {
          // Existing region-defined muscle — restore saved values
          tableData[id].left = saved.left || '';
          tableData[id].right = saved.right || '';
          if (saved.name) tableData[id].name = saved.name;
        } else {
          // User-added muscle — re-create the row
          tableData[id] = {
            name: saved.name || '',
            left: saved.left || '',
            right: saved.right || '',
          };
        }
      }
      // Skip old numeric-keyed string values (legacy format)
    });
  }

  // Use region name for the green level-col header (matches ROM pattern)
  const regionLabel = (region.name || 'MMT').toUpperCase();

  const table = createEditableTable({
    title: '',
    columns: [
      {
        field: 'name',
        label: regionLabel,
        short: 'MMT',
        width: 'calc(50% - 30px)',
        placeholder: 'Muscle name',
      },
      {
        field: 'left',
        label: 'Left',
        width: 'calc(25% - 15px)',
        type: 'select',
        options: MMT_GRADES,
      },
      {
        field: 'right',
        label: 'Right',
        width: 'calc(25% - 15px)',
        type: 'select',
        options: MMT_GRADES,
      },
    ],
    data: tableData,
    onChange: (newData) => {
      const updatedData = {};
      Object.keys(newData).forEach((rowId) => {
        updatedData[rowId] = {
          name: newData[rowId].name,
          left: newData[rowId].left,
          right: newData[rowId].right,
        };
      });
      onChange(updatedData);
    },
    showAddButton: true,
    compactAddButton: true,
    addButtonText: '+ Add Muscle',
    showDeleteButton: true,
    actionsHeaderLabel: '',
    className: 'bilateral-table no-normal mmt-bilateral-table',
  });

  container.appendChild(table.element);

  return {
    element: container,
    rebuild: table.rebuild,
    getData: () => mmtData,
    updateData: onChange,
  };
}

/**
 * Standard MMT muscle groups by region
 */
export const mmtMuscleGroups = {
  'cervical-spine': [
    { muscle: 'Neck Flexors', side: '', normal: '5/5' },
    { muscle: 'Neck Extensors', side: '', normal: '5/5' },
    { muscle: 'Upper Trap', side: 'R', normal: '5/5' },
    { muscle: 'Upper Trap', side: 'L', normal: '5/5' },
    { muscle: 'Levator Scapulae', side: 'R', normal: '5/5' },
    { muscle: 'Levator Scapulae', side: 'L', normal: '5/5' },
  ],

  'lumbar-spine': [
    { muscle: 'Hip Flexors', side: 'R', normal: '5/5' },
    { muscle: 'Hip Flexors', side: 'L', normal: '5/5' },
    { muscle: 'Quadriceps', side: 'R', normal: '5/5' },
    { muscle: 'Quadriceps', side: 'L', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'R', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'L', normal: '5/5' },
    { muscle: 'Glut Max', side: 'R', normal: '5/5' },
    { muscle: 'Glut Max', side: 'L', normal: '5/5' },
    { muscle: 'Glut Med', side: 'R', normal: '5/5' },
    { muscle: 'Glut Med', side: 'L', normal: '5/5' },
  ],

  shoulder: [
    { muscle: 'Deltoid Anterior', side: 'R', normal: '5/5' },
    { muscle: 'Deltoid Anterior', side: 'L', normal: '5/5' },
    { muscle: 'Deltoid Middle', side: 'R', normal: '5/5' },
    { muscle: 'Deltoid Middle', side: 'L', normal: '5/5' },
    { muscle: 'Deltoid Posterior', side: 'R', normal: '5/5' },
    { muscle: 'Deltoid Posterior', side: 'L', normal: '5/5' },
    { muscle: 'Rotator Cuff', side: 'R', normal: '5/5' },
    { muscle: 'Rotator Cuff', side: 'L', normal: '5/5' },
  ],

  knee: [
    { muscle: 'Quadriceps', side: 'R', normal: '5/5' },
    { muscle: 'Quadriceps', side: 'L', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'R', normal: '5/5' },
    { muscle: 'Hamstrings', side: 'L', normal: '5/5' },
  ],
};

/**
 * Helper function to get MMT muscle groups by region
 */
export function getMmtMuscles(region) {
  return mmtMuscleGroups[region] || [];
}
