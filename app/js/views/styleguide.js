/**
 * Style Guide View
 * Comprehensive reference for UI components, tokens, and patterns
 *
 * NOTE: Uses CSS classes from styleguide.css - NO inline styles
 */
import { el } from '../ui/utils.js';
import { inputField, selectField, textAreaField } from '../ui/form-components.js';
import { createCustomSelect } from '../ui/CustomSelect.js';
import { route } from '../core/index.js';
import { showToast } from '../ui/toast.js';
import { openSignatureDialog } from '../features/signature/SignatureModal.js';
import { openEditCaseModal } from '../features/navigation/modal.js';
import { openAddArtifactModal } from '../features/navigation/ChartNavigation.js';

// Lazy-load styleguide CSS
const loadStyleguideCSS = () => {
  if (!document.querySelector('link[href*="styleguide.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/styleguide.css';
    document.head.appendChild(link);
  }
};

function lockStyleguideScroll() {
  document.documentElement.classList.add('sg-modal-locked');
  if (document.body) document.body.classList.add('sg-modal-locked');
}

function unlockStyleguideScroll() {
  document.documentElement.classList.remove('sg-modal-locked');
  if (document.body) document.body.classList.remove('sg-modal-locked');
}

const DEMO_ICD10_CODES = [
  { code: 'M54.5', desc: 'Low back pain' },
  { code: 'M54.2', desc: 'Cervicalgia' },
  { code: 'M54.6', desc: 'Pain in thoracic spine' },
  { code: 'S13.4', desc: 'Sprain of cervical ligaments' },
  { code: 'S33.5', desc: 'Sprain of lumbar spine' },
  { code: 'S43.4', desc: 'Sprain of rotator cuff capsules' },
];

const ICON_NAMES = [
  'eye',
  'download',
  'print',
  'save',
  'edit',
  'plus',
  'close',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'copy',
  'trash',
  'sort',
  'share',
  'preview',
  'check',
  'home',
  'user',
  'menu',
  'search',
  'refresh',
];

const MODAL_VARIANTS = [
  {
    title: 'Case Creation Modal',
    description: 'Full-screen overlay used for building or editing case metadata.',
    tags: ['modal-overlay', 'case-details-modal'],
    open: () => openCaseModalDemo(),
  },
  {
    title: 'Artifact Viewer Modal',
    description: 'Read-only modal with scrollable body for attachments and artifacts.',
    tags: ['popup-card-base', 'modal-actions'],
    open: () => openArtifactModalDemo(),
  },
  {
    title: 'Signature Capture Modal',
    description: 'Dedicated layout for attestation and drawing signature strokes.',
    tags: ['signature-overlay', 'signature-modal'],
    open: () => openSignatureModalDemo(),
  },
  {
    title: 'ICD-10 Search Modal',
    description: 'Typeahead search modal surfaced from billing tables.',
    tags: ['sg-modal-overlay', 'sg-modal'],
    open: () => openSearchModalDemo(),
  },
];

route('#/styleguide', (app) => {
  loadStyleguideCSS();
  app.replaceChildren(renderStyleGuide());
});

function renderStyleGuide() {
  const container = el('div', { class: 'styleguide-container' });

  // Header with Theme Toggle
  const header = el('div', { class: 'styleguide-header' });
  header.appendChild(
    el('div', {}, [
      el('h1', { class: 'styleguide-header__title' }, 'UI Style Guide'),
      el(
        'p',
        { class: 'styleguide-header__subtitle' },
        'A reference for all UI components, tokens, and table styles used in the application.',
      ),
    ]),
  );

  const themeToggle = el('button', { class: 'btn secondary' }, 'Toggle Theme');
  themeToggle.onclick = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
  };
  header.appendChild(themeToggle);
  container.appendChild(header);

  // 1. Design Tokens
  container.appendChild(createSectionTitle('1. Design Tokens'));
  container.appendChild(renderColorSwatches());

  // 2. Typography
  container.appendChild(createSectionTitle('2. Typography'));
  container.appendChild(renderTypography());

  // 3. Buttons
  container.appendChild(createSectionTitle('3. Buttons'));
  container.appendChild(renderButtons());

  // 4. Inputs
  container.appendChild(createSectionTitle('4. Inputs'));
  container.appendChild(renderInputs());

  // 5. Tables
  container.appendChild(createSectionTitle('5. Tables'));
  container.appendChild(renderTables());

  // 6. Feedback & Overlays
  container.appendChild(createSectionTitle('6. Feedback & Overlays'));
  container.appendChild(renderFeedback());

  // 7. Layout Components
  container.appendChild(createSectionTitle('7. Layout Components'));
  container.appendChild(renderLayoutComponents());

  // 8. Icons
  container.appendChild(createSectionTitle('8. Icons'));
  container.appendChild(renderIcons());

  // 9. Modal Library
  container.appendChild(createSectionTitle('9. Modal Library'));
  container.appendChild(renderModals());

  return container;
}

function createSectionTitle(text) {
  return el('h2', { class: 'sg-section-title' }, text);
}

