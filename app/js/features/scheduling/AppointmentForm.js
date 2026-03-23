/**
 * AppointmentForm.js — Modal form for creating / editing appointments.
 */
import { el } from '../../ui/utils.js';
import {
  APPOINTMENT_TYPES,
  PRIORITY_LEVELS,
  NCP_STEPS,
  DURATION_OPTIONS,
  getAppointmentTypeById,
  createBlankAppointment,
} from './scheduling-data.js';

/**
 * Opens a modal form for creating or editing an appointment.
 * @param {Object} [existing] - Existing appointment to edit (null for new)
 * @param {Function} onSave - Called with the saved appointment object
 */
export function openAppointmentForm(existing, onSave) {
  const isEdit = !!existing;
  const appt = existing ? { ...existing } : createBlankAppointment();

  const overlay = el('div', {
    class: 'modal-overlay scheduling-modal-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': isEdit ? 'Edit Appointment' : 'New Appointment',
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });

  // --- Form fields ---
  const dateInput = el('input', {
    type: 'date',
    class: 'form-input-standard',
    id: 'appt-date',
    value: appt.date,
  });
  const timeInput = el('input', {
    type: 'time',
    class: 'form-input-standard',
    id: 'appt-time',
    value: appt.time,
  });

  const durationSelect = el(
    'select',
    { class: 'form-input-standard', id: 'appt-duration' },
    DURATION_OPTIONS.map((d) =>
      el(
        'option',
        { value: String(d), ...(d === appt.duration ? { selected: true } : {}) },
        `${d} min`,
      ),
    ),
  );

  const typeSelect = el(
    'select',
    { class: 'form-input-standard', id: 'appt-type' },
    APPOINTMENT_TYPES.map((t) =>
      el('option', { value: t.id, ...(t.id === appt.type ? { selected: true } : {}) }, t.label),
    ),
  );

  const prioritySelect = el(
    'select',
    { class: 'form-input-standard', id: 'appt-priority' },
    PRIORITY_LEVELS.map((p) =>
      el('option', { value: p.id, ...(p.id === appt.priority ? { selected: true } : {}) }, p.label),
    ),
  );

  const ncpSelect = el(
    'select',
    { class: 'form-input-standard', id: 'appt-ncp' },
    NCP_STEPS.map((s) =>
      el('option', { value: s.id, ...(s.id === appt.ncp_step ? { selected: true } : {}) }, s.label),
    ),
  );

  const locationInput = el('input', {
    type: 'text',
    class: 'form-input-standard',
    id: 'appt-location',
    placeholder: 'e.g. Room 412',
    value: appt.location || '',
  });

  const reasonInput = el(
    'textarea',
    {
      class: 'form-input-standard',
      id: 'appt-reason',
      rows: '2',
      placeholder: 'Reason / chief concern',
    },
    appt.reason || '',
  );

  const notesInput = el(
    'textarea',
    {
      class: 'form-input-standard',
      id: 'appt-notes',
      rows: '2',
      placeholder: 'Additional notes',
    },
    appt.notes || '',
  );

  const cptDisplay = el('input', {
    type: 'text',
    class: 'form-input-standard',
    id: 'appt-cpt',
    value: appt.cpt_code || '',
    placeholder: 'Auto-filled',
  });

  // Auto-update CPT when type changes
  typeSelect.addEventListener('change', () => {
    const typeInfo = getAppointmentTypeById(typeSelect.value);
    if (typeInfo) {
      cptDisplay.value = typeInfo.cpt || '';
      durationSelect.value = String(typeInfo.defaultDuration);
    }
  });

  function fieldRow(labelText, input) {
    return el('div', { class: 'scheduling-form-row' }, [
      el('label', { class: 'scheduling-form-label' }, labelText),
      input,
    ]);
  }

  const form = el('form', { class: 'scheduling-form', autocomplete: 'off' }, [
    el('div', { class: 'scheduling-form-grid' }, [
      fieldRow('Date', dateInput),
      fieldRow('Time', timeInput),
      fieldRow('Duration', durationSelect),
      fieldRow('Type', typeSelect),
      fieldRow('Priority', prioritySelect),
      fieldRow('NCP Step', ncpSelect),
      fieldRow('Location', locationInput),
      fieldRow('CPT Code', cptDisplay),
    ]),
    fieldRow('Reason', reasonInput),
    fieldRow('Notes', notesInput),
  ]);

  const saveBtn = el(
    'button',
    { class: 'btn primary', type: 'submit' },
    isEdit ? 'Update' : 'Add Appointment',
  );
  const cancelBtn = el(
    'button',
    { class: 'btn secondary', type: 'button', onclick: () => overlay.remove() },
    'Cancel',
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const saved = {
      ...appt,
      date: dateInput.value,
      time: timeInput.value,
      duration: parseInt(durationSelect.value, 10),
      type: typeSelect.value,
      priority: prioritySelect.value,
      ncp_step: ncpSelect.value,
      location: locationInput.value.trim(),
      reason: reasonInput.value.trim(),
      notes: notesInput.value.trim(),
      cpt_code: cptDisplay.value.trim(),
    };
    onSave(saved);
    overlay.remove();
  });

  const content = el('div', { class: 'modal-content scheduling-modal-content' }, [
    el('div', { class: 'modal-header' }, [
      el('h3', {}, isEdit ? 'Edit Appointment' : 'New Appointment'),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'modal-body' }, [form]),
    el('div', { class: 'modal-actions' }, [cancelBtn, saveBtn]),
  ]);

  overlay.append(content);
  document.body.append(overlay);
  setTimeout(() => dateInput.focus(), 50);
}
