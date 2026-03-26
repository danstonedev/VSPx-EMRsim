/**
 * ActiveNoteIndicator – displays the current note template name
 * in `#patient-header-actions` so the user always knows which note
 * they are editing, regardless of which chart tab is open.
 *
 * Mounted by ChartSidebarOrchestrator alongside NoteStatusBadge.
 * Updated via `window.updateActiveNoteLabel(templateLabel, professionLabel)`.
 */

import { el } from '../../../ui/utils.js';

/**
 * Mount the active-note indicator into the patient header actions area.
 *
 * @param {string} [initialLabel='']     – e.g. "PT Initial Evaluation (SOAP)"
 * @param {string} [initialProfession=''] – e.g. "Physical Therapy"
 * @returns {{ update(label:string, profession:string):void, destroy():void, element:HTMLElement }}
 */
export function mountActiveNoteIndicator(initialLabel = '', initialProfession = '') {
  const professionEl = el('span', { class: 'active-note-indicator__profession' }, '');
  const labelEl = el('span', { class: 'active-note-indicator__label' }, '');
  const dot = document.createTextNode(' \u2022 ');

  const indicator = el(
    'span',
    {
      class: 'active-note-indicator',
      'aria-live': 'polite',
      'aria-label': 'Currently editing',
    },
    [],
  );

  function update(label, profession) {
    if (!label) {
      indicator.style.display = 'none';
      return;
    }
    indicator.style.display = '';
    professionEl.textContent = profession || '';
    labelEl.textContent = label;

    indicator.replaceChildren(
      ...(profession ? [professionEl, dot.cloneNode(), labelEl] : [labelEl]),
    );
    indicator.title = `Currently editing: ${profession ? profession + ' — ' : ''}${label}`;
  }

  update(initialLabel, initialProfession);

  const actions = document.getElementById('patient-header-actions');
  if (actions) {
    // Insert before the status badge (which is prepended) so the
    // layout reads: [Note Label] [Status Badge] [other buttons]
    actions.prepend(indicator);
  }

  return {
    element: indicator,
    update,
    destroy() {
      indicator.remove();
    },
  };
}