function renderColorSwatches() {
  const wrapper = el('div', { class: 'sg-color-grid' });

  // Core semantic tokens from PROPOSED_TOKENS.css and styles.css
  const colors = [
    { name: '--und-green', var: 'var(--und-green)', desc: 'Brand primary' },
    { name: '--und-orange', var: 'var(--und-orange)', desc: 'Accent/Warning' },
    { name: '--color-bg', var: 'var(--color-bg)', desc: 'Page background' },
    { name: '--surface', var: 'var(--surface)', desc: 'Card/Panel surface' },
    { name: '--text', var: 'var(--text)', desc: 'Primary text' },
    { name: '--text-secondary', var: 'var(--text-secondary)', desc: 'Secondary text' },
    { name: '--text-muted', var: 'var(--text-muted)', desc: 'Muted/hint text' },
    { name: '--color-border', var: 'var(--color-border)', desc: 'Default border' },
    { name: '--color-border-strong', var: 'var(--color-border-strong)', desc: 'Emphasized border' },
    { name: '--surface-table-head', var: 'var(--surface-table-head)', desc: 'Table header bg' },
    { name: '--danger-600', var: 'var(--danger-600)', desc: 'Error/danger' },
    { name: '--success-600', var: 'var(--success-600)', desc: 'Success state' },
  ];

  colors.forEach((c) => {
    const swatch = el('div', { class: 'sg-swatch' });
    const colorBox = el('div', { class: 'sg-swatch__color' });
    colorBox.style.background = c.var;
    const label = el('div', { class: 'sg-swatch__label' }, [
      el('div', { class: 'sg-swatch__name' }, c.name),
      el('div', { class: 'sg-swatch__var' }, c.desc),
    ]);
    swatch.appendChild(colorBox);
    swatch.appendChild(label);
    wrapper.appendChild(swatch);
  });

  return wrapper;
}

function renderTypography() {
  const wrapper = el('div', { class: 'sg-typography-stack' });

  const scales = [
    { token: '--font-xl', size: '1.25rem', label: 'Extra Large (20px)' },
    { token: '--font-lg', size: '1.125rem', label: 'Large (18px)' },
    { token: '--font-base', size: '1rem', label: 'Base (16px)' },
    { token: '--font-md', size: '0.875rem', label: 'Medium (14px)' },
    { token: '--font-sm', size: '0.8125rem', label: 'Small (13px)' },
    { token: '--font-xs', size: '0.75rem', label: 'Extra Small (12px)' },
  ];

  scales.forEach((s) => {
    const row = el('div', { class: 'sg-type-sample' });
    const tokenLabel = el('span', { class: 'sg-type-sample__token' }, s.token);
    const sample = el('span', {});
    sample.textContent = `${s.label} – The quick brown fox`;
    sample.style.fontSize = `var(${s.token})`;
    row.appendChild(tokenLabel);
    row.appendChild(sample);
    wrapper.appendChild(row);
  });

  return wrapper;
}

function renderButtons() {
  const wrapper = el('div', {});

  // Primary variants (from buttons.css)
  const primaryGroup = el('div', { class: 'sg-button-group' });
  primaryGroup.appendChild(el('span', { class: 'sg-button-group__label' }, 'Core Variants'));
  const primaryRow = el('div', { class: 'sg-button-row' });
  primaryRow.appendChild(el('button', { class: 'btn primary' }, 'Primary'));
  primaryRow.appendChild(el('button', { class: 'btn secondary' }, 'Secondary'));
  primaryRow.appendChild(el('button', { class: 'btn neutral' }, 'Neutral'));
  primaryRow.appendChild(el('button', { class: 'btn outline' }, 'Outline'));
  primaryRow.appendChild(el('button', { class: 'btn success' }, 'Success'));
  primaryRow.appendChild(el('button', { class: 'btn orange' }, 'Orange'));
  primaryGroup.appendChild(primaryRow);
  wrapper.appendChild(primaryGroup);

  // Danger / Destructive
  const dangerGroup = el('div', { class: 'sg-button-group' });
  dangerGroup.appendChild(el('span', { class: 'sg-button-group__label' }, 'Danger / Destructive'));
  const dangerRow = el('div', { class: 'sg-button-row' });
  dangerRow.appendChild(el('button', { class: 'btn subtle-danger' }, 'Subtle Danger'));
  dangerRow.appendChild(
    el('button', { class: 'btn neutral danger-hover' }, 'Neutral Hover Delete'),
  );
  const removeButton = el('button', { class: 'remove-btn', type: 'button' }, '×');
  removeButton.onclick = () => showToast('Remove action clicked');
  dangerRow.appendChild(removeButton);
  dangerGroup.appendChild(dangerRow);
  wrapper.appendChild(dangerGroup);

  // Compact buttons (for tables)
  const compactGroup = el('div', { class: 'sg-button-group' });
  compactGroup.appendChild(
    el('span', { class: 'sg-button-group__label' }, 'Compact / Table Buttons'),
  );
  const compactRow = el('div', { class: 'sg-button-row' });
  const compactAdd = el(
    'button',
    { class: 'compact-add-btn', type: 'button', title: 'Add row' },
    '+',
  );
  compactAdd.onclick = () => showToast('Compact add button clicked');
  compactRow.appendChild(compactAdd);
  compactRow.appendChild(
    el(
      'span',
      { class: 'text-muted fs-14' },
      '.compact-add-btn – circular add button for billing tables',
    ),
  );
  compactGroup.appendChild(compactRow);
  wrapper.appendChild(compactGroup);

  // Disabled / subtle states
  const statesGroup = el('div', { class: 'sg-button-group' });
  statesGroup.appendChild(el('span', { class: 'sg-button-group__label' }, 'States & Sizes'));
  const statesRow = el('div', { class: 'sg-button-row' });
  statesRow.appendChild(el('button', { class: 'btn primary', disabled: true }, 'Disabled Primary'));
  const busyBtn = el('button', { class: 'btn secondary', 'aria-busy': 'true' }, 'Loading...');
  statesRow.appendChild(busyBtn);
  const ghost = el('button', { class: 'btn neutral' }, 'Hover state');
  ghost.onmouseenter = () => ghost.setAttribute('data-demo', 'hover');
  ghost.onmouseleave = () => ghost.removeAttribute('data-demo');
  statesRow.appendChild(ghost);
  const iconOnly = el('button', { class: 'btn outline', 'aria-label': 'Menu button' });
  iconOnly.innerHTML = '<svg width="16" height="16"><use href="#icon-menu"></use></svg>';
  statesRow.appendChild(iconOnly);
  statesGroup.appendChild(statesRow);
  wrapper.appendChild(statesGroup);

  return wrapper;
}

