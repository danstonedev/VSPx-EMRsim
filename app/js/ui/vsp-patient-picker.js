/**
 * VSP Patient Picker — reusable UI component for case creation forms.
 *
 * Provides:
 *  - A list of existing VSP patients to select from
 *  - An inline "create new patient" form (saves to registry)
 *
 * Every patient is stored in the VSP registry so demographics stay
 * consistent across disciplines.
 *
 * Usage:
 *   import { buildPatientPicker } from '../../ui/vsp-patient-picker.js';
 *   const picker = buildPatientPicker({ onSelect(vspId, demographics) {} });
 *   container.append(picker.element);
 */
import { el } from './utils.js';
import {
  listPatients,
  createPatient,
  displayName,
  allergySummary,
  computeAge,
  SEX_OPTIONS,
} from '../core/vsp-registry.js';

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function formatDob(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}-${d}-${y}`;
}

/**
 * Build a patient picker component.
 * @param {Object} opts
 * @param {Function} opts.onSelect - Called with (vspId, patientRecord)
 * @returns {{ element: HTMLElement, getSelection: Function, refresh: Function }}
 */
export function buildPatientPicker({ onSelect } = {}) {
  let selectedVspId = null;
  let mode = 'pick'; // 'pick' | 'create'
  let searchTerm = '';

  const container = el('div', { class: 'vsp-picker' });

  function notify(vspId, record) {
    selectedVspId = vspId;
    if (onSelect) onSelect(vspId, record);
  }

  function renderPicker() {
    container.replaceChildren();
    const patients = listPatients();

    // Mode switcher
    const tabs = el(
      'div',
      { class: 'vsp-picker__tabs', style: 'display:flex;gap:0.5rem;margin-bottom:0.75rem;' },
      [
        el(
          'button',
          {
            class: `btn small ${mode === 'pick' ? 'primary' : 'secondary'}`,
            onclick: () => {
              mode = 'pick';
              renderPicker();
            },
          },
          'Select Patient',
        ),
        el(
          'button',
          {
            class: `btn small ${mode === 'create' ? 'primary' : 'secondary'}`,
            onclick: () => {
              mode = 'create';
              renderPicker();
            },
          },
          'New Patient',
        ),
      ],
    );

    container.append(tabs);

    if (mode === 'pick') {
      renderSelectMode(patients);
    } else {
      renderCreateMode();
    }
  }

  // ── Select existing patient ────────────────────────────────────

  function renderSelectMode(patients) {
    if (patients.length === 0) {
      container.append(
        el(
          'p',
          { class: 'text-secondary', style: 'font-size:0.9rem;' },
          'No patients in the registry yet. Switch to "New Patient" to create one.',
        ),
      );
      return;
    }

    // Search / filter
    const searchInput = el('input', {
      type: 'text',
      class: 'form-input-standard',
      placeholder: 'Search by name, MRN…',
      value: searchTerm,
      oninput: (e) => {
        searchTerm = e.target.value;
        renderList();
      },
    });
    container.append(el('div', { style: 'margin-bottom:0.5rem;' }, [searchInput]));

    const listEl = el('div', {
      class: 'vsp-picker__list',
      style: 'display:flex;flex-direction:column;gap:0.35rem;max-height:320px;overflow-y:auto;',
    });
    container.append(listEl);

    function renderList() {
      listEl.replaceChildren();
      const term = searchTerm.toLowerCase();
      const filtered = term
        ? patients.filter((pt) => {
            const haystack = [displayName(pt), pt.mrn, pt.preferredName].join(' ').toLowerCase();
            return haystack.includes(term);
          })
        : patients;

      if (filtered.length === 0) {
        listEl.append(
          el(
            'p',
            { class: 'text-secondary', style: 'font-size:0.85rem;' },
            'No patients match your search.',
          ),
        );
        return;
      }

      for (const pt of filtered) {
        const isSelected = selectedVspId === pt.id;
        const name = displayName(pt) || 'Unnamed';
        const age = computeAge(pt.dob);
        const details = [
          pt.mrn,
          formatDob(pt.dob),
          age != null ? `${age} yo` : null,
          capitalize(pt.sex),
        ]
          .filter(Boolean)
          .join(' · ');

        const allergyStr = allergySummary(pt);

        const card = el(
          'button',
          {
            class: `vsp-picker__card ${isSelected ? 'vsp-picker__card--selected' : ''}`,
            onclick: () => {
              notify(pt.id, pt);
              renderPicker();
            },
          },
          [
            el(
              'div',
              { class: 'vsp-picker__card-main' },
              [
                el('strong', {}, name),
                pt.preferredName
                  ? el('span', { class: 'vsp-picker__card-nickname' }, `"${pt.preferredName}"`)
                  : null,
              ].filter(Boolean),
            ),
            el('div', { class: 'vsp-picker__card-details' }, details),
            el(
              'div',
              {
                class: `vsp-picker__card-allergy ${allergyStr !== 'NKDA' ? 'vsp-picker__card-allergy--alert' : ''}`,
              },
              [
                el('span', { class: 'vsp-picker__card-allergy-label' }, 'Allergies: '),
                el('span', {}, allergyStr),
              ],
            ),
          ],
        );
        listEl.append(card);
      }
    }

    renderList();
    requestAnimationFrame(() => searchInput.focus());
  }

  // ── Create new patient inline ──────────────────────────────────

  function renderCreateMode() {
    const firstNameIn = el('input', {
      type: 'text',
      class: 'form-input-standard',
      placeholder: 'First name *',
    });
    const lastNameIn = el('input', {
      type: 'text',
      class: 'form-input-standard',
      placeholder: 'Last name *',
    });
    const dobInput = el('input', { type: 'date', class: 'form-input-standard' });
    const sexSelect = el(
      'select',
      { class: 'form-input-standard' },
      SEX_OPTIONS.map((s) => el('option', { value: s }, capitalize(s))),
    );

    const errorMsg = el('p', {
      class: 'form-error',
      style: 'display:none;color:var(--error,red);font-size:0.85rem;',
    });

    const form = el('div', { class: 'note-editor__patient-edit-grid' }, [
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'First Name *'),
        firstNameIn,
      ]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Last Name *'),
        lastNameIn,
      ]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Date of Birth'),
        dobInput,
      ]),
      el('div', { class: 'form-field' }, [el('label', { class: 'form-label' }, 'Sex'), sexSelect]),
    ]);

    const hint = el(
      'p',
      { class: 'text-secondary', style: 'font-size:0.82rem;margin-top:0.25rem;' },
      'A quick-create with essentials. Full demographics can be added in the Patient Registry.',
    );

    const addBtn = el(
      'button',
      {
        class: 'btn primary small',
        style: 'margin-top:0.5rem;',
        onclick: () => {
          const fName = firstNameIn.value.trim();
          const lName = lastNameIn.value.trim();
          if (!fName || !lName) {
            errorMsg.textContent = 'First and last name are required.';
            errorMsg.style.display = '';
            return;
          }
          errorMsg.style.display = 'none';
          const record = createPatient({
            firstName: fName,
            lastName: lName,
            dob: dobInput.value,
            sex: sexSelect.value,
          });
          mode = 'pick';
          notify(record.id, record);
          renderPicker();
        },
      },
      'Create & Select',
    );

    container.append(form, hint, errorMsg, addBtn);
    requestAnimationFrame(() => firstNameIn.focus());
  }

  // ── Public API ─────────────────────────────────────────────────

  renderPicker();

  return {
    element: container,
    getSelection: () => ({ vspId: selectedVspId }),
    refresh: renderPicker,
  };
}
