// SimpleSectionRenderer.js - Renders Simple SOAP Note sections
// Parallel to SectionRenderer.js but for the stripped-down simple note type

import { el } from '../ui/utils.js';

/**
 * Creates a section wrapper with header and collapsible content.
 * Mirrors createSectionWrapper from SectionRenderer.js.
 * @param {string} sectionId - Section ID
 * @param {string} title - Section title
 * @param {HTMLElement} content - Section content element
 * @returns {Object} { header, wrapper }
 */
function createSimpleSectionWrapper(sectionId, title, content) {
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

  const collapseInner = el('div', { class: 'section-collapse-inner' });
  const collapseWrapper = el('div', {
    class: 'section-collapse-wrapper',
    id: `content-${sectionId}`,
  });
  collapseWrapper.append(collapseInner);
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
 * Renders all simple SOAP sections into the content root.
 * Returns the same shape as renderAllSections for compatibility.
 * @param {HTMLElement} contentRoot - Content container
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Promise<Object>} { sectionRoots, sectionHeaders }
 */
export async function renderAllSimpleSections(contentRoot, draft, save) {
  contentRoot.replaceChildren();

  const { createAllSimpleSections } = await import('../features/soap/SimpleSOAPSection.js');

  const sections = createAllSimpleSections(draft, save);

  const sectionRoots = {};
  const sectionHeaders = {};

  for (const section of sections) {
    const { header, wrapper } = createSimpleSectionWrapper(
      section.id,
      section.title,
      section.content,
    );
    sectionHeaders[section.id] = header;
    sectionRoots[section.id] = wrapper;
    contentRoot.append(wrapper);
  }

  return { sectionRoots, sectionHeaders };
}