function renderInputs() {
  const grid = el('div', { class: 'sg-input-grid' });

  // Best practices note
  const bestPractices = el('div', {
    class: 'panel',
    style: 'grid-column: 1 / -1; margin-bottom: var(--space-4);',
  });
  bestPractices.appendChild(el('h4', { style: 'margin-top: 0;' }, 'Preferred Input Pattern'));
  bestPractices.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14' },
      'For new forms, use the inputField(), selectField(), and textAreaField() helpers from form-components.js. They produce semantic .form-field → .form-label → .form-input markup with consistent styling, validation states, and accessibility attributes.',
    ),
  );
  bestPractices.appendChild(
    el(
      'code',
      { class: 'sg-code-inline', style: 'display: block; margin-top: 0.5rem;' },
      "import { inputField, selectField, textAreaField } from '@/js/ui/form-components.js'",
    ),
  );
  grid.appendChild(bestPractices);

  const columnLeft = el('div', { class: 'sg-input-column' });
  columnLeft.appendChild(
    inputField({
      label: 'Patient Name',
      placeholder: 'Jane Doe',
      required: true,
      hint: 'Uses inputField helper with required indicator.',
    }),
  );
  columnLeft.appendChild(
    inputField({
      label: 'Phone Number',
      type: 'tel',
      placeholder: '(555) 867-5309',
      hint: 'Supports tel keyboard layouts on mobile.',
    }),
  );
  columnLeft.appendChild(
    textAreaField({
      label: 'Subjective Notes',
      placeholder: 'Patient reports improved sleep and reduced pain...',
      rows: 3,
      maxLength: 240,
      hint: 'Textarea auto-resizes and tracks characters.',
    }),
  );
  const checkboxRow = el('div', { class: 'sg-checkbox-row' });
  checkboxRow.appendChild(buildCheckboxDemo('Send reminder emails', true));
  checkboxRow.appendChild(buildCheckboxDemo('Mark as urgent', false));
  columnLeft.appendChild(checkboxRow);
  grid.appendChild(columnLeft);

  const columnRight = el('div', { class: 'sg-input-column' });
  columnRight.appendChild(
    selectField({
      label: 'Case Template',
      options: [
        { value: 'cervical', label: 'Cervical Strain' },
        { value: 'lumbar', label: 'Lumbar Disc' },
        { value: 'shoulder', label: 'Shoulder Injury' },
      ],
      placeholder: 'Choose a template...',
      value: 'cervical',
    }),
  );
  columnRight.appendChild(
    inputField({
      label: 'Email Address',
      type: 'email',
      placeholder: 'patient@example.com',
      error: 'Example validation messaging.',
    }),
  );

  const customSelectInstance = createCustomSelect({
    placeholder: 'Select billing code...',
    options: [
      { value: '97110', label: '97110 - Therapeutic Exercise' },
      { value: '97112', label: '97112 - Neuromuscular Re-ed' },
      { value: '97530', label: '97530 - Therapeutic Activities' },
    ],
  });
  const customSelectField = el('div', { class: 'form-field form-field--select' });
  customSelectField.appendChild(el('label', { class: 'form-label' }, 'Custom Select (CPT)'));
  customSelectField.appendChild(customSelectInstance.element);
  customSelectField.appendChild(
    el('div', { class: 'form-hint' }, 'Powered by CustomSelect.js with keyboard support.'),
  );
  columnRight.appendChild(customSelectField);
  grid.appendChild(columnRight);

  return grid;
}

function buildCheckboxDemo(labelText, checked) {
  const checkbox = el('input', { type: 'checkbox' });
  if (checked) checkbox.checked = true;
  const label = el('label', { class: 'sg-checkbox-label' }, [checkbox, el('span', {}, labelText)]);
  return label;
}

