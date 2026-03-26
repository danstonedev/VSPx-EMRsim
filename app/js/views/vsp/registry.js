/**
 * VSP Registry — Faculty management view.
 *
 * Route: #/vsp/registry
 * Allows faculty to create, edit, and delete Virtual Standardized Patients.
 * The form is organized into collapsible sections that mirror a real EMR
 * patient chart: Identity, Demographics, Contact, Insurance, Clinical, and
 * Advance Directives.
 *
 * Patients created here are available for selection when creating cases
 * in any discipline (PT, Dietetics, etc.).
 */
import { route } from '../../core/router.js';
import { el } from '../../ui/utils.js';
import {
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  displayName,
  allergySummary,
  computeAge,
  SEX_OPTIONS,
  GENDER_IDENTITY_OPTIONS,
  RACE_OPTIONS,
  ETHNICITY_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  LANGUAGE_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  CODE_STATUS_OPTIONS,
  US_STATES,
} from '../../core/vsp-registry.js';

// ── Helpers ────────────────────────────────────────────────────────

function formatDob(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${m}-${d}-${y}`;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/** Create a form <select> populated from an options array. */
function buildSelect(
  opts,
  selected,
  { placeholder = 'Select…', cls = 'form-input-standard' } = {},
) {
  const children = [el('option', { value: '' }, placeholder)];
  for (const o of opts) {
    const opt = el('option', { value: o }, typeof o === 'string' ? o : String(o));
    if (selected === o) opt.selected = true;
    children.push(opt);
  }
  return el('select', { class: cls }, children);
}

/** Shorthand: labelled form field wrapper. */
function field(label, inputEl, { required = false } = {}) {
  return el('div', { class: 'form-field' }, [
    el('label', { class: 'form-label' }, required ? `${label} *` : label),
    inputEl,
  ]);
}

/** Create a collapsible section with a heading toggle. */
function section(title, children, { open = true } = {}) {
  const body = el('div', { class: 'vsp-form__section-body' }, children);
  body.style.display = open ? '' : 'none';

  const toggle = el(
    'button',
    {
      class: 'vsp-form__section-toggle',
      type: 'button',
      'aria-expanded': String(open),
      onclick: () => {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : '';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        toggle.querySelector('.vsp-form__section-arrow').textContent = isOpen ? '▸' : '▾';
      },
    },
    [el('span', { class: 'vsp-form__section-arrow' }, open ? '▾' : '▸'), ` ${title}`],
  );

  return el('div', { class: 'vsp-form__section' }, [toggle, body]);
}

// ── Allergy sub-form ───────────────────────────────────────────────

function buildAllergyEditor(allergies) {
  const list = [...(allergies || [])];
  const container = el('div', { class: 'vsp-allergy-editor' });

  function renderRows() {
    container.replaceChildren();
    if (list.length === 0) {
      container.append(
        el(
          'p',
          { class: 'text-secondary', style: 'font-size: 0.85rem;' },
          'NKDA — No known drug allergies.',
        ),
      );
    }
    list.forEach((a, i) => {
      const row = el('div', { class: 'vsp-allergy-editor__row' }, [
        el('input', {
          type: 'text',
          class: 'form-input-standard',
          placeholder: 'Allergen',
          value: a.name || '',
          oninput: (e) => {
            list[i].name = e.target.value;
          },
        }),
        el('input', {
          type: 'text',
          class: 'form-input-standard',
          placeholder: 'Type (drug, food…)',
          value: a.type || '',
          oninput: (e) => {
            list[i].type = e.target.value;
          },
        }),
        el('input', {
          type: 'text',
          class: 'form-input-standard',
          placeholder: 'Severity',
          value: a.severity || '',
          oninput: (e) => {
            list[i].severity = e.target.value;
          },
        }),
        el('input', {
          type: 'text',
          class: 'form-input-standard',
          placeholder: 'Reaction',
          value: a.reaction || '',
          oninput: (e) => {
            list[i].reaction = e.target.value;
          },
        }),
        el(
          'button',
          {
            type: 'button',
            class: 'btn subtle-danger small',
            onclick: () => {
              list.splice(i, 1);
              renderRows();
            },
          },
          '✕',
        ),
      ]);
      container.append(row);
    });
    container.append(
      el(
        'button',
        {
          type: 'button',
          class: 'btn secondary small',
          onclick: () => {
            list.push({ name: '', type: '', severity: '', reaction: '' });
            renderRows();
          },
        },
        '+ Add Allergy',
      ),
    );
  }

  renderRows();
  return { element: container, getData: () => list.filter((a) => a.name.trim()) };
}

// ── List sub-form (medical/surgical history) ───────────────────────

function buildListEditor(items, placeholder) {
  const list = [...(items || [])];
  const container = el('div', { class: 'vsp-list-editor' });

  function renderRows() {
    container.replaceChildren();
    list.forEach((item, i) => {
      container.append(
        el('div', { class: 'vsp-list-editor__row' }, [
          el('input', {
            type: 'text',
            class: 'form-input-standard',
            placeholder,
            value: item,
            oninput: (e) => {
              list[i] = e.target.value;
            },
          }),
          el(
            'button',
            {
              type: 'button',
              class: 'btn subtle-danger small',
              onclick: () => {
                list.splice(i, 1);
                renderRows();
              },
            },
            '✕',
          ),
        ]),
      );
    });
    container.append(
      el(
        'button',
        {
          type: 'button',
          class: 'btn secondary small',
          onclick: () => {
            list.push('');
            renderRows();
          },
        },
        `+ Add`,
      ),
    );
  }

  renderRows();
  return { element: container, getData: () => list.filter((s) => s.trim()) };
}

// ── Medication sub-form ────────────────────────────────────────────

function buildMedEditor(meds) {
  const list = [...(meds || [])];
  const container = el('div', { class: 'vsp-med-editor' });

  function renderRows() {
    container.replaceChildren();
    list.forEach((m, i) => {
      container.append(
        el('div', { class: 'vsp-med-editor__row' }, [
          el('input', {
            type: 'text',
            class: 'form-input-standard',
            placeholder: 'Medication',
            value: m.name || '',
            oninput: (e) => {
              list[i].name = e.target.value;
            },
          }),
          el('input', {
            type: 'text',
            class: 'form-input-standard',
            placeholder: 'Dose',
            value: m.dose || '',
            oninput: (e) => {
              list[i].dose = e.target.value;
            },
          }),
          el('input', {
            type: 'text',
            class: 'form-input-standard',
            placeholder: 'Frequency',
            value: m.frequency || '',
            oninput: (e) => {
              list[i].frequency = e.target.value;
            },
          }),
          el('input', {
            type: 'text',
            class: 'form-input-standard',
            placeholder: 'Route',
            value: m.route || '',
            oninput: (e) => {
              list[i].route = e.target.value;
            },
          }),
          el(
            'button',
            {
              type: 'button',
              class: 'btn subtle-danger small',
              onclick: () => {
                list.splice(i, 1);
                renderRows();
              },
            },
            '✕',
          ),
        ]),
      );
    });
    container.append(
      el(
        'button',
        {
          type: 'button',
          class: 'btn secondary small',
          onclick: () => {
            list.push({ name: '', dose: '', frequency: '', route: '' });
            renderRows();
          },
        },
        '+ Add Medication',
      ),
    );
  }

  renderRows();
  return { element: container, getData: () => list.filter((m) => m.name.trim()) };
}

// ── Patient form (shared for create + edit) ────────────────────────

function buildPatientForm({ patient, onSave, onCancel }) {
  const isEdit = !!patient;
  const p = patient || {};

  // Identity
  const firstNameIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'First',
    value: p.firstName || '',
  });
  const lastNameIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Last',
    value: p.lastName || '',
  });
  const middleNameIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Middle',
    value: p.middleName || '',
  });
  const preferredNameIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Preferred name / nickname',
    value: p.preferredName || '',
  });
  const mrnDisplay = isEdit ? el('span', { class: 'vsp-form__mrn' }, p.mrn || '—') : null;

  // Demographics
  const dobIn = el('input', { type: 'date', class: 'form-input-standard', value: p.dob || '' });
  const sexSel = buildSelect(SEX_OPTIONS.map(capitalize), capitalize(p.sex || 'unspecified'), {
    placeholder: 'Select…',
  });
  const genderSel = buildSelect(GENDER_IDENTITY_OPTIONS, p.genderIdentity || '', {
    placeholder: 'Select…',
  });
  const pronounsIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'e.g. she/her',
    value: p.pronouns || '',
  });
  const raceSel = buildSelect(RACE_OPTIONS, p.race || '', { placeholder: 'Select…' });
  const ethnicitySel = buildSelect(ETHNICITY_OPTIONS, p.ethnicity || '', {
    placeholder: 'Select…',
  });
  const maritalSel = buildSelect(MARITAL_STATUS_OPTIONS, p.maritalStatus || '', {
    placeholder: 'Select…',
  });
  const langSel = buildSelect(LANGUAGE_OPTIONS, p.preferredLanguage || 'English', {
    placeholder: 'Select…',
  });
  const interpreterCb = el('input', { type: 'checkbox', checked: !!p.interpreterNeeded });

  // Anthropometrics
  const heightFtIn = el('input', {
    type: 'number',
    class: 'form-input-standard',
    placeholder: 'ft',
    value: p.heightFt || '',
    min: '0',
    max: '8',
    style: 'width:4.5rem',
  });
  const heightInIn = el('input', {
    type: 'number',
    class: 'form-input-standard',
    placeholder: 'in',
    value: p.heightIn || '',
    min: '0',
    max: '11',
    style: 'width:4.5rem',
  });
  const weightIn = el('input', {
    type: 'number',
    class: 'form-input-standard',
    placeholder: 'lbs',
    value: p.weightLbs || '',
    min: '0',
    style: 'width:5.5rem',
  });
  const bloodSel = buildSelect(BLOOD_TYPE_OPTIONS, p.bloodType || '', { placeholder: 'Select…' });

  // Contact
  const phoneIn = el('input', {
    type: 'tel',
    class: 'form-input-standard',
    placeholder: '(555) 555-5555',
    value: p.phone || '',
  });
  const emailIn = el('input', {
    type: 'email',
    class: 'form-input-standard',
    placeholder: 'email@example.com',
    value: p.email || '',
  });
  const streetIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Street address',
    value: p.addressStreet || '',
  });
  const cityIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'City',
    value: p.addressCity || '',
  });
  const stateSel = buildSelect(US_STATES, p.addressState || '', { placeholder: 'State' });
  const zipIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'ZIP',
    value: p.addressZip || '',
    maxlength: '10',
    style: 'width:6rem',
  });

  // Emergency contact
  const ecNameIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Name',
    value: p.emergencyContactName || '',
  });
  const ecRelIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Relationship',
    value: p.emergencyContactRelationship || '',
  });
  const ecPhoneIn = el('input', {
    type: 'tel',
    class: 'form-input-standard',
    placeholder: 'Phone',
    value: p.emergencyContactPhone || '',
  });

  // Insurance
  const insProviderIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Insurance provider',
    value: p.insuranceProvider || '',
  });
  const insPolicyIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Policy #',
    value: p.insurancePolicyNumber || '',
  });
  const insGroupIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Group #',
    value: p.insuranceGroupNumber || '',
  });

  // Clinical
  const allergyEditor = buildAllergyEditor(p.allergies);
  const medHistoryEditor = buildListEditor(p.medicalHistory, 'Condition / diagnosis');
  const surgHistoryEditor = buildListEditor(p.surgicalHistory, 'Procedure (year)');
  const medEditor = buildMedEditor(p.activeMedications);

  // Advance directives
  const codeSel = buildSelect(CODE_STATUS_OPTIONS, p.codeStatus || 'Full Code', {
    placeholder: 'Select…',
  });
  const pcpIn = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Dr. Smith',
    value: p.primaryCareProvider || '',
  });

  const errorMsg = el('p', { class: 'form-error', style: 'display:none;color:var(--error,red);' });

  function collectFields() {
    return {
      firstName: firstNameIn.value,
      lastName: lastNameIn.value,
      middleName: middleNameIn.value,
      preferredName: preferredNameIn.value,
      dob: dobIn.value,
      sex: sexSel.value.toLowerCase() || 'unspecified',
      genderIdentity: genderSel.value,
      pronouns: pronounsIn.value,
      race: raceSel.value,
      ethnicity: ethnicitySel.value,
      maritalStatus: maritalSel.value,
      preferredLanguage: langSel.value,
      interpreterNeeded: interpreterCb.checked,
      heightFt: heightFtIn.value,
      heightIn: heightInIn.value,
      weightLbs: weightIn.value,
      bloodType: bloodSel.value,
      phone: phoneIn.value,
      email: emailIn.value,
      addressStreet: streetIn.value,
      addressCity: cityIn.value,
      addressState: stateSel.value,
      addressZip: zipIn.value,
      emergencyContactName: ecNameIn.value,
      emergencyContactRelationship: ecRelIn.value,
      emergencyContactPhone: ecPhoneIn.value,
      insuranceProvider: insProviderIn.value,
      insurancePolicyNumber: insPolicyIn.value,
      insuranceGroupNumber: insGroupIn.value,
      allergies: allergyEditor.getData(),
      medicalHistory: medHistoryEditor.getData(),
      surgicalHistory: surgHistoryEditor.getData(),
      activeMedications: medEditor.getData(),
      codeStatus: codeSel.value,
      primaryCareProvider: pcpIn.value,
    };
  }

  const form = el('div', { class: 'vsp-form panel' }, [
    el('h2', {}, isEdit ? `Edit Patient${p.mrn ? ` — ${p.mrn}` : ''}` : 'New Patient'),

    section('Identity', [
      el('div', { class: 'vsp-form__grid' }, [
        field('First Name', firstNameIn, { required: true }),
        field('Last Name', lastNameIn, { required: true }),
        field('Middle Name', middleNameIn),
        field('Preferred Name', preferredNameIn),
        ...(mrnDisplay ? [field('MRN', mrnDisplay)] : []),
      ]),
    ]),

    section('Demographics', [
      el('div', { class: 'vsp-form__grid' }, [
        field('Date of Birth', dobIn),
        field('Biological Sex', sexSel),
        field('Gender Identity', genderSel),
        field('Pronouns', pronounsIn),
        field('Race', raceSel),
        field('Ethnicity', ethnicitySel),
        field('Marital Status', maritalSel),
        field('Preferred Language', langSel),
        field(
          'Interpreter Needed',
          el('div', { style: 'padding-top:0.3rem;' }, [interpreterCb, ' Yes']),
        ),
      ]),
    ]),

    section(
      'Anthropometrics',
      [
        el('div', { class: 'vsp-form__grid' }, [
          field(
            'Height',
            el('div', { class: 'vsp-form__inline' }, [
              heightFtIn,
              el('span', {}, 'ft'),
              heightInIn,
              el('span', {}, 'in'),
            ]),
          ),
          field(
            'Weight',
            el('div', { class: 'vsp-form__inline' }, [weightIn, el('span', {}, 'lbs')]),
          ),
          field('Blood Type', bloodSel),
        ]),
      ],
      { open: isEdit },
    ),

    section(
      'Contact Information',
      [
        el('div', { class: 'vsp-form__grid' }, [field('Phone', phoneIn), field('Email', emailIn)]),
        el('div', { class: 'vsp-form__grid' }, [
          field('Street Address', streetIn),
          field('City', cityIn),
          field('State', stateSel),
          field('ZIP Code', zipIn),
        ]),
      ],
      { open: isEdit },
    ),

    section(
      'Emergency Contact',
      [
        el('div', { class: 'vsp-form__grid' }, [
          field('Name', ecNameIn),
          field('Relationship', ecRelIn),
          field('Phone', ecPhoneIn),
        ]),
      ],
      { open: isEdit },
    ),

    section(
      'Insurance',
      [
        el('div', { class: 'vsp-form__grid' }, [
          field('Provider', insProviderIn),
          field('Policy #', insPolicyIn),
          field('Group #', insGroupIn),
        ]),
      ],
      { open: isEdit },
    ),

    section(
      'Clinical Information',
      [
        field('Allergies', allergyEditor.element),
        field('Medical History / Problem List', medHistoryEditor.element),
        field('Surgical History', surgHistoryEditor.element),
        field('Active Medications', medEditor.element),
      ],
      { open: isEdit },
    ),

    section(
      'Advance Directives & Provider',
      [
        el('div', { class: 'vsp-form__grid' }, [
          field('Code Status', codeSel),
          field('Primary Care Provider', pcpIn),
        ]),
      ],
      { open: isEdit },
    ),

    errorMsg,
    el('div', { class: 'vsp-form__actions' }, [
      el(
        'button',
        {
          class: 'btn primary',
          onclick: () => {
            const f = collectFields();
            if (!f.firstName.trim() || !f.lastName.trim()) {
              errorMsg.textContent = 'First name and last name are required.';
              errorMsg.style.display = '';
              return;
            }
            errorMsg.style.display = 'none';
            onSave(f);
          },
        },
        isEdit ? 'Save Changes' : 'Create Patient',
      ),
      el('button', { class: 'btn secondary', onclick: onCancel }, 'Cancel'),
    ]),
  ]);

  requestAnimationFrame(() => firstNameIn.focus());
  return form;
}

// ── Patient table ──────────────────────────────────────────────────

function buildPatientTable(patients, { onEdit, onDelete }) {
  if (patients.length === 0) {
    return el('div', { class: 'panel' }, [
      el('p', { class: 'text-secondary' }, 'No patients in the registry yet. Create one above.'),
    ]);
  }

  return el('div', { class: 'panel' }, [
    el('div', { class: 'table-responsive' }, [
      el('table', { class: 'table cases-table' }, [
        el(
          'thead',
          {},
          el('tr', {}, [
            el('th', {}, 'MRN'),
            el('th', {}, 'Name'),
            el('th', {}, 'DOB'),
            el('th', {}, 'Age'),
            el('th', {}, 'Sex'),
            el('th', {}, 'Allergies'),
            el('th', {}, ''),
          ]),
        ),
        el(
          'tbody',
          {},
          patients.map((pt) => {
            const name = displayName(pt) || 'Unnamed';
            const age = computeAge(pt.dob);
            return el('tr', {}, [
              el(
                'td',
                { class: 'nowrap', style: 'font-family:monospace;font-size:0.85em;' },
                pt.mrn || '—',
              ),
              el('td', {}, name),
              el('td', { class: 'nowrap' }, formatDob(pt.dob)),
              el('td', {}, age != null ? String(age) : '—'),
              el('td', {}, capitalize(pt.sex)),
              el('td', {}, allergySummary(pt)),
              el('td', { class: 'nowrap' }, [
                el('button', { class: 'btn primary small', onclick: () => onEdit(pt) }, 'Edit'),
                ' ',
                el(
                  'button',
                  {
                    class: 'btn subtle-danger small',
                    onclick: () => {
                      if (
                        confirm(
                          `Delete patient "${name}"? Cases linked to this patient will retain their snapshot data but lose registry sync.`,
                        )
                      ) {
                        onDelete(pt.id);
                      }
                    },
                  },
                  'Delete',
                ),
              ]),
            ]);
          }),
        ),
      ]),
    ]),
  ]);
}

// ── Route ──────────────────────────────────────────────────────────

route('#/vsp/registry', (wrapper) => {
  wrapper.replaceChildren();

  let editingId = null;
  let showForm = false;

  function render() {
    wrapper.replaceChildren();
    const patients = listPatients();

    const hero = el('div', { class: 'panel' }, [
      el('h1', {}, 'Virtual Standardized Patient Registry'),
      el(
        'p',
        { class: 'text-secondary mb-16' },
        `Manage simulated patients for use across PT, Dietetics, and other disciplines. ${patients.length} patient${patients.length !== 1 ? 's' : ''} registered.`,
      ),
      ...(!showForm && !editingId
        ? [
            el(
              'button',
              {
                class: 'btn primary',
                onclick: () => {
                  showForm = true;
                  render();
                },
              },
              '+ New Patient',
            ),
          ]
        : []),
    ]);

    const sections = [hero];

    if (showForm || editingId) {
      sections.push(
        buildPatientForm({
          patient: editingId ? patients.find((pt) => pt.id === editingId) : null,
          onSave: (fields) => {
            if (editingId) {
              updatePatient(editingId, fields);
            } else {
              createPatient(fields);
            }
            editingId = null;
            showForm = false;
            render();
          },
          onCancel: () => {
            editingId = null;
            showForm = false;
            render();
          },
        }),
      );
    }

    sections.push(
      buildPatientTable(patients, {
        onEdit: (pt) => {
          editingId = pt.id;
          showForm = false;
          render();
        },
        onDelete: (id) => {
          deletePatient(id);
          if (editingId === id) editingId = null;
          render();
        },
      }),
    );

    wrapper.append(...sections);
  }

  render();
});
