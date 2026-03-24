/**
 * Dietetics Student Cases — case library and draft management.
 */
import { route } from '../../../core/router.js';
import { navigate as urlNavigate } from '../../../core/url.js';
import { el } from '../../../ui/utils.js';
import { storage } from '../../../core/index.js';

const STORE_KEY = 'dietetics_emr_cases';
const DRAFT_PREFIX = 'dietetics_draft_';

function loadCases() {
  try {
    const raw = storage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCases(cases) {
  storage.setItem(STORE_KEY, JSON.stringify(cases));
}

function getDraftStatus(caseId) {
  try {
    const raw = storage.getItem(`${DRAFT_PREFIX}${caseId}`);
    if (!raw) return 'not-started';
    const draft = JSON.parse(raw);
    const fields = [
      'nutrition_assessment',
      'nutrition_diagnosis',
      'nutrition_intervention',
      'nutrition_monitoring',
      'billing',
    ];

    function sectionHasContent(val) {
      if (!val) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (typeof val === 'object') {
        return Object.values(val).some((v) => {
          if (typeof v === 'string') return v.trim().length > 0;
          if (Array.isArray(v))
            return v.some(
              (item) =>
                typeof item === 'object' &&
                Object.values(item).some((s) => typeof s === 'string' && s.trim().length > 0),
            );
          return false;
        });
      }
      return false;
    }

    const filled = fields.filter((f) => sectionHasContent(draft[f])).length;
    const hasScheduling =
      draft.scheduling &&
      ((draft.scheduling.appointments && draft.scheduling.appointments.length > 0) ||
        (draft.scheduling.mealRounds && draft.scheduling.mealRounds.length > 0));
    const total = filled + (hasScheduling ? 1 : 0);
    if (total === 0) return 'not-started';
    if (total >= 6) return 'complete';
    return 'in-progress';
  } catch {
    return 'not-started';
  }
}

const STATUS_LABELS = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  complete: 'Complete',
};
const STATUS_CLASSES = {
  'not-started': 'status--not-started',
  'in-progress': 'status--in-progress',
  complete: 'status--complete',
};

function createNewCase(metaFields = {}) {
  const cases = loadCases();
  const id = `diet_case_${Date.now()}`;
  const title = metaFields.title || 'New Dietetics Case';
  cases[id] = {
    id,
    title,
    caseObj: {
      meta: {
        title,
        patientName: metaFields.patientName || '',
        dob: metaFields.dob || '',
        sex: metaFields.sex || '',
        setting: metaFields.setting || 'Inpatient',
        dietOrder: metaFields.dietOrder || '',
        allergies: metaFields.allergies || '',
      },
      nutritionAssessment: '',
      nutritionDiagnosis: '',
      nutritionIntervention: '',
      nutritionMonitoring: '',
      scheduling: null,
      billing: '',
    },
  };
  saveCases(cases);
  return id;
}

route('#/dietetics/student/cases', (wrapper) => {
  wrapper.replaceChildren();

  const cases = loadCases();
  const caseList = Object.values(cases);

  const field = (placeholder, style = '') =>
    el('input', {
      type: 'text',
      class: 'form-input-standard',
      placeholder,
      style: style || 'max-width:200px;',
    });

  const titleInput = field('Case title...', 'max-width:300px;');
  const nameInput = field('Patient name...');
  const dobInput = el('input', {
    type: 'date',
    class: 'form-input-standard',
    style: 'max-width:160px;',
  });
  const sexInput = field('Sex...');
  const dietInput = field('Diet order...');
  const allergyInput = field('Allergies...');

  const hero = el('div', { class: 'panel' }, [
    el('h1', {}, 'Dietetics — Student Cases'),
    el(
      'p',
      { class: 'text-secondary mb-16' },
      'Select a case to begin practicing Nutrition Care Process documentation and scheduling.',
    ),
    el('div', { class: 'note-editor__patient-edit-grid', style: 'margin-bottom:0.75rem;' }, [
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Case Title'),
        titleInput,
      ]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Patient Name'),
        nameInput,
      ]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Date of Birth'),
        dobInput,
      ]),
      el('div', { class: 'form-field' }, [el('label', { class: 'form-label' }, 'Sex'), sexInput]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Diet Order'),
        dietInput,
      ]),
      el('div', { class: 'form-field' }, [
        el('label', { class: 'form-label' }, 'Allergies'),
        allergyInput,
      ]),
    ]),
    el(
      'button',
      {
        class: 'btn primary',
        onclick: () => {
          const id = createNewCase({
            title: titleInput.value.trim() || 'New Dietetics Case',
            patientName: nameInput.value.trim(),
            dob: dobInput.value,
            sex: sexInput.value.trim(),
            dietOrder: dietInput.value.trim(),
            allergies: allergyInput.value.trim(),
          });
          urlNavigate('/dietetics/student/editor', { case: id });
        },
      },
      '+ New Case',
    ),
  ]);

  if (caseList.length === 0) {
    wrapper.append(hero);
    wrapper.append(
      el('div', { class: 'panel' }, [
        el(
          'p',
          {},
          'No dietetics cases available yet. Click "+ New Case" to create one, or ask your instructor for access.',
        ),
      ]),
    );
    return;
  }

  const table = el('table', { class: 'table cases-table' }, [
    el(
      'thead',
      {},
      el('tr', {}, [
        el('th', {}, 'Case Title'),
        el('th', {}, 'Setting'),
        el('th', {}, 'Draft Status'),
        el('th', {}, ''),
      ]),
    ),
    el(
      'tbody',
      {},
      caseList.map((c) => {
        const status = getDraftStatus(c.id);
        const meta = c.caseObj?.meta || {};
        return el('tr', {}, [
          el('td', {}, c.title || meta.title || 'Untitled'),
          el('td', {}, meta.setting || ''),
          el(
            'td',
            {},
            el('span', { class: `status ${STATUS_CLASSES[status]}` }, STATUS_LABELS[status]),
          ),
          el('td', { class: 'nowrap' }, [
            el(
              'button',
              {
                class: 'btn primary small',
                onclick: () => urlNavigate('/dietetics/student/editor', { case: c.id }),
              },
              status === 'not-started' ? 'Start Case' : 'Continue',
            ),
            ' ',
            el(
              'button',
              {
                class: 'btn subtle-danger small',
                onclick: () => {
                  if (confirm('Reset your draft work for this case?')) {
                    storage.removeItem(`${DRAFT_PREFIX}${c.id}`);
                    urlNavigate('/dietetics/student/cases');
                  }
                },
              },
              'Reset',
            ),
          ]),
        ]);
      }),
    ),
  ]);

  wrapper.append(
    hero,
    el('div', { class: 'panel' }, [el('div', { class: 'table-responsive' }, table)]),
  );
});