function renderFeedback() {
  const wrapper = el('div', { class: 'sg-feedback-row' });

  const toastPanel = el('div', { class: 'panel' });
  toastPanel.appendChild(el('h3', {}, 'Toast Notifications'));
  toastPanel.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14' },
      'Use showToast() for transient confirmations or warnings.',
    ),
  );
  const toastButtons = el('div', { class: 'sg-button-row' });
  const successToastBtn = el('button', { class: 'btn success' }, 'Show Success');
  successToastBtn.onclick = () => showToast('Progress saved');
  const warnToastBtn = el('button', { class: 'btn subtle-danger' }, 'Show Warning');
  warnToastBtn.onclick = () => showToast('Example warning toast');
  toastButtons.appendChild(successToastBtn);
  toastButtons.appendChild(warnToastBtn);
  toastPanel.appendChild(toastButtons);
  wrapper.appendChild(toastPanel);

  const statusPanel = el('div', { class: 'panel' });
  statusPanel.appendChild(el('h3', {}, 'Save Status Pills'));
  statusPanel.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14' },
      'Reflect saving state in sticky headers using .save-status-pill.',
    ),
  );
  const pillRow = el('div', { class: 'sg-button-row' });
  const savingPill = el('div', { class: 'save-status-pill' }, [
    el('span', { class: 'dot saving' }),
    el('span', { class: 'text' }, 'Saving draft...'),
  ]);
  const savedPill = el('div', { class: 'save-status-pill' }, [
    el('span', { class: 'dot saved' }),
    el('span', { class: 'text' }, 'All changes saved'),
  ]);
  pillRow.appendChild(savingPill);
  pillRow.appendChild(savedPill);
  statusPanel.appendChild(pillRow);
  wrapper.appendChild(statusPanel);

  // Case progress status badges
  const caseStatusPanel = el('div', { class: 'panel' });
  caseStatusPanel.appendChild(el('h3', {}, 'Case Progress Badges'));
  caseStatusPanel.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14' },
      'Used in cases table to indicate draft progress. Apply .status base class + modifier.',
    ),
  );
  const caseStatusRow = el('div', { class: 'sg-button-row' });
  // Wrap in a mini-table context so the .cases-table scoped styles apply
  const statusTable = el('table', {
    class: 'cases-table',
    style: 'border: none; background: transparent;',
  });
  const statusTr = el('tr');
  const notStartedTd = el('td', {
    style: 'background: transparent; border: none; padding: 0.5rem;',
  });
  notStartedTd.appendChild(el('span', { class: 'status status--not-started' }, 'Not Started'));
  const inProgressTd = el('td', {
    style: 'background: transparent; border: none; padding: 0.5rem;',
  });
  inProgressTd.appendChild(el('span', { class: 'status status--in-progress' }, 'In Progress'));
  const completeTd = el('td', { style: 'background: transparent; border: none; padding: 0.5rem;' });
  completeTd.appendChild(el('span', { class: 'status status--complete' }, 'Complete'));
  statusTr.append(notStartedTd, inProgressTd, completeTd);
  statusTable.appendChild(statusTr);
  caseStatusRow.appendChild(statusTable);
  caseStatusPanel.appendChild(caseStatusRow);
  caseStatusPanel.appendChild(
    el(
      'code',
      { class: 'sg-code-inline', style: 'display: block; margin-top: 0.75rem;' },
      '.status.status--not-started | .status--in-progress | .status--complete',
    ),
  );
  wrapper.appendChild(caseStatusPanel);

  return wrapper;
}

function renderLayoutComponents() {
  const wrapper = el('div', { class: 'sg-layout-components' });

  // Panel component
  const panelSection = el('div', { class: 'panel', style: 'margin-bottom: var(--space-4);' });
  panelSection.appendChild(el('h3', {}, 'Panel (.panel)'));
  panelSection.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14' },
      'A card-like container with background, border, rounded corners, and shadow. Used throughout for grouping content.',
    ),
  );

  // Demo panel
  const demoPanel = el('div', { class: 'panel' });
  demoPanel.appendChild(
    el(
      'p',
      {},
      'This is a .panel element. It provides visual containment for related UI elements.',
    ),
  );
  panelSection.appendChild(demoPanel);

  panelSection.appendChild(
    el(
      'code',
      { class: 'sg-code-inline', style: 'display: block; margin-top: 0.75rem;' },
      '<div class="panel">...</div>',
    ),
  );
  wrapper.appendChild(panelSection);

  // Section titles
  const titlesSection = el('div', { class: 'panel' });
  titlesSection.appendChild(el('h3', {}, 'Section & Subsection Titles'));
  titlesSection.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14' },
      'Standardized headings for major content divisions.',
    ),
  );

  const sectionDemo = el('div', { style: 'padding: var(--space-2) 0;' });
  sectionDemo.appendChild(el('h2', { class: 'section-title' }, '.section-title'));
  sectionDemo.appendChild(el('h3', { class: 'subsection-title' }, '.subsection-title'));
  titlesSection.appendChild(sectionDemo);

  titlesSection.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14', style: 'margin-top: var(--space-2);' },
      'Note: .subsection-title uses a gradient background with --header-gradient-left/right tokens.',
    ),
  );
  wrapper.appendChild(titlesSection);

  return wrapper;
}

