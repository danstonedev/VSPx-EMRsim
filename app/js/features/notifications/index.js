// features/notifications/index.js
// Subscribes to global events and surfaces lightweight UX notifications.

import { on } from '../../core/events.js';
import { showToast } from '../../ui/toast.js';

// Success checkmark icon (inline SVG path minimal)
const checkIcon =
  '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M9 16.2l-3.5-3.6-1.4 1.4L9 19 20 8l-1.4-1.4z"/></svg>';

// Wire once on module load
on('export:completed', (ev) => {
  try {
    const detail = ev.detail || {};
    const fmt = detail.format || 'file';
    const caseText = detail.caseId
      ? ` (Case ${detail.caseId}${detail.encounterId ? ` • ${detail.encounterId}` : ''})`
      : '';
    showToast(`Exported ${fmt.toUpperCase()} successfully${caseText}.`, {
      iconSVG: checkIcon,
      timeoutMs: 3400,
    });
  } catch {
    /* element may not exist */
  }
});
