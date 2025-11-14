/**
 * RIMs Section Module
 * Resisted Isometric Movement assessment component
 */
import { el } from '../../../ui/utils.js';
import { createBilateralTable } from './EditableTable.js';

/**
 * Creates a Resisted Isometric Movement (RIMs) assessment section
 * @param {string} regionKey - Region identifier
 * @param {object} region - Region configuration data
 * @param {object} rimsData - Current RIMs data
 * @param {function} onChange - Change handler
 */
export function createRimsSection(regionKey, region, rimsData, onChange) {
  const container = el('div', {
    class: 'assessment-section rims-section mb-24',
  });

  // RIMs grading options
  const rimsOptions = [
    { value: '', label: '—' },
    { value: 'strong-painfree', label: 'Strong & Pain-free' },
    { value: 'strong-painful', label: 'Strong & Painful' },
    { value: 'weak-painfree', label: 'Weak & Pain-free' },
    { value: 'weak-painful', label: 'Weak & Painful' },
  ];

  const table = createBilateralTable({
    title: 'Resisted Isometric Movement (RIMs)',
    items: region.rims,
    data: rimsData,
    onChange,
    valueType: 'select',
    valueOptions: rimsOptions,
    normalValues: false,
    embedNormalInName: false,
    notesColumn: false,
    nameColumnLabel: 'Resisted Isometric Movement (RIMs)',
    nameColumnShortLabel: 'RIMs',
    showTitle: false,
  });

  container.appendChild(table.element);

  return {
    element: container,
    rebuild: table.rebuild,
    getData: () => rimsData,
    updateData: onChange,
  };
}

/**
 * Helper to get display label for RIMs value
 */
export function getRimsLabel(value) {
  const labels = {
    'strong-painfree': 'Strong & Pain-free',
    'strong-painful': 'Strong & Painful',
    'weak-painfree': 'Weak & Pain-free',
    'weak-painful': 'Weak & Painful',
  };
  return labels[value] || value || '—';
}