function renderIcons() {
  const grid = el('div', { class: 'sg-icon-grid' });
  ICON_NAMES.forEach((name) => {
    const box = el('div', { class: 'sg-icon-box' });
    box.innerHTML = `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
    box.appendChild(el('span', { class: 'sg-icon-box__name' }, name));
    grid.appendChild(box);
  });
  return grid;
}

function renderModals() {
  const launchpad = el('div', { class: 'sg-modal-launchpad' });
  launchpad.appendChild(
    el(
      'p',
      { class: 'sg-modal-launchpad__intro' },
      'Launch each core overlay exactly as it appears in-app. Use these buttons to compare structure, tokens, and motion before refactoring.',
    ),
  );

  // Best practices box
  const bestPractices = el('div', { class: 'panel', style: 'margin-bottom: var(--space-4);' });
  bestPractices.appendChild(el('h4', { style: 'margin-top: 0;' }, 'Modal Overlay Pattern'));
  bestPractices.appendChild(
    el('p', { class: 'text-secondary fs-14' }, 'For new modals, use the combined class pattern:'),
  );
  bestPractices.appendChild(
    el(
      'code',
      { class: 'sg-code-inline', style: 'display: block; margin: 0.5rem 0;' },
      '.modal-overlay.popup-overlay-base',
    ),
  );
  const list = el('ul', {
    class: 'text-secondary fs-14',
    style: 'margin: 0.5rem 0; padding-left: 1.25rem;',
  });
  list.appendChild(
    el('li', {}, '.modal-overlay — fixed positioning, backdrop blur, z-index, centering'),
  );
  list.appendChild(el('li', {}, '.popup-overlay-base — opacity transition with .is-open state'));
  list.appendChild(
    el('li', {}, 'Always add role="dialog" and aria-modal="true" for accessibility'),
  );
  bestPractices.appendChild(list);
  launchpad.appendChild(bestPractices);

  const grid = el('div', { class: 'sg-modal-launchpad__grid' });
  MODAL_VARIANTS.forEach((variant) => grid.appendChild(createModalCard(variant)));
  launchpad.appendChild(grid);

  return launchpad;
}

function createModalCard({ title, description, tags, open }) {
  const card = el('article', { class: 'sg-modal-card' });
  card.appendChild(el('h3', { class: 'sg-modal-card__title' }, title));
  card.appendChild(el('p', { class: 'sg-modal-card__desc' }, description));
  if (Array.isArray(tags) && tags.length) {
    const tagRow = el('div', { class: 'sg-modal-card__tags' });
    tags.forEach((tag) => tagRow.appendChild(el('span', { class: 'sg-chip' }, tag)));
    card.appendChild(tagRow);
  }

  const actions = el('div', { class: 'sg-modal-card__actions' });
  const openBtn = el('button', { class: 'btn primary sg-modal-card__button' }, 'Open Modal Demo');
  openBtn.onclick = () => open?.();
  actions.appendChild(openBtn);
  card.appendChild(actions);

  return card;
}

function showDemoModal(builder) {
  let overlay;
  const handleKeydown = (event) => {
    if (event.key === 'Escape') close();
  };

  const close = () => {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    unlockStyleguideScroll();
    document.removeEventListener('keydown', handleKeydown);
  };

  overlay = builder({ close });
  if (!overlay) return;
  overlay.classList.add('sg-modal-demo-overlay');
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  document.body.appendChild(overlay);
  lockStyleguideScroll();
  document.addEventListener('keydown', handleKeydown);
  requestAnimationFrame(() => focusFirstInteractive(overlay));
}

function focusFirstInteractive(root) {
  if (!root) return;
  const selector =
    'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const target = root.querySelector(selector);
  if (target) target.focus();
}

function openCaseModalDemo() {
  openEditCaseModal(
    {
      title: 'Cervical Strain - Post MVA',
      age: 32,
      sex: 'female',
      dob: '1992-03-15',
      acuity: 'acute',
      modules: [],
    },
    (updated) => {
      showToast(`Demo: Case would be updated`);
    },
  );
}

function openArtifactModalDemo() {
  openAddArtifactModal((module) => {
    showToast(`Demo: Artifact "${module.title}" would be added`);
  });
}

function openSignatureModalDemo() {
  openSignatureDialog({
    onSigned: (signature) => {
      showToast(`Demo: Signed by ${signature.name}`);
    },
  });
}

function openSearchModalDemo() {
  let instance;
  instance = createIcdSearchModal(DEMO_ICD10_CODES, {
    onSelect: ({ code }) => showToast(`Selected ${code}`),
    onClose: () => {
      if (instance?.element.parentNode) instance.element.parentNode.removeChild(instance.element);
      instance = null;
    },
  });
  document.body.appendChild(instance.element);
  instance.open();
}

function renderTables() {
  const wrapper = el('div', { class: 'sg-table-stack' });

  // 1. Composable Table System (NEW)
  const composableSection = el('div');
  composableSection.appendChild(
    el('h3', { class: 'sg-table-section__title' }, 'Composable Table System'),
  );
  composableSection.appendChild(
    el(
      'p',
      { class: 'sg-table-section__desc' },
      'Mix and match: .table--bordered, .table--cells, .table--striped, .table--compact, .table--dividers',
    ),
  );

  const composableTable = el('table', {
    class: 'table table--bordered table--cells table--striped',
  });
  composableTable.innerHTML = `
    <thead>
      <tr>
        <th>Code</th>
        <th>Description</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>T-001</td>
        <td>Bordered + cells + striped</td>
        <td>Active</td>
      </tr>
      <tr>
        <td>T-002</td>
        <td>Uses design tokens</td>
        <td>Complete</td>
      </tr>
      <tr>
        <td>T-003</td>
        <td>Consistent radii & borders</td>
        <td>Pending</td>
      </tr>
    </tbody>
  `;
  composableSection.appendChild(composableTable);
  wrapper.appendChild(composableSection);

  // 2. Standard Table
  const stdSection = el('div');
  stdSection.appendChild(el('h3', { class: 'sg-table-section__title' }, 'Standard Table (.table)'));
  const stdTable = el('table', { class: 'table' });
  stdTable.innerHTML = `
    <thead>
      <tr>
        <th>Header 1</th>
        <th>Header 2</th>
        <th>Header 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Row 1, Cell 1</td>
        <td>Row 1, Cell 2</td>
        <td>Row 1, Cell 3</td>
      </tr>
      <tr>
        <td>Row 2, Cell 1</td>
        <td>Row 2, Cell 2</td>
        <td>Row 2, Cell 3</td>
      </tr>
    </tbody>
  `;
  stdSection.appendChild(stdTable);
  wrapper.appendChild(stdSection);

  // 3. Combined ROM Table
  const romSection = el('div');
  romSection.appendChild(
    el('h3', { class: 'sg-table-section__title' }, 'Combined ROM Table (.combined-rom-table)'),
  );
  const romTable = el('table', {
    class: 'combined-rom-table combined-rom-table--styleguide',
    'data-component': 'combined-rom',
  });
  romTable.innerHTML = `
    <thead class="combined-rom-thead">
      <tr>
        <th class="combined-rom-th motion-col" rowspan="2">Motion</th>
        <th class="combined-rom-th left-group" colspan="2">Left</th>
        <th class="combined-rom-th right-group" colspan="2">Right</th>
      </tr>
      <tr>
        <th class="combined-rom-th sub-header">AROM</th>
        <th class="combined-rom-th sub-header">PROM</th>
        <th class="combined-rom-th sub-header divider-left">AROM</th>
        <th class="combined-rom-th sub-header">PROM</th>
      </tr>
    </thead>
    <tbody class="combined-rom-tbody">
      <tr class="combined-rom-row">
        <td class="combined-rom-td motion-cell">Flexion</td>
        <td class="combined-rom-td input-cell">
          <div class="input-with-suffix">
            <input data-component="combined-rom" data-element="input" type="text" inputmode="numeric" pattern="\\d*" placeholder="0-180" />
          </div>
        </td>
        <td class="combined-rom-td input-cell">
          <div class="input-with-suffix">
            <input data-component="combined-rom" data-element="input" type="text" inputmode="numeric" pattern="\\d*" placeholder="0-180" />
          </div>
        </td>
        <td class="combined-rom-td input-cell divider-left">
          <div class="input-with-suffix">
            <input data-component="combined-rom" data-element="input" type="text" inputmode="numeric" pattern="\\d*" placeholder="0-180" />
          </div>
        </td>
        <td class="combined-rom-td input-cell">
          <div class="input-with-suffix">
            <input data-component="combined-rom" data-element="input" type="text" inputmode="numeric" pattern="\\d*" placeholder="0-180" />
          </div>
        </td>
      </tr>
    </tbody>
  `;
  romSection.appendChild(romTable);
  wrapper.appendChild(romSection);

  // 3. Combined Neuroscreen Table
  const neuroSection = el('div');
  neuroSection.appendChild(
    el(
      'h3',
      { class: 'sg-table-section__title' },
      'Combined Neuroscreen Table (.combined-neuroscreen-table)',
    ),
  );
  const neuroTable = el('table', { class: 'combined-neuroscreen-table' });
  neuroTable.innerHTML = `
    <thead class="combined-neuroscreen-thead">
      <tr>
        <th class="combined-neuroscreen-th level-col">Level</th>
        <th class="combined-neuroscreen-th">Motor</th>
        <th class="combined-neuroscreen-th">Sensory</th>
        <th class="combined-neuroscreen-th">Reflex</th>
      </tr>
    </thead>
    <tbody class="combined-neuroscreen-tbody">
      <tr class="combined-neuroscreen-row">
        <td class="combined-neuroscreen-td level-col">C5</td>
        <td class="combined-neuroscreen-td"><input class="combined-neuroscreen__input" type="text" placeholder="5/5"></td>
        <td class="combined-neuroscreen-td"><input class="combined-neuroscreen__input" type="text" placeholder="Intact"></td>
        <td class="combined-neuroscreen-td"><input class="combined-neuroscreen__input" type="text" placeholder="2+"></td>
      </tr>
      <tr class="combined-neuroscreen-row">
        <td class="combined-neuroscreen-td level-col">C6</td>
        <td class="combined-neuroscreen-td"><input class="combined-neuroscreen__input" type="text" placeholder="5/5"></td>
        <td class="combined-neuroscreen-td"><input class="combined-neuroscreen__input" type="text" placeholder="Intact"></td>
        <td class="combined-neuroscreen-td"><input class="combined-neuroscreen__input" type="text" placeholder="2+"></td>
      </tr>
    </tbody>
  `;
  neuroSection.appendChild(neuroTable);
  wrapper.appendChild(neuroSection);

  // 4. Table-Embedded Custom Select (CPT Codes style)
  const embeddedSection = el('div');
  embeddedSection.appendChild(
    el(
      'h3',
      { class: 'sg-table-section__title' },
      'Table-Embedded Custom Select (CPT Codes style)',
    ),
  );
  embeddedSection.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14 mb-16' },
      'When CustomSelect is inside .combined-neuroscreen-table, it inherits borderless styling.',
    ),
  );

  const embeddedTable = el('table', { class: 'combined-neuroscreen-table' });

  // Header
  const thead = el('thead', { class: 'combined-neuroscreen-thead' });
  const trHead = el('tr');
  trHead.appendChild(el('th', { class: 'combined-neuroscreen-th level-col' }, 'Code Type'));
  trHead.appendChild(el('th', { class: 'combined-neuroscreen-th' }, 'Selection'));
  thead.appendChild(trHead);
  embeddedTable.appendChild(thead);

  // Body
  const tbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

  // CPT Code row
  const trCPT = el('tr', { class: 'combined-neuroscreen-row' });
  trCPT.appendChild(el('td', { class: 'combined-neuroscreen-td level-col' }, 'CPT Code'));
  const cptCell = el('td', { class: 'combined-neuroscreen-td' });
  const cptSelect = createCustomSelect({
    options: [
      { value: '97110', label: '97110 - Therapeutic Exercise' },
      { value: '97112', label: '97112 - Neuromuscular Re-ed' },
      { value: '97140', label: '97140 - Manual Therapy' },
    ],
    placeholder: 'Select CPT Code...',
  });
  cptCell.appendChild(cptSelect.element);
  trCPT.appendChild(cptCell);
  tbody.appendChild(trCPT);

  // ICD-10 row
  const trICD = el('tr', { class: 'combined-neuroscreen-row' });
  trICD.appendChild(el('td', { class: 'combined-neuroscreen-td level-col' }, 'ICD-10'));
  const icdCell = el('td', { class: 'combined-neuroscreen-td' });
  const icdSelect = createCustomSelect({
    options: [
      { value: 'M54.5', label: 'M54.5 - Low Back Pain' },
      { value: 'M54.2', label: 'M54.2 - Cervicalgia' },
      { value: 'S13.4', label: 'S13.4 - Cervical Sprain' },
    ],
    placeholder: 'Select ICD-10...',
  });
  icdCell.appendChild(icdSelect.element);
  trICD.appendChild(icdCell);
  tbody.appendChild(trICD);

  embeddedTable.appendChild(tbody);
  embeddedSection.appendChild(embeddedTable);
  wrapper.appendChild(embeddedSection);

  // 5. Table with Search Input (ICD-10 Billing pattern)
  const searchTableSection = el('div');
  searchTableSection.appendChild(
    el(
      'h3',
      { class: 'sg-table-section__title' },
      'Table with Search Input (Billing ICD-10 pattern)',
    ),
  );
  searchTableSection.appendChild(
    el(
      'p',
      { class: 'text-secondary fs-14 mb-16' },
      'Search input inside table cell with dropdown results. Type to search, arrow keys to navigate, Enter to select.',
    ),
  );

  const searchTable = el('table', {
    class: 'combined-neuroscreen-table combined-neuroscreen-table--compact',
  });

  // Header
  const searchThead = el('thead', { class: 'combined-neuroscreen-thead' });
  const searchHeadRow = el('tr');
  searchHeadRow.appendChild(
    el('th', { class: 'combined-neuroscreen-th level-col' }, 'Diagnosis Codes (ICD-10)'),
  );
  searchHeadRow.appendChild(el('th', { class: 'combined-neuroscreen-th' }, 'Description'));
  searchHeadRow.appendChild(el('th', { class: 'combined-neuroscreen-th action-col' }, 'Action'));
  searchThead.appendChild(searchHeadRow);
  searchTable.appendChild(searchThead);

  // Body with search row (modal trigger)
  const searchTbody = el('tbody', { class: 'combined-neuroscreen-tbody' });

  const searchRow = el('tr', { class: 'combined-neuroscreen-row' });
  const searchCell = el('td', {
    class: 'combined-neuroscreen-td level-col',
    colspan: '2',
  });
  const searchTrigger = el(
    'button',
    { type: 'button', class: 'sg-icd-search-trigger' },
    'Open ICD-10 Search',
  );
  const searchHelper = el(
    'p',
    { class: 'sg-icd-search-helper' },
    'Launch the ICD-10 lookup modal to add a diagnosis code.',
  );
  searchCell.appendChild(searchTrigger);
  searchCell.appendChild(searchHelper);
  searchRow.appendChild(searchCell);

  const searchActionCell = el(
    'td',
    { class: 'combined-neuroscreen-td action-col sg-icd-action-cell' },
    '—',
  );
  searchRow.appendChild(searchActionCell);
  searchTbody.appendChild(searchRow);

  // Example populated row
  const populatedRow = el('tr', { class: 'combined-neuroscreen-row' });
  const selectedCodeCell = el('td', { class: 'combined-neuroscreen-td level-col' }, 'M54.5');
  const selectedDescCell = el('td', { class: 'combined-neuroscreen-td' }, 'Low back pain');
  const actionCell2 = el('td', { class: 'combined-neuroscreen-td action-col' });
  const removeBtn2 = el('button', { type: 'button', class: 'remove-btn' }, '×');
  removeBtn2.onclick = () => showToast('Row would be removed');
  actionCell2.appendChild(removeBtn2);
  populatedRow.appendChild(selectedCodeCell);
  populatedRow.appendChild(selectedDescCell);
  populatedRow.appendChild(actionCell2);
  searchTbody.appendChild(populatedRow);

  searchTable.appendChild(searchTbody);
  searchTableSection.appendChild(searchTable);

  const icdSearchModal = createIcdSearchModal(DEMO_ICD10_CODES, {
    onSelect: ({ code, desc }) => {
      selectedCodeCell.textContent = code;
      selectedDescCell.textContent = desc;
      searchHelper.textContent = `Last selected: ${code} - ${desc}`;
    },
  });
  searchTrigger.onclick = () => icdSearchModal.open();

  // Compact add button
  const addBtn = el(
    'div',
    {
      class: 'compact-add-btn',
      title: 'Add Diagnosis Code',
    },
    '+',
  );
  addBtn.onclick = () => showToast('Would add new search row');
  searchTableSection.appendChild(addBtn);
  searchTableSection.appendChild(icdSearchModal.element);

  wrapper.appendChild(searchTableSection);

  return wrapper;
}

function createIcdSearchModal(data, { onSelect, onClose } = {}) {
  let filteredResults = [];
  let highlightIdx = -1;
  let routeGuardsAttached = false;

  const overlay = el('div', { class: 'sg-modal-overlay', hidden: true });
  const dialog = el('div', { class: 'sg-modal' });
  overlay.appendChild(dialog);

  const header = el('div', { class: 'sg-modal__header' });
  header.appendChild(el('h4', { class: 'sg-modal__title' }, 'Search ICD-10 Codes'));
  const closeBtn = el(
    'button',
    {
      type: 'button',
      class: 'sg-modal__close',
      'aria-label': 'Close ICD-10 search modal',
    },
    '×',
  );
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  dialog.appendChild(
    el(
      'p',
      { class: 'sg-modal__body-help' },
      'Type part of a code or description. Arrow keys move through results, Enter selects.',
    ),
  );

  const searchInput = el('input', {
    type: 'text',
    class: 'sg-modal__search',
    placeholder: 'Search ICD-10 code or description',
  });
  dialog.appendChild(searchInput);

  const resultsWrap = el('div', { class: 'sg-modal__results' });
  const resultsList = el('div', { class: 'sg-modal__results-list' });
  const emptyState = el('div', { class: 'sg-modal__empty' }, 'Start typing to filter codes.');
  resultsWrap.appendChild(resultsList);
  resultsWrap.appendChild(emptyState);
  dialog.appendChild(resultsWrap);

  const resetResults = () => {
    filteredResults = [];
    highlightIdx = -1;
    resultsList.replaceChildren();
    emptyState.hidden = false;
    emptyState.textContent = 'Start typing to filter codes.';
  };

  function attachRouteGuards() {
    if (routeGuardsAttached) return;
    window.addEventListener('hashchange', close);
    window.addEventListener('popstate', close);
    routeGuardsAttached = true;
  }

  function detachRouteGuards() {
    if (!routeGuardsAttached) return;
    window.removeEventListener('hashchange', close);
    window.removeEventListener('popstate', close);
    routeGuardsAttached = false;
  }

  function close() {
    if (!overlay.hidden) {
      overlay.hidden = true;
      unlockStyleguideScroll();
      detachRouteGuards();
    }
    searchInput.value = '';
    resetResults();
    if (typeof onClose === 'function') onClose();
  }

  const syncHighlight = () => {
    Array.from(resultsList.children).forEach((node, idx) => {
      node.classList.toggle('is-active', idx === highlightIdx);
    });
  };

  const handleSelect = (item) => {
    if (!item) return;
    onSelect?.(item);
    showToast(`Selected: ${item.code}`);
    close();
  };

  const renderResults = (query = '') => {
    const normalized = query.trim().toLowerCase();
    filteredResults = !normalized
      ? data
      : data.filter(
          (record) =>
            record.code.toLowerCase().includes(normalized) ||
            record.desc.toLowerCase().includes(normalized),
        );

    resultsList.replaceChildren();
    if (!filteredResults.length) {
      emptyState.hidden = false;
      emptyState.textContent = normalized
        ? 'No matching codes found.'
        : 'Start typing to filter codes.';
      highlightIdx = -1;
      return;
    }

    emptyState.hidden = true;
    highlightIdx = 0;
    filteredResults.forEach((item, idx) => {
      const row = el('button', { class: 'sg-modal__result', type: 'button' });
      row.appendChild(el('span', { class: 'sg-modal__result-code' }, item.code));
      row.appendChild(el('span', { class: 'sg-modal__result-desc' }, item.desc));
      if (idx === highlightIdx) row.classList.add('is-active');
      row.onclick = () => handleSelect(item);
      row.onmouseenter = () => {
        highlightIdx = idx;
        syncHighlight();
      };
      resultsList.appendChild(row);
    });
  };

  const open = () => {
    if (overlay.hidden) {
      overlay.hidden = false;
      lockStyleguideScroll();
      attachRouteGuards();
    }
    renderResults(searchInput.value);
    requestAnimationFrame(() => searchInput.focus());
  };

  searchInput.addEventListener('input', (e) => renderResults(e.target.value));
  searchInput.addEventListener('keydown', (e) => {
    const total = resultsList.children.length;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (!total) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIdx = (highlightIdx + 1) % total;
      syncHighlight();
      resultsList.children[highlightIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIdx = (highlightIdx - 1 + total) % total;
      syncHighlight();
      resultsList.children[highlightIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(filteredResults[highlightIdx]);
    }
  });

  closeBtn.onclick = close;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  return { element: overlay, open, close };
}
