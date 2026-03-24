/**
 * Dietetics Faculty Cases — case management and creation for instructors.
 */
import { route } from '../../../core/router.js';
import { navigate as urlNavigate } from '../../../core/url.js';
import { el } from '../../../ui/utils.js';
import { storage } from '../../../core/index.js';

const STORE_KEY = 'dietetics_emr_cases';

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
        acuity: metaFields.acuity || 'Routine',
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

function deleteCase(id) {
  const cases = loadCases();
  delete cases[id];
  saveCases(cases);
  // Also clean up drafts
  storage.removeItem(`dietetics_draft_${id}`);
}

route('#/dietetics/instructor/cases', (wrapper) => {
  wrapper.replaceChildren();

  function render() {
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
      el('h1', {}, 'Dietetics — Faculty Dashboard'),
      el(
        'p',
        { class: 'text-secondary mb-16' },
        'Create and manage dietetics cases for your students.',
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
            urlNavigate('/dietetics/instructor/editor', { case: id });
          },
        },
        '+ Create Case',
      ),
    ]);

    if (caseList.length === 0) {
      wrapper.append(
        hero,
        el('div', { class: 'panel' }, [
          el('p', {}, 'No dietetics cases yet. Use the form above to create one.'),
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
          el('th', {}, 'Acuity'),
          el('th', {}, ''),
        ]),
      ),
      el(
        'tbody',
        {},
        caseList.map((c) => {
          const meta = c.caseObj?.meta || {};
          return el('tr', {}, [
            el('td', {}, c.title || meta.title || 'Untitled'),
            el('td', {}, meta.setting || ''),
            el('td', {}, meta.acuity || ''),
            el('td', { class: 'nowrap' }, [
              el(
                'button',
                {
                  class: 'btn primary small',
                  onclick: () => urlNavigate('/dietetics/instructor/editor', { case: c.id }),
                },
                'Edit',
              ),
              ' ',
              el(
                'button',
                {
                  class: 'btn subtle-danger small',
                  onclick: () => {
                    if (confirm(`Delete "${c.title}"? This cannot be undone.`)) {
                      deleteCase(c.id);
                      render();
                    }
                  },
                },
                'Delete',
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
  }

  render();
});
