/**
 * SchedulingPanel.js — Main scheduling view rendered inside the dietetics case editor.
 *
 * Shows: Daily Census, Agenda/Timeline, Meal Rounds, Tube Feeding, and quick-add actions.
 */
import { el } from '../../ui/utils.js';
import {
  sortAppointments,
  getPriorityById,
  getAppointmentTypeById,
  createBlankMealRound,
  createBlankTubeFeeding,
  MEAL_TYPES,
  APPOINTMENT_STATUSES,
  NCP_STEPS,
  COMMON_FORMULAS,
  TUBE_FEEDING_METHODS,
} from './scheduling-data.js';
import { openAppointmentForm } from './AppointmentForm.js';

/**
 * Renders the full scheduling panel into a container element.
 * @param {HTMLElement} container - Target DOM element
 * @param {Object} schedulingData - The scheduling data from the case
 * @param {Function} onDataChange - Callback when data changes; receives updated scheduling obj
 */
export function renderSchedulingPanel(container, schedulingData, onDataChange) {
  const data = schedulingData || {
    appointments: [],
    mealRounds: [],
    tubeFeedingSchedule: [],
    dailyCensus: { date: '', totalPatients: 0, highRisk: 0, newConsults: 0, discharges: 0 },
  };

  container.replaceChildren();
  container.classList.add('scheduling-panel');

  // --- Daily Census ---
  const census = data.dailyCensus || {};
  const censusBar = el('div', { class: 'scheduling-census' }, [
    censusTile('local_hospital', 'Patients', census.totalPatients || 0),
    censusTile('warning', 'High-Risk', census.highRisk || 0),
    censusTile('assignment_add', 'New Consults', census.newConsults || 0),
    censusTile('exit_to_app', 'Discharges', census.discharges || 0),
  ]);

  // Make census editable
  censusBar.querySelectorAll('.scheduling-census-tile__value').forEach((valEl) => {
    valEl.contentEditable = 'true';
    valEl.addEventListener('blur', () => {
      const tiles = censusBar.querySelectorAll('.scheduling-census-tile__value');
      data.dailyCensus = {
        ...data.dailyCensus,
        totalPatients: parseInt(tiles[0].textContent, 10) || 0,
        highRisk: parseInt(tiles[1].textContent, 10) || 0,
        newConsults: parseInt(tiles[2].textContent, 10) || 0,
        discharges: parseInt(tiles[3].textContent, 10) || 0,
      };
      onDataChange(data);
    });
  });

  // --- Today's Schedule ---
  const sorted = sortAppointments(data.appointments || []);
  const agendaItems = sorted.map((appt) =>
    buildAppointmentCard(appt, data, onDataChange, container),
  );

  const emptyMsg = el(
    'p',
    { class: 'scheduling-empty' },
    'No appointments scheduled. Click "+ Add Appointment" to get started.',
  );

  const agendaSection = el('div', { class: 'scheduling-section' }, [
    el('div', { class: 'scheduling-section__header' }, [el('h3', {}, "Today's Schedule")]),
    ...(sorted.length > 0 ? agendaItems : [emptyMsg]),
  ]);

  // --- Meal Rounds ---
  const mealCards = (data.mealRounds || []).map((mr) => buildMealRoundCard(mr, data, onDataChange));
  const mealSection = el('div', { class: 'scheduling-section' }, [
    el('div', { class: 'scheduling-section__header' }, [el('h3', {}, 'Meal Rounds')]),
    ...(mealCards.length > 0
      ? mealCards
      : [el('p', { class: 'scheduling-empty' }, 'No meal rounds scheduled.')]),
  ]);

  // --- Tube Feedings ---
  const tfCards = (data.tubeFeedingSchedule || []).map((tf) =>
    buildTubeFeedingCard(tf, data, onDataChange),
  );
  const tubeSection = el('div', { class: 'scheduling-section' }, [
    el('div', { class: 'scheduling-section__header' }, [el('h3', {}, 'Active Tube Feedings')]),
    ...(tfCards.length > 0
      ? tfCards
      : [el('p', { class: 'scheduling-empty' }, 'No active tube feedings.')]),
  ]);

  // --- Action buttons ---
  const actions = el('div', { class: 'scheduling-actions' }, [
    el(
      'button',
      {
        class: 'btn primary small',
        onclick: () => {
          openAppointmentForm(null, (saved) => {
            data.appointments.push(saved);
            onDataChange(data);
            renderSchedulingPanel(container, data, onDataChange);
          });
        },
      },
      '+ Add Appointment',
    ),
    el(
      'button',
      {
        class: 'btn secondary small',
        onclick: () => {
          data.mealRounds.push(createBlankMealRound());
          onDataChange(data);
          renderSchedulingPanel(container, data, onDataChange);
        },
      },
      '+ Add Meal Round',
    ),
    el(
      'button',
      {
        class: 'btn secondary small',
        onclick: () => {
          data.tubeFeedingSchedule.push(createBlankTubeFeeding());
          onDataChange(data);
          renderSchedulingPanel(container, data, onDataChange);
        },
      },
      '+ Add Tube Feeding',
    ),
  ]);

  container.append(censusBar, agendaSection, mealSection, tubeSection, actions);
}

