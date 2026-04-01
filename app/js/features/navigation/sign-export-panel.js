// sign-export-panel.js
// Renders the Sign & Export footer action as a lazily-loaded panel.
// Loaded on demand by ChartNavigation to keep main bundle size down.

import { el } from '../../ui/utils.js';
import { safeAsync } from '../../core/async.js';
import { emit } from '../../core/events.js';

/**
 * Render the Sign & Export panel
 * @param {HTMLElement} container target container element
 * @param {Object} options
 * @param {Object} options.caseData current case data (draft-applied upstream when possible)
 */
export function render(container, options = {}) {
  if (!container) return { cleanup() {} };
  const { caseData = {} } = options;

  function mergeDraftOverlays(out, draft) {
    try {
      if (draft.noteTitle) out.title = draft.noteTitle;
    } catch (err) {
      console.warn('[SignExport] merging draft noteTitle:', err);
    }
    try {
      if (draft.snapshot) out.snapshot = { ...(out.snapshot || {}), ...draft.snapshot };
    } catch (err) {
      console.warn('[SignExport] merging draft snapshot:', err);
    }
    try {
      if (draft.meta) out.meta = { ...(out.meta || {}), ...draft.meta };
    } catch (err) {
      console.warn('[SignExport] merging draft meta:', err);
    }
  }

  function coalesce(...values) {
    for (const v of values) {
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  }

  function emitExportCompleted(out, draft) {
    const caseId = coalesce(out?.meta?.caseId, draft?.meta?.caseId, out?.id, draft?.id);
    const encounterId = coalesce(out?.meta?.encounterId, draft?.meta?.encounterId);
    emit('export:completed', { caseId, encounterId, format: 'docx' });

    // Also broadcast globally on window so legacy/vanilla components can close
    window.dispatchEvent(
      new CustomEvent('app:export:completed', { detail: { caseId, encounterId } }),
    );
  }

  async function exportAfterSignature(out, draft) {
    try {
      const { ensureExportLibsLoaded } = await import('../../services/export-loader.js');
      await ensureExportLibsLoaded();
      const { exportToWord } = await import('../../services/document-export.js');
      await exportToWord(out, draft);
      emitExportCompleted(out, draft);
    } catch (e) {
      console.error('Export to Word failed after signing:', e);
      alert('Unable to complete export.');
      throw e;
    }
  }

  function applyPreviewEdits(target, updates) {
    for (const key of Object.keys(updates)) {
      const val = updates[key];
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        target[key] = { ...(target[key] || {}), ...val };
      } else {
        target[key] = val;
      }
    }
  }

  const handleExportClick = safeAsync(async () => {
    const out = caseData || {};
    const draft = (typeof window !== 'undefined' && window.currentDraft) || out || {};
    mergeDraftOverlays(out, draft);

    // Open the preview modal for last-minute review / edits
    const { openNotePreviewModal } = await import('./panels/NotePreviewModal.js');
    openNotePreviewModal({
      caseData: out,
      draft,
      mode: 'sign',
      async onConfirmSign(updates, signature) {
        // Apply preview edits to the live draft
        applyPreviewEdits(draft, updates);
        // Re-merge so `out` reflects changes
        mergeDraftOverlays(out, draft);

        // Handle Signature Integration
        if (signature) {
          out.meta = { ...(out.meta || {}), signature };
          // Persist signature to the in-memory draft so My Notes reflects it
          if (draft && draft !== out) {
            draft.meta = { ...(draft.meta || {}), signature };
          }
        }

        // Clear amendingFrom marker if present (note is now freshly signed)
        if (draft?.meta?.amendingFrom) delete draft.meta.amendingFrom;
        if (out?.meta?.amendingFrom) delete out.meta.amendingFrom;

        // Persist updated draft
        if (typeof window.saveDraft === 'function') {
          try {
            window.saveDraft();
          } catch {
            /* best-effort */
          }
        }

        // Update the status badge to reflect the signed state
        if (typeof window !== 'undefined' && typeof window.updateNoteStatusBadge === 'function') {
          window.updateNoteStatusBadge('signed');
        }
        if (
          typeof window !== 'undefined' &&
          typeof window.saveSignedNoteToCasefile === 'function'
        ) {
          try {
            window.saveSignedNoteToCasefile({
              draft,
              context: {
                caseId: draft?.meta?.caseId || out?.meta?.caseId || out?.id || '',
                encounterId: draft?.meta?.encounterId || out?.meta?.encounterId || '',
                professionId: window.currentEditorContext?.professionId || '',
                templateId: window.currentEditorContext?.templateId || '',
              },
            });
          } catch (err) {
            console.warn('[SignExport] Failed to file signed note to Case File:', err);
          }
        }

        await exportAfterSignature(out, draft);
      },
    });
  });

  const root = el('div', { class: 'sign-export-panel', style: 'margin: 24px 0 8px 0;' }, [
    el(
      'button',
      {
        class: 'btn primary',
        style: 'width:100%;',
        title: 'Sign the evaluation then export to a Word document',
        onClick: handleExportClick,
      },
      'Sign & Export',
    ),
  ]);

  container.replaceChildren(root);
  return {
    cleanup() {
      try {
        // Replace with empty node to drop listeners and DOM
        container.replaceChildren();
      } catch {
        /* element may not exist */
      }
    },
  };
}

// (legacy alias removed)
