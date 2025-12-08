// TreatmentPlan.js - Comprehensive PT Treatment Planning
// Evidence-based intervention selection and scheduling

import { el } from '../../../ui/utils.js';
import { textAreaField, selectField } from '../../../ui/form-components.js';
// Use the same editable table system as Regional Assessments for consistent styling
import { createEditableTable } from '../objective/EditableTable.js';

/**
 * Treatment Plan Component - Comprehensive PT intervention planning
 */
export const TreatmentPlan = {
  /**
   * Creates treatment plan section with PT-specific interventions
   * @param {Object} data - Current plan data
   * @param {Function} updateField - Function to update field values
   * @returns {HTMLElement} Treatment plan section
   */
  create(data, updateField) {
    const section = el('div', {
      id: 'treatment-plan',
      class: 'section-anchor treatment-plan-subsection',
      style: 'max-width: 100%; overflow: hidden;',
    });

    section.append(el('h4', { class: 'subsection-title' }, 'Plan of Care'));

    // Primary treatment approach
    section.append(
      textAreaField({
        label: 'Primary Treatment Approach',
        value: data.treatmentPlan,
        onChange: (v) => updateField('treatmentPlan', v),
        placeholder:
          'Describe overall treatment philosophy and approach (e.g., movement-based intervention, manual therapy focus, functional training...)',
      }),
    );
    // Patient education (above Treatment Schedule)
    section.append(
      textAreaField({
        label: 'Education & Self-Management',
        value: data.patientEducation,
        onChange: (v) => updateField('patientEducation', v),
        placeholder: 'Patient education topics, home exercise program, activity modifications...',
      }),
    );

    // Treatment frequency and duration (moved below Patient Education)

    const scheduleRow = el('div', { class: 'form-row' });

    scheduleRow.append(
      selectField({
        label: 'Frequency',
        value: data.frequency,
        options: [
          { value: '', label: 'Select frequency...' },
          { value: '1x-week', label: '1x per week' },
          { value: '2x-week', label: '2x per week' },
          { value: '3x-week', label: '3x per week' },
          { value: '4x-week', label: '4x per week' },
          { value: '5x-week', label: '5x per week (daily)' },
          { value: '2x-day', label: '2x per day' },
          { value: 'prn', label: 'PRN (as needed)' },
        ],
        onChange: (v) => updateField('frequency', v),
      }),
    );

    scheduleRow.append(
      selectField({
        label: 'Duration',
        value: data.duration,
        options: [
          { value: '', label: 'Select duration...' },
          { value: '2-weeks', label: '2 weeks' },
          { value: '4-weeks', label: '4 weeks' },
          { value: '6-weeks', label: '6 weeks' },
          { value: '8-weeks', label: '8 weeks' },
          { value: '12-weeks', label: '12 weeks' },
          { value: '16-weeks', label: '16 weeks' },
          { value: '6-months', label: '6 months' },
          { value: 'ongoing', label: 'Ongoing assessment' },
        ],
        onChange: (v) => updateField('duration', v),
      }),
    );

    // We'll render the schedule inside its own In-Clinic Treatment Plan subsection below

    // Therapeutic Exercise (simplified: single textarea per row) + migration from old schema
    const migrateExerciseTable = () => {
      const tbl = data.exerciseTable || {};
      const keys = Object.keys(tbl);
      if (keys.length === 0) return;
      const first = tbl[keys[0]];
      if (first && Object.prototype.hasOwnProperty.call(first, 'exerciseText')) return; // already migrated
      const newTbl = {};
      keys.forEach((id) => {
        const row = tbl[id] || {};
        const parts = [];
        if (row.exercise) parts.push(String(row.exercise));
        const sets = row.sets ? String(row.sets) : '';
        const reps = row.reps ? String(row.reps) : '';
        if (sets || reps) parts.push(`[${sets}${sets && reps ? ' x ' : ''}${reps}]`);
        if (row.intensity) parts.push(`Intensity: ${row.intensity}`);
        if (row.frequency) parts.push(`Freq: ${row.frequency}`);
        if (row.notes) parts.push(`Notes: ${row.notes}`);
        newTbl[id] = { exerciseText: parts.join(' • ').trim() };
      });
      updateField('exerciseTable', newTbl);
    };

    migrateExerciseTable();

    const exerciseTable = createEditableTable({
      title: 'Treatment Plan',
      columns: [
        {
          field: 'exerciseText',
          label: 'Exercise/Activity',
          width: '100%',
          type: 'textarea',
          rows: 1,
          placeholder: 'Describe the intervention, dosage, or response...',
        },
      ],
      data: data.exerciseTable || {},
      onChange: (newData) => updateField('exerciseTable', newData),
      addButtonText: '+ Add Exercise',
      compactAddButton: true,
      startWithOneRow: true,
      showHeader: false,
      className: 'therapeutic-ex-table simple-text-table goals-table',
    });
    // New dedicated subsection for the in-clinic treatment plan (table + schedule)
    const inClinicSub = el('div', {
      id: 'in-clinic-treatment-plan',
      class: 'section-anchor',
      style: 'max-width: 100%;',
    });
    inClinicSub.append(el('h4', { class: 'subsection-title' }, 'Treatment Plan'));
    inClinicSub.append(scheduleRow);
    inClinicSub.append(exerciseTable.element);

    section.append(inClinicSub);

    // (Removed) Plan of Care Schedule subsection

    return section;
  },
};