// --- Helpers ---

function censusTile(iconName, label, value) {
  const icon = el(
    'span',
    { class: 'material-symbols-outlined scheduling-census-tile__icon', 'aria-hidden': 'true' },
    iconName,
  );
  return el('div', { class: 'scheduling-census-tile' }, [
    icon,
    el('span', { class: 'scheduling-census-tile__value' }, String(value)),
    el('span', { class: 'scheduling-census-tile__label' }, label),
  ]);
}

function buildAppointmentCard(appt, data, onDataChange, container) {
  const priority = getPriorityById(appt.priority);
  const typeInfo = getAppointmentTypeById(appt.type);
  const ncpStep = NCP_STEPS.find((s) => s.id === appt.ncp_step);

  const statusSelect = el(
    'select',
    { class: 'scheduling-status-select' },
    APPOINTMENT_STATUSES.map((s) =>
      el('option', { value: s.id, ...(s.id === appt.status ? { selected: true } : {}) }, s.label),
    ),
  );
  statusSelect.addEventListener('change', () => {
    appt.status = statusSelect.value;
    onDataChange(data);
  });

  const deleteBtn = el(
    'button',
    {
      class: 'btn subtle-danger small scheduling-delete-btn',
      title: 'Remove appointment',
      onclick: () => {
        data.appointments = data.appointments.filter((a) => a.id !== appt.id);
        onDataChange(data);
        renderSchedulingPanel(container, data, onDataChange);
      },
    },
    '✕',
  );

  const editBtn = el(
    'button',
    {
      class: 'btn secondary small',
      onclick: () => {
        openAppointmentForm(appt, (updated) => {
          const idx = data.appointments.findIndex((a) => a.id === updated.id);
          if (idx >= 0) data.appointments[idx] = updated;
          onDataChange(data);
          renderSchedulingPanel(container, data, onDataChange);
        });
      },
    },
    'Edit',
  );

  return el(
    'div',
    {
      class: `scheduling-appt-card scheduling-appt-card--${appt.status}`,
      style: `border-left-color: ${priority.color}`,
    },
    [
      el('div', { class: 'scheduling-appt-card__time' }, [
        el('span', { class: 'scheduling-appt-card__time-text' }, appt.time || '--:--'),
        el('span', { class: 'scheduling-appt-card__duration' }, `${appt.duration} min`),
      ]),
      el('div', { class: 'scheduling-appt-card__body' }, [
        el('div', { class: 'scheduling-appt-card__title-row' }, [
          el('span', { class: 'scheduling-appt-card__type' }, typeInfo?.label || appt.type),
          el(
            'span',
            {
              class: `scheduling-badge scheduling-badge--${appt.priority}`,
              style: `background: ${priority.color}`,
            },
            priority.label.toUpperCase(),
          ),
          ncpStep
            ? el(
                'span',
                {
                  class: 'scheduling-badge scheduling-badge--ncp',
                  style: `background: ${ncpStep.color}`,
                },
                ncpStep.label,
              )
            : null,
        ]),
        appt.location
          ? el('div', { class: 'scheduling-appt-card__location' }, [
              el(
                'span',
                {
                  class: 'material-symbols-outlined',
                  'aria-hidden': 'true',
                  style: 'font-size:1rem;vertical-align:middle;margin-right:0.25rem',
                },
                'location_on',
              ),
              appt.location,
            ])
          : null,
        appt.reason ? el('div', { class: 'scheduling-appt-card__reason' }, appt.reason) : null,
        appt.cpt_code
          ? el('div', { class: 'scheduling-appt-card__cpt' }, `CPT: ${appt.cpt_code}`)
          : null,
      ]),
      el('div', { class: 'scheduling-appt-card__actions' }, [statusSelect, editBtn, deleteBtn]),
    ],
  );
}

