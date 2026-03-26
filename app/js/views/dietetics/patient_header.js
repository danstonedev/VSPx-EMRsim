import { el } from '../../ui/utils.js';
import { createCustomSelect } from '../../ui/CustomSelect.js';
import { formatDOB } from '../CaseEditorUtils.js';

const AVATAR_MAP = {
  male: 'img/icon_male.png',
  female: 'img/icon_female.png',
  neutral: 'img/icon_unknown.png',
};

function normalizeSexForAvatar(value) {
  if (!value) return 'neutral';
  const s = String(value).toLowerCase().trim();
  if (s.startsWith('m')) return 'male';
  if (s.startsWith('f')) return 'female';
  return 'neutral';
}

function updatePatientAvatar(avatarEl, rawSex) {
  const sex = normalizeSexForAvatar(rawSex);
  const src = AVATAR_MAP[sex] || AVATAR_MAP.neutral;

  let img = avatarEl.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.decoding = 'async';
    img.className = 'patient-avatar-img';
    avatarEl.replaceChildren(img);
  }

  const altMap = {
    male: 'Male patient avatar',
    female: 'Female patient avatar',
    neutral: 'Patient avatar',
  };
  img.alt = altMap[sex] || 'Patient avatar';
  img.src = src;
}

function buildHeaderSelect({ id, srLabel, pillClass, selectClass, value, options, onChange }) {
  const select = createCustomSelect({
    value,
    options: options.map((option) => ({ value: option.id, label: option.label })),
    onChange,
    className: `note-editor__header-select ${selectClass}`.trim(),
    dataAttrs: {
      'aria-label': srLabel,
      id,
    },
  });

  return [
    el('label', { class: 'sr-only', for: id }, srLabel),
    el('div', { class: `note-editor__header-pill ${pillClass}`.trim() }, [select.element]),
  ];
}

export function createDieteticsPatientHeader({
  meta = {},
  patientName = '',
  materialIcon,
  backButton = null,
  professionOptions = [],
  selectedProfession = '',
  onProfessionChange = () => {},
  noteTypeOptions = [],
  selectedTemplateId = '',
  onNoteTypeChange = () => {},
}) {
  const dobFormatted = formatDOB(meta.dob || '');
  const avatarEl = el('div', { class: 'patient-avatar', 'aria-hidden': 'true' }, []);
  updatePatientAvatar(avatarEl, meta.sex);

  const detailChips = [
    meta.dietOrder ? el('span', {}, `Diet: ${meta.dietOrder}`) : null,
    meta.allergies
      ? el('span', { class: 'dietetics-allergy-badge' }, [
          materialIcon('warning'),
          ` ${meta.allergies}`,
        ])
      : null,
  ].filter(Boolean);

  const center = el('div', { class: 'patient-header-center' });

  function renderSelectors({
    nextProfessionOptions = professionOptions,
    nextSelectedProfession = selectedProfession,
    nextNoteTypeOptions = noteTypeOptions,
    nextSelectedTemplateId = selectedTemplateId,
  } = {}) {
    center.replaceChildren(
      ...buildHeaderSelect({
        id: 'patient-header-profession-select',
        srLabel: 'Profession',
        pillClass: 'note-editor__header-pill--profession',
        selectClass: 'note-editor__header-select--profession',
        value: nextSelectedProfession,
        options: nextProfessionOptions,
        onChange: onProfessionChange,
      }),
      ...buildHeaderSelect({
        id: 'patient-header-note-type-select',
        srLabel: 'Note type',
        pillClass: 'note-editor__header-pill--note-type',
        selectClass: 'note-editor__header-select--note-type',
        value: nextSelectedTemplateId,
        options: nextNoteTypeOptions,
        onChange: onNoteTypeChange,
      }),
    );
  }

  renderSelectors();

  const noteContext = el('div', {
    class: 'workspace-shell__header-note',
    'data-note-context': 'true',
  });

  const actions = el(
    'div',
    {
      id: 'patient-header-actions',
      class: 'patient-header-actions',
      'data-show-profession': 'false',
      'data-show-note-label': 'false',
    },
    [el('span', { class: 'note-editor__save-indicator' }, '')],
  );

  noteContext.append(center, actions);

  const element = el(
    'div',
    {
      id: 'patient-sticky-header',
      class: 'note-editor__patient-header note-editor__patient-header--dietetics',
    },
    [
      el('div', { class: 'workspace-shell__header-patient' }, [
        el('div', { class: 'patient-header-left' }, [
          backButton ? el('div', { class: 'workspace-shell__back-action' }, [backButton]) : null,
          avatarEl,
          el('div', { class: 'patient-header-text' }, [
            el('div', { class: 'note-editor__patient-name patient-name-line' }, [
              el('span', { class: 'dietetics-patient-name-primary' }, patientName),
              dobFormatted
                ? el('span', { class: 'dietetics-patient-name-dob' }, `DOB: ${dobFormatted}`)
                : null,
            ]),
            detailChips.length
              ? el('div', { class: 'note-editor__patient-details patient-demo-line' }, detailChips)
              : null,
          ]),
        ]),
      ]),
      noteContext,
    ],
  );

  function setNoteContextVisible(isVisible = true) {
    const visible = !!isVisible;
    noteContext.hidden = !visible;
    noteContext.setAttribute('aria-hidden', String(!visible));
    element.setAttribute('data-note-context-visible', visible ? 'true' : 'false');
  }

  setNoteContextVisible(true);

  return {
    element,
    updateSelectors({
      professionOptions: nextProfessionOptions = professionOptions,
      selectedProfession: nextSelectedProfession = selectedProfession,
      noteTypeOptions: nextNoteTypeOptions = noteTypeOptions,
      selectedTemplateId: nextSelectedTemplateId = selectedTemplateId,
    } = {}) {
      renderSelectors({
        nextProfessionOptions,
        nextSelectedProfession,
        nextNoteTypeOptions,
        nextSelectedTemplateId,
      });
    },
    setNoteContextVisible,
  };
}
