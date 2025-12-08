// GoalSetting.js - SMART Goals and Functional Outcomes
// Evidence-based goal setting with measurable outcomes

import { el } from '../../../ui/utils.js';
import { createEditableTable } from '../objective/EditableTable.js';

/**
 * Goal Setting Component - SMART goals for PT outcomes
 */
export const GoalSetting = {
  /**
   * Creates goal setting section with SMART goal framework
   * @param {Object} data - Current plan data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} Goal setting section
   */
  create(data, updateField) {
    const section = el('div', {
      id: 'goal-setting',
      class: 'section-anchor goal-setting-subsection',
    });

    section.append(el('h4', { class: 'subsection-title' }, 'Goals'));

    // Ensure goals table exists
    if (!data.goalsTable) {
      data.goalsTable = {};
    }

    // Single simple goals table: one text column + remove button, compact footer add, starter row
    const goalsTable = createEditableTable({
      title: '',
      columns: [
        {
          field: 'goalText',
          label: 'Goal',
          width: '100%',
          type: 'textarea',
          rows: 1,
          placeholder: 'Input SMART or ABCDF goal here',
        },
      ],
      data: data.goalsTable || {},
      onChange: (newData) => updateField('goalsTable', newData),
      addButtonText: '+ Add Goal',
      compactAddButton: true,
      startWithOneRow: true,
      showHeader: false,
      className: 'goals-table simple-goals',
    });

    section.append(goalsTable.element);

    return section;
  },
};
