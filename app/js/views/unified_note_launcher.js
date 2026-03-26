import { route } from '../core/router.js';
import { navigate as urlNavigate } from '../core/url.js';
import { getCurrentUser, ROLES } from '../core/auth.js';
import { getCurrentProfession, setCurrentProfession } from '../core/professions.js';
import {
  launchUnifiedNote,
  listUnifiedFunnelProfessions,
  listUnifiedFunnelTemplates,
} from '../core/unified-note-funnel.js';
import {
  getAccessCapability,
  getAccessRole,
  setAccessCapability,
  setAccessRole,
} from '../ui/AccessGate.js';
import { el } from '../ui/utils.js';
import { buildPatientPicker } from '../ui/vsp-patient-picker.js';

const ROLE_RANK = { student: 0, faculty: 1, admin: 2 };
const ROLE_META = {
  student: { label: 'Student' },
  faculty: { label: 'Faculty' },
  admin: { label: 'Admin' },
};
const PROFESSION_META = {
  pt: { label: 'Physical Therapy', shortLabel: 'PT' },
  dietetics: { label: 'Dietetics', shortLabel: 'RDN' },
};

function normalizeRole(role) {
  return Object.hasOwn(ROLE_RANK, role) ? role : 'student';
}

function sanitizeTemplate(professionId, templateId) {
  const templates = listUnifiedFunnelTemplates(professionId);
  if (!templates.length) return '';
  if (templates.some((template) => template.id === templateId)) return templateId;
  return templates[0].id;
}

function sanitizeProfessionId(professionId) {
  const professions = listUnifiedFunnelProfessions();
  return professions.some((option) => option.id === professionId) ? professionId : 'pt';
}

function buildSettingOptions() {
  return ['Outpatient', 'Inpatient', 'Home Health', 'SNF', 'Acute Rehab', 'Other'];
}

function buildAcuityOptions() {
  return ['acute', 'subacute', 'chronic', 'unspecified'];
}

function buildAvailableRoles(capability, user) {
  const availableRoles = ['student'];
  if (ROLE_RANK[capability] >= ROLE_RANK.faculty) {
    availableRoles.push('faculty');
  }
  const isAdminUser = Boolean(user?.roles?.includes(ROLES.ADMIN));
  if (ROLE_RANK[capability] >= ROLE_RANK.admin || isAdminUser) {
    availableRoles.push('admin');
  }
  return availableRoles;
}

function sanitizeRoleSelection(role, availableRoles, fallbackRole) {
  const requestedRole = normalizeRole(role);
  if (availableRoles.includes(requestedRole)) return requestedRole;
  if (availableRoles.includes(normalizeRole(fallbackRole))) return normalizeRole(fallbackRole);
  return availableRoles[0] || 'student';
}

function readQueryValue(query, key) {
  if (query && typeof query.get === 'function') {
    return query.get(key) || '';
  }
  return query?.[key] || '';
}

function getLaunchLabel(role) {
  if (role === 'student') return 'Open Chart';
  if (role === 'admin') return 'Open Admin Workspace';
  return 'Open Faculty Workspace';
}

function fillSelect(selectEl, options, preferred) {
  selectEl.replaceChildren(
    ...options.map((value) =>
      el(
        'option',
        {
          value,
          ...(value === preferred ? { selected: 'selected' } : {}),
        },
        value,
      ),
    ),
  );
}