function buildMealRoundCard(mr, data, onDataChange) {
  const mealInfo = MEAL_TYPES.find((m) => m.id === mr.mealType) || MEAL_TYPES[1];

  const checkbox = el('input', {
    type: 'checkbox',
    class: 'scheduling-checkbox',
    ...(mr.completed ? { checked: true } : {}),
  });
  checkbox.addEventListener('change', () => {
    mr.completed = checkbox.checked;
    onDataChange(data);
  });

  const patientsInput = el('input', {
    type: 'text',
    class: 'form-input-standard scheduling-inline-input',
    placeholder: 'Room numbers (e.g. 412, 415)',
    value: Array.isArray(mr.patients) ? mr.patients.join(', ') : '',
  });
  patientsInput.addEventListener('blur', () => {
    mr.patients = patientsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onDataChange(data);
  });

  const notesInput = el('input', {
    type: 'text',
    class: 'form-input-standard scheduling-inline-input',
    placeholder: 'Notes',
    value: mr.notes || '',
  });
  notesInput.addEventListener('blur', () => {
    mr.notes = notesInput.value.trim();
    onDataChange(data);
  });

  const mealSelect = el(
    'select',
    { class: 'form-input-standard scheduling-inline-select' },
    MEAL_TYPES.map((m) =>
      el('option', { value: m.id, ...(m.id === mr.mealType ? { selected: true } : {}) }, m.label),
    ),
  );
  mealSelect.addEventListener('change', () => {
    mr.mealType = mealSelect.value;
    onDataChange(data);
  });

  const removeBtn = el(
    'button',
    {
      class: 'btn subtle-danger small scheduling-delete-btn',
      title: 'Remove meal round',
      onclick: () => {
        data.mealRounds = data.mealRounds.filter((m) => m.id !== mr.id);
        onDataChange(data);
        // Re-render the containing panel
        const panel = removeBtn.closest('.scheduling-panel');
        if (panel) renderSchedulingPanel(panel, data, onDataChange);
      },
    },
    '✕',
  );

  return el(
    'div',
    { class: `scheduling-meal-card ${mr.completed ? 'scheduling-meal-card--done' : ''}` },
    [
      checkbox,
      el('div', { class: 'scheduling-meal-card__body' }, [
        el('div', { class: 'scheduling-meal-card__row' }, [
          mealSelect,
          el('span', { class: 'scheduling-meal-card__time' }, mealInfo.defaultTime),
        ]),
        el('div', { class: 'scheduling-meal-card__row' }, [
          el('span', { class: 'scheduling-meal-card__label' }, 'Rooms:'),
          patientsInput,
        ]),
        el('div', { class: 'scheduling-meal-card__row' }, [
          el('span', { class: 'scheduling-meal-card__label' }, 'Notes:'),
          notesInput,
        ]),
      ]),
      removeBtn,
    ],
  );
}

function buildTubeFeedingCard(tf, data, onDataChange) {
  function inlineField(label, value, onChange, type = 'text', opts = {}) {
    const input = el('input', {
      type,
      class: 'form-input-standard scheduling-inline-input',
      value: value || '',
      placeholder: opts.placeholder || '',
      ...(opts.step ? { step: opts.step } : {}),
    });
    input.addEventListener('blur', () => {
      onChange(type === 'number' ? parseFloat(input.value) || 0 : input.value.trim());
      onDataChange(data);
    });
    return el('div', { class: 'scheduling-tf-field' }, [
      el('span', { class: 'scheduling-tf-label' }, label),
      input,
    ]);
  }

  const formulaSelect = el(
    'select',
    { class: 'form-input-standard scheduling-inline-select' },
    COMMON_FORMULAS.map((f) =>
      el('option', { value: f, ...(f === tf.formula ? { selected: true } : {}) }, f),
    ),
  );
  formulaSelect.addEventListener('change', () => {
    tf.formula = formulaSelect.value;
    onDataChange(data);
  });

  const methodSelect = el(
    'select',
    { class: 'form-input-standard scheduling-inline-select' },
    TUBE_FEEDING_METHODS.map((m) =>
      el('option', { value: m.id, ...(m.id === tf.method ? { selected: true } : {}) }, m.label),
    ),
  );
  methodSelect.addEventListener('change', () => {
    tf.method = methodSelect.value;
    onDataChange(data);
  });

  const removeBtn = el(
    'button',
    {
      class: 'btn subtle-danger small scheduling-delete-btn',
      title: 'Remove tube feeding',
      onclick: () => {
        data.tubeFeedingSchedule = data.tubeFeedingSchedule.filter((t) => t.id !== tf.id);
        onDataChange(data);
        const panel = removeBtn.closest('.scheduling-panel');
        if (panel) renderSchedulingPanel(panel, data, onDataChange);
      },
    },
    '✕',
  );

  return el('div', { class: 'scheduling-tf-card' }, [
    el('div', { class: 'scheduling-tf-card__header' }, [
      el('div', { class: 'scheduling-tf-field' }, [
        el('span', { class: 'scheduling-tf-label' }, 'Formula'),
        formulaSelect,
      ]),
      el('div', { class: 'scheduling-tf-field' }, [
        el('span', { class: 'scheduling-tf-label' }, 'Method'),
        methodSelect,
      ]),
      removeBtn,
    ]),
    el('div', { class: 'scheduling-tf-card__details' }, [
      inlineField('Patient / Room', tf.patient, (v) => {
        tf.patient = v;
      }),
      inlineField(
        'Rate',
        tf.rate,
        (v) => {
          tf.rate = v;
        },
        'text',
        { placeholder: 'e.g. 60 mL/hr' },
      ),
      inlineField(
        'Start',
        tf.startTime,
        (v) => {
          tf.startTime = v;
        },
        'time',
      ),
      inlineField(
        'End',
        tf.endTime,
        (v) => {
          tf.endTime = v;
        },
        'time',
      ),
      inlineField(
        'Goal (kcal)',
        String(tf.goalCalories || ''),
        (v) => {
          tf.goalCalories = parseInt(v, 10) || 0;
        },
        'number',
      ),
    ]),
  ]);
}
