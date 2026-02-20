// Section rendering utilities for Case Editor
import { el } from '../ui/utils.js';
// SOAP sections loaded dynamically for better code splitting and performance

/**
 * Creates a section wrapper with header and content.
 * Headers are clickable and toggle collapse/expand of the section content
 * using a CSS grid animation for buttery-smooth height transitions.
 *
 * @param {string} sectionId - Section ID
 * @param {string} title - Section title
 * @param {HTMLElement} content - Section content element
 * @param {string} cssClass - CSS class for the content
 * @returns {Object} Section wrapper elements
 */
function createSectionWrapper(sectionId, title, content, cssClass) {
  // Chevron indicator (CSS-only arrow, rotates on collapse)
  const chevron = el('span', { class: 'section-chevron', 'aria-hidden': 'true' });

  const header = el(
    'div',
    {
      id: `section-${sectionId}`,
      class: 'editor-section-divider',
      role: 'button',
      tabindex: '0',
      'aria-expanded': 'true',
      'aria-controls': `content-${sectionId}`,
    },
    [chevron, el('h3', { class: 'section-title' }, title)],
  );

  // Collapsible wrapper using CSS grid rows (1fr → 0fr) for smooth animation
  const collapseInner = el('div', { class: 'section-collapse-inner' });
  const collapseWrapper = el('div', {
    class: 'section-collapse-wrapper',
    id: `content-${sectionId}`,
  });
  collapseWrapper.append(collapseInner);

  if (cssClass) {
    content.classList.add(cssClass);
  }
  collapseInner.append(content);

  const wrapper = el('div', { class: 'editor-section', id: `wrap-${sectionId}` }, [
    header,
    collapseWrapper,
  ]);

  // Toggle collapse/expand
  const toggle = () => {
    const isCollapsed = collapseWrapper.classList.toggle('collapsed');
    header.setAttribute('aria-expanded', String(!isCollapsed));
    header.classList.toggle('section-collapsed', isCollapsed);
  };

  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  return { header, wrapper };
}

/**
 * Creates the subjective section with wrapper (dynamically loaded)
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} Section elements
 */
async function createSubjectiveSectionWithWrapper(draft, save) {
  const { createSubjectiveSection } =
    await import('../features/soap/subjective/SubjectiveSection.js');

  const content = createSubjectiveSection(draft.subjective, (data) => {
    draft.subjective = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('subjective', 'Subjective', content, 'subjective-section');
}

/**
 * Creates the objective section with wrapper (dynamically loaded)
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} Section elements
 */
async function createObjectiveSectionWithWrapper(draft, save) {
  const { createObjectiveSection } = await import('../features/soap/objective/ObjectiveSection.js');

  const content = createObjectiveSection(draft.objective, (data) => {
    draft.objective = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('objective', 'Objective', content, 'objective-section');
}

/**
 * Creates the assessment section with wrapper (dynamically loaded)
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} Section elements
 */
async function createAssessmentSectionWithWrapper(draft, save) {
  const { createAssessmentSection } =
    await import('../features/soap/assessment/AssessmentSection.js');

  const content = createAssessmentSection(draft.assessment, (data) => {
    draft.assessment = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('assessment', 'Assessment', content, 'assessment-section');
}

/**
 * Creates the plan section with wrapper (dynamically loaded)
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} Section elements
 */
async function createPlanSectionWithWrapper(draft, save) {
  const { createPlanSection } = await import('../features/soap/plan/PlanMain.js');

  const content = createPlanSection(draft.plan, (data) => {
    draft.plan = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('plan', 'Plan', content, 'plan-section');
}

/**
 * Creates the billing section with wrapper (dynamically loaded)
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} Section elements
 */
async function createBillingSectionWithWrapper(draft, save) {
  const { createBillingSection } = await import('../features/soap/billing/BillingSection.js');

  const content = createBillingSection(draft.billing, (data) => {
    draft.billing = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('billing', 'Billing', content, 'billing-section');
}

/**
 * Renders all sections into the content root (async for dynamic loading)
 * @param {HTMLElement} contentRoot - Content container
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} Section roots and headers for reference
 */
export async function renderAllSections(contentRoot, draft, save) {
  contentRoot.replaceChildren();

  const sectionRoots = {};
  const sectionHeaders = {};

  // Create all sections
  const sections = [
    { id: 'subjective', creator: createSubjectiveSectionWithWrapper },
    { id: 'objective', creator: createObjectiveSectionWithWrapper },
    { id: 'assessment', creator: createAssessmentSectionWithWrapper },
    { id: 'plan', creator: createPlanSectionWithWrapper },
    { id: 'billing', creator: createBillingSectionWithWrapper },
  ];

  // Load all sections in parallel for better performance
  const sectionPromises = sections.map(async (section) => {
    const { header, wrapper } = await section.creator(draft, save);
    return { id: section.id, header, wrapper };
  });

  const results = await Promise.all(sectionPromises);

  // Add sections to DOM and collect references
  for (const result of results) {
    sectionHeaders[result.id] = result.header;
    sectionRoots[result.id] = result.wrapper;
    contentRoot.append(result.wrapper);
  }

  return { sectionRoots, sectionHeaders };
}

/**
 * Gets section root by ID
 * @param {Object} sectionRoots - Section roots object
 * @param {string} id - Section ID
 * @returns {HTMLElement|null} Section root element
 */
export function getSectionRoot(sectionRoots, id) {
  return sectionRoots[id] || null;
}

/**
 * Gets section header by ID
 * @param {Object} sectionHeaders - Section headers object
 * @param {string} id - Section ID
 * @returns {HTMLElement|null} Section header element
 */
export function getSectionHeader(sectionHeaders, id) {
  return sectionHeaders[id] || null;
}