export async function renderUnifiedWorkspace(
  wrapper,
  { query = {}, preferredRole = '', heading = 'Unified Workspace' } = {},
) {
  wrapper.replaceChildren();

  const currentUser = await getCurrentUser().catch(() => null);
  if (currentUser?.roles?.includes(ROLES.ADMIN)) {
    setAccessCapability('admin');
  }

  const capability = getAccessCapability();
  const availableRoles = buildAvailableRoles(capability, currentUser);
  let selectedRole = sanitizeRoleSelection(
    readQueryValue(query, 'role') || preferredRole || getAccessRole(),
    availableRoles,
    capability,
  );
  let selectedProfession = sanitizeProfessionId(
    readQueryValue(query, 'profession') || getCurrentProfession() || 'pt',
  );
  let selectedTemplateId = sanitizeTemplate(selectedProfession, readQueryValue(query, 'template'));
  let selectedPatient = null;
  let submitting = false;

  setAccessRole(selectedRole);
  setCurrentProfession(selectedProfession);

  const page = el('main', { class: 'homev2 workspace-launcher' });
  const hero = el('header', { class: 'workspace-hero' }, [
    el('div', { class: 'workspace-hero__eyebrow' }, 'Workspace'),
    el('h1', {}, heading),
    el('p', {}, 'Choose a mode, pick a patient, and continue.'),
  ]);

  const modeSection = el('section', { class: 'homev2-card workspace-stage' });
  const roleSelect = el('select', {
    class: 'form-input-standard workspace-select',
    onchange: (event) => {
      selectedRole = normalizeRole(event.target.value);
      syncActiveRole();
      renderRoleOptions();
      renderAdvancedFields();
      refreshWorkspaceState();
    },
  });
  const professionSelect = el('select', {
    class: 'form-input-standard workspace-select',
    onchange: (event) => {
      selectedProfession = sanitizeProfessionId(event.target.value);
      selectedTemplateId = sanitizeTemplate(selectedProfession, selectedTemplateId);
      setCurrentProfession(selectedProfession);
      renderProfessionOptions();
      renderTemplateOptions();
      renderAdvancedFields();
      refreshWorkspaceState();
    },
  });
  modeSection.append(
    el('div', { class: 'workspace-stage__header' }, [
      el('h2', {}, 'Mode'),
      el('span', { class: 'workspace-stage__meta' }, 'Start here'),
    ]),
    el('div', { class: 'workspace-stage__body workspace-stage__body--dual' }, [
      el('div', { class: 'workspace-group' }, [
        el('div', { class: 'workspace-group__label' }, 'Role'),
        roleSelect,
      ]),
      el('div', { class: 'workspace-group' }, [
        el('div', { class: 'workspace-group__label' }, 'Discipline'),
        professionSelect,
      ]),
    ]),
  );

  const patientSection = el('section', {
    class: 'homev2-card workspace-stage workspace-stage--patient',
  });
  const registryBtn = el(
    'button',
    {
      class: 'btn secondary workspace-stage__secondary-action',
      type: 'button',
      onclick: () => {
        syncActiveRole();
        urlNavigate('/vsp/registry');
      },
    },
    'Patient Registry',
  );
  const picker = buildPatientPicker({
    onSelect: (_vspId, record) => {
      selectedPatient = record || null;
      renderTemplateOptions();
      renderAdvancedFields();
      refreshWorkspaceState();
    },
    pickLabel: 'Existing',
    createLabel: 'New',
    searchPlaceholder: 'Search patient',
    emptyMessage: 'No patients yet. Create one to continue.',
    emptySearchMessage: 'No matching patients.',
    createHintText: 'Quick create. Add full demographics later in the registry.',
  });
  patientSection.append(
    el('div', { class: 'workspace-stage__header' }, [
      el('div', { class: 'workspace-stage__header-copy' }, [
        el('h2', {}, 'Patient'),
        el('span', { class: 'workspace-stage__meta' }, 'Choose or create'),
      ]),
      el('div', { class: 'workspace-stage__header-actions' }, [registryBtn]),
    ]),
    el('div', { class: 'workspace-patient-shell' }, [picker.element]),
  );

  const noteSection = el('section', { class: 'homev2-card workspace-stage workspace-stage--note' });
  const templateGrid = el('div', { class: 'workspace-note-grid' });
  const advancedDetails = el('details', { class: 'workspace-advanced', hidden: 'hidden' }, [
    el('summary', { class: 'workspace-advanced__summary' }, 'Options'),
  ]);
  const advancedFields = el('div', { class: 'workspace-advanced__grid' });
  advancedDetails.append(advancedFields);
  const launchStatus = el('p', { class: 'workspace-note__status' });
  const launchBtn = el(
    'button',
    {
      class: 'btn primary workspace-note__primary',
      onclick: async () => {
        if (submitting || !selectedPatient || !selectedTemplateId) return;
        submitting = true;
        syncActiveRole();
        refreshWorkspaceState();
        launchStatus.textContent = 'Opening workspace...';

        try {
          const envelope = await launchUnifiedNote({
            patientRecord: selectedPatient,
            professionId: selectedProfession,
            templateId: selectedTemplateId,
            isFacultyMode: selectedRole !== 'student',
            title: titleInput.value,
            setting: settingSelect.value,
            acuity: acuitySelect.value,
            dietOrder: dietOrderInput.value,
          });
          launchStatus.textContent = 'Redirecting...';
          window.location.hash = envelope.compatibility.routeHash;
        } catch (error) {
          console.error('[UnifiedWorkspace] Failed to launch note:', error);
          launchStatus.textContent = `Unable to launch note: ${error.message}`;
          submitting = false;
          refreshWorkspaceState();
        }
      },
    },
    getLaunchLabel(selectedRole),
  );
  const launchHint = el('p', { class: 'workspace-note__hint' });
  noteSection.append(
    el('div', { class: 'workspace-stage__header' }, [
      el('h2', {}, 'Note'),
      el('span', { class: 'workspace-stage__meta' }, 'Choose a workspace'),
    ]),
    templateGrid,
    advancedDetails,
    el('div', { class: 'workspace-note__footer' }, [
      el('div', { class: 'workspace-note__copy' }, [launchHint, launchStatus]),
      el('div', { class: 'workspace-note__actions' }, [launchBtn]),
    ]),
  );

  const titleInput = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Custom title',
  });
  const settingSelect = el('select', { class: 'form-input-standard' });
  const acuitySelect = el('select', { class: 'form-input-standard' });
  const dietOrderInput = el('input', {
    type: 'text',
    class: 'form-input-standard',
    placeholder: 'Diet order',
  });

  page.append(hero, modeSection, patientSection, noteSection);
  wrapper.append(page);

  function syncActiveRole() {
    if (selectedRole === 'admin') {
      setAccessCapability('admin');
    }
    setAccessRole(selectedRole);
  }

  function renderRoleOptions() {
    roleSelect.replaceChildren(
      ...availableRoles.map((roleId) =>
        el(
          'option',
          {
            value: roleId,
            ...(selectedRole === roleId ? { selected: 'selected' } : {}),
          },
          ROLE_META[roleId]?.label || roleId,
        ),
      ),
    );
  }

  function renderProfessionOptions() {
    const professions = listUnifiedFunnelProfessions();
    professionSelect.replaceChildren(
      ...professions.map((option) =>
        el(
          'option',
          {
            value: option.id,
            ...(selectedProfession === option.id ? { selected: 'selected' } : {}),
          },
          PROFESSION_META[option.id]?.label || option.label,
        ),
      ),
    );
  }

  function renderTemplateOptions() {
    const templates = listUnifiedFunnelTemplates(selectedProfession);
    selectedTemplateId = sanitizeTemplate(selectedProfession, selectedTemplateId);
    templateGrid.replaceChildren(
      ...templates.map((template) =>
        el(
          'button',
          {
            type: 'button',
            class: `workspace-note-card ${selectedTemplateId === template.id ? 'workspace-note-card--active' : ''}`,
            onclick: () => {
              selectedTemplateId = template.id;
              renderTemplateOptions();
              refreshWorkspaceState();
            },
          },
          [el('strong', {}, template.shortLabel || template.label), el('span', {}, template.label)],
        ),
      ),
    );
  }

  function renderAdvancedFields() {
    fillSelect(
      settingSelect,
      buildSettingOptions(),
      selectedProfession === 'dietetics' ? 'Inpatient' : 'Outpatient',
    );
    fillSelect(acuitySelect, buildAcuityOptions(), 'unspecified');

    const fields = [
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Title'),
        titleInput,
      ]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Setting'),
        settingSelect,
      ]),
    ];

    if (selectedRole !== 'student') {
      fields.push(
        el('div', { class: 'form-field' }, [
          el('label', { class: 'form-label' }, 'Acuity'),
          acuitySelect,
        ]),
      );
    }

    if (selectedProfession === 'dietetics') {
      fields.push(
        el('div', { class: 'form-field' }, [
          el('label', { class: 'form-label' }, 'Diet Order'),
          dietOrderInput,
        ]),
      );
    } else {
      dietOrderInput.value = '';
    }

    advancedFields.replaceChildren(...fields);
  }

  function refreshWorkspaceState() {
    const canLaunch = Boolean(selectedPatient && selectedTemplateId && !submitting);
    const hasPatient = Boolean(selectedPatient);
    const hasAdvancedFields = selectedRole !== 'student' || selectedProfession === 'dietetics';

    advancedDetails.hidden = !hasAdvancedFields;

    launchBtn.disabled = !canLaunch;
    launchBtn.textContent = submitting ? 'Opening...' : getLaunchLabel(selectedRole);

    if (!hasPatient) {
      launchHint.textContent = 'Select a patient to continue.';
    } else {
      launchHint.textContent = `${PROFESSION_META[selectedProfession]?.shortLabel || selectedProfession} | ${ROLE_META[selectedRole]?.label || selectedRole}`;
    }

    if (!submitting) {
      launchStatus.textContent = '';
    }

    registryBtn.style.display = selectedRole === 'student' ? 'none' : '';
  }

  renderRoleOptions();
  renderProfessionOptions();
  renderTemplateOptions();
  renderAdvancedFields();
  refreshWorkspaceState();
}

route('#/workspace', (wrapper, query) =>
  renderUnifiedWorkspace(wrapper, {
    query,
    heading: 'Unified Workspace',
  }),
);

route('#/student/launch-note', (wrapper, query) =>
  renderUnifiedWorkspace(wrapper, {
    query,
    preferredRole: 'student',
    heading: 'Unified Workspace',
  }),
);

route('#/instructor/launch-note', (wrapper, query) =>
  renderUnifiedWorkspace(wrapper, {
    query,
    preferredRole: 'faculty',
    heading: 'Unified Workspace',
  }),
);
