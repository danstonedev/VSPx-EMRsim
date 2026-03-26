/**
 * NoteStatusBadge – renders a lock/unlock indicator in
 * `#patient-header-actions` showing note lifecycle state.
 *
 * States:
 *   draft     – pencil icon, neutral colour
 *   signed    – lock icon, green badge
 *   amending  – unlock icon, orange badge ("Needs re-sign")
 */

import { el } from '../../../ui/utils.js';

const STATES = {
  draft: {
    icon: 'edit',
    label: 'Draft',
    cls: 'note-status-badge--draft',
    title: 'This note is an unsigned draft',
  },
  signed: {
    icon: 'lock',
    label: 'Signed',
    cls: 'note-status-badge--signed',
    title: 'This note has been signed and locked',
  },
  amending: {
    icon: 'lock_open',
    label: 'Amending',
    cls: 'note-status-badge--amending',
    title: 'Amendment in progress — needs re-signing',
  },
};

const SVG_PATHS = {
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  lock: 'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z',
  lock_open:
    'M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6A5 5 0 0 0 7 6h2a3 3 0 0 1 6 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z',
};

function svgIcon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('note-status-badge__icon');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', SVG_PATHS[name] || '');
  svg.appendChild(path);
  return svg;
}

/**
 * Mount the status badge into the patient header actions area.
 * Call `update(status)` to change state.  Call `destroy()` to remove.
 *
 * @param {string} [initialStatus='draft'] – 'draft' | 'signed' | 'amending'
 * @returns {{ update: (status:string)=>void, destroy: ()=>void, element: HTMLElement }}
 */
export function mountNoteStatusBadge(initialStatus = 'draft') {
  const badge = el('span', { class: 'note-status-badge', 'aria-live': 'polite' });
  let current = '';

  function update(status) {
    const s = STATES[status] || STATES.draft;
    if (status === current) return;
    current = status;

    badge.className = `note-status-badge ${s.cls}`;
    badge.title = s.title;
    badge.replaceChildren(svgIcon(s.icon), document.createTextNode(` ${s.label}`));
  }

  update(initialStatus);

  // Insert into the patient header actions bar
  const actions = document.getElementById('patient-header-actions');
  if (actions) {
    actions.prepend(badge);
  }

  return {
    element: badge,
    update,
    destroy() {
      badge.remove();
    },
  };
}

/**
 * Derive the note status from the current draft object.
 * @param {Object} draft
 * @returns {'draft'|'signed'|'amending'}
 */
export function deriveNoteStatus(draft) {
  if (!draft) return 'draft';
  if (draft.meta?.amendingFrom) return 'amending';
  if (draft.meta?.signature) return 'signed';
  return 'draft';
}
